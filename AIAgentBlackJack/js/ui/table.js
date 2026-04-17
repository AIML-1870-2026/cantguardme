/* ═══════════════════════════════════════════════════════════
   UI/TABLE.JS — Card rendering, chip rendering, animations
═══════════════════════════════════════════════════════════ */

BJApp.TableUI = {

  DECK_POS: { x: 0, y: 0 }, // set on init from deck indicator position

  init() {
    this._updateDeckPos();
    window.addEventListener('resize', () => this._updateDeckPos());
  },

  _updateDeckPos() {
    const deck = document.getElementById('deck-indicator');
    if (deck) {
      const r = deck.getBoundingClientRect();
      this.DECK_POS = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
  },

  /* ─── Card SVG generation ─── */

  makeCardEl(card) {
    const el = document.createElement('div');
    el.className = `card ${card.red ? 'red' : 'black'}${card.faceDown ? ' face-down' : ''}`;
    el.dataset.id = card.id;

    const inner = document.createElement('div');
    inner.className = 'card-inner';

    // Front face
    const front = document.createElement('div');
    front.className = 'card-front';
    front.innerHTML = this._cardFrontHTML(card);

    // Back face
    const back = document.createElement('div');
    back.className = 'card-back';
    back.innerHTML = '<div class="card-back-pattern"></div>';

    inner.appendChild(front);
    inner.appendChild(back);
    el.appendChild(inner);
    return el;
  },

  _cardFrontHTML(card) {
    const suitSmall = card.suit;
    const rank = card.rank;
    const isFace = ['J', 'Q', 'K'].includes(rank);
    const isAce  = rank === 'A';

    let center = '';
    if (isFace) {
      const faceChar = { J: 'J', Q: 'Q', K: 'K' }[rank];
      center = `<div class="card-center">
        <div class="card-face-art">
          <div class="face-initial">${faceChar}</div>
          <div class="face-suit">${suitSmall}</div>
        </div>
      </div>`;
    } else if (isAce) {
      center = `<div class="card-center">
        <div class="card-suit-large">${suitSmall}</div>
      </div>`;
    } else {
      center = `<div class="card-center">
        <div class="card-suit-large" style="font-size:1.2rem;opacity:0.85">${suitSmall}</div>
      </div>`;
    }

    return `
      <div class="card-corner top-left">
        <span class="card-rank">${rank}</span>
        <span class="card-suit-small">${suitSmall}</span>
      </div>
      ${center}
      <div class="card-corner bottom-right">
        <span class="card-rank">${rank}</span>
        <span class="card-suit-small">${suitSmall}</span>
      </div>`;
  },

  /* ─── Deal animation ─── */

  async dealAnimation(playerCards, dealerCards, holeCard) {
    const playerRow = document.getElementById('player-cards');
    const dealerRow = document.getElementById('dealer-cards');
    if (!playerRow || !dealerRow) return;

    playerRow.innerHTML = '';
    dealerRow.innerHTML = '';

    this._updateDeckPos();

    const sequence = [
      { card: playerCards[0], container: playerRow, target: 'player', delay: 0   },
      { card: dealerCards[0], container: dealerRow, target: 'dealer', delay: 130 },
      { card: playerCards[1], container: playerRow, target: 'player', delay: 260 },
      { card: holeCard,       container: dealerRow, target: 'dealer', delay: 390, faceDown: true },
    ];

    for (const step of sequence) {
      await BJApp.delay(step.delay > 0 ? 130 : 0);
      if (step.faceDown) step.card.faceDown = true;
      const el = this.makeCardEl(step.card);
      step.container.appendChild(el);
      this._animateDeal(el, step.container);
      BJApp.Audio.play('deal');
    }

    await BJApp.delay(250);
  },

  _animateDeal(cardEl, container) {
    const containerRect = container.getBoundingClientRect();
    const deckPos = this.DECK_POS;

    const fromX = deckPos.x - (containerRect.left + containerRect.width / 2);
    const fromY = deckPos.y - (containerRect.top + 50);
    const fromRot = (Math.random() - 0.5) * 20;

    cardEl.style.setProperty('--from-x', `${fromX}px`);
    cardEl.style.setProperty('--from-y', `${fromY}px`);
    cardEl.style.setProperty('--from-rot', `${fromRot}deg`);
    cardEl.style.animation = 'none';

    requestAnimationFrame(() => {
      cardEl.style.animation = `card-deal 450ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`;
    });
  },

  async addCard(card, zone, handIdx = 0) {
    const rowId = zone === 'player' ? 'player-cards' : 'dealer-cards';
    let container = document.getElementById(rowId);

    // For split hands, target the specific hand container
    if (zone === 'player' && BJApp.playerHands && BJApp.playerHands.length > 1) {
      container = document.querySelector(`.split-hand[data-hand="${handIdx}"] .cards-row`) || container;
    }

    if (!container) return;
    const el = this.makeCardEl(card);
    container.appendChild(el);
    this._animateDeal(el, container);
    BJApp.Audio.play('deal');
    await BJApp.delay(250);
  },

  async revealHoleCard(card) {
    if (!card) return;
    const el = document.querySelector(`[data-id="${card.id}"]`);
    if (!el) return;

    card.faceDown = false;
    BJApp.Audio.play('holecard');

    el.classList.remove('face-down');
    el.style.transition = `transform ${550}ms cubic-bezier(0.65, 0, 0.35, 1)`;

    // 3D flip
    const inner = el.querySelector('.card-inner');
    if (inner) {
      inner.style.transition = `transform 550ms cubic-bezier(0.65, 0, 0.35, 1)`;
      inner.style.transform = 'rotateY(0deg)';
    }

    await BJApp.delay(300);
  },

  /* ─── Split hand rendering ─── */

  async renderSplitHands(hands, activeIdx) {
    const playerZone = document.getElementById('player-cards');
    if (!playerZone) return;

    playerZone.innerHTML = '';
    playerZone.parentElement.style.flexDirection = 'row';

    const container = document.createElement('div');
    container.className = 'split-hands-container';

    hands.forEach((hand, i) => {
      const handDiv = document.createElement('div');
      handDiv.className = `split-hand ${i === activeIdx ? 'active' : 'inactive'}`;
      handDiv.dataset.hand = i;

      const label = document.createElement('div');
      label.className = 'split-hand-label';
      label.textContent = `Hand ${i + 1}`;

      const row = document.createElement('div');
      row.className = 'cards-row';
      row.id = i === 0 ? 'player-cards' : `player-cards-${i}`;

      hand.cards.forEach(card => {
        const el = this.makeCardEl(card);
        row.appendChild(el);
      });

      handDiv.appendChild(label);
      handDiv.appendChild(row);
      container.appendChild(handDiv);
    });

    playerZone.parentElement.insertBefore(container, playerZone);
    playerZone.hidden = true;

    await BJApp.delay(100);
  },

  setActiveHand(idx) {
    document.querySelectorAll('.split-hand').forEach((el, i) => {
      el.classList.toggle('active', i === idx);
      el.classList.toggle('inactive', i !== idx);
    });
  },

  clearTable() {
    const playerCards = document.getElementById('player-cards');
    const dealerCards = document.getElementById('dealer-cards');
    if (playerCards) {
      playerCards.innerHTML = '';
      playerCards.hidden = false;
    }
    if (dealerCards) dealerCards.innerHTML = '';

    // Clear split containers
    const splits = document.querySelector('.split-hands-container');
    if (splits) splits.remove();

    const pz = document.getElementById('player-zone');
    if (pz) pz.style.flexDirection = '';

    document.getElementById('player-score') && (document.getElementById('player-score').textContent = '');
    document.getElementById('dealer-score') && (document.getElementById('dealer-score').textContent = '');
  },

  /* ─── Action buttons ─── */

  showActionButtons(legalActions) {
    const row = document.getElementById('action-row');
    if (!row) return;
    row.hidden = false;

    const buttons = {
      hit:       'btn-hit',
      stand:     'btn-stand',
      double:    'btn-double',
      split:     'btn-split',
      surrender: 'btn-surrender'
    };

    Object.entries(buttons).forEach(([action, id]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.hidden = !legalActions.includes(action);
      btn.disabled = !legalActions.includes(action);
    });
  },

  hideActionButtons() {
    const row = document.getElementById('action-row');
    if (row) row.hidden = true;
    ['btn-hit','btn-stand','btn-double','btn-split','btn-surrender'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.hidden = true;
    });
  },

  /* ─── Chip rendering ─── */

  renderChipTray() {
    const tray = document.getElementById('chip-tray');
    if (!tray) return;
    tray.innerHTML = '';

    const level = BJApp.LEVELS[BJApp.currentLevel];
    const minBet = level.minBet;

    const allDenoms = [1, 5, 10, 25, 100, 500, 1000, 5000];
    const labels = { 1:'$1', 5:'$5', 10:'$10', 25:'$25', 100:'$100', 500:'$500', 1000:'$1K', 5000:'$5K' };
    const denomsForLevel = {
      1: [5, 10, 25, 100],
      2: [10, 25, 100, 500],
      3: [100, 500, 1000],
      4: [500, 1000, 5000]
    };

    const denoms = denomsForLevel[BJApp.currentLevel] || [5, 25, 100];

    denoms.forEach(denom => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.dataset.denom = denom;
      chip.dataset.label = labels[denom];
      chip.setAttribute('aria-label', `${labels[denom]} chip`);
      chip.title = `Add $${denom} to bet`;
      chip.addEventListener('click', () => {
        BJApp.Audio.play('chip');
        const inp = document.getElementById('bet-input');
        if (!inp) return;
        let val = (parseInt(inp.value, 10) || 0) + denom;
        const maxBet = Math.min(BJApp.LEVELS[BJApp.currentLevel].maxBet, BJApp.balance);
        val = Math.min(val, maxBet);
        inp.value = val;
        BJApp.bet = val;
        BJApp.updateDealButton();
        BJApp.updateBetDisplay(val);
      });
      tray.appendChild(chip);
    });
  },

  renderBetChips(container, amount) {
    if (!container) return;
    container.innerHTML = '';
    if (amount <= 0) return;

    const colors = {
      5000: '#a0a0a0',
      1000: '#c9a961',
      500:  '#9a2ec0',
      100:  '#222222',
      25:   '#1a7a3c',
      10:   '#1a52cc',
      5:    '#cc2222',
      1:    '#ddd'
    };

    const denoms = [5000, 1000, 500, 100, 25, 10, 5, 1];
    let remaining = amount;
    const chips = [];

    for (const d of denoms) {
      while (remaining >= d && chips.length < 10) {
        chips.push(d);
        remaining -= d;
      }
    }

    chips.slice(0, 8).forEach((d, i) => {
      const chip = document.createElement('div');
      chip.className = 'bet-chip';
      chip.style.background = colors[d] || '#555';
      chip.style.marginBottom = i === 0 ? '0' : '-7px';
      chip.style.zIndex = chips.length - i;
      container.appendChild(chip);
    });
  }
};
