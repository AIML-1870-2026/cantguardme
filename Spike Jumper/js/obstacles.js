/**
 * Spike Jumper — obstacles.js (3rd-Person Z-Depth, Redesigned)
 *
 * Obstacle types:
 *   v_gate  — top + bottom wall panels, vertical gap (Flappy Bird axis)
 *   h_gate  — left + right wall panels, horizontal gap (barrel-roll axis)
 *   vh_gate — cross barrier, one open quadrant (requires correct X and Y)
 *
 * Visual: dark semi-transparent wall panels + glowing neon gap borders.
 * Fast: solid fills only; shadow used only on gap edge lines.
 *
 * Extends window.SJ (initialised by engine.js).
 */

(function () {
  'use strict';

  var Z_FAR  = 1200;
  var Z_NEAR = 0;

  // ─────────────────────────────────────────────────────────────
  // POOL SETUP
  // ─────────────────────────────────────────────────────────────
  SJ.initObstacles = function () {
    SJ.obstaclePool = [];
    SJ.obstacles    = [];
    for (var i = 0; i < 24; i++) {
      SJ.obstaclePool.push({
        active: false, z: Z_FAR, type: 'v_gate',
        gapCenterY: 0, gapHalf: 120,
        gapCenterX: 0, gapHalfX: 0,
        x: 0, w: 70, y: 0, h: 0,
        zoneIdx: 0, passed: false,
      });
    }
    SJ._spawnTimer    = -1500;
    SJ._spawnInterval = 2400;
    SJ._obstacleQueue = [];
  };

  SJ.clearObstacles = function () {
    for (var i = 0; i < SJ.obstaclePool.length; i++) SJ.obstaclePool[i].active = false;
    SJ.obstacles = [];
    SJ._spawnTimer = -1500;
    SJ._obstacleQueue = [];
  };

  SJ.startPatternChunk = function () {};

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  function rand(a, b) { return a + Math.random() * (b - a); }

  function getFree() {
    for (var i = 0; i < SJ.obstaclePool.length; i++) {
      if (!SJ.obstaclePool[i].active) return SJ.obstaclePool[i];
    }
    return null;
  }

  /** 0 at Z_FAR (just spawned), 1 at player (z=0). Negative when passed. */
  function depthFactor(z) { return (Z_FAR - z) / Z_FAR; }

  /**
   * screenFrame(t) — the screen rectangle the playfield occupies at depth t.
   * t=0 → a tiny rectangle at vanishing point; t=1 → full playfield.
   */
  function screenFrame(t) {
    var vx = SJ.vanishX, vy = SJ.vanishY;
    return {
      L: vx + (0          - vx) * t,
      R: vx + (SJ.width   - vx) * t,
      T: vy + (SJ.ceilY   - vy) * t,
      B: vy + (SJ.floorY  - vy) * t,
    };
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  // ─────────────────────────────────────────────────────────────
  // SPAWN HELPERS
  // ─────────────────────────────────────────────────────────────
  function activate(o, type) {
    o.active  = true;
    o.type    = type;
    o.z       = Z_FAR;
    o.zoneIdx = SJ.currentZoneIdx;
    o.passed  = false;
    if (SJ.obstacles.indexOf(o) === -1) SJ.obstacles.push(o);
  }

  function spawnVGate(gapCenterY, gapHalf) {
    var o = getFree(); if (!o) return;
    o.gapCenterY = gapCenterY;
    o.gapHalf    = gapHalf;
    activate(o, 'v_gate');
  }

  function spawnHGate(gapCenterX, gapHalfX) {
    var o = getFree(); if (!o) return;
    o.gapCenterX = gapCenterX;
    o.gapHalfX   = gapHalfX;
    activate(o, 'h_gate');
  }

  function spawnVHGate(gapCenterY, gapHalf, gapCenterX, gapHalfX) {
    var o = getFree(); if (!o) return;
    o.gapCenterY = gapCenterY; o.gapHalf  = gapHalf;
    o.gapCenterX = gapCenterX; o.gapHalfX = gapHalfX;
    activate(o, 'vh_gate');
  }

  // ─────────────────────────────────────────────────────────────
  // SPAWN LOGIC
  // ─────────────────────────────────────────────────────────────
  function spawnNext() {
    var playH    = SJ.floorY - SJ.ceilY;
    var playW    = SJ.width;
    var gapHalf  = Math.max(78, 130 - SJ.cycleCount * 8 - SJ.currentZoneIdx * 6);
    var gapHalfX = Math.max(playW * 0.18, playW * 0.36 - SJ.cycleCount * 0.015 * playW - SJ.currentZoneIdx * 0.012 * playW);

    var minCY  = SJ.ceilY  + gapHalf + 24;
    var maxCY  = SJ.floorY - gapHalf - 24;
    var centerY = rand(minCY, maxCY);

    var minCX   = gapHalfX + 22;
    var maxCX   = playW - gapHalfX - 22;
    var centerX = rand(minCX, maxCX);

    var difficulty = SJ.currentZoneIdx + SJ.cycleCount * 2;
    var roll = Math.random();

    if (difficulty < 1) {
      spawnVGate(centerY, gapHalf + 28);
    } else if (difficulty < 3) {
      if (roll < 0.70) spawnVGate(centerY, gapHalf);
      else             spawnHGate(centerX, gapHalfX + playW * 0.06);
    } else if (difficulty < 6) {
      if (roll < 0.44)      spawnVGate(centerY, gapHalf);
      else if (roll < 0.80) spawnHGate(centerX, gapHalfX);
      else                  spawnVHGate(centerY, gapHalf + 18, centerX, gapHalfX + playW * 0.04);
    } else {
      if (roll < 0.28)      spawnVGate(centerY, gapHalf);
      else if (roll < 0.55) spawnHGate(centerX, gapHalfX);
      else                  spawnVHGate(centerY, gapHalf, centerX, gapHalfX);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────
  SJ.updateObstacles = function (dt) {
    var speed = SJ.scrollSpeed || 220;
    var dtSec = dt / 1000;

    SJ._spawnTimer    += dt;
    SJ._spawnInterval  = Math.max(1100, 2400 - (speed - 220) * 2.4);
    if (SJ._spawnTimer >= SJ._spawnInterval) {
      SJ._spawnTimer -= SJ._spawnInterval;
      spawnNext();
    }

    for (var i = SJ.obstacles.length - 1; i >= 0; i--) {
      var o = SJ.obstacles[i];
      if (!o.active) { SJ.obstacles.splice(i, 1); continue; }
      o.z -= speed * dtSec;
      if (o.z < -380) { o.active = false; SJ.obstacles.splice(i, 1); }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // COLLISION — triggered when z crosses 0
  // ─────────────────────────────────────────────────────────────
  SJ.checkCollisions = function () {
    if (!SJ.player.alive) return;
    var p = SJ.player;

    for (var i = 0; i < SJ.obstacles.length; i++) {
      var o = SJ.obstacles[i];
      if (!o.active || o.passed || o.z > 0) continue;

      o.passed = true;
      var hit = false, nearMiss = false;

      if (o.type === 'v_gate') {
        var gT = o.gapCenterY - o.gapHalf, gB = o.gapCenterY + o.gapHalf;
        if (p.y < gT || p.y > gB) { hit = true; }
        else { nearMiss = (p.y - gT < 24 || gB - p.y < 24); }

      } else if (o.type === 'h_gate') {
        var gL = o.gapCenterX - o.gapHalfX, gR = o.gapCenterX + o.gapHalfX;
        if (p.x < gL || p.x > gR) { hit = true; }
        else { nearMiss = (p.x - gL < 24 || gR - p.x < 24); }

      } else if (o.type === 'vh_gate') {
        var vT = o.gapCenterY - o.gapHalf, vB = o.gapCenterY + o.gapHalf;
        var hL = o.gapCenterX - o.gapHalfX, hR = o.gapCenterX + o.gapHalfX;
        if (!(p.y >= vT && p.y <= vB && p.x >= hL && p.x <= hR)) { hit = true; }
        else { nearMiss = (p.y - vT < 24 || vB - p.y < 24 || p.x - hL < 24 || hR - p.x < 24); }
      }

      if (hit) { SJ.triggerDeath(); return; }

      if (nearMiss && SJ.checkNearMiss) {
        SJ.checkNearMiss(o, 0);
      } else if (!hit) {
        SJ.score += 10 * SJ.combo;
        if (SJ.spawnParticle) {
          for (var s = 0; s < 4; s++) {
            SJ.spawnParticle({
              x: SJ.vanishX + (Math.random() - 0.5) * 28,
              y: SJ.vanishY + (Math.random() - 0.5) * 18,
              vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3 - 1,
              maxLife: 18, size: 2 + Math.random() * 2,
              color: '#44ffaa', alpha: 0.85, type: 'circle', gravity: 0,
            });
          }
        }
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ZONE ACCENT COLOURS
  // ─────────────────────────────────────────────────────────────
  function getAccent(o) {
    // Use the zone of the obstacle (or current zone as fallback)
    var idx  = o.zoneIdx != null ? o.zoneIdx : SJ.currentZoneIdx;
    var zone = SJ.zones && SJ.zones[idx];
    var a0   = (zone && zone.accentColors && zone.accentColors[0]) || '#00eeff';
    var a1   = (zone && zone.accentColors && zone.accentColors[1]) || '#ff4400';
    return { a: a0, b: a1 };
  }

  // ─────────────────────────────────────────────────────────────
  // DRAW PRIMITIVES
  // ─────────────────────────────────────────────────────────────

  /** Dark wall panel — flat solid fill, fast */
  function panel(ctx, x1, y1, x2, y2) {
    var pw = x2 - x1, ph = y2 - y1;
    if (pw <= 0 || ph <= 0) return;
    ctx.fillStyle = 'rgba(5,5,15,0.86)';
    ctx.fillRect(x1, y1, pw, ph);
    // Subtle inner edge
    ctx.strokeStyle = 'rgba(60,60,100,0.3)';
    ctx.lineWidth   = 0.6;
    ctx.strokeRect(x1 + 0.5, y1 + 0.5, pw - 1, ph - 1);
  }

  /** Glowing gap edge line — the primary visual cue */
  function gapLine(ctx, x1, y1, x2, y2, color, lineW) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = lineW;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = color;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // Double-draw for stronger core
    ctx.shadowBlur  = 0;
    ctx.globalAlpha *= 0.6;
    ctx.lineWidth   = lineW * 0.45;
    ctx.strokeStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** Small spikes pointing into the gap — solid fill only (no shadow) */
  function spikeRow(ctx, x1, x2, baseY, tipDir, color, t) {
    if (t < 0.25) return;
    var sp = Math.max(4, 15 * t);
    var sp2 = sp / 2;
    var gap = Math.max(10, 28 * t);
    ctx.fillStyle = color;
    for (var x = x1 + gap / 2; x < x2; x += gap) {
      ctx.beginPath();
      if (tipDir > 0) {  // tip pointing down
        ctx.moveTo(x - sp2, baseY); ctx.lineTo(x, baseY + sp); ctx.lineTo(x + sp2, baseY);
      } else {            // tip pointing up
        ctx.moveTo(x - sp2, baseY); ctx.lineTo(x, baseY - sp); ctx.lineTo(x + sp2, baseY);
      }
      ctx.closePath(); ctx.fill();
    }
  }

  function spikeCol(ctx, x0, y1, y2, tipDir, color, t) {
    if (t < 0.25) return;
    var sp  = Math.max(4, 15 * t);
    var sp2 = sp / 2;
    var gap = Math.max(10, 28 * t);
    ctx.fillStyle = color;
    for (var y = y1 + gap / 2; y < y2; y += gap) {
      ctx.beginPath();
      if (tipDir > 0) {  // tip pointing right
        ctx.moveTo(x0, y - sp2); ctx.lineTo(x0 + sp, y); ctx.lineTo(x0, y + sp2);
      } else {            // tip pointing left
        ctx.moveTo(x0, y - sp2); ctx.lineTo(x0 - sp, y); ctx.lineTo(x0, y + sp2);
      }
      ctx.closePath(); ctx.fill();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER MAIN LOOP
  // ─────────────────────────────────────────────────────────────
  SJ.renderObstacles = function () {
    var ctx = SJ.ctx;

    for (var i = 0; i < SJ.obstacles.length; i++) {
      var o = SJ.obstacles[i];
      if (!o.active) continue;

      var t = depthFactor(o.z);
      if (t <= 0.015) continue;

      // Fade in near spawn point; fade out after passing
      var fade;
      if (o.z > 0) {
        fade = Math.min(1, (Z_FAR - o.z) / 180);
      } else {
        fade = Math.max(0, 1 + o.z / 100);
      }
      if (fade <= 0) continue;

      ctx.save();
      ctx.globalAlpha = fade;

      switch (o.type) {
        case 'v_gate':  drawVGate(ctx, o, t);  break;
        case 'h_gate':  drawHGate(ctx, o, t);  break;
        case 'vh_gate': drawVHGate(ctx, o, t); break;
      }

      ctx.restore();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // V_GATE — top + bottom wall panels, horizontal gap in centre
  // ─────────────────────────────────────────────────────────────
  function drawVGate(ctx, o, t) {
    var c  = getAccent(o);
    var f  = screenFrame(t);
    var lw = Math.max(1.5, 3 * t);

    var gapT = lerp(SJ.vanishY, o.gapCenterY - o.gapHalf, t);
    var gapB = lerp(SJ.vanishY, o.gapCenterY + o.gapHalf, t);

    // Wall panels
    if (gapT > f.T + 0.5) panel(ctx, f.L, f.T, f.R, gapT);
    if (gapB < f.B - 0.5) panel(ctx, f.L, gapB, f.R, f.B);

    // Gap edge glow lines
    ctx.save();
    if (gapT > f.T) { gapLine(ctx, f.L, gapT, f.R, gapT, c.a, lw); }
    if (gapB < f.B) { gapLine(ctx, f.L, gapB, f.R, gapB, c.a, lw); }
    ctx.restore();

    // Spikes at gap edges
    if (gapT > f.T) spikeRow(ctx, f.L, f.R, gapT, 1,  c.b, t);
    if (gapB < f.B) spikeRow(ctx, f.L, f.R, gapB, -1, c.b, t);

    // Danger zone tint inside gap when close
    if (t > 0.65) {
      var warn = (t - 0.65) / 0.35 * 0.08;
      ctx.fillStyle = c.a + '22';
      ctx.globalAlpha *= warn / 0.08;
      ctx.fillRect(f.L, gapT, f.R - f.L, gapB - gapT);
      ctx.globalAlpha = 1;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // H_GATE — left + right wall panels, vertical gap in centre
  // ─────────────────────────────────────────────────────────────
  function drawHGate(ctx, o, t) {
    var c  = getAccent(o);
    var f  = screenFrame(t);
    var lw = Math.max(1.5, 3 * t);

    var gapL = lerp(SJ.vanishX, o.gapCenterX - o.gapHalfX, t);
    var gapR = lerp(SJ.vanishX, o.gapCenterX + o.gapHalfX, t);

    if (gapL > f.L + 0.5) panel(ctx, f.L, f.T, gapL, f.B);
    if (gapR < f.R - 0.5) panel(ctx, gapR, f.T, f.R, f.B);

    ctx.save();
    if (gapL > f.L) { gapLine(ctx, gapL, f.T, gapL, f.B, c.a, lw); }
    if (gapR < f.R) { gapLine(ctx, gapR, f.T, gapR, f.B, c.a, lw); }
    ctx.restore();

    if (gapL > f.L) spikeCol(ctx, gapL, f.T, f.B, 1,  c.b, t);
    if (gapR < f.R) spikeCol(ctx, gapR, f.T, f.B, -1, c.b, t);
  }

  // ─────────────────────────────────────────────────────────────
  // VH_GATE — cross barrier with one open quadrant
  // ─────────────────────────────────────────────────────────────
  function drawVHGate(ctx, o, t) {
    var c  = getAccent(o);
    var f  = screenFrame(t);
    var lw = Math.max(1.5, 3 * t);

    var gapL = lerp(SJ.vanishX, o.gapCenterX - o.gapHalfX, t);
    var gapR = lerp(SJ.vanishX, o.gapCenterX + o.gapHalfX, t);
    var gapT = lerp(SJ.vanishY, o.gapCenterY - o.gapHalf,  t);
    var gapB = lerp(SJ.vanishY, o.gapCenterY + o.gapHalf,  t);

    // Top strip (full width, above gap)
    if (gapT > f.T) panel(ctx, f.L, f.T, f.R, gapT);
    // Bottom strip (full width, below gap)
    if (gapB < f.B) panel(ctx, f.L, gapB, f.R, f.B);
    // Left strip (gap height, left of gap)
    if (gapL > f.L) panel(ctx, f.L, gapT, gapL, gapB);
    // Right strip (gap height, right of gap)
    if (gapR < f.R) panel(ctx, gapR, gapT, f.R, gapB);

    // Gap edge glows — outline the opening rectangle only
    ctx.save();
    gapLine(ctx, gapL, gapT, gapR, gapT, c.a, lw);  // top of opening
    gapLine(ctx, gapL, gapB, gapR, gapB, c.a, lw);  // bottom of opening
    gapLine(ctx, gapL, gapT, gapL, gapB, c.a, lw);  // left of opening
    gapLine(ctx, gapR, gapT, gapR, gapB, c.a, lw);  // right of opening
    ctx.restore();

    // Spikes around gap perimeter
    if (gapT > f.T) spikeRow(ctx, gapL, gapR, gapT, 1,  c.b, t);
    if (gapB < f.B) spikeRow(ctx, gapL, gapR, gapB, -1, c.b, t);
    if (gapL > f.L) spikeCol(ctx, gapL, gapT, gapB, 1,  c.b, t);
    if (gapR < f.R) spikeCol(ctx, gapR, gapT, gapB, -1, c.b, t);
  }

})();
