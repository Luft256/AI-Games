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
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`All JavaScript parses, all local references resolve, and ${games.length} game routes exist.`);
