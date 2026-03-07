/* ═══════════════════════════════════════════
   Bright Icons — js/config.js
   Site-wide feature flags.
   Edit this file to toggle maintenance mode
   or mobile redirect behaviour.
   ═══════════════════════════════════════════ */

const SITE_CONFIG = {

  // ── Maintenance mode ──────────────────────
  // Set to true  → every page redirects to maintenance.html
  // Set to false → site works normally
  maintenance: false,

  // ── Mobile redirect ───────────────────────
  // Set to true  → screens narrower than mobileBreakpoint redirect to mobile-not-ready.html
  // Set to false → no redirect (mobile users see the site as-is)
  mobileRedirect: true,

  // Minimum px width considered "desktop"
  mobileBreakpoint: 1024,

  // ── Right-click protection ────────────────
  // Set to true  → right-click context menu is disabled on all pages
  // Set to false → right-click works normally
  disableRightClick: true,

  // ── Page paths (adjust if your files live in sub-folders) ──
  pages: {
    // Redirect destinations
    maintenance:      'maintenance.html',
    mobileWall:       'mobile-not-ready.html',
    notFound:         '404.html',
    // Main pages
    home:             'index.html',
    editor:           'editor.html',
    gallery:          'gallery.html',
    underDevelopment: 'under-development.html',
  },

};

/* ─────────────────────────────────────────
   DO NOT EDIT BELOW THIS LINE
   This runs automatically on every page.
───────────────────────────────────────── */
(function () {
  const cfg  = SITE_CONFIG;
  const path = window.location.pathname;

  // Helper: is the current page already one of the wall pages?
  function isWallPage() {
    return path.endsWith(cfg.pages.maintenance) ||
           path.endsWith(cfg.pages.mobileWall);
  }

  // 1. Maintenance check — runs first, takes priority
  if (cfg.maintenance && !isWallPage()) {
    window.location.replace(cfg.pages.maintenance);
    return; // stop — no need to check mobile
  }

  // 1b. If maintenance is OFF but user is still on maintenance page → send home
  if (!cfg.maintenance && path.endsWith(cfg.pages.maintenance)) {
    window.location.replace(cfg.pages.home);
    return;
  }

  // 2. Mobile check — only runs when not in maintenance mode
  if (cfg.mobileRedirect && !isWallPage()) {
    const isMobile = window.innerWidth < cfg.mobileBreakpoint ||
                     /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.replace(cfg.pages.mobileWall);
    }
  }
  // 3. Right-click protection
  if (cfg.disableRightClick) {
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });
  }
})();