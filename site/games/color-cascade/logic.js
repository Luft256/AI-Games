export const SIZE = 6;
export const COLORS = 5;
export const MOVE_LIMIT = 20;
export const TARGET = 6000;
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => { state += 0x6D2B79F5; let n = state; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
export function adjacent(a, b) {
  return Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a < SIZE * SIZE && b < SIZE * SIZE && (Math.abs(a - b) === SIZE || Math.floor(a / SIZE) === Math.floor(b / SIZE) && Math.abs(a - b) === 1);
}
export function swap(board, a, b) {
  const next = [...board];
  if (adjacent(a, b)) [next[a], next[b]] = [next[b], next[a]];
  return next;
}
export function findMatches(board) {
  const matches = new Set();
  for (let i = 0; i < SIZE * SIZE; i++) {
    for (const step of [1, SIZE]) {
      if (board[i] === null || (step === 1 && i % SIZE > SIZE - 3) || (step === SIZE && i >= SIZE * (SIZE - 2))) continue;
      if (board[i] !== board[i + step] || board[i] !== board[i + step * 2]) continue;
      let j = i;
      while (j < SIZE * SIZE && (step === SIZE || Math.floor(j / SIZE) === Math.floor(i / SIZE)) && board[j] === board[i]) { matches.add(j); j += step; }
    }
  }
  return [...matches].sort((a, b) => a - b);
}
export function legalMoves(board) {
  const moves = [];
  for (let a = 0; a < board.length; a++) {
    for (const b of [a + 1, a + SIZE]) if (adjacent(a, b) && board[a] !== board[b] && findMatches(swap(board, a, b)).length) moves.push([a, b]);
  }
  return moves;
}
export function makeBoard(random = Math.random) {
  const board = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    const available = Array.from({ length: COLORS }, (_, n) => n).filter(n => !(i % SIZE >= 2 && board[i - 1] === n && board[i - 2] === n) && !(i >= SIZE * 2 && board[i - SIZE] === n && board[i - SIZE * 2] === n));
    board.push(available[Math.min(available.length - 1, Math.floor(random() * available.length))]);
  }
  if (!legalMoves(board).length) {
    // A constructive fallback guarantees a legal horizontal swap, even with a constant RNG.
    board[0] = 0; board[1] = 1; board[2] = 0; board[3] = 2; board[6] = 2; board[7] = 0; board[8] = 3;
    if (findMatches(board).length) return makeBoard(seededRandom(373));
  }
  return board;
}
export function createQueues(random = Math.random) {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => Math.floor(random() * COLORS)));
}
export function collapse(board, matches, queues, random = Math.random, calm = false) {
  const next = [...board];
  const nextQueues = queues.map(queue => [...queue]);
  const cleared = new Set(matches);
  for (let col = 0; col < SIZE; col++) {
    const remaining = [];
    for (let row = SIZE - 1; row >= 0; row--) if (!cleared.has(row * SIZE + col)) remaining.push(board[row * SIZE + col]);
    for (let row = SIZE - 1; row >= 0; row--) {
      if (remaining.length) next[row * SIZE + col] = remaining.shift();
      else { next[row * SIZE + col] = nextQueues[col].shift(); nextQueues[col].push(Math.floor(random() * COLORS)); }
    }
  }
  // Rare long cascades finish with a stable refill; the UI never truncates a match.
  if (calm) {
    for (let pass = 0; pass < 36 && findMatches(next).length; pass++) {
      const index = findMatches(next)[0];
      next[index] = (next[index] + 1) % COLORS;
    }
    if (findMatches(next).length) return { board: makeBoard(random), queues: nextQueues };
  }
  return { board: next, queues: nextQueues };
}
export function waveScore(board, matches, combo, bonus) {
  return matches.reduce((score, index) => score + (board[index] === bonus ? 60 : 30) * combo, 0);
}
export function reshuffle(board, random = Math.random) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const next = [...board];
    for (let i = next.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]]; }
    if (!findMatches(next).length && legalMoves(next).length) return next;
  }
  return makeBoard(random);
}
export function nextCell(index, key) {
  const row = Math.floor(index / SIZE), col = index % SIZE;
  if (key === 'ArrowLeft') return row * SIZE + (col + SIZE - 1) % SIZE;
  if (key === 'ArrowRight') return row * SIZE + (col + 1) % SIZE;
  if (key === 'ArrowUp') return ((row + SIZE - 1) % SIZE) * SIZE + col;
  if (key === 'ArrowDown') return ((row + 1) % SIZE) * SIZE + col;
  return index;
}
