const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockroom.js','utf8');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1100,height:950}});await ctx.route('https://casino.test/**',r=>r.fulfill({status:200,headers:{'content-type':'text/html; charset=utf-8'},body:fs.readFileSync(__dirname+'/index.html','utf8')}));
const errs=[];async function open(uid){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(uid+': '+e.message+' @'+(e.stack||'').split('\n')[1]));await p.addInitScript(mock);await p.goto('https://casino.test/index.html?uid='+uid);await p.waitForTimeout(500);await p.click('#enter');await p.waitForTimeout(1300);await p.click('text=친구 테이블로');await p.waitForTimeout(500);return p;}
const A=await open('u_host');await A.click('text=홀덤 방');await A.waitForTimeout(800);
const B=await open('u_guest');await B.waitForTimeout(600);await B.click('#fList .btn');
for(let k=0;k<12;k++){await B.waitForTimeout(2000);
 const s=await B.evaluate(()=>{const K=App.S;return K?{myPeer:K.myPeer,host:K.hostPeer,meta:(K.meta||[]).map(m=>m.kind+':'+(m.peer||'')),queued:K.queued,phase:K.v&&K.v.phase,hand:K.v&&K.v.handNo,mine:K.mine}:null});
 const hs=await A.evaluate(()=>{const K=App.S;return {queue:K.queue.map(q=>q.peer),meta:K.meta.map(m=>m.kind+':'+(m.peer||'')),phase:K.t.phase,hand:K.t.handNo,toAct:K.t.toAct}});
 console.log(k,'B',JSON.stringify(s),'\n   A',JSON.stringify(hs));
 for(const p of [A,B]){const bt=await p.$$eval('.hand-panel .btn',bs=>bs.map(b=>b.textContent)).catch(()=>[]);const call=bt.find(t=>t.startsWith('콜')||t==='체크');if(call)await p.click(`.hand-panel .btn:text-is("${call}")`).catch(()=>{});}
}
console.log('errors',errs);await b.close();})();
