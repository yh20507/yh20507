/* ===== 벨벳 카지노 · 미니 업데이트: 아침 회전판, 바카라, 슬롯머신, 지하 테이블 ===== */
(() => {
  const A = App, P = Plus;
  const { h, $ } = A;
  const fmt = (n) => A.fmt(n);
  const W = () => A.W.data;
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickW = (list) => { let t = list.reduce((a, x) => a + x.w, 0), r = Math.random() * t; for (const x of list) { r -= x.w; if (r <= 0) return x; } return list[list.length - 1]; };

  // ── 보상 도우미 ──
  const SHOP_POOL = ['lens', 'mirror', 'cigarette', 'clover', 'slot', 'insurance', 'whiskey', 'notebook', 'pistol', 'sleeve', 'magnet'];
  const RARE = ['glasses', 'fan', 'coin', 'shadow', 'box', 'dice'];
  const LEGEND = ['watch', 'bribe', 'banker', 'monkey', 'revolver', 'contract', 'bottom'];
  function giveShop(n) {
    const w = W(), names = [];
    for (let k = 0; k < n; k++) { const id = rand(SHOP_POOL); w.items[id] = (w.items[id] || 0) + 1; names.push(A.ITEMS[id].name); }
    return names.join(', ');
  }
  function giveAuction(pool) {
    const C = P.auction.CAT, ok = pool.filter((id) => !(C[id].perm && P.auction.owned(id)));
    if (!ok.length) return null;
    const id = rand(ok); P.auction.deliver(id); return C[id].name;
  }
  const addChips = (n) => { W().chips += n; return fmt(n) + '칩'; };

  // ════════════════ 아침 회전판 ════════════════
  const DAILY = [
    { t: '10칩', w: 20, c: '#3b2a22', f: () => addChips(10) },
    { t: '30칩', w: 18, c: '#5a1a2c', f: () => addChips(30) },
    { t: '50칩', w: 15, c: '#2b3a2a', f: () => addChips(50) },
    { t: '100칩', w: 14, c: '#6b4f1c', f: () => addChips(100) },
    { t: '200칩', w: 8, c: '#3a2f55', f: () => addChips(200) },
    { t: '500칩', w: 3, c: '#9c7a2f', f: () => addChips(500) },
    { t: '아이템', w: 12, c: '#1f4a5a', f: () => '상점 아이템 · ' + giveShop(1) },
    { t: '아이템 ×2', w: 5, c: '#2a5a4a', f: () => '상점 아이템 · ' + giveShop(2) },
    { t: '의심 -20', w: 3, c: '#4a4a4a', f: () => { const w = W(); w.sus = Math.max(0, w.sus - 20); P.clampSus(); return '의심 -20'; } },
    { t: '희귀품', w: 2, c: '#5a3a7a', f: () => { const n = giveAuction(RARE); return n ? '경매 희귀품 · ' + n : addChips(300); } }
  ];
  const SPECIAL = [
    { t: '300칩', w: 20, c: '#3b2a22', f: () => addChips(300) },
    { t: '500칩', w: 20, c: '#5a1a2c', f: () => addChips(500) },
    { t: '1,000칩', w: 16, c: '#6b4f1c', f: () => addChips(1000) },
    { t: '2,000칩', w: 8, c: '#9c7a2f', f: () => addChips(2000) },
    { t: '희귀품', w: 14, c: '#3a2f55', f: () => { const n = giveAuction(RARE); return n ? '경매 희귀품 · ' + n : addChips(800); } },
    { t: '전설품', w: 8, c: '#7d3fa8', f: () => { const n = giveAuction(LEGEND); return n ? '경매 전설품 · ' + n : addChips(2000); } },
    { t: '아이템 ×3', w: 8, c: '#1f4a5a', f: () => '상점 아이템 · ' + giveShop(3) },
    { t: '잭팟 5,000', w: 3, c: '#c9a14a', f: () => { P.inc('wheelJack'); return addChips(5000); } },
    { t: '검은 칩', w: 3, c: '#0a0a0a', f: () => { P.auction.deliver('blackchip'); return '검은 칩 한 개'; } }
  ];
  const WH = { rot: 0, spinning: false, auto: false, result: null };
  const isSpecialNext = () => ((W().st.wheel || 0) + 1) % 7 === 0;
  const pending = () => W().wheel.day !== A.dayKey();
  function banner() {
    const sp = isSpecialNext();
    if (!WH.auto && pending()) { WH.auto = true; setTimeout(() => { if (pending() && !$('#scrLobby').hidden) openWheel(); }, 1400); }
    return h('button', { class: 'wheel-banner' + (sp ? ' sp' : ''), onclick: openWheel }, h('b', { text: sp ? '스페셜 회전판!' : '오늘의 회전판' }), h('span', { text: sp ? '일곱 번째 아침이에요. 더 좋은 칸들이 기다려요.' : '하루 한 번, 칩이나 아이템을 받아 가세요.' }));
  }
  function wheelSVG(list) {
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 300 300'); svg.setAttribute('class', 'mwheel'); svg.setAttribute('aria-hidden', 'true');
    const g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'mwheel-rot');
    const n = list.length, step = 360 / n, rad = (d) => (d - 90) * Math.PI / 180, pt = (r, d) => [150 + r * Math.cos(rad(d)), 150 + r * Math.sin(rad(d))];
    list.forEach((x, k) => {
      const a0 = k * step - step / 2, a1 = a0 + step, [x0, y0] = pt(140, a0), [x1, y1] = pt(140, a1);
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', `M150,150 L${x0},${y0} A140,140 0 0 1 ${x1},${y1} Z`); p.setAttribute('fill', x.c); p.setAttribute('stroke', '#c9a14a'); p.setAttribute('stroke-width', '1.2');
      g.append(p);
      const [tx, ty] = pt(92, k * step), t = document.createElementNS(ns, 'text');
      t.setAttribute('x', tx); t.setAttribute('y', ty); t.setAttribute('transform', `rotate(${k * step} ${tx} ${ty})`); t.setAttribute('class', 'mwt'); t.textContent = x.t;
      g.append(t);
    });
    const hub = document.createElementNS(ns, 'circle'); hub.setAttribute('cx', 150); hub.setAttribute('cy', 150); hub.setAttribute('r', 22); hub.setAttribute('fill', '#c9a14a'); g.append(hub);
    svg.append(g);
    const ptr = document.createElementNS(ns, 'path'); ptr.setAttribute('d', 'M150,4 L162,26 L138,26 Z'); ptr.setAttribute('fill', '#ecd28e'); svg.append(ptr);
    g.style.transform = `rotate(${WH.rot}deg)`;
    return svg;
  }
  function openWheel() {
    const w = W(), sp = isSpecialNext(), list = sp ? SPECIAL : DAILY;
    const el = P.screen(sp ? '스페셜 회전판' : '오늘의 회전판', sp ? '일곱 번째 회전이에요. 큰 칸이 많아요.' : '아침 6시마다 한 번. 칩이 바닥났다면 따로 100칩까지는 채워 드려요. 스페셜까지 ' + (7 - ((w.st.wheel || 0) % 7)) + '번.', 'wh-screen');
    const box = h('div', { class: 'wh-box' }, wheelSVG(list));
    const done = !pending();
    const res = h('div', { class: 'wh-res', id: 'whRes', text: WH.result || (done ? '오늘은 이미 돌렸어요. 내일 아침 6시 이후에 다시 와요.' : '') });
    const btn = h('button', { class: 'btn gold', text: '돌리기', disabled: done || WH.spinning, onclick: () => spinWheel(list, sp) });
    box.append(res, h('div', { class: 'actions' }, btn));
    const legend = h('div', { class: 'panel' }, h('h3', { text: '칸과 확률' }), h('div', { class: 'statlist' }, ...list.map((x) => h('div', null, h('span', { text: x.t }), h('b', { text: Math.round(x.w / list.reduce((a, y) => a + y.w, 0) * 1000) / 10 + '%' })))));
    el.append(h('div', { class: 'wh-wrap' }, box, legend));
  }
  async function spinWheel(list, sp) {
    const w = W(); if (WH.spinning || !pending()) return;
    WH.spinning = true; WH.result = null;
    const pick = pickW(list), k = list.indexOf(pick), step = 360 / list.length;
    const off = (Math.random() - 0.5) * step * 0.6;
    WH.rot = Math.ceil(WH.rot / 360) * 360 + 360 * 6 + ((360 - k * step - off) % 360 + 360) % 360;
    const g = document.querySelector('.mwheel-rot');
    if (g) { g.style.transition = 'transform 4.6s cubic-bezier(.12,.6,.12,1)'; requestAnimationFrame(() => { g.style.transform = `rotate(${WH.rot}deg)`; }); }
    const b = document.querySelector('.wh-box .btn'); if (b) b.disabled = true;
    await sleep(4800);
    w.wheel.day = A.dayKey(); P.inc('wheel'); if (sp) P.inc('wheelSp');
    const got = pick.f();
    WH.result = (sp ? '스페셜! ' : '') + pick.t + ' → ' + got;
    WH.spinning = false;
    A.save(); A.renderTop(); P.check();
    const r = $('#whRes'); if (r) { r.textContent = WH.result; r.classList.add('hit'); }
    const box = document.querySelector('.wh-box'); if (box) box.append(h('button', { class: 'btn', text: '로비로', onclick: () => { P.stopAll(); A.show('scrLobby'); A.renderLobby(); } }));
  }

  // ════════════════ 바카라 ════════════════
  const BC = { bets: {}, last: {}, chip: 25, shoe: [], busy: false, hands: null, res: null };
  const bval = (c) => { const r = c >> 2; return r === 12 ? 1 : r >= 8 ? 0 : r + 2; };
  const btot = (cs) => cs.reduce((a, c) => a + bval(c), 0) % 10;
  const draw = () => { if (BC.shoe.length < 30) { BC.shoe = shuffle(Array.from({ length: 312 }, (_, i) => i % 52)); } return BC.shoe.pop(); };
  const bMax = () => W().perm.vip ? 20000 : 5000;
  function openBaccarat() {
    const w = W();
    const el = P.screen('바카라', '플레이어와 뱅커 중 9에 가까운 쪽에 걸어요. 그림과 10은 0점, A는 1점, 합의 일의 자리만 봐요. 세 번째 카드는 규칙대로 자동.', 'bc-screen');
    P.onLeave(() => { if (!BC.busy) BC.bets = {}; }, 'bc');
    const H = BC.hands;
    const side = (key, name) => {
      const cs = H ? H[key] : [];
      return h('div', { class: 'bc-hand' + (BC.res && BC.res.win === key ? ' win' : '') }, h('div', { class: 'label note', text: name + (H && cs.length && H.shown ? ' · ' + btot(cs.slice(0, H.shown[key])) : '') }),
        h('div', { class: 'cards' }, ...cs.map((c, i) => A.cardEl(H.shown[key] > i ? c : -1))));
    };
    const table = h('div', { class: 'bc-table' }, side('p', '플레이어'), h('div', { class: 'bc-mid', text: BC.res ? BC.res.text : 'VS' }), side('b', '뱅커'));
    el.append(table);
    const spot = (key, name, pay) => {
      const amt = BC.bets[key] || 0;
      return h('button', { class: 'bc-spot s-' + key, disabled: BC.busy, onclick: () => {
        const sum = Object.values(BC.bets).reduce((a, x) => a + x, 0);
        if (sum + BC.chip > Math.min(w.chips, bMax())) return A.toast(sum + BC.chip > bMax() ? '한 판 한도를 넘어요.' : '칩이 부족해요.');
        BC.bets[key] = amt + BC.chip; openBaccarat();
      } }, h('b', { text: name }), h('small', { text: pay }), amt ? h('i', { class: 'bchip', text: amt >= 1000 ? Math.round(amt / 100) / 10 + 'k' : amt }) : null);
    };
    const sum = Object.values(BC.bets).reduce((a, x) => a + x, 0);
    el.append(h('div', { class: 'hand-panel' },
      h('div', { class: 'bc-spots' }, spot('p', '플레이어', '2배'), spot('t', '타이', '9배'), spot('b', '뱅커', '1.95배')),
      h('div', { class: 'label note', text: '칩 고르기' }), P.chipPick([5, 25, 100, 500], BC.chip, (v) => { BC.chip = v; openBaccarat(); }),
      h('div', { class: 'stat' }, '건 칩 ', h('b', { text: fmt(sum) }), ' · 한도 ' + fmt(bMax()) + ' · 지갑 ' + fmt(w.chips)),
      h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: '딜', disabled: !sum || BC.busy, onclick: dealBC }),
        h('button', { class: 'btn', text: '같은 걸 다시', disabled: BC.busy || !Object.keys(BC.last).length, onclick: () => { BC.bets = Object.assign({}, BC.last); openBaccarat(); } }),
        h('button', { class: 'btn', text: '지우기', disabled: BC.busy, onclick: () => { BC.bets = {}; openBaccarat(); } })),
      BC.res && BC.res.net != null ? h('div', { class: 'result' + (BC.res.net < 0 ? ' lose' : '') }, h('b', { text: BC.res.net > 0 ? '+' + fmt(BC.res.net) + '칩' : BC.res.net < 0 ? fmt(BC.res.net) + '칩' : '본전' }), BC.res.px ? h('div', { class: 'note', text: '효과 ' + (BC.res.px > 0 ? '+' : '') + fmt(BC.res.px) }) : null) : null));
  }
  async function dealBC() {
    const w = W(), bets = Object.assign({}, BC.bets), sum = Object.values(bets).reduce((a, x) => a + x, 0);
    if (!sum || BC.busy || sum > w.chips) return;
    BC.busy = true; BC.last = Object.assign({}, bets); BC.res = null;
    w.chips -= sum; A.save(); A.renderTop();
    const p = [draw(), draw()], b = [draw(), draw()];
    // 운 (칭호·술): 건 쪽이 조금 유리해지게 한 번 다시 뽑기
    const lp = P.luckP();
    if (lp && Math.random() < lp) { const fav = (bets.p || 0) >= (bets.b || 0) ? p : b; if (btot(fav) < 5) { fav[0] = draw(); fav[1] = draw(); } }
    let pt = btot(p), bt = btot(b);
    if (pt < 8 && bt < 8) {
      let p3 = null;
      if (pt <= 5) { p3 = draw(); p.push(p3); pt = btot(p); }
      const v3 = p3 == null ? null : bval(p3);
      const bDraw = v3 == null ? bt <= 5 : bt <= 2 || (bt === 3 && v3 !== 8) || (bt === 4 && v3 >= 2 && v3 <= 7) || (bt === 5 && v3 >= 4 && v3 <= 7) || (bt === 6 && v3 >= 6 && v3 <= 7);
      if (bDraw) { b.push(draw()); bt = btot(b); }
    }
    BC.hands = { p, b, shown: { p: 0, b: 0 } };
    const order = [['p', 1], ['b', 1], ['p', 2], ['b', 2]]; if (p.length > 2) order.push(['p', 3]); if (b.length > 2) order.push(['b', 3]);
    for (const [k, n] of order) { BC.hands.shown[k] = n; if (P.isOn('bc')) openBaccarat(); await sleep(k === 'p' && n === 2 ? 900 : 600); }
    const win = pt > bt ? 'p' : bt > pt ? 'b' : 't';
    let back = 0;
    if (win === 't') { back += (bets.t || 0) * 9 + (bets.p || 0) + (bets.b || 0); }
    else if (win === 'p') back += (bets.p || 0) * 2;
    else back += Math.floor((bets.b || 0) * 1.95);
    w.chips += back;
    const net = back - sum;
    P.inc('bcHand');
    if (win === 't' && bets.t) P.inc('bcTie');
    if (win === 'b' && bets.b) P.inc('bcBank');
    if (net > 0 && ((win === 'p' && btot(p.slice(0, 2)) === 9) || (win === 'b' && btot(b.slice(0, 2)) === 9))) P.inc('bc9');
    const px = P.settle({ game: 'baccarat', net, staked: sum, folded: false });
    BC.res = { win, net, px, text: (win === 'p' ? '플레이어 승' : win === 'b' ? '뱅커 승' : '타이') + ' · ' + pt + ' : ' + bt };
    BC.bets = {}; BC.busy = false;
    A.renderTop();
    if (P.isOn('bc')) openBaccarat();
  }

  // ════════════════ 슬롯머신 ════════════════
  const SYM = [
    { k: 'cherry', s: '🍒', w: 30 }, { k: 'lemon', s: '🍋', w: 25 }, { k: 'bell', s: '🔔', w: 18 }, { k: 'bar', s: 'BAR', w: 12 },
    { k: 'seven', s: '7', w: 4 }, { k: 'velvet', s: 'V', w: 5 }, { k: 'gift', s: '🎁', w: 8 }
  ];
  const PAY3 = { cherry: 8, lemon: 10, bell: 18, bar: 35, velvet: 80 };
  const SL = { bet: 5, busy: false, grid: null, msg: '', auto: 0 };
  const symEl = (x, cls) => h('span', { class: 'sym y-' + x.k + (cls ? ' ' + cls : ''), text: x.s });
  function openSlots() {
    const w = W();
    const el = P.screen('슬롯머신', '가운데 줄이 맞으면 당첨. 777이면 쌓인 잭팟을 통째로. 🎁 두 개면 상점 아이템, 세 개면 경매장 물건이 나와요.', 'sl-screen');
    P.onLeave(() => { SL.auto = 0; }, 'sl');
    if (!SL.grid) SL.grid = [0, 1, 2].map(() => [0, 1, 2].map(() => pickW(SYM)));
    const reels = h('div', { class: 'reels', id: 'reels' });
    for (let c = 0; c < 3; c++) reels.append(h('div', { class: 'reel' }, ...SL.grid[c].map((x, r) => symEl(x, r === 1 ? 'mid' : ''))));
    const machine = h('div', { class: 'machine' },
      h('div', { class: 'jp' }, h('small', { text: 'JACKPOT' }), h('b', { text: fmt(w.slot.pool) })),
      reels, h('div', { class: 'payline' }), h('div', { class: 'sl-msg', id: 'slMsg', text: SL.msg || '레버를 당겨 보세요' }));
    const panel = h('div', { class: 'hand-panel' },
      h('div', { class: 'label note', text: '한 번에 걸 칩' }), P.chipPick([1, 5, 25, 100], SL.bet, (v) => { if (!SL.busy) { SL.bet = v; openSlots(); } }),
      h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: '돌리기 · ' + SL.bet + '칩', disabled: SL.busy || w.chips < SL.bet, onclick: () => spinSlots() }),
        h('button', { class: 'btn', text: SL.auto ? '자동 멈추기 (' + SL.auto + ')' : '10번 자동', disabled: !SL.auto && (SL.busy || w.chips < SL.bet), onclick: () => { if (SL.auto) { SL.auto = 0; openSlots(); } else { SL.auto = 10; spinSlots(); } } })),
      h('div', { class: 'statlist' }, ...[['7 7 7', '잭팟 + 100배'], ['V V V', '80배'], ['BAR ×3', '35배'], ['🔔 ×3', '18배'], ['🍋 ×3', '10배'], ['🍒 ×3', '8배'], ['🍒 🍒 (왼쪽부터)', '2배'], ['🍒 (맨 왼쪽)', '1배'], ['🎁 ×2 / ×3', '상점 아이템 / 경매 물건']].map(([a, b]) => h('div', null, h('span', { text: a }), h('b', { text: b })))));
    el.append(h('div', { class: 'sl-wrap' }, machine, panel));
  }
  async function spinSlots() {
    const w = W(), bet = SL.bet;
    if (SL.busy) return;
    if (w.chips < bet) { SL.auto = 0; return openSlots(); }
    SL.busy = true;
    w.chips -= bet; w.slot.pool += Math.max(1, Math.round(bet * 0.05)); A.renderTop();
    const fin = [0, 1, 2].map(() => [0, 1, 2].map(() => pickW(SYM)));
    // 운: 가운데 줄 한 칸을 한 번 더 굴려 볼 기회
    const lp = P.luckP(); if (lp && Math.random() < lp && fin[0][1].k === fin[1][1].k) fin[2][1] = fin[0][1].k === 'seven' ? pickW(SYM) : fin[0][1];
    openSlots();
    const cols = [...document.querySelectorAll('#reels .reel')];
    const timers = cols.map((col) => setInterval(() => { [...col.children].forEach((s) => { const x = pickW(SYM); s.textContent = x.s; s.className = 'sym y-' + x.k + (s.classList.contains('mid') ? ' mid' : '') + ' blur'; }); }, 70));
    for (let c = 0; c < 3; c++) {
      await sleep(c === 0 ? 650 : 380);
      clearInterval(timers[c]);
      if (cols[c]) [...cols[c].children].forEach((s, r) => { const x = fin[c][r]; s.textContent = x.s; s.className = 'sym y-' + x.k + (r === 1 ? ' mid' : ''); });
    }
    SL.grid = fin;
    const line = fin.map((col) => col[1].k);
    let back = 0, msg = '', jp = false;
    if (line[0] === line[1] && line[1] === line[2]) {
      const k = line[0];
      if (k === 'seven') { back = w.slot.pool + bet * 100; msg = '잭팟!!! ' + fmt(back) + '칩'; w.slot.pool = 500; jp = true; P.inc('sl777'); }
      else if (k === 'gift') { const r = Math.random(); const n = r < 0.72 ? giveAuction(RARE) : r < 0.92 ? giveAuction(LEGEND) : (P.auction.deliver('blackchip'), '검은 칩'); msg = '🎁🎁🎁 경매장 물건: ' + (n || giveShop(3)); P.inc('slItem'); }
      else { back = bet * PAY3[k]; msg = PAY3[k] + '배! ' + fmt(back) + '칩'; if (k === 'cherry') P.inc('slCherry'); }
    } else if (line[0] === 'cherry' && line[1] === 'cherry') { back = bet * 2; msg = '체리 두 개 · ' + fmt(back) + '칩'; }
    else if (line[0] === 'cherry') { back = bet; msg = '체리 하나 · 본전'; }
    const gifts = line.filter((k) => k === 'gift').length;
    if (gifts === 2) { msg = (msg ? msg + ' · ' : '') + '🎁 ' + giveShop(1); P.inc('slItem'); }
    if (!msg) msg = '꽝';
    w.chips += back;
    P.inc('slSpin');
    const px = P.settle({ game: 'slots', net: back - bet, staked: bet, folded: false });
    SL.msg = msg + (px ? ' (효과 ' + (px > 0 ? '+' : '') + fmt(px) + ')' : '');
    SL.busy = false;
    A.renderTop();
    if (!P.isOn('sl')) { SL.auto = 0; return; }
    openSlots();
    if (jp) document.querySelector('.machine').classList.add('jackpot');
    if (SL.auto > 0) { SL.auto--; if (SL.auto > 0) { await sleep(500); if (P.isOn('sl') && SL.auto > 0) spinSlots(); else openSlots(); } else openSlots(); }
  }

  // ════════════════ 지하 테이블 ════════════════
  const UG_T = [
    { id: 'ug1', name: '지하', sb: 5, bb: 10, min: 500, max: 5000, info: '블라인드 5/10 · 바이인 500~5,000' },
    { id: 'ug2', name: '깊은 지하', sb: 25, bb: 50, min: 2000, max: 20000, info: '블라인드 25/50 · 바이인 2,000~20,000' }
  ];
  const MARKET = [
    { id: 'marked', price: 180 }, { id: 'ring', price: 150 }, { id: 'fake', price: 200 },
    { id: 'lens', price: 30 }, { id: 'sleeve', price: 90 }, { id: 'cigarette', price: 55 }
  ];
  const TELL = {
    ace: ['손이 소매 쪽으로 갔다', '카드를 너무 오래 쥐고 있다', '소매 끝이 불룩하다'],
    smoke: ['갑자기 담배 연기가 짙어졌다', '연기 너머로 손이 바쁘다'],
    fake: ['칩 색이 조금 다르다']
  };
  const FAKE = ['헛기침을 했다', '넥타이를 고쳐 맸다', '시계를 들여다본다', '손톱으로 테이블을 두드린다'];
  const unlocked = () => (W().st.t13Visit || 0) >= 1;
  function openUnder() {
    const w = W(), today = A.dayKey();
    const el = P.screen('지하', '계단 아래, 담배 연기와 낮은 조명. 여기엔 의심 게이지가 없어요. 대신 아이템을 쓸 때마다 30% 확률로 걸려요.', 'ug-screen');
    if (w.ug.ban === today) {
      el.append(h('div', { class: 'panel' }, h('h3', { text: '오늘은 내려갈 수 없어요' }), h('p', { class: 'note', text: '문지기가 당신 얼굴을 기억해요. 내일 아침 6시 이후에 다시 오세요. 오늘 하루는 위층 의심도 50 아래로 내려가지 않아요.' })));
      return;
    }
    const tables = h('div', { class: 'paths ug-paths' });
    for (const T of UG_T) {
      tables.append(h('div', { class: 'path ug' }, h('span', { class: 'arch' }), h('h2', { text: '홀덤 · ' + T.name }), h('p', { class: 'rules', text: '손님들도 아이템을 써요. 낌새가 보이면 고발하세요. 맞으면 그 손님 칩의 절반이 내 것, 틀리면 내 칩의 20%가 벌금.' }),
        h('div', { class: 'tierinfo', text: T.info + (w.chips < T.min ? ' · 칩이 부족해요' : '') }),
        h('button', { class: 'btn gold', text: '앉기', disabled: w.chips < T.min, onclick: () => askBuy(T) })));
    }
    el.append(tables);
    const mk = h('div', { class: 'shop-grid' });
    for (const m of MARKET) {
      const it = A.ITEMS[m.id];
      mk.append(h('div', { class: 'ware ug-ware' }, h('div', { class: 'head' }, h('span', { class: 'ico', svg: A.icon(m.id, 26) }), h('div', null, h('h3', { text: it.name }), h('div', { class: 'kind cheat', text: it.under ? '암시장 전용' : '암시장 할인' }))),
        h('p', { text: typeof it.desc === 'string' ? it.desc : it.desc.holdem }),
        h('div', { class: 'foot' }, h('span', { class: 'own', text: '가진 것 ' + (w.items[m.id] || 0) + '개' }),
          h('button', { class: 'btn small gold', disabled: w.chips < m.price, onclick: () => { if (w.chips < m.price) return; w.chips -= m.price; w.items[m.id] = (w.items[m.id] || 0) + 1; P.inc('market'); A.save(); A.renderTop(); P.check(); A.toast(it.name + '을(를) 샀어요.'); openUnder(); } }, h('span', { class: 'chip-ico' }), ' ' + fmt(m.price)))));
    }
    el.append(h('h2', { text: '암시장', style: 'margin:24px 0 10px' }), h('p', { class: 'note', text: '여기서 산 물건도 지하에서 쓰면 30% 확률로 걸려요. 암시장 전용 물건은 지하에서만 쓸 수 있어요.', style: 'margin-bottom:10px' }), mk);
  }
  function askBuy(T) {
    const w = W();
    const max = Math.min(T.max, w.chips), def = Math.min(max, Math.max(T.min, T.bb * 100));
    const r = h('input', { type: 'range', min: String(T.min), max: String(max), step: String(T.bb), value: String(def), 'aria-label': '가져갈 칩' });
    const out = h('b', { class: 'num', text: fmt(def) });
    r.oninput = () => { out.textContent = fmt(r.value); };
    A.dialog('지하 · ' + T.name, [h('p', { class: 'sub', text: '가져갈 칩을 정하세요. 걸리면 이 칩은 전부 잃어요.' }), h('div', { class: 'stat' }, '가져갈 칩 ', out), r,
      h('div', { class: 'row' }, h('button', { class: 'btn gold', text: '내려간다', onclick: () => { A.closeDialog(); P.stopAll(); A.sitPoker('holdem', T, Number(r.value), { under: true }); P.inc('ugSit'); } }))]);
  }
  // 판이 시작될 때: 손님들의 속임수
  function handStart(S, t) {
    S.cheated = {}; S.tells = {}; S.accused = false; S.ugEject = [];
    t.seats.forEach((s, i) => {
      if (!i || s.folded || !s.cards.length) return;
      if (Math.random() < 0.15) {
        const kind = rand(['ace', 'smoke']);
        const lo = s.cards[0] >> 2 <= s.cards[1] >> 2 ? 0 : 1;
        if (kind === 'ace') { const k = t.deck.findIndex((c) => (c >> 2) === 12); if (k >= 0) { const old = s.cards[lo]; s.cards[lo] = t.deck[k]; t.deck[k] = old; } }
        else { const old = s.cards[lo]; s.cards[lo] = t.deck.shift(); t.deck.push(old); }
        if (Math.random() < 0.3) { eject(S, t, i, '경비원이 ' + s.name + '을(를) 끌고 나갔어요. ' + (kind === 'ace' ? '소매에서 에이스가 나왔대요.' : '연기 속 바꿔치기가 들켰대요.')); return; }
        S.cheated[i] = kind;
        if (Math.random() < 0.7) S.tells[i] = rand(TELL[kind]);
      } else if (Math.random() < 0.07) S.tells[i] = rand(FAKE);
    });
  }
  // 손님 퇴장: 칩은 남은 사람들끼리 나눈다
  function eject(S, t, i, msg, toMe) {
    const s = t.seats[i]; if (!s || s.folded && s.stack <= 0) return;
    let pool = s.stack;
    if (t.toAct === i && t.phase === 'bet') { A.C.act(t, i, { type: 'fold' }); }
    s.folded = true;
    s.stack = 0;
    if (toMe != null) { t.seats[0].stack += toMe; pool = 0; }
    const others = t.seats.map((x, k) => k).filter((k) => k !== i && t.seats[k].stack > 0 || k === 0);
    if (pool > 0 && others.length) { const share = Math.floor(pool / others.length); for (const k of others) t.seats[k].stack += share; }
    if (W().table) W().table.stack = t.seats[0].stack;
    A.save();
    A.toast(msg);
  }
  function accuse(i) {
    const S = A.S; if (!S || !S.under || S.accused) return;
    const t = S.t, s = t.seats[i]; S.accused = true;
    if (S.cheated[i]) {
      const gain = Math.floor(s.stack / 2);
      P.inc('ugAccuse');
      eject(S, t, i, '고발 성공! ' + s.name + '의 소매에서 증거가 나왔어요. ' + fmt(gain) + '칩을 받았어요.', gain);
    } else {
      const me = t.seats[0], fine = Math.floor(me.stack * 0.2);
      me.stack -= fine; if (W().table) W().table.stack = me.stack; P.inc('ugFalse');
      A.toast('헛다리였어요. 벌금 ' + fmt(fine) + '칩.');
      delete S.tells[i];
    }
    A.save(); P.check(); A.renderTable();
  }
  function panel(S) {
    const t = S.t;
    const box = h('div', { class: 'chooser ug-acc' }, h('b', { text: '고발 · 한 판에 한 번' }));
    if (!(t.phase === 'bet' || t.phase === 'choose')) { box.append(h('p', { class: 'note', text: '판이 진행 중일 때 고발할 수 있어요.' })); return box; }
    if (S.accused) { box.append(h('p', { class: 'note', text: '이번 판엔 이미 고발했어요.' })); return box; }
    const r = h('div', { class: 'row' });
    t.seats.forEach((s, i) => { if (i && !s.folded) r.append(h('button', { class: 'btn small' + (S.tells[i] ? ' red' : ''), text: s.name + (S.tells[i] ? ' ⚠' : ''), onclick: () => accuse(i) })); });
    box.append(r, h('p', { class: 'note', text: '⚠는 낌새가 보인 손님이에요. 맞으면 그 손님 칩의 절반, 틀리면 내 칩의 20%를 벌금으로.' }));
    return box;
  }
  // 아이템을 쓸 때마다: 30% 확률로 적발
  function onItem() {
    const s = W().st;
    if (Math.random() < 0.3) { s.ugCleanRun = 0; setTimeout(caught, 450); return false; }
    s.ugCleanRun = (s.ugCleanRun || 0) + 1; s.ugCleanBest = Math.max(s.ugCleanBest || 0, s.ugCleanRun);
    P.check();
    return true;
  }
  function caught() {
    const S = A.S, w = W(), today = A.dayKey();
    if (!S || !S.under) return;
    A.stopTimers();
    const lost = S.t.seats[0].stack;
    S.t.seats[0].stack = 0; w.table = null; A.S = null;
    w.ug.ban = today; w.ug.floor = today; w.sus = Math.max(w.sus, 50);
    P.inc('ugCaught'); A.save(); A.renderTop(); P.check();
    A.dialog('지하 문지기가 팔을 붙잡습니다', [h('p', { class: 'sub', text: '아이템을 쓰다 들켰어요. 가져온 칩 ' + fmt(lost) + '칩을 전부 잃었어요. 오늘은 지하에 다시 내려올 수 없고, 하루 동안 의심이 50 아래로 내려가지 않아요.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn gold', text: '위층으로', onclick: () => { A.closeDialog(); A.show('scrLobby'); A.renderLobby(); } }))], false);
  }

  P.wheel = { open: openWheel, pending, banner };
  P.baccarat = { open: openBaccarat, btot, bval };
  P.slots = { open: openSlots, SYM };
  P.under = { open: openUnder, unlocked, handStart, panel, onItem, caught, accuse, TELL };
})();
