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

## 二、DNS 切换（备案合规的关键一步）

在域名解析处，把 `mirror.kalandraeye.com` 的 **A 记录指向备案服务器 IP**。两种做法：

- **简单**：单条 A 记录 → 备案（大陆）服务器。国内外都走它。
- **分区解析（可选）**：国内线路 → 备案服务器；境外/默认线路 → 香港服务器。国内合规、海外更快。

> certbot 申请证书走 HTTP-01 校验，**要求域名当时已解析到该服务器**。
> 所以顺序是：先切 DNS → 等生效 → 再在该服务器上跑 certbot。
> 若要零停机，可先用 DNS-01 方式签好证再切，麻烦一些，一般不必。

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
