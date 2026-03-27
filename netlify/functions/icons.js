const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "icons");

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

function findFile(name, theme) {
  const map = getFileMap();

  if (theme === "dark") {
    const darkKey = `${name}_dark.svg`;
    if (map[darkKey]) return path.join(iconsDir, map[darkKey]);
  }

  const lightKey = `${name}.svg`;
  if (map[lightKey]) return path.join(iconsDir, map[lightKey]);

  const darkKey = `${name}_dark.svg`;
  if (map[darkKey]) return path.join(iconsDir, map[darkKey]);

  return null;
}

function extractInnerSVG(svgString) {
  const viewBoxMatch = svgString.match(/viewBox=["']([^"']+)["']/i);
  const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!innerMatch) return null;
  return {
    inner: innerMatch[1].trim(),
    viewBox: viewBoxMatch ? viewBoxMatch[1] : "0 0 256 256",
  };
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
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = extractInnerSVG(raw);
      if (parsed) resolved.push({ name, ...parsed });
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

  const groups = resolved.map(({ name, inner, viewBox }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (size + spacing);
    const y = row * (size + spacing);
    const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);
    const scaleX = size / (vw || size);
    const scaleY = size / (vh || size);
    return `<g transform="translate(${x},${y})" aria-label="${name}"><g transform="scale(${scaleX},${scaleY}) translate(${-(vx||0)},${-(vy||0)})">${inner}</g></g>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" role="img">${groups.join("")}</svg>`;

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