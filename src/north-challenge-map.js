import {makeSchematic} from './schematic.js';
import {buildNorthMap} from './north-map-model.js';
import {northRouteTrackPath} from './north-map-svg.js';

// Keep answer identities from the question bank, but use the reviewed atlas
// geometry. Never reconstruct its curves from the station order.
export function northChallengeMap(network,subtitle){
  const source=makeSchematic(network,subtitle),model=buildNorthMap();
  const nodes=source.nodes.map(node=>{
    const station=model.stations.find(station=>node.codes.some(code=>station.codes.some(item=>item.code===code)))
      ||model.stations.find(station=>station.name===node.raw.split('|')[0]&&(!node.lines.some(line=>line.id==='gondola')||station.systems.includes('gondola')));
    if(!station)throw Error(`Missing reviewed map station: ${node.id}`);
    const label=model.labels.find(label=>label.stationIds.includes(station.id));
    if(!label)throw Error(`Missing reviewed map label: ${node.id}`);
    return {...node,x:station.x,y:station.y,reviewedId:station.id,label:{...node.label,x:label.x,y:label.y,w:Math.max(label.w,node.label.w),h:Math.max(label.h,node.label.h)}};
  });
  const lines=[...model.routes].filter(route=>!route.future).sort((a,b)=>({A:-20,Y:-10,G:20}[a.system]||0)-({A:-20,Y:-10,G:20}[b.system]||0)).map(route=>{
    const points=route.pathPoints.at(-1).extension?route.pathPoints.slice(0,-1):route.pathPoints;
    return {id:route.system.toLowerCase(),key:route.id,color:route.color,vertices:points,path:northRouteTrackPath(route,points),reviewed:true};
  });
  return {...source,width:model.width,height:model.height,nodes,lines,legend:null,reviewed:true};
}
