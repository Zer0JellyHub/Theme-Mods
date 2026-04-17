/* ══════════════════════════════════════════════════════════
   Jellyfin – Ratings Overlay  v3
   Basis: funktionierende v2, folgende Fixes:
   ✓ 24h localStorage Cache → schnell nach erstem Laden
   ✓ Mobile: Tabs in eigener Zeile unter der Suche
   ✓ History zeigt Filme UND Serien/Episoden
   ✓ Echte Benutzernamen (Fallback auf Users-Cache)
   ✓ Avatar-Bilder mit Timestamp (kein Browser-Cache)
   ✓ 5. Tab "⭐ Bewerten" – Server-Suche + Bewerten
   ✓ k3ntas API korrekt: POST ...?rating=N als Query-Param
   ✓ #ir-widget versteckt
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── ir-widget sofort weg ────────────────────────────────── */
  (function(){var s=document.createElement('style');s.textContent='#ir-widget,#ir-widget-on,.ir-pill,[id^="ir-widget"]{display:none!important;}';document.head.appendChild(s);})();

  /* ── 24h Cache ───────────────────────────────────────────── */
  var TTL = 86400000;
  function ck(k){return 'jfrat3_'+k;}
  function cget(k){
    try{var r=localStorage.getItem(ck(k));if(!r)return null;var o=JSON.parse(r);if(Date.now()-o.ts>TTL){localStorage.removeItem(ck(k));return null;}return o.d;}catch(e){return null;}
  }
  function cset(k,d){try{localStorage.setItem(ck(k),JSON.stringify({ts:Date.now(),d:d}));}catch(e){}}
  function cdel(k){try{localStorage.removeItem(ck(k));}catch(e){}}

  /* ── CSS ─────────────────────────────────────────────────── */
  var CSS=''
    +'.jf-rat-tab-icon{display:flex;align-items:center;justify-content:center;}'
    +'.jf-rat-tab-icon svg{width:22px;height:22px;fill:currentColor;opacity:.87;}'
    +'.jf-rat-tab-patched{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;}'
    +'#jf-rat-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);display:flex;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}'

    /* ── Header: 3 separate Zeilen ── */
    +'#jf-rat-hdr{display:flex;flex-direction:column;flex-shrink:0;background:rgba(0,0,0,.2);border-bottom:1px solid rgba(255,255,255,.12);}'
    /* Zeile 1: Titel + Suche + Schließen */
    +'#jf-rat-r1{display:flex;align-items:center;padding:11px 3.5%;gap:10px;}'
    +'#jf-rat-title{font-size:1.15em;font-weight:300;letter-spacing:.03em;display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.95);flex-shrink:0;}'
    +'#jf-rat-sw{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:5px 11px;flex:1;transition:border-color .2s;}'
    +'#jf-rat-sw:focus-within{border-color:rgba(255,255,255,.38);}'
    +'#jf-rat-si{background:none;border:none;outline:none;color:#fff;font-size:.8em;flex:1;font-family:inherit;min-width:0;}'
    +'#jf-rat-si::placeholder{color:rgba(255,255,255,.3);}'
    +'#jf-rat-sc{background:none;border:none;color:rgba(255,255,255,.35);cursor:pointer;font-size:13px;padding:0;display:none;flex-shrink:0;}'
    +'#jf-rat-sc.show{display:block;}'
    +'#jf-rat-close{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);border-radius:50%;width:32px;height:32px;font-size:1em;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
    +'#jf-rat-close:hover{background:rgba(255,255,255,.22);}'
    /* Zeile 2: Tabs – umbrechen damit alle sichtbar */
    +'#jf-rat-r2{display:flex;gap:5px;padding:0 3.5% 10px;flex-wrap:wrap;row-gap:5px;}'
    +'.jf-rat-btn{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.7);border-radius:8px;padding:5px 13px;cursor:pointer;flex-shrink:0;font-size:.77em;font-family:inherit;line-height:1.3;transition:background .15s,border-color .15s,color .15s;white-space:nowrap;}'
    +'.jf-rat-btn:hover{background:rgba(255,255,255,.14);color:#fff;}'
    +'.jf-rat-btn.active{background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.5);color:#fff;font-weight:500;}'

    /* Body */
    +'#jf-rat-body{flex:1;overflow-y:auto;padding:0 3.5% 3em;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent;}'
    +'#jf-rat-body::-webkit-scrollbar{width:4px;}'
    +'#jf-rat-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:2px;}'

    /* Section */
    +'.jf-rat-section{padding-top:28px;}'
    +'.jf-rat-section h2{font-size:1.15em;font-weight:300;letter-spacing:.04em;margin:0 0 .35em;color:rgba(255,255,255,.9);}'
    +'.jf-rat-subtitle{font-size:.7em;color:rgba(255,255,255,.3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;}'

    /* Ranking */
    +'.jf-rat-list{display:flex;flex-direction:column;gap:2px;}'
    +'.jf-rat-item-wrap{border-radius:9px;overflow:hidden;margin-bottom:2px;}'
    +'.jf-rat-row{display:flex;align-items:center;gap:11px;padding:8px 11px;cursor:pointer;transition:background .15s;}'
    +'.jf-rat-row:hover{background:rgba(255,255,255,.05);}'
    +'.jf-rat-row.highlighted{background:rgba(255,255,255,.06);}'
    +'.jf-rat-rank{font-size:1.1em;width:28px;text-align:center;flex-shrink:0;}'
    +'.jf-rat-rank.plain{font-size:.78em;color:rgba(255,255,255,.25);font-weight:600;}'
    +'.jf-rat-poster{width:36px;height:52px;border-radius:4px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.06);flex-shrink:0;object-fit:cover;}'
    +'.jf-rat-info{flex:1;min-width:0;}'
    +'.jf-rat-name{font-size:.85em;font-weight:500;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
    +'.jf-rat-meta{font-size:.68em;color:rgba(255,255,255,.38);margin-top:2px;}'
    +'.jf-rat-score{text-align:right;flex-shrink:0;margin-right:6px;}'
    +'.jf-rat-avg{font-size:1.1em;font-weight:500;color:#fff;line-height:1;}'
    +'.jf-rat-avg small{font-size:.5em;color:rgba(255,255,255,.28);font-weight:300;}'
    +'.jf-rat-stars{font-size:.58em;color:rgba(255,255,255,.5);margin-top:2px;letter-spacing:1px;}'
    +'.jf-rat-rcount{font-size:.6em;color:rgba(255,255,255,.28);margin-top:1px;}'

    /* Expand */
    +'.jf-rat-expand{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:rgba(255,255,255,.55);border-radius:6px;width:24px;height:24px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-family:inherit;transition:all .15s;}'
    +'.jf-rat-expand:hover,.jf-rat-expand.open{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.3);color:#fff;}'
    +'.jf-rat-expand-panel{background:rgba(0,0,0,.2);padding:9px 13px;border-top:1px solid rgba(255,255,255,.06);}'
    +'.jf-rat-expand-title{font-size:.63em;color:rgba(255,255,255,.3);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;}'
    +'.jf-rat-user-row{display:flex;align-items:center;gap:9px;margin-bottom:6px;}'
    +'.jf-rat-user-row:last-child{margin-bottom:0;}'
    +'.jf-rat-avatar{width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:8px;color:rgba(255,255,255,.8);flex-shrink:0;overflow:hidden;}'
    +'.jf-rat-avatar img{width:100%;height:100%;object-fit:cover;}'
    +'.jf-rat-uname{font-size:.76em;color:rgba(255,255,255,.7);flex:1;}'
    +'.jf-rat-ustars{font-size:.62em;color:rgba(255,255,255,.5);letter-spacing:1px;}'
    +'.jf-rat-uscore{font-size:.76em;font-weight:500;color:rgba(255,255,255,.9);margin-left:5px;}'
    +'.jf-rat-divider{height:1px;background:rgba(255,255,255,.06);margin:5px 0;}'

    /* Rate-Button */
    +'.jf-rat-rate-btn{background:rgba(255,193,7,.12);border:1px solid rgba(255,193,7,.3);color:rgba(255,210,60,.85);border-radius:6px;padding:3px 8px;font-size:.67em;font-family:inherit;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:background .15s;}'
    +'.jf-rat-rate-btn:hover{background:rgba(255,193,7,.25);}'
    +'.jf-rat-rate-btn.rated{background:rgba(255,193,7,.22);border-color:rgba(255,193,7,.55);color:#ffe040;}'

    /* Sterne-Picker */
    +'.jf-rat-picker-wrap{background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:11px 13px;margin:2px 0 3px;}'
    +'.jf-rat-picker-title{font-size:.67em;color:rgba(255,255,255,.35);letter-spacing:.06em;text-transform:uppercase;margin-bottom:9px;}'
    +'.jf-rat-star-row{display:flex;gap:2px;align-items:center;margin-bottom:9px;flex-wrap:wrap;}'
    +'.jf-rat-star{font-size:1.45em;cursor:pointer;color:rgba(255,255,255,.18);transition:color .1s,transform .1s;user-select:none;line-height:1;}'
    +'.jf-rat-star:hover,.jf-rat-star.lit{color:#FFD700;}'
    +'.jf-rat-star:hover{transform:scale(1.18);}'
    +'.jf-rat-picker-val{font-size:.78em;color:rgba(255,255,255,.42);min-width:30px;margin-left:6px;}'
    +'.jf-rat-picker-actions{display:flex;gap:7px;flex-wrap:wrap;}'
    +'.jf-rat-picker-save{background:rgba(255,193,7,.2);border:1px solid rgba(255,193,7,.45);color:#ffe040;border-radius:7px;padding:4px 12px;font-size:.75em;font-family:inherit;cursor:pointer;}'
    +'.jf-rat-picker-save:hover{background:rgba(255,193,7,.38);}'
    +'.jf-rat-picker-del{background:rgba(255,60,60,.08);border:1px solid rgba(255,60,60,.25);color:rgba(255,120,120,.9);border-radius:7px;padding:4px 12px;font-size:.75em;font-family:inherit;cursor:pointer;}'
    +'.jf-rat-picker-del:hover{background:rgba(255,60,60,.2);}'
    +'.jf-rat-picker-cancel{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.42);border-radius:7px;padding:4px 12px;font-size:.75em;font-family:inherit;cursor:pointer;}'
    +'.jf-rat-msg{font-size:.7em;margin-top:6px;}'
    +'.jf-rat-msg.ok{color:#7ec87e;} .jf-rat-msg.err{color:#f88;}'

    /* User Pills */
    +'.jf-rat-users{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px;}'
    +'.jf-rat-upill{display:flex;align-items:center;gap:7px;padding:5px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.07);cursor:pointer;font-family:inherit;transition:background .15s;}'
    +'.jf-rat-upill:hover{background:rgba(255,255,255,.13);}'
    +'.jf-rat-upill-av{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.15);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:8px;color:rgba(255,255,255,.8);flex-shrink:0;}'
    +'.jf-rat-upill-av img{width:100%;height:100%;object-fit:cover;}'
    +'.jf-rat-upill-name{font-size:.8em;color:#fff;}'

    /* Detail */
    +'.jf-rat-detail-header{display:flex;align-items:center;gap:8px;margin-bottom:13px;}'
    +'.jf-rat-back{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);color:rgba(255,255,255,.65);border-radius:6px;padding:4px 10px;font-size:.73em;cursor:pointer;font-family:inherit;}'
    +'.jf-rat-back:hover{background:rgba(255,255,255,.14);color:#fff;}'
    +'.jf-rat-detail-label{font-size:.78em;color:rgba(255,255,255,.45);}'

    /* Karten */
    +'.jf-rat-cards{display:flex;flex-wrap:wrap;gap:9px;}'
    +'.jf-rat-card{width:108px;flex-shrink:0;cursor:pointer;transition:transform .2s,opacity .2s;}'
    +'.jf-rat-card:hover{transform:scale(1.05);opacity:.85;}'
    +'.jf-rat-card-img{width:108px;height:162px;border-radius:6px;overflow:hidden;background:rgba(255,255,255,.06);position:relative;border:1px solid rgba(255,255,255,.07);}'
    +'.jf-rat-card-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}'
    +'.jf-rat-card-title{font-size:.72em;margin-top:5px;text-align:center;color:rgba(255,255,255,.8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
    +'.jf-rat-card-sub{font-size:.64em;margin-top:2px;text-align:center;color:rgba(255,255,255,.36);}'

    /* History */
    +'.jf-rat-hist-row{display:flex;align-items:center;gap:11px;padding:8px 11px;border-radius:9px;transition:background .15s;}'
    +'.jf-rat-hist-row.clickable{cursor:pointer;}'
    +'.jf-rat-hist-row:hover{background:rgba(255,255,255,.05);}'
    +'.jf-rat-hist-row.highlighted{background:rgba(255,255,255,.05);}'
    +'.jf-rat-hist-date{width:32px;text-align:center;flex-shrink:0;}'
    +'.jf-rat-hist-day{font-size:1em;font-weight:400;color:rgba(255,255,255,.88);line-height:1;}'
    +'.jf-rat-hist-mon{font-size:.6em;color:rgba(255,255,255,.3);}'

    /* Rate-Tab Suche */
    +'#jf-rat-rtsearch{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.17);color:#fff;border-radius:9px;padding:9px 14px;font-size:.88em;font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:14px;}'
    +'#jf-rat-rtsearch::placeholder{color:rgba(255,255,255,.3);}'
    +'#jf-rat-rtsearch:focus{border-color:rgba(255,255,255,.38);}'

    /* States */
    +'.jf-rat-spinner{padding:2.5em;text-align:center;color:rgba(255,255,255,.38);font-size:.86em;}'
    +'.jf-rat-empty{padding:1.5em 0;color:rgba(255,255,255,.22);font-size:.84em;font-style:italic;}'

    /* Mobile */
    +'@media(max-width:640px){'
    +'#jf-rat-r1{padding:9px 4%;}'
    +'#jf-rat-r2{padding:0 4% 9px;}'
    +'#jf-rat-body{padding:0 4% 3em;}'
    +'.jf-rat-btn{padding:4px 10px;font-size:.73em;}'
    +'.jf-rat-card,.jf-rat-card-img{width:calc(33vw - 14px);height:calc((33vw - 14px)*1.5);}'
    +'}';

  function injectCSS(){if(document.getElementById('jfrat3css'))return;var s=document.createElement('style');s.id='jfrat3css';s.textContent=CSS;document.head.appendChild(s);}

  /* ── Helpers ─────────────────────────────────────────────── */
  function AC(){return window.ApiClient;}
  function srv(){var a=AC();return a?(a._serverAddress||a._serverUrl||'').replace(/\/$/,''):'';}
  function tok(){var a=AC();return a?(a._token||(a.accessToken&&a.accessToken())||''):''}
  function uid(){var a=AC();return a?(a._currentUserId||(a.getCurrentUserId&&a.getCurrentUserId())||''):'';}
  function ah(){return{'X-Emby-Token':tok(),'X-MediaBrowser-Token':tok()};}
  function jget(p,q){var qs=q?'?'+Object.keys(q).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(q[k]);}).join('&'):'';return fetch(srv()+'/'+p+qs,{headers:ah()}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});}
  function rget(p){return fetch(srv()+p,{headers:ah()}).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;});}
  /* KORREKTE k3ntas API: rating als Query-Parameter */
  function rsubmit(id,n){return fetch(srv()+'/Ratings/Items/'+id+'/Rating?rating='+n,{method:'POST',headers:ah()}).then(function(r){return r.ok;}).catch(function(){return false;});}
  function rdel(id){return fetch(srv()+'/Ratings/Items/'+id+'/Rating',{method:'DELETE',headers:ah()}).then(function(r){return r.ok;}).catch(function(){return false;});}

  function stars(v){var f=Math.round(v/10*5);return'★'.repeat(Math.max(0,f))+'☆'.repeat(Math.max(0,5-f));}
  function ini(n){if(!n)return'?';var p=n.trim().split(/\s+/);return p.length>1?(p[0][0]+p[p.length-1][0]).toUpperCase():n.substring(0,2).toUpperCase();}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function pimg(item,sz){sz=sz||300;if(item.ImageTags&&item.ImageTags.Primary)return srv()+'/Items/'+item.Id+'/Images/Primary?tag='+item.ImageTags.Primary+'&maxHeight='+sz+'&quality=85';if(item.SeriesId&&item.SeriesPrimaryImageTag)return srv()+'/Items/'+item.SeriesId+'/Images/Primary?tag='+item.SeriesPrimaryImageTag+'&maxHeight='+sz+'&quality=85';return '';}
  /* Avatar mit Timestamp → kein Browser-Cache */
  function avurl(id){return srv()+'/Users/'+id+'/Images/Primary?maxHeight=64&quality=85&_='+Date.now();}

  function navTo(id){
    var a=AC(),sid=a&&((a._serverInfo&&a._serverInfo.Id)||(a.serverId&&a.serverId()));
    closeOv();
    setTimeout(function(){
      if(window.appRouter&&appRouter.showItem){appRouter.showItem({Id:id,ServerId:sid});return;}
      if(window.Emby&&Emby.Page&&Emby.Page.showItem){Emby.Page.showItem(id);return;}
      window.location.hash='#!/details?id='+id+(sid?'&serverId='+sid:'');
    },200);
  }

  /* Eigene Bewertung aus DetailedRatings holen */
  function myRating(itemId){
    return rget('/Ratings/Items/'+itemId+'/DetailedRatings').then(function(data){
      if(!data)return null;
      var rows=Array.isArray(data)?data:(data.Ratings||data.ratings||[]);
      var me=uid();
      for(var i=0;i<rows.length;i++){if((rows[i].UserId||rows[i].userId)===me)return parseFloat(rows[i].Rating||rows[i].rating||0)||null;}
      return null;
    });
  }

  /* ── Sterne-Picker ───────────────────────────────────────── */
  function showPicker(container,itemId,itemName,cur,onDone){
    container.innerHTML='';
    var sel=cur||0;
    var wrap=document.createElement('div');wrap.className='jf-rat-picker-wrap';
    var tit=document.createElement('div');tit.className='jf-rat-picker-title';tit.textContent='Rate: '+itemName;wrap.appendChild(tit);
    var srow=document.createElement('div');srow.className='jf-rat-star-row';
    var vl=document.createElement('span');vl.className='jf-rat-picker-val';vl.textContent=sel?sel+'/10':'–';
    var sarr=[];
    for(var i=1;i<=10;i++){(function(v){
      var s=document.createElement('span');s.className='jf-rat-star'+(v<=sel?' lit':'');s.textContent='★';
      s.addEventListener('mouseenter',function(){sarr.forEach(function(x,j){x.classList.toggle('lit',j<v);});vl.textContent=v+'/10';});
      s.addEventListener('mouseleave',function(){sarr.forEach(function(x,j){x.classList.toggle('lit',j<sel);});vl.textContent=sel?sel+'/10':'–';});
      s.addEventListener('click',function(){sel=v;sarr.forEach(function(x,j){x.classList.toggle('lit',j<sel);});vl.textContent=sel+'/10';});
      sarr.push(s);srow.appendChild(s);
    })(i);}
    srow.appendChild(vl);wrap.appendChild(srow);
    var msg=document.createElement('div');msg.className='jf-rat-msg';wrap.appendChild(msg);
    var acts=document.createElement('div');acts.className='jf-rat-picker-actions';
    var sv=document.createElement('button');sv.className='jf-rat-picker-save';sv.textContent=cur?'Change':'Rate';
    sv.addEventListener('click',function(){
      if(!sel){msg.className='jf-rat-msg err';msg.textContent='Please select stars.';return;}
      sv.disabled=true;sv.textContent='…';
      rsubmit(itemId,sel).then(function(ok){
        if(ok){msg.className='jf-rat-msg ok';msg.textContent='✓ Saved ('+sel+'/10)';setTimeout(function(){if(onDone)onDone(sel);},700);}
        else{msg.className='jf-rat-msg err';msg.textContent='Error – try again.';sv.disabled=false;sv.textContent=cur?'Change':'Rate';}
      });
    });
    acts.appendChild(sv);
    if(cur){var dv=document.createElement('button');dv.className='jf-rat-picker-del';dv.textContent='Remove';
      dv.addEventListener('click',function(){dv.disabled=true;dv.textContent='…';
        rdel(itemId).then(function(ok){
          if(ok){msg.className='jf-rat-msg ok';msg.textContent='✓ Removed';setTimeout(function(){if(onDone)onDone(null);},700);}
          else{msg.className='jf-rat-msg err';msg.textContent='Error.';dv.disabled=false;dv.textContent='Remove';}
        });
      });acts.appendChild(dv);}
    var ca=document.createElement('button');ca.className='jf-rat-picker-cancel';ca.textContent='Cancel';
    ca.addEventListener('click',function(){container.innerHTML='';});acts.appendChild(ca);
    wrap.appendChild(acts);container.appendChild(wrap);
  }

  function attachRateBtn(btn,pel,itemId,itemName){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      if(pel.hasChildNodes()){pel.innerHTML='';return;}
      btn.textContent='…';btn.disabled=true;
      myRating(itemId).then(function(r){
        btn.disabled=false;btn.textContent=r?'⭐ '+r+'/10':'⭐ Rate';btn.classList.toggle('rated',!!r);
        showPicker(pel,itemId,itemName,r,function(nv){
          pel.innerHTML='';btn.textContent=nv?'⭐ '+nv+'/10':'⭐ Rate';btn.classList.toggle('rated',!!nv);
          cdel('movies');cdel('series');DC.movies=null;DC.series=null;
        });
      });
    });
  }

  /* ── Data Cache ──────────────────────────────────────────── */
  var DC={movies:null,series:null,users:null,wl:{},hist:{}};

  function loadAll(){
    var cm=cget('movies'),cs=cget('series');
    if(cm)DC.movies=cm;if(cs)DC.series=cs;
    return Promise.all([
      DC.movies?Promise.resolve():loadRanking('Movie').then(function(r){DC.movies=r;cset('movies',r);}),
      DC.series?Promise.resolve():loadRanking('Series').then(function(r){DC.series=r;cset('series',r);}),
      DC.users?Promise.resolve():jget('Users').then(function(data){DC.users=Array.isArray(data)?data.map(function(u){return{Id:u.Id,Name:u.Name};}):[];})
    ]);
  }

  function loadRanking(type){
    return jget('Items',{Recursive:true,IncludeItemTypes:type,Fields:'ProductionYear,Genres,ImageTags',Limit:1000,UserId:uid()})
      .then(function(data){
        if(!data||!data.Items)return[];
        var items=data.Items,res=new Array(items.length).fill(null),idx=0;
        function next(){if(idx>=items.length)return Promise.resolve();var s=idx;idx+=30;
          return Promise.all(items.slice(s,s+30).map(function(it,i){return rget('/Ratings/Items/'+it.Id+'/Stats').then(function(st){res[s+i]=st;});})).then(next);}
        return next().then(function(){
          var ranked=[];
          items.forEach(function(it,i){var st=res[i];if(!st||!st.TotalRatings||st.TotalRatings===0)return;
            ranked.push({id:it.Id,name:it.Name,year:it.ProductionYear||'',genres:(it.Genres||[]).slice(0,2).join(' · '),avg:parseFloat(st.AverageRating||0),count:st.TotalRatings||0,imgTag:it.ImageTags&&it.ImageTags.Primary});});
          ranked.sort(function(a,b){return b.avg-a.avg||b.count-a.count;});return ranked;
        });
      });
  }

  function loadWL(id){
    if(DC.wl[id])return Promise.resolve(DC.wl[id]);
    return jget('Users/'+id+'/Items',{Filters:'IsFavorite',Recursive:true,IncludeItemTypes:'Movie,Series',Fields:'ImageTags,ProductionYear',Limit:200})
      .then(function(d){var it=(d&&d.Items)||[];DC.wl[id]=it;return it;});
  }

  function loadHist(id){
    if(DC.hist[id])return Promise.resolve(DC.hist[id]);
    /* Playback Reporting Plugin */
    return fetch(srv()+'/user_usage_stats/UserPlaylist?user_id='+id+'&days=90&limit=100',{headers:ah()})
      .then(function(r){if(!r.ok)throw 0;return r.json();})
      .then(function(data){
        var rows=Array.isArray(data)?data:(data.results||data.Items||[]);
        var it=rows.map(function(row){return{Id:row.ItemId||row.id||'',Name:row.ItemName||row.name||'',Type:row.ItemType||row.type||'',SeriesName:row.SeriesName||'',SeasonNum:row.SeasonNumber,EpisodeNum:row.EpisodeNumber,PlayedDate:row.DateCreated||row.date||'',RunTime:row.PlayDuration||row.duration||0,ImageTags:{Primary:row.PrimaryImageTag||''},SeriesId:row.SeriesId||''};});
        DC.hist[id]=it;return it;
      })
      .catch(function(){
        /* Fallback: Jellyfin played – Movie UND Episode */
        return jget('Users/'+id+'/Items',{Filters:'IsPlayed',Recursive:true,IncludeItemTypes:'Movie,Episode',SortBy:'DatePlayed',SortOrder:'Descending',Fields:'ImageTags,SeriesName,ParentIndexNumber,IndexNumber,RunTimeTicks,SeriesId',Limit:150})
          .then(function(d){var it=(d&&d.Items)||[];DC.hist[id]=it;return it;});
      });
  }

  /* ── Render ──────────────────────────────────────────────── */
  function gb(){return document.getElementById('jf-rat-body');}

  function renderTab(tab){
    var b=gb();if(!b)return;
    if(tab==='movies'||tab==='series')renderRanking(tab);
    else if(tab==='watchlist')renderPills('watchlist');
    else if(tab==='history')renderPills('history');
    else if(tab==='rate')renderRateTab();
  }

  /* ── Ranking ─────────────────────────────────────────────── */
  function renderRanking(tab){
    var b=gb();if(!b)return;
    var items=DC[tab];
    if(!items){
      b.innerHTML='<div class="jf-rat-spinner">Loading…</div>';
      loadRanking(tab==='movies'?'Movie':'Series').then(function(r){DC[tab]=r;cset(tab,r);renderRanking(tab);});return;
    }
    b.innerHTML='';
    var sec=document.createElement('div');sec.className='jf-rat-section';
    sec.innerHTML='<h2>'+(tab==='movies'?'Ranked Movies':'Ranked Series')+'</h2><div class="jf-rat-subtitle">'+items.length+' rated title'+(items.length!==1?'s':'')+'</div>';
    if(!items.length){sec.innerHTML+='<div class="jf-rat-empty">No rated titles yet.</div>';b.appendChild(sec);return;}

    var list=document.createElement('div');list.className='jf-rat-list';
    items.forEach(function(item,i){
      var rank=i+1,medal=rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':null;
      var img=item.imgTag?srv()+'/Items/'+item.id+'/Images/Primary?tag='+item.imgTag+'&maxHeight=110&quality=85':'';
      if(rank===4&&items.length>3){var dv=document.createElement('div');dv.className='jf-rat-divider';list.appendChild(dv);}
      var wrap=document.createElement('div');wrap.className='jf-rat-item-wrap';wrap.dataset.name=item.name.toLowerCase();
      var row=document.createElement('div');row.className='jf-rat-row'+(rank<=3?' highlighted':'');
      row.innerHTML='<div class="jf-rat-rank'+(medal?'':' plain')+'">'+(medal||rank)+'</div>'
        +(img?'<img class="jf-rat-poster" src="'+img+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'<div class="jf-rat-poster" style="display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(255,255,255,.1)">▪</div>')
        +'<div class="jf-rat-info"><div class="jf-rat-name">'+esc(item.name)+'</div><div class="jf-rat-meta">'+item.year+(item.genres?' · '+esc(item.genres):'')+'</div></div>'
        +'<div class="jf-rat-score"><div class="jf-rat-avg">'+item.avg.toFixed(1)+'<small>/10</small></div><div class="jf-rat-stars">'+stars(item.avg)+'</div><div class="jf-rat-rcount">'+item.count+' rating'+(item.count!==1?'s':'')+'</div></div>'
        +'<button class="jf-rat-rate-btn">⭐ Rate</button><button class="jf-rat-expand">▾</button>';
      var rb=row.querySelector('.jf-rat-rate-btn'),eb=row.querySelector('.jf-rat-expand'),pel=document.createElement('div');
      attachRateBtn(rb,pel,item.id,item.name);
      var panel=document.createElement('div');panel.className='jf-rat-expand-panel';panel.style.display='none';
      panel.innerHTML='<div class="jf-rat-spinner" style="padding:.8em 0">Loading…</div>';
      eb.addEventListener('click',function(e){e.stopPropagation();var op=panel.style.display!=='none';panel.style.display=op?'none':'block';eb.textContent=op?'▾':'▴';eb.classList.toggle('open',!op);
        if(!op&&!panel.dataset.loaded){panel.dataset.loaded='1';rget('/Ratings/Items/'+item.id+'/DetailedRatings').then(function(d){renderExpand(panel,d);});}});
      row.addEventListener('click',function(e){if(eb.contains(e.target)||rb.contains(e.target))return;navTo(item.id);});
      wrap.appendChild(row);wrap.appendChild(pel);wrap.appendChild(panel);list.appendChild(wrap);
    });
    sec.appendChild(list);b.appendChild(sec);
  }

  function renderExpand(panel,data){
    var rows=data&&(Array.isArray(data)?data:(data.Ratings||data.ratings||[]));
    if(!rows||!rows.length){panel.innerHTML='<div class="jf-rat-expand-title">User Ratings</div><div class="jf-rat-empty">No individual ratings found.</div>';return;}
    rows.sort(function(a,b){return(b.Rating||b.rating||0)-(a.Rating||a.rating||0);});
    var html='<div class="jf-rat-expand-title">User Ratings</div>';
    rows.forEach(function(r){
      var rid=r.UserId||r.userId||'';
      var uname=r.UserName||r.userName||r.Name||r.name||'';
      /* Fallback: Admin Users-Cache */
      if(!uname&&rid&&DC.users){var f=DC.users.filter(function(u){return u.Id===rid;})[0];if(f)uname=f.Name;}
      if(!uname)uname='User '+(rid?rid.substring(0,6):'');
      var rating=parseFloat(r.Rating||r.rating||0);
      var av=rid?'<div class="jf-rat-avatar"><img src="'+avurl(rid)+'" alt="" onerror="this.parentElement.textContent=\''+ini(uname).replace(/'/g,"\\'")+'\'" ></div>':'<div class="jf-rat-avatar">'+ini(uname)+'</div>';
      html+='<div class="jf-rat-user-row">'+av+'<span class="jf-rat-uname">'+esc(uname)+'</span><span class="jf-rat-ustars">'+stars(rating)+'</span><span class="jf-rat-uscore">'+rating.toFixed(1)+'/10</span></div>';
    });
    panel.innerHTML=html;
  }

  function filterRanking(q){var b=gb();if(!b)return;b.querySelectorAll('.jf-rat-item-wrap').forEach(function(w){w.style.display=(!q||(w.dataset.name||'').includes(q))?'':'none';});}

  /* ── User Pills ──────────────────────────────────────────── */
  function renderPills(mode){
    var b=gb();if(!b)return;b.innerHTML='';
    var sec=document.createElement('div');sec.className='jf-rat-section';
    sec.innerHTML='<h2>'+(mode==='watchlist'?'Watchlists':'Watch History')+'</h2>';
    if(!DC.users||!DC.users.length){sec.innerHTML+='<div class="jf-rat-empty">No users found.</div>';b.appendChild(sec);return;}
    var pills=document.createElement('div');pills.className='jf-rat-users';
    DC.users.forEach(function(user){
      var p=document.createElement('button');p.className='jf-rat-upill';
      p.innerHTML='<div class="jf-rat-upill-av"><img src="'+avurl(user.Id)+'" alt="" onerror="this.parentElement.textContent=\''+ini(user.Name).replace(/'/g,"\\'")+'\'" ></div><span class="jf-rat-upill-name">'+esc(user.Name)+'</span>';
      p.addEventListener('click',function(){
        delete DC.wl[user.Id];delete DC.hist[user.Id];
        if(mode==='watchlist')showWL(user,sec,pills);else showHist(user,sec,pills);
      });pills.appendChild(p);
    });sec.appendChild(pills);b.appendChild(sec);
  }

  function showWL(user,sec,pills){
    pills.style.display='none';
    var det=document.createElement('div');det.innerHTML=bkHdr(user,'watchlist');
    det.querySelector('.jf-rat-back').addEventListener('click',function(){det.remove();pills.style.display='';});
    var grid=document.createElement('div');grid.className='jf-rat-cards';grid.innerHTML='<div class="jf-rat-spinner">Loading…</div>';
    det.appendChild(grid);sec.appendChild(det);
    loadWL(user.Id).then(function(items){
      grid.innerHTML='';
      if(!items.length){grid.innerHTML='<div class="jf-rat-empty">Watchlist is empty.</div>';return;}
      items.forEach(function(item){var img=pimg(item,300);
        var card=document.createElement('div');card.className='jf-rat-card';card.dataset.name=(item.Name||'').toLowerCase();
        card.innerHTML='<div class="jf-rat-card-img">'+(img?'<img src="'+img+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'')+'</div><div class="jf-rat-card-title">'+esc(item.Name||'')+'</div><div class="jf-rat-card-sub">'+(item.ProductionYear||'')+'</div>';
        card.addEventListener('click',function(){navTo(item.Id);});grid.appendChild(card);});
    });
  }

  function showHist(user,sec,pills){
    pills.style.display='none';
    var det=document.createElement('div');det.innerHTML=bkHdr(user,'history');
    det.querySelector('.jf-rat-back').addEventListener('click',function(){det.remove();pills.style.display='';});
    var list=document.createElement('div');list.innerHTML='<div class="jf-rat-spinner">Loading…</div>';
    det.appendChild(list);sec.appendChild(det);
    loadHist(user.Id).then(function(items){
      list.innerHTML='';
      if(!items.length){list.innerHTML='<div class="jf-rat-empty">No watch history found.</div>';return;}
      var pm='';
      items.forEach(function(item,idx){
        var d=item.PlayedDate?new Date(item.PlayedDate):null;
        var mo=d?d.toLocaleString('en',{month:'long',year:'numeric'}):'';
        if(mo&&mo!==pm){pm=mo;var mh=document.createElement('div');mh.className='jf-rat-subtitle';mh.style.paddingTop=idx===0?'0':'12px';mh.textContent=mo;list.appendChild(mh);}
        var row=document.createElement('div');
        var title=item.SeriesName||item.Name||'';
        var sub='';
        if(item.Type==='Episode'||(item.SeriesName&&item.SeriesName!==item.Name)){
          var sn=item.ParentIndexNumber!=null?item.ParentIndexNumber:(item.SeasonNum!=null?item.SeasonNum:null);
          var en=item.IndexNumber!=null?item.IndexNumber:(item.EpisodeNum!=null?item.EpisodeNum:null);
          if(sn!=null&&en!=null)sub='S'+sn+' E'+en;else if(en!=null)sub='E'+en;
          else sub='Episode';
        }else{sub='Movie';var rt=item.RunTimeTicks||item.RunTime||0;if(rt>0)sub+=' · '+Math.round(rt/600000000)+' min';}
        var img=pimg(item,110);
        row.className='jf-rat-hist-row'+(idx%2===0?' highlighted':'')+(item.Id?' clickable':'');
        row.dataset.name=((item.Name||'')+' '+(item.SeriesName||'')).toLowerCase();
        row.innerHTML='<div class="jf-rat-hist-date">'+(d?'<div class="jf-rat-hist-day">'+d.getDate()+'</div><div class="jf-rat-hist-mon">'+d.toLocaleString('en',{month:'short'})+'</div>':'<div class="jf-rat-hist-day">—</div>')+'</div>'
          +(img?'<img class="jf-rat-poster" src="'+img+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'<div class="jf-rat-poster" style="display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(255,255,255,.1)">▪</div>')
          +'<div class="jf-rat-info"><div class="jf-rat-name">'+esc(title)+'</div><div class="jf-rat-meta">'+esc(sub)+'</div></div>';
        if(item.Id)row.addEventListener('click',function(){navTo(item.Id);});
        list.appendChild(row);
      });
    });
  }

  function bkHdr(user,mode){
    return '<div class="jf-rat-detail-header"><button class="jf-rat-back">← Back</button>'
      +'<span class="jf-rat-detail-label"><span style="display:inline-flex;align-items:center;gap:5px;">'
      +'<span style="display:inline-flex;width:16px;height:16px;border-radius:50%;background:rgba(255,255,255,.15);align-items:center;justify-content:center;font-size:7px;color:rgba(255,255,255,.8);">'+ini(user.Name)+'</span>'
      +esc(user.Name)+"'s "+mode+'</span></span></div>';
  }

  /* ── Rate-Tab (5. Tab) ───────────────────────────────────── */
  var rtTimer=null;
  function renderRateTab(){
    var b=gb();if(!b)return;b.innerHTML='';
    var sec=document.createElement('div');sec.className='jf-rat-section';
    sec.innerHTML='<h2>Search &amp; Rate</h2><div class="jf-rat-subtitle">Find any movie or series and rate it</div>';
    var inp=document.createElement('input');inp.id='jf-rat-rtsearch';inp.type='text';inp.placeholder='Search titles…';inp.autocomplete='off';
    sec.appendChild(inp);
    var res=document.createElement('div');res.className='jf-rat-list';sec.appendChild(res);b.appendChild(sec);inp.focus();
    inp.addEventListener('input',function(){
      var q=inp.value.trim();res.innerHTML='';if(q.length<2)return;
      clearTimeout(rtTimer);rtTimer=setTimeout(function(){
        res.innerHTML='<div class="jf-rat-spinner">Searching…</div>';
        jget('Items',{SearchTerm:q,Recursive:true,IncludeItemTypes:'Movie,Series',Fields:'ProductionYear,Genres,ImageTags',Limit:40,UserId:uid()})
          .then(function(data){renderRateResults(res,(data&&data.Items)||[]);});
      },350);
    });
  }

  function renderRateResults(container,items){
    container.innerHTML='';
    if(!items.length){container.innerHTML='<div class="jf-rat-empty">No results.</div>';return;}
    items.forEach(function(item){
      var wrap=document.createElement('div');wrap.className='jf-rat-item-wrap';
      var img=item.ImageTags&&item.ImageTags.Primary?srv()+'/Items/'+item.Id+'/Images/Primary?tag='+item.ImageTags.Primary+'&maxHeight=110&quality=85':'';
      var sid='jfrs-'+item.Id;
      var row=document.createElement('div');row.className='jf-rat-row';
      row.innerHTML=(img?'<img class="jf-rat-poster" src="'+img+'" alt="" loading="lazy" onerror="this.style.display=\'none\'">':'<div class="jf-rat-poster" style="display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(255,255,255,.1)">▪</div>')
        +'<div class="jf-rat-info"><div class="jf-rat-name">'+esc(item.Name||'')+'</div><div class="jf-rat-meta">'+esc(String(item.ProductionYear||''))+' · '+(item.Type==='Series'?'Series':'Movie')+'</div></div>'
        +'<div id="'+sid+'" class="jf-rat-score" style="font-size:.6em;color:rgba(255,255,255,.25);">…</div>'
        +'<button class="jf-rat-rate-btn">⭐ Rate</button>';
      rget('/Ratings/Items/'+item.Id+'/Stats').then(function(st){
        var el=document.getElementById(sid);if(!el)return;
        if(st&&st.TotalRatings){var avg=parseFloat(st.AverageRating||0);el.innerHTML='<div class="jf-rat-avg">'+avg.toFixed(1)+'<small>/10</small></div><div class="jf-rat-stars">'+stars(avg)+'</div><div class="jf-rat-rcount">'+st.TotalRatings+' ratings</div>';}
        else el.innerHTML='<span style="font-size:.6em;color:rgba(255,255,255,.18)">–</span>';
      });
      var rb=row.querySelector('.jf-rat-rate-btn'),pel=document.createElement('div');
      rb.addEventListener('click',function(e){
        e.stopPropagation();if(pel.hasChildNodes()){pel.innerHTML='';return;}
        rb.textContent='…';rb.disabled=true;
        myRating(item.Id).then(function(r){
          rb.disabled=false;rb.textContent=r?'⭐ '+r+'/10':'⭐ Rate';rb.classList.toggle('rated',!!r);
          showPicker(pel,item.Id,item.Name,r,function(nv){
            pel.innerHTML='';rb.textContent=nv?'⭐ '+nv+'/10':'⭐ Rate';rb.classList.toggle('rated',!!nv);
            rget('/Ratings/Items/'+item.Id+'/Stats').then(function(st){
              var el=document.getElementById(sid);if(!el||!st||!st.TotalRatings)return;
              var avg=parseFloat(st.AverageRating||0);
              el.innerHTML='<div class="jf-rat-avg">'+avg.toFixed(1)+'<small>/10</small></div><div class="jf-rat-stars">'+stars(avg)+'</div><div class="jf-rat-rc">'+st.TotalRatings+' ratings</div>';
            });
            cdel('movies');cdel('series');DC.movies=null;DC.series=null;
          });
        });
      });
      row.addEventListener('click',function(e){if(rb.contains(e.target))return;navTo(item.Id);});
      wrap.appendChild(row);wrap.appendChild(pel);container.appendChild(wrap);
    });
  }

  /* ── Overlay öffnen ──────────────────────────────────────── */
  var openOv=function(){
    if(document.getElementById('jf-rat-overlay')){closeOv();return;}
    injectCSS();
    var ov=document.createElement('div');ov.id='jf-rat-overlay';
    ov.innerHTML=
      '<div id="jf-rat-hdr">'
      /* Zeile 1: Titel + Suche + X */
      +'<div id="jf-rat-r1">'
      +'<div id="jf-rat-title"><svg viewBox="0 0 24 24" width="15" height="15" style="flex-shrink:0;opacity:.88;fill:rgba(255,255,255,.85)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Ratings</div>'
      +'<div id="jf-rat-sw"><svg viewBox="0 0 24 24" width="13" height="13" style="fill:none;stroke:rgba(255,255,255,.4);stroke-width:2;stroke-linecap:round;flex-shrink:0"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg><input id="jf-rat-si" type="text" placeholder="Filter…" autocomplete="off"/><button id="jf-rat-sc">✕</button></div>'
      +'<button id="jf-rat-close">✕</button>'
      +'</div>'
      /* Zeile 2: Tabs */
      +'<div id="jf-rat-r2">'
      +'<button class="jf-rat-btn active" data-tab="movies">Movies</button>'
      +'<button class="jf-rat-btn" data-tab="series">Series</button>'
      +'<button class="jf-rat-btn" data-tab="watchlist">Watchlist</button>'
      +'<button class="jf-rat-btn" data-tab="history">History</button>'
      +'<button class="jf-rat-btn" data-tab="rate">⭐ Rate</button>'
      +'</div>'
      +'</div>'
      +'<div id="jf-rat-body"><div class="jf-rat-spinner">Loading…</div></div>';

    document.body.appendChild(ov);
    document.addEventListener('keydown',escH);
    document.getElementById('jf-rat-close').onclick=closeOv;

    var curTab='movies';
    var si=document.getElementById('jf-rat-si');
    var sc=document.getElementById('jf-rat-sc');

    ov.querySelectorAll('.jf-rat-btn[data-tab]').forEach(function(btn){
      btn.addEventListener('click',function(){
        ov.querySelectorAll('.jf-rat-btn[data-tab]').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');curTab=btn.dataset.tab;
        si.value='';sc.classList.remove('show');
        /* Filtersuche im Rate-Tab verstecken */
        document.getElementById('jf-rat-sw').style.display=curTab==='rate'?'none':'';
        renderTab(curTab);
      });
    });

    si.addEventListener('input',function(){
      var q=si.value.trim().toLowerCase();sc.classList.toggle('show',q.length>0);
      if(q.length===0){renderTab(curTab);return;}
      if(curTab==='movies'||curTab==='series')filterRanking(q);
    });
    sc.addEventListener('click',function(){si.value='';sc.classList.remove('show');renderTab(curTab);si.focus();});

    loadAll().then(function(){renderTab('movies');});
  };

  var escH=function(e){if(e.key==='Escape')closeOv();};
  function closeOv(){document.removeEventListener('keydown',escH);var o=document.getElementById('jf-rat-overlay');if(o)o.remove();var w=document.getElementById('ir-widget');if(w)w.style.display='none';}

  /* ── Tab patchen ─────────────────────────────────────────── */
  function patchTab(){
    document.querySelectorAll('[id^="customTabButton"],.emby-tab-button,[class*="tabButton"],[class*="tab-button"]').forEach(function(btn){
      if(btn.dataset.jfP3)return;
      var te=btn.querySelector('.emby-tab-button-text,span')||btn;
      if(!/^ratings$/i.test(te.textContent.trim()))return;
      btn.dataset.jfP3='1';btn.classList.add('jf-rat-tab-patched');
      var ic=document.createElement('span');ic.className='jf-rat-tab-icon';
      ic.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>';
      btn.insertBefore(ic,btn.firstChild);
      btn.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();openOv();},true);
      console.log('[Ratings v3] Tab patched ✓');
    });
  }

  /* ── Init ────────────────────────────────────────────────── */
  injectCSS();
  var iv=setInterval(function(){if(typeof ApiClient==='undefined')return;injectCSS();patchTab();var w=document.getElementById('ir-widget');if(w)w.style.display='none';},400);
  setTimeout(function(){clearInterval(iv);},20000);
  new MutationObserver(function(){patchTab();var w=document.getElementById('ir-widget');if(w)w.style.display='none';}).observe(document.body,{childList:true,subtree:true});
  window.__openRatingsOverlay=openOv;
  console.log('[Ratings v3] Loaded ✓');
})();
