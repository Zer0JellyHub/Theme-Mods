/* ════════════════════════════════
   social-friends-btn → in Pill
════════════════════════════════ */
(function() {
  'use strict';

  var moved = false;

  function moveSocialBtn() {
    if (moved) return;
    var pill = document.getElementById('jf-pill');
    if (!pill) return;
    var btn = document.getElementById('social-friends-btn');
    if (!btn) return;
    moved = true;

    /* Neuen Button bauen der 1:1 wie die anderen aussieht */
    var newBtn = document.createElement('button');
    newBtn.id = 'jf-social-clone';
    newBtn.title = btn.title || 'Freunde';
    newBtn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;background:none;border:none;outline:none;cursor:pointer;border-radius:50%;transition:background 0.15s;flex-shrink:0;padding:0;';
    newBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.87)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/><circle cx="12" cy="10" r="2.5"/><path d="M8 19c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>';
    newBtn.onmouseover = function(){ newBtn.style.background='rgba(255,255,255,0.1)'; };
    newBtn.onmouseout  = function(){ newBtn.style.background='none'; };

    /* Klick weiterleiten an nativen Button */
    newBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      btn.click();
    });

    /* Nativen Button verstecken */
    btn.style.setProperty('display',   'none',     'important');
    btn.style.setProperty('position',  'absolute', 'important');
    btn.style.setProperty('left',      '-9999px',  'important');

    pill.insertBefore(newBtn, pill.firstChild);
  }

  var iv = setInterval(function() {
    if (document.getElementById('jf-pill') && document.getElementById('social-friends-btn')) {
      moveSocialBtn();
      clearInterval(iv);
    }
  }, 300);
  setTimeout(function(){ clearInterval(iv); }, 15000);

  new MutationObserver(function() {
    if (!moved) moveSocialBtn();
  }).observe(document.body, { childList: true, subtree: true });
})();
