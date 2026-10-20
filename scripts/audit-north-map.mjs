import {writeFileSync} from 'node:fs';
import {buildNorthMap} from '../src/north-map-model.js';
const map=buildNorthMap(),pairs=[];
for(let i=0;i<map.systems.length;i++)for(let j=i+1;j<map.systems.length;j++){
  const a=map.systems[i],b=map.systems[j];let nearest=null;
  for(const from of map.stations.filter(s=>s.systems.includes(a.id)))for(const to of map.stations.filter(s=>s.systems.includes(b.id))){
    if(from===to)continue;
    const x=Math.max(0,Math.abs(from.x+(from.marker.dx||0)-to.x-(to.marker.dx||0))-(from.marker.w+to.marker.w)/2);
    const y=Math.max(0,Math.abs(from.y-to.y)-(from.marker.h+to.marker.h)/2);
    const gap=Math.hypot(x,y);
    if(!nearest||gap<nearest.gap)nearest={gap,from:from.id,to:to.id};
  }
  pairs.push({systems:[a.id,b.id],...nearest});
}
const report={units:'SVG 畫布單位；量測站碼外框的最短邊距，不代表實際地理距離',systemPairs:pairs.length,pairs};
writeFileSync('docs/north-map-route-clearance.json',JSON.stringify(report,null,2)+'\n');
if(pairs.some(p=>p.gap<=0))throw new Error('Unresolved station-symbol contact between routes');
console.log(JSON.stringify({systemPairs:pairs.length,minimumSymbolGap:Math.min(...pairs.map(p=>p.gap)),stations:map.stations.length,labels:map.labels.length,codes:map.stations.reduce((sum,s)=>sum+s.codes.length,0),blackFrames:map.stations.filter(s=>s.marker.framed).length,subtitles:map.labels.filter(l=>l.subtitle).length}));
