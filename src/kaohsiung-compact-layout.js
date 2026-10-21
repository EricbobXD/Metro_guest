const root2=Math.SQRT2;
// Preserve the red/orange corridors and their horizontal expansion.
// The light rail follows a rounded rectangle anchored at its three interchanges.
export function compactKaohsiung(pitch=112,horizontalScale=1.35,ringAspect=.95,transferGap=1.2,sides=8,westScale=1.6,southScale=1.45,trunkScale=1.5){
 const positions={'kh-r':Array(25),'kh-o':Array(14),'kh-c':Array(38)},bends={'kh-r':{},'kh-o':{},'kh-c':{}};
 const D=[0,0],B=[0,3],F=[root2,5+root2],A=[-(4-root2),4];
 function section(id,start,end,vertices){
  const length=[0];for(let i=1;i<vertices.length;i++)length.push(length.at(-1)+Math.hypot(vertices[i][0]-vertices[i-1][0],vertices[i][1]-vertices[i-1][1]));
  const count=end-start,total=length.at(-1);
  if(Math.abs(total-count)>1e-8)throw Error('Unequal station pitch: '+id+' '+total+' / '+count);
  for(let i=0;i<=count;i++){
   const d=i;let edge=1;while(edge<length.length-1&&length[edge]<d)edge++;
   const t=(d-length[edge-1])/(length[edge]-length[edge-1]),a=vertices[edge-1],b=vertices[edge],index=(start+i)%positions[id].length;
   positions[id][index]=(i===0?vertices[0]:i===count?vertices.at(-1):[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]).map(v=>v*pitch);
   if(i<count)bends[id][index]=vertices.filter((_,j)=>length[j]>d+1e-8&&length[j]<d+1-1e-8).map(p=>p.map(v=>v*pitch));
  }
 }
 section('kh-r',0,13,[[0,-13],D]);section('kh-r',13,16,[D,B]);
 section('kh-r',16,20,[B,[0,5],F]);
 section('kh-r',20,24,[F,[2*root2,5+2*root2],[2*root2+2,5+2*root2]]);
 section('kh-o',0,3,[A,[A[0]+.7,4],[A[0]+1.7,3],B]);
 positions['kh-o'][1][1]=A[1]*pitch;bends['kh-o'][0]=[];
 section('kh-o',3,13,[B,[8,3],[8+root2,3+root2]]);
 // Expand the red corridor south of R10 around its fixed interchange.
 const south=p=>{if(p[1]>B[1]*pitch){p[0]*=southScale;p[1]=B[1]*pitch+(p[1]-B[1]*pitch)*southScale;}};
 for(const p of positions['kh-r'])south(p);
 for(const points of Object.values(bends['kh-r']))for(const p of points)south(p);
 // Compensate for horizontal map expansion so the displayed diagonal is exactly 45°.
 const diagonalStart=positions['kh-r'][18],oldEnd=[...positions['kh-r'][22]],step=pitch*southScale/Math.SQRT2;
 for(let i=19;i<=22;i++){positions['kh-r'][i]=[diagonalStart[0]+(i-18)*step/horizontalScale,diagonalStart[1]+(i-18)*step];bends['kh-r'][i-1]=[];}
 const end=positions['kh-r'][22];
 for(let i=23;i<=24;i++){positions['kh-r'][i][0]+=end[0]-oldEnd[0];positions['kh-r'][i][1]+=end[1]-oldEnd[1];}
 F[0]=positions['kh-r'][20][0]/pitch;F[1]=positions['kh-r'][20][1]/pitch;
 // Rounded rectangle: D is on the top edge, A on the left, F on the bottom.
 const left=A[0],right=5.5,top=D[1],bottom=F[1],r=.85;
 const polygon=[];
 const add=(x,y)=>polygon.push([x*pitch,y*pitch]);
 add(...D);add(right-r,top);
 for(let i=1;i<=16;i++){const a=-Math.PI/2+i*Math.PI/32;add(right-r+r*Math.cos(a),top+r+r*Math.sin(a));}
 add(right,bottom-r);
 for(let i=1;i<=16;i++){const a=i*Math.PI/32;add(right-r+r*Math.cos(a),bottom-r+r*Math.sin(a));}
 add(...F);add(left+r,bottom);
 for(let i=1;i<=16;i++){const a=Math.PI/2+i*Math.PI/32;add(left+r+r*Math.cos(a),bottom-r+r*Math.sin(a));}
 add(...A);add(left,top+r);
 for(let i=1;i<=16;i++){const a=Math.PI+i*Math.PI/32;add(left+r+r*Math.cos(a),top+r+r*Math.sin(a));}
 function arc(start,end,from,to){
  const a=polygon.findIndex(p=>Math.hypot(p[0]/pitch-from[0],p[1]/pitch-from[1])<1e-8),b=polygon.findIndex(p=>Math.hypot(p[0]/pitch-to[0],p[1]/pitch-to[1])<1e-8);
  const path=[polygon[a]];for(let i=(a+1)%polygon.length;i!==b;i=(i+1)%polygon.length)path.push(polygon[i]);path.push(polygon[b]);
  const lengths=[0];for(let i=1;i<path.length;i++)lengths.push(lengths.at(-1)+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
  for(let i=start;i<=end;i++){const fraction=(i-start)/(end-start),d=lengths.at(-1)*(start===2?Math.pow(fraction,.82):fraction);let edge=1;while(edge<lengths.length-1&&lengths[edge]<d)edge++;const t=(d-lengths[edge-1])/(lengths[edge]-lengths[edge-1]);positions['kh-c'][i%38]=path[edge-1].map((v,k)=>v+(path[edge][k]-v)*t);}
 }
 arc(24,40,D,F);arc(2,13,F,A);arc(13,24,A,D);
 // Keep station symbols clear of the orange-line crossing on the east side.
 for(const [i,y] of [[29,.9],[30,1.5],[31,2.1]])positions['kh-c'][i]=[right*pitch,y*pitch];
 for(let i=32;i<=35;i++)positions['kh-c'][i]=[right*pitch,(4+(Math.min(bottom-r-.6,positions['kh-c'][36][1]/pitch-.6)-4)*(i-32)/3)*pitch];
 // Stretch R13–R10 and translate everything farther south by the same amount.
 const stretch=p=>{if(p[0]<0)p[0]*=westScale;if(p[1]>0)p[1]=p[1]<=3*pitch?p[1]*trunkScale:p[1]+3*pitch*(trunkScale-1);};
 for(const points of Object.values(positions))for(const p of points)stretch(p);
 for(const sections of Object.values(bends))for(const points of Object.values(sections))for(const p of points)stretch(p);
 for(const p of polygon)stretch(p);
 const center=[(left*westScale+right)/2,(top+bottom)/2],radius=(bottom-top)/2;
 for(const points of Object.values(positions))for(const point of points)point[0]*=horizontalScale;
 for(const sections of Object.values(bends))for(const points of Object.values(sections))for(const point of points)point[0]*=horizontalScale;
 return {positions,bends,rings:{'kh-c':{vertices:polygon.map(p=>[p[0]*horizontalScale,p[1]]),cx:center[0]*pitch*horizontalScale,cy:(bottom+3*(trunkScale-1))/2*pitch,rx:(right-left*westScale)/2*pitch*horizontalScale,ry:(bottom+3*(trunkScale-1))/2*pitch}},offset:[1150,13*pitch+250],legend:{x:1100,y:160,w:1250,h:650,compassX:500,compassY:800}};
}


