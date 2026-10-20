import { stationId, stationsFor, routeGroups, routeLayout, stationCode, groupTerminals, mapTransfers, branchTransfers, walkConnections } from './data.js';
import { mapLayouts, diagramColor } from './map-layouts.js';

const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

// Every rail segment is horizontal, vertical or 45 degrees. Insert unlabelled
// corners without moving stations or separating shared interchange coordinates.
export function railVertices(points,loop=false,bends={}){
  if(!points.length)return [];
  const vertices=[points[0]],count=points.length-(loop?0:1);
  for(let i=0;i<count;i++){
    const target=points[(i+1)%points.length];
    for(const b of [...(bends[i]||[]),target]){
      const a=vertices.at(-1),dx=b.x-a.x,dy=b.y-a.y;
      const ratio=Math.abs(dx/dy),isThirtyDegree=Math.abs(ratio-Math.sqrt(3))<.02;
      if(dx&&dy&&Math.abs(Math.abs(dx)-Math.abs(dy))>1e-6&&!isThirtyDegree){
        const length=Math.min(Math.abs(dx),Math.abs(dy));
        vertices.push({x:a.x+Math.sign(dx)*length,y:a.y+Math.sign(dy)*length,corner:true});
      }
      vertices.push(b);
    }
  }
  if(loop)vertices.pop();
  return vertices;
}

export function schematicPath(points,loop=false){
  if(points.length<2)return '';
  const p=loop?[points.at(-1),...points,points[0]]:points;
  const start=loop?{x:(points[0].x+points.at(-1).x)/2,y:(points[0].y+points.at(-1).y)/2}:points[0];
  let path=`M${start.x},${start.y}`;
  for(let i=1;i<p.length-1;i++){
    const a=p[i-1],b=p[i],c=p[i+1],before=Math.hypot(b.x-a.x,b.y-a.y),after=Math.hypot(c.x-b.x,c.y-b.y);
    if(!before||!after)continue;
    const cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
    if(Math.abs(cross)<1e-6){path+=` L${b.x},${b.y}`;continue;}
    const radius=Math.min(b.corner?48:26,before*.28,after*.28);
    const enter={x:b.x+(a.x-b.x)*radius/before,y:b.y+(a.y-b.y)*radius/before},leave={x:b.x+(c.x-b.x)*radius/after,y:b.y+(c.y-b.y)*radius/after};
    path+=` L${enter.x},${enter.y} Q${b.x},${b.y} ${leave.x},${leave.y}`;
  }
  return loop?`${path} L${start.x},${start.y} Z`:`${path} L${p.at(-1).x},${p.at(-1).y}`;
}

function segmentHitsBox(a,b,box){
  let low=0,high=1;
  for(const [origin,delta,min,max] of [[a.x,b.x-a.x,box.x,box.x+box.w],[a.y,b.y-a.y,box.y,box.y+box.h]]){
    if(!delta){if(origin<min||origin>max)return false;continue;}
    const first=(min-origin)/delta,last=(max-origin)/delta;
    low=Math.max(low,Math.min(first,last));high=Math.min(high,Math.max(first,last));
    if(low>high)return false;
  }
  return true;
}

function labelSide(network,node){
  if(network==='north'&&node.id==='中正紀念堂')return 'below';
  if(network==='north'&&node.id==='小碧潭')return 'right';
  if(network==='north'&&node.id==='台北海洋大學')return 'right';
  if(network==='north'&&node.id==='南勢角')return 'below';
  if(network==='north'&&node.id==='領航')return 'right';
  if(network==='north'&&node.id==='機場第二航廈')return 'below';
  const line=node.primaryLine,code=parseInt(node.codes[0]?.replace(/\D/g,''),10);
  if(node.id==='濱海沙崙')return 'left';
  if(network==='taichung'){
    if(node.id==='松竹')return 'right';
    if(code>=104&&code<=109)return 'above';
    if(code>=116)return 'below';
    return code>=110&&code<=115?'left':'right';
  }
  if(network==='kaohsiung'){
    if(line==='kh-r')return 'right';
    if(line==='kh-o')return 'below';
    if(code<=7||code>=34)return 'below';
    return code<=19?'left':code<=28?'above':'right';
  }
  if(line==='r')return code>=8?'right':'below';
  if(line==='r-branch')return 'right';
  if(line==='g')return code>=14?'above':code>=10?'left':'right';
  if(line==='g-branch')return 'left';
  if(line==='o')return code<=5?'left':code>=9?'above':'right';
  if(line.startsWith('o-'))return 'above';
  if(line==='bl')return 'below';
  if(line==='br')return code>=15&&code<=20?'above':'right';
  if(line==='y')return code>=16?'right':'below';
  if(line==='a')return node.id==='台北車站:機捷'?'left':code>=8?'left':'above';
  if(line==='v')return code>=6?'right':'left';
  if(line==='v-green')return 'right';
  if(line==='lb'&&code<=5)return 'right';
  if(line==='k')return 'above';
  return 'below';
}

function nameRows(name,side){
  if(name.includes('/'))return name.split('/').map((part,i,parts)=>i<parts.length-1?`${part}/`:part);
  if([...name].length<=4||['left','right'].includes(side))return [name];
  const endings=['紀念堂','紀念館','展覽館','小巨蛋','副都心','新市鎮','漁人碼頭','中國城','運動公園','森林公園','科技園區','體育園區','軟體園區','行政中心','海洋大學','安康院區','紀念醫院','醫院','大學','商圈'];
  const end=endings.find(end=>name.endsWith(end)&&name!==end);
  if(end)return [name.slice(0,-end.length),end];
  const chars=[...name],cut=chars.length>6?4:3;
  return [chars.slice(0,cut).join(''),chars.slice(cut).join('')];
}

export function makeSchematic(network,subtitle=false){
  const layout=mapLayouts[network.id];if(!layout)return null;
  const scale=network.id==='north'?.72:.9;
  const legend=layout.legend?{x:layout.legend.x*scale,y:layout.legend.y*scale,w:layout.legend.w*scale,h:layout.legend.h*scale,scale}:null;
  const groups=routeGroups(network).map(group=>({...group,color:diagramColor(group)})),stations=stationsFor(network),points=new Map(),metadata=new Map();
  const [offsetX,offsetY]=layout.offset;
  for(const line of network.lines){
    const positions=layout.positions[line.id];
    if(positions?.length!==line.stops.length)throw new Error(`Schematic station count mismatch: ${line.id}`);
    line.stops.forEach((raw,i)=>{const id=stationId(network.id,line.id,raw);if(!points.has(id))points.set(id,{x:(positions[i][0]+offsetX)*scale,y:(positions[i][1]+offsetY)*scale});});
  }
  for(const group of groups){
    const terminals=groupTerminals(network,group);
    routeLayout(group).nodes.forEach((node,i)=>{
      const id=stationId(network.id,node.lineId,node.raw);
      if(!metadata.has(id))metadata.set(id,{groupName:group.name,ordinal:i+1,color:group.color,terminal:terminals.has(id),primaryLine:node.lineId});
      else if(terminals.has(id))metadata.get(id).terminal=true;
    });
  }
  const nodes=stations.map(station=>{
    const meta=metadata.get(station.id),items=new Map();
    for(const line of station.lines){
      const raw=line.stops.find(raw=>stationId(network.id,line.id,raw)===station.id),code=stationCode(network,line.id,raw);
      if(code&&!items.has(code))items.set(code,{code,color:diagramColor(line)});
    }
    const codes=[...items.keys()],branches=branchTransfers(network,station),transfers=mapTransfers(network,station,meta.primaryLine);
    const codeItems=[...items.values(),...transfers.filter(label=>['台鐵','高鐵'].includes(label)).map(code=>({code,color:'#455268',external:true})),...(branches.length?[{code:'支線',color:'#455268',external:true}]:[])];
    let badgeX=0;
    for(const item of codeItems){item.x=badgeX;item.width=[...item.code].reduce((sum,char)=>sum+(/[\u3400-\u9fff]/.test(char)?14:8),14);badgeX+=item.width+5;}
    const interchange=network.id==='kaohsiung'?station.lines.length>1:transfers.some(label=>!['台鐵','高鐵'].includes(label))||network.id==='north'&&transfers.length>0;
    let markerX=interchange?(network.id==='north'?5:6):0;
    const markerItems=[...items.values()].map(item=>{const number=item.code.replace(/^[A-Za-z]+/,'');const w=network.id!=='north'?(/^C\d/.test(item.code)?42:number.length>2?40:34):number.length>2?38:30;const serving=station.lines.find(line=>stationCode(network,line.id,line.stops.find(raw=>stationId(network.id,line.id,raw)===station.id))===item.code);const terminal=!!serving&&!serving.loop&&[serving.stops[0],serving.stops.at(-1)].some(raw=>stationId(network.id,serving.id,raw)===station.id);const result={...item,x:markerX,w,terminal};markerX+=w+4;return result;});
    const marker={items:markerItems,w:markerX-4+(interchange?(network.id==='north'?14:6):0),h:44};
    return {...station,...meta,...points.get(station.id),codes,codeItems,interchange,codeWidth:badgeX-5,codeLabel:codeItems.map(item=>item.code).join(' · '),transfers,branches,marker};
  });
  const lines=network.lines.map(line=>{
    const coordinates=line.stops.map(raw=>points.get(stationId(network.id,line.id,raw))),bends={};
    for(const [edge,positions] of Object.entries(layout.bends?.[line.id]||{}))bends[edge]=positions.map(([x,y])=>({x:(x+offsetX)*scale,y:(y+offsetY)*scale,corner:true}));
    return {...line,color:diagramColor(line),points:coordinates,vertices:railVertices(coordinates,line.loop,bends)};
  });
  const edges=lines.flatMap(line=>{const p=line.loop?[...line.vertices,line.vertices[0]]:line.vertices;return p.slice(1).map((b,i)=>[p[i],b]);});
  if(network.id==='kaohsiung')for(const [from,to]of walkConnections.kaohsiung){const a=nodes.find(n=>n.id===from),b=nodes.find(n=>n.id===to);if(a&&b)edges.push([a,b]);}
  const circles=nodes.map(n=>({x:n.x-n.marker.w/2-4,y:n.y-26,w:n.marker.w+8,h:52})),labels=legend?[{...legend}]:[];
  [...nodes].sort((a,b)=>b.transfers.length-a.transfers.length).forEach(node=>{
    const [name,sub]=node.raw.split('|'),side=labelSide(network.id,node),rows=network.id==='north'?nameRows(name,side):[name],subRows=subtitle&&sub?(network.id==='north'?nameRows(sub,'below'):[sub]):[],measure=(text,size)=>[...text].reduce((sum,char)=>sum+(/[\u3400-\u9fff]/.test(char)?size:size*.56),0),external=node.codeItems.filter(item=>item.external),extraWidth=external.reduce((sum,item)=>sum+item.width+5,0),w=Math.max(...rows.map(row=>measure(row,30)),extraWidth,...subRows.map(row=>measure(row,21)))+10+(network.id==='kaohsiung'&&node.id==='高雄國際機場'?36:0),h=rows.length*34+subRows.length*25+(external.length?25:0),candidates=[];
    const base=side==='left'||side==='right'?node.marker.w/2+12:34;
    for(const placement of network.id==='north'||network.id==='taichung'&&node.id==='松竹'?[side]:[side,...['left','right','above','below'].filter(s=>s!==side)])for(const gap of (network.id==='north'?[base,base+12,base+28,base+50,base+80,base+120,base+175,base+240]:[base,base+12,base+28,base+50]))for(const shift of [0,-12,12,-24,24,-40,40,-64,64,-80,80,-112,112,-140,140]){
      const offset=placement==='right'?{dx:gap,dy:-18+shift}:placement==='left'?{dx:-w-gap,dy:-18+shift}:placement==='above'?{dx:-w/2+shift,dy:-h-gap}:{dx:-w/2+shift,dy:gap};
      const box={x:node.x+offset.dx,y:node.y+offset.dy,w,h};
      if(box.x<25||box.y<130||labels.some(label=>intersects(label,box)))continue;
      if(network.id!=='north'&&edges.some(([a,b])=>segmentHitsBox(a,b,{x:box.x-9,y:box.y-9,w:box.w+18,h:box.h+18})))continue;
      const distance=Math.hypot(Math.max(box.x,Math.min(node.x,box.x+w))-node.x,Math.max(box.y,Math.min(node.y,box.y+h))-node.y);
      if(network.id!=='north'&&(distance>100||circles.some(b=>intersects(b,box))))continue;
      candidates.push({...offset,placement,score:circles.filter(b=>intersects(b,box)).length*20000+edges.filter(([a,b])=>segmentHitsBox(a,b,box)).length*900+distance*60+Math.abs(shift)*2+(placement===side?0:300)});
    }
    const best=candidates.sort((a,b)=>a.score-b.score)[0];
    if(!best)throw new Error(`No readable label position: ${node.id}`);
    node.label={x:node.x+best.dx,y:node.y+best.dy,w,h,side:best.placement,rows,subRows};labels.push({...node.label});
  });
  const width=Math.max(legend?legend.x+legend.w:0,...nodes.map(n=>Math.max(n.x+n.marker.w/2,n.label.x+n.label.w)))+70,height=Math.max(...nodes.map(n=>Math.max(n.y+22,n.label.y+n.label.h)))+70;
  return {nodes,lines,width,height,groups,legend};
}
