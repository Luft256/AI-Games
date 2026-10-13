import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { createGame, advanceGame, placeBlock, BLOCK_HEIGHT, FLOOR_Y, WORLD_WIDTH } from './logic.js';

mountShell({
  title: 'スタックタワー', english: 'STACK TOWER',
  description: 'タイミングひとつで、空に近づく。小さなブロック、大きなタワー。',
  accent: '#a8d5a2',
  controls: ['クリック / Space / 配置ボタンでブロックを置く', 'Pで一時停止・再開、Rでリセット', '重なった幅だけが残ります。ぴったり重ねて最高の高さへ！'],
});
const $ = id => document.getElementById(id);
const canvas = $('board');
const context = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const WORLD_HEIGHT = 560;
const colors = ['#5d826c', '#8db894', '#a8d5a2', '#c1dda7', '#d8e5b2', '#c6d8ac', '#a4c79c'];
let game = createGame();
let mode = 'ready';
let best = loadBest('stack-tower', 0);
let camera = 0;
let frameId = null;
let lastTime = null;
let debris = [];
let flash = null;
let pressTime = 0;

function widthPercent() {
  const width = game.blocks.at(-1).width;
  return Math.max(0.1, Math.round(width / 220 * 1000) / 10);
}
function updateStats() {
  $('score').textContent = game.score;
  $('width').textContent = widthPercent();
  if (game.score > best) {
    best = game.score;
    saveBest('stack-tower', best);
  }
  $('best').textContent = best;
}
function stopLoop() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  lastTime = null;
}
function setMode(next) {
  if (next === 'over' && !session.finish()) return;
  stopLoop();
  mode = next;
  $('overlay').hidden = next === 'running';
  $('place').disabled = next !== 'running';
  $('place').classList.remove('pressed');
  $('start').textContent = next === 'running' ? '一時停止' : next === 'paused' ? '再開' : (next === 'over' || next === 'timeout') ? 'もう一度' : 'スタート';
  $('overlay-start').textContent = next === 'paused' ? '続きから再開 →' : (next === 'over' || next === 'timeout') ? 'もう一度 →' : 'プレイする →';
  const copy = {
    ready: ['ひとつずつ、空へ。', '動くブロックを、タワーの真上に。タイミングを合わせて置こう。', 'スタートを押して、最初の1段を積もう。'],
    running: ['', '', 'クリック・Space・下のボタンで置こう。Pで一時停止。'],
    paused: ['ここで、ひと呼吸。', 'タワーもブロックも、このまま。準備ができたら続きをどうぞ。', '一時停止中。再開ボタン・Space・Pで続けられます。'],
    timeout: ['時間切れ。ひと呼吸、休もう。', `30分で終了。高さ ${game.score} 段、ぴったり ${game.perfects} 回。`, '時間切れ。30分になったため終了しました。'],
    over: ['空へ、もう一度。', `今回の高さは ${game.score} 段。ぴったりは ${game.perfects} 回。ベストは ${best} 段です。`, `ゲームオーバー。ブロックが重なりませんでした。記録：${game.score} 段。`],
  }[next];
  $('overlay-title').textContent = copy[0];
  $('overlay-copy').textContent = copy[1];
  $('status').textContent = copy[2];
  draw();
  if (mode === 'running') frameId = requestAnimationFrame(frame);
}
function freshGame() {
  session.reset();
  game = createGame();
  camera = 0;
  debris = [];
  flash = null;
  pressTime = 0;
  updateStats();
}
function reset() {
  freshGame();
  setMode('ready');
}
function toggle() {
  if (mode === 'running') { if (session.check()) setMode('paused'); return; }
  if (mode === 'ready' || mode === 'over' || mode === 'timeout') freshGame();
  if (!session.start()) return;
  setMode('running');
  canvas.focus({ preventScroll: true });
}
function place() {
  if (!session.check() || mode !== 'running') return;
  const next = placeBlock(game);
  if (next === game) return;
  game = next;
  const result = game.result;
  const cut = result.cut;
  if (cut) {
    debris.push({ ...cut, velocityY: 30, velocityX: cut.x < result.block?.x ? -38 : 38, rotation: 0, age: 0, miss: result.kind === 'miss' });
  }
  updateStats();
  if (game.status === 'over') { setMode('over'); return; }
  pressTime = 0.14;
  $('place').classList.add('pressed');
  flash = { kind: result.kind, age: 0, x: result.block.x + result.block.width / 2, y: result.block.y, streak: game.streak };
  $('status').textContent = result.kind === 'perfect'
    ? `ぴったり！${game.streak > 1 ? ` ${game.streak} 連続！` : ''} 高さ ${game.score} 段。幅を守って次の1段へ。`
    : `高さ ${game.score} 段！ はみ出した部分が落ちました。残りの幅は ${widthPercent()}%。`;
  draw();
}
$('start').addEventListener('click', toggle);
$('overlay-start').addEventListener('click', toggle);
$('reset').addEventListener('click', reset);
$('place').addEventListener('click', place);
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || mode !== 'running') return;
  event.preventDefault();
  canvas.focus({ preventScroll: true });
  place();
});
document.addEventListener('keydown', event => {
  if (event.target.matches('input, textarea, select') || event.target.isContentEditable) return;
  const key = event.key.toLowerCase();
  if (event.code === 'Space' && !event.target.closest('button, a')) {
    event.preventDefault();
    if (!event.repeat) { if (mode === 'running') place(); else toggle(); }
  } else if (event.key === 'Enter' && event.target === canvas) {
    event.preventDefault();
    if (!event.repeat) { if (mode === 'running') place(); else toggle(); }
  } else if (key === 'p') {
    event.preventDefault();
    if (!event.repeat && (mode === 'running' || mode === 'paused')) toggle();
  } else if (key === 'r') {
    event.preventDefault();
    if (!event.repeat) reset();
  }
});
window.addEventListener('blur', () => { if (mode === 'running') setMode('paused'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'running') setMode('paused'); });

function rounded(x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, Math.min(radius, width / 2, height / 2));
  context.fill();
}
function drawBlock(block, moving = false) {
  const y = block.y + camera;
  if (y > WORLD_HEIGHT + BLOCK_HEIGHT || y < -BLOCK_HEIGHT) return;
  context.fillStyle = moving ? '#edf1d1' : colors[block.level % colors.length];
  rounded(block.x, y, block.width, BLOCK_HEIGHT - 1, 3);
  context.fillStyle = moving ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.22)';
  rounded(block.x + Math.min(3, block.width / 8), y + 2, Math.max(0, block.width - Math.min(6, block.width / 4)), 3, 1);
  if (block.width > 36) {
    context.fillStyle = '#263b2b';
    context.font = '600 10px sans-serif';
    context.textAlign = 'center';
    context.fillText(block.level === 0 ? 'BASE' : String(block.level).padStart(2, '0'), block.x + block.width / 2, y + 17);
  }
}
function draw() {
  const scaleX = canvas.width / WORLD_WIDTH;
  const scaleY = canvas.height / WORLD_HEIGHT;
  context.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  const sky = context.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
  sky.addColorStop(0, '#202c25'); sky.addColorStop(1, '#2c3d30');
  context.fillStyle = sky;
  context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  context.strokeStyle = 'rgba(168,213,162,.065)';
  context.lineWidth = 1;
  for (let y = camera % 52; y < WORLD_HEIGHT; y += 52) {
    context.beginPath(); context.moveTo(24, y); context.lineTo(456, y); context.stroke();
  }
  for (let x = 32; x < WORLD_WIDTH; x += 52) {
    context.beginPath(); context.moveTo(x, 60); context.lineTo(x, WORLD_HEIGHT - 40); context.stroke();
  }
  context.fillStyle = '#a8c0a8';
  context.font = '10px sans-serif'; context.textAlign = 'left';
  context.fillText('BUILD THE MOMENT', 24, 32);
  context.textAlign = 'right';
  context.fillText(`${String(game.score).padStart(2, '0')} FLOORS`, 456, 32);
  const floor = FLOOR_Y + BLOCK_HEIGHT + camera;
  if (floor < WORLD_HEIGHT) {
    context.fillStyle = '#19271f'; context.fillRect(24, floor, 432, WORLD_HEIGHT - floor);
    context.strokeStyle = '#57705a'; context.beginPath(); context.moveTo(24, floor); context.lineTo(456, floor); context.stroke();
  }
  const top = game.blocks.at(-1);
  if (game.active) {
    const y = game.active.y + camera;
    context.strokeStyle = 'rgba(214,233,194,.32)';
    context.setLineDash([3, 5]);
    context.strokeRect(top.x, y + 1, top.width, BLOCK_HEIGHT - 2);
    context.setLineDash([]);
  }
  for (const block of game.blocks) drawBlock(block);
  for (const piece of debris) {
    context.save();
    context.globalAlpha = piece.miss ? 0.65 : Math.max(0, 1 - piece.age / 1.3);
    context.translate(piece.x + piece.width / 2, piece.y + camera + BLOCK_HEIGHT / 2);
    context.rotate(piece.rotation);
    context.fillStyle = piece.miss ? '#dca88a' : colors[piece.level % colors.length];
    rounded(-piece.width / 2, -BLOCK_HEIGHT / 2, piece.width, BLOCK_HEIGHT - 1, 2);
    context.restore();
  }
  if (game.active) drawBlock(game.active, true);
  if (flash?.kind === 'perfect' && flash.age < 0.8) {
    context.save();
    context.globalAlpha = Math.min(1, (0.8 - flash.age) * 3);
    context.fillStyle = '#e4f3c7'; context.textAlign = 'center';
    context.font = '700 12px sans-serif';
    const x = Math.max(75, Math.min(405, flash.x));
    context.fillText(`PERFECT${flash.streak > 1 ? ` ×${flash.streak}` : ''}`, x, flash.y + camera - 12 - (reducedMotion ? 0 : flash.age * 18));
    context.restore();
  }
}
function frame(now) {
  frameId = null;
  if (!session.check() || mode !== 'running') return;
  const elapsed = lastTime === null ? 0 : Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  game = advanceGame(game, elapsed);
  const targetCamera = Math.max(0, game.score - 7) * BLOCK_HEIGHT;
  camera = reducedMotion ? targetCamera : camera + (targetCamera - camera) * Math.min(1, elapsed * 9);
  for (const piece of debris) {
    piece.age += elapsed;
    piece.velocityY += elapsed * 620;
    piece.y += piece.velocityY * elapsed;
    piece.x += piece.velocityX * elapsed;
    if (!reducedMotion) piece.rotation += elapsed * (piece.velocityX > 0 ? 1.5 : -1.5);
  }
  debris = debris.filter(piece => piece.age < 1.3 && piece.y + camera < WORLD_HEIGHT + 50);
  if (flash) { flash.age += elapsed; if (flash.age > 0.8) flash = null; }
  if (pressTime > 0) {
    pressTime = Math.max(0, pressTime - elapsed);
    if (pressTime === 0) $('place').classList.remove('pressed');
  }
  draw();
  frameId = requestAnimationFrame(frame);
}
function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  canvas.height = Math.round(canvas.width * WORLD_HEIGHT / WORLD_WIDTH);
  draw();
}
new ResizeObserver(resize).observe(canvas);
const session = createGameSession({ onExpire() {
  game.status = 'timeout'; updateStats(); setMode('timeout');
} });
updateStats();
setMode('ready');
