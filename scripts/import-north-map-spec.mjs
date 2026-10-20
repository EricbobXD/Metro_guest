import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(process.argv[2], 'utf8');
const lines = source.split(/\r?\n/);
const counters = new Map();
const routes = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].includes('→')) continue;
  const points = [...lines[i].matchAll(/([^()→]+)\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/g)]
    .map(([, raw, x, y]) => ({ raw: raw.trim(), x: Number(x), y: Number(y), control: raw.trim().startsWith('@') }));
  if (points.length < 2 || !/^[A-Z]|^貓空纜車/.test(lines[i - 1])) continue;
  const title = lines[i - 1].trim();
  const system = title.startsWith('貓空纜車') ? 'gondola' : title.split(' ')[0];
  const ordinal = counters.get(system) || 0;
  counters.set(system, ordinal + 1);
  routes.push({ id: `${system}-${ordinal}`, system, title, points });
}
if (routes.length !== 17 || counters.size !== 11) throw new Error('Unexpected route table in attachment');
mkdirSync(resolve('docs'), { recursive: true });
writeFileSync(resolve('docs/north-map-spec.txt'), source);
writeFileSync(resolve('src/north-map-data.js'), `// Copied from docs/north-map-spec.txt; rerun scripts/import-north-map-spec.mjs to update.\nexport const northRoutes = ${JSON.stringify(routes, null, 2)};\n`);
console.log(`Imported ${routes.length} ordered paths across ${counters.size} systems.`);
