/* ══════════════════════════════════════════════════════════
   4U TAB + RECOMMENDATIONS POPUP
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── CSS ── */
  var CSS = [
    '#ir-widget,#ir-widget-on,.ir-pill,[id^="ir-widget"]{display:none!important;}',

    '#jf4u-tab-btn{display:inline-flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:5px!important;}',
    '#jf4u-tab-btn .jf4u-icon-row{display:flex;align-items:center;justify-content:center;gap:3px;height:24px;}',
    '#jf4u-tab-btn .jf4u-thumb{width:20px;height:20px;flex-shrink:0;}',
    '#jf4u-tab-btn .jf4u-qmark{font-size:20px;font-weight:900;line-height:1;font-family:Georgia,serif;font-style:italic;color:currentColor;}',

    '#jf4u-popup{position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;background:rgba(0,0,0,.55);backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
    '#jf4u-popup.open{display:flex;}',

    '#jf4u-head{display:flex;align-items:center;justify-content:space-between;padding:14px 3.5%;border-bottom:1px solid rgba(255,255,255,.12);flex-shrink:0;background:rgba(0,0,0,.2);}',
    '#jf4u-title{font-size:1.2em;font-weight:300;letter-spacing:.03em;display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.95);}',
    '#jf4u-subtitle{font-size:.7em;color:rgba(255,255,255,.3);font-weight:400;margin-left:2px;}',

    '#jf4u-head-actions{display:flex;align-items:center;gap:8px;}',
    '#jf4u-close{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);border-radius:50%;width:34px;height:34px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1em;transition:background .2s;}',
    '#jf4u-close:hover{background:rgba(255,255,255,.22);color:#fff;}',

    '#jf4u-body{flex:1;overflow:hidden;display:flex;padding:0 3.5% 0;}',
    '.jf4u-col::-webkit-scrollbar{width:4px;}',
    '.jf4u-col::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:2px;}',

    '.jf4u-col{flex:1;padding:28px 20px 3em;min-width:0;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent;}',
    '.jf4u-col+.jf4u-col{border-left:1px solid rgba(255,255,255,.08);}',
    '.jf4u-col-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}',
    '.jf4u-col-label{font-size:.68em;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.3);}',
    '.jf4u-col-meta{display:flex;align-items:center;gap:8px;}',
    '.jf4u-col-count{font-size:.68em;color:rgba(255,255,255,.2);}',

    /* per-column refresh */
    '.jf4u-col-refresh{background:none;border:none;color:rgba(255,255,255,.25);font-size:1.35em;cursor:pointer;padding:4px 7px;border-radius:6px;line-height:1;transition:color .15s,background .15s;display:inline-block;}',
    '.jf4u-col-refresh:hover{color:rgba(255,255,255,.75);background:rgba(255,255,255,.08);}',
    '.jf4u-col-refresh.spinning{animation:jf4u-spin .7s linear infinite;}',
    '@keyframes jf4u-spin{to{transform:rotate(360deg);}}',

    '.jf4u-scroll-wrap{position:relative;}',
    '.jf4u-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;}',

    '.jf4u-scroll-hint{position:absolute;bottom:0;left:0;right:0;height:34px;background:linear-gradient(transparent,rgba(0,0,0,.5));pointer-events:none;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px;transition:opacity 0.2s;}',
    '.jf4u-scroll-hint.gone{opacity:0;pointer-events:none;}',
    '.jf4u-scroll-hint span{font-size:10px;color:rgba(255,255,255,0.28);}',

    '.jf4u-poster{border-radius:8px;overflow:hidden;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);cursor:pointer;transition:transform .18s,border-color .18s;aspect-ratio:2/3;position:relative;display:flex;align-items:flex-end;}',
    '.jf4u-poster:hover{transform:scale(1.04);border-color:rgba(255,255,255,.28);z-index:2;}',
    '.jf4u-poster img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}',
    '.jf4u-poster-fade{position:absolute;bottom:0;left:0;right:0;height:58%;background:linear-gradient(transparent,rgba(0,0,0,0.92));padding:7px 7px 5px;display:flex;flex-direction:column;justify-content:flex-end;}',
    '.jf4u-poster-title{font-size:.78em;font-weight:500;color:#fff;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.jf4u-poster-year{font-size:.68em;color:rgba(255,255,255,0.38);margin-top:2px;}',
    '.jf4u-poster-stars{display:flex;align-items:center;gap:1px;margin-top:3px;}',
    '.jf4u-star{font-size:.65em;line-height:1;}',
    '.jf4u-rval{font-size:.65em;color:rgba(255,255,255,0.45);margin-left:3px;}',

    '.jf4u-empty{padding:1.5em 0;color:rgba(255,255,255,0.22);font-size:.85em;font-style:italic;}',
    '.jf4u-spin{padding:1.5em;text-align:center;color:rgba(255,255,255,0.3);font-size:.85em;}',

    '#jf4u-footer{padding:10px 3.5% 12px;border-top:1px solid rgba(255,255,255,.08);display:flex;align-items:center;flex-shrink:0;background:rgba(0,0,0,.15);}',
    '#jf4u-hint{font-size:.72em;color:rgba(255,255,255,0.18);}',
  ].join('');

  function injectCSS() {
    var old = document.getElementById('jf4u-css');
    if (old) old.remove();
    var s = document.createElement('style');
    s.id = 'jf4u-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── API helpers ── */
  function AC() { return window.ApiClient; }
  function srv() { var a = AC(); return a ? (a._serverAddress || a._serverUrl || '').replace(/\/$/, '') : ''; }
  function tok() { var a = AC(); return a ? (a._token || (a.accessToken && a.accessToken()) || '') : ''; }
  function uid() { var a = AC(); return a ? (a._currentUserId || (a.getCurrentUserId && a.getCurrentUserId()) || '') : ''; }
  function ah() { return { 'X-Emby-Token': tok(), 'X-MediaBrowser-Token': tok() }; }
  function jget(path, params) {
    var qs = params ? '?' + Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&') : '';
    return fetch(srv() + '/' + path + qs, { headers: ah() })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  /* ── Cache (persistent – nur manuell per ↻ löschen) ── */
  function cget(k) {
    try {
      var r = localStorage.getItem('jf4u_' + k);
      if (!r) return null;
      var o = JSON.parse(r);
      return o.d !== undefined ? o.d : o; // kompatibel mit altem Format
    } catch (e) { return null; }
  }
  function cset(k, d) {
    try { localStorage.setItem('jf4u_' + k, JSON.stringify({ d: d })); } catch (e) {}
  }

  /* ── Navigate to item detail ── */
  function navTo(id) {
    var a = AC(), sid = a && ((a._serverInfo && a._serverInfo.Id) || (a.serverId && a.serverId()));
    closePopup();
    setTimeout(function () {
      if (window.appRouter && appRouter.showItem) { appRouter.showItem({ Id: id, ServerId: sid }); return; }
      window.location.hash = '#!/details?id=' + id + (sid ? '&serverId=' + sid : '');
    }, 150);
  }

  /* ── Stars ── */
  function stars(avg) {
    var n = Math.round((avg || 0) / 2), s = '';
    for (var i = 1; i <= 5; i++)
      s += '<span class="jf4u-star" style="color:' + (i <= n ? '#FFD700' : 'rgba(255,255,255,0.13)') + '">&#9733;</span>';
    return s;
  }

  /* ── Poster image URL ── */
  function posterUrl(item) {
    if (item.ImageTags && item.ImageTags.Primary)
      return srv() + '/Items/' + item.Id + '/Images/Primary?tag=' + item.ImageTags.Primary + '&maxHeight=300&quality=85';
    if (item.SeriesId && item.SeriesPrimaryImageTag)
      return srv() + '/Items/' + item.SeriesId + '/Images/Primary?tag=' + item.SeriesPrimaryImageTag + '&maxHeight=300&quality=85';
    return '';
  }

  /* ── Load items (single type) ── */
  function loadItems(type, force) {
    if (!force) {
      var cached = cget(type);
      if (cached && cached.length) return Promise.resolve(cached);
    }
    var params = {
      Recursive: true,
      IncludeItemTypes: type,
      SortBy: 'Random',
      Fields: 'ProductionYear,CommunityRating,ImageTags,Genres',
      Limit: 36
    };
    var u = uid();
    if (u) params.UserId = u;

    return jget('Items', params).then(function (data) {
      if (data && data.Items && data.Items.length) {
        cset(type, data.Items);
        return data.Items;
      }
      /* Fallback: ohne UserId */
      return jget('Items', {
        Recursive: true,
        IncludeItemTypes: type,
        SortBy: 'Random',
        Fields: 'ProductionYear,CommunityRating,ImageTags,Genres',
        Limit: 36
      }).then(function (d2) {
        if (!d2 || !d2.Items) return [];
        cset(type, d2.Items);
        return d2.Items;
      });
    });
  }

  /* ── Build one poster card ── */
  function buildPoster(item) {
    var div = document.createElement('div');
    div.className = 'jf4u-poster';
    var img = posterUrl(item);
    var avg = item.CommunityRating ? item.CommunityRating.toFixed(1) : '';
    div.innerHTML =
      (img ? '<img src="' + img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '')
      + '<div class="jf4u-poster-fade">'
      + '<div class="jf4u-poster-title">' + (item.Name || '') + '</div>'
      + '<div class="jf4u-poster-year">' + (item.ProductionYear || '') + '</div>'
      + (avg ? '<div class="jf4u-poster-stars">' + stars(item.CommunityRating) + '<span class="jf4u-rval">' + avg + '</span></div>' : '')
      + '</div>';
    div.addEventListener('click', function () { navTo(item.Id); });
    return div;
  }

  /* ── Fill a column grid ── */
  function fillCol(gridId, hintId, countId, items) {
    var grid = document.getElementById(gridId);
    var hint = document.getElementById(hintId);
    var countEl = document.getElementById(countId);
    if (!grid) return;
    grid.innerHTML = '';
    if (!items || !items.length) {
      var empty = document.createElement('div');
      empty.className = 'jf4u-empty';
      empty.textContent = 'No recommendations yet. Watch more titles first.';
      grid.appendChild(empty);
      if (hint) hint.classList.add('gone');
      return;
    }
    items.forEach(function (item) { grid.appendChild(buildPoster(item)); });
    if (countEl) countEl.textContent = items.length + ' titles';
    if (hint) {
      if (items.length <= 6) {
        hint.classList.add('gone');
      } else {
        hint.classList.remove('gone');
        grid.addEventListener('scroll', function () {
          hint.classList.toggle('gone', grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 4);
        });
      }
    }
  }

  /* ── Refresh a single column ── */
  function refreshCol(type, gridId, hintId, countId, btnId) {
    var btn = document.getElementById(btnId);
    var grid = document.getElementById(gridId);
    if (grid) grid.innerHTML = '<div class="jf4u-spin">Loading\u2026</div>';
    if (btn) btn.classList.add('spinning');
    localStorage.removeItem('jf4u_' + type);
    loadItems(type, true).then(function (items) {
      fillCol(gridId, hintId, countId, items);
      if (btn) btn.classList.remove('spinning');
    });
  }

  /* ── Build popup DOM (once) ── */
  function buildPopup() {
    if (document.getElementById('jf4u-popup')) return;

    var popup = document.createElement('div');
    popup.id = 'jf4u-popup';
    popup.innerHTML =
      '<div id="jf4u-head">'
        + '<div id="jf4u-title">'
          + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;opacity:.9">'
          + '<path d="M14 9V5a3 3 0 00-3-3L7 12v9h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linejoin="round"/>'
          + '<path d="M7 12H4a2 2 0 00-2 2v5a2 2 0 002 2h3" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round"/></svg>'
          + 'Just for You'
          + '<span id="jf4u-subtitle">based on your watch history</span>'
        + '</div>'
        + '<div id="jf4u-head-actions">'
          + '<button id="jf4u-close">\u2715</button>'
        + '</div>'
      + '</div>'
      + '<div id="jf4u-body">'
        + '<div class="jf4u-col">'
          + '<div class="jf4u-col-header">'
            + '<div class="jf4u-col-label">Movies</div>'
            + '<div class="jf4u-col-meta">'
              + '<div class="jf4u-col-count" id="jf4u-mc"></div>'
              + '<button class="jf4u-col-refresh" id="jf4u-mrefresh" title="Refresh movies">\u21bb</button>'
            + '</div>'
          + '</div>'
          + '<div class="jf4u-scroll-wrap"><div class="jf4u-grid" id="jf4u-movies"><div class="jf4u-spin">Loading\u2026</div></div><div class="jf4u-scroll-hint gone" id="jf4u-mhint"><span>\u25bc scroll for more</span></div></div>'
        + '</div>'
        + '<div class="jf4u-col">'
          + '<div class="jf4u-col-header">'
            + '<div class="jf4u-col-label">Series</div>'
            + '<div class="jf4u-col-meta">'
              + '<div class="jf4u-col-count" id="jf4u-sc"></div>'
              + '<button class="jf4u-col-refresh" id="jf4u-srefresh" title="Refresh series">\u21bb</button>'
            + '</div>'
          + '</div>'
          + '<div class="jf4u-scroll-wrap"><div class="jf4u-grid" id="jf4u-series"><div class="jf4u-spin">Loading\u2026</div></div><div class="jf4u-scroll-hint gone" id="jf4u-shint"><span>\u25bc scroll for more</span></div></div>'
        + '</div>'
      + '</div>'
      + '<div id="jf4u-footer">'
        + '<span id="jf4u-hint">Recommendations refresh daily \u00b7 \u21bb refreshes one column</span>'
      + '</div>';

    document.body.appendChild(popup);

    document.getElementById('jf4u-close').addEventListener('click', closePopup);

    document.getElementById('jf4u-mrefresh').addEventListener('click', function () {
      refreshCol('Movie', 'jf4u-movies', 'jf4u-mhint', 'jf4u-mc', 'jf4u-mrefresh');
    });

    document.getElementById('jf4u-srefresh').addEventListener('click', function () {
      refreshCol('Series', 'jf4u-series', 'jf4u-shint', 'jf4u-sc', 'jf4u-srefresh');
    });
  }

  /* ── Load both columns ── */
  var dataLoaded = false;
  function loadData(force) {
    dataLoaded = false;
    var mg = document.getElementById('jf4u-movies');
    var sg = document.getElementById('jf4u-series');
    if (mg) mg.innerHTML = '<div class="jf4u-spin">Loading\u2026</div>';
    if (sg) sg.innerHTML = '<div class="jf4u-spin">Loading\u2026</div>';
    Promise.all([loadItems('Movie', force), loadItems('Series', force)]).then(function (res) {
      fillCol('jf4u-movies', 'jf4u-mhint', 'jf4u-mc', res[0]);
      fillCol('jf4u-series', 'jf4u-shint', 'jf4u-sc', res[1]);
      dataLoaded = true;
    });
  }

  /* ── Open / Close ── */
  var popupOpen = false;
  var escHandler = function (e) { if (e.key === 'Escape') closePopup(); };

  function openPopup() {
    buildPopup();
    document.getElementById('jf4u-popup').classList.add('open');
    document.addEventListener('keydown', escHandler);
    popupOpen = true;
    if (!dataLoaded) loadData();
  }

  function closePopup() {
    var p = document.getElementById('jf4u-popup');
    if (p) p.classList.remove('open');
    document.removeEventListener('keydown', escHandler);
    popupOpen = false;
  }

  var FG_HTML =
    '<span style="display:flex;align-items:center;justify-content:center;gap:2px;">'
    + '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">'
    + '<path d="M14 9V5a3 3 0 00-3-3L7 12v9h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>'
    + '<path d="M7 12H4a2 2 0 00-2 2v5a2 2 0 002 2h3"/>'
    + '</svg>'
    + '<span style="font-size:16px;font-weight:900;font-family:Georgia,serif;font-style:italic;line-height:1;">?</span>'
    + '</span>'
    + '<span class="emby-tab-button-text">4U</span>';

  /* ── Patch the 4U tab ── */
  function patchTab() {
    document.querySelectorAll(
      '[id^="customTabButton"], .emby-tab-button, [class*="tabButton"], [class*="tab-button"]'
    ).forEach(function (btn) {
      if (btn.dataset.jf4uPatched) return;

      var te = btn.querySelector('.emby-tab-button-text, .emby-button-foreground, span') || btn;
      var txt = (te.textContent || btn.textContent || '').trim();

      if (!/^4U$/i.test(txt)) return;

      btn.dataset.jf4uPatched = '1';
      btn.id = 'jf4u-tab-btn';

      var fg = btn.querySelector('.emby-button-foreground');
      if (fg) {
        fg.innerHTML = FG_HTML;
      } else {
        btn.innerHTML = FG_HTML;
      }

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (popupOpen) { closePopup(); } else { openPopup(); }
      }, true);

      var writing = false;
      new MutationObserver(function () {
        if (writing) return;
        var fg2 = btn.querySelector('.emby-button-foreground') || btn;
        if (!fg2.querySelector('svg')) {
          writing = true;
          fg2.innerHTML = FG_HTML;
          writing = false;
        }
      }).observe(btn, { childList: true, subtree: false });

      console.log('[4U] Tab patched \u2713');
    });
  }

  /* ── Boot ── */
  /* Cache-Version: alten Cache (< v2) automatisch löschen */
  (function() {
    var v = localStorage.getItem('jf4u_version');
    if (v !== '2') {
      localStorage.removeItem('jf4u_Movie');
      localStorage.removeItem('jf4u_Series');
      localStorage.setItem('jf4u_version', '2');
    }
  })();
  injectCSS();
  var iv = setInterval(function () {
    if (typeof ApiClient === 'undefined') return;
    patchTab();
    if (document.getElementById('jf4u-tab-btn')) clearInterval(iv);
  }, 500);
  setTimeout(function () { clearInterval(iv); }, 15000);

  console.log('[4U Popup] Loaded \u2713');
})();
