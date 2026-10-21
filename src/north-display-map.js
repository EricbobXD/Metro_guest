import {buildNorthMap,placeNorthLabels} from './north-map-model.js';
import {northRouteTrackPath} from './north-map-svg.js';

// Adopted display layout: reduce station spacing 14% without shrinking text or markers.
let cachedDisplayMap;
export function buildNorthDisplayMap(){
 if(cachedDisplayMap)return cachedDisplayMap;
 const factor=.86;
 const original=buildNorthMap(),model=structuredClone(original),seen=new WeakSet();
 function move(value){if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);if(typeof value.x==='number'&&typeof value.y==='number'){value.x*=factor;value.y*=factor;}if(value instanceof Map){for(const v of value.values())move(v);return;}for(const [key,v]of Object.entries(value))if(!['coordinate','marker','labels'].includes(key))move(v);}
 move(model);model.width=original.width*factor;model.height=original.height*factor;model.compactLayout=true;
 model.labels=placeNorthLabels(model);
 model.routes.forEach((r,i)=>{r.displayTrack=northRouteTrackPath(original.routes[i]);r.displayScale=factor;});
 cachedDisplayMap=model;return model;
}

