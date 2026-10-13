import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { WORLD, createGame, startGame, pauseGame, jump, stepGame, speedAt } from './logic.js';

mountShell({ title: 'スカイホップ', english: 'SKY HOP', accent: '#9bcbea',
  description: '空の滑走路を駆け抜ける、ワンタップのランナー。障害物を跳び越えて、どこまで行ける？',
  controls: ['「開始」でスタート。Space・上キー・画面のタップ・ジャンプボタンで跳びます。', 'ジャンプは着地してからもう一度。押しっぱなしでは連続ジャンプしません。', 'Pキー、または「一時停止」で停止。「再開」で続けられます。画面を離れると自動で一時停止します。', '障害物にぶつかると終了。リセットで準備に戻り、ベストはこのブラウザに保存されます。'] });

const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
let state = createGame();
let best = loadBest('sky-hop');
let frame = null, lastTime = null, accumulator = 0, feedbackUntil = 0;
let viewWidth = WORLD.width;
const STEP = 1 / 120;

function updateUI(message) {
  $('score').textContent = state.score.toLocaleString('ja-JP');
  $('best').textContent = best > 0 ? best.toLocaleString('ja-JP') : '—';
  $('pace').replaceChildren(document.createTextNode((speedAt(state.elapsed) / 260).toFixed(1)), Object.assign(document.createElement('span'), { textContent: '×' }));
  $('cleared').textContent = `${state.passed} OBSTACLES CLEARED`;
  $('start').disabled = state.status === 'running';
  $('start').textContent = state.status === 'paused' ? '再開' : (state.status === 'over' || state.status === 'timeout') ? 'もう一度' : '開始';
  $('pause').disabled = state.status !== 'running';
  $('jump').disabled = state.status !== 'running';
  $('overlay').hidden = state.status === 'running';
  if (message) $('status').textContent = message;
  if (state.status === 'ready') {
    $('overlay-eyebrow').textContent = 'READY TO HOP?'; $('overlay-title').textContent = '空へ、ひとっ跳び。'; $('overlay-message').textContent = '「開始」を押して、滑走路へ。';
  } else if (state.status === 'paused') {
    $('overlay-eyebrow').textContent = 'TAKE A BREATH'; $('overlay-title').textContent = 'ひと休み。'; $('overlay-message').textContent = '「再開」または P キーで続きを走ろう。';
  } else if (state.status === 'timeout') {
    $('overlay-eyebrow').textContent = 'TIME UP'; $('overlay-title').textContent = '時間切れ。'; $('overlay-message').textContent = `30分で終了。${state.score} 点。もう一度で新しい滑走路へ。`;
  } else if (state.status === 'over') {
    $('overlay-eyebrow').textContent = 'NICE RUN!'; $('overlay-title').textContent = `${state.score.toLocaleString('ja-JP')} 点`; $('overlay-message').textContent = '「もう一度」で、新しい滑走路へ。';
  }
}
function clearLoop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; lastTime = null; accumulator = 0; }
function begin() {
  if (state.status === 'running') return;
  if (state.status === 'over' || state.status === 'timeout') { state = createGame(); session.reset(); }
  if (!session.start()) return;
  startGame(state);
  updateUI('走行中。障害物の手前でジャンプ！');
  clearLoop();
  canvas.focus({ preventScroll: true });
  frame = requestAnimationFrame(tick);
}
function pause(message = '一時停止しました。「再開」で続けられます。') {
  if (!session.check() || state.status !== 'running') return;
  pauseGame(state); clearLoop(); clearFeedback(); updateUI(message); draw();
}
function reset() {
  session.reset();
  clearLoop(); clearFeedback(); state = createGame(); updateUI('準備できました。「開始」で走り出します。'); draw();
}
function hop() {
  if (!session.check()) return;
  if (jump(state)) { feedbackUntil = state.elapsed + .16; $('jump').classList.add('is-active'); $('jump-feedback').classList.add('is-active'); }
}
function clearFeedback() { feedbackUntil = 0; $('jump').classList.remove('is-active'); $('jump-feedback').classList.remove('is-active'); }
function finish() {
  if (!session.finish()) return;
  clearLoop(); clearFeedback();
  const isBest = state.score > best;
  if (isBest) { best = state.score; saveBest('sky-hop', best); }
  updateUI(`終了！ ${state.score} 点、${state.passed} 個の障害物を通過。${isBest ? 'ベスト更新！ ' : ''}「もう一度」で挑戦できます。`);
  draw();
}
function tick(time) {
  frame = null;
  if (!session.check() || state.status !== 'running') return;
  if (lastTime === null) lastTime = time;
  accumulator += Math.min(.05, Math.max(0, (time - lastTime) / 1000));
  lastTime = time;
  while (accumulator >= STEP && state.status === 'running') { stepGame(state, STEP); accumulator -= STEP; }
  if (state.status === 'over') { finish(); return; }
  if (feedbackUntil && state.elapsed >= feedbackUntil) clearFeedback();
  updateUI(); draw(); frame = requestAnimationFrame(tick);
}
function roundedRect(x, y, w, h, radius, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); }
function cloud(x, y, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = '#8cabb5'; ctx.globalAlpha = .13;
  ctx.beginPath(); ctx.ellipse(0, 0, 37, 9, 0, 0, Math.PI * 2); ctx.ellipse(-12, -7, 16, 14, 0, 0, Math.PI * 2); ctx.ellipse(9, -11, 22, 18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function draw() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, viewWidth, WORLD.height);
  const sky = ctx.createLinearGradient(0, 0, 0, 338); sky.addColorStop(0, '#202c31'); sky.addColorStop(1, '#354b51'); ctx.fillStyle = sky; ctx.fillRect(0, 0, viewWidth, WORLD.height);
  ctx.fillStyle = '#abcbd4'; ctx.globalAlpha = .13; ctx.beginPath(); ctx.arc(viewWidth - 98, 102, 32, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  const drift = state.distance * .12;
  for (let i = 0; i < 5; i++) cloud(((i * 223 + 70 - drift) % (viewWidth + 180) + viewWidth + 180) % (viewWidth + 180) - 90, 109 + (i % 3) * 34, .7 + (i % 2) * .5);
  // Quiet layers move more slowly than the runway to give a sense of height.
  const cityShift = state.distance * .23;
  for (let i = -1; i < Math.ceil(viewWidth / 78) + 2; i++) {
    const x = i * 78 - cityShift % 78; const height = 28 + ((i + Math.floor(cityShift / 78) + 5000) % 5) * 14;
    roundedRect(x, WORLD.ground - height - 15, 48, height + 20, 3, '#2a3e43');
    ctx.fillStyle = '#78969e'; ctx.globalAlpha = .13;
    for (let j = 0; j < 3; j++) ctx.fillRect(x + 9 + j * 11, WORLD.ground - height - 3, 3, 8);
    ctx.globalAlpha = 1;
  }
  ctx.strokeStyle = '#8bafb8'; ctx.globalAlpha = .18; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 253); ctx.lineTo(viewWidth, 253); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#1c2a2e'; ctx.fillRect(0, WORLD.ground, viewWidth, 82);
  ctx.fillStyle = '#9bcbea'; ctx.fillRect(0, WORLD.ground, viewWidth, 3);
  ctx.fillStyle = '#577b87';
  for (let i = -1; i < viewWidth / 68 + 2; i++) ctx.fillRect(i * 68 - state.distance % 68, WORLD.ground + 22, 31, 2);
  ctx.strokeStyle = '#354c53'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 389); ctx.lineTo(viewWidth, 389); ctx.stroke();
  for (const obstacle of state.obstacles) {
    roundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 7, '#e5ad84');
    roundedRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 8, 3, '#f2c5a4');
    ctx.strokeStyle = '#775345'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(obstacle.x + 10, obstacle.y + 26); ctx.lineTo(obstacle.x + obstacle.width - 10, obstacle.y + 17); ctx.stroke();
    ctx.fillStyle = '#312d29'; ctx.globalAlpha = .16; ctx.fillRect(obstacle.x + 5, WORLD.ground + 4, obstacle.width, 5); ctx.globalAlpha = 1;
  }
  const p = state.player; const lift = WORLD.ground - p.y - p.height;
  ctx.fillStyle = '#0c1a20'; ctx.globalAlpha = Math.max(.07, .28 - lift / 600); ctx.beginPath(); ctx.ellipse(p.x + 17, WORLD.ground + 6, Math.max(8, 21 - lift / 13), 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(p.x + 17, p.y + 21); ctx.rotate(!p.grounded ? -.12 : 0);
  roundedRect(-17, -21, 34, 39, 10, '#9bcbea'); roundedRect(-5, -13, 23, 13, 5, '#eff5f0');
  ctx.fillStyle = '#263b46'; ctx.beginPath(); ctx.arc(11, -6, 2, 0, Math.PI * 2); ctx.fill();
  const stride = p.grounded && state.status === 'running' ? Math.sin(state.elapsed * 20) * 4 : 0;
  roundedRect(-14 - stride / 2, 14, 11, 7, 3, '#7daecb'); roundedRect(5 + stride / 2, 14, 11, 7, 3, '#c5e4f5');
  ctx.restore();
  if (!p.grounded) { ctx.strokeStyle = '#8ab8cf'; ctx.globalAlpha = .4; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - 14, p.y + 17); ctx.lineTo(p.x - 5, p.y + 13); ctx.moveTo(p.x - 18, p.y + 27); ctx.lineTo(p.x - 8, p.y + 23); ctx.stroke(); ctx.globalAlpha = 1; }
}
function resize() {
  viewWidth = window.innerWidth <= 700 ? 600 : WORLD.width;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(viewWidth * dpr); canvas.height = Math.round(WORLD.height * dpr); draw();
}
$('start').addEventListener('click', begin);
$('pause').addEventListener('click', () => pause());
$('reset').addEventListener('click', reset);
$('jump').addEventListener('pointerdown', event => { if (event.button !== 0) return; event.preventDefault(); hop(); });
// A keyboard click on the visible button is also a single hop.
$('jump').addEventListener('click', event => { if (event.detail === 0) hop(); });
canvas.addEventListener('pointerdown', event => { if (event.button !== 0) return; canvas.focus({ preventScroll: true }); event.preventDefault(); hop(); });
document.addEventListener('keydown', event => {
  const interactive = event.target instanceof Element && event.target.closest('button,a,input,select,textarea');
  if (interactive || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'Space' || event.code === 'ArrowUp') { event.preventDefault(); if (!event.repeat) hop(); }
  if (event.code === 'KeyP' && !event.repeat) { event.preventDefault(); if (state.status === 'running') pause(); else if (state.status === 'paused' && !document.hidden) begin(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause('画面を離れたため一時停止しました。「再開」で続けられます。'); });
window.addEventListener('blur', () => pause('画面を離れたため一時停止しました。「再開」で続けられます。'));
window.addEventListener('resize', resize);
const session = createGameSession({ onExpire() {
  clearLoop(); clearFeedback(); state.status = 'timeout';
  if (state.score > best) { best = state.score; saveBest('sky-hop', best); }
  updateUI('時間切れ。30分になったため、この走行は終了しました。'); draw();
} });
updateUI(); resize();
