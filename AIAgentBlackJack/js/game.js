/* ═══════════════════════════════════════════════════════════
   GAME.JS — Game state machine, rules, payouts, round flow
═══════════════════════════════════════════════════════════ */

/* ─── App State ─── */
BJApp.balance       = 1000;
BJApp.bet           = 10;
BJApp.phase         = 'idle';      // idle | betting | dealing | playing | dealer_turn | round_complete
BJApp.deck          = [];
BJApp.playerHands   = null;        // array of { cards, bet, stood, doubled, busted, surrendered, splitFromAce }
BJApp.activeHandIdx = 0;
BJApp.dealerHand    = null;
BJApp.lastRec       = null;
BJApp.stats = {
  wins: 0, losses: 0, pushes: 0, surrenders: 0,
  blackjacks: 0, busts: 0,
  totalWagered: 0, netProfit: 0,
  stratAgree: 0, totalDecisions: 0,
  confSum: 0, confCount: 0,
  tokenCost: 0,
  bankrollHistory: [1000]
};
BJApp.provider    = 'openai';
BJApp.model       = 'gpt-4o-mini';
BJApp.riskProfile = 'balanced';
BJApp.playMode    = 'advisor';

/* ─── Current Level ─── */
BJApp.currentLevel = 1;

BJApp.LEVELS = {
  1: { name: 'The Lounge',         roman: 'I',   minBet: 5,   maxBet: 200,   advanceAt: 3000,   fallAt: 0 },
  2: { name: 'The Downtown Floor', roman: 'II',  minBet: 25,  maxBet: 500,   advanceAt: 10000,  fallAt: 2000 },
  3: { name: 'The High Limit Room',roman: 'III', minBet: 100, maxBet: 2000,  advanceAt: 30000,  fallAt: 7000 },
  4: { name: 'The Penthouse',      roman: 'IV',  minBet: 500, maxBet: 10000, advanceAt: Infinity,fallAt: 20000 },
};

BJApp.getLevelForBalance = function(balance) {
  if (balance >= BJApp.LEVELS[4].fallAt) return 4;
  if (balance >= BJApp.LEVELS[3].fallAt) return 3;
  if (balance >= BJApp.LEVELS[2].fallAt) return 2;
  return 1;
};

/* ─── Hand helpers ─── */
BJApp.activeHand = function() {
  return BJApp.playerHands ? BJApp.playerHands[BJApp.activeHandIdx] : null;
};

BJApp.getLegalActions = function(hand) {
  if (!hand) return [];
  const actions = [];
  const score = BJApp.scoreHand(hand.cards);
  const isFirstAction = !hand.stood && !hand.doubled && hand.cards.filter(c => !c.faceDown).length === 2;

  if (score < 21 && !hand.stood) actions.push('hit');
  if (!hand.stood) actions.push('stand');

  if (isFirstAction && BJApp.balance >= hand.bet) {
    actions.push('double');
  }

  if (isFirstAction &&
      hand.cards.length === 2 &&
      !hand.splitFromAce &&
      BJApp.balance >= hand.bet) {
    const r1 = hand.cards[0].rank;
    const r2 = hand.cards[1].rank;
    const v1 = Math.min(hand.cards[0].value, 10);
    const v2 = Math.min(hand.cards[1].value, 10);
    if (v1 === v2 || (v1 === 10 && v2 === 10)) {
      actions.push('split');
    }
  }

  if (isFirstAction) {
    actions.push('surrender');
  }

  return actions;
};

/* ─── Start new hand ─── */
BJApp.startHand = function() {
  const level = BJApp.LEVELS[BJApp.currentLevel];
  const minBet = level.minBet;
  const maxBet = Math.min(level.maxBet, BJApp.balance);

  let bet = BJApp.bet;
  if (bet < minBet) {
    bet = minBet;
    BJApp.bet = bet;
    const inp = document.getElementById('bet-input');
    if (inp) inp.value = bet;
  }
  if (bet > maxBet) {
    bet = maxBet;
    BJApp.bet = bet;
    const inp = document.getElementById('bet-input');
    if (inp) inp.value = bet;
  }

  if (BJApp.balance < minBet) {
    BJApp.triggerGameOver();
    return;
  }

  BJApp.balance -= bet;
  BJApp.stats.totalWagered += bet;
  BJApp.handNumber = (BJApp.handNumber || 0) + 1;

  // Build fresh hands
  BJApp.playerHands = [{
    cards: [], bet: bet,
    stood: false, doubled: false, busted: false,
    surrendered: false, splitFromAce: false
  }];
  BJApp.activeHandIdx = 0;
  BJApp.dealerHand = [];
  BJApp.lastRec = null;
  BJApp.phase = 'dealing';

  // Reset deck if low
  if (!BJApp.deck || BJApp.deck.length < 15) {
    BJApp.deck = BJApp.newShuffledDeck();
  }

  BJApp.TableUI.clearTable();
  BJApp.updateBalanceDisplay();
  BJApp.updateBetDisplay(bet);
  BJApp.hideBettingZone();
  BJApp.hideOutcome();
  BJApp.BubbleUI.hide();

  BJApp.doDeal();
};

/* ─── Deal cards ─── */
BJApp.doDeal = async function() {
  const hand = BJApp.playerHands[0];
  const dealer = BJApp.dealerHand;

  // Deal sequence: player, dealer, player, dealer-hole
  const c1 = BJApp.dealCard();
  const c2 = BJApp.dealCard();
  const c3 = BJApp.dealCard();
  const c4 = BJApp.dealCard();
  c4.faceDown = true;

  hand.cards.push(c1, c3);
  dealer.push(c2, c4);

  await BJApp.TableUI.dealAnimation(hand.cards, dealer, c4);

  // Check for blackjack
  const playerBJ = BJApp.isNaturalBlackjack(hand.cards);
  const dealerBJ = (() => {
    const dealerFull = [...dealer];
    dealerFull.forEach(c => c.faceDown = false);
    return BJApp.isNaturalBlackjack(dealerFull);
  })();

  if (playerBJ || dealerBJ) {
    // Reveal dealer hole card
    BJApp.dealerHand.forEach(c => c.faceDown = false);
    await BJApp.TableUI.revealHoleCard(dealer[1]);
    BJApp.updateScores();

    if (playerBJ && dealerBJ) {
      BJApp.endRound([{ result: 'push', payout: hand.bet }]);
    } else if (playerBJ) {
      BJApp.Audio.play('blackjack');
      const payout = hand.bet + Math.floor(hand.bet * 1.5);
      BJApp.endRound([{ result: 'blackjack', payout }]);
    } else {
      BJApp.Audio.play('loss');
      BJApp.endRound([{ result: 'loss', payout: 0 }]);
    }
    return;
  }

  BJApp.phase = 'playing';
  BJApp.updateScores();
  BJApp.TableUI.showActionButtons(BJApp.getLegalActions(BJApp.activeHand()));
  BJApp.OrbUI.setState('idle');

  if (BJApp.playMode === 'autoplay' || true) {
    // Always call agent for recommendation
    await BJApp.requestAIRecommendation();
  }
};

/* ─── Player actions ─── */
BJApp.hit = async function() {
  const hand = BJApp.activeHand();
  if (!hand || hand.stood || hand.busted) return;

  const card = BJApp.dealCard();
  hand.cards.push(card);
  await BJApp.TableUI.addCard(card, 'player', BJApp.activeHandIdx);
  BJApp.updateScores();
  BJApp.Audio.play('deal');

  if (BJApp.isBust(hand.cards)) {
    hand.busted = true;
    BJApp.Audio.play('bust');
    BJApp.OrbUI.setState('bust');
    await BJApp.delay(500);
    await BJApp.advanceHand();
    return;
  }

  if (BJApp.scoreHand(hand.cards) === 21) {
    hand.stood = true;
    await BJApp.advanceHand();
    return;
  }

  BJApp.TableUI.showActionButtons(BJApp.getLegalActions(hand));
  if (BJApp.playMode === 'autoplay') {
    await BJApp.requestAIRecommendation();
  } else {
    BJApp.hideExecuteRow();
    BJApp.BubbleUI.hide();
    await BJApp.requestAIRecommendation();
  }
};

BJApp.stand = async function() {
  const hand = BJApp.activeHand();
  if (!hand) return;
  hand.stood = true;
  BJApp.Audio.play('stand');
  BJApp.hideExecuteRow();
  BJApp.BubbleUI.hide();
  await BJApp.delay(200);
  await BJApp.advanceHand();
};

BJApp.double = async function() {
  const hand = BJApp.activeHand();
  if (!hand) return;
  if (BJApp.balance < hand.bet) { BJApp.showToast('Insufficient balance to double', 'warn'); return; }

  BJApp.balance -= hand.bet;
  BJApp.stats.totalWagered += hand.bet;
  hand.bet *= 2;
  hand.doubled = true;

  BJApp.updateBalanceDisplay();
  BJApp.updateBetDisplay(hand.bet);
  BJApp.Audio.play('chip');

  const card = BJApp.dealCard();
  hand.cards.push(card);
  await BJApp.TableUI.addCard(card, 'player', BJApp.activeHandIdx);
  BJApp.updateScores();
  BJApp.Audio.play('deal');

  if (BJApp.isBust(hand.cards)) {
    hand.busted = true;
    BJApp.Audio.play('bust');
    BJApp.OrbUI.setState('bust');
    await BJApp.delay(500);
  }

  hand.stood = true;
  BJApp.hideExecuteRow();
  BJApp.BubbleUI.hide();
  await BJApp.advanceHand();
};

BJApp.split = async function() {
  const hand = BJApp.activeHand();
  if (!hand || hand.cards.length !== 2) return;
  if (BJApp.balance < hand.bet) { BJApp.showToast('Insufficient balance to split', 'warn'); return; }

  BJApp.balance -= hand.bet;
  BJApp.stats.totalWagered += hand.bet;
  BJApp.updateBalanceDisplay();
  BJApp.Audio.play('chip');

  const isAceSplit = hand.cards[0].rank === 'A';
  const card2 = hand.cards.pop();

  const newHand = {
    cards: [card2],
    bet: hand.bet,
    stood: false, doubled: false, busted: false,
    surrendered: false, splitFromAce: isAceSplit
  };
  hand.splitFromAce = isAceSplit;

  // Deal one card to each hand
  const newCard1 = BJApp.dealCard();
  const newCard2 = BJApp.dealCard();
  hand.cards.push(newCard1);
  newHand.cards.push(newCard2);

  BJApp.playerHands.push(newHand);

  if (isAceSplit) {
    hand.stood = true;
    newHand.stood = true;
  }

  await BJApp.TableUI.renderSplitHands(BJApp.playerHands, BJApp.activeHandIdx);
  BJApp.updateScores();
  BJApp.hideExecuteRow();
  BJApp.BubbleUI.hide();

  if (isAceSplit) {
    await BJApp.doDealerTurn();
    return;
  }

  BJApp.TableUI.showActionButtons(BJApp.getLegalActions(hand));
  await BJApp.requestAIRecommendation();
};

BJApp.surrender = async function() {
  const hand = BJApp.activeHand();
  if (!hand) return;
  hand.surrendered = true;
  BJApp.Audio.play('surrender');
  BJApp.OrbUI.setState('idle');
  BJApp.hideExecuteRow();
  BJApp.BubbleUI.hide();
  await BJApp.advanceHand();
};

/* ─── Advance to next hand (for splits) ─── */
BJApp.advanceHand = async function() {
  BJApp.hideExecuteRow();
  BJApp.BubbleUI.hide();

  // Check if more split hands need playing
  const nextIdx = BJApp.playerHands.findIndex(
    (h, i) => i > BJApp.activeHandIdx && !h.stood && !h.busted && !h.surrendered
  );

  if (nextIdx >= 0 && BJApp.playerHands.length > 1) {
    BJApp.activeHandIdx = nextIdx;
    BJApp.TableUI.setActiveHand(nextIdx);
    BJApp.TableUI.showActionButtons(BJApp.getLegalActions(BJApp.activeHand()));
    await BJApp.requestAIRecommendation();
    return;
  }

  await BJApp.doDealerTurn();
};

/* ─── Dealer turn ─── */
BJApp.doDealerTurn = async function() {
  BJApp.phase = 'dealer_turn';
  BJApp.TableUI.hideActionButtons();
  BJApp.hideExecuteRow();
  BJApp.BubbleUI.hide();
  BJApp.OrbUI.setState('idle');

  // Reveal hole card
  BJApp.dealerHand.forEach(c => c.faceDown = false);
  await BJApp.TableUI.revealHoleCard(BJApp.dealerHand[1]);
  await BJApp.delay(400);
  BJApp.updateScores();

  // Dealer hits until 17+
  while (BJApp.scoreHand(BJApp.dealerHand) < 17) {
    await BJApp.delay(600);
    const card = BJApp.dealCard();
    BJApp.dealerHand.push(card);
    await BJApp.TableUI.addCard(card, 'dealer');
    BJApp.updateScores();
    BJApp.Audio.play('deal');
  }

  await BJApp.delay(400);
  await BJApp.resolveRound();
};

/* ─── Resolve all hands ─── */
BJApp.resolveRound = async function() {
  const dealerScore = BJApp.scoreHand(BJApp.dealerHand);
  const dealerBust  = dealerScore > 21;
  const results = [];

  for (const hand of BJApp.playerHands) {
    const pScore = BJApp.scoreHand(hand.cards);

    if (hand.surrendered) {
      const payout = Math.floor(hand.bet * 0.5);
      results.push({ result: 'surrender', payout });
    } else if (hand.busted) {
      results.push({ result: 'loss', payout: 0 });
    } else if (dealerBust) {
      const payout = hand.bet * 2;
      results.push({ result: 'win', payout });
    } else if (pScore > dealerScore) {
      const payout = hand.bet * 2;
      results.push({ result: 'win', payout });
    } else if (pScore === dealerScore) {
      results.push({ result: 'push', payout: hand.bet });
    } else {
      results.push({ result: 'loss', payout: 0 });
    }
  }

  BJApp.endRound(results);
};

/* ─── End round, show results ─── */
BJApp.endRound = function(results) {
  BJApp.phase = 'round_complete';

  let totalPayout = 0;
  let primaryOutcome = results[0].result;

  results.forEach((r, i) => {
    totalPayout += r.payout;
    if (r.result !== 'loss' && primaryOutcome === 'loss') primaryOutcome = r.result;
    if (r.result === 'blackjack') primaryOutcome = 'blackjack';
  });

  BJApp.balance += totalPayout;

  const spent = BJApp.playerHands.reduce((s, h) => s + h.bet, 0);
  const netDelta = totalPayout - spent;
  BJApp.stats.netProfit += netDelta;

  // Track stats
  if (primaryOutcome === 'blackjack') { BJApp.stats.wins++; BJApp.stats.blackjacks++; }
  else if (primaryOutcome === 'win')  { BJApp.stats.wins++; }
  else if (primaryOutcome === 'push') { BJApp.stats.pushes++; }
  else if (primaryOutcome === 'surrender') { BJApp.stats.surrenders++; BJApp.stats.losses++; }
  else { BJApp.stats.losses++; }

  BJApp.stats.bankrollHistory.push(BJApp.balance);

  BJApp.updateBalanceDisplay();
  BJApp.showOutcome(primaryOutcome, netDelta);
  BJApp.updateBetDisplay(0);

  // Orb reaction
  if (primaryOutcome === 'blackjack') { BJApp.OrbUI.setState('blackjack'); BJApp.Audio.play('blackjack'); }
  else if (primaryOutcome === 'win')  { BJApp.OrbUI.setState('win');       BJApp.Audio.play('win'); }
  else if (primaryOutcome === 'push') { BJApp.OrbUI.setState('idle');      BJApp.Audio.play('push'); }
  else if (primaryOutcome === 'surrender') { BJApp.OrbUI.setState('idle'); }
  else { BJApp.OrbUI.setState('loss'); BJApp.Audio.play('loss'); }

  // Record to history
  BJApp.recordHand({
    handNumber: BJApp.handNumber,
    playerHands: BJApp.playerHands,
    dealerCards: BJApp.dealerHand,
    bet: BJApp.playerHands[0].bet,
    outcome: primaryOutcome.charAt(0).toUpperCase() + primaryOutcome.slice(1),
    balanceDelta: netDelta,
    aiAction: BJApp.lastRec?.action || null,
    strategyAction: BJApp.lastStrategyAction || null,
    confidence: BJApp.lastRec?.confidence || null,
    model: BJApp.model,
    latency: BJApp.lastRec?.latency || null,
    timestamp: Date.now()
  });

  // Update dashboard
  BJApp.DashboardUI.update();

  // Check level change
  const newLevel = BJApp.getLevelForBalance(BJApp.balance);
  if (newLevel !== BJApp.currentLevel) {
    setTimeout(() => BJApp.LevelsUI.transition(BJApp.currentLevel, newLevel), 600);
  }

  // Show new hand button
  setTimeout(() => {
    BJApp.TableUI.hideActionButtons();
    BJApp.hideExecuteRow();
    BJApp.showNewHandButton();

    if (BJApp.balance <= 0) {
      setTimeout(BJApp.triggerGameOver, 1500);
    }
  }, 1200);
};

/* ─── Game Over ─── */
BJApp.triggerGameOver = function() {
  const el = document.getElementById('gameover-overlay');
  const stat = document.getElementById('gameover-stat');
  if (!el) return;

  if (stat) {
    stat.innerHTML = `
      Hands played: ${BJApp.handNumber}<br>
      Peak balance: $${Math.max(...BJApp.stats.bankrollHistory).toLocaleString()}<br>
      Total wagered: $${BJApp.stats.totalWagered.toLocaleString()}`;
  }
  el.hidden = false;
};

BJApp.restartGame = function() {
  BJApp.balance = 1000;
  BJApp.bet = 10;
  BJApp.phase = 'idle';
  BJApp.deck = BJApp.newShuffledDeck();
  BJApp.playerHands = null;
  BJApp.dealerHand = null;
  BJApp.lastRec = null;
  BJApp.handNumber = 0;
  BJApp.handHistory = [];
  BJApp.stats = {
    wins: 0, losses: 0, pushes: 0, surrenders: 0,
    blackjacks: 0, busts: 0,
    totalWagered: 0, netProfit: 0,
    stratAgree: 0, totalDecisions: 0,
    confSum: 0, confCount: 0,
    tokenCost: 0,
    bankrollHistory: [1000]
  };

  const el = document.getElementById('gameover-overlay');
  if (el) el.hidden = true;

  BJApp.LevelsUI.setLevel(1);
  BJApp.TableUI.clearTable();
  BJApp.updateBalanceDisplay();
  BJApp.showBettingZone();
  BJApp.hideOutcome();
  BJApp.OrbUI.setState('idle');
  BJApp.BubbleUI.hide();
  BJApp.phase = 'betting';
};

/* ─── UI helpers ─── */
BJApp.updateBalanceDisplay = function() {
  const el = document.getElementById('balance-amount');
  if (el) {
    el.textContent = `$${BJApp.balance.toLocaleString()}`;
  }
};

BJApp.updateBetDisplay = function(bet) {
  const el = document.getElementById('bet-amount-display');
  if (el) el.textContent = `$${bet}`;
  const circle = document.getElementById('bet-circle');
  if (circle) circle.classList.toggle('has-bet', bet > 0);
  const stack = document.getElementById('bet-chips-stack');
  if (stack) BJApp.TableUI.renderBetChips(stack, bet);
};

BJApp.showBettingZone = function() {
  const bz = document.getElementById('betting-zone');
  const ar = document.getElementById('action-row');
  const er = document.getElementById('execute-row');
  const nh = document.getElementById('new-hand-row');
  if (bz) bz.style.display = '';
  if (ar) ar.hidden = true;
  if (er) er.hidden = true;
  if (nh) nh.hidden = true;
  BJApp.TableUI.renderChipTray();
  BJApp.updateDealButton();
  BJApp.phase = 'betting';
};

BJApp.hideBettingZone = function() {
  const bz = document.getElementById('betting-zone');
  if (bz) bz.style.display = 'none';
};

BJApp.updateDealButton = function() {
  const btn = document.getElementById('btn-deal');
  if (!btn) return;
  const hasKey = !!BJApp.keys[BJApp.provider];
  const hasBet = BJApp.bet > 0;
  const hasBalance = BJApp.balance >= BJApp.bet;
  btn.disabled = !hasKey || !hasBet || !hasBalance;
};

BJApp.showNewHandButton = function() {
  const nh = document.getElementById('new-hand-row');
  if (nh) nh.hidden = false;
};

BJApp.hideNewHandButton = function() {
  const nh = document.getElementById('new-hand-row');
  if (nh) nh.hidden = true;
};

BJApp.showOutcome = function(result, delta) {
  const overlay = document.getElementById('outcome-overlay');
  const textEl  = document.getElementById('outcome-text');
  const subEl   = document.getElementById('outcome-sub');
  if (!overlay || !textEl) return;

  const labels = {
    blackjack: 'Blackjack!',
    win:       'You Win',
    push:      'Push',
    loss:      'Dealer Wins',
    bust:      'Bust',
    surrender: 'Surrender'
  };

  const classes = {
    blackjack: 'blackjack-text',
    win:       '',
    push:      'push-text',
    loss:      'loss-text',
    bust:      'bust-text',
    surrender: 'push-text'
  };

  textEl.textContent = labels[result] || result;
  textEl.className = `outcome-text ${classes[result] || ''}`;

  const sign = delta > 0 ? '+' : '';
  if (subEl) subEl.textContent = delta !== 0 ? `${sign}$${Math.abs(delta).toLocaleString()}` : '';

  if (result === 'blackjack') {
    // Add shimmer effect
    const sweep = document.createElement('div');
    sweep.className = 'blackjack-sweep';
    overlay.appendChild(sweep);
    setTimeout(() => sweep.remove(), 800);
  }

  overlay.hidden = false;
};

BJApp.hideOutcome = function() {
  const overlay = document.getElementById('outcome-overlay');
  if (overlay) overlay.hidden = true;
};

BJApp.hideExecuteRow = function() {
  const er = document.getElementById('execute-row');
  if (er) er.hidden = true;
};

BJApp.showExecuteRow = function() {
  const er = document.getElementById('execute-row');
  if (er) er.hidden = false;
};

BJApp.updateScores = function() {
  const playerScoreEl = document.getElementById('player-score');
  const dealerScoreEl = document.getElementById('dealer-score');

  if (playerScoreEl && BJApp.playerHands) {
    const hand = BJApp.playerHands[BJApp.activeHandIdx];
    if (hand) {
      const lbl = BJApp.handLabel(hand.cards);
      playerScoreEl.textContent = lbl;
      playerScoreEl.className = `hand-score player-score-display${lbl === 'Bust' ? ' busted' : lbl === 'Blackjack' ? ' blackjack' : ''}`;
    }
  }

  if (dealerScoreEl && BJApp.dealerHand) {
    const visible = BJApp.dealerHand.filter(c => !c.faceDown);
    if (visible.length > 0) {
      const score = BJApp.scoreHand(visible);
      dealerScoreEl.textContent = BJApp.dealerHand.some(c => c.faceDown) ? `${score} + ?` : BJApp.handLabel(BJApp.dealerHand);
    } else {
      dealerScoreEl.textContent = '';
    }
  }
};

/* ─── Utility ─── */
BJApp.delay = ms => new Promise(r => setTimeout(r, ms));

BJApp.showToast = function(msg, type = 'info') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', 'alert');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toast-exit 0.25s ease forwards';
    setTimeout(() => el.remove(), 250);
  }, 3000);
};

BJApp.requestAIRecommendation = async function() {
  const hand = BJApp.activeHand();
  if (!hand || !BJApp.dealerHand?.[0]) return;

  const dealerUp = BJApp.dealerHand.find(c => !c.faceDown);
  if (!dealerUp) return;

  const actions = BJApp.getLegalActions(hand);
  if (actions.length === 0) return;

  // Get basic strategy recommendation
  const stratCode = BJApp.getBasicStrategy(hand.cards, dealerUp);
  const stratAction = BJApp.strategyActionName(stratCode).toLowerCase();
  BJApp.lastStrategyAction = stratCode;

  BJApp.OrbUI.setState('thinking');
  BJApp.Audio.play('thinking');

  let rec;
  try {
    rec = await BJApp.Agent.recommend(hand, BJApp.dealerHand, actions, BJApp.handNumber);
  } catch (err) {
    BJApp.OrbUI.setState('idle');
    BJApp.BubbleUI.show(`The dealer considers… (${err.message || 'API error'})`, null, null);
    return;
  }

  BJApp.lastRec = rec;

  // Track stats
  BJApp.stats.totalDecisions++;
  if (rec.confidence) {
    BJApp.stats.confSum += rec.confidence;
    BJApp.stats.confCount++;
  }
  const aiActionCode = { hit:'H', stand:'S', double:'D', split:'P', surrender:'R' }[rec.action] || rec.action;
  if (stratCode && aiActionCode.toUpperCase() === stratCode) {
    BJApp.stats.stratAgree++;
  }

  BJApp.Audio.play('recommendation');
  BJApp.OrbUI.setState('speaking');

  const stratMatch = stratCode
    ? (aiActionCode.toUpperCase() === stratCode
        ? '✓ basic strategy'
        : `⚠ strategy says ${BJApp.strategyActionName(stratCode)}`)
    : null;

  BJApp.BubbleUI.show(
    rec.short_reasoning || `I recommend: ${rec.action}`,
    { model: BJApp.model, confidence: rec.confidence, latency: rec.latency },
    stratMatch,
    rec.long_reasoning
  );

  if (BJApp.playMode === 'advisor') {
    BJApp.showExecuteRow();
  } else {
    // Autoplay: wait 1.2s then execute
    await BJApp.delay(1200);
    await BJApp.executeRecommendation();
  }
};

BJApp.executeRecommendation = async function() {
  const rec = BJApp.lastRec;
  if (!rec) return;

  BJApp.hideExecuteRow();

  const actionMap = {
    hit: BJApp.hit,
    stand: BJApp.stand,
    double: BJApp.double,
    split: BJApp.split,
    surrender: BJApp.surrender
  };

  const fn = actionMap[rec.action];
  if (fn) {
    await fn();
  } else {
    BJApp.showToast(`Unknown action: ${rec.action}`, 'error');
    await BJApp.stand();
  }
};
