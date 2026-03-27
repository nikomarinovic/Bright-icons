// netlify/functions/icons.js
const fs = require('fs');
const path = require('path');

exports.handler = async function(event) {
  const query = event.queryStringParameters || {};
  const iconsParam = query.i || '';
  const size = parseInt(query.size) || 48;
  const spacing = parseInt(query.spacing) || 12;
  const theme = query.theme === 'dark' ? 'dark' : 'light';
  const fallbackIcon = 'icon.svg'; // put a default fallback in /icons

  const names = iconsParam.split(',').map(s => s.trim()).filter(Boolean);
  const iconsDir = path.join(process.cwd(), 'icons'); // ✅ use this

  let x = 0;
  const svgs = [];

  for (const name of names) {
    let fileName = `${name}.svg`;
    if (theme === 'dark' && fs.existsSync(path.join(iconsDir, `${name}_dark.svg`))) {
      fileName = `${name}_dark.svg`;
    }

    let filePath = path.join(iconsDir, fileName);
    if (!fs.existsSync(filePath)) {
      // fallback
      filePath = path.join(iconsDir, fallbackIcon);
      if (!fs.existsSync(filePath)) continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    const viewBoxMatch = content.match(/viewBox="([^"]+)"/i);
    let innerSvg = content.replace(/<\s*svg[^>]*>/i, '').replace(/<\/\s*svg>/i, '');
    const iconSvg = `<svg x="${x}" y="0" width="${size}" height="${size}" viewBox="${viewBoxMatch ? viewBoxMatch[1] : `0 0 ${size} ${size}`}" xmlns="http://www.w3.org/2000/svg">${innerSvg}</svg>`;
    svgs.push(iconSvg);
    x += size + spacing;
  }

  const totalWidth = x > 0 ? x - spacing : 0;
  const totalHeight = size;

  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">${svgs.join('')}</svg>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    },
    body: combinedSvg
  };
};