import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeck, evaluatePair, formatTime } from './logic.js';

test('shuffle preserves 16 unique cards and exactly two of each symbol', () => {
  for (const random of [() => 0, () => .99999, Math.random]) {
    const deck = createDeck(random);
    assert.equal(new Set(deck.map(card => card.id)).size, 16);
    const counts = Array(8).fill(0);
    deck.forEach(card => counts[card.symbol]++);
    assert.deepEqual(counts, Array(8).fill(2));
  }
});
test('a card cannot match itself or an absent card', () => {
  const deck = createDeck(() => .99999);
  assert.equal(evaluatePair(deck, 0, 1), true);
  assert.equal(evaluatePair(deck, 0, 2), false);
  assert.equal(evaluatePair(deck, 0, 0), false);
  assert.equal(evaluatePair(deck, 0, 16), false);
});
test('elapsed time keeps seconds padded through minute boundaries', () => {
  assert.equal(formatTime(59.9), '0:59');
  assert.equal(formatTime(60), '1:00');
  assert.equal(formatTime(125), '2:05');
});
