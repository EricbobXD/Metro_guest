import {stationsFor,transferOptions} from './data.js';
import {traStationNote} from './tra-station-notes.js';

export function practiceScope(network,lines){
  const all=stationsFor(network),scoped=new Map(stationsFor(network,lines).map(s=>[s.id,s]));
  const pool=all.filter(s=>scoped.has(s.id)).map(s=>({...s,raw:scoped.get(s.id).raw}));
  return {pool,transfers:pool.filter(s=>transferOptions(network,s).length>0),
    endpoints:pool.filter(s=>network.id!=='tra'||!traStationNote(s.id)),
    hasSubtitles:network.id==='north'&&pool.some(s=>s.raw.includes('|'))};
}
