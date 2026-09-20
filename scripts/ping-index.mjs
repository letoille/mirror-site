/**
 * 发布后主动通知搜索引擎。在**本机或香港那台**上跑，url 列表取自 sitemap.xml。
 *
 *   BAIDU_TOKEN=xxx node scripts/ping-index.mjs
 *   node scripts/ping-index.mjs --dry-run
 *
 * 两条通道，各管各的：
 * - **IndexNow**（Bing / Yandex 等）：零配置。密钥就是仓库根下那个 `<key>.txt`
 *   的文件名，**它不是秘密** —— 协议要求它能被公开取到，用途只是证明「发推送的人
 *   控制着这个域名」。
 * - **百度普通收录**：要 token，在搜索资源平台 → 站点管理 → 普通收录 → API 提交 里拿。
 *   ⚠️ **token 是秘密，不进仓库** —— 这个仓库是公开的（下载页链的就是它的 Releases），
 *      写进去等于发布出去，谁都能拿它把你的每日配额刷空。放仓库根下的 `.env.local`
 *      （已 gitignore），一行 `BAIDU_TOKEN=xxx`；环境变量优先于它。
 *
 * ⚠️ Google **没有**这种推送接口（Indexing API 只收招聘和直播两类结构化数据，
 *    拿它推普通网页会被忽略）。Google 那边靠 sitemap + Search Console 手动请求编入。
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");
const HOST = new URL(S.ORIGIN).host;

const urls = [...readFileSync(join(ROOT, "sitemap.xml"), "utf8")
  .matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) { console.error("sitemap.xml 里一条 URL 都没有"); process.exit(1); }
console.log(`${urls.length} 条 URL，来自 sitemap.xml`);

/* ── IndexNow ──────────────────────────────────────────────────────────── */
const key = readdirSync(ROOT).find((f) => /^[0-9a-f]{8,128}\.txt$/i.test(f))?.replace(/\.txt$/, "");
if (!key) {
  console.warn("⚠ 仓库根下没找到 IndexNow 密钥文件（<key>.txt），跳过");
} else if (DRY) {
  console.log(`[dry-run] IndexNow key=${key}`);
} else {
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation: `${S.ORIGIN}/${key}.txt`, urlList: urls }),
  });
  // 200 收下了；202 收下但待校验密钥；422 多半是 key 文件取不到
  console.log(`IndexNow → ${r.status} ${r.statusText}`);
}

/* ── 百度普通收录 ──────────────────────────────────────────────────────── */
/* 环境变量优先，其次 `.env.local`（不进 git，见 .gitignore） */
function localEnv(key) {
  try {
    const m = readFileSync(join(ROOT, ".env.local"), "utf8")
      .match(new RegExp(`^\\s*${key}\\s*=\\s*(.+?)\\s*$`, "m"));
    return m && m[1].replace(/^["']|["']$/g, "");
  } catch { return null; }
}
const token = process.env.BAIDU_TOKEN || localEnv("BAIDU_TOKEN");
if (!token) {
  console.warn("⚠ 没有 BAIDU_TOKEN（环境变量或 .env.local），跳过百度推送");
} else if (DRY) {
  console.log("[dry-run] 百度推送");
} else {
  const r = await fetch(
    `http://data.zz.baidu.com/urls?site=${encodeURIComponent(S.ORIGIN)}&token=${token}`,
    { method: "POST", headers: { "Content-Type": "text/plain" }, body: urls.join("\n") });
  const body = await r.text();
  // 成功时回 {"remain":N,"success":M}；失败时回 {"error":N,"message":"..."}
  console.log(`百度 → ${r.status} ${body}`);
  // ⚠️ 百度的 message 都很短且不解释原因，这里翻一下，省得对着 "site init fail" 猜
  const HINT = {
    "site init fail":
      "这个站在搜索资源平台里还没验证通过。先去后台点「验证」（验证码已由 VERIFY.baidu 发在页面上），验证过了推送才收。",
    "token is not valid":
      "token 不对。在 站点管理 → 普通收录 → API 提交 重新复制，注意它是按站点发的，换了站点就换一个。",
    "site error":
      "site 和 token 对不上。site 要和后台登记的**一字不差**（协议头、有没有 www、结尾有没有斜杠都算）。",
    "over quota":
      "今天的配额用完了。配额按站点算，明天零点重置。",
  };
  const msg = (() => { try { return JSON.parse(body).message; } catch { return null; } })();
  if (HINT[msg]) console.log(`       ↳ ${HINT[msg]}`);
}
