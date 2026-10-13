import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { HOLES, WIDTH, HEIGHT, STEP, createBall, launch, stepBall, preview, scoreFor } from './logic.js';
mountShell({ title: 'グラビティゴルフ', english: 'GRAVITY GOLF', description: 'まっすぐ打っても、まっすぐ進まない。星の引力を借りて、6つのカップをめぐろう。', controls: ['白いボールを緑のカップへ。各ホール6打以内で全6ホールをクリア。目標は合計19打（全PAR）以下。少ない合計打数ほど高得点です。', '盤面をボールから行きたい方向へドラッグして、方向とパワーを設定。点線は実際と同じ物理計算による予測です。「ショット」で打ちます。', '← / →：方向（Shiftで細かく）・↑ / ↓：パワー・Space：ショット・P：一時停止。ボタンとスライダーでも操作できます。', '星はボールを引き寄せ、星の中心・バンパー・壁は反射。砂の上は減速します。カップはゆっくり入ると吸い込みます。', '「打つ前に戻す」は＋1打で直前の位置に戻します。ボールは8秒以内に必ず止まります。一時停止・別タブでも30分の制限時間は進みます。'] });
const $ = id => document.getElementById(id), canvas = $('board'), ctx = canvas.getContext('2d');
let mode = 'ready', resumeMode = 'aim', holeIndex = 0, hole = HOLES[0], ball = createBall(hole);
let angle = 0, power = 65, strokes = 0, results = [], best = loadBest('gravity-golf');
let previous = null, dragId = null, frame = null, lastFrame = null, accumulator = 0, trajectory = null, trail = [];
$('best').textContent = best ? String(best) : '—';
function stopLoop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; lastFrame = null; accumulator = 0; dragId = null; }
function show(tag, title, copy, button) { $('overlay-tag').textContent = tag; $('overlay-title').textContent = title; $('overlay-copy').textContent = copy; $('continue').textContent = button; $('overlay').hidden = false; }
function aimPreview() { trajectory = preview(ball, hole, angle, power); }
function update() {
  $('hole-stat').textContent = `${holeIndex + 1} / 6`; $('strokes').textContent = `${strokes} / 6`;
  $('hole-name').textContent = hole.name; $('par').textContent = `PAR ${hole.par}`;
  $('angle').textContent = `${Math.round(angle * 180 / Math.PI)}°`; $('power').value = String(power); $('power-value').textContent = `${power}%`;
  $('shoot').disabled = mode !== 'aim'; $('power').disabled = mode !== 'aim'; $('left').disabled = mode !== 'aim'; $('right').disabled = mode !== 'aim';
  $('rescue').disabled = !['aim', 'flying'].includes(mode) || !previous || strokes >= 6;
  $('pause').disabled = !['aim', 'flying', 'paused'].includes(mode); $('pause').textContent = mode === 'paused' ? '再開' : '一時停止';
  $('scorecard').replaceChildren(...HOLES.map((_, i) => {
    const cell = document.createElement('div'); cell.className = i === holeIndex ? 'current' : '';
    const label = document.createElement('small'); label.textContent = `HOLE ${i + 1}`;
    const value = document.createElement('strong'); value.textContent = results[i] === undefined ? '—' : String(results[i]); cell.append(label, value); return cell;
  }));
}
function circle(x, y, radius, fill, stroke, width = 1) { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); } }
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.fillStyle = '#202b24'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let x = 40; x < WIDTH; x += 35) for (let y = 40; y < HEIGHT; y += 35) circle(x, y, 1, '#38483b');
  ctx.strokeStyle = '#586953'; ctx.lineWidth = 2; ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);
  for (const sand of hole.sand) {
    ctx.fillStyle = '#a88d5960'; ctx.fillRect(sand.x, sand.y, sand.w, sand.h);
    for (let x = sand.x + 8; x < sand.x + sand.w; x += 14) for (let y = sand.y + 8; y < sand.y + sand.h; y += 14) circle(x, y, 1.1, '#c3a57690');
  }
  for (const well of hole.wells) {
    for (const r of [well.r + 24, well.r + 55, well.r + 90]) circle(well.x, well.y, r, null, '#435b4555');
    circle(well.x, well.y, well.r, '#6c8770', '#a5b69a', 2); circle(well.x - 7, well.y - 7, 6, '#8b9d7b'); circle(well.x + 8, well.y + 8, 4, '#4a6552');
    ctx.fillStyle = '#b0c8a4'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.fillText('↓ 引力', well.x, well.y + well.r + 18);
  }
  for (const wall of hole.walls) { ctx.fillStyle = '#708572'; ctx.fillRect(wall.x, wall.y, wall.w, wall.h); ctx.strokeStyle = '#a0ae92'; ctx.lineWidth = 1; ctx.strokeRect(wall.x, wall.y, wall.w, wall.h); }
  for (const bumper of hole.bumpers) { circle(bumper.x, bumper.y, bumper.r, '#33463b', '#a8c5ad', 3); circle(bumper.x, bumper.y, bumper.r - 7, null, '#708977'); }
  const [cx, cy] = hole.cup;
  circle(cx, cy, 21, '#b5f36e18', '#b5f36e', 2); circle(cx, cy, 13, '#0d1912');
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 45); ctx.lineWidth = 2; ctx.strokeStyle = '#d8eac9'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 45); ctx.lineTo(cx + 26, cy - 35); ctx.lineTo(cx, cy - 27); ctx.fillStyle = '#b5f36e'; ctx.fill();
  ctx.fillStyle = '#b5f36e'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText('CUP', cx, cy + 36);
  if (mode === 'aim' && trajectory) {
    trajectory.points.forEach((p, i) => { if (i > 0) circle(p.x, p.y, 1.8, '#b5f36e90'); });
    const end = trajectory.end; circle(end.x, end.y, 9, null, end.sunk ? '#b5f36e' : '#b5f36e80', 1.4);
    if (end.sunk) { ctx.fillStyle = '#b5f36e'; ctx.font = 'bold 12px Arial'; ctx.fillText('IN! ✓', cx, cy + 52); }
    ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + Math.cos(angle) * 35, ball.y + Math.sin(angle) * 35); ctx.strokeStyle = '#eaf2df'; ctx.lineWidth = 2; ctx.stroke();
  }
  if (mode === 'flying' || (mode === 'paused' && resumeMode === 'flying')) trail.forEach((p, i) => circle(p.x, p.y, 2, `rgba(231,244,218,${i / trail.length * .3})`));
  circle(ball.x + 1.5, ball.y + 2, 8, '#00000055'); circle(ball.x, ball.y, ball.sunk ? 5 : 7, '#f6f5f0'); circle(ball.x - 2, ball.y - 2, 1.7, '#d5dccb');
  if (!ball.moving && !ball.sunk) circle(ball.x, ball.y, 13, null, '#f6f5f035');
}
function lose() {
  if (!session.finish()) return;
  mode = 'over'; stopLoop(); show('OUT OF STROKES', '次は、少ない打数で。', `ホール${holeIndex + 1}で6打に到達。${results.length}ホールをクリアしました。点線を使って、別のルートを探そう。`, 'もう一度プレイ →');
  $('status').textContent = '打数切れ。このラウンドは終了しました。未クリアの記録は保存されません。'; update(); draw();
}
function finishHole() {
  if (!session.check()) return;
  if (holeIndex === HOLES.length - 1 && !session.finish()) return;
  results.push(strokes);
  if (holeIndex === HOLES.length - 1) {
    const total = results.reduce((a, b) => a + b, 0), score = scoreFor(total), newBest = score > best;
    if (newBest) { best = score; saveBest('gravity-golf', best); $('best').textContent = String(best); }
    mode = 'over'; stopLoop(); show(newBest ? 'NEW BEST / ベスト更新' : 'COURSE COMPLETE', '6つの星を、めぐりました。', `全6ホールクリア！ 合計${total}打（PAR 19 / ${total <= 19 ? '目標達成！' : '次は19打以下へ'}） · ${score}点。${newBest ? 'ベストを更新しました。' : '次はもっと少ない打数を狙おう。'}`, 'もう一度プレイ →');
    $('status').textContent = `全6ホールクリア！ 合計${total}打、${score}点。`; update(); draw(); return;
  }
  mode = 'hole'; stopLoop(); show(strokes <= hole.par ? 'NICE SHOT! / ナイスショット' : 'HOLE COMPLETE', 'カップイン！', `ホール${holeIndex + 1}を${strokes}打でクリア。次は「${HOLES[holeIndex + 1].name}」。`, '次のホールへ →');
  $('status').textContent = `カップイン！ ${strokes}打。次のホールへ進めます。`; update(); draw();
}
function tick(timestamp) {
  frame = null;
  if (!session.check() || mode !== 'flying') return;
  if (lastFrame !== null) accumulator += Math.min(.1, (timestamp - lastFrame) / 1000);
  lastFrame = timestamp;
  while (accumulator >= STEP && ball.moving) { stepBall(ball, hole); accumulator -= STEP; trail.push({ x: ball.x, y: ball.y }); if (trail.length > 70) trail.shift(); }
  draw();
  if (!ball.moving) {
    stopLoop(); if (ball.sunk) { finishHole(); return; } if (strokes >= 6) { lose(); return; }
    mode = 'aim'; aimPreview(); $('status').textContent = `あと${6 - strokes}打。${hole.hint}`; update(); draw(); return;
  }
  frame = requestAnimationFrame(tick);
}
function shoot() {
  if (!session.check() || mode !== 'aim') return;
  previous = { x: ball.x, y: ball.y };
  if (!launch(ball, angle, power)) return;
  strokes++; mode = 'flying'; dragId = null; trail = []; $('status').textContent = `${strokes}打目。星の引力でカーブしています。`; update(); stopLoop(); frame = requestAnimationFrame(tick);
}
function setupHole(index) {
  holeIndex = index; hole = HOLES[index]; ball = createBall(hole); strokes = 0; previous = null; angle = Math.atan2(hole.cup[1] - ball.y, hole.cup[0] - ball.x); power = 65; trail = [];
  mode = 'aim'; $('overlay').hidden = true; $('status').textContent = hole.hint; aimPreview(); update(); draw(); canvas.focus({ preventScroll: true });
}
function startRound() { stopLoop(); session.reset(); results = []; if (!session.start()) return; setupHole(0); }
function pause() {
  if (!session.check()) return;
  if (mode === 'paused') { mode = resumeMode; $('overlay').hidden = true; $('status').textContent = hole.hint; update(); draw(); if (mode === 'flying') frame = requestAnimationFrame(tick); return; }
  if (!['aim', 'flying'].includes(mode)) return;
  resumeMode = mode; mode = 'paused'; stopLoop(); show('PAUSED', '星も、ひと休み。', 'ボールは止まっています。制限時間は一時停止中も進みます。', '再開する →'); $('status').textContent = '一時停止中。再開して同じショットを続けられます。'; update(); draw();
}
function changeAim(deltaAngle = 0, deltaPower = 0) {
  if (!session.check() || mode !== 'aim') return;
  angle = Math.atan2(Math.sin(angle + deltaAngle), Math.cos(angle + deltaAngle)); power = Math.max(0, Math.min(100, power + deltaPower)); aimPreview(); update(); draw();
}
$('continue').addEventListener('click', () => { if (mode === 'paused') pause(); else if (mode === 'hole') { if (session.check()) setupHole(holeIndex + 1); } else startRound(); });
$('shoot').addEventListener('click', shoot); $('pause').addEventListener('click', pause);
$('reset').addEventListener('click', () => { stopLoop(); session.reset(); results = []; holeIndex = 0; hole = HOLES[0]; ball = createBall(hole); strokes = 0; previous = null; mode = 'ready'; show('BEND YOUR SHOT', '引力で、カップへ。', '6ホールの宇宙ゴルフ。白いボールを緑のカップへ。各ホール6打以内でクリア！', 'プレイする →'); $('status').textContent = 'リセットしました。プレイするボタンで新しいラウンドを開始。'; update(); draw(); });
$('left').addEventListener('click', () => changeAim(-Math.PI / 60)); $('right').addEventListener('click', () => changeAim(Math.PI / 60));
$('power').addEventListener('input', () => { if (session.check() && mode === 'aim') { power = Number($('power').value); aimPreview(); update(); draw(); } });
$('rescue').addEventListener('click', () => {
  if (!session.check() || !['aim', 'flying'].includes(mode) || !previous || strokes >= 6) return;
  stopLoop(); strokes++; ball = { ...createBall(hole), x: previous.x, y: previous.y }; previous = null;
  if (strokes >= 6) { lose(); return; }
  mode = 'aim'; $('status').textContent = `＋1打で打つ前の位置へ。あと${6 - strokes}打。`; aimPreview(); update(); draw();
});
function aimAt(event) {
  const bounds = canvas.getBoundingClientRect(), x = (event.clientX - bounds.left) / bounds.width * WIDTH, y = (event.clientY - bounds.top) / bounds.height * HEIGHT;
  const dx = x - ball.x, dy = y - ball.y, distance = Math.hypot(dx, dy);
  if (distance < 8) return;
  angle = Math.atan2(dy, dx); power = Math.max(0, Math.min(100, Math.round(distance / 3.2))); aimPreview(); update(); draw();
}
canvas.addEventListener('pointerdown', event => { if (!session.check() || mode !== 'aim' || event.button !== 0 || dragId !== null) return; event.preventDefault(); canvas.focus({ preventScroll: true }); dragId = event.pointerId; canvas.setPointerCapture(dragId); aimAt(event); });
canvas.addEventListener('pointermove', event => { if (mode === 'aim' && event.pointerId === dragId && session.check()) aimAt(event); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, event => { if (event.pointerId === dragId) dragId = null; });
window.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (event.key.toLowerCase() === 'p' || event.key === 'Escape') { event.preventDefault(); if (!event.repeat) pause(); return; }
  if (mode !== 'aim') return;
  const amount = event.shiftKey ? Math.PI / 360 : Math.PI / 60;
  if (event.key === 'ArrowLeft') { event.preventDefault(); changeAim(-amount); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); changeAim(amount); }
  else if (event.key === 'ArrowUp') { event.preventDefault(); changeAim(0, 3); }
  else if (event.key === 'ArrowDown') { event.preventDefault(); changeAim(0, -3); }
  else if (event.key === ' ' && event.target.tagName !== 'BUTTON') { event.preventDefault(); if (!event.repeat) shoot(); }
});
window.addEventListener('blur', () => { if (['aim', 'flying'].includes(mode)) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && ['aim', 'flying'].includes(mode)) pause(); });
const session = createGameSession({ onExpire() { mode = 'timeout'; stopLoop(); ball.moving = false; show('TIME UP', '30分で、ラウンド終了。', `${results.length}ホールをクリアしました。新しいラウンドで、もう一度星をめぐろう。`, 'もう一度プレイ →'); $('status').textContent = '30分の制限時間に到達。未クリアの記録は保存されません。'; update(); draw(); } });
update(); draw();
