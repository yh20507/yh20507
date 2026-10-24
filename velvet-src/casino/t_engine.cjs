const C=require('./engine.js');const P=s=>s.split(' ').map(C.parse);
const ev=s=>C.evalHand(P(s));
const cases=[
 ['AS KS QS JS TS 2H 3D','로열 스트레이트 플러시'],
 ['5S 4S 3S 2S AS KD KH','5 스트레이트 플러시'],
 ['9H 9D 9S 9C 2D 3D 4D','9 포카드'],
 ['KH KD KS 2C 2D 3D 3S','K 풀하우스'],
 ['2H 7H 9H JH KH AS AD','K 플러시'],
 ['AH 2D 3C 4S 5H KD QD','5 스트레이트'],
 ['TH JD QC KS AH 2D 3D','A 스트레이트'],
 ['7H 7D 7S KC 2D 3D 9S','7 트리플'],
 ['7H 7D KS KC 2D 2S 9S','K·7 투페어'],
 ['7H 7D KS QC 2D 3S 9S','7 원페어'],
 ['AH 7D KS QC 2D 3S 9S','A 하이'],
];
let bad=0;for(const [h,n] of cases){const got=C.handName(ev(h));if(got!==n){bad++;console.log('BAD',h,got,'expected',n);}}
const cmp=[['AS AD KH QC JD','AH AC KD QS TD',1],['KH KD 2S 2C 9H','KS KC 2H 2D 8H',1],['7H 7D KS KC AD','7S 7C KH KD QD',1],['5H 4D 3S 2C AH','6H 5D 4S 3C 2H',-1],['2H 3H 4H 5H 7H','AS AD AH KS KD',-1],['AH AD 9S 9C 9H 8D 8S','9D 9S 9H AS AC KD KS',1]];
for(const [a,b,exp] of cmp){const r=Math.sign(ev(a)-ev(b));if(r!==exp){bad++;console.log('BAD cmp',a,b,r);}}
console.log('evaluator', bad?'FAIL':'OK');
// all-AI simulations
function sim(game,hands,seed,nseats){const r=C.mulberry(seed);const ps=['rock','bluffer','station','calc'];
 const seats=[];for(let i=0;i<nseats;i++)seats.push({id:'a'+i,name:'AI'+i,kind:'ai',persona:ps[i%4],stack:200});
 const t=C.makePoker(game,{sb:1,bb:2,ante:1,unit:2,seats,r});const total=()=>t.seats.reduce((a,s)=>a+s.stack+s.contrib*(t.phase==='done'?0:1),0);
 let played=0,showdowns=0,steps=0;
 for(let h=0;h<hands;h++){
   for(const s of t.seats){if(s.stack<=0){s.stack=200;}}
   const before=t.seats.reduce((a,s)=>a+s.stack,0);
   if(!C.newHand(t))break;played++;
   if(t.phase==='choose') for(const i of C.inHand(t)) C.aiChoose(t,i);
   let guard=0;while(t.phase==='bet'){if(++guard>500)throw new Error('stuck '+game);const ok=C.aiAct(t,t.toAct);if(!ok)throw new Error('illegal ai '+game+' '+t.toAct);steps++;}
   if(t.phase!=='done')throw new Error('phase '+t.phase);
   const after=t.seats.reduce((a,s)=>a+s.stack,0);
   if(after!==before)throw new Error('chips '+before+'->'+after+' hand '+h);
   if(t.results.showdown)showdowns++;
   // card uniqueness
   const all=[...t.board];for(const s of t.seats)all.push(...s.cards);if(new Set(all).size!==all.length)throw new Error('dup cards');
   if(game==='seven'){for(const i of C.inHand(t)){if(t.results.showdown&&t.seats[i].cards.length!==7)throw new Error('seven count '+t.seats[i].cards.length);}}
 }
 return {played,showdowns,steps};
}
let t0=Date.now();
console.log('holdem 6p',JSON.stringify(sim('holdem',400,1,6)),Date.now()-t0+'ms');t0=Date.now();
console.log('holdem 2p',JSON.stringify(sim('holdem',300,2,2)),Date.now()-t0+'ms');t0=Date.now();
console.log('seven 5p',JSON.stringify(sim('seven',300,3,5)),Date.now()-t0+'ms');t0=Date.now();
// side pot scenario: 3 players, different stacks, all in
{const r=C.mulberry(9);const t=C.makePoker('holdem',{sb:1,bb:2,unit:2,r,seats:[{id:'a',name:'A',stack:10},{id:'b',name:'B',stack:50},{id:'c',name:'C',stack:100}]});
 C.newHand(t);let g=0;while(t.phase==='bet'&&g++<20){const L=C.legal(t,t.toAct);C.act(t,t.toAct,{type:'raise',to:L.allTo});}
 console.log('sidepot results',JSON.stringify(t.results.winners),'stacks',t.seats.map(s=>s.stack).join(','),'sum',t.seats.reduce((a,s)=>a+s.stack,0));}
// blackjack sim
{const r=C.mulberry(5);const t=C.makeBJ({minBet:1,maxBet:50,r,seats:[{id:'p',name:'P',kind:'ai',stack:1000},{id:'q',name:'Q',kind:'ai',stack:1000}]});
 let net=0;for(let h=0;h<3000;h++){for(const s of t.seats){if(s.stack<10)s.stack=1000;C.bjBet(t,t.seats.indexOf(s),10);}
  const before=t.seats.map(s=>s.stack);C.bjDeal(t);let g=0;while(t.phase==='play'){if(g++>50)throw new Error('bj stuck');C.bjAI(t,t.turn.seat);}
  if(t.phase!=='done')throw new Error('bj phase');for(const x of t.results.res){if(t.seats[x.seat].stack-before[x.seat]!==x.net)throw new Error('bj net mismatch');net+=x.net;}t.phase='bet';}
 console.log('blackjack 6000 hands, player net per hand',(net/6000).toFixed(3),'(house edge should be small negative)');}
