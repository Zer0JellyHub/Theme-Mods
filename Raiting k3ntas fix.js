/**
 * Jellyfin Header Button Injector
 * - Lupe      → Modal mit Suchfeld + nativer Dropdown darunter
 * - Ticket+?  → Request-Modal
 */
(function () {
  "use strict";

  const CONTAINER_ID = "jbi-container";
  const STYLE_ID     = "jbi-styles";
  const OVERLAY_ID   = "jbi-search-overlay";

  const CSS = `
    /* ── Originale ausblenden ── */
    #requestMediaBtn,
    #headerSearchField {
      display: none !important;
    }

    /* ── Container ── */
    #jbi-container {
      display: inline-flex;
      align-items: center;
      gap: 0;
      flex-shrink: 0;
    }

    /* ── Runde Icon-Buttons ── */
    .jbi-btn {
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      top: auto !important; right: auto !important;
      width: 40px; height: 40px;
      padding: 0 !important;
      border: none !important;
      border-radius: 50% !important;
      background: transparent !important;
      cursor: pointer !important;
      outline: none !important;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
      transform: none !important;
    }
    .jbi-btn:hover  { background: rgba(255,255,255,0.1) !important; }
    .jbi-btn:active { background: rgba(255,255,255,0.18) !important; }

    .jbi-btn::after {
      content: attr(data-tooltip);
      position: absolute;
      top: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(30,30,30,0.95);
      color: #fff;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 3px 8px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 9999;
    }
    .jbi-btn:hover::after { opacity: 1; }

    .jbi-btn svg {
      width: 22px; height: 22px;
      fill: none;
      stroke: rgba(255,255,255,0.87);
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      display: block;
      transition: stroke 0.15s ease;
    }
    .jbi-btn:hover svg { stroke: #fff; }

    @media (max-width: 925px) {
      .jbi-btn { width: 36px; height: 36px; }
      .jbi-btn svg { width: 19px; height: 19px; }
    }

    /* ══════════════════════════════════════════
       SUCHMODAL
    ══════════════════════════════════════════ */
    #jbi-search-overlay {
      display: none;
      position: fixed !important;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.8) !important;
      z-index: 100999 !important;
      align-items: flex-start;
      justify-content: center;
      padding-top: 80px;
      box-sizing: border-box;
    }
    #jbi-search-overlay.show { display: flex; }

    #jbi-search-modal {
      background: #1c1c1c;
      border-radius: 8px;
      padding: 28px 32px 32px;
      width: 90%;
      max-width: 560px;
      position: relative;
      box-shadow: 0 8px 40px rgba(0,0,0,0.7);
    }

    #jbi-search-title {
      font-size: 24px;
      font-weight: 600;
      color: #fff;
      margin: 0 0 20px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #jbi-search-close {
      position: absolute;
      top: 12px; right: 14px;
      background: none;
      border: none;
      color: rgba(255,255,255,0.6);
      font-size: 22px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
      line-height: 1;
    }
    #jbi-search-close:hover {
      color: #fff;
      background: rgba(255,255,255,0.1);
    }

    /* Suchfeld-Wrapper — relativ damit Dropdown darunter kommt */
    #jbi-input-wrap {
      position: relative;
    }

    #jbi-input-row {
      display: flex;
      align-items: center;
      background: #2a2a2a;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 0 12px;
      transition: border-color 0.2s;
      margin-bottom: 0;
    }
    #jbi-input-row:focus-within {
      border-color: rgba(255,255,255,0.35);
    }

    #jbi-input-row svg {
      width: 18px; height: 18px;
      flex-shrink: 0;
      stroke: rgba(255,255,255,0.4);
      stroke-width: 1.8;
      stroke-linecap: round;
      fill: none;
    }

    #jbi-search-input {
      flex: 1;
      background: none;
      border: none;
      color: #fff;
      font-size: 16px;
      font-family: inherit;
      padding: 13px 10px;
      outline: none;
    }
    #jbi-search-input::placeholder { color: rgba(255,255,255,0.3); }

    /* Nativer Jellyfin Dropdown — in unser Modal eingebettet */
    #jbi-dropdown-wrap {
      position: relative;
      width: 100%;
    }

    /* Den nativen #searchDropdown umpflanzen */
    #jbi-dropdown-wrap #searchDropdown {
      position: relative !important;
      top: auto !important;
      left: auto !important;
      width: 100% !important;
      max-height: 320px;
      overflow-y: auto;
      background: #252525 !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      border-top: none !important;
      border-radius: 0 0 6px 6px !important;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
      z-index: 1 !important;
    }
  `;

  const SEARCH_SVG = `<svg viewBox="0 0 24 24">
    <circle cx="10.5" cy="10.5" r="6.5"/>
    <line x1="15.5" y1="15.5" x2="21" y2="21"/>
  </svg>`;

  const REQUEST_SVG = `<svg viewBox="0 0 24 24">
    <!-- Play-Dreieck -->
    <path d="M6 4.5 L6 19.5 L19.5 12 Z" stroke-linejoin="round"/>
    <!-- Plus-Badge oben rechts -->
    <circle cx="19" cy="5" r="4.5" fill="#1c1c1c" stroke="rgba(255,255,255,0.87)" stroke-width="1.4"/>
    <line x1="19" y1="2.5" x2="19" y2="7.5" stroke-width="1.6"/>
    <line x1="16.5" y1="5" x2="21.5" y2="5" stroke-width="1.6"/>
  </svg>`;

  /* ── Suchmodal ── */
  let overlayEl = null;
  let dropdownWrap = null;

  function buildOverlay() {
    if (document.getElementById(OVERLAY_ID)) return;

    overlayEl = document.createElement("div");
    overlayEl.id = OVERLAY_ID;
    overlayEl.innerHTML = `
      <div id="jbi-search-modal">
        <button id="jbi-search-close" title="Schließen">×</button>
        <div id="jbi-search-title">Suche</div>
        <div id="jbi-input-wrap">
          <div id="jbi-input-row">
            <svg viewBox="0 0 24 24">
              <circle cx="10.5" cy="10.5" r="6.5"/>
              <line x1="15.5" y1="15.5" x2="21" y2="21"/>
            </svg>
            <input id="jbi-search-input" type="text"
                   placeholder="Titel suchen..."
                   autocomplete="off" autocorrect="off" spellcheck="false"/>
          </div>
          <div id="jbi-dropdown-wrap"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlayEl);

    dropdownWrap = document.getElementById("jbi-dropdown-wrap");

    const input    = document.getElementById("jbi-search-input");
    const closeBtn = document.getElementById("jbi-search-close");

    /* Beim Tippen: nativen headerSearchInput synchronisieren → Dropdown erscheint */
    input.addEventListener("input", () => {
      const q = input.value;
      const nativeInput = document.getElementById("headerSearchInput");
      const nativeField = document.getElementById("headerSearchField");

      if (nativeInput) {
        // Suchfeld kurz einblenden damit Dropdown positioniert werden kann
        if (nativeField) {
          nativeField.style.cssText =
            "display:block!important;opacity:0!important;position:absolute!important;left:-9999px!important;";
        }
        nativeInput.value = q;
        nativeInput.dispatchEvent(new Event("input",  { bubbles: true }));
        nativeInput.dispatchEvent(new Event("change", { bubbles: true }));

        // Dropdown nach kurzer Pause in unseren Wrapper verschieben
        setTimeout(moveDropdown, 80);
      }
    });

    /* Enter → erste Ergebnis-URL öffnen oder Suchseite */
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = input.value.trim();
        if (!q) return;
        closeOverlay();
        window.location.href = `/web/#/search.html?query=${encodeURIComponent(q)}`;
      }
      if (e.key === "Escape") closeOverlay();
    });

    closeBtn.addEventListener("click", closeOverlay);
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) closeOverlay();
    });
  }

  function moveDropdown() {
    const dd = document.getElementById("searchDropdown");
    if (!dd || !dropdownWrap) return;
    if (dropdownWrap.contains(dd)) return; // schon drin
    dropdownWrap.appendChild(dd);
    dd.style.cssText = ""; // eigene Stile entfernen → CSS übernimmt
    dd.classList.add("visible");
  }

  function restoreDropdown() {
    /* Dropdown zurück ins body-Level bringen wenn Modal geschlossen */
    const dd = document.getElementById("searchDropdown");
    if (dd && dropdownWrap && dropdownWrap.contains(dd)) {
      document.body.appendChild(dd);
      dd.classList.remove("visible");
      dd.style.display = "none";
    }
    /* Natives Suchfeld wieder verstecken */
    const nativeField = document.getElementById("headerSearchField");
    if (nativeField) nativeField.style.cssText = "";
  }

  function openOverlay() {
    buildOverlay();
    overlayEl = document.getElementById(OVERLAY_ID);
    overlayEl.classList.add("show");
    setTimeout(() => {
      const input = document.getElementById("jbi-search-input");
      if (input) { input.value = ""; input.focus(); }
    }, 60);
  }

  function closeOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.classList.remove("show");
    restoreDropdown();
    const input = document.getElementById("jbi-search-input");
    if (input) input.value = "";
    // Nativen Input leeren
    const nativeInput = document.getElementById("headerSearchInput");
    if (nativeInput) {
      nativeInput.value = "";
      nativeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  /* ── Request ── */
  function doRequest() {
    const origBtn = document.getElementById("requestMediaBtn");
    if (origBtn) { origBtn.click(); return; }
    const modal = document.getElementById("requestMediaModal");
    if (modal) {
      modal.classList.add("show");
      modal.style.display = "flex";
      const first = modal.querySelector("input, select, textarea");
      if (first) setTimeout(() => first.focus(), 100);
    }
  }

  /* ── Button ── */
  function makeBtn(id, svg, tooltip, onClick) {
    const btn = document.createElement("button");
    btn.type = "button"; btn.id = id; btn.className = "jbi-btn";
    btn.setAttribute("data-tooltip", tooltip); btn.title = tooltip;
    btn.innerHTML = svg;
    btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
    return btn;
  }

  /* ── Inject ── */
  function inject() {
    if (document.getElementById(CONTAINER_ID)) return;
    const target =
      document.querySelector(".headerRight") ||
      document.querySelector(".flex.align-items-center.flex-grow.headerTop") ||
      document.querySelector(".headerTop");
    if (!target) return;

    const container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.appendChild(makeBtn("jbi-search-btn",  SEARCH_SVG,  "Suche",           openOverlay));
    container.appendChild(makeBtn("jbi-request-btn", REQUEST_SVG, "Medien anfordern", doRequest));
    target.insertBefore(container, target.firstChild);
    console.log("[JBI] Buttons eingefügt.");
  }

  function init() {
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement("style");
      s.id = STYLE_ID; s.textContent = CSS;
      document.head.appendChild(s);
    }
    inject();
  }

  setTimeout(init, document.readyState === "loading" ? 1500 : 900);

  const obs = new MutationObserver(() => {
    if (!document.getElementById(CONTAINER_ID)) inject();
  });
  const startObs = () => obs.observe(document.body, { childList: true, subtree: false });
  if (document.body) startObs();
  else document.addEventListener("DOMContentLoaded", startObs);

})();
