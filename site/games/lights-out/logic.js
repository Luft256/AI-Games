export const SIZE = 5;
export const CELL_COUNT = SIZE * SIZE;

function validateBoard(board) {
  if (!Array.isArray(board) || board.length !== CELL_COUNT || board.some(value => value !== 0 && value !== 1)) {
    throw new TypeError('A board must contain 25 lights with values 0 or 1.');
  }
}

export function affectedCells(index) {
  if (!Number.isInteger(index) || index < 0 || index >= CELL_COUNT) throw new RangeError('Invalid cell.');
  const row = Math.floor(index / SIZE);
  const column = index % SIZE;
  const cells = [index];
  if (row > 0) cells.push(index - SIZE);
  if (row < SIZE - 1) cells.push(index + SIZE);
  if (column > 0) cells.push(index - 1);
  if (column < SIZE - 1) cells.push(index + 1);
  return cells;
}

export function toggleLight(board, index) {
  validateBoard(board);
  const next = [...board];
  for (const cell of affectedCells(index)) next[cell] ^= 1;
  return next;
}

export function countLights(board) {
  validateBoard(board);
  return board.reduce((sum, value) => sum + value, 0);
}

export function isSolved(board) { return countLights(board) === 0; }

// Every puzzle is constructed by legal moves from the all-off board. Applying
// this same sequence again solves it, because each toggle is its own inverse.
export function createPuzzle(random = Math.random) {
  const sample = () => {
    const value = Number(random());
    return Number.isFinite(value) ? Math.max(0, Math.min(1 - Number.EPSILON, value)) : 0;
  };
  const cells = Array.from({ length: CELL_COUNT }, (_, index) => index);
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const other = Math.floor(sample() * (index + 1));
    [cells[index], cells[other]] = [cells[other], cells[index]];
  }
  let solution = cells.slice(0, 7 + Math.floor(sample() * 8));
  let board = solution.reduce(toggleLight, Array(CELL_COUNT).fill(0));
  if (isSolved(board)) {
    solution = [12];
    board = toggleLight(board, 12);
  }
  return { board, solution };
}

export function nextCell(index, key, wholeBoard = false) {
  affectedCells(index); // Also validate the current selection.
  const row = Math.floor(index / SIZE);
  const column = index % SIZE;
  switch (key) {
    case 'ArrowLeft': return row * SIZE + Math.max(0, column - 1);
    case 'ArrowRight': return row * SIZE + Math.min(SIZE - 1, column + 1);
    case 'ArrowUp': return Math.max(0, row - 1) * SIZE + column;
    case 'ArrowDown': return Math.min(SIZE - 1, row + 1) * SIZE + column;
    case 'Home': return wholeBoard ? 0 : row * SIZE;
    case 'End': return wholeBoard ? CELL_COUNT - 1 : row * SIZE + SIZE - 1;
    default: return index;
  }
}
