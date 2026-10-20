import React,{useId,useState} from 'react';
import {networks,stationsFor,transferOptions} from './data.js';
import {diagramColor} from './map-layouts.js';
import {traRouteColor} from './tra-route-colors.js';
export const metroCodes={'淡水信義線':'R','松山新店線':'G','中和新蘆線':'O','板南線':'BL','文湖線':'BR','環狀線':'Y','桃園機場捷運':'A','三鶯線':'LB','台中捷運綠線':'G','高雄捷運紅線':'R','高雄捷運橘線':'O','環狀輕軌':'C'};
export function railTransferName(label){
  const separator=label.indexOf('・');
  if(separator>0)return `${railTransferName(label.slice(0,separator).trim())}・${label.slice(separator+1).trim()}`;
  if(label==='桃園機場捷運'||label==='台中捷運綠線')return label;
  if(label==='高雄捷運紅線')return '紅線(岡山車站-小港)';
  if(label==='高雄捷運橘線')return '橘線(哈瑪星-大寮)';
  if(label==='環狀輕軌')return '輕軌';
  return metroCodes[label]?`${metroCodes[label]} ${label}`:label;
}
export function transferStyle(label){
  const separator=label.indexOf('・');
  if(separator>0)return transferStyle(label.slice(0,separator).trim());
  const aliases={'環狀線':'y','台中捷運綠線':'tc-green','高雄捷運紅線':'kh-r','高雄捷運橘線':'kh-o'};
  const route=networks.flatMap(n=>n.lines).find(line=>line.name===label||line.id===aliases[label]);
  const color=label==='高鐵'?'#C7662D':label==='台鐵'?'#596A7B':route?route.id.startsWith('tr-')?traRouteColor(route.id):diagramColor(route):null;
  return color?{background:color,borderColor:color,color:['O','Y'].includes(metroCodes[label])?'#111':'#fff'}:undefined;
}
export function RailTransferChip({label,code}){
  const [open,setOpen]=useState(false),id=useId();
  return <span className="rail-transfer-wrap" onMouseEnter={()=>setOpen(true)} onMouseLeave={e=>{if(!e.currentTarget.contains(document.activeElement))setOpen(false);}}>
    <button type="button" className="rail-transfer-chip" aria-label={railTransferName(label)} aria-describedby={open?id:undefined} style={transferStyle(label)} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} onClick={()=>setOpen(true)} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}>{code||railTransferName(label)}</button>
    {open&&<span id={id} role="tooltip" className="rail-transfer-tooltip">{label}</span>}
  </span>;
}
export function RailTransferLegend({network,inline=false}){
  const labels=[...new Set(stationsFor(network).flatMap(station=>transferOptions(network,station)))].filter(label=>metroCodes[label]||['台鐵','高鐵'].includes(label));
  const content=<div>{labels.map(label=><div key={label}><RailTransferChip label={label}/></div>)}</div>;
  return inline?content:<details className="rail-transfer-legend"><summary>轉乘路線圖例</summary>{content}</details>;
}
