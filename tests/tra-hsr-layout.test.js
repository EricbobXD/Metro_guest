import test from 'node:test';
import assert from 'node:assert/strict';
import {networks} from '../src/data.js';
import {traVerticalLayout} from '../src/tra-vertical-layout.js';
import {traHsrLayout} from '../src/tra-hsr-layout.js';

test('HSR display has twelve stations, six shared links and two walking transfers',()=>{
  const model=traVerticalLayout(networks.find(n=>n.id==='tra')),before=JSON.stringify(model),hsr=traHsrLayout(model);
  assert.equal(hsr.stops.length,12);
  assert.ok(new Set(hsr.stops.map(s=>s.x)).size>3,'HSR follows the different TRA transfer lanes');
  assert.ok(hsr.connections.every(c=>Math.abs(c.hsr.x-c.tra.x)<=390));
  assert.ok(hsr.connections.find(c=>c.tra.id==='豐富').hsr.x<470,'walking link stops before the Neiwan branch');
  assert.ok(hsr.points.every((p,i)=>i===0||p.x===hsr.points[i-1].x||p.y===hsr.points[i-1].y));
  const tra=id=>model.nodes.find(n=>n.id===id);
  for(const stop of hsr.stops.slice(0,3))assert.equal(stop.x,tra(stop.traId).x-26);
  assert.ok(hsr.departureY>tra('浮洲').y&&hsr.departureY<tra('樹林').y);
  assert.ok(hsr.points.some((p,i)=>i>0&&p.y===hsr.departureY&&hsr.points[i-1].y===p.y&&hsr.points[i-1].x<230&&p.x>230));
  assert.deepEqual(hsr.connections.filter(c=>c.hsr.type==='shared').map(c=>c.tra.id),['南港','台北','板橋','新烏日','沙崙','新左營']);
  assert.deepEqual(hsr.connections.filter(c=>c.hsr.type==='walking').map(c=>c.tra.id),['六家','豐富']);
  assert.deepEqual(hsr.stops.filter(s=>!s.traId).map(s=>s.name),['桃園','彰化','雲林','嘉義']);
  assert.ok(hsr.stops.every((s,i)=>i===0||s.y>hsr.stops[i-1].y));
  assert.equal(hsr.stops[3].x,hsr.stops[4].x,'Taoyuan and Hsinchu share a continuous lane');
  assert.equal(new Set(hsr.stops.slice(5,10).map(s=>s.x)).size,1,'Miaoli to Chiayi avoids redundant turns');
  assert.ok(hsr.path.includes(' Q '),'route bends have rounded corners');
  assert.ok(!/NaN|Infinity/.test(hsr.path));
  for(const link of hsr.connections)assert.equal(link.hsr.y,link.tra.y);
  assert.equal(JSON.stringify(model),before,'HSR must not mutate the TRA answer topology');
});
