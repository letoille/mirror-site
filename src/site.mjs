/**
 * 全站常量：域名、语言、导航、页面清单。
 *
 * 这个文件是**唯一**的那一份。导航在五个页面上各画一遍的日子结束了 —— 从前加一条
 * 链接要改三个 HTML，改漏一个不会报错，只是那一页的导航和别的页不一样。
 */

export const ORIGIN = "https://mirror.kalandraeye.com";

/** 魔镜网站（市集 / 角色 / 过滤 / 正则）。它是另一个站，不是这个站的子目录。 */
export const WEB_APP = "https://trade.kalandraeye.com";

/**
 * 语言 → 地址前缀。
 *
 * ⚠️ **简中是裸路径，不是 `/zh`** —— `/`、`/download.html`、`/about.html` 这三个地址
 * 已经在 sitemap 里、已经在被收录，搬走等于把攒到的东西丢掉再等一轮。新语言各自带
 * 前缀，老地址一个字节不动。这条规则和魔镜网站那边是同一条（`site/src/lib/langPath.ts`），
 * 两个站的地址形状一致，用户和爬虫都少一次意外。
 */
export const LANGS = ["zh", "en", "tw"];
export const PREFIX = { zh: "", en: "/en", tw: "/tw" };
/** BCP 47 标签，`<html lang>` 和 hreflang 用的就是它。 */
export const HTML_LANG = { zh: "zh-Hans", en: "en", tw: "zh-Hant" };

/**
 * 顶栏导航。`to` 是不带语言前缀的路径，构建时按语言补上。
 *
 * ⚠️ `external: true` 的那条指向**另一个域名**，所以它不带语言前缀 —— 魔镜网站有它
 * 自己的一套地址（`/tw/*`、`/en/*`），前缀由那边决定，这边硬拼会拼出 404。
 */
export const NAV = [
  { to: "/client.html", label: { zh: "客户端", en: "Client", tw: "客戶端" } },
  { to: "/web.html", label: { zh: "网站", en: "Web", tw: "網站" } },
  { to: "/guide/", label: { zh: "使用指南", en: "Guides", tw: "使用指南" } },
  { to: "/download.html", label: { zh: "下载", en: "Download", tw: "下載" }, cta: true },
  { to: "/about.html", label: { zh: "关于", en: "About", tw: "關於" } },
];

/** 页脚那几个字。备案号只对大陆线路有意义，但两台服务器发同一份文件。 */
export const FOOTER = {
  icp: { no: "滇ICP备2025052314号-2", url: "https://beian.miit.gov.cn/" },
  police: {
    no: "滇公网安备53010202002415号",
    code: "53010202002415",
    url: "https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=53010202002415",
  },
  discord: "https://discord.gg/RTqazvQKKE",
  qq: "1057145969",
  email: "kalandraeye@gmail.com",
};

/**
 * 出现在 sitemap 里的页面的权重与更新频率。**没列到的一律不进 sitemap** ——
 * 那是给 `preview/` 这种早期验证页留的后门（它本来就 noindex）。
 */
export const SITEMAP = {
  "/": { priority: "1.0", changefreq: "weekly" },
  "/client.html": { priority: "0.9", changefreq: "weekly" },
  "/web.html": { priority: "0.9", changefreq: "weekly" },
  "/download.html": { priority: "0.9", changefreq: "weekly" },
  "/guide/": { priority: "0.8", changefreq: "weekly" },
  "/about.html": { priority: "0.6", changefreq: "monthly" },
  // 指南正文默认 0.7 / monthly，由 build.mjs 补，不用在这里逐条列
};
export const GUIDE_DEFAULT = { priority: "0.7", changefreq: "monthly" };
