import React from 'react';
import {networks,stationsFor,transferOptions} from './data.js';
import {RailTransferChip} from './RailTransfers.jsx';
import './hsr-overview.css';

export default function HsrOverview({game,onSelect,selectedId}){
 const network=networks.find(n=>n.id==='hsr'),stations=stationsFor(network);
 const running=game?.status==='running',filling=running&&game.mode==='fill';
 return <section className="hsr-overview" aria-label="高鐵直式全路網">
  <header><span className="hsr-overview-mark">HS</span><div><h2>台灣高鐵</h2><p>南港—左營 · 全線 12 站</p></div><span className="hsr-overview-direction">北 ↓ 南</span></header>
  <ol className="hsr-overview-stations">
   {stations.map((station,index)=>{
    const solved=!!game?.answers?.[station.id],revealed=!running||solved,transfers=transferOptions(network,station);
    return <li key={station.id} data-hsr-overview-station={station.id} className={`${index===0||index===stations.length-1?'terminal ':''}${transfers.length?'interchange ':''}${selectedId===station.id?'selected ':''}${solved?'solved':''}`}>
     <span className="hsr-overview-number">{String(index+1).padStart(2,'0')}</span>
     <button className="hsr-overview-node" disabled={!filling||solved} aria-label={`高鐵第 ${index+1} 站${revealed?` ${station.raw}`:' 空格'}`} onClick={()=>onSelect(station.id)}><span/></button>
     <div className="hsr-overview-stop"><strong>{revealed?station.raw:'＿＿＿＿'}</strong>{revealed&&transfers.length>0&&<div className="hsr-overview-transfers">{transfers.map(label=><RailTransferChip key={label} label={label}/>)}</div>}</div>
    </li>;
   })}
  </ol>

 </section>;
}
