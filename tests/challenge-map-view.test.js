import test from 'node:test';
import assert from 'node:assert/strict';
import {networks} from '../src/data.js';
import {makeSchematic} from '../src/schematic.js';
import {challengeMapBounds,challengeMapFrame,constrainChallengeView} from '../src/challenge-map-view.js';
for(const network of networks.filter(n=>!['tra','hsr'].includes(n.id))){
 test(`${network.id}: challenge overview contains every station and prevents overview drift`,()=>{
  const map=makeSchematic(network,true),bounds=challengeMapBounds(map);
  for(const aspect of [.7,1.5,2]){
   const frame=challengeMapFrame(bounds,aspect);
   const view=constrainChallengeView({zoom:1,x:100000,y:-100000},bounds,frame,map);
   assert.equal(view.x+map.width/2,bounds.x);assert.equal(view.y+map.height/2,bounds.y);
   for(const node of map.nodes){assert.ok(node.x>=bounds.x-frame.width/2&&node.x<=bounds.x+frame.width/2);assert.ok(node.y>=bounds.y-frame.height/2&&node.y<=bounds.y+frame.height/2);}
   const zoomed=constrainChallengeView({zoom:4,x:100000,y:-100000},bounds,frame,map);
   assert.ok(zoomed.x+map.width/2<=bounds.right);assert.ok(zoomed.y+map.height/2>=bounds.top);
  }
 });
}
