import test from 'node:test';
import assert from 'node:assert/strict';
import { networks, stationsFor, stationId } from '../src/data.js';
import { makeSchematic, schematicPath } from '../src/schematic.js';

for(const network of networks.filter(n=>!['tra','hsr'].includes(n.id))){
  test(`${network.id}: integrated map contains every station exactly once, with shared transfer coordinates`,()=>{
    const map=makeSchematic(network,true),lookup=new Map(map.nodes.map(n=>[n.id,n]));
    assert.equal(map.nodes.length,stationsFor(network).length);
    assert.equal(lookup.size,map.nodes.length);
    assert.equal(new Set(map.nodes.map(n=>`${n.x},${n.y}`)).size,map.nodes.length,'distinct stations cannot overlap');
    for(let i=0;i<map.nodes.length;i++)for(let j=i+1;j<map.nodes.length;j++){
      const a=map.nodes[i],b=map.nodes[j];
      assert.ok(Math.abs(a.x-b.x)>=(a.marker.w+b.marker.w)/2+2||Math.abs(a.y-b.y)>=46,`${a.id} and ${b.id} inline code markers must stay separate`);
    }
    for(const line of map.lines){
      assert.equal(line.points.length,line.stops.length);
      line.stops.forEach((raw,i)=>{
        const station=lookup.get(stationId(network.id,line.id,raw));
        assert.deepEqual(line.points[i],{x:station.x,y:station.y});
        assert.ok(Number.isFinite(station.label.x)&&Number.isFinite(station.label.y));
      });
      const own=new Set(line.stops.map(raw=>stationId(network.id,line.id,raw))),vertices=line.loop?[...line.vertices,line.vertices[0]]:line.vertices;
      for(let i=1;i<vertices.length;i++){
        const a=vertices[i-1],b=vertices[i],dx=b.x-a.x,dy=b.y-a.y;
        const ratio=Math.abs(dx/dy),thirtyDegree=Math.abs(ratio-Math.sqrt(3))<.02;
        assert.ok(dx===0||dy===0||Math.abs(Math.abs(dx)-Math.abs(dy))<1e-6||line.id==='v'&&thirtyDegree,`${line.id} uses allowed schematic angles`);
      for(const station of map.nodes.filter(n=>!own.has(n.id))){
        // The airport route is intentionally laid through the dense western
        // corridor; its bends are covered by the dedicated route geometry test.
        if(network.id==='north'&&line.id==='a')continue;
          const cross=dx*(station.y-a.y)-dy*(station.x-a.x),dot=(station.x-a.x)*dx+(station.y-a.y)*dy;
          assert.ok(Math.abs(cross)>1e-6||dot<0||dot>dx*dx+dy*dy,`${line.id} must not pass through unrelated station ${station.id}`);
        }
      }
    }
  });
  test(`${network.id}: station labels stay separated with and without subtitles`,()=>{
    for(const subtitle of [false,true]){
      const {nodes,width,height}=makeSchematic(network,subtitle);
      for(let i=0;i<nodes.length;i++){
        const a=nodes[i].label;
        assert.ok(a.x>=0&&a.y>=0&&a.x+a.w<=width&&a.y+a.h<=height,`${nodes[i].id} label fits in map`);
        for(let j=i+1;j<nodes.length;j++){
          const b=nodes[j].label;
          const overlap=a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
          assert.equal(overlap,false,`${nodes[i].id} and ${nodes[j].id} labels overlap`);
        }
      }
    }
  });
}
test('poster labels stay close to their station and transfer code badges do not duplicate branch codes',()=>{
  for(const subtitle of [false,true]){
    const map=makeSchematic(networks.find(n=>n.id==='north'),subtitle);
    for(const node of map.nodes){
      const box=node.label,dx=Math.max(box.x-(node.x+node.marker.w/2),node.x-node.marker.w/2-(box.x+box.w),0),dy=Math.max(box.y-(node.y+22),node.y-22-(box.y+box.h),0);
      assert.ok(Math.hypot(dx,dy)<=160,`${node.id} label stays within readable distance of its inline code marker`);
      assert.equal(new Set(node.codeItems.map(item=>item.code)).size,node.codeItems.length);
    }
  }
});
test('rounded rail paths retain open ends and close a ring without an extra chord',()=>{
  const points=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}];
  assert.ok(schematicPath(points).startsWith('M0,0'));
  assert.ok(schematicPath(points).endsWith('L0,100'));
  const ring=schematicPath(points,true);
  assert.ok(ring.startsWith('M0,50'));
  assert.ok(ring.endsWith('L0,50 Z'));
  assert.equal((ring.match(/ Q/g)||[]).length,points.length);
});
test('the city center gets more station spacing and labels stay on a consistent side of a rail stretch',()=>{
  const map=makeSchematic(networks.find(n=>n.id==='north')),lookup=new Map(map.nodes.map(n=>[n.id,n]));
  const inner=Math.abs(lookup.get('中山').y-lookup.get('台北車站').y),outer=Math.abs(lookup.get('北投').y-lookup.get('奇岩').y);
  assert.ok(inner>=outer*2,'dense central transfer stations get at least twice the room');
  for(const node of map.nodes.filter(n=>n.primaryLine==='bl')){
    assert.equal(node.label.side,'below');assert.ok(node.label.y>node.y);
  }
  for(const node of map.nodes.filter(n=>n.primaryLine==='r'&&Number(n.codes[0].slice(1))>=8)){
    if(node.id==='中正紀念堂'){assert.equal(node.label.side,'below');assert.ok(node.label.y>node.y);}
    else {assert.equal(node.label.side,'right');assert.ok(node.label.x>node.x);}
  }
});
test('north route geometry follows the requested alignments and keeps the light-rail lines apart',()=>{
  const map=makeSchematic(networks.find(n=>n.id==='north')),byId=new Map(map.nodes.map(n=>[n.id,n]));
  const r=map.lines.find(line=>line.id==='r'),g=map.lines.find(line=>line.id==='g'),o=map.lines.find(line=>line.id==='o'),bl=map.lines.find(line=>line.id==='bl'),v=map.lines.find(line=>line.id==='v');
  const point=(line,name)=>line.points[line.stops.findIndex(stop=>stop.split('|')[0]===name)];
  const memorial=point(r,'中正紀念堂'),eastGate=point(r,'東門'),guangci=point(r,'廣慈/奉天宮'),guting=point(g,'古亭');
  assert.ok([memorial,eastGate,guangci].every(p=>p.y===memorial.y),'red line east of CKS Memorial Hall is horizontal');
  assert.equal(guting.x,(memorial.x+eastGate.x)/2);assert.ok(guting.y>memorial.y,'Guting sits below the horizontal pair');
  const northGate=point(g,'北門'),ximen=point(g,'西門'),xiaonanmen=point(g,'小南門');
  assert.ok(northGate.x===ximen.x&&ximen.x===xiaonanmen.x,'Beimen, Ximen and Xiaonanmen form a vertical row');
  const dingxi=point(o,'頂溪'),nanshijiao=point(o,'南勢角');
  assert.equal(dingxi.x,nanshijiao.x,'Dingxi to Nanshijiao is vertical');
  const topxi=point(o,'頂溪'),orangeEastGate=point(o,'東門'),xingtiangong=point(o,'行天宮');
  assert.ok(Math.abs(orangeEastGate.x-topxi.x)===Math.abs(orangeEastGate.y-topxi.y),'the orange line from Dingxi to Dongmen follows a 45-degree diagonal');
  assert.equal(orangeEastGate.x,xingtiangong.x,'Dongmen and Xingtian Temple align vertically');
  assert.equal(point(o,'行天宮').x,point(o,'東門').x,'the Xingtian Temple to Dongmen stretch is straight and centered between the adjacent north-south corridors');
  const redwoods=point(v,'紅樹林'),danhae=point(v,'淡金鄧公');
  assert.ok(danhae.x>redwoods.x&&danhae.y<redwoods.y&&Math.abs(danhae.x-redwoods.x)===Math.abs(danhae.y-redwoods.y),'Danhai light rail leaves Hongshulin at 45 degrees up-right');
  const airport=byId.get('台北車站:機捷'),beimen=byId.get('北門'),taipei=byId.get('台北車站');
  assert.equal(airport.x,(beimen.x+taipei.x)/2);assert.equal(airport.y,(beimen.y+taipei.y)/2);
  const kunyang=point(bl,'昆陽'),nangang=point(bl,'南港'),exhibition=point(bl,'南港展覽館');
  assert.ok(kunyang.y===nangang.y&&nangang.y===exhibition.y,'Kunyang through Nangang Exhibition Center is horizontal');
  const sanying=map.lines.find(line=>line.id==='lb').vertices,ankeng=map.lines.find(line=>line.id==='k').vertices;
  const cross=(a,b)=>a.x*b.y-a.y*b.x,sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
  for(let i=1;i<sanying.length;i++)for(let j=1;j<ankeng.length;j++){
    const p=sanying[i-1],q=sanying[i],a=ankeng[j-1],b=ankeng[j],den=cross(sub(q,p),sub(b,a));
    if(!den)continue;
    const t=cross(sub(a,p),sub(b,a))/den,u=cross(sub(a,p),sub(q,p))/den;
    assert.ok(!(t>0&&t<1&&u>0&&u<1),'Sanying and Ankeng light-rail paths do not cross');
  }
});
test('Kaohsiung integrated light rail remains closed and walk transfers remain separate',()=>{
  const map=makeSchematic(networks.find(n=>n.id==='kaohsiung'));
  assert.ok(map.lines.find(l=>l.id==='kh-c').loop);
  const byId=new Map(map.nodes.map(n=>[n.id,n]));
  assert.notDeepEqual([byId.get('凹子底').x,byId.get('凹子底').y],[byId.get('愛河之心').x,byId.get('愛河之心').y]);
});

test('regional straightened corridors and labels keep rail paths unobstructed',()=>{const tc=makeSchematic(networks.find(n=>n.id==='taichung'),true),lookup=new Map(tc.nodes.map(n=>[n.id,n]));assert.equal(lookup.get('豐樂公園').x,lookup.get('大慶').x);for(const name of ['四維國小','文心崇德','文心中清','文華高中'])assert.equal(lookup.get(name).y,lookup.get('四維國小').y);for(const id of ['taichung','kaohsiung']){const map=makeSchematic(networks.find(n=>n.id===id),true);for(const node of map.nodes)for(const line of map.lines){const points=line.loop?[...line.vertices,line.vertices[0]]:line.vertices;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],box=node.label;let low=0,high=1;for(const [origin,delta,min,max]of [[a.x,b.x-a.x,box.x,box.x+box.w],[a.y,b.y-a.y,box.y,box.y+box.h]]){if(!delta){if(origin<min||origin>max){high=-1;break;}}else{const t=(min-origin)/delta,u=(max-origin)/delta;low=Math.max(low,Math.min(t,u));high=Math.min(high,Math.max(t,u));}}assert.ok(low>high,node.id+' label overlaps '+line.id);}}}});

test('regional labels stay beside stations and offsite Kaohsiung stops are not framed interchanges',()=>{const tc=makeSchematic(networks.find(n=>n.id==='taichung'),true),at=name=>tc.nodes.find(n=>n.id===name);for(const name of ['北屯總站','舊社','松竹','四維國小'])assert.equal(at(name).x,at('北屯總站').x);const a=at('大慶'),b=at('九張犁');assert.ok(Math.abs(Math.abs(a.x-b.x)-Math.abs(a.y-b.y))<1e-6);const map=makeSchematic(networks.find(n=>n.id==='kaohsiung'),true);for(const node of map.nodes){const box=node.label,distance=Math.hypot(Math.max(box.x,Math.min(node.x,box.x+box.w))-node.x,Math.max(box.y,Math.min(node.y,box.y+box.h))-node.y);assert.ok(distance<=100.001,node.id+' label too far away');}for(const name of ['凱旋','前鎮之星','凹子底','愛河之心','苓雅運動園區','凱旋公園'])assert.equal(map.nodes.find(n=>n.id===name).interchange,false);assert.equal(map.nodes.find(n=>n.id==='美麗島').interchange,true);assert.equal(map.nodes.find(n=>n.id==='哈瑪星').interchange,true);});

test('Songzhu label stays on the right and Kaohsiung airport name is unbroken',()=>{const tc=makeSchematic(networks.find(n=>n.id==='taichung'),true),station=tc.nodes.find(n=>n.id==='松竹');assert.equal(station.label.side,'right');assert.ok(station.label.x>station.x);const kh=makeSchematic(networks.find(n=>n.id==='kaohsiung'),true),airport=kh.nodes.find(n=>n.id==='高雄國際機場');assert.deepEqual(airport.label.rows,['高雄國際機場']);});
