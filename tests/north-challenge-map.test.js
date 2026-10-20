import test from 'node:test';
import assert from 'node:assert/strict';
import {networks,stationsFor} from '../src/data.js';
import {buildNorthMap} from '../src/north-map-model.js';
import {northRouteTrackPath} from '../src/north-map-svg.js';
import {northChallengeMap} from '../src/north-challenge-map.js';

test('north challenge preserves all answer identities and uses the reviewed atlas coordinates',()=>{
 const network=networks.find(n=>n.id==='north'),map=northChallengeMap(network,true),model=buildNorthMap();
 assert.deepEqual(map.nodes.map(n=>n.id).sort(),stationsFor(network).map(s=>s.id).sort());
 assert.equal(new Set(map.nodes.map(n=>n.reviewedId)).size,map.nodes.length);
 for(const node of map.nodes){const station=model.byId.get(node.reviewedId);assert.equal(node.x,station.x);assert.equal(node.y,station.y);}
});
test('north challenge uses identical reviewed paths, including fixed Wenhu and branch curves',()=>{
 const map=northChallengeMap(networks.find(n=>n.id==='north'),false),model=buildNorthMap();
 for(const line of map.lines){
  const route=model.routes.find(r=>r.id===line.key),points=route.pathPoints.at(-1).extension?route.pathPoints.slice(0,-1):route.pathPoints;
  assert.equal(line.path,northRouteTrackPath(route,points));assert.equal(line.color,route.color);
  assert.ok(!/NaN|undefined|Infinity/.test(line.path));
 }
 assert.ok(map.lines.some(line=>line.key==='BR-0'));
});
