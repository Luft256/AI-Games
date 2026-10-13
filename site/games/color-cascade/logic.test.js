import test from 'node:test';
import assert from 'node:assert/strict';
import { SIZE, seededRandom, adjacent, swap, findMatches, legalMoves, makeBoard, createQueues, collapse, waveScore, reshuffle } from './logic.js';
test('hundreds of reproducible boards start stable with a playable move', () => {
  for (let seed = 0; seed < 250; seed++) { const b = makeBoard(seededRandom(seed)); assert.deepEqual(findMatches(b), []); assert.ok(legalMoves(b).length); assert.deepEqual(b, makeBoard(seededRandom(seed))); }
  for (const n of [0, .2, .99]) assert.ok(legalMoves(makeBoard(() => n)).length);
});
test('row boundary cannot wrap as adjacent; swap is immutable', () => {
  assert.equal(adjacent(5, 6), false); assert.equal(adjacent(5, 11), true); assert.equal(adjacent(-1, 0), false);
  const b = makeBoard(seededRandom(23)); const original = [...b]; const [a, c] = legalMoves(b)[0]; assert.ok(findMatches(swap(b, a, c)).length); assert.deepEqual(b, original);
});
test('intersections clear once and matches do not cross a row', () => {
  const b = Array(36).fill(null); for (const i of [6, 7, 8, 1, 13]) b[i] = 2;
  assert.deepEqual(findMatches(b), [1, 6, 7, 8, 13]); b.fill(null); b[5] = b[6] = b[7] = 1; assert.deepEqual(findMatches(b), []);
});
test('gravity keeps survivors in order and consumes forecast deepest first', () => {
  const b = Array.from({length:36}, (_, i) => Math.floor(i / SIZE) % 5); const q = createQueues(() => .4); q[0] = [4, 3, 2, 1, 0, 4];
  const snapshot = q.map(c => [...c]); const result = collapse(b, [12, 24], q, () => 0);
  assert.deepEqual([0,6,12,18,24,30].map(i => result.board[i]), [3,4,0,1,3,0]); assert.deepEqual(q, snapshot); assert.deepEqual(result.queues[0], [2,1,0,4,0,0]);
});
test('bonus and cascades reward without counting an intersection twice', () => { const b = [0,0,1]; assert.equal(waveScore(b, [0,1,2], 3, 0), 450); });
test('dead boards reshuffle free and bounded even with pathological RNG', () => {
  const dead = Array.from({length:36}, (_, i) => (i % 6 + Math.floor(i / 6) * 2) % 5);
  assert.deepEqual(legalMoves(dead), []);
  for (const random of [seededRandom(34), () => 0]) { const next = reshuffle(dead, random); assert.ok(legalMoves(next).length); assert.deepEqual(findMatches(next), []); }
});
test('twenty repeated rounds preserve stable playable boards after cascades', () => {
  for (let seed = 1; seed < 20; seed++) {
    const random = seededRandom(seed); let b = makeBoard(random), q = createQueues(random);
    for (let move = 0; move < 20; move++) {
      if (!legalMoves(b).length) b = reshuffle(b, random);
      b = swap(b, ...legalMoves(b)[0]); let matches = findMatches(b), waves = 0;
      while (matches.length) { waves++; const result = collapse(b, matches, q, random, waves >= 20); b = result.board; q = result.queues; matches = findMatches(b); assert.ok(waves <= 20); }
      assert.equal(b.length, 36); assert.ok(b.every(n => n >= 0 && n < 5));
    }
  }
});
