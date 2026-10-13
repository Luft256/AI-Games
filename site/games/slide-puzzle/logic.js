export const SIZE = 4;
export function solvedBoard() { return Array.from({ length: 16 }, (_, index) => (index + 1) % 16); }
export function isValidBoard(board) {
  return Array.isArray(board) && board.length === 16 && new Set(board).size === 16 && board.every(value => Number.isInteger(value) && value >= 0 && value <= 15);
}
export function neighbors(index) {
  if (!Number.isInteger(index) || index < 0 || index >= 16) return [];
  const row = Math.floor(index / SIZE), column = index % SIZE;
  return [row > 0 ? index - SIZE : -1, column < SIZE - 1 ? index + 1 : -1, row < SIZE - 1 ? index + SIZE : -1, column > 0 ? index - 1 : -1].filter(value => value >= 0);
}
export function moveTile(board, index) {
  if (!isValidBoard(board) || !neighbors(board.indexOf(0)).includes(index)) return null;
  const next = [...board], blank = board.indexOf(0);
  [next[blank], next[index]] = [next[index], next[blank]];
  return next;
}
export function directionTarget(board, direction) {
  if (!isValidBoard(board)) return -1;
  const blank = board.indexOf(0), offset = { up: -4, right: 1, down: 4, left: -1 }[direction];
  const target = blank + offset;
  return offset !== undefined && neighbors(blank).includes(target) ? target : -1;
}
export function moveBlank(board, direction) { return moveTile(board, directionTarget(board, direction)); }
export function isSolved(board) { return isValidBoard(board) && board.every((value, index) => value === (index + 1) % 16); }
export function countCorrect(board) { return board.filter((value, index) => value !== 0 && value === index + 1).length; }
export function isSolvable(board) {
  if (!isValidBoard(board)) return false;
  let inversions = 0;
  for (let i = 0; i < 16; i += 1) for (let j = i + 1; j < 16; j += 1) if (board[i] && board[j] && board[i] > board[j]) inversions += 1;
  const blankRowFromBottom = SIZE - Math.floor(board.indexOf(0) / SIZE);
  return (inversions + blankRowFromBottom) % 2 === 1;
}
export function shuffleBoard(random = Math.random, steps = 60) {
  let board = solvedBoard(), previousBlank = -1;
  const count = Number.isFinite(steps) ? Math.max(1, Math.floor(steps)) : 60;
  for (let step = 0; step < count; step += 1) {
    const blank = board.indexOf(0);
    const choices = neighbors(blank).filter(index => index !== previousBlank);
    const sample = random();
    const fraction = Number.isFinite(sample) ? Math.max(0, Math.min(0.999999999, sample)) : 0;
    board = moveTile(board, choices[Math.floor(fraction * choices.length)]);
    previousBlank = blank;
  }
  // A long legal walk can return to the goal. Start every game with a puzzle.
  return isSolved(board) ? moveTile(board, 11) : board;
}
export function formatElapsed(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
