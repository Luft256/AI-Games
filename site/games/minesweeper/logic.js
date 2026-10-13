export function neighbors(index, size) {
  const row = Math.floor(index / size), col = index % size, result = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const r = row + dr, c = col + dc;
    if ((dr || dc) && r >= 0 && r < size && c >= 0 && c < size) result.push(r * size + c);
  }
  return result;
}
export function createField(size, mineCount, safeIndex, random = Math.random) {
  const excluded = new Set([safeIndex, ...neighbors(safeIndex, size)]);
  const candidates = Array.from({ length: size * size }, (_, i) => i).filter(i => !excluded.has(i));
  if (mineCount > candidates.length) throw new Error('Too many mines for a safe opening');
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(random() * (i + 1)));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const mines = new Set(candidates.slice(0, mineCount));
  return Array.from({ length: size * size }, (_, index) => ({ mine: mines.has(index), adjacent: neighbors(index, size).filter(i => mines.has(i)).length, revealed: false, flagged: false }));
}
export function revealCells(cells, size, index) {
  if (cells[index].revealed || cells[index].flagged) return { cells, hit: false, changed: false };
  const next = cells.map(cell => ({ ...cell }));
  if (next[index].mine) { next[index].revealed = true; return { cells: next, hit: true, changed: true }; }
  const queue = [index], visited = new Set();
  while (queue.length) {
    const current = queue.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    const cell = next[current];
    if (cell.flagged || cell.mine || cell.revealed) continue;
    cell.revealed = true;
    if (cell.adjacent === 0) queue.push(...neighbors(current, size));
  }
  return { cells: next, hit: false, changed: true };
}
export function hasWon(cells) { return cells.every(cell => cell.mine || cell.revealed); }
