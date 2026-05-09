/**
 * ============================================================
 *  JELLYFIN DEVICE MANAGER – Native Sidebar Style
 * ============================================================
 *  Admin-Dashboard → Allgemein → Benutzerdefiniertes JavaScript
 * ============================================================
 */

(function () {
  'use strict';

  // ── API ──────────────────────────────────────────────────────

  const API = {
    h: () => ({
      'Authorization': `MediaBrowser Token="${ApiClient.accessToken()}"`,
      'Content-Type':  'application/json',
    }),
    get:    p     => fetch(location.origin + p, { headers: API.h() }).then(r => r.json()),
    delete: p     => fetch(location.origin + p, { method: 'DELETE', headers: API.h() }),
    post:   (p,b) => fetch(location.origin + p, { method: 'POST', headers: API.h(), body: JSON.stringify(b) }),
  };

  // ── Speicher ──────────────────────────────────────────────────

  const Store = {
    _k: 'dm_v5',
    _d() { try { return JSON.parse(localStorage.getItem(this._k)||'{}'); } catch { return {}; } },
    _s(d) { localStorage.setItem(this._k, JSON.stringify(d)); },
    key:            (name, user) => `${name}||${user}`,
    setStatus(k,v)  { const d=this._d(); (d.s=d.s||{})[k]=v; this._s(d); },
    getStatus(k)    { return this._d().s?.[k] || 'unknown'; },
    blocking()      { return this._d().bl===true; },
    setBlocking(v)  { const d=this._d(); d.bl=v; this._s(d); },
    blockUnknown()  { return this._d().bu===true; },
    setBlockUnknown(v){ const d=this._d(); d.bu=v; this._s(d); },
  };

  // ── SVG Icons (gleicher Stil wie Jellyfin intern) ────────────

  const ICON_DEVICE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/>
  </svg>`;

  // ── CSS ───────────────────────────────────────────────────────

  const CSS = `
    /* Sidebar-Button: exakt wie bestehende Plugin-Einträge */
    #dm-sidebar-btn {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: .7em 1.5em .7em 1.7em;
      cursor: pointer;
      color: inherit;
      text-decoration: none;
      box-sizing: border-box;
      width: 100%;
      font-size: inherit;
      font-family: inherit;
      background: none;
      border: none;
      text-align: left;
      position: relative;
    }
    #dm-sidebar-btn:hover {
      background: rgba(255,255,255,.08);
    }
    #dm-sidebar-btn svg {
      flex-shrink: 0;
      margin-right: .8em;
      opacity: .75;
      width: 24px;
      height: 24px;
    }
    #dm-sidebar-btn:hover svg { opacity: 1; }
    #dm-sidebar-btn span.dm-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #dm-badge {
      background: rgba(248,113,113,.85);
      color: #fff;
      border-radius: 10px;
      padding: 1px 6px;
      font-size: .7em;
      font-weight: 600;
      margin-left: .5em;
      display: none;
      flex-shrink: 0;
    }

    /* ── Overlay: identisch mit Calendar ─────────────────────── */
    #dm-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,.55);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      display: flex; flex-direction: column; overflow: hidden;
    }
    #dm-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 3.5%; border-bottom: 1px solid rgba(255,255,255,.12);
      flex-shrink: 0; background: rgba(0,0,0,.2); gap: 12px;
    }
    #dm-title {
      font-size: 1.2em; font-weight: 300; letter-spacing: .03em;
      display: flex; align-items: center; gap: 10px;
      color: rgba(255,255,255,.95); flex-shrink: 0;
    }
    #dm-title svg { opacity: .85; flex-shrink: 0; }
    #dm-close {
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.18);
      color: rgba(255,255,255,.85); border-radius: 50%;
      width: 34px; height: 34px; font-size: 1em; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background .2s;
    }
    #dm-close:hover { background: rgba(255,255,255,.22); color: #fff; }

    /* Tabs – gleich wie Calendar jf-day-btn */
    #dm-tabs {
      display: flex; gap: 6px; flex-wrap: nowrap; overflow-x: auto;
      scrollbar-width: none; flex: 1; justify-content: center;
    }
    #dm-tabs::-webkit-scrollbar { display: none; }
    .dm-tab {
      background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14);
      color: rgba(255,255,255,.7); border-radius: 8px;
      padding: 5px 14px; cursor: pointer; flex-shrink: 0; font-size: .8em;
      transition: background .15s, border-color .15s, color .15s;
    }
    .dm-tab:hover { background: rgba(255,255,255,.14); color: #fff; }
    .dm-tab.active {
      background: rgba(255,255,255,.22); border-color: rgba(255,255,255,.5);
      color: #fff; font-weight: 500;
    }

    /* Blockier-Bar */
    #dm-block-bar {
      display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
      padding: 8px 3.5%; border-bottom: 1px solid rgba(255,255,255,.07);
      background: rgba(0,0,0,.15); font-size: .8em; color: rgba(255,255,255,.55);
    }
    .dm-tgl-wrap { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .dm-tgl { position: relative; width: 36px; height: 20px; }
    .dm-tgl input { opacity: 0; width: 0; height: 0; }
    .dm-slid {
      position: absolute; inset: 0;
      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.2);
      border-radius: 20px; transition: background .3s;
    }
    .dm-slid:before {
      content: ''; position: absolute; height: 13px; width: 13px;
      left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: transform .3s;
    }
    .dm-tgl input:checked + .dm-slid { background: rgba(255,255,255,.35); border-color: rgba(255,255,255,.5); }
    .dm-tgl input:checked + .dm-slid:before { transform: translateX(16px); }
    .dm-pulse { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.2); display: inline-block; }
    .dm-pulse.on { background: #4ade80; box-shadow: 0 0 7px #4ade80; }

    /* Body */
    #dm-body { display: flex; flex: 1; overflow: hidden; }
    #dm-list {
      flex: 1; overflow-y: auto; padding: 1.2em 3.5%;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,.15) transparent;
    }
    #dm-list::-webkit-scrollbar { width: 4px; }
    #dm-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.18); border-radius: 2px; }

    /* Gerätekarte */
    .dm-card {
      background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
      border-radius: 10px; margin-bottom: 9px;
      transition: background .2s, border-color .2s;
    }
    .dm-card:hover { background: rgba(255,255,255,.09); border-color: rgba(255,255,255,.18); }
    .dm-card.blk   { background: rgba(255,60,60,.07);  border-color: rgba(255,80,80,.2); }
    .dm-card.ok    { border-color: rgba(100,255,160,.18); }
    .dm-card-inner { display: flex; align-items: center; gap: 14px; padding: 12px 16px; }

    .dm-avatar {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14);
      display: flex; align-items: center; justify-content: center; font-size: 17px;
    }
    .dm-info { flex: 1; min-width: 0; }
    .dm-dname {
      font-size: .9em; font-weight: 500; color: rgba(255,255,255,.95);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dm-dmeta { font-size: .74em; color: rgba(255,255,255,.38); margin-top: 2px; }
    .dm-apps  { font-size: .71em; color: rgba(255,255,255,.25); margin-top: 3px; }

    .dm-live {
      display: inline-block; width: 7px; height: 7px; border-radius: 50%;
      background: #4ade80; margin-right: 5px;
      animation: dm-p 1.5s ease-in-out infinite;
    }
    @keyframes dm-p { 0%,100%{opacity:1} 50%{opacity:.2} }
    .dm-blkwarn { font-size: .7em; color: rgba(248,113,113,.8); margin-left: 6px; }

    .dm-sb {
      padding: 3px 10px; border-radius: 20px; font-size: .72em; font-weight: 500;
      flex-shrink: 0; letter-spacing: .02em;
    }
    .dm-sb.unknown  { background: rgba(251,191,36,.1);  color: rgba(251,191,36,.9);  border: 1px solid rgba(251,191,36,.22); }
    .dm-sb.approved { background: rgba(74,222,128,.09); color: rgba(74,222,128,.9);  border: 1px solid rgba(74,222,128,.2); }
    .dm-sb.rejected { background: rgba(248,113,113,.09);color: rgba(248,113,113,.9); border: 1px solid rgba(248,113,113,.2); }

    .dm-acts { display: flex; gap: 6px; flex-shrink: 0; }
    .dm-btn {
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.16);
      color: rgba(255,255,255,.75); border-radius: 7px;
      padding: 5px 10px; cursor: pointer; font-size: .75em; font-weight: 500;
      transition: background .2s, color .2s;
    }
    .dm-btn:hover { background: rgba(255,255,255,.18); color: #fff; }
    .dm-btn.approve { background: rgba(74,222,128,.12);  border-color: rgba(74,222,128,.28);  color: rgba(74,222,128,.95); }
    .dm-btn.approve:hover { background: rgba(74,222,128,.25); }
    .dm-btn.reject  { background: rgba(248,113,113,.1);  border-color: rgba(248,113,113,.25); color: rgba(248,113,113,.95); }
    .dm-btn.reject:hover  { background: rgba(248,113,113,.22); }

    /* Log */
    #dm-log {
      width: 185px; border-left: 1px solid rgba(255,255,255,.07);
      background: rgba(0,0,0,.18); overflow-y: auto; flex-shrink: 0;
      display: flex; flex-direction: column;
    }
    #dm-log h4 {
      margin: 0; padding: 10px 13px; font-size: .7em; font-weight: 400;
      color: rgba(255,255,255,.28); letter-spacing: .08em; text-transform: uppercase;
      border-bottom: 1px solid rgba(255,255,255,.06); flex-shrink: 0;
    }
    .dm-le { padding: 7px 11px; border-bottom: 1px solid rgba(255,255,255,.04); font-size: .72em; }
    .dm-le-t { color: rgba(255,255,255,.22); }
    .dm-le-u { color: rgba(248,113,113,.75); font-weight: 500; margin-top: 1px; }
    .dm-le-d { color: rgba(255,255,255,.3); }
    .dm-le-empty { padding: 14px 11px; font-size: .75em; color: rgba(255,255,255,.15); text-align: center; font-style: italic; }

    /* Footer */
    #dm-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 3.5%; border-top: 1px solid rgba(255,255,255,.07);
      background: rgba(0,0,0,.18); font-size: .78em; color: rgba(255,255,255,.28); flex-shrink: 0;
    }
    #dm-reload {
      background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.13);
      color: rgba(255,255,255,.55); border-radius: 7px;
      padding: 4px 12px; cursor: pointer; font-size: .85em; transition: background .2s;
    }
    #dm-reload:hover { background: rgba(255,255,255,.16); color: #fff; }
    .dm-empty {
      padding: 3em 0; text-align: center;
      color: rgba(255,255,255,.18); font-size: .88em; font-style: italic;
    }
  `;

  const injectCSS = () => {
    if (document.getElementById('dm-css')) return;
    const s = document.createElement('style');
    s.id = 'dm-css'; s.textContent = CSS;
    document.head.appendChild(s);
  };

  // ── Daten ─────────────────────────────────────────────────────

  async function loadGroups() {
    const data  = await API.get('/Devices?userId=');
    const items = data.Items || [];
    const groups = {};
    for (const d of items) {
      const k = Store.key(d.Name||'Unbekannt', d.LastUserName||'—');
      if (!groups[k]) {
        groups[k] = {
          key: k, name: d.Name||'Unbekanntes Gerät', user: d.LastUserName||'—',
          icon: getIcon(d.Name||''), ids: [], apps: [], lastSeen: null,
          status: Store.getStatus(k),
        };
      }
      groups[k].ids.push(d.Id);
      const app = [d.AppName, d.AppVersion].filter(Boolean).join(' ');
      if (app && !groups[k].apps.includes(app)) groups[k].apps.push(app);
      const t = d.DateLastActivity ? new Date(d.DateLastActivity) : null;
      if (t && (!groups[k].lastSeen || t > groups[k].lastSeen)) groups[k].lastSeen = t;
    }
    return Object.values(groups).sort((a,b) =>
      ({unknown:0,rejected:1,approved:2}[a.status]??0) -
      ({unknown:0,rejected:1,approved:2}[b.status]??0)
    );
  }

  async function loadLive() {
    try { return new Set((await API.get('/Sessions')||[]).map(s=>s.DeviceId)); }
    catch { return new Set(); }
  }

  // ── Blockierung ───────────────────────────────────────────────

  let blockInterval = null;
  const blockLog    = [];

  async function enforce() {
    if (!Store.blocking()) return;
    let sessions; try { sessions = await API.get('/Sessions'); } catch { return; }
    const myId = ApiClient.getCurrentUserId();
    for (const s of sessions) {
      if (s.UserId === myId) continue;
      const k      = Store.key(s.DeviceName||'Unbekannt', s.UserName||'—');
      const status = Store.getStatus(k);
      const block  = status==='rejected'||(status==='unknown'&&Store.blockUnknown());
      if (!block) continue;
      try {
        await API.post(`/Sessions/${s.Id}/Message`, {
          Header:'Zugang verweigert',
          Text: status==='rejected' ? 'Dieses Gerät wurde gesperrt.' : 'Dieses Gerät ist noch nicht freigegeben.',
          TimeoutMs: 8000,
        });
        setTimeout(()=>API.delete(`/Sessions/${s.Id}`), 2000);
        blockLog.unshift({ time: new Date().toLocaleTimeString('de-DE'), user: s.UserName||'—', device: s.DeviceName||'?' });
        if (blockLog.length > 30) blockLog.pop();
      } catch { /* gone */ }
    }
    renderLog(); updateBadge();
  }

  const startBlocking = () => {
    if (!blockInterval) {
      enforce(); // sofort beim Einschalten
      blockInterval = setInterval(enforce, 8000);
    }
  };
  const stopBlocking = () => { clearInterval(blockInterval); blockInterval = null; };

  // ── Aktionen ─────────────────────────────────────────────────

  async function doAction(action, group) {
    switch(action) {
      case 'approve': Store.setStatus(group.key,'approved'); break;
      case 'reject':  Store.setStatus(group.key,'rejected'); await kickGroup(group); break;
      case 'reset':   Store.setStatus(group.key,'unknown');  break;
      case 'delete':
        if (!confirm(`Alle ${group.ids.length} Einträge für „${group.name}" (${group.user}) löschen?`)) return;
        await Promise.all(group.ids.map(id=>API.delete(`/Devices?id=${id}`)));
        break;
    }
  }

  async function kickGroup(group) {
    try {
      const sessions = await API.get('/Sessions');
      for (const s of sessions) {
        if (!group.ids.includes(s.DeviceId)) continue;
        await API.post(`/Sessions/${s.Id}/Message`,{ Header:'Zugang verweigert', Text:'Dein Gerät wurde gesperrt.', TimeoutMs:8000 });
        setTimeout(()=>API.delete(`/Sessions/${s.Id}`), 2000);
      }
    } catch { /* ignore */ }
  }

  // ── Render ────────────────────────────────────────────────────

  let allGroups = [], liveSessions = new Set();

  function renderCards(groups, live, filter='all') {
    const list = document.getElementById('dm-list');
    const cnt  = document.getElementById('dm-count');
    if (!list) return;
    const filtered = filter==='all' ? groups : groups.filter(g=>g.status===filter);
    if (cnt) cnt.textContent = `${filtered.length} Gerät${filtered.length!==1?'e':''}`;
    if (!filtered.length) { list.innerHTML=`<div class="dm-empty">Keine Geräte.</div>`; return; }

    const blocking = Store.blocking(), blkUnk = Store.blockUnknown();
    list.innerHTML = filtered.map(g => {
      const isLive = g.ids.some(id=>live.has(id));
      const willBlk= blocking&&(g.status==='rejected'||(g.status==='unknown'&&blkUnk));
      const last   = g.lastSeen ? g.lastSeen.toLocaleString('de-DE') : '—';
      const btxt   = {unknown:'⚠ Unbekannt',approved:'✓ Bestätigt',rejected:'✕ Abgelehnt'}[g.status];
      return `
        <div class="dm-card ${willBlk?'blk':''} ${g.status==='approved'?'ok':''}" data-key="${encodeURIComponent(g.key)}">
          <div class="dm-card-inner">
            <div class="dm-avatar">${g.icon}</div>
            <div class="dm-info">
              <div class="dm-dname">
                ${isLive?'<span class="dm-live"></span>':''}${g.name}
                ${willBlk&&isLive?`<span class="dm-blkwarn">⛔ wird geblockt</span>`:''}
              </div>
              <div class="dm-dmeta">👤 ${g.user} · 🕐 ${last}</div>
              <div class="dm-apps">📦 ${g.apps.join(' · ')||'—'} (${g.ids.length})</div>
            </div>
            <span class="dm-sb ${g.status}">${btxt}</span>
            <div class="dm-acts">
              ${g.status!=='approved'?`<button class="dm-btn approve" data-a="approve">✔ Bestätigen</button>`:''}
              ${g.status!=='rejected'?`<button class="dm-btn reject"  data-a="reject">✕ Ablehnen</button>`:''}
              ${g.status!=='unknown' ?`<button class="dm-btn"         data-a="reset">↩</button>`:''}
              <button class="dm-btn" data-a="delete">🗑</button>
            </div>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('[data-a]').forEach(btn=>btn.addEventListener('click', async ()=>{
      const key   = decodeURIComponent(btn.closest('[data-key]').dataset.key);
      const group = allGroups.find(g=>g.key===key);
      if (!group) return;
      await doAction(btn.dataset.a, group);
      await refresh();
    }));
  }

  function renderLog() {
    const el = document.getElementById('dm-log-entries');
    if (!el) return;
    el.innerHTML = blockLog.length
      ? blockLog.map(e=>`<div class="dm-le"><div class="dm-le-t">${e.time}</div><div class="dm-le-u">🚫 ${e.user}</div><div class="dm-le-d">${e.device}</div></div>`).join('')
      : `<div class="dm-le-empty">Noch leer.</div>`;
  }

  async function refresh() {
    const list = document.getElementById('dm-list');
    if (list) list.innerHTML = `<div class="dm-empty" style="opacity:.4">⏳ Lade…</div>`;
    [allGroups, liveSessions] = await Promise.all([loadGroups(), loadLive()]);
    const f = document.querySelector('.dm-tab.active')?.dataset.f || 'all';
    renderCards(allGroups, liveSessions, f);
    updateBadge();
  }

  function updateBadge() {
    const b = document.getElementById('dm-badge');
    if (!b) return;
    const n = allGroups.filter(g=>g.status==='unknown').length;
    b.textContent = n; b.style.display = n>0?'inline':'none';
  }

  // ── Overlay ───────────────────────────────────────────────────

  const escHandler = e => { if (e.key==='Escape') closeDM(); };
  const closeDM = () => {
    document.removeEventListener('keydown', escHandler);
    document.getElementById('dm-overlay')?.remove();
  };

  function buildOverlay() {
    const el = document.createElement('div');
    el.id = 'dm-overlay';
    el.innerHTML = `
      <div id="dm-header">
        <div id="dm-title">${ICON_DEVICE} Geräteverwaltung</div>
        <div id="dm-tabs">
          <button class="dm-tab active" data-f="all">Alle</button>
          <button class="dm-tab" data-f="unknown">⚠ Unbekannt</button>
          <button class="dm-tab" data-f="approved">✓ Bestätigt</button>
          <button class="dm-tab" data-f="rejected">✕ Abgelehnt</button>
        </div>
        <button id="dm-close">✕</button>
      </div>
      <div id="dm-block-bar">
        <span class="dm-pulse" id="dm-dot"></span>
        <label class="dm-tgl-wrap">
          <label class="dm-tgl"><input type="checkbox" id="dm-tb"><span class="dm-slid"></span></label>
          Auto-Blockierung
        </label>
        <label class="dm-tgl-wrap" id="dm-uw" style="opacity:.4;pointer-events:none">
          <label class="dm-tgl"><input type="checkbox" id="dm-tu"><span class="dm-slid"></span></label>
          Unbekannte sperren
        </label>
        <span style="margin-left:auto;font-size:.78em;opacity:.3">alle 15 Sek.</span>
      </div>
      <div id="dm-body">
        <div id="dm-list"><div class="dm-empty" style="opacity:.4">⏳ Lade…</div></div>
        <div id="dm-log">
          <h4>🛡 Blockier-Log</h4>
          <div id="dm-log-entries"><div class="dm-le-empty">Noch leer.</div></div>
        </div>
      </div>
      <div id="dm-footer">
        <span id="dm-count"></span>
        <button id="dm-reload">🔄 Aktualisieren</button>
      </div>`;
    document.body.appendChild(el);

    el.addEventListener('click', e=>{ if(e.target===el) closeDM(); });
    el.querySelector('#dm-close').onclick = closeDM;
    document.addEventListener('keydown', escHandler);
    el.querySelectorAll('.dm-tab').forEach(t=>t.addEventListener('click',()=>{
      el.querySelectorAll('.dm-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      renderCards(allGroups, liveSessions, t.dataset.f);
    }));
    el.querySelector('#dm-reload').onclick = refresh;

    const tb=el.querySelector('#dm-tb'), tu=el.querySelector('#dm-tu'), uw=el.querySelector('#dm-uw');
    tb.checked=Store.blocking(); tu.checked=Store.blockUnknown(); syncUI();
    tb.addEventListener('change',()=>{ Store.setBlocking(tb.checked); tb.checked?startBlocking():stopBlocking(); syncUI(); });
    tu.addEventListener('change',()=>Store.setBlockUnknown(tu.checked));
    function syncUI() {
      const on=Store.blocking();
      uw.style.opacity=on?'1':'.4'; uw.style.pointerEvents=on?'auto':'none';
      const dot=document.getElementById('dm-dot'); if(dot) dot.className='dm-pulse'+(on?' on':'');
    }
  }

  const openDM = () => {
    if (document.getElementById('dm-overlay')) { closeDM(); return; }
    buildOverlay(); refresh();
  };

  // ── Sidebar-Button: klont einen bestehenden Eintrag ──────────

  function addSidebarButton() {
    if (document.getElementById('dm-sidebar-btn')) return true;

    // Einen bestehenden Sidebar-Eintrag als Referenz finden
    const existing = document.querySelector('.navMenuOption') ||
                     document.querySelector('[is="emby-button"].navMenuOption') ||
                     document.querySelector('a.navMenuOption');

    // Container finden
    const container = existing?.parentElement ||
                      document.querySelector('.adminDrawer .scrollY') ||
                      document.querySelector('[data-role="panel"] .scrollY') ||
                      document.querySelector('.mainDrawer-scrollContainer');

    if (!container) return false;

    const btn = document.createElement('button');
    btn.id = 'dm-sidebar-btn';

    // Klasse des ersten Eintrags übernehmen für perfektes Matching
    if (existing) {
      btn.className = existing.className;
    }

    btn.innerHTML = `${ICON_DEVICE}<span class="dm-label">Geräteverwaltung</span><span id="dm-badge"></span>`;
    btn.onclick = openDM;
    container.appendChild(btn);
    return true;
  }

  // ── Helfer ────────────────────────────────────────────────────

  function getIcon(name) {
    const n = name.toLowerCase();
    if (n.includes('iphone')||n.includes('android')||n.includes('phone')) return '📱';
    if (n.includes('ipad')||n.includes('tablet'))   return '📲';
    if (n.includes('tv')||n.includes('roku')||n.includes('fire')||n.includes('whale')) return '📺';
    if (n.includes('mac')||n.includes('windows')||n.includes('linux')) return '💻';
    return '🖥️';
  }

  // ── Init ──────────────────────────────────────────────────────

  async function init() {
    try { if (!(await API.get('/Users/Me'))?.Policy?.IsAdministrator) return; } catch { return; }
    injectCSS();
    if (Store.blocking()) startBlocking();
    let tries = 0;
    const t = setInterval(()=>{
      if (addSidebarButton() || ++tries > 40) {
        clearInterval(t);
        loadGroups().then(g=>{ allGroups=g; updateBadge(); });
      }
    }, 500);
    document.addEventListener('keydown', e=>{ if(e.ctrlKey&&e.shiftKey&&e.key==='D') openDM(); });
  }

  setInterval(()=>{ if (typeof ApiClient !== 'undefined') injectCSS(); }, 400);
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 1500);

})();
