/* ═══════════════════════════════════════════════════════════════
   Bright Icons — js/icon-registry.js

   Loads icons from /data/icons.json.
   Each icon has lightCode / darkCode (raw SVG markup) embedded
   directly in the JSON — no separate image fetches needed.

   To regenerate after adding/removing SVG files:
     cd public/dev && python generate_icons.py
═══════════════════════════════════════════════════════════════ */

async function loadIcons() {
  const res = await fetch('/data/icons.json');
  if (!res.ok) throw new Error(
    `Could not load /data/icons.json (HTTP ${res.status}). ` +
    `Run: cd public/dev && python generate_icons.py`
  );
  return await res.json();
}

/* ── Convert raw SVG string → object URL usable in <img src> ── */
function svgToObjectURL(svgCode) {
  const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(blob);
}

/* ── Download helpers ───────────────────────────────────────── */
async function downloadAs(svgCode, filename, type) {
  if (type === 'svg') {
    triggerDownload(new Blob([svgCode], { type: 'image/svg+xml' }), filename);
    return;
  }
  const blob = await svgToImageBlob(svgCode, type);
  triggerDownload(blob, filename);
}

function triggerDownload(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ── SVG string → PNG / JPG Blob via Canvas ────────────────── */
function svgToImageBlob(svgCode, format) {
  return new Promise((resolve, reject) => {
    const size = 512;
    const img  = new Image();
    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (format === 'jpg') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size); }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('toBlob failed')),
        format === 'jpg' ? 'image/jpeg' : 'image/png',
        0.95
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')); };
    img.src = url;
  });
}

/* ── Copy SVG code to clipboard ─────────────────────────────── */
async function copyIconSVG(svgCode) {
  await navigator.clipboard.writeText(svgCode);
}