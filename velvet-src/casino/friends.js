/* ===== 벨벳 카지노 · 친구 테이블 =====
   방장의 브라우저가 딜러를 맡는다. 판 상태(공개 정보)는 모두에게 보내고,
   각자의 숨은 카드는 그 사람만 풀 수 있게 암호화해서 보낸다. */
const Friends = (() => {
  const C = Cas, A = App, h = A.h, $ = A.$;
  const MT = {
    holdem: { name: '친구', sb: 5, bb: 10, unit: 10, start: 1000 },
    seven: { name: '친구', ante: 5, unit: 10, start: 1000 },
    blackjack: { name: '친구', minBet: 10, maxBet: 200, chips: [10, 25, 50, 100], start: 1000 }
  };
  const TURN_MS = 30000, BET_MS = 25000, NEXT_MS = 6000;
  let lobby = null, user = null, myUid = null, lobbyPeer = null, ready = false;
  let pub = null, kp = null;
  let unsubPeers = null;

  // ── 암호 ──
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function keys() {
    if (kp) return;
    kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
    const j = await crypto.subtle.exportKey('jwk', kp.publicKey);
    pub = { x: j.x, y: j.y };
  }
  async function derive(other) {
    const pk = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: other.x, y: other.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    return crypto.subtle.deriveKey({ name: 'ECDH', public: pk }, kp.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function enc(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function dec(key, m) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(m.iv) }, key, unb64(m.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  async function init() {
    if (ready) return !!lobby;
    ready = true;
    try {
      const use = window.claude && window.claude.use ? window.claude.use.bind(window.claude) : null;
      if (!use) return false;
      [lobby, user] = await Promise.all([use('room'), use('user')]);
      myUid = user ? await user.id() : null;
      if (lobby) {
        unsubPeers = lobby.onPeers((ch) => {
          for (const p of ch.peers) if (p.isMe && p.sameTab) lobbyPeer = p.peer;
          if (!$('#scrFriends').hidden) renderList();
        }, () => {});
        await keys();
      }
    } catch (e) { lobby = null; }
    return !!lobby;
  }

  // ════════ 친구 로비 ════════
  async function open() {
    const el = $('#scrFriends'); el.innerHTML = '';
    el.append(h('div', { class: 'lobby-head' }, h('h1', { text: '친구 테이블' }),
      h('p', { class: 'sub', text: '방을 만들면 방 코드가 생겨요. 친구가 이 카지노 링크를 열고 친구 테이블에서 그 방을 고르면 같이 앉을 수 있어요. 빈자리는 AI 손님이 채워요.' })));
    A.show('scrFriends');
    const ok = await init();
    if (!ok) {
      el.append(h('div', { class: 'panel' }, h('h3', { text: '지금은 친구 테이블을 열 수 없어요' }),
        h('p', { class: 'note', text: '친구 테이블은 Claude 앱이나 claude.ai에서 이 카지노를 열었을 때만 돼요. 친구도 같은 링크로 들어와야 하고, 공유 설정에서 친구에게 "사용 가능(Contributor)" 이상의 권한을 줘야 같이 앉을 수 있어요.' })));
      return;
    }
    const make = h('div', { class: 'panel' }, h('h3', { text: '방 만들기' }),
      h('p', { class: 'note', text: '모두 1,000 테이블 칩으로 시작해요. 내 지갑 칩은 쓰지 않고, 아이템도 쓸 수 없어요. 내가 딜러를 맡으니 내가 나가면 방이 닫혀요.' }),
      h('div', { class: 'row' },
        h('button', { class: 'btn gold small', text: '홀덤 방', onclick: () => host('holdem') }),
        h('button', { class: 'btn gold small', text: '세븐 포커 방', onclick: () => host('seven') }),
        h('button', { class: 'btn gold small', text: '블랙잭 방', onclick: () => host('blackjack') })));
    const code = h('input', { type: 'text', id: 'joinCode', maxlength: '6', placeholder: '방 코드', autocomplete: 'off', 'aria-label': '방 코드' });
    const joinBox = h('div', { class: 'panel' }, h('h3', { text: '코드로 들어가기' }), code,
      h('button', { class: 'btn', text: '들어가기', onclick: () => joinCode(code.value.trim().toLowerCase()) }));
    const listBox = h('div', { class: 'panel' }, h('h3', { text: '지금 열린 방' }), h('div', { class: 'tables-list', id: 'fList' }));
    el.append(h('div', { class: 'side' }, make, joinBox, listBox),
      h('p', { class: 'note', style: 'margin-top:14px', text: '친구를 부르려면 이 카지노의 공유 메뉴에서 친구를 초대하고 권한을 "사용 가능" 이상으로 주세요. 보기 전용 권한으로는 테이블에 앉을 수 없어요.' }));
    renderList();
  }
  function hosts() {
    if (!lobby) return [];
    return lobby.peers().filter((p) => p.presence && p.presence.host && typeof p.presence.host.code === 'string' && !(p.isMe && p.sameTab));
  }
  async function renderList() {
    const box = $('#fList'); if (!box) return;
    box.innerHTML = '';
    const hs = hosts();
    if (!hs.length) { box.append(h('p', { class: 'note', text: '열린 방이 아직 없어요. 친구가 방을 만들면 여기 나타나요.' })); return; }
    const names = user ? await user.profiles(hs.map((p) => p.by).filter(Boolean)) : {};
    for (const p of hs) {
      const ho = p.presence.host, g = A.GAMES[ho.game] ? ho.game : 'holdem';
      const nm = (p.by && names[p.by] && names[p.by].name) || '친구';
      box.append(h('div', { class: 'trow' },
        h('div', null, h('b', { text: A.GAMES[g].name }), ' · ', nm + '의 방 · ', h('span', { class: 'code', text: String(ho.code).slice(0, 6) })),
        h('button', { class: 'btn small gold', text: '앉기', onclick: () => join(String(ho.code).slice(0, 6), p.peer, g) })));
    }
  }
  function joinCode(code) {
    if (!/^[a-z0-9]{4,6}$/.test(code)) return A.toast('방 코드를 확인해 주세요.');
    const p = hosts().find((x) => x.presence.host.code === code);
    if (!p) return A.toast('그 코드의 방을 찾지 못했어요. 방장이 방을 열어 두었는지 확인해 주세요.');
    join(code, p.peer, p.presence.host.game);
  }

  // ════════ 공통 ════════
  function base(mode, game, code) {
    return {
      mode, game, code, T: Object.assign({}, MT[game], { name: '' }), bubble: null, sel: { discard: -1, open: -1 }, chooser: null, raiseTo: 0, bet: MT[game].minBet || 0,
      names: {}, timerI: null
    };
  }
  async function resolveNames(K, uids) {
    if (!user) return;
    const ids = uids.filter(Boolean);
    if (!ids.length) return;
    const ps = await user.profiles(ids);
    let changed = false;
    for (const id of ids) { const n = ps[id] && ps[id].name; if (n && K.names[id] !== n) { K.names[id] = n; changed = true; } }
    if (changed && A.S === K) A.renderTable();
  }
  function seatNames(K, v, meta) {
    const out = {};
    v.seats.forEach((s, i) => { const m = meta && meta[i]; if (m && m.uid) out[i] = K.names[m.uid] || (m.kind === 'host' ? '방장' : '친구'); });
    return out;
  }
  function timerText(deadline) {
    if (!deadline) return '';
    const s = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    return '(' + s + '초)';
  }
  // 보이는 판에서 내 베팅 가능 범위 계산 (엔진의 legal과 같은 규칙)
  function legalFromView(v, i) {
    const s = v.seats[i];
    if (!s || v.phase !== 'bet' || v.toAct !== i) return null;
    const toCall = Math.max(0, v.curBet - s.bet), call = Math.min(toCall, s.stack), allTo = s.bet + s.stack;
    let minTo = v.curBet + Math.max(v.minRaise, v.unit), maxTo = allTo;
    if (v.game === 'seven') maxTo = Math.min(allTo, v.curBet + v.pot + toCall);
    const canRaise = s.stack > toCall && (v.game !== 'seven' || v.raises < 4) && v.seats.some((o, k) => k !== i && !o.folded && !o.allin);
    if (minTo > maxTo) minTo = maxTo;
    return { toCall, call, canCheck: toCall === 0, canRaise, minTo, maxTo, allTo, pot: v.pot };
  }
  function bjLegalFromView(v, i) {
    if (v.phase !== 'play' || !v.turn || v.turn.seat !== i) return null;
    const s = v.seats[i], hd = s.hands[v.turn.hand]; if (!hd) return null;
    const two = hd.cards.length === 2;
    return { hit: true, stand: true, double: two && s.stack >= hd.bet, split: two && s.hands.length === 1 && C.rankOf(hd.cards[0]) === C.rankOf(hd.cards[1]) && s.stack >= hd.bet };
  }

  // ════════ 방장 ════════
  async function host(game) {
    const code = Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(2, 7).padEnd(5, '7');
    let room;
    try { room = await lobby.join('velvet-' + code); } catch (e) { return A.toast('방을 열지 못했어요. 잠시 뒤 다시 해 보세요.'); }
    await room.presence({ role: 'host', pub, uid: myUid });
    const K = base('host', game, code);
    K.room = room; K.meta = []; K.queue = []; K.seq = 0; K.deadline = 0; K.sent = {};
    const T = K.T;
    if (game === 'blackjack') {
      K.t = C.makeBJ({ minBet: T.minBet, maxBet: T.maxBet, seats: [{ id: 'host', name: '방장', kind: 'human', stack: T.start }] });
      K.meta = [{ kind: 'host', uid: myUid, peer: null }];
    } else {
      const n = A.GAMES[game].seats, seats = [{ id: 'host', name: '방장', kind: 'human', stack: T.start }];
      for (let k = 1; k < n; k++) seats.push(A.newAI(null, seats.map((s) => s.name), T.start));
      K.t = C.makePoker(game, { sb: T.sb, bb: T.bb, ante: T.ante || 0, unit: T.unit, seats });
      K.meta = seats.map((s, i) => (i === 0 ? { kind: 'host', uid: myUid, peer: null } : { kind: 'ai' }));
    }
    lobby.presence({ host: { code, game } }).catch(() => {});
    K.unsubs = [
      room.on('sit', (m) => onSit(K, m)),
      room.on('act', (m) => onAct(K, m)),
      room.on('choose', (m) => onChoose(K, m)),
      room.on('bet', (m) => onBet(K, m)),
      room.on('leave', (m) => onLeave(K, m)),
      room.onPeers((ch) => {
        for (const p of ch.peers) if (p.isMe && p.sameTab) K.myPeer = p.peer;
        for (const p of ch.left) {
          const i = K.meta.findIndex((m) => m.peer === p.peer);
          if (i > 0) { K.meta[i].away = true; K.t.seats[i].away = true; broadcast(K); pump(K); }
        }
        if (ch.joined.length) broadcast(K, true);
      })
    ];
    K.ctx = () => hostCtx(K);
    K.leave = () => closeHost(K);
    K.timerI = setInterval(() => { if (A.S === K && K.deadline) A.renderTable(); }, 1000);
    A.S = K; A.show('scrTable');
    A.toast('방을 열었어요. 방 코드 ' + code + '를 친구에게 알려 주세요.');
    if (game === 'blackjack') bjBetPhase(K); else nextHand(K);
  }

  function hostCtx(K) {
    const t = K.t;
    if (K.game === 'blackjack') {
      const v = C.viewBJ(t);
      return { v, me: 0, game: 'blackjack', names: seatNames(K, v, K.meta), timer: timerText(K.deadline), canBet: (t.phase === 'bet') && !(t.seats[0].bet > 0) && t.seats[0].stack > 0,
        addBet: (n) => { K.bet = Math.max(0, Math.min(K.T.maxBet, t.seats[0].stack, (K.bet || 0) + n)); A.renderTable(); },
        deal: () => { if (C.bjBet(t, 0, K.bet)) { broadcast(K); maybeDeal(K); A.renderTable(); } else A.toast('베팅할 수 없는 금액이에요.'); },
        bjAct: (type) => { if (C.bjAct(t, 0, type)) { afterBJ(K); } }, extra: hostExtra(K) };
    }
    const v = C.viewPoker(t);
    v.seats[0].cards = t.seats[0].cards.slice();
    return { v, me: 0, game: K.game, names: seatNames(K, v, K.meta), timer: timerText(K.deadline), bubbles: K.bubbles,
      act: (type, to) => { if (t.toAct === 0 && C.act(t, 0, { type, to })) { K.raiseTo = 0; after(K); } },
      choose: (d, o) => { if (C.choose(t, 0, d, o)) { K.sel = { discard: -1, open: -1 }; after(K); } },
      extra: hostExtra(K) };
  }
  function hostExtra(K) {
    const humans = K.meta.filter((m) => m.kind === 'host' || m.kind === 'human').length;
    return h('div', { class: 'note' }, '방 코드 ', h('b', { class: 'code', text: K.code }), ' · 사람 ' + humans + '명 앉음' + (K.queue.length ? ' · 다음 판에 ' + K.queue.length + '명 합류' : ''));
  }

  function onSit(K, m) {
    if (m.isMe && m.sameTab) return;
    const peer = m.peer, uid = m.by || null;
    const peerInfo = K.room.peers().find((p) => p.peer === peer);
    const pk = peerInfo && peerInfo.presence && peerInfo.presence.pub;
    // 같은 사람이 다시 들어오면 자리를 돌려준다
    let i = K.meta.findIndex((x) => x.kind === 'human' && ((uid && x.uid === uid) || x.peer === peer));
    if (i > 0) {
      K.meta[i].peer = peer; K.meta[i].away = false; K.t.seats[i].away = false; K.meta[i].pub = pk; K.meta[i].key = null; K.sent[i] = null;
      broadcast(K, true); return;
    }
    if (K.queue.some((q) => q.peer === peer)) return;
    K.queue.push({ peer, uid, pub: pk });
    if (K.game === 'blackjack' && (K.t.phase === 'bet' || K.t.phase === 'done')) seatQueued(K);
    else if (K.t.phase === 'idle' || K.t.phase === 'done') seatQueued(K);
    broadcast(K, true);
    resolveNames(K, [uid]);
  }
  function seatQueued(K) {
    while (K.queue.length) {
      const q = K.queue[0];
      if (K.game === 'blackjack') {
        if (K.t.seats.length >= 5) break;
        K.t.seats.push({ id: 'p' + K.t.seats.length, name: '친구', kind: 'human', stack: K.T.start, bet: 0, hands: [], away: false });
        K.meta.push({ kind: 'human', uid: q.uid, peer: q.peer, pub: q.pub });
      } else {
        const i = K.meta.findIndex((m, k) => k > 0 && (m.kind === 'ai' || (m.kind === 'human' && m.gone)));
        if (i < 0) break;
        Object.assign(K.t.seats[i], { id: 'p' + i, name: '친구', kind: 'human', persona: null, stack: K.T.start, away: false, drunk: 0 });
        K.meta[i] = { kind: 'human', uid: q.uid, peer: q.peer, pub: q.pub };
      }
      K.queue.shift();
    }
  }
  function seatOf(K, m) { return K.meta.findIndex((x) => x.kind === 'human' && x.peer === m.peer); }

  function onAct(K, m) {
    const i = seatOf(K, m), t = K.t, d = m.data || {};
    if (i < 0 || K.game === 'blackjack') {
      if (i >= 0 && K.game === 'blackjack' && t.turn && t.turn.seat === i && ['hit', 'stand', 'double', 'split'].includes(d.type)) { if (C.bjAct(t, i, d.type)) afterBJ(K); }
      return;
    }
    if (t.toAct !== i || d.hand !== t.handNo) return;
    if (!['fold', 'check', 'call', 'raise'].includes(d.type)) return;
    if (C.act(t, i, { type: d.type, to: Number(d.to) || 0 })) after(K);
  }
  function onChoose(K, m) {
    const i = seatOf(K, m), d = m.data || {};
    if (i < 0 || K.t.phase !== 'choose' || d.hand !== K.t.handNo) return;
    if (C.choose(K.t, i, Number(d.d), Number(d.o))) after(K);
  }
  function onBet(K, m) {
    const i = seatOf(K, m), d = m.data || {};
    if (i < 0 || K.game !== 'blackjack' || K.t.phase !== 'bet') return;
    if (C.bjBet(K.t, i, Number(d.amt))) { broadcast(K); maybeDeal(K); }
  }
  function onLeave(K, m) {
    const i = seatOf(K, m); if (i < 0) return;
    K.meta[i].gone = true; K.meta[i].away = true; K.t.seats[i].away = true;
    broadcast(K); pump(K);
  }

  // 판 진행 (포커)
  function nextHand(K) {
    const t = K.t;
    clearTimeout(K.timer);
    // 나간 사람 자리는 AI로, 칩이 떨어진 자리는 다시 채운다
    K.meta.forEach((m, i) => {
      if (i === 0) return;
      if (m.kind === 'human' && m.gone) { const ai = A.newAI(null, t.seats.map((s) => s.name), K.T.start); Object.assign(t.seats[i], ai, { away: false }); K.meta[i] = { kind: 'ai' }; }
      if (t.seats[i].stack <= 0) t.seats[i].stack = K.T.start;
    });
    seatQueued(K);
    if (t.seats[0].stack <= 0) t.seats[0].stack = K.T.start;
    t.rig = {};
    C.newHand(t);
    if (t.phase === 'choose') for (const i of C.inHand(t)) if (K.meta[i].kind === 'ai') C.aiChoose(t, i);
    K.sent = {};
    after(K);
  }
  function after(K) {
    broadcast(K); pump(K); if (A.S === K) A.renderTable();
  }
  function pump(K) {
    const t = K.t;
    clearTimeout(K.timer); K.deadline = 0;
    if (K.game === 'blackjack') return bjPump(K);
    if (t.phase === 'done') { K.deadline = Date.now() + NEXT_MS; K.timer = setTimeout(() => nextHand(K), NEXT_MS); broadcast(K); return; }
    if (t.phase === 'choose') {
      K.deadline = Date.now() + TURN_MS;
      K.timer = setTimeout(() => { for (const i of C.inHand(t)) if (!t.seats[i].chosen) C.aiChoose(t, i); after(K); }, TURN_MS);
      return;
    }
    if (t.phase !== 'bet') return;
    const i = t.toAct, m = K.meta[i];
    if (m.kind === 'ai') {
      K.timer = setTimeout(() => {
        const ok = C.aiAct(t, i); if (!ok) C.act(t, i, { type: 'fold' });
        K.bubbles = { [i]: t.lastAct ? t.lastAct.text : '' };
        setTimeout(() => { K.bubbles = null; if (A.S === K) A.renderTable(); }, 2000);
        after(K);
      }, 700 + Math.random() * 500);
      return;
    }
    const wait = m.away ? 3000 : TURN_MS;
    K.deadline = Date.now() + wait;
    K.timer = setTimeout(() => { const L = C.legal(t, i); if (L) { C.act(t, i, { type: L.canCheck ? 'check' : 'fold' }); after(K); } }, wait);
  }

  // 블랙잭 진행
  function bjBetPhase(K) {
    const t = K.t;
    clearTimeout(K.timer);
    K.meta.forEach((m, i) => { if (m.gone) { t.seats[i].away = true; } });
    seatQueued(K);
    for (const s of t.seats) { if (s.stack <= 0) s.stack = K.T.start; s.bet = 0; s.hands = []; }
    t.phase = 'bet'; t.dealer = { cards: [], hide: true };
    K.deadline = Date.now() + BET_MS;
    K.timer = setTimeout(() => { if (t.seats.some((s) => s.bet > 0)) deal(K); else bjBetPhase(K); }, BET_MS);
    after(K);
  }
  function maybeDeal(K) {
    const t = K.t;
    const present = t.seats.filter((s, i) => !K.meta[i].away && !K.meta[i].gone);
    if (present.length && present.every((s) => s.bet > 0)) deal(K);
  }
  function deal(K) {
    clearTimeout(K.timer);
    if (!C.bjDeal(K.t)) return bjBetPhase(K);
    K.sent = {};
    afterBJ(K);
  }
  function afterBJ(K) { broadcast(K); bjPump(K); if (A.S === K) A.renderTable(); }
  function bjPump(K) {
    const t = K.t;
    clearTimeout(K.timer); K.deadline = 0;
    if (t.phase === 'done') { K.deadline = Date.now() + NEXT_MS; K.timer = setTimeout(() => bjBetPhase(K), NEXT_MS); broadcast(K); return; }
    if (t.phase === 'bet') { K.deadline = Date.now() + BET_MS; return; }
    if (t.phase !== 'play' || !t.turn) return;
    const i = t.turn.seat, m = K.meta[i];
    const wait = m.away ? 3000 : TURN_MS;
    K.deadline = Date.now() + wait;
    K.timer = setTimeout(() => { if (t.turn && t.turn.seat === i) { C.bjAct(t, i, 'stand'); afterBJ(K); } }, wait);
  }

  // 모두에게 판 상태 보내기 + 각자에게 숨은 카드 보내기
  async function broadcast(K, force) {
    const t = K.t;
    const v = K.game === 'blackjack' ? C.viewBJ(t) : C.viewPoker(t);
    if (v.log) v.log = v.log.slice(-5);
    const meta = K.meta.map((m) => ({ kind: m.kind, uid: m.uid || null, peer: m.peer || null }));
    const msg = { seq: ++K.seq, v, meta, deadline: K.deadline, queue: K.queue.map((q) => q.peer) };
    K.room.emit('state', msg).catch(() => {});
    if (K.game === 'blackjack') return;
    for (let i = 1; i < K.meta.length; i++) {
      const m = K.meta[i];
      if (m.kind !== 'human' || m.away) continue;
      if (!m.pub) { const pp = K.room.peers().find((p) => p.peer === m.peer); if (pp && pp.presence && pp.presence.pub) m.pub = pp.presence.pub; else continue; }
      const cards = t.seats[i].cards;
      const sig = t.handNo + ':' + cards.join(',');
      if (!force && K.sent[i] === sig) continue;
      try {
        if (!m.key) m.key = await derive(m.pub);
        const box = await enc(m.key, { hand: t.handNo, cards });
        K.sent[i] = sig;
        K.room.emit('priv', Object.assign({ seat: i, hand: t.handNo }, box)).catch(() => {});
      } catch (e) { /* 키 문제: 다음 기회에 다시 */ }
    }
  }
  function closeHost(K) {
    clearTimeout(K.timer); clearInterval(K.timerI);
    try { K.room.emit('end', {}); } catch (e) { /* 이미 끊김 */ }
    (K.unsubs || []).forEach((u) => { try { u(); } catch (e) { /* 무시 */ } });
    setTimeout(() => { K.room.leave().catch(() => {}); }, 300);
    lobby.presence({ host: null }).catch(() => {});
  }

  // ════════ 손님 ════════
  async function join(code, hostLobbyPeer, game) {
    let room;
    try { room = await lobby.join('velvet-' + code); } catch (e) { return A.toast('방에 들어가지 못했어요.'); }
    await room.presence({ role: 'player', pub, uid: myUid });
    const K = base('client', game, code);
    K.room = room; K.v = null; K.meta = []; K.mine = []; K.mineHand = -1; K.key = null; K.hostPeer = null; K.seq = 0;
    K.unsubs = [
      room.on('state', (m) => {
        if (!isHost(K, m)) return;
        const d = m.data || {};
        if (!d.v || (d.seq && d.seq < K.seq)) return;
        K.seq = d.seq || 0; K.v = d.v; K.meta = d.meta || []; K.deadline = d.deadline || 0; K.queued = (d.queue || []).includes(K.myPeer);
        if (K.v.handNo !== K.mineHand) K.mine = [];
        resolveNames(K, K.meta.map((x) => x.uid));
        if (A.S === K) A.renderTable();
      }),
      room.on('priv', async (m) => {
        if (!isHost(K, m)) return;
        const d = m.data || {};
        if (d.seat !== mySeat(K)) return;
        try {
          if (!K.key) { const hp = room.peers().find((p) => p.peer === m.peer); if (!hp || !hp.presence.pub) return; K.key = await derive(hp.presence.pub); }
          const o = await dec(K.key, d);
          K.mine = o.cards; K.mineHand = o.hand;
          if (A.S === K) A.renderTable();
        } catch (e) { /* 다른 사람 몫이거나 깨진 메시지 */ }
      }),
      room.on('end', (m) => { if (isHost(K, m)) hostGone(K); }),
      room.onPeers((ch) => {
        for (const p of ch.peers) if (p.isMe && p.sameTab) K.myPeer = p.peer;
        if (K.hostPeer && ch.left.some((p) => p.peer === K.hostPeer)) hostGone(K);
      })
    ];
    K.hostLobbyPeer = hostLobbyPeer;
    K.ctx = () => clientCtx(K);
    K.leave = () => { room.emit('leave', {}).catch(() => {}); cleanup(K); };
    K.timerI = setInterval(() => { if (A.S === K && K.deadline) A.renderTable(); }, 1000);
    A.S = K; A.show('scrTable'); A.renderTable();
    // 방장이 누구인지: 이 방에서 role이 host인 사람
    const findHost = () => { const hp = room.peers().find((p) => p.presence && p.presence.role === 'host' && !p.isMe); if (hp) K.hostPeer = hp.peer; return hp; };
    let tries = 0;
    const askSeat = () => {
      if (A.S !== K) return;
      if (findHost()) { room.emit('sit', {}).catch(() => {}); return; }
      if (++tries > 12) { hostGone(K, '방장을 찾지 못했어요.'); return; }
      setTimeout(askSeat, 800);
    };
    askSeat();
  }
  function isHost(K, m) {
    if (!K.hostPeer) { const hp = K.room.peers().find((p) => p.presence && p.presence.role === 'host' && !p.isMe); if (hp) K.hostPeer = hp.peer; }
    return !!K.hostPeer && m.peer === K.hostPeer;
  }
  function mySeat(K) { return K.meta.findIndex((m) => m.kind === 'human' && m.peer === K.myPeer); }
  function cleanup(K) {
    clearInterval(K.timerI);
    (K.unsubs || []).forEach((u) => { try { u(); } catch (e) { /* 무시 */ } });
    setTimeout(() => { K.room.leave().catch(() => {}); }, 300);
  }
  function hostGone(K, why) {
    if (A.S !== K) return;
    cleanup(K); A.S = null;
    A.dialog('테이블이 닫혔어요', [h('p', { class: 'sub', text: why || '방장이 테이블을 떠났어요. 친구 테이블 칩은 지갑과 상관없으니 잃은 건 없어요.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn gold', text: '로비로', onclick: () => { A.closeDialog(); A.show('scrLobby'); A.renderLobby(); } }))], false);
  }
  function clientCtx(K) {
    const v = K.v;
    if (!v) return { v: K.game === 'blackjack' ? { kind: 'bj', phase: 'bet', seats: [], dealer: { cards: [] }, log: [], shoeLeft: 0 } : { game: K.game, seats: [], board: [], pot: 0, phase: 'idle', log: [] }, me: 0, game: K.game, spectate: true, waitingHost: '방장과 연결하는 중이에요…' };
    let me = mySeat(K);
    const names = seatNames(K, v, K.meta);
    if (me < 0) {
      // 아직 자리가 없으면 관전
      const vv = JSON.parse(JSON.stringify(v));
      return { v: vv, me: 0, game: K.game, names, waitingHost: K.queued ? '다음 판부터 자리에 앉아요. 지금은 구경 중이에요.' : '자리를 요청하는 중이에요…', spectate: true };
    }
    if (K.game === 'blackjack') {
      return { v, me, game: 'blackjack', names, timer: timerText(K.deadline), canBet: v.phase === 'bet' && !(v.seats[me].bet > 0),
        bjLegal: () => bjLegalFromView(v, me),
        bjAct: (type) => K.room.emit('act', { type }).catch(() => {}),
        addBet: (n) => { K.bet = Math.max(0, Math.min(K.T.maxBet, v.seats[me].stack, (K.bet || 0) + n)); A.renderTable(); },
        deal: () => K.room.emit('bet', { amt: K.bet }).catch(() => {}) };
    }
    const vv = JSON.parse(JSON.stringify(v));
    const mine = K.mineHand === v.handNo && K.mine.length ? K.mine : null;
    if (mine) vv.seats[me].cards = mine.slice();
    return { v: vv, me, game: K.game, names, mine: mine || vv.seats[me].cards, timer: timerText(K.deadline), bubbles: v.lastAct && v.phase === 'bet' ? { [v.lastAct.seat]: v.lastAct.text } : null,
      legal: () => legalFromView(v, me),
      act: (type, to) => { K.room.emit('act', { type, to, hand: v.handNo }).catch(() => {}); },
      choose: (d, o) => { K.room.emit('choose', { d, o, hand: v.handNo }).catch(() => {}); K.sel = { discard: -1, open: -1 }; } };
  }

  return { open, legalFromView };
})();
window.Friends = Friends;
