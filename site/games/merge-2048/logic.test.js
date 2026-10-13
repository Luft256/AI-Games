import test from 'node:test';
import assert from 'node:assert/strict';
import { slideLine, moveBoard, spawnTile, canMove } from './logic.js';
test('each tile merges at most once per move', () => {
  assert.deepEqual(slideLine([2, 2, 2, 2]), { line: [4, 4, 0, 0], score: 8 });
  assert.deepEqual(slideLine([4, 4, 8, 0]), { line: [8, 8, 0, 0], score: 8 });
  assert.deepEqual(slideLine([2, 0, 2, 4]), { line: [4, 4, 0, 0], score: 4 });
});
test('directions preserve orientation and score', () => {
  const board = [2, 0, 2, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  assert.deepEqual(moveBoard(board, 'right').board.slice(0, 4), [0, 0, 0, 4]);
  assert.deepEqual(moveBoard(board, 'down'), { board: [0,0,0,0,0,0,0,0,0,0,0,0,4,0,4,0], score: 8, changed: true });
  assert.deepEqual(moveBoard(board, 'up').board.slice(0, 4), [4, 0, 4, 0]);
  assert.deepEqual(board, [2,0,2,0,2,0,2,0,0,0,0,0,0,0,0,0]);
});
test('only changed moves spawn tiles and closed boards detect losses', () => {
  const board = [2,4,8,16,4,8,16,32,8,16,32,64,16,32,64,128];
  assert.equal(canMove(board), false);
  assert.equal(moveBoard(board, 'left').changed, false);
  assert.equal(canMove([2,2,...board.slice(2)]), true);
  assert.equal(canMove([0,...board.slice(1)]), true);
  assert.deepEqual(spawnTile(board), board);
});
test('spawning picks an empty cell with the intended tile value', () => {
  const randomValues = [0.5, 0.95];
  assert.deepEqual(spawnTile([2,0,4,0], () => randomValues.shift()), [2,0,4,4]);
});
