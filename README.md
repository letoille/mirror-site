<p align="center">
  <img src="assets/logo.png" width="88" alt="魔镜 Mirror" />
</p>

<h1 align="center">魔镜 · Mirror — Landing Page</h1>

<p align="center">
  《流放之路 2》桌面悬浮窗助手的官方介绍与下载页<br>
  Landing &amp; download page for <b>Mirror</b>, a Path of Exile 2 desktop overlay.
</p>

<p align="center">
  🔗 <b><a href="https://YOUR_USERNAME.github.io/mirror-site/">在线访问 / Live site</a></b>
</p>

---

## 这是什么 / What is this

这是「魔镜 / Mirror」这款 POE2 悬浮窗工具的**介绍与下载页面**（纯静态站点）。
应用本体的源码保存在独立的私有仓库中；本仓库只包含公开的宣传页面与安装包。

This repository hosts the **landing & download page** for Mirror, a POE2 overlay tool.
The app's own source lives in a separate private repository — only the public page and
installer are kept here.

## 目录结构 / Layout

```
index.html      单文件落地页（中英双语，无外部依赖）
assets/         logo / 图标 / 截图
download/       Windows 安装包放这里
.nojekyll       让 GitHub Pages 按纯静态站点处理
```

## 本地预览 / Preview

直接用浏览器打开 `index.html` 即可，无需构建或服务器。
Just open `index.html` in a browser — no build step, no server.

## 部署到 GitHub Pages / Deploy

1. 把本仓库设为 **public**。
2. **Settings → Pages → Source** 选 **Deploy from a branch**，分支选 `main`，目录选 `/ (root)`。
3. 等待几分钟，站点会发布到 `https://<用户名>.github.io/<仓库名>/`。

## 更新安装包 / Update the installer

1. 在应用仓库执行 `pnpm tauri build`，得到 Windows 安装包。
2. 把安装包（如 `Mirror_Setup.exe`）放进 [`download/`](download/)。
3. 确认 `index.html` 顶部脚本里的下载地址与版本号：

   ```js
   var DOWNLOAD_URL = "download/Mirror_Setup.exe"; // 设为 "" 显示「即将上线」
   var APP_VERSION  = "0.1.x";
   ```

4. 提交并推送，Pages 会自动更新。

> 单文件上限 100MB；Tauri 安装包通常远小于此，可直接提交到仓库由 Pages 公开分发。

## 免责声明 / Disclaimer

本工具为非官方第三方助手，与 Grinding Gear Games 无隶属或背书关系。
Unofficial third-party tool, not affiliated with or endorsed by Grinding Gear Games.
