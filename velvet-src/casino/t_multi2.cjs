const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockroom.js','utf8');
(async()=>{const b=await chromium.launch();
async function game(kind,rounds){
const ctx=await b.newContext({viewport:{width:1100,height:950}});await ctx.route('https://casino.test/**',r=>r.fulfill({status:200,headers:{'content-type':'text/html; charset=utf-8'},body:fs.readFileSync(__dirname+'/index.html','utf8')}));
const errs=[];async function open(uid){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(uid+': '+e.message));p.on('console',m=>{if(m.text().includes('EMIT TOO BIG'))errs.push(m.text())});await p.addInitScript(mock);await p.goto('https://casino.test/index.html?uid='+uid);await p.waitForTimeout(400);await p.click('#enter');await p.waitForTimeout(1300);await p.click('text=친구 테이블로');await p.waitForTimeout(400);return p;}
const A=await open('u_host');await A.click(`text=${kind}`);await A.waitForTimeout(600);
const B=await open('u_guest');await B.waitForTimeout(500);await B.click('#fList .btn');
let leak=0, guestActed=0, guestChose=0, guestBet=0;
for(let k=0;k<rounds;k++){
  for(const [p,who] of [[A,'A'],[B,'B']]){
    if(await p.$('text=이대로 확정')){await p.click('.mycards button.card >> nth=0').catch(()=>{});await p.click('.mycards button.card >> nth=1').catch(()=>{});await p.click('text=이대로 확정').catch(()=>{});if(who==='B')guestChose++;continue;}
    const bt=await p.$$eval('.hand-panel .btn',bs=>bs.map(b=>b.disabled?'':b.textContent)).catch(()=>[]);
    if(bt.includes('베팅 확정')){await p.click('.presets .btn >> nth=0').catch(()=>{});await p.click('text=베팅 확정').catch(()=>{});if(who==='B')guestBet++;continue;}
    const call=bt.find(t=>t.startsWith('콜')||t==='체크'||t==='스탠드');
    if(call){await p.click(`.hand-panel .btn:text-is("${call}")`).catch(()=>{});if(who==='B')guestActed++;}
  }
  // leak check: in guest view, host seat (seat 0) hidden cards must be backs while phase is bet
  if(kind!=='블랙잭 방'){const st=await B.evaluate(()=>{const K=App.S;if(!K||!K.v)return null;const ctx=K.ctx();const v=ctx.v;if(v.phase!=='bet')return null;const host=v.seats[0];return host.cards.filter((c,i)=>c>=0&&!host.up[i]).length;});if(st)leak+=st;}
  await A.waitForTimeout(400);
}
const summ=await B.evaluate(()=>{const K=App.S;return K&&K.v?{phase:K.v.phase,hand:K.v.handNo,seat:K.meta.findIndex(m=>m.peer===K.myPeer),mine:K.mine}:null});
console.log(kind,'guest',JSON.stringify(summ),'acted',guestActed,'chose',guestChose,'bet',guestBet,'hidden host cards visible to guest:',leak);
console.log('B log:',(await B.$$eval('.log li',l=>l.map(x=>x.textContent)).catch(()=>[])).slice(-4).join(' | '));
await B.screenshot({path:'s_m_'+(kind[0])+'.png',fullPage:true});
console.log('errors',errs);await ctx.close();}
await game('세븐 포커 방',70);
await game('블랙잭 방',40);
await b.close();})();
