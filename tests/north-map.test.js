import {commentReference} from '../src/north-map-comment-reference.js';
import {southHeightReference} from '../src/north-map-south-height-reference.js';
import {southFixedTrack,southFixedSpacing} from '../src/north-map-south-fixed-track.js';
import {wenhuSouthTrack} from '../src/north-map-wenhu-south-track.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { northRoutes } from '../src/north-map-data.js';
import { networks } from '../src/data.js';
import { buildNorthMap, toNorthScreen } from '../src/north-map-model.js';
import { northRouteTrackPath, createNorthSvg } from '../src/north-map-svg.js';
import { northLayout } from '../src/north-map-layout.js';
import { northRoundedPath } from '../src/north-map-path.js';
import {junctionReferenceLayout} from '../src/north-map-junction-reference.js';
import {latestSpacingReference} from '../src/north-map-latest-spacing-reference.js';
import {serviceReferenceLayout} from '../src/north-map-service-reference.js';

// Read the attachment's table independently of the importer and map renderer.
const spec=readFileSync(new URL('../docs/north-map-spec.txt',import.meta.url),'utf8');
const table=spec.split('各線有序座標表')[1].split('轉乘與步行連接')[0];
const sourceRoutes=table.split(/\r?\n/).filter(line=>line.includes(' → ')).map(line=>line.split(' → ').map(token=>{
  const open=token.lastIndexOf('('),[x,y]=token.slice(open+1,-1).split(',').map(Number);
  return {raw:token.slice(0,open),x,y,control:token.startsWith('@')};
}));
const model=buildNorthMap({full:false}),svg=createNorthSvg(model);
const document=new JSDOM(svg,{contentType:'image/svg+xml'}).window.document;
const same=(a,b)=>assert.deepEqual(a,b);
const point=id=>model.byId.get(id).coordinate;

test('north: every source coordinate, name, control and ordered connection is preserved',()=>{
  same(northRoutes.map(route=>route.points),sourceRoutes);
  assert.equal(model.routes.length,17);
  assert.equal(model.systems.length,11);
  assert.equal(model.stations.length,97);
  const sourceStations=new Map(sourceRoutes.flat().filter(p=>!p.control).map(p=>[p.raw,p]));
  same([...model.byId.keys()].sort(),[...sourceStations.keys()].sort());
  for(const [name,p] of sourceStations){
    same(point(name),{x:p.x,y:p.y});
    const circle=document.querySelector(`[data-station="${name}"] circle`),screen=toNorthScreen(p);
    assert.equal(Number(circle.getAttribute('cx')),screen.x);
    assert.equal(Number(circle.getAttribute('cy')),screen.y);
  }
  for(const [i,route]of model.routes.entries()){
    const element=document.querySelector(`[data-route="${route.id}"]`);
    const expected=sourceRoutes[i].map((p,j)=>`${j?'L':'M'}${Number(toNorthScreen(p).x.toFixed(4))},${Number(toNorthScreen(p).y.toFixed(4))}`).join(' ');
    assert.equal(element.getAttribute('d'),expected,route.title);
    assert.equal(element.getAttribute('stroke'),route.color);
    for(let j=1;j<sourceRoutes[i].length;j++){
      const a=sourceRoutes[i][j-1],b=sourceRoutes[i][j],dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);
      assert.ok(dx===0||dy===0||Math.abs(dx-dy)<1e-8,`${route.id}: ${a.raw} → ${b.raw}`);
    }
  }
  assert.equal(document.querySelectorAll('[data-station^="@"], [data-label^="@"]').length,0);
});

test('north: exact attachment colors and all 11 systems appear in the legend',()=>{
  const colors=[...spec.matchAll(/^([A-Z]+ [^\r\n]+|貓空纜車)\t(#[A-Fa-f0-9]{6})$/gm)].map(([,name,color])=>[name,color]);
  assert.equal(colors.length,11);
  for(const [name,color]of colors){
    const system=model.systems.find(s=>(s.id==='gondola'?s.name:`${s.id} ${s.name}`)===name.replace('（西環段）',''));
    assert.ok(system,name);assert.equal(system.color,color);
    assert.equal(document.querySelector(`[data-legend-system="${system.id}"] line, [data-legend-system="${system.id}"] path`).getAttribute('stroke'),color);
  }
  assert.equal(document.querySelectorAll('[data-legend-system]').length,11);
  assert.equal(document.querySelector('[data-legend-system="gondola"] text').textContent,'貓空纜車');
});

test('north: merged transfers, true branch junctions and four separate walking links',()=>{
  const transfers={紅樹林:['R','V'],民權西路:['R','O'],東門:['R','O'],中山:['R','G'],中正紀念堂:['R','G'],台北車站:['R','BL'],大安:['R','BR'],西門:['G','BL'],古亭:['G','O'],松江南京:['G','O'],南京復興:['G','BR'],忠孝新生:['O','BL'],忠孝復興:['BL','BR'],南港展覽館:['BL','BR'],景安:['O','Y'],頭前庄:['O','Y'],三重:['O','A'],大坪林:['G','Y'],新北產業園區:['Y','A'],十四張:['Y','K'],頂埔:['BL','LB']};
  for(const [name,systems]of Object.entries(transfers)){
    same(model.byId.get(name).systems.slice().sort(),systems.sort());
    assert.equal(document.querySelectorAll(`[data-station="${name}"]`).length,1);
    assert.equal(document.querySelector(`[data-station="${name}"] circle`).getAttribute('r'),'12.5');
  }
  same(model.stations.filter(s=>s.branch).map(s=>s.id).sort(),['北投','七張','濱海沙崙'].sort());
  assert.equal(model.byId.get('大橋頭').interchange,false);
  const o=model.routes.filter(r=>r.system==='O');
  same(o.map(r=>r.points.filter(p=>p.control).at(-1)?.coordinate),[{x:-4,y:5},{x:-4,y:5},{x:-4,y:5}]);
  same(model.routes.filter(r=>r.system==='V').map(r=>r.points.some(p=>(p.id||p.raw)==='濱海沙崙')),[true,true,true]);
  const pairs=[['台北車站','台北車站〔A〕'],['板橋〔BL〕','板橋〔Y〕'],['新埔','新埔民生'],['動物園〔BR〕','動物園〔纜車〕']];
  same(model.walks.map(w=>[w.from.id,w.to.id]),pairs);
  for(const [from,to]of pairs){
    assert.notDeepEqual(point(from),point(to));
    assert.equal(document.querySelector(`[data-walk-from="${from}"][data-walk-to="${to}"]`).getAttribute('stroke-dasharray'),'6 5');
  }
  same(model.byId.get('北門').systems,['G']);
  assert.equal(model.byId.get('三重').routes.length,2);
  assert.equal(model.routes.find(r=>r.system==='Y').points[0].id,'大坪林');
  assert.equal(model.routes.find(r=>r.system==='Y').points.at(-1).id,'新北產業園區');
});

test('north: non-transfer crossings have gaps without moving any geometry',()=>{
  assert.equal(model.crossings.length,2);
  assert.equal(model.coincident.length,0);
  for(const crossing of model.crossings){
    assert.ok(document.querySelector(`[data-route="${crossing.under.route}"]`).hasAttribute('mask'));
    const mask=document.querySelector(`#crossing-${crossing.under.route} circle`);
    assert.equal(Number(mask.getAttribute('cx')),crossing.x);
    assert.equal(Number(mask.getAttribute('cy')),crossing.y);
  }
  const banqiao=model.crossings.find(c=>c.station==='板橋〔BL〕');
  assert.equal(banqiao.under.system,'Y');assert.equal(banqiao.over.system,'BL');
  const beimen=model.crossings.find(c=>c.over.system==='A');
  same({x:beimen.x,y:beimen.y},toNorthScreen({x:-2,y:1.3}));
});

test('north: exact station labels occur once, use leaders and remain within square canvas',()=>{
  const names=[...new Set(sourceRoutes.flat().filter(p=>!p.control).map(p=>p.raw.replace(/〔[^〕]+〕/g,'')))].sort();
  same(model.labels.map(l=>l.name).sort(),names);
  same([...document.querySelectorAll('[data-label]')].map(n=>n.textContent).sort(),names);
  assert.equal(names.length,94);
  for(const label of model.labels){
    assert.ok(label.x>0&&label.y>0&&label.x+label.w<3200&&label.y+label.h<3045,label.name);
    for(const other of model.labels){
      if(label===other)continue;
      assert.ok(label.x>=other.x+other.w||other.x>=label.x+label.w||label.y>=other.y+other.h||other.y>=label.y+label.h,`${label.name}/${other.name}`);
    }
    if(label.stationIds.length>1)for(const id of label.stationIds)assert.ok(document.querySelector(`[data-leader-for="${id}"]`));
  }
  assert.equal(document.documentElement.getAttribute('viewBox'),'0 0 3200 3200');
  assert.equal(document.querySelector('[data-map-heading] text').textContent,'雙北・桃園軌道路網');
  assert.ok(document.querySelector('[data-map-source]').textContent.includes('參考自臺北捷運官方路網圖（臺北大眾捷運股份有限公司）'));
  assert.ok(document.querySelector('[data-map-source]').textContent.includes('非官方版本'));
  assert.equal(document.querySelectorAll('[data-station] circle[fill="black"]').length,0);
});

test('north: downloadable SVG matches the live artwork source',()=>{
  assert.equal(readFileSync(new URL('../public/maps/north-relative.svg',import.meta.url),'utf8'),createNorthSvg());
});

const full=buildNorthMap(),fullDocument=new JSDOM(createNorthSvg(full),{contentType:'image/svg+xml'}).window.document;
const north=networks.find(n=>n.id==='north');
const routeLinePairs=[['R-0','r'],['R-1','r-branch'],['G-0','g'],['G-1','g-branch'],['O-0','o'],['O-1','o-luzhou'],['O-2','o-xinzhuang'],['BL-0','bl'],['BR-0','br'],['gondola-0','gondola'],['Y-0','y'],['A-0','a'],['LB-0','lb'],['K-0','k'],['V-0','v'],['V-1','v-blue'],['V-2','v-green']];

test('north full: all route station names follow the complete question bank in order',()=>{
  assert.equal(full.stations.length,186);
  assert.equal(full.labels.length,183);
  assert.equal(full.stations.filter(s=>s.added).length,86);
  assert.equal(fullDocument.querySelectorAll('[data-station]').length,186);
  assert.equal(fullDocument.querySelectorAll('[data-label]').length,183);
  for(const [routeId,lineId]of routeLinePairs){
    const actual=full.routes.find(r=>r.id===routeId).points.filter(p=>!p.control).map(p=>p.name);
    let expected=north.lines.find(l=>l.id===lineId).stops.map(raw=>raw.split('|')[0]);
    if(lineId==='g'||lineId==='k')expected=expected.toReversed();
    if(lineId.startsWith('o-'))expected=expected.slice(1); // Invisible split lies after 大橋頭.
    if(lineId==='a'){expected.splice(expected.indexOf('機場旅館'),0,'機場第三航廈');expected.push('中壢車站');}
    same(actual,expected);
  }
});

test('north full: source coordinates stay traceable while reflow preserves directions, station order and rounded endpoints',()=>{
  const repositioned=new Set(['動物園〔BR〕','中和','橋和','中原','板新']);for(const station of model.stations)if(!repositioned.has(station.id))same(full.byId.get(station.id).coordinate,station.coordinate);
  for(const [routeId]of routeLinePairs){
    const expanded=full.routes.find(r=>r.id===routeId),original=northRoutes.find(r=>r.id===routeId);
    same(expanded.points.filter(p=>!p.added&&!p.control).map(p=>({raw:p.control?p.raw:p.sourceId||p.id,...(repositioned.has(p.sourceId||p.id)?original.points.find(q=>q.raw===(p.sourceId||p.id)):p.coordinate),control:!!p.control})),original.points.filter(p=>!p.control));
    const path=fullDocument.querySelector(`[data-route="${routeId}"]`).getAttribute('d');
    assert.equal(path,northRouteTrackPath(expanded,routeId==='A-0'?expanded.pathPoints.slice(0,-1):expanded.pathPoints));
    assert.ok(!path.includes('NaN')&&!path.includes('Infinity'));
    for(let i=1;i<expanded.pathPoints.length;i++){
      const a=expanded.pathPoints[i-1],b=expanded.pathPoints[i],dx=b.x-a.x,dy=b.y-a.y;
      if(routeId==='BR-0'&&i<=expanded.pathPoints.findIndex(p=>p.id==='科技大樓'))continue;
      let sx=Math.sign(b.coordinate.x-a.coordinate.x),sy=-Math.sign(b.coordinate.y-a.coordinate.y);
      if(routeId==='R-0'&&b.id==='廣慈/奉天宮'){sx=1;sy=0;}
      if(routeId==='BR-0'&&a.coordinate.x>=17&&a.coordinate.y>=8&&b.coordinate.y>=8&&sx&&sy){sx=20;sy=7;}
      if(routeId==='BR-0'&&((a.control&&a.coordinate.x===13)|| (b.control&&b.coordinate.x===13))){sx=Math.sign(dx);sy=Math.sign(dy);}
      if(routeId==='K-0'){sx=['陽光運動公園','安康'].includes(b.id)?-1:-1;sy=['陽光運動公園','安康'].includes(b.id)?Math.sqrt(3):0;}
      if(routeId==='A-0'&&(a.id==='三重'||b.id==='三重')){sx=-1;sy=0;}
      if(routeId==='BL-0'&&a.id==='江子翠'&&b.id==='龍山寺'){sx=1;sy=0;}
      if(routeId==='Y-0'&&['橋和','中原','板新','板橋〔Y〕'].includes(b.id)){sx=-1;sy=-1;}
      if(routeId==='Y-0'&&(a.id==='景安'||a.id==='中和')){sx=-1;sy=0;}
      if(routeId==='Y-0'&&a.id==='景平'){sx=-1;sy=0;}
      assert.ok(Math.abs(dx*sy-dy*sx)<1e-4,`${routeId}: preserves original axis`);
      assert.ok(dx*sx+dy*sy>0,`${routeId}: no folded-back segments ${a.id||a.raw} → ${b.id||b.raw}`);
    }
  }
  same(full.walks.map(w=>[w.from.id,w.to.id]),[...model.walks.filter(w=>w.to.id!=='動物園〔纜車〕'&&w.from.id!=='動物園〔纜車〕').map(w=>[w.from.id,w.to.id]),['北門','台北車站〔A〕'],['紅樹林','紅樹林〔V〕'],['新北產業園區','新北產業園區〔A〕'],['十四張','十四張〔K〕']]);
  assert.equal(full.coincident.length,0);
  assert.equal(fullDocument.querySelectorAll('mask,[data-route][mask]').length,0);
});

test('north full: all 38 subtitles are exact and every separate station body keeps its own name',()=>{
  const expected=new Map();
  for(const line of north.lines)for(const raw of line.stops){const [name,subtitle='']=raw.split('|');if(subtitle||!expected.has(name))expected.set(name,subtitle);}
  expected.set('機場第三航廈','');expected.set('中壢車站','');for(const name of ['寶斗厝','溝子口','馬明潭','文山區公所','政大'])expected.set(name,'');
  same([...new Set(full.labels.map(l=>l.name))].sort(),[...expected.keys()].sort());
  assert.equal(fullDocument.querySelectorAll('[data-station-subtitle]').length,38);
  for(const [name,subtitle]of expected){
    const label=fullDocument.querySelector(`[data-label="${name}"]`);
    assert.equal(label.textContent,name+(subtitle?` | ${subtitle}`:''));
    assert.equal(fullDocument.querySelectorAll(`[data-label="${name}"]`).length,['紅樹林','新北產業園區','十四張','三重'].includes(name)?1:full.stations.filter(s=>s.name===name).length);
  }
  for(const label of full.labels){
    assert.ok(label.distance<=90,`${label.name}: label stays close to its numbered marker`);
    assert.ok(label.x>0&&label.y>0&&label.x+label.w<full.width&&label.y+label.h<full.height-155);
    for(const other of full.labels){
      if(label===other)continue;
      assert.ok(label.x>=other.x+other.w||other.x>=label.x+label.w||label.y>=other.y+other.h||other.y>=label.y+label.h,`${label.name}/${other.name}`);
    }
  }
});

test('north full: official codes, black transfer frames and fill rules apply to every symbol',()=>{
  const lightRail=new Set(['K','V']);
  const terminalNames={R:['淡水','新北投','廣慈/奉天宮'],G:['松山','新店','小碧潭'],O:['南勢角','蘆洲','迴龍'],BL:['頂埔','南港展覽館'],BR:['動物園','南港展覽館'],Y:['大坪林','新北產業園區','動物園'],A:['台北車站','中壢車站'],LB:['頂埔','鶯桃福德'],K:['雙城','十四張'],V:['紅樹林','崁頂','淡水漁人碼頭'],gondola:['動物園','貓空']};
  const allCodes=[];
  for(const station of full.stations){
    const element=fullDocument.querySelector(`[data-station="${station.id}"]`),frame=element.querySelector('[data-transfer-frame]');
    assert.equal(!!frame,station.systems.length>1,station.id);
    if(frame)assert.equal(frame.getAttribute('stroke'),'#111111');
    for(const item of station.marker.items){
      const code=element.querySelector(`[data-station-code="${item.code}"]`),symbol=code.querySelector('[data-symbol-shape]');
      allCodes.push(item.code);
      const terminal=terminalNames[item.system].includes(station.name);
      const color=station.future||item.future?'#A8ADB5':full.routes.find(r=>r.system===item.system&&r.points.some(p=>p.id===station.id)).color;
      assert.equal(symbol.getAttribute('fill'),terminal||item.system==='A'?color:'white',`${station.id}: ${item.code}`);
      assert.equal(symbol.getAttribute('stroke'),color);
      assert.equal(symbol.tagName,lightRail.has(item.system)?'circle':'rect');
    }
  }
  assert.equal(new Set(allCodes).size,allCodes.length,'one physical code appears only once');
  assert.equal(allCodes.length,201);
  for(const [name,codes]of Object.entries({'台北車站':['BL12','R10'],'南港展覽館':['BL23','BR24'],'北投':['R22'],'新北投':['R22A'],'小碧潭':['G03A'],'紅樹林':['R27'],'紅樹林〔V〕':['V01'],'十四張':['Y08'],'十四張〔K〕':['K09'],'濱海沙崙':['V09'],'機場旅館':['A14a'],'鶯桃福德':['LB12']}))same(full.byId.get(name).codes.map(item=>item.code),codes);
});

test('north full: at least ten measured spacing adjustments and final marker clearance checks',()=>{
  const report=JSON.parse(readFileSync(new URL('../docs/north-map-spacing.json',import.meta.url),'utf8'));
  assert.ok(report.rounds.length>=10);
  assert.equal(report.rounds.length,northLayout.rounds.length);
  for(const [index,round]of report.rounds.entries()){
    assert.equal(round.round,index+1);assert.ok(round.maxMovement>.01);
    assert.equal(round.perLine.length,11);assert.ok(round.directionError<1e-5);
  }
  const last=report.rounds.at(-1);
  assert.deepEqual(last.markerOverlaps,[]);assert.deepEqual(last.reversedSegments,[]);
  const previous=JSON.parse(readFileSync(new URL('../docs/north-map-spacing-previous.json',import.meta.url),'utf8')).rounds.at(-1);
  assert.ok(last.westClearance>=400&&last.westClearance>previous.westClearance*1.4);
  const clearances=JSON.parse(readFileSync(new URL('../docs/north-map-route-clearance.json',import.meta.url),'utf8'));
  assert.equal(clearances.systemPairs,55);
  assert.ok(clearances.pairs.every(pair=>pair.gap>=20),'all route pairs retain visible space between distinct station frames');
  for(let i=0;i<full.stations.length;i++)for(let j=i+1;j<full.stations.length;j++){
    const a=full.stations[i],b=full.stations[j];
    assert.ok(Math.abs(a.x+(a.marker.dx||0)-b.x-(b.marker.dx||0))>=(a.marker.w+b.marker.w)/2||Math.abs(a.y-b.y)>=(a.marker.h+b.marker.h)/2,`${a.id}/${b.id}: station symbols cannot overlap`);
  }
});

test('north full: revised distances, offsite links, rail badges and unnumbered gondola',()=>{
  const p=id=>full.byId.get(id),old=junctionReferenceLayout.positions;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  for(const [a,b,factor]of [['沙崙','淡水漁人碼頭',.6],['新埔','新埔民生',.8],['板橋〔BL〕','板橋〔Y〕',.85]])assert.ok(distance(p(a),p(b))<distance(old[a],old[b])*factor,`${a}/${b}: shortened`);
  const wharf=p('淡水漁人碼頭'),tamsui=p('淡水');
  assert.ok(wharf.x<tamsui.x&&wharf.y<tamsui.y);assert.ok(Math.abs(wharf.x-tamsui.x-wharf.y+tamsui.y)<1e-5);
  assert.ok(distance(p('劍南路'),p('內湖'))>distance(old['劍南路'],old['內湖'])*1.25);
  const slope=(a,b)=>(b.y-a.y)/(b.x-a.x);
  assert.ok(slope(p('內湖'),p('東湖'))<slope(old['內湖'],old['東湖'])*.8);
  assert.equal(fullDocument.querySelectorAll('[data-leader-for]').length,0);
  for(const id of ['台北車站','板橋','動物園'])assert.equal(fullDocument.querySelectorAll(`[data-label="${id}"]`).length,2);
  for(const id of ['紅樹林','紅樹林〔V〕']){assert.equal(p(id).interchange,false);assert.equal(fullDocument.querySelector(`[data-station="${id}"] [data-transfer-frame]`),null);}
  for(const id of ['台北車站','南港','板橋〔BL〕','板橋〔Y〕','松山','鶯歌車站','高鐵桃園站'])assert.ok(fullDocument.querySelector(`[data-label-group="${id}"] [data-rail-transfer]`),id);
  assert.equal(fullDocument.querySelector('[data-label-group="龍山寺"] [data-rail-transfer]'),null);
  assert.equal(fullDocument.querySelectorAll('[data-gondola-symbol]').length,4);
  for(const s of full.stations.filter(s=>s.systems.includes('gondola')))assert.equal(fullDocument.querySelector(`[data-station="${s.id}"]`).querySelector('[data-station-code]'),null);
  assert.equal(full.systems.find(s=>s.id==='Y').color,'#FFDC00');
  for(const code of fullDocument.querySelectorAll('[data-station-code]'))if(/^[OY]\d/.test(code.getAttribute('data-station-code')))assert.equal(code.querySelector('text').getAttribute('fill'),'#111111');
});

test('north full: continuous label stretches never alternate sides and the R terminus stays horizontal',()=>{
  const lanes=new Map();
  for(const label of full.labels){
    if(!lanes.has(label.lane))lanes.set(label.lane,new Set());lanes.get(label.lane).add(label.side);
    if(label.stationIds.length===1&&!full.byId.get(label.stationIds[0]).interchange)assert.ok(label.distance<=65,`${label.name}: ordinary station label is adjacent`);
  }
  assert.ok([...lanes.values()].every(sides=>sides.size===1));
  for(const name of ['明德','芝山','士林','劍潭','圓山','雙連','台大醫院'])assert.equal(full.labels.find(l=>l.name===name).side,'right');
  const a=full.byId.get('象山'),b=full.byId.get('廣慈/奉天宮');
  assert.ok(b.x>a.x);assert.ok(Math.abs(b.y-a.y)<1e-5);
});

test('north full: latest offsite transfers, future stops, service geometry and chip centers',()=>{
  const p=id=>full.byId.get(id),orders={民權西路:['O11','R13'],中山:['G14','R11'],西門:['BL11','G12'],台北車站:['BL12','R10'],中正紀念堂:['G10','R08'],頭前庄:['O17','Y18'],松江南京:['G15','O08'],忠孝新生:['BL14','O07'],東門:['R07','O06'],大坪林:['Y07','G04'],大安:['R05','BR09'],忠孝復興:['BL15','BR10'],南京復興:['G16','BR11'],南港展覽館:['BL23','BR24']};
  for(const [name,codes]of Object.entries(orders))same(p(name).codes.map(c=>c.code),codes);
  for(const name of ['北投','七張','濱海沙崙','新北產業園區','十四張'])assert.equal(p(name).marker.framed,false);
  for(const name of ['古亭','景安','頂埔'])assert.equal(p(name).marker.framed,true);
  assert.equal(full.stations.filter(s=>s.marker.framed).length,19);
  for(const [name,code]of [['機場第三航廈','A14'],['中壢車站','A23']]){
    assert.equal(p(name).future,true);assert.deepEqual(p(name).codes,[{system:'A',code}]);
    assert.equal(fullDocument.querySelector(`[data-station="${name}"] [data-symbol-shape]`).getAttribute('stroke'),'#A8ADB5');
    assert.ok(fullDocument.querySelector(`[data-label-group="${name}"] [data-upcoming-note]`));
    assert.ok(!north.lines.flatMap(l=>l.stops).some(raw=>raw.split('|')[0]===name),'planned stops are outside the active answer bank');
  }
  assert.ok(fullDocument.querySelector('[data-upcoming-track]'));
  for(const name of ['北門','台北車站'])assert.ok(fullDocument.querySelector(`[data-label-group="${name}"] [data-metro-transfer="A"]`));
  assert.equal(fullDocument.querySelector('[data-label-group="台北車站〔A〕"] [data-metro-transfer]'),null);
  assert.ok(Math.abs(p('十四張〔K〕').y-p('新和國小').y)<1e-6&&p('新和國小').x<p('十四張〔K〕').x);
  assert.ok(p('安康').x<p('新和國小').x);assert.ok(Math.abs(p('安康').y-p('新和國小').y+(p('安康').x-p('新和國小').x)*Math.sqrt(3))<1e-5);
  assert.ok(Math.abs(p('安康').y-p('雙城').y)<1e-6);
  const previous=serviceReferenceLayout.positions;
  assert.ok(p('中和').y===p('景安').y);
  assert.ok(p('內湖').x-p('劍南路').x>600,'upper Wenhu stretch retains label room after the eastern Bannan compression');
  assert.ok((p('東湖').y-p('內湖').y)/(p('東湖').x-p('內湖').x)<.75);
  for(const route of full.routes)for(const point of route.pathPoints.filter(p=>!p.control)){
    const station=p(point.id),port=station.marker.ports[route.system];
    assert.ok(Math.abs(point.x-station.x-port.x)<1e-6&&Math.abs(point.y-station.y-port.y)<1e-6,'track passes through its own chip center');
  }
  const blue=full.routes.find(r=>r.system==='BL').pathPoints,n=blue.findIndex(p=>p.name==='南港');
  assert.equal(blue[n].x,p('南港').x);assert.equal(blue[n-1].y,blue[n].y);assert.equal(blue[n].y,blue[n+1].y);
  const a=full.routes.find(r=>r.id==='A-0').pathPoints.find(p=>p.vertexId==='A:@轉折:-1.5,1.3');
  assert.equal(Math.round(p('北門').y-p('台北車站〔A〕').y),-35);
  const drawn=[...fullDocument.querySelectorAll('[data-route]')].map(n=>n.getAttribute('data-route'));
  assert.ok(drawn.indexOf('G-0')>drawn.indexOf('A-0'),'green is above airport purple');
});


test('north full: latest horizontal, shared-label and centered transfer revision',()=>{
  const p=id=>full.byId.get(id),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5);
  near(p('景平').y,p('景安').y);near(p('象山').y,p('廣慈/奉天宮').y);
  same(p('頂埔').codes.map(c=>c.code),['LB01','BL01']);same(p('景安').codes.map(c=>c.code),['Y11','O02']);
  for(const s of full.stations.filter(s=>s.interchange)){near(s.marker.dx,0);for(const port of Object.values(s.marker.ports)){near(port.x,0);near(port.y,0);}}
  for(const name of ['紅樹林','新北產業園區'])assert.equal(fullDocument.querySelectorAll('[data-label="'+name+'"]').length,1);
  assert.equal(fullDocument.querySelector('[data-label-group="十四張〔K〕"]'),null);
  assert.equal(fullDocument.querySelector('[data-label-group="台北車站〔A〕"] [data-rail-transfer]'),null);
  const memorial=full.labels.find(l=>l.name==='中正紀念堂');assert.ok(memorial.x+memorial.w<p('中正紀念堂').x&&memorial.y>p('中正紀念堂').y);
  const bl=full.routes.find(r=>r.id==='BL-0').pathPoints,i=bl.findIndex(p=>p.id==='龍山寺');near(bl[i-1].y,bl[i].y);near(bl[i].y,bl[i+1].y);
  assert.ok(p('江子翠').y===p('龍山寺').y&&p('龍山寺').y>p('西門').y);
  assert.ok(p('東門').x-p('台北車站').x>=300);near(p('東門').x,p('行天宮').x);
  assert.equal(full.labels.find(l=>l.name==='南港').side,'below');
  const a=full.routes.find(r=>r.id==='A-0'),station=a.pathPoints.find(p=>p.id==='三重');
  assert.ok(northRoundedPath(a.pathPoints).includes('L'+Number(station.x.toFixed(4))+','+Number(station.y.toFixed(4))),'route reaches the exact A02 station center before turning');
});


test('north full: latest compact heights and reunited Sanchong transfer',async()=>{
 const {compactReferenceLayout}=await import('../src/north-map-compact-reference.js');const old=compactReferenceLayout.positions,p=id=>full.byId.get(id),base=old['台北車站'].y;
 assert.equal(p('龍山寺').y-p('西門').y,70);assert.equal(p('西門').y-p('台北車站').y,70);
 assert.equal(p('小南門').y-base,250);
 assert.equal(p('台大醫院').y-p('台北車站').y,100);assert.equal(p('中正紀念堂').y-p('台大醫院').y,100);
 assert.ok(p('北門').y<p('台北車站〔A〕').y&&p('北門').y<p('西門').y);
 assert.ok(p('中正紀念堂').y-base<old['中正紀念堂'].y-base);
 for(const id of ['東門','大安森林公園','大安','信義安和','台北101/世貿','象山','廣慈/奉天宮'])assert.equal(p(id).y,p('中正紀念堂').y);
 assert.deepEqual(p('三重').codes.map(c=>c.code),['O15','A02']);assert.equal(p('三重').interchange,true);assert.equal(p('三重〔A〕'),undefined);
 assert.equal(p('新北產業園區〔A〕').x,p('新北產業園區').x);assert.equal(p('新北產業園區〔A〕').x,p('新埔民生').x);
 assert.equal(full.walks.length,7);assert.equal(p('中山').x-p('北門').x,225);
});

test('north full: A01 moves down exactly 125 while retaining its horizontal position',()=>{const old=JSON.parse(readFileSync(new URL('../docs/north-map-a01-before.json',import.meta.url),'utf8')),station=full.byId.get('台北車站〔A〕');assert.equal(station.x,old.x+350);assert.equal(station.y-old.y,125);});

test('north full: BL12–BL19 lower by 50 and BL15–BL19 gaps shrink 20 percent',async()=>{const {blueReferenceLayout}=await import('../src/north-map-blue-reference.js');const old=blueReferenceLayout.positions,p=id=>full.byId.get(id);for(const id of ['台北車站','善導寺','忠孝新生','忠孝復興','忠孝敦化','國父紀念館','市政府','永春'])assert.equal(p(id).y-old[id].y,50);for(const [a,b]of [['忠孝復興','忠孝敦化'],['忠孝敦化','國父紀念館'],['國父紀念館','市政府'],['市政府','永春']])assert.ok(Math.abs((p(b).x-p(a).x)/(old[b].x-old[a].x)-.8)<1e-7);});

test('north full: BL09–BL12 station contacts are horizontal and clear of bends',()=>{const route=full.routes.find(r=>r.system==='BL');for(const name of ['江子翠','龍山寺','西門','台北車站']){const i=route.pathPoints.findIndex(p=>p.id===name),a=route.pathPoints[i-1],b=route.pathPoints[i],c=route.pathPoints[i+1];assert.equal(a.y,b.y);assert.equal(b.y,c.y);assert.ok(a.x<b.x&&c.x>b.x);}});

test('north full: BL01–BL09 equal spacing and BL09–BL12 regular longer rising steps',()=>{const p=id=>full.byId.get(id),ids=['頂埔','永寧','土城','海山','亞東醫院','府中','板橋〔BL〕','新埔','江子翠'];for(let i=1;i<ids.length;i++)assert.ok(Math.abs(Math.hypot(p(ids[i]).x-p(ids[i-1]).x,p(ids[i]).y-p(ids[i-1]).y)-200)<1e-5);for(const [a,b]of [['江子翠','龍山寺'],['龍山寺','西門'],['西門','台北車站']]){assert.equal(p(b).x-p(a).x,225);assert.equal(p(a).y-p(b).y,a==='江子翠'?0:70);assert.ok(Math.hypot(p(b).x-p(a).x,p(b).y-p(a).y)>200);}});

test('north full: BL09–BL10 level, shorter eastern gaps and rounded BR14–BR15 elbow',()=>{const p=id=>full.byId.get(id);assert.equal(p('江子翠').y,p('龍山寺').y);for(const [a,b,target]of [['永春','後山埤',150]])assert.ok(Math.abs(Math.hypot(p(b).x-p(a).x,p(b).y-p(a).y)-target)<1e-5);const r=full.routes.find(r=>r.system==='BR'),i=r.points.findIndex(p=>p.id==='大直'),corner=r.points[i+1];assert.equal(corner.x,r.points[i].x);assert.equal(corner.y,r.points[i+2].y);assert.equal(corner.cornerRadius,70);assert.ok(northRoundedPath(r.pathPoints.slice(i,i+3)).includes(' Q'));});

test('north full: Wenhu upper and eastern stretches have larger uniform spacing',()=>{const p=id=>full.byId.get(id);for(const [ids,gap]of [[['南京復興','中山國中','松山機場','大直'],130],[['南港軟體園區','南港展覽館'],150],[['劍南路','西湖','港墘','文德','內湖'],210]])for(let i=1;i<ids.length;i++)assert.ok(Math.abs(Math.hypot(p(ids[i]).x-p(ids[i-1]).x,p(ids[i]).y-p(ids[i-1]).y)-gap)<1e-5);assert.ok(Math.abs(p('南港').x-p('昆陽').x-p('南港展覽館').x+p('南港').x)<1e-5);});

test('north full: BL21–BL23 shrink to equal 190 gaps with the BR24 junction retained',()=>{const p=id=>full.byId.get(id);assert.ok(Math.abs(p('南港').x-p('昆陽').x-190)<1e-6);assert.ok(Math.abs(p('南港展覽館').x-p('南港').x-190)<1e-6);assert.equal(p('昆陽').y,p('南港展覽館').y);const corner=full.routes.find(r=>r.system==='BL').points.find(p=>p.vertexId==='BL:@轉折:17.5,2');assert.ok(corner.x<p('昆陽').x);assert.equal(corner.y,p('昆陽').y);});

test('north full: BL20–BL21 shortens to 190 with aligned eastern Wenhu transfers',()=>{const p=id=>full.byId.get(id);assert.ok(Math.abs(Math.hypot(p('昆陽').x-p('後山埤').x,p('昆陽').y-p('後山埤').y)-190)<1e-5);assert.equal(p('東湖').x,p('南港展覽館').x);assert.equal(p('南港軟體園區').x,p('南港展覽館').x);assert.equal(p('昆陽').y,p('南港展覽館').y);});

test('north full: enlarged upper Wenhu spacing keeps eastern slope monotone and vertical junction aligned',()=>{const p=id=>full.byId.get(id);for(const [a,b]of [['劍南路','西湖'],['西湖','港墘'],['港墘','文德'],['文德','內湖']])assert.ok(Math.abs(p(b).x-p(a).x-210)<1e-5);for(const [a,b]of [['內湖','大湖公園'],['大湖公園','葫洲']]){assert.ok(p(b).x>p(a).x&&p(b).y>p(a).y);assert.ok(Math.abs((p(b).y-p(a).y)/(p(b).x-p(a).x)-.35)<1e-6);}assert.equal(p('東湖').x,p('南港展覽館').x);});

test('north full: A03–A23 station gaps are uniform with room for western labels',()=>{const r=full.routes.find(r=>r.system==='A'),start=r.points.findIndex(p=>p.id==='新北產業園區〔A〕'),ref=Math.hypot(r.points[start+1].x-r.points[start].x,r.points[start+1].y-r.points[start].y);for(let i=start+1;i<r.points.length;i++)assert.ok(Math.abs(Math.hypot(r.points[i].x-r.points[i-1].x,r.points[i].y-r.points[i-1].y)-ref)<1e-6);assert.ok(full.byId.get('大園').x>150);assert.equal(full.width,5550);});

test('north full: airport and hot spring amenities appear beside exact station labels',()=>{for(const name of ['機場第一航廈','機場第二航廈','機場第三航廈','松山機場'])assert.ok(fullDocument.querySelector('[data-label-group="'+name+'"] [data-amenity="airport"]'));assert.ok(fullDocument.querySelector('[data-label-group="新北投"] [data-amenity="hot-spring"]'));assert.equal(fullDocument.querySelectorAll('[data-label-group] [data-amenity]').length,5);});

test('north full: shorter BR22–BR24 and smooth monotone eastern curve',()=>{const p=id=>full.byId.get(id);assert.ok(p('南港軟體園區').y-p('東湖').y>150);assert.equal(p('南港展覽館').y-p('南港軟體園區').y,150);const r=full.routes.find(r=>r.system==='BR'),a=r.pathPoints.findIndex(p=>p.id==='內湖'),b=r.pathPoints.findIndex(p=>p.id==='東湖');for(let i=a+1;i<=b;i++)assert.ok(r.pathPoints[i].y>r.pathPoints[i-1].y);assert.ok(northRoundedPath(r.pathPoints.slice(a,b+1)).includes(' Q'));});

test('north full: south preview keeps exact names, ordered connections and active bank separate',()=>{
 const route=full.routes.find(r=>r.id==='Y-south');
 same(route.points.filter(p=>!p.control).map(p=>p.name),['大坪林','寶斗厝','溝子口','馬明潭','文山區公所','政大','動物園']);
 assert.equal(route.color,'#A8ADB5');
 for(const [i,name]of ['寶斗厝','溝子口','馬明潭','文山區公所','政大'].entries()){const station=full.byId.get(name);assert.equal(station.future,true);assert.equal(station.codes[0].code,'Y0'+(6-i));assert.ok(!north.lines.flatMap(l=>l.stops).includes(name));}
 same(full.byId.get('動物園〔BR〕').codes.map(c=>c.code),['BR01','Y01']);
 const p=id=>full.byId.get(id);assert.ok(p('中和').x<p('景安').x);
 const br=full.routes.find(r=>r.id==='BR-0');assert.ok(br.points.some(p=>p.control&&p.cornerRadius===65));
 assert.ok(p('大湖公園').x-p('內湖').x>140);assert.ok(p('葫洲').x-p('大湖公園').x>140);
});

test('north full: K sixty degrees, equal southern path spacing and gondola net right shift',()=>{
 const p=id=>full.byId.get(id),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5);
 for(const [a,b]of [['新和國小','陽光運動公園'],['陽光運動公園','安康']]){near((p(b).y-p(a).y)/(p(a).x-p(b).x),Math.sqrt(3));near(Math.hypot(p(b).y-p(a).y,p(b).x-p(a).x),175);}

 const south=full.routes.find(r=>r.id==='Y-south');assert.ok(northRoundedPath(south.pathPoints).includes('Q'));
 for(const q of full.routes.find(r=>r.system==='gondola').points){near(q.x-latestSpacingReference[q.vertexId].x,400);near(q.y,latestSpacingReference[q.vertexId].y);}
});


test('north full: Y05–Y02 rise 60 and Y06 stays centered on the 45 degree diagonal',()=>{const p=id=>full.byId.get(id),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5);for(const id of ['溝子口','馬明潭','文山區公所','政大']){near(p(id).y,southHeightReference.positions[id].y-60);near(p(id).x,southHeightReference.positions[id].x+350);}const start={x:3796.7525-60,y:p('大坪林').y},end={x:3884.3901,y:p('溝子口').y},y06=p('寶斗厝');near(y06.x,(start.x+end.x)/2);near(y06.y,(start.y+end.y)/2);assert.ok(Math.abs(end.x-start.x-start.y+end.y)<.001);assert.equal(fullDocument.querySelector('[data-route="Y-south"]').getAttribute('d'),southFixedTrack);for(const id of ['大坪林','動物園〔BR〕']){near(p(id).x,southHeightReference.positions[id].x+350);near(p(id).y,southHeightReference.positions[id].y);}});

test('north full: fixed BR01–BR08 curve keeps equal arc distances and every marker on the track',()=>{
 const tokens=wenhuSouthTrack.match(/[MLQ]|-?\d+(?:\.\d+)?/g);let at=0,current,poly=[];const read=()=>({x:+tokens[at++],y:+tokens[at++]});while(at<tokens.length){const op=tokens[at++];if(op==='M'){current=read();poly.push(current);}else{const a=current,b=read(),c=op==='Q'?read():b;for(let j=1;j<=3000;j++){const t=j/3000;poly.push(op==='Q'?{x:(1-t)**2*a.x+2*(1-t)*t*b.x+t*t*c.x,y:(1-t)**2*a.y+2*(1-t)*t*b.y+t*t*c.y}:{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}current=c;}}
 const lengths=[0];for(let i=1;i<poly.length;i++)lengths.push(lengths.at(-1)+Math.hypot(poly[i].x-poly[i-1].x,poly[i].y-poly[i-1].y));const gap=lengths.at(-1)/7;for(const [i,id]of ['動物園〔BR〕','木柵','萬芳社區','萬芳醫院','辛亥','麟光','六張犁','科技大樓'].entries()){const p=full.byId.get(id);let nearest=0,distance=Infinity;for(let j=0;j<poly.length;j++){const d=Math.hypot(poly[j].x-p.x,poly[j].y-p.y);if(d<distance){distance=d;nearest=j;}}assert.ok(distance<.1,id);assert.ok(Math.abs(lengths[nearest]-gap*i)<.1,id+' equal arc distance');}
 assert.ok(fullDocument.querySelector('[data-route="BR-0"]').getAttribute('d').startsWith(wenhuSouthTrack));
});

test('north full: five annotated map refinements keep anchors and avoid label overlap',()=>{const p=id=>full.byId.get(id),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-4);for(const [a,b]of [['大安','信義安和'],['信義安和','台北101/世貿'],['台北101/世貿','象山'],['象山','廣慈/奉天宮']]){near(p(b).x-p(a).x,(commentReference[b].x-commentReference[a].x)*1.05);near(p(b).y,p(a).y);}near(p('東湖').y-p('葫洲').y,(commentReference['東湖'].y-commentReference['葫洲'].y)*.8);const label=full.labels.find(l=>l.name==='大坪林');assert.ok(label.y>p('大坪林').y);assert.ok(fullDocument.querySelector('[data-label-group="松山機場"] [data-amenity="airport"]'));const names=['文山區公所','馬明潭','溝子口'],middle=(Math.min(...names.map(id=>p(id).x))+Math.max(...names.map(id=>p(id).x)))/2;near(+fullDocument.querySelector('[data-south-opening-notice] rect').getAttribute('x')+220,middle+100);});

test('legend uses real station examples and five main-route endpoint lines',()=>{const legend=fullDocument.querySelector('[data-map-legend]');for(const code of ['BL01','V01','R28','BL12','R10'])assert.ok(legend.querySelector('[data-legend-code="'+code+'"]'));assert.ok(legend.textContent.includes('灰色：尚未通車'));for(const id of ['R','G','O','BL','BR']){const row=legend.querySelector('[data-legend-system="'+id+'"]');assert.ok(row.querySelectorAll('text').length>=3);assert.ok(row.querySelector('line,path'));}assert.ok(legend.querySelector('[data-legend-system="A"]').textContent.includes('桃園機場捷運'));});

test('legend endpoints are readable and align with the shared color-line columns',()=>{for(const row of fullDocument.querySelectorAll('[data-map-legend] [data-legend-system]')){if(row.querySelector('[data-legend-fork]'))continue;const line=row.querySelector('line'),name=row.querySelector('[data-legend-name]');assert.equal(+line.getAttribute('x1')-+name.getAttribute('x'),row.getAttribute('data-legend-system')==='A'?220:180);const start=row.querySelector('[data-legend-start]'),end=row.querySelector('[data-legend-end]');if(start){assert.ok(+start.getAttribute('font-size')>=24);assert.equal(name.getAttribute('font-weight'),'700');assert.equal(start.getAttribute('x'),line.getAttribute('x1'));assert.equal(end.getAttribute('x'),line.getAttribute('x2'));assert.equal(start.getAttribute('text-anchor'),'start');assert.equal(end.getAttribute('text-anchor'),'end');}}});

test('legend groups six metro lines left, adds service spans and keeps gondola green distinct from branch',()=>{const legend=fullDocument.querySelector('[data-map-legend]');for(const id of ['R','G','O','BL','BR','Y'])assert.equal(legend.querySelector('[data-legend-system="'+id+'"]').getAttribute('data-legend-column'),'left');for(const id of ['A','LB','K','V','gondola'])assert.equal(legend.querySelector('[data-legend-system="'+id+'"]').getAttribute('data-legend-column'),'right');for(const [id,stop]of [['R','大安'],['G','台電大樓'],['BL','亞東醫院']])assert.ok(legend.querySelector('[data-legend-system="'+id+'"]').textContent.includes(stop));assert.ok(legend.querySelector('[data-legend-system="O"] path'));assert.ok(!legend.querySelector('[data-legend-system="Y"]').textContent.includes('西環'));assert.ok(legend.querySelector('[data-legend-system="Y"]').textContent.includes('新北產業園區'));assert.equal(full.systems.find(s=>s.id==='gondola').color,'#A8CF8A');});

test('legend service lines have breathing room, symmetric Xinlu fork and complete right-column endpoints',()=>{const legend=fullDocument.querySelector('[data-map-legend]');for(const id of ['R','G','BL','V']){const row=legend.querySelector('[data-legend-system="'+id+'"]'),labels=[...row.querySelectorAll('[data-legend-start]')];assert.equal(+labels[1].getAttribute('y')-+labels[0].getAttribute('y'),64);}for(const id of ['A','LB','K','V','gondola'])assert.ok(legend.querySelector('[data-legend-system="'+id+'"] [data-legend-start]'));const left=legend.querySelector('[data-legend-system="R"] line'),right=legend.querySelector('[data-legend-system="A"] [data-legend-name]');assert.equal(+right.getAttribute('x')-+left.getAttribute('x2'),75);});

test('service variants have explicit labels and route names have stronger hierarchy',()=>{const legend=fullDocument.querySelector('[data-map-legend]');for(const id of ['R','G','BL']){const row=legend.querySelector('[data-legend-system="'+id+'"]');assert.equal(row.querySelector('[data-service-label="short"]').textContent,'區間車');const starts=row.querySelectorAll('[data-legend-start]'),line=row.querySelector('line');assert.ok(+starts[1].getAttribute('y')-24-(+line.getAttribute('y1'))>=25);}const row=legend.querySelector('[data-legend-system="O"]'),d=row.querySelector('path').getAttribute('d');assert.ok(d.includes('L2338 820'));});
