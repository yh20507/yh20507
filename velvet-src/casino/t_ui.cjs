const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:950}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('ERR_TUNNEL'))errs.push(m.text())});
await p.goto('file://'+__dirname+'/index.html');await p.waitForTimeout(800);
await p.screenshot({path:'s_door.png'});
await p.click('#enter');await p.waitForTimeout(1400);
await p.screenshot({path:'s_lobby.png',fullPage:true});
console.log('chips',await p.textContent('#wChips'));
// holdem low
await p.click('.path:nth-child(1) .btn.gold');await p.waitForTimeout(300);
await p.click('#ovBox .btn.gold');await p.waitForTimeout(400);
// play several hands: always call/check when my turn, next hand when done
for(let k=0;k<60;k++){
  await p.waitForTimeout(350);
  const btns=await p.$$eval('.hand-panel .btn',bs=>bs.map(b=>b.textContent));
  if(btns.includes('다음 판')){await p.click('text=다음 판');continue;}
  const call=btns.find(t=>t.startsWith('콜')||t==='체크');
  if(call){await p.click(`.hand-panel .btn:text-is("${call}")`);}
}
await p.screenshot({path:'s_holdem.png',fullPage:true});
console.log('log',await p.$$eval('.log li',l=>l.map(x=>x.textContent).join(' | ')));
console.log('table chips text',await p.$eval('.tablebar',e=>e.textContent));
console.log('errors',errs);
await b.close();})();
