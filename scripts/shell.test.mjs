import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const shell = readFileSync(new URL("../assets/shell.js", import.meta.url), "utf8");
const languages = [
  { tag: "zh-Hans", key: "zh", prefix: "", browser: "zh-CN" },
  { tag: "en", key: "en", prefix: "/en", browser: "en-US" },
  { tag: "zh-Hant", key: "tw", prefix: "/tw", browser: "zh-TW" }
];

function element(attrs = {}) {
  return {
    children: [], events: {},
    getAttribute(name) { return attrs[name]; },
    setAttribute(name, value) { attrs[name] = value; },
    addEventListener(name, callback) { this.events[name] = callback; },
    appendChild(child) { this.children.push(child); },
    insertBefore(child) { this.children.unshift(child); },
    remove() { this.removed = true; }
  };
}

function load(page, browser, storage) {
  const file = page.endsWith("/") ? page + "index.html" : page;
  const html = readFileSync(new URL(".." + file, import.meta.url), "utf8");
  const switcher = html.match(/<div class="lang-switch"[^>]*>([\s\S]*?)<\/div>/)[1];
  const links = [...switcher.matchAll(/<a\b([^>]+)>/g)].map(([, attrs]) =>
    element(Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]))));
  let choice = storage === "saved" ? "1" : null;
  const document = {
    documentElement: { lang: html.match(/<html lang="([^"]+)"/)[1], getAttribute() {} },
    cookie: "mirror_lang=en", body: element(),
    getElementById() { return null; },
    querySelector() { return null; },
    querySelectorAll(selector) { return selector === ".lang-switch a" ? links : []; },
    createElement: () => element(),
    createTextNode: text => ({ textContent: text })
  };
  runInNewContext(shell, {
    document, window: { matchMedia: () => ({ matches: true }) },
    navigator: { languages: [browser] }, location: { pathname: page },
    localStorage: {
      getItem() { if (storage === "blocked") throw new Error("blocked"); return choice; },
      setItem(key, value) { if (storage === "blocked") throw new Error("blocked"); choice = value; }
    }
  });
  return { document, links };
}

for (const current of languages) {
  for (const path of ["/", "/guide/market.html"]) {
    for (const state of ["matching", "hint", "saved", "blocked"]) {
      test(`${current.prefix + path}: language switch with ${state}`, () => {
        const browser = state === "matching" ? current.browser : current.key === "en" ? "zh-CN" : "en-US";
        const { document, links } = load(current.prefix + path, browser, state);
        assert.equal(document.body.children.length, state === "matching" || state === "saved" ? 0 : 1);
        assert.equal(links.length, 3);
        for (const target of languages) {
          const link = links.find(el => el.getAttribute("hreflang") === target.tag);
          assert.equal(link.getAttribute("href"), target.prefix + path);
          assert.equal(typeof link.events.click, "function");
          link.events.click();
          assert.equal(document.cookie, `mirror_lang=${target.key};path=/;max-age=31536000;SameSite=Lax`);
        }
      });
    }
  }
}

for (const dismiss of [false, true]) {
  test(`language hint ${dismiss ? "dismisses" : "switches"} and remembers preference`, () => {
    const { document } = load("/en/guide/market.html", "zh-CN", "hint");
    const bar = document.body.children[0];
    const [, link, close] = bar.children;
    assert.equal(link.href, "/guide/market.html");
    (dismiss ? close : link).events.click();
    assert.equal(document.cookie, `mirror_lang=${dismiss ? "en" : "zh"};path=/;max-age=31536000;SameSite=Lax`);
    if (dismiss) assert.equal(bar.removed, true);
  });
}
