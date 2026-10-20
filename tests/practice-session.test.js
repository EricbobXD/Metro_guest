import test from 'node:test';
import assert from 'node:assert/strict';
import {networks,routeGroups,buildGraph,distances} from '../src/data.js';
import {practiceScope} from '../src/practice-scope.js';
import {routeQuestion,remainingRoute} from '../src/practice-session.js';
test('generated routes always have an intermediate stop and use allowed passenger endpoints',()=>{
  for(const n of networks.filter(n=>['tra','north','kaohsiung'].includes(n.id)))for(const g of routeGroups(n)){
    const scope=practiceScope(n,g.segments),graph=buildGraph(n);
    for(const random of [()=>0,()=>.5,()=>.9999]){
      const q=routeQuestion(scope.endpoints,graph,random);if(!q)continue;
      assert.ok(q.minimum>=2);assert.ok(scope.endpoints.some(s=>s.id===q.from));assert.ok(scope.endpoints.some(s=>s.id===q.to));
      assert.equal(distances(graph,q.to).get(q.from),q.minimum);
      const remaining=remainingRoute(graph,q.from,q.to);assert.equal(remaining.length,q.minimum-1);
      assert.ok(!remaining.includes(q.from)&&!remaining.includes(q.to));
    }
  }
});
test('a scope containing only adjacent stations cannot generate a formal question',()=>{
  const graph=new Map([['A',new Set(['B'])],['B',new Set(['A'])]]);
  assert.equal(routeQuestion([{id:'A'},{id:'B'}],graph),null);
});
