/**
 * Spike Jumper — zones.js (Optimised 3rd-Person Perspective)
 * Performance strategy: static scene elements are pre-rendered once to an
 * offscreen canvas (_staticBg) and blitted each frame with drawImage.
 * Only animated overlays (stars, aurora, rain, waves…) are drawn per frame.
 *
 * Extends window.SJ (initialised by engine.js).
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // ZONE CONFIGURATIONS
  // ─────────────────────────────────────────────────────────────
  SJ.zones = [
    {
      idx: 0, name: 'CITY', subtitle: 'Golden Hour',
      songFile: 'no-role-modelz.mp3',
      displayTitle: 'No Role Modelz \u2014 J. Cole',
      bpm: 100,
      skyTop: '#1a3a6e', skyBottom: '#ff9a3c',
      accentColors: ['#FF6B35', '#FFD93D', '#6BCB77', '#4D96FF'],
      layerSpeeds: [0.04, 0.12, 0.3, 0.65],
    },
    {
      idx: 1, name: 'NORTHERN LIGHTS', subtitle: 'Arctic Peaks',
      songFile: 'trae-the-truth-in-ibiza.mp3',
      displayTitle: 'In Ibiza \u2014 Trae The Truth',
      bpm: 158,
      skyTop: '#020918', skyBottom: '#0a1f35',
      accentColors: ['#00ff88', '#a855f7', '#00bcd4', '#ffffff'],
      layerSpeeds: [0.03, 0.1, 0.28, 0.6],
    },
    {
      idx: 2, name: 'SPACE', subtitle: 'Deep Orbit',
      songFile: 'power-trip.mp3',
      displayTitle: 'Power Trip \u2014 J. Cole',
      bpm: 100,
      skyTop: '#000005', skyBottom: '#050015',
      accentColors: ['#7c3aed', '#2563eb', '#f97316', '#ffffff'],
      layerSpeeds: [0.015, 0.06, 0.18, 0.45],
    },
    {
      idx: 3, name: 'FALLING CITY', subtitle: 'Neon Night',
      songFile: 'a-tale-of-2-citiez.mp3',
      displayTitle: 'A Tale of 2 Citiez \u2014 J. Cole',
      bpm: 190,
      skyTop: '#06000f', skyBottom: '#150025',
      accentColors: ['#ff00ff', '#00ffff', '#ff4500', '#ffff00'],
      layerSpeeds: [0.04, 0.18, 0.42, 0.82],
    },
    {
      idx: 4, name: 'OCEAN', subtitle: 'Moonlit Waters',
      songFile: 'the-let-out.mp3',
      displayTitle: 'The Let Out \u2014 J. Cole',
      bpm: 130,
      skyTop: '#020b1a', skyBottom: '#071530',
      accentColors: ['#00d4ff', '#00ff9f', '#4488cc', '#ffffff'],
      layerSpeeds: [0.03, 0.1, 0.25, 0.55],
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // PRE-GENERATED SCENE ELEMENTS
  // ─────────────────────────────────────────────────────────────
  function generateBuildings() {
    var buildings = [], styles = ['glass', 'brick', 'concrete', 'tower'];
    for (var i = 0; i < 22; i++) {
      buildings.push({
        side:       i % 2 === 0 ? 'left' : 'right',
        depthFrac:  0.06 + Math.random() * 0.86,
        widthFrac:  0.04 + Math.random() * 0.13,
        heightFrac: 0.12 + Math.random() * 0.52,
        style:      styles[i % 4],
        hue:        195 + Math.random() * 40,
        lit:        38 + Math.random() * 25,
        sat:        12 + Math.random() * 20,
        windowLit:  Math.random() < 0.55,
        hasAntenna: Math.random() < 0.35,
        phase:      Math.random() * Math.PI * 2,
      });
    }
    return buildings;
  }

  function generateNeonBuildings() {
    var neons = [];
    for (var i = 0; i < 14; i++) {
      var h = Math.floor(Math.random() * 360);
      neons.push({
        side:         i % 2 === 0 ? 'left' : 'right',
        depthFrac:    0.08 + Math.random() * 0.84,
        widthFrac:    0.05 + Math.random() * 0.13,
        heightFrac:   0.14 + Math.random() * 0.60,
        neonHue:      h,
        neonHue2:     (h + 120 + Math.random() * 80) % 360,
        numSigns:     1 + Math.floor(Math.random() * 3),
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: 1.5 + Math.random() * 4,
      });
    }
    return neons;
  }

  function generateStars(count) {
    var arr = [];
    for (var i = 0; i < count; i++) {
      arr.push({
        nx: (Math.random() - 0.5) * 2,
        ny: (Math.random() - 0.5) * 2,
        size:        0.3 + Math.pow(Math.random(), 2.5) * 2.2,
        twinkle:     Math.random() * Math.PI * 2,
        twinkleSpd:  0.012 + Math.random() * 0.035,
        r: 180 + Math.floor(Math.random() * 75),
        g: 180 + Math.floor(Math.random() * 75),
        b: 200 + Math.floor(Math.random() * 55),
        bright:      Math.random() < 0.06,
      });
    }
    return arr;
  }

  function generateWarpStars(count) {
    var arr = [];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist  = 0.05 + Math.random() * 0.93;
      arr.push({
        angle: angle, dist: dist,
        speed: 0.01 + Math.pow(dist, 2) * 0.055,
        size:  0.2 + dist * 2.2,
        r: 160 + Math.floor(Math.random() * 95),
        g: 160 + Math.floor(Math.random() * 95),
        b: 200 + Math.floor(Math.random() * 55),
      });
    }
    return arr;
  }

  function generateWaves(count) {
    var arr = [];
    for (var i = 0; i < count; i++) {
      arr.push({
        depthFrac: 0.04 + Math.random() * 0.94,
        amplitude: 3 + Math.random() * 12,
        freq:      0.007 + Math.random() * 0.015,
        phase:     Math.random() * Math.PI * 2,
        speed:     0.25 + Math.random() * 0.8,
        alpha:     0.15 + Math.random() * 0.4,
        hasFoam:   Math.random() < 0.4,
      });
    }
    return arr;
  }

  // ─────────────────────────────────────────────────────────────
  // STATIC BACKGROUND CANVAS
  // ─────────────────────────────────────────────────────────────
  var _staticBg  = null;
  var _staticCtx = null;
  var _staticIdx = -1;
  var _staticW   = 0;
  var _staticH   = 0;

  /**
   * Ensures the static background for zoneIdx is rendered.
   * If zone/size changed, calls drawFn to (re)draw. Then blits to SJ.ctx.
   */
  function ensureStatic(zoneIdx, drawFn) {
    var w = SJ.width, h = SJ.height;
    if (_staticIdx !== zoneIdx || _staticW !== w || _staticH !== h) {
      if (!_staticBg) {
        _staticBg  = document.createElement('canvas');
        _staticCtx = _staticBg.getContext('2d');
      }
      _staticBg.width  = w;
      _staticBg.height = h;
      _staticIdx = zoneIdx;
      _staticW   = w;
      _staticH   = h;
      // Use current SJ values since they match canvas size
      drawFn(_staticCtx, w, h);
    }
    SJ.ctx.drawImage(_staticBg, 0, 0);
  }

  /** Force-invalidate static BG (call on zone change). */
  function invalidateStatic() { _staticIdx = -1; }

  // ─────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────
  SJ.initZones = function () {
    SJ._layerOffsets      = [0, 0, 0, 0];
    SJ._layerOffsetY      = [0, 0, 0, 0];
    SJ._transitionRenderFn = null;
    invalidateStatic();

    SJ._perspBuildings = generateBuildings();
    SJ._neonBuildings  = generateNeonBuildings();
    SJ._perspStars     = generateStars(80);
    SJ._oceanStars     = generateStars(60);
    SJ._warpStars      = generateWarpStars(140);
    SJ._perspWaves     = generateWaves(10);
    SJ._lightningTimer = 0;
    SJ._lightningAlpha = 0;
  };

  // ─────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ═════════════════════════════════════════════════════════════
  // ZONE 0 — GOLDEN HOUR CITY
  // ═════════════════════════════════════════════════════════════

  function drawCityStatic(ctx, w, h) {
    var vx = w / 2, vy = h * 0.38;
    var ceilY = 55, floorY = h - 60;

    // Sky
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0,   '#0c1c45');
    sky.addColorStop(0.38,'#4a8ec8');
    sky.addColorStop(0.62,'#f0a050');
    sky.addColorStop(1,   '#c03810');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Sun glow
    var sunX = vx, sunY = vy - h * 0.08;
    var sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.42);
    sg.addColorStop(0,    'rgba(255,220,80,0.48)');
    sg.addColorStop(0.18, 'rgba(255,160,40,0.14)');
    sg.addColorStop(0.5,  'rgba(255,100,20,0.04)');
    sg.addColorStop(1,    'transparent');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, w, h);

    // Sun disk
    ctx.fillStyle = '#FFE040';
    ctx.beginPath(); ctx.arc(sunX, sunY, 36, 0, Math.PI * 2); ctx.fill();

    // Horizon haze
    var hz = ctx.createRadialGradient(vx, vy, 0, vx, vy, w * 0.38);
    hz.addColorStop(0,   'rgba(255,180,60,0.28)');
    hz.addColorStop(0.6, 'rgba(255,110,20,0.06)');
    hz.addColorStop(1,   'transparent');
    ctx.fillStyle = hz; ctx.fillRect(0, 0, w, h);

    // Ground
    var grd = ctx.createLinearGradient(0, vy, 0, floorY);
    grd.addColorStop(0, '#8a6040'); grd.addColorStop(1, '#2e2424');
    ctx.fillStyle = grd; ctx.fillRect(0, vy, w, floorY - vy);

    // Road grid lines
    ctx.strokeStyle = 'rgba(140,110,60,0.18)';
    ctx.lineWidth = 0.7;
    for (var i = 1; i <= 7; i++) {
      var gy = lerp(vy, floorY, i / 7);
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }
    for (var j = 0; j <= 4; j++) {
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(w * j / 4, floorY); ctx.stroke();
    }

    // Sun reflection on road
    ctx.fillStyle = 'rgba(255,155,40,0.18)';
    ctx.beginPath();
    ctx.moveTo(vx - 14, vy); ctx.lineTo(vx + 14, vy);
    ctx.lineTo(vx + w * 0.21, floorY); ctx.lineTo(vx - w * 0.21, floorY);
    ctx.closePath(); ctx.fill();

    // Buildings
    SJ._perspBuildings.forEach(function (b) {
      var df = b.depthFrac;
      var nearX = b.side === 'left' ? 0 : w;
      var sx = lerp(vx, nearX, df);
      var bw = lerp(0, w * b.widthFrac, df);
      if (bw < 1) return;
      var sf = lerp(vy, floorY, df);
      var sc = lerp(vy, ceilY,  df);
      var bh = (sf - sc) * b.heightFrac;
      var bx = b.side === 'left' ? sx - bw : sx;
      var top = sf - bh;

      ctx.globalAlpha = 0.72 + df * 0.28;
      ctx.fillStyle   = 'hsl(' + b.hue + ',' + b.sat + '%,' + b.lit + '%)';
      ctx.fillRect(bx, top, bw, bh);

      // Windows
      if (bw > 7 && bh > 10) {
        var ww  = Math.max(2, bw * 0.11);
        var wh2 = Math.max(1, bh * 0.06);
        var cols = Math.max(1, Math.floor(bw / (ww * 2.4)));
        var rows = Math.max(1, Math.floor(bh / (wh2 * 2.6)));
        ctx.fillStyle = b.windowLit ? 'rgba(255,210,80,0.55)' : 'rgba(40,60,95,0.28)';
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            if (!b.windowLit && (r + c) % 3 === 0) continue;
            ctx.fillRect(bx + bw * 0.08 + c * bw / cols, top + wh2 * 1.4 + r * bh / rows, ww, wh2);
          }
        }
      }

      // Sunset tint
      var st = ctx.createLinearGradient(bx, top, bx, top + bh * 0.35);
      st.addColorStop(0, 'rgba(255,150,40,' + (0.15 * df) + ')');
      st.addColorStop(1, 'transparent');
      ctx.fillStyle = st; ctx.fillRect(bx, top, bw, bh * 0.35);

      ctx.globalAlpha = 1;
    });
  }

  function renderCityBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    ensureStatic(0, drawCityStatic);

    // Scrolling road dashes
    var dashScroll = (t * 80) % 48;
    ctx.strokeStyle = 'rgba(255,200,50,0.5)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([22, 26]);
    ctx.lineDashOffset = -dashScroll;
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx - w * 0.12, SJ.floorY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + w * 0.12, SJ.floorY); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;

    // Birds
    ctx.lineWidth = 1;
    for (var bi = 0; bi < 6; bi++) {
      var bf = (t * 0.055 + bi * 0.17) % 1;
      var bx = lerp(vx, w * (0.1 + (bi * 0.14) % 0.8), bf);
      var by = lerp(vy, SJ.ceilY + h * 0.11 * (bi % 3 + 1), bf * 0.75);
      var bs = 3 + bf * 8;
      ctx.save(); ctx.globalAlpha = 0.38 * (1 - bf); ctx.strokeStyle = '#1a2855';
      ctx.beginPath();
      ctx.moveTo(bx - bs, by + bs * 0.28); ctx.lineTo(bx, by); ctx.lineTo(bx + bs, by + bs * 0.28);
      ctx.stroke(); ctx.restore();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // ZONE 1 — NORTHERN LIGHTS
  // ═════════════════════════════════════════════════════════════

  function drawNLStatic(ctx, w, h) {
    var vx = w / 2, vy = h * 0.38;
    var ceilY = 55, floorY = h - 60;

    // Arctic sky
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0,   '#010510');
    sky.addColorStop(0.4, '#061428');
    sky.addColorStop(1,   '#0d2035');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    // Moon
    var moonX = vx + w * 0.26, moonY = vy - h * 0.18;
    var mg = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 90);
    mg.addColorStop(0,   'rgba(210,230,255,0.18)');
    mg.addColorStop(0.5, 'rgba(170,195,240,0.07)');
    mg.addColorStop(1,   'transparent');
    ctx.fillStyle = mg; ctx.fillRect(moonX - 90, moonY - 90, 180, 180);
    var md = ctx.createRadialGradient(moonX - 3, moonY - 3, 0, moonX, moonY, 24);
    md.addColorStop(0, '#fff'); md.addColorStop(1, '#b0c8f0');
    ctx.fillStyle = md;
    ctx.beginPath(); ctx.arc(moonX, moonY, 24, 0, Math.PI * 2); ctx.fill();

    // Ice canyon walls — simple quads instead of 18 segments
    var sides = ['left', 'right'];
    sides.forEach(function (side) {
      var nearX = side === 'left' ? 0 : w;
      var ig = side === 'left'
        ? ctx.createLinearGradient(0, 0, w * 0.32, 0)
        : ctx.createLinearGradient(w, 0, w * 0.68, 0);
      ig.addColorStop(0,   'rgba(6,24,44,0.96)');
      ig.addColorStop(0.5, 'rgba(18,52,80,0.88)');
      ig.addColorStop(1,   'rgba(36,85,120,0.3)');
      ctx.fillStyle = ig;
      // Top wall quad
      ctx.beginPath();
      ctx.moveTo(side === 'left' ? 0 : w, ceilY);
      ctx.lineTo(lerp(vx, nearX, 1), ceilY);
      ctx.lineTo(lerp(vx, nearX, 0.08), lerp(ceilY, vy, 0.08));
      ctx.lineTo(side === 'left' ? 0 : w, lerp(ceilY, vy, 0.08));
      ctx.closePath(); ctx.fill();
      // Full side wall
      ctx.beginPath();
      ctx.moveTo(side === 'left' ? 0 : w, ceilY);
      ctx.lineTo(lerp(vx, nearX, 1), ceilY);
      ctx.lineTo(vx, vy);
      ctx.lineTo(lerp(vx, nearX, 1), floorY);
      ctx.lineTo(side === 'left' ? 0 : w, floorY);
      ctx.closePath(); ctx.fill();
    });

    // Aurora reflecting off ice
    var leftGlow = ctx.createLinearGradient(0, 0, w * 0.1, 0);
    leftGlow.addColorStop(0, 'rgba(0,200,100,0.14)'); leftGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = leftGlow; ctx.fillRect(0, ceilY, w * 0.1, floorY - ceilY);
    var rightGlow = ctx.createLinearGradient(w, 0, w * 0.9, 0);
    rightGlow.addColorStop(0, 'rgba(168,85,247,0.14)'); rightGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = rightGlow; ctx.fillRect(w * 0.9, ceilY, w * 0.1, floorY - ceilY);

    // Frozen floor
    var snow = ctx.createLinearGradient(0, vy, 0, floorY);
    snow.addColorStop(0, '#0d2235'); snow.addColorStop(1, '#20404e');
    ctx.fillStyle = snow; ctx.fillRect(0, vy, w, floorY - vy);
    ctx.strokeStyle = 'rgba(100,160,200,0.08)'; ctx.lineWidth = 0.7;
    for (var i = 1; i <= 6; i++) {
      var fy = lerp(vy, floorY, i / 6);
      ctx.beginPath(); ctx.moveTo(lerp(vx, 0, i / 6), fy); ctx.lineTo(lerp(vx, w, i / 6), fy); ctx.stroke();
    }
  }

  function renderNorthernLightsBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    ensureStatic(1, drawNLStatic);

    // Stars (twinkle only — positions are fixed)
    SJ._perspStars.forEach(function (s) {
      s.twinkle += s.twinkleSpd;
      var screenX = vx + s.nx * w * 0.5;
      var screenY = vy + s.ny * h * 0.5;
      if (screenY > vy + (SJ.floorY - vy) * 0.1) return;
      var tw    = Math.sin(s.twinkle);
      var alpha = 0.25 + tw * 0.2;
      var sz    = s.size * (0.85 + tw * 0.15);
      ctx.globalAlpha = Math.max(0, alpha) * 0.75;
      ctx.fillStyle = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      ctx.beginPath(); ctx.arc(screenX, screenY, Math.max(0.1, sz), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Aurora — 3 ribbons × 6 segments (was 5 × 12)
    var aColors = [
      [0, 255, 136, 0.52],
      [168, 85, 247, 0.40],
      [0, 188, 212, 0.44],
    ];
    ctx.save();
    aColors.forEach(function (col, ai) {
      var r = col[0], g = col[1], b = col[2], maxA = col[3];
      var phase = ai * 1.4 + t * (0.08 + ai * 0.025);
      var ry0   = vy - h * (0.10 + ai * 0.07) + Math.sin(phase * 0.6) * h * 0.04;
      var rh    = h * (0.038 + Math.sin(t * 0.1 + ai) * 0.012);

      ctx.globalAlpha = maxA * (0.75 + Math.sin(t * 0.14 + ai * 0.9) * 0.25);
      ctx.globalCompositeOperation = 'lighter';

      var numSeg = 6;
      for (var seg = 0; seg < numSeg; seg++) {
        var f0 = seg / numSeg, f1 = (seg + 1) / numSeg;
        var ax = f0 * w, nx = f1 * w;
        var ay = ry0 + Math.sin(f0 * Math.PI * 2.5 + phase) * h * 0.035;
        var ny = ry0 + Math.sin(f1 * Math.PI * 2.5 + phase) * h * 0.035;
        var segH  = rh * (0.65 + Math.abs(f0 - 0.5) * 1.2) * (0.85 + Math.sin(f0 * Math.PI * 2 + t * 0.2 + ai) * 0.15);
        var segHn = rh * (0.65 + Math.abs(f1 - 0.5) * 1.2) * (0.85 + Math.sin(f1 * Math.PI * 2 + t * 0.2 + ai) * 0.15);
        var ag = ctx.createLinearGradient(ax, ay, ax, ay + segH);
        ag.addColorStop(0,   'rgba(' + r + ',' + g + ',' + b + ',0)');
        ag.addColorStop(0.3, 'rgba(' + r + ',' + g + ',' + b + ',' + maxA + ')');
        ag.addColorStop(1,   'rgba(' + r + ',' + g + ',' + b + ',0)');
        ctx.fillStyle = ag;
        ctx.beginPath();
        ctx.moveTo(ax, ay); ctx.lineTo(nx, ny);
        ctx.lineTo(nx, ny + segHn); ctx.lineTo(ax, ay + segH);
        ctx.closePath(); ctx.fill();
      }
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  // ═════════════════════════════════════════════════════════════
  // ZONE 2 — DEEP SPACE
  // ═════════════════════════════════════════════════════════════

  function drawSpaceStatic(ctx, w, h) {
    var vx = w / 2, vy = h * 0.38;

    ctx.fillStyle = '#000005'; ctx.fillRect(0, 0, w, h);

    // Nebula — 2 simple radial gradients (was 4 animated+rotating)
    var neb1 = ctx.createRadialGradient(vx, vy * 0.9, 0, vx, vy * 0.9, w * 0.45);
    neb1.addColorStop(0,   'hsla(280,60%,50%,0.14)');
    neb1.addColorStop(0.5, 'hsla(280,60%,50%,0.05)');
    neb1.addColorStop(1,   'transparent');
    ctx.fillStyle = neb1; ctx.fillRect(0, 0, w, h);

    var neb2 = ctx.createRadialGradient(vx * 0.6, vy * 1.2, 0, vx * 0.6, vy * 1.2, w * 0.32);
    neb2.addColorStop(0,   'hsla(210,70%,55%,0.12)');
    neb2.addColorStop(0.6, 'hsla(210,70%,55%,0.04)');
    neb2.addColorStop(1,   'transparent');
    ctx.fillStyle = neb2; ctx.fillRect(0, 0, w, h);

    // Milky Way band
    var mw = ctx.createLinearGradient(0, h * 0.1, w, h * 0.7);
    mw.addColorStop(0,   'rgba(200,210,255,0)');
    mw.addColorStop(0.35,'rgba(200,210,255,0.07)');
    mw.addColorStop(0.5, 'rgba(210,220,255,0.05)');
    mw.addColorStop(1,   'rgba(200,210,255,0)');
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = mw;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    // Ringed planet (upper right)
    var px = w * 0.8, py = h * 0.18;
    var pg = ctx.createRadialGradient(px - 4, py - 4, 0, px, py, 36);
    pg.addColorStop(0,   '#c27a3c');
    pg.addColorStop(0.5, '#8a5a2a');
    pg.addColorStop(1,   '#4a3018');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(px, py, 36, 0, Math.PI * 2); ctx.fill();
    // Ring
    ctx.strokeStyle = 'rgba(200,160,80,0.55)'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(px, py + 6, 58, 14, -0.2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(180,140,60,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(px, py + 6, 68, 17, -0.2, 0, Math.PI * 2); ctx.stroke();

    // Gas giant (lower left)
    var gx = w * 0.12, gy = h * 0.7;
    var gg = ctx.createRadialGradient(gx - 5, gy - 5, 0, gx, gy, 28);
    gg.addColorStop(0,   '#6a88cc'); gg.addColorStop(1, '#2a3460');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(gx, gy, 28, 0, Math.PI * 2); ctx.fill();

    // Galaxy grid lines converging to VP
    ctx.strokeStyle = 'rgba(80,80,160,0.07)'; ctx.lineWidth = 0.5;
    for (var i = 1; i <= 5; i++) {
      var gry = lerp(vy, h - 60, i / 5);
      ctx.beginPath(); ctx.moveTo(lerp(vx, 0, i / 5), gry); ctx.lineTo(lerp(vx, w, i / 5), gry); ctx.stroke();
    }
  }

  function renderSpaceBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    ensureStatic(2, drawSpaceStatic);

    // Warp stars — advance dist each frame
    SJ._warpStars.forEach(function (s) {
      s.dist += s.speed;
      if (s.dist > 1) s.dist -= 0.95;  // reset near VP

      var screenX = vx + Math.cos(s.angle) * s.dist * w * 0.54;
      var screenY = vy + Math.sin(s.angle) * s.dist * h * 0.54;
      var streak  = s.speed * s.dist * 35;
      var ex = screenX - Math.cos(s.angle) * streak;
      var ey = screenY - Math.sin(s.angle) * streak;
      var size = Math.max(0.2, s.size * s.dist);
      var alpha = Math.min(1, s.dist * 1.8) * 0.85;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      ctx.lineWidth   = Math.max(0.3, size * 0.55);
      ctx.beginPath();
      ctx.moveTo(ex, ey); ctx.lineTo(screenX, screenY); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  // ═════════════════════════════════════════════════════════════
  // ZONE 3 — NEON NIGHT
  // ═════════════════════════════════════════════════════════════

  function drawNeonStatic(ctx, w, h) {
    // Near-black sky
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#06000f'); sky.addColorStop(1, '#150025');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  }

  function renderNeonCityBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;
    var floorY = SJ.floorY, ceilY = SJ.ceilY;

    ensureStatic(3, drawNeonStatic);

    // Lightning flash
    SJ._lightningTimer -= SJ.dt || 16;
    if (SJ._lightningTimer <= 0) {
      SJ._lightningAlpha = 0.75 + Math.random() * 0.25;
      SJ._lightningTimer = 2500 + Math.random() * 8000;
    }
    if (SJ._lightningAlpha > 0) {
      ctx.fillStyle = 'rgba(220,200,255,' + SJ._lightningAlpha * 0.12 + ')';
      ctx.fillRect(0, 0, w, h);
      SJ._lightningAlpha = Math.max(0, SJ._lightningAlpha - 0.04);
    }

    // Neon buildings (per-frame for flicker)
    SJ._neonBuildings.forEach(function (b) {
      var df = b.depthFrac;
      var nearX = b.side === 'left' ? 0 : w;
      var sx = lerp(vx, nearX, df);
      var bw = lerp(0, w * b.widthFrac, df);
      if (bw < 1) return;
      var sf = lerp(vy, floorY, df);
      var sc = lerp(vy, ceilY, df);
      var bh = (sf - sc) * b.heightFrac;
      var bx = b.side === 'left' ? sx - bw : sx;
      var top = sf - bh;

      // Building body
      ctx.globalAlpha = 0.6 + df * 0.35;
      ctx.fillStyle   = 'hsl(' + b.neonHue + ',20%,8%)';
      ctx.fillRect(bx, top, bw, bh);

      // Neon sign flicker
      var flicker = 0.7 + 0.3 * Math.sin(t * b.flickerSpeed + b.flickerPhase);
      var signH   = Math.max(2, bh * 0.06);
      var y0      = top + signH * 1.5;
      for (var si = 0; si < b.numSigns && y0 + signH < sf; si++, y0 += signH * 3) {
        ctx.globalAlpha = flicker * (0.6 + df * 0.35);
        ctx.fillStyle   = 'hsl(' + (si % 2 === 0 ? b.neonHue : b.neonHue2) + ',100%,60%)';
        ctx.shadowBlur  = 8; ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(bx + bw * 0.05, y0, bw * 0.9, signH);
        ctx.shadowBlur = 0;
      }

      // Glow cast on ground
      if (bh > 0 && df > 0.4) {
        ctx.globalAlpha = 0.06 * df;
        var gc = ctx.createRadialGradient(bx + bw / 2, sf, 0, bx + bw / 2, sf, bw * 1.4);
        gc.addColorStop(0, 'hsl(' + b.neonHue + ',100%,60%)'); gc.addColorStop(1, 'transparent');
        ctx.fillStyle = gc;
        ctx.fillRect(bx - bw * 0.4, sf, bw * 1.8, (floorY - sf) * 0.4);
      }
      ctx.globalAlpha = 1;
    });

    // Rain — 22 streaks radiating from VP
    ctx.strokeStyle = 'rgba(140,200,255,0.22)';
    ctx.lineWidth   = 0.7;
    for (var ri = 0; ri < 22; ri++) {
      var rf    = (t * 0.55 + ri * 0.047) % 1;
      var angle = (ri / 22) * Math.PI * 2;
      var rx0   = vx + Math.cos(angle) * rf * w * 0.56;
      var ry0   = vy + Math.sin(angle) * rf * h * 0.56;
      var len   = (6 + rf * 18) * (0.6 + Math.abs(Math.sin(angle)) * 0.6);
      ctx.save(); ctx.globalAlpha = (1 - rf) * 0.3;
      ctx.beginPath();
      ctx.moveTo(rx0, ry0);
      ctx.lineTo(rx0 + Math.cos(angle) * len, ry0 + Math.sin(angle) * len);
      ctx.stroke(); ctx.restore();
    }

    // Floor reflection
    var ref = ctx.createLinearGradient(0, vy, 0, floorY);
    ref.addColorStop(0,   'rgba(255,0,255,0.06)');
    ref.addColorStop(0.5, 'rgba(0,255,255,0.04)');
    ref.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = ref; ctx.fillRect(0, vy, w, floorY - vy);

    // Edge glows
    var eg1 = ctx.createLinearGradient(0, 0, 22, 0);
    eg1.addColorStop(0, 'rgba(255,0,255,0.16)'); eg1.addColorStop(1, 'transparent');
    ctx.fillStyle = eg1; ctx.fillRect(0, ceilY, 22, floorY - ceilY);
    var eg2 = ctx.createLinearGradient(w, 0, w - 22, 0);
    eg2.addColorStop(0, 'rgba(0,255,255,0.16)'); eg2.addColorStop(1, 'transparent');
    ctx.fillStyle = eg2; ctx.fillRect(w - 22, ceilY, 22, floorY - ceilY);
  }

  // ═════════════════════════════════════════════════════════════
  // ZONE 4 — OCEAN
  // ═════════════════════════════════════════════════════════════

  function drawOceanStatic(ctx, w, h) {
    var vx = w / 2, vy = h * 0.38;
    var floorY = h - 60;

    // Sky
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#020b1a'); sky.addColorStop(0.55, '#071530'); sky.addColorStop(1, '#0a1e28');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    // Moon
    var moonX = vx + w * 0.18, moonY = vy - h * 0.2;
    var mg1 = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 120);
    mg1.addColorStop(0,   'rgba(200,225,255,0.18)');
    mg1.addColorStop(0.4, 'rgba(160,195,240,0.06)');
    mg1.addColorStop(1,   'transparent');
    ctx.fillStyle = mg1; ctx.fillRect(moonX - 120, moonY - 120, 240, 240);
    var mg2 = ctx.createRadialGradient(moonX - 3, moonY - 3, 0, moonX, moonY, 22);
    mg2.addColorStop(0, '#ffffff'); mg2.addColorStop(1, '#b8ccee');
    ctx.fillStyle = mg2;
    ctx.beginPath(); ctx.arc(moonX, moonY, 22, 0, Math.PI * 2); ctx.fill();

    // Moonlight column on water
    var mc = ctx.createLinearGradient(moonX, vy, moonX, floorY);
    mc.addColorStop(0,   'rgba(200,220,255,0.22)');
    mc.addColorStop(0.5, 'rgba(180,200,240,0.1)');
    mc.addColorStop(1,   'rgba(160,180,220,0)');
    ctx.fillStyle = mc;
    ctx.beginPath();
    ctx.moveTo(moonX - 12, vy); ctx.lineTo(moonX + 12, vy);
    ctx.lineTo(moonX + w * 0.12, floorY); ctx.lineTo(moonX - w * 0.12, floorY);
    ctx.closePath(); ctx.fill();

    // Ocean surface base
    var ocean = ctx.createLinearGradient(0, vy, 0, floorY);
    ocean.addColorStop(0, '#061828'); ocean.addColorStop(1, '#0a2030');
    ctx.fillStyle = ocean; ctx.fillRect(0, vy, w, floorY - vy);

    // Horizon perspective lines
    ctx.strokeStyle = 'rgba(0,180,220,0.08)'; ctx.lineWidth = 0.5;
    for (var i = 1; i <= 6; i++) {
      var gy = lerp(vy, floorY, i / 6);
      ctx.beginPath();
      ctx.moveTo(lerp(vx, 0, i / 6), gy); ctx.lineTo(lerp(vx, w, i / 6), gy); ctx.stroke();
    }

    // Distant island silhouette
    ctx.fillStyle = '#04111e';
    ctx.beginPath();
    ctx.moveTo(vx - w * 0.18, vy + (floorY - vy) * 0.08);
    ctx.quadraticCurveTo(vx, vy + (floorY - vy) * 0.03, vx + w * 0.18, vy + (floorY - vy) * 0.07);
    ctx.lineTo(vx + w * 0.18, vy + (floorY - vy) * 0.12);
    ctx.lineTo(vx - w * 0.18, vy + (floorY - vy) * 0.12);
    ctx.closePath(); ctx.fill();
  }

  function renderOceanBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    ensureStatic(4, drawOceanStatic);

    // Stars
    SJ._oceanStars.forEach(function (s) {
      s.twinkle += s.twinkleSpd;
      var sx = vx + s.nx * w * 0.52;
      var sy = vy + s.ny * h * 0.52;
      if (sy > vy + (SJ.floorY - vy) * 0.08) return;
      var tw    = Math.sin(s.twinkle);
      var alpha = 0.22 + tw * 0.18;
      ctx.globalAlpha = Math.max(0, alpha) * 0.8;
      ctx.fillStyle   = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      ctx.beginPath(); ctx.arc(sx, sy, Math.max(0.1, s.size * 0.85), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Waves — sorted by depth (far to near)
    var sortedWaves = SJ._perspWaves.slice().sort(function (a, b) { return a.depthFrac - b.depthFrac; });
    sortedWaves.forEach(function (wv) {
      var df = wv.depthFrac;
      var wY = lerp(vy, SJ.floorY, df);
      var numPts = 18;
      var wAlpha = wv.alpha * df;

      ctx.strokeStyle = 'rgba(0,200,220,' + wAlpha + ')';
      ctx.lineWidth   = Math.max(0.4, df * 1.8);
      ctx.beginPath();
      for (var p = 0; p <= numPts; p++) {
        var f  = p / numPts;
        var wx = lerp(lerp(vx, 0, df), lerp(vx, w, df), f);
        var wy = wY + Math.sin(f * w * wv.freq + t * wv.speed + wv.phase) * wv.amplitude * df;
        if (p === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Foam crest
      if (wv.hasFoam && df > 0.3) {
        ctx.strokeStyle = 'rgba(200,240,255,' + wAlpha * 0.5 + ')';
        ctx.lineWidth   = Math.max(0.3, df * 0.8);
        ctx.beginPath();
        for (var p2 = 0; p2 <= numPts; p2++) {
          var f2  = p2 / numPts;
          var wx2 = lerp(lerp(vx, 0, df), lerp(vx, w, df), f2);
          var wy2 = wY + Math.sin(f2 * w * wv.freq + t * wv.speed + wv.phase) * wv.amplitude * df - df * 2;
          if (p2 === 0) ctx.moveTo(wx2, wy2); else ctx.lineTo(wx2, wy2);
        }
        ctx.stroke();
      }
    });

    // Bioluminescence sparks
    for (var bi = 0; bi < 8; bi++) {
      var bfrac = (t * 0.3 + bi * 0.137) % 1;
      var bx = vx + Math.cos(bi * 1.57) * bfrac * w * 0.4;
      var bY = lerp(vy, SJ.floorY, 0.3 + bfrac * 0.6);
      ctx.fillStyle = 'rgba(0,255,180,' + (1 - bfrac) * 0.25 + ')';
      ctx.beginPath(); ctx.arc(bx, bY, 1.5 + bfrac * 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // BACKGROUND DISPATCHER
  // ─────────────────────────────────────────────────────────────
  SJ.renderBackground = function () {
    var ctx = SJ.ctx;
    switch (SJ.currentZoneIdx) {
      case 0: renderCityBg(ctx);         break;
      case 1: renderNorthernLightsBg(ctx); break;
      case 2: renderSpaceBg(ctx);        break;
      case 3: renderNeonCityBg(ctx);     break;
      case 4: renderOceanBg(ctx);        break;
      default: renderCityBg(ctx);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ZONE MANAGEMENT (unchanged from original)
  // ─────────────────────────────────────────────────────────────
  SJ.updateZone = function (dt) {
    if (SJ.transitioning) return;
    SJ.zoneTimer += dt;
    if (SJ.zoneTimer >= SJ.zoneDuration) {
      SJ.zoneTimer = 0;
      startNextZone();
    }
  };

  function startNextZone() {
    var nextIdx = (SJ.currentZoneIdx + 1) % SJ.zones.length;
    if (nextIdx === 0) SJ.cycleCount++;
    SJ.prevZoneIdx    = SJ.currentZoneIdx;
    SJ.currentZoneIdx = nextIdx;
    invalidateStatic();

    SJ.transitioning      = true;
    SJ.gameState          = 'transitioning';
    SJ.transitionTimer    = 0;
    SJ.transitionAlpha    = 0;

    var zone = SJ.zones[nextIdx];
    SJ.nowPlayingText  = zone.displayTitle;
    SJ.nowPlayingTimer = 5500;
    SJ.titleCardText   = zone.name + ' — ' + zone.subtitle;
    SJ.titleCardTimer  = 3200;

    if (SJ.playSong) SJ.playSong(nextIdx);
    if (SJ.spawnZoneTransitionBurst) SJ.spawnZoneTransitionBurst();
  }

  SJ.updateTransition = function (dt) {
    if (!SJ.transitioning) return;
    SJ.transitionTimer += dt;
    var pct = SJ.transitionTimer / SJ.transitionDuration;
    if (pct < 0.5) {
      SJ.transitionAlpha = pct * 2;
    } else {
      SJ.transitionAlpha = (1 - pct) * 2;
    }
    if (SJ.transitionTimer >= SJ.transitionDuration) {
      SJ.transitioning   = false;
      SJ.transitionAlpha = 0;
      SJ.gameState       = 'playing';
    }
  };

  SJ.renderNowPlaying = function () {
    if (!SJ.nowPlayingTimer || SJ.nowPlayingTimer <= 0) return;
    SJ.nowPlayingTimer -= SJ.dt || 16;
    var ctx  = SJ.ctx;
    var w    = SJ.width;
    var pct  = SJ.nowPlayingTimer / 5500;
    var fade = pct > 0.85 ? (1 - pct) / 0.15 : (pct < 0.12 ? pct / 0.12 : 1);

    ctx.save();
    ctx.globalAlpha = fade * 0.88;
    var zone    = SJ.zones[SJ.currentZoneIdx];
    var accent  = (zone && zone.accentColors[0]) || '#fff';

    var padX = 18, padY = 8, bh = 46, bw = Math.min(340, w * 0.62);
    var bx   = 16, by   = SJ.height - 72;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();

    ctx.fillStyle = accent;
    ctx.font      = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NOW PLAYING', bx + padX, by + padY + 11);

    ctx.fillStyle = '#fff';
    ctx.font      = 'bold 14px "Oswald", sans-serif';
    ctx.fillText(SJ.nowPlayingText || '', bx + padX, by + padY + 29);

    ctx.globalAlpha = 1;
    ctx.textAlign   = 'left';
    ctx.restore();
  };

  SJ.renderTitleCard = function () {
    if (!SJ.titleCardTimer || SJ.titleCardTimer <= 0) return;
    SJ.titleCardTimer -= SJ.dt || 16;
    var ctx  = SJ.ctx;
    var w    = SJ.width;
    var pct  = SJ.titleCardTimer / 3200;
    var fade = pct > 0.82 ? (1 - pct) / 0.18 : (pct < 0.15 ? pct / 0.15 : 1);

    ctx.save();
    ctx.globalAlpha = fade;
    var zone   = SJ.zones[SJ.currentZoneIdx];
    var accent = (zone && zone.accentColors[0]) || '#fff';
    var pulse  = 1 + 0.04 * Math.sin(SJ.elapsed * 0.003);

    ctx.translate(w / 2, SJ.height * 0.34);
    ctx.scale(pulse, pulse);
    ctx.textAlign   = 'center';
    ctx.shadowBlur  = 18;
    ctx.shadowColor = accent;

    ctx.fillStyle = accent;
    ctx.font      = 'bold ' + Math.min(38, w * 0.052) + 'px "Oswald", sans-serif';
    ctx.fillText((zone && zone.name) || '', 0, 0);

    ctx.fillStyle   = 'rgba(255,255,255,0.7)';
    ctx.font        = Math.min(16, w * 0.022) + 'px "Share Tech Mono", monospace';
    ctx.shadowBlur  = 0;
    ctx.fillText((zone && zone.subtitle) || '', 0, 28);

    ctx.globalAlpha = 1;
    ctx.restore();
  };

  SJ.getZoneConfig = function (idx) {
    return SJ.zones[idx] || SJ.zones[0];
  };

})();
