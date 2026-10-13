import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { createGame, advance, selectRoute, holdFeed, upcoming, accuracy, DESTINATIONS, SHIFT_SECONDS } from './logic.js';
mountShell({ title: 'カーゴスイッチ', english: 'CARGO SWITCH', description: '2本のベルトから届く荷物。到着順を読んで分岐を切り替え、30個を正しい倉庫へ。', accent: '#8dddc5', controls: ['1 / ← は丸、2 / ↓ は三角、3 / → は四角。画面下のボタンでも分岐を選べます。', '分岐に着いた瞬間の選択で行き先が確定。「到着順」の先頭と秒数を読もう。', 'H / 待避で未仕分けの荷物を1.6秒停止。各ステージに1回使えます。', 'スペース / Pで開始・一時停止・再開。90秒のシフト時間は一時停止中も進みます。'] });
const $ = id => document.getElementById(id);
const canvas = $('board'), ctx = canvas.getContext('2d');
const buttons = [...document.querySelectorAll('[data-route]')];
let game = createGame(), mode = 'ready', best = loadBest('cargo-switch');
let raf = null, last = null, deadline = null, shiftTimer = null, completionAt = null, lastQueue = '';
const stageNames = ['ゆっくり', '交互の流れ', 'ラッシュ'];
$('best').textContent = best;
function stop() { if (raf !== null) cancelAnimationFrame(raf); raf = null; last = null; clearTimeout(shiftTimer); shiftTimer = null; }
function overlay(label, title, copy, action, practice = true) {
  $('overlay-label').textContent = label; $('overlay-title').textContent = title; $('overlay-copy').textContent = copy;
  $('overlay-start').textContent = action; $('practice').hidden = !practice; $('overlay').hidden = false;
}
function path(points, color, width, dash = []) {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
}
function circle(x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
function label(text, x, y, color = '#9eafa1', size = 12) { ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.font = `700 ${size}px Arial,sans-serif`; ctx.fillText(text, x, y); }
function at(points, t) {
  const clamped = Math.max(0, Math.min(.999999, t)) * (points.length - 1), index = Math.floor(clamped), f = clamped - index;
  return [points[index][0] + (points[index + 1][0] - points[index][0]) * f, points[index][1] + (points[index + 1][1] - points[index][1]) * f];
}
function cargoBox(item, x, y, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = DESTINATIONS[item.target].color;
  ctx.beginPath(); ctx.roundRect(x - 19, y - 19, 38, 38, 7); ctx.fill();
  ctx.strokeStyle = '#142a25'; ctx.lineWidth = 2; ctx.stroke();
  label(DESTINATIONS[item.target].symbol, x, y + 8, '#20392f', 25); ctx.restore();
}
function draw() {
  ctx.fillStyle = '#1e302e'; ctx.fillRect(0, 0, 600, 540);
  for (let y = 40; y < 540; y += 40) for (let x = 20; x < 600; x += 40) circle(x, y, 1, '#32463e');
  const feeds = [[[80, 70], [175, 210], [300, 310]], [[520, 70], [425, 210], [300, 310]]];
  const exits = DESTINATIONS.map((_, i) => [[300, 310], [100 + i * 200, 435], [100 + i * 200, 473]]);
  for (const points of [...feeds, ...exits]) { path(points, '#142923', 34); path(points, '#456158', 26); path(points, '#698073', 2, [5, 10]); }
  path(exits[game.route], DESTINATIONS[game.route].color, 5);
  label('BELT A', 78, 36); label('BELT B', 520, 36); label('ARRIVAL JUNCTION', 300, 270, '#9eafa1', 10);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = DESTINATIONS[i].color; ctx.beginPath(); ctx.roundRect(45 + i * 200, 472, 110, 47, 9); ctx.fill();
    label(`${i + 1}   ${DESTINATIONS[i].symbol}`, 100 + i * 200, 503, '#24372f', 23);
  }
  // While held, rendering uses the end of the hold so shifting the schedule does
  // not make boxes jump backwards. Their arrival times still include the delay.
  const feedTime = game.time + Math.max(0, game.heldUntil - game.time);
  for (const item of game.cargo) {
    if (item.routed === null) {
      if (item.spawn > feedTime) continue;
      const [x, y] = at(feeds[item.lane], (feedTime - item.spawn) / item.travel); cargoBox(item, x, y);
    } else if (game.time - item.arrival < 1.25) {
      const progress = (game.time - item.arrival) / 1.25;
      const [x, y] = at(exits[item.routed], progress); cargoBox(item, x, y, 1 - Math.max(0, (progress - .75) * 4));
      if (!item.correct) label('×', x + 26, y + 4, '#ffc0a3', 24);
    }
  }
  circle(300, 310, 28, '#152b26'); circle(300, 310, 23, DESTINATIONS[game.route].color);
  label(['↙', '↓', '↘'][game.route], 300, 320, '#20382e', 30);
  const next = upcoming(game, 1)[0];
  if (next) {
    label(`${DESTINATIONS[next.target].symbol}  ${(Math.max(0, next.arrival - game.time)).toFixed(1)}s`, 300, 227, '#edf2df', 19);
    label('次の到着', 300, 201, '#aabfb0', 11);
  }
  if (game.time < game.heldUntil) label('HOLD / 待避中', 300, 94, '#8dddc5', 18);
  const recent = game.events.filter(event => event.correct !== undefined).at(-1);
  if (recent && game.time - recent.time < 1.25) label(recent.correct ? '✓ 正しい倉庫へ' : '× 行き先が違う', 300, 150, recent.correct ? '#8dddc5' : '#ffc0a3', 16);
}
function remaining() { return deadline === null ? SHIFT_SECONDS : Math.max(0, (deadline - Date.now()) / 1000); }
function stats() {
  $('score').textContent = game.score; $('count').textContent = `${game.delivered} / ${game.cargo.length}`;
  $('time').textContent = game.practice ? '練習' : Math.ceil(remaining());
  $('stage').textContent = game.practice ? 'PRACTICE / 3個で練習' : `STAGE ${game.stage} / ${stageNames[game.stage - 1]}`;
  $('combo').textContent = `${game.combo} COMBO`; $('accuracy').textContent = game.delivered ? `正確率 ${accuracy(game)}%` : '正確率 —';
  $('hold').textContent = `待避 ${game.holds}回 · H`; $('hold').disabled = mode !== 'running' || game.practice || !game.holds || game.time < game.heldUntil;
  for (const button of buttons) { button.setAttribute('aria-pressed', String(Number(button.dataset.route) === game.route)); button.disabled = mode !== 'running'; }
  const next = upcoming(game);
  const signature = next.map(item => `${item.id}:${Math.max(0, item.arrival - game.time).toFixed(1)}`).join();
  if (signature !== lastQueue) {
    lastQueue = signature;
    $('queue').replaceChildren(...next.map(item => {
      const li = document.createElement('li'); const mark = document.createElement('b'); mark.textContent = DESTINATIONS[item.target].symbol;
      const text = document.createElement('span'); text.textContent = `${Math.max(0, item.arrival - game.time).toFixed(1)}s`;
      const lane = document.createElement('small'); lane.textContent = `BELT ${item.lane === 0 ? 'A' : 'B'}`; text.append(lane); li.append(mark, text); return li;
    }));
  }
}
function finish(reason = 'complete') {
  if (mode === 'over' || mode === 'timeout' || !session.finish()) return;
  stop(); mode = 'over'; game.result = reason; $('start').textContent = 'もう一度';
  if (game.practice) {
    overlay('PRACTICE COMPLETE', '練習、おつかれさま。', `3個中${game.correct}個成功。分岐を通ったら、次の記号に切り替えよう。本番は10個ずつ、少しずつ速くなります。`, '本番シフトへ →');
    $('status').textContent = `練習終了。3個中${game.correct}個成功。記録は保存しません。`;
  } else {
    const newBest = game.score > best; if (newBest) { best = game.score; saveBest('cargo-switch', best); $('best').textContent = best; }
    const title = accuracy(game) === 100 && game.delivered === 30 ? '全便、正しく到着！' : reason === 'shift' ? 'シフト、終了。' : '30個、仕分け完了。';
    overlay(newBest ? 'NEW BEST / ベスト更新' : 'SHIFT REPORT', title, `${game.score}点 · 成功${game.correct} / ${game.delivered}個 · 正確率${accuracy(game)}% · 最大${game.maxCombo}コンボ。${game.delivered < 30 ? '残りの荷物は未仕分けです。' : 'もう一度、流れを読もう。'}`, 'もう一度シフト →');
    $('status').textContent = `シフト終了。${game.score}点、成功${game.correct}個、正確率${accuracy(game)}%。`;
  }
  stats(); draw();
}
function checkShift() {
  if (!session.check()) return false;
  if (!game.practice && deadline !== null && remaining() === 0 && (mode === 'running' || mode === 'paused')) { finish('shift'); return false; }
  return true;
}
function clockTick() {
  shiftTimer = null; if (!checkShift() || !['running', 'paused'].includes(mode)) return;
  stats(); shiftTimer = setTimeout(clockTick, 100);
}
function tick(stamp) {
  raf = null; if (!checkShift() || mode !== 'running') return;
  if (last !== null) {
    const dt = Math.min(.05, Math.max(0, (stamp - last) / 1000));
    if (game.result === 'complete') game.time += dt;
    else {
      const events = advance(game, dt);
      for (const event of events) {
        if (event.correct !== undefined) $('status').textContent = event.correct
          ? `成功！${DESTINATIONS[event.target].symbol}を${DESTINATIONS[event.target].name}へ。${game.combo}連続成功。次の到着を確認しよう。`
          : `誤配送。${DESTINATIONS[event.target].symbol}を${DESTINATIONS[event.route].name}に送りました。次の荷物で取り戻そう。`;
        if (event.stage) $('status').textContent = `ステージ${event.stage}。${stageNames[event.stage - 1]}。待避が1回使えます。`;
      }
      if (game.result === 'complete') completionAt = game.time;
    }
  }
  last = stamp; stats(); draw();
  if (completionAt !== null && game.time - completionAt >= 1.25) { finish(); return; }
  raf = requestAnimationFrame(tick);
}
function play(practice = false) {
  if (mode === 'running') return;
  const resume = mode === 'paused';
  if (!resume) { stop(); session.reset(); game = createGame(Math.random, practice); deadline = practice ? null : Date.now() + SHIFT_SECONDS * 1000; completionAt = null; }
  stop();
  if (!session.start()) return;
  mode = 'running'; $('overlay').hidden = true; $('start').textContent = '一時停止';
  $('status').textContent = game.practice ? '練習：●→1、▲→2、■→3。分岐を通ったら次に切り替えよう。' : '到着順の先頭を見よう。分岐に着くまでに行き先を選んでください。';
  canvas.focus({ preventScroll: true }); stats(); draw(); last = null; raf = requestAnimationFrame(tick); clockTick();
}
function pause(automatic = false) {
  if (!checkShift() || mode !== 'running') return;
  stop(); mode = 'paused'; $('start').textContent = '再開';
  overlay('PAUSED', '荷物は、ひと休み。', game.practice ? '練習の荷物は止まっています。再開すると同じ場所から続きます。' : '荷物は止まっています。90秒のシフト時間は進みます。再開すると同じ場所から続きます。', '再開する →', false);
  $('status').textContent = automatic ? '画面を離れたため一時停止。シフト時間は進みます。' : '一時停止中。シフト時間は進みます。'; stats(); clockTick();
}
function toggle() { mode === 'running' ? pause() : play(); }
function route(value) { if (!checkShift() || mode !== 'running') return; selectRoute(game, value); stats(); draw(); }
function hold() { if (!checkShift() || mode !== 'running' || !holdFeed(game)) return; $('status').textContent = '待避中。1.6秒の間に、到着順を確認しよう。'; stats(); draw(); }
$('overlay-start').addEventListener('click', () => play()); $('practice').addEventListener('click', () => play(true)); $('start').addEventListener('click', toggle); $('hold').addEventListener('click', hold);
$('reset').addEventListener('click', () => {
  stop(); session.reset(); game = createGame(); mode = 'ready'; deadline = null; completionAt = null; $('start').textContent = 'シフト開始';
  overlay('ROUTE THE NEXT ONE', '次の荷物、どこへ送る？', '分岐に着く瞬間の選択が送り先。● → 1、▲ → 2、■ → 3。到着順を読み、30個を仕分けしよう。', 'シフト開始 →');
  $('status').textContent = 'リセットしました。シフト開始か練習を選んでください。'; stats(); draw();
});
for (const button of buttons) button.addEventListener('click', () => route(Number(button.dataset.route)));
window.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  const key = event.key.toLowerCase(), value = { '1': 0, '2': 1, '3': 2, arrowleft: 0, arrowdown: 1, arrowright: 2 }[key];
  if (value !== undefined) { event.preventDefault(); route(value); }
  else if (key === 'h') { event.preventDefault(); if (!event.repeat) hold(); }
  else if (key === 'p' || (key === ' ' && event.target.tagName !== 'BUTTON')) { event.preventDefault(); if (!event.repeat) toggle(); }
  else if (key === 'escape') { event.preventDefault(); pause(); }
});
window.addEventListener('blur', () => pause(true)); document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); else checkShift(); });
window.addEventListener('focus', checkShift); window.addEventListener('pageshow', checkShift);
const session = createGameSession({ onExpire() {
  stop(); mode = 'timeout'; game.result = 'timeout'; $('start').textContent = 'もう一度';
  overlay('SESSION EXPIRED', 'このシフトは時間切れ。', '開始から30分になったため終了しました。途中のシフトの記録は保存しません。', '新しいシフト →');
  $('status').textContent = '30分の上限で終了。途中の記録は保存されません。'; stats(); draw();
} });
stats(); draw();
