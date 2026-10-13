import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advanceGame, placeBlock, overlapBlock, moveBlock, LEFT_EDGE, RIGHT_EDGE, BLOCK_HEIGHT, speedForLevel } from './logic.js';

function alignedGame(offset = 0) {
  const game = createGame();
  game.active.x = game.blocks[0].x + offset;
  return game;
}

test('a fresh tower has a centered base and no awarded height', () => {
  const game = createGame();
  assert.equal(game.score, 0);
  assert.equal(game.blocks.length, 1);
  assert.equal(game.active.width, game.blocks[0].width);
  assert.equal(game.active.y, game.blocks[0].y - BLOCK_HEIGHT);
  assert.equal(game.active.x, LEFT_EDGE);
});

test('a right overhang is cut and the next block uses only the overlap', () => {
  const next = placeBlock(alignedGame(40));
  assert.equal(next.score, 1);
  assert.equal(next.blocks.at(-1).x, 170);
  assert.equal(next.blocks.at(-1).width, 180);
  assert.equal(next.result.cut.x, 350);
  assert.equal(next.result.cut.width, 40);
  assert.equal(next.active.width, 180);
  assert.equal(next.active.x, RIGHT_EDGE - 180);
  assert.equal(next.active.direction, -1);
});

test('a left overhang retains the supported left edge', () => {
  const next = placeBlock(alignedGame(-60));
  assert.equal(next.blocks.at(-1).x, 130);
  assert.equal(next.blocks.at(-1).width, 160);
  assert.equal(next.result.cut.x, 70);
  assert.equal(next.result.cut.width, 60);
});

test('near-perfect placements snap and increment streak without growing width', () => {
  const next = placeBlock(alignedGame(2.9));
  assert.equal(next.result.kind, 'perfect');
  assert.equal(next.blocks.at(-1).x, 130);
  assert.equal(next.blocks.at(-1).width, 220);
  assert.equal(next.perfects, 1);
  assert.equal(next.streak, 1);
  assert.equal(next.result.cut, null);
  const game = { ...next, cooldown: 0, active: { ...next.active, x: 134 } };
  const trimmed = placeBlock(game);
  assert.equal(trimmed.streak, 0);
  assert.equal(trimmed.perfects, 1);
});

test('perfect tolerance scales down for narrow blocks', () => {
  const previous = { x: 100, width: 2, y: 50 };
  assert.equal(overlapBlock({ ...previous, x: 100.15 }, previous).kind, 'perfect');
  assert.equal(overlapBlock({ ...previous, x: 100.2 }, previous).kind, 'trim');
});

test('edge contact and a full miss end the game without awarding height', () => {
  for (const offset of [-221, -220, 220, 221]) {
    const next = placeBlock(alignedGame(offset));
    assert.equal(next.status, 'over');
    assert.equal(next.score, 0);
    assert.equal(next.blocks.length, 1);
    assert.equal(next.active, null);
    assert.equal(next.result.kind, 'miss');
    assert.equal(placeBlock(next), next);
    assert.equal(advanceGame(next, 1), next);
  }
});

test('even a tiny positive overlap survives', () => {
  const next = placeBlock(alignedGame(219.9));
  assert.equal(next.status, 'running');
  assert.ok(Math.abs(next.active.width - 0.1) < 1e-9);
});

test('cooldown rejects duplicate placements and expires with simulation time', () => {
  const next = placeBlock(alignedGame());
  assert.equal(placeBlock(next), next);
  const advanced = advanceGame(next, 0.2);
  assert.equal(advanced.cooldown, 0);
  advanced.active.x = advanced.blocks.at(-1).x;
  assert.equal(placeBlock(advanced).score, 2);
});

test('movement reflects cleanly at both edges and after multiple traversals', () => {
  const block = { x: 224, width: 220, direction: 1 };
  const bounced = moveBlock(block, 0.2, 140);
  assert.equal(bounced.x, 220);
  assert.equal(bounced.direction, -1);
  const left = moveBlock({ ...block, x: 30, direction: -1 }, 0.1, 140);
  assert.equal(left.x, 32);
  assert.equal(left.direction, 1);
  const span = RIGHT_EDGE - LEFT_EDGE - block.width;
  const many = moveBlock({ ...block, x: LEFT_EDGE }, (span * 7 + 10) / 140, 140);
  assert.ok(Math.abs(many.x - (RIGHT_EDGE - block.width - 10)) < 1e-9);
  assert.equal(many.direction, -1);
});

test('negative elapsed time cannot move a block or clear its cooldown', () => {
  const game = placeBlock(alignedGame());
  const next = advanceGame(game, -1);
  assert.equal(next.active.x, game.active.x);
  assert.equal(next.cooldown, game.cooldown);
  assert.equal(speedForLevel(0), 140);
  assert.equal(speedForLevel(1000), 310);
});
