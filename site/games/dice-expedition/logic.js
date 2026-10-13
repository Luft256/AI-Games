export const EXPEDITIONS = 8;
export const MAX_DEPTH = 4;
export const ZONES = [
  { name: '苔むす回廊', icon: '⌁', danger: -1, rule: 'high', bonus: 4, detail: '財宝の合計9以上で +4' },
  { name: '水晶の洞窟', icon: '◇', danger: 0, rule: 'double', bonus: 8, detail: '財宝がゾロ目なら +8' },
  { name: '砂時計の遺跡', icon: '◷', danger: 0, rule: 'high', bonus: 6, detail: '財宝の合計9以上で +6' },
  { name: '黄金の神殿', icon: '✧', danger: 1, rule: 'double', bonus: 12, detail: '財宝がゾロ目なら +12' },
];
export function rollDie(random = Math.random) { return 1 + Math.min(5, Math.max(0, Math.floor(random() * 6))); }
export function createRun(random = Math.random) {
  const sites = Array.from({ length: EXPEDITIONS }, (_, index) => index % ZONES.length);
  for (let i = sites.length - 1; i > 0; i--) { const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1)))); [sites[i], sites[j]] = [sites[j], sites[i]]; }
  return { phase: 'idle', expedition: 1, depth: 0, score: 0, haul: 0, supplies: 5, sites, dice: [], guards: [], route: 'careful', history: [], last: null };
}
export function zoneFor(state) { return ZONES[state.sites[state.expedition - 1]]; }
export function dangerFor(state) { return Math.max(0, Math.ceil(state.expedition / 2) + state.depth + zoneFor(state).danger + (state.route === 'bold' ? 2 : 0)); }
export function successCount(guard, danger) {
  let count = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b + danger <= guard) count++;
  return count;
}
export function evaluate(state) {
  if (state.guards.length !== 2 || new Set(state.guards).size !== 2 || state.guards.some(i => i < 0 || i > 3)) return null;
  const guard = state.guards.reduce((sum, i) => sum + state.dice[i], 0);
  const loot = state.dice.filter((_, i) => !state.guards.includes(i));
  const sum = loot.reduce((a, b) => a + b, 0), zone = zoneFor(state);
  const bonus = (zone.rule === 'double' ? loot[0] === loot[1] : sum >= 9) ? zone.bonus : 0;
  const danger = dangerFor(state), reward = (sum + state.depth * 6) * (state.route === 'bold' ? 2 : 1) + bonus;
  const count = successCount(guard, danger);
  return { guard, loot, sum, bonus, danger, reward, count, probability: count / 36, expected: count / 36 * reward - (1 - count / 36) * state.haul };
}
function prepare(state, random) {
  const dice = Array.from({ length: 4 }, () => rollDie(random));
  const guards = [0, 1, 2, 3].sort((a, b) => dice[b] - dice[a]).slice(0, 2).sort();
  return { ...state, phase: 'allocate', dice, guards, route: 'careful', last: null };
}
export function startExpedition(state, random = Math.random) {
  if (!['idle', 'between'].includes(state.phase)) return state;
  return prepare({ ...state, depth: 0, haul: 0 }, random);
}
export function toggleGuard(state, index) {
  if (state.phase !== 'allocate' || !Number.isInteger(index) || index < 0 || index > 3) return state;
  const guards = state.guards.includes(index) ? state.guards.filter(i => i !== index) : [...state.guards.slice(state.guards.length === 2 ? 1 : 0), index];
  return { ...state, guards };
}
export function setRoute(state, route) { return state.phase === 'allocate' && ['careful', 'bold'].includes(route) ? { ...state, route } : state; }
export function reroll(state, index, random = Math.random) {
  if (state.phase !== 'allocate' || state.supplies < 1 || !Number.isInteger(index) || index < 0 || index > 3) return state;
  return { ...state, supplies: state.supplies - 1, dice: state.dice.map((value, i) => i === index ? rollDie(random) : value) };
}
function closeExpedition(state, amount, reason) {
  const history = [...state.history, { expedition: state.expedition, amount, rooms: state.depth + (reason === 'bust' ? 0 : 1), reason }];
  const score = state.score + amount;
  return { ...state, score, haul: 0, history, phase: state.expedition === EXPEDITIONS ? 'finished' : 'between', expedition: Math.min(EXPEDITIONS, state.expedition + 1) };
}
export function resolveRoom(state, hazard) {
  if (state.phase !== 'allocate') return state;
  const plan = evaluate(state);
  if (!plan || hazard.length !== 2 || hazard.some(n => !Number.isInteger(n) || n < 1 || n > 6)) return state;
  const passed = hazard[0] + hazard[1] + plan.danger <= plan.guard;
  const last = { ...plan, hazard, passed, lost: passed ? 0 : state.haul, room: state.depth + 1 };
  if (!passed) return closeExpedition({ ...state, last }, 0, 'bust');
  return { ...state, phase: 'decision', haul: state.haul + plan.reward, last };
}
export function bankLoot(state) { return state.phase === 'decision' ? closeExpedition(state, state.haul, 'bank') : state; }
export function continueExpedition(state, random = Math.random) {
  if (state.phase !== 'decision' || state.depth + 1 >= MAX_DEPTH) return state;
  return prepare({ ...state, depth: state.depth + 1 }, random);
}
export function rankFor(score) { return score >= 90 ? '伝説の探検家' : score >= 50 ? '黄金の探検家' : score >= 20 ? '一人前の探検家' : '駆け出しの探検家'; }
