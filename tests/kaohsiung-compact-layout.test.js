import test from 'node:test';
import assert from 'node:assert/strict';
import {compactKaohsiung} from '../src/kaohsiung-compact-layout.js';
test('red and orange rail intervals retain their original distances',()=>{
 const layout=compactKaohsiung(112,1,.95,1.2,8,1,1,1),distances=[];
 for(const [id,points] of Object.entries(layout.positions)){
  if(id==='kh-c')continue;
  const count=points.length-1;
  for(let i=0;i<count;i++){if(id==='kh-o'&&i<3)continue;
   const path=[points[i],...(layout.bends[id][i]||[]),points[(i+1)%points.length]];
   const length=path.slice(1).reduce((sum,p,j)=>sum+Math.hypot(p[0]-path[j][0],p[1]-path[j][1]),0);
   distances.push(length);
  }
 }
 assert.equal(distances.length,34);
 assert.ok(Math.max(...distances)-Math.min(...distances)<1e-8);
 assert.ok(distances.every(d=>Math.abs(d-112)<1e-8));
});

test('horizontal spacing increases 35 percent while vertical spacing and transfer anchors remain unchanged',()=>{
 const original=compactKaohsiung(112,1),wide=compactKaohsiung();
 for(const id of ['kh-r','kh-o'])for(let i=0;i<original.positions[id].length;i++){if(id==='kh-r'&&i>18)continue;assert.equal(wide.positions[id][i][0],original.positions[id][i][0]*1.35);assert.equal(wide.positions[id][i][1],original.positions[id][i][1]);}
 assert.deepEqual(wide.positions['kh-r'][13],wide.positions['kh-c'][24]);
 assert.deepEqual(wide.positions['kh-r'][20],wide.positions['kh-c'][2]);
});

test('light rail remains on its rounded rectangle through all fixed interchanges',async()=>{
 const m=compactKaohsiung(112,1.35,.95,1.2,8,1,1),ring=m.rings['kh-c'];
 for(const [x,y]of m.positions['kh-c'])assert.ok(ring.vertices.some((a,i)=>{const b=ring.vertices[(i+1)%ring.vertices.length],dx=b[0]-a[0],dy=b[1]-a[1],dot=(x-a[0])*dx+(y-a[1])*dy;return Math.abs(dx*(y-a[1])-dy*(x-a[0]))<1e-7&&dot>=-1e-7&&dot<=dx*dx+dy*dy+1e-7;}));
 assert.deepEqual(m.positions['kh-c'][13],m.positions['kh-o'][0]);
});

test('light rail has four straight sides joined by rounded corners',()=>{
 const {rings}=compactKaohsiung(),v=rings['kh-c'].vertices;
 const xs=v.map(p=>p[0]),ys=v.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 const near=(a,b)=>Math.abs(a-b)<1e-7;
 for(const [axis,value] of [[0,left],[0,right],[1,top],[1,bottom]])assert.ok(v.filter(p=>near(p[axis],value)).length>=2);
 assert.ok(v.length>60,'rounded corners are sampled along circular arcs');
 for(const x of [left,right])for(const y of [top,bottom])assert.ok(!v.some(p=>near(p[0],x)&&near(p[1],y)),'no square corner');
});

test('O1 to O5 expands westward without moving the red line or eastern orange corridor',()=>{
 const old=compactKaohsiung(112,1.35,.95,1.2,8,1,1.45),wide=compactKaohsiung();
 assert.deepEqual(wide.positions['kh-r'],old.positions['kh-r']);
 for(let i=3;i<14;i++)assert.deepEqual(wide.positions['kh-o'][i],old.positions['kh-o'][i]);
 for(let i=0;i<3;i++){assert.ok(Math.abs(wide.positions['kh-o'][i][0]-old.positions['kh-o'][3][0])>Math.abs(old.positions['kh-o'][i][0]-old.positions['kh-o'][3][0])*1.59);assert.equal(wide.positions['kh-o'][i][1],old.positions['kh-o'][i][1]);}
 assert.deepEqual(wide.positions['kh-c'][13],wide.positions['kh-o'][0]);
});

test('R03 to R10 gains 45 percent spacing while orange and northern red stations stay fixed',()=>{
 const old=compactKaohsiung(112,1.35,.95,1.2,8,1.6,1),wide=compactKaohsiung();
 assert.deepEqual(wide.positions['kh-o'],old.positions['kh-o']);
 for(let i=0;i<=16;i++)assert.deepEqual(wide.positions['kh-r'][i],old.positions['kh-r'][i]);
 for(let i=17;i<25;i++){const a=old.positions['kh-r'][16],p=old.positions['kh-r'][i],q=wide.positions['kh-r'][i];assert.ok(Math.abs(q[0]-a[0]-(p[0]-a[0])*1.45)<1e-7);assert.ok(Math.abs(q[1]-a[1]-(p[1]-a[1])*1.45)<1e-7);}
 assert.deepEqual(wide.positions['kh-c'][2],wide.positions['kh-r'][20]);
});

test('R08 through R04A is one exact 45 degree diagonal at every horizontal map scale',()=>{
 for(const scale of [1,1.35,1.7]){
  const m=compactKaohsiung(112,scale),p=m.positions['kh-r'];
  for(let i=19;i<=22;i++){const dx=p[i][0]-p[i-1][0],dy=p[i][1]-p[i-1][1];assert.ok(dx>0&&dy>0);assert.ok(Math.abs(dx-dy)<1e-7);assert.deepEqual(m.bends['kh-r'][i-1],[]);}
  assert.deepEqual(p[20],m.positions['kh-c'][2]);
  assert.equal(p[22][1],p[23][1]);assert.equal(p[23][1],p[24][1]);
 }
});

test('R13 to R10 increases 50 percent while southern geometry only translates',()=>{
 const old=compactKaohsiung(112,1.35,.95,1.2,8,1.6,1.45,1),wide=compactKaohsiung();
 for(let i=0;i<=13;i++)assert.deepEqual(wide.positions['kh-r'][i],old.positions['kh-r'][i]);
 for(let i=14;i<=16;i++)assert.ok(Math.abs(wide.positions['kh-r'][i][1]-old.positions['kh-r'][i][1]*1.5)<1e-7);
 for(let i=17;i<25;i++){assert.equal(wide.positions['kh-r'][i][0],old.positions['kh-r'][i][0]);assert.ok(Math.abs(wide.positions['kh-r'][i][1]-old.positions['kh-r'][i][1]-168)<1e-7);}
 assert.deepEqual(wide.positions['kh-r'][13],wide.positions['kh-c'][24]);assert.deepEqual(wide.positions['kh-r'][20],wide.positions['kh-c'][2]);
});

test('O1 to O2 is horizontal without bends',()=>{const m=compactKaohsiung();assert.equal(m.positions['kh-o'][0][1],m.positions['kh-o'][1][1]);assert.deepEqual(m.bends['kh-o'][0],[]);});
