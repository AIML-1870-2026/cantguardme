/**
 * Spike Jumper — engine.js (3rd-Person Perspective)
 * Core engine: canvas setup, 3D-perspective player physics & rendering,
 * game loop, cinematic intro, death sequence, input handling.
 *
 * Controls (one-click only — holding does nothing):
 *   W / ArrowUp / Space  = nose-up impulse (same as classic)
 *   A / ArrowLeft        = barrel roll left  (horizontal impulse)
 *   D / ArrowRight       = barrel roll right (horizontal impulse)
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

    // Vanishing point & boundary
    vanishX: 0,
    vanishY: 0,
    leftWallX: 0,
    rightWallX: 0,
    floorY: 0,
    ceilY:  0,

    // kept for zones.js compat
    focalLength: 400,

    gameState: 'start',
    lastTime: 0,
    dt: 0,
    elapsed: 0,
    cinematicTimer: 0,

    // Physics
    gravity:        1600,   // px/s²
    jumpVelocity:   -650,   // px/s upward on tap
    barrelImpulse:  520,    // px/s per barrel roll press
    scrollSpeed:    220,    // obstacle approach speed (px-depth/s)
    _floorSpikeOffset: 0,

    player: {
      x: 0, y: 0,
      vx: 0, vy: 0,
      rollAngle: 0,         // visual banking from vx
      alive: true,
      deathPhase: 0,
      deathTimer: 0,
      wearLevel: 0,
      contrails: [],
      comboGlow: 0,
      eyeState: 'normal',
      targetX: 0, targetY: 0,
      tiltAngle: 0, pitchAngle: 0,
      scale: 1, wingSpread: 1,
      eyeOffsetX: 0, eyeOffsetY: 0,
    },

    keys: {
      up: false, down: false, left: false, right: false, space: false,
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
      SJ.canvas.width  = window.innerWidth;
      SJ.canvas.height = window.innerHeight;
      SJ.width  = SJ.canvas.width;
      SJ.height = SJ.canvas.height;

      SJ.vanishX = SJ.width  / 2;
      SJ.vanishY = SJ.height * 0.38;

      SJ.leftWallX  = 0;
      SJ.rightWallX = SJ.width;
      SJ.floorY     = SJ.height - 60;
      SJ.ceilY      = 55;

      // Player fixed start
      SJ.player.x = SJ.width  * 0.5;
      SJ.player.y = SJ.height * 0.62;
    }

    window.addEventListener('resize', resize);
    resize();
  }

  // ─────────────────────────────────────────────────────────────
  // INPUT — three independent one-click trackers
  // ─────────────────────────────────────────────────────────────
  function doJump() {
    var p = SJ.player;
    if (SJ.gameState === 'playing' && p.alive) {
      p.vy = SJ.jumpVelocity;
      if (SJ.playSound) SJ.playSound('whoosh');
    } else if (SJ.gameState === 'start') {
      if (SJ.playSound) SJ.playSound('ui_click');
      SJ.startGame();
    } else if (SJ.gameState === 'dead' && p.deathPhase === 4) {
      if (SJ.playSound) SJ.playSound('ui_click');
      SJ.startGame();
    }
  }

  function doBarrelLeft() {
    var p = SJ.player;
    if (SJ.gameState === 'playing' && p.alive) {
      p.vx -= SJ.barrelImpulse;
      if (SJ.playSound) SJ.playSound('whoosh');
    } else if (SJ.gameState === 'start') {
      if (SJ.playSound) SJ.playSound('ui_click');
      SJ.startGame();
    } else if (SJ.gameState === 'dead' && p.deathPhase === 4) {
      if (SJ.playSound) SJ.playSound('ui_click');
      SJ.startGame();
    }
  }

  function doBarrelRight() {
    var p = SJ.player;
    if (SJ.gameState === 'playing' && p.alive) {
      p.vx += SJ.barrelImpulse;
      if (SJ.playSound) SJ.playSound('whoosh');
    } else if (SJ.gameState === 'start') {
      if (SJ.playSound) SJ.playSound('ui_click');
      SJ.startGame();
    } else if (SJ.gameState === 'dead' && p.deathPhase === 4) {
      if (SJ.playSound) SJ.playSound('ui_click');
      SJ.startGame();
    }
  }

  function setupInput() {
    var _wUp = true, _aUp = true, _dUp = true;

    window.addEventListener('keydown', function (e) {
      switch (e.code) {
        case 'Space': case 'ArrowUp': case 'KeyW':
          e.preventDefault();
          if (_wUp) { doJump(); _wUp = false; }
          SJ.keys.space = true;
          break;
        case 'ArrowLeft': case 'KeyA':
          e.preventDefault();
          if (_aUp) { doBarrelLeft(); _aUp = false; }
          SJ.keys.left = true;
          break;
        case 'ArrowRight': case 'KeyD':
          e.preventDefault();
          if (_dUp) { doBarrelRight(); _dUp = false; }
          SJ.keys.right = true;
          break;
        case 'ArrowDown': case 'KeyS':
          SJ.keys.down = true;
          break;
      }
    });

    window.addEventListener('keyup', function (e) {
      switch (e.code) {
        case 'Space': case 'ArrowUp': case 'KeyW':
          SJ.keys.space = false; _wUp = true; break;
        case 'ArrowLeft': case 'KeyA':
          SJ.keys.left = false; _aUp = true; break;
        case 'ArrowRight': case 'KeyD':
          SJ.keys.right = false; _dUp = true; break;
        case 'ArrowDown': case 'KeyS':
          SJ.keys.down = false; break;
      }
    });

    // Tap = nose-up
    SJ.canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      doJump();
    });
  }

  // project3D stub kept for compatibility
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
  // PLAYER PHYSICS — gravity + jump + horizontal barrel roll
  // ─────────────────────────────────────────────────────────────
  SJ.updatePlayer = function (dt) {
    var p = SJ.player;
    var dtSec = dt / 1000;

    // ── Vertical (gravity + impulse) ──
    p.vy += SJ.gravity * dtSec;
    if (p.vy > 900) p.vy = 900;
    p.y += p.vy * dtSec;

    // ── Horizontal (barrel roll impulse + air damping) ──
    // Damping coefficient: reaches ~2% of original velocity in 0.3s
    var dampFactor = Math.pow(0.015, dtSec);
    p.vx *= dampFactor;
    p.x  += p.vx * dtSec;

    // ── Visual roll angle derived from vx ──
    var maxVx = SJ.barrelImpulse * 1.5;
    var targetRoll = (p.vx / maxVx) * (Math.PI * 0.52);
    p.rollAngle += (targetRoll - p.rollAngle) * Math.min(1, 12 * dtSec);

    // ── Speed scaling ──
    SJ.speed = SJ.baseSpeed * (1 + SJ.distance / 8000 + SJ.cycleCount * 0.15);
    SJ.speed = Math.min(SJ.speed, 25);
    SJ.scrollSpeed = 220 + (SJ.speed - 5) * 14;
    SJ.scrollSpeed = Math.min(SJ.scrollSpeed, 500);

    // ── Wear ──
    p.wearLevel = Math.min(1, SJ.distance / 5000);

    // ── Eye state ──
    if (p.vy < -240) {
      p.eyeState = 'squint';
    } else if (p.vy > 420) {
      p.eyeState = 'fear';
    } else {
      p.eyeState = 'normal';
    }

    // ── Combo glow ──
    var targetGlow = SJ.combo > 1 ? Math.min(1, (SJ.combo - 1) * 0.2) : 0;
    p.comboGlow += (targetGlow - p.comboGlow) * 0.05;

    // ── Contrails — two wingtip trails ──
    var roll = p.rollAngle;
    var wingSpan = 48;
    var leftTipX  = p.x + Math.cos(Math.PI + roll) * wingSpan - Math.sin(roll) * 6;
    var leftTipY  = p.y + Math.sin(Math.PI + roll) * wingSpan * 0.18 + Math.cos(roll) * 6;
    var rightTipX = p.x + Math.cos(roll) * wingSpan + Math.sin(roll) * 6;
    var rightTipY = p.y + Math.sin(roll) * wingSpan * 0.18 - Math.cos(roll) * 6;

    p.contrails.unshift({
      lx: leftTipX,  ly: leftTipY,
      rx: rightTipX, ry: rightTipY,
      age: 0, maxAge: 22, alpha: 0.55,
    });
    if (p.contrails.length > 26) p.contrails.pop();
    p.contrails.forEach(function (t) {
      t.age++;
      t.alpha = (1 - t.age / t.maxAge) * 0.45;
    });

    // ── Boundary death ──
    if (p.y > SJ.floorY - 6) {
      if (SJ.triggerDeath) SJ.triggerDeath();
    }
    if (p.y < SJ.ceilY + 6) {
      if (SJ.triggerDeath) SJ.triggerDeath();
    }
    if (p.x < SJ.leftWallX + 12 || p.x > SJ.rightWallX - 12) {
      if (SJ.triggerDeath) SJ.triggerDeath();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PLAYER RENDERING — behind-view paper airplane
  // ─────────────────────────────────────────────────────────────
  SJ.renderPlayer = function () {
    var ctx = SJ.ctx;
    var p   = SJ.player;

    if (p.deathPhase >= 3) return;

    // ── Contrail streams from wingtips ──
    for (var i = p.contrails.length - 1; i >= 0; i--) {
      var tr = p.contrails[i];
      if (tr.alpha <= 0.02) continue;
      var age = tr.age / tr.maxAge;
      ctx.save();
      ctx.globalAlpha = tr.alpha;
      ctx.strokeStyle = '#c8e8ff';
      ctx.lineWidth   = Math.max(0.4, (1 - age) * 2.2);
      ctx.lineCap     = 'round';
      // Left contrail — trail toward behind (away from vanishing point direction)
      ctx.beginPath();
      ctx.moveTo(tr.lx, tr.ly);
      ctx.lineTo(tr.lx, tr.ly + (1 - age) * 18);
      ctx.stroke();
      // Right contrail
      ctx.beginPath();
      ctx.moveTo(tr.rx, tr.ry);
      ctx.lineTo(tr.rx, tr.ry + (1 - age) * 18);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(p.x, p.y);

    // Pitch tilt: slight forward lean when ascending (visual only)
    var pitch = Math.atan2(p.vy, 900) * 0.35;
    // Apply roll (barrel roll banking)
    var roll = p.rollAngle;

    // Death crumple
    if (p.deathPhase === 2) {
      var crumple = Math.min(1, p.deathTimer / 600);
      ctx.scale(1 - crumple * 0.5, 1 - crumple * 0.5);
      ctx.rotate(crumple * Math.PI * 3);
    }

    ctx.rotate(roll);

    var sz = 30;

    // ── Combo glow aura ──
    if (p.comboGlow > 0.05) {
      ctx.save();
      ctx.globalAlpha = p.comboGlow * 0.3;
      ctx.shadowBlur  = 28;
      ctx.shadowColor = '#ffaa00';
      ctx.fillStyle   = '#ffaa00';
      ctx.beginPath();
      ctx.ellipse(0, 0, sz * 3.2, sz * 1.0, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Main left wing ──
    var wingGradL = ctx.createLinearGradient(-sz * 2.6, sz * 0.35, 0, -sz * 0.3);
    wingGradL.addColorStop(0,   '#b8b8b8');
    wingGradL.addColorStop(0.4, '#efefef');
    wingGradL.addColorStop(1,   '#d8d8d8');
    ctx.beginPath();
    ctx.moveTo(0,          -sz * 0.28);   // fuselage top
    ctx.lineTo(-sz * 2.55,  sz * 0.38);   // left wingtip
    ctx.lineTo(-sz * 1.1,   sz * 0.72);   // inboard trailing
    ctx.lineTo(0,            sz * 0.4);    // fuselage bottom
    ctx.closePath();
    ctx.fillStyle   = wingGradL;
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth   = 0.8;
    ctx.fill();
    ctx.stroke();

    // Wing fold crease highlight (left)
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.28);
    ctx.lineTo(-sz * 2.55, sz * 0.38);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // ── Main right wing ──
    var wingGradR = ctx.createLinearGradient(sz * 2.6, sz * 0.35, 0, -sz * 0.3);
    wingGradR.addColorStop(0,   '#b8b8b8');
    wingGradR.addColorStop(0.4, '#efefef');
    wingGradR.addColorStop(1,   '#d8d8d8');
    ctx.beginPath();
    ctx.moveTo(0,          -sz * 0.28);
    ctx.lineTo( sz * 2.55,  sz * 0.38);
    ctx.lineTo( sz * 1.1,   sz * 0.72);
    ctx.lineTo(0,            sz * 0.4);
    ctx.closePath();
    ctx.fillStyle   = wingGradR;
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth   = 0.8;
    ctx.fill();
    ctx.stroke();

    // Wing fold crease highlight (right)
    ctx.beginPath();
    ctx.moveTo(0, -sz * 0.28);
    ctx.lineTo(sz * 2.55, sz * 0.38);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // ── Horizontal stabilizers (rear mini-wings) ──
    ctx.fillStyle   = '#ddd';
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth   = 0.6;
    // Left stab
    ctx.beginPath();
    ctx.moveTo(-sz * 0.12, sz * 0.48);
    ctx.lineTo(-sz * 0.9,   sz * 0.7);
    ctx.lineTo(-sz * 0.12, sz * 0.72);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Right stab
    ctx.beginPath();
    ctx.moveTo( sz * 0.12, sz * 0.48);
    ctx.lineTo( sz * 0.9,   sz * 0.7);
    ctx.lineTo( sz * 0.12, sz * 0.72);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // ── Fuselage (body going forward toward vanishing point) ──
    var fuseGrad = ctx.createLinearGradient(-sz * 0.18, sz * 0.72, sz * 0.18, -sz * 1.0);
    fuseGrad.addColorStop(0,   '#ccc');
    fuseGrad.addColorStop(0.5, '#f2f2f2');
    fuseGrad.addColorStop(1,   '#e0e0e0');
    ctx.beginPath();
    ctx.moveTo(-sz * 0.18, sz * 0.72);    // tail-left
    ctx.lineTo( sz * 0.18, sz * 0.72);    // tail-right
    ctx.lineTo( sz * 0.07, -sz * 1.05);   // nose (forward)
    ctx.lineTo(-sz * 0.07, -sz * 1.05);
    ctx.closePath();
    ctx.fillStyle   = fuseGrad;
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth   = 0.7;
    ctx.fill();
    ctx.stroke();

    // Fuselage center crease
    ctx.beginPath();
    ctx.moveTo(0, sz * 0.72);
    ctx.lineTo(0, -sz * 1.05);
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth   = 0.5;
    ctx.stroke();

    // ── Vertical tail fin ──
    ctx.beginPath();
    ctx.moveTo(-sz * 0.06, sz * 0.3);
    ctx.lineTo(-sz * 0.06, -sz * 0.5);
    ctx.lineTo(-sz * 0.55,  sz * 0.3);
    ctx.closePath();
    ctx.fillStyle   = '#e0e0e0';
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth   = 0.5;
    ctx.fill();
    ctx.stroke();

    // ── Wear creases ──
    if (p.wearLevel > 0.3) {
      ctx.globalAlpha = (p.wearLevel - 0.3) * 0.7;
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth   = 0.5;
      ctx.beginPath();
      ctx.moveTo(-sz * 1.2, sz * 0.52);
      ctx.lineTo(-sz * 0.5, sz * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo( sz * 1.2, sz * 0.52);
      ctx.lineTo( sz * 0.5, sz * 0.3);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── Eye on tail fin ──
    var eyeState = p.eyeState;
    var eyeX = -sz * 0.26, eyeY = sz * 0.08, eyeR = sz * 0.09;
    if (eyeState === 'dizzy' || p.deathPhase === 2) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth   = 1.2;
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
      ctx.fillStyle   = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth   = 0.5;
      ctx.stroke();
      var pX = eyeR * (eyeState === 'fear' ? -0.1 : 0.25);
      var pY = p.vy > 300 ? eyeR * 0.3 : (p.vy < -200 ? -eyeR * 0.25 : 0);
      ctx.beginPath();
      ctx.arc(eyeX + pX, eyeY + pY, eyeR * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeX + pX - eyeR * 0.2, eyeY + pY - eyeR * 0.2, eyeR * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    ctx.restore();
  };

  // ─────────────────────────────────────────────────────────────
  // TUNNEL BORDER — perspective corridor overlay
  // Replaces the old flat spike floor/ceiling.
  // ─────────────────────────────────────────────────────────────
  SJ.renderFloorAndCeiling = function () {
    var ctx    = SJ.ctx;
    var w      = SJ.width;
    var h      = SJ.height;
    var vx     = SJ.vanishX;
    var vy     = SJ.vanishY;
    var ceilY  = SJ.ceilY;
    var floorY = SJ.floorY;
    var zone   = SJ.zones[SJ.currentZoneIdx] || {};
    var accent  = (zone.accentColors && zone.accentColors[0]) || '#cc2200';
    var accent2 = (zone.accentColors && zone.accentColors[1]) || '#992200';

    // Small vanishing rectangle (where tunnel converges)
    var vw = 38, vh = 26;
    var vL = vx - vw, vR = vx + vw;
    var vT = vy - vh, vB = vy + vh;

    // ── Fill tunnel wall faces ──
    // Ceiling face
    var ceilGrad = ctx.createLinearGradient(0, ceilY, 0, vy);
    ceilGrad.addColorStop(0,   'rgba(12,12,12,0.97)');
    ceilGrad.addColorStop(0.6, 'rgba(18,18,18,0.92)');
    ceilGrad.addColorStop(1,   'rgba(10,10,10,0.5)');
    ctx.fillStyle = ceilGrad;
    ctx.beginPath();
    ctx.moveTo(0,  ceilY); ctx.lineTo(w, ceilY);
    ctx.lineTo(vR, vT);    ctx.lineTo(vL, vT);
    ctx.closePath();
    ctx.fill();

    // Floor face
    var floorGrad = ctx.createLinearGradient(0, floorY, 0, vy);
    floorGrad.addColorStop(0,   'rgba(12,12,12,0.97)');
    floorGrad.addColorStop(0.6, 'rgba(18,18,18,0.92)');
    floorGrad.addColorStop(1,   'rgba(10,10,10,0.5)');
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.moveTo(0, floorY); ctx.lineTo(w, floorY);
    ctx.lineTo(vR, vB);    ctx.lineTo(vL, vB);
    ctx.closePath();
    ctx.fill();

    // Left wall face
    var leftGrad = ctx.createLinearGradient(0, 0, vx, 0);
    leftGrad.addColorStop(0,   'rgba(10,10,10,0.98)');
    leftGrad.addColorStop(0.7, 'rgba(15,15,15,0.93)');
    leftGrad.addColorStop(1,   'rgba(10,10,10,0.5)');
    ctx.fillStyle = leftGrad;
    ctx.beginPath();
    ctx.moveTo(0, ceilY);  ctx.lineTo(0,  floorY);
    ctx.lineTo(vL, vB);    ctx.lineTo(vL, vT);
    ctx.closePath();
    ctx.fill();

    // Right wall face
    var rightGrad = ctx.createLinearGradient(w, 0, vx, 0);
    rightGrad.addColorStop(0,   'rgba(10,10,10,0.98)');
    rightGrad.addColorStop(0.7, 'rgba(15,15,15,0.93)');
    rightGrad.addColorStop(1,   'rgba(10,10,10,0.5)');
    ctx.fillStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(w,  ceilY); ctx.lineTo(w,  floorY);
    ctx.lineTo(vR, vB);    ctx.lineTo(vR, vT);
    ctx.closePath();
    ctx.fill();

    // ── Perspective grid lines (convergence rails) ──
    ctx.strokeStyle = 'rgba(60,60,60,0.5)';
    ctx.lineWidth   = 0.7;
    var numRails = 6;
    for (var i = 1; i < numRails; i++) {
      var t = i / numRails;
      // Floor rail
      var railY = floorY + (vy - floorY) * t;
      var railLx = 0   + (vx - 0)   * t;
      var railRx = w   + (vx - w)   * t;
      ctx.beginPath();
      ctx.moveTo(railLx, railY);
      ctx.lineTo(railRx, railY);
      ctx.stroke();
      // Ceiling rail
      var crailY = ceilY + (vy - ceilY) * t;
      ctx.beginPath();
      ctx.moveTo(railLx, crailY);
      ctx.lineTo(railRx, crailY);
      ctx.stroke();
    }

    // Vertical convergence lines (floor)
    var laneCount = 4;
    for (var j = 0; j <= laneCount; j++) {
      var frac = j / laneCount;
      var nearX = frac * w;
      ctx.beginPath();
      ctx.moveTo(nearX, floorY);
      ctx.lineTo(vx,    vy);
      ctx.stroke();
      // Ceiling mirror
      ctx.beginPath();
      ctx.moveTo(nearX, ceilY);
      ctx.lineTo(vx,    vy);
      ctx.stroke();
    }

    // Left and right wall vertical lines
    var wallRows = 5;
    for (var k = 1; k < wallRows; k++) {
      var wt = k / wallRows;
      // Left wall
      var lwY = ceilY + (floorY - ceilY) * wt;
      var lwLx = 0   + (vL - 0)   * (1 - wt * 0.5);
      ctx.beginPath();
      ctx.moveTo(0,   lwY);
      ctx.lineTo(vL,  vy);
      ctx.stroke();
      // Right wall
      ctx.beginPath();
      ctx.moveTo(w,   lwY);
      ctx.lineTo(vR,  vy);
      ctx.stroke();
    }

    // ── Inner tunnel frame edge glow ──
    ctx.strokeStyle = accent;
    ctx.lineWidth   = 1.8;
    ctx.shadowBlur  = 10;
    ctx.shadowColor = accent;

    // Ceiling inner edge
    ctx.beginPath();
    ctx.moveTo(0, ceilY);
    ctx.lineTo(w, ceilY);
    ctx.stroke();

    // Floor inner edge
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();

    // Left wall inner edge
    ctx.beginPath();
    ctx.moveTo(0, ceilY);
    ctx.lineTo(0, floorY);
    ctx.stroke();

    // Right wall inner edge
    ctx.beginPath();
    ctx.moveTo(w, ceilY);
    ctx.lineTo(w, floorY);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // ── Spike decorations on inner edges ──
    SJ._floorSpikeOffset = ((SJ._floorSpikeOffset || 0) + SJ.scrollSpeed / 60) % 40;
    var spikeW = 40, spikeH = 18;
    var count  = Math.ceil(w / spikeW) + 2;

    ctx.fillStyle   = accent;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = accent;

    for (var s = 0; s < count; s++) {
      var sx = (s * spikeW - SJ._floorSpikeOffset % spikeW + spikeW) % (w + spikeW) - spikeW;
      // Floor spike (points up into play zone)
      ctx.beginPath();
      ctx.moveTo(sx,             floorY);
      ctx.lineTo(sx + spikeW/2,  floorY - spikeH);
      ctx.lineTo(sx + spikeW,    floorY);
      ctx.fill();
      // Ceiling spike (points down)
      ctx.beginPath();
      ctx.moveTo(sx,             ceilY);
      ctx.lineTo(sx + spikeW/2,  ceilY + spikeH);
      ctx.lineTo(sx + spikeW,    ceilY);
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    // ── Accent edge glow strips on side walls ──
    var leftEdgeGrad = ctx.createLinearGradient(0, 0, 18, 0);
    leftEdgeGrad.addColorStop(0, accent2 + 'cc');
    leftEdgeGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = leftEdgeGrad;
    ctx.fillRect(0, ceilY, 18, floorY - ceilY);

    var rightEdgeGrad = ctx.createLinearGradient(w, 0, w - 18, 0);
    rightEdgeGrad.addColorStop(0, accent2 + 'cc');
    rightEdgeGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rightEdgeGrad;
    ctx.fillRect(w - 18, ceilY, 18, floorY - ceilY);
  };

  // ─────────────────────────────────────────────────────────────
  // DEATH SEQUENCE
  // ─────────────────────────────────────────────────────────────
  SJ.triggerDeath = function () {
    if (!SJ.player.alive) return;
    SJ.player.alive = false;
    SJ.player.deathPhase = 1;
    SJ.player.deathTimer = 0;
    SJ.player.eyeState   = 'dizzy';
    SJ.gameState = 'dead';
    SJ.triggerScreenShake(12, 400);
    if (SJ.playSound) SJ.playSound('crumple');
    if (SJ.stopAllAudio) SJ.stopAllAudio();
    if (SJ.saveHighScore) SJ.saveHighScore();
  };

  function updateDeathAnimation(dt) {
    var p = SJ.player;
    p.deathTimer += dt;
    if (p.deathPhase === 1 && p.deathTimer > 300) {
      p.deathPhase = 2; p.deathTimer = 0;
    } else if (p.deathPhase === 2 && p.deathTimer > 600) {
      p.deathPhase = 3; p.deathTimer = 0;
      if (SJ.spawnDeathConfetti) SJ.spawnDeathConfetti(p.x, p.y);
    } else if (p.deathPhase === 3 && p.deathTimer > 1000) {
      p.deathPhase = 4; p.deathTimer = 0;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // START GAME
  // ─────────────────────────────────────────────────────────────
  SJ.startGame = function () {
    SJ.gameState     = 'cinematic';
    SJ.cinematicTimer = 0;

    SJ.score    = 0;
    SJ.distance = 0;
    SJ.combo    = 1;
    SJ.maxCombo = 1;
    SJ.currentZoneIdx = 0;
    SJ.cycleCount = 0;
    SJ.zoneTimer  = 0;
    SJ.baseSpeed  = 5;
    SJ.speed      = SJ.baseSpeed;
    SJ.elapsed    = 0;
    SJ.patternChunkIdx  = 0;
    SJ.timeSinceLastChunk = 0;
    SJ.transitioning  = false;
    SJ.lastNearMissTime  = 0;
    SJ.nowPlayingText  = '';
    SJ.nowPlayingTimer  = 0;
    SJ.titleCardText   = '';
    SJ.titleCardTimer  = 0;
    SJ.prevZoneIdx     = -1;
    SJ.transitionAlpha = 0;
    SJ.rhythmBonusText  = '';
    SJ.rhythmBonusTimer = 0;

    SJ.scrollSpeed = 220;
    SJ._floorSpikeOffset = 0;
    SJ.obstacles = [];
    SJ.particles = [];

    var p = SJ.player;
    p.x = SJ.width  * 0.5;
    p.y = SJ.height * 0.62;
    p.vy = 0;
    p.vx = 0;
    p.rollAngle  = 0;
    p.tiltAngle  = 0;
    p.scale      = 1;
    p.wingSpread = 1;
    p.alive      = true;
    p.deathPhase = 0;
    p.deathTimer = 0;
    p.wearLevel  = 0;
    p.contrails  = [];
    p.comboGlow  = 0;
    p.eyeState   = 'normal';
    p.eyeOffsetX = 0;
    p.eyeOffsetY = 0;

    if (SJ.clearObstacles) SJ.clearObstacles();
    if (SJ.playSong) SJ.playSong(0);
  };

  // ─────────────────────────────────────────────────────────────
  // CINEMATIC INTRO
  // ─────────────────────────────────────────────────────────────
  var _cine = { handPulse: 0 };

  function updateCinematic(dt) {
    _cine.handPulse += dt * 0.003;
  }

  function renderCinematic(elapsed) {
    var ctx = SJ.ctx;
    var W = SJ.width, H = SJ.height;
    var t = elapsed / 3000;

    // Background
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#2a1f12');
    bgGrad.addColorStop(1, '#3d2b14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Floor line
    ctx.beginPath();
    ctx.moveTo(0, H * 0.82);
    ctx.lineTo(W, H * 0.82);
    ctx.strokeStyle = '#4a3520';
    ctx.lineWidth   = 3;
    ctx.stroke();

    // Chalkboard
    var cbX = W * 0.1, cbY = H * 0.05, cbW = W * 0.6, cbH = H * 0.45;
    ctx.fillStyle   = '#1a3a2a';
    ctx.fillRect(cbX, cbY, cbW, cbH);
    ctx.strokeStyle = '#5a4028';
    ctx.lineWidth   = 10;
    ctx.strokeRect(cbX, cbY, cbW, cbH);
    ctx.strokeStyle = '#3a5040';
    ctx.lineWidth   = 2;
    ctx.strokeRect(cbX + 8, cbY + 8, cbW - 16, cbH - 16);

    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle   = '#c8d8c0';
    ctx.font        = 'bold ' + Math.round(H * 0.035) + 'px "Share Tech Mono", monospace';
    ctx.textAlign   = 'center';
    ctx.fillText('AERODYNAMICS 101', cbX + cbW / 2, cbY + cbH * 0.28);
    ctx.font = Math.round(H * 0.022) + 'px "Share Tech Mono", monospace';
    ctx.fillText('Lift = \u00bd \u03c1 v\u00b2 C\u2097 A', cbX + cbW / 2, cbY + cbH * 0.52);
    ctx.fillText('Drag = \u00bd \u03c1 v\u00b2 C\u1d05 A', cbX + cbW / 2, cbY + cbH * 0.68);
    ctx.restore();

    ctx.fillStyle = '#5a4028';
    ctx.fillRect(cbX, cbY + cbH, cbW, H * 0.025);

    drawDesks(ctx, W, H);
    drawWindow(ctx, W, H, t);
    drawHand(ctx, W, H, t);
    drawCinematicPlane(ctx, W, H, t);

    // Fade in
    if (elapsed < 400) {
      ctx.fillStyle = 'rgba(0,0,0,' + (1 - elapsed / 400) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    // Fade out
    if (elapsed > 2400) {
      var fadeOut = (elapsed - 2400) / 600;
      ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, fadeOut) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    // GET READY
    if (elapsed > 1000 && elapsed < 2400) {
      var alpha = Math.min(1, (elapsed - 1000) / 300);
      ctx.save();
      ctx.globalAlpha  = alpha;
      ctx.fillStyle    = '#ffe04a';
      ctx.font         = 'bold ' + Math.round(H * 0.06) + 'px "Oswald", sans-serif';
      ctx.textAlign    = 'center';
      ctx.shadowBlur   = 20;
      ctx.shadowColor  = '#ff8800';
      ctx.fillText('GET READY', W / 2, H * 0.88);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawDesks(ctx, W, H) {
    var rows = [
      { y: H * 0.72, count: 4, scaleY: 1.0 },
      { y: H * 0.60, count: 3, scaleY: 0.72 },
    ];
    rows.forEach(function (row) {
      var spacing = W * 0.22, startX = W * 0.1;
      for (var i = 0; i < row.count; i++) {
        var dx = startX + i * spacing, dy = row.y;
        var dw = spacing * 0.7 * row.scaleY, dh = H * 0.07 * row.scaleY;
        ctx.fillStyle = '#6b4c2a'; ctx.fillRect(dx, dy, dw, dh * 0.4);
        ctx.fillStyle = '#4a3018'; ctx.fillRect(dx, dy + dh * 0.4, dw, dh * 0.6);
        ctx.fillStyle = '#3a2510';
        ctx.fillRect(dx + dw * 0.1,  dy + dh, dw * 0.08, H * 0.06 * row.scaleY);
        ctx.fillRect(dx + dw * 0.82, dy + dh, dw * 0.08, H * 0.06 * row.scaleY);
      }
    });
  }

  function drawWindow(ctx, W, H, t) {
    var wx = W * 0.04, wy = H * 0.12, ww = W * 0.06, wh = H * 0.32;
    var skyGrad = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh);
    skyGrad.addColorStop(0, '#4488cc');
    skyGrad.addColorStop(1, '#88bbee');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(wx, wy, ww, wh);
    ctx.strokeStyle = '#5a4028'; ctx.lineWidth = 6;
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.beginPath();
    ctx.moveTo(wx + ww/2, wy); ctx.lineTo(wx + ww/2, wy + wh);
    ctx.moveTo(wx, wy + wh/2); ctx.lineTo(wx + ww, wy + wh/2);
    ctx.strokeStyle = '#5a4028'; ctx.lineWidth = 4;
    ctx.stroke();
    if (t > 0.55) {
      var glow = (t - 0.55) / 0.45;
      ctx.save();
      ctx.globalAlpha = glow * 0.4;
      var glowGrad = ctx.createRadialGradient(wx+ww/2, wy+wh/2, 0, wx+ww/2, wy+wh/2, W*0.15);
      glowGrad.addColorStop(0, '#88ccff');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  function drawHand(ctx, W, H, t) {
    var handX = W * 0.78, handY = H * 0.45;
    var throwProgress  = Math.max(0, Math.min(1, t / 0.25));
    var retreatProgress = Math.max(0, Math.min(1, (t - 0.25) / 0.2));
    var offsetX = throwProgress * (-W * 0.1) + retreatProgress * (W * 0.18);
    var offsetY = throwProgress * (-H * 0.08) + retreatProgress * (H * 0.06);
    ctx.save();
    ctx.translate(handX + offsetX, handY + offsetY);
    ctx.rotate(-0.4 + throwProgress * (-0.3) + retreatProgress * 0.5);
    ctx.fillStyle = '#c68642';
    ctx.beginPath(); ctx.ellipse(0, 0, W*0.04, H*0.06, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-W*0.032, -H*0.02, W*0.012, H*0.03, -0.6, 0, Math.PI*2); ctx.fill();
    for (var i = 0; i < 4; i++) {
      var fx = -W*0.018 + i*(W*0.014);
      ctx.beginPath(); ctx.ellipse(fx, -H*0.055, W*0.009, H*0.025, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  function drawCinematicPlane(ctx, W, H, t) {
    var px, py, angle, planeScale, alpha;
    if (t < 0.2) {
      px = W*0.72; py = H*0.42; angle = -0.5; planeScale = 1.0; alpha = 1;
    } else if (t < 0.85) {
      var ft  = (t - 0.2) / 0.65;
      var ease = 1 - Math.pow(1 - ft, 3);
      px = W*0.72 - ease*(W*0.72 - W*0.10);
      py = H*0.42*(1-ease) + H*0.25*ease - Math.sin(ft*Math.PI)*H*0.15;
      angle = -0.5 - ft*0.4; planeScale = 1.0 - ft*0.2; alpha = 1;
    } else {
      var ft2 = (t - 0.85) / 0.15;
      px = W*0.10 - ft2*W*0.12;
      py = H*0.25  - ft2*H*0.05;
      angle = -0.9; planeScale = 1.0 - ft2*0.5; alpha = 1 - ft2;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.scale(planeScale, planeScale);
    var sz = Math.round(Math.min(W, H) * 0.04);
    ctx.beginPath();
    ctx.moveTo(-sz*1.2, 0); ctx.lineTo(sz*1.5, -sz*0.1); ctx.lineTo(sz*1.5, sz*0.1);
    ctx.closePath(); ctx.fillStyle = '#f0f0f0'; ctx.fill();
    ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-sz*0.5, -sz*0.05); ctx.lineTo(sz*0.8, -sz*0.1); ctx.lineTo(-sz*0.5, -sz*0.9);
    ctx.closePath(); ctx.fillStyle = '#e8e8e8'; ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-sz*0.8, 0); ctx.lineTo(-sz*1.2, -sz*0.5); ctx.lineTo(-sz*0.5, 0);
    ctx.closePath(); ctx.fillStyle = '#e0e0e0'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-sz*0.8, 0); ctx.lineTo(sz*1.3, 0);
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.restore();
    // Motion trail
    if (t > 0.2 && t < 0.9) {
      for (var i = 1; i <= 6; i++) {
        var trailT = t - i*0.018;
        if (trailT < 0.2) continue;
        var ft3  = (trailT - 0.2) / 0.65;
        var ease3 = 1 - Math.pow(1 - Math.min(1,ft3), 3);
        var tx = W*0.72 - ease3*(W*0.72 - W*0.10);
        var ty = H*0.42*(1-ease3) + H*0.25*ease3 - Math.sin(ft3*Math.PI)*H*0.15;
        ctx.save();
        ctx.globalAlpha = (1 - i/6) * 0.3;
        ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI*2);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.restore();
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN GAME LOOP
  // ─────────────────────────────────────────────────────────────
  function gameLoop(timestamp) {
    var dt = Math.min(timestamp - (SJ.lastTime || timestamp), 50);
    SJ.lastTime = timestamp;
    SJ.dt = dt;

    var ctx = SJ.ctx;
    ctx.save();

    if (SJ.shakeIntensity > 0 && SJ.shakeTime > 0) {
      ctx.translate(
        (Math.random() - 0.5) * SJ.shakeIntensity * 2,
        (Math.random() - 0.5) * SJ.shakeIntensity * 2
      );
      SJ.shakeTime -= dt;
      if (SJ.shakeTime <= 0) { SJ.shakeIntensity = 0; SJ.shakeTime = 0; }
    }

    ctx.clearRect(-100, -100, SJ.width + 200, SJ.height + 200);

    if (SJ.gameState === 'start') {
      if (SJ.renderStartScreen) SJ.renderStartScreen();

    } else if (SJ.gameState === 'cinematic') {
      SJ.cinematicTimer += dt;
      updateCinematic(dt);
      renderCinematic(SJ.cinematicTimer);
      if (SJ.cinematicTimer > 3000) {
        SJ.gameState = 'playing';
        SJ.nowPlayingText  = SJ.zones[0] ? SJ.zones[0].displayTitle : 'No Role Modelz \u2014 J. Cole';
        SJ.nowPlayingTimer = 5500;
        if (SJ._spawnTimer !== undefined) SJ._spawnTimer = -1500;
      }

    } else if (SJ.gameState === 'playing' || SJ.gameState === 'transitioning') {
      SJ.elapsed += dt;
      if (SJ.renderBackground)    SJ.renderBackground();
      SJ.renderFloorAndCeiling();
      if (SJ.renderObstacles)     SJ.renderObstacles();
      if (SJ.updateParticles)     SJ.updateParticles(dt);
      if (SJ.renderParticles)     SJ.renderParticles();
      SJ.renderPlayer();

      if (SJ.gameState === 'playing') {
        SJ.updatePlayer(dt);
        if (SJ.updateObstacles) SJ.updateObstacles(dt);
        if (SJ.updateZone)      SJ.updateZone(dt);
        if (SJ.updateScoring)   SJ.updateScoring(dt);
        if (SJ.checkCollisions) SJ.checkCollisions();
        if (SJ.updateBeat)      SJ.updateBeat();
      } else {
        if (SJ.updateTransition) SJ.updateTransition(dt);
      }

      if (SJ.renderHUD)        SJ.renderHUD();
      if (SJ.renderNowPlaying) SJ.renderNowPlaying();
      if (SJ.renderTitleCard)  SJ.renderTitleCard();

    } else if (SJ.gameState === 'dead') {
      if (SJ.renderBackground)    SJ.renderBackground();
      SJ.renderFloorAndCeiling();
      if (SJ.updateParticles)     SJ.updateParticles(dt);
      if (SJ.renderParticles)     SJ.renderParticles();
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
    if (SJ.initZones)     SJ.initZones();
    if (SJ.initObstacles) SJ.initObstacles();
    if (SJ.initAudio)     SJ.initAudio();
    if (SJ.initUI)        SJ.initUI();
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
