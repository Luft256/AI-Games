export const WORLD = Object.freeze({ width: 900, height: 420, ground: 338 });
export const PHYSICS = Object.freeze({ gravity: 1850, jumpSpeed: 690, maxStep: 1 / 60 });
export function speedAt(seconds) { return Math.min(460, 260 + Math.max(0, seconds) * 2.4); }
export function createGame() {
  return { status: 'ready', elapsed: 0, distance: 0, score: 0, passed: 0,
    spawnIn: 1.85, nextId: 1, player: { x: 116, y: WORLD.ground - 42, width: 34, height: 42, vy: 0, grounded: true }, obstacles: [] };
}
export function startGame(state) {
  if (state.status === 'ready' || state.status === 'paused') state.status = 'running';
  return state;
}
export function pauseGame(state) {
  if (state.status === 'running') state.status = 'paused';
  return state;
}
export function jump(state) {
  if (state.status !== 'running' || !state.player.grounded) return false;
  state.player.vy = -PHYSICS.jumpSpeed;
  state.player.grounded = false;
  return true;
}
export function collides(player, obstacle) {
  // A slightly forgiving inset matches the runner's visible rounded silhouette.
  return player.x + 5 < obstacle.x + obstacle.width - 3 &&
    player.x + player.width - 5 > obstacle.x + 3 &&
    player.y + 4 < obstacle.y + obstacle.height &&
    player.y + player.height - 3 > obstacle.y + 3;
}
export function stepGame(state, dt, random = Math.random) {
  if (state.status !== 'running' || !Number.isFinite(dt) || dt <= 0) return state;
  const step = Math.min(dt, PHYSICS.maxStep);
  const speed = speedAt(state.elapsed);
  const p = state.player;
  state.elapsed += step;
  p.y += p.vy * step + PHYSICS.gravity * step * step / 2;
  p.vy += PHYSICS.gravity * step;
  if (p.y + p.height >= WORLD.ground) { p.y = WORLD.ground - p.height; p.vy = 0; p.grounded = true; }
  for (const obstacle of state.obstacles) obstacle.x -= speed * step;
  state.spawnIn -= step;
  if (state.spawnIn <= 0) {
    const sample = () => Math.min(1, Math.max(0, Number(random()) || 0));
    const width = 34 + Math.floor(sample() * 25);
    const height = 42 + Math.floor(sample() * 31);
    state.obstacles.push({ id: state.nextId++, x: WORLD.width + 35, y: WORLD.ground - height, width, height, counted: false });
    // More than a full jump between obstacles, even at maximum speed.
    state.spawnIn = Math.max(1.38, 1.95 - state.elapsed * .004) + sample() * .36;
  }
  if (state.obstacles.some(obstacle => collides(p, obstacle))) { state.status = 'over'; return state; }
  state.distance += speed * step;
  state.score = Math.floor(state.distance / 10);
  for (const obstacle of state.obstacles) {
    if (!obstacle.counted && obstacle.x + obstacle.width < p.x) { obstacle.counted = true; state.passed++; }
  }
  state.obstacles = state.obstacles.filter(obstacle => obstacle.x + obstacle.width > -40);
  return state;
}
