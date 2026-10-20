import {traViewScopes,traScopeForRoute} from './tra-view-scope.js';
import HsrOverview from './HsrOverview.jsx';
import RailJump from './RailJump.jsx';
import TraOverview from './TraOverview.jsx';
import SchematicMap from './SchematicMap.jsx';
import RouteDiagram from './RouteDiagram.jsx';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {practiceScope} from './practice-scope.js';
import {routeQuestion,remainingRoute} from './practice-session.js';
import PracticeReview from './PracticeReview.jsx';
import { networks, stationsFor, stationId, normalize, displayName, buildGraph, distances, validNext, transferOptions, transferLabel, routeGroups } from './data.js';

const modes = [
  { id: 'fill', name: '全圖限時填空', text: '記得每一站，也記得它的位置。', icon: 'grid' },
  { id: 'route', name: '最少站數挑戰', text: '從起點出發，找到最短的路。', icon: 'route' },
  { id: 'transfer', name: '轉乘資訊挑戰', text: '下一段旅程，可以往哪裡？', icon: 'switch' },
];
function Icon({ name, size = 20 }) {
  const paths = {
    train: <><rect x="5" y="3" width="14" height="16" rx="4"/><path d="M5 11h14M8 19l-2 3m10-3 2 3M9 15h.01M15 15h.01M12 3v8"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    route: <><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M5 7v8a4 4 0 0 0 4 4h8M9 5h6a4 4 0 0 1 4 4v4"/></>,
    switch: <path d="M4 7h16l-4-4m4 4-4 4M20 17H4l4-4m-4 4 4 4"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <path d="m5 12 4 4 10-10"/>,
    book: <path d="M12 5v16M12 5C9 3 5 3 3 4v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-2-1-6-1-9 1Z"/>,
    reset: <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>,
    flag: <path d="M5 22V3c5-4 9 4 14 0v11c-5 4-9-4-14 0"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.train}</svg>;
}
const timeText = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
const random = items => items[Math.floor(Math.random() * items.length)];
function readRecords() { try { const data = JSON.parse(localStorage.getItem('rail-sprint-records') || '[]'); return Array.isArray(data) ? data.filter(r=>r&&typeof r==='object') : []; } catch { return []; } }
function RailArt() {
  return <svg className="rail-art" viewBox="0 0 530 230" fill="none" aria-hidden="true"><g strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"><path d="M15 163h104c40 0 40-88 81-88h121c35 0 35 88 75 88h120" stroke="#9fc3b5"/><path d="M66 220V141c0-29 34-49 64-49h49c35 0 49 62 81 62h204" stroke="#e9b77c"/><path d="M164 8v38c0 29 36 29 36 59v81c0 18 19 29 40 29h161" stroke="#8db1cc"/></g>{[[66,163],[164,75],[200,92],[260,154],[361,109],[396,163],[200,183],[321,75],[464,154]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===2||i===5?9:6} fill="#f0f3eb" stroke="#537a6b" strokeWidth="2.5"/>)}<g transform="translate(292 121) rotate(-8)"><rect width="67" height="65" rx="13" fill="#21836e"/><rect x="17" y="11" width="34" height="34" rx="7" stroke="white" strokeWidth="2.5"/><path d="M17 29h34M25 45l-4 7m22-7 4 7" stroke="white" strokeWidth="2.5"/><circle cx="26" cy="37" r="2" fill="white"/><circle cx="42" cy="37" r="2" fill="white"/></g><text x="393" y="142" fill="#648173" fontSize="10" fontFamily="monospace" letterSpacing="2">NEXT STATION</text></svg>;
}
export default function App() {
  const [page,setPage]=useState(()=>window.location.hash==='#routes'?'routes':'practice');
  function navigatePage(next){if(game?.status==='running'&&next!=='practice')return;setPage(next);if(window.innerWidth<900)setMenuOpen(false);window.history.pushState(null,'',next==='routes'?'#routes':'#practice');}
  useEffect(()=>{const sync=()=>setPage(window.location.hash==='#routes'?'routes':'practice');window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync);};},[]);
  const [networkId,setNetworkId]=useState('north'), [mode,setMode]=useState('fill'), [lineFilter,setLineFilter]=useState('all');
  const [duration,setDuration]=useState(600);
  const durationOptions=networkId==='hsr'?[30,60]:[600,1500,1800];
  const [subtitle,setSubtitle]=useState(false);
  const [game,setGame]=useState(null), [answer,setAnswer]=useState(''), [target,setTarget]=useState(null), [feedback,setFeedback]=useState(null);
  const [seconds,setSeconds]=useState(60), [checked,setChecked]=useState([]), [records,setRecords]=useState(readRecords);
  const [mapToolbarHost,setMapToolbarHost]=useState(null);
  const [readingSection,setReadingSection]=useState('');
  const [traViewScope,setTraViewScope]=useState('all');
  const [menuOpen,setMenuOpen]=useState(()=>window.innerWidth>=900);
  useEffect(()=>{if(!menuOpen)return;const close=e=>{if(e.key==='Escape'){setMenuOpen(false);document.querySelector('.menu-toggle')?.focus();}};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[menuOpen]);
  const [settingsOpen,setSettingsOpen]=useState(true),[retryIds,setRetryIds]=useState(null);
  useEffect(()=>{
    if(page!=='routes'||networkId!=='tra'||traViewScope!=='all'){setReadingSection('');return;}
    let frame;
    const update=()=>{frame=null;
      const threshold=(document.querySelector('.route-sticky-tools')?.getBoundingClientRect().bottom||0)+18;
      const rows=[...document.querySelectorAll('.tra-corridors [data-reading-section]')];
      if(document.querySelector('.tra-vertical-svg')){
        const visible=rows.filter(el=>el.getBoundingClientRect().bottom>threshold&&el.getBoundingClientRect().top<window.innerHeight);
        const sections=['west','east','south'].map(spine=>visible.find(el=>el.dataset.readingSpine===spine)).filter(Boolean).map(el=>{const name=el.dataset.readingSection.replace('縱貫線・','').replace('臺中線・','');return el.dataset.readingSpine==='south'?'南迴線':`${el.dataset.readingCorridor}／${name}`;});
        setReadingSection(sections.join('・')||'西部幹線／北段');return;
      }
      const row=rows.find(el=>el.getBoundingClientRect().bottom>threshold&&el.getBoundingClientRect().top<window.innerHeight);
      const corridor=row?.dataset.readingCorridor||row?.closest('.tra-corridor')?.getAttribute('aria-label');
      const section=row?.closest('.tra-parallel')?'山線／海線':(row?.dataset.readingSection||'北段').replace('縱貫線・','').replace('臺中線・','');
      setReadingSection(row?`${corridor}／${section}`:'西部幹線／北段');
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    update();window.addEventListener('scroll',schedule,{passive:true,capture:true});window.addEventListener('resize',schedule);
    return()=>{window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);if(frame)cancelAnimationFrame(frame);};
  },[page,networkId,traViewScope]);
  const inputRef=useRef(null), practiceRef=useRef(null), finishGuard=useRef(false);
  const network=networks.find(n=>n.id===networkId), allStations=stationsFor(network);
  const groups=routeGroups(network), selectedGroups=lineFilter==='all'?groups:groups.filter(l=>l.id===lineFilter);
  const displayGroups=selectedGroups;
  const selectedLines=selectedGroups.flatMap(l=>l.segments),baseScope=practiceScope(network,selectedLines);
  const scope={...baseScope,pool:retryIds&&mode==='fill'?baseScope.pool.filter(s=>retryIds.includes(s.id)):baseScope.pool,transfers:retryIds&&mode==='transfer'?baseScope.transfers.filter(s=>retryIds.includes(s.id)):baseScope.transfers},pool=scope.pool;
  useEffect(()=>{if(!scope.hasSubtitles)setSubtitle(false);},[networkId,lineFilter,scope.hasSubtitles]);
  const running=game?.status==='running', finished=game?.status==='finished', graph=buildGraph(network);
  const routeAvailable=useMemo(()=>mode!=='route'||!!routeQuestion(scope.endpoints,graph,()=>0),[networkId,lineFilter,mode]);
  const canStart=mode==='transfer'?scope.transfers.length>0:mode==='route'?routeAvailable:true;
  const coordinateOverview=networkId==='north'&&lineFilter==='all'&&!running;
  const findStation=id=>allStations.find(s=>s.id===id);
  const stationName=id=>displayName(findStation(id)?.raw||id,subtitle);
  const answersCount=Object.keys(game?.answers||{}).length;
  const progress=game?.mode==='fill'?Math.round(answersCount/pool.length*100):game?.mode==='route'?(game.reason==='demonstration'?0:game.reason==='complete'?100:Math.round(Math.max(0,game.path.length-1)/Math.max(1,game.minimum-1)*100)):Math.round((game?.correct||0)/Math.max(1,game?.attempts||0)*100);
  const best=records.filter(r=>r.network===networkId&&r.mode===mode&&r.scope===lineFilter&&r.subtitle===subtitle&&r.duration===duration&&!r.review&&(r.mode!=='route'||r.total>=2)).reduce((a,r)=>Math.max(a,Math.round(r.score/Math.max(1,r.total)*100)),0);
  function clearGame(){setGame(null);setAnswer('');setChecked([]);setTarget(null);setFeedback(null);setRetryIds(null);}
  function changeNetwork(id){setTraViewScope('all');setDuration(previous=>(id==='hsr'?[30,60]:[600,1500,1800]).includes(previous)?previous:(id==='hsr'?60:600));setNetworkId(id);setLineFilter('all');clearGame();if(id==='hsr'){setMode('fill');setSubtitle(false);}else if(['taichung','kaohsiung'].includes(id)){setSubtitle(false);if(id==='taichung'&&mode==='route')setMode('fill');}}
  function complete(next,reason){
    if(finishGuard.current)return;finishGuard.current=true;
    setGame({...next,status:'finished',reason});setTarget(null);
    const elapsed=Math.min(duration,Math.max(0,Math.ceil((Date.now()-next.started)/1000)));
    setSeconds(Math.max(0,duration-elapsed));
    const result={review:!!next.reviewIds,network:networkId,scope:lineFilter,subtitle,duration,mode:next.mode,date:new Date().toISOString(),score:next.mode==='fill'?Object.keys(next.answers).length:next.mode==='route'?(reason==='complete'?next.minimum:0):next.correct,total:next.mode==='fill'?pool.length:next.mode==='route'?next.minimum:next.attempts,reason,elapsed};
    setRecords(previous=>{const updated=[result,...previous].slice(0,100);try{localStorage.setItem('rail-sprint-records',JSON.stringify(updated));}catch{/* Storage is optional. */}return updated;});
  }
  useEffect(()=>{
    if(!running)return;
    const tick=()=>{const left=Math.max(0,Math.ceil((game.deadline-Date.now())/1000));setSeconds(left);if(!left)complete(game,'timeout');};
    tick();const interval=setInterval(tick,250);return()=>clearInterval(interval);
  },[game]);
  function question(previousId){return random(scope.transfers.filter(s=>s.id!==previousId))||scope.transfers[0];}
  function begin(reviewIds=null){
    if(!Array.isArray(reviewIds))reviewIds=null;
    if(!canStart)return;
    setRetryIds(reviewIds);setSettingsOpen(false);
    finishGuard.current=false;setFeedback(null);setAnswer('');setChecked([]);setTarget(null);setSeconds(duration);
    let next={mode,status:'running',started:Date.now(),deadline:Date.now()+duration*1000,answers:{},mistakes:0,correct:0,attempts:0,errors:[],reviewIds};
    if(mode==='route'){
      const q=reviewIds&&game?.mode==='route'?{from:game.from,to:game.to,minimum:game.minimum}:routeQuestion(scope.endpoints,graph);
      if(!q)return setFeedback({type:'error',text:'此範圍無法產生含中間站的題目，請切換範圍。'});
      next={...next,...q,path:[q.from]};
    }
    if(mode==='transfer'){const q=random(reviewIds?baseScope.transfers.filter(s=>reviewIds.includes(s.id)):baseScope.transfers);if(!q)return setFeedback({type:'error',text:'此範圍沒有可出題的轉乘站，請選其他路線。'});next.question=q.id;}
    setGame(next);setTimeout(()=>{practiceRef.current?.scrollIntoView?.({block:'start'});inputRef.current?.focus();},0);
  }
  function submit(event){
    event.preventDefault();if(!running||!answer.trim())return;
    if(Date.now()>=game.deadline){complete(game,'timeout');return;}
    const match=s=>normalize(displayName(s.raw,subtitle))===normalize(answer);
    if(mode==='fill'){
      const found=target?pool.find(s=>s.id===target&&match(s)):pool.find(s=>match(s)&&!game.answers[s.id])||pool.find(match);
      if(!found){setFeedback({type:'error',text:target?'還不對，再想想這個位置的站名。':'找不到這個答案，請確認站名與副站名。'});setGame({...game,mistakes:game.mistakes+1,errors:[...(game.errors||[]),{id:target,input:answer,expected:target?stationName(target):null,label:target?'指定位置':'自由填答'}]});return;}
      if(game.answers[found.id])return setFeedback({type:'error',text:'這一站已經填過了，試試下一站。'});
      const next={...game,answers:{...game.answers,[found.id]:true}};
      setAnswer('');setTarget(null);setFeedback({type:'success',text:`答對了！${displayName(found.raw,subtitle)}`});
      if(Object.keys(next.answers).length===pool.length)complete(next,'complete');else setGame(next);
    }else if(mode==='route'){
      const distance=distances(graph,game.to);
      const found=allStations.find(s=>match(s)&&s.id!==game.to&&validNext(graph,distance,game.path.at(-1),s.id));
      if(!found){const ids=[...graph.get(game.path.at(-1))||[]].filter(id=>id!==game.to&&validNext(graph,distance,game.path.at(-1),id));setFeedback({type:'error',text:'請依序填入最短路線的下一個中間站；起點和終點不必填寫。'});setGame({...game,mistakes:game.mistakes+1,errors:[...(game.errors||[]),{ids,input:answer,expected:ids.map(stationName).join('／'),label:'下一個中間站'}]});return;}
      const next={...game,path:[...game.path,found.id]};setAnswer('');setFeedback({type:'success',text:'方向正確，繼續前進！'});
      if(distance.get(found.id)===1)complete({...next,path:[...next.path,game.to]},'complete');else setGame(next);
    }
    inputRef.current?.focus();
  }
  function checkTransfer(event){event.preventDefault();if(!running||game.review)return;if(Date.now()>=game.deadline){complete(game,'timeout');return;}const expected=transferOptions(network,findStation(game.question));const correct=expected.length===checked.length&&expected.every(label=>checked.includes(label));setGame({...game,attempts:game.attempts+1,correct:game.correct+Number(correct),review:true,errors:correct?game.errors:[...(game.errors||[]),{id:game.question,label:stationName(game.question),input:checked.join('、'),expected:expected.join('、')}]});setFeedback({type:correct?'success':'error',text:correct?'全部答對！準備前往下一站。':`正確答案：${expected.join('、')}`});}
  function nextTransfer(event){event.preventDefault();if(!running)return;if(Date.now()>=game.deadline){complete(game,'timeout');return;}const q=question(game.question);if(!q)return;setGame({...game,question:q.id,review:false});setChecked([]);setFeedback(null);}
  const reviewErrors=game?.errors||[];
  const reviewMissing=finished?[...new Set([...(mode==='fill'?pool.filter(s=>!game.answers[s.id]).map(s=>s.id):mode==='route'?remainingRoute(graph,game.path.at(-1),game.to):!game.review?[game.question]:[]),...reviewErrors.flatMap(e=>e.ids||e.id?[...(e.ids||[]),...(e.id?[e.id]:[])]:[])])].map(id=>({id,name:stationName(id)})):[];
  const summaryText=`${network.name}・${allStations.length} 站｜${lineFilter==='all'?'全路網':selectedGroups[0]?.name}｜${modes.find(m=>m.id===mode).name}｜${mode==='transfer'?`${scope.transfers.length} 個出題站`:mode==='fill'?`${pool.length} 個填空站`:'系統隨機出題'}｜${duration<60?`${duration} 秒`:`${duration/60} 分鐘`}${retryIds?'｜未熟悉項目複習':''}`;
  const mapGame=game?.reviewIds&&mode==='fill'?{...game,answers:{...Object.fromEntries(baseScope.pool.filter(s=>!game.reviewIds.includes(s.id)).map(s=>[s.id,true])),...game.answers}}:game;
  const choices=[...new Set([...(networkId==='hsr'?[]:network.lines.map(transferLabel)),...allStations.flatMap(s=>transferOptions(network,s))])].sort((a,b)=>a.localeCompare(b,'zh-TW'));
  const mapFirstChallenge=running&&['fill','route'].includes(mode)&&page==='practice';
  const referenceAll=running&&mode==='route';
  useEffect(()=>{if(running&&page!=='practice')navigatePage('practice');},[running,page]);
  const mapDisplay=(networkId==='hsr'&&(lineFilter==='all'||referenceAll)?<HsrOverview game={mapGame} selectedId={target} onSelect={id=>{setTarget(id);setAnswer("");inputRef.current?.focus();}}/>:networkId==="tra"&&(page==='routes'||lineFilter==="all"||referenceAll)?<TraOverview key={!running&&page==='routes'?traViewScope:'practice'} scope={!running&&page==='routes'?traViewScope:'all'} onScopeChange={setTraViewScope} routeEndpoints={referenceAll?[game.from,game.to]:[]} toolbarHost={page==='routes'?mapToolbarHost:null} groups={groups} subtitle={subtitle} game={mapGame} onSelect={id=>{setTarget(id);setAnswer("");navigatePage("practice");requestAnimationFrame(()=>inputRef.current?.focus());}}/>:(lineFilter==="all"||referenceAll)&&!['tra','hsr'].includes(networkId)?<SchematicMap routeEndpoints={referenceAll?[game.from,game.to]:[]} key={networkId} selectedId={target} toolbarHost={page==='routes'?mapToolbarHost:null} network={network} subtitle={subtitle} game={mapGame} onSelect={id=>{setTarget(id);setAnswer("");navigatePage("practice");requestAnimationFrame(()=>inputRef.current?.focus());}}/>:displayGroups.map(group=><RouteDiagram key={group.id} group={group} networkId={networkId} subtitle={subtitle} game={mapGame} onSelect={id=>{setTarget(id);setAnswer("");navigatePage("practice");requestAnimationFrame(()=>{inputRef.current?.focus();practiceRef.current?.scrollIntoView({behavior:"smooth",block:"start"});});}}/>));
  const lineProgress=selectedGroups.map(group=>{const stations=stationsFor(network,group.segments).filter(s=>pool.some(p=>p.id===s.id));return {...group,total:stations.length,solved:stations.filter(s=>game?.answers?.[s.id]).length};}).filter(line=>line.total);
  return <div className={`app ${menuOpen&&!running?'menu-visible':''} ${!game?'setup-screen':''} ${mapFirstChallenge?'map-first-challenge':''} ${page==='routes'?'routes-page':''} ${running?'focus-practice':''}`}>
    <header className="site-header">{running?<div className="brand"><span className="brand-icon"><Icon name="train" size={23}/></span><span>站站練習<small>RAIL SPRINT</small></span></div>:<button className="brand menu-toggle" aria-label="開啟或收合選單" aria-expanded={menuOpen} aria-controls="site-menu" onClick={()=>setMenuOpen(v=>!v)}><span className="brand-icon"><Icon name="train" size={23}/></span><span>站站練習<small>RAIL SPRINT</small></span></button>}<span className="header-context">{running?'挑戰中':page==='routes'?'路網一覽':'挑戰練習'}</span></header>
    {!running&&menuOpen&&<button className="menu-backdrop" aria-label="關閉選單" onClick={()=>setMenuOpen(false)}/>}
    {!running&&<aside id="site-menu" className="site-sidebar" hidden={!menuOpen}><nav aria-label="主要選單"><div className="page-tabs" role="tablist" aria-label="練習網站分頁">{[{id:"practice",name:"挑戰練習",icon:"grid"},{id:"routes",name:"路網一覽",icon:"route"}].map(tab=><button key={tab.id} id={`${tab.id}-tab`} role="tab" aria-selected={page===tab.id} aria-controls={tab.id} tabIndex={page===tab.id?0:-1} onKeyDown={e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const next=e.key==="Home"?"practice":e.key==="End"?"routes":page==="practice"?"routes":"practice";navigatePage(next);document.getElementById(`${next}-tab`)?.focus();}}} onClick={()=>navigatePage(tab.id)}><Icon name={tab.icon} size={18}/>{tab.name}{running&&tab.id==="practice"&&<span className="tab-live">計時中</span>}</button>)}</div><div className="sidebar-info"><details className="version-info"><summary>資料與更新</summary><div><strong>資料更新：2026-10-20</strong><p>台鐵 243 站、高鐵 12 站分開計數；同名或共站不跨系統去重。</p><p>花蓮港、枋野納入路網與填空，排除旅客路徑起終點。未通車預覽不納入題庫。</p><p>最少站數由系統出題；複習成績與一般挑戰分開。</p></div></details><details><summary>關於我們</summary><div><strong>站站練習 Rail Sprint</strong><p>透過填空、路徑與轉乘挑戰，熟悉台灣鐵道路網。</p><p>這是獨立製作的非官方練習網站；挑戰紀錄儲存在你的瀏覽器。</p></div></details><details><summary>回饋</summary><div><p>發現路網錯誤或有功能建議？請附上鐵路系統、路線及問題畫面。</p><a href="https://github.com/EricbobXD/Metro_guest/issues/new" target="_blank" rel="noreferrer">到 GitHub 提交回饋 ↗</a></div></details></div></nav>{page==='routes'&&networkId==='tra'&&<RailJump groups={groups} networkId={networkId} onNavigate={id=>{const scope=traScopeForRoute(id);if(traViewScope!=='all'&&scope!==traViewScope){setTraViewScope(scope);requestAnimationFrame(()=>document.getElementById(`rail-route-${id}`)?.scrollIntoView({behavior:'smooth',block:'start'}));}if(window.innerWidth<900)setMenuOpen(false);}}/>}</aside>}

    <main>
    <section id="practice" role="tabpanel" aria-label="挑戰練習" hidden={page!=="practice"} ref={practiceRef} className="practice-section">{!game&&<div className="setup-controls"><div className="setup-heading"><span className="setup-kicker">RAIL SPRINT / CHALLENGE</span><h1>準備出發</h1><p>選好路網，開始你的鐵道挑戰。</p></div><div className="setup-fields"><label>路網<select aria-label="挑戰路網" value={networkId} onChange={e=>changeNetwork(e.target.value)}>{networks.map(n=><option key={n.id} value={n.id}>{n.name}・{stationsFor(n).length} 站</option>)}</select></label><label>模式<select aria-label="挑戰模式" value={mode} onChange={e=>{setMode(e.target.value);clearGame();setSettingsOpen(true);}}>{modes.map(m=><option key={m.id} value={m.id} disabled={['hsr','taichung'].includes(networkId)&&m.id==='route'}>{m.name}{['hsr','taichung'].includes(networkId)&&m.id==='route'?'（此系統不提供）':''}</option>)}</select></label></div></div>}
    {game&&<div className="challenge-summary" role="note" aria-label="本次挑戰摘要"><span>{summaryText}</span></div>}<div className="workspace"><details className="settings-shell" hidden={!!game} open={!game||settingsOpen} onToggle={e=>setSettingsOpen(e.currentTarget.open)}><summary>練習設定<span>展開／收合</span></summary><aside className="settings"><div className="panel-heading"><Icon name="train"/><h2>練習設定</h2></div><label>練習範圍<select value={lineFilter} disabled={running} onChange={e=>{setLineFilter(e.target.value);clearGame();}}><option value="all">全路網・{allStations.length} 站</option>{groups.map(l=><option key={l.id} value={l.id}>{l.name}（{l.stops.length} 站）</option>)}</select></label><label>挑戰時間<select value={duration} disabled={running} onChange={e=>{setDuration(Number(e.target.value));clearGame();}}>{durationOptions.map(value=><option key={value} value={value}>{value<60?`${value} 秒`:`${value/60} 分鐘`}</option>)}</select></label><fieldset disabled={running||!scope.hasSubtitles}><legend>填答名稱{!scope.hasSubtitles?'（此範圍僅有站名）':''}</legend><label className="radio"><input type="radio" checked={!subtitle} onChange={()=>{setSubtitle(false);clearGame();}}/>站名</label><label className="radio"><input type="radio" checked={subtitle} onChange={()=>{setSubtitle(true);clearGame();}}/>站名＋副站名</label></fieldset>{mode==='transfer'&&<p className="scope-note" aria-live="polite">可出題 {scope.transfers.length} 站{scope.transfers.length===0?'：此範圍無轉乘題，請切換範圍。':scope.transfers.length===1?'：僅一題，後續將重複同站。':''}</p>}{mode==='route'&&<p className="scope-note">由系統隨機選擇一般客運起終點，至少包含一個中間站；不可自訂。路徑使用完整路網。{!routeAvailable&&' 此範圍無適用題目，請切換範圍。'}</p>}
    <button className="primary-button" disabled={running||!canStart} onClick={begin}>{finished?'再練習一次':'開始練習'}<Icon name="arrow" size={18}/></button></aside></details>
    {mapFirstChallenge&&<section className="challenge-map" aria-label="挑戰路網"><div className="challenge-map-heading"><span>{mode==='route'?'路網參考':'點選站點指定作答'}</span><span>{mode==='route'?'不顯示站名':'站名填空'}</span></div>{mapDisplay}</section>}{game&&<section className="practice-panel"><div className="practice-head"><div><div className="eyebrow">{network.english}</div><h2>{network.name}<span>{modes.find(m=>m.id===mode).name}</span></h2></div><span className={`status-pill ${running?'live':''}`}><i/>{running?'練習中':finished?'練習結束':'準備出發'}</span></div><div className="scoreboard"><div><span><Icon name="clock" size={16}/> 剩餘時間</span><strong className={running&&seconds<=30?'urgent':''}>{timeText(game?seconds:duration)}</strong></div><div><span>{mode==='transfer'?'答對題數':mode==='route'?'最少站距':'已填車站'}</span><strong>{mode==='transfer'?game?.correct||0:mode==='route'?game?.minimum??'—':answersCount}<small>{mode==='transfer'?` / ${game?.attempts||0} 題`:mode==='route'?' 段':` / ${pool.length}`}</small></strong></div><div className="progress-stat"><span>{mode==='transfer'?'答對率':'完成進度'}</span><strong>{game?progress:0}<small>%</small></strong><div className="progress-bar"><i style={{width:`${game?progress:0}%`}}/></div></div></div>
    {mapFirstChallenge&&mode==='fill'&&<section className="line-progress" aria-label="各線完成進度"><h3>各線進度</h3>{lineProgress.map(line=><div key={line.id} className="line-progress-row"><div><span><i style={{background:line.color}}/>{line.name}</span><strong>{line.solved}<small> / {line.total}</small></strong></div><progress aria-label={`${line.name}完成進度`} max={line.total} value={line.solved}/></div>)}</section>}
    {game&&<div className="play-area">{mode==='route'&&<><div className="journey"><div><small>起點</small><strong>{stationName(game.from)}</strong></div><Icon name="route" size={28}/><div><small>終點</small><strong>{stationName(game.to)}</strong></div></div><div className="path-chips">{game.path.map((id,i)=><React.Fragment key={`${id}-${i}`}>{i>0&&<span className="path-arrow">→</span>}<span className="path-chip">{stationName(id)}</span></React.Fragment>)}{running&&<><span className="path-arrow">→</span><span className="path-chip empty">下一站？</span></>}</div><p className="hint">同樣短的路線都接受。站外步行連接算一段，兩端站名均需填入。</p></>}
    {mode==='fill'&&<div className="fill-prompt"><span className="ready-icon small"><Icon name="grid"/></span><div><h3>{target?'填入所選位置的站名':'想到哪一站，就從那一站開始。'}</h3><p>{subtitle?'有副站名時，請輸入「站名 | 副站名」。':'不必照順序，自由輸入路網中的車站。'}</p></div>{target&&<button className="text-button" onClick={()=>setTarget(null)}>取消指定</button>}</div>}
    {mode==='transfer'&&<><div className="question-station"><span>{networkId==='hsr'?'這座高鐵站可轉乘哪些車站？':'這一站可以轉乘哪些路線／系統？'}</span><h3>{stationName(game.question)}</h3><small>{networkId==='hsr'?'請選出所有可轉乘的軌道系統與站名（含站外步行）。':'含本站服務路線；請選出所有符合項目。'}</small></div><form onSubmit={checkTransfer}><div className="transfer-options">{choices.map(label=><label key={label} className={`choice ${checked.includes(label)?'chosen':''}`}><input type="checkbox" checked={checked.includes(label)} disabled={!running||game.review} onChange={()=>setChecked(checked.includes(label)?checked.filter(c=>c!==label):[...checked,label])}/>{label}</label>)}</div>{running&&(game.review?<button key="next-question" type="button" className="primary-button compact" onClick={nextTransfer}>下一題 <Icon name="arrow" size={17}/></button>:<button key="submit-answer" className="primary-button compact" type="submit">確認答案 <Icon name="check" size={17}/></button>)}</form></>}
    {running&&mode!=='transfer'&&<form className="answer-form" onSubmit={submit}><input ref={inputRef} aria-label="車站答案" autoComplete="off" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder={subtitle?'站名 | 副站名':'輸入車站名稱…'}/><button type="submit">送出 <span>↵</span></button></form>}
    {finished&&<PracticeReview missing={reviewMissing} errors={reviewErrors} retry={()=>begin(reviewMissing.map(s=>s.id))}/>}
    {finished&&<div className="result" role="status"><span className="result-icon"><Icon name="flag" size={24}/></span><h3>{game.reason==='demonstration'?'相鄰站示範・不計成績':game.reason==='complete'?'漂亮到站，挑戰完成！':game.reason==='timeout'?'時間到，這次也更熟悉了一點。':'練習已結束，進度已記錄。'}</h3><p>{mode==='fill'?`填對 ${answersCount} / ${pool.length} 站，完成率 ${progress}%。`:mode==='transfer'?`共作答 ${game.attempts} 題，答對 ${game.correct} 題。`:game.reason==='demonstration'?'起終點相鄰，無需填寫中間站；本次示範不計成績。':game.reason==='complete'?`以最少 ${game.minimum} 段站距完成路線。`:`已填入 ${Math.max(0,game.path.length-1)} 個中間站。`}</p><button className="primary-button compact" onClick={begin}><Icon name="reset" size={16}/> 再挑戰一次</button><button className="text-button change-settings" onClick={()=>{clearGame();setSettingsOpen(true);}}>更改設定</button></div>}
    {feedback&&<div role="status" aria-label="作答回饋" className={`feedback ${feedback.type}`}>{feedback.type==='success'?'✓':'!'} {feedback.text}</div>}{running&&<button className="end-button" onClick={()=>complete(game,'stopped')}>結束本次練習</button>}</div>}
    </section>}</div></section>
    <section id="routes" role="tabpanel" aria-label="路網一覽" hidden={page!=="routes"} className="route-section"><div className="route-toolbar route-sticky-tools"><label>鐵路系統<select aria-label="鐵路系統" value={networkId} disabled={running} onChange={e=>changeNetwork(e.target.value)}>{networks.map(n=><option key={n.id} value={n.id}>{n.id==='tra'?'台鐵＋高鐵':n.name}</option>)}</select></label><label>路網範圍<select value={networkId==='tra'?traViewScope:lineFilter} disabled={running} onChange={e=>{if(networkId==='tra')setTraViewScope(e.target.value);else{setLineFilter(e.target.value);clearGame();}}}>{networkId==='tra'?traViewScopes.map(scope=><option key={scope.id} value={scope.id}>{scope.name}</option>):<><option value="all">全路網</option>{groups.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</>}</select></label>{networkId==='tra'&&traViewScope==='all'&&readingSection&&<output className="current-network" aria-label="目前閱讀區段">{readingSection}</output>}<div className="map-toolbar-slot" ref={setMapToolbarHost}/>{running?<span className="route-session-note">挑戰持續計時中・{timeText(seconds)}<button className="text-button" onClick={()=>navigatePage("practice")}>返回作答 →</button></span>:<span className="route-session-note route-idle-note">先複習路網，再切換到挑戰練習。</span>}</div><div className={`route-map ${networkId==='tra'?'rail-route-map ':''}${lineFilter==="all"&&!['tra','hsr'].includes(networkId)?'integrated-map':(networkId!=='tra'&&(lineFilter!=='all'||networkId==='hsr'))?'single-route-map':''}`}>{!mapFirstChallenge&&mapDisplay}</div></section>
    </main>
    <footer className="site-footer"><p>路線圖為非官方示意，僅供練習參考；實際營運與轉乘請以各單位公告為準。路網參考臺鐵、高鐵及各捷運官方資料。顯示路徑不代表直達班次。</p><small>紀錄儲存於此瀏覽器</small></footer>
  </div>;
}
