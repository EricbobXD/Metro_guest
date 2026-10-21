import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNorthMap} from '../src/north-map-model.js';
import {buildNorthDisplayMap} from '../src/north-display-map.js';
import {createNorthSvg,northRouteTrackPath} from '../src/north-map-svg.js';
const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
test('adopted 14 percent map preserves identities, symbols, route order and base data',()=>{
 const base=buildNorthMap(),before=base.stations.map(n=>[n.id,n.x,n.y]),map=buildNorthDisplayMap();assert.equal(map.width,4773);assert.equal(map.height,4257);assert.equal(map.stations.length,base.stations.length);assert.equal(map.labels.length,base.labels.length);
 for(const n of map.stations){const old=base.byId.get(n.id);assert.equal(n.x,old.x*.86);assert.equal(n.y,old.y*.86);assert.deepEqual(n.marker,old.marker);}
 for(let i=0;i<map.routes.length;i++){assert.deepEqual(map.routes[i].points.map(p=>p.id),base.routes[i].points.map(p=>p.id));assert.equal(map.routes[i].displayTrack,northRouteTrackPath(base.routes[i]));assert.equal(map.routes[i].displayScale,.86);}
 assert.deepEqual(base.stations.map(n=>[n.id,n.x,n.y]),before);
 assert.ok(createNorthSvg(map,{includeHeader:false,includeSource:false}).includes('viewBox="0 0 4773 4257"'));
});
test('adopted map keeps original text size without label or marker collisions',()=>{
 const m=buildNorthDisplayMap(),boxes=m.stations.map(s=>({x:s.x+(s.marker.dx||0)-s.marker.w/2,y:s.y-s.marker.h/2,w:s.marker.w,h:s.marker.h}));
 for(let i=0;i<m.labels.length;i++){assert.equal(m.labels[i].fontSize,24);for(let j=0;j<i;j++)assert.ok(!hit(m.labels[i],m.labels[j]),m.labels[i].name);for(const b of boxes)assert.ok(!hit(m.labels[i],b),m.labels[i].name);}
});
