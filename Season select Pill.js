/* ══════════════════════════════════════════════════════════
   Jellyfin Season Selector Redesign
   — Pill-shaped season buttons, EN + DE
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STYLE_ID = 'jf-season-style';

  /* ── CSS ── */
  if (!document.getElementById(STYLE_ID)) {
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      /* KefinTweaks-Popover ausblenden — Button wird per JS versteckt nach Bar-Build */
      '.kefinTweaks-popover { display:none!important; }',

      /* Unser Container */
      '#jf-season-bar {',
      '  display:flex;',
      '  align-items:center;',
      '  gap:6px;',
      '  flex-wrap:wrap;',
      '  padding:4px 0 8px;',
      '}',

      /* Pill-Button */
      '.jf-season-pill {',
      '  display:inline-flex;',
      '  align-items:center;',
      '  justify-content:center;',
      '  padding:5px 16px;',
      '  border-radius:999px;',
      '  border:1px solid rgba(255,255,255,0.22);',
      '  background:rgba(255,255,255,0.07);',
      '  color:rgba(255,255,255,0.75);',
      '  font-size:13px;',
      '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      '  font-weight:500;',
      '  cursor:pointer;',
      '  white-space:nowrap;',
      '  transition:background 0.15s,border-color 0.15s,color 0.15s;',
      '  user-select:none;',
      '}',
      '.jf-season-pill:hover {',
      '  background:rgba(255,255,255,0.14);',
      '  border-color:rgba(255,255,255,0.4);',
      '  color:#fff;',
      '}',
      '.jf-season-pill.active {',
      '  background:rgba(var(--accent-rgb,0,164,220),0.25);',
      '  border-color:rgba(var(--accent-rgb,0,164,220),0.8);',
      '  color:#fff;',
      '  font-weight:600;',
      '}',
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ── Sprach-Labels ── */
  function seasonLabel(name) {
    if (!name) return name;
    /* DE: "Staffel 1", "Staffel 2" */
    var deMatch = name.match(/Staffel\s*(\d+)/i);
    if (deMatch) return 'Staffel ' + deMatch[1];
    /* EN: "Season 1", "Season 2" */
    var enMatch = name.match(/Season\s*(\d+)/i);
    if (enMatch) return 'Season ' + enMatch[1];
    /* Specials */
    if (/special/i.test(name)) return 'Specials';
    if (/extra/i.test(name)) return 'Extras';
    /* Fallback: Originalname kürzen */
    return name.length > 20 ? name.substring(0, 18) + '…' : name;
  }

  /* ── Bestehenden Bar entfernen ── */
  function removeBar() {
    var old = document.getElementById('jf-season-bar');
    if (old) old.remove();
    /* Original-Button wieder anzeigen */
    var btn = document.querySelector('.season-selector-button, [aria-label*="eason"]');
    if (btn) btn.style.removeProperty('display');
  }

  /* ── Season-Bar bauen ── */
  function buildSeasonBar() {
    /* KefinTweaks-Popover-Items holen */
    var items = document.querySelectorAll('.kefinTweaks-popover-item');
    if (!items.length) return;

    /* Anchor: Originalbutton oder sein Container */
    var anchor =
      document.querySelector('.season-selector-button') ||
      document.querySelector('[aria-label="Select Season"]') ||
      document.querySelector('[aria-label="Staffel auswählen"]') ||
      document.querySelector('[aria-label*="eason"]');

    if (!anchor) return;

    /* Bereits gebaut? */
    if (document.getElementById('jf-season-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'jf-season-bar';

    /* Aktive Staffel ermitteln */
    var activeItem = document.querySelector('.kefinTweaks-popover-item.selected') ||
                     items[0];

    items.forEach(function (item) {
      var pill = document.createElement('button');
      pill.className = 'jf-season-pill' + (item === activeItem ? ' active' : '');
      pill.textContent = seasonLabel(item.textContent.trim());
      pill.title = item.textContent.trim();

      pill.addEventListener('click', function () {
        /* Originales Item klicken → Jellyfin handhabt Navigation */
        item.click();
        /* Active-Status aktualisieren */
        bar.querySelectorAll('.jf-season-pill').forEach(function (p) {
          p.classList.remove('active');
        });
        pill.classList.add('active');
      });

      bar.appendChild(pill);
    });

    /* Bar nach dem Anchor einfügen */
    anchor.parentNode.insertBefore(bar, anchor.nextSibling);
    /* Original-Button erst jetzt verstecken — Bar ist fertig */
    anchor.style.setProperty('display', 'none', 'important');
  }

  /* ── MutationObserver: wartet auf KefinTweaks-Items ── */
  var obs = new MutationObserver(function () {
    var items = document.querySelectorAll('.kefinTweaks-popover-item');
    if (items.length && !document.getElementById('jf-season-bar')) {
      buildSeasonBar();
    }
    /* Seite gewechselt → Bar entfernen */
    if (!document.querySelector('.kefinTweaks-popover-item')) {
      removeBar();
    }
  });

  function start() {
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
    buildSeasonBar();
  }

})();
