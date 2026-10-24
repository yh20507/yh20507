const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const users={};const wallets={};let n=0;
async function mk(vp){const ctx=await b.newContext({viewport:vp||{width:1100,height:900}});
await ctx.route('https://omofqvclwetstbuoumzg.supabase.co/**',async r=>{const u=new URL(r.request().url());const m=r.request().method();const body=r.request().postData()?JSON.parse(r.request().postData()):null;
 const J=(s,o)=>r.fulfill({status:s,contentType:'application/json',body:JSON.stringify(o)});
 const auth=r.request().headers()['authorization']||'';const uid=auth.startsWith('Bearer tok-')?auth.slice(11):null;
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
const errs=[];
async function run(id,vp){const ctx=await mk(vp);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('https://casino.test/x.html');await p.waitForTimeout(500);
await p.fill('#loginId',id);await p.fill('#loginPw','secret12');await p.click('text=처음이에요 (가입)');await p.waitForTimeout(600);await p.click('#enter');await p.waitForTimeout(1400);
for(let i=0;i<5;i++){await p.click('.topbar .brand');await p.waitForTimeout(80);}await p.waitForTimeout(300);
const t=await p.textContent('#ovBox h2').catch(()=>null);const vis=await p.isVisible('#ov');return {p,t,vis};}
const A=await run('YH20507');console.log('admin dialog:',A.vis,A.t);
await A.p.screenshot({path:'adm_desk.png'});
const inputs=await A.p.$$('#ovBox input[type=number]');await inputs[0].fill('5000');
await A.p.check('#ovBox .adm-check input >> nth=0');
await A.p.click('#ovBox .btn.gold');await A.p.waitForTimeout(800);
const uid=users['yh20507@player.velvet-casino.com'].id;console.log('top chips',await A.p.textContent('#wChips'),'server',wallets[uid].data.chips,'perm',JSON.stringify(wallets[uid].data.perm));
const B=await run('friend1');console.log('friend dialog visible:',B.vis);
const M=await run('yh20507x',{width:390,height:760});console.log('other id mobile:',M.vis);
// mobile admin
users['yh20507@player.velvet-casino.com']; 
const ctx3=await mk({width:390,height:760});const p3=await ctx3.newPage();p3.on('pageerror',e=>errs.push(e.message));await p3.goto('https://casino.test/x.html');await p3.waitForTimeout(500);
await p3.fill('#loginId','yh20507');await p3.fill('#loginPw','secret12');await p3.click('text=로그인');await p3.waitForTimeout(600);await p3.click('#enter');await p3.waitForTimeout(1400);
for(let i=0;i<5;i++){await p3.click('.topbar .brand');await p3.waitForTimeout(80);}await p3.waitForTimeout(300);
console.log('mobile admin',await p3.isVisible('#ov'),'scrollW',await p3.evaluate(()=>document.documentElement.scrollWidth));
await p3.screenshot({path:'adm_mob.png'});
console.log('errors',errs);await b.close();})();
