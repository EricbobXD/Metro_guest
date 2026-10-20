import test from 'node:test';
import assert from 'node:assert/strict';
import {railBranchLayout} from '../src/rail-branch-layout.js';
const branch=(id,index,names)=>({id,index,at:names[0],group:{name:id,segments:[{id,stops:names}]}});
test('nearby eastern branches share a lane and begin at their junction centers',()=>{
  const layout=railBranchLayout([branch('deep',3,['瑞芳','海科館','八斗子']),branch('pingxi',5,['三貂嶺','大華','十分','望古','嶺腳','平溪','菁桐'])],13);
  const [deep,pingxi]=layout.branches;
  assert.equal(deep.positions[0].y,pingxi.positions[0].y);
  assert.deepEqual(deep.points[0],{x:3.5,y:42});
  assert.deepEqual(pingxi.points[0],{x:5.5,y:42});
  assert.ok(deep.max<pingxi.min);
  assert.ok(layout.height<240);
});
test('Suao is a short perpendicular spur from the reversed main row',()=>{
  const layout=railBranchLayout([branch('suao',12,['蘇澳新','蘇澳'])],13,true),spur=layout.branches[0];
  assert.equal(spur.anchor,.5);assert.equal(spur.positions[0].x,spur.anchor);
  assert.ok(layout.height<200);
});
test('narrow branch layouts preserve every stop and stay within the viewport',()=>{
  for(const reverse of [false,true])for(const index of [0,1,2]){
    const layout=railBranchLayout([branch('pingxi',index,['三貂嶺','大華','十分','望古','嶺腳','平溪','菁桐'])],3,reverse);
    assert.equal(layout.branches[0].positions.length,6);
    for(const p of layout.branches[0].positions)assert.ok(p.x>=.5&&p.x<=2.5);
    for(const p of layout.branches[0].points)assert.ok(p.x>=0&&p.x<=3);
  }
});
