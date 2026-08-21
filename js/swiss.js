/* ═══════════════════════════════════════════════════════════════════════════
   James Ciclitira — motion layer
   Vanilla, no dependencies. Everything degrades to a static page.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

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

  /* The custom cursor lived here. It was removed: replacing the system pointer
     means owning its legibility over every ground the page has — paper, the ink
     band, the footer, a greyscale portrait — and it took `cursor:none` off the
     text fields with it. Hover is communicated by the accent swap and the
     hairline underline already on every link. */

  /* ── SCROLL PROGRESS ───────────────────────────────────────────────────── */
  function progress() {
    var el = $('#prog');
    if (!el) return;
    var run = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      el.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
      // the game launcher fades in once you are past the hero — see game.css
      document.body.classList.toggle('scrolled', scrollY > innerHeight * 0.6);
    };
    addEventListener('scroll', run, { passive: true });
    addEventListener('resize', run);
    run();
  }

  /* ── SECTION REVEAL ────────────────────────────────────────────────────── */
  /* One treatment, applied to sections. Anything marked [data-reveal] fades and
     rises once as it arrives; its contents are not observed and do not animate
     separately. The per-element ladder this replaced observed every paragraph,
     figure, rule and image on the page and staggered them with data-delay,
     which meant six things moving in one viewport.

     A section is a large target, so the observer fires on a low threshold: at
     0.04 a section taller than the viewport would otherwise have to be almost
     entirely past the fold before 4% of it counted as visible. */
  var SEL = '[data-reveal]';
  var revealed = false;

  // Sweep anything already in view that the observer has not caught — covers
  // layout shifts from late web fonts or images.
  function revealOnScreen() {
    $$(SEL + ':not(.in)').forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) e.classList.add('in');
    });
  }

  function reveals() {
    if (revealed) return;
    revealed = true;
    var els = $$(SEL);
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
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) {
      // Anything already on screen reveals now rather than waiting on the
      // observer — above-the-fold content must never depend on a callback.
      var r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) el.classList.add('in');
      else io.observe(el);
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
    // The visible word is real text, not a CSS ::after, so it is part of the
    // button's accessible name — and it has to stay in step with the state or
    // the name says "Menu" while the button says "Close".
    var burgerT = $('.b-t', burger);
    var setOpen = function (open) {
      document.body.classList.toggle('menu-on', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (burgerT) burgerT.textContent = open ? 'Close' : 'Menu';
    };
    setOpen(false);
    var close = function (refocus) {
      if (!document.body.classList.contains('menu-on')) return;
      setOpen(false);
      // send focus back to the control that opened it, or it lands at the top
      // of the document with no indication of what just happened
      if (refocus) burger.focus();
    };
    burger.addEventListener('click', function () {
      setOpen(!document.body.classList.contains('menu-on'));
    });
    $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { close(false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') close(true); });
  }

  /* ── GAME LAUNCHER: stand down over the footer ─────────────────────────── */
  // Pinned bottom-right, it sat exactly on top of the footer's "Back to top"
  // link — one control covering another. Watch the footer rather than guessing
  // a scroll offset, so it stays right whatever the footer's height becomes.
  function launcher() {
    var btn = $('#game-launch'), foot = $('footer');
    if (!btn || !foot || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) {
      document.body.classList.toggle('foot-in', en[0].isIntersecting);
    }, { rootMargin: '0px 0px -12% 0px' }).observe(foot);
  }

  /* ── GRID OVERLAY (press G) ────────────────────────────────────────────── */
  function gridOverlay() {
    var ov = $('#gridov');
    if (!ov) return;
    for (var i = 0; i < 12; i++) ov.appendChild(document.createElement('i'));

    // The overlay is purely visual, so a screen reader gets told about it
    // instead: an off-screen live region that announces each toggle.
    var say = document.createElement('div');
    say.className = 'sr-only';
    say.setAttribute('role', 'status');
    say.setAttribute('aria-live', 'polite');
    document.body.appendChild(say);

    addEventListener('keydown', function (e) {
      if (e.key !== 'g' && e.key !== 'G') return;
      var t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var on = document.body.classList.toggle('grid-on');
      say.textContent = on ? '12-column grid overlay shown' : '12-column grid overlay hidden';
    });
  }

  /* ── BOOT ──────────────────────────────────────────────────────────────── */
  function boot() {
    document.documentElement.dataset.swiss = '1';
    theme(); progress(); nav(); gridOverlay(); launcher();
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
