/**
 * Spike Jumper — particles.js
 * Agent 2 of 3: Pool-based particle system, ambient zone particles,
 * near-miss effects, death confetti, zone transition bursts, and beat pulse.
 *
 * Extends window.SJ (initialized by engine.js).
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // PARTICLE POOL — 150 pre-allocated particle objects
  // ─────────────────────────────────────────────────────────────
  var POOL_SIZE = 150;
  var _pool = [];

  for (var _i = 0; _i < POOL_SIZE; _i++) {
    _pool.push({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 60,
      size: 4,
      endSize: 0,
      color: '#ffffff',
      alpha: 1,
      type: 'circle',   // 'circle' | 'rect' | 'paper' | 'line'
      rotation: 0,
      rotSpeed: 0,
      gravity: 0,
      w: 6,
      h: 6,
      _poolIdx: _i,      // used for age-based reuse
      _spawnTime: 0,
    });
  }

  SJ.particlePool = _pool;
  SJ.particles = [];

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  // Returns an inactive pool slot; if all active, reuse oldest particle.
  function getParticle() {
    var oldest = null;
    var oldestTime = Infinity;

    for (var i = 0; i < POOL_SIZE; i++) {
      var p = _pool[i];
      if (!p.active) return p;
      if (p._spawnTime < oldestTime) {
        oldestTime = p._spawnTime;
        oldest = p;
      }
    }

    // Reuse oldest — remove from active list first
    oldest.active = false;
    var idx = SJ.particles.indexOf(oldest);
    if (idx !== -1) SJ.particles.splice(idx, 1);
    return oldest;
  }

  // Internal frame counter used as spawn timestamp
  var _frameCount = 0;

  // ─────────────────────────────────────────────────────────────
  // SJ.spawnParticle(config)
  // config keys match particle object fields.
  // ─────────────────────────────────────────────────────────────
  SJ.spawnParticle = function (config) {
    var p = getParticle();

    // Reset defaults
    p.active   = true;
    p.x        = config.x        !== undefined ? config.x        : 0;
    p.y        = config.y        !== undefined ? config.y        : 0;
    p.vx       = config.vx       !== undefined ? config.vx       : 0;
    p.vy       = config.vy       !== undefined ? config.vy       : 0;
    p.life     = 0;
    p.maxLife  = config.maxLife  !== undefined ? config.maxLife  : 60;
    p.size     = config.size     !== undefined ? config.size     : 4;
    p.endSize  = config.endSize  !== undefined ? config.endSize  : 0;
    p.color    = config.color    !== undefined ? config.color    : '#ffffff';
    p.alpha    = config.alpha    !== undefined ? config.alpha    : 1;
    p.type     = config.type     !== undefined ? config.type     : 'circle';
    p.rotation = config.rotation !== undefined ? config.rotation : 0;
    p.rotSpeed = config.rotSpeed !== undefined ? config.rotSpeed : 0;
    p.gravity  = config.gravity  !== undefined ? config.gravity  : 0;
    p.w        = config.w        !== undefined ? config.w        : p.size * 1.5;
    p.h        = config.h        !== undefined ? config.h        : p.size;
    p._spawnTime = _frameCount;

    // Add to active list if not already there
    if (SJ.particles.indexOf(p) === -1) {
      SJ.particles.push(p);
    }

    return p;
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.updateParticles(dt)
  // ─────────────────────────────────────────────────────────────
  SJ.updateParticles = function (dt) {
    _frameCount++;
    var timeFactor = dt / 16.67;   // normalize to 60fps unit

    var i = SJ.particles.length - 1;
    while (i >= 0) {
      var p = SJ.particles[i];

      if (!p.active) {
        SJ.particles.splice(i, 1);
        i--;
        continue;
      }

      // Advance life
      p.life++;

      if (p.life >= p.maxLife) {
        p.active = false;
        SJ.particles.splice(i, 1);
        i--;
        continue;
      }

      // Position
      p.x += p.vx * timeFactor;
      p.y += p.vy * timeFactor;

      // Gravity
      p.vy += p.gravity * timeFactor;

      // Friction
      p.vx *= 0.98;

      // Rotation
      p.rotation += p.rotSpeed * timeFactor;

      i--;
    }

    // Spawn ambient particles when playing
    if (SJ.gameState === 'playing') {
      spawnAmbientParticles();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.renderParticles()
  // ─────────────────────────────────────────────────────────────
  SJ.renderParticles = function () {
    var ctx = SJ.ctx;

    for (var i = 0; i < SJ.particles.length; i++) {
      var p = SJ.particles[i];
      if (!p.active) continue;

      var progress = p.life / p.maxLife;               // 0 → 1
      var curSize  = p.size + (p.endSize - p.size) * progress;
      var curAlpha = p.alpha * (1 - progress);

      if (curAlpha <= 0 || curSize <= 0) continue;

      ctx.save();
      ctx.globalAlpha = curAlpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      switch (p.type) {

        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(0.1, curSize), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          break;

        case 'rect':
          var rw = p.w * (1 - progress * 0.5);
          var rh = p.h * (1 - progress * 0.5);
          ctx.fillStyle = p.color;
          ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
          break;

        case 'paper':
          // Paper scrap: white/off-white rectangle with fold line and border
          var pw = p.w * (1 - progress * 0.3);
          var ph = p.h * (1 - progress * 0.3);
          ctx.fillStyle = p.color;
          ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
          // Fold crease down the middle
          ctx.beginPath();
          ctx.moveTo(0, -ph / 2);
          ctx.lineTo(0, ph / 2);
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 0.7;
          ctx.stroke();
          // Border
          ctx.strokeStyle = 'rgba(180,180,180,0.5)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
          break;

        case 'line':
          ctx.beginPath();
          ctx.moveTo(-p.w / 2, 0);
          ctx.lineTo(p.w / 2, p.h);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(0.3, curSize * 0.5);
          ctx.lineCap = 'round';
          ctx.stroke();
          break;
      }

      ctx.restore();
    }

    // Beat pulse overlay
    SJ.renderBeatPulse();
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.spawnNearMissEffect(x, y)
  // 6–10 gold/white sparks radiating outward
  // ─────────────────────────────────────────────────────────────
  SJ.spawnNearMissEffect = function (x, y) {
    var count = 6 + Math.floor(Math.random() * 5);
    var sparkColors = ['#FFD700', '#FFFFFF', '#FFF0A0', '#FFB300', '#FFFFAA'];

    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      var speed = 2.5 + Math.random() * 3.5;
      SJ.spawnParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        maxLife: 20 + Math.floor(Math.random() * 18),
        size: 2 + Math.random() * 3,
        endSize: 0,
        color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
        alpha: 0.9 + Math.random() * 0.1,
        type: 'circle',
        gravity: 0.05,
        rotSpeed: 0,
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.spawnDeathConfetti(x, y)
  // 30 paper-type particles bursting outward
  // ─────────────────────────────────────────────────────────────
  SJ.spawnDeathConfetti = function (x, y) {
    var paperColors = [
      '#ffffff', '#f5f5f5', '#ece9e1', '#f0ede5',
      '#e8e4dc', '#ddd9d0', '#f8f6f2', '#e2dfd8',
    ];

    for (var i = 0; i < 30; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1.5 + Math.random() * 5;
      var w = 6 + Math.random() * 12;
      var h = 4 + Math.random() * 8;
      SJ.spawnParticle({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        maxLife: 50 + Math.floor(Math.random() * 40),
        size: Math.max(w, h) / 2,
        endSize: 0,
        color: paperColors[Math.floor(Math.random() * paperColors.length)],
        alpha: 0.92,
        type: 'paper',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        gravity: 0.12 + Math.random() * 0.08,
        w: w,
        h: h,
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.spawnZoneTransitionBurst()
  // 20 particles from screen center using current zone accent colors
  // ─────────────────────────────────────────────────────────────
  SJ.spawnZoneTransitionBurst = function () {
    var zone = SJ.zones ? SJ.zones[SJ.currentZoneIdx] : null;
    var colors = zone ? zone.accentColors : ['#ffffff', '#ffaa00', '#00ffff', '#ff88ff'];
    var cx = SJ.width / 2;
    var cy = SJ.height / 2;

    for (var i = 0; i < 20; i++) {
      var angle = (Math.PI * 2 / 20) * i + Math.random() * 0.3;
      var speed = 3 + Math.random() * 6;
      var color = colors[Math.floor(Math.random() * colors.length)];
      var isRect = Math.random() < 0.4;
      SJ.spawnParticle({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        maxLife: 35 + Math.floor(Math.random() * 30),
        size: 3 + Math.random() * 5,
        endSize: 0,
        color: color,
        alpha: 0.85 + Math.random() * 0.15,
        type: isRect ? 'rect' : 'circle',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        gravity: 0,
        w: 4 + Math.random() * 8,
        h: 3 + Math.random() * 5,
      });
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.renderBeatPulse()
  // Draws a subtle glowing screen-edge rect when beatProgress < 0.3
  // SJ.beatProgress is 0 on beat, rising to 1 before next beat (set by audio.js)
  // ─────────────────────────────────────────────────────────────
  SJ.renderBeatPulse = function () {
    var bp = SJ.beatProgress;
    if (bp === undefined || bp >= 0.3) return;

    var zone = SJ.zones ? SJ.zones[SJ.currentZoneIdx] : null;
    if (!zone) return;

    var pulseAlpha = (0.3 - bp) / 0.3 * 0.07;
    if (pulseAlpha <= 0) return;

    var ctx = SJ.ctx;
    var w = SJ.width;
    var h = SJ.height;
    var color = zone.accentColors[0];
    var border = 8;

    ctx.save();
    ctx.globalAlpha = pulseAlpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = border;
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.strokeRect(border / 2, border / 2, w - border, h - border);
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  // ─────────────────────────────────────────────────────────────
  // AMBIENT PARTICLE SPAWNER — called each update frame
  // Rate-limited using random chance per frame so it works at any framerate
  // ─────────────────────────────────────────────────────────────

  // Per-zone ambient spawn rates (probability per frame, 60fps baseline)
  var _ambientTimers = { rain: 0, snow: 0, dust: 0, debris: 0, bio: 0, spray: 0, neonSpark: 0 };

  function spawnAmbientParticles() {
    var zoneIdx = SJ.currentZoneIdx;
    var w = SJ.width;
    var h = SJ.height;

    // Use a small per-frame probability approach for consistent rate across framerates
    switch (zoneIdx) {

      // ── Zone 0: City — dust motes ──
      case 0:
        if (Math.random() < 0.08) {
          SJ.spawnParticle({
            x: Math.random() * w,
            y: -5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: 0.4 + Math.random() * 0.6,
            maxLife: 80 + Math.floor(Math.random() * 60),
            size: 0.8 + Math.random() * 1.6,
            endSize: 0,
            color: 'rgba(220, 210, 190, 0.6)',
            alpha: 0.4 + Math.random() * 0.3,
            type: 'circle',
            gravity: 0.005,
            rotSpeed: 0,
          });
        }
        break;

      // ── Zone 1: Northern Lights — snowflakes ──
      case 1:
        if (Math.random() < 0.15) {
          SJ.spawnParticle({
            x: Math.random() * (w + 100) - 50,
            y: -10,
            vx: (Math.random() - 0.5) * 0.6 - 0.3,
            vy: 0.6 + Math.random() * 1.0,
            maxLife: 100 + Math.floor(Math.random() * 80),
            size: 1 + Math.random() * 2.5,
            endSize: 0,
            color: 'rgba(200, 230, 255, 0.85)',
            alpha: 0.5 + Math.random() * 0.4,
            type: 'circle',
            gravity: 0.008,
            rotSpeed: (Math.random() - 0.5) * 0.03,
          });
        }
        break;

      // ── Zone 2: Space — rare debris motes ──
      case 2:
        if (Math.random() < 0.018) {
          var debrisAngle = Math.random() * Math.PI * 2;
          SJ.spawnParticle({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: Math.cos(debrisAngle) * (0.2 + Math.random() * 0.5),
            vy: Math.sin(debrisAngle) * (0.2 + Math.random() * 0.5),
            maxLife: 120 + Math.floor(Math.random() * 100),
            size: 0.5 + Math.random() * 1.2,
            endSize: 0,
            color: 'rgba(180, 180, 220, 0.7)',
            alpha: 0.3 + Math.random() * 0.4,
            type: 'circle',
            gravity: 0,
            rotSpeed: 0,
          });
        }
        break;

      // ── Zone 3: Falling City — rain + neon sparks ──
      case 3:
        // Frequent rain lines
        if (Math.random() < 0.65) {
          SJ.spawnParticle({
            x: Math.random() * (w + 60) - 30,
            y: -15,
            vx: -1.2 + (Math.random() - 0.5) * 0.4,
            vy: 14 + Math.random() * 8,
            maxLife: 15 + Math.floor(Math.random() * 8),
            size: 0.5 + Math.random() * 0.5,
            endSize: 0,
            color: 'rgba(140, 160, 255, 0.4)',
            alpha: 0.35 + Math.random() * 0.25,
            type: 'line',
            w: 10 + Math.random() * 8,
            h: 3,
            gravity: 0.02,
            rotSpeed: 0,
            rotation: 0.12,
          });
        }
        // Occasional neon sparks from screen edges
        if (Math.random() < 0.04) {
          var zone3 = SJ.zones[3];
          var sparkColor = zone3.accentColors[Math.floor(Math.random() * zone3.accentColors.length)];
          var fromLeft = Math.random() < 0.5;
          SJ.spawnParticle({
            x: fromLeft ? w * 0.07 : w * 0.93,
            y: Math.random() * h,
            vx: (fromLeft ? 1 : -1) * (1 + Math.random() * 3),
            vy: (Math.random() - 0.5) * 2,
            maxLife: 18 + Math.floor(Math.random() * 14),
            size: 1.5 + Math.random() * 2,
            endSize: 0,
            color: sparkColor,
            alpha: 0.8 + Math.random() * 0.2,
            type: 'circle',
            gravity: 0.04,
            rotSpeed: 0,
          });
        }
        break;

      // ── Zone 4: Ocean — sea spray + bioluminescent specks ──
      case 4:
        var oceanY = h * 0.52;
        // Sea spray near ocean surface
        if (Math.random() < 0.12) {
          SJ.spawnParticle({
            x: Math.random() * w,
            y: oceanY + Math.random() * 30,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -(0.5 + Math.random() * 2.0),
            maxLife: 25 + Math.floor(Math.random() * 25),
            size: 1 + Math.random() * 2,
            endSize: 0,
            color: 'rgba(180, 230, 255, 0.7)',
            alpha: 0.4 + Math.random() * 0.35,
            type: 'circle',
            gravity: 0.06,
            rotSpeed: 0,
          });
        }
        // Bioluminescent specks rising near ocean surface
        if (Math.random() < 0.06) {
          SJ.spawnParticle({
            x: Math.random() * w,
            y: oceanY + 10 + Math.random() * (h - oceanY - 10),
            vx: (Math.random() - 0.5) * 0.4,
            vy: -(0.3 + Math.random() * 0.8),
            maxLife: 60 + Math.floor(Math.random() * 50),
            size: 1.2 + Math.random() * 2.5,
            endSize: 0,
            color: 'rgba(0, 255, 160, 0.85)',
            alpha: 0.45 + Math.random() * 0.4,
            type: 'circle',
            gravity: -0.005,   // slight upward drift
            rotSpeed: 0,
          });
        }
        break;
    }
  }

})();
