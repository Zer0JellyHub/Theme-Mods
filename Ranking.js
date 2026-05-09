/* ══════════════════════════════════════════════════════════
   Jellyfin Ranking Tab — Fullscreen + Smart Cache
   · Vollbild wie Calendar
   · Sofort aus Cache rendern
   · Nur letzte 24h inkrementell nachladen
   · Serien-Cache: 3 Monate TTL / Film-Cache: 6 Monate TTL
   · Neuer User → automatischer Full-Reload
   · API_KEY für Admin-Zugriff → alle User sehen dasselbe
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var CACHE_KEY    = 'jfrank_v2';
  var API_KEY      = '104c958c9fe149cf881d7841e986a5fe';
  var TTL_FILM     = 6  * 30 * 24 * 3600000;
  var TTL_SERIES   = 3  * 30 * 24 * 3600000;
  var DELTA_WINDOW = 24 * 3600000;

  var COLORS = ['#7c6af7','#00a4dc','#e8871a','#4caf50','#f44336',
                '#e91e63','#00bcd4','#ff9800','#9c27b0','#607d8b'];

  var TAB_ICON = '<span class="jf-tab-icon"><svg viewBox="0 0 24 24" width="24" height="24">'
    + '<path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94'
    + '.63 1.5 1.98 2.63 3.61 2.96V17H7v2h10v-2h-4v-1.1c1.63-.33 2.98-1.46 3.61-2.96'
    + 'C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8z'
    + 'm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" fill="currentColor"/></svg></span>';

  function injectCSS() {
    if (document.getElementById('jfrank-css')) return;
    var s = document.createElement('style');
    s.id = 'jfrank-css';
    s.textContent = [
      '#jfrank-ov{position:fixed;inset:0;z-index:99999;',
        'background:rgba(0,0,0,.55);backdrop-filter:blur(24px) saturate(1.4);',
        '-webkit-backdrop-filter:blur(24px) saturate(1.4);',
        'display:flex;flex-direction:column;overflow:hidden;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',

      '#jfrank-head{display:flex;align-items:center;justify-content:space-between;',
        'padding:14px 3.5%;border-bottom:1px solid rgba(255,255,255,.12);',
        'flex-shrink:0;background:rgba(0,0,0,.2);}',
      '#jfrank-title{font-size:1.2em;font-weight:300;letter-spacing:.03em;',
        'display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.95);}',
      '#jfrank-title svg{width:20px;height:20px;flex-shrink:0;opacity:.9;}',
      '#jfrank-status{font-size:.68em;color:rgba(255,255,255,.25);margin-left:4px;font-weight:400;}',
      '#jfrank-close{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);',
        'color:rgba(255,255,255,.85);border-radius:50%;width:34px;height:34px;',
        'cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1em;',
        'transition:background .2s;}',
      '#jfrank-close:hover{background:rgba(255,255,255,.22);color:#fff;}',

      '#jfrank-body{flex:1;overflow:hidden;display:flex;padding:0 3.5%;}',

      '.jfr-col{flex:1;display:flex;flex-direction:column;min-width:0;',
        'padding:28px 16px 3em;overflow-y:auto;',
        'scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent;}',
      '.jfr-col::-webkit-scrollbar{width:4px;}',
      '.jfr-col::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:2px;}',
      '.jfr-col+.jfr-col{border-left:1px solid rgba(255,255,255,.08);}',

      '.jfr-col-head{display:flex;align-items:center;gap:6px;margin-bottom:16px;justify-content:space-between;}',

      '.jfr-period{font-size:10px;color:rgba(255,255,255,.75);',
        'border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);',
        'border-radius:999px;padding:3px 10px;white-space:nowrap;margin-left:auto;',
        'font-weight:500;letter-spacing:.02em;}',

      '.jfr-col-head svg{width:14px;height:14px;fill:rgba(255,255,255,.4);}',
      '.jfr-col-label{font-size:.68em;font-weight:600;letter-spacing:.1em;',
        'text-transform:uppercase;color:rgba(255,255,255,.3);}',

      '.jfr-row{display:flex;align-items:center;gap:10px;padding:8px 0;',
        'border-bottom:1px solid rgba(255,255,255,.04);transition:background .12s;}',
      '.jfr-row:last-child{border-bottom:none;}',

      '.jfr-rank{width:24px;text-align:center;font-size:14px;flex-shrink:0;line-height:1;}',
      '.jfr-rank.n{font-size:12px;font-weight:500;color:rgba(255,255,255,.2);}',

      '.jfr-av{width:36px;height:36px;border-radius:50%;flex-shrink:0;overflow:hidden;',
        'position:relative;display:flex;align-items:center;justify-content:center;',
        'font-size:12px;font-weight:600;color:#fff;}',
      '.jfr-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}',

      '.jfr-info{flex:1;min-width:0;}',
      '.jfr-name{font-size:13px;font-weight:500;color:rgba(255,255,255,.9);',
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.jfr-sub{font-size:10px;color:rgba(255,255,255,.3);margin-top:2px;}',
      '.jfr-bar{height:3px;background:rgba(255,255,255,.07);border-radius:2px;margin-top:5px;}',
      '.jfr-bar-fill{height:3px;border-radius:2px;transition:width .4s ease;}',

      '.jfr-time{font-size:12px;font-weight:500;color:rgba(255,255,255,.55);',
        'white-space:nowrap;flex-shrink:0;text-align:right;min-width:38px;}',

      '.jfr-divider{height:1px;background:rgba(255,255,255,.06);margin:4px 0 8px;}',

      '.jfr-spin{padding:3em;text-align:center;color:rgba(255,255,255,.3);font-size:.9em;}',
      '.jfr-empty{padding:2em 0;color:rgba(255,255,255,.2);font-size:.85em;font-style:italic;}',
    ].join('');
    document.head.appendChild(s);
  }

  function ac() { return window.ApiClient; }
  function srv() { var a=ac(); return a?(a._serverAddress||a._serverUrl||'').replace(/\/$/,''):''; }

  function jfetch(path) {
    return fetch(srv() + path, { headers: { 'X-Emby-Token': API_KEY } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }

  function ini(n) {
    if(!n)return'?';
    var p=n.trim().split(/\s+/);
    return p.length>1?(p[0][0]+p[p.length-1][0]).toUpperCase():n.substring(0,2).toUpperCase();
  }

  function loadCache() {
    try { var r=localStorage.getItem(CACHE_KEY); return r?JSON.parse(r):null; }
    catch(e){ return null; }
  }
  function saveCache(c) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch(e){}
  }
  function freshCache() {
    return { filmData:{}, seriesData:{}, filmReset:Date.now(), seriesReset:Date.now(), lastDelta:0 };
  }

  function ticksToH(t) { return t / 36000000000; }

  function usersChanged(cachedUsers, liveUsers) {
    if (!cachedUsers || cachedUsers.length !== liveUsers.length) return true;
    var cachedSig = cachedUsers.map(function(u){ return u.Id+'|'+(u.Name||''); }).sort().join(',');
    var liveSig   = liveUsers.map(function(u){ return u.Id+'|'+(u.Name||''); }).sort().join(',');
    return cachedSig !== liveSig;
  }

  function fetchDelta(userId, type, sinceIso) {
    var url = '/Users/'+userId+'/Items'
      + '?IncludeItemTypes='+type
      + '&Recursive=true'
      + '&Filters=IsPlayed'
      + '&SortBy=DatePlayed'
      + '&Fields=RunTimeTicks'
      + '&MinDateLastSavedForUser='+encodeURIComponent(sinceIso)
      + '&Limit=500';
    return jfetch(url).then(function(d){ return d&&d.Items?d.Items:[]; });
  }

  function fetchFull(userId, type, limit) {
    var url = '/Users/'+userId+'/Items'
      + '?IncludeItemTypes='+type
      + '&Recursive=true'
      + '&Filters=IsPlayed'
      + '&Fields=RunTimeTicks'
      + '&Limit='+(limit||1000);
    return jfetch(url).then(function(d){ return d&&d.Items?d.Items:[]; });
  }

  function updateRanking(forceCache) {
    var cache = forceCache || loadCache() || freshCache();
    var now   = Date.now();

    var filmExpired   = (now - cache.filmReset)  > TTL_FILM;
    var seriesExpired = (now - cache.seriesReset) > TTL_SERIES;
    if (filmExpired)   { cache.filmData   = {}; cache.filmReset   = now; }
    if (seriesExpired) { cache.seriesData = {}; cache.seriesReset = now; }

    var since    = new Date(Math.max(0, cache.lastDelta || 0));
    var sinceIso = since.toISOString();
    var isDelta  = cache.lastDelta > 0 && !filmExpired && !seriesExpired;

    return jfetch('/Users').then(function(users) {
      if (!Array.isArray(users)) users = [];

      var promises = users.map(function(user) {
        var uid2 = user.Id;

        var filmP = (isDelta ? fetchDelta(uid2,'Movie',sinceIso) : fetchFull(uid2,'Movie',500))
          .then(function(items) {
            if (!cache.filmData[uid2]) cache.filmData[uid2] = { count:0, hours:0 };
            if (isDelta) {
              items.forEach(function(it) {
                cache.filmData[uid2].count++;
                cache.filmData[uid2].hours += ticksToH(it.RunTimeTicks||0);
              });
            } else {
              cache.filmData[uid2] = {
                count: items.length,
                hours: items.reduce(function(s,it){ return s+ticksToH(it.RunTimeTicks||0); },0)
              };
            }
          }).catch(function(){});

        var serP = (isDelta ? fetchDelta(uid2,'Episode',sinceIso) : fetchFull(uid2,'Episode',2000))
          .then(function(items) {
            if (!cache.seriesData[uid2]) cache.seriesData[uid2] = { count:0, hours:0 };
            if (isDelta) {
              items.forEach(function(it) {
                cache.seriesData[uid2].count++;
                cache.seriesData[uid2].hours += ticksToH(it.RunTimeTicks||0);
              });
            } else {
              cache.seriesData[uid2] = {
                count: items.length,
                hours: items.reduce(function(s,it){ return s+ticksToH(it.RunTimeTicks||0); },0)
              };
            }
          }).catch(function(){});

        return Promise.all([filmP, serP]);
      });

      return Promise.all(promises).then(function() {
        cache.lastDelta = now;
        cache.users = users;
        saveCache(cache);
        return { cache: cache, users: users };
      });
    });
  }

  var medals = ['🥇','🥈','🥉'];

  function buildAvatar(user, color) {
    var wrap = document.createElement('div');
    wrap.className = 'jfr-av';
    wrap.style.background = color;
    wrap.textContent = ini(user.Name);
    var img = document.createElement('img');
    img.src = srv()+'/Users/'+user.Id+'/Images/Primary?maxHeight=72&quality=85&_='+Date.now();
    img.onerror = function(){ img.remove(); };
    img.onload  = function(){ wrap.textContent=''; wrap.appendChild(img); };
    wrap.appendChild(img);
    return wrap;
  }

  function renderCol(colId, entries, label) {
    var col = document.getElementById(colId);
    if (!col) return;
    col.innerHTML = '';
    if (!entries || !entries.length) {
      col.innerHTML = '<div class="jfr-empty">No data yet</div>'; return;
    }
    var maxH = entries[0].hours || 1;
    entries.forEach(function(e, i) {
      var row = document.createElement('div');
      row.className = 'jfr-row';

      var rank = document.createElement('div');
      rank.className = i < 3 ? 'jfr-rank' : 'jfr-rank n';
      rank.textContent = i < 3 ? medals[i] : String(i+1);
      row.appendChild(rank);

      row.appendChild(buildAvatar(e.user, e.color));

      var info = document.createElement('div');
      info.className = 'jfr-info';
      var pct = Math.round(e.hours / maxH * 100);
      info.innerHTML =
        '<div class="jfr-name">'+(e.user.Name||'?')+'</div>'+
        '<div class="jfr-sub">'+e.count.toLocaleString()+' '+label+'</div>'+
        '<div class="jfr-bar"><div class="jfr-bar-fill" style="width:'+pct+'%;background:'+e.color+'"></div></div>';
      row.appendChild(info);

      var time = document.createElement('div');
      time.className = 'jfr-time';
      time.textContent = Math.round(e.hours)+'h';
      row.appendChild(time);

      col.appendChild(row);
      if (i === 2 && entries.length > 3) {
        var div = document.createElement('div'); div.className='jfr-divider'; col.appendChild(div);
      }
    });
  }

  function renderFromCache(cache) {
    if (!cache || !cache.users) return;
    var filmEntries = [], seriesEntries = [];
    cache.users.forEach(function(user, idx) {
      var color = COLORS[idx % COLORS.length];
      var fd = cache.filmData[user.Id]   || { count:0, hours:0 };
      var sd = cache.seriesData[user.Id] || { count:0, hours:0 };
      filmEntries.push({ user:user, color:color, count:fd.count, hours:fd.hours });
      seriesEntries.push({ user:user, color:color, count:sd.count, hours:sd.hours });
    });
    filmEntries.sort(function(a,b){ return b.hours-a.hours; });
    seriesEntries.sort(function(a,b){ return b.hours-a.hours; });
    renderCol('jfrank-films',  filmEntries,   'movies');
    renderCol('jfrank-series', seriesEntries, 'episodes');
  }

  function setStatus(txt) {
    var el = document.getElementById('jfrank-status');
    if (el) el.textContent = txt;
  }

  function buildOverlay() {
    if (document.getElementById('jfrank-ov')) return;
    var ov = document.createElement('div');
    ov.id = 'jfrank-ov';
    ov.innerHTML =
      '<div id="jfrank-head">'
        +'<div id="jfrank-title">'
          +'<svg viewBox="0 0 24 24" fill="currentColor">'
          +'<path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94'
          +'.63 1.5 1.98 2.63 3.61 2.96V17H7v2h10v-2h-4v-1.1c1.63-.33 2.98-1.46 3.61-2.96'
          +'C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8z'
          +'m14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>'
          +'Watchtime Ranking'
          +'<span id="jfrank-status"></span>'
        +'</div>'
        +'<button id="jfrank-close">✕</button>'
      +'</div>'
      +'<div id="jfrank-body">'
        +'<div class="jfr-col">'
          +'<div class="jfr-col-head">'
            +'<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>'
            +'<span class="jfr-col-label">Movies</span>'
            +'<span class="jfr-period">6-month period</span>'
          +'</div>'
          +'<div id="jfrank-films"><div class="jfr-spin">Loading…</div></div>'
        +'</div>'
        +'<div class="jfr-col">'
          +'<div class="jfr-col-head">'
            +'<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>'
            +'<span class="jfr-col-label">Series</span>'
            +'<span class="jfr-period">3-month period</span>'
          +'</div>'
          +'<div id="jfrank-series"><div class="jfr-spin">Loading…</div></div>'
        +'</div>'
      +'</div>';
    document.body.appendChild(ov);

    document.getElementById('jfrank-close').addEventListener('click', closeRanking);
    ov.addEventListener('click', function(e){ if(e.target===ov) closeRanking(); });
    document.addEventListener('keydown', escH);
  }

  var escH = function(e){ if(e.key==='Escape') closeRanking(); };

  function closeRanking() {
    var ov = document.getElementById('jfrank-ov');
    if (ov) ov.remove();
    document.removeEventListener('keydown', escH);
  }

  function openRanking() {
    buildOverlay();
    injectCSS();

    var cache = loadCache();

    if (cache && cache.users) {
      renderFromCache(cache);
      setStatus('· checking…');
    } else {
      setStatus('· loading…');
    }

    jfetch('/Users').then(function(liveUsers) {
      if (!Array.isArray(liveUsers)) liveUsers = [];

      if (usersChanged(cache && cache.users, liveUsers)) {
        console.log('[Ranking] User-Liste geändert → Full-Reload');
        cache = freshCache();
        saveCache(cache);
        setStatus('· new user detected, reloading…');
        return updateRanking(cache);
      }

      var needsDelta = !cache.lastDelta || (Date.now() - cache.lastDelta) > DELTA_WINDOW;
      if (!needsDelta) { setStatus('· up to date'); return null; }
      setStatus('· updating…');
      return updateRanking(cache);

    }).then(function(result) {
      if (!result) return;
      renderFromCache(result.cache);
      setStatus('· updated just now');
    }).catch(function() {
      setStatus('· error loading data');
    });
  }

  function patchTab() {
    var allBtns = document.querySelectorAll('[id^="customTabButton"], .emby-tab-button, [class*="tabButton"]');
    allBtns.forEach(function(btn) {
      if (btn.dataset.jfRankPatched) return;
      var labelEl = btn.querySelector('.emby-tab-button-text, .emby-button-foreground, span') || btn;
      var txt = (labelEl.textContent || btn.textContent || '').trim().toLowerCase();
      if (txt.indexOf('ranking') === -1) return;
      if (!btn.querySelector('.jf-tab-icon')) {
        btn.insertAdjacentHTML('afterbegin', TAB_ICON);
      }
      btn.dataset.jfRankPatched = '1';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (document.getElementById('jfrank-ov')) { closeRanking(); return; }
        openRanking();
      }, true);
      console.log('[Ranking] Tab patched ✓');
    });
  }

  setInterval(function() {
    if (typeof ApiClient === 'undefined') return;
    injectCSS();
    patchTab();
  }, 400);

  window.__openRankingOverlay = openRanking;

})();
