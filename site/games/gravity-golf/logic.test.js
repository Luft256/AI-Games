import test from 'node:test';
import assert from 'node:assert/strict';
import { HOLES, STEP, MAX_FLIGHT, createBall, launch, stepBall, preview, scoreFor } from './logic.js';
const blank = { start: [80, 230], cup: [640, 410], wells: [], walls: [], sand: [], bumpers: [] };
test('preview predicts the identical finite live trajectory', () => {
  for (const hole of HOLES) {
    const ball = createBall(hole), prediction = preview(ball, hole, -.55, 84); launch(ball, -.55, 84);
    for (let i = 0; i < MAX_FLIGHT / STEP && ball.moving; i++) stepBall(ball, hole);
    assert.deepEqual(ball, prediction.end); assert.equal(ball.moving, false); assert.ok(Number.isFinite(ball.x));
  }
});
test('gravity bends the shot toward a star and sand slows it', () => {
  const regular = preview(createBall(blank), blank, 0, 70).end;
  const gravity = { ...blank, wells: [{ x: 330, y: 100, r: 20, strength: 430000 }] };
  const curved = createBall(gravity); launch(curved, 0, 70);
  for (let i = 0; i < 120; i++) stepBall(curved, gravity);
  assert.ok(curved.y < blank.start[1] - 3, 'gravity must bend upward during flight');
  const sandy = { ...blank, sand: [{ x: 0, y: 0, w: 700, h: 470 }] };
  assert.ok(preview(createBall(sandy), sandy, 0, 70).end.x < regular.x - 100);
});
test('walls reflect, cup rejects fast passes and captures slow ones', () => {
  const wall = { ...blank, walls: [{ x: 200, y: 100, w: 20, h: 250 }] }, ball = createBall(wall); launch(ball, 0, 100);
  while (ball.x < 190) stepBall(ball, wall); stepBall(ball, wall); assert.ok(ball.vx < 0);
  const fast = { ...createBall(blank), x: 637, y: 410, vx: 400, vy: 0, moving: true }; stepBall(fast, blank); assert.equal(fast.sunk, false);
  const slow = { ...createBall(blank), x: 633, y: 410, vx: 80, vy: 0, moving: true }; stepBall(slow, blank); assert.equal(slow.sunk, true); assert.equal(slow.moving, false);
});
test('stationary balls never drift and a shot cannot relaunch in motion', () => { const ball = createBall(HOLES[0]); stepBall(ball, HOLES[0]); assert.deepEqual(ball, createBall(HOLES[0])); assert.equal(launch(ball, 0, 50), true); assert.equal(launch(ball, 2, 80), false); });
test('score rewards fewer completed-course strokes', () => { assert.ok(scoreFor(10) > scoreFor(25)); assert.ok(scoreFor(36) > 0); });

test('all curated holes have fair solutions within their six-shot budgets', () => {
  const routes = [[[0,80]],[[21,82]],[[-24,88],[-105,73]],[[-42,100],[-180,76]],[[-51,85],[177,94],[-180,46]],[[-48,88],[-174,67]]];
  HOLES.forEach((hole,i) => { let ball = createBall(hole); for(const [angle,power] of routes[i]) ball = preview(ball,hole,angle * Math.PI / 180,power).end; assert.equal(ball.sunk,true, `hole ${i+1} must be solvable`); assert.ok(routes[i].length <= hole.par); });
});
