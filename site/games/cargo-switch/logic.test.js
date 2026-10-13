import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance, selectRoute, holdFeed, upcoming, accuracy, makeSchedule } from './logic.js';
test('both lanes have telegraph time and all arrivals remain switchable', () => {
  for (const random of [() => 0, () => .99, () => .45]) {
    const cargo = makeSchedule(random);
    assert.equal(cargo.length, 30);
    for (let i = 0; i < cargo.length; i++) {
      assert.ok(cargo[i].arrival - cargo[i].spawn >= 5);
      if (i) assert.ok(cargo[i].arrival - cargo[i - 1].arrival >= 1.29);
    }
    assert.ok(cargo.at(-1).arrival < 90);
  }
});
test('perfect routing rewards combos and completes exactly once', () => {
  const game = createGame(() => .7);
  for (const item of game.cargo) {
    selectRoute(game, item.target);
    advance(game, item.arrival - game.time);
  }
  assert.equal(game.result, 'complete'); assert.equal(game.correct, 30); assert.equal(accuracy(game), 100);
  assert.equal(game.score, 5700); assert.equal(game.stage, 3);
  advance(game, 100); assert.equal(game.score, 5700); assert.equal(selectRoute(game, 1), false);
});
test('route locks at junction and wrong deliveries reset combo without changing delivered cargo', () => {
  const game = createGame(() => 0);
  advance(game, game.cargo[0].arrival); assert.equal(game.cargo[0].correct, true);
  selectRoute(game, 2); advance(game, game.cargo[1].arrival - game.time);
  assert.equal(game.combo, 0); assert.equal(game.correct, 1); assert.equal(game.delivered, 2);
  selectRoute(game, 1); assert.equal(game.cargo[1].routed, 2);
  assert.equal(upcoming(game)[0].id, 2);
});
test('limited hold preserves safe arrival spacing, replenishes only at next stage', () => {
  const game = createGame(); const arrivals = game.cargo.map(item => item.arrival);
  assert.equal(holdFeed(game), true); assert.equal(holdFeed(game), false);
  assert.deepEqual(game.cargo.map(item => item.arrival), arrivals.map(time => time + 1.6));
  for (let i = 0; i < 10; i++) advance(game, game.cargo[i].arrival - game.time);
  assert.equal(game.holds, 1); assert.equal(holdFeed(game), true);
});
test('practice uses three known symbols without official shift or hold resources', () => {
  const game = createGame(() => .99, true);
  assert.deepEqual(game.cargo.map(item => item.target), [0, 1, 2]);
  assert.equal(holdFeed(game), false);
  advance(game, -2); assert.equal(game.time, 0);
  selectRoute(game, 4); assert.equal(game.route, 0);
});
