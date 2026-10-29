import test from 'node:test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { games, filterGames } from '../site/assets/catalog.js';
import { loadBest, saveBest } from '../site/shared/game-shell.js';
test('catalog exposes unique routes and filter combinations as it grows', () => {
  assert.ok(games.length >= 12); assert.equal(new Set(games.map(game=>game.id)).size,games.length);
  assert.equal(new Set(games.map(game=>game.number)).size,games.length);
  for (const id of ['stack-tower','sky-hop','orbit-dodge','lights-out','slide-puzzle','simon']) assert.ok(games.some(game=>game.id===id));
  assert.deepEqual(filterGames(games,{genre:'action'}), games.filter(game=>game.genre==='action'));
  assert.equal(filterGames(games,{query:'ｍｅｒｇｅ ２０４８'}).length,1);
  assert.equal(filterGames(games,{query:'reaction lab'}).length,1);
  assert.equal(filterGames(games,{genre:'puzzle',favoritesOnly:true,favorites:['snake','minesweeper']})[0].id,'minesweeper');
  assert.deepEqual(filterGames(games,{query:'does not exist'}),[]);
});
test('score storage tolerates blocked storage and invalid values', () => {
  const storage = new Map();
  globalThis.localStorage = {getItem:key=>storage.has(key)?storage.get(key):null,setItem:(key,value)=>storage.set(key,value)};
  assert.equal(loadBest('snake',0),0); saveBest('snake',12); assert.equal(loadBest('snake'),12);
  storage.set('ai-games:best:snake','NaN'); assert.equal(loadBest('snake',5),5);
  storage.set('ai-games:best:snake','-8'); assert.equal(loadBest('snake',5),5);
  globalThis.localStorage = {getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
  assert.equal(loadBest('snake',5),5); assert.doesNotThrow(()=>saveBest('snake',12));
  delete globalThis.localStorage;
});

test('registered metadata, thumbnails, home counts and fallback routes stay synchronized', async () => {
  const home = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  assert.match(home, new RegExp(`${games.length} GAMES & COUNTING`));
  assert.match(home, new RegExp(`<span class="count-badge">${games.length}</span>`));
  const fallback = home.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1];
  assert.ok(fallback, 'direct navigation is available without JavaScript');
  const genres = new Set([...home.matchAll(/data-genre=\"([^\"]+)\"/g)].map(match=>match[1]));
  for (const game of games) assert.ok(genres.has(game.genre), `${game.id} has a visible genre filter`);
  let previous = 0;
  for (const game of games) {
    assert.ok(Number(game.number) > previous, 'catalog remains in numeric order');
    previous = Number(game.number);
    assert.ok(fallback.includes(`href="./games/${game.id}/"`), `${game.id} fallback link`);
    if (Number(game.number) <= 6) continue;
    const metadata = JSON.parse(await readFile(new URL(`../site/games/${game.id}/metadata.json`, import.meta.url), 'utf8'));
    assert.deepEqual(game, metadata, `${game.id} published description matches its metadata`);
    const thumbnail = await readFile(new URL(`../site/games/${game.id}/thumbnail.svg`, import.meta.url), 'utf8');
    assert.match(thumbnail, /viewBox=["']0 0 [1-9]\d* [1-9]\d*["']/);
  }
});
