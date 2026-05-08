/* ════════════════════════════════════════════════════════════
   4) RATINGS – EPISODES TAB
   Fügt nach "Series" einen "Episodes"-Tab ein,
   der alle Episoden mit Rating anzeigt.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Hilfsfunktionen (analog zum Ratings-Modul) ── */
  function AC()  { return window.ApiClient; }
  function srv() { var a = AC(); return a ? (a._serverAddress || a._serverUrl || '').replace(/\/$/, '') : ''; }
  function tok() { var a = AC(); return a ? (a._token || (a.accessToken && a.accessToken()) || '') : ''; }
  function uid() { var a = AC(); return a ? (a._currentUserId || (a.getCurrentUserId && a.getCurrentUserId()) || '') : ''; }
  function ah()  { return { 'X-Emby-Token': tok(), 'X-MediaBrowser-Token': tok() }; }
  function rget(p) {
    return fetch(srv() + p, { headers: ah() })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function jget(p, q) {
    var qs = q ? '?' + Object.keys(q).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(q[k]);
    }).join('&') : '';
    return fetch(srv() + '/' + p + qs, { headers: ah() })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function sts(v) {
    var f = Math.round(v / 10 * 5);
    return '★'.repeat(Math.max(0, f)) + '☆'.repeat(Math.max(0, 5 - f));
  }
  function ini(n) {
    if (!n) return '?';
    var p = n.trim().split(/\s+/);
    return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : n.substring(0, 2).toUpperCase();
  }
  function avurl(id) {
    return srv() + '/Users/' + id + '/Images/Primary?maxHeight=64&quality=85&_=' + Math.floor(Date.now() / 3600000);
  }

  /* ── Cache ── */
  var TTL = 86400000;
  function ck(k)  { try { var r = localStorage.getItem('jfratEP_' + k); if (!r) return null; var o = JSON.parse(r); if (Date.now() - o.ts > TTL) { localStorage.removeItem('jfratEP_' + k); return null; } return o.d; } catch (e) { return null; } }
  function cset(k, d) { try { localStorage.setItem('jfratEP_' + k, JSON.stringify({ ts: Date.now(), d: d })); } catch (e) {} }
  function cdel(k)    { try { localStorage.removeItem('jfratEP_' + k); } catch (e) {} }

  var epCache = null; /* In-Memory für aktuelle Session */

  /* ── Episode-Ranking laden ── */
  function loadEpisodes() {
    var cached = ck('episodes');
    if (cached) { epCache = cached; return Promise.resolve(cached); }
    if (epCache) return Promise.resolve(epCache);

    return jget('Items', {
      Recursive: true,
      IncludeItemTypes: 'Episode',
      Fields: 'ImageTags,SeriesName,ParentIndexNumber,IndexNumber,SeriesId,SeriesPrimaryImageTag,ProductionYear',
      Limit: 3000,
      UserId: uid()
    }).then(function (data) {
      if (!data || !data.Items) return [];
      var items = data.Items;
      var stats = new Array(items.length).fill(null);
      var idx = 0;

      function next() {
        if (idx >= items.length) return Promise.resolve();
        var s = idx; idx += 30;
        return Promise.all(
          items.slice(s, s + 30).map(function (it, i) {
            return rget('/Ratings/Items/' + it.Id + '/Stats').then(function (st) { stats[s + i] = st; });
          })
        ).then(next);
      }

      return next().then(function () {
        var ranked = [];
        items.forEach(function (it, i) {
          var st = stats[i];
          if (!st || !st.TotalRatings || st.TotalRatings === 0) return;

          var sn = it.ParentIndexNumber != null ? it.ParentIndexNumber : null;
          var en = it.IndexNumber      != null ? it.IndexNumber      : null;
          var epLabel = (sn != null && en != null)
            ? 'S' + sn + ' E' + String(en).padStart(2, '0')
            : (en != null ? 'E' + String(en).padStart(2, '0') : '');

          ranked.push({
            id:           it.Id,
            name:         it.Name || '',
            seriesName:   it.SeriesName || '',
            seriesId:     it.SeriesId  || '',
            epLabel:      epLabel,
            year:         it.ProductionYear || '',
            avg:          parseFloat(st.AverageRating || 0),
            count:        st.TotalRatings || 0,
            imgTag:       it.ImageTags && it.ImageTags.Primary ? it.ImageTags.Primary : '',
            seriesImgTag: it.SeriesPrimaryImageTag || ''
          });
        });
        ranked.sort(function (a, b) { return b.avg - a.avg || b.count - a.count; });
        epCache = ranked;
        cset('episodes', ranked);
        return ranked;
      });
    });
  }

  /* ── Expand-Panel: User-Ratings ── */
  var userNameCache = {};
  function getUserName(rid) {
    if (userNameCache[rid]) return Promise.resolve(userNameCache[rid]);
    return jget('Users/' + rid).then(function (u) {
      var n = (u && (u.Name || u.name)) || 'User';
      userNameCache[rid] = n;
      return n;
    }).catch(function () { return 'User'; });
  }

  function renderExpandEp(panel, data) {
    var rows = data && (Array.isArray(data) ? data : (data.Ratings || data.ratings || []));
    if (!rows || !rows.length) {
      panel.innerHTML = '<div class="jreptit">User Ratings</div><div class="jrempty">No ratings found.</div>';
      return;
    }
    rows.sort(function (a, b) { return (b.Rating || b.rating || 0) - (a.Rating || a.rating || 0); });
    panel.innerHTML = '<div class="jreptit">User Ratings</div><div class="jrspin" style="padding:.4em 0">Loading…</div>';

    Promise.all(rows.map(function (r) {
      var rid   = r.UserId || r.userId || '';
      var given = r.UserName || r.userName || r.Name || r.name || '';
      return (given ? Promise.resolve(given) : getUserName(rid)).then(function (name) {
        return { name: name, rid: rid, rating: parseFloat(r.Rating || r.rating || 0) };
      });
    })).then(function (res) {
      var html = '<div class="jreptit">User Ratings</div>';
      res.forEach(function (u) {
        var av = u.rid
          ? '<div class="jrav"><img src="' + avurl(u.rid) + '" alt="" onerror="this.parentElement.textContent=\'' + ini(u.name).replace(/'/g, "\\'") + '\'"></div>'
          : '<div class="jrav">' + ini(u.name) + '</div>';
        html += '<div class="jrur">' + av
          + '<span class="jrun">' + esc(u.name) + '</span>'
          + '<span class="jrus">' + sts(u.rating) + '</span>'
          + '<span class="jruv">' + u.rating.toFixed(1) + '/10</span>'
          + '</div>';
      });
      panel.innerHTML = html;
    });
  }

  /* ── Navigation ── */
  function navToEp(id) {
    var a = AC(), sid = a && ((a._serverInfo && a._serverInfo.Id) || (a.serverId && a.serverId()));
    var o = document.getElementById('jro');
    if (o) o.remove();
    setTimeout(function () {
      if (window.appRouter && appRouter.showItem) { appRouter.showItem({ Id: id, ServerId: sid }); return; }
      window.location.hash = '#!/details?id=' + id + (sid ? '&serverId=' + sid : '');
    }, 200);
  }

  /* ── Episodenliste rendern ── */
  function renderEpisodeList(b, items) {
    b.innerHTML = '';
    var sec = document.createElement('div');
    sec.className = 'jrs';
    sec.innerHTML = '<h2>Ranked Episodes</h2>'
      + '<div class="jrsub">' + items.length + ' rated episode' + (items.length !== 1 ? 's' : '') + '</div>';

    if (!items.length) {
      sec.innerHTML += '<div class="jrempty">No rated episodes yet.</div>';
      b.appendChild(sec);
      return;
    }

    var list = document.createElement('div');
    list.className = 'jrl';

    items.forEach(function (item, i) {
      var rank  = i + 1;
      var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

      /* Bild: Episode-Thumbnail bevorzugt, sonst Serien-Poster */
      var img = '';
      if (item.imgTag) {
        img = srv() + '/Items/' + item.id + '/Images/Primary?tag=' + item.imgTag + '&maxHeight=110&quality=85';
      } else if (item.seriesId && item.seriesImgTag) {
        img = srv() + '/Items/' + item.seriesId + '/Images/Primary?tag=' + item.seriesImgTag + '&maxHeight=110&quality=85';
      }

      if (rank === 4 && items.length > 3) {
        var dv = document.createElement('div');
        dv.className = 'jrdiv';
        list.appendChild(dv);
      }

      var wrap = document.createElement('div');
      wrap.className = 'jriw';
      /* Suchbarer Name = Serienname + Episodenname */
      wrap.dataset.name = (item.seriesName + ' ' + item.name).toLowerCase();

      var row = document.createElement('div');
      row.className = 'jrrow' + (rank <= 3 ? ' hi' : '');
      row.innerHTML =
        '<div class="jrrank' + (medal ? '' : ' pl') + '">' + (medal || rank) + '</div>'
        + (img
          ? '<img class="jrposter" src="' + img + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
          : '<div class="jrposter" style="display:flex;align-items:center;justify-content:center;font-size:12px;color:rgba(255,255,255,.1)">▪</div>')
        + '<div class="jrinfo">'
          + '<div class="jrname">' + esc(item.seriesName || item.name) + '</div>'
          + '<div class="jrmeta">'
            + (item.epLabel ? esc(item.epLabel) + ' · ' : '')
            + esc(item.name)
            + (item.year ? ' · ' + item.year : '')
          + '</div>'
        + '</div>'
        + '<div class="jrsc2">'
          + '<div class="jravg">' + item.avg.toFixed(1) + '<small>/10</small></div>'
          + '<div class="jrstars">' + sts(item.avg) + '</div>'
          + '<div class="jrrc">' + item.count + ' rating' + (item.count !== 1 ? 's' : '') + '</div>'
        + '</div>'
        + '<button class="jrexp">▾</button>';

      /* Expand-Panel für User-Ratings */
      var panel = document.createElement('div');
      panel.className = 'jrep';
      panel.style.display = 'none';
      panel.innerHTML = '<div class="jrspin" style="padding:.7em 0">Loading…</div>';

      var eb = row.querySelector('.jrexp');
      eb.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = panel.style.display !== 'none';
        panel.style.display = open ? 'none' : 'block';
        eb.textContent = open ? '▾' : '▴';
        eb.classList.toggle('open', !open);
        if (!open && !panel.dataset.loaded) {
          panel.dataset.loaded = '1';
          rget('/Ratings/Items/' + item.id + '/DetailedRatings').then(function (d) {
            renderExpandEp(panel, d);
          });
        }
      });

      row.addEventListener('click', function (e) {
        if (eb.contains(e.target)) return;
        navToEp(item.id);
      });

      wrap.appendChild(row);
      wrap.appendChild(panel);
      list.appendChild(wrap);
    });

    sec.appendChild(list);
    b.appendChild(sec);
  }

  /* ── Tab rendern ── */
  function renderEpisodesTab() {
    var b = document.getElementById('jrb');
    if (!b) return;
    if (epCache) {
      renderEpisodeList(b, epCache);
    } else {
      b.innerHTML = '<div class="jrspin">Loading episodes…</div>';
      loadEpisodes().then(function (items) { renderEpisodeList(b, items); });
    }
  }

  /* ── Filter (analog zu filterRanking) ── */
  function filterEpisodes(q) {
    var b = document.getElementById('jrb');
    if (!b) return;
    b.querySelectorAll('.jriw').forEach(function (w) {
      w.style.display = (!q || (w.dataset.name || '').includes(q)) ? '' : 'none';
    });
  }

  /* ── Tab in bestehendes Overlay injizieren ── */
  function patchOverlay(ov) {
    if (ov.dataset.epPatched) return;
    ov.dataset.epPatched = '1';

    /* "Series"-Button finden */
    var seriesBtn = null;
    ov.querySelectorAll('.jrb[data-tab]').forEach(function (btn) {
      if (btn.dataset.tab === 'series') seriesBtn = btn;
    });
    if (!seriesBtn) return;

    /* Neuen Tab-Button erstellen */
    var epBtn = document.createElement('button');
    epBtn.className = 'jrb';
    epBtn.dataset.tab = 'episodes';
    epBtn.textContent = 'Episodes';
    seriesBtn.parentNode.insertBefore(epBtn, seriesBtn.nextSibling);

    /* Such-Feld-Referenz */
    var si = document.getElementById('jrsi');
    var sc = document.getElementById('jrsc');
    var sw = document.getElementById('jrsw');

    /* ── Klick-Handler für neuen Tab ── */
    epBtn.addEventListener('click', function () {
      /* Alle anderen Tabs deaktivieren */
      ov.querySelectorAll('.jrb[data-tab]').forEach(function (b) { b.classList.remove('on'); });
      epBtn.classList.add('on');

      /* Such-Feld zurücksetzen + einblenden */
      if (si) si.value = '';
      if (sc) sc.classList.remove('show');
      if (sw) sw.style.display = '';

      renderEpisodesTab();
    });

    /* ── Such-Input: auch für Episodes-Tab abfangen ── */
    if (si) {
      si.addEventListener('input', function () {
        var activeTab = ov.querySelector('.jrb.on[data-tab]');
        if (!activeTab || activeTab.dataset.tab !== 'episodes') return;
        var q = si.value.trim().toLowerCase();
        if (sc) sc.classList.toggle('show', q.length > 0);
        filterEpisodes(q);
      });
    }

    /* Clear-Button: auch für Episodes-Tab */
    if (sc) {
      sc.addEventListener('click', function () {
        var activeTab = ov.querySelector('.jrb.on[data-tab]');
        if (!activeTab || activeTab.dataset.tab !== 'episodes') return;
        renderEpisodesTab(); /* Liste neu aufbauen statt filtern */
      });
    }

    /* ── Cache nach Rating-Änderungen invalidieren ── */
    ov.addEventListener('click', function (e) {
      var btn = e.target;
      if (btn && (btn.classList.contains('jrpsv') || btn.classList.contains('jrpdl'))) {
        setTimeout(function () {
          epCache = null;
          cdel('episodes');
        }, 1500);
      }
    });
  }

  /* ── MutationObserver: auf Overlay warten ── */
  var ovObs = new MutationObserver(function () {
    var ov = document.getElementById('jro');
    if (ov) patchOverlay(ov);
  });
  ovObs.observe(document.body, { childList: true, subtree: true });

  /* Falls Overlay bereits offen ist */
  var existing = document.getElementById('jro');
  if (existing) patchOverlay(existing);

})();
