/**
 * Spike Jumper — engine.js
 * Agent 1 of 3: Core engine, canvas setup, player physics & rendering,
 * game loop, cinematic intro, death sequence, input handling.
 *
 * Initializes window.SJ global namespace. All other modules extend SJ.
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // GLOBAL NAMESPACE
  // ─────────────────────────────────────────────────────────────
  window.SJ = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    // Kept for zones.js compatibility
    focalLength: 400,
    vanishX: 0,
    vanishY: 0,
    // 2D bounds
    floorY: 0,
    ceilY:  0,

    gameState: 'start', // 'start'|'cinematic'|'playing'|'transitioning'|'dead'
    lastTime: 0,
    dt: 0,
    elapsed: 0,
    cinematicTimer: 0,

    // 2D gravity physics
    gravity:      1800,   // px/s²
    jumpVelocity: -700,   // px/s upward on tap
    scrollSpeed:  220,    // px/s obstacle / background scroll
    _floorSpikeOffset: 0,

    player: {
      x: 0, y: 0,
      vx: 0, vy: 0,        // vy driven by gravity; vx unused in 2D
      alive: true,
      deathPhase: 0,        // 0=alive 1=freeze 2=crumple 3=confetti 4=gameover
      deathTimer: 0,
      wearLevel: 0,         // 0-1
      contrails: [],
      comboGlow: 0,
      eyeState: 'normal',   // 'normal'|'fear'|'squint'|'dizzy'
      // kept for module compatibility
      targetX: 0, targetY: 0,
      tiltAngle: 0, pitchAngle: 0,
      scale: 1, wingSpread: 1,
      eyeOffsetX: 0, eyeOffsetY: 0,
    },

    keys: {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
    },

    zones: [],
    currentZoneIdx: 0,
    cycleCount: 0,
    zoneTimer: 0,
    zoneDuration: 35000,
    transitioning: false,
    transitionTimer: 0,
    transitionDuration: 2000,
    nowPlayingText: '',
    nowPlayingTimer: 0,
    titleCardText: '',
    titleCardTimer: 0,
    prevZoneIdx: -1,
    transitionAlpha: 0,

    obstacles: [],
    obstaclePool: [],
    particles: [],
    particlePool: [],

    audioCtx: null,
    masterGain: null,
    songBuffers: {},
    currentSongSource: null,
    currentSongGain: null,
    beatInterval: 600,
    lastBeatTime: 0,
    nextBeatTime: 0,
    songStartTime: 0,
    currentBeat: 0,
    beatProgress: 0,
    onBeatWindow: false,
    onBeatPerfect: false,

    score: 0,
    distance: 0,
    combo: 1,
    maxCombo: 1,
    lastNearMissTime: 0,
    rhythmBonusText: '',
    rhythmBonusTimer: 0,

    shakeIntensity: 0,
    shakeDuration: 0,
    shakeTime: 0,

    bestScore: 0,
    bestDistance: 0,
    bestZone: 0,
    bestCombo: 1,

    speed: 5,
    baseSpeed: 5,

    patternChunkIdx: 0,
    timeSinceLastChunk: 0,
    chunkDuration: 10000,
  };

  // ─────────────────────────────────────────────────────────────
  // CANVAS SETUP
  // ─────────────────────────────────────────────────────────────
  function setupCanvas() {
    SJ.canvas = document.getElementById('gameCanvas');
    SJ.ctx = SJ.canvas.getContext('2d');

    function resize() {
      SJ.canvas.width = window.innerWidth;
      SJ.canvas.height = window.innerHeight;
      SJ.width = SJ.canvas.width;
      SJ.height = SJ.canvas.height;
      SJ.vanishX = SJ.width / 2;
      SJ.vanishY = SJ.height * 0.38;
      // 2D floor/ceiling
      SJ.floorY = SJ.height - 70;
      SJ.ceilY  = 60;
      // Player: fixed X on left, start mid-height
      SJ.player.x = SJ.width * 0.22;
      SJ.player.y = SJ.height * 0.5;
    }

    window.addEventListener('resize', resize);
    resize();
  }

  // ─────────────────────────────────────────────────────────────
  // JUMP INPUT (tap once = jump; no held movement)
  // ─────────────────────────────────────────────────────────────
  function doJump() {
    if (SJ.gameState === 'playing' && SJ.player.alive) {
      SJ.player.vy = SJ.jumpVelocity;
      if (SJ.playSound) SJ.playSound('whoosh');
    } else if (SJ.gameState === 'start') {
      if (SJ.playSound) SJ.playSound('ui_click');
      SJ.startGame();
    } else if (SJ.gameState === 'dead' && SJ.player.deathPhase === 4) {
      if (SJ.playSound) SJ.playSound('ui_click');
      SJ.startGame();
    }
  }

  function setupInput() {
    var _keyWasUp = true; // prevent held-key spamming

    window.addEventListener('keydown', function (e) {
      switch (e.code) {
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          if (_keyWasUp) { doJump(); _keyWasUp = false; }
          SJ.keys.space = true;
          break;
        case 'ArrowDown': case 'KeyS':
          SJ.keys.down = true; break;
        case 'ArrowLeft': case 'KeyA':
          SJ.keys.left = true; break;
        case 'ArrowRight': case 'KeyD':
          SJ.keys.right = true; break;
      }
    });

    window.addEventListener('keyup', function (e) {
      switch (e.code) {
        case 'Space': case 'ArrowUp': case 'KeyW':
          SJ.keys.space = false; _keyWasUp = true; break;
        case 'ArrowDown': case 'KeyS':
          SJ.keys.down = false; break;
        case 'ArrowLeft': case 'KeyA':
          SJ.keys.left = false; break;
        case 'ArrowRight': case 'KeyD':
          SJ.keys.right = false; break;
      }
    });

    // Click / tap
    SJ.canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      doJump();
    });
  }

  // project3D kept as stub for any legacy calls
  SJ.project3D = function (worldX, worldY, z) {
    const scale = SJ.focalLength / Math.max(z, 0.1);
    return { x: worldX * scale + SJ.vanishX, y: worldY * scale + SJ.vanishY, scale: scale };
  };

  // ─────────────────────────────────────────────────────────────
  // SCREEN SHAKE
  // ─────────────────────────────────────────────────────────────
  SJ.triggerScreenShake = function (intensity, durationMs) {
    SJ.shakeIntensity = intensity;
    SJ.shakeTime = durationMs;
  };

  // ─────────────────────────────────────────────────────────────
  // PLAYER PHYSICS — gravity + single-tap jump
  // ─────────────────────────────────────────────────────────────
  SJ.updatePlayer = function (dt) {
    const p = SJ.player;
    const dtSec = dt / 1000;

    // Gravity pulls down
    p.vy += SJ.gravity * dtSec;
    if (p.vy > 920) p.vy = 920; // terminal velocity

    // Move vertically
    p.y += p.vy * dtSec;

    // Scale scroll speed with distance/cycles
    SJ.speed = SJ.baseSpeed * (1 + SJ.distance / 8000 + SJ.cycleCount * 0.15);
    SJ.speed = Math.min(SJ.speed, 25);
    SJ.scrollSpeed = 220 + (SJ.speed - 5) * 14;
    SJ.scrollSpeed = Math.min(SJ.scrollSpeed, 500);

    // Wear
    p.wearLevel = Math.min(1, SJ.distance / 5000);

    // Eye state
    if (p.vy < -260) {
      p.eyeState = 'squint';
    } else if (p.vy > 460) {
      p.eyeState = 'fear';
    } else {
      p.eyeState = 'normal';
    }

    // Combo glow
    const targetGlow = SJ.combo > 1 ? Math.min(1, (SJ.combo - 1) * 0.2) : 0;
    p.comboGlow += (targetGlow - p.comboGlow) * 0.05;

    // Contrails — short horizontal streaks trailing behind
    p.contrails.unshift({ x: p.x - 30, y: p.y + 2, age: 0, maxAge: 18, alpha: 0.5 });
    if (p.contrails.length > 22) p.contrails.pop();
    p.contrails.forEach(function (t) {
      t.age++;
      t.x -= SJ.scrollSpeed * dtSec * 0.35;
      t.alpha = (1 - t.age / t.maxAge) * 0.42;
    });

    // Floor / ceiling = instant death
    if (p.y > SJ.floorY - 4 || p.y < SJ.ceilY + 4) {
      if (SJ.triggerDeath) SJ.triggerDeath();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PLAYER RENDERING — side-view paper airplane (→)
  // ─────────────────────────────────────────────────────────────
  SJ.renderPlayer = function () {
    const ctx = SJ.ctx;
    const p = SJ.player;

    if (p.deathPhase >= 3) return;

    // Contrails — leftward fading streaks
    for (let i = p.contrails.length - 1; i >= 0; i--) {
      const t = p.contrails[i];
      if (t.alpha <= 0.02) continue;
      const len = Math.max(2, (1 - t.age / t.maxAge) * 26);
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y);
      ctx.lineTo(t.x - len, t.y);
      ctx.strokeStyle = '#cce8ff';
      ctx.lineWidth = Math.max(0.5, (1 - t.age / t.maxAge) * 2.8);
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(p.x, p.y);

    // Tilt: nose pitches up when rising, down when falling
    const tilt = Math.atan2(p.vy, 650) * 0.85;
    ctx.rotate(tilt);

    // Death crumple
    if (p.deathPhase === 2) {
      const crumple = Math.min(1, p.deathTimer / 600);
      ctx.scale(1 - crumple * 0.5, 1 - crumple * 0.5);
      ctx.rotate(crumple * Math.PI * 2.5);
    }

    const sz = 26;

    // Combo glow
    if (p.comboGlow > 0.05) {
      ctx.save();
      ctx.globalAlpha = p.comboGlow * 0.35;
      ctx.shadowBlur = 26;
      ctx.shadowColor = '#ffaa00';
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.ellipse(0, 0, sz * 2.1, sz * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Side-view paper airplane (nose → right) ──

    // Upper wing (main triangular surface)
    const wingGrad = ctx.createLinearGradient(-sz * 1.1, -sz * 0.82, sz * 0.1, sz * 0.1);
    wingGrad.addColorStop(0, '#d0d0d0');
    wingGrad.addColorStop(0.55, '#f6f6f6');
    wingGrad.addColorStop(1, '#dcdcdc');

    ctx.beginPath();
    ctx.moveTo(-sz * 1.1, sz * 0.05);   // tail end
    ctx.lineTo(sz * 1.05, sz * 0.1);    // nose tip
    ctx.lineTo(-sz * 0.2, -sz * 0.82);  // upper wing peak
    ctx.closePath();
    ctx.fillStyle = wingGrad;
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 0.7;
    ctx.fill();
    ctx.stroke();

    // Wing fold highlight
    ctx.beginPath();
    ctx.moveTo(-sz * 1.1, sz * 0.05);
    ctx.lineTo(-sz * 0.2, -sz * 0.82);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lower belly
    const bellyGrad = ctx.createLinearGradient(0, 0, 0, sz * 0.58);
    bellyGrad.addColorStop(0, '#e6e6e6');
    bellyGrad.addColorStop(1, '#c8c8c8');

    ctx.beginPath();
    ctx.moveTo(-sz * 1.1, sz * 0.05);
    ctx.lineTo(sz * 1.05, sz * 0.1);
    ctx.lineTo(-sz * 0.45, sz * 0.58);
    ctx.closePath();
    ctx.fillStyle = bellyGrad;
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 0.5;
    ctx.fill();
    ctx.stroke();

    // Center fold crease
    ctx.beginPath();
    ctx.moveTo(-sz * 1.1, sz * 0.05);
    ctx.lineTo(sz * 1.05, sz * 0.1);
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Tail fin
    ctx.beginPath();
    ctx.moveTo(-sz * 1.1, sz * 0.05);
    ctx.lineTo(-sz * 1.42, -sz * 0.42);
    ctx.lineTo(-sz * 0.72, sz * 0.05);
    ctx.closePath();
    ctx.fillStyle = '#e2e2e2';
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 0.5;
    ctx.fill();
    ctx.stroke();

    // Wear creases
    if (p.wearLevel > 0.3) {
      ctx.globalAlpha = (p.wearLevel - 0.3) * 0.8;
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.6, -sz * 0.32);
      ctx.lineTo(-sz * 0.1, sz * 0.05);
      ctx.stroke();
      if (p.wearLevel > 0.6) {
        ctx.globalAlpha = (p.wearLevel - 0.6) * 0.7;
        ctx.beginPath();
        ctx.moveTo(sz * 0.3, sz * 0.08);
        ctx.lineTo(sz * 0.62, -sz * 0.28);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Eye — near the nose
    const eyeX = sz * 0.52;
    const eyeY = sz * 0.07;
    const eyeR  = sz * 0.112;

    if (p.eyeState === 'dizzy' || p.deathPhase === 2) {
      // X eyes
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(eyeX - eyeR * 0.6, eyeY - eyeR * 0.6);
      ctx.lineTo(eyeX + eyeR * 0.6, eyeY + eyeR * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(eyeX + eyeR * 0.6, eyeY - eyeR * 0.6);
      ctx.lineTo(eyeX - eyeR * 0.6, eyeY + eyeR * 0.6);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 0.6;
      ctx.stroke();

      const pOX = p.eyeState === 'fear' ? -eyeR * 0.1 : eyeR * 0.32;
      const pOY = p.vy > 320 ? eyeR * 0.28 : (p.vy < -240 ? -eyeR * 0.22 : 0);
      ctx.beginPath();
      ctx.arc(eyeX + pOX, eyeY + pOY, eyeR * 0.57, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      // shine
      ctx.beginPath();
      ctx.arc(eyeX + pOX - eyeR * 0.2, eyeY + pOY - eyeR * 0.2, eyeR * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      if (p.eyeState === 'fear') {
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeR * 1.3, 0, Math.PI * 2);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // ─────────────────────────────────────────────────────────────
  // FLOOR & CEILING — scrolling spike borders
  // ─────────────────────────────────────────────────────────────
  SJ.renderFloorAndCeiling = function () {
    const ctx     = SJ.ctx;
    const w       = SJ.width;
    const floorY  = SJ.floorY;
    const ceilY   = SJ.ceilY;
    const zone    = SJ.zones[SJ.currentZoneIdx] || {};
    const accent  = (zone.accentColors && zone.accentColors[0]) || '#cc2200';

    // Advance spike scroll
    SJ._floorSpikeOffset = ((SJ._floorSpikeOffset || 0) + SJ.scrollSpeed / 60) % 40;

    const spikeW = 40;
    const spikeH = 20;
    const count  = Math.ceil(w / spikeW) + 2;

    // ── Floor ──
    ctx.fillStyle = '#131313';
    ctx.fillRect(0, floorY, w, SJ.height - floorY);

    ctx.fillStyle = accent;
    ctx.shadowBlur  = 7;
    ctx.shadowColor = accent;
    for (let i = 0; i < count; i++) {
      const sx = (i * spikeW - SJ._floorSpikeOffset % spikeW + spikeW) % (w + spikeW) - spikeW;
      ctx.beginPath();
      ctx.moveTo(sx,              floorY);
      ctx.lineTo(sx + spikeW / 2, floorY - spikeH);
      ctx.lineTo(sx + spikeW,     floorY);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // ── Ceiling ──
    ctx.fillStyle = '#131313';
    ctx.fillRect(0, 0, w, ceilY);

    ctx.fillStyle = accent;
    ctx.shadowBlur  = 7;
    ctx.shadowColor = accent;
    for (let i = 0; i < count; i++) {
      const sx = (i * spikeW - SJ._floorSpikeOffset % spikeW + spikeW) % (w + spikeW) - spikeW;
      ctx.beginPath();
      ctx.moveTo(sx,              ceilY);
      ctx.lineTo(sx + spikeW / 2, ceilY + spikeH);
      ctx.lineTo(sx + spikeW,     ceilY);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  };

  // ─────────────────────────────────────────────────────────────
  // DEATH SEQUENCE
  // ─────────────────────────────────────────────────────────────
  SJ.triggerDeath = function () {
    if (!SJ.player.alive) return;
    SJ.player.alive = false;
    SJ.player.deathPhase = 1; // freeze
    SJ.player.deathTimer = 0;
    SJ.player.eyeState = 'dizzy';
    SJ.gameState = 'dead';
    SJ.triggerScreenShake(12, 400);
    if (SJ.playSound) SJ.playSound('crumple');
    if (SJ.stopAllAudio) SJ.stopAllAudio();
    if (SJ.saveHighScore) SJ.saveHighScore();
  };

  function updateDeathAnimation(dt) {
    const p = SJ.player;
    p.deathTimer += dt;

    if (p.deathPhase === 1 && p.deathTimer > 300) {
      // Freeze → crumple
      p.deathPhase = 2;
      p.deathTimer = 0;
    } else if (p.deathPhase === 2 && p.deathTimer > 600) {
      // Crumple → confetti burst
      p.deathPhase = 3;
      p.deathTimer = 0;
      if (SJ.spawnDeathConfetti) SJ.spawnDeathConfetti(p.x, p.y);
    } else if (p.deathPhase === 3 && p.deathTimer > 1000) {
      // Confetti → game over screen
      p.deathPhase = 4;
      p.deathTimer = 0;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // START GAME
  // ─────────────────────────────────────────────────────────────
  SJ.startGame = function () {
    SJ.gameState = 'cinematic';
    SJ.cinematicTimer = 0;

    // Reset all state
    SJ.score = 0;
    SJ.distance = 0;
    SJ.combo = 1;
    SJ.maxCombo = 1;
    SJ.currentZoneIdx = 0;
    SJ.cycleCount = 0;
    SJ.zoneTimer = 0;
    SJ.baseSpeed = 5;
    SJ.speed = SJ.baseSpeed;
    SJ.elapsed = 0;
    SJ.patternChunkIdx = 0;
    SJ.timeSinceLastChunk = 0;
    SJ.transitioning = false;
    SJ.lastNearMissTime = 0;
    SJ.nowPlayingText = '';
    SJ.nowPlayingTimer = 0;
    SJ.titleCardText = '';
    SJ.titleCardTimer = 0;
    SJ.prevZoneIdx = -1;
    SJ.transitionAlpha = 0;
    SJ.rhythmBonusText = '';
    SJ.rhythmBonusTimer = 0;

    SJ.scrollSpeed = 220;
    SJ._floorSpikeOffset = 0;
    SJ.obstacles = [];
    SJ.particles = [];

    const p = SJ.player;
    p.x = SJ.width * 0.22;
    p.y = SJ.height * 0.5;
    p.vy = 0;
    p.vx = 0;
    p.tiltAngle = 0;
    p.scale = 1;
    p.wingSpread = 1;
    p.alive = true;
    p.deathPhase = 0;
    p.deathTimer = 0;
    p.wearLevel = 0;
    p.contrails = [];
    p.comboGlow = 0;
    p.eyeState = 'normal';
    p.eyeOffsetX = 0;
    p.eyeOffsetY = 0;

    if (SJ.clearObstacles) SJ.clearObstacles();
    if (SJ.playSong) SJ.playSong(0);
  };

  // ─────────────────────────────────────────────────────────────
  // CINEMATIC INTRO
  // ─────────────────────────────────────────────────────────────

  // Cinematic state for the paper airplane arc animation
  var _cine = {
    planeX: 0, planeY: 0,
    launched: false,
    handPulse: 0,
  };

  function updateCinematic(dt) {
    _cine.handPulse += dt * 0.003;
  }

  function renderCinematic(elapsed) {
    const ctx = SJ.ctx;
    const W = SJ.width;
    const H = SJ.height;
    const t = elapsed / 3000; // 0 → 1 over 3 seconds

    // ── Background: warm classroom ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#2a1f12');
    bgGrad.addColorStop(1, '#3d2b14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // ── Floor line ──
    ctx.beginPath();
    ctx.moveTo(0, H * 0.82);
    ctx.lineTo(W, H * 0.82);
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth = 3;
    ctx.stroke();

    // ── Chalkboard ──
    const cbX = W * 0.1;
    const cbY = H * 0.05;
    const cbW = W * 0.6;
    const cbH = H * 0.45;

    ctx.fillStyle = '#1a3a2a';
    ctx.fillRect(cbX, cbY, cbW, cbH);
    ctx.strokeStyle = '#5a4028';
    ctx.lineWidth = 10;
    ctx.strokeRect(cbX, cbY, cbW, cbH);

    // Chalkboard inner frame
    ctx.strokeStyle = '#3a5040';
    ctx.lineWidth = 2;
    ctx.strokeRect(cbX + 8, cbY + 8, cbW - 16, cbH - 16);

    // Chalk writing on board (faint)
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#c8d8c0';
    ctx.font = `bold ${Math.round(H * 0.035)}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('AERODYNAMICS 101', cbX + cbW / 2, cbY + cbH * 0.28);
    ctx.font = `${Math.round(H * 0.022)}px 'Share Tech Mono', monospace`;
    ctx.fillText('Lift = ½ ρ v² C_L A', cbX + cbW / 2, cbY + cbH * 0.52);
    ctx.fillText('Drag = ½ ρ v² C_D A', cbX + cbW / 2, cbY + cbH * 0.68);
    ctx.restore();

    // Chalk ledge
    ctx.fillStyle = '#5a4028';
    ctx.fillRect(cbX, cbY + cbH, cbW, H * 0.025);

    // ── Desks (perspective rows) ──
    drawDesks(ctx, W, H);

    // ── Window on the left wall ──
    drawWindow(ctx, W, H, t);

    // ── Teacher's hand holding / throwing the airplane ──
    drawHand(ctx, W, H, t);

    // ── Flying paper airplane ──
    drawCinematicPlane(ctx, W, H, t);

    // ── Fade overlay ──
    // Fade in from black at start
    if (elapsed < 400) {
      ctx.fillStyle = 'rgba(0,0,0,' + (1 - elapsed / 400) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    // Fade out to black at end
    if (elapsed > 2400) {
      const fadeOut = (elapsed - 2400) / 600;
      ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, fadeOut) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    // ── "GET READY" text ──
    if (elapsed > 1000 && elapsed < 2400) {
      const alpha = Math.min(1, (elapsed - 1000) / 300);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffe04a';
      ctx.font = `bold ${Math.round(H * 0.06)}px 'Oswald', sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff8800';
      ctx.fillText('GET READY', W / 2, H * 0.88);
      ctx.restore();
    }
  }

  function drawDesks(ctx, W, H) {
    // 2 rows of desks with perspective
    const rows = [
      { y: H * 0.72, count: 4, scaleY: 1.0 },
      { y: H * 0.60, count: 3, scaleY: 0.72 },
    ];

    rows.forEach(function (row) {
      const spacing = W * 0.22;
      const startX = W * 0.1;
      for (let i = 0; i < row.count; i++) {
        const dx = startX + i * spacing;
        const dy = row.y;
        const dw = spacing * 0.7 * row.scaleY;
        const dh = H * 0.07 * row.scaleY;

        // Desk top
        ctx.fillStyle = '#6b4c2a';
        ctx.fillRect(dx, dy, dw, dh * 0.4);
        // Desk front face
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(dx, dy + dh * 0.4, dw, dh * 0.6);
        // Desk legs
        ctx.fillStyle = '#3a2510';
        ctx.fillRect(dx + dw * 0.1, dy + dh, dw * 0.08, H * 0.06 * row.scaleY);
        ctx.fillRect(dx + dw * 0.82, dy + dh, dw * 0.08, H * 0.06 * row.scaleY);
      }
    });
  }

  function drawWindow(ctx, W, H, t) {
    // Window on left side of room, where the plane will fly out
    const wx = W * 0.04;
    const wy = H * 0.12;
    const ww = W * 0.06;
    const wh = H * 0.32;

    // Outside glow (sky)
    const skyGrad = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
    skyGrad.addColorStop(0, '#4488cc');
    skyGrad.addColorStop(1, '#88bbee');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(wx, wy, ww, wh);

    // Window frame
    ctx.strokeStyle = '#5a4028';
    ctx.lineWidth = 6;
    ctx.strokeRect(wx, wy, ww, wh);

    // Crossbar
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.strokeStyle = '#5a4028';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Glow effect near window when plane approaches
    if (t > 0.55) {
      const glow = (t - 0.55) / 0.45;
      ctx.save();
      ctx.globalAlpha = glow * 0.4;
      const glowGrad = ctx.createRadialGradient(
        wx + ww / 2, wy + wh / 2, 0,
        wx + ww / 2, wy + wh / 2, W * 0.15
      );
      glowGrad.addColorStop(0, '#88ccff');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  function drawHand(ctx, W, H, t) {
    // Hand on right side, holding/throwing the airplane
    // Hand retreats after throwing (t > 0.2)
    const handX = W * 0.78;
    const handY = H * 0.45;
    const throwProgress = Math.max(0, Math.min(1, (t - 0.0) / 0.25));
    const retreatProgress = Math.max(0, Math.min(1, (t - 0.25) / 0.2));

    const offsetX = throwProgress * (-W * 0.1) + retreatProgress * (W * 0.18);
    const offsetY = throwProgress * (-H * 0.08) + retreatProgress * (H * 0.06);

    ctx.save();
    ctx.translate(handX + offsetX, handY + offsetY);
    ctx.rotate(-0.4 + throwProgress * (-0.3) + retreatProgress * 0.5);

    // Palm
    ctx.fillStyle = '#c68642';
    ctx.beginPath();
    ctx.ellipse(0, 0, W * 0.04, H * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thumb
    ctx.beginPath();
    ctx.ellipse(-W * 0.032, -H * 0.02, W * 0.012, H * 0.03, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Fingers (4 stubs)
    for (let i = 0; i < 4; i++) {
      const fx = (-W * 0.018) + i * (W * 0.014);
      ctx.beginPath();
      ctx.ellipse(fx, -H * 0.055, W * 0.009, H * 0.025, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawCinematicPlane(ctx, W, H, t) {
    // Animate plane arcing from right side to left (out the window)
    // Phase 1 (t 0→0.2): plane held in hand, slight wobble
    // Phase 2 (t 0.2→0.85): arc flight across screen
    // Phase 3 (t 0.85→1): exits through window

    let px, py, angle, planeScale, alpha;

    if (t < 0.2) {
      // Held position
      px = W * 0.72;
      py = H * 0.42;
      angle = -0.5;
      planeScale = 1.0;
      alpha = 1;
    } else if (t < 0.85) {
      // Arc flight: easeOut cubic
      const ft = (t - 0.2) / 0.65;
      const ease = 1 - Math.pow(1 - ft, 3);
      px = W * 0.72 - ease * (W * 0.72 - W * 0.10);
      // Arc: dip then rise
      const arcY = H * 0.42 + Math.sin(ft * Math.PI) * (-H * 0.18);
      py = H * 0.42 + (H * 0.25 - H * 0.42) * ease + (arcY - H * 0.42) * (1 - ease);
      py = H * 0.42 * (1 - ease) + H * 0.25 * ease - Math.sin(ft * Math.PI) * H * 0.15;
      angle = -0.5 - ft * 0.4;
      planeScale = 1.0 - ft * 0.2;
      alpha = 1;
    } else {
      // Exits window
      const ft = (t - 0.85) / 0.15;
      px = W * 0.10 - ft * W * 0.12;
      py = H * 0.25 - ft * H * 0.05;
      angle = -0.9;
      planeScale = 1.0 - ft * 0.5;
      alpha = 1 - ft;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.scale(planeScale, planeScale);

    // Simple side-view paper airplane for cinematic
    const sz = Math.round(Math.min(W, H) * 0.04);

    // Body
    ctx.beginPath();
    ctx.moveTo(-sz * 1.2, 0);        // tail
    ctx.lineTo(sz * 1.5, -sz * 0.1); // nose
    ctx.lineTo(sz * 1.5, sz * 0.1);
    ctx.closePath();
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top wing
    ctx.beginPath();
    ctx.moveTo(-sz * 0.5, -sz * 0.05);
    ctx.lineTo(sz * 0.8, -sz * 0.1);
    ctx.lineTo(-sz * 0.5, -sz * 0.9);
    ctx.closePath();
    ctx.fillStyle = '#e8e8e8';
    ctx.fill();
    ctx.stroke();

    // Tail fin
    ctx.beginPath();
    ctx.moveTo(-sz * 0.8, 0);
    ctx.lineTo(-sz * 1.2, -sz * 0.5);
    ctx.lineTo(-sz * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle = '#e0e0e0';
    ctx.fill();

    // Paper line details
    ctx.beginPath();
    ctx.moveTo(-sz * 0.8, 0);
    ctx.lineTo(sz * 1.3, 0);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();

    // Motion trail
    if (t > 0.2 && t < 0.9) {
      const trailCount = 6;
      for (let i = 1; i <= trailCount; i++) {
        const trailT = t - i * 0.018;
        if (trailT < 0.2) continue;
        const ft2 = (trailT - 0.2) / 0.65;
        const ease2 = 1 - Math.pow(1 - Math.min(1, ft2), 3);
        const tx = W * 0.72 - ease2 * (W * 0.72 - W * 0.10);
        const ty = H * 0.42 * (1 - ease2) + H * 0.25 * ease2 - Math.sin(ft2 * Math.PI) * H * 0.15;
        const ta = (1 - i / trailCount) * 0.3;
        ctx.save();
        ctx.globalAlpha = ta;
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN GAME LOOP
  // ─────────────────────────────────────────────────────────────
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - (SJ.lastTime || timestamp)), 50);
    SJ.lastTime = timestamp;
    SJ.dt = dt;

    const ctx = SJ.ctx;

    // Screen shake transform
    ctx.save();
    if (SJ.shakeIntensity > 0 && SJ.shakeTime > 0) {
      ctx.translate(
        (Math.random() - 0.5) * SJ.shakeIntensity * 2,
        (Math.random() - 0.5) * SJ.shakeIntensity * 2
      );
      SJ.shakeTime -= dt;
      if (SJ.shakeTime <= 0) {
        SJ.shakeIntensity = 0;
        SJ.shakeTime = 0;
      }
    }

    // Clear canvas
    ctx.clearRect(-100, -100, SJ.width + 200, SJ.height + 200);

    // ── State dispatch ──
    if (SJ.gameState === 'start') {
      if (SJ.renderStartScreen) SJ.renderStartScreen();

    } else if (SJ.gameState === 'cinematic') {
      SJ.cinematicTimer += dt;
      updateCinematic(dt);
      renderCinematic(SJ.cinematicTimer);

      if (SJ.cinematicTimer > 3000) {
        SJ.gameState = 'playing';
        SJ.nowPlayingText = SJ.zones[0] ? SJ.zones[0].displayTitle : 'No Role Modelz \u2014 J. Cole';
        SJ.nowPlayingTimer = 5500;
        // stagger first obstacle so player has a moment to react
        if (SJ._spawnTimer !== undefined) SJ._spawnTimer = -1200;
      }

    } else if (SJ.gameState === 'playing' || SJ.gameState === 'transitioning') {
      SJ.elapsed += dt;

      if (SJ.renderBackground) SJ.renderBackground();
      SJ.renderFloorAndCeiling();
      if (SJ.renderObstacles) SJ.renderObstacles();
      if (SJ.updateParticles) SJ.updateParticles(dt);
      if (SJ.renderParticles) SJ.renderParticles();
      SJ.renderPlayer();

      if (SJ.gameState === 'playing') {
        SJ.updatePlayer(dt);
        if (SJ.updateObstacles) SJ.updateObstacles(dt);
        if (SJ.updateZone) SJ.updateZone(dt);
        if (SJ.updateScoring) SJ.updateScoring(dt);
        if (SJ.checkCollisions) SJ.checkCollisions();
        if (SJ.updateBeat) SJ.updateBeat();
      } else {
        if (SJ.updateTransition) SJ.updateTransition(dt);
      }

      if (SJ.renderHUD) SJ.renderHUD();
      if (SJ.renderNowPlaying) SJ.renderNowPlaying();
      if (SJ.renderTitleCard) SJ.renderTitleCard();

    } else if (SJ.gameState === 'dead') {
      if (SJ.renderBackground) SJ.renderBackground();
      SJ.renderFloorAndCeiling();
      if (SJ.updateParticles) SJ.updateParticles(dt);
      if (SJ.renderParticles) SJ.renderParticles();
      updateDeathAnimation(dt);
      SJ.renderPlayer();
      if (SJ.player.deathPhase >= 4) {
        if (SJ.renderGameOver) SJ.renderGameOver();
      }
    }

    ctx.restore();
    requestAnimationFrame(gameLoop);
  }

  // ─────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────
  SJ.init = function () {
    setupCanvas();
    setupInput();

    if (SJ.initZones) SJ.initZones();
    if (SJ.initObstacles) SJ.initObstacles();
    if (SJ.initAudio) SJ.initAudio();
    if (SJ.initUI) SJ.initUI();
    if (SJ.loadHighScore) SJ.loadHighScore();

    if (SJ.loadSongs) {
      SJ.loadSongs().then(function () {
        document.getElementById('loading').classList.add('hidden');
      }).catch(function () {
        document.getElementById('loading').classList.add('hidden');
      });
    } else {
      document.getElementById('loading').classList.add('hidden');
    }

    requestAnimationFrame(gameLoop);
  };

})();
