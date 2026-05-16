/* ══════════════════════════════════════════════════════════
   Media Bar – Random + Minimum Rating + Year Range
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MIN_YEAR = 1980;

  var SK_RATING    = 'jf_mbrf_minRating';
  var SK_COUNT     = 'jf_mbrf_count';
  var SK_TYPE      = 'jf_mbrf_type';
  var SK_INTERVAL  = 'jf_mbrf_interval';
  var SK_YEAR_FROM = 'jf_mbrf_yearFrom';
  var SK_YEAR_TO   = 'jf_mbrf_yearTo';

  function getUserId(){ var ac=window.ApiClient; return ac&&(ac._currentUserId||(ac.getCurrentUserId&&ac.getCurrentUserId()))||'default'; }
  function userKey(k){ return k+'_'+getUserId(); }
  function load(k,def){ try{ var v=localStorage.getItem(userKey(k)); return v!==null?JSON.parse(v):def; }catch(e){ return def; } }
  function save(k,v){ try{ localStorage.setItem(userKey(k),JSON.stringify(v)); }catch(e){} }

  var cfg = { minRating:0, count:20, mediaType:'All', interval:8, yearFrom:MIN_YEAR, yearTo:new Date().getFullYear() };
  function loadCfg(){
    var curYear = new Date().getFullYear();
    cfg.minRating = load(SK_RATING,    0);
    cfg.count     = load(SK_COUNT,     20);
    cfg.mediaType = load(SK_TYPE,      'All');
    cfg.interval  = load(SK_INTERVAL,  8);
    cfg.yearFrom  = load(SK_YEAR_FROM, MIN_YEAR);
    cfg.yearTo    = load(SK_YEAR_TO,   curYear);
    if(cfg.yearTo > curYear) cfg.yearTo = curYear;
  }

  function yearLabel(v){ return v >= new Date().getFullYear() ? 'This Year' : v; }

  /* ── CSS ─────────────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = `
    .jfmb-prev,.jfmb-next,
    [class*="jfmb-prev"],[class*="jfmb-next"],
    #jf-media-bar button:not(#mbrf-prev):not(#mbrf-next),
    .jfmb-dots,[class*="jfmb-dot"],.jfmb-pagination,
    #jf-media-bar ul,#jf-media-bar ol,
    #jf-media-bar li { display:none !important; }

    #mbrf-gear-wrap {
      position:absolute;bottom:16px;right:16px;z-index:100;
      display:flex;align-items:center;
    }
    #mbrf-gear {
      display:inline-flex;align-items:center;justify-content:center;
      width:32px;height:32px;
      background:rgba(0,0,0,0.3);
      border:1px solid rgba(255,255,255,0.15);
      border-radius:50%;cursor:pointer;
      transition:background 0.2s,transform 0.3s;
      position:relative;
    }
    #mbrf-gear:hover { background:rgba(255,255,255,0.15); transform:rotate(45deg); }
    #mbrf-gear svg { width:14px;height:14px;fill:rgba(255,255,255,0.6); }
    #mbrf-gear-badge { display:none !important; }

    #mbrf-prev,#mbrf-next {
      opacity:0 !important;
      transition:opacity 0.25s ease !important;
      pointer-events:none;
    }
    #jf-media-bar.mbrf-active #mbrf-prev,
    #jf-media-bar.mbrf-active #mbrf-next {
      opacity:1 !important;
      pointer-events:auto;
    }

    #mbrf-pill {
      display:none;position:fixed;
      background:rgba(22,23,34,0.97);
      border:1px solid rgba(255,255,255,0.16);
      border-radius:14px;padding:16px 18px;
      flex-direction:column;gap:12px;
      z-index:9999999;
      box-shadow:0 8px 28px rgba(0,0,0,0.65);
      min-width:300px;box-sizing:border-box;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;
    }
    #mbrf-pill.open { display:flex; }

    .mbrf-title { font-size:12px;font-weight:700;color:rgba(255,255,255,0.85);letter-spacing:0.05em;text-transform:uppercase; }
    .mbrf-lbl { font-size:11px;color:rgba(255,255,255,0.5);display:flex;justify-content:space-between; }
    .mbrf-lbl b { color:#7c6af7;font-weight:700; }

    .mbrf-slider {
      -webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:3px;outline:none;cursor:pointer;
      background:linear-gradient(to right,#7c6af7 0%,#7c6af7 var(--p,0%),rgba(255,255,255,0.15) var(--p,0%));
    }
    .mbrf-slider::-webkit-slider-thumb {
      -webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#7c6af7;border:2px solid #fff;
    }

    .mbrf-chips { display:flex;gap:5px;flex-wrap:wrap; }
    .mbrf-chip {
      padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;
      border:1px solid rgba(255,255,255,0.2);background:transparent;
      color:rgba(255,255,255,0.55);cursor:pointer;transition:all 0.15s;
    }
    .mbrf-chip.on { background:#7c6af7;border-color:#7c6af7;color:#fff; }

    #mbrf-stars { display:flex;gap:2px;justify-content:center; }
    #mbrf-stars span { font-size:14px; }

    #mbrf-save {
      background:#7c6af7;border:none;border-radius:8px;color:#fff;
      font-weight:700;font-size:12px;padding:8px;cursor:pointer;width:100%;transition:opacity 0.2s;
    }
    #mbrf-save:hover { opacity:0.85; }

    /* ── Dual-handle year slider ─────────────────────────────────────────── */
    #mbrf-year-area {
      position:relative;height:40px;display:flex;align-items:center;
      user-select:none;margin-top:2px;
    }
    #mbrf-year-track {
      position:absolute;left:0;right:0;height:3px;
      background:rgba(255,255,255,0.12);border-radius:2px;
    }
    #mbrf-year-fill {
      position:absolute;height:3px;background:#7c6af7;border-radius:2px;
    }
    .mbrf-yhandle {
      position:absolute;width:16px;height:16px;border-radius:50%;
      background:#7c6af7;border:2.5px solid #fff;
      transform:translate(-50%,-50%);top:50%;
      cursor:grab;z-index:2;transition:box-shadow 0.1s;
    }
    .mbrf-yhandle:hover,.mbrf-yhandle.dragging {
      box-shadow:0 0 0 5px rgba(124,106,247,0.35);cursor:grabbing;
    }
    .mbrf-yhandle .mbrf-ytt {
      position:absolute;bottom:22px;left:50%;transform:translateX(-50%);
      background:#7c6af7;color:#fff;font-size:10px;font-weight:700;
      padding:2px 7px;border-radius:4px;white-space:nowrap;
      pointer-events:none;opacity:0;transition:opacity 0.15s;
    }
    .mbrf-yhandle:hover .mbrf-ytt,
    .mbrf-yhandle.dragging .mbrf-ytt { opacity:1; }
    #mbrf-year-ticks {
      display:flex;justify-content:space-between;
      font-size:10px;color:rgba(255,255,255,0.25);margin-top:4px;
    }

    /* ── Auto-close countdown bar ────────────────────────────────────────── */
    #mbrf-countdown-bar {
      width:100%;height:2px;border-radius:1px;
      background:rgba(255,255,255,0.1);overflow:hidden;
    }
    #mbrf-countdown-bar-inner {
      height:100%;border-radius:1px;background:#7c6af7;
      width:100%;transition:width 1s linear;
    }
  `;
  document.head.appendChild(style);

  /* ── Gear ────────────────────────────────────────────────────────────────── */
  var gearWrap = document.createElement('div'); gearWrap.id = 'mbrf-gear-wrap';
  var gear = document.createElement('div');     gear.id = 'mbrf-gear';
  gear.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7 7 0 00-1.62-.94l-.36-2.54A.484.484 0 0014 4h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 00-.59.22L2.74 8.87a.49.49 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 00-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
  <div id="mbrf-gear-badge"></div>`;
  gearWrap.appendChild(gear);

  /* ── Pill ────────────────────────────────────────────────────────────────── */
  var pill = document.createElement('div'); pill.id = 'mbrf-pill';
  pill.innerHTML = `
    <div class="mbrf-title">⚙ Media Bar</div>
    <div>
      <div class="mbrf-lbl">Minimum Rating <b id="mbrf-rv">${cfg.minRating===0?'–':cfg.minRating}</b></div>
      <input id="mbrf-rs" class="mbrf-slider" type="range" min="0" max="10" step="0.5" value="${cfg.minRating}">
    </div>
    <div id="mbrf-stars"></div>
    <div>
      <div class="mbrf-lbl" style="margin-bottom:6px">Number of Items <b id="mbrf-cv">${cfg.count}</b></div>
      <input id="mbrf-cs" class="mbrf-slider" type="range" min="5" max="50" step="1" value="${cfg.count}">
    </div>
    <div>
      <div class="mbrf-lbl" style="margin-bottom:6px">Slide Interval <b id="mbrf-iv">${cfg.interval}s</b></div>
      <input id="mbrf-is" class="mbrf-slider" type="range" min="3" max="60" step="1" value="${cfg.interval}">
    </div>
    <div>
      <div class="mbrf-lbl" style="margin-bottom:6px">
        Release Year
        <span><b id="mbrf-yfv">${cfg.yearFrom}</b> &nbsp;–&nbsp; <b id="mbrf-ytv">${yearLabel(cfg.yearTo)}</b></span>
      </div>
      <div id="mbrf-year-area">
        <div id="mbrf-year-track"></div>
        <div id="mbrf-year-fill"></div>
        <div class="mbrf-yhandle" id="mbrf-hL"><div class="mbrf-ytt" id="mbrf-ttL">${cfg.yearFrom}</div></div>
        <div class="mbrf-yhandle" id="mbrf-hR"><div class="mbrf-ytt" id="mbrf-ttR">${yearLabel(cfg.yearTo)}</div></div>
      </div>
      <div id="mbrf-year-ticks"></div>
    </div>
    <div>
      <div class="mbrf-lbl" style="margin-bottom:6px">Media Type</div>
      <div class="mbrf-chips">
        <button class="mbrf-chip${cfg.mediaType==='All'?' on':''}"    data-v="All">🎭 All</button>
        <button class="mbrf-chip${cfg.mediaType==='Movie'?' on':''}"  data-v="Movie">🎬 Movies</button>
        <button class="mbrf-chip${cfg.mediaType==='Series'?' on':''}" data-v="Series">📺 Series</button>
      </div>
    </div>
    <button id="mbrf-save">🔄 Load New Random Selection</button>
    <div id="mbrf-countdown-bar"><div id="mbrf-countdown-bar-inner"></div></div>
  `;
  document.body.appendChild(pill);

  /* ── Year tick labels ───────────────────────────────────────────────────── */
  (function(){
    var tickEl = document.getElementById('mbrf-year-ticks');
    var curYear = new Date().getFullYear();
    var ticks = [MIN_YEAR, 1990, 2000, 2010, 2020, curYear];
    ticks.forEach(function(y){
      var s = document.createElement('span');
      s.textContent = y === curYear ? 'This Year' : y;
      tickEl.appendChild(s);
    });
  })();

  /* ── Dual-handle year slider logic ──────────────────────────────────────── */
  var yearArea = document.getElementById('mbrf-year-area');
  var yearFill = document.getElementById('mbrf-year-fill');
  var hL       = document.getElementById('mbrf-hL');
  var hR       = document.getElementById('mbrf-hR');
  var ttL      = document.getElementById('mbrf-ttL');
  var ttR      = document.getElementById('mbrf-ttR');
  var yfv      = document.getElementById('mbrf-yfv');
  var ytv      = document.getElementById('mbrf-ytv');

  function yrPct(v){ var MAX=new Date().getFullYear(); return (v-MIN_YEAR)/(MAX-MIN_YEAR)*100; }
  function yrFromPct(p){ var MAX=new Date().getFullYear(); return Math.round(MIN_YEAR + p*(MAX-MIN_YEAR)); }

  function renderYears(){
    var pL = yrPct(cfg.yearFrom), pR = yrPct(cfg.yearTo);
    hL.style.left = pL + '%';
    hR.style.left = pR + '%';
    yearFill.style.left  = pL + '%';
    yearFill.style.width = (pR - pL) + '%';
    yfv.textContent  = cfg.yearFrom;
    ytv.textContent  = yearLabel(cfg.yearTo);
    ttL.textContent  = cfg.yearFrom;
    ttR.textContent  = yearLabel(cfg.yearTo);
    resetPillAutoClose();
  }

  function attachYearDrag(handle, isLeft){
    var rect;
    function onMove(e){
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      var v = yrFromPct(p);
      var MAX = new Date().getFullYear();
      if(isLeft)  cfg.yearFrom = Math.max(MIN_YEAR, Math.min(v, cfg.yearTo - 1));
      else        cfg.yearTo   = Math.min(MAX,       Math.max(v, cfg.yearFrom + 1));
      renderYears();
    }
    function onUp(){
      handle.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onUp);
    }
    handle.addEventListener('mousedown', function(e){
      e.preventDefault();
      rect = yearArea.getBoundingClientRect();
      handle.classList.add('dragging');
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onUp);
    });
    handle.addEventListener('touchstart', function(e){
      e.preventDefault();
      rect = yearArea.getBoundingClientRect();
      handle.classList.add('dragging');
      document.addEventListener('touchmove', onMove, {passive:false});
      document.addEventListener('touchend',  onUp);
    }, {passive:false});
  }

  attachYearDrag(hL, true);
  attachYearDrag(hR, false);
  renderYears();

  /* ── Other sliders ──────────────────────────────────────────────────────── */
  pill.querySelectorAll('.mbrf-chip').forEach(function(c){
    c.addEventListener('click', function(e){
      e.stopPropagation();
      pill.querySelectorAll('.mbrf-chip').forEach(function(x){ x.classList.remove('on'); });
      c.classList.add('on');
      resetPillAutoClose();
    });
  });

  function gradSet(el){ el.style.setProperty('--p', ((el.value-el.min)/(el.max-el.min)*100).toFixed(1)+'%'); }
  function renderStars(val){
    var s = document.getElementById('mbrf-stars'); if(!s) return; s.innerHTML = '';
    for(var i=1;i<=10;i++){ var sp=document.createElement('span'); sp.textContent=i<=val?'★':'☆'; sp.style.color=i<=val?'#7c6af7':'rgba(255,255,255,0.2)'; s.appendChild(sp); }
  }

  var rs  = document.getElementById('mbrf-rs');
  var cs  = document.getElementById('mbrf-cs');
  var is_ = document.getElementById('mbrf-is');

  gradSet(rs); gradSet(cs); gradSet(is_);
  renderStars(cfg.minRating);

  rs.addEventListener('input',  function(){ document.getElementById('mbrf-rv').textContent = this.value==0?'–':this.value; gradSet(this); renderStars(parseFloat(this.value)); resetPillAutoClose(); });
  cs.addEventListener('input',  function(){ document.getElementById('mbrf-cv').textContent = this.value; gradSet(this); resetPillAutoClose(); });
  is_.addEventListener('input', function(){ document.getElementById('mbrf-iv').textContent = this.value+'s'; gradSet(this); resetPillAutoClose(); });

  /* ── Auto-close ─────────────────────────────────────────────────────────── */
  var PILL_TIMEOUT = 10;
  var pillAutoCloseTimer = null;

  function closePill(){
    pillOpen = false;
    pill.classList.remove('open');
    clearPillAutoClose();
  }
  function clearPillAutoClose(){
    if(pillAutoCloseTimer){ clearTimeout(pillAutoCloseTimer); pillAutoCloseTimer = null; }
  }
  function startPillAutoClose(){
    clearPillAutoClose();
    var bar = document.getElementById('mbrf-countdown-bar-inner');
    if(bar){ bar.style.transition='none'; bar.style.width='100%'; }
    setTimeout(function(){ if(bar){ bar.style.transition='width 10s linear'; bar.style.width='0%'; } }, 30);
    pillAutoCloseTimer = setTimeout(function(){ closePill(); }, PILL_TIMEOUT * 1000);
  }
  function resetPillAutoClose(){
    if(pillOpen) startPillAutoClose();
  }

  pill.addEventListener('mouseenter', resetPillAutoClose);
  pill.addEventListener('mousemove',  resetPillAutoClose);
  pill.addEventListener('touchstart', resetPillAutoClose, {passive:true});

  /* ── Save button ────────────────────────────────────────────────────────── */
  document.getElementById('mbrf-save').addEventListener('click', function(){
    cfg.minRating = parseFloat(rs.value);
    cfg.count     = parseInt(cs.value);
    cfg.interval  = parseInt(is_.value);
    cfg.mediaType = (pill.querySelector('.mbrf-chip.on') || pill.querySelector('.mbrf-chip')).dataset.v;
    /* yearFrom/yearTo already live in cfg via drag handlers */
    save(SK_RATING,    cfg.minRating);
    save(SK_COUNT,     cfg.count);
    save(SK_TYPE,      cfg.mediaType);
    save(SK_INTERVAL,  cfg.interval);
    save(SK_YEAR_FROM, cfg.yearFrom);
    save(SK_YEAR_TO,   cfg.yearTo);
    var b = document.getElementById('mbrf-gear-badge');
    b.textContent = cfg.minRating > 0 ? cfg.minRating : '';
    cfg.minRating > 0 ? b.classList.add('show') : b.classList.remove('show');
    closePill();
    rebuildSlides();
  });

  /* ── Gear open/close ────────────────────────────────────────────────────── */
  var pillOpen = false;
  gear.addEventListener('click', function(e){
    e.stopPropagation(); pillOpen = !pillOpen;
    if(pillOpen){
      var r = gear.getBoundingClientRect();
      pill.style.bottom = (window.innerHeight - r.top + 10) + 'px';
      pill.style.left   = Math.max(10, r.right - 310) + 'px';
      pill.style.top    = 'auto';
      pill.classList.add('open');
      startPillAutoClose();
    } else {
      closePill();
    }
  });
  document.addEventListener('click', function(e){
    if(pillOpen && !gear.contains(e.target) && !pill.contains(e.target)) closePill();
  });

  /* ── Jellyfin API ────────────────────────────────────────────────────────── */
  function getAC(){ return window.ApiClient; }

  function fetchRandom(cb){
    if(cachedItems && cachedItems.length){ var tmp=cachedItems; cachedItems=null; cb(tmp); return; }
    var ac=getAC(); if(!ac){ setTimeout(function(){fetchRandom(cb);},300); return; }
    var userId = ac._currentUserId || (ac.getCurrentUserId && ac.getCurrentUserId());
    var token  = ac._token || (ac.accessToken && ac.accessToken());
    var server = ac._serverAddress || ac._serverUrl || '';
    if(!userId || !token){ setTimeout(function(){fetchRandom(cb);},1000); return; }
    var types  = cfg.mediaType==='All' ? 'Movie,Series' : cfg.mediaType;
    var url = server+'/Items?SortBy=Random&Recursive=true&IncludeItemTypes='+types
      +'&Limit='+cfg.count
      +'&Fields=Overview,Genres,CommunityRating,BackdropImageTags,ImageTags,ProductionYear'
      +'&UserId='+userId
      +(cfg.minRating>0 ? '&MinCommunityRating='+cfg.minRating : '')
      +'&MinYear='+cfg.yearFrom
      +'&MaxYear='+cfg.yearTo;
    fetch(url, {headers:{'X-Emby-Token':token,'X-MediaBrowser-Token':token}})
      .then(function(r){ return r.json(); })
      .then(function(d){ cb(d.Items||[]); })
      .catch(function(e){ console.error('[MBRF]',e); });
  }

  /* ── Slides ──────────────────────────────────────────────────────────────── */
  var currentIdx = 0;
  var allSlides  = [];
  var timer      = null;

  function showSlide(idx){
    allSlides.forEach(function(s){ s.style.opacity='0'; s.style.zIndex='1'; });
    if(allSlides[idx]){ allSlides[idx].style.opacity='1'; allSlides[idx].style.zIndex='2'; }
    currentIdx = idx;
  }

  var arrowHideTimer = null;
  function attachBarInteraction(bar){
    function showArrows(){
      bar.classList.add('mbrf-active');
      if(arrowHideTimer) clearTimeout(arrowHideTimer);
      arrowHideTimer = setTimeout(function(){ bar.classList.remove('mbrf-active'); }, 2500);
    }
    bar.addEventListener('mousemove',  showArrows);
    bar.addEventListener('mouseenter', showArrows);
    bar.addEventListener('mouseleave', function(){
      if(arrowHideTimer) clearTimeout(arrowHideTimer);
      bar.classList.remove('mbrf-active');
    });
    bar.addEventListener('touchstart', showArrows, {passive:true});
  }

  function rebuildSlides(){
    var bar = document.querySelector('#jf-media-bar');
    if(!bar){ setTimeout(rebuildSlides, 1000); return; }

    fetchRandom(function(items){
      if(!items.length) return;
      var ac     = getAC();
      var server = ac._serverAddress || ac._serverUrl || '';
      var token  = ac._token || (ac.accessToken && ac.accessToken());

      bar.querySelectorAll('.jfmb-slide,.mbrf-slide').forEach(function(s){ s.remove(); });
      if(timer) clearInterval(timer);
      allSlides  = [];
      currentIdx = 0;

      items.forEach(function(item){
        var bdTag  = item.BackdropImageTags && item.BackdropImageTags[0];
        var imgUrl = bdTag
          ? server+'/Items/'+item.Id+'/Images/Backdrop/0?tag='+bdTag+'&quality=90&maxWidth=1920'
          : (item.ImageTags && item.ImageTags.Primary
              ? server+'/Items/'+item.Id+'/Images/Primary?tag='+item.ImageTags.Primary+'&quality=90'
              : '');

        var s = document.createElement('div');
        s.className  = 'jfmb-slide mbrf-slide';
        s.style.cssText = 'position:absolute;inset:0;background-size:cover;background-position:center 20%;opacity:0;transition:opacity 1s;z-index:1;display:flex;align-items:flex-end;cursor:pointer;'
          + (imgUrl ? 'background-image:url("'+imgUrl+'");' : 'background:#111;');

        var rating = item.CommunityRating ? item.CommunityRating.toFixed(1) : '';
        var genres = (item.Genres||[]).slice(0,3).join(' · ');
        var year   = item.ProductionYear || '';
        var name   = item.Name || '';
        var logoUrl = server+'/Items/'+item.Id+'/Images/Logo?quality=90&maxWidth=400';

        s.innerHTML = '<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.1) 35%,transparent 60%);z-index:1;pointer-events:none;"></div>'
          +'<div style="position:absolute;bottom:0;left:0;right:0;padding:22px 28px;box-sizing:border-box;z-index:2;">'
          +'<img src="'+logoUrl+'" onerror="this.style.display=\'none\'" style="max-height:80px;max-width:320px;object-fit:contain;margin-bottom:8px;display:block">'
          +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">'
          +(rating ? '<div style="color:#f5c518;font-size:14px;font-weight:700">★ '+rating+'</div>' : '')
          +'<div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.85)">'+name+'</div>'
          +'</div>'
          +'<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:6px">'+year+(genres?' · '+genres:'')+'</div>'
          +'<div style="font-size:11px;color:rgba(255,255,255,0.9);max-width:460px;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 4px rgba(0,0,0,0.8)">'+(item.Overview||'')+'</div>'
          +'<div style="display:flex;gap:10px;align-items:center">'
          +'<button onclick="(function(){var ac=window.ApiClient;var sid=ac&&ac._serverInfo&&ac._serverInfo.Id;try{if(window.Emby&&Emby.Page){Emby.Page.showItem(\''+item.Id+'\');return;}}catch(e){}window.location.href=window.location.origin+window.location.pathname+\'#!/details?id='+item.Id+'\'+(sid?\'&serverId=\'+sid:\'\');})()" style="padding:9px 20px;background:#fff;color:#000;border:none;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer">▶ Play Now</button>'
          +'<button onclick="(function(){var ac=window.ApiClient;var sid=ac&&ac._serverInfo&&ac._serverInfo.Id;try{if(window.Emby&&Emby.Page){Emby.Page.showItem(\''+item.Id+'\');return;}}catch(e){}window.location.href=window.location.origin+window.location.pathname+\'#!/details?id='+item.Id+'\'+(sid?\'&serverId=\'+sid:\'\');})()" style="padding:9px 16px;background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:6px;font-size:13px;cursor:pointer">More Info</button>'
          +'</div></div>';

        (function(id, serverId){
          function nav(){
            if(window.appRouter && appRouter.showItem){ appRouter.showItem({Id:id,ServerId:serverId}); return; }
            if(window.Emby && Emby.Page && Emby.Page.showItem){ Emby.Page.showItem(id); return; }
            if(window.Dashboard && Dashboard.navigate){ Dashboard.navigate('details?id='+id+(serverId?'&serverId='+serverId:'')); return; }
            var hash = '#!/details?id='+id+(serverId?'&serverId='+serverId:'');
            if(window.location.hash !== hash) window.location.hash = hash.replace('#','');
          }
          s.addEventListener('click', function(e){ if(e.target.tagName==='BUTTON') return; nav(); });
        })(item.Id, (function(){ var a=getAC(); return a&&(a._serverInfo&&a._serverInfo.Id||(a.serverId&&a.serverId())); })());

        bar.appendChild(s);
        allSlides.push(s);
      });

      showSlide(0);

      /* Arrows */
      var prevBtn = bar.querySelector('.jfmb-prev');
      var nextBtn = bar.querySelector('.jfmb-next');
      if(!prevBtn){
        prevBtn = document.createElement('button');
        prevBtn.id = 'mbrf-prev'; prevBtn.innerHTML = '❮';
        prevBtn.style.cssText = 'position:absolute;left:12px;top:50%;transform:translateY(-50%);z-index:50;background:rgba(0,0,0,0.5);color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:18px;cursor:pointer;';
        bar.appendChild(prevBtn);
      }
      if(!nextBtn){
        nextBtn = document.createElement('button');
        nextBtn.id = 'mbrf-next'; nextBtn.innerHTML = '❯';
        nextBtn.style.cssText = 'position:absolute;right:12px;top:50%;transform:translateY(-50%);z-index:50;background:rgba(0,0,0,0.5);color:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:18px;cursor:pointer;';
        bar.appendChild(nextBtn);
      }

      var newPrev = prevBtn.cloneNode(true); prevBtn.parentNode.replaceChild(newPrev, prevBtn);
      var newNext = nextBtn.cloneNode(true); nextBtn.parentNode.replaceChild(newNext, nextBtn);

      newPrev.addEventListener('click', function(e){
        e.stopPropagation(); if(timer) clearInterval(timer);
        showSlide((currentIdx-1+allSlides.length)%allSlides.length);
        startTimer(bar);
      });
      newNext.addEventListener('click', function(e){
        e.stopPropagation(); if(timer) clearInterval(timer);
        showSlide((currentIdx+1)%allSlides.length);
        startTimer(bar);
      });

      if(!bar.contains(gearWrap)) bar.appendChild(gearWrap);
      attachBarInteraction(bar);
      startTimer(bar);
      console.log('[MBRF] '+items.length+' slides loaded ✓');
    });
  }

  function startTimer(bar){
    if(timer) clearInterval(timer);
    timer = setInterval(function(){ showSlide((currentIdx+1)%allSlides.length); }, cfg.interval * 1000);
  }

  /* ── Init ────────────────────────────────────────────────────────────────── */
  var initiated   = false;
  var cachedItems = null;

  function tryInit(){
    if(initiated) return;
    var bar = document.querySelector('#jf-media-bar'); if(!bar) return;
    var ac  = getAC(); if(!ac) return;
    var userId = ac._currentUserId || (ac.getCurrentUserId && ac.getCurrentUserId());
    var token  = ac._token || (ac.accessToken && ac.accessToken());
    if(!userId || !token) return;
    initiated   = true;
    cachedItems = null;
    loadCfg();

    var curYear = new Date().getFullYear();

    rs.value  = cfg.minRating; gradSet(rs); renderStars(cfg.minRating);
    document.getElementById('mbrf-rv').textContent = cfg.minRating===0?'–':cfg.minRating;
    cs.value  = cfg.count;    gradSet(cs);
    document.getElementById('mbrf-cv').textContent = cfg.count;
    is_.value = cfg.interval; gradSet(is_);
    document.getElementById('mbrf-iv').textContent = cfg.interval+'s';

    /* Clamp yearTo to actual current year on load */
    if(cfg.yearTo > curYear) cfg.yearTo = curYear;
    renderYears();

    pill.querySelectorAll('.mbrf-chip').forEach(function(c){
      c.classList.toggle('on', c.dataset.v === cfg.mediaType);
    });

    rebuildSlides();
  }

  var initInterval = setInterval(function(){
    tryInit();
    if(initiated) clearInterval(initInterval);
  }, 300);
  setTimeout(function(){ clearInterval(initInterval); }, 15000);

  console.log('[MediaBarRatingFilter] Mod loaded ✓');
})();
