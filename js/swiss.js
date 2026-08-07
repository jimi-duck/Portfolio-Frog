/* ═══════════════════════════════════════════════════════════════════════════
   James Ciclitira — motion layer
   Vanilla, no dependencies. Everything degrades to a static page.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lerp = function (a, b, n) { return a + (b - a) * n; };

  /* ── THEME ─────────────────────────────────────────────────────────────── */
  function theme() {
    var root = document.documentElement;
    var sync = function () {
      $$('.tt').forEach(function (b) { b.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark'); });
    };
    sync();
    $$('.tt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.classList.add('theme-anim');
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        sync();
        setTimeout(function () { root.classList.remove('theme-anim'); }, 400);
      });
    });
  }

  /* ── INTRO CURTAIN ─────────────────────────────────────────────────────── */
  function intro(done) {
    var el = $('#intro');
    if (!el || reduced) {
      if (el) el.classList.add('done');
      document.documentElement.classList.remove("introing");
      done();
      return;
    }
    var seen = false;
    try { seen = sessionStorage.getItem('introSeen') === '1'; } catch (e) {}
    if (seen) {
      el.classList.add('done');
      document.documentElement.classList.remove("introing");
      done();
      return;
    }
    try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}

    var ct = $('.ct', el);
    requestAnimationFrame(function () { el.classList.add('lift'); });

    var t0 = performance.now(), DUR = 900;
    (function tick(t) {
      var p = Math.min(1, (t - t0) / DUR);
      var eased = 1 - Math.pow(1 - p, 3);
      if (ct) ct.textContent = String(Math.round(eased * 100)).padStart(3, '0');
      if (p < 1) requestAnimationFrame(tick);
      else {
        $$('.col', el).forEach(function (c, i) { c.style.transitionDelay = (i * 0.06) + 's'; });
        el.classList.add('go');
        document.documentElement.classList.remove("introing");
        done();
        setTimeout(function () { el.classList.add('done'); }, 1500);
      }
    })(t0);
  }

  /* ── CURSOR ────────────────────────────────────────────────────────────── */
  function cursor() {
    var el = $('#cur');
    if (!el || !fine || reduced) return;
    document.documentElement.classList.add('cursor-on');
    var tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty;
    addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    document.addEventListener('mouseleave', function () { el.classList.add('hide'); });
    document.addEventListener('mouseenter', function () { el.classList.remove('hide'); });
    (function loop() {
      x = lerp(x, tx, 0.32); y = lerp(y, ty, 0.32);
      el.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('a,button,input,textarea,label,.circ,.cli-c');
      el.classList.toggle('big', !!t && !e.target.closest('.wrow'));
    });
  }

  /* ── SCROLL PROGRESS ───────────────────────────────────────────────────── */
  function progress() {
    var el = $('#prog');
    if (!el) return;
    var run = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      el.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
      document.body.classList.toggle('scrolled', scrollY > innerHeight * 0.6);
    };
    addEventListener('scroll', run, { passive: true });
    addEventListener('resize', run);
    run();
  }

  /* ── REVEALS ───────────────────────────────────────────────────────────── */
  var revealed = false;
  // Sweep anything sitting in the viewport that the observer has not caught —
  // covers layout shifts from late web fonts or images.
  function revealOnScreen() {
    $$('.r:not(.in),.rl:not(.in),.rw:not(.in),.rm:not(.in)').forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) e.classList.add('in');
    });
  }
  function reveals() {
    if (revealed) return;
    revealed = true;
    var els = $$('.r,.rl,.rw,.rm');
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    els.forEach(function (el) {
      var d = el.getAttribute('data-delay');
      if (d) el.style.transitionDelay = d + 'ms';
      // Anything already on screen reveals now rather than waiting on the
      // observer — above-the-fold content must never depend on a callback.
      var r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) el.classList.add('in');
      else io.observe(el);
    });
  }

  /* ── MARQUEE ───────────────────────────────────────────────────────────── */
  function marquee() {
    $$('.marq-t').forEach(function (track) {
      var unit = track.firstElementChild;
      if (!unit) return;
      // duplicate until the track is at least twice the viewport
      var guard = 0;
      while (track.scrollWidth < innerWidth * 2 && guard++ < 12) {
        track.appendChild(unit.cloneNode(true));
      }
      if (reduced) return;
      var half = 0, x = 0, base = parseFloat(track.dataset.speed || '0.055'), boost = 0, last = 0;
      var measure = function () { half = unit.getBoundingClientRect().width; };
      measure();
      addEventListener('resize', measure);
      addEventListener('scroll', function () {
        var d = scrollY - last; last = scrollY;
        boost = Math.max(-4, Math.min(4, boost + d * 0.05));
      }, { passive: true });
      var prev = performance.now();
      (function loop(t) {
        var dt = Math.min(48, t - prev); prev = t;
        boost *= 0.92;
        x -= (base + Math.abs(boost) * 0.08) * dt;
        if (half && x <= -half) x += half;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        requestAnimationFrame(loop);
      })(prev);
    });
  }

  /* ── NAV: active section + mobile menu ─────────────────────────────────── */
  function nav() {
    var links = $$('.nav-links a[href^="#"]');
    if (links.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (a) {
        var s = document.getElementById(a.getAttribute('href').slice(1));
        if (s) io.observe(s);
      });
    }
    var burger = $('.burger');
    if (!burger) return;
    var close = function () { document.body.classList.remove('menu-on'); };
    burger.addEventListener('click', function () { document.body.classList.toggle('menu-on'); });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', close); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ── GRID OVERLAY (press G) ────────────────────────────────────────────── */
  function gridOverlay() {
    var ov = $('#gridov');
    if (!ov) return;
    for (var i = 0; i < 12; i++) ov.appendChild(document.createElement('i'));
    addEventListener('keydown', function (e) {
      if (e.key !== 'g' && e.key !== 'G') return;
      var t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
      document.body.classList.toggle('grid-on');
    });
  }

  /* ── BOOT ──────────────────────────────────────────────────────────────── */
  function boot() {
    document.documentElement.dataset.swiss = '1';
    theme(); cursor(); progress(); marquee(); nav(); gridOverlay();
    intro(reveals);
    addEventListener('load', revealOnScreen);
    // failsafe: never let the curtain trap the page, and never leave content hidden
    setTimeout(function () {
      var el = $('#intro');
      if (el && !el.classList.contains('done')) { el.classList.add('go'); document.documentElement.classList.remove('introing'); }
      reveals();
      revealOnScreen();
    }, 3500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
