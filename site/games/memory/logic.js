export function createDeck(random = Math.random) {
  const cards = Array.from({ length: 16 }, (_, id) => ({ id, symbol: Math.floor(id / 2) }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function evaluatePair(cards, first, second) {
  if (first === second || !cards[first] || !cards[second]) return false;
  return cards[first].symbol === cards[second].symbol;
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
