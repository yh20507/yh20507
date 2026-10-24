const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const users={};const wallets={};let n=0;
async function mk(){const ctx=await b.newContext({viewport:{width:1100,height:900}});
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
const c1=await mk(),c2=await mk();
const errs=[];const P=async(ctx=c1)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('https://casino.test/x.html');await p.waitForTimeout(500);return p;};
const A=await P();
await A.fill('#loginId','tester');await A.fill('#loginPw','abc');await A.click('text=로그인');await A.waitForTimeout(200);console.log('short pw msg:',await A.textContent('.login .note'));
await A.fill('#loginPw','secret12');await A.click('text=처음이에요 (가입)');await A.waitForTimeout(600);
await A.click('#enter');await A.waitForTimeout(1400);console.log('A chips',await A.textContent('#wChips'),'|',await A.textContent('#wSave'),'| logout visible:',await A.isVisible('#wLogout'));
// play one blackjack hand to save
await A.click('.path:nth-child(3) .btn.gold');await A.waitForTimeout(200);await A.click('.presets .btn >> nth=1');await A.click('.hand-panel .btn:text-is("딜")');await A.waitForTimeout(300);
if(await A.$('.hand-panel .btn:text-is("스탠드")'))await A.click('.hand-panel .btn:text-is("스탠드")');await A.waitForTimeout(800);
console.log('server wallet chips after hand:',wallets.uid1.data.chips,'A shows',await A.textContent('#wChips'));
// reload: should stay logged in
await A.reload();await A.waitForTimeout(800);console.log('after reload login form shown?',!!(await A.$('.login')),'enter visible',await A.isVisible('#enter'));
await A.click('#enter');await A.waitForTimeout(1300);
// other device
const B=await P(c2);await B.fill('#loginId','tester');await B.fill('#loginPw','wrongpw');await B.click('text=로그인');await B.waitForTimeout(300);console.log('wrong pw msg:',await B.textContent('.login .note'));
await B.fill('#loginPw','secret12');await B.click('text=로그인');await B.waitForTimeout(700);await B.click('#enter');await B.waitForTimeout(1300);console.log('B chips',await B.textContent('#wChips'));
// A tries to save -> should freeze
await A.click('.path:nth-child(3) .btn.gold');await A.waitForTimeout(200);await A.click('.presets .btn >> nth=1');await A.click('.hand-panel .btn:text-is("딜")');await A.waitForTimeout(1200);
console.log('A dialog:',await A.textContent('#ovBox h2').catch(()=>'none'));
console.log('errors',errs);await b.close();})();
