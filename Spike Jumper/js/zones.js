/**
 * Spike Jumper — zones.js (Rich 3rd-Person Perspective)
 * Static elements pre-rendered once to an offscreen canvas; only animated
 * overlays (aurora, warp stars, rain, waves) drawn per frame.
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
  // PRE-GENERATED ELEMENTS
  // ─────────────────────────────────────────────────────────────
  function generateBuildings() {
    var buildings = [], styles = ['glass', 'brick', 'concrete', 'tower'];
    for (var i = 0; i < 30; i++) {
      buildings.push({
        side:       i % 2 === 0 ? 'left' : 'right',
        depthFrac:  0.06 + Math.random() * 0.88,
        widthFrac:  0.055 + Math.random() * 0.17,
        heightFrac: 0.18 + Math.random() * 0.72,
        style:      styles[i % 4],
        hue:        195 + Math.random() * 45,
        lit:        36 + Math.random() * 28,
        sat:        12 + Math.random() * 22,
        windowLit:  Math.random() < 0.58,
        hasAntenna: Math.random() < 0.40,
        phase:      Math.random() * Math.PI * 2,
      });
    }
    return buildings;
  }

  function generateNeonBuildings() {
    var neons = [];
    for (var i = 0; i < 16; i++) {
      var h = Math.floor(Math.random() * 360);
      neons.push({
        side:         i % 2 === 0 ? 'left' : 'right',
        depthFrac:    0.08 + Math.random() * 0.84,
        widthFrac:    0.055 + Math.random() * 0.15,
        heightFrac:   0.18 + Math.random() * 0.68,
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
        size:       0.3 + Math.pow(Math.random(), 2.5) * 2.2,
        twinkle:    Math.random() * Math.PI * 2,
        twinkleSpd: 0.012 + Math.random() * 0.035,
        r: 180 + Math.floor(Math.random() * 75),
        g: 180 + Math.floor(Math.random() * 75),
        b: 200 + Math.floor(Math.random() * 55),
        bright: Math.random() < 0.06,
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
        amplitude: 3 + Math.random() * 14,
        freq:      0.007 + Math.random() * 0.015,
        phase:     Math.random() * Math.PI * 2,
        speed:     0.25 + Math.random() * 0.8,
        alpha:     0.18 + Math.random() * 0.42,
        hasFoam:   Math.random() < 0.45,
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
      drawFn(_staticCtx, w, h);
    }
    SJ.ctx.drawImage(_staticBg, 0, 0);
  }

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

    // Sky gradient
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0,    '#0c1c45');
    sky.addColorStop(0.25, '#1a3a80');
    sky.addColorStop(0.48, '#4a8ec8');
    sky.addColorStop(0.66, '#f0a050');
    sky.addColorStop(0.82, '#e05820');
    sky.addColorStop(1,    '#c03810');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    // Sun radial glow
    var sunX = vx, sunY = vy - h * 0.09;
    var sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.48);
    sg.addColorStop(0,    'rgba(255,230,90,0.55)');
    sg.addColorStop(0.15, 'rgba(255,170,50,0.18)');
    sg.addColorStop(0.45, 'rgba(255,100,20,0.06)');
    sg.addColorStop(1,    'transparent');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);

    // Crepuscular rays (8 wide fan beams, drawn once)
    ctx.save(); ctx.globalAlpha = 0.055;
    for (var ri = 0; ri < 8; ri++) {
      var rayA = (ri / 8) * Math.PI * 2 + ri * 0.18;
      var rayL = w * 0.7;
      var rayW = 18 + (ri % 3) * 10;
      ctx.save(); ctx.translate(sunX, sunY); ctx.rotate(rayA);
      var rg2 = ctx.createLinearGradient(0, 0, rayL, 0);
      rg2.addColorStop(0,   'rgba(255,230,130,0.9)');
      rg2.addColorStop(0.5, 'rgba(255,180,60,0.3)');
      rg2.addColorStop(1,   'transparent');
      ctx.fillStyle = rg2;
      ctx.beginPath();
      ctx.moveTo(0, -rayW / 2); ctx.lineTo(rayL, 0); ctx.lineTo(0, rayW / 2);
      ctx.fill(); ctx.restore();
    }
    ctx.restore();

    // Sun disk
    ctx.fillStyle = '#FFE040';
    ctx.beginPath(); ctx.arc(sunX, sunY, 38, 0, Math.PI * 2); ctx.fill();
    // Inner bright core
    ctx.fillStyle = 'rgba(255,255,200,0.7)';
    ctx.beginPath(); ctx.arc(sunX, sunY, 20, 0, Math.PI * 2); ctx.fill();

    // Horizon haze
    var hz = ctx.createRadialGradient(vx, vy, 0, vx, vy, w * 0.42);
    hz.addColorStop(0,   'rgba(255,180,60,0.32)');
    hz.addColorStop(0.55,'rgba(255,110,20,0.08)');
    hz.addColorStop(1,   'transparent');
    ctx.fillStyle = hz; ctx.fillRect(0, 0, w, h);

    // Ground
    var grd = ctx.createLinearGradient(0, vy, 0, floorY);
    grd.addColorStop(0, '#9a6e48'); grd.addColorStop(0.4, '#7a5538'); grd.addColorStop(1, '#2e2424');
    ctx.fillStyle = grd; ctx.fillRect(0, vy, w, floorY - vy);

    // Road lines
    ctx.strokeStyle = 'rgba(140,110,60,0.22)'; ctx.lineWidth = 0.8;
    for (var i = 1; i <= 8; i++) {
      var gy = lerp(vy, floorY, i / 8);
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }
    for (var j = 0; j <= 5; j++) {
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(w * j / 5, floorY); ctx.stroke();
    }
    // Sun road reflection
    ctx.fillStyle = 'rgba(255,155,40,0.22)';
    ctx.beginPath();
    ctx.moveTo(vx - 16, vy); ctx.lineTo(vx + 16, vy);
    ctx.lineTo(vx + w * 0.22, floorY); ctx.lineTo(vx - w * 0.22, floorY);
    ctx.closePath(); ctx.fill();

    // City skyline silhouette (far background)
    ctx.fillStyle = 'rgba(12,20,45,0.55)';
    var skylineH = (vy - ceilY) * 0.7;
    for (var si = 0; si < 22; si++) {
      var frac = si / 22;
      var sx = frac * w;
      var sH = skylineH * (0.3 + Math.sin(si * 2.7 + 1.3) * 0.45 + (si % 3 === 0 ? 0.2 : 0));
      ctx.fillRect(sx, vy - sH, w / 22 + 1, sH);
    }

    // City buildings on sides
    SJ._perspBuildings.forEach(function (b) {
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
      if (bx + bw < 0 || bx > w) return;

      ctx.globalAlpha = 0.75 + df * 0.25;

      // Building face
      var faceGrad = ctx.createLinearGradient(bx, top, bx + bw, top);
      var lt = b.lit;
      faceGrad.addColorStop(0,   'hsl(' + b.hue + ',' + b.sat + '%,' + (lt - 8) + '%)');
      faceGrad.addColorStop(0.5, 'hsl(' + b.hue + ',' + (b.sat + 8) + '%,' + (lt + 10) + '%)');
      faceGrad.addColorStop(1,   'hsl(' + b.hue + ',' + b.sat + '%,' + (lt - 6) + '%)');
      ctx.fillStyle = faceGrad;
      ctx.fillRect(bx, top, bw, bh);

      // Windows
      if (bw > 7 && bh > 10) {
        var ww = Math.max(2, bw * 0.11);
        var wh = Math.max(1, bh * 0.06);
        var cols = Math.max(1, Math.floor(bw / (ww * 2.4)));
        var rows = Math.max(1, Math.floor(bh / (wh * 2.8)));
        ctx.fillStyle = b.windowLit ? 'rgba(255,215,80,0.6)' : 'rgba(30,50,90,0.35)';
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            if (!b.windowLit && (r + c) % 3 === 0) continue;
            ctx.fillRect(bx + bw * 0.08 + c * bw / cols, top + wh * 1.4 + r * bh / rows, ww, wh);
          }
        }
      }

      // Sunset tint on top
      var st = ctx.createLinearGradient(bx, top, bx, top + bh * 0.4);
      st.addColorStop(0, 'rgba(255,150,40,' + (0.18 * df) + ')');
      st.addColorStop(1, 'transparent');
      ctx.fillStyle = st; ctx.fillRect(bx, top, bw, bh * 0.4);

      // Antenna
      if (b.hasAntenna && bw > 8) {
        ctx.fillStyle = 'rgba(60,60,70,0.9)';
        ctx.fillRect(bx + bw * 0.5 - 1, top - bh * 0.12, 2, bh * 0.12);
        ctx.fillStyle = 'rgba(255,30,30,0.85)';
        ctx.beginPath(); ctx.arc(bx + bw * 0.5, top - bh * 0.12, 2.5, 0, Math.PI * 2); ctx.fill();
      }

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
    ctx.strokeStyle = 'rgba(255,200,50,0.55)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([22, 26]); ctx.lineDashOffset = -dashScroll;
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx - w * 0.12, SJ.floorY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + w * 0.12, SJ.floorY); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;

    // Birds (6 V-shapes)
    ctx.lineWidth = 1;
    for (var bi = 0; bi < 6; bi++) {
      var bf = (t * 0.055 + bi * 0.17) % 1;
      var bx = lerp(vx, w * (0.1 + (bi * 0.14) % 0.8), bf);
      var by = lerp(vy, SJ.ceilY + h * 0.12 * (bi % 3 + 1), bf * 0.75);
      var bs = 3 + bf * 8;
      ctx.save(); ctx.globalAlpha = 0.4 * (1 - bf); ctx.strokeStyle = '#1a2855';
      ctx.beginPath();
      ctx.moveTo(bx - bs, by + bs * 0.3); ctx.lineTo(bx, by); ctx.lineTo(bx + bs, by + bs * 0.3);
      ctx.stroke(); ctx.restore();
    }
  }

  // ═════════════════════════════════════════════════════════════
  // ZONE 1 — NORTHERN LIGHTS  (arctic canyon with mountains)
  // ═════════════════════════════════════════════════════════════

  function drawMountainRange(ctx, w, h, vx, vy, floorY, side, colorA, colorB, heightMult, widthReach) {
    var isLeft = side === 'left';
    var edgeX  = isLeft ? 0 : w;
    var vpEdge = isLeft ? vx * widthReach : w - (w - vx) * widthReach;

    // Rear mountain layer (darker, smaller)
    ctx.fillStyle = colorB;
    ctx.beginPath();
    ctx.moveTo(edgeX, floorY);
    var rSteps = 10;
    for (var i = 0; i <= rSteps; i++) {
      var f = i / rSteps;
      var x = isLeft ? lerp(0, vpEdge * 0.88, f) : lerp(w, w - (w - vpEdge * 0.88), f);
      var baseH = (floorY - vy) * heightMult * (1 - f * 0.75);
      var jitter = i % 2 === 0 ? baseH * 0.18 : -baseH * 0.12;
      ctx.lineTo(x, Math.max(vy + 8, floorY - baseH + jitter));
    }
    ctx.lineTo(isLeft ? vpEdge * 0.88 : w - (w - vpEdge * 0.88), floorY);
    ctx.closePath(); ctx.fill();

    // Front mountain layer (brighter, taller)
    ctx.fillStyle = colorA;
    ctx.beginPath();
    ctx.moveTo(edgeX, floorY);
    var fSteps = 12;
    for (var ii = 0; ii <= fSteps; ii++) {
      var ff = ii / fSteps;
      var xx = isLeft ? lerp(0, vpEdge, ff) : lerp(w, w - (w - vpEdge), ff);
      var bh2 = (floorY - vy) * heightMult * 1.15 * (1 - ff * 0.82);
      var jt2 = ii % 2 === 1 ? bh2 * 0.32 : -bh2 * 0.08;
      ctx.lineTo(xx, Math.max(vy + 4, floorY - bh2 + jt2));
    }
    ctx.lineTo(vpEdge, floorY);
    ctx.closePath(); ctx.fill();

    // Snow caps on peaks
    ctx.save();
    ctx.beginPath();
    for (var k = 1; k < fSteps; k++) {
      var fk = k / fSteps;
      var xk = isLeft ? lerp(0, vpEdge, fk) : lerp(w, w - (w - vpEdge), fk);
      var bhk = (floorY - vy) * heightMult * 1.15 * (1 - fk * 0.82);
      var jtk = k % 2 === 1 ? bhk * 0.32 : -bhk * 0.08;
      var peakY = Math.max(vy + 4, floorY - bhk + jtk);
      if (k % 2 === 1 && bhk > (floorY - vy) * 0.08) {
        var capW = Math.max(4, (floorY - vy) * heightMult * (1 - fk) * 0.12);
        ctx.moveTo(xk, peakY);
        ctx.lineTo(xk - capW, peakY + capW * 1.6);
        ctx.lineTo(xk + capW, peakY + capW * 1.6);
        ctx.closePath();
      }
    }
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(210,225,255,0.9)';
    ctx.fill();
    ctx.restore();
  }

  function drawNLStatic(ctx, w, h) {
    var vx = w / 2, vy = h * 0.38;
    var ceilY = 55, floorY = h - 60;

    // Arctic sky
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0,   '#010510');
    sky.addColorStop(0.35,'#031020');
    sky.addColorStop(0.6, '#061428');
    sky.addColorStop(1,   '#0d2035');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    // Dense static star field
    for (var s = 0; s < 200; s++) {
      var sx = Math.random() * w;
      var sy = Math.random() * vy;
      var ss = 0.2 + Math.random() * 1.4;
      var sa = 0.2 + Math.random() * 0.7;
      ctx.fillStyle = 'rgba(' + (180 + Math.floor(Math.random() * 75)) + ',' +
                                (180 + Math.floor(Math.random() * 75)) + ',' +
                                (200 + Math.floor(Math.random() * 55)) + ',' + sa + ')';
      ctx.fillRect(sx, sy, ss, ss);
    }

    // Full moon
    var moonX = vx + w * 0.26, moonY = vy - h * 0.2;
    var mg = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 100);
    mg.addColorStop(0,   'rgba(220,235,255,0.22)');
    mg.addColorStop(0.45,'rgba(180,200,245,0.08)');
    mg.addColorStop(1,   'transparent');
    ctx.fillStyle = mg; ctx.fillRect(moonX - 100, moonY - 100, 200, 200);
    var md = ctx.createRadialGradient(moonX - 3, moonY - 3, 0, moonX, moonY, 28);
    md.addColorStop(0, '#fff'); md.addColorStop(0.5, '#dde8ff'); md.addColorStop(1, '#aac0ee');
    ctx.fillStyle = md;
    ctx.beginPath(); ctx.arc(moonX, moonY, 28, 0, Math.PI * 2); ctx.fill();
    // Moon craters
    ctx.fillStyle = 'rgba(160,180,220,0.35)';
    [[moonX - 9, moonY + 5, 5], [moonX + 8, moonY - 8, 4], [moonX + 2, moonY + 12, 3]].forEach(function (c) {
      ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, Math.PI * 2); ctx.fill();
    });

    // Mountains — the centrepiece of this zone
    // Back distant range (dark blue-grey)
    drawMountainRange(ctx, w, h, vx, vy, floorY, 'left',  '#0d1e30', '#07111f', 0.52, 0.80);
    drawMountainRange(ctx, w, h, vx, vy, floorY, 'right', '#0d1e30', '#07111f', 0.52, 0.80);
    // Mid range (slightly brighter)
    drawMountainRange(ctx, w, h, vx, vy, floorY, 'left',  '#0f2438', '#090f1c', 0.72, 0.70);
    drawMountainRange(ctx, w, h, vx, vy, floorY, 'right', '#0f2438', '#090f1c', 0.72, 0.70);
    // Front foreground peaks (boldest)
    drawMountainRange(ctx, w, h, vx, vy, floorY, 'left',  '#142c44', '#0b1828', 0.92, 0.58);
    drawMountainRange(ctx, w, h, vx, vy, floorY, 'right', '#142c44', '#0b1828', 0.92, 0.58);

    // Aurora reflection on ice floor
    var snowGrad = ctx.createLinearGradient(0, vy, 0, floorY);
    snowGrad.addColorStop(0, '#0d2235'); snowGrad.addColorStop(1, '#1e404e');
    ctx.fillStyle = snowGrad; ctx.fillRect(0, vy, w, floorY - vy);
    // Floor grid
    ctx.strokeStyle = 'rgba(100,160,200,0.1)'; ctx.lineWidth = 0.7;
    for (var gi = 1; gi <= 6; gi++) {
      var gy = lerp(vy, floorY, gi / 6);
      ctx.beginPath(); ctx.moveTo(lerp(vx, 0, gi / 6), gy); ctx.lineTo(lerp(vx, w, gi / 6), gy); ctx.stroke();
    }

    // Frost vignette
    var fv = ctx.createRadialGradient(vx, vy, h * 0.06, vx, vy, h * 0.62);
    fv.addColorStop(0, 'transparent'); fv.addColorStop(0.72, 'transparent');
    fv.addColorStop(1, 'rgba(4,14,28,0.55)');
    ctx.fillStyle = fv; ctx.fillRect(0, 0, w, h);
  }

  function renderNorthernLightsBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    ensureStatic(1, drawNLStatic);

    // Twinkling stars
    SJ._perspStars.forEach(function (s) {
      s.twinkle += s.twinkleSpd;
      var screenX = vx + s.nx * w * 0.52;
      var screenY = vy + s.ny * h * 0.52;
      if (screenY > vy - h * 0.02) return;
      var tw = Math.sin(s.twinkle);
      var alpha = 0.28 + tw * 0.22;
      ctx.globalAlpha = Math.max(0, alpha) * 0.7;
      ctx.fillStyle = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      ctx.beginPath(); ctx.arc(screenX, screenY, Math.max(0.1, s.size), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Aurora — 3 ribbons × 6 segments
    var aColors = [
      [0, 255, 136, 0.55],
      [168, 85, 247, 0.42],
      [0, 188, 212, 0.48],
    ];
    ctx.save();
    aColors.forEach(function (col, ai) {
      var r = col[0], g = col[1], b = col[2], maxA = col[3];
      var phase = ai * 1.4 + t * (0.08 + ai * 0.025);
      var ry0   = vy - h * (0.12 + ai * 0.07) + Math.sin(phase * 0.6) * h * 0.04;
      var rh    = h * (0.04 + Math.sin(t * 0.1 + ai) * 0.012);

      ctx.globalAlpha = maxA * (0.78 + Math.sin(t * 0.14 + ai * 0.9) * 0.22);
      ctx.globalCompositeOperation = 'lighter';

      for (var seg = 0; seg < 6; seg++) {
        var f0 = seg / 6, f1 = (seg + 1) / 6;
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

    // Aurora shimmer on mountain peaks (subtle coloured glow at VP base)
    ctx.save();
    ctx.globalAlpha = 0.12;
    var ag2 = ctx.createLinearGradient(0, vy, 0, vy + (SJ.floorY - vy) * 0.25);
    ag2.addColorStop(0, 'rgba(0,255,136,0.4)'); ag2.addColorStop(1, 'transparent');
    ctx.fillStyle = ag2; ctx.fillRect(0, vy, w, (SJ.floorY - vy) * 0.25);
    ctx.restore();
  }

  // ═════════════════════════════════════════════════════════════
  // ZONE 2 — DEEP SPACE  (star warp + planets + nebula)
  // ═════════════════════════════════════════════════════════════

  function drawSpaceStatic(ctx, w, h) {
    var vx = w / 2, vy = h * 0.38;

    ctx.fillStyle = '#000005'; ctx.fillRect(0, 0, w, h);

    // Dense static star field (drawn once — free!)
    for (var si = 0; si < 350; si++) {
      var sx = Math.random() * w;
      var sy = Math.random() * h * 0.85;
      var ss = Math.random() < 0.08 ? (0.8 + Math.random() * 1.4) : (0.2 + Math.random() * 0.7);
      var sa = 0.25 + Math.random() * 0.75;
      var sr = 160 + Math.floor(Math.random() * 95);
      var sg = 160 + Math.floor(Math.random() * 95);
      var sb = 200 + Math.floor(Math.random() * 55);
      ctx.fillStyle = 'rgba(' + sr + ',' + sg + ',' + sb + ',' + sa + ')';
      ctx.fillRect(sx, sy, ss, ss);
    }

    // Milky Way diagonal band
    ctx.save(); ctx.globalAlpha = 0.14;
    var mw = ctx.createLinearGradient(0, h * 0.08, w, h * 0.68);
    mw.addColorStop(0,    'rgba(200,210,255,0)');
    mw.addColorStop(0.3,  'rgba(200,210,255,0.28)');
    mw.addColorStop(0.5,  'rgba(215,220,255,0.18)');
    mw.addColorStop(0.7,  'rgba(200,210,255,0.1)');
    mw.addColorStop(1,    'rgba(200,210,255,0)');
    ctx.fillStyle = mw; ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // Nebula — two overlapping radial glows
    var neb1 = ctx.createRadialGradient(vx, vy * 0.88, 0, vx, vy * 0.88, w * 0.48);
    neb1.addColorStop(0,   'hsla(280,60%,50%,0.18)');
    neb1.addColorStop(0.45,'hsla(280,60%,50%,0.07)');
    neb1.addColorStop(1,   'transparent');
    ctx.fillStyle = neb1; ctx.fillRect(0, 0, w, h);
    var neb2 = ctx.createRadialGradient(vx * 0.55, vy * 1.3, 0, vx * 0.55, vy * 1.3, w * 0.35);
    neb2.addColorStop(0,   'hsla(210,70%,55%,0.15)');
    neb2.addColorStop(0.55,'hsla(210,70%,55%,0.05)');
    neb2.addColorStop(1,   'transparent');
    ctx.fillStyle = neb2; ctx.fillRect(0, 0, w, h);

    // Ringed planet (upper right) — large and detailed
    var px = w * 0.78, py = h * 0.17;
    var pSize = Math.min(w, h) * 0.065;
    // Planet glow
    var pg = ctx.createRadialGradient(px, py, 0, px, py, pSize * 2.8);
    pg.addColorStop(0,   'rgba(180,130,60,0.22)');
    pg.addColorStop(0.5, 'rgba(140,90,40,0.08)');
    pg.addColorStop(1,   'transparent');
    ctx.fillStyle = pg; ctx.fillRect(px - pSize * 2.8, py - pSize * 2.8, pSize * 5.6, pSize * 5.6);
    // Planet body
    var pb = ctx.createRadialGradient(px - pSize * 0.2, py - pSize * 0.2, 0, px, py, pSize);
    pb.addColorStop(0,   '#d4904a');
    pb.addColorStop(0.4, '#a0682a');
    pb.addColorStop(0.8, '#7a4c20');
    pb.addColorStop(1,   '#3a2010');
    ctx.fillStyle = pb;
    ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2); ctx.fill();
    // Cloud bands
    for (var bi = 0; bi < 4; bi++) {
      var by2 = py - pSize * (0.5 - bi * 0.25);
      var bw2 = Math.sqrt(Math.max(0, pSize * pSize - (by2 - py) * (by2 - py)));
      if (bw2 < 2) continue;
      ctx.fillStyle = 'rgba(' + (160 + bi * 10) + ',' + (100 + bi * 8) + ',50,0.22)';
      ctx.fillRect(px - bw2, by2 - 2, bw2 * 2, 4);
    }
    // Rings
    ctx.save();
    ctx.strokeStyle = 'rgba(200,165,80,0.6)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(px, py + pSize * 0.15, pSize * 1.65, pSize * 0.35, -0.18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(175,140,60,0.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(px, py + pSize * 0.18, pSize * 1.95, pSize * 0.42, -0.18, 0, Math.PI * 2); ctx.stroke();
    // Ring shadow clip (behind planet)
    ctx.fillStyle = 'rgba(40,25,12,0.7)';
    ctx.beginPath(); ctx.arc(px, py, pSize, Math.PI * 0.05, Math.PI * 0.95); ctx.fill();
    ctx.restore();

    // Gas giant (lower left) — large, colourful
    var gx = w * 0.13, gy = h * 0.68;
    var gSize = Math.min(w, h) * 0.055;
    var gg = ctx.createRadialGradient(gx - gSize * 0.25, gy - gSize * 0.25, 0, gx, gy, gSize);
    gg.addColorStop(0,   '#88aaee');
    gg.addColorStop(0.4, '#5580bb');
    gg.addColorStop(0.75,'#334488');
    gg.addColorStop(1,   '#1a2244');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(gx, gy, gSize, 0, Math.PI * 2); ctx.fill();
    // Atmospheric bands
    for (var ci = 0; ci < 3; ci++) {
      var cy2 = gy - gSize * (0.3 - ci * 0.28);
      var cw2 = Math.sqrt(Math.max(0, gSize * gSize - (cy2 - gy) * (cy2 - gy)));
      if (cw2 < 2) continue;
      ctx.fillStyle = 'rgba(120,160,220,0.2)';
      ctx.fillRect(gx - cw2, cy2 - 2, cw2 * 2, 4);
    }
    // Small moon orbiting gas giant
    ctx.fillStyle = 'rgba(180,185,200,0.9)';
    ctx.beginPath(); ctx.arc(gx + gSize * 1.5, gy - gSize * 0.5, gSize * 0.2, 0, Math.PI * 2); ctx.fill();

    // Galaxy grid lines
    ctx.strokeStyle = 'rgba(70,70,160,0.07)'; ctx.lineWidth = 0.5;
    var gridFloorY = h - 60;
    for (var j = 1; j <= 5; j++) {
      var jy = lerp(vy, gridFloorY, j / 5);
      ctx.beginPath(); ctx.moveTo(lerp(vx, 0, j / 5), jy); ctx.lineTo(lerp(vx, w, j / 5), jy); ctx.stroke();
    }
  }

  function renderSpaceBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;

    ensureStatic(2, drawSpaceStatic);

    // Warp stars — advance each frame
    SJ._warpStars.forEach(function (s) {
      s.dist += s.speed;
      if (s.dist > 1) s.dist -= 0.95;

      var screenX = vx + Math.cos(s.angle) * s.dist * w * 0.54;
      var screenY = vy + Math.sin(s.angle) * s.dist * h * 0.54;
      var streak  = s.speed * s.dist * 38;
      var ex = screenX - Math.cos(s.angle) * streak;
      var ey = screenY - Math.sin(s.angle) * streak;
      var size  = Math.max(0.2, s.size * s.dist);
      var alpha = Math.min(1, s.dist * 1.8) * 0.88;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      ctx.lineWidth   = Math.max(0.3, size * 0.55);
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(screenX, screenY); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  // ═════════════════════════════════════════════════════════════
  // ZONE 3 — NEON NIGHT  (buildings as static + flickering signs)
  // ═════════════════════════════════════════════════════════════

  function drawNeonStatic(ctx, w, h) {
    var vx = w / 2, vy = h * 0.38;
    var ceilY = 55, floorY = h - 60;

    // Dark sky
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#06000f'); sky.addColorStop(0.5, '#0e0018'); sky.addColorStop(1, '#150025');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    // Distant city silhouette at vanishing point
    ctx.fillStyle = 'rgba(15,0,30,0.7)';
    for (var di = 0; di < 30; di++) {
      var df = di / 30;
      var dsx = lerp(vx, 0, 0.1 + Math.sin(di * 2.3) * 0.08);
      var dsy = lerp(vx, w, 0.1 + Math.sin(di * 1.7) * 0.08);
      var dh = (vy - ceilY) * (0.15 + Math.sin(di * 3.1 + 1.2) * 0.35);
      if (di % 2 === 0) {
        ctx.fillRect(dsx - (di / 30) * w * 0.015, vy - dh, (di / 30) * w * 0.04, dh);
      } else {
        ctx.fillRect(dsy - (di / 30) * w * 0.04, vy - dh, (di / 30) * w * 0.03, dh);
      }
    }

    // Neon building BODIES (static — only signs flicker per-frame)
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
      if (bx + bw < 0 || bx > w) return;

      ctx.globalAlpha = 0.65 + df * 0.32;

      // Dark body
      ctx.fillStyle = 'hsl(' + b.neonHue + ',18%,6%)';
      ctx.fillRect(bx, top, bw, bh);

      // Faint static window grid
      if (bw > 6 && bh > 8) {
        var ww = Math.max(2, bw * 0.1);
        var wh = Math.max(1, bh * 0.055);
        var cols = Math.max(1, Math.floor(bw / (ww * 2.5)));
        var rows = Math.max(1, Math.floor(bh / (wh * 3.0)));
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            // Dim off-hours windows
            var wc = 'hsla(' + b.neonHue + ',50%,35%,' + (0.12 + Math.random() * 0.12) + ')';
            ctx.fillStyle = wc;
            ctx.fillRect(bx + bw * 0.08 + c * bw / cols, top + wh + r * bh / rows, ww, wh);
          }
        }
      }

      // Subtle glow cast on floor
      if (df > 0.45) {
        var gc2 = ctx.createRadialGradient(bx + bw / 2, sf, 0, bx + bw / 2, sf, bw * 1.6);
        gc2.addColorStop(0, 'hsla(' + b.neonHue + ',100%,55%,0.07)'); gc2.addColorStop(1, 'transparent');
        ctx.fillStyle = gc2;
        ctx.fillRect(bx - bw * 0.4, sf, bw * 1.8, (floorY - sf) * 0.5);
      }

      ctx.globalAlpha = 1;
    });

    // Wet floor base
    var wetGrad = ctx.createLinearGradient(0, vy, 0, floorY);
    wetGrad.addColorStop(0, 'rgba(10,0,20,0.88)'); wetGrad.addColorStop(1, 'rgba(5,0,12,0.95)');
    ctx.fillStyle = wetGrad; ctx.fillRect(0, vy, w, floorY - vy);

    // Floor grid lines
    ctx.strokeStyle = 'rgba(80,0,120,0.18)'; ctx.lineWidth = 0.6;
    for (var gi = 1; gi <= 7; gi++) {
      var giy = lerp(vy, floorY, gi / 7);
      ctx.beginPath(); ctx.moveTo(lerp(vx, 0, gi / 7), giy); ctx.lineTo(lerp(vx, w, gi / 7), giy); ctx.stroke();
    }
    for (var gj = 0; gj <= 4; gj++) {
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(w * gj / 4, floorY); ctx.stroke();
    }
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
      SJ._lightningAlpha = 0.7 + Math.random() * 0.3;
      SJ._lightningTimer = 2500 + Math.random() * 8000;
    }
    if (SJ._lightningAlpha > 0) {
      ctx.fillStyle = 'rgba(220,200,255,' + SJ._lightningAlpha * 0.14 + ')';
      ctx.fillRect(0, 0, w, h);
      SJ._lightningAlpha = Math.max(0, SJ._lightningAlpha - 0.04);
    }

    // Flickering neon signs only (building bodies are on static canvas)
    SJ._neonBuildings.forEach(function (b) {
      var df = b.depthFrac;
      var nearX = b.side === 'left' ? 0 : w;
      var sx = lerp(vx, nearX, df);
      var bw = lerp(0, w * b.widthFrac, df);
      if (bw < 2) return;
      var sf = lerp(vy, floorY, df);
      var sc = lerp(vy, ceilY, df);
      var bh = (sf - sc) * b.heightFrac;
      var bx = b.side === 'left' ? sx - bw : sx;
      var top = sf - bh;
      if (bx + bw < 0 || bx > w) return;

      var flicker = 0.65 + 0.35 * Math.sin(t * b.flickerSpeed + b.flickerPhase);
      var signH   = Math.max(2, bh * 0.065);
      var y0      = top + signH * 1.5;

      ctx.globalAlpha = flicker * (0.62 + df * 0.35);
      for (var si = 0; si < b.numSigns && y0 + signH < sf; si++, y0 += signH * 3.2) {
        var col = 'hsl(' + (si % 2 === 0 ? b.neonHue : b.neonHue2) + ',100%,60%)';
        ctx.fillStyle = col;
        ctx.shadowBlur = 8; ctx.shadowColor = col;
        ctx.fillRect(bx + bw * 0.05, y0, bw * 0.9, signH);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    });

    // Rain — 22 streaks from VP
    ctx.strokeStyle = 'rgba(140,200,255,0.22)'; ctx.lineWidth = 0.7;
    for (var ri = 0; ri < 22; ri++) {
      var rf    = (t * 0.55 + ri * 0.047) % 1;
      var angle = (ri / 22) * Math.PI * 2;
      var rx0   = vx + Math.cos(angle) * rf * w * 0.56;
      var ry0   = vy + Math.sin(angle) * rf * h * 0.56;
      var len   = (6 + rf * 18) * (0.6 + Math.abs(Math.sin(angle)) * 0.6);
      ctx.save(); ctx.globalAlpha = (1 - rf) * 0.3;
      ctx.beginPath(); ctx.moveTo(rx0, ry0);
      ctx.lineTo(rx0 + Math.cos(angle) * len, ry0 + Math.sin(angle) * len);
      ctx.stroke(); ctx.restore();
    }

    // Neon reflections on wet floor
    ctx.save(); ctx.globalAlpha = 0.12;
    var refl = ctx.createLinearGradient(0, vy, 0, floorY);
    refl.addColorStop(0, 'rgba(255,0,255,0.5)'); refl.addColorStop(0.5, 'rgba(0,255,255,0.3)'); refl.addColorStop(1, 'transparent');
    ctx.fillStyle = refl; ctx.fillRect(0, vy, w, floorY - vy);
    ctx.restore();

    // Edge glows
    var eg1 = ctx.createLinearGradient(0, 0, 22, 0);
    eg1.addColorStop(0, 'rgba(255,0,255,0.2)'); eg1.addColorStop(1, 'transparent');
    ctx.fillStyle = eg1; ctx.fillRect(0, ceilY, 22, floorY - ceilY);
    var eg2 = ctx.createLinearGradient(w, 0, w - 22, 0);
    eg2.addColorStop(0, 'rgba(0,255,255,0.2)'); eg2.addColorStop(1, 'transparent');
    ctx.fillStyle = eg2; ctx.fillRect(w - 22, ceilY, 22, floorY - ceilY);
  }

  // ═════════════════════════════════════════════════════════════
  // ZONE 4 — OCEAN  (moonlit water + distant shore)
  // ═════════════════════════════════════════════════════════════

  function drawOceanStatic(ctx, w, h) {
    var vx = w / 2, vy = h * 0.38;
    var floorY = h - 60;

    // Sky
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0,   '#010510');
    sky.addColorStop(0.3, '#020c1e');
    sky.addColorStop(0.6, '#071530');
    sky.addColorStop(1,   '#0b1e38');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    // Dense star field in sky
    for (var si2 = 0; si2 < 220; si2++) {
      var sx2 = Math.random() * w;
      var sy2 = Math.random() * vy;
      var ss2 = Math.random() < 0.06 ? (0.8 + Math.random() * 1.2) : (0.2 + Math.random() * 0.6);
      var sa2 = 0.18 + Math.random() * 0.65;
      ctx.fillStyle = 'rgba(180,195,220,' + sa2 + ')';
      ctx.fillRect(sx2, sy2, ss2, ss2);
    }

    // Moon (large, dramatic)
    var moonX = vx + w * 0.2, moonY = vy - h * 0.22;
    // Outer corona rings
    var moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 130);
    moonGlow.addColorStop(0,   'rgba(200,220,255,0.22)');
    moonGlow.addColorStop(0.35,'rgba(170,195,245,0.09)');
    moonGlow.addColorStop(0.65,'rgba(140,170,230,0.04)');
    moonGlow.addColorStop(1,   'transparent');
    ctx.fillStyle = moonGlow; ctx.fillRect(moonX - 130, moonY - 130, 260, 260);
    // Moon halo ring
    ctx.strokeStyle = 'rgba(180,200,240,0.12)'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(moonX, moonY, 55, 0, Math.PI * 2); ctx.stroke();
    // Moon disk
    var moonDisk = ctx.createRadialGradient(moonX - 5, moonY - 5, 0, moonX, moonY, 30);
    moonDisk.addColorStop(0,   '#ffffff');
    moonDisk.addColorStop(0.4, '#ddeeff');
    moonDisk.addColorStop(1,   '#a8c0ee');
    ctx.fillStyle = moonDisk;
    ctx.beginPath(); ctx.arc(moonX, moonY, 30, 0, Math.PI * 2); ctx.fill();
    // Moon craters
    ctx.fillStyle = 'rgba(150,170,210,0.4)';
    [[moonX - 10, moonY + 6, 6], [moonX + 9, moonY - 9, 5], [moonX + 3, moonY + 14, 4]].forEach(function (c) {
      ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, Math.PI * 2); ctx.fill();
    });

    // Moonlight column on water
    var moonColGrad = ctx.createLinearGradient(moonX, vy, moonX, floorY);
    moonColGrad.addColorStop(0,   'rgba(200,220,255,0.28)');
    moonColGrad.addColorStop(0.45,'rgba(170,195,240,0.12)');
    moonColGrad.addColorStop(1,   'rgba(150,180,225,0)');
    ctx.fillStyle = moonColGrad;
    ctx.beginPath();
    ctx.moveTo(moonX - 18, vy); ctx.lineTo(moonX + 18, vy);
    ctx.lineTo(moonX + w * 0.18, floorY); ctx.lineTo(moonX - w * 0.18, floorY);
    ctx.closePath(); ctx.fill();

    // Ocean surface
    var oceanGrad = ctx.createLinearGradient(0, vy, 0, floorY);
    oceanGrad.addColorStop(0,   '#04121e');
    oceanGrad.addColorStop(0.4, '#061828');
    oceanGrad.addColorStop(1,   '#091f2e');
    ctx.fillStyle = oceanGrad; ctx.fillRect(0, vy, w, floorY - vy);

    // Horizon perspective lines
    ctx.strokeStyle = 'rgba(0,180,220,0.1)'; ctx.lineWidth = 0.6;
    for (var i = 1; i <= 7; i++) {
      var gy = lerp(vy, floorY, i / 7);
      ctx.beginPath(); ctx.moveTo(lerp(vx, 0, i / 7), gy); ctx.lineTo(lerp(vx, w, i / 7), gy); ctx.stroke();
    }
    for (var j = 0; j <= 4; j++) {
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(w * j / 4, floorY); ctx.stroke();
    }

    // Distant shoreline / island silhouette
    ctx.fillStyle = '#03101c';
    ctx.beginPath();
    ctx.moveTo(vx - w * 0.28, vy + (floorY - vy) * 0.07);
    ctx.quadraticCurveTo(vx - w * 0.1, vy + (floorY - vy) * 0.02, vx, vy + (floorY - vy) * 0.035);
    ctx.quadraticCurveTo(vx + w * 0.1, vy + (floorY - vy) * 0.02, vx + w * 0.28, vy + (floorY - vy) * 0.07);
    ctx.lineTo(vx + w * 0.28, vy + (floorY - vy) * 0.12);
    ctx.lineTo(vx - w * 0.28, vy + (floorY - vy) * 0.12);
    ctx.closePath(); ctx.fill();
    // Palm/tree silhouettes
    ctx.fillStyle = '#020c18';
    [[vx - w * 0.15, vy + (floorY - vy) * 0.06, 8],
     [vx + w * 0.12, vy + (floorY - vy) * 0.05, 6]].forEach(function (tree) {
      ctx.fillRect(tree[0] - 1, tree[1] - tree[2], 2, tree[2]);
      ctx.beginPath(); ctx.arc(tree[0], tree[1] - tree[2], tree[2] * 0.7, 0, Math.PI * 2); ctx.fill();
    });

    // Horizon mist
    var mistGrad = ctx.createLinearGradient(0, vy, 0, vy + (floorY - vy) * 0.2);
    mistGrad.addColorStop(0, 'rgba(10,30,60,0.55)'); mistGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = mistGrad; ctx.fillRect(0, vy, w, (floorY - vy) * 0.2);
  }

  function renderOceanBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    ensureStatic(4, drawOceanStatic);

    // Twinkling stars (overlay only)
    SJ._oceanStars.forEach(function (s) {
      s.twinkle += s.twinkleSpd;
      var sx = vx + s.nx * w * 0.52;
      var sy = vy + s.ny * h * 0.52;
      if (sy > vy - h * 0.02) return;
      var tw    = Math.sin(s.twinkle);
      var alpha = 0.22 + tw * 0.18;
      ctx.globalAlpha = Math.max(0, alpha) * 0.75;
      ctx.fillStyle   = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      ctx.beginPath(); ctx.arc(sx, sy, Math.max(0.1, s.size * 0.85), 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Moon shimmer (animated glint)
    var moonX = vx + w * 0.2;
    ctx.save(); ctx.globalAlpha = 0.08 + 0.05 * Math.sin(t * 1.3);
    ctx.fillStyle = 'rgba(200,220,255,0.4)';
    ctx.beginPath(); ctx.arc(moonX, vy - h * 0.22, 32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Animated waves
    var sortedWaves = SJ._perspWaves.slice().sort(function (a, b) { return a.depthFrac - b.depthFrac; });
    sortedWaves.forEach(function (wv) {
      var df = wv.depthFrac;
      var wY = lerp(vy, SJ.floorY, df);
      var numPts = 16;
      var wAlpha = wv.alpha * df;

      ctx.strokeStyle = 'rgba(0,200,220,' + wAlpha + ')';
      ctx.lineWidth   = Math.max(0.4, df * 2);
      ctx.beginPath();
      for (var p = 0; p <= numPts; p++) {
        var f  = p / numPts;
        var wx = lerp(lerp(vx, 0, df), lerp(vx, w, df), f);
        var wy = wY + Math.sin(f * w * wv.freq + t * wv.speed + wv.phase) * wv.amplitude * df;
        if (p === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

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
    for (var bi = 0; bi < 10; bi++) {
      var bf = (t * 0.3 + bi * 0.115) % 1;
      var bx2 = vx + Math.cos(bi * 1.4 + 0.5) * bf * w * 0.44;
      var bY  = lerp(vy, SJ.floorY, 0.3 + bf * 0.6);
      ctx.fillStyle = 'rgba(0,255,180,' + (1 - bf) * 0.28 + ')';
      ctx.beginPath(); ctx.arc(bx2, bY, 1.5 + bf * 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // BACKGROUND DISPATCHER
  // ─────────────────────────────────────────────────────────────
  SJ.renderBackground = function () {
    var ctx = SJ.ctx;
    switch (SJ.currentZoneIdx) {
      case 0: renderCityBg(ctx);          break;
      case 1: renderNorthernLightsBg(ctx); break;
      case 2: renderSpaceBg(ctx);         break;
      case 3: renderNeonCityBg(ctx);      break;
      case 4: renderOceanBg(ctx);         break;
      default: renderCityBg(ctx);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ZONE MANAGEMENT
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
    SJ.transitionAlpha = pct < 0.5 ? pct * 2 : (1 - pct) * 2;
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

    ctx.save(); ctx.globalAlpha = fade * 0.88;
    var zone    = SJ.zones[SJ.currentZoneIdx];
    var accent  = (zone && zone.accentColors[0]) || '#fff';
    var padX = 18, padY = 8, bh = 46, bw = Math.min(340, w * 0.62);
    var bx = 16, by = SJ.height - 72;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();
    ctx.fillStyle = accent;
    ctx.font = '10px "Share Tech Mono", monospace'; ctx.textAlign = 'left';
    ctx.fillText('NOW PLAYING', bx + padX, by + padY + 11);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Oswald", sans-serif';
    ctx.fillText(SJ.nowPlayingText || '', bx + padX, by + padY + 29);
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.restore();
  };

  SJ.renderTitleCard = function () {
    if (!SJ.titleCardTimer || SJ.titleCardTimer <= 0) return;
    SJ.titleCardTimer -= SJ.dt || 16;
    var ctx  = SJ.ctx;
    var w    = SJ.width;
    var pct  = SJ.titleCardTimer / 3200;
    var fade = pct > 0.82 ? (1 - pct) / 0.18 : (pct < 0.15 ? pct / 0.15 : 1);

    ctx.save(); ctx.globalAlpha = fade;
    var zone   = SJ.zones[SJ.currentZoneIdx];
    var accent = (zone && zone.accentColors[0]) || '#fff';
    var pulse  = 1 + 0.04 * Math.sin(SJ.elapsed * 0.003);

    ctx.translate(w / 2, SJ.height * 0.34); ctx.scale(pulse, pulse);
    ctx.textAlign = 'center'; ctx.shadowBlur = 18; ctx.shadowColor = accent;
    ctx.fillStyle = accent;
    ctx.font = 'bold ' + Math.min(38, w * 0.052) + 'px "Oswald", sans-serif';
    ctx.fillText((zone && zone.name) || '', 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = Math.min(16, w * 0.022) + 'px "Share Tech Mono", monospace';
    ctx.shadowBlur = 0;
    ctx.fillText((zone && zone.subtitle) || '', 0, 28);
    ctx.globalAlpha = 1; ctx.restore();
  };

  SJ.getZoneConfig = function (idx) { return SJ.zones[idx] || SJ.zones[0]; };

})();
