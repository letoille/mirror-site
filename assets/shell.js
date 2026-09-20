/**
 * 全站共用行为。**每个页面都加载这一份**，所以每一段都必须能在「页面上没有它要找
 * 的元素」时安静地什么都不做 —— 指南页没有下载计数器，首页没有计时器 mock。
 *
 * ⚠️ 这里**没有 `setLang` 了**。语言从前是运行时切的（一份 HTML 里塞两套文案，CSS
 * 挑一套显示），现在每种语言是构建期物化出来的**各自一份 HTML**：`/` 简中、`/en/`
 * 英文、`/tw/` 繁中。运行时再切一次的话，声明的 `<html lang>` 和正文就会对不上 ——
 * 那正是从前那套的毛病，也是搜索引擎会判的东西。
 */
(function () {
  "use strict";

  var lang = document.documentElement.getAttribute("data-lang") || "zh";

  /* ---- 页脚年份 ---- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---- 复制 QQ 群号。onclick 里直接叫它，所以必须挂在 window 上 ---- */
  window.copyQQ = function (e) {
    e.preventDefault();
    var btn = document.getElementById("qq-btn");
    if (!btn) return;
    try { navigator.clipboard && navigator.clipboard.writeText(btn.getAttribute("title") || ""); } catch (_) {}
    btn.classList.add("copied");
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { btn.classList.remove("copied"); }, 1600);
  };

  /* ---- 余烬粒子 ---- */
  var embers = document.getElementById("embers");
  if (embers) {
    var n = window.innerWidth < 700 ? 10 : 22;
    for (var i = 0; i < n; i++) {
      var el = document.createElement("div");
      el.className = "ember";
      var dur = 7 + Math.random() * 9;
      el.style.left = Math.random() * 100 + "%";
      el.style.animationDuration = dur + "s";
      el.style.animationDelay = -Math.random() * dur + "s";
      el.style.setProperty("--drift", Math.random() * 80 - 40 + "px");
      el.style.opacity = 0.3 + Math.random() * 0.5;
      var sz = 2 + Math.random() * 2;
      el.style.width = sz + "px";
      el.style.height = sz + "px";
      embers.appendChild(el);
    }
  }

  /* ---- 滚动显形 ---- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { ro.observe(el); });
  }

  /* ---- 数字滚动 ---- */
  window.COUNTER_BASE = "https://abacus.jasoncameron.dev";
  window.COUNTER_NS = "mirror-kalandraeye-com";
  function fmtCount(v) {
    try { return Number(v).toLocaleString(); } catch (e) { return String(v); }
  }
  function animateTo(el, target) {
    if (!el) return;
    target = parseInt(target, 10) || 0;
    var start = null, from = parseInt(el.getAttribute("data-count"), 10) || 0, dur = 1200;
    el.setAttribute("data-count", target);
    (function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtCount(Math.round(from + (target - from) * e));
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  window.animateTo = animateTo;

  var counted = document.querySelectorAll("[data-count]");
  if (counted.length) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        // 下载量那一格由下面那次 fetch 填，别用它自己的初始值滚一遍
        if (en.target.id !== "stat-downloads") animateTo(en.target, en.target.getAttribute("data-count"));
        co.unobserve(en.target);
      });
    }, { threshold: 0.5 });
    counted.forEach(function (el) { co.observe(el); });
  }

  var dl = document.getElementById("stat-downloads");
  if (dl) {
    fetch(window.COUNTER_BASE + "/get/" + window.COUNTER_NS + "/downloads")
      .then(function (r) { return r.ok ? r.json() : { value: 0 }; })
      .then(function (d) { animateTo(dl, d.value || 0); })
      .catch(function () { dl.textContent = "0"; });
  }

  /* ---- 演示截图：标记里自带 <source>/<img src>，这里只负责「解码成功就显出来」 ----
     ⚠️ `.ready` 要挂在 <picture> 上，不是里面的 <img>：CSS 那两条是兄弟选择器，而
     `.demo-ph` / `.demo-hint` 是 <picture> 的兄弟。文件不在时 `load` 永不触发，底下
     那层 CSS 画的 mock 原样留着 —— 所以截图可以一张一张补。 */
  document.querySelectorAll(".demo picture > img").forEach(function (img) {
    var pic = img.parentElement;
    if (img.complete && img.naturalWidth > 0) { pic.classList.add("ready"); return; }
    img.addEventListener("load", function () { pic.classList.add("ready"); });
  });

  /* ---- 首页 hero 轮播 ----------------------------------------------------
   * ⚠️ **图片幻灯必须先证明自己能显示，才算进轮播。** 直接把四张都排进去的话，
   * 缺图那几张就是一块空白 —— 而轮播会尽职地停在那块空白上五秒。所以这里的顺序
   * 是：先只认 `.is-mock`（CSS 画的那张，永远在），图片 `load` 成功才 `reveal()`
   * 把它加回来，`error` 则整张移除。截图因此可以一张一张补，补一张多一张。
   *
   * ⚠️ 只有一张时不画圆点、不自动播 —— 一个「1 / 1」的轮播是在提示用户这里缺东西。 */
  document.querySelectorAll(".hero-deck").forEach(function (deck) {
    var track = deck.querySelector(".hero-track");
    var dots = deck.querySelector(".hero-dots");
    if (!track) return;
    var all = Array.prototype.slice.call(track.children);
    var live = [];
    var at = 0;
    var timer = null;
    var wait = parseInt(deck.getAttribute("data-interval"), 10) || 5000;
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ⚠️ **deck 里的 <img> 不能写 `loading="lazy"`。**
     * 下面一行把还没加载的幻灯 `hidden` 掉（`display:none`），而 `display:none`
     * 里的 lazy 图浏览器**根本不去取** —— 于是 `load` 永不触发、永不 reveal，
     * 死锁成一个空框。症状是「图片没显示」，而文件明明在、路径也对。 */
    all.forEach(function (el) {
      if (el.classList.contains("is-mock")) { live.push(el); return; }
      el.hidden = true;                                  // 先不占布局
      var img = el.querySelector("img");
      if (!img) return;
      var ok = function () { reveal(el); };
      var no = function () { el.remove(); };
      if (img.complete) { (img.naturalWidth > 0 ? ok : no)(); return; }
      img.addEventListener("load", ok);
      img.addEventListener("error", no);
    });

    function reveal(el) {
      if (live.indexOf(el) >= 0) return;
      el.hidden = false;
      // 按它在 DOM 里的原始次序插回去，而不是按加载完成的先后
      live = all.filter(function (x) { return x === el || live.indexOf(x) >= 0; });
      render();
      start();
    }

    function render() {
      // 没加载成功的那些不能留在轨道里，否则 translateX 会按它们的宽度错位
      live.forEach(function (el, i) { el.style.order = String(i); });
      at = Math.min(at, live.length - 1);
      track.style.transform = "translateX(" + -at * 100 + "%)";
      if (!dots) return;
      if (live.length < 2) { dots.innerHTML = ""; return; }
      if (dots.children.length !== live.length) {
        dots.innerHTML = "";
        live.forEach(function (_, i) {
          var b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", String(i + 1));
          b.addEventListener("click", function () { at = i; render(); start(); });
          dots.appendChild(b);
        });
      }
      Array.prototype.forEach.call(dots.children, function (b, i) {
        if (i === at) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
    }

    function start() {
      clearInterval(timer);
      if (still || live.length < 2) return;
      timer = setInterval(function () { at = (at + 1) % live.length; render(); }, wait);
    }

    // 读者在看就别动它
    deck.addEventListener("mouseenter", function () { clearInterval(timer); });
    deck.addEventListener("mouseleave", start);
    deck.addEventListener("focusin", function () { clearInterval(timer); });
    deck.addEventListener("focusout", start);

    render();
    start();
  });

  /* ---- 计时器卡片里那个会走的表（纯装饰） ---- */
  var tg = document.querySelector(".t-global"), tm = document.querySelector(".t-map");
  if (tg && tm) {
    var gs = 12 * 60 + 34, ms = 2 * 60 + 15;
    var fmt = function (s) {
      var mm = Math.floor(s / 60), ss = s % 60;
      return (mm < 10 ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss;
    };
    setInterval(function () { gs++; ms = (ms + 1) % (9 * 60); tg.textContent = fmt(gs); tm.textContent = fmt(ms); }, 1000);
  }

  /* ---- 大卡片的 3D 倾斜 ---- */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".feature").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
        card.style.transform = "perspective(1000px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---- 语言提示条 ------------------------------------------------------------
   *
   * 浏览器语言和当前这一份对不上时，在顶部挂一行「有你这门语言的版本」，**点了才走**。
   *
   * ⚠️ **不做自动跳转。** hreflang 已经把三份的对应关系告诉爬虫了，自动跳转对 SEO
   *    只有风险没有收益：Google 抓取时带的 `Accept-Language` 是 `en`，跳转会让它
   *    再也看不到简中首页，而那几个 URL 恰恰是已经被收录的。
   *
   * ⚠️ 提示条由 JS 插入、不在发出去的 HTML 里 —— 爬虫拿到的每一份都干干净净，
   *    也不会把另一门语言的字算进这一页的正文。
   *
   * ⚠️ 文案用**目标语言**写：读者看不懂当前这一页，才需要这条提示。
   */
  (function langHint() {
    var KEY = "mirror-lang-choice";
    var TXT = {
      zh: { msg: "本站有简体中文版本", go: "切换", close: "关闭" },
      tw: { msg: "本站有繁體中文版本", go: "切換", close: "關閉" },
      en: { msg: "This site is available in English", go: "Switch", close: "Dismiss" }
    };
    /* `<html lang>` → 我们内部那三个键 */
    var here = { "zh-CN": "zh", "zh-Hant": "tw", en: "en" }[document.documentElement.lang];
    if (!here) return;

    try { if (localStorage.getItem(KEY)) return; } catch (e) {}

    var want = (function () {
      var ls = navigator.languages || [navigator.language || ""];
      for (var i = 0; i < ls.length; i++) {
        var l = String(ls[i]).toLowerCase();
        if (l.indexOf("zh") === 0) {
          /* ⚠️ 繁简要按**地区**分，不能只看 `zh`：`zh-TW` / `zh-HK` / `zh-MO` 和
             显式的 `zh-hant` 都该去繁中，其余（`zh`、`zh-CN`、`zh-SG`）去简中。 */
          return /hant|tw|hk|mo/.test(l) ? "tw" : "zh";
        }
        if (l.indexOf("en") === 0) return "en";
      }
      return "en";   /* 既不是中文也不是英文：英文版更可能读得懂 */
    })();
    if (want === here) return;

    /* 当前地址去掉语言前缀，再换上目标语言的 —— 停在哪一页就切哪一页，不回首页 */
    var path = location.pathname.replace(/^\/(en|tw)(?=\/|$)/, "") || "/";
    var href = (want === "zh" ? "" : "/" + want) + path;

    var t = TXT[want];
    var bar = document.createElement("div");
    bar.className = "lang-hint";
    bar.setAttribute("lang", { zh: "zh-CN", tw: "zh-Hant", en: "en" }[want]);
    var a = document.createElement("a");
    a.href = href; a.textContent = t.go;
    var x = document.createElement("button");
    x.type = "button"; x.textContent = "×";
    x.setAttribute("aria-label", t.close);
    bar.appendChild(document.createTextNode(t.msg + " "));
    bar.appendChild(a);
    bar.appendChild(x);

    /* ⚠️ **两个地方都要记**：`localStorage` 给这条提示条自己用，cookie 给 nginx 用
       —— 裸根 `/` 的按语言跳转在服务器上判，而服务器读不到 localStorage。少写一个，
       用户就会「明明选过了，下次打开首页又被送去另一份」。 */
    var remember = function (lang) {
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      document.cookie = "mirror_lang=" + (lang || here) +
        ";path=/;max-age=31536000;SameSite=Lax";
    };
    a.addEventListener("click", function () { remember(want); });
    x.addEventListener("click", function () { remember(here); bar.remove(); });
    /* 用过语言切换器 = 已经做出选择，别再提示 */
    document.querySelectorAll(".lang-switch a").forEach(function (el) {
      el.addEventListener("click", function () {
        remember({ "zh-CN": "zh", "zh-Hant": "tw", en: "en" }[el.getAttribute("hreflang")] || here);
      });
    });
    document.body.insertBefore(bar, document.body.firstChild);
  })();

  /* ---- 功能卡的图点击展开 ------------------------------------------------
   *
   * 卡片里的框只有 600px 宽，而截图多是 1280 —— 在卡片上看不清的细节，点开按
   * 原始像素看。
   *
   * ⚠️ **只放大到原始尺寸，不超过。** 小图（计时器 200×149）点开还是那么大，
   *    这是有意的：UI 截图放大就是糊，给一张糊的大图不如给一张清楚的小图。
   *
   * ⚠️ 用 `currentSrc` 不用 `src`：`<picture>` 选中的可能是 avif，而 `src` 上
   *    写的是 webp 那一份，拿 `src` 会让浏览器再下一遍另一种格式。
   */
  (function lightbox() {
    var pics = document.querySelectorAll(".demo picture");
    if (!pics.length) return;
    var box = null;

    function close() {
      if (!box) return;
      box.remove(); box = null;
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }

    function open(img) {
      close();
      box = document.createElement("div");
      box.className = "lightbox";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.setAttribute("aria-label", img.alt || "");
      var big = document.createElement("img");
      big.src = img.currentSrc || img.src;
      big.alt = img.alt || "";
      box.appendChild(big);
      box.addEventListener("click", close);
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      document.body.appendChild(box);
      box.focus && box.focus();
    }

    pics.forEach(function (pic) {
      var img = pic.querySelector("img");
      if (!img) return;
      // ⚠️ 图还没到（或 404）时别让它可点 —— 那会打开一个空灯箱
      var arm = function () {
        pic.classList.add("zoomable");
        pic.setAttribute("tabindex", "0");
        pic.setAttribute("role", "button");
      };
      if (img.complete && img.naturalWidth > 0) arm();
      else img.addEventListener("load", arm);
      pic.addEventListener("click", function () {
        if (pic.classList.contains("zoomable")) open(img);
      });
      pic.addEventListener("keydown", function (e) {
        if ((e.key === "Enter" || e.key === " ") && pic.classList.contains("zoomable")) {
          e.preventDefault(); open(img);
        }
      });
    });
  })();
})();
