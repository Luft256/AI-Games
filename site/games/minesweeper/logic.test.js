import test from 'node:test';
import assert from 'node:assert/strict';
import { neighbors, createField, revealCells, hasWon } from './logic.js';
test('neighbors do not wrap rows at corners and edges', () => {
  assert.deepEqual(neighbors(0, 3), [1, 3, 4]);
  assert.deepEqual(neighbors(2, 3), [1, 4, 5]);
  assert.equal(neighbors(4, 3).length, 8);
});
test('first click and its neighborhood are safe with exactly ten mines', () => {
  for (const safeIndex of [0, 8, 40, 80]) {
    const cells = createField(9, 10, safeIndex, () => 0.4);
    assert.equal(cells.filter(cell => cell.mine).length, 10);
    assert.equal(cells[safeIndex].adjacent, 0);
    assert.ok([safeIndex, ...neighbors(safeIndex, 9)].every(i => !cells[i].mine));
    cells.forEach((cell, index) => assert.equal(cell.adjacent, neighbors(index, 9).filter(i => cells[i].mine).length));
  }
});
test('flood fill reveals safe region and its numbered boundary, preserving flags', () => {
  const cells = Array.from({ length: 9 }, (_, i) => ({ mine: i === 8, adjacent: [4,5,7].includes(i) ? 1 : 0, flagged: i === 1, revealed: false }));
  const result = revealCells(cells, 3, 0);
  assert.equal(result.hit, false);
  assert.ok(result.cells[0].revealed && result.cells[4].revealed && result.cells[7].revealed);
  assert.equal(result.cells[1].revealed, false);
  assert.equal(result.cells[8].revealed, false);
  assert.equal(cells[0].revealed, false);
  assert.equal(hasWon(result.cells), false);
  result.cells[1].flagged = false;
  assert.equal(hasWon(revealCells(result.cells, 3, 1).cells), true);
});
test('flags cannot be opened, mines end the game, and revealed cells are no-ops', () => {
  const cells = [{ mine: true, adjacent: 0, flagged: true, revealed: false }];
  assert.equal(revealCells(cells, 1, 0).changed, false);
  cells[0].flagged = false;
  const result = revealCells(cells, 1, 0);
  assert.equal(result.hit, true);
  assert.equal(result.cells[0].revealed, true);
  assert.equal(revealCells(result.cells, 1, 0).changed, false);
});
