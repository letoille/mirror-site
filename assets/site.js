/* Shared behaviors for secondary pages (download / about / contact). */
(function () {
  'use strict';

  /* language */
  window.setLang = function (lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh');
    var z = document.getElementById('lang-zh'), e = document.getElementById('lang-en');
    if (z) z.classList.toggle('active', lang === 'zh');
    if (e) e.classList.toggle('active', lang === 'en');
    try { localStorage.setItem('mirror-lang', lang); } catch (_) {}
  };
  (function initLang() {
    var saved; try { saved = localStorage.getItem('mirror-lang'); } catch (_) {}
    window.setLang(saved || (navigator.language && navigator.language.toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en'));
  })();

  /* counters (Abacus) */
  window.COUNTER_BASE = 'https://abacus.jasoncameron.dev';
  window.COUNTER_NS = 'mirror-kalandraeye-com';
  window.fmtCount = function (n) { try { return Number(n).toLocaleString(); } catch (_) { return String(n); } };
  window.animateTo = function (el, target) {
    if (!el) return; target = parseInt(target, 10) || 0;
    var start = null, from = parseInt(el.getAttribute('data-count'), 10) || 0, dur = 1000;
    el.setAttribute('data-count', target);
    function step(ts) {
      if (!start) start = ts; var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = window.fmtCount(Math.round(from + (target - from) * e));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  /* QQ group copy */
  window.copyQQ = function (e) {
    e.preventDefault();
    try { navigator.clipboard && navigator.clipboard.writeText('1057145969'); } catch (_) {}
    var b = document.getElementById('qq-btn'); if (!b) return;
    b.classList.add('copied'); clearTimeout(b._t);
    b._t = setTimeout(function () { b.classList.remove('copied'); }, 1600);
  };

  /* ambient embers */
  (function embers() {
    var c = document.getElementById('embers'); if (!c) return;
    var n = window.innerWidth < 700 ? 8 : 16;
    for (var i = 0; i < n; i++) {
      var e = document.createElement('div'); e.className = 'ember';
      var dur = 7 + Math.random() * 9;
      e.style.left = (Math.random() * 100) + '%';
      e.style.animationDuration = dur + 's';
      e.style.animationDelay = (-Math.random() * dur) + 's';
      e.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
      e.style.opacity = 0.3 + Math.random() * 0.5;
      var s = 2 + Math.random() * 2; e.style.width = s + 'px'; e.style.height = s + 'px';
      c.appendChild(e);
    }
  })();

  /* reveal on scroll */
  (function reveal() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  })();

  /* year */
  var y = document.getElementById('year'); if (y) y.textContent = '2026';
})();
