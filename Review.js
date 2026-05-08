(function () {
  'use strict';

  function ac()  { return window.ApiClient; }
  function srv() { var a=ac(); return a?(a._serverAddress||a._serverUrl||'').replace(/\/$/,''):''; }
  function tok() { var a=ac(); return a?(a._token||(a.accessToken&&a.accessToken())||''):''; }
  function uid() { var a=ac(); return a?(a._currentUserId||(a.getCurrentUserId&&a.getCurrentUserId())||''):''; }
  function ah()  { return {'X-Emby-Token':tok(),'X-MediaBrowser-Token':tok()}; }
  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function sts(v){ var f=Math.round(v/10*5); return '★'.repeat(Math.max(0,f))+'☆'.repeat(Math.max(0,5-f)); }

  function rget(p){
    return fetch(srv()+p,{headers:ah()})
      .then(function(r){ return r.ok?r.json():null; })
      .catch(function(){ return null; });
  }
  function jget(p,q){
    var qs=q?'?'+Object.keys(q).map(function(k){
      return encodeURIComponent(k)+'='+encodeURIComponent(q[k]);
    }).join('&'):'';
    return fetch(srv()+'/'+p+qs,{headers:ah()})
      .then(function(r){ return r.ok?r.json():null; })
      .catch(function(){ return null; });
  }

  /* Extract review text from any known field */
  function getReviewText(r) {
    return r.Review || r.review || r.ReviewText || r.reviewText ||
           r.Text || r.text || r.Comment || r.comment ||
           r.Body || r.body || r.Content || r.content || '';
  }

  /* Try to get reviews for one item — tries DetailedRatings which includes review text */
  function fetchItemReviews(itemId) {
    return rget('/Ratings/Items/' + itemId + '/DetailedRatings').then(function(data) {
      if (!data) return [];
      var rows = Array.isArray(data) ? data : (data.Ratings || data.ratings || data.Items || []);
      var reviews = [];
      rows.forEach(function(r) {
        var text = getReviewText(r);
        if (text && text.trim()) {
          reviews.push({
            userName: r.UserName || r.userName || r.Name || r.name || 'User',
            userId:   r.UserId   || r.userId   || '',
            rating:   parseFloat(r.Rating || r.rating || 0),
            text:     text.trim(),
            date:     r.Date || r.date || r.CreatedAt || r.UpdatedAt || r.DateCreated || ''
          });
        }
      });
      /* If nothing found in DetailedRatings, try /Reviews endpoint as fallback */
      if (!reviews.length) {
        return rget('/Ratings/Items/' + itemId + '/Reviews').then(function(rdata) {
          if (!rdata) return [];
          var rrows = Array.isArray(rdata) ? rdata : (rdata.Reviews || rdata.reviews || rdata.Items || []);
          var out = [];
          rrows.forEach(function(r) {
            var text = getReviewText(r);
            if (text && text.trim()) {
              out.push({
                userName: r.UserName || r.userName || r.Name || r.name || 'User',
                userId:   r.UserId   || r.userId   || '',
                rating:   parseFloat(r.Rating || r.rating || 0),
                text:     text.trim(),
                date:     r.Date || r.date || r.CreatedAt || r.UpdatedAt || r.DateCreated || ''
              });
            }
          });
          return out;
        }).catch(function(){ return []; });
      }
      return reviews;
    });
  }

  /* ── CSS ── */
  function injectCSS() {
    if (document.getElementById('jf-rev-css')) return;
    var s = document.createElement('style');
    s.id = 'jf-rev-css';
    s.textContent = `
      #jf-rev-overlay {
        position:fixed;inset:0;z-index:999999;
        background:rgba(0,0,0,.6);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
        display:flex;flex-direction:column;overflow:hidden;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }
      #jf-rev-head {
        display:flex;align-items:center;gap:10px;padding:14px 20px;
        border-bottom:1px solid rgba(255,255,255,.12);
        flex-shrink:0;background:rgba(0,0,0,.25);
      }
      #jf-rev-title { flex:1;font-size:1.1em;font-weight:300;color:rgba(255,255,255,.95); }
      #jf-rev-count { font-size:.65em;color:rgba(255,255,255,.3);letter-spacing:.08em;text-transform:uppercase;margin-left:10px; }
      #jf-rev-close {
        background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);
        color:rgba(255,255,255,.8);border-radius:50%;width:30px;height:30px;
        cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.9em;
      }
      #jf-rev-close:hover { background:rgba(255,255,255,.18);color:#fff; }
      #jf-rev-body {
        flex:1;overflow-y:auto;padding:0 20px 40px;
        scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent;
      }
      #jf-rev-body::-webkit-scrollbar{width:4px;}
      #jf-rev-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:2px;}
      .jf-rev-card {
        display:flex;gap:12px;padding:14px 8px;
        border-bottom:1px solid rgba(255,255,255,.07);
        cursor:pointer;border-radius:6px;transition:background .15s;
      }
      .jf-rev-card:hover { background:rgba(255,255,255,.04); }
      .jf-rev-poster {
        width:36px;height:54px;border-radius:4px;object-fit:cover;
        background:rgba(255,255,255,.08);flex-shrink:0;
        border:1px solid rgba(255,255,255,.06);
      }
      .jf-rev-info { flex:1;min-width:0; }
      .jf-rev-itemname {
        font-size:.82em;font-weight:500;color:#fff;margin-bottom:2px;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      }
      .jf-rev-meta { font-size:.67em;color:rgba(255,255,255,.38);margin-bottom:6px; }
      .jf-rev-text { font-size:.78em;color:rgba(255,255,255,.72);white-space:pre-wrap;word-break:break-word;line-height:1.5; }
      .jf-rev-right { text-align:right;flex-shrink:0; }
      .jf-rev-avg { font-size:1.05em;font-weight:500;color:#fff; }
      .jf-rev-avg small { font-size:.5em;color:rgba(255,255,255,.28); }
      .jf-rev-stars { font-size:.56em;color:rgba(255,255,255,.5);letter-spacing:1px;margin-top:2px; }
      .jf-rev-spin { padding:3em;text-align:center;color:rgba(255,255,255,.35);font-size:.85em; }
      .jf-rev-empty { padding:3em;text-align:center;color:rgba(255,255,255,.22);font-size:.82em;font-style:italic; }
      .jf-rev-section-title {
        font-size:.63em;color:rgba(255,255,255,.28);letter-spacing:.1em;text-transform:uppercase;
        padding:18px 0 6px;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:4px;
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Open overlay ── */
  function openReviews() {
    injectCSS();
    var old = document.getElementById('jf-rev-overlay');
    if (old) { old.remove(); return; }

    var ov = document.createElement('div'); ov.id = 'jf-rev-overlay';

    /* Header */
    var head = document.createElement('div'); head.id = 'jf-rev-head';
    var ttl  = document.createElement('div'); ttl.id  = 'jf-rev-title'; ttl.textContent = '✍ Reviews';
    var cnt  = document.createElement('span'); cnt.id = 'jf-rev-count'; cnt.textContent = 'Loading…';
    ttl.appendChild(cnt);
    var cls  = document.createElement('button'); cls.id = 'jf-rev-close'; cls.textContent = '✕';

    function closeOv() { ov.remove(); document.removeEventListener('keydown', escH); }
    cls.onclick = closeOv;
    head.appendChild(ttl); head.appendChild(cls);
    ov.appendChild(head);

    var body = document.createElement('div'); body.id = 'jf-rev-body';
    body.innerHTML = '<div class="jf-rev-spin">Loading items…</div>';
    ov.appendChild(body);
    document.body.appendChild(ov);

    function escH(e) { if (e.key === 'Escape') closeOv(); }
    document.addEventListener('keydown', escH);
    ov.addEventListener('click', function(e) { if (e.target === ov) closeOv(); });

    /* Load */
    jget('Items', {
      Recursive: true,
      IncludeItemTypes: 'Movie,Series',
      Fields: 'ImageTags,ProductionYear',
      Limit: 1000,
      UserId: uid()
    }).then(function(data) {
      var items = (data && data.Items) || [];
      if (!items.length) {
        body.innerHTML = '<div class="jf-rev-empty">Keine Einträge gefunden.</div>';
        cnt.textContent = '';
        return;
      }

      cnt.textContent = '0 / ' + items.length + ' checked';
      var allReviews = [];
      var done = 0;

      items.forEach(function(item) {
        fetchItemReviews(item.Id).then(function(revs) {
          revs.forEach(function(r) {
            allReviews.push({
              itemId:   item.Id,
              itemName: item.Name || '',
              imgTag:   item.ImageTags && item.ImageTags.Primary,
              year:     item.ProductionYear || '',
              userName: r.userName,
              userId:   r.userId,
              rating:   r.rating,
              text:     r.text,
              date:     r.date
            });
          });
          done++;
          cnt.textContent = done + ' / ' + items.length + ' checked';
          if (done === items.length) renderReviews(body, allReviews, cnt);
        });
      });
    }).catch(function() {
      body.innerHTML = '<div class="jf-rev-empty">Fehler beim Laden.</div>';
    });
  }

  function renderReviews(body, reviews, cnt) {
    var a = ac();
    var sid = a && ((a._serverInfo && a._serverInfo.Id) || (a.serverId && a.serverId()));

    cnt.textContent = reviews.length + ' review' + (reviews.length !== 1 ? 's' : '');
    body.innerHTML = '';

    if (!reviews.length) {
      body.innerHTML = '<div class="jf-rev-empty">Keine Reviews geschrieben.</div>';
      return;
    }

    reviews.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });

    var lastMonth = '';
    reviews.forEach(function(rv) {
      /* Month separator */
      if (rv.date) {
        try {
          var mo = new Date(rv.date).toLocaleString('de', {month:'long', year:'numeric'});
          if (mo && mo !== lastMonth) {
            lastMonth = mo;
            var mh = document.createElement('div');
            mh.className = 'jf-rev-section-title';
            mh.textContent = mo;
            body.appendChild(mh);
          }
        } catch(e) {}
      }

      var card = document.createElement('div'); card.className = 'jf-rev-card';
      card.addEventListener('click', function() {
        document.getElementById('jf-rev-overlay').remove();
        setTimeout(function() {
          if (window.appRouter && appRouter.showItem) { appRouter.showItem({Id:rv.itemId,ServerId:sid}); return; }
          window.location.hash = '#!/details?id=' + rv.itemId + (sid ? '&serverId=' + sid : '');
        }, 150);
      });

      /* Poster */
      if (rv.imgTag) {
        var img = document.createElement('img');
        img.className = 'jf-rev-poster'; img.alt = ''; img.loading = 'lazy';
        img.src = srv() + '/Items/' + rv.itemId + '/Images/Primary?tag=' + rv.imgTag + '&maxHeight=110&quality=85';
        img.onerror = function() { this.style.display='none'; };
        card.appendChild(img);
      }

      /* Info */
      var info = document.createElement('div'); info.className = 'jf-rev-info';
      info.innerHTML =
        '<div class="jf-rev-itemname">' + esc(rv.itemName) + '</div>'
        + '<div class="jf-rev-meta">' + esc(rv.userName) + (rv.year ? ' · ' + rv.year : '') + '</div>'
        + '<div class="jf-rev-text">' + esc(rv.text) + '</div>';
      card.appendChild(info);

      /* Score */
      if (rv.rating) {
        var right = document.createElement('div'); right.className = 'jf-rev-right';
        right.innerHTML =
          '<div class="jf-rev-avg">' + rv.rating.toFixed(1) + '<small>/10</small></div>'
          + '<div class="jf-rev-stars">' + sts(rv.rating) + '</div>';
        card.appendChild(right);
      }

      body.appendChild(card);
    });
  }

  /* ── Inject Reviews button into Ratings overlay ── */
  function injectButton() {
    var h2 = document.getElementById('jrh2');
    if (!h2 || h2.querySelector('[data-tab="jf-reviews"]')) return;
    var btn = document.createElement('button');
    btn.className = 'jrb';
    btn.dataset.tab = 'jf-reviews';
    btn.textContent = 'Reviews';
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      h2.querySelectorAll('.jrb').forEach(function(b){ b.classList.remove('on'); });
      btn.classList.add('on');
      openReviews();
    });
    h2.appendChild(btn);
  }

  setInterval(injectButton, 600);
  new MutationObserver(injectButton).observe(document.body, {childList:true, subtree:true});

})();
