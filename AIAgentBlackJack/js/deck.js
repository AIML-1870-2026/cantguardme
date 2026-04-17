/* ═══════════════════════════════════════════════════════════
   DECK.JS — Card generation, deck management, shuffle
═══════════════════════════════════════════════════════════ */

BJApp.RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
BJApp.SUITS  = ['♠','♥','♦','♣'];
BJApp.RED_SUITS = new Set(['♥','♦']);

BJApp.cardValue = function(rank) {
  if (rank === 'A') return 11;
  if (['J','Q','K'].includes(rank)) return 10;
  return parseInt(rank, 10);
};

BJApp.makeCard = function(rank, suit) {
  return {
    rank,
    suit,
    value: BJApp.cardValue(rank),
    id: `${rank}${suit}-${Math.random().toString(36).slice(2,6)}`,
    red: BJApp.RED_SUITS.has(suit),
    faceDown: false
  };
};

BJApp.buildDeck = function() {
  const deck = [];
  for (const suit of BJApp.SUITS) {
    for (const rank of BJApp.RANKS) {
      deck.push(BJApp.makeCard(rank, suit));
    }
  }
  return deck;
};

BJApp.shuffle = function(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
};

BJApp.newShuffledDeck = function() {
  return BJApp.shuffle(BJApp.buildDeck());
};

BJApp.dealCard = function() {
  if (!BJApp.deck || BJApp.deck.length === 0) {
    BJApp.deck = BJApp.newShuffledDeck();
    BJApp.showToast('Deck reshuffled', 'info');
  }
  return BJApp.deck.pop();
};

/* ─── Hand scoring ─── */
BJApp.scoreHand = function(cards) {
  const active = cards.filter(c => !c.faceDown);
  let total = 0;
  let aces = 0;
  for (const c of active) {
    total += c.value;
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
};

BJApp.isSoftHand = function(cards) {
  const active = cards.filter(c => !c.faceDown);
  let total = 0, aces = 0;
  for (const c of active) {
    total += c.value;
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  const hasUsableAce = aces > 0 && active.some(c => c.rank === 'A');
  return hasUsableAce && total <= 21 && active.filter(c => c.rank === 'A').length > 0 && (() => {
    let t2 = 0, a2 = 0;
    for (const c of active) { t2 += (c.rank === 'A' ? 1 : c.value); if (c.rank === 'A') a2++; }
    return total > t2;
  })();
};

BJApp.isNaturalBlackjack = function(cards) {
  if (cards.length !== 2) return false;
  const ranks = cards.map(c => c.rank);
  return (
    (ranks.includes('A') && cards.some(c => ['10','J','Q','K'].includes(c.rank))) &&
    BJApp.scoreHand(cards) === 21
  );
};

BJApp.isBust = function(cards) {
  return BJApp.scoreHand(cards) > 21;
};

BJApp.handLabel = function(cards) {
  const score = BJApp.scoreHand(cards);
  if (BJApp.isNaturalBlackjack(cards)) return 'Blackjack';
  if (score > 21) return 'Bust';
  if (BJApp.isSoftHand(cards)) return `Soft ${score}`;
  return String(score);
};
