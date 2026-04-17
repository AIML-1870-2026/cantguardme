/* ═══════════════════════════════════════════════════════════════
   RISE — Blackjack  |  game.js
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   CONSTANTS
   ────────────────────────────────────────────────────────────── */
const RANKS  = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const SUITS  = ['♠','♥','♦','♣'];
const SUIT_COLOR = { '♠': '#111', '♥': '#c0202a', '♦': '#c0202a', '♣': '#111' };

const LEVELS = [
  { name: 'The Backroom',          min: 0,       max: 19999,   betMin: 500,    betMax: 5000,    chips: [500, 1000, 2500]          },
  { name: 'The Downtown Floor',    min: 20000,   max: 99999,   betMin: 2500,   betMax: 25000,   chips: [2500, 5000, 10000]        },
  { name: 'The High Roller Suite', min: 100000,  max: 499999,  betMin: 10000,  betMax: 100000,  chips: [10000, 25000, 50000]      },
  { name: 'The Penthouse',         min: 500000,  max: Infinity, betMin: 50000, betMax: 1000000, chips: [50000, 250000, 500000]    },
];

const CHIP_COLORS = {
  5:    '#c0392b', 10:   '#2980b9', 25:   '#27ae60',
  50:   '#e67e22', 100:  '#2c2c2c', 250:  '#8e44ad',
  500:  '#b7860b', 1000: '#909090', 2500: '#c8c8d0',
};

const RISE_NARRATIVES = {
  '0-1': `"You push back from the table, pockets heavier than when you sat down. A man in a suit catches your eye from across the room and nods toward a door you hadn't noticed before…"`,
  '1-2': `"The floor manager appears at your elbow. 'We have a private room upstairs,' she says. 'Complimentary, of course.' The elevator doors open without a sound."`,
  '2-3': `"A black card slides across the felt. No name. Just a floor number. The dealer doesn't look up — they already know you won't be coming back down here."`,
  'fall-any': `"The pit boss taps your shoulder. Your credit's no good here anymore."`,
  'fall-0': `"The chips are gone before you feel them leave. Security doesn't say a word — they don't have to. The elevator only goes down."`,
};

/* ──────────────────────────────────────────────────────────────
   STATE
   ────────────────────────────────────────────────────────────── */
let state = {
  phase: 'title',           // title | betting | insurance | playing | split | dealer | complete
  bankroll: 10000,
  level: 0,
  shoe: [],
  shoeIndex: 0,
  cutCardPos: 234,
  playerHands: [],          // [{cards, bet, done, fromSplit, result}]
  activeHandIdx: 0,
  dealerCards: [],
  betStack: [],             // array of chip values currently bet
  currentBet: 0,
  insuranceBet: 0,
  insuranceMaxBet: 0,
  stats: {
    wins: 0, losses: 0, pushes: 0,
    streak: 0, streakType: '',
    biggestWin: 0, peakBankroll: 10000,
    handsPlayed: 0,
  },
  bestRun: 0,               // across sessions
  dealerRevealDone: false,
};

/* ──────────────────────────────────────────────────────────────
   AUDIO SYSTEM
   ────────────────────────────────────────────────────────────── */
let audioCtx   = null;
let masterGain = null;
let isMuted    = false;
let ambientSource = null;
let ambientGain   = null;
let ambientLFO    = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.55;
  masterGain.connect(audioCtx.destination);
}

function createNoiseBuffer(type = 'white', seconds = 2) {
  const bufSize = audioCtx.sampleRate * seconds;
  const buf     = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data    = buf.getChannelData(0);
  let   lastOut = 0;
  for (let i = 0; i < bufSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'pink') {
      lastOut = 0.99765 * lastOut + white * 0.0555179;
      data[i] = lastOut * 3.5;
    } else if (type === 'brown') {
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 18;
    } else {
      data[i] = white;
    }
  }
  return buf;
}

function playNoise(type, freq, dur, gain = 0.1, bandQ = 1.2) {
  if (!audioCtx || isMuted) return;
  const src    = audioCtx.createBufferSource();
  src.buffer   = createNoiseBuffer(type, Math.max(dur, 0.2));
  const filter = audioCtx.createBiquadFilter();
  filter.type  = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value         = bandQ;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(gain, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start();
  src.stop(audioCtx.currentTime + dur);
}

function playTone(freq, dur, gain = 0.18, type = 'sine', attack = 0.01, release = 0.3) {
  if (!audioCtx || isMuted) return;
  const osc = audioCtx.createOscillator();
  const g   = audioCtx.createGain();
  osc.type  = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  osc.connect(g);
  g.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + dur + release);
}

function startAmbient(level) {
  stopAmbient();
  if (!audioCtx || isMuted) return;

  ambientGain = audioCtx.createGain();
  ambientGain.gain.value = 0;
  ambientGain.connect(masterGain);

  if (level === 0) {
    // Brown noise hum
    const src    = audioCtx.createBufferSource();
    src.buffer   = createNoiseBuffer('brown', 3);
    src.loop     = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type  = 'lowpass';
    filter.frequency.value = 180;
    src.connect(filter);
    filter.connect(ambientGain);
    src.start();
    ambientSource = src;

    // LFO throb
    ambientLFO = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.025;
    ambientLFO.frequency.value = 0.4;
    ambientLFO.connect(lfoGain);
    lfoGain.connect(ambientGain.gain);
    ambientLFO.start();

    // Random drips
    scheduleRandomDrips();

  } else if (level === 1) {
    // Pink noise crowd
    const src    = audioCtx.createBufferSource();
    src.buffer   = createNoiseBuffer('pink', 4);
    src.loop     = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type  = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.5;
    src.connect(filter);
    filter.connect(ambientGain);
    src.start();
    ambientSource = src;

    scheduleRandomChimes();

  } else if (level === 2) {
    // Jazz: sine melody + triangle bass
    const bassOsc = audioCtx.createOscillator();
    bassOsc.type  = 'triangle';
    bassOsc.frequency.value = 65;
    const bassG = audioCtx.createGain();
    bassG.gain.value = 0.08;
    bassOsc.connect(bassG);
    bassG.connect(ambientGain);
    bassOsc.start();
    ambientSource = bassOsc;

    scheduleJazzMelody();

  } else if (level === 3) {
    // Deep drone: two detuned sines
    const osc1 = audioCtx.createOscillator();
    osc1.type  = 'sine';
    osc1.frequency.value = 35;
    const osc2 = audioCtx.createOscillator();
    osc2.type  = 'sine';
    osc2.frequency.value = 36;
    const g1 = audioCtx.createGain(); g1.gain.value = 0.12;
    const g2 = audioCtx.createGain(); g2.gain.value = 0.08;
    const shimOsc = audioCtx.createOscillator();
    shimOsc.frequency.value = 440;
    const shimG = audioCtx.createGain(); shimG.gain.value = 0.012;
    osc1.connect(g1); g1.connect(ambientGain);
    osc2.connect(g2); g2.connect(ambientGain);
    shimOsc.connect(shimG); shimG.connect(ambientGain);
    osc1.start(); osc2.start(); shimOsc.start();
    ambientSource = osc1;
  }

  // Fade in ambient
  ambientGain.gain.linearRampToValueAtTime(0.55, audioCtx.currentTime + 1.5);
}

function stopAmbient() {
  try {
    if (ambientSource) { ambientSource.stop(); ambientSource = null; }
    if (ambientLFO)    { ambientLFO.stop();    ambientLFO    = null; }
    if (ambientGain) {
      ambientGain.gain.setValueAtTime(ambientGain.gain.value, audioCtx.currentTime);
      ambientGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
      setTimeout(() => { try { ambientGain.disconnect(); } catch(e){} ambientGain = null; }, 900);
    }
  } catch(e) {}
}

let _dripsTimeout = null;
function scheduleRandomDrips() {
  if (!ambientGain || !audioCtx) return;
  const delay = 3000 + Math.random() * 8000;
  _dripsTimeout = setTimeout(() => {
    if (state.level === 0) {
      playTone(1800 + Math.random() * 400, 0.08, 0.04, 'sine');
      scheduleRandomDrips();
    }
  }, delay);
}

let _chimesTimeout = null;
function scheduleRandomChimes() {
  if (!ambientGain || !audioCtx) return;
  const delay = 4000 + Math.random() * 10000;
  _chimesTimeout = setTimeout(() => {
    if (state.level === 1) {
      const notes = [880, 1046, 1174, 1318];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, 0.035, 'sine', 0.01, 0.25), i * 120);
      });
      scheduleRandomChimes();
    }
  }, delay);
}

let _jazzTimeout = null;
const JAZZ_NOTES = [196, 220, 246, 261, 293, 329, 349, 392, 440];
function scheduleJazzMelody() {
  if (!ambientGain || !audioCtx) return;
  const delay = 2000 + Math.random() * 4000;
  _jazzTimeout = setTimeout(() => {
    if (state.level === 2) {
      const len = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < len; i++) {
        const f = JAZZ_NOTES[Math.floor(Math.random() * JAZZ_NOTES.length)];
        setTimeout(() => playTone(f * 2, 0.6 + Math.random() * 0.4, 0.03, 'sine', 0.05, 0.5), i * 350);
      }
      scheduleJazzMelody();
    }
  }, delay);
}

function playSound(type) {
  if (!audioCtx || isMuted) return;
  const lvl = state.level;
  switch(type) {
    case 'deal':
      if (lvl === 0) playNoise('white', 300, 0.12, 0.15, 3);
      else if (lvl === 1) playNoise('white', 800, 0.08, 0.1, 5);
      else if (lvl === 2) playNoise('pink',  500, 0.07, 0.07, 4);
      else               playNoise('white', 200, 0.05, 0.03, 2);
      break;
    case 'chip':
      if (lvl === 0) playTone(320, 0.1, 0.12, 'triangle');
      else if (lvl === 1) playTone(900, 0.08, 0.1, 'sine', 0.005);
      else if (lvl === 2) playTone(120, 0.18, 0.14, 'sine', 0.005, 0.15);
      else               playTone(80,  0.5,  0.12, 'sine', 0.005, 0.45);
      break;
    case 'win':
      if (lvl === 0) {
        playTone(280, 0.3, 0.1, 'triangle');
      } else if (lvl === 1) {
        [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.25, 0.1, 'sine'), i * 90));
      } else if (lvl === 2) {
        playTone(1047, 0.6, 0.08, 'sine', 0.02, 0.5);
        playTone(1319, 0.6, 0.05, 'sine', 0.04, 0.5);
        playTone(1568, 0.6, 0.04, 'sine', 0.06, 0.5);
      } else {
        // Cinematic swell
        const osc = audioCtx.createOscillator();
        const g   = audioCtx.createGain();
        osc.type  = 'sine';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 1.5);
        g.gain.setValueAtTime(0, audioCtx.currentTime);
        g.gain.linearRampToValueAtTime(0.14, audioCtx.currentTime + 0.5);
        g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
        osc.connect(g); g.connect(masterGain);
        osc.start(); osc.stop(audioCtx.currentTime + 2.1);
        playTone(660, 2.0, 0.06, 'sine', 0.3, 1.5);
      }
      break;
    case 'blackjack':
      if (lvl === 3) {
        [220,330,440,550,660,880].forEach((f, i) =>
          setTimeout(() => playTone(f, 0.8, 0.06, 'sine', 0.05, 0.7), i * 100)
        );
      } else {
        [392,523,659,784,1047].forEach((f, i) =>
          setTimeout(() => playTone(f, 0.4, 0.1, 'sine'), i * 80)
        );
      }
      break;
    case 'lose':
      if (lvl === 0) { /* silence */ }
      else if (lvl === 1) playTone(220, 0.4, 0.08, 'triangle', 0.02, 0.35);
      else if (lvl === 2) { playTone(330, 0.5, 0.06, 'sine'); playTone(277, 0.5, 0.05, 'sine', 0.02); }
      else               playTone(110, 0.8, 0.04, 'sine', 0.05, 0.7);
      break;
    case 'push':
      playTone(440, 0.2, 0.06, 'sine');
      break;
    case 'bust':
      playNoise('white', 200, 0.2, 0.12, 2);
      playTone(180, 0.3, 0.08, 'triangle', 0.01, 0.25);
      break;
    case 'flip':
      playNoise('white', 600, 0.06, 0.06, 8);
      break;
  }
}

function playTransitionSound(rising) {
  if (!audioCtx || isMuted) return;
  const notes = rising
    ? [220, 277, 330, 440, 554, 659, 880]
    : [880, 659, 554, 440, 330, 277, 220];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.4, rising ? 0.1 : 0.07, 'sine', 0.02, 0.35), i * 140);
  });
}

function toggleMute() {
  isMuted = !isMuted;
  if (masterGain) masterGain.gain.value = isMuted ? 0 : 0.55;
  document.getElementById('mute-icon').textContent = isMuted ? '🔇' : '🔊';
}

/* ──────────────────────────────────────────────────────────────
   DECK ENGINE
   ────────────────────────────────────────────────────────────── */
function cardValue(rank) {
  if (rank === 'A') return 11;
  if (['J','Q','K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

function buildShoe() {
  const shoe = [];
  for (let d = 0; d < 6; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit, value: cardValue(rank) });
      }
    }
  }
  return fisherYates(shoe);
}

function fisherYates(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getHandValue(cards) {
  let value = 0, aces = 0;
  for (const c of cards) {
    value += c.value;
    if (c.rank === 'A') aces++;
  }
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  const soft = aces > 0 && value <= 21 && value + 10 > 21; // has usable ace counted as 11
  // Recalculate whether any ace is still contributing 11
  let recalc = 0, recalcAces = 0;
  for (const c of cards) { recalc += c.value; if (c.rank === 'A') recalcAces++; }
  while (recalc > 21 && recalcAces > 0) { recalc -= 10; recalcAces--; }
  return { value: recalc <= 21 ? recalc : value, soft: recalcAces > 0 };
}

function isBlackjack(cards) {
  if (cards.length !== 2) return false;
  const vals = cards.map(c => c.rank);
  return (vals.includes('A') && cards.some(c => ['10','J','Q','K'].includes(c.rank)));
}

function drawCard() {
  if (state.shoeIndex >= state.shoe.length) reshuffleShoe();
  return state.shoe[state.shoeIndex++];
}

function reshuffleShoe() {
  state.shoe = buildShoe();
  state.shoeIndex = 0;
  state.cutCardPos = Math.floor(state.shoe.length * 0.75);
  showShuffleNotif();
}

function updateShoeBar() {
  const total     = state.shoe.length;
  const remaining = total - state.shoeIndex;
  const pct       = Math.max(0, Math.round(remaining / total * 100));
  document.getElementById('shoe-fill').style.width = pct + '%';
  document.getElementById('shoe-pct').textContent  = `${remaining}/${total}`;
}

/* ──────────────────────────────────────────────────────────────
   SVG CARD RENDERING
   ────────────────────────────────────────────────────────────── */
const PIP_LAYOUTS = {
  'A':  [[50,50]],
  '2':  [[50,28],[50,72]],
  '3':  [[50,22],[50,50],[50,78]],
  '4':  [[28,28],[72,28],[28,72],[72,72]],
  '5':  [[28,28],[72,28],[50,50],[28,72],[72,72]],
  '6':  [[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
  '7':  [[28,22],[72,22],[50,37],[28,52],[72,52],[28,72],[72,72]],
  '8':  [[28,20],[72,20],[28,40],[72,40],[28,60],[72,60],[28,80],[72,80]],
  '9':  [[28,20],[72,20],[28,38],[72,38],[50,50],[28,62],[72,62],[28,80],[72,80]],
  '10': [[28,18],[72,18],[28,34],[72,34],[50,44],[50,56],[28,66],[72,66],[28,82],[72,82]],
};

const FACE_GLYPHS = { 'J': 'J', 'Q': 'Q', 'K': 'K' };

function createCardSVG(rank, suit) {
  const W = 72, H = 100;
  const color = SUIT_COLOR[suit];
  const isRed  = color !== '#111';
  const isFace = ['J','Q','K'].includes(rank);

  let innerContent = '';

  if (isFace) {
    // Decorative frame + big letter
    innerContent = `
      <rect x="6" y="6" width="${W-12}" height="${H-12}" rx="3"
            fill="none" stroke="${isRed ? '#d4a0a0' : '#a0a0c0'}" stroke-width="0.6" opacity="0.5"/>
      <text x="${W/2}" y="${H/2+18}" text-anchor="middle"
            font-size="38" font-family="Georgia,serif"
            fill="${color}" opacity="0.85">${FACE_GLYPHS[rank]}</text>
      <text x="${W/2}" y="${H/2+26}" text-anchor="middle"
            font-size="14" font-family="Georgia,serif"
            fill="${color}" opacity="0.5">${suit}</text>`;
  } else if (rank === 'A') {
    innerContent = `
      <text x="${W/2}" y="${H/2+8}" text-anchor="middle"
            font-size="36" font-family="Georgia,serif" fill="${color}">${suit}</text>`;
  } else {
    const pips = PIP_LAYOUTS[rank] || [];
    const pipSize = rank === '10' || rank === '9' || rank === '8' ? 7 : 9;
    innerContent = pips.map(([px, py]) =>
      `<text x="${px * W / 100}" y="${py * H / 100 + pipSize * 0.35}"
             text-anchor="middle" font-size="${pipSize}"
             font-family="Georgia,serif" fill="${color}">${suit}</text>`
    ).join('');
  }

  const rankSize = rank === '10' ? 9 : 11;

  return `<svg xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" rx="${4}" fill="#f8f5ee" stroke="#ccc" stroke-width="0.5"/>
    <!-- Top-left rank + suit -->
    <text x="4" y="${rankSize + 2}" font-size="${rankSize}"
          font-family="'Cinzel',Georgia,serif" font-weight="700"
          fill="${color}">${rank}</text>
    <text x="4" y="${rankSize * 2 + 2}" font-size="${rankSize - 1}"
          font-family="Georgia,serif" fill="${color}">${suit}</text>
    <!-- Bottom-right rank + suit (rotated) -->
    <g transform="rotate(180, ${W/2}, ${H/2})">
      <text x="4" y="${rankSize + 2}" font-size="${rankSize}"
            font-family="'Cinzel',Georgia,serif" font-weight="700"
            fill="${color}">${rank}</text>
      <text x="4" y="${rankSize * 2 + 2}" font-size="${rankSize - 1}"
            font-family="Georgia,serif" fill="${color}">${suit}</text>
    </g>
    <!-- Center pip area -->
    ${innerContent}
  </svg>`;
}

const CARD_BACKS = [
  // Backroom: rough worn pattern
  (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" rx="4" fill="#1a0f05"/>
    <pattern id="bp0" patternUnits="userSpaceOnUse" width="8" height="8">
      <rect width="8" height="8" fill="none"/>
      <line x1="0" y1="0" x2="8" y2="8" stroke="#3a2510" stroke-width="0.8"/>
      <line x1="0" y1="8" x2="8" y2="0" stroke="#2a1808" stroke-width="0.5"/>
    </pattern>
    <rect width="${W}" height="${H}" rx="4" fill="url(#bp0)" opacity="0.8"/>
    <rect x="4" y="4" width="${W-8}" height="${H-8}" rx="2" fill="none" stroke="#4a3520" stroke-width="1"/>
  </svg>`,

  // Downtown: classic casino diamond weave
  (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" rx="4" fill="#0d3a10"/>
    <pattern id="bp1" patternUnits="userSpaceOnUse" width="10" height="10">
      <rect width="10" height="10" fill="none"/>
      <rect x="0" y="0" width="5" height="5" fill="#0f4412" opacity="0.7"/>
      <rect x="5" y="5" width="5" height="5" fill="#0f4412" opacity="0.7"/>
    </pattern>
    <rect width="${W}" height="${H}" rx="4" fill="url(#bp1)"/>
    <rect x="3" y="3" width="${W-6}" height="${H-6}" rx="2"
          fill="none" stroke="#1a7a1a" stroke-width="1.2"/>
    <rect x="6" y="6" width="${W-12}" height="${H-12}" rx="1"
          fill="none" stroke="#1a5a1a" stroke-width="0.5"/>
  </svg>`,

  // High Roller: gold foil diagonal lines
  (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" rx="4" fill="#07101e"/>
    <pattern id="bp2" patternUnits="userSpaceOnUse" width="12" height="12">
      <line x1="0" y1="0" x2="12" y2="12" stroke="#8a6a20" stroke-width="0.6" opacity="0.6"/>
      <line x1="0" y1="6" x2="6" y2="12" stroke="#c9a84c" stroke-width="0.4" opacity="0.3"/>
    </pattern>
    <rect width="${W}" height="${H}" rx="4" fill="url(#bp2)"/>
    <rect x="3" y="3" width="${W-6}" height="${H-6}" rx="2"
          fill="none" stroke="#c9a84c" stroke-width="1.2" opacity="0.7"/>
    <rect x="6" y="6" width="${W-12}" height="${H-12}" rx="1"
          fill="none" stroke="#8a6a20" stroke-width="0.5" opacity="0.5"/>
    <text x="${W/2}" y="${H/2+6}" text-anchor="middle" font-size="18"
          font-family="Georgia" fill="#c9a84c" opacity="0.2">♠</text>
  </svg>`,

  // Penthouse: minimalist dark with metallic edge
  (W, H) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
      <linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1a1a1e"/>
        <stop offset="50%" stop-color="#0a0a0c"/>
        <stop offset="100%" stop-color="#141418"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" rx="4" fill="url(#pg)"/>
    <rect x="3" y="3" width="${W-6}" height="${H-6}" rx="2"
          fill="none" stroke="#505058" stroke-width="0.8"/>
    <rect x="6" y="6" width="${W-12}" height="${H-12}" rx="1"
          fill="none" stroke="#303038" stroke-width="0.4"/>
    <line x1="${W/2}" y1="12" x2="${W/2}" y2="${H-12}"
          stroke="#404048" stroke-width="0.3"/>
    <line x1="12" y1="${H/2}" x2="${W-12}" y2="${H/2}"
          stroke="#404048" stroke-width="0.3"/>
  </svg>`,
];

function createCardElement(card, faceDown = false) {
  const W = 72, H = 100;
  const wrapper   = document.createElement('div');
  wrapper.className = 'card-wrapper' + (faceDown ? ' face-down' : '');

  // Random slight tilt for organic feel
  const tilt = (Math.random() - 0.5) * 3;
  wrapper.style.setProperty('--card-tilt', tilt + 'deg');

  const inner     = document.createElement('div');
  inner.className = 'card-inner';

  // Face
  const face = document.createElement('div');
  face.className = 'card-face';
  face.innerHTML = createCardSVG(card.rank, card.suit);

  // Back
  const back = document.createElement('div');
  back.className = 'card-back-el';
  back.innerHTML = CARD_BACKS[state.level](W, H);

  inner.appendChild(face);
  inner.appendChild(back);
  wrapper.appendChild(inner);
  return wrapper;
}

function updateCardBack(wrapper) {
  const W = 72, H = 100;
  const back = wrapper.querySelector('.card-back-el');
  if (back) back.innerHTML = CARD_BACKS[state.level](W, H);
}

/* ──────────────────────────────────────────────────────────────
   ANIMATION HELPERS
   ────────────────────────────────────────────────────────────── */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function dealCardAnimated(card, containerEl, faceDown = false, isActive = true) {
  const el = createCardElement(card, faceDown);
  el.classList.add('dealing');
  if (isActive) el.classList.add('active-card');
  containerEl.appendChild(el);
  playSound('deal');
  await delay(state.level === 3 ? 680 : state.level === 2 ? 560 : state.level === 0 ? 340 : 420);
  el.classList.remove('dealing');
  return el;
}

async function flipCard(wrapper, card) {
  playSound('flip');
  const back = wrapper.querySelector('.card-back-el');
  back.innerHTML = CARD_BACKS[state.level](72, 100); // re-render current level back before flip
  wrapper.classList.add('flipping');
  wrapper.classList.remove('face-down');
  await delay(520);
  wrapper.classList.remove('flipping');
}

/* ──────────────────────────────────────────────────────────────
   LEVEL SYSTEM
   ────────────────────────────────────────────────────────────── */
function getLevel(bankroll) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (bankroll >= LEVELS[i].min) return i;
  }
  return 0;
}

function applyLevelTheme(lvl) {
  const game = document.getElementById('game');
  game.classList.remove('level-0','level-1','level-2','level-3');
  game.classList.add('level-' + lvl);

  document.getElementById('level-display').textContent   = LEVELS[lvl].name;
  document.getElementById('bet-limits-display').textContent =
    `Min $${LEVELS[lvl].betMin.toLocaleString()}`;

  renderChips();
  startAmbient(lvl);
  updateLevelProgress();

  // Penthouse particles
  if (lvl === 3) startParticles();
  else           stopParticles();
}

async function checkAndTransitionLevel() {
  const newLvl = getLevel(state.bankroll);
  if (newLvl === state.level) return;
  const rising  = newLvl > state.level;
  const oldLvl  = state.level;
  state.level   = newLvl;

  await runLevelTransition(oldLvl, newLvl, rising);
  applyLevelTheme(newLvl);
}

async function runLevelTransition(oldLvl, newLvl, rising) {
  return new Promise(resolve => {
    const overlay   = document.getElementById('transition-overlay');
    const dirLabel  = document.getElementById('transition-direction-label');
    const textEl    = document.getElementById('transition-text');

    let narrative = '';
    if (rising) {
      const key = `${oldLvl}-${newLvl}`;
      narrative = RISE_NARRATIVES[key] || `"Your fortunes have changed. The next table awaits."`;
      dirLabel.textContent = '▲ Rising';
      dirLabel.style.color = '#7acc6e';
    } else {
      if (newLvl === 0) {
        narrative = RISE_NARRATIVES['fall-0'];
      } else {
        narrative = RISE_NARRATIVES['fall-any'];
      }
      dirLabel.textContent = '▼ Falling';
      dirLabel.style.color = '#cc6e6e';
    }

    textEl.textContent = narrative;
    playTransitionSound(rising);

    overlay.classList.add('active');

    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.classList.add('fading-out');
      setTimeout(() => {
        overlay.classList.remove('fading-out');
        resolve();
      }, 600);
    }, 3200);
  });
}

/* ──────────────────────────────────────────────────────────────
   PARTICLES (Penthouse)
   ────────────────────────────────────────────────────────────── */
let _particleInterval = null;
function startParticles() {
  stopParticles();
  const container = document.getElementById('particles-container');
  _particleInterval = setInterval(() => {
    const p = document.createElement('div');
    p.className = 'particle';
    const startX = Math.random() * 100;
    const startY = 100 + Math.random() * 20;
    const dx = (Math.random() - 0.5) * 80;
    const dy = -(80 + Math.random() * 120);
    const dur = 4 + Math.random() * 5;
    p.style.cssText = `
      left: ${startX}%; top: ${startY}%;
      --px: ${dx}px; --py: ${dy}px;
      animation-duration: ${dur}s;
      width: ${1 + Math.random() * 2}px;
      height: ${1 + Math.random() * 2}px;
      background: rgba(${200+Math.random()*55}, ${200+Math.random()*55}, ${220+Math.random()*35}, ${0.4+Math.random()*0.3});
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), dur * 1000);
  }, 600);
}

function stopParticles() {
  if (_particleInterval) { clearInterval(_particleInterval); _particleInterval = null; }
  document.getElementById('particles-container').innerHTML = '';
}

function burstParticles() {
  const container = document.getElementById('particles-container');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (i / 30) * Math.PI * 2;
    const dist  = 60 + Math.random() * 80;
    p.style.cssText = `
      left: 50%; top: 50%;
      --px: ${Math.cos(angle) * dist}px; --py: ${Math.sin(angle) * dist}px;
      animation-duration: ${0.8 + Math.random() * 0.6}s;
      width: ${2 + Math.random() * 3}px; height: ${2 + Math.random() * 3}px;
      background: rgba(220,220,160,0.8);
    `;
    container.appendChild(p);
    setTimeout(() => p.remove(), 1400);
  }
}

/* ──────────────────────────────────────────────────────────────
   BETTING UI
   ────────────────────────────────────────────────────────────── */
function fmtChip(n) {
  if (n >= 1000000) return '$' + (n / 1000000) + 'M';
  if (n >= 1000)    return '$' + (n / 1000) + 'K';
  return '$' + n;
}

function renderChips() {
  const selector = document.getElementById('chip-selector');
  selector.innerHTML = '';
  const lvl = LEVELS[state.level];
  lvl.chips.forEach((denom, idx) => {
    const btn = document.createElement('button');
    btn.className = 'chip-btn';
    btn.dataset.denom = denom;
    btn.setAttribute('aria-label', `Bet $${denom}`);
    btn.innerHTML = `<span>${fmtChip(denom)}</span>`;
    btn.title = `Add $${denom} to bet (Key: ${idx+1})`;
    btn.addEventListener('click', () => placeBet(denom));
    selector.appendChild(btn);
  });

  // Insurance chip row
  const iRow = document.getElementById('insurance-chip-row');
  iRow.innerHTML = '';
  lvl.chips.forEach(denom => {
    const btn = document.createElement('button');
    btn.className = 'chip-btn';
    btn.dataset.denom = denom;
    btn.innerHTML = `<span>${fmtChip(denom)}</span>`;
    btn.addEventListener('click', () => addInsuranceBet(denom));
    iRow.appendChild(btn);
  });
}

function placeBet(amount) {
  if (state.phase !== 'betting') return;
  const lvl = LEVELS[state.level];
  if (state.bankroll - state.currentBet - amount < 0) return;

  state.betStack.push(amount);
  state.currentBet += amount;
  playSound('chip');
  renderBetStack();
  updateBetDisplay();
  document.getElementById('btn-deal').disabled = state.currentBet < lvl.betMin;
}

function clearBet() {
  if (state.phase !== 'betting') return;
  state.betStack  = [];
  state.currentBet = 0;
  renderBetStack();
  updateBetDisplay();
  document.getElementById('btn-deal').disabled = true;
}

function allIn() {
  if (state.phase !== 'betting') return;
  const lvl    = LEVELS[state.level];
  const amount = state.bankroll;
  if (amount <= 0) return;
  // Clear existing bet first, then place all-in as a single stack entry
  state.betStack   = [amount];
  state.currentBet = amount;
  playSound('chip');
  renderBetStack();
  updateBetDisplay();
  document.getElementById('btn-deal').disabled = false;
}

function renderBetStack() {
  const visual = document.getElementById('bet-stack-visual');
  visual.innerHTML = '';
  state.betStack.forEach(denom => {
    const chip = document.createElement('div');
    chip.className = 'bet-chip';
    chip.style.background = CHIP_COLORS[denom] || '#444';
    visual.appendChild(chip);
  });
  document.getElementById('betting-circle').classList.toggle('has-bet', state.currentBet > 0);
}

function updateBetDisplay() {
  document.getElementById('bet-amount').textContent =
    '$' + state.currentBet.toLocaleString();
}

// Click betting circle = remove top chip
document.getElementById('betting-circle').addEventListener('click', () => {
  if (state.phase !== 'betting' || state.betStack.length === 0) return;
  const removed = state.betStack.pop();
  state.currentBet -= removed;
  renderBetStack();
  updateBetDisplay();
  const lvl = LEVELS[state.level];
  document.getElementById('btn-deal').disabled = state.currentBet < lvl.betMin;
});

/* ──────────────────────────────────────────────────────────────
   GAME STATE MACHINE
   ────────────────────────────────────────────────────────────── */
function setPhase(phase) {
  state.phase = phase;
  const game = document.getElementById('game');
  game.classList.remove('phase-betting','phase-playing','phase-split','phase-dealer','phase-complete','phase-insurance');
  game.classList.add('phase-' + phase);
}

async function startDeal() {
  if (state.phase !== 'betting') return;
  const lvl = LEVELS[state.level];
  if (state.currentBet < lvl.betMin) return;
  if (state.currentBet > state.bankroll) return;

  // Check if reshuffle needed
  if (state.shoeIndex >= state.cutCardPos) {
    await showShuffleNotifAsync();
    reshuffleShoe();
  }

  // Deduct bet
  state.bankroll -= state.currentBet;
  updateBankrollDisplay();

  // Setup hands
  state.playerHands = [{ cards: [], bet: state.currentBet, done: false, fromSplit: false, result: null }];
  state.activeHandIdx = 0;
  state.dealerCards   = [];
  state.dealerRevealDone = false;

  // Clear table
  clearTableDOM();
  setPhase('playing');
  clearResult();

  // Initial deal: p1, d1, p2, d2 (hole)
  const ph = state.playerHands[0];
  ph.cards.push(drawCard());
  await dealCardAnimated(ph.cards[0], getPlayerHandContainer(0), false);

  state.dealerCards.push(drawCard());
  await dealCardAnimated(state.dealerCards[0], document.getElementById('dealer-cards'), false);

  ph.cards.push(drawCard());
  await dealCardAnimated(ph.cards[1], getPlayerHandContainer(0), false);

  state.dealerCards.push(drawCard());
  const holeEl = await dealCardAnimated(state.dealerCards[1], document.getElementById('dealer-cards'), true);
  holeEl.dataset.hole = '1';

  updateShoeBar();
  updateHandValues();
  updateDealerValue(true);

  // Check insurance
  if (state.dealerCards[0].rank === 'A') {
    await askInsurance();
    return;
  }

  // Check player or dealer blackjack
  await checkImmediateBlackjack();
}

function clearTableDOM() {
  document.getElementById('dealer-cards').innerHTML = '';
  document.getElementById('player-hands-container').innerHTML = '';
  renderPlayerHands();
}

function renderPlayerHands() {
  const container = document.getElementById('player-hands-container');
  container.innerHTML = '';
  state.playerHands.forEach((hand, idx) => {
    const handDiv = document.createElement('div');
    handDiv.className = 'player-hand' + (idx === state.activeHandIdx ? '' : ' inactive');
    handDiv.id = `player-hand-${idx}`;

    const label = document.createElement('div');
    label.className = 'area-label';
    label.textContent = state.playerHands.length > 1 ? `Hand ${idx+1}` : 'Player';
    handDiv.appendChild(label);

    const cardsRow = document.createElement('div');
    cardsRow.className = 'cards-row';
    cardsRow.id = `player-cards-${idx}`;
    handDiv.appendChild(cardsRow);

    const valEl = document.createElement('div');
    valEl.className = 'hand-value';
    valEl.id = `player-value-${idx}`;
    handDiv.appendChild(valEl);

    container.appendChild(handDiv);
  });
}

function getPlayerHandContainer(idx) {
  return document.getElementById('player-cards-' + idx);
}

async function checkImmediateBlackjack() {
  const ph  = state.playerHands[0];
  const pBJ = isBlackjack(ph.cards);
  const dBJ = isBlackjack(state.dealerCards);

  if (pBJ || dBJ) {
    // Reveal hole card
    await revealHoleCard();
    if (pBJ && dBJ) {
      await resolveHand(state.playerHands[0], 'push');
    } else if (pBJ) {
      playSound('blackjack');
      if (state.level === 3) burstParticles();
      await resolveHand(state.playerHands[0], 'blackjack');
    } else {
      await resolveHand(state.playerHands[0], 'lose');
    }
    await finishRound();
    return;
  }

  updateActionButtons();
}

/* ──────────────────────────────────────────────────────────────
   INSURANCE
   ────────────────────────────────────────────────────────────── */
async function askInsurance() {
  state.insuranceBet    = 0;
  state.insuranceMaxBet = Math.floor(state.currentBet / 2);
  const overlay = document.getElementById('insurance-overlay');
  document.getElementById('insurance-desc').textContent =
    `Dealer shows an Ace. Buy insurance up to $${state.insuranceMaxBet}.`;
  document.getElementById('insurance-amount-display').textContent = '$0';
  setPhase('insurance');
  overlay.classList.add('active');
}

function addInsuranceBet(amount) {
  if (state.insuranceBet + amount > state.insuranceMaxBet) return;
  if (state.bankroll - amount < 0) return;
  state.insuranceBet += amount;
  document.getElementById('insurance-amount-display').textContent = '$' + state.insuranceBet;
}

async function acceptInsurance() {
  const overlay = document.getElementById('insurance-overlay');
  overlay.classList.remove('active');
  if (state.insuranceBet > 0) {
    state.bankroll -= state.insuranceBet;
    updateBankrollDisplay();
  }
  setPhase('playing');
  await checkImmediateBlackjack();
  // If dealer has BJ, resolve insurance payout
  if (isBlackjack(state.dealerCards) && state.insuranceBet > 0) {
    // Insurance pays 2:1 — already handled in resolveHand
  }
}

async function declineInsurance() {
  const overlay = document.getElementById('insurance-overlay');
  overlay.classList.remove('active');
  state.insuranceBet = 0;
  setPhase('playing');
  await checkImmediateBlackjack();
}

/* ──────────────────────────────────────────────────────────────
   PLAYER ACTIONS
   ────────────────────────────────────────────────────────────── */
async function hit() {
  if (state.phase !== 'playing' && state.phase !== 'split') return;
  const hand = state.playerHands[state.activeHandIdx];
  if (hand.done) return;

  // Split aces only get 1 card
  if (hand.fromSplit && hand.cards[0].rank === 'A' && hand.cards.length >= 2) return;

  const card = drawCard();
  hand.cards.push(card);
  await dealCardAnimated(card, getPlayerHandContainer(state.activeHandIdx), false);
  updateShoeBar();
  updateHandValues();

  const { value } = getHandValue(hand.cards);
  if (value > 21) {
    // Bust
    playSound('bust');
    hand.done   = true;
    hand.result = 'bust';
    markHandResult(state.activeHandIdx, 'bust');
    await advanceActiveHand();
  } else if (value === 21) {
    // Auto-stand on 21
    await stand();
  } else {
    updateActionButtons();
  }
}

async function stand() {
  if (state.phase !== 'playing' && state.phase !== 'split') return;
  const hand = state.playerHands[state.activeHandIdx];
  hand.done = true;
  await advanceActiveHand();
}

async function doubleDown() {
  if (state.phase !== 'playing') return;
  const hand = state.playerHands[state.activeHandIdx];
  if (hand.cards.length !== 2) return;
  if (state.bankroll < hand.bet) return;

  state.bankroll -= hand.bet;
  hand.bet       *= 2;
  updateBankrollDisplay();

  const card = drawCard();
  hand.cards.push(card);
  await dealCardAnimated(card, getPlayerHandContainer(state.activeHandIdx), false);
  updateShoeBar();
  updateHandValues();
  hand.done = true;

  const { value } = getHandValue(hand.cards);
  if (value > 21) {
    hand.result = 'bust';
    markHandResult(state.activeHandIdx, 'bust');
    playSound('bust');
  }

  await advanceActiveHand();
}

async function splitHand() {
  if (state.phase !== 'playing') return;
  const hand = state.playerHands[state.activeHandIdx];
  if (hand.cards.length !== 2) return;
  if (hand.cards[0].value !== hand.cards[1].value) return;
  if (state.bankroll < hand.bet) return;
  if (state.playerHands.length >= 4) return;

  state.bankroll -= hand.bet;
  updateBankrollDisplay();

  // Create new hand from second card
  const splitCard = hand.cards.splice(1, 1)[0];
  const newHand   = { cards: [splitCard], bet: hand.bet, done: false, fromSplit: true, result: null };
  hand.fromSplit  = true;

  // Insert new hand after active
  state.playerHands.splice(state.activeHandIdx + 1, 0, newHand);

  // Re-render DOM
  renderPlayerHands();
  // Re-add existing cards visually
  for (let hi = 0; hi < state.playerHands.length; hi++) {
    const hnd = state.playerHands[hi];
    const cont = getPlayerHandContainer(hi);
    hnd.cards.forEach(card => {
      const el = createCardElement(card, false);
      cont.appendChild(el);
    });
  }

  // Deal one card to current hand
  const card1 = drawCard();
  state.playerHands[state.activeHandIdx].cards.push(card1);
  await dealCardAnimated(card1, getPlayerHandContainer(state.activeHandIdx), false);

  updateHandValues();
  updateShoeBar();
  setPhase('split');
  updateActionButtons();

  // Check if split aces
  const currHand = state.playerHands[state.activeHandIdx];
  if (currHand.cards[0].rank === 'A' && currHand.cards.length === 2) {
    // Only 1 card allowed per ace hand
    currHand.done = true;
    await advanceActiveHand();
  }
}

async function advanceActiveHand() {
  // Mark current hand done
  state.playerHands[state.activeHandIdx].done = true;
  updateHighlightedHand();

  // Find next undone hand
  let next = -1;
  for (let i = state.activeHandIdx + 1; i < state.playerHands.length; i++) {
    if (!state.playerHands[i].done) { next = i; break; }
  }

  if (next !== -1) {
    state.activeHandIdx = next;
    updateHighlightedHand();

    // Deal card to next split hand if only 1 card
    const nextHand = state.playerHands[next];
    if (nextHand.fromSplit && nextHand.cards.length === 1) {
      const card = drawCard();
      nextHand.cards.push(card);
      await dealCardAnimated(card, getPlayerHandContainer(next), false);
      updateShoeBar();
      updateHandValues();

      // Ace split — only 1 card
      if (nextHand.cards[0].rank === 'A') {
        nextHand.done = true;
        await advanceActiveHand();
        return;
      }
    }
    updateActionButtons();
  } else {
    // All hands done — dealer's turn
    await runDealerTurn();
  }
}

function updateHighlightedHand() {
  state.playerHands.forEach((_, i) => {
    const div = document.getElementById(`player-hand-${i}`);
    if (!div) return;
    div.classList.toggle('inactive', i !== state.activeHandIdx);
  });
}

/* ──────────────────────────────────────────────────────────────
   DEALER TURN
   ────────────────────────────────────────────────────────────── */
async function runDealerTurn() {
  setPhase('dealer');
  await revealHoleCard();

  let { value } = getHandValue(state.dealerCards);
  updateDealerValue(false);

  while (value < 17) {
    await delay(600);
    const card = drawCard();
    state.dealerCards.push(card);
    await dealCardAnimated(card, document.getElementById('dealer-cards'), false);
    updateShoeBar();
    const hv = getHandValue(state.dealerCards);
    value = hv.value;
    updateDealerValue(false);
  }

  await delay(300);
  await resolveAllHands();
  await finishRound();
}

async function revealHoleCard() {
  if (state.dealerRevealDone) return;
  state.dealerRevealDone = true;
  const holeWrapper = document.querySelector('[data-hole="1"]');
  if (holeWrapper) {
    await flipCard(holeWrapper, state.dealerCards[1]);
  }
  updateDealerValue(false);
}

function updateDealerValue(hideHole) {
  const el = document.getElementById('dealer-value');
  if (hideHole) {
    const { value } = getHandValue([state.dealerCards[0]]);
    el.textContent = value;
  } else {
    const { value, soft } = getHandValue(state.dealerCards);
    el.textContent = value > 21 ? `${value} (Bust)` : (soft ? `Soft ${value}` : value);
    el.classList.toggle('bust', value > 21);
    el.classList.toggle('soft', soft && value <= 21);
  }
}

/* ──────────────────────────────────────────────────────────────
   RESOLUTION
   ────────────────────────────────────────────────────────────── */
async function resolveAllHands() {
  const dval = getHandValue(state.dealerCards).value;
  const dBJ  = isBlackjack(state.dealerCards);

  for (let i = 0; i < state.playerHands.length; i++) {
    const hand = state.playerHands[i];
    if (hand.result === 'bust') continue; // already resolved

    const { value: pval } = getHandValue(hand.cards);
    const pBJ = isBlackjack(hand.cards) && !hand.fromSplit;

    let outcome;
    if (pBJ && dBJ)          outcome = 'push';
    else if (pBJ)            outcome = 'blackjack';
    else if (dBJ)            outcome = 'lose';
    else if (dval > 21)      outcome = 'win';
    else if (pval > dval)    outcome = 'win';
    else if (pval < dval)    outcome = 'lose';
    else                     outcome = 'push';

    hand.result = outcome;
    await resolveHand(hand, outcome);
    markHandResult(i, outcome);
    await delay(200);
  }
}

async function resolveHand(hand, outcome) {
  let delta = 0;
  if (outcome === 'blackjack') {
    delta = Math.floor(hand.bet * 1.5);
    state.bankroll += hand.bet + delta;
    playSound('blackjack');
  } else if (outcome === 'win') {
    delta = hand.bet;
    state.bankroll += hand.bet * 2;
    playSound('win');
  } else if (outcome === 'push') {
    delta = 0;
    state.bankroll += hand.bet;
    playSound('push');
  } else { // lose / bust
    delta = -hand.bet;
    playSound('lose');
  }

  // Insurance payout (if relevant)
  if (outcome === 'lose' || outcome === 'bust') {
    if (state.insuranceBet > 0 && isBlackjack(state.dealerCards)) {
      state.bankroll += state.insuranceBet * 3; // 2:1 payout (bet returned + 2×)
    }
    // If insurance placed but dealer didn't BJ — already deducted
  } else if (state.insuranceBet > 0 && !isBlackjack(state.dealerCards)) {
    // insurance already lost (deducted on accept)
  }

  updateBankrollDisplay();
  return delta;
}

async function resolveRound() {
  // Show combined result
  const allResults = state.playerHands.map(h => h.result);
  let primary = allResults.includes('blackjack') ? 'blackjack'
              : allResults.every(r => r === 'push') ? 'push'
              : allResults.some(r => r === 'win' || r === 'blackjack') ? 'win'
              : allResults.every(r => r === 'lose' || r === 'bust') ? 'lose'
              : 'push';

  const LABELS = {
    blackjack: 'Blackjack! 🃏',
    win:  'You Win!',
    lose: 'Dealer Wins',
    push: 'Push',
    bust: 'Bust',
  };
  showResult(LABELS[primary] || primary, primary);
  updateStats(primary);
}

async function finishRound() {
  await resolveRound();
  await checkAndTransitionLevel();
  updateBankrollDisplay();

  if (state.bankroll <= 0) {
    await delay(800);
    setPhase('complete');
    showGameOver();
    return;
  }

  setPhase('complete');
  document.getElementById('btn-deal').disabled = false;
  document.getElementById('btn-deal').textContent = 'New Hand D';
}

function markHandResult(idx, outcome) {
  const handDiv = document.getElementById(`player-hand-${idx}`);
  if (!handDiv) return;
  handDiv.classList.add('done', outcome === 'win' || outcome === 'blackjack' ? 'win' : outcome);

  // Remove old badge
  const old = handDiv.querySelector('.hand-result-badge');
  if (old) old.remove();

  const badge = document.createElement('div');
  const LABELS = { blackjack:'BJ!', win:'Win', lose:'Lose', push:'Push', bust:'Bust' };
  badge.className = `hand-result-badge ${outcome === 'blackjack' ? 'bj' : outcome}`;
  badge.textContent = LABELS[outcome] || outcome;
  handDiv.appendChild(badge);
}

/* ──────────────────────────────────────────────────────────────
   DISPLAY HELPERS
   ────────────────────────────────────────────────────────────── */
function updateBankrollDisplay() {
  document.getElementById('bankroll-display').textContent =
    '$' + state.bankroll.toLocaleString();
  if (state.bankroll > state.stats.peakBankroll) {
    state.stats.peakBankroll = state.bankroll;
  }
  updateLevelProgress();
}

function updateLevelProgress() {
  const lvl     = state.level;
  const current = LEVELS[lvl];
  const game    = document.getElementById('game');

  if (lvl >= LEVELS.length - 1) {
    // Max level — hide the bar
    game.classList.add('at-max-level');
    return;
  }
  game.classList.remove('at-max-level');

  const next      = LEVELS[lvl + 1];
  const rangeSize = next.min - current.min;
  const progress  = Math.min(1, (state.bankroll - current.min) / rangeSize);
  const pct       = Math.max(0, Math.round(progress * 100));

  document.getElementById('level-fill').style.width = pct + '%';

  const needed = next.min - state.bankroll;
  const label  = document.getElementById('level-progress-amt');
  if (needed <= 0) {
    label.textContent = '✓';
  } else {
    label.textContent = needed >= 1000
      ? '$' + (needed / 1000).toFixed(0) + 'K needed'
      : '$' + needed + ' needed';
  }
}

function showBankrollDelta(delta) {
  const el = document.getElementById('bankroll-delta');
  el.textContent = (delta >= 0 ? '+' : '') + '$' + delta.toLocaleString();
  el.className   = 'bankroll-delta show ' + (delta >= 0 ? 'positive' : 'negative');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.classList.remove('show'); }, 2200);
}

function updateHandValues() {
  state.playerHands.forEach((hand, i) => {
    const el = document.getElementById(`player-value-${i}`);
    if (!el) return;
    const { value, soft } = getHandValue(hand.cards);
    el.textContent = soft ? `Soft ${value}` : value;
    el.classList.toggle('bust', value > 21);
    el.classList.toggle('soft', soft && value <= 21);
  });
}

function updateDealerValueEl(hideHole) {
  updateDealerValue(hideHole);
}

function showResult(msg, type) {
  const el = document.getElementById('result-display');
  el.textContent = msg;
  el.className   = 'result-display ' + (type || '');
}

function clearResult() {
  const el = document.getElementById('result-display');
  el.textContent = '';
  el.className   = 'result-display';
}

function updateActionButtons() {
  const hand = state.playerHands[state.activeHandIdx];
  if (!hand) return;
  const { value } = getHandValue(hand.cards);
  const lvl       = LEVELS[state.level];

  const canDouble = hand.cards.length === 2 && state.bankroll >= hand.bet;
  const canSplit  = hand.cards.length === 2
    && hand.cards[0].value === hand.cards[1].value
    && state.bankroll >= hand.bet
    && state.playerHands.length < 4;

  document.getElementById('btn-double').disabled = !canDouble;
  document.getElementById('btn-split').disabled  = !canSplit;
  document.getElementById('btn-hit').disabled    = false;
  document.getElementById('btn-stand').disabled  = false;
}

/* ──────────────────────────────────────────────────────────────
   STATISTICS
   ────────────────────────────────────────────────────────────── */
function updateStats(outcome) {
  const s = state.stats;
  s.handsPlayed++;

  if (outcome === 'win' || outcome === 'blackjack') {
    s.wins++;
    s.streakType === 'W' ? s.streak++ : (s.streak = 1, s.streakType = 'W');
    const winAmt = outcome === 'blackjack'
      ? Math.floor(state.currentBet * 1.5)
      : state.currentBet;
    if (winAmt > s.biggestWin) s.biggestWin = winAmt;
    showBankrollDelta(winAmt);
  } else if (outcome === 'lose' || outcome === 'bust') {
    s.losses++;
    s.streakType === 'L' ? s.streak++ : (s.streak = 1, s.streakType = 'L');
    showBankrollDelta(-state.currentBet);
  } else if (outcome === 'push') {
    s.pushes++;
    s.streak = 0; s.streakType = '';
  }

  const total = s.wins + s.losses + s.pushes;
  const pct   = total > 0 ? Math.round(s.wins / total * 100) : 0;

  document.getElementById('stat-wlp').textContent = `W:${s.wins} L:${s.losses} P:${s.pushes}`;
  document.getElementById('stat-winpct').textContent = `Win ${pct}%`;
  document.getElementById('stat-streak').textContent =
    s.streak > 0 ? `${s.streak}${s.streakType}` : '—';
  document.getElementById('stat-bigwin').textContent  = `Best: $${s.biggestWin.toLocaleString()}`;
  document.getElementById('stat-peak').textContent    = `Peak: $${s.peakBankroll.toLocaleString()}`;
}

/* ──────────────────────────────────────────────────────────────
   NEW HAND / GAME FLOW
   ────────────────────────────────────────────────────────────── */
async function newHand() {
  // Allow from title, complete, or betting phases only — never interrupt active play
  const blocked = ['playing','split','dealer','insurance'];
  if (blocked.includes(state.phase)) return;
  // Reset bet for new hand
  state.betStack   = [];
  state.currentBet = 0;
  state.insuranceBet = 0;
  renderBetStack();
  updateBetDisplay();
  document.getElementById('btn-deal').disabled = true;
  document.getElementById('btn-deal').textContent = 'Deal D';
  clearResult();
  clearTableDOM();
  setPhase('betting');
}

function showGameOver() {
  if (state.bankroll > state.bestRun) state.bestRun = state.bankroll;
  const overlay = document.getElementById('game-over-overlay');
  const bestEl  = document.getElementById('gameover-best-run');
  bestEl.textContent = state.bestRun > 100
    ? `Best run: $${state.bestRun.toLocaleString()}`
    : '';
  overlay.classList.add('active');
}

function startOver() {
  if (state.bankroll > state.bestRun) state.bestRun = state.bankroll;
  const overlay = document.getElementById('game-over-overlay');
  overlay.classList.remove('active');

  state.bankroll = 10000;
  state.level    = 0;
  state.stats    = { wins:0, losses:0, pushes:0, streak:0, streakType:'', biggestWin:0, peakBankroll:10000 };
  state.shoe     = buildShoe();
  state.shoeIndex = 0;
  state.cutCardPos = Math.floor(state.shoe.length * 0.75);

  applyLevelTheme(0);
  updateBankrollDisplay();
  updateShoeBar();
  newHand();
}

/* ──────────────────────────────────────────────────────────────
   SHUFFLE NOTIFICATION
   ────────────────────────────────────────────────────────────── */
function showShuffleNotif() {
  const el = document.getElementById('shuffle-notif');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

async function showShuffleNotifAsync() {
  showShuffleNotif();
  await delay(1800);
}

/* ──────────────────────────────────────────────────────────────
   KEYBOARD SHORTCUTS
   ────────────────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const key = e.key.toUpperCase();

  switch(key) {
    case 'M': toggleMute(); break;

    case 'H':
      if (state.phase === 'playing' || state.phase === 'split') hit();
      break;

    case 'S':
      if (state.phase === 'playing' || state.phase === 'split') stand();
      break;

    case 'D':
      if (state.phase === 'playing') doubleDown();
      else if (state.phase === 'betting' && state.currentBet >= LEVELS[state.level].betMin) startDeal();
      else if (state.phase === 'complete') newHand();
      break;

    case '1': case '2': case '3': {
      if (state.phase !== 'betting') break;
      const idx   = parseInt(key) - 1;
      const chips = LEVELS[state.level].chips;
      if (chips[idx]) placeBet(chips[idx]);
      break;
    }

    case 'C':
      if (state.phase === 'betting') clearBet();
      break;

    case 'ESCAPE':
      if (state.phase === 'insurance') declineInsurance();
      break;

    case 'ENTER':
      if (state.phase === 'insurance') acceptInsurance();
      else if (state.phase === 'betting' && state.currentBet >= LEVELS[state.level].betMin) startDeal();
      else if (state.phase === 'complete') newHand();
      break;
  }
});

/* ──────────────────────────────────────────────────────────────
   EVENT LISTENERS (buttons)
   ────────────────────────────────────────────────────────────── */
document.getElementById('btn-sit-down').addEventListener('click', () => {
  initAudio();
  const titleScreen = document.getElementById('title-screen');
  titleScreen.classList.add('fading-out');
  setTimeout(() => {
    titleScreen.classList.remove('active', 'fading-out');
    applyLevelTheme(state.level);
    newHand();
  }, 600);
});

document.getElementById('btn-deal').addEventListener('click', () => {
  if (state.phase === 'complete') newHand();
  else startDeal();
});

document.getElementById('btn-hit').addEventListener('click',    hit);
document.getElementById('btn-stand').addEventListener('click',  stand);
document.getElementById('btn-double').addEventListener('click', doubleDown);
document.getElementById('btn-split').addEventListener('click',  splitHand);
document.getElementById('btn-clear').addEventListener('click',   clearBet);
document.getElementById('btn-all-in').addEventListener('click',  allIn);
document.getElementById('mute-btn').addEventListener('click',   toggleMute);

document.getElementById('btn-start-over').addEventListener('click',       startOver);
document.getElementById('btn-insurance-accept').addEventListener('click',  acceptInsurance);
document.getElementById('btn-insurance-decline').addEventListener('click', declineInsurance);

/* ──────────────────────────────────────────────────────────────
   INIT
   ────────────────────────────────────────────────────────────── */
function init() {
  // Build shoe
  state.shoe        = buildShoe();
  state.shoeIndex   = 0;
  state.cutCardPos  = Math.floor(state.shoe.length * 0.75);

  // Apply default level theme to game container (before title dismissed)
  document.getElementById('game').classList.add('level-0');

  // Render chips
  renderChips();

  // Stats
  document.getElementById('stat-wlp').textContent = 'W:0 L:0 P:0';
  document.getElementById('bankroll-display').textContent = '$10,000';
  updateShoeBar();

  // Phase: title (overlays are shown by CSS .active)
  // Game stays behind, title screen overlay on top
  document.getElementById('game').classList.add('phase-betting');
}

init();
