import { mkdirSync, writeFileSync } from 'node:fs';
import { createNorthSvg } from '../src/north-map-svg.js';
import {buildNorthDisplayMap} from '../src/north-display-map.js';
mkdirSync('public/maps',{recursive:true});
const model=buildNorthDisplayMap();
writeFileSync('public/maps/north-relative.svg',createNorthSvg(model,{includeHeader:false,includeSource:false}));
console.log(`Exported public/maps/north-relative.svg (${model.width} × ${model.height}).`);
