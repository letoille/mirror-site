# 功能卡配图

⚠️ **这些是「浮层裁图」，不是 1440×900 的整屏截图。** 页面的 `.demo` 框用
`object-fit: scale-down`（见 `assets/site.css`）—— **一刀不裁、一像素不放大**：
比框大的缩到能看全，比框小的按原尺寸摆在深色衬底上。所以尺寸不必统一，
截多大就是多大，**但别为了填满框去放大**，放大的图在卡片上一眼就糊。

⚠️ **`<img>` 的 `width`/`height` 必须是这张图的真实像素**，不是框的尺寸 ——
浏览器靠它在图到达之前留出正确高度，填错就是加载时整页跳一下（CLS）。
换图之后记得一起改（在 `src/pages/*.zh.html` 里）。

## 转换

macOS 自带的 `sips` 能写 AVIF 但**不能写 WebP**，所以两种格式都走 sharp：

```bash
npm_config_cache=/tmp/npmcache npx --yes sharp-cli \
  --input '<原图目录>/*.png' --output shots --format webp --quality 82
npm_config_cache=/tmp/npmcache npx --yes sharp-cli \
  --input '<原图目录>/*.png' --output shots --format avif --quality 55
```

文件名就是槽位名（`shots/timer.webp` ↔ 页面里的 `/shots/timer.webp`）。

## 按语言换图

默认是 `shots/<名>.webp`，三种语言共用。某种语言另有一份就放
`shots/<语言>/<名>.webp`（`en` / `tw`），构建时自动换过去 —— **没有那一份就沿用
默认，所以补一张多一张，不用改页面**。

```
shots/campaign.webp        ← 简中、繁中用这张
shots/en/campaign.webp     ← 英文页用这张
```

⚠️ **`.webp` 和 `.avif` 必须同时存在才换。** 只放一半的话，支持 avif 的浏览器看到
一份、不支持的看到另一份 —— 而这件事在任何一台机器上都只看得到一半，测不出来。

⚠️ 换路径时 `<img>` 的 `width`/`height` 由构建从 WebP 头里读出来一起换，不用手填。

### 已有的语言专属版本

| 槽位 | 默认（简中） | `en` | `tw` |
|---|---|---|---|
| `campaign` | ✅ | ✅ | 用默认 |
| `price` | ✅ | ✅ | ✅ |
| `wealth` | ✅ | ✅ | 用默认 |
| `build-planner` | ✅ | ✅ | 用默认 |
| `scan` | ✅ | ✅ | 用默认 |
| `cheatsheet` | ✅ | ✅ | 用默认 |
| `market` | ✅ | ✅ | ✅ |
| `regex` | ✅ | ✅ | 用默认 |
| `command` | ✅ | ✅ | 用默认 |
| `unique` | ✅ | ✅ | 用默认 |
| `reward` | ✅ | ✅ | 用默认 |
| `timer` | ✅ | ✅ | 用默认 |
| `filter` | ✅ | ✅ | 用默认 |
| `exchange` | ✅ | 不分语言 | 不分语言 |
| `web-market` | ✅ | ✅ | 用默认 |
| `web-character` | ✅ | ✅ | 用默认 |
| `web-filter` | ✅ | ✅ | 用默认 |
| `web-regex` | ✅ | ✅ | 用默认 |

其余槽位三语共用默认那一份。

⚠️ **「不分语言」不是还没做。** `exchange` 画面上只有通货图标和数字、一个字都没有，
再截一份英文的是同一张图 —— 标在这里，免得下次盘点时把它当成缺口补。

## 现状

| | 槽位 | 卡片 |
|---|---|---|
| ✅ | `campaign` | 剧情开荒，任务奖励自动提示 |
| ✅ | `price` | 一键查价，智能选择词缀 |
| ✅ | `wealth` | 收益统计，看清策略收益 |
| ✅ | `build-planner` | BD 规划，自动同步游戏内天赋 |
| ✅ | `scan` | 一键截图查价 |
| ⬜ | `mercenary` | 佣兵查价 |
| ✅ | `cheatsheet` | 图片快速查看 |
| ✅ | `market` | 实时行情 |
| ✅ | `regex` | 常用正则快速使用 |
| ✅ | `command` | 快捷指令 |
| ✅ | `unique` | 物品快速搜索 |
| ✅ | `reward` | 攻坚收益统计 |
| ✅ | `timer` | 计时器 |
| ✅ | `filter` | 过滤器 |
| ✅ | `exchange` | 常用通货兑换比率 |
| ✅ | `web-market` | 市集搜索 |
| ✅ | `web-character` | 角色 · 试装 |
| ✅ | `web-filter` | 掉落过滤器 |
| ✅ | `web-regex` | 正则生成器 |
| ⬜ | `ai` | 一句话，找到你想要的装备魔镜市集 |
| ⬜ | `ai-character` | BD 助手，角色分析后续开发支持 |
| ⬜ | `ai-build` | BD 快速导入魔镜后续开发支持 |

⬜ 的那几张缺席时显示 CSS 画的示意图或渐变兜底，页面不会破，但那几条 `alt`
文本是给不存在的图配的，图片搜索拿不到。
