(function () {
  if (window.innerWidth < 1024) return;

  const style = document.createElement('style');
  style.textContent = `
    @media (min-width: 1024px) {
      .ratings-plugin-container {
        position: relative !important;
        bottom: auto !important;
        left: auto !important;
        top: auto !important;
        z-index: auto !important;
        display: block !important;
        margin-bottom: 12px !important;
      }
    }
  `;
  document.head.appendChild(style);

  function fix() {
    const ratings = document.querySelector('.ratings-plugin-container');
    const title   = document.querySelector('.nameContainer') 
                 || document.querySelector('h1') 
                 || document.querySelector('.itemName');
    if (!ratings || !title) return;
    if (title.previousSibling === ratings) return;
    title.parentNode.insertBefore(ratings, title);
  }

  fix();
  new MutationObserver(fix).observe(document.body, { childList: true, subtree: true });
  setInterval(fix, 300);
})();
