import { games, filterGames } from './catalog.js';
const grid = document.getElementById('game-grid');
const search = document.getElementById('search');
document.querySelector('.count-badge').textContent = String(games.length).padStart(2, '0');
document.querySelector('.header-pill').innerHTML = `<span class="live-dot"></span>${games.length} GAMES & COUNTING`;
document.querySelector('[data-genre="all"] span').textContent = games.length;
let genre = 'all';
let favoritesOnly = false;
let favorites = [];
try {
  const stored = JSON.parse(localStorage.getItem('ai-games:favorites') || '[]');
  if (Array.isArray(stored)) favorites = stored.filter(id => games.some(game => game.id === id));
} catch { /* Storage can be unavailable without interrupting play. */ }
const artwork = {
  snake: '<path d="M77 143h70V73h84v45h54" fill="none" stroke="#283c23" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/><circle cx="286" cy="115" r="2.8" fill="#b5f36e"/><circle cx="286" cy="123" r="2.8" fill="#b5f36e"/><rect x="92" y="61" width="18" height="18" rx="5" fill="#fff7d3" transform="rotate(18 101 70)"/>',
  'merge-2048': '<g font-family="Arial,sans-serif" font-weight="800" text-anchor="middle"><rect x="82" y="50" width="67" height="67" rx="12" fill="#eee8ff" transform="rotate(-9 115 83)"/><text x="115" y="94" font-size="29" fill="#514476" transform="rotate(-9 115 83)">2</text><rect x="150" y="91" width="69" height="69" rx="12" fill="#514476" transform="rotate(4 184 125)"/><text x="184" y="137" font-size="29" fill="#ede7ff" transform="rotate(4 184 125)">8</text><rect x="229" y="49" width="68" height="68" rx="12" fill="#f2db84" transform="rotate(10 263 83)"/><text x="263" y="94" font-size="26" fill="#514476" transform="rotate(10 263 83)">128</text></g>',
  memory: '<rect x="93" y="46" width="72" height="110" rx="11" fill="#f0f7ee" transform="rotate(-12 129 101)"/><rect x="190" y="46" width="72" height="110" rx="11" fill="#254b4e" transform="rotate(12 226 101)"/><path d="M127 77l15 22-15 22-15-22z" fill="#254b4e" transform="rotate(-12 129 101)"/><path d="M226 78l15 22-15 22-15-22z" fill="#8dd1d3" transform="rotate(12 226 101)"/>',
  breakout: '<g fill="#713d24"><rect x="75" y="51" width="44" height="18" rx="5"/><rect x="124" y="51" width="44" height="18" rx="5"/><rect x="173" y="51" width="44" height="18" rx="5"/><rect x="222" y="51" width="44" height="18" rx="5"/><rect x="271" y="51" width="24" height="18" rx="5"/><rect x="75" y="74" width="44" height="18" rx="5"/><rect x="124" y="74" width="44" height="18" rx="5"/><rect x="222" y="74" width="44" height="18" rx="5"/><rect x="271" y="74" width="24" height="18" rx="5"/></g><path d="m190 83-21 35 40 30" stroke="#fff2df" stroke-width="2" stroke-dasharray="4 5" fill="none"/><circle cx="209" cy="148" r="9" fill="#fff2df"/><rect x="162" y="171" width="91" height="10" rx="5" fill="#713d24"/>',
  minesweeper: '<g transform="translate(102 40)" font-family="Arial,sans-serif" font-weight="800" text-anchor="middle"><rect width="156" height="130" rx="12" fill="#675626"/><g fill="#fff3c2"><rect x="8" y="8" width="40" height="34" rx="5"/><rect x="58" y="8" width="40" height="34" rx="5"/><rect x="108" y="8" width="40" height="34" rx="5"/><rect x="8" y="48" width="40" height="34" rx="5"/><rect x="58" y="48" width="40" height="34" rx="5"/><rect x="8" y="88" width="40" height="34" rx="5"/></g><text x="28" y="32" font-size="24" fill="#4b7059">1</text><text x="78" y="72" font-size="24" fill="#ab714a">2</text><path d="M123 58v55m0-55 21 10-21 10" stroke="#f5cf67" stroke-width="3" fill="#f5cf67"/><path d="M117 114h13" stroke="#f5cf67" stroke-width="3"/></g>',
  reaction: '<circle cx="185" cy="103" r="64" stroke="#743449" stroke-width="1.5" fill="none"/><circle cx="185" cy="103" r="47" stroke="#743449" stroke-opacity=".35" fill="none"/><path d="m194 47-43 64h30l-8 45 46-65h-31z" fill="#743449"/><path d="M100 61l-13-7m182 111 13 7m-178-15-11 9m177-94 11-9" stroke="#fff2f3" stroke-width="5" stroke-linecap="round"/>'
};
function art(game) {
  return `<svg class="card-art" viewBox="0 0 360 200" aria-hidden="true"><defs><pattern id="grid-${game.id}" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#232921" stroke-opacity=".07" stroke-width=".7"/></pattern></defs><rect width="360" height="200" fill="url(#grid-${game.id})"/>${artwork[game.id] || ''}</svg>`;
}
function render() {
  const visible = filterGames(games, { query: search.value, genre, favoritesOnly, favorites });
  grid.innerHTML = visible.map(game => {
    const saved = favorites.includes(game.id);
    return `<article class="game-card" style="--card-color:${game.color}"><a class="card-art-link" href="./games/${game.id}/" aria-label="${game.title}をあそぶ"><span class="card-number">${game.number} / PLAY</span>${art(game)}</a><button class="favorite-button" data-favorite="${game.id}" aria-label="${game.title}をお気に入り${saved ? 'から外す' : 'に追加'}" aria-pressed="${saved}">${saved ? '★' : '☆'}</button><div class="card-body"><div class="card-meta"><span>${game.english}</span><span class="genre-tag">${game.label}</span></div><h3><a href="./games/${game.id}/">${game.title}</a></h3><p>${game.description}</p><div class="card-bottom"><span class="play-time">◷ ${game.time}</span><a class="play-link" href="./games/${game.id}/">あそぶ <span aria-hidden="true">↗</span></a></div></div></article>`;
  }).join('');
  document.getElementById('empty-state').hidden = visible.length > 0;
  document.getElementById('result-status').textContent = search.value || genre !== 'all' || favoritesOnly ? `${visible.length} 件のゲーム` : '';
}
grid.addEventListener('click', event => {
  const button = event.target.closest('[data-favorite]');
  if (!button) return;
  const id = button.dataset.favorite;
  favorites = favorites.includes(id) ? favorites.filter(value => value !== id) : [...favorites, id];
  try { localStorage.setItem('ai-games:favorites', JSON.stringify(favorites)); } catch { /* In-memory favorites still work. */ }
  render();
  grid.querySelector(`[data-favorite="${id}"]`)?.focus({ preventScroll:true });
});
search.addEventListener('input', render);
document.querySelector('.filters').addEventListener('click', event => {
  const button = event.target.closest('[data-genre]');
  if (!button) return;
  genre = button.dataset.genre;
  document.querySelectorAll('[data-genre]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  render();
});
document.getElementById('favorites-filter').addEventListener('click', event => {
  favoritesOnly = !favoritesOnly;
  event.currentTarget.setAttribute('aria-pressed', String(favoritesOnly)); render();
});
document.getElementById('clear-filters').addEventListener('click', () => {
  genre = 'all'; search.value = ''; favoritesOnly = false;
  document.querySelectorAll('[data-genre]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.genre === 'all')));
  document.getElementById('favorites-filter').setAttribute('aria-pressed', 'false'); render(); search.focus();
});
document.getElementById('random-game').addEventListener('click', () => {
  location.href = `./games/${games[Math.floor(Math.random() * games.length)].id}/`;
});
document.addEventListener('keydown', event => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) { event.preventDefault(); search.focus(); }
});
render();
