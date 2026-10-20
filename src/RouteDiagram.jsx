import {singleRouteDisplayGroup,singleRouteCombinations,railwayColors} from './single-route-service.js';
import React, {useEffect,useRef,useState} from 'react';
import {singleRouteLayout,lightenRouteColor,isSingleRouteBranch} from './single-route-layout.js';
import { routeLayout, stationId, displayName, networks, stationsFor, stationCode, groupTerminals, mapTransfers, transferLabel } from './data.js';
import { diagramColor } from './map-layouts.js';

import {metroCodes,transferStyle,RailTransferChip} from './RailTransfers.jsx';
import {traRouteColor} from './tra-route-colors.js';
import {traStationNote} from './tra-station-notes.js';

export default function RouteDiagram({ group:sourceGroup, networkId, subtitle, game, onSelect }) {

  return <PosterRouteDiagram group={sourceGroup} networkId={networkId} subtitle={subtitle} game={game} onSelect={onSelect}/>;
}
function PosterRouteDiagram({ group:sourceGroup, networkId, subtitle, game, onSelect }) {
  const group=singleRouteDisplayGroup(networkId,sourceGroup);
  const poster=true;
  const lineColor=networkId==='tra'?traRouteColor(group.id):networkId==='hsr'?'#E48128':diagramColor(group);
  const secondaryColor=group.id==='g'?'#B7C945':lightenRouteColor(lineColor);
  const [destination,setDestination]=useState(null);
  const amenities=(lineId,raw)=>{if(raw.split('|')[0]==='機場第三航廈')return 'airport';const code=stationCode(networks.find(n=>n.id===networkId),lineId,raw);return (networkId==='north'&&['BR13','A12','A13'].includes(code))||(networkId==='kaohsiung'&&raw.split('|')[0]==='高雄國際機場')?'airport':networkId==='north'&&code==='R22A'?'hot-spring':null;};
  const layout=poster?singleRouteLayout(group,subtitle):routeLayout(group);
  const frameRef=useRef(null),[available,setAvailable]=useState(null);
  useEffect(()=>{if(!poster||!frameRef.current)return;const measure=()=>setAvailable(frameRef.current.clientWidth);measure();if(typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(measure);observer.observe(frameRef.current);return ()=>observer.disconnect();},[poster,group.id]);
  const scale=poster&&available?Math.min(1,available/layout.width):1;
  const filling = game?.status === 'running' && game.mode === 'fill';
  const network=networks.find(n=>n.id===networkId), stations=stationsFor(network), terminals=groupTerminals(network,group);
  const shortNames={'環狀線（尚未通車）':'Y','新莊分支':'新莊','蘆洲分支':'蘆洲','新北投支線':'支線','小碧潭支線':'支線','綠山線':'綠山','藍海線':'藍海','淡水信義線':'R','松山新店線':'G','中和新蘆線':'O','板南線':'BL','文湖線':'BR','環狀線・西環段':'Y','環狀線':'Y','三鶯線':'LB','桃園機場捷運':'A','淡海輕軌':'V','安坑輕軌':'K','貓空纜車':'纜車','綠線':'綠線','紅線':'紅線','橘線':'橘線','環狀輕軌':'輕軌','高雄捷運紅線':'紅線','台中捷運綠線':'綠線'};
  if(networkId==='tra')Object.assign(shortNames,metroCodes,{'縱貫線・北段':'北段','縱貫線・海線':'海線','臺中線・山線':'山線','縱貫線・南段':'南段','屏東線':'屏東','南迴線':'南迴','臺東線':'臺東','北迴線':'北迴','宜蘭線':'宜蘭','平溪線':'平溪','內灣線':'內灣','六家線':'六家','成追線':'成追','集集線':'集集','沙崙線':'沙崙','深澳線':'深澳'});
  const codePrefix=networkId==='tra'?'TR':networkId==='hsr'?'HS':stationCode(network,group.segments[0].id,group.segments[0].stops[0])?.replace(/[0-9].*/, '')||'M';
  const english={r:'Tamsui–Xinyi Line',g:'Songshan–Xindian Line',o:'Zhonghe–Xinlu Line',bl:'Bannan Line',br:'Wenhu Line',y:'Circular Line',a:'Taoyuan Airport MRT',lb:'Sanying Line',v:'Danhai LRT',k:'Ankeng LRT',gondola:'Maokong Gondola','tc-green':'Taichung Green Line','kh-r':'Kaohsiung Red Line','kh-o':'Kaohsiung Orange Line','kh-c':'Kaohsiung Circular LRT'};
  const transfersFor=node=>{const station=stations.find(s=>s.id===stationId(networkId,node.lineId,node.raw));if(!station)return [];const labels=mapTransfers(network,station,node.lineId).filter(label=>!(poster&&['o','v'].includes(group.id)&&['新莊分支','蘆洲分支','綠山線','藍海線'].includes(label)));if(poster&&group.id==='br'&&node.raw.split('|')[0]==='動物園')labels.push('環狀線');if(poster&&group.id==='a'&&node.raw.split('|')[0]==='台北車站')labels.push('淡水信義線','松山新店線','板南線');return [...new Set(labels.map(label=>label.startsWith('環狀線')?(group.id==='br'&&node.raw.split('|')[0]==='動物園'?'環狀線（尚未通車）':'環狀線'):label))];};
  const transferLegend=poster?[...new Set(layout.nodes.flatMap(transfersFor))]:[];
  const transferColor=label=>{if(networkId==='tra')return transferStyle(label)?.background||railwayColors.tra;if(label.includes('尚未通車')||label.includes('即將通車'))return '#A8ADB5';if(label==='環狀線')return diagramColor(network.lines.find(l=>l.id==='y')||{color:'#FFDF00'});if(label==='台鐵')return railwayColors.tra;if(label==='高鐵')return '#E48128';const route=network.lines.find(l=>transferLabel(l)===label||l.name===label);return route?diagramColor(route):'#748276';};
  const service=poster?singleRouteCombinations(network,sourceGroup,group,layout,destination):null;
  const selected=service?.selected,reverse=!!service?.reverse,mirror=38+1092.2;
  const junctions=new Set(poster?group.segments.slice(1).filter(s=>!isSingleRouteBranch(s.id)).map(s=>stationId(networkId,s.id,s.stops[0])):[]);
  const destinationNames=group.loop?['環狀運行']:selected?[selected.name]:[];
  const stationColor=(lineId,future,inactive)=>future?'#A8ADB5':inactive?lightenRouteColor(isSingleRouteBranch(lineId)?secondaryColor:lineColor,.72):isSingleRouteBranch(lineId)?secondaryColor:lineColor;
  const isTrackInactive=track=>poster&&!service.activeIds.has(stationId(networkId,track.lineId,track.fromRaw))||poster&&!service.activeIds.has(stationId(networkId,track.lineId,track.toRaw));
  const tracks=poster?layout.tracks:layout.paths.map((d,i)=>({d,lineId:group.segments[i].id,future:false}));
  return <div className={`map-line ${['tra','hsr'].includes(networkId)?'tra-route-poster':''} ${poster?'single-route-poster':''}`} style={{ '--line-color': lineColor }}>
    <div className="line-label">{poster?<span className="route-emblem">{codePrefix}</span>:<span className="line-swatch"/>}<strong>{group.name}{poster&&<span className="route-english">{english[group.id]||(networkId==='tra'?'Taiwan Railways':networkId==='hsr'?'Taiwan High Speed Rail':'Route Map')}</span>}</strong><small>{sourceGroup.stops.length} 站{group.planned?`＋${group.planned.length} 站${group.id==='y'?'尚未通車':'即將通車'}`:''}{group.loop ? '・環線' : ''}</small></div>
    {poster&&service.options.length>1&&<div className="strip-destination-controls" role="group" aria-label="切換終點"><span>終點組合</span>{service.options.map(option=><button type="button" key={option.id} aria-pressed={selected?.id===option.id} onClick={()=>setDestination(option.id)}>{option.name}</button>)}</div>}
    <div ref={frameRef} className={poster?'strip-fit-frame':undefined} style={poster?{height:layout.height*scale}:undefined}><div className="branch-diagram" style={{ width: layout.width, height: layout.height, ...(poster?{transform:`scale(${scale})`,transformOrigin:'top left'}:{}) }} aria-label={`${group.name}路網圖`}>
      <svg width={layout.width} height={layout.height} className="diagram-paths" aria-hidden="true"><g transform={reverse?`translate(${mirror} 0) scale(-1 1)`:undefined}>{tracks.map((track,i)=><path key={i} data-inactive-track={isTrackInactive(track)||undefined} data-line-id={track.lineId} data-future-track={track.future||undefined} d={track.d} fill="none" stroke={poster?stationColor(track.lineId,track.future,isTrackInactive(track)):lineColor} strokeWidth={poster?14:3} vectorEffect="non-scaling-stroke"/>)}</g></svg>
      {poster&&group.id==='y'&&<div className="strip-south-preview" style={{left:Math.min(...layout.nodes.filter(n=>n.future).map(n=>reverse?mirror-n.x:n.x))-22,width:Math.max(...layout.nodes.filter(n=>n.future).map(n=>n.x))-Math.min(...layout.nodes.filter(n=>n.future).map(n=>n.x))+44,top:18,height:layout.height-30}}><span>尚未通車</span></div>}
      {layout.nodes.map((node,i)=>{
        const id=stationId(networkId,node.lineId,node.raw),solved=!!game?.answers?.[id],revealed=node.future||game?.status!=='running'||filling&&solved;
        const code=stationCode(network,node.lineId,node.raw);
        const transfers=transfersFor(node);
        const interchange=(['taichung','kaohsiung'].includes(networkId)?transfers.some(label=>!['台鐵','高鐵'].includes(label)):transfers.length>0)||junctions.has(id);
        const inactive=poster&&!node.future&&!service.activeIds.has(id);
        const terminal=poster?(group.id==='y'?node.raw.split('|')[0]==='動物園'||node.raw.split('|')[0]==='新北產業園區':service.operational.has(id))||!!selected?.targets.includes(id)&&group.id!=='y'&&!interchange:terminals.has(id),amenity=poster?amenities(node.lineId,node.raw):null;
        return <div key={id} style={{left:(reverse?mirror-node.x:node.x)-38,top:node.y-8,...(poster?{'--line-color':stationColor(node.lineId,node.future,inactive)}:{})}} className={`diagram-stop ${node.inlineLabel?'branch-inline-label':''} ${node.future?'future-station':''} ${inactive?'inactive-route-station':''}`}>
          {!poster&&code&&<span className="station-code">{code}</span>}
          <button className={`station diagram-station ${solved?'solved':''} ${terminal?'terminal':''} ${interchange?'interchange':''}`} disabled={node.future||!filling||solved} onClick={()=>onSelect(id)} aria-label={`${group.name}第 ${i+1} 站${revealed?` ${displayName(node.raw,subtitle)}`:' 空格'}`}>
            <span className="station-symbol" aria-hidden="true"><span className="station-node">{poster&&interchange?<span className="strip-transfer-dot"/>:!interchange&&solved?'✓':''}</span></span><span className={`station-text ${revealed?'':'hidden-name'}`}>{revealed?(poster?<><span className="strip-station-name">{node.raw.split('|')[0]}</span>{subtitle&&node.raw.includes('|')&&<span className="strip-subtitle"> | {node.raw.split('|')[1]}</span>}</>:displayName(node.raw,subtitle)):poster?'？':code||String(i+1).padStart(2,'0')}</span>
          </button>
          {node.future&&group.id!=='y'&&<span className="strip-upcoming">即將通車</span>}
          {amenity&&<span className="strip-amenity" role="img" aria-label={amenity==='airport'?'機場':'溫泉'}>{amenity==='airport'?'✈':'♨'}</span>}
          {!['tra','hsr'].includes(networkId)&&transfers.length>0&&<span className="station-transfers" aria-label={`可轉乘：${transfers.join('、')}`}>{transfers.map(label=>{
            const route=network.lines.find(l=>transferLabel(l)===label||l.name===label);
            return <span key={label} title={label} style={{'--transfer-color':transferColor(label)}}>{poster?<><b>{shortNames[label]||label}</b>{label.includes('尚未通車')&&<em>尚未通車</em>}</>:shortNames[label]||label}</span>;
          })}</span>}
        </div>;
      })}
    </div></div>{networkId==='tra'&&game?.status!=='running'&&layout.nodes.filter(n=>traStationNote(stationId(networkId,n.lineId,n.raw))).map(n=><p className="tra-poster-service-note" key={n.raw}>{n.raw}：{traStationNote(stationId(networkId,n.lineId,n.raw))}</p>)}{['tra','hsr'].includes(networkId)&&<div className="tra-poster-transfer-list" aria-label="各站轉乘路線">{layout.nodes.filter(node=>transfersFor(node).length>0).map(node=>{const id=stationId(networkId,node.lineId,node.raw),revealed=game?.status!=='running'||filling&&game?.answers?.[id];return <div key={id}><strong>{revealed?node.raw.split('|')[0]:'未作答車站'}</strong><div>{transfersFor(node).map(label=><RailTransferChip key={label} label={label}/>)}</div></div>;})}</div>}{!['tra','hsr'].includes(networkId)&&poster&&transferLegend.length>0&&<div className="strip-transfer-legend" aria-label="轉乘路線圖例">{transferLegend.map(label=><span key={label}><b style={{background:transferColor(label)}}>{shortNames[label]||label}</b>{(shortNames[label]||label)!==label&&<span>{label}</span>}</span>)}</div>}{poster&&<div className="strip-bottom-band" style={group.id==='y'?{color:'#111'}:undefined}><span>{destinationNames.join('・')} →</span></div>}{group.loop&&<div className="loop-note">↻ 輕軌機廠與籬仔內相接</div>}
  </div>;
}
