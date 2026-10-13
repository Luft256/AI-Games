import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAMBERS, BORDER, WIDTH, HEIGHT, createRound, shoot, traceShot, raySegment } from './logic.js';
const plans = [{ angle: -25, mirrors: [] }, { angle: -48, mirrors: [] }, { angle: -39.3, mirrors: [0] }, { angle: -62, mirrors: [] }, { angle: -30, mirrors: [0, 1] }, { angle: -42, mirrors: [0, 1] }];
test('all six curated chambers clear with an achievable one-decimal input and correct relay order', () => {
  CHAMBERS.forEach((chamber, i) => {
    const round = createRound(chamber); round.orientations = plans[i].mirrors;
    const shot = shoot(chamber, round, plans[i].angle);
    assert.equal(shot.reason, 'clear', `chamber ${i + 1}`); assert.equal(round.result, 'clear'); assert.equal(round.used, 1);
    assert.deepEqual(shot.hits.map(hit => hit.index), chamber.targets.map((_, n) => n));
    for (const segment of shot.segments) { assert.ok(segment.to.x >= BORDER - .01 && segment.to.x <= WIDTH - BORDER + .01); assert.ok(segment.to.y >= BORDER - .01 && segment.to.y <= HEIGHT - BORDER + .01); }
    assert.equal(shoot(chamber, round, plans[i].angle), null, 'cleared rounds reject further shots');
  });
});
test('an unreflected direct shot cannot activate a shielded relay, and preserves existing progress', () => {
  const chamber = CHAMBERS[0], round = createRound(chamber); round.activated = 1;
  const target = chamber.targets[1]; const angle = Math.atan2(target.y - chamber.source.y, target.x - chamber.source.x) * 180 / Math.PI;
  assert.equal(shoot(chamber, round, angle).reason, 'shield'); assert.equal(round.activated, 1); assert.equal(round.shots, 2);
  shoot(chamber, round, angle); shoot(chamber, round, angle); assert.equal(round.result, 'fail'); assert.equal(shoot(chamber, round, angle), null);
});
test('future relay contact stops the pulse before shield checks', () => {
  const chamber = CHAMBERS[1], target = chamber.targets[2];
  const angle = Math.atan2(target.y - chamber.source.y, target.x - chamber.source.x) * 180 / Math.PI;
  const shot = traceShot(chamber, angle); assert.equal(shot.reason, 'order'); assert.equal(shot.next, 0); assert.equal(shot.hits[0].index, 2);
});
test('changing a mirror changes the route and mirror gates cannot be bypassed', () => {
  const good = traceShot(CHAMBERS[2], -39.3, [0]); const bad = traceShot(CHAMBERS[2], -39.3, [1]);
  assert.equal(good.reason, 'clear'); assert.notEqual(bad.reason, 'clear');
  assert.notDeepEqual(good.segments[1].to, bad.segments[1].to);
  const c = CHAMBERS[2], target = c.targets[1], a = Math.atan2(target.y - c.source.y, target.x - c.source.x) * 180 / Math.PI;
  assert.notEqual(traceShot(c, a, [1], 1).reason, 'clear');
});
test('partial activation persists and a second pulse can finish a chamber', () => {
  const c = CHAMBERS[0], round = createRound(c);
  const a = Math.atan2(c.targets[0].y - c.source.y, c.targets[0].x - c.source.x) * 180 / Math.PI;
  shoot(c, round, a + 2); assert.equal(round.activated, 1); assert.equal(round.result, null);
  assert.equal(shoot(c, round, -25).reason, 'clear'); assert.equal(round.used, 2);
});
test('preview and axis-aligned/corner rays terminate within the reflection and distance budget', () => {
  const c = CHAMBERS[0];
  for (const angle of [0, 90, 180, -90, -35.047]) { const p = traceShot(c, angle, [], 0, { ignoreTargets: true }); assert.ok(p.segments.length <= 7); assert.ok(p.distance <= 1800 + .001); assert.ok(Number.isFinite(p.distance)); }
  const preview = traceShot(CHAMBERS[5], -42, [0, 1], 0, { ignoreTargets: true, maxBounces: 2, maxDistance: 1000 }); assert.ok(preview.segments.length <= 3); assert.ok(preview.distance <= 1000);
  assert.equal(raySegment({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 2 }, { x: 10, y: 2 }), null);
});

test('a ray hitting an exact corner reflects both walls without leaving the board', () => {
  const c = CHAMBERS[0], angle = Math.atan2(BORDER - c.source.y, WIDTH - BORDER - c.source.x) * 180 / Math.PI;
  const path = traceShot(c, angle, [], 0, { ignoreTargets: true });
  assert.ok(Math.abs(path.segments[0].to.x - (WIDTH - BORDER)) < 1e-7);
  assert.ok(Math.abs(path.segments[0].to.y - BORDER) < 1e-7);
  for (const s of path.segments) { assert.ok(s.to.x >= BORDER - .01 && s.to.x <= WIDTH - BORDER + .01); assert.ok(s.to.y >= BORDER - .01 && s.to.y <= HEIGHT - BORDER + .01); }
});
