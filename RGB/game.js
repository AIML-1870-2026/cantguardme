// ============================================================
// RGB CHEF'S KITCHEN — Game Engine
// ============================================================
'use strict';

// ---- Canvas & Context ----
let canvas, ctx;
const CW = 780, CH = 580;

// ---- Game State ----
let gameState = 'controls'; // controls | playing | paused | result | gameover
let score = 0;
let lives = 3;
let starsTotal = 0;
let currentLevelIdx = 0;

// ---- Pot State ----
let pot = { r: 0, g: 0, b: 0 };
let potAnim = { r: 0, g: 0, b: 0 }; // smoothly interpolated for display
let potFill = 0; // 0-1, for liquid height

// ---- Player ----
let player = {
  x: 240, y: 390,
  w: 38, h: 48,
  vx: 0, vy: 0,
  speed: 175,  // pixels per second (used with dt)
  facing: 'down',
  carrying: null, // null | 'red' | 'green' | 'blue'
  animFrame: 0,
  animTimer: 0,
  expression: 'idle',
  pouring: false,
  pourTimer: 0,
};

// ---- Stations ----
const ST = {
  redBottle:     { x: 60,  y: 455, w: 64, h: 90, type: 'bottle', color: 'red'   },
  greenBottle:   { x: 175, y: 455, w: 64, h: 90, type: 'bottle', color: 'green' },
  blueBottle:    { x: 290, y: 455, w: 64, h: 90, type: 'bottle', color: 'blue'  },
  pot:           { x: 300, y: 250, w: 120,h: 100, type: 'pot'  },
  servingWindow: { x: 70,  y: 110, w: 150, h: 70, type: 'serve' },
  trashCan:      { x: 620, y: 455, w: 68, h: 90, type: 'trash' },
  recipeBook:    { x: 615, y: 340, w: 80, h: 80, type: 'recipe' },
};

// Collision walls (kitchen boundaries + counter objects)
let colliders = [];

// ---- Particles ----
let particles = [];

// ---- Customer ----
let customer = null;
let customerEnterTimer = 0;
let customerBetweenTimer = 0;
let resultTimer = 0;

// ---- Input ----
const keys = {};
const justPressed = {};

// ---- Levels ----
const LEVELS = [
  // Act 1: Tutorial
  { act:1, num:1, target:{r:255,g:0,b:0},   hint:'💡 Pure Red light — just pour Red!',                            patience:65, dE:[10,20,40] },
  { act:1, num:2, target:{r:0,g:255,b:0},   hint:'💡 Pure Green light — just pour Green!',                        patience:65, dE:[10,20,40] },
  { act:1, num:3, target:{r:0,g:0,b:255},   hint:'💡 Pure Blue light — just pour Blue!',                          patience:65, dE:[10,20,40] },
  { act:1, num:4, target:{r:255,g:255,b:0}, hint:'💡 Yellow = Red + Green! Light mixing surprises!',              patience:60, dE:[10,20,40] },
  { act:1, num:5, target:{r:0,g:255,b:255}, hint:'💡 Cyan = Green + Blue!',                                       patience:60, dE:[10,20,40] },
  { act:1, num:6, target:{r:255,g:0,b:255}, hint:'💡 Magenta = Red + Blue!',                                      patience:55, dE:[10,20,40] },
  // Act 2: Line Cook
  { act:2, num:1, target:{r:255,g:255,b:255},hint:null,                                                            patience:45, dE:[5,15,30] },
  { act:2, num:2, target:{r:255,g:128,b:0},  hint:null,                                                            patience:40, dE:[5,15,30] },
  { act:2, num:3, target:{r:128,g:0,b:255},  hint:null,                                                            patience:38, dE:[5,15,30] },
  { act:2, num:4, target:{r:0,g:200,b:150},  hint:null,                                                            patience:35, dE:[5,15,30] },
  { act:2, num:5, target:{r:255,g:50,b:100}, hint:null,                                                            patience:33, dE:[5,15,30] },
  { act:2, num:6, target:{r:200,g:200,b:50}, hint:null,                                                            patience:32, dE:[5,15,30] },
];

// Customer sprites (color profiles)
const CUSTOMER_TYPES = [
  { skin:'#f5c8a0', hair:'#3a1a00', shirt:'#cc4444', name:'Alex'    },
  { skin:'#c8956a', hair:'#111111', shirt:'#4444cc', name:'Sam'     },
  { skin:'#f0d0b0', hair:'#aa6600', shirt:'#44cc44', name:'Jordan'  },
  { skin:'#d4a070', hair:'#222222', shirt:'#cc8800', name:'Taylor'  },
  { skin:'#8a5a30', hair:'#1a0800', shirt:'#8844cc', name:'Morgan'  },
  { skin:'#f8e0c0', hair:'#cc4444', shirt:'#44cccc', name:'Casey'   },
  { skin:'#c07848', hair:'#333333', shirt:'#cc44aa', name:'Riley'   },
];

const ORDER_MESSAGES = [
  'I\'d like this color please!',
  'Can I get this exact shade?',
  'Mix me this color!',
  'One of these, please!',
  'I\'m craving this hue!',
];

// ---- Pour Stream Particles ----
let pourStreams = [];

// ---- Game Slider Primary Constraint ----
let gameSelectedPrimaries = ['r', 'g'];
let gameListenersAdded = false;
let gameLoopRunning = false; // guard against duplicate requestAnimationFrame loops

// ---- Animation state ----
let bubbles = [];
let steamParticles = [];
let celebrationParticles = [];
let potGlowPulse = 0;
let kitchenCat = { x: 700, y: 530, dir: -1, frame: 0, timer: 0 };
let hint = { text: '', timer: 0 };

// ---- Dining NPC System ----
let diningNPCs = [];
let diningSpawnTimer = 3.5;

const DINING_SPOTS = [
  { x: 50,  y: 62 },
  { x: 245, y: 54 },
  { x: 358, y: 62 },
  { x: 470, y: 54 },
  { x: 582, y: 62 },
  { x: 712, y: 54 },
];

let lastTime = 0;

// ============================================================
// INIT
// ============================================================
function initGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  // Build collision rects (station bodies)
  buildColliders();

  // Input listeners — only add once to avoid duplicates on re-init
  if (!gameListenersAdded) {
    document.addEventListener('keydown', (e) => {
      if (!keys[e.code]) justPressed[e.code] = true;
      keys[e.code] = true;
      if (e.code === 'Escape') handleEscape();
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    document.addEventListener('keyup', (e) => { keys[e.code] = false; });
    gameListenersAdded = true;
  }

  // Spawn initial bubbles
  for (let i = 0; i < 8; i++) spawnBubble();
  initDiningNPCs();
}

function buildColliders() {
  colliders = [
    // Kitchen walls
    { x: 0,    y: 0,    w: CW,  h: 100 }, // top wall / dining area
    { x: 0,    y: 0,    w: 10,  h: CH  }, // left wall
    { x: CW-10,y: 0,    w: 10,  h: CH  }, // right wall
    { x: 0,    y: CH-10,w: CW,  h: 10  }, // bottom wall
    // Stations as solid objects
    { x: ST.servingWindow.x, y: ST.servingWindow.y, w: ST.servingWindow.w, h: 30 },
    { x: ST.pot.x, y: ST.pot.y, w: ST.pot.w, h: ST.pot.h },
    { x: ST.redBottle.x,   y: ST.redBottle.y,   w: ST.redBottle.w,   h: 30 },
    { x: ST.greenBottle.x, y: ST.greenBottle.y, w: ST.greenBottle.w, h: 30 },
    { x: ST.blueBottle.x,  y: ST.blueBottle.y,  w: ST.blueBottle.w,  h: 30 },
    { x: ST.trashCan.x,    y: ST.trashCan.y,    w: ST.trashCan.w,    h: 30 },
    { x: ST.recipeBook.x,  y: ST.recipeBook.y,  w: ST.recipeBook.w,  h: 30 },
  ];
}

// ============================================================
// GAME FLOW
// ============================================================
function startGame() {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('gameMode').classList.remove('hidden');
  initGame();
  AudioManager.start();
}

function startPlaying() {
  document.getElementById('controlsOverlay').classList.add('hidden');
  gameState = 'playing';
  score = 0; lives = 3; starsTotal = 0; currentLevelIdx = 0;
  pot = { r: 0, g: 0, b: 0 };
  potAnim = { r: 0, g: 0, b: 0 };
  potFill = 0;
  // Reset player to safe starting position (below pot, not inside it)
  player.x = 240; player.y = 390;
  player.vx = 0; player.vy = 0;
  player.carrying = null;
  player.animFrame = 0; player.animTimer = 0;
  player.expression = 'idle'; player.pouring = false;
  hint.text = 'WASD / Arrow keys to move  •  E or SPACE to interact  •  Q to drop';
  hint.timer = 7;
  updateScoreDisplay();
  spawnCustomer();
  lastTime = performance.now();
  if (!gameLoopRunning) {
    gameLoopRunning = true;
    requestAnimationFrame(gameLoop);
  }
}

function resumeGame() {
  document.getElementById('pauseMenu').classList.add('hidden');
  gameState = 'playing';
  lastTime = performance.now(); // reset dt so no spike after pause
  // NOTE: loop is already running while paused — do NOT call requestAnimationFrame again
}

function showControls() {
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('controlsOverlay').classList.remove('hidden');
  gameState = 'controls';
}

function handleEscape() {
  if (gameState === 'playing') {
    gameState = 'paused';
    document.getElementById('pauseMenu').classList.remove('hidden');
  } else if (gameState === 'paused') {
    resumeGame();
  }
}

function goToMainMenu() {
  gameState = 'controls';
  AudioManager.stop();
  document.getElementById('gameMode').classList.add('hidden');
  document.getElementById('learnMode').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('servingResult').classList.add('hidden');
  document.getElementById('controlsOverlay').classList.remove('hidden');
}

function restartGame() {
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('servingResult').classList.add('hidden');
  score = 0; lives = 3; starsTotal = 0; currentLevelIdx = 0;
  pot = { r: 0, g: 0, b: 0 };
  potAnim = { r: 0, g: 0, b: 0 };
  potFill = 0;
  customer = null;
  // Reset player to safe starting position
  player.x = 240; player.y = 390;
  player.vx = 0; player.vy = 0;
  player.carrying = null;
  player.animFrame = 0; player.animTimer = 0;
  player.expression = 'idle'; player.pouring = false;
  particles = []; pourStreams = []; celebrationParticles = [];
  diningNPCs = []; diningSpawnTimer = 3.5; initDiningNPCs();
  updateScoreDisplay();
  spawnCustomer();
  gameState = 'playing';
  lastTime = performance.now();
  if (!gameLoopRunning) {
    gameLoopRunning = true;
    requestAnimationFrame(gameLoop);
  }
}

// ============================================================
// CUSTOMER SYSTEM
// ============================================================
function spawnCustomer() {
  if (currentLevelIdx >= LEVELS.length) {
    // All levels done — keep cycling Act 2+
    currentLevelIdx = 6;
  }
  const level = LEVELS[currentLevelIdx];
  const type = CUSTOMER_TYPES[currentLevelIdx % CUSTOMER_TYPES.length];
  const maxPat = level.patience;

  const targetX = ST.servingWindow.x + 70;
  customer = {
    x: targetX + 160,   // spawn just 160px off-screen — arrives in ~0.6 s
    y: 55,
    targetX,
    type,
    name: type.name,
    order: { ...level.target },
    patience: maxPat,
    maxPatience: maxPat,
    state: 'entering',  // entering | waiting | leaving
    expression: 'happy',
    idleTimer: 0,
    message: ORDER_MESSAGES[currentLevelIdx % ORDER_MESSAGES.length],
    exitDir: 1,
  };

  if (level.hint) {
    hint.text = level.hint;
    hint.timer = 6;
  }
}

function updateCustomer(dt) {
  if (!customer) return;

  if (customer.state === 'entering') {
    customer.x -= 280 * dt;
    if (customer.x <= customer.targetX) {
      customer.x = customer.targetX;
      customer.state = 'waiting';
    }
    return;
  }

  if (customer.state === 'waiting') {
    customer.patience -= dt;
    customer.idleTimer += dt;

    if (customer.patience <= 0) {
      // Time's up — 0 stars
      customer.patience = 0;
      lives--;
      updateScoreDisplay();
      customer.expression = 'angry';
      customer.state = 'leaving';
      customer.exitDir = -1;
      // Save pot color BEFORE resetting so the result screen shows what the player had
      const prevPot = { r: Math.round(pot.r), g: Math.round(pot.g), b: Math.round(pot.b) };
      pot = { r: 0, g: 0, b: 0 };
      showResult(0, customer.order, prevPot, deltaE(customer.order, prevPot));
      return; // don't overwrite 'angry' expression below
    }

    if (customer.patience / customer.maxPatience < 0.3) customer.expression = 'impatient';
    else if (customer.patience / customer.maxPatience < 0.6) customer.expression = 'neutral';
    else customer.expression = 'happy';
    return;
  }

  if (customer.state === 'leaving') {
    customer.x += 140 * dt * customer.exitDir;
    if (Math.abs(customer.x) > CW + 100) {
      customer = null;
      customerBetweenTimer = 1.4; // pause before next customer
    }
  }
}

function serveCustomer() {
  if (!customer || customer.state !== 'waiting') return;
  if (gameState !== 'playing') return;

  const target = customer.order;
  const mixed = { r: Math.round(pot.r), g: Math.round(pot.g), b: Math.round(pot.b) };
  const de = deltaE(target, mixed);

  const level = LEVELS[currentLevelIdx];
  const thresholds = level ? level.dE : [5, 15, 30];

  let stars = 0;
  if (de < thresholds[0]) stars = 3;
  else if (de < thresholds[1]) stars = 2;
  else if (de < thresholds[2]) stars = 1;
  else stars = 0;

  let pts = [0, 200, 500, 1000][stars];
  if (stars === 3) {
    const speedBonus = Math.floor((customer.patience / customer.maxPatience) * 500);
    pts += speedBonus + 200;
    spawnCelebration(360, 300);
    celebrateDiningNPCs();
  }
  if (stars === 0) { lives--; }

  score += pts;
  starsTotal += stars;
  updateScoreDisplay();

  customer.exitDir = 1;
  customer.state = 'leaving';
  customer.expression = ['angry','unimpressed','pleased','ecstatic'][stars];

  showResult(stars, target, mixed, de);

  pot = { r: 0, g: 0, b: 0 };
  currentLevelIdx++;
}

// ============================================================
// RESULT DISPLAY
// ============================================================
function showResult(stars, target, mixed, de) {
  gameState = 'result';
  const el = document.getElementById('servingResult');
  el.classList.remove('hidden');

  document.getElementById('targetColorBox').style.background = rgbToHex(target.r, target.g, target.b);
  document.getElementById('yourColorBox').style.background = rgbToHex(mixed.r, mixed.g, mixed.b);
  document.getElementById('starDisplay').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('deltaEDisplay').textContent = `Color distance ΔE: ${de.toFixed(1)}`;

  const msgs = ['😢 Not quite — try again!', '😐 Almost there!', '😊 Well done!', '🎉 Perfect mix! Amazing!'];
  document.getElementById('resultMessage').textContent = msgs[stars];

  resultTimer = 2.8;
}

function closeResult() {
  document.getElementById('servingResult').classList.add('hidden');
  if (lives <= 0) {
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalStars').textContent = starsTotal;
    gameState = 'gameover';
    return;
  }
  gameState = 'playing';
  customerBetweenTimer = 1.0;
}

// ============================================================
// PLAYER UPDATE
// ============================================================
function updatePlayer(dt) {
  if (gameState !== 'playing') return;

  const left  = keys['ArrowLeft']  || keys['KeyA'];
  const right = keys['ArrowRight'] || keys['KeyD'];
  const up    = keys['ArrowUp']    || keys['KeyW'];
  const down  = keys['ArrowDown']  || keys['KeyS'];

  const spd = player.speed * (player.carrying ? 0.75 : 1);
  player.vx = 0; player.vy = 0;

  if (left)  { player.vx = -spd; player.facing = 'left'; }
  if (right) { player.vx =  spd; player.facing = 'right'; }
  if (up)    { player.vy = -spd; player.facing = 'up'; }
  if (down)  { player.vy =  spd; player.facing = 'down'; }

  // Normalize diagonal
  if (player.vx && player.vy) { player.vx *= 0.707; player.vy *= 0.707; }

  // Move + collide  (scale velocity by dt so speed is frame-rate independent)
  let nx = player.x + player.vx * dt;
  let ny = player.y + player.vy * dt;
  const pw = player.w, ph = player.h;

  for (const c of colliders) {
    // X axis
    if (nx < c.x + c.w && nx + pw > c.x && player.y < c.y + c.h && player.y + ph > c.y) {
      if (player.vx > 0) nx = c.x - pw;
      if (player.vx < 0) nx = c.x + c.w;
    }
    // Y axis
    if (player.x < c.x + c.w && player.x + pw > c.x && ny < c.y + c.h && ny + ph > c.y) {
      if (player.vy > 0) ny = c.y - ph;
      if (player.vy < 0) ny = c.y + c.h;
    }
  }

  player.x = nx;
  player.y = ny;

  // Walk animation
  const moving = player.vx !== 0 || player.vy !== 0;
  if (moving) {
    player.animTimer += dt;
    if (player.animTimer > 0.15) {
      player.animTimer = 0;
      player.animFrame = (player.animFrame + 1) % 4;
    }
  } else {
    player.animFrame = 0;
    player.animTimer = 0;
  }

  // Interact key
  const interactPressed = justPressed['Space'] || justPressed['KeyE'];
  const dropPressed = justPressed['KeyQ'];

  if (interactPressed) handleInteract();
  if (dropPressed) dropItem();

  // Continuous pour at pot
  if ((keys['Space'] || keys['KeyE']) && player.carrying && isNear(player, ST.pot)) {
    doPour(dt);
    player.pouring = true;
  } else {
    player.pouring = false;
  }
}

function isNear(pl, station) {
  const px = pl.x + pl.w / 2;
  const py = pl.y + pl.h / 2;
  const sx = station.x + station.w / 2;
  const sy = station.y + station.h / 2;
  return Math.hypot(px - sx, py - sy) < 90;
}

function handleInteract() {
  // Pick up bottle
  if (!player.carrying) {
    for (const [key, st] of Object.entries(ST)) {
      if (st.type === 'bottle' && isNear(player, st)) {
        player.carrying = st.color;
        hint.text = `Carrying ${st.color} bottle — walk to the pot and hold SPACE to pour!`;
        hint.timer = 5;
        return;
      }
    }
  }

  // Pour into pot (single press = one increment)
  if (player.carrying && isNear(player, ST.pot)) {
    doPour(0.12);
    return;
  }

  // Stir pot (precision sliders)
  if (!player.carrying && isNear(player, ST.pot)) {
    openSlider();
    return;
  }

  // Serve at window
  if (isNear(player, ST.servingWindow)) {
    if (player.carrying) {
      hint.text = '⚠️ Drop the bottle first before serving! Press Q to put it down.';
      hint.timer = 3;
      return;
    }
    serveCustomer();
    return;
  }

  // Trash
  if (isNear(player, ST.trashCan)) {
    pot = { r: 0, g: 0, b: 0 };
    spawnSplash(ST.trashCan.x + 34, ST.trashCan.y + 30, '#555');
    hint.text = 'Pot dumped! Start fresh.';
    hint.timer = 3;
    return;
  }

  // Recipe book
  if (isNear(player, ST.recipeBook)) {
    hint.text = '📖 Recipe stand — check the Recipe Learn tab for color tips!';
    hint.timer = 4;
  }
}

function dropItem() {
  if (player.carrying) {
    player.carrying = null;
    hint.text = 'Item dropped.';
    hint.timer = 2;
  }
}

function doPour(dt) {
  const amount = 80 * dt;
  if (player.carrying === 'red')   pot.r = Math.min(255, pot.r + amount);
  if (player.carrying === 'green') pot.g = Math.min(255, pot.g + amount);
  if (player.carrying === 'blue')  pot.b = Math.min(255, pot.b + amount);
  potFill = (pot.r + pot.g + pot.b) / (255 * 3);

  // Pour stream particles — arc from player (bottle above head) to pot center
  const clr = player.carrying === 'red' ? '#ff4444' :
              player.carrying === 'green' ? '#44ff44' : '#4444ff';
  spawnPourDrop(player.x + player.w / 2, player.y, ST.pot.x + 60, ST.pot.y + 60, clr);
}

// ============================================================
// GAME SLIDER PRIMARY CONSTRAINT
// ============================================================

// Auto-detect the two dominant channels from current pot to select as primaries
function detectPrimariesFromPot() {
  const vals = [
    { p: 'r', v: Math.round(pot.r) },
    { p: 'g', v: Math.round(pot.g) },
    { p: 'b', v: Math.round(pot.b) },
  ];
  vals.sort((a, b) => b.v - a.v); // descending
  // If all zero, default to r+g
  if (vals[0].v === 0) return ['r', 'g'];
  return [vals[0].p, vals[1].p];
}

function toggleGamePrimary(which) {
  if (gameSelectedPrimaries.includes(which)) return; // already selected, no-op
  const all = ['r', 'g', 'b'];
  // Keep the one that's currently selected AND is not 'which', drop the other
  gameSelectedPrimaries = [which, all.find(p => p !== which && gameSelectedPrimaries.includes(p))];
  updateGamePrimaryUI();
  applyGameSliderConstraints();
  updatePotFromSlider();
}

function updateGamePrimaryUI() {
  for (const p of ['r', 'g', 'b']) {
    const btn = document.getElementById('gPBtn-' + p);
    if (!btn) continue;
    const sel = gameSelectedPrimaries.includes(p);
    btn.classList.toggle('selected', sel);
    btn.classList.toggle('locked', !sel);
  }
}

function applyGameSliderConstraints() {
  const locked = ['r', 'g', 'b'].find(p => !gameSelectedPrimaries.includes(p));
  const sliderIds  = { r: 'rSlider', g: 'gSlider', b: 'bSlider' };
  const valIds     = { r: 'rVal',    g: 'gVal',    b: 'bVal'    };
  const lockIds    = { r: 'rLock',   g: 'gLock',   b: 'bLock'   };

  for (const p of ['r', 'g', 'b']) {
    const slider  = document.getElementById(sliderIds[p]);
    const lockEl  = document.getElementById(lockIds[p]);
    if (!slider) continue;

    if (p === locked) {
      const [o1, o2] = gameSelectedPrimaries;
      const v1 = +document.getElementById(sliderIds[o1]).value;
      const v2 = +document.getElementById(sliderIds[o2]).value;
      const maxVal = Math.min(v1, v2);
      slider.max = maxVal;
      if (+slider.value > maxVal) {
        slider.value = maxVal;
        document.getElementById(valIds[p]).textContent = maxVal;
      }
      slider.style.opacity = '0.55';
      if (lockEl) lockEl.textContent = `🔒 max: ${maxVal}`;
    } else {
      slider.max = 255;
      slider.style.opacity = '1';
      if (lockEl) lockEl.textContent = '';
    }
  }
}

// ============================================================
// SLIDER OVERLAY
// ============================================================
function openSlider() {
  document.getElementById('rSlider').value = Math.round(pot.r);
  document.getElementById('gSlider').value = Math.round(pot.g);
  document.getElementById('bSlider').value = Math.round(pot.b);
  document.getElementById('rVal').textContent = Math.round(pot.r);
  document.getElementById('gVal').textContent = Math.round(pot.g);
  document.getElementById('bVal').textContent = Math.round(pot.b);
  // Auto-detect which two channels dominate, use them as the primaries
  gameSelectedPrimaries = detectPrimariesFromPot();
  updateGamePrimaryUI();
  applyGameSliderConstraints();
  updateSliderPreview();
  document.getElementById('sliderOverlay').classList.remove('hidden');
  gameState = 'paused';
}

function updatePotFromSlider() {
  // Apply constraint first (clamp locked channel to max = min of the two primaries)
  applyGameSliderConstraints();
  pot.r = +document.getElementById('rSlider').value;
  pot.g = +document.getElementById('gSlider').value;
  pot.b = +document.getElementById('bSlider').value;
  document.getElementById('rVal').textContent = Math.round(pot.r);
  document.getElementById('gVal').textContent = Math.round(pot.g);
  document.getElementById('bVal').textContent = Math.round(pot.b);
  potFill = (pot.r + pot.g + pot.b) / (255 * 3);
  updateSliderPreview();
}

function updateSliderPreview() {
  const hex = rgbToHex(Math.round(pot.r), Math.round(pot.g), Math.round(pot.b));
  document.getElementById('sliderPreview').style.background = hex;
}

function closeSlider() {
  document.getElementById('sliderOverlay').classList.add('hidden');
  gameState = 'playing';
}

// ============================================================
// SCORE DISPLAY
// ============================================================
function updateScoreDisplay() {
  document.getElementById('scoreText').textContent = `Score: ${score}`;
  document.getElementById('livesDisplay').textContent = '👨‍🍳'.repeat(Math.max(0, lives));
  const lv = LEVELS[currentLevelIdx] || LEVELS[LEVELS.length - 1];
  document.getElementById('actLevel').textContent = `Act ${lv.act} - Level ${lv.num}`;
}

// ============================================================
// PARTICLES
// ============================================================
function spawnBubble() {
  const px = ST.pot.x + 15 + Math.random() * (ST.pot.w - 30);
  const py = ST.pot.y + ST.pot.h * (1 - potFill) + Math.random() * 20;
  bubbles.push({ x: px, y: py, r: 2 + Math.random() * 5, vy: -(20 + Math.random() * 30), life: 1, maxLife: 1 });
}

function spawnSteam() {
  const px = ST.pot.x + 15 + Math.random() * (ST.pot.w - 30);
  steamParticles.push({
    x: px, y: ST.pot.y - 5,
    vx: (Math.random() - 0.5) * 12,
    vy: -(10 + Math.random() * 20),
    life: 1, maxLife: 1 + Math.random() * 0.8,
    r: 3 + Math.random() * 5,
  });
}

function spawnPourDrop(fx, fy, tx, ty, color) {
  pourStreams.push({ fx, fy, tx, ty, color, life: 0.4, maxLife: 0.4 });
  // Splash on arrival
  for (let i = 0; i < 4; i++) {
    particles.push({
      x: tx, y: ty,
      vx: (Math.random() - 0.5) * 40,
      vy: (Math.random() - 0.5) * 40 - 20,
      life: 0.5, maxLife: 0.5,
      color, r: 3,
    });
  }
}

function spawnSplash(x, y, color) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 60;
    particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed - 20, life: 0.7, maxLife: 0.7, color, r: 3 + Math.random()*4 });
  }
}

function spawnCelebration(x, y) {
  const colors = ['#ffcc00','#ff4488','#44ccff','#88ff44','#ff8844'];
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;
    celebrationParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      life: 1.5, maxLife: 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      r: 4 + Math.random() * 4,
      gravity: 60,
    });
  }
}

function updateParticles(dt) {
  // Bubbles
  const bubblesPerSec = 3 + potFill * 8;
  if (Math.random() < bubblesPerSec * dt) spawnBubble();
  for (const b of bubbles) {
    b.y += b.vy * dt;
    b.life -= dt * 0.9;
  }
  bubbles = bubbles.filter(b => b.life > 0 && b.y > ST.pot.y);

  // Steam
  if (Math.random() < (1 + potFill * 3) * dt) spawnSteam();
  for (const s of steamParticles) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt / s.maxLife;
    s.r += dt * 2;
  }
  steamParticles = steamParticles.filter(s => s.life > 0);

  // General particles
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt / p.maxLife;
  }
  particles = particles.filter(p => p.life > 0);

  // Celebration particles
  for (const p of celebrationParticles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.gravity) p.vy += p.gravity * dt;
    p.life -= dt / p.maxLife;
  }
  celebrationParticles = celebrationParticles.filter(p => p.life > 0);

  // Pour streams
  for (const s of pourStreams) s.life -= dt;
  pourStreams = pourStreams.filter(s => s.life > 0);

  potGlowPulse = (Date.now() / 1000) % (Math.PI * 2);
}

// ============================================================
// KITCHEN CAT
// ============================================================
function updateCat(dt) {
  kitchenCat.timer += dt;
  if (kitchenCat.timer > 0.2) {
    kitchenCat.timer = 0;
    kitchenCat.frame = (kitchenCat.frame + 1) % 4;
  }
  kitchenCat.x += kitchenCat.dir * 22 * dt;
  if (kitchenCat.x < 20 || kitchenCat.x > CW - 20) kitchenCat.dir *= -1;
}

// ============================================================
// DINING AREA NPC SYSTEM
// ============================================================
function initDiningNPCs() {
  diningNPCs = [];
  diningSpawnTimer = 2.5;
  // Seat 3 NPCs immediately at staggered spots
  const order = [0, 2, 4].sort(() => Math.random() - 0.5);
  for (const spotIdx of order) {
    const spot = DINING_SPOTS[spotIdx];
    diningNPCs.push({
      x: spot.x, y: spot.y,
      targetX: spot.x,
      exitX: spotIdx % 2 === 0 ? -80 : CW + 80,
      spotIdx,
      type: CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)],
      state: 'seated',
      timer: Math.random() * 14,
      maxTime: 18 + Math.random() * 22,
      idleAnim: Math.random() * Math.PI * 2,
      eatFrame: 0, eatTimer: 0,
      celebrateTimer: 0,
      done: false,
    });
  }
}

function spawnDiningNPC() {
  const used = new Set(diningNPCs.map(n => n.spotIdx));
  const free = [0, 1, 2, 3, 4, 5].filter(i => !used.has(i));
  if (!free.length) return;
  const spotIdx = free[Math.floor(Math.random() * free.length)];
  const spot = DINING_SPOTS[spotIdx];
  const fromLeft = spot.x < CW / 2 ? Math.random() > 0.3 : Math.random() < 0.3;
  diningNPCs.push({
    x: fromLeft ? -55 : CW + 55,
    y: spot.y,
    targetX: spot.x,
    exitX: fromLeft ? -80 : CW + 80,
    spotIdx,
    type: CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)],
    state: 'entering',
    timer: 0,
    maxTime: 18 + Math.random() * 22,
    idleAnim: Math.random() * Math.PI * 2,
    eatFrame: 0, eatTimer: 0,
    celebrateTimer: 0,
    done: false,
  });
}

function updateDiningNPCs(dt) {
  diningSpawnTimer -= dt;
  if (diningSpawnTimer <= 0) {
    const used = new Set(diningNPCs.map(n => n.spotIdx));
    if (used.size < DINING_SPOTS.length) spawnDiningNPC();
    diningSpawnTimer = 5 + Math.random() * 8;
  }
  for (const npc of diningNPCs) {
    npc.idleAnim += dt;
    if (npc.state === 'entering') {
      const spd = 62 * dt;
      const dx = npc.targetX - npc.x;
      if (Math.abs(dx) <= spd) { npc.x = npc.targetX; npc.state = 'seated'; }
      else npc.x += Math.sign(dx) * spd;
    } else if (npc.state === 'seated') {
      npc.timer += dt;
      npc.eatTimer += dt;
      if (npc.eatTimer > 1.4) { npc.eatTimer = 0; npc.eatFrame = (npc.eatFrame + 1) % 3; }
      if (npc.timer >= npc.maxTime) npc.state = 'leaving';
    } else if (npc.state === 'celebrating') {
      npc.celebrateTimer -= dt;
      if (npc.celebrateTimer <= 0) { npc.state = 'seated'; npc.timer = Math.max(0, npc.timer - 7); }
    } else if (npc.state === 'leaving') {
      const spd = 68 * dt;
      const dx = npc.exitX - npc.x;
      if (Math.abs(dx) <= spd) npc.done = true;
      else npc.x += Math.sign(dx) * spd;
    }
  }
  diningNPCs = diningNPCs.filter(n => !n.done);
}

function celebrateDiningNPCs() {
  for (const npc of diningNPCs) {
    if (npc.state === 'seated') {
      npc.state = 'celebrating';
      npc.celebrateTimer = 2.8;
    }
  }
}

// ============================================================
// MAIN GAME LOOP
// ============================================================
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  // Animate pot color
  potAnim.r += (pot.r - potAnim.r) * Math.min(1, dt * 8);
  potAnim.g += (pot.g - potAnim.g) * Math.min(1, dt * 8);
  potAnim.b += (pot.b - potAnim.b) * Math.min(1, dt * 8);

  if (gameState === 'playing') {
    updatePlayer(dt);
    updateParticles(dt);
    updateCat(dt);
    updateDiningNPCs(dt);

    if (customer) updateCustomer(dt);
    else if (customerBetweenTimer > 0) {
      customerBetweenTimer -= dt;
      if (customerBetweenTimer <= 0) spawnCustomer();
    }

    if (hint.timer > 0) hint.timer -= dt;
  }

  if (gameState === 'result') {
    resultTimer -= dt;
    if (resultTimer <= 0) closeResult();
    updateParticles(dt);
  }

  // Always clear justPressed after use
  for (const k in justPressed) delete justPressed[k];

  draw();
  if (gameState !== 'gameover' && gameState !== 'controls') {
    requestAnimationFrame(gameLoop);
  } else {
    gameLoopRunning = false;
  }
}

// ============================================================
// DRAWING
// ============================================================
function draw() {
  ctx.clearRect(0, 0, CW, CH);
  drawKitchen();
  drawStations();
  drawPot();
  drawCustomer();
  drawPlayer();
  drawParticles();
  drawUI();
  if (gameState === 'playing' || gameState === 'result') {
    drawPatience();
  }
}

// ---- Kitchen Background ----
function drawKitchen() {
  // Floor (dark tile)
  const floorGrad = ctx.createLinearGradient(0, 100, 0, CH);
  floorGrad.addColorStop(0, '#241810');
  floorGrad.addColorStop(1, '#1a1008');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 100, CW, CH - 100);

  // Tile grid
  ctx.strokeStyle = 'rgba(255,200,100,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CW; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 100); ctx.lineTo(x, CH); ctx.stroke();
  }
  for (let y = 100; y < CH; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
  }

  // Dining area / top strip
  const diningGrad = ctx.createLinearGradient(0, 0, 0, 100);
  diningGrad.addColorStop(0, '#3d2b1a');
  diningGrad.addColorStop(1, '#2a1c0e');
  ctx.fillStyle = diningGrad;
  ctx.fillRect(0, 0, CW, 100);

  // Dining area NPCs (silhouettes)
  drawDiningNPCs();

  // Counter divider
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(0, 95, CW, 18);
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(0, 95, CW, 4);

  // Overhead lights
  for (const lx of [160, 380, 600]) {
    const lg = ctx.createRadialGradient(lx, 110, 0, lx, 140, 120);
    lg.addColorStop(0, 'rgba(255,220,140,0.12)');
    lg.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(lx - 120, 100, 240, 200);
  }

  // Bottle glow on floor
  drawBottleGlow(ST.redBottle,   'rgba(255,0,0,0.1)');
  drawBottleGlow(ST.greenBottle, 'rgba(0,255,0,0.1)');
  drawBottleGlow(ST.blueBottle,  'rgba(0,0,255,0.1)');
}

function drawDiningNPCs() {
  const dishColors = ['#ff6644', '#ffcc44', '#44cc88', '#44aaff', '#cc66ff', '#ff9944'];
  // Draw tables at every dining spot (always visible, even when empty)
  for (let i = 0; i < DINING_SPOTS.length; i++) {
    const spot = DINING_SPOTS[i];
    // Table body
    ctx.fillStyle = '#2e1a08';
    ctx.strokeStyle = '#3e2510';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y + 13, 27, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Table surface highlight
    ctx.fillStyle = '#3c2312';
    ctx.beginPath();
    ctx.ellipse(spot.x - 1, spot.y + 11, 23, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Plate
    ctx.fillStyle = 'rgba(240,232,216,0.9)';
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y + 10, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Food color dot
    ctx.fillStyle = dishColors[i % dishColors.length];
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y + 10, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Draw animated NPCs on top of tables
  for (const npc of diningNPCs) {
    drawDiningNPC(npc);
  }
}

function drawDiningNPC(npc) {
  const { skin, hair, shirt } = npc.type;
  const isMoving = npc.state === 'entering' || npc.state === 'leaving';

  ctx.save();
  ctx.translate(npc.x, npc.y);

  // Flip to face correct direction
  const faceLeft = (npc.state === 'entering') ? (npc.targetX < npc.x)
                 : (npc.state === 'leaving')  ? (npc.exitX < npc.x)
                 : (npc.x > 390); // seated: face toward center
  const scaleX = faceLeft ? -0.58 : 0.58;
  ctx.scale(scaleX, 0.58);

  // Vertical offset (breathing bob, or celebration jump)
  let yOff = 0;
  if (npc.state === 'celebrating') {
    yOff = -Math.abs(Math.sin(npc.idleAnim * 6.5)) * 18;
  } else if (!isMoving) {
    yOff = Math.sin(npc.idleAnim * 1.3) * 1.5;
  }

  // Walking legs
  if (isMoving) {
    const legBob = Math.sin(npc.idleAnim * 9) * 6;
    ctx.fillStyle = '#2a1a00';
    ctx.fillRect(-7, 18, 8, 18 + legBob);
    ctx.fillRect(2,  18, 8, 18 - legBob);
    ctx.fillStyle = '#1a0800';
    ctx.fillRect(-9, 34 + legBob, 12, 5);
    ctx.fillRect( 0, 34 - legBob, 12, 5);
  }

  // Body / torso
  ctx.fillStyle = shirt;
  roundRect(-13, yOff, 28, 22, 5);
  ctx.fill();

  // Head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(1, yOff - 14, 12, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(1, yOff - 20, 10, Math.PI * 0.85, Math.PI * 2.15);
  ctx.fill();
  ctx.fillRect(-9, yOff - 25, 20, 8);

  // Eyes (with occasional blink)
  ctx.fillStyle = '#1a0a00';
  const blink = Math.sin(npc.idleAnim * 0.71) > 0.93;
  if (!blink) {
    ctx.beginPath(); ctx.arc(-3, yOff - 12, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 6, yOff - 12, 2.2, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillRect(-5, yOff - 13, 5, 2);
    ctx.fillRect( 4, yOff - 13, 5, 2);
  }

  // Mouth
  ctx.strokeStyle = '#3a1a00';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (npc.state === 'celebrating') {
    ctx.arc(1, yOff - 6, 5.5, 0, Math.PI);  // big smile
  } else {
    ctx.arc(1, yOff - 6, 4, 0.2, Math.PI - 0.2);  // normal smile
  }
  ctx.stroke();

  // Eating animation (fork → mouth on frame 1)
  if (npc.state === 'seated' && npc.eatFrame === 1) {
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(13, yOff + 10);
    ctx.lineTo(5,  yOff - 9);
    ctx.stroke();
    ctx.fillStyle = '#ff9944';
    ctx.beginPath();
    ctx.arc(4.5, yOff - 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineCap = 'butt';
  }

  // Celebration: arms raised + sparkle ring
  if (npc.state === 'celebrating') {
    ctx.strokeStyle = skin;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    // Left arm up
    ctx.beginPath();
    ctx.moveTo(-13, yOff + 8);
    ctx.lineTo(-25, yOff - 14 + Math.sin(npc.idleAnim * 6) * 5);
    ctx.stroke();
    // Right arm up
    ctx.beginPath();
    ctx.moveTo(15, yOff + 8);
    ctx.lineTo(27, yOff - 14 + Math.sin(npc.idleAnim * 6 + 1.2) * 5);
    ctx.stroke();
    // Orbiting sparkles
    const sc = ['#ffcc00', '#ff66cc', '#66ffcc', '#ff8800'];
    for (let i = 0; i < 4; i++) {
      const a  = (i / 4) * Math.PI * 2 + npc.idleAnim * 2.5;
      const sr = 22 + Math.sin(npc.idleAnim * 3 + i) * 5;
      ctx.fillStyle = sc[i];
      ctx.globalAlpha = 0.88;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * sr, yOff - 14 + Math.sin(a) * sr * 0.5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  }

  ctx.restore();
}

function drawBottleGlow(st, color) {
  const cx = st.x + st.w / 2;
  const cy = st.y + st.h;
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
  grd.addColorStop(0, color.replace('0.1', '0.25'));
  grd.addColorStop(1, color.replace('0.1', '0'));
  ctx.fillStyle = grd;
  ctx.fillRect(cx - 100, cy - 50, 200, 100);
}

// ---- Stations ----
function drawStations() {
  // Serving window
  drawServingWindow();

  // Counter top for bottom stations
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(40, 448, 340, 14); // left counter
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(40, 448, 340, 4);

  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(598, 448, 120, 14); // right counter
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(598, 448, 120, 4);

  // RGB Bottles
  drawBottle(ST.redBottle,   '#ff2222', '#ff6666', 'R');
  drawBottle(ST.greenBottle, '#22cc22', '#66ff66', 'G');
  drawBottle(ST.blueBottle,  '#2244ff', '#6688ff', 'B');

  // Trash can
  drawTrashCan();

  // Recipe book stand
  drawRecipeBookStand();

  // Stove (behind pot)
  drawStove();
}

function drawServingWindow() {
  // Window frame
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(ST.servingWindow.x - 8, ST.servingWindow.y - 8, ST.servingWindow.w + 16, ST.servingWindow.h + 8);
  // Frosted glass
  ctx.fillStyle = 'rgba(180,210,240,0.15)';
  ctx.fillRect(ST.servingWindow.x, ST.servingWindow.y, ST.servingWindow.w, ST.servingWindow.h);
  ctx.strokeStyle = 'rgba(200,230,255,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ST.servingWindow.x, ST.servingWindow.y, ST.servingWindow.w, ST.servingWindow.h);

  // "SERVE" label
  ctx.fillStyle = '#c8a878';
  ctx.font = 'bold 11px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVING WINDOW', ST.servingWindow.x + ST.servingWindow.w / 2, ST.servingWindow.y + ST.servingWindow.h + 14);

  // Menu board (top right)
  drawMenuBoard();
}

function drawMenuBoard() {
  const mx = 490, my = 108, mw = 258, mh = 130;
  // Chalkboard
  ctx.fillStyle = '#1a2a18';
  roundRect(mx, my, mw, mh, 8);
  ctx.fill();
  ctx.strokeStyle = '#4a6a38';
  ctx.lineWidth = 3;
  roundRect(mx, my, mw, mh, 8);
  ctx.stroke();

  ctx.font = 'bold 13px "Caveat", cursive';
  ctx.fillStyle = '#d0e8b0';
  ctx.textAlign = 'center';
  ctx.fillText('ORDERS', mx + mw / 2, my + 20);

  if (customer && customer.state === 'waiting') {
    const tc = customer.order;
    // Color swatch
    ctx.fillStyle = rgbToHex(tc.r, tc.g, tc.b);
    roundRect(mx + 10, my + 28, 50, 40, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    roundRect(mx + 10, my + 28, 50, 40, 6);
    ctx.stroke();

    ctx.fillStyle = '#d0e8b0';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(rgbToHex(tc.r, tc.g, tc.b), mx + 68, my + 44);
    ctx.fillText(`R:${tc.r} G:${tc.g} B:${tc.b}`, mx + 68, my + 60);
    ctx.font = '10px "Caveat", cursive';
    ctx.fillText(getColorName(tc.r, tc.g, tc.b), mx + 68, my + 76);

    // Patience bar
    const pct = Math.max(0, customer.patience / customer.maxPatience);
    ctx.fillStyle = '#2a3a22';
    ctx.fillRect(mx + 10, my + 96, mw - 20, 14);
    const barColor = pct > 0.6 ? '#44dd44' : pct > 0.3 ? '#ddcc22' : '#dd2222';
    ctx.fillStyle = barColor;
    ctx.fillRect(mx + 10, my + 96, (mw - 20) * pct, 14);
    ctx.strokeStyle = '#4a6a38';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx + 10, my + 96, mw - 20, 14);
    ctx.fillStyle = '#d0e8b0';
    ctx.font = '10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Patience', mx + mw / 2, my + 108);
  } else {
    ctx.fillStyle = 'rgba(200,220,160,0.3)';
    ctx.font = '12px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('Waiting for customer...', mx + mw / 2, my + 60);
  }

  // Score display on board
  ctx.fillStyle = '#aaddaa';
  ctx.font = '11px "Caveat", cursive';
  ctx.textAlign = 'right';
  ctx.fillText(`Score: ${score}`, mx + mw - 8, my + mh - 8);
}

function drawBottle(st, colorDark, colorLight, label) {
  const cx = st.x + st.w / 2;
  const bottleW = 32, bottleH = 70;
  const bx = cx - bottleW / 2;
  const by = st.y + 5;

  // Glow
  const grd = ctx.createRadialGradient(cx, by + bottleH / 2, 0, cx, by + bottleH / 2, 50);
  grd.addColorStop(0, colorDark.replace('ff', 'ff') + '33');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(cx - 50, by - 10, 100, 100);

  // Neck
  ctx.fillStyle = colorDark;
  roundRect(bx + 10, by, 12, 18, 3);
  ctx.fill();

  // Body
  const bodyGrad = ctx.createLinearGradient(bx, 0, bx + bottleW, 0);
  bodyGrad.addColorStop(0, colorDark);
  bodyGrad.addColorStop(0.4, colorLight);
  bodyGrad.addColorStop(1, colorDark);
  ctx.fillStyle = bodyGrad;
  roundRect(bx, by + 16, bottleW, bottleH - 16, 8);
  ctx.fill();

  // Liquid fill
  const liqH = (bottleH - 16) * 0.7;
  ctx.fillStyle = colorLight + 'cc';
  ctx.fillRect(bx + 3, by + 16 + (bottleH - 16 - liqH) * 0.5, bottleW - 6, liqH * 0.8);

  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(bx + 4, by + 36, bottleW - 8, 22);
  ctx.fillStyle = '#1a0800';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, by + 52);

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(bx + 6, by + 18, 6, bottleH - 24);
}

function drawTrashCan() {
  const st = ST.trashCan;
  const cx = st.x + st.w / 2;
  // Can body
  ctx.fillStyle = '#3a3a3a';
  roundRect(st.x + 4, st.y + 14, st.w - 8, st.h - 14, 6);
  ctx.fill();
  ctx.strokeStyle = '#5a5a5a';
  ctx.lineWidth = 2;
  roundRect(st.x + 4, st.y + 14, st.w - 8, st.h - 14, 6);
  ctx.stroke();
  // Lid
  ctx.fillStyle = '#555';
  ctx.fillRect(st.x, st.y + 10, st.w, 10);
  roundRect(st.x + 8, st.y, st.w - 16, 14, 3);
  ctx.fill();
  // Lines
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const lx = st.x + 14 + i * 13;
    ctx.beginPath(); ctx.moveTo(lx, st.y + 22); ctx.lineTo(lx, st.y + st.h - 8); ctx.stroke();
  }
  ctx.fillStyle = '#888';
  ctx.font = 'bold 10px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TRASH', cx, st.y + st.h + 14);
}

function drawRecipeBookStand() {
  const st = ST.recipeBook;
  const cx = st.x + st.w / 2;
  // Stand base
  ctx.fillStyle = '#4a3220';
  roundRect(st.x, st.y + 20, st.w, st.h - 20, 6);
  ctx.fill();
  // Book
  ctx.fillStyle = '#6b3a00';
  roundRect(st.x + 4, st.y + 4, st.w - 8, 30, 4);
  ctx.fill();
  ctx.fillStyle = '#d4a030';
  ctx.font = '10px "Caveat", cursive';
  ctx.textAlign = 'center';
  ctx.fillText('RECIPE', cx, st.y + 18);
  ctx.fillText('BOOK', cx, st.y + 30);
  ctx.fillStyle = '#c8a878';
  ctx.font = 'bold 10px Nunito, sans-serif';
  ctx.fillText('RECIPE STAND', cx, st.y + st.h + 14);
}

function drawStove() {
  const st = ST.pot;
  // Stove body
  ctx.fillStyle = '#2a2a2a';
  roundRect(st.x - 10, st.y + st.h - 8, st.w + 20, 28, 6);
  ctx.fill();
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 1;
  roundRect(st.x - 10, st.y + st.h - 8, st.w + 20, 28, 6);
  ctx.stroke();

  // Burner glow
  const burnColor = `rgb(${Math.round(potAnim.r)},${Math.round(potAnim.g * 0.5 + 80)},0)`;
  const bgrd = ctx.createRadialGradient(st.x + st.w/2, st.y + st.h + 8, 0, st.x + st.w/2, st.y + st.h + 8, 60);
  bgrd.addColorStop(0, burnColor + 'aa');
  bgrd.addColorStop(1, 'transparent');
  ctx.fillStyle = bgrd;
  ctx.fillRect(st.x - 20, st.y + st.h - 10, st.w + 40, 60);
}

// ---- Pot / Cauldron ----
function drawPot() {
  const st = ST.pot;
  const cx = st.x + st.w / 2;
  const cy = st.y + st.h / 2;
  const r = Math.round(potAnim.r), g = Math.round(potAnim.g), b = Math.round(potAnim.b);
  const hex = rgbToHex(r, g, b);

  // Pot glow (pulse)
  const pulse = 0.7 + 0.3 * Math.sin(potGlowPulse * 2.2);
  const grd = ctx.createRadialGradient(cx, cy + 10, 10, cx, cy + 10, 80 + pulse * 20);
  grd.addColorStop(0, `rgba(${r},${g},${b},${0.35 * pulse})`);
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(cx - 100, cy - 60, 200, 200);

  // Pot outer (dark iron)
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 20, 60, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(st.x + 2, st.y + 15, st.w - 4, st.h - 15);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 3;
  ctx.strokeRect(st.x + 2, st.y + 15, st.w - 4, st.h - 15);

  // Pot handles
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(st.x - 8, st.y + 50, 12, Math.PI * 0.3, Math.PI * 1.7); ctx.stroke();
  ctx.beginPath(); ctx.arc(st.x + st.w + 8, st.y + 50, 12, -Math.PI * 0.7, Math.PI * 0.7, true); ctx.stroke();

  // Liquid inside
  const liquidY = st.y + 20 + (st.h - 30) * (1 - Math.min(1, potFill * 1.5));
  const liquidH = st.y + st.h - 8 - liquidY;

  if (liquidH > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(st.x + 4, st.y + 18, st.w - 8, st.h - 24);
    ctx.clip();

    // Swirl gradient for the liquid
    const time = Date.now() / 2000;
    const lx1 = cx + Math.cos(time) * 20;
    const ly1 = liquidY + Math.cos(time * 1.3) * 10;
    const swirl = ctx.createRadialGradient(lx1, ly1, 0, cx, cy, 50);
    swirl.addColorStop(0, `rgba(${Math.min(255, r+60)},${Math.min(255, g+60)},${Math.min(255, b+60)},1)`);
    swirl.addColorStop(0.6, hex);
    swirl.addColorStop(1, `rgba(${Math.max(0, r-40)},${Math.max(0, g-40)},${Math.max(0, b-40)},1)`);

    ctx.fillStyle = swirl;
    ctx.fillRect(st.x + 4, liquidY, st.w - 8, liquidH);

    // Surface ripple
    ctx.strokeStyle = `rgba(${Math.min(255, r+80)},${Math.min(255, g+80)},${Math.min(255, b+80)},0.6)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const rippleOffset = Math.sin(Date.now() / 400) * 4;
    ctx.moveTo(st.x + 4, liquidY + rippleOffset);
    for (let x = st.x + 4; x <= st.x + st.w - 8; x += 6) {
      ctx.lineTo(x, liquidY + Math.sin((x - st.x) / 15 + Date.now() / 400) * 4);
    }
    ctx.stroke();

    ctx.restore();
  }

  // Pot rim (top ellipse)
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, st.y + 18, 55, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.ellipse(cx, st.y + 18, 55, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Rim highlight
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, st.y + 16, 54, 13, 0, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  // Draw bubbles
  for (const bub of bubbles) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(bub.x, bub.y, bub.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${Math.min(255, r+100)},${Math.min(255, g+100)},${Math.min(255, b+100)},${bub.life * 0.7})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // Hex code floating above pot
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = `rgba(${r},${g},${b},1)`;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 3;
  ctx.textAlign = 'center';
  const hexText = hex;
  ctx.strokeText(hexText, cx, st.y - 18);
  ctx.fillText(hexText, cx, st.y - 18);

  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(200,180,140,0.9)';
  const rgbText = `R:${r} G:${g} B:${b}`;
  ctx.strokeText(rgbText, cx, st.y - 4);
  ctx.fillText(rgbText, cx, st.y - 4);

  ctx.font = '11px "Caveat", cursive';
  const nameText = getColorName(r, g, b);
  ctx.strokeText(nameText, cx, st.y - 30);
  ctx.fillStyle = 'rgba(255,230,160,0.9)';
  ctx.fillText(nameText, cx, st.y - 30);
}

// ---- Customer ----
function drawCustomer() {
  if (!customer) return;

  const cx = customer.x;
  const cy = customer.y;
  const { skin, hair, shirt } = customer.type;

  // Speech bubble (shown while waiting)
  if (customer.state === 'waiting') {
    const bx = cx + 20, by = cy - 90, bw = 130, bh = 60;
    ctx.fillStyle = 'rgba(255,255,248,0.95)';
    roundRect(bx, by, bw, bh, 10);
    ctx.fill();
    ctx.strokeStyle = '#c8a878';
    ctx.lineWidth = 2;
    roundRect(bx, by, bw, bh, 10);
    ctx.stroke();
    // Tail
    ctx.fillStyle = 'rgba(255,255,248,0.95)';
    ctx.beginPath();
    ctx.moveTo(cx + 20, cy - 30);
    ctx.lineTo(cx + 30, cy - 30);
    ctx.lineTo(cx + 22, cy - 14);
    ctx.closePath();
    ctx.fill();

    // Order color swatch
    const tc = customer.order;
    ctx.fillStyle = rgbToHex(tc.r, tc.g, tc.b);
    roundRect(bx + 6, by + 6, 40, 30, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    roundRect(bx + 6, by + 6, 40, 30, 6);
    ctx.stroke();

    ctx.fillStyle = '#2a1a00';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    const tc2 = customer.order;
    ctx.fillText(rgbToHex(tc2.r, tc2.g, tc2.b), bx + 52, by + 18);
    ctx.fillText(customer.name, bx + 52, by + 32);

    // Expression / animation
    const blink = Math.sin(Date.now() / 400) > 0.96;
    const tap = Math.sin(Date.now() / 300) > 0;

    // Patience indicator
    const pct = customer.patience / customer.maxPatience;
    if (pct < 0.3) {
      // Sweat drop
      ctx.fillStyle = '#66aaff';
      ctx.beginPath();
      ctx.arc(cx - 22, cy - 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Character body
  // Legs
  const legBob = Math.sin(Date.now() / 200) * (customer.state === 'entering' ? 4 : 1.5);
  ctx.fillStyle = '#2a1a00';
  ctx.fillRect(cx - 8, cy + 26, 10, 20 + legBob);
  ctx.fillRect(cx + 2, cy + 26, 10, 20 - legBob);
  // Shoes
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(cx - 10, cy + 44 + legBob, 14, 6);
  ctx.fillRect(cx + 0, cy + 44 - legBob, 14, 6);

  // Body
  ctx.fillStyle = shirt;
  roundRect(cx - 16, cy + 2, 36, 28, 6);
  ctx.fill();
  // Apron strip
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(cx - 4, cy + 6, 12, 20);

  // Head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx + 2, cy - 8, 16, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(cx + 2, cy - 16, 14, Math.PI * 0.9, Math.PI * 2.1);
  ctx.fill();
  ctx.fillRect(cx - 12, cy - 20, 28, 10);

  // Eyes
  ctx.fillStyle = '#1a0a00';
  if (customer.expression === 'angry') {
    ctx.fillRect(cx - 8, cy - 12, 6, 3);
    ctx.fillRect(cx + 4, cy - 12, 6, 3);
  } else {
    ctx.beginPath(); ctx.arc(cx - 4, cy - 10, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, cy - 10, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Mouth
  ctx.strokeStyle = '#1a0a00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (customer.expression === 'happy' || customer.expression === 'ecstatic') {
    ctx.arc(cx + 2, cy - 4, 6, 0.2, Math.PI - 0.2);
  } else if (customer.expression === 'angry') {
    ctx.arc(cx + 2, cy + 2, 5, Math.PI + 0.3, -0.3);
  } else {
    ctx.moveTo(cx - 4, cy - 2); ctx.lineTo(cx + 8, cy - 2);
  }
  ctx.stroke();

  // Name tag
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '9px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(customer.name, cx + 2, cy + 58);
}

// ---- Player (Chef) ----
function drawPlayer() {
  const px = player.x;
  const py = player.y;
  const cx = px + player.w / 2;
  const cy = py + player.h / 2;

  const legAnim = player.animFrame;
  const legOffset = [0, 5, 0, -5][legAnim] || 0;

  // Floor shadow / glow — makes the chef immediately visible
  const shadowGrd = ctx.createRadialGradient(cx, py + player.h - 4, 0, cx, py + player.h - 4, 28);
  shadowGrd.addColorStop(0, 'rgba(255,200,80,0.30)');
  shadowGrd.addColorStop(0.5, 'rgba(255,200,80,0.12)');
  shadowGrd.addColorStop(1, 'rgba(255,200,80,0)');
  ctx.fillStyle = shadowGrd;
  ctx.beginPath();
  ctx.ellipse(cx, py + player.h - 2, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Carrying bottle above head
  if (player.carrying) {
    const bc = player.carrying === 'red' ? '#ff4444' :
               player.carrying === 'green' ? '#44ff44' : '#4488ff';
    ctx.fillStyle = bc;
    ctx.fillRect(cx - 8, py - 28, 16, 24);
    // Bottle cap
    ctx.fillStyle = '#333';
    ctx.fillRect(cx - 4, py - 30, 8, 5);
    // Glow
    const gl = ctx.createRadialGradient(cx, py - 16, 0, cx, py - 16, 24);
    gl.addColorStop(0, bc + '44');
    gl.addColorStop(1, 'transparent');
    ctx.fillStyle = gl;
    ctx.fillRect(cx - 24, py - 40, 48, 48);
  }

  // Legs
  ctx.fillStyle = '#2a1a00';
  ctx.fillRect(cx - 9, py + 30, 10, 16 + legOffset);
  ctx.fillRect(cx + 2, py + 30, 10, 16 - legOffset);
  // Shoes
  ctx.fillStyle = '#1a0a00';
  ctx.fillRect(cx - 11, py + 44 + legOffset, 13, 6);
  ctx.fillRect(cx + 1, py + 44 - legOffset, 13, 6);

  // Apron (body)
  ctx.fillStyle = '#f0f0f0';
  roundRect(cx - 14, py + 8, 30, 26, 6);
  ctx.fill();
  ctx.strokeStyle = '#d0d0d0';
  ctx.lineWidth = 1;
  roundRect(cx - 14, py + 8, 30, 26, 6);
  ctx.stroke();

  // Undershirt (peeking under apron)
  ctx.fillStyle = '#cc6622';
  ctx.fillRect(cx - 14, py + 8, 6, 20);
  ctx.fillRect(cx + 10, py + 8, 6, 20);

  // Head
  ctx.fillStyle = '#f5c8a0';
  ctx.beginPath();
  ctx.arc(cx + 1, py - 2, 15, 0, Math.PI * 2);
  ctx.fill();

  // Chef hat
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(cx - 11, py - 20, 24, 12); // band
  ctx.beginPath();
  ctx.ellipse(cx + 1, py - 20, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 9, py - 34, 20, 16); // puff
  ctx.beginPath();
  ctx.ellipse(cx + 1, py - 34, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 9, py - 34, 20, 16);

  // Eyes
  ctx.fillStyle = '#2a1a00';
  if (player.pouring) {
    // Focused eyes (smaller, angled)
    ctx.fillRect(cx - 5, py - 5, 4, 3);
    ctx.fillRect(cx + 3, py - 5, 4, 3);
  } else {
    ctx.beginPath(); ctx.arc(cx - 4, py - 4, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 6, py - 4, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Mouth (idle smile)
  ctx.strokeStyle = '#5a2a00';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx + 1, py + 2, 5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Interaction hint
  const nearStation = getNearStation();
  if (nearStation) {
    ctx.fillStyle = 'rgba(255,220,100,0.9)';
    ctx.font = 'bold 11px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('[E] ' + getInteractLabel(nearStation), cx, py - 44);
  }
}

function getNearStation() {
  for (const [key, st] of Object.entries(ST)) {
    if (isNear(player, st)) return key;
  }
  return null;
}

function getInteractLabel(stKey) {
  const st = ST[stKey];
  if (st.type === 'bottle') {
    if (!player.carrying) return `Grab ${st.color} bottle`;
    return '';
  }
  if (st.type === 'pot') {
    if (player.carrying) return 'Pour (hold E)';
    return 'Fine-tune mix';
  }
  if (st.type === 'serve') return 'Serve dish';
  if (st.type === 'trash') return 'Dump pot';
  if (st.type === 'recipe') return 'Open recipe book';
  return '';
}

// ---- Particles ----
function drawParticles() {
  // Steam
  for (const s of steamParticles) {
    const r = Math.round(potAnim.r), g = Math.round(potAnim.g), b = Math.round(potAnim.b);
    ctx.save();
    ctx.globalAlpha = s.life * 0.4;
    ctx.fillStyle = `rgba(${r},${g},${b},0.5)`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Pour streams
  for (const s of pourStreams) {
    ctx.save();
    ctx.globalAlpha = s.life / s.maxLife;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(s.fx, s.fy);
    ctx.bezierCurveTo(s.fx, s.fy + 60, s.tx, s.ty - 60, s.tx, s.ty);
    ctx.stroke();
    ctx.restore();
  }

  // General particles
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Celebration particles
  for (const p of celebrationParticles) {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
    ctx.restore();
  }

  // Kitchen cat
  drawCat();
}

function drawCat() {
  const cx = kitchenCat.x;
  const cy = kitchenCat.y;
  const dir = kitchenCat.dir;

  // Body
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(cx + dir * 10, cy - 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#777';
  ctx.beginPath();
  ctx.moveTo(cx + dir * 5, cy - 8);
  ctx.lineTo(cx + dir * 8, cy - 16);
  ctx.lineTo(cx + dir * 12, cy - 8);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx + dir * 12, cy - 3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - dir * 10, cy + 6);
  ctx.quadraticCurveTo(cx - dir * 20, cy - 8, cx - dir * 14, cy - 14);
  ctx.stroke();
}

// ---- UI (canvas-side) ----
function drawUI() {
  // Interaction highlight rings
  for (const [key, st] of Object.entries(ST)) {
    if (isNear(player, st)) {
      ctx.strokeStyle = 'rgba(255,220,100,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(st.x - 4, st.y - 4, st.w + 8, st.h + 8);
      ctx.setLineDash([]);
    }
  }

  // Hint text
  if (hint.timer > 0 && hint.text) {
    const alpha = Math.min(1, hint.timer * 2);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20,10,0,0.75)';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(hint.text).width + 24;
    roundRect(CW / 2 - tw / 2, CH - 44, tw, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#ffcc66';
    ctx.font = '13px "Nunito", sans-serif';
    ctx.fillText(hint.text, CW / 2, CH - 24);
    ctx.restore();
  }

  // Act/level banner at top of canvas (briefly)
  if (hint.timer > 0 && currentLevelIdx < LEVELS.length) {
    // shown via the DOM score display already
  }
}

function drawPatience() {
  if (!customer || customer.state !== 'waiting') return;
  const pct = Math.max(0, customer.patience / customer.maxPatience);
  // Bar above customer head
  const bx = customer.x - 40;
  const by = customer.y - 100;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bx, by, 80, 10);
  const barC = pct > 0.6 ? '#44dd44' : pct > 0.3 ? '#ddcc22' : '#dd2222';
  ctx.fillStyle = barC;
  ctx.fillRect(bx, by, 80 * pct, 10);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, 80, 10);
}

// ============================================================
// HELPERS
// ============================================================
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}
