import test from 'node:test';
import assert from 'node:assert/strict';
import { networks, stationsFor, stationId, normalize, displayName, buildGraph, distances, validNext, transferOptions, routeGroups, routeLayout, stationCode, groupTerminals, branchTransfers, mapTransfers } from '../src/data.js';

for (const network of networks) {
  test(`${network.id}: every station is connected, edges are symmetric, lines have unique IDs`, () => {
    const graph = buildGraph(network);
    assert.equal(new Set(network.lines.map(l=>l.id)).size,network.lines.length);
    assert.equal(distances(graph,graph.keys().next().value).size,graph.size);
    for(const [from,neighbors] of graph)for(const to of neighbors){assert.ok(graph.get(to).has(from));assert.notEqual(from,to);}
    for(const line of network.lines){assert.ok(line.stops.length>=2);assert.equal(new Set(line.stops.map(raw=>stationId(network.id,line.id,raw))).size,line.stops.length);}
  });
}
const north=networks.find(n=>n.id==='north'),tra=networks[0],kh=networks.find(n=>n.id==='kaohsiung');
test('map branch transfers identify actual junctions without treating other stations on a branch as junctions',()=>{
  const stations=stationsFor(north),get=id=>stations.find(station=>station.id===id);
  assert.deepEqual(mapTransfers(north,get('北投'),'r'),['新北投支線']);
  assert.deepEqual(mapTransfers(north,get('七張'),'g'),['小碧潭支線']);
  assert.deepEqual(mapTransfers(north,get('大橋頭'),'o'),['新莊分支','蘆洲分支']);
  assert.deepEqual(mapTransfers(north,get('濱海沙崙'),'v'),['綠山線','藍海線']);
  for(const id of ['三重','頭前庄','紅樹林','新北投','崁頂'])assert.deepEqual(branchTransfers(north,get(id)),[]);
  assert.deepEqual(mapTransfers(north,get('三重'),'o-xinzhuang'),['桃園機場捷運']);
});
test('official station codes retain branches, skipped stations and real terminal topology',()=>{
  const code=(id,name)=>{const l=north.lines.find(l=>l.id===id);return stationCode(north,id,l.stops.find(s=>s.split('|')[0]===name));};
  assert.equal(code('r','廣慈/奉天宮'),'R01');assert.equal(code('r','淡水'),'R28');
  assert.equal(code('g','新店'),'G01');assert.equal(code('r-branch','新北投'),'R22A');
  assert.equal(code('g-branch','小碧潭'),'G03A');assert.equal(code('o-luzhou','三重國小'),'O50');
  assert.equal(code('a','機場旅館'),'A14a');assert.equal(code('a','大園'),'A15');
  assert.equal(code('a','老街溪'),'A22');assert.equal(code('y','大坪林'),'Y07');
  assert.equal(code('v-blue','淡水漁人碼頭'),'V26');
  const groups=routeGroups(north),red=groups.find(g=>g.id==='r');
  assert.ok(routeLayout(red).nodes[0].raw.startsWith('廣慈/奉天宮'));
  assert.deepEqual([...groupTerminals(north,red)].sort(),['淡水','廣慈/奉天宮','新北投'].sort());
  assert.deepEqual([...groupTerminals(north,groups.find(g=>g.id==='o'))].sort(),['南勢角','迴龍','蘆洲'].sort());
});
test('Taichung and Kaohsiung retain official codes including skipped and inserted numbers',()=>{
  const tc=networks.find(n=>n.id==='taichung');
  const code=(network,id,name)=>{const l=network.lines.find(l=>l.id===id);return stationCode(network,id,l.stops.find(s=>s.split('|')[0]===name));};
  assert.equal(code(tc,'tc-green','北屯總站'),'103a');assert.equal(code(tc,'tc-green','舊社'),'103');assert.equal(code(tc,'tc-green','高鐵臺中站'),'119');
  assert.equal(code(kh,'kh-r','小港'),'R03');assert.equal(code(kh,'kh-r','草衙'),'R04A');assert.equal(code(kh,'kh-r','橋頭糖廠'),'R22A');assert.equal(code(kh,'kh-r','岡山車站'),'RK01');
  assert.equal(code(kh,'kh-o','前金'),'O04');assert.equal(code(kh,'kh-o','大寮'),'OT01');
  assert.equal(code(kh,'kh-c','內惟藝術中心'),'C21A');assert.equal(code(kh,'kh-c','美術館'),'C21');assert.equal(code(kh,'kh-c','輕軌機廠'),'C37');
});
test('merged metro diagrams include branches once and keep the Y junction',()=>{
  const groups=routeGroups(north),red=groups.find(g=>g.id==='r'),green=groups.find(g=>g.id==='g'),orange=groups.find(g=>g.id==='o'),danhai=groups.find(g=>g.id==='v');
  assert.equal(red.stops.length,29);assert.equal(green.stops.length,20);assert.equal(orange.stops.length,26);
  assert.ok(!groups.some(g=>['r-branch','g-branch','o-xinzhuang','o-luzhou'].includes(g.id)));
  const layout=routeLayout(orange);
  assert.equal(layout.nodes.filter(n=>n.raw.startsWith('大橋頭')).length,1);
  assert.equal(new Set(layout.nodes.map(n=>n.y)).size,3);
  assert.equal(danhai.stops.length,14);
  assert.ok(!groups.some(g=>['v-green','v-blue'].includes(g.id)));
  assert.deepEqual([...groupTerminals(north,danhai)].sort(),['紅樹林','崁頂','淡水漁人碼頭'].sort());
  assert.equal(routeLayout(danhai).nodes.filter(n=>n.raw==='濱海沙崙').length,1);
  const graph=buildGraph(north);
  assert.deepEqual([...graph.get('大橋頭')].sort(),['民權西路','台北橋','三重國小'].sort());
});
test('HSR transfer answers use actual connecting station names',()=>{
  const hsr=networks.find(n=>n.id==='hsr'), stations=stationsFor(hsr);
  const options=id=>transferOptions(hsr,stations.find(s=>s.id===id));
  assert.deepEqual(options('新竹'),['台鐵・六家']);
  assert.deepEqual(options('台南'),['台鐵・沙崙']);
  assert.deepEqual(options('彰化'),[]);
  assert.ok(options('左營').includes('台鐵・新左營'));
  assert.equal(stations.filter(s=>options(s.id).length).length,9);
});
test('station counts and current scope',()=>{
  assert.equal(tra.lines.length,17);
  assert.equal(stationsFor(networks[1]).length,12);
  assert.equal(networks.find(n=>n.id==='taichung').lines[0].stops.length,18);
  assert.deepEqual(kh.lines.map(l=>l.stops.length),[25,14,38]);
  assert.ok(north.lines[0].stops.at(-1).includes('松山慈惠堂'));
  assert.ok(tra.lines[0].stops.includes('平鎮'));
  assert.ok(!networks[1].lines[0].stops.includes('宜蘭'));
});
test('route answers advance sequentially along any shortest path',()=>{
  const graph=new Map([['A',new Set(['B','C'])],['B',new Set(['A','D'])],['C',new Set(['A','D'])],['D',new Set(['B','C'])]]);
  const distance=distances(graph,'D');
  assert.equal(distance.get('A'),2);assert.ok(validNext(graph,distance,'A','B'));assert.ok(validNext(graph,distance,'A','C'));
  assert.ok(!validNext(graph,distance,'A','D'));assert.ok(!validNext(graph,distance,'B','A'));
});
test('circular light rail closes at the depot and has shortest paths in both directions',()=>{
  const graph=buildGraph(kh),distance=distances(graph,'輕軌機廠');
  assert.equal(distance.get('籬仔內'),1);assert.equal(distance.get('凱旋瑞田'),2);
  assert.ok(graph.get('輕軌機廠').has('籬仔內'));
});
test('branch lines connect and same-name gondola station remains distinct',()=>{
  const graph=buildGraph(north);
  assert.equal(distances(graph,'新北投').get('北投'),1);
  assert.equal(distances(graph,'小碧潭').get('七張'),1);
  assert.equal(distances(graph,'淡水漁人碼頭').get('濱海沙崙'),3);
  assert.notEqual(stationId('north','br','動物園'),stationId('north','gondola','動物園'));
  assert.equal(distances(graph,'動物園:纜車').get('動物園'),1);
});
test('shared transfer stations only count once; subtitles remain available',()=>{
  const stations=stationsFor(north);
  assert.equal(stations.filter(s=>s.id==='中正紀念堂').length,1);
  assert.equal(stations.find(s=>s.id==='十四張').raw,'十四張|莊敬高職');
  assert.equal(displayName('廣慈/奉天宮|松山慈惠堂',true),'廣慈/奉天宮 | 松山慈惠堂');
  assert.equal(normalize('臺北１０１／世貿 ｜ 副站名'),'台北101/世貿副站名');
});
test('transfer questions merge branches and include serving line for external interchange',()=>{
  const get=(n,id)=>stationsFor(n).find(s=>s.id===id);
  assert.deepEqual(transferOptions(north,get(north,'大橋頭')),[]);
  assert.ok(transferOptions(north,get(north,'中山')).includes('松山新店線'));
  const tc=networks.find(n=>n.id==='taichung');
  assert.deepEqual(transferOptions(tc,get(tc,'松竹')),['綠線','台鐵']);
  assert.ok(transferOptions(tra,get(tra,'台北')).includes('高鐵'));
  assert.deepEqual(transferOptions(north,get(north,'新埔')).sort(),['板南線','環狀線'].sort());
});
