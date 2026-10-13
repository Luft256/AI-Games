import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance, spawnWave, collides, scoreFor, normalizeAngle, angleDifference, ORBIT_RADIUS, PLAYER_RADIUS, WARNING_TIME, TURN_SPEED, TAU, difficulty } from './logic.js';
function isolated() { const state = createGame(); state.spawnIn = Infinity; return state; }
function meteor(overrides = {}) { return { id: 0, angle: 0, radius: ORBIT_RADIUS, size: 13, speed: 120, warning: 0, passed: false, ...overrides }; }
function near(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≈ ${expected}`); }
test('new game begins at the top with no score or threats', () => {
  const state = createGame(); assert.equal(state.time, 0); assert.equal(state.score, 0); assert.deepEqual(state.meteors, []); assert.equal(state.result, null); near(state.angle, -Math.PI / 2);
});
test('angles wrap and pointer takes the shortest route through zero', () => {
  near(normalizeAngle(-.1), TAU - .1); near(angleDifference(.1, TAU - .1), .2);
  const state = isolated(); state.angle = TAU - .01; advance(state, .05, { target: .01 }); near(state.angle, .01);
});
test('keyboard and pointer share a capped angular speed', () => {
  const keyboard = isolated(); const pointer = isolated(); keyboard.angle = 0; pointer.angle = 0;
  advance(keyboard, .05, { direction: 1 }); advance(pointer, .05, { target: 2 }); near(keyboard.angle, TURN_SPEED * .05); near(pointer.angle, keyboard.angle);
});
test('invalid and long frames cannot leap ahead', () => {
  const state = isolated(); advance(state, NaN); advance(state, -1); assert.equal(state.time, 0);
  advance(state, 500); near(state.time, .05);
});
test('collision uses the true circular hitboxes, including angle wrap', () => {
  assert.ok(collides(TAU, meteor())); assert.ok(collides(0, meteor({ radius: ORBIT_RADIUS + PLAYER_RADIUS + 13 })));
  assert.equal(collides(0, meteor({ radius: ORBIT_RADIUS + 25 })), false);
  assert.equal(collides(.5, meteor()), false);
});
test('warning holds the meteor at the edge before launch', () => {
  const state = isolated(); state.angle = Math.PI; const threat = meteor({ radius: 278, warning: .08 }); state.meteors.push(threat);
  advance(state, .05); near(threat.radius, 278); near(threat.warning, .03);
  advance(state, .05); near(threat.radius, 278 - 120 * .02); near(threat.warning, 0);
});
test('crossing the inner safe edge counts each dodge only once', () => {
  const state = isolated(); state.angle = Math.PI; const threat = meteor({ radius: ORBIT_RADIUS - PLAYER_RADIUS - 13 + 1 }); state.meteors.push(threat);
  advance(state, .05); assert.equal(state.dodged, 1); assert.equal(threat.passed, true);
  advance(state, .05); assert.equal(state.dodged, 1); assert.equal(state.score, scoreFor(state.time, 1));
});
test('fast meteor collisions stop the run and never award a dodge', () => {
  const state = isolated(); state.angle = 0; state.meteors.push(meteor({ radius: ORBIT_RADIUS + 35, speed: 2000 }));
  advance(state, .05); assert.equal(state.result, 'over'); assert.equal(state.dodged, 0); assert.ok(state.time < .05);
  const snapshot = structuredClone(state); advance(state, .05, { direction: 1 }); assert.deepEqual(state, snapshot);
});
test('score rewards only elapsed play and completed dodges', () => {
  assert.equal(scoreFor(12.34, 3), 198); assert.equal(scoreFor(-1, 0), 0);
  const state = isolated(); advance(state, .05); assert.equal(state.score, 0);
});
test('waves keep a full telegraph as difficulty rises and cap intensity', () => {
  const state = createGame(); state.time = 100; state.wave = 3; spawnWave(state, () => .5);
  assert.equal(state.meteors.length, 3); assert.equal(new Set(state.meteors.map(item => item.angle)).size, 3);
  assert.ok(state.meteors.every(item => item.warning === WARNING_TIME && item.speed === 160 && item.radius === 278));
  assert.equal(difficulty(500), 1); assert.equal(difficulty(-10), 0); assert.ok(state.spawnIn >= .72);
});
test('time partitioning gives the same movement and survival score', () => {
  const whole = isolated(); const split = isolated(); advance(whole, .05, { direction: -1 });
  for (let i = 0; i < 5; i++) advance(split, .01, { direction: -1 });
  near(whole.time, split.time); near(whole.angle, split.angle); assert.equal(whole.score, split.score);
});
test('meteors are removed after reaching the center', () => {
  const state = isolated(); state.angle = Math.PI; state.meteors.push(meteor({ radius: 17, passed: true }));
  advance(state, .05); assert.equal(state.meteors.length, 0);
});
