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
const ctx=await mk();const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('https://casino.test/x.html');await p.waitForTimeout(400);
await p.fill('#loginId','yh20507');await p.fill('#loginPw','secret12');await p.click('text=처음이에요 (가입)');await p.waitForTimeout(700);
await p.click('#enter');await p.waitForTimeout(3000);
log('auto wheel screen?',await p.isVisible('.wh-box'));
await p.screenshot({path:'n_wheel.png',fullPage:true});
await p.click('.wh-box .btn.gold');await p.waitForTimeout(5300);
log('wheel result',await p.textContent('#whRes'));
await p.screenshot({path:'n_wheel_done.png',fullPage:true});
// 스페셜 회전판 강제
await p.evaluate(()=>{const w=App.W.data;w.st.wheel=6;w.wheel.day='';App.save();Plus.wheel.open();});await p.waitForTimeout(300);
log('special title',await p.textContent('.plus-head h1'));await p.click('.wh-box .btn.gold');await p.waitForTimeout(5300);log('special result',await p.textContent('#whRes'));
await p.screenshot({path:'n_wheel_sp.png',fullPage:true});
await p.evaluate(()=>{App.W.data.chips=30000;App.save();App.show('scrLobby');App.renderLobby();});await p.waitForTimeout(300);
log('doors',await p.$$eval('.door-card b',e=>e.map(x=>x.textContent)));
// 바카라
await p.click('.door-card.d-k');await p.waitForTimeout(200);
await p.click('.bc-spot.s-p');await p.click('.bc-spot.s-b');await p.click('#scrPlus .btn.gold:text-is("딜")');await p.waitForTimeout(5500);
log('baccarat',await p.textContent('.bc-mid'),'|',await p.$eval('.result',e=>e.textContent).catch(()=>'-'));
await p.screenshot({path:'n_baccarat.png',fullPage:true});
// 슬롯
await p.click('.plus-head .btn');await p.click('.door-card.d-l');await p.waitForTimeout(200);
await p.click('.sl-wrap .btn.gold');await p.waitForTimeout(500);await p.screenshot({path:'n_slot_spin.png',fullPage:true});await p.waitForTimeout(1500);
log('slot msg',await p.textContent('#slMsg'));
await p.click('text=10번 자동');await p.waitForTimeout(25000);
log('slot after auto',await p.textContent('#slMsg'),'spins',await p.evaluate(()=>App.W.data.st.slSpin),'pool',await p.evaluate(()=>App.W.data.slot.pool));
await p.screenshot({path:'n_slots.png',fullPage:true});
// 슬롯 잭팟 강제 확인 (Math.random 고정)
// 지하
await p.click('.plus-head .btn');await p.waitForTimeout(200);
log('ug door before',!!(await p.$('.door-card.d-u')));
await p.evaluate(()=>{App.W.data.st.t13Visit=1;App.save();App.renderLobby();});await p.waitForTimeout(200);
log('ug door after',!!(await p.$('.door-card.d-u')));
await p.click('.door-card.d-u');await p.waitForTimeout(300);await p.screenshot({path:'n_under.png',fullPage:true});
await p.click('.ug-ware:has-text("표시된 카드") .btn');await p.click('.ug-ware:has-text("가짜 칩") .btn');await p.waitForTimeout(200);
log('market items',await p.evaluate(()=>[App.W.data.items.marked,App.W.data.items.fake]));
await p.click('.path.ug >> nth=0 >> .btn.gold');await p.waitForTimeout(300);await p.click('text=내려간다');await p.waitForTimeout(800);
log('under table title',await p.textContent('.tablebar h2'),'class under',await p.evaluate(()=>document.querySelector('#scrTable').classList.contains('under')));
// 고발 패널 + 낌새 강제
await p.evaluate(()=>{const S=App.S;S.cheated={2:'ace'};S.tells={2:'손이 소매 쪽으로 갔다'};S.accused=false;App.renderTable();});await p.waitForTimeout(200);
await p.screenshot({path:'n_under_table.png',fullPage:true});
const before=await p.evaluate(()=>App.S.t.seats[0].stack);
await p.click('.ug-acc .btn.red');await p.waitForTimeout(300);
log('accuse: stack',before,'->',await p.evaluate(()=>App.S.t.seats[0].stack),'seat2',await p.evaluate(()=>[App.S.t.seats[2].stack,App.S.t.seats[2].folded]),'acc',await p.evaluate(()=>App.W.data.st.ugAccuse));
// 아이템 사용 → 강제 적발
await p.evaluate(()=>{const S=App.S;S.usedFor=-1;});
await p.evaluate(()=>{Math._r=Math.random;Math.random=()=>0.1;});
const ib=await p.$('.item-btn:has-text("표시된 카드")');log('marked usable',ib?await ib.isEnabled():null);
if(ib&&await ib.isEnabled()){await ib.click();}else{await p.evaluate(()=>{App.W.data.items.marked=1;});}
await p.waitForTimeout(900);await p.evaluate(()=>{Math.random=Math._r;});
log('caught dialog',await p.textContent('#ovBox h2').catch(()=>'none'),'sus',await p.evaluate(()=>App.W.data.sus),'ug',await p.evaluate(()=>JSON.stringify(App.W.data.ug)));
await p.screenshot({path:'n_caught.png',fullPage:true});
await p.click('text=위층으로');await p.waitForTimeout(300);
// 의심 바닥 50 확인: 냉수/침대 시도
await p.evaluate(()=>{const w=App.W.data;w.sus=55;w.room.rest='';App.save();});
await p.click('.door-card.d-m');await p.click('.tab:has-text("쉬기")');await p.click('text=눕기');await p.waitForTimeout(3200);
log('sus after rest (floor 50)',await p.evaluate(()=>App.W.data.sus));
await p.click('.plus-head .btn');await p.click('.door-card.d-u');await p.waitForTimeout(200);log('ug banned msg',await p.textContent('#scrPlus .panel h3'));
log('titles',await p.evaluate(()=>Object.keys(App.W.data.titles)),'count',await p.evaluate(()=>Plus.TITLES.length));
// 모바일
const m=await mk({width:390,height:800});const q=await m.newPage();q.on('pageerror',e=>errs.push('m:'+e.message));
await q.goto('https://casino.test/x.html');await q.waitForTimeout(300);await q.fill('#loginId','yh20507');await q.fill('#loginPw','secret12');await q.click('text=로그인');await q.waitForTimeout(700);await q.click('#enter');await q.waitForTimeout(2500);
for(const [d,nm] of [['d-k','bc'],['d-l','sl']]){await q.evaluate(()=>{App.show('scrLobby');App.renderLobby();});await q.waitForTimeout(200);await q.click('.door-card.'+d);await q.waitForTimeout(300);log('mobile',nm,await q.evaluate(()=>document.documentElement.scrollWidth));await q.screenshot({path:'m_'+nm+'.png',fullPage:true});}
await q.evaluate(()=>{App.W.data.wheel.day='';Plus.wheel.open();});await q.waitForTimeout(300);log('mobile wheel',await q.evaluate(()=>document.documentElement.scrollWidth));await q.screenshot({path:'m_wheel.png',fullPage:true});
log('errors',errs);await b.close();})();
