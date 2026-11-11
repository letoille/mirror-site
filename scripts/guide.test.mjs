import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { ORIGIN } from "../src/site.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const route = "/guide/international-starter.html";
const variants = [
  { prefix: "", lang: "zh-Hans", schemaLang: "zh-CN", images: 8 },
  { prefix: "/en", lang: "en", schemaLang: "en", images: 7 },
  { prefix: "/tw", lang: "zh-Hant", schemaLang: "zh-TW", images: 8 },
  { prefix: "/ja", lang: "ja", schemaLang: "ja", images: 7 },
];
const htmlAt = path => readFileSync(join(root, (path.endsWith("/") ? path + "index.html" : path).replace(/^\//, "")), "utf8");
const localFile = url => {
  const parsed = new URL(url, ORIGIN);
  assert.equal(parsed.origin, ORIGIN);
  const path = parsed.pathname.endsWith("/") ? parsed.pathname + "index.html" : parsed.pathname;
  return resolve(root, "." + path);
};

for (const variant of variants) {
  const path = variant.prefix + route;
  const html = htmlAt(path);
  test(`${path}: canonical, translations and social metadata`, () => {
    assert.ok(html.includes(`<html lang="${variant.lang}"`));
    assert.ok(html.includes(`<link rel="canonical" href="${ORIGIN + path}"`));
    assert.ok(html.includes('<meta property="og:type" content="article"'));
    assert.ok(/<title>[^<]+<\/title>/.test(html));
    assert.ok(/<meta name="description" content="[^"]+"/.test(html));
    const alts = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
      .map(([, lang, href]) => [lang, href]));
    assert.deepEqual(alts, {
      "zh-Hans": ORIGIN + route,
      en: ORIGIN + "/en" + route,
      "zh-Hant": ORIGIN + "/tw" + route,
      ja: ORIGIN + "/ja" + route,
      "x-default": ORIGIN + route,
    });
    const image = html.match(/<meta property="og:image" content="([^"]+)"/)[1];
    assert.ok(existsSync(localFile(image)));
    assert.ok(html.includes(`<meta name="twitter:image" content="${image}"`));
    if (["en", "ja"].includes(variant.lang)) assert.ok(!/VPatchGGPK|PoeChinese3|id="localization"/.test(html));
  });

  test(`${path}: Article and BreadcrumbList structured data`, () => {
    const data = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
      .map(([, json]) => JSON.parse(json));
    const article = data.find(item => item["@type"] === "Article");
    const breadcrumb = data.find(item => item["@type"] === "BreadcrumbList");
    assert.ok(article);
    assert.equal(article.inLanguage, variant.schemaLang);
    assert.equal(article.url, ORIGIN + path);
    assert.equal(article.mainEntityOfPage["@id"], ORIGIN + path);
    assert.equal(article.encoding.encodingFormat, "text/markdown");
    assert.equal(article.encoding.contentUrl, (ORIGIN + path).replace(/\.html$/, ".md"));
    assert.match(article.datePublished, /^\d{4}-\d{2}-\d{2}$/);
    for (const image of article.image) assert.ok(existsSync(localFile(image)));
    assert.deepEqual(breadcrumb.itemListElement.map(item => item.position), [1, 2, 3]);
    assert.equal(breadcrumb.itemListElement.at(-1).item, ORIGIN + path);
  });

  test(`${path}: machine-readable version and stable section anchors`, () => {
    const markdownUrl = (ORIGIN + path).replace(/\.html$/, ".md");
    assert.ok(html.includes(`<link rel="alternate" type="text/markdown" href="${markdownUrl}"`));
    const markdown = readFileSync(localFile(markdownUrl), "utf8");
    assert.ok(markdown.includes(`> Canonical: ${ORIGIN + path}`));
    assert.ok(markdown.includes(`> Language: ${variant.lang}`));
    assert.ok(!/<(?:figure|picture|source|img|kbd|script|style)\b/.test(markdown));
    const headings = [...html.matchAll(/<h[1-3]\b([^>]*)>/g)];
    const ids = headings.map(([, attrs]) => /\bid="([^"]+)"/.exec(attrs)?.[1]);
    assert.ok(ids.length > 5 && ids.every(Boolean));
    assert.equal(new Set(ids).size, ids.length);
  });

  test(`${path}: screenshots and internal links exist`, () => {
    const main = html.match(/<main\b[\s\S]*?<\/main>/)[0];
    const pictures = [...main.matchAll(/<picture>([\s\S]*?)<\/picture>/g)];
    assert.equal(pictures.length, variant.images);
    for (const [, picture] of pictures) {
      assert.ok(/<source type="image\/avif" srcset="\/[^"]+\.avif"/.test(picture));
      assert.ok(/<img[^>]+width="\d+" height="\d+"/.test(picture));
      assert.ok(/alt="[^"]+"/.test(picture));
    }
    for (const [, , url] of main.matchAll(/\b(href|src|srcset)="([^"]+)"/g)) {
      if (url.startsWith("/")) assert.ok(existsSync(localFile(url)), `Missing local resource: ${url}`);
    }
    assert.ok(!/drafts\/|配图待补|English draft|中文草稿/.test(main));
  });
}

test("all four guides are discoverable from indexes, language links and sitemap", () => {
  const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  for (const { prefix } of variants) {
    const path = prefix + route;
    assert.equal(urls.filter(url => url === ORIGIN + path).length, 1);
    const discoveryPage = prefix === "/ja" ? "/en" + route : prefix + "/guide/";
    assert.ok(htmlAt(discoveryPage).includes(`href="${path}"`));
  }
  assert.ok(!urls.includes(ORIGIN + "/ja/"));
  assert.ok(!urls.includes(ORIGIN + "/ja/guide/"));
  const robots = readFileSync(join(root, "robots.txt"), "utf8");
  assert.ok(robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`));
  assert.ok(!/Disallow:\s*\/guide/.test(robots));
});

test("Japanese article navigation never invents Japanese site sections", () => {
  const html = htmlAt("/ja" + route);
  assert.ok(html.includes('<nav class="nav" id="nav" lang="en"'));
  assert.ok(html.includes('href="/en/download.html"'));
  for (const [, href] of html.matchAll(/\bhref="(\/ja\/[^"#]+)"/g)) {
    assert.ok(["/ja" + route, "/ja" + route.replace(/\.html$/, ".md")].includes(href), href);
  }
  assert.ok(!existsSync(join(root, "ja/index.html")));
});

test("Traditional Chinese localization targets tw language and PIN", () => {
  const html = htmlAt("/tw" + route);
  assert.ok(html.includes('語系選擇 <strong>tw</strong>'));
  assert.ok(html.includes('<strong>tw PIN</strong>'));
});

test("llms.txt lists the four source-derived Markdown guides and valid references", () => {
  const index = readFileSync(join(root, "llms.txt"), "utf8");
  for (const { prefix } of variants) {
    assert.ok(index.includes((ORIGIN + prefix + route).replace(/\.html$/, ".md")));
  }
  for (const [, url] of index.matchAll(/\]\((https?:\/\/[^)]+)\)/g)) {
    assert.ok(existsSync(localFile(url)), url);
  }
});

test("non-article pages retain website social metadata", () => {
  const html = htmlAt("/guide/");
  assert.ok(html.includes('<meta property="og:type" content="website"'));
  assert.ok(html.includes(`<meta property="og:image" content="${ORIGIN}/assets/logo.png"`));
});
