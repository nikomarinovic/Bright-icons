const fs = require("fs");
const path = require("path");

exports.handler = async function (event) {
  const params = event.queryStringParameters || {};
  const iconNames = (params.i || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const theme = params.theme === "dark" ? "dark" : "light";
  const size = Math.min(Math.max(parseInt(params.size) || 48, 16), 128);
  const spacing = Math.min(Math.max(parseInt(params.spacing) || 12, 0), 64);
  const perline = Math.min(Math.max(parseInt(params.perline) || 0, 1), 50); // 0 = no wrap

  if (!iconNames.length) {
    return {
      statusCode: 400,
      body: "Missing ?i= parameter",
    };
  }

  // Icons folder is relative to the function's location.
  // In Netlify, __dirname for a function in /netlify/functions/ won't reach /icons directly.
  // Use process.cwd() which is the site root, then look in /icons.
  const iconsDir = path.join(process.cwd(), "icons");

  const svgContents = [];

  for (const name of iconNames) {
    const darkFile = path.join(iconsDir, `${name}_dark.svg`);
    const lightFile = path.join(iconsDir, `${name}.svg`);

    let filePath = null;
    if (theme === "dark" && fs.existsSync(darkFile)) {
      filePath = darkFile;
    } else if (fs.existsSync(lightFile)) {
      filePath = lightFile;
    } else if (theme === "dark" && fs.existsSync(lightFile)) {
      // fallback dark → light
      filePath = lightFile;
    }

    if (!filePath) continue; // skip unknown icons

    try {
      let raw = fs.readFileSync(filePath, "utf8");

      // Strip XML declaration
      raw = raw.replace(/<\?xml[^?]*\?>/gi, "").trim();

      // Extract inner content + viewBox from the SVG
      const viewBoxMatch = raw.match(/viewBox=["']([^"']+)["']/i);
      const innerMatch = raw.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);

      if (!innerMatch) continue;

      const inner = innerMatch[1].trim();
      const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${size} ${size}`;

      svgContents.push({ inner, viewBox, name });
    } catch {
      // skip unreadable files
    }
  }

  if (!svgContents.length) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "image/svg+xml" },
      body: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"></svg>`,
    };
  }

  // Layout: perline wrapping
  const cols = perline > 0 ? Math.min(perline, svgContents.length) : svgContents.length;
  const rows = Math.ceil(svgContents.length / cols);

  const totalWidth = cols * size + (cols - 1) * spacing;
  const totalHeight = rows * size + (rows - 1) * spacing;

  const groups = svgContents.map(({ inner, viewBox, name }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * (size + spacing);
    const y = row * (size + spacing);

    // Parse original viewBox to scale correctly
    const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number);
    const scaleX = size / (vw || size);
    const scaleY = size / (vh || size);
    const offsetX = -(vx || 0) * scaleX;
    const offsetY = -(vy || 0) * scaleY;

    return `
  <g transform="translate(${x}, ${y})" aria-label="${name}">
    <g transform="scale(${scaleX}, ${scaleY}) translate(${offsetX / scaleX}, ${offsetY / scaleY})">
      ${inner}
    </g>
  </g>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${totalWidth}" height="${totalHeight}"
  viewBox="0 0 ${totalWidth} ${totalHeight}"
  role="img" aria-label="Tech icons">
${groups.join("\n")}
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