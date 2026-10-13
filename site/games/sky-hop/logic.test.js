import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, createGame, startGame, pauseGame, jump, stepGame, speedAt, collides } from './logic.js';
const advance = (state, seconds, rng = () => .5) => { for (let i = 0; i < Math.round(seconds * 120); i++) stepGame(state, 1 / 120, rng); };

test('ready, paused and finished states cannot advance or jump', () => {
  const state = createGame(); const ready = structuredClone(state);
  stepGame(state, 1); assert.deepEqual(state, ready); assert.equal(jump(state), false);
  startGame(state); advance(state, .3); pauseGame(state);
  const paused = structuredClone(state); advance(state, 1); assert.deepEqual(state, paused); assert.equal(jump(state), false);
  state.status = 'over'; startGame(state); assert.equal(state.status, 'over');
  const over = structuredClone(state); stepGame(state, 1); assert.deepEqual(state, over);
});
test('one jump reaches a predictable apex, rejects double jump, and lands exactly', () => {
  const state = startGame(createGame()); assert.equal(jump(state), true); assert.equal(jump(state), false);
  advance(state, .375); const lift = WORLD.ground - state.player.y - state.player.height;
  assert.ok(lift > 128 && lift < 130); assert.equal(state.player.grounded, false);
  advance(state, .4); assert.equal(state.player.y + state.player.height, WORLD.ground);
  assert.equal(state.player.vy, 0); assert.equal(state.player.grounded, true); assert.equal(jump(state), true);
});
test('collision ends the run and score remains frozen after impact', () => {
  const state = startGame(createGame()); state.obstacles.push({ x: 145, y: 280, width: 40, height: 58 });
  advance(state, .1); assert.equal(state.status, 'over');
  const ended = structuredClone(state); advance(state, 2); assert.deepEqual(state, ended);
});
test('jumping over an obstacle avoids impact and counts it once', () => {
  const state = startGame(createGame()); state.obstacles.push({ x: 240, y: 280, width: 40, height: 58, counted: false });
  jump(state); advance(state, .75); assert.equal(state.status, 'running'); assert.equal(state.passed, 1);
  advance(state, .6); assert.equal(state.passed, 1); assert.equal(state.player.grounded, true);
});
test('forgiving hitbox still detects actual overlap while permitting edge clearance', () => {
  const p = createGame().player;
  assert.equal(collides(p, { x: 160, y: 280, width: 40, height: 58 }), false);
  assert.equal(collides(p, { x: 140, y: 280, width: 40, height: 58 }), true);
  assert.equal(collides({ ...p, y: 200 }, { x: 120, y: 280, width: 40, height: 58 }), false);
});
test('difficulty increases gradually and caps at a playable speed', () => {
  assert.equal(speedAt(0), 260); assert.ok(speedAt(60) > speedAt(0)); assert.equal(speedAt(10000), 460);
  assert.equal(speedAt(-10), 260);
});
test('spawn sizes are bounded and separation exceeds the full jump duration', () => {
  for (const value of [0, .5, 1]) {
    const state = startGame(createGame()); state.elapsed = 200; state.spawnIn = 0;
    stepGame(state, 1 / 120, () => value);
    assert.equal(state.obstacles.length, 1);
    const o = state.obstacles[0]; assert.ok(o.width >= 34 && o.width <= 59); assert.ok(o.height >= 42 && o.height <= 73);
    assert.equal(o.y + o.height, WORLD.ground); assert.ok(state.spawnIn >= 1.38);
  }
});
test('long or invalid frame intervals cannot leap through obstacles or inflate scores', () => {
  const state = startGame(createGame()); const before = structuredClone(state);
  for (const dt of [NaN, Infinity, -1, 0]) stepGame(state, dt);
  assert.deepEqual(state, before);
  stepGame(state, 30); assert.ok(state.elapsed <= 1 / 60); assert.ok(state.distance < 5);
});
test('score tracks travelled distance, stale obstacles are removed, new rounds reset', () => {
  const state = startGame(createGame()); state.obstacles.push({ x: -100, y: 280, width: 40, height: 58, counted: true });
  advance(state, 1); assert.equal(state.obstacles.length, 0); assert.equal(state.score, Math.floor(state.distance / 10));
  assert.ok(state.score >= 26); assert.equal(createGame().score, 0); assert.equal(createGame().status, 'ready');
});
test('pausing in midair preserves jump position and velocity for resume', () => {
  const state = startGame(createGame()); jump(state); advance(state, .2); pauseGame(state);
  const { y, vy } = state.player; advance(state, 1); assert.equal(state.player.y, y); assert.equal(state.player.vy, vy);
  startGame(state); advance(state, .6); assert.equal(state.player.grounded, true);
});
