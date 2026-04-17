/* ═══════════════════════════════════════════════════════════
   STRATEGY.JS — Basic Strategy Lookup (S17 — Dealer Stands Soft 17)
   H=Hit, S=Stand, D=Double, P=Split, R=Surrender
═══════════════════════════════════════════════════════════ */

/* Dealer up-card columns: 2,3,4,5,6,7,8,9,10,A */
const DC = [2,3,4,5,6,7,8,9,10,11]; // 11 = Ace dealer value

/* ─── Hard totals ─── */
const HARD = {
  4:  ['H','H','H','H','H','H','H','H','H','H'],
  5:  ['H','H','H','H','H','H','H','H','H','H'],
  6:  ['H','H','H','H','H','H','H','H','H','H'],
  7:  ['H','H','H','H','H','H','H','H','H','H'],
  8:  ['H','H','H','H','H','H','H','H','H','H'],
  9:  ['H','D','D','D','D','H','H','H','H','H'],
  10: ['D','D','D','D','D','D','D','D','H','H'],
  11: ['D','D','D','D','D','D','D','D','D','H'],
  12: ['H','H','S','S','S','H','H','H','H','H'],
  13: ['S','S','S','S','S','H','H','H','H','H'],
  14: ['S','S','S','S','S','H','H','H','H','H'],
  15: ['S','S','S','S','S','H','H','H','R','H'],
  16: ['S','S','S','S','S','H','H','R','R','R'],
  17: ['S','S','S','S','S','S','S','S','S','S'],
  18: ['S','S','S','S','S','S','S','S','S','S'],
  19: ['S','S','S','S','S','S','S','S','S','S'],
  20: ['S','S','S','S','S','S','S','S','S','S'],
  21: ['S','S','S','S','S','S','S','S','S','S'],
};

/* ─── Soft totals (Ace + X) ─── */
/* Key = total (A counted as 11) — range 13-21 */
const SOFT = {
  13: ['H','H','H','D','D','H','H','H','H','H'],  // A+2
  14: ['H','H','H','D','D','H','H','H','H','H'],  // A+3
  15: ['H','H','D','D','D','H','H','H','H','H'],  // A+4
  16: ['H','H','D','D','D','H','H','H','H','H'],  // A+5
  17: ['H','D','D','D','D','H','H','H','H','H'],  // A+6
  18: ['S','D','D','D','D','S','S','H','H','H'],  // A+7
  19: ['S','S','S','S','S','S','S','S','S','S'],  // A+8
  20: ['S','S','S','S','S','S','S','S','S','S'],  // A+9
  21: ['S','S','S','S','S','S','S','S','S','S'],
};

/* ─── Pairs ─── */
/* Key = card rank value (1=A,2-10=face,10=10/J/Q/K) */
const PAIRS = {
  1:  ['P','P','P','P','P','P','P','P','P','P'],  // A-A
  2:  ['P','P','P','P','P','P','H','H','H','H'],  // 2-2
  3:  ['P','P','P','P','P','P','H','H','H','H'],  // 3-3
  4:  ['H','H','H','P','P','H','H','H','H','H'],  // 4-4
  5:  ['D','D','D','D','D','D','D','D','H','H'],  // 5-5 (treat as 10)
  6:  ['P','P','P','P','P','H','H','H','H','H'],  // 6-6
  7:  ['P','P','P','P','P','P','H','H','H','H'],  // 7-7
  8:  ['P','P','P','P','P','P','P','P','P','P'],  // 8-8
  9:  ['P','P','P','P','P','S','P','P','S','S'],  // 9-9
  10: ['S','S','S','S','S','S','S','S','S','S'],  // 10-10
};

function dealerColIdx(dealerVal) {
  // dealerVal is the face value of dealer's up card (1-11 where A=11)
  const v = dealerVal === 1 ? 11 : dealerVal;
  const idx = DC.indexOf(v);
  return idx >= 0 ? idx : DC.indexOf(10); // fallback to 10
}

BJApp.getBasicStrategy = function(playerCards, dealerUpCard) {
  const dVal = dealerUpCard.rank === 'A' ? 11 : Math.min(dealerUpCard.value, 10);
  const col = dealerColIdx(dVal);
  const total = BJApp.scoreHand(playerCards);
  const soft  = BJApp.isSoftHand(playerCards);

  // Check for pair
  if (playerCards.length === 2) {
    const r1 = playerCards[0].rank;
    const r2 = playerCards[1].rank;
    const v1 = playerCards[0].value;
    const v2 = playerCards[1].value;

    // Normalize pair key
    if (v1 === v2 || (Math.min(v1,v2) >= 10 && Math.min(v2,v1) >= 10)) {
      let pairKey;
      if (r1 === 'A' && r2 === 'A') {
        pairKey = 1;
      } else {
        pairKey = Math.min(v1, v2) >= 10 ? 10 : v1;
      }
      if (PAIRS[pairKey] !== undefined) {
        const action = PAIRS[pairKey][col];
        return action;
      }
    }
  }

  // Soft hand
  if (soft && SOFT[total] !== undefined) {
    return SOFT[total][col];
  }

  // Hard hand
  const clampedTotal = Math.max(4, Math.min(21, total));
  if (HARD[clampedTotal] !== undefined) {
    return HARD[clampedTotal][col];
  }

  return total >= 17 ? 'S' : 'H';
};

BJApp.strategyActionName = function(code) {
  return { H:'Hit', S:'Stand', D:'Double', P:'Split', R:'Surrender' }[code] || code;
};
