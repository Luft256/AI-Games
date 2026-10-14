import {readdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {games as currentGames} from '../site/assets/catalog.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const catalogPath=root+'site/assets/catalog.js',homePath=root+'site/index.html';
const entries=new Map(currentGames.map(game=>[game.id,game]));
const genres=new Set(['action','puzzle','memory','reflex']);
for(const entry of await readdir(root+'site/games',{withFileTypes:true})){
 if(!entry.isDirectory())continue;
 let source;
 try{source=await readFile(root+`site/games/${entry.name}/metadata.json`,'utf8');}catch(error){if(error.code==='ENOENT')continue;throw error;}
 const game=JSON.parse(source);
 if(game.id!==entry.name||!/^[-a-z0-9]+$/.test(game.id))throw Error(`Invalid game id: ${entry.name}`);
 for(const field of ['title','english','label','description','color','time','number'])if(typeof game[field]!=='string'||!game[field].trim())throw Error(`${entry.name}: missing ${field}`);
 if(!genres.has(game.genre)||!/^#[0-9a-f]{6}$/i.test(game.color)||!/^\d{2,}$/.test(game.number)||Number(game.number)<1)throw Error(`${entry.name}: invalid genre, color or number`);
 entries.set(game.id,game);
}
const games=[...entries.values()].sort((a,b)=>Number(a.number)-Number(b.number));
if(new Set(games.map(game=>Number(game.number))).size!==games.length)throw Error('Game numbers must be unique');
for(const game of games)await readFile(root+`site/games/${game.id}/index.html`,'utf8');
const catalog=await readFile(catalogPath,'utf8'),filter=catalog.slice(catalog.indexOf('export function filterGames'));
if(!filter.startsWith('export function filterGames'))throw Error('Catalog filter is missing');
const htmlEscape=text=>text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let home=await readFile(homePath,'utf8');
home=home.replace(/\d+の無料ブラウザゲーム/,`${games.length}の無料ブラウザゲーム`)
 .replace(/\d+ GAMES & COUNTING/,`${games.length} GAMES & COUNTING`)
 .replace(/(<span class="count-badge">)\d+(<\/span>)/,(_,before,after)=>before+games.length+after)
 .replace(/(data-genre="all"[^>]*>すべて <span>)\d+(<\/span>)/,(_,before,after)=>before+games.length+after)
 .replace(/<noscript>[\s\S]*?<\/noscript>/,`<noscript><p>ゲーム一覧の検索にはJavaScriptが必要です。${games.map(game=>`<a href="./games/${game.id}/">${htmlEscape(game.title)}</a>`).join(' · ')}</p></noscript>`);
await writeFile(catalogPath,`// Updated by npm run catalog from per-game metadata.\nexport const games = ${JSON.stringify(games,null,2)};\n${filter}`);
await writeFile(homePath,home);
console.log(`Registered ${games.length} games, home counts and direct fallback links.`);
