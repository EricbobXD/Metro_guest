import {railBranchLayout} from './rail-branch-layout.js';
import {RailTransferChip,metroCodes} from './RailTransfers.jsx';
import {railRowHeight} from './rail-row-metrics.js';
import {jumpToRail} from './RailJump.jsx';
import React,{useEffect,useRef,useState} from 'react';
import {networks,stationsFor,stationId,displayName,mapTransfers} from './data.js';

const groupStops=group=>group.segments.flatMap(segment=>segment.stops.map(raw=>({raw,lineId:segment.id})));
export default function RailRouteDiagram({group,networkId,subtitle,game,onSelect}){
  const ref=useRef(null),[columns,setColumns]=useState(12),[width,setWidth]=useState(960);
  useEffect(()=>{
    const measure=()=>{if(ref.current?.clientWidth){setWidth(ref.current.clientWidth);setColumns(Math.max(3,Math.min(15,Math.floor(ref.current.clientWidth/80))));}};
    measure();if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(measure);observer.observe(ref.current);return ()=>observer.disconnect();
  },[]);
  const network=networks.find(n=>n.id===networkId),stations=stationsFor(network);
  const stops=groupStops(group),rows=Array.from({length:Math.ceil(stops.length/columns)},(_,i)=>stops.slice(i*columns,(i+1)*columns));
  const filling=game?.status==='running'&&game.mode==='fill';
  function detailsFor(node,attached=[]){
    const id=stationId(networkId,node.lineId,node.raw),station=stations.find(s=>s.id===id),labels=station?mapTransfers(network,station,node.lineId):[];
    const connections=group.connections?.[node.raw.split('|')[0]]||[];
    const rail=labels.filter(l=>!metroCodes[l]&&!group.integratedNames?.includes(l)&&!attached.some(a=>a.group.name===l)&&!connections.some(c=>c.replaces?.includes(l)));
    return {rail,metro:labels.filter(l=>metroCodes[l]),connections};
  }
  function stop(node,index,terminal,column,routeName=group.name,attached=[]){
    const id=stationId(networkId,node.lineId,node.raw),solved=!!game?.answers?.[id],revealed=game?.status!=='running'||filling&&solved;
    const {rail,metro,connections}=detailsFor(node,attached);
    return <div key={`${id}-${index}`} className={`rail-stop ${attached.length?'rail-junction':''}`} style={{gridColumn:column,gridRow:1}}>
      <button disabled={!filling||solved} onClick={()=>onSelect(id)} aria-label={`${routeName}第 ${index+1} 站${revealed?` ${displayName(node.raw,subtitle)}`:' 空格'}`}>
        <span className={`rail-node ${terminal?'rail-terminal':''}`} aria-hidden="true"/>
        <span className={revealed?'rail-name':'rail-name hidden-name'}>{revealed?displayName(node.raw,subtitle):String(index+1).padStart(2,'0')}</span>
      </button>
      {group.integratedNames&&index>0&&stops[index]?.lineId!==stops[index-1]?.lineId&&stops[index]?.lineId===node.lineId&&<span id={`rail-route-${node.lineId}`} className="rail-segment-start rail-anchor">{network.lines.find(l=>l.id===node.lineId)?.name}</span>}
      {revealed&&[rail,metro].map((items,j)=>items.length>0&&<div key={j} className={`rail-transfers ${j?'metro-transfers':''}`} aria-label={j?'捷運轉乘':'鐵路轉乘'}>{items.map(label=><RailTransferChip key={label} label={label} code={j?metroCodes[label]:label}/>)}</div>)}
      {revealed&&connections.length>0&&<div className="rail-cross-links">{connections.map(c=><a key={c.to} href={`#rail-route-${c.to}`} aria-label={c.label} data-fork={c.to==='tr-parallel'||undefined} onClick={e=>jumpToRail(e,c.to)}>{c.to==='tr-parallel'?<><span>竹南分岔</span><span>山線／海線 →</span></>:c.label}</a>)}</div>}
    </div>;
  }
  return <article ref={ref} id={`rail-route-${group.id}`} className="rail-route" style={{'--line-color':networkId==='tra'?'#287C98':'#C7662D','--rail-columns':columns}}>
    <h3><span className="line-swatch"/>{group.compactTitle||group.name}<span className="rail-endpoints">{group.displayEndpoints||`${stops[0].raw.split('|')[0]}—${stops.at(-1).raw.split('|')[0]}`}</span><small>{stops.length} 站{group.displayEndpoints?'（共用站另列）':''}{group.attachments?.length>0?'＋分岔路線':''}</small></h3>
    {!group.hideReading&&<p className="rail-reading">依箭頭閱讀：{rows.length>1?'首列由左至右，下一列反向接續':'由左至右'}{group.attachments?.length>0?'；分岔路線由接軌站延伸':''}</p>}
    {rows.map((row,r)=>{
      const branches=(group.attachments||[]).filter(a=>row.some(n=>n.raw.split('|')[0]===a.at)).map(a=>({...a,index:row.findIndex(n=>n.raw.split('|')[0]===a.at)}));
      const layout=railBranchLayout(branches,columns,!!(r%2));
      const content=row.map((node,i)=>{const attached=branches.filter(b=>b.at===node.raw.split('|')[0]),d=detailsFor(node,attached),index=r*columns+i;return {name:displayName(node.raw,subtitle),rail:d.rail,metro:d.metro.map(l=>metroCodes[l]),connections:d.connections,segmentStart:group.integratedNames&&index>0&&node.lineId!==stops[index-1].lineId};});
      const rowHeight=Math.max(branches.length?layout.height:0,railRowHeight(content,width/columns));
      const source=network.lines.find(l=>l.id===row[0].lineId);
      return <div className={`rail-row-shell ${branches.length?'rail-has-branches':''}`} key={r} style={{height:rowHeight}} data-reading-section={source?.name}>
        <div className={`rail-row ${r%2?'rail-reverse':''}`} style={{'--row-count':row.length,minHeight:rowHeight}} aria-label={`第 ${r+1} 列，${r%2?'由右至左':'由左至右'}`}>
          <span className="rail-row-track" aria-hidden="true"/>{r<rows.length-1&&<span className="rail-turn" style={{height:rowHeight}} aria-hidden="true">↓</span>}
          {row.length>1&&<svg className="rail-reading-arrow" style={{left:`${(r%2?columns-Math.floor((row.length-1)/2)-1:Math.floor((row.length-1)/2)+1)*100/columns}%`,transform:r%2?'translateX(-50%) rotate(180deg)':'translateX(-50%)'}} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" data-direction={r%2?'left':'right'}><path d="M4 2 L10 7 L4 12" stroke="white" strokeWidth="5" fill="none"/><path d="M4 2 L10 7 L4 12" stroke="currentColor" strokeWidth="2" fill="none"/></svg>}
          {row.map((node,i)=>stop(node,r*columns+i,(r*columns+i===0&&group.startTerminal!==false)||(r*columns+i===stops.length-1&&group.endTerminal!==false),r%2?columns-i:i+1,group.name,branches.filter(a=>a.at===node.raw.split('|')[0])))}
        </div>
        {layout.branches.map(branch=><section key={branch.id} id={`rail-route-${branch.id}`} className={`rail-attached rail-compact-branch ${branch.single?'rail-short-branch':''}`} aria-label={`${branch.group.name}，由${branch.at}分岔`}>
          <h4 style={{left:`${(branch.single?branch.anchor+.35:(branch.min+branch.max)/2)*100/columns}%`,top:branch.positions[0].y-32,transform:branch.single?'none':'translateX(-50%)'}}>{branch.group.name}</h4>
          <svg className="rail-branch-link" aria-hidden="true" width="100%" height={rowHeight} viewBox={`0 0 ${columns*80} ${rowHeight}`} preserveAspectRatio="none" data-junction={branch.at}>
            <polyline points={branch.points.map(p=>`${p.x*80},${p.y}`).join(' ')} vectorEffect="non-scaling-stroke"/>
          </svg>
          {branch.positions.map((node,i)=><div className="rail-branch-stop" key={i} style={{left:`${(node.x-.5)*100/columns}%`,top:node.y-10,width:`${100/columns}%`}}>{stop(node,node.index,!branch.connectsTo&&i===branch.positions.length-1,1,branch.group.name)}</div>)}
          {branch.connectsTo&&<a className="rail-connection" href={`#rail-route-${branch.connectsTo}`} onClick={e=>{e.preventDefault();document.getElementById(`rail-route-${branch.connectsTo}`)?.scrollIntoView({behavior:'smooth',block:'start'});}}>成功接回臺中線・山線 ↗</a>}
        </section>)}
      </div>;
    })}
  </article>;
}
