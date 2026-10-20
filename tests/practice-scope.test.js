import test from 'node:test';
import assert from 'node:assert/strict';
import {networks,routeGroups,stationsFor,transferOptions} from '../src/data.js';
import {practiceScope} from '../src/practice-scope.js';

test('every system and scope retains complete transfer memberships while limiting question locations',()=>{
  for(const n of networks)for(const g of routeGroups(n)){
    const scope=practiceScope(n,g.segments),all=stationsFor(n),ids=new Set(stationsFor(n,g.segments).map(s=>s.id));
    assert.deepEqual(scope.transfers.map(s=>s.id),all.filter(s=>ids.has(s.id)&&transferOptions(n,s).length).map(s=>s.id),`${n.id}/${g.id}`);
    for(const s of scope.pool)assert.deepEqual(s.lines.map(l=>l.id),all.find(a=>a.id===s.id).lines.map(l=>l.id));
  }
  const tra=networks.find(n=>n.id==='tra');
  assert.deepEqual(practiceScope(tra,tra.lines.filter(l=>l.id==='tr-coast')).transfers.map(s=>s.id),['竹南','追分','彰化']);
});
test('subtitle availability and passenger endpoints follow scope without removing fill stations',()=>{
  for(const id of ['tra','hsr','taichung','kaohsiung']){const n=networks.find(n=>n.id===id);assert.equal(practiceScope(n,n.lines).hasSubtitles,false);}
  const n=networks.find(n=>n.id==='tra'),s=practiceScope(n,n.lines);
  assert.equal(s.pool.length,243);assert.equal(s.endpoints.length,241);
  for(const id of ['花蓮港','枋野']){assert.ok(s.pool.some(n=>n.id===id));assert.ok(!s.endpoints.some(n=>n.id===id));}
  const north=networks.find(n=>n.id==='north');
  assert.equal(practiceScope(north,north.lines).hasSubtitles,true);
  assert.equal(practiceScope(north,north.lines.filter(l=>l.id==='k')).hasSubtitles,false);
});
