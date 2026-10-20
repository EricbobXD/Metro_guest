import {writeFileSync,mkdirSync} from 'node:fs';
import {createNorthGeometry} from '../src/north-map-model.js';
import {southReference} from '../src/north-map-south-reference.js';
import {blueReferenceLayout} from '../src/north-map-blue-reference.js';
import {airportSpacingReference} from '../src/north-map-airport-spacing-reference.js';
import {northLabelBox,northLabelLane,northLabelSize} from '../src/north-map-label-policy.js';

const model=createNorthGeometry({full:true,layout:false});
const vertices=new Map();
for(const route of model.routes)for(const point of route.points)if(!vertices.has(point.vertexId))vertices.set(point.vertexId,{...point,index:vertices.size});
const points=[...vertices.values()],n=points.length*2;
const reference=blueReferenceLayout.positions;
function initialPoint(p){
  if(reference[p.vertexId])return reference[p.vertexId];
  if(p.vertexId==='BL:@轉折:17.5,2')return {x:reference['後山埤'].x+150/Math.sqrt(2),y:reference['後山埤'].y-150/Math.sqrt(2)};
  if(p.vertexId==='BR:@轉折:9,12')return {x:reference['大直'].x,y:reference['劍南路'].y};
  if(p.vertexId==='BL:@轉折:-9.6,-4')return {x:reference['江子翠'].x+75,y:reference['江子翠'].y};
  const leads={'BL:@轉折:-10.6,-4':'江子翠','BL:@轉折:-2.25,-2':'西門','BL:@轉折:-0.5,0':'台北車站'};
  if(leads[p.vertexId]){const q=reference[leads[p.vertexId]];return {x:q.x-75,y:q.y+(leads[p.vertexId]==='台北車站'?50:0)};}
  if(p.vertexId==='BL:@轉折:-1.5,-2')return {x:reference['西門'].x+75,y:reference['西門'].y};
  if(p.vertexId==='BL:@轉折:-2.5,-3')return {x:reference['龍山寺'].x+85,y:reference['龍山寺'].y};
  if(p.id==='機場第三航廈')return {x:(reference['機場第二航廈'].x+reference['機場旅館'].x)/2,y:(reference['機場第二航廈'].y+reference['機場旅館'].y)/2};
  if(p.id==='中壢車站')return {x:reference['老街溪'].x,y:reference['老街溪'].y+170};
  const base=reference[p.sourceId];
  if(p.id==='三重〔A〕')return {x:base.x+100,y:base.y};
  if(p.id==='新北產業園區〔A〕')return {x:base.x+64,y:base.y-64};
  if(p.id==='十四張〔K〕')return {x:base.x,y:base.y+120};
  if(southReference[p.vertexId])return southReference[p.vertexId];
  throw new Error(`Missing reference position: ${p.vertexId}`);
}
const original=points.flatMap(p=>{const value=initialPoint(p);return [value.x,value.y];});
const row=terms=>{const a=new Float64Array(n);for(const [i,value]of terms)a[i]+=value;return a;};
const segmentRows=model.segments.map(segment=>{
  const a=vertices.get(segment.a.vertexId).index,b=vertices.get(segment.b.vertexId).index;
  const pa=segment.a.marker?.ports[segment.system]||{x:0,y:0},pb=segment.b.marker?.ports[segment.system]||{x:0,y:0};
  const px=pb.x-pa.x,py=pb.y-pa.y;
  const dx=original[2*b]-original[2*a]+px,dy=original[2*b+1]-original[2*a+1]+py,length=Math.hypot(dx,dy);
  // Snapshot positions are rounded to six decimals; recover the exact allowed
  // axis before elimination so tiny rounding errors cannot create extra pivots.
  const sourceDx=segment.b.coordinate.x-segment.a.coordinate.x,sourceDy=-(segment.b.coordinate.y-segment.a.coordinate.y);
  const horizontal=Math.abs(sourceDy)<1e-8,vertical=Math.abs(sourceDx)<1e-8;
  const shallow=segment.system==='BR'&&segment.a.coordinate.x>=17&&segment.a.coordinate.y>=8&&segment.b.coordinate.y>=8&&!vertical&&!horizontal;
  let ux=shallow?20/Math.sqrt(449):vertical?0:Math.sign(sourceDx)*(horizontal?1:Math.SQRT1_2),uy=shallow?7/Math.sqrt(449):horizontal?0:Math.sign(sourceDy)*(vertical?1:Math.SQRT1_2);
  if(segment.route==='Y-south'&&segment.b.id==='寶斗厝'){ux=1;uy=0;}
  if(segment.system==='R'&&segment.b.id==='廣慈/奉天宮'){ux=1;uy=0;}
  if(segment.system==='K'){
    const diagonal=['陽光運動公園','安康'].includes(segment.b.id);ux=diagonal?-.5:-1;uy=diagonal?Math.sqrt(3)/2:0;
  }
  if(segment.system==='A'&&(segment.b.id==='三重'||segment.a.id==='三重')){ux=-1;uy=0;}
  if(segment.system==='BL'&&segment.a.id==='江子翠'&&segment.b.id==='龍山寺'){ux=1;uy=0;}
  if(segment.system==='Y'&&segment.a.id==='景平'){ux=-1;uy=0;}
  const vector=row([[2*b,ux],[2*a,-ux],[2*b+1,uy],[2*a+1,-uy]]);vector.offset=px*ux+py*uy;
  return {...segment,ai:a,bi:b,length,ux,uy,px,py,vector};
});
// Exact direction constraints are eliminated before any spacing optimization.
const constraints=segmentRows.map(s=>({a:row([[2*s.bi,-s.uy],[2*s.ai,s.uy],[2*s.bi+1,s.ux],[2*s.ai+1,-s.ux]]),b:s.px*s.uy-s.py*s.ux}));
const origin=vertices.get('台北車站').index;
constraints.push({a:row([[2*origin,1]]),b:original[2*origin]},{a:row([[2*origin+1,1]]),b:original[2*origin+1]+50});
const exactPair=(from,to,axis,value)=>constraints.push({a:row([[vertices.get(to).index*2+axis,1],[vertices.get(from).index*2+axis,-1]]),b:value});
exactPair('紅樹林','紅樹林〔V〕',0,64);exactPair('紅樹林','紅樹林〔V〕',1,-64);
exactPair('新埔','新埔民生',0,-120);exactPair('新埔','新埔民生',1,0);
exactPair('板橋〔BL〕','板橋〔Y〕',0,-80);exactPair('板橋〔BL〕','板橋〔Y〕',1,0);
exactPair('台北車站','東門',0,300);
// Green/red vertical corridors: 150 -> 225 horizontal units.
exactPair('北門','中山',0,225);
// Heights are measured from the fixed R10 horizontal axis.
const baseY=reference['台北車站'].y+50;
exactPair('台北車站','龍山寺',1,140);
exactPair('台北車站','西門',1,70);
exactPair('台北車站','小南門',1,reference['小南門'].y-baseY);
exactPair('台北車站','台大醫院',1,100);
exactPair('台大醫院','中正紀念堂',1,100);
exactPair('西門','北門',1,-195);
exactPair('台北車站〔A〕','北門',1,-35);
exactPair('台北車站','台北車站〔A〕',0,-111.43921300000011);
exactPair('民權西路','中山國小',0,220);
// Equal visual station gaps in the southwest, then three equal rising steps.
exactPair('頂埔','永寧',0,200/Math.sqrt(2));exactPair('頂埔','永寧',1,-200/Math.sqrt(2));
const blueSpine=['永寧','土城','海山','亞東醫院','府中','板橋〔BL〕','新埔'];
for(let i=1;i<blueSpine.length;i++)exactPair(blueSpine[i-1],blueSpine[i],1,-200);
const diagonalRise=(-85+Math.sqrt(2*200**2-85**2))/2;
exactPair('新埔','江子翠',0,diagonalRise+85);exactPair('新埔','江子翠',1,-diagonalRise);
for(const [a,b]of [['江子翠','龍山寺'],['龍山寺','西門'],['西門','台北車站']]){exactPair(a,b,0,225);exactPair(a,b,1,a==='江子翠'?0:-70);}
exactPair('BL:@轉折:-10.6,-4','江子翠',0,85);

for(const [a,b]of [['忠孝復興','忠孝敦化'],['忠孝敦化','國父紀念館'],['國父紀念館','市政府'],['市政府','永春']])exactPair(a,b,0,(reference[b].x-reference[a].x)*.8);
for(const [a,b] of [['信義安和','台北101/世貿'],['台北101/世貿','象山'],['象山','廣慈/奉天宮']])exactPair(a,b,0,178);
exactPair('三重','新北產業園區〔A〕',1,0);
exactPair('內湖','東湖',1,250);exactPair('內湖','東湖',0,385.88386682409873);
exactPair('東湖','南港軟體園區',1,150);exactPair('南港軟體園區','南港展覽館',1,150);
for(const [a,b]of [['南京復興','中山國中'],['中山國中','松山機場'],['松山機場','大直']])exactPair(a,b,1,-130);
for(const [a,b]of [['劍南路','西湖'],['西湖','港墘'],['港墘','文德'],['文德','內湖']])exactPair(a,b,0,210);
exactPair('景安','景平',1,0);
exactPair('橋和','中和',0,150);
for(const [a,b]of [['橋和','中原'],['中原','板新']]){exactPair(a,b,0,-150/Math.sqrt(2));exactPair(a,b,1,-150/Math.sqrt(2));}
for(const [i,id]of ['大湖公園','葫洲'].entries())exactPair('內湖',id,0,385.88386682409873*(i+1)/2.6);
for(const [a,b]of [['永春','後山埤'],['後山埤','BL:@轉折:17.5,2']]){exactPair(a,b,0,150/Math.sqrt(2));exactPair(a,b,1,-150/Math.sqrt(2));}
exactPair('後山埤','昆陽',0,157.63882782409823);
exactPair('昆陽','南港',0,190);exactPair('南港','南港展覽館',0,190);
exactPair('大直','BR:@轉折:9,12',1,-130);exactPair('BR:@轉折:9,12','劍南路',0,130);

exactPair('新北產業園區','新北產業園區〔A〕',0,0);exactPair('新北產業園區','新北產業園區〔A〕',1,-64);
exactPair('十四張','十四張〔K〕',0,0);exactPair('十四張','十四張〔K〕',1,120);

const wharf=vertices.get('淡水漁人碼頭').index,tamsui=vertices.get('淡水').index;
constraints.push({a:row([[2*wharf,1],[2*wharf+1,-1],[2*tamsui,-1],[2*tamsui+1,1]]),b:0});
const airportRoute=model.routes.find(r=>r.system==='A'),airportPoints=airportRoute.points.filter(p=>!p.control),airportStart=airportPoints.findIndex(p=>p.id==='新北產業園區〔A〕');
const airportGap=157.73967100000004;let airportTarget={...airportSpacingReference['新北產業園區〔A〕']};
for(let i=airportStart;i<airportPoints.length;i++){const point=airportPoints[i];if(i>airportStart){const a=airportSpacingReference[airportPoints[i-1].vertexId],b=airportSpacingReference[point.vertexId],len=Math.hypot(b.x-a.x,b.y-a.y);airportTarget={x:airportTarget.x+(b.x-a.x)/len*airportGap,y:airportTarget.y+(b.y-a.y)/len*airportGap};}constraints.push({a:row([[vertices.get(point.vertexId).index*2,1]]),b:airportTarget.x},{a:row([[vertices.get(point.vertexId).index*2+1,1]]),b:airportTarget.y});}

const matrix=constraints.map(({a,b})=>Float64Array.from([...a,b]));
const pivots=[];let rank=0;
for(let col=0;col<n&&rank<matrix.length;col++){
  let selected=rank;for(let j=rank+1;j<matrix.length;j++)if(Math.abs(matrix[j][col])>Math.abs(matrix[selected][col]))selected=j;
  if(Math.abs(matrix[selected][col])<1e-8)continue;
  [matrix[rank],matrix[selected]]=[matrix[selected],matrix[rank]];
  const pivot=matrix[rank],factor=pivot[col];for(let j=col;j<=n;j++)pivot[j]/=factor;
  for(let i=0;i<matrix.length;i++)if(i!==rank&&Math.abs(matrix[i][col])>1e-10){const multiple=matrix[i][col];for(let j=col;j<=n;j++)matrix[i][j]-=multiple*pivot[j];}
  pivots.push(col);rank++;
}
const free=Array.from({length:n},(_,i)=>i).filter(i=>!pivots.includes(i)),d=free.length;
const basis=Array.from({length:n},()=>new Float64Array(d)),constant=new Float64Array(n);
free.forEach((index,i)=>{basis[index][i]=1;});
pivots.forEach((index,i)=>{constant[index]=matrix[i][n];free.forEach((f,j)=>{basis[index][j]=-matrix[i][f];});});
const project=a=>{
  const v=new Float64Array(d);let c=a.offset||0;
  for(let i=0;i<n;i++)if(a[i]){c+=a[i]*constant[i];for(let j=0;j<d;j++)v[j]+=a[i]*basis[i][j];}
  return {v,c};
};
function solve(terms){
  const h=Array.from({length:d},()=>new Float64Array(d)),g=new Float64Array(d);
  for(const {a,b,w}of terms){const {v,c}=project(a);for(let i=0;i<d;i++)if(v[i]){g[i]+=w*v[i]*(b-c);for(let j=0;j<=i;j++)h[i][j]+=w*v[i]*v[j];}}
  const l=Array.from({length:d},()=>new Float64Array(d));
  for(let i=0;i<d;i++)for(let j=0;j<=i;j++){let sum=h[i][j];for(let k=0;k<j;k++)sum-=l[i][k]*l[j][k];l[i][j]=i===j?Math.sqrt(Math.max(1e-9,sum)):sum/l[j][j];}
  const y=new Float64Array(d),z=new Float64Array(d);
  for(let i=0;i<d;i++){let sum=g[i];for(let k=0;k<i;k++)sum-=l[i][k]*y[k];y[i]=sum/l[i][i];}
  for(let i=d-1;i>=0;i--){let sum=y[i];for(let k=i+1;k<d;k++)sum-=l[k][i]*z[k];z[i]=sum/l[i][i];}
  return basis.map((v,i)=>constant[i]+v.reduce((sum,x,j)=>sum+x*z[j],0));
}
const dot=(a,x)=>a.reduce((sum,value,i)=>sum+value*x[i],a.offset||0);
const stationEdges=[];
for(const route of model.routes){let previous=null,vector=new Float64Array(n),distance=0;
  for(let i=1;i<route.points.length;i++){
    const segment=segmentRows.find(s=>s.id===`${route.id}:${i-1}`);
    if(!previous&&!route.points[i-1].control)previous=route.points[i-1];
    if(!previous)continue;
    const combined=vector.map((value,j)=>value+segment.vector[j]);combined.offset=(vector.offset||0)+(segment.vector.offset||0);vector=combined;distance+=segment.length;
    if(!route.points[i].control){stationEdges.push({system:route.system,route:route.id,from:previous.id,to:route.points[i].id,vector,distance});previous=route.points[i];vector=new Float64Array(n);distance=0;}
  }
}
const stationIndex=model.stations.map(s=>({...s,index:vertices.get(s.vertexId).index}));
const pairRow=(from,to,axis)=>row([[vertices.get(to).index*2+axis,1],[vertices.get(from).index*2+axis,-1]]);
function collisions(x,margin=0){
  const result=[];
  for(let i=0;i<stationIndex.length;i++)for(let j=i+1;j<stationIndex.length;j++){
    const a=stationIndex[i],b=stationIndex[j],dx=x[b.index*2]-x[a.index*2]+(b.marker.dx||0)-(a.marker.dx||0),dy=x[b.index*2+1]-x[a.index*2+1];
    const w=(a.marker.w+b.marker.w)/2+margin,h=(a.marker.h+b.marker.h)/2+margin;
    if(Math.abs(dx)<w&&Math.abs(dy)<h)result.push({a,b,dx,dy,w,h});
  }
  return result;
}
function segmentDistance(a,b,c,d){
  const pointDistance=(p,u,v)=>{const dx=v.x-u.x,dy=v.y-u.y,t=Math.max(0,Math.min(1,((p.x-u.x)*dx+(p.y-u.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-u.x-t*dx,p.y-u.y-t*dy);};
  const cross=(u,v,w)=>(v.x-u.x)*(w.y-u.y)-(v.y-u.y)*(w.x-u.x);
  if(cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0&&Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&Math.max(c.x,d.x)>=Math.min(a.x,b.x)&&Math.max(a.y,b.y)>=Math.min(c.y,d.y)&&Math.max(c.y,d.y)>=Math.min(a.y,b.y))return 0;
  return Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b));
}
function audit(x){
  const perLine=model.systems.map(system=>{const gaps=stationEdges.filter(e=>e.system===system.id).map(e=>dot(e.vector,x));return {system:system.id,min:Math.min(...gaps),max:Math.max(...gaps),mean:gaps.reduce((a,b)=>a+b,0)/gaps.length};});
  const toPoint=index=>({x:x[index*2],y:x[index*2+1]});
  let westClearance=Infinity;
  for(const a of segmentRows.filter(s=>s.system==='A'))for(const b of segmentRows.filter(s=>s.system==='LB'))westClearance=Math.min(westClearance,segmentDistance(toPoint(a.ai),toPoint(a.bi),toPoint(b.ai),toPoint(b.bi)));
  return {perLine,markerOverlaps:collisions(x).map(p=>[p.a.id,p.b.id]),westClearance,directionError:Math.max(...constraints.map(c=>Math.abs(dot(c.a,x)-c.b))),reversedSegments:segmentRows.filter(s=>dot(s.vector,x)<0).map(s=>s.id),bounds:{minX:Math.min(...points.map(p=>x[p.index*2])),maxX:Math.max(...points.map(p=>x[p.index*2])),minY:Math.min(...points.map(p=>x[p.index*2+1])),maxY:Math.max(...points.map(p=>x[p.index*2+1]))}};
}
const floors={R:118,O:118,BL:122,BR:118,G:120,Y:120,A:120,LB:118,K:116,V:118,gondola:130};
const phases=[['R'],['O'],['BL'],['BR'],['G'],['Y'],['A'],['LB'],['K','V','gondola'],Object.keys(floors),['R','G','O','BL','BR'],['G','A','BL','R'],['R','BR'],['G','K','Y']];
const active=new Set(),history=[];let x=original.slice();
const baseline=audit(x);
for(let round=1;round<=phases.length;round++){
  phases[round-1].forEach(id=>active.add(id));const before=x.slice(),clearanceBounds=new Map();
  for(let sweep=0;sweep<(round>=11?32:6);sweep++){
    const terms=[];
    for(let i=0;i<n;i++)terms.push({a:row([[i,1]]),b:original[i],w:(points[Math.floor(i/2)].systems?.some(s=>s==='Y'||s==='BL')?2:.2)},{a:row([[i,1]]),b:x[i],w:.12});
    for(const edge of stationEdges){let floor=active.has(edge.system)?floors[edge.system]:95;
      if(edge.to==='淡水漁人碼頭')floor=85;
      if(edge.to==='廣慈/奉天宮')floor=90;
      const a=vertices.get(edge.from),b=vertices.get(edge.to),dx=Math.abs(original[a.index*2]-original[b.index*2]),dy=Math.abs(original[a.index*2+1]-original[b.index*2+1]);
      if(active.has(edge.system)&&dy<1e-4&&northLabelLane(a).side===northLabelLane(b).side)floor=Math.max(floor,(northLabelSize(a).w+northLabelSize(b).w)/2+28);
      terms.push({a:edge.vector,b:Math.max(floor,Math.min(320,edge.distance)),w:active.has(edge.system)?35:12});
      if(dot(edge.vector,x)<floor-2)terms.push({a:edge.vector,b:floor+2,w:150});
      if(round>=11&&edge.system==='R'&&edge.from==='中山'&&edge.to==='台北車站')terms.push({a:edge.vector,b:225,w:2000});
      if(round>=13&&edge.system==='R'&&['東門','大安森林公園'].includes(edge.from))terms.push({a:edge.vector,b:168,w:1000});
      if(round>=14&&edge.system==='G'&&edge.to==='小碧潭')terms.push({a:edge.vector,b:130,w:2500});
      if(edge.route==='R-1')terms.push({a:edge.vector,b:115,w:4000});
      if(['V-1','V-2'].includes(edge.route))terms.push({a:edge.vector,b:90,w:2000});
      if(edge.to==='淡水漁人碼頭')terms.push({a:edge.vector,b:106,w:10000});
      if(edge.system==='R'&&['信義安和','台北101/世貿','象山','廣慈/奉天宮'].includes(edge.to))terms.push({a:edge.vector,b:178,w:10000});
      if(edge.from==='淡水'&&edge.to==='紅樹林')terms.push({a:edge.vector,b:145,w:5000});
      if(edge.system==='BR'&&a.coordinate.y===12&&b.coordinate.y===12)terms.push({a:edge.vector,b:245,w:2000});
      if(edge.system==='Y'&&edge.from==='中和'&&edge.to==='橋和'){floor=85;terms.push({a:edge.vector,b:150,w:3000});}
      if(edge.system==='Y'&&edge.from==='大坪林'&&edge.to==='十四張')terms.push({a:edge.vector,b:230,w:5000});
      if(edge.system==='Y'&&edge.from==='十四張'&&edge.to==='秀朗橋')terms.push({a:edge.vector,b:220,w:2000});
      if(edge.system==='Y'&&edge.from==='秀朗橋'&&edge.to==='景平')terms.push({a:edge.vector,b:190,w:2000});
      if(edge.system==='BL'&&['後山埤','昆陽'].includes(edge.to))terms.push({a:edge.vector,b:170,w:6000});
      if(edge.system==='BL'&&edge.from==='新埔'&&edge.to==='江子翠')terms.push({a:edge.vector,b:260,w:6000});
      if(edge.system==='A'&&a.coordinate.x===-26&&b.coordinate.x===-26)terms.push({a:edge.vector,b:120,w:5000});
      if(edge.system==='Y'&&edge.from==='景平'&&edge.to==='景安')terms.push({a:edge.vector,b:170,w:6000});
      if(edge.system==='BR'&&['中山國中','松山機場','大直'].includes(edge.to))terms.push({a:edge.vector,b:175,w:6000});
      if(edge.route==='O-2'&&['三重','先嗇宮','頭前庄','新莊','輔大','丹鳳','迴龍'].includes(edge.to))terms.push({a:edge.vector,b:220,w:30000});
      if(edge.system==='K')terms.push({a:edge.vector,b:['陽光運動公園','安康'].includes(edge.to)?175:edge.to==='新和國小'?190:140,w:2000});
    }
    for(const segment of segmentRows.filter(s=>s.system==='BL'&&s.a.control&&['江子翠','西門','台北車站'].includes(s.b.id)))terms.push({a:segment.vector,b:85,w:20000});
    for(const segment of segmentRows.filter(s=>s.system==='BL'&&s.b.control&&s.a.id==='江子翠'))terms.push({a:segment.vector,b:70,w:20000});
    for(const segment of segmentRows)if(dot(segment.vector,x)<24)terms.push({a:segment.vector,b:28,w:500});
    for(const collision of collisions(x,round>=12?30:22)){
      const axis=Math.abs(collision.dx)>=Math.abs(collision.dy)?0:1;
      const sign=Math.sign(axis===0?collision.dx:collision.dy)||1;
      const unrelated=!collision.a.systems.some(system=>collision.b.systems.includes(system));
      const offset=axis===0?(collision.b.marker.dx||0)-(collision.a.marker.dx||0):0;
      const term={a:pairRow(collision.a.id,collision.b.id,axis),b:sign*(axis===0?collision.w:collision.h)-offset,w:round>=12?(unrelated?60000:30000):600};
      if(round>=12){const id=`${collision.a.id}/${collision.b.id}`;if(!clearanceBounds.has(id))clearanceBounds.set(id,term);}
      else terms.push(term);
    }
    if(round>=12)terms.push(...[...clearanceBounds].filter(([key])=>!key.startsWith('text:')).map(([,term])=>term));
    // Reserve the actual text footprint on the fixed side of each stretch.
    // These terms change station spacing, rather than flipping text across rails.
    if(round>=10){
      const labelBoxes=[];
      for(const s of stationIndex){
        const p={...s,x:x[s.index*2],y:x[s.index*2+1]},box=northLabelBox(p);
        labelBoxes.push({...box,station:s,kind:'label'});
      }
      const symbolBoxes=stationIndex.map(s=>({x:x[s.index*2]+(s.marker.dx||0)-s.marker.w/2,y:x[s.index*2+1]-s.marker.h/2,w:s.marker.w,h:s.marker.h,station:s,kind:'symbol'}));
      const separate=(a,b)=>{
        if(a.station.id===b.station.id)return;
        const dx=b.x+b.w/2-a.x-a.w/2,dy=b.y+b.h/2-a.y-a.h/2;
        const needX=(a.w+b.w)/2+18,needY=(a.h+b.h)/2+18;
        if(Math.abs(dx)>=needX||Math.abs(dy)>=needY)return;
        const axis=needX-Math.abs(dx)<needY-Math.abs(dy)?0:1;
        const sign=Math.sign(axis===0?dx:dy)||1;
        const aOffset=axis===0?a.x+a.w/2-x[a.station.index*2]:a.y+a.h/2-x[a.station.index*2+1];
        const bOffset=axis===0?b.x+b.w/2-x[b.station.index*2]:b.y+b.h/2-x[b.station.index*2+1];
        const bound=sign*(axis===0?needX:needY)-bOffset+aOffset;
        const key=`text:${a.station.id}:${a.kind}/${b.station.id}:${b.kind}`;
        const term={a:pairRow(a.station.id,b.station.id,axis),b:bound,w:round>=11?12000:300};
        if(round>=11){if(!clearanceBounds.has(key))clearanceBounds.set(key,term);}else terms.push(term);
      };
      for(let i=0;i<labelBoxes.length;i++){
        for(let j=i+1;j<labelBoxes.length;j++)separate(labelBoxes[i],labelBoxes[j]);
        for(const s of symbolBoxes)separate(labelBoxes[i],s);
      }
      if(round===11)terms.push(...clearanceBounds.values());
      if(round>=12)terms.push(...[...clearanceBounds].filter(([key])=>key.startsWith('text:')).map(([,term])=>term));
    }
    for(const walk of model.walks){
      const from=vertices.get(walk.from.id).index,to=vertices.get(walk.to.id).index,dx=original[to*2]-original[from*2],dy=original[to*2+1]-original[from*2+1],len=Math.hypot(dx,dy);
      const goal=walk.from.name==='板橋'?110:walk.from.name==='新埔'?120:walk.from.name==='紅樹林'?90:120;
      terms.push({a:row([[to*2,dx/len],[from*2,-dx/len],[to*2+1,dy/len],[from*2+1,-dy/len]]),b:goal,w:70});
    }
    terms.push({a:pairRow('老街溪','鶯歌車站',0),b:81+Math.min(round,10)*33,w:round>=7?500:50});
    const vertical=pairRow('老街溪','鶯桃福德',1);
    if(dot(vertical,x)<180)terms.push({a:vertical,b:190,w:100});
    terms.push({a:pairRow('淡水漁人碼頭','淡水',0),b:250,w:2000});
    terms.push({a:pairRow('十四張','小碧潭',0),b:128,w:1500});
    terms.push({a:pairRow('十四張','七張',1),b:200,w:1000});
    terms.push({a:pairRow('台北車站','龍山寺',1),b:225,w:6000});
    terms.push({a:pairRow('台北車站','西門',1),b:150,w:10000});
    terms.push({a:pairRow('台北車站','東門',0),b:300,w:3000});
    terms.push({a:pairRow('北門','台北車站〔A〕',0),b:110,w:1500});
    terms.push({a:pairRow('北門','台北車站〔A〕',1),b:50,w:1500});
    for(let i=0;i<n;i++){const low=i%2?150:300,high=i%2?4580:4800;if(x[i]<low||x[i]>high)terms.push({a:row([[i,1]]),b:Math.max(low,Math.min(high,x[i])),w:200});}
    x=solve(terms);
    // Active lower bounds prevent a bend from folding back past its station.
    const constrained=new Set();
    for(let guard=0;guard<18;guard++){
      const violating=segmentRows.filter(s=>dot(s.vector,x)<Math.min(24,s.length*.8)-.01&&!constrained.has(s.id));
      if(!violating.length)break;
      for(const s of violating){terms.push({a:s.vector,b:Math.min(26,s.length*.85),w:1e8});constrained.add(s.id);}
      x=solve(terms);
    }
  }
  const state=audit(x),movement=Math.max(...x.map((value,i)=>Math.abs(value-before[i])));
  history.push({round,focus:phases[round-1],maxMovement:movement,...state});
  console.log(`Round ${round}: focus=${phases[round-1].join('/')} moved=${movement.toFixed(2)} px; overlaps=${state.markerOverlaps.length}; A/LB clearance=${state.westClearance.toFixed(1)} px; direction error=${state.directionError.toExponential(1)}`);
}
const positions=Object.fromEntries(points.map(p=>[p.vertexId,{x:Number(x[p.index*2].toFixed(6)),y:Number(x[p.index*2+1].toFixed(6))}]));
mkdirSync('docs',{recursive:true});
writeFileSync('docs/north-map-spacing.json',JSON.stringify({baseline,rounds:history},null,2)+'\n');
writeFileSync('src/north-map-layout.js',`// Generated by scripts/optimize-north-map.mjs: ${history.length} measured geometry adjustments.\nexport const northLayout=${JSON.stringify({positions,rounds:history.map(({round,focus,maxMovement,westClearance})=>({round,focus,maxMovement,westClearance}))},null,2)};\n`);
console.log(JSON.stringify(history.at(-1),null,2));
