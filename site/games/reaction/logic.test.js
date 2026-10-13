import test from 'node:test';
import assert from 'node:assert/strict';
import { TOTAL_ROUNDS, randomDelay, averageTime, reactionTime } from './logic.js';

test('cue delays vary without exposing a countdown and remain in the intended range', () => {
  assert.equal(randomDelay(() => 0), 1500);
  assert.equal(randomDelay(() => .99999), 3999);
});
test('average is absent before a response and rounds the completed attempt correctly', () => {
  assert.equal(averageTime([]), null);
  assert.equal(averageTime([203, 222, 195, 278, 251]), 230);
  assert.equal(TOTAL_ROUNDS, 5);
});
test('responses before a cue are invalid rather than negative or huge scores', () => {
  assert.equal(reactionTime(null, 1000), null);
  assert.equal(reactionTime(1000, 999), null);
  assert.equal(reactionTime(1000, 1251.2), 251);
  assert.equal(reactionTime(1000, 1000), 0);
});
