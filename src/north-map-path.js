const number=value=>Number(value.toFixed(4));
export function northRoundedPath(points){
  const xy=p=>`${number(p.x)},${number(p.y)}`;
  let path=`M${xy(points[0])}`;
  for(let i=1;i<points.length-1;i++){
    const a=points[i-1],b=points[i],c=points[i+1];
    const before=Math.hypot(b.x-a.x,b.y-a.y),after=Math.hypot(c.x-b.x,c.y-b.y);
    const turn=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);
    if(!b.control||Math.abs(turn)<1e-5){path+=` L${xy(b)}`;continue;}
    const clearance=(p,dx,dy,length)=>{if(!p.marker)return length;const ux=Math.abs(dx/length),uy=Math.abs(dy/length);return Math.max(0,length-Math.min((p.marker.w/2+3)/(ux||1e-10),(p.marker.h/2+3)/(uy||1e-10))-10);};
    const radius=Math.min(b.cornerRadius||34,before*(b.cornerRadius?.65:.32),after*(b.cornerRadius?.65:.32),clearance(a,b.x-a.x,b.y-a.y,before),clearance(c,b.x-c.x,b.y-c.y,after));
    if(radius<1e-5){path+=` L${xy(b)}`;continue;}
    const entry={x:b.x+(a.x-b.x)*radius/before,y:b.y+(a.y-b.y)*radius/before};
    const exit={x:b.x+(c.x-b.x)*radius/after,y:b.y+(c.y-b.y)*radius/after};
    path+=` L${xy(entry)} Q${xy(b)} ${xy(exit)}`;
  }
  return `${path} L${xy(points.at(-1))}`;
}
