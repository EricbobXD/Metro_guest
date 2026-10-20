// Fit the station content, rather than the poster's title and legend margins.
export function challengeMapBounds(map){
  const points=map.lines.flatMap(line=>line.vertices);
  for(const node of map.nodes){
    points.push({x:node.x-node.marker.w/2-15,y:node.y-35},{x:node.x+node.marker.w/2+15,y:node.y+40});
    points.push({x:node.label.x,y:node.label.y},{x:node.label.x+node.label.w,y:node.label.y+node.label.h});
  }
  const left=Math.min(...points.map(p=>p.x))-70,right=Math.max(...points.map(p=>p.x))+70;
  const top=Math.min(...points.map(p=>p.y))-70,bottom=Math.max(...points.map(p=>p.y))+70;
  return {left,right,top,bottom,width:right-left,height:bottom-top,x:(left+right)/2,y:(top+bottom)/2};
}
export function challengeMapFrame(bounds,aspect){
  return {width:Math.max(bounds.width,bounds.height*aspect),height:Math.max(bounds.height,bounds.width/aspect)};
}
export function constrainChallengeView(view,bounds,frame,map){
  const halfW=frame.width/view.zoom/2,halfH=frame.height/view.zoom/2;
  const clamp=(value,min,max,center)=>min>max?center:Math.max(min,Math.min(max,value));
  return {...view,x:clamp(map.width/2+view.x,bounds.left+halfW,bounds.right-halfW,bounds.x)-map.width/2,
    y:clamp(map.height/2+view.y,bounds.top+halfH,bounds.bottom-halfH,bounds.y)-map.height/2};
}
