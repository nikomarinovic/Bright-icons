const fs = require("fs");
const path = require("path");

let iconsMap = null;

function loadIcons() {
  if (iconsMap) return iconsMap;
  const jsonPath = path.join(process.cwd(), "data", "icons.json");
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  iconsMap = {};
  for (const icon of raw) {
    const key = icon.name.toLowerCase();
    const def = icon.variants?.default;
    if (def) {
      iconsMap[key] = {
        light: def.lightCode || def.darkCode || null,
        dark: def.darkCode || def.lightCode || null,
      };
    }
  }
  return iconsMap;
}

function extractInnerSVG(svgString) {
  if (!svgString) return null;
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

  let icons;
  try {
    icons = loadIcons();
  } catch (e) {
    return { statusCode: 500, body: "Could not load icons.json: " + e.message };
  }

  const resolved = [];
  for (const name of iconNames) {
    const entry = icons[name];
    if (!entry) continue;
    const svgCode = entry[theme] || entry.light || entry.dark;
    const parsed = extractInnerSVG(svgCode);
    if (parsed) resolved.push({ name, ...parsed });
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

    return `<g transform="translate(${x}, ${y})" aria-label="${name}">
    <g transform="scale(${scaleX}, ${scaleY}) translate(${-(vx || 0)}, ${-(vy || 0)})">
      ${inner}
    </g>
  </g>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" role="img" aria-label="Tech icons">
  ${groups.join("\n  ")}
</svg>`;

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