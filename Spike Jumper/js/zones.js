/**
 * Spike Jumper — zones.js (3rd-Person Perspective)
 * Zone configurations, jaw-dropping forward-facing 3D perspective backgrounds,
 * zone transitions, title cards, and now-playing notifications.
 *
 * All 5 zone backgrounds redesigned to show environments from BEHIND the plane,
 * looking forward into the scene. Elements converge at the vanishing point.
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
      displayTitle: 'No Role Modelz \u2014 J. Cole',
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
      displayTitle: 'In Ibiza \u2014 Trae The Truth',
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
      displayTitle: 'Power Trip \u2014 J. Cole',
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
      displayTitle: 'A Tale of 2 Citiez \u2014 J. Cole',
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
      displayTitle: 'The Let Out \u2014 J. Cole',
      bpm: 130,
      skyTop: '#020b1a',
      skyBottom: '#071530',
      accentColors: ['#00d4ff', '#00ff9f', '#4488cc', '#ffffff'],
      layerSpeeds: [0.03, 0.1, 0.25, 0.55],
    },
  ];

  // ─────────────────────────────────────────────────────────────
  // PRE-GENERATED SCENE ELEMENTS FOR PERSPECTIVE VIEWS
  // ─────────────────────────────────────────────────────────────

  // City — buildings radiating from vanishing point
  function generatePerspBuildings() {
    var buildings = [];
    var styles = ['glass', 'brick', 'concrete', 'tower'];
    for (var i = 0; i < 40; i++) {
      buildings.push({
        side:       i % 2 === 0 ? 'left' : 'right',
        depthFrac:  0.05 + Math.random() * 0.88,  // 0=near VP, 1=near viewer
        widthFrac:  0.04 + Math.random() * 0.12,  // fraction of playfield width
        heightFrac: 0.10 + Math.random() * 0.55,  // fraction of playfield height
        style:      styles[Math.floor(Math.random() * styles.length)],
        hue:        195 + Math.random() * 45,
        lit:        38 + Math.random() * 28,
        sat:        12 + Math.random() * 22,
        glintOffset: Math.random() * Math.PI * 2,
        windowLit:   Math.random() < 0.55,
        hasAntenna:  Math.random() < 0.38,
        phase:      Math.random() * Math.PI * 2,
      });
    }
    return buildings;
  }

  // Stars for northern lights & ocean
  function generatePerspStars(count) {
    var stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        // normalized position: (0,0)=center/VP, (1,1)=bottom-right corner
        nx: (Math.random() - 0.5) * 2,
        ny: (Math.random() - 0.5) * 2,
        size:    0.3 + Math.pow(Math.random(), 2.5) * 2.4,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.01 + Math.random() * 0.04,
        r: Math.floor(180 + Math.random() * 75),
        g: Math.floor(180 + Math.random() * 75),
        b: Math.floor(200 + Math.random() * 55),
        bright: Math.random() < 0.06,
      });
    }
    return stars;
  }

  // Space — warping stars (position + angle from VP)
  function generateWarpStars(count) {
    var stars = [];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var dist  = 0.04 + Math.random() * 0.96;  // 0=near VP, 1=far from VP
      stars.push({
        angle:  angle,
        dist:   dist,
        speed:  0.008 + Math.pow(dist, 2) * 0.05,
        size:   0.2 + dist * 2.5,
        r: Math.floor(160 + Math.random() * 95),
        g: Math.floor(160 + Math.random() * 95),
        b: Math.floor(200 + Math.random() * 55),
      });
    }
    return stars;
  }

  // Night city neon buildings
  function generateNeonBuildings() {
    var neons = [];
    for (var i = 0; i < 24; i++) {
      var neonHue = Math.floor(Math.random() * 360);
      neons.push({
        side:      i % 2 === 0 ? 'left' : 'right',
        depthFrac: 0.06 + Math.random() * 0.86,
        widthFrac: 0.05 + Math.random() * 0.14,
        heightFrac:0.12 + Math.random() * 0.65,
        neonHue:   neonHue,
        neonHue2:  (neonHue + 120 + Math.random() * 80) % 360,
        numSigns:  1 + Math.floor(Math.random() * 3),
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: 1.5 + Math.random() * 4,
      });
    }
    return neons;
  }

  // Ocean waves (depth-based horizontal lines)
  function generatePerspWaves(count) {
    var waves = [];
    for (var i = 0; i < count; i++) {
      waves.push({
        depthFrac: 0.02 + Math.random() * 0.96,  // 0=at VP, 1=at viewer
        amplitude: 2 + Math.random() * 14,
        freq:      0.006 + Math.random() * 0.016,
        phase:     Math.random() * Math.PI * 2,
        speed:     0.2 + Math.random() * 0.9,
        alpha:     0.15 + Math.random() * 0.45,
        hasFoam:   Math.random() < 0.45,
        foamAlpha: 0.1 + Math.random() * 0.3,
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

    SJ._perspBuildings  = generatePerspBuildings();
    SJ._neonBuildings   = generateNeonBuildings();
    SJ._perspStars      = generatePerspStars(420);
    SJ._oceanStars      = generatePerspStars(180);
    SJ._warpStars       = generateWarpStars(550);
    SJ._perspWaves      = generatePerspWaves(28);
    SJ._lightningTimer  = 0;
    SJ._lightningAlpha  = 0;
  };

  // ─────────────────────────────────────────────────────────────
  // SHARED UTILITIES
  // ─────────────────────────────────────────────────────────────

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
    ctx.arcTo(x,     y,     x + r, y,         r);
    ctx.closePath();
  }

  /** Linear interpolation */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /**
   * perspX/perspY — project a position from vanishing point at fraction t.
   * t=0 → vanishing point; t=1 → full screen position.
   */
  function perspX(worldX, t) {
    return lerp(SJ.vanishX, worldX, t);
  }
  function perspY(worldY, t) {
    return lerp(SJ.vanishY, worldY, t);
  }

  // ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  // ZONE 0 — GOLDEN HOUR CITY  (flying through a city at sunset)
  // ══════════════════════════════════════════════════════════════
  // ─────────────────────────────────────────────────────────────
  function renderCityBg(ctx) {
    var w  = SJ.width,  h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;
    var scrollT = t;

    // ── Multi-stop sky ──────────────────────────────────────────
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0,    '#0c1c45');
    sky.addColorStop(0.2,  '#1a3a80');
    sky.addColorStop(0.45, '#4a8ec8');
    sky.addColorStop(0.65, '#f0a050');
    sky.addColorStop(0.8,  '#e05820');
    sky.addColorStop(1,    '#c03810');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // ── Sun — centered on vanishing point, slightly above it ──
    var sunX = vx, sunY = vy - h * 0.07;

    // Outer corona (huge radial glow)
    var corona = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.6);
    corona.addColorStop(0,   'rgba(255,230,80,0.22)');
    corona.addColorStop(0.25,'rgba(255,160,40,0.12)');
    corona.addColorStop(0.6, 'rgba(255,100,20,0.05)');
    corona.addColorStop(1,   'rgba(255,80,0,0)');
    ctx.fillStyle = corona;
    ctx.fillRect(0, 0, w, h);

    // Inner halo
    var halo = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.18);
    halo.addColorStop(0,   'rgba(255,255,200,0.6)');
    halo.addColorStop(0.4, 'rgba(255,220,80,0.25)');
    halo.addColorStop(1,   'rgba(255,160,30,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(sunX - w*0.18, sunY - w*0.18, w*0.36, w*0.36);

    // Sun disk
    var disk = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 48);
    disk.addColorStop(0,   '#FFFDE0');
    disk.addColorStop(0.5, '#FFE84A');
    disk.addColorStop(1,   'rgba(255,200,60,0)');
    ctx.fillStyle = disk;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 48, 0, Math.PI * 2);
    ctx.fill();

    // ── Crepuscular rays from sun ──────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.065;
    for (var ri = 0; ri < 16; ri++) {
      var rayAngle = (ri / 16) * Math.PI * 2 + t * 0.006;
      var rayLen   = w * 0.75 + Math.sin(t * 0.12 + ri) * w * 0.12;
      var rayW     = 14 + (ri % 4) * 8;
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(rayAngle);
      var rg = ctx.createLinearGradient(0, 0, rayLen, 0);
      rg.addColorStop(0,   'rgba(255,240,140,0.9)');
      rg.addColorStop(0.4, 'rgba(255,200,80,0.4)');
      rg.addColorStop(1,   'rgba(255,160,40,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(0, -rayW/2);
      ctx.lineTo(rayLen, 0);
      ctx.lineTo(0,  rayW/2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // ── Golden atmospheric haze at horizon ─────────────────────
    var haze = ctx.createRadialGradient(vx, vy, 0, vx, vy, w * 0.45);
    haze.addColorStop(0,   'rgba(255,180,60,0.38)');
    haze.addColorStop(0.5, 'rgba(255,130,40,0.12)');
    haze.addColorStop(1,   'rgba(255,100,20,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);

    // ── Street/ground perspective ──────────────────────────────
    var groundY = SJ.floorY;
    var streetGrad = ctx.createLinearGradient(0, vy, 0, groundY);
    streetGrad.addColorStop(0,   '#8a6040');
    streetGrad.addColorStop(0.3, '#6a5040');
    streetGrad.addColorStop(0.7, '#4a3832');
    streetGrad.addColorStop(1,   '#2e2424');
    ctx.fillStyle = streetGrad;
    ctx.fillRect(0, vy, w, groundY - vy);

    // Perspective road grid lines (converge to VP)
    var numDepth = 12;
    for (var di = 1; di <= numDepth; di++) {
      var depFrac = di / numDepth;
      var gy = lerp(vy, groundY, depFrac);
      var gAlpha = 0.12 + depFrac * 0.18;
      ctx.strokeStyle = 'rgba(160,120,60,' + gAlpha + ')';
      ctx.lineWidth = 0.6 + depFrac * 1.2;
      ctx.beginPath();
      ctx.moveTo(0, gy); ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Vertical road lines (radiating from VP)
    var roadLines = [0, w * 0.25, w * 0.5, w * 0.75, w];
    for (var rl = 0; rl < roadLines.length; rl++) {
      ctx.strokeStyle = 'rgba(120,100,60,0.3)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(roadLines[rl], groundY);
      ctx.stroke();
    }

    // Scrolling road lane dashes
    var dashScroll = (scrollT * 80) % 48;
    ctx.strokeStyle = 'rgba(255,200,50,0.55)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([22, 26]);
    ctx.lineDashOffset = -dashScroll;
    // Center lane markers (perspective lines)
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx - w * 0.12, groundY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx + w * 0.12, groundY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // Sun reflection on road surface
    var reflG = ctx.createLinearGradient(vx, vy, vx, groundY);
    reflG.addColorStop(0,   'rgba(255,180,60,0.35)');
    reflG.addColorStop(0.5, 'rgba(255,150,40,0.15)');
    reflG.addColorStop(1,   'rgba(255,100,20,0)');
    ctx.fillStyle = reflG;
    ctx.beginPath();
    ctx.moveTo(vx - 20, vy);
    ctx.lineTo(vx + 20, vy);
    ctx.lineTo(vx + w * 0.22, groundY);
    ctx.lineTo(vx - w * 0.22, groundY);
    ctx.closePath();
    ctx.fill();

    // ── City buildings (perspective, both sides) ───────────────
    var playW = SJ.rightWallX - SJ.leftWallX;
    var playH = SJ.floorY - SJ.ceilY;

    SJ._perspBuildings.forEach(function (b) {
      var df    = b.depthFrac;
      var side  = b.side;

      // Screen position at this depth
      var bNearX = side === 'left' ? 0 : w;
      var bFarX  = vx;

      var screenX = lerp(bFarX, bNearX, df);
      var bw = lerp(0, playW * b.widthFrac, df);
      var screenW = bw;
      if (screenW < 1) return;

      // Building sits on the floor line at this depth
      var screenFloor = lerp(vy, SJ.floorY, df);
      var screenCeil  = lerp(vy, SJ.ceilY,  df);
      var bh = (screenFloor - screenCeil) * b.heightFrac;
      var screenTop = screenFloor - bh;

      var bx = side === 'left' ? screenX - screenW : screenX;

      // Clip to wall area only
      if (side === 'left'  && bx + screenW < 0)   return;
      if (side === 'right' && bx > w)              return;

      // Wall face gradient
      var wallAlpha = 0.7 + df * 0.3;
      ctx.save();
      ctx.globalAlpha = wallAlpha;

      var faceGrad = ctx.createLinearGradient(bx, screenTop, bx + screenW, screenTop);
      var litVal = b.lit;
      faceGrad.addColorStop(0,   'hsl(' + b.hue + ',' + b.sat + '%,' + (litVal - 6) + '%)');
      faceGrad.addColorStop(0.5, 'hsl(' + b.hue + ',' + (b.sat + 6) + '%,' + (litVal + 8) + '%)');
      faceGrad.addColorStop(1,   'hsl(' + b.hue + ',' + b.sat + '%,' + (litVal - 4) + '%)');
      ctx.fillStyle = faceGrad;
      ctx.fillRect(bx, screenTop, screenW, bh);

      // Glass-glint sweep (animated)
      if (b.style === 'glass' && screenW > 10) {
        var glintX = bx + (Math.sin(t * 0.28 + b.glintOffset) * 0.5 + 0.5) * screenW;
        var glintG = ctx.createLinearGradient(glintX - screenW * 0.25, 0, glintX + screenW * 0.08, 0);
        glintG.addColorStop(0, 'rgba(255,230,160,0)');
        glintG.addColorStop(0.5, 'rgba(255,240,190,' + (0.1 * df) + ')');
        glintG.addColorStop(1, 'rgba(255,220,140,0)');
        ctx.fillStyle = glintG;
        ctx.fillRect(bx, screenTop, screenW, bh);
      }

      // Lit windows
      if (screenW > 8 && bh > 12) {
        var winW = Math.max(2, screenW * 0.14);
        var winH = Math.max(2, bh * 0.07);
        var winPad = screenW * 0.12;
        var winsPerRow = Math.max(1, Math.floor((screenW - winPad * 2) / (winW * 1.8)));
        var winsRows   = Math.max(1, Math.floor((bh - winH) / (winH * 2.2)));
        for (var wry = 0; wry < winsRows; wry++) {
          for (var wrx = 0; wrx < winsPerRow; wrx++) {
            var wx = bx + winPad + wrx * screenW / winsPerRow;
            var wy = screenTop + winH * 1.5 + wry * bh / winsRows;
            var litC = (b.windowLit && (wrx + wry) % 3 !== 0)
              ? 'rgba(255,230,110,0.65)'
              : 'rgba(60,80,120,0.22)';
            ctx.fillStyle = litC;
            ctx.fillRect(wx, wy, winW, winH);
          }
        }
      }

      // Rooftop antenna
      if (b.hasAntenna && screenW > 6) {
        ctx.fillStyle = 'rgba(80,80,90,0.9)';
        ctx.fillRect(bx + screenW * 0.5 - 1, screenTop - bh * 0.12, 2, bh * 0.12);
        ctx.beginPath();
        ctx.arc(bx + screenW * 0.5, screenTop - bh * 0.12, 2, 0, Math.PI * 2);
        var blinkOn = Math.sin(t * 2.2 + b.glintOffset) > 0.5;
        ctx.fillStyle = blinkOn ? 'rgba(255,30,30,0.9)' : 'rgba(255,30,30,0.15)';
        ctx.fill();
      }

      // Sunset tint on top of buildings
      var sunTint = ctx.createLinearGradient(bx, screenTop, bx, screenTop + bh * 0.4);
      sunTint.addColorStop(0,   'rgba(255,160,50,' + (0.18 * df) + ')');
      sunTint.addColorStop(1,   'rgba(255,120,30,0)');
      ctx.fillStyle = sunTint;
      ctx.fillRect(bx, screenTop, screenW, bh * 0.4);

      ctx.restore();
    });

    // ── Birds as tiny V shapes scattered in sky ────────────────
    ctx.save();
    ctx.strokeStyle = '#1a2855';
    ctx.lineWidth   = 1;
    for (var bi = 0; bi < 12; bi++) {
      var birdT  = (t * 0.04 + bi * 0.137) % 1;
      var birdX  = lerp(vx + Math.cos(bi * 2.4) * 20, w * (0.1 + (bi * 0.075) % 0.8), birdT);
      var birdY  = lerp(vy - 10, SJ.ceilY + h * 0.1 * (bi % 3 + 1), birdT * 0.8);
      var birdSz = 4 + birdT * 8;
      ctx.save();
      ctx.globalAlpha = 0.4 * (1 - birdT);
      ctx.beginPath();
      ctx.moveTo(birdX - birdSz, birdY + birdSz * 0.25);
      ctx.lineTo(birdX,           birdY);
      ctx.lineTo(birdX + birdSz, birdY + birdSz * 0.25);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // ── Warm vignette around edges ─────────────────────────────
    var vig = ctx.createRadialGradient(vx, vy + h * 0.1, h * 0.1, vx, vy + h * 0.1, h * 0.72);
    vig.addColorStop(0,   'transparent');
    vig.addColorStop(0.7, 'transparent');
    vig.addColorStop(1,   'rgba(10,5,2,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  // ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  // ZONE 1 — NORTHERN LIGHTS  (ice canyon + aurora ahead)
  // ══════════════════════════════════════════════════════════════
  // ─────────────────────────────────────────────────────────────
  function renderNorthernLightsBg(ctx) {
    var w  = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    // ── Deep arctic sky ────────────────────────────────────────
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0,    '#010510');
    sky.addColorStop(0.3,  '#020b20');
    sky.addColorStop(0.55, '#061428');
    sky.addColorStop(0.75, '#0a1e30');
    sky.addColorStop(1,    '#0d2035');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // ── Stars behind aurora ────────────────────────────────────
    ctx.save();
    SJ._perspStars.forEach(function (s) {
      var screenX = vx + s.nx * w * 0.52;
      var screenY = vy + s.ny * h * 0.52;
      // Only draw in sky portion (above vanish line)
      if (screenY > vy + (SJ.floorY - vy) * 0.15) return;
      var tw = Math.sin(t * s.twinkleSpeed + s.twinkle);
      var alpha = 0.3 + tw * 0.25;
      var sz    = s.size * (0.85 + tw * 0.2);
      ctx.globalAlpha = Math.max(0, alpha) * 0.7;
      ctx.fillStyle = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      ctx.beginPath();
      ctx.arc(screenX, screenY, Math.max(0.15, sz), 0, Math.PI * 2);
      ctx.fill();
      if (s.bright) {
        ctx.globalAlpha = alpha * 0.25;
        ctx.beginPath();
        ctx.arc(screenX, screenY, sz * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();

    // ── Full moon ──────────────────────────────────────────────
    var moonX = vx + w * 0.28, moonY = vy - h * 0.16;
    var moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 110);
    moonGlow.addColorStop(0,   'rgba(220,235,255,0.22)');
    moonGlow.addColorStop(0.5, 'rgba(180,200,240,0.08)');
    moonGlow.addColorStop(1,   'rgba(140,170,220,0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(moonX - 110, moonY - 110, 220, 220);
    var moonDisk = ctx.createRadialGradient(moonX - 4, moonY - 4, 0, moonX, moonY, 28);
    moonDisk.addColorStop(0,   '#ffffff');
    moonDisk.addColorStop(0.5, '#dde8ff');
    moonDisk.addColorStop(1,   '#b0c8f0');
    ctx.fillStyle = moonDisk;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
    ctx.fill();

    // ── Aurora borealis ribbons ────────────────────────────────
    var auroraColors = [
      [0, 255, 136, 0.55],    // green
      [168, 85, 247, 0.42],   // purple
      [0, 188, 212, 0.48],    // cyan
      [100, 255, 180, 0.35],  // seafoam
      [200, 120, 255, 0.3],   // lavender
    ];

    ctx.save();
    auroraColors.forEach(function (col, ai) {
      var r = col[0], g = col[1], b = col[2], maxA = col[3];
      // Each ribbon is a sinuous band sweeping across the sky
      var ribbonPhase = ai * 1.3 + t * (0.08 + ai * 0.03);
      var ribbonY0    = vy - h * (0.12 + ai * 0.06) + Math.sin(ribbonPhase * 0.7) * h * 0.05;
      var ribbonH     = h * (0.04 + Math.sin(t * 0.11 + ai) * 0.02);

      ctx.globalAlpha = maxA * (0.7 + Math.sin(t * 0.15 + ai * 0.8) * 0.3);
      ctx.globalCompositeOperation = 'lighter';

      var numSeg = 12;
      for (var seg = 0; seg <= numSeg; seg++) {
        var frac = seg / numSeg;
        var ax   = frac * w;
        // How far the ribbon extends from VP at this horizontal position
        var distFromCenter = Math.abs(ax - vx) / (w * 0.5);
        var segRibbonY = ribbonY0 + Math.sin(frac * Math.PI * 3 + ribbonPhase) * h * 0.04;
        var segH = ribbonH * (0.6 + distFromCenter * 0.8) *
                   (0.8 + Math.sin(frac * Math.PI * 2 + t * 0.22 + ai) * 0.2);

        if (seg < numSeg) {
          var nx = (seg + 1) / numSeg * w;
          var nRibbonY = ribbonY0 + Math.sin((seg+1)/numSeg * Math.PI * 3 + ribbonPhase) * h * 0.04;
          var nDistFromCenter = Math.abs(nx - vx) / (w * 0.5);
          var nSegH = ribbonH * (0.6 + nDistFromCenter * 0.8) *
                     (0.8 + Math.sin((seg+1)/numSeg * Math.PI * 2 + t * 0.22 + ai) * 0.2);

          var auroraGrad = ctx.createLinearGradient(ax, segRibbonY, ax, segRibbonY + segH);
          auroraGrad.addColorStop(0,   'rgba(' + r + ',' + g + ',' + b + ',0)');
          auroraGrad.addColorStop(0.3, 'rgba(' + r + ',' + g + ',' + b + ',' + maxA + ')');
          auroraGrad.addColorStop(0.7, 'rgba(' + r + ',' + g + ',' + b + ',' + (maxA * 0.6) + ')');
          auroraGrad.addColorStop(1,   'rgba(' + r + ',' + g + ',' + b + ',0)');

          ctx.fillStyle = auroraGrad;
          ctx.beginPath();
          ctx.moveTo(ax, segRibbonY);
          ctx.lineTo(nx, nRibbonY);
          ctx.lineTo(nx, nRibbonY + nSegH);
          ctx.lineTo(ax, segRibbonY + segH);
          ctx.closePath();
          ctx.fill();
        }
      }
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // ── Ice canyon walls (both sides, perspective) ─────────────
    // The ice walls are the primary side elements converging to VP
    ctx.save();
    ['left', 'right'].forEach(function (side) {
      var numSegments = 18;
      for (var si = 0; si < numSegments; si++) {
        var df      = (si + 0.5) / numSegments;
        var dfNext  = (si + 1.5) / numSegments;

        // Current and next depth screen positions
        var nearX   = side === 'left' ? 0 : w;
        var wallX   = lerp(vx, nearX, df);
        var wallXn  = lerp(vx, nearX, dfNext);

        var wallT   = lerp(vy, SJ.ceilY,  df);
        var wallB   = lerp(vy, SJ.floorY, df);
        var wallTn  = lerp(vy, SJ.ceilY,  dfNext);
        var wallBn  = lerp(vy, SJ.floorY, dfNext);

        // Ice color — blue-white gradient
        var iceAlpha = 0.75 + df * 0.25;
        ctx.globalAlpha = iceAlpha;

        // Main ice face
        var iceGrad = side === 'left'
          ? ctx.createLinearGradient(0, 0, wallX, 0)
          : ctx.createLinearGradient(w, 0, wallX, 0);
        iceGrad.addColorStop(0,   'rgba(8,30,55,0.98)');
        iceGrad.addColorStop(0.5, 'rgba(20,60,95,0.92)');
        iceGrad.addColorStop(1,   'rgba(40,100,140,0.4)');
        ctx.fillStyle = iceGrad;

        ctx.beginPath();
        if (side === 'left') {
          ctx.moveTo(0,      wallT);  ctx.lineTo(wallX,  wallT);
          ctx.lineTo(wallXn, wallTn); ctx.lineTo(0,      wallTn);
        } else {
          ctx.moveTo(w,      wallT);  ctx.lineTo(wallX,  wallT);
          ctx.lineTo(wallXn, wallTn); ctx.lineTo(w,      wallTn);
        }
        ctx.closePath();
        ctx.fill();

        // Bottom wall segment (floor to ceiling)
        if (side === 'left') {
          ctx.beginPath();
          ctx.moveTo(0,      wallB);  ctx.lineTo(wallX,  wallB);
          ctx.lineTo(wallXn, wallBn); ctx.lineTo(0,      wallBn);
          ctx.closePath();
          ctx.fillStyle = iceGrad;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(w,      wallB);  ctx.lineTo(wallX,  wallB);
          ctx.lineTo(wallXn, wallBn); ctx.lineTo(w,      wallBn);
          ctx.closePath();
          ctx.fillStyle = iceGrad;
          ctx.fill();
        }

        // Ice crack highlights on inner face edge
        if (df > 0.3 && si % 3 === 0) {
          var crackX  = side === 'left' ? wallX : wallX;
          var crackAlpha = 0.2 + Math.random() * 0.2;
          ctx.globalAlpha = crackAlpha;
          ctx.strokeStyle = 'rgba(140,200,255,0.6)';
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          var crackY1 = wallT + (wallB - wallT) * 0.2;
          var crackY2 = wallT + (wallB - wallT) * 0.6;
          ctx.moveTo(crackX, crackY1);
          ctx.lineTo(crackX + (side === 'left' ? -8 : 8) * df, crackY2);
          ctx.stroke();
        }
      }
    });
    ctx.restore();

    // Inner wall glow (aurora reflecting off ice)
    var leftGlow = ctx.createLinearGradient(0, 0, w * 0.12, 0);
    leftGlow.addColorStop(0,   'rgba(0,200,100,0.18)');
    leftGlow.addColorStop(1,   'rgba(0,200,100,0)');
    ctx.fillStyle = leftGlow;
    ctx.fillRect(0, SJ.ceilY, w * 0.12, SJ.floorY - SJ.ceilY);

    var rightGlow = ctx.createLinearGradient(w, 0, w * 0.88, 0);
    rightGlow.addColorStop(0,   'rgba(168,85,247,0.18)');
    rightGlow.addColorStop(1,   'rgba(168,85,247,0)');
    ctx.fillStyle = rightGlow;
    ctx.fillRect(w * 0.88, SJ.ceilY, w * 0.12, SJ.floorY - SJ.ceilY);

    // ── Frozen tundra floor perspective ────────────────────────
    var snowGrad = ctx.createLinearGradient(0, vy, 0, SJ.floorY);
    snowGrad.addColorStop(0,   '#0d2235');
    snowGrad.addColorStop(0.5, '#1a3545');
    snowGrad.addColorStop(1,   '#20404e');
    ctx.fillStyle = snowGrad;
    ctx.fillRect(0, vy, w, SJ.floorY - vy);

    // Snow surface grid lines
    for (var sni = 1; sni <= 8; sni++) {
      var sfrac = sni / 8;
      var sgy   = lerp(vy, SJ.floorY, sfrac);
      var slx   = lerp(vx, 0, sfrac);
      var srx   = lerp(vx, w, sfrac);
      ctx.strokeStyle = 'rgba(100,160,200,' + (0.06 + sfrac * 0.1) + ')';
      ctx.lineWidth   = sfrac * 1.2;
      ctx.beginPath();
      ctx.moveTo(slx, sgy); ctx.lineTo(srx, sgy);
      ctx.stroke();
    }

    // ── Frost vignette ──────────────────────────────────────────
    var frostV = ctx.createRadialGradient(vx, vy, h * 0.08, vx, vy, h * 0.65);
    frostV.addColorStop(0,   'transparent');
    frostV.addColorStop(0.75,'transparent');
    frostV.addColorStop(1,   'rgba(5,15,30,0.5)');
    ctx.fillStyle = frostV;
    ctx.fillRect(0, 0, w, h);
  }

  // ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  // ZONE 2 — DEEP SPACE  (star warp + nebula + planets)
  // ══════════════════════════════════════════════════════════════
  // ─────────────────────────────────────────────────────────────
  function renderSpaceBg(ctx) {
    var w  = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    // ── Absolute black background ──────────────────────────────
    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, w, h);

    // ── Nebula — large painterly gas clouds at center ──────────
    var nebulas = [
      { cx: 0.50, cy: 0.42, rx: w * 0.55, ry: h * 0.38, h: 280, s: 60, a: 0.14, rot: 0.3 },
      { cx: 0.38, cy: 0.55, rx: w * 0.40, ry: h * 0.28, h: 200, s: 70, a: 0.10, rot: -0.2 },
      { cx: 0.62, cy: 0.32, rx: w * 0.35, ry: h * 0.22, h:  20, s: 80, a: 0.09, rot: 0.5 },
      { cx: 0.50, cy: 0.45, rx: w * 0.28, ry: h * 0.20, h: 240, s: 55, a: 0.18, rot: -0.1 },
    ];
    nebulas.forEach(function (neb) {
      ctx.save();
      var nx = neb.cx * w;
      var ny = neb.cy * h;
      var breathe = 1 + Math.sin(t * 0.08 + neb.rot * 2) * 0.03;
      ctx.translate(nx, ny);
      ctx.rotate(neb.rot + t * 0.004);
      ctx.scale(breathe, breathe);
      var ng = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(neb.rx, neb.ry));
      var cl = 'hsla(' + neb.h + ',' + neb.s + '%,50%,';
      ng.addColorStop(0,   cl + neb.a + ')');
      ng.addColorStop(0.45, cl + (neb.a * 0.6) + ')');
      ng.addColorStop(0.8,  cl + (neb.a * 0.15) + ')');
      ng.addColorStop(1,    cl + '0)');
      ctx.fillStyle = ng;
      ctx.scale(neb.rx / Math.max(neb.rx, neb.ry), neb.ry / Math.max(neb.rx, neb.ry));
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(neb.rx, neb.ry), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Milky Way band ─────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.12;
    var mwGrad = ctx.createLinearGradient(0, h * 0.1, w, h * 0.7);
    mwGrad.addColorStop(0,   'rgba(200,210,255,0)');
    mwGrad.addColorStop(0.3, 'rgba(200,210,255,0.25)');
    mwGrad.addColorStop(0.5, 'rgba(210,220,255,0.18)');
    mwGrad.addColorStop(0.7, 'rgba(200,210,255,0.12)');
    mwGrad.addColorStop(1,   'rgba(200,210,255,0)');
    ctx.fillStyle = mwGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    // ── Warp stars — streak from vanishing point outward ───────
    ctx.save();
    var speedFactor = Math.min(1, SJ.scrollSpeed / 220);
    SJ._warpStars.forEach(function (s) {
      // Advance star outward
      s.dist += s.speed * speedFactor;
      if (s.dist > 1.05) s.dist = 0.01 + Math.random() * 0.05;

      var sx = vx + Math.cos(s.angle) * s.dist * w * 0.58;
      var sy = vy + Math.sin(s.angle) * s.dist * h * 0.58;

      // Streak length proportional to speed and dist
      var streakLen = Math.max(0.5, s.dist * s.dist * speedFactor * 22);
      var ex = sx - Math.cos(s.angle) * streakLen;
      var ey = sy - Math.sin(s.angle) * streakLen;

      var alpha = Math.min(1, s.dist * 1.5) * (0.4 + s.dist * 0.6);
      var sz    = Math.max(0.3, s.size * s.dist);
      var colA  = 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + alpha + ')';
      var colB  = 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',0)';

      if (streakLen > 1.5) {
        var grad = ctx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, colA);
        grad.addColorStop(1, colB);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = sz;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else {
        ctx.fillStyle   = colA;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.2, sz * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();

    // ── Planets ────────────────────────────────────────────────
    // Large ringed planet (upper-right)
    ctx.save();
    var p1x = w * 0.78, p1y = h * 0.18, p1r = Math.min(w, h) * 0.058;
    // Planet body gradient
    var p1g = ctx.createRadialGradient(p1x - p1r * 0.3, p1y - p1r * 0.3, 0, p1x, p1y, p1r);
    p1g.addColorStop(0,   '#8ec4e8');
    p1g.addColorStop(0.4, '#4a8ac0');
    p1g.addColorStop(0.75,'#2a5a90');
    p1g.addColorStop(1,   '#142840');
    ctx.fillStyle = p1g;
    ctx.beginPath();
    ctx.arc(p1x, p1y, p1r, 0, Math.PI * 2);
    ctx.fill();
    // Cloud bands
    ctx.save();
    ctx.clip();
    for (var cb = 0; cb < 4; cb++) {
      var bandY = p1y - p1r * (0.6 - cb * 0.3);
      var bandH = p1r * 0.12;
      ctx.fillStyle = 'rgba(160,200,240,' + (0.12 + cb * 0.04) + ')';
      ctx.fillRect(p1x - p1r, bandY, p1r * 2, bandH);
    }
    ctx.restore();
    // Ring (ellipse around planet)
    ctx.save();
    ctx.translate(p1x, p1y);
    ctx.scale(1, 0.28);
    ctx.rotate(t * 0.015);
    var ringGrad = ctx.createRadialGradient(0, 0, p1r * 1.05, 0, 0, p1r * 2.0);
    ringGrad.addColorStop(0,   'rgba(150,180,220,0.55)');
    ringGrad.addColorStop(0.4, 'rgba(180,200,230,0.38)');
    ringGrad.addColorStop(0.7, 'rgba(140,170,210,0.18)');
    ringGrad.addColorStop(1,   'rgba(120,160,200,0)');
    ctx.strokeStyle = 'rgba(150,180,220,0.45)';
    for (var ri2 = 0; ri2 < 3; ri2++) {
      var rr = p1r * (1.2 + ri2 * 0.35);
      ctx.lineWidth = 4 - ri2;
      ctx.globalAlpha = 0.35 - ri2 * 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Smaller gas giant (lower-left)
    var p2x = w * 0.14, p2y = h * 0.65, p2r = Math.min(w, h) * 0.035;
    var p2g = ctx.createRadialGradient(p2x - p2r * 0.25, p2y - p2r * 0.25, 0, p2x, p2y, p2r);
    p2g.addColorStop(0,   '#e8c870');
    p2g.addColorStop(0.5, '#d08828');
    p2g.addColorStop(1,   '#703010');
    ctx.fillStyle = p2g;
    ctx.beginPath();
    ctx.arc(p2x, p2y, p2r, 0, Math.PI * 2);
    ctx.fill();
    // Moon orbiting p2
    var moonOrbit = p2r * 2.2;
    var moonAngle = t * 0.4;
    var moX = p2x + Math.cos(moonAngle) * moonOrbit;
    var moY = p2y + Math.sin(moonAngle) * moonOrbit * 0.38;
    ctx.fillStyle = '#c8c8d8';
    ctx.beginPath();
    ctx.arc(moX, moY, p2r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Tiny dwarf near vanish
    var p3x = vx + 40, p3y = vy - 30, p3r = 6;
    var p3g = ctx.createRadialGradient(p3x-2, p3y-2, 0, p3x, p3y, p3r);
    p3g.addColorStop(0, '#a0b8e0');
    p3g.addColorStop(1, '#304060');
    ctx.fillStyle = p3g;
    ctx.beginPath();
    ctx.arc(p3x, p3y, p3r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Lens flare on brightest stars ──────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.45;
    var flares = [
      { x: w*0.22, y: h*0.12 },
      { x: w*0.81, y: h*0.38 },
      { x: w*0.45, y: h*0.08 },
    ];
    flares.forEach(function (fl) {
      ctx.strokeStyle = 'rgba(200,220,255,0.6)';
      ctx.lineWidth   = 0.7;
      var flen = 18 + Math.sin(t * 0.8) * 4;
      ctx.beginPath(); ctx.moveTo(fl.x - flen, fl.y); ctx.lineTo(fl.x + flen, fl.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fl.x, fl.y - flen); ctx.lineTo(fl.x, fl.y + flen); ctx.stroke();
    });
    ctx.restore();

    // ── Galaxy-plane grid (ultra-faint) ────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#4466aa';
    ctx.lineWidth   = 0.8;
    for (var gi = 0; gi < 6; gi++) {
      var gf = (gi + 1) / 6;
      var gy = lerp(vy, SJ.floorY, gf);
      var gx = lerp(vy, SJ.ceilY,  gf);
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, gx); ctx.lineTo(w, gx); ctx.stroke();
    }
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  // ZONE 3 — FALLING CITY / NEON NIGHT  (Blade Runner corridor)
  // ══════════════════════════════════════════════════════════════
  // ─────────────────────────────────────────────────────────────
  function renderFallingCityBg(ctx) {
    var w  = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    // ── Near-black sky with purple haze ───────────────────────
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0,   '#04000c');
    sky.addColorStop(0.3, '#0a001e');
    sky.addColorStop(0.6, '#120030');
    sky.addColorStop(1,   '#08001a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // ── Lightning flash ────────────────────────────────────────
    SJ._lightningTimer -= SJ.dt || 16;
    if (SJ._lightningTimer <= 0) {
      SJ._lightningAlpha = 0.08 + Math.random() * 0.06;
      SJ._lightningTimer = 3500 + Math.random() * 8000;
    }
    if (SJ._lightningAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = SJ._lightningAlpha;
      ctx.fillStyle   = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      SJ._lightningAlpha = Math.max(0, SJ._lightningAlpha - 0.004);
      ctx.restore();
    }

    // ── Neon city corridor buildings ──────────────────────────
    SJ._neonBuildings.forEach(function (b) {
      var df   = b.depthFrac;
      var side = b.side;
      var nearX = side === 'left' ? 0 : w;

      var screenX     = lerp(vx, nearX, df);
      var screenW     = lerp(0, w * b.widthFrac, df);
      if (screenW < 1) return;
      var screenFloor = lerp(vy, SJ.floorY, df);
      var screenCeil  = lerp(vy, SJ.ceilY,  df);
      var bh          = (screenFloor - screenCeil) * b.heightFrac;
      var bx          = side === 'left' ? screenX - screenW : screenX;
      var by          = screenFloor - bh;

      // Dark building face
      ctx.save();
      ctx.globalAlpha = 0.88 + df * 0.12;
      var wallGrad = side === 'left'
        ? ctx.createLinearGradient(0, 0, bx + screenW, 0)
        : ctx.createLinearGradient(w, 0, bx, 0);
      wallGrad.addColorStop(0,   'rgba(4,1,12,0.98)');
      wallGrad.addColorStop(0.6, 'rgba(10,3,25,0.95)');
      wallGrad.addColorStop(1,   'rgba(20,5,40,0.5)');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(bx, by, screenW, bh);

      // Neon signs on building face
      for (var ns = 0; ns < b.numSigns; ns++) {
        var signY    = by + bh * (0.15 + ns * 0.28 + Math.random() * 0.05);
        var signH    = bh * 0.09 * df;
        var signW    = screenW * (0.55 + Math.random() * 0.3);
        var signX    = bx + screenW * 0.1;
        var flicker  = Math.sin(t * b.flickerSpeed + b.flickerPhase + ns * 2.1) > -0.7 ? 1 : 0.15;

        var hue1 = b.neonHue, hue2 = b.neonHue2;
        var neonCol = 'hsl(' + hue1 + ',100%,65%)';
        var neonCol2 = 'hsl(' + hue2 + ',100%,60%)';

        // Neon glow behind sign
        ctx.save();
        ctx.globalAlpha *= flicker * (0.5 + df * 0.5);
        ctx.shadowBlur   = 18 * df;
        ctx.shadowColor  = neonCol;
        ctx.fillStyle    = neonCol;
        ctx.fillRect(signX - 2, signY - 2, signW + 4, signH + 4);

        // Sign lines (stylized horizontal stripes)
        ctx.fillStyle = neonCol2;
        for (var sl = 0; sl < 3; sl++) {
          ctx.fillRect(signX + sl * signW / 4, signY, signW / 5, signH * 0.3);
        }

        // Neon glow cast down the building
        var castGrad = ctx.createLinearGradient(signX, signY + signH, signX, signY + bh * 0.3);
        castGrad.addColorStop(0,   'hsla(' + hue1 + ',100%,65%,' + (0.18 * df) + ')');
        castGrad.addColorStop(1,   'hsla(' + hue1 + ',100%,65%,0)');
        ctx.fillStyle = castGrad;
        ctx.fillRect(signX, signY + signH, signW, bh * 0.3);

        ctx.restore();
      }

      // Lit windows
      if (screenW > 8 && bh > 15) {
        var winStep = Math.max(3, screenW * 0.22);
        for (var wr = 0; wr < Math.floor(bh / (winStep * 1.6)); wr++) {
          for (var wc = 0; wc < Math.floor(screenW / winStep); wc++) {
            var wx2 = bx + wc * winStep + screenW * 0.06;
            var wy2 = by + wr * winStep * 1.6 + bh * 0.05;
            if (Math.sin(wr * 3.7 + wc * 5.2 + b.flickerPhase) > 0.1) {
              var winHue = (b.neonHue + wr * 30) % 360;
              ctx.fillStyle = 'hsla(' + winHue + ',80%,60%,0.35)';
              ctx.fillRect(wx2, wy2, Math.max(2, winStep * 0.38), Math.max(2, winStep * 0.55));
            }
          }
        }
      }

      ctx.restore();
    });

    // ── Perspective rain (streaks from VP outward) ─────────────
    ctx.save();
    var rainCount = 80;
    var rainSpeed = 0.08 + SJ.scrollSpeed / 1800;
    for (var ri = 0; ri < rainCount; ri++) {
      // Pseudo-random angles & distances using deterministic values
      var ra  = ((ri * 137.508) % 360) * Math.PI / 180;
      var rd  = ((ri * 97.32 + t * 45 * rainSpeed) % 100) / 100;
      var rx  = vx + Math.cos(ra) * rd * w * 0.55;
      var ry  = vy + Math.sin(ra) * rd * h * 0.55;
      var rex = vx + Math.cos(ra) * (rd - 0.045) * w * 0.55;
      var rey = vy + Math.sin(ra) * (rd - 0.045) * h * 0.55;

      var rainAlpha = Math.min(1, rd * 1.5) * 0.35;
      var rainLen   = rd * 14;

      ctx.globalAlpha = rainAlpha;
      ctx.strokeStyle = 'rgba(100,130,220,0.7)';
      ctx.lineWidth   = 0.5 + rd * 0.6;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rex, rey);
      ctx.stroke();
    }
    ctx.restore();

    // ── Wet floor reflections ──────────────────────────────────
    var wetGrad = ctx.createLinearGradient(0, vy, 0, SJ.floorY);
    wetGrad.addColorStop(0,   '#060015');
    wetGrad.addColorStop(0.5, '#0c0025');
    wetGrad.addColorStop(1,   '#080018');
    ctx.fillStyle = wetGrad;
    ctx.fillRect(0, vy, w, SJ.floorY - vy);

    // Neon reflections on wet floor
    SJ._neonBuildings.forEach(function (b) {
      if (b.depthFrac < 0.25) return;
      var df     = b.depthFrac;
      var side   = b.side;
      var nearX  = side === 'left' ? 0 : w;
      var screenX = lerp(vx, nearX, df);
      var reflW  = lerp(0, w * b.widthFrac, df) * 2;
      var reflX  = side === 'left' ? screenX - reflW * 0.5 : screenX - reflW * 0.5;

      ctx.save();
      var refHue = b.neonHue;
      var refGrad = ctx.createLinearGradient(0, vy, 0, SJ.floorY);
      refGrad.addColorStop(0,   'hsla(' + refHue + ',100%,55%,' + (0.12 * df) + ')');
      refGrad.addColorStop(0.5, 'hsla(' + refHue + ',100%,55%,' + (0.05 * df) + ')');
      refGrad.addColorStop(1,   'hsla(' + refHue + ',100%,55%,0)');
      ctx.fillStyle   = refGrad;
      ctx.shadowBlur  = 12;
      ctx.shadowColor = 'hsla(' + refHue + ',100%,55%,0.4)';
      ctx.fillRect(reflX, vy, reflW, SJ.floorY - vy);
      ctx.restore();
    });

    // Puddle ripples
    for (var pi = 0; pi < 5; pi++) {
      var prx = w * (0.15 + pi * 0.18);
      var pry = lerp(vy, SJ.floorY, 0.4 + pi * 0.12);
      var rphase = (t * 0.8 + pi * 1.4) % 1;
      var ripR = rphase * 30 * (0.6 + pi * 0.15);
      ctx.save();
      ctx.globalAlpha = (1 - rphase) * 0.18;
      ctx.strokeStyle = 'rgba(180,200,255,0.6)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.ellipse(prx, pry, ripR, ripR * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Neon edge glow ─────────────────────────────────────────
    var magEdge = ctx.createLinearGradient(0, 0, w * 0.06, 0);
    magEdge.addColorStop(0,   'rgba(255,0,255,0.22)');
    magEdge.addColorStop(1,   'rgba(255,0,255,0)');
    ctx.fillStyle = magEdge;
    ctx.fillRect(0, SJ.ceilY, w * 0.06, SJ.floorY - SJ.ceilY);

    var cyanEdge = ctx.createLinearGradient(w, 0, w * 0.94, 0);
    cyanEdge.addColorStop(0,   'rgba(0,255,255,0.22)');
    cyanEdge.addColorStop(1,   'rgba(0,255,255,0)');
    ctx.fillStyle = cyanEdge;
    ctx.fillRect(w * 0.94, SJ.ceilY, w * 0.06, SJ.floorY - SJ.ceilY);
  }

  // ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  // ZONE 4 — OCEAN / MOONLIT WATERS
  // ══════════════════════════════════════════════════════════════
  // ─────────────────────────────────────────────────────────────
  function renderOceanBg(ctx) {
    var w  = SJ.width, h = SJ.height;
    var vx = SJ.vanishX, vy = SJ.vanishY;
    var t  = SJ.elapsed / 1000;

    // ── Deep moonlit sky ───────────────────────────────────────
    var sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
    sky.addColorStop(0,    '#010810');
    sky.addColorStop(0.25, '#020d1c');
    sky.addColorStop(0.5,  '#041525');
    sky.addColorStop(0.75, '#061d30');
    sky.addColorStop(1,    '#082038');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.65);

    // ── Stars ──────────────────────────────────────────────────
    ctx.save();
    SJ._oceanStars.forEach(function (s) {
      var screenX = vx + s.nx * w * 0.5;
      var screenY = vy + s.ny * h * 0.5;
      if (screenY > vy + (SJ.floorY - vy) * 0.05) return;
      var tw    = Math.sin(t * s.twinkleSpeed + s.twinkle);
      var alpha = (0.25 + tw * 0.2) * 0.65;
      var sz    = s.size * (0.8 + tw * 0.18);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle   = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      ctx.beginPath();
      ctx.arc(screenX, screenY, Math.max(0.15, sz), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // ── Moon ───────────────────────────────────────────────────
    var moonX = vx, moonY = vy - h * 0.14;

    // 3 glow rings
    [0.55, 0.32, 0.16].forEach(function (alpha, gi) {
      var ringR = 65 + gi * 55;
      var mg = ctx.createRadialGradient(moonX, moonY, ringR * 0.6, moonX, moonY, ringR);
      mg.addColorStop(0,   'rgba(220,235,255,' + alpha * 0.18 + ')');
      mg.addColorStop(1,   'rgba(200,220,255,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(moonX - ringR, moonY - ringR, ringR * 2, ringR * 2);
    });

    // Moon disk
    var moonD = ctx.createRadialGradient(moonX - 6, moonY - 6, 0, moonX, moonY, 34);
    moonD.addColorStop(0,   '#fffef0');
    moonD.addColorStop(0.5, '#f0f4e8');
    moonD.addColorStop(0.85,'#d8e4cc');
    moonD.addColorStop(1,   '#b8cc88');
    ctx.fillStyle = moonD;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
    ctx.fill();

    // Moon craters (faint)
    ctx.save();
    ctx.globalAlpha = 0.12;
    [[moonX + 8, moonY + 5, 7], [moonX - 9, moonY - 8, 5], [moonX + 2, moonY + 14, 4]].forEach(function (cr) {
      ctx.strokeStyle = 'rgba(150,170,120,0.6)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(cr[0], cr[1], cr[2], 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();

    // ── Moonlight reflection column on water ───────────────────
    // Shimmering vertical trail from horizon down
    var horizY = vy + (SJ.floorY - vy) * 0.04;
    var refColW = 28 + Math.sin(t * 1.4) * 6;
    var refGrad = ctx.createLinearGradient(0, horizY, 0, SJ.floorY);
    refGrad.addColorStop(0,   'rgba(255,255,220,0.55)');
    refGrad.addColorStop(0.3, 'rgba(220,240,180,0.28)');
    refGrad.addColorStop(0.7, 'rgba(180,220,140,0.12)');
    refGrad.addColorStop(1,   'rgba(140,200,120,0.04)');
    ctx.save();
    ctx.fillStyle = refGrad;
    // Widen toward viewer
    ctx.beginPath();
    ctx.moveTo(vx - 4, horizY);
    ctx.lineTo(vx + 4, horizY);
    ctx.lineTo(vx + refColW * 2.5, SJ.floorY);
    ctx.lineTo(vx - refColW * 2.5, SJ.floorY);
    ctx.closePath();
    ctx.fill();

    // Shimmer overlay
    for (var shi = 0; shi < 8; shi++) {
      var shY    = lerp(horizY, SJ.floorY, shi / 8);
      var shW    = lerp(6, refColW * 2.8, shi / 8);
      var shAlpha = 0.08 * Math.abs(Math.sin(t * 2.5 + shi * 0.7));
      ctx.fillStyle = 'rgba(255,255,200,' + shAlpha + ')';
      ctx.fillRect(vx - shW * 0.5, shY, shW, (SJ.floorY - horizY) / 9);
    }
    ctx.restore();

    // ── Ocean surface with perspective waves ───────────────────
    var oceanGrad = ctx.createLinearGradient(0, vy, 0, SJ.floorY);
    oceanGrad.addColorStop(0,   '#031020');
    oceanGrad.addColorStop(0.3, '#041828');
    oceanGrad.addColorStop(0.7, '#062030');
    oceanGrad.addColorStop(1,   '#082535');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, vy, w, SJ.floorY - vy);

    // Wave lines (sorted far to near for proper layering)
    var sortedWaves = SJ._perspWaves.slice().sort(function (a, b) { return a.depthFrac - b.depthFrac; });

    sortedWaves.forEach(function (wave) {
      var df      = wave.depthFrac;
      var waveY0  = lerp(vy, SJ.floorY, df);
      var waveX0  = lerp(vx, 0,         df);
      var waveX1  = lerp(vx, w,         df);
      var waveWidth = waveX1 - waveX0;
      if (waveWidth < 1) return;

      var scrollOff = (SJ._layerOffsets[2] || 0) * 0.02;
      var phase     = wave.phase + t * wave.speed * 0.5 - scrollOff;
      var amp       = wave.amplitude * df;

      // Wave crest
      ctx.save();
      ctx.globalAlpha = wave.alpha * (0.5 + df * 0.5);
      var waveCol = ctx.createLinearGradient(waveX0, waveY0, waveX1, waveY0);
      waveCol.addColorStop(0,   'rgba(0,100,140,0.0)');
      waveCol.addColorStop(0.3, 'rgba(0,180,200,' + (wave.alpha * 0.8) + ')');
      waveCol.addColorStop(0.7, 'rgba(0,200,160,' + (wave.alpha * 0.6) + ')');
      waveCol.addColorStop(1,   'rgba(0,100,140,0.0)');
      ctx.strokeStyle = waveCol;
      ctx.lineWidth   = Math.max(0.4, df * 2.2);
      ctx.beginPath();
      var segs = Math.max(4, Math.floor(waveWidth / 8));
      for (var wsi = 0; wsi <= segs; wsi++) {
        var wx = waveX0 + (waveX1 - waveX0) * (wsi / segs);
        var wy = waveY0 + Math.sin(wsi * wave.freq * waveWidth / df + phase) * amp;
        if (wsi === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();

      // Foam crest (bright white highlight on top)
      if (wave.hasFoam && df > 0.25) {
        ctx.strokeStyle = 'rgba(200,240,255,' + (wave.foamAlpha * df) + ')';
        ctx.lineWidth   = Math.max(0.3, df * 0.8);
        ctx.beginPath();
        for (var wsi2 = 0; wsi2 <= segs; wsi2++) {
          var wx2 = waveX0 + (waveX1 - waveX0) * (wsi2 / segs);
          var wy2 = waveY0 + Math.sin(wsi2 * wave.freq * waveWidth / df + phase) * amp - df * 1.5;
          if (wsi2 === 0) ctx.moveTo(wx2, wy2);
          else ctx.lineTo(wx2, wy2);
        }
        ctx.stroke();
      }

      ctx.restore();
    });

    // ── Bioluminescent shimmer on waves ────────────────────────
    ctx.save();
    for (var bli = 0; bli < 12; bli++) {
      var blx  = vx + Math.cos(bli * 0.9 + t * 0.25) * w * (0.1 + (bli * 0.07) % 0.38);
      var bly  = lerp(vy, SJ.floorY, 0.3 + (bli * 0.058) % 0.55);
      var bls  = 2 + Math.abs(Math.sin(t * 1.2 + bli)) * 5;
      var blA  = 0.15 + Math.sin(t * 0.9 + bli * 1.4) * 0.12;
      ctx.globalAlpha = Math.max(0, blA);
      var blGrad = ctx.createRadialGradient(blx, bly, 0, blx, bly, bls * 3);
      blGrad.addColorStop(0,   'rgba(0,255,160,0.8)');
      blGrad.addColorStop(0.5, 'rgba(0,200,120,0.2)');
      blGrad.addColorStop(1,   'rgba(0,180,100,0)');
      ctx.fillStyle = blGrad;
      ctx.beginPath();
      ctx.arc(blx, bly, bls * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── Distant island silhouette ──────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle   = '#060e1a';
    var islX = vx + w * 0.18, islY = vy + (SJ.floorY - vy) * 0.04;
    ctx.beginPath();
    ctx.moveTo(islX - 30, islY);
    ctx.quadraticCurveTo(islX, islY - 18, islX + 30, islY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Horizon mist ───────────────────────────────────────────
    var mistGrad = ctx.createLinearGradient(0, vy - 30, 0, vy + 50);
    mistGrad.addColorStop(0,   'rgba(8,20,40,0)');
    mistGrad.addColorStop(0.5, 'rgba(10,22,42,0.38)');
    mistGrad.addColorStop(1,   'rgba(8,20,40,0)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, vy - 30, w, 80);

    // ── Underwater caustic glow near floor ─────────────────────
    var causticAlpha = 0.06 + Math.sin(t * 1.8) * 0.03;
    var causticGrad  = ctx.createLinearGradient(0, SJ.floorY - 60, 0, SJ.floorY);
    causticGrad.addColorStop(0,   'rgba(0,180,200,0)');
    causticGrad.addColorStop(1,   'rgba(0,200,180,' + causticAlpha + ')');
    ctx.fillStyle = causticGrad;
    ctx.fillRect(0, SJ.floorY - 60, w, 60);
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

    // Update parallax layer offsets
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
  // ZONE TRANSITION
  // ─────────────────────────────────────────────────────────────
  function startNextZone() {
    var nextIdx = (SJ.currentZoneIdx + 1) % 5;
    if (nextIdx === 0) SJ.cycleCount++;

    SJ.prevZoneIdx     = SJ.currentZoneIdx;
    SJ.currentZoneIdx  = nextIdx;
    SJ.transitioning   = true;
    SJ.transitionTimer = 0;
    SJ.transitionAlpha = 0;
    SJ.gameState       = 'transitioning';

    var newZone = SJ.zones[nextIdx];
    SJ.beatInterval = 60000 / newZone.bpm;

    if (SJ.triggerScreenShake)       SJ.triggerScreenShake(6, 200);
    SJ.titleCardText   = newZone.name;
    SJ.titleCardTimer  = 2500;
    SJ.nowPlayingText  = newZone.displayTitle;
    SJ.nowPlayingTimer = 6000;

    if (SJ.crossfadeTo)               SJ.crossfadeTo(nextIdx);
    if (SJ.playSound)                 SJ.playSound('zone_transition');
    if (SJ.spawnZoneTransitionBurst)  SJ.spawnZoneTransitionBurst();

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
        SJ.transitioning   = false;
        SJ.prevZoneIdx     = -1;
        SJ.transitionAlpha = 1;
        SJ.gameState       = 'playing';
        SJ.zoneTimer       = 0;
        SJ.patternChunkIdx = 0;
        SJ.timeSinceLastChunk = 0;
        if (SJ.clearObstacles)    SJ.clearObstacles();
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
