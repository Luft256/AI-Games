import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { createDeck, evaluatePair, formatTime } from './logic.js';

mountShell({ title: 'メモリーマッチ', english: 'MEMORY MATCH', description: 'めくって、覚えて、つなぐ。小さな記憶のパズル。', accent: '#8dd1d3', controls: ['クリック / タップでカードをめくる', 'Tab + Enter / Space でも操作できます'] });

const symbols = [
  { name: '円', color: '#f3ac7a', shape: '<circle cx="32" cy="32" r="20"/>' },
  { name: '三角', color: '#8dd1d3', shape: '<path d="M32 10 56 52H8Z"/>' },
  { name: 'ダイヤ', color: '#c1b2e5', shape: '<path d="m32 6 26 26-26 26L6 32Z"/>' },
  { name: '十字', color: '#f4a3ba', shape: '<path d="M23 8h18v15h15v18H41v15H23V41H8V23h15Z"/>' },
  { name: '星', color: '#e8cd78', shape: '<path d="m32 5 8 17 19 3-14 14 3 19-16-9-17 9 3-19L4 25l20-3Z"/>' },
  { name: '月', color: '#a8c895', shape: '<path d="M43 8A25 25 0 1 0 56 44 23 23 0 0 1 43 8Z"/>' },
  { name: 'リング', color: '#7da9d2', shape: '<circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="10"/>' },
  { name: '波', color: '#d9a4cc', shape: '<path d="M5 27q9-17 18 0t18 0 18 0M5 43q9-17 18 0t18 0 18 0" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>' },
];
const board = document.querySelector('#board');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const movesLabel = document.querySelector('#moves');
const pairsLabel = document.querySelector('#pairs');
const timeLabel = document.querySelector('#time');
let cards = [];
let selected = [];
let matched = new Set();
let moves = 0;
let pairs = 0;
let locked = false;
let startedAt = null;
let tick = null;
let mismatchTimer = null;
let matchTimer = null;
let best = Number(loadBest('memory', 0)) || 0;

function showBest() { document.querySelector('#best').textContent = best || '—'; }
function updateTime() {
  if (!session.check()) return 1800;
  const elapsed = startedAt === null ? 0 : (performance.now() - startedAt) / 1000;
  timeLabel.textContent = formatTime(elapsed);
  return elapsed;
}
function renderCard(index) {
  const element = board.children[index];
  const card = cards[index];
  const visible = selected.includes(index) || matched.has(index);
  element.classList.toggle('is-flipped', visible);
  element.classList.toggle('is-matched', matched.has(index));
  element.setAttribute('aria-label', `カード${index + 1}、${matched.has(index) ? `${symbols[card.symbol].name}、一致済み` : visible ? symbols[card.symbol].name : '裏向き'}`);
  element.setAttribute('aria-disabled', String(matched.has(index) || selected.includes(index)));
}
function finish() {
  if (!session.finish()) return;
  result.querySelector('h2').textContent = 'すべてのペアを発見！';
  result.querySelector('.win-eyebrow').textContent = 'ALL PAIRS FOUND';
  clearInterval(tick);
  const elapsed = updateTime();
  const newBest = !best || moves < best;
  if (newBest) { best = moves; saveBest('memory', best); showBest(); }
  status.textContent = `クリア！ ${moves}手で8組のペアを見つけました。`;
  document.querySelector('#result-detail').textContent = `${moves}手 · ${formatTime(elapsed)}${newBest ? ' · 自己ベスト更新！' : ' · ナイスメモリー！'}`;
  result.hidden = false;
}
function flip(index) {
  if (!session.check() || locked || matched.has(index) || selected.includes(index) || pairs === 8) return;
  if (!session.start()) return;
  if (startedAt === null) { startedAt = performance.now(); tick = setInterval(updateTime, 250); }
  selected.push(index);
  renderCard(index);
  if (selected.length === 1) { status.textContent = `${symbols[cards[index].symbol].name}を発見。もう1枚を選ぼう。`; return; }
  moves += 1;
  movesLabel.textContent = moves;
  locked = true;
  const [first, second] = selected;
  if (evaluatePair(cards, first, second)) {
    matched.add(first); matched.add(second);
    pairs += 1;
    pairsLabel.textContent = pairs;
    renderCard(first); renderCard(second);
    status.textContent = `ペア完成！ ${symbols[cards[first].symbol].name}がそろいました。残り${8 - pairs}組。`;
    selected = [];
    if (pairs === 8) { finish(); return; }
    matchTimer = setTimeout(() => { if (session.check()) locked = false; }, 250);
  } else {
    status.textContent = 'ちがう形でした。場所を覚えて、もう一度！';
    mismatchTimer = setTimeout(() => {
      if (!session.check()) return;
      selected = [];
      renderCard(first); renderCard(second);
      locked = false;
      status.textContent = '次の2枚を選ぼう。';
    }, 950);
  }
}
function restart() {
  session.reset();
  clearTimeout(mismatchTimer); clearTimeout(matchTimer); clearInterval(tick);
  cards = createDeck(); selected = []; matched = new Set();
  moves = 0; pairs = 0; locked = false; startedAt = null;
  movesLabel.textContent = '0'; pairsLabel.textContent = '0'; timeLabel.textContent = '0:00';
  result.hidden = true;
  status.textContent = 'カードを2枚めくって、同じ形を見つけよう。最初の1枚から計時します。';
  board.replaceChildren();
  cards.forEach((card, index) => {
    const symbol = symbols[card.symbol];
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'memory-card';
    button.style.setProperty('--symbol-color', symbol.color);
    button.innerHTML = `<span class="card-back" aria-hidden="true"><span class="back-mark"></span></span><span class="card-front" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false">${symbol.shape}</svg><span class="match-check">✓</span></span>`;
    button.addEventListener('click', () => flip(index));
    board.append(button);
    renderCard(index);
  });
}
document.querySelector('#restart').addEventListener('click', restart);
document.querySelector('#play-again').addEventListener('click', () => { restart(); board.firstElementChild.focus(); });
board.addEventListener('keydown', (event) => {
  const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[event.key];
  if (offset === undefined) return;
  const index = Array.from(board.children).indexOf(document.activeElement);
  if (index === -1) return;
  event.preventDefault();
  board.children[(index + offset + 16) % 16].focus();
});
const session = createGameSession({ onExpire() {
  clearTimeout(mismatchTimer); clearTimeout(matchTimer); clearInterval(tick);
  locked = true; timeLabel.textContent = '30:00';
  status.textContent = `時間切れ。30分になったため終了しました。${pairs} / 8ペア発見。`;
  result.querySelector('h2').textContent = '時間切れ。もう一度挑戦しよう。';
  result.querySelector('.win-eyebrow').textContent = 'TIME UP';
  document.querySelector('#result-detail').textContent = `${pairs} / 8ペア · ${moves}手 · 30:00。未クリアの記録はベストに含めません。`;
  result.hidden = false;
} });
showBest(); restart();
