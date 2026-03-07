/* ═══════════════════════════════════════════
   Bright Icons — js/editor.js
   All DOM interactions, state management,
   layer rendering, object controls, drag,
   background controls, icon modal & export.

   Depends on (loaded before this file):
     js/icons.js      → ICONS array
     js/svg-utils.js  → buildSVG, parseSvgInput, etc.
   ═══════════════════════════════════════════ */

// ═══════════════════════════════════════════
// COLOR PALETTES
// ═══════════════════════════════════════════

const BG_COLORS = [
  '#fca5a5','#f87171','#ef4444','#dc2626','#b91c1c','#7f1d1d',
  '#fdba74','#fb923c','#f97316','#ea580c','#c2410c','#7c2d12',
  '#fde047','#facc15','#eab308','#ca8a04','#a16207','#713f12',
  '#86efac','#4ade80','#22c55e','#16a34a','#15803d','#14532d','#238636',
  '#5eead4','#2dd4bf','#14b8a6','#0d9488','#0f766e','#134e4a',
  '#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e3a8a','#1f6feb',
  '#c4b5fd','#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#4c1d95',
  '#f9a8d4','#f472b6','#ec4899','#db2777','#be185d','#831843',
  '#f5f5f5','#d4d4d4','#9ca3af','#6b7280','#4b5563','#374151',
  '#1f2937','#111827','#0d1117','#000000',
  '#e34f26','#3178c6','#f7df1e','#61dafb','#ff6b6b','#6bcb77','#4d96ff',
];

const OBJ_COLORS = [
  null,
  '#ffffff','#f5f5f5','#000000','#1a1a1a',
  '#ef4444','#dc2626','#fca5a5',
  '#f97316','#ea580c','#fdba74',
  '#eab308','#ca8a04','#fde047',
  '#22c55e','#16a34a','#86efac',
  '#14b8a6','#0d9488','#5eead4',
  '#3b82f6','#2563eb','#93c5fd',
  '#8b5cf6','#7c3aed','#c4b5fd',
  '#ec4899','#db2777','#f9a8d4',
  '#6366f1','#4f46e5','#a5b4fc',
  '#06b6d4','#0891b2','#67e8f9',
  '#f43f5e','#e11d48','#fda4af',
  '#84cc16','#65a30d','#bef264',
  '#ff6b6b','#ffd93d','#6bcb77','#4d96ff',
  '#238636','#1f6feb','#e34f26','#3178c6','#f7df1e',
];

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════

const S = {
  bgColor:  '#238636',
  bgShape:  'rounded',
  bgPattern:'none',
  size:     256,
  snap:     false,
  gridSize: 16,
  objects:  [],   // array of layer objects
  selId:    null, // id of selected object
};

let _oidCounter = 1;
const newId  = () => 'o' + (_oidCounter++);
const getSel = () => S.objects.find(o => o.id === S.selId) || null;

// ═══════════════════════════════════════════
// CANVAS RENDER
// ═══════════════════════════════════════════

function renderCanvas() {
  const box = document.getElementById('canvas-box');
  if (!box) return;
  box.innerHTML = buildSVG(S);
  const svg = box.querySelector('svg');
  if (svg) { svg.style.width = '100%'; svg.style.height = '100%'; svg.id = 'canvas-svg'; }
  box.style.borderRadius = getBorderRadius(S.bgShape);
  box.style.boxShadow    = `0 8px 40px ${S.bgColor}55`;
  box.classList.toggle('has-sel', !!S.selId);
  _updateInfo();
}

function _updateInfo() {
  const sel = getSel();
  const el  = document.getElementById('canvas-info');
  if (!el) return;
  if (sel) {
    el.innerHTML = `<span>${sel.name}</span><span>•</span>` +
                   `<span>X:${Math.round(sel.ox)} Y:${Math.round(sel.oy)}</span><span>•</span>` +
                   `<span>${sel.rot || 0}°</span><span>•</span>` +
                   `<span>${Math.round((sel.sc || 1) * 100)}%</span>`;
  } else {
    el.innerHTML = '<span>Click a layer then drag to move</span>';
  }
}

// ═══════════════════════════════════════════
// LAYERS PANEL
// ═══════════════════════════════════════════

function renderLayers() {
  const panel = document.getElementById('layers-panel');
  if (!panel) return;

  if (!S.objects.length) {
    panel.innerHTML = '<div class="empty-msg">No objects yet.<br>Add icons or shapes above.</div>';
    return;
  }

  // Reverse so the topmost layer appears first
  panel.innerHTML = [...S.objects].reverse().map(obj => {
    const sel = obj.id === S.selId;
    return `<div class="layer-row${sel ? ' sel' : ''}" data-id="${obj.id}" onclick="selObj('${obj.id}')">
      <div class="layer-thumb">${_layerThumb(obj)}</div>
      <span class="layer-lbl">${obj.name}</span>
      <div class="layer-acts">
        <button class="lact"     onclick="event.stopPropagation();mvUp('${obj.id}')"   title="Move up">↑</button>
        <button class="lact"     onclick="event.stopPropagation();mvDown('${obj.id}')" title="Move down">↓</button>
        <button class="lact del" onclick="event.stopPropagation();delObj('${obj.id}')" title="Delete">✕</button>
      </div>
    </div>`;
  }).join('');
}

function _layerThumb(obj) {
  if (obj.type === 'svg' && obj.content) {
    const inner = extractInner(obj.content);
    return `<svg viewBox="0 0 24 24" width="13" height="13" style="color:${obj.color || '#c9d1d9'}" overflow="visible">${inner}</svg>`;
  }
  if (obj.type === 'raster' && obj.content)
    return `<img src="${obj.content}" style="width:13px;height:13px;object-fit:contain;border-radius:2px"/>`;
  if (obj.type === 'text')
    return `<span style="font-weight:bold;color:${obj.color || '#fff'};font-size:10px">${(obj.text || 'A').charAt(0)}</span>`;
  if (obj.type === 'shape') {
    const c  = obj.color || '#fff';
    const th = {
      circle:   `<svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="9" fill="${c}"/></svg>`,
      square:   `<svg viewBox="0 0 24 24" width="13" height="13"><rect x="3" y="3" width="18" height="18" fill="${c}"/></svg>`,
      rounded:  `<svg viewBox="0 0 24 24" width="13" height="13"><rect x="3" y="3" width="18" height="18" rx="4" fill="${c}"/></svg>`,
      triangle: `<svg viewBox="0 0 24 24" width="13" height="13"><polygon points="12,3 21,21 3,21" fill="${c}"/></svg>`,
      diamond:  `<svg viewBox="0 0 24 24" width="13" height="13"><polygon points="12,2 22,12 12,22 2,12" fill="${c}"/></svg>`,
      star:     `<svg viewBox="0 0 24 24" width="13" height="13"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="${c}"/></svg>`,
      ring:     `<svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="8" fill="none" stroke="${c}" stroke-width="2.5"/></svg>`,
      line:     `<svg viewBox="0 0 24 24" width="13" height="13"><line x1="3" y1="12" x2="21" y2="12" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    };
    return th[obj.shape] || th.circle;
  }
  return '?';
}

// ═══════════════════════════════════════════
// OBJECT CONTROLS PANEL
// ═══════════════════════════════════════════

function renderObjCtrl() {
  const panel = document.getElementById('obj-ctrl');
  if (!panel) return;

  const sel = getSel();
  if (!sel) {
    panel.innerHTML = '<div class="empty-msg">Select a layer to edit.</div>';
    return;
  }

  const isSh = sel.type === 'shape';
  const isTx = sel.type === 'text';

  // Color palette HTML
  const palHtml = (current) => OBJ_COLORS.map(c => {
    if (c === null)
      return `<button class="swatch transparent-swatch${current === null ? ' active' : ''}" onclick="updSel({color:null})" title="Original/Inherit">⊘</button>`;
    return `<button class="swatch${current === c ? ' active' : ''}" style="background:${c}" onclick="updSel({color:'${c}'})" title="${c}"></button>`;
  }).join('');

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;gap:.4rem">
      <span style="font-family:var(--font-mono);font-size:.72rem;font-weight:600;color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sel.name}</span>
      <button class="danger-btn" onclick="delObj('${sel.id}')">Delete</button>
    </div>

    ${isTx ? `
      <div class="ctrl-lbl">Text Content</div>
      <input type="text" class="text-inp" id="ctrl-text" value="${sel.text || 'A'}" style="width:100%;margin-bottom:.5rem" placeholder="Type text…"/>
      <div class="ctrl-lbl">Font Size <span id="lbl-fs">${sel.fontSize || 80}px</span></div>
      <input type="range" id="ctrl-fs" min="8" max="200" value="${sel.fontSize || 80}" style="margin-bottom:.5rem"/>
      <div class="ctrl-lbl" style="margin-bottom:.25rem">Weight</div>
      <div style="display:flex;gap:.25rem;margin-bottom:.5rem">
        <button class="sec-btn${(sel.fontWeight || 'bold') === 'bold'   ? ' active' : ''}" onclick="updSel({fontWeight:'bold'});renderObjCtrl()">Bold</button>
        <button class="sec-btn${(sel.fontWeight || 'bold') === 'normal' ? ' active' : ''}" onclick="updSel({fontWeight:'normal'});renderObjCtrl()">Normal</button>
      </div>
    ` : ''}

    ${isSh ? `
      <div class="ctrl-lbl" style="margin-bottom:.25rem">Shape</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.25rem;margin-bottom:.5rem">
        ${[['circle','●'],['square','■'],['rounded','▢'],['triangle','▲'],
           ['diamond','◆'],['star','★'],['ring','○'],['line','—']].map(([v, ic]) =>
          `<button class="sbtn${sel.shape === v ? ' active' : ''}"
             style="font-size:.75rem"
             onclick="updSel({shape:'${v}',name:'${v.charAt(0).toUpperCase() + v.slice(1)}'});renderObjCtrl()"
             title="${v}">${ic}</button>`).join('')}
      </div>
    ` : ''}

    <div class="ctrl-lbl">Scale <span id="lbl-sc">${Math.round((sel.sc || 1) * 100)}%</span></div>
    <input type="range" id="ctrl-sc" min=".05" max="5" step=".05" value="${sel.sc || 1}" style="margin-bottom:.5rem"/>

    <div class="ctrl-lbl">Rotation <span id="lbl-rot">${sel.rot || 0}°</span></div>
    <input type="range" id="ctrl-rot" min="0" max="360" value="${sel.rot || 0}" style="margin-bottom:.25rem"/>
    <div class="rot-presets" style="margin-bottom:.5rem">
      ${[0, 45, 90, 135, 180, 225, 270, 315].map(d =>
        `<button class="rot-btn${(sel.rot || 0) === d ? ' active' : ''}"
           onclick="updSel({rot:${d}});renderObjCtrl()">${d}°</button>`).join('')}
    </div>

    <div class="ctrl-lbl">Opacity <span id="lbl-op">${Math.round((sel.op ?? 1) * 100)}%</span></div>
    <input type="range" id="ctrl-op" min=".05" max="1" step=".05" value="${sel.op ?? 1}" style="margin-bottom:.5rem"/>

    <div class="ctrl-lbl" style="margin-bottom:.25rem">Position</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:.5rem">
      <div>
        <div style="font-family:var(--font-mono);font-size:.6rem;color:var(--muted-fg);margin-bottom:.15rem">X offset</div>
        <input type="number" id="ctrl-x" class="text-inp" value="${Math.round(sel.ox || 0)}" style="width:100%"/>
      </div>
      <div>
        <div style="font-family:var(--font-mono);font-size:.6rem;color:var(--muted-fg);margin-bottom:.15rem">Y offset</div>
        <input type="number" id="ctrl-y" class="text-inp" value="${Math.round(sel.oy || 0)}" style="width:100%"/>
      </div>
    </div>

    <div class="ctrl-lbl" style="margin-bottom:.3rem">Color</div>
    <div class="pal" style="margin-bottom:.3rem">${palHtml(sel.color)}</div>
    ${sel.color != null ? `
      <div class="color-row" style="margin-bottom:.5rem">
        <input type="color" class="color-picker" id="ctrl-cp" value="${sel.color}"/>
        <input type="text"  class="text-inp"     id="ctrl-ch" value="${sel.color}" placeholder="#rrggbb"/>
      </div>` : ''}

    <button class="sec-btn" style="width:100%;margin-top:.25rem"
      onclick="updSel({ox:0,oy:0,sc:1,rot:0});renderObjCtrl()">↺ Reset Transform</button>
  `;

  // ── Wire live inputs ──────────────────────
  const wire = (id, fn, ev = 'input') => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(ev, e => fn(e.target.value));
  };

  // Text input – use 'input' but do NOT rebuild the panel (avoids cursor reset)
  const txtEl = document.getElementById('ctrl-text');
  if (txtEl) {
    txtEl.addEventListener('input', e => {
      updSel({ text: e.target.value, name: 'Text: ' + (e.target.value || '').substring(0, 12) });
    });
  }

  wire('ctrl-fs',  v => { updSel({ fontSize: +v });   document.getElementById('lbl-fs').textContent  = v + 'px'; });
  wire('ctrl-sc',  v => { updSel({ sc: +v });          document.getElementById('lbl-sc').textContent  = Math.round(v * 100) + '%'; });
  wire('ctrl-rot', v => { updSel({ rot: +v });         document.getElementById('lbl-rot').textContent = v + '°'; });
  wire('ctrl-op',  v => { updSel({ op: +v });          document.getElementById('lbl-op').textContent  = Math.round(v * 100) + '%'; });
  wire('ctrl-x',   v => updSel({ ox: +v || 0 }), 'change');
  wire('ctrl-y',   v => updSel({ oy: +v || 0 }), 'change');
  wire('ctrl-cp',  v => {
    updSel({ color: v });
    const t = document.getElementById('ctrl-ch'); if (t) t.value = v;
  });
  wire('ctrl-ch',  v => {
    if (/^#[0-9a-f]{3,6}$/i.test(v)) {
      updSel({ color: v });
      const p = document.getElementById('ctrl-cp'); if (p) p.value = v;
    }
  });
}

// Expose so inline onclick handlers in the generated HTML can call it
window.renderObjCtrl = renderObjCtrl;

// Full re-render convenience
function render() { renderCanvas(); renderLayers(); renderObjCtrl(); }

// ═══════════════════════════════════════════
// OBJECT CRUD
// ═══════════════════════════════════════════

function selObj(id) {
  S.selId = id;
  renderLayers(); renderObjCtrl(); _updateInfo(); renderCanvas();
}
window.selObj = selObj;

function updSel(partial) {
  if (!S.selId) return;
  S.objects = S.objects.map(o => o.id === S.selId ? { ...o, ...partial } : o);
  renderCanvas(); renderLayers(); _updateInfo();
}
window.updSel = updSel;

function delObj(id) {
  S.objects = S.objects.filter(o => o.id !== id);
  if (S.selId === id) S.selId = null;
  render();
}
window.delObj = delObj;

function mvUp(id) {
  const i = S.objects.findIndex(o => o.id === id);
  if (i < S.objects.length - 1) {
    [S.objects[i], S.objects[i + 1]] = [S.objects[i + 1], S.objects[i]];
    renderCanvas(); renderLayers();
  }
}
window.mvUp = mvUp;

function mvDown(id) {
  const i = S.objects.findIndex(o => o.id === id);
  if (i > 0) {
    [S.objects[i], S.objects[i - 1]] = [S.objects[i - 1], S.objects[i]];
    renderCanvas(); renderLayers();
  }
}
window.mvDown = mvDown;

// ── Object factory helpers ─────────────────

function _base(type) {
  return { id: newId(), type, ox: 0, oy: 0, sc: 1, rot: 0, op: 1, color: null };
}

function addIcon(svgStr, name) {
  const o = { ..._base('svg'), content: svgStr, name: name || 'Icon' };
  S.objects.push(o); S.selId = o.id; render();
}
window.addIcon = addIcon;

function addShape(shape) {
  const names = { circle:'Circle', square:'Square', rounded:'Rounded', triangle:'Triangle',
                  diamond:'Diamond', star:'Star', ring:'Ring', line:'Line' };
  const o = { ..._base('shape'), shape, name: names[shape] || shape, color: '#ffffff' };
  S.objects.push(o); S.selId = o.id; render();
}
window.addShape = addShape;

function addText() {
  const o = { ..._base('text'), text: 'Hello', fontSize: 40,
              fontFamily: 'Arial, sans-serif', fontWeight: 'bold',
              name: 'Text', color: '#ffffff' };
  S.objects.push(o); S.selId = o.id; render();
}

async function addFile(file) {
  let o;
  if (file.type === 'image/svg+xml') {
    const txt = await file.text();
    o = { ..._base('svg'), content: parseSvgInput(txt), name: file.name.replace(/\.svg$/i, '') };
  } else {
    const b64 = await fileToBase64(file);
    o = { ..._base('raster'), content: b64, name: file.name.split('.')[0] };
  }
  S.objects.push(o); S.selId = o.id; render();
}

// ═══════════════════════════════════════════
// CANVAS DRAG
// ═══════════════════════════════════════════

function initDrag() {
  const box = document.getElementById('canvas-box');
  if (!box) return;

  let dragging = false, pid = null;
  let startC = { x: 0, y: 0 }, startO = { x: 0, y: 0 };

  box.addEventListener('pointerdown', e => {
    if (!S.selId) return;
    dragging = true; pid = e.pointerId;
    startC   = { x: e.clientX, y: e.clientY };
    const sel = getSel();
    startO   = { x: sel?.ox || 0, y: sel?.oy || 0 };
    box.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  box.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== pid) return;
    const rect = box.getBoundingClientRect();
    const sf   = S.size / rect.width;
    let dx = (e.clientX - startC.x) * sf;
    let dy = (e.clientY - startC.y) * sf;
    if (S.snap) {
      dx = Math.round(dx / S.gridSize) * S.gridSize;
      dy = Math.round(dy / S.gridSize) * S.gridSize;
    }
    S.objects = S.objects.map(o =>
      o.id === S.selId ? { ...o, ox: startO.x + dx, oy: startO.y + dy } : o
    );
    renderCanvas(); _updateInfo();
  });

  box.addEventListener('pointerup', e => {
    if (e.pointerId !== pid) return;
    dragging = false; pid = null;
    // Sync position number inputs after drag
    const sel = getSel();
    if (sel) {
      const cx = document.getElementById('ctrl-x');
      const cy = document.getElementById('ctrl-y');
      if (cx) cx.value = Math.round(sel.ox || 0);
      if (cy) cy.value = Math.round(sel.oy || 0);
    }
  });

  box.addEventListener('pointerleave', e => { if (e.pointerId === pid) dragging = false; });
}

// ═══════════════════════════════════════════
// BACKGROUND CONTROLS
// ═══════════════════════════════════════════

function initBg() {
  // Color palette
  const pal = document.getElementById('bg-pal');
  if (pal) {
    pal.innerHTML = BG_COLORS.map(c =>
      `<button class="swatch${S.bgColor === c ? ' active' : ''}" style="background:${c}" data-c="${c}" title="${c}"></button>`
    ).join('');
    pal.addEventListener('click', e => {
      const btn = e.target.closest('[data-c]'); if (!btn) return;
      S.bgColor = btn.dataset.c;
      document.getElementById('bg-picker').value = S.bgColor;
      document.getElementById('bg-hex').value    = S.bgColor;
      _syncBgPal(); renderCanvas();
    });
  }

  const picker = document.getElementById('bg-picker');
  const hex    = document.getElementById('bg-hex');
  if (picker) picker.addEventListener('input', e => {
    S.bgColor = e.target.value; if (hex) hex.value = S.bgColor; _syncBgPal(); renderCanvas();
  });
  if (hex) hex.addEventListener('input', e => {
    S.bgColor = e.target.value; if (picker) picker.value = S.bgColor; _syncBgPal(); renderCanvas();
  });

  // Background shape
  document.querySelectorAll('[data-shape]').forEach(b => b.addEventListener('click', () => {
    S.bgShape = b.dataset.shape;
    document.querySelectorAll('[data-shape]').forEach(x => x.classList.toggle('active', x.dataset.shape === S.bgShape));
    renderCanvas();
  }));

  // Background pattern
  document.querySelectorAll('[data-pattern]').forEach(b => b.addEventListener('click', () => {
    S.bgPattern = b.dataset.pattern;
    document.querySelectorAll('[data-pattern]').forEach(x => x.classList.toggle('active', x.dataset.pattern === S.bgPattern));
    renderCanvas();
  }));

  // Snap to grid
  const snapBtn = document.getElementById('snap-btn');
  if (snapBtn) snapBtn.addEventListener('click', () => {
    S.snap = !S.snap;
    snapBtn.textContent = S.snap ? 'On' : 'Off';
    snapBtn.classList.toggle('active', S.snap);
    document.getElementById('grid-size-row').style.display = S.snap ? 'flex' : 'none';
  });

  const gs = document.getElementById('grid-slider');
  if (gs) gs.addEventListener('input', e => {
    S.gridSize = +e.target.value;
    document.getElementById('grid-val').textContent = S.gridSize;
  });
}

function _syncBgPal() {
  document.querySelectorAll('#bg-pal .swatch').forEach(b =>
    b.classList.toggle('active', b.dataset.c === S.bgColor)
  );
}

// ═══════════════════════════════════════════
// ICON PICKER MODAL
// ═══════════════════════════════════════════

let _iconCb = null;

function openIconModal(cb) {
  _iconCb = cb;
  document.getElementById('icon-modal').classList.add('open');
  const s = document.getElementById('icon-search');
  s.value = '';
  _renderIconGrid('');
  setTimeout(() => s.focus(), 50);
}

function closeIconModal() {
  document.getElementById('icon-modal').classList.remove('open');
  _iconCb = null;
}
window.closeIconModal = closeIconModal;

function _renderIconGrid(q) {
  const grid = document.getElementById('icons-grid');
  const cnt  = document.getElementById('icon-count');
  const lq   = q.toLowerCase().trim();
  const filtered = lq ? ICONS.filter(i => i.n.toLowerCase().includes(lq) || i.c.includes(lq)) : ICONS;
  const shown    = filtered.slice(0, 300);
  if (cnt) cnt.textContent = `${shown.length} of ${filtered.length} icons`;
  grid.innerHTML = shown.map(ic =>
    `<button class="icon-btn" data-n="${ic.n.replace(/"/g, '&quot;')}" title="${ic.n}">` +
      ic.s + `<span class="icon-tooltip">${ic.n}</span>` +
    `</button>`
  ).join('');
  grid.querySelectorAll('.icon-btn').forEach(b => b.addEventListener('click', () => {
    const icon = ICONS.find(i => i.n === b.dataset.n);
    if (icon && _iconCb) _iconCb(icon.s, icon.n);
    closeIconModal();
  }));
}

// ═══════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════

async function _handleCopy(btn) {
  await copySvgToClipboard(S);
  btn.textContent = '✓ Copied!'; btn.classList.add('copied');
  setTimeout(() => { btn.textContent = 'Copy SVG'; btn.classList.remove('copied'); }, 2000);
}

// ═══════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  renderCanvas(); renderLayers(); renderObjCtrl();
  initDrag(); initBg();

  // Export buttons
  document.getElementById('export-svg-btn').addEventListener('click', () => exportSvg(S));
  document.getElementById('export-png-btn').addEventListener('click', () => exportRaster(S, 'png',  'icon.png'));
  document.getElementById('export-jpg-btn').addEventListener('click', () => exportRaster(S, 'jpeg', 'icon.jpg'));
  document.getElementById('copy-svg-btn')  .addEventListener('click', e => _handleCopy(e.currentTarget));

  // Add object buttons
  document.getElementById('add-icon-btn') .addEventListener('click', () => openIconModal(addIcon));
  document.getElementById('add-text-btn') .addEventListener('click', addText);
  document.querySelectorAll('[data-add-shape]').forEach(b =>
    b.addEventListener('click', () => addShape(b.dataset.addShape))
  );

  // Upload file
  const fi = document.getElementById('file-input');
  document.getElementById('upload-btn').addEventListener('click', () => fi.click());
  fi.addEventListener('change', e => {
    const f = e.target.files[0]; if (f) addFile(f); fi.value = '';
  });

  // Paste SVG
  const pasteBtn  = document.getElementById('paste-svg-btn');
  const pasteArea = document.getElementById('paste-area');
  pasteBtn.addEventListener('click', () => {
    const open = pasteArea.style.display === 'flex';
    pasteArea.style.display = open ? 'none' : 'flex';
    pasteBtn.classList.toggle('active', !open);
  });
  document.getElementById('paste-apply').addEventListener('click', () => {
    const txt = document.getElementById('svg-ta').value.trim();
    if (!txt) return;
    const o = { ..._base('svg'), content: parseSvgInput(txt), name: 'Custom SVG' };
    // _base is closure-only – need to inline here
    const obj = { id: newId(), type: 'svg', ox: 0, oy: 0, sc: 1, rot: 0, op: 1, color: null,
                  content: parseSvgInput(txt), name: 'Custom SVG' };
    S.objects.push(obj); S.selId = obj.id; render();
    pasteArea.style.display = 'none'; pasteBtn.classList.remove('active');
    document.getElementById('svg-ta').value = '';
  });

  // Icon modal events
  document.getElementById('icon-search')  .addEventListener('input',  e => _renderIconGrid(e.target.value));
  document.getElementById('modal-close-btn').addEventListener('click', closeIconModal);
  document.getElementById('icon-modal')   .addEventListener('click',  e => { if (e.target.id === 'icon-modal') closeIconModal(); });
});
