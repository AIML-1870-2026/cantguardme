/**
 * Spike Jumper — obstacles.js (2D Redesign)
 * Side-scrolling gate/spike obstacles that approach from the right.
 * Tap timing is the core mechanic — obstacles have clear gaps to navigate.
 *
 * Obstacle types:
 *   gate          — top bar + bottom bar with a vertical gap (main type)
 *   floor_spike   — single tall bar rising from the floor
 *   ceiling_spike — single bar hanging from ceiling
 *   double_narrow — tighter gate for later zones
 *
 * Extends window.SJ (initialized by engine.js).
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // POOL SETUP
  // ─────────────────────────────────────────────────────────────

  SJ.initObstacles = function () {
    SJ.obstaclePool = [];
    SJ.obstacles    = [];
    for (var i = 0; i < 30; i++) {
      SJ.obstaclePool.push({
        active: false,
        x: 0, gapCenterY: 0, gapHalf: 110,
        w: 70, type: 'gate', zoneIdx: 0, color: '#888',
        // For single-bar variants
        y: 0, h: 0,
      });
    }
    SJ._spawnTimer    = -1200; // negative → delay first obstacle
    SJ._spawnInterval = 2200;  // ms between spawns
    // Keep these stubs so the old pattern-chunk calls from engine don't crash
    SJ._obstacleQueue    = [];
    SJ._lastSpawnTime    = 0;
    SJ._beatsSinceChunkStart = 0;
  };

  SJ.clearObstacles = function () {
    for (var i = 0; i < SJ.obstaclePool.length; i++) {
      SJ.obstaclePool[i].active = false;
    }
    SJ.obstacles = [];
    SJ._spawnTimer = -1200;
    SJ._obstacleQueue = [];
  };

  // No-op stub kept for engine.js compatibility
  SJ.startPatternChunk = function () {};

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  function rand(min, max) { return min + Math.random() * (max - min); }

  function getFree() {
    for (var i = 0; i < SJ.obstaclePool.length; i++) {
      if (!SJ.obstaclePool[i].active) return SJ.obstaclePool[i];
    }
    return null;
  }

  function spawnGate(gapCenterY, gapHalf, w) {
    var o = getFree(); if (!o) return;
    o.active      = true;
    o.type        = 'gate';
    o.x           = SJ.width + 60;
    o.gapCenterY  = gapCenterY;
    o.gapHalf     = gapHalf;
    o.w           = w || 68;
    o.zoneIdx     = SJ.currentZoneIdx;
    if (SJ.obstacles.indexOf(o) === -1) SJ.obstacles.push(o);
  }

  function spawnFloorSpike(h, w) {
    var o = getFree(); if (!o) return;
    o.active  = true;
    o.type    = 'floor_spike';
    o.x       = SJ.width + 60;
    o.y       = SJ.floorY - h;
    o.h       = h;
    o.w       = w || 65;
    o.zoneIdx = SJ.currentZoneIdx;
    if (SJ.obstacles.indexOf(o) === -1) SJ.obstacles.push(o);
  }

  function spawnCeilingSpike(h, w) {
    var o = getFree(); if (!o) return;
    o.active  = true;
    o.type    = 'ceiling_spike';
    o.x       = SJ.width + 60;
    o.y       = SJ.ceilY;
    o.h       = h;
    o.w       = w || 65;
    o.zoneIdx = SJ.currentZoneIdx;
    if (SJ.obstacles.indexOf(o) === -1) SJ.obstacles.push(o);
  }

  // ─────────────────────────────────────────────────────────────
  // SPAWN LOGIC — pick pattern based on zone & distance
  // ─────────────────────────────────────────────────────────────

  function spawnNext() {
    var playH     = SJ.floorY - SJ.ceilY; // usable height
    var gapHalf   = Math.max(75, 120 - SJ.cycleCount * 8 - SJ.currentZoneIdx * 4);
    var minCenter = SJ.ceilY  + gapHalf + 30;
    var maxCenter = SJ.floorY - gapHalf - 30;
    var center    = rand(minCenter, maxCenter);

    // Roll for obstacle variety
    var roll = Math.random();

    // Higher zones / cycles → trickier patterns
    var difficulty = SJ.currentZoneIdx + SJ.cycleCount * 2;

    if (difficulty < 2) {
      // Early game: mostly gates, large gap
      spawnGate(center, gapHalf + 20);

    } else if (roll < 0.55) {
      // Standard gate
      spawnGate(center, gapHalf);

    } else if (roll < 0.72) {
      // Floor spike only — jump over it
      var spikeH = rand(playH * 0.28, playH * 0.44);
      spawnFloorSpike(spikeH, 60);

    } else if (roll < 0.86) {
      // Ceiling spike only — duck under it
      var spikeH2 = rand(playH * 0.28, playH * 0.44);
      spawnCeilingSpike(spikeH2, 60);

    } else {
      // Double: floor + ceiling with gap in middle
      var narrowHalf = gapHalf - 10;
      var midCenter  = (SJ.ceilY + SJ.floorY) / 2;
      spawnGate(midCenter + rand(-20, 20), narrowHalf, 72);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SJ.updateObstacles(dt)
  // ─────────────────────────────────────────────────────────────

  SJ.updateObstacles = function (dt) {
    var speed = SJ.scrollSpeed || 220; // px/s

    // Update spawn timer
    SJ._spawnTimer += dt;
    // Recalculate spawn interval (faster at higher speeds)
    SJ._spawnInterval = Math.max(1100, 2200 - (speed - 220) * 2.2);

    if (SJ._spawnTimer >= SJ._spawnInterval) {
      SJ._spawnTimer -= SJ._spawnInterval;
      spawnNext();
    }

    // Move obstacles leftward
    var dtSec = dt / 1000;
    for (var i = SJ.obstacles.length - 1; i >= 0; i--) {
      var o = SJ.obstacles[i];
      if (!o.active) { SJ.obstacles.splice(i, 1); continue; }

      o.x -= speed * dtSec;

      // Deactivate when fully off-screen left
      if (o.x + o.w < -20) {
        o.active = false;
        SJ.obstacles.splice(i, 1);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.renderObstacles
  // ─────────────────────────────────────────────────────────────

  SJ.renderObstacles = function () {
    var ctx  = SJ.ctx;
    var zone = SJ.zones[SJ.currentZoneIdx] || {};

    for (var i = 0; i < SJ.obstacles.length; i++) {
      var o = SJ.obstacles[i];
      if (!o.active) continue;

      // Fade in when coming from the right edge
      var fadeAlpha = Math.min(1, (SJ.width + 60 - o.x) / 120);
      if (fadeAlpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = fadeAlpha;

      if (o.type === 'gate') {
        drawGate(ctx, o, zone);
      } else if (o.type === 'floor_spike') {
        drawFloorSpike(ctx, o, zone);
      } else if (o.type === 'ceiling_spike') {
        drawCeilingSpike(ctx, o, zone);
      }

      ctx.restore();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDERERS
  // ─────────────────────────────────────────────────────────────

  function getZoneColors(zone) {
    var accent  = (zone.accentColors && zone.accentColors[0]) || '#cc2200';
    var accent2 = (zone.accentColors && zone.accentColors[1]) || '#992200';
    var fill    = (zone.accentColors && zone.accentColors[2]) || '#441100';
    return { accent: accent, accent2: accent2, fill: fill };
  }

  function drawGate(ctx, o, zone) {
    var c       = getZoneColors(zone);
    var topH    = o.gapCenterY - o.gapHalf;            // top block height
    var botY    = o.gapCenterY + o.gapHalf;             // bottom block top
    var botH    = SJ.floorY - botY;                     // bottom block height
    var x       = o.x;
    var w       = o.w;

    // Top block
    if (topH > 0) {
      drawBlock(ctx, x, SJ.ceilY, w, topH - SJ.ceilY, c);
      // Spike tip on bottom edge of top block
      drawSpikeTip(ctx, x, topH, w, false, c.accent);
    }

    // Bottom block
    if (botH > 0) {
      drawBlock(ctx, x, botY, w, botH, c);
      // Spike tip on top edge of bottom block
      drawSpikeTip(ctx, x, botY, w, true, c.accent);
    }

    // Gap indicator — glowing line on each face
    ctx.strokeStyle = c.accent;
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = c.accent;
    if (topH > 0) {
      ctx.beginPath();
      ctx.moveTo(x, topH - 1);
      ctx.lineTo(x + w, topH - 1);
      ctx.stroke();
    }
    if (botH > 0) {
      ctx.beginPath();
      ctx.moveTo(x, botY + 1);
      ctx.lineTo(x + w, botY + 1);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  function drawFloorSpike(ctx, o, zone) {
    var c = getZoneColors(zone);
    drawBlock(ctx, o.x, o.y, o.w, o.h, c);
    drawSpikeTip(ctx, o.x, o.y, o.w, true, c.accent);

    ctx.strokeStyle = c.accent;
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = c.accent;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + 1);
    ctx.lineTo(o.x + o.w, o.y + 1);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawCeilingSpike(ctx, o, zone) {
    var c   = getZoneColors(zone);
    var bot = o.y + o.h;
    drawBlock(ctx, o.x, o.y, o.w, o.h, c);
    drawSpikeTip(ctx, o.x, bot, o.w, false, c.accent);

    ctx.strokeStyle = c.accent;
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 8;
    ctx.shadowColor = c.accent;
    ctx.beginPath();
    ctx.moveTo(o.x, bot - 1);
    ctx.lineTo(o.x + o.w, bot - 1);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Solid colored block with subtle gradient
  function drawBlock(ctx, x, y, w, h, c) {
    if (h <= 0 || w <= 0) return;
    var grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0,   c.fill);
    grad.addColorStop(0.4, c.accent2);
    grad.addColorStop(1,   c.fill);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Dark edge lines
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  // Spike triangle drawn on a face edge
  // pointsUp=true  → spike points upward  (top of bottom block)
  // pointsUp=false → spike points downward (bottom of top block)
  function drawSpikeTip(ctx, x, edgeY, w, pointsUp, color) {
    var tipH = 16;
    var tipY = pointsUp ? edgeY - tipH : edgeY + tipH;

    ctx.fillStyle   = color;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(x,         edgeY);
    ctx.lineTo(x + w / 2, tipY);
    ctx.lineTo(x + w,     edgeY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ─────────────────────────────────────────────────────────────
  // SJ.checkCollisions — 2D AABB player rect vs obstacle rects
  // ─────────────────────────────────────────────────────────────

  SJ.checkCollisions = function () {
    if (!SJ.player.alive) return;

    // Player hitbox — slightly smaller than visual for fairness
    var pw   = 38;
    var ph   = 14;
    var pl   = SJ.player.x - pw / 2;
    var pr   = SJ.player.x + pw / 2;
    var pt   = SJ.player.y - ph / 2;
    var pb   = SJ.player.y + ph / 2;

    for (var i = 0; i < SJ.obstacles.length; i++) {
      var o = SJ.obstacles[i];
      if (!o.active) continue;

      var ol = o.x;
      var or2 = o.x + o.w;

      // No horizontal overlap → skip
      if (pr < ol || pl > or2) continue;

      if (o.type === 'gate') {
        var topH = o.gapCenterY - o.gapHalf;
        var botY = o.gapCenterY + o.gapHalf;

        // Hit top block
        if (pt < topH && pr > ol && pl < or2) {
          SJ.triggerDeath(); return;
        }
        // Hit bottom block
        if (pb > botY && pr > ol && pl < or2) {
          SJ.triggerDeath(); return;
        }

        // Near-miss scoring (passed through the gap cleanly)
        if (Math.abs(o.x + o.w / 2 - SJ.player.x) < 10) {
          if (SJ.checkNearMiss) SJ.checkNearMiss(o, 0);
        }

      } else if (o.type === 'floor_spike') {
        if (pb > o.y && pr > ol && pl < or2) {
          SJ.triggerDeath(); return;
        }
      } else if (o.type === 'ceiling_spike') {
        if (pt < o.y + o.h && pr > ol && pl < or2) {
          SJ.triggerDeath(); return;
        }
      }
    }
  };

})();
