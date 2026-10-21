import { northRoutes } from './north-map-data.js';
import { expandNorthRoutes, northStationDetails } from './north-map-stations.js';
import { northMarker } from './north-map-markers.js';
import { northLayout } from './north-map-layout.js';
import { northLabelLane, northLabelSize, northLabelBox } from './north-map-label-policy.js';
import { externalTransfers } from './data.js';
import {currentNorthSourceRoutes,northTransferOrder,northSplitNames} from './north-map-service-plan.js';

export const northBranchColors={'R-1':'#EF91A2','G-1':'#B4CA45','O-1':'#F9C966','O-2':'#F9C966','V-1':'#E45B83','V-2':'#E45B83'};
export const northCurrentColors={Y:'#FFDC00',gondola:'#A8CF8A'};
export const northRailTransfers={...externalTransfers.north};

export const northSystems = [
  ['R', '淡水信義線', '#E3002C'], ['G', '松山新店線', '#008659'],
  ['O', '中和新蘆線', '#F8B61C'], ['BL', '板南線', '#0070BD'],
  ['BR', '文湖線', '#9E652E'], ['Y', '環狀線', '#E1C400'],
  ['A', '桃園機場捷運', '#8246AF'], ['LB', '三鶯線', '#6CB5E5'],
  ['K', '安坑輕軌', '#B0B33B'], ['V', '淡海輕軌', '#E45B83'],
  ['gondola', '貓空纜車', '#62686D'],
].map(([id, name, color]) => ({ id, name, color }));

export const northWalkPairs = [
  ['台北車站', '台北車站〔A〕'], ['板橋〔BL〕', '板橋〔Y〕'],
  ['新埔', '新埔民生'], ['動物園〔BR〕', '動物園〔纜車〕'],
];
export const northCurrentWalkPairs=[...northWalkPairs.filter(pair=>!pair.some(id=>id==='動物園〔纜車〕')),['北門','台北車站〔A〕'],['紅樹林','紅樹林〔V〕'],['新北產業園區','新北產業園區〔A〕'],['十四張','十四張〔K〕']];
export const northPoster = {
  width: 3200, height: 3200, scale: 54, originX: 1770, originY: 1700,
  title: '雙北・桃園軌道路網', subtitle: '相對方位配置樣圖',
  source: '參考自臺北捷運官方路網圖（臺北大眾捷運股份有限公司）',
  notice: '非官方版本',
};
export const toNorthScreen = ({ x, y }) => ({
  x: northPoster.originX + northPoster.scale * x,
  y: northPoster.originY - northPoster.scale * y,
});
const key = p => `${p.x},${p.y}`;
const near = (a, b) => Math.abs(a - b) < 1e-8;
const samePoint = (a, b) => near(a.x, b.x) && near(a.y, b.y);
const cross = (a, b) => a.x * b.y - a.y * b.x;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const overlaps = (a, b, margin = 0) => a.x < b.x + b.w + margin && a.x + a.w + margin > b.x && a.y < b.y + b.h + margin && a.y + a.h + margin > b.y;

export function segmentCrossing(a, b, c, d) {
  const r = sub(b, a), s = sub(d, c), den = cross(r, s);
  if (Math.abs(den) < 1e-9) return null;
  const t = cross(sub(c, a), s) / den, u = cross(sub(c, a), r) / den;
  if (t < -1e-8 || t > 1 + 1e-8 || u < -1e-8 || u > 1 + 1e-8) return null;
  return { x: a.x + t * r.x, y: a.y + t * r.y, t, u };
}

function collinearOverlap(a, b, c, d) {
  const r = sub(b, a), s = sub(c, a), length = r.x ** 2 + r.y ** 2;
  if (!length || Math.abs(cross(r, sub(d, c))) > 1e-8 || Math.abs(cross(r, s)) > 1e-8) return null;
  const t0 = (s.x * r.x + s.y * r.y) / length, v = sub(d, a), t1 = (v.x * r.x + v.y * r.y) / length;
  const from = Math.max(0, Math.min(t0, t1)), to = Math.min(1, Math.max(t0, t1));
  return to - from > 1e-8 ? { from, to } : null;
}

export function createNorthGeometry({full=false,layout=full}={}) {
  const byId = new Map(), byCoordinate = new Map();
  const sourceRoutes=full?currentNorthSourceRoutes():northRoutes;
  const systems=northSystems.map(system=>({...system,color:full?northCurrentColors[system.id]||system.color:system.color}));
  const routes = sourceRoutes.map(route => ({ ...route, color: (route.future?'#A8ADB5':null)||(full&&northBranchColors[route.id])||systems.find(s => s.id === route.system).color,
    points: route.points.map((p, i) => {
      const vertexId=p.control?`${route.system}:${p.raw}:${p.x},${p.y}`:p.raw;
      const rawScreen = layout&&northLayout.positions[vertexId]?northLayout.positions[vertexId]:toNorthScreen(p);
      const screen=full&&layout?{x:rawScreen.x+350,y:rawScreen.y}:rawScreen;
      if (p.control) return { ...p, ...screen, vertexId, coordinate: { x: p.x, y: p.y }, id: `${route.id}:control:${i}` };
      if (!byId.has(p.raw)) {
        const detail=northStationDetails.get(p.sourceId||p.raw);
        const sourceId=p.sourceId||p.raw;
        const codes=(p.codes||detail?.codes||[]).filter(code=>!full||code.system!=='gondola').filter(code=>!full||!northSplitNames.has(sourceId)||code.system===route.system);
        const name=p.raw.replace(/〔(?:BL|Y|A|BR|V|K|纜車)〕/g, '');
        const order=full?northTransferOrder[name]:null;
        if(order)codes.sort((a,b)=>order.indexOf(a.code)-order.indexOf(b.code));
        const station = { id:p.raw,name,sourceId, subtitle:full&&p.raw!=='十四張〔K〕'?detail?.subtitle||'':'', added:!!p.added,future:!!p.future,extension:!!p.extension, coordinate: { x: p.x, y: p.y }, ...screen,
          codes,amenity:full?(['A12','A13','A14','BR13'].some(code=>codes.some(c=>c.code===code))?'airport':codes.some(c=>c.code==='R22A')?'hot-spring':null):null,railTransfers:full&&p.raw!=='台北車站〔A〕'?(northRailTransfers[name]||[]).filter(t=>['高鐵','台鐵'].includes(t)):[],metroTransfers:full&&['北門','台北車站'].includes(p.raw)?['機場捷運']:[],railDestinations:{},vertexId,systems: new Set(), routes: new Set(), terminal: false };
        byId.set(p.raw, station);
        if (byCoordinate.has(key(p)) && byCoordinate.get(key(p)).id !== p.raw&&!(full&&northSplitNames.has(sourceId))) throw new Error(`Distinct stations share coordinates: ${p.raw}`);
        byCoordinate.set(key(p), station);
      }
      const station = byId.get(p.raw);
      if (!samePoint(station.coordinate, p)) throw new Error(`Station coordinates disagree: ${p.raw}`);
      station.systems.add(route.system); station.routes.add(route.id);
      return station;
    }),
  }));
  const stations = [...byId.values()];
  const branches = new Set(['北投', '七張', '濱海沙崙']);
  const neighbors=new Map();
  for(const route of routes){
    if(!neighbors.has(route.system))neighbors.set(route.system,new Map());
    const graph=neighbors.get(route.system);
    for(let i=1;i<route.points.length;i++){
      const a=route.points[i-1].vertexId,b=route.points[i].vertexId;
      if(!graph.has(a))graph.set(a,new Set());if(!graph.has(b))graph.set(b,new Set());
      graph.get(a).add(b);graph.get(b).add(a);
    }
  }
  stations.forEach(station => {
    station.systems = [...station.systems]; station.routes = [...station.routes];
    station.interchange = station.systems.length > 1 || (!full&&branches.has(station.id));
    station.branch = branches.has(station.id);
    station.terminalSystems=station.systems.filter(system=>neighbors.get(system).get(station.vertexId)?.size===1);
    if(full&&station.id==='大坪林'&&!station.terminalSystems.includes('Y'))station.terminalSystems.push('Y');
    station.terminal=station.terminalSystems.length>0;
  });
  const walks = (full?northCurrentWalkPairs:northWalkPairs).map(([from, to]) => ({ from: byId.get(from), to: byId.get(to) }));
  walks.forEach(walk=>{walk.from.walkTransfer=true;walk.to.walkTransfer=true;});
  stations.forEach(station=>{station.marker=northMarker(station);});
  routes.forEach((route,i)=>{route.pathPoints=full?route.points.map(p=>{const port=p.marker?.ports[route.system]||{x:0,y:0};return {...p,x:p.x+port.x,y:p.y+port.y};}):northRoutes[i].points.map(p=>toNorthScreen(p));});
  const segments = routes.flatMap((route, order) => (full?route.pathPoints:route.points).slice(1).map((b, i) => ({
    id: `${route.id}:${i}`, system: route.system, route: route.id, order, a:(full?route.pathPoints:route.points)[i], b, color: route.color,
  })));
  const crossings = [], coincident = [];
  for (let i = 0; i < segments.length; i++) for (let j = i + 1; j < segments.length; j++) {
    const a = segments[i], b = segments[j];
    if (a.system === b.system) continue;
    const overlap = collinearOverlap(a.a, a.b, b.a, b.b);
    if (overlap) { coincident.push({ a: a.id, b: b.id, ...overlap }); continue; }
    const point = segmentCrossing(a.a, a.b, b.a, b.b);
    if (!point) continue;
    const station = stations.find(s => (samePoint(s, point)||(full&&Math.abs(s.x+(s.marker.dx||0)-point.x)<s.marker.w/2&&Math.abs(s.y-point.y)<s.marker.h/2)) && s.systems.includes(a.system) && s.systems.includes(b.system));
    if (station) continue;
    if (crossings.some(c => samePoint(c, point) && [c.under.system,c.over.system].includes(a.system) && [c.under.system,c.over.system].includes(b.system))) continue;
    const owner=stations.find(s=>samePoint(s,point));
    const under=owner?.systems.includes(a.system)?b:a;
    const over=under===a?b:a;
    crossings.push({ ...point, under, over, station:owner?.id, gap:owner?19:12 });
  }
  return { ...northPoster, width:full?5550:northPoster.width,height:full?4950:northPoster.height,full, layout, spacingRounds:layout?northLayout.rounds.length:0,routes, stations, byId, walks, segments, crossings, coincident, systems };
}

function segmentHitsBox(a, b, box) {
  let low = 0, high = 1;
  for (const [origin, delta, min, max] of [[a.x, b.x-a.x, box.x, box.x+box.w], [a.y,b.y-a.y,box.y,box.y+box.h]]) {
    if (!delta) { if (origin < min || origin > max) return false; continue; }
    const t0 = (min-origin)/delta, t1=(max-origin)/delta;
    low=Math.max(low,Math.min(t0,t1));high=Math.min(high,Math.max(t0,t1));
    if(low>high)return false;
  }
  return true;
}

function preferredSides(station) {
  const id=station.id;
  if(['台北車站','板橋〔BL〕','動物園〔BR〕'].includes(id))return ['right','below','left','above'];
  if(['新埔','新埔民生'].includes(id))return id==='新埔'?['right','below']:['left','above'];
  if(['新北投','淡水漁人碼頭'].includes(id))return ['right','above','left','below'];
  if(station.systems.includes('R'))return station.coordinate.x===0?['right','left','below','above']:['above','below','right','left'];
  if(station.systems.includes('BR'))return station.coordinate.x===9?['right','left','above','below']:['above','below','right','left'];
  if(station.systems.includes('A'))return station.coordinate.x===-26?['left','right','below','above']:['above','below','left','right'];
  if(station.systems.includes('LB'))return ['left','below','right','above'];
  if(station.systems.includes('Y'))return station.coordinate.x===-13?['left','right','below','above']:['below','above','left','right'];
  if(station.systems.includes('BL'))return ['below','above','right','left'];
  if(station.systems.includes('V'))return ['right','left','above','below'];
  return ['right','below','left','above'];
}

export function placeNorthLabels(model) {
  if(model.full)return placeFullNorthLabels(model);
  const groups = new Map();
  model.stations.forEach(station => {
    if(!groups.has(station.name))groups.set(station.name,[]);
    groups.get(station.name).push(station);
  });
  const reserved = [{ x: 1890, y: 230, w: 1150, h: 785 }, { x: 180, y: model.height-150, w: 2840, h: 130 }];
  const labels = [], stationBoxes=model.stations.map(s=>{
    if(model.full)return {x:s.x-s.marker.w/2-3,y:s.y-s.marker.h/2-3,w:s.marker.w+6,h:s.marker.h+6};
    return {x:s.x-19,y:s.y-19,w:38,h:38};
  });
  const verticalLanes={明德:'right',芝山:'left',士林:'right',劍潭:'left',圓山:'right',民權西路:'right-below',雙連:'left'};
  const coreNames=['善導寺','台大醫院','大橋頭','北門','台北橋','崁頂'];
  const pending=[...groups].map(([name,stations])=>{
    const subtitle=stations.find(s=>s.subtitle)?.subtitle||'';
    return {name,stations,anchor:stations[0],lane:model.full?verticalLanes[name]:null,corePriority:model.full&&coreNames.includes(name)?coreNames.length-coreNames.indexOf(name):0,priority:Math.max(name.length,subtitle.length*.75)+(subtitle ? 0.8 : 0)};
  }).sort((a,b)=>(b.stations.length-a.stations.length)||b.corePriority-a.corePriority||Number(!!b.lane)-Number(!!a.lane)||Number(b.anchor.interchange)-Number(a.anchor.interchange)||b.priority-a.priority||a.name.localeCompare(b.name,'zh-Hant'));
  for(const item of pending){
    const subtitle=item.stations.find(s=>s.subtitle)?.subtitle||'';
    const fontSize=model.full?24:27,subtitleSize=17;
    const textWidth=(text,size)=>[...text].reduce((n,c)=>n+(/[/・|\s]/.test(c)?size*.5:/[\x00-\x7f]/.test(c)?size*.6:size),0);
    const w=Math.max(textWidth(item.name,fontSize),subtitle?textWidth(`| ${subtitle}`,subtitleSize):0)+8,h=subtitle?59:38;
    const anchor={x:item.stations.reduce((sum,s)=>sum+s.x,0)/item.stations.length,y:item.stations.reduce((sum,s)=>sum+s.y,0)/item.stations.length};
    const sides=preferredSides(item.anchor),candidates=[];
    // Keep these central interchange labels on the east side of the O corridor.
    // Only label boxes change; source station and route coordinates stay fixed.
    const fixedLabelOffsets={'忠孝新生':[36,36],'東門':[36,-74],...(model.full?{'台北車站':[53,-74],'善導寺':[-w/2,36],'台大醫院':[24,25]}:{})};
    for(const gap of [24,36,52,76,108,150,205,270])for(const shift of [0,-22,22,-32,32,-44,44,-70,70,-105,105,-150,150,-205,205])for(const [rank,side]of sides.entries()){
      const box=side==='right'?{x:anchor.x+gap,y:anchor.y-h/2+shift,w,h}:side==='left'?{x:anchor.x-gap-w,y:anchor.y-h/2+shift,w,h}:side==='above'?{x:anchor.x-w/2+shift,y:anchor.y-gap-h,w,h}:{x:anchor.x-w/2+shift,y:anchor.y+gap,w,h};
      if(box.x<130||box.y<(model.full?42:130)||box.x+w>3070||box.y+h>model.height-190||reserved.some(b=>overlaps(b,box,12))||labels.some(b=>overlaps(b,box,model.full?10:12))||stationBoxes.some(b=>overlaps(b,box,model.full?4:7)))continue;
      const target={x:Math.max(box.x,Math.min(anchor.x,box.x+w)),y:Math.max(box.y,Math.min(anchor.y,box.y+h))};
      const distance=Math.hypot(target.x-anchor.x,target.y-anchor.y),hits=model.segments.filter(s=>segmentHitsBox(s.a,s.b,box)).length;
      const leaderHits=model.segments.filter(s=>segmentCrossing(anchor,target,s.a,s.b)).length;
      const fixed=item.lane?[item.lane==='left'?-36-w:36,item.lane==='right-below'?25:-h/2]:fixedLabelOffsets[item.name];
      const placementPenalty=fixed?Math.hypot(box.x-anchor.x-fixed[0],box.y-anchor.y-fixed[1])*100:0;
      candidates.push({...box,side,score:hits*18000+distance*12+rank*80+Math.abs(shift)*1.2+leaderHits*28+placementPenalty,distance});
    }
    const best=candidates.sort((a,b)=>a.score-b.score)[0];
    if(!best)throw new Error(`Cannot place label: ${item.name}`);
    labels.push({...best,name:item.name,subtitle,subtitleSize,stationIds:item.stations.map(s=>s.id),fontSize,anchor});
  }
  return labels;
}

function placeFullNorthLabels(model){
  const boxes=model.stations.map(s=>({x:s.x+(s.marker.dx||0)-s.marker.w/2-3,y:s.y-s.marker.h/2-3,w:s.marker.w+6,h:s.marker.h+6}));
  const reserved=model.compactLayout?[]:[{x:3500,y:230,w:1150,h:960},{x:130,y:model.height-155,w:model.width-260,h:155}];
  const pending=model.stations.filter(s=>!['十四張〔K〕','新北產業園區','紅樹林〔V〕','三重〔A〕'].includes(s.id)).map(station=>({...station,stationIds:station.id==='紅樹林'?['紅樹林','紅樹林〔V〕']:station.id==='新北產業園區〔A〕'?['新北產業園區〔A〕','新北產業園區']:[station.id],...northLabelLane(station)}))
    .sort((a,b)=>Number(b.interchange)-Number(a.interchange)||northLabelSize(b).w-northLabelSize(a).w);
  const labels=[];
  for(const station of pending){
    const candidates=[];
    for(const extra of (model.compactLayout?[0,4,8,14,22,32,44,60]:[0,4,8,14,22,32]))for(const shift of (model.compactLayout?[0,-10,10,-20,20,-30,30,-40,40,-60,60,-80,80,-100,100,-120,120]:[0,-10,10,-20,20,-30,30,-40,40,-60,60,-80,80])){
      const horizontal=station.side==='left'||station.side==='right';
      const gap=(horizontal?station.marker.w/2+8:station.marker.h/2+8)+extra;
      const box=northLabelBox(station,station.side,gap,shift);
      if(box.x<75||box.y<45||box.x+box.w>model.width-75||box.y+box.h>model.height-190||reserved.some(b=>overlaps(b,box,10))||labels.some(b=>overlaps(b,box,8))||boxes.some(b=>overlaps(b,box,3)))continue;
      const target={x:Math.max(box.x,Math.min(station.x,box.x+box.w)),y:Math.max(box.y,Math.min(station.y,box.y+box.h))};
      const hits=model.segments.filter(s=>segmentHitsBox(s.a,s.b,box)).length;
      const distance=Math.hypot(target.x-station.x,target.y-station.y);
      const eastInterchange=station.systems.includes('BR')&&['R:east','BL:east'].includes(station.lane);
      candidates.push({...box,side:station.side,lane:station.lane,distance,shift,score:hits*20000+extra*20+Math.abs(shift)*6+distance+(eastInterchange&&shift<0?40:0)});
    }
    const best=candidates.sort((a,b)=>a.score-b.score)[0];
    if(!best)throw new Error(`Cannot place same-side label: ${station.name}`);
    labels.push({...best,name:station.name,subtitle:station.subtitle,future:station.future,amenity:station.amenity,railTransfers:station.railTransfers,metroTransfers:station.metroTransfers,railDestinations:station.railDestinations,subtitleSize:17,stationIds:station.stationIds,fontSize:24,anchor:{x:station.x,y:station.y}});
  }
  return labels;
}

const cachedMaps=new Map();
export function buildNorthMap({full=true}={}) {
  if(cachedMaps.has(full))return cachedMaps.get(full);
  const model=createNorthGeometry({full});
  const result={...model,labels:placeNorthLabels(model)};
  cachedMaps.set(full,result);
  return result;
}
