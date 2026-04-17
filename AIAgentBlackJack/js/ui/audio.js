/* ═══════════════════════════════════════════════════════════
   UI/AUDIO.JS — Web Audio API procedural sound engine
   All sound synthesized — no external files needed
═══════════════════════════════════════════════════════════ */

BJApp.Audio = {
  ctx: null,
  masterGain: null,
  ambientGain: null,
  sfxGain: null,
  thinkGain: null,
  ambientNodes: [],
  ambientLevel: 1,
  initialized: false,
  muted: false,
  volume: 0.6,
  captionsEnabled: false,

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.22;
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.45;
      this.sfxGain.connect(this.masterGain);

      this.thinkGain = this.ctx.createGain();
      this.thinkGain.gain.value = 0;
      this.thinkGain.connect(this.masterGain);

      this.initialized = true;
      this.startAmbient(1);

      // Fade in
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 1.2);
    } catch(e) {
      console.warn('Web Audio API not available:', e.message);
    }
  },

  ensureCtx() {
    if (!this.initialized) return false;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  },

  setVolume(v) {
    this.volume = v;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(this.muted ? 0 : v, this.ctx.currentTime + 0.1);
    }
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime + 0.15
      );
    }
    const soundIcon = document.getElementById('icon-sound');
    const muteIcon  = document.getElementById('icon-muted');
    if (soundIcon) soundIcon.hidden = this.muted;
    if (muteIcon)  muteIcon.hidden  = !this.muted;
    this.caption(this.muted ? '♪ muted' : '♪ unmuted');
  },

  caption(text) {
    if (!this.captionsEnabled) return;
    const el = document.getElementById('audio-captions');
    if (!el) return;
    el.hidden = false;
    el.textContent = text;
    clearTimeout(this._captionTimer);
    this._captionTimer = setTimeout(() => { el.hidden = true; }, 2000);
  },

  /* ─── Ambient synthesis per level ─── */

  stopAmbient() {
    this.ambientNodes.forEach(n => {
      try {
        if (n.stop) n.stop();
        n.disconnect();
      } catch {}
    });
    this.ambientNodes = [];
  },

  crossfadeAmbient(newLevel, duration = 2.2) {
    if (!this.ensureCtx()) return;

    const oldGain = this.ctx.createGain();
    oldGain.gain.value = 0.22;
    this.ambientNodes.forEach(n => { try { n.disconnect(); n.connect(oldGain); } catch {} });
    oldGain.connect(this.masterGain);
    oldGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    setTimeout(() => { try { oldGain.disconnect(); } catch {} }, duration * 1000 + 100);

    this.ambientNodes = [];
    this.startAmbient(newLevel);
    this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + duration);
    this.ambientLevel = newLevel;
  },

  startAmbient(level) {
    if (!this.ensureCtx()) return;
    this.stopAmbient();

    const methods = {
      1: () => this._ambientLounge(),
      2: () => this._ambientDowntown(),
      3: () => this._ambientHighLimit(),
      4: () => this._ambientPenthouse()
    };

    (methods[level] || methods[1])();
  },

  _ambientLounge() {
    const now = this.ctx.currentTime;

    // Walking bass — oscillating low notes
    const bassNotes = [55, 58, 62, 65, 58, 55, 62, 60];
    bassNotes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.0;
      const beat = 0.666; // ~90bpm
      const start = now + i * beat;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(0.15, start + 0.05);
      g.gain.linearRampToValueAtTime(0.1, start + beat * 0.7);
      g.gain.linearRampToValueAtTime(0, start + beat);
      osc.connect(filter);
      filter.connect(g);
      g.connect(this.ambientGain);
      osc.start(start);
      osc.stop(start + beat + 0.05);
      this.ambientNodes.push(osc);
    });

    // Brushed drum texture — filtered noise
    const noiseBuffer = this._makeNoiseBuffer(4);
    const ns = this.ctx.createBufferSource();
    ns.buffer = noiseBuffer;
    ns.loop = true;
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 3000;
    nf.Q.value = 0.5;
    const ng = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.frequency.value = 1.5;
    lfoG.gain.value = 0.03;
    lfo.connect(lfoG);
    lfoG.connect(ng.gain);
    ng.gain.value = 0.04;
    ns.connect(nf);
    nf.connect(ng);
    ng.connect(this.ambientGain);
    ns.start();
    lfo.start();
    this.ambientNodes.push(ns, lfo);

    // Room tone
    const room = this._makeNoiseBuffer(4);
    const rs = this.ctx.createBufferSource();
    rs.buffer = room;
    rs.loop = true;
    const rf = this.ctx.createBiquadFilter();
    rf.type = 'lowpass';
    rf.frequency.value = 120;
    const rg = this.ctx.createGain();
    rg.gain.value = 0.015;
    rs.connect(rf);
    rf.connect(rg);
    rg.connect(this.ambientGain);
    rs.start();
    this.ambientNodes.push(rs);
  },

  _ambientDowntown() {
    const now = this.ctx.currentTime;

    // Crowd murmur — pink noise with slow LFO
    const pinkBuffer = this._makeNoiseBuffer(4, 'pink');
    const ns = this.ctx.createBufferSource();
    ns.buffer = pinkBuffer;
    ns.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 600;
    f.Q.value = 0.3;
    const g = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoG.gain.value = 0.015;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    g.gain.value = 0.06;
    ns.connect(f);
    f.connect(g);
    g.connect(this.ambientGain);
    ns.start();
    lfo.start();
    this.ambientNodes.push(ns, lfo);

    // Casino chimes (random timing)
    this._scheduleRandomChimes(now, 8, 3, this.ambientGain, [880, 1046, 1174, 1318, 1396]);
  },

  _ambientHighLimit() {
    const now = this.ctx.currentTime;

    // Deep ambient pad — sine + detuned
    [110, 165, 220].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoG = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq + (i * 0.3);
      lfo.frequency.value = 0.05 + i * 0.02;
      lfoG.gain.value = 0.02;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      g.gain.value = 0.05 - i * 0.01;
      osc.connect(g);
      g.connect(this.ambientGain);
      osc.start();
      lfo.start();
      this.ambientNodes.push(osc, lfo);
    });

    // Soft high shimmer
    const shimmer = this.ctx.createOscillator();
    const sg = this.ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.value = 4186;
    sg.gain.value = 0.003;
    shimmer.connect(sg);
    sg.connect(this.ambientGain);
    shimmer.start();
    this.ambientNodes.push(shimmer);
  },

  _ambientPenthouse() {
    const now = this.ctx.currentTime;

    // Near-silence — deep drone
    [40, 40.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.04;
      const lfo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      lfo.frequency.value = 0.02;
      lg.gain.value = 0.015;
      lfo.connect(lg);
      lg.connect(g.gain);
      osc.connect(g);
      g.connect(this.ambientGain);
      osc.start();
      lfo.start();
      this.ambientNodes.push(osc, lfo);
    });

    // Very faint high harmonic
    const h = this.ctx.createOscillator();
    const hg = this.ctx.createGain();
    h.type = 'sine';
    h.frequency.value = 2093;
    hg.gain.value = 0.004;
    h.connect(hg);
    hg.connect(this.ambientGain);
    h.start();
    this.ambientNodes.push(h);
  },

  _scheduleRandomChimes(now, intervalMin, spread, output, freqs) {
    const schedule = () => {
      if (!this.ensureCtx()) return;
      const t = this.ctx.currentTime + intervalMin + Math.random() * spread;
      const freq = freqs[Math.floor(Math.random() * freqs.length)];
      this._tone(freq, 0.015, 0.8, t, output);
      const timer = setTimeout(schedule, (intervalMin + Math.random() * spread) * 1000);
      this._chimeTimer = timer;
    };
    schedule();
  },

  _tone(freq, gain, duration, when, output) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(g);
    g.connect(output || this.sfxGain);
    osc.start(when);
    osc.stop(when + duration + 0.1);
  },

  _noise(duration, when, freq, bw, gain, output) {
    const buf = this._makeNoiseBuffer(duration + 0.1);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = bw;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    src.connect(f);
    f.connect(g);
    g.connect(output || this.sfxGain);
    src.start(when);
    src.stop(when + duration + 0.1);
  },

  _makeNoiseBuffer(duration, type = 'white') {
    const rate = this.ctx.sampleRate;
    const len = Math.ceil(rate * duration);
    const buf = this.ctx.createBuffer(1, len, rate);
    const data = buf.getChannelData(0);
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        data[i] = w;
      }
    }
    return buf;
  },

  /* ─── SFX ─── */

  play(event) {
    if (!this.ensureCtx()) return;
    const now = this.ctx.currentTime;
    const fn = this._sfx[event];
    if (fn) {
      fn.call(this, now);
      this.caption(`♪ ${event}`);
    }
  },

  _sfx: {
    deal(now) {
      BJApp.Audio._noise(0.04, now, 2000, 5, 0.35);
      BJApp.Audio._noise(0.06, now + 0.01, 800, 2, 0.15);
    },
    chip(now) {
      BJApp.Audio._tone(1318, 0.12, 0.15, now);
      BJApp.Audio._noise(0.02, now, 3000, 8, 0.15);
    },
    win(now) {
      BJApp.Audio._tone(880,  0.2, 0.3,  now);
      BJApp.Audio._tone(1108, 0.15, 0.3, now + 0.08);
      BJApp.Audio._tone(1318, 0.12, 0.4, now + 0.16);
    },
    blackjack(now) {
      [880, 1108, 1318, 1760].forEach((f, i) => {
        BJApp.Audio._tone(f, 0.22 - i * 0.03, 0.5, now + i * 0.1);
      });
      BJApp.Audio._tone(2637, 0.12, 0.8, now + 0.4);
    },
    loss(now) {
      BJApp.Audio._tone(220, 0.12, 0.35, now);
      BJApp.Audio._tone(185, 0.08, 0.3, now + 0.1);
    },
    bust(now) {
      BJApp.Audio._noise(0.08, now, 100, 0.5, 0.4);
      BJApp.Audio._tone(80, 0.15, 0.4, now + 0.02);
      // Duck ambient briefly
      BJApp.Audio.ambientGain.gain.linearRampToValueAtTime(0.06, now + 0.05);
      BJApp.Audio.ambientGain.gain.linearRampToValueAtTime(0.22, now + 0.25);
    },
    push(now) {
      BJApp.Audio._tone(660, 0.08, 0.2, now);
    },
    surrender(now) {
      BJApp.Audio._noise(0.1, now, 1200, 3, 0.12);
      BJApp.Audio._tone(330, 0.06, 0.3, now);
    },
    recommendation(now) {
      BJApp.Audio._tone(1046, 0.1, 0.3, now);
    },
    thinking(now) {
      // Subtle synth swell — duck ambient -3dB
      BJApp.Audio.ambientGain.gain.linearRampToValueAtTime(0.13, now + 0.3);
      const osc = BJApp.Audio.ctx.createOscillator();
      const g = BJApp.Audio.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(330, now + 1.5);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.025, now + 0.5);
      g.gain.linearRampToValueAtTime(0, now + 2);
      osc.connect(g);
      g.connect(BJApp.Audio.masterGain);
      osc.start(now);
      osc.stop(now + 2.1);
      // Restore ambient after thinking
      setTimeout(() => {
        if (BJApp.Audio.ambientGain) {
          BJApp.Audio.ambientGain.gain.linearRampToValueAtTime(0.22, BJApp.Audio.ctx.currentTime + 0.5);
        }
      }, 2100);
    },
    levelup(now) {
      [440, 554, 659, 880, 1108, 1318].forEach((f, i) => {
        BJApp.Audio._tone(f, 0.18 - i * 0.02, 0.6, now + i * 0.12);
      });
      BJApp.Audio._noise(0.3, now + 0.1, 2000, 3, 0.12);
    },
    stand(now) {
      BJApp.Audio._noise(0.03, now, 1000, 4, 0.1);
    },
    settings(now) {
      BJApp.Audio._tone(660, 0.05, 0.1, now);
    },
    error(now) {
      BJApp.Audio._tone(220, 0.1, 0.12, now);
      BJApp.Audio._tone(196, 0.08, 0.1, now + 0.1);
    },
    holecard(now) {
      BJApp.Audio._noise(0.06, now, 1400, 3, 0.3);
      BJApp.Audio._noise(0.04, now + 0.04, 400, 2, 0.15);
    }
  }
};
