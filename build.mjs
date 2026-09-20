/**
 * 官网构建：`src/pages/**` → 仓库根下的静态 HTML。
 *
 * ## 为什么有构建，但产物也进 git
 *
 * 这个站的部署模型是 `git clone` + nginx，更新就是一句 `git pull`（见 DEPLOY.md），
 * 两台服务器都靠它。**那个模型一个字都不该改** —— 所以产物跟源码一起提交：服务器
 * 永远不需要装 node，nginx 配置不用动，`git pull` 还是 `git pull`。
 *
 * 构建存在的理由只有一个：一份壳、一份导航、一份页脚。从前它们在三个 HTML 里各画
 * 一遍，加一条导航要改三处，**改漏一处不会报错**，只是那一页和别的页不一样。等指南
 * 页涨到十几篇、再乘三种语言，手写就直接停摆了。
 *
 * ## 两种页面
 *
 * - `.html` —— 设计页（首页 / 客户端 / 网站 / 下载 / 关于）。版式是卡片、mock、动效，
 *   Markdown 表达不了，所以它们就是 HTML 片段，构建只负责套壳。
 * - `.md` —— 指南页。正文就是正文，用 Markdown 写快得多。
 *
 * ## 文件名就是路由
 *
 * `src/pages/client.zh.html` → `/client.html`（简中裸路径）
 * `src/pages/client.en.html` → `/en/client.html`
 * `src/pages/guide/wealth.zh.md` → `/guide/wealth.html`
 * `src/pages/guide/index.zh.md` → `/guide/`（`index` 出的是目录，地址带尾斜杠）
 *
 * 哪种语言存在完全看文件在不在 —— 没有 `client.en.html` 就不出英文页，hreflang 也
 * 不会声明一个 404。⚠️ **hreflang 指向不存在的地址比不声明更糟**：搜索引擎会按它去
 * 抓，抓回 404，然后连带怀疑同组里其它几条。
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, watch } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import * as S from "./src/site.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src", "pages");
const SHELL = readFileSync(join(ROOT, "src", "shell.html"), "utf8");

const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

/* ── 壳里那些跟语言走的字 ─────────────────────────────────────────────────── */
const T = {
  zh: { brand: "魔镜", brandFoot: "魔镜 · Mirror", discord: "加入 Discord", qq: `QQ 群 ${S.FOOTER.qq}`,
        qqCopied: "已复制群号 ✓", contact: "有任何问题或建议，欢迎联系：", ogLocale: "zh_CN" },
  en: { brand: "Mirror", brandFoot: "Mirror · 魔镜", discord: "Join Discord", qq: `QQ Group ${S.FOOTER.qq}`,
        qqCopied: "Copied ✓", contact: "Questions or feedback? Reach out:", ogLocale: "en_US" },
  tw: { brand: "魔鏡", brandFoot: "魔鏡 · Mirror", discord: "加入 Discord", qq: `QQ 群 ${S.FOOTER.qq}`,
        qqCopied: "已複製群號 ✓", contact: "有任何問題或建議，歡迎聯繫：", ogLocale: "zh_TW" },
};

/**
 * 不带语言前缀的路径 + 语言 → 这个站上的地址。
 *
 * ⚠️ **语言首页带尾斜杠**（`/en/`，不是 `/en`）。这个站是 nginx 直接发静态文件，
 * `/en/` 对应磁盘上的 `en/index.html` —— 天然就对，不用给每种语言写一条 `location =`。
 * 写成 `/en` 的话，磁盘上那个名字既要是目录（放 `client.html`）又要是文件，
 * 构建当场 `EISDIR`；就算绕过去，nginx 也会把 `/en` 301 到 `/en/`，于是 canonical
 * 指着一个会跳转的地址。
 */
const urlFor = (route, lang) => {
  const p = S.PREFIX[lang];
  if (route === "/") return p ? `${p}/` : "/";
  return `${p}${route}`;
};

/* ── 资源指纹 ──────────────────────────────────────────────────────────────
 *
 * ⚠️ **CSS 和 JS 必须带内容指纹。** nginx 给 `assets/*` 配的是 `expires 30d`，而这两个
 * 文件名是固定的 —— 于是「HTML 是新的、CSS 是旧的」这种组合能在老访客的浏览器里存活
 * 一个月。它的故障样子很吓人但完全不报错：新标记拿不到新样式，`<img width="1200">`
 * 按原始尺寸撑开，整个栅格被顶爆。开发时一次硬刷新就看不见了，线上看不见的那个月才是
 * 代价。
 *
 * 用 `?v=` 而不是改文件名：nginx 那条按扩展名匹配的规则不用动，磁盘上还是一个文件。
 */
const stamp = (rel) => {
  const file = join(ROOT, rel);
  if (!existsSync(file)) return rel;
  const h = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 10);
  return `${rel}?v=${h}`;
};
const ASSETS = ["/assets/site.css", "/assets/shell.js", "/assets/download.js"];

/* ── 结构化数据按语言取 ───────────────────────────────────────────────────────
 *
 * front matter 里写的是 `jsonld/home.html`（三种语言同一句，因为 en/tw 页面是由
 * zh 重新生成的，写死语言会在下一次 `apply` 被抹掉）。这里在读取那一刻换成
 * `jsonld/home.en.html`，没有就退回原来那份。
 *
 * ⚠️ **不能三语共用一份。** 共用的话英文页会对搜索引擎声明一整组中文问答 ——
 *    Google 拿 `inLanguage` 和正文比对，对不上就把整块丢掉，而浏览器里一点都看
 *    不出来：页面正文是翻译好的，只有喂给爬虫的那份不是。
 */
/* ── 截图按语言取 ─────────────────────────────────────────────────────────────
 *
 * 默认 `/shots/<名>.webp`；某种语言另有一份就放 `/shots/<语言>/<名>.webp`，
 * 构建时自动换过去。**没有那一份就沿用默认**，所以补一张多一张，不用改页面。
 *
 * ⚠️ 换路径要连 `<img>` 上的 `width`/`height` 一起换 —— 两份截图的像素尺寸
 *    很少一样，留着旧的就是在声明一个错的固有尺寸。
 *
 * ⚠️ `.avif` 和 `.webp` **必须同时存在才换**：只换一半的话，支持 avif 的浏览器
 *    看到英文图、不支持的看到中文图，而这件事在任何一台机器上都只看得到一半。
 */
const webpSize = (file) => {
  const b = readFileSync(file);
  const tag = b.toString("ascii", 12, 16);
  if (tag === "VP8X") return [(b.readUIntLE(24, 3) & 0xffffff) + 1, (b.readUIntLE(27, 3) & 0xffffff) + 1];
  if (tag === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (tag === "VP8L") {
    const n = b.readUInt32LE(21);
    return [(n & 0x3fff) + 1, ((n >> 14) & 0x3fff) + 1];
  }
  return null;
};

function localizeShots(html, lang) {
  if (lang === "zh") return html;                       // 简中就是默认那一份
  return html.replace(
    /<picture>([\s\S]*?)<\/picture>/g,
    (block) => {
      const m = block.match(/\/shots\/([a-z0-9-]+)\.webp/);
      if (!m) return block;
      const name = m[1];
      const webp = join(ROOT, "shots", lang, `${name}.webp`);
      if (!existsSync(webp) || !existsSync(join(ROOT, "shots", lang, `${name}.avif`))) return block;
      let out = block.replaceAll(`/shots/${name}.`, `/shots/${lang}/${name}.`);
      const wh = webpSize(webp);
      if (wh) out = out.replace(/width="\d+" height="\d+"/, `width="${wh[0]}" height="${wh[1]}"`);
      return out;
    },
  );
}

const jsonldFor = (rel, lang) => {
  const alt = rel.replace(/\.html$/, `.${lang}.html`);
  return existsSync(join(ROOT, "src", alt)) ? alt : rel;
};


/* ── front matter：`---` 包起来的 `键: 值`，一行一条 ───────────────────────── */
function parseFront(text) {
  if (!text.startsWith("---\n")) return [{}, text];
  const end = text.indexOf("\n---\n", 3);
  if (end < 0) return [{}, text];
  const meta = {};
  for (const line of text.slice(4, end).split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return [meta, text.slice(end + 5)];
}

/* ── 收集 src/pages 下的所有页面 ───────────────────────────────────────────── */
function collect(dir = SRC, out = new Map()) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { collect(full, out); continue; }
    const m = name.match(/^(.+)\.(zh|en|tw)\.(html|md)$/);
    if (!m) continue;
    const [, stem, lang, kind] = m;
    const rel = relative(SRC, dir).split(/[\\/]/).filter(Boolean);
    // `index` 出目录地址；其余出 `<名字>.html`
    const route = stem === "index"
      ? "/" + [...rel, ""].join("/")
      : "/" + [...rel, `${stem}.html`].join("/");
    if (!out.has(route)) out.set(route, {});
    out.get(route)[lang] = { file: full, kind };
  }
  return out;
}

/** 地址 → 磁盘上要写哪个文件。目录地址写成 `<目录>/index.html`。 */
const fileFor = (route, lang) => {
  const url = urlFor(route, lang);
  const p = url.endsWith("/") ? `${url}index.html` : url;
  return join(ROOT, p.replace(/^\//, ""));
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── 渲染一页 ──────────────────────────────────────────────────────────────── */
function render(route, lang, entry, langsHere) {
  const raw = readFileSync(entry.file, "utf8");
  const [meta, rest] = parseFront(raw);
  let body = entry.kind === "md"
    ? `<main class="prose-page"><div class="wrap">\n${md.render(rest)}\n</div></main>`
    : rest;

  // 页面自带的 <style> 提到 head 去 —— 放在 body 里浏览器也认，但那会让样式在首屏
  // 画完之后才到，肉眼可见地闪一下。<script> 留在原地（它要等 DOM）。
  const styles = [];
  body = body.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => { styles.push(css); return ""; });

  const t = T[lang];
  const canonical = S.ORIGIN + urlFor(route, lang);

  // hreflang 只给**真的存在**的那几种语言
  const alts = langsHere.length > 1
    ? langsHere.map((l) => `  <link rel="alternate" hreflang="${S.HTML_LANG[l]}" href="${S.ORIGIN + urlFor(route, l)}" />`)
        .concat(`  <link rel="alternate" hreflang="x-default" href="${S.ORIGIN + urlFor(route, "zh")}" />`)
        .join("\n")
    : "";

  const nav = S.NAV.map((item) => {
    const href = item.external ? item.to : urlFor(item.to, lang);
    const here = item.to === route;
    const cls = item.cta ? "btn btn-gold" : "link" + (here ? " here" : "");
    const icon = item.cta
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>'
      : "";
    const aria = here ? ' aria-current="page"' : "";
    const ext = item.external ? ' target="_blank" rel="noopener"' : "";
    return `        <a class="${cls}" href="${href}"${aria}${ext}>${icon}<span>${esc(item.label[lang] || item.label.zh)}</span></a>`;
  }).join("\n");

  /**
   * 语言切换。⚠️ 只列 `langsHere` —— 某一页缺某种语言时，那一栏就不该出现在它上面，
   * 否则点过去是 404。这和 hreflang 用的是同一份名单，不是两处各判一次。
   */
  const LANG_LABEL = { zh: "简体", en: "EN", tw: "繁體" };
  const langSwitch = langsHere.length > 1
    ? `        <div class="lang-switch">\n` +
      langsHere.map((l) => {
        const here = l === lang;
        const href = urlFor(route, l);
        const attrs = here ? ' aria-current="true" class="on"' : "";
        // ⚠️ 切语言的链接**必须带 hreflang**：它告诉爬虫这几个地址是同一页的不同语言，
        // 而不是四个各自独立的页面。
        return `          <a href="${href}" hreflang="${S.HTML_LANG[l]}" lang="${S.HTML_LANG[l]}"${attrs}>${LANG_LABEL[l]}</a>`;
      }).join("\n") +
      `\n        </div>`
    : "";

  /* 搜索引擎站点验证。**三种语言都发。**
   *
   * ⚠️ 曾经只发简中（理由是「后台登记的就是裸路径那个地址」），那是错的：各家的
   *    验证爬虫多半不带 `Accept-Language`，而 nginx 的按语言分流对「没有偏好」
   *    的请求发 302 到 `/en/` —— 那一份没有验证码，于是验证失败，而你在浏览器里
   *    打开裸路径怎么看都觉得该成功。验证码本来就印在公开页面上，少发一份省不了
   *    任何东西，多发一份换来的是这条路不会莫名其妙断掉。
   *
   * 空值不输出 —— 空的 `content=""` 有些后台会判成验证失败。 */
  const verify = Object.entries({
    "google-site-verification": S.VERIFY.google,
    "msvalidate.01":            S.VERIFY.bing,
    "baidu-site-verification":  S.VERIFY.baidu,
  }).filter(([, v]) => v).map(([k, v]) => `  <meta name="${k}" content="${esc(v)}" />`).join("\n");

  const head = [
    meta.jsonld ? readFileSync(join(ROOT, "src", jsonldFor(meta.jsonld, lang)), "utf8").trim() : "",
    styles.length ? `  <style>${styles.join("\n")}</style>` : "",
  ].filter(Boolean).join("\n");

  /* 备案号只出现在简中那一份。
   *
   * ⚠️ 它是**大陆主体的行政信息**，对 `/en/` 和 `/tw/` 的读者没有意义，而两台服务器
   *    发的是同一批文件 —— 所以只能在生成这一层分，不能靠线路分。 */
  const beian = lang === "zh"
    ? ` · <a href="${S.FOOTER.icp.url}" target="_blank" rel="noreferrer" style="color:var(--muted-2)">${S.FOOTER.icp.no}</a> · <a href="${S.FOOTER.police.url}" target="_blank" rel="noreferrer" style="color:var(--muted-2)"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="vertical-align:-1px;margin-right:3px"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V5l-8-3zm0 2.2 6 2.25V11c0 3.9-2.5 6.7-6 8.05C8.5 17.7 6 14.9 6 11V6.45l6-2.25z"/><path d="M12 7.3 12.85 9l1.95.2-1.45 1.3.42 1.9L12 11.55l-1.77.85.42-1.9L9.2 9.2 11.15 9 12 7.3z"/></svg>${S.FOOTER.police.no}</a>`
    : "";
  let out = SHELL
    .replace(/__SOURCE__/g, relative(ROOT, entry.file).split(sep).join("/"))
    .replace(/__LANGKEY__/g, lang)
    .replace(/__LANG__/g, S.HTML_LANG[lang])
    .replace(/__TITLE__/g, esc(meta.title || "魔镜 Mirror"))
    .replace(/__DESCRIPTION__/g, esc(meta.description || ""))
    .replace(/__OGDESC__/g, esc(meta.ogdesc || meta.description || ""))
    .replace(/__KEYWORDS__/g, esc(meta.keywords || ""))
    .replace(/__CANONICAL__/g, canonical)
    .replace(/__ORIGIN__/g, S.ORIGIN)
    .replace(/__OGLOCALE__/g, t.ogLocale)
    .replace(/__HREFLANG__/g, alts)
    .replace(/__VERIFY__/g, verify ? verify + "\n" : "")
    .replace(/__HEAD__/g, head)
    .replace(/__HOME__/g, urlFor("/", lang))
    .replace(/__BRAND__/g, t.brand)
    .replace(/__BRAND_FOOT__/g, t.brandFoot)
    .replace(/__NAV__/g, nav)
    .replace(/__LANGSWITCH__/g, langSwitch)
    .replace(/__BODY__/g, body.trim())
    .replace(/__DISCORD__/g, S.FOOTER.discord)
    .replace(/__DISCORD_LABEL__/g, t.discord)
    .replace(/__QQ_LABEL__/g, t.qq)
    .replace(/__QQ_COPIED__/g, t.qqCopied)
    .replace(/__QQ__/g, S.FOOTER.qq)
    .replace(/__CONTACT__/g, t.contact)
    .replace(/__BEIAN__/g, beian)
    .replace(/__EMAIL__/g, S.FOOTER.email)
    .replace(/__SCRIPT__/g, "");
  /* ⚠️ 指纹只加在查询串上，**前导斜杠必须留着**：`stamp()` 收的是磁盘上的相对路径
     （用来算哈希），吐回来的也是相对的，直接拼回去就把 `/assets/…` 写成了
     `assets/…`。根目录那几页照样能打开（相对解析恰好等于根），而 `/guide/*`、
     `/en/*`、`/tw/*` 会去要 `/guide/assets/site.css` —— 404，整页零样式，
     且**构建和自检都不会报**（HTML 本身是合法的）。 */
  for (const a of ASSETS) out = out.split(`"${a}"`).join(`"/${stamp(a.slice(1))}"`);
  out = localizeShots(out, lang);
  return out;
}

/* ── 结构漂移检查 ──────────────────────────────────────────────────────────
 *
 * 同一条路由的三种语言是**三份各自的 HTML**（prose 的语言差异撑不住一套模板 ——
 * 一句话在英文里是一行，在中文里是两行，卡片高度都不一样）。代价是markup 有三份，
 * 而**改了一份忘了另两份是静默的**：那一页在别的语言下少一张卡、或者少一个 class，
 * 页面照常渲染，只是长得不一样，没有任何东西会报错。
 *
 * 所以这里比一份"结构指纹"：标签序列 + class 序列。文案随便改，结构一动就喊。
 * 指南页（`.md`）不比 —— 那是正文，段落数本来就该随语言不同。
 */
function fingerprint(html) {
  const tags = [];
  for (const m of html.matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
    const cls = /\bclass="([^"]*)"/.exec(m[2]);
    tags.push(cls ? `${m[1].toLowerCase()}.${cls[1].trim()}` : m[1].toLowerCase());
  }
  return tags;
}

function checkDrift(route, langs) {
  const kinds = Object.values(langs).map((e) => e.kind);
  if (kinds.some((k) => k !== "html")) return [];      // Markdown 不比结构
  const got = {};
  for (const [lang, entry] of Object.entries(langs)) {
    const [, rest] = parseFront(readFileSync(entry.file, "utf8"));
    got[lang] = fingerprint(rest);
  }
  const base = "zh" in got ? "zh" : Object.keys(got)[0];
  const out = [];
  for (const [lang, fp] of Object.entries(got)) {
    if (lang === base) continue;
    if (fp.length !== got[base].length) {
      out.push(`${route} [${lang}] 结构和 ${base} 不一样：标签数 ${fp.length} vs ${got[base].length}`);
      continue;
    }
    const i = fp.findIndex((t, k) => t !== got[base][k]);
    if (i >= 0) out.push(`${route} [${lang}] 第 ${i + 1} 个标签是 <${fp[i]}>，${base} 那边是 <${got[base][i]}>`);
  }
  return out;
}

/* ── sitemap ───────────────────────────────────────────────────────────────── */
function sitemap(pages) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];
  for (const [route, langs] of pages) {
    const cfg = S.SITEMAP[route] || (route.startsWith("/guide/") ? S.GUIDE_DEFAULT : null);
    if (!cfg) continue;
    for (const lang of Object.keys(langs)) {
      urls.push(
        `  <url>\n    <loc>${S.ORIGIN + urlFor(route, lang)}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${cfg.changefreq}</changefreq>\n` +
        `    <priority>${cfg.priority}</priority>\n  </url>`
      );
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

/* ── 跑 ────────────────────────────────────────────────────────────────────── */
function buildOnce() {
const pages = collect();
if (!pages.size) { console.error("src/pages 下一个页面都没有"); process.exit(1); }

let n = 0;
for (const [route, langs] of pages) {
  const here = S.LANGS.filter((l) => langs[l]);
  for (const lang of here) {
    const out = fileFor(route, lang);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, render(route, lang, langs[lang], here));
    n++;
  }
}
writeFileSync(join(ROOT, "sitemap.xml"), sitemap(pages));

const drift = [...pages].flatMap(([route, langs]) => checkDrift(route, langs));
if (drift.length) {
  console.warn("⚠️  结构漂移：");
  for (const d of drift) console.warn("    " + d);
}

const missing = [...pages].filter(([, l]) => !l.zh).map(([r]) => r);
if (missing.length) console.warn(`⚠️  没有简中版本的页面（简中是裸路径，缺了就没有 canonical 那一份）：${missing.join(", ")}`);

console.log(`✓ ${n} 份 HTML（${pages.size} 条路由）+ sitemap.xml`);
if (!WATCH) {
  for (const [route, langs] of [...pages].sort()) {
    console.log(`    ${route.padEnd(28)} ${S.LANGS.filter((l) => langs[l]).join(" ")}`);
  }
}
}

/* ── 本地开发：改了就重建，顺带起个静态服务器 ───────────────────────────────
 *
 * ⚠️ **`--watch` 以前是个谎**：`package.json` 里 `dev` 一直写着它，而 build.mjs
 *    从来没读过这个参数 —— 跑一次就退出，看起来像「监听中但没反应」。
 *
 * ⚠️ 服务器要**自己写**不能靠 `python3 -m http.server`：那玩意儿对
 *    `/guide/` 这种目录是发 index.html 没错，但**不带缓存头**，改完刷新常常
 *    还是旧的；而这个站的资源恰恰带内容指纹，本地更需要「永远不缓存」。
 */
const WATCH = process.argv.includes("--watch");
const SERVE = process.argv.includes("--serve");

buildOnce();

if (SERVE) {
  const { createServer } = await import("node:http");
  const TYPES = { html: "text/html; charset=utf-8", css: "text/css", js: "text/javascript",
    json: "application/json", svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg",
    webp: "image/webp", avif: "image/avif", ico: "image/x-icon", xml: "application/xml",
    txt: "text/plain; charset=utf-8", woff2: "font/woff2", mp4: "video/mp4", webm: "video/webm" };
  const PORT = Number(process.env.PORT || 8765);
  createServer((req, res) => {
    // ⚠️ 指纹是查询串，落到磁盘上要剥掉；`..` 也要挡，不然本地服务器能读整个盘
    let p = decodeURIComponent(req.url.split("?")[0]).replace(/\/+/g, "/");
    if (p.includes("..")) { res.writeHead(400).end("bad path"); return; }
    let file = join(ROOT, p);
    // 目录 → index.html；`/en` → 301 `/en/`（和 nginx 的行为对齐）
    if (existsSync(file) && statSync(file).isDirectory()) {
      if (!p.endsWith("/")) { res.writeHead(301, { Location: p + "/" }).end(); return; }
      file = join(file, "index.html");
    }
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { "Content-Type": TYPES.html });
      res.end(`<h1>404</h1><p>${p}</p><p>本地没有这个文件。</p>`);
      return;
    }
    res.writeHead(200, {
      "Content-Type": TYPES[file.split(".").pop().toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",   // 本地一律不缓存，见上面那条 ⚠️
    });
    res.end(readFileSync(file));
  }).listen(PORT, "127.0.0.1", () => {
    console.log(`\n  → http://127.0.0.1:${PORT}/      简中`);
    console.log(`  → http://127.0.0.1:${PORT}/en/   English`);
    console.log(`  → http://127.0.0.1:${PORT}/tw/   繁體\n`);
  });
}

if (WATCH) {
  // 只盯源，不盯产物 —— 盯产物会被自己的写入触发，无限重建
  let timer = null;
  const rebuild = (f) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      process.stdout.write(`\n[${new Date().toTimeString().slice(0, 8)}] ${f} → `);
      try { buildOnce(); } catch (e) { console.error("✗ " + e.message); }
    }, 80);   // 编辑器保存常常连发好几次事件
  };
  for (const dir of ["src", "assets"]) {
    watch(join(ROOT, dir), { recursive: true }, (_, f) => f && rebuild(`${dir}/${f}`));
  }
  console.log("监听 src/ 与 assets/，Ctrl+C 退出");
}
