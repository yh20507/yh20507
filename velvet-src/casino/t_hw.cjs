// 할로윈 이벤트 시험: node t_hw.cjs  (playwright + 가짜 Supabase, 그림은 ../../velvet/hw 에서)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const SRC=__dirname+'/벨벳카지노.html', HWDIR=path.join(__dirname,'../../velvet/hw/');
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
await ctx.route('https://casino.test/**',r=>{const u=new URL(r.request().url());
  if(u.pathname.startsWith('/hw/')){const f=HWDIR+path.basename(u.pathname);return fs.existsSync(f)?r.fulfill({status:200,contentType:'image/webp',body:fs.readFileSync(f)}):r.fulfill({status:404,body:''});}
  return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync(SRC,'utf8')});});
return ctx;}
const errs=[];const log=(...a)=>console.log(...a);let ok=true;const check=(name,cond)=>{log((cond?'OK  ':'FAIL')+' '+name);if(!cond)ok=false;};
const ctx=await mk();const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.stack||e.message));p.on('console',m=>{if(m.type()==='error'&&!/503/.test(m.text()))errs.push('console:'+m.text());});
// 이벤트를 날짜와 상관없이 켠다 (관리자 "미리 열기"와 같은 효과)
await p.addInitScript(()=>{const t=Date.parse('2026-10-28T20:00:00+09:00'), off=t-Date.now(), N=Date.now;Date.now=()=>N()+off;});
await p.goto('https://casino.test/x.html');await p.waitForTimeout(400);
check('door themed', await p.evaluate(()=>document.querySelector('#door').classList.contains('halloween')));
await p.fill('#loginId','yh20507');await p.fill('#loginPw','secret12');await p.click('text=처음이에요 (가입)');await p.waitForTimeout(800);
await p.screenshot({path:'hw_door.png'});
await p.click('#enter');await p.waitForTimeout(700);await p.screenshot({path:'hw_door_bats.png'});
await p.waitForTimeout(800);await p.screenshot({path:'hw_door_open.png'});
await p.waitForTimeout(1200);
check('door gone', await p.evaluate(()=>document.querySelector('#door').hidden));
check('popup shown', (await p.textContent('#ovBox h2').catch(()=>''))==='벨벳 할로윈 축제');
await p.screenshot({path:'hw_popup.png'});
await p.click('text=오늘 하루 보지 않기');await p.waitForTimeout(200);
check('popup hidden today', await p.evaluate(()=>HW.H().popDay===App.dayKey()));
await p.evaluate(()=>{const w=App.W.data;w.chips=50000;w.wheel.day=App.dayKey();App.save();App.show('scrLobby');App.renderLobby();});await p.waitForTimeout(300);
check('banner', !!(await p.$('.hw-banner')));check('door card', !!(await p.$('.door-card.d-hw')));check('candy stat', await p.isVisible('#wCandy'));
await p.screenshot({path:'hw_lobby.png'});
// 사탕: 이긴 판 칩 30개당 1개
const c0=await p.evaluate(()=>HW.H().candy);
await p.evaluate(()=>Plus.settle({game:'roulette',net:300,staked:10,folded:false}));
check('candy +10 from 300 win', (await p.evaluate(()=>HW.H().candy))-c0===10);
await p.evaluate(()=>Plus.settle({game:'roulette',net:-200,staked:200,folded:false}));
check('no candy on loss', (await p.evaluate(()=>HW.H().candy))-c0===10);
// 바구니·랜턴
await p.evaluate(()=>{const x=HW.H();x.items.basket=1;x.items.lantern=1;HW.useEv('basket');HW.useEv('lantern');});
const c1=await p.evaluate(()=>HW.H().candy);
await p.evaluate(()=>Plus.settle({game:'blackjack',net:300,staked:100,folded:false}));
check('basket +50% (15)', (await p.evaluate(()=>HW.H().candy))-c1===15);
await p.evaluate(()=>Plus.settle({game:'blackjack',net:-300,staked:300,folded:false}));
check('lantern on loss (10)', (await p.evaluate(()=>HW.H().candy))-c1===25);
// 빗자루·망토·날개
const l0=await p.evaluate(()=>Plus.luckP());
await p.evaluate(()=>{const x=HW.H();x.items.broom=1;x.items.cloak=1;x.items.wings=1;HW.useEv('broom');HW.useEv('cloak');HW.useEv('wings');});
check('broom luck +0.2', Math.abs((await p.evaluate(()=>Plus.luckP()))-l0-0.2)<1e-9);
check('cloak sus 0', (await p.evaluate(()=>Plus.susGain(35)))===0 && (await p.evaluate(()=>Plus.susGain(35)))>0);
const ch0=await p.evaluate(()=>App.W.data.chips);
const ret=await p.evaluate(()=>Plus.settle({game:'roulette',net:90,staked:10,folded:false}));
check('wings +10% of 100 back', (await p.evaluate(()=>App.W.data.chips))-ch0===10);
// 과제
const ms=await p.evaluate(()=>HW.missions().list.map(q=>q.id));check('3 missions', ms.length===3);
// 확률·천장 (화면 밖 계산)
const sim=await p.evaluate(()=>{const pity={cos:0,leg:0,ult:0};const N=600000;const c={};let gapC=0,gapL=0,gapU=0,maxC=0,maxL=0,maxU=0;
  for(let i=0;i<N;i++){const r=HW.roll(pity);const k=r.pick?'ticket':r.kind==='cos'?'cos_'+r.g:r.kind;c[k]=(c[k]||0)+1;
    gapC++;gapL++;gapU++;if(r.kind==='cos'){maxC=Math.max(maxC,gapC);gapC=0;if(r.g==='l'||r.g==='u'){maxL=Math.max(maxL,gapL);gapL=0;}if(r.g==='u'){maxU=Math.max(maxU,gapU);gapU=0;}}}
  const pct={};for(const k in c)pct[k]=+(c[k]/N*100).toFixed(3);return {pct,maxC,maxL,maxU};});
log('sim',JSON.stringify(sim));
check('max gap without costume <= 40', sim.maxC<=40);check('max gap without legend <= 150', sim.maxL<=150);
check('ultra rare ~0.05% natural', sim.pct.cos_u>0.03&&sim.pct.cos_u<0.075);check('max gap without ultra <= 300', sim.maxU<=300);check('black chip ~0.1%', sim.pct.bc>0.07&&sim.pct.bc<0.13);
// 축제 화면 + 뽑기
await p.evaluate(()=>{HW.H().candy=20000;App.save();HW.open();});await p.waitForTimeout(400);
await p.screenshot({path:'hw_screen.png',fullPage:true});
await p.click('text=한 번 젓기');await p.waitForTimeout(600);await p.screenshot({path:'hw_brew.png'});
await p.waitForTimeout(1500);await p.screenshot({path:'hw_one.png'});
check('one result overlay', !!(await p.$('.hw-pull.one')));
await p.click('.hw-pull button:text-is("닫기")');await p.waitForTimeout(200);
await p.click('text=10+1');await p.waitForTimeout(2600);await p.screenshot({path:'hw_ten_mid.png'});
await p.waitForTimeout(3500);await p.click('.hw-pull button:text-is("모두 열기")').catch(()=>{});await p.waitForTimeout(800);
await p.screenshot({path:'hw_ten.png'});
check('11 cards', (await p.$$('.hw-pull .hw-flip')).length===11);
await p.click('.hw-pull button:text-is("닫기")');await p.waitForTimeout(200);
// 10+1 보장 확인 (200번)
const sure=await p.evaluate(()=>{HW.H().candy=300000;let bad=0;for(let i=0;i<200;i++){const r=HW.pull(11);if(!r.some(x=>x.kind==='ev'||x.kind==='cos'))bad++;}return bad;});
check('10+1 always has event item', sure===0);
// 초레어 연출
await p.evaluate(()=>{HW.H().candy=1000;window._R=Math.random;const roll=HW.roll;HW._rollOnce=true;Math.random=()=>{const st=new Error().stack||'';if(HW._rollOnce&&st.includes('roll')){HW._rollOnce=false;return 0.0001;}return window._R();};});
await p.evaluate(()=>HW.render());await p.waitForTimeout(200);
await p.click('text=한 번 젓기');await p.evaluate(()=>{Math.random=window._R;});await p.waitForTimeout(1900);await p.screenshot({path:'hw_ultra_seq.png'});
await p.waitForTimeout(1600);await p.screenshot({path:'hw_ultra.png'});
check('ultra stat', (await p.evaluate(()=>App.W.data.st.hwUltra||0))>=1);
await p.click('.hw-pull button:text-is("닫기")').catch(()=>{});await p.waitForTimeout(200);
// 초레어 천장: 299번 뒤 다음 한 번은 선택권
await p.evaluate(()=>{const x=HW.H();x.candy=100;x.ult=0;x.pity.ult=299;HW.render();});await p.waitForTimeout(200);
await p.click('text=한 번 젓기');await p.waitForTimeout(1300);await p.screenshot({path:'hw_omen.png'});
await p.waitForTimeout(3600);await p.screenshot({path:'hw_ticket.png'});
check('ticket granted', (await p.evaluate(()=>HW.H().ult))===1);
await p.click('.hw-pull button:text-is("초레어 고르기")');await p.waitForTimeout(300);
await p.screenshot({path:'hw_pick.png'});
const ownBefore=await p.evaluate(()=>!!HW.H().own.luna_cat);
await p.click('#ovBox .hw-cos:has-text("검은 고양이")');await p.waitForTimeout(1200);
check('ticket used', (await p.evaluate(()=>HW.H().ult))===0);
await p.screenshot({path:'hw_pick_done.png'});
await p.click('.hw-pull button:text-is("닫기")').catch(()=>{});await p.waitForTimeout(200);
log('picked luna_cat (owned before:',ownBefore,')');
// 예전 지갑 이주: 초레어 없이 1,800번 뽑은 사람은 다음 한 번이 천장
const mig=await p.evaluate(()=>{const w=App.W.data;const keep=JSON.stringify(w.hw);const own={};for(const k in w.hw.own)if(HW.COS_BY[k].g!=='u')own[k]=1;
  w.hw=Object.assign(JSON.parse(keep),{_v:1,own,pity:{cos:3,leg:9}});w.st.hwPull=1800;const r=HW.H().pity.ult;w.hw=JSON.parse(keep);w.hw._v=2;return r;});
check('migration backfills ult to 299', mig===299);
// 검은 칩: 0개 1%, 1개 3%, 2개 4%, 11개 이상 13%
const bc=await p.evaluate(()=>{App.W.data.eq=null;return [0,1,2,5,11,30].map(n=>+Plus.t13.chance(n).toFixed(4));});
log('t13 chance',bc);check('black chip ladder', JSON.stringify(bc)==='[0.01,0.03,0.04,0.07,0.13,0.13]');
check('black chip cap 13%', (await p.evaluate(()=>Plus.t13.chance(30)))<=0.13+1e-9);
await p.evaluate(()=>{const w=App.W.data;w.inv.blackchip=5;w.t13.on=true;w.t13.done=false;w.t13.day=App.dayKey();App.save();App.show('scrLobby');App.renderLobby();});await p.waitForTimeout(300);
await p.click('.t13-door');await p.waitForTimeout(600);
check('black chips gone on entering 13', (await p.evaluate(()=>App.W.data.inv.blackchip||0))===0);
await p.click('.plus-head .btn').catch(()=>{});await p.evaluate(()=>{Plus.stopAll();App.show('scrLobby');App.renderLobby();});await p.waitForTimeout(300);
// 옷장: 전부 받고 입기
await p.evaluate(()=>{const x=HW.H();for(const c of HW.COS)x.own[c.id]=x.own[c.id]||1;App.save();});
await p.evaluate(()=>{Plus.open('room');});await p.click('.tab:has-text("옷장")');await p.waitForTimeout(300);
await p.screenshot({path:'hw_closet.png',fullPage:true});
for(const id of ['card_moon','tb_moss','pt_vampire','fr_flame','luna_cat','noel_ghost']) await p.click('.hw-cos:has-text("'+{card_moon:'붉은 달 카드',tb_moss:'묘지 이끼',pt_vampire:'뱀파이어',fr_flame:'보랏빛 불꽃',luna_cat:'검은 고양이',noel_ghost:'유령 집사'}[id]+'")');
await p.waitForTimeout(300);
const eq=await p.evaluate(()=>HW.H().eq);log('eq',JSON.stringify(eq));check('equipped 6', Object.values(eq).filter(Boolean).length===6);
check('portrait in topbar', !!(await p.$('#wPortrait img')));
await p.screenshot({path:'hw_closet_on.png'});
// 테이블들
await p.evaluate(()=>{App.show('scrLobby');App.renderLobby();App.sitPoker('holdem',App.TIERS.holdem[0],400);});await p.waitForTimeout(900);
await p.screenshot({path:'hw_holdem.png',fullPage:true});
check('portrait on my plate', !!(await p.$('.seat .nm .hw-pt')));
await p.evaluate(()=>{App.leaveTable();Plus.seotda.open();});await p.click('text=일반 앉기');await p.waitForTimeout(900);await p.screenshot({path:'hw_seotda.png',fullPage:true});
await p.evaluate(()=>{Plus.stopAll();Plus.roulette.open();});await p.waitForTimeout(300);await p.screenshot({path:'hw_roulette.png',fullPage:true});
check('roulette hub image', !!(await p.$('.wheel image')));
await p.evaluate(()=>Plus.slots.open());await p.waitForTimeout(300);await p.screenshot({path:'hw_slots.png',fullPage:true});
// 승리 효과
for(const fx of ['fx_bats','fx_candy','fx_ghost','fx_fire']){await p.evaluate(f=>HW.playFx(f),fx);await p.waitForTimeout(900);await p.screenshot({path:'hw_'+fx+'.png'});await p.waitForTimeout(2000);}
// 바: 루나 첫 만남
await p.evaluate(()=>{App.W.data.chips=5000;Plus.bar.open();});await p.waitForTimeout(500);
check('intro', !!(await p.$('.hw-intro')));await p.screenshot({path:'hw_intro.png',fullPage:true});
for(let i=0;i<14;i++){const btn=await p.$('.hw-intro .btn.gold');if(!btn)break;await btn.click();await p.waitForTimeout(150);}
check('met', await p.evaluate(()=>HW.H().met));
await p.click('text=50칩 내고 앉기');await p.waitForTimeout(300);
for(const t of ['루나 안녕?','13번 테이블 알아요?','오늘 의상 예쁘네']){await p.fill('#barIn',t);await p.click('text=말하기');await p.waitForTimeout(1500);}
const chat=await p.$$eval('.msg',e=>e.map(x=>x.className+': '+x.innerText.replace(/\n/g,' ')));log(chat.join('\n'));
check('luna spoke', chat.some(x=>x.startsWith('msg luna')));
await p.screenshot({path:'hw_bar.png',fullPage:true});
// 관리자: 끝난 상태 보기
await p.evaluate(()=>{Plus.stopAll();App.show('scrLobby');App.renderLobby();});await p.waitForTimeout(200);
for(let i=0;i<5;i++)await p.click('.topbar .brand');await p.waitForTimeout(300);
check('admin has hw rows', !!(await p.$('#hwForce')));if(!(await p.$('#hwForce'))){log('DBG ov',await p.evaluate(()=>[document.querySelector('#ov').hidden,document.querySelector('#ovBox').innerText.slice(0,200),!!App.S,App.W.frozen]),errs);}
await p.selectOption('#hwForce','off');await p.fill('#hwCandyIn','777');await p.click('#ovBox .btn.gold:text-is("적용")');await p.waitForTimeout(400);
check('no banner when off', !(await p.$('.hw-banner')));
check('end dialog', (await p.textContent('#ovBox h2').catch(()=>''))==='할로윈 축제가 끝났어요');
await p.screenshot({path:'hw_end.png'});
const chE=await p.evaluate(()=>App.W.data.chips);await p.click('text=388칩으로 바꾸기');await p.waitForTimeout(200);
check('exchange 777 -> 388 chips', (await p.evaluate(()=>App.W.data.chips))-chE===388 && (await p.evaluate(()=>HW.H().candy))===1);
check('wardrobe stays', await p.evaluate(()=>!!HW.H().eq.card && document.documentElement.classList.contains('hw-cb')));
await p.evaluate(()=>{Plus.bar.open();});await p.waitForTimeout(300);check('no luna after event', !(await p.$('.hw-bar .luna')));
// 칭호
log('titles',await p.evaluate(()=>Object.keys(App.W.data.titles).filter(k=>k.startsWith('hw_'))));
// 저장된 지갑에 사탕·옷장이 있는지
await p.waitForTimeout(800);
check('server has hw', !!(Object.values(wallets)[0]&&Object.values(wallets)[0].data.hw&&Object.values(wallets)[0].data.hw.own.card_moon));
// 모바일
const m=await mk({width:390,height:800});const q=await m.newPage();q.on('pageerror',e=>errs.push('m:'+e.message));
await q.addInitScript(()=>{const t=Date.parse('2026-10-28T20:00:00+09:00'), off=t-Date.now(), N=Date.now;Date.now=()=>N()+off;});
await q.goto('https://casino.test/x.html');await q.waitForTimeout(400);
await q.fill('#loginId','mobile1');await q.fill('#loginPw','secret12');await q.click('text=처음이에요 (가입)');await q.waitForTimeout(800);
await q.click('#enter');await q.waitForTimeout(3000);await q.screenshot({path:'hwm_popup.png'});
await q.evaluate(()=>{App.closeDialog();App.W.data.wheel.day=App.dayKey();HW.H().candy=3000;App.show('scrLobby');App.renderLobby();});await q.waitForTimeout(300);
const sw=async(nm)=>{const v=await q.evaluate(()=>document.documentElement.scrollWidth);log('mobile',nm,'scrollW',v);check('mobile '+nm+' no h-scroll',v<=390);};
await q.screenshot({path:'hwm_lobby.png',fullPage:true});await sw('lobby');
await q.evaluate(()=>HW.open());await q.waitForTimeout(300);await q.screenshot({path:'hwm_screen.png',fullPage:true});await sw('event');
await q.click('text=10+1');await q.waitForTimeout(1500);await q.click('.hw-pull button:text-is("모두 열기")').catch(()=>{});await q.waitForTimeout(900);await q.screenshot({path:'hwm_ten.png'});await sw('ten');
await q.click('.hw-pull button:text-is("닫기")');
await q.evaluate(()=>{const x=HW.H();for(const c of HW.COS)x.own[c.id]=1;Plus.open('room');});await q.click('.tab:has-text("옷장")');await q.waitForTimeout(300);await q.screenshot({path:'hwm_closet.png',fullPage:true});await sw('closet');
await q.evaluate(()=>{App.W.data.chips=500;Plus.bar.open();});await q.waitForTimeout(300);await q.screenshot({path:'hwm_bar.png',fullPage:true});await sw('bar');
log('errors',errs);check('no page errors',errs.length===0);
log(ok?'ALL OK':'SOME FAILED');
await b.close();})();
