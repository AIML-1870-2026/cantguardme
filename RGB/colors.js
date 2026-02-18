// ============================================================
// COLOR UTILITIES — RGB Chef's Kitchen
// ============================================================

'use strict';

// --- RGB ↔ HSL ---
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  let l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// --- RGB ↔ CIE Lab (via XYZ, D65) ---
function rgbToLab(r, g, b) {
  function linearize(v) {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  const rl = linearize(r), gl = linearize(g), bl = linearize(b);
  let X = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  let Y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  let Z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041;
  X /= 0.95047; Y /= 1.00000; Z /= 1.08883;
  function f(t) { return t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + 16 / 116; }
  const fx = f(X), fy = f(Y), fz = f(Z);
  return { L: (116 * fy) - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

// --- ΔE CIE76 ---
function deltaE(rgb1, rgb2) {
  const lab1 = rgbToLab(rgb1.r, rgb1.g, rgb1.b);
  const lab2 = rgbToLab(rgb2.r, rgb2.g, rgb2.b);
  return Math.sqrt(
    Math.pow(lab1.L - lab2.L, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  );
}

// --- WCAG Luminance & Contrast ---
function relativeLuminance(r, g, b) {
  function lin(v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// --- CVD Simulation ---
function simulateCVD(r, g, b, type) {
  if (type === 'normal') return { r, g, b };
  function lin(v) {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  function delin(v) {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    return Math.round(Math.min(255, Math.max(0, c * 255)));
  }
  const rl = lin(r), gl = lin(g), bl = lin(b);
  const matrices = {
    protanopia:   [[0.567, 0.433, 0.000], [0.558, 0.442, 0.000], [0.000, 0.242, 0.758]],
    deuteranopia: [[0.625, 0.375, 0.000], [0.700, 0.300, 0.000], [0.000, 0.300, 0.700]],
    tritanopia:   [[0.950, 0.050, 0.000], [0.000, 0.433, 0.567], [0.000, 0.475, 0.525]],
  };
  const m = matrices[type];
  return {
    r: delin(m[0][0] * rl + m[0][1] * gl + m[0][2] * bl),
    g: delin(m[1][0] * rl + m[1][1] * gl + m[1][2] * bl),
    b: delin(m[2][0] * rl + m[2][1] * gl + m[2][2] * bl),
  };
}

// --- Harmony Generation (HSL-based) ---
function getHarmony(baseRgb, type) {
  const { h, s, l } = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
  function fromHue(hue) {
    return hslToRgb(((hue % 360) + 360) % 360, s, l);
  }
  switch (type) {
    case 'complementary':      return [baseRgb, fromHue(h + 180)];
    case 'analogous':          return [fromHue(h - 60), fromHue(h - 30), baseRgb, fromHue(h + 30), fromHue(h + 60)];
    case 'triadic':            return [baseRgb, fromHue(h + 120), fromHue(h + 240)];
    case 'split-complementary':return [baseRgb, fromHue(h + 150), fromHue(h + 210)];
    case 'tetradic':           return [baseRgb, fromHue(h + 90), fromHue(h + 180), fromHue(h + 270)];
    default:                   return [baseRgb];
  }
}

// --- Hex Helpers ---
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return { r: 0, g: 0, b: 0 };
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// --- Food-Themed Color Names ---
const COLOR_NAME_TABLE = [
  { r: 255, g: 0,   b: 0,   name: 'Chili Pepper' },
  { r: 220, g: 20,  b: 20,  name: 'Crimson Reduction' },
  { r: 255, g: 80,  b: 0,   name: 'Sriracha Glaze' },
  { r: 255, g: 128, b: 0,   name: 'Tangerine Marmalade' },
  { r: 255, g: 165, b: 0,   name: 'Butterscotch Glaze' },
  { r: 255, g: 200, b: 0,   name: 'Saffron Blaze' },
  { r: 255, g: 255, b: 0,   name: 'Lemon Zest' },
  { r: 200, g: 255, b: 0,   name: 'Kiwi Sorbet' },
  { r: 128, g: 255, b: 0,   name: 'Lime Drizzle' },
  { r: 0,   g: 255, b: 0,   name: 'Mint Leaf' },
  { r: 0,   g: 255, b: 128, name: 'Spearmint Cream' },
  { r: 0,   g: 255, b: 200, name: 'Sea Glass Foam' },
  { r: 0,   g: 255, b: 255, name: 'Ocean Bisque' },
  { r: 0,   g: 200, b: 255, name: 'Arctic Glaze' },
  { r: 0,   g: 128, b: 255, name: 'Blueberry Glaze' },
  { r: 0,   g: 0,   b: 255, name: 'Midnight Espresso' },
  { r: 64,  b: 255, g: 0,   name: 'Indigo Reduction' },
  { r: 128, g: 0,   b: 255, name: 'Lavender Mousse' },
  { r: 200, g: 0,   b: 255, name: 'Plum Coulis' },
  { r: 255, g: 0,   b: 255, name: 'Berry Coulis' },
  { r: 255, g: 0,   b: 200, name: 'Dragonfruit Jam' },
  { r: 255, g: 0,   b: 128, name: 'Raspberry Reduction' },
  { r: 255, g: 192, b: 203, name: 'Strawberry Cream' },
  { r: 255, g: 160, b: 122, name: 'Salmon Bisque' },
  { r: 255, g: 127, b: 80,  name: 'Coral Coulis' },
  { r: 210, g: 180, b: 140, name: 'Caramel Toffee' },
  { r: 139, g: 69,  b: 19,  name: 'Dark Cocoa' },
  { r: 245, g: 222, b: 179, name: 'Vanilla Custard' },
  { r: 255, g: 250, b: 205, name: 'Lemon Curd' },
  { r: 144, g: 238, b: 144, name: 'Pistachio Crème' },
  { r: 64,  g: 224, b: 208, name: 'Turquoise Tisane' },
  { r: 70,  g: 130, b: 180, name: 'Steel Blue Glaze' },
  { r: 147, g: 112, b: 219, name: 'Plum Preserve' },
  { r: 255, g: 20,  b: 147, name: 'Hot Pink Frosting' },
  { r: 128, g: 128, b: 128, name: 'Smoke Ash Rub' },
  { r: 200, g: 200, b: 200, name: 'Silver Foam' },
  { r: 255, g: 255, b: 255, name: 'White Truffle' },
  { r: 10,  g: 10,  b: 10,  name: 'Black Charcoal' },
  { r: 128, g: 0,   b: 0,   name: 'Merlot Reduction' },
  { r: 0,   g: 100, b: 0,   name: 'Herb Garden' },
  { r: 0,   g: 0,   b: 128, name: 'Deep Sea Ink' },
  { r: 255, g: 215, b: 0,   name: 'Honey Drizzle' },
  { r: 218, g: 165, b: 32,  name: 'Goldenrod Honey' },
  { r: 107, g: 142, b: 35,  name: 'Olive Tapenade' },
  { r: 100, g: 149, b: 237, name: 'Periwinkle Foam' },
  { r: 205, g: 133, b: 63,  name: 'Gingerbread Spice' },
  { r: 50,  g: 205, b: 50,  name: 'Kiwi Glaze' },
  { r: 0,   g: 206, b: 209, name: 'Dark Turquoise Tisane' },
  { r: 255, g: 99,  b: 71,  name: 'Tomato Gremolata' },
  { r: 46,  g: 139, b: 87,  name: 'Sea Foam Pesto' },
  { r: 106, g: 90,  b: 205, name: 'Violet Gastrique' },
];

function getColorName(r, g, b) {
  let closest = COLOR_NAME_TABLE[0];
  let minDist = Infinity;
  for (const c of COLOR_NAME_TABLE) {
    const dist = Math.sqrt((r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2);
    if (dist < minDist) { minDist = dist; closest = c; }
  }
  return closest.name;
}

// --- Recipe Card Text (for petal wheel) ---
function getRecipeText(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const { h, s, l } = rgbToHsl(r, g, b);

  if (max < 20) return 'All channels near zero — pure darkness. Like an unlit kitchen.';
  if (min > 235) return 'All channels maxed — pure white light. Like mixing all three spotlights!';
  if (s < 10) return `A neutral gray — all three channels nearly equal (R:${r} G:${g} B:${b}). Like adding equal cream to every color.`;

  const dominant = r >= g && r >= b ? 'Red' : g >= b ? 'Green' : 'Blue';
  const secondary = r <= g && r <= b ? 'Red' : g <= b ? 'Green' : 'Blue';

  let hueDesc = '';
  if (h < 15 || h >= 345) hueDesc = 'Red zone';
  else if (h < 45) hueDesc = 'Red-Orange zone';
  else if (h < 75) hueDesc = 'Yellow zone — Red + Green dominate';
  else if (h < 105) hueDesc = 'Yellow-Green zone';
  else if (h < 165) hueDesc = 'Green zone';
  else if (h < 195) hueDesc = 'Cyan zone — Green + Blue dominate';
  else if (h < 255) hueDesc = 'Blue zone';
  else if (h < 285) hueDesc = 'Blue-Purple zone';
  else if (h < 315) hueDesc = 'Magenta zone — Red + Blue dominate';
  else hueDesc = 'Rose zone';

  let lightnessNote = '';
  if (l < 20) lightnessNote = ' Very dark — like undercooked color.';
  else if (l > 80) lightnessNote = ' Very light — like adding lots of cream.';

  return `${dominant} is dominant. ${hueDesc}. ${secondary} adds ${secondary === 'Red' ? 'warmth/depth' : secondary === 'Green' ? 'life/vibrancy' : 'depth/cool'}.${lightnessNote}`;
}
