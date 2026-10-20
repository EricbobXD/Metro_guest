import React from 'react';
const sections=[
  {name:'西部',start:'tr-north',routes:['tr-north','tr-mountain','tr-coast','tr-south','tr-pingtung','tr-chengzhui','tr-jiji','tr-shalun','tr-neiwan','tr-liujia']},
  {name:'東部',start:'tr-yilan',routes:['tr-yilan','tr-northlink','tr-taitung','tr-shenao','tr-pingxi','tr-hualienport','tr-suao']},
  {name:'南迴',start:'tr-southlink',routes:['tr-southlink']},
];
export function jumpToRail(event,id){event.preventDefault();const menu=event.currentTarget.closest('details');if(menu)menu.open=false;document.getElementById(`rail-route-${id}`)?.scrollIntoView({behavior:'smooth',block:'start'});}
export default function RailJump({groups,networkId,onNavigate}){
  const jump=(event,id)=>{jumpToRail(event,id);onNavigate?.();};
  return <nav className="rail-jump" aria-label="路線快速跳轉"><strong>跳至路線</strong>{networkId==='tra'?sections.map(section=><details className="rail-jump-group" key={section.name}><summary>{section.name}</summary><div><a href={`#rail-route-${section.start}`} onClick={e=>jump(e,section.start)}>{section.name}起點</a>{section.routes.map(id=><a key={id} href={`#rail-route-${id}`} onClick={e=>jump(e,id)}>{groups.find(g=>g.id===id)?.name||'蘇澳分岔'}</a>)}</div></details>):groups.map(group=><a key={group.id} href={`#rail-route-${group.id}`} onClick={e=>jump(e,group.id)}>{group.name}</a>)}</nav>;
}
