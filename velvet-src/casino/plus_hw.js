/* ===== 벨벳 카지노 · 할로윈 이벤트 =====
   기간, 사탕, 마녀의 솥(뽑기·천장·중복 페이백), 이벤트 소모품, 하루 과제, 의상과 옷장,
   입구(박쥐 떼)·로비 배너(위자 보드)·접속 팝업, 바의 새 알바 루나.
   그림은 velvet/hw/ 폴더의 webp 파일을 쓴다. 이벤트가 끝나도 의상·칭호는 남는다. */
const HW = (() => {
  const A = App, P = Plus;
  const { h, $ } = A;
  const fmt = (n) => A.fmt(n);
  const W = () => A.W.data;
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const IMG = (n) => 'hw/' + n + '.webp';
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ───────── 기간 ─────────
  // 한국 시간 기준. 관리자 모드에서 "미리 열기 / 닫힌 상태 보기"로 내 계정만 바꿀 수 있다.
  const START = Date.parse('2026-10-25T06:00:00+09:00');
  const END = Date.parse('2026-11-08T06:00:00+09:00');

  function norm(w) {
    if (w.hw && w.hw._v === 2) return w.hw;
    const x = Object.assign({ candy: 0, total: 0, own: {}, eq: {}, items: {}, ms: null, popDay: '', met: false, force: '', endDone: false }, w.hw || {});
    x.pity = Object.assign({ cos: 0, leg: 0 }, x.pity);
    if (x.pity.ult == null) {
      // 초레어 천장이 생기기 전에 뽑은 횟수도 쳐 준다 (초레어를 아직 못 받은 사람만)
      const hasU = Object.keys(x.own).some((k) => COS_BY[k] && COS_BY[k].g === 'u');
      x.pity.ult = hasU ? 0 : Math.min(PITY_ULT - 1, (w.st && w.st.hwPull) || 0);
    }
    x.ult = Math.max(0, Math.floor(Number(x.ult) || 0));   // 초레어 선택권
    x.own = Object.assign({}, x.own); x.eq = Object.assign({}, x.eq); x.items = Object.assign({}, x.items);
    x.fx = Object.assign({ basket: 0, lantern: 0, broom: 0, cloak: 0, wings: 0 }, x.fx);
    x.candy = Math.max(0, Math.floor(Number(x.candy) || 0));
    x._v = 2;
    w.hw = x;
    return x;
  }
  const H = () => norm(W());
  function isOn() {
    if (window.HW_TEST_OFF) return false;   // 예전 시험용: 이벤트 끄기
    const w = W(), f = w && w.hw ? w.hw.force : '';
    if (f === 'on') return true;
    if (f === 'off') return false;
    const t = Date.now();
    return t >= START && t < END;
  }
  const isOver = () => !isOn() && (Date.now() >= END || (W() && H().force === 'off'));
  function until() {
    const left = END - Date.now();
    if (left <= 0) return '';
    const d = Math.floor(left / 864e5), hr = Math.floor((left % 864e5) / 36e5);
    return '끝까지 ' + (d ? d + '일 ' : '') + hr + '시간';
  }

  // ───────── 아이콘 ─────────
  const ICO = {
    candy: '<path d="M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0z"/><path d="M8 12 3 8.5v7zM16 12l5-3.5v7z"/><path d="M10.2 9.8l3.6 4.4"/>',
    basket: '<path d="M3.5 10h17l-2.2 10H5.7z"/><path d="M7.5 10a4.5 4.5 0 0 1 9 0"/><path d="M9 13.5v3.5M12 13.5v3.5M15 13.5v3.5"/>',
    lantern: '<ellipse cx="12" cy="13.5" rx="8" ry="6.8"/><path d="M12 6.7V4l2-1.5"/><path d="M8 12l1.5 1.5L11 12M13 12l1.5 1.5L16 12M8.5 16.3c2 1.5 5 1.5 7 0"/>',
    broom: '<path d="M20 3 10.5 12.5"/><path d="M10.5 12.5c-2.2-.3-5 1-6.2 3.2l4.2 4.6c2.3-1.1 3.4-4 3.1-6.2z"/><path d="M6.4 17.3l2 2.1M8.4 15.2l2 2.1"/>',
    cloak: '<path d="M6 21V10a6 6 0 0 1 12 0v11l-2-2-2 2-2-2-2 2-2-2z"/><circle cx="10" cy="10.5" r=".9"/><circle cx="14" cy="10.5" r=".9"/>',
    wings: '<path d="M12 9 10.4 6.5v3C7.6 7.8 4.6 8.4 2 7.4c1.2 2.8 1.2 5 0 7.2 2-1 4.2-.2 5.2 1.8 1.2-1.8 3.2-1.9 4.8-.2 1.6-1.7 3.6-1.6 4.8.2 1-2 3.2-2.8 5.2-1.8-1.2-2.2-1.2-4.4 0-7.2-2.6 1-5.6.4-8.4 2.1v-3z"/>',
    bomb: '<circle cx="11" cy="14" r="7"/><path d="M15.5 8.5l2-2"/><path d="M18 4v2M20 6h-2M19.5 4.5l-1.2 1.2"/><path d="M8.2 12.4a3.2 3.2 0 0 1 3-3"/>',
    star: '<path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.6 6.7 19.5l1.1-6L3.4 9.3l6-.8z"/>'
  };
  const icon = (k, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k] || ''}</svg>`;
  // 도트 유령 (승리 효과·썸네일)
  const GHOST_MAP = ['...####...', '.########.', '##########', '##oo##oo##', '##oo##oo##', '##########', '####oo####', '##########', '##########', '#.##..##.#'];
  const GHOST_SVG = (() => {
    let r = '';
    GHOST_MAP.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c === 'o' ? '#1b1530' : '#f4f1ff'}"/>`; }));
    return `<svg viewBox="0 0 10 10" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
  })();

  // ───────── 의상 ─────────
  const GR = {
    n: { name: '일반', back: 30 }, r: { name: '희귀', back: 80 }, l: { name: '전설', back: 200 }, u: { name: '초레어', back: 500 }
  };
  const ORDER = { n: 0, r: 1, l: 2, u: 3 };
  const SLOT = { card: '카드 테마', pt: '초상화', frame: '초상화 테두리', luna: '루나 분장', noel: '노엘 의상', table: '테이블 무늬', fx: '승리 효과' };
  const SLOT_NOTE = {
    card: '트럼프·화투 뒷면, 룰렛 가운데, 슬롯머신 테두리가 함께 바뀌어요.', pt: '위쪽 막대와 내 자리 이름표에 나와요.', frame: '초상화를 두르는 테두리예요.',
    luna: '바에 있는 루나가 이 옷을 입어요.', noel: '바텐더 노엘의 옷이 바뀌어요.', table: '테이블 천 무늬가 바뀌어요.', fx: '판을 이기면 화면에 터져요.'
  };
  const COS = [
    ['card_bat', 'card', '박쥐 카드', 'n'], ['card_web', 'card', '거미줄 카드', 'n'], ['card_pumpkin', 'card', '호박 카드', 'n'], ['card_ghost', 'card', '유령 카드', 'r'], ['card_moon', 'card', '붉은 달 카드', 'l'],
    ['pt_pumpkin', 'pt', '호박가면 신사', 'n'], ['pt_skeleton', 'pt', '해골 정장', 'n'], ['pt_wolf', 'pt', '늑대인간', 'r'], ['pt_witch', 'pt', '마녀', 'r'], ['pt_vampire', 'pt', '뱀파이어', 'l'], ['pt_succubus', 'pt', '서큐버스', 'u'],
    ['fr_vine', 'frame', '호박 덩굴 테두리', 'n'], ['fr_web', 'frame', '거미줄 테두리', 'n'], ['fr_bone', 'frame', '뼈 테두리', 'r'], ['fr_flame', 'frame', '보랏빛 불꽃 테두리', 'l'],
    ['luna_witch', 'luna', '루나 · 마녀', 'n'], ['luna_mummy', 'luna', '루나 · 미라', 'r'], ['luna_vampire', 'luna', '루나 · 뱀파이어', 'l'], ['luna_succubus', 'luna', '루나 · 서큐버스', 'u'], ['luna_cat', 'luna', '루나 · 검은 고양이', 'u'],
    ['noel_ghost', 'noel', '노엘 · 유령 집사', 'l'],
    ['tb_fog', 'table', '보라 안개 테이블', 'n'], ['tb_pumpkin', 'table', '호박밭 테이블', 'n'], ['tb_moss', 'table', '묘지 이끼 테이블', 'r'],
    ['fx_bats', 'fx', '박쥐 떼', 'n'], ['fx_candy', 'fx', '사탕 비', 'n'], ['fx_ghost', 'fx', '유령 행렬', 'r'], ['fx_fire', 'fx', '호박 불꽃놀이', 'l']
  ].map(([id, slot, name, g]) => ({ id, slot, name, g }));
  const COS_BY = {};
  COS.forEach((c) => { COS_BY[c.id] = c; });
  const ownCount = (w) => Object.keys(((w || {}).hw || {}).own || {}).filter((k) => COS_BY[k]).length;

  // ───────── 이벤트 소모품 ─────────
  const EV = {
    basket: { name: '사탕 바구니', desc: '이긴 판 5번 동안 사탕이 50% 더 나와요.' },
    lantern: { name: '호박 랜턴', desc: '진 판 5번 동안, 잃은 칩 30개마다 사탕 1개를 받아요.' },
    broom: { name: '마녀의 빗자루', desc: '다음 3판 동안 카드 운 +20%.' },
    cloak: { name: '유령 망토', desc: '다음 속임수 한 번은 의심이 오르지 않아요. 지하에서는 적발 확률이 15%로 줄어요.' },
    wings: { name: '박쥐 날개', desc: '다음 룰렛·슬롯 한 판, 이기면 받는 칩 +10%.' },
    bomb: { name: '사탕 폭탄', desc: '터뜨리면 사탕 50~300개가 쏟아져요.' }
  };
  const EV_IDS = Object.keys(EV);

  // ───────── 마녀의 솥 (뽑기) ─────────
  // 확률(%): 초레어 0.05 · 전설 0.3 · 희귀 1.2 · 일반 3.5 · 경매 희귀품 3 · 검은 칩 0.1 · 이벤트 소모품 19 · 상점 아이템 28 · 칩 44.85
  const RATE = [['u', 0.05], ['l', 0.3], ['r', 1.2], ['n', 3.5], ['auc', 3], ['bc', 0.1], ['ev', 19], ['shop', 28]];
  const PITY_COS = 40, PITY_LEG = 150, PITY_ULT = 300, COST1 = 100, COST11 = 1000;
  const SHOP_POOL = ['lens', 'mirror', 'cigarette', 'clover', 'slot', 'insurance', 'whiskey', 'notebook', 'pistol', 'sleeve', 'magnet'];
  const RARE = ['glasses', 'fan', 'coin', 'shadow', 'box', 'dice'];
  const pickCos = (g) => rand(COS.filter((c) => c.g === g));
  const chipAmt = () => 1 + Math.floor(Math.pow(Math.random(), 2) * 200);
  // pity: { cos: 의상 없이, leg: 전설 없이, ult: 초레어 없이 뽑은 횟수 }.
  // 초레어 천장(300번)은 의상이 아니라 "초레어 선택권"으로 나온다. 받을 초레어는 플레이어가 고른다.
  function roll(pity, rnd = Math.random) {
    pity.cos++; pity.leg++; pity.ult = (pity.ult || 0) + 1;
    let g = null;
    if (pity.ult >= PITY_ULT) { pity.cos = 0; pity.leg = 0; pity.ult = 0; return { kind: 'cos', g: 'u', pick: true }; }
    if (pity.leg >= PITY_LEG) g = 'l';
    else if (pity.cos >= PITY_COS) { const r = rnd() * 5; g = r < 3.5 ? 'n' : r < 4.7 ? 'r' : 'l'; }
    else {
      let r = rnd() * 100, kind = 'chips';
      for (const [k, p] of RATE) { if (r < p) { kind = k; break; } r -= p; }
      if (kind === 'auc') return { kind };
      if (kind === 'bc') return { kind, id: 'blackchip' };
      if (kind === 'ev') return { kind, id: rand(EV_IDS) };
      if (kind === 'shop') return { kind, id: rand(SHOP_POOL) };
      if (kind === 'chips') return { kind, n: chipAmt() };
      g = kind;
    }
    pity.cos = 0;
    if (g === 'l' || g === 'u') pity.leg = 0;
    if (g === 'u') pity.ult = 0;
    return { kind: 'cos', id: pickCos(g).id, g };
  }
  function grant(res) {
    const w = W(), x = H();
    if (res.kind === 'chips') { w.chips += res.n; res.name = fmt(res.n) + '칩'; }
    else if (res.kind === 'shop') { w.items[res.id] = (w.items[res.id] || 0) + 1; res.name = A.ITEMS[res.id].name; }
    else if (res.kind === 'auc') {
      const C = P.auction.CAT, ok = RARE.filter((id) => !(C[id].perm && P.auction.owned(id)));
      if (ok.length) { res.id = rand(ok); P.auction.deliver(res.id); res.name = C[res.id].name; }
      else { res.kind = 'chips'; res.n = 300; w.chips += 300; res.name = '300칩'; }
    } else if (res.kind === 'ev') { x.items[res.id] = (x.items[res.id] || 0) + 1; res.name = EV[res.id].name; }
    else if (res.kind === 'bc') { P.auction.deliver('blackchip'); res.name = '검은 칩 한 개'; }
    else if (res.kind === 'cos' && res.pick) { x.ult += 1; res.name = '초레어 선택권'; }
    else if (res.kind === 'cos') {
      const c = COS_BY[res.id]; res.name = c.name;
      if (x.own[res.id]) { res.dupe = GR[c.g].back; x.candy += res.dupe; P.inc('hwDupe'); }
      x.own[res.id] = (x.own[res.id] || 0) + 1;
      if (c.g === 'l') P.inc('hwLegend');
      if (c.g === 'u') P.inc('hwUltra');
    }
    return res;
  }
  function pull(n) {
    const x = H(), cost = n === 11 ? COST11 : COST1;
    if (!isOn() || x.candy < cost) return null;
    x.candy -= cost;
    const out = [];
    for (let i = 0; i < n; i++) out.push(roll(x.pity));
    // 10+1: 이벤트 물건(소모품이나 의상) 하나는 꼭
    if (n === 11 && !out.some((r) => r.kind === 'ev' || r.kind === 'cos')) out[10] = { kind: 'ev', id: rand(EV_IDS), sure: true };
    out.forEach(grant);
    P.inc('hwPull', n);
    if (n === 11) P.inc('hwTen');
    A.save(); A.renderTop(); P.check();
    return out;
  }
  const dispG = (r) => (r.kind === 'cos' ? r.g : r.kind === 'auc' || r.kind === 'bc' ? 'r' : r.kind === 'ev' ? 'e' : 'n');

  // ───────── 사탕 ─────────
  function addCandy(k) {
    k = Math.floor(k); if (k <= 0) return;
    const x = H(); x.candy += k; x.total += k; P.inc('hwCandy', k);
    floatCandy(k);
  }
  function floatCandy(k) {
    const c = $('#wCandy'); if (!c || reduce()) return;
    const r = c.getBoundingClientRect();
    const f = h('span', { class: 'hw-float', text: '+' + k, style: `left:${r.left + r.width / 2}px;top:${r.bottom}px` });
    document.body.append(f);
    setTimeout(() => f.remove(), 1300);
  }

  // ───────── 하루 과제 ─────────
  const MS = [
    { id: 'play10', t: '아무 게임이나 10판 하기', need: 10, r: 40 },
    { id: 'win5', t: '아무 게임이나 5판 이기기', need: 5, win: true, r: 60 },
    { id: 'bj3', t: '블랙잭 3판 이기기', need: 3, win: true, g: ['blackjack'], r: 50 },
    { id: 'pk2', t: '홀덤이나 세븐 포커 2판 이기기', need: 2, win: true, g: ['holdem', 'seven'], r: 60 },
    { id: 'ro5', t: '룰렛 5판 돌리기', need: 5, g: ['roulette'], r: 30 },
    { id: 'sl20', t: '슬롯머신 20번 돌리기', need: 20, g: ['slots'], r: 30 },
    { id: 'bc3', t: '바카라 3판 하기', need: 3, g: ['baccarat'], r: 30 },
    { id: 'sd2', t: '섯다 2판 이기기', need: 2, win: true, g: ['seotda'], r: 50 },
    { id: 'ip3', t: '인디언 포커 3판 하기', need: 3, g: ['indian'], r: 30 },
    { id: 'ch1', t: '체스룸에서 한 판 두기', need: 1, g: ['chess'], r: 40 },
    { id: 'big', t: '한 판에 300칩 이상 따기', need: 1, big: 300, r: 60 }
  ];
  const MS_BONUS = 50;
  const msOf = (id) => MS.find((m) => m.id === id);
  function missions() {
    const x = H(), day = A.dayKey();
    if (!x.ms || x.ms.day !== day || !Array.isArray(x.ms.list)) {
      const ids = MS.map((m) => m.id).sort(() => Math.random() - 0.5).slice(0, 3);
      x.ms = { day, list: ids.map((id) => ({ id, n: 0, got: false })), bonus: false };
    }
    return x.ms;
  }
  function mission(o) {
    const ms = missions();
    for (const q of ms.list) {
      const m = msOf(q.id); if (!m || q.n >= m.need) continue;
      if (m.g && !m.g.includes(o.game)) continue;
      if (m.win && !(o.net > 0)) continue;
      if (m.big && !(o.net >= m.big)) continue;
      q.n++;
      if (q.n >= m.need) A.toast('오늘의 과제 완료: ' + m.t + '. 축제 화면에서 사탕을 받으세요.');
    }
  }
  function claim(i) {
    const ms = missions(), q = ms.list[i], m = q && msOf(q.id);
    if (!m || q.got || q.n < m.need) return;
    q.got = true; addCandy(m.r);
    if (ms.list.every((z) => z.got) && !ms.bonus) { ms.bonus = true; addCandy(MS_BONUS); A.toast('오늘 과제를 모두 끝냈어요! 보너스 사탕 ' + MS_BONUS + '개.'); }
    A.save(); A.renderTop(); P.check(); render();
  }

  // ───────── 게임과 이어 붙이기 ─────────
  let lastFx = 0;
  const baseSettle = P.settle;
  P.settle = (o) => {
    const ret = baseSettle(o);
    const w = W(); if (!w) return ret;
    const x = H(), net = o.net;
    let bonus = 0;
    if ((o.game === 'roulette' || o.game === 'slots') && x.fx.wings > 0) {
      x.fx.wings--;
      if (net > 0) { bonus = Math.max(1, Math.floor((net + (o.staked || 0)) * 0.1)); w.chips += bonus; A.toast('박쥐 날개: 받은 칩 +10% (' + fmt(bonus) + '칩)'); }
    }
    if (x.fx.broom > 0) x.fx.broom--;
    if (isOn()) {
      if (net > 0) {
        let k = Math.floor(net / 30);
        if (x.fx.basket > 0) { x.fx.basket--; k = Math.round(k * 1.5); }
        addCandy(k);
      } else if (net < 0 && x.fx.lantern > 0) { x.fx.lantern--; addCandy(Math.max(1, Math.floor(-net / 30))); }
      mission(o);
    }
    if (net + bonus > 0) winFx();
    A.save(); A.renderTop();
    return ret + bonus;
  };
  const baseLuck = P.luckP;
  P.luckP = () => Math.min(0.6, baseLuck() + (W() && H().fx.broom > 0 ? 0.2 : 0));
  const baseSus = P.susGain;
  P.susGain = (n) => {
    if (n > 0 && W() && H().fx.cloak > 0) { H().fx.cloak = 0; A.toast('유령 망토가 손을 가려 줬어요. 아무도 눈치채지 못했어요.'); return 0; }
    return baseSus(n);
  };
  if (P.under) {
    const baseItem = P.under.onItem;
    P.under.onItem = () => {
      if (!(H().fx.cloak > 0)) return baseItem();
      H().fx.cloak = 0;
      const s = W().st;
      if (Math.random() < 0.15) { s.ugCleanRun = 0; setTimeout(P.under.caught, 450); return false; }
      s.ugCleanRun = (s.ugCleanRun || 0) + 1; s.ugCleanBest = Math.max(s.ugCleanBest || 0, s.ugCleanRun);
      A.toast('유령 망토 속에서 손이 움직였어요.');
      A.save(); P.check();
      return true;
    };
  }

  // ───────── 칭호 ─────────
  const TITLES = [
    ['hw_luna', '새 얼굴', 1, 0, '바에서 새 알바 루나 만나기', (s) => s.hwLuna >= 1, 'bar', 1],
    ['hw_ten', '열하나의 소원', 1, 0, '마녀의 솥 10+1 처음 돌리기', (s) => s.hwTen >= 1, 'luck', 0.01],
    ['hw_candy1k', '사탕 한 바구니', 1, 0, '사탕 누적 1,000개', (s) => s.hwCandy >= 1000, 'morning', 10],
    ['hw_candy10k', '사탕 부자', 3, 0, '사탕 누적 10,000개', (s) => s.hwCandy >= 10000, 'morning', 30],
    ['hw_c5', '분장 애호가', 2, 0, '할로윈 의상 5종 모으기', (s, w) => ownCount(w) >= 5, 'win', 0.01],
    ['hw_c15', '할로윈 옷장', 3, 0, '할로윈 의상 15종 모으기', (s, w) => ownCount(w) >= 15, 'win', 0.02],
    ['hw_call', '밤의 수집가', 4, 1, '할로윈 의상 전부 모으기', (s, w) => ownCount(w) >= COS.length, 'win', 0.04],
    ['hw_dupe', '또 너야?', 1, 1, '이미 가진 의상 또 뽑기', (s) => s.hwDupe >= 1, 'loss', 0.02],
    ['hw_legend', '전설의 밤', 3, 0, '전설 의상 뽑기', (s) => s.hwLegend >= 1, 'luck', 0.03],
    ['hw_ultra', '금지된 옷장', 4, 1, '초레어 의상 뽑기', (s) => s.hwUltra >= 1, 'luck', 0.05]
  ];
  for (const t of TITLES) if (!P.TITLE_BY[t[0]]) { P.TITLES.push(t); P.TITLE_BY[t[0]] = t; }

  // ───────── 꾸미기 적용 ─────────
  function apply() {
    const root = document.documentElement, w = W();
    const eq = w ? H().eq : {};
    for (const s of Object.keys(eq)) if (eq[s] && !(COS_BY[eq[s]] && H().own[eq[s]])) eq[s] = null;
    root.classList.toggle('hw-cb', !!eq.card);
    if (eq.card) root.style.setProperty('--hw-cardback', 'url("' + IMG(eq.card) + '")');
    root.classList.toggle('hw-tb', !!eq.table);
    if (eq.table) root.style.setProperty('--hw-table', 'url("' + IMG(eq.table) + '")');
    root.classList.toggle('hw-on', isOn());
    door();
  }
  function equip(id) {
    const c = COS_BY[id], x = H(); if (!c || !x.own[id]) return;
    x.eq[c.slot] = x.eq[c.slot] === id ? null : id;
    A.save(); apply(); A.renderTop();
    if (c.slot === 'fx' && x.eq.fx) playFx(id);
  }
  // 초상화 (테두리 포함). 둘 다 없으면 null
  function portrait(size = 34, o = {}) {
    const eq = o.eq || (W() ? H().eq : {});
    if (!eq.pt && !eq.frame && !o.force) return null;
    const box = h('span', { class: 'hw-pt ' + (eq.frame || 'fr-none'), style: '--s:' + size + 'px', 'aria-hidden': 'true' });
    box.append(eq.pt ? h('img', { src: IMG(eq.pt), alt: '' }) : h('i', { class: 'hw-pt-blank' }));
    return box;
  }
  function top() {
    const bar = document.querySelector('.topbar'); if (!bar || !W()) return;
    const x = H();
    const key = (x.eq.pt || '') + '|' + (x.eq.frame || '');
    let pt = $('#wPortrait');
    if (!pt || pt.dataset.key !== key) {
      if (pt) pt.remove();
      const p = portrait(30);
      if (p) { p.id = 'wPortrait'; p.dataset.key = key; bar.querySelector('.brand').after(p); }
    }
    let c = $('#wCandy');
    const show = isOn() || x.candy > 0;
    if (!c) {
      c = h('button', { class: 'stat hw-candy', id: 'wCandy', title: '할로윈 사탕', onclick: () => (isOn() ? open() : (P.renderRoom && openCloset())) });
      const chips = bar.querySelector('.stat'); if (chips) chips.after(c); else bar.append(c);
    }
    c.hidden = !show;
    c.innerHTML = icon('candy', 17) + '<b>' + fmt(x.candy) + '</b>';
    c.setAttribute('aria-label', '사탕 ' + x.candy + '개');
  }
  function refreshCloset() { const y = window.scrollY; P.renderRoom(); window.scrollTo(0, y); }
  function openCloset() { P.open('room'); const t = [...document.querySelectorAll('.tab')].find((b) => b.textContent.startsWith('옷장')); if (t) t.click(); }

  // ───────── 승리 효과 ─────────
  function winFx() {
    const id = W() && H().eq.fx; if (!id) return;
    const now = Date.now(); if (now - lastFx < 1500) return;
    lastFx = now; playFx(id);
  }
  function playFx(id) {
    if (reduce()) return;
    const lay = h('div', { class: 'hw-fx ' + id, 'aria-hidden': 'true' });
    const R = (a, b) => (a + Math.random() * (b - a)).toFixed(2);
    if (id === 'fx_bats') for (let i = 0; i < 16; i++) lay.append(h('img', { src: IMG('bat'), alt: '', style: `--y:${R(5, 75)}vh;--d:${R(0, .6)}s;--s:${R(.4, 1.1)};--w:${R(-14, 14)}vh` }));
    if (id === 'fx_candy') for (let i = 0; i < 30; i++) lay.append(h('i', { svg: icon('candy', 26), style: `--x:${R(0, 100)}vw;--d:${R(0, .8)}s;--r:${R(-540, 540)}deg;--c:${rand(['#ff8a3d', '#b27bff', '#7be08f', '#ff5c8a', '#ffd25c'])}` }));
    if (id === 'fx_ghost') for (let i = 0; i < 7; i++) lay.append(h('i', { svg: GHOST_SVG, style: `--x:${R(4, 92)}vw;--d:${R(0, .7)}s;--s:${R(36, 70)}px` }));
    if (id === 'fx_fire') { const cv = h('canvas'); lay.append(cv); fireworks(cv); }
    document.body.append(lay);
    setTimeout(() => lay.remove(), 2800);
  }
  function fireworks(cv) {
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const W_ = cv.width = innerWidth, H_ = cv.height = innerHeight, parts = [];
    const cols = ['#ff8a2a', '#ffb347', '#b27bff', '#7be08f', '#ffe08a'];
    for (let b = 0; b < 5; b++) {
      const cx = W_ * (0.15 + Math.random() * 0.7), cy = H_ * (0.15 + Math.random() * 0.45), t0 = b * 260, col = rand(cols);
      for (let i = 0; i < 56; i++) { const a = (i / 56) * Math.PI * 2, v = 2.6 + Math.random() * 4.2; parts.push({ cx, cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t0, col }); }
    }
    const s = performance.now();
    const step = (t) => {
      const e = t - s; ctx.clearRect(0, 0, W_, H_);
      for (const p of parts) {
        const k = (e - p.t0) / 16; if (k < 0) continue;
        const life = 1 - k / 90; if (life <= 0) continue;
        const x = p.cx + p.vx * k, y = p.cy + p.vy * k + 0.035 * k * k;
        ctx.globalAlpha = life; ctx.fillStyle = p.col; ctx.fillRect(Math.round(x / 5) * 5, Math.round(y / 5) * 5, 6, 6);
      }
      if (e < 2600) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ───────── 썸네일 ─────────
  function cosThumb(id) {
    const c = COS_BY[id], box = h('span', { class: 'hw-thumb s-' + c.slot });
    if (c.slot === 'card') box.append(h('img', { src: IMG(id), alt: '' }));
    else if (c.slot === 'pt') box.append(portrait(84, { eq: { pt: id }, force: true }));
    else if (c.slot === 'frame') box.append(portrait(84, { eq: { frame: id }, force: true }));
    else if (c.slot === 'luna' || c.slot === 'noel') box.append(h('img', { src: IMG(id), alt: '' }));
    else if (c.slot === 'table') box.append(h('i', { style: 'background-image:url("' + IMG(id) + '")' }));
    else if (c.slot === 'fx') box.append(h('i', { class: 'fxi', svg: id === 'fx_bats' ? '' : id === 'fx_candy' ? icon('candy', 44) : id === 'fx_ghost' ? GHOST_SVG : icon('star', 44) }, id === 'fx_bats' ? h('img', { src: IMG('bat'), alt: '' }) : null));
    return box;
  }
  function thumb(r) {
    if (r.pick) return h('span', { class: 'hw-thumb s-ico ult', svg: icon('star', 46) });
    if (r.kind === 'cos') return cosThumb(r.id);
    if (r.kind === 'chips') return h('span', { class: 'hw-thumb s-ico' }, h('span', { class: 'chip-ico big' }));
    if (r.kind === 'ev') return h('span', { class: 'hw-thumb s-ico ev', svg: icon(r.id, 46) });
    return h('span', { class: 'hw-thumb s-ico', svg: A.icon(r.id, 46) });
  }
  const KINDNAME = { chips: '칩', shop: '상점 아이템', auc: '경매 희귀품', ev: '이벤트 소모품', bc: '???' };
  function face(r) {
    const f = h('div', { class: 'hw-face g-' + dispG(r) });
    f.append(h('small', { class: 'hw-grade', text: r.pick ? '초레어 확정' : r.kind === 'cos' ? GR[r.g].name + ' 의상' : KINDNAME[r.kind] }), thumb(r), h('b', { text: r.name }));
    if (r.pick) f.append(h('em', { class: 'new', text: '원하는 초레어를 직접 골라요' }));
    else if (r.dupe) f.append(h('em', { text: '이미 가진 의상 · 사탕 +' + r.dupe }));
    else if (r.kind === 'cos') f.append(h('em', { class: 'new', text: 'NEW · ' + SLOT[COS_BY[r.id].slot] }));
    return f;
  }

  // ───────── 뽑기 연출 ─────────
  let busy = false;
  async function doPull(n) {
    if (busy) return;
    const x = H(), cost = n === 11 ? COST11 : COST1;
    if (!isOn()) return A.toast('축제가 끝났어요.');
    if (x.candy < cost) return A.toast('사탕이 모자라요. 이긴 판에서 칩 30개마다 사탕 1개가 나와요.');
    busy = true;
    const res = pull(n);
    if (!res) { busy = false; return; }
    render();
    // 예고: 초레어가 들어 있으면 솥이 붉게 끓고 불이 꺼진다. 전설만 있을 때도 가끔(15%) 같은 예고가 나온다.
    const has = (g) => res.some((r) => r.kind === 'cos' && r.g === g);
    const omen = has('u') || (has('l') && Math.random() < 0.15);
    const cz = $('.hw-cauldron');
    let dark = null;
    if (cz && !reduce()) {
      cz.classList.add('brew');
      if (omen) { cz.classList.add('omen'); dark = h('div', { class: 'hw-omen', 'aria-hidden': 'true' }); document.body.append(dark); if (window.Snd && Snd.ctx) Snd.play('omen'); else heartbeat(3); await sleep(2300); }
      else await sleep(1100);
    }
    try { if (n === 1) await showOne(res[0]); else await showMany(res); }
    finally { if (dark) dark.remove(); busy = false; }
    if (P.isOn('hw')) render();
  }
  let actx = null;
  function heartbeat(times) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = actx.currentTime + 0.05;
      for (let i = 0; i < times; i++) for (const [dt, f, v] of [[0, 96, 0.8], [0.24, 78, 0.55]]) {
        const t = t0 + i * 0.78 + dt, o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.2);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + 0.26);
      }
    } catch (e) { /* 소리 없이 */ }
  }
  // 초레어 선택권 쓰기: 셋 중 하나를 고른다 (이미 가진 걸 고르면 사탕 500)
  function chooseUlt() {
    const x = H(); if (!(x.ult > 0)) return;
    const list = COS.filter((c) => c.g === 'u');
    const grid = h('div', { class: 'hw-wardrobe hw-ultpick' });
    for (const c of list) {
      grid.append(h('button', { class: 'hw-cos g-u', onclick: async () => {
        if (!(H().ult > 0)) return;
        H().ult--; A.closeDialog();
        const r = grant({ kind: 'cos', id: c.id, g: 'u' });
        A.save(); A.renderTop(); P.check();
        await showOne(r, true);
        if (P.isOn('hw')) render(); else if (P.isOn('room')) refreshCloset();
      } }, cosThumb(c.id), h('b', { text: c.name }), h('small', { text: x.own[c.id] ? '이미 가짐 · 고르면 사탕 ' + GR.u.back : SLOT[c.slot] })));
    }
    A.dialog('초레어 고르기', [h('p', { class: 'sub', text: '선택권 ' + x.ult + '장. 갖고 싶은 초레어 하나를 고르세요.' }), grid]);
  }
  function overlay(cls) {
    const ov = h('div', { class: 'hw-pull ' + cls, role: 'dialog', 'aria-modal': 'true', 'aria-label': '뽑기 결과' });
    document.body.append(ov);
    return ov;
  }
  async function ultra(ov) {
    if (reduce()) return;
    ov.classList.add('ultra');
    document.body.classList.add('hw-shake');
    await sleep(1500);
    document.body.classList.remove('hw-shake');
    ov.classList.add('ultra-burst');
    await sleep(500);
    ov.classList.remove('ultra');
  }
  function finish(ov, list) {
    return new Promise((done) => {
      const close = () => { ov.remove(); done(); };
      const row = h('div', { class: 'actions' });
      const news = list.filter((r) => r.kind === 'cos' && !r.dupe && !r.pick);
      if (list.some((r) => r.pick)) row.append(h('button', { class: 'btn gold', text: '초레어 고르기', onclick: () => { close(); chooseUlt(); } }));
      else if (news.length === 1) {
        const c = COS_BY[news[0].id];
        row.append(h('button', { class: 'btn gold', text: '바로 입기', onclick: () => { if (H().eq[c.slot] !== c.id) equip(c.id); A.toast(c.name + '을(를) 입었어요.'); close(); } }));
      } else if (news.length > 1) row.append(h('button', { class: 'btn gold', text: '옷장 열기', onclick: () => { close(); openCloset(); } }));
      row.append(h('button', { class: 'btn', text: '닫기', onclick: close }));
      ov.append(row);
      const b = row.querySelector('button'); if (b) b.focus();
      ov.onkeydown = (e) => { if (e.key === 'Escape') close(); };
    });
  }
  async function showOne(r, calm) {
    const g = dispG(r), ov = overlay('one g-' + g);
    if (g === 'u' && !calm) await ultra(ov);
    const card = h('div', { class: 'hw-flip big' }, h('div', { class: 'hw-back' }), face(r));
    ov.append(h('div', { class: 'hw-burst' }), card);
    await sleep(80); card.classList.add('open');
    await sleep(reduce() ? 0 : 650);
    return finish(ov, [r]);
  }
  async function showMany(list) {
    list = list.filter((r) => dispG(r) !== 'u').concat(list.filter((r) => dispG(r) === 'u'));   // 초레어는 맨 마지막에
    const ov = overlay('many');
    const grid = h('div', { class: 'hw-grid' });
    const cards = list.map((r) => { const c = h('div', { class: 'hw-flip pre-' + dispG(r) }, h('div', { class: 'hw-back' }), face(r)); grid.append(c); return c; });
    let skip = reduce();
    const skipBtn = h('button', { class: 'btn small', text: '모두 열기', onclick: () => { skip = true; } });
    ov.append(h('h2', { text: '마녀의 솥 · 10+1' }), grid, h('div', { class: 'actions' }, skipBtn));
    await sleep(skip ? 0 : 450);
    for (let i = 0; i < cards.length; i++) {
      const g = dispG(list[i]);
      if (g === 'u' && !skip) await ultra(ov);
      cards[i].classList.add('open');
      if (!skip) await sleep(g === 'l' || g === 'u' ? 750 : 240);
    }
    skipBtn.remove();
    const news = list.filter((r) => r.kind === 'cos' && !r.dupe && !r.pick).length, back = list.reduce((a, r) => a + (r.dupe || 0), 0);
    ov.append(h('p', { class: 'note hw-sum', text: '새 의상 ' + news + '개' + (back ? ' · 중복 페이백 사탕 ' + back + '개' : '') }));
    return finish(ov, list);
  }

  // ───────── 축제 화면 ─────────
  function rateTable() {
    const rows = [['초레어 의상', '0.05%'], ['전설 의상', '0.3%'], ['희귀 의상', '1.2%'], ['일반 의상', '3.5%'], ['경매 희귀품', '3%'], ['검은 칩', '0.1%'], ['이벤트 소모품', '19%'], ['상점 아이템', '28%'], ['칩 1~200', '44.85%']];
    return h('details', { class: 'panel rules-box hw-rates' }, h('summary', { text: '확률과 천장 보기' }),
      h('div', { class: 'statlist' }, ...rows.map(([a, b]) => h('div', null, h('span', { text: a }), h('b', { text: b })))),
      h('p', { class: 'note', text: '의상 없이 ' + PITY_COS + '번 뽑으면 다음은 의상 확정, 전설 없이 ' + PITY_LEG + '번 뽑으면 전설 의상 확정이에요. 초레어 없이 ' + PITY_ULT + '번 뽑으면 초레어 선택권이 나와서, 셋 중 원하는 걸 직접 골라요.' }),
      h('p', { class: 'note', text: '이미 가진 의상이 또 나오면 사탕으로 돌려받아요: 일반 30 · 희귀 80 · 전설 200 · 초레어 500. 10+1은 이벤트 소모품이나 의상이 하나 이상 꼭 들어 있어요.' }));
  }
  function bagPanel(after) {
    const x = H();
    const p = h('div', { class: 'panel' }, h('h3', { text: '이벤트 가방' }));
    const g = h('div', { class: 'hw-bag' });
    let any = false;
    for (const id of EV_IDS) {
      const n = x.items[id] || 0; if (!n) continue; any = true;
      const dead = after && (id === 'basket' || id === 'lantern');
      g.append(h('div', { class: 'hw-ev' }, h('span', { class: 'ico', svg: icon(id, 26) }),
        h('div', null, h('b', { text: EV[id].name + ' ×' + n }), h('small', { text: dead ? '축제가 끝나서 쓸 수 없어요.' : EV[id].desc })),
        h('button', { class: 'btn small gold', text: id === 'bomb' ? '터뜨리기' : '쓰기', disabled: dead || (id === 'cloak' && x.fx.cloak > 0), onclick: () => useEv(id) })));
    }
    p.append(any ? g : h('p', { class: 'note', text: '비어 있어요. 마녀의 솥에서 나와요.' }));
    const fx = [];
    if (x.fx.basket) fx.push('사탕 바구니 ' + x.fx.basket + '승');
    if (x.fx.lantern) fx.push('호박 랜턴 ' + x.fx.lantern + '패');
    if (x.fx.broom) fx.push('빗자루 ' + x.fx.broom + '판');
    if (x.fx.cloak) fx.push('유령 망토 대기 중');
    if (x.fx.wings) fx.push('박쥐 날개 ' + x.fx.wings + '판');
    if (fx.length) p.append(h('p', { class: 'note', text: '걸린 효과: ' + fx.join(' · ') }));
    return p;
  }
  function useEv(id) {
    const x = H(); if (!(x.items[id] > 0)) return;
    if (id === 'cloak' && x.fx.cloak > 0) return A.toast('이미 망토를 두르고 있어요.');
    x.items[id]--;
    if (id === 'bomb') { const k = 50 + Math.floor(Math.random() * 251); addCandy(k); A.toast('펑! 사탕 ' + k + '개가 쏟아졌어요.'); }
    else if (id === 'basket') { x.fx.basket += 5; A.toast('사탕 바구니: 이긴 판 5번 동안 사탕 +50%.'); }
    else if (id === 'lantern') { x.fx.lantern += 5; A.toast('호박 랜턴: 진 판 5번 동안 사탕을 받아요.'); }
    else if (id === 'broom') { x.fx.broom += 3; A.toast('마녀의 빗자루: 3판 동안 운 +20%.'); }
    else if (id === 'cloak') { x.fx.cloak = 1; A.toast('유령 망토를 둘렀어요. 다음 속임수 한 번은 들키지 않아요.'); }
    else if (id === 'wings') { x.fx.wings += 1; A.toast('박쥐 날개: 다음 룰렛·슬롯 한 판 +10%.'); }
    A.save(); A.renderTop(); P.check();
    if (P.isOn('hw')) render(); else if (P.isOn('room')) refreshCloset();
  }
  function msPanel() {
    const ms = missions();
    const p = h('div', { class: 'panel' }, h('h3', { text: '오늘의 과제' }), h('p', { class: 'note', text: '아침 6시마다 바뀌어요. 셋 다 끝내면 사탕 ' + MS_BONUS + '개를 더 드려요.' }));
    ms.list.forEach((q, i) => {
      const m = msOf(q.id); if (!m) return;
      const done = q.n >= m.need;
      p.append(h('div', { class: 'hw-ms' + (q.got ? ' got' : '') },
        h('div', null, h('b', { text: m.t }), h('span', { class: 'hw-prog' }, h('i', { style: 'width:' + Math.min(100, (q.n / m.need) * 100) + '%' })), h('small', { text: Math.min(q.n, m.need) + ' / ' + m.need + ' · 사탕 ' + m.r })),
        h('button', { class: 'btn small' + (done && !q.got ? ' gold' : ''), disabled: !done || q.got, text: q.got ? '받음' : '받기', onclick: () => claim(i) })));
    });
    if (ms.bonus) p.append(h('p', { class: 'note', text: '오늘 보너스까지 다 받았어요.' }));
    return p;
  }
  function open() { if (!isOn()) return A.toast('할로윈 축제는 끝났어요. 의상은 내 방 옷장에 있어요.'); render(); }
  function render() {
    const x = H();
    const el = P.screen('벨벳 할로윈 축제', '이긴 판에서 번 칩 30개마다 사탕 1개. 마녀의 솥을 저어 의상과 물건을 뽑으세요. ' + until(), 'hw-screen');
    const pityL = Math.max(1, PITY_LEG - x.pity.leg), pityC = Math.max(1, PITY_COS - x.pity.cos), pityU = Math.max(1, PITY_ULT - x.pity.ult);
    const pot = h('div', { class: 'hw-cauldron', 'aria-hidden': 'true' }, h('img', { src: IMG('cauldron'), alt: '' }),
      ...Array.from({ length: 7 }, (_, k) => h('i', { class: 'bub', style: `--x:${32 + k * 6}%;--d:${(k * 0.37) % 1.6}s` })));
    const box = h('div', { class: 'hw-gacha' }, pot,
      h('div', { class: 'hw-gside' },
        h('div', { class: 'hw-candybig' }, h('span', { svg: icon('candy', 30) }), h('b', { text: fmt(x.candy) }), h('small', { text: '사탕' })),
        h('div', { class: 'actions' },
          h('button', { class: 'btn gold', disabled: busy || x.candy < COST1, onclick: () => doPull(1) }, '한 번 젓기 · 사탕 ' + COST1),
          h('button', { class: 'btn gold', disabled: busy || x.candy < COST11, onclick: () => doPull(11) }, '10+1 · 사탕 ' + fmt(COST11))),
        x.ult > 0 && !busy ? h('button', { class: 'btn red hw-ultbtn', text: '초레어 선택권 ' + x.ult + '장 · 고르기', onclick: chooseUlt }) : null,
        h('p', { class: 'note', text: '의상 확정까지 ' + pityC + '번 · 전설 확정까지 ' + pityL + '번' }),
        h('p', { class: 'note hw-ultnote', text: '초레어 확정까지 ' + pityU + '번' }),
        h('p', { class: 'note', text: '모은 의상 ' + ownCount(W()) + ' / ' + COS.length + ' · 지금까지 받은 사탕 ' + fmt(x.total) }),
        h('div', { class: 'row' }, h('button', { class: 'btn small', text: '옷장 열기', onclick: openCloset }))));
    el.append(box, h('div', { class: 'hw-cols' }, msPanel(), bagPanel(false)), rateTable());
  }

  // ───────── 옷장 (내 방) ─────────
  function closet(body) {
    const x = H(), after = !isOn();
    const prev = h('div', { class: 'panel hw-closet-top' }, portrait(88, { force: true }),
      h('div', null, h('h3', { text: '옷장' }), h('p', { class: 'note', text: '할로윈 의상은 축제가 끝나도 여기 남아요. 누르면 입고, 다시 누르면 벗어요. 모은 의상 ' + ownCount(W()) + ' / ' + COS.length }),
        isOn() ? h('button', { class: 'btn small gold', text: '마녀의 솥으로', onclick: open }) : null,
        x.ult > 0 ? h('button', { class: 'btn small red', text: '초레어 선택권 ' + x.ult + '장 · 고르기', onclick: chooseUlt }) : null));
    body.append(prev);
    if (after && x.candy > 0) {
      const k = Math.floor(x.candy / 2);
      body.append(h('div', { class: 'panel' }, h('h3', { text: '남은 사탕 ' + fmt(x.candy) + '개' }),
        h('p', { class: 'note', text: '축제가 끝나서 사탕은 칩으로 바꿀 수 있어요. 사탕 2개 = 1칩. 그냥 두면 다음 축제까지 보관돼요.' }),
        h('button', { class: 'btn small gold', disabled: !k, text: fmt(k) + '칩으로 바꾸기', onclick: () => { exchange(); refreshCloset(); } })));
    }
    if (EV_IDS.some((id) => x.items[id] > 0)) body.append(bagPanel(after));
    for (const slot of Object.keys(SLOT)) {
      const list = COS.filter((c) => c.slot === slot);
      const grid = h('div', { class: 'hw-wardrobe' });
      for (const c of list) {
        const own = x.own[c.id], on = x.eq[slot] === c.id;
        grid.append(own
          ? h('button', { class: 'hw-cos g-' + c.g + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: () => { equip(c.id); refreshCloset(); } }, cosThumb(c.id), h('b', { text: c.name }), h('small', { text: GR[c.g].name + (on ? ' · 입는 중' : '') }))
          : h('div', { class: 'hw-cos lock g-' + c.g }, h('span', { class: 'hw-thumb lockq', text: '?' }), h('b', { text: '???' }), h('small', { text: GR[c.g].name })));
      }
      body.append(h('div', { class: 'panel' }, h('h3', { text: SLOT[slot] }), h('p', { class: 'note', text: SLOT_NOTE[slot] }), grid,
        slot === 'fx' && x.eq.fx ? h('button', { class: 'btn small', text: '효과 미리 보기', onclick: () => playFx(x.eq.fx) }) : null));
    }
  }
  function exchange() {
    const x = H(), k = Math.floor(x.candy / 2); if (!k) return;
    x.candy -= k * 2; W().chips += k;
    A.save(); A.renderTop(); A.toast('사탕을 ' + fmt(k) + '칩으로 바꿨어요.');
  }
  // 축제가 끝난 뒤 첫 로비: 남은 사탕 안내 (한 번만)
  function endCheck() {
    if (!W() || !isOver()) return;
    const x = H();
    if (x.endDone || !(x.candy > 0)) return;
    x.endDone = true; A.save();
    const k = Math.floor(x.candy / 2);
    A.dialog('할로윈 축제가 끝났어요', [
      h('p', { class: 'sub', text: '마녀의 솥은 식었고, 루나도 다음 축제를 기약하며 떠났어요. 모은 의상과 칭호는 그대로 남아요.' }),
      h('p', { class: 'sub', text: '남은 사탕 ' + fmt(x.candy) + '개는 칩으로 바꿀 수 있어요(사탕 2개 = 1칩). 보관해 두면 내 방 옷장에서 언제든 바꿀 수 있어요.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn gold', disabled: !k, text: fmt(k) + '칩으로 바꾸기', onclick: () => { exchange(); A.closeDialog(); } }),
        h('button', { class: 'btn', text: '보관하기', onclick: A.closeDialog }))
    ], false);
  }

  // ───────── 입구 ─────────
  function door() {
    const d = $('#door'); if (!d) return;
    const on = isOn();
    d.classList.toggle('halloween', on);
    const note = $('#doorNote');
    if (note) {
      if (note.dataset.orig == null) note.dataset.orig = note.textContent;
      note.textContent = on ? '할로윈 축제 중이에요. 11월 8일 아침 6시까지, 이긴 판마다 사탕이 떨어져요.' : note.dataset.orig;
    }
  }
  const BAT_PATH = 'M50 20 L46.5 11 L44.5 21 Q37 19 31 7 Q24 20 9 15 Q14 26 3 34 Q18 33 24 44 Q31 36 40 42 Q45 46 50 57 Q55 46 60 42 Q69 36 76 44 Q82 33 97 34 Q86 26 91 15 Q76 20 69 7 Q63 19 55.5 21 L53.5 11 Z';
  // 박쥐 떼가 날아들고, 박쥐 모양 구멍으로 문이 열린다. done 은 로비를 그리는 함수.
  function openDoor(done) {
    const d = $('#door');
    if (reduce()) { d.classList.add('open'); done(); setTimeout(() => { d.hidden = true; }, 400); return; }
    d.classList.add('hw-opening');
    const flock = h('div', { class: 'hw-flock', 'aria-hidden': 'true' });
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 30;
      flock.append(h('img', { src: IMG('bat'), alt: '', style: `--fx:${(Math.cos(a) * r).toFixed(1)}vw;--fy:${(Math.sin(a) * r).toFixed(1)}vh;--dl:${(Math.random() * 0.5).toFixed(2)}s;--sc:${(0.7 + Math.random() * 1.3).toFixed(2)}` }));
    }
    d.append(flock);
    setTimeout(() => {
      done();
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="' + BAT_PATH + '"/></svg>';
      const url = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
      const st = d.style;
      st.webkitMaskImage = st.maskImage = url + ', linear-gradient(#000 0 0)';
      st.webkitMaskComposite = 'xor'; st.maskComposite = 'exclude';
      st.webkitMaskRepeat = st.maskRepeat = 'no-repeat';
      st.webkitMaskPosition = st.maskPosition = 'center';
      const max = Math.max(innerWidth, innerHeight) * 9, t0 = performance.now(), dur = 1150;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = k * k * k, w_ = Math.max(2, e * max);
        st.webkitMaskSize = st.maskSize = w_ + 'px ' + (w_ * 0.6) + 'px, 100% 100%';
        if (k < 1) return requestAnimationFrame(step);
        d.hidden = true; flock.remove(); d.removeAttribute('style'); d.classList.remove('hw-opening');
      };
      requestAnimationFrame(step);
    }, 950);
  }

  // ───────── 로비 ─────────
  const OUIJA = '<svg viewBox="0 0 1000 230" preserveAspectRatio="xMidYMin meet" aria-hidden="true"><defs>' +
    '<path id="hwA1" d="M70 128 Q500 -38 930 128"/><path id="hwA2" d="M150 186 Q500 52 850 186"/></defs>' +
    '<text class="oj"><textPath href="#hwA1" startOffset="50%" text-anchor="middle">A B C D E F G H I J K L M</textPath></text>' +
    '<text class="oj"><textPath href="#hwA2" startOffset="50%" text-anchor="middle">N O P Q R S T U V W X Y Z</textPath></text>' +
    '<text class="oj s" x="34" y="52">YES</text><text class="oj s" x="966" y="52" text-anchor="end">NO</text></svg>';
  function banner() {
    const x = H();
    return h('button', { class: 'hw-banner', onclick: open, 'aria-label': '벨벳 할로윈 축제 열기' },
      h('span', { class: 'hw-oj', svg: OUIJA }), h('span', { class: 'hw-planchette', 'aria-hidden': 'true' }),
      h('span', { class: 'hw-plaque' }, h('small', { text: 'HALLOWEEN NIGHT' }), h('b', { text: '벨벳 할로윈 축제' }),
        h('span', { text: '사탕 ' + fmt(x.candy) + '개 · ' + (until() || '오늘 밤만') })));
  }
  const baseLobby = P.lobby;
  P.lobby = (el) => {
    baseLobby(el);
    if (!isOn()) { endCheck(); return; }
    const head = el.querySelector('.lobby-head');
    const b = banner();
    if (head) head.after(b); else el.prepend(b);
    const grid = el.querySelector('.doors');
    if (grid) grid.prepend(h('button', { class: 'door-card d-hw', onclick: open }, h('b', { text: '할로윈 축제' }), h('span', { text: '마녀의 솥, 오늘의 과제, 이벤트 가방.' })));
    popup();
  };
  let popShown = false;
  function popup() {
    const x = H(), today = A.dayKey();
    if (popShown || x.popDay === today || !$('#ov').hidden) return;
    popShown = true;
    A.dialog('벨벳 할로윈 축제', [
      h('img', { class: 'hw-popimg', src: IMG('popup'), alt: '' }),
      h('p', { class: 'sub', text: '10월 25일부터 11월 8일 아침 6시까지. 이긴 판에서 번 칩 30개마다 사탕이 떨어져요.' }),
      h('ul', { class: 'hw-poplist' }, h('li', { text: '사탕으로 마녀의 솥을 저어 카드 테마·초상화·루나 분장 같은 의상을 뽑아요.' }),
        h('li', { text: '오늘의 과제를 끝내면 사탕을 더 받아요.' }), h('li', { text: '바에 새 알바 루나가 왔어요. 축제 동안만 있어요.' })),
      h('div', { class: 'row' }, h('button', { class: 'btn gold', text: '축제 보러 가기', onclick: () => { A.closeDialog(); open(); } }),
        h('button', { class: 'btn', text: '오늘 하루 보지 않기', onclick: () => { H().popDay = today; A.save(); A.closeDialog(); } }))
    ]);
  }

  // ───────── 바: 노엘과 루나 ─────────
  function barScene(compact) {
    const x = H();
    const s = h('div', { class: 'hw-bar' + (compact ? ' compact' : ''), 'aria-hidden': 'true' }, h('img', { class: 'noel', src: IMG(x.eq.noel || 'noel_base'), alt: '' }));
    if (isOn()) s.append(h('img', { class: 'luna', src: IMG(x.eq.luna || 'luna_base'), alt: '' }));
    return s;
  }
  const INTRO = [
    ['noel', '아, 마침 잘 오셨습니다. 소개해 드릴 사람이 있어요.'],
    ['luna', '안녕하세요! 오늘부터 할로윈 축제 동안 여기서 일하게 된 루나예요!'],
    ['noel', '축제 기간에만 손을 빌리기로 했습니다. 말이 좀… 많습니다.'],
    ['luna', '에이, 마스터! 손님 앞에서 그런 말 하기예요? 저 칵테일도 잘 만들어요. …아마도요.'],
    ['noel', '(잔을 닦으며 작게 웃는다)'],
    ['luna', '손님, 사탕 모으고 계세요? 사탕을 많이 모으면 제 옷도 바꿔 입을 수 있대요! 잘 부탁드려요~']
  ];
  const needIntro = () => isOn() && !H().met;
  function intro(el, done) {
    let i = 0, typing = 0;
    const scene = barScene(false);
    const name = h('b'), line = h('p');
    const next = h('button', { class: 'btn gold', text: '다음' });
    const finishIntro = () => { clearInterval(typing); H().met = true; P.inc('hwLuna'); A.save(); P.check(); done(); };
    const box = h('div', { class: 'hw-intro' }, scene, h('div', { class: 'hw-talk' }, name, line, h('div', { class: 'row' }, next, h('button', { class: 'btn small', text: '건너뛰기', onclick: finishIntro }))));
    el.append(box);
    const show = () => {
      const [who, text] = INTRO[i];
      name.textContent = who === 'luna' ? '루나' : '노엘';
      box.dataset.who = who;
      clearInterval(typing); line.textContent = '';
      if (reduce()) { line.textContent = text; return; }
      let k = 0; typing = setInterval(() => { line.textContent = text.slice(0, ++k); if (k >= text.length) clearInterval(typing); }, 28);
    };
    next.onclick = () => {
      if (line.textContent.length < INTRO[i][1].length) { clearInterval(typing); line.textContent = INTRO[i][1]; return; }
      i++;
      if (i >= INTRO.length) return finishIntro();
      if (i === INTRO.length - 1) next.textContent = '바에 앉기';
      show();
    };
    show(); next.focus();
  }
  const LUNA = {
    greet: ['어서 오세요! 오늘은 뭐 드실래요? 마스터 칵테일 진짜 맛있어요.', '오셨어요? 테이블 분위기 어땠어요? 다 얘기해 주세요!', '헤헤, 또 오셨네요. 사탕은 많이 모으셨어요?'],
    gossip: [
      '마담 로즈 있잖아요, 어제 팁을 엄청 주고 갔어요. 근데 그날 엄청 잃었대요.',
      '지하 계단이요? 저는 무서워서 한 번도 안 내려가 봤어요.',
      '슬롯머신에서 777 나오는 거 보신 적 있어요? 저는 아직 한 번도 못 봤어요!',
      '블랙타이 정 손님은 맨날 같은 술만 시켜요. 이름이 뭐였더라…',
      '경매장 상자 사 보셨어요? 아는 손님이 빈 상자 받고 울었대요.',
      '체스룸 손님들은 술을 안 마셔서 저는 좀 심심해요.',
      '쌍둥이 류 손님들, 저는 아직도 누가 누군지 몰라요. 비밀이에요!',
      '마스터는 웃을 때 눈가에 주름이 생겨요. 귀엽죠? …방금 한 말은 비밀이에요.',
      '룰렛 0번이요? 오늘만 세 번 나왔대요. 진짜인지는 몰라요!',
      '사탕 바구니 써 보셨어요? 이길 때 사탕이 막 쏟아진대요.'
    ],
    defer: ['어, 그건… 마스터한테 물어보세요! 저는 아직 새내기라서요.', '그런 얘기는 마스터 담당이에요. 마스터~!', '쉿, 그건 제가 말하면 혼나요. 마스터가 알려 줄 거예요.'],
    name: ['저 부르셨어요? 헤헤.', '루나예요! 할로윈 동안만 있어요. 아쉽죠?', '사탕 많이 모으면 제 옷도 바꿔 입힐 수 있대요. 골라 주실 거죠?'],
    costume: {
      base: '바텐더 복장 어때요? 마스터가 골라 줬어요. 단추는… 제가 좀 풀었어요.',
      luna_witch: '오늘은 마녀예요! 주문 걸어 드릴까요? 수리수리… 잭팟!', luna_mummy: '붕대가 자꾸 풀려요… 마스터, 테이프 있어요?',
      luna_vampire: '피 대신 토마토 주스로 주세요~ 헤헤.', luna_succubus: '이, 이 옷은… 손님이 골라 주신 거죠? 마스터가 한숨 쉬었어요.',
      luna_cat: '냥! …아, 이거 진짜 계속해야 돼요?'
    },
    noel: ['(노엘이 루나 쪽을 보며 작게 웃는다)', '…일하는 동안엔 사탕 먹지 마라.', '루나, 저쪽 손님 잔이 비었다.'],
    noelAbout: ['축제 동안만 일하는 아이입니다. 말은 많지만 손은 빠르죠.', '루나 말입니까? (잔을 내려놓고 작게 웃는다) 사고만 안 치면 됩니다.']
  };
  const costumeLine = () => LUNA.costume[H().eq.luna || 'base'] || LUNA.costume.base;
  function lunaGreet() { return isOn() ? { who: 'luna', text: rand(LUNA.greet) } : null; }
  // 바텐더 대답(r)을 보고 루나가 끼어들 말을 정한다. replace 는 노엘 대답을 바꿀 때.
  function lunaTalk(text, r) {
    const out = { before: [], after: [], replace: null };
    if (!isOn()) return out;
    const t = String(text).replace(/\s+/g, ' ');
    if (/루나|알바|새로 온|새 직원/.test(t)) {
      if (!r.clue) out.replace = { reply: rand(LUNA.noelAbout) };
      out.after.push({ who: 'luna', text: Math.random() < 0.5 ? rand(LUNA.name) : costumeLine() });
      return out;
    }
    if (/옷|의상|복장|분장|코스튬/.test(t)) { out.after.push({ who: 'luna', text: costumeLine() }); return out; }
    if (r.clue) { if (Math.random() < 0.6) out.before.push({ who: 'luna', text: rand(LUNA.defer) }); return out; }
    if (Math.random() < 0.3) out.after.push({ who: 'luna', text: rand(LUNA.gossip) });
    else if (Math.random() < 0.08) out.after.push({ who: 'bar', text: rand(LUNA.noel) });
    return out;
  }

  // ───────── 관리자 ─────────
  function adminRows() {
    const x = H();
    const lab = (t, el) => h('label', { class: 'adm-row' }, h('span', { text: t }), el);
    const chk = (id, t) => h('label', { class: 'adm-row adm-check' }, h('input', { type: 'checkbox', id }), h('span', { text: t }));
    const sel = h('select', { id: 'hwForce', class: 'hw-select' }, ...[['', '자동 (날짜대로)'], ['on', '이벤트 미리 열기'], ['off', '끝난 상태 보기']].map(([v, t]) => h('option', { value: v, selected: x.force === v, text: t })));
    return [h('h3', { text: '할로윈 이벤트' }), h('div', { class: 'adm-grid' },
      lab('이벤트 상태', sel), lab('사탕', h('input', { type: 'number', id: 'hwCandyIn', min: '0', step: '1', value: String(x.candy) })),
      chk('hwAll', '의상 전부 받기'), chk('hwMet', '루나 첫 만남 다시 보기'), chk('hwPity', '천장 초기화'), chk('hwEnd', '끝난 뒤 안내 다시 보기'))];
  }
  function adminApply() {
    const x = H(), v = (id) => document.getElementById(id);
    if (!v('hwForce')) return;
    x.force = v('hwForce').value;
    x.candy = Math.max(0, Math.floor(Number(v('hwCandyIn').value) || 0));
    if (v('hwAll').checked) for (const c of COS) x.own[c.id] = x.own[c.id] || 1;
    if (v('hwMet').checked) x.met = false;
    if (v('hwPity').checked) x.pity = { cos: 0, leg: 0, ult: 0 };
    if (v('hwEnd').checked) x.endDone = false;
    popShown = false;
    apply(); A.renderTop();
  }

  // ───────── 시작 ─────────
  const baseBoot = P.boot;
  P.boot = () => { baseBoot(); if (W()) { H(); missions(); } apply(); A.renderTop(); };
  door();

  return {
    isOn, isOver, START, END, COS, COS_BY, EV, GR, RATE, PITY_COS, PITY_LEG, PITY_ULT, chooseUlt, roll, pull, grant, addCandy, missions, claim, MS,
    open, render, closet, equip, apply, top, portrait, playFx, openDoor, barScene, needIntro, intro, lunaGreet, lunaTalk,
    adminRows, adminApply, exchange, endCheck, useEv, H, norm
  };
})();
window.HW = HW;
