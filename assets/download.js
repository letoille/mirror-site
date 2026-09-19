/**
 * 下载页专属：网盘链接 + 提取码 + 下载计数。
 *
 * ⚠️ **必须 `defer`，而且排在 `shell.js` 后面** —— `animateTo` / `COUNTER_*` 是它挂在
 * window 上的。写成内联 `<script>` 的话会**先于**任何 defer 脚本执行，拿到 undefined，
 * 而那个错只在控制台里，页面看着完全正常，只是下载数永远是「—」。
 */
(function () {
  "use strict";

  var NETDISK = {
    quark: { url: "https://pan.quark.cn/s/88d3ae4da328?pwd=Tx4q", code: "Tx4q" },
  };

  Object.keys(NETDISK).forEach(function (k) {
    var d = NETDISK[k], btn = document.getElementById(k + "-btn");
    if (!btn) return;
    if (d && d.url) {
      btn.setAttribute("href", d.url);
    } else {
      btn.setAttribute("href", "#");
      btn.style.opacity = ".5";
      btn.style.pointerEvents = "none";
      var label = btn.querySelector("[data-label]") || btn;
      label.textContent = document.documentElement.getAttribute("data-lang") === "en" ? "Coming soon" : "即将开放";
    }
    if (d && d.code) {
      var box = document.getElementById("code-" + k);
      if (box) {
        box.style.display = "inline-flex";
        var slot = box.querySelector("[data-code]");
        if (slot) slot.textContent = d.code;
      }
    }
  });

  window.copyCode = function (k, e) {
    e.preventDefault();
    var d = NETDISK[k];
    if (!d || !d.code) return;
    try { navigator.clipboard && navigator.clipboard.writeText(d.code); } catch (_) {}
    var box = document.getElementById("code-" + k);
    if (!box) return;
    box.classList.add("copied");
    clearTimeout(box._t);
    box._t = setTimeout(function () { box.classList.remove("copied"); }, 1600);
  };

  /** 下载按钮按下去时记一次。GA 那条和我们自己的计数器各记各的。 */
  window.bump = function (method) {
    try { if (window.gtag) gtag("event", "app_download", { method: method }); } catch (e) {}
    fetch(window.COUNTER_BASE + "/hit/" + window.COUNTER_NS + "/downloads")
      .then(function (r) { return r.json(); })
      .then(function (d) { window.animateTo(document.getElementById("stat-downloads"), d.value); })
      .catch(function () {});
  };
})();
