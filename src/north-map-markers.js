export const lightRailSystems=new Set(['K','V']);
export function northMarker(station){
  const framed=!!station.interchange;
  if(station.systems.includes('gondola'))return {w:36,h:36,items:[],framed:false,dx:0,dy:0,gondola:true,ports:{gondola:{x:0,y:0}}};
  const items=station.codes.map(item=>({...item,shape:lightRailSystems.has(item.system)?'circle':'rect',w:lightRailSystems.has(item.system)?42:item.code.replace(/^[A-Za-z]+/,'').length>2?40:34}));
  const innerWidth=items.reduce((sum,item)=>sum+item.w,0)+(items.length-1)*4;
  const w=innerWidth+(framed?12:0),h=framed?52:42;
  let x=framed?6:0;
  for(const item of items){item.x=x;item.terminal=station.terminalSystems.includes(item.system);item.filled=item.terminal||item.system==='A';x+=item.w+4;}
  // Transfer frames and crossing tracks share the station anchor.
  const dx=0;
  const ports=Object.fromEntries(items.map(item=>[item.system,{x:framed?0:dx-w/2+item.x+item.w/2,y:0}]));
  return {w,h,items,framed,dx,dy:0,ports};
}
export function northInk(color){
  const rgb=color.match(/[a-f\d]{2}/gi).map(n=>parseInt(n,16)/255);
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.61?'#172332':'#FFFFFF';
}
