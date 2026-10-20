// Presentation-only attachments. Practice groups and the railway graph stay unchanged.
export const railAttachments={
  'tr-neiwan':[{id:'tr-liujia',at:'竹中'}],
  'tr-yilan':[{id:'tr-shenao',at:'瑞芳'},{id:'tr-pingxi',at:'三貂嶺'}],
  'tr-northlink':[{id:'tr-hualienport',at:'北埔'}],
  'tr-south':[{id:'tr-jiji',at:'二水'},{id:'tr-shalun',at:'中洲'}],
  'tr-coast':[{id:'tr-chengzhui',at:'追分',connectsTo:'tr-mountain',connectsName:'臺中線・山線'}],
};
export function attachedRailGroups(groups){
  const children=new Set(Object.values(railAttachments).flat().map(branch=>branch.id));
  return groups.filter(group=>!children.has(group.id)).map(group=>({...group,
    name:group.id==='tr-neiwan'?'內灣／六家線':group.name,
    attachments:(railAttachments[group.id]||[]).map(branch=>({...branch,group:groups.find(g=>g.id===branch.id)}))
  }));
}
