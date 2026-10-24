/* ===== 초능력 체스 엔진 =====
   0x88 보드. 백 양수, 흑 음수. 1 폰 2 나이트 3 비숍 4 룩 5 퀸 6 킹.
   칸 번호 = 랭크(0~7) * 16 + 파일(0~7). a1 = 0, h8 = 119. */
const Engine = (() => {
  const PV = [0, 100, 320, 330, 500, 900, 0];
  const KN = [33, 31, 18, 14, -33, -31, -18, -14];
  const KG = [1, -1, 16, -16, 17, 15, -17, -15];
  const DI = [17, 15, -17, -15];
  const OR = [1, -1, 16, -16];
  const ECAP = 5;
  const FEN_CH = { 1: 'P', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K' };
  const CH_FEN = { p: 1, n: 2, b: 3, r: 4, q: 5, k: 6 };

  // 말 위치 점수표 (백 기준, a8부터 h1 순서로 적힘)
  const PST_SRC = {
    1: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5,
        0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    2: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30,
        -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    3: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10,
        -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    4: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5,
        -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    5: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5,
        0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    6: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30,
        -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
    7: [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30,
        -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50]
  };
  // 0x88 칸 번호로 바로 찾을 수 있게 변환 (백용, 흑은 랭크 뒤집기)
  const PST = {};
  for (const k in PST_SRC) {
    PST[k] = new Int16Array(128);
    for (let i = 0; i < 64; i++) {
      const rank = 7 - (i >> 3), file = i & 7;
      PST[k][rank * 16 + file] = PST_SRC[k][i];
    }
  }
  const flip = (sq) => ((7 - (sq >> 4)) << 4) | (sq & 7);

  const sqName = (sq) => 'abcdefgh'[sq & 7] + ((sq >> 4) + 1);
  const sqFrom = (s) => {
    if (typeof s !== 'string' || !/^[a-h][1-8]$/.test(s)) return -1;
    return (s.charCodeAt(1) - 49) * 16 + (s.charCodeAt(0) - 97);
  };
  const onBoard = (sq) => (sq & 0x88) === 0;

  class Game {
    constructor() { this.reset(); }

    reset() {
      this.b = new Int8Array(128);
      const back = [4, 2, 3, 5, 6, 3, 2, 4];
      for (let f = 0; f < 8; f++) {
        this.b[f] = back[f]; this.b[16 + f] = 1;
        this.b[96 + f] = -1; this.b[112 + f] = -back[f];
      }
      this.side = 1; this.castle = 15; this.ep = -1;
      this.en = [1, 1];            // [백, 흑] 에너지
      this.half = 0;
      this.fx = [];                // 지속 효과(대가): {t, side, sq, pv, to, n}
      this.findKings();
      this.stack = [];
    }

    // ── 지속 효과 ──
    // t: freeze(못 움직임) / revert(원래 말로 돌아감) / vanish(사라짐) / exhaust(에너지 안 참)
    // pv: 효과가 걸린 말. 그 칸의 말이 바뀌면 효과도 사라진다.
    frozenAt(sq, side) {
      for (const e of this.fx) if (e.t === 'freeze' && e.side === side && e.sq === sq && this.b[sq] === e.pv) return true;
      return false;
    }
    exhausted(side) { return this.fx.some((e) => e.t === 'exhaust' && e.side === side); }

    // 두는 쪽의 차례가 시작될 때: 효과 시간을 줄이고, 끝난 효과를 처리한다
    startTurn() {
      const side = this.side, out = [], keep = [];
      const NAME = { 1: '폰', 2: '나이트', 3: '비숍', 4: '룩', 5: '퀸', 6: '킹' };
      for (const e of this.fx) {
        if (e.side !== side) { keep.push(e); continue; }
        if (e.t !== 'exhaust' && this.b[e.sq] !== e.pv) continue;      // 그 말이 없어졌으면 효과도 끝
        if (e.n > 0) { e.n--; keep.push(e); continue; }
        const at = e.t === 'exhaust' ? '' : sqName(e.sq) + ' ' + NAME[Math.abs(e.pv)];
        if (e.t === 'freeze') out.push(at + '의 속박이 풀렸다.');
        else if (e.t === 'exhaust') out.push('에너지가 다시 차오르기 시작한다.');
        else if (e.t === 'vanish') { this.b[e.sq] = 0; out.push(at + '이(가) 힘을 다해 사라졌다.'); }
        else if (e.t === 'revert') {
          const r = e.sq >> 4;
          if (e.to === 1 && (r === 0 || r === 7)) out.push(at + '은(는) 끝줄에 있어 원래대로 돌아가지 못했다.');
          else { this.b[e.sq] = e.to * side; out.push(at + '의 변신이 풀려 ' + NAME[e.to] + '(으)로 돌아왔다.'); }
        }
      }
      this.fx = keep;
      this.findKings(); this.fixCastle();
      return out;
    }

    findKings() {
      this.wk = -1; this.bk = -1;
      for (let s = 0; s < 120; s++) {
        if (!onBoard(s)) continue;
        if (this.b[s] === 6) this.wk = s; else if (this.b[s] === -6) this.bk = s;
      }
    }

    clone() {
      const g = Object.create(Game.prototype);
      g.b = new Int8Array(this.b); g.side = this.side; g.castle = this.castle; g.ep = this.ep;
      g.en = this.en.slice(); g.half = this.half; g.wk = this.wk; g.bk = this.bk; g.stack = [];
      g.fx = this.fx.map((e) => Object.assign({}, e));
      return g;
    }

    toJSON() {
      return { b: Array.from(this.b), side: this.side, castle: this.castle, ep: this.ep, en: this.en.slice(), half: this.half,
        fx: this.fx.map((e) => Object.assign({}, e)) };
    }
    static fromJSON(o) {
      const g = new Game();
      g.b = Int8Array.from(o.b); g.side = o.side; g.castle = o.castle; g.ep = o.ep; g.en = o.en.slice(); g.half = o.half || 0;
      g.fx = (o.fx || []).map((e) => Object.assign({}, e));
      g.findKings(); return g;
    }

    loadFEN(fen) {
      const [pos, side, cas, ep] = fen.split(' ');
      this.b = new Int8Array(128);
      let r = 7, f = 0;
      for (const c of pos) {
        if (c === '/') { r--; f = 0; continue; }
        if (c >= '1' && c <= '8') { f += +c; continue; }
        const v = CH_FEN[c.toLowerCase()];
        this.b[r * 16 + f] = c === c.toUpperCase() ? v : -v; f++;
      }
      this.side = side === 'w' ? 1 : -1;
      this.castle = (cas.includes('K') ? 1 : 0) | (cas.includes('Q') ? 2 : 0) | (cas.includes('k') ? 4 : 0) | (cas.includes('q') ? 8 : 0);
      this.ep = ep && ep !== '-' ? sqFrom(ep) : -1;
      this.findKings(); this.stack = [];
    }

    // by 쪽(1 백, -1 흑)이 sq를 공격하는지 (평범한 체스 규칙 기준)
    attacked(sq, by) {
      const b = this.b;
      if (by === 1) {
        if (onBoard(sq - 15) && b[sq - 15] === 1) return true;
        if (onBoard(sq - 17) && b[sq - 17] === 1) return true;
      } else {
        if (onBoard(sq + 15) && b[sq + 15] === -1) return true;
        if (onBoard(sq + 17) && b[sq + 17] === -1) return true;
      }
      for (const d of KN) { const t = sq + d; if (onBoard(t) && b[t] === 2 * by) return true; }
      for (const d of KG) { const t = sq + d; if (onBoard(t) && b[t] === 6 * by) return true; }
      for (const d of DI) {
        let t = sq + d;
        while (onBoard(t)) { const p = b[t]; if (p) { if (p === 3 * by || p === 5 * by) return true; break; } t += d; }
      }
      for (const d of OR) {
        let t = sq + d;
        while (onBoard(t)) { const p = b[t]; if (p) { if (p === 4 * by || p === 5 * by) return true; break; } t += d; }
      }
      return false;
    }

    inCheck(side = this.side) {
      const k = side === 1 ? this.wk : this.bk;
      return k >= 0 && this.attacked(k, -side);
    }

    // 수: {f, t, p(프로모션 말 종류), fl: 1 앙파상, 2 캐슬링, 4 두 칸 전진}
    pseudo(capsOnly = false) {
      const b = this.b, us = this.side, out = [];
      const push = (f, t, fl = 0, p = 0) => out.push({ f, t, fl, p });
      const prRank = us === 1 ? 7 : 0, stRank = us === 1 ? 1 : 6, fw = us === 1 ? 16 : -16;
      for (let f = 0; f < 120; f++) {
        if (!onBoard(f)) { f += 7; continue; }
        const pc = b[f] * us;
        if (pc <= 0) continue;
        if (this.fx.length && this.frozenAt(f, us)) continue;   // 속박된 말은 못 움직인다
        if (pc === 1) {
          const t = f + fw;
          if (onBoard(t) && !b[t] && !capsOnly) {
            if ((t >> 4) === prRank) { for (const p of [5, 4, 3, 2]) push(f, t, 0, p); }
            else {
              push(f, t);
              const t2 = t + fw;
              if ((f >> 4) === stRank && onBoard(t2) && !b[t2]) push(f, t2, 4);
            }
          } else if (onBoard(t) && !b[t] && capsOnly && (t >> 4) === prRank) push(f, t, 0, 5);
          for (const d of [fw + 1, fw - 1]) {
            const c = f + d;
            if (!onBoard(c)) continue;
            if (b[c] * us < 0 && Math.abs(b[c]) !== 6) {
              if ((c >> 4) === prRank) { for (const p of (capsOnly ? [5] : [5, 4, 3, 2])) push(f, c, 0, p); }
              else push(f, c);
            } else if (c === this.ep && !b[c]) push(f, c, 1);
          }
        } else if (pc === 2 || pc === 6) {
          for (const d of (pc === 2 ? KN : KG)) {
            const t = f + d;
            if (!onBoard(t)) continue;
            const q = b[t] * us;
            if (q > 0 || Math.abs(b[t]) === 6) continue;
            if (capsOnly && !q) continue;
            push(f, t);
          }
          if (pc === 6 && !capsOnly) this.castles(f, push);
        } else {
          const dirs = pc === 3 ? DI : pc === 4 ? OR : KG;
          for (const d of dirs) {
            let t = f + d;
            while (onBoard(t)) {
              const q = b[t] * us;
              if (q > 0) break;
              if (q < 0) { if (Math.abs(b[t]) !== 6) push(f, t); break; }
              if (!capsOnly) push(f, t);
              t += d;
            }
          }
        }
      }
      return out;
    }

    castles(f, push) {
      const b = this.b, us = this.side;
      const home = us === 1 ? 4 : 116;
      if (f !== home || this.attacked(f, -us)) return;
      const ks = us === 1 ? 1 : 4, qs = us === 1 ? 2 : 8;
      const fr = (s) => this.fx.length && this.frozenAt(s, us);
      if ((this.castle & ks) && !fr(f + 3) && b[f + 3] === 4 * us && !b[f + 1] && !b[f + 2] &&
          !this.attacked(f + 1, -us) && !this.attacked(f + 2, -us)) push(f, f + 2, 2);
      if ((this.castle & qs) && !fr(f - 4) && b[f - 4] === 4 * us && !b[f - 1] && !b[f - 2] && !b[f - 3] &&
          !this.attacked(f - 1, -us) && !this.attacked(f - 2, -us)) push(f, f - 2, 2);
    }

    set(sq, v) {
      this.log.push(sq, this.b[sq]);
      this.b[sq] = v;
      if (v === 6) this.wk = sq; else if (v === -6) this.bk = sq;
    }

    begin() {
      if (!this.log) this.log = [];
      this.stack.push([this.log.length, this.side, this.castle, this.ep, this.en[0], this.en[1], this.half, this.wk, this.bk]);
    }

    undo() {
      const fr = this.stack.pop();
      while (this.log.length > fr[0]) {
        const old = this.log.pop(), sq = this.log.pop();
        this.b[sq] = old;
      }
      [, this.side, this.castle, this.ep, this.en[0], this.en[1], this.half, this.wk, this.bk] = fr;
    }

    fixCastle() {
      const b = this.b;
      if (b[4] !== 6) this.castle &= ~3;
      if (b[7] !== 4) this.castle &= ~1;
      if (b[0] !== 4) this.castle &= ~2;
      if (b[116] !== -6) this.castle &= ~12;
      if (b[119] !== -4) this.castle &= ~4;
      if (b[112] !== -4) this.castle &= ~8;
    }

    // 평범한 수 두기. 두고 나서 자기 킹이 공격받으면 되돌리고 false
    make(m) {
      this.begin();
      const b = this.b, us = this.side, pc = b[m.f];
      const cap = b[m.t];
      this.set(m.t, m.p ? m.p * us : pc);
      this.set(m.f, 0);
      if (m.fl & 1) this.set(m.t - (us === 1 ? 16 : -16), 0);
      if (m.fl & 2) {
        if (m.t > m.f) { this.set(m.f + 1, b[m.f + 3]); this.set(m.f + 3, 0); }
        else { this.set(m.f - 1, b[m.f - 4]); this.set(m.f - 4, 0); }
      }
      this.ep = (m.fl & 4) ? (m.f + m.t) >> 1 : -1;
      this.half = (Math.abs(pc) === 1 || cap) ? 0 : this.half + 1;
      this.fixCastle();
      const i = us === 1 ? 0 : 1;
      if (!(this.fx.length && this.exhausted(us))) this.en[i] = Math.min(ECAP, this.en[i] + 1);
      this.side = -us;
      if (this.inCheck(us)) { this.undo(); return false; }
      return true;
    }

    legal() {
      const out = [];
      for (const m of this.pseudo()) { if (this.make(m)) { this.undo(); out.push(m); } }
      return out;
    }

    // ── 평가: 백 기준 점수를 두는 쪽 기준으로 돌려준다 ──
    evaluate() {
      const b = this.b;
      let s = 0, nonPawn = 0;
      for (let q = 0; q < 120; q++) {
        if (!onBoard(q)) { q += 7; continue; }
        const p = b[q]; if (!p) continue;
        const a = Math.abs(p);
        if (a !== 1 && a !== 6) nonPawn += PV[a];
      }
      const endgame = nonPawn <= 1600;
      for (let q = 0; q < 120; q++) {
        if (!onBoard(q)) { q += 7; continue; }
        const p = b[q]; if (!p) continue;
        const a = Math.abs(p);
        const tbl = PST[a === 6 && endgame ? 7 : a];
        if (p > 0) s += PV[a] + tbl[q];
        else s -= PV[a] + tbl[flip(q)];
      }
      s += (this.en[0] - this.en[1]) * 12;
      return s * this.side;
    }

    // ── 탐색 ──
    search(opts = {}) {
      const timeMs = opts.timeMs || 800, maxDepth = opts.maxDepth || 6, noise = opts.noise || 0;
      const MATE = 100000, t0 = Date.now();
      let nodes = 0, stop = false;
      const killers = [];
      const order = (ms, ply, pv) => {
        for (const m of ms) {
          const v = this.b[m.t];
          m.s = 0;
          if (pv && m.f === pv.f && m.t === pv.t && m.p === pv.p) m.s = 1e6;
          else if (v || (m.fl & 1)) m.s = 1e5 + PV[Math.abs(v) || 1] * 10 - PV[Math.abs(this.b[m.f])];
          else if (m.p) m.s = 9e4;
          else if (killers[ply] && killers[ply].some(k => k.f === m.f && k.t === m.t)) m.s = 8e4;
        }
        ms.sort((a, c) => c.s - a.s);
      };
      const tick = () => { if ((++nodes & 1023) === 0 && Date.now() - t0 > timeMs) stop = true; };
      const quies = (alpha, beta, depth) => {
        tick(); if (stop) return 0;
        const stand = this.evaluate();
        if (stand >= beta) return beta;
        if (stand > alpha) alpha = stand;
        if (depth > 6) return alpha;
        const ms = this.pseudo(true); order(ms, 99, null);
        for (const m of ms) {
          if (!this.make(m)) continue;
          const sc = -quies(-beta, -alpha, depth + 1);
          this.undo();
          if (stop) return 0;
          if (sc >= beta) return beta;
          if (sc > alpha) alpha = sc;
        }
        return alpha;
      };
      const neg = (depth, alpha, beta, ply) => {
        tick(); if (stop) return 0;
        const check = this.inCheck();
        if (check) depth++;
        if (depth <= 0) return quies(alpha, beta, 0);
        const ms = this.pseudo(); order(ms, ply, null);
        let any = false;
        for (const m of ms) {
          if (!this.make(m)) continue;
          any = true;
          const sc = -neg(depth - 1, -beta, -alpha, ply + 1);
          this.undo();
          if (stop) return 0;
          if (sc >= beta) {
            if (!this.b[m.t]) { (killers[ply] = killers[ply] || []).unshift(m); killers[ply].length = 2; }
            return beta;
          }
          if (sc > alpha) alpha = sc;
        }
        if (!any) return check ? -MATE + ply : 0;
        return alpha;
      };
      const root = this.legal();
      if (!root.length) return null;
      let best = root[0], bestScore = -Infinity, pv = null;
      for (let d = 1; d <= maxDepth; d++) {
        order(root, 0, pv);
        let alpha = -Infinity, iterBest = null, iterScore = -Infinity;
        for (const m of root) {
          this.make(m);
          let sc = -neg(d - 1, -Infinity, -alpha, 1);
          this.undo();
          if (stop) break;
          if (noise) sc += (Math.random() * 2 - 1) * noise;
          if (sc > iterScore) { iterScore = sc; iterBest = m; }
          if (sc > alpha) alpha = sc;
        }
        if (stop && !iterBest) break;
        if (iterBest) { best = iterBest; bestScore = iterScore; pv = iterBest; }
        if (stop || Math.abs(bestScore) > MATE - 100) break;
      }
      return { move: best, score: bestScore, nodes };
    }

    // ── 초능력: 판 변화 검사와 적용 ──
    // changes: [{sq:"e4", to:"N"|"n"|null}], who: 1 백 / -1 흑
    checkAbility(changes, who, cost, risks) {
      const NAME = { 1: '폰', 2: '나이트', 3: '비숍', 4: '룩', 5: '퀸', 6: '킹' };
      if (!Array.isArray(changes) || !changes.length) return { ok: false, reason: '판에 아무 변화가 없어요.' };
      if (changes.length > 8) return { ok: false, reason: '한 번에 바뀌는 칸이 너무 많아요.' };
      cost = Math.round(Number(cost));
      if (!(cost >= 1 && cost <= 3)) return { ok: false, reason: '비용이 1~3 범위를 벗어났어요.' };
      const i = who === 1 ? 0 : 1;
      if (cost > this.en[i]) return { ok: false, reason: `에너지가 부족해요. (필요 ${cost}, 남은 ${this.en[i]})` };
      const g = this.clone(); g.log = []; g.stack = [];
      const seen = new Set();
      let enemyLost = 0;
      for (const c of changes) {
        const sq = sqFrom(String(c.sq || '').toLowerCase());
        if (sq < 0) return { ok: false, reason: `칸 이름이 이상해요: ${c.sq}` };
        if (seen.has(sq)) return { ok: false, reason: `같은 칸이 두 번 바뀌어요: ${c.sq}` };
        seen.add(sq);
        let v = 0;
        if (c.to) {
          const ch = String(c.to).trim()[0];
          const k = CH_FEN[(ch || '').toLowerCase()];
          if (!k) return { ok: false, reason: `알 수 없는 말이에요: ${c.to}` };
          v = ch === ch.toUpperCase() ? k : -k;
        }
        const old = g.b[sq];
        if (old === -6 * who || v === -6 * who) return { ok: false, reason: '상대 킹은 능력으로 건드릴 수 없어요.' };
        if (old * who < 0 && v !== old) enemyLost++;
        g.b[sq] = v;
      }
      if (enemyLost > 2) return { ok: false, reason: '상대 말은 한 번에 두 개까지만 없애거나 바꿀 수 있어요.' };
      // 폰 위치: 끝 랭크 도착은 퀸, 자기 진영 끝은 불가
      for (let r = 0; r < 8; r += 7) for (let f = 0; f < 8; f++) {
        const sq = r * 16 + f, p = g.b[sq];
        if (Math.abs(p) !== 1) continue;
        if ((p === 1 && r === 7) || (p === -1 && r === 0)) g.b[sq] = 5 * p;
        else return { ok: false, reason: '폰은 자기 쪽 맨 끝 줄에 놓을 수 없어요.' };
      }
      let wk = 0, bk = 0;
      for (let s = 0; s < 120; s++) { if (!onBoard(s)) continue; if (g.b[s] === 6) wk++; if (g.b[s] === -6) bk++; }
      if (wk !== 1 || bk !== 1) return { ok: false, reason: '킹은 양쪽에 하나씩 있어야 해요.' };
      g.findKings();
      if (g.inCheck(who)) return { ok: false, reason: '이 능력을 쓰면 내 킹이 공격받는 상태가 돼요.' };
      // 바뀐 칸에 걸려 있던 효과는 없앤다
      g.fx = g.fx.filter((e) => e.t === 'exhaust' || !seen.has(e.sq));
      // 대가(리스크): 선언한 쪽에게만, 최대 3개
      const added = [];
      if (risks != null && !Array.isArray(risks)) return { ok: false, reason: '대가 형식이 이상해요.' };
      if (risks && risks.length > 3) return { ok: false, reason: '대가는 최대 세 개까지예요.' };
      for (const r of risks || []) {
        const t = String(r.type || r.t || '').toLowerCase();
        if (!['freeze', 'revert', 'vanish', 'exhaust'].includes(t)) return { ok: false, reason: `알 수 없는 대가예요: ${t}` };
        const n = Math.round(Number(r.turns));
        if (!(n >= 1 && n <= 4)) return { ok: false, reason: '대가의 턴 수는 1~4 사이여야 해요.' };
        if (t === 'exhaust') { added.push({ t, side: who, n }); continue; }
        const sq = sqFrom(String(r.sq || '').toLowerCase());
        if (sq < 0 || g.b[sq] * who <= 0) return { ok: false, reason: '대가는 내 말에게만 걸 수 있어요.' };
        const a = Math.abs(g.b[sq]);
        if (a === 6 && t !== 'freeze') return { ok: false, reason: '킹은 사라지거나 변할 수 없어요.' };
        const e = { t, side: who, sq, pv: g.b[sq], n };
        if (t === 'revert') {
          const k = CH_FEN[String(r.to || '').trim().toLowerCase()[0]];
          if (!k || k === 6) return { ok: false, reason: '되돌아갈 말 종류가 이상해요.' };
          if (k === a) return { ok: false, reason: '이미 그 말이라 되돌아갈 게 없어요.' };
          e.to = k;
        }
        added.push(e);
      }
      // 내 다음 차례부터 n번의 차례 동안 걸리고, 그다음 차례가 시작될 때 끝난다
      for (const e of added) g.fx.push(e);
      g.fixCastle();
      g.ep = -1; g.half = 0;
      g.en[i] -= cost;
      g.side = -who;
      return { ok: true, game: g, cost, risks: added };
    }

    // 킹 말고 남은 말 수
    army(side) {
      let n = 0;
      for (let s = 0; s < 120; s++) { if (!onBoard(s)) continue; const p = this.b[s] * side; if (p > 0 && p !== 6) n++; }
      return n;
    }

    // 지속 효과를 사람이 읽을 글로 (심판에게 보낼 용도)
    fxText() {
      if (!this.fx.length) return '없음';
      const NAME = { 1: '폰', 2: '나이트', 3: '비숍', 4: '룩', 5: '퀸', 6: '킹' };
      const TN = { freeze: '움직일 수 없음', revert: '변신이 풀림', vanish: '사라짐', exhaust: '에너지가 차지 않음' };
      return this.fx.map((e) => {
        const who = e.side === 1 ? '백' : '흑';
        const head = e.t === 'exhaust' ? who : `${who} ${sqName(e.sq)} ${NAME[Math.abs(e.pv)]}`;
        return `${head}: ${TN[e.t]}${e.t === 'revert' ? '(→' + NAME[e.to] + ')' : ''} · ${this.fxLeft(e)}`;
      }).join('\n');
    }

    // 효과가 얼마나 남았는지 (그 효과가 걸린 쪽의 차례 기준)
    fxLeft(e) {
      const left = e.n + (e.side === this.side ? 1 : 0);
      const lasting = e.t === 'freeze' || e.t === 'exhaust';
      if (lasting) return left > 0 ? `앞으로 ${left}턴` : '다음 차례에 풀림';
      return left > 0 ? `${left}턴 더 버팀` : '다음 차례 시작에 발동';
    }

    // 평범한 수가 하나도 없는지
    noMoves() { return this.legal().length === 0; }

    onlyKings() {
      for (let s = 0; s < 120; s++) { if (!onBoard(s)) continue; const a = Math.abs(this.b[s]); if (a && a !== 6) return false; }
      return true;
    }

    key() { return Array.from(this.b).join(',') + this.side + '|' + this.castle + '|' + this.ep; }

    // 사람이 읽을 판 그림 (심판에게 보낼 용도)
    diagram() {
      const rows = [];
      for (let r = 7; r >= 0; r--) {
        let line = (r + 1) + ' |';
        for (let f = 0; f < 8; f++) {
          const p = this.b[r * 16 + f];
          line += ' ' + (p ? (p > 0 ? FEN_CH[p] : FEN_CH[-p].toLowerCase()) : '.');
        }
        rows.push(line);
      }
      rows.push('    a b c d e f g h');
      const list = { 1: [], '-1': [] };
      for (let r = 7; r >= 0; r--) for (let f = 0; f < 8; f++) {
        const p = this.b[r * 16 + f]; if (!p) continue;
        list[p > 0 ? 1 : -1].push(FEN_CH[Math.abs(p)] + sqName(r * 16 + f));
      }
      return rows.join('\n') + '\n백(대문자): ' + list[1].join(' ') + '\n흑(소문자): ' + list[-1].join(' ');
    }

    // 표기: 피스 기호 + 출발→도착
    san(m) {
      const pc = Math.abs(this.b[m.f]);
      if (m.fl & 2) return m.t > m.f ? 'O-O' : 'O-O-O';
      const cap = this.b[m.t] || (m.fl & 1);
      const L = { 1: '', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K' };
      let s = L[pc] + sqName(m.f) + (cap ? 'x' : '-') + sqName(m.t);
      if (m.p) s += '=' + L[m.p];
      return s;
    }
  }

  // 수 개수 세기 (규칙 검증용)
  function perft(g, d) {
    if (d === 0) return 1;
    let n = 0;
    for (const m of g.pseudo()) { if (g.make(m)) { n += perft(g, d - 1); g.undo(); } }
    return n;
  }

  return { Game, perft, sqName, sqFrom, ECAP, PV };
})();
if (typeof module !== 'undefined') module.exports = Engine;
