import test from 'node:test';
import assert from 'node:assert/strict';
import {networks,routeGroups,stationsFor,stationId} from '../src/data.js';
import {traCorridors} from '../src/tra-corridors.js';
const network=networks.find(n=>n.id==='tra'),groups=routeGroups(network);
const names=g=>g.segments.flatMap(s=>s.stops);
test('merged TRA atlas retains all station answer identities',()=>{
  const model=traCorridors(groups),ids=new Set();
  for(const group of Object.values(model))for(const part of [group,...(group.attachments||[]).map(a=>a.group)])for(const segment of part.segments)for(const raw of segment.stops)ids.add(stationId('tra',segment.id,raw));
  assert.deepEqual([...ids].sort(),stationsFor(network).map(s=>s.id).sort());
  assert.equal(groups.length,17);
});
test('western corridors share junctions and keep mountain/coast as parallel paths',()=>{
  const m=traCorridors(groups);
  assert.equal(names(m.north).at(-1),'竹南');
  assert.equal(names(m.southern)[0],'彰化');
  for(const g of [m.mountain,m.coast]){assert.ok(!names(g).includes('竹南'));assert.ok(!names(g).includes('彰化'));}
  assert.equal(names(m.southern).filter(n=>n==='高雄').length,1);
  assert.equal(names(m.southern).at(-1),'枋寮');
});
test('eastern corridor retains Suao as a branch and removes duplicate junctions',()=>{
  const m=traCorridors(groups),stops=names(m.east);
  assert.equal(stops[0],'八堵');assert.equal(stops.at(-1),'臺東');
  for(const name of ['蘇澳新','花蓮'])assert.equal(stops.filter(n=>n===name).length,1);
  assert.ok(!stops.includes('蘇澳'));
  assert.deepEqual(names(m.east.attachments.find(a=>a.id==='tr-suao').group),['蘇澳新','蘇澳']);
  assert.deepEqual([names(m.southlink)[0],names(m.southlink).at(-1)],['枋寮','臺東']);
});
