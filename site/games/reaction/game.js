import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { TOTAL_ROUNDS, randomDelay, averageTime, reactionTime } from './logic.js';

mountShell({ title: 'リアクションラボ', english: 'REACTION LAB', description: '緑の合図を待って、ひと押し。あなたの反応を測ろう。', accent: '#f4a3ba', controls: ['クリック / タップ / Spaceで反応', '緑色の「いま！」が合図。5回の平均で勝負'] });

const surface = document.querySelector('#surface');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const roundResults = document.querySelector('#round-results');
let phase = 'idle';
let times = [];
let cueAt = null;
let cueTimer = null;
let best = Number(loadBest('reaction', 0)) || 0;
let falseStarts = 0;

const copy = {
  idle: ['TEST YOUR REFLEXES', '準備はいい？', 'ここを押して、測定スタート', 'クリック / タップ / Space'],
  waiting: ['WAIT FOR THE SIGNAL', 'そのまま待って…', '緑色の「いま！」が出るまで待機', 'まだ押さないで'],
  ready: ['GO · GO · GO', 'いま！', 'すばやく押して！', 'クリック / タップ / Space'],
  early: ['TOO SOON', 'フライング！', '大丈夫。このラウンドをもう一度', '押して再チャレンジ'],
  between: ['ROUND COMPLETE', '', '次も、自分のペースで', '押して次のラウンドへ'],
  paused: ['ROUND PAUSED', '測定を一時停止', 'ページを離れたため、この回は再試行', '押して再チャレンジ'],
  done: ['SESSION COMPLETE', '', '5ラウンドの平均タイム', '押してもう一度測定'],
};
function setPhase(next) {
  phase = next;
  surface.dataset.phase = next;
  const content = [...copy[next]];
  if (next === 'between') content[1] = `${times.at(-1)} ms`;
  if (next === 'done') content[1] = `${averageTime(times)} ms`;
  document.querySelector('#surface-tag').textContent = content[0];
  document.querySelector('#cue-title').textContent = content[1];
  document.querySelector('#cue-subtitle').textContent = content[2];
  document.querySelector('#surface-action').textContent = content[3];
  surface.setAttribute('aria-label', `${content[1]}。${content[2]}。${content[3]}`);
}
function updateStats() {
  document.querySelector('#round').textContent = Math.min(times.length + 1, TOTAL_ROUNDS);
  document.querySelector('#average').textContent = averageTime(times) ?? '—';
  document.querySelector('#best').textContent = best || '—';
  roundResults.replaceChildren();
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const item = document.createElement('div');
    item.className = `round-item${i < times.length ? ' is-done' : i === times.length ? ' is-current' : ''}`;
    item.innerHTML = `<span class="round-label">ROUND 0${i + 1}</span><strong>${times[i] !== undefined ? times[i] : '—'}<span> ms</span></strong>`;
    roundResults.append(item);
  }
}
function cancelCue() {
  clearTimeout(cueTimer);
  cueTimer = null;
  cueAt = null;
}
function reset() {
  cancelCue(); times = []; falseStarts = 0; result.hidden = true;
  setPhase('idle'); updateStats();
  status.textContent = '緑色の「いま！」が出たら、すばやく反応しよう。';
}
function startRound() {
  if (document.hidden) return;
  cancelCue(); setPhase('waiting');
  status.textContent = `ラウンド${times.length + 1}。合図が出るまで待ってください。`;
  cueTimer = setTimeout(() => {
    if (document.hidden || phase !== 'waiting') return;
    setPhase('ready');
    cueAt = performance.now();
    status.textContent = 'いま！ パネルを押すか、Spaceキーで反応！';
  }, randomDelay());
}
function finish() {
  const average = averageTime(times);
  const newBest = !best || average < best;
  if (newBest) { best = average; saveBest('reaction', best); }
  setPhase('done'); updateStats();
  result.hidden = false;
  document.querySelector('#result-title').textContent = newBest ? '自己ベスト更新！' : '5ラウンド、測定完了！';
  document.querySelector('#result-detail').textContent = `平均 ${average} ms · 最速 ${Math.min(...times)} ms${falseStarts ? ` · フライング ${falseStarts}回` : ''}`;
  status.textContent = `測定完了。平均${average}ミリ秒。${newBest ? '自己ベストを更新しました！' : 'もう一度チャレンジしてみよう。'}`;
}
function activate() {
  if (document.hidden) return;
  if (phase === 'waiting') {
    cancelCue(); falseStarts += 1; setPhase('early');
    status.textContent = 'フライング！ 記録には含めません。押すと同じラウンドをやり直せます。';
    return;
  }
  if (phase === 'ready') {
    const elapsed = reactionTime(cueAt, performance.now());
    if (elapsed === null) return;
    times.push(elapsed); cancelCue(); updateStats();
    if (times.length === TOTAL_ROUNDS) { finish(); return; }
    setPhase('between');
    status.textContent = `ラウンド${times.length}は${elapsed}ミリ秒。押すと次のラウンドに進みます。`;
    return;
  }
  if (phase === 'done') reset();
  startRound();
}
surface.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  event.preventDefault(); surface.focus({ preventScroll: true }); activate();
});
// Assistive technology and native Enter activation create clicks with detail 0.
surface.addEventListener('click', (event) => { if (event.detail === 0) activate(); });
document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest('input, textarea, select, a, [contenteditable="true"]')) return;
  if (event.target.closest('button') && event.target !== surface) return;
  event.preventDefault(); activate();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (phase === 'waiting' || phase === 'ready')) {
    cancelCue(); setPhase('paused');
    status.textContent = 'ページを離れたため測定を一時停止しました。戻ったら押して、このラウンドを再試行できます。';
  }
});
document.querySelector('#restart').addEventListener('click', reset);
document.querySelector('#play-again').addEventListener('click', () => { reset(); surface.focus({ preventScroll: true }); startRound(); });
reset();
