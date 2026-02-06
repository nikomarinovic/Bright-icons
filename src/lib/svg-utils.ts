import { EditorState } from "@/lib/editor-state";

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
}

function buildBgShape(size: number, color: string, shape: string): string {
  const half = size / 2;
  switch (shape) {
    case "circle":
      return `<circle cx="${half}" cy="${half}" r="${half}" fill="${color}" />`;
    case "square":
      return `<rect width="${size}" height="${size}" fill="${color}" />`;
    case "hexagon":
      return `<polygon points="${hexPoints(half, half, half)}" fill="${color}" />`;
    case "diamond":
      return `<polygon points="${half},0 ${size},${half} ${half},${size} 0,${half}" fill="${color}" />`;
    case "star":
      return `<polygon points="${starPoints(half, half, half, half * 0.4)}" fill="${color}" />`;
    default:
      return `<rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${color}" />`;
  }
}

function buildClipPath(size: number, shape: string): string {
  const half = size / 2;
  switch (shape) {
    case "circle":
      return `<clipPath id="bg-clip"><circle cx="${half}" cy="${half}" r="${half}" /></clipPath>`;
    case "hexagon":
      return `<clipPath id="bg-clip"><polygon points="${hexPoints(half, half, half)}" /></clipPath>`;
    case "diamond":
      return `<clipPath id="bg-clip"><polygon points="${half},0 ${size},${half} ${half},${size} 0,${half}" /></clipPath>`;
    case "star":
      return `<clipPath id="bg-clip"><polygon points="${starPoints(half, half, half, half * 0.4)}" /></clipPath>`;
    case "square":
      return `<clipPath id="bg-clip"><rect width="${size}" height="${size}" /></clipPath>`;
    default:
      return `<clipPath id="bg-clip"><rect width="${size}" height="${size}" rx="${size * 0.2}" /></clipPath>`;
  }
}

function buildPatternDef(pattern: string): string {
  const s = 16;
  switch (pattern) {
    case "dots":
      return `<pattern id="bp" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="1.5" fill="white" opacity="0.12"/></pattern>`;
    case "grid":
      return `<pattern id="bp" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="white" stroke-width="0.5" opacity="0.1"/></pattern>`;
    case "diagonal":
      return `<pattern id="bp" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><path d="M 0 ${s} L ${s} 0" stroke="white" stroke-width="0.5" opacity="0.1"/></pattern>`;
    case "crosshatch":
      return `<pattern id="bp" patternUnits="userSpaceOnUse" width="${s}" height="${s}"><path d="M 0 ${s} L ${s} 0 M 0 0 L ${s} ${s}" stroke="white" stroke-width="0.5" opacity="0.08"/></pattern>`;
    default:
      return "";
  }
}

export function buildSvgMarkup(state: EditorState): string {
  const { bgColor, bgShape, bgPattern, iconContent, iconType, iconColor, offsetX, offsetY, scale, rotation, canvasSize } = state;
  const half = canvasSize / 2;

  // Defs
  let defs = buildClipPath(canvasSize, bgShape);
  if (bgPattern !== "none") {
    defs += buildPatternDef(bgPattern);
  }
  if (iconColor) {
    defs += `<filter id="ic"><feFlood flood-color="${iconColor}" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in"/></filter>`;
  }

  // Background shape
  const bg = buildBgShape(canvasSize, bgColor, bgShape);

  // Pattern overlay
  const patternOverlay = bgPattern !== "none"
    ? `<rect width="${canvasSize}" height="${canvasSize}" fill="url(#bp)" clip-path="url(#bg-clip)" />`
    : "";

  // Icon
  let iconMarkup = "";
  const filterAttr = iconColor ? ' filter="url(#ic)"' : "";

  if (iconContent && iconType === "svg") {
    iconMarkup = `<g transform="translate(${half + offsetX}, ${half + offsetY}) rotate(${rotation}) scale(${scale}) translate(-${canvasSize * 0.3}, -${canvasSize * 0.3})"${filterAttr}>${iconContent}</g>`;
  } else if (iconContent && iconType === "raster") {
    const imgSize = canvasSize * 0.6;
    iconMarkup = `<g transform="translate(${half + offsetX}, ${half + offsetY}) rotate(${rotation})"${filterAttr}><image href="${iconContent}" x="${-(imgSize * scale) / 2}" y="${-(imgSize * scale) / 2}" width="${imgSize * scale}" height="${imgSize * scale}" /></g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasSize} ${canvasSize}" width="${canvasSize}" height="${canvasSize}">
  <defs>${defs}</defs>
  ${bg}
  ${patternOverlay}
  ${iconMarkup}
</svg>`;
}

export function parseSvgInput(svgText: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) return svgText;

  const viewBox = svgEl.getAttribute("viewBox");
  const innerHtml = svgEl.innerHTML;

  if (viewBox) {
    return `<svg viewBox="${viewBox}" width="100%" height="100%">${innerHtml}</svg>`;
  }

  const w = svgEl.getAttribute("width") || "24";
  const h = svgEl.getAttribute("height") || "24";
  return `<svg viewBox="0 0 ${parseFloat(w)} ${parseFloat(h)}" width="100%" height="100%">${innerHtml}</svg>`;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
