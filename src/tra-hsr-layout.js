// A display layer only: never add these stations or links to the TRA answer graph.
export function traHsrLayout(model){
  const node=id=>model.nodes.find(n=>n.id===id);
  const sharedX=node('南港').x-26;
  // Reuse a lane across consecutive stations to avoid decorative zigzags.
  const stationX=[sharedX,sharedX,sharedX,720,720,370,370,370,370,370,600,370];
  const entries=[
    ['南港','南港'],['臺北','台北'],['板橋','板橋'],['桃園'],['新竹','六家','walking'],
    ['苗栗','豐富','walking'],['臺中','新烏日'],['彰化'],['雲林'],['嘉義'],['臺南','沙崙'],['左營','新左營']
  ];
  const stops=entries.map(([name,traId,type='shared'],i)=>({name,traId,type,x:stationX[i],y:traId?node(traId).y:null}));
  for(let i=0;i<stops.length;i++){
    if(stops[i].y!==null)continue;
    const before=i-1;let after=i;while(stops[after].y===null)after++;
    const start=stops[before].y,end=stops[after].y;
    for(let j=i;j<after;j++)stops[j].y=start+(end-start)*(j-before)/(after-before);
    i=after-1;
  }
  const points=[stops[0]];
  const departureY=(node('浮洲').y+node('樹林').y)/2;
  for(let i=1;i<stops.length;i++){
    const a=stops[i-1],b=stops[i];
    if(i===3){
      points.push({x:a.x,y:departureY},{x:b.x,y:departureY},b);
      continue;
    }
    if(a.x!==b.x){
      // Turn between station rows, keeping the horizontal segment off TRA stops.
      let y=(a.y+b.y)/2;
      const candidates=Array.from({length:31},(_,j)=>(a.y+35)+(b.y-a.y-70)*j/30);
      const clearance=value=>Math.min(...model.nodes.filter(n=>n.x>=Math.min(a.x,b.x)-20&&n.x<=Math.max(a.x,b.x)+20).map(n=>Math.abs(n.y-value)),Infinity);
      y=candidates.sort((u,v)=>clearance(v)-clearance(u)||Math.abs(u-y)-Math.abs(v-y))[0];
      points.push({x:a.x,y},{x:b.x,y});
    }
    points.push(b);
  }
  return {stops,points,path:roundedHsrPath(points),departureY,connections:stops.filter(s=>s.traId).map(s=>({hsr:s,tra:node(s.traId)}))};
}

export function roundedHsrPath(points,radius=16){
  let path=`M ${points[0].x} ${points[0].y}`;
  for(let i=1;i<points.length-1;i++){
    const a=points[i-1],b=points[i],c=points[i+1];
    const before=Math.hypot(b.x-a.x,b.y-a.y),after=Math.hypot(c.x-b.x,c.y-b.y);
    const bend=(b.x-a.x)*(c.y-b.y)!==(b.y-a.y)*(c.x-b.x);
    if(!bend||!before||!after){path+=` L ${b.x} ${b.y}`;continue;}
    const r=Math.min(radius,before/2,after/2);
    path+=` L ${b.x+(a.x-b.x)*r/before} ${b.y+(a.y-b.y)*r/before} Q ${b.x} ${b.y} ${b.x+(c.x-b.x)*r/after} ${b.y+(c.y-b.y)*r/after}`;
  }
  const last=points.at(-1);
  return `${path} L ${last.x} ${last.y}`;
}
