'use strict';
// ============================================================
// AUDIO MANAGER — RGB Chef's Kitchen
// Procedural cooking-game-style background music (Web Audio API)
// ============================================================

const AudioManager = (() => {
  // --- State ---
  let ctx         = null;
  let masterGain  = null;
  let reverbIn    = null;   // input node for the reverb tail
  let isPlaying   = false;
  let nextBeatTime = 0.0;
  let currentBeat  = 0;
  let currentChord = 0;
  let schedTimer   = null;
  let vol          = 0.28;

  const BPM             = 88;
  const BEAT            = 60 / BPM;   // ~0.682 s per beat
  const LOOK_AHEAD      = 0.20;       // seconds to schedule ahead
  const SCHED_INTERVAL  = 80;         // ms between scheduler ticks
  const BEATS_PER_CHORD = 4;

  // --- Frequencies (Hz, equal temperament, A4 = 440 Hz) ---
  const N = {
    F2:  87.31,  G2:  98.00,  A2: 110.00,
    C3: 130.81,  D3: 146.83,  E3: 164.81,  F3: 174.61,
    G3: 196.00,  A3: 220.00,  B3: 246.94,
    C4: 261.63,  D4: 293.66,  E4: 329.63,  F4: 349.23,
    G4: 392.00,  A4: 440.00,  B4: 493.88,
    C5: 523.25,  D5: 587.33,  E5: 659.25,
    G5: 783.99,  A5: 880.00,
  };

  // Chord loop: Cmaj7 | G | Am7 | Fmaj7  (calm, warm, cooking-game vibes)
  // Each object: bass root, mid voicing, melody pool (pentatonic over chord)
  const CHORDS = [
    {
      bass: N.C3,
      mid:  [N.C4, N.E4, N.G4, N.B4],
      pool: [N.C4, N.E4, N.G4, N.B4, N.C5, N.E5],
    },
    {
      bass: N.G2,
      mid:  [N.G3, N.B3, N.D4, N.G4],
      pool: [N.G4, N.B4, N.D5, N.G5, N.D4, N.B3],
    },
    {
      bass: N.A2,
      mid:  [N.A3, N.C4, N.E4, N.A4],
      pool: [N.A4, N.C5, N.E5, N.A3, N.C4, N.E4],
    },
    {
      bass: N.F2,
      mid:  [N.F3, N.A3, N.C4, N.F4],
      pool: [N.F4, N.A4, N.C5, N.F3, N.A3, N.C4],
    },
  ];

  // ── Audio graph init ──────────────────────────────────────
  function initCtx() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Compressor keeps everything tidy
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value      = 10;
    comp.ratio.value     =  4;
    comp.attack.value    = 0.003;
    comp.release.value   = 0.20;
    comp.connect(ctx.destination);

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol, ctx.currentTime);
    masterGain.connect(comp);

    // Simple Schroeder-style reverb: two cross-fed short delays
    reverbIn    = ctx.createGain();
    const dA    = ctx.createDelay(0.5); dA.delayTime.value = 0.0371;
    const dB    = ctx.createDelay(0.5); dB.delayTime.value = 0.0631;
    const fbGain = ctx.createGain(); fbGain.gain.value = 0.38;
    const wetGain = ctx.createGain(); wetGain.gain.value = 0.20;

    reverbIn.connect(dA);  reverbIn.connect(dB);
    dA.connect(fbGain);    dB.connect(fbGain);
    fbGain.connect(dA);    fbGain.connect(dB);
    dA.connect(wetGain);   dB.connect(wetGain);
    wetGain.connect(masterGain);
  }

  // ── Low-level note player ─────────────────────────────────
  function playNote(freq, time, dur, type, amp, useReverb) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    const atk = Math.min(0.04, dur * 0.08);
    const rel = Math.min(dur * 0.55, 0.55);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(amp,    time + atk);
    env.gain.setValueAtTime(amp,             time + dur - rel);
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    osc.connect(env);
    env.connect(masterGain);
    if (useReverb && reverbIn) env.connect(reverbIn);

    osc.start(time);
    osc.stop(time + dur + 0.06);
  }

  // Piano-ish timbre: triangle body + brief sine upper partial
  function piano(freq, time, dur, amp) {
    playNote(freq, time, dur,       'triangle', amp * 0.65, true);
    playNote(freq, time, dur * 0.4, 'sine',     amp * 0.35, false);
  }

  // Warm bass: pure sine
  function playBass(freq, time, dur, amp) {
    playNote(freq, time, dur, 'sine', amp, false);
  }

  // ── Per-beat event generator ──────────────────────────────
  function scheduleBeat(t) {
    const chord = CHORDS[currentChord];
    const bic   = currentBeat % BEATS_PER_CHORD; // beat position in chord

    // Bass: root on beat 1, soft 5th on beat 3
    if (bic === 0) {
      playBass(chord.bass,       t,            BEAT * 2.3, 0.22);
    } else if (bic === 2) {
      playBass(chord.bass * 1.5, t,            BEAT * 1.4, 0.10);
    }

    // Chord voicing: block stagger on beat 1, light arpeggio on beat 3
    if (bic === 0) {
      chord.mid.forEach((f, i) => piano(f, t + i * 0.044, BEAT * 3.3, 0.065));
    } else if (bic === 2) {
      chord.mid.slice(0, 3).forEach((f, i) => piano(f, t + i * 0.068, BEAT * 1.7, 0.046));
    }

    // Melody: random pentatonic note, ~55% chance per beat, slight offset
    if (Math.random() < 0.55) {
      const f    = chord.pool[Math.floor(Math.random() * chord.pool.length)];
      const mdur = BEAT * (Math.random() < 0.35 ? 1.8 : 0.9);
      playNote(f, t + Math.random() * 0.11, mdur, 'triangle', 0.068, true);
    }

    // Occasional graceful passing note on the &-of-4
    if (bic === 3 && Math.random() < 0.28) {
      const f = chord.pool[Math.floor(Math.random() * chord.pool.length)];
      playNote(f, t + BEAT * 0.5, BEAT * 0.45, 'sine', 0.038, true);
    }
  }

  // ── Lookahead scheduler ───────────────────────────────────
  function schedule() {
    if (!isPlaying || !ctx) return;
    while (nextBeatTime < ctx.currentTime + LOOK_AHEAD) {
      scheduleBeat(nextBeatTime);
      nextBeatTime += BEAT;
      currentBeat++;
      if (currentBeat % BEATS_PER_CHORD === 0) {
        currentChord = (currentChord + 1) % CHORDS.length;
      }
    }
    schedTimer = setTimeout(schedule, SCHED_INTERVAL);
  }

  // ── Button sync helper ────────────────────────────────────
  function syncBtn(on) {
    document.querySelectorAll('.music-toggle-btn').forEach(btn => {
      btn.textContent = on ? '🎵' : '🔇';
      btn.title       = on ? 'Mute music' : 'Unmute music';
      btn.classList.toggle('muted', !on);
    });
  }

  // ── Public API ────────────────────────────────────────────
  return {
    start() {
      initCtx();
      if (ctx.state === 'suspended') ctx.resume();
      if (isPlaying) return;
      isPlaying    = true;
      nextBeatTime = ctx.currentTime + 0.05;
      currentBeat  = 0;
      currentChord = 0;
      schedule();
      syncBtn(true);
    },

    stop() {
      isPlaying = false;
      if (schedTimer) { clearTimeout(schedTimer); schedTimer = null; }
      syncBtn(false);
    },

    toggle() {
      if (isPlaying) this.stop(); else this.start();
    },

    setVolume(v) {
      vol = Math.max(0, Math.min(1, v));
      if (masterGain && ctx) {
        masterGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.1);
      }
    },

    get playing() { return isPlaying; },
  };
})();
