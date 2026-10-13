export const WIDTH = 700, HEIGHT = 470, BALL_RADIUS = 7, STEP = 1 / 120, MAX_FLIGHT = 8;
export const HOLES = [
  { name: 'はじめての引力', hint: '点線をカップへ。上の星がボールを引き寄せます。', par: 2, start: [90, 330], cup: [590, 330], wells: [{ x: 350, y: 150, r: 25, strength: 390000 }], walls: [], sand: [], bumpers: [] },
  { name: '星の向こう側', hint: '壁の上は広い通り道。引力を借りて、右へ回り込もう。', par: 3, start: [90, 350], cup: [590, 340], wells: [{ x: 390, y: 150, r: 27, strength: 490000 }], walls: [{ x: 310, y: 255, w: 22, h: 165 }], sand: [], bumpers: [] },
  { name: '砂の入り江', hint: '砂の上は早く止まります。丸いバンパーで跳ね返るルートも。', par: 3, start: [90, 345], cup: [590, 130], wells: [{ x: 325, y: 150, r: 25, strength: 430000 }], walls: [], sand: [{ x: 330, y: 290, w: 230, h: 110 }], bumpers: [{ x: 480, y: 205, r: 29 }, { x: 200, y: 260, r: 25 }] },
  { name: 'ふたつの星', hint: 'どちらの引力を使う？中央の壁を上下から抜けよう。', par: 3, start: [95, 245], cup: [600, 245], wells: [{ x: 265, y: 140, r: 26, strength: 410000 }, { x: 455, y: 345, r: 26, strength: 410000 }], walls: [{ x: 345, y: 175, w: 20, h: 145 }], sand: [], bumpers: [] },
  { name: 'リバウンド通り', hint: '外周も壁も反射します。小分けに打って、曲がり角を越えよう。', par: 4, start: [80, 350], cup: [620, 115], wells: [{ x: 480, y: 330, r: 24, strength: 360000 }], walls: [{ x: 250, y: 180, w: 20, h: 250 }, { x: 440, y: 40, w: 20, h: 180 }], sand: [{ x: 280, y: 335, w: 115, h: 90 }], bumpers: [{ x: 350, y: 145, r: 23 }] },
  { name: '最後のスイング', hint: '砂を避け、星の間を抜けて。6打以内で最後のカップへ。', par: 4, start: [80, 370], cup: [610, 100], wells: [{ x: 255, y: 245, r: 26, strength: 440000 }, { x: 510, y: 260, r: 27, strength: 460000 }], walls: [{ x: 360, y: 100, w: 20, h: 235 }], sand: [{ x: 395, y: 345, w: 190, h: 80 }], bumpers: [{ x: 160, y: 130, r: 24 }] },
];
export function createBall(hole) { return { x: hole.start[0], y: hole.start[1], vx: 0, vy: 0, time: 0, moving: false, sunk: false }; }
export function launch(ball, angle, power) {
  if (ball.moving || ball.sunk) return false;
  const speed = 90 + Math.max(0, Math.min(100, power)) * 5.2;
  ball.vx = Math.cos(angle) * speed; ball.vy = Math.sin(angle) * speed;
  ball.time = 0; ball.moving = true; return true;
}
function reflectCircle(ball, object) {
  const dx = ball.x - object.x, dy = ball.y - object.y, distance = Math.hypot(dx, dy), edge = object.r + BALL_RADIUS;
  if (distance >= edge) return;
  const nx = distance > 0 ? dx / distance : 1, ny = distance > 0 ? dy / distance : 0;
  ball.x = object.x + nx * edge; ball.y = object.y + ny * edge;
  const normal = ball.vx * nx + ball.vy * ny;
  if (normal < 0) { ball.vx -= 1.8 * normal * nx; ball.vy -= 1.8 * normal * ny; }
}
function reflectWall(ball, wall) {
  const x = Math.max(wall.x, Math.min(wall.x + wall.w, ball.x));
  const y = Math.max(wall.y, Math.min(wall.y + wall.h, ball.y));
  const dx = ball.x - x, dy = ball.y - y, d = Math.hypot(dx, dy);
  if (d >= BALL_RADIUS) return;
  if (d > 0) { reflectCircle(ball, { x, y, r: 0 }); return; }
  const edges = [{ d: ball.x - wall.x, nx: -1, ny: 0 }, { d: wall.x + wall.w - ball.x, nx: 1, ny: 0 }, { d: ball.y - wall.y, nx: 0, ny: -1 }, { d: wall.y + wall.h - ball.y, nx: 0, ny: 1 }];
  const edge = edges.sort((a, b) => a.d - b.d)[0];
  ball.x += edge.nx * (edge.d + BALL_RADIUS); ball.y += edge.ny * (edge.d + BALL_RADIUS);
  const normal = ball.vx * edge.nx + ball.vy * edge.ny;
  if (normal < 0) { ball.vx -= 1.8 * normal * edge.nx; ball.vy -= 1.8 * normal * edge.ny; }
}
export function stepBall(ball, hole, dt = STEP) {
  if (!ball.moving || ball.sunk) return;
  // Call with fixed steps: the preview and live shot use this identical path.
  ball.time += dt;
  for (const well of hole.wells) {
    const dx = well.x - ball.x, dy = well.y - ball.y, d = Math.hypot(dx, dy);
    const a = Math.min(170, well.strength / (d * d + 1800));
    if (d > 0) { ball.vx += dx / d * a * dt; ball.vy += dy / d * a * dt; }
  }
  const inSand = hole.sand.some(s => ball.x >= s.x && ball.x <= s.x + s.w && ball.y >= s.y && ball.y <= s.y + s.h);
  const drag = Math.exp(-(inSand ? 3.3 : .95) * dt);
  ball.vx *= drag; ball.vy *= drag; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  if (ball.x < 27) { ball.x = 27; ball.vx = Math.abs(ball.vx) * .8; }
  if (ball.x > WIDTH - 27) { ball.x = WIDTH - 27; ball.vx = -Math.abs(ball.vx) * .8; }
  if (ball.y < 27) { ball.y = 27; ball.vy = Math.abs(ball.vy) * .8; }
  if (ball.y > HEIGHT - 27) { ball.y = HEIGHT - 27; ball.vy = -Math.abs(ball.vy) * .8; }
  for (const object of [...hole.wells, ...hole.bumpers]) reflectCircle(ball, object);
  for (const wall of hole.walls) reflectWall(ball, wall);
  if (Math.hypot(ball.x - hole.cup[0], ball.y - hole.cup[1]) <= 18 && Math.hypot(ball.vx, ball.vy) <= 190) {
    ball.x = hole.cup[0]; ball.y = hole.cup[1]; ball.vx = 0; ball.vy = 0; ball.moving = false; ball.sunk = true; return;
  }
  if (Math.hypot(ball.vx, ball.vy) < 9 || ball.time >= MAX_FLIGHT) { ball.vx = 0; ball.vy = 0; ball.moving = false; }
}
export function preview(ball, hole, angle, power) {
  const copy = { ...ball }, points = [{ x: copy.x, y: copy.y }]; launch(copy, angle, power);
  for (let i = 0; i < MAX_FLIGHT / STEP && copy.moving; i++) { stepBall(copy, hole); if (i % 10 === 0) points.push({ x: copy.x, y: copy.y }); }
  points.push({ x: copy.x, y: copy.y }); return { points, end: copy };
}
export function scoreFor(strokes) { return Math.max(100, 2400 - strokes * 50); }
