/* ═══════════════════════════════════════════
   Bright Icons — js/config.js
   Site-wide feature flags.
   Last saved: 2026-03-08T11:23:51.350Z
   ═══════════════════════════════════════════ */
const SITE_CONFIG = {
  maintenance:       false,
  mobileRedirect:    true,
  mobileBreakpoint:  1024,
  disableRightClick: true,
  pages: {
    maintenance:      'maintenance.html',
    mobileWall:       'mobile-not-ready.html',
    notFound:         '404.html',
    home:             'index.html',
    editor:           'editor.html',
    gallery:          'gallery.html',
    underDevelopment: 'under-development.html',
  },
};
/* ─────────────────────────────────────────
   DO NOT EDIT BELOW THIS LINE
───────────────────────────────────────── */
(function(){
  const cfg=SITE_CONFIG,path=window.location.pathname;
  function isWallPage(){return path.endsWith(cfg.pages.maintenance)||path.endsWith(cfg.pages.mobileWall);}
  if(cfg.maintenance&&!isWallPage()){window.location.replace(cfg.pages.maintenance);return;}
  if(!cfg.maintenance&&path.endsWith(cfg.pages.maintenance)){window.location.replace(cfg.pages.home);return;}
  if(cfg.mobileRedirect&&!isWallPage()){
    const bypassed=sessionStorage.getItem('mobileBypass')==='true';
    if(!bypassed){const isMobile=window.innerWidth<cfg.mobileBreakpoint||/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);if(isMobile){window.location.replace(cfg.pages.mobileWall);}}
  }
  if(cfg.disableRightClick){document.addEventListener('contextmenu',function(e){e.preventDefault();});}
})();