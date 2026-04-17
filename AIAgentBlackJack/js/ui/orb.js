/* ═══════════════════════════════════════════════════════════
   UI/ORB.JS — Dealer AI Orb state machine
═══════════════════════════════════════════════════════════ */

BJApp.OrbUI = {
  currentState: 'idle',
  _resetTimer: null,
  _ringTimer: null,

  init() {
    const orb = document.getElementById('orb');
    if (orb) {
      orb.addEventListener('click', () => {
        if (BJApp.BubbleUI) {
          const bubble = document.getElementById('bubble');
          if (bubble && !bubble.hidden) {
            BJApp.BubbleUI.hide();
          }
        }
      });
    }
  },

  setState(state) {
    const orb = document.getElementById('orb');
    if (!orb) return;

    // Remove all state classes
    orb.classList.remove('thinking', 'speaking', 'win', 'loss', 'bust', 'blackjack');

    clearTimeout(this._resetTimer);
    clearTimeout(this._ringTimer);
    this.currentState = state;

    if (state !== 'idle') {
      orb.classList.add(state);
    }

    // Auto-reset transient states
    if (['win', 'loss', 'bust', 'blackjack'].includes(state)) {
      this._emitRings(state);
      this._resetTimer = setTimeout(() => {
        orb.classList.remove(state);
        this.currentState = 'idle';
      }, state === 'blackjack' ? 2000 : 1200);
    }

    if (state === 'win' || state === 'blackjack') {
      const flash = document.getElementById('felt-table');
      if (flash) {
        flash.classList.add('pulse-win');
        setTimeout(() => flash.classList.remove('pulse-win'), 700);
      }
    }

    if (state === 'bust') {
      const table = document.getElementById('felt-table');
      if (table) {
        table.classList.add('pulse-lose', 'shake');
        setTimeout(() => { table.classList.remove('pulse-lose', 'shake'); }, 400);
      }
    }
  },

  _emitRings(type) {
    const wrap = document.getElementById('orb-wrap');
    if (!wrap) return;

    const count = type === 'blackjack' ? 3 : 1;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const ring = document.createElement('div');
        ring.className = 'orb-ring-pulse';
        if (type === 'bust' || type === 'loss') {
          ring.style.borderColor = '#8c1c1c';
        }
        wrap.appendChild(ring);
        setTimeout(() => ring.remove(), 900);
      }, i * 300);
    }
  },

  wordPulse() {
    const wrap = document.getElementById('orb-wrap');
    if (!wrap) return;
    const ring = document.createElement('div');
    ring.className = 'orb-ring-pulse';
    ring.style.width = '52px';
    ring.style.height = '52px';
    ring.style.opacity = '0.3';
    wrap.appendChild(ring);
    setTimeout(() => ring.remove(), 500);
  }
};
