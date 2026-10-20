import {createPortal} from 'react-dom';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildNorthMap } from './north-map-model.js';
import { northMapContents, northLegendContents } from './north-map-svg.js';

export default function NorthRelativeMap({toolbarHost}){
  const model=useMemo(()=>buildNorthMap(),[]),artwork=useMemo(()=>northMapContents(model,{includeHeader:false}),[model]);
  const overview={x:model.width/2,y:model.height/2,zoom:1};
  const center=model.byId.get('台北車站');
  const reading={x:center.x+195,y:center.y+60,zoom:4.5};
  const legend=useMemo(()=>northLegendContents(model),[model]);
  const [view,setView]=useState(reading),[expanded,setExpanded]=useState(false),[city,setCity]=useState(false);
  const svgRef=useRef(null),drag=useRef(null);
  const [legendOpen,setLegendOpen]=useState(false);
  const zoom=(factor,anchor)=>setView(old=>{
    const next=Math.max(1,Math.min(8,old.zoom*factor)),point=anchor||old;
    return {zoom:next,x:point.x+(old.x-point.x)*old.zoom/next,y:point.y+(old.y-point.y)*old.zoom/next};
  });
  function reset(){setView(overview);setCity(false);}
  function focusCity(){const center=model.byId.get('台北車站');setView({x:center.x+195,y:center.y+60,zoom:4.5});setCity(true);}
  useEffect(()=>{
    const svg=svgRef.current;
    const wheel=event=>{
      if(!event.ctrlKey&&!event.metaKey)return;
      const inverse=svg.getScreenCTM()?.inverse();if(!inverse)return;
      event.preventDefault();setCity(false);
      zoom(Math.exp(-Math.max(-80,Math.min(80,event.deltaY))*.006),new DOMPoint(event.clientX,event.clientY).matrixTransform(inverse));
    };
    svg.addEventListener('wheel',wheel,{passive:false});
    return()=>svg.removeEventListener('wheel',wheel);
  },[]);
  useEffect(()=>{
    if(!expanded)return;
    const previous=document.body.style.overflow;document.body.style.overflow='hidden';
    const escape=event=>{if(event.key==='Escape')setExpanded(false);};document.addEventListener('keydown',escape);
    return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',escape);};
  },[expanded]);
  function startDrag(event){
    if(event.button!==0)return;
    const inverse=svgRef.current.getScreenCTM()?.inverse();if(!inverse)return;
    drag.current={point:new DOMPoint(event.clientX,event.clientY).matrixTransform(inverse),inverse,x:view.x,y:view.y};
    event.currentTarget.setPointerCapture(event.pointerId);setCity(false);
  }
  function moveDrag(event){
    const current=drag.current;if(!current)return;
    const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(current.inverse);
    setView(old=>({...old,x:current.x+current.point.x-point.x,y:current.y+current.point.y-point.y}));
  }
  function keyPan(event){
    const step=240/view.zoom,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];
    if(delta){event.preventDefault();setCity(false);setView(old=>({...old,x:old.x+delta[0],y:old.y+delta[1]}));}
    else if(event.key==='Home'){event.preventDefault();reset();}
    else if(event.key==='+'||event.key==='='){event.preventDefault();zoom(1.4);}
    else if(event.key==='-'){event.preventDefault();zoom(1/1.4);}
  }
  const width=model.width/view.zoom,height=model.height/view.zoom;
  const toolbar=(<div className="atlas-toolbar"><div><strong>{model.title}</strong><span>完整站名＋副站名 · 11 個系統 · 拖曳與放大檢視</span></div>
      <div className="atlas-controls"><button aria-label="縮小路網" disabled={view.zoom<=1} onClick={()=>zoom(1/1.4)}>−</button><output aria-label="路網縮放比例">{Math.round(view.zoom*100)}%</output><button aria-label="放大路網" disabled={view.zoom>=8} onClick={()=>zoom(1.4)}>＋</button><button className="atlas-fit" onClick={reset}>全圖</button><button className="atlas-fit" aria-pressed={city} onClick={focusCity}>市中心</button><button className="atlas-fit" onClick={()=>{setView(reading);setCity(false);}}>閱讀視野</button><button className="atlas-fit" aria-expanded={legendOpen} onClick={()=>setLegendOpen(v=>!v)}>圖例</button><a className="atlas-fit coordinate-download" href={`${import.meta.env.BASE_URL}maps/north-relative.svg`} download="雙北桃園軌道路網.svg">下載 SVG</a><button className="atlas-fit" aria-label={expanded?'縮回路網':'展開路網'} aria-expanded={expanded} onClick={()=>setExpanded(old=>!old)}>{expanded?'縮回 ↙':'展開 ↗'}</button></div>
    </div>);
  return <div className={`schematic-atlas north-coordinate-atlas ${expanded?'atlas-expanded':''}`}>
    {toolbarHost&&!expanded?createPortal(toolbar,toolbarHost):toolbar}
    <div className="atlas-canvas" ><svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" role="group" aria-label="雙北＋桃園整合簡易路網圖" tabIndex="0" viewBox={`${view.x-width/2} ${view.y-height/2} ${width} ${height}`} onKeyDown={keyPan} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <title>{model.title}</title><desc>完整站名、副站名及捷運與輕軌站碼；纜車不編號。灰色短虛線為站外轉乘，線路缺口為不轉乘的交叉。</desc>
      <g dangerouslySetInnerHTML={{__html:artwork}}/>
    </svg><div className="atlas-navigation-hint">{view.zoom===1?'全圖供查看走向；放大可閱讀站名':'拖曳移動 · Ctrl＋滾輪縮放 · 閱讀視野還原'}</div></div>
    <details className="north-independent-legend" open={legendOpen} onToggle={e=>setLegendOpen(e.currentTarget.open)}><summary>路線與符號圖例<span>獨立顯示，不隨地圖縮放</span></summary><svg role="img" aria-label="路線與符號圖例" viewBox={`${model.full?3550:1940} 442 1140 1040`} xmlns="http://www.w3.org/2000/svg"><g fontFamily="Microsoft JhengHei, sans-serif" fill="#182838" dangerouslySetInnerHTML={{__html:legend}}/></svg></details>
  </div>;
}
