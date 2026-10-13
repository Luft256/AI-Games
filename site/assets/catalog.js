export const games = [
  { id:'snake', title:'ネオンスネーク', english:'NEON SNAKE', genre:'action', label:'アクション', description:'伸びる、曲がる、また伸びる。ひと口からはじまるスコアアタック。', color:'#b5f36e', time:'1–3 分', number:'01' },
  { id:'merge-2048', title:'マージ2048', english:'MERGE 2048', genre:'puzzle', label:'パズル', description:'同じ数字を重ねて、2048へ。次の一手がクセになる。', color:'#b8a0f7', time:'3–10 分', number:'02' },
  { id:'memory', title:'メモリーマッチ', english:'MEMORY MATCH', genre:'memory', label:'記憶', description:'めくって、覚えて、見つけよう。16枚に隠れた8つのペア。', color:'#8dd1d3', time:'1–3 分', number:'03' },
  { id:'breakout', title:'ブロックブレイカー', english:'BLOCK BREAKER', genre:'action', label:'アクション', description:'跳ねるボールを追いかけて。気持ちよく、全部こわそう。', color:'#ff9d6c', time:'2–5 分', number:'04' },
  { id:'minesweeper', title:'マインフィールド', english:'MINE FIELD', genre:'puzzle', label:'パズル', description:'数字をヒントに、安全な道を。小さな盤面、大きな推理。', color:'#f5cf67', time:'2–5 分', number:'05' },
  { id:'reaction', title:'リアクションラボ', english:'REACTION LAB', genre:'reflex', label:'反射神経', description:'合図は一瞬。5回のチャレンジで、あなたの反応速度を測ろう。', color:'#f4a3ba', time:'1 分', number:'06' }
];
export function filterGames(items, { query = '', genre = 'all', favoritesOnly = false, favorites = [] } = {}) {
  const needle = query.trim().normalize('NFKC').toLocaleLowerCase('ja');
  return items.filter(game => (genre === 'all' || game.genre === genre)
    && (!favoritesOnly || favorites.includes(game.id))
    && `${game.title} ${game.english} ${game.label} ${game.description}`.normalize('NFKC').toLocaleLowerCase('ja').includes(needle));
}
