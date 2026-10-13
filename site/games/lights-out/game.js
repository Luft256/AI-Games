import { mountShell, loadBest, saveBest, formatTime } from '../../shared/game-shell.js';
import { SIZE, CELL_COUNT, affectedCells, toggleLight, countLights, isSolved, createPuzzle, nextCell } from './logic.js';

mountShell({
  title: 'ライツアウト', english: 'LIGHTS OUT', accent: '#e7d281',
  description: 'ひとつ押すと、となりも変わる。すべてのライトを消す、静かなひらめきパズル。',
  controls: ['クリック / タップで、押したマスと上下左右のライトを反転', 'Tabで盤面へ。矢印キーで選択、Enter / Spaceで反転', 'すべて消したらクリア。リスタートは同じ盤面、新しい盤面は別の問題']
});

const boardElement = document.querySelector('#board');
const movesElement = document.querySelector('#moves');
const timeElement = document.querySelector('#time');
const remainingElement = document.querySelector('#remaining');
const statusElement = document.querySelector('#status');
const resultElement = document.querySelector('#result');
const bestElement = document.querySelector('#best');
let initialBoard = createPuzzle().board;
let board = [...initialBoard];
let moves = 0;
let selectedCell = 12;
let highlightedCell = null;
let startedAt = null;
let timer = null;
let finished = false;
let best = loadBest('lights-out', 0);
const cells = [];

function showBest() { bestElement.textContent = best || '—'; }
function updateTime() {
  const elapsed = startedAt === null ? 0 : (performance.now() - startedAt) / 1000;
  timeElement.textContent = formatTime(elapsed);
  return elapsed;
}
function selectCell(index, focus = false) {
  selectedCell = index;
  cells.forEach((cell, cellIndex) => { cell.tabIndex = cellIndex === index ? 0 : -1; });
  if (focus) cells[index].focus();
}
function highlight(index) {
  highlightedCell = index;
  const affected = index === null || finished ? [] : affectedCells(index);
  cells.forEach((cell, cellIndex) => { cell.classList.toggle('is-affected', affected.includes(cellIndex)); });
}
function render() {
  const remaining = countLights(board);
  movesElement.textContent = moves;
  remainingElement.textContent = remaining;
  cells.forEach((cell, index) => {
    cell.classList.toggle('is-on', board[index] === 1);
    cell.setAttribute('aria-pressed', String(board[index] === 1));
    cell.setAttribute('aria-disabled', String(finished));
    cell.setAttribute('aria-label', `${Math.floor(index / SIZE) + 1}行${index % SIZE + 1}列、${board[index] ? '点灯' : '消灯'}${finished ? '、クリア済み' : ''}`);
  });
  boardElement.classList.toggle('is-solved', finished);
  highlight(highlightedCell);
}
function finish() {
  finished = true;
  clearInterval(timer);
  timer = null;
  const elapsed = updateTime();
  const improved = best === 0 || moves < best;
  if (improved) { best = moves; saveBest('lights-out', best); showBest(); }
  statusElement.textContent = `クリア！ ${moves}手、${formatTime(elapsed)}ですべて消灯しました。${improved ? '自己ベスト更新！' : ''}`;
  document.querySelector('#result-detail').textContent = `${moves}手 · ${formatTime(elapsed)}${improved ? ' · 自己ベスト更新！' : ' · お見事！'}`;
  resultElement.hidden = false;
}
function play(index) {
  if (finished) return;
  selectCell(index);
  if (startedAt === null) { startedAt = performance.now(); timer = setInterval(updateTime, 250); }
  board = toggleLight(board, index);
  moves += 1;
  if (isSolved(board)) finish();
  else statusElement.textContent = `${Math.floor(index / SIZE) + 1}行${index % SIZE + 1}列を反転。あと${countLights(board)}個のライトが点灯しています。`;
  render();
}
function reset() {
  clearInterval(timer);
  timer = null;
  board = [...initialBoard];
  moves = 0;
  startedAt = null;
  finished = false;
  resultElement.hidden = true;
  timeElement.textContent = '0:00';
  statusElement.textContent = 'すべてのライトを消そう。最初の1手から計時します。';
  render();
}
function newBoard(focus = false) {
  let next = createPuzzle().board;
  // Even with a repeated random result, the “new” board is different and solvable.
  if (next.every((value, index) => value === initialBoard[index])) {
    next = toggleLight(next, 12);
    if (isSolved(next)) next = toggleLight(next, 0);
  }
  initialBoard = next;
  selectCell(12);
  reset();
  if (focus) cells[selectedCell].focus();
}

for (let index = 0; index < CELL_COUNT; index += 1) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'light-cell';
  button.innerHTML = '<span class="light-core" aria-hidden="true"><span class="light-mark"></span></span><span class="cell-coordinate" aria-hidden="true"></span>';
  button.querySelector('.cell-coordinate').textContent = `${Math.floor(index / SIZE) + 1}·${index % SIZE + 1}`;
  button.addEventListener('click', () => play(index));
  button.addEventListener('focus', () => { selectCell(index); highlight(index); });
  button.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') highlight(index); });
  button.addEventListener('pointerleave', () => {
    const focusIndex = cells.indexOf(document.activeElement);
    highlight(focusIndex < 0 ? null : focusIndex);
  });
  cells.push(button);
  boardElement.append(button);
}
boardElement.addEventListener('focusout', (event) => {
  if (!boardElement.contains(event.relatedTarget)) highlight(null);
});
boardElement.addEventListener('keydown', (event) => {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); return; }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  if (!cells.includes(document.activeElement)) return;
  event.preventDefault();
  selectCell(nextCell(selectedCell, event.key, event.ctrlKey || event.metaKey), true);
});
document.querySelector('#restart').addEventListener('click', reset);
document.querySelector('#new-board').addEventListener('click', () => newBoard());
document.querySelector('#play-again').addEventListener('click', () => newBoard(true));
showBest();
selectCell(selectedCell);
reset();
