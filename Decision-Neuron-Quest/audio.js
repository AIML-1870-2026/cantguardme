/* ==============================
   Decision Neuron Quest — Audio
   Web Audio API sci-fi sound effects
   ============================== */

const Audio = {
  ctx: null,
  enabled: true,
  masterGain: null,
  volume: 0.35,

  init() {
    const createCtx = () => {
      if (this.ctx) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      document.removeEventListener('click', createCtx);
      document.removeEventListener('keydown', createCtx);
    };
    document.addEventListener('click', createCtx);
    document.addEventListener('keydown', createCtx);
  },

  ensureCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },

  // --- Sound generators ---

  playClick() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.06);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  },

  playSend() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.15);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  },

  playReceive() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;

    [1400, 1100, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.15);
    });
  },

  playNetworkBuild() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc2.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.4);
    osc2.frequency.setValueAtTime(200, t);
    osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(3000, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.5);
    filter.Q.value = 5;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
    gain.gain.setValueAtTime(0.08, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.6);
    osc2.stop(t + 0.6);
  },

  // Node appear — dramatic sparkle burst
  playNodeAppear() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // Rising shimmer
    [1200, 1600, 2000, 2400].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + i * 0.04 + 0.12);
      gain.gain.setValueAtTime(0, t + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.08, t + i * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.2);
    });

    // Sub bass thump
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(80, t);
    bass.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    bassGain.gain.setValueAtTime(0.12, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    bass.connect(bassGain);
    bassGain.connect(this.masterGain);
    bass.start(t);
    bass.stop(t + 0.2);
  },

  // Edge connection — electric zap sweep
  playEdgeConnect() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc2.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.3);
    osc2.frequency.setValueAtTime(100, t);
    osc2.frequency.exponentialRampToValueAtTime(1500, t + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(3000, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.25);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.35);
    osc2.stop(t + 0.35);
  },

  // Slider tick — subtle notch sound
  playSliderTick() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400 + Math.random() * 400, t);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.03);
  },

  // Slider adjust complete — satisfying confirmation
  playSliderAdjust() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;

    [880, 1100].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      gain.gain.setValueAtTime(0, t + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.08, t + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.15);
    });
  },

  // MC option select — bright chirp
  playMCSelect() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.08);
    osc.frequency.setValueAtTime(1400, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.15);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  },

  playTrainTick() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, t);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.04);
  },

  playPointPlace() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  },

  playModeSwitch() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;

    [660, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      gain.gain.setValueAtTime(0.1, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.15);
    });
  },

  playMilestone() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;

    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);
      gain.gain.setValueAtTime(0, t + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.08, t + i * 0.05 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.4);
    });
  },

  playReset() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.35);
  },

  playEnergyPulse() {
    if (!this.enabled) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.06);
    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  },

  _trainHumOsc: null,
  _trainHumGain: null,

  startTrainHum() {
    if (!this.enabled || this._trainHumOsc) return;
    this.ensureCtx();
    const t = this.ctx.currentTime;
    this._trainHumOsc = this.ctx.createOscillator();
    this._trainHumGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    this._trainHumOsc.type = 'sine';
    this._trainHumOsc.frequency.value = 120;
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    this._trainHumGain.gain.setValueAtTime(0, t);
    this._trainHumGain.gain.linearRampToValueAtTime(0.04, t + 0.3);
    this._trainHumOsc.connect(filter);
    filter.connect(this._trainHumGain);
    this._trainHumGain.connect(this.masterGain);
    this._trainHumOsc.start(t);
  },

  stopTrainHum() {
    if (!this._trainHumOsc) return;
    const t = this.ctx.currentTime;
    this._trainHumGain.gain.linearRampToValueAtTime(0, t + 0.3);
    this._trainHumOsc.stop(t + 0.35);
    this._trainHumOsc = null;
    this._trainHumGain = null;
  },
};
