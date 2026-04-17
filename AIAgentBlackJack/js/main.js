/* ═══════════════════════════════════════════════════════════
   MAIN.JS — Bootstrap, event wiring, keyboard shortcuts
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─── Init all subsystems ─── */
  BJApp.initEnvPanel();
  BJApp.TableUI.init();
  BJApp.OrbUI.init();
  BJApp.BubbleUI.init();
  BJApp.DashboardUI.init();

  /* ─── Set initial UI state ─── */
  BJApp.deck = BJApp.newShuffledDeck();
  BJApp.LevelsUI.setLevel(1);
  BJApp.updateBalanceDisplay();
  BJApp.showBettingZone();
  BJApp.OrbUI.setState('idle');

  /* ─── Spawn background dust particles ─── */
  _spawnDustParticles();

  /* ─── Settings panel ─── */
  const settingsOverlay  = document.getElementById('settings-overlay');
  const btnSettings      = document.getElementById('btn-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const settingsBackdrop = document.getElementById('settings-backdrop');

  function openSettings() {
    settingsOverlay.removeAttribute('aria-hidden');
    BJApp.Audio.play('settings');
    document.getElementById('btn-close-settings')?.focus();
  }

  function closeSettings() {
    settingsOverlay.setAttribute('aria-hidden', 'true');
    BJApp.Audio.play('settings');
  }

  btnSettings?.addEventListener('click', openSettings);
  btnCloseSettings?.addEventListener('click', closeSettings);
  settingsBackdrop?.addEventListener('click', closeSettings);

  /* ─── History panel ─── */
  const historyOverlay  = document.getElementById('history-overlay');
  const btnHistory      = document.getElementById('btn-history');
  const btnCloseHistory = document.getElementById('btn-close-history');
  const historyBackdrop = document.getElementById('history-backdrop');

  function openHistory() {
    historyOverlay.hidden = false;
    BJApp.renderHistory();
  }

  function closeHistory() {
    historyOverlay.hidden = true;
  }

  btnHistory?.addEventListener('click', openHistory);
  btnCloseHistory?.addEventListener('click', closeHistory);
  historyBackdrop?.addEventListener('click', closeHistory);

  /* ─── About modal ─── */
  const aboutModal   = document.getElementById('about-modal');
  const aboutBackdrop= document.getElementById('about-backdrop');
  const btnAbout     = document.getElementById('btn-about');
  const btnCloseAbout= document.getElementById('btn-close-about');

  btnAbout?.addEventListener('click', () => {
    aboutModal.hidden  = false;
    aboutBackdrop.hidden = false;
  });
  btnCloseAbout?.addEventListener('click', () => {
    aboutModal.hidden  = true;
    aboutBackdrop.hidden = true;
  });
  aboutBackdrop?.addEventListener('click', () => {
    aboutModal.hidden  = true;
    aboutBackdrop.hidden = true;
  });

  /* ─── Shortcuts overlay ─── */
  const shortcutsOverlay  = document.getElementById('shortcuts-overlay');
  const shortcutsBackdrop = document.getElementById('shortcuts-backdrop');
  const btnCloseShortcuts = document.getElementById('btn-close-shortcuts');

  function openShortcuts() { shortcutsOverlay.hidden = false; }
  function closeShortcuts() { shortcutsOverlay.hidden = true; }

  btnCloseShortcuts?.addEventListener('click', closeShortcuts);
  shortcutsBackdrop?.addEventListener('click', closeShortcuts);

  /* ─── Provider / Model selection ─── */
  const providerSel = document.getElementById('provider-select');
  const modelSel    = document.getElementById('model-select');

  const MODEL_LISTS = {
    openai:    ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini', 'o1'],
    anthropic: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7'],
    gemini:    ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
  };

  function updateModelList(provider) {
    if (!modelSel) return;
    const models = MODEL_LISTS[provider] || MODEL_LISTS.openai;
    modelSel.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
    BJApp.model = modelSel.value;
  }

  providerSel?.addEventListener('change', () => {
    BJApp.provider = providerSel.value;
    updateModelList(BJApp.provider);
    BJApp.updateKeyStatus();
    BJApp.updateDealButton();
  });

  modelSel?.addEventListener('change', () => {
    BJApp.model = modelSel.value;
  });

  document.getElementById('btn-refresh-models')?.addEventListener('click', () => {
    BJApp.Agent.refreshModels();
  });

  /* ─── Risk profile ─── */
  const RISK_DESC = {
    conservative: 'Prioritize capital preservation. Prefer stand and surrender in marginal spots.',
    balanced:     'Follow basic strategy closely. Take positive-EV risks but avoid marginal plays.',
    aggressive:   'Maximize expected value aggressively. Double and split whenever EV is positive.'
  };

  document.querySelectorAll('.risk-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.risk-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      BJApp.riskProfile = btn.dataset.profile;
      const descEl = document.getElementById('risk-desc');
      if (descEl) descEl.textContent = RISK_DESC[BJApp.riskProfile] || '';
    });
  });

  /* ─── Play mode ─── */
  const MODE_DESC = {
    advisor:  'AI recommends an action. You confirm before it executes.',
    autoplay: 'AI executes each action automatically after a 1.2s pause.'
  };

  document.getElementById('mode-advisor')?.addEventListener('click', () => {
    BJApp.playMode = 'advisor';
    document.getElementById('mode-advisor')?.classList.add('active');
    document.getElementById('mode-autoplay')?.classList.remove('active');
    const d = document.getElementById('mode-desc');
    if (d) d.textContent = MODE_DESC.advisor;
  });

  document.getElementById('mode-autoplay')?.addEventListener('click', () => {
    BJApp.playMode = 'autoplay';
    document.getElementById('mode-autoplay')?.classList.add('active');
    document.getElementById('mode-advisor')?.classList.remove('active');
    const d = document.getElementById('mode-desc');
    if (d) d.textContent = MODE_DESC.autoplay;
  });

  /* ─── Volume ─── */
  const volSlider = document.getElementById('volume-slider');
  const volPct    = document.getElementById('volume-pct');

  volSlider?.addEventListener('input', () => {
    const v = parseInt(volSlider.value, 10) / 100;
    BJApp.Audio.volume = v;
    BJApp.Audio.setVolume(v);
    if (volPct) volPct.textContent = `${volSlider.value}%`;
  });

  /* ─── Captions ─── */
  document.getElementById('captions-toggle')?.addEventListener('change', e => {
    BJApp.Audio.captionsEnabled = e.target.checked;
    const el = document.getElementById('audio-captions');
    if (el) el.hidden = !e.target.checked;
  });

  /* ─── Mute button ─── */
  document.getElementById('btn-mute')?.addEventListener('click', () => {
    if (!BJApp.Audio.initialized) {
      BJApp.Audio.init();
    }
    BJApp.Audio.toggleMute();
  });

  /* ─── Bet input ─── */
  const betInput = document.getElementById('bet-input');

  betInput?.addEventListener('input', () => {
    const level = BJApp.LEVELS[BJApp.currentLevel];
    let val = parseInt(betInput.value, 10) || 0;
    BJApp.bet = val;
    BJApp.updateDealButton();
    BJApp.updateBetDisplay(val);
  });

  betInput?.addEventListener('blur', () => {
    const level = BJApp.LEVELS[BJApp.currentLevel];
    let val = parseInt(betInput.value, 10) || level.minBet;
    val = Math.max(level.minBet, Math.min(Math.min(level.maxBet, BJApp.balance), val));
    betInput.value = val;
    BJApp.bet = val;
    BJApp.updateDealButton();
    BJApp.updateBetDisplay(val);
  });

  document.getElementById('bet-dec')?.addEventListener('click', () => {
    const level = BJApp.LEVELS[BJApp.currentLevel];
    let val = Math.max(level.minBet, (parseInt(betInput?.value, 10) || level.minBet) - level.minBet);
    if (betInput) betInput.value = val;
    BJApp.bet = val;
    BJApp.updateDealButton();
    BJApp.updateBetDisplay(val);
  });

  document.getElementById('bet-inc')?.addEventListener('click', () => {
    const level = BJApp.LEVELS[BJApp.currentLevel];
    const max = Math.min(level.maxBet, BJApp.balance);
    let val = Math.min(max, (parseInt(betInput?.value, 10) || level.minBet) + level.minBet);
    if (betInput) betInput.value = val;
    BJApp.bet = val;
    BJApp.updateDealButton();
    BJApp.updateBetDisplay(val);
  });

  document.getElementById('btn-clear-bet')?.addEventListener('click', () => {
    if (betInput) betInput.value = BJApp.LEVELS[BJApp.currentLevel].minBet;
    BJApp.bet = BJApp.LEVELS[BJApp.currentLevel].minBet;
    BJApp.updateDealButton();
    BJApp.updateBetDisplay(0);
  });

  /* ─── Deal button ─── */
  document.getElementById('btn-deal')?.addEventListener('click', () => {
    if (!BJApp.Audio.initialized) BJApp.Audio.init();
    if (!BJApp.keys[BJApp.provider]) {
      BJApp.showToast('Please upload a .env file with your API key first', 'warn');
      openSettings();
      return;
    }
    const level = BJApp.LEVELS[BJApp.currentLevel];
    BJApp.bet = Math.max(level.minBet, parseInt(betInput?.value, 10) || level.minBet);
    BJApp.startHand();
  });

  /* ─── New hand button ─── */
  document.getElementById('btn-new-hand')?.addEventListener('click', () => {
    if (!BJApp.Audio.initialized) BJApp.Audio.init();
    BJApp.hideNewHandButton();
    BJApp.hideOutcome();
    BJApp.showBettingZone();
    BJApp.OrbUI.setState('idle');
    BJApp.LevelsUI.updateProgressBar();
  });

  /* ─── Action buttons ─── */
  document.getElementById('btn-hit')?.addEventListener('click', () => _ensureAudio() && BJApp.hit());
  document.getElementById('btn-stand')?.addEventListener('click', () => _ensureAudio() && BJApp.stand());
  document.getElementById('btn-double')?.addEventListener('click', () => _ensureAudio() && BJApp.double());
  document.getElementById('btn-split')?.addEventListener('click', () => _ensureAudio() && BJApp.split());
  document.getElementById('btn-surrender')?.addEventListener('click', () => _ensureAudio() && BJApp.surrender());

  /* ─── Execute recommendation ─── */
  document.getElementById('btn-execute')?.addEventListener('click', () => {
    _ensureAudio();
    if (!BJApp.lastRec) return;
    BJApp.Audio.play('settings');
    BJApp.executeRecommendation();
  });

  /* ─── Restart ─── */
  document.getElementById('btn-restart')?.addEventListener('click', () => {
    BJApp.restartGame();
  });

  /* ─── Keyboard shortcuts ─── */
  document.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    const key = e.key;

    if (key === '?' || key === '/') { openShortcuts(); return; }
    if (key === 'Escape') {
      closeShortcuts();
      closeSettings();
      closeHistory();
      if (aboutModal && !aboutModal.hidden) {
        aboutModal.hidden = true;
        aboutBackdrop.hidden = true;
      }
      return;
    }

    if (key === 'S' && e.shiftKey) { openSettings(); return; }
    if (key === 'D' && e.shiftKey) { BJApp.DashboardUI.toggle(); return; }

    if (key === 'm' || key === 'M') {
      if (!BJApp.Audio.initialized) BJApp.Audio.init();
      BJApp.Audio.toggleMute();
      return;
    }

    if (BJApp.phase === 'betting') {
      if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-deal')?.click();
      }
      return;
    }

    if (BJApp.phase === 'round_complete') {
      if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-new-hand')?.click();
      }
      return;
    }

    if (BJApp.phase === 'playing') {
      switch (key) {
        case ' ':
          e.preventDefault();
          if (!document.getElementById('execute-row')?.hidden) {
            document.getElementById('btn-execute')?.click();
          }
          break;
        case 'h': case 'H':
          if (!document.getElementById('btn-hit')?.hidden) BJApp.hit();
          break;
        case 's': case 'S':
          if (!document.getElementById('btn-stand')?.hidden && !e.shiftKey) BJApp.stand();
          break;
        case 'd': case 'D':
          if (!e.shiftKey && !document.getElementById('btn-double')?.hidden) BJApp.double();
          break;
        case 'p': case 'P':
          if (!document.getElementById('btn-split')?.hidden) BJApp.split();
          break;
        case 'r': case 'R':
          if (!document.getElementById('btn-surrender')?.hidden) BJApp.surrender();
          break;
      }
    }
  });

  /* ─── Helpers ─── */
  function _ensureAudio() {
    if (!BJApp.Audio.initialized) BJApp.Audio.init();
    return true;
  }

  function _spawnDustParticles() {
    const container = document.getElementById('bg-particles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'dust-mote';
      const x0 = Math.random() * 100;
      const x1 = x0 + (Math.random() - 0.5) * 20;
      const dur = 18 + Math.random() * 24;
      const delay = -Math.random() * dur;
      const op = 0.1 + Math.random() * 0.2;
      p.style.cssText = `left:${x0}%;--x0:${x0}vw;--x1:${x1}vw;--dur:${dur}s;--delay:${delay}s;--op:${op};animation-delay:${delay}s;`;
      container.appendChild(p);
    }
  }

  /* ─── Initial UI state ─── */
  // Show "no key" state
  BJApp.updateKeyStatus();

  // Welcome toast
  setTimeout(() => {
    BJApp.showToast('Upload a .env file to begin — click the gear icon', 'info');
  }, 800);

  /* ─── Audio init on first interaction ─── */
  const firstInteraction = () => {
    BJApp.Audio.init();
    document.removeEventListener('click', firstInteraction);
    document.removeEventListener('keydown', firstInteraction);
  };
  document.addEventListener('click', firstInteraction);
  document.addEventListener('keydown', firstInteraction);

  console.log('%c♠ Blackjack with AI Agents ♠', 'font-size:18px;font-weight:bold;color:#c9a961;');
  console.log('%cAll LLM interactions are logged here for full transparency.', 'color:#888;font-size:12px;');
  console.log('%cOpen DevTools to inspect every recommendation, token count, and basic strategy comparison.', 'color:#666;font-size:11px;');
});
