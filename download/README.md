# 安装包放这里 / Put the installer here

把打包好的 Windows 安装包放进本目录，例如 `Mirror_Setup.exe`。
构建命令：`pnpm tauri build`（产物在 `src-tauri/target/release/bundle/` 下）。

然后确认 `site/index.html` 顶部脚本里的下载地址与文件名一致：

```js
var DOWNLOAD_URL = "download/Mirror_Setup.exe";
var APP_VERSION  = "0.1.x";
```

- 若把 `DOWNLOAD_URL` 设为空字符串 `""`，页面会显示「即将上线」。
- 单文件上限 100MB；Tauri 安装包通常远小于此，直接提交到仓库即可被 Pages 公开分发。

---

Drop the built Windows installer (e.g. `Mirror_Setup.exe`) into this folder, then make sure
`DOWNLOAD_URL` in `site/index.html` matches its filename. Files here are served publicly by
GitHub Pages even when the source repository is private.
