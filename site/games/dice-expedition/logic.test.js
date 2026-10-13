import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, startExpedition, toggleGuard, setRoute, reroll, evaluate, resolveRoom, bankLoot, continueExpedition, successCount, MAX_DEPTH, EXPEDITIONS } from './logic.js';
const high = () => .999;
const stateWith = (dice, haul = 0) => ({ ...startExpedition(createRun(high), high), dice, guards: [0, 1], haul });

test('exact visible odds count every possible pair of danger dice, including ties', () => {
  assert.equal(successCount(7, 0), 21);
  assert.equal(successCount(2, 0), 1);
  assert.equal(successCount(12, 0), 36);
  assert.equal(successCount(2, 1), 0);
  for (const guards of [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]) for (const route of ['careful', 'bold']) {
    const state = { ...stateWith([6, 5, 3, 2], 18), guards, route };
    const plan = evaluate(state); let successes = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (resolveRoom(state, [a, b]).last.passed) successes++;
    assert.equal(plan.count, successes);
    assert.equal(plan.expected, successes / 36 * plan.reward - (1 - successes / 36) * 18);
  }
});
test('changing allocation trades defense for reward, and the bold path changes both', () => {
  const state = stateWith([6, 5, 3, 2]);
  const defensive = evaluate(state);
  const greedy = evaluate({ ...state, guards: [2, 3] });
  assert.ok(defensive.probability > greedy.probability);
  assert.ok(defensive.reward < greedy.reward);
  const bold = evaluate(setRoute(state, 'bold'));
  assert.equal(bold.danger, defensive.danger + 2);
  assert.equal(bold.reward, defensive.reward * 2);
});
test('site bonus makes leaving matching high dice for treasure a real alternative', () => {
  const state = { ...stateWith([5, 5, 4, 4]), sites: Array(8).fill(1) };
  const safer = evaluate(state), richer = evaluate({ ...state, guards: [2, 3] });
  assert.equal(safer.bonus, 8); assert.equal(richer.bonus, 8);
  assert.ok(richer.reward > safer.reward); assert.ok(richer.probability < safer.probability);
});
test('a successful room only grants unbanked loot; returning is the scoring action', () => {
  const state = stateWith([6, 6, 5, 5]);
  const success = resolveRoom(state, [1, 1]);
  assert.equal(success.phase, 'decision'); assert.equal(success.score, 0);
  assert.equal(success.haul, evaluate(state).reward);
  assert.equal(bankLoot(state), state, 'cannot bank before a success');
  const banked = bankLoot(success);
  assert.equal(banked.score, success.haul); assert.equal(banked.haul, 0);
  assert.equal(banked.expedition, 2); assert.equal(banked.phase, 'between');
  assert.equal(bankLoot(banked), banked, 'no duplicate scoring');
});
test('failure loses the current haul but preserves previously banked score', () => {
  const state = { ...stateWith([1, 1, 6, 6], 30), score: 42, sites: Array(8).fill(3) };
  const failed = resolveRoom(state, [6, 6]);
  assert.equal(failed.score, 42); assert.equal(failed.haul, 0); assert.equal(failed.last.lost, 30);
  assert.equal(failed.history[0].reason, 'bust'); assert.equal(failed.expedition, 2);
});
test('continuation escalates danger and reward, stops at four rooms, and cannot run after finishing', () => {
  let state = startExpedition(createRun(high), high);
  for (let i = 0; i < MAX_DEPTH; i++) {
    assert.equal(state.depth, i);
    const before = evaluate(state); state = resolveRoom(state, [1, 1]);
    if (i < MAX_DEPTH - 1) {
      state = continueExpedition(state, high);
      const after = evaluate(state); assert.equal(after.danger, before.danger + 1); assert.ok(after.reward > before.reward);
    } else assert.equal(continueExpedition(state, high), state);
  }
  state = bankLoot(state);
  for (let i = 1; i < EXPEDITIONS; i++) state = bankLoot(resolveRoom(startExpedition(state, high), [1, 1]));
  assert.equal(state.phase, 'finished'); assert.equal(state.history.length, EXPEDITIONS);
  assert.equal(startExpedition(state, high), state); assert.equal(continueExpedition(state, high), state);
});
test('five rerolls are shared across expeditions and do not alter the other dice', () => {
  let state = stateWith([6, 5, 4, 3]);
  state = reroll(state, 0, () => 0);
  assert.deepEqual(state.dice, [1, 5, 4, 3]); assert.equal(state.supplies, 4);
  for (let i = 0; i < 4; i++) state = reroll(state, 1, high);
  assert.equal(state.supplies, 0); assert.equal(reroll(state, 2, high), state);
  const next = startExpedition(bankLoot(resolveRoom({ ...state, guards: [1, 2] }, [1, 1])), high);
  assert.equal(next.supplies, 0);
});
test('allocation rejects invalid actions and requires exactly two guards', () => {
  const state = stateWith([6, 5, 4, 3]);
  const incomplete = toggleGuard(state, 0);
  assert.equal(evaluate(incomplete), null); assert.equal(resolveRoom(incomplete, [1, 1]), incomplete);
  assert.equal(toggleGuard(state, 9), state); assert.equal(reroll(state, -1), state);
  assert.equal(resolveRoom(state, [0, 7]), state);
  assert.equal(evaluate(toggleGuard(incomplete, 2)).guard, 9);
  assert.equal(toggleGuard(bankLoot(resolveRoom(state, [1, 1])), 2).phase, 'between');
});
