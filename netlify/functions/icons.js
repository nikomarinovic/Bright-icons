const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "..", "..", "icons");
let fileMap = null;

function getFileMap() {
  if (fileMap) return fileMap;
  const files = fs.readdirSync(iconsDir);
  fileMap = {};
  for (const f of files) {
    if (f.endsWith(".svg")) {
      fileMap[f.toLowerCase()] = f;
    }
  }
  return fileMap;
}

function findFile(rawName, theme) {
  const map = getFileMap();
  const [base, variant] = rawName.toLowerCase().split(":");

  const candidates = [];
  if (variant) {
    if (theme === "dark") {
      candidates.push(`${base}_${variant}_dark.svg`);
      candidates.push(`${base}-${variant}_dark.svg`);
    }
    candidates.push(`${base}_${variant}.svg`);
    candidates.push(`${base}-${variant}.svg`);
    if (theme !== "dark") {
      candidates.push(`${base}_${variant}_dark.svg`);
      candidates.push(`${base}-${variant}_dark.svg`);
    }
  } else {
    if (theme === "dark") {
      candidates.push(`${base}_dark.svg`);
    }
    candidates.push(`${base}.svg`);
    if (theme !== "dark") {
      candidates.push(`${base}_dark.svg`);
    }
  }

  for (const key of candidates) {
    if (map[key]) return path.join(iconsDir, map[key]);
  }
  return null;
}

function parseSvg(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");

  // Extract viewBox from the ROOT <svg> tag only
  let viewBox = null;
  const rootSvgMatch = raw.match(/<svg[^>]*>/i);
  if (rootSvgMatch) {
    const vbMatch = rootSvgMatch[0].match(/viewBox=["']([^"']+)["']/i);
    if (vbMatch) viewBox = vbMatch[1].trim();
  }
  if (!viewBox) {
    const wMatch = raw.match(/\bwidth=["']([0-9.]+)["']/i);
    const hMatch = raw.match(/\bheight=["']([0-9.]+)["']/i);
    const w = wMatch ? parseFloat(wMatch[1]) : 24;
    const h = hMatch ? parseFloat(hMatch[1]) : 24;
    viewBox = `0 0 ${w} ${h}`;
  }

  let inner = raw
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg[^>]*>/i, "")       // remove opening <svg> tag
    .replace(/<\/svg>\s*$/i, "")      // remove closing </svg> tag
    .trim();

  // Strip <filter> blocks — SVG filters force rasterisation at rendered pixel
  // size, which is exactly what causes blurriness. The feFlood+feComposite
  // colouring pattern used in these icons is cosmetic only; removing it leaves
  // the icon shapes intact via their own fill colours.
  inner = inner.replace(/<filter[\s\S]*?<\/filter>/gi, "");

  // Remove filter="url(#...)" references left behind on elements
  inner = inner.replace(/\s+filter="url\(#[^"]*\)"/gi, "");

  // Remove clipPath definitions and clip-path attributes (also rasterise at
  // render size and are usually redundant for icon display)
  inner = inner.replace(/<clipPath[\s\S]*?<\/clipPath>/gi, "");
  inner = inner.replace(/\s+clip-path="url\(#[^"]*\)"/gi, "");

  return { viewBox, inner };
}

function namespaceIds(svgContent, prefix) {
  let out = svgContent.replace(/\bid=["']([^"']+)["']/g, (_, id) => `id="${prefix}_${id}"`);
  out = out.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}_${id})`);
  out = out.replace(/(xlink:href|href)=["']#([^"']+)["']/g, (_, attr, id) => `${attr}="#${prefix}_${id}"`);
  return out;
}

exports.handler = async function (event) {
  const params = event.queryStringParameters || {};

  const iconNames = (params.i || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const theme = params.theme === "dark" ? "dark" : "light";
  const size = Math.min(Math.max(parseInt(params.size) || 48, 16), 128);
  const spacing = Math.min(Math.max(parseInt(params.spacing) || 12, 0), 64);
  const perline = parseInt(params.perline) || 0;

  if (!iconNames.length) {
    return { statusCode: 400, body: "Missing ?i= parameter" };
  }

  const resolved = [];
  for (const name of iconNames) {
    const filePath = findFile(name, theme);
    if (!filePath) continue;
    try {
      const { viewBox, inner } = parseSvg(filePath);
      resolved.push({ name, viewBox, inner });
    } catch {
      // skip unreadable files silently
    }
  }

  if (!resolved.length) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "image/svg+xml" },
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"></svg>`,
    };
  }

  const cols = perline > 0 ? Math.min(perline, resolved.length) : resolved.length;
  const rows = Math.ceil(resolved.length / cols);
  const totalWidth = cols * size + (cols - 1) * spacing;
  const totalHeight = rows * size + (rows - 1) * spacing;

  const iconElements = resolved.map(({ name, viewBox, inner }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (size + spacing);
    const y = row * (size + spacing);

    const safePrefix = `ic${i}_${name.replace(/[^a-z0-9]/g, "")}`;
    const safeInner = namespaceIds(inner, safePrefix);

    // overflow="hidden" — critical: prevents icon content from bleeding
    // outside its cell into adjacent icons (was causing visual duplication)
    return (
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" ` +
      `viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" ` +
      `overflow="hidden" role="img" aria-label="${name}">` +
      safeInner +
      `</svg>`
    );
  });

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${totalWidth}" height="${totalHeight}" ` +
    `viewBox="0 0 ${totalWidth} ${totalHeight}" ` +
    `role="img">` +
    iconElements.join("") +
    `</svg>`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
    body: svg,
  };
};