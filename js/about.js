/* ═══════════════════════════════════════════════════════════════════════════
   About — the pile of prints.

   The collage is four photographs stacked in CSS, each one turned a couple of
   degrees off square. Hovering a plate straightens it and lifts it, which is
   CSS and needs nothing from here. This file is the other half of that: a
   click pins a plate on top and leaves it there.

   It exists for the phone, where there is no hover at all and the plate you
   want is the one underneath. Everything degrades to a static collage if it
   throws — the photographs are in the markup and the arrangement is in the
   stylesheet.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var pile = document.getElementById('collage');
  if (!pile) return;

  var plates = [].slice.call(pile.querySelectorAll('.pl'));
  if (plates.length < 2) return;

  /* One plate on top at a time. Raising the clicked one and dropping the last
     is the whole model: no z-index counter that climbs forever, and no state
     to get out of step with what is on screen. */
  var top = null;

  function set(p, on) {
    p.classList.toggle('is-top', on);
    p.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function raise(p) {
    if (top) set(top, false);
    top = (p === top) ? null : p;
    if (top) set(top, true);
  }

  plates.forEach(function (p) {
    /* A <figure> that answers a click is a button, and saying so is the whole
       of what a screen reader needs: without a role it is an unlabelled group
       that happens to be in the tab order, which reads as a bug in the page
       rather than as something to press. The name comes off the photograph's
       own alt — it is already written, and it is what distinguishes one plate
       from the next. aria-pressed carries the state, because clicking the one
       on top puts it back down: this is a toggle, not a trigger.

       Set from here rather than in the markup on purpose. All of it describes
       behaviour that only exists while this file is running, and the page
       without it is four photographs in a pile — which is a perfectly good
       thing to be, and should not announce itself as a control. */
    var alt = (p.querySelector('img') || {}).alt || 'Photograph';
    p.setAttribute('role', 'button');
    p.setAttribute('tabindex', '0');
    p.setAttribute('aria-label', alt + ' — bring to the front');
    p.setAttribute('aria-pressed', 'false');

    p.addEventListener('click', function () { raise(p); });
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); raise(p); }
    });
  });
})();
