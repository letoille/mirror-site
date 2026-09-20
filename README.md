<p align="center">
  <img src="assets/logo.png" width="88" alt="魔镜 Mirror" />
</p>

<h1 align="center">魔镜 · Mirror — 官网</h1>

<p align="center">
  《流放之路》1 &amp; 2（POE1 · POE2）<b>魔镜客户端</b>与<b>魔镜网站</b>的官方介绍、下载与使用指南<br>
  Landing, download &amp; guides for <b>Mirror</b>, a Path of Exile 1 &amp; 2 toolset.
</p>

<p align="center">
  🔗 <b><a href="https://mirror.kalandraeye.com/">在线访问</a></b> ·
  🛒 <a href="https://trade.kalandraeye.com/">魔镜网站（市集 / 过滤 / 正则）</a> ·
  📐 <a href="DESIGN.md">设计文档</a> ·
  🚀 <a href="DEPLOY.md">部署</a>
</p>

---

## 两个产品，两个域名

| | 是什么 | 在哪 |
|---|---|---|
| **魔镜客户端** | Windows 悬浮窗：查价、截图识别、剧情引导、快捷正则、收益统计、速查图…… | 下载安装 |
| **魔镜网站** | 浏览器里的四件工具：市集搜索、角色试装、掉落过滤器、正则生成器 | `trade.kalandraeye.com`（另一个仓库） |

⚠️ **网站那四件里有两件要客户端在运行**：市集搜索用的是用户自己的官方交易会话，
角色试装跑的是客户端进程里的 Path of Building。过滤器和正则打开就能用。
**这条信息在官网上是明写的，不是小字** —— 写漏了，访客会选「网站」然后撞墙。

## 怎么改这个站

这个仓库现在**有构建**，但**产物也提交**：

```bash
pnpm install     # 只装一个 markdown-it
pnpm dev         # 改了就重建 + http://127.0.0.1:8765（本地开发用这个）
pnpm build       # src/pages/** → 仓库根下的 HTML + sitemap.xml，并跑自检
pnpm serve       # 只起服务器，不监听
pnpm check       # 只跑产物自检
```

> **为什么产物进 git**：部署模型是 `git clone` + nginx，更新就是一句 `git pull`
> （见 [DEPLOY.md](DEPLOY.md)），两台服务器都靠它。那个模型一个字都不该改 ——
> 所以服务器永远不需要装 node。构建只发生在作者的机器上。

### 目录

```
src/
  site.mjs          域名 / 语言 / 导航 / sitemap 权重 —— 全站常量只有这一份
  shell.html        壳：head、导航、页脚。改一次全站生效
  pages/            页面源码。文件名就是路由，见下
    index.zh.html     → /
    client.zh.html    → /client.html
    web.zh.html       → /web.html
    download.zh.html  → /download.html
    about.zh.html     → /about.html
    guide/index.zh.md → /guide/
    guide/*.zh.md     → /guide/*.html
  jsonld/           结构化数据片段，由页面 front matter 的 `jsonld:` 引用
assets/             site.css（全站一份）、shell.js、download.js、图片
shots/              功能卡配图（见 shots/README.md）
```

**⚠️ 仓库根下的 `.html` 是生成的**，手改会被下一次构建覆盖。每份文件开头都写着它的源在哪。

### 加一页

1. 在 `src/pages/` 下建 `<名字>.zh.md`（指南）或 `.zh.html`（设计页）
2. 顶上写 front matter：`title` / `description` / `keywords`，可选 `ogdesc`、`jsonld`
3. 要进导航就改 `src/site.mjs` 的 `NAV`；要进 sitemap 就改 `SITEMAP`
   （`/guide/**` 自动进，用 `GUIDE_DEFAULT` 的权重）
4. `pnpm build`

### 三种语言

九条路由现在都出三份：简中裸路径、英文 `/en/*`、繁中 `/tw/*`。加一页的话，三种各写一个文件即可。

- **简中是裸路径**（`/client.html`），因为那几个地址已经在被收录，搬走等于重来一轮
- **语言首页带尾斜杠**（`/en/`，不是 `/en`）—— 磁盘上就是 `en/index.html`，nginx 不用额外配
- **hreflang 只声明真的存在的那几种** —— 指向 404 的 hreflang 比不声明更糟
- ⚠️ **台服那套词和简中零重叠**（引路石 / 換界石、石板 / 碑牌、巨灵币 / 巨靈之幣，
  连游戏名都是「流亡黯道」不是「流放之路」），繁简转换换不出来。术语一律查
  [src/GLOSSARY.md](src/GLOSSARY.md)，**不要自己编**

#### 设计页怎么翻

设计页（`.html`）是**三份各自的 HTML**，不是一套模板 —— 一句话在英文里是一行、在中文里是两行，
卡片高度都不一样，撑不住共用。代价是 markup 有三份，而**改了一份忘了另两份是静默的**。

两样东西管这件事：

- `node src/i18n-tool.mjs extract <页> / apply <页>` —— 从简中那份抽文本节点，配上
  `src/i18n/<页>.json` 里的短语表，产出另外两份。**它只换文字不碰标签**，所以三份结构天生一致
- `build.mjs` 的**结构漂移检查** —— 每次构建比一遍标签序列 + class 序列，一动就喊。
  指南页（`.md`）不比：那是正文，段落数本来就该随语言不同

改设计页的流程：改简中 → `extract` → 补 `src/i18n/<页>.json` 里新增的那几条 → `apply` → `build`。

## 更新安装包

1. 应用仓库 `pnpm tauri build`，产物打成 `Mirror_setup.zip`
2. 传到 **GitHub Releases**（下载页链的就是那里，见 `src/pages/download.zh.html`）
3. 网盘链接在 [`assets/download.js`](assets/download.js) 的 `NETDISK`
4. `pnpm build` → `git push` → 发布（见 DEPLOY.md）

⚠️ **安装包不进这个仓库。** 曾经有过一份 `download/Mirror_setup.zip`（63 MB），
而下载页从来链的是 Releases —— 它躺在两台服务器上没人下过，却让每台机器的
首次 `git clone` 多背 63 MB，并且**永远留在 git 历史里**（每发一版再加一份）。

## 商标

Path of Exile / 流放之路 是其各自所有者的商标。本项目为非官方粉丝工具。
掉落过滤器基于 [NeverSink](https://github.com/NeverSinkDev) 的过滤定制（MIT）。
