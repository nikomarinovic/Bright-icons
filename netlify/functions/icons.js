// netlify/functions/icons.js
const fs = require('fs');
const path = require('path');

exports.handler = async function(event) {
  const query = event.queryStringParameters || {};
  const iconsParam = query.i || '';
  const size = parseInt(query.size) || 48;
  const spacing = parseInt(query.spacing) || 12;
  const theme = query.theme === 'dark' ? 'dark' : 'light';

  const names = iconsParam.split(',').map(s => s.trim()).filter(Boolean);
  const iconsDir = path.join(__dirname, '../../icons');
  const fallbackIcon = path.join(iconsDir, 'default.svg'); // optional fallback

  let x = 0;
  const svgGroups = [];

  for (const name of names) {
    let fileName = `${name}.svg`;
    if (theme === 'dark' && fs.existsSync(path.join(iconsDir, `${name}_dark.svg`))) {
      fileName = `${name}_dark.svg`;
    }
    let filePath = path.join(iconsDir, fileName);
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(fallbackIcon)) filePath = fallbackIcon;
      else continue; // skip if missing
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    // Extract original viewBox and inner SVG content
    const viewBoxMatch = content.match(/viewBox="([^"]+)"/i);
    let innerContent = content.replace(/<\s*svg[^>]*>/i, '').replace(/<\/\s*svg>/i, '');
    let vb = viewBoxMatch ? viewBoxMatch[1].split(' ').map(Number) : [0,0,size,size];
    const [vbX, vbY, vbWidth, vbHeight] = vb;

    // scale factor to fit requested size
    const scale = size / Math.max(vbWidth, vbHeight);

    svgGroups.push(`<g transform="translate(${x},0) scale(${scale})">${innerContent}</g>`);
    x += size + spacing;
  }

  const width = x > 0 ? x - spacing : 0;
  const height = size;

  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgGroups.join('')}</svg>`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    },
    body: combinedSvg
  };
};