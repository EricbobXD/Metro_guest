import {stationId} from './data.js';

export function traVerticalLayout(network){
  const lines=new Map(network.lines.map(line=>[line.id,line])),nodes=new Map(),step=62,top=70,westX=230,eastX=850;
  const id=raw=>stationId('tra','',raw),put=(raw,x,y,lineId,side='right')=>{const key=id(raw);if(!nodes.has(key))nodes.set(key,{id:key,raw,x,y,lineId,side});return nodes.get(key);};
  const merge=(ids)=>{const result=[];for(const lineId of ids)for(const raw of lines.get(lineId).stops)if(result.at(-1)?.raw!==raw)result.push({raw,lineId});return result;};
  const west=merge(['tr-north','tr-mountain','tr-south','tr-pingtung']);
  west.forEach((n,i)=>put(n.raw,westX,top+i*step-Math.min(i,8)*14,n.lineId));
  const start=nodes.get(id('竹南')),end=nodes.get(id('彰化')),coast=lines.get('tr-coast');
  coast.stops.slice(1,-1).forEach((raw,i)=>put(raw,70,start.y+(end.y-start.y)*(i+1)/(coast.stops.length-1),coast.id,'left'));
  const east=merge(['tr-yilan','tr-northlink','tr-taitung']).filter(n=>n.raw!=='蘇澳');
  // Yilan's operational spur is not part of the north-south spine.
  const seen=new Set(),eastUnique=east.filter(n=>{if(seen.has(id(n.raw)))return false;seen.add(id(n.raw));return true;});
  const eastTop=nodes.get(id('八堵')).y,bottom=nodes.get(id('枋寮')).y;
  eastUnique.slice(1).forEach((n,i)=>put(n.raw,eastX,eastTop+(bottom-eastTop)*(i+1)/(eastUnique.length-1),n.lineId));
  const spur=(lineId,anchor,x)=>{const line=lines.get(lineId),index=line.stops.findIndex(raw=>id(raw)===id(anchor)),root=nodes.get(id(anchor));line.stops.slice(index+1).forEach((raw,i)=>put(raw,x,root.y+(i+1)*step,lineId));};
  spur('tr-neiwan','北新竹',470);spur('tr-liujia','竹中',650);
  // The service starts at Hsinchu and shares the trunk to North Hsinchu.
  // Keep its junction name clear of the eastbound branch annotation.
  nodes.get(id('北新竹')).side='left';
  spur('tr-shenao','瑞芳',1040);spur('tr-pingxi','三貂嶺',1180);spur('tr-jiji','二水',470);spur('tr-shalun','中洲',470);
  spur('tr-hualienport','北埔',1040);
  const suao=nodes.get(id('蘇澳新'));put('蘇澳',1040,suao.y+step,'tr-yilan');
  const south=lines.get('tr-southlink'),southY=bottom+200;
  south.stops.slice(1,-1).forEach((raw,i)=>put(raw,westX+(eastX-westX)*(i+1)/(south.stops.length-1),southY,south.id,'bottom'));
  const edges=new Map();
  for(const line of network.lines)for(let i=1;i<line.stops.length;i++){
    const a=nodes.get(id(line.stops[i-1])),b=nodes.get(id(line.stops[i]));
    if(!a||!b)throw new Error(`Missing TRA layout station: ${line.id}`);
    const key=[a.id,b.id].sort().join('|');if(edges.has(key)){edges.get(key).lineIds.push(line.id);continue;}
    let points=[a,b];
    if(line.id==='tr-southlink')points=[a,{x:a.x,y:southY},{x:b.x,y:southY},b];
    else if(line.id==='tr-chengzhui'){const x=(a.x+b.x)/2;points=[a,{x,y:a.y},{x,y:b.y},b];}
    else if(a.x!==b.x&&a.y!==b.y)points=line.id==='tr-coast'&&b.id===id('彰化')?[a,{x:a.x,y:b.y},b]:[a,{x:b.x,y:a.y},b];
    edges.set(key,{a:a.id,b:b.id,lineIds:[line.id],points});
  }
  const main=new Set(['tr-north','tr-mountain','tr-coast','tr-south','tr-pingtung','tr-yilan','tr-northlink','tr-taitung','tr-southlink']);
  for(const edge of edges.values()){edge.branch=!edge.lineIds.some(lineId=>main.has(lineId))||edge.lineIds.includes('tr-yilan')&&[edge.a,edge.b].includes(id('蘇澳'));}
  for(const node of nodes.values()){node.degree=[...edges.values()].filter(e=>e.a===node.id||e.b===node.id).length;node.corridor=['tr-yilan','tr-northlink','tr-taitung','tr-shenao','tr-pingxi','tr-hualienport'].includes(node.lineId)?'東部幹線':node.lineId==='tr-southlink'?'南迴線':'西部幹線';}
  const labels=[{name:'西部幹線',x:westX,y:45},{name:'東部幹線',x:westX+250,y:eastTop-18},{name:'山線',x:westX+18,y:start.y+34},{name:'海線',x:18,y:start.y+34},{name:'內灣線',x:488,y:nodes.get(id('千甲')).y-30},{name:'六家線',x:668,y:nodes.get(id('六家')).y-30},{name:'深澳線',x:1058,y:nodes.get(id('海科館')).y-30},{name:'平溪線',x:1198,y:nodes.get(id('大華')).y-30},{name:'集集線',x:488,y:nodes.get(id('源泉')).y-30},{name:'沙崙線',x:488,y:nodes.get(id('長榮大學')).y-30},{name:'南迴線',x:(westX+eastX)/2,y:southY+78}];
  labels.push({name:'成追線',x:110,y:Math.min(nodes.get(id('追分')).y,nodes.get(id('成功')).y)-24});
  labels.push({name:'蘇澳支線',x:1058,y:nodes.get(id('蘇澳')).y-30});
  labels.push({name:'花蓮臨港線',x:1058,y:nodes.get(id('花蓮港')).y-30});
  const sharedHsinchu={from:nodes.get(id('北新竹')),to:nodes.get(id('新竹')),lineIds:['tr-north','tr-neiwan']};
  return {nodes:[...nodes.values()].sort((a,b)=>a.y-b.y||a.x-b.x),edges:[...edges.values()],labels,sharedHsinchu,width:1320,height:southY+110,anchors:network.lines.map(line=>({id:line.id,node:nodes.get(id(line.stops[0]))})),parallel:start,suao:nodes.get(id('蘇澳'))};
}
