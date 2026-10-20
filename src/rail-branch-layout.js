// Pixel-independent x coordinates use station-column centers. All branch stems
// begin at the junction center; non-overlapping spans share the same lane.
export function railBranchLayout(branches,columns,reverse=false){
  const occupied=[],result=[];
  for(const branch of branches){
    const anchor=reverse?columns-branch.index-.5:branch.index+.5;
    const nodes=branch.group.segments.flatMap(s=>s.stops.map(raw=>({raw,lineId:s.id}))).slice(1);
    const single=nodes.length===1;
    const directions=[-1,1].sort((a,b)=>{
      const capacity=d=>d===1?columns-Math.ceil(anchor):Math.floor(anchor);
      const rows=d=>1+Math.ceil(Math.max(0,nodes.length-capacity(d))/columns);
      return rows(a)-rows(b)||capacity(a)-capacity(b);
    });
    const direction=directions[0];
    let x=single?anchor:anchor+direction,dir=direction,row=0;
    const positions=nodes.map((node,index)=>{
      if(x<.5||x>columns-.5){row++;dir=-dir;x=Math.max(.5,Math.min(columns-.5,x));}
      const position={...node,index:index+1,x,row};x+=dir;return position;
    });
    const min=Math.min(anchor,...positions.map(p=>p.x))-.45,max=Math.max(anchor,...positions.map(p=>p.x))+.45;
    const depth=Math.max(...positions.map(p=>p.row))+1;
    let lane=0;
    while(occupied.some(o=>lane<o.lane+o.depth&&lane+depth>o.lane&&min<o.max+.1&&max>o.min-.1))lane++;
    occupied.push({lane,depth,min,max});
    const baseline=single&&lane===0?112:142+lane*100;
    for(const p of positions)p.y=baseline+p.row*100;
    const points=[{x:anchor,y:42},{x:anchor,y:baseline}];
    positions.forEach((p,i)=>{const prev=positions[i-1];if(prev&&p.row!==prev.row){const edge=prev.x<columns/2?.06:columns-.06;points.push({x:edge,y:prev.y},{x:edge,y:p.y});}points.push(p);});
    result.push({...branch,anchor,positions,points,min,max,lane,single,height:Math.max(...positions.map(p=>p.y))+76});
  }
  return {branches:result,height:Math.max(132,...result.map(b=>b.height))};
}
