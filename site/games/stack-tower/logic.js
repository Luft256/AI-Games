export const WORLD_WIDTH = 480;
export const BLOCK_HEIGHT = 26;
export const FLOOR_Y = 494;
export const LEFT_EDGE = 24;
export const RIGHT_EDGE = 456;
export const PLACEMENT_DELAY = 0.18;

export function speedForLevel(level) {
  return 140 + Math.min(level * 6, 170);
}

export function createGame() {
  const base = { x: 130, y: FLOOR_Y, width: 220, level: 0 };
  return {
    status: 'running', blocks: [base], score: 0, perfects: 0, streak: 0,
    active: { x: LEFT_EDGE, y: FLOOR_Y - BLOCK_HEIGHT, width: base.width, direction: 1, level: 1 },
    cooldown: 0, result: null,
  };
}

// Reflect within the available lane, even when a step crosses multiple edges.
export function moveBlock(block, seconds, speed) {
  const span = RIGHT_EDGE - LEFT_EDGE - block.width;
  if (span <= 0) return { ...block, x: LEFT_EDGE };
  const offset = Math.max(0, Math.min(span, block.x - LEFT_EDGE));
  const phase = block.direction > 0 ? offset : 2 * span - offset;
  const next = ((phase + Math.max(0, seconds) * speed) % (2 * span) + 2 * span) % (2 * span);
  return { ...block, x: LEFT_EDGE + (next <= span ? next : 2 * span - next), direction: next < span ? 1 : -1 };
}

export function advanceGame(state, seconds) {
  if (state.status !== 'running') return state;
  const elapsed = Math.max(0, seconds);
  return { ...state, active: moveBlock(state.active, elapsed, speedForLevel(state.score)), cooldown: Math.max(0, state.cooldown - elapsed) };
}

export function overlapBlock(active, previous) {
  const difference = active.x - previous.x;
  const tolerance = Math.min(3, previous.width * 0.08);
  if (Math.abs(difference) <= tolerance) {
    return { kind: 'perfect', block: { ...active, x: previous.x, width: previous.width }, cut: null };
  }
  const left = Math.max(active.x, previous.x);
  const right = Math.min(active.x + active.width, previous.x + previous.width);
  if (right <= left) return { kind: 'miss', block: null, cut: { ...active } };
  const cut = difference > 0
    ? { ...active, x: right, width: active.x + active.width - right }
    : { ...active, width: left - active.x };
  return { kind: 'trim', block: { ...active, x: left, width: right - left }, cut };
}

export function placeBlock(state) {
  if (state.status !== 'running' || state.cooldown > 0) return state;
  const result = overlapBlock(state.active, state.blocks.at(-1));
  if (result.kind === 'miss') return { ...state, status: 'over', active: null, streak: 0, result };
  const score = state.score + 1;
  const direction = score % 2 === 0 ? 1 : -1;
  const active = {
    x: direction > 0 ? LEFT_EDGE : RIGHT_EDGE - result.block.width,
    y: result.block.y - BLOCK_HEIGHT,
    width: result.block.width, direction, level: score + 1,
  };
  return {
    ...state, blocks: [...state.blocks, result.block], active, score,
    perfects: state.perfects + (result.kind === 'perfect' ? 1 : 0),
    streak: result.kind === 'perfect' ? state.streak + 1 : 0,
    cooldown: PLACEMENT_DELAY, result,
  };
}
