// A continuous stretch has one label side. Collision handling may slide a label
// along that side, but may never alternate it across the track.
export function northLabelLane(station){
  const {x,y}=station.coordinate,id=station.id;
  if(id==='寶斗厝')return {lane:'Y:south-planned-row',side:'below'};
  if(['溝子口','馬明潭','文山區公所'].includes(id))return {lane:'Y:south-planned-horizontal',side:'below'};
  if(['政大'].includes(id))return {lane:'Y:south-planned-horizontal',side:'below'};
  if(id==='頂埔')return {lane:'BL:dingpu',side:'above'};
  if(id==='中正紀念堂')return {lane:'R:memorial',side:'left'};
  if(id==='南港')return {lane:'BL:nangang',side:'below'};
  if(id==='小碧潭')return {lane:'G:branch',side:'above'};
  if(id==='台北車站〔A〕')return {lane:'A:main',side:'above'};
  if(id==='板橋〔Y〕')return {lane:'Y:banqiao',side:'left'};
  if(id==='板橋〔BL〕')return {lane:'BL:banqiao',side:'right'};
  if(id==='動物園〔BR〕')return {lane:'BR:zoo',side:'above'};
  if(id==='動物園〔纜車〕')return {lane:'gondola:zoo',side:'right'};
  if(id==='大坪林')return {lane:'G:dapinglin',side:'right'};
  if(id==='十四張')return {lane:'Y:south',side:'below'};
  if(id==='十四張〔K〕')return {lane:'K:terminal',side:'right'};
  if(['新和國小','陽光運動公園'].includes(id))return {lane:'K:spine',side:'left'};
  if(station.systems.includes('R')){
    if(x===0)return {lane:'R:spine',side:'right'};
    if(y===-4)return {lane:'R:east',side:'below'};
    if(y===11)return {lane:'R:beitou',side:'above'};
    return {lane:'R:north',side:'right'};
  }
  if(station.systems.includes('BR')){
    if(x===9||x===21||x===13)return {lane:`BR:vertical:${x}`,side:'right'};
    if(y===12||y===-11||y===-7.5)return {lane:`BR:horizontal:${y}`,side:'above'};
    return {lane:'BR:diagonal',side:'right'};
  }
  if(station.systems.includes('O')){
    if(x===-2&&y<=-9)return {lane:'O:south',side:'left'};
    if(x===3)return {lane:'O:core',side:'right'};
    if(y===5)return {lane:'O:horizontal',side:'above'};
    if(y>=6)return {lane:'O:luzhou',side:'right'};
    return {lane:'O:xinzhuang',side:'left'};
  }
  if(station.systems.includes('A'))return x===-26?{lane:'A:west',side:'right'}:{lane:'A:north',side:'above'};
  if(station.systems.includes('LB'))return x===-25?{lane:'LB:west',side:'right'}:{lane:'LB:south',side:'below'};
  if(station.systems.includes('Y'))return x===-13?{lane:'Y:west',side:'left'}:{lane:'Y:south',side:'below'};
  if(station.systems.includes('BL'))return x===-12?{lane:'BL:west',side:'right'}:{lane:'BL:east',side:'below'};
  if(station.systems.includes('G'))return x===-2?{lane:'G:west',side:'left'}:y===2?{lane:'G:north',side:'above'}:{lane:'G:south',side:'right'};
  if(station.systems.includes('V'))return x<=-13?{lane:'V:west',side:'left'}:{lane:'V:east',side:'right'};
  if(station.systems.includes('K'))return y===-20?{lane:'K:west',side:'above'}:{lane:'K:east',side:'right'};
  return {lane:'gondola',side:'right'};
}

export function northLabelSize(station){
  const textWidth=(text,size)=>[...text].reduce((n,c)=>n+(/[/・|\s]/.test(c)?size*.5:/[\x00-\x7f]/.test(c)?size*.6:size),0);
  const badges=[...(station.railTransfers||[]),...(station.metroTransfers||[])];
  const stacked=station.id==='台北車站';
  const badgeWidth=stacked?118:badges.reduce((sum,badge)=>sum+(badge==='機場捷運'?88:56),0)+Math.max(0,badges.length-1)*6;
  return {w:Math.max(textWidth(station.name,24)+(station.amenity?36:0),station.subtitle?textWidth(`| ${station.subtitle}`,17):0,badgeWidth)+8,h:(station.subtitle||(station.future&&!station.codes.some(c=>c.system==='Y'))?59:38)+(badges.length?(stacked?60:30):0)};
}

export function northLabelBox(station,side=northLabelLane(station).side,gap=null,shift=0){
  const {w,h}=northLabelSize(station),horizontal=side==='left'||side==='right';
  const padding=(gap??(horizontal?station.marker.w/2+8:station.marker.h/2+8))+(station.id==='政大'&&side==='left'?20:0);
  const x=station.x+(station.marker.dx||0),y=station.y;
  // Put a transfer label in the adjacent corner, clear of its crossing track.
  if(station.interchange)shift+=horizontal?-(h/2+12):(w/2+12);
  if(station.id==='大坪林')return {x:x+station.marker.w/2+8,y:y+18,w,h};
  if(station.id==='南港')return {x:x-w/2,y:y+padding,w,h};
  if(station.id==='頂埔')return {x:x+station.marker.w/2+8,y:y-h-12,w,h};
  if(station.id==='中正紀念堂')return {x:x-padding-w,y:y+34,w,h};
  if(station.id==='十四張'&&side==='below')shift+=w/2+12;
  return side==='right'?{x:x+padding,y:y-h/2+shift,w,h}:side==='left'?{x:x-padding-w,y:y-h/2+shift,w,h}:side==='above'?{x:x-w/2+shift,y:y-padding-h,w,h}:{x:x-w/2+shift,y:y+padding,w,h};
}

