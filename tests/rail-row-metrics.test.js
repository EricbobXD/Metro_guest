import test from 'node:test';
import assert from 'node:assert/strict';
import {railRowHeight} from '../src/rail-row-metrics.js';
import {networks,stationsFor,transferOptions} from '../src/data.js';
test('rail rows reserve more space for transfer tiers and narrow wrapped labels',()=>{
  const plain={name:'基隆',rail:[],metro:[]},transfer={name:'臺北',rail:['高鐵'],metro:['R','BL','A']};
  assert.ok(railRowHeight([transfer])>railRowHeight([plain]));
  assert.ok(railRowHeight([transfer],45)>railRowHeight([transfer],90));
  assert.ok(railRowHeight([{...plain,connections:[{label:'竹南分岔 → 山線／海線'}]}])>railRowHeight([plain]));
});
test('TRA Songshan includes the Songshan-Xindian transfer in the answer bank',()=>{
  const network=networks.find(n=>n.id==='tra');
  assert.ok(transferOptions(network,stationsFor(network).find(s=>s.id==='松山')).includes('松山新店線'));
});
