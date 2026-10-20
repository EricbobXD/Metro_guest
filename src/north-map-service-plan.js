import {expandNorthRoutes} from './north-map-stations.js';

export const northTransferOrder={
  民權西路:['O11','R13'],中山:['G14','R11'],西門:['BL11','G12'],台北車站:['BL12','R10'],
  中正紀念堂:['G10','R08'],頭前庄:['O17','Y18'],松江南京:['G15','O08'],忠孝新生:['BL14','O07'],
  東門:['R07','O06'],大坪林:['Y07','G04'],大安:['R05','BR09'],忠孝復興:['BL15','BR10'],
  南京復興:['G16','BR11'],南港展覽館:['BL23','BR24'],頂埔:['LB01','BL01'],景安:['Y11','O02'],三重:['O15','A02'],
};
export const northVerticalSystems={民權西路:'R',中山:'R',西門:'G',台北車站:'R',中正紀念堂:'R',頭前庄:'Y',松江南京:'O',忠孝新生:'O',東門:'O',大坪林:'G',大安:'BR',忠孝復興:'BR',南京復興:'BR',南港展覽館:'BR',景安:'O'};
export const northSplitNames=new Set(['紅樹林','新北產業園區','十四張']);
const aliases={V:{紅樹林:'紅樹林〔V〕'},A:{新北產業園區:'新北產業園區〔A〕'},K:{十四張:'十四張〔K〕'}};

// Display-only planned stations: the answer bank remains the active network.
export function currentNorthSourceRoutes(){
  const routes=expandNorthRoutes().map(route=>{
    const points=route.points.map(p=>({...p}));
    if(route.system==='BL'){const i=points.findIndex(p=>p.raw==='龍山寺');points.splice(i+1,0,{raw:'@轉折',x:-2.5,y:-3,control:true});for(const [name,x,y]of [['江子翠',-10.6,-4],['西門',-2.25,-2],['台北車站',-.5,0]]){const at=points.findIndex(p=>p.raw===name);points.splice(at,0,{raw:'@轉折',x,y,control:true});}const jiang=points.findIndex(p=>p.raw==='江子翠');points.splice(jiang+1,0,{raw:'@轉折',x:-9.6,y:-4,control:true});const west=points.findIndex(p=>p.raw==='西門');points.splice(west+1,0,{raw:'@轉折',x:-1.5,y:-2,control:true});}
    if(route.system==='BL'){const a=points.findIndex(p=>p.raw==='江子翠'),b=points.findIndex(p=>p.raw==='龍山寺');points.splice(a+1,b-a-1);}
    if(route.system==='BL'){const i=points.findIndex(p=>p.raw==='昆陽');points.splice(i,0,{raw:'@轉折',x:17.5,y:2,control:true});}
    if(route.system==='BR'){const i=points.findIndex(p=>p.raw==='大直');Object.assign(points[i+1],{x:9,y:12,cornerRadius:70});const j=points.findIndex(p=>p.raw==='六張犁');points.splice(j+1,2,{raw:'@轉折',x:9,y:-7.5,control:true,cornerRadius:65});for(const [name,x,y]of [['萬芳醫院',13,-11],['麟光',13,-7.5]]){const at=points.findIndex(p=>p.raw===name);points.splice(at,0,{raw:'@轉折',x,y,control:true,cornerRadius:40});}for(const point of points)if(point.control&&point.x===13&&[-11,-7.5].includes(point.y))point.cornerRadius=55;const zoo=points.find(p=>p.raw==='動物園〔BR〕');zoo.y=-11;zoo.codes=[{system:'BR',code:'BR01'},{system:'Y',code:'Y01',future:true}];}
    if(route.system==='Y'){const j=points.findIndex(p=>p.raw==='景安');points.splice(j+2,0,{raw:'@轉折',x:-10,y:-11,control:true,cornerRadius:40});for(const [i,id]of ['中和','橋和','中原','板新'].entries())Object.assign(points.find(p=>p.raw===id),i===0?{x:-6,y:-11}:{x:-10-i*.5+.01,y:-11+i*.5-.01});const i=points.findIndex(p=>p.raw==='景平');if(points[i+1]?.control)points.splice(i+1,1);}
    if(route.system==='A'){
      const a02=points.findIndex(p=>p.raw==='三重');if(points[a02+1]?.control)points.splice(a02+1,1);
      const next=points.findIndex(p=>p.raw==='機場旅館'),a=points[next-1],b=points[next];
      points.splice(next,0,{raw:'機場第三航廈',x:(a.x+b.x)/2,y:(a.y+b.y)/2,control:false,added:true,future:true,codes:[{system:'A',code:'A14'}]});
      const last=points.at(-1);
      points.push({raw:'中壢車站',x:last.x,y:last.y-2.8,control:false,added:true,future:true,extension:true,codes:[{system:'A',code:'A23'}]});
    }
    return {...route,points:points.map(p=>aliases[route.system]?.[p.raw]?{...p,sourceId:p.raw,raw:aliases[route.system][p.raw]}:p)};
  });
  routes.push({id:'Y-south',system:'Y',title:'環狀線南環段',future:true,points:[
   {raw:'大坪林',x:4,y:-13,control:false},
   ...[['寶斗厝',6,-17.2,'Y06'],['溝子口',8,-15.2,'Y05'],['馬明潭',12,-15.2,'Y04'],['文山區公所',16,-15.2,'Y03'],['政大',20,-15.2,'Y02']].map(([raw,x,y,code])=>({raw,x,y,control:false,added:true,future:true,codes:[{system:'Y',code}]}))
  ]});
  const south=routes.at(-1).points;south.push({raw:'@轉折',x:18,y:-13.2,control:true,cornerRadius:40});south.push({raw:'動物園〔BR〕',x:18,y:-11,control:false});
  return routes;
}

