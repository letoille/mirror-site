/**
 * 产物自检。`node build.mjs && node check.mjs`。
 *
 * 这几项都是**静默**故障：页面照常渲染，只有读者或爬虫看得出不对。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (d, out = []) => {
  for (const n of readdirSync(d)) {
    const f = join(d, n);
    if (statSync(f).isDirectory()) { if (!["node_modules", "src", ".git", "assets", "demos", "download", "preview", "shots"].includes(n)) walk(f, out); }
    else if (n.endsWith(".html")) out.push(f);
  }
  return out;
};

/** 英文页上**合法**的中日韩字符：语言切换器的按钮、品牌名、法定备案号。 */
/* ⚠️ 备案号**不在**白名单里：它现在只发给简中那一份（`build.mjs` 的 `beian`），
   所以它出现在英文页上一定是回归，白名单会把这件事盖掉。 */
const CJK_OK = /^(简体|繁體|魔镜|魔鏡)$/;

const VOID = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
function unbalanced(html) {
  const stack = [];
  for (const m of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>/gi)) {
    const [, close, tag, self] = m;
    const t = tag.toLowerCase();
    if (VOID.has(t) || self) continue;
    if (t === "script" || t === "style") continue;
    if (close) { if (stack.pop() !== t) return `</${t}> 对不上`; }
    else stack.push(t);
  }
  return stack.length ? `未闭合 ${stack.slice(0, 3)}` : null;
}

let bad = 0;
for (const f of walk(".").sort()) {
  const s = readFileSync(f, "utf8");
  // ⚠️ 带 `lang` 的行内元素是**有意引用的外文**（英文指南里举的中文物品名），
  //    连内容一起摘掉再查 —— 否则正确的做法会被报成错。
  const body = s
    .replace(/<(script|style)[\s\S]*?<\/\1>/g, "")
    // ⚠️ **只剥行内元素。** 写成 `<([a-z]+)` 的话 `<html lang="en">` 也会匹配，
    //    于是整份文档被剥掉、下面的中文检查从此空转 —— 它报 ✓ 报了好几轮，
    //    直到英文页的 <title> 退回简中才被发现。
    .replace(/<(span|b|i|em|code|abbr)[^>]*\slang="[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, " ");
  const text = body.replace(/<[^>]*>/g, " ");
  const iss = [];

  if (/__[A-Z_]+__/.test(s)) iss.push("模板占位没替换");
  for (const m of s.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { iss.push("JSON-LD 解析失败"); }
  }
  const ub = unbalanced(body);
  if (ub) iss.push(ub);

  /* ⚠️ **结构化数据也要按语言分。** 上面那个中文检查是从 `body` 上做的，而 `body`
     第一步就把 `<script>` 整块剥掉了 —— 所以三种语言共用同一份中文 JSON-LD 时，
     它一声不响。页面正文是翻译好的，只有喂给爬虫的那份不是，浏览器里看不出来，
     而 Google 拿 `inLanguage` 和正文比对，对不上就把整块丢掉。 */
  for (const m of s.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
    let d; try { d = JSON.parse(m[1]); } catch { continue; }
    const want = { en: "en", "zh-Hant": "zh-TW", "zh-CN": "zh-CN" }[
      (s.match(/<html lang="([^"]+)"/) || [])[1]];
    /* ⚠️ 只管**字符串**形态的 `inLanguage`。数组是另一回事 —— `SoftwareApplication`
       上的 `["zh-CN","zh-TW","en"]` 说的是「这个应用支持哪几种语言」，和这一页
       是哪种语言无关，拿页面语言去比会把正确的数据报成错。 */
    if (typeof d.inLanguage === "string" && want && d.inLanguage !== want) {
      iss.push(`JSON-LD inLanguage=${d.inLanguage}，页面是 ${want}`);
    }
    if (/<html lang="en"/.test(s) && /[\u4e00-\u9fff]/.test(m[1])) {
      iss.push("英文页的 JSON-LD 里有中文");
    }
  }

  if (/<html lang="en"/.test(s)) {
    // ⚠️ 英文页里的中文是**没走翻译表**的信号（`alt`、写死在壳里的字…），除了白名单那几个
    const stray = [...new Set([...text.matchAll(/[^\s<>]*[一-鿿　-〿＀-￯][^\s<>]*/g)].map((m) => m[0]))]
      .filter((w) => !CJK_OK.test(w));
    if (stray.length) iss.push(`英文页有未翻译的中文：${stray.slice(0, 4).join(" ")}`);
    // ⚠️ 中文 `A<b>B</b>C` 不需要空格，英文需要 —— 漏了就是 `downloadsandregex`
    if (/<\/(b|strong|code|a)>(?=[A-Za-z0-9])/.test(body)) iss.push("英文行内标签边界粘连");
  }
  /* ⚠️ 站内地址必须是**根绝对**的。相对路径在根目录那几页恰好解析对，所以症状
     只出现在 `/guide/*`、`/en/*`、`/tw/*`：它们去要 `/guide/assets/site.css`，
     404，整页零样式 —— 而 HTML 本身合法，别的检查一条都不会响。栽过一次，
     起因是指纹拼接时把 `/assets/…` 的前导斜杠吃掉了（见 build.mjs 的 ASSETS）。 */
  for (const [, a, v] of s.matchAll(/\b(href|src|srcset)="([^"]+)"/g)) {
    if (/^([a-z]+:|\/|#)/i.test(v)) continue;
    iss.push(`${a} 不是根绝对路径：${v}`);
    break;
  }

  /* ⚠️ 轮播（`.hero-deck`）里的图**不能是 lazy 的**：幻灯在加载完成前是
     `hidden`（`display:none`），而 `display:none` 里的 lazy 图浏览器根本不去取
     —— `load` 永不触发、永不 reveal，死锁成一个空框。症状是「图片没显示」，
     而文件明明在、路径也对，从 HTML 上一点看不出来。 */
  for (const m of s.matchAll(/<div class="hero-deck[\s\S]*?<\/div>\s*<\/div>/g)) {
    if (/loading="lazy"/.test(m[0])) { iss.push("轮播里的图带了 loading=lazy，它永远不会加载"); break; }
  }

  // hreflang 不能指向不存在的地址
  const alts = [...s.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)];
  if (alts.length && !alts.some(([, l]) => l === "x-default")) iss.push("hreflang 缺 x-default");

  if (iss.length) { bad++; console.error(`✗ ${f}: ${iss.join("; ")}`); }
}
console.log(bad ? `\n${bad} 份有问题` : "✓ 产物自检通过");
process.exit(bad ? 1 : 0);
