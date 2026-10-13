export const MAX_SESSION_MS = 30 * 60 * 1000;

// Wall time includes pauses and hidden tabs. A finished round cannot restart its
// deadline; the game must explicitly reset before starting a new round.
export function createSessionClock({ now = Date.now, limitMs = MAX_SESSION_MS } = {}) {
  if (!Number.isFinite(limitMs) || limitMs <= 0 || limitMs > MAX_SESSION_MS) throw new RangeError('Session limit must be within 30 minutes.');
  let state = 'idle', deadline = null, frozen = limitMs;
  const remaining = () => {
    if (state !== 'active') return frozen;
    const left = Math.max(0, Math.min(limitMs, deadline - now()));
    if (left === 0) { state = 'expired'; frozen = 0; }
    return left;
  };
  const check = () => { remaining(); return state !== 'expired'; };
  return {
    get state() { return state; },
    start() {
      if (state === 'idle') { deadline = now() + limitMs; state = 'active'; }
      check();
      return state === 'active';
    },
    check,
    remaining,
    finish() {
      const left = remaining();
      if (state === 'expired') return false;
      frozen = left; state = 'finished';
      return true;
    },
    reset() { state = 'idle'; deadline = null; frozen = limitMs; },
  };
}

export function createGameSession({ onExpire }) {
  const clock = createSessionClock();
  let timer = null, notified = false;
  const strip = document.createElement('div');
  strip.className = 'session-limit';
  strip.innerHTML = '<span class="session-limit-label">残り時間</span><strong class="session-time">30:00</strong><span class="session-limit-note">1プレイ最大30分 · 一時停止中も進みます</span>';
  document.querySelector('.game-heading').append(strip);
  const display = strip.querySelector('.session-time');
  const note = strip.querySelector('.session-limit-note');
  function stopTimer() { clearTimeout(timer); timer = null; }
  function update() {
    clock.check();
    const remaining = clock.remaining();
    const seconds = Math.ceil(remaining / 1000);
    const text = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    if (display.textContent !== text) display.textContent = text;
    if (strip.dataset.state !== clock.state) strip.dataset.state = clock.state;
    const warning = String(clock.state === 'active' && remaining <= 60_000);
    if (strip.dataset.warning !== warning) strip.dataset.warning = warning;
    const detail = clock.state === 'idle' ? '1プレイ最大30分 · 開始すると計時します'
      : clock.state === 'finished' ? 'このプレイは終了しました'
      : clock.state === 'expired' ? '30分になったため、このプレイは終了しました'
      : '一時停止・別タブの間も時間は進みます';
    if (note.textContent !== detail) note.textContent = detail;
    if (clock.state === 'expired' && !notified) {
      notified = true; stopTimer(); onExpire();
    }
    return clock.state !== 'expired';
  }
  function tick() {
    timer = null;
    update();
    if (clock.state === 'active') timer = setTimeout(tick, Math.min(1000, clock.remaining()));
  }
  const session = {
    start() {
      const active = clock.start();
      update();
      if (active && clock.state === 'active' && timer === null) timer = setTimeout(tick, Math.min(1000, clock.remaining()));
      return active && clock.state === 'active';
    },
    check: update,
    finish() {
      const finished = clock.finish();
      stopTimer(); update();
      return finished;
    },
    reset() { stopTimer(); clock.reset(); notified = false; update(); },
  };
  // Check before input as well as on return: suspended background timers cannot
  // let an overdue round accept another move or award a late clear.
  let blockGestureClick = false;
  function checkInput(event) {
    if (event.type === 'pointerdown' || event.type === 'keydown') blockGestureClick = false;
    const wasActive = clock.state === 'active';
    const valid = update();
    const inGame = event.target instanceof Element && event.target.closest('main');
    if (inGame && ((wasActive && !valid) || (event.type === 'click' && blockGestureClick))) {
      blockGestureClick = event.type === 'pointerdown';
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }
  for (const event of ['pointerdown', 'click', 'keydown']) document.addEventListener(event, checkInput, true);
  document.addEventListener('visibilitychange', update);
  window.addEventListener('focus', update);
  window.addEventListener('pageshow', update);
  update();
  return session;
}
