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

/**
 * Given a raw icon name (e.g. "bmw", "bmw:mseries", "amazonconnect:inverted")
 * and a theme, find the best matching file.
 *
 * URL colon syntax maps to filename lookup:
 *   "bmw"              → bmw.svg / bmw_dark.svg
 *   "bmw:mseries"      → bmw_mseries.svg OR bmw-mseries.svg (+ dark variants)
 *   "amazonconnect:inverted" → amazonconnect_inverted.svg OR amazonconnect-inverted.svg
 */
function findFile(rawName, theme) {
  const map = getFileMap();
  const [base, variant] = rawName.toLowerCase().split(":");

  // Build candidate filenames in priority order
  const candidates = [];

  if (variant) {
    if (theme === "dark") {
      // Prefer explicit _dark suffix
      candidates.push(`${base}_${variant}_dark.svg`);
      candidates.push(`${base}-${variant}_dark.svg`);
    }
    // Light/default versions
    candidates.push(`${base}_${variant}.svg`);
    candidates.push(`${base}-${variant}.svg`);
    // Fallback: dark as only available version
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
      const raw = fs.readFileSync(filePath);
      const b64 = raw.toString("base64");
      resolved.push({ name, b64 });
    } catch {}
  }

  if (!resolved.length) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "image/svg+xml" },
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"></svg>`,
    };
  }

  const cols = perline > 0 ? Math.min(perline, resolved.length) : resolved.length;
  const rows = Math.ceil(resolved.length / cols);
  const totalWidth = cols * size + (cols - 1) * spacing;
  const totalHeight = rows * size + (rows - 1) * spacing;

  const images = resolved.map(({ name, b64 }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (size + spacing);
    const y = row * (size + spacing);
    return `<image x="${x}" y="${y}" width="${size}" height="${size}" href="data:image/svg+xml;base64,${b64}" aria-label="${name}"/>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" role="img">${images.join("")}</svg>`;

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