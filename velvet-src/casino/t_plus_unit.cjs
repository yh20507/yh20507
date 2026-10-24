// 브라우저 없이 확장 모듈 일부 검사: 최소한의 App/DOM 흉내
global.window = global; global.document = { body: { append() {}, contains() { return true; }, classList: { add() {}, remove() {} } }, querySelector: () => null };
const C = require('./engine.js');
const wallet = { chips: 1000, vault: 0, sus: 0, items: {}, perm: {}, stats: { hands: 0, best: 100 }, fx: {}, day: '2026-10-22' };
const stub = () => ({ append() {}, remove() {}, classList: { add() {} }, style: {} });
global.App = { h: stub, $: () => null, fmt: (n) => String(Math.round(n)), W: { data: wallet }, save() {}, renderTop() {}, toast(m) { console.log('  toast:', m); }, dayKey: (t) => '2026-10-22', banned: () => false, caught() {}, C, ROSTER: [['A', 'rock'], ['B', 'calc'], ['C', 'bluffer'], ['D', 'station']], LINES: { calc: { fold: ['x'], check: ['x'], call: ['x'], raise: ['x'] } }, ITEMS: {}, icon: () => '', dialog() {}, closeDialog() {}, show() {}, renderLobby() {} };
const fs = require('fs'); const vm = require('vm');
for (const f of ['plus_core.js', 'plus_games.js', 'plus_special.js']) vm.runInThisContext(fs.readFileSync(f, 'utf8').replace(/^const Plus =/m, 'global.Plus ='), { filename: f });
const P = global.Plus;
P.norm(wallet);
console.log('titles', P.TITLES.length, 'unique ids', new Set(P.TITLES.map((t) => t[0])).size, 'hidden', P.TITLES.filter((t) => t[3]).length);
for (const t of P.TITLES) if (!P.EFF[t[6]]) console.log('BAD EFF', t[0]);
// 섯다 족보
const E = P.seotda.eval, card = (m, sp) => (m - 1) * 2 + (sp ? 0 : 1);
const show = (a, b) => E(a, b).name + '(' + E(a, b).r + ')';
console.log(show(card(3, 1), card(8, 1)), show(card(1, 1), card(8, 1)), show(card(10, 1), card(10, 0)), show(card(1, 0), card(2, 1)), show(card(5, 1), card(8, 0)), show(card(2, 1), card(8, 0)), show(card(3, 0), card(7, 1)), show(card(4, 1), card(7, 1)), show(card(4, 1), card(9, 0)), show(card(4, 1), card(9, 1)));
const R = P.seotda.resolve;
const H = (a, b) => E(a, b);
console.log('jabi vs 9ttaeng ->', R({ 0: H(card(3, 0), card(7, 1)), 1: H(card(9, 1), card(9, 0)) }).winners);
console.log('jabi vs jangttaeng ->', R({ 0: H(card(3, 0), card(7, 1)), 1: H(card(10, 1), card(10, 0)) }).winners);
console.log('am vs 18gwang ->', R({ 0: H(card(4, 1), card(7, 1)), 1: H(card(1, 1), card(8, 1)) }).winners);
console.log('am vs 38gwang ->', R({ 0: H(card(4, 1), card(7, 1)), 1: H(card(3, 1), card(8, 1)) }).winners);
console.log('gusa vs ali ->', R({ 0: H(card(4, 0), card(9, 0)), 1: H(card(1, 1), card(2, 1)) }).rematch);
console.log('gusa vs 1ttaeng ->', R({ 0: H(card(4, 0), card(9, 0)), 1: H(card(1, 1), card(1, 0)) }).rematch);
console.log('mgusa vs 9ttaeng ->', R({ 0: H(card(4, 1), card(9, 1)), 1: H(card(9, 1), card(9, 0)) }).rematch);
// 룰렛
const pay = P.roulette.payout;
console.log('roulette n17 on 17:', pay({ n17: 10 }, 17), 'red on 1:', pay({ red: 10 }, 1), 'red on 0:', pay({ red: 10 }, 0), 'd2 on 13', pay({ d2: 10 }, 13), 'c1 on 34', pay({ c1: 10 }, 34));
// 정산
wallet.chips = 1000;
console.log('settle win 100 ->', P.settle({ game: 'x', net: 100, staked: 50 }), wallet.chips);
wallet.items.monkey = 0;
console.log('monkey loss 50 ->', P.settle({ game: 'x', net: -50, staked: 50, legend: 'monkey' }), wallet.chips);
console.log('dice win 30 ->', P.settle({ game: 'x', net: 30, staked: 30, legend: 'dice' }), wallet.chips);
P.check();
console.log('owned titles', Object.keys(wallet.titles));
// 경매 물건 생성
P.auction && console.log('auction cat', Object.keys(P.auction.CAT).length);
// 바 대본
for (const m of ['안녕하세요', '13번 테이블 알아요?', '오늘 운이 좋을까', 'asdf']) console.log(m, '->', P.bar.scripted(m));
