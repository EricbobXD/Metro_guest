import React from 'react';
export default function PracticeReview({missing,errors,retry}){
  return <section className="practice-review" aria-label="練習回顧"><h3>練習回顧</h3>
    {missing.length>0&&<><h4>未熟悉項目・{missing.length} 站</h4><p>{missing.map(s=>s.name).join('、')}</p></>}
    {errors.length>0&&<details open><summary>錯答紀錄・{errors.length} 次</summary><ol>{errors.map((e,i)=><li key={i}><strong>{e.label||'自由填答'}</strong><div>你的答案：{e.input||'未勾選'}</div><div>正確答案：{e.expected||'請對照未熟悉車站清單與路網圖。'}</div></li>)}</ol></details>}
    {!missing.length&&!errors.length&&<p>本次全部答對，沒有待複習項目。</p>}
    {missing.length>0&&<button className="primary-button compact" onClick={retry}>只練未熟悉項目</button>}
  </section>;
}
