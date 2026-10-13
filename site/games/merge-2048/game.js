import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { moveBoard, spawnTile, canMove } from './logic.js';
mountShell({ title: 'マージ2048', english: 'MERGE 2048', description: '数字を重ねる、小さなひらめき。', accent: '#b8a0f7', controls: ['矢印キーで移動', 'スワイプでも遊べます'] });
const $ = id => document.getElementById(id);
const boardElement = $('board');
let board, score = 0, best = Number(loadBest('merge-2048', 0)) || 0, won = false, lost = false;
let pointerStart = null;
const tiles = Array.from({ length: 16 }, (_, index) => {
  const tile = document.createElement('div');
  tile.className = 'merge-tile';
  tile.setAttribute('aria-label', `${Math.floor(index / 4) + 1}行${index % 4 + 1}列、空き`);
  boardElement.append(tile);
  return tile;
});
function render() {
  board.forEach((value, i) => {
    tiles[i].textContent = value || '';
    tiles[i].dataset.value = value;
    tiles[i].dataset.level = value ? Math.min(12, Math.log2(value)) : 0;
    tiles[i].setAttribute('aria-label', `${Math.floor(i / 4) + 1}行${i % 4 + 1}列、${value || '空き'}`);
    tiles[i].classList.toggle('large-number', value >= 1024);
  });
  $('score').textContent = score.toLocaleString('ja-JP');
  $('best').textContent = best.toLocaleString('ja-JP');
}
function showResult(type) {
  const victory = type === 'win';
  $('result-symbol').textContent = victory ? '✦' : '↻';
  $('result-title').textContent = victory ? '2048、達成！' : 'また、次の一手へ。';
  $('result-message').textContent = victory ? '数字はまだ育てられます。どこまで行ける？' : `今回のスコアは ${score.toLocaleString('ja-JP')}。もう一度挑戦しよう。`;
  $('result-action').textContent = victory ? '続けて遊ぶ' : 'もう一度';
  $('result-action').dataset.action = victory ? 'continue' : 'restart';
  $('result').hidden = false;
}
function restart() {
  board = spawnTile(spawnTile(Array(16).fill(0)));
  score = 0; won = false; lost = false;
  $('result').hidden = true;
  $('status').textContent = '同じ数字を重ねて、2048を目指そう。';
  render();
}
function move(direction) {
  if (lost || !$('result').hidden) return;
  const result = moveBoard(board, direction);
  if (!result.changed) {
    $('status').textContent = 'その方向には動かせません。別の方向を試そう。';
    return;
  }
  board = spawnTile(result.board);
  score += result.score;
  if (score > best) { best = score; saveBest('merge-2048', best); }
  render();
  boardElement.classList.remove('moved');
  void boardElement.offsetWidth;
  boardElement.classList.add('moved');
  $('status').textContent = result.score ? `${result.score}ポイント！ いちばん大きなタイルは ${Math.max(...board)}。` : '次のタイルが現れました。';
  if (!won && board.some(value => value >= 2048)) { won = true; showResult('win'); $('status').textContent = '2048達成！ 続けて遊ぶこともできます。'; }
  else if (!canMove(board)) { lost = true; showResult('lose'); $('status').textContent = '動かせるタイルがなくなりました。'; }
}
$('restart').addEventListener('click', restart);
$('result-action').addEventListener('click', () => {
  if ($('result-action').dataset.action === 'restart') restart();
  else { $('result').hidden = true; if (!canMove(board)) { lost = true; showResult('lose'); } }
  boardElement.focus({ preventScroll: true });
});
document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => move(button.dataset.direction)));
document.addEventListener('keydown', event => {
  const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
  if (!direction || event.altKey || event.ctrlKey || event.metaKey || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  event.preventDefault();
  move(direction);
});
boardElement.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  boardElement.setPointerCapture(event.pointerId);
});
boardElement.addEventListener('pointerup', event => {
  if (!pointerStart || pointerStart.id !== event.pointerId) return;
  const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
});
boardElement.addEventListener('pointercancel', () => { pointerStart = null; });
restart();
