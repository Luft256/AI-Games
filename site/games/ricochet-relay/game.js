import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { CHAMBERS, WIDTH, HEIGHT, BORDER, TARGET_RADIUS, createRound, shoot, traceShot, mirrorSegment } from './logic.js';
mountShell({ title: 'リコシェリレー', english: 'RICOCHET RELAY', description: '光を折り返し、番号順に回路をつなぐ。壁と鏡の先を読む、6つの反射パズル。', accent: '#89ddd0', controls: ['盤面をタップ・ドラッグして角度を合わせ、発射ボタンで光を送ります。', '← / → で1°、Shiftを押しながらで0.2°ずつ調整。Spaceで発射。', '鏡ボタンで向きを切り替え。Mで鏡を選択、Rで回転。Pで一時停止。', 'リレーは番号順。起動済みは残り、弾切れはこの部屋から再挑戦。全6室クリアで記録します。'] });
const $ = id => document.getElementById(id), canvas = $('board'), ctx = canvas.getContext('2d');
let room = 0, round = createRound(CHAMBERS[0]), angle = CHAMBERS[0].aim, mode = 'ready';
let selectedMirror = 0, dragging = null, frameId = null, lastTime = null, flight = null, flightProgress = 0, pausedMode = null;
let medals = [], best = loadBest('ricochet-relay'), displayedActivated = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
$('best').textContent = best || '—';
const chamber = () => CHAMBERS[room];
function focusBoard() { canvas.focus({ preventScroll: true }); }
function stopLoop() { if (frameId !== null) cancelAnimationFrame(frameId); frameId = null; lastTime = null; dragging = null; }
function circle(x, y, r, fill, stroke, width = 1) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); } }
function line(a, b, color, width = 1) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
function pathLine(path, maximum, color, width) {
  ctx.lineCap = 'round';
  for (const segment of path.segments) {
    if (maximum < segment.start) break;
    const fraction = Math.min(1, (maximum - segment.start) / (segment.end - segment.start));
    line(segment.from, { x: segment.from.x + (segment.to.x - segment.from.x) * fraction, y: segment.from.y + (segment.to.y - segment.from.y) * fraction }, color, width);
  }
  ctx.lineCap = 'butt';
}
function draw() {
  const smallCanvas = canvas.clientWidth < 400;
  ctx.clearRect(0, 0, WIDTH, HEIGHT); ctx.fillStyle = '#152329'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let x = 40; x < WIDTH; x += 40) for (let y = 40; y < HEIGHT; y += 40) circle(x, y, 1, '#31474e');
  ctx.strokeStyle = '#637e84'; ctx.lineWidth = 3; ctx.strokeRect(BORDER, BORDER, WIDTH - 2 * BORDER, HEIGHT - 2 * BORDER);
  for (let x = 56; x < WIDTH - BORDER; x += 32) { line({ x, y: BORDER - 5 }, { x: x + 6, y: BORDER - 10 }, '#4a6269'); line({ x, y: HEIGHT - BORDER + 5 }, { x: x - 6, y: HEIGHT - BORDER + 10 }, '#4a6269'); }
  if (['aiming', 'ready', 'paused'].includes(mode)) {
    const preview = traceShot(chamber(), angle, round.orientations, round.activated, { ignoreTargets: true, maxBounces: 2, maxDistance: 1000 });
    ctx.setLineDash([3, 10]); pathLine(preview, preview.distance, '#89ddd080', 2); ctx.setLineDash([]);
    for (const segment of preview.segments.slice(0, 2)) circle(segment.to.x, segment.to.y, 5, '#89ddd022', '#89ddd0', 1);
  }
  if (flight) { const length = Math.min(flight.distance, flightProgress); pathLine(flight, length, '#89ddd02a', 12); pathLine(flight, length, '#9deee1', 3); }
  chamber().mirrors.forEach((mirror, i) => {
    const [a, b] = mirrorSegment(mirror, round.orientations[i]); line(a, b, '#21373f', 13); line(a, b, '#cae4ee', 6);
    if (i === selectedMirror) { ctx.setLineDash([3, 6]); circle(mirror.x, mirror.y, mirror.size + 14, null, '#6da5ac', 1); ctx.setLineDash([]); }
    ctx.fillStyle = '#d9e9ed'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText(String.fromCharCode(65 + i), mirror.x + mirror.size + 12, mirror.y - mirror.size - 5);
  });
  chamber().targets.forEach((target, i) => {
    const active = i < displayedActivated, next = i === displayedActivated && mode !== 'timeout';
    circle(target.x, target.y, TARGET_RADIUS + (next ? 5 : 0), active ? '#89ddd0' : '#1e3339', active ? '#c8fff2' : next ? '#f3df9c' : '#8aabb0', next ? 2 : 1.5);
    ctx.fillStyle = active ? '#16312e' : next ? '#f3df9c' : '#bed3d6'; ctx.font = `bold ${smallCanvas ? 30 : 24}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(active ? '✓' : String(i + 1), target.x, target.y + 1);
    const label = [target.bounces ? `${target.bounces}+` : '', target.mirror ? '鏡' : ''].filter(Boolean).join(' ');
    if (label) { ctx.font = `bold ${smallCanvas ? 24 : 16}px Arial`; ctx.fillStyle = active ? '#89ddd0' : '#bfd1d3'; ctx.fillText(label, target.x, target.y + 34); }
  });
  ctx.textBaseline = 'alphabetic';
  const source = chamber().source, radians = angle * Math.PI / 180;
  line(source, { x: source.x + 32 * Math.cos(radians), y: source.y + 32 * Math.sin(radians) }, '#f6f5f0', 6);
  circle(source.x, source.y, 13, '#f6f5f0', '#89ddd0', 3); circle(source.x, source.y, 4, '#203b3d');
  ctx.fillStyle = '#9ab4ba'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.fillText('SOURCE', source.x, source.y + 28);
}
let conditionsSignature = '';
function syncConditions() {
  const signature = `${room}:${displayedActivated}:${mode === 'timeout'}`;
  if (signature === conditionsSignature) return;
  conditionsSignature = signature;
  const targets = chamber().targets;
  $('next-condition').textContent = mode === 'timeout' ? '時間切れ。このプレイは終了しました。' : displayedActivated === targets.length ? 'この部屋のリレーはすべて起動しました。' : `次はリレー${displayedActivated + 1}。下の条件を満たす光を届けよう。`;
  $('conditions-list').replaceChildren(...targets.map((target, i) => {
    const li = document.createElement('li'), label = document.createElement('strong'), condition = document.createElement('span');
    const active = i < displayedActivated, next = i === displayedActivated && mode !== 'timeout';
    li.className = active ? 'is-active' : next ? 'is-next' : '';
    if (next) li.setAttribute('aria-current', 'step');
    label.textContent = `${i + 1}番${active ? ' 起動済み' : next ? ' 次' : ''}`;
    const requirements = [target.bounces ? `反射${target.bounces}回以上` : '', target.mirror ? '鏡を通る' : ''].filter(Boolean);
    condition.textContent = requirements.join(' ＋ ') || '反射条件なし';
    li.append(label, condition); return li;
  }));
}
function sync() {
  syncConditions();
  $('room').textContent = `${String(room + 1).padStart(2, '0')} / 06`; $('room-name').textContent = chamber().name;
  $('shots').textContent = round.shots; $('relays').textContent = `${displayedActivated} / ${chamber().targets.length}`; $('angle').textContent = `${angle.toFixed(1)}°`; $('room-note').textContent = chamber().note;
  $('progress').replaceChildren(...CHAMBERS.map((_, i) => { const li = document.createElement('li'); li.textContent = medals[i] ? ['','銅','銀','金'][medals[i]] : i + 1; li.className = i === room ? 'current' : medals[i] ? 'complete' : ''; li.setAttribute('aria-label', `部屋${i + 1}${medals[i] ? 'クリア' : i === room ? '挑戦中' : '未クリア'}`); return li; }));
  $('fire').disabled = mode !== 'aiming'; $('left').disabled = $('right').disabled = mode !== 'aiming';
  $('retry').disabled = !['aiming', 'flying', 'clear', 'fail', 'paused'].includes(mode); $('pause').disabled = !['aiming', 'flying', 'paused'].includes(mode);
  $('pause').textContent = mode === 'paused' ? '再開' : '一時停止';
  $('mirrors').replaceChildren(...chamber().mirrors.map((_, i) => { const button = document.createElement('button'); button.type = 'button'; button.className = `button secondary ${i === selectedMirror ? 'selected' : ''}`; button.textContent = `鏡${String.fromCharCode(65 + i)} ${round.orientations[i] ? '＼' : '／'} ↻`; button.setAttribute('aria-label', `鏡${String.fromCharCode(65 + i)}の向きを切り替える`); button.disabled = mode !== 'aiming'; button.addEventListener('click', () => rotate(i)); return button; }));
}
function overlay(label, title, copy, action) { $('result-label').textContent = label; $('result-title').textContent = title; $('result-copy').textContent = copy; $('advance').textContent = action; $('overlay').hidden = false; }
function loadRoom() { stopLoop(); round = createRound(chamber()); angle = chamber().aim; selectedMirror = 0; flight = null; flightProgress = 0; displayedActivated = 0; mode = 'aiming'; $('overlay').hidden = true; $('status').textContent = chamber().note; sync(); draw(); focusBoard(); }
function begin() { session.reset(); room = 0; medals = []; loadRoom(); if (!session.start()) return; }
function rotate(index = selectedMirror) { if (!session.check() || mode !== 'aiming' || !chamber().mirrors[index]) return; selectedMirror = index; round.orientations[index] = 1 - round.orientations[index]; $('status').textContent = `鏡${String.fromCharCode(65 + index)}を回転しました。点線で最初の2反射を確認できます。`; sync(); draw(); focusBoard(); }
function adjust(delta) { if (!session.check() || mode !== 'aiming') return; angle = Math.round(((angle + delta + 540) % 360 - 180) * 10) / 10; sync(); draw(); }
function completeShot() {
  stopLoop(); displayedActivated = round.activated;
  if (round.result === 'clear') {
    medals[room] = round.used === 1 ? 3 : round.used === 2 ? 2 : 1;
    if (room === CHAMBERS.length - 1) {
      if (!session.finish()) return; mode = 'complete'; const score = medals.reduce((a, b) => a + b, 0);
      if (score > best) { best = score; saveBest('ricochet-relay', best); $('best').textContent = best; }
      overlay('ALL CIRCUITS CONNECTED', '6つの回路が、つながった。', `${score} / 18点。金${medals.filter(m => m === 3).length}・銀${medals.filter(m => m === 2).length}・銅${medals.filter(m => m === 1).length}。次は1本の光で、全室の金メダルを目指そう。`, 'もう一度、全6室 →'); $('status').textContent = `全6室クリア。${score}点を記録しました。`;
    } else { mode = 'clear'; overlay('CHAMBER CONNECTED', `${['','銅','銀','金'][medals[room]]}メダル。回路、起動。`, `${round.used}発で部屋${room + 1}をクリア。次の部屋では新しい反射ルートを探そう。`, '次の部屋へ →'); $('status').textContent = `部屋${room + 1}クリア。${round.used}発。Enterで次の部屋へ。`; }
  } else if (round.result === 'fail') { mode = 'fail'; overlay('PULSES EMPTY', 'もう一度、角度を読もう。', `${displayedActivated} / ${chamber().targets.length}起動。${flight.reason === 'order' ? '未来の番号に先に触れました。' : flight.reason === 'shield' ? '必要な反射回数・鏡の条件を確認しよう。' : '光がリレーに届きませんでした。'}この部屋から再挑戦できます。`, 'この部屋に再挑戦 →'); $('status').textContent = '弾切れ。この部屋から再挑戦できます。';
  } else { mode = 'aiming'; $('status').textContent = flight.reason === 'order' ? '順番が違うリレーで光が停止。起動済みは残ります。次の番号へ。' : flight.reason === 'shield' ? '反射条件が足りず停止。数字の「+」と「鏡」マークを確認しよう。' : `${displayedActivated}個起動。次は${displayedActivated + 1}番。角度や鏡を調整しよう。`; }
  sync(); draw(); focusBoard();
}
function tick(timestamp) {
  frameId = null; if (!session.check() || mode !== 'flying') return;
  if (lastTime !== null) flightProgress += Math.min(60, timestamp - lastTime) * (reducedMotion ? 4 : .75); lastTime = timestamp;
  displayedActivated = Math.max(displayedActivated, ...flight.hits.filter(h => h.kind === 'relay' && h.distance <= flightProgress).map(h => h.index + 1));
  $('relays').textContent = `${displayedActivated} / ${chamber().targets.length}`; syncConditions(); draw();
  if (flightProgress >= flight.distance) { completeShot(); return; } frameId = requestAnimationFrame(tick);
}
function fire() { if (!session.check() || mode !== 'aiming') return; flight = shoot(chamber(), round, angle); flightProgress = 0; mode = 'flying'; $('status').textContent = 'パルス進行中…'; sync(); focusBoard(); lastTime = null; frameId = requestAnimationFrame(tick); }
function retry() { if (!session.check() || !['aiming', 'flying', 'clear', 'fail', 'paused'].includes(mode)) return; delete medals[room]; loadRoom(); $('status').textContent = 'この部屋をやり直しました。残り時間はそのまま進みます。'; }
function pause() { if (!session.check()) return; if (mode === 'paused') { mode = pausedMode; $('overlay').hidden = true; if (mode === 'flying') frameId = requestAnimationFrame(tick); $('status').textContent = '再開しました。'; sync(); draw(); focusBoard(); return; } if (!['aiming', 'flying'].includes(mode)) return; pausedMode = mode; mode = 'paused'; stopLoop(); overlay('PAUSED', '光を、ひと休み。', 'ゲームは止まっています。残り時間は別タブや一時停止中も進みます。', '同じ場所から再開 →'); sync(); draw(); focusBoard(); }
function advance() { if (mode === 'ready' || mode === 'complete' || mode === 'timeout') begin(); else if (mode === 'clear' && session.check()) { room++; loadRoom(); } else if (mode === 'fail') retry(); else if (mode === 'paused') pause(); }
$('advance').addEventListener('click', advance); $('fire').addEventListener('click', fire); $('retry').addEventListener('click', retry); $('pause').addEventListener('click', pause);
$('left').addEventListener('click', () => { adjust(-1); focusBoard(); }); $('right').addEventListener('click', () => { adjust(1); focusBoard(); });
window.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey || event.target.closest('a')) return;
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', ' ', 'm', 'r', 'p', 'escape', 'enter'].includes(key)) {
    // Tab-focused buttons retain their ordinary keyboard activation.
    if (event.target.tagName === 'BUTTON' && [' ', 'enter'].includes(key)) return;
    event.preventDefault(); if (!session.check()) return;
    if (key === 'arrowleft') adjust(event.shiftKey ? -.2 : -1); else if (key === 'arrowright') adjust(event.shiftKey ? .2 : 1);
    else if (!event.repeat && key === ' ') fire(); else if (!event.repeat && key === 'm' && mode === 'aiming' && chamber().mirrors.length) { selectedMirror = (selectedMirror + 1) % chamber().mirrors.length; sync(); draw(); }
    else if (!event.repeat && key === 'r') rotate(); else if (!event.repeat && ['p', 'escape'].includes(key)) pause(); else if (!event.repeat && key === 'enter' && mode !== 'aiming' && mode !== 'flying') advance();
  }
});
function aimPointer(event) { const rect = canvas.getBoundingClientRect(), x = (event.clientX - rect.left) * WIDTH / rect.width, y = (event.clientY - rect.top) * HEIGHT / rect.height; const source = chamber().source; if (Math.hypot(x - source.x, y - source.y) < 16) return; angle = Math.round(Math.atan2(y - source.y, x - source.x) * 1800 / Math.PI) / 10; sync(); draw(); }
canvas.addEventListener('pointerdown', event => { if (!session.check() || mode !== 'aiming' || event.button !== 0) return; event.preventDefault(); focusBoard(); dragging = event.pointerId; canvas.setPointerCapture(dragging); aimPointer(event); });
canvas.addEventListener('pointermove', event => { if (event.pointerId === dragging && mode === 'aiming' && session.check()) aimPointer(event); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, event => { if (event.pointerId === dragging) dragging = null; });
window.addEventListener('blur', () => { if (mode === 'aiming' || mode === 'flying') pause(); }); document.addEventListener('visibilitychange', () => { if (document.hidden && ['aiming', 'flying'].includes(mode)) pause(); });
const session = createGameSession({ onExpire() { stopLoop(); mode = 'timeout'; flight = null; round.result = 'timeout'; overlay('TIME UP', '30分で、この回路は終了。', `${room} / 6室クリア。途中のプレイはクリア記録に保存されません。新しいプレイで再挑戦しよう。`, '新しいプレイ →'); $('status').textContent = '時間切れ。全6室を終えていないため記録は保存されません。'; sync(); draw(); } });
sync(); draw();

window.addEventListener('resize', draw);
