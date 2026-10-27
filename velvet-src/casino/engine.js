/* ===== 벨벳 카지노 · 게임 엔진 =====
   카드 0~51. 숫자 = c >> 2 (0:2 … 12:A), 무늬 = c & 3 (0 ♠, 1 ♥, 2 ♦, 3 ♣).
   게임 규칙은 "판 상태 + 행동" 구조라서, 누가 행동하든(나, AI, 친구) 똑같이 진행된다. */
const Cas = (() => {
  // ── 기본 도구 ──
  function mulberry(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  const RK = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const SU = ['♠', '♥', '♦', '♣'];
  const SUIT_NAME = ['스페이드', '하트', '다이아', '클로버'];
  const rankOf = (c) => c >> 2, suitOf = (c) => c & 3;
  const cardName = (c) => SU[c & 3] + RK[c >> 2];
  const parse = (s) => { const r = s.slice(0, -1).toUpperCase().replace('T', '10'); return RK.indexOf(r) * 4 + 'SHDC'.indexOf(s.slice(-1).toUpperCase()); };
  function newDeck(n = 1) { const d = []; for (let k = 0; k < n; k++) for (let c = 0; c < 52; c++) d.push(c); return d; }

  // ── 족보 판정: 카드 1~7장 중 가장 좋은 5장 ──
  const CAT = ['하이카드', '원페어', '투페어', '트리플', '스트레이트', '플러시', '풀하우스', '포카드', '스트레이트 플러시'];
  const P5 = 1048576; // 16^5
  function score(cat, ks) { let v = cat; for (let i = 0; i < 5; i++) v = v * 16 + (ks[i] !== undefined ? ks[i] + 1 : 0); return v; }
  function straightHigh(mask) {
    for (let h = 12; h >= 3; h--) {
      let ok = true;
      for (let k = 0; k < 5; k++) { const r = h - k; if (!(mask & (1 << (r < 0 ? 12 : r)))) { ok = false; break; } }
      if (ok) return h;
    }
    return -1;
  }
  function evalHand(cards) {
    const rc = new Array(13).fill(0), sc = [[], [], [], []];
    for (const c of cards) { rc[c >> 2]++; sc[c & 3].push(c >> 2); }
    let fl = null;
    for (const s of sc) if (s.length >= 5) fl = s.slice().sort((a, b) => b - a);
    if (fl) { let m = 0; for (const r of fl) m |= 1 << r; const sh = straightHigh(m); if (sh >= 0) return score(8, [sh]); }
    const g = [];
    for (let r = 12; r >= 0; r--) if (rc[r]) g.push([rc[r], r]);
    if (!g.length) return 0;
    g.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    const rest = (skip) => g.filter((x) => !skip.includes(x[1])).map((x) => x[1]).sort((a, b) => b - a);
    if (g[0][0] === 4) return score(7, [g[0][1], ...rest([g[0][1]]).slice(0, 1)]);
    if (g[0][0] === 3 && g.length > 1 && g[1][0] >= 2) return score(6, [g[0][1], g[1][1]]);
    if (fl) return score(5, fl.slice(0, 5));
    let m = 0; for (let r = 0; r < 13; r++) if (rc[r]) m |= 1 << r;
    const sh = straightHigh(m); if (sh >= 0) return score(4, [sh]);
    if (g[0][0] === 3) return score(3, [g[0][1], ...rest([g[0][1]]).slice(0, 2)]);
    if (g[0][0] === 2 && g.length > 1 && g[1][0] === 2) return score(2, [g[0][1], g[1][1], ...rest([g[0][1], g[1][1]]).slice(0, 1)]);
    if (g[0][0] === 2) return score(1, [g[0][1], ...rest([g[0][1]]).slice(0, 3)]);
    return score(0, rest([]).slice(0, 5));
  }
  function handName(v) {
    const cat = Math.floor(v / P5), top = Math.floor(v / 65536) % 16 - 1;
    if (cat === 8 && top === 12) return '로열 스트레이트 플러시';
    if (cat === 0) return (RK[top] || '') + ' 하이';
    if (cat === 2) { const second = Math.floor(v / 4096) % 16 - 1; return RK[top] + '·' + RK[second] + ' 투페어'; }
    if (cat === 4 || cat === 8 || cat === 5) return RK[top] + ' ' + CAT[cat];
    return RK[top] + ' ' + CAT[cat];
  }

  // ── 포커 (홀덤 · 세븐포커) ──
  const PERSONA = {
    rock: { name: '바위', bet: 1.35, raise: 1.65, aggr: 0.7, bluff: 0.03, callMul: 1.15, loose: 0, size: 0.6 },
    bluffer: { name: '허풍쟁이', bet: 1.1, raise: 1.35, aggr: 0.85, bluff: 0.28, callMul: 1.0, loose: 0.04, size: 0.85 },
    station: { name: '고집쟁이', bet: 1.45, raise: 1.75, aggr: 0.3, bluff: 0.04, callMul: 0.7, loose: 0.12, size: 0.5 },
    calc: { name: '계산기', bet: 1.25, raise: 1.5, aggr: 0.6, bluff: 0.1, callMul: 1.0, loose: 0, size: 0.65 }
  };

  function makePoker(game, o) {
    return {
      kind: 'poker', game, sb: o.sb || 1, bb: o.bb || 2, ante: o.ante || 0, unit: o.unit || o.bb || 2,
      seats: o.seats.map((s) => seatInit(s)), button: -1, deck: [], board: [], street: 0, phase: 'idle',
      toAct: -1, curBet: 0, minRaise: o.bb || 2, raises: 0, handNo: 0, log: [], results: null, rig: {}, r: o.r || Math.random,
      lastAct: null, peeks: []
    };
  }
  function seatInit(s) {
    return Object.assign({ cards: [], up: [], folded: true, allin: false, bet: 0, contrib: 0, acted: false, chosen: false, away: false, drunk: 0 }, s);
  }
  const inHand = (t) => t.seats.map((s, i) => i).filter((i) => !t.seats[i].folded);
  const potTotal = (t) => t.seats.reduce((a, s) => a + s.contrib, 0);
  function nextIdx(t, from, pred) {
    const n = t.seats.length;
    for (let k = 1; k <= n; k++) { const i = (from + k) % n; if (pred(t.seats[i], i)) return i; }
    return -1;
  }
  function put(t, s, amt) { amt = Math.max(0, Math.min(amt, s.stack)); s.stack -= amt; s.bet += amt; s.contrib += amt; if (s.stack === 0) s.allin = true; return amt; }
  function say(t, text) { t.log.push(text); if (t.log.length > 40) t.log.shift(); }

  // 카드 한 장 뽑기 (아이템 장치 포함)
  function draw(t, forSeat, isBoard) {
    let idx = 0;
    const rg = t.rig;
    // 전설 아이템: 정해 둔 카드를 정해 둔 자리에 (다른 자리는 그 카드를 받지 못함)
    const F = rg.force;
    if (F) {
      const q = isBoard ? F.board : (F.seat === forSeat ? F.hole : null);
      if (q && q.length) {
        const want = q.shift();
        if (want != null) { const k = t.deck.indexOf(want); if (k >= 0) return t.deck.splice(k, 1)[0]; }
      }
      const res = new Set(F.hole.concat(F.board).filter((x) => x != null));
      if (res.size) { const k = t.deck.findIndex((c) => !res.has(c)); if (k > 0) idx = k; }
      if (res.size) {
        let c = t.deck.splice(idx, 1)[0];
        return c;
      }
    }
    if (isBoard && rg.suitBoard && rg.suitBoard.n > 0) {
      const k = t.deck.findIndex((c) => suitOf(c) === rg.suitBoard.suit); if (k >= 0) idx = k; rg.suitBoard.n--;
    } else if (!isBoard && rg.suitSeat && rg.suitSeat.seat === forSeat && rg.suitSeat.n > 0) {
      const k = t.deck.findIndex((c) => suitOf(c) === rg.suitSeat.suit); if (k >= 0) idx = k; rg.suitSeat.n--;
    }
    let c = t.deck.splice(idx, 1)[0];
    const L = rg.luck;
    if (L && (forSeat === L.seat || isBoard) && t.deck.length && t.r() < L.p) {
      const alt = t.deck[0], me = t.seats[L.seat];
      const base = t.game === 'holdem' ? me.cards.concat(t.board) : me.cards.slice();
      if (evalHand(base.concat([alt])) > evalHand(base.concat([c]))) { t.deck[0] = c; c = alt; }
    }
    return c;
  }

  function newHand(t) {
    const S = t.seats;
    for (const s of S) {
      s.cards = []; s.up = []; s.bet = 0; s.contrib = 0; s.acted = false; s.allin = false; s.chosen = false;
      s.folded = !(s.stack > 0 && !s.out); s.shown = false;
    }
    const live = inHand(t);
    if (live.length < 2) { t.phase = 'idle'; return false; }
    t.handNo++; t.deck = shuffle(newDeck(), t.r); t.board = []; t.results = null; t.log = []; t.curBet = 0;
    t.minRaise = t.unit; t.raises = 0; t.street = 0; t.lastAct = null; t.peeks = [];
    if (t.game === 'holdem') {
      t.button = nextIdx(t, t.button < 0 ? t.seats.length - 1 : t.button, (s) => !s.folded);
      const hu = live.length === 2;
      const sbI = hu ? t.button : nextIdx(t, t.button, (s) => !s.folded);
      const bbI = nextIdx(t, sbI, (s) => !s.folded);
      put(t, S[sbI], t.sb); put(t, S[bbI], t.bb);
      t.curBet = t.bb; t.minRaise = t.bb;
      say(t, S[sbI].name + ' 스몰 블라인드 ' + t.sb + ', ' + S[bbI].name + ' 빅 블라인드 ' + t.bb);
      for (let round = 0; round < 2; round++) {
        let i = t.button;
        for (let k = 0; k < live.length; k++) { i = nextIdx(t, i, (s) => !s.folded); S[i].cards.push(draw(t, i, false)); }
      }
      t.toAct = nextIdx(t, bbI, (s) => !s.folded && !s.allin);
      t.sbI = sbI; t.bbI = bbI;
      t.phase = 'bet';
      if (t.toAct < 0 || needsNoAction(t)) progress(t);
    } else {
      t.button = nextIdx(t, t.button < 0 ? t.seats.length - 1 : t.button, (s) => !s.folded);
      for (const i of live) put(t, S[i], t.ante);
      for (const s of S) { s.bet = 0; }
      say(t, '모두 앤티 ' + t.ante + '칩');
      for (let round = 0; round < 4; round++) for (const i of live) { S[i].cards.push(draw(t, i, false)); S[i].up.push(false); }
      t.phase = 'choose';
    }
    return true;
  }

  // 세븐포커: 4장 중 1장 버리고 1장 공개
  function choose(t, i, discard, open) {
    const s = t.seats[i];
    if (t.phase !== 'choose' || s.folded || s.chosen) return false;
    if (!(discard >= 0 && discard < 4 && open >= 0 && open < 4 && discard !== open)) return false;
    const openCard = s.cards[open];
    s.cards.splice(discard, 1); s.up = [false, false, false];
    const oi = s.cards.indexOf(openCard);
    // 공개 카드는 맨 뒤로
    s.cards.splice(oi, 1); s.cards.push(openCard); s.up = [false, false, true];
    s.chosen = true;
    if (inHand(t).every((k) => t.seats[k].chosen)) startStreetSeven(t, 1);
    return true;
  }
  function aiChoose(t, i) {
    const cs = t.seats[i].cards;
    let best = null;
    for (let d = 0; d < 4; d++) {
      const keep = cs.filter((_, k) => k !== d);
      const v = evalHand(keep) + keep.reduce((a, c) => a + rankOf(c), 0);
      if (!best || v > best.v) best = { v, d, keep };
    }
    const cnt = {}; for (const c of best.keep) cnt[rankOf(c)] = (cnt[rankOf(c)] || 0) + 1;
    let open = best.keep.slice().sort((a, b) => (cnt[rankOf(a)] - cnt[rankOf(b)]) || (rankOf(a) - rankOf(b)))[0];
    return choose(t, i, best.d, cs.indexOf(open));
  }
  function upCards(s) { return s.cards.filter((_, k) => s.up[k]); }
  function startStreetSeven(t, st) {
    t.street = st;
    const live = inHand(t);
    for (const i of live) { const s = t.seats[i]; s.cards.push(draw(t, i, false)); s.up.push(st < 4); }
    t.curBet = 0; t.minRaise = t.unit; t.raises = 0;
    for (const s of t.seats) { s.bet = 0; s.acted = false; }
    t.phase = 'bet';
    // 보이는 패가 가장 좋은 사람부터
    let first = -1, bv = -1;
    for (const i of live) { const s = t.seats[i]; if (s.allin) continue; const v = evalHand(upCards(s)); if (v > bv) { bv = v; first = i; } }
    t.toAct = first;
    say(t, ['', '4구', '5구', '6구', '히든'][st] + ' 카드');
    if (first < 0 || needsNoAction(t)) progress(t);
  }

  function needsNoAction(t) {
    const can = inHand(t).filter((i) => !t.seats[i].allin);
    if (can.length === 0) return true;
    if (can.length === 1 && t.seats[can[0]].bet >= t.curBet) return true;
    return false;
  }

  function legal(t, i) {
    const s = t.seats[i];
    if (t.phase !== 'bet' || t.toAct !== i) return null;
    const toCall = Math.max(0, t.curBet - s.bet);
    const call = Math.min(toCall, s.stack);
    const allTo = s.bet + s.stack;
    let minTo = t.curBet + Math.max(t.minRaise, t.unit);
    let maxTo = allTo;
    if (t.game === 'seven') maxTo = Math.min(allTo, t.curBet + potTotal(t) + toCall);
    const canRaise = s.stack > toCall && (t.game !== 'seven' || t.raises < 4) &&
      inHand(t).some((k) => k !== i && !t.seats[k].allin);
    if (minTo > maxTo) minTo = maxTo;
    return { toCall, call, canCheck: toCall === 0, canRaise, minTo, maxTo, allTo, pot: potTotal(t) };
  }

  function act(t, i, a) {
    const L = legal(t, i); if (!L) return false;
    const s = t.seats[i];
    let text = '';
    if (a.type === 'fold') { s.folded = true; text = '다이'; }
    else if (a.type === 'check') { if (!L.canCheck) return false; text = '체크'; }
    else if (a.type === 'call') { if (L.canCheck) { text = '체크'; } else { put(t, s, L.call); text = s.allin ? '콜 (올인)' : '콜 ' + L.call; } }
    else if (a.type === 'raise') {
      if (!L.canRaise) return act(t, i, { type: L.canCheck ? 'check' : 'call' });
      let to = Math.round(Number(a.to));
      if (!(to > 0)) return false;
      to = Math.max(Math.min(to, L.maxTo), Math.min(L.minTo, L.allTo));
      if (to <= t.curBet) return act(t, i, { type: L.canCheck ? 'check' : 'call' });
      const was = t.curBet;
      put(t, s, to - s.bet);
      if (to - was >= t.minRaise) t.minRaise = to - was;
      t.curBet = Math.max(t.curBet, s.bet);
      t.raises++;
      for (const o of t.seats) if (o !== s && !o.folded && !o.allin) o.acted = false;
      text = (was === 0 ? '베팅 ' : '레이즈 ') + s.bet + (s.allin ? ' (올인)' : '');
    } else return false;
    s.acted = true;
    t.lastAct = { seat: i, text };
    if (typeof window !== 'undefined' && window.Snd) window.Snd.act(text);
    say(t, s.name + ' ' + text);
    progress(t);
    return true;
  }

  function progress(t) {
    const live = inHand(t);
    if (live.length === 1) { awardSingle(t, live[0]); return; }
    const can = live.filter((i) => !t.seats[i].allin);
    const done = can.every((i) => t.seats[i].acted && t.seats[i].bet === t.curBet) || needsNoAction(t);
    if (!done) {
      t.toAct = nextIdx(t, t.toAct, (s) => !s.folded && !s.allin && (!s.acted || s.bet < t.curBet));
      return;
    }
    for (const s of t.seats) { s.bet = 0; s.acted = false; }
    t.curBet = 0; t.minRaise = t.unit; t.raises = 0;
    const last = t.game === 'holdem' ? 3 : 4;
    const runOut = can.length <= 1;
    if (t.street >= last) { showdown(t); return; }
    if (runOut) {
      while (t.street < last) dealStreet(t, true);
      showdown(t); return;
    }
    dealStreet(t, false);
  }

  function dealStreet(t, silent) {
    if (t.game === 'holdem') {
      t.street++;
      const n = t.street === 1 ? 3 : 1;
      for (let k = 0; k < n; k++) t.board.push(draw(t, -1, true));
      say(t, ['', '플랍', '턴', '리버'][t.street] + ': ' + t.board.map(cardName).join(' '));
      if (silent) return;
      t.phase = 'bet';
      t.toAct = nextIdx(t, t.button, (s) => !s.folded && !s.allin);
      if (needsNoAction(t)) progress(t);
    } else {
      if (silent) {
        t.street++;
        for (const i of inHand(t)) { const s = t.seats[i]; s.cards.push(draw(t, i, false)); s.up.push(t.street < 4); }
        return;
      }
      startStreetSeven(t, t.street + 1);
    }
  }

  function awardSingle(t, w) {
    const pot = potTotal(t);
    t.seats[w].stack += pot;
    for (const s of t.seats) s.bet = 0;
    t.results = { winners: [{ seat: w, amount: pot, hand: '' }], showdown: false, pot };
    say(t, t.seats[w].name + ' 승리 (+' + pot + ')');
    t.phase = 'done'; t.toAct = -1;
  }

  function showdown(t) {
    const live = inHand(t);
    const val = {};
    for (const i of live) {
      const s = t.seats[i]; s.shown = true;
      val[i] = evalHand(t.game === 'holdem' ? s.cards.concat(t.board) : s.cards);
    }
    const levels = [...new Set(live.map((i) => t.seats[i].contrib))].sort((a, b) => a - b);
    const pots = []; let prev = 0;
    for (const L of levels) {
      let amt = 0;
      for (const s of t.seats) amt += Math.max(0, Math.min(s.contrib, L) - prev);
      pots.push({ amt, elig: live.filter((i) => t.seats[i].contrib >= L) });
      prev = L;
    }
    const total = potTotal(t), assigned = pots.reduce((a, p) => a + p.amt, 0);
    if (total > assigned && pots.length) pots[pots.length - 1].amt += total - assigned;
    const won = {};
    for (const p of pots) {
      if (!p.amt) continue;
      const best = Math.max(...p.elig.map((i) => val[i]));
      const ws = p.elig.filter((i) => val[i] === best);
      const share = Math.floor(p.amt / ws.length);
      let rem = p.amt - share * ws.length;
      const order = ws.slice().sort((a, b) => ((a - t.button + 64) % t.seats.length) - ((b - t.button + 64) % t.seats.length));
      for (const w of order) { const g = share + (rem > 0 ? 1 : 0); if (rem > 0) rem--; won[w] = (won[w] || 0) + g; }
    }
    const winners = [];
    for (const w in won) { t.seats[w].stack += won[w]; winners.push({ seat: +w, amount: won[w], hand: handName(val[w]) }); }
    t.results = { winners, showdown: true, pot: total, hands: Object.fromEntries(live.map((i) => [i, handName(val[i])])) };
    for (const w of winners) say(t, t.seats[w.seat].name + ' 승리 · ' + w.hand + ' (+' + w.amount + ')');
    for (const s of t.seats) s.bet = 0;
    t.phase = 'done'; t.toAct = -1;
  }

  // ── 포커 AI ──
  function equity(t, i, iters = 220) {
    const me = t.seats[i];
    const live = inHand(t).filter((k) => k !== i);
    if (!live.length) return 1;
    const known = new Set(me.cards.concat(t.board));
    for (const k of live) t.seats[k].cards.forEach((c, j) => { if (t.seats[k].up[j]) known.add(c); });
    for (const s of t.seats) if (s.folded) s.cards.forEach((c, j) => { if (s.up[j]) known.add(c); });
    const pool = newDeck().filter((c) => !known.has(c));
    let win = 0;
    for (let it = 0; it < iters; it++) {
      const p = shuffle(pool.slice(), t.r); let pi = 0;
      let mine, best = -1, myV;
      if (t.game === 'holdem') {
        const board = t.board.slice(); while (board.length < 5) board.push(p[pi++]);
        myV = evalHand(me.cards.concat(board));
        for (const k of live) { const v = evalHand([p[pi++], p[pi++]].concat(board)); if (v > best) best = v; }
      } else {
        mine = me.cards.slice(); while (mine.length < 7) mine.push(p[pi++]);
        myV = evalHand(mine);
        for (const k of live) {
          const s = t.seats[k]; const hand = s.cards.filter((_, j) => s.up[j]);
          while (hand.length < 7) hand.push(p[pi++]);
          const v = evalHand(hand); if (v > best) best = v;
        }
      }
      if (myV > best) win += 1; else if (myV === best) win += 0.5;
    }
    return win / iters;
  }

  function aiAct(t, i) {
    const s = t.seats[i], L = legal(t, i); if (!L) return false;
    const P = PERSONA[s.persona] || PERSONA.calc;
    const r = t.r();
    if (s.drunk > 0) {
      if (r < 0.3 && L.canRaise) return act(t, i, { type: 'raise', to: L.minTo + Math.floor(t.r() * (L.maxTo - L.minTo) * 0.6) });
      if (r < 0.8) return act(t, i, { type: L.canCheck ? 'check' : 'call' });
      return act(t, i, { type: L.canCheck ? 'check' : 'fold' });
    }
    const opp = inHand(t).length - 1;
    let eq = equity(t, i);
    const sc = t.rig.scare;
    if (sc && !L.canCheck && t.lastAct && t.lastAct.seat === sc.seat) eq *= sc.k;
    const rel = eq * (opp + 1);
    const pot = L.pot;
    const sizeTo = (mult) => t.curBet + Math.max(L.minTo - t.curBet, Math.round(pot * mult * (0.8 + t.r() * 0.4)));
    if (L.canCheck) {
      if (L.canRaise && (rel > P.bet || (r < P.bluff && rel > 0.6))) return act(t, i, { type: 'raise', to: sizeTo(P.size) });
      return act(t, i, { type: 'check' });
    }
    const odds = L.toCall / (pot + L.toCall);
    if (L.canRaise && rel > P.raise && t.r() < P.aggr) return act(t, i, { type: 'raise', to: sizeTo(P.size + 0.2) });
    if (eq >= odds * P.callMul - P.loose || (r < P.bluff * 0.5 && L.toCall < pot * 0.5)) return act(t, i, { type: 'call' });
    return act(t, i, { type: 'fold' });
  }

  // 남에게 보여줄 판 상태 (숨은 카드는 -1)
  function viewPoker(t) {
    return {
      kind: 'poker', game: t.game, sb: t.sb, bb: t.bb, ante: t.ante, unit: t.unit, button: t.button, board: t.board.slice(), street: t.street,
      phase: t.phase, toAct: t.toAct, curBet: t.curBet, minRaise: t.minRaise, raises: t.raises, handNo: t.handNo, pot: potTotal(t),
      lastAct: t.lastAct, log: t.log.slice(-8), results: t.results,
      seats: t.seats.map((s) => ({
        id: s.id, name: s.name, kind: s.kind, persona: s.persona, stack: s.stack, bet: s.bet, contrib: s.contrib, folded: s.folded,
        allin: s.allin, chosen: s.chosen, away: s.away, out: s.out, n: s.cards.length, up: s.up.slice(),
        cards: s.cards.map((c, k) => (s.shown || s.up[k]) ? c : -1)
      }))
    };
  }

  // ── 블랙잭 ──
  function bjValue(cards) {
    let total = 0, aces = 0;
    for (const c of cards) { const r = rankOf(c); if (r === 12) { aces++; total += 11; } else total += r >= 8 ? 10 : r + 2; }
    while (total > 21 && aces) { total -= 10; aces--; }
    return { total, soft: aces > 0 };
  }
  const isBJ = (cards) => cards.length === 2 && bjValue(cards).total === 21;
  const hiLo = (c) => { const r = rankOf(c); return r <= 4 ? 1 : r >= 8 ? -1 : 0; };

  function makeBJ(o) {
    const t = {
      kind: 'bj', game: 'blackjack', decks: 6, shoe: [], cut: 0, running: 0, dealer: { cards: [], hide: true },
      seats: o.seats.map((s) => Object.assign({ bet: 0, hands: [], away: false }, s)),
      phase: 'bet', turn: null, minBet: o.minBet || 1, maxBet: o.maxBet || 100, rig: {}, log: [], r: o.r || Math.random, handNo: 0, results: null
    };
    bjShuffle(t); return t;
  }
  function bjShuffle(t) { t.shoe = shuffle(newDeck(t.decks), t.r); t.cut = Math.floor(52 * t.decks * 0.25); t.running = 0; }
  function bjDraw(t, seat, handIdx, visible = true) {
    const F = t.rig.force;
    if (F && seat === F.seat && F.cards.length) {
      const want = F.cards.shift(), k = t.shoe.findIndex((x) => x === want || (want >= 1000 && bjValue([x]).total === want - 1000));
      if (k >= 0) { const c = t.shoe.splice(k, 1)[0]; if (visible) t.running += hiLo(c); return c; }
    }
    let c = t.shoe.shift();
    const L = t.rig.luck;
    if (L && seat === L.seat && t.shoe.length && t.r() < L.p) {
      const h = t.seats[seat].hands[handIdx];
      if (h) {
        const alt = t.shoe[0];
        const sc = (x) => { const v = bjValue(h.cards.concat([x])).total; return v > 21 ? -1 : v; };
        if (sc(alt) > sc(c)) { t.shoe[0] = c; c = alt; }
      }
    }
    if (visible) t.running += hiLo(c);
    return c;
  }
  function bjBet(t, i, amt) {
    if (t.phase !== 'bet') return false;
    const s = t.seats[i]; amt = Math.floor(amt);
    if (!(amt >= t.minBet && amt <= t.maxBet && amt <= s.stack)) return false;
    s.bet = amt; return true;
  }
  function bjDeal(t) {
    const players = t.seats.map((s, i) => i).filter((i) => t.seats[i].bet > 0);
    if (!players.length) return false;
    if (t.shoe.length < t.cut) { bjShuffle(t); t.log.push('새 슈를 섞었다'); }
    t.handNo++; t.results = null; t.log = []; t.dealer = { cards: [], hide: true };
    for (const s of t.seats) s.hands = [];
    for (const i of players) { const s = t.seats[i]; s.stack -= s.bet; s.hands = [{ cards: [], bet: s.bet, done: false, doubled: false, split: false }]; }
    for (let k = 0; k < 2; k++) {
      for (const i of players) t.seats[i].hands[0].cards.push(bjDraw(t, i, 0));
      t.dealer.cards.push(bjDraw(t, -1, 0, k === 0));
    }
    t.phase = 'play';
    for (const i of players) { const h = t.seats[i].hands[0]; if (isBJ(h.cards)) h.done = true; }
    const up = t.dealer.cards[0];
    if ((rankOf(up) === 12 || rankOf(up) >= 8) && isBJ(t.dealer.cards)) {
      t.log.push('딜러 블랙잭'); bjFinish(t, true); return true;
    }
    t.turn = null; bjAdvance(t);
    return true;
  }
  function bjAdvance(t) {
    for (let i = 0; i < t.seats.length; i++) {
      const hs = t.seats[i].hands;
      for (let h = 0; h < hs.length; h++) if (!hs[h].done) { t.turn = { seat: i, hand: h }; return; }
    }
    t.turn = null; bjDealer(t);
  }
  function bjLegal(t, i) {
    if (t.phase !== 'play' || !t.turn || t.turn.seat !== i) return null;
    const s = t.seats[i], h = s.hands[t.turn.hand];
    const two = h.cards.length === 2;
    return {
      hit: true, stand: true,
      double: two && s.stack >= h.bet,
      split: two && s.hands.length === 1 && rankOf(h.cards[0]) === rankOf(h.cards[1]) && s.stack >= h.bet
    };
  }
  function bjAct(t, i, type) {
    const L = bjLegal(t, i); if (!L || !L[type]) return false;
    const s = t.seats[i], hi = t.turn.hand, h = s.hands[hi];
    if (type === 'hit') {
      h.cards.push(bjDraw(t, i, hi));
      const v = bjValue(h.cards).total; if (v >= 21) h.done = true;
    } else if (type === 'stand') h.done = true;
    else if (type === 'double') {
      s.stack -= h.bet; h.bet *= 2; h.doubled = true; h.cards.push(bjDraw(t, i, hi)); h.done = true;
    } else if (type === 'split') {
      s.stack -= h.bet;
      const c2 = h.cards.pop();
      const h2 = { cards: [c2], bet: h.bet, done: false, doubled: false, split: true };
      h.split = true; s.hands.push(h2);
      h.cards.push(bjDraw(t, i, 0)); h2.cards.push(bjDraw(t, i, 1));
      if (rankOf(c2) === 12) { h.done = true; h2.done = true; }
      for (const x of s.hands) if (bjValue(x.cards).total === 21) x.done = true;
    }
    t.log.push(s.name + ' ' + { hit: '히트', stand: '스탠드', double: '더블', split: '스플릿' }[type]);
    bjAdvance(t);
    return true;
  }
  function bjDealer(t) {
    const d = t.dealer; d.hide = false; t.running += hiLo(d.cards[1]);
    const anyLive = t.seats.some((s) => s.hands.some((h) => bjValue(h.cards).total <= 21 && !(isBJ(h.cards) && !h.split)));
    if (anyLive) {
      while (bjValue(d.cards).total < 17) d.cards.push(bjDraw(t, -1, 0));
      if (t.rig.forceExtra && bjValue(d.cards).total <= 21) { d.cards.push(bjDraw(t, -1, 0)); t.log.push('딜러가 떨리는 손으로 한 장 더 뽑았다'); }
    }
    bjFinish(t, false);
  }
  function bjFinish(t, dealerBJ) {
    const d = t.dealer; d.hide = false;
    if (dealerBJ) t.running += hiLo(d.cards[1]);
    const dv = bjValue(d.cards).total, dBJ = isBJ(d.cards);
    const res = [];
    t.seats.forEach((s, i) => {
      if (!s.hands.length) return;
      let net = 0; const parts = [];
      for (const h of s.hands) {
        const v = bjValue(h.cards).total, nat = isBJ(h.cards) && !h.split;
        let pay = 0, tag;
        if (dBJ) { if (nat) { pay = h.bet; tag = '푸시'; } else { pay = 0; tag = '패'; } }
        else if (v > 21) { tag = '버스트'; }
        else if (nat) { pay = h.bet + Math.floor(h.bet * 1.5); tag = '블랙잭'; }
        else if (dv > 21 || v > dv) { pay = h.bet * 2; tag = '승'; }
        else if (v === dv) { pay = h.bet; tag = '푸시'; }
        else tag = '패';
        s.stack += pay; net += pay - h.bet; parts.push(tag);
      }
      res.push({ seat: i, net, tags: parts });
      s.bet = 0;
    });
    t.results = { dealer: dv, dealerBJ: dBJ, res };
    t.phase = 'done'; t.turn = null;
  }
  function viewBJ(t) {
    return {
      kind: 'bj', game: 'blackjack', phase: t.phase, turn: t.turn, minBet: t.minBet, maxBet: t.maxBet, handNo: t.handNo, results: t.results,
      log: t.log.slice(-6), shoeLeft: t.shoe.length,
      dealer: { cards: t.dealer.cards.map((c, k) => (t.dealer.hide && k === 1) ? -1 : c), hide: t.dealer.hide },
      seats: t.seats.map((s) => ({ id: s.id, name: s.name, kind: s.kind, stack: s.stack, bet: s.bet, away: s.away, hands: s.hands.map((h) => ({ cards: h.cards.slice(), bet: h.bet, done: h.done, doubled: h.doubled })) }))
    };
  }
  // 블랙잭 AI: 기본 전략 요약
  function bjAI(t, i) {
    const L = bjLegal(t, i); if (!L) return false;
    const h = t.seats[i].hands[t.turn.hand];
    const { total, soft } = bjValue(h.cards);
    const up = rankOf(t.dealer.cards[0]); const dv = up === 12 ? 11 : up >= 8 ? 10 : up + 2;
    if (L.split) { const r = rankOf(h.cards[0]); if (r === 12 || r === 6) return bjAct(t, i, 'split'); }
    if (L.double && !soft && (total === 11 || (total === 10 && dv < 10))) return bjAct(t, i, 'double');
    if (soft) return bjAct(t, i, total >= 19 || (total === 18 && dv < 9) ? 'stand' : 'hit');
    if (total >= 17) return bjAct(t, i, 'stand');
    if (total >= 13 && dv <= 6) return bjAct(t, i, 'stand');
    if (total === 12 && dv >= 4 && dv <= 6) return bjAct(t, i, 'stand');
    return bjAct(t, i, 'hit');
  }

  return {
    mulberry, shuffle, RK, SU, SUIT_NAME, rankOf, suitOf, cardName, parse, newDeck, evalHand, handName, CAT,
    PERSONA, makePoker, newHand, choose, aiChoose, legal, act, aiAct, equity, potTotal, inHand, viewPoker, draw,
    bjValue, isBJ, makeBJ, bjBet, bjDeal, bjLegal, bjAct, bjAI, viewBJ, bjShuffle, bjAdvance, hiLo
  };
})();
if (typeof module !== 'undefined') module.exports = Cas;
