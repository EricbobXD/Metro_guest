import React from 'react';
import MapAirport from './MapAirport.jsx';
import { routeMark, diagramInk } from './map-layouts.js';

const endpoints={
  'tc-green':'捷運綠線','kh-r':'紅線(岡山車站 - 小港)','kh-o':'橘線(哈瑪星 - 大寮)','kh-c':'輕軌',
  r:'淡水＝廣慈/奉天宮',g:'松山＝新店',o:'南勢角＝大橋頭',
  bl:'頂埔＝南港展覽館',br:'動物園＝南港展覽館',gondola:'動物園＝貓空',
  y:'大坪林＝新北產業園區',lb:'頂埔＝鶯桃福德',a:'台北車站＝老街溪',
  v:'紅樹林＝濱海沙崙',k:'雙城＝十四張',
};

export default function MapKey({map}){
  if(!map.legend)return null;
  const {x,y,scale=1}=map.legend,w=map.legend.w/scale,h=map.legend.h/scale;
  const groups=map.groups.filter(group=>endpoints[group.id]);
  return <g className="atlas-map-key" transform={`translate(${x},${y}) scale(${scale})`} aria-hidden="true">
    <g className="map-north-arrow" transform="translate(-430,510)">
      <circle r="63" fill="white" stroke="#172332" strokeWidth="3"/>
      <path d="M0 -50 L-22 40 L0 22 L22 40 Z" fill="#172332"/>
      <path d="M0 -50 V22 L22 40 Z" fill="white" stroke="#172332" strokeWidth="2"/>
      <text y="-85" textAnchor="middle" className="map-key-title">N</text>
    </g>
    <rect width={w} height={h} rx="12" fill="white" stroke="#D3DCE4" strokeWidth="3"/>
    <text x="48" y="72" className="map-key-title">路線圖例</text>
    <text x={w-48} y="72" textAnchor="end" className="map-key-en">ROUTE ENDPOINTS</text>
    <line x1="48" y1="106" x2={w-48} y2="106" stroke="#c6d4df" strokeWidth="2"/>
    {groups.map((group,index)=>{
      const left=48+(index%2)*(w/2),top=140+Math.floor(index/2)*126;
      return <g key={group.id} transform={`translate(${left},${top})`}>
        <line x1="0" y1="18" x2="54" y2="18" stroke={group.color} strokeWidth="10"/>
        <text x="75" y="27" className="map-key-route">{['tc-green','kh-r','kh-o','kh-c'].includes(group.id)?endpoints[group.id]:`${routeMark(group.id)} ${endpoints[group.id]}`}</text>
      </g>;
    })}
    <g transform={`translate(48,${h-210})`}>
      <rect width="28" height="36" rx="5" fill="white" stroke="#40566a" strokeWidth="2"/><text x="40" y="25" className="map-key-route">捷運</text>
      <circle cx="210" cy="18" r="18" fill="white" stroke="#78a55a" strokeWidth="2"/><text x="238" y="25" className="map-key-route">輕軌</text>
      <rect x="410" width="28" height="36" rx="5" fill="#40566a"/><text x="450" y="25" className="map-key-route">端點</text>
      <rect x="630" width="68" height="40" rx="8" fill="white" stroke="#111" strokeWidth="3.5"/><rect x="636" y="5" width="26" height="30" rx="4" fill="white" stroke="#d94d50" strokeWidth="2"/><rect x="666" y="5" width="26" height="30" rx="4" fill="white" stroke="#0877bd" strokeWidth="2"/><text x="712" y="25" className="map-key-route">轉乘</text>
      <g transform="translate(0,70)"><rect width="65" height="28" rx="4" fill="#596A7B"/><text x="32" y="21" textAnchor="middle" style={{fill:'white',fontSize:19}}>台鐵</text><rect x="100" width="65" height="28" rx="4" fill="#C7662D"/><text x="132" y="21" textAnchor="middle" style={{fill:'white',fontSize:19}}>高鐵</text><text x="215" y="23" className="map-key-route">鐵路轉乘</text><MapAirport x={460}/><text x="500" y="23" className="map-key-route">機場</text><line x1="690" y1="14" x2="760" y2="14" stroke="#727c76" strokeWidth="3" strokeDasharray="7 6"/><text x="775" y="23" className="map-key-route">站外轉乘</text></g>
    </g>
    <line x1="48" y1={h-70} x2={w-48} y2={h-70} stroke="#c6d4df" strokeWidth="2"/>
    <text x="48" y={h-30} className="map-key-note">路線顏色 · 起點＝終點</text>
  </g>;
}
