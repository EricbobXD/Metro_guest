import {stationId,groupTerminals} from './data.js';
export const railwayColors={tra:'#397F91',hsr:'#E48128'};
export function singleRouteDisplayGroup(networkId,group){
 if(networkId!=='north'||!['y','a'].includes(group.id))return group;
 const segments=group.segments.map(segment=>({...segment,stops:[...segment.stops]})),stops=segments[0].stops;let planned=[];
 if(group.id==='y'){planned=['動物園','政大','文山區公所','馬明潭','溝子口','寶斗厝'];stops.unshift(...planned);}
 else {planned=['機場第三航廈','中壢車站'];stops.splice(stops.findIndex(raw=>raw.split('|')[0]==='機場旅館'),0,'機場第三航廈');stops.push('中壢車站');}
 return {...group,name:group.id==='y'?'環狀線':group.name,segments,stops:segments.flatMap(s=>s.stops),planned};
}
// Distances follow the drawn line, including the common lead and fork legs.
export function singleRouteDestinations(network,group,layout){
 if(group.loop)return [];
 const terminals=groupTerminals(network,group),nodes=new Map(layout.nodes.map(n=>[stationId(network.id,n.lineId,n.raw),n])),graph=new Map([...nodes.keys()].map(id=>[id,[]]));
 const connect=(a,b,length)=>{graph.get(a)?.push([b,length]);graph.get(b)?.push([a,length]);};
 group.segments.forEach((segment,index)=>{for(let i=1;i<segment.stops.length;i++){const a=stationId(network.id,segment.id,segment.stops[i-1]),b=stationId(network.id,segment.id,segment.stops[i]),p=nodes.get(a),q=nodes.get(b),fork=index>0&&i===1?layout.branchConnections[index-1]:null;connect(a,b,fork?Math.abs(fork.splitX-fork.anchorX)+Math.hypot(fork.elbowX-fork.splitX,fork.elbowY-fork.anchorY)+Math.abs(fork.firstX-fork.elbowX):Math.hypot(q.x-p.x,q.y-p.y));}});
 const origin=stationId(network.id,layout.nodes[0].lineId,layout.nodes[0].raw),dist=new Map([[origin,0]]),pending=new Set(nodes.keys());
 while(pending.size){const id=[...pending].sort((a,b)=>(dist.get(a)??Infinity)-(dist.get(b)??Infinity))[0];pending.delete(id);for(const [next,weight]of graph.get(id)||[]){const d=(dist.get(id)??Infinity)+weight;if(d<(dist.get(next)??Infinity))dist.set(next,d);}}
 const hops=new Map([[origin,0]]),queue=[origin];for(let i=0;i<queue.length;i++)for(const [next]of graph.get(queue[i])||[])if(!hops.has(next)){hops.set(next,hops.get(queue[i])+1);queue.push(next);}
 return [...terminals].map(id=>({id,name:nodes.get(id).raw.split('|')[0],distance:dist.get(id)??Infinity,hops:hops.get(id)??Infinity,future:!!nodes.get(id).future,origin:id===origin})).sort((a,b)=>Math.abs(a.distance-b.distance)>1e-6?a.distance-b.distance:a.hops-b.hops);
}

export function singleRouteCombinations(network,sourceGroup,group,layout,selection){
 const nodes=new Map(layout.nodes.map(n=>[stationId(network.id,n.lineId,n.raw),n])),graph=new Map([...nodes.keys()].map(id=>[id,new Set()]));
 const link=(a,b)=>{graph.get(a)?.add(b);graph.get(b)?.add(a);};
 for(const segment of group.segments)for(let i=1;i<segment.stops.length;i++)link(stationId(network.id,segment.id,segment.stops[i-1]),stationId(network.id,segment.id,segment.stops[i]));
 const main=layout.nodes.filter(n=>n.lineId===group.segments[0].id&&!n.future),origin=stationId(network.id,main[0].lineId,main[0].raw),operational=groupTerminals(network,sourceGroup);
 const path=(from,to)=>{const prev=new Map([[from,null]]),queue=[from];for(let i=0;i<queue.length&&!prev.has(to);i++)for(const next of graph.get(queue[i])||[])if(!prev.has(next)){prev.set(next,queue[i]);queue.push(next);}const result=[];if(!prev.has(to))return result;for(let id=to;id!==null;id=prev.get(id))result.push(id);return result.reverse();};
 const name=id=>nodes.get(id).raw.split('|')[0],distance=id=>path(origin,id).length;
 const order=ids=>[...ids].sort((a,b)=>distance(a)-distance(b));
 let ends=[...operational],options=[];
 const additional=network.id==='north'?{r:['北投','台北車站'],bl:['台北車站'],g:['七張'],lb:['鶯歌車站']}[group.id]||[]:[];
 for(const stop of additional){const node=layout.nodes.find(n=>n.raw.split('|')[0]===stop);if(node)ends.push(stationId(network.id,node.lineId,node.raw));}
 for(const id of order(new Set(ends)))options.push({id,targets:[id],name:name(id)});
 if(network.id==='north'&&['r','g','bl','lb'].includes(group.id)){
 const resolve=label=>[...nodes].find(([,n])=>n.raw.split('|')[0]===label)?.[0];
 const specs={
 bl:[['南港展覽館',['台北車站','頂埔']],['台北車站',['頂埔']],['頂埔',['台北車站','南港展覽館']],['台北車站',['南港展覽館']]],
 lb:[['頂埔',['鶯歌車站','鶯桃福德']],['鶯歌車站',['鶯桃福德']],['鶯桃福德',['鶯歌車站','頂埔']],['鶯歌車站',['頂埔']]],
 g:[['松山',['新店']],['新店',['松山']],['七張',['小碧潭','新店']],['小碧潭',['七張']]],
 r:[['廣慈/奉天宮',['台北車站','北投','淡水']],['台北車站',['北投','淡水']],['北投',['淡水']],['北投',['新北投']],['北投',['台北車站','大安']],['淡水',['台北車站','廣慈/奉天宮']],['台北車站',['廣慈/奉天宮']],['新北投',['北投']]]}[group.id];
 options=specs.map(([start,ends],i)=>{const text=ends.join('・');return {id:group.id+'-service-'+i,start:resolve(start),targets:ends.map(resolve),name:text};});
 }
 if(network.id==='kaohsiung'&&['kh-r','kh-o'].includes(group.id)){
 const first=origin,last=stationId(network.id,main.at(-1).lineId,main.at(-1).raw),middle=[...nodes].find(([,n])=>n.raw.split('|')[0]==='美麗島')[0];
 options=[[last,[middle,first]],[middle,[first]],[first,[middle,last]],[middle,[last]]].map(([start,targets],i)=>({id:group.id+'-service-'+i,start,targets,name:targets.map(name).join('・')}));
 }
 const far=stationId(network.id,main.at(-1).lineId,main.at(-1).raw),defaultOption=options.find(o=>o.targets.includes(far))||options.find(o=>o.targets.some(id=>id!==origin));
 const selected=options.find(o=>o.id===selection)||defaultOption||options[0];
 const activeIds=new Set();if(group.loop)for(const id of nodes.keys())activeIds.add(id);
 else if(selected){const starts=selected.start?[selected.start]:selected.targets.includes(origin)?[...operational].filter(id=>id!==origin):[origin];for(const start of starts)for(const target of selected.targets)for(const id of path(start,target))activeIds.add(id);}
 return {options,selected,origin,reverse:selected?.start?layout.nodes.findIndex(n=>stationId(network.id,n.lineId,n.raw)===selected.start)>layout.nodes.findIndex(n=>stationId(network.id,n.lineId,n.raw)===selected.targets.at(-1)):!!selected?.targets.includes(origin),activeIds,operational};
}
