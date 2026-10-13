import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
await rm(`${root}dist`, { recursive: true, force: true });
await mkdir(`${root}dist`, { recursive: true });
await cp(`${root}site`, `${root}dist`, { recursive: true, filter: source => !source.endsWith('.test.js') });
console.log('Static site built → dist/ (ready for /AI-Games/ or any subdirectory)');
