import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { SIZE, MOVE_LIMIT, TARGET, seededRandom, adjacent, swap, findMatches, legalMoves, makeBoard, createQueues, collapse, waveScore, reshuffle, nextCell } from './logic.js';

mountShell({ title: 'カラーカスケード', english: 'COLOR CASCADE', accent: '#c8eb88', description: '落ちる色を読んで、連鎖をつくる。20手で6,000点に挑む、色と記号のパズル。', controls: ['隣り合う2マスをタップ / クリックして交換。同じ記号を縦か横に3つ以上そろえる。', '矢印キーで移動、Enter / Spaceで決定、Escで選択解除、Hでヒント。', '補充後にまたそろうと連鎖倍率アップ。ボーナス記号は2倍、5手ごとに変わる。', '20手でラウンド終了。ヒントやそろわない交換は手数を使わない。'] });
const symbols = ['●', '◆', '▲', '✚', '★'];
const names = ['丸', 'ひし形', '三角', '十字', '星'];
const $ = selector => document.querySelector(selector);
const boardElement = $('#board'), forecastElement = $('#forecast');
const cells = [];
let seed = Math.floor(Math.random() * 4294967296), random, board, queues;
let score = 0, moves = 0, maxCombo = 0, selected = null, focused = 0, hintPair = null;
let busy = false, finished = false, generation = 0, resolvingBonus = null;
let best = loadBest('color-cascade');
const pending = new Map();
function cancelAnimations() {
  generation++;
  for (const [timer, resolve] of pending) { clearTimeout(timer); resolve(false); }
  pending.clear(); boardElement.classList.remove('is-falling');
  cells.forEach(cell => cell.classList.remove('is-clearing'));
}
function delay(ms, token) {
  return new Promise(resolve => {
    const timer = setTimeout(() => { pending.delete(timer); resolve(token === generation && session.check() && !finished); }, ms);
    pending.set(timer, resolve);
  });
}
function bonusColor() { return (Math.floor(Math.min(moves, MOVE_LIMIT - 1) / 5) + seed % 5) % 5; }
function focusCell(index, focus = false) {
  focused = index; cells.forEach((cell, i) => cell.tabIndex = i === index ? 0 : -1);
  if (focus) cells[index].focus();
}
function render() {
  $('#score').textContent = score.toLocaleString('ja-JP'); $('#moves').textContent = MOVE_LIMIT - moves; $('#combo').textContent = maxCombo;
  $('#goal-fill').style.width = `${Math.min(100, score / TARGET * 100)}%`;
  $('.goal-track').setAttribute('aria-valuenow', Math.min(TARGET, score));
  const bonus = resolvingBonus ?? bonusColor(); $('#bonus-label').textContent = `${symbols[bonus]} 2倍 · ${finished ? '終了' : busy ? '連鎖中' : `あと${5 - moves % 5}手`}`;
  cells.forEach((cell, i) => {
    cell.className = `tile c${board[i]}`;
    cell.textContent = symbols[board[i]];
    cell.classList.toggle('is-selected', i === selected);
    cell.classList.toggle('is-neighbor', selected !== null && adjacent(selected, i));
    cell.classList.toggle('is-hint', !busy && !finished && Boolean(hintPair?.includes(i)));
    cell.setAttribute('aria-pressed', String(i === selected));
    cell.setAttribute('aria-disabled', String(busy || finished));
    cell.setAttribute('aria-label', `${Math.floor(i / SIZE) + 1}行${i % SIZE + 1}列 ${names[board[i]]}${hintPair?.includes(i) && !busy && !finished ? '、ヒントの交換ペア' : ''}${board[i] === bonus ? '、得点2倍' : ''}`);
  });
  forecastElement.replaceChildren();
  queues.forEach((queue, col) => {
    const column = document.createElement('div'); column.className = 'forecast-column'; column.setAttribute('role', 'group');
    column.setAttribute('aria-label', `${col + 1}列の補充順 ${queue.slice(0, 3).map(n => names[n]).join('、')}`);
    queue.slice(0, 3).forEach((n, order) => {
      const chip = document.createElement('span'); chip.className = 'forecast-chip'; chip.setAttribute('aria-hidden', 'true');
      const label = document.createElement('small'); label.className = 'forecast-order'; label.textContent = String(order + 1);
      const symbol = document.createElement('b'); symbol.textContent = symbols[n]; chip.append(label, symbol); column.append(chip);
    });
    forecastElement.append(column);
  });
  $('#hint').disabled = busy || finished;
  boardElement.setAttribute('aria-busy', String(busy));
}
function showHint(initial = false) {
  if (busy || finished || !session.check()) return;
  hintPair = legalMoves(board)[0]; selected = null;
  $('#status').textContent = initial ? '点線の2つを交換すると、3つそろいます。別の手を探してもOK。最初の交換から計時します。' : `点線の${names[board[hintPair[0]]]}と${names[board[hintPair[1]]]}を交換できます。ヒントは無料。補充の色も見てみよう。`;
  render();
}
function complete() {
  if (!session.finish()) return;
  finished = true; busy = false; selected = null; hintPair = null;
  const improved = score > best;
  if (improved) { best = score; saveBest('color-cascade', best); $('#best').textContent = best.toLocaleString('ja-JP'); }
  const rank = score >= 9000 ? 'カスケード・マスター！' : score >= 7500 ? '見事な連鎖の読み！' : score >= TARGET ? '6,000点クリア！' : '次の連鎖を探そう。';
  $('#result-label').textContent = score >= TARGET ? 'TARGET CLEARED' : 'ROUND COMPLETE';
  $('#result-title').textContent = rank;
  $('#result-detail').textContent = `${score.toLocaleString('ja-JP')}点 · 最大${maxCombo}連鎖 · 20手完了。${improved ? '自己ベスト更新！' : ''}${score < TARGET ? ' 次は2倍の記号と補充を読んで6,000点へ。' : ''}`;
  $('#status').textContent = `ラウンド終了。${score.toLocaleString('ja-JP')}点、最大${maxCombo}連鎖。${rank}`;
  $('#burst').textContent = '20手、完了。'; $('#gain').textContent = ''; $('#result').hidden = false; render();
}
async function play(index) {
  if (busy || finished || !session.check()) return;
  focusCell(index);
  if (selected === index) { selected = null; render(); return; }
  if (selected === null || !adjacent(selected, index)) { selected = index; hintPair = null; $('#status').textContent = `${names[board[index]]}を選択。上下左右のとなりを選んで交換。もう一度押すと解除。`; render(); return; }
  const first = selected, next = swap(board, first, index);
  if (!findMatches(next).length) { selected = null; hintPair = null; $('#status').textContent = 'この交換では3つそろいません。手数はそのまま。ヒントで交換できるペアを確認できます。'; render(); return; }
  if (!session.start()) return;
  const token = generation, bonus = bonusColor();
  busy = true; resolvingBonus = bonus; selected = null; hintPair = null; moves++; board = next;
  let combo = 0, turnScore = 0, matches = findMatches(board);
  $('#burst').textContent = '色をそろえて…'; $('#gain').textContent = ''; render();
  if (!await delay(180, token)) return;
  while (matches.length) {
    combo++; const points = waveScore(board, matches, combo, bonus); score += points; turnScore += points; maxCombo = Math.max(maxCombo, combo);
    render(); matches.forEach(i => cells[i].classList.add('is-clearing'));
    $('#burst').textContent = combo === 1 ? `${matches.length}個 MATCH!` : `${combo}連鎖！ ×${combo}`;
    $('#gain').textContent = `+${turnScore.toLocaleString('ja-JP')}`;
    $('#status').textContent = `${combo}連鎖目、${matches.length}個消去、${points}点。${names[bonus]}は得点2倍。`;
    if (!await delay(220, token)) return;
    const result = collapse(board, matches, queues, random, combo >= 20); board = result.board; queues = result.queues; render(); boardElement.classList.add('is-falling');
    if (!await delay(260, token)) return;
    boardElement.classList.remove('is-falling'); matches = findMatches(board);
  }
  if (!session.check() || token !== generation) return;
  busy = false; resolvingBonus = null;
  if (moves === MOVE_LIMIT) { complete(); return; }
  const didShuffle = !legalMoves(board).length;
  if (didShuffle) board = reshuffle(board, random);
  $('#status').textContent = `${combo}連鎖、+${turnScore.toLocaleString('ja-JP')}点。${didShuffle ? '交換できるペアがないため、手数を使わず並べ直しました。' : ''}${moves % 5 === 0 ? `次の5手は${names[bonusColor()]}が2倍！` : '次の補充と2倍の記号を読もう。'}`;
  render();
}
function reset(newSeed = false) {
  cancelAnimations(); session.reset();
  if (newSeed) seed = (seed + 1 + Math.floor(Math.random() * 4294967295)) >>> 0;
  random = seededRandom(seed); board = makeBoard(random); queues = createQueues(random);
  score = 0; moves = 0; maxCombo = 0; selected = null; focused = 0; busy = false; finished = false; hintPair = null; resolvingBonus = null;
  $('#result').hidden = true; $('#burst').textContent = '20手の連鎖チャレンジ'; $('#gain').textContent = '';
  focusCell(0); showHint(true);
}
for (let i = 0; i < SIZE * SIZE; i++) {
  const cell = document.createElement('button'); cell.type = 'button';
  cell.addEventListener('click', () => play(i)); cell.addEventListener('focus', () => focusCell(i));
  boardElement.append(cell); cells.push(cell);
}
boardElement.addEventListener('keydown', event => {
  if (busy || finished || !session.check()) { if (event.key.startsWith('Arrow') || ['Enter', ' ', 'Escape', 'h', 'H'].includes(event.key)) event.preventDefault(); return; }
  if (event.key.startsWith('Arrow')) { event.preventDefault(); if (!busy && !finished && session.check()) focusCell(nextCell(focused, event.key), true); }
  else if (event.key === 'Escape') { selected = null; render(); }
  else if (event.key.toLowerCase() === 'h') { event.preventDefault(); showHint(); }
  else if (event.repeat && ['Enter', ' '].includes(event.key)) event.preventDefault();
});
$('#hint').addEventListener('click', () => showHint()); $('#restart').addEventListener('click', () => reset()); $('#new-board').addEventListener('click', () => reset(true));
$('#play-again').addEventListener('click', () => { reset(true); cells[0].focus(); });
const session = createGameSession({ onExpire() {
  cancelAnimations(); finished = true; busy = false; resolvingBonus = null; selected = null; hintPair = null;
  $('#result-label').textContent = 'TIME UP'; $('#result-title').textContent = '時間切れ。新しい連鎖へ。';
  $('#result-detail').textContent = `${moves}手・${score.toLocaleString('ja-JP')}点で終了。未完了のラウンドは自己ベストに保存されません。`;
  $('#status').textContent = '30分になったため終了しました。連鎖と入力を停止しました。新しい盤面でもう一度挑戦できます。';
  $('#burst').textContent = '時間切れ'; $('#gain').textContent = ''; $('#result').hidden = false; render();
} });
$('#best').textContent = best ? best.toLocaleString('ja-JP') : '—'; reset();
