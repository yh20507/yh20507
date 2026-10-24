const {chromium}=require('playwright');const fs=require('fs');
const mock=fs.readFileSync(__dirname+'/mockroom.js','utf8');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1100,height:950}});await ctx.route('https://casino.test/**',r=>r.fulfill({status:200,headers:{'content-type':'text/html; charset=utf-8'},body:fs.readFileSync(__dirname+'/index.html','utf8')}));
const errs=[];
async function open(uid){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(uid+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('ERR_TUNNEL')&&!m.text().includes('fonts'))errs.push(uid+' console: '+m.text())});
 await p.addInitScript(mock);await p.goto('https://casino.test/index.html?uid='+uid);await p.waitForTimeout(500);await p.click('#enter');await p.waitForTimeout(1300);
 await p.click('text=친구 테이블로');await p.waitForTimeout(500);return p;}
const A=await open('u_host');await A.click('text=홀덤 방');await A.waitForTimeout(800);
const code=(await A.textContent('.tablebar .code'));console.log('code',code);
const B=await open('u_guest');await B.waitForTimeout(600);
console.log('B list:',await B.textContent('#fList'));
await B.click('#fList .btn');await B.waitForTimeout(1500);
console.log('B status:',await B.textContent('.hand-panel .status'));
// play: loop both pages, click call/check when their turn
let seenGuestCards=false, guestSawHostCards=false;
for(let k=0;k<90;k++){
  for(const [p,who] of [[A,'A'],[B,'B']]){
    const bt=await p.$$eval('.hand-panel .btn',bs=>bs.map(b=>b.textContent)).catch(()=>[]);
    const call=bt.find(t=>t.startsWith('콜')||t==='체크');
    if(call){await p.click(`.hand-panel .btn:text-is("${call}")`).catch(()=>{});}
  }
  if(!seenGuestCards){const faces=await B.$$eval('.mycards .card:not(.back)',x=>x.length).catch(()=>0);if(faces>=2){seenGuestCards=true;console.log('guest sees own 2 cards at step',k);}}
  await A.waitForTimeout(300);
}
const bLog=await B.$$eval('.log li',l=>l.map(x=>x.textContent).join(' | '));console.log('B log:',bLog);
// guest should not see host cards face-up mid-hand except showdown: count face cards on host seat in B view during bet phase
console.log('max emit bytes',await A.evaluate(()=>window.__maxEmit));
await B.screenshot({path:'s_multi_guest.png',fullPage:true});
// host leaves -> guest gets dialog
await A.click('text=일어나기');await A.waitForTimeout(300);if(await A.$('#ov:not([hidden]) .btn.red'))await A.click('#ov .btn.red');await A.waitForTimeout(1500);
console.log('B after host left:',await B.textContent('#ovBox h2').catch(()=>'(none)'));
console.log('errors',errs);await b.close();})();
