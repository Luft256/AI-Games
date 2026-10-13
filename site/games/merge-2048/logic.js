export const SIZE = 4;
export function slideLine(line) {
  const values = line.filter(Boolean);
  const next = [];
  let score = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] === values[i + 1]) {
      const merged = values[i] * 2;
      next.push(merged);
      score += merged;
      i++;
    } else next.push(values[i]);
  }
  return { line: [...next, ...Array(line.length - next.length).fill(0)], score };
}
export function moveBoard(board, direction) {
  if (!['left', 'right', 'up', 'down'].includes(direction)) throw new Error('Unknown direction');
  const next = [...board];
  let score = 0;
  for (let row = 0; row < SIZE; row++) {
    const indexes = Array.from({ length: SIZE }, (_, col) => direction === 'left' ? row * SIZE + col : direction === 'right' ? row * SIZE + SIZE - 1 - col : direction === 'up' ? col * SIZE + row : (SIZE - 1 - col) * SIZE + row);
    const result = slideLine(indexes.map(i => board[i]));
    result.line.forEach((value, i) => { next[indexes[i]] = value; });
    score += result.score;
  }
  return { board: next, score, changed: next.some((v, i) => v !== board[i]) };
}
export function spawnTile(board, random = Math.random) {
  const empty = board.flatMap((value, index) => value === 0 ? [index] : []);
  if (!empty.length) return [...board];
  const next = [...board];
  const index = empty[Math.min(empty.length - 1, Math.floor(random() * empty.length))];
  next[index] = random() < 0.9 ? 2 : 4;
  return next;
}
export function canMove(board) {
  return board.includes(0) || ['left', 'up'].some(direction => moveBoard(board, direction).changed);
}
