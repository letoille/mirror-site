# 部署手册 / Deploy

魔镜官网是**纯静态站点**（就是这个 git 仓库本身）。部署 = 克隆仓库 → nginx 托管 → 配 HTTPS。
更新 = 在服务器上 `git pull`。可同时部署在多台服务器。

> ⚠️ **仓库现在有构建，但服务器上不跑它。** 页面由 `node build.mjs` 从 `src/pages/**`
> 生成，**产物跟源码一起提交** —— 正是为了让这一节写的东西一个字都不用改：服务器不装
> node，nginx 不动，更新还是 `git pull`。
>
> 代价是作者必须记得 `pnpm build` 之后再提交。**判据**：`git status` 里只有 `src/` 的
> 改动而根下的 `.html` 没跟着动，就是忘了构建 —— 那种情况下 `git pull` 拉过去的是旧页面，
> 而仓库看起来完全正常。

> ⚠️ **备案要求**：`mirror.kalandraeye.com` 的 DNS 必须解析到**已备案的大陆服务器 IP**，
> 否则接入核查通不过。海外服务器（香港）只能作为**备份 / 分区解析的海外线路**，不能是国内主线路。

---

## 服务器清单

| 角色 | 位置 | 用途 |
|---|---|---|
| **备案服务器** | 中国大陆（备案 IP） | **国内主线路**，域名解析指向它 |
| 香港服务器 | 香港 | 备份 / 海外线路（免备案） |

两台都从 GitHub 拉同一个仓库，内容一致。

---

## 一、在新服务器上首次部署

以 Ubuntu/Debian + 一个有 sudo 权限的用户为例（与香港服务器同约定，站点根目录 `/var/www/mirror-site`）。

```bash
# 1) 安装 nginx / git / certbot
sudo apt update
sudo apt install -y nginx git certbot python3-certbot-nginx

# 2) 克隆站点
sudo mkdir -p /var/www/mirror-site
sudo chown -R "$USER":"$USER" /var/www/mirror-site
git clone https://github.com/letoille/mirror-site.git /var/www/mirror-site

# 3) 写 nginx 配置
sudo tee /etc/nginx/sites-available/mirror-site >/dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name mirror.kalandraeye.com;
    root /var/www/mirror-site;
    index index.html;

    # 压缩（HTML 默认已压；css/js/svg 要显式加）
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types text/css application/javascript application/json image/svg+xml application/xml;

    location / { try_files $uri $uri/ =404; }

    # 静态资源长缓存
    location ~* \.(css|js|png|ico|jpg|jpeg|svg|webp|avif|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
        access_log off;
    }
    # HTML 不长缓存，保证改动及时生效
    location ~* \.html?$ { add_header Cache-Control "no-cache"; }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/mirror-site /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4) 配 HTTPS —— 必须在 DNS 已指向这台服务器之后再执行（certbot 要验证域名）
sudo certbot --nginx -d mirror.kalandraeye.com
#   certbot 会自动改成 listen 443 ssl 并加证书；确认那行带上 http2：
#   listen 443 ssl http2;   （nginx 1.24 用这种写法）然后 sudo nginx -t && sudo systemctl reload nginx
```

---

## 二、DNS 分区解析（DNSPod）+ 证书

DNS 托管在 **DNSPod（腾讯云）**，免费套餐即支持「境内 / 境外 / 默认」线路。

### 记录配置（两条就够）

| 主机记录 | 类型 | 线路 | 记录值 | 说明 |
|---|---|---|---|---|
| `mirror` | A | 默认 | `<备案服务器IP>` | 兜底 + 国内（国内无单独记录时走默认） |
| `mirror` | A | 境外 | `<香港服务器IP>` | 海外用户 |

> 现在 `mirror` 的默认记录指向香港——**把它的值改成备案服务器 IP**，再新增一条「境外」→ 香港 IP。
> 结果：国内/默认 → 备案（大陆、合规），境外 → 香港（快）。TTL 先设 600s 方便回滚。

### 证书：大陆服务器必须用 DNS-01

Let's Encrypt 的验证服务器在海外，分区解析下海外解析到**香港**。所以：

- **香港服务器**：`sudo certbot --nginx -d mirror.kalandraeye.com`（HTTP-01）正常——海外正好解析到它。
- **大陆服务器**：HTTP-01 会**失败**（海外验证解析到香港，够不着大陆）。改用 **DNS-01**（加 TXT 记录，跟地域路由无关）。

三种做法，任选：

1. **DNSPod 插件自动签 + 自动续期（推荐）**
   ```bash
   sudo apt install -y python3-pip
   sudo pip3 install certbot-dns-dnspod           # 或腾讯云官方 certbot-dns-tencentcloud（API v3）
   # DNSPod Token：控制台 → 用户中心 → API密钥 → DNSPod Token → 创建，拿到 ID + Token
   sudo mkdir -p /root/.secrets
   printf 'dns_dnspod_api_id = <ID>\ndns_dnspod_api_token = <Token>\n' | sudo tee /root/.secrets/dnspod.ini
   sudo chmod 600 /root/.secrets/dnspod.ini
   sudo certbot certonly --authenticator dns-dnspod \
     --dns-dnspod-credentials /root/.secrets/dnspod.ini -d mirror.kalandraeye.com
   # 具体参数名以所装插件的文档为准；之后在 nginx 手动引用 /etc/letsencrypt/live/... 证书
   ```
2. **手动 DNS-01**（无需装插件，但续期也要手动，不适合长期）
   ```bash
   sudo certbot certonly --manual --preferred-challenges dns -d mirror.kalandraeye.com
   # 按提示在 DNSPod 加一条 _acme-challenge TXT 记录，再回车继续
   ```
3. **在香港签、拷到大陆**（不碰 API）：证书绑域名不绑 IP，同域名通用。香港 `certbot --nginx` 签好后，
   把 `/etc/letsencrypt/` 打包拷到大陆服务器；续期后再同步一次（可用 renewal 钩子 rsync）。

### nginx 引用证书（certonly / acme.sh 后手动加）

`certbot certonly` 与 `acme.sh` 都**不改 nginx**，签好证书后手动加 443 块并把 80 跳转到 443：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name mirror.kalandraeye.com;
    return 301 https://$host$request_uri;          # HTTP 一律跳 HTTPS
}
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mirror.kalandraeye.com;
    root /var/www/mirror-site;
    index index.html;

    # certbot 路径；用 acme.sh 装的话改成 /etc/nginx/ssl/mirror.crt 与 .key
    ssl_certificate     /etc/letsencrypt/live/mirror.kalandraeye.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mirror.kalandraeye.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    gzip on; gzip_vary on; gzip_comp_level 6; gzip_min_length 256;
    gzip_types text/css application/javascript application/json image/svg+xml application/xml;

    location / { try_files $uri $uri/ =404; }
    location ~* \.(css|js|png|ico|jpg|jpeg|svg|webp|avif|woff2?)$ {
        expires 30d; add_header Cache-Control "public, max-age=2592000"; access_log off;
    }
    location ~* \.html?$ { add_header Cache-Control "no-cache"; }
}
```
`sudo nginx -t && sudo systemctl reload nginx`。

> 香港服务器无需上面这套：`sudo certbot --nginx -d mirror.kalandraeye.com`（HTTP-01）会**自动**写好 443 配置并自动续期。DNS-01 的坑只发生在大陆那台。

### 静态资源的缓存与指纹

`assets/*.css` 和 `*.js` 由构建加上内容指纹（`site.css?v=8f37b226bb`），指纹随字节变。

⚠️ **别把这一段去掉换成"改完清一次 CDN"。** nginx 给 `assets/` 配的是 `expires 30d`，
而文件名是固定的——老访客手里会出现「HTML 是新的、CSS 是旧的」这种组合，最长一个月。
它的故障样子很吓人（新标记拿不到新样式，带 `width` 属性的图按原始尺寸把栅格顶爆）
却完全不报错，开发时一次硬刷新就看不见了。

### 国内那台不要直连 GitHub —— 香港当跳板

国内服务器 `git pull` 慢，根因是仓库大（`.git` 257 MB，工作区 342 MB，其中 63 MB 是
一个没人下的安装包、17 MB 是改版后已弃用的演示视频）叠上跨境链路。

做法：**GitHub → 香港（海外，快）→ rsync → 国内（只传变化的字节）**。国内那台因此
完全不碰 GitHub，连 git 都不用装。

目标主机认的是香港那台 `~/.ssh/config` 里的别名，默认 **`tx-gz`** —— 用户名、端口、
密钥都归 ssh config 管，脚本里不再重复一遍（重复的那份迟早和 ssh config 对不上）。

一次性准备（在**香港**那台上，`tx-gz` 已经配好的话只剩建目录这一步）：

```bash
ssh tx-gz true                                 # 通不了就先修 ~/.ssh/config
ssh tx-gz 'sudo mkdir -p /var/www/mirror-kalandraeye && \
           sudo chown $USER /var/www/mirror-kalandraeye'
```

此后每次发布（在**香港**那台上）：

```bash
cd /var/www/mirror-kalandraeye
scripts/deploy-cn.sh --dry-run    # 先看要传什么
scripts/deploy-cn.sh
```

换目标就 `DST=<别的别名> scripts/deploy-cn.sh`。

脚本自己会先 `git pull --ff-only`，所以香港和国内一步到位。

⚠️ **脚本分三趟传，顺序是有意的**：先资源、再 HTML、最后才 `--delete` 清理。
HTML 里写的是带指纹的资源地址（`site.css?v=<hash>`），HTML 先到而资源没到的那一刻，
访客拿到的是一份指向 404 的页面 —— 样式全丢，和站点挂了长得一模一样。

⚠️ **`--delete` 配上写错的目标路径 = 清空别人的目录。** 脚本里挡了几个明显危险的
值（`/`、`/var/www`、空），但那只是兜底，`DST_PATH` 仍然要自己核对。

⚠️ **国内那台从此不是 git 仓库了**（rsync 排除了 `.git`）。别再在上面 `git pull` ——
两套更新机制并存，迟早对不上。

第一次同步会传 80 MB 左右（那个安装包和演示视频还在仓库里），之后每次只有几十 KB。
要根治就把它们从仓库删掉：下载页链的是 GitHub Releases，不是 `/download/` 里那份；
`demos/` 在改版换成 `<picture>` 之后已经没有任何构建产物在引用。

### 接入搜索引擎索引

已经就位的：`robots.txt`、`sitemap.xml`（27 条，构建时生成）、逐页 canonical 与
hreflang、首页与指南页的 JSON-LD。要做的是**在三家后台认领这个站**。

**验证码填在 `src/site.mjs` 的 `VERIFY` 里，不要手改产物** —— 产物是 `build.mjs`
生成的，手改的 meta 下一次构建就没了，而「验证掉了」的表现是后台里那个站点悄悄
变回未验证，不会有人通知你。填完 `pnpm build` 再发布。

| | 后台 | 拿验证码的位置 | 提交 sitemap |
|---|---|---|---|
| Google | Search Console | 网址前缀 → HTML 标记 | 站点地图 → 填 `sitemap.xml` |
| Bing | Bing 网站管理员工具 | HTML Meta 标记 | 站点地图 → 提交。也可直接从 Search Console 导入，验证和 sitemap 一起过来 |
| 百度 | 搜索资源平台 | 站点验证 → HTML 标签验证 | 资源提交 → sitemap |

⚠️ **百度要求域名已备案**，这个站有（`滇ICP备2025052314号-2`）。没备案的域名在百度
这边不是收录慢，是根本进不去。

⚠️ **爬虫拿到的永远是简中那一份** —— nginx 的按语言分流把已知爬虫排除在外（见上一节），
所以裸路径那批 URL 抓得到，`/en/`、`/tw/` 由 hreflang 指过去。**别为了「方便」把爬虫
也跳转了**，那会让裸路径那批已收录的 URL 从索引里掉出来。

#### 主动推送（可选，但百度和 Bing 明显更快）

```bash
BAIDU_TOKEN=<搜索资源平台给的 token> node scripts/ping-index.mjs
node scripts/ping-index.mjs --dry-run     # 先看看会推什么
```

- **IndexNow**（Bing / Yandex）零配置：密钥就是仓库根下那个 `<key>.txt` 的文件名。
  **它不是秘密**，协议要求它能被公开取到，用途只是证明「发推送的人控制着这个域名」。
  ⚠️ 那个文件**必须跟着站点一起发布**，删了推送就 422。
- **百度 token 是秘密**，只走环境变量，别写进仓库。
- ⚠️ **Google 没有这种接口**。Indexing API 只收招聘和直播两类结构化数据，拿它推普通
  网页会被忽略；Google 那边靠 sitemap，急着要的单页在 Search Console 用「请求编入索引」。

### 三种语言的地址

站点现在出三份：简中在裸路径（`/`、`/client.html`、`/guide/market.html`），英文在 `/en/`，
繁中在 `/tw/`。**nginx 不用为此加任何规则** —— 它们就是磁盘上的目录，
`location / { try_files $uri $uri/ =404; }` 加 `index index.html` 已经够了：
`/en/` 落到 `en/index.html`，`/en` 由 nginx 自己 301 到 `/en/`。

### 裸根按浏览器语言分流（为海外用户）

海外访客直接打开 `mirror.kalandraeye.com` 会拿到简中。这一段让 nginx **只把裸根
`/` 302 到对应语言**，其余地址一概不动。

`map` 只能在 `http` 级，所以单独放一个文件：**`/etc/nginx/conf.d/mirror-lang.conf`**

```nginx
# Accept-Language 的首选语言 → 该去哪个前缀（空 = 简中，留在裸路径）
map $http_accept_language $lang_pref {
    default                   "/en";   # 既不是中文也不是英文：英文版更可能读得懂
    "~*^zh-(hant|tw|hk|mo)"   "/tw";
    "~*^zh"                   "";
    "~*^en"                   "/en";
}

# 用户做过选择就按他选的来。这枚 cookie 由 assets/shell.js 写：
# 点顶部提示条的「切换」、点它的 ×、或用导航栏的语言切换器，都算做出了选择。
# ⚠️ 它不只是「别再跳了」—— 选过繁中的人回到裸根，要送去 /tw/ 而不是发简中。
map $cookie_mirror_lang $lang_cookie {
    default "";      # 没选过
    "zh"    "-";     # 明确选了简中：留在裸路径，且别再按 Accept-Language 猜
    "tw"    "/tw";
    "en"    "/en";
}

# ⚠️ **爬虫不跳。** 不是为了给它们看别的东西（内容一字不差，也不是 cloaking），
#    而是 Googlebot 抓取时带的是 `Accept-Language: en` —— 跳转会让它再也抓不到
#    裸路径那几页，而那正是已经被收录的一批 URL。hreflang 已经把三份的对应关系
#    告诉它了，它自己会挑对的那份给对的人。
map $http_user_agent $lang_bot {
    default "";
    "~*(googlebot|bingbot|baiduspider|yandexbot|duckduckbot|slurp|sogou|360spider|bytespider|applebot|petalbot|ahrefsbot|semrushbot)" "bot";
}

# 拼起来定最终去向。两条规则按顺序试，第一条命中为准：
#   ①「cookie 说了算」—— 选过就照选的走，不再看 Accept-Language
#   ②「没选过、又不是爬虫」—— 才轮到 Accept-Language
# 其余一律落 default（空）= 原样发简中。
map "$lang_cookie|$lang_bot$lang_pref" $lang_go {
    default             "";
    "~^(/en|/tw)\|"     $1;
    "~^\|(/en|/tw)$"    $1;
}
```

`server {}` **里面**，放在 `location / {}` 之前：

```nginx
# ⚠️ 必须是 `location = /`（精确匹配）—— 它的优先级高于所有前缀和正则 location。
# ⚠️ `Vary` 不能省：同一个 `/` 会按语言和 cookie 给出不同答复，
#    少了它，CDN 会把第一个访客拿到的那份 302 发给所有人。
# ⚠️ `add_header` 在 `if` 里外**各写一份**：`if` 里的 `return` 由 rewrite 模块
#    直接出响应，拿不到 location 级的 `add_header` —— 少写就是 302 上没有 `Vary`，
#    而那恰恰是最需要它的那个响应。
location = / {
    if ($lang_go) {
        add_header Vary "Accept-Language, Cookie" always;
        return 302 $lang_go/;
    }
    add_header Vary "Accept-Language, Cookie" always;
    add_header Cache-Control "no-cache" always;
    try_files /index.html =404;
}
```

⚠️ **只跳裸根，不跳深链。** 别人分享的 `/en/client.html` 要原样打开 —— 按语言把它
改道，等于把分享出去的链接变成一件不可预测的事。深层页面由页面顶部那条提示条负责
（`shell.js` 的 `langHint`），它**只提示不跳转**。

⚠️ **302 不是 301。** 这个答复取决于请求头，不是这个地址永久搬走了；发 301 会被
浏览器和 CDN 永久记住，用户此后再也回不到裸根。

验证（海外那台）：

```bash
H=https://mirror.kalandraeye.com
curl -sI -H 'Accept-Language: en-US'  $H/ | head -3   # → 302 /en/
curl -sI -H 'Accept-Language: zh-TW'  $H/ | head -3   # → 302 /tw/
curl -sI -H 'Accept-Language: zh-CN'  $H/ | head -3   # → 200
curl -sI -H 'Accept-Language: ja-JP'  $H/ | head -3   # → 302 /en/
curl -sI -H 'Accept-Language: en-US' -H 'Cookie: mirror_lang=zh' $H/ | head -3   # → 200（选过了）
curl -sI -H 'Accept-Language: en-US' -A 'Googlebot/2.1' $H/ | head -3            # → 200（爬虫不跳）
curl -sI -H 'Accept-Language: zh-CN'  $H/en/client.html | head -3                # → 200（深链不动）
```

验证（三条都该是 200）：

```bash
for p in / /en/ /tw/ /client.html /en/client.html /tw/guide/market.html; do
  printf '%-26s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' https://mirror.kalandraeye.com$p)"
done
```

### 上线顺序（避免国内白屏）

1. 大陆服务器先装好 nginx + 克隆站点（此时 DNS 还指香港，只能用 IP 测）。
2. 大陆服务器用 **DNS-01** 签好证书、配好 HTTPS（DNS-01 不需要域名先指过来）。
3. `curl --resolve mirror.kalandraeye.com:443:<备案IP> https://mirror.kalandraeye.com/` 直连测大陆这台 OK。
4. 再去 DNSPod 改记录：**默认 → 备案IP**，**新增 境外 → 香港IP**。
5. 验证：国内命中大陆、境外命中香港（见第四节 `--resolve` 测法）。

---

## 三、更新流程（两台都一样）

```bash
cd /var/www/mirror-site && sudo git pull
```

`git push` 到 GitHub 后，在**每台**服务器各拉一次即可。也可用 GitHub Actions 自动
`rsync`/SSH 部署（工作流 `.github/` 已备但未启用，需要配 SSH secrets + 每台服务器的
`SITE_PATH`）。

---

## 四、验证

```bash
# 换成对应服务器 IP 直连测（--resolve 绕过 DNS）
curl -I --resolve mirror.kalandraeye.com:443:<服务器IP> https://mirror.kalandraeye.com/
curl -I --resolve mirror.kalandraeye.com:443:<服务器IP> https://mirror.kalandraeye.com/download.html
```

关注：`HTTP/2 200`、CSS/JS 带 `Content-Encoding: gzip` 与 `Cache-Control`、页脚备案号可点。
