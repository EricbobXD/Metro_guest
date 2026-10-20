import React from 'react';
import { diagramInk } from './map-layouts.js';

// Codes belong to the station itself, rather than a second floating label row.
export default function StationMark({node}) {
  const interchange=node.interchange??node.transfers.length>0;
  const lightRailOnly=node.marker.items.every(item=>/^[VKC]\d/.test(item.code));
  return <g className="atlas-station-mark" transform={`translate(${-node.marker.w/2},-26)`}>
    {interchange&&(lightRailOnly?<circle data-transfer-frame="circle" cx={node.marker.w/2} cy="26" r="26" fill="white" stroke="#111111" strokeWidth="3.5"/>:<rect data-transfer-frame="rect" width={node.marker.w} height="52" rx="8" fill="white" stroke="#111111" strokeWidth="3.5"/>)}
    {node.marker.items.map(item=>{
      const match=item.code.match(/^([A-Za-z]+)(\d.*)$/),prefix=match?.[1]||'',number=match?.[2]||item.code;
      const filled=item.terminal||prefix==='A',lightRail=/^[VKC]\d/.test(item.code);
      return <g key={item.code} className="atlas-code-chip" transform={`translate(${item.x},5)`}>
        {lightRail?<circle cx={item.w/2} cy="21" r={Math.min(21,item.w/2)} fill={filled?item.color:'white'} stroke={item.color} strokeWidth="2.5"/>:<rect width={item.w} height="42" rx="4" fill={filled?item.color:'white'} stroke={item.color} strokeWidth="2.5"/>}
        <text x={item.w/2} fill={['O','OT','Y'].includes(prefix)?'#111111':filled?diagramInk(item.color):item.color} textAnchor="middle"><tspan className="station-mark-prefix" x={item.w/2} y="14">{prefix}</tspan><tspan className="station-mark-number" x={item.w/2} y={prefix?33:28}>{number}</tspan></text>
      </g>;
    })}
  </g>;
}
