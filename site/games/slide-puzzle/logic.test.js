import test from 'node:test';
import assert from 'node:assert/strict';
import { solvedBoard, isValidBoard, neighbors, moveTile, moveBlank, directionTarget, isSolved, isSolvable, shuffleBoard, countCorrect, formatElapsed } from './logic.js';

test('goal has 15 ordered tiles and a final blank', () => {
  const goal = solvedBoard();
  assert.deepEqual(goal, [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]);
  assert.ok(isSolved(goal)); assert.ok(isSolvable(goal)); assert.equal(countCorrect(goal), 15);
  assert.equal(isValidBoard([...goal.slice(1), 1]), true);
  assert.equal(isSolved([...goal.slice(1), 1]), false);
});
test('adjacency does not wrap a row or leave the board', () => {
  assert.deepEqual(neighbors(0), [1,4]);
  assert.deepEqual(neighbors(3), [7,2]);
  assert.deepEqual(neighbors(15), [11,14]);
  assert.deepEqual(neighbors(5), [1,6,9,4]);
  for (const index of [-1,16,1.5,NaN]) assert.deepEqual(neighbors(index), []);
});
test('only adjacent tiles move and the source board stays unchanged', () => {
  const goal = solvedBoard();
  const moved = moveTile(goal, 14);
  assert.deepEqual(moved.slice(12), [13,14,0,15]);
  assert.equal(goal[15], 0);
  for (const index of [0,12,15,16,-1,14.5]) assert.equal(moveTile(goal, index), null);
  assert.deepEqual(moveTile(moved, 15), goal);
});
test('arrow directions move the blank with explicit edge boundaries', () => {
  const goal = solvedBoard();
  assert.equal(directionTarget(goal, 'up'), 11);
  assert.equal(directionTarget(goal, 'left'), 14);
  assert.equal(moveBlank(goal, 'right'), null);
  assert.equal(moveBlank(goal, 'down'), null);
  assert.equal(moveBlank(goal, 'other'), null);
  const rowEdge = [1,2,3,0,5,6,7,4,9,10,11,8,13,14,15,12];
  assert.equal(moveBlank(rowEdge, 'right'), null);
  const down = moveBlank(rowEdge, 'down');
  assert.equal(down[7], 0); assert.equal(down[3], 4);
});
test('rejects corrupt boards and distinguishes impossible parity', () => {
  const badParity = solvedBoard();
  [badParity[0], badParity[1]] = [badParity[1], badParity[0]];
  assert.equal(isSolvable(badParity), false);
  for (const board of [null, [], solvedBoard().slice(1), Array(16).fill(0), [...solvedBoard().slice(0,15), 16]]) {
    assert.equal(isValidBoard(board), false); assert.equal(isSolved(board), false); assert.equal(isSolvable(board), false); assert.equal(moveTile(board, 1), null);
  }
});
test('many legal shuffles are valid, unsolved and solvable', () => {
  for (let seed = 1; seed <= 160; seed += 1) {
    let state = seed;
    const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
    const board = shuffleBoard(random);
    assert.ok(isValidBoard(board), `valid seed ${seed}`);
    assert.ok(isSolvable(board), `solvable seed ${seed}`);
    assert.equal(isSolved(board), false, `unsolved seed ${seed}`);
  }
});
test('shuffle remains playable for repeating random and short walks', () => {
  for (const random of [() => 0, () => 1, () => -1, () => NaN]) for (const steps of [0,1,2,60,120,NaN]) {
    const board = shuffleBoard(random, steps);
    assert.ok(isSolvable(board)); assert.equal(isSolved(board), false);
  }
  assert.deepEqual(shuffleBoard(() => 0, 1), moveTile(solvedBoard(), 11));
});
test('timer formatting uses whole seconds without rounding up', () => {
  assert.equal(formatElapsed(0), '0:00'); assert.equal(formatElapsed(59999), '0:59');
  assert.equal(formatElapsed(60000), '1:00'); assert.equal(formatElapsed(125001), '2:05');
  assert.equal(formatElapsed(-10), '0:00');
});
