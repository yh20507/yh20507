/* ===== 벨벳 카지노 · 소리 =====
   소리 파일 없이 브라우저가 그 자리에서 연주한다(Web Audio). 용량이 거의 들지 않는다.
   - 배경음: 할로윈(스산), 바(잔잔한 재즈), 경매장(긴박), 지하(피폐). 13번 테이블은 심장 소리만.
   - 효과음: 다이·체크·콜·레이즈·올인, 승리 빵빠레, 빈털터리(토카타와 푸가 D단조 첫머리), 단서, 상점,
     경매 낙찰, 저주+계약, 지하 적발(비명·끌려감), 리볼버(실린더·딸깍·총소리), 초레어 예고.
   - 음량: 전체·배경음·효과음을 따로. 이 기기에만 저장된다. */
const Snd = (() => {
  const LS = 'velvet-sound-v1';
  const vol = { master: 70, bgm: 45, sfx: 70 };
  try { Object.assign(vol, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) { /* 저장 불가 */ }
  const saveVol = () => { try { localStorage.setItem(LS, JSON.stringify(vol)); } catch (e) { /* 저장 불가 */ } };
  let ctx = null, E = null;
  const rand = (a) => a[Math.floor(Math.random() * a.length)];

  // ───────── 음 이름 → 주파수 ─────────
  const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  const midi = (s) => { const r = /^([A-G][#b]?)(-?\d)$/.exec(s); return 12 * (+r[2] + 1) + PC[r[1]]; };
  const mhz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const hz = (s) => (typeof s === 'number' ? s : mhz(midi(s)));

  // ───────── 기본 부품 ─────────
  function O(c, type, f, t, end) { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end + 0.05); return o; }
  function G(c, v) { const g = c.createGain(); g.gain.value = v == null ? 1 : v; return g; }
  function F(c, type, f, q) { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
  function NZ(E_, t, end) { const s = E_.c.createBufferSource(); s.buffer = E_.nbuf; s.loop = true; s.start(t, Math.random() * 1.8); s.stop(end + 0.05); return s; }
  function chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }
  function out(E_, node, dst, rv, wet) { node.connect(dst); if (rv && wet) { const s = G(E_.c, wet); node.connect(s); s.connect(rv); } }
  // 빠르게 올라갔다가(a초) end 까지 사라지는 소리. hold 가 있으면 그때까지 유지
  function env(g, t, a, peak, end, hold) {
    const p = Math.max(peak, 1e-4);
    g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(p, t + a);
    const h = hold && hold > t + a ? hold : t + a;
    if (h > t + a) g.gain.setValueAtTime(p, h);
    g.gain.exponentialRampToValueAtTime(1e-4, Math.max(end, h + 0.01));
  }
  function curve(k) { const n = 1024, a = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; a[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); } return a; }
  function impulse(c, secs) {
    const len = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    return b;
  }
  function verb(E_, dst, secs) {
    const key = 'i' + secs;
    E_.imp[key] = E_.imp[key] || impulse(E_.c, secs);
    const cv = E_.c.createConvolver(); cv.buffer = E_.imp[key]; cv.connect(dst);
    return cv;
  }
  // 소리 길(진짜 스피커용 / 미리 만들어 보기용 둘 다)
  function makeE(c) {
    const e = { c, imp: {} };
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    e.nbuf = nb;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -9; comp.knee.value = 6; comp.ratio.value = 10; comp.attack.value = 0.002; comp.release.value = 0.25;
    e.master = G(c, 1); e.master.connect(comp); comp.connect(c.destination);
    e.bgm = G(c, 1); e.sfx = G(c, 1); e.bgm.connect(e.master); e.sfx.connect(e.master);
    e.sfxRv = verb(e, e.sfx, 1.6); e.bigRv = verb(e, e.sfx, 3.2);
    return e;
  }

  // ───────── 악기 ─────────
  const I = {
    piano(E_, dst, t, f, d, v, rv, wet = 0.2) {
      const c = E_.c, dec = t + Math.max(d, 0.36), end = dec + 1.2;
      const g = G(c, 0), lp = F(c, 'lowpass', Math.min(8000, f * 5 + 800), 0.4);
      [[1, 1], [2, 0.42], [3, 0.2], [4, 0.1], [6, 0.04]].forEach(([k, a]) => { const o = O(c, 'sine', f * k * (1 + 0.00035 * k * k), t, end), og = G(c, a); o.connect(og); og.connect(g); });
      g.connect(lp); out(E_, lp, dst, rv, wet);
      g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(v * 0.3, t + 0.35);
      g.gain.setTargetAtTime(1e-4, dec, 0.22);
    },
    bell(E_, dst, t, f, d, v, rv, wet = 0.35, parts = [[1, 1], [4, 0.18], [2, 0.1]], dec = 1.4) {
      const c = E_.c;
      parts.forEach(([k, a], i) => {
        const end = t + dec * (i ? 0.6 : 1) * 2.2, o = O(c, 'sine', f * k, t, end), g = G(c, 0);
        o.connect(g); out(E_, g, dst, rv, wet); env(g, t, 0.004, v * a, end);
      });
    },
    pluck(E_, dst, t, f, d, v, rv) {
      const c = E_.c, end = t + Math.max(0.25, d) + 0.3;
      const o = O(c, 'triangle', f, t, end), lp = F(c, 'lowpass', Math.min(4000, f * 4), 0.5), g = G(c, 0);
      chain(o, lp, g); out(E_, g, dst, rv, 0.3); env(g, t, 0.004, v, end);
    },
    bass(E_, dst, t, f, d, v, rv) {
      const c = E_.c, end = t + Math.max(d, 0.3) + 0.1;
      const g = G(c, 0), lp = F(c, 'lowpass', 850, 0.7), o1 = O(c, 'triangle', f, t, end), o2 = O(c, 'sine', f * 2, t, end), g2 = G(c, 0.25);
      o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); out(E_, lp, dst, rv, 0.06);
      g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(v * 0.45, t + 0.16);
      g.gain.exponentialRampToValueAtTime(v * 0.3, end - 0.07); g.gain.exponentialRampToValueAtTime(1e-4, end);
      I.hit(E_, dst, t, { type: 'lowpass', f: 600, dur: 0.03, v: v * 0.25 });
    },
    pad(E_, dst, t, f, d, v, rv, cut = 900, att = 0.8, rel = 1.4) {
      const c = E_.c, end = t + d + rel, g = G(c, 0), lp = F(c, 'lowpass', cut, 0.6);
      [-7, 0, 7].forEach((ct) => { const o = O(c, 'sawtooth', f, t, end); o.detune.value = ct; o.connect(g); });
      g.connect(lp); out(E_, lp, dst, rv, 0.5);
      g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(v / 3, t + att);
      g.gain.setValueAtTime(v / 3, t + Math.max(att, d)); g.gain.exponentialRampToValueAtTime(1e-4, end);
    },
    organ(E_, dst, t, f, d, v, rv) {
      const c = E_.c, end = t + d + 0.3, g = G(c, 0);
      [[0.5, 0.45], [1, 1], [2, 0.55], [3, 0.3], [4, 0.22], [6, 0.1], [8, 0.07]].forEach(([k, a]) => { const o = O(c, 'sine', f * k, t, end), og = G(c, a); o.connect(og); og.connect(g); });
      out(E_, g, dst, rv, 0.6);
      g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(v, t + 0.035);
      g.gain.setValueAtTime(v, t + Math.max(0.04, d)); g.gain.exponentialRampToValueAtTime(1e-4, end);
    },
    brass(E_, dst, t, f, d, v, rv) {
      const c = E_.c, end = t + d + 0.25, g = G(c, 0), lp = F(c, 'lowpass', 600, 1.2);
      [-6, 6].forEach((ct) => { const o = O(c, 'sawtooth', f, t, end); o.detune.value = ct; o.connect(g); });
      g.connect(lp); out(E_, lp, dst, rv, 0.25);
      lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(3200, t + 0.06); lp.frequency.exponentialRampToValueAtTime(1600, t + 0.3);
      env(g, t, 0.03, v, end, t + d);
    },
    str(E_, dst, t, f, d, v, rv) {
      const c = E_.c, end = t + d + 0.08, g = G(c, 0), lp = F(c, 'lowpass', 2200, 0.7);
      [-9, 9].forEach((ct) => { const o = O(c, 'sawtooth', f, t, end); o.detune.value = ct; o.connect(g); });
      g.connect(lp); out(E_, lp, dst, rv, 0.2); env(g, t, 0.01, v, end);
    },
    timp(E_, dst, t, f, v, rv) {
      const c = E_.c, end = t + 1.2, o = O(c, 'sine', f * 1.5, t, end), g = G(c, 0);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.08); o.connect(g); out(E_, g, dst, rv, 0.3); env(g, t, 0.005, v, end);
      I.hit(E_, dst, t, { type: 'lowpass', f: 300, dur: 0.1, v: v * 0.5 });
    },
    hit(E_, dst, t, o) {
      const { type = 'bandpass', f = 4000, q = 0.8, a = 0.002, dur = 0.1, v = 0.1, rv = null, wet = 0 } = o;
      const c = E_.c, end = t + dur, n = NZ(E_, t, end), b = F(c, type, f, q), g = G(c, 0);
      chain(n, b, g); out(E_, g, dst, rv, wet); env(g, t, a, v, end);
    },
    tick(E_, dst, t, v, f = 2200) {
      I.hit(E_, dst, t, { f: f * 1.6, q: 6, a: 0.001, dur: 0.035, v });
      const c = E_.c, o = O(c, 'sine', f, t, t + 0.05), g = G(c, 0); o.connect(g); g.connect(dst); env(g, t, 0.001, v * 0.6, t + 0.04);
    },
    cym(E_, dst, t, v, rv) { I.hit(E_, dst, t, { type: 'highpass', f: 6500, q: 0.7, a: 0.002, dur: 0.28, v, rv, wet: 0.2 }); },
    wind(E_, dst, t, dur, v, rv) {
      const c = E_.c, end = t + dur, n = NZ(E_, t, end), bp = F(c, 'bandpass', 500, 6), g = G(c, 0);
      chain(n, bp, g); out(E_, g, dst, rv, 0.4);
      bp.frequency.setValueAtTime(500, t);
      for (let k = 1.6; k <= dur; k += 1.6) bp.frequency.linearRampToValueAtTime(260 + Math.random() * 700, t + k);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.3); g.gain.linearRampToValueAtTime(v * 0.6, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, end);
    },
    drone(E_, dst, t, dur, f, v, rv) {
      const c = E_.c, end = t + dur, g = G(c, 0), lp = F(c, 'lowpass', 220, 2);
      [[f, -5], [f, 6], [f * Math.SQRT2, 0]].forEach(([fr, ct]) => { const o = O(c, 'sawtooth', fr, t, end); o.detune.value = ct; o.connect(g); });
      g.connect(lp); out(E_, lp, dst, rv, 0.4);
      lp.frequency.setValueAtTime(200, t);
      for (let k = 3; k <= dur; k += 3) lp.frequency.linearRampToValueAtTime(140 + Math.random() * 380, t + k);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 2.5); g.gain.setValueAtTime(v, end - 2.5); g.gain.linearRampToValueAtTime(0, end);
    },
    drip(E_, dst, t, f, v, rv) {
      const c = E_.c, o = O(c, 'sine', f, t, t + 0.2), g = G(c, 0);
      o.frequency.exponentialRampToValueAtTime(f * 1.9, t + 0.06); o.connect(g); out(E_, g, dst, rv, 0.7); env(g, t, 0.003, v, t + 0.15);
    },
    clank(E_, dst, t, v, rv) { I.bell(E_, dst, t, 330, 1, v, rv, 0.8, [[1, 1], [2.37, 0.6], [3.91, 0.4], [5.2, 0.25]], 0.9); },
    // 심장: 쿵-쿵
    lub(E_, dst, t, v) {
      const c = E_.c;
      [[0, 1, 62], [0.24, 0.62, 52]].forEach(([dt, a, f]) => {
        const tt = t + dt, o = O(c, 'triangle', f * 1.4, tt, tt + 0.3), lp = F(c, 'lowpass', 260, 0.7), g = G(c, 0);
        o.frequency.exponentialRampToValueAtTime(f, tt + 0.05); chain(o, lp, g); g.connect(dst); env(g, tt, 0.008, v * a, tt + 0.22);
        I.hit(E_, dst, tt, { type: 'lowpass', f: 140, dur: 0.09, v: v * a * 0.6, a: 0.004 });
      });
    },
    chip(E_, dst, t, v = 0.25) {
      const c = E_.c, f = 2900 + Math.random() * 900;
      [[1, 1], [1.48, 0.5], [2.3, 0.25]].forEach(([k, a]) => { const o = O(c, 'sine', f * k, t, t + 0.06), g = G(c, 0); o.connect(g); out(E_, g, dst, E_.sfxRv, 0.1); env(g, t, 0.001, v * a, t + 0.045); });
      I.hit(E_, dst, t, { f: 5000, q: 1.2, dur: 0.02, a: 0.0008, v: v * 0.6 });
    },
    knock(E_, dst, t, v = 0.4) {
      const c = E_.c, o = O(c, 'sine', 190, t, t + 0.15), g = G(c, 0);
      o.frequency.exponentialRampToValueAtTime(95, t + 0.07); o.connect(g); out(E_, g, dst, E_.sfxRv, 0.15); env(g, t, 0.002, v, t + 0.11);
      I.hit(E_, dst, t, { type: 'lowpass', f: 700, dur: 0.05, v: v * 0.7 });
    },
    wood(E_, dst, t, v = 0.5) {
      const c = E_.c, o = O(c, 'sine', 240, t, t + 0.2), g = G(c, 0);
      o.frequency.exponentialRampToValueAtTime(140, t + 0.09); o.connect(g); out(E_, g, dst, E_.sfxRv, 0.35); env(g, t, 0.001, v, t + 0.16);
      I.hit(E_, dst, t, { f: 1000, q: 2, dur: 0.06, a: 0.0008, v: v * 0.8, rv: E_.sfxRv, wet: 0.3 });
    },
    swish(E_, dst, t, v = 0.15, dur = 0.16) {
      const c = E_.c, end = t + dur, n = NZ(E_, t, end), bp = F(c, 'bandpass', 3500, 0.9), g = G(c, 0);
      chain(n, bp, g); g.connect(dst);
      bp.frequency.setValueAtTime(4200, t); bp.frequency.exponentialRampToValueAtTime(1200, end);
      g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(v, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(1e-4, end);
    },
    boom(E_, dst, t, v = 0.5) {
      const c = E_.c, end = t + 0.9, o = O(c, 'sine', 90, t, end), g = G(c, 0);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.25); o.connect(g); out(E_, g, dst, E_.bigRv, 0.3); env(g, t, 0.004, v, end);
      I.hit(E_, dst, t, { type: 'lowpass', f: 250, dur: 0.3, v: v * 0.6 });
    }
  };

  // ───────── 효과음 ─────────
  const SFX = {
    check(E_, d, t) { I.knock(E_, d, t, 0.45); I.knock(E_, d, t + 0.13, 0.35); },
    call(E_, d, t) { for (let k = 0; k < 3; k++) I.chip(E_, d, t + k * 0.055 + Math.random() * 0.015, 0.22); },
    raise(E_, d, t) { I.swish(E_, d, t, 0.08, 0.22); for (let k = 0; k < 6; k++) I.chip(E_, d, t + 0.12 + k * 0.045 + Math.random() * 0.02, 0.2); },
    allin(E_, d, t) {
      I.swish(E_, d, t, 0.12, 0.35);
      for (let k = 0; k < 16; k++) I.chip(E_, d, t + 0.1 + k * 0.035 + Math.random() * 0.03, 0.16 + Math.random() * 0.08);
      I.boom(E_, d, t + 0.66, 0.45);
    },
    fold(E_, d, t) { I.swish(E_, d, t, 0.32, 0.2); I.swish(E_, d, t + 0.09, 0.18, 0.14); I.knock(E_, d, t + 0.16, 0.12); },
    // 작은 빵빠레
    win(E_, d, t) {
      const rv = E_.sfxRv;
      [['G4', 0], ['C5', 0.09], ['E5', 0.18]].forEach(([n, dt]) => I.brass(E_, d, t + dt, hz(n), 0.07, 0.06, rv));
      ['C5', 'E5', 'G5', 'C6'].forEach((n) => I.brass(E_, d, t + 0.27, hz(n), 0.5, 0.045, rv));
      I.bell(E_, d, t + 0.27, hz('C7'), 0.5, 0.04, rv, 0.4, [[1, 1], [2.76, 0.3]], 0.8);
      I.bell(E_, d, t + 0.34, hz('G7'), 0.5, 0.025, rv, 0.4, [[1, 1]], 0.6);
    },
    // 빈털터리: 바흐 「토카타와 푸가 D단조」(BWV 565) 첫머리. 같은 꾸밈음과 하행을 세 옥타브로 내려 오고,
    // 낮은 D 위에 감7화음이 아래부터 쌓였다가 풀린다.
    broke(E_, d, t) {
      const rv = E_.bigRv;
      const PH = [['A', 0.09], ['G', 0.09], ['A', 1.25, 0.35], ['G', 0.11], ['F', 0.11], ['E', 0.11], ['D', 0.11], ['C#', 0.9], ['D', 1.4, 0.45]];
      let x = t;
      for (const oc of [5, 4, 3]) for (const [nm, du, rest] of PH) { I.organ(E_, d, x, hz(nm + oc), du * 0.95, 0.05, rv); x += du + (rest || 0); }
      I.organ(E_, d, x, hz('D2'), 4.8, 0.06, rv);
      ['C#3', 'E3', 'G3', 'Bb3', 'C#4', 'E4'].forEach((n, i) => I.organ(E_, d, x + i * 0.16, hz(n), 2.4 - i * 0.16, 0.032, rv));
      ['D3', 'F#3', 'A3', 'D4', 'F#4'].forEach((n) => I.organ(E_, d, x + 2.55, hz(n), 2.1, 0.032, rv));
    },
    // 단서: 뭔가 깨달은 듯한 바의 재즈 화음 변주
    clue(E_, d, t) {
      const rv = E_.sfxRv, vib = [[1, 1], [4, 0.15], [10, 0.04]];
      ['F4', 'A4', 'C5', 'E5', 'G5', 'A5'].forEach((n, i) => I.bell(E_, d, t + i * 0.085, hz(n), 0.4, 0.08, rv, 0.45, vib, 1.1));
      I.bell(E_, d, t + 0.62, hz('C6'), 1, 0.07, rv, 0.6, [[1, 1], [2.76, 0.25], [5.4, 0.1]], 1.6);
      I.bell(E_, d, t + 0.66, hz('E6'), 1, 0.045, rv, 0.6, [[1, 1]], 1.4);
    },
    // 상점: 금전등록기
    buy(E_, d, t) {
      const rv = E_.sfxRv, p = [[1, 1], [2.4, 0.4], [3.9, 0.2]];
      I.bell(E_, d, t, 2093, 0.2, 0.09, rv, 0.2, p, 0.5); I.bell(E_, d, t + 0.09, 2637, 0.2, 0.09, rv, 0.2, p, 0.6);
      I.hit(E_, d, t + 0.16, { type: 'lowpass', f: 500, dur: 0.22, v: 0.12, a: 0.02 });
      for (let k = 0; k < 6; k++) I.chip(E_, d, t + 0.2 + Math.random() * 0.25, 0.1);
    },
    gavel(E_, d, t) { I.wood(E_, d, t, 0.45); I.wood(E_, d, t + 0.28, 0.6); },
    bid(E_, d, t) { I.tick(E_, d, t, 0.1, 1500); },
    seal(E_, d, t) {
      const c = E_.c, o = O(c, 'sine', 120, t, t + 0.3), g = G(c, 0);
      o.frequency.exponentialRampToValueAtTime(70, t + 0.15); o.connect(g); out(E_, g, d, E_.sfxRv, 0.3); env(g, t, 0.003, 0.22, t + 0.25);
      I.hit(E_, d, t, { type: 'lowpass', f: 400, dur: 0.08, v: 0.12 });
    },
    // 저주 물건: 낮게 깔리는 불협화음과 속삭임, 끝에 작게 "계약 완료" 도장
    curse(E_, d, t) {
      const c = E_.c, rv = E_.bigRv, end = t + 2.4, g = G(c, 0), lp = F(c, 'lowpass', 150, 4);
      ['D2', 'Eb2', 'Ab2'].forEach((n) => { const o = O(c, 'sawtooth', hz(n), t, end); o.detune.value = (Math.random() - 0.5) * 20; o.connect(g); });
      g.connect(lp); out(E_, lp, d, rv, 0.5);
      lp.frequency.setValueAtTime(150, t); lp.frequency.exponentialRampToValueAtTime(1400, t + 1.1); lp.frequency.exponentialRampToValueAtTime(200, end);
      g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.9); g.gain.exponentialRampToValueAtTime(1e-4, end);
      const n = NZ(E_, t + 0.2, t + 1.7), bp = F(c, 'bandpass', 2600, 3), wg = G(c, 0);
      chain(n, bp, wg); out(E_, wg, d, rv, 0.6);
      wg.gain.setValueAtTime(0, t + 0.2);
      for (let k = 1; k < 12; k++) wg.gain.linearRampToValueAtTime(Math.random() * 0.045, t + 0.2 + k * 0.12);
      wg.gain.linearRampToValueAtTime(0, t + 1.7);
      SFX.seal(E_, d, t + 1.9);
    },
    // 악마의 계약서 서명: 펜 긁는 소리 + 저주
    contract(E_, d, t) {
      for (let k = 0; k < 7; k++) I.hit(E_, d, t + k * 0.07 + Math.random() * 0.02, { type: 'highpass', f: 3500, dur: 0.05, v: 0.05 });
      SFX.curse(E_, d, t + 0.55);
    },
    // 지하 적발: 비명 → 끌려가는 소리 → 문 쾅
    caught(E_, d, t) {
      const c = E_.c, end = t + 1.5, o = O(c, 'sawtooth', 650, t, end);
      o.frequency.linearRampToValueAtTime(1150, t + 0.18); o.frequency.linearRampToValueAtTime(1050, t + 0.8); o.frequency.exponentialRampToValueAtTime(380, t + 1.4);
      const lfo = O(c, 'sine', 7, t, end), lg = G(c, 30); lfo.connect(lg); lg.connect(o.frequency);
      const mix = G(c, 0), sh = c.createWaveShaper(), og = G(c, 0.32); sh.curve = curve(6);
      [[900, 6, 1], [2300, 8, 0.7], [3200, 9, 0.4]].forEach(([f, q, a]) => { const b = F(c, 'bandpass', f, q), bg = G(c, a); o.connect(b); b.connect(bg); bg.connect(mix); });
      const nz = NZ(E_, t, end), nb = F(c, 'bandpass', 2200, 1.5), ng = G(c, 0.25); chain(nz, nb, ng); ng.connect(mix);
      chain(mix, sh, og); out(E_, og, d, E_.bigRv, 0.35);
      mix.gain.setValueAtTime(1e-4, t); mix.gain.exponentialRampToValueAtTime(0.9, t + 0.06); mix.gain.setValueAtTime(0.9, t + 0.9); mix.gain.exponentialRampToValueAtTime(1e-4, t + 1.45);
      // 끌려가는 소리: 바닥 긁힘과 발소리가 멀어진다
      const t2 = t + 1.2, dur = 2.1, e2 = t2 + dur, n2 = NZ(E_, t2, e2), lp = F(c, 'lowpass', 900, 0.8), g2 = G(c, 0);
      chain(n2, lp, g2); g2.connect(d);
      g2.gain.setValueAtTime(0, t2);
      for (let k = 0.09; k < dur; k += 0.09) g2.gain.linearRampToValueAtTime((0.03 + Math.random() * 0.12) * (1 - k / dur * 0.6), t2 + k);
      g2.gain.linearRampToValueAtTime(0, e2);
      lp.frequency.setValueAtTime(900, t2); lp.frequency.linearRampToValueAtTime(300, e2);
      for (let k = 0; k < 5; k++) I.knock(E_, d, t2 + 0.2 + k * 0.38 + Math.random() * 0.05, 0.22 * (1 - k * 0.12));
      // 문이 닫힌다
      I.boom(E_, d, e2 + 0.15, 0.5);
      I.hit(E_, d, e2 + 0.15, { type: 'lowpass', f: 1200, dur: 0.25, v: 0.3, rv: E_.bigRv, wet: 0.6 });
    },
    // 리볼버
    spin(E_, d, t) {
      let x = t;
      for (let k = 0; k < 24; k++) { x += 0.025 + 0.09 * Math.pow(k / 23, 2) + (k < 4 ? 0.04 * (4 - k) / 4 : 0); I.hit(E_, d, x, { f: 4200, q: 5, dur: 0.014, a: 0.0005, v: 0.5 }); I.hit(E_, d, x, { type: 'lowpass', f: 900, dur: 0.02, a: 0.0005, v: 0.18 }); }
    },
    click(E_, d, t) {
      const c = E_.c;
      I.hit(E_, d, t, { type: 'highpass', f: 5000, dur: 0.008, a: 0.0005, v: 0.5 });
      const o = O(c, 'sine', 2400, t, t + 0.05), g = G(c, 0); o.connect(g); out(E_, g, d, E_.sfxRv, 0.2); env(g, t, 0.0005, 0.25, t + 0.03);
      I.hit(E_, d, t + 0.055, { f: 3200, q: 12, dur: 0.04, a: 0.0005, v: 0.25 });
      const o2 = O(c, 'sine', 1700, t + 0.055, t + 0.1), g2 = G(c, 0); o2.connect(g2); g2.connect(d); env(g2, t + 0.055, 0.0005, 0.15, t + 0.08);
    },
    gun(E_, d, t) {
      const c = E_.c, rv = E_.bigRv;
      I.hit(E_, d, t, { type: 'highpass', f: 1500, q: 0.5, a: 0.0005, dur: 0.03, v: 0.9, rv, wet: 0.6 });
      const n = NZ(E_, t, t + 0.5), lp = F(c, 'lowpass', 7000, 0.5), g = G(c, 0), sh = c.createWaveShaper(), og = G(c, 0.6);
      sh.curve = curve(20); chain(n, lp, g, sh, og); out(E_, og, d, rv, 0.7);
      lp.frequency.setValueAtTime(7000, t); lp.frequency.exponentialRampToValueAtTime(600, t + 0.35);
      g.gain.setValueAtTime(1e-4, t); g.gain.exponentialRampToValueAtTime(1, t + 0.002); g.gain.exponentialRampToValueAtTime(1e-4, t + 0.45);
      const o = O(c, 'sine', 110, t, t + 0.5), bg = G(c, 0); o.frequency.exponentialRampToValueAtTime(38, t + 0.3); o.connect(bg); bg.connect(d); env(bg, t, 0.002, 0.8, t + 0.4);
    },
    // 초레어 예고: 심장 세 번
    omen(E_, d, t) { for (let k = 0; k < 3; k++) I.lub(E_, d, t + k * 0.78, 0.7); },
    tick(E_, d, t) { I.tick(E_, d, t, 0.12); }
  };

  // ───────── 배경음 ─────────
  // bar(E, 출력, 시작 시각, 마디 번호, 몇 바퀴째) 를 마디마다 부른다.
  const HCH = { Dm: ['D2', 'D3', 'F3', 'A3'], Bb: ['Bb1', 'Bb2', 'D3', 'F3'], A: ['A1', 'A2', 'C#3', 'E3'], Gm: ['G1', 'G2', 'Bb2', 'D3'], C: ['C2', 'C3', 'E3', 'G3'], F: ['F1', 'F2', 'A2', 'C3'] };
  const H_CH = ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'C', 'A', 'F', 'Dm', 'C', 'Dm', 'Gm', 'Gm', 'A', 'Dm'];
  const H_MEL = [
    [[0, 'D5', 2], [2, 'F5', 1]], [[0, 'A5', 2], [2, 'G5', 1]], [[0, 'F5', 1], [1, 'E5', 1], [2, 'D5', 1]], [[0, 'C#5', 3]],
    [[0, 'D5', 2], [2, 'F5', 1]], [[0, 'Bb5', 2], [2, 'A5', 1]], [[0, 'G5', 1], [1, 'F5', 1], [2, 'E5', 1]], [[0, 'A5', 3]],
    [[0, 'A5', 2], [2, 'Bb5', 1]], [[0, 'A5', 1], [1, 'G5', 1], [2, 'F5', 1]], [[0, 'G5', 2], [2, 'A5', 1]], [[0, 'F5', 1], [1, 'E5', 1], [2, 'D5', 1]],
    [[0, 'E5', 2], [2, 'F5', 1]], [[0, 'D5', 1], [1, 'C#5', 1], [2, 'Bb4', 1]], [[0, 'C#5', 2], [2, 'E5', 1]], [[0, 'D5', 3]]
  ];
  const CELESTA = [[1, 1], [4, 0.18], [2, 0.08]];
  const CHURCH = [[0.5, 0.5], [1, 1], [1.19, 0.45], [1.5, 0.35], [2, 0.3], [2.52, 0.2], [3, 0.12]];
  // 바 재즈 (F장조, 스윙): Gm7 C7 Fmaj7 D7 Gm7 C7 Am7-D7 Gm7-C7
  const JZ = [
    [['G2', 'm', ['Bb3', 'D4', 'F4', 'A4'], 4]], [['C3', 'M', ['Bb3', 'E4', 'A4', 'D5'], 4]], [['F2', 'M', ['A3', 'C4', 'E4', 'G4'], 4]], [['D3', 'M', ['C4', 'F#4', 'B4', 'E5'], 4]],
    [['G2', 'm', ['Bb3', 'D4', 'F4', 'A4'], 4]], [['C3', 'M', ['Bb3', 'E4', 'A4', 'D5'], 4]],
    [['A2', 'm', ['C4', 'E4', 'G4', 'B4'], 2], ['D3', 'M', ['C4', 'F#4', 'B4', 'E5'], 2]],
    [['G2', 'm', ['Bb3', 'D4', 'F4', 'A4'], 2], ['C3', 'M', ['Bb3', 'E4', 'A4', 'D5'], 2]]
  ];
  const F_SCALE = ['F5', 'G5', 'A5', 'Bb5', 'C6', 'D6', 'E5', 'D5', 'C5'];
  const VIBES = [[1, 1], [4, 0.15], [10, 0.04]];
  const AU = [['A3', 'C4', 'E4', 'A1'], ['A3', 'C4', 'E4', 'A1'], ['F3', 'A3', 'C4', 'F1'], ['F3', 'A3', 'C4', 'F1'], ['D3', 'F3', 'A3', 'D2'], ['D3', 'F3', 'A3', 'D2'], ['E3', 'G#3', 'B3', 'E2'], ['E3', 'G#3', 'B3', 'E2']];
  const T = {
    halloween: { bpm: 84, beats: 3, bars: 24, verb: 3.0, bar(E_, bus, t, i) {
      const bt = 60 / 84, rv = bus.rv;
      if (i % 8 === 0) I.wind(E_, bus, t, bt * 24 + 1, 0.05, rv);
      if (i === 0 || i === 16) I.bell(E_, bus, t, hz('D2'), 4, 0.1, rv, 0.6, CHURCH, 2.6);
      if (i < 16) {
        const ch = HCH[H_CH[i]];
        ch.slice(1).forEach((n) => I.pad(E_, bus, t, hz(n), bt * 3, 0.022, rv, 700));
        I.pluck(E_, bus, t, hz(ch[0]), bt, 0.09, rv);
        for (const b of [1, 2]) ch.slice(1).forEach((n) => I.pluck(E_, bus, t + b * bt, hz(n), bt * 0.6, 0.022, rv));
        for (const [b, n, l] of H_MEL[i]) I.bell(E_, bus, t + b * bt, hz(n), l * bt, 0.1, rv, 0.45, CELESTA, 1.3 + l * 0.2);
      } else {
        const ch = HCH[i < 20 ? 'Dm' : i < 22 ? 'Bb' : 'A'];
        if (i % 2 === 0) ch.slice(1).forEach((n) => I.pad(E_, bus, t, hz(n), bt * 6, 0.022, rv, 600, 1.5, 2));
        if (Math.random() < 0.35) I.bell(E_, bus, t + Math.floor(Math.random() * 3) * bt, hz(rand(['D6', 'F6', 'A5', 'C6', 'E6'])), bt, 0.045, rv, 0.7, CELESTA, 2);
      }
    } },
    bar: { bpm: 96, beats: 4, bars: 8, verb: 1.6, bar(E_, bus, t, i) {
      const bt = 60 / 96, rv = bus.rv, P = (b) => t + (Math.floor(b) + (b % 1 ? 2 / 3 : 0)) * bt;
      const segs = JZ[i], nextRoot = midi(JZ[(i + 1) % 8][0][0]);
      let s = 0;
      segs.forEach(([root, q, voicing, n], k) => {
        const r = midi(root), nr = k + 1 < segs.length ? midi(segs[k + 1][0]) : nextRoot;
        const third = r + (q === 'm' ? 3 : 4), tones = [third, r + 7, r + 10, r + 12];
        const app = (x) => { let a = nr + (Math.random() < 0.5 ? 1 : -1); while (a - x > 7) a -= 12; while (x - a > 7) a += 12; return a; };
        const line = n === 4 ? [r, rand(tones), rand(tones)] : [r];
        line.push(app(line[line.length - 1]));
        line.forEach((m, j) => I.bass(E_, bus, t + (s + j) * bt, mhz(Math.max(36, Math.min(57, m))), bt * 0.9, 0.2, rv));
        const pats = n === 4 ? [[1.5, 3], [0, 2.5], [1, 2.5, 3.5], [0.5, 2]] : [[0.5], [1], [0, 1.5]];
        for (const b of rand(pats)) voicing.forEach((nm) => I.piano(E_, bus, P(s + b), hz(nm), bt * 0.5, 0.032 + Math.random() * 0.012, rv, 0.25));
        s += n;
      });
      for (let b = 0; b < 4; b++) I.cym(E_, bus, P(b), 0.02, rv);
      for (const b of [1.5, 3.5]) I.cym(E_, bus, P(b), 0.014, rv);
      for (const b of [0, 2]) I.swish(E_, bus, P(b), 0.02, 0.32);
      for (const b of [1, 3]) I.hit(E_, bus, P(b), { f: 5500, q: 0.8, dur: 0.07, v: 0.03 });
      if (i % 4 === 0 && Math.random() < 0.65) {
        let b = 0.5;
        const cnt = 4 + Math.floor(Math.random() * 4);
        for (let k = 0; k < cnt && b < 4; k++) { const last = k === cnt - 1; I.bell(E_, bus, P(b), hz(rand(F_SCALE)), last ? bt * 1.5 : bt * 0.4, 0.05, rv, 0.4, VIBES, last ? 1.4 : 0.8); b += rand([0.5, 0.5, 1]); }
      }
    } },
    auction: { bpm: 138, beats: 4, bars: 8, verb: 1.8, bar(E_, bus, t, i) {
      const bt = 60 / 138, rv = bus.rv, ch = AU[i];
      [0, 0, 1, 0, 2, 0, 1, 0].forEach((k, j) => I.str(E_, bus, t + j * bt / 2, hz(ch[k]), bt * 0.4, 0.06, rv));
      for (let b = 0; b < 4; b++) I.tick(E_, bus, t + b * bt, 0.04, b % 2 ? 1500 : 1900);
      I.timp(E_, bus, t, hz(ch[3]) * 2, 0.2, rv); I.timp(E_, bus, t + 2 * bt, hz(ch[3]) * 2, 0.14, rv);
      if (i >= 4) ch.slice(0, 3).forEach((n) => I.pad(E_, bus, t, hz(n) * 2, bt * 4, 0.012 * (i - 2), rv, 1800, 0.3, 0.6));
      if (i >= 6) for (const b of [0, 2.5]) ['E4', 'G#4', 'B4'].forEach((n) => I.brass(E_, bus, t + b * bt, hz(n), bt * 0.35, 0.035, rv));
    } },
    under: { bpm: 56, beats: 4, bars: 8, verb: 3.4, bar(E_, bus, t, i) {
      const bt = 60 / 56, rv = bus.rv;
      if (i === 0) I.drone(E_, bus, t, bt * 32 + 2.5, hz('C2'), 0.035, rv);
      I.timp(E_, bus, t, 45, 0.07, rv);
      const nd = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < nd; k++) I.drip(E_, bus, t + Math.random() * bt * 4, 1100 + Math.random() * 1500, 0.035, rv);
      if (Math.random() < 0.4) { const n = rand(['C5', 'Gb4', 'B4', 'Db5']), t2 = t + Math.random() * bt * 3; I.piano(E_, bus, t2, hz(n) * 0.985, 1.5, 0.03, rv, 0.6); I.piano(E_, bus, t2 + 0.02, hz(n) * 1.06 * 0.985, 1.5, 0.018, rv, 0.6); }
      if ((i === 3 || i === 7) && Math.random() < 0.6) I.clank(E_, bus, t + Math.random() * bt * 3, 0.04, rv);
    } }
  };

  // ───────── 재생 ─────────
  const M = { name: null, bus: null, nextT: 0, bar: 0, loop: 0, duckUntil: 0 };
  const HT = { bpm: 0, nextT: 0, owner: '' };
  const HEART_V = 0.55;
  function applyVol() {
    if (!E) return;
    const q = (x) => Math.pow(Math.max(0, Math.min(100, x)) / 100, 2);
    const now = ctx.currentTime;
    E.master.gain.setTargetAtTime(q(vol.master), now, 0.05);
    E.bgm.gain.setTargetAtTime(q(vol.bgm) * 0.9, now, 0.05);
    E.sfx.gain.setTargetAtTime(q(vol.sfx), now, 0.05);
  }
  function setMusic(name) {
    if (!ctx || M.name === name) return;
    const now = ctx.currentTime;
    if (M.bus) { const g = M.bus; g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + 1.2); setTimeout(() => { try { g.disconnect(); } catch (e) { /* 이미 끊김 */ } }, 2600); }
    M.name = name; M.bus = null;
    if (!name || !T[name]) return;
    const bus = G(ctx, 0); bus.connect(E.bgm); bus.rv = verb(E, bus, T[name].verb || 2.2);
    bus.gain.setValueAtTime(0, now); bus.gain.linearRampToValueAtTime(now < M.duckUntil ? 0.15 : 1, now + 1.5);
    M.bus = bus; M.nextT = now + 0.1; M.bar = 0; M.loop = 0;
  }
  function duck(sec) {
    if (!ctx) return;
    const now = ctx.currentTime; M.duckUntil = now + sec;
    if (M.bus) { const g = M.bus.gain; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0.15, now + 0.4); g.setValueAtTime(0.15, now + sec); g.linearRampToValueAtTime(1, now + sec + 2); }
  }
  function tick() {
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (M.bus && M.name) {
      const tr = T[M.name], bd = tr.beats * 60 / tr.bpm;
      if (M.nextT < now) M.nextT = now + 0.05;
      while (M.nextT < now + 1.5) { try { tr.bar(E, M.bus, M.nextT, M.bar, M.loop); } catch (e) { /* 한 마디 건너뜀 */ } M.nextT += bd; if (++M.bar >= tr.bars) { M.bar = 0; M.loop++; } }
    }
    if (HT.bpm) {
      if (HT.nextT < now) HT.nextT = now + 0.05;
      while (HT.nextT < now + 0.4) { I.lub(E, E.sfx, HT.nextT, HEART_V); HT.nextT += 60 / HT.bpm; }
    }
  }
  // 화면에 맞는 배경음 고르기
  function base() { return window.HW && HW.isOn() ? 'halloween' : null; }
  function route() {
    if (!ctx) return;
    const plus = document.getElementById('scrPlus'), tab = document.getElementById('scrTable'), app = document.getElementById('app');
    let want = base(), key = '';
    if (app && !app.hidden) {
      if (plus && !plus.hidden) {
        key = plus.dataset.key || '';
        if (key === 'bar-screen') want = 'bar';
        else if (key === 'au-screen') want = 'auction';
        else if (key === 'ug-screen') want = 'under';
        else if (key === 't13-screen') want = null;
      } else if (tab && !tab.hidden && tab.classList.contains('under')) want = 'under';
    }
    setMusic(want);
    if (key === 't13-screen') { if (HT.owner !== 't13') { HT.owner = 't13'; heart(62); } }
    else if (HT.owner === 't13') { HT.owner = ''; heart(0); }
  }
  function heart(bpm) { HT.bpm = bpm || 0; if (ctx && HT.bpm && HT.nextT < ctx.currentTime) HT.nextT = ctx.currentTime + 0.05; }
  let lastWin = 0;
  function play(name) {
    if (!ctx || !E || !SFX[name] || ctx.state !== 'running') return;
    if (name === 'win') { const n = Date.now(); if (n - lastWin < 1500) return; lastWin = n; }
    if (name === 'broke') duck(19);
    try { SFX[name](E, E.sfx, ctx.currentTime + 0.02); } catch (e) { /* 소리 없이 */ }
  }
  // 베팅 말로 소리 고르기 (포커·섯다·인디언 공통)
  function act(text) {
    const s = String(text || '');
    if (s.startsWith('다이')) return play('fold');
    if (s.startsWith('체크')) return play('check');
    if (s.includes('올인')) return play('allin');
    if (s.startsWith('콜')) return play('call');
    return play('raise');
  }
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    E = makeE(ctx); applyVol();
    setInterval(tick, 120); setInterval(route, 400);
    route();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, init, { passive: true }));

  // 승리 빵빠레, 빈털터리 토카타
  let wasBroke = false;
  if (window.Plus) {
    const baseSettle = Plus.settle;
    Plus.settle = (o) => {
      const r = baseSettle(o), w = App.W.data;
      if (!w) return r;
      const all = w.chips + w.vault + (w.table ? w.table.stack : 0);
      if (all <= 0 && !wasBroke) play('broke');
      else if (o.net > 0) play('win');
      wasBroke = all <= 0;
      return r;
    };
  }

  // ───────── 음량 조절 ─────────
  const ICON = (on) => '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/>' + (on ? '<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>' : '<path d="M17 9l5 6M22 9l-5 6"/>') + '</svg>';
  function ui() {
    const bar = document.querySelector('.topbar');
    if (!bar || document.getElementById('wSnd')) return;
    const h = App.h;
    const btn = h('button', { class: 'btn small snd-btn', id: 'wSnd', type: 'button', 'aria-label': '소리 설정', 'aria-expanded': 'false', title: '소리 설정' });
    const pop = h('div', { class: 'snd-pop', id: 'sndPop', role: 'dialog', 'aria-label': '소리 설정', hidden: true });
    const setIcon = () => { btn.innerHTML = ICON(vol.master > 0); };
    const row = (key, label) => {
      const val = h('b', { class: 'num', text: String(vol[key]) });
      const r = h('input', { type: 'range', min: '0', max: '100', step: '5', value: String(vol[key]), 'aria-label': label + ' 음량' });
      r.oninput = () => { vol[key] = Number(r.value); val.textContent = r.value; applyVol(); setIcon(); saveVol(); };
      r.onchange = () => { init(); if (key !== 'bgm') play('call'); };
      return h('label', { class: 'snd-row' }, h('span', { text: label }), r, val);
    };
    pop.append(h('b', { class: 'snd-title', text: '소리' }), row('master', '전체'), row('bgm', '배경음'), row('sfx', '효과음'),
      h('p', { class: 'note', text: '이 기기에만 저장돼요.' }));
    btn.onclick = (e) => {
      e.stopPropagation(); init();
      pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', String(!pop.hidden));
      if (!pop.hidden) {
        const r = btn.getBoundingClientRect(), pw = pop.offsetWidth || 280;
        pop.style.top = (r.bottom + 8) + 'px';
        pop.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.right - pw)) + 'px';
        const f = pop.querySelector('input'); if (f) f.focus();
      }
    };
    document.addEventListener('click', (e) => { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
    setIcon();
    const save = document.getElementById('wSave');
    if (save) save.after(btn); else bar.append(btn);
    document.body.append(pop);
  }
  ui();

  // ───────── 시험용: 소리를 미리 만들어 본다 (스피커로 나가지 않음) ─────────
  async function render(kind, name, secs = 6) {
    const sr = 44100, oc = new OfflineAudioContext(2, Math.ceil(sr * secs), sr), e = makeE(oc);
    if (kind === 'sfx') SFX[name](e, e.sfx, 0.05);
    else if (kind === 'heart') { for (let x = 0.05; x < secs; x += 60 / name) I.lub(e, e.sfx, x, HEART_V); }
    else {
      const tr = T[name], bus = G(oc, 1); bus.connect(e.bgm); bus.rv = verb(e, bus, tr.verb || 2.2);
      e.bgm.gain.value = 0.9;
      let x = 0.05, i = 0, loop = 0;
      while (x < secs) { tr.bar(e, bus, x, i, loop); x += tr.beats * 60 / tr.bpm; if (++i >= tr.bars) { i = 0; loop++; } }
    }
    return oc.startRendering();
  }

  return { play, act, heart, init, route, vol, applyVol, render, SFX, T, get ctx() { return ctx; }, get music() { return M.name; }, get heartBpm() { return HT.bpm; } };
})();
window.Snd = Snd;
