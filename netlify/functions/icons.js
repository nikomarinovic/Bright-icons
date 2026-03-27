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

  // Load each SVG as base64 and embed via <image>
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