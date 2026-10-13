import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createField, revealCells, hasWon } from './logic.js';
mountShell({ title: 'マインフィールド', english: 'MINEFIELD', description: '手がかりをつなぎ、安全な道を見つけよう。', accent: '#f5cf67', controls: ['クリックで開く / 右クリックで旗', '最初の一手は必ず安全'] });
const $ = id => document.getElementById(id);
const SIZE = 9, MINE_COUNT = 10;
let cells, started = false, ended = false, victory = false, flagMode = false, focusIndex = 0, startedAt = 0, elapsed = 0, clock = null;
let best = Number(loadBest('minesweeper', 0)) || 0;
const buttons = [];
for (let row = 0; row < SIZE; row++) {
  const rowElement = document.createElement('div');
  rowElement.className = 'mine-row';
  rowElement.setAttribute('role', 'row');
  for (let col = 0; col < SIZE; col++) {
    const index = row * SIZE + col;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mine-cell';
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-rowindex', row + 1);
    button.setAttribute('aria-colindex', col + 1);
    button.addEventListener('click', () => flagMode ? toggleFlag(index) : openCell(index));
    button.addEventListener('contextmenu', event => { event.preventDefault(); toggleFlag(index); });
    button.addEventListener('focus', () => { focusIndex = index; setTabStops(); });
    button.addEventListener('keydown', event => handleKey(event, index));
    rowElement.append(button);
    buttons.push(button);
  }
  $('board').append(rowElement);
}
function setTabStops() { buttons.forEach((button, index) => { button.tabIndex = index === focusIndex ? 0 : -1; }); }
function displayTime() { $('time').textContent = String(elapsed).padStart(3, '0'); }
function tick() { if (started && !ended) { elapsed = Math.floor((Date.now() - startedAt) / 1000); displayTime(); } }
function render() {
  const flagged = cells.filter(cell => cell.flagged).length;
  $('remaining').textContent = MINE_COUNT - flagged;
  $('best').textContent = best || '—';
  buttons.forEach((button, index) => {
    const cell = cells[index];
    const visibleMine = ended && cell.mine;
    const wrongFlag = ended && !victory && cell.flagged && !cell.mine;
    button.className = `mine-cell${cell.revealed ? ' revealed' : ''}${cell.flagged ? ' flagged' : ''}${visibleMine ? ' mine' : ''}${visibleMine && cell.revealed ? ' hit' : ''}${wrongFlag ? ' wrong-flag' : ''}`;
    button.dataset.number = cell.revealed && !cell.mine ? cell.adjacent : '';
    button.textContent = wrongFlag ? '×' : visibleMine ? (victory ? '⚑' : '✳') : cell.flagged ? '⚑' : cell.revealed && cell.adjacent ? cell.adjacent : '';
    const state = wrongFlag ? '旗の場所に地雷はありませんでした' : visibleMine ? (victory ? '地雷、正解' : '地雷') : cell.flagged ? '旗あり' : cell.revealed ? (cell.adjacent ? `周囲の地雷${cell.adjacent}個` : '安全、周囲に地雷なし') : '未確認';
    button.setAttribute('aria-label', `${Math.floor(index / SIZE) + 1}行${index % SIZE + 1}列、${state}`);
    button.setAttribute('aria-disabled', String(ended));
  });
  setTabStops();
}
function finish(win) {
  tick();
  ended = true; victory = win;
  clearInterval(clock); clock = null;
  if (win) {
    elapsed = Math.max(1, Math.ceil((Date.now() - startedAt) / 1000));
    if (!best || elapsed < best) { best = elapsed; saveBest('minesweeper', best); }
    $('status').textContent = `クリア！ ${elapsed}秒ですべての安全なマスを開きました。`;
  } else $('status').textContent = '地雷を発見！ リスタートで、もう一度挑戦しよう。';
  displayTime();
  $('end-title').textContent = win ? 'すべての道が、ひらけた！' : '惜しい！ 次はきっと。';
  $('end-description').textContent = win ? `${elapsed}秒でクリア。見事な読みでした。` : '数字を見比べながら、新しい盤面に挑戦しよう。';
  $('end-symbol').textContent = win ? '✦' : '↻';
  $('end-message').hidden = false;
  $('end-message').classList.toggle('success', win);
  render();
}
function openCell(index) {
  if (ended || cells[index].flagged || cells[index].revealed) return;
  if (!started) {
    const flags = cells.map(cell => cell.flagged);
    cells = createField(SIZE, MINE_COUNT, index);
    cells.forEach((cell, i) => { cell.flagged = flags[i]; });
    started = true; startedAt = Date.now();
    clock = setInterval(tick, 250);
  }
  const result = revealCells(cells, SIZE, index);
  cells = result.cells;
  if (result.hit) { finish(false); return; }
  if (hasWon(cells)) { finish(true); return; }
  const opened = cells.filter(cell => cell.revealed).length;
  $('status').textContent = `安全なマス ${opened} / ${SIZE * SIZE - MINE_COUNT}。数字から次の一手を見つけよう。`;
  render();
}
function toggleFlag(index) {
  if (ended || cells[index].revealed) return;
  if (!cells[index].flagged && cells.filter(cell => cell.flagged).length >= MINE_COUNT) {
    $('status').textContent = '旗は10本まで。ほかの旗を外すと、ここに置けます。'; return;
  }
  cells[index].flagged = !cells[index].flagged;
  $('status').textContent = cells[index].flagged ? '旗を置きました。安全なマスを開いていこう。' : '旗を外しました。';
  render();
}
function handleKey(event, index) {
  if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFlag(index); return; }
  let next = index;
  const row = Math.floor(index / SIZE), col = index % SIZE;
  if (event.key === 'ArrowLeft') next = row * SIZE + Math.max(0, col - 1);
  else if (event.key === 'ArrowRight') next = row * SIZE + Math.min(SIZE - 1, col + 1);
  else if (event.key === 'ArrowUp') next = Math.max(0, row - 1) * SIZE + col;
  else if (event.key === 'ArrowDown') next = Math.min(SIZE - 1, row + 1) * SIZE + col;
  else if (event.key === 'Home') next = event.ctrlKey ? 0 : row * SIZE;
  else if (event.key === 'End') next = event.ctrlKey ? SIZE * SIZE - 1 : row * SIZE + SIZE - 1;
  else return;
  event.preventDefault(); focusIndex = next; setTabStops(); buttons[next].focus({ preventScroll: true });
}
function restart() {
  clearInterval(clock); clock = null;
  cells = Array.from({ length: SIZE * SIZE }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false }));
  started = false; ended = false; victory = false; flagMode = false; elapsed = 0; focusIndex = 0;
  $('flag-mode').setAttribute('aria-pressed', 'false');
  $('mode-label').textContent = '旗モード OFF';
  $('end-message').hidden = true;
  $('status').textContent = '好きなマスを開こう。最初の一手は安全です。';
  displayTime(); render();
}
$('restart').addEventListener('click', restart);
$('flag-mode').addEventListener('click', () => {
  flagMode = !flagMode;
  $('flag-mode').setAttribute('aria-pressed', String(flagMode));
  $('mode-label').textContent = `旗モード ${flagMode ? 'ON' : 'OFF'}`;
  $('status').textContent = flagMode ? '旗モードON。マスを押すと旗を置いたり外したりできます。' : '旗モードOFF。マスを押すと開きます。';
});
restart();
