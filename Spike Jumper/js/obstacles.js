/**
 * Spike Jumper — obstacles.js (3rd-Person Z-Depth)
 * Obstacles approach from a vanishing point (z-depth), growing from tiny to
 * full-screen as they reach the player. Three types:
 *
 *   v_gate  — full-width barrier with a vertical Y gap (classic Flappy Bird)
 *   h_gate  — full-height barrier with a horizontal X gap (barrel-roll mechanic)
 *   vh_gate — barrier with both X and Y gaps (hardest — requires correct lane & height)
 *
 * Extends window.SJ (initialized by engine.js).
 */

(function () {
  'use strict';

  var Z_FAR  = 1200;   // depth at which obstacles spawn (far away)
  var Z_NEAR = 0;      // player plane depth

  // ─────────────────────────────────────────────────────────────
  // POOL SETUP
  // ─────────────────────────────────────────────────────────────
  SJ.initObstacles = function () {
    SJ.obstaclePool = [];
    SJ.obstacles    = [];
    for (var i = 0; i < 30; i++) {
      SJ.obstaclePool.push({
        active: false,
        z: Z_FAR,
        type: 'v_gate',
        // v_gate / vh_gate vertical gap (in player-plane screen coords)
        gapCenterY: 0,
        gapHalf:    110,
        // h_gate / vh_gate horizontal gap
        gapCenterX: 0,
        gapHalfX:   0,
        // for legacy compat
        x: 0, w: 70, y: 0, h: 0,
        gapCenterY_world: 0,
        zoneIdx: 0,
        passed: false,
      });
    }
    SJ._spawnTimer    = -1500;
    SJ._spawnInterval = 2400;
    SJ._obstacleQueue = [];
    SJ._lastSpawnTime = 0;
    SJ._beatsSinceChunkStart = 0;
  };

  SJ.clearObstacles = function () {
    for (var i = 0; i < SJ.obstaclePool.length; i++) {
      SJ.obstaclePool[i].active = false;
    }
    SJ.obstacles = [];
    SJ._spawnTimer = -1500;
    SJ._obstacleQueue = [];
  };

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

  /**
   * depthFactor(z): 0 when at Z_FAR (just spawned), 1 when at player (z=0).
   * Returns negative values when z < 0 (passed player) — used for post-pass rendering.
   */
  function depthFactor(z) {
    return (Z_FAR - z) / Z_FAR;
  }

  /**
   * frameAt(t): Returns the screen rectangle the obstacle occupies at depth t.
   * t=0 → tiny dot at vanishing point; t=1 → full playfield.
   */
  function frameAt(t) {
    var vx = SJ.vanishX, vy = SJ.vanishY;
    return {
      L: vx + (0          - vx) * t,
      R: vx + (SJ.width   - vx) * t,
      T: vy + (SJ.ceilY   - vy) * t,
      B: vy + (SJ.floorY  - vy) * t,
    };
  }

  /** Lerp helper */
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ─────────────────────────────────────────────────────────────
  // SPAWN HELPERS
  // ─────────────────────────────────────────────────────────────
  function spawnVGate(gapCenterY, gapHalf) {
    var o = getFree(); if (!o) return;
    o.active      = true;
    o.type        = 'v_gate';
    o.z           = Z_FAR;
    o.gapCenterY  = gapCenterY;
    o.gapHalf     = gapHalf;
    o.zoneIdx     = SJ.currentZoneIdx;
    o.passed      = false;
    if (SJ.obstacles.indexOf(o) === -1) SJ.obstacles.push(o);
  }

  function spawnHGate(gapCenterX, gapHalfX) {
    var o = getFree(); if (!o) return;
    o.active      = true;
    o.type        = 'h_gate';
    o.z           = Z_FAR;
    o.gapCenterX  = gapCenterX;
    o.gapHalfX    = gapHalfX;
    o.zoneIdx     = SJ.currentZoneIdx;
    o.passed      = false;
    if (SJ.obstacles.indexOf(o) === -1) SJ.obstacles.push(o);
  }

  function spawnVHGate(gapCenterY, gapHalf, gapCenterX, gapHalfX) {
    var o = getFree(); if (!o) return;
    o.active      = true;
    o.type        = 'vh_gate';
    o.z           = Z_FAR;
    o.gapCenterY  = gapCenterY;
    o.gapHalf     = gapHalf;
    o.gapCenterX  = gapCenterX;
    o.gapHalfX    = gapHalfX;
    o.zoneIdx     = SJ.currentZoneIdx;
    o.passed      = false;
    if (SJ.obstacles.indexOf(o) === -1) SJ.obstacles.push(o);
  }

  // ─────────────────────────────────────────────────────────────
  // SPAWN LOGIC
  // ─────────────────────────────────────────────────────────────
  function spawnNext() {
    var playH   = SJ.floorY - SJ.ceilY;
    var playW   = SJ.width;
    var gapHalf = Math.max(72, 125 - SJ.cycleCount * 8 - SJ.currentZoneIdx * 5);
    var gapHalfX = Math.max(playW * 0.18, playW * 0.34 - SJ.cycleCount * 0.015 * playW - SJ.currentZoneIdx * 0.01 * playW);

    var minCY = SJ.ceilY  + gapHalf + 28;
    var maxCY = SJ.floorY - gapHalf - 28;
    var centerY = rand(minCY, maxCY);

    var minCX = gapHalfX + 18;
    var maxCX = playW - gapHalfX - 18;
    var centerX = rand(minCX, maxCX);

    var difficulty = SJ.currentZoneIdx + SJ.cycleCount * 2;
    var roll = Math.random();

    if (difficulty < 1) {
      // Zone 0 intro: only v_gate, generous gaps
      spawnVGate(centerY, gapHalf + 25);

    } else if (difficulty < 3) {
      // Mostly v_gate, occasional h_gate
      if (roll < 0.70) {
        spawnVGate(centerY, gapHalf);
      } else {
        spawnHGate(centerX, gapHalfX + playW * 0.06);
      }

    } else if (difficulty < 6) {
      // More h_gate, first vh_gate
      if (roll < 0.45) {
        spawnVGate(centerY, gapHalf);
      } else if (roll < 0.82) {
        spawnHGate(centerX, gapHalfX);
      } else {
        spawnVHGate(centerY, gapHalf + 15, centerX, gapHalfX + playW * 0.04);
      }

    } else {
      // Late game: balanced + frequent vh_gate
      if (roll < 0.30) {
        spawnVGate(centerY, gapHalf);
      } else if (roll < 0.58) {
        spawnHGate(centerX, gapHalfX);
      } else {
        spawnVHGate(centerY, gapHalf, centerX, gapHalfX);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────
  SJ.updateObstacles = function (dt) {
    var speed  = SJ.scrollSpeed || 220;
    var dtSec  = dt / 1000;

    // Spawn timer
    SJ._spawnTimer    += dt;
    SJ._spawnInterval  = Math.max(1200, 2400 - (speed - 220) * 2.5);

    if (SJ._spawnTimer >= SJ._spawnInterval) {
      SJ._spawnTimer -= SJ._spawnInterval;
      spawnNext();
    }

    // Move obstacles toward player (decrease z)
    for (var i = SJ.obstacles.length - 1; i >= 0; i--) {
      var o = SJ.obstacles[i];
      if (!o.active) { SJ.obstacles.splice(i, 1); continue; }

      o.z -= speed * dtSec;

      // Deactivate well behind player
      if (o.z < -350) {
        o.active = false;
        SJ.obstacles.splice(i, 1);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // COLLISION DETECTION — triggered when z crosses 0
  // ─────────────────────────────────────────────────────────────
  SJ.checkCollisions = function () {
    if (!SJ.player.alive) return;
    var p = SJ.player;

    for (var i = 0; i < SJ.obstacles.length; i++) {
      var o = SJ.obstacles[i];
      if (!o.active || o.passed) continue;
      if (o.z > 0) continue;   // not yet at player

      o.passed = true;

      var hit = false;
      var nearMiss = false;

      if (o.type === 'v_gate') {
        var gapTop = o.gapCenterY - o.gapHalf;
        var gapBot = o.gapCenterY + o.gapHalf;
        if (p.y < gapTop || p.y > gapBot) {
          hit = true;
        } else {
          // Near-miss: within 18px of gap edge
          nearMiss = (p.y - gapTop < 22 || gapBot - p.y < 22);
        }

      } else if (o.type === 'h_gate') {
        var gapLeft  = o.gapCenterX - o.gapHalfX;
        var gapRight = o.gapCenterX + o.gapHalfX;
        if (p.x < gapLeft || p.x > gapRight) {
          hit = true;
        } else {
          nearMiss = (p.x - gapLeft < 22 || gapRight - p.x < 22);
        }

      } else if (o.type === 'vh_gate') {
        var vgTop   = o.gapCenterY - o.gapHalf;
        var vgBot   = o.gapCenterY + o.gapHalf;
        var hgLeft  = o.gapCenterX - o.gapHalfX;
        var hgRight = o.gapCenterX + o.gapHalfX;

        var inY = (p.y >= vgTop && p.y <= vgBot);
        var inX = (p.x >= hgLeft && p.x <= hgRight);

        if (!inY || !inX) {
          hit = true;
        } else {
          nearMiss = (
            p.y - vgTop  < 22 || vgBot   - p.y < 22 ||
            p.x - hgLeft < 22 || hgRight - p.x < 22
          );
        }
      }

      if (hit) {
        SJ.triggerDeath();
        return;
      }

      if (nearMiss && SJ.checkNearMiss) {
        SJ.checkNearMiss(o, 0);
      } else if (!hit) {
        // Clean pass — score
        SJ.score += 10 * SJ.combo;
        if (SJ.spawnParticle) {
          // Quick green spark at vanishing point
          for (var s = 0; s < 5; s++) {
            SJ.spawnParticle({
              x: SJ.vanishX + (Math.random()-0.5)*30,
              y: SJ.vanishY + (Math.random()-0.5)*20,
              vx: (Math.random()-0.5)*3,
              vy: (Math.random()-0.5)*3 - 1,
              maxLife: 20,
              size: 2 + Math.random()*2,
              color: '#44ffaa',
              alpha: 0.8,
              type: 'circle',
              gravity: 0,
            });
          }
        }
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDERING — perspective projection from vanishing point
  // ─────────────────────────────────────────────────────────────
  SJ.renderObstacles = function () {
    var ctx  = SJ.ctx;
    var zone = SJ.zones[SJ.currentZoneIdx] || {};

    for (var i = 0; i < SJ.obstacles.length; i++) {
      var o = SJ.obstacles[i];
      if (!o.active) continue;

      var t = depthFactor(o.z);   // 0 = far away, 1 = at player
      if (t <= 0.01) continue;    // not yet visible

      // Fade in as it approaches from far; fade out after passing
      var fadeAlpha;
      if (o.z > 0) {
        // Approaching: fade in over first 200 depth units
        fadeAlpha = Math.min(1, (Z_FAR - o.z) / 200);
      } else {
        // Passed: fade out quickly
        fadeAlpha = Math.max(0, 1 + o.z / 120);
      }
      if (fadeAlpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = fadeAlpha;

      if (o.type === 'v_gate') {
        drawVGate(ctx, o, t, zone);
      } else if (o.type === 'h_gate') {
        drawHGate(ctx, o, t, zone);
      } else if (o.type === 'vh_gate') {
        drawVHGate(ctx, o, t, zone);
      }

      ctx.restore();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // BLOCK DRAW HELPERS
  // ─────────────────────────────────────────────────────────────
  function getZoneColors(zone) {
    var a0 = (zone.accentColors && zone.accentColors[0]) || '#cc2200';
    var a1 = (zone.accentColors && zone.accentColors[1]) || '#992200';
    var a2 = (zone.accentColors && zone.accentColors[2]) || '#441100';
    return { accent: a0, accent2: a1, fill: a2 };
  }

  /**
   * drawPerspBlock — draws a single solid block within the perspective frame.
   * (x1,y1) top-left and (x2,y2) bottom-right in screen coords at depth t.
   */
  function drawPerspBlock(ctx, x1, y1, x2, y2, c, t) {
    var w = x2 - x1, h = y2 - y1;
    if (w <= 0 || h <= 0) return;

    // Gradient across width (left edge darker, right edge darker)
    var grad = ctx.createLinearGradient(x1, y1, x2, y1);
    grad.addColorStop(0,   c.fill);
    grad.addColorStop(0.35, c.accent2);
    grad.addColorStop(0.65, c.accent2);
    grad.addColorStop(1,   c.fill);
    ctx.fillStyle = grad;
    ctx.fillRect(x1, y1, w, h);

    // Subtle inner gloss
    var gloss = ctx.createLinearGradient(x1, y1, x1, y2);
    gloss.addColorStop(0,   'rgba(255,255,255,0.06)');
    gloss.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(x1, y1, w, h);

    // Dark edge border
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth   = 0.8;
    ctx.strokeRect(x1 + 0.5, y1 + 0.5, w - 1, h - 1);

    // Scale-dependent detail: horizontal scan lines when large enough
    if (w > 40 && h > 20) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth   = 0.5;
      var lineStep = Math.max(6, 10 * t);
      for (var ly = y1 + lineStep; ly < y2; ly += lineStep) {
        ctx.beginPath();
        ctx.moveTo(x1, ly);
        ctx.lineTo(x2, ly);
        ctx.stroke();
      }
    }
  }

  /**
   * drawSpike — glowing spike pointing INTO the gap from a block edge.
   * dir: 'up' | 'down' | 'left' | 'right'
   */
  function drawSpike(ctx, cx, cy, size, dir, color) {
    var hs = size / 2;
    ctx.fillStyle   = color;
    ctx.shadowBlur  = 8 * Math.min(1, size / 14);
    ctx.shadowColor = color;
    ctx.beginPath();
    if (dir === 'up') {
      ctx.moveTo(cx - hs, cy); ctx.lineTo(cx, cy - size); ctx.lineTo(cx + hs, cy);
    } else if (dir === 'down') {
      ctx.moveTo(cx - hs, cy); ctx.lineTo(cx, cy + size); ctx.lineTo(cx + hs, cy);
    } else if (dir === 'left') {
      ctx.moveTo(cx, cy - hs); ctx.lineTo(cx - size, cy); ctx.lineTo(cx, cy + hs);
    } else {
      ctx.moveTo(cx, cy - hs); ctx.lineTo(cx + size, cy); ctx.lineTo(cx, cy + hs);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  /**
   * drawEdgeSpikes — row of spikes along a horizontal or vertical edge.
   */
  function drawEdgeSpikes(ctx, x1, y1, x2, y2, dir, color, t) {
    var spikeSize = Math.max(4, 18 * t);
    var spacing   = Math.max(8, 32 * t);
    ctx.fillStyle   = color;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = color;

    if (dir === 'up' || dir === 'down') {
      for (var sx = x1 + spacing/2; sx < x2; sx += spacing) {
        drawSpike(ctx, sx, y1, spikeSize, dir, color);
      }
    } else {
      for (var sy = y1 + spacing/2; sy < y2; sy += spacing) {
        drawSpike(ctx, x1, sy, spikeSize, dir, color);
      }
    }
    ctx.shadowBlur = 0;
  }

  /**
   * drawGlowEdge — glowing line along a gap edge.
   */
  function drawGlowEdge(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    ctx.shadowBlur  = 12;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ─────────────────────────────────────────────────────────────
  // V_GATE — top and bottom blocks, vertical gap in middle
  // ─────────────────────────────────────────────────────────────
  function drawVGate(ctx, o, t, zone) {
    var c   = getZoneColors(zone);
    var f   = frameAt(t);

    // Project the gap positions to current depth
    var gapT = lerp(SJ.vanishY, o.gapCenterY - o.gapHalf, t);
    var gapB = lerp(SJ.vanishY, o.gapCenterY + o.gapHalf, t);

    // Top block (ceiling to gap top)
    if (gapT > f.T) {
      drawPerspBlock(ctx, f.L, f.T, f.R, gapT, c, t);
      drawEdgeSpikes(ctx, f.L, gapT, f.R, gapT, 'down', c.accent, t);
      drawGlowEdge(ctx, f.L, gapT, f.R, gapT, c.accent);
    }

    // Bottom block (gap bottom to floor)
    if (gapB < f.B) {
      drawPerspBlock(ctx, f.L, gapB, f.R, f.B, c, t);
      drawEdgeSpikes(ctx, f.L, gapB, f.R, gapB, 'up', c.accent, t);
      drawGlowEdge(ctx, f.L, gapB, f.R, gapB, c.accent);
    }

    // Danger glow in gap: warn player
    if (t > 0.6) {
      var warnAlpha = (t - 0.6) / 0.4 * 0.12;
      var warnGrad  = ctx.createLinearGradient(f.L, gapT, f.L, gapB);
      warnGrad.addColorStop(0,   c.accent + '44');
      warnGrad.addColorStop(0.5, 'transparent');
      warnGrad.addColorStop(1,   c.accent + '44');
      ctx.fillStyle   = warnGrad;
      ctx.globalAlpha *= warnAlpha / 0.12;
      ctx.fillRect(f.L, gapT, f.R - f.L, gapB - gapT);
      ctx.globalAlpha = 1;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // H_GATE — left and right blocks, horizontal gap in middle
  // ─────────────────────────────────────────────────────────────
  function drawHGate(ctx, o, t, zone) {
    var c = getZoneColors(zone);
    var f = frameAt(t);

    var gapL = lerp(SJ.vanishX, o.gapCenterX - o.gapHalfX, t);
    var gapR = lerp(SJ.vanishX, o.gapCenterX + o.gapHalfX, t);

    // Left block
    if (gapL > f.L) {
      drawPerspBlock(ctx, f.L, f.T, gapL, f.B, c, t);
      drawEdgeSpikes(ctx, gapL, f.T, gapL, f.B, 'right', c.accent, t);
      drawGlowEdge(ctx, gapL, f.T, gapL, f.B, c.accent);
    }

    // Right block
    if (gapR < f.R) {
      drawPerspBlock(ctx, gapR, f.T, f.R, f.B, c, t);
      drawEdgeSpikes(ctx, gapR, f.T, gapR, f.B, 'left', c.accent, t);
      drawGlowEdge(ctx, gapR, f.T, gapR, f.B, c.accent);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // VH_GATE — three blocks with one open quadrant
  // ─────────────────────────────────────────────────────────────
  function drawVHGate(ctx, o, t, zone) {
    var c = getZoneColors(zone);
    var f = frameAt(t);

    var gapL = lerp(SJ.vanishX, o.gapCenterX - o.gapHalfX, t);
    var gapR = lerp(SJ.vanishX, o.gapCenterX + o.gapHalfX, t);
    var gapT = lerp(SJ.vanishY, o.gapCenterY - o.gapHalf,  t);
    var gapB = lerp(SJ.vanishY, o.gapCenterY + o.gapHalf,  t);

    // Top-left block (spans full top, left of gap X)
    if (gapL > f.L && gapT > f.T) {
      drawPerspBlock(ctx, f.L, f.T, gapL, gapT, c, t);
    }
    // Top-right block
    if (gapR < f.R && gapT > f.T) {
      drawPerspBlock(ctx, gapR, f.T, f.R, gapT, c, t);
    }
    // Full-width top strip (above vertical gap)
    if (gapT > f.T) {
      drawPerspBlock(ctx, gapL, f.T, gapR, gapT, c, t);
    }

    // Bottom-left block
    if (gapL > f.L && gapB < f.B) {
      drawPerspBlock(ctx, f.L, gapB, gapL, f.B, c, t);
    }
    // Bottom-right block
    if (gapR < f.R && gapB < f.B) {
      drawPerspBlock(ctx, gapR, gapB, f.R, f.B, c, t);
    }
    // Full-width bottom strip
    if (gapB < f.B) {
      drawPerspBlock(ctx, gapL, gapB, gapR, f.B, c, t);
    }

    // Left wall strip (full height, left of X gap)
    if (gapL > f.L) {
      drawPerspBlock(ctx, f.L, gapT, gapL, gapB, c, t);
      drawEdgeSpikes(ctx, gapL, gapT, gapL, gapB, 'right', c.accent, t);
      drawGlowEdge(ctx, gapL, gapT, gapL, gapB, c.accent);
    }

    // Right wall strip
    if (gapR < f.R) {
      drawPerspBlock(ctx, gapR, gapT, f.R, gapB, c, t);
      drawEdgeSpikes(ctx, gapR, gapT, gapR, gapB, 'left', c.accent, t);
      drawGlowEdge(ctx, gapR, gapT, gapR, gapB, c.accent);
    }

    // Glow edges on gap
    drawGlowEdge(ctx, gapL, gapT, gapR, gapT, c.accent);   // top of gap
    drawGlowEdge(ctx, gapL, gapB, gapR, gapB, c.accent);   // bottom of gap
    drawEdgeSpikes(ctx, gapL, gapT, gapR, gapT, 'down', c.accent, t);
    drawEdgeSpikes(ctx, gapL, gapB, gapR, gapB, 'up',   c.accent, t);
  }

})();
