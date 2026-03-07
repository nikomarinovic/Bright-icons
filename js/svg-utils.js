/* ═══════════════════════════════════════════
   Bright Icons — js/svg-utils.js
   Pure SVG building helpers + export utils.
   No DOM interaction — only pure functions.
   ═══════════════════════════════════════════ */

// ── Geometry helpers ──────────────────────

function hexPts(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

function starPts(cx, cy, R, r) {
  return Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 === 0 ? R : r;
    const a   = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
  }).join(' ');
}

// ── Background shape ──────────────────────

function buildBgShape(sz, col, sh) {
  const h = sz / 2;
  if (sh === 'circle')  return `<circle cx="${h}" cy="${h}" r="${h}" fill="${col}"/>`;
  if (sh === 'square')  return `<rect width="${sz}" height="${sz}" fill="${col}"/>`;
  if (sh === 'hexagon') return `<polygon points="${hexPts(h, h, h)}" fill="${col}"/>`;
  if (sh === 'diamond') return `<polygon points="${h},0 ${sz},${h} ${h},${sz} 0,${h}" fill="${col}"/>`;
  if (sh === 'star')    return `<polygon points="${starPts(h, h, h, h * 0.4)}" fill="${col}"/>`;
  /* default: rounded */  return `<rect width="${sz}" height="${sz}" rx="${sz * 0.2}" fill="${col}"/>`;
}

// ── Clip path (clips content to bg shape) ─

function buildClipPath(sz, sh) {
  const h = sz / 2;
  if (sh === 'circle')  return `<clipPath id="bgc"><circle cx="${h}" cy="${h}" r="${h}"/></clipPath>`;
  if (sh === 'hexagon') return `<clipPath id="bgc"><polygon points="${hexPts(h, h, h)}"/></clipPath>`;
  if (sh === 'diamond') return `<clipPath id="bgc"><polygon points="${h},0 ${sz},${h} ${h},${sz} 0,${h}"/></clipPath>`;
  if (sh === 'star')    return `<clipPath id="bgc"><polygon points="${starPts(h, h, h, h * 0.4)}"/></clipPath>`;
  if (sh === 'square')  return `<clipPath id="bgc"><rect width="${sz}" height="${sz}"/></clipPath>`;
  /* default: rounded */  return `<clipPath id="bgc"><rect width="${sz}" height="${sz}" rx="${sz * 0.2}"/></clipPath>`;
}

// ── Background pattern ────────────────────

function buildPatternDef(p) {
  const s = 16;
  if (p === 'dots')     return `<pattern id="bp" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><circle cx="${s/2}" cy="${s/2}" r="1.5" fill="white" opacity=".12"/></pattern>`;
  if (p === 'grid')     return `<pattern id="bp" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="white" stroke-width=".5" opacity=".15"/></pattern>`;
  if (p === 'diagonal') return `<pattern id="bp" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><path d="M 0 ${s} L ${s} 0" stroke="white" stroke-width=".5" opacity=".15"/></pattern>`;
  if (p === 'cross')    return `<pattern id="bp" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><path d="M 0 ${s} L ${s} 0 M 0 0 L ${s} ${s}" stroke="white" stroke-width=".5" opacity=".1"/></pattern>`;
  return '';
}

// ── SVG string helpers ─────────────────────

/**
 * Extracts the inner content from a full <svg>…</svg> string.
 * Falls back to returning the input unchanged if no <svg> tag found.
 */
function extractInner(svgStr) {
  if (!svgStr || !svgStr.includes('<svg')) return svgStr || '';
  const m = svgStr.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  return m ? m[1] : svgStr;
}

/** Minimal XML-safe escaping for text content. */
function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Object markup builder ─────────────────

/**
 * Builds the SVG markup for a single layer object.
 * Returns { mk: string, defs: string }
 */
function buildObjMarkup(obj, sz) {
  const half  = sz / 2;
  const cx    = half + (obj.ox || 0);
  const cy    = half + (obj.oy || 0);
  const op    = obj.op  ?? 1;
  const rot   = obj.rot || 0;
  const sc    = obj.sc  || 1;

  let defs  = '';
  let fattr = '';

  // Colorise SVG/raster icons via SVG filter
  if ((obj.type === 'svg' || obj.type === 'raster') && obj.color) {
    const fid = `f_${obj.id}`;
    defs  = `<filter id="${fid}" color-interpolation-filters="sRGB">` +
              `<feFlood flood-color="${obj.color}" result="c"/>` +
              `<feComposite in="c" in2="SourceAlpha" operator="in"/>` +
            `</filter>`;
    fattr = ` filter="url(#${fid})"`;
  }

  let mk = '';

  /* SVG icon */
  /* SVG icon */
  if (obj.type === 'svg' && obj.content) {
    const base = sz * 0.6;
    const w = base * sc, h = base * sc;
    const inner = extractInner(obj.content);

    mk = `<g opacity="${op}" transform="translate(${cx},${cy}) rotate(${rot})"${fattr}>`
      + `<svg x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" viewBox="0 0 24 24"`
      + ` fill="none"`
      + ` stroke="currentColor"`
      + ` stroke-width="2"`
      + ` stroke-linecap="round"`
      + ` stroke-linejoin="round">`
      + inner
      + `</svg>`
      + `</g>`;

  /* Raster image */
  } else if (obj.type === 'raster' && obj.content) {
    const base = sz * 0.6;
    const w = base * sc, h = base * sc;
    mk = `<g opacity="${op}" transform="translate(${cx},${cy}) rotate(${rot})"${fattr}>` +
           `<image href="${obj.content}" x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>` +
         `</g>`;

  /* Shape */
  } else if (obj.type === 'shape') {
    const col  = obj.color || '#ffffff';
    const base = sz * 0.25;
    const s    = base * sc;
    let shp    = '';

    switch (obj.shape) {
      case 'circle':   shp = `<circle cx="0" cy="0" r="${s}" fill="${col}"/>`; break;
      case 'square':   shp = `<rect x="${-s}" y="${-s}" width="${s*2}" height="${s*2}" fill="${col}"/>`; break;
      case 'rounded':  shp = `<rect x="${-s}" y="${-s}" width="${s*2}" height="${s*2}" rx="${s*.25}" fill="${col}"/>`; break;
      case 'triangle': shp = `<polygon points="0,${-s} ${s},${s} ${-s},${s}" fill="${col}"/>`; break;
      case 'diamond':  shp = `<polygon points="0,${-s} ${s},0 0,${s} ${-s},0" fill="${col}"/>`; break;
      case 'star':     shp = `<polygon points="${starPts(0, 0, s, s * 0.4)}" fill="${col}"/>`; break;
      case 'ring':     shp = `<circle cx="0" cy="0" r="${s}" fill="none" stroke="${col}" stroke-width="${Math.max(2, s * 0.18)}"/>`; break;
      case 'line':     shp = `<line x1="${-s}" y1="0" x2="${s}" y2="0" stroke="${col}" stroke-width="${Math.max(2, s * 0.12)}" stroke-linecap="round"/>`; break;
      default:         shp = `<circle cx="0" cy="0" r="${s}" fill="${col}"/>`; break;
    }
    mk = `<g opacity="${op}" transform="translate(${cx},${cy}) rotate(${rot})">${shp}</g>`;

  /* Text */
  } else if (obj.type === 'text') {
    const col = obj.color || '#ffffff';
    const fs  = (obj.fontSize || 80) * sc;
    mk = `<g opacity="${op}" transform="translate(${cx},${cy}) rotate(${rot})">` +
           `<text x="0" y="0" text-anchor="middle" dominant-baseline="central"` +
             ` fill="${col}" font-size="${fs}"` +
             ` font-family="${obj.fontFamily || 'Arial, sans-serif'}"` +
             ` font-weight="${obj.fontWeight || 'bold'}">${escXml(obj.text || 'A')}</text>` +
         `</g>`;
  }

  return { mk, defs };
}

// ── Full SVG builder ──────────────────────

/**
 * Assembles the complete SVG string from editor state.
 * @param {Object} state  Editor state object.
 * @returns {string}      Full SVG markup.
 */
function buildSVG(state) {
  const { bgColor, bgShape, bgPattern, size, objects } = state;

  let defs = buildClipPath(size, bgShape);
  if (bgPattern !== 'none') defs += buildPatternDef(bgPattern);

  let objMarkup = '';
  objects.forEach(obj => {
    const { mk, defs: d } = buildObjMarkup(obj, size);
    if (d) defs += d;
    objMarkup += mk + '\n  ';
  });

  const bg = buildBgShape(size, bgColor, bgShape);
  const patternOverlay = bgPattern !== 'none'
    ? `<rect width="${size}" height="${size}" fill="url(#bp)" clip-path="url(#bgc)"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"` +
         ` viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
         `\n  <defs>${defs}</defs>\n  ${bg}\n  ${patternOverlay}\n  ${objMarkup}\n</svg>`;
}

// ── Parsing helpers ───────────────────────

/**
 * Parses a pasted SVG string and normalises it to
 * a clean <svg viewBox="…">…</svg> form.
 */
function parseSvgInput(txt) {
  try {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(txt.trim(), 'image/svg+xml');
    const el     = doc.querySelector('svg');
    if (!el) return txt;
    let vb = el.getAttribute('viewBox');
    if (!vb) {
      const w = el.getAttribute('width')  || '24';
      const h = el.getAttribute('height') || '24';
      vb = `0 0 ${parseFloat(w)} ${parseFloat(h)}`;
    }
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${el.innerHTML}</svg>`;
  } catch (e) { return txt; }
}

/** Reads a File as a base-64 data URL. */
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// ── Export helpers ────────────────────────

function _downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function exportSvg(state, filename = 'icon.svg') {
  const svg = buildSVG(state);
  _downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), filename);
}

function exportRaster(state, format, filename) {
  const svg    = buildSVG(state);
  const canvas = document.createElement('canvas');
  const sz     = state.size * 4;       // 4× for crisp raster output
  canvas.width  = sz;
  canvas.height = sz;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  img.onload = () => {
    ctx.drawImage(img, 0, 0, sz, sz);
    URL.revokeObjectURL(url);
    canvas.toBlob(blob => { if (blob) _downloadBlob(blob, filename); }, `image/${format}`, 0.95);
  };
  img.src = url;
}

async function copySvgToClipboard(state) {
  await navigator.clipboard.writeText(buildSVG(state));
}

// ── Canvas border-radius helper ───────────

function getBorderRadius(shape) {
  if (shape === 'circle')                             return '50%';
  if (shape === 'square' || shape === 'hexagon' ||
      shape === 'diamond' || shape === 'star')        return '0';
  return '20%';   /* rounded */
}

// ── Expose to global scope ────────────────
window.buildSVG           = buildSVG;
window.buildObjMarkup     = buildObjMarkup;
window.extractInner       = extractInner;
window.parseSvgInput      = parseSvgInput;
window.fileToBase64       = fileToBase64;
window.exportSvg          = exportSvg;
window.exportRaster       = exportRaster;
window.copySvgToClipboard = copySvgToClipboard;
window.getBorderRadius    = getBorderRadius;
