/**
 * JELLYFIN DEVICE MANAGER – Group + Rename
 * Admin Dashboard → General → Custom JavaScript
 */
(function () {
  'use strict';

  const API = {
    h: () => ({ 'Authorization': `MediaBrowser Token="${ApiClient.accessToken()}"`, 'Content-Type': 'application/json' }),
    get:    p     => fetch(location.origin + p, { headers: API.h() }).then(r => r.json()),
    delete: p     => fetch(location.origin + p, { method: 'DELETE', headers: API.h() }),
    post:   (p,b) => fetch(location.origin + p, { method: 'POST', headers: API.h(), body: JSON.stringify(b) }),
  };

  const Store = {
    _k: 'dm_v7',
    _d() { try { return JSON.parse(localStorage.getItem(this._k)||'{}'); } catch { return {}; } },
    _s(d) { localStorage.setItem(this._k, JSON.stringify(d)); },
    key:              (deviceId) => deviceId,  // Schlüssel = DeviceId, unabhängig vom User
    setStatus(k,v)    { const d=this._d(); (d.s=d.s||{})[k]=v; this._s(d); },
    getStatus(k)      { return this._d().s?.[k] || 'unknown'; },
    setAlias(k,v)     { const d=this._d(); (d.a=d.a||{})[k]=v.trim(); this._s(d); },
    getAlias(k)       { return this._d().a?.[k] || ''; },
    delAlias(k)       { const d=this._d(); if(d.a) delete d.a[k]; this._s(d); },
    // Gruppen: { gid: { name, keys[] } }
    saveGroup(gid,name,keys) { const d=this._d(); (d.g=d.g||{})[gid]={name,keys}; this._s(d); },
    renameGroup(gid,name)    { const d=this._d(); if(d.g?.[gid]) d.g[gid].name=name; this._s(d); },
    delGroup(gid)            { const d=this._d(); if(d.g) delete d.g[gid]; this._s(d); },
    getGroups()              { return this._d().g||{}; },
    blocking()        { return this._d().bl===true; },
    setBlocking(v)    { const d=this._d(); d.bl=v; this._s(d); },
    blockUnknown()    { return this._d().bu===true; },
    setBlockUnknown(v){ const d=this._d(); d.bu=v; this._s(d); },
  };

  const ICON_DEVICE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>`;

  const CSS = `
    #dm-sidebar-btn { display:flex;flex-direction:row;align-items:center;padding:.7em 1.5em .7em 1.7em;cursor:pointer;color:inherit;box-sizing:border-box;width:100%;font-size:inherit;font-family:inherit;background:none;border:none;text-align:left; }
    #dm-sidebar-btn:hover { background:rgba(255,255,255,.08); }
    #dm-sidebar-btn svg { flex-shrink:0;margin-right:.8em;opacity:.75;width:24px;height:24px; }
    #dm-sidebar-btn:hover svg { opacity:1; }
    #dm-sidebar-btn .dm-label { flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    #dm-badge { background:rgba(248,113,113,.85);color:#fff;border-radius:10px;padding:1px 6px;font-size:.7em;font-weight:600;margin-left:.5em;display:none;flex-shrink:0; }

    #dm-overlay { position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);display:flex;flex-direction:column;overflow:hidden; }
    #dm-header { display:flex;align-items:center;justify-content:space-between;padding:14px 3.5%;border-bottom:1px solid rgba(255,255,255,.12);flex-shrink:0;background:rgba(0,0,0,.2);gap:12px; }
    #dm-title { font-size:1.2em;font-weight:300;letter-spacing:.03em;display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.95);flex-shrink:0; }
    #dm-close { background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);border-radius:50%;width:34px;height:34px;font-size:1em;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s; }
    #dm-close:hover { background:rgba(255,255,255,.22);color:#fff; }

    #dm-tabs { display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;flex:1;justify-content:center; }
    #dm-tabs::-webkit-scrollbar { display:none; }
    .dm-tab { background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.7);border-radius:8px;padding:5px 14px;cursor:pointer;flex-shrink:0;font-size:.8em;transition:all .15s; }
    .dm-tab:hover { background:rgba(255,255,255,.14);color:#fff; }
    .dm-tab.active { background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.5);color:#fff;font-weight:500; }

    #dm-block-bar { display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:8px 3.5%;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(0,0,0,.15);font-size:.8em;color:rgba(255,255,255,.55); }
    .dm-tgl-wrap { display:flex;align-items:center;gap:8px;cursor:pointer; }
    .dm-tgl { position:relative;width:36px;height:20px; }
    .dm-tgl input { opacity:0;width:0;height:0; }
    .dm-slid { position:absolute;inset:0;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);border-radius:20px;transition:background .3s; }
    .dm-slid:before { content:'';position:absolute;height:13px;width:13px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:transform .3s; }
    .dm-tgl input:checked+.dm-slid { background:rgba(255,255,255,.35);border-color:rgba(255,255,255,.5); }
    .dm-tgl input:checked+.dm-slid:before { transform:translateX(16px); }
    .dm-pulse { width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.2);display:inline-block; }
    .dm-pulse.on { background:#4ade80;box-shadow:0 0 7px #4ade80; }

    /* Gruppier-Modus Bar */
    #dm-grp-bar { display:none;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 3.5%;background:rgba(124,106,247,.1);border-bottom:1px solid rgba(124,106,247,.2);font-size:.82em;color:rgba(255,255,255,.65); }
    #dm-grp-bar.open { display:flex; }
    #dm-grp-count { color:rgba(124,106,247,.9);font-weight:600; }
    #dm-grp-name { flex:1;min-width:140px;max-width:260px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:7px;color:#fff;font-size:.9em;padding:5px 10px;outline:none; }
    #dm-grp-name:focus { border-color:rgba(124,106,247,.7); }
    #dm-grp-save { background:rgba(124,106,247,.25);border:1px solid rgba(124,106,247,.5);color:#fff;border-radius:7px;padding:5px 12px;cursor:pointer;font-size:.82em;font-weight:600; }
    #dm-grp-save:hover { background:rgba(124,106,247,.45); }
    #dm-grp-cancel { background:none;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.5);border-radius:7px;padding:5px 10px;cursor:pointer;font-size:.82em; }

    #dm-body { display:flex;flex:1;overflow:hidden; }
    #dm-list { flex:1;overflow-y:auto;padding:1.2em 3.5%;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.15) transparent; }
    #dm-list::-webkit-scrollbar { width:4px; }
    #dm-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,.18);border-radius:2px; }

    /* Normale Karte */
    .dm-card { background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;margin-bottom:9px;transition:background .2s,border-color .2s; }
    .dm-card:hover { background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.18); }
    .dm-card.blk { background:rgba(255,60,60,.07);border-color:rgba(255,80,80,.2); }
    .dm-card.ok  { border-color:rgba(100,255,160,.18); }
    .dm-card.sel     { border-color:rgba(124,106,247,.6)!important;background:rgba(124,106,247,.08)!important; }
    .dm-grp-card.sel { border-color:rgba(124,106,247,.7)!important;background:rgba(124,106,247,.12)!important; }
    .dm-card-inner { display:flex;align-items:center;gap:12px;padding:12px 16px; }

    /* Checkbox */
    .dm-chk-wrap { display:none;flex-shrink:0; }
    .dm-chk-wrap.show { display:flex; }
    .dm-chk { width:18px;height:18px;border-radius:5px;cursor:pointer;border:2px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);appearance:none;-webkit-appearance:none;transition:all .2s; }
    .dm-chk:checked { background:rgba(124,106,247,.8);border-color:rgba(124,106,247,1); }

    .dm-avatar { width:38px;height:38px;border-radius:50%;flex-shrink:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:17px; }
    .dm-info { flex:1;min-width:0; }
    .dm-dname { font-size:.9em;font-weight:500;color:rgba(255,255,255,.95);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .dm-dmeta { font-size:.74em;color:rgba(255,255,255,.38);margin-top:2px; }
    .dm-apps  { font-size:.71em;color:rgba(255,255,255,.25);margin-top:3px; }
    .dm-orig  { font-size:.7em;color:rgba(255,255,255,.28);margin-top:1px;font-style:italic; }
    .dm-live  { display:inline-block;width:7px;height:7px;border-radius:50%;background:#4ade80;margin-right:5px;animation:dm-p 1.5s ease-in-out infinite; }
    @keyframes dm-p { 0%,100%{opacity:1}50%{opacity:.2} }
    .dm-blkwarn { font-size:.7em;color:rgba(248,113,113,.8);margin-left:6px; }

    .dm-sb { padding:3px 10px;border-radius:20px;font-size:.72em;font-weight:500;flex-shrink:0; }
    .dm-sb.unknown  { background:rgba(251,191,36,.1); color:rgba(251,191,36,.9); border:1px solid rgba(251,191,36,.22); }
    .dm-sb.approved { background:rgba(74,222,128,.09);color:rgba(74,222,128,.9); border:1px solid rgba(74,222,128,.2); }
    .dm-sb.rejected { background:rgba(248,113,113,.09);color:rgba(248,113,113,.9);border:1px solid rgba(248,113,113,.2); }

    .dm-acts { display:flex;gap:5px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end; }
    .dm-btn { background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.75);border-radius:7px;padding:5px 10px;cursor:pointer;font-size:.75em;font-weight:500;transition:background .2s,color .2s; }
    .dm-btn:hover { background:rgba(255,255,255,.18);color:#fff; }
    .dm-btn.approve { background:rgba(74,222,128,.12);border-color:rgba(74,222,128,.28);color:rgba(74,222,128,.95); }
    .dm-btn.approve:hover { background:rgba(74,222,128,.25); }
    .dm-btn.reject  { background:rgba(248,113,113,.1);border-color:rgba(248,113,113,.25);color:rgba(248,113,113,.95); }
    .dm-btn.reject:hover  { background:rgba(248,113,113,.22); }
    .dm-btn.rename  { opacity:.55;padding:5px 8px; }
    .dm-btn.rename:hover { opacity:1; }

    /* Rename Inline */
    .dm-rename-row { display:none;align-items:center;gap:6px;padding:0 16px 10px 70px; }
    .dm-rename-row.open { display:flex; }
    .dm-rename-input { flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:7px;color:#fff;font-size:.82em;padding:5px 10px;outline:none;min-width:0; }
    .dm-rename-input:focus { border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.12); }
    .dm-rn-ok  { background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.3);color:rgba(74,222,128,.9);border-radius:7px;padding:5px 10px;cursor:pointer;font-size:.78em;white-space:nowrap; }
    .dm-rn-del { background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.45);border-radius:7px;padding:5px 10px;cursor:pointer;font-size:.78em;white-space:nowrap; }

    /* Gruppen-Karte */
    .dm-grp-card { background:rgba(124,106,247,.07);border:1px solid rgba(124,106,247,.22);border-radius:10px;margin-bottom:9px;overflow:hidden; }
    .dm-grp-head { display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid rgba(124,106,247,.12);font-size:.82em; }
    .dm-grp-head strong { color:rgba(124,106,247,.9);font-size:1em; }
    .dm-grp-info { color:rgba(255,255,255,.35);font-size:.85em; }
    .dm-grp-actions { margin-left:auto;display:flex;gap:6px; }
    .dm-grp-btn { background:none;border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.45);border-radius:6px;padding:3px 9px;cursor:pointer;font-size:.78em;transition:all .2s; }
    .dm-grp-btn:hover { border-color:rgba(255,255,255,.3);color:#fff; }
    .dm-grp-btn.danger:hover { border-color:rgba(248,113,113,.5);color:rgba(248,113,113,.9); }
    .dm-grp-rename-row { display:none;align-items:center;gap:6px;padding:8px 16px;border-bottom:1px solid rgba(124,106,247,.1);background:rgba(0,0,0,.1); }
    .dm-grp-rename-row.open { display:flex; }
    .dm-grp-children { padding:6px 10px 10px; display:flex;flex-direction:column;gap:6px; }
    .dm-grp-child { display:flex;align-items:center;gap:10px;padding:9px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:8px; }
    .dm-grp-child .dm-info { flex:1;min-width:0; }

    /* Log */
    #dm-log { width:185px;border-left:1px solid rgba(255,255,255,.07);background:rgba(0,0,0,.18);overflow-y:auto;flex-shrink:0;display:flex;flex-direction:column; }
    #dm-log h4 { margin:0;padding:10px 13px;font-size:.7em;font-weight:400;color:rgba(255,255,255,.28);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0; }
    .dm-le { padding:7px 11px;border-bottom:1px solid rgba(255,255,255,.04);font-size:.72em; }
    .dm-le-t { color:rgba(255,255,255,.22); } .dm-le-u { color:rgba(248,113,113,.75);font-weight:500;margin-top:1px; } .dm-le-d { color:rgba(255,255,255,.3); }
    .dm-le-empty { padding:14px 11px;font-size:.75em;color:rgba(255,255,255,.15);text-align:center;font-style:italic; }

    #dm-footer { display:flex;align-items:center;justify-content:space-between;padding:8px 3.5%;border-top:1px solid rgba(255,255,255,.07);background:rgba(0,0,0,.18);font-size:.78em;color:rgba(255,255,255,.28);flex-shrink:0; }
    #dm-reload { background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:rgba(255,255,255,.55);border-radius:7px;padding:4px 12px;cursor:pointer;font-size:.85em;transition:background .2s; }
    #dm-reload:hover { background:rgba(255,255,255,.16);color:#fff; }
    #dm-grp-toggle { background:rgba(124,106,247,.12);border:1px solid rgba(124,106,247,.3);color:rgba(124,106,247,.9);border-radius:7px;padding:4px 12px;cursor:pointer;font-size:.82em;transition:all .2s; }
    #dm-grp-toggle.active { background:rgba(124,106,247,.3);border-color:rgba(124,106,247,.6);color:#fff; }
    .dm-empty { padding:3em 0;text-align:center;color:rgba(255,255,255,.18);font-size:.88em;font-style:italic; }
    .dm-mine { font-size:.68em; color:rgba(99,179,237,.9); background:rgba(99,179,237,.1); border:1px solid rgba(99,179,237,.25); border-radius:10px; padding:2px 8px; margin-left:7px; vertical-align:middle; }

    /* Add-to-group dropdown */
    .dm-add-to-grp {
      position:relative; display:inline-block;
    }
    .dm-add-to-grp-btn {
      background:rgba(124,106,247,.12); border:1px solid rgba(124,106,247,.3);
      color:rgba(124,106,247,.9); border-radius:6px; padding:3px 9px;
      cursor:pointer; font-size:.78em; transition:all .2s;
    }
    .dm-add-to-grp-btn:hover { background:rgba(124,106,247,.28); }
    .dm-add-to-grp-menu {
      display:none; position:absolute; right:0; top:calc(100% + 4px);
      background:rgba(18,20,36,.98); border:1px solid rgba(124,106,247,.3);
      border-radius:8px; min-width:180px; z-index:9999;
      box-shadow:0 8px 24px rgba(0,0,0,.6); overflow:hidden;
    }
    .dm-add-to-grp-menu.open { display:block; }
    .dm-add-to-grp-item {
      padding:9px 14px; font-size:.82em; color:rgba(255,255,255,.75);
      cursor:pointer; border-bottom:1px solid rgba(255,255,255,.05);
      transition:background .15s; display:flex; align-items:center; gap:8px;
    }
    .dm-add-to-grp-item:last-child { border-bottom:none; }
    .dm-add-to-grp-item:hover { background:rgba(124,106,247,.2); color:#fff; }
    .dm-add-to-grp-empty { padding:10px 14px; font-size:.8em; color:rgba(255,255,255,.25); font-style:italic; }
  `;

  const injectCSS = () => {
    if (document.getElementById('dm-css')) return;
    const s = document.createElement('style'); s.id='dm-css'; s.textContent=CSS; document.head.appendChild(s);
  };

  // ── Daten ─────────────────────────────────────────────────────

  async function loadDeviceGroups() {
    const data  = await API.get('/Devices?userId=');
    const items = data.Items || [];
    const groups = {};

    for (const d of items) {
      // Gruppierung nach DeviceId — unabhängig vom Benutzer
      // Mehrere User auf demselben Gerät = ein Eintrag
      const deviceId = d.Id;
      const k = Store.key(deviceId);

      if (!groups[k]) {
        groups[k] = {
          key:      k,
          deviceId: deviceId,
          name:     d.Name || 'Unknown Device',
          users:    [],     // alle User die dieses Gerät nutzen
          userIds:  [],     // für Server-Status setzen
          icon:     getIcon(d.Name || ''),
          ids:      [deviceId],  // DeviceIds (hier gleich dem key)
          apps:     [],
          lastSeen: null,
          status:   Store.getStatus(k),
        };
      }

      // Benutzer hinzufügen falls noch nicht vorhanden
      const userName = d.LastUserName || '—';
      const userId   = d.LastUserId   || '';
      if (!groups[k].users.includes(userName)) groups[k].users.push(userName);
      if (userId && !groups[k].userIds.includes(userId)) groups[k].userIds.push(userId);
      // Mark as admin device if any user of this device is an admin
      if (adminUserIds.has(userId)) groups[k].isAdminDevice = true;

      // Apps
      const app = [d.AppName, d.AppVersion].filter(Boolean).join(' ');
      if (app && !groups[k].apps.includes(app)) groups[k].apps.push(app);

      // Letzter Zugriff
      const t = d.DateLastActivity ? new Date(d.DateLastActivity) : null;
      if (t && (!groups[k].lastSeen || t > groups[k].lastSeen)) groups[k].lastSeen = t;
    }

    return Object.values(groups).sort((a,b) =>
      ({unknown:0,rejected:1,approved:2}[a.status]??0) -
      ({unknown:0,rejected:1,approved:2}[b.status]??0)
    );
  }

  async function loadLive() {
    try { return new Set((await API.get('/Sessions')||[]).map(s=>s.DeviceId)); } catch { return new Set(); }
  }

  // ── Blockierung ───────────────────────────────────────────────

  let blockInterval = null;
  const blockLog = [];

  async function enforce() {
    if (!Store.blocking()) return;
    let sessions; try { sessions = await API.get('/Sessions'); } catch { return; }
    const myId = ApiClient.getCurrentUserId();

    // Alle bekannten DeviceIds der gespeicherten Geräte vorberechnen
    // Damit matchen wir direkt über DeviceId — kein String-Vergleich nötig
    const rejectedIds = new Set();
    const unknownIds  = new Set();
    for (const g of allDevGroups) {
      const st = Store.getStatus(g.key); // key = deviceId
      if (st === 'rejected') rejectedIds.add(g.deviceId);
      if (st === 'unknown')  unknownIds.add(g.deviceId);
    }

    for (const s of sessions) {
      // Never block any admin user
      if (adminUserIds.has(s.UserId)) continue;
      if (s.UserId === myId) continue; // fallback if adminUserIds not loaded yet
      const did   = s.DeviceId || '';
      const isRej = rejectedIds.has(did);
      const isUnk = unknownIds.has(did) && Store.blockUnknown();
      if (!isRej && !isUnk) continue;

      const text = isRej
        ? 'This device has been blocked by the administrator.'
        : 'This device is not yet approved. Please contact the administrator.';

      try {
        // 1. Nachricht senden
        await API.post(`/Sessions/${s.Id}/Message`, {
          Header: 'Zugang verweigert', Text: text, TimeoutMs: 10000,
        });
      } catch { /* ignore */ }

      // 2. Session nach kurzer Verzögerung terminieren
      setTimeout(async () => {
        try { await API.delete(`/Sessions/${s.Id}`); } catch { /* ignore */ }
      }, 1500);

      // 3. Wiederholt terminieren falls Client reconnectet
      setTimeout(async () => {
        try { await API.delete(`/Sessions/${s.Id}`); } catch { /* ignore */ }
      }, 5000);

      blockLog.unshift({
        time:   new Date().toLocaleTimeString('de-DE'),
        user:   s.UserName   || '—',
        device: s.DeviceName || '?',
      });
      if (blockLog.length > 30) blockLog.pop();
    }
    renderLog(); updateBadge();
  }

  // ── Server-seitiger Status via DisplayPreferences ────────────
  // Speichert Approval-Status auf dem Jellyfin-Server pro User
  // Dadurch sehen User ihren Status ohne Admin-localStorage

  const DM_PREF_ID = 'devicemanager';
  const DM_CLIENT  = 'devicemanager';

  async function setServerStatus(userId, status) {
    if (!userId) return;
    try {
      // Erst aktuelle Prefs laden
      let prefs = { Id: DM_PREF_ID, CustomPrefs: {} };
      try {
        prefs = await API.get(`/DisplayPreferences/${DM_PREF_ID}?userId=${userId}&client=${DM_CLIENT}`);
        if (!prefs.CustomPrefs) prefs.CustomPrefs = {};
      } catch { /* neue prefs */ }
      prefs.CustomPrefs.dm_status = status;
      await API.post(`/DisplayPreferences/${DM_PREF_ID}?userId=${userId}&client=${DM_CLIENT}`, prefs);
    } catch (e) { console.warn('[DM] setServerStatus failed:', e); }
  }

  async function getServerStatus(userId) {
    if (!userId) return null;
    try {
      const prefs = await API.get(`/DisplayPreferences/${DM_PREF_ID}?userId=${userId}&client=${DM_CLIENT}`);
      return prefs?.CustomPrefs?.dm_status || null;
    } catch { return null; }
  }

  const startBlocking = () => { if (!blockInterval) { enforce(); blockInterval=setInterval(enforce,8000); } };
  const stopBlocking  = () => { clearInterval(blockInterval); blockInterval=null; };

  // ── Aktionen ─────────────────────────────────────────────────

  async function doAction(action, group) {
    switch(action) {
      case 'approve':
        Store.setStatus(group.key,'approved');
        // Für ALLE User dieses Geräts freigeben
        await Promise.all((group.userIds||[]).map(uid => setServerStatus(uid, 'approved')));
        break;
      case 'reject':
        Store.setStatus(group.key,'rejected');
        // Für ALLE User dieses Geräts sperren
        await Promise.all((group.userIds||[]).map(uid => setServerStatus(uid, 'rejected')));
        await kickGroup(group);
        break;
      case 'reset':
        Store.setStatus(group.key,'unknown');
        await Promise.all((group.userIds||[]).map(uid => setServerStatus(uid, 'pending')));
        break;
      case 'delete':
        if (!confirm(`Delete all entries for "${Store.getAlias(group.key)||group.name}"?`)) return;
        await Promise.all(group.ids.map(id=>API.delete(`/Devices?id=${id}`)));
        break;
    }
  }

  async function kickGroup(group) {
    try {
      const sessions = await API.get('/Sessions');
      for (const s of sessions) {
        if (!group.ids.includes(s.DeviceId)) continue;
        try {
          await API.post(`/Sessions/${s.Id}/Message`, {
            Header: 'Zugang verweigert',
            Text:   'This device has been blocked by the administrator.',
            TimeoutMs: 10000,
          });
        } catch { /* ignore */ }
        setTimeout(async () => { try { await API.delete(`/Sessions/${s.Id}`); } catch {} }, 1500);
        setTimeout(async () => { try { await API.delete(`/Sessions/${s.Id}`); } catch {} }, 5000);
      }
    } catch { /* ignore */ }
  }

  // ── State ─────────────────────────────────────────────────────

  let allDevGroups = [], liveSessions = new Set(), groupMode = false, myDeviceId = '';
  let adminUserIds = new Set(); // all admin user IDs — never blocked

  // ── Render ────────────────────────────────────────────────────

  function renderAll(filter='all') {
    const list = document.getElementById('dm-list');
    const cnt  = document.getElementById('dm-count');
    if (!list) return;

    const customGroups = Store.getGroups();
    const usedKeys = new Set(Object.values(customGroups).flatMap(cg=>cg.keys));
    const blocking = Store.blocking(), blkUnk = Store.blockUnknown();

    let html = '';

    // ── Custom Gruppen ────────────────────────────────────────
    Object.entries(customGroups).forEach(([gid, cg]) => {
      const members = allDevGroups.filter(g=>cg.keys.includes(g.key));
      if (!members.length) { Store.delGroup(gid); return; }
      // Filter: only show group if at least one member matches
      if (filter !== 'all' && !members.some(m => m.status === filter)) return;
      const isLiveAny = members.some(m=>m.ids.some(id=>liveSessions.has(id)));
      const gAlias = cg.name;

      html += `<div class="dm-grp-card" data-gid="${gid}">
        <div class="dm-grp-head">
          <div class="dm-chk-wrap ${groupMode?'show':''}">
            <input type="checkbox" class="dm-chk dm-grp-chk" data-gid="${gid}">
          </div>
          <span>📦</span>
          <strong>${gAlias}</strong>
          <span class="dm-grp-info">${members.length} Geräte${isLiveAny?' · <span class="dm-live"></span>' + 'online':''}</span>
          <div class="dm-grp-actions">
            <button class="dm-grp-btn" data-ga="rename-grp">✏️ Rename</button>
            <button class="dm-grp-btn danger" data-ga="ungroup">↩ Ungroup</button>
          </div>
        </div>
        <div class="dm-grp-rename-row" id="grn-${gid}">
          <input class="dm-rename-input" placeholder="Group name…" value="${gAlias}">
          <button class="dm-rn-ok">✔ Save</button>
        </div>
        <div class="dm-grp-children">`;

      members.forEach(g => {
        const alias = Store.getAlias(g.key);
        const dispName = alias || g.name;
        const last = g.lastSeen ? g.lastSeen.toLocaleString('de-DE') : '—';
        const btxt = {unknown:'⚠ Unknown',approved:'✓ Approved',rejected:'✕ Rejected'}[g.status];
        const isLive = g.ids.some(id=>liveSessions.has(id));
        html += `<div class="dm-grp-child" data-key="${encodeURIComponent(g.key)}">
          <div class="dm-avatar" style="width:32px;height:32px;font-size:14px">${g.icon}</div>
          <div class="dm-info">
            <div class="dm-dname" style="font-size:.85em">${isLive?'<span class="dm-live"></span>':''}${dispName}</div>
            ${alias?'<div class="dm-orig">'+'🔤'+' '+g.name+'</div>':''}
            <div class="dm-dmeta">👤 ${g.users.join(', ')} · 🕐 ${last}</div>
          </div>
          <span class="dm-sb ${g.status}" style="font-size:.68em">${btxt}</span>
          <div class="dm-acts">
            ${g.status!=='approved'?'<button class="dm-btn approve" data-a="approve">✔</button>':''}

            ${g.status!=='rejected'?`<button class="dm-btn reject"  data-a="reject">✕</button>`:''}
            ${g.status!=='unknown' ?`<button class="dm-btn"         data-a="reset">↩</button>`:''}
            <button class="dm-btn rename" data-a="rename-child" title="Umbenennen">✏️</button>
            <button class="dm-grp-btn danger" data-ga="remove-from-grp" data-gid="${gid}" data-key="${g.key}" title="Remove from group" style="font-size:.72em;padding:3px 7px">✕</button>
          </div>
        </div>
        <div class="dm-rename-row" id="rn-${encodeURIComponent(g.key)}">
          <input class="dm-rename-input" placeholder="Custom name…" value="${alias}">
          <button class="dm-rn-ok">✔ Save</button>
          ${alias?'<button class="dm-rn-del">'+'✕ Reset'+'</button>':''}
        </div>`;
      });
      html += `</div></div>`;
    });

    // ── Einzelne Geräte (nicht in Gruppe) ─────────────────────
    const visible = filter==='all'
      ? allDevGroups.filter(g=>!usedKeys.has(g.key))
      : allDevGroups.filter(g=>!usedKeys.has(g.key) && g.status===filter);

    if (cnt) cnt.textContent = `${Object.keys(customGroups).length + visible.length} entries`;

    html += visible.map(g => {
      const isLive  = g.ids.some(id=>liveSessions.has(id));
      const effectiveStatus = g.isAdminDevice ? 'approved' : g.status;
      const willBlk = !g.isAdminDevice && blocking&&(g.status==='rejected'||(g.status==='unknown'&&blkUnk));
      const last    = g.lastSeen ? g.lastSeen.toLocaleString('de-DE') : '—';
      const btxt    = {unknown:'⚠ Unknown',approved:'✓ Approved',rejected:'✕ Rejected'}[effectiveStatus];
      const alias   = Store.getAlias(g.key);
      const dispName= alias || g.name;
      return `
        <div class="dm-card ${willBlk?'blk':''} ${effectiveStatus==='approved'?'ok':''}" data-key="${encodeURIComponent(g.key)}">
          <div class="dm-card-inner">
            <div class="dm-chk-wrap ${groupMode?'show':''}">
              <input type="checkbox" class="dm-chk" data-key="${encodeURIComponent(g.key)}">
            </div>
            <div class="dm-avatar">${g.icon}</div>
            <div class="dm-info">
              <div class="dm-dname">${isLive?'<span class="dm-live"></span>':''}${dispName}${g.isAdminDevice?'<span class="dm-mine">👑 Admin</span>':''}${willBlk&&isLive?'<span class="dm-blkwarn">⛔ blocked</span>':''}</div>
              ${alias?'<div class="dm-orig">'+'🔤'+' '+g.name+'</div>':''}
              <div class="dm-dmeta">👤 ${g.users.join(', ')} · 🕐 ${last}</div>
              <div class="dm-apps">📦 ${g.apps.join(' · ')||'—'}</div>
            </div>
            <span class="dm-sb ${effectiveStatus}">${btxt}</span>
            <div class="dm-acts">
              ${!g.isAdminDevice && g.status!=='approved'?`<button class="dm-btn approve" data-a="approve">✔ Approve</button>`:''}
              ${!g.isAdminDevice && g.status!=='rejected'?`<button class="dm-btn reject"  data-a="reject">✕ Reject</button>`:''}
              ${!g.isAdminDevice && g.status!=='unknown' ?`<button class="dm-btn"         data-a="reset">↩</button>`:''}
              <button class="dm-btn rename" data-a="rename" title="Umbenennen">✏️</button>
              <button class="dm-btn" data-a="delete">🗑</button>
            </div>
          </div>
          <div class="dm-rename-row" id="rn-${encodeURIComponent(g.key)}">
            <input class="dm-rename-input" placeholder="Custom name…" value="${alias}">
            <button class="dm-rn-ok">✔ Save</button>
            ${alias?'<button class="dm-rn-del">'+'✕ Reset'+'</button>':''}
          </div>
        </div>`;
    }).join('');

    if (!html) html = `<div class="dm-empty">Keine Geräte.</div>`;
    list.innerHTML = html;
    wireEvents();
  }

  function wireEvents() {
    const list = document.getElementById('dm-list');
    if (!list) return;

    // Gruppen-Kopf Aktionen
    list.querySelectorAll('[data-ga]').forEach(btn=>btn.addEventListener('click', e=>{
      e.stopPropagation();
      const card = btn.closest('[data-gid]');
      const gid  = card.dataset.gid;
      if (btn.dataset.ga === 'ungroup') {
        if (!confirm('Dissolve group? Devices will appear individually again.')) return;
        Store.delGroup(gid);
        renderAll(document.querySelector('.dm-tab.active')?.dataset.f||'all');
      }
      if (btn.dataset.ga === 'rename-grp') {
        const row = document.getElementById(`grn-${gid}`);
        row.classList.toggle('open');
        if (row.classList.contains('open')) row.querySelector('input').focus();
      }
    }));

    // Gruppen umbenennen speichern
    list.querySelectorAll('.dm-grp-rename-row .dm-rn-ok').forEach(btn=>btn.addEventListener('click', e=>{
      e.stopPropagation();
      const row = btn.closest('.dm-grp-rename-row');
      const gid = row.id.replace('grn-','');
      const val = row.querySelector('input').value.trim();
      if (val) { Store.renameGroup(gid, val); renderAll(document.querySelector('.dm-tab.active')?.dataset.f||'all'); }
    }));

    // Kind-Aktionen in Gruppe
    list.querySelectorAll('.dm-grp-child [data-a]').forEach(btn=>btn.addEventListener('click', async e=>{
      e.stopPropagation();
      const child = btn.closest('[data-key]');
      const key   = decodeURIComponent(child.dataset.key);
      const group = allDevGroups.find(g=>g.key===key);
      if (!group) return;
      if (btn.dataset.a === 'rename-child') {
        const row = document.getElementById(`rn-${encodeURIComponent(key)}`);
        row?.classList.toggle('open');
        if (row?.classList.contains('open')) row.querySelector('input').focus();
        return;
      }
      await doAction(btn.dataset.a, group);
      renderAll(document.querySelector('.dm-tab.active')?.dataset.f||'all');
    }));

    // Normale Karten Aktionen
    list.querySelectorAll('.dm-card [data-a]').forEach(btn=>btn.addEventListener('click', async e=>{
      e.stopPropagation();
      const card  = btn.closest('[data-key]');
      const key   = decodeURIComponent(card.dataset.key);
      const group = allDevGroups.find(g=>g.key===key);
      if (!group) return;
      if (btn.dataset.a === 'rename') {
        const row = document.getElementById(`rn-${encodeURIComponent(key)}`);
        row?.classList.toggle('open');
        if (row?.classList.contains('open')) row.querySelector('input').focus();
        return;
      }
      await doAction(btn.dataset.a, group);
      await refresh();
    }));

    // Also: remove device from group button in group children
    list.querySelectorAll('[data-ga="remove-from-grp"]').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      const gid    = btn.dataset.gid;
      const devKey = btn.dataset.key;
      const grp    = Store.getGroups()[gid];
      if (!grp) return;
      const newKeys = grp.keys.filter(k => k !== devKey);
      if (newKeys.length === 0) Store.delGroup(gid);
      else Store.saveGroup(gid, grp.name, newKeys);
      renderAll(document.querySelector('.dm-tab.active')?.dataset.f || 'all');
    }));

    // Rename speichern (alle)
    list.querySelectorAll('.dm-rename-row .dm-rn-ok').forEach(btn=>btn.addEventListener('click', e=>{
      e.stopPropagation();
      const row = btn.closest('.dm-rename-row');
      const key = decodeURIComponent(row.id.replace('rn-',''));
      const val = row.querySelector('input').value.trim();
      if (val) Store.setAlias(key, val); else Store.delAlias(key);
      renderAll(document.querySelector('.dm-tab.active')?.dataset.f||'all');
    }));

    list.querySelectorAll('.dm-rn-del').forEach(btn=>btn.addEventListener('click', e=>{
      e.stopPropagation();
      const row = btn.closest('.dm-rename-row');
      const key = decodeURIComponent(row.id.replace('rn-',''));
      Store.delAlias(key);
      renderAll(document.querySelector('.dm-tab.active')?.dataset.f||'all');
    }));

    // Enter/Escape in Inputs
    list.querySelectorAll('.dm-rename-input').forEach(inp=>inp.addEventListener('keydown', e=>{
      if (e.key==='Enter')  inp.closest('[class*="rename-row"]').querySelector('.dm-rn-ok').click();
      if (e.key==='Escape') inp.closest('[class*="rename-row"]').classList.remove('open');
    }));

    // Checkboxen (Geräte + Gruppen)
    list.querySelectorAll('.dm-chk').forEach(cb => cb.addEventListener('change', () => {
      // Highlight selected card
      const card = cb.closest('.dm-card, .dm-grp-card');
      if (card) card.classList.toggle('sel', cb.checked);

      const devSel = list.querySelectorAll('.dm-card .dm-chk:checked').length;
      const grpSel = list.querySelectorAll('.dm-grp-chk:checked').length;
      const total  = devSel + grpSel;

      const bar  = document.getElementById('dm-grp-bar');
      const cnt  = document.getElementById('dm-grp-count');
      const inp  = document.getElementById('dm-grp-name');
      const save = document.getElementById('dm-grp-save');

      if (cnt) cnt.textContent = `${total} selected`;

      // Wenn eine Gruppe + mind. 1 Gerät: "Zu Gruppe hinzufügen"
      // Wenn nur Geräte: "Neue Gruppe erstellen" (braucht Namen)
      if (grpSel === 1 && devSel >= 1) {
        if (inp)  { inp.style.display = 'none'; }
        if (save) { save.textContent = '📦 Add to Group'; }
      } else {
        if (inp)  { inp.style.display = ''; }
        if (save) { save.textContent = '✔ Create Group'; }
      }

      if (bar) bar.classList.toggle('open', total >= 1);
    }));
  }

  function renderLog() {
    const el = document.getElementById('dm-log-entries');
    if (!el) return;
    el.innerHTML = blockLog.length
      ? blockLog.map(e=>`<div class="dm-le"><div class="dm-le-t">${e.time}</div><div class="dm-le-u">🚫 ${e.user}</div><div class="dm-le-d">${e.device}</div></div>`).join('')
      : `<div class="dm-le-empty">Nothing yet.</div>`;
  }

  async function refresh() {
    const list = document.getElementById('dm-list');
    if (list) list.innerHTML = `<div class="dm-empty" style="opacity:.4">⏳ Loading…</div>`;
    [allDevGroups, liveSessions] = await Promise.all([loadDeviceGroups(), loadLive()]);
    renderAll(document.querySelector('.dm-tab.active')?.dataset.f||'all');
    updateBadge();
  }

  function updateBadge() {
    const b = document.getElementById('dm-badge');
    if (!b) return;
    const n = allDevGroups.filter(g=>g.status==='unknown').length;
    b.textContent = n; b.style.display = n>0?'inline':'none';
  }

  // ── Overlay ───────────────────────────────────────────────────

  const escHandler = e => { if(e.key==='Escape') closeDM(); };
  const closeDM = () => { document.removeEventListener('keydown', escHandler); document.getElementById('dm-overlay')?.remove(); };

  function buildOverlay() {
    const el = document.createElement('div'); el.id='dm-overlay';
    el.innerHTML = `
      <div id="dm-header">
        <div id="dm-title">${ICON_DEVICE} Device Manager</div>
        <div id="dm-tabs">
          <button class="dm-tab active" data-f="all">All</button>
          <button class="dm-tab" data-f="unknown">⚠ Unknown</button>
          <button class="dm-tab" data-f="approved">✓ Approved</button>
          <button class="dm-tab" data-f="rejected">✕ Rejected</button>
        </div>
        <button id="dm-close">✕</button>
      </div>
      <div id="dm-block-bar">
        <span class="dm-pulse" id="dm-dot"></span>
        <label class="dm-tgl-wrap">
          <label class="dm-tgl"><input type="checkbox" id="dm-tb"><span class="dm-slid"></span></label>
          Auto-Block
        </label>
        <label class="dm-tgl-wrap" id="dm-uw" style="opacity:.4;pointer-events:none">
          <label class="dm-tgl"><input type="checkbox" id="dm-tu"><span class="dm-slid"></span></label>
          Block unknown
        </label>
        <span style="margin-left:auto;font-size:.78em;opacity:.3">every 8 sec.</span>
      </div>
      <div id="dm-grp-bar">
        <span>📦</span>
        <span id="dm-grp-count">0 selected</span>
        <input id="dm-grp-name" placeholder='Enter group name…' maxlength="40">
        <button id="dm-grp-save">✔ Create Group</button>
        <button id="dm-grp-cancel">Cancel</button>
      </div>
      <div id="dm-body">
        <div id="dm-list"><div class="dm-empty" style="opacity:.4">⏳ Loading…</div></div>
        <div id="dm-log"><h4>🛡 Block Log</h4><div id="dm-log-entries"><div class="dm-le-empty">Nothing yet.</div></div></div>
      </div>
      <div id="dm-footer">
        <span id="dm-count"></span>
        <div style="display:flex;gap:8px">
          <button id="dm-grp-toggle">📦 Group</button>
          <button id="dm-reload">🔄 Refresh</button>
        </div>
      </div>`;
    document.body.appendChild(el);

    el.addEventListener('click', e=>{ if(e.target===el) closeDM(); });
    el.querySelector('#dm-close').onclick = closeDM;
    document.addEventListener('keydown', escHandler);

    el.querySelectorAll('.dm-tab').forEach(t=>t.addEventListener('click',()=>{
      el.querySelectorAll('.dm-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      renderAll(t.dataset.f);
    }));

    el.querySelector('#dm-reload').onclick = refresh;

    // Blockierung
    const tb=el.querySelector('#dm-tb'), tu=el.querySelector('#dm-tu'), uw=el.querySelector('#dm-uw');
    tb.checked=Store.blocking(); tu.checked=Store.blockUnknown(); syncUI();
    tb.addEventListener('change',()=>{ Store.setBlocking(tb.checked); tb.checked?startBlocking():stopBlocking(); syncUI(); });
    tu.addEventListener('change',()=>Store.setBlockUnknown(tu.checked));
    function syncUI() {
      const on=Store.blocking(); uw.style.opacity=on?'1':'.4'; uw.style.pointerEvents=on?'auto':'none';
      const dot=document.getElementById('dm-dot'); if(dot) dot.className='dm-pulse'+(on?' on':'');
    }

    // Gruppier-Modus
    const grpToggle = el.querySelector('#dm-grp-toggle');
    const grpBar    = el.querySelector('#dm-grp-bar');
    const grpName   = el.querySelector('#dm-grp-name');
    const grpSave   = el.querySelector('#dm-grp-save');
    const grpCancel = el.querySelector('#dm-grp-cancel');

    grpToggle.addEventListener('click', ()=>{
      groupMode = !groupMode;
      grpToggle.classList.toggle('active', groupMode);
      grpToggle.textContent = groupMode ? '✕ Done' : '📦 Group';
      if (!groupMode) { grpBar.classList.remove('open'); grpName.value=''; }
      renderAll(document.querySelector('.dm-tab.active')?.dataset.f||'all');
    });

    grpSave.addEventListener('click', ()=>{
      const devKeys  = [...el.querySelectorAll('.dm-card .dm-chk:checked')].map(cb=>decodeURIComponent(cb.dataset.key));
      const grpChk   = el.querySelector('.dm-grp-chk:checked');

      if (grpChk && devKeys.length >= 1) {
        // → Geräte zu bestehender Gruppe hinzufügen
        const gid = grpChk.dataset.gid;
        const grp = Store.getGroups()[gid];
        if (grp) {
          const newKeys = [...new Set([...grp.keys, ...devKeys])];
          Store.saveGroup(gid, grp.name, newKeys);
        }
      } else {
        // → Neue Gruppe erstellen
        const name = grpName.value.trim();
        if (!name) { grpName.focus(); return; }
        const allKeys = [...el.querySelectorAll('.dm-chk:checked')].map(cb=>decodeURIComponent(cb.dataset.key));
        if (!allKeys.length) return;
        Store.saveGroup('g_'+Date.now(), name, allKeys);
      }

      groupMode=false; grpToggle.classList.remove('active'); grpToggle.textContent='📦 Group';
      grpBar.classList.remove('open'); grpName.value=''; grpName.style.display='';
      renderAll(document.querySelector('.dm-tab.active')?.dataset.f||'all');
    });

    grpName.addEventListener('keydown', e=>{ if(e.key==='Enter') grpSave.click(); });
    grpCancel.addEventListener('click', ()=>{
      el.querySelectorAll('.dm-chk').forEach(cb=>{ cb.checked=false; cb.closest('.dm-card, .dm-grp-card')?.classList.remove('sel'); });
      grpBar.classList.remove('open'); grpName.value=''; grpName.style.display='';
      if (grpSave) grpSave.textContent='✔ Create Group';
    });
  }

  const openDM = () => {
    if (document.getElementById('dm-overlay')) { closeDM(); return; }
    buildOverlay(); refresh();
  };

  // ── Sidebar ───────────────────────────────────────────────────

  function addSidebarButton() {
    if (document.getElementById('dm-sidebar-btn')) return true;
    const existing = document.querySelector('.navMenuOption')||document.querySelector('[is="emby-button"].navMenuOption')||document.querySelector('a.navMenuOption');
    const container = existing?.parentElement||document.querySelector('.adminDrawer .scrollY')||document.querySelector('[data-role="panel"] .scrollY')||document.querySelector('.mainDrawer-scrollContainer');
    if (!container) return false;
    const btn = document.createElement('button'); btn.id='dm-sidebar-btn';
    if (existing) btn.className=existing.className;
    btn.innerHTML=`${ICON_DEVICE}<span class="dm-label">Device Manager</span><span id="dm-badge"></span>`;
    btn.onclick=openDM; container.appendChild(btn); return true;
  }

  function getIcon(name) {
    const n=name.toLowerCase();
    if (n.includes('iphone')||n.includes('android')||n.includes('phone')) return '📱';
    if (n.includes('ipad')||n.includes('tablet'))  return '📲';
    if (n.includes('tv')||n.includes('roku')||n.includes('fire')||n.includes('whale')) return '📺';
    if (n.includes('mac')||n.includes('windows')||n.includes('linux')) return '💻';
    return '🖥️';
  }

  async function loadAdminIds() {
    try {
      const users = await API.get('/Users');
      adminUserIds = new Set(
        (users || []).filter(u => u.Policy?.IsAdministrator).map(u => u.Id)
      );
    } catch { /* ignore — fallback to only skipping current user */ }
  }

  async function init() {
    try { if (!(await API.get('/Users/Me'))?.Policy?.IsAdministrator) return; } catch { return; }
    injectCSS();
    await loadAdminIds(); // load all admin IDs before blocking starts
    if (Store.blocking()) startBlocking();
    let tries=0;
    const t=setInterval(()=>{ if(addSidebarButton()||++tries>40){ clearInterval(t); loadDeviceGroups().then(g=>{ allDevGroups=g; updateBadge(); }); } }, 500);
    document.addEventListener('keydown', e=>{ if(e.ctrlKey&&e.shiftKey&&e.key==='D') openDM(); });
  }

  setInterval(()=>{ if(typeof ApiClient!=='undefined') injectCSS(); }, 400);
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 1500);
})();

/* ══════════════════════════════════════════════════════════
   WAITING FOR APPROVAL – Server-seitig via DisplayPreferences
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const WAIT_CSS = `
    #dm-wait {
      position:fixed; inset:0; z-index:999998; background:#000;
      display:none; flex-direction:column;
      align-items:center; justify-content:center;
      gap:28px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    #dm-wait.show { display:flex; }
    #dm-wait-icon {
      width:80px; height:80px; border-radius:50%;
      background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);
      display:flex; align-items:center; justify-content:center;
      animation:dm-w-pulse 2.5s ease-in-out infinite;
    }
    @keyframes dm-w-pulse {
      0%,100% { box-shadow:0 0 0 0 rgba(255,255,255,.08); }
      50%      { box-shadow:0 0 0 20px rgba(255,255,255,0); }
    }
    #dm-wait-title { font-size:1.6em; font-weight:300; letter-spacing:.04em; color:rgba(255,255,255,.9); text-align:center; }
    #dm-wait-sub   { font-size:.9em; color:rgba(255,255,255,.35); text-align:center; max-width:340px; line-height:1.7; }
    #dm-wait-status{ font-size:.75em; color:rgba(255,255,255,.18); letter-spacing:.06em; text-transform:uppercase; }
    #dm-wait-dots span {
      display:inline-block; width:6px; height:6px; border-radius:50%;
      background:rgba(255,255,255,.25); margin:0 3px;
      animation:dm-w-dot 1.4s ease-in-out infinite;
    }
    #dm-wait-dots span:nth-child(2){animation-delay:.2s;}
    #dm-wait-dots span:nth-child(3){animation-delay:.4s;}
    @keyframes dm-w-dot{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
    #dm-wait-rejected {
      font-size:.82em; color:rgba(248,113,113,.7);
      background:rgba(248,113,113,.08); border:1px solid rgba(248,113,113,.2);
      border-radius:8px; padding:10px 20px; display:none;
    }
    #dm-wait-rejected.show { display:block; }
  `;

  const ICON_LOCK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="white">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  </svg>`;

  let pollTimer = null;

  function buildWait() {
    if (document.getElementById('dm-wait')) return;
    const s = document.createElement('style'); s.textContent = WAIT_CSS; document.head.appendChild(s);
    const el = document.createElement('div'); el.id = 'dm-wait';
    el.innerHTML = `
      <div id="dm-wait-icon">${ICON_LOCK}</div>
      <div id="dm-wait-title">Waiting for Approval</div>
      <div id="dm-wait-sub">Your device has not been authorized yet.<br>Please contact the administrator.</div>
      <div id="dm-wait-dots"><span></span><span></span><span></span></div>
      <div id="dm-wait-rejected">Access denied. Your device has been rejected by the administrator.</div>
      <div id="dm-wait-status">Checking every 10 seconds…</div>
    `;
    document.body.appendChild(el);
  }

  function showWait(rejected) {
    buildWait();
    document.getElementById('dm-wait').classList.add('show');
    const r = document.getElementById('dm-wait-rejected');
    if (r) r.classList.toggle('show', !!rejected);
    // Jellyfin UI ausblenden
    ['reactRoot','app'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.visibility='hidden'; });
    document.querySelectorAll('.mainAnimatedPages,.skinBody').forEach(el=>el.style.visibility='hidden');
  }

  function hideWait() {
    document.getElementById('dm-wait')?.classList.remove('show');
    ['reactRoot','app'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.visibility=''; });
    document.querySelectorAll('.mainAnimatedPages,.skinBody').forEach(el=>el.style.visibility='');
    if (pollTimer) { clearInterval(pollTimer); pollTimer=null; }
  }

  async function getMyStatus(userId, token) {
    try {
      const resp = await fetch(
        `${location.origin}/DisplayPreferences/devicemanager?userId=${userId}&client=devicemanager`,
        { headers: { 'Authorization': `MediaBrowser Token="${token}"` } }
      );
      if (!resp.ok) return null;
      const data = await resp.json();
      return data?.CustomPrefs?.dm_status || null;
    } catch { return null; }
  }

  async function init() {
    // Warten bis ApiClient bereit
    const ac = window.ApiClient;
    if (!ac) return;
    const token  = (ac.accessToken && ac.accessToken()) || ac._token;
    const userId = (ac.getCurrentUserId && ac.getCurrentUserId()) || ac._currentUserId;
    if (!token || !userId) return;

    // Admin-Check
    try {
      const me = await fetch(`${location.origin}/Users/Me`, {
        headers: { 'Authorization': `MediaBrowser Token="${token}"` }
      }).then(r=>r.json());
      if (me?.Policy?.IsAdministrator) return; // Admins nie
    } catch { return; }

    // Status vom Server lesen (per userId — wird vom Admin pro User gesetzt)
    const status = await getMyStatus(userId, token);

    if (status === 'approved') {
      return; // Bereits freigegeben – kein Screen, kein Polling
    }

    if (status === 'rejected') {
      // Abgelehnt → statischer Screen, kein Polling
      showWait(true);
      return;
    }

    // Erstes Mal / unbekannt → Waiting-Screen + alle 10 Sek. prüfen
    showWait(false);

    pollTimer = setInterval(async () => {
      const newToken  = (ac.accessToken && ac.accessToken()) || ac._token;
      const newUserId = (ac.getCurrentUserId && ac.getCurrentUserId()) || ac._currentUserId;
      if (!newToken || !newUserId) return;

      const newStatus = await getMyStatus(newUserId, newToken);
      if (newStatus === 'approved') {
        hideWait(); // Poll stoppt automatisch in hideWait()
      }
      // rejected oder pending → Screen bleibt, weiter warten
    }, 10000);
  }

  // Start: warten bis Jellyfin + Login fertig
  const t = setInterval(() => {
    const ac = window.ApiClient;
    if (!ac) return;
    const token  = (ac.accessToken && ac.accessToken()) || ac._token;
    const userId = (ac.getCurrentUserId && ac.getCurrentUserId()) || ac._currentUserId;
    if (!token || !userId) return;
    clearInterval(t);
    setTimeout(init, 1500);
  }, 500);

  // Bei Seitenwechsel neu prüfen (Jellyfin-Navigation)
  window.addEventListener('hashchange', () => {
    const ac = window.ApiClient;
    if (!ac) return;
    const token  = (ac.accessToken && ac.accessToken()) || ac._token;
    const userId = (ac.getCurrentUserId && ac.getCurrentUserId()) || ac._currentUserId;
    if (token && userId) setTimeout(init, 800);
  });

})();
