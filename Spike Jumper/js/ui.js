/**
 * Spike Jumper — ui.js
 * Agent 3 of 3: Start screen, HUD, game-over boarding pass,
 * scoring logic, near-miss handling, high-score persistence.
 *
 * Extends window.SJ (initialized by engine.js).
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  // Rounded rectangle path helper (does NOT fill/stroke — caller does that)
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
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

  // Draw the front-view paper airplane (nose pointing at viewer)
  function drawFrontViewPlane(ctx, scale) {
    var s = 60 * scale;

    // Left wing
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(-s * 2.2, s * 0.6);
    ctx.lineTo(-s * 0.5, s * 0.7);
    ctx.lineTo(0, s * 0.3);
    ctx.closePath();
    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(s * 2.2, s * 0.6);
    ctx.lineTo(s * 0.5, s * 0.7);
    ctx.lineTo(0, s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center body
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(-s * 0.3, s * 0.8);
    ctx.lineTo(s * 0.3, s * 0.8);
    ctx.closePath();
    ctx.fillStyle = '#e0e0e0';
    ctx.fill();
    ctx.stroke();

    // Nose dot
    ctx.beginPath();
    ctx.arc(0, -s * 0.7, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ccc';
    ctx.fill();

    // Wing fold highlights
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(-s * 2.2, s * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(s * 2.2, s * 0.6);
    ctx.stroke();
  }

  // ─────────────────────────────────────────────────────────────
  // SJ.initUI
  // ─────────────────────────────────────────────────────────────
  SJ.initUI = function () {
    SJ.loadHighScore();
    SJ._gameOverSlideY   = 0;
    SJ._gameOverTimer    = 0;
    SJ._gameOverShowing  = false;
    SJ._startScreenPulse = 0;
    SJ._newHighScore     = false;
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.loadHighScore / SJ.saveHighScore
  // ─────────────────────────────────────────────────────────────
  SJ.loadHighScore = function () {
    try {
      var data = JSON.parse(localStorage.getItem('spikeJumperHS') || '{}');
      SJ.bestScore    = data.score    || 0;
      SJ.bestDistance = data.distance || 0;
      SJ.bestZone     = data.zone     || 0;
      SJ.bestCombo    = data.combo    || 1;
    } catch (e) {
      SJ.bestScore    = 0;
      SJ.bestDistance = 0;
      SJ.bestZone     = 0;
      SJ.bestCombo    = 1;
    }
  };

  SJ.saveHighScore = function () {
    SJ._newHighScore = false;
    if (SJ.score > SJ.bestScore) {
      SJ.bestScore     = SJ.score;
      SJ._newHighScore = true;
    }
    if (SJ.distance > SJ.bestDistance) SJ.bestDistance = SJ.distance;
    if (SJ.currentZoneIdx > SJ.bestZone) SJ.bestZone = SJ.currentZoneIdx;
    if (SJ.maxCombo > SJ.bestCombo)      SJ.bestCombo = SJ.maxCombo;
    try {
      localStorage.setItem('spikeJumperHS', JSON.stringify({
        score:    SJ.bestScore,
        distance: Math.round(SJ.bestDistance),
        zone:     SJ.bestZone,
        combo:    SJ.bestCombo,
      }));
    } catch (e) {}
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.renderStartScreen
  // ─────────────────────────────────────────────────────────────
  SJ.renderStartScreen = function () {
    var ctx = SJ.ctx;
    var w   = SJ.width;
    var h   = SJ.height;
    var t   = Date.now() / 1000;

    // ── Background gradient ──────────────────────────────────
    var bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#04041a');
    bgGrad.addColorStop(0.55, '#0a0a2a');
    bgGrad.addColorStop(1, '#141430');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Star field (deterministic — no per-frame flicker) ────
    for (var i = 0; i < 60; i++) {
      var sx = ((i * 137.508 + 50) % w + w) % w;
      var sy = ((i * 97.32  + 30) % h + h) % h;
      var alpha = 0.15 + 0.3 * Math.sin(t * 0.5 + i * 0.618);
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1 + (i % 3) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Subtle horizon glow ──────────────────────────────────
    var horizGrad = ctx.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, w * 0.55);
    horizGrad.addColorStop(0,   'rgba(30, 60, 180, 0.18)');
    horizGrad.addColorStop(0.5, 'rgba(20, 40, 120, 0.08)');
    horizGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = horizGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Title ────────────────────────────────────────────────
    ctx.textAlign  = 'center';
    ctx.shadowBlur = 28;
    ctx.shadowColor = '#4D96FF';
    ctx.fillStyle   = '#ffffff';
    var titleSize = Math.min(72, w * 0.1);
    ctx.font = 'bold ' + titleSize + 'px "Oswald", sans-serif';
    ctx.fillText('SPIKE JUMPER', w / 2, h * 0.21);
    ctx.shadowBlur = 0;

    // ── Subtitle ─────────────────────────────────────────────
    var subSize = Math.min(19, w * 0.027);
    ctx.font      = subSize + 'px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('A Paper Airplane Adventure', w / 2, h * 0.285);

    // ── Decorative line under subtitle ───────────────────────
    var lineW = Math.min(260, w * 0.35);
    var lineY = h * 0.308;
    var lineGrad = ctx.createLinearGradient(w / 2 - lineW / 2, lineY, w / 2 + lineW / 2, lineY);
    lineGrad.addColorStop(0,   'rgba(77,150,255,0)');
    lineGrad.addColorStop(0.5, 'rgba(77,150,255,0.6)');
    lineGrad.addColorStop(1,   'rgba(77,150,255,0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - lineW / 2, lineY);
    ctx.lineTo(w / 2 + lineW / 2, lineY);
    ctx.stroke();

    // ── Front-view airplane illustration ────────────────────
    ctx.save();
    ctx.translate(w / 2, h * 0.47);
    var hover       = Math.sin(t * 1.5) * 8;
    var tiltHover   = Math.sin(t * 1.1) * 0.06;
    ctx.translate(0, hover);
    ctx.rotate(tiltHover);
    var planeScale = Math.max(0.5, Math.min(w, h) * 0.0012);
    drawFrontViewPlane(ctx, planeScale);
    ctx.restore();

    // ── "Press Space to Throw" prompt ───────────────────────
    var pulse    = 1 + 0.07 * Math.sin(t * 3.0);
    var promptY  = h * 0.66;
    ctx.save();
    ctx.translate(w / 2, promptY);
    ctx.scale(pulse, pulse);
    ctx.textAlign   = 'center';
    ctx.fillStyle   = '#FFD93D';
    ctx.shadowBlur  = 10;
    ctx.shadowColor = '#FFD93D';
    var promptSize  = Math.min(22, w * 0.031);
    ctx.font = 'bold ' + promptSize + 'px "Oswald", sans-serif';
    ctx.fillText('PRESS SPACE TO THROW', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── High score panel ────────────────────────────────────
    if (SJ.bestScore > 0) {
      ctx.textAlign  = 'center';
      var hsSize = Math.min(13, w * 0.019);
      ctx.font      = hsSize + 'px "Share Tech Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText(
        'BEST: ' + SJ.bestScore.toLocaleString() + ' pts  |  ' + Math.round(SJ.bestDistance) + 'm',
        w / 2, h * 0.735
      );
      var zoneNames = ['City', 'N.Lights', 'Space', 'Falling City', 'Ocean'];
      if (SJ.bestZone > 0) {
        ctx.fillText(
          'Furthest: ' + (zoneNames[SJ.bestZone] || 'City') + '  |  Best combo: x' + SJ.bestCombo,
          w / 2, h * 0.765
        );
      }
    }

    // ── Zone progression hint ────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    var hintSize  = Math.min(11, w * 0.015);
    ctx.font      = hintSize + 'px "Share Tech Mono", monospace';
    ctx.fillText('City  →  Northern Lights  →  Space  →  Falling City  →  Ocean  →  ∞', w / 2, h * 0.878);

    // ── Version tag ─────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font      = '10px "Share Tech Mono", monospace';
    ctx.fillText('v1.0', w / 2, h * 0.96);

    ctx.textAlign = 'left';
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.renderHUD
  // ─────────────────────────────────────────────────────────────
  SJ.renderHUD = function () {
    var ctx = SJ.ctx;
    var w   = SJ.width;
    var h   = SJ.height;
    var t   = SJ.elapsed / 1000;

    ctx.save();

    // ── Flight distance (top-left) ───────────────────────────
    ctx.fillStyle  = 'rgba(255,255,255,0.88)';
    var distSize   = Math.min(16, w * 0.022);
    ctx.font       = 'bold ' + distSize + 'px "Share Tech Mono", monospace';
    ctx.textAlign  = 'left';
    ctx.fillText('\u2708 ' + Math.round(SJ.distance) + 'm', 16, 30);

    // ── Zone name (top center, subtle) ───────────────────────
    var zone = SJ.zones && SJ.zones[SJ.currentZoneIdx];
    if (zone) {
      ctx.textAlign  = 'center';
      ctx.globalAlpha = 0.42;
      var zNameSize   = Math.min(12, w * 0.017);
      ctx.font        = zNameSize + 'px "Oswald", sans-serif';
      ctx.fillStyle   = '#fff';
      ctx.fillText(zone.name, w / 2, 22);
      if (SJ.cycleCount > 0) {
        ctx.font      = (zNameSize - 1) + 'px "Share Tech Mono", monospace';
        ctx.fillText('LOOP ' + (SJ.cycleCount + 1), w / 2, 38);
      }
      ctx.globalAlpha = 1;
    }

    // ── Score (top-right) ────────────────────────────────────
    ctx.textAlign  = 'right';
    var scoreSize  = Math.min(18, w * 0.024);
    ctx.font       = 'bold ' + scoreSize + 'px "Share Tech Mono", monospace';
    ctx.fillStyle  = 'rgba(255,255,255,0.92)';
    ctx.fillText(SJ.score.toLocaleString(), w - 16, 28);

    // ── Combo multiplier ─────────────────────────────────────
    if (SJ.combo > 1) {
      var comboPulse = 1 + 0.15 * Math.sin(t * 8);
      ctx.save();
      ctx.translate(w - 16, 48);
      ctx.scale(comboPulse, comboPulse);
      ctx.textAlign  = 'right';
      var comboSize  = Math.min(14, w * 0.019);
      ctx.font       = 'bold ' + comboSize + 'px "Oswald", sans-serif';
      ctx.fillStyle  = '#FFD93D';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#FFD93D';
      ctx.fillText('x' + SJ.combo + ' COMBO', 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ── Zone progress bar (thin bar at very top of screen) ───
    if (SJ.zoneDuration > 0) {
      var zoneProgress = Math.min(1, SJ.zoneTimer / SJ.zoneDuration);
      var barH  = 3;
      var barW  = w * zoneProgress;
      var barColor = zone ? zone.accentColors[0] : '#4D96FF';
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(0, 0, w, barH);
      ctx.fillStyle = barColor;
      ctx.shadowBlur  = 6;
      ctx.shadowColor = barColor;
      ctx.fillRect(0, 0, barW, barH);
      ctx.shadowBlur  = 0;
    }

    // ── Rhythm bonus flash ───────────────────────────────────
    if (SJ.rhythmBonusTimer > 0) {
      SJ.rhythmBonusTimer -= SJ.dt;
      var rAlpha = Math.max(0, Math.min(1, SJ.rhythmBonusTimer / 400));
      ctx.globalAlpha = rAlpha;
      var isPerfect   = SJ.rhythmBonusText === 'PERFECT!';
      ctx.fillStyle   = isPerfect ? '#FFD700' : '#aaffaa';
      var bonusSize   = Math.min(20, w * 0.028);
      ctx.font        = 'bold ' + bonusSize + 'px "Oswald", sans-serif';
      ctx.textAlign   = 'center';
      ctx.shadowBlur  = 12;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fillText(SJ.rhythmBonusText, w / 2, h * 0.42);
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'left';
    ctx.restore();
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.renderGameOver — boarding-pass slide-in screen
  // ─────────────────────────────────────────────────────────────
  SJ.renderGameOver = function () {
    var ctx = SJ.ctx;
    var w   = SJ.width;
    var h   = SJ.height;

    // Detect fresh entry — reset timer
    if (!SJ._gameOverShowing) {
      SJ._gameOverShowing = true;
      SJ._gameOverTimer   = 0;
    }
    SJ._gameOverTimer += SJ.dt;

    // ── Slide-in animation ───────────────────────────────────
    var targetY   = h / 2;
    var startY    = h + 320;
    var progress  = Math.min(1, SJ._gameOverTimer / 620);
    var eased     = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    var slideY    = startY + (targetY - startY) * eased;

    // ── Dimmed background overlay ────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.62, eased * 0.62) + ')';
    ctx.fillRect(0, 0, w, h);

    // ── Boarding pass dimensions ─────────────────────────────
    var bpW  = Math.min(480, w * 0.86);
    var bpH  = Math.min(400, h * 0.72);
    var bpX  = w / 2 - bpW / 2;
    var bpY  = slideY - bpH / 2;

    ctx.save();

    // Drop shadow
    ctx.shadowBlur  = 32;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';

    // ── Main boarding pass body (cream) ──────────────────────
    roundRect(ctx, bpX, bpY, bpW, bpH, 14);
    ctx.fillStyle = '#f5f0e8';
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── Top colored band (zone accent color) ─────────────────
    var zone      = SJ.zones && SJ.zones[SJ.currentZoneIdx];
    var bandColor = zone ? zone.accentColors[0] : '#4D96FF';

    // Draw rounded-top band then square off bottom
    roundRect(ctx, bpX, bpY, bpW, 58, 14);
    ctx.fillStyle = bandColor;
    ctx.fill();
    // Fill rectangular bottom half of band corners to flatten them
    ctx.fillRect(bpX, bpY + 40, bpW, 18);

    // ── Band text ─────────────────────────────────────────────
    var headerSize = Math.min(20, bpW * 0.044);
    ctx.fillStyle  = '#ffffff';
    ctx.font       = 'bold ' + headerSize + 'px "Oswald", sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText('BOARDING PASS', w / 2, bpY + 23);

    var subHeaderSize = Math.min(11, bpW * 0.024);
    ctx.font       = subHeaderSize + 'px "Share Tech Mono", monospace';
    ctx.fillStyle  = 'rgba(255,255,255,0.82)';
    ctx.fillText('SPIKE JUMPER AIRWAYS', w / 2, bpY + 43);

    // ── Dashed separator ─────────────────────────────────────
    var sep1Y = bpY + 72;
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = '#ccbba8';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(bpX + 22, sep1Y);
    ctx.lineTo(bpX + bpW - 22, sep1Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Stats rows ────────────────────────────────────────────
    var zoneNames = ['City', 'Northern Lights', 'Space', 'Falling City', 'Ocean'];
    var stats = [
      { label: 'FLIGHT DISTANCE',    value: Math.round(SJ.distance) + 'm' },
      { label: 'DESTINATION REACHED', value: zoneNames[SJ.currentZoneIdx] || 'City' },
      { label: 'TOTAL SCORE',        value: SJ.score.toLocaleString() },
      { label: 'BEST COMBO',         value: 'x' + SJ.maxCombo },
      { label: 'LOOP COUNT',         value: SJ.cycleCount > 0 ? (SJ.cycleCount + 1) + ' cycles' : 'First run' },
    ];

    var statsTop  = sep1Y + 8;
    var statsArea = bpH - 140;
    var rowH      = statsArea / stats.length;

    ctx.textAlign = 'left';

    for (var si = 0; si < stats.length; si++) {
      var stat = stats[si];
      var rowY = statsTop + si * rowH + 4;

      // Label
      var labelSize = Math.min(10, bpW * 0.021);
      ctx.fillStyle = '#9a8a78';
      ctx.font      = labelSize + 'px "Share Tech Mono", monospace';
      ctx.fillText(stat.label, bpX + 26, rowY + 4);

      // Value
      var valSize   = Math.min(16, bpW * 0.034);
      ctx.fillStyle = '#1a1008';
      ctx.font      = 'bold ' + valSize + 'px "Oswald", sans-serif';
      ctx.fillText(stat.value, bpX + 26, rowY + 20);

      // Score row: right-side best score / new high score
      if (si === 2) {
        if (SJ._newHighScore) {
          ctx.fillStyle  = '#c0392b';
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#c0392b';
          ctx.font       = 'bold ' + Math.min(12, bpW * 0.026) + 'px "Oswald", sans-serif';
          ctx.textAlign  = 'right';
          ctx.fillText('\u2605 NEW HIGH SCORE!', bpX + bpW - 26, rowY + 20);
          ctx.shadowBlur = 0;
          ctx.textAlign  = 'left';
        } else {
          ctx.fillStyle = '#9a8a78';
          ctx.font      = Math.min(11, bpW * 0.023) + 'px "Share Tech Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText('best: ' + SJ.bestScore.toLocaleString(), bpX + bpW - 26, rowY + 20);
          ctx.textAlign = 'left';
        }
      }

      // Subtle separator between rows (except last)
      if (si < stats.length - 1) {
        ctx.strokeStyle = 'rgba(180,160,130,0.25)';
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.moveTo(bpX + 22, rowY + rowH - 2);
        ctx.lineTo(bpX + bpW - 22, rowY + rowH - 2);
        ctx.stroke();
      }
    }

    // ── Dashed separator before button ────────────────────────
    var sep2Y = bpY + bpH - 62;
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = '#ccbba8';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(bpX + 22, sep2Y);
    ctx.lineTo(bpX + bpW - 22, sep2Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Notch semicircles on left and right of second separator
    ctx.fillStyle = '#ddd8d0'; // match page background or near it
    ctx.beginPath();
    ctx.arc(bpX, sep2Y, 10, -Math.PI / 2, Math.PI / 2, false);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bpX + bpW, sep2Y, 10, Math.PI / 2, Math.PI * 1.5, false);
    ctx.fill();

    // ── Retry button ──────────────────────────────────────────
    var btnW  = Math.min(230, bpW * 0.52);
    var btnH  = 38;
    var btnX  = w / 2 - btnW / 2;
    var btnY  = bpY + bpH - 52;

    roundRect(ctx, btnX, btnY, btnW, btnH, 9);
    ctx.fillStyle  = bandColor;
    ctx.shadowBlur = 8;
    ctx.shadowColor = bandColor;
    ctx.fill();
    ctx.shadowBlur = 0;

    var btnTextSize = Math.min(14, bpW * 0.03);
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold ' + btnTextSize + 'px "Oswald", sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText('\u2708  BOOK ANOTHER FLIGHT', w / 2, btnY + 24);

    ctx.restore();

    // ── "SPACE to retry" prompt below the card ───────────────
    if (progress > 0.82) {
      var promptAlpha = (progress - 0.82) / 0.18;
      ctx.globalAlpha = promptAlpha * 0.45;
      ctx.fillStyle   = '#ffffff';
      var promptSize  = Math.min(12, w * 0.017);
      ctx.font        = promptSize + 'px "Share Tech Mono", monospace';
      ctx.textAlign   = 'center';
      ctx.fillText('SPACE to retry', w / 2, bpY + bpH + 30);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = 'left';
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.updateScoring(dt)
  // ─────────────────────────────────────────────────────────────
  SJ.updateScoring = function (dt) {
    // Distance accumulates based on speed
    SJ.distance += SJ.speed * dt / 1000 * 8;

    // Base score from flying (speed * combo)
    SJ.score += Math.round(SJ.speed * dt / 1000 * SJ.combo);

    // Combo decay: reset if no near-miss in 5 seconds
    if (SJ.combo > 1 && SJ.lastNearMissTime > 0) {
      if (Date.now() - SJ.lastNearMissTime > 5000) {
        SJ.combo = 1;
      }
    }

    // Update player eyeState based on nearest obstacle
    var nearestDist = Infinity;
    for (var i = 0; i < SJ.obstacles.length; i++) {
      var o = SJ.obstacles[i];
      if (!o.active || o.z > 200) continue;
      if (SJ.project3D) {
        var proj = SJ.project3D(o.worldX, o.worldY, o.z);
        var dx   = SJ.player.x - proj.x;
        var dy   = SJ.player.y - proj.y;
        var d    = Math.sqrt(dx * dx + dy * dy);
        if (d < nearestDist) nearestDist = d;
      }
    }

    if (nearestDist < 80) {
      SJ.player.eyeState = 'fear';
    } else if (Math.sqrt(SJ.player.vx * SJ.player.vx + SJ.player.vy * SJ.player.vy) > 8) {
      SJ.player.eyeState = 'squint';
    } else {
      SJ.player.eyeState = 'normal';
    }

    // Rhythm bonus: reward key presses near beat
    var anyKey = SJ.keys && (SJ.keys.up || SJ.keys.down || SJ.keys.left || SJ.keys.right);
    if (SJ.onBeatWindow && anyKey) {
      var cooldown = (SJ.beatInterval || 600) * 0.8;
      if (!SJ._lastRhythmBonusFrame || SJ.elapsed - SJ._lastRhythmBonusFrame > cooldown) {
        SJ._lastRhythmBonusFrame = SJ.elapsed;
        if (SJ.onBeatPerfect) {
          SJ.score              += 75 * SJ.combo;
          SJ.rhythmBonusText     = 'PERFECT!';
          SJ.rhythmBonusTimer    = 700;
        } else {
          SJ.score              += 25 * SJ.combo;
          SJ.rhythmBonusText     = 'GOOD';
          SJ.rhythmBonusTimer    = 500;
        }
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.checkNearMiss(obstacle, distToEdge)
  // ─────────────────────────────────────────────────────────────
  SJ.checkNearMiss = function (obstacle, distToEdge) {
    var now = Date.now();
    if (now - SJ.lastNearMissTime < 300) return; // debounce 300ms
    SJ.lastNearMissTime = now;
    SJ.combo++;
    if (SJ.combo > SJ.maxCombo) SJ.maxCombo = SJ.combo;
    SJ.score += 50 * SJ.combo;
    if (SJ.playSound)         SJ.playSound('fwip');
    if (SJ.triggerScreenShake) SJ.triggerScreenShake(3, 80);
  };

  // ─────────────────────────────────────────────────────────────
  // Reset game-over flag on each new game start
  // Hook into SJ.startGame by watching gameState transitions.
  // We piggyback on the existing gameState change — when
  // gameState goes to 'cinematic' the boarding pass hides.
  // ─────────────────────────────────────────────────────────────
  var _lastGameState = '';
  var _origGameLoop  = null;

  // Patch: reset _gameOverShowing flag when game restarts
  // We do this by watching renderGameOver being called and
  // resetting on a gameState change away from 'dead'.
  (function () {
    var _checkInterval = setInterval(function () {
      if (typeof SJ.gameState !== 'undefined') {
        if (SJ.gameState !== _lastGameState) {
          if (_lastGameState === 'dead' && SJ.gameState !== 'dead') {
            SJ._gameOverShowing = false;
            SJ._gameOverTimer   = 0;
          }
          _lastGameState = SJ.gameState;
        }
      }
    }, 50);
  })();

})();
