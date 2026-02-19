// ============================================================
// RGB CHEF'S KITCHEN — Recipe Learn Mode
// ============================================================
'use strict';

// ---- State ----
let selectedPrimaries = ['r', 'g']; // two of 'r','g','b'
let wheelColor = { r: 200, g: 80, b: 20 };
let currentCVD = 'normal';

// ---- Open / Close ----
function openLearnMode() {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('learnMode').classList.remove('hidden');
  AudioManager.start();

  // Animate book opening
  const cover = document.getElementById('bookCover');
  const content = document.getElementById('bookContent');
  cover.classList.remove('opening');
  content.classList.add('hidden');

  setTimeout(() => {
    cover.classList.add('opening');
    setTimeout(() => {
      content.classList.remove('hidden');
      cover.style.display = 'none';
      initLearnMode();
    }, 850);
  }, 100);
}

function closeLearnMode() {
  AudioManager.stop();
  document.getElementById('learnMode').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
  document.getElementById('bookCover').style.display = '';
  document.getElementById('bookCover').classList.remove('opening');
  document.getElementById('bookContent').classList.add('hidden');
}

function initLearnMode() {
  switchTab('wheel');
  updateWheelColor();
  updateContrast();
  updatePalette();
  updateAccessiblePalette();
  renderCVDWheels();
}

// ============================================================
// TAB NAVIGATION
// ============================================================
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active', b.getAttribute('onclick') === `switchTab('${name}')`);
  });
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.toggle('active', el.id === 'tab-' + name);
  });

  // Draw canvases on first show
  if (name === 'wheel') {
    drawPetalWheel(document.getElementById('petalWheel'), 'normal');
    updateWheelColor();
  }
  if (name === 'cvd') renderCVDWheels();
  if (name === 'palette') updatePalette();
  if (name === 'contrast') updateContrast();
  if (name === 'accessible') updateAccessiblePalette();
}

// ============================================================
// SECTION 1: PETAL WHEEL
// ============================================================

// Draw a 320x320 petal color wheel on a canvas, optionally with CVD
function drawPetalWheel(canvas, cvdType) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const outerR = canvas.width / 2 - 4;
  const innerR = 16;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Black background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw 360 wedges
  for (let deg = 0; deg < 360; deg++) {
    const angle1 = (deg - 90) * Math.PI / 180;
    const angle2 = (deg - 89) * Math.PI / 180;

    // Compute the saturated color at this hue
    const rgb = hslToRgb(deg, 100, 50);
    let rc = rgb.r, gc = rgb.g, bc = rgb.b;
    if (cvdType && cvdType !== 'normal') {
      const sim = simulateCVD(rc, gc, bc, cvdType);
      rc = sim.r; gc = sim.g; bc = sim.b;
    }

    // Gradient: white at innerR → saturated at ~50% → dark at outerR
    const gx1 = cx + innerR * Math.cos(angle1);
    const gy1 = cy + innerR * Math.sin(angle1);
    const gx2 = cx + outerR * Math.cos(angle1);
    const gy2 = cy + outerR * Math.sin(angle1);

    const grad = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.38, `rgb(${rc},${gc},${bc})`);
    grad.addColorStop(1, `rgb(${Math.round(rc*0.1)},${Math.round(gc*0.1)},${Math.round(bc*0.1)})`);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, angle1, angle2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // White center disk
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

// Draw the marker on the wheel for the current color
function drawWheelMarker(canvas, r, g, b) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const outerR = canvas.width / 2 - 4;
  const innerR = 16;

  const hsl = rgbToHsl(r, g, b);
  const h = hsl.h;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  // Calculate radial distance
  let dist;
  if (s < 0.05) {
    dist = 0.05;
  } else if (l >= 0.5) {
    dist = (1 - l) * 2 * s * 0.62 + 0.08;
  } else {
    dist = (0.5 - l) * 1.2 * s + 0.38 * s + 0.08;
  }
  dist = Math.max(0.02, Math.min(0.97, dist));

  const radius = innerR + (outerR - innerR) * dist;
  const angle = (h - 90) * Math.PI / 180;
  const mx = cx + radius * Math.cos(angle);
  const my = cy + radius * Math.sin(angle);

  // Draw marker
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(mx, my, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = rgbToHex(r, g, b);
  ctx.beginPath();
  ctx.arc(mx, my, 6, 0, Math.PI * 2);
  ctx.fill();
}

// Primary button selection (constrained mixing)
function togglePrimary(which) {
  const all = ['r', 'g', 'b'];
  if (selectedPrimaries.includes(which)) {
    // Deselect this one — swap it with the currently locked channel
    const locked = all.find(p => !selectedPrimaries.includes(p));
    selectedPrimaries = selectedPrimaries.map(p => p === which ? locked : p);
  } else {
    // Select this (currently locked) channel — drop the last-in-order selected one
    const toRemove = [...all].reverse().find(p => selectedPrimaries.includes(p));
    selectedPrimaries = [which, ...selectedPrimaries.filter(p => p !== toRemove)];
  }
  updatePrimaryUI();
  updateWheelColor();
}

function updatePrimaryUI() {
  for (const p of ['r', 'g', 'b']) {
    const btn = document.getElementById('pBtn-' + p);
    if (!btn) continue;
    const selected = selectedPrimaries.includes(p);
    btn.classList.toggle('selected', selected);
    btn.classList.toggle('locked', !selected);
  }
  // Update slider constraints
  applySliderConstraints();
}

function applySliderConstraints() {
  const lockedPrimary = ['r', 'g', 'b'].find(p => !selectedPrimaries.includes(p));
  const sliders  = { r: document.getElementById('wR'),    g: document.getElementById('wG'),    b: document.getElementById('wB')    };
  const lockSpans= { r: document.getElementById('wRLock'), g: document.getElementById('wGLock'), b: document.getElementById('wBLock') };

  for (const [p, slider] of Object.entries(sliders)) {
    if (!slider) continue;
    const lock = lockSpans[p];
    if (p === lockedPrimary) {
      const other1 = selectedPrimaries[0];
      const other2 = selectedPrimaries[1];
      const v1 = +document.getElementById('w' + other1.toUpperCase()).value;
      const v2 = +document.getElementById('w' + other2.toUpperCase()).value;
      const maxVal = Math.min(v1, v2);
      slider.max = maxVal;
      if (+slider.value > maxVal) { slider.value = maxVal; }
      slider.style.opacity = '0.55';
      if (lock) lock.textContent = `🔒 max: ${maxVal}`;
    } else {
      slider.max = 255;
      slider.style.opacity = '1';
      if (lock) lock.textContent = '';
    }
  }
}

function updateWheelColor() {
  applySliderConstraints();
  const r = +document.getElementById('wR').value;
  const g = +document.getElementById('wG').value;
  const b = +document.getElementById('wB').value;
  wheelColor = { r, g, b };

  document.getElementById('wRVal').textContent = r;
  document.getElementById('wGVal').textContent = g;
  document.getElementById('wBVal').textContent = b;

  const hex = rgbToHex(r, g, b);
  document.getElementById('wheelPreview').style.background = hex;
  document.getElementById('wheelHex').textContent = hex;
  document.getElementById('wheelRgb').textContent = `R: ${r}  G: ${g}  B: ${b}`;
  document.getElementById('wheelName').textContent = getColorName(r, g, b);
  document.getElementById('recipeText').textContent = getRecipeText(r, g, b);

  // Redraw wheel with marker
  const wCanvas = document.getElementById('petalWheel');
  if (wCanvas) {
    drawPetalWheel(wCanvas, 'normal');
    drawWheelMarker(wCanvas, r, g, b);
  }
}

// Click on wheel canvas to pick color
document.addEventListener('DOMContentLoaded', () => {
  const wCanvas = document.getElementById('petalWheel');
  if (wCanvas) {
    wCanvas.addEventListener('click', (e) => {
      const rect = wCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const scaleX = wCanvas.width / rect.width;
      const scaleY = wCanvas.height / rect.height;
      const px = mx * scaleX;
      const py = my * scaleY;

      // Sample the pixel color
      const ctx = wCanvas.getContext('2d');
      const pxData = ctx.getImageData(Math.round(px), Math.round(py), 1, 1).data;
      if (pxData[3] > 10) {
        document.getElementById('wR').value = pxData[0];
        document.getElementById('wG').value = pxData[1];
        document.getElementById('wB').value = pxData[2];
        updateWheelColor();
      }
    });
  }
});

// ============================================================
// SECTION 2: PALETTE GENERATOR
// ============================================================
let paletteSurpriseTimeout = null;

function updatePalette() {
  const h = +document.getElementById('baseHue').value;
  const s = +document.getElementById('baseSat').value;
  const l = +document.getElementById('baseLit').value;
  const type = document.getElementById('harmonyType').value;

  document.getElementById('baseHueVal').textContent = h;
  document.getElementById('baseSatVal').textContent = s;
  document.getElementById('baseLitVal').textContent = l;

  const baseRgb = hslToRgb(h, s, l);
  const palette = getHarmony(baseRgb, type);

  renderSwatches(palette, 'paletteSwatches');
  renderMiniWheel(palette, h, type);
  renderSampleMenu(palette);
}

function renderSwatches(palette, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  palette.forEach((rgb, i) => {
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const name = getColorName(rgb.r, rgb.g, rgb.b);

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.animationDelay = `${i * 0.08}s`;

    const colorBox = document.createElement('div');
    colorBox.className = 'swatch-color';
    colorBox.style.background = hex;
    colorBox.title = 'Click to copy hex';
    colorBox.onclick = () => copyHex(hex);

    const hexLabel = document.createElement('div');
    hexLabel.className = 'swatch-hex';
    hexLabel.textContent = hex;
    hexLabel.title = 'Click to copy';
    hexLabel.onclick = () => copyHex(hex);

    const nameLabel = document.createElement('div');
    nameLabel.className = 'swatch-name';
    nameLabel.textContent = name;

    swatch.appendChild(colorBox);
    swatch.appendChild(hexLabel);
    swatch.appendChild(nameLabel);
    container.appendChild(swatch);
  });
}

function copyHex(hex) {
  navigator.clipboard.writeText(hex).then(() => {
    showLearnToast(`Copied ${hex}! 🍳`);
  }).catch(() => {
    showLearnToast(`${hex} — copy manually`);
  });
}

function renderMiniWheel(palette, baseHue, type) {
  const canvas = document.getElementById('miniWheel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const R = cx - 8;

  // Draw mini hue ring
  for (let deg = 0; deg < 360; deg++) {
    const a1 = (deg - 90) * Math.PI / 180;
    const a2 = (deg - 89) * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx + (R - 18) * Math.cos(a1), cy + (R - 18) * Math.sin(a1));
    ctx.arc(cx, cy, R, a1, a2);
    ctx.arc(cx, cy, R - 18, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = `hsl(${deg}, 80%, 50%)`;
    ctx.fill();
  }

  // Center
  ctx.fillStyle = '#f5f0e8';
  ctx.beginPath();
  ctx.arc(cx, cy, R - 20, 0, Math.PI * 2);
  ctx.fill();

  // Draw geometry lines between palette colors
  const hslList = palette.map(rgb => rgbToHsl(rgb.r, rgb.g, rgb.b));
  const points = hslList.map(hsl => {
    const angle = (hsl.h - 90) * Math.PI / 180;
    const r = R - 9;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  if (points.length > 1) {
    ctx.strokeStyle = 'rgba(50,20,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    if (['triadic','tetradic','complementary'].includes(type)) ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw dots for each palette color
  palette.forEach((rgb, i) => {
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 7, 0, Math.PI * 2);
    ctx.fillStyle = rgbToHex(rgb.r, rgb.g, rgb.b);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function renderSampleMenu(palette) {
  const el = document.getElementById('sampleMenu');
  if (!palette || palette.length < 2) return;

  const bg   = rgbToHex(palette[0].r, palette[0].g, palette[0].b);
  const head = rgbToHex(palette[Math.min(1, palette.length-1)].r, palette[Math.min(1, palette.length-1)].g, palette[Math.min(1, palette.length-1)].b);
  const body = rgbToHex(palette[Math.min(2, palette.length-1)].r, palette[Math.min(2, palette.length-1)].g, palette[Math.min(2, palette.length-1)].b);
  const accent = palette.length > 3 ? rgbToHex(palette[3].r, palette[3].g, palette[3].b) : head;

  el.style.background = bg;
  el.style.borderColor = accent;
  el.innerHTML = `
    <h4 style="color:${head}; border-bottom: 2px solid ${accent}; padding-bottom:4px; margin-bottom:6px;">Chef RGB's Specials</h4>
    <p style="color:${body}">Today's featured dish: <em style="color:${accent}">Chromatic Bisque</em></p>
    <p style="color:${body}; font-size:0.78rem; margin-top:4px;">Sample text in this palette — does it feel harmonious?</p>
  `;
}

function surpriseMe() {
  const h = Math.floor(Math.random() * 360);
  const s = 40 + Math.floor(Math.random() * 55);
  const l = 35 + Math.floor(Math.random() * 35);
  const types = ['complementary','analogous','triadic','split-complementary','tetradic'];
  const type = types[Math.floor(Math.random() * types.length)];

  document.getElementById('baseHue').value = h;
  document.getElementById('baseSat').value = s;
  document.getElementById('baseLit').value = l;
  document.getElementById('harmonyType').value = type;

  // Shuffle animation — rapid color changes then settle
  let flicker = 0;
  const interval = setInterval(() => {
    flicker++;
    const fh = (h + flicker * 37) % 360;
    const baseRgb = hslToRgb(fh, s, l);
    const palette = getHarmony(baseRgb, type);
    renderSwatches(palette, 'paletteSwatches');
    if (flicker > 8) {
      clearInterval(interval);
      updatePalette();
    }
  }, 70);
}

// ============================================================
// SECTION 3: CONTRAST CHECKER
// ============================================================
function updateContrast() {
  const fgInput = document.getElementById('fgColor');
  const bgInput = document.getElementById('bgColor');
  if (!fgInput || !bgInput) return;

  const fg = hexToRgb(fgInput.value);
  const bg = hexToRgb(bgInput.value);

  document.getElementById('fgHex').value = fgInput.value.toUpperCase();
  document.getElementById('bgHex').value = bgInput.value.toUpperCase();

  const ratio = contrastRatio(fg, bg);
  document.getElementById('contrastRatio').textContent = ratio.toFixed(2);

  // Live text preview
  const preview = document.getElementById('textPreview');
  preview.style.background = bgInput.value;
  preview.style.color = fgInput.value;

  // WCAG badges
  const badges = document.getElementById('wcagBadges');
  badges.innerHTML = '';

  const standards = [
    { label: 'AA Normal Text (4.5:1)', pass: ratio >= 4.5 },
    { label: 'AA Large Text (3:1)',     pass: ratio >= 3.0 },
    { label: 'AAA Normal Text (7:1)',   pass: ratio >= 7.0 },
    { label: 'AAA Large Text (4.5:1)', pass: ratio >= 4.5 },
  ];

  for (const std of standards) {
    const badge = document.createElement('div');
    badge.className = `wcag-badge ${std.pass ? 'pass' : 'fail'}`;
    badge.textContent = `${std.pass ? '✓' : '✗'} ${std.label}`;
    badges.appendChild(badge);
  }
}

function updateContrastHex(which) {
  const hexInput = document.getElementById(which + 'Hex');
  const colorInput = document.getElementById(which + 'Color');
  if (!hexInput || !colorInput) return;
  const val = hexInput.value;
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    colorInput.value = val;
    updateContrast();
  }
}

// ============================================================
// SECTION 4: CVD SIMULATOR
// ============================================================
const CVD_INFO = {
  normal: {
    title: 'Normal Vision',
    desc: 'Standard trichromatic color perception. Three types of cone cells respond to red, green, and blue wavelengths.',
  },
  protanopia: {
    title: 'Protanopia (red-blind)',
    desc: 'Affects ~1% of males. Red cone cells are absent or non-functional. Reds appear dark, and red-green distinctions are lost.',
  },
  deuteranopia: {
    title: 'Deuteranopia (green-blind)',
    desc: 'Affects ~1% of males. Green cone cells are absent. Most common form of color blindness. Green and red appear similar.',
  },
  tritanopia: {
    title: 'Tritanopia (blue-blind)',
    desc: 'Very rare — affects ~0.003% of population. Blue cone cells are absent. Blue appears green, yellow appears pink.',
  },
};

function setCVD(type) {
  currentCVD = type;
  document.querySelectorAll('.cvd-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === 'cvd-' + type);
  });

  const info = CVD_INFO[type];
  document.getElementById('cvdInfo').innerHTML = `
    <p><strong>${info.title}</strong></p>
    <p>${info.desc}</p>
    <p style="margin-top:6px;">Approximately 8% of men and 0.5% of women have some form of color blindness.</p>
    <p><em>Tip: Designs that work for color-blind users work better for everyone.</em></p>
  `;
  document.getElementById('cvdLabel').textContent = type === 'normal' ? 'Same (Normal)' : info.title;

  renderCVDWheels();
}

function renderCVDWheels() {
  const normalCanvas = document.getElementById('cvdWheelNormal');
  const simCanvas = document.getElementById('cvdWheelSimulated');
  if (!normalCanvas || !simCanvas) return;
  drawPetalWheel(normalCanvas, 'normal');
  drawPetalWheel(simCanvas, currentCVD === 'normal' ? 'normal' : currentCVD);
}

// ============================================================
// SECTION 5: ACCESSIBLE PALETTE
// ============================================================
function updateAccessiblePalette() {
  const bgInput = document.getElementById('accessBgColor');
  const hInput = document.getElementById('accessHue');
  const harmInput = document.getElementById('accessHarmony');
  const enforce = document.getElementById('enforceA11y');
  if (!bgInput || !hInput) return;

  const h = +hInput.value;
  const type = harmInput ? harmInput.value : 'triadic';
  document.getElementById('accessHueVal').textContent = h;

  const baseRgb = hslToRgb(h, 70, 50);
  let palette = getHarmony(baseRgb, type);
  const bgRgb = hexToRgb(bgInput.value);

  if (enforce && enforce.checked) {
    palette = palette.map(rgb => enforceContrast(rgb, bgRgb, 4.5));
  }

  renderSwatches(palette, 'accessibleSwatches');
  renderContrastMatrix(palette, bgRgb);
}

function enforceContrast(fgRgb, bgRgb, minRatio) {
  const ratio = contrastRatio(fgRgb, bgRgb);
  if (ratio >= minRatio) return fgRgb;

  // Try darkening and lightening to find passing color
  const hsl = rgbToHsl(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = relativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  // Try lightening first if bg is dark, else darken
  let direction = bgLum < 0.5 ? 1 : -1;
  let l = hsl.l;
  for (let i = 0; i < 100; i++) {
    l = Math.max(0, Math.min(100, l + direction * 1));
    const candidate = hslToRgb(hsl.h, hsl.s, l);
    if (contrastRatio(candidate, bgRgb) >= minRatio) return candidate;
  }
  // Fallback: white or black
  return bgLum < 0.5 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
}

function renderContrastMatrix(palette, bgRgb) {
  const container = document.getElementById('contrastMatrix');
  if (!container) return;

  // Include background as first entry
  const all = [bgRgb, ...palette];
  const labels = ['BG', ...palette.map((_, i) => `C${i + 1}`)];

  let html = '<table><thead><tr><th></th>';
  for (const l of labels) html += `<th>${l}</th>`;
  html += '</tr></thead><tbody>';

  for (let i = 0; i < all.length; i++) {
    html += `<tr><th style="background:${rgbToHex(all[i].r,all[i].g,all[i].b)};color:${relativeLuminance(all[i].r,all[i].g,all[i].b)>0.3?'#000':'#fff'};min-width:36px">${labels[i]}</th>`;
    for (let j = 0; j < all.length; j++) {
      if (i === j) {
        html += '<td class="matrix-cell">—</td>';
      } else {
        const r = contrastRatio(all[i], all[j]);
        const cls = r >= 4.5 ? 'matrix-pass' : 'matrix-fail';
        html += `<td class="${cls}" title="${r.toFixed(2)}:1">${r.toFixed(1)}</td>`;
      }
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}

// ============================================================
// TOAST (Learn mode)
// ============================================================
function showLearnToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}
