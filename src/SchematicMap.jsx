import {createPortal} from 'react-dom';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { makeSchematic, schematicPath } from './schematic.js';
import { displayName, walkConnections } from './data.js';
import MapAirport from './MapAirport.jsx';
import MapKey from './MapKey.jsx';
import StationMark from './StationMark.jsx';
import NorthRelativeMap from './NorthRelativeMap.jsx';
import {challengeMapBounds,challengeMapFrame,constrainChallengeView} from './challenge-map-view.js';
import {northChallengeMap} from './north-challenge-map.js';

function cityView(map,frame){
  const nodes=map.nodes.filter(node=>['民權西路','西門','忠孝復興','大安','古亭','台北車站'].includes(node.id));
  const left=Math.min(...nodes.map(n=>Math.min(n.x-n.marker.w/2,n.label.x)))-100,right=Math.max(...nodes.map(n=>Math.max(n.x+n.marker.w/2,n.label.x+n.label.w)))+100;
  const top=Math.min(...nodes.map(n=>Math.min(n.y-22,n.label.y)))-100,bottom=Math.max(...nodes.map(n=>Math.max(n.y+22,n.label.y+n.label.h)))+100;
  return {zoom:Math.max(1,Math.min(6,frame.width/(right-left),frame.height/(bottom-top))),x:(left+right-map.width)/2,y:(top+bottom-map.height)/2};
}

export default function SchematicMap(props) {
  if(props.network.id==='north'&&props.game?.status!=='running')return <NorthRelativeMap toolbarHost={props.toolbarHost}/>;
  return <InteractiveSchematicMap key={props.network.id} {...props}/>;
}

function InteractiveSchematicMap({ network, subtitle, game, onSelect, toolbarHost, selectedId, routeEndpoints=[] }) {
  const map=useMemo(()=>network.id==='north'?northChallengeMap(network,subtitle):makeSchematic(network,subtitle),[network,subtitle]);
  const externalLegend=['kaohsiung','taichung'].includes(network.id);
  const running=game?.status==='running', filling=running&&game.mode==='fill';
  const masked=running&&['fill','route'].includes(game.mode);
  const bounds=useMemo(()=>challengeMapBounds(map),[map]);
  const overview={x:masked||externalLegend?bounds.x-map.width/2:0,y:masked||externalLegend?bounds.y-map.height/2:0,zoom:1};
  const [view,setView]=useState(overview),drag=useRef(null),svgRef=useRef(null);
  const [focused,setFocused]=useState(network.id==='kaohsiung'&&!running?'major':null),[expanded,setExpanded]=useState(false);
  const [aspect,setAspect]=useState(network.id==='north'?.9:network.id==='taichung'?.85:1.6);
  const legendRef=useRef(null),legendId=useId();
  const [legendOpen,setLegendOpen]=useState(network.id==='taichung');
  const frame=masked||externalLegend?challengeMapFrame(bounds,aspect):{width:Math.max(map.width,map.height*aspect),height:Math.max(map.height,map.width/aspect)};
  const majorBounds=useMemo(()=>network.id==='kaohsiung'?challengeMapBounds({nodes:map.nodes.filter(n=>n.primaryLine!=='kh-r'||!/^R(?:K|2|1[5-9])/.test(n.codes[0])),lines:[]}):bounds,[map,bounds,network.id]);
  const effectiveView=focused==='major'?{x:majorBounds.x-map.width/2,y:majorBounds.y-map.height/2,zoom:Math.max(1,Math.min(6,frame.width/majorBounds.width,frame.height/majorBounds.height))}:focused==='full'?overview:view;
  function alignMap(){if(!toolbarHost||expanded||running)return;const tools=toolbarHost.closest('.route-sticky-tools'),canvas=svgRef.current?.parentElement;if(!tools||!canvas)return;const top=Math.max(0,parseFloat(getComputedStyle(tools).top)||0);window.scrollTo({top:Math.max(0,window.scrollY+canvas.getBoundingClientRect().top-tools.getBoundingClientRect().height-top-12),behavior:'instant'});}
  useEffect(()=>{alignMap();},[toolbarHost,network.id]);
  const constrain=view=>masked?constrainChallengeView(view,bounds,frame,map):view;
  const activeGroup=map.groups.find(group=>group.id===focused);
  const activeLines=activeGroup?new Set(activeGroup.id==='v'?['v','v-green','v-blue']:activeGroup.segments.map(line=>line.id)):null;
  const isActive=node=>!activeLines||node.lines.some(line=>activeLines.has(line.id));
  function zoom(factor,anchor){if(!anchor)alignMap();const old=effectiveView,next=Math.min(6,Math.max(1,old.zoom*factor)),center={x:map.width/2+old.x,y:map.height/2+old.y},point=anchor||center;setFocused(null);setView(constrain({zoom:next,x:point.x+(center.x-point.x)*old.zoom/next-map.width/2,y:point.y+(center.y-point.y)*old.zoom/next-map.height/2}));}
  function reset(){setView(overview);setFocused(network.id==='kaohsiung'?'full':null);alignMap();}
  function focusLine(group,refit=false){
    if(focused===group.id&&!refit){reset();return;}
    const ids=new Set(group.id==='v'?['v','v-green','v-blue']:group.segments.map(line=>line.id));
    const nodes=map.nodes.filter(node=>node.lines.some(line=>ids.has(line.id)));
    const left=Math.min(...nodes.map(n=>Math.min(n.x-25,n.label.x)))-65,top=Math.min(...nodes.map(n=>Math.min(n.y-25,n.label.y)))-65;
    const right=Math.max(...nodes.map(n=>Math.max(n.x+25,n.label.x+n.label.w)))+65,bottom=Math.max(...nodes.map(n=>Math.max(n.y+50,n.label.y+n.label.h)))+65;
    const next=Math.max(1,Math.min(6,frame.width/(right-left),frame.height/(bottom-top)));
    setView({zoom:next,x:(left+right-map.width)/2,y:(top+bottom-map.height)/2});setFocused(group.id);
  }
  function focusMajor(){setFocused('major');alignMap();}
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
  },[map,aspect,filling]);
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
    drag.current={point,inverse,x:effectiveView.x,y:effectiveView.y};event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event){if(!drag.current)return;const d=drag.current,point=new DOMPoint(event.clientX,event.clientY).matrixTransform(d.inverse);setFocused(null);setView(constrain({...effectiveView,x:d.x+d.point.x-point.x,y:d.y+d.point.y-point.y}));}
  const lookup=new Map(map.nodes.map(n=>[n.id,n]));
  const joinedPairs=network.id==='kaohsiung'?[['凹子底','愛河之心'],['凱旋','前鎮之星']]:[];
  const joinedOffset=id=>joinedPairs.some(p=>p[0]===id)?-23:joinedPairs.some(p=>p[1]===id)?19:0;
  const keyPan=event=>{const amount=frame.width/effectiveView.zoom*.08,delta={ArrowLeft:[-amount,0],ArrowRight:[amount,0],ArrowUp:[0,-amount],ArrowDown:[0,amount]}[event.key];if(delta){event.preventDefault();setFocused(null);setView(constrain({...effectiveView,x:effectiveView.x+delta[0],y:effectiveView.y+delta[1]}));}else if(event.key==='Home'){event.preventDefault();reset();}else if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.4);}else if(event.key==='-'){event.preventDefault();zoom(1/1.4);}};
  const toolbar=(<div className="atlas-toolbar"><div><strong>{network.name}・簡易路網圖</strong><span>{focused==='city'?'正在查看：市中心轉乘區':'可拖曳移動，放大檢視站名與路線'}</span></div><div className="atlas-controls"><button aria-label="縮小路網" disabled={effectiveView.zoom<=1} onClick={()=>zoom(1/1.4)}>−</button><output aria-label="路網縮放比例">{Math.round(effectiveView.zoom*100)}%</output><button aria-label="放大路網" disabled={effectiveView.zoom>=6} onClick={()=>zoom(1.4)}>＋</button><button className="atlas-fit" aria-pressed={network.id==='kaohsiung'?focused==='full':undefined} onClick={reset}>全圖</button><button className="atlas-fit" aria-pressed={network.id==='kaohsiung'?focused==='major':undefined} onClick={()=>network.id==='kaohsiung'?focusMajor():focusLine(map.groups[0],true)}>{network.id==='kaohsiung'?'主要路網':'閱讀視野'}</button>{!running&&network.id!=='taichung'&&<button className="atlas-fit" aria-expanded={externalLegend?legendOpen:undefined} aria-controls={externalLegend?legendId:undefined} onClick={()=>{if(network.id==='taichung')return;if(externalLegend){setLegendOpen(v=>!v);return;}const l=map.legend;if(l)setView({x:l.x+l.w/2-map.width/2,y:l.y+l.h/2-map.height/2,zoom:Math.max(1,Math.min(6,frame.width/(l.w+120),frame.height/(l.h+120)))});}}>圖例</button>}{network.id==='north'&&<button className="atlas-fit" aria-pressed={focused==='city'} onClick={focusCity}>市中心</button>}<button className="atlas-fit" aria-label={expanded?'縮回路網':'展開路網'} aria-expanded={expanded} onClick={()=>setExpanded(old=>!old)}>{expanded?'縮回 ↙':'展開 ↗'}</button></div></div>);
  return <div className={`schematic-atlas ${network.id==='north'?'north-atlas':'regional-atlas'} ${network.id==='kaohsiung'?'kaohsiung-atlas':''} ${network.id==='taichung'?'taichung-atlas':''} ${expanded?'atlas-expanded':''}`}>
    {toolbarHost&&!expanded?createPortal(toolbar,toolbarHost):toolbar}
    <div className="atlas-canvas"><svg ref={svgRef} role="group" data-view-mode={focused||'custom'} aria-label={`${network.name}整合簡易路網圖`} tabIndex={0} viewBox={`${map.width/2+effectiveView.x-frame.width/effectiveView.zoom/2} ${!masked&&effectiveView.zoom===1&&effectiveView.y===0?0:map.height/2+effectiveView.y-frame.height/effectiveView.zoom/2} ${frame.width/effectiveView.zoom} ${frame.height/effectiveView.zoom}`} onKeyDown={keyPan} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <title>{network.name}簡易路網圖；使用加減按鈕縮放、拖曳移動。</title>
      {!externalLegend&&<rect width={map.width} height={map.height} fill="white" stroke="#cdd3df" strokeWidth="3"/>}
      {!['north','kaohsiung','taichung'].includes(network.id)&&<g className="regional-map-heading" transform="translate(70,70)"><text fontSize="42" fontWeight="700" fill="#182838">{network.name}軌道路網圖</text><text y="34" fontSize="18" letterSpacing="2" fill="#68788a">{network.english}</text></g>}
      {!running&&!externalLegend&&<MapKey map={map}/>}
      {map.lines.map(line=>{const path=line.path||schematicPath(line.vertices,line.loop);return <g key={line.key||line.id} className={`atlas-rail ${activeLines&&!activeLines.has(line.id)?'muted':''}`} data-reviewed-route={line.reviewed?line.key:undefined}>{!line.reviewed&&!(network.id==='kaohsiung'&&line.id==='kh-c')&&<path d={path} fill="none" stroke="white" strokeWidth="21" strokeLinecap="round" strokeLinejoin={line.angularRing?'miter':'round'}/>}<path d={path} fill="none" stroke={line.color} strokeWidth={line.reviewed?10:12} strokeLinecap="round" strokeLinejoin={line.angularRing?'miter':'round'}/></g>;})}
      {(network.id==='kaohsiung'?[]:walkConnections[network.id]||[]).map(([from,to])=>{const a=lookup.get(from),b=lookup.get(to);return a&&b?<line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#727c76" strokeWidth="4" strokeDasharray="9 8"/>:null;})}
      {joinedPairs.map(([id,other])=>{const n=lookup.get(id);return n&&<rect key={id} data-joined-interchange={id+' / '+other} x={n.x-49} y={n.y-30} width="98" height="60" rx="8" fill="white" stroke="#111" strokeWidth="3.5"/>;})}
      {map.nodes.map(node=>{
        const solved=!!game?.answers?.[node.id],revealed=!running||filling&&solved,interchange=node.interchange??node.transfers.length>0,disabled=running&&(!filling||solved);
        const leader={x:Math.max(node.label.x,Math.min(node.x,node.label.x+node.label.w)),y:Math.max(node.label.y,Math.min(node.y,node.label.y+node.label.h))};
        return <g key={node.id} data-station={node.id} aria-disabled={disabled} className={`atlas-stop ${node.terminal?'terminal':''} ${interchange?'interchange':''} ${solved?'solved':''} ${!isActive(node)?'muted':''}`} onClick={()=>{if(!disabled)choose(node);}}>
          <title>{node.codes.join(' / ')}{revealed?` ${displayName(node.raw,subtitle)}`:''}</title>
          {Math.hypot(leader.x-node.x,leader.y-node.y)>(network.id==='kaohsiung'?70:95)&&<line className="atlas-label-leader" x1={network.id==='kaohsiung'?node.x+(leader.x-node.x)*30/Math.hypot(leader.x-node.x,leader.y-node.y):node.x} y1={network.id==='kaohsiung'?node.y+(leader.y-node.y)*30/Math.hypot(leader.x-node.x,leader.y-node.y):node.y} x2={leader.x} y2={leader.y}/>}
          {routeEndpoints.includes(node.id)&&<g className="reference-endpoint" data-route-endpoint={node.id} transform={`translate(${node.x},${node.y})`} pointerEvents="none"><circle r="42" fill="white" fillOpacity=".8" stroke={node.id===routeEndpoints[0]?'#34764e':'#98657e'} strokeWidth="6"/><text x="0" y="-49" textAnchor="middle" fontSize="28" fontWeight="700" fill={node.id===routeEndpoints[0]?'#34764e':'#98657e'}>{node.id===routeEndpoints[0]?'起':'終'}</text></g>}
          <g role="button" aria-disabled={disabled} tabIndex={disabled?-1:0} aria-label={`${node.groupName}第 ${node.ordinal} 站${revealed?` ${displayName(node.raw,subtitle)}`:' 空格'}`} className={node.terminal?'terminal':''} onKeyDown={event=>{if(!disabled&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();choose(node);}}}>
          <g transform={`translate(${node.x},${node.y})`}>{filling&&!solved&&<circle className="challenge-station-hit" r="30" fill="transparent"/>}{filling&&selectedId===node.id&&!solved&&<circle className="challenge-station-selected" r="36" fill="#34764e18" stroke="#286542" strokeWidth="5"/>}<g transform={`translate(${joinedOffset(node.id)},0)`}><StationMark node={joinedOffset(node.id)?{...node,interchange:false}:node}/></g></g>
          </g>
          <g className="atlas-label" transform={`translate(${node.label.x},${node.label.y})`}>
            <rect width={node.label.w} height={node.label.h} fill="transparent"/>
            <text className="atlas-name" style={network.id!=='north'?{whiteSpace:'pre'}:undefined}>{revealed?node.label.rows.map((row,i)=><tspan key={i} x="0" y={27+i*34}>{row}</tspan>):<tspan x="0" y="27">＿＿＿＿</tspan>}</text>
            {revealed&&network.id==='kaohsiung'&&node.id==='高雄國際機場'&&<MapAirport x={[...node.raw.split('|')[0]].length*30+8} y={3}/>}
            {revealed&&node.label.subRows.length>0&&<text className="atlas-subtitle">{node.label.subRows.map((row,i)=><tspan key={i} x="0" y={node.label.rows.length*34+19+i*25}>{row}</tspan>)}</text>}
            {node.codeItems.filter(item=>item.external).map((item,index,items)=>{const x=items.slice(0,index).reduce((sum,item)=>sum+item.width+5,0),y=node.label.rows.length*34+node.label.subRows.length*25+2;return <g key={item.code} className="atlas-code-chip external" transform={`translate(${x*(network.id==='taichung'?1.8:1)},${y}) scale(${network.id==='taichung'?1.8:1})`}><rect width={item.width} height="20" rx="3" fill={item.code==='高鐵'?'#C7662D':'#596A7B'}/><text x={item.width/2} y="14" textAnchor="middle" fill="white">{item.code}</text></g>;})}
          </g>
        </g>;
      })}
    </svg>{!running&&network.id==='taichung'&&<div className="taichung-fixed-legend" id={legendId}><svg viewBox="0 0 360 187.2" role="img" aria-label="台中路線與符號圖例">
      <rect x="1" y="1" width="358" height="185" rx="8" fill="white" stroke="#D3DCE4"/>
      <text x="16" y="27" fontSize="16" fontWeight="700" fill="#243e48">路線圖例</text><path d="M16 39H344" stroke="#dce5da"/>
      <path d="M18 62H57" stroke={map.lines[0].color} strokeWidth="5"/><text x="70" y="67" fontSize="14" fill="#243e48">捷運綠線</text>
      <rect x="18" y="84" width="25" height="27" rx="3" fill="white" stroke={map.lines[0].color}/><text x="30.5" y="102" textAnchor="middle" fontSize="11" fill={map.lines[0].color}>110</text><text x="53" y="102" fontSize="13" fill="#243e48">捷運站</text>
      <rect x="181" y="84" width="25" height="27" rx="3" fill={map.lines[0].color}/><text x="193.5" y="102" textAnchor="middle" fontSize="11" fill="white">119</text><text x="216" y="102" fontSize="13" fill="#243e48">路線端點</text>
      <rect x="16" y="121" width="46" height="25" rx="4" fill="#596A7B"/><text x="39" y="139" textAnchor="middle" fontSize="14" fill="white">台鐵</text><text x="72" y="139" fontSize="13" fill="#243e48">台鐵轉乘</text>
      <rect x="179" y="121" width="46" height="25" rx="4" fill="#C7662D"/><text x="202" y="139" textAnchor="middle" fontSize="14" fill="white">高鐵</text><text x="235" y="139" fontSize="13" fill="#243e48">高鐵轉乘</text>
      <text x="16" y="171" fontSize="12" fill="#68788a">轉乘標示位於站名下方</text>
      </svg></div>}{externalLegend&&<div className="fixed-map-compass" aria-label="北方"><span>N</span>↑</div>}<div className="atlas-navigation-hint">拖曳移動 · Ctrl＋滾輪縮放 · Home 全圖</div></div>{!running&&network.id==='kaohsiung'&&<details ref={legendRef} id={legendId} open={legendOpen} onToggle={e=>setLegendOpen(e.currentTarget.open)} className="regional-independent-legend"><summary>路線與符號圖例</summary><svg viewBox="0 0 1250 650" aria-label={`${network.name}路線與符號圖例`}><MapKey map={{...map,legend:{x:0,y:0,w:1250,h:650,scale:1}}} showCompass={false}/></svg></details>}
  </div>;
}
