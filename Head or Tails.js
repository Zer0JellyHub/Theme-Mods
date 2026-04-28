(function(){'use strict';

var CSS_ID='jcf-css', BTN_ID='jcf-pill-btn', MODAL_ID='jcf-modal';

function injectCSS(){
  if(document.getElementById(CSS_ID))return;
  var s=document.createElement('style');s.id=CSS_ID;
  s.textContent=`
#jcf-pill-btn{display:inline-flex;align-items:center;justify-content:center;
  width:40px;height:40px;background:none;border:none;outline:none;cursor:pointer;
  border-radius:50%;transition:background .15s;padding:0;flex-shrink:0;}
#jcf-pill-btn:hover{background:rgba(255,255,255,.1);}
#jcf-pill-btn svg{display:block;}

#jcf-modal{position:fixed;inset:0;z-index:999999;
  display:none;align-items:center;justify-content:center;
  background:rgba(0,0,0,.6);backdrop-filter:blur(8px);
  -webkit-backdrop-filter:blur(8px);}
#jcf-modal.open{display:flex;}

#jcf-box{background:#1c1c1c;border:1px solid rgba(255,255,255,.14);
  border-radius:16px;padding:28px 32px 24px;text-align:center;
  box-shadow:0 16px 60px rgba(0,0,0,.9);min-width:240px;position:relative;
  font-family:-apple-system,BlinkMacSystemFont,sans-serif;}

#jcf-close{position:absolute;top:10px;right:12px;background:none;border:none;
  color:rgba(255,255,255,.4);font-size:18px;cursor:pointer;padding:4px 8px;
  border-radius:4px;line-height:1;}
#jcf-close:hover{color:#fff;background:rgba(255,255,255,.1);}

#jcf-title{font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
  color:rgba(255,255,255,.35);margin-bottom:20px;}

#jcf-coin-wrap{perspective:600px;width:100px;height:100px;margin:0 auto 20px;cursor:pointer;}

#jcf-coin{width:100px;height:100px;position:relative;transform-style:preserve-3d;
  transition:transform 0.8s cubic-bezier(.4,0,.2,1);}
#jcf-coin.flip{animation:coinFlip 0.9s cubic-bezier(.4,0,.2,1) forwards;}

@keyframes coinFlip{
  0%  {transform:rotateY(0);}
  50% {transform:rotateY(900deg) scale(1.1);}
  100%{transform:rotateY(var(--end-rot));}
}

.jcf-face{position:absolute;inset:0;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  backface-visibility:hidden;-webkit-backface-visibility:hidden;
  font-size:36px;border:3px solid rgba(255,255,255,.15);}

#jcf-heads{background:radial-gradient(circle at 35% 35%,#f0c040,#c8960c);}
#jcf-tails{background:radial-gradient(circle at 35% 35%,#c0c0d0,#787890);
  transform:rotateY(180deg);}

#jcf-btn-flip{width:100%;padding:11px;background:#00a4dc;border:none;border-radius:10px;
  color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;
  font-family:inherit;margin-bottom:10px;}
#jcf-btn-flip:hover{background:#0090c4;transform:translateY(-1px);}
#jcf-btn-flip:disabled{background:rgba(255,255,255,.1);color:rgba(255,255,255,.3);
  cursor:default;transform:none;}

#jcf-result{font-size:18px;font-weight:700;min-height:26px;color:#fff;
  transition:opacity .3s;}
#jcf-count{font-size:10px;color:rgba(255,255,255,.25);margin-top:8px;letter-spacing:.06em;}
  `;
  document.head.appendChild(s);
}

function buildModal(){
  if(document.getElementById(MODAL_ID))return;
  var modal=document.createElement('div');modal.id=MODAL_ID;
  modal.innerHTML=`
<div id="jcf-box">
  <button id="jcf-close">✕</button>
  <div id="jcf-title">🪙 Heads or Tails</div>
  <div id="jcf-coin-wrap">
    <div id="jcf-coin">
      <div class="jcf-face" id="jcf-heads">👑</div>
      <div class="jcf-face" id="jcf-tails">⚡</div>
    </div>
  </div>
  <button id="jcf-btn-flip">Flip!</button>
  <div id="jcf-result"></div>
  <div id="jcf-count"></div>
</div>`;
  document.body.appendChild(modal);

  var stats={heads:0,tails:0};

  document.getElementById('jcf-close').onclick=closeModal;
  modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});

  var coin=document.getElementById('jcf-coin');
  var btn=document.getElementById('jcf-btn-flip');
  var result=document.getElementById('jcf-result');
  var count=document.getElementById('jcf-count');
  var flipping=false;
  var currentSide=0; /* 0=heads, 1=tails */

  function doFlip(){
    if(flipping)return;
    flipping=true;
    btn.disabled=true;
    result.style.opacity='0';

    var isHeads=Math.random()<0.5;
    /* Ziel-Rotation: gerade Zahl=heads, ungerade=tails relativ zur aktuellen */
    var spins=10+Math.floor(Math.random()*6); /* 10-15 halbe Umdrehungen */
    /* Sicherstellen dass wir auf der richtigen Seite landen */
    if(isHeads && spins%2!==0) spins++;
    if(!isHeads && spins%2===0) spins++;

    var endRot=(currentSide===0?0:180)+(spins*180);
    coin.style.setProperty('--end-rot', endRot+'deg');
    coin.classList.remove('flip');
    void coin.offsetWidth; /* reflow */
    coin.classList.add('flip');

    setTimeout(function(){
      coin.classList.remove('flip');
      coin.style.transform='rotateY('+endRot+'deg)';
      currentSide=endRot/180%2===0?0:1;

      flipping=false;
      btn.disabled=false;

      if(isHeads){stats.heads++;result.textContent='👑 HEADS!';}
      else{stats.tails++;result.textContent='⚡ TAILS!';}
      result.style.opacity='1';
      count.textContent='👑 '+stats.heads+'  ·  ⚡ '+stats.tails;
    },950);
  }

  btn.addEventListener('click',doFlip);
  document.getElementById('jcf-coin-wrap').addEventListener('click',doFlip);
}

function openModal(){
  buildModal();
  document.getElementById(MODAL_ID).classList.add('open');
}
function closeModal(){
  var m=document.getElementById(MODAL_ID);
  if(m)m.classList.remove('open');
}

function buildPillBtn(){
  if(document.getElementById(BTN_ID))return;
  var pill=document.getElementById('jf-pill');if(!pill)return;

  var btn=document.createElement('button');
  btn.id=BTN_ID;btn.title='Heads or Tails';
  btn.innerHTML=`<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9.5" stroke="rgba(255,255,255,.87)" stroke-width="1.7"/>
    <text x="12" y="16.5" text-anchor="middle"
      font-family="-apple-system,sans-serif" font-size="11" font-weight="700"
      fill="rgba(255,255,255,.87)">€</text>
  </svg>`;
  btn.addEventListener('click',function(e){e.stopPropagation();openModal();});
  pill.appendChild(btn);
}

/* Originales Coin-Flip Widget auf Startseite ausblenden */
(function(){
  var hs=document.createElement('style');
  hs.textContent='#jf-coin-flip-card{display:none!important;}';
  document.head.appendChild(hs);
  new MutationObserver(function(){
    document.querySelectorAll('#jf-coin-flip-card').forEach(function(el){
      el.style.setProperty('display','none','important');
    });
  }).observe(document.body,{childList:true,subtree:true});
})();

function tryInject(){
  if(typeof ApiClient==='undefined')return;
  injectCSS();
  buildPillBtn();
}

setInterval(tryInject,500);
new MutationObserver(tryInject).observe(document.body,{childList:true,subtree:false});

})();
