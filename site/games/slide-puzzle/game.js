import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { shuffleBoard, moveTile, directionTarget, isSolved, countCorrect, formatElapsed } from './logic.js';

mountShell({ title: 'スライド15', english: 'SLIDE FIFTEEN', description: 'ひとつの余白を手がかりに、15の数字を定位置へ。', accent: '#c3aff0', controls: ['空白の上下左右にある数字をクリック / タップして動かす', '盤面を選んで矢印キー。矢印の方向へ空白が動きます', '1〜15を左上から順に並べ、右下を空白にするとクリア', '「同じ盤面をやり直す」で手数と時間をリセット。「新しい盤面」でシャッフル'] });
const boardElement = document.querySelector('#board');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const moveLabel = document.querySelector('#moves');
const timeLabel = document.querySelector('#time');
const directionButtons = [...document.querySelectorAll('[data-direction]')];
let initialBoard, board, moves = 0, startedAt = null, elapsed = 0, timer = null, won = false, timedOut = false;
let best = loadBest('slide-puzzle', 0);
if (!Number.isInteger(best) || best < 1) best = 0;
const cells = Array.from({ length: 16 }, (_, index) => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'tile';
  button.addEventListener('click', () => slide(index));
  boardElement.append(button);
  return button;
});
function updateClock() {
  if (!session.check()) return;
  if (startedAt !== null && !won) elapsed = performance.now() - startedAt;
  timeLabel.textContent = formatElapsed(elapsed);
}
function render() {
  const blank = board.indexOf(0);
  cells.forEach((cell, index) => {
    const value = board[index];
    const available = !won && !timedOut && moveTile(board, index) !== null;
    cell.textContent = value || '';
    cell.classList.toggle('is-blank', value === 0);
    cell.classList.toggle('can-move', available);
    cell.classList.toggle('is-correct', value !== 0 && value === index + 1);
    cell.setAttribute('aria-label', `${Math.floor(index / 4) + 1}行${index % 4 + 1}列、${value ? `数字${value}${available ? '、空白へ動かせます' : '、今は動かせません'}` : '空白'}`);
    cell.setAttribute('aria-disabled', String(!available));
    cell.tabIndex = value === 0 ? -1 : 0;
  });
  moveLabel.textContent = moves;
  document.querySelector('#progress').textContent = `${countCorrect(board)} / 15 定位置`;
  directionButtons.forEach(button => { button.disabled = won || timedOut || directionTarget(board, button.dataset.direction) < 0; });
  boardElement.classList.toggle('is-won', won);
  return blank;
}
function showBest() { document.querySelector('#best').textContent = best || '—'; }
function finish() {
  if (!session.finish()) return;
  result.querySelector('h2').textContent = 'ぴたり、そろった！';
  result.querySelector('.eyebrow').textContent = 'PERFECTLY IN PLACE';
  updateClock(); won = true; clearInterval(timer); timer = null;
  const improved = best === 0 || moves < best;
  if (improved) { best = moves; saveBest('slide-puzzle', best); showBest(); }
  document.querySelector('#result-detail').textContent = `${moves}手 · ${formatElapsed(elapsed)}${improved ? ' · 自己ベスト更新！' : ' · おみごと！'}`;
  result.hidden = false;
  status.textContent = `クリア！ ${moves}手、${formatElapsed(elapsed)}ですべての数字がそろいました。${improved ? '自己ベストを更新しました。' : ''}`;
}
function slide(index) {
  if (!session.check() || won || timedOut) return;
  const next = moveTile(board, index);
  if (next === null) {
    status.textContent = '空白の上下左右にある数字を選んでください。';
    return;
  }
  const oldBlank = board.indexOf(0), value = board[index];
  const tileHadFocus = document.activeElement === cells[index];
  if (!session.start()) return;
  if (startedAt === null) { startedAt = performance.now(); timer = setInterval(updateClock, 250); }
  board = next; moves += 1;
  if (isSolved(board)) finish();
  else status.textContent = `${value}をスライド。あと${15 - countCorrect(board)}枚を定位置へ。`;
  render();
  if (tileHadFocus) cells[oldBlank].focus({ preventScroll: true });
}
function slideDirection(direction) {
  if (!session.check() || won || timedOut) return;
  const index = directionTarget(board, direction);
  if (index < 0) { status.textContent = 'その方向には空白を動かせません。'; return; }
  slide(index);
}
function reset(newBoard = false, focus = false) {
  session.reset();
  clearInterval(timer); timer = null;
  if (newBoard || !initialBoard) initialBoard = shuffleBoard();
  board = [...initialBoard]; moves = 0; startedAt = null; elapsed = 0; won = false; timedOut = false;
  result.hidden = true;
  status.textContent = '空白のとなりの数字から。最初の一手でタイマーが動きます。';
  updateClock(); render();
  if (focus) boardElement.focus({ preventScroll: true });
}
boardElement.addEventListener('keydown', event => {
  const direction = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[event.key];
  if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault(); slideDirection(direction);
});
directionButtons.forEach(button => button.addEventListener('click', () => slideDirection(button.dataset.direction)));
document.querySelector('#new-game').addEventListener('click', () => reset(true, true));
document.querySelector('#restart').addEventListener('click', () => reset(false, true));
document.querySelector('#play-again').addEventListener('click', () => reset(true, true));
const session = createGameSession({ onExpire() {
  timedOut = true; clearInterval(timer); timer = null; elapsed = 30 * 60 * 1000;
  timeLabel.textContent = formatElapsed(elapsed);
  status.textContent = '時間切れ。30分になったため、このパズルは終了しました。';
  result.querySelector('h2').textContent = '時間切れ。もう一度挑戦しよう。';
  result.querySelector('.eyebrow').textContent = 'TIME UP';
  document.querySelector('#result-detail').textContent = `${moves}手 · ${countCorrect(board)} / 15枚が定位置。未クリアの記録はベストに含めません。`;
  result.hidden = false; render();
} });
showBest(); reset(true);
