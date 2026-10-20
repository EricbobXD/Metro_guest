export const isSingleRouteBranch=lineId=>['r-branch','g-branch'].includes(lineId);
import {routeLayout} from './data.js';
export const singleRouteFrame={width:1130.2,left:38,right:1092.2};
export function lightenRouteColor(color,amount=.42){const hex=color.replace('#','');return '#'+[0,2,4].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-amount)+255*amount).toString(16).padStart(2,'0')).join('');}
export function singleRouteLayout(group,subtitle=false){
 const source=routeLayout(group),{width,left,right}=singleRouteFrame,isY=['o','v'].includes(group.id),branchAbove=['r','g'].includes(group.id),mainY=isY?150:branchAbove?135:45,mainEnd=isY?689:right;
 const rows=group.segments.map(segment=>source.nodes.filter(n=>n.lineId===segment.id).map(n=>({...n}))),paths=[],branchConnections=[];
 const main=rows[0];main.forEach((node,i)=>Object.assign(node,{x:main.length===1?left:left+(mainEnd-left)*i/(main.length-1),y:mainY}));paths.push(`M${left} ${mainY} H${mainEnd+(isY?24:0)}`);
 rows.slice(1).forEach((row,index)=>{
  const segment=group.segments[index+1],anchor=main.find(n=>n.raw.split('|')[0]===segment.stops[0].split('|')[0]);
  const y=isY?(['o-luzhou','v-green'].includes(segment.id)?45:255):branchAbove?35:255+index*210;
  const shortBranch=isSingleRouteBranch(segment.id),split=shortBranch?anchor.x:anchor.x+24,elbow=shortBranch?split:split+Math.abs(y-mainY),first=shortBranch?split:Math.min(right,elbow+36);
  row.forEach((node,i)=>Object.assign(node,{x:row.length===1?first:first+(right-first)*i/(row.length-1),y,inlineLabel:branchAbove&&row.length===1}));
  branchConnections.push({lineId:segment.id,anchorX:anchor.x,anchorY:mainY,splitX:split,elbowX:elbow,elbowY:y,firstX:first});
  paths.push(shortBranch?`M${split} ${mainY} V${y}`:`M${split} ${mainY} L${elbow} ${y} H${row.at(-1).x}`);
 });
 const planned=new Set(group.planned||[]);for(const row of rows)for(const node of row)node.future=planned.has(node.raw.split('|')[0]);
 const tracks=[];main.slice(1).forEach((node,i)=>{const a=main[i];tracks.push({d:`M${a.x} ${a.y} L${node.x} ${node.y}`,future:!!(a.future||node.future),fromRaw:a.raw,toRaw:node.raw,lineId:group.segments[0].id});});if(isY)tracks.push({d:`M${mainEnd} ${mainY} H${mainEnd+24}`,future:false,fromRaw:main.at(-1).raw,toRaw:main.at(-1).raw,lineId:group.segments[0].id});rows.slice(1).forEach((row,i)=>tracks.push({d:paths[i+1],future:false,fromRaw:group.segments[i+1].stops[0],toRaw:row.at(-1).raw,lineId:group.segments[i+1].id}));
 const nodes=rows.flat(),depth=n=>Math.max([...n.raw.split('|')[0]].length*18,subtitle&&n.raw.includes('|')?[...n.raw.split('|')[1]].length*11:0)+75;
 return {nodes,paths,tracks,branchConnections,width:width+8,height:Math.max(...nodes.map(n=>n.y+depth(n)))+16};
}
