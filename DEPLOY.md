# 部署手册 / Deploy

魔镜官网是**纯静态站点**（就是这个 git 仓库本身）。部署 = 克隆仓库 → nginx 托管 → 配 HTTPS。
更新 = 在服务器上 `git pull`。可同时部署在多台服务器。

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
    location ~* \.(css|js|png|ico|jpg|jpeg|svg|webp|woff2?)$ {
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
    location ~* \.(css|js|png|ico|jpg|jpeg|svg|webp|woff2?)$ {
        expires 30d; add_header Cache-Control "public, max-age=2592000"; access_log off;
    }
    location ~* \.html?$ { add_header Cache-Control "no-cache"; }
}
```
`sudo nginx -t && sudo systemctl reload nginx`。

> 香港服务器无需上面这套：`sudo certbot --nginx -d mirror.kalandraeye.com`（HTTP-01）会**自动**写好 443 配置并自动续期。DNS-01 的坑只发生在大陆那台。

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
