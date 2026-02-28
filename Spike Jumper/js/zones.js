/**
 * Spike Jumper — zones.js (Enhanced Visuals)
 * Zone configurations, beautiful background rendering, transitions,
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
      subtitle: 'Golden Hour',
      songFile: 'no-role-modelz.mp3',
      displayTitle: 'No Role Modelz — J. Cole',
      bpm: 100,
      skyTop: '#1a3a6e',
      skyBottom: '#ff9a3c',
      accentColors: ['#FF6B35', '#FFD93D', '#6BCB77', '#4D96FF'],
      layerSpeeds: [0.04, 0.12, 0.3, 0.65],
    },
    {
      idx: 1,
      name: 'NORTHERN LIGHTS',
      subtitle: 'Arctic Peaks',
      songFile: 'trae-the-truth-in-ibiza.mp3',
      displayTitle: 'In Ibiza — Trae The Truth',
      bpm: 158,
      skyTop: '#020918',
      skyBottom: '#0a1f35',
      accentColors: ['#00ff88', '#a855f7', '#00bcd4', '#ffffff'],
      layerSpeeds: [0.03, 0.1, 0.28, 0.6],
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
      layerSpeeds: [0.015, 0.06, 0.18, 0.45],
    },
    {
      idx: 3,
      name: 'FALLING CITY',
      subtitle: 'Neon Night',
      songFile: 'a-tale-of-2-citiez.mp3',
      displayTitle: 'A Tale of 2 Citiez — J. Cole',
      bpm: 190,
      skyTop: '#06000f',
      skyBottom: '#150025',
      accentColors: ['#ff00ff', '#00ffff', '#ff4500', '#ffff00'],
      layerSpeeds: [0.04, 0.18, 0.42, 0.82],
    },
    {
      idx: 4,
      name: 'OCEAN',
      subtitle: 'Moonlit Waters',
      songFile: 'the-let-out.mp3',
      displayTitle: 'The Let Out — J. Cole',
      bpm: 130,
      skyTop: '#020b1a',
      skyBottom: '#071530',
      accentColors: ['#00d4ff', '#00ff9f', '#4488cc', '#ffffff'],
      layerSpeeds: [0.03, 0.1, 0.25, 0.55],
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // PRE-GENERATED SCENE ELEMENTS
  // ─────────────────────────────────────────────────────────────

  function generateCityBuildings() {
    var buildings = [];
    var styles = ['glass','brick','concrete','tower'];
    for (var i = 0; i < 60; i++) {
      var style = styles[Math.floor(Math.random() * styles.length)];
      var b = {
        x: Math.random() * 5000,
        layer: Math.floor(Math.random() * 3),
        width: 35 + Math.random() * 130,
        height: 60 + Math.random() * 350,
        style: style,
        hue: 200 + Math.random() * 50,
        sat: 10 + Math.random() * 20,
        lit: 40 + Math.random() * 30,
        hasRooftopDetail: Math.random() < 0.5,
        rooftopType: Math.random() < 0.5 ? 'water_tower' : 'antenna',
        windows: [],
        glintOffset: Math.random() * Math.PI * 2,
      };
      var winW = style === 'glass' ? 8 : 6;
      var winH = style === 'glass' ? 12 : 8;
      var gapX = style === 'glass' ? 14 : 12;
      var gapY = style === 'glass' ? 18 : 16;
      for (var wx = 6; wx < b.width - 6; wx += gapX) {
        for (var wy = 10; wy < b.height - 6; wy += gapY) {
          if (Math.random() < 0.65) {
            b.windows.push({
              wx: wx, wy: wy, w: winW, h: winH,
              litDay: Math.random() < 0.55,
            });
          }
        }
      }
      buildings.push(b);
    }
    return buildings;
  }

  function generateNightBuildings() {
    var buildings = [];
    for (var i = 0; i < 60; i++) {
      var h = 80 + Math.random() * 500;
      var w = 45 + Math.random() * 110;
      var b = {
        x: Math.random() * 5000,
        layer: Math.floor(Math.random() * 3),
        width: w, height: h,
        hue: 260 + Math.random() * 80,
        neonHue: Math.floor(Math.random() * 360),
        neonSat: 80 + Math.random() * 20,
        hasNeonSign: Math.random() < 0.55,
        neonRows: Math.floor(Math.random() * 3) + 1,
        litWindows: [],
        rooftopLight: Math.random() < 0.6,
        rooftopHue: Math.floor(Math.random() * 360),
      };
      for (var wx = 6; wx < w - 4; wx += 11) {
        for (var wy = 8; wy < h - 4; wy += 14) {
          if (Math.random() < 0.38) {
            b.litWindows.push({
              wx: wx, wy: wy,
              r: 255, g: 180 + Math.random() * 75, b2: Math.random() * 100,
              flicker: Math.random() < 0.05,
              phase: Math.random() * Math.PI * 2,
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
    var colors = [
      [255,255,255], [255,220,180], [180,200,255],
      [255,180,180], [200,255,200], [255,255,180],
    ];
    for (var i = 0; i < 450; i++) {
      var col = colors[Math.floor(Math.random() * colors.length)];
      stars.push({
        x: Math.random() * 4000,
        y: Math.random() * 700,
        size: Math.pow(Math.random(), 2.5) * 2.8 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.015 + Math.random() * 0.04,
        r: col[0], g: col[1], b: col[2],
        isBright: Math.random() < 0.08,
      });
    }
    return stars;
  }

  function generateShootingStars() {
    var ss = [];
    for (var i = 0; i < 6; i++) {
      ss.push({
        x: Math.random() * 3000, y: Math.random() * 400,
        vx: -(60 + Math.random() * 80), vy: 15 + Math.random() * 25,
        life: 0, maxLife: 0.8 + Math.random() * 1.2,
        active: false,
        nextSpawn: 4 + Math.random() * 12,
      });
    }
    return ss;
  }

  function generateMountains() {
    var peaks = [];
    for (var i = 0; i < 45; i++) {
      peaks.push({
        x: Math.random() * 5000,
        layer: Math.floor(Math.random() * 3),
        width: 90 + Math.random() * 230,
        height: 70 + Math.random() * 240,
        snowHeight: 0.18 + Math.random() * 0.32,
        jagged: Math.random() < 0.4,
        iceBlue: Math.random() < 0.3,
      });
    }
    return peaks;
  }

  function generateOceanWaves() {
    var waves = [];
    for (var i = 0; i < 28; i++) {
      waves.push({
        x: Math.random() * 4000,
        yFrac: 0.0 + Math.random() * 0.25,
        amplitude: 4 + Math.random() * 18,
        freq: 0.015 + Math.random() * 0.03,
        speed: 0.4 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.12 + Math.random() * 0.35,
        width: 200 + Math.random() * 400,
        hasFoam: Math.random() < 0.5,
      });
    }
    return waves;
  }

  function generateSpaceObjects() {
    var objs = [];
    // Planets
    objs.push({ type:'planet', x:0.78, y:0.22, r:38, hue:200, rings:false, moonR:6, moonOrbit:58 });
    objs.push({ type:'planet', x:0.12, y:0.65, r:22, hue:30,  rings:true,  ringTilt:0.35 });
    objs.push({ type:'planet', x:0.55, y:0.08, r:14, hue:120, rings:false });
    // Asteroid belt
    var asteroids = [];
    for (var i = 0; i < 50; i++) {
      asteroids.push({
        x: Math.random() * 4000, y: 0.55 + Math.random() * 0.35,
        r: 2 + Math.random() * 7, rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }
    objs.asteroids = asteroids;
    // Nebula clouds
    objs.nebulas = [
      { x: 0.15, y: 0.28, rx:280, ry:160, hue:280, alpha:0.14, rot:0.4 },
      { x: 0.72, y: 0.55, rx:220, ry:140, hue:200, alpha:0.12, rot:-0.2 },
      { x: 0.48, y: 0.12, rx:340, ry:120, hue: 20, alpha:0.09, rot:0.6 },
      { x: 0.88, y: 0.38, rx:180, ry:110, hue:150, alpha:0.11, rot:-0.3 },
      { x: 0.30, y: 0.72, rx:260, ry:90,  hue: 50, alpha:0.08, rot:0.1 },
    ];
    return objs;
  }

  function generateClouds() {
    var clouds = [];
    for (var i = 0; i < 22; i++) {
      clouds.push({
        x: Math.random() * 5000,
        yFrac: 0.03 + Math.random() * 0.22,
        w: 55 + Math.random() * 130,
        h: 22 + Math.random() * 50,
        layer: Math.floor(Math.random() * 3),
        alpha: 0.65 + Math.random() * 0.35,
        puffs: Math.floor(Math.random() * 3) + 2,
      });
    }
    return clouds;
  }

  // ─────────────────────────────────────────────────────────────
  // INIT ZONES
  // ─────────────────────────────────────────────────────────────
  SJ.initZones = function () {
    SJ._layerOffsets = [0, 0, 0, 0];
    SJ._layerOffsetY = [0, 0, 0, 0];
    SJ._transitionRenderFn = null;

    SJ._cityBuildings  = generateCityBuildings();
    SJ._nightBuildings = generateNightBuildings();
    SJ._stars          = generateStars();
    SJ._shootingStars  = generateShootingStars();
    SJ._mountains      = generateMountains();
    SJ._oceanWaves     = generateOceanWaves();
    SJ._spaceObjs      = generateSpaceObjects();
    SJ._clouds         = generateClouds();
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

  // scrolling x position helper
  function scrollX(rawX, offset, range) {
    return ((rawX + offset) % (range) + range) % range;
  }

  // ─────────────────────────────────────────────────────────────
  // BACKGROUND RENDERERS
  // ─────────────────────────────────────────────────────────────

  // ══════════════════════════════════════════════════════════════
  // ZONE 0 — GOLDEN HOUR CITY
  // ══════════════════════════════════════════════════════════════
  function drawVolumetricCloud(ctx, x, y, cw, ch, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    // Shadow layer
    ctx.fillStyle = 'rgba(180,120,60,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + ch * 0.3, cw * 1.05, ch * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    // Main body
    var cg = ctx.createRadialGradient(x, y - ch * 0.1, 0, x, y, cw * 0.9);
    cg.addColorStop(0,   'rgba(255,252,245,1)');
    cg.addColorStop(0.5, 'rgba(255,240,220,0.9)');
    cg.addColorStop(1,   'rgba(255,210,170,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(x,            y,            cw,        ch * 0.65, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - cw * 0.38, y + ch * 0.15, cw * 0.65, ch * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + cw * 0.38, y + ch * 0.1,  cw * 0.58, ch * 0.5,  0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - cw * 0.12, y - ch * 0.2,  cw * 0.48, ch * 0.4,  0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + cw * 0.25, y - ch * 0.15, cw * 0.4,  ch * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    // Highlight rim
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(x - cw * 0.1, y - ch * 0.18, cw * 0.35, ch * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawCityBuilding(ctx, b, bx, by, bw, bh, t, layerAlpha) {
    ctx.globalAlpha = layerAlpha;
    // Main body gradient
    var grad = ctx.createLinearGradient(bx, by, bx + bw, by);
    var lit  = b.lit;
    if (b.style === 'glass') {
      grad.addColorStop(0,   'hsl(' + b.hue + ',' + b.sat + '%,' + (lit - 8) + '%)');
      grad.addColorStop(0.3, 'hsl(' + b.hue + ',' + (b.sat + 8) + '%,' + (lit + 10) + '%)');
      grad.addColorStop(0.7, 'hsl(' + b.hue + ',' + b.sat + '%,' + (lit + 4) + '%)');
      grad.addColorStop(1,   'hsl(' + b.hue + ',' + b.sat + '%,' + (lit - 6) + '%)');
    } else {
      grad.addColorStop(0,   'hsl(' + b.hue + ',' + b.sat + '%,' + lit + '%)');
      grad.addColorStop(1,   'hsl(' + b.hue + ',' + b.sat + '%,' + (lit - 10) + '%)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw, bh);

    // Glass reflection sweep (animated sun glint)
    if (b.style === 'glass') {
      var glintX = bx + (Math.sin(t * 0.3 + b.glintOffset) * 0.5 + 0.5) * bw;
      var glintG = ctx.createLinearGradient(glintX - bw * 0.3, by, glintX + bw * 0.1, by + bh);
      glintG.addColorStop(0, 'rgba(255,220,150,0)');
      glintG.addColorStop(0.5,'rgba(255,235,180,0.12)');
      glintG.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = glintG;
      ctx.fillRect(bx, by, bw, bh);
    }

    // Windows
    b.windows.forEach(function (win) {
      var wx2 = bx + win.wx * (bw / b.width);
      var wy2 = by + win.wy * (bh / b.height);
      var ww2 = win.w * (bw / b.width);
      var wh2 = win.h * (bh / b.height);
      if (win.litDay) {
        ctx.fillStyle = 'rgba(255,235,140,0.45)';
      } else {
        ctx.fillStyle = b.style === 'glass'
          ? 'rgba(100,160,255,0.22)'
          : 'rgba(80,80,100,0.3)';
      }
      ctx.fillRect(wx2, wy2, Math.max(1, ww2), Math.max(1, wh2));
    });

    // Rooftop details
    if (b.hasRooftopDetail) {
      ctx.fillStyle = 'hsl(' + b.hue + ',' + b.sat + '%,' + (lit - 15) + '%)';
      if (b.rooftopType === 'water_tower') {
        var tw = bw * 0.18, tleg = bh * 0.08, tcap = tw * 0.6;
        ctx.fillRect(bx + bw * 0.65, by - tleg, tw * 0.06, tleg);
        ctx.fillRect(bx + bw * 0.76, by - tleg, tw * 0.06, tleg);
        ctx.fillRect(bx + bw * 0.61, by - tleg - tw * 0.7, tw, tw * 0.7);
        ctx.fillStyle = 'hsl(' + b.hue + ',' + b.sat + '%,' + (lit - 5) + '%)';
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.61, by - tleg - tw * 0.7);
        ctx.lineTo(bx + bw * 0.61 + tw / 2, by - tleg - tw * 1.05);
        ctx.lineTo(bx + bw * 0.61 + tw, by - tleg - tw * 0.7);
        ctx.fill();
      } else {
        // Antenna
        ctx.fillRect(bx + bw * 0.5 - 1, by - bh * 0.15, 2, bh * 0.15);
        ctx.beginPath();
        ctx.arc(bx + bw * 0.5, by - bh * 0.15, 3, 0, Math.PI * 2);
        var antennaGlow = (Math.sin(t * 2.5 + b.glintOffset) > 0.5) ? 'rgba(255,50,50,0.9)' : 'rgba(255,50,50,0.2)';
        ctx.fillStyle = antennaGlow;
        ctx.fill();
      }
    }

    // Building outline (subtle)
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.globalAlpha = 1;
  }

  function renderCityBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var t = SJ.elapsed / 1000;

    // ── Multi-layer atmospheric sky ──────────────────────────
    var skyG = ctx.createLinearGradient(0, 0, 0, h * 0.72);
    skyG.addColorStop(0,    '#0d1f4a');  // deep blue zenith
    skyG.addColorStop(0.25, '#2456a0');  // mid blue
    skyG.addColorStop(0.5,  '#5a9fd4');  // sky blue
    skyG.addColorStop(0.72, '#f0a060');  // golden horizon
    skyG.addColorStop(1,    '#e05c20');  // warm orange low
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, w, h * 0.72);

    // ── Sun ────────────────────────────────────────────────────
    var sunX = w * 0.72, sunY = h * 0.16;
    // outer glow
    var sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 220);
    sunGlow.addColorStop(0,    'rgba(255,240,120,0.28)');
    sunGlow.addColorStop(0.4,  'rgba(255,180,60,0.14)');
    sunGlow.addColorStop(0.8,  'rgba(255,120,20,0.05)');
    sunGlow.addColorStop(1,    'rgba(255,100,0,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(sunX - 220, sunY - 220, 440, 440);
    // disk
    var sunDisk = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 52);
    sunDisk.addColorStop(0,   '#FFFECC');
    sunDisk.addColorStop(0.6, '#FFE566');
    sunDisk.addColorStop(1,   'rgba(255,200,60,0)');
    ctx.fillStyle = sunDisk;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
    ctx.fill();

    // ── God rays ───────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.07;
    for (var ri = 0; ri < 14; ri++) {
      var angle = (ri / 14) * Math.PI * 2;
      var rayLen = 320 + 80 * Math.sin(t * 0.15 + ri);
      var rayW   = 18 + ri % 3 * 10;
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(angle + t * 0.008);
      var rayG = ctx.createLinearGradient(0, 0, rayLen, 0);
      rayG.addColorStop(0,   'rgba(255,235,120,0.8)');
      rayG.addColorStop(0.5, 'rgba(255,200,80,0.3)');
      rayG.addColorStop(1,   'rgba(255,180,60,0)');
      ctx.fillStyle = rayG;
      ctx.beginPath();
      ctx.moveTo(0, -rayW / 2);
      ctx.lineTo(rayLen, 0);
      ctx.lineTo(0, rayW / 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // ── Cloud layers (far → near, 3 layers) ──────────────────
    var cloudLayerData = [
      { layerIdx: 0, yMult: 0.95, speedMult: 0.9, scaleMult: 0.45, alpha: 0.55 },
      { layerIdx: 1, yMult: 0.88, speedMult: 0.8, scaleMult: 0.7,  alpha: 0.75 },
      { layerIdx: 2, yMult: 0.82, speedMult: 1.0, scaleMult: 1.0,  alpha: 0.88 },
    ];
    var cloudRange = w * 2.5 + 800;
    cloudLayerData.forEach(function (ld) {
      var offset = SJ._layerOffsets[ld.layerIdx];
      SJ._clouds.filter(function (c) { return c.layer === ld.layerIdx; }).forEach(function (c) {
        var cx = scrollX(c.x, offset * 0.4, cloudRange) - 200;
        if (cx > w + 200 || cx < -300) return;
        var cy = h * c.yFrac * ld.yMult;
        drawVolumetricCloud(ctx, cx, cy, c.w * ld.scaleMult, c.h * ld.scaleMult, c.alpha * ld.alpha);
      });
    });

    // ── Horizon atmospheric band ────────────────────────────
    var horizG = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.72);
    horizG.addColorStop(0, 'rgba(255,160,60,0)');
    horizG.addColorStop(1, 'rgba(255,100,20,0.3)');
    ctx.fillStyle = horizG;
    ctx.fillRect(0, h * 0.55, w, h * 0.17);

    // ── Far city buildings ────────────────────────────────────
    var buildingRange = w * 2.5 + 600;
    [
      { l: 2, scaleMult: 0.28, bottomY: h * 0.62, alpha: 0.45 },
      { l: 1, scaleMult: 0.50, bottomY: h * 0.57, alpha: 0.68 },
      { l: 0, scaleMult: 0.82, bottomY: h * 0.50, alpha: 1.0  },
    ].forEach(function (ld) {
      var offset = SJ._layerOffsets[ld.l + 1];
      SJ._cityBuildings.filter(function (b) { return b.layer === ld.l; }).forEach(function (b) {
        var bx = scrollX(b.x, offset, buildingRange) - 200;
        if (bx > w + 200 || bx + b.width * ld.scaleMult < -10) return;
        var bw = b.width  * ld.scaleMult;
        var bh = b.height * ld.scaleMult;
        var by = ld.bottomY - bh;
        drawCityBuilding(ctx, b, bx, by, bw, bh, t, ld.alpha);
      });
    });

    // ── Ground / road surface ─────────────────────────────────
    var groundY = h * 0.88;
    var gGrad = ctx.createLinearGradient(0, h * 0.72, 0, h);
    gGrad.addColorStop(0, '#b08060');
    gGrad.addColorStop(0.15,'#8a7060');
    gGrad.addColorStop(0.4, '#5a5060');
    gGrad.addColorStop(1,   '#3a3040');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    // Sidewalk stripe
    ctx.fillStyle = '#c0a880';
    ctx.fillRect(0, h * 0.84, w, h * 0.03);
    ctx.fillStyle = '#a09070';
    ctx.fillRect(0, h * 0.87, w, h * 0.02);

    // Road dashes (perspective)
    var dashOff = -(t * 120) % 60;
    ctx.strokeStyle = 'rgba(255,210,60,0.7)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([28, 20]);
    ctx.lineDashOffset = dashOff;
    ctx.beginPath();
    ctx.moveTo(w * 0.35, h * 0.89);
    ctx.lineTo(w * 0.47, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.65, h * 0.89);
    ctx.lineTo(w * 0.53, h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // ── Sun reflection strip on road ───────────────────────
    var reflG = ctx.createLinearGradient(w * 0.5, h * 0.72, w * 0.5, h);
    reflG.addColorStop(0, 'rgba(255,160,60,0.28)');
    reflG.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = reflG;
    ctx.beginPath();
    ctx.moveTo(w * 0.62, h * 0.72);
    ctx.lineTo(w * 0.80, h);
    ctx.lineTo(w * 0.55, h);
    ctx.lineTo(w * 0.48, h * 0.72);
    ctx.closePath();
    ctx.fill();

    // ── Foreground building edge silhouettes ──────────────
    ctx.fillStyle = '#2a2835';
    ctx.fillRect(0,         h * 0.04, w * 0.09, h * 0.84);
    ctx.fillRect(w * 0.91,  h * 0.12, w * 0.09, h * 0.76);
    ctx.fillStyle = '#242030';
    ctx.fillRect(w * 0.09,  h * 0.0,  w * 0.05, h * 0.38);
    ctx.fillRect(w * 0.86,  h * 0.0,  w * 0.05, h * 0.42);
    // window glows on edge buildings
    ctx.fillStyle = 'rgba(255,230,120,0.4)';
    for (var wi = 0; wi < 6; wi++) {
      ctx.fillRect(w * 0.015, h * (0.12 + wi * 0.12), w * 0.045, h * 0.048);
      ctx.fillRect(w * 0.93,  h * (0.16 + wi * 0.11), w * 0.045, h * 0.048);
    }

    // ── Heat haze shimmer near ground ─────────────────────
    ctx.save();
    ctx.globalAlpha = 0.08 + 0.04 * Math.sin(t * 2.3);
    var hazeG = ctx.createLinearGradient(0, h * 0.82, 0, h * 0.92);
    hazeG.addColorStop(0, 'rgba(255,140,40,0)');
    hazeG.addColorStop(0.5,'rgba(255,140,40,0.5)');
    hazeG.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = hazeG;
    ctx.fillRect(0, h * 0.82, w, h * 0.1);
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════
  // ZONE 1 — NORTHERN LIGHTS
  // ══════════════════════════════════════════════════════════════
  function drawMountainSilhouette(ctx, layer, baseY, scaleMult, fillColor, shadowColor) {
    var peaks  = SJ._mountains.filter(function (m) { return m.layer === layer; });
    var offset = SJ._layerOffsets[Math.min(layer + 1, 3)];
    var w = SJ.width, range = w * 2.8 + 700;

    ctx.beginPath();
    ctx.moveTo(-80, baseY + 10);
    peaks.forEach(function (pk) {
      var px = scrollX(pk.x, offset, range) - 250;
      if (px > w + 250 || px + pk.width * scaleMult < -80) return;
      var pw = pk.width  * scaleMult;
      var ph = pk.height * scaleMult;
      var tx = px + pw / 2;
      var ty = baseY - ph;
      if (pk.jagged) {
        ctx.lineTo(px,          baseY);
        ctx.lineTo(px + pw*0.2, baseY - ph*0.55);
        ctx.lineTo(px + pw*0.35,baseY - ph*0.38);
        ctx.lineTo(tx,          ty);
        ctx.lineTo(px + pw*0.65,baseY - ph*0.42);
        ctx.lineTo(px + pw*0.82,baseY - ph*0.62);
        ctx.lineTo(px + pw,     baseY);
      } else {
        ctx.lineTo(px, baseY);
        ctx.lineTo(tx, ty);
        ctx.lineTo(px + pw, baseY);
      }
    });
    ctx.lineTo(w + 80, baseY + 10);
    ctx.lineTo(w + 80, SJ.height + 10);
    ctx.lineTo(-80,    SJ.height + 10);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Shadow face (left side of each peak darker)
    ctx.save();
    ctx.globalAlpha = 0.35;
    peaks.forEach(function (pk) {
      var px = scrollX(pk.x, offset, range) - 250;
      if (px > w + 250) return;
      var pw = pk.width  * scaleMult;
      var ph = pk.height * scaleMult;
      ctx.beginPath();
      ctx.moveTo(px, baseY);
      ctx.lineTo(px + pw * 0.5, baseY - ph);
      ctx.lineTo(px, baseY - ph * 0.4);
      ctx.closePath();
      ctx.fillStyle = shadowColor;
      ctx.fill();
    });
    ctx.restore();

    // Snow caps
    ctx.save();
    peaks.forEach(function (pk) {
      var px = scrollX(pk.x, offset, range) - 250;
      if (px > w + 250) return;
      var pw = pk.width  * scaleMult;
      var ph = pk.height * scaleMult;
      var tx = px + pw / 2;
      var ty = baseY - ph;
      var snowH = ph * pk.snowHeight;

      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - pw * 0.22, ty + snowH);
      ctx.lineTo(tx + pw * 0.22, ty + snowH);
      ctx.closePath();
      var snowG = ctx.createLinearGradient(tx - pw*0.22, ty, tx + pw*0.22, ty + snowH);
      snowG.addColorStop(0,   pk.iceBlue ? 'rgba(180,220,255,0.95)' : 'rgba(255,255,255,0.95)');
      snowG.addColorStop(0.6, pk.iceBlue ? 'rgba(140,190,240,0.75)' : 'rgba(240,245,255,0.75)');
      snowG.addColorStop(1,   'rgba(200,220,255,0)');
      ctx.fillStyle = snowG;
      ctx.fill();
    });
    ctx.restore();
  }

  function drawAuroraCurtain(ctx, w, h, t, i, col, alphaBase) {
    var hOff = SJ._layerOffsets[0] * 0.08;
    ctx.save();
    ctx.globalAlpha = alphaBase + 0.07 * Math.sin(t * 0.6 + i * 1.7);

    // Vertical curtain rays
    var numRays = 14;
    for (var r = 0; r < numRays; r++) {
      var rx = (r / numRays + hOff * 0.0003) * w * 1.4 - w * 0.1;
      rx = ((rx + w * 2) % (w * 1.4)) - w * 0.1;
      var waveAmp  = 18 + 12 * Math.sin(t * 0.5 + r * 0.7 + i);
      var baseYRay = h * (0.04 + i * 0.1) + waveAmp * Math.sin(t * 0.4 + r * 0.5);
      var rayH     = h * (0.12 + 0.08 * Math.sin(t * 0.3 + r + i * 2));
      var rayAlpha = (0.5 + 0.4 * Math.sin(r * 1.2 + t * 0.8 + i)) * alphaBase * 1.4;

      var rayG = ctx.createLinearGradient(0, baseYRay, 0, baseYRay + rayH);
      rayG.addColorStop(0,   'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0)');
      rayG.addColorStop(0.2, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + rayAlpha.toFixed(2) + ')');
      rayG.addColorStop(0.6, 'rgba(' + col.r + ',' + col.g + ',' + col.b + ',' + (rayAlpha * 0.7).toFixed(2) + ')');
      rayG.addColorStop(1,   'rgba(' + col.r + ',' + col.g + ',' + col.b + ',0)');

      var rayW = 8 + 6 * Math.sin(r * 0.9 + t * 0.2);
      ctx.fillStyle = rayG;
      ctx.fillRect(rx - rayW / 2, baseYRay, rayW, rayH);
    }
    ctx.restore();
  }

  function renderNorthernLightsBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var t = SJ.elapsed / 1000;

    // ── Deep arctic night sky ─────────────────────────────────
    var skyG = ctx.createLinearGradient(0, 0, 0, h);
    skyG.addColorStop(0,    '#010510');
    skyG.addColorStop(0.35, '#030d22');
    skyG.addColorStop(0.65, '#071830');
    skyG.addColorStop(1,    '#0a1e30');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, w, h);

    // ── Stars with colour tints ───────────────────────────────
    var starOff = SJ._layerOffsets[0] * 0.08;
    SJ._stars.forEach(function (star) {
      star.twinkle += star.twinkleSpeed;
      var sx    = ((star.x + starOff) % w + w) % w;
      var sy    = star.y * (h * 0.72 / 700);
      var alpha = 0.35 + 0.55 * Math.sin(star.twinkle);
      if (star.isBright) {
        // Bright star glow
        var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 4);
        sg.addColorStop(0,   'rgba(' + star.r + ',' + star.g + ',' + star.b + ',' + (alpha * 0.8) + ')');
        sg.addColorStop(1,   'rgba(' + star.r + ',' + star.g + ',' + star.b + ',0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',' + alpha + ')';
      ctx.fill();
    });

    // ── Shooting stars ────────────────────────────────────────
    if (SJ._shootingStars) {
      SJ._shootingStars.forEach(function (ss) {
        ss.nextSpawn -= SJ.dt / 1000;
        if (!ss.active && ss.nextSpawn <= 0) {
          ss.active = true; ss.life = 0;
          ss.x = Math.random() * w; ss.y = Math.random() * h * 0.4;
          ss.nextSpawn = 6 + Math.random() * 14;
        }
        if (ss.active) {
          ss.life += SJ.dt / 1000;
          if (ss.life >= ss.maxLife) { ss.active = false; return; }
          var p = ss.life / ss.maxLife;
          var alpha = p < 0.2 ? p / 0.2 : (p > 0.7 ? (1 - p) / 0.3 : 1);
          var ex = ss.x + ss.vx * ss.life;
          var ey = ss.y + ss.vy * ss.life;
          var tailLen = 80 + 60 * p;
          ctx.save();
          var ssG = ctx.createLinearGradient(ex - tailLen, ey - tailLen * (ss.vy / ss.vx), ex, ey);
          ssG.addColorStop(0, 'rgba(255,255,255,0)');
          ssG.addColorStop(1, 'rgba(255,255,255,' + (alpha * 0.85) + ')');
          ctx.strokeStyle = ssG;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ex - tailLen, ey - tailLen * (ss.vy / Math.abs(ss.vx)));
          ctx.lineTo(ex, ey);
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // ── Aurora borealis — multi-colour curtains ────────────────
    var auroraCols = [
      { r: 0,   g: 255, b: 130 },  // emerald green
      { r: 0,   g: 200, b: 255 },  // cyan blue
      { r: 160, g: 0,   b: 255 },  // violet
      { r: 0,   g: 255, b: 80  },  // bright green
      { r: 80,  g: 0,   b: 200 },  // deep purple
    ];
    var auroraAlphas = [0.22, 0.18, 0.16, 0.14, 0.12];
    auroraCols.forEach(function (col, i) {
      drawAuroraCurtain(ctx, w, h, t, i, col, auroraAlphas[i]);
    });

    // ── Mountain silhouettes (3 layers) ──────────────────────
    drawMountainSilhouette(ctx, 2, h * 0.78, 0.45, '#050e1c', '#020810');
    drawMountainSilhouette(ctx, 1, h * 0.70, 0.72, '#040c18', '#020810');
    drawMountainSilhouette(ctx, 0, h * 0.62, 1.00, '#020a14', '#010608');

    // ── Snowfield ground ─────────────────────────────────────
    var sfG = ctx.createLinearGradient(0, h * 0.78, 0, h);
    sfG.addColorStop(0, '#08182a');
    sfG.addColorStop(0.3,'#0a1e30');
    sfG.addColorStop(1,  '#050d18');
    ctx.fillStyle = sfG;
    ctx.fillRect(0, h * 0.78, w, h * 0.22);

    // Aurora reflection on snowfield
    ctx.save();
    ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 0.5);
    var refG = ctx.createLinearGradient(0, h * 0.78, 0, h);
    refG.addColorStop(0, 'rgba(0,255,130,0.5)');
    refG.addColorStop(0.4,'rgba(100,0,255,0.3)');
    refG.addColorStop(1,  'rgba(0,200,255,0.1)');
    ctx.fillStyle = refG;
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
    ctx.restore();

    // Snow sparkles on ground
    ctx.save();
    for (var si = 0; si < 35; si++) {
      var sx2 = ((si * 317 + SJ._layerOffsets[3] * 0.5) % w + w) % w;
      var sy2 = h * (0.8 + (si % 5) * 0.04);
      var sAlpha = 0.3 + 0.5 * Math.sin(t * 3 + si * 0.8);
      ctx.fillStyle = 'rgba(180,220,255,' + sAlpha + ')';
      ctx.beginPath();
      ctx.arc(sx2, sy2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Mist at base of mountains
    var mistG = ctx.createLinearGradient(0, h * 0.6, 0, h * 0.75);
    mistG.addColorStop(0, 'rgba(8,20,40,0)');
    mistG.addColorStop(1, 'rgba(8,20,40,0.55)');
    ctx.fillStyle = mistG;
    ctx.fillRect(0, h * 0.6, w, h * 0.15);
  }

  // ══════════════════════════════════════════════════════════════
  // ZONE 2 — DEEP SPACE
  // ══════════════════════════════════════════════════════════════
  function renderSpaceBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var t = SJ.elapsed / 1000;
    var objs = SJ._spaceObjs || {};

    // ── Infinite black ────────────────────────────────────────
    ctx.fillStyle = '#000007';
    ctx.fillRect(0, 0, w, h);

    // ── Distant galaxy cluster (static tinted wash) ───────────
    var galG = ctx.createRadialGradient(w * 0.38, h * 0.45, 0, w * 0.38, h * 0.45, w * 0.7);
    galG.addColorStop(0,   'rgba(40,20,80,0.18)');
    galG.addColorStop(0.5, 'rgba(20,10,50,0.08)');
    galG.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = galG;
    ctx.fillRect(0, 0, w, h);

    // ── Nebula clouds ─────────────────────────────────────────
    if (objs.nebulas) {
      objs.nebulas.forEach(function (neb, ni) {
        var nx  = neb.x * w + (SJ._layerOffsets[0] * 0.04) % (w * 0.3);
        var ny  = neb.y * h;
        var pul = 0.012 * Math.sin(t * 0.18 + ni * 1.3);
        ctx.save();
        ctx.globalAlpha = neb.alpha + pul;
        ctx.translate(nx, ny);
        ctx.rotate(neb.rot + t * 0.003 * (ni % 2 === 0 ? 1 : -1));
        var ng = ctx.createRadialGradient(0, 0, 0, 0, 0, neb.rx);
        var h1 = neb.hue, h2 = (neb.hue + 40) % 360;
        ng.addColorStop(0,   'hsla(' + h1 + ',80%,60%,0.7)');
        ng.addColorStop(0.35,'hsla(' + h2 + ',70%,45%,0.5)');
        ng.addColorStop(0.65,'hsla(' + h1 + ',60%,30%,0.2)');
        ng.addColorStop(1,   'hsla(' + h1 + ',50%,20%,0)');
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.ellipse(0, 0, neb.rx, neb.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        // second layer shifted for depth
        ctx.globalAlpha = (neb.alpha + pul) * 0.5;
        ctx.rotate(0.8);
        ctx.beginPath();
        ctx.ellipse(neb.rx * 0.2, neb.ry * 0.15, neb.rx * 0.7, neb.ry * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // ── Star field (coloured, varied sizes) ───────────────────
    var speedF = Math.min(1, Math.max(0, (SJ.speed - 5) / 18));
    SJ._stars.forEach(function (star) {
      star.twinkle += star.twinkleSpeed;
      var depthOff = SJ._layerOffsets[2] * 0.06 * star.size;
      var sx = ((star.x + depthOff) % (w * 1.2) + w * 1.2) % (w * 1.2) - w * 0.1;
      var sy = (star.y * h / 700) % h;
      var alpha = 0.45 + 0.5 * Math.sin(star.twinkle);

      if (star.isBright) {
        var bg = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 5);
        bg.addColorStop(0,   'rgba(' + star.r + ',' + star.g + ',' + star.b + ',' + alpha + ')');
        bg.addColorStop(1,   'rgba(' + star.r + ',' + star.g + ',' + star.b + ',0)');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 5, 0, Math.PI * 2);
        ctx.fill();
        // diffraction spikes
        ctx.save();
        ctx.globalAlpha = alpha * 0.55;
        ctx.strokeStyle = 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',0.6)';
        ctx.lineWidth = 0.8;
        for (var sp = 0; sp < 4; sp++) {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          var sa = sp * Math.PI / 2;
          ctx.lineTo(sx + Math.cos(sa) * star.size * 9, sy + Math.sin(sa) * star.size * 9);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Speed streaks
      if (speedF > 0.1 && star.size > 0.8) {
        var sl = speedF * star.size * 12;
        ctx.save();
        ctx.globalAlpha = alpha * speedF * 0.7;
        var stG = ctx.createLinearGradient(sx, sy, sx + sl, sy);
        stG.addColorStop(0, 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',0)');
        stG.addColorStop(1, 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',0.8)');
        ctx.strokeStyle = stG;
        ctx.lineWidth = star.size * 0.6;
        ctx.beginPath();
        ctx.moveTo(sx, sy); ctx.lineTo(sx + sl, sy);
        ctx.stroke();
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',' + alpha + ')';
      ctx.fill();
    });

    // ── Planets ───────────────────────────────────────────────
    if (objs.length) {
      objs.forEach(function (obj) {
        if (obj.type !== 'planet') return;
        var px = obj.x * w + SJ._layerOffsets[1] * 0.02;
        var py = obj.y * h;
        var pr = obj.r;

        // Planetary body
        var pg = ctx.createRadialGradient(px - pr*0.3, py - pr*0.3, 0, px, py, pr * 1.1);
        pg.addColorStop(0,   'hsl(' + obj.hue + ',55%,72%)');
        pg.addColorStop(0.5, 'hsl(' + obj.hue + ',45%,50%)');
        pg.addColorStop(1,   'hsl(' + (obj.hue + 20) + ',40%,22%)');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();

        // Atmospheric glow
        var atmoG = ctx.createRadialGradient(px, py, pr * 0.7, px, py, pr * 1.5);
        atmoG.addColorStop(0,   'hsla(' + obj.hue + ',80%,70%,0)');
        atmoG.addColorStop(0.6, 'hsla(' + obj.hue + ',80%,60%,0.12)');
        atmoG.addColorStop(1,   'hsla(' + obj.hue + ',80%,50%,0)');
        ctx.fillStyle = atmoG;
        ctx.beginPath();
        ctx.arc(px, py, pr * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Rings
        if (obj.rings) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(obj.ringTilt || 0.35);
          var rg = ctx.createLinearGradient(-pr * 2.5, 0, pr * 2.5, 0);
          rg.addColorStop(0,    'rgba(200,180,120,0)');
          rg.addColorStop(0.25, 'rgba(200,180,120,0.35)');
          rg.addColorStop(0.42, 'rgba(200,180,120,0.55)');
          rg.addColorStop(0.58, 'rgba(200,180,120,0.35)');
          rg.addColorStop(0.75, 'rgba(180,160,100,0.2)');
          rg.addColorStop(1,    'rgba(180,160,100,0)');
          ctx.strokeStyle = rg;
          ctx.lineWidth = pr * 0.65;
          ctx.beginPath();
          ctx.ellipse(0, 0, pr * 2.2, pr * 0.45, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Moon
        if (obj.moonR) {
          var ma = t * 0.4;
          var mx = px + Math.cos(ma) * obj.moonOrbit;
          var my = py + Math.sin(ma) * obj.moonOrbit * 0.35;
          var mg = ctx.createRadialGradient(mx - obj.moonR*0.3, my - obj.moonR*0.3, 0, mx, my, obj.moonR);
          mg.addColorStop(0, '#d8d8d8');
          mg.addColorStop(1, '#888');
          ctx.fillStyle = mg;
          ctx.beginPath();
          ctx.arc(mx, my, obj.moonR, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // ── Asteroid belt (lower quadrant) ────────────────────────
    if (objs.asteroids) {
      objs.asteroids.forEach(function (ast) {
        ast.rot += ast.rotSpeed;
        var ax = scrollX(ast.x, SJ._layerOffsets[3] * 0.8, w * 2.5 + 600) - 200;
        if (ax > w + 20 || ax < -20) return;
        var ay = ast.y * h;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(ast.rot);
        var ag = ctx.createRadialGradient(-ast.r * 0.3, -ast.r * 0.3, 0, 0, 0, ast.r * 1.1);
        ag.addColorStop(0,   '#7a7060');
        ag.addColorStop(0.6, '#4a4035');
        ag.addColorStop(1,   '#2a2020');
        ctx.fillStyle = ag;
        ctx.beginPath();
        var pts = 7;
        for (var pi = 0; pi < pts; pi++) {
          var pa = (pi / pts) * Math.PI * 2;
          var pr2 = ast.r * (0.7 + 0.3 * Math.sin(pa * 2.3 + ast.rot));
          if (pi === 0) ctx.moveTo(Math.cos(pa) * pr2, Math.sin(pa) * pr2);
          else ctx.lineTo(Math.cos(pa) * pr2, Math.sin(pa) * pr2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    }

    // ── Earth curvature at bottom ─────────────────────────────
    ctx.save();
    var earthG = ctx.createRadialGradient(w / 2, h * 1.35, h * 0.1, w / 2, h * 1.35, h * 0.85);
    earthG.addColorStop(0,   'rgba(10,60,180,0.9)');
    earthG.addColorStop(0.35,'rgba(10,80,200,0.65)');
    earthG.addColorStop(0.6, 'rgba(5,50,150,0.3)');
    earthG.addColorStop(1,   'rgba(0,20,80,0)');
    ctx.fillStyle = earthG;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 1.35, w * 1.0, h * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cloud bands on Earth
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffffff';
    for (var ci = 0; ci < 7; ci++) {
      var cOff = ((ci * 280 + SJ._layerOffsets[1] * 0.25) % (w + 500) + w + 500) % (w + 500) - 250;
      var cEY  = h * (0.82 + (ci % 3) * 0.04);
      ctx.beginPath();
      ctx.ellipse(cOff, cEY, 100 + ci * 15, 12 + ci % 3 * 5, 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── Solar corona top-right ────────────────────────────────
    var scG = ctx.createRadialGradient(w, -30, 0, w, -30, 380);
    scG.addColorStop(0,   'rgba(255,240,120,0.35)');
    scG.addColorStop(0.5, 'rgba(255,180,40,0.12)');
    scG.addColorStop(1,   'rgba(255,120,0,0)');
    ctx.fillStyle = scG;
    ctx.fillRect(w - 380, -30, 410, 410);
  }

  // ══════════════════════════════════════════════════════════════
  // ZONE 3 — NEON FALLING CITY
  // ══════════════════════════════════════════════════════════════
  function drawNeonBuilding(ctx, b, bx, by, bw, bh, t, alpha) {
    ctx.globalAlpha = alpha;
    var nHue = b.neonHue;

    // Body
    var grad = ctx.createLinearGradient(bx, by, bx + bw, by);
    grad.addColorStop(0,   'hsl(' + b.hue + ',28%,' + (5 + (b.layer || 0) * 2) + '%)');
    grad.addColorStop(0.5, 'hsl(' + b.hue + ',25%,' + (8 + (b.layer || 0) * 2) + '%)');
    grad.addColorStop(1,   'hsl(' + b.hue + ',22%,' + (4 + (b.layer || 0) * 2) + '%)');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw, bh);

    // Lit windows
    b.litWindows.forEach(function (win) {
      var wx2 = bx + win.wx * (bw / b.width);
      var wy2 = by + win.wy * (bh / b.height);
      var wA  = win.flicker ? (0.5 + 0.5 * Math.sin(t * 8 + win.phase)) : 0.85;
      ctx.fillStyle = 'rgba(' + win.r + ',' + win.g + ',' + win.b2 + ',' + (wA * 0.9) + ')';
      ctx.fillRect(wx2, wy2, 4 * (bw / b.width), 5 * (bh / b.height));
    });

    // Neon sign
    if (b.hasNeonSign) {
      ctx.save();
      ctx.globalAlpha = alpha * (0.7 + 0.3 * Math.sin(t * 3 + b.neonHue));
      ctx.shadowBlur  = 18;
      ctx.shadowColor = 'hsl(' + nHue + ',100%,60%)';
      ctx.strokeStyle = 'hsl(' + nHue + ',100%,65%)';
      ctx.lineWidth   = 2;
      var signY = by + bh * 0.25;
      for (var nr = 0; nr < b.neonRows; nr++) {
        ctx.strokeRect(bx + bw*0.12, signY + nr*bh*0.12, bw*0.76, bh*0.08);
      }
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Rooftop light
    if (b.rooftopLight) {
      ctx.save();
      ctx.shadowBlur  = 14;
      ctx.shadowColor = 'hsl(' + b.rooftopHue + ',100%,60%)';
      ctx.fillStyle   = 'hsl(' + b.rooftopHue + ',100%,70%)';
      var blinkA = 0.6 + 0.4 * Math.sin(t * 1.5 + nHue * 0.05);
      ctx.globalAlpha = alpha * blinkA;
      ctx.beginPath();
      ctx.arc(bx + bw * 0.5, by - 3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.globalAlpha = 1;
  }

  function renderFallingCityBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var t = SJ.elapsed / 1000;

    // ── Void sky ──────────────────────────────────────────────
    var skyG = ctx.createLinearGradient(0, 0, 0, h);
    skyG.addColorStop(0,    '#03000a');
    skyG.addColorStop(0.3,  '#09001a');
    skyG.addColorStop(0.65, '#150028');
    skyG.addColorStop(1,    '#1e0038');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, w, h);

    // ── Distant stars (very faint) ────────────────────────────
    SJ._stars.slice(0, 100).forEach(function (star) {
      var alpha = 0.12 + 0.18 * Math.sin(star.twinkle);
      star.twinkle += star.twinkleSpeed * 0.5;
      var sx = (star.x % w + w) % w;
      ctx.beginPath();
      ctx.arc(sx, star.y * 0.28, star.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fill();
    });

    // ── Pulsing atmospheric nebula glow ───────────────────────
    [
      { cx: 0.25, cy: 0.35, r: w*0.55, hue: 300, alpha: 0.055 + 0.02*Math.sin(t*0.7) },
      { cx: 0.75, cy: 0.45, r: w*0.45, hue: 185, alpha: 0.045 + 0.015*Math.sin(t*0.9+1) },
      { cx: 0.50, cy: 0.18, r: w*0.4,  hue: 260, alpha: 0.04  + 0.018*Math.sin(t*0.5+2) },
    ].forEach(function (gd) {
      var ag = ctx.createRadialGradient(gd.cx*w, gd.cy*h, 0, gd.cx*w, gd.cy*h, gd.r);
      ag.addColorStop(0,   'hsla(' + gd.hue + ',100%,60%,' + gd.alpha + ')');
      ag.addColorStop(0.6, 'hsla(' + gd.hue + ',80%,40%,' + (gd.alpha*0.4) + ')');
      ag.addColorStop(1,   'hsla(' + gd.hue + ',60%,20%,0)');
      ctx.fillStyle = ag;
      ctx.fillRect(0, 0, w, h);
    });

    // ── Night buildings (3 layers, far→near) ─────────────────
    var bRange = w * 2.8 + 700;
    [
      { l: 2, scaleMult: 0.45, bottomY: h * 0.75, alpha: 0.55 },
      { l: 1, scaleMult: 0.72, bottomY: h * 0.66, alpha: 0.78 },
      { l: 0, scaleMult: 1.0,  bottomY: h * 0.55, alpha: 1.00 },
    ].forEach(function (ld) {
      var off = SJ._layerOffsets[ld.l + 1];
      SJ._nightBuildings.filter(function (b) { return b.layer === ld.l; }).forEach(function (b) {
        var bx = scrollX(b.x, off, bRange) - 200;
        if (bx > w + 200 || bx + b.width * ld.scaleMult < -10) return;
        var bw = b.width  * ld.scaleMult;
        var bh = b.height * ld.scaleMult;
        var by = ld.bottomY - bh;
        drawNeonBuilding(ctx, b, bx, by, bw, bh, t, ld.alpha);
      });
    });

    // ── Wet street ───────────────────────────────────────────
    var streetY = h * 0.88;
    ctx.fillStyle = '#08000f';
    ctx.fillRect(0, streetY, w, h - streetY);

    // Puddle reflections (neon smears)
    var reflColors = ['rgba(255,0,255,', 'rgba(0,255,255,', 'rgba(255,100,0,'];
    for (var ri2 = 0; ri2 < 8; ri2++) {
      var rCol  = reflColors[ri2 % reflColors.length];
      var rxPos = ((ri2 * 297 + SJ._layerOffsets[3] * 0.6) % w + w) % w;
      var rw    = 25 + (ri2 % 3) * 18;
      var rAlpha = 0.08 + 0.06 * Math.sin(t * 1.5 + ri2);
      ctx.fillStyle = rCol + rAlpha + ')';
      ctx.beginPath();
      ctx.ellipse(rxPos, streetY + 10, rw, 4 + (ri2 % 3) * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Rain ─────────────────────────────────────────────────
    ctx.save();
    var rainSpd = (SJ.scrollSpeed || 220) / 220;
    for (var rn = 0; rn < 120; rn++) {
      var rnx = ((rn * 131.5 + SJ._layerOffsets[3] * 0.55) % w + w) % w;
      var rny = ((rn * 97 + SJ.elapsed * 0.9 * rainSpd) % h + h) % h;
      var rnA = 0.12 + 0.14 * ((rn * 17) % 10) / 10;
      ctx.strokeStyle = 'rgba(120,140,255,' + rnA + ')';
      ctx.lineWidth   = 0.7;
      ctx.beginPath();
      ctx.moveTo(rnx, rny);
      ctx.lineTo(rnx - 2, rny + 18);
      ctx.stroke();
    }
    ctx.restore();

    // ── Holographic billboard flashes ────────────────────────
    var holoAlpha = 0.03 + 0.025 * Math.sin(t * 7 + 1);
    if (holoAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = holoAlpha;
      ctx.fillStyle = 'rgba(0,255,255,1)';
      ctx.fillRect(w * 0.22, h * 0.18, w * 0.24, h * 0.14);
      ctx.fillStyle = 'rgba(255,0,200,1)';
      ctx.fillRect(w * 0.58, h * 0.22, w * 0.18, h * 0.1);
      ctx.restore();
    }

    // ── Edge neon vignette ────────────────────────────────────
    var nHue2 = (t * 55) % 360;
    var leftG = ctx.createLinearGradient(0, 0, w * 0.12, 0);
    leftG.addColorStop(0,   'hsla(' + nHue2 + ',100%,55%,0.18)');
    leftG.addColorStop(1,   'hsla(' + nHue2 + ',100%,55%,0)');
    ctx.fillStyle = leftG;
    ctx.fillRect(0, 0, w * 0.12, h);

    var rightG = ctx.createLinearGradient(w, 0, w * 0.88, 0);
    rightG.addColorStop(0,   'hsla(' + ((nHue2 + 180) % 360) + ',100%,55%,0.18)');
    rightG.addColorStop(1,   'hsla(' + ((nHue2 + 180) % 360) + ',100%,55%,0)');
    ctx.fillStyle = rightG;
    ctx.fillRect(w * 0.88, 0, w * 0.12, h);

    // Hard edge strips (bright neon lines)
    ctx.save();
    ctx.shadowBlur  = 14;
    ctx.shadowColor = 'hsl(' + nHue2 + ',100%,60%)';
    ctx.strokeStyle = 'hsl(' + nHue2 + ',100%,62%)';
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(w * 0.08, 0); ctx.lineTo(w * 0.08, h); ctx.stroke();
    ctx.shadowColor = 'hsl(' + ((nHue2 + 180) % 360) + ',100%,60%)';
    ctx.strokeStyle = 'hsl(' + ((nHue2 + 180) % 360) + ',100%,62%)';
    ctx.beginPath(); ctx.moveTo(w * 0.92, 0); ctx.lineTo(w * 0.92, h); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════
  // ZONE 4 — MOONLIT OCEAN
  // ══════════════════════════════════════════════════════════════
  function renderOceanBg(ctx) {
    var w = SJ.width, h = SJ.height;
    var t = SJ.elapsed / 1000;

    // ── Deep velvet night sky ─────────────────────────────────
    var skyG = ctx.createLinearGradient(0, 0, 0, h * 0.58);
    skyG.addColorStop(0,    '#010812');
    skyG.addColorStop(0.2,  '#020d1e');
    skyG.addColorStop(0.55, '#061525');
    skyG.addColorStop(1,    '#0a1e32');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, w, h * 0.58);

    // ── Milky Way arc ─────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.09 + 0.03 * Math.sin(t * 0.12);
    var mwG = ctx.createLinearGradient(0, h * 0.05, w, h * 0.42);
    mwG.addColorStop(0,    'rgba(200,200,255,0)');
    mwG.addColorStop(0.15, 'rgba(200,200,255,0.7)');
    mwG.addColorStop(0.4,  'rgba(180,160,255,0.5)');
    mwG.addColorStop(0.65, 'rgba(200,200,255,0.65)');
    mwG.addColorStop(1,    'rgba(200,200,255,0)');
    ctx.fillStyle = mwG;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.05);
    for (var mwx = 0; mwx <= w; mwx += 8) {
      var mwy = h * 0.05 + (mwx / w) * h * 0.38 + Math.sin(mwx * 0.015) * h * 0.04;
      ctx.lineTo(mwx, mwy);
    }
    ctx.lineTo(w, h * 0.5); ctx.lineTo(0, h * 0.12); ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Stars (dense, many bright) ────────────────────────────
    var starOff2 = SJ._layerOffsets[0] * 0.05;
    SJ._stars.forEach(function (star) {
      star.twinkle += star.twinkleSpeed;
      var sx = ((star.x + starOff2) % w + w) % w;
      var sy = star.y * (h * 0.55 / 700);
      var alpha = 0.3 + 0.6 * Math.sin(star.twinkle);
      if (star.isBright) {
        var sg2 = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.size * 5);
        sg2.addColorStop(0, 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',' + alpha + ')');
        sg2.addColorStop(1, 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',0)');
        ctx.fillStyle = sg2;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + star.r + ',' + star.g + ',' + star.b + ',' + alpha + ')';
      ctx.fill();
    });

    // ── Shooting stars ────────────────────────────────────────
    if (SJ._shootingStars) {
      SJ._shootingStars.slice(0, 3).forEach(function (ss) {
        ss.nextSpawn -= SJ.dt / 1000;
        if (!ss.active && ss.nextSpawn <= 0) {
          ss.active = true; ss.life = 0;
          ss.x = Math.random() * w; ss.y = Math.random() * h * 0.35;
          ss.nextSpawn = 5 + Math.random() * 10;
        }
        if (ss.active) {
          ss.life += SJ.dt / 1000;
          if (ss.life >= ss.maxLife) { ss.active = false; return; }
          var p = ss.life / ss.maxLife;
          var sAlpha = p < 0.25 ? p / 0.25 : (p > 0.65 ? (1 - p) / 0.35 : 1);
          var ex = ss.x + ss.vx * ss.life;
          var ey = ss.y + ss.vy * ss.life;
          ctx.save();
          var ssG2 = ctx.createLinearGradient(ex - 90, ey - 30, ex, ey);
          ssG2.addColorStop(0, 'rgba(200,230,255,0)');
          ssG2.addColorStop(1, 'rgba(255,255,255,' + sAlpha + ')');
          ctx.strokeStyle = ssG2;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(ex - 90, ey - 30); ctx.lineTo(ex, ey);
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // ── Moon (large, detailed) ────────────────────────────────
    var moonX = w * 0.78, moonY = h * 0.12;
    var moonR  = Math.min(w, h) * 0.065;

    // Outer corona
    var corona = ctx.createRadialGradient(moonX, moonY, moonR*0.8, moonX, moonY, moonR*4.5);
    corona.addColorStop(0,   'rgba(255,252,220,0.18)');
    corona.addColorStop(0.3, 'rgba(220,240,255,0.08)');
    corona.addColorStop(0.7, 'rgba(180,220,255,0.03)');
    corona.addColorStop(1,   'rgba(180,200,255,0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner halo ring
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = 'rgba(240,248,255,0.6)';
    ctx.lineWidth   = moonR * 0.18;
    ctx.shadowBlur  = moonR * 0.5;
    ctx.shadowColor = 'rgba(200,230,255,0.4)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 1.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Moon disk
    var moonG = ctx.createRadialGradient(moonX - moonR*0.28, moonY - moonR*0.28, 0, moonX, moonY, moonR);
    moonG.addColorStop(0,   '#FFFEEE');
    moonG.addColorStop(0.45,'#EEF0E8');
    moonG.addColorStop(0.75,'#D8DDD0');
    moonG.addColorStop(1,   '#B8C0A8');
    ctx.fillStyle = moonG;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // Crater details
    ctx.save();
    ctx.globalAlpha = 0.18;
    [[0.25, 0.2, 0.18], [-0.3, -0.1, 0.12], [0.1, -0.35, 0.22], [-0.15, 0.3, 0.1]].forEach(function (cr) {
      ctx.fillStyle = '#8a9080';
      ctx.beginPath();
      ctx.arc(moonX + cr[0]*moonR, moonY + cr[1]*moonR, cr[2]*moonR, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // ── Ocean surface ─────────────────────────────────────────
    var oceanY = h * 0.53;
    var oceanG = ctx.createLinearGradient(0, oceanY, 0, h);
    oceanG.addColorStop(0,   '#071c30');
    oceanG.addColorStop(0.2, '#082535');
    oceanG.addColorStop(0.55,'#061828');
    oceanG.addColorStop(1,   '#030e1a');
    ctx.fillStyle = oceanG;
    ctx.fillRect(0, oceanY, w, h - oceanY);

    // Horizon glow (moonlight on water)
    var horizOG = ctx.createLinearGradient(0, oceanY - 30, 0, oceanY + 60);
    horizOG.addColorStop(0, 'rgba(140,180,220,0)');
    horizOG.addColorStop(0.5,'rgba(100,150,200,0.18)');
    horizOG.addColorStop(1, 'rgba(60,100,160,0)');
    ctx.fillStyle = horizOG;
    ctx.fillRect(0, oceanY - 30, w, 90);

    // ── Moonlight reflection path ─────────────────────────────
    ctx.save();
    var refWidth = 55 + 45 * Math.abs(Math.sin(t * 0.28));
    var refG = ctx.createLinearGradient(0, oceanY, 0, h);
    refG.addColorStop(0,   'rgba(255,252,220,0.22)');
    refG.addColorStop(0.4, 'rgba(220,240,255,0.14)');
    refG.addColorStop(1,   'rgba(180,210,255,0.04)');
    ctx.fillStyle = refG;
    ctx.beginPath();
    ctx.moveTo(moonX - refWidth, h);
    ctx.quadraticCurveTo(moonX - refWidth * 0.2, oceanY + 30, moonX, oceanY);
    ctx.quadraticCurveTo(moonX + refWidth * 0.2, oceanY + 30, moonX + refWidth, h);
    ctx.closePath();
    ctx.fill();

    // Shimmer flecks on reflection path
    ctx.globalAlpha = 0.55;
    for (var fl = 0; fl < 18; fl++) {
      var fx  = moonX + (Math.sin(fl * 2.3 + t * 2.1) * refWidth * 0.8);
      var fy  = oceanY + (fl / 18) * (h - oceanY) * 0.9;
      var fA  = 0.4 + 0.55 * Math.sin(t * 4 + fl * 1.4);
      ctx.fillStyle = 'rgba(255,255,220,' + fA + ')';
      ctx.beginPath();
      ctx.ellipse(fx, fy, 3 + fl % 4, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── Ocean wave layers ─────────────────────────────────────
    SJ._oceanWaves.forEach(function (wave) {
      wave.phase += wave.speed * (SJ.dt / 1000);
      var wOff = SJ._layerOffsets[Math.min(2, 3)];
      var wx   = scrollX(wave.x, wOff * 0.2, w * 2 + 600) - 200;
      if (wx > w + 300 || wx < -300) return;

      var wy = oceanY + wave.yFrac * (h - oceanY) * 0.6;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(wx - 120, wy);
      for (var xi = wx - 120; xi < wx + wave.width; xi += 4) {
        ctx.lineTo(xi, wy + Math.sin(xi * wave.freq + wave.phase) * wave.amplitude);
      }
      ctx.strokeStyle = 'rgba(80,160,220,' + wave.alpha + ')';
      ctx.lineWidth   = 1.8;
      ctx.stroke();

      // Foam crests on top
      if (wave.hasFoam) {
        ctx.globalAlpha = wave.alpha * 0.5;
        ctx.strokeStyle = 'rgba(220,240,255,0.7)';
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.moveTo(wx - 100, wy);
        for (var xi2 = wx - 100; xi2 < wx + wave.width * 0.7; xi2 += 4) {
          var wy2 = wy + Math.sin(xi2 * wave.freq + wave.phase) * wave.amplitude;
          if (Math.sin(xi2 * wave.freq + wave.phase) > 0.6) {
            ctx.lineTo(xi2, wy2 - 2);
          } else {
            ctx.moveTo(xi2, wy2);
          }
        }
        ctx.stroke();
      }
      ctx.restore();
    });

    // ── Bioluminescent glow patches ───────────────────────────
    for (var bi = 0; bi < 10; bi++) {
      var bxo = scrollX(bi * 380, SJ._layerOffsets[2] * 0.28, w + 400) - 200;
      var byo  = oceanY + (20 + (bi % 4) * 38);
      var bA   = 0.06 + 0.04 * Math.sin(t * 1.4 + bi * 0.7);
      var bioG = ctx.createRadialGradient(bxo, byo, 0, bxo, byo, 75);
      bioG.addColorStop(0, 'rgba(0,255,180,' + (bA * 1.8) + ')');
      bioG.addColorStop(0.5,'rgba(0,200,255,' + bA + ')');
      bioG.addColorStop(1, 'rgba(0,150,255,0)');
      ctx.fillStyle = bioG;
      ctx.beginPath();
      ctx.ellipse(bxo, byo, 75, 24, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Distant cliffs / sea stacks ───────────────────────────
    var cliffRange = w * 2 + 500;
    [
      { xBase: 200,  h: 0.16, w: 80,  dark: '#0a1520' },
      { xBase: 800,  h: 0.22, w: 55,  dark: '#08121c' },
      { xBase: 1400, h: 0.14, w: 95,  dark: '#0a1822' },
      { xBase: 2200, h: 0.19, w: 68,  dark: '#091520' },
      { xBase: 2900, h: 0.25, w: 90,  dark: '#0a1622' },
    ].forEach(function (cl) {
      var cx = scrollX(cl.xBase, SJ._layerOffsets[2] * 0.35, cliffRange) - 100;
      if (cx > w + 100 || cx < -100) return;
      var cTop = oceanY - cl.h * h;
      var clG  = ctx.createLinearGradient(cx, cTop, cx + cl.w, cTop);
      clG.addColorStop(0,   '#08101a');
      clG.addColorStop(0.5, cl.dark);
      clG.addColorStop(1,   '#060c14');
      ctx.fillStyle = clG;
      ctx.fillRect(cx, cTop, cl.w, cl.h * h + (h - oceanY));
      // Cliff top highlight
      ctx.fillStyle = 'rgba(120,160,200,0.12)';
      ctx.fillRect(cx, cTop, cl.w, 3);
    });

    // ── Horizon mist ─────────────────────────────────────────
    var mistG = ctx.createLinearGradient(0, oceanY - 50, 0, oceanY + 55);
    mistG.addColorStop(0, 'rgba(6,22,42,0)');
    mistG.addColorStop(0.5,'rgba(8,25,45,0.45)');
    mistG.addColorStop(1, 'rgba(8,25,45,0)');
    ctx.fillStyle = mistG;
    ctx.fillRect(0, oceanY - 50, w, 105);
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER ZONE BACKGROUND (dispatcher)
  // ─────────────────────────────────────────────────────────────
  function renderZoneBackground(zoneIdx, ctx) {
    switch (zoneIdx) {
      case 0: renderCityBg(ctx);          break;
      case 1: renderNorthernLightsBg(ctx); break;
      case 2: renderSpaceBg(ctx);          break;
      case 3: renderFallingCityBg(ctx);    break;
      case 4: renderOceanBg(ctx);          break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SJ.renderBackground — main background render call
  // ─────────────────────────────────────────────────────────────
  SJ.renderBackground = function () {
    var ctx  = SJ.ctx;
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

    SJ.prevZoneIdx      = SJ.currentZoneIdx;
    SJ.currentZoneIdx   = nextIdx;
    SJ.transitioning    = true;
    SJ.transitionTimer  = 0;
    SJ.transitionAlpha  = 0;
    SJ.gameState        = 'transitioning';

    var newZone = SJ.zones[nextIdx];
    SJ.beatInterval = 60000 / newZone.bpm;

    if (SJ.triggerScreenShake)      SJ.triggerScreenShake(6, 200);

    SJ.titleCardText  = newZone.name;
    SJ.titleCardTimer = 2500;
    SJ.nowPlayingText = newZone.displayTitle;
    SJ.nowPlayingTimer = 6000;

    if (SJ.crossfadeTo)              SJ.crossfadeTo(nextIdx);
    if (SJ.playSound)                SJ.playSound('zone_transition');
    if (SJ.spawnZoneTransitionBurst) SJ.spawnZoneTransitionBurst();

    SJ.score    += 500;
    SJ.baseSpeed = 5 + SJ.cycleCount * 0.5 + nextIdx * 0.5;
  }

  // ─────────────────────────────────────────────────────────────
  // SJ.updateZone
  // ─────────────────────────────────────────────────────────────
  SJ.updateZone = function (dt) {
    if (SJ.transitioning) {
      SJ.transitionTimer += dt;
      SJ.transitionAlpha  = Math.min(1, SJ.transitionTimer / SJ.transitionDuration);

      if (SJ.transitionTimer >= SJ.transitionDuration) {
        SJ.transitioning = false;
        SJ.prevZoneIdx   = -1;
        SJ.transitionAlpha = 1;
        SJ.gameState     = 'playing';
        SJ.zoneTimer     = 0;
        SJ.patternChunkIdx   = 0;
        SJ.timeSinceLastChunk = 0;
        if (SJ.clearObstacles)   SJ.clearObstacles();
        if (SJ.startPatternChunk) SJ.startPatternChunk(SJ.currentZoneIdx, 0);
      }
      return;
    }

    SJ.zoneTimer          += dt;
    SJ.timeSinceLastChunk += dt;

    if (SJ.timeSinceLastChunk > SJ.chunkDuration) {
      SJ.timeSinceLastChunk = 0;
      SJ.patternChunkIdx    = (SJ.patternChunkIdx + 1) % 3;
      if (SJ.startPatternChunk) SJ.startPatternChunk(SJ.currentZoneIdx, SJ.patternChunkIdx);
    }

    if (SJ.zoneTimer >= SJ.zoneDuration) {
      startNextZone();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.updateTransition
  // ─────────────────────────────────────────────────────────────
  SJ.updateTransition = function (dt) {
    SJ.updateZone(dt);
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.renderNowPlaying
  // ─────────────────────────────────────────────────────────────
  SJ.renderNowPlaying = function () {
    if (SJ.nowPlayingTimer <= 0 || !SJ.nowPlayingText) return;

    var ctx           = SJ.ctx;
    var totalDuration = 6000;
    var remaining     = SJ.nowPlayingTimer;
    SJ.nowPlayingTimer -= SJ.dt;

    var slideIn = Math.min(1, (totalDuration - remaining) / 400);
    var fadeOut = remaining < 800 ? remaining / 800 : 1;

    var panelW = 300, panelH = 44;
    var panelX = SJ.width - panelW - 16 - (1 - slideIn) * (panelW + 16);
    var panelY = 16;

    ctx.save();
    ctx.globalAlpha = fadeOut * slideIn;
    ctx.fillStyle   = 'rgba(0,0,0,0.72)';
    roundRect(ctx, panelX, panelY, panelW, panelH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth   = 1;
    ctx.stroke();

    var zone = SJ.zones[SJ.currentZoneIdx];
    ctx.fillStyle = zone ? zone.accentColors[0] : '#ffffff';
    ctx.font      = '14px sans-serif';
    ctx.fillText('\u266B', panelX + 10, panelY + 27);

    ctx.fillStyle = '#fff';
    ctx.font      = '11px "Share Tech Mono", monospace';
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

    var ctx           = SJ.ctx;
    var totalDuration = 2500;
    SJ.titleCardTimer -= SJ.dt;
    var remaining     = SJ.titleCardTimer;

    var alpha = 1;
    if (remaining > totalDuration - 400) alpha = (totalDuration - remaining) / 400;
    else if (remaining < 400)             alpha = remaining / 400;
    alpha = Math.max(0, Math.min(1, alpha));

    var zone = SJ.zones[SJ.currentZoneIdx];

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign   = 'center';
    ctx.shadowBlur  = 28;
    ctx.shadowColor = zone ? zone.accentColors[0] : '#ffffff';
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 54px "Oswald", sans-serif';
    ctx.fillText(zone ? zone.name : SJ.titleCardText, SJ.width / 2, SJ.height / 2);
    ctx.font        = '22px "Oswald", sans-serif';
    ctx.fillStyle   = 'rgba(255,255,255,0.7)';
    ctx.fillText(zone ? (zone.subtitle || '') : '', SJ.width / 2, SJ.height / 2 + 42);
    ctx.shadowBlur  = 0;
    ctx.textAlign   = 'left';
    ctx.restore();
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.getZoneConfig
  // ─────────────────────────────────────────────────────────────
  SJ.getZoneConfig = function (idx) {
    return SJ.zones[((idx % 5) + 5) % 5];
  };

})();
