/* ════════════════════════════════════════════════════════════
   4) FREUNDE-BUTTON → in Pill einfügen
   ════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  var FRIENDS_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.87)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/><circle cx="12" cy="10" r="2.5"/><path d="M8 19c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>';

  function openFriendsOverlay() {
    var ovId = 'jf-friends-ov';
    var existing = document.getElementById(ovId);
    if (existing) { existing.remove(); return; }
    var ac = window.ApiClient; if (!ac) return;
    var token = ac._token || (ac.accessToken && ac.accessToken());
    var serverUrl = (ac._serverAddress || ac._serverUrl || '').replace(/\/$/, '');
    var myId = ac._currentUserId || (ac.getCurrentUserId && ac.getCurrentUserId());
    function ah() { return { 'X-Emby-Token': token }; }
    function ini(n) { if(!n)return'?'; var p=n.trim().split(/\s+/); return p.length>1?(p[0][0]+p[p.length-1][0]).toUpperCase():n.substring(0,2).toUpperCase(); }
    function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    var ov = document.createElement('div');
    ov.id = ovId;
    ov.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.55);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden;';
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.1);flex-shrink:0;background:rgba(0,0,0,.2);';
    hdr.innerHTML = FRIENDS_SVG + '<span style="font-size:1.05em;font-weight:300;color:rgba(255,255,255,.92);letter-spacing:.03em;flex:1;">Freunde</span><button id="jf-friends-close" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.8);border-radius:50%;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.9em;">✕</button>';
    ov.appendChild(hdr);
    var body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow-y:auto;padding:14px 18px 24px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent;';
    body.innerHTML = '<div style="padding:3em;text-align:center;color:rgba(255,255,255,.3);font-size:.85em;">Lade…</div>';
    ov.appendChild(body);
    document.body.appendChild(ov);
    function closeIt() { ov.remove(); document.removeEventListener('keydown', escFr); }
    function escFr(e) { if (e.key === 'Escape') closeIt(); }
    document.getElementById('jf-friends-close').addEventListener('click', closeIt);
    document.addEventListener('keydown', escFr);
    Promise.all([
      fetch(serverUrl+'/Users', {headers:ah()}).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];}),
      fetch(serverUrl+'/Sessions', {headers:ah()}).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];})
    ]).then(function(res) {
      var users = res[0]||[], sessions = res[1]||[];
      var sessionMap = {};
      sessions.forEach(function(s){ if(s.UserId) sessionMap[s.UserId]=s; });
      body.innerHTML = '';
      if (!users.length) { body.innerHTML='<div style="padding:2em;text-align:center;color:rgba(255,255,255,.25);font-size:.82em;font-style:italic;">Keine Benutzer gefunden.</div>'; return; }
      var online=users.filter(function(u){var s=sessionMap[u.Id];return s&&s.NowPlayingItem;});
      var idle=users.filter(function(u){var s=sessionMap[u.Id];return s&&!s.NowPlayingItem;});
      var offline=users.filter(function(u){return !sessionMap[u.Id];});
      function sectionLabel(txt,count){var d=document.createElement('div');d.style.cssText='font-size:.62em;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.28);padding:16px 0 7px;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;';d.innerHTML='<span>'+txt+'</span><span style="background:rgba(255,255,255,.08);border-radius:10px;padding:1px 8px;font-size:1em;color:rgba(255,255,255,.3);">'+count+'</span>';body.appendChild(d);}
      function renderUser(user){
        var s=sessionMap[user.Id], np=s&&s.NowPlayingItem, isMe=user.Id===myId;
        var row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:10px;transition:background .15s;margin-bottom:2px;';
        row.onmouseover=function(){row.style.background='rgba(255,255,255,.05)';};row.onmouseout=function(){row.style.background='none';};
        var avWrap=document.createElement('div');avWrap.style.cssText='position:relative;flex-shrink:0;';
        var avImg=document.createElement('div');avImg.style.cssText='width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.12);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;color:rgba(255,255,255,.7);';
        var img=document.createElement('img');img.src=serverUrl+'/Users/'+user.Id+'/Images/Primary?maxHeight=80&quality=85';img.style.cssText='width:100%;height:100%;object-fit:cover;';img.onerror=function(){avImg.textContent=ini(user.Name);};avImg.appendChild(img);avWrap.appendChild(avImg);
        if(s){var dot=document.createElement('div');dot.style.cssText='position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;border:2px solid rgba(10,10,15,.95);background:'+(np?'#ef4444':'#4ade80')+';';avWrap.appendChild(dot);}
        row.appendChild(avWrap);
        var info=document.createElement('div');info.style.cssText='flex:1;min-width:0;';
        var nameEl=document.createElement('div');nameEl.style.cssText='font-size:.88em;font-weight:500;color:'+(isMe?'rgba(255,255,255,.45)':'#fff')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';nameEl.textContent=user.Name+(isMe?' (du)':'');info.appendChild(nameEl);
        if(np){
          var npEl=document.createElement('div');npEl.style.cssText='font-size:.7em;color:rgba(255,255,255,.45);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:4px;';
          var isPaused=s.PlayState&&s.PlayState.IsPaused;
          npEl.innerHTML='<span style="color:'+(isPaused?'rgba(255,200,60,.8)':'#ef4444')+';">'+(isPaused?'⏸':'▶')+'</span> '+esc(np.SeriesName?np.SeriesName+' – '+np.Name:np.Name);info.appendChild(npEl);
          if(s.PlayState&&s.PlayState.PositionTicks&&np.RunTimeTicks){var pct=Math.min(100,Math.round(s.PlayState.PositionTicks/np.RunTimeTicks*100));var bar=document.createElement('div');bar.style.cssText='height:2px;background:rgba(255,255,255,.1);border-radius:1px;margin-top:5px;overflow:hidden;';bar.innerHTML='<div style="height:100%;width:'+pct+'%;background:'+(isPaused?'rgba(255,200,60,.6)':'#ef4444')+';border-radius:1px;"></div>';info.appendChild(bar);}
        } else if(s) {
          var idleEl=document.createElement('div');idleEl.style.cssText='font-size:.68em;color:rgba(255,255,255,.28);margin-top:2px;';idleEl.textContent='Online – '+(s.DeviceName||s.Client||'Unbekannt');info.appendChild(idleEl);
        } else {
          var lastSeen=user.LastActivityDate?new Date(user.LastActivityDate):null;var offEl=document.createElement('div');offEl.style.cssText='font-size:.68em;color:rgba(255,255,255,.2);margin-top:2px;';offEl.textContent=lastSeen?'Zuletzt: '+lastSeen.toLocaleDateString('de',{day:'numeric',month:'short'}):'Offline';info.appendChild(offEl);
        }
        row.appendChild(info);
        if(np&&np.ImageTags&&np.ImageTags.Primary){var thumb=document.createElement('img');thumb.src=serverUrl+'/Items/'+np.Id+'/Images/Primary?maxHeight=60&quality=80';thumb.style.cssText='width:32px;height:48px;border-radius:4px;object-fit:cover;flex-shrink:0;border:1px solid rgba(255,255,255,.08);';thumb.onerror=function(){thumb.style.display='none';};row.appendChild(thumb);}
        body.appendChild(row);
      }
      if(online.length){sectionLabel('Schaut gerade',online.length);online.forEach(renderUser);}
      if(idle.length){sectionLabel('Online',idle.length);idle.forEach(renderUser);}
      if(offline.length){sectionLabel('Offline',offline.length);offline.forEach(renderUser);}
    });
  }

  function injectFriendsBtn() {
    var pill = document.getElementById('jf-pill');
    if (!pill || document.getElementById('jf-friends-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'jf-friends-btn';
    btn.title = 'Freunde';
    btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;background:none;border:none;outline:none;cursor:pointer;border-radius:50%;transition:background 0.15s;flex-shrink:0;padding:0;';
    btn.innerHTML = FRIENDS_SVG;
    btn.onmouseover = function(){ btn.style.background='rgba(255,255,255,0.1)'; };
    btn.onmouseout  = function(){ btn.style.background='none'; };
    btn.addEventListener('click', function(e){ e.stopPropagation(); openFriendsOverlay(); });
    pill.insertBefore(btn, pill.firstChild);
  }

  var iv = setInterval(function(){
    if (document.getElementById('jf-pill')) { injectFriendsBtn(); clearInterval(iv); }
  }, 300);
  setTimeout(function(){ clearInterval(iv); }, 15000);

  new MutationObserver(injectFriendsBtn).observe(document.body, { childList: true, subtree: true });
})();


/* ════════════════════════════════════════════════════════════
   5) NATIVEN SOCIAL-FRIENDS-BTN AGGRESSIV KILLEN
   ════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  /* CSS-Hammer — sofort */
  var s = document.createElement('style');
  s.id = 'jf-kill-social';
  s.textContent = [
    '#social-friends-btn,',
    '.social-friends-btn,',
    '[id*="social-friends"],',
    '[class*="social-friends"] {',
      'display:none!important;',
      'visibility:hidden!important;',
      'opacity:0!important;',
      'pointer-events:none!important;',
      'width:0!important;',
      'height:0!important;',
      'min-width:0!important;',
      'min-height:0!important;',
      'position:absolute!important;',
      'left:-9999px!important;',
      'overflow:hidden!important;',
    '}'
  ].join('');
  document.head.appendChild(s);

  /* JS-Hammer — bei jedem Auftauchen */
  function kill() {
    document.querySelectorAll(
      '#social-friends-btn, .social-friends-btn, [id*="social-friends"], [class*="social-friends"]'
    ).forEach(function(el) {
      el.style.setProperty('display',           'none',      'important');
      el.style.setProperty('visibility',        'hidden',    'important');
      el.style.setProperty('opacity',           '0',         'important');
      el.style.setProperty('pointer-events',    'none',      'important');
      el.style.setProperty('position',          'absolute',  'important');
      el.style.setProperty('left',              '-9999px',   'important');
      el.style.setProperty('width',             '0',         'important');
      el.style.setProperty('height',            '0',         'important');
    });
  }

  kill();
  setInterval(kill, 400);
  new MutationObserver(kill).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true
  });
})();
