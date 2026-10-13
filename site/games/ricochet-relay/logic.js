export const WIDTH = 640, HEIGHT = 480, BORDER = 24, TARGET_RADIUS = 19;
export const MAX_BOUNCES = 6, MAX_DISTANCE = 1800;
const EPS = 0.001;
const cross = (a, b) => a.x * b.y - a.y * b.x;
export function mirrorSegment(mirror, orientation = mirror.orientation) {
  const dy = orientation === 0 ? -mirror.size : mirror.size;
  return [{ x: mirror.x - mirror.size, y: mirror.y - dy }, { x: mirror.x + mirror.size, y: mirror.y + dy }];
}
export function raySegment(origin, direction, a, b) {
  const edge = { x: b.x - a.x, y: b.y - a.y }, offset = { x: a.x - origin.x, y: a.y - origin.y };
  const denominator = cross(direction, edge);
  if (Math.abs(denominator) < 1e-9) return null;
  const distance = cross(offset, edge) / denominator, along = cross(offset, direction) / denominator;
  return distance > EPS && along >= -1e-9 && along <= 1 + 1e-9 ? distance : null;
}
function rayCircle(origin, direction, target) {
  const offset = { x: origin.x - target.x, y: origin.y - target.y };
  const projection = offset.x * direction.x + offset.y * direction.y;
  const discriminant = projection ** 2 - (offset.x ** 2 + offset.y ** 2 - TARGET_RADIUS ** 2);
  if (discriminant < 0) return null;
  const near = -projection - Math.sqrt(discriminant), far = -projection + Math.sqrt(discriminant);
  return near > EPS ? near : far > EPS ? far : null;
}
export function traceShot(chamber, angle, orientations = chamber.mirrors.map(m => m.orientation), activated = 0, options = {}) {
  let origin = { ...chamber.source }, direction = { x: Math.cos(angle * Math.PI / 180), y: Math.sin(angle * Math.PI / 180) };
  let bounces = 0, mirrorHits = 0, distance = 0, next = activated, reason = 'spent';
  const segments = [], hits = [];
  const walls = [[{ x: BORDER, y: BORDER }, { x: WIDTH - BORDER, y: BORDER }], [{ x: WIDTH - BORDER, y: BORDER }, { x: WIDTH - BORDER, y: HEIGHT - BORDER }], [{ x: WIDTH - BORDER, y: HEIGHT - BORDER }, { x: BORDER, y: HEIGHT - BORDER }], [{ x: BORDER, y: HEIGHT - BORDER }, { x: BORDER, y: BORDER }]];
  const maximum = options.maxDistance ?? MAX_DISTANCE;
  for (let iteration = 0; iteration < 32 && distance < maximum; iteration++) {
    let nearest = maximum - distance, surface = null;
    walls.forEach(([a, b], i) => { const t = raySegment(origin, direction, a, b); if (t !== null && t < nearest) { nearest = t; surface = { type: 'wall', i }; } });
    chamber.mirrors.forEach((mirror, i) => { const [a, b] = mirrorSegment(mirror, orientations[i]); const t = raySegment(origin, direction, a, b); if (t !== null && t < nearest) { nearest = t; surface = { type: 'mirror', i }; } });
    const candidates = options.ignoreTargets ? [] : chamber.targets.map((target, i) => ({ target, i, t: i < next ? null : rayCircle(origin, direction, target) })).filter(hit => hit.t !== null && hit.t <= nearest).sort((a, b) => a.t - b.t);
    let terminal = false;
    for (const hit of candidates) {
      if (hit.i < next) continue;
      const point = { x: origin.x + direction.x * hit.t, y: origin.y + direction.y * hit.t };
      if (hit.i !== next) { reason = 'order'; nearest = hit.t; terminal = true; hits.push({ index: hit.i, kind: 'order', distance: distance + hit.t, point }); break; }
      if (bounces < hit.target.bounces || mirrorHits < (hit.target.mirror ? 1 : 0)) { reason = 'shield'; nearest = hit.t; terminal = true; hits.push({ index: hit.i, kind: 'shield', distance: distance + hit.t, point }); break; }
      hits.push({ index: hit.i, kind: 'relay', distance: distance + hit.t, point }); next++;
      if (next === chamber.targets.length) { reason = 'clear'; nearest = hit.t; terminal = true; break; }
    }
    const end = { x: origin.x + direction.x * nearest, y: origin.y + direction.y * nearest };
    segments.push({ from: { ...origin }, to: end, start: distance, end: distance + nearest, bounces, mirrorHits, surface });
    distance += nearest;
    if (terminal || !surface || bounces >= (options.maxBounces ?? MAX_BOUNCES)) break;
    if (surface.type === 'mirror') {
      const oldX = direction.x;
      direction = orientations[surface.i] === 0 ? { x: -direction.y, y: -oldX } : { x: direction.y, y: oldX };
      mirrorHits++;
    } else {
      // A true corner contacts two walls at once: reflect both axes rather than escaping the board.
      if (Math.abs(end.x - BORDER) < 1e-7 || Math.abs(end.x - (WIDTH - BORDER)) < 1e-7) direction.x *= -1;
      if (Math.abs(end.y - BORDER) < 1e-7 || Math.abs(end.y - (HEIGHT - BORDER)) < 1e-7) direction.y *= -1;
    }
    bounces++;
    origin = { x: end.x + direction.x * EPS * 2, y: end.y + direction.y * EPS * 2 };
  }
  return { segments, hits, next, reason, distance, bounces, mirrorHits };
}
export function createRound(chamber) { return { activated: 0, shots: chamber.budget, used: 0, orientations: chamber.mirrors.map(m => m.orientation), result: null }; }
export function shoot(chamber, round, angle) {
  if (round.result || round.shots <= 0) return null;
  const path = traceShot(chamber, angle, round.orientations, round.activated);
  round.shots--; round.used++; round.activated = path.next;
  if (path.reason === 'clear') round.result = 'clear'; else if (!round.shots) round.result = 'fail';
  return path;
}
export const CHAMBERS = [
  { name: 'はじめの反射', note: '①を通り、右の壁で折り返して②へ。②の「1+」は1回以上の反射が必要です。', source: { x: 80, y: 400 }, aim: -12, budget: 3, mirrors: [], targets: [{ x: 234, y: 328, bounces: 0 }, { x: 536, y: 113, bounces: 1 }] },
  { name: '三角の回路', note: '上の壁から右の壁へ。①→②→③をひとつの線で結ぶ角度を探そう。', source: { x: 80, y: 400 }, aim: -35, budget: 3, mirrors: [], targets: [{ x: 174, y: 296, bounces: 0 }, { x: 515, y: 131, bounces: 1 }, { x: 483, y: 391, bounces: 2 }] },
  { name: '鏡の分岐', note: '鏡Aを切り替えて道を作ろう。「鏡」マークのリレーには、鏡を通った光が必要。', source: { x: 80, y: 400 }, aim: -25, budget: 3, mirrors: [{ x: 300, y: 220, size: 45, orientation: 1 }], targets: [{ x: 181, y: 318, bounces: 0 }, { x: 354, y: 154, bounces: 1, mirror: true }, { x: 481, y: 49, bounces: 2, mirror: true }] },
  { name: '長い往復', note: '4つのリレー、3つの折り返し。予告線の先を、壁の入射角から考えよう。', source: { x: 100, y: 380 }, aim: -45, budget: 4, mirrors: [], targets: [{ x: 180, y: 230, bounces: 0 }, { x: 358, y: 154, bounces: 1 }, { x: 546, y: 405, bounces: 2 }, { x: 498, y: 52, bounces: 3 }] },
  { name: '二枚のレンズ', note: 'AからBへ、そして左へ。2枚の鏡の向きを選び、③と④へ流そう。', source: { x: 80, y: 380 }, aim: -45, budget: 4, mirrors: [{ x: 340, y: 230, size: 47, orientation: 1 }, { x: 430, y: 90, size: 38, orientation: 0 }], targets: [{ x: 193, y: 315, bounces: 0 }, { x: 373, y: 174, bounces: 1, mirror: true }, { x: 328, y: 140, bounces: 2, mirror: true }, { x: 120, y: 260, bounces: 2, mirror: true }] },
  { name: 'リコシェリレー', note: '最後の回路。④は5回反射が必要。上と右の壁、そして鏡Bの先を読もう。', source: { x: 80, y: 400 }, aim: -30, budget: 4, mirrors: [{ x: 320, y: 184, size: 44, orientation: 1 }, { x: 445, y: 310, size: 42, orientation: 0 }], targets: [{ x: 184, y: 306, bounces: 0 }, { x: 365, y: 134, bounces: 1, mirror: true }, { x: 559, y: 129, bounces: 2, mirror: true }, { x: 500, y: 117, bounces: 5, mirror: true }] },
];
