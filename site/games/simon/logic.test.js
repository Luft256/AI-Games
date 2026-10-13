import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, appendPad, startGame, finishPlayback, pressPad, nextRound, pauseGame, resumeGame } from './logic.js';

const inputState = (sequence) => ({ ...createGame(), phase: 'input', sequence });

test('start begins a one-pad playback; random buckets include all four pads', () => {
  assert.equal(createGame().phase, 'idle');
  assert.deepEqual([0, 0.25, 0.5, 0.999].map(n => startGame(() => n).sequence[0]), [0, 1, 2, 3]);
  assert.equal(startGame(() => 0).phase, 'playback');
  for (const value of [-1, 1, NaN, Infinity]) assert.throws(() => appendPad([], () => value), RangeError);
});

test('playback locks pad input, and only playback can transition to input', () => {
  const state = startGame(() => 0);
  assert.equal(pressPad(state, 0), state);
  assert.equal(finishPlayback(state).phase, 'input');
  const idle = createGame();
  assert.equal(finishPlayback(idle), idle);
});

test('correct inputs retain order; score changes only after the whole sequence', () => {
  const state = inputState([1, 0, 1]);
  const first = pressPad(state, 1);
  assert.equal(first.phase, 'input');
  assert.equal(first.inputIndex, 1);
  assert.equal(first.score, 0);
  const second = pressPad(first, 0);
  const third = pressPad(second, 1);
  assert.equal(third.phase, 'success');
  assert.equal(third.score, 3);
  assert.equal(pressPad(third, 1), third);
  assert.equal(state.inputIndex, 0);
});

test('a wrong answer ends the run once and preserves completed-stage score', () => {
  const state = { ...inputState([1, 2, 0]), score: 2 };
  const failed = pressPad(pressPad(state, 1), 3);
  assert.equal(failed.phase, 'over');
  assert.equal(failed.expected, 2);
  assert.equal(failed.lastInput, 3);
  assert.equal(failed.score, 2);
  assert.equal(pressPad(failed, 2), failed);
  assert.equal(nextRound(failed), failed);
});

test('next round extends the same sequence by exactly one pad without changing score', () => {
  const completed = pressPad(inputState([2]), 2);
  const next = nextRound(completed, () => 0.25);
  assert.deepEqual(next.sequence, [2, 1]);
  assert.deepEqual(completed.sequence, [2]);
  assert.equal(next.phase, 'playback');
  assert.equal(next.inputIndex, 0);
  assert.equal(next.score, 1);
  assert.equal(nextRound(next), next);
});

test('invalid pad values cannot consume inputs or end the game', () => {
  const state = inputState([0]);
  for (const pad of [-1, 4, 0.5, NaN, '0', null]) assert.equal(pressPad(state, pad), state);
});

test('pause cancels input progress and resumes playback of the same stage', () => {
  const state = pressPad(inputState([0, 2, 1]), 0);
  const paused = pauseGame(state);
  assert.equal(paused.phase, 'paused');
  assert.equal(pressPad(paused, 2), paused);
  assert.equal(pauseGame(paused), paused);
  const resumed = resumeGame(paused);
  assert.equal(resumed.phase, 'playback');
  assert.equal(resumed.inputIndex, 0);
  assert.deepEqual(resumed.sequence, state.sequence);
  assert.equal(resumed.score, 0);
});

test('pausing playback replays it; pausing success advances exactly once without score farming', () => {
  const playback = startGame(() => 0.5);
  assert.deepEqual(resumeGame(pauseGame(playback)).sequence, [2]);
  const completed = pressPad(finishPlayback(playback), 2);
  const resumed = resumeGame(pauseGame(completed), () => 0.75);
  assert.deepEqual(resumed.sequence, [2, 3]);
  assert.equal(resumed.score, 1);
  assert.equal(resumeGame(resumed), resumed);
  for (const phase of ['idle', 'over']) {
    const state = { ...createGame(), phase };
    assert.equal(pauseGame(state), state);
    assert.equal(resumeGame(state), state);
  }
});
