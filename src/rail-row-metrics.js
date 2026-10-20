function textWidth(text,size){return [...text].reduce((sum,c)=>sum+(/[\u0000-\u007f]/.test(c)?size*.58:size),0);}
function chipRows(labels,width){let rows=0,used=0;for(const label of labels){const length=textWidth(label,12)+10;if(used&&used+3+length>width){rows++;used=0;}if(length>width){rows+=Math.ceil(length/width);used=0;}else used+=(used?3:0)+length;}return rows+(used?1:0);}
export function railRowHeight(stations,cellWidth=80){
  const width=Math.max(30,cellWidth-6);
  return Math.max(84,...stations.map(s=>{
    const nameRows=Math.max(1,Math.ceil(textWidth(s.name,15)/width));
    const rail=chipRows(s.rail,width),metro=chipRows(s.metro,width);
    const links=(s.connections||[]).reduce((sum,c)=>sum+Math.ceil(textWidth(c.label,11)/width)*16+4,0);
    return 84+(nameRows-1)*23+(rail?5+rail*23:0)+(metro?5+metro*23:0)+links+(s.segmentStart?24:0);
  }));
}
