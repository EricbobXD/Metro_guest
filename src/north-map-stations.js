import { networks, stationCode } from './data.js';
import { northRoutes } from './north-map-data.js';

const lineForRoute={
  'R-0':'r','R-1':'r-branch','G-0':'g','G-1':'g-branch',
  'O-0':'o','O-1':'o-luzhou','O-2':'o-xinzhuang',
  'BL-0':'bl','BR-0':'br','gondola-0':'gondola','Y-0':'y',
  'A-0':'a','LB-0':'lb','K-0':'k','V-0':'v','V-1':'v-blue','V-2':'v-green',
};
const north=networks.find(network=>network.id==='north');
export function northStationId(system,name){
  if(name==='板橋'&&['BL','Y'].includes(system))return `${name}〔${system}〕`;
  if(name==='台北車站'&&system==='A')return `${name}〔A〕`;
  if(name==='動物園')return `${name}〔${system==='gondola'?'纜車':'BR'}〕`;
  return name;
}

export const northStationDetails=new Map();
for(const route of northRoutes){
  const line=north.lines.find(line=>line.id===lineForRoute[route.id]);
  for(const raw of line.stops){
    const [name,subtitle='']=raw.split('|'),id=northStationId(route.system,name);
    const previous=northStationDetails.get(id);
    if(previous?.subtitle&&subtitle&&previous.subtitle!==subtitle)throw new Error(`Subtitle disagreement: ${id}`);
    const codes=[...(previous?.codes||[])],code=stationCode(north,line.id,raw);
    if(!codes.some(item=>item.code===code))codes.push({code,system:route.system});
    northStationDetails.set(id,{id,name,subtitle:subtitle||previous?.subtitle||'',raw:subtitle?raw:previous?.raw||raw,codes});
  }
}

const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
function interpolate(points,distance){
  for(let i=1;i<points.length;i++){
    const span=length(points[i-1],points[i]);
    if(distance<=span+1e-9){
      const t=Math.min(1,distance/span);
      return {x:points[i-1].x+(points[i].x-points[i-1].x)*t,y:points[i-1].y+(points[i].y-points[i-1].y)*t};
    }
    distance-=span;
  }
  throw new Error('Station interpolation exceeds fixed route');
}

// Insert intermediate stations by arc length along the fixed attachment skeleton.
// Original stations and invisible bend/branch controls are copied without changes.
export function expandNorthRoutes(){
  return northRoutes.map(route=>{
    const line=north.lines.find(line=>line.id===lineForRoute[route.id]);
    let ordered=line.stops.map(raw=>northStationId(route.system,raw.split('|')[0]));
    const anchors=route.points.map((p,index)=>({...p,index})).filter(p=>!p.control);
    if(ordered.indexOf(anchors[0].raw)>ordered.indexOf(anchors.at(-1).raw))ordered=ordered.toReversed();
    ordered=ordered.slice(ordered.indexOf(anchors[0].raw),ordered.indexOf(anchors.at(-1).raw)+1);
    const points=route.points.slice(0,anchors[0].index+1).map(p=>({...p}));
    for(let i=1;i<anchors.length;i++){
      const from=anchors[i-1],to=anchors[i];
      const fromIndex=ordered.indexOf(from.raw),toIndex=ordered.indexOf(to.raw);
      if(fromIndex<0||toIndex<=fromIndex)throw new Error(`Station order disagrees: ${route.id} ${from.raw} → ${to.raw}`);
      const span=route.points.slice(from.index,to.index+1);
      const distances=[0];
      for(let j=1;j<span.length;j++)distances.push(distances.at(-1)+length(span[j-1],span[j]));
      const additions=ordered.slice(fromIndex+1,toIndex).map((raw,j,missing)=>{
        const distance=distances.at(-1)*(j+1)/(missing.length+1);
        return {distance,point:{raw,...interpolate(span,distance),control:false,added:true}};
      });
      const fixed=span.slice(1).map((point,j)=>({distance:distances[j+1],point:{...point}}));
      points.push(...[...fixed,...additions].sort((a,b)=>a.distance-b.distance).map(item=>item.point));
    }
    points.push(...route.points.slice(anchors.at(-1).index+1).map(p=>({...p})));
    return {...route,points};
  });
}
