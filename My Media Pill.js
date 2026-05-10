(function () {
    'use strict';
    const ICONS = {
        series: `<svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" fill="currentColor"/></svg>`,
        movies: `<svg viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" fill="currentColor"/></svg>`
    };
    function injectStyles() {
        if (document.getElementById('jf-pills-style')) return;
        const s = document.createElement('style');
        s.id = 'jf-pills-style';
        s.textContent = `
            #jf-media-pills { display: flex; justify-content: center; padding: 20px 16px; width: 100%; box-sizing: border-box; }
            .jf-pill-wrap { 
                display: flex; border-radius: 999px; overflow: hidden; 
                border: 1.5px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); 
            }
            .jf-pill-wrap::before, .jf-pill-wrap::after { display: none !important; }
            .jf-pill { 
                display: inline-flex; flex-direction: column; align-items: center; 
                padding: 8px clamp(24px, 15vw, 180px) !important; cursor: pointer; background: transparent; border: none; color: inherit; opacity: 0.65; transition: background 0.2s, opacity 0.2s;
                border-radius: 0;
            }
            .jf-pill::before, .jf-pill::after { display: none !important; }
            #p-ser { border-right: 1.5px solid rgba(255,255,255,0.3); }
            #p-ser:hover, #p-mov:hover { 
                background: rgba(255,255,255,0.12) !important;
                opacity: 1;
            }
            .jf-pill svg { width: 24px; height: 24px; }
            .jf-pill span { font-size: 0.85em; margin-top: 4px; font-weight: 500; }
        `;
        document.head.appendChild(s);
    }
    function patchMedia() {
        if (document.getElementById('jf-media-pills') || !window.location.href.includes('home')) return;
        const section = document.querySelector('.verticalSection.MyMedia');
        if (!section) return;
        const links = section.querySelectorAll('a[href]');
        if (links.length < 2) return;
        section.style.setProperty('display', 'none', 'important');
        injectStyles();
        const outer = document.createElement('div');
        outer.id = 'jf-media-pills';
        outer.innerHTML = `
            <div class="jf-pill-wrap">
                <div class="jf-pill" id="p-ser">${ICONS.series}<span>Series</span></div>
                <div class="jf-pill" id="p-mov">${ICONS.movies}<span>Movies</span></div>
            </div>`;
        section.parentNode.insertBefore(outer, section.nextSibling);
        document.getElementById('p-ser').onclick = () => links[0].click();
        document.getElementById('p-mov').onclick = () => links[1].click();
    }
    setInterval(patchMedia, 1000);
    patchMedia();
})();
