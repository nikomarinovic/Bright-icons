const fs = require("fs");
const path = require("path");

// Icons directory - relative to project root
const ICONS_DIR = path.join(__dirname, "../../icons");

// Fallback icon SVG (shown when icon not found)
const FALLBACK_ICON = `<rect width="48" height="48" rx="10" fill="#e2e8f0"/>
  <text x="24" y="32" font-size="10" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">?</text>`;

/**
 * Read an SVG file and extract its inner content + viewBox
 */
function readIconSVG(iconName, theme) {
  const suffixes =
    theme === "dark" ? ["_dark", ""] : ["", "_dark"];

  for (const suffix of suffixes) {
    const filePath = path.join(ICONS_DIR, `${iconName}${suffix}.svg`);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        return parseSVG(raw);
      } catch (e) {
        // continue to next suffix
      }
    }
  }
  return null;
}

/**
 * Case-insensitive icon file lookup
 * Tries exact match first, then scans directory for case-insensitive match
 */
function findIconFile(iconName, theme) {
  const suffixes = theme === "dark" ? ["_dark", ""] : ["", "_dark"];

  for (const suffix of suffixes) {
    // Exact match
    const exactPath = path.join(ICONS_DIR, `${iconName}${suffix}.svg`);
    if (fs.existsSync(exactPath)) {
      try {
        return fs.readFileSync(exactPath, "utf8");
      } catch (e) {}
    }
  }

  // Case-insensitive fallback
  try {
    const files = fs.readdirSync(ICONS_DIR);
    for (const suffix of suffixes) {
      const target = `${iconName}${suffix}.svg`.toLowerCase();
      const match = files.find((f) => f.toLowerCase() === target);
      if (match) {
        return fs.readFileSync(path.join(ICONS_DIR, match), "utf8");
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Parse SVG string → extract viewBox and inner content
 */
function parseSVG(svgString) {
  // Extract viewBox
  const viewBoxMatch = svgString.match(/viewBox=["']([^"']+)["']/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 256 256";

  // Extract width/height from viewBox for scaling reference
  const vbParts = viewBox.split(/\s+/);
  const vbWidth = parseFloat(vbParts[2]) || 256;
  const vbHeight = parseFloat(vbParts[3]) || 256;

  // Extract inner SVG content (everything between <svg ...> and </svg>)
  const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  const inner = innerMatch ? innerMatch[1].trim() : "";

  return { viewBox, vbWidth, vbHeight, inner };
}

/**
 * Sanitize icon name to prevent path traversal
 */
function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_\-+.]/g, "").substring(0, 64);
}

exports.handler = async function (event) {
  // ── Parse query params ────────────────────────────────────────────
  const params = event.queryStringParameters || {};
  const iconParam = params.i || params.icons || "";
  const theme = params.theme === "dark" ? "dark" : "light";
  const size = Math.min(Math.max(parseInt(params.size) || 48, 16), 128);
  const spacing = Math.min(Math.max(parseInt(params.spacing) || 12, 0), 64);
  const showFallback = params.fallback !== "0"; // default: show fallback

  if (!iconParam) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Missing ?i= parameter. Usage: /api/icons?i=react,github",
    };
  }

  // ── Parse icon names ──────────────────────────────────────────────
  const iconNames = iconParam
    .split(",")
    .map((n) => sanitizeName(n.trim()))
    .filter(Boolean)
    .slice(0, 50); // max 50 icons per request

  // ── Build icon data ───────────────────────────────────────────────
  const icons = [];

  for (const name of iconNames) {
    const raw = findIconFile(name, theme);

    if (raw) {
      const parsed = parseSVG(raw);
      icons.push({ name, ...parsed, found: true });
    } else if (showFallback) {
      icons.push({
        name,
        viewBox: "0 0 48 48",
        vbWidth: 48,
        vbHeight: 48,
        inner: FALLBACK_ICON,
        found: false,
      });
    }
    // if not found and fallback disabled → skip silently
  }

  if (icons.length === 0) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/plain" },
      body: "No valid icons found.",
    };
  }

  // ── Calculate canvas dimensions ───────────────────────────────────
  const totalWidth =
    icons.length * size + Math.max(0, icons.length - 1) * spacing;
  const totalHeight = size;

  // ── Build combined SVG ────────────────────────────────────────────
  let svgParts = [];

  icons.forEach((icon, i) => {
    const x = i * (size + spacing);
    const y = 0;

    // Scale icon to fit the requested size
    // Use preserveAspectRatio to center within the square
    svgParts.push(
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${icon.viewBox}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">` +
        icon.inner +
        `</svg>`
    );
  });

  const combinedSVG =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" ` +
    `xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" ` +
    `aria-label="Icons: ${iconNames.join(", ")}">` +
    `<title>BrightIcons: ${iconNames.join(", ")}</title>` +
    svgParts.join("") +
    `</svg>`;

  // ── Return response ───────────────────────────────────────────────
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      "CDN-Cache-Control": "public, max-age=86400",
      Vary: "Accept-Encoding",
      "X-Content-Type-Options": "nosniff",
      "Access-Control-Allow-Origin": "*",
    },
    body: combinedSVG,
  };
};