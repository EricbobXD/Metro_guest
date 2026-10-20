import {attachedRailGroups} from './rail-attachments.js';

// Only the atlas presentation is merged; source routes still drive practice.
export function traCorridors(groups){
  const attached=attachedRailGroups(groups),get=id=>attached.find(g=>g.id===id);
  const trim=(group,start=0,end)=>({...group,segments:group.segments.map(s=>({...s,stops:s.stops.slice(start,end)})),startTerminal:false,endTerminal:false});
  const merge=(id,name,parts)=>({id,name,segments:parts.flatMap(p=>p.segments),stops:parts.flatMap(p=>p.segments.flatMap(s=>s.stops)),attachments:parts.flatMap(p=>p.attachments||[])});
  const north={...get('tr-north'),endTerminal:false};
  const mountain=trim(get('tr-mountain'),1,-1),coast=trim(get('tr-coast'),1,-1);
  for(const group of [mountain,coast])group.displayEndpoints='竹南—彰化';
  const southern=merge('tr-south','縱貫線・南段／屏東線',[get('tr-south'),trim(get('tr-pingtung'),1)]);
  southern.startTerminal=false;
  const yilan=trim(get('tr-yilan'),0,-1);yilan.startTerminal=true;
  yilan.attachments=[...yilan.attachments,{id:'tr-suao',at:'蘇澳新',group:{id:'tr-suao',name:'往蘇澳',segments:[{id:'tr-yilan',stops:['蘇澳新','蘇澳']}],stops:['蘇澳新','蘇澳']}}];
  const east=merge('tr-yilan','東部幹線',[yilan,trim(get('tr-northlink'),1),trim(get('tr-taitung'),1)]);
  const internalNames=groups.filter(g=>['tr-north','tr-mountain','tr-coast','tr-south','tr-pingtung','tr-yilan','tr-northlink','tr-taitung'].includes(g.id)).map(g=>g.name);
  for(const group of [north,mountain,coast,southern,east])group.integratedNames=internalNames;
  const southlink=get('tr-southlink'),neiwan=get('tr-neiwan');
  const link=(label,to,replaces=[])=>({label,to,replaces});
  const inner=link('內灣／六家線','tr-neiwan',['內灣線']);
  north.connections={'八堵':[link('接東部幹線','tr-yilan')],'新竹':[inner],'北新竹':[inner],'竹南':[link('竹南分岔 → 山線／海線','tr-parallel')]};
  east.connections={'八堵':[link('接西部幹線','tr-north')],'臺東':[link('接南迴線','tr-southlink')]};
  southern.connections={'枋寮':[link('接南迴線','tr-southlink')]};
  southlink.connections={'枋寮':[link('接西部幹線','tr-south')],'臺東':[link('接東部幹線','tr-yilan')]};
  neiwan.connections={'新竹':[link('接西部幹線','tr-north',['縱貫線・北段'])],'北新竹':[link('接西部幹線','tr-north',['縱貫線・北段'])]};
  const result={north,mountain,coast,southern,east,southlink,neiwan};
  const titles={north:'北段',mountain:'山線',coast:'海線',southern:'南段／屏東線',east:'宜蘭線／北迴線／臺東線',southlink:'全線',neiwan:'全線'};
  for(const [key,group] of Object.entries(result)){group.compactTitle=titles[key];group.hideReading=true;}
  return result;
}
