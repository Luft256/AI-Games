import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { createGame, advance, ORBIT_RADIUS, OUTER_RADIUS, PLAYER_RADIUS, WARNING_TIME, TAU } from './logic.js';
mountShell({ title: 'オービットドッジ', english: 'ORBIT DODGE', description: '円軌道をめぐり、飛び込む隕石をかわそう。予告を読んで生き残るサバイバル。', accent: '#f2a78d', controls: ['← / → または A / D を押し続けて、円軌道の上を移動。左右ボタンでも操作できます。', '盤面を押したままドラッグすると、ポインターの方向へ移動します。', '外周のマーカーと点線は隕石の予告。白い円が隕石に触れるとゲームオーバー。', 'スペース / P で開始・一時停止・再開。リセットで最初から。'] });
const $ = id => document.getElementById(id);
const canvas = $('board');
const ctx = canvas.getContext('2d');
const controls = [...document.querySelectorAll('.steer')];
const keys = new Set();
const touchDirections = new Map();
let game = createGame();
let mode = 'ready';
let best = loadBest('orbit-dodge');
let frameId = null;
let lastFrame = null;
let dragId = null;
let target = null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('best').textContent = String(best);
function position(angle, radius) { return [Math.cos(angle) * radius, Math.sin(angle) * radius]; }
function circle(x, y, radius, color, stroke = null, width = 1) {
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
  if (color) { ctx.fillStyle = color; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
function draw() {
  ctx.clearRect(0, 0, 640, 640);
  ctx.fillStyle = '#202923'; ctx.fillRect(0, 0, 640, 640);
  ctx.save(); ctx.translate(320, 320);
  // Fixed stars keep the backdrop calm and avoid distracting from threats.
  for (let i = 0; i < 45; i++) {
    const angle = i * 2.39996; const radius = 75 + (i * 37) % 227;
    const [x, y] = position(angle, radius); circle(x, y, i % 6 === 0 ? 1.4 : .8, '#52604d');
  }
  circle(0, 0, OUTER_RADIUS, null, '#3b493d');
  ctx.setLineDash([2, 10]); circle(0, 0, 222, null, '#344435'); ctx.setLineDash([]);
  circle(0, 0, ORBIT_RADIUS, null, '#7d8f75', 1.7);
  circle(0, 0, ORBIT_RADIUS - 23, null, '#314133');
  circle(0, 0, ORBIT_RADIUS + 23, null, '#314133');
  for (let i = 0; i < 12; i++) {
    const angle = i * TAU / 12;
    const [x, y] = position(angle, OUTER_RADIUS); const [endX, endY] = position(angle, OUTER_RADIUS - 7);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY); ctx.strokeStyle = '#64775d'; ctx.lineWidth = 1; ctx.stroke();
  }
  circle(0, 0, 58, '#27332a', '#3f5140');
  circle(0, 0, 43, null, '#496047');
  ctx.save(); ctx.rotate(reducedMotion ? 0 : game.time * .2);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(0, 0, 32, i * TAU / 3, i * TAU / 3 + .75); ctx.strokeStyle = '#70865f'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
  circle(0, 0, 7, '#a3b291');
  ctx.fillStyle = '#84947b'; ctx.font = '10px Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${String(game.wave).padStart(2, '0')}`, 0, 78);
  for (const meteor of game.meteors) {
    if (meteor.radius > ORBIT_RADIUS - 24) {
      const [outerX, outerY] = position(meteor.angle, OUTER_RADIUS);
      const [innerX, innerY] = position(meteor.angle, 94);
      ctx.beginPath(); ctx.moveTo(outerX, outerY); ctx.lineTo(innerX, innerY); ctx.setLineDash([5, 9]);
      ctx.strokeStyle = meteor.warning > 0 ? '#f2a78d55' : '#f2a78d25'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(0, 0, ORBIT_RADIUS, meteor.angle - .10, meteor.angle + .10);
      ctx.strokeStyle = '#f2a78d'; ctx.lineWidth = 3; ctx.stroke();
    }
    const [x, y] = position(meteor.angle, meteor.radius);
    if (meteor.warning > 0) {
      const progress = 1 - meteor.warning / WARNING_TIME;
      circle(x, y, 21, '#f2a78d15', '#f2a78d55');
      ctx.beginPath(); ctx.arc(x, y, 21, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
      ctx.lineWidth = 3; ctx.strokeStyle = '#f2a78d'; ctx.stroke();
      ctx.save(); ctx.translate(x, y); ctx.rotate(meteor.angle);
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(4, -6); ctx.lineTo(4, 6); ctx.closePath(); ctx.fillStyle = '#f2a78d'; ctx.fill(); ctx.restore();
      continue;
    }
    const [tailX, tailY] = position(meteor.angle, meteor.radius + 32);
    const trail = ctx.createLinearGradient(x, y, tailX, tailY);
    trail.addColorStop(0, '#f2a78d70'); trail.addColorStop(1, '#f2a78d00');
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tailX, tailY); ctx.lineWidth = meteor.size * 1.3; ctx.strokeStyle = trail; ctx.stroke();
    // The crisp circular edge is the meteor's true collision radius.
    circle(x, y, meteor.size, '#d27f64', '#ffd6bc', 1.5);
    circle(x - 3, y - 3, 3, '#f2a78d'); circle(x + 4, y + 3, 2, '#a56554');
  }
  const [px, py] = position(game.angle, ORBIT_RADIUS);
  circle(px, py, 21, game.result ? '#f2a78d30' : '#f6f5f015');
  circle(px, py, PLAYER_RADIUS, game.result ? '#f2a78d' : '#f6f5f0');
  circle(px, py, 3, '#253329');
  if (game.result) { circle(px, py, 30, null, '#f2a78d', 2); }
  ctx.restore();
}
function updateStats() {
  $('score').textContent = String(game.score);
  $('time').replaceChildren(document.createTextNode(game.time.toFixed(1)), Object.assign(document.createElement('span'), { className: 'unit', textContent: 's' }));
}
function direction() {
  const left = keys.has('ArrowLeft') || keys.has('a') || [...touchDirections.values()].includes(-1);
  const right = keys.has('ArrowRight') || keys.has('d') || [...touchDirections.values()].includes(1);
  return Number(right) - Number(left);
}
function updateControls() {
  for (const button of controls) {
    const value = Number(button.dataset.direction);
    const keyboardActive = value < 0 ? keys.has('ArrowLeft') || keys.has('a') : keys.has('ArrowRight') || keys.has('d');
    const active = mode === 'running' && (keyboardActive || [...touchDirections.values()].includes(value));
    button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
  }
}
function clearInput() { keys.clear(); touchDirections.clear(); dragId = null; target = null; updateControls(); }
function stopLoop() { if (frameId !== null) cancelAnimationFrame(frameId); frameId = null; lastFrame = null; }
function showOverlay(eyebrow, title, copy, button) {
  $('overlay-eyebrow').textContent = eyebrow; $('overlay-title').textContent = title; $('overlay-copy').textContent = copy; $('overlay-start').textContent = button; $('overlay').hidden = false;
}
function finish() {
  if (!session.finish()) return;
  mode = 'over'; stopLoop(); clearInput();
  const newBest = game.score > best;
  if (newBest) { best = game.score; saveBest('orbit-dodge', best); $('best').textContent = String(best); }
  $('start').textContent = 'もう一度';
  showOverlay(newBest ? 'NEW BEST / ベスト更新' : 'ORBIT LOST', '軌道を離脱。', `${game.time.toFixed(1)}秒 生存 · ${game.dodged}個 回避 · ${game.score}点。もう一度、先を読もう。`, 'もう一度プレイ →');
  $('status').textContent = `ゲームオーバー。${game.score}点${newBest ? '、ベスト更新！' : '。'} 生存時間 ${game.time.toFixed(1)}秒、隕石を${game.dodged}個かわしました。`;
}
function tick(timestamp) {
  frameId = null;
  if (!session.check() || mode !== 'running') return;
  if (lastFrame !== null) advance(game, Math.min(.05, (timestamp - lastFrame) / 1000), { direction: direction(), target });
  lastFrame = timestamp;
  updateStats(); draw();
  if (game.result) { finish(); return; }
  frameId = requestAnimationFrame(tick);
}
function play() {
  if (mode === 'running') return;
  if (mode !== 'paused') { game = createGame(); session.reset(); }
  if (!session.start()) return;
  mode = 'running'; stopLoop(); clearInput(); $('overlay').hidden = true; $('start').textContent = '一時停止';
  $('status').textContent = '白い点を動かして隕石を回避。点線の位置から離れよう。';
  canvas.focus({ preventScroll: true }); updateStats(); draw(); frameId = requestAnimationFrame(tick);
}
function pause(automatic = false) {
  if (!session.check() || mode !== 'running') return;
  mode = 'paused'; stopLoop(); clearInput(); $('start').textContent = '再開';
  showOverlay('PAUSED', 'ひと息、軌道の上で。', '隕石と移動は止まっています。残り時間は進みます。再開すると、同じ場所から続きます。', '再開する →');
  $('status').textContent = automatic ? '画面を離れたため一時停止しました。再開ボタンで続けられます。' : '一時停止中。再開ボタンで続けられます。';
}
function toggle() { if (mode === 'running') pause(); else play(); }
$('start').addEventListener('click', toggle);
$('overlay-start').addEventListener('click', play);
$('reset').addEventListener('click', () => {
  session.reset();
  stopLoop(); mode = 'ready'; clearInput(); game = createGame(); updateStats(); draw(); $('start').textContent = 'スタート';
  showOverlay('STAY IN ORBIT', '軌道をめぐって、隕石をかわそう。', '外周の予告を見て、飛来ルートの外へ。あなたは白い点。動き続けて生き残ろう。', 'プレイする →');
  $('status').textContent = 'リセットしました。スタートを押すと始まります。';
});
window.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(key)) {
    event.preventDefault(); if (mode === 'running') { keys.add(key); target = null; updateControls(); } return;
  }
  if ((key === ' ' && event.target.tagName !== 'BUTTON') || key === 'p') { event.preventDefault(); if (!event.repeat) toggle(); }
  else if (key === 'Escape') { event.preventDefault(); pause(); }
});
window.addEventListener('keyup', event => { keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); updateControls(); });
for (const button of controls) {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('pointerdown', event => {
    if (!session.check() || mode !== 'running') return; event.preventDefault(); button.setPointerCapture(event.pointerId);
    touchDirections.set(event.pointerId, Number(button.dataset.direction)); target = null; updateControls();
  });
  const release = event => { touchDirections.delete(event.pointerId); updateControls(); };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, release);
  button.addEventListener('keydown', event => {
    if (![' ', 'Enter'].includes(event.key)) return; event.preventDefault();
    if (mode === 'running') { touchDirections.set(button, Number(button.dataset.direction)); target = null; updateControls(); }
  });
  button.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) { touchDirections.delete(button); updateControls(); } });
  button.addEventListener('blur', () => { touchDirections.delete(button); updateControls(); });
}
function pointerAngle(event) {
  const bounds = canvas.getBoundingClientRect();
  const dx = event.clientX - bounds.left - bounds.width / 2;
  const dy = event.clientY - bounds.top - bounds.height / 2;
  if (Math.hypot(dx, dy) > bounds.width * .06) target = Math.atan2(dy, dx);
}
canvas.addEventListener('pointerdown', event => {
  if (mode !== 'running' || dragId !== null || event.button !== 0) return;
  event.preventDefault(); canvas.focus({ preventScroll: true }); dragId = event.pointerId; canvas.setPointerCapture(dragId); pointerAngle(event);
});
canvas.addEventListener('pointermove', event => { if (event.pointerId === dragId && mode === 'running') pointerAngle(event); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, event => { if (event.pointerId === dragId) { dragId = null; target = null; } });
window.addEventListener('blur', () => pause(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
const session = createGameSession({ onExpire() {
  mode = 'timeout'; game.result = 'timeout'; stopLoop(); clearInput();
  if (game.score > best) { best = game.score; saveBest('orbit-dodge', best); $('best').textContent = String(best); }
  $('start').textContent = 'もう一度';
  showOverlay('TIME UP', '時間切れ。次の軌道へ。', `30分で終了。${game.score}点 · ${game.dodged}個回避。`, 'もう一度プレイ →');
  $('status').textContent = '時間切れ。30分になったため、この飛行は終了しました。'; draw();
} });
updateStats(); draw();
