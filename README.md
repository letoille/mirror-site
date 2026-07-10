<p align="center">
  <img src="assets/logo.png" width="88" alt="魔镜 Mirror" />
</p>

<h1 align="center">魔镜 · Mirror — Landing Page</h1>

<p align="center">
  《流放之路 2》桌面悬浮窗助手的官方介绍与下载页<br>
  Landing &amp; download page for <b>Mirror</b>, a Path of Exile 2 desktop overlay.
</p>

<p align="center">
  🔗 <b><a href="https://mirror.kalandraeye.com/">在线访问 / Live site</a></b> ·
  📐 <a href="DESIGN.md">设计文档 / Design doc</a>
</p>

---

## 这是什么 / What is this

「魔镜 / Mirror」这款 POE2 悬浮窗工具的**介绍与下载页**——一个纯静态站点（中英双语、无构建、无框架、无外部依赖）。应用本体的源码在独立的私有仓库；本仓库只有公开的宣传页与安装包。

The **landing & download page** for Mirror, a POE2 overlay tool. A single-file static site — bilingual, no build step, no framework, no external dependencies. The app's own source lives in a separate private repo.

## 目录结构 / Layout

```
index.html            落地页（中英双语，全部内联 CSS/JS）
assets/               logo / 图标 / 货币图标 / 截图
download/             Windows 安装包（Mirror_setup.zip）
demos/                功能演示视频（<功能>_<语言>.mp4/webm，见 DESIGN.md）
preview/              动效原型（早期设计验证页，noindex）
robots.txt sitemap.xml   SEO
CNAME .nojekyll       GitHub Pages 兼容（现主力托管在自有服务器，见下）
.github/workflows/    自动部署工作流
DESIGN.md             整站设计文档
```

## 本地预览 / Preview

直接用浏览器打开 `index.html` 即可，无需构建或服务器。
Just open `index.html` in a browser — no build, no server.

## 托管与部署 / Hosting &amp; deploy

**主力托管**：自有**香港服务器**（nginx，免备案、国内可访问），域名 `mirror.kalandraeye.com`。
GitHub Pages 因 github.io 国内访问不稳，仅作**海外备份**。

Primary hosting is a **Hong Kong server** (nginx) at `mirror.kalandraeye.com` — reachable from mainland China without ICP filing. GitHub Pages is kept only as an overseas backup.

**更新流程 / Update flow**：`git push` → GitHub Actions（[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)）通过 SSH `rsync` 同步到服务器 nginx 目录。

需要的仓库 Secrets（与 kaleye 仓库同约定）：
`SSH_HOST` · `SSH_USER` · `SSH_KEY` · `SSH_PORT`（可选）· `SITE_PATH`（如 `/var/www/mirror-site`）。

手动更新（服务器上）：`cd /var/www/mirror-site && git pull`。

## 更新安装包 / Update the installer

1. 在应用仓库执行 `pnpm tauri build`，把产物打包成 `Mirror_setup.zip`。
2. 放进 [`download/`](download/)。
3. 确认 `index.html` 顶部的下载地址一致：
   ```js
   var DOWNLOAD_URL = "download/Mirror_setup.zip"; // 设为 "" 显示「即将上线」
   ```
4. `git push`，自动部署到服务器。

> 建议文件名带版本号（`Mirror_setup_0.1.5.zip`），GA4 可按文件名区分各版本下载量。

## 商标 / Trademark

Path of Exile 2 是其各自所有者的商标。本项目为非官方粉丝工具。
Path of Exile 2 is a trademark of its respective owners. This is an unofficial fan-made tool.
