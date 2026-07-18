# 魔镜 Mirror 官网 · 设计文档

面向维护者的整站设计说明：技术选型、设计语言、各功能机制、以及"坑"。
配合 [README.md](README.md)（托管/部署）一起看。

---

## 1. 目标与原则

- **一句话定位**：《流放之路 2》(POE2) 桌面悬浮窗助手的官方介绍 + 下载页。
- **受众**：国服 / 台服 / 国际服玩家（国内为主），中英双语。
- **原则**：
  - **零依赖单文件**：`index.html` 内联全部 CSS/JS，无框架、无构建、无外部请求（除 GA4、计数器、演示视频）。改一个文件即可维护。
  - **动图主导**：功能用动效演示，而非纯文字/静图。
  - **国内可访问优先**：主力托管在香港服务器（详见 README）。

---

## 2. 设计语言：「悬浮窗降临」The Overlay, Alive

整站隐喻——**网站本身就是魔镜的悬浮窗**。滚动时功能演示像在游戏里被"召唤"出来。

### 配色（CSS 变量，见 `index.html` `:root`）
| 变量 | 值 | 用途 |
|---|---|---|
| `--bg` | `#08090d` | 深色背景 |
| `--gold` | `#e3c072` | 主金色（品牌、强调） |
| `--sapphire` | `#6ea0e0` | 蓝宝石点缀（呼应 logo） |
| `--rare` | `#f2e27a` | POE 稀有物品黄（物品名） |
| `--text` / `--muted` | `#ece9e1` / `#9a978f` | 正文 / 次要文字 |

配色来源：app logo（金环 + 蓝宝石），契合 POE 暗金审美。

### 动效清单
- **氛围**：金色余烬粒子上升（JS 生成）、极光辉光漂移、标题「魔镜」镜面流光。
- **进场**：滚动到视口 fade-up（IntersectionObserver）。
- **Hero 悬浮窗**：召唤动效（缩放 + 金环脉冲）→ 词缀逐条浮现 → 缓慢浮动 + 微光扫过。
- **数字**：访问/下载数 count-up。
- **卡片**：hover 3D 轻倾斜；功能演示进视口才播放。
- **无障碍**：`prefers-reduced-motion` 时全部动效降级为静态。

---

## 3. 页面结构

| 区块 | 内容 |
|---|---|
| **Nav** | Logo · 功能 · FAQ · 中/EN 切换 · 下载按钮 |
| **Hero** | 主标题（流光"魔镜"）· 副标题 · 下载 CTA · 访问/下载计数 · 三服+语言+**手柄徽章** · 右侧模拟悬浮窗（纯 CSS，不放视频，作品牌锚点） |
| **功能区**（`#highlights`） | **8 张大卡**，左右交错排版，每张：标题 + 描述 + 要点 + 演示 |
| **安全承诺**（`#safety`） | 不注入/不读写内存/不改文件的声明 |
| **下载**（`#download`） | 下载按钮 + 运行要求（仅 Windows 10/11） |
| **FAQ** | 封号 / 支持哪些服 / AI 何时上线 / 安装包来源 |
| **Footer** | 品牌 · Discord · QQ 群（点击复制）· 联系邮箱 |

### 8 大功能（对应 app 的 overlay）
截图识别查价 · 剧情引导 · **AI 市集搜索（即将上线）** · 物品查价 · 快捷正则 · 唯一物品搜索 · 通货兑换 · 计时器。
支持：国际服/国服/台服 · 英/简/繁 · 键盘 + 手柄。

---

## 4. 关键机制

### 4.1 双语 i18n
- 每段文案用两个元素：`<span data-i18n-zh>…</span><span data-i18n-en>…</span>`。
- CSS 默认隐藏 `[data-i18n-en]`；`html[data-lang="en"]` 时反转显隐。
- `setLang()` 切换 `data-lang`，写入 `localStorage`；首次按 `navigator.language` 判断。
- **⚠️ 坑**：若元素自身有更高优先级的 `display`（如 `.feature li { display:flex }`），默认的 `[data-i18n-en]{display:none}` 会被盖过导致**中英同时显示**。解决：为这类元素补一条同等/更高优先级的隐藏规则（见 `.feat-li[data-i18n-en]{display:none}`）。新增带 `display` 的双语元素时务必注意。

### 4.2 演示视频机制（双语）
- 演示位是 `<video data-demo="<key>">`（key 如 `scan`/`ai`/`price`…）。
- `swapDemoVideos(lang)`：按当前语言加载 `demos/<key>_<lang>.webm` + `.mp4`；**只加载当前语言**。
- **回退链**：当前语言文件缺失 → 自动回退另一语言 → 都没有则显示 **CSS 占位 mock**（见下），永不留白。
- 进视口才 `play()`，离开 `pause()`。
- **加视频只需**把 `demos/<key>_<lang>.mp4` + `.webm` 丢进 `demos/`，零改代码。命名：`功能_语言`，如 `scan_zh.mp4` / `ai_en.webm`。台服(繁体)默认复用中文或英文。
- **语言无关的演示**：若某功能演示不含文字、无需分语言（如通货比例条 `exchange`），给 `<video>` 加 `data-nolang`，则只加载 `demos/<key>.mp4`（无语言后缀），切换语言不重载。
- **⚠️ faststart**：录制/转码后的 MP4 需 `moov` 在 `mdat` 之前（qt-faststart），否则国内网络要下完整段才起播。无 ffmpeg 时可用纯 Node 移动 moov 并修正 `stco/co64` 偏移（本轮 exchange/timer/ai 即如此处理）。

### 4.3 演示占位 mock（真实视频前的替身）
每个功能都有风格统一的 CSS 动效占位，视觉一致：
- `scan` 扫描光束 + 价格弹出；`campaign` 任务列表浮现；`ai` 对话气泡。
- `price/regex/unique/exchange/timer` 小型 UI mock（物品价卡 / 正则卡片 / 搜索结果 / 兑换比率条 / 走动的计时器）。
真实 MP4 就位后，视频覆盖在 mock 之上（视频加载成功才显示）。

### 4.4 统计
- **GA4**（`G-CYBLTV2J69`）：`page_view` + `file_download`（增强衡量对 `.zip` 自动计数，**勿再手动埋 file_download** 以免重复）。
- **Abacus**（`abacus.jasoncameron.dev`，namespace `mirror-kalandraeye-com`，key `visits`/`downloads`）：Hero 上显示的公开计数。独立于 GA4，数字会略有出入。下载按钮点击时 `hit/downloads`。
- 两套并存：GA4 看真实分析，Abacus 只为页面上的"热度数字"。

### 4.5 SEO
- `<title>` / `description` / `keywords` 含长尾词（POE2 查价工具、悬浮窗、截图识别价格、交易行价格查询…）。
- `canonical` · Open Graph · Twitter Card · JSON-LD（`SoftwareApplication`）。
- `robots.txt` + `sitemap.xml`。
- 域名换了要同步改：`index.html` 的 canonical/og/twitter/JSON-LD、`sitemap.xml`、`robots.txt`、README。

### 4.6 安全承诺
固定文案（信任卖点）：**不注入、不读写游戏进程/内存、不修改游戏文件**；只读取日志、你主动复制的剪贴板、以及按识别热键时截一帧做本地 OCR；查价走官方交易行 API。改功能时保持此声明准确。

---

## 5. 托管与部署

见 [README.md](README.md#托管与部署--hosting--deploy)。要点：香港 nginx 服务 `mirror.kalandraeye.com`（免备案、国内可访问）；`git push` → GitHub Actions `rsync` 到服务器。

---

## 6. 维护速查

| 我想… | 做法 |
|---|---|
| 加/换某功能的演示视频 | 丢 `demos/<key>_<lang>.mp4`+`.webm` 进 `demos/`，push |
| 改文案 | 找对应的 `data-i18n-zh` / `data-i18n-en` 一对一起改 |
| 加新的双语元素 | 提供 zh+en 两份；若元素有 `display:flex/grid`，补隐藏规则（见 4.1 坑） |
| 放安装包 | 见 README「更新安装包」 |
| 换域名 | 改 4.5 列出的所有位置 + DNS + nginx `server_name` |
| 加社区入口 | 页脚 `.foot-social` 里加 `.social-btn`（参考 Discord/QQ） |
