import React,{useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {traHsrLayout} from './tra-hsr-layout.js';
import {traStationNote} from './tra-station-notes.js';
import {networks,stationsFor,displayName,transferOptions} from './data.js';
import {traVerticalLayout} from './tra-vertical-layout.js';
import {RailTransferChip,RailTransferLegend,metroCodes} from './RailTransfers.jsx';
import {traRouteColor,traEdgeColor} from './tra-route-colors.js';
import {traStationSymbol} from './tra-station-symbol.js';

export default function TraOverview({subtitle,game,onSelect,toolbarHost}){
  const network=networks.find(n=>n.id==='tra'),model=useMemo(()=>traVerticalLayout(network),[network]),stations=useMemo(()=>new Map(stationsFor(network).map(s=>[s.id,s])),[network]);
  const running=game?.status==='running',filling=running&&game.mode==='fill';
  const [hsrEnabled,setShowHsr]=useState(true),showHsr=hsrEnabled&&!running,hsr=useMemo(()=>traHsrLayout(model),[model]);
  const toggle=<label className="tra-hsr-toggle"><input type="checkbox" checked={hsrEnabled} disabled={running} onChange={e=>setShowHsr(e.target.checked)}/>{running?'挑戰中隱藏高鐵資訊':'顯示高鐵'}</label>;
  return <div className="tra-corridors tra-vertical-overview">
    {toolbarHost?createPortal(toggle,toolbarHost):toggle}
    <div className="tra-vertical-heading"><h2>{showHsr?'台鐵＋高鐵路網':'台鐵全路網'}</h2><p>由北向南閱讀・南迴線連接東西部</p></div>
    {showHsr&&<p className="tra-hsr-note"><span/>高鐵　─ 共站轉乘　┄ 站外轉乘（六家 ↔ 高鐵新竹、豐富 ↔ 高鐵苗栗）</p>}
    <div className="tra-overview-legends">
    <RailTransferLegend network={network}/>
    <details className="rail-transfer-legend tra-color-legend"><summary>台鐵路線配色</summary><div>{[...network.lines,{id:'tr-suao',name:'蘇澳支線'}].map(line=><div key={line.id}><i style={{background:traRouteColor(line.id)}}/><span>{line.name}</span></div>)}</div></details>
    </div>
    <svg className="tra-vertical-svg" viewBox={`0 0 ${model.width} ${model.height}`} role="group" aria-label="台鐵直式完整連接路網圖">
      {showHsr&&<g className="tra-hsr-connections" aria-label="高鐵轉乘連接線">{hsr.connections.map(({hsr:stop,tra})=><g key={stop.name}><polyline points={`${tra.x},${tra.y} ${stop.x},${stop.y}`} fill="none" data-hsr-transfer={stop.traId} data-transfer-type={stop.type} x1={tra.x} y1={tra.y} x2={stop.x} y2={stop.y} stroke="#697b80" strokeWidth="2" strokeDasharray={stop.type==='walking'?'6 5':undefined}><title>{tra.raw} ↔ 高鐵{stop.name}：{stop.type==='walking'?'站外轉乘':'共站轉乘'}</title></polyline>{stop.type==='walking'&&<text className="tra-walking-label" x={(tra.x+stop.x)/2} y={tra.y-25} textAnchor="middle">站外轉乘</text>}</g>)}</g>}
      <g className="tra-vertical-paths" aria-hidden="true">{model.edges.map(edge=><polyline key={`${edge.a}-${edge.b}`} data-edge-from={edge.a} data-edge-to={edge.b} data-branch={edge.branch||undefined} data-route-color={traEdgeColor(edge)} points={edge.points.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={traEdgeColor(edge)} strokeWidth={edge.branch?3:4} strokeLinejoin="round"/>)}</g>
      {!running&&<g className="tra-hsinchu-shared" aria-label="新竹至北新竹：縱貫線與內灣／六家線共用；北新竹分岔往千甲">
        <line data-shared-from="北新竹" data-shared-to="新竹" x1={model.sharedHsinchu.from.x+6} y1={model.sharedHsinchu.from.y} x2={model.sharedHsinchu.to.x+6} y2={model.sharedHsinchu.to.y} stroke={traRouteColor('tr-neiwan')} strokeWidth="3"/>
        <rect x="8" y={model.sharedHsinchu.from.y+9} width="201" height="49" rx="5" fill="#f3f7f8"/>
        <text x="18" y={model.sharedHsinchu.from.y+29}>新竹—北新竹共用區間</text>
        <text className="tra-shared-detail" x="18" y={model.sharedHsinchu.from.y+49}>縱貫線＋內灣／六家線</text>
        <text className="tra-junction-direction" x={model.sharedHsinchu.from.x+30} y={model.sharedHsinchu.from.y-14}>北新竹分岔 → 千甲</text>
      </g>}
      <g className="tra-vertical-route-labels" aria-hidden="true">{model.labels.map(label=>{const route={'山線':'tr-mountain','海線':'tr-coast','內灣線':'tr-neiwan','六家線':'tr-liujia','深澳線':'tr-shenao','平溪線':'tr-pingxi','集集線':'tr-jiji','沙崙線':'tr-shalun','南迴線':'tr-southlink','成追線':'tr-chengzhui','蘇澳支線':'tr-suao'}[label.name];return <text key={label.name} x={showHsr&&label.name==='六家線'?550:label.x} y={label.y} style={route?{fill:traRouteColor(route)}:undefined}>{label.name}</text>;})}</g>
      {model.anchors.map(anchor=><g key={anchor.id} id={`rail-route-${anchor.id}`} className="rail-anchor"><rect x={anchor.node.x-12} y={anchor.node.y-28} width="24" height="56" fill="transparent" pointerEvents="none"/></g>)}
      <g id="rail-route-tr-parallel" className="rail-anchor"><rect x="50" y={model.parallel.y-20} width="220" height="40" fill="transparent" pointerEvents="none"/></g>
      <g id="rail-route-tr-suao" className="rail-anchor"><rect x={model.suao.x-10} y={model.suao.y-20} width="100" height="40" fill="transparent" pointerEvents="none"/></g>
      {model.nodes.map(node=>{
        const solved=!!game?.answers?.[node.id],revealed=game?.status!=='running'||filling&&solved,active=filling&&!solved;
        const transfers=transferOptions(network,stations.get(node.id)).filter(label=>metroCodes[label]||['台鐵','高鐵'].includes(label));
        const symbol=traStationSymbol(node,stations.get(node.id),transfers);
        const visibleTransfers=showHsr?transfers.filter(label=>label!=='高鐵'):transfers;
        const left=node.side==='left'||showHsr&&node.id==='六家',bottom=node.side==='bottom',name=displayName(node.raw,subtitle),x=left?-16:bottom?0:16,y=bottom?32:-5;
        const nodeColor=traRouteColor(node.id==='蘇澳'?'tr-suao':node.lineId);
        const choose=()=>{if(active)onSelect(node.id);};
        return <g key={node.id} transform={`translate(${node.x} ${node.y})`} className="tra-vertical-node" data-station={node.id} data-interchange={symbol.interchange||undefined} data-terminal={symbol.terminal||undefined} data-reading-section={network.lines.find(l=>l.id===node.lineId)?.name} data-reading-corridor={node.corridor} data-reading-spine={node.x===230||node.x===70?'west':node.x===850?'east':node.lineId==='tr-southlink'?'south':undefined}>
          <g role="button" tabIndex={active?0:-1} aria-disabled={!active} aria-label={revealed?`${name}，${node.corridor}`:`${node.corridor} 空格`} onClick={choose} onKeyDown={e=>{if(active&&['Enter',' '].includes(e.key)){e.preventDefault();choose();}}}>
            <circle className="tra-station-ring" r={symbol.radius} fill={symbol.interchange?'white':symbol.terminal||solved?nodeColor:'white'} stroke={symbol.interchange?'#172f34':nodeColor} strokeWidth="2"/>
            {symbol.interchange&&<circle className="tra-transfer-center" r="3" fill="#172f34"/>}
            <text className="tra-vertical-name" x={x} y={y} textAnchor={left?'end':bottom?'middle':'start'}>{revealed?name:'？'}</text>
            {revealed&&traStationNote(node.id)&&<text className="tra-service-note" x={x} y={bottom?53:18} textAnchor={bottom?'middle':left?'end':'start'}>{traStationNote(node.id)}</text>}
          </g>
          {revealed&&visibleTransfers.length>0&&<foreignObject x={left?-370:16} y="7" width="360" height="28" className="tra-vertical-transfers"><div className="tra-vertical-badges" aria-label={`${name}轉乘`}>{visibleTransfers.map(label=><RailTransferChip key={label} label={label}/>)}</div></foreignObject>}
        </g>;
      })}
      {showHsr&&<g className="tra-hsr-layer" aria-label="台灣高鐵十二站">
        <text className="tra-hsr-title" x={hsr.stops[0].x-17} y={hsr.stops[0].y-35} textAnchor="end">台灣高鐵</text>
        <path data-hsr-path="true" d={hsr.path} fill="none" stroke="white" strokeWidth="9" strokeLinejoin="round"/>
        <path d={hsr.path} fill="none" stroke="#C7662D" strokeWidth="4" strokeLinejoin="round"/>
        {hsr.stops.map((stop,i)=><g key={stop.name} data-hsr-station={stop.name} transform={`translate(${stop.x} ${stop.y})`}>
          <circle r={i===0||i===hsr.stops.length-1?10:9} fill="white" stroke={stop.traId?'#172f34':'#C7662D'} strokeWidth="2"/>
          {stop.traId&&<circle r="3" fill="#172f34"/>}
          <text className="tra-vertical-name" x={i<3?-17:17} y="-5" textAnchor={i<3?'end':'start'}>高鐵{stop.name}</text>
        </g>)}
      </g>}
    </svg>
  </div>;
}
