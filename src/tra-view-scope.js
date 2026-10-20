import {stationId} from './data.js';
export const traViewScopes=[{id:'all',name:'全路網'},{id:'west',name:'西部幹線'},{id:'east',name:'東部幹線'},{id:'south',name:'南迴線'}];
export const traEndpointId=name=>stationId('tra','',name);
const lines={
 west:['tr-north','tr-mountain','tr-coast','tr-south','tr-pingtung','tr-neiwan','tr-liujia','tr-jiji','tr-shalun','tr-chengzhui'],
 east:['tr-yilan','tr-northlink','tr-taitung','tr-shenao','tr-pingxi','tr-hualienport'],
 south:['tr-southlink'],
};
export const traScopeEnds={west:['基隆','枋寮','內灣','六家','車埕','沙崙'],east:['八堵','臺東','蘇澳','八斗子','菁桐'],south:['枋寮','臺東']};
export function traScopeForRoute(id){return id==='tr-suao'?'east':id==='tr-parallel'?'west':Object.keys(lines).find(scope=>lines[scope].includes(id))||'all';}
export function traScopeModel(model,scope){
 if(scope==='all'||!lines[scope])return model;
 const allowed=new Set(lines[scope]||[]),edges=model.edges.filter(edge=>edge.lineIds.some(id=>allowed.has(id))),ids=new Set(edges.flatMap(e=>[e.a,e.b]));
 const labelScopes={'西部幹線':'west','山線':'west','海線':'west','內灣線':'west','六家線':'west','集集線':'west','沙崙線':'west','成追線':'west','東部幹線':'east','深澳線':'east','平溪線':'east','蘇澳支線':'east','花蓮臨港線':'east','南迴線':'south'};
 return {...model,nodes:model.nodes.filter(n=>ids.has(n.id)),edges,labels:model.labels.filter(l=>labelScopes[l.name]===scope),anchors:model.anchors.filter(a=>allowed.has(a.id)&&ids.has(a.node.id))};
}
export function traDisplayPath(model,scope,{from,to,via='mountain'}){
 const endpoints=traScopeEnds[scope];
 if(!endpoints||!endpoints.includes(from)||!endpoints.includes(to)||from===to)return {ids:new Set(),edges:new Set(),path:[]};
 from=traEndpointId(from);to=traEndpointId(to);
 const blocked=scope==='west'?(via==='coast'?'tr-mountain':'tr-coast'):null;
 // Chengzhui remains visible as a connector. It is not a terminal or a shortcut
 // that silently overrides the chosen mountain/coast corridor.
 const eligible=model.edges.filter(e=>!blocked||e.lineIds.some(id=>id!==blocked&&id!=='tr-chengzhui')&&!e.lineIds.every(id=>id==='tr-chengzhui'));
 const graph=new Map();
 for(const e of eligible){if(!graph.has(e.a))graph.set(e.a,[]);if(!graph.has(e.b))graph.set(e.b,[]);graph.get(e.a).push(e.b);graph.get(e.b).push(e.a);}
 const prev=new Map([[from,null]]),queue=[from];
 for(let i=0;i<queue.length&&!prev.has(to);i++)for(const next of graph.get(queue[i])||[])if(!prev.has(next)){prev.set(next,queue[i]);queue.push(next);}
 if(!prev.has(to))return {ids:new Set(),edges:new Set(),path:[]};
 const path=[];for(let id=to;id!==null;id=prev.get(id))path.push(id);path.reverse();
 return {ids:new Set(path),edges:new Set(path.slice(1).map((id,i)=>[path[i],id].sort().join('|'))),path};
}
export function traScopeBox(model,scope,extra=[]){
 if(scope==='all')return `0 0 ${model.width} ${model.height}`;
 const points=[...model.nodes,...model.edges.flatMap(e=>e.points),...model.labels.map(l=>({x:l.x+150,y:l.y})),...extra];
 const left=Math.min(...points.map(p=>p.x))-180,right=Math.max(...points.map(p=>p.x))+230,top=Math.min(...points.map(p=>p.y))-85,bottom=Math.max(...points.map(p=>p.y))+100;
 return `${left} ${top} ${right-left} ${bottom-top}`;
}
