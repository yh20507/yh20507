const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:1000}});
const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+e.stack.split('\n')[1]));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('ERR_TUNNEL'))errs.push(m.text())});
await p.addInitScript(()=>{if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('velvet-wallet-v1',JSON.stringify({chips:5000,items:{pistol:2,lens:2,cigarette:2,sleeve:1,mirror:2,notebook:1,clover:1,slot:1,insurance:1,whiskey:1},day:'2020-01-01'}));}});
await p.goto('file://'+__dirname+'/index.html');await p.waitForTimeout(600);await p.click('#enter');await p.waitForTimeout(1400);
const btnTexts=()=>p.$$eval('.hand-panel .btn',bs=>bs.map(b=>b.textContent));
// ---- seven poker
await p.click('.path:nth-child(2) .btn.gold');await p.waitForTimeout(300);await p.click('#ovBox .btn.gold');await p.waitForTimeout(500);
// choose: click card 0 then card 1, confirm
await p.click('.mycards button.card >> nth=0');await p.click('.mycards button.card >> nth=1');await p.click('text=이대로 확정');await p.waitForTimeout(400);
// use lens & whiskey via chooser when possible
let usedLens=false;
for(let k=0;k<50;k++){
  await p.waitForTimeout(300);
  const bt=await btnTexts();
  if(bt.includes('다음 판')){ // try prep item slot between hands
     const slot=await p.$('.item-btn:has-text("슬롯 코인"):not([disabled])'); if(slot){await slot.click();await p.waitForTimeout(200);}
     await p.click('text=다음 판');await p.waitForTimeout(300);
     if(await p.$('text=이대로 확정')){await p.click('.mycards button.card >> nth=0');await p.click('.mycards button.card >> nth=1');await p.click('text=이대로 확정');}
     continue;}
  if(!usedLens){const lens=await p.$('.item-btn:has-text("돋보기"):not([disabled])');if(lens){await lens.click();await p.waitForTimeout(150);const opt=await p.$('.chooser .btn.small >> nth=0');if(opt){await opt.click();usedLens=true;await p.waitForTimeout(150);console.log('peeked',await p.$$eval('.card.peek',x=>x.length));}}}
  const call=bt.find(t=>t.startsWith('콜')||t==='체크');if(call)await p.click(`.hand-panel .btn:text-is("${call}")`);
}
await p.screenshot({path:'s_seven.png',fullPage:true});
console.log('seven log',(await p.$$eval('.log li',l=>l.map(x=>x.textContent))).slice(-4).join(' | '));
// leave
await p.click('text=일어나기');await p.waitForTimeout(300);if(await p.$('#ov:not([hidden]) .btn.red'))await p.click('#ov .btn.red');await p.waitForTimeout(500);
console.log('wallet after seven',await p.textContent('#wChips'),'sus',await p.textContent('#wSusN'));
// ---- blackjack
await p.click('.path:nth-child(3) .btn.gold');await p.waitForTimeout(300);
await p.click('.item-btn:has-text("카운팅 수첩")');await p.waitForTimeout(200);
await p.click('.presets .btn >> nth=1');await p.click('.hand-panel .btn:text-is("딜")');await p.waitForTimeout(300);
for(let k=0;k<30;k++){await p.waitForTimeout(200);const bt=await btnTexts();
  if(bt.includes('히트')){ if(k===0){const pis=await p.$('.item-btn:has-text("권총"):not([disabled])');if(pis){await pis.click();console.log('pistol used');}}
     await p.click('.hand-panel .btn:text-is("스탠드")');continue;}
  if(bt.includes('딜')){await p.click('.hand-panel .btn:text-is("딜")');}
}
await p.screenshot({path:'s_bj.png',fullPage:true});
console.log('bj counting box',await p.$$eval('.chooser',x=>x.map(e=>e.textContent).join('|')));
console.log('wallet',await p.textContent('#wChips'),'sus',await p.textContent('#wSusN'));
await p.click("text=일어나기");await p.waitForTimeout(300);if(await p.$("#ov:not([hidden]) .btn.red"))await p.click("#ov .btn.red");await p.waitForTimeout(300);
// ---- shop
await p.click('text=상점 들어가기');await p.waitForTimeout(300);await p.click('.ware:has-text("VIP 카드") .btn');await p.waitForTimeout(200);
await p.screenshot({path:'s_shop.png',fullPage:true});
console.log('after vip',await p.textContent('#wChips'));
console.log('saved',await p.evaluate(()=>localStorage.getItem('velvet-wallet-v1').slice(0,200)));
console.log('errors',errs);await b.close();})();
