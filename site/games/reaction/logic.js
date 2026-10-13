export const TOTAL_ROUNDS = 5;
export function randomDelay(random = Math.random) {
  return 1500 + Math.floor(random() * 2500);
}
export function averageTime(times) {
  if (!times.length) return null;
  return Math.round(times.reduce((total, time) => total + time, 0) / times.length);
}
export function reactionTime(cueAt, respondedAt) {
  if (cueAt === null || respondedAt < cueAt) return null;
  return Math.round(respondedAt - cueAt);
}
