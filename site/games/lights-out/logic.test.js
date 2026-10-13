import test from 'node:test';
import assert from 'node:assert/strict';
import { CELL_COUNT, affectedCells, toggleLight, countLights, isSolved, createPuzzle, nextCell } from './logic.js';

const off = () => Array(CELL_COUNT).fill(0);

test('a center toggles itself and its four orthogonal neighbors only', () => {
  assert.deepEqual(affectedCells(12), [12, 7, 17, 11, 13]);
  assert.deepEqual(toggleLight(off(), 12).flatMap((value, index) => value ? [index] : []), [7, 11, 12, 13, 17]);
});

test('corners and edges never wrap across rows', () => {
  assert.deepEqual(affectedCells(0), [0, 5, 1]);
  assert.deepEqual(affectedCells(4), [4, 9, 3]);
  assert.deepEqual(affectedCells(24), [24, 19, 23]);
  assert.deepEqual(affectedCells(10), [10, 5, 15, 11]);
});

test('moves are immutable, self-inverse, and commute', () => {
  const initial = off();
  const after = toggleLight(initial, 12);
  assert.deepEqual(initial, off());
  assert.deepEqual(toggleLight(after, 12), initial);
  assert.deepEqual(toggleLight(toggleLight(initial, 3), 8), toggleLight(toggleLight(initial, 8), 3));
});

test('solved and remaining-light checks reflect the full board', () => {
  assert.equal(isSolved(off()), true);
  assert.equal(countLights(toggleLight(off(), 0)), 3);
  assert.equal(isSolved(toggleLight(off(), 0)), false);
  assert.equal(countLights(Array(CELL_COUNT).fill(1)), 25);
});

test('generated puzzles are nonempty and solvable for 500 reproducible seeds', () => {
  for (let seed = 1; seed <= 500; seed += 1) {
    let state = seed;
    const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 2 ** 32; };
    const { board, solution } = createPuzzle(random);
    assert.equal(board.length, 25);
    assert.ok(countLights(board) > 0);
    assert.ok(solution.length > 0);
    assert.equal(new Set(solution).size, solution.length);
    assert.ok(isSolved(solution.reduce(toggleLight, board)));
  }
});

test('degenerate random sources still produce a playable puzzle', () => {
  for (const value of [0, 1, -1, Infinity, NaN]) {
    const { board, solution } = createPuzzle(() => value);
    assert.ok(!isSolved(board));
    assert.ok(isSolved(solution.reduce(toggleLight, board)));
  }
});

test('roving selection respects board edges, rows, and Home/End', () => {
  assert.equal(nextCell(4, 'ArrowRight'), 4);
  assert.equal(nextCell(5, 'ArrowLeft'), 5);
  assert.equal(nextCell(2, 'ArrowUp'), 2);
  assert.equal(nextCell(22, 'ArrowDown'), 22);
  assert.equal(nextCell(12, 'ArrowLeft'), 11);
  assert.equal(nextCell(12, 'ArrowDown'), 17);
  assert.equal(nextCell(12, 'Home'), 10);
  assert.equal(nextCell(12, 'End'), 14);
  assert.equal(nextCell(12, 'Home', true), 0);
  assert.equal(nextCell(12, 'End', true), 24);
  assert.equal(nextCell(12, 'Tab'), 12);
});

test('invalid moves and malformed boards are rejected', () => {
  for (const index of [-1, 25, 1.5, NaN]) assert.throws(() => toggleLight(off(), index), RangeError);
  for (const board of [[], null, Array(25).fill(2)]) assert.throws(() => countLights(board), TypeError);
});
