/* ============================================================
   Operation Readable — script.js
   V.I.A. Decryption Terminal — WCAG Contrast Explorer
   ============================================================ */

'use strict';

// ── Intercepted Messages ─────────────────────────────────────
const MESSAGES = [
  'The asset will arrive at checkpoint BRAVO at 0300 hours. Confirm receipt of package ECHO-7. Do not reply on unsecured channels.',
  'PRIORITY — Operative FALCON has secured the documents. Extraction window closes at dawn. Ensure visibility protocol is active.',
  'All agents: verify your display terminals meet Field Readability Protocol before transmitting. Non-compliant channels will be terminated.',
  'Decoded intercept from SECTOR 9: The lighthouse signal changes at midnight. Adjust frequency to match new parameters.',
];

let msgIndex = 0;

// ── Preset Color Schemes ─────────────────────────────────────
const PRESETS = {
  'high-security':       { bg: [255, 255, 255], tx: [0,   0,   0  ] },
  'foggy-intercept':     { bg: [119, 119, 119], tx: [153, 153, 153] },
  'agency-standard':     { bg: [26,  26,  46 ], tx: [224, 224, 224] },
  'compromised-channel': { bg: [255, 253, 231], tx: [255, 249, 196] },
  'dark-ops':            { bg: [13,  13,  13 ], tx: [0,   255, 65 ] },
  'embassy-cable':       { bg: [245, 245, 220], tx: [51,  51,  51 ] },
};

// ── Color Vision Deficiency Matrices (Viénot 1999) ───────────
// Applied to linearized sRGB values (0–1 range)
const CVD_MATRICES = {
  protanopia: [
    [0.56667, 0.43333, 0.00000],
    [0.55833, 0.44167, 0.00000],
    [0.00000, 0.24167, 0.75833],
  ],
  deuteranopia: [
    [0.62500, 0.37500, 0.00000],
    [0.70000, 0.30000, 0.00000],
    [0.00000, 0.30000, 0.70000],
  ],
  tritanopia: [
    [0.95000, 0.05000, 0.00000],
    [0.00000, 0.43333, 0.56667],
    [0.00000, 0.47500, 0.52500],
  ],
};

// ============================================================
// WCAG Math
// ============================================================

/** sRGB channel (0–255) → linear light (0–1) */
function toLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Linear light (0–1) → sRGB channel (0–1) */
function toGamma(linear) {
  const c = Math.max(0, Math.min(1, linear));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/** Relative luminance per WCAG 2.1 */
function relativeLuminance(r, g, b) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** WCAG contrast ratio from two luminance values */
function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Apply a 3×3 CVD matrix to an RGB triplet.
 * Input/output: [R, G, B] as 0–255 integers.
 */
function applyCVDMatrix(r, g, b, matrix) {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const ro = matrix[0][0] * lr + matrix[0][1] * lg + matrix[0][2] * lb;
  const go = matrix[1][0] * lr + matrix[1][1] * lg + matrix[1][2] * lb;
  const bo = matrix[2][0] * lr + matrix[2][1] * lg + matrix[2][2] * lb;
  return [
    Math.round(toGamma(ro) * 255),
    Math.round(toGamma(go) * 255),
    Math.round(toGamma(bo) * 255),
  ];
}

/** Grayscale (monochromacy) simulation via luminance weights */
function applyMonochromacy(r, g, b) {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const L = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  const v = Math.round(toGamma(L) * 255);
  return [v, v, v];
}

/**
 * Simulate how a color looks under a given vision type.
 * Returns [R, G, B] (0–255).
 */
function simulateColor(r, g, b, cipher) {
  if (cipher === 'normal')       return [r, g, b];
  if (cipher === 'monochromacy') return applyMonochromacy(r, g, b);
  if (CVD_MATRICES[cipher])      return applyCVDMatrix(r, g, b, CVD_MATRICES[cipher]);
  return [r, g, b];
}

// ============================================================
// App State
// ============================================================

const state = {
  bg:     [26, 26, 46],
  tx:     [224, 224, 224],
  size:   16,
  cipher: 'normal',
};

// ============================================================
// DOM References
// ============================================================

const $ = id => document.getElementById(id);

const dom = {
  // Sliders + number inputs
  bgR: $('bgR'), bgRNum: $('bgRNum'),
  bgG: $('bgG'), bgGNum: $('bgGNum'),
  bgB: $('bgB'), bgBNum: $('bgBNum'),
  txR: $('txR'), txRNum: $('txRNum'),
  txG: $('txG'), txGNum: $('txGNum'),
  txB: $('txB'), txBNum: $('txBNum'),
  fontSize:    $('fontSize'),
  fontSizeNum: $('fontSizeNum'),
  // Preview swatches
  bgPreview: $('bgPreview'),
  txPreview: $('txPreview'),
  // Terminal
  terminalScreen:  $('terminalScreen'),
  interceptedText: $('interceptedText'),
  // Meters
  contrastRatio: $('contrastRatio'),
  gaugeFill:     $('gaugeFill'),
  gaugeTrack:    $('gaugeTrack'),
  bgLuminance:   $('bgLuminance'),
  txLuminance:   $('txLuminance'),
  // Compliance
  badgeStandard:  $('badge-standard'),
  badgePriority:  $('badge-priority'),
  statusStandard: $('status-standard'),
  statusPriority: $('status-priority'),
  approvedBanner: $('approvedBanner'),
  // Controls
  bgGroup:       $('bgGroup'),
  txGroup:       $('txGroup'),
  cipherLockMsg: $('cipherLockMsg'),
  presetSelect:  $('presetSelect'),
  rotateMsg:     $('rotateMsg'),
};

// All color sliders and number inputs that get locked during cipher
const lockableInputs = [
  dom.bgR, dom.bgG, dom.bgB, dom.txR, dom.txG, dom.txB,
  dom.bgRNum, dom.bgGNum, dom.bgBNum, dom.txRNum, dom.txGNum, dom.txBNum,
];

// ============================================================
// Render
// ============================================================

function render() {
  const [bgR, bgG, bgB] = state.bg;
  const [txR, txG, txB] = state.tx;
  const cipher = state.cipher;

  // Simulated colors (applied to terminal display + math)
  const simBg = simulateColor(bgR, bgG, bgB, cipher);
  const simTx = simulateColor(txR, txG, txB, cipher);

  const bgCss = `rgb(${simBg[0]},${simBg[1]},${simBg[2]})`;
  const txCss = `rgb(${simTx[0]},${simTx[1]},${simTx[2]})`;

  // Terminal
  dom.terminalScreen.style.backgroundColor = bgCss;
  dom.interceptedText.style.color = txCss;
  dom.interceptedText.style.fontSize = state.size + 'px';

  // Color swatches (always show actual, not simulated)
  dom.bgPreview.style.backgroundColor = `rgb(${bgR},${bgG},${bgB})`;
  dom.txPreview.style.backgroundColor = `rgb(${txR},${txG},${txB})`;

  // Luminance (computed from simulated colors)
  const bgLum = relativeLuminance(...simBg);
  const txLum = relativeLuminance(...simTx);
  dom.bgLuminance.textContent = bgLum.toFixed(4);
  dom.txLuminance.textContent = txLum.toFixed(4);

  // Contrast ratio
  const ratio = contrastRatio(bgLum, txLum);
  dom.contrastRatio.textContent = ratio.toFixed(2) + ':1';

  // Gauge fill (linear scale: 1 → 0%, 21 → 100%)
  const pct = Math.min(100, Math.max(0, (ratio - 1) / 20 * 100));
  dom.gaugeFill.style.width = pct + '%';
  dom.gaugeTrack.setAttribute('aria-valuenow', ratio.toFixed(2));

  // Color classes
  const tier = ratio >= 4.5 ? 'good' : ratio >= 3.0 ? 'ok' : 'poor';
  dom.gaugeFill.className    = `gauge-fill ${tier}`;
  dom.contrastRatio.className = `contrast-ratio ${tier}`;

  // Terminal glitch / decoded state
  dom.terminalScreen.classList.toggle('glitch',  ratio < 3.0);
  dom.terminalScreen.classList.toggle('decoded', ratio >= 4.5);

  // WCAG compliance badges
  const standardPass = ratio >= 4.5;
  const priorityPass = ratio >= 3.0;
  setBadge(dom.badgeStandard, dom.statusStandard, standardPass);
  setBadge(dom.badgePriority, dom.statusPriority, priorityPass);

  // Approved banner
  dom.approvedBanner.classList.toggle('visible', standardPass && priorityPass);

  // Sync aria-valuenow on all range inputs
  updateAriaValues();
}

function setBadge(badgeEl, statusEl, pass) {
  badgeEl.className = `compliance-badge ${pass ? 'pass' : 'fail'}`;
  statusEl.textContent = pass ? '\u2713 CLEARED' : '\u2717 BLOCKED';
}

function updateAriaValues() {
  dom.bgR.setAttribute('aria-valuenow', dom.bgR.value);
  dom.bgG.setAttribute('aria-valuenow', dom.bgG.value);
  dom.bgB.setAttribute('aria-valuenow', dom.bgB.value);
  dom.txR.setAttribute('aria-valuenow', dom.txR.value);
  dom.txG.setAttribute('aria-valuenow', dom.txG.value);
  dom.txB.setAttribute('aria-valuenow', dom.txB.value);
  dom.fontSize.setAttribute('aria-valuenow', dom.fontSize.value);
}

// ============================================================
// Slider fill (CSS custom property --fill)
// ============================================================

function updateSliderFill(rangeEl) {
  const pct = (rangeEl.value - rangeEl.min) / (rangeEl.max - rangeEl.min) * 100;
  rangeEl.style.setProperty('--fill', pct.toFixed(1) + '%');
}

function updateAllFills() {
  [dom.bgR, dom.bgG, dom.bgB, dom.txR, dom.txG, dom.txB, dom.fontSize].forEach(updateSliderFill);
}

// ============================================================
// Sync sliders ↔ inputs from state
// ============================================================

function syncAllFromState() {
  dom.bgR.value = state.bg[0]; dom.bgRNum.value = state.bg[0];
  dom.bgG.value = state.bg[1]; dom.bgGNum.value = state.bg[1];
  dom.bgB.value = state.bg[2]; dom.bgBNum.value = state.bg[2];
  dom.txR.value = state.tx[0]; dom.txRNum.value = state.tx[0];
  dom.txG.value = state.tx[1]; dom.txGNum.value = state.tx[1];
  dom.txB.value = state.tx[2]; dom.txBNum.value = state.tx[2];
  dom.fontSize.value    = state.size;
  dom.fontSizeNum.value = state.size;
  updateAllFills();
}

// ============================================================
// Input helpers
// ============================================================

function clamp(val, min, max) {
  const n = Math.round(Number(val));
  if (!isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

/**
 * Wire a range slider + number input pair to a state array slot.
 * onChange(value) is called after state is updated.
 */
function wireColorChannel(sliderId, numId, stateArr, idx) {
  const slider = dom[sliderId];
  const numInput = dom[numId];

  slider.addEventListener('input', () => {
    stateArr[idx] = parseInt(slider.value, 10);
    numInput.value = stateArr[idx];
    updateSliderFill(slider);
    render();
  });

  numInput.addEventListener('input', () => {
    const v = clamp(numInput.value, 0, 255);
    if (v === null) return;
    stateArr[idx] = v;
    slider.value  = v;
    numInput.value = v;
    updateSliderFill(slider);
    render();
  });

  // Clamp on blur in case user types out-of-range then tabs away
  numInput.addEventListener('blur', () => {
    const v = clamp(numInput.value, 0, 255) ?? stateArr[idx];
    stateArr[idx] = v;
    slider.value  = v;
    numInput.value = v;
    updateSliderFill(slider);
    render();
  });
}

// ============================================================
// Event Listeners
// ============================================================

// Background channels
wireColorChannel('bgR', 'bgRNum', state.bg, 0);
wireColorChannel('bgG', 'bgGNum', state.bg, 1);
wireColorChannel('bgB', 'bgBNum', state.bg, 2);

// Text channels
wireColorChannel('txR', 'txRNum', state.tx, 0);
wireColorChannel('txG', 'txGNum', state.tx, 1);
wireColorChannel('txB', 'txBNum', state.tx, 2);

// Font size
dom.fontSize.addEventListener('input', () => {
  state.size = parseInt(dom.fontSize.value, 10);
  dom.fontSizeNum.value = state.size;
  updateSliderFill(dom.fontSize);
  render();
});

dom.fontSizeNum.addEventListener('input', () => {
  const v = clamp(dom.fontSizeNum.value, 8, 72);
  if (v === null) return;
  state.size = v;
  dom.fontSize.value    = v;
  dom.fontSizeNum.value = v;
  updateSliderFill(dom.fontSize);
  render();
});

dom.fontSizeNum.addEventListener('blur', () => {
  const v = clamp(dom.fontSizeNum.value, 8, 72) ?? state.size;
  state.size = v;
  dom.fontSize.value    = v;
  dom.fontSizeNum.value = v;
  updateSliderFill(dom.fontSize);
  render();
});

// Cipher filter radios
document.querySelectorAll('input[name="cipher"]').forEach(radio => {
  radio.addEventListener('change', () => {
    state.cipher = radio.value;
    const isLocked = radio.value !== 'normal';

    lockableInputs.forEach(el => { el.disabled = isLocked; });
    dom.bgGroup.classList.toggle('locked', isLocked);
    dom.txGroup.classList.toggle('locked', isLocked);
    dom.cipherLockMsg.classList.toggle('visible', isLocked);

    render();
  });
});

// Preset select
dom.presetSelect.addEventListener('change', () => {
  const preset = PRESETS[dom.presetSelect.value];
  if (!preset) return;

  // Apply preset values
  state.bg = [...preset.bg];
  state.tx = [...preset.tx];

  // Reset cipher to Cleartext and unlock controls
  state.cipher = 'normal';
  document.querySelector('input[name="cipher"][value="normal"]').checked = true;
  lockableInputs.forEach(el => { el.disabled = false; });
  dom.bgGroup.classList.remove('locked');
  dom.txGroup.classList.remove('locked');
  dom.cipherLockMsg.classList.remove('visible');

  syncAllFromState();
  render();

  // Reset the dropdown label back to placeholder
  setTimeout(() => { dom.presetSelect.value = ''; }, 120);
});

// Rotate message
dom.rotateMsg.addEventListener('click', () => {
  msgIndex = (msgIndex + 1) % MESSAGES.length;
  dom.interceptedText.textContent = MESSAGES[msgIndex];
});

// ============================================================
// Initialise
// ============================================================

syncAllFromState();
render();
