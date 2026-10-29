export const GAME_GENRES = new Set(['action','puzzle','memory','reflex','strategy']);
export function validateGameMetadata(game, directory) {
  if (game.id !== directory || !/^[-a-z0-9]+$/.test(game.id)) throw Error(`Invalid game id: ${directory}`);
  for (const field of ['title','english','label','description','color','time','number']) {
    if (typeof game[field] !== 'string' || !game[field].trim()) throw Error(`${directory}: missing ${field}`);
  }
  if (!GAME_GENRES.has(game.genre) || !/^#[0-9a-f]{6}$/i.test(game.color) || !/^\d{2,}$/.test(game.number) || Number(game.number) < 1) {
    throw Error(`${directory}: invalid genre, color or number`);
  }
}
