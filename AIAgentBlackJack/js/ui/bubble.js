/* ═══════════════════════════════════════════════════════════
   UI/BUBBLE.JS — Typewriter speech bubble, meta row, Why panel
═══════════════════════════════════════════════════════════ */

BJApp.BubbleUI = {
  _typeTimer: null,
  _longReasoning: null,

  show(text, meta, strategyMsg, longReasoning) {
    const bubble  = document.getElementById('bubble');
    const textEl  = document.getElementById('bubble-text');
    const cursor  = document.getElementById('bubble-cursor');
    const metaEl  = document.getElementById('bubble-meta');
    const whyBtn  = document.getElementById('bubble-why');
    const stratEl = document.getElementById('bubble-strategy-row');
    const stratBadge = document.getElementById('strategy-badge');

    if (!bubble || !textEl) return;

    clearTimeout(this._typeTimer);
    textEl.textContent = '';
    cursor.className = 'bubble-cursor';

    this._longReasoning = longReasoning || null;

    // Show bubble
    bubble.hidden = false;

    // Typewriter effect
    let i = 0;
    const chars = Array.from(text || '');
    const type = () => {
      if (i < chars.length) {
        textEl.textContent += chars[i];
        i++;
        // Word pulse on orb every ~5 chars
        if (i % 5 === 0 && BJApp.OrbUI) {
          BJApp.OrbUI.wordPulse();
        }
        this._typeTimer = setTimeout(type, 22);
      } else {
        cursor.className = 'bubble-cursor done';
      }
    };
    type();

    // Meta row
    if (metaEl && meta) {
      const parts = [];
      if (meta.model) parts.push(meta.model.split('-').slice(-1)[0]);
      if (meta.confidence != null) parts.push(`${(meta.confidence * 100).toFixed(0)}% conf`);
      if (meta.latency) parts.push(`${meta.latency}ms`);
      metaEl.textContent = parts.join(' · ');
    } else if (metaEl) {
      metaEl.textContent = '';
    }

    // Strategy row
    if (stratEl && stratBadge && strategyMsg) {
      const isAgree = strategyMsg.startsWith('✓');
      stratBadge.textContent = strategyMsg;
      stratBadge.className = `strategy-badge ${isAgree ? 'agree' : 'disagree'}`;
      stratEl.hidden = false;
    } else if (stratEl) {
      stratEl.hidden = true;
    }

    // Why button
    if (whyBtn) {
      whyBtn.hidden = !longReasoning;
    }
  },

  hide() {
    clearTimeout(this._typeTimer);
    const bubble  = document.getElementById('bubble');
    const why     = document.getElementById('why-panel');
    if (bubble) bubble.hidden = true;
    if (why)    why.hidden = true;
    this._longReasoning = null;
  },

  showWhy() {
    const why  = document.getElementById('why-panel');
    const text = document.getElementById('why-text');
    if (!why || !text) return;
    text.textContent = this._longReasoning || 'No detailed reasoning available.';
    why.hidden = false;
  },

  hideWhy() {
    const why = document.getElementById('why-panel');
    if (why) why.hidden = true;
  },

  init() {
    const whyBtn   = document.getElementById('bubble-why');
    const whyClose = document.getElementById('why-close');
    if (whyBtn)   whyBtn.addEventListener('click', () => this.showWhy());
    if (whyClose) whyClose.addEventListener('click', () => this.hideWhy());
  }
};
