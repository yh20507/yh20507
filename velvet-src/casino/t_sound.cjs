// 소리 시험: node t_sound.cjs [미리듣기 폴더]
// 모든 소리를 스피커 없이 만들어 보고(크기·찢어짐·무음 검사), 미리듣기 wav 를 저장한다. 화면 연결도 확인한다.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const SRC=__dirname+'/벨벳카지노.html', OUT=process.argv[2]||'';
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const users={};const wallets={};let n=0;
const ctx=await b.newContext({viewport:{width:1180,height:900}});
await ctx.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:''}));
await ctx.route('https://omofqvclwetstbuoumzg.supabase.co/**',async r=>{const u=new URL(r.request().url());const m=r.request().method();const body=r.request().postData()?JSON.parse(r.request().postData()):null;
 const J=(s,o)=>r.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
 const auth=r.request().headers()['authorization']||'';const uid=auth.startsWith('Bearer tok-')?auth.slice(11):null;
 if(u.pathname.startsWith('/functions/'))return J(503,{error:'no_key'});
 if(u.pathname==='/auth/v1/signup'){const id='uid'+(++n);users[body.email]={id};return J(200,{access_token:'tok-'+id,refresh_token:'r',expires_in:3600,user:{id}});}
 if(u.pathname==='/rest/v1/wallets'){const id=(u.searchParams.get('user_id')||'').replace('eq.','')||uid;
   if(m==='GET')return J(200,wallets[id]?[{data:wallets[id].data}]:[]);
   if(m==='POST'){wallets[uid]={data:body.data,sid:body.sid};return r.fulfill({status:201,body:''});}
   if(m==='PATCH'){Object.assign(wallets[id],body);return J(200,[{user_id:id}]);}}
 return J(404,{});});
await ctx.route('https://casino.test/**',r=>{const u=new URL(r.request().url());if(u.pathname.startsWith('/hw/'))return r.fulfill({status:404,body:''});return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync(SRC,'utf8')});});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.stack||e.message));
let ok=true;const check=(nm,c)=>{console.log((c?'OK  ':'FAIL')+' '+nm);if(!c)ok=false;};
await p.goto('https://casino.test/x.html');await p.waitForTimeout(400);
await p.fill('#loginId','yh20507');await p.fill('#loginPw','secret12');await p.click('text=처음이에요 (가입)');await p.waitForTimeout(700);
await p.click('#enter');await p.waitForTimeout(3500);
await p.evaluate(()=>{App.closeDialog();const w=App.W.data;w.chips=50000;w.wheel.day=App.dayKey();App.save();App.show('scrLobby');App.renderLobby();});
check('audio started', await p.evaluate(()=>!!Snd.ctx&&Snd.ctx.state==='running'));
// 모든 소리를 만들어 보고 검사
const list=[['sfx','check',1],['sfx','call',1],['sfx','raise',1.2],['sfx','allin',2],['sfx','fold',0.8],['sfx','win',2],['sfx','broke',22],['sfx','clue',3.5],['sfx','buy',1.5],['sfx','gavel',1.5],['sfx','curse',4],['sfx','contract',4.5],['sfx','caught',6],['sfx','spin',2.5],['sfx','click',1],['sfx','gun',3.5],['sfx','omen',3],
  ['heart',62,8],['heart',118,6],['track','halloween',60],['track','bar',45],['track','auction',30],['track','under',40],['track','lobby_jazz',40],['track','lobby_classic',72]];
for(const [k,nm,secs] of list){
  const r=await p.evaluate(async([k,nm,secs])=>{const buf=await Snd.render(k,nm,secs);const a=buf.getChannelData(0),c=buf.getChannelData(1);let pk=0,sum=0,nan=0,last=0;
    for(let i=0;i<a.length;i++){const v=Math.max(Math.abs(a[i]),Math.abs(c[i]));if(!(v===v)){nan++;continue;}if(v>pk)pk=v;sum+=a[i]*a[i];if(v>0.001)last=i;}
    // wav
    const sr=buf.sampleRate,len=a.length,ab=new ArrayBuffer(44+len*4),dv=new DataView(ab);const W=(o,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(o+i,s.charCodeAt(i));};
    W(0,'RIFF');dv.setUint32(4,36+len*4,true);W(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,2,true);dv.setUint32(24,sr,true);dv.setUint32(28,sr*4,true);dv.setUint16(32,4,true);dv.setUint16(34,16,true);W(36,'data');dv.setUint32(40,len*4,true);
    for(let i=0;i<len;i++){dv.setInt16(44+i*4,Math.max(-1,Math.min(1,a[i]))*32767,true);dv.setInt16(46+i*4,Math.max(-1,Math.min(1,c[i]))*32767,true);}
    let bin='';const u8=new Uint8Array(ab);for(let i=0;i<u8.length;i+=0x8000)bin+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));
    return {pk:+pk.toFixed(3),rms:+Math.sqrt(sum/a.length).toFixed(4),nan,tail:+(last/sr).toFixed(2),wav:btoa(bin)};},[k,nm,secs]);
  console.log(String(k).padEnd(6),String(nm).padEnd(10),'peak',r.pk,'rms',r.rms,'last sound at',r.tail+'s');
  check(nm+' not silent',r.rms>0.002);check(nm+' no clipping',r.pk<=1.0);check(nm+' no NaN',r.nan===0);
  if(OUT){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,k+'_'+nm+'.wav'),Buffer.from(r.wav,'base64'));}
}
// 화면에 따라 배경음이 바뀌는지
const mus=async()=>{await p.waitForTimeout(700);return p.evaluate(()=>Snd.music);};
await p.evaluate(()=>{HW.H().force='on';HW.apply();});check('lobby halloween', (await mus())==='halloween');
await p.evaluate(()=>Plus.bar.open());check('bar jazz', (await mus())==='bar');
await p.evaluate(()=>Plus.auction.open());check('auction', (await mus())==='auction');
await p.evaluate(()=>{App.W.data.st.t13Visit=1;Plus.under.open();});check('under', (await mus())==='under');
await p.evaluate(()=>{Plus.stopAll();App.show('scrLobby');App.renderLobby();});check('back to lobby', (await mus())==='halloween');
await p.evaluate(()=>{HW.H().force='off';HW.apply();});check('no event: lobby music', (await mus())==='lobby' && ['lobby_jazz','lobby_classic'].includes(await p.evaluate(()=>Snd.track)));
// 13번 테이블: 배경음 없이 심장, 내 차례면 빨라짐
await p.evaluate(()=>{const w=App.W.data;Plus.t13.adminOpen();App.save();App.show('scrLobby');App.renderLobby();});await p.waitForTimeout(200);
await p.click('.t13-door');await p.waitForTimeout(900);
check('t13 silence + heart 62', (await p.evaluate(()=>[Snd.music,Snd.heartBpm])).join()===',62');
await p.waitForTimeout(6000);await p.click('text=앉는다');await p.waitForTimeout(4500);
const hb=await p.evaluate(()=>Snd.heartBpm);console.log('heart during turn',hb);check('heart changes by turn', hb===118||hb===80||hb===0||hb===56);
await p.evaluate(()=>{Plus.stopAll();App.show('scrLobby');App.renderLobby();});await p.waitForTimeout(800);
check('heart stops after leaving', (await p.evaluate(()=>Snd.heartBpm))===0);
// 포커 소리 연결 (오류 없이)
await p.evaluate(()=>{App.sitPoker('holdem',App.TIERS.holdem[0],400);});await p.waitForTimeout(5000);
await p.evaluate(()=>{App.leaveTable();});
// 음량 조절
await p.click('#wSnd');await p.waitForTimeout(200);check('volume panel', await p.isVisible('#sndPop'));
await p.screenshot({path:(OUT||'.')+'/volume.png'});
const sl=await p.$$('#sndPop input[type=range]');check('3 sliders', sl.length===3);
await sl[1].fill('20');await sl[1].dispatchEvent('change');
check('bgm saved', await p.evaluate(()=>JSON.parse(localStorage.getItem('velvet-sound-v1')).bgm===20));
await p.keyboard.press('Escape');check('panel closes', !(await p.isVisible('#sndPop')));
// 모바일 위쪽 막대
await p.setViewportSize({width:390,height:800});await p.waitForTimeout(200);
check('mobile no h-scroll', (await p.evaluate(()=>document.documentElement.scrollWidth))<=390);
await p.click('#wSnd');await p.waitForTimeout(200);await p.screenshot({path:(OUT||'.')+'/volume_mobile.png'});
const box=await p.$eval('#sndPop',e=>{const r=e.getBoundingClientRect();return [r.left,r.right];});check('mobile panel on screen', box[0]>=0&&box[1]<=390);
console.log('errors',errs);check('no page errors',errs.length===0);
console.log(ok?'ALL OK':'SOME FAILED');await b.close();})();
