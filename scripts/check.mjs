import {validateGameMetadata} from './game-metadata.mjs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname, sep, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { games } from '../site/assets/catalog.js';
const root = resolve('site');
const errors = [];
async function walk(path) {
  for (const entry of await readdir(path, {withFileTypes:true})) {
    const file = resolve(path, entry.name);
    if (entry.isDirectory()) { await walk(file); continue; }
    if (!['.html','.css','.js'].includes(extname(file))) continue;
    const source = await readFile(file,'utf8');
    if (file.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check',file], {encoding:'utf8'});
      if (result.status !== 0) errors.push(result.stderr);
    }
    const references = file.endsWith('.html') ? [...source.matchAll(/(?:href|src)="([^"]+)"/g)].map(match=>match[1]) : file.endsWith('.js') ? [...source.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map(match=>match[1]) : [];
    for (const reference of references) {
      if (reference.includes('${') || /^(#|https?:|data:|mailto:|node:)/.test(reference)) continue;
      if (reference.startsWith('/')) { errors.push(`${file}: root-absolute URL breaks project Pages: ${reference}`); continue; }
      const target = resolve(dirname(file), reference.split(/[?#]/)[0]);
      if (target !== root && !target.startsWith(root+sep)) { errors.push(`${file}: reference escapes site: ${reference}`); continue; }
      try { const info = await stat(target); if (info.isDirectory()) await stat(resolve(target,'index.html')); }
      catch { errors.push(`${file}: missing ${reference}`); }
    }
  }
}
await walk(root);
for (const game of games) { try { await stat(resolve(root,'games',game.id,'index.html')); } catch { errors.push(`Missing game route: ${game.id}`); } }
const effectiveGames = new Map(games.map(game=>[game.id,game]));
for (const folder of await readdir(resolve(root,'games'),{withFileTypes:true})) {
  if (!folder.isDirectory()) continue;
  try {
    const game=JSON.parse(await readFile(resolve(root,'games',folder.name,'metadata.json'),'utf8'));
    validateGameMetadata(game,folder.name); effectiveGames.set(game.id,game);
  } catch (error) { if (error.code !== 'ENOENT') errors.push(`${folder.name}: ${error.message}`); }
}
const numbers = new Map();
for (const game of effectiveGames.values()) {
  const number=Number(game.number);
  if (numbers.has(number)) errors.push(`Duplicate game number ${number}: ${numbers.get(number)}, ${game.id}`);
  numbers.set(number,game.id);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`All JavaScript parses, all local references resolve, and ${games.length} game routes exist.`);
