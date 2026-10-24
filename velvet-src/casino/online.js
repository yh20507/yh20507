/* ===== 벨벳 카지노 · 온라인 저장 (Supabase) =====
   다운받은 파일로 열어도 아이디·비밀번호로 로그인해서 같은 지갑을 쓰게 해 준다.
   공개 키는 웹페이지에 들어가도 되는 키이고, 지갑은 "자기 것만 읽고 쓰기" 규칙으로 보호된다. */
const VelvetOnline = (() => {
  const URL_ = 'https://omofqvclwetstbuoumzg.supabase.co';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tb2ZxdmNsd2V0c3RidW91bXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NTcxMTYsImV4cCI6MjEwODEzMzExNn0.aiwislXwkjbssNwxEvTIFQf3oi4LgugqZnUuFzq4xfA';
  const LS = 'velvet-session-v1';
  const DOMAIN = 'player.velvet-casino.com';   // 아이디를 로그인용 주소 모양으로 바꿀 때 쓰는 꼬리
  let session = null;   // { access_token, refresh_token, expires_at, user_id, id }

  const idToEmail = (id) => id.toLowerCase() + '@' + DOMAIN;
  function saveSession() { try { localStorage.setItem(LS, JSON.stringify(session)); } catch (e) { /* 저장 불가 */ } }
  function loadSession() { try { session = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { session = null; } return session; }
  function clearSession() { session = null; try { localStorage.removeItem(LS); } catch (e) { /* 무시 */ } }

  async function call(path, opt = {}) {
    const headers = Object.assign({ apikey: KEY, 'Content-Type': 'application/json' }, opt.headers || {});
    const res = await fetch(URL_ + path, Object.assign({}, opt, { headers }));
    let body = null;
    try { body = await res.json(); } catch (e) { body = null; }
    if (!res.ok) { const err = new Error((body && (body.msg || body.error_description || body.message || body.error)) || ('HTTP ' + res.status)); err.status = res.status; err.body = body; throw err; }
    return body;
  }
  function take(b, id) {
    session = { access_token: b.access_token, refresh_token: b.refresh_token, expires_at: Date.now() + (b.expires_in || 3600) * 1000, user_id: b.user && b.user.id, id };
    saveSession();
  }
  function korean(e) {
    const m = String(e.message || '');
    if (/invalid login credentials/i.test(m)) return '아이디나 비밀번호가 맞지 않아요.';
    if (/already registered|already exists/i.test(m)) return '이미 있는 아이디예요. 다른 아이디를 써 주세요.';
    if (/password.*(at least|short|6)/i.test(m)) return '비밀번호는 6자 이상이어야 해요.';
    if (/email not confirmed/i.test(m)) return '가입 확인 설정이 아직 켜져 있어요. 관리자(나)에게 Supabase 설정을 확인해 달라고 하세요.';
    if (/rate limit|too many/i.test(m)) return '시도가 너무 많아요. 잠시 뒤 다시 해 주세요.';
    if (/failed to fetch|network/i.test(m)) return '서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.';
    return '문제가 생겼어요: ' + m;
  }
  async function signIn(id, pw) {
    const b = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: idToEmail(id), password: pw }) });
    take(b, id);
  }
  async function signUp(id, pw) {
    const b = await call('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email: idToEmail(id), password: pw }) });
    if (!b || !b.access_token) throw new Error('email not confirmed');
    take(b, id);
  }
  async function token() {
    if (!session) throw new Error('로그인이 필요해요');
    if (Date.now() > session.expires_at - 60000) {
      const b = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) });
      take(b, session.id);
    }
    return session.access_token;
  }
  async function rest(path, opt = {}) {
    const t = await token();
    return call('/rest/v1/' + path, Object.assign({}, opt, { headers: Object.assign({ Authorization: 'Bearer ' + t }, opt.headers || {}) }));
  }

  // 지갑 읽기. 없으면 null. 읽으면서 이 화면(sid)이 주인이라고 표시한다.
  async function loadWallet(sid) {
    const uid = session.user_id;
    const rows = await rest('wallets?user_id=eq.' + uid + '&select=data', { method: 'GET' });
    if (rows && rows.length) {
      await rest('wallets?user_id=eq.' + uid, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ sid, updated_at: new Date().toISOString() }) });
      return rows[0].data;
    }
    return null;
  }
  async function createWallet(data, sid) {
    await rest('wallets', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: session.user_id, data, sid }) });
  }
  // 저장. 다른 기기가 주인 자리를 가져갔으면 false
  async function saveWallet(data, sid) {
    const rows = await rest('wallets?user_id=eq.' + session.user_id + '&sid=eq.' + encodeURIComponent(sid), {
      method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ data, updated_at: new Date().toISOString() })
    });
    return Array.isArray(rows) && rows.length > 0;
  }

  // 서버 기능(Edge Function) 부르기. 예: 바텐더
  async function fn(name, body) {
    const t = await token();
    const res = await fetch(URL_ + '/functions/v1/' + name, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let out = null; try { out = await res.json(); } catch (e) { out = null; }
    if (!res.ok) { const err = new Error((out && out.error) || ('HTTP ' + res.status)); err.status = res.status; throw err; }
    return out;
  }

  return { loadSession, clearSession, signIn, signUp, loadWallet, createWallet, saveWallet, korean, fn, get id() { return session && session.id; } };
})();
window.VelvetOnline = VelvetOnline;
