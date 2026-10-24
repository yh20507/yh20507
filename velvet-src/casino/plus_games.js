/* ===== 벨벳 카지노 · 확장 게임: 룰렛, 섯다, 인디언 포커, 체스룸 ===== */
(() => {
  const A = App, P = Plus;
  const { h, $ } = A;
  const fmt = (n) => A.fmt(n);
  const W = () => A.W.data;
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ════════════════ 룰렛 ════════════════
  const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const colorOf = (n) => n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black';
  const R = { bets: {}, last: {}, chip: 5, rot: 0, shown: 0, spinning: false, history: [], magnet: false };
  function covers(key, n) {
    if (key[0] === 'n') return +key.slice(1) === n;
    if (n === 0) return false;
    switch (key) {
      case 'red': return REDS.has(n); case 'black': return !REDS.has(n);
      case 'odd': return n % 2 === 1; case 'even': return n % 2 === 0;
      case 'low': return n <= 18; case 'high': return n >= 19;
      case 'd1': return n <= 12; case 'd2': return n >= 13 && n <= 24; case 'd3': return n >= 25;
      case 'c1': return n % 3 === 1; case 'c2': return n % 3 === 2; case 'c3': return n % 3 === 0;
    }
    return false;
  }
  const mult = (key) => key[0] === 'n' ? 36 + (P.eff('roul') || 0) : (key[0] === 'd' || key[0] === 'c') ? 3 : 2;
  function payout(bets, n) { let r = 0; for (const k in bets) if (covers(k, n)) r += bets[k] * mult(k); return r; }
  const betSum = (b) => Object.values(b).reduce((a, x) => a + x, 0);
  const maxBet = () => W().perm.vip ? 20000 : 5000;

  function wheelSVG() {
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 300 300'); svg.setAttribute('class', 'wheel'); svg.setAttribute('aria-hidden', 'true');
    const g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'wheel-rot');
    const step = 360 / 37, rad = (d) => (d - 90) * Math.PI / 180;
    const pt = (r, d) => [150 + r * Math.cos(rad(d)), 150 + r * Math.sin(rad(d))];
    WHEEL.forEach((n, k) => {
      const a0 = k * step - step / 2, a1 = a0 + step;
      const [x0, y0] = pt(142, a0), [x1, y1] = pt(142, a1), [x2, y2] = pt(96, a1), [x3, y3] = pt(96, a0);
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', `M${x0},${y0} A142,142 0 0 1 ${x1},${y1} L${x2},${y2} A96,96 0 0 0 ${x3},${y3} Z`);
      p.setAttribute('class', 'pocket ' + colorOf(n));
      g.append(p);
      const [tx, ty] = pt(122, k * step);
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', tx); t.setAttribute('y', ty); t.setAttribute('transform', `rotate(${k * step} ${tx} ${ty})`);
      t.setAttribute('class', 'pnum'); t.textContent = n;
      g.append(t);
    });
    const hub = document.createElementNS(ns, 'circle'); hub.setAttribute('cx', 150); hub.setAttribute('cy', 150); hub.setAttribute('r', 92); hub.setAttribute('class', 'hub');
    g.append(hub);
    for (let k = 0; k < 8; k++) { const l = document.createElementNS(ns, 'line'); const [a, b] = pt(20, k * 45), [c, d] = pt(78, k * 45); l.setAttribute('x1', a); l.setAttribute('y1', b); l.setAttribute('x2', c); l.setAttribute('y2', d); l.setAttribute('class', 'spoke'); g.append(l); }
    svg.append(g);
    const ptr = document.createElementNS(ns, 'path'); ptr.setAttribute('d', 'M150,2 L160,18 L140,18 Z'); ptr.setAttribute('class', 'ptr'); svg.append(ptr);
    const ball = document.createElementNS(ns, 'circle'); ball.setAttribute('cx', 150); ball.setAttribute('cy', 26); ball.setAttribute('r', 6); ball.setAttribute('class', 'ball'); svg.append(ball);
    g.style.transform = `rotate(${R.shown}deg)`;
    return svg;
  }
  function openRoulette() {
    const el = P.screen('룰렛', '0부터 36까지. 칩을 고르고 판에 올린 다음 돌리세요. 0이 나오면 숫자 0에 건 것 말고는 모두 져요.', 'ro-screen');
    const w = W();
    const wrap = h('div', { class: 'ro-wrap' });
    const left = h('div', { class: 'ro-left' }, wheelSVG(), h('div', { class: 'ro-result', id: 'roRes', text: R.history.length ? '' : '판 위에 칩을 올려 주세요' }),
      h('div', { class: 'ro-hist' }, ...R.history.slice(-12).map((n) => h('span', { class: 'hn ' + colorOf(n), text: n }))));
    const right = h('div', { class: 'ro-right' });
    right.append(h('div', { class: 'label note', text: '칩 고르기' }), P.chipPick([1, 5, 25, 100, 500], R.chip, (v) => { R.chip = v; openRoulette(); }));
    right.append(boardEl());
    const sum = betSum(R.bets);
    right.append(h('div', { class: 'stat' }, '건 칩 ', h('b', { text: fmt(sum) }), ' · 한도 ' + fmt(maxBet()) + ' · 지갑 ' + fmt(w.chips)));
    const mag = w.items.magnet || 0;
    if (mag) right.append(h('label', { class: 'adm-row adm-check' }, h('input', { type: 'checkbox', checked: R.magnet, onchange: (e) => { R.magnet = e.target.checked; } }), h('span', { text: '자석 쓰기 (' + mag + '개 · 의심 +' + A.ITEMS.magnet.sus + ') 공을 한 칸 옆으로 당겨요' })));
    right.append(h('div', { class: 'actions' },
      h('button', { class: 'btn gold', text: '돌리기', disabled: !sum || R.spinning, onclick: spin }),
      h('button', { class: 'btn', text: '같은 걸 다시', disabled: R.spinning || !betSum(R.last), onclick: () => { R.bets = Object.assign({}, R.last); openRoulette(); } }),
      h('button', { class: 'btn', text: '지우기', disabled: R.spinning, onclick: () => { R.bets = {}; openRoulette(); } })));
    wrap.append(left, right);
    el.append(wrap);
    R.away = false;
    P.onLeave(() => { R.away = true; if (!R.spinning) R.bets = {}; }, 'ro');
  }
  function cell(key, text, cls) {
    const amt = R.bets[key];
    return h('button', { class: 'rc ' + (cls || ''), 'aria-label': text + (amt ? ' · ' + amt + '칩' : ''), disabled: R.spinning, onclick: () => addBet(key) }, h('span', { text }), amt ? h('i', { class: 'bchip', text: amt >= 1000 ? Math.round(amt / 100) / 10 + 'k' : amt }) : null);
  }
  function addBet(key) {
    const w = W(), sum = betSum(R.bets);
    if (sum + R.chip > Math.min(w.chips, maxBet())) return A.toast(sum + R.chip > maxBet() ? '한 판 한도를 넘어요.' : '칩이 부족해요.');
    R.bets[key] = (R.bets[key] || 0) + R.chip; openRoulette();
  }
  function boardEl() {
    const b = h('div', { class: 'ro-board' });
    b.append(cell('n0', '0', 'z'));
    for (let row = 0; row < 3; row++) for (let col = 0; col < 12; col++) {
      const n = col * 3 + (3 - row);
      const c = cell('n' + n, String(n), colorOf(n)); c.style.gridRow = String(row + 1); c.style.gridColumn = String(col + 2); b.append(c);
    }
    ['c3', 'c2', 'c1'].forEach((k, r) => { const c = cell(k, '2:1', 'out'); c.style.gridRow = String(r + 1); c.style.gridColumn = '14'; b.append(c); });
    [['d1', '1~12'], ['d2', '13~24'], ['d3', '25~36']].forEach(([k, t], i) => { const c = cell(k, t, 'out'); c.style.gridRow = '4'; c.style.gridColumn = `${2 + i * 4} / span 4`; b.append(c); });
    [['low', '1~18'], ['even', '짝'], ['red', '빨강', 'red'], ['black', '검정', 'black'], ['odd', '홀'], ['high', '19~36']].forEach(([k, t, cl], i) => { const c = cell(k, t, 'out ' + (cl || '')); c.style.gridRow = '5'; c.style.gridColumn = `${2 + i * 2} / span 2`; b.append(c); });
    return h('div', { class: 'ro-board-wrap' }, b);
  }
  async function spin() {
    const w = W(), bets = Object.assign({}, R.bets), sum = betSum(bets);
    if (!sum || R.spinning) return;
    if (sum > w.chips) return A.toast('칩이 부족해요.');
    R.spinning = true; R.last = Object.assign({}, bets);
    w.chips -= sum; A.save(); A.renderTop();
    let n = WHEEL[Math.floor(Math.random() * 37)];
    let usedMag = false;
    if (R.magnet && (w.items.magnet || 0) > 0) {
      const k = WHEEL.indexOf(n), cand = [WHEEL[(k + 36) % 37], WHEEL[(k + 1) % 37]];
      const best = cand.reduce((a, x) => payout(bets, x) > payout(bets, a) ? x : a, n);
      w.items.magnet--; usedMag = true; P.inc('cheat');
      if (best !== n) n = best;
      R.magnet = false;
    }
    const k = WHEEL.indexOf(n), step = 360 / 37;
    const target = -k * step;
    R.rot = Math.ceil(R.rot / 360) * 360 + ((target % 360) + 360) % 360 + 360 * 5;
    openRoulette();
    const g = document.querySelector('.wheel-rot');
    if (g) { g.style.transition = 'none'; void g.getBoundingClientRect(); g.style.transition = 'transform 4.2s cubic-bezier(.12,.6,.16,1)'; requestAnimationFrame(() => { g.style.transform = `rotate(${R.rot}deg)`; }); }
    await sleep(4400);
    R.shown = R.rot;
    const back = payout(bets, n), net = back - sum;
    w.chips += back;
    R.history.push(n); R.bets = {}; R.spinning = false;
    const s = w.st;
    P.inc('roSpin');
    if (back > 0) {
      for (const key in bets) if (covers(key, n)) { if (key[0] === 'n') { P.inc('roOne'); if (n === 0) P.inc('roZero'); } if (key === 'red') P.inc('roRed'); if (key === 'black') P.inc('roBlack'); }
      if (usedMag) P.inc('magWin');
    }
    void s;
    const px = P.settle({ game: 'roulette', net, staked: sum, folded: false });
    if (usedMag) P.addSus(A.ITEMS.magnet.sus, '자석이 테이블 밑에서 딸깍 소리를 냈어요.');
    if (R.away || !W() || A.banned()) return;
    openRoulette();
    const res = $('#roRes');
    if (res) { res.innerHTML = ''; res.append(h('b', { class: 'rn ' + colorOf(n), text: n }), h('span', { text: back ? ' · ' + fmt(back) + '칩 받았어요' + (net > 0 ? ' (+' + fmt(net) + ')' : '') : ' · 이번엔 빗나갔어요' })); if (px) res.append(h('small', { text: ' · 효과 ' + (px > 0 ? '+' : '') + fmt(px) })); }
  }

  // ════════════════ 공통: 베팅 판 (섯다·인디언 포커) ════════════════
  // 나는 0번 자리. 내 칩은 지갑에서 바로 빠진다.
  function PotTable(o) {
    const t = { o, seats: o.seats, ante: o.ante, unit: o.unit, maxRaises: 3, log: [], phase: 'idle' };
    const stack = (i) => i === 0 ? W().chips : t.seats[i].stack;
    const put = (i, amt) => {
      amt = Math.max(0, Math.min(Math.floor(amt), stack(i)));
      if (i === 0) { W().chips -= amt; } else t.seats[i].stack -= amt;
      t.bets[i] += amt; t.contrib[i] += amt; if (stack(i) === 0) t.allin[i] = true;
      return amt;
    };
    t.stack = stack; t.put = put;
    t.pot = () => t.contrib.reduce((a, x) => a + x, 0);
    t.live = () => t.seats.map((_, i) => i).filter((i) => !t.folded[i]);
    t.begin = (keepPot) => {
      const n = t.seats.length;
      if (!keepPot) { t.contrib = Array(n).fill(0); t.folded = t.seats.map((s, i) => i !== 0 && s.stack <= 0); t.allin = Array(n).fill(false); }
      if (!keepPot) t.btn = ((t.btn == null ? -1 : t.btn) + 1) % n;
      t.bets = Array(n).fill(0); t.acted = Array(n).fill(false); t.curBet = 0; t.raises = 0; t.lastRaiser = -1;
    };
    t.newRound = () => { t.bets = t.bets.map(() => 0); t.acted = t.acted.map(() => false); t.curBet = 0; t.raises = 0; t.lastRaiser = -1; t.toAct = t.next((t.btn || 0) - 1); };
    t.next = (from) => { const n = t.seats.length; for (let k = 1; k <= n; k++) { const i = (from + k + n) % n; if (!t.folded[i] && !t.allin[i]) return i; } return -1; };
    t.legal = (i) => {
      const toCall = t.curBet - t.bets[i], st = stack(i), pot = t.pot();
      const canRaise = t.raises < t.maxRaises && st > toCall;
      const half = t.curBet + Math.ceil((pot + toCall) / 2);
      return { toCall, call: Math.min(toCall, st), canCheck: toCall === 0, canRaise, ping: t.curBet === 0 ? t.unit : null, ttadang: t.curBet > 0 ? t.curBet * 2 : null, half: Math.max(half, t.curBet + t.unit), pot };
    };
    t.act = (i, type) => {
      const L = t.legal(i), nm = i === 0 ? '나' : t.seats[i].name;
      let text = '';
      if (type === 'die') { t.folded[i] = true; text = '다이'; }
      else if (type === 'check') { if (!L.canCheck) return false; text = '체크'; }
      else if (type === 'call') { put(i, L.toCall); text = '콜' + (t.allin[i] ? ' (올인)' : ''); }
      else {
        if (!L.canRaise) { put(i, L.toCall); text = '콜'; }
        else {
          const to = type === 'ping' ? (L.ping || t.curBet + t.unit) : type === 'ttadang' ? (L.ttadang || t.curBet + t.unit) : L.half;
          put(i, to - t.bets[i]);
          if (t.bets[i] > t.curBet) { t.curBet = t.bets[i]; t.raises++; t.lastRaiser = i; t.acted = t.acted.map((a, k) => k === i); }
          text = { ping: '삥', ttadang: '따당', half: '하프' }[type] + ' ' + fmt(t.bets[i]) + (t.allin[i] ? ' (올인)' : '');
        }
      }
      t.acted[i] = true; t.last = { seat: i, text, type };
      t.log.push(nm + ' ' + text); if (t.log.length > 30) t.log.shift();
      return true;
    };
    t.roundDone = () => {
      const live = t.live();
      if (live.length <= 1) return true;
      return live.every((i) => t.allin[i] || (t.acted[i] && t.bets[i] === t.curBet));
    };
    return t;
  }
  function aiPick(t, i, s, persona) {
    const L = t.legal(i), odds = L.toCall / Math.max(1, L.pot + L.toCall), r = Math.random();
    const raise = () => (t.curBet === 0 ? 'ping' : r < 0.5 ? 'ttadang' : 'half');
    if (P.has('fan') || W().fx2.scare > 0) { if (t.lastRaiser === 0) s *= 0.82; }
    switch (persona) {
      case 'rock':
        if (L.canCheck) return s > 0.78 && L.canRaise ? raise() : 'check';
        if (s < Math.max(0.42, odds + 0.12)) return 'die';
        return s > 0.88 && L.canRaise ? raise() : 'call';
      case 'bluffer':
        if (L.canRaise && (s > 0.62 || r < 0.22)) return raise();
        if (L.canCheck) return 'check';
        if (s < odds - 0.05 && r > 0.35) return 'die';
        return 'call';
      case 'station':
        if (L.canCheck) return s > 0.86 && L.canRaise ? raise() : 'check';
        return s < 0.12 ? 'die' : 'call';
      default:
        if (L.canCheck) return s > 0.7 && L.canRaise ? raise() : 'check';
        if (s < odds) return 'die';
        return s > 0.82 && L.canRaise ? raise() : 'call';
    }
  }
  const ROSTER = () => A.ROSTER;
  function newAI(used, stack) {
    const free = ROSTER().filter(([n]) => !used.includes(n));
    const [name, persona] = rand(free.length ? free : ROSTER());
    return { name, persona, stack };
  }
  // 테이블에서 쓰는 가방 (전설 아이템은 판 시작 전, 돋보기·거울은 판 중에)
  function legendBag(G, game, between, extra) {
    const w = W(), box = h('div', { class: 'bag' });
    let any = false;
    for (const id of ['monkey', 'bottom', 'revolver', 'dice']) {
      const n = w.items[id] || 0; const it = A.ITEMS[id]; if (!n || !it.games.includes(game)) continue; any = true;
      const ready = G.pending === id;
      box.append(h('button', { class: 'item-btn', disabled: !between || (G.pending && !ready), title: typeof it.desc === 'string' ? it.desc : '', onclick: () => {
        if (G.pending) return;
        if (id === 'monkey' && n === 1) G.pendingLast = true;
        w.items[id]--; G.pending = id;
        if (it.sus) { if (!P.addSus(it.sus, '딜러가 밑장을 빼는 손을 봤어요.')) return; P.inc('cheat'); }
        A.save(); A.toast(it.name + ': 다음 판에 효과가 걸려요.'); G.render();
      } }, h('span', { class: 'ico', svg: A.icon(id) }), h('b', { text: it.name + ' ×' + n + (ready ? ' · 준비됨' : '') }), h('small', { text: '판 시작 전' })));
    }
    for (const x of extra || []) { if (x) { any = true; box.append(x); } }
    if (!any) return h('p', { class: 'note', text: '쓸 수 있는 아이템이 없어요.' });
    return box;
  }
  function seatEl(G, i, cardsEl, extra) {
    const t = G.t, s = t.seats[i];
    const turn = t.phase === 'bet' && t.toAct === i;
    const bub = G.bubbles[i];
    return h('div', { class: 'pseat s' + i + (turn ? ' turn' : '') + (t.folded[i] ? ' fold' : '') + (G.winners && G.winners.includes(i) ? ' win' : '') },
      cardsEl, h('div', { class: 'plate' }, h('div', { class: 'nm', text: i === 0 ? '나' : s.name }),
        h('div', { class: 'st', text: fmt(t.stack(i)) + (t.allin[i] ? ' · 올인' : '') }),
        i ? h('div', { class: 'note', style: 'font-size:11px', text: A.C.PERSONA[s.persona] ? A.C.PERSONA[s.persona].name : '' }) : null),
      t.bets && t.bets[i] ? h('span', { class: 'betchip', text: fmt(t.bets[i]) }) : null, extra || null,
      bub ? h('span', { class: 'bubble', text: bub }) : null);
  }
  function betButtons(G) {
    const t = G.t, L = t.legal(0);
    const r = h('div', { class: 'actions' },
      h('button', { class: 'btn red', text: '다이', onclick: () => G.my('die') }),
      h('button', { class: 'btn', text: L.canCheck ? '체크' : '콜 ' + fmt(L.call), onclick: () => G.my(L.canCheck ? 'check' : 'call') }));
    if (L.canRaise) {
      if (L.ping) r.append(h('button', { class: 'btn gold', text: '삥 ' + fmt(L.ping), onclick: () => G.my('ping') }));
      if (L.ttadang) r.append(h('button', { class: 'btn gold', text: '따당 ' + fmt(L.ttadang), onclick: () => G.my('ttadang') }));
      if (L.half > (L.ping || 0) && L.half !== L.ttadang) r.append(h('button', { class: 'btn gold', text: '하프 ' + fmt(L.half), onclick: () => G.my('half') }));
    }
    return r;
  }

  // ════════════════ 섯다 ════════════════
  const HW = ['', '송학', '매조', '벚꽃', '흑싸리', '난초', '모란', '홍싸리', '공산', '국진', '단풍'];
  const HWC = ['', '#2f6b3a', '#c94f6d', '#e58aa5', '#4b3f6b', '#3e6fa8', '#b3263a', '#8a2f45', '#a8873a', '#d9a52b', '#c2401f'];
  const HWT = { 1: ['광', '띠'], 2: ['열끗', '띠'], 3: ['광', '띠'], 4: ['열끗', '띠'], 5: ['열끗', '띠'], 6: ['열끗', '띠'], 7: ['열끗', '띠'], 8: ['광', '열끗'], 9: ['열끗', '띠'], 10: ['열끗', '띠'] };
  const mon = (c) => (c >> 1) + 1, sp = (c) => (c & 1) === 0;
  function hwEl(c, o = {}) {
    if (c == null || c < 0) return h('span', { class: 'hw back' + (o.cls ? ' ' + o.cls : '') });
    const m = mon(c), k = c & 1, gw = k === 0 && (m === 1 || m === 3 || m === 8);
    return h('span', { class: 'hw' + (gw ? ' gw' : '') + (o.cls ? ' ' + o.cls : ''), style: '--hc:' + HWC[m], 'aria-label': m + '월 ' + HWT[m][k] },
      h('b', { text: m }), h('i', { text: HW[m] }), h('small', { text: HWT[m][k] }));
  }
  function sdEval(a, b) {
    const m1 = mon(a), m2 = mon(b), s1 = sp(a), s2 = sp(b);
    const pair = (x, y) => (m1 === x && m2 === y) || (m1 === y && m2 === x);
    let r, name, special = null;
    if (pair(3, 8) && s1 && s2) { r = 1000; name = '38광땡'; }
    else if (pair(1, 8) && s1 && s2) { r = 920; name = '18광땡'; }
    else if (pair(1, 3) && s1 && s2) { r = 910; name = '13광땡'; }
    else if (m1 === m2) { r = 800 + m1; name = m1 === 10 ? '장땡' : m1 + '땡'; }
    else if (pair(1, 2)) { r = 760; name = '알리'; }
    else if (pair(1, 4)) { r = 750; name = '독사'; }
    else if (pair(1, 9)) { r = 740; name = '구삥'; }
    else if (pair(1, 10)) { r = 730; name = '장삥'; }
    else if (pair(4, 10)) { r = 720; name = '장사'; }
    else if (pair(4, 6)) { r = 710; name = '세륙'; }
    else { const k = (m1 + m2) % 10; r = 600 + k; name = k === 9 ? '갑오' : k === 0 ? '망통' : k + '끗'; }
    if (r < 700) {
      if (pair(3, 7)) { special = 'jabi'; name = '땡잡이'; }
      else if (pair(4, 7) && s1 && s2) { special = 'am'; name = '암행어사'; }
      else if (pair(4, 9)) { special = s1 && s2 ? 'mgusa' : 'gusa'; name = s1 && s2 ? '멍텅구리 구사' : '구사'; }
    }
    return { r, name, special };
  }
  // 강도 표 (AI 판단용)
  const SD_ALL = []; for (let a = 0; a < 20; a++) for (let b = a + 1; b < 20; b++) SD_ALL.push(sdEval(a, b).r);
  SD_ALL.sort((x, y) => x - y);
  function pct(r) { let lo = 0; for (const x of SD_ALL) { if (x < r) lo++; } return lo / SD_ALL.length; }
  function sdStrength(cards) {
    if (cards.length === 1) {
      let sum = 0, n = 0;
      for (let b = 0; b < 20; b++) if (b !== cards[0]) { sum += sdStrength([cards[0], b]); n++; }
      return sum / n;
    }
    const e = sdEval(cards[0], cards[1]);
    if (e.special === 'jabi') return 0.42; if (e.special === 'am') return 0.32; if (e.special) return 0.5;
    return pct(e.r);
  }
  // 살아남은 사람들 중 승자 (특수패 반영). 재경기면 {rematch:true}
  function sdResolve(hands) {
    const ids = Object.keys(hands).map(Number);
    const ev = {}; for (const i of ids) ev[i] = Object.assign({ eff: hands[i].r }, hands[i]);
    const top = Math.max(...ids.map((i) => ev[i].r));
    for (const i of ids) {
      const e = ev[i];
      if (e.special === 'jabi' && top >= 801 && top <= 809) e.eff = 809.5, e.caught = 'jabi';
      if (e.special === 'am' && (top === 910 || top === 920)) e.eff = 950, e.caught = 'am';
    }
    const best = Math.max(...ids.map((i) => ev[i].eff));
    const gusaHolder = ids.find((i) => ev[i].special === 'gusa' || ev[i].special === 'mgusa');
    if (gusaHolder != null) {
      const othersBest = Math.max(...ids.filter((i) => i !== gusaHolder).map((i) => ev[i].eff));
      const lim = ev[gusaHolder].special === 'mgusa' ? 809 : 760;
      if (ids.length > 1 && othersBest <= lim) return { rematch: true, by: gusaHolder, ev };
    }
    return { winners: ids.filter((i) => ev[i].eff === best), ev };
  }
  const SD = { G: null, tier: 'low' };
  const SD_TIERS = { low: { name: '일반', ante: 5, unit: 10, need: 100, ai: 1000 }, high: { name: '하이롤러', ante: 50, unit: 100, need: 1000, ai: 10000, vip: true } };
  function openSeotda() {
    const w = W();
    const el = P.screen('섯다 · 뒷방', '화투 두 장. 한 장 받고 베팅, 한 장 더 받고 베팅. 땡잡이·암행어사·구사 같은 뒤집기 패가 있어요.', 'sd-screen');
    if (!SD.G) {
      const p = h('div', { class: 'panel' }, h('h3', { text: '판 고르기' }));
      for (const k in SD_TIERS) {
        const T = SD_TIERS[k], lock = T.vip && !w.perm.vip;
        p.append(h('div', { class: 'row' }, h('button', { class: 'btn ' + (k === 'low' ? 'gold' : ''), disabled: lock || w.chips < T.need, text: T.name + ' 앉기', onclick: () => sdSit(k) }),
          h('span', { class: 'note', text: '판돈 ' + T.ante + ' · 삥 ' + T.unit + ' · 최소 ' + fmt(T.need) + '칩' + (lock ? ' · VIP 전용' : '') })));
      }
      p.append(h('p', { class: 'note', text: '내 칩은 지갑에서 바로 걸려요. 판 도중에 일어나면 건 칩은 잃어요.' }));
      el.append(p, sdRules());
      return;
    }
    renderSd();
  }
  function sdRules() {
    return h('details', { class: 'panel rules-box' }, h('summary', { text: '족보 보기' }),
      h('p', { class: 'note', text: '38광땡 > 18·13광땡 > 장땡(10땡) > 9땡 … 1땡 > 알리(1·2) > 독사(1·4) > 구삥(1·9) > 장삥(1·10) > 장사(10·4) > 세륙(4·6) > 갑오(9끗) … 1끗 > 망통(0끗)' }),
      h('p', { class: 'note', text: '땡잡이(3·7): 1~9땡을 잡아요. 암행어사(4·7 열끗): 13·18광땡을 잡아요. 구사(4·9): 나머지 최고패가 알리 이하면 재경기. 멍텅구리 구사(4·9 열끗): 9땡 이하면 재경기.' }));
  }
  function sdSit(k) {
    const T = SD_TIERS[k];
    const seats = [{ name: '나', me: true, stack: 0 }];
    for (let i = 1; i < 4; i++) seats.push(newAI(seats.map((s) => s.name), T.ai));
    const t = PotTable({ seats, ante: T.ante, unit: T.unit });
    SD.G = { t, T, cards: [], bubbles: {}, pending: null, pendingLast: false, peek: {}, result: null, winners: null, timer: 0, render: renderSd, my: sdMy, rematches: 0 };
    P.onLeave(() => sdLeave(), 'sd');
    sdNew();
  }
  function sdLeave() {
    const G = SD.G; if (!G) return;
    clearTimeout(G.timer);
    if (G.t.phase === 'bet') A.toast('판 도중에 일어나서 건 칩은 잃었어요.');
    SD.G = null;
  }
  function sdNew(rematch) {
    const G = SD.G, t = G.t, w = W();
    if (!rematch) {
      t.seats.forEach((s, i) => { if (i && s.stack < t.unit * 4) { Object.assign(s, newAI(t.seats.map((x) => x.name), G.T.ai)); A.toast(s.name + '이(가) 빈자리에 앉았어요.'); } });
      if (w.chips < t.ante) { A.toast('칩이 부족해요.'); SD.G = null; return openSeotda(); }
      G.legend = G.pending; G.last = G.pendingLast; G.pending = null; G.pendingLast = false;
      G.start = w.chips; G.rematches = 0;
      t.begin(false); t.log = [];
      for (let i = 0; i < 4; i++) t.put(i, t.ante);
      t.log.push('모두 판돈 ' + t.ante + '칩');
    } else { t.begin(true); t.log.push('재경기! 판돈은 그대로'); }
    G.result = null; G.winners = null; G.peek = {}; G.bubbles = {};
    let deck = shuffle([...Array(20).keys()]);
    let mine = null;
    if (G.legend === 'bottom') mine = Math.random() < 0.3 ? [4, 14] : [18, 19];
    else if (G.legend === 'monkey') { const m = 1 + Math.floor(Math.random() * 9); mine = Math.random() < 0.6 ? [(m - 1) * 2, (m - 1) * 2 + 1] : rand([[0, 2], [0, 6], [1, 3]]); }
    else if (P.luckP() && Math.random() < P.luckP()) {
      const a = deck.slice(0, 2), b = deck.slice(2, 4);
      mine = sdEval(b[0], b[1]).r > sdEval(a[0], a[1]).r ? b : a;
    }
    if (mine) deck = mine.concat(deck.filter((c) => !mine.includes(c)));
    G.cards = t.seats.map(() => []);
    G.deck = deck;
    // 첫 장: 나부터 순서대로, 내 두 번째 장은 따로 보관
    G.myNext = mine ? mine[1] : null;
    if (mine) { G.cards[0].push(mine[0]); G.deck = deck.filter((c) => !mine.includes(c)); }
    for (let i = 0; i < 4; i++) { if (t.folded[i] || (i === 0 && mine)) continue; G.cards[i].push(G.deck.shift()); }
    G.street = 1; t.phase = 'bet'; t.newRound();
    renderSd(); sdPump();
  }
  function sdSecond() {
    const G = SD.G, t = G.t;
    for (let i = 0; i < 4; i++) { if (t.folded[i]) continue; G.cards[i].push(i === 0 && G.myNext != null ? G.myNext : G.deck.shift()); }
    G.street = 2; t.newRound(); t.log.push('두 번째 장');
  }
  function sdPump() {
    const G = SD.G; if (!G) return;
    const t = G.t;
    clearTimeout(G.timer);
    if (t.live().length <= 1 || t.toAct < 0 || t.roundDone()) {
      if (t.live().length > 1 && G.street === 1) { sdSecond(); renderSd(); if (t.toAct >= 0 && !t.roundDone()) return sdPump(); }
      return sdShow();
    }
    const i = t.toAct;
    if (i === 0) return renderSd();
    G.timer = setTimeout(() => {
      if (SD.G !== G) return;
      const s = sdStrength(G.cards[i]) * (t.live().length > 2 ? 0.9 : 1);
      const a = aiPick(t, i, s, t.seats[i].persona);
      t.act(i, a);
      G.bubbles = { [i]: t.last.text + (Math.random() < 0.4 ? ' · ' + rand((A.LINES[t.seats[i].persona] || A.LINES.calc)[a === 'die' ? 'fold' : a === 'check' ? 'check' : a === 'call' ? 'call' : 'raise']) : '') };
      t.toAct = t.next(i);
      renderSd(); sdPump();
    }, 650 + Math.random() * 500);
  }
  function sdMy(type) {
    const G = SD.G, t = G.t;
    if (!G || t.phase !== 'bet' || t.toAct !== 0) return;
    t.act(0, type); G.bubbles = {};
    if (type === 'die') P.inc('pkFoldSd');
    t.toAct = t.next(0); A.save(); A.renderTop();
    renderSd(); sdPump();
  }
  function sdShow() {
    const G = SD.G, t = G.t, w = W();
    const live = t.live();
    let winners, res = null;
    if (live.length === 1) winners = live;
    else {
      const hands = {}; for (const i of live) hands[i] = sdEval(G.cards[i][0], G.cards[i][1]);
      res = sdResolve(hands);
      if (res.rematch && G.rematches < 2) {
        G.rematches++;
        if (res.by === 0) P.inc('sdGusa');
        t.log.push((res.by === 0 ? '나' : t.seats[res.by].name) + '의 ' + res.ev[res.by].name + '! 재경기');
        G.result = { text: '구사! 재경기', ev: res.ev }; t.phase = 'show'; renderSd();
        G.timer = setTimeout(() => { if (SD.G === G) sdNew(true); }, 2200);
        return;
      }
      if (res.rematch) res = { winners: Object.keys(hands).map(Number).filter((i) => hands[i].r === Math.max(...Object.values(hands).map((x) => x.r))), ev: res.ev };
      winners = res.winners;
    }
    const pot = t.pot(), share = Math.floor(pot / winners.length);
    for (const i of winners) { if (i === 0) w.chips += share; else t.seats[i].stack += share; }
    t.phase = 'done'; G.winners = winners;
    const wn = winners.map((i) => (i === 0 ? '나' : t.seats[i].name) + (res ? ' · ' + res.ev[i].name : '')).join(', ');
    t.log.push(wn + ' 승리 (+' + fmt(share) + ')');
    // 기록
    P.inc('sdHand');
    const me = res && res.ev[0];
    if (winners.includes(0)) {
      P.inc('sdWin');
      if (me) { if (me.r === 1000) P.inc('sd38'); if (me.r === 910 || me.r === 920) P.inc('sdGwang'); if (me.r === 810) P.inc('sdJang'); if (me.caught === 'jabi') P.inc('sdJabi'); if (me.caught === 'am') P.inc('sdAm'); }
      if (!res && G.cards[0].length === 2 && sdEval(G.cards[0][0], G.cards[0][1]).r === 600) P.inc('sdMang');
    }
    const net = w.chips - G.start;
    const px = P.settle({ game: 'seotda', net, staked: t.contrib[0], folded: !!t.folded[0], legend: G.legend, last: G.last });
    G.result = { text: wn + ' 승리', net, px, ev: res && res.ev };
    G.legend = null; G.last = false;
    A.save(); A.renderTop(); renderSd();
  }
  function renderSd() {
    const G = SD.G; if (!G) return openSeotda();
    const el = $('#scrPlus'); const t = G.t, w = W();
    [...el.children].slice(1).forEach((c) => c.remove());
    const show = t.phase === 'done' || t.phase === 'show';
    const felt = h('div', { class: 'pfelt sd' }, h('div', { class: 'stamp', text: '뒷방' }),
      h('div', { class: 'center' }, h('div', { class: 'pot' }, '판돈 ', fmt(t.pot())), G.result ? h('div', { class: 'betchip', text: G.result.text }) : null));
    for (let i = 0; i < 4; i++) {
      const cs = h('div', { class: 'cards' });
      (G.cards[i] || []).forEach((c, k) => cs.append(hwEl(i === 0 || (show && !t.folded[i]) || (G.peek[i] === k) ? c : -1, { cls: G.peek[i] === k && !show ? 'peek' : '' })));
      const ev = G.result && G.result.ev && G.result.ev[i];
      felt.append(seatEl(G, i, cs, ev ? h('span', { class: 'betchip', text: ev.name }) : null));
    }
    el.append(felt);
    const panel = h('div', { class: 'hand-panel' });
    const myTurn = t.phase === 'bet' && t.toAct === 0;
    panel.append(h('div', { class: 'status' + (myTurn ? ' warn' : ''), text: t.phase === 'done' ? '판이 끝났어요.' : t.phase === 'show' ? '재경기 준비 중…' : t.folded[0] ? '다이했어요. 지켜보세요.' : myTurn ? '당신 차례예요.' : (t.seats[t.toAct] ? t.seats[t.toAct].name : '') + '의 차례예요.' }));
    if (G.cards[0] && G.cards[0].length === 2) panel.append(h('div', { class: 'handname', text: sdEval(G.cards[0][0], G.cards[0][1]).name }));
    if (myTurn) panel.append(betButtons(G));
    if (t.phase === 'done' && G.result) {
      const r = G.result;
      panel.append(h('div', { class: 'result' + (r.net < 0 ? ' lose' : '') }, h('b', { text: r.net > 0 ? '이번 판 +' + fmt(r.net) : r.net < 0 ? '이번 판 ' + fmt(r.net) : '본전' }), r.px ? h('div', { class: 'note', text: '아이템·칭호 효과 ' + (r.px > 0 ? '+' : '') + fmt(r.px) }) : null));
      panel.append(h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: '다음 판', disabled: w.chips < t.ante, onclick: () => sdNew(false) }), h('button', { class: 'btn', text: '일어나기', onclick: () => { SD.G = null; P.stopAll(); openSeotda(); } })));
    }
    const side = h('div', { class: 'hand-panel' });
    const between = t.phase === 'done';
    const lens = (w.items.lens || 0) > 0 && t.phase === 'bet' && !t.folded[0] && Object.keys(G.peek).length === 0;
    side.append(h('div', { class: 'label note', text: '가방' }), legendBag(G, 'seotda', between, [
      (w.items.lens || 0) > 0 ? h('button', { class: 'item-btn', disabled: !lens, onclick: () => {
        const opts = t.live().filter((i) => i !== 0); if (!opts.length) return;
        const i = rand(opts); w.items.lens--; G.peek[i] = 0; A.save(); A.toast(t.seats[i].name + '의 첫 장을 엿봤어요.'); renderSd();
      } }, h('span', { class: 'ico', svg: A.icon('lens') }), h('b', { text: '돋보기 ×' + w.items.lens }), h('small', { text: '한 명의 첫 장' })) : null]));
    if (G.pending) side.append(h('p', { class: 'note', text: '다음 판 준비: ' + A.ITEMS[G.pending].name }));
    side.append(h('div', { class: 'label note', text: '진행' }), logList(t.log));
    side.append(sdRules());
    el.append(h('div', { class: 'myarea' }, panel, side));
  }
  function logList(lines) { const ul = h('ul', { class: 'log' }); for (const l of (lines || []).slice(-10)) ul.append(h('li', { text: l })); return ul; }

  // ════════════════ 인디언 포커 ════════════════
  const IP = { G: null };
  const IP_TIERS = SD_TIERS;
  const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const TELL = {
    rock: { hi: ['…흠.', '이거 참.', '(넥타이를 만진다)'], lo: ['괜찮네요.', '오늘 운이 좋군요.'], mid: ['…', '그렇군요.'] },
    bluffer: { hi: ['하하, 별거 아니네!', '쉬운 판이겠어.'], lo: ['아이고, 무섭다.', '오늘 끝났네.'], mid: ['재밌어지겠는데?'] },
    station: { hi: ['오, 좋아 보여요!', '끝까지 가 봐야죠.'], lo: ['오, 좋아 보여요!', '궁금하네요.'], mid: ['어디 볼까요.'] },
    calc: { hi: ['확률이 좋지 않군요.', '계산이 복잡해졌어요.'], lo: ['확률이 꽤 좋군요.', '흥미롭군요.'], mid: ['애매하네요.'] }
  };
  function openIndian() {
    const w = W();
    const el = P.screen('인디언 포커', '각자 카드 한 장을 이마에 붙여요. 남의 카드는 보이고 내 카드만 안 보여요. 높은 카드가 이겨요. (A가 제일 높음)', 'ip-screen');
    if (!IP.G) {
      const p = h('div', { class: 'panel' }, h('h3', { text: '판 고르기' }));
      for (const k in IP_TIERS) {
        const T = IP_TIERS[k], lock = T.vip && !w.perm.vip;
        p.append(h('div', { class: 'row' }, h('button', { class: 'btn ' + (k === 'low' ? 'gold' : ''), disabled: lock || w.chips < T.need, text: T.name + ' 앉기', onclick: () => ipSit(k) }),
          h('span', { class: 'note', text: '판돈 ' + T.ante + ' · 삥 ' + T.unit + ' · 최소 ' + fmt(T.need) + '칩' + (lock ? ' · VIP 전용' : '') })));
      }
      p.append(h('p', { class: 'note', text: '손님들의 혼잣말을 잘 들어 보세요. 내 카드를 보고 하는 말이에요. 진심일 수도, 연기일 수도.' }));
      el.append(p); return;
    }
    renderIp();
  }
  function ipSit(k) {
    const T = IP_TIERS[k];
    const seats = [{ name: '나', me: true, stack: 0 }];
    for (let i = 1; i < 4; i++) seats.push(newAI(seats.map((s) => s.name), T.ai));
    IP.G = { t: PotTable({ seats, ante: T.ante, unit: T.unit }), T, cards: [], bubbles: {}, pending: null, pendingLast: false, mirror: false, render: renderIp, my: ipMy };
    P.onLeave(() => { const G = IP.G; if (!G) return; clearTimeout(G.timer); if (G.t.phase === 'bet') A.toast('판 도중에 일어나서 건 칩은 잃었어요.'); IP.G = null; }, 'ip');
    ipNew();
  }
  function ipNew() {
    const G = IP.G, t = G.t, w = W();
    t.seats.forEach((s, i) => { if (i && s.stack < t.unit * 4) { Object.assign(s, newAI(t.seats.map((x) => x.name), G.T.ai)); } });
    if (w.chips < t.ante) { A.toast('칩이 부족해요.'); IP.G = null; return openIndian(); }
    G.legend = G.pending; G.last = G.pendingLast; G.pending = null; G.pendingLast = false;
    G.start = w.chips; G.mirror = false; G.result = null; G.winners = null;
    t.begin(false); t.log = [];
    for (let i = 0; i < 4; i++) t.put(i, t.ante);
    let deck = shuffle([...Array(52).keys()]);
    let mine = null;
    if (G.legend === 'bottom') mine = 48 + Math.floor(Math.random() * 4);
    else if (G.legend === 'monkey') mine = 44 + Math.floor(Math.random() * 8);
    else if (P.luckP() && Math.random() < P.luckP()) { if ((deck[1] >> 2) > (deck[0] >> 2)) [deck[0], deck[1]] = [deck[1], deck[0]]; }
    if (mine != null) deck = [mine].concat(deck.filter((c) => c !== mine));
    G.cards = [0, 1, 2, 3].map(() => deck.shift());
    G.deck = deck;
    // 손님들의 반응 (내 카드를 보고)
    const r = G.cards[0] >> 2;
    G.bubbles = {};
    for (let i = 1; i < 4; i++) {
      const per = t.seats[i].persona, T = TELL[per] || TELL.calc;
      let lvl = r >= 9 ? 'hi' : r <= 3 ? 'lo' : 'mid';
      if (per === 'bluffer' && lvl !== 'mid' && Math.random() < 0.45) lvl = lvl === 'hi' ? 'lo' : 'hi';
      if (Math.random() < 0.8) G.bubbles[i] = rand(T[lvl]);
    }
    t.log.push('모두 판돈 ' + t.ante + '칩, 카드를 이마에');
    t.phase = 'bet'; t.newRound();
    renderIp();
    G.timer = setTimeout(() => { if (IP.G === G) { G.bubbles = {}; ipPump(); } }, 1800);
  }
  function ipStrength(G, i) {
    const t = G.t;
    const vis = t.live().filter((k) => k !== i).map((k) => G.cards[k] >> 2);
    const top = Math.max(...vis);
    const seen = new Set(G.cards.filter((_, k) => k !== i));
    let win = 0, n = 0;
    for (let c = 0; c < 52; c++) { if (seen.has(c)) continue; n++; const rr = c >> 2; if (rr > top) win += 1; else if (rr === top) win += 0.5; }
    return n ? win / n : 0.5;
  }
  function ipPump() {
    const G = IP.G; if (!G) return;
    const t = G.t; clearTimeout(G.timer);
    if (t.live().length <= 1 || t.toAct < 0 || t.roundDone()) return ipShow();
    const i = t.toAct;
    if (i === 0) return renderIp();
    G.timer = setTimeout(() => {
      if (IP.G !== G) return;
      const a = aiPick(t, i, ipStrength(G, i), t.seats[i].persona);
      t.act(i, a); G.bubbles = { [i]: t.last.text };
      t.toAct = t.next(i); renderIp(); ipPump();
    }, 650 + Math.random() * 500);
  }
  function ipMy(type) {
    const G = IP.G, t = G.t;
    if (!G || t.phase !== 'bet' || t.toAct !== 0) return;
    if (type === 'die' && (G.cards[0] >> 2) === 12) P.inc('ipAceFold');
    t.act(0, type); G.bubbles = {}; t.toAct = t.next(0); A.save(); A.renderTop(); renderIp(); ipPump();
  }
  function ipShow() {
    const G = IP.G, t = G.t, w = W();
    const live = t.live();
    const top = Math.max(...live.map((i) => G.cards[i] >> 2));
    const winners = live.length === 1 ? live : live.filter((i) => (G.cards[i] >> 2) === top);
    const share = Math.floor(t.pot() / winners.length);
    for (const i of winners) { if (i === 0) w.chips += share; else t.seats[i].stack += share; }
    t.phase = 'done'; G.winners = winners;
    t.log.push(winners.map((i) => (i === 0 ? '나' : t.seats[i].name)).join(', ') + ' 승리 (+' + fmt(share) + ')');
    P.inc('ipHand');
    if (winners.includes(0)) { P.inc('ipWin'); if ((G.cards[0] >> 2) === 0) P.inc('ipLow'); }
    const net = w.chips - G.start;
    const px = P.settle({ game: 'indian', net, staked: t.contrib[0], folded: !!t.folded[0], legend: G.legend, last: G.last });
    G.result = { net, px }; G.legend = null; G.last = false;
    A.save(); A.renderTop(); renderIp();
  }
  function ipCard(c, hide) {
    if (hide) return h('span', { class: 'card back ipc' });
    const red = (c & 3) === 1 || (c & 3) === 2;
    return h('span', { class: 'card ipc' + (red ? ' red' : '') }, h('b', { text: RANKS[c >> 2] }), h('i', { text: A.C.SU[c & 3] }));
  }
  function renderIp() {
    const G = IP.G; if (!G) return openIndian();
    const el = $('#scrPlus'); const t = G.t, w = W();
    [...el.children].slice(1).forEach((c) => c.remove());
    const done = t.phase === 'done';
    const felt = h('div', { class: 'pfelt ip' }, h('div', { class: 'stamp', text: 'INDIAN' }), h('div', { class: 'center' }, h('div', { class: 'pot' }, '판돈 ', fmt(t.pot()))));
    for (let i = 0; i < 4; i++) {
      const hide = i === 0 && !done && !G.mirror;
      felt.append(seatEl(G, i, h('div', { class: 'cards' }, ipCard(G.cards[i], hide))));
    }
    el.append(felt);
    const panel = h('div', { class: 'hand-panel' });
    const myTurn = t.phase === 'bet' && t.toAct === 0;
    panel.append(h('div', { class: 'status' + (myTurn ? ' warn' : ''), text: done ? '판이 끝났어요.' : t.folded[0] ? '다이했어요.' : myTurn ? '당신 차례예요. 손님들의 카드와 표정을 보고 정하세요.' : (t.seats[t.toAct] ? t.seats[t.toAct].name + '의 차례예요.' : '손님들이 당신 카드를 보는 중…') }));
    if (G.mirror && !done) panel.append(h('div', { class: 'handname', text: '거울에 비친 내 카드: ' + RANKS[G.cards[0] >> 2] }));
    if (myTurn) panel.append(betButtons(G));
    if (done && G.result) {
      const r = G.result;
      panel.append(h('div', { class: 'result' + (r.net < 0 ? ' lose' : '') }, h('b', { text: '내 카드는 ' + RANKS[G.cards[0] >> 2] + ' · ' + (r.net > 0 ? '+' + fmt(r.net) : r.net < 0 ? fmt(r.net) : '본전') }), r.px ? h('div', { class: 'note', text: '효과 ' + (r.px > 0 ? '+' : '') + fmt(r.px) }) : null));
      panel.append(h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: '다음 판', disabled: w.chips < t.ante, onclick: ipNew }), h('button', { class: 'btn', text: '일어나기', onclick: () => { IP.G = null; P.stopAll(); openIndian(); } })));
    }
    const side = h('div', { class: 'hand-panel' });
    const mOk = (w.items.mirror || 0) > 0 && t.phase === 'bet' && !t.folded[0] && !G.mirror;
    side.append(h('div', { class: 'label note', text: '가방' }), legendBag(G, 'indian', done, [
      (w.items.mirror || 0) > 0 ? h('button', { class: 'item-btn', disabled: !mOk, onclick: () => {
        w.items.mirror--; G.mirror = true; P.inc('ipMirror'); P.inc('cheat'); A.save();
        if (!P.addSus(20, '뒤쪽 벽 거울을 흘끔거리다 들켰어요.')) return; renderIp();
      } }, h('span', { class: 'ico', svg: A.icon('mirror') }), h('b', { text: '거울 조각 ×' + w.items.mirror }), h('small', { text: '내 카드 보기 · 의심 +20' })) : null]));
    if (G.pending) side.append(h('p', { class: 'note', text: '다음 판 준비: ' + A.ITEMS[G.pending].name }));
    side.append(h('div', { class: 'label note', text: '진행' }), logList(t.log));
    el.append(h('div', { class: 'myarea' }, panel, side));
  }

  // ════════════════ 체스룸 ════════════════
  const CH = { g: null };
  const LEVEL = { easy: { name: '초보', opt: { timeMs: 150, maxDepth: 1, noise: 140 }, pay: 1.5 }, normal: { name: '중수', opt: { timeMs: 700, maxDepth: 4 }, pay: 2 }, hard: { name: '고수', opt: { timeMs: 1600, maxDepth: 8 }, pay: 3 } };
  const GLYPH = { 1: '♟', 2: '♞', 3: '♝', 4: '♜', 5: '♛', 6: '♚' };
  const CHS = { level: 'normal', bet: 50 };
  function openChess() {
    const w = W();
    if (CH.g) return renderChess();
    const el = P.screen('체스룸', '칩을 걸고 AI와 한 판. 나는 백. 킹만 남으면 실격패예요. (초능력은 바의 AI 연결 뒤에 열 예정)', 'ch-screen');
    const p = h('div', { class: 'panel' }, h('h3', { text: '상대와 판돈' }));
    const lv = h('div', { class: 'presets' });
    for (const k in LEVEL) lv.append(h('button', { class: 'btn small' + (CHS.level === k ? ' gold' : ''), text: LEVEL[k].name + ' · 이기면 ' + LEVEL[k].pay + '배', onclick: () => { CHS.level = k; openChess(); } }));
    p.append(lv, h('div', { class: 'label note', text: '판돈' }), P.chipPick([50, 200, 1000, 5000], CHS.bet, (v) => { CHS.bet = v; openChess(); }),
      h('p', { class: 'note', text: '비기면 판돈을 돌려받아요. 판 도중에 나가면 기권패예요.' }),
      h('button', { class: 'btn gold', text: '앉기', disabled: w.chips < CHS.bet, onclick: chStart }));
    el.append(p);
  }
  function chStart() {
    const w = W(); if (w.chips < CHS.bet) return;
    w.chips -= CHS.bet; A.save(); A.renderTop();
    const g = new Engine.Game();
    CH.g = { g, sel: -1, targets: [], level: CHS.level, bet: CHS.bet, over: null, reps: {}, busy: false, log: [], last: null };
    P.inc('chPlay');
    renderChess();
  }
  function chMoves(sq) { return CH.g.g.legal().filter((m) => m.f === sq); }
  function chClick(sq) {
    const S = CH.g; if (!S || S.over || S.busy || S.g.side !== 1) return;
    const g = S.g, pc = g.b[sq];
    if (S.sel >= 0) {
      const ms = S.targets.filter((m) => m.t === sq);
      if (ms.length) { const m = ms.find((x) => !x.p || x.p === 5) || ms[0]; return chDo(m); }
    }
    if (pc > 0) { S.sel = sq; S.targets = chMoves(sq); } else { S.sel = -1; S.targets = []; }
    renderChess();
  }
  function chDo(m) {
    const S = CH.g, g = S.g;
    S.log.push((g.side === 1 ? '나 ' : 'AI ') + g.san(m));
    g.make(m); g.startTurn(); S.last = m; S.sel = -1; S.targets = [];
    const k = g.key(); S.reps[k] = (S.reps[k] || 0) + 1;
    if (chCheck()) return renderChess();
    renderChess();
    if (g.side === -1) {
      S.busy = true; renderChess();
      setTimeout(() => {
        if (CH.g !== S) return;
        const res = g.search(LEVEL[S.level].opt);
        S.busy = false;
        if (!res || !res.move) { chCheck(); return renderChess(); }
        chDo(res.move);
      }, 60);
    }
  }
  function chCheck() {
    const S = CH.g, g = S.g;
    if (S.reps[g.key()] >= 3) return chEnd('draw', '같은 장면이 세 번 반복됐어요.');
    const wa = g.army(1), ba = g.army(-1);
    if (!wa && !ba) return chEnd('draw', '양쪽 모두 킹만 남았어요.');
    if (!wa) return chEnd('lose', '킹만 남아 실격이에요.');
    if (!ba) return chEnd('win', 'AI의 킹이 홀로 남아 실격됐어요.');
    if (g.half >= 100) return chEnd('draw', '50수 동안 잡은 말도 폰 이동도 없었어요.');
    if (g.noMoves()) {
      if (g.inCheck()) return chEnd(g.side === 1 ? 'lose' : 'win', '체크메이트.');
      return chEnd('draw', '스테일메이트.');
    }
    return false;
  }
  function chEnd(r, why, silent) {
    const S = CH.g, w = W();
    S.over = { r, why };
    let net = -S.bet;
    if (r === 'win') { const back = Math.floor(S.bet * LEVEL[S.level].pay); w.chips += back; net = back - S.bet; P.inc('chWin'); if (S.level === 'hard') P.inc('chHard'); const b = P.eff('chess'); if (b) { const k = Math.floor(net * b); w.chips += k; } }
    else if (r === 'draw') { w.chips += S.bet; net = 0; P.inc('chDraw'); }
    S.over.px = P.settle({ game: 'chess', net, staked: S.bet, folded: false });
    A.save(); A.renderTop();
    if (!silent) S.over.net = net;
    return true;
  }
  function renderChess() {
    const S = CH.g; if (!S) return openChess();
    const el = P.screen('체스룸', LEVEL[S.level].name + ' AI · 판돈 ' + fmt(S.bet) + '칩', 'ch-screen');
    P.onLeave(() => { if (CH.g && !CH.g.over) { A.toast('기권했어요. 판돈은 잃었어요.'); chEnd('lose', '기권', true); } CH.g = null; }, 'ch');
    const g = S.g;
    const board = h('div', { class: 'chessboard', role: 'grid', 'aria-label': '체스판' });
    const chk = g.inCheck() ? (g.side === 1 ? g.wk : g.bk) : -1;
    for (let r = 7; r >= 0; r--) for (let f = 0; f < 8; f++) {
      const sq = r * 16 + f, pc = g.b[sq];
      const tgt = S.targets.some((m) => m.t === sq);
      const cls = 'sq ' + ((r + f) % 2 ? 'lt' : 'dk') + (S.sel === sq ? ' sel' : '') + (tgt ? ' tgt' : '') + (sq === chk ? ' chk' : '') + (S.last && (S.last.f === sq || S.last.t === sq) ? ' last' : '');
      board.append(h('button', { class: cls, 'aria-label': Engine.sqName(sq), onclick: () => chClick(sq) }, pc ? h('span', { class: 'pc ' + (pc > 0 ? 'w' : 'b'), text: GLYPH[Math.abs(pc)] }) : null));
    }
    const panel = h('div', { class: 'hand-panel' });
    const st = S.over ? (S.over.r === 'win' ? '승리! ' : S.over.r === 'draw' ? '무승부. ' : '패배. ') + S.over.why : S.busy ? 'AI가 생각하는 중…' : g.side === 1 ? '당신 차례예요.' + (g.inCheck() ? ' 체크!' : '') : '';
    panel.append(h('div', { class: 'status' + (g.inCheck() && !S.over ? ' warn' : ''), text: st }));
    if (S.over) {
      const net = S.over.r === 'win' ? Math.floor(S.bet * LEVEL[S.level].pay) - S.bet : S.over.r === 'draw' ? 0 : -S.bet;
      panel.append(h('div', { class: 'result' + (net < 0 ? ' lose' : '') }, h('b', { text: net > 0 ? '+' + fmt(net) + '칩' : net < 0 ? fmt(net) + '칩' : '판돈을 돌려받았어요' })));
      panel.append(h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: '한 판 더', onclick: () => { CH.g = null; openChess(); } })));
    } else panel.append(h('div', { class: 'actions' }, h('button', { class: 'btn red', text: '기권', onclick: () => { chEnd('lose', '기권했어요.'); renderChess(); } })));
    panel.append(h('div', { class: 'label note', text: '수 기록' }), logList(S.log));
    el.append(h('div', { class: 'ch-wrap' }, board, panel));
  }

  P.roulette = { open: openRoulette, payout, covers, WHEEL };
  P.seotda = { open: openSeotda, eval: sdEval, resolve: sdResolve, strength: sdStrength };
  P.indian = { open: openIndian };
  P.chess = { open: openChess };
  P.PotTable = PotTable;
})();
