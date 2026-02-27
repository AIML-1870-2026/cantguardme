/**
 * Spike Jumper — zones.js
 * Agent 2 of 3: Zone configurations, background rendering, zone transitions,
 * title cards, and now-playing notifications.
 *
 * Extends window.SJ (initialized by engine.js).
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // ZONE CONFIGURATIONS
  // ─────────────────────────────────────────────────────────────
  SJ.zones = [
    {
      idx: 0,
      name: 'CITY',
      subtitle: 'Daytime',
      songFile: 'no-role-modelz.mp3',
      displayTitle: 'No Role Modelz — J. Cole',
      bpm: 100,
      skyTop: '#87CEEB',
      skyBottom: '#FFD4A3',
      sunColor: '#FFF0A0',
      fogColor: '#FFD4A3',
      accentColors: ['#FF6B35', '#FFD93D', '#6BCB77', '#4D96FF'],
      layerSpeeds: [0.05, 0.15, 0.35, 0.7],
    },
    {
      idx: 1,
      name: 'NORTHERN LIGHTS',
      subtitle: 'Arctic Peaks',
      songFile: 'trae-the-truth-in-ibiza.mp3',
      displayTitle: 'In Ibiza — Trae The Truth',
      bpm: 158,
      skyTop: '#0a0a2e',
      skyBottom: '#0d1f3c',
      accentColors: ['#00ff88', '#a855f7', '#00bcd4', '#ffffff'],
      layerSpeeds: [0.05, 0.15, 0.35, 0.7],
    },
    {
      idx: 2,
      name: 'SPACE',
      subtitle: 'Deep Orbit',
      songFile: 'power-trip.mp3',
      displayTitle: 'Power Trip — J. Cole',
      bpm: 100,
      skyTop: '#000005',
      skyBottom: '#050015',
      accentColors: ['#7c3aed', '#2563eb', '#f97316', '#ffffff'],
      layerSpeeds: [0.02, 0.08, 0.2, 0.5],
    },
    {
      idx: 3,
      name: 'FALLING CITY',
      subtitle: 'Neon Night',
      songFile: 'a-tale-of-2-citiez.mp3',
      displayTitle: 'A Tale of 2 Citiez — J. Cole',
      bpm: 190,
      skyTop: '#0a0014',
      skyBottom: '#1a0030',
      accentColors: ['#ff00ff', '#00ffff', '#ff4500', '#ffff00'],
      layerSpeeds: [0.05, 0.2, 0.45, 0.85],
    },
    {
      idx: 4,
      name: 'OCEAN',
      subtitle: 'Moonlit Waters',
      songFile: 'the-let-out.mp3',
      displayTitle: 'The Let Out — J. Cole',
      bpm: 130,
      skyTop: '#050d1f',
      skyBottom: '#0a1a35',
      accentColors: ['#00d4ff', '#00ff9f', '#4488cc', '#ffffff'],
      layerSpeeds: [0.05, 0.15, 0.3, 0.6],
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // PRE-GENERATED SCENE ELEMENTS
  // ─────────────────────────────────────────────────────────────

  function generateCityBuildings() {
    var buildings = [];
    for (var i = 0; i < 40; i++) {
      var b = {
        x: Math.random() * 4000,
        layer: Math.floor(Math.random() * 3),
        width: 40 + Math.random() * 120,
        height: 80 + Math.random() * 300,
        color: 'hsl(' + (200 + Math.random() * 40) + ', 20%, ' + (55 + Math.random() * 20) + '%)',
        windows: [],
        hasWaterTower: Math.random() < 0.3,
      };
      for (var wx = 0; wx < b.width; wx += 15) {
        for (var wy = 0; wy < b.height; wy += 20) {
          if (Math.random() < 0.6) b.windows.push({ wx: wx, wy: wy });
        }
      }
      buildings.push(b);
    }
    return buildings;
  }

  function generateNightBuildings() {
    var buildings = [];
    for (var i = 0; i < 50; i++) {
      var b = {
        x: Math.random() * 4000,
        layer: Math.floor(Math.random() * 3),
        width: 50 + Math.random() * 100,
        height: 100 + Math.random() * 400,
        color: 'hsl(' + (270 + Math.random() * 60) + ', 30%, ' + (8 + Math.random() * 10) + '%)',
        neonColor: 'hsl(' + (Math.random() * 360) + ', 100%, 60%)',
        litWindows: [],
        hasNeonSign: Math.random() < 0.4,
      };
      for (var wx = 0; wx < b.width; wx += 12) {
        for (var wy = 0; wy < b.height; wy += 15) {
          if (Math.random() < 0.4) {
            b.litWindows.push({
              wx: wx,
              wy: wy,
              color: 'rgba(255, ' + (180 + Math.random() * 75) + ', ' + (Math.random() * 100) + ', 0.9)',
            });
          }
        }
      }
      buildings.push(b);
    }
    return buildings;
  }

  function generateStars() {
    var stars = [];
    for (var i = 0; i < 300; i++) {
      stars.push({
        x: Math.random() * 3000,
        y: Math.random() * 600,
        size: Math.random() * 2 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
      });
    }
    return stars;
  }

  function generateMountains() {
    var peaks = [];
    for (var i = 0; i < 30; i++) {
      peaks.push({
        x: Math.random() * 4000,
        layer: Math.floor(Math.random() * 3),
        width: 100 + Math.random() * 200,
        height: 80 + Math.random() * 200,
        snowHeight: 0.2 + Math.random() * 0.3,
      });
    }
    return peaks;
  }

  function generateOceanWaves() {
    var waves = [];
    for (var i = 0; i < 20; i++) {
      waves.push({
        x: Math.random() * 3000,
        y: 0.5 + Math.random() * 0.35,
        amplitude: 5 + Math.random() * 20,
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        color: 'rgba(0, ' + (150 + Math.random() * 80) + ', ' + (200 + Math.random() * 55) + ', ' + (0.3 + Math.random() * 0.4) + ')',
      });
    }
    return waves;
  }

  // ─────────────────────────────────────────────────────────────
  // INIT ZONES
  // ─────────────────────────────────────────────────────────────
  SJ.initZones = function () {
    SJ._layerOffsets = [0, 0, 0, 0];
    SJ._layerOffsetY = [0, 0, 0, 0];
    SJ._transitionRenderFn = null;

    SJ._cityBuildings = generateCityBuildings();
    SJ._nightBuildings = generateNightBuildings();
    SJ._stars = generateStars();
    SJ._mountains = generateMountains();
    SJ._oceanWaves = generateOceanWaves();
  };

  // ─────────────────────────────────────────────────────────────
  // HELPER: roundRect
  // ─────────────────────────────────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ─────────────────────────────────────────────────────────────
  // BACKGROUND RENDERERS
  // ─────────────────────────────────────────────────────────────

  // ── Zone 0: City (Daytime) ──────────────────────────────────
  function drawCloud(ctx, x, y, cw, ch) {
    ctx.beginPath();
    ctx.ellipse(x, y, cw, ch * 0.6, 0, 0, Math.PI * 2);
    ctx.ellipse(x - cw * 0.4, y + ch * 0.2, cw * 0.6, ch * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + cw * 0.4, y + ch * 0.15, cw * 0.5, ch * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCityLayer(ctx, layerNum, scaleF, bottomY, opacity, heightScale) {
    var buildings = SJ._cityBuildings.filter(function (b) { return b.layer === layerNum - 1; });
    var offset = SJ._layerOffsets[layerNum] % 2000;
    var w = SJ.width;
    buildings.forEach(function (b) {
      var bx = ((b.x + offset) % (w * 2 + 400) + (w * 2 + 400)) % (w * 2 + 400) - 200;
      var bh = b.height * heightScale;
      var bw = b.width * scaleF;
      var by = bottomY - bh;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, bw, bh);
      // Windows
      ctx.fillStyle = 'rgba(255, 240, 150, 0.6)';
      b.windows.forEach(function (win) {
        ctx.fillRect(bx + win.wx * scaleF, by + win.wy * heightScale, 4 * scaleF, 5 * heightScale);
      });
      // Water tower
      if (b.hasWaterTower) {
        ctx.fillStyle = '#888';
        ctx.fillRect(bx + bw * 0.7, by - bh * 0.12, bw * 0.15, bh * 0.12);
        ctx.beginPath();
        ctx.arc(bx + bw * 0.775, by - bh * 0.12, bw * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#777';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  function drawForegroundBuildingEdges(ctx) {
    var w = SJ.width, h = SJ.height;
    ctx.fillStyle = '#7a7a8a';
    ctx.fillRect(0, h * 0.1, w * 0.08, h * 0.75);
    ctx.fillStyle = '#6a6a7a';
    ctx.fillRect(w * 0.08, h * 0.0, w * 0.06, h * 0.4);
    ctx.fillStyle = '#7a7a8a';
    ctx.fillRect(w * 0.92, h * 0.15, w * 0.08, h * 0.75);
    ctx.fillStyle = '#6a6a7a';
    ctx.fillRect(w * 0.86, h * 0.02, w * 0.06, h * 0.45);
    // Window highlights on foreground edges
    ctx.fillStyle = 'rgba(255, 240, 150, 0.4)';
    for (var i = 0; i < 5; i++) {
      ctx.fillRect(w * 0.015, h * (0.18 + i * 0.12), w * 0.04, h * 0.05);
      ctx.fillRect(w * 0.94, h * (0.22 + i * 0.11), w * 0.04, h * 0.05);
    }
  }

  function renderCityBg(ctx) {
    var w = SJ.width, h = SJ.height;

    // Sky gradient
    var skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, '#5BAEFF');
    skyGrad.addColorStop(0.6, '#87CEEB');
    skyGrad.addColorStop(1, '#FFD4A3');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.6);

    // Sun
    var sunX = w * 0.75;
    var sunY = h * 0.1;
    var sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
    sunGrad.addColorStop(0, '#FFFAAA');
    sunGrad.addColorStop(0.5, 'rgba(255, 220, 100, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 180, 50, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    var cloudOffset = SJ._layerOffsets[0] * 0.3;
    drawCloud(ctx, ((w * 0.2 + cloudOffset) % (w + 200) + (w + 200)) % (w + 200) - 100, h * 0.08, 70, 30);
    drawCloud(ctx, ((w * 0.5 + cloudOffset * 0.7) % (w + 200) + (w + 200)) % (w + 200) - 100, h * 0.15, 50, 20);
    drawCloud(ctx, ((w * 0.8 + cloudOffset * 0.5) % (w + 200) + (w + 200)) % (w + 200) - 100, h * 0.05, 90, 35);
    drawCloud(ctx, ((w * 1.1 + cloudOffset * 0.6) % (w + 200) + (w + 200)) % (w + 200) - 100, h * 0.12, 60, 25);

    // Ground / road
    var groundGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
    groundGrad.addColorStop(0, '#888');
    groundGrad.addColorStop(1, '#666');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h * 0.88, w, h * 0.12);

    // Sidewalk strip
    ctx.fillStyle = '#aaa';
    ctx.fillRect(0, h * 0.84, w, h * 0.04);

    // Vanishing point road lines
    var vx = SJ.vanishX, vy = h * 0.82;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    var roadDashOffset = -(SJ.elapsed / 80) % 35;
    ctx.lineDashOffset = roadDashOffset;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx - 200, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + 200, h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // City building layers (far → near)
    drawCityLayer(ctx, 3, 0.25, h * 0.55, 0.5, 0.25);
    drawCityLayer(ctx, 2, 0.45, h * 0.5, 0.75, 0.4);
    drawCityLayer(ctx, 1, 0.75, h * 0.42, 1.0, 0.55);
    drawForegroundBuildingEdges(ctx);

    // Horizon fog overlay
    var fogGrad = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.65);
    fogGrad.addColorStop(0, 'rgba(255, 200, 130, 0)');
    fogGrad.addColorStop(1, 'rgba(255, 200, 130, 0.35)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, h * 0.45, w, h * 0.2);
  }

  // ── Zone 1: Northern Lights ──────────────────────────────────
  function drawMountainLayer(ctx, layerNum, baseY, scaleF, color) {
    var peaks = SJ._mountains.filter(function (m) { return m.layer === layerNum; });
    var offset = SJ._layerOffsets[Math.min(layerNum + 1, 3)] % 3000;
    var w = SJ.width;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-50, SJ.height);

    peaks.forEach(function (peak) {
      var px = ((peak.x + offset) % (w * 2.5 + 600) + (w * 2.5 + 600)) % (w * 2.5 + 600) - 200;
      var pw = peak.width * scaleF;
      var ph = peak.height * scaleF;
      ctx.lineTo(px, baseY);
      ctx.lineTo(px + pw / 2, baseY - ph);
      ctx.lineTo(px + pw, baseY);
    });

    ctx.lineTo(w + 50, SJ.height);
    ctx.closePath();
    ctx.fill();

    // Snow caps
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    peaks.forEach(function (peak) {
      var px = ((peak.x + offset) % (w * 2.5 + 600) + (w * 2.5 + 600)) % (w * 2.5 + 600) - 200;
      var pw = peak.width * scaleF;
      var ph = peak.height * scaleF;
      var snowH = ph * peak.snowHeight;
      var tipX = px + pw / 2;
      var tipY = baseY - ph;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - pw * 0.2, tipY + snowH);
      ctx.lineTo(tipX + pw * 0.2, tipY + snowH);
      ctx.closePath();
      ctx.fill();
    });
  }

  function renderNorthernLightsBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var t = SJ.elapsed / 1000;

    // Dark night sky
    var skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#020415');
    skyGrad.addColorStop(0.5, '#081530');
    skyGrad.addColorStop(1, '#0d1f3c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    SJ._stars.forEach(function (star) {
      star.twinkle += star.twinkleSpeed;
      var starOffset = SJ._layerOffsets[0] * 0.1;
      var sx = ((star.x + starOffset) % w + w) % w;
      var alpha = 0.4 + 0.5 * Math.sin(star.twinkle);
      ctx.beginPath();
      ctx.arc(sx, star.y * (h / 600), star.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
      ctx.fill();
    });

    // Aurora bands
    var auroraColors = [
      { r: 0, g: 255, b: 120 },
      { r: 100, g: 0, b: 255 },
      { r: 0, g: 200, b: 255 },
    ];

    for (var i = 0; i < 3; i++) {
      var col = auroraColors[i];
      var baseY = h * (0.1 + i * 0.12);
      var auroraHeight = h * (0.08 + Math.sin(t * 0.5 + i) * 0.03);
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.08 * Math.sin(t * 0.7 + i * 2);

      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (var x = 0; x <= w; x += 5) {
        var waveY = baseY + Math.sin((x / w) * Math.PI * 4 + t * 0.8 + i) * 20;
        ctx.lineTo(x, waveY);
      }
      ctx.lineTo(w, baseY + auroraHeight);
      ctx.lineTo(0, baseY + auroraHeight);
      ctx.closePath();

      var auroraGrad = ctx.createLinearGradient(0, baseY, 0, baseY + auroraHeight);
      auroraGrad.addColorStop(0, 'rgba(' + col.r + ', ' + col.g + ', ' + col.b + ', 0.0)');
      auroraGrad.addColorStop(0.3, 'rgba(' + col.r + ', ' + col.g + ', ' + col.b + ', 0.9)');
      auroraGrad.addColorStop(0.7, 'rgba(' + col.r + ', ' + col.g + ', ' + col.b + ', 0.6)');
      auroraGrad.addColorStop(1, 'rgba(' + col.r + ', ' + col.g + ', ' + col.b + ', 0.0)');
      ctx.fillStyle = auroraGrad;
      ctx.fill();
      ctx.restore();
    }

    // Mountain silhouettes
    drawMountainLayer(ctx, 2, h * 0.75, 0.5, '#0d1f3c');
    drawMountainLayer(ctx, 1, h * 0.7, 0.75, '#071525');
    drawMountainLayer(ctx, 0, h * 0.62, 1.0, '#030d18');

    // Ground fill
    ctx.fillStyle = '#020d1a';
    ctx.fillRect(0, h * 0.75, w, h * 0.25);

    // Ice ground sheen
    var iceGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
    iceGrad.addColorStop(0, 'rgba(100, 160, 255, 0.12)');
    iceGrad.addColorStop(1, 'rgba(50, 100, 200, 0.04)');
    ctx.fillStyle = iceGrad;
    ctx.fillRect(0, h * 0.75, w, h * 0.25);
  }

  // ── Zone 2: Space ────────────────────────────────────────────
  function drawNebula(ctx, x, y, size, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    var grad = ctx.createRadialGradient(x, y, 0, x, y, size);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.6, Math.PI * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function renderSpaceBg(ctx) {
    var w = SJ.width, h = SJ.height;

    // Deep black space
    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, w, h);

    // Stars with speed streaks
    SJ._stars.forEach(function (star) {
      var starOffset = SJ._layerOffsets[2] * 0.05 * star.size;
      var sx = ((star.x + starOffset) % w + w) % w;
      var sy = star.y % h;
      star.twinkle += star.twinkleSpeed;
      var alpha = 0.5 + 0.5 * Math.sin(star.twinkle);

      // Speed streaks at high speed
      var speedFactor = Math.min(1, Math.max(0, (SJ.speed - 5) / 15));
      if (speedFactor > 0 && star.size > 1) {
        var streakLen = speedFactor * star.size * 8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + streakLen, sy);
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.5) + ')';
        ctx.lineWidth = star.size * 0.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
      ctx.fill();
    });

    // Nebula clouds
    drawNebula(ctx, w * 0.2, h * 0.3, 200, '#3b0f6e', 0.12);
    drawNebula(ctx, w * 0.7, h * 0.6, 180, '#0f3b6e', 0.10);
    drawNebula(ctx, w * 0.5, h * 0.15, 250, '#6e2b0f', 0.08);
    drawNebula(ctx, w * 0.85, h * 0.2, 160, '#1a4a2e', 0.09);

    // Earth curvature at bottom
    var earthGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
    earthGrad.addColorStop(0, 'rgba(0, 80, 200, 0)');
    earthGrad.addColorStop(0.3, 'rgba(0, 80, 200, 0.3)');
    earthGrad.addColorStop(1, 'rgba(0, 60, 180, 0.7)');
    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 1.2, w * 0.9, h * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cloud layer on Earth
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (var i = 0; i < 5; i++) {
      var cloudX = ((i * 300 + SJ._layerOffsets[1] * 0.2) % (w + 400) + (w + 400)) % (w + 400) - 200;
      ctx.beginPath();
      ctx.ellipse(cloudX, h * 0.85, 80, 15, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sun glow top-right corner
    var sunGlow = ctx.createRadialGradient(w, 0, 0, w, 0, 300);
    sunGlow.addColorStop(0, 'rgba(255, 220, 100, 0.3)');
    sunGlow.addColorStop(1, 'rgba(255, 220, 100, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, w, h);
  }

  // ── Zone 3: Falling City (Neon Night) ───────────────────────
  function drawNightCityLayer(ctx, layerNum, baseY, scaleF, opacity) {
    var buildings = SJ._nightBuildings.filter(function (b) { return b.layer === layerNum; });
    var offset = SJ._layerOffsets[Math.min(layerNum + 1, 3)] % 3000;
    var w = SJ.width;
    buildings.forEach(function (b) {
      var bx = ((b.x + offset) % (w * 2.5 + 600) + (w * 2.5 + 600)) % (w * 2.5 + 600) - 200;
      var bh = b.height * scaleF;
      var bw = b.width * scaleF;
      var by = baseY - bh;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, bw, bh);
      // Lit windows
      b.litWindows.forEach(function (win) {
        ctx.fillStyle = win.color;
        ctx.fillRect(bx + win.wx * scaleF, by + win.wy * scaleF, 4 * scaleF, 5 * scaleF);
      });
      // Neon sign
      if (b.hasNeonSign) {
        ctx.save();
        ctx.globalAlpha = opacity * 0.9;
        ctx.shadowBlur = 15;
        ctx.shadowColor = b.neonColor;
        ctx.strokeStyle = b.neonColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + bw * 0.2, by + bh * 0.3, bw * 0.6, bh * 0.15);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    });
  }

  function renderFallingCityBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var t = SJ.elapsed / 1000;

    // Dark night sky
    var skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.3);
    skyGrad.addColorStop(0, '#0a0014');
    skyGrad.addColorStop(1, '#1a0030');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.3);

    // Stars at top
    SJ._stars.slice(0, 80).forEach(function (star) {
      var alpha = 0.3 + 0.4 * Math.sin(star.twinkle);
      var sx = (star.x % w + w) % w;
      ctx.beginPath();
      ctx.arc(sx, star.y * 0.25, star.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fill();
    });

    // Ground / street
    var streetY = h * 0.85;
    ctx.fillStyle = '#111';
    ctx.fillRect(0, streetY, w, h - streetY);

    // Street light grid (perspective)
    ctx.fillStyle = 'rgba(255, 200, 100, 0.7)';
    for (var i = -5; i < 15; i++) {
      var perspX = SJ.vanishX + i * (w / 8) * (1 + SJ.elapsed * 0.0001);
      if (perspX < -50 || perspX > w + 50) continue;
      ctx.fillRect(perspX - 1, h * 0.78, 2, 8);
    }

    // Night buildings
    drawNightCityLayer(ctx, 2, h * 0.72, 0.5, 0.6);
    drawNightCityLayer(ctx, 1, h * 0.65, 0.75, 0.8);
    drawNightCityLayer(ctx, 0, h * 0.55, 1.0, 1.0);

    // Rain streaks
    var rainOffset = (SJ.elapsed * 0.8) % h;
    ctx.strokeStyle = 'rgba(150, 150, 255, 0.25)';
    ctx.lineWidth = 0.8;
    for (var ri = 0; ri < 80; ri++) {
      var rainX = ((ri * 137.5 + SJ._layerOffsets[3] * 0.5) % w + w) % w;
      var rainY = ((ri * 97 + rainOffset) % h);
      ctx.beginPath();
      ctx.moveTo(rainX, rainY);
      ctx.lineTo(rainX - 2, rainY + 15);
      ctx.stroke();
    }

    // Neon sign glow ambient overlay
    var neonGlow = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.6);
    neonGlow.addColorStop(0, 'rgba(255, 0, 255, 0.05)');
    neonGlow.addColorStop(1, 'rgba(255,0,255,0)');
    ctx.fillStyle = neonGlow;
    ctx.fillRect(0, 0, w, h);

    var neonGlow2 = ctx.createRadialGradient(w * 0.7, h * 0.5, 0, w * 0.7, h * 0.5, w * 0.5);
    neonGlow2.addColorStop(0, 'rgba(0, 255, 255, 0.04)');
    neonGlow2.addColorStop(1, 'rgba(0,255,255,0)');
    ctx.fillStyle = neonGlow2;
    ctx.fillRect(0, 0, w, h);

    // Foreground building edges
    ctx.fillStyle = '#0a0014';
    ctx.fillRect(0, 0, w * 0.07, h);
    ctx.fillStyle = '#0a0014';
    ctx.fillRect(w * 0.93, 0, w * 0.07, h);

    // Animated neon edge strips
    var neonHue = (t * 60) % 360;
    ctx.strokeStyle = 'hsl(' + neonHue + ', 100%, 60%)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(w * 0.07, 0);
    ctx.lineTo(w * 0.07, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.93, 0);
    ctx.lineTo(w * 0.93, h);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Zone 4: Ocean (Moonlit Night) ───────────────────────────
  function renderOceanBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var t = SJ.elapsed / 1000;

    // Night sky
    var skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    skyGrad.addColorStop(0, '#030d1f');
    skyGrad.addColorStop(1, '#081833');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.55);

    // Stars
    SJ._stars.slice(0, 150).forEach(function (star) {
      var starOffset = SJ._layerOffsets[0] * 0.05;
      var sx = ((star.x + starOffset) % w + w) % w;
      star.twinkle += star.twinkleSpeed;
      var alpha = 0.3 + 0.5 * Math.sin(star.twinkle);
      ctx.beginPath();
      ctx.arc(sx, star.y * 0.55 * h / 600, star.size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
      ctx.fill();
    });

    // Moon
    var moonX = w * 0.8;
    var moonY = h * 0.1;
    var moonGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 45);
    moonGrad.addColorStop(0, '#FFFFF0');
    moonGrad.addColorStop(0.7, '#E8E8D0');
    moonGrad.addColorStop(1, 'rgba(232, 232, 200, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 45, 0, Math.PI * 2);
    ctx.fill();

    // Moon halo
    var haloGrad = ctx.createRadialGradient(moonX, moonY, 30, moonX, moonY, 150);
    haloGrad.addColorStop(0, 'rgba(255, 255, 220, 0.15)');
    haloGrad.addColorStop(1, 'rgba(255,255,220,0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 150, 0, Math.PI * 2);
    ctx.fill();

    // Ocean surface
    var oceanY = h * 0.52;
    var oceanGrad = ctx.createLinearGradient(0, oceanY, 0, h);
    oceanGrad.addColorStop(0, '#061828');
    oceanGrad.addColorStop(0.3, '#072035');
    oceanGrad.addColorStop(1, '#040f1a');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, oceanY, w, h - oceanY);

    // Moonlight reflection path
    var reflGrad = ctx.createLinearGradient(0, oceanY, 0, h);
    reflGrad.addColorStop(0, 'rgba(255, 255, 200, 0.18)');
    reflGrad.addColorStop(1, 'rgba(255, 255, 200, 0.04)');
    ctx.save();
    ctx.fillStyle = reflGrad;
    var reflWidth = 60 + 80 * Math.abs(Math.sin(t * 0.3));
    ctx.beginPath();
    ctx.moveTo(moonX - reflWidth, h);
    ctx.quadraticCurveTo(moonX, oceanY + 50, moonX + reflWidth, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Bioluminescent glow patches
    for (var bi = 0; bi < 6; bi++) {
      var bx = ((bi * 400 + SJ._layerOffsets[2] * 0.3) % (w + 300) + (w + 300)) % (w + 300) - 150;
      var by = oceanY + 20 + (bi % 3) * 40;
      var bAlpha = 0.1 + 0.05 * Math.sin(t + bi);
      var bioGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 60);
      bioGrad.addColorStop(0, 'rgba(0, 255, 160, ' + bAlpha + ')');
      bioGrad.addColorStop(1, 'rgba(0,255,160,0)');
      ctx.fillStyle = bioGrad;
      ctx.beginPath();
      ctx.ellipse(bx, by, 60, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ocean waves
    SJ._oceanWaves.forEach(function (wave, idx) {
      var waveOffset = ((wave.x + SJ._layerOffsets[Math.min(idx % 4, 3)] * 0.2) % (w + 200) + (w + 200)) % (w + 200) - 100;
      var waveY = oceanY + h * (wave.y - 0.52) * 0.5;
      wave.phase += wave.speed * 0.02;
      ctx.beginPath();
      ctx.moveTo(waveOffset - 100, waveY);
      for (var wx = waveOffset - 100; wx < waveOffset + 300; wx += 5) {
        ctx.lineTo(wx, waveY + Math.sin((wx / 80) + wave.phase) * wave.amplitude);
      }
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Horizon mist
    var mistGrad = ctx.createLinearGradient(0, h * 0.48, 0, h * 0.58);
    mistGrad.addColorStop(0, 'rgba(8,24,51,0)');
    mistGrad.addColorStop(1, 'rgba(8, 24, 51, 0.5)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, h * 0.48, w, h * 0.1);
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER ZONE BACKGROUND (dispatcher)
  // ─────────────────────────────────────────────────────────────
  function renderZoneBackground(zoneIdx, ctx) {
    switch (zoneIdx) {
      case 0: renderCityBg(ctx); break;
      case 1: renderNorthernLightsBg(ctx); break;
      case 2: renderSpaceBg(ctx); break;
      case 3: renderFallingCityBg(ctx); break;
      case 4: renderOceanBg(ctx); break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SJ.renderBackground — main background render call
  // ─────────────────────────────────────────────────────────────
  SJ.renderBackground = function () {
    var ctx = SJ.ctx;
    var zone = SJ.zones[SJ.currentZoneIdx];

    // Update parallax layer offsets (horizontal scroll, proportional to scroll speed)
    var scrollPx = (SJ.scrollSpeed || 220) / 60;
    for (var i = 0; i < 4; i++) {
      SJ._layerOffsets[i] -= scrollPx * zone.layerSpeeds[i];
    }

    // Transition blend
    if (SJ.transitioning && SJ.prevZoneIdx >= 0) {
      var alpha = SJ.transitionAlpha;
      ctx.globalAlpha = 1 - alpha;
      renderZoneBackground(SJ.prevZoneIdx, ctx);
      ctx.globalAlpha = alpha;
      renderZoneBackground(SJ.currentZoneIdx, ctx);
      ctx.globalAlpha = 1;
    } else {
      renderZoneBackground(SJ.currentZoneIdx, ctx);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ZONE TRANSITION — start next zone
  // ─────────────────────────────────────────────────────────────
  function startNextZone() {
    var nextIdx = (SJ.currentZoneIdx + 1) % 5;

    if (nextIdx === 0) {
      SJ.cycleCount++;
    }

    SJ.prevZoneIdx = SJ.currentZoneIdx;
    SJ.currentZoneIdx = nextIdx;
    SJ.transitioning = true;
    SJ.transitionTimer = 0;
    SJ.transitionAlpha = 0;
    SJ.gameState = 'transitioning';

    var newZone = SJ.zones[nextIdx];
    SJ.beatInterval = 60000 / newZone.bpm;

    if (SJ.triggerScreenShake) SJ.triggerScreenShake(6, 200);

    SJ.titleCardText = newZone.name;
    SJ.titleCardTimer = 2500;

    SJ.nowPlayingText = newZone.displayTitle;
    SJ.nowPlayingTimer = 6000;

    if (SJ.crossfadeTo) SJ.crossfadeTo(nextIdx);
    if (SJ.playSound) SJ.playSound('zone_transition');
    if (SJ.spawnZoneTransitionBurst) SJ.spawnZoneTransitionBurst();

    SJ.score += 500;

    SJ.baseSpeed = 5 + SJ.cycleCount * 0.5 + nextIdx * 0.5;
  }

  // ─────────────────────────────────────────────────────────────
  // SJ.updateZone
  // ─────────────────────────────────────────────────────────────
  SJ.updateZone = function (dt) {
    if (SJ.transitioning) {
      SJ.transitionTimer += dt;
      SJ.transitionAlpha = Math.min(1, SJ.transitionTimer / SJ.transitionDuration);

      if (SJ.transitionTimer >= SJ.transitionDuration) {
        SJ.transitioning = false;
        SJ.prevZoneIdx = -1;
        SJ.transitionAlpha = 1;
        SJ.gameState = 'playing';
        SJ.zoneTimer = 0;
        SJ.patternChunkIdx = 0;
        SJ.timeSinceLastChunk = 0;
        if (SJ.clearObstacles) SJ.clearObstacles();
        if (SJ.startPatternChunk) SJ.startPatternChunk(SJ.currentZoneIdx, 0);
      }
      return;
    }

    SJ.zoneTimer += dt;
    SJ.timeSinceLastChunk += dt;

    // Advance pattern chunks (3 per zone)
    if (SJ.timeSinceLastChunk > SJ.chunkDuration) {
      SJ.timeSinceLastChunk = 0;
      SJ.patternChunkIdx = (SJ.patternChunkIdx + 1) % 3;
      if (SJ.startPatternChunk) SJ.startPatternChunk(SJ.currentZoneIdx, SJ.patternChunkIdx);
    }

    // Zone complete
    if (SJ.zoneTimer >= SJ.zoneDuration) {
      startNextZone();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.updateTransition (called by engine during transitioning state)
  // ─────────────────────────────────────────────────────────────
  SJ.updateTransition = function (dt) {
    // Zone transition logic handled inside updateZone
    // This stub exists for engine.js calls during 'transitioning' gameState
    SJ.updateZone(dt);
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.renderNowPlaying
  // ─────────────────────────────────────────────────────────────
  SJ.renderNowPlaying = function () {
    if (SJ.nowPlayingTimer <= 0 || !SJ.nowPlayingText) return;

    var ctx = SJ.ctx;
    var totalDuration = 6000;
    var remaining = SJ.nowPlayingTimer;
    SJ.nowPlayingTimer -= SJ.dt;

    var slideIn = Math.min(1, (totalDuration - remaining) / 400);
    var fadeOut = remaining < 800 ? remaining / 800 : 1;

    var panelW = 300;
    var panelH = 44;
    var panelX = SJ.width - panelW - 16 - (1 - slideIn) * (panelW + 16);
    var panelY = 16;

    ctx.save();
    ctx.globalAlpha = fadeOut * slideIn;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    roundRect(ctx, panelX, panelY, panelW, panelH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Music note icon area
    var zone = SJ.zones[SJ.currentZoneIdx];
    ctx.fillStyle = zone ? zone.accentColors[0] : '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('\u266B', panelX + 10, panelY + 27);

    ctx.fillStyle = '#fff';
    ctx.font = '11px "Share Tech Mono", monospace';
    // Truncate if too long
    var displayText = SJ.nowPlayingText;
    if (displayText.length > 36) displayText = displayText.slice(0, 33) + '...';
    ctx.fillText(displayText, panelX + 28, panelY + 27);
    ctx.restore();
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.renderTitleCard
  // ─────────────────────────────────────────────────────────────
  SJ.renderTitleCard = function () {
    if (SJ.titleCardTimer <= 0 || !SJ.titleCardText) return;

    var ctx = SJ.ctx;
    var totalDuration = 2500;
    SJ.titleCardTimer -= SJ.dt;
    var remaining = SJ.titleCardTimer;

    var alpha = 1;
    if (remaining > totalDuration - 400) alpha = (totalDuration - remaining) / 400;
    else if (remaining < 400) alpha = remaining / 400;
    alpha = Math.max(0, Math.min(1, alpha));

    var zone = SJ.zones[SJ.currentZoneIdx];

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.shadowBlur = 24;
    ctx.shadowColor = zone ? zone.accentColors[0] : '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px "Oswald", sans-serif';
    ctx.fillText(zone ? zone.name : SJ.titleCardText, SJ.width / 2, SJ.height / 2);
    ctx.font = '20px "Oswald", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(zone ? (zone.subtitle || '') : '', SJ.width / 2, SJ.height / 2 + 40);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
    ctx.restore();
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.getZoneConfig
  // ─────────────────────────────────────────────────────────────
  SJ.getZoneConfig = function (idx) {
    return SJ.zones[((idx % 5) + 5) % 5];
  };

})();
