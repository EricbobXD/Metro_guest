import test from 'node:test';
import assert from 'node:assert/strict';
import {traRouteColors,traRouteColor,traEdgeColor} from '../src/tra-route-colors.js';
test('TRA lines have independent colors, including every main and branch',()=>{
  assert.equal(new Set(Object.values(traRouteColors)).size,Object.keys(traRouteColors).length);
  assert.notEqual(traRouteColor('tr-north'),traRouteColor('tr-neiwan'));
  assert.notEqual(traRouteColor('tr-neiwan'),traRouteColor('tr-liujia'));
  assert.equal(traEdgeColor({a:'新竹',b:'北新竹',lineIds:['tr-neiwan','tr-north']}),traRouteColor('tr-north'));
  assert.equal(traEdgeColor({a:'蘇澳新',b:'蘇澳',lineIds:['tr-yilan']}),traRouteColor('tr-suao'));
});
