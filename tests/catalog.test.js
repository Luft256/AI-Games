import test from 'node:test';
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
