(function () {
  var TITLES_TO_HIDE = [
    // --- DEUTSCH ---
    'kürzlich hinzugefügte filme',
    'kürzlich hinzugefügte serien',
    'kürzlich hinzugefügt',
    'neueste serien',
    'neueste filme',
    'erneut ansehen',
    'weiterschauen',
    'nächste folge',
    'neueste folgen',
    // --- ENGLISCH ---
    'recently added movies',
    'recently added tv shows',
    'recently added',
    'latest movies',
    'latest tv shows',
    'latest shows',
    'latest episodes',
    'continue watching',
    'next up',
    'watch again'
  ];

  function hideSections() {
    document.querySelectorAll('.verticalSection').forEach(function (section) {
      
      // 1. MyMedia Schutz (Bibliotheks-Icons ganz oben)
      if (section.classList.contains('section0') || 
          section.classList.contains('MyMedia') || 
          section.querySelector('.myMediaButton')) {
        return;
      }

      // 2. Titel-Element finden
      var titleElement = section.querySelector('h2.sectionTitle, .sectionTitle, h2');
      if (!titleElement) return;

      var text = titleElement.textContent.trim().toLowerCase();

      // 3. Discover Schutz (Soll sichtbar bleiben)
      if (text.includes('discover') || text.includes('entdecken')) {
        return;
      }

      // 4. Vergleichen und Ausblenden
      if (TITLES_TO_HIDE.indexOf(text) !== -1) {
        section.style.setProperty('display', 'none', 'important');
      }
    });
  }

  // Start & Beobachtung
  hideSections();
  new MutationObserver(hideSections).observe(document.body, { 
    childList: true, 
    subtree: true 
  });

  setInterval(hideSections, 2000);

  console.log('[EmbyCleaner] DE/EN Filter aktiv (inkl. Watch Again) ✓');
})();
