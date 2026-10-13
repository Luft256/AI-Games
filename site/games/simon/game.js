import { mountShell, loadBest, saveBest } from '../../shared/game-shell.js';
import { createGameSession } from '../../shared/session-limit.js';
import { createGame, startGame, finishPlayback, pressPad, nextRound, pauseGame, resumeGame } from './logic.js';

mountShell({
  title: 'シーケンスメモリー', english: 'SEQUENCE MEMORY',
  description: '光る順番を、記憶のリズムに。ひとつずつ、どこまで覚えられる？', accent: '#e8a6c6',
  controls: ['スタートを押して、4つのパッドが光る順番を覚えよう。', '「押す番」になったら、同じ順番でクリック / タップ / キー1〜4。', '正解すると次の段階へ。時間制限はありません。', 'タブを離れると一時停止。戻ったら「この段階を再生」で続けられます。リセットで最初に戻ります。'],
});

const $ = (selector) => document.querySelector(selector);
const pads = [...document.querySelectorAll('[data-pad]')];
const names = ['1・円', '2・三角', '3・ダイヤ', '4・十字'];
const panel = $('.sequence-panel');
const status = $('#status');
const start = $('#start');
const timers = new Set();
let generation = 0;
let state = createGame();
let best = loadBest('simon', 0);
let improved = false;
let playbackStep = 0;

// Every new run, playback or pause invalidates all callbacks from the previous phase.
function cancelTimers() {
  generation += 1;
  for (const timer of timers) clearTimeout(timer);
  timers.clear();
  pads.forEach(pad => pad.classList.remove('is-lit', 'is-wrong', 'is-expected'));
}
function later(callback, delay) {
  const token = generation;
  const timer = setTimeout(() => {
    timers.delete(timer);
    if (token === generation && session.check()) callback();
  }, delay);
  timers.add(timer);
}
function lightPad(index, duration) {
  const pad = pads[index];
  pad.classList.add('is-lit');
  later(() => pad.classList.remove('is-lit'), duration);
}
function setProgress(done, total, label) {
  $('#progress-label').textContent = label;
  $('#progress-value').textContent = total ? `${done} / ${total}` : '—';
  $('#progress-fill').style.width = `${total ? done / total * 100 : 0}%`;
  $('#progress').setAttribute('aria-valuemax', String(total || 1));
  $('#progress').setAttribute('aria-valuenow', String(done));
}
function render() {
  panel.dataset.phase = state.phase;
  $('#round').textContent = String(state.sequence.length || 1).padStart(2, '0');
  $('#score').textContent = state.score;
  $('#best').textContent = best || '—';
  $('#length').textContent = state.sequence.length ? `${state.sequence.length}つの光を、順番どおりに。` : '1つの光から、はじめよう。';
  pads.forEach(pad => pad.setAttribute('aria-disabled', String(state.phase !== 'input')));
  const phases = { idle: 'READY', playback: 'WATCH', input: 'YOUR TURN', success: 'CORRECT', over: 'FINISH', timeout: 'TIME UP', paused: 'PAUSED' };
  $('#phase').textContent = phases[state.phase];
  start.disabled = ['playback', 'input', 'success'].includes(state.phase);
  const labels = { idle: 'スタート ↗', playback: '再生中…', input: 'あなたの番', success: '正解！', over: 'もう一度あそぶ ↗', timeout: 'もう一度あそぶ ↗', paused: state.suspendedPhase === 'success' ? '次の段階を再生 ↗' : 'この段階を再生 ↗' };
  start.textContent = labels[state.phase];
  $('#reset').disabled = state.phase === 'idle';
  $('#result').hidden = state.phase !== 'over' && state.phase !== 'timeout';
  if (state.phase === 'idle') {
    status.textContent = 'スタートを押して、光る順番を覚えよう。';
    setProgress(0, 0, '準備できたら、スタート');
  } else if (state.phase === 'playback') {
    status.textContent = '見る番 — 光る順番を覚えよう。';
    setProgress(playbackStep, state.sequence.length, '順番を覚えよう');
  } else if (state.phase === 'input') {
    status.textContent = state.inputIndex ? `ここまで正解！ あと${state.sequence.length - state.inputIndex}つ。` : '押す番 — 同じ順番で押してみよう。';
    setProgress(state.inputIndex, state.sequence.length, 'あなたの記憶');
  } else if (state.phase === 'success') {
    status.textContent = `正解！ 段階${state.score}クリア。次は光が1つ増えるよ。`;
    setProgress(state.sequence.length, state.sequence.length, 'すべて正解！');
  } else if (state.phase === 'paused') {
    status.textContent = '一時停止中。ボタンを押して、光の再生から続けよう。';
    setProgress(0, state.sequence.length, '戻ったら、もう一度覚えよう');
  } else if (state.phase === 'timeout') {
    status.textContent = '時間切れ。30分になったため、このプレイは終了しました。';
    setProgress(state.inputIndex, state.sequence.length, 'プレイ終了');
    $('#result-title').textContent = '時間切れ。よく覚えました！';
    $('#result-detail').textContent = `${state.score}段階クリア。途中の段階は記録に加えません。`;
  } else {
    status.textContent = `おしい！ ${state.inputIndex + 1}つ目は「${names[state.expected]}」でした。`;
    setProgress(state.inputIndex, state.sequence.length, 'ここまで正解');
    $('#result-title').textContent = state.score ? `${state.score}段階クリア！` : '次は、きっと覚えられる。';
    $('#result-detail').textContent = `段階${state.sequence.length}で終了。${improved ? '自己ベスト更新！ ' : ''}もう一度、記憶をのばしてみよう。`;
  }
}
function playSequence() {
  if (!session.check()) return;
  cancelTimers();
  playbackStep = 0;
  render();
  if (document.hidden || !document.hasFocus()) { pause(); return; }
  const duration = Math.max(340, 640 - (state.sequence.length - 1) * 18);
  const gap = 200;
  // Start with a quiet lead-in so a click or keyboard focus change cannot hide pad one.
  state.sequence.forEach((pad, index) => {
    later(() => {
      if (document.hidden || !document.hasFocus()) { pause(); return; }
      playbackStep = index + 1;
      status.textContent = `見る番 — ${playbackStep}つ目：${names[pad]}`;
      lightPad(pad, duration);
      setProgress(playbackStep, state.sequence.length, '順番を覚えよう');
    }, 550 + index * (duration + gap));
  });
  later(() => {
    if (document.hidden || !document.hasFocus()) { pause(); return; }
    state = finishPlayback(state);
    pads.forEach(pad => pad.classList.remove('is-lit'));
    render();
  }, 550 + state.sequence.length * (duration + gap) + 120);
}
function begin() {
  if (document.hidden) return;
  if (state.phase === 'paused') state = resumeGame(state);
  else if (state.phase === 'idle' || state.phase === 'over' || state.phase === 'timeout') { session.reset(); state = startGame(); improved = false; }
  else return;
  if (!session.start()) return;
  playSequence();
}
function enterPad(index) {
  if (!session.check()) return;
  if (document.hidden || !document.hasFocus()) { pause(); return; }
  const previous = state;
  state = pressPad(state, index);
  if (state === previous) return;
  // Cancel the previous input flash, so repeated pads receive a distinct new flash.
  cancelTimers();
  lightPad(index, 180);
  if (state.phase === 'over') {
    if (!session.finish()) return;
    pads[index].classList.add('is-wrong');
    pads[state.expected].classList.add('is-expected');
  }
  if (state.phase === 'success') {
    if (state.score > best) { best = state.score; improved = true; saveBest('simon', best); }
    later(() => { state = nextRound(state); playSequence(); }, 1050);
  }
  render();
}
function pause() {
  if (!session.check()) return;
  const paused = pauseGame(state);
  if (paused === state) return;
  cancelTimers();
  state = paused;
  render();
}
function reset() {
  session.reset();
  cancelTimers();
  state = createGame(); improved = false; playbackStep = 0;
  render();
}
start.addEventListener('click', begin);
$('#reset').addEventListener('click', reset);
pads.forEach((pad, index) => pad.addEventListener('click', () => enterPad(index)));
document.addEventListener('keydown', (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
  const index = ['1', '2', '3', '4'].indexOf(event.key);
  if (index < 0 || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) || event.target.isContentEditable) return;
  event.preventDefault();
  enterPad(index);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('blur', pause);
window.addEventListener('pagehide', pause);
const session = createGameSession({ onExpire() {
  cancelTimers(); state = { ...state, phase: 'timeout' }; render();
} });

render();
