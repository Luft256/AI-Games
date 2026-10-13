export function loadBest(key, fallback = 0) {
  try {
    const value = localStorage.getItem(`ai-games:best:${key}`);
    if (value === null) return fallback;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
  } catch { return fallback; }
}
export function saveBest(key, value) {
  if (!Number.isFinite(value) || value < 0) return;
  try { localStorage.setItem(`ai-games:best:${key}`, String(value)); } catch { /* Play still works when storage is disabled. */ }
}
export function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
export function mountShell({ title, english, description, accent = '#b5f36e', controls = [] }) {
  document.documentElement.style.setProperty('--accent', accent);
  const root = document.getElementById('game-shell');
  root.innerHTML = `<a class="skip-link" href="#play">ゲームへスキップ</a><header class="site-header"><a class="brand" href="../../" aria-label="AI Games ホーム"><span class="brand-symbol" aria-hidden="true">✳</span><span>AI Games<span class="brand-small">A LITTLE PLAY, EVERY DAY.</span></span></a><nav class="header-nav" aria-label="メイン"><a href="../../#games">ゲーム一覧 ↗</a><span class="header-pill"><span class="live-dot"></span>無料であそべる</span></nav></header><section class="game-heading"><a class="back-link" href="../../#games">← ゲーム一覧に戻る</a><div class="eyebrow"></div><h1></h1><p></p></section>`;
  root.querySelector('.eyebrow').textContent = english;
  root.querySelector('h1').textContent = title;
  root.querySelector('.game-heading p').textContent = description;
  const main = document.querySelector('main');
  if (main) main.id = 'play';
  const help = document.createElement('section');
  help.className = 'game-help';
  help.setAttribute('aria-label', 'あそび方');
  const heading = document.createElement('h2'); heading.textContent = 'HOW TO PLAY / あそび方';
  const list = document.createElement('ul');
  for (const instruction of controls) { const item = document.createElement('li'); item.textContent = instruction; list.append(item); }
  help.append(heading, list); document.body.append(help);
  const footer = document.createElement('footer'); footer.className = 'site-footer';
  footer.innerHTML = '<span><strong>AI Games</strong> — 小さなひらめき、大きなあそび。</span><span>記録はこのブラウザに保存されます · Made with AI, played by you.</span>';
  document.body.append(footer);
}
