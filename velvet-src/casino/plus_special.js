/* ===== 벨벳 카지노 · 확장 공간: 경매장, 13번 테이블, 바 ===== */
(() => {
  const A = App, P = Plus;
  const { h, $ } = A;
  const fmt = (n) => A.fmt(n);
  const W = () => A.W.data;
  const DAY = 864e5;
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ════════════════ 경매장 ════════════════
  const GRADE = { rare: '희귀', legend: '전설', curse: '저주', odd: '???' };
  const CAT = {
    glasses: { name: '금테 안경', grade: 'rare', base: 800, inv: true, perm: true, w: 8, desc: '포커에서 AI 손님의 자신감(패의 세기)이 보여요. 영구.' },
    fan: { name: '마담의 부채', grade: 'rare', base: 600, inv: true, w: 10, desc: '켜면 7일 동안, 내가 올리면 AI가 더 잘 접어요.' },
    coin: { name: '행운의 동전', grade: 'rare', base: 500, inv: true, w: 10, desc: '켜면 7일 동안, 질 때 10% 확률로 잃은 칩을 돌려받아요.' },
    shadow: { name: '그림자 딜러', grade: 'rare', base: 900, inv: true, perm: true, w: 8, desc: '블랙잭에서 15% 확률로 딜러의 엎은 카드가 비쳐요. 영구.' },
    box: { name: '봉인된 상자', grade: 'odd', base: 300, inv: true, w: 14, desc: '안에 뭐가 들었는지 아무도 몰라요.' },
    dice: { name: '피 묻은 주사위', grade: 'curse', base: 400, item: 1, w: 10, desc: '다음 판 득실이 3배. 이기든 지든.' },
    revolver: { name: '리볼버 한 발', grade: 'curse', base: 600, item: 1, w: 8, desc: '이기면 6배. 대신 6분의 1 확률로 들고 있는 칩 절반이 날아가요.' },
    contract: { name: '악마의 계약서', grade: 'curse', base: 1000, inv: true, w: 7, desc: '24시간 동안 이긴 칩 2배. 끝나면 번 칩의 30%를 회수, 다음 날 아침 지급 없음.' },
    monkey: { name: '원숭이 손', grade: 'curse', base: 1200, item: 5, w: 6, desc: '좋은 패를 보장해요. 지면 5배로 잃어요. 손가락 다섯 개, 마지막 하나는 무조건 대가를 치러요.' },
    bribe: { name: '뇌물 봉투', grade: 'legend', base: 1500, inv: true, w: 6, desc: '의심을 0으로. 3일 동안 의심 1.5배. 같은 주에 또 쓰면 반은 실패.' },
    watch: { name: '도박사의 회중시계', grade: 'legend', base: 2000, item: 3, w: 5, desc: '방금 진 판을 없던 일로. 세 번. 쓸 때마다 의심 +30.' },
    bottom: { name: '밑장 빼기', grade: 'legend', base: 3000, item: 1, w: 4, desc: '포카드 이상(섯다는 장땡 이상, 블랙잭은 블랙잭) 보장. 의심 +99.' },
    banker: { name: '은행가의 열쇠', grade: 'legend', base: 2500, inv: true, perm: true, w: 4, desc: '금고에 하루 2% 이자. 영구. 금고가 있어야 해요.' },
    blackchip: { name: '검은 칩 한 개', grade: 'odd', base: 1313, inv: true, w: 2, desc: '쓸 곳이 없는 이상한 칩.' }
  };
  const owned = (id) => { const w = W(), c = CAT[id]; return c.item ? (w.items[id] || 0) > 0 : (w.inv[id] || 0) > 0; };
  function lotsToday() {
    const w = W(), day = A.dayKey();
    if (w.auc.day === day && Array.isArray(w.auc.lots)) return w.auc.lots;
    const ids = Object.keys(CAT), lots = [];
    const pickOne = () => {
      const pool = ids.filter((k) => !lots.some((l) => l.id === k) && !(CAT[k].perm && owned(k)));
      let tot = pool.reduce((a, k) => a + CAT[k].w, 0), r = Math.random() * tot;
      for (const k of pool) { r -= CAT[k].w; if (r <= 0) return k; }
      return pool[0];
    };
    for (let i = 0; i < 3; i++) {
      const id = pickOne(), c = CAT[id];
      const used = [];
      const n = 2 + (Math.random() < 0.5 ? 1 : 0);
      const bidders = [];
      for (let k = 0; k < n; k++) {
        const free = A.ROSTER.filter(([nm]) => !used.includes(nm)); const [name, persona] = rand(free); used.push(name);
        const f = { calc: [0.85, 1.15], rock: [0.65, 1.0], bluffer: [0.5, 1.7], station: [0.95, 1.3] }[persona] || [0.8, 1.1];
        bidders.push({ name, persona, max: Math.round(c.base * (f[0] + Math.random() * (f[1] - f[0])) / 10) * 10 });
      }
      lots.push({ id, start: Math.round(c.base * (0.45 + Math.random() * 0.25) / 10) * 10, vip: i === 2 && Math.random() < 0.35, bidders });
    }
    w.auc = { day, lots, res: {} };
    A.save();
    return lots;
  }
  let AU = null; // 진행 중인 경매
  function openAuction() {
    const w = W();
    const lots = lotsToday();
    const el = P.screen('경매장', '매일 아침 6시에 물건 세 개가 올라와요. 마지막 입찰 뒤 10초 동안 아무도 안 부르면 낙찰.', 'au-screen');
    if (AU) return renderLive();
    const grid = h('div', { class: 'lots' });
    lots.forEach((l, i) => {
      const c = CAT[l.id], res = w.auc.res[i];
      const locked = l.vip && !w.perm.vip, have = (c.perm && owned(l.id)) || ((c.item || c.inv) && !c.perm && owned(l.id) && ['monkey', 'bottom', 'revolver', 'dice', 'watch', 'contract', 'bribe'].includes(l.id));
      grid.append(h('div', { class: 'lot g-' + c.grade + (res ? ' sold' : '') },
        h('div', { class: 'head' }, h('span', { class: 'ico', svg: A.icon(l.id, 30) }), h('div', null, h('small', { text: (l.vip ? 'VIP 비공개 · ' : '') + GRADE[c.grade] }), h('h3', { text: c.name }))),
        h('p', { text: c.desc }),
        h('div', { class: 'stat' }, '시작가 ', h('b', { text: fmt(l.start) }), ' · 경쟁자 ' + l.bidders.length + '명'),
        res ? h('div', { class: 'tag', text: res === 'me' ? '내가 낙찰' : res === 'none' ? '유찰' : '다른 손님 낙찰' })
          : h('button', { class: 'btn gold', disabled: locked || have, text: locked ? 'VIP 전용' : have ? '이미 가진 물건' : '입찰 참가', onclick: () => startLive(i) })));
    });
    el.append(grid);
    el.append(h('p', { class: 'note', text: '전설·저주 물건은 같은 걸 하나만 가질 수 있어요. 낙찰받은 물건은 내 방 장식장이나 테이블 가방에 들어가요. 되팔면 시작 기준가의 60%.' }));
  }
  function startLive(i) {
    const w = W(), l = lotsToday()[i];
    const k = 1 - (P.eff('auc') || 0);
    AU = { i, l, c: CAT[l.id], price: l.start, leader: null, ends: Date.now() + 12000, log: ['경매 시작 · ' + fmt(l.start) + '칩부터'], myBid: false, ai: l.bidders.map((b) => Object.assign({}, b, { max: Math.round(b.max * k) })), done: false };
    P.onLeave(() => { if (AU && !AU.done) finish(true); AU = null; }, 'au');
    void w;
    renderLive(); loop();
  }
  const step = (p) => Math.max(10, Math.round(p * 0.05 / 10) * 10);
  function bid(who, amount) {
    AU.price = amount; AU.leader = who; AU.ends = Math.max(AU.ends, Date.now() + 10000);
    if (Date.now() + 10000 > AU.ends) AU.ends = Date.now() + 10000;
    AU.log.push((who === 'me' ? '나' : AU.ai[who].name) + ' · ' + fmt(amount) + '칩');
    if (AU.log.length > 12) AU.log.shift();
  }
  function loop() {
    if (!AU || AU.done) return;
    const now = Date.now();
    if (now >= AU.ends) return finish(false);
    // AI 차례
    if (!AU.wait || now > AU.wait) {
      AU.wait = now + 500 + Math.random() * 1400;
      const cands = AU.ai.map((b, k) => k).filter((k) => AU.leader !== k && AU.ai[k].max >= AU.price + step(AU.price));
      if (cands.length && Math.random() < 0.75) {
        const k = rand(cands), b = AU.ai[k];
        let amt = AU.price + step(AU.price);
        if (b.persona === 'bluffer' && Math.random() < 0.35) amt = Math.min(b.max, Math.round(AU.price * (1.15 + Math.random() * 0.2) / 10) * 10);
        if (AU.leader === null) amt = Math.max(amt, AU.price);
        if (amt <= b.max) bid(k, amt);
      }
    }
    renderLive();
    AU.t = setTimeout(loop, 250);
  }
  function myBid(mul) {
    if (!AU || AU.done) return;
    const w = W();
    const amt = AU.leader === null ? AU.price : Math.max(AU.price + step(AU.price), Math.round(AU.price * mul / 10) * 10);
    if (amt > w.chips) return A.toast('칩이 부족해요.');
    AU.myBid = true; bid('me', amt); renderLive();
  }
  function finish(left) {
    const w = W(); if (!AU || AU.done) return;
    AU.done = true; clearTimeout(AU.t);
    const i = AU.i;
    let res;
    if (AU.leader === 'me' && !left) {
      if (w.chips < AU.price) res = 'ai';
      else {
        w.chips -= AU.price; deliver(AU.l.id); res = 'me';
        P.inc('auWin'); P.setMax('auMax', AU.price);
        A.toast(AU.c.name + '을(를) ' + fmt(AU.price) + '칩에 낙찰받았어요.');
      }
    } else res = AU.leader === null ? 'none' : 'ai';
    if (res !== 'me' && AU.myBid) P.inc('auLose');
    w.auc.res[i] = res;
    if ([0, 1, 2].every((k) => w.auc.res[k] === 'me')) P.inc('auAll');
    A.save(); A.renderTop(); P.check();
    if (!left) setTimeout(() => { if (AU && AU.done) { AU = null; openAuction(); } }, 1600);
  }
  function deliver(id) {
    const w = W(), c = CAT[id];
    if (c.item) w.items[id] = (w.items[id] || 0) + c.item;
    else w.inv[id] = c.perm ? 1 : (w.inv[id] || 0) + 1;
  }
  let LV = null; // 경매 화면 조각 (매번 다시 그리지 않고 글자만 바꾼다)
  function renderLive() {
    const el = $('#scrPlus'); if (!AU) return;
    const w = W(), c = AU.c;
    if (!LV || LV.au !== AU || !document.body.contains(LV.box)) {
      [...el.children].slice(1).forEach((x) => x.remove());
      LV = { au: AU };
      LV.price = h('b'); LV.lead = h('b'); LV.bar = h('i'); LV.note = h('div', { class: 'note' }); LV.log = h('ul', { class: 'log' }); LV.wallet = h('p', { class: 'note' });
      LV.b1 = h('button', { class: 'btn gold', onclick: () => myBid(1.05) });
      LV.b2 = h('button', { class: 'btn', text: '+15%', onclick: () => myBid(1.15) });
      LV.b3 = h('button', { class: 'btn', text: '+30%', onclick: () => myBid(1.3) });
      LV.acts = h('div', { class: 'actions' }, LV.b1, LV.b2, LV.b3);
      LV.box = h('div', { class: 'live g-' + c.grade },
        h('div', { class: 'head' }, h('span', { class: 'ico', svg: A.icon(AU.l.id, 40) }), h('div', null, h('small', { text: GRADE[c.grade] }), h('h2', { text: c.name }))),
        h('div', { class: 'price' }, h('small', { text: '현재가' }), LV.price),
        h('div', { class: 'stat' }, '최고 입찰 ', LV.lead),
        h('div', { class: 'timer' }, LV.bar), LV.note, LV.acts, LV.wallet);
      el.append(h('div', { class: 'myarea' }, LV.box, h('div', { class: 'hand-panel' }, h('div', { class: 'label note', text: '입찰 기록' }), LV.log)));
    }
    const left = Math.max(0, AU.ends - Date.now());
    const lead = AU.leader === null ? '아직 아무도' : AU.leader === 'me' ? '나' : AU.ai[AU.leader].name;
    LV.price.textContent = fmt(AU.price) + '칩';
    LV.lead.textContent = lead;
    LV.bar.style.width = Math.min(100, left / 100) + '%';
    LV.note.textContent = AU.done ? (AU.leader === 'me' ? '낙찰!' : AU.leader === null ? '유찰됐어요.' : lead + '에게 낙찰됐어요.') : (left < 3000 ? '하나… 둘…' : '남은 시간 ' + Math.ceil(left / 1000) + '초');
    const base = AU.leader === null ? AU.price : AU.price + step(AU.price);
    LV.b1.textContent = (AU.leader === null ? '시작가로 ' : '+5% ') + fmt(base);
    LV.b1.disabled = AU.done || AU.leader === 'me' || base > w.chips;
    LV.b2.disabled = LV.b3.disabled = AU.done || AU.leader === 'me' || AU.leader === null;
    LV.acts.hidden = AU.done;
    LV.wallet.textContent = '지갑 ' + fmt(w.chips) + '칩. 경쟁자: ' + AU.ai.map((b) => b.name).join(', ');
    if (LV.logN !== AU.log.length + ':' + AU.log[AU.log.length - 1]) {
      LV.logN = AU.log.length + ':' + AU.log[AU.log.length - 1];
      LV.log.innerHTML = ''; for (const l of AU.log) LV.log.append(h('li', { text: l }));
    }
  }
  function resell(id) {
    const w = W(), c = CAT[id]; if (!c || !(w.inv[id] > 0)) return;
    const p = Math.round(c.base * 0.6);
    A.dialog('되팔기', [h('p', { class: 'sub', text: c.name + '을(를) ' + fmt(p) + '칩에 넘길까요?' }), h('div', { class: 'row' }, h('button', { class: 'btn gold', text: '판다', onclick: () => { w.inv[id]--; w.chips += p; A.save(); A.closeDialog(); A.renderTop(); A.toast(fmt(p) + '칩을 받았어요.'); P.renderRoom(); } }))]);
  }
  function openBox() {
    const w = W(); if (!(w.inv.box > 0)) return;
    w.inv.box--; P.inc('box');
    const r = Math.random();
    let msg;
    if (r < 0.35) { P.inc('boxEmpty'); msg = '…비어 있어요. 바닥에 먼지만.'; }
    else if (r < 0.6) { const k = 200 + Math.floor(Math.random() * 18) * 100; w.chips += k; msg = '칩 ' + fmt(k) + '개가 들어 있었어요.'; }
    else if (r < 0.75) { for (const id of ['lens', 'mirror', 'clover', 'insurance']) w.items[id] = (w.items[id] || 0) + 1; msg = '돋보기, 거울 조각, 네잎클로버, 보험 증서가 하나씩.'; }
    else if (r < 0.87) { const id = rand(['glasses', 'fan', 'coin', 'shadow'].filter((k) => !(CAT[k].perm && owned(k)))) || 'coin'; deliver(id); msg = CAT[id].name + '이(가) 들어 있었어요!'; }
    else if (r < 0.95) { const id = rand(['watch', 'bribe', 'banker']); deliver(id); msg = '전설 물건: ' + CAT[id].name + '!'; }
    else if (r < 0.99) { const id = rand(['dice', 'revolver', 'contract']); deliver(id); msg = '…' + CAT[id].name + '. 손이 서늘해져요.'; }
    else { deliver('blackchip'); msg = '검은 칩 한 개. 차갑고, 생각보다 무거워요.'; }
    A.save(); A.renderTop(); P.check();
    A.dialog('봉인된 상자', [h('p', { class: 'sub', text: msg }), h('div', { class: 'row' }, h('button', { class: 'btn gold', text: '확인', onclick: () => { A.closeDialog(); P.renderRoom(); } }))], false);
  }

  // ════════════════ 13번 테이블 ════════════════
  const T13 = {};
  function t13state() { const w = W(); const today = A.dayKey(); if (w.t13.day !== today) { w.t13.day = today; w.t13.rolls = 0; w.t13.on = false; w.t13.done = false; } return w.t13; }
  T13.roll = () => {
    const w = W(), s = t13state(), today = A.dayKey();
    if (s.ban && s.ban > today) return;
    if (s.on || s.done || s.rolls >= 10) return;
    s.rolls++;
    const p = (w.inv.blackchip ? 0.03 : 0.01) + (P.eff('t13') || 0);
    if (Math.random() < p) { s.on = true; P.inc('t13Seen'); }
  };
  T13.active = () => { const s = t13state(); return s.on && !s.done; };
  T13.door = () => h('button', { class: 't13-door', onclick: openT13 }, h('b', { text: '13' }), h('span', { text: '원래 없던 테이블이 하나 생겼어요.' }));
  let audio = null;
  function snd(kind) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime, len = kind === 'bang' ? 0.6 : 0.08;
      const buf = audio.createBuffer(1, Math.floor(audio.sampleRate * len), audio.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, kind === 'bang' ? 2.5 : 6);
      const src = audio.createBufferSource(); src.buffer = buf;
      const g = audio.createGain(); g.gain.value = kind === 'bang' ? 0.9 : (kind === 'spin' ? 0.15 : 0.35);
      src.connect(g); g.connect(audio.destination); src.start(t);
    } catch (e) { /* 소리 없이 */ }
  }
  let G13 = null;
  function openT13() {
    P.inc('t13Visit'); A.save();
    const el = P.screen('13', '', 't13-screen');
    el.querySelector('.plus-head .btn').remove();
    const box = h('div', { class: 't13' }, h('div', { class: 'candle' }), h('div', { class: 'dealer13' }), h('p', { class: 'say', id: 'say13' }));
    el.append(box);
    const acts = h('div', { class: 'actions t13-acts', id: 'acts13' });
    el.append(acts);
    $('#toLobby').hidden = true;
    P.onLeave(() => { if (G13 && !G13.over && G13.sat) { A.toast('자리를 뜨려 하자 딜러가 총구를 내렸어요. 진 것으로 처리됐어요.'); end13('lose', true); } G13 = null; }, 't13');
    say(['오래 기다렸습니다.', '앉으시죠. 여기선 칩도, 물건도 소용없습니다.', '한 발입니다. 이기면 가진 것의 두 배에 만 칩을 더 드리죠. 지면… 가진 것의 대부분을 두고 가셔야 합니다.'], () => {
      acts.append(h('button', { class: 'btn red', text: '앉는다', onclick: sit13 }), h('button', { class: 'btn', text: '일어서서 나간다', onclick: leave13 }));
    });
  }
  async function say(lines, then) {
    const p = $('#say13'); if (!p) return;
    for (const line of lines) {
      p.textContent = '';
      for (const ch of line) { if (!$('#say13')) return; p.textContent += ch; await sleep(38); }
      await sleep(650);
    }
    if (then) then();
  }
  function leave13() {
    const w = W(); t13state().done = true; P.inc('t13Leave'); A.save(); P.check();
    const acts = $('#acts13'); if (acts) acts.innerHTML = '';
    say(['현명하시군요.', '다음에 또 뵙죠.'], () => { setTimeout(() => { A.show('scrLobby'); A.renderLobby(); }, 600); });
    void w;
  }
  function sit13() {
    const acts = $('#acts13'); acts.innerHTML = '';
    G13 = { bullet: Math.floor(Math.random() * 6), idx: 0, turn: Math.random() < 0.5 ? 'me' : 'dealer', over: false, sat: true };
    snd('spin');
    const cyl = h('div', { class: 'cyl', id: 'cyl13' }, ...Array.from({ length: 6 }, (_, k) => h('i', { class: 'ch', 'data-k': k })));
    $('.t13').append(cyl);
    say(['(실린더가 돌아간다)', '동전을 던지죠. ' + (G13.turn === 'me' ? '먼저 하시죠.' : '제가 먼저 하겠습니다.')], turn13);
  }
  function turn13() {
    if (!G13 || G13.over) return;
    const acts = $('#acts13'); if (!acts) return;
    acts.innerHTML = '';
    const left = 6 - G13.idx;
    acts.append(h('p', { class: 'note', text: '남은 칸 ' + left + ' · 이번 칸에 총알이 있을 확률 ' + (left ? '1/' + left : '-') }));
    if (G13.turn === 'me') acts.append(h('button', { class: 'btn red', text: '방아쇠를 당긴다', onclick: () => pull('me') }));
    else setTimeout(() => pull('dealer'), 1600);
  }
  function pull(who) {
    if (!G13 || G13.over) return;
    const acts = $('#acts13'); if (acts) acts.innerHTML = '';
    const k = G13.idx, hit = k === G13.bullet;
    const c = document.querySelector('#cyl13 [data-k="' + k + '"]'); if (c) c.classList.add(hit ? 'hit' : 'empty');
    G13.idx++;
    if (hit) { G13.over = true; snd('bang'); document.body.classList.add('flash'); setTimeout(() => document.body.classList.remove('flash'), 400); return end13(who === 'me' ? 'lose' : 'win'); }
    snd('click');
    G13.turn = who === 'me' ? 'dealer' : 'me';
    say([who === 'me' ? '(찰칵.) …운이 좋으시군요.' : '(찰칵.) 제 차례는 끝났습니다.'], turn13);
  }
  function end13(r, quiet) {
    const w = W(), s = t13state(); if (G13) G13.over = true; s.done = true;
    if (r === 'win') {
      const tot = w.chips + w.vault; w.chips += tot + 10000; G13 = Object.assign(G13 || {}, { over: true });
      if (w.inv.blackchip) w.inv.blackchip = 0;
      P.inc('t13Win');
      w.stats.best = Math.max(w.stats.best, w.chips + w.vault);
      A.save(); A.renderTop(); P.check();
      say(['…', '축하드립니다. 가진 것의 두 배, 그리고 만 칩.', '검은 칩은 제가 돌려받죠.'], () => back13('살아남았어요. +' + fmt(tot + 10000) + '칩'));
    } else {
      const lostC = w.chips - Math.floor(w.chips * 0.2), lostV = w.vault - Math.floor(w.vault * 0.2);
      w.chips -= lostC; w.vault -= lostV;
      s.ban = A.dayKey(Date.now() + 7 * DAY);
      w.inv.blackchip = 1; P.inc('t13Lose'); P.inc('blackChip');
      A.save(); A.renderTop(); P.check();
      if (quiet) return;
      say(['…', '정신이 드시는군요. 가진 것의 대부분은 두고 가셨습니다.', '이건 가져가시죠. (검은 칩을 쥐여 준다)', '다음에 또 뵙죠.'], () => back13('칩과 금고의 80%(' + fmt(lostC + lostV) + '칩)를 잃었어요. 일주일 동안 13번 테이블은 나타나지 않아요.'));
    }
  }
  function back13(msg) {
    const acts = $('#acts13'); if (!acts) return;
    acts.innerHTML = '';
    acts.append(h('p', { class: 'note', text: msg }), h('button', { class: 'btn', text: '로비로', onclick: () => { G13 = null; P.stopAll(); A.show('scrLobby'); A.renderLobby(); } }));
  }

  // ════════════════ 바 ════════════════
  const CLUES = [
    { id: 'thirteen', title: '13이라는 숫자', text: '13번이요? 이 카지노엔 12번 테이블까지밖에 없습니다. …공식적으로는요.', keys: ['13', '십삼', '테이블', '숫자'] },
    { id: 'blackchip', title: '검은 칩', text: '검은 칩을 쥐고 온 손님이 있었죠. 그 칩을 가진 사람 앞에는 그 테이블이 더 자주 나타난다더군요.', keys: ['검은', '블랙칩', '검정 칩', '칩 색'] },
    { id: 'box', title: '봉인된 상자', text: '무거운 상자는 열지 않는 게 좋습니다. 가벼운 상자는… 더더욱이요. 비어 있을 때가 많거든요.', keys: ['상자', '봉인', '경매'] },
    { id: 'yoon', title: '노신사 윤의 버릇', text: '노신사 윤은 좋은 패가 들어오면 꼭 넥타이를 만집니다. 본인만 모르죠.', keys: ['윤', '노신사', '버릇', '습관'] },
    { id: 'rose', title: '마담 로즈의 웃음', text: '마담 로즈가 웃으면 조심하세요. 그 사람은 질 때도 웃지만, 허세 부릴 때 제일 크게 웃습니다.', keys: ['로즈', '마담', '허세'] },
    { id: 'manager', title: '지배인의 기억력', text: '지배인은 봉투 두께보다 횟수를 더 잘 기억합니다. 일주일에 두 번은 욕심이에요.', keys: ['지배인', '뇌물', '봉투', '의심', '경비'], cond: (w) => w.sus >= 30 },
    { id: 'monkey', title: '다섯 번째 손가락', text: '원숭이 손을 산 손님들은 다섯 번째 손가락 얘기를 절대 안 하더군요.', keys: ['원숭이', '손가락', '저주'] },
    { id: 'dawn', title: '여섯 시 정각', text: '새벽 여섯 시 정각에 문 여는 걸 보는 손님은 드뭅니다. 그런 손님은 따로 기억해 두죠.', keys: ['아침', '새벽', '6시', '여섯', '문'] },
    { id: 'devil', title: '차가운 펜', text: '계약서에 서명할 때 펜이 차가웠다면, 그건 잉크가 아닙니다. 다음 날 아침 지급도 끊기고요.', keys: ['계약', '악마', '서명'] },
    { id: 'dealer13', title: '얼굴 없는 딜러', text: '그 딜러 앞에서는 나간다고 말해도 됩니다. 아무도 탓하지 않아요. 오히려 기억해 두죠.', keys: ['딜러', '얼굴', '그림자', '러시안', '총'], cond: (w) => (w.st.t13Seen || 0) >= 1 },
    { id: 'mirror', title: '벽 거울', text: '인디언 포커 테이블 뒤 벽 거울은 손님이 아니라 경비를 위한 겁니다. 너무 오래 보면 들켜요.', keys: ['거울', '인디언'] },
    { id: 'noel', title: '바텐더의 이름', text: '제 이름이요? 여기 오래 있으면 이름은 별로 중요하지 않게 됩니다. 노엘이라고 불러 주세요.', keys: ['이름', '누구', '바텐더', '정체'], cond: (w) => (w.st.barVisit || 0) >= 3 }
  ];
  P.clueTotal = () => CLUES.length;
  const DRINKS = [
    { id: 'whisky', name: '하우스 위스키', price: 30, desc: '다음 3판 동안 의심이 30% 덜 올라요.', fx: (w) => { w.fx2.calm = 3; } },
    { id: 'seven', name: '럭키 세븐', price: 60, desc: '다음 3판 동안 카드 운 +15%.', fx: (w) => { w.fx2.luck = 3; } },
    { id: 'velvet', name: '블랙 벨벳', price: 80, desc: '다음 3판 동안 내가 올리면 AI가 더 잘 접어요.', fx: (w) => { w.fx2.scare = 3; } },
    { id: 'water', name: '냉수 한 잔', price: 0, desc: '정신이 번쩍. 의심 -5. 하루 한 번.', fx: (w) => { w.sus = Math.max(0, w.sus - 5); w.room.water = A.dayKey(); } }
  ];
  const B = { open: false, talks: 0, msgs: [], busy: false, aiDown: false, usedAI: 0 };
  const GREET = ['어서 오세요. 오늘은 뭘로 드릴까요?', '늦은 시간이네요. 앉으세요.', '오셨군요. 테이블 분위기는 어땠습니까?'];
  const SMALL = [
    [['안녕', '하이', '반가', '처음'], ['반갑습니다. 여기선 다들 조금씩 솔직해지죠.', '어서 오세요. 앉으실 자리는 늘 비워 둡니다.']],
    [['운', '오늘', '잘 될', '대박'], ['운은 파도 같습니다. 높을 때 내리는 게 기술이죠.', '오늘 같은 날은 블랙잭 테이블이 조용하더군요.']],
    [['잃', '털', '망했', '돈', '칩'], ['잃은 칩은 테이블에 두고 오세요. 들고 다니면 무거워집니다.', '그런 밤도 있습니다. 한 잔 하시죠.']],
    [['추천', '뭐 마실', '메뉴', '술'], ['럭키 세븐이 인기입니다. 효과가 있는지는… 마신 사람만 알죠.', '긴장하셨다면 하우스 위스키가 낫습니다.']],
    [['블랙잭', '21'], ['블랙잭 딜러는 17에서 멈춥니다. 그 숫자를 기억하세요.']],
    [['홀덤', '포커', '세븐'], ['포커는 카드보다 사람을 보는 게임입니다. 저는 손님들 손을 봅니다.']],
    [['섯다', '화투', '땡'], ['뒷방 손님들은 망통을 들고도 웃습니다. 그게 섯다죠.']],
    [['룰렛', '0'], ['룰렛의 0은 카지노의 미소입니다. 아주 작은 미소요.']],
    [['체스'], ['체스룸 손님들은 술을 안 마십니다. 계산이 흐려진다나요.']],
    [['힘들', '피곤', '우울', '지쳐', '외로'], ['오늘은 쉬어 가셔도 됩니다. 위층 방 침대는 생각보다 푹신하거든요.', '그럴 땐 칩 말고 물 한 잔이 낫습니다.']],
    [['고마', '감사'], ['천만에요. 그게 제 일입니다.']]
  ];
  const DEFAULT = ['흥미로운 얘기군요.', '(잔을 닦으며 고개를 끄덕인다)', '그런 손님이 가끔 계시죠.', '음, 그건 저도 처음 듣는 얘기네요.', '여긴 오래 있으면 이상한 얘기를 많이 듣게 됩니다.'];
  function eligible(w) { return CLUES.filter((c) => !w.clues.includes(c.id) && (!c.cond || c.cond(w))); }
  function scripted(msg) {
    const w = W(), m = msg.replace(/\s+/g, ' ');
    for (const c of eligible(w)) if (c.keys.some((k) => m.includes(k)) && Math.random() < 0.75) return { reply: c.text, clue: c.id };
    for (const [keys, lines] of SMALL) if (keys.some((k) => m.includes(k))) return { reply: rand(lines) };
    return { reply: rand(DEFAULT) };
  }
  async function aiReply(msg) {
    const w = W();
    if (B.aiDown || !window.VelvetOnline || !VelvetOnline.fn) return null;
    const hist = B.msgs.slice(-12).map((x) => ({ role: x.who === 'me' ? 'user' : 'assistant', content: x.text }));
    while (hist.length && hist[0].role !== 'user') hist.shift();
    try {
      const r = await VelvetOnline.fn('bartender', { messages: hist, state: { chips: w.chips, sus: w.sus, title: P.titleName() }, clues: eligible(w).map((c) => ({ id: c.id, text: c.text })) });
      if (!r || !r.reply) return null;
      B.usedAI++;
      const ok = r.clue && eligible(w).some((c) => c.id === r.clue);
      return { reply: r.reply, clue: ok ? r.clue : null };
    } catch (e) {
      if (e && (e.status === 503 || e.status === 404 || e.status === 401)) B.aiDown = true;
      if (e && e.status === 429) A.toast('오늘 AI 바텐더와의 대화가 많았어요. 남은 건 짧게 대답할게요.'), B.aiDown = true;
      return null;
    }
  }
  function openBar() {
    const w = W();
    const el = P.screen('바', '카지노 한쪽의 어두운 바. 바텐더 노엘이 잔을 닦고 있어요.', 'bar-screen');
    if (!B.open) {
      if (window.HW && HW.needIntro()) return HW.intro(el, openBar);   // 할로윈: 새 알바 루나 첫 인사
      if (window.HW) el.append(HW.barScene(false)); else el.append(h('div', { class: 'bar-scene', 'aria-hidden': 'true' }, h('div', { class: 'bottles' }, ...Array.from({ length: 11 }, (_, k) => h('i', { style: `--h:${40 + (k * 17) % 45}px;--c:${['#5c2a1e', '#2e4d3a', '#6b5a2a', '#3a2f55', '#7a3b2a'][k % 5]}` }))), h('div', { class: 'tender' }), h('div', { class: 'counter' })));
      el.append(h('div', { class: 'panel' }, h('h3', { text: '바에 앉기' }), h('p', { class: 'note', text: '입장료 50칩. 한 번 앉으면 ' + (10 + (P.eff('bar') || 0)) + '마디까지 이야기할 수 있고, 술을 시키면 5마디씩 늘어요. 가끔 바텐더가 이상한 이야기를 흘려요. 들은 이야기는 내 방 단서 서랍에 적혀요.' }),
        h('button', { class: 'btn gold', disabled: w.chips < 50, text: '50칩 내고 앉기', onclick: () => { w.chips -= 50; B.open = true; B.talks = 10 + (P.eff('bar') || 0); B.msgs = [{ who: 'bar', text: rand(GREET) }]; const lg = window.HW && HW.lunaGreet(); if (lg) B.msgs.push(lg); P.inc('barVisit'); A.save(); A.renderTop(); P.check(); openBar(); } })));
      return;
    }
    P.onLeave(() => { B.open = false; B.msgs = []; }, 'bar');
    if (window.HW) el.append(HW.barScene(true));
    const wrap = h('div', { class: 'bar-wrap' });
    const chat = h('div', { class: 'chat', id: 'chat' });
    for (const m of B.msgs) chat.append(h('div', { class: 'msg ' + (m.who === 'me' ? 'me' : m.who === 'luna' ? 'luna' : 'bar') }, m.who === 'luna' ? h('small', { class: 'who', text: '루나' }) : null, m.clue ? h('small', { text: '단서: ' + m.clue }) : null, h('p', { text: m.text })));
    if (B.busy) chat.append(h('div', { class: 'msg bar typing' }, h('p', { text: '…' })));
    const inp = h('input', { type: 'text', id: 'barIn', maxlength: '200', placeholder: B.talks > 0 ? '노엘에게 말 걸기' : '술을 한 잔 시키면 더 이야기할 수 있어요', disabled: B.talks <= 0 || B.busy, 'aria-label': '바텐더에게 할 말' });
    const send = async () => {
      const t = inp.value.trim(); if (!t || B.busy || B.talks <= 0) return;
      B.msgs.push({ who: 'me', text: t }); B.talks--; B.busy = true; P.inc('talk'); openBar();
      let r = await aiReply(t);
      if (!r) { await sleep(500 + Math.random() * 700); r = scripted(t); }
      B.busy = false;
      const lt = window.HW ? HW.lunaTalk(t, r) : null;
      if (lt && lt.replace) r = Object.assign({}, r, lt.replace);
      if (lt) for (const x of lt.before) B.msgs.push(x);
      const m = { who: 'bar', text: r.reply };
      if (r.clue && !w.clues.includes(r.clue)) { w.clues.push(r.clue); const c = CLUES.find((x) => x.id === r.clue); m.clue = c ? c.title : ''; A.toast('수첩에 단서가 적혔어요: ' + m.clue); }
      B.msgs.push(m); if (lt) for (const x of lt.after) B.msgs.push(x);
      A.save(); P.check(); if (B.open) { openBar(); const i2 = $('#barIn'); if (i2) i2.focus(); }
    };
    inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); } };
    wrap.append(h('div', { class: 'hand-panel' }, chat, h('div', { class: 'row chat-in' }, inp, h('button', { class: 'btn gold', text: '말하기', disabled: B.talks <= 0 || B.busy, onclick: send })),
      h('p', { class: 'note', text: '남은 마디 ' + B.talks + (B.aiDown ? ' · 바텐더가 오늘은 말을 아끼네요' : '') })));
    const menu = h('div', { class: 'hand-panel' }, h('div', { class: 'label note', text: '메뉴' }));
    for (const d of DRINKS) {
      const water = d.id === 'water' && w.room.water === A.dayKey();
      menu.append(h('div', { class: 'drink' }, h('div', null, h('b', { text: d.name }), h('small', { text: d.desc })),
        h('button', { class: 'btn small gold', disabled: w.chips < d.price || water, text: water ? '오늘 마심' : d.price ? fmt(d.price) + '칩' : '공짜', onclick: () => {
          w.chips -= d.price; d.fx(w); B.talks += 5; P.inc('drink'); B.msgs.push({ who: 'bar', text: d.name + ' 나왔습니다.' + (d.id === 'water' ? ' 정신 차리세요.' : '') });
          A.save(); A.renderTop(); P.check(); openBar();
        } })));
    }
    menu.append(h('button', { class: 'btn', text: '일어나기', onclick: () => { B.open = false; B.msgs = []; P.stopAll(); A.show('scrLobby'); A.renderLobby(); } }));
    wrap.append(menu);
    el.append(wrap);
    const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight;
  }
  // 의심 완화 (하우스 위스키)
  const baseGain = P.susGain;
  P.susGain = (n) => { const v = baseGain(n); return W().fx2.calm > 0 ? Math.max(1, Math.round(v * 0.7)) : v; };

  P.auction = { open: openAuction, resell, openBox, CAT, deliver, owned };
  P.t13 = T13;
  P.bar = { open: openBar, CLUES, scripted };
})();
