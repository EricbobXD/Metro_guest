import test from 'node:test';
import assert from 'node:assert/strict';
import {networks,stationsFor} from '../src/data.js';
import {traVerticalLayout} from '../src/tra-vertical-layout.js';
import {traScopeModel,traDisplayPath,traScopeEnds,traScopeBox} from '../src/tra-view-scope.js';
const network=networks.find(n=>n.id==='tra'),full=traVerticalLayout(network);
test('view scopes retain branch junctions, unique shared stations and every TRA station',()=>{
 const views=['west','east','south'].map(scope=>traScopeModel(full,scope));
 assert.equal(new Set(views.flatMap(m=>m.nodes.map(n=>n.id))).size,stationsFor(network).length);
 for(const m of views){assert.equal(new Set(m.nodes.map(n=>n.id)).size,m.nodes.length);for(const e of m.edges)assert.ok(m.nodes.some(n=>n.id===e.a)&&m.nodes.some(n=>n.id===e.b));}
 assert.ok(views[0].edges.some(e=>e.lineIds.includes('tr-chengzhui')));
 assert.ok(views[1].nodes.some(n=>n.id==='花蓮港'));
});
test('western paths honor mountain or coast and never use Chengzhui as a hidden shortcut',()=>{
 const west=traScopeModel(full,'west');
 const mountain=traDisplayPath(west,'west',{from:'基隆',to:'枋寮',via:'mountain'}),coast=traDisplayPath(west,'west',{from:'基隆',to:'枋寮',via:'coast'});
 assert.ok(mountain.ids.has('台中'));assert.ok(!mountain.ids.has('大甲'));
 assert.ok(coast.ids.has('大甲'));assert.ok(!coast.ids.has('台中'));
 for(const p of [mountain,coast])assert.ok(!p.edges.has(['追分','成功'].sort().join('|')));
});
test('all allowed endpoint pairs are connected while cargo and connector stations are not terminals',()=>{
 for(const scope of ['west','east','south']){const model=traScopeModel(full,scope);for(const from of traScopeEnds[scope])for(const to of traScopeEnds[scope])if(from!==to)assert.ok(traDisplayPath(model,scope,{from,to}).path.length>1,`${scope}: ${from}–${to}`);assert.ok(traScopeBox(model,scope).split(' ').map(Number).every(Number.isFinite));}
 assert.ok(!Object.values(traScopeEnds).flat().includes('花蓮港'));
 assert.ok(!Object.values(traScopeEnds).flat().includes('追分'));
});
