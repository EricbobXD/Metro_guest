import {southFixedTrack} from './north-map-south-fixed-track.js';
import {wenhuSouthTrack} from './north-map-wenhu-south-track.js';
import { buildNorthMap } from './north-map-model.js';
import { northInk } from './north-map-markers.js';
import { northRoundedPath } from './north-map-path.js';

const xml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const num=value=>Number(value.toFixed(4));
const linePath=points=>points.map((p,i)=>`${i?'L':'M'}${num(p.x)},${num(p.y)}`).join(' ');
const attrsStation=station=>`data-station="${xml(station.id)}" data-upcoming="${!!station.future}" data-x="${station.coordinate.x}" data-y="${station.coordinate.y}" data-layout-x="${num(station.x)}" data-layout-y="${num(station.y)}" data-codes="${station.codes.map(c=>c.code).join(' ')}" data-systems="${station.systems.join(' ')}"`;

function stationSymbol(station,model){
  const {marker}=station;
  if(marker.gondola)return `<g data-code-marker="true" data-gondola-symbol="true" transform="translate(${num(station.x-18)},${num(station.y-18)})"><rect width="36" height="36" rx="9" fill="${station.terminal?model.systems.find(s=>s.id==='gondola').color:'white'}" stroke="${model.systems.find(s=>s.id==='gondola').color}" stroke-width="3"/><path d="M18 5v6m-8 3h16v13H10z M18 14v13" fill="none" stroke="#325660" stroke-width="2.5" stroke-linejoin="round"/></g>`;
  const frame=marker.framed?`<rect data-transfer-frame="true" x="0" y="0" width="${marker.w}" height="${marker.h}" rx="8" fill="white" stroke="#111111" stroke-width="3.5"/>`:'';
  const codes=marker.items.map(item=>{
    const color=station.future||item.future?'#A8ADB5':model.routes.find(r=>r.system===item.system&&r.points.some(p=>p.id===station.id))?.color||model.systems.find(s=>s.id===item.system).color;
    const match=item.code.match(/^([A-Za-z]+)(\d.*)$/),prefix=match?.[1]||'',value=match?.[2]||item.code;
    const y=marker.framed?5:0,ink=['O','Y'].includes(item.system)?'#111111':item.filled?northInk(color):color;
    const shape=item.shape==='circle'?'<circle cx="21" cy="21" r="21"':'<rect width="'+item.w+'" height="42" rx="5"';
    return `<g data-station-code="${item.code}" data-filled="${item.filled}" transform="translate(${item.x},${y})">${shape} data-symbol-shape="${item.shape}" fill="${item.filled?color:'white'}" stroke="${color}" stroke-width="2.5"/><text fill="${ink}" text-anchor="middle" font-family="Arial,'Microsoft JhengHei',sans-serif" font-weight="700">${prefix?`<tspan x="${item.w/2}" y="14" font-size="11">${prefix}</tspan>`:''}<tspan x="${item.w/2}" y="${prefix?33:28}" font-size="${value.length>2?15:18}">${value}</tspan></text></g>`;
  }).join('');
  return `<g data-code-marker="true" transform="translate(${num(station.x+(marker.dx||0)-marker.w/2)},${num(station.y-marker.h/2)})">${frame}${codes}</g>`;
}

function railBadges(rails,x,y,destinations={},stacked=false){
  let cursor=x;
  return (rails||[]).map(rail=>{const w=rail==='機場捷運'?88:56,start=stacked&&rail==='機場捷運'?x:cursor;cursor+=w+6;const badgeY=y+(stacked&&rail==='機場捷運'?30:0);return `<g ${rail==='機場捷運'?'data-metro-transfer="A"':`data-rail-transfer="${rail}"`}${destinations[rail]?` data-rail-destination="${xml(destinations[rail])}"`:''} transform="translate(${num(start)},${num(badgeY)})">${destinations[rail]?`<title>步行轉乘${rail}${xml(destinations[rail])}站</title>`:''}<rect width="${w}" height="23" rx="4" fill="${rail==='機場捷運'?'#8246AF':rail==='高鐵'?'#C7662D':'#596A7B'}"/><text x="${w/2}" y="17" text-anchor="middle" font-size="16" font-weight="700" fill="white">${rail}</text></g>`;}).join('');
}

function amenitySymbol(kind,x,y,future=false){
 const title=kind==='airport'?'機場':'溫泉';
 const shape=kind==='airport'?'<path d="M14 3l3 10 9 5v3l-9-3v6l3 2v2l-6-2-6 2v-2l3-2v-6l-9 3v-3l9-5z" fill="white"/>':'<path d="M5 21q9 9 18 0M8 17c-5-5 5-5 0-10m6 10c-5-5 5-5 0-10m6 10c-5-5 5-5 0-10" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>';
 return `<g data-amenity="${kind}" aria-label="${title}" transform="translate(${num(x)},${num(y)})"><title>${title}</title><rect width="28" height="28" rx="5" fill="${future?'#A8ADB5':'#596A7B'}"/>${shape}</g>`;
}

function header(model){
  const sample=(id,cx,cy,code,filled)=>{const source=code?[...model.byId.values()].find(s=>s.marker.items.some(item=>item.code===code)):model.byId.get(id);if(!source)return '';let marker=source.marker;if(code){const item={...marker.items.find(item=>item.code===code),x:0,filled};marker={...marker,framed:false,w:item.w,h:42,items:[item]};}return stationSymbol({...source,x:cx,y:cy,marker},model).replaceAll('data-station-code=','data-legend-code=').replaceAll('data-code-marker=','data-legend-marker=').replaceAll('data-transfer-frame=','data-legend-transfer-frame=');};
  const left=['R','G','O','BL','BR','Y'],right=['A','LB','K','V','gondola'];
  const services={R:[['淡水','廣慈/奉天宮'],['北投','大安']],G:[['松山','新店'],['松山','台電大樓']],BL:[['頂埔','南港展覽館'],['亞東醫院','南港展覽館']],BR:[['動物園','南港展覽館']],Y:[['大坪林','新北產業園區']],A:[['台北車站','老街溪']],LB:[['頂埔','鶯桃福德']],K:[['雙城','十四張']],V:[['紅樹林','崁頂'],['紅樹林','淡水漁人碼頭']],gondola:[['動物園','貓空']]};
  const rows=[...left,...right].map(id=>{const system=model.systems.find(s=>s.id===id);if(!system)return '';const x=1985+(left.includes(id)?0:550),y=({R:560,G:690,O:820,BL:950,BR:1080,Y:1150,A:560,LB:690,K:820,V:950,gondola:1080})[id];
    const detailOffset=id==='A'?220:180;
    const label=id==='gondola'?system.name:`${id} ${id==='Y'?'環狀線':system.name}`;
    const detail=id==='O'?`<text data-legend-start="true" text-anchor="start" x="${x+detailOffset}" y="${y+24}" font-size="24">南勢角</text><text data-legend-end="true" x="${x+475}" y="${y-14}" text-anchor="end" font-size="24">蘆洲</text><text x="${x+475}" y="${y+62}" text-anchor="end" font-size="24">迴龍</text><path data-legend-fork="true" d="M${x+detailOffset} ${y+38} H${x+315} L${x+353} ${y} H${x+475} M${x+315} ${y+38} L${x+353} ${y+76} H${x+475}" fill="none" stroke="${system.color}" stroke-width="7"/>`:(services[id]||[null]).map((stops,j)=>{const rowY=y+j*64;return `${stops?`<text data-legend-start="true" text-anchor="start" x="${x+detailOffset}" y="${rowY}" font-size="24">${xml(stops[0])}</text><text data-legend-end="true" x="${x+475}" y="${rowY}" text-anchor="end" font-size="24">${xml(stops[1])}</text>`:''}<line x1="${x+detailOffset}" x2="${x+475}" y1="${rowY+14}" y2="${rowY+14}" stroke="${system.color}" stroke-width="7"/>`;}).join('');
    return `<g data-legend-system="${id}" data-legend-column="${left.includes(id)?'left':'right'}"><text data-legend-name="true" x="${x}" y="${y}" font-size="26" font-weight="700">${xml(label)}</text>${['R','G','BL'].includes(id)?`<text data-service-label="full" x="${x}" y="${y+33}" font-size="18" fill="#526171">全程</text><text data-service-label="short" x="${x}" y="${y+64}" font-size="18" fill="#526171">區間車</text>`:id==='V'?`<text data-service-label="green" x="${x}" y="${y+33}" font-size="18" fill="#526171">綠山線</text><text data-service-label="blue" x="${x}" y="${y+64}" font-size="18" fill="#526171">藍海線</text>`:''}${detail}</g>`;
  }).join('');
  const offset=model.full?1610:0;
  return `<g data-map-heading="true" transform="translate(${offset},0)"><text x="1940" y="323" font-size="60" font-weight="750">${xml(model.title)}</text><text x="1944" y="383" font-size="29" fill="#526171">${xml(model.subtitle)}</text></g>
  <g data-map-legend="true" transform="translate(${offset},0)"><rect x="1940" y="442" width="1140" height="1040" rx="10" fill="white" stroke="#D3DCE4" stroke-width="2"/>
  <text x="1985" y="505" font-size="32" font-weight="700">圖例</text>${rows}
  <line x1="1985" x2="3035" y1="1210" y2="1210" stroke="#D3DCE4" stroke-width="2"/>
  ${sample('頂埔',2002,1248,'BL01',false)}<text x="2028" y="1256" font-size="23">捷運</text>
  ${sample('紅樹林',2164,1248,'V01',false)}<text x="2198" y="1256" font-size="23">輕軌</text>
  ${sample('淡水',2327,1248,'R28',true)}<text x="2351" y="1256" font-size="23">端點</text>
  ${sample('台北車站',2507,1248)}<text x="2565" y="1256" font-size="23">轉乘</text>
  <line x1="2700" y1="1247" x2="2760" y2="1247" stroke="#7C8790" stroke-width="3.5" stroke-dasharray="6 5"/><text x="2780" y="1256" font-size="23">站外轉乘</text>${model.full?`${railBadges(['高鐵','台鐵'],1985,1308)}<text x="2124" y="1326" font-size="23">鐵路轉乘</text><rect x="1985" y="1379" width="29" height="42" rx="5" fill="#A8ADB5"/><text x="2030" y="1408" font-size="23">灰色：尚未通車</text>${amenitySymbol('airport',2370,1379)}<text x="2410" y="1403" font-size="23">機場</text>${amenitySymbol('hot-spring',2600,1379)}<text x="2640" y="1403" font-size="23">溫泉</text>`:''}</g>`;
}

export function northRouteTrackPath(route,points=route.pathPoints){if(route.id==='Y-south')return southFixedTrack;if(route.id==='BR-0'){const i=points.findIndex(p=>p.id==='科技大樓');return wenhuSouthTrack+' '+northRoundedPath(points.slice(i)).replace(/^M[-\d.,]+/, '');}return northRoundedPath(points);}

export function northLegendContents(model=buildNorthMap()){const markup=header(model);return markup.slice(markup.indexOf('<g data-map-legend'));}

export function northMapContents(model=buildNorthMap(),{includeHeader=true,includeSource=true}={}){
  const masks=model.full?'':model.routes.map(route=>{
    const crossings=model.crossings.filter(c=>c.under.route===route.id);
    return crossings.length?`<mask id="crossing-${route.id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${model.width}" height="${model.height}"><rect width="${model.width}" height="${model.height}" fill="white"/>${crossings.map(c=>`<circle cx="${num(c.x)}" cy="${num(c.y)}" r="${c.gap}" fill="black"/>`).join('')}</mask>`:'';
  }).join('');
  const orderedRoutes=model.full?[...model.routes].sort((a,b)=>({A:-20,Y:-10,G:20}[a.system]||0)-({A:-20,Y:-10,G:20}[b.system]||0)):model.routes;
  const tracks=orderedRoutes.map(route=>{
    const points=route.pathPoints,extension=model.full&&points.at(-1).extension;
    const active=extension?points.slice(0,-1):points;
    return `<path data-route="${route.id}" data-system="${route.system}" data-planned-route="${!!route.future}" d="${model.full?northRouteTrackPath(route,active):linePath(active)}" fill="none" stroke="${route.color}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"${!model.full&&model.crossings.some(c=>c.under.route===route.id)?` mask="url(#crossing-${route.id})"`:''}/>${extension?`<path data-upcoming-track="true" d="${linePath(points.slice(-2))}" fill="none" stroke="#A8ADB5" stroke-width="10" stroke-linecap="round"/>`:''}`;
  }).join('');
  const walks=model.walks.map(({from,to})=>{
    const ends=model.full?[from,to].map((station,i)=>{const other=i?from:to,dx=other.x-station.x,dy=other.y-station.y;const t=Math.min((station.marker.w/2+4)/Math.abs(dx||1e-10),(station.marker.h/2+4)/Math.abs(dy||1e-10));return {x:station.x+dx*t,y:station.y+dy*t};}):[from,to];
    return `<line data-walk-from="${xml(from.id)}" data-walk-to="${xml(to.id)}" x1="${num(ends[0].x)}" y1="${num(ends[0].y)}" x2="${num(ends[1].x)}" y2="${num(ends[1].y)}" stroke="#7C8790" stroke-width="3.5" stroke-dasharray="6 5"/>`;
  }).join('');
  const leaders=model.full?'':model.labels.flatMap(label=>{
    const shifted=label.side==='right'||label.side==='left'?Math.abs(label.y+label.h/2-label.anchor.y)>1:Math.abs(label.x+label.w/2-label.anchor.x)>1;
    if(label.distance<=40&&!shifted&&label.stationIds.length===1)return [];
    const target={x:Math.max(label.x,Math.min(label.anchor.x,label.x+label.w)),y:Math.max(label.y,Math.min(label.anchor.y,label.y+label.h))};
    return label.stationIds.map(id=>{
      const station=model.byId.get(id),dx=target.x-station.x,dy=target.y-station.y,distance=Math.hypot(dx,dy),radius=station.interchange?15:11;
      const t=model.full?Math.min((station.marker.w/2+4)/Math.abs(dx||1e-10),(station.marker.h/2+4)/Math.abs(dy||1e-10)):radius/distance;
      const start={x:station.x+dx*t,y:station.y+dy*t};
      return `<line data-leader-for="${xml(id)}" x1="${num(start.x)}" y1="${num(start.y)}" x2="${num(target.x)}" y2="${num(target.y)}" stroke="#99A3AC" stroke-width="1.6"/>`;
    });
  }).join('');
  const nodes=model.stations.map(station=>{
    const color=model.systems.find(s=>s.id===station.systems[0]).color;
    const description=station.systems.map(id=>model.systems.find(s=>s.id===id).name).join('／')+(station.branch?'・支線分岔':'');
    const fullName=station.name+(station.subtitle?` | ${station.subtitle}`:'');
    const symbol=model.full?stationSymbol(station,model):`<circle cx="${num(station.x)}" cy="${num(station.y)}" r="${station.interchange?12.5:8.5}" fill="white" stroke="${station.interchange?'#1B2838':color}" stroke-width="${station.interchange?4:3}"/>`;
    return `<g ${attrsStation(station)} class="coordinate-station${station.interchange?' interchange':''}${station.terminal?' terminal':''}" aria-label="${xml(fullName)}"><title>${xml(fullName)}｜${xml(description)}</title>${symbol}</g>`;
  }).join('');
  const labels=model.labels.map(label=>`<g data-label-group="${xml(label.stationIds[0])}"><text text-anchor="${label.name==='南港'?'middle':'start'}" data-label="${xml(label.name)}" data-label-stations="${xml(label.stationIds.join('|'))}" x="${num((label.name==='南港'?label.anchor.x:label.x+4))}" y="${num(label.y+28)}" font-size="${label.fontSize}" font-weight="500" fill="${label.future?'#8A929A':'#182838'}" stroke="white" stroke-width="4" stroke-linejoin="round" paint-order="stroke"><tspan data-station-name="true">${xml(label.name)}</tspan>${label.subtitle?`<tspan data-station-subtitle="true" x="${num(label.x+4)}" dy="22" font-size="${label.subtitleSize}" fill="#526171"> | ${xml(label.subtitle)}</tspan>`:''}</text>${label.future&&!label.stationIds.some(id=>['寶斗厝','溝子口','馬明潭','文山區公所','政大'].includes(id))?`<text data-upcoming-note="true" x="${num(label.x+4)}" y="${num(label.y+50)}" font-size="17" fill="#8A929A">即將通車</text>`:''}${label.amenity?amenitySymbol(label.amenity,label.x+12+[...label.name].length*24,label.y+5,label.future):''}${railBadges([...(label.railTransfers||[]),...(label.metroTransfers||[])],label.x+4,label.y+(label.subtitle?62:40),label.railDestinations,label.stationIds[0]==='台北車站')}</g>`).join('');
  const southStations=model.full?['文山區公所','馬明潭','溝子口'].map(id=>model.byId.get(id)):[];
  const southNotice=southStations.length?(()=>{const x=(Math.min(...southStations.map(p=>p.x))+Math.max(...southStations.map(p=>p.x)))/2+100,y=Math.max(...southStations.map(p=>p.y),model.byId.get('寶斗厝').y)+115;return `<g data-south-opening-notice="true"><rect x="${num(x-220)}" y="${num(y)}" width="440" height="68" rx="16" fill="#E0E3E7"/><text x="${num(x)}" y="${num(y+43)}" text-anchor="middle" font-size="28" font-weight="600" fill="#59616B">環狀線南環段尚未通車</text></g>`})():'';
  return `<defs>${masks}</defs><rect width="${model.width}" height="${model.height}" fill="white"/>
  <g font-family="'Noto Sans TC','Microsoft JhengHei',sans-serif" fill="#182838">${includeHeader?header(model):''}
  <g data-map-tracks="true">${tracks}</g><g data-map-walks="true">${walks}</g><g data-map-leaders="true">${leaders}</g><g data-map-stations="true">${nodes}</g><g data-map-labels="true">${labels}${southNotice}</g>
  ${includeSource?`<g data-map-source="true"><rect x="130" y="${model.height-155}" width="${model.width-260}" height="145" fill="white"/><line x1="180" y1="${model.height-138}" x2="${model.width-180}" y2="${model.height-138}" stroke="#D3DCE4" stroke-width="2"/>
  <text x="180" y="${model.height-90}" font-size="30" font-weight="600">${xml(model.source)}</text><text x="180" y="${model.height-40}" font-size="29" font-weight="750">${xml(model.notice)}</text><text x="430" y="${model.height-40}" font-size="25" fill="#526171">線形依指定相對方位重排・示意不按地理比例</text></g>`:''}</g>`;
}

export function createNorthSvg(model=buildNorthMap()){
  const metadata={coordinateSystem:{origin:'R／BL 台北車站',x:'東',y:'北',scale:model.scale},layout:model.layout?`${model.spacingRounds} 輪站距調整；保留原始座標以供比對`:'原始骨架',routes:model.routes.map(route=>({id:route.id,system:route.system,points:route.points.map((p,i)=>({name:p.control?p.raw:p.id,sourceCoordinate:p.coordinate,position:{x:p.x,y:p.y},trackPosition:{x:route.pathPoints[i].x,y:route.pathPoints[i].y},control:!!p.control}))}))};
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${model.width}" height="${model.height}" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-labelledby="map-title map-description"><title id="map-title">${xml(model.title)}</title><desc id="map-description">相對方位配置樣圖；${model.full?'依完整題庫補齊站名與副站名':'僅列附件指定關鍵站'}，共 11 個系統。虛線為指定步行連接，線路缺口表示不轉乘的交叉。</desc><metadata>${xml(JSON.stringify(metadata))}</metadata>${northMapContents(model)}</svg>`;
}
