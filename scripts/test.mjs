import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
async function find(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => entry.isDirectory() ? find(`${path}/${entry.name}`) : entry.name.endsWith('.test.js') ? [`${path}/${entry.name}`] : []));
  return groups.flat();
}
const files = [...await find('tests'), ...await find('site/games')];
const result = spawnSync(process.execPath, ['--test', ...files], { stdio:'inherit' });
process.exit(result.status ?? 1);
