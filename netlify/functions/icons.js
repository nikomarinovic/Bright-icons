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

  let x = 0;
  const svgs = [];

  for (const name of names) {
    let fileName = `${name}.svg`;
    if (theme === 'dark' && fs.existsSync(path.join(iconsDir, `${name}_dark.svg`))) {
      fileName = `${name}_dark.svg`;
    }
    const filePath = path.join(iconsDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf-8');
    // Remove outer <svg> to inline
    content = content.replace(/<\s*svg[^>]*>/i, '').replace(/<\/\s*svg>/i, '');
    svgs.push(`<g transform="translate(${x},0)">${content}</g>`);
    x += size + spacing;
  }

  const width = x > 0 ? x - spacing : 0;
  const height = size;

  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${svgs.join('')}</svg>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
    body: combinedSvg
  };
};