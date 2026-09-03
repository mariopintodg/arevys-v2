import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The contours in app.js are the hand-traced AREVYS silhouettes. This build
// step freezes them into two native anatomy atlases, one for each body view.
// Runtime never re-creates or transforms individual generic shapes.
const source = readFileSync('app.js', 'utf8');
const start = source.indexOf('const ANATOMY_MASKS =');
const end = source.indexOf('\n\n// Runtime uses only these two hand-authored anatomy atlases.', start);
if (start < 0 || end < 0) throw new Error('No se encontró el atlas anatómico manual.');
const expression = source.slice(start, end);
const masks = Function(`${expression}; return ANATOMY_MASKS;`)();

const palette = {
  pectorales: '#f23a89', deltoides: '#f2ad35', biceps: '#c48cff', abdominales: '#ff604e',
  cuadriceps: '#ff3158', pantorrillas: '#46d5b5', dorsales: '#36d98e', triceps: '#9e72ff',
  gluteos: '#ff4f6f', isquiotibiales: '#e6b03d'
};

mkdirSync('assets/anatomy-atlas', { recursive: true });
for (const [view, groups] of Object.entries(masks)) {
  const layers = Object.entries(groups).map(([id, paths]) =>
    `<g id="${id}" fill="${palette[id]}">${paths.map(path => `<path d="${path}"/>`).join('')}</g>`
  ).join('');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="none">${layers}</svg>\n`;
  writeFileSync(join('assets/anatomy-atlas', `${view}.svg`), svg, 'utf8');
}
console.log('Atlas manual AREVYS listo.');
