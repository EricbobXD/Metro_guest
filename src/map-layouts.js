// Schematic poster coordinates; the north layout follows the supplied map photo.
const north = {
  // North-side center is organized around Taipei Main: the red line approaches
  // from the north, runs vertically through the city, then turns east.
  r: [[650,310],[750,410],[750,510],[750,610],[850,610],[950,610],[1050,610],[1150,710],[1250,810],[1350,910],[1450,1010],[1450,1110],[1450,1210],[1450,1310],[1450,1410],[1450,1510],[1450,1610],[1450,1710],[1450,1930],[1450,2130],[1450,2330],[1650,2330],[1850,2330],[2050,2330],[2250,2330],[2450,2330],[2650,2330],[2850,2330]],
  'r-branch': [[1050,1010],[1150,510]],
  g: [[3250,1710],[3050,1710],[2850,1710],[2450,1710],[1650,1710],[1450,1710],[1250,1930],[1250,2130],[1250,2330],[1450,2330],[1550,2430],[1350,2730],[1250,2830],[1250,2930],[1250,3030],[1250,3130],[1250,3230],[1250,3330],[1250,3430]],
  'g-branch': [[1250,3230],[1450,3230]],
  o: [[1450,2930],[1450,2830],[1450,2630],[1450,2530],[1550,2430],[1650,2330],[1650,2130],[1650,1710],[1650,1610],[2050,1510],[1450,1510],[2250,1510]],
  'o-xinzhuang': [[1250,2010],[1100,2010],[1000,2110],[900,2210],[800,2310],[700,3230],[600,3330],[500,3430],[400,3530],[300,3630]],
  'o-luzhou': [[1250,2010],[1100,1860],[1000,1760],[900,1660],[800,1560],[700,1460]],
  bl: [[350,3810],[350,3660],[350,3510],[350,3360],[350,3210],[500,3060],[650,2910],[750,2810],[850,2710],[950,2610],[1250,2510],[1450,1930],[1850,1930],[2050,1930],[2450,1930],[2650,1930],[2850,1930],[3050,1930],[3250,1930],[3450,2030],[3650,2130],[3850,2130],[4050,2130]],
  br: [[3050,3910],[2950,3910],[2850,3910],[2750,3910],[2750,3810],[2750,3710],[2550,3710],[2450,3410],[2450,3110],[2450,2510],[2450,2310],[2450,1610],[2450,1410],[2450,1310],[2650,1310],[2850,1310],[3050,1310],[3250,1310],[3450,1310],[3550,1410],[3650,1510],[3650,1610],[3650,1710],[3650,1810]],
  gondola: [[3150,3910],[3250,4010],[3250,4110],[3250,4210]],
  y: [[1450,4060],[1250,4060],[1150,3960],[1050,3660],[1050,3510],[950,3510],[850,3510],[750,3510],[650,3410],[650,2910],[700,3330],[700,3230],[700,3130],[700,3030]],
  lb: [[350,3810],[450,3710],[550,3610],[650,3710],[750,3710],[950,3710],[1150,3710],[1450,3710],[1450,3810],[1450,3910],[1450,4010],[1450,4110]],
  a: [[1350,1930],[900,2230],[700,3030],[550,3030],[450,3030],[350,3030],[250,3030],[150,3130],[50,3230],[150,3230],[250,3230],[600,3230],[1700,3230],[1800,3330],[1900,3430],[1900,3530],[1900,3630],[1900,3730],[1900,3830],[1900,3930],[1900,4030],[1900,4130]],
  v: [[750,410],[850,310],[950,210],[1050,110],[1150,10],[1250,-90],[1350,-190],[1450,-290],[1550,-390]],
  'v-green': [[1550,-390],[1650,-290],[1750,-190]],
  'v-blue': [[1550,-390],[1750,-390],[1850,-290],[1950,-190]],
  k: [[200,4460],[400,4460],[600,4460],[800,4460],[1000,4460],[1200,4460],[1300,4560],[1400,4660],[1500,4760]],
};
// Skeletons follow the two user-supplied reference diagrams.
const kaohsiung = {
 'kh-r': [...Array.from({length:19},(_,i)=>[950,180+i*110]),[950,2270],[1170,2490],[1390,2710],[1610,2930],[1830,2930],[2050,2930]],
 'kh-o': [[250,2160],[470,2160],[690,1940],[950,1940],[1190,1940],[1430,1940],[1670,1940],[1910,1940],[2150,1940],[2390,1940],[2630,1940],[2870,1940],[3110,1940],[3330,2160]],
 'kh-c': [[1500,2710],[1340,2550],[1260,2490],[1030,2720],[800,2950],[690,2840],[580,2730],[470,2620],[360,2510],[250,2400],[250,2340],[250,2280],[250,2220],[250,2160],[250,2080],[250,2000],[250,1920],[250,1840],[250,1760],[250,1680],[250,1530],[440,1530],[630,1530],[820,1530],[1040,1530],[1250,1530],[1460,1530],[1570,1720],[1680,1830],[1790,1830],[1900,1830],[2010,1830],[2010,2020],[2010,2130],[2010,2240],[2010,2350],[2010,2460],[1850,2540]],
};
const taichung = {'tc-green':[[1700,260],[1760,460],[1620,600],[1540,840],[1320,840],[1100,800],[880,840],[700,1020],[540,1220],[540,1440],[540,1660],[540,1880],[540,2100],[600,2320],[440,2480],[280,2640],[60,2640],[-160,2640]]};
// Redistribute stations along each unchanged corridor, retaining transfer anchors.
function evenCorridor(points,anchors,loop=false){
 const source=points.map(p=>[...p]),bends={};
 const stops=loop?[...anchors,anchors[0]+points.length]:anchors;
 for(let k=1;k<stops.length;k++){
  const first=stops[k-1],last=stops[k],vertices=[source[first%source.length]];
  for(let j=first+1;j<=last;j++){const b=source[j%source.length],a=vertices.at(-1),dx=b[0]-a[0],dy=b[1]-a[1];if(dx&&dy&&Math.abs(Math.abs(dx)-Math.abs(dy))>1e-6){const d=Math.min(Math.abs(dx),Math.abs(dy));vertices.push([a[0]+Math.sign(dx)*d,a[1]+Math.sign(dy)*d]);}vertices.push(b);}
  const lengths=[0];for(let j=1;j<vertices.length;j++)lengths.push(lengths.at(-1)+Math.hypot(vertices[j][0]-vertices[j-1][0],vertices[j][1]-vertices[j-1][1]));
  const total=lengths.at(-1),count=last-first;
  for(let j=0;j<=count;j++){const distance=total*j/count;let edge=1;while(edge<lengths.length-1&&lengths[edge]<distance)edge++;const t=(distance-lengths[edge-1])/(lengths[edge]-lengths[edge-1]||1),a=vertices[edge-1],b=vertices[edge];points[(first+j)%points.length]=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];if(j<count)bends[(first+j)%points.length]=vertices.filter((_,v)=>lengths[v]>distance+1e-6&&lengths[v]<total*(j+1)/count-1e-6);}
 }
 return bends;
}
for(let i=20;i<=26;i++)kaohsiung['kh-c'][i][1]=1555;
const regionalBends={};
regionalBends['kh-r']=evenCorridor(kaohsiung['kh-r'],[0,16,24]);
regionalBends['kh-o']=evenCorridor(kaohsiung['kh-o'],[0,3,13]);
regionalBends['kh-c']=evenCorridor(kaohsiung['kh-c'],[2,13,24,32],true);
// G105–G108 form one horizontal stretch; G114–G115 remain vertical.
for(let i=3;i<=6;i++)taichung['tc-green'][i][1]=840;
taichung['tc-green'][13]=[540,2320];
taichung['tc-green'][14]=[410,2450];
for(let i=15;i<=17;i++)taichung['tc-green'][i][1]=2580;
for(let i=0;i<=3;i++)taichung['tc-green'][i]=[1540,260+i*580/3];
// More room for one-line labels without displacing them from their stations.
for(const points of Object.values(kaohsiung))for(const p of points){p[0]*=1.35;p[1]*=1.35;}
for(const bends of Object.values(regionalBends))for(const corners of Object.values(bends))for(const p of corners){p[0]*=1.35;p[1]*=1.35;}
export const mapLayouts = {
  north: {positions:north,offset:[340,650],legend:{x:3300,y:230,w:1390,h:1050},bends:{a:{0:[[1200,2080],[1050,2080]],1:[[1000,2310],[1000,2930],[600,2930]],11:[[600,2830],[1500,2830],[1500,3230]]},g:{10:[[2300,2430],[2300,2730]]},o:{6:[[1750,2130],[1750,1710]]},'o-xinzhuang':{4:[[900,2310],[900,3230]]},y:{0:[[1100,3130],[1100,4060]],3:[[1050,3300],[1300,3300],[1300,2630]],4:[[1650,2630],[1650,3200]]}}},
  kaohsiung: {positions:kaohsiung,bends:regionalBends,offset:[650,250],legend:{x:3000,y:180,w:1500,h:740}},
  taichung: {positions:taichung,offset:[450,250],legend:{x:180,y:260,w:1150,h:480}},
};
const colors={r:'#d92735','r-branch':'#e87980',g:'#00865a','g-branch':'#8fbd68',o:'#f3a20b','o-xinzhuang':'#f3a20b','o-luzhou':'#f3a20b',bl:'#0877bd',br:'#9b642d',y:'#e6be10',lb:'#31a6cb',a:'#8254a2',v:'#dc8e9b','v-green':'#dc8e9b','v-blue':'#42a8c2',k:'#a8af43',gondola:'#A8CF8A'};
export const diagramColor=line=>colors[line.id]||line.color;
export function diagramInk(color){const rgb=color.replace('#','').match(/.{2}/g)?.map(value=>parseInt(value,16));return rgb&&rgb[0]*.299+rgb[1]*.587+rgb[2]*.114>145?'#152235':'white';}
export const routeMark=id=>({r:'R',g:'G',o:'O',bl:'BL',br:'BR',y:'Y',lb:'LB',a:'A',v:'V',k:'K',gondola:'纜車','kh-r':'R','kh-o':'O','kh-c':'C','tc-green':'G'}[id]||id);
