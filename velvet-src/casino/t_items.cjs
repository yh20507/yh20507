const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
async function run(wallet,fn){const p=await b.newPage({viewport:{width:1200,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript((w)=>{if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('velvet-wallet-v1',JSON.stringify(w));}},wallet);
 await p.goto('file://'+__dirname+'/index.html');await p.waitForTimeout(500);await p.click('#enter');await p.waitForTimeout(1300);
 await p.click('.path:nth-child(1) .btn.gold');await p.waitForTimeout(200);await p.click('#ovBox .btn.gold');await p.waitForTimeout(300);
 await fn(p);console.log('errors',errs);await p.close();}
// 1) pistol: wait for my turn preflop, use pistol hearts, then fold-proof: check board suits after flop
await run({chips:1000,items:{pistol:1},day:'2099-01-01',sus:0},async p=>{
  for(let k=0;k<40;k++){await p.waitForTimeout(250);if(await p.$('.item-btn:has-text("권총"):not([disabled])'))break;}
  await p.click('.item-btn:has-text("권총")');await p.click('.chooser .btn:has-text("하트")');
  console.log('sus after pistol',await p.textContent('#wSusN'));
  for(let k=0;k<60;k++){await p.waitForTimeout(250);const board=await p.$$eval('.center .cards .card:not([style]) i',x=>x.map(e=>e.textContent));if(board.length>=3){console.log('flop suits',board.slice(0,3).join(''));break;}
    const bt=await p.$$eval('.hand-panel .btn',bs=>bs.map(b=>b.textContent));const call=bt.find(t=>t.startsWith('콜')||t==='체크');if(call)await p.click(`.hand-panel .btn:text-is("${call}")`);}
});
// 2) caught: sus 90 + cigarette (+20) -> caught
await run({chips:1000,items:{cigarette:1},day:'2099-01-01',sus:90},async p=>{
  for(let k=0;k<40;k++){await p.waitForTimeout(250);if(await p.$('.item-btn:has-text("담배"):not([disabled])'))break;}
  await p.click('.item-btn:has-text("담배")');await p.waitForTimeout(100);await p.click('.mycards .card >> nth=0');await p.waitForTimeout(900);
  console.log('dialog:',await p.textContent('#ovBox h2'));await p.click('#ovBox .btn.gold');await p.waitForTimeout(300);
  console.log('lobby:',await p.textContent('#scrLobby h1'),'chips',await p.textContent('#wChips'));
});
await b.close();})();
