export const TAU = Math.PI * 2;
export const ORBIT_RADIUS = 172;
export const OUTER_RADIUS = 278;
export const PLAYER_RADIUS = 11;
export const TURN_SPEED = 3.2;
export const WARNING_TIME = .72;
export function normalizeAngle(angle) { return ((angle % TAU) + TAU) % TAU; }
export function angleDifference(target, current) { return Math.atan2(Math.sin(target - current), Math.cos(target - current)); }
export function createGame() {
  return { angle: -Math.PI / 2, time: 0, score: 0, dodged: 0, wave: 0, spawnIn: .65, meteors: [], result: null, nextId: 0 };
}
export function difficulty(time) { return Math.min(1, Math.max(0, time) / 100); }
export function spawnWave(state, random = Math.random) {
  state.wave++;
  const level = difficulty(state.time);
  const count = state.wave % 4 === 0 ? (level > .55 ? 3 : 2) : 1;
  const base = normalizeAngle(state.angle + (random() - .5) * 2.4);
  for (let i = 0; i < count; i++) {
    state.meteors.push({ id: state.nextId++, angle: normalizeAngle(base + i * (1.1 + random() * .6)), radius: OUTER_RADIUS, size: 13, speed: 92 + level * 68, warning: WARNING_TIME, passed: false });
  }
  state.spawnIn += 1.15 - level * .43;
}
export function collides(angle, meteor) {
  const distanceSquared = ORBIT_RADIUS ** 2 + meteor.radius ** 2 - 2 * ORBIT_RADIUS * meteor.radius * Math.cos(angleDifference(angle, meteor.angle));
  return distanceSquared <= (PLAYER_RADIUS + meteor.size) ** 2;
}
export function scoreFor(time, dodged) { return Math.floor(Math.max(0, time) * 10) + Math.max(0, dodged) * 25; }
// Small steps prevent a meteor or player from jumping through a collision.
export function advance(state, delta, input = {}, random = Math.random) {
  if (state.result || !Number.isFinite(delta) || delta <= 0) return;
  const duration = Math.min(delta, .05);
  const steps = Math.ceil(duration / (1 / 240));
  const dt = duration / steps;
  for (let step = 0; step < steps; step++) {
    let turn = Math.max(-1, Math.min(1, Number(input.direction) || 0)) * TURN_SPEED * dt;
    if (!input.direction && Number.isFinite(input.target)) {
      const distance = angleDifference(input.target, state.angle);
      turn = Math.max(-TURN_SPEED * dt, Math.min(TURN_SPEED * dt, distance));
    }
    state.angle = normalizeAngle(state.angle + turn);
    state.time += dt;
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) spawnWave(state, random);
    for (const meteor of state.meteors) {
      if (meteor.warning > 0) {
        const remaining = Math.max(0, dt - meteor.warning);
        meteor.warning = Math.max(0, meteor.warning - dt);
        meteor.radius -= meteor.speed * remaining;
      } else meteor.radius -= meteor.speed * dt;
      if (collides(state.angle, meteor)) {
        state.result = 'over';
        state.score = scoreFor(state.time, state.dodged);
        return;
      }
      if (!meteor.passed && meteor.radius < ORBIT_RADIUS - PLAYER_RADIUS - meteor.size) {
        meteor.passed = true;
        state.dodged++;
      }
    }
    state.meteors = state.meteors.filter(meteor => meteor.radius > 16);
    state.score = scoreFor(state.time, state.dodged);
  }
}
