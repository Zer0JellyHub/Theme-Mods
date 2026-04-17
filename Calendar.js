(function () {
  'use strict';

  const CAL_ICON = `<span class="jf-tab-icon"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/></svg></span>`;

  const DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const pad = n => String(n).padStart(2,'0');
  const toKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const fmtDayLabel = d => ({ day: DAYS_EN[d.getDay()], date: `${pad(d.getDate())}.${pad(d.getMonth()+1)}` });

  const CSS = `
    #jf-overlay {
      position:fixed; inset:0; z-index:99999;
      background:rgba(0,0,0,.55);
      backdrop-filter:blur(24px) saturate(1.4);
      -webkit-backdrop-filter:blur(24px) saturate(1.4);
      display:flex; flex-direction:column; overflow:hidden;
    }
    #jf-overlay-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 3.5%; border-bottom:1px solid rgba(255,255,255,.12);
      flex-shrink:0; background:rgba(0,0,0,.2); gap:12px;
    }
    #jf-overlay-title {
      font-size:1.2em; font-weight:300; letter-spacing:.03em;
      display:flex; align-items:center; gap:10px;
      color:rgba(255,255,255,.95); flex-shrink:0;
    }
    #jf-overlay-close {
      background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.18);
      color:rgba(255,255,255,.85); border-radius:50%;
      width:34px; height:34px; font-size:1em; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0; transition:background .2s;
    }
    #jf-overlay-close:hover { background:rgba(255,255,255,.22); color:#fff; }
    #jf-day-nav {
      display:flex; gap:6px; flex-wrap:nowrap; overflow-x:auto;
      scrollbar-width:none; flex:1; justify-content:center;
    }
    #jf-day-nav::-webkit-scrollbar { display:none; }
    .jf-day-btn {
      background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14);
      color:rgba(255,255,255,.7); border-radius:8px;
      padding:5px 10px; cursor:pointer; flex-shrink:0;
      font-size:.78em; line-height:1.3; text-align:center;
      transition:background .15s, border-color .15s, color .15s; min-width:56px;
    }
    .jf-day-btn:hover { background:rgba(255,255,255,.14); color:#fff; }
    .jf-day-btn.active {
      background:rgba(255,255,255,.22); border-color:rgba(255,255,255,.5);
      color:#fff; font-weight:500;
    }
    .jf-day-btn.empty { opacity:.4; }
    .jf-day-btn .btn-day { display:block; }
    .jf-day-btn .btn-date { display:block; font-size:.9em; opacity:.6; }
    #jf-overlay-body {
      flex:1; overflow-y:auto; padding:0 3.5% 3em;
      scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.2) transparent;
    }
    #jf-overlay-body::-webkit-scrollbar { width:4px; }
    #jf-overlay-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,.2); border-radius:2px; }
    .jf-day-section { padding-top:36px; }
    .jf-day-section h2 {
      font-size:1.2em; font-weight:300; letter-spacing:.04em;
      margin:0 0 .6em; color:rgba(255,255,255,.9);
    }
    .jf-cards { display:flex; flex-wrap:wrap; gap:12px; }
    .jf-card { width:150px; flex-shrink:0; cursor:pointer; transition:transform .2s, opacity .2s; }
    .jf-card:hover { transform:scale(1.05); opacity:.85; }
    .jf-card-img {
      width:150px; height:225px; border-radius:8px; overflow:hidden;
      background:rgba(255,255,255,.06); position:relative;
      border:1px solid rgba(255,255,255,.08);
    }
    .jf-card-img img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
    .jf-card-t {
      font-size:.82em; margin-top:6px; text-align:center;
      color:rgba(255,255,255,.9); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    }
    .jf-card-ep {
      font-size:.74em; margin-top:2px; text-align:center;
      color:rgba(255,255,255,.45); white-space:nowrap;
    }
    .jf-no-ep { padding:1.5em 0; color:rgba(255,255,255,.25); font-size:.88em; font-style:italic; }
    .jf-spinner { padding:3em; text-align:center; color:rgba(255,255,255,.4); }
    .jf-error {
      padding:2em; color:#f88; font-size:.9em; line-height:1.6;
      background:rgba(255,80,80,.08); border-radius:8px; margin:2em 0;
    }
    @media(max-width:600px){
      .jf-card,.jf-card-img { width:calc(33vw - 14px); height:calc((33vw - 14px)*1.5); }
      .jf-day-btn { min-width:44px; padding:4px 5px; font-size:.72em; }
    }
  `;

  const injectCSS = () => {
    if (document.getElementById('jf-cal-css')) return;
    const s = document.createElement('style');
    s.id='jf-cal-css'; s.textContent=CSS;
    document.head.appendChild(s);
  };

  const escHandler = e => { if (e.key==='Escape') closeCalendar(); };

  const closeCalendar = () => {
    document.removeEventListener('keydown', escHandler);
    const o = document.getElementById('jf-overlay'); if (o) o.remove();
    document.querySelectorAll('[id^="customTabButton"]').forEach(b => {
      if (b.textContent.trim().toLowerCase().includes('calend'))
        b.classList.remove('emby-tab-button-active');
    });
  };

  const jfFetch = async (server, path, params, token) => {
    if (typeof ApiClient !== 'undefined' && typeof ApiClient.getJSON === 'function') {
      try {
        const data = await ApiClient.getJSON(ApiClient.getUrl(path, params));
        if (data && Array.isArray(data.Items)) return data;
      } catch (e) {
        console.warn('[JF-Cal] ApiClient.getJSON failed, falling back to fetch()', e);
      }
    }
    const url = `${server}/${path}?${new URLSearchParams(params)}`;
    const resp = await fetch(url, {
      headers: {
        'Authorization': `MediaBrowser Token="${token}"`,
        'X-Emby-Authorization': `MediaBrowser Token="${token}"`
      }
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status} – ${text.substring(0, 300)}`);
    }
    return resp.json();
  };

  /* Format season/episode label — e.g. S2 E12 */
  const fmtEpLabel = item => {
    const s = item.ParentIndexNumber;   // season number
    const e = item.IndexNumber;         // episode number
    if (s != null && e != null) return `S${s} E${e}`;
    if (e != null) return `E${e}`;
    return '';
  };

  /* Deduplicate: per series keep only the FIRST (earliest) episode per day */
  const dedup = items => {
    const seen = new Set();
    return items.filter(item => {
      const key = item.SeriesId || item.Id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const buildCards = (items, server, token) => {
    if (!items.length) return `<div class="jf-no-ep">No episodes scheduled.</div>`;
    return dedup(items).map(item => {
      const sid   = item.SeriesId || item.Id;
      const tag   = item.SeriesPrimaryImageTag || (item.ImageTags && item.ImageTags.Primary) || '';
      const img   = sid
        ? `${server}/Items/${sid}/Images/Primary?maxHeight=300&quality=85${tag ? '&tag='+tag : ''}&api_key=${token}`
        : '';
      const title = item.SeriesName || item.Name || '';
      const epLbl = fmtEpLabel(item);

      return `<div class="jf-card" onclick="document.getElementById('jf-overlay').remove();window.location.hash='/details?id=${sid}'">
        <div class="jf-card-img">${img ? `<img src="${img}" alt="" onerror="this.style.display='none'">` : ''}</div>
        <div class="jf-card-t">${title}</div>
        ${epLbl ? `<div class="jf-card-ep">${epLbl}</div>` : ''}
      </div>`;
    }).join('');
  };

  const renderAll = (days, groups, server, token) => {
    const body = document.getElementById('jf-overlay-body');
    if (!body) return;
    body.innerHTML = days.map(d => {
      const k = toKey(d); const lbl = fmtDayLabel(d);
      return `<div class="jf-day-section" id="jf-sec-${k}">
        <h2>${lbl.day} ${lbl.date}</h2>
        <div class="jf-cards">${buildCards(groups[k] || [], server, token)}</div>
      </div>`;
    }).join('');
    body.scrollTop = 0;
  };

  const renderOne = (key, label, groups, server, token) => {
    const body = document.getElementById('jf-overlay-body');
    if (!body) return;
    body.innerHTML = `<div class="jf-day-section">
      <h2>${label}</h2>
      <div class="jf-cards">${buildCards(groups[key] || [], server, token)}</div>
    </div>`;
    body.scrollTop = 0;
  };

  const openCalendar = async () => {
    injectCSS();

    const days = [];
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    for (let i = -1; i < 8; i++) {
      const d = new Date(today); d.setDate(today.getDate()+i); days.push(d);
    }
    const cutoff = new Date(days[days.length-1]); cutoff.setHours(23,59,59,999);

    const navHTML = days.map(d => {
      const k = toKey(d); const l = fmtDayLabel(d);
      const isYest = toKey(d) === toKey(yesterday);
      return `<button class="jf-day-btn" data-key="${k}" data-label="${l.day} ${l.date}">
        <span class="btn-day">${isYest ? 'Yest.' : l.day.substring(0,3)}</span>
        <span class="btn-date">${l.date}</span>
      </button>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = 'jf-overlay';
    overlay.innerHTML = `
      <div id="jf-overlay-header">
        <div id="jf-overlay-title">
          <svg viewBox="0 0 24 24" width="20" height="20" style="flex-shrink:0;opacity:.9">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
          </svg>
          Coming Up
        </div>
        <div id="jf-day-nav">${navHTML}</div>
        <button id="jf-overlay-close">✕</button>
      </div>
      <div id="jf-overlay-body"><div class="jf-spinner">Loading…</div></div>`;

    document.body.appendChild(overlay);
    document.getElementById('jf-overlay-close').onclick = closeCalendar;
    document.addEventListener('keydown', escHandler);

    try {
      const userId = ApiClient.getCurrentUserId();
      const server = ApiClient.serverAddress().replace(/\/$/, '');
      const token  = ApiClient.accessToken();

      const data = await jfFetch(server, 'Shows/Upcoming', {
        UserId: userId,
        Limit: 500,
        Fields: 'PremiereDate,SeriesInfo,PrimaryImageAspectRatio,SeriesPrimaryImageTag',
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary',
      }, token);

      const body = document.getElementById('jf-overlay-body');
      if (!body) return;

      const groups = {};
      (data.Items || []).forEach(i => {
        const raw = i.PremiereDate || i.StartDate || '';
        if (!raw) return;
        const d = new Date(raw); if (isNaN(d.getTime())) return;
        d.setHours(0,0,0,0);
        if (d < yesterday || d > cutoff) return;
        const k = toKey(d);
        if (!groups[k]) groups[k] = [];
        groups[k].push(i);
      });

      days.forEach(d => {
        const k = toKey(d);
        const btn = overlay.querySelector(`.jf-day-btn[data-key="${k}"]`);
        if (btn && !groups[k]) btn.classList.add('empty');
      });

      renderAll(days, groups, server, token);

      let filterActive = false;
      const bodyEl = document.getElementById('jf-overlay-body');

      const observer = new IntersectionObserver(entries => {
        if (filterActive) return;
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const key = entry.target.id.replace('jf-sec-','');
            overlay.querySelectorAll('.jf-day-btn').forEach(b =>
              b.classList.toggle('active', b.dataset.key === key)
            );
          }
        });
      }, { root: bodyEl, threshold: 0.4 });

      const observeAll = () => days.forEach(d => {
        const sec = document.getElementById(`jf-sec-${toKey(d)}`);
        if (sec) observer.observe(sec);
      });
      observeAll();

      overlay.querySelectorAll('.jf-day-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const alreadyActive = btn.classList.contains('active') && filterActive;
          if (alreadyActive) {
            filterActive = false;
            overlay.querySelectorAll('.jf-day-btn').forEach(b => b.classList.remove('active'));
            renderAll(days, groups, server, token);
            setTimeout(observeAll, 100);
          } else {
            filterActive = true;
            overlay.querySelectorAll('.jf-day-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderOne(btn.dataset.key, btn.dataset.label, groups, server, token);
          }
        });
      });

    } catch (e) {
      console.error('[JF-Cal]', e);
      const body = document.getElementById('jf-overlay-body');
      if (body) body.innerHTML = `<div class="jf-error">
        <strong>Failed to load schedule.</strong><br>${e.message}<br><br>
        <small>Open the browser console (F12 → Console) and look for [JF-Cal] for details.</small>
      </div>`;
    }
  };

  const patchCalTab = () => {
    const btn = [...document.querySelectorAll('[id^="customTabButton"]')]
                .find(b => b.textContent.trim().toLowerCase().includes('calend'));
    if (!btn) return;
    if (!btn.querySelector('.jf-tab-icon')) btn.insertAdjacentHTML('afterbegin', CAL_ICON);
    if (!btn.dataset.jfCal) {
      btn.dataset.jfCal = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopImmediatePropagation();
        if (document.getElementById('jf-overlay')) { closeCalendar(); return; }
        openCalendar();
      }, true);
    }
  };

  setInterval(() => { if (typeof ApiClient !== 'undefined') { injectCSS(); patchCalTab(); } }, 400);
})();
