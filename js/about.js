/* ═══════════════════════════════════════════════════════════════════════════
   About — the hover reveals.

   Three words in the prose are links to a photograph. Without this file they
   still work: the href goes to the image. With it, the click is taken over and
   the photograph appears in the empty half of the page instead.

   Three ways in, because a hover is only one of them:
     hover    a mouse enters the word, the photograph fades in, leaving hides it
     focus    the same, for anyone tabbing through
     click    pins it open until the next click, which is the only thing a
              touchscreen can do

   Degrades to a plain link if anything here throws.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var box = document.getElementById('peek');
  var trigs = [].slice.call(document.querySelectorAll('.ab-peek'));
  if (!box || !trigs.length) return;

  /* Two stacked frames. The portrait underneath never moves; the one on top
     carries whichever photograph is being hovered and fades over it. Two
     elements rather than one src swap because a crossfade written in
     setTimeout glitches the moment somebody moves across three words quickly. */
  var img = box.querySelector('.ab-swap');

  /* Decoded up front. A reveal that has to fetch first shows an empty frame
     for a beat, which reads as a bug rather than as a photograph. */
  trigs.forEach(function (t) {
    var pre = new Image();
    pre.src = t.getAttribute('href');
  });

  /* The word that is currently pinned open by a click, if any. While something
     is pinned, moving the mouse over other words does nothing — otherwise a
     tap on a phone opens a photograph that the next stray hover replaces. */
  var pinned = null;

  function show(t) {
    img.src = t.getAttribute('href');
    img.alt = t.getAttribute('data-alt') || '';
    box.classList.add('on');
  }

  function hide() {
    box.classList.remove('on');
  }

  trigs.forEach(function (t) {
    t.addEventListener('mouseenter', function () { if (!pinned) show(t); });
    t.addEventListener('mouseleave', function () { if (!pinned) hide(); });
    t.addEventListener('focus', function () { if (!pinned) show(t); });
    t.addEventListener('blur', function () { if (!pinned) hide(); });

    t.addEventListener('click', function (e) {
      e.preventDefault();               // the href is the no-JavaScript path
      if (pinned === t) { pinned = null; hide(); return; }
      pinned = t;
      show(t);
    });
  });

  /* Anywhere else puts it away. This runs after the trigger's own handler, so
     the click that opened one doesn't immediately close it. */
  document.addEventListener('click', function (e) {
    if (pinned && !e.target.closest('.ab-peek')) { pinned = null; hide(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pinned) { pinned = null; hide(); }
  });
})();
