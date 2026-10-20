import {distances} from './data.js';

export function routeQuestion(endpoints,graph,random=Math.random){
  const pairs=[];
  for(const a of endpoints){const d=distances(graph,a.id);for(const b of endpoints)if(d.get(b.id)>=2)pairs.push({from:a.id,to:b.id,minimum:d.get(b.id)});}
  return pairs.length?pairs[Math.floor(random()*pairs.length)]:null;
}
export function remainingRoute(graph,from,to){
  const d=distances(graph,to),result=[];let at=from;
  while(d.get(at)>1){const next=[...graph.get(at)||[]].find(id=>d.get(id)===d.get(at)-1);if(!next)break;result.push(next);at=next;}
  return result;
}
