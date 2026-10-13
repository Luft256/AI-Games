export const SHIFT_SECONDS = 90;
export const TOTAL_CARGO = 30;
export const DESTINATIONS = [
  { symbol: '●', name: '丸の倉庫', color: '#f6bc68', short: '丸' },
  { symbol: '▲', name: '三角の倉庫', color: '#8dddc5', short: '三角' },
  { symbol: '■', name: '四角の倉庫', color: '#b4abf8', short: '四角' },
];
export function makeSchedule(random = Math.random, practice = false) {
  let arrival = practice ? 3.5 : 5.5;
  const cargo = [];
  for (let i = 0; i < (practice ? 3 : TOTAL_CARGO); i++) {
    const stage = Math.floor(i / 10) + 1;
    if (i) arrival += practice ? 3.5 : [2.4, 1.8, 1.3][stage - 1];
    let target = practice ? i : Math.floor(Math.min(.999999, Math.max(0, random())) * 3);
    if (i && target === cargo[i - 1].target && i % 3 !== 0) target = (target + 1) % 3;
    const lane = i % 2;
    const travel = lane === 0 ? 5 : 6.5;
    cargo.push({ id: i, target, lane, stage, arrival, spawn: arrival - travel, travel, routed: null, correct: null });
  }
  return cargo;
}
export function createGame(random = Math.random, practice = false) {
  return { cargo: makeSchedule(random, practice), practice, time: 0, route: 0, delivered: 0, correct: 0, score: 0, combo: 0, maxCombo: 0, stage: 1, holds: 1, heldUntil: 0, events: [], result: null };
}
export function selectRoute(game, route) {
  if (game.result || !Number.isInteger(route) || route < 0 || route > 2) return false;
  game.route = route; return true;
}
export function holdFeed(game) {
  if (game.result || game.practice || !game.holds || game.time < game.heldUntil) return false;
  game.holds--;
  game.heldUntil = game.time + 1.6;
  for (const item of game.cargo) if (item.routed === null) { item.arrival += 1.6; item.spawn += 1.6; }
  return true;
}
export function advance(game, seconds) {
  if (game.result || !Number.isFinite(seconds) || seconds < 0) return [];
  game.time += seconds;
  const events = [];
  for (const item of game.cargo) {
    if (item.routed !== null || item.arrival > game.time) continue;
    item.routed = game.route;
    item.correct = item.target === game.route;
    game.delivered++;
    if (item.correct) {
      game.correct++; game.combo++; game.maxCombo = Math.max(game.maxCombo, game.combo);
      game.score += 100 + Math.min(game.combo - 1, 5) * 20;
    } else game.combo = 0;
    events.push({ id: item.id, correct: item.correct, target: item.target, route: item.routed, time: item.arrival });
    if (!game.practice && game.delivered % 10 === 0 && game.delivered < TOTAL_CARGO) {
      game.stage++; game.holds = 1;
      events.push({ stage: game.stage });
    }
  }
  game.events = [...game.events, ...events].filter(event => game.time - (event.time ?? game.time) < 1.5).slice(-6);
  if (game.delivered === game.cargo.length) game.result = 'complete';
  return events;
}
export function upcoming(game, count = 4) {
  return game.cargo.filter(item => item.routed === null).slice(0, count);
}
export function accuracy(game) { return game.delivered ? Math.round(game.correct / game.delivered * 100) : 0; }
