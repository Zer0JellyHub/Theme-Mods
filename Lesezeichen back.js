/* ══════════════════════════════════════════════════════════
   Mobile Fix – Overlay per Tap zeigen (wie Hover auf Desktop)
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (!('ontouchstart' in window) && navigator.maxTouchPoints < 1) return;

  var style = document.createElement('style');
  style.textContent =
    /* Overlay standardmäßig versteckt wie auf Desktop */
    '.card .cardOverlayContainer { opacity: 0 !important; visibility: hidden !important; transition: opacity 0.2s !important; }' +
    /* Nur wenn .jf-tapped aktiv → sichtbar */
    '.card.jf-tapped .cardOverlayContainer { opacity: 1 !important; visibility: visible !important; }' +
    '.card.jf-tapped .cardOverlayButton, .card.jf-tapped .cardOverlayButton-hover { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }';
  document.head.appendChild(style);

  var lastTapped = null;

  function attachTap(card) {
    if (card.dataset.jfTapDone) return;
    card.dataset.jfTapDone = '1';
    card.addEventListener('touchstart', function (e) {
      /* Wenn schon offen → Button-Klick durchlassen */
      if (card.classList.contains('jf-tapped')) return;
      /* Erster Tap → Overlay zeigen, Navigation verhindern */
      e.preventDefault();
      e.stopPropagation();
      /* Vorherige schließen */
      if (lastTapped && lastTapped !== card) {
        lastTapped.classList.remove('jf-tapped');
      }
      card.classList.add('jf-tapped');
      lastTapped = card;
    }, { passive: false });
  }

  /* Schließen wenn irgendwo anders getippt wird */
  document.addEventListener('touchstart', function (e) {
    if (!lastTapped) return;
    if (!lastTapped.contains(e.target)) {
      lastTapped.classList.remove('jf-tapped');
      lastTapped = null;
    }
  }, { passive: true });

  /* Neue Cards beobachten */
  function scanCards() {
    document.querySelectorAll('.card').forEach(attachTap);
  }

  new MutationObserver(scanCards).observe(document.body, { childList: true, subtree: true });
  scanCards();

  console.log('[MobileOverlayFix] Tap-to-show Overlay aktiv ✓');
})();
