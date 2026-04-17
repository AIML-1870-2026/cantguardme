/* ═══════════════════════════════════════════════════════════
   UI/LEVELS.JS — Zone transitions, level-up cinematic
═══════════════════════════════════════════════════════════ */

BJApp.LevelsUI = {

  NARRATIVES: {
    '1->2': "You push back from the table, pockets heavier than when you sat down. A man in a suit catches your eye from across the room and nods toward a door you hadn't noticed before…",
    '2->3': "The floor manager appears at your elbow. 'We have a private room upstairs,' she says. 'Complimentary, of course.' The elevator doors open without a sound.",
    '3->4': "A black card slides across the felt. No name. Just a floor number. The dealer doesn't look up — they already know you won't be coming back down here.",
    '2->1': "The pit boss taps your shoulder. Your credit's no good here anymore.",
    '3->2': "The pit boss taps your shoulder. Your credit's no good here anymore.",
    '4->3': "The elevator descends. The city lights through the glass grow dimmer, closer. You'll be back.",
    'down': "The chips are gone before you feel them leave. Security doesn't say a word — they don't have to."
  },

  setLevel(level, animate = false) {
    const body = document.body;
    body.classList.remove('level-1', 'level-2', 'level-3', 'level-4');

    if (animate) {
      body.classList.add('level-transitioning');
      setTimeout(() => body.classList.remove('level-transitioning'), 700);
    }

    body.classList.add(`level-${level}`);
    BJApp.currentLevel = level;

    this._updateLevelUI(level);
    this._updateBetInputLimits(level);
  },

  _updateLevelUI(level) {
    const info = BJApp.LEVELS[level];
    if (!info) return;

    const roman = document.getElementById('level-roman');
    const name  = document.getElementById('level-name');
    const fill  = document.getElementById('level-progress-fill');

    if (roman) roman.textContent = info.roman;
    if (name)  name.textContent  = info.name;

    // Level progress within current tier
    if (fill) {
      if (level < 4) {
        const low  = BJApp.LEVELS[level].fallAt || 0;
        const high = BJApp.LEVELS[level].advanceAt;
        const pct  = Math.min(100, ((BJApp.balance - low) / (high - low)) * 100);
        fill.style.width = `${Math.max(0, pct)}%`;
      } else {
        fill.style.width = '100%';
      }
    }
  },

  _updateBetInputLimits(level) {
    const info = BJApp.LEVELS[level];
    if (!info) return;
    const inp = document.getElementById('bet-input');
    if (inp) {
      inp.min = info.minBet;
      inp.max = Math.min(info.maxBet, BJApp.balance);
      if (parseInt(inp.value, 10) < info.minBet) {
        inp.value = info.minBet;
        BJApp.bet = info.minBet;
      }
    }
  },

  async transition(fromLevel, toLevel) {
    const rising = toLevel > fromLevel;
    const key = `${fromLevel}->${toLevel}`;
    const narrative = this.NARRATIVES[key] || (rising ? this.NARRATIVES['1->2'] : this.NARRATIVES['down']);

    // Play level-up audio
    BJApp.Audio.play('levelup');

    // Show level-up overlay
    const overlay    = document.getElementById('levelup-overlay');
    const nameEl     = document.getElementById('levelup-name');
    const narrativeEl= document.getElementById('levelup-narrative');
    const labelEl    = document.getElementById('levelup-label');
    const particles  = document.getElementById('levelup-particles');

    if (!overlay) {
      this.setLevel(toLevel, true);
      BJApp.Audio.crossfadeAmbient(toLevel, 2.2);
      return;
    }

    if (nameEl)      nameEl.textContent      = BJApp.LEVELS[toLevel].name;
    if (narrativeEl) narrativeEl.textContent  = narrative;
    if (labelEl)     labelEl.textContent      = rising ? 'Level Up' : 'Level Down';

    // Spawn light particles
    if (particles) {
      particles.innerHTML = '';
      const count = rising ? 40 : 12;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'levelup-particle';
        const cx = 50 + (Math.random() - 0.5) * 80;
        const cy = 50 + (Math.random() - 0.5) * 40;
        const dx = (Math.random() - 0.5) * 200;
        const dy = -(60 + Math.random() * 140);
        const dur = 1.5 + Math.random() * 1;
        const delay = Math.random() * 0.8;
        p.style.cssText = `left:${cx}%;top:${cy}%;--dx:${dx}px;--dy:${dy}px;--dur:${dur}s;--delay:${delay}s;animation-delay:${delay}s;`;
        if (!rising) p.style.background = 'rgba(140,28,28,0.8)';
        particles.appendChild(p);
      }
    }

    overlay.hidden = false;

    // Apply new level visuals mid-overlay
    await BJApp.delay(600);
    this.setLevel(toLevel, true);
    BJApp.Audio.crossfadeAmbient(toLevel, 2.2);
    BJApp.TableUI.renderChipTray();

    // Hide overlay after 3.2s
    await BJApp.delay(2600);
    overlay.hidden = true;

    BJApp.showBettingZone();
  },

  updateProgressBar() {
    this._updateLevelUI(BJApp.currentLevel);
  }
};
