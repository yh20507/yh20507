/* ===== 벨벳 카지노 · 화면과 진행 ===== */
const App = (() => {
  const C = Cas;
  const $ = (s, el = document) => el.querySelector(s);
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'svg') e.innerHTML = v;            // 코드 안의 고정 아이콘만
      else if (k.startsWith('on')) e[k] = v;
      else if (k === 'style') e.style.cssText = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(3)) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
    return e;
  }
  const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
  const rand = (a) => a[Math.floor(Math.random() * a.length)];

  // ── 아이콘 (고정 SVG) ──
  const IP = {
    pistol: '<path d="M3 9h13l2-2h3v4h-6l-1 2h-3l-1 4H6l1-4H3z"/>',
    lens: '<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 21 21"/>',
    cigarette: '<rect x="2" y="13" width="17" height="4" rx="1"/><path d="M15 13v4M21 13v4M18 10c0-2 2-2 2-4M21 10c0-2 1-2 1-4"/>',
    sleeve: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9.5 15 12 8l2.5 7M10.4 12.6h3.2"/>',
    mirror: '<ellipse cx="12" cy="10" rx="6" ry="7"/><path d="M12 17v4M9 21h6M9.5 7.5l2.5-2"/>',
    notebook: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12 8h4M12 12h4"/>',
    clover: '<circle cx="9" cy="9" r="3"/><circle cx="15" cy="9" r="3"/><circle cx="9" cy="15" r="3"/><circle cx="15" cy="15" r="3"/><path d="M13 13l4 8"/>',
    slot: '<rect x="3" y="5" width="16" height="14" rx="2"/><path d="M8 5v14M14 5v14M19 9h2v6"/><circle cx="21" cy="7.5" r="1"/>',
    insurance: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
    whiskey: '<path d="M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 13h8"/>',
    vip: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M6 10l2 5 2-5M12 10v5M15.5 15v-5h2a1.5 1.5 0 0 1 0 3h-2"/>',
    vault: '<rect x="3" y="4" width="18" height="15" rx="2"/><circle cx="12" cy="11.5" r="3.5"/><path d="M12 8v1M6 19v2M18 19v2"/>',
    regular: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
    magnet: '<path d="M6 3v9a6 6 0 0 0 12 0V3h-4v9a2 2 0 0 1-4 0V3z"/><path d="M6 7h4M14 7h4"/>',
    monkey: '<path d="M7 21v-7l-2-3V6a1.5 1.5 0 0 1 3 0v4M8 9V4a1.5 1.5 0 0 1 3 0v5M11 8V3.5a1.5 1.5 0 0 1 3 0V9M14 9V5a1.5 1.5 0 0 1 3 0v8l-2 3v5"/>',
    bottom: '<rect x="4" y="3" width="12" height="16" rx="2"/><path d="M8 21h11a1 1 0 0 0 1-1V8"/><path d="M10 13l3 3 3-3"/>',
    revolver: '<path d="M2 8h12l1-2h6v4h-5l-1 2H11l-1 6H5l1-6H2z"/><circle cx="12" cy="10" r="1.2"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/><path d="M12 20v2"/>',
    watch: '<circle cx="12" cy="13" r="7"/><path d="M12 9v4l3 2M10 3h4M12 3v3"/>',
    glasses: '<circle cx="7" cy="14" r="3.5"/><circle cx="17" cy="14" r="3.5"/><path d="M10.5 14h3M3.5 13 5 8M20.5 13 19 8"/>',
    fan: '<path d="M12 20 4 9a10 10 0 0 1 16 0z"/><path d="M12 20 9 8M12 20l3-12M12 20V7"/>',
    coin: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5"/><path d="M12 9v6"/>',
    shadow: '<rect x="6" y="4" width="12" height="16" rx="2" stroke-dasharray="2 2"/><path d="M9 9h6M9 13h4"/>',
    box: '<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/>',
    bribe: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 6l9 7 9-7"/>',
    contract: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h5M9 19c2-2 3 0 5-2"/>',
    banker: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
    blackchip: '<circle cx="12" cy="12" r="8" fill="currentColor" fill-opacity=".35"/><circle cx="12" cy="12" r="4.5"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/>',
    marked: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7l2 2M16 17l-2-2M15 7h1M8 16h1"/>',
    ring: '<circle cx="12" cy="14" r="6"/><path d="M9 6l3-3 3 3-3 2z"/>',
    fake: '<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6" stroke-dasharray="2 2"/>'
  };
  const icon = (k, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IP[k] || ''}</svg>`;

  // ── 게임 · 테이블 등급 ──
  const GAMES = {
    holdem: { name: '텍사스 홀덤', seats: 6, rules: '비공개 2장과 공용 5장으로 가장 좋은 다섯 장을 만든다. 블라인드가 돌고 베팅은 네 번.' },
    seven: { name: '세븐 포커', seats: 5, rules: '4장 받아 1장 버리고 1장 공개. 4구부터 히든까지 베팅 네 번. 상대의 보이는 패를 읽는 게임.' },
    blackjack: { name: '블랙잭', seats: 1, rules: '21을 넘지 않고 딜러보다 높게. 블랙잭은 1.5배, 딜러는 17에서 멈춘다.' },
    roulette: { name: '룰렛', seats: 1, rules: '' }, seotda: { name: '섯다', seats: 4, rules: '' }, indian: { name: '인디언 포커', seats: 4, rules: '' }
  };
  const TIERS = {
    holdem: [
      { id: 'low', name: '초보', sb: 1, bb: 2, min: 40, max: 400, info: '블라인드 1/2 · 바이인 40~400' },
      { id: 'mid', name: '일반', sb: 5, bb: 10, min: 200, max: 2000, info: '블라인드 5/10 · 바이인 200~2,000' },
      { id: 'high', name: '하이롤러', sb: 25, bb: 50, min: 1000, max: 10000, vip: true, info: '블라인드 25/50 · 바이인 1,000~ · VIP 전용' }
    ],
    seven: [
      { id: 'low', name: '초보', ante: 1, unit: 2, min: 40, max: 400, info: '앤티 1 · 최소 베팅 2 · 바이인 40~400' },
      { id: 'mid', name: '일반', ante: 5, unit: 10, min: 200, max: 2000, info: '앤티 5 · 최소 베팅 10 · 바이인 200~2,000' },
      { id: 'high', name: '하이롤러', ante: 25, unit: 50, min: 1000, max: 10000, vip: true, info: '앤티 25 · 최소 베팅 50 · VIP 전용' }
    ],
    blackjack: [
      { id: 'low', name: '초보', minBet: 1, maxBet: 20, chips: [1, 5, 10], info: '베팅 1~20' },
      { id: 'mid', name: '일반', minBet: 10, maxBet: 200, chips: [10, 25, 50, 100], info: '베팅 10~200' },
      { id: 'high', name: '하이롤러', minBet: 50, maxBet: 1000, chips: [50, 100, 250, 500], vip: true, info: '베팅 50~1,000 · VIP 전용' }
    ]
  };
  const tierOf = (g, id) => TIERS[g].find((t) => t.id === id) || TIERS[g][0];

  // ── 아이템 ──
  const ITEMS = {
    pistol: { name: '권총', kind: 'cheat', price: 150, sus: 35, when: 'hand', games: ['holdem', 'seven', 'blackjack'],
      desc: { holdem: '딜러를 협박해 다음 공용 카드 두 장을 고른 무늬로 깔게 한다.', seven: '내가 받을 다음 카드 두 장을 고른 무늬로 받는다.', blackjack: '딜러가 멈출 때 한 장을 더 뽑게 만든다.' } },
    cigarette: { name: '담배', kind: 'cheat', price: 70, sus: 20, when: 'hand', games: ['holdem', 'seven', 'blackjack'], desc: '연기로 시선을 가리고 내 카드 한 장을 바꿔치기한다.' },
    sleeve: { name: '소매 속 에이스', kind: 'cheat', price: 110, sus: 30, when: 'hand', games: ['holdem', 'seven', 'blackjack'], desc: '내 카드 한 장을 에이스로 바꾼다. 30% 확률로 그 자리에서 들킨다.' },
    lens: { name: '돋보기', kind: 'info', price: 40, when: 'hand', games: ['holdem', 'seven', 'blackjack', 'seotda'],
      desc: { holdem: '상대 한 명의 숨은 카드 한 장을 엿본다.', seven: '상대 한 명의 숨은 카드 한 장을 엿본다.', blackjack: '딜러가 엎어 둔 카드를 본다.', seotda: '손님 한 명의 첫 장을 엿본다.' } },
    mirror: { name: '거울 조각', kind: 'info', price: 30, when: 'hand', games: ['holdem', 'seven', 'blackjack', 'indian'], desc: { holdem: '다음에 나올 카드 한 장을 미리 본다.', seven: '다음에 나올 카드 한 장을 미리 본다.', blackjack: '다음에 나올 카드 한 장을 미리 본다.', indian: '벽 거울로 내 이마의 카드를 본다. 의심 +20.' } },
    notebook: { name: '카운팅 수첩', kind: 'info', price: 60, when: 'prep', games: ['blackjack'], desc: '5판 동안 남은 슈에 큰 카드가 얼마나 남았는지 알려 준다.' },
    clover: { name: '네잎클로버', kind: 'luck', price: 90, when: 'prep', games: ['holdem', 'seven', 'blackjack'], desc: '4판 동안 카드를 받을 때 35% 확률로 두 장 중 나은 쪽을 받는다.' },
    slot: { name: '슬롯 코인', kind: 'luck', price: 40, when: 'prep', games: ['holdem', 'seven', 'blackjack'], desc: '다음 판 득실이 두 배. 이기면 두 배로 벌고, 지면 두 배로 잃는다.' },
    insurance: { name: '보험 증서', kind: 'luck', price: 50, when: 'prep', games: ['holdem', 'seven', 'blackjack'], desc: '다음 판에 지면 잃은 칩의 절반을 돌려받는다.' },
    whiskey: { name: '위스키 한 병', kind: 'luck', price: 60, when: 'any', games: ['holdem', 'seven'], desc: '상대 한 명에게 술을 보내 3판 동안 엉뚱하게 베팅하게 만든다.' },
    magnet: { name: '자석', kind: 'cheat', price: 80, sus: 35, when: 'hand', games: ['roulette'], desc: '룰렛 공을 한 칸 옆으로 당긴다. 걸린 칩에 더 유리한 쪽으로.' },
    // 경매장 전용 (상점에는 안 나옴)
    monkey: { name: '원숭이 손', kind: 'curse', legend: true, auction: true, price: 1200, when: 'prep', games: ['holdem', 'seven', 'blackjack', 'seotda', 'indian'], desc: '다음 판 좋은 패 보장(포커 스트레이트 이상, 블랙잭 20 이상, 섯다 알리 이상, 인디언 K 이상). 지면 5배로 잃는다. 마지막 손가락은 무조건 대가.' },
    bottom: { name: '밑장 빼기', kind: 'legend', legend: true, auction: true, price: 3000, sus: 99, when: 'prep', games: ['holdem', 'seven', 'blackjack', 'seotda', 'indian'], desc: '다음 판 포카드 이상 보장(블랙잭은 블랙잭, 섯다는 장땡 이상, 인디언은 A). 의심 +99.' },
    revolver: { name: '리볼버 한 발', kind: 'curse', legend: true, auction: true, price: 600, when: 'prep', games: ['holdem', 'seven', 'blackjack', 'seotda', 'indian'], desc: '다음 판에 이기면 6배. 6분의 1 확률로 들고 있는 칩 절반이 날아간다.' },
    dice: { name: '피 묻은 주사위', kind: 'curse', legend: true, auction: true, price: 400, when: 'prep', games: ['holdem', 'seven', 'blackjack', 'seotda', 'indian'], desc: '다음 판 득실 3배. 이기든 지든.' },
    marked: { name: '표시된 카드', kind: 'cheat', under: true, price: 180, when: 'hand', games: ['holdem'], desc: '손님들 카드 뒷면의 작은 표시로 모두의 첫 장을 읽는다. 지하 전용.' },
    ring: { name: '거울 반지', kind: 'cheat', under: true, price: 150, when: 'hand', games: ['holdem'], desc: '반지에 비친 딜러 손으로 다음 공용 카드 두 장을 본다. 지하 전용.' },
    fake: { name: '가짜 칩', kind: 'cheat', under: true, price: 200, when: 'hand', games: ['holdem'], desc: '가짜 칩 500개를 슬쩍 섞어 테이블 칩을 불린다. 지하 전용.' },
    watch: { name: '도박사의 회중시계', kind: 'legend', auction: true, price: 2000, sus: 30, when: 'after', games: ['holdem', 'seven', 'blackjack'], desc: '방금 진 판을 없던 일로 돌린다. 의심 +30.' }
  };
  const KIND = { cheat: '속임수 · 의심 상승', info: '정보', luck: '운', legend: '전설', curse: '저주' };
  const PERMS = {
    vip: { name: 'VIP 카드', price: 2000, desc: '하이롤러 테이블 입장. 상점 10% 할인.' },
    vault: { name: '금고', price: 800, desc: '칩을 맡겨 두면 테이블에서 잃지 않는다. 로비에서 언제든 꺼낼 수 있다.' },
    regular: { name: '단골 배지', price: 1200, desc: '의심이 매일 두 배로 빨리 식고, 소매 속 에이스가 들킬 확률이 절반이 된다.' }
  };
  const descOf = (id, g) => { const d = ITEMS[id].desc; return typeof d === 'string' ? d : (d[g] || d.holdem); };

  // ── AI 손님 ──
  const ROSTER = [
    ['마담 로즈', 'bluffer'], ['닥터 한', 'calc'], ['실버 김', 'rock'], ['블랙타이 정', 'station'], ['베로니카', 'bluffer'],
    ['선장 오', 'station'], ['미스터 J', 'calc'], ['백작 부인', 'rock'], ['레드', 'bluffer'], ['교수 박', 'calc'], ['노신사 윤', 'rock'], ['쌍둥이 류', 'station']
  ];
  const LINES = {
    rock: { raise: ['좋은 패가 왔군요.', '이번엔 갑니다.'], call: ['보죠.', '따라가겠습니다.'], check: ['…'], fold: ['이번엔 쉬죠.', '지켜보겠습니다.'] },
    bluffer: { raise: ['인생은 한 방이죠.', '겁나면 접으시든가.', '올려 볼까요?'], call: ['재밌네요.'], check: ['흐음.'], fold: ['오늘은 봐드리죠.'] },
    station: { raise: ['어쩌다 보니.'], call: ['궁금하니까 볼게요.', '끝까지 가 봐야죠.'], check: ['네.'], fold: ['아, 이건 진짜 아니다.'] },
    calc: { raise: ['기대값이 플러스입니다.'], call: ['확률상 콜입니다.'], check: ['체크.'], fold: ['수학적으로 다이.'] }
  };

  // ── 지갑 저장 ──
  const SID = Math.random().toString(36).slice(2, 10);
  const W = { data: null, mode: 'local', ref: null, writing: false, dirty: false, db: null, user: null, uid: null, unsub: null, frozen: false };
  const LS = 'velvet-wallet-v1';
  function dayKey(t = Date.now()) {
    const d = new Date(t - 6 * 3600e3);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function newWallet() {
    return { v: 1, chips: 100, vault: 0, items: {}, perm: {}, sus: 0, banDay: null, day: dayKey(), table: null, fx: { clover: 0, notebook: 0 }, stats: { hands: 0, best: 100 } };
  }
  function normalize(w) {
    const n = newWallet();
    w = Object.assign(n, w || {});
    w.items = Object.assign({}, w.items); w.perm = Object.assign({}, w.perm); w.fx = Object.assign({ clover: 0, notebook: 0 }, w.fx); w.stats = Object.assign({ hands: 0, best: 100 }, w.stats);
    for (const k of ['chips', 'vault', 'sus']) w[k] = Math.max(0, Math.floor(Number(w[k]) || 0));
    if (window.Plus) Plus.norm(w);
    return w;
  }
  async function loadWallet() {
    if (window.VelvetOnline) {
      const raw = await VelvetOnline.loadWallet(SID);
      W.data = normalize(raw);
      W.mode = 'online';
      if (!raw) await VelvetOnline.createWallet(JSON.parse(JSON.stringify(W.data)), SID);
      return;
    }
    try {
      const use = window.claude && window.claude.use ? window.claude.use.bind(window.claude) : null;
      if (use) {
        [W.db, W.user] = await Promise.all([use('db'), use('user')]);
        W.uid = W.user ? await W.user.id() : null;
      }
    } catch (e) { W.db = null; }
    if (W.db && W.uid) {
      try {
        W.ref = W.db.doc('data/users/' + W.uid + '/wallet');
        const snap = await W.ref.get();
        W.data = normalize(snap.exists ? JSON.parse(JSON.stringify(snap.data())) : null);
        W.mode = 'account';
        W.unsub = W.ref.onSnapshot((s) => {
          if (!s.exists || s.metadata.hasPendingWrites) return;
          const d = s.data();
          if (d.sid && d.sid !== SID && !W.frozen) otherDevice();
        }, () => {});
        return;
      } catch (e) { W.mode = 'local'; }
    }
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { raw = null; }
    W.data = normalize(raw); W.mode = 'local';
  }
  function save() { if (W.frozen) return; if (window.Plus && W.data && W.data.ug) Plus.clampSus(); W.dirty = true; flush(); renderTop(); }
  async function flush() {
    if (W.writing) return;
    W.writing = true;
    while (W.dirty) {
      W.dirty = false;
      const body = JSON.parse(JSON.stringify(Object.assign({}, W.data, { sid: SID, at: Date.now() })));
      try {
        if (W.mode === 'online') {
          const ok = await VelvetOnline.saveWallet(body, SID);
          if (!ok) { W.writing = false; otherDevice(); return; }
        } else if (W.mode === 'account') await W.ref.set(body);
        else localStorage.setItem(LS, JSON.stringify(body));
      } catch (e) {
        if (W.mode === 'online') { toast('서버에 저장하지 못했어요. 잠시 뒤 다시 저장할게요.'); W.dirty = true; await new Promise((r) => setTimeout(r, 5000)); continue; }
        try { localStorage.setItem(LS, JSON.stringify(body)); } catch (e2) { /* 저장 불가 */ }
        if (W.mode === 'account') { toast('계정에 저장하지 못했어요. 잠시 뒤 다시 저장할게요.'); W.dirty = true; await new Promise((r) => setTimeout(r, 4000)); }
      }
    }
    W.writing = false;
  }
  function otherDevice() {
    W.frozen = true;
    stopTimers();
    dialog('다른 곳에서 입장했어요', [
      h('p', { class: 'sub', text: '같은 계정으로 다른 기기나 창에서 카지노에 들어왔어요. 칩이 엇갈리지 않도록 이 화면은 멈췄어요.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn gold', text: '여기서 계속하기', onclick: () => location.reload() }))
    ], false);
  }

  // 하루가 바뀌면: 남은 테이블 칩 돌려주기, 아침 지급, 의심 식히기, 출입 금지 풀기
  function morning() {
    const w = W.data, today = dayKey(), msgs = [];
    if (w.table) { w.chips += w.table.stack; msgs.push('지난번 테이블에 남아 있던 ' + fmt(w.table.stack) + '칩을 돌려받았어요.'); w.table = null; }
    if (w.day < today) {
      const pm = window.Plus ? Plus.morning(w, msgs, today) : {};
      const decay = w.perm.regular ? 60 : 30;
      if (w.sus > 0) { w.sus = Math.max(0, w.sus - decay); msgs.push('하룻밤 사이 의심이 조금 식었어요.'); }
      const total = w.chips + w.vault;
      if (pm.noRefill && total <= 100) msgs.push('계약 때문에 오늘 아침 지급은 없어요.');
      if (total <= 100 && !pm.noRefill) { const add = 100 - total; if (add > 0) { w.chips += add; msgs.push('아침 지급: 칩이 100이 되도록 ' + fmt(add) + '칩을 받았어요.'); } }
      w.day = today;
    }
    return msgs;
  }
  const banned = () => W.data.banDay === dayKey();

  // ── 공통 UI ──
  let toastT = 0;
  function toast(t) { const el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3200); }
  function dialog(title, body, closable = true) {
    const box = $('#ovBox'); box.innerHTML = '';
    box.append(h('h2', { text: title }), ...body);
    if (closable) box.append(h('div', { class: 'row' }, h('button', { class: 'btn small', text: '닫기', onclick: closeDialog })));
    $('#ov').hidden = false;
    const f = box.querySelector('button, input'); if (f) f.focus();
  }
  function closeDialog() { $('#ov').hidden = true; }
  function show(id) {
    for (const s of ['scrLobby', 'scrTable', 'scrShop', 'scrFriends', 'scrPlus']) $('#' + s).hidden = s !== id;
    $('#toLobby').hidden = id === 'scrLobby' || id === 'scrTable';
    window.scrollTo(0, 0);
  }
  function renderTop() {
    const w = W.data; if (!w) return;
    $('#wChips').textContent = fmt(w.chips);
    $('#wVaultBox').hidden = !w.perm.vault; $('#wVault').textContent = fmt(w.vault);
    $('#wSus').style.width = Math.min(100, w.sus) + '%'; $('#wSusN').textContent = w.sus;
    $('#wSave').textContent = W.mode === 'online' ? '온라인 저장 · ' + (VelvetOnline.id || '') : W.mode === 'account' ? '계정에 저장' : '이 기기에 저장';
    const lo = $('#wLogout'); if (lo) lo.hidden = W.mode !== 'online';
    const tt = $('#wTitle'); if (tt) { const nm = window.Plus ? Plus.titleName() : ''; tt.textContent = nm; tt.hidden = !nm; }
    if (window.HW) HW.top();
  }

  function cardEl(c, o = {}) {
    if (c == null || c < 0) return h(o.btn ? 'button' : 'span', { class: 'card back' + (o.cls ? ' ' + o.cls : ''), 'aria-label': '뒤집힌 카드', onclick: o.onclick, type: o.btn ? 'button' : null });
    const red = (c & 3) === 1 || (c & 3) === 2;
    return h(o.btn ? 'button' : 'span', { class: 'card' + (red ? ' red' : '') + (o.cls ? ' ' + o.cls : ''), 'aria-label': C.SUIT_NAME[c & 3] + ' ' + C.RK[c >> 2], onclick: o.onclick, type: o.btn ? 'button' : null },
      h('b', { text: C.RK[c >> 2] }), h('i', { text: C.SU[c & 3] }));
  }

  // ════════════════ 로비 ════════════════
  const lobbySel = { holdem: 'low', seven: 'low', blackjack: 'low' };
  function renderLobby() {
    const w = W.data, el = $('#scrLobby'); el.innerHTML = '';
    const ms = morning();
    ms.forEach((m, k) => setTimeout(() => toast(m), k * 3400));
    if (ms.length) save();
    renderTop();
    if (banned()) {
      el.append(h('div', { class: 'lobby-head' }, h('h1', { text: '오늘은 출입 금지예요' }),
        h('p', { class: 'sub', text: '경비원이 당신 얼굴을 기억하고 있어요. 내일 아침 6시가 지나면 다시 들어올 수 있어요.' })));
      el.append(h('div', { class: 'side' }, shopPanel(), vaultPanel()));
      if (window.Plus) Plus.lobbyBanned(el);
      return;
    }
    el.append(h('div', { class: 'lobby-head' }, h('h1', { text: '어느 테이블로 가시겠어요?' }),
      h('p', { class: 'sub', text: '판이 끝나면 언제든 로비로 돌아올 수 있어요. 판 도중에 나가면 그 판은 포기한 것으로 처리돼요.' })));
    const paths = h('div', { class: 'paths' });
    for (const g of ['holdem', 'seven', 'blackjack']) paths.append(pathCard(g));
    el.append(paths);
    if (window.Plus) Plus.lobby(el);
    el.append(h('div', { class: 'side' }, shopPanel(), friendsPanel(), vaultPanel()));
  }
  function pathCard(g) {
    const w = W.data, info = GAMES[g];
    const fans = { holdem: [C.parse('AS'), C.parse('KS')], seven: [C.parse('7H'), C.parse('7D'), C.parse('7C')], blackjack: [C.parse('AH'), C.parse('KC')] };
    const tiers = h('div', { class: 'tiers', role: 'group', 'aria-label': '테이블 등급' });
    for (const t of TIERS[g]) {
      const locked = t.vip && !w.perm.vip;
      tiers.append(h('button', { class: 'tier', 'aria-pressed': lobbySel[g] === t.id ? 'true' : 'false', disabled: locked, title: locked ? 'VIP 카드가 필요해요' : null, text: t.name + (locked ? ' 🔒' : ''),
        onclick: () => { lobbySel[g] = t.id; renderLobby(); } }));
    }
    const T = tierOf(g, lobbySel[g]);
    const need = g === 'blackjack' ? T.minBet : T.min;
    const can = w.chips >= need;
    const fan = h('div', { class: 'fan', 'aria-hidden': 'true' });
    fans[g].forEach((c, k) => { const e = cardEl(c); e.style.transform = 'rotate(' + (k - (fans[g].length - 1) / 2) * 10 + 'deg)'; fan.append(e); });
    return h('div', { class: 'path' + (g === 'blackjack' ? ' bj' : '') }, h('span', { class: 'arch' }), fan,
      h('h2', { text: info.name }), h('p', { class: 'rules', text: info.rules }), tiers,
      h('div', { class: 'tierinfo', text: T.info + (can ? '' : ' · 칩이 부족해요') }),
      h('button', { class: 'btn gold', text: '앉기', disabled: !can, onclick: () => (g === 'blackjack' ? sitBJ(T) : askBuyin(g, T)) }));
  }
  function shopPanel() {
    return h('div', { class: 'panel' }, h('h3', { text: '상점' }),
      h('p', { class: 'note', text: '권총, 돋보기, 담배, 네잎클로버… 판을 뒤집을 물건들이 있어요. 속임수는 의심을 부르니 조심하세요.' }),
      h('button', { class: 'btn', text: '상점 들어가기', onclick: renderShop }));
  }
  function friendsPanel() {
    return h('div', { class: 'panel' }, h('h3', { text: '친구와 하기' }),
      h('p', { class: 'note', text: '링크를 공유받은 친구와 같은 테이블에 앉아요. 친구 테이블은 따로 주는 테이블 칩으로 하고, 내 지갑 칩은 건드리지 않아요. 아이템은 쓸 수 없어요.' }),
      h('button', { class: 'btn', text: '친구 테이블로', onclick: () => (window.Friends ? Friends.open() : toast('준비 중이에요.')) }));
  }
  function vaultPanel() {
    const w = W.data;
    if (!w.perm.vault) return h('div', { class: 'panel' }, h('h3', { text: '오늘의 장부' }),
      h('p', { class: 'note', text: '지금까지 ' + fmt(w.stats.hands) + '판을 했어요. 가장 많이 가졌던 칩은 ' + fmt(w.stats.best) + '칩이에요.' }),
      h('p', { class: 'note', text: '의심 ' + w.sus + '/100. 하룻밤 자고 나면 ' + (w.perm.regular ? 60 : 30) + '씩 식어요.' }));
    const inp = h('input', { type: 'number', id: 'vaultAmt', min: '1', inputmode: 'numeric', placeholder: '금액', 'aria-label': '금고 금액' });
    const move = (dir) => {
      const n = Math.floor(Number(inp.value)); if (!(n > 0)) return toast('금액을 적어 주세요.');
      if (dir > 0) { if (n > w.chips) return toast('가진 칩보다 많이 맡길 수 없어요.'); w.chips -= n; w.vault += n; }
      else { if (n > w.vault) return toast('금고에 그만큼 없어요.'); w.vault -= n; w.chips += n; }
      save(); renderLobby();
    };
    return h('div', { class: 'panel' }, h('h3', { text: '금고' }),
      h('p', { class: 'note', text: '금고 안 칩은 테이블에서 잃지 않아요. 아침 지급은 지갑과 금고를 합쳐 100 이하일 때만 나와요.' }),
      h('div', { class: 'stat', html: null }, '보관 중 ', h('b', { class: 'num', text: fmt(w.vault) })),
      inp, h('div', { class: 'row' }, h('button', { class: 'btn small', text: '맡기기', onclick: () => move(1) }), h('button', { class: 'btn small', text: '꺼내기', onclick: () => move(-1) })));
  }

  // ════════════════ 상점 ════════════════
  function priceOf(p) { const d = window.Plus ? Plus.eff('shop') : 0; return Math.ceil(p * (W.data.perm.vip ? 0.9 : 1) * (1 - d)); }
  function renderShop() {
    const w = W.data, el = $('#scrShop'); el.innerHTML = '';
    el.append(h('div', { class: 'lobby-head' }, h('h1', { text: '상점' }), h('p', { class: 'sub', text: '아이템은 한 판에 하나만 쓸 수 있어요. 속임수 아이템은 쓸 때마다 의심이 오르고, 100이 되면 그날은 쫓겨나요.' + (w.perm.vip ? ' VIP 10% 할인 적용 중.' : '') })));
    const grid = h('div', { class: 'shop-grid' });
    for (const id in ITEMS) {
      const it = ITEMS[id], p = priceOf(it.price);
      if (it.auction || it.under) continue;
      grid.append(h('div', { class: 'ware' },
        h('div', { class: 'head' }, h('span', { class: 'ico', svg: icon(id, 26) }), h('div', null, h('h3', { text: it.name }), h('div', { class: 'kind' + (it.kind === 'cheat' ? ' cheat' : ''), text: KIND[it.kind] + (it.sus ? ' +' + it.sus : '') }))),
        h('p', { text: typeof it.desc === 'string' ? it.desc : Object.entries(it.desc).map(([g, d]) => GAMES[g].name + ': ' + d).join(' ') }),
        h('p', { class: 'note', text: '쓸 수 있는 곳: ' + it.games.map((g) => GAMES[g].name).join(', ') + (it.when === 'prep' ? ' · 판 시작 전에 사용' : '') }),
        h('div', { class: 'foot' }, h('span', { class: 'own', text: '가진 것 ' + (w.items[id] || 0) + '개' }),
          h('button', { class: 'btn small gold', disabled: w.chips < p, onclick: () => buy(id, p) }, h('span', { class: 'chip-ico' }), ' ' + fmt(p)))));
    }
    el.append(h('h2', { text: '소모품', style: 'margin:18px 0 10px' }), grid);
    const g2 = h('div', { class: 'shop-grid' });
    for (const id in PERMS) {
      const it = PERMS[id], p = priceOf(it.price), own = !!w.perm[id];
      g2.append(h('div', { class: 'ware' },
        h('div', { class: 'head' }, h('span', { class: 'ico', svg: icon(id, 26) }), h('div', null, h('h3', { text: it.name }), h('div', { class: 'kind', text: '영구' }))),
        h('p', { text: it.desc }),
        h('div', { class: 'foot' }, h('span', { class: 'own', text: own ? '보유 중' : '' }),
          own ? h('span', { class: 'tag', text: 'OWNED' }) : h('button', { class: 'btn small gold', disabled: w.chips < p, onclick: () => buyPerm(id, p) }, h('span', { class: 'chip-ico' }), ' ' + fmt(p)))));
    }
    el.append(h('h2', { text: '영구 물품', style: 'margin:24px 0 10px' }), g2);
    show('scrShop');
  }
  function buy(id, p) {
    const w = W.data; if (w.chips < p) return;
    w.chips -= p; w.items[id] = (w.items[id] || 0) + 1; save(); toast(ITEMS[id].name + '을(를) 샀어요.'); renderShop();
  }
  function buyPerm(id, p) {
    const w = W.data; if (w.chips < p || w.perm[id]) return;
    w.chips -= p; w.perm[id] = true; save(); toast(PERMS[id].name + '을(를) 손에 넣었어요.'); renderShop();
  }

  // ════════════════ 혼자 하는 포커 ════════════════
  let S = null;            // 지금 앉은 테이블
  function stopTimers() { if (S && S.timer) clearTimeout(S.timer); if (S && S.bubbleT) clearTimeout(S.bubbleT); }

  function askBuyin(g, T) {
    const w = W.data;
    const max = Math.min(T.max, w.chips), def = Math.min(max, Math.max(T.min, (T.bb || T.unit) * 100));
    const r = h('input', { type: 'range', min: String(T.min), max: String(max), step: String(T.bb || T.unit), value: String(def), id: 'buyinR', 'aria-label': '바이인' });
    const out = h('b', { class: 'num', text: fmt(def) });
    r.oninput = () => { out.textContent = fmt(r.value); };
    dialog(GAMES[g].name + ' · ' + T.name, [
      h('p', { class: 'sub', text: '테이블에 가지고 앉을 칩을 정하세요. 일어설 때 남은 칩은 지갑으로 돌아와요.' }),
      h('div', { class: 'stat' }, '바이인 ', out), r,
      h('div', { class: 'row' }, h('button', { class: 'btn gold', text: '앉기', onclick: () => { closeDialog(); sitPoker(g, T, Number(r.value)); } }))
    ]);
  }

  function newAI(t, used, stack) {
    const free = ROSTER.filter(([n]) => !used.includes(n));
    const [name, persona] = rand(free.length ? free : ROSTER);
    return { id: 'ai-' + Math.random().toString(36).slice(2, 7), name, kind: 'ai', persona, stack };
  }

  function sitPoker(g, T, buyin, opts = {}) {
    const w = W.data;
    buyin = Math.min(buyin, w.chips);
    w.chips -= buyin; w.table = { game: g, tier: T.id, stack: buyin }; save();
    const n = GAMES[g].seats, unit = T.bb || T.unit;
    const seats = [{ id: 'me', name: '나', kind: 'human', stack: buyin }];
    for (let k = 1; k < n; k++) seats.push(newAI(null, seats.map((s) => s.name), unit * 100));
    const t = C.makePoker(g, { sb: T.sb, bb: T.bb, ante: T.ante || 0, unit, seats });
    S = { mode: 'single', game: g, T, t, me: 0, usedFor: -1, peeks: [], pending: { slot: false, ins: false }, slot: false, ins: false,
      handStart: buyin, bubble: null, sel: { discard: -1, open: -1 }, chooser: null, mirror: null, result: null, raiseTo: 0, under: !!opts.under };
    show('scrTable');
    startHand();
  }

  function takePending() {
    S.slot = S.pending.slot; S.ins = S.pending.ins;
    S.legend = S.pending.legend || null; S.legendLast = !!S.pending.legendLast;
    S.pending = { slot: false, ins: false, legend: null, legendLast: false };
  }
  function startHand() {
    const t = S.t, w = W.data;
    if (W.frozen) return;
    const unit = S.T.bb || S.T.unit;
    t.seats.forEach((s, i) => {
      if (s.kind === 'ai' && s.stack <= 0) {
        const nu = newAI(null, t.seats.map((x) => x.name), unit * 100);
        Object.assign(s, nu, { cards: [], up: [] });
        toast(nu.name + '이(가) 빈자리에 앉았어요.');
      }
    });
    const me = t.seats[0];
    if (me.stack <= 0) { S.result = null; renderTable(); return; }
    t.rig = {};
    if (w.fx.clover > 0) { t.rig.luck = { seat: 0, p: 0.35 }; w.fx.clover--; }
    S.peeks = []; S.mirror = null; S.chooser = null; S.result = null; S.sel = { discard: -1, open: -1 };
    takePending();
    S.handStart = me.stack;
    if (window.Plus) Plus.onHandStart(S, t);
    if (!C.newHand(t)) { renderTable(); return; }
    S.ring = null;
    if (S.under && window.Plus && !t.rig.force) Plus.under.handStart(S, t);
    w.table.stack = me.stack; save();
    if (t.phase === 'choose') for (const i of C.inHand(t)) if (t.seats[i].kind === 'ai') C.aiChoose(t, i);
    renderTable(); pump();
  }

  function pump() {
    if (!S || S.mode !== 'single' || S.game === 'blackjack') return;
    clearTimeout(S.timer);
    const t = S.t;
    if (t.phase === 'done') { handEnd(); return; }
    if (t.phase !== 'bet') return;
    const i = t.toAct;
    if (i < 0) return;
    if (t.seats[i].kind === 'ai') {
      S.timer = setTimeout(() => {
        if (!S || S.t !== t) return;
        const ok = C.aiAct(t, i);
        if (!ok) C.act(t, i, { type: 'fold' });
        speak(i);
        afterChange();
      }, 600 + Math.random() * 600);
    }
  }
  function speak(i) {
    const t = S.t, s = t.seats[i], la = t.lastAct;
    if (!la || la.seat !== i) return;
    const key = la.text.startsWith('다이') ? 'fold' : la.text.startsWith('체크') ? 'check' : la.text.startsWith('콜') ? 'call' : 'raise';
    const pool = s.drunk > 0 ? ['딸꾹, 기분이 좋은데?', '한 잔 더 주세요!'] : (LINES[s.persona] || LINES.calc)[key];
    S.bubble = { seat: i, text: la.text + (Math.random() < 0.55 ? ' · ' + rand(pool) : '') };
    clearTimeout(S.bubbleT);
    S.bubbleT = setTimeout(() => { if (S) { S.bubble = null; renderTable(); } }, 2200);
  }
  function afterChange() {
    const w = W.data;
    if (S.mode === 'single' && w.table) { const st = S.t.seats[0].stack; if (w.table.stack !== st) { w.table.stack = st; save(); } }
    renderTable(); pump();
  }
  function myAct(type, to) {
    if (!S || S.t.toAct !== 0) return;
    S.chooser = null;
    if (C.act(S.t, 0, { type, to })) afterChange();
  }
  function handEnd() {
    const t = S.t, w = W.data, me = t.seats[0];
    if (S.result && S.result.hand === t.handNo) return;
    const net = me.stack - S.handStart;
    let extra = 0;
    if (S.slot) { if (net > 0) extra += net; else if (net < 0) extra -= Math.min(w.chips, -net); }
    if (S.ins && net < 0) extra += Math.floor(-net / 2);
    w.chips += extra;
    w.table.stack = me.stack; w.stats.hands++;
    w.stats.best = Math.max(w.stats.best, w.chips + w.vault + me.stack);
    for (const s of t.seats) if (s.drunk > 0) s.drunk--;
    if (window.Plus) {
      const r = t.results || {}, st = w.st, won = net > 0;
      const inc = (k) => { st[k] = (st[k] || 0) + 1; };
      if (me.folded) inc('pkFold');
      if (S.under) { inc('ugHand'); if (won) inc('ugWin'); }
      if (won) { inc('pkWin'); inc(S.game === 'holdem' ? 'hdWin' : 'svWin'); if (!r.showdown) inc('noShow'); if (me.allin) inc('allinWin'); if (r.pot >= 1000) inc('bigPot'); }
      if (!me.folded && r.showdown) {
        const v = C.evalHand(S.game === 'holdem' ? me.cards.concat(t.board) : me.cards), cat = Math.floor(v / 1048576);
        if (cat === 8 && Math.floor((v % 1048576) / 65536) === 13) inc('royal'); else if (cat === 8) inc('sflush');
        if (cat === 7) inc('quads'); if (cat === 6) inc('fh');
      }
      extra += Plus.settle({ game: S.game, net, staked: me.contrib, folded: me.folded, legend: S.legend, last: S.legendLast });
      S.legend = null; S.legendLast = false;
    }
    save();
    S.result = { hand: t.handNo, net, extra, res: t.results };
    renderTop();
    renderTable();
  }

  function leaveTable() {
    const w = W.data;
    stopTimers();
    if (S && S.mode === 'single') {
      if (S.game === 'blackjack') { /* 블랙잭은 베팅이 이미 지갑에서 빠졌다 */ }
      else {
        const t = S.t, me = t.seats[0];
        const mid = (t.phase === 'bet' || t.phase === 'choose') && !me.folded;
        w.chips += me.stack; w.table = null;
        if (mid) toast('판 도중에 일어나서 이번 판에 건 칩은 잃었어요.');
      }
      save();
    } else if (S && S.leave) S.leave();
    const wasUnder = S && S.under;
    S = null;
    if (wasUnder && window.Plus) return Plus.under.open();
    show('scrLobby'); renderLobby();
  }

  // ── 아이템 사용 ──
  function itemUsable(id) {
    if (!S || S.mode !== 'single') return false;
    const it = ITEMS[id], w = W.data, g = S.game;
    if (!(w.items[id] > 0) || !it.games.includes(g)) return false;
    if (it.under && !S.under) return false;
    const t = S.t;
    const between = g === 'blackjack' ? (t.phase === 'bet' || t.phase === 'done') : (t.phase === 'done' || t.phase === 'idle');
    const target = between ? t.handNo + 1 : t.handNo;
    if (id === 'watch') return !!(between && S.result && S.result.net < 0 && !S.result.undone);
    if (S.usedFor === target) return false;
    if (it.when === 'prep') return it.legend ? between && !S.pending.legend : between;
    if (g === 'blackjack') {
      const myTurn = t.phase === 'play' && t.turn && t.turn.seat === 0;
      if (id === 'whiskey') return false;
      return myTurn;
    }
    const me = t.seats[0];
    if (id === 'whiskey') return between || ((t.phase === 'bet' || t.phase === 'choose') && !me.folded);
    if (!((t.phase === 'bet' || t.phase === 'choose') && !me.folded)) return false;
    if (id === 'pistol') return g === 'holdem' ? t.board.length <= 3 : (t.phase === 'choose' || t.street <= 2);
    return true;
  }
  function consume(id, forNext) {
    const w = W.data, it = ITEMS[id];
    w.items[id]--;
    S.usedFor = forNext ? S.t.handNo + 1 : S.t.handNo;
    if (S.under && window.Plus) { Plus.inc('ugItem'); save(); return Plus.under.onItem(); }
    if (it.sus) { w.sus = Math.min(100, w.sus + (window.Plus ? Plus.susGain(it.sus) : it.sus)); }
    if (window.Plus && it.kind === 'cheat') Plus.inc('cheat');
    save();
    if (w.sus >= 100) { setTimeout(() => caught('의심이 한계를 넘었어요.'), 400); return false; }
    return true;
  }
  function caught(why) {
    const w = W.data;
    stopTimers();
    if (S && S.game !== 'blackjack' && S.mode === 'single') { const me = S.t.seats[0]; me.folded = true; w.chips += me.stack; me.stack = 0; w.table = null; }
    w.sus = 100; w.banDay = dayKey(); save();
    if (window.Plus) { Plus.stopAll(); Plus.event('ban'); }
    S = null;
    dialog('경비원이 어깨를 두드립니다', [
      h('p', { class: 'sub', text: why + ' 이번 판에 건 칩은 몰수되고, 남은 칩만 챙겨서 밖으로 안내받았어요. 오늘은 더 이상 입장할 수 없어요.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn gold', text: '로비로', onclick: () => { closeDialog(); show('scrLobby'); renderLobby(); } }))
    ], false);
  }

  function useItem(id) {
    if (!itemUsable(id)) return;
    const t = S.t, g = S.game, it = ITEMS[id];
    const between = g === 'blackjack' ? (t.phase === 'bet' || t.phase === 'done') : (t.phase === 'done' || t.phase === 'idle');
    if (id === 'watch') {
      const r = S.result, back = -r.net;
      if (g === 'blackjack') { W.data.chips += back; t.seats[0].stack = W.data.chips; }
      else { t.seats[0].stack += back; if (W.data.table) W.data.table.stack = t.seats[0].stack; }
      r.undone = true; r.net = 0; S.usedFor = -1;
      if (window.Plus) Plus.inc('watch');
      if (!consume(id)) return;
      toast('시곗바늘이 거꾸로 돌았어요. 방금 판은 없던 일이 됐어요.');
      return renderTable();
    }
    if (it.legend) {
      if (S.pending.legend) return toast('이미 다음 판에 걸어 둔 물건이 있어요.');
      S.pending.legend = id;
      if (id === 'monkey' && W.data.items.monkey === 1) S.pending.legendLast = true;
      if (!consume(id, true)) return;
      toast(it.name + ': 다음 판에 효과가 걸려요.' + (S.pending.legendLast ? ' 마지막 손가락이에요…' : ''));
      return renderTable();
    }
    if (it.when === 'prep') {
      if (id === 'slot') S.pending.slot = true;
      if (id === 'insurance') S.pending.ins = true;
      if (id === 'clover') W.data.fx.clover += 4;
      if (id === 'notebook') W.data.fx.notebook += 5;
      consume(id, true);
      toast(it.name + ': 다음 판부터 효과가 시작돼요.');
      return renderTable();
    }
    if (id === 'marked') {
      t.seats.forEach((s, i) => { if (i && !s.folded && s.cards.length) S.peeks.push({ seat: i, idx: 0 }); });
      consume(id); return renderTable();
    }
    if (id === 'ring') { S.ring = { cards: t.deck.slice(0, 2), board: t.board.length }; consume(id); return renderTable(); }
    if (id === 'fake') {
      t.seats[0].stack += 500; if (W.data.table) W.data.table.stack = t.seats[0].stack;
      if (consume(id)) toast('가짜 칩 500개가 칩 더미 속으로 사라졌어요.');
      return renderTable();
    }
    if (id === 'mirror') {
      const next = g === 'blackjack' ? t.shoe[0] : t.deck[0];
      S.mirror = { card: next, left: g === 'blackjack' ? t.shoe.length : t.deck.length };
      consume(id); return renderTable();
    }
    if (g === 'blackjack') {
      if (id === 'pistol') { if (!consume(id)) return; t.rig.forceExtra = true; toast('딜러의 손이 떨리기 시작했어요.'); return renderTable(); }
      if (id === 'lens') { consume(id); S.peekHole = true; return renderTable(); }
    }
    // 고르는 화면이 필요한 아이템
    S.chooser = { id, between };
    renderTable();
  }
  function chooserPick(choice) {
    const ch = S.chooser; if (!ch) return;
    const t = S.t, g = S.game, id = ch.id;
    S.chooser = null;
    if (id === 'pistol') {
      if (!consume(id)) return;
      if (g === 'holdem') t.rig.suitBoard = { suit: choice, n: 2 }; else t.rig.suitSeat = { seat: 0, suit: choice, n: 2 };
      toast('딜러가 굳은 얼굴로 고개를 끄덕였어요. ' + C.SUIT_NAME[choice] + ' 두 장.');
    } else if (id === 'lens') {
      const s = t.seats[choice];
      const hidden = s.cards.map((c, k) => k).filter((k) => !s.up[k] && !S.peeks.some((p) => p.seat === choice && p.idx === k));
      if (!hidden.length) { toast('더 엿볼 카드가 없어요.'); return renderTable(); }
      consume(id);
      S.peeks.push({ seat: choice, idx: rand(hidden) });
    } else if (id === 'whiskey') {
      consume(id, ch.between);
      t.seats[choice].drunk = 3;
      toast(t.seats[choice].name + '이(가) 위스키를 받아 들었어요. 3판 동안 판단이 흐려져요.');
    } else if (id === 'cigarette' || id === 'sleeve') {
      if (id === 'sleeve' && !S.under) {
        const p = W.data.perm.regular ? 0.15 : 0.3;
        if (Math.random() < p) { W.data.items.sleeve--; save(); return caught('소매에서 에이스가 미끄러져 나왔어요.'); }
      }
      if (g === 'blackjack') {
        const hd = t.seats[0].hands[t.turn.hand];
        if (id === 'cigarette') { const old = hd.cards[choice]; hd.cards[choice] = t.shoe.shift(); t.shoe.push(old); }
        else {
          const k = t.shoe.findIndex((c) => C.rankOf(c) === 12);
          if (k < 0) { toast('슈에 남은 에이스가 없어요.'); return renderTable(); }
          const old = hd.cards[choice]; hd.cards[choice] = t.shoe[k]; t.shoe[k] = old;
        }
        if (!consume(id)) return;
        if (C.bjValue(hd.cards).total >= 21) { hd.done = true; C.bjAdvance(t); }
        afterBJ(); return;
      }
      const me = t.seats[0];
      if (id === 'cigarette') { const old = me.cards[choice]; me.cards[choice] = t.deck.shift(); t.deck.push(old); }
      else {
        const k = t.deck.findIndex((c) => C.rankOf(c) === 12);
        if (k < 0) { toast('덱에 남은 에이스가 없어요.'); return renderTable(); }
        const old = me.cards[choice]; me.cards[choice] = t.deck[k]; t.deck[k] = old;
      }
      if (!consume(id)) return;
      toast(id === 'cigarette' ? '연기 너머로 카드가 바뀌었어요.' : '소매 속 에이스가 자리를 잡았어요.');
    }
    renderTable();
  }

  // ════════════════ 혼자 하는 블랙잭 ════════════════
  function sitBJ(T) {
    const w = W.data;
    const t = C.makeBJ({ minBet: T.minBet, maxBet: T.maxBet, seats: [{ id: 'me', name: '나', kind: 'human', stack: w.chips }] });
    S = { mode: 'single', game: 'blackjack', T, t, me: 0, usedFor: -1, bet: T.minBet, pending: { slot: false, ins: false }, slot: false, ins: false,
      handStart: w.chips, chooser: null, mirror: null, peekHole: false, result: null, counting: false };
    show('scrTable'); renderTable();
  }
  function bjAddBet(n) { const max = Math.min(S.T.maxBet, W.data.chips); S.bet = Math.max(0, Math.min(max, (S.bet || 0) + n)); renderTable(); }
  function bjDeal() {
    const t = S.t, w = W.data;
    if (t.phase === 'play') return;
    if (S.bet < S.T.minBet) return toast('최소 베팅은 ' + S.T.minBet + '칩이에요.');
    if (S.bet > w.chips) return toast('칩이 부족해요.');
    t.phase = 'bet'; t.seats[0].stack = w.chips;
    if (!C.bjBet(t, 0, S.bet)) return toast('베팅할 수 없는 금액이에요.');
    t.rig = {};
    if (w.fx.clover > 0) { t.rig.luck = { seat: 0, p: 0.35 }; w.fx.clover--; }
    S.counting = w.fx.notebook > 0; if (S.counting) w.fx.notebook--;
    takePending();
    S.mirror = null; S.peekHole = false; S.chooser = null; S.result = null;
    S.handStart = w.chips;
    if (window.Plus) Plus.onHandStart(S, t);
    C.bjDeal(t);
    w.chips = t.seats[0].stack; save();
    afterBJ();
  }
  function bjMy(type) { const t = S.t; if (C.bjAct(t, 0, type)) { W.data.chips = t.seats[0].stack; save(); afterBJ(); } }
  function afterBJ() {
    const t = S.t, w = W.data;
    if (t.phase === 'done' && !(S.result && S.result.hand === t.handNo)) {
      const net = t.seats[0].stack - S.handStart;
      let extra = 0;
      if (S.slot) { if (net > 0) extra += net; else if (net < 0) extra -= Math.min(t.seats[0].stack, -net); }
      if (S.ins && net < 0) extra += Math.floor(-net / 2);
      w.chips = t.seats[0].stack + extra; t.seats[0].stack = w.chips;
      w.stats.hands++; w.stats.best = Math.max(w.stats.best, w.chips + w.vault);
      if (window.Plus) {
        const st = w.st, inc = (k) => { st[k] = (st[k] || 0) + 1; };
        const mine = (t.results.res || []).find((x) => x.seat === 0) || { tags: [] };
        const hands = t.seats[0].hands || [];
        if (mine.tags.includes('블랙잭')) { inc('bjNat'); const b = Plus.eff('bj'); if (b) { const k = Math.floor(hands[0].bet * b); w.chips += k; extra += k; } }
        mine.tags.forEach((tg) => { if (tg === '버스트') inc('bjBust'); });
        hands.forEach((hd, k) => { if (hd.doubled && mine.tags[k] === '승') inc('bjDbl'); });
        if (hands.length > 1) inc('bjSplit');
        if (net > 0) { st.bjStreak = (st.bjStreak || 0) + 1; if (S.counting) inc('countWin'); } else if (net < 0) st.bjStreak = 0;
        st.bjBest = Math.max(st.bjBest || 0, st.bjStreak || 0);
        const staked = hands.reduce((a, x) => a + x.bet, 0);
        extra += Plus.settle({ game: 'blackjack', net, staked, folded: false, legend: S.legend, last: S.legendLast });
        S.legend = null; S.legendLast = false;
        t.seats[0].stack = w.chips;
      }
      S.result = { hand: t.handNo, net, extra, res: t.results };
      if (S.bet > w.chips) S.bet = Math.min(w.chips, S.T.maxBet);
      save();
    }
    renderTable();
  }

  // ════════════════ 테이블 그리기 (혼자 · 친구 공용) ════════════════
  // ctx: { v(보이는 판), me(내 자리), mine(내 카드), game, title, single, actions… }
  function ctxSingle() {
    if (S.game === 'blackjack') {
      const v = C.viewBJ(S.t);
      if (S.peekHole && S.t.dealer.cards[1] != null) v.dealer.cards[1] = S.t.dealer.cards[1];
      return { v, me: 0, game: 'blackjack', single: true };
    }
    const v = C.viewPoker(S.t);
    v.seats[0].cards = S.t.seats[0].cards.slice();
    for (const p of S.peeks) if (S.t.seats[p.seat]) v.seats[p.seat].peek = Object.assign(v.seats[p.seat].peek || {}, { [p.idx]: S.t.seats[p.seat].cards[p.idx] });
    if (W.data.inv && W.data.inv.glasses && (S.t.phase === 'bet' || S.t.phase === 'choose')) {
      const key = S.t.handNo + ':' + S.t.street + ':' + S.t.board.length;
      if (!S.conf || S.conf.key !== key) {
        S.conf = { key, v: {} };
        S.t.seats.forEach((s, i) => { if (i && !s.folded && s.cards.length) { const e = C.equity(S.t, i, 70) * (C.inHand(S.t).length); S.conf.v[i] = e > 1.4 ? '자신감 높음' : e > 0.8 ? '자신감 보통' : '자신감 낮음'; } });
      }
      for (const i in S.conf.v) if (v.seats[i] && !v.seats[i].folded) v.seats[i].conf = S.conf.v[i];
    }
    if (S.under && S.tells) for (const i in S.tells) if (v.seats[i] && !v.seats[i].folded) v.seats[i].conf = (v.seats[i].conf ? v.seats[i].conf + ' · ' : '') + '⚠ ' + S.tells[i];
    return { v, me: 0, game: S.game, single: true };
  }
  function renderTable() {
    if (!S) return;
    const ctx = S.mode === 'single' ? ctxSingle() : S.ctx();
    if (!ctx) return;
    const el = $('#scrTable'); el.innerHTML = '';
    el.classList.toggle('under', !!S.under);
    const T = S.T || {};
    el.append(h('div', { class: 'tablebar' },
      h('h2', { text: GAMES[ctx.game].name + (T.name ? ' · ' + T.name : '') + (S.mode !== 'single' ? ' · 친구 테이블' : '') }),
      S.mode !== 'single' && S.code ? h('span', { class: 'stat' }, '방 코드 ', h('b', { class: 'code', text: S.code })) : null,
      S.mode === 'single' && S.game !== 'blackjack' ? h('span', { class: 'stat' }, '테이블 칩 ', h('b', { text: fmt(S.t.seats[0].stack) })) : null,
      h('button', { class: 'btn small', text: '일어나기', onclick: () => confirmLeave(ctx) })));
    if (ctx.game === 'blackjack') renderBJ(el, ctx); else renderPoker(el, ctx);
  }
  function confirmLeave(ctx) {
    const v = ctx.v;
    const mid = ctx.game === 'blackjack' ? v.phase === 'play' : ((v.phase === 'bet' || v.phase === 'choose') && v.seats[ctx.me] && !v.seats[ctx.me].folded);
    if (!mid) return leaveTable();
    dialog('판 도중이에요', [h('p', { class: 'sub', text: '지금 일어나면 이번 판에 건 칩은 잃어요. 그래도 일어날까요?' }),
      h('div', { class: 'row' }, h('button', { class: 'btn red', text: '일어나기', onclick: () => { closeDialog(); leaveTable(); } }))]);
  }

  function seatPos(d, n) {
    const th = (90 + d * (360 / n)) * Math.PI / 180;
    const narrow = window.innerWidth < 640;
    return { x: 50 + (narrow ? 40 : 44) * Math.cos(th), y: 50 + (narrow ? 41 : 40) * Math.sin(th) };
  }

  function renderPoker(el, ctx) {
    const v = ctx.v, me = ctx.me, n = v.seats.length;
    const felt = h('div', { class: 'felt' }, h('div', { class: 'stamp', text: 'VELVET' }));
    const center = h('div', { class: 'center' });
    if (v.game === 'holdem') {
      const b = h('div', { class: 'cards' });
      for (let k = 0; k < 5; k++) b.append(v.board[k] != null ? cardEl(v.board[k]) : h('span', { class: 'card', style: 'opacity:.12' }));
      center.append(b);
    }
    center.append(h('div', { class: 'pot' }, '팟 ', fmt(v.pot)));
    if (v.phase === 'done' && v.results) center.append(h('div', { class: 'betchip', text: v.results.winners.map((w) => v.seats[w.seat].name + (w.hand ? ' · ' + w.hand : '') + ' +' + fmt(w.amount)).join(' / ') }));
    felt.append(center);
    v.seats.forEach((s, i) => {
      const d = (i - me + n) % n, p = seatPos(d, n);
      const isMe = i === me && !ctx.spectate;
      const winners = v.phase === 'done' && v.results ? v.results.winners.map((w) => w.seat) : [];
      const seat = h('div', { class: 'seat' + (v.toAct === i && v.phase === 'bet' ? ' turn' : '') + (s.folded && v.phase !== 'idle' ? ' fold' : '') + (winners.includes(i) ? ' win' : ''), style: `left:${p.x}%;top:${p.y}%` });
      if (!isMe && s.n) {
        const cs = h('div', { class: 'cards tight' });
        s.cards.forEach((c, k) => {
          const pk = s.peek && s.peek[k];
          cs.append(cardEl(pk != null ? pk : c, { cls: (s.up[k] ? '' : '') + (pk != null ? ' peek' : '') }));
        });
        seat.append(cs);
      }
      const plate = h('div', { class: 'plate' },
        h('div', { class: 'nm' }, (v.button === i && v.game === 'holdem') ? h('span', { class: 'dealer-btn', style: 'display:inline-grid;margin-right:4px', text: 'D' }) : null, isMe && window.HW ? HW.portrait(22) : null, isMe ? '나' : (ctx.names && ctx.names[i]) || s.name),
        h('div', { class: 'st' }, s.away ? '자리 비움' : fmt(s.stack) + (s.allin ? ' · 올인' : '')),
        (!isMe && s.persona && ctx.single) ? h('div', { class: 'note', style: 'font-size:11px', text: C.PERSONA[s.persona].name + (s.drunk > 0 ? ' · 취함' : '') + (s.conf ? ' · ' + s.conf : '') }) : null);
      seat.append(plate);
      if (s.bet > 0) seat.append(h('span', { class: 'betchip', text: fmt(s.bet) }));
      if (v.phase === 'done' && v.results && v.results.hands && v.results.hands[i] && !isMe) seat.append(h('span', { class: 'betchip', text: v.results.hands[i] }));
      const bub = S.bubble && S.bubble.seat === i ? S.bubble.text : (ctx.bubbles && ctx.bubbles[i]);
      if (bub) seat.append(h('span', { class: 'bubble', text: bub }));
      felt.append(seat);
    });
    el.append(felt);

    // 내 자리
    const mine = v.seats[me];
    const panel = h('div', { class: 'hand-panel' });
    let status = '', warn = false;
    if (ctx.waitingHost) status = ctx.waitingHost;
    else if (v.phase === 'idle') status = '다른 손님을 기다리는 중이에요.';
    else if (v.phase === 'done') status = '판이 끝났어요.';
    else if (v.phase === 'choose') status = mine.chosen ? '다른 손님들이 카드를 고르는 중이에요.' : '버릴 카드 한 장을 누르고, 공개할 카드 한 장을 누르세요.';
    else if (!mine) status = '';
    else if (mine.folded) status = '이번 판은 다이했어요. 다른 손님들의 승부를 지켜보세요.';
    else if (v.toAct === me) { status = '당신 차례예요.'; warn = true; }
    else status = (v.seats[v.toAct] ? ((ctx.names && ctx.names[v.toAct]) || v.seats[v.toAct].name) : '') + '의 차례예요.';
    if (ctx.timer) status += ' ' + ctx.timer;
    panel.append(h('div', { class: 'status' + (warn ? ' warn' : ''), text: status }));

    const myCards = ctx.spectate ? [] : (ctx.mine || mine.cards);
    if (!ctx.spectate && v.phase === 'choose' && !mine.chosen && myCards.length === 4) {
      const sel = S.sel || { discard: -1, open: -1 };
      const row = h('div', { class: 'cards mycards' });
      myCards.forEach((c, k) => row.append(cardEl(c, { btn: true, cls: k === sel.discard ? 'sel-discard' : k === sel.open ? 'sel-open' : '',
        onclick: () => { if (sel.discard < 0 || sel.discard === k) sel.discard = sel.discard === k ? -1 : k; else if (sel.open === k) sel.open = -1; else sel.open = k; S.sel = sel; renderTable(); } })));
      panel.append(row, h('p', { class: 'note', text: (sel.discard < 0 ? '먼저 버릴 카드를 누르세요.' : sel.open < 0 ? '이제 공개할 카드를 누르세요.' : '버릴 카드는 아래로, 공개할 카드는 위로 올라왔어요.') }),
        h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: '이대로 확정', disabled: !(sel.discard >= 0 && sel.open >= 0), onclick: () => { ctx.choose ? ctx.choose(sel.discard, sel.open) : singleChoose(sel.discard, sel.open); } })));
    } else if (myCards.length) {
      const row = h('div', { class: 'cards mycards' });
      myCards.forEach((c, k) => row.append(cardEl(c, { cls: (v.game === 'seven' && mine.up[k] ? 'up-mark' : '') + (mine.folded ? ' dim' : ''),
        btn: S.chooser && (S.chooser.id === 'cigarette' || S.chooser.id === 'sleeve'), onclick: S.chooser && (S.chooser.id === 'cigarette' || S.chooser.id === 'sleeve') ? () => chooserPick(k) : null })));
      panel.append(row);
      if (v.game === 'seven') panel.append(h('p', { class: 'note', text: '금테 두른 카드는 상대에게 보이는 카드예요.' }));
      const all = v.game === 'holdem' ? myCards.concat(v.board) : myCards;
      if (all.length >= 2 && myCards.every((c) => c >= 0)) panel.append(h('div', { class: 'handname', text: C.handName(C.evalHand(all)) }));
    }

    // 베팅 조작
    if (!ctx.spectate && v.phase === 'bet' && v.toAct === me && !mine.folded) {
      const L = ctx.legal ? ctx.legal() : C.legal(S.t, me);
      if (L) panel.append(betControls(v, L, ctx));
    }
    // 판 결과
    if (v.phase === 'done') {
      if (ctx.single && S.result) {
        const r = S.result;
        const txt = r.net > 0 ? '이번 판 +' + fmt(r.net) + '칩' : r.net < 0 ? '이번 판 ' + fmt(r.net) + '칩' : '본전이에요';
        panel.append(h('div', { class: 'result' + (r.net < 0 ? ' lose' : '') }, h('b', { text: txt }),
          r.extra ? h('div', { class: 'note', text: (r.extra > 0 ? '아이템 효과로 지갑에 +' : '아이템 효과로 지갑에서 ') + fmt(r.extra) + '칩' }) : null));
      }
      if (ctx.single) {
        if (S.t.seats[0].stack > 0) panel.append(h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: '다음 판', onclick: startHand }), h('button', { class: 'btn', text: '로비로', onclick: () => leaveTable() })));
        else panel.append(h('p', { class: 'note', text: '테이블 칩이 다 떨어졌어요.' }), h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: '로비로', onclick: () => leaveTable() })));
      }
    }
    if (ctx.single && v.phase === 'idle' && S.t.seats[0].stack <= 0) panel.append(h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: '로비로', onclick: () => leaveTable() })));
    if (ctx.extra) panel.append(ctx.extra);

    const side = h('div', { class: 'hand-panel' });
    if (ctx.single) side.append(bagEl(v));
    side.append(h('div', { class: 'label note', text: '진행' }), logEl(v.log));
    el.append(h('div', { class: 'myarea' }, panel, side));
  }

  function betControls(v, L, ctx) {
    const doAct = ctx.act || myAct;
    const box = h('div', { class: 'raise' });
    const acts = h('div', { class: 'actions' },
      h('button', { class: 'btn red', text: '다이', onclick: () => doAct('fold') }),
      h('button', { class: 'btn', text: L.canCheck ? '체크' : '콜 ' + fmt(L.call) + (L.call < L.toCall ? ' (올인)' : ''), onclick: () => doAct(L.canCheck ? 'check' : 'call') }));
    box.append(acts);
    if (L.canRaise && L.maxTo > v.curBet) {
      const clamp = (x) => Math.max(L.minTo, Math.min(L.maxTo, Math.round(x)));
      if (!S.raiseTo || S.raiseTo < L.minTo || S.raiseTo > L.maxTo) S.raiseTo = L.minTo;
      const r = h('input', { type: 'range', min: String(L.minTo), max: String(L.maxTo), step: '1', value: String(S.raiseTo), 'aria-label': '베팅 금액' });
      const go = h('button', { class: 'btn gold', text: (v.curBet === 0 ? '베팅 ' : '레이즈 ') + fmt(S.raiseTo), onclick: () => doAct('raise', S.raiseTo) });
      r.oninput = () => { S.raiseTo = Number(r.value); go.textContent = (v.curBet === 0 ? '베팅 ' : '레이즈 ') + fmt(S.raiseTo) + (S.raiseTo === L.allTo ? ' (올인)' : ''); };
      const pot = L.pot;
      const presets = v.game === 'seven'
        ? [['삥', L.minTo], ['따당', v.curBet * 2], ['하프', v.curBet + (pot + L.toCall) / 2], ['풀', L.maxTo]]
        : [['최소', L.minTo], ['½ 팟', v.curBet + (pot + L.toCall) / 2], ['팟', v.curBet + pot + L.toCall], ['올인', L.allTo]];
      const pr = h('div', { class: 'presets' });
      for (const [nm, val] of presets) { if (nm === '따당' && v.curBet === 0) continue; pr.append(h('button', { class: 'btn small', text: nm, onclick: () => { S.raiseTo = clamp(val); r.value = String(S.raiseTo); r.oninput(); } })); }
      box.append(pr, r, h('div', { class: 'actions' }, go));
    }
    return box;
  }

  function logEl(lines) { const ul = h('ul', { class: 'log' }); for (const l of (lines || []).slice(-10)) ul.append(h('li', { text: l })); return ul; }

  function bagEl(v) {
    const w = W.data, g = S.game;
    const box = h('div', { style: 'display:grid;gap:8px' });
    box.append(h('div', { class: 'label note', text: '가방 · 한 판에 하나' }));
    const bag = h('div', { class: 'bag' });
    let any = false;
    for (const id in ITEMS) {
      if (!(w.items[id] > 0) || !ITEMS[id].games.includes(g)) continue;
      if (ITEMS[id].under && !S.under) continue;
      any = true;
      const ok = itemUsable(id);
      bag.append(h('button', { class: 'item-btn', disabled: !ok, title: descOf(id, g), onclick: () => useItem(id) },
        h('span', { class: 'ico', svg: icon(id) }), h('b', { text: ITEMS[id].name + ' ×' + w.items[id] }), h('small', { text: S.under ? '적발 30%' + (ITEMS[id].when === 'prep' ? ' · 판 시작 전' : '') : ITEMS[id].when === 'after' ? '진 판 직후' : ITEMS[id].when === 'prep' ? '판 시작 전' + (ITEMS[id].sus ? ' · 의심 +' + ITEMS[id].sus : '') : ITEMS[id].kind === 'cheat' ? '의심 +' + ITEMS[id].sus : '내 차례에' })));
    }
    if (!any) bag.append(h('p', { class: 'note', text: '가방이 비었어요. 로비의 상점에서 살 수 있어요.' }));
    box.append(bag);
    const fx = [];
    if (w.fx.clover > 0 || (S.t.rig && S.t.rig.luck)) fx.push('네잎클로버 ' + (w.fx.clover + (S.t.rig && S.t.rig.luck ? 1 : 0)) + '판');
    if (S.pending.slot || S.slot) fx.push('슬롯 코인');
    if (S.pending.ins || S.ins) fx.push('보험 증서');
    if (S.pending.legend || S.legend) fx.push(ITEMS[S.pending.legend || S.legend].name);
    if (g === 'blackjack' && (S.counting || w.fx.notebook > 0)) fx.push('카운팅 수첩 ' + (w.fx.notebook + (S.counting ? 1 : 0)) + '판');
    if (fx.length) box.append(h('p', { class: 'note', text: '걸린 효과: ' + fx.join(' · ') }));
    if (S.mirror) {
      const left = g === 'blackjack' ? S.t.shoe.length : S.t.deck.length;
      if (left === S.mirror.left) box.append(h('div', { class: 'row' }, h('span', { class: 'note', text: '거울에 비친 다음 카드' }), cardEl(S.mirror.card)));
    }
    if (S.ring && S.ring.board === S.t.board.length) box.append(h('div', { class: 'row' }, h('span', { class: 'note', text: '반지에 비친 다음 두 장' }), ...S.ring.cards.map((c) => cardEl(c))));
    if (S.under && window.Plus) box.append(Plus.under.panel(S));
    if (S.chooser) box.append(chooserEl(v));
    return box;
  }
  function chooserEl(v) {
    const id = S.chooser.id, t = S.t, g = S.game;
    const box = h('div', { class: 'chooser' });
    const cancel = h('button', { class: 'btn small', text: '취소', onclick: () => { S.chooser = null; renderTable(); } });
    if (id === 'pistol') {
      box.append(h('b', { text: '어떤 무늬로 깔게 할까요?' }));
      const r = h('div', { class: 'row' });
      [0, 1, 2, 3].forEach((s) => r.append(h('button', { class: 'btn small', text: C.SU[s] + ' ' + C.SUIT_NAME[s], onclick: () => chooserPick(s) })));
      box.append(r);
    } else if (id === 'lens' || id === 'whiskey') {
      box.append(h('b', { text: id === 'lens' ? '누구의 카드를 엿볼까요?' : '누구에게 위스키를 보낼까요?' }));
      const r = h('div', { class: 'row' });
      t.seats.forEach((s, i) => { if (i === 0 || (id === 'lens' && s.folded)) return; r.append(h('button', { class: 'btn small', text: s.name, onclick: () => chooserPick(i) })); });
      box.append(r);
    } else if (id === 'cigarette' || id === 'sleeve') {
      box.append(h('b', { text: id === 'cigarette' ? '바꿔치기할 내 카드를 누르세요.' : '에이스로 바꿀 내 카드를 누르세요.' }));
      if (g === 'blackjack') {
        const hd = t.seats[0].hands[t.turn.hand];
        const r = h('div', { class: 'cards' }); hd.cards.forEach((c, k) => r.append(cardEl(c, { btn: true, cls: 'pick', onclick: () => chooserPick(k) }))); box.append(r);
      } else box.append(h('p', { class: 'note', text: '왼쪽 내 카드 중 하나를 누르면 돼요.' }));
    }
    box.append(cancel);
    return box;
  }
  function singleChoose(d, o) { if (C.choose(S.t, 0, d, o)) { S.sel = { discard: -1, open: -1 }; afterChange(); } }

  // ── 블랙잭 그리기 ──
  function renderBJ(el, ctx) {
    const v = ctx.v, me = ctx.me;
    const felt = h('div', { class: 'felt' }, h('div', { class: 'stamp', style: 'top:46%', text: 'BLACKJACK PAYS 3 TO 2' }));
    const dv = v.dealer.cards.every((c) => c >= 0) && v.dealer.cards.length ? C.bjValue(v.dealer.cards).total : null;
    const dealer = h('div', { class: 'seat', style: 'left:50%;top:24%' },
      h('div', { class: 'cards' }, v.dealer.cards.map((c) => cardEl(c))),
      h('div', { class: 'plate' }, h('div', { class: 'nm', text: '딜러' }), h('div', { class: 'st', text: dv != null && v.dealer.cards.length ? String(dv) : v.dealer.cards.length ? '?' : '' })));
    felt.append(dealer);
    const n = v.seats.length;
    v.seats.forEach((s, i) => {
      const d = (i - me + n) % n;
      const x = n === 1 ? 50 : 50 + (d === 0 ? 0 : (d % 2 ? -1 : 1) * Math.ceil(d / 2) * (78 / Math.max(2, n)));
      const seat = h('div', { class: 'seat' + (v.turn && v.turn.seat === i ? ' turn' : ''), style: `left:${x}%;top:${d === 0 ? 70 : 66}%` });
      s.hands.forEach((hd, hi) => {
        const val = C.bjValue(hd.cards).total;
        seat.append(h('div', { class: 'cards' + (v.turn && v.turn.seat === i && v.turn.hand === hi ? '' : '') }, hd.cards.map((c) => cardEl(c))),
          h('span', { class: 'betchip', text: val + '점' + (hd.doubled ? ' · 더블' : '') + ' · ' + fmt(hd.bet) + '칩' }));
      });
      seat.append(h('div', { class: 'plate' }, h('div', { class: 'nm', text: i === me && !ctx.spectate ? '나' : (ctx.names && ctx.names[i]) || s.name }), h('div', { class: 'st', text: s.away ? '자리 비움' : fmt(s.stack) + (s.bet && !s.hands.length ? ' · 베팅 ' + fmt(s.bet) : '') })));
      felt.append(seat);
    });
    el.append(felt);

    const mine = v.seats[me];
    const panel = h('div', { class: 'hand-panel' });
    const myTurn = !ctx.spectate && v.phase === 'play' && v.turn && v.turn.seat === me;
    let status = v.phase === 'bet' || v.phase === 'done' ? '베팅하고 딜을 누르세요.' : myTurn ? '당신 차례예요.' : '다른 자리의 차례예요.';
    if (ctx.waitingHost) status = ctx.waitingHost;
    if (ctx.timer) status += ' ' + ctx.timer;
    panel.append(h('div', { class: 'status' + (myTurn ? ' warn' : ''), text: status }));
    if (v.phase === 'done' && v.results) {
      const r = ctx.spectate ? null : v.results.res.find((x) => x.seat === me);
      if (r) {
        const extra = ctx.single && S.result ? S.result.extra : 0;
        panel.append(h('div', { class: 'result' + (r.net < 0 ? ' lose' : '') }, h('b', { text: r.tags.join(' · ') + ' · ' + (r.net > 0 ? '+' : '') + fmt(r.net) + '칩' }),
          h('div', { class: 'note', text: '딜러 ' + v.results.dealer + (v.results.dealerBJ ? ' (블랙잭)' : '') }),
          extra ? h('div', { class: 'note', text: (extra > 0 ? '아이템 효과로 +' : '아이템 효과로 ') + fmt(extra) + '칩' }) : null));
      }
    }
    if (myTurn) {
      const L = ctx.bjLegal ? ctx.bjLegal() : C.bjLegal(S.t, me);
      const doIt = ctx.bjAct || bjMy;
      if (L) panel.append(h('div', { class: 'actions' },
        h('button', { class: 'btn gold', text: '히트', onclick: () => doIt('hit') }),
        h('button', { class: 'btn', text: '스탠드', onclick: () => doIt('stand') }),
        h('button', { class: 'btn', text: '더블', disabled: !L.double, onclick: () => doIt('double') }),
        h('button', { class: 'btn', text: '스플릿', disabled: !L.split, onclick: () => doIt('split') })));
    }
    if ((v.phase === 'bet' || v.phase === 'done') && (ctx.single || ctx.canBet)) {
      const T = S.T;
      const cur = ctx.single ? S.bet : (S.bet || T.minBet);
      const chips = h('div', { class: 'presets' });
      for (const c of T.chips) chips.append(h('button', { class: 'btn small', onclick: () => (ctx.addBet || bjAddBet)(c) }, h('span', { class: 'chip-ico' }), ' +' + c));
      chips.append(h('button', { class: 'btn small', text: '지우기', onclick: () => (ctx.addBet || bjAddBet)(-1e9) }));
      panel.append(h('div', { class: 'stat' }, '베팅 ', h('b', { text: fmt(cur) }), ' · 한도 ' + T.minBet + '~' + fmt(T.maxBet)), chips,
        h('div', { class: 'actions' }, h('button', { class: 'btn gold', text: ctx.single ? '딜' : '베팅 확정', disabled: cur < T.minBet, onclick: () => (ctx.deal || bjDeal)() }),
          ctx.single ? h('button', { class: 'btn', text: '로비로', onclick: () => leaveTable() }) : null));
    }
    if (ctx.extra) panel.append(ctx.extra);
    const side = h('div', { class: 'hand-panel' });
    if (ctx.single) {
      side.append(bagEl(v));
      if (S.counting) {
        const t = S.t, decks = Math.max(0.5, t.shoe.length / 52), tc = t.running / decks;
        side.append(h('div', { class: 'chooser' }, h('b', { text: '카운팅 수첩' }),
          h('p', { class: 'note', text: '러닝 카운트 ' + (t.running > 0 ? '+' : '') + t.running + ' · 남은 덱 ' + decks.toFixed(1) + '벌' }),
          h('p', { class: 'note', text: tc >= 2 ? '큰 카드가 많이 남았어요. 베팅을 올릴 때예요.' : tc <= -1 ? '작은 카드가 많이 남았어요. 몸을 사리세요.' : '평범한 흐름이에요.' })));
      }
    }
    side.append(h('div', { class: 'label note', text: '진행 · 슈 ' + v.shoeLeft + '장 남음' }), logEl(v.log));
    el.append(h('div', { class: 'myarea' }, panel, side));
  }

  // ════════════════ 관리자 모드 ════════════════
  // 왼쪽 위 VELVET을 2.5초 안에 5번 누르면 열린다. 온라인 판에서는 아래 아이디만.
  const ADMIN_IDS = ['yh20507'];
  let brandTaps = [];
  function adminAllowed() {
    if (W.mode !== 'online') return true;
    return ADMIN_IDS.includes(String(VelvetOnline.id || '').toLowerCase());
  }
  function onBrandTap() {
    const now = Date.now();
    brandTaps = brandTaps.filter((t) => now - t < 2500); brandTaps.push(now);
    if (brandTaps.length < 5) return;
    brandTaps = [];
    if (!W.data || W.frozen || !adminAllowed()) return;
    if (S) { toast('관리자 모드는 로비에서 열 수 있어요.'); return; }
    if (window.Plus) Plus.event('admin');
    adminPanel();
  }
  function adminPanel() {
    const w = W.data;
    const numIn = (val, max) => h('input', { type: 'number', min: '0', max: max != null ? String(max) : null, step: '1', value: String(val) });
    const row = (label, input) => h('label', { class: 'adm-row' }, h('span', { text: label }), input);
    const chips = numIn(w.chips), vault = numIn(w.vault), sus = numIn(w.sus, 100);
    const unban = h('input', { type: 'checkbox' });
    const t13open = h('input', { type: 'checkbox' });
    const perms = {}, items = {};
    for (const id in PERMS) perms[id] = h('input', { type: 'checkbox', checked: !!w.perm[id] });
    for (const id in ITEMS) items[id] = numIn(w.items[id] || 0, 99);
    const body = [
      h('p', { class: 'sub', text: '숫자를 바꾸고 적용을 누르면 바로 저장돼요.' }),
      h('div', { class: 'adm-grid' },
        row('칩', chips), row('금고', vault), row('의심 (0~100)', sus),
        banned() ? h('label', { class: 'adm-row adm-check' }, unban, h('span', { text: '오늘 출입 금지 풀기' })) : null,
        window.Plus && Plus.t13 ? h('label', { class: 'adm-row adm-check' }, t13open, h('span', { text: '13번 테이블 지금 열기' })) : null),
      h('h3', { text: '영구 아이템' }),
      h('div', { class: 'adm-grid' }, Object.keys(PERMS).map((id) => h('label', { class: 'adm-row adm-check' }, perms[id], h('span', { text: PERMS[id].name })))),
      h('h3', { text: '아이템 개수' }),
      h('div', { class: 'adm-grid' }, Object.keys(ITEMS).map((id) => row(ITEMS[id].name, items[id]))),
      ...(window.HW ? HW.adminRows() : []),
      h('div', { class: 'row' },
        h('button', { class: 'btn gold', text: '적용', onclick: () => {
          const n = (el, max) => { let v = Math.max(0, Math.floor(Number(el.value) || 0)); if (max != null) v = Math.min(max, v); return v; };
          w.chips = n(chips); w.vault = n(vault); w.sus = n(sus, 100);
          if (unban.checked) { w.banDay = null; if (w.sus >= 100) w.sus = 0; }
          if (t13open.checked && window.Plus && Plus.t13) Plus.t13.adminOpen();
          for (const id in PERMS) { if (perms[id].checked) w.perm[id] = true; else delete w.perm[id]; }
          for (const id in ITEMS) { const v = n(items[id], 99); if (v) w.items[id] = v; else delete w.items[id]; }
          if (!w.perm.vault && w.vault) { w.chips += w.vault; w.vault = 0; }
          w.stats.best = Math.max(w.stats.best || 0, w.chips + w.vault);
          if (window.HW) HW.adminApply();
          save(); closeDialog();
          if (!$('#scrLobby').hidden) renderLobby();
          if (!$('#scrShop').hidden) renderShop();
          toast('관리자 모드로 바꿨어요.');
        } }))
    ];
    dialog('관리자 모드', body);
  }

  // ════════════════ 시작 ════════════════
  // 온라인 판: 입구에서 아이디·비밀번호로 로그인
  function loginForm() {
    return new Promise((resolve) => {
      const sign = $('#door .sign');
      const box = h('form', { class: 'login', style: 'display:grid;gap:8px;width:min(300px,100%)' });
      const id = h('input', { type: 'text', id: 'loginId', placeholder: '아이디 (영문, 숫자 4~20자)', autocomplete: 'username', 'aria-label': '아이디' });
      const pw = h('input', { type: 'password', id: 'loginPw', placeholder: '비밀번호 (6자 이상)', autocomplete: 'current-password', 'aria-label': '비밀번호' });
      const msg = h('p', { class: 'note', style: 'color:var(--danger);min-height:1.2em;margin:0' });
      const go = async (kind) => {
        const v = id.value.trim();
        if (!/^[A-Za-z0-9_]{4,20}$/.test(v)) { msg.textContent = '아이디는 영문, 숫자, _ 로 4~20자예요.'; return; }
        if (pw.value.length < 6) { msg.textContent = '비밀번호는 6자 이상이에요.'; return; }
        msg.textContent = kind === 'up' ? '가입하는 중…' : '로그인하는 중…';
        try {
          if (kind === 'up') await VelvetOnline.signUp(v, pw.value); else await VelvetOnline.signIn(v, pw.value);
          box.remove(); resolve();
        } catch (e) { msg.textContent = VelvetOnline.korean(e); }
      };
      box.onsubmit = (e) => { e.preventDefault(); go('in'); };
      box.append(id, pw, msg,
        h('div', { class: 'row', style: 'justify-content:center' },
          h('button', { class: 'btn gold', type: 'submit', text: '로그인' }),
          h('button', { class: 'btn', type: 'button', text: '처음이에요 (가입)', onclick: () => go('up') })),
        h('p', { class: 'note', text: '이 기기에서는 로그인 상태가 유지돼요. 비밀번호는 찾을 수 없으니 잊지 마세요.' }));
      $('#enter').hidden = true;
      sign.append(box);
      id.focus();
    });
  }

  async function boot() {
    $('#enter').disabled = true; $('#enter').textContent = '문을 여는 중…';
    if (window.VelvetOnline) {
      let ok = false;
      if (VelvetOnline.loadSession()) { try { await loadWallet(); ok = true; } catch (e) { VelvetOnline.clearSession(); } }
      while (!ok) {
        await loginForm();
        try { await loadWallet(); ok = true; } catch (e) { toast(VelvetOnline.korean(e)); VelvetOnline.clearSession(); }
      }
      $('#enter').hidden = false;
      const lo = $('#wLogout'); if (lo) lo.onclick = () => { VelvetOnline.clearSession(); location.reload(); };
    } else await loadWallet();
    const msgs = morning(); if (window.Plus) Plus.boot(); save();
    $('#enter').disabled = false; $('#enter').textContent = '입장하기';
    renderTop();
    $('#enter').onclick = () => {
      const inside = () => {
        $('#app').hidden = false;
        show('scrLobby'); renderLobby();
        msgs.forEach((m, k) => setTimeout(() => toast(m), 900 + k * 3400));
      };
      $('#enter').disabled = true;
      if (window.HW && HW.isOn()) return HW.openDoor(inside);   // 할로윈: 박쥐 떼와 박쥐 모양 문
      $('#door').classList.add('open');
      inside();
      setTimeout(() => { $('#door').hidden = true; }, 1200);
    };
    $('#toLobby').onclick = () => { if (window.Plus) Plus.stopAll(); show('scrLobby'); renderLobby(); };
    $('.topbar .brand').onclick = onBrandTap;
    $('#ov').addEventListener('click', (e) => { if (e.target.id === 'ov' && $('#ovBox').querySelector('button')) { /* 바깥 클릭으로는 닫지 않음 */ } });
    window.addEventListener('resize', () => { if (S) renderTable(); });
  }

  return { boot, h, $, cardEl, renderTable, show, renderLobby, toast, dialog, closeDialog, fmt, GAMES, TIERS, tierOf, W, get S() { return S; }, set S(v) { S = v; }, leaveTable, stopTimers, rand, ROSTER, newAI, logEl,
    C, save, renderTop, ITEMS, PERMS, icon, dayKey, banned, caught, LINES, priceOf, sitPoker };
})();
