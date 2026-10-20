import { mkdirSync, writeFileSync } from 'node:fs';
import { createNorthSvg } from '../src/north-map-svg.js';
import { buildNorthMap } from '../src/north-map-model.js';
mkdirSync('public/maps',{recursive:true});
const model=buildNorthMap();
writeFileSync('public/maps/north-relative.svg',createNorthSvg(model));
console.log(`Exported public/maps/north-relative.svg (${model.width} × ${model.height}).`);
