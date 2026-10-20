import {createPortal} from 'react-dom';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { makeSchematic, schematicPath } from './schematic.js';
import { displayName, walkConnections } from './data.js';
import MapAirport from './MapAirport.jsx';
import MapKey from './MapKey.jsx';
import StationMark from './StationMark.jsx';
import NorthRelativeMap from './NorthRelativeMap.jsx';

function cityView(map,frame){
  const nodes=map.nodes.filter(node=>['民權西路','西門','忠孝復興','大安','古亭','台北車站'].includes(node.id));
  const left=Math.min(...nodes.map(n=>Math.min(n.x-n.marker.w/2,n.label.x)))-100,right=Math.max(...nodes.map(n=>Math.max(n.x+n.marker.w/2,n.label.x+n.label.w)))+100;
  const top=Math.min(...nodes.map(n=>Math.min(n.y-22,n.label.y)))-100,bottom=Math.max(...nodes.map(n=>Math.max(n.y+22,n.label.y+n.label.h)))+100;
  return {zoom:Math.max(1,Math.min(6,frame.width/(right-left),frame.height/(bottom-top))),x:(left+right-map.width)/2,y:(top+bottom-map.height)/2};
}

export default function SchematicMap(props) {
  if(props.network.id==='north'&&props.game?.status!=='running')return <NorthRelativeMap toolbarHost={props.toolbarHost}/>;
  return <InteractiveSchematicMap {...props}/>;
}

function InteractiveSchematicMap({ network, subtitle, game, onSelect, toolbarHost }) {
  const map=useMemo(()=>makeSchematic(network,subtitle),[network,subtitle]);
  const [view,setView]=useState({x:0,y:0,zoom:1}),drag=useRef(null),svgRef=useRef(null);
  const [focused,setFocused]=useState(null),[expanded,setExpanded]=useState(false);
  const [aspect,setAspect]=useState(network.id==='north'?.9:1.6);
  const frame={width:Math.max(map.width,map.height*aspect),height:Math.max(map.height,map.width/aspect)};
  const running=game?.status==='running', filling=running&&game.mode==='fill';
  const activeGroup=map.groups.find(group=>group.id===focused);
  const activeLines=activeGroup?new Set(activeGroup.id==='v'?['v','v-green','v-blue']:activeGroup.segments.map(line=>line.id)):null;
  const isActive=node=>!activeLines||node.lines.some(line=>activeLines.has(line.id));
  function zoom(factor,anchor){setView(old=>{const next=Math.min(6,Math.max(1,old.zoom*factor)),center={x:map.width/2+old.x,y:map.height/2+old.y},point=anchor||center;return {zoom:next,x:point.x+(center.x-point.x)*old.zoom/next-map.width/2,y:point.y+(center.y-point.y)*old.zoom/next-map.height/2};});}
  function reset(){setView({x:0,y:0,zoom:1});setFocused(null);}
  function focusLine(group,refit=false){
    if(focused===group.id&&!refit){reset();return;}
    const ids=new Set(group.id==='v'?['v','v-green','v-blue']:group.segments.map(line=>line.id));
    const nodes=map.nodes.filter(node=>node.lines.some(line=>ids.has(line.id)));
    const left=Math.min(...nodes.map(n=>Math.min(n.x-25,n.label.x)))-65,top=Math.min(...nodes.map(n=>Math.min(n.y-25,n.label.y)))-65;
    const right=Math.max(...nodes.map(n=>Math.max(n.x+25,n.label.x+n.label.w)))+65,bottom=Math.max(...nodes.map(n=>Math.max(n.y+50,n.label.y+n.label.h)))+65;
    const next=Math.max(1,Math.min(6,frame.width/(right-left),frame.height/(bottom-top)));
    setView({zoom:next,x:(left+right-map.width)/2,y:(top+bottom-map.height)/2});setFocused(group.id);
  }
  function focusCity(){
    setView(cityView(map,frame));setFocused('city');
  }
  useEffect(()=>{
    if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;if(width&&height)setAspect(width/height);});
    observer.observe(svgRef.current.parentElement);return ()=>observer.disconnect();
  },[]);
  useEffect(()=>{if(focused==='city')focusCity();else if(activeGroup)focusLine(activeGroup,true);},[aspect,map]);
  useEffect(()=>{
    const svg=svgRef.current;
    const wheel=event=>{if(!event.ctrlKey&&!event.metaKey)return;event.preventDefault();const inverse=svg.getScreenCTM()?.inverse();if(!inverse)return;zoom(Math.exp(-Math.max(-80,Math.min(80,event.deltaY))*.006),new DOMPoint(event.clientX,event.clientY).matrixTransform(inverse));};
    svg.addEventListener('wheel',wheel,{passive:false});return ()=>svg.removeEventListener('wheel',wheel);
  },[map]);
  useEffect(()=>{
    if(!expanded)return;
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const escape=event=>{if(event.key==='Escape')setExpanded(false);};document.addEventListener('keydown',escape);
    return ()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',escape);};
  },[expanded]);
  function choose(node){if(filling&&!game.answers?.[node.id])onSelect(node.id);}
  function startDrag(event){
    if(event.button!==0||event.target.closest('[data-station]'))return;
    const inverse=svgRef.current.getScreenCTM()?.inverse();if(!inverse)return;
    const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(inverse);
    drag.current={point,inverse,x:view.x,y:view.y};event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event){if(!drag.current)return;const d=drag.current,point=new DOMPoint(event.clientX,event.clientY).matrixTransform(d.inverse);setView(old=>({...old,x:d.x+d.point.x-point.x,y:d.y+d.point.y-point.y}));}
  const lookup=new Map(map.nodes.map(n=>[n.id,n]));
  const keyPan=event=>{const amount=frame.width/view.zoom*.08,delta={ArrowLeft:[-amount,0],ArrowRight:[amount,0],ArrowUp:[0,-amount],ArrowDown:[0,amount]}[event.key];if(delta){event.preventDefault();setView(old=>({...old,x:old.x+delta[0],y:old.y+delta[1]}));}else if(event.key==='Home'){event.preventDefault();reset();}else if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.4);}else if(event.key==='-'){event.preventDefault();zoom(1/1.4);}};
  const toolbar=(<div className="atlas-toolbar"><div><strong>{network.name}・簡易路網圖</strong><span>{focused==='city'?'正在查看：市中心轉乘區':'可拖曳移動，放大檢視站名與路線'}</span></div><div className="atlas-controls"><button aria-label="縮小路網" disabled={view.zoom<=1} onClick={()=>zoom(1/1.4)}>−</button><output aria-label="路網縮放比例">{Math.round(view.zoom*100)}%</output><button aria-label="放大路網" disabled={view.zoom>=6} onClick={()=>zoom(1.4)}>＋</button><button className="atlas-fit" onClick={reset}>全圖</button><button className="atlas-fit" onClick={()=>focusLine(map.groups[0],true)}>閱讀視野</button><button className="atlas-fit" onClick={()=>{const l=map.legend;if(l)setView({x:l.x+l.w/2-map.width/2,y:l.y+l.h/2-map.height/2,zoom:Math.max(1,Math.min(6,frame.width/(l.w+120),frame.height/(l.h+120)))});}}>圖例</button>{network.id==='north'&&<button className="atlas-fit" aria-pressed={focused==='city'} onClick={focusCity}>市中心</button>}<button className="atlas-fit" aria-label={expanded?'縮回路網':'展開路網'} aria-expanded={expanded} onClick={()=>setExpanded(old=>!old)}>{expanded?'縮回 ↙':'展開 ↗'}</button></div></div>);
  return <div className={`schematic-atlas ${network.id==='north'?'north-atlas':'regional-atlas'} ${expanded?'atlas-expanded':''}`}>
    {toolbarHost&&!expanded?createPortal(toolbar,toolbarHost):toolbar}
    <div className="atlas-canvas"><svg ref={svgRef} role="group" aria-label={`${network.name}整合簡易路網圖`} tabIndex={0} viewBox={`${map.width/2+view.x-frame.width/view.zoom/2} ${map.height/2+view.y-frame.height/view.zoom/2} ${frame.width/view.zoom} ${frame.height/view.zoom}`} onKeyDown={keyPan} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <title>{network.name}簡易路網圖；使用加減按鈕縮放、拖曳移動。</title>
      <rect width={map.width} height={map.height} fill="white" stroke="#cdd3df" strokeWidth="3"/>
      {network.id!=='north'&&<g className="regional-map-heading" transform="translate(70,70)"><text fontSize="42" fontWeight="700" fill="#182838">{network.name}軌道路網圖</text><text y="34" fontSize="18" letterSpacing="2" fill="#68788a">{network.english}</text></g>}
      <MapKey map={map}/>
      {map.lines.map(line=>{const path=schematicPath(line.vertices,line.loop);return <g key={line.id} className={`atlas-rail ${activeLines&&!activeLines.has(line.id)?'muted':''}`}><path d={path} fill="none" stroke="white" strokeWidth="21" strokeLinecap="round" strokeLinejoin="round"/><path d={path} fill="none" stroke={line.color} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/></g>;})}
      {(walkConnections[network.id]||[]).map(([from,to])=>{const a=lookup.get(from),b=lookup.get(to);return a&&b?<line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#727c76" strokeWidth="4" strokeDasharray="9 8"/>:null;})}
      {map.nodes.map(node=>{
        const solved=!!game?.answers?.[node.id],revealed=!running||filling&&solved,interchange=node.interchange??node.transfers.length>0,disabled=running&&(!filling||solved);
        const leader={x:Math.max(node.label.x,Math.min(node.x,node.label.x+node.label.w)),y:Math.max(node.label.y,Math.min(node.y,node.label.y+node.label.h))};
        return <g key={node.id} data-station={node.id} aria-disabled={disabled} className={`atlas-stop ${node.terminal?'terminal':''} ${interchange?'interchange':''} ${solved?'solved':''} ${!isActive(node)?'muted':''}`} onClick={()=>{if(!disabled)choose(node);}}>
          <title>{node.codes.join(' / ')}{revealed?` ${displayName(node.raw,subtitle)}`:''}</title>
          {Math.hypot(leader.x-node.x,leader.y-node.y)>95&&<line className="atlas-label-leader" x1={node.x} y1={node.y} x2={leader.x} y2={leader.y}/>}
          <g role="button" aria-disabled={disabled} tabIndex={disabled?-1:0} aria-label={`${node.groupName}第 ${node.ordinal} 站${revealed?` ${displayName(node.raw,subtitle)}`:' 空格'}`} className={node.terminal?'terminal':''} onKeyDown={event=>{if(!disabled&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();choose(node);}}}>
          <g transform={`translate(${node.x},${node.y})`}><StationMark node={node}/></g>
          </g>
          <g className="atlas-label" transform={`translate(${node.label.x},${node.label.y})`}>
            <rect width={node.label.w} height={node.label.h} fill="transparent"/>
            <text className="atlas-name" style={network.id!=='north'?{whiteSpace:'pre'}:undefined}>{revealed?node.label.rows.map((row,i)=><tspan key={i} x="0" y={27+i*34}>{row}</tspan>):<tspan x="0" y="27">＿＿＿＿</tspan>}</text>
            {revealed&&network.id==='kaohsiung'&&node.id==='高雄國際機場'&&<MapAirport x={[...node.raw.split('|')[0]].length*30+8} y={3}/>}
            {revealed&&node.label.subRows.length>0&&<text className="atlas-subtitle">{node.label.subRows.map((row,i)=><tspan key={i} x="0" y={node.label.rows.length*34+19+i*25}>{row}</tspan>)}</text>}
            {node.codeItems.filter(item=>item.external).map((item,index,items)=>{const x=items.slice(0,index).reduce((sum,item)=>sum+item.width+5,0),y=node.label.rows.length*34+node.label.subRows.length*25+2;return <g key={item.code} className="atlas-code-chip external" transform={`translate(${x},${y})`}><rect width={item.width} height="20" rx="3" fill={item.code==='高鐵'?'#C7662D':'#596A7B'}/><text x={item.width/2} y="14" textAnchor="middle" fill="white">{item.code}</text></g>;})}
          </g>
        </g>;
      })}
    </svg><div className="atlas-navigation-hint">拖曳移動 · Ctrl＋滾輪縮放 · Home 全圖</div></div>
    {network.id!=='north'&&<div className="atlas-attribution"><p>{network.id==='taichung'?'參考自臺中捷運綠線路線圖（臺中捷運股份有限公司）':'參考自高雄捷運及輕軌路線圖（高雄捷運股份有限公司）'}</p><div><strong>非官方版本</strong><span>依提供之路線骨架繪製・示意不按地理比例</span></div></div>}
    {network.id==='north'&&<div className="atlas-attribution"><p>參考自臺北捷運官方路網圖（臺北大眾捷運股份有限公司）</p><div><strong>非官方版本</strong><span>站名、編號及連線可能有誤，僅供版面參考，不適合用於乘車導航。</span></div></div>}
  </div>;
}
