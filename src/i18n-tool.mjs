/**
 * 一次性工具：拿简中那份页面 + 一张「简中 → 英/繁」的短语表，产出另外两种语言的页面源码。
 *
 * **它只换文本节点，不碰任何标签** —— 所以三份的结构逐字一致，`build.mjs` 的漂移检查
 * 一开始就是绿的。产出之后那两份就是普通源码，照常手改；漂移检查负责往后不让它们走散。
 *
 *   node src/i18n-tool.mjs extract <page>    # 导出待译短语（JSON）
 *   node src/i18n-tool.mjs apply   <page>    # 按短语表生成 .en. / .tw.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (page, lang) => join(ROOT, "src", "pages", `${page}.${lang}.html`);
const dict = (page) => join(ROOT, "src", "i18n", `${page}.json`);

/**
 * 待译片段 = 标签之间的文本 **加上** `alt=""` 的值。`<script>`/`<style>`/注释里的不算。
 *
 * ⚠️ **`alt` 必须一起收。** 它不是文本节点，早先只收文本节点，结果英文页和繁中页上
 * 的图片 `alt` 全是简中——而 `alt` 恰好是图片搜索唯一读得到的东西，也是读屏软件念出
 * 来的那一句。页面上看不出任何异常，所以这个缺口只能靠这里堵。
 */
function segments(html) {
  const out = [];
  const skip = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>|<!--[\s\S]*?-->/gi;
  const holes = [...html.matchAll(skip)].map((m) => [m.index, m.index + m[0].length]);
  const inHole = (i) => holes.some(([a, b]) => i >= a && i < b);

  const push = (start, text) => {
    if (!text.trim()) return;
    // ⚠️ **中文标点也要进表。** 从前的判据是「含字母才收」，于是 `</b>、<b>` 里那个
    // 顿号被当成纯符号跳过 —— 英文页上就留着一个「、」和一个「。」。判据改成：
    // 只有**全是 ASCII 标点/数字**时才跳过。
    if (!/\p{L}/u.test(text) && !/[\u3000-\u303F\uFF00-\uFFEF]/.test(text)) return;
    out.push({ start, end: start + text.length, text });
  };

  let m;
  const text = />([^<]+)</g;
  while ((m = text.exec(html))) {
    if (inHole(m.index)) continue;
    push(m.index + 1, m[1]);
  }
  const alt = /\salt="([^"]*)"/g;
  while ((m = alt.exec(html))) {
    if (inHole(m.index)) continue;
    push(m.index + m[0].indexOf('"') + 1, m[1]);
  }
  // 从后往前替换，所以按位置升序收好、调用方 reverse 即可
  out.sort((a, b) => a.start - b.start);
  return out;
}

/** front matter 里也有要译的（title / description / keywords / ogdesc）。 */
const FRONT_KEYS = ["title", "description", "ogdesc", "keywords"];

const [, , cmd, page] = process.argv;
if (!cmd || !page) { console.error("用法: node src/i18n-tool.mjs <extract|apply> <page>"); process.exit(1); }

const zh = readFileSync(src(page, "zh"), "utf8");
const fmEnd = zh.startsWith("---\n") ? zh.indexOf("\n---\n") + 5 : 0;
const front = zh.slice(0, fmEnd);
const body = zh.slice(fmEnd);

if (cmd === "extract") {
  const phrases = {};
  for (const line of front.split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    if (FRONT_KEYS.includes(k)) phrases[`@${k}`] = { zh: line.slice(i + 1).trim(), en: "", tw: "" };
  }
  for (const s of segments(body)) {
    const t = s.text.trim();
    if (!phrases[t]) phrases[t] = { zh: t, en: "", tw: "" };
  }
  const existing = existsSync(dict(page)) ? JSON.parse(readFileSync(dict(page), "utf8")) : {};
  for (const k of Object.keys(phrases)) if (existing[k]) phrases[k] = existing[k];
  writeFileSync(dict(page), JSON.stringify(phrases, null, 2) + "\n");
  const todo = Object.values(phrases).filter((p) => !p.en || !p.tw).length;
  console.log(`${page}: ${Object.keys(phrases).length} 条短语，其中 ${todo} 条还没译 → src/i18n/${page}.json`);
  process.exit(0);
}

if (cmd !== "apply") { console.error("未知命令: " + cmd); process.exit(1); }

const table = JSON.parse(readFileSync(dict(page), "utf8"));
for (const lang of ["en", "tw"]) {
  // front matter
  let outFront = front;
  for (const k of FRONT_KEYS) {
    const e = table[`@${k}`];
    if (!e || !e[lang]) continue;
    outFront = outFront.replace(new RegExp(`^${k}:.*$`, "m"), `${k}: ${e[lang]}`);
  }
  // 正文：从后往前替换，免得位移错位
  let outBody = body;
  const segs = segments(body).reverse();
  let missed = 0;
  for (const s of segs) {
    const key = s.text.trim();
    const hit = table[key];
    if (!hit || !hit[lang]) { missed++; continue; }
    // 原样保留前后空白，只换中间那段字
    const lead = s.text.match(/^\s*/)[0];
    const tail = s.text.match(/\s*$/)[0];
    outBody = outBody.slice(0, s.start) + lead + hit[lang] + tail + outBody.slice(s.end);
  }
  /**
   * 指向**魔镜网站**的链接要跟着语言走：`/filters` → `/tw/filters`。
   *
   * ⚠️ 这一步必须在工具里，不能是「生成完再手动补一下」—— `apply` 每次都从简中那份
   * 重新生成，手动补的东西下一次就没了（已经丢过一次）。魔镜网站的地址形状和这个站
   * 一样：简中裸路径、其余带前缀（`site/src/lib/langPath.ts`）。
   */
  const W = "https://trade.kalandraeye.com";
  const pre = { en: "/en", tw: "/tw" }[lang] || "";
  if (pre) {
    outBody = outBody
      .replaceAll(`"${W}/filters"`, `"${W}${pre}/filters"`)
      .replaceAll(`"${W}/regex"`, `"${W}${pre}/regex"`)
      .replaceAll(`"${W}/"`, `"${W}${pre}/"`);
  }

  /**
   * ⚠️ **英文要在行内标签边界补空格。** 中文 `A<b>B</b>C` 不需要空格，照搬到英文就是
   * `downloadsandregex generatorwork` —— 页面照常渲染，只是读不成句。这一步只对英文做，
   * 中文加了反而是错的。
   *
   * `<em>` 不在名单里：`.more-item h4 em` 是个徽章（POE1 / POE2），自带 margin。
   */
  if (lang === "en") {
    outBody = outBody
      .replace(/<\/(b|strong|code|a)>(?=[A-Za-z0-9])/g, "</$1> ")
      .replace(/([A-Za-z0-9,.;:!?])(?=<(b|strong|code|a)[\s>])/g, "$1 ");
  }

  writeFileSync(src(page, lang), outFront + outBody);
  console.log(`  → ${page}.${lang}.html${missed ? `（${missed} 段没译，原样留着简中）` : ""}`);
}
