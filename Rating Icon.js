/* ══════════════════════════════════════════════════════════
   Jellyfin – Ratings Overlay
   ✓ Calendar-style glassmorphism (backdrop-filter blur)
   ✓ Movies / Series ranking with expand → user ratings
   ✓ Watchlist per user (poster grid)
   ✓ History per user (played items)
   ✓ Search filter
   ✓ Ratings-Tab patched (icon + click intercepted)
   ✓ #ir-widget (RECENT) hidden
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Hide ir-widget immediately ─────────────────────────── */
  (function () {
    var s = document.createElement('style');
    s.textContent = '#ir-widget,#ir-widget-on,.ir-pill,[id^="ir-widget"]{display:none!important;}';
    document.head.appendChild(s);
  })();

  /* ── Tab icon SVG ────────────────────────────────────────── */
  var STAR_ICON = '<span class="jf-rat-tab-icon"><svg viewBox="0 0 24 24" width="24" height="24">'
    + '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77'
    + 'l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>'
    + '</svg></span>';

  /* ── CSS ─────────────────────────────────────────────────── */
  var CSS = '\n'
    /* Tab icon */
    + '.jf-rat-tab-icon{display:flex;align-items:center;justify-content:center;}\n'
    + '.jf-rat-tab-icon svg{width:22px;height:22px;fill:currentColor;opacity:0.87;}\n'
    + '.jf-rat-tab-patched{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;}\n'

    /* Overlay */
    + '#jf-rat-overlay{'
    +   'position:fixed;inset:0;z-index:99999;'
    +   'background:rgba(0,0,0,.55);'
    +   'backdrop-filter:blur(24px) saturate(1.4);'
    +   '-webkit-backdrop-filter:blur(24px) saturate(1.4);'
    +   'display:flex;flex-direction:column;overflow:hidden;'
    + '}\n'

    /* Header */
    + '#jf-rat-header{'
    +   'display:flex;align-items:center;justify-content:space-between;'
    +   'padding:14px 3.5%;border-bottom:1px solid rgba(255,255,255,.12);'
    +   'flex-shrink:0;background:rgba(0,0,0,.2);gap:12px;flex-wrap:wrap;'
    + '}\n'
    + '#jf-rat-title{'
    +   'font-size:1.2em;font-weight:300;letter-spacing:.03em;'
    +   'display:flex;align-items:center;gap:10px;'
    +   'color:rgba(255,255,255,.95);flex-shrink:0;'
    + '}\n'
    + '#jf-rat-close{'
    +   'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);'
    +   'color:rgba(255,255,255,.85);border-radius:50%;'
    +   'width:34px;height:34px;font-size:1em;cursor:pointer;'
    +   'display:flex;align-items:center;justify-content:center;'
    +   'flex-shrink:0;transition:background .2s;'
    + '}\n'
    + '#jf-rat-close:hover{background:rgba(255,255,255,.22);color:#fff;}\n'

    /* Nav tabs */
    + '#jf-rat-nav{'
    +   'display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;'
    +   'scrollbar-width:none;flex:1;justify-content:center;'
    + '}\n'
    + '#jf-rat-nav::-webkit-scrollbar{display:none;}\n'
    + '.jf-rat-btn{'
    +   'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);'
    +   'color:rgba(255,255,255,.7);border-radius:8px;'
    +   'padding:5px 14px;cursor:pointer;flex-shrink:0;'
    +   'font-size:.78em;font-family:inherit;line-height:1.3;'
    +   'transition:background .15s,border-color .15s,color .15s;'
    + '}\n'
    + '.jf-rat-btn:hover{background:rgba(255,255,255,.14);color:#fff;}\n'
    + '.jf-rat-btn.active{'
    +   'background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.5);'
    +   'color:#fff;font-weight:500;'
    + '}\n'

    /* Search */
    + '#jf-rat-search-wrap{'
    +   'display:flex;align-items:center;gap:7px;'
    +   'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);'
    +   'border-radius:8px;padding:5px 11px;flex-shrink:0;'
    + '}\n'
    + '#jf-rat-search-wrap svg{flex-shrink:0;}\n'
    + '#jf-rat-search{'
    +   'background:none;border:none;outline:none;color:#fff;'
    +   'font-size:.78em;width:110px;font-family:inherit;'
    + '}\n'
    + '#jf-rat-search::placeholder{color:rgba(255,255,255,.3);}\n'

    /* Body */
    + '#jf-rat-body{'
    +   'flex:1;overflow-y:auto;padding:0 3.5% 3em;'
    +   'scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent;'
    + '}\n'
    + '#jf-rat-body::-webkit-scrollbar{width:4px;}\n'
    + '#jf-rat-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:2px;}\n'

    /* Section */
    + '.jf-rat-section{padding-top:32px;}\n'
    + '.jf-rat-section h2{'
    +   'font-size:1.2em;font-weight:300;letter-spacing:.04em;'
    +   'margin:0 0 .4em;color:rgba(255,255,255,.9);'
    + '}\n'
    + '.jf-rat-subtitle{'
    +   'font-size:.72em;color:rgba(255,255,255,.3);'
    +   'letter-spacing:.08em;text-transform:uppercase;margin-bottom:16px;'
    + '}\n'

    /* Rank list */
    + '.jf-rat-list{display:flex;flex-direction:column;gap:2px;}\n'
    + '.jf-rat-item-wrap{border-radius:9px;overflow:hidden;margin-bottom:2px;}\n'
    + '.jf-rat-row{'
    +   'display:flex;align-items:center;gap:13px;padding:9px 12px;cursor:pointer;'
    +   'transition:background .15s;'
    + '}\n'
    + '.jf-rat-row:hover{background:rgba(255,255,255,.05);}\n'
    + '.jf-rat-row.highlighted{background:rgba(255,255,255,.06);}\n'
    + '.jf-rat-rank{font-size:1.2em;width:30px;text-align:center;flex-shrink:0;}\n'
    + '.jf-rat-rank.plain{font-size:.82em;color:rgba(255,255,255,.25);font-weight:600;}\n'
    + '.jf-rat-poster{'
    +   'width:38px;height:55px;border-radius:5px;'
    +   'background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.06);'
    +   'flex-shrink:0;object-fit:cover;'
    + '}\n'
    + '.jf-rat-info{flex:1;min-width:0;}\n'
    + '.jf-rat-name{font-size:.87em;font-weight:500;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}\n'
    + '.jf-rat-meta{font-size:.7em;color:rgba(255,255,255,.38);margin-top:2px;}\n'
    + '.jf-rat-score{text-align:right;flex-shrink:0;margin-right:8px;}\n'
    + '.jf-rat-avg{font-size:1.2em;font-weight:500;color:#fff;line-height:1;}\n'
    + '.jf-rat-avg small{font-size:.52em;color:rgba(255,255,255,.28);font-weight:300;}\n'
    + '.jf-rat-stars{font-size:.62em;color:rgba(255,255,255,.55);margin-top:2px;letter-spacing:1px;}\n'
    + '.jf-rat-rcount{font-size:.62em;color:rgba(255,255,255,.28);margin-top:1px;}\n'

    /* Expand button */
    + '.jf-rat-expand{'
    +   'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);'
    +   'color:rgba(255,255,255,.55);border-radius:6px;'
    +   'width:26px;height:26px;cursor:pointer;'
    +   'display:flex;align-items:center;justify-content:center;'
    +   'flex-shrink:0;font-size:12px;font-family:inherit;'
    +   'transition:background .15s,border-color .15s,color .15s;'
    + '}\n'
    + '.jf-rat-expand:hover{background:rgba(255,255,255,.14);color:#fff;}\n'
    + '.jf-rat-expand.open{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.3);color:#fff;}\n'

    /* Expand panel */
    + '.jf-rat-expand-panel{'
    +   'background:rgba(0,0,0,.2);padding:10px 14px;'
    +   'border-top:1px solid rgba(255,255,255,.06);'
    + '}\n'
    + '.jf-rat-expand-title{'
    +   'font-size:.65em;color:rgba(255,255,255,.3);'
    +   'letter-spacing:.08em;text-transform:uppercase;margin-bottom:9px;'
    + '}\n'
    + '.jf-rat-user-row{'
    +   'display:flex;align-items:center;gap:10px;margin-bottom:7px;'
    + '}\n'
    + '.jf-rat-user-row:last-child{margin-bottom:0;}\n'
    + '.jf-rat-avatar{'
    +   'width:22px;height:22px;border-radius:50%;'
    +   'background:rgba(255,255,255,.15);'
    +   'display:flex;align-items:center;justify-content:center;'
    +   'font-size:9px;color:rgba(255,255,255,.8);flex-shrink:0;'
    +   'overflow:hidden;'
    + '}\n'
    + '.jf-rat-avatar img{width:100%;height:100%;object-fit:cover;}\n'
    + '.jf-rat-uname{font-size:.78em;color:rgba(255,255,255,.7);flex:1;}\n'
    + '.jf-rat-ustars{font-size:.65em;color:rgba(255,255,255,.5);letter-spacing:1px;}\n'
    + '.jf-rat-uscore{font-size:.78em;font-weight:500;color:rgba(255,255,255,.9);margin-left:8px;}\n'

    /* Divider */
    + '.jf-rat-divider{height:1px;background:rgba(255,255,255,.06);margin:6px 0;}\n'

    /* User pills */
    + '.jf-rat-users{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:20px;}\n'
    + '.jf-rat-upill{'
    +   'display:flex;align-items:center;gap:8px;padding:6px 14px;'
    +   'border-radius:8px;border:1px solid rgba(255,255,255,.14);'
    +   'background:rgba(255,255,255,.07);cursor:pointer;'
    +   'font-family:inherit;transition:background .15s;'
    + '}\n'
    + '.jf-rat-upill:hover{background:rgba(255,255,255,.12);}\n'
    + '.jf-rat-upill-av{'
    +   'width:22px;height:22px;border-radius:50%;'
    +   'background:rgba(255,255,255,.18);overflow:hidden;'
    +   'display:flex;align-items:center;justify-content:center;'
    +   'font-size:9px;color:rgba(255,255,255,.85);flex-shrink:0;'
    + '}\n'
    + '.jf-rat-upill-av img{width:100%;height:100%;object-fit:cover;}\n'
    + '.jf-rat-upill-name{font-size:.82em;color:#fff;}\n'
    + '.jf-rat-upill-count{font-size:.7em;color:rgba(255,255,255,.3);margin-left:2px;}\n'

    /* Detail pane */
    + '.jf-rat-detail-header{'
    +   'display:flex;align-items:center;gap:8px;margin-bottom:14px;'
    + '}\n'
    + '.jf-rat-back{'
    +   'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);'
    +   'color:rgba(255,255,255,.7);border-radius:6px;'
    +   'padding:4px 10px;font-size:.75em;cursor:pointer;font-family:inherit;'
    +   'transition:background .15s;'
    + '}\n'
    + '.jf-rat-back:hover{background:rgba(255,255,255,.14);color:#fff;}\n'
    + '.jf-rat-detail-label{font-size:.82em;color:rgba(255,255,255,.5);}\n'

    /* Poster grid (watchlist) */
    + '.jf-rat-cards{display:flex;flex-wrap:wrap;gap:12px;}\n'
    + '.jf-rat-card{width:120px;flex-shrink:0;cursor:pointer;transition:transform .2s,opacity .2s;}\n'
    + '.jf-rat-card:hover{transform:scale(1.05);opacity:.85;}\n'
    + '.jf-rat-card-img{'
    +   'width:120px;height:180px;border-radius:7px;overflow:hidden;'
    +   'background:rgba(255,255,255,.06);position:relative;'
    +   'border:1px solid rgba(255,255,255,.08);'
    + '}\n'
    + '.jf-rat-card-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}\n'
    + '.jf-rat-card-title{font-size:.75em;margin-top:6px;text-align:center;color:rgba(255,255,255,.85);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}\n'
    + '.jf-rat-card-sub{font-size:.68em;margin-top:2px;text-align:center;color:rgba(255,255,255,.4);white-space:nowrap;}\n'

    /* History rows */
    + '.jf-rat-hist-row{'
    +   'display:flex;align-items:center;gap:13px;'
    +   'padding:9px 12px;border-radius:9px;'
    +   'cursor:pointer;transition:background .15s;'
    + '}\n'
    + '.jf-rat-hist-row:hover{background:rgba(255,255,255,.05);}\n'
    + '.jf-rat-hist-row.highlighted{background:rgba(255,255,255,.06);}\n'
    + '.jf-rat-hist-date{width:34px;text-align:center;flex-shrink:0;}\n'
    + '.jf-rat-hist-day{font-size:1.05em;font-weight:400;color:rgba(255,255,255,.9);line-height:1;}\n'
    + '.jf-rat-hist-mon{font-size:.62em;color:rgba(255,255,255,.3);}\n'

    /* States */
    + '.jf-rat-spinner{padding:3em;text-align:center;color:rgba(255,255,255,.4);}\n'
    + '.jf-rat-empty{padding:2em 0;color:rgba(255,255,255,.25);font-size:.88em;font-style:italic;}\n'
    + '.jf-rat-error{padding:1.5em;color:#f88;font-size:.85em;background:rgba(255,80,80,.08);border-radius:8px;margin:1.5em 0;}\n'

    + '@media(max-width:600px){'
    +   '#jf-rat-header{padding:12px 4%;}'
    +   '#jf-rat-body{padding:0 4% 3em;}'
    +   '.jf-rat-card,.jf-rat-card-img{width:calc(33vw - 18px);height:calc((33vw - 18px)*1.5);}'
    + '}\n';

  /* ── Inject CSS ──────────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('jf-rat-css')) return;
    var s = document.createElement('style');
    s.id = 'jf-rat-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  function getAC()     { return window.ApiClient; }
  function getServer() { var ac = getAC(); return ac ? (ac._serverAddress || ac._serverUrl || '').replace(/\/$/, '') : ''; }
  function getToken()  { var ac = getAC(); return ac ? (ac._token || (ac.accessToken && ac.accessToken()) || '') : ''; }
  function getUserId() { var ac = getAC(); return ac ? (ac._currentUserId || (ac.getCurrentUserId && ac.getCurrentUserId()) || '') : ''; }
  function authHdr()   { return { 'X-Emby-Token': getToken(), 'X-MediaBrowser-Token': getToken() }; }
  function jfGet(path, params) {
    var qs = params ? ('?' + Object.keys(params).map(function(k){ return encodeURIComponent(k)+'='+encodeURIComponent(params[k]); }).join('&')) : '';
    return fetch(getServer() + '/' + path + qs, { headers: authHdr() }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
  }
  function ratGet(path) {
    return fetch(getServer() + path, { headers: authHdr() }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
  }
  function starsStr(rating, max) {
    /* rating is 1-10 from k3ntas, display as 5 stars */
    max = max || 10;
    var filled = Math.round(rating / max * 5);
    var empty  = 5 - filled;
    return '★'.repeat(Math.max(0, filled)) + '☆'.repeat(Math.max(0, empty));
  }
  function initials(name) {
    if (!name) return '?';
    var p = name.trim().split(/\s+/);
    return p.length > 1 ? (p[0][0] + p[p.length-1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }
  function navTo(itemId) {
    var ac = getAC();
    var sid = ac && ((ac._serverInfo && ac._serverInfo.Id) || (ac.serverId && ac.serverId()));
    closeOverlay();
    setTimeout(function(){
      if (window.appRouter && appRouter.showItem) { appRouter.showItem({ Id: itemId, ServerId: sid }); return; }
      if (window.Emby && Emby.Page && Emby.Page.showItem) { Emby.Page.showItem(itemId); return; }
      window.location.hash = '#!/details?id=' + itemId + (sid ? '&serverId=' + sid : '');
    }, 200);
  }
  function posterUrl(item, size) {
    size = size || 300;
    if (item.ImageTags && item.ImageTags.Primary) {
      return getServer() + '/Items/' + item.Id + '/Images/Primary?tag=' + item.ImageTags.Primary + '&maxHeight=' + size + '&quality=85';
    }
    if (item.SeriesId && item.SeriesPrimaryImageTag) {
      return getServer() + '/Items/' + item.SeriesId + '/Images/Primary?tag=' + item.SeriesPrimaryImageTag + '&maxHeight=' + size + '&quality=85';
    }
    return '';
  }
  function avatarUrl(userId) {
    return getServer() + '/Users/' + userId + '/Images/Primary?maxHeight=64&quality=85';
  }

  /* ── ESC ─────────────────────────────────────────────────── */
  var escHandler = function(e) { if (e.key === 'Escape') closeOverlay(); };

  /* ── Close ───────────────────────────────────────────────── */
  function closeOverlay() {
    document.removeEventListener('keydown', escHandler);
    var o = document.getElementById('jf-rat-overlay');
    if (o) o.remove();
    /* reset ir-widget just in case */
    var w = document.getElementById('ir-widget');
    if (w) w.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════
     OPEN OVERLAY
  ══════════════════════════════════════════════════════════ */
  var openOverlay = function() {
    if (document.getElementById('jf-rat-overlay')) { closeOverlay(); return; }
    injectCSS();

    var overlay = document.createElement('div');
    overlay.id = 'jf-rat-overlay';
    overlay.innerHTML =
      '<div id="jf-rat-header">'
      +  '<div id="jf-rat-title">'
      +    '<svg viewBox="0 0 24 24" width="18" height="18" style="flex-shrink:0;opacity:0.88;fill:rgba(255,255,255,0.85)">'
      +      '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
      +    '</svg>'
      +    'Ratings'
      +  '</div>'
      +  '<div id="jf-rat-nav">'
      +    '<button class="jf-rat-btn active" data-tab="movies">Movies</button>'
      +    '<button class="jf-rat-btn" data-tab="series">Series</button>'
      +    '<button class="jf-rat-btn" data-tab="watchlist">Watchlist</button>'
      +    '<button class="jf-rat-btn" data-tab="history">History</button>'
      +  '</div>'
      +  '<div id="jf-rat-search-wrap">'
      +    '<svg viewBox="0 0 24 24" width="13" height="13" style="fill:none;stroke:rgba(255,255,255,.45);stroke-width:2;stroke-linecap:round">'
      +      '<circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/>'
      +    '</svg>'
      +    '<input id="jf-rat-search" type="text" placeholder="Search titles…" autocomplete="off"/>'
      +  '</div>'
      +  '<button id="jf-rat-close">✕</button>'
      + '</div>'
      + '<div id="jf-rat-body">'
      +   '<div class="jf-rat-spinner">Loading…</div>'
      + '</div>';

    document.body.appendChild(overlay);
    document.addEventListener('keydown', escHandler);

    document.getElementById('jf-rat-close').onclick = closeOverlay;

    /* Tab switching */
    var currentTab = 'movies';
    var searchVal  = '';
    overlay.querySelectorAll('.jf-rat-btn[data-tab]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        overlay.querySelectorAll('.jf-rat-btn[data-tab]').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        document.getElementById('jf-rat-search').value = '';
        searchVal = '';
        renderTab(currentTab);
      });
    });

    /* Search */
    document.getElementById('jf-rat-search').addEventListener('input', function() {
      searchVal = this.value.trim().toLowerCase();
      filterTab(currentTab, searchVal);
    });

    /* Load everything, then render first tab */
    loadData().then(function() {
      renderTab('movies');
    });
  };

  /* ══════════════════════════════════════════════════════════
     DATA CACHE
  ══════════════════════════════════════════════════════════ */
  var cache = {
    movies:  null,   /* rated movie entries sorted */
    series:  null,   /* rated series entries sorted */
    users:   null,   /* [{Id, Name, imgFails}] */
    wl:      {},     /* userId → items[] */
    hist:    {}      /* userId → items[] */
  };

  function loadData() {
    return Promise.all([
      loadRanking('Movie').then(function(r){ cache.movies = r; }),
      loadRanking('Series').then(function(r){ cache.series = r; }),
      loadUsers().then(function(r){ cache.users = r; })
    ]);
  }

  /* ── Ranking ─────────────────────────────────────────────── */
  function loadRanking(type) {
    return jfGet('Items', {
      Recursive: true,
      IncludeItemTypes: type,
      Fields: 'ProductionYear,Genres,ImageTags',
      Limit: 1000,
      UserId: getUserId()
    }).then(function(data) {
      if (!data || !data.Items) return [];
      var items = data.Items;
      /* Batch-fetch stats 30 at a time */
      var results = new Array(items.length).fill(null);
      var idx = 0;
      function next() {
        if (idx >= items.length) return Promise.resolve();
        var s = idx; idx += 30;
        return Promise.all(
          items.slice(s, s + 30).map(function(item, i) {
            return ratGet('/Ratings/Items/' + item.Id + '/Stats').then(function(st) {
              results[s + i] = st;
            });
          })
        ).then(next);
      }
      return next().then(function() {
        var ranked = [];
        items.forEach(function(item, i) {
          var st = results[i];
          if (!st || !st.TotalRatings || st.TotalRatings === 0) return;
          ranked.push({
            id:        item.Id,
            name:      item.Name,
            year:      item.ProductionYear || '',
            genres:    (item.Genres || []).slice(0, 2).join(' · '),
            avg:       parseFloat(st.AverageRating || 0),
            count:     st.TotalRatings || 0,
            imgTag:    item.ImageTags && item.ImageTags.Primary,
            type:      item.Type
          });
        });
        ranked.sort(function(a, b){ return b.avg - a.avg || b.count - a.count; });
        return ranked;
      });
    });
  }

  /* ── Users ───────────────────────────────────────────────── */
  function loadUsers() {
    return jfGet('Users').then(function(data) {
      if (!Array.isArray(data)) return [];
      return data.map(function(u) {
        return { Id: u.Id, Name: u.Name };
      });
    });
  }

  /* ── Detailed ratings for one item ──────────────────────── */
  function loadDetailedRatings(itemId) {
    return ratGet('/Ratings/Items/' + itemId + '/DetailedRatings');
  }

  /* ── Watchlist (Favorites) for one user ─────────────────── */
  function loadWatchlist(userId) {
    if (cache.wl[userId]) return Promise.resolve(cache.wl[userId]);
    return jfGet('Users/' + userId + '/Items', {
      Filters: 'IsFavorite',
      Recursive: true,
      IncludeItemTypes: 'Movie,Series',
      Fields: 'ImageTags,ProductionYear',
      Limit: 200
    }).then(function(data) {
      var items = (data && data.Items) || [];
      cache.wl[userId] = items;
      return items;
    });
  }

  /* ── History for one user ─────────────────────────────────
     Uses Playback Reporting plugin if available,
     falls back to Jellyfin played items.                     */
  function loadHistory(userId) {
    if (cache.hist[userId]) return Promise.resolve(cache.hist[userId]);

    /* Try Playback Reporting first */
    return fetch(getServer() + '/user_usage_stats/UserPlaylist?user_id=' + userId + '&days=90&limit=100', { headers: authHdr() })
      .then(function(r) {
        if (!r.ok) throw new Error('no playback reporting');
        return r.json();
      })
      .then(function(data) {
        /* Playback Reporting returns an array of play events */
        var rows = Array.isArray(data) ? data : (data.results || data.Items || []);
        var items = rows.map(function(row) {
          return {
            Id:          row.ItemId || row.id || '',
            Name:        row.ItemName || row.name || row.NowPlayingItemName || '',
            Type:        row.ItemType || row.type || '',
            SeriesName:  row.SeriesName || '',
            SeasonNum:   row.SeasonNumber,
            EpisodeNum:  row.EpisodeNumber,
            PlayedDate:  row.DateCreated || row.date || '',
            RunTime:     row.PlayDuration || row.duration || 0,
            ImageTags:   { Primary: row.PrimaryImageTag || '' },
            SeriesId:    row.SeriesId || ''
          };
        });
        cache.hist[userId] = items;
        return items;
      })
      .catch(function() {
        /* Fallback: Jellyfin played items */
        return jfGet('Users/' + userId + '/Items', {
          Filters: 'IsPlayed',
          Recursive: true,
          IncludeItemTypes: 'Movie,Episode',
          SortBy: 'DatePlayed',
          SortOrder: 'Descending',
          Fields: 'ImageTags,SeriesName,ParentIndexNumber,IndexNumber,RunTimeTicks,SeriesId',
          Limit: 100
        }).then(function(data) {
          var items = (data && data.Items) || [];
          cache.hist[userId] = items;
          return items;
        });
      });
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  function getBody() { return document.getElementById('jf-rat-body'); }

  function renderTab(tab) {
    var body = getBody(); if (!body) return;
    if      (tab === 'movies')    renderRanking('movies');
    else if (tab === 'series')    renderRanking('series');
    else if (tab === 'watchlist') renderUserPills('watchlist');
    else if (tab === 'history')   renderUserPills('history');
  }

  /* ── Ranking section ──────────────────────────────────────── */
  function renderRanking(tab) {
    var body = getBody(); if (!body) return;
    var items = cache[tab];
    if (!items) { body.innerHTML = '<div class="jf-rat-spinner">Loading…</div>'; return; }
    body.innerHTML = '';
    var sec = document.createElement('div');
    sec.className = 'jf-rat-section';
    sec.innerHTML = '<h2>' + (tab === 'movies' ? 'Ranked Movies' : 'Ranked Series') + '</h2>'
      + '<div class="jf-rat-subtitle">' + items.length + ' rated title' + (items.length !== 1 ? 's' : '') + '</div>';

    if (!items.length) {
      sec.innerHTML += '<div class="jf-rat-empty">No rated titles yet.</div>';
      body.appendChild(sec);
      return;
    }

    var list = document.createElement('div');
    list.className = 'jf-rat-list';

    items.forEach(function(item, i) {
      var rank = i + 1;
      var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
      var img = item.imgTag
        ? getServer() + '/Items/' + item.id + '/Images/Primary?tag=' + item.imgTag + '&maxHeight=110&quality=85'
        : '';

      if (rank === 4 && items.length > 3) {
        var div = document.createElement('div');
        div.className = 'jf-rat-divider';
        list.appendChild(div);
      }

      var wrap = document.createElement('div');
      wrap.className = 'jf-rat-item-wrap';
      wrap.dataset.name = item.name.toLowerCase();

      var row = document.createElement('div');
      row.className = 'jf-rat-row' + (rank <= 3 ? ' highlighted' : '');
      row.innerHTML =
          '<div class="jf-rat-rank' + (medal ? '' : ' plain') + '">' + (medal || rank) + '</div>'
        + (img
            ? '<img class="jf-rat-poster" src="' + img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
            : '<div class="jf-rat-poster" style="display:flex;align-items:center;justify-content:center;font-size:16px;color:rgba(255,255,255,0.1);">▪</div>'
          )
        + '<div class="jf-rat-info">'
        +   '<div class="jf-rat-name">' + esc(item.name) + '</div>'
        +   '<div class="jf-rat-meta">' + item.year + (item.genres ? ' · ' + esc(item.genres) : '') + '</div>'
        + '</div>'
        + '<div class="jf-rat-score">'
        +   '<div class="jf-rat-avg">' + item.avg.toFixed(1) + '<small>/10</small></div>'
        +   '<div class="jf-rat-stars">' + starsStr(item.avg) + '</div>'
        +   '<div class="jf-rat-rcount">' + item.count + ' rating' + (item.count !== 1 ? 's' : '') + '</div>'
        + '</div>'
        + '<button class="jf-rat-expand" title="Show user ratings">▾</button>';

      var expandBtn = row.querySelector('.jf-rat-expand');
      var panel = document.createElement('div');
      panel.className = 'jf-rat-expand-panel';
      panel.style.display = 'none';
      panel.innerHTML = '<div class="jf-rat-spinner" style="padding:1em 0;">Loading ratings…</div>';

      expandBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = panel.style.display !== 'none';
        if (open) {
          panel.style.display = 'none';
          expandBtn.textContent = '▾';
          expandBtn.classList.remove('open');
        } else {
          panel.style.display = 'block';
          expandBtn.textContent = '▴';
          expandBtn.classList.add('open');
          if (!panel.dataset.loaded) {
            panel.dataset.loaded = '1';
            loadDetailedRatings(item.id).then(function(data) {
              renderUserRatings(panel, data);
            });
          }
        }
      });

      row.addEventListener('click', function(e) {
        if (e.target === expandBtn || expandBtn.contains(e.target)) return;
        navTo(item.id);
      });

      wrap.appendChild(row);
      wrap.appendChild(panel);
      list.appendChild(wrap);
    });

    sec.appendChild(list);
    body.appendChild(sec);
  }

  function renderUserRatings(panel, data) {
    if (!data || (Array.isArray(data) && !data.length)) {
      panel.innerHTML = '<div class="jf-rat-expand-title">User ratings</div><div class="jf-rat-empty">No individual ratings found.</div>';
      return;
    }
    /* data can be array or object with Ratings property */
    var rows = Array.isArray(data) ? data : (data.Ratings || data.ratings || []);
    if (!rows.length) {
      panel.innerHTML = '<div class="jf-rat-expand-title">User ratings</div><div class="jf-rat-empty">No individual ratings found.</div>';
      return;
    }
    rows.sort(function(a, b) { return (b.Rating || b.rating || 0) - (a.Rating || a.rating || 0); });
    var html = '<div class="jf-rat-expand-title">User ratings</div>';
    rows.forEach(function(r) {
      var uname  = r.UserName || r.userName || r.Name || r.name || 'User';
      var uid    = r.UserId   || r.userId   || '';
      var rating = parseFloat(r.Rating || r.rating || 0);
      var av = uid
        ? '<div class="jf-rat-avatar"><img src="' + avatarUrl(uid) + '" alt="" onerror="this.parentElement.textContent=\'' + initials(uname).replace("'", "\\'") + '\'"></div>'
        : '<div class="jf-rat-avatar">' + initials(uname) + '</div>';
      html += '<div class="jf-rat-user-row">'
        + av
        + '<span class="jf-rat-uname">' + esc(uname) + '</span>'
        + '<span class="jf-rat-ustars">' + starsStr(rating) + '</span>'
        + '<span class="jf-rat-uscore">' + rating.toFixed(1) + '/10</span>'
        + '</div>';
    });
    panel.innerHTML = html;
  }

  /* ── Filter visible rows by search term ───────────────────── */
  function filterTab(tab, q) {
    var body = getBody(); if (!body) return;
    if (tab === 'movies' || tab === 'series') {
      body.querySelectorAll('.jf-rat-item-wrap').forEach(function(wrap) {
        var name = wrap.dataset.name || '';
        wrap.style.display = (!q || name.includes(q)) ? '' : 'none';
      });
    } else if (tab === 'watchlist' || tab === 'history') {
      body.querySelectorAll('.jf-rat-card').forEach(function(card) {
        var name = (card.dataset.name || '');
        card.style.display = (!q || name.includes(q)) ? '' : 'none';
      });
      body.querySelectorAll('.jf-rat-hist-row').forEach(function(row) {
        var name = (row.dataset.name || '');
        row.style.display = (!q || name.includes(q)) ? '' : 'none';
      });
    }
  }

  /* ── User pills (shared for Watchlist + History) ──────────── */
  function renderUserPills(mode) {
    var body = getBody(); if (!body) return;
    body.innerHTML = '';
    var sec = document.createElement('div');
    sec.className = 'jf-rat-section';
    sec.innerHTML = '<h2>' + (mode === 'watchlist' ? 'Watchlists' : 'Watch History') + '</h2>';

    if (!cache.users || !cache.users.length) {
      sec.innerHTML += '<div class="jf-rat-empty">No users found.</div>';
      body.appendChild(sec);
      return;
    }

    var pillsDiv = document.createElement('div');
    pillsDiv.className = 'jf-rat-users';

    cache.users.forEach(function(user) {
      var pill = document.createElement('button');
      pill.className = 'jf-rat-upill';
      pill.innerHTML =
          '<div class="jf-rat-upill-av">'
        +   '<img src="' + avatarUrl(user.Id) + '" alt="" onerror="this.parentElement.textContent=\'' + initials(user.Name).replace("'","\\'") + '\'">'
        + '</div>'
        + '<span class="jf-rat-upill-name">' + esc(user.Name) + '</span>';
      pill.addEventListener('click', function() {
        if (mode === 'watchlist') showWatchlist(user, sec, pillsDiv);
        else                      showHistory(user, sec, pillsDiv);
      });
      pillsDiv.appendChild(pill);
    });

    sec.appendChild(pillsDiv);
    body.appendChild(sec);
  }

  /* ── Watchlist detail ─────────────────────────────────────── */
  function showWatchlist(user, sec, pillsDiv) {
    pillsDiv.style.display = 'none';
    var detail = document.createElement('div');
    detail.innerHTML = backHeader(user, 'watchlist');
    detail.querySelector('.jf-rat-back').addEventListener('click', function() {
      detail.remove();
      pillsDiv.style.display = '';
    });

    var grid = document.createElement('div');
    grid.className = 'jf-rat-cards';
    grid.innerHTML = '<div class="jf-rat-spinner">Loading…</div>';
    detail.appendChild(grid);
    sec.appendChild(detail);

    loadWatchlist(user.Id).then(function(items) {
      grid.innerHTML = '';
      if (!items.length) {
        grid.innerHTML = '<div class="jf-rat-empty">Watchlist is empty.</div>';
        return;
      }
      items.forEach(function(item) {
        var img = posterUrl(item, 300);
        var card = document.createElement('div');
        card.className = 'jf-rat-card';
        card.dataset.name = (item.Name || '').toLowerCase();
        card.innerHTML =
            '<div class="jf-rat-card-img">'
          +   (img ? '<img src="' + img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '')
          + '</div>'
          + '<div class="jf-rat-card-title">' + esc(item.Name || '') + '</div>'
          + '<div class="jf-rat-card-sub">' + (item.ProductionYear || '') + '</div>';
        card.addEventListener('click', function(){ navTo(item.Id); });
        grid.appendChild(card);
      });
    });
  }

  /* ── History detail ───────────────────────────────────────── */
  function showHistory(user, sec, pillsDiv) {
    pillsDiv.style.display = 'none';
    var detail = document.createElement('div');
    detail.innerHTML = backHeader(user, 'history');
    detail.querySelector('.jf-rat-back').addEventListener('click', function() {
      detail.remove();
      pillsDiv.style.display = '';
    });

    var list = document.createElement('div');
    list.innerHTML = '<div class="jf-rat-spinner">Loading…</div>';
    detail.appendChild(list);
    sec.appendChild(detail);

    loadHistory(user.Id).then(function(items) {
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<div class="jf-rat-empty">No watch history found.</div>';
        return;
      }
      var prevMonth = '';
      items.forEach(function(item, idx) {
        var d = item.PlayedDate ? new Date(item.PlayedDate) : null;
        var month = d ? d.toLocaleString('en', { month: 'long', year: 'numeric' }) : '';
        if (month && month !== prevMonth) {
          prevMonth = month;
          var mHead = document.createElement('div');
          mHead.className = 'jf-rat-subtitle';
          mHead.style.paddingTop = idx === 0 ? '0' : '16px';
          mHead.textContent = month;
          list.appendChild(mHead);
        }

        var row = document.createElement('div');
        row.className = 'jf-rat-hist-row' + (idx % 2 === 0 ? ' highlighted' : '');
        row.dataset.name = ((item.Name || '') + ' ' + (item.SeriesName || '')).toLowerCase();

        var dayNum = d ? d.getDate() : '';
        var monStr = d ? d.toLocaleString('en', { month: 'short' }) : '';
        var img = posterUrl(item, 110);
        var title = item.SeriesName || item.Name || '';
        var sub   = '';
        if (item.Type === 'Episode' || (item.SeriesName && item.SeriesName !== item.Name)) {
          var sn = item.ParentIndexNumber != null ? item.ParentIndexNumber : (item.SeasonNum != null ? item.SeasonNum : null);
          var en = item.IndexNumber != null ? item.IndexNumber : (item.EpisodeNum != null ? item.EpisodeNum : null);
          if (sn != null && en != null) sub = 'S' + sn + ' E' + en;
          else if (en != null) sub = 'E' + en;
        } else {
          sub = 'Movie';
          if (item.RunTime) sub += ' · ' + Math.round(item.RunTime / 600000000) + ' min';
          else if (item.RunTimeTicks) sub += ' · ' + Math.round(item.RunTimeTicks / 600000000) + ' min';
        }

        row.innerHTML =
            '<div class="jf-rat-hist-date">'
          +   (dayNum ? '<div class="jf-rat-hist-day">' + dayNum + '</div><div class="jf-rat-hist-mon">' + monStr + '</div>' : '<div class="jf-rat-hist-day">—</div>')
          + '</div>'
          + (img
              ? '<img class="jf-rat-poster" src="' + img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
              : '<div class="jf-rat-poster" style="display:flex;align-items:center;justify-content:center;font-size:16px;color:rgba(255,255,255,0.1);">▪</div>'
            )
          + '<div class="jf-rat-info">'
          +   '<div class="jf-rat-name">' + esc(title) + '</div>'
          +   '<div class="jf-rat-meta">' + esc(sub) + '</div>'
          + '</div>';

        if (item.Id) {
          row.style.cursor = 'pointer';
          row.addEventListener('click', function(){ navTo(item.Id); });
        }
        list.appendChild(row);
      });
    });
  }

  function backHeader(user, mode) {
    return '<div class="jf-rat-detail-header">'
      + '<button class="jf-rat-back">← Back</button>'
      + '<span class="jf-rat-detail-label">'
      +   '<span style="display:inline-flex;align-items:center;gap:6px;">'
      +     '<span style="display:inline-flex;width:18px;height:18px;border-radius:50%;'
      +       'background:rgba(255,255,255,.18);align-items:center;justify-content:center;'
      +       'font-size:8px;color:rgba(255,255,255,.85);">' + initials(user.Name) + '</span>'
      +     esc(user.Name) + "'s " + mode
      +   '</span>'
      + '</span>'
      + '</div>';
  }

  function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ══════════════════════════════════════════════════════════
     PATCH RATINGS TAB
  ══════════════════════════════════════════════════════════ */
  function patchRatingsTab() {
    /* Look for any tab/button whose text is exactly "Ratings" */
    var allBtns = document.querySelectorAll(
      '[id^="customTabButton"], .emby-tab-button, [class*="tabButton"], [class*="tab-button"]'
    );
    allBtns.forEach(function(btn) {
      if (btn.dataset.jfRatPatched) return;
      var textEl = btn.querySelector('.emby-tab-button-text, span') || btn;
      var text   = textEl.textContent.trim();
      if (!/^ratings$/i.test(text)) return;

      btn.dataset.jfRatPatched = '1';
      btn.classList.add('jf-rat-tab-patched');

      /* Add star icon above text */
      var iconSpan = document.createElement('span');
      iconSpan.className = 'jf-rat-tab-icon';
      iconSpan.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>';
      btn.insertBefore(iconSpan, btn.firstChild);

      /* Intercept click → open overlay instead of navigating */
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openOverlay();
      }, true);

      console.log('[Ratings] Tab patched ✓');
    });
  }

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  injectCSS();

  var iv = setInterval(function() {
    if (typeof ApiClient === 'undefined') return;
    injectCSS();
    patchRatingsTab();
    var w = document.getElementById('ir-widget');
    if (w) w.style.display = 'none';
  }, 400);

  /* Stop polling after 20s but keep MutationObserver */
  setTimeout(function() { clearInterval(iv); }, 20000);

  /* Re-patch after SPA navigation */
  var obs = new MutationObserver(function() {
    patchRatingsTab();
    var w = document.getElementById('ir-widget');
    if (w) w.style.display = 'none';
  });
  if (document.body) obs.observe(document.body, { childList: true, subtree: true });

  /* Public API so Custom Tab HTML can also trigger it */
  window.__openRatingsOverlay = openOverlay;

  console.log('[Ratings Overlay] Loaded ✓');
})();
