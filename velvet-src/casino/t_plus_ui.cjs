const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const users={};const wallets={};let n=0;
async function mk(vp){const ctx=await b.newContext({viewport:vp||{width:1180,height:900}});
await ctx.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await ctx.route('https://omofqvclwetstbuoumzg.supabase.co/**',async r=>{const u=new URL(r.request().url());const m=r.request().method();const body=r.request().postData()?JSON.parse(r.request().postData()):null;
 const J=(s,o)=>r.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
 const auth=r.request().headers()['authorization']||'';const uid=auth.startsWith('Bearer tok-')?auth.slice(11):null;
 if(u.pathname.startsWith('/functions/'))return J(503,{error:'no_key'});
 if(u.pathname==='/auth/v1/signup'){if(users[body.email])return J(422,{msg:'User already registered'});const id='uid'+(++n);users[body.email]={pw:body.password,id};return J(200,{access_token:'tok-'+id,refresh_token:'r-'+id,expires_in:3600,user:{id}});}
 if(u.pathname==='/auth/v1/token'){const x=users[body.email];if(!x||x.pw!==body.password)return J(400,{error_description:'Invalid login credentials'});return J(200,{access_token:'tok-'+x.id,refresh_token:'r-'+x.id,expires_in:3600,user:{id:x.id}});}
 if(u.pathname==='/rest/v1/wallets'){const q=u.searchParams;const id=(q.get('user_id')||'').replace('eq.','')||(body&&body.user_id);
   if(id&&id!==uid)return J(200,[]);
   if(m==='GET')return J(200,wallets[id]?[{data:wallets[id].data}]:[]);
   if(m==='POST'){wallets[uid]={data:body.data,sid:body.sid};return r.fulfill({status:201,body:''});}
   if(m==='PATCH'){const w=wallets[id];if(!w)return J(200,[]);const sidq=q.get('sid');if(sidq&&w.sid!==decodeURIComponent(sidq.replace('eq.','')))return J(200,[]);Object.assign(w,body);return J(200,[{user_id:id}]);}}
 return J(404,{});});
await ctx.route('https://casino.test/**',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync(__dirname+'/벨벳카지노.html','utf8')}));
return ctx;}
const errs=[];const log=(...a)=>console.log(...a);
const ctx=await mk();const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text());});
await p.goto('https://casino.test/x.html');await p.waitForTimeout(400);
await p.fill('#loginId','yh20507');await p.fill('#loginPw','secret12');await p.click('text=처음이에요 (가입)');await p.waitForTimeout(700);
await p.click('#enter');await p.waitForTimeout(1500);
await p.evaluate(()=>{App.W.data.chips=20000;App.W.data.wheel.day=App.dayKey();App.save();App.show('scrLobby');App.renderLobby();});await p.waitForTimeout(1600);await p.evaluate(()=>{App.show('scrLobby');App.renderLobby();});
log('doors',await p.$$eval('.door-card',e=>e.map(x=>x.querySelector('b').textContent)));
await p.screenshot({path:'u_lobby.png',fullPage:true});
// 내 방
await p.click('.door-card.d-m');await p.waitForTimeout(300);
log('trophies',await p.$$eval('.trophy',e=>e.length),'got',await p.$$eval('.trophy.got',e=>e.map(x=>x.querySelector('b').textContent)));
await p.screenshot({path:'u_room.png',fullPage:true});
for(const t of ['기록판','단서 서랍','장식장','쉬기','옷장']){await p.click('.tab:has-text("'+t+'")');await p.waitForTimeout(150);}
await p.click('.tab:has-text("쉬기")');await p.click('text=눕기');await p.waitForTimeout(3200);
// 룰렛
await p.click('.plus-head .btn');await p.waitForTimeout(200);
await p.click('.door-card.d-r');await p.waitForTimeout(200);
await p.click('.rc[aria-label^="17"]');await p.click('.rc[aria-label^="빨강"]');
const before=await p.evaluate(()=>App.W.data.chips);
await p.click('text=돌리기');await p.waitForTimeout(1500);await p.screenshot({path:'u_ro_spin.png'});await p.waitForTimeout(3600);
log('roulette result',await p.textContent('#roRes'),'chips',before,'->',await p.evaluate(()=>App.W.data.chips));
await p.screenshot({path:'u_roulette.png',fullPage:true});
// 섯다
await p.click('.plus-head .btn');await p.click('.door-card.d-s');await p.waitForTimeout(200);
await p.click('text=일반 앉기');
for(let k=0;k<60;k++){await p.waitForTimeout(500);const done=await p.$('text=다음 판');if(done)break;const bt=await p.$('.hand-panel .actions .btn:not(.red)');if(bt&&await p.isVisible('.status.warn'))await bt.click();}
log('seotda status',await p.textContent('.hand-panel .status'),'| result',await p.$eval('.result',e=>e.textContent).catch(()=>'-'));
await p.screenshot({path:'u_seotda.png',fullPage:true});
// 인디언
await p.click('.plus-head .btn');await p.click('.door-card.d-i');await p.waitForTimeout(200);
await p.click('text=일반 앉기');await p.waitForTimeout(600);await p.screenshot({path:'u_indian_start.png',fullPage:true});
for(let k=0;k<60;k++){await p.waitForTimeout(500);const done=await p.$('text=다음 판');if(done)break;const bt=await p.$('.hand-panel .actions .btn:not(.red)');if(bt&&await p.isVisible('.status.warn'))await bt.click();}
log('indian',await p.$eval('.result',e=>e.textContent).catch(()=>'-'));
await p.screenshot({path:'u_indian.png',fullPage:true});
// 체스
await p.click('.plus-head .btn');await p.click('.door-card.d-c');await p.waitForTimeout(200);
await p.click('.panel .presets .btn:has-text("초보")');await p.click('#scrPlus .btn:has-text("앉기")');await p.waitForTimeout(200);
await p.click('.sq[aria-label="e2"]');await p.click('.sq[aria-label="e4"]');await p.waitForTimeout(1200);
log('chess log',await p.$$eval('.ch-wrap .log li',e=>e.map(x=>x.textContent)));
await p.screenshot({path:'u_chess.png',fullPage:true});
// 경매
await p.click('.plus-head .btn');await p.waitForTimeout(200);await p.click('.door-card.d-a');await p.waitForTimeout(300);
await p.screenshot({path:'u_auction.png',fullPage:true});
const lotBtn=await p.$('.lot .btn.gold:not([disabled])');
if(lotBtn){await lotBtn.click();await p.waitForTimeout(800);const bb=await p.$('.live .btn.gold');if(bb)await bb.click();await p.waitForTimeout(2500);await p.screenshot({path:'u_live.png',fullPage:true});
 for(let k=0;k<20;k++){await p.waitForTimeout(1000);const lead=await p.$eval('.live .stat b',e=>e.textContent).catch(()=>null);if(lead===null)break;if(lead!=='나'){const x=await p.$('.live .btn.gold:not([disabled])');if(x)await x.click();}}
 await p.waitForTimeout(2500);log('auction res',await p.evaluate(()=>JSON.stringify(App.W.data.auc.res)),'items',JSON.stringify(await p.evaluate(()=>[App.W.data.items,App.W.data.inv])));}
// 바
await p.click('.plus-head .btn');await p.click('.door-card.d-b');await p.waitForTimeout(200);
await p.click('text=50칩 내고 앉기');await p.waitForTimeout(200);
await p.fill('#barIn','13번 테이블 알아요?');await p.keyboard.press('Enter');await p.waitForTimeout(2000);
await p.fill('#barIn','추천해 줄 술 있어요?');await p.click('text=말하기');await p.waitForTimeout(2000);
log('bar msgs',await p.$$eval('.msg p',e=>e.map(x=>x.textContent)),'clues',await p.evaluate(()=>App.W.data.clues));
await p.screenshot({path:'u_bar.png',fullPage:true});
// 13번 테이블
await p.click('.bar-wrap .btn:has-text("일어나기")');await p.waitForTimeout(200);
await p.evaluate(()=>{const w=App.W.data;w.t13.day=App.dayKey();w.t13.on=true;w.t13.done=false;App.renderLobby();});
await p.waitForTimeout(200);log('t13 door',!!(await p.$('.t13-door')));
await p.click('.t13-door');await p.waitForTimeout(8500);await p.screenshot({path:'u_t13.png',fullPage:true});
await p.click('text=앉는다');await p.waitForTimeout(4500);
for(let k=0;k<12;k++){const x=await p.$('text=방아쇠를 당긴다');if(x){await x.click();}await p.waitForTimeout(2600);const back=await p.$('#acts13 .btn:has-text("로비로")');if(back)break;}
log('t13 end',await p.textContent('#acts13'),'chips',await p.evaluate(()=>[App.W.data.chips,App.W.data.vault,App.W.data.t13]));
await p.screenshot({path:'u_t13_end.png',fullPage:true});
await p.click('#acts13 .btn:has-text("로비로")');await p.waitForTimeout(300);
// 블랙잭 + 밑장 빼기
await p.evaluate(()=>{const w=App.W.data;w.items.bottom=1;w.sus=0;w.banDay=null;w.chips=Math.max(w.chips,500);App.save();App.renderLobby();});
await p.click('.path:nth-child(3) .btn.gold');await p.waitForTimeout(300);
const ib=await p.$('.item-btn:has-text("밑장 빼기")');log('bottom btn',!!ib, ib?await ib.isEnabled():null);
if(ib){await ib.click();await p.waitForTimeout(200);}
log('sus after bottom',await p.evaluate(()=>App.W.data.sus));
await p.click('.presets .btn >> nth=1');await p.click('.hand-panel .btn:text-is("딜")');await p.waitForTimeout(800);
log('bj result',await p.$eval('.result',e=>e.textContent).catch(()=>'-'));
await p.screenshot({path:'u_bj.png',fullPage:true});
log('titles',await p.evaluate(()=>Object.keys(App.W.data.titles)));
log('server saved titles',Object.keys((wallets.uid1||{data:{}}).data.titles||{}).length);
// 모바일 폭 확인
const m=await mk({width:390,height:800});const q=await m.newPage();q.on('pageerror',e=>errs.push('m:'+e.message));
await q.goto('https://casino.test/x.html');await q.waitForTimeout(300);await q.fill('#loginId','yh20507');await q.fill('#loginPw','secret12');await q.click('text=로그인');await q.waitForTimeout(700);await q.click('#enter');await q.waitForTimeout(1500);await q.evaluate(()=>{App.W.data.wheel.day=App.dayKey();App.show('scrLobby');App.renderLobby();});
const sw=async(name)=>{const w=await q.evaluate(()=>document.documentElement.scrollWidth);log('mobile',name,'scrollW',w);await q.screenshot({path:'m_'+name+'.png',fullPage:true});};
await sw('lobby');
for(const [d,nm] of [['d-r','roulette'],['d-m','room'],['d-a','auction']]){await q.click('.door-card.'+d);await q.waitForTimeout(400);await sw(nm);await q.click('.plus-head .btn');await q.waitForTimeout(200);}
await q.click('.door-card.d-s');await q.click('text=일반 앉기');await q.waitForTimeout(600);await sw('seotda');await q.click('.plus-head .btn');
await q.click('.door-card.d-c');await q.click('#scrPlus .btn:has-text("앉기")');await q.waitForTimeout(300);await sw('chess');
log('errors',errs);await b.close();})();
