import test from 'node:test';
import assert from 'node:assert/strict';
import {networks,buildGraph,stationsFor} from '../src/data.js';
import {traVerticalLayout} from '../src/tra-vertical-layout.js';
const network=networks.find(n=>n.id==='tra');
test('TRA has 243 stations, with Fangye on the south link and Hualien Port branching from Beipu',()=>{
  assert.equal(stationsFor(network).length,243);
  const model=traVerticalLayout(network);
  for(const [a,b]of [['枋山','枋野'],['枋野','大武'],['北埔','花蓮港']])assert.ok(model.edges.some(e=>e.a===a&&e.b===b));
  assert.equal(model.nodes.find(n=>n.id==='花蓮港').corridor,'東部幹線');
});
test('vertical TRA layout retains every source edge and unique answer identity',()=>{
  const model=traVerticalLayout(network),graph=buildGraph(network),expected=new Set();
  for(const [a,neighbors]of graph)for(const b of neighbors)expected.add([a,b].sort().join('|'));
  assert.deepEqual(model.nodes.map(n=>n.id).sort(),stationsFor(network).map(s=>s.id).sort());
  assert.deepEqual(new Set(model.edges.map(e=>[e.a,e.b].sort().join('|'))),expected);
});
test('vertical TRA trunks, mountain/coast parallel and south link share exact junctions',()=>{
  const m=traVerticalLayout(network),n=name=>m.nodes.find(s=>s.id===name);
  assert.equal(n('竹南').x,n('彰化').x);assert.ok(n('談文').x<n('造橋').x);
  assert.equal(n('枋寮').y,n('台東').y);assert.ok(n('加祿').y>n('枋寮').y);
  assert.ok(n('暖暖').x>n('八堵').x);assert.ok(n('蘇澳').x>n('蘇澳新').x);
  for(const node of m.nodes)assert.ok(node.x>=0&&node.x<=m.width&&node.y>=0&&node.y<m.height);
  for(const edge of m.edges)for(const p of edge.points)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
});

test('Hsinchu common section stays on the trunk and branches at North Hsinchu',()=>{
  const m=traVerticalLayout(network),shared=m.sharedHsinchu;
  assert.equal(shared.from.id,'北新竹');assert.equal(shared.to.id,'新竹');
  assert.equal(shared.from.x,shared.to.x);
  const common=m.edges.find(e=>e.a==='北新竹'&&e.b==='新竹');
  assert.deepEqual(new Set(common.lineIds),new Set(['tr-north','tr-neiwan']));
  assert.ok(m.edges.some(e=>e.a==='北新竹'&&e.b==='千甲'));
  assert.ok(!m.edges.some(e=>[e.a,e.b].includes('新竹')&&[e.a,e.b].includes('千甲')));
});
