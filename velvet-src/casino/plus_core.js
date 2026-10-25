/* ===== 벨벳 카지노 · 확장 (공통) =====
   칭호 100개, 기록, 정산(전설 아이템·칭호 효과), 아침 처리, 로비 입구들, 내 방.
   다른 확장 파일(plus_games.js, plus_special.js)은 이 Plus 객체에 화면을 붙인다. */
const Plus = (() => {
  const A = App;
  const { h, $ } = A;
  const fmt = (n) => A.fmt(n);
  const W = () => A.W.data;
  const DAY = 864e5;

  // ───────── 지갑 확장 ─────────
  function norm(w) {
    w.st = Object.assign({}, w.st);
    w.titles = Object.assign({}, w.titles);
    if (!w.eq || !TITLE_BY[w.eq] || !w.titles[w.eq]) w.eq = null;
    w.clues = Array.isArray(w.clues) ? w.clues.slice() : [];
    w.inv = Object.assign({}, w.inv);
    w.act = Object.assign({}, w.act);
    w.t13 = Object.assign({ ban: '', day: '', rolls: 0 }, w.t13);
    w.auc = Object.assign({ day: '', res: {} }, w.auc);
    w.fx2 = Object.assign({ luck: 0, scare: 0, calm: 0 }, w.fx2);
    w.room = Object.assign({ rest: '' }, w.room);
    w.ug = Object.assign({ ban: '', floor: '' }, w.ug);
    w.slot = Object.assign({ pool: 500 }, w.slot);
    w.wheel = Object.assign({ day: '' }, w.wheel);
    return w;
  }
  const st = () => W().st;
  function inc(k, n = 1) { const s = st(); s[k] = (s[k] || 0) + n; return s[k]; }
  function setMax(k, v) { const s = st(); if (!(s[k] >= v)) s[k] = v; }
  const has = (k) => { const w = W(), i = w.inv, a = w.act, now = Date.now();
    if (k === 'coin' || k === 'fan') return a[k] > now;
    if (k === 'contract') return !!(a.contract && a.contract.until > now);
    return !!i[k];
  };

  // 칩 빼기: 지갑 먼저, 모자라면 금고에서
  function take(n) {
    const w = W(); n = Math.max(0, Math.floor(n));
    const a = Math.min(w.chips, n); w.chips -= a;
    const b = Math.min(w.vault, n - a); w.vault -= b;
    return a + b;
  }
  function give(n) { W().chips += Math.max(0, Math.floor(n)); }

  // 의심 올리기 (칭호·뇌물 표시 반영). 100을 넘으면 쫓겨난다.
  function susGain(n) {
    if (!n) return 0;
    const w = W();
    let k = eff('susDown') || 1;
    if (w.act.bribeMark > Date.now()) k *= 1.5;
    return Math.max(1, Math.round(n * k));
  }
  function addSus(n, why) {
    const w = W();
    w.sus = Math.min(100, w.sus + window.Plus.susGain(n));
    A.save();
    if (w.sus >= 100) { stopAll(); A.caught(why || '의심이 한계를 넘었어요.'); return false; }
    return true;
  }

  // 지하에서 걸린 날은 의심이 50 아래로 내려가지 않는다
  function clampSus() { const w = W(); if (w && w.ug && w.ug.floor === A.dayKey() && w.sus < 50) w.sus = 50; }

  // ───────── 칭호 ─────────
  // [아이디, 이름, 난이도(1~4), 숨김, 조건 설명, 검사, 효과 종류, 효과 값]
  const REWARD = [0, 100, 300, 500, 1000];
  const EFF = {
    morning: (v) => '매일 아침 +' + v + '칩',
    win: (v) => '이긴 판 +' + Math.round(v * 100) + '%',
    loss: (v) => '진 판 ' + Math.round(v * 100) + '% 돌려받기',
    fold: (v) => '다이하면 건 칩 ' + Math.round(v * 100) + '% 돌려받기',
    luck: (v) => '카드 운 +' + Math.round(v * 100) + '%',
    susDown: (v) => '의심 ' + Math.round((1 - v) * 100) + '% 덜 오름',
    bj: (v) => '블랙잭 내추럴 보너스 +' + Math.round(v * 100) + '%',
    roul: (v) => '룰렛 숫자 하나 배당 +' + v,
    shop: (v) => '상점 ' + Math.round(v * 100) + '% 할인',
    auc: (v) => '경매 경쟁자 ' + Math.round(v * 100) + '% 약해짐',
    vault: (v) => '금고 이자 하루 +' + (v * 100).toFixed(1) + '%',
    bar: (v) => '바 대화 +' + v + '마디',
    t13: (v) => '13번 테이블 확률 +' + (v * 100).toFixed(1) + '%p',
    chess: (v) => '체스 이기면 +' + Math.round(v * 100) + '%'
  };
  const total = (w) => w.chips + w.vault;
  const TITLES = [
    ['newbie', '새내기 손님', 1, 0, '처음 입장하기', (s) => s.visits >= 1, 'morning', 5],
    ['face7', '익숙한 얼굴', 1, 0, '7일 들르기', (s) => s.days >= 7, 'morning', 10],
    ['face30', '단골손님', 2, 0, '30일 들르기', (s) => s.days >= 30, 'morning', 20],
    ['face100', '벨벳의 가구', 4, 0, '100일 들르기', (s) => s.days >= 100, 'morning', 50],
    ['streak7', '개근상', 2, 0, '7일 연속 들르기', (s) => s.streak >= 7, 'morning', 15],
    ['k1', '천 칩의 사나이', 1, 0, '칩과 금고 합계 1,000 달성', (s, w) => total(w) >= 1000, 'win', 0.01],
    ['k10', '만 칩 클럽', 2, 0, '칩과 금고 합계 10,000 달성', (s, w) => total(w) >= 10000, 'win', 0.02],
    ['k100', '벨벳의 큰손', 3, 0, '칩과 금고 합계 100,000 달성', (s, w) => total(w) >= 100000, 'win', 0.03],
    ['k1000', '백만장자', 4, 0, '칩과 금고 합계 1,000,000 달성', (s, w) => total(w) >= 1000000, 'win', 0.05],
    ['broke', '빈털터리', 1, 0, '칩과 금고가 모두 바닥나기', (s) => s.broke >= 1, 'loss', 0.02],
    ['broke3', '칠전팔기', 2, 1, '빈털터리가 세 번 되기', (s) => s.broke >= 3, 'loss', 0.03],
    ['vault1', '금고지기', 1, 0, '금고에 1,000칩 맡기기', (s, w) => w.vault >= 1000, 'vault', 0.005],
    ['vault10', '철통 금고', 2, 0, '금고에 10,000칩 맡기기', (s, w) => w.vault >= 10000, 'vault', 0.01],
    ['hand100', '백 판의 경험', 1, 0, '모든 게임 합쳐 100판', (s) => s.hands >= 100, 'luck', 0.02],
    ['hand1000', '천 판의 경험', 3, 0, '모든 게임 합쳐 1,000판', (s) => s.hands >= 1000, 'luck', 0.04],
    ['pk1', '첫 승리', 1, 0, '포커에서 처음 이기기', (s) => s.pkWin >= 1, 'win', 0.01],
    ['pk50', '포커 페이스', 2, 0, '포커 50승', (s) => s.pkWin >= 50, 'fold', 0.03],
    ['royal', '왕관을 쓴 자', 4, 0, '로열 스트레이트 플러시', (s) => s.royal >= 1, 'luck', 0.05],
    ['sflush', '일직선', 3, 0, '스트레이트 플러시', (s) => s.sflush >= 1, 'luck', 0.04],
    ['quads', '네 개의 그림자', 2, 0, '포카드', (s) => s.quads >= 1, 'luck', 0.03],
    ['fh10', '꽉 찬 집', 2, 0, '풀하우스 10번', (s) => s.fh >= 10, 'luck', 0.02],
    ['allin', '올인의 맛', 2, 0, '올인해서 이기기', (s) => s.allinWin >= 1, 'win', 0.02],
    ['bigpot', '큰 판', 2, 0, '팟 1,000칩 이상 판 이기기', (s) => s.bigPot >= 1, 'win', 0.02],
    ['fold100', '접는 것도 실력', 1, 0, '포커에서 100번 다이', (s) => s.pkFold >= 100, 'fold', 0.04],
    ['bluff20', '허세의 달인', 2, 1, '패를 안 까고 20번 이기기', (s) => s.noShow >= 20, 'fold', 0.02],
    ['seven30', '세븐 마스터', 2, 0, '세븐 포커 30승', (s) => s.svWin >= 30, 'luck', 0.02],
    ['holdem30', '홀덤 장인', 2, 0, '홀덤 30승', (s) => s.hdWin >= 30, 'luck', 0.02],
    ['bj5', '21의 주인', 2, 0, '블랙잭 5연승', (s) => s.bjBest >= 5, 'bj', 0.1],
    ['natural', '내추럴', 1, 0, '블랙잭 내추럴 21', (s) => s.bjNat >= 1, 'bj', 0.05],
    ['natural50', '블랙잭 수집가', 3, 0, '블랙잭 내추럴 50번', (s) => s.bjNat >= 50, 'bj', 0.15],
    ['double10', '더블 찬스', 2, 0, '더블로 10번 이기기', (s) => s.bjDbl >= 10, 'win', 0.02],
    ['split10', '갈라서기', 1, 0, '스플릿 10번', (s) => s.bjSplit >= 10, 'luck', 0.02],
    ['bust30', '버스트', 1, 0, '버스트 30번', (s) => s.bjBust >= 30, 'loss', 0.02],
    ['bj10', '열 판 무패', 4, 0, '블랙잭 10연승', (s) => s.bjBest >= 10, 'bj', 0.2],
    ['counter', '카드 카운터', 2, 1, '카운팅 수첩을 펼친 판 10번 이기기', (s) => s.countWin >= 10, 'luck', 0.03],
    ['ro1', '첫 회전', 1, 0, '룰렛 첫 판', (s) => s.roSpin >= 1, 'roul', 1],
    ['ro36', '36배의 기적', 2, 0, '룰렛 숫자 하나 맞히기', (s) => s.roOne >= 1, 'roul', 1],
    ['zero', '제로', 3, 0, '룰렛 0 맞히기', (s) => s.roZero >= 1, 'roul', 2],
    ['red10', '레드', 1, 0, '룰렛 빨강으로 10번 이기기', (s) => s.roRed >= 10, 'win', 0.01],
    ['black10', '블랙', 1, 0, '룰렛 검정으로 10번 이기기', (s) => s.roBlack >= 10, 'win', 0.01],
    ['ro200', '휠의 주인', 3, 0, '룰렛 200판', (s) => s.roSpin >= 200, 'roul', 2],
    ['magnet', '자석 손', 2, 1, '자석을 쓰고 이기기', (s) => s.magWin >= 1, 'susDown', 0.95],
    ['sd1', '뒷방 손님', 1, 0, '섯다 첫 판', (s) => s.sdHand >= 1, 'fold', 0.02],
    ['jabi', '땡잡이', 3, 0, '섯다에서 땡잡이로 땡 잡기', (s) => s.sdJabi >= 1, 'fold', 0.05],
    ['g38', '38광땡', 3, 0, '섯다 38광땡', (s) => s.sd38 >= 1, 'luck', 0.04],
    ['gwang', '광땡', 2, 0, '섯다 13광땡이나 18광땡', (s) => s.sdGwang >= 1, 'luck', 0.03],
    ['jang', '장땡', 2, 0, '섯다 10땡', (s) => s.sdJang >= 1, 'luck', 0.03],
    ['amhaeng', '암행어사 출두', 4, 1, '섯다에서 암행어사로 광땡 잡기', (s) => s.sdAm >= 1, 'luck', 0.05],
    ['gusa', '다시 한 판', 2, 0, '섯다 구사로 재경기 만들기', (s) => s.sdGusa >= 1, 'fold', 0.03],
    ['mangtong', '망통의 반란', 2, 1, '섯다에서 망통 들고 모두 접게 만들기', (s) => s.sdMang >= 1, 'fold', 0.04],
    ['sd50', '섯다 고수', 3, 0, '섯다 50승', (s) => s.sdWin >= 50, 'win', 0.03],
    ['ip1', '이마의 카드', 1, 0, '인디언 포커 첫 판', (s) => s.ipHand >= 1, 'fold', 0.02],
    ['iron', '철판', 3, 0, '인디언 포커에서 2를 달고 이기기', (s) => s.ipLow >= 1, 'fold', 0.05],
    ['ip30', '눈치 백단', 2, 0, '인디언 포커 30승', (s) => s.ipWin >= 30, 'win', 0.02],
    ['acefold', '에이스를 버린 자', 1, 1, '인디언 포커에서 에이스를 달고 다이', (s) => s.ipAceFold >= 1, 'loss', 0.03],
    ['mirror', '거울 속의 나', 1, 1, '인디언 포커에서 거울로 내 카드 보기', (s) => s.ipMirror >= 1, 'susDown', 0.95],
    ['ch1', '첫 수', 1, 0, '체스룸 첫 판', (s) => s.chPlay >= 1, 'chess', 0.05],
    ['ch10', '체스판의 군주', 3, 0, '체스룸 10승', (s) => s.chWin >= 10, 'chess', 0.1],
    ['chhard', '고수 사냥꾼', 4, 0, '체스룸 고수 이기기', (s) => s.chHard >= 1, 'chess', 0.15],
    ['chdraw', '무승부', 1, 1, '체스룸 무승부', (s) => s.chDraw >= 1, 'chess', 0.03],
    ['au1', '첫 낙찰', 1, 0, '경매에서 처음 낙찰받기', (s) => s.auWin >= 1, 'auc', 0.03],
    ['au5k', '큰손 수집가', 3, 0, '5,000칩 이상에 낙찰받기', (s) => s.auMax >= 5000, 'auc', 0.05],
    ['empty', '허공을 산 사람', 2, 1, '봉인된 상자에서 빈 상자', (s) => s.boxEmpty >= 1, 'auc', 0.03],
    ['box5', '상자 중독', 2, 0, '봉인된 상자 5개 열기', (s) => s.box >= 5, 'auc', 0.04],
    ['aulose10', '놓친 물건', 1, 0, '경매에서 10번 놓치기', (s) => s.auLose >= 10, 'auc', 0.02],
    ['auall', '경매장의 유령', 3, 1, '하루 경매 물건 세 개 모두 낙찰', (s) => s.auAll >= 1, 'auc', 0.06],
    ['cheat1', '첫 속임수', 1, 0, '속임수 아이템 처음 쓰기', (s) => s.cheat >= 1, 'susDown', 0.97],
    ['cheat30', '손기술', 2, 0, '속임수 아이템 30번', (s) => s.cheat >= 30, 'susDown', 0.93],
    ['ban1', '블랙리스트', 1, 0, '처음으로 출입 금지', (s) => s.ban >= 1, 'susDown', 0.95],
    ['ban5', '단골 블랙리스트', 2, 0, '출입 금지 다섯 번', (s) => s.ban >= 5, 'susDown', 0.9],
    ['rope', '외줄 타기', 3, 0, '의심 90 이상에서 한 판 이기기', (s) => s.ropeWin >= 1, 'susDown', 0.9],
    ['bottom', '완벽한 손기술', 4, 1, '밑장 빼기를 쓰고 그날 안 쫓겨나기', (s) => s.bottomOk >= 1, 'susDown', 0.85],
    ['monkey5', '손가락 없는 자', 3, 0, '원숭이 손 다섯 손가락 모두 쓰기', (s) => s.monkey >= 5, 'luck', 0.04],
    ['curse', '대가', 2, 1, '원숭이 손의 대가 치르기', (s) => s.curse >= 1, 'loss', 0.03],
    ['bribe', '매수', 2, 0, '뇌물 봉투 쓰기', (s) => s.bribe >= 1, 'susDown', 0.92],
    ['russian', '러시안', 3, 0, '리볼버 한 발을 걸고 이기기', (s) => s.revWin >= 1, 'win', 0.03],
    ['shot', '빗나간 한 발', 2, 1, '리볼버의 6분의 1에 걸리기', (s) => s.revShot >= 1, 'loss', 0.03],
    ['blood', '피의 맹세', 2, 0, '피 묻은 주사위로 이기기', (s) => s.diceWin >= 1, 'win', 0.02],
    ['watch', '시간 여행자', 2, 1, '회중시계로 진 판 되돌리기', (s) => s.watch >= 1, 'loss', 0.03],
    ['devil', '악마와 거래한 자', 3, 0, '악마의 계약서에 서명하기', (s) => s.contract >= 1, 'win', 0.03],
    ['t13seen', '13번 테이블 목격자', 3, 1, '13번 테이블을 보기', (s) => s.t13Seen >= 1, 't13', 0.005],
    ['t13win', '13번 테이블 생존자', 4, 1, '13번 테이블에서 살아남기', (s) => s.t13Win >= 1, 'win', 0.05],
    ['t13lose', '한 발', 3, 1, '13번 테이블에서 지기', (s) => s.t13Lose >= 1, 'loss', 0.05],
    ['t13leave', '현명한 겁쟁이', 2, 1, '13번 테이블에서 일어서서 나가기', (s) => s.t13Leave >= 1, 'fold', 0.05],
    ['blackchip', '검은 칩의 주인', 3, 1, '13번 테이블에서 검은 칩 받기', (s) => s.blackChip >= 1, 't13', 0.01],
    ['bar10', '바텐더의 친구', 2, 0, '바에 10번 들르기', (s) => s.barVisit >= 10, 'bar', 3],
    ['drink1', '첫 잔', 1, 0, '바에서 처음 술 마시기', (s) => s.drink >= 1, 'bar', 1],
    ['drink30', '술고래', 2, 0, '바에서 술 30잔', (s) => s.drink >= 30, 'bar', 2],
    ['clueall', '모든 것을 들은 자', 4, 0, '단서 전부 모으기', (s, w) => w.clues.length >= CLUE_TOTAL(), 'bar', 5],
    ['clue5', '소문을 쫓는 자', 2, 0, '단서 5개 모으기', (s, w) => w.clues.length >= 5, 'bar', 2],
    ['talk100', '수다쟁이', 2, 1, '바에서 100마디 나누기', (s) => s.talk >= 100, 'bar', 3],
    ['rest1', '휴식', 1, 0, '내 방에서 처음 쉬기', (s) => s.rest >= 1, 'susDown', 0.97],
    ['rest30', '숙면', 2, 0, '내 방에서 30번 쉬기', (s) => s.rest >= 30, 'susDown', 0.95],
    ['title30', '칭호 수집가', 3, 0, '칭호 30개 모으기', (s, w) => Object.keys(w.titles).length >= 30, 'win', 0.02],
    ['title70', '칭호 박물관', 4, 0, '칭호 70개 모으기', (s, w) => Object.keys(w.titles).length >= 70, 'win', 0.04],
    ['dawn', '첫 손님', 3, 1, '아침 6시 정각에 입장', (s) => s.dawn >= 1, 'morning', 30],
    ['idle', '아무것도 안 한 밤', 1, 1, '들어와서 한 판도 안 하고 하루 보내기', (s) => s.idle >= 1, 'morning', 10],
    ['owl', '올빼미', 1, 1, '자정부터 새벽 5시 사이에 입장', (s) => s.owl >= 1, 'luck', 0.02],
    ['777', '777', 3, 1, '칩을 정확히 777개 갖기', (s, w) => s.c777 >= 1 || w.chips === 777, 'luck', 0.03],
    ['admin', '관리인', 1, 1, '???', (s) => s.admin >= 1, 'susDown', 0.99],
    ['ug1', '지하 손님', 1, 0, '지하 홀덤 첫 판', (s) => s.ugHand >= 1, 'fold', 0.03],
    ['ugwin20', '지하의 왕', 3, 0, '지하 홀덤 20승', (s) => s.ugWin >= 20, 'win', 0.04],
    ['accuse', '고발자', 2, 0, '지하에서 고발 성공', (s) => s.ugAccuse >= 1, 'susDown', 0.95],
    ['accuse5', '포청천', 3, 0, '지하에서 고발 다섯 번 성공', (s) => s.ugAccuse >= 5, 'win', 0.03],
    ['falseacc', '헛다리', 1, 1, '지하에서 엉뚱한 사람 고발하기', (s) => s.ugFalse >= 1, 'loss', 0.02],
    ['clean5', '깨끗한 손', 3, 1, '지하에서 아이템을 다섯 번 연속 들키지 않고 쓰기', (s) => s.ugCleanBest >= 5, 'luck', 0.04],
    ['ugcaught', '지하의 낙인', 1, 1, '지하에서 걸리기', (s) => s.ugCaught >= 1, 'susDown', 0.97],
    ['market10', '암시장 단골', 2, 0, '암시장에서 물건 10개 사기', (s) => s.market >= 10, 'shop', 0.05],
    ['sl1', '레버를 당기다', 1, 0, '슬롯머신 첫 판', (s) => s.slSpin >= 1, 'luck', 0.01],
    ['jackpot', '잭팟', 4, 0, '슬롯머신 777', (s) => s.sl777 >= 1, 'win', 0.05],
    ['cherry10', '체리 수집가', 2, 0, '슬롯 체리 세 개 10번', (s) => s.slCherry >= 10, 'luck', 0.02],
    ['slitem', '선물 상자', 1, 1, '슬롯머신에서 아이템 받기', (s) => s.slItem >= 1, 'luck', 0.02],
    ['sl500', '레버 중독', 3, 0, '슬롯머신 500판', (s) => s.slSpin >= 500, 'luck', 0.03],
    ['bc1', '첫 바카라', 1, 0, '바카라 첫 판', (s) => s.bcHand >= 1, 'win', 0.01],
    ['bctie', '타이!', 2, 0, '바카라 타이 맞히기', (s) => s.bcTie >= 1, 'win', 0.02],
    ['bcbank', '뱅커의 친구', 2, 0, '바카라 뱅커로 30번 이기기', (s) => s.bcBank >= 30, 'win', 0.02],
    ['bc9', '내추럴 나인', 2, 1, '바카라에서 첫 두 장 9로 이기기', (s) => s.bc9 >= 1, 'luck', 0.02],
    ['wheel7', '일곱 번째 아침', 2, 0, '스페셜 회전판 돌리기', (s) => s.wheelSp >= 1, 'morning', 20],
    ['wheel30', '아침형 인간', 2, 0, '아침 회전판 30번', (s) => s.wheel >= 30, 'morning', 15],
    ['wheeljack', '아침의 잭팟', 4, 1, '스페셜 회전판에서 5,000칩', (s) => s.wheelJack >= 1, 'morning', 50]
  ];
  const TITLE_BY = {};
  for (const t of TITLES) TITLE_BY[t[0]] = t;
  let CLUE_TOTAL = () => 12;

  function eff(key) {
    const w = W(); if (!w || !w.eq) return key === 'susDown' ? 0 : 0;
    const t = TITLE_BY[w.eq]; if (!t || t[6] !== key) return 0;
    return t[7];
  }
  function titleName() { const w = W(); return w && w.eq && TITLE_BY[w.eq] ? TITLE_BY[w.eq][1] : ''; }

  let queue = [], showing = false;
  function check() {
    const w = W(); if (!w) return;
    if (w.chips === 777) w.st.c777 = 1;
    let got = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (const t of TITLES) {
        if (w.titles[t[0]]) continue;
        let ok = false; try { ok = t[5](w.st, w); } catch (e) { ok = false; }
        if (!ok) continue;
        w.titles[t[0]] = A.dayKey();
        const r = REWARD[t[2]]; w.chips += r; got++;
        queue.push(t);
      }
    }
    if (got) { A.save(); A.renderTop(); drain(); }
  }
  function drain() {
    if (showing || !queue.length) return;
    showing = true;
    const t = queue.shift();
    const el = h('div', { class: 'title-pop', role: 'status' },
      h('small', { text: t[3] ? '숨은 칭호 획득' : '칭호 획득' }), h('b', { text: t[1] }),
      h('span', { text: '+' + fmt(REWARD[t[2]]) + '칩 · ' + EFF[t[6]](t[7]) }));
    document.body.append(el);
    setTimeout(() => el.classList.add('out'), 2600);
    setTimeout(() => { el.remove(); showing = false; drain(); }, 3100);
  }

  // ───────── 이벤트 기록 ─────────
  function event(type, d = {}) {
    const w = W(); if (!w) return;
    const s = w.st;
    switch (type) {
      case 'hand': {
        inc('hands'); s.dayHands = (s.dayHands || 0) + 1;
        if (d.win && w.sus >= 90) inc('ropeWin');
        break;
      }
      case 'ban': inc('ban'); break;
      case 'cheat': inc('cheat'); break;
      case 'admin': inc('admin'); break;
      default: if (d.key) inc(d.key, d.n || 1);
    }
    if (total(w) <= 0) { if (!s.brokeNow) { inc('broke'); s.brokeNow = 1; } } else s.brokeNow = 0;
    check();
  }

  // ───────── 판 정산 ─────────
  // 한 판이 끝날 때 공통으로 부른다. 지갑을 직접 고치고, 화면에 보여줄 변화량을 돌려준다.
  // o: { game, net, staked, folded, legend, last }
  function settle(o) {
    const w = W(); let d = 0;
    const net = o.net;
    const before = total(w);
    // 전설·저주 아이템
    if (o.legend === 'monkey') {
      inc('monkey');
      if (o.last) { const k = take(5 * Math.max(1, o.staked)); d -= k; inc('curse'); A.toast('마지막 손가락이 접혔어요. 대가로 ' + fmt(k) + '칩.'); }
      else if (net < 0) { const k = take(4 * -net); d -= k; inc('curse'); A.toast('원숭이 손의 대가: ' + fmt(k) + '칩을 더 잃었어요.'); }
    } else if (o.legend === 'bottom') {
      s0().bottomDay = A.dayKey();
    } else if (o.legend === 'revolver') {
      if (net > 0) { give(net * 5); d += net * 5; inc('revWin'); }
      if (Math.random() < 1 / 6) { const k = take(Math.floor(w.chips / 2)); d -= k; inc('revShot'); A.toast('탕. 들고 있던 칩 절반(' + fmt(k) + ')이 날아갔어요.'); }
    } else if (o.legend === 'dice') {
      if (net > 0) { give(net * 2); d += net * 2; inc('diceWin'); } else if (net < 0) { const k = take(-net * 2); d -= k; }
    }
    // 지속 아이템
    if (has('contract') && net > 0) { give(net); d += net; w.act.contract.earned += net * 2; }
    if (has('coin') && net < 0 && Math.random() < 0.1) { give(-net); d += -net; A.toast('행운의 동전이 반짝였어요. 잃은 칩을 돌려받았어요.'); }
    // 칭호 효과
    if (net > 0 && eff('win')) { const k = Math.floor(net * eff('win')); give(k); d += k; }
    if (net < 0 && !o.folded && eff('loss')) { const k = Math.floor(-net * eff('loss')); give(k); d += k; }
    if (o.folded && eff('fold') && o.staked > 0) { const k = Math.floor(o.staked * eff('fold')); give(k); d += k; }
    // 술 효과 소모
    if (w.fx2.luck > 0) w.fx2.luck--;
    if (w.fx2.scare > 0) w.fx2.scare--;
    if (w.fx2.calm > 0) w.fx2.calm--;
    w.stats.best = Math.max(w.stats.best, total(w));
    const ret = Math.round(total(w) - before);
    event('hand', { win: net + d > 0 });
    A.save();
    return ret;
  }
  const s0 = () => W().st;

  // 판 시작 때: 운(칭호·술), 전설 아이템 카드, 마담의 부채
  function luckP() { const w = W(); return Math.min(0.5, (w.fx2.luck > 0 ? 0.15 : 0) + (eff('luck') || 0)); }
  function onHandStart(S, t) {
    const w = W();
    if (!(t.rig && t.rig.luck)) { const p = window.Plus.luckP(); if (p) t.rig.luck = { seat: 0, p }; }
    if (S.legend === 'monkey' || S.legend === 'bottom') {
      if (S.game === 'blackjack') t.rig.force = { seat: 0, cards: bjForce(S.legend) };
      else t.rig.force = pokerForce(S.game, S.legend);
    }
    if (has('fan') || w.fx2.scare > 0) t.rig.scare = { seat: 0, k: 0.82 };
    if (S.game === 'blackjack' && w.inv.shadow && Math.random() < 0.15) { S.peekHole = true; A.toast('그림자 딜러가 슬쩍 카드를 비춰 줬어요.'); }
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pokerForce(game, kind) {
    const suits = () => [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    if (kind === 'bottom') {
      const R = rnd(13), s = suits(); const cs = s.map((x) => R * 4 + x);
      return game === 'holdem' ? { seat: 0, hole: [cs[0], cs[1]], board: [cs[2], cs[3]] } : { seat: 0, hole: [null, null, null, null].concat(cs), board: [] };
    }
    // 원숭이 손: 스트레이트 이상
    const a = rnd(9); // 2~6 시작 … 10 시작(10-A)
    const pick = (r) => r * 4 + rnd(4);
    const run = [0, 1, 2, 3, 4].map((k) => pick(a + k));
    if (run.every((c) => (c & 3) === (run[0] & 3))) run[1] = (a + 1) * 4 + (((run[0] & 3) + 1) & 3);
    if (game === 'holdem') return { seat: 0, hole: [run[0], run[1]], board: [run[2], run[3], run[4]] };
    const extra = a + 5 <= 12 ? pick(a + 5) : (a * 4 + (((run[0] & 3) + 2) & 3));
    return { seat: 0, hole: [run[0], extra, null, null, run[1], run[2], run[3], run[4]], board: [] };
  }
  function bjForce(kind) {
    const A_ = 12 * 4 + rnd(4);
    if (kind === 'bottom') return [A_, 1010];
    return Math.random() < 0.5 ? [1010, 1010] : [A_, 1009];
  }

  // ───────── 아침 (하루가 바뀔 때) ─────────
  function morning(w, msgs, today) {
    norm(w);
    const prev = w.day, s = w.st, r = {};
    // 들어와서 한 판도 안 한 날
    if (s.lastVisit === prev && !(s.dayHands > 0)) inc('idle');
    s.dayHands = 0;
    // 밑장 빼기를 쓰고 그날 안 쫓겨났으면
    if (s.bottomDay && s.bottomDay === prev && w.banDay !== prev) inc('bottomOk');
    // 계약서
    const c = w.act.contract;
    if (c && c.noRefill === today) r.noRefill = true;
    // 은행가의 열쇠 + 칭호 금고 이자
    const rate = (w.inv.banker ? 0.02 : 0) + (eff('vault') || 0);
    if (rate && w.perm.vault && w.vault > 0) { const k = Math.min(3000, Math.floor(w.vault * rate)); if (k) { w.vault += k; msgs.push('금고 이자 ' + fmt(k) + '칩이 붙었어요.'); } }
    const mb = eff('morning'); if (mb) { w.chips += mb; msgs.push('칭호 덕분에 아침 ' + mb + '칩을 받았어요.'); }
    return r;
  }
  // 계약 만료 등 시간 지난 것 정리 (아무 때나 불러도 됨)
  function tick() {
    const w = W(); if (!w) return;
    const c = w.act.contract;
    if (c && c.until && Date.now() > c.until && !c.closed) {
      c.closed = true;
      const k = take(Math.floor((c.earned || 0) * 0.3));
      if (k) A.toast('계약이 끝났어요. 악마가 번 칩의 30%(' + fmt(k) + ')를 챙겨 갔어요.');
      A.save();
    }
  }

  // ───────── 입장 ─────────
  function boot() {
    const w = W(); norm(w);
    const s = w.st, today = A.dayKey();
    inc('visits');
    if (s.lastVisit !== today) {
      inc('days');
      const y = A.dayKey(Date.now() - DAY);
      s.streak = s.lastVisit === y ? (s.streak || 0) + 1 : 1;
      s.lastVisit = today;
    }
    const d = new Date();
    if (d.getHours() === 6 && d.getMinutes() === 0) inc('dawn');
    if (d.getHours() < 5) inc('owl');
    tick();
    if (Plus.t13 && Plus.t13.roll) Plus.t13.roll();
    A.save();
    setTimeout(check, 1500);
  }

  // ───────── 공통 화면 도구 ─────────
  let leaveFns = new Map();
  function onLeave(fn, key = 'x') { leaveFns.set(key, fn); }
  function stopAll() { const f = [...leaveFns.values()]; leaveFns = new Map(); for (const x of f) { try { x(); } catch (e) { /* 무시 */ } } }
  function screen(title, sub, cls) {
    const el = $('#scrPlus');
    const same = !el.hidden && el.dataset.key === (cls || '');
    if (!same) stopAll();
    el.innerHTML = ''; el.className = cls || ''; el.dataset.key = cls || '';
    el.append(h('div', { class: 'plus-head' }, h('div', null, h('h1', { text: title }), sub ? h('p', { class: 'sub', text: sub }) : null),
      h('button', { class: 'btn small', text: '로비로', onclick: () => { stopAll(); A.show('scrLobby'); A.renderLobby(); } })));
    A.show('scrPlus');
    return el;
  }
  function chipPick(values, cur, onPick) {
    const r = h('div', { class: 'presets' });
    for (const v of values) r.append(h('button', { class: 'btn small' + (cur === v ? ' gold' : ''), onclick: () => onPick(v) }, h('span', { class: 'chip-ico' }), ' ' + fmt(v)));
    return r;
  }

  // ───────── 로비 입구들 ─────────
  const DOORS = [
    ['roulette', '룰렛', '공이 멈추는 칸을 맞혀요. 숫자 하나면 36배.', 'r'],
    ['seotda', '섯다 · 뒷방', '화투 두 장으로 겨루는 한국식 승부.', 's'],
    ['indian', '인디언 포커', '내 카드만 못 보는 눈치 싸움.', 'i'],
    ['chess', '체스룸', '칩을 걸고 AI와 한 판.', 'c'],
    ['auction', '경매장', '매일 아침 6시에 희귀한 물건 세 개.', 'a'],
    ['bar', '바', '입장료 50칩. 바텐더와 이야기를.', 'b'],
    ['baccarat', '바카라', '플레이어, 뱅커, 타이. 9에 가까운 쪽에.', 'k'],
    ['slots', '슬롯머신', '777이면 잭팟. 가끔 아이템이 튀어나와요.', 'l'],
    ['room', '내 방', '칭호 진열장, 기록, 단서, 쉬기.', 'm']
  ];
  function lobby(el) {
    const w = W();
    if (Plus.t13 && Plus.t13.active()) el.append(Plus.t13.door());
    if (Plus.wheel && Plus.wheel.pending()) el.append(Plus.wheel.banner());
    const grid = h('div', { class: 'doors' });
    for (const [id, name, desc, k] of DOORS) {
      grid.append(h('button', { class: 'door-card d-' + k, onclick: () => open(id) },
        h('b', { text: name }), h('span', { text: desc })));
    }
    if (Plus.under && Plus.under.unlocked()) grid.append(h('button', { class: 'door-card d-u', onclick: () => open('under') }, h('b', { text: '지하로 내려가는 계단' }), h('span', { text: '의심 대신, 한 번에 걸리는 곳.' })));
    el.append(h('h2', { class: 'doors-title', text: '벨벳 안쪽' }), grid);
    if (w.eq) { /* 칭호는 위쪽 막대에 표시 */ }
  }
  function lobbyBanned(el) {
    if (Plus.wheel && Plus.wheel.pending()) el.append(Plus.wheel.banner());
    el.append(h('div', { class: 'doors' }, h('button', { class: 'door-card d-m', onclick: () => open('room') }, h('b', { text: '내 방' }), h('span', { text: '쫓겨난 날에도 방에는 들어갈 수 있어요.' }))));
  }
  function open(id) {
    const w = W();
    if (A.banned() && id !== 'room' && id !== 'wheel') return A.toast('오늘은 출입 금지예요.');
    const f = { room: renderRoom, wheel: () => Plus.wheel.open(), baccarat: () => Plus.baccarat.open(), slots: () => Plus.slots.open(), under: () => Plus.under.open(), roulette: () => Plus.roulette.open(), seotda: () => Plus.seotda.open(), indian: () => Plus.indian.open(), chess: () => Plus.chess.open(), auction: () => Plus.auction.open(), bar: () => Plus.bar.open() }[id];
    if (f) f();
    void w;
  }

  // ───────── 내 방 ─────────
  let roomTab = 'titles';
  function renderRoom() {
    const w = W(); norm(w);
    const el = screen('내 방', '카지노 위층 객실. 모은 것들이 여기 쌓여요.', 'room-screen');
    const scene = h('div', { class: 'room-scene', 'aria-hidden': 'true' },
      h('div', { class: 'win' }, ...Array.from({ length: 14 }, (_, k) => h('i', { style: `left:${(k * 37) % 100}%;bottom:${8 + (k * 23) % 60}%;height:${18 + (k * 13) % 50}%` }))),
      h('div', { class: 'bed' }), h('div', { class: 'lamp' }), h('div', { class: 'shelf' }));
    el.append(scene);
    const own = Object.keys(w.titles).length;
    const tabs = h('div', { class: 'tabs', role: 'tablist' });
    for (const [k, nm] of [['titles', '칭호 진열장 ' + own + '/' + TITLES.length], ['stats', '기록판'], ['clues', '단서 서랍 ' + w.clues.length], ['items', '장식장'], ['rest', '쉬기'], ['closet', '옷장']]) {
      tabs.append(h('button', { class: 'tab', role: 'tab', 'aria-selected': roomTab === k ? 'true' : 'false', text: nm, onclick: () => { roomTab = k; renderRoom(); } }));
    }
    el.append(tabs);
    const body = h('div', { class: 'room-body' });
    el.append(body);
    if (roomTab === 'titles') roomTitles(body);
    else if (roomTab === 'stats') roomStats(body);
    else if (roomTab === 'clues') roomClues(body);
    else if (roomTab === 'items') roomItems(body);
    else if (roomTab === 'rest') roomRest(body);
    else if (window.HW) HW.closet(body);
    else body.append(h('div', { class: 'panel' }, h('h3', { text: '옷장' }), h('p', { class: 'note', text: '아직 비어 있어요. 나중에 이벤트 의상이나 기념품이 생기면 여기 걸려요.' })));
  }
  function roomTitles(body) {
    const w = W();
    const cur = w.eq ? TITLE_BY[w.eq] : null;
    body.append(h('div', { class: 'panel' }, h('h3', { text: '지금 단 칭호' }),
      h('p', { class: 'note', text: cur ? cur[1] + ' · ' + EFF[cur[6]](cur[7]) : '아직 단 칭호가 없어요. 아래에서 고르세요. 한 번에 하나만 달 수 있고, 친구 테이블에서는 효과가 꺼져요.' }),
      cur ? h('button', { class: 'btn small', text: '떼기', onclick: () => { w.eq = null; A.save(); A.renderTop(); renderRoom(); } }) : null));
    const grid = h('div', { class: 'trophies' });
    for (const t of TITLES) {
      const got = w.titles[t[0]];
      const cls = 'trophy t' + t[2] + (got ? ' got' : '') + (w.eq === t[0] ? ' on' : '');
      const label = got || !t[3] ? t[1] : '???';
      const cond = got || !t[3] ? t[4] : '조건을 알 수 없어요';
      grid.append(h('button', { class: cls, disabled: !got, title: cond, onclick: () => { w.eq = t[0]; A.save(); A.renderTop(); A.toast(t[1] + ' 칭호를 달았어요.'); renderRoom(); } },
        h('b', { text: label }), h('small', { text: cond }), got ? h('em', { text: EFF[t[6]](t[7]) }) : h('em', { text: '보상 ' + fmt(REWARD[t[2]]) + '칩' })));
    }
    body.append(grid);
  }
  function roomStats(body) {
    const w = W(), s = w.st;
    const rows = [
      ['들른 날', (s.days || 0) + '일 (연속 ' + (s.streak || 0) + '일)'], ['모든 판', fmt(s.hands || 0) + '판 · 예전 기록 ' + fmt(w.stats.hands) + '판'],
      ['가장 많이 가졌던 칩', fmt(w.stats.best)], ['포커 승리', fmt(s.pkWin || 0) + '승 (홀덤 ' + (s.hdWin || 0) + ' · 세븐 ' + (s.svWin || 0) + ')'],
      ['블랙잭', '내추럴 ' + (s.bjNat || 0) + '번 · 최고 연승 ' + (s.bjBest || 0)], ['룰렛', (s.roSpin || 0) + '판 · 숫자 적중 ' + (s.roOne || 0) + '번'],
      ['섯다', (s.sdHand || 0) + '판 · ' + (s.sdWin || 0) + '승'], ['인디언 포커', (s.ipHand || 0) + '판 · ' + (s.ipWin || 0) + '승'],
      ['체스룸', (s.chPlay || 0) + '판 · ' + (s.chWin || 0) + '승 · 무 ' + (s.chDraw || 0)], ['경매', '낙찰 ' + (s.auWin || 0) + ' · 최고 ' + fmt(s.auMax || 0) + '칩'],
      ['속임수', (s.cheat || 0) + '번 · 출입 금지 ' + (s.ban || 0) + '번'], ['바', (s.barVisit || 0) + '번 · 술 ' + (s.drink || 0) + '잔 · ' + (s.talk || 0) + '마디'],
      ['13번 테이블', s.t13Seen ? '목격 ' + s.t13Seen + ' · 생존 ' + (s.t13Win || 0) + ' · 패배 ' + (s.t13Lose || 0) : '기록 없음'],
      ['바카라 · 슬롯', '바카라 ' + (s.bcHand || 0) + '판 · 슬롯 ' + (s.slSpin || 0) + '판 · 777 ' + (s.sl777 || 0) + '번'],
      ['지하', (s.ugHand || 0) + '판 · ' + (s.ugWin || 0) + '승 · 고발 성공 ' + (s.ugAccuse || 0) + ' · 적발 ' + (s.ugCaught || 0)],
      ['아침 회전판', (s.wheel || 0) + '번 · 스페셜 ' + (s.wheelSp || 0) + '번'],
      ['칭호', Object.keys(w.titles).length + ' / ' + TITLES.length]
    ];
    const tb = h('div', { class: 'statlist' });
    for (const [k, v] of rows) tb.append(h('div', null, h('span', { text: k }), h('b', { text: v })));
    body.append(h('div', { class: 'panel' }, h('h3', { text: '기록판' }), tb));
  }
  function roomClues(body) {
    const w = W();
    const list = Plus.bar ? Plus.bar.CLUES : [];
    const p = h('div', { class: 'panel' }, h('h3', { text: '단서 서랍' }), h('p', { class: 'note', text: '바텐더가 흘린 말들. 맞는 걸 물어봐야 나오는 것도 있어요. ' + w.clues.length + ' / ' + list.length }));
    const ul = h('div', { class: 'clues' });
    for (const c of list) {
      const got = w.clues.includes(c.id);
      ul.append(h('div', { class: 'clue' + (got ? ' got' : '') }, h('b', { text: got ? c.title : '???' }), h('p', { text: got ? '“' + c.text + '”' : '아직 듣지 못한 이야기' })));
    }
    p.append(ul); body.append(p);
  }
  const PASSIVE = {
    glasses: ['금테 안경', '포커에서 AI의 자신감이 보여요. (영구)'], shadow: ['그림자 딜러', '블랙잭에서 15% 확률로 딜러의 엎은 카드가 비쳐요. (영구)'],
    banker: ['은행가의 열쇠', '금고에 하루 2% 이자. (영구, 금고 필요)'], blackchip: ['검은 칩', '차갑고 무거운 칩. 많이 쥘수록 무언가가 가까워지는 기분이에요. 13번 테이블…?'],
    box: ['봉인된 상자', '열어 보기 전엔 몰라요.'], bribe: ['뇌물 봉투', '의심을 0으로. 대신 3일 동안 의심이 1.5배로 올라요.'],
    contract: ['악마의 계약서', '서명하면 24시간 동안 이긴 칩 2배. 끝나면 번 칩의 30%를 가져가고, 다음 날 아침 지급이 없어요.'],
    coin: ['행운의 동전', '켜면 7일 동안, 질 때 10% 확률로 잃은 칩을 돌려받아요.'], fan: ['마담의 부채', '켜면 7일 동안, 내가 올리면 AI가 더 잘 접어요.']
  };
  function roomItems(body) {
    const w = W(), now = Date.now();
    const p = h('div', { class: 'panel' }, h('h3', { text: '장식장' }), h('p', { class: 'note', text: '경매장에서 낙찰받은 물건들. 테이블에서 쓰는 전설 아이템은 테이블의 가방에서 써요.' }));
    const g = h('div', { class: 'shop-grid' });
    let any = false;
    for (const k in PASSIVE) {
      const n = w.inv[k] || 0; if (!n) continue; any = true;
      const [nm, desc] = PASSIVE[k];
      const foot = h('div', { class: 'foot' }, h('span', { class: 'own', text: typeof n === 'number' && n > 1 ? n + '개' : '보유' }));
      if (k === 'box') foot.append(h('button', { class: 'btn small gold', text: '열기', onclick: () => Plus.auction.openBox() }));
      if (k === 'bribe') foot.append(h('button', { class: 'btn small gold', text: '쓰기', onclick: useBribe }));
      if (k === 'contract') foot.append(h('button', { class: 'btn small red', text: '서명', disabled: has('contract'), onclick: signContract }));
      if (k === 'coin' || k === 'fan') foot.append(h('button', { class: 'btn small gold', text: has(k) ? '켜져 있음' : '켜기', disabled: has(k), onclick: () => { w.inv[k]--; w.act[k] = now + 7 * DAY; A.save(); A.toast(nm + ': 7일 동안 켜져요.'); renderRoom(); } }));
      if (['box', 'bribe', 'contract', 'coin', 'fan'].includes(k)) foot.append(h('button', { class: 'btn small', text: '되팔기', onclick: () => Plus.auction.resell(k) }));
      g.append(h('div', { class: 'ware' }, h('div', { class: 'head' }, h('span', { class: 'ico', svg: A.icon(k, 26) }), h('h3', { text: nm })), h('p', { text: desc }), foot));
    }
    for (const id of ['monkey', 'bottom', 'revolver', 'dice', 'watch', 'magnet']) {
      const n = w.items[id] || 0; if (!n) continue; any = true;
      const it = A.ITEMS[id];
      g.append(h('div', { class: 'ware' }, h('div', { class: 'head' }, h('span', { class: 'ico', svg: A.icon(id, 26) }), h('h3', { text: it.name })),
        h('p', { text: typeof it.desc === 'string' ? it.desc : '' }), h('div', { class: 'foot' }, h('span', { class: 'own', text: (id === 'monkey' ? '남은 손가락 ' : id === 'watch' ? '남은 횟수 ' : '') + n }))));
    }
    const act = [];
    if (has('contract')) act.push('악마의 계약 · ' + Math.ceil((w.act.contract.until - now) / 36e5) + '시간 남음');
    if (has('coin')) act.push('행운의 동전 · ' + Math.ceil((w.act.coin - now) / DAY) + '일');
    if (has('fan')) act.push('마담의 부채 · ' + Math.ceil((w.act.fan - now) / DAY) + '일');
    if (w.act.bribeMark > now) act.push('지배인의 눈길 · 의심 1.5배 · ' + Math.ceil((w.act.bribeMark - now) / DAY) + '일');
    if (act.length) p.append(h('p', { class: 'note', text: '걸린 효과: ' + act.join(' / ') }));
    p.append(any ? g : h('p', { class: 'note', text: '아직 비어 있어요. 경매장에 들러 보세요.' }));
    body.append(p);
  }
  function weekKey() { const d = new Date(Date.now() - 6 * 36e5); const j = new Date(d.getFullYear(), 0, 1); return d.getFullYear() + '-' + Math.floor(((d - j) / DAY + j.getDay()) / 7); }
  function useBribe() {
    const w = W(); if (!(w.inv.bribe > 0)) return;
    w.inv.bribe--; inc('bribe');
    if (w.act.bribeWeek === weekKey() && Math.random() < 0.5) { A.save(); A.toast('지배인이 봉투만 챙기고 모른 척했어요. 의심은 그대로예요.'); return renderRoom(); }
    w.act.bribeWeek = weekKey(); w.sus = 0; w.act.bribeMark = Date.now() + 3 * DAY;
    if (w.banDay === A.dayKey()) w.banDay = null;
    A.save(); A.renderTop(); check(); A.toast('지배인이 봉투를 받았어요. 의심이 0이 됐어요.'); renderRoom();
  }
  function signContract() {
    const w = W(); if (!(w.inv.contract > 0) || has('contract')) return;
    A.dialog('악마의 계약서', [h('p', { class: 'sub', text: '24시간 동안 이긴 칩이 두 배가 돼요. 계약이 끝나면 그동안 번 칩의 30%를 가져가고, 다음 날 아침 지급은 없어요. 서명할까요?' }),
      h('div', { class: 'row' }, h('button', { class: 'btn red', text: '서명한다', onclick: () => {
        w.inv.contract--; inc('contract');
        const tomorrow = A.dayKey(Date.now() + DAY);
        w.act.contract = { until: Date.now() + DAY, earned: 0, noRefill: tomorrow };
        A.save(); A.closeDialog(); check(); A.toast('잉크가 붉게 번졌어요. 24시간이 시작됐어요.'); renderRoom();
      } }))]);
  }
  function roomRest(body) {
    const w = W(), today = A.dayKey(), done = w.room.rest === today;
    body.append(h('div', { class: 'panel' }, h('h3', { text: '침대' }),
      h('p', { class: 'note', text: done ? '오늘은 이미 푹 쉬었어요. 내일 아침 6시 이후에 다시 쉴 수 있어요.' : '잠깐 누워서 쉬면 의심이 10 내려가요. 하루에 한 번.' }),
      h('button', { class: 'btn gold', text: '눕기', disabled: done, onclick: () => {
        const ov = h('div', { class: 'sleep' }, h('p', { text: '창밖으로 카지노 불빛만 깜빡여요…' }));
        document.body.append(ov);
        setTimeout(() => { ov.classList.add('out'); }, 2200);
        setTimeout(() => { ov.remove(); }, 2900);
        w.room.rest = today; w.sus = Math.max(0, w.sus - 10); inc('rest'); A.save(); A.renderTop(); check(); renderRoom();
      } })));
  }

  return {
    isOn: (k) => { const el = $('#scrPlus'); return !el.hidden && el.dataset.key === k + '-screen'; },
    clampSus, norm, eff, titleName, check, event, settle, onHandStart, luckP, morning, boot, tick, lobby, lobbyBanned, open, renderRoom,
    susGain, addSus, take, give, inc, setMax, has, screen, chipPick, onLeave, stopAll, leave: stopAll, TITLES, TITLE_BY, REWARD, EFF,
    set clueTotal(fn) { CLUE_TOTAL = fn; }
  };
})();
window.Plus = Plus;
