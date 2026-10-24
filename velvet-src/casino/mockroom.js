(function(){
const UID = (new URLSearchParams(location.search)).get('uid') || 'u_anon';
function makeRoom(name){
  const bc = new BroadcastChannel('mr-'+name);
  const me = Math.random().toString(36).slice(2,10);
  const peers = new Map(); const evL = {}; const pL = new Set();
  const self = {peer:me, by:UID, isMe:true, sameTab:true, kind:'viewer', guest:false, presence:{}, updatedAt:Date.now()};
  peers.set(me, self);
  const notify=(joined=[],left=[],updated=[])=>{const arr=Object.freeze([...peers.values()]);for(const f of pL)setTimeout(()=>f({peers:arr,joined,left,updated}),0);};
  bc.onmessage=(e)=>{const m=e.data; if(m.peer===me)return;
    if(m.t==='hello'||m.t==='pres'){const ex=peers.get(m.peer);const p={peer:m.peer,by:m.by,isMe:false,sameTab:false,kind:'viewer',guest:false,presence:m.presence||{},updatedAt:Date.now()};peers.set(m.peer,p);notify(ex?[]:[p],[],ex?[p]:[]);if(m.t==='hello')bc.postMessage({t:'pres',peer:me,by:UID,presence:self.presence});}
    else if(m.t==='bye'){const p=peers.get(m.peer);if(p){peers.delete(m.peer);notify([],[p]);}}
    else if(m.t==='ev'){(evL[m.topic]||[]).forEach(f=>f({topic:m.topic,data:m.data,peer:m.peer,by:m.by,isMe:false,sameTab:false,kind:'viewer',guest:false}));}
  };
  setTimeout(()=>bc.postMessage({t:'hello',peer:me,by:UID,presence:self.presence}),10);
  window.addEventListener('beforeunload',()=>bc.postMessage({t:'bye',peer:me}));
  const R={name,
    emit:async(topic,data)=>{const s=JSON.stringify(data||{});if(s.length>4096)console.error('EMIT TOO BIG',topic,s.length);window.__maxEmit=Math.max(window.__maxEmit||0,s.length);bc.postMessage({t:'ev',topic,data,peer:me,by:UID});(evL[topic]||[]).forEach(f=>setTimeout(()=>f({topic,data,peer:me,by:UID,isMe:true,sameTab:true}),0));},
    on:(topic,fn)=>{(evL[topic]=evL[topic]||[]).push(fn);return()=>{evL[topic]=evL[topic].filter(x=>x!==fn)};},
    presence:async(patch)=>{for(const k in patch){if(patch[k]===null)delete self.presence[k];else self.presence[k]=patch[k];}self.presence={...self.presence};bc.postMessage({t:'pres',peer:me,by:UID,presence:self.presence});notify([],[],[self]);},
    peers:()=>Object.freeze([...peers.values()]),
    onPeers:(fn)=>{pL.add(fn);setTimeout(()=>fn({peers:Object.freeze([...peers.values()]),joined:[...peers.values()],left:[],updated:[]}),0);return()=>pL.delete(fn);},
    connected:()=>true, onConnection:(f)=>{setTimeout(()=>f(true),0);return()=>{};},
    leave:async()=>{bc.postMessage({t:'bye',peer:me});bc.close();},
    join:async(n)=>makeRoom(n)};
  return R;
}
const lobby = makeRoom('lobby');
window.claude={use:async(n)=>{if(n==='room')return lobby;if(n==='user')return {id:async()=>UID,profiles:async(ids)=>Object.fromEntries([].concat(ids).map(i=>[i,{id:i,name:i==='u_host'?'호스트':'게스트',avatarUrl:'',color:'#888',email:null,isMe:i===UID,guest:false}])),me:async()=>({id:UID})};return null;}};
})();
