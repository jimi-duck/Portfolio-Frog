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

  /* ── READING PROGRESS ──────────────────────────────────────────────────── */
  /* The bar measures the article, not the document. Against scrollHeight it
     spent its last stretch filling up through the next-project card and the
     footer, so it read 90% while the reader had in fact finished — which is
     the one thing a progress indicator must not do. The track runs from the
     top of <main> to the top of whatever closes the article (the next-project
     card, the back-home block, or the footer), and it is full when the last
     section has been read. */
  function progress() {
    var el = $('#prog');
    if (!el) return;
    var main = $('#main');
    var tail = $('.next') || $('.backhome') || $('footer');
    var run = function () {
      var p;
      if (main && tail) {
        var start = main.getBoundingClientRect().top + scrollY;
        var span = (tail.getBoundingClientRect().top + scrollY) - start - innerHeight;
        p = span > 0 ? (scrollY - start) / span : (scrollY > start ? 1 : 0);
      } else {
        var h = document.documentElement.scrollHeight - innerHeight;
        p = h > 0 ? scrollY / h : 0;
      }
      el.style.setProperty('--p', Math.max(0, Math.min(1, p)));
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

  /* ── BACK TO TOP ───────────────────────────────────────────────────────── */
  /* Only present on the long pages. It shows once the reader is past the first
     screen and stands down again as the footer arrives, since the footer
     carries the same link. Focus follows the scroll: without it a
     keyboard user is returned to the top visually while their tab position is
     still several thousand pixels down the page. */
  function toTop() {
    var btn = $('#totop');
    if (!btn) return;
    // Two measured edges rather than one guessed screen height. It appears
    // once the first section has actually been read, and it stands down over
    // the next-project card as well as the footer — the card is a link the
    // size of the viewport, and a floating button was landing on top of it.
    var first = $('main .section, main .warm-band, main .dark-band');
    var tail = $('.next') || $('.backhome') || $('footer');
    var run = function () {
      var gate = first
        ? first.getBoundingClientRect().bottom + scrollY
        : innerHeight * 1.1;
      var on = scrollY > gate;
      // one measurement per scroll, same cost as the progress bar above
      if (on && tail) on = tail.getBoundingClientRect().top > innerHeight * 0.88;
      document.body.classList.toggle('totop-on', on);
    };
    addEventListener('scroll', run, { passive: true });
    addEventListener('resize', run);
    run();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      var m = $('#main');
      if (m) m.focus({ preventScroll: true });
    });
  }

  /* ── IMAGE LIGHTBOX ────────────────────────────────────────────────────── */
  /* The app screens are the evidence the page is built on, and at 300px in a
     four-up row they are a texture rather than a screenshot. Every figure and
     photograph that is not already a link becomes a button wrapping its own
     image; opening one shows the full-size render with the caption it already
     had underneath it, so the overlay says the same thing the page did.

     A native <dialog>: showModal() supplies the focus trap, Escape, the inert
     background and the return of focus to the thumbnail that opened it. What
     is left to write is the backdrop click, the caption, and staying out of
     the way of anything already wrapped in an <a>. */
  var LB_SEL = 'main .appshot .device-img, main .phone-col .device-img, ' +
               'main .walk-media img, main .photo, main .img';

  function lightbox() {
    if (!('showModal' in document.createElement('dialog'))) return;
    var imgs = $$(LB_SEL).filter(function (im) { return !im.closest('a'); });
    if (!imgs.length) return;

    var dlg = document.createElement('dialog');
    dlg.id = 'lb';
    dlg.setAttribute('aria-label', 'Enlarged image');
    dlg.innerHTML =
      '<button type="button" class="lb-x" aria-label="Close image">' +
        '<span aria-hidden="true">&#10005;</span>' +
      '</button>' +
      '<figure class="lb-fig">' +
        '<img class="lb-img" alt="">' +
        '<figcaption class="lb-cap"></figcaption>' +
      '</figure>';
    document.body.appendChild(dlg);
    var lbImg = $('.lb-img', dlg), lbCap = $('.lb-cap', dlg);

    // Everything the overlay owns outside the dialog itself, undone. Called
    // from every close path rather than from the close event alone: not every
    // engine fires that event for a programmatic close, and the scroll lock is
    // not something to leave on if one of them doesn't.
    function done() {
      document.body.classList.remove('lb-on');
      document.body.style.paddingRight = '';
      lbImg.removeAttribute('src');
    }
    function shut() { if (dlg.open) dlg.close(); done(); }

    // The caption already exists on the page in one of three shapes. Carry it
    // across rather than inventing a second one that can drift out of step.
    function captionFor(im, btn) {
      var fig = im.closest('figure');
      var inFig = fig && $('.appshot-c, figcaption', fig);
      if (inFig) return { html: inFig.innerHTML, plain: false };
      var sib = btn.nextElementSibling;
      if (sib && sib.classList.contains('cap')) return { html: sib.innerHTML, plain: true };
      var row = im.closest('.walk-row');
      var t = row && $('.walk-t', row);
      if (t) return { html: t.textContent, plain: true };
      return { html: im.alt || '', plain: true };
    }

    imgs.forEach(function (im) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'zoom';
      btn.setAttribute('aria-label', 'Enlarge image' + (im.alt ? ': ' + im.alt : ''));
      im.parentNode.insertBefore(btn, im);
      btn.appendChild(im);
      btn.addEventListener('click', function () {
        var cap = captionFor(im, btn);
        lbImg.src = im.currentSrc || im.src;
        lbImg.alt = im.alt || '';
        lbCap.innerHTML = cap.html;
        lbCap.hidden = !cap.html;
        lbCap.classList.toggle('is-plain', cap.plain);
        // .is-doc images are desaturated on the page; the overlay is the same
        // image larger, not a differently graded one.
        dlg.classList.toggle('is-doc', im.classList.contains('is-doc'));
        // Locking the page removes the scrollbar with it; hold its width so
        // the article behind the scrim doesn't jump a few pixels sideways.
        var sbw = innerWidth - document.documentElement.clientWidth;
        if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
        document.body.classList.add('lb-on');
        dlg.showModal();
      });
    });

    // Click outside the figure. The dialog fills the viewport, so anything
    // that lands on the dialog itself rather than on its contents is outside.
    dlg.addEventListener('click', function (e) { if (e.target === dlg) shut(); });
    $('.lb-x', dlg).addEventListener('click', shut);
    // Escape: take the cancel over rather than letting the default close run,
    // so the page is unlocked on the same tick the dialog goes.
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); shut(); });
    dlg.addEventListener('close', done);
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
    theme(); progress(); nav(); gridOverlay(); launcher(); toTop(); lightbox();
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
