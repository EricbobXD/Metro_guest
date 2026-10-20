import test from 'node:test';
import assert from 'node:assert/strict';
import {networks,stationsFor,transferOptions} from '../src/data.js';
import {traVerticalLayout} from '../src/tra-vertical-layout.js';
import {traStationSymbol} from '../src/tra-station-symbol.js';
const network=networks.find(n=>n.id==='tra'),nodes=traVerticalLayout(network).nodes,stations=stationsFor(network);
const symbol=id=>{const node=nodes.find(n=>n.id===id),station=stations.find(s=>s.id===id);return traStationSymbol(node,station,transferOptions(network,station).filter(l=>!station.lines.some(s=>s.name===l)));};
test('TRA internal, external and shared-interval transfers all use interchange symbols',()=>{
  for(const id of ['新竹','北新竹','竹中','南港','松山','台北','板橋','新左營','高雄','六家','沙崙'])assert.ok(symbol(id).interchange,id);
  for(const id of ['三坑','百福','千甲'])assert.equal(symbol(id).interchange,false,id);
});
test('terminal interchanges preserve terminal size and ordinary endpoints stay ordinary',()=>{
  assert.deepEqual(symbol('六家'),{terminal:true,interchange:true,radius:10});
  assert.deepEqual(symbol('沙崙'),{terminal:true,interchange:true,radius:10});
  assert.deepEqual(symbol('基隆'),{terminal:true,interchange:false,radius:10});
  assert.equal(symbol('新竹').radius,9);
});
