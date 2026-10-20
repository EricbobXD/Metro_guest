export const traRouteColors={
  'tr-north':'#2463AC','tr-mountain':'#7651A8','tr-coast':'#148785','tr-south':'#B97920','tr-pingtung':'#B95746',
  'tr-yilan':'#377EA4','tr-northlink':'#2D967F','tr-taitung':'#488B36','tr-southlink':'#8D6B30',
  'tr-neiwan':'#A46136','tr-liujia':'#CC783E','tr-pingxi':'#A6538C','tr-shenao':'#4C91A0','tr-hualienport':'#527C89',
  'tr-chengzhui':'#6B8050','tr-jiji':'#8B8534','tr-shalun':'#BD6F83','tr-suao':'#648EAB',
};
export const traRouteColor=id=>traRouteColors[id]||'#397F91';
export function traEdgeColor(edge){
  if(edge.lineIds.includes('tr-yilan')&&[edge.a,edge.b].includes('蘇澳'))return traRouteColors['tr-suao'];
  const main=edge.lineIds.find(id=>['tr-north','tr-mountain','tr-coast','tr-south','tr-pingtung','tr-yilan','tr-northlink','tr-taitung','tr-southlink'].includes(id));
  return traRouteColor(main||edge.lineIds[0]);
}
