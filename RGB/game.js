// ============================================================
// RGB CHEF'S KITCHEN — Game Engine (Click-to-Play)
// No character sprites — click stations to interact!
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
let potAnim = { r: 0, g: 0, b: 0 };
let potFill = 0;

// ---- Order (replaces customer NPC) ----
let order = null;  // { target:{r,g,b}, patience, maxPatience }
let orderBetweenTimer = 0;
let resultTimer = 0;

// ---- Stations ----
const ST = {
  redBottle:     { x: 60,  y: 455, w: 64, h: 90, type: 'bottle', color: 'red'   },
  greenBottle:   { x: 175, y: 455, w: 64, h: 90, type: 'bottle', color: 'green' },
  blueBottle:    { x: 290, y: 455, w: 64, h: 90, type: 'bottle', color: 'blue'  },
  pot:           { x: 300, y: 250, w: 120, h: 100, type: 'pot'  },
  servingWindow: { x: 70,  y: 110, w: 150, h: 70,  type: 'serve' },
  trashCan:      { x: 620, y: 455, w: 68,  h: 90,  type: 'trash' },
  recipeBook:    { x: 615, y: 340, w: 80,  h: 80,  type: 'recipe' },
};

// ---- Particles ----
let particles = [];
let bubbles = [];
let steamParticles = [];
let celebrationParticles = [];
let pourStreams = [];
let potGlowPulse = 0;

// ---- Hover ----
let hoveredStation = null;

// ---- Hint ----
let hint = { text: '', timer: 0 };

// ---- Game Slider Primary Constraint ----
let gameSelectedPrimaries = ['r', 'g'];
let gameListenersAdded = false;
let gameLoopRunning = false;
let lastTime = 0;

// ---- Levels ----
const LEVELS = [
  // Act 1: Tutorial
  { act:1, num:1, target:{r:255,g:0,b:0},   hint:'💡 Pure Red — click the Red bottle to fill the pot!',       patience:65, dE:[10,20,40] },
  { act:1, num:2, target:{r:0,g:255,b:0},   hint:'💡 Pure Green — click the Green bottle!',                   patience:65, dE:[10,20,40] },
  { act:1, num:3, target:{r:0,g:0,b:255},   hint:'💡 Pure Blue — click the Blue bottle!',                     patience:65, dE:[10,20,40] },
  { act:1, num:4, target:{r:255,g:255,b:0}, hint:'💡 Yellow = Red + Green! Light mixing surprises!',          patience:60, dE:[10,20,40] },
  { act:1, num:5, target:{r:0,g:255,b:255}, hint:'💡 Cyan = Green + Blue!',                                   patience:60, dE:[10,20,40] },
  { act:1, num:6, target:{r:255,g:0,b:255}, hint:'💡 Magenta = Red + Blue!',                                  patience:55, dE:[10,20,40] },
  // Act 2: Line Cook
  { act:2, num:1, target:{r:255,g:255,b:255}, hint:null, patience:45, dE:[5,15,30] },
  { act:2, num:2, target:{r:255,g:128,b:0},   hint:null, patience:40, dE:[5,15,30] },
  { act:2, num:3, target:{r:128,g:0,b:255},   hint:null, patience:38, dE:[5,15,30] },
  { act:2, num:4, target:{r:0,g:200,b:150},   hint:null, patience:35, dE:[5,15,30] },
  { act:2, num:5, target:{r:255,g:50,b:100},  hint:null, patience:33, dE:[5,15,30] },
  { act:2, num:6, target:{r:200,g:200,b:50},  hint:null, patience:32, dE:[5,15,30] },
];

// ============================================================
// INIT
// ============================================================
function initGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  for (let i = 0; i < 8; i++) spawnBubble();

  if (!gameListenersAdded) {
    // Canvas click → interact with stations
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CW / rect.width;
      const scaleY = CH / rect.height;
      handleCanvasClick(
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top)  * scaleY
      );
    });

    // Hover for cursor/highlight
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CW / rect.width;
      const scaleY = CH / rect.height;
      handleCanvasHover(
        (e.clientX - rect.left) * scaleX,
        (e.clientY - rect.top)  * scaleY
      );
    });
    canvas.addEventListener('mouseleave', () => {
      hoveredStation = null;
      canvas.style.cursor = 'default';
    });

    // ESC for pause
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') handleEscape();
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    gameListenersAdded = true;
  }
}

// ============================================================
// MOUSE INTERACTION
// ============================================================
function handleCanvasHover(x, y) {
  hoveredStation = null;
  if (gameState !== 'playing') return;
  for (const [key, st] of Object.entries(ST)) {
    if (x >= st.x && x <= st.x + st.w && y >= st.y && y <= st.y + st.h) {
      hoveredStation = key;
      break;
    }
  }
  canvas.style.cursor = hoveredStation ? 'pointer' : 'default';
}

function handleCanvasClick(x, y) {
  if (gameState !== 'playing') return;
  for (const [key, st] of Object.entries(ST)) {
    if (x >= st.x && x <= st.x + st.w && y >= st.y && y <= st.y + st.h) {
      activateStation(key, st);
      return;
    }
  }
}

function activateStation(_key, st) {
  if (st.type === 'bottle') {
    const amount = 25; // units per click
    const clr = st.color === 'red' ? '#ff4444' : st.color === 'green' ? '#44ff44' : '#4444ff';
    if (st.color === 'red')   pot.r = Math.min(255, pot.r + amount);
    if (st.color === 'green') pot.g = Math.min(255, pot.g + amount);
    if (st.color === 'blue')  pot.b = Math.min(255, pot.b + amount);
    potFill = (pot.r + pot.g + pot.b) / (255 * 3);
    // Arc pour stream from bottle to pot
    spawnPourDrop(st.x + st.w / 2, st.y + 15, ST.pot.x + 60, ST.pot.y + 60, clr);
    return;
  }
  if (st.type === 'pot') {
    openSlider();
    return;
  }
  if (st.type === 'serve') {
    serveOrder();
    return;
  }
  if (st.type === 'trash') {
    pot = { r: 0, g: 0, b: 0 };
    potFill = 0;
    spawnSplash(ST.trashCan.x + 34, ST.trashCan.y + 30, '#555');
    hint.text = 'Pot dumped! Start fresh.';
    hint.timer = 3;
    return;
  }
  if (st.type === 'recipe') {
    hint.text = '📖 Check the Recipe Learn tab for color tips!';
    hint.timer = 4;
  }
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
  order = null;
  orderBetweenTimer = 0;

  hint.text = 'Click the colored bottles to pour! Click the Serving Window to serve.';
  hint.timer = 7;

  updateScoreDisplay();
  spawnOrder();

  lastTime = performance.now();
  if (!gameLoopRunning) {
    gameLoopRunning = true;
    requestAnimationFrame(gameLoop);
  }
}

function resumeGame() {
  document.getElementById('pauseMenu').classList.add('hidden');
  gameState = 'playing';
  lastTime = performance.now();
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
  order = null;
  orderBetweenTimer = 0;
  particles = []; pourStreams = []; celebrationParticles = [];
  updateScoreDisplay();
  spawnOrder();
  gameState = 'playing';
  lastTime = performance.now();
  if (!gameLoopRunning) {
    gameLoopRunning = true;
    requestAnimationFrame(gameLoop);
  }
}

// ============================================================
// ORDER SYSTEM
// ============================================================
function spawnOrder() {
  if (currentLevelIdx >= LEVELS.length) {
    currentLevelIdx = 6; // cycle from Act 2
  }
  const level = LEVELS[currentLevelIdx];
  order = {
    target: { ...level.target },
    patience: level.patience,
    maxPatience: level.patience,
  };
  if (level.hint) {
    hint.text = level.hint;
    hint.timer = 6;
  }
}

function updateOrder(dt) {
  if (!order) return;
  order.patience -= dt;
  if (order.patience <= 0) {
    order.patience = 0;
    lives--;
    updateScoreDisplay();
    const prevPot = { r: Math.round(pot.r), g: Math.round(pot.g), b: Math.round(pot.b) };
    showResult(0, order.target, prevPot, deltaE(order.target, prevPot));
    pot = { r: 0, g: 0, b: 0 };
    potFill = 0;
    order = null;
  }
}

function serveOrder() {
  if (!order) {
    hint.text = 'No active order! Wait for the next one.';
    hint.timer = 3;
    return;
  }
  if (gameState !== 'playing') return;

  const target = order.target;
  const mixed = { r: Math.round(pot.r), g: Math.round(pot.g), b: Math.round(pot.b) };
  const de = deltaE(target, mixed);

  const level = LEVELS[currentLevelIdx] || LEVELS[LEVELS.length - 1];
  const thresholds = level.dE;

  let stars = 0;
  if (de < thresholds[0]) stars = 3;
  else if (de < thresholds[1]) stars = 2;
  else if (de < thresholds[2]) stars = 1;

  let pts = [0, 200, 500, 1000][stars];
  if (stars === 3) {
    const speedBonus = Math.floor((order.patience / order.maxPatience) * 500);
    pts += speedBonus + 200;
    spawnCelebration(CW / 2, CH / 2);
  }
  if (stars === 0) lives--;

  score += pts;
  starsTotal += stars;
  updateScoreDisplay();

  showResult(stars, target, mixed, de);

  pot = { r: 0, g: 0, b: 0 };
  potFill = 0;
  order = null;
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
  document.getElementById('yourColorBox').style.background   = rgbToHex(mixed.r,  mixed.g,  mixed.b);
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
  orderBetweenTimer = 1.0;
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
// GAME SLIDER PRIMARY CONSTRAINT
// ============================================================
function detectPrimariesFromPot() {
  const vals = [
    { p: 'r', v: Math.round(pot.r) },
    { p: 'g', v: Math.round(pot.g) },
    { p: 'b', v: Math.round(pot.b) },
  ];
  vals.sort((a, b) => b.v - a.v);
  if (vals[0].v === 0) return ['r', 'g'];
  return [vals[0].p, vals[1].p];
}

function toggleGamePrimary(which) {
  if (gameSelectedPrimaries.includes(which)) return;
  const all = ['r', 'g', 'b'];
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
  const sliderIds = { r: 'rSlider', g: 'gSlider', b: 'bSlider' };
  const valIds    = { r: 'rVal',    g: 'gVal',    b: 'bVal'    };
  const lockIds   = { r: 'rLock',   g: 'gLock',   b: 'bLock'   };

  for (const p of ['r', 'g', 'b']) {
    const slider = document.getElementById(sliderIds[p]);
    const lockEl = document.getElementById(lockIds[p]);
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
  gameSelectedPrimaries = detectPrimariesFromPot();
  updateGamePrimaryUI();
  applyGameSliderConstraints();
  updateSliderPreview();
  document.getElementById('sliderOverlay').classList.remove('hidden');
  gameState = 'paused';
}

function updatePotFromSlider() {
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
// PARTICLES
// ============================================================
function spawnBubble() {
  const px = ST.pot.x + 15 + Math.random() * (ST.pot.w - 30);
  const py = ST.pot.y + ST.pot.h * (1 - potFill) + Math.random() * 20;
  bubbles.push({ x: px, y: py, r: 2 + Math.random() * 5, vy: -(20 + Math.random() * 30), life: 1 });
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
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: tx, y: ty,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50 - 20,
      life: 0.5, maxLife: 0.5,
      color, r: 3,
    });
  }
}

function spawnSplash(x, y, color) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 60;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      life: 0.7, maxLife: 0.7,
      color, r: 3 + Math.random() * 4,
    });
  }
}

function spawnCelebration(x, y) {
  const colors = ['#ffcc00', '#ff4488', '#44ccff', '#88ff44', '#ff8844'];
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 150;
    celebrationParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      life: 1.5, maxLife: 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      r: 4 + Math.random() * 5,
      gravity: 60,
    });
  }
}

function updateParticles(dt) {
  // Bubbles
  const bubblesPerSec = 3 + potFill * 8;
  if (Math.random() < bubblesPerSec * dt) spawnBubble();
  for (const b of bubbles) { b.y += b.vy * dt; b.life -= dt * 0.9; }
  bubbles = bubbles.filter(b => b.life > 0 && b.y > ST.pot.y);

  // Steam
  if (Math.random() < (1 + potFill * 3) * dt) spawnSteam();
  for (const s of steamParticles) {
    s.x += s.vx * dt; s.y += s.vy * dt;
    s.life -= dt / s.maxLife;
    s.r += dt * 2;
  }
  steamParticles = steamParticles.filter(s => s.life > 0);

  // General
  for (const p of particles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.life -= dt / p.maxLife;
  }
  particles = particles.filter(p => p.life > 0);

  // Celebration
  for (const p of celebrationParticles) {
    p.x += p.vx * dt; p.y += p.vy * dt;
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
    updateParticles(dt);
    updateOrder(dt);

    if (!order && orderBetweenTimer > 0) {
      orderBetweenTimer -= dt;
      if (orderBetweenTimer <= 0) spawnOrder();
    }

    if (hint.timer > 0) hint.timer -= dt;
  }

  if (gameState === 'result') {
    resultTimer -= dt;
    if (resultTimer <= 0) closeResult();
    updateParticles(dt);
  }

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
  drawOrderPanel();
  drawParticles();
  drawHoverHighlight();
  drawHint();
}

// ---- Kitchen Background ----
function drawKitchen() {
  // Floor
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

  // Top bar (behind serving window area)
  const topGrad = ctx.createLinearGradient(0, 0, 0, 100);
  topGrad.addColorStop(0, '#1e1208');
  topGrad.addColorStop(1, '#2a1c0e');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, CW, 100);

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
  drawServingWindowArea();
  drawStove();

  // Counter tops
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(40, 448, 340, 14);
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(40, 448, 340, 4);

  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(598, 448, 120, 14);
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(598, 448, 120, 4);

  drawBottle(ST.redBottle,   '#ff2222', '#ff6666', 'R');
  drawBottle(ST.greenBottle, '#22cc22', '#66ff66', 'G');
  drawBottle(ST.blueBottle,  '#2244ff', '#6688ff', 'B');

  drawTrashCan();
  drawRecipeBookStand();
}

function drawServingWindowArea() {
  // Window frame
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(ST.servingWindow.x - 8, ST.servingWindow.y - 8, ST.servingWindow.w + 16, ST.servingWindow.h + 8);
  // Frosted glass
  ctx.fillStyle = 'rgba(180,210,240,0.15)';
  ctx.fillRect(ST.servingWindow.x, ST.servingWindow.y, ST.servingWindow.w, ST.servingWindow.h);
  ctx.strokeStyle = 'rgba(200,230,255,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ST.servingWindow.x, ST.servingWindow.y, ST.servingWindow.w, ST.servingWindow.h);

  // "SERVE HERE" pulsing label
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 600);
  ctx.fillStyle = `rgba(200,220,255,${pulse})`;
  ctx.font = 'bold 13px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▲ SERVE HERE', ST.servingWindow.x + ST.servingWindow.w / 2, ST.servingWindow.y + 40);

  ctx.fillStyle = 'rgba(180,200,255,0.7)';
  ctx.font = '10px Nunito, sans-serif';
  ctx.fillText('(click to serve)', ST.servingWindow.x + ST.servingWindow.w / 2, ST.servingWindow.y + 56);
}

function drawBottle(st, colorDark, colorLight, label) {
  const cx = st.x + st.w / 2;
  const bottleW = 32, bottleH = 70;
  const bx = cx - bottleW / 2;
  const by = st.y + 5;

  // Glow
  const grd = ctx.createRadialGradient(cx, by + bottleH / 2, 0, cx, by + bottleH / 2, 50);
  grd.addColorStop(0, colorDark + '33');
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(cx - 50, by - 10, 100, 100);

  // Neck
  ctx.fillStyle = colorDark;
  roundRect(bx + 10, by, 12, 18, 3);
  ctx.fill();

  // Body gradient
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

  // "Click to pour" label below
  ctx.fillStyle = 'rgba(200,180,140,0.75)';
  ctx.font = 'bold 10px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('click to pour', cx, st.y + st.h + 14);
}

function drawTrashCan() {
  const st = ST.trashCan;
  const cx = st.x + st.w / 2;
  ctx.fillStyle = '#3a3a3a';
  roundRect(st.x + 4, st.y + 14, st.w - 8, st.h - 14, 6);
  ctx.fill();
  ctx.strokeStyle = '#5a5a5a';
  ctx.lineWidth = 2;
  roundRect(st.x + 4, st.y + 14, st.w - 8, st.h - 14, 6);
  ctx.stroke();
  ctx.fillStyle = '#555';
  ctx.fillRect(st.x, st.y + 10, st.w, 10);
  roundRect(st.x + 8, st.y, st.w - 16, 14, 3);
  ctx.fill();
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
  ctx.fillStyle = '#4a3220';
  roundRect(st.x, st.y + 20, st.w, st.h - 20, 6);
  ctx.fill();
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
  ctx.fillStyle = '#2a2a2a';
  roundRect(st.x - 10, st.y + st.h - 8, st.w + 20, 28, 6);
  ctx.fill();
  ctx.strokeStyle = '#4a4a4a';
  ctx.lineWidth = 1;
  roundRect(st.x - 10, st.y + st.h - 8, st.w + 20, 28, 6);
  ctx.stroke();

  const burnColor = `rgb(${Math.round(potAnim.r)},${Math.round(potAnim.g * 0.5 + 80)},0)`;
  const bgrd = ctx.createRadialGradient(st.x + st.w / 2, st.y + st.h + 8, 0, st.x + st.w / 2, st.y + st.h + 8, 60);
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

  // Glow pulse
  const pulse = 0.7 + 0.3 * Math.sin(potGlowPulse * 2.2);
  const grd = ctx.createRadialGradient(cx, cy + 10, 10, cx, cy + 10, 80 + pulse * 20);
  grd.addColorStop(0, `rgba(${r},${g},${b},${0.35 * pulse})`);
  grd.addColorStop(1, 'transparent');
  ctx.fillStyle = grd;
  ctx.fillRect(cx - 100, cy - 60, 200, 200);

  // Pot body
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 20, 60, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(st.x + 2, st.y + 15, st.w - 4, st.h - 15);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 3;
  ctx.strokeRect(st.x + 2, st.y + 15, st.w - 4, st.h - 15);

  // Handles
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(st.x - 8, st.y + 50, 12, Math.PI * 0.3, Math.PI * 1.7); ctx.stroke();
  ctx.beginPath(); ctx.arc(st.x + st.w + 8, st.y + 50, 12, -Math.PI * 0.7, Math.PI * 0.7, true); ctx.stroke();

  // Liquid
  const liquidY = st.y + 20 + (st.h - 30) * (1 - Math.min(1, potFill * 1.5));
  const liquidH = st.y + st.h - 8 - liquidY;

  if (liquidH > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(st.x + 4, st.y + 18, st.w - 8, st.h - 24);
    ctx.clip();

    const time = Date.now() / 2000;
    const lx1 = cx + Math.cos(time) * 20;
    const ly1 = liquidY + Math.cos(time * 1.3) * 10;
    const swirl = ctx.createRadialGradient(lx1, ly1, 0, cx, cy, 50);
    swirl.addColorStop(0, `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},1)`);
    swirl.addColorStop(0.6, hex);
    swirl.addColorStop(1, `rgba(${Math.max(0, r - 40)},${Math.max(0, g - 40)},${Math.max(0, b - 40)},1)`);
    ctx.fillStyle = swirl;
    ctx.fillRect(st.x + 4, liquidY, st.w - 8, liquidH);

    // Ripple
    ctx.strokeStyle = `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},0.6)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = st.x + 4; x <= st.x + st.w - 8; x += 6) {
      const yy = liquidY + Math.sin((x - st.x) / 15 + Date.now() / 400) * 4;
      if (x === st.x + 4) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();

    ctx.restore();
  }

  // Rim
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(cx, st.y + 18, 55, 14, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath(); ctx.ellipse(cx, st.y + 18, 55, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, st.y + 16, 54, 13, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();

  // Bubbles
  for (const bub of bubbles) {
    ctx.beginPath();
    ctx.arc(bub.x, bub.y, bub.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${Math.min(255, r + 100)},${Math.min(255, g + 100)},${Math.min(255, b + 100)},${bub.life * 0.7})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Hex / RGB labels above pot
  ctx.font = '13px "JetBrains Mono", monospace';
  ctx.fillStyle = `rgba(${r},${g},${b},1)`;
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 3;
  ctx.textAlign = 'center';
  ctx.strokeText(hex, cx, st.y - 18); ctx.fillText(hex, cx, st.y - 18);

  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(200,180,140,0.9)';
  ctx.strokeText(`R:${r} G:${g} B:${b}`, cx, st.y - 4);
  ctx.fillText(`R:${r} G:${g} B:${b}`, cx, st.y - 4);

  ctx.font = '11px "Caveat", cursive';
  ctx.strokeText(getColorName(r, g, b), cx, st.y - 32);
  ctx.fillStyle = 'rgba(255,230,160,0.9)';
  ctx.fillText(getColorName(r, g, b), cx, st.y - 32);

  // "Click pot to fine-tune" label
  ctx.fillStyle = 'rgba(180,160,100,0.55)';
  ctx.font = '9px Nunito, sans-serif';
  ctx.fillText('click pot to fine-tune', cx, st.y + st.h + 26);
}

// ---- Big Order Panel (right side) ----
function drawOrderPanel() {
  const px = 460, py = 110, pw = 300, ph = 200;

  // Chalkboard background
  ctx.fillStyle = '#1a2a18';
  roundRect(px, py, pw, ph, 10);
  ctx.fill();
  ctx.strokeStyle = '#4a7a38';
  ctx.lineWidth = 3;
  roundRect(px, py, pw, ph, 10);
  ctx.stroke();

  // Title
  ctx.font = 'bold 16px "Caveat", cursive';
  ctx.fillStyle = '#d0e8b0';
  ctx.textAlign = 'center';
  ctx.fillText('CURRENT ORDER', px + pw / 2, py + 22);

  // Divider
  ctx.strokeStyle = 'rgba(100,160,80,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 12, py + 28);
  ctx.lineTo(px + pw - 12, py + 28);
  ctx.stroke();

  if (order) {
    const tc = order.target;
    const hex = rgbToHex(tc.r, tc.g, tc.b);

    // Big color swatch
    ctx.fillStyle = hex;
    roundRect(px + 12, py + 34, 80, 60, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    roundRect(px + 12, py + 34, 80, 60, 8);
    ctx.stroke();

    // Hex and RGB
    ctx.fillStyle = '#e8ffd8';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(hex, px + 104, py + 60);

    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#b0d8a0';
    ctx.fillText(`R: ${tc.r}`, px + 104, py + 78);
    ctx.fillText(`G: ${tc.g}`, px + 104, py + 94);
    ctx.fillText(`B: ${tc.b}`, px + 104, py + 110);

    // Color name
    ctx.fillStyle = '#ffeeaa';
    ctx.font = '12px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.fillText(getColorName(tc.r, tc.g, tc.b), px + pw / 2, py + 108);

    // Patience bar
    const pct = Math.max(0, order.patience / order.maxPatience);
    const barX = px + 12, barY = py + 118, barW = pw - 24, barH = 18;

    ctx.fillStyle = '#2a3a22';
    ctx.fillRect(barX, barY, barW, barH);

    const barColor = pct > 0.6 ? '#44dd44' : pct > 0.3 ? '#ddcc22' : '#dd2222';
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, barW * pct, barH);

    ctx.strokeStyle = '#4a6a38';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#d0e8b0';
    ctx.font = 'bold 10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PATIENCE', px + pw / 2, barY + 13);

    // Time warning
    if (pct < 0.3) {
      const flash = Math.sin(Date.now() / 150) > 0;
      if (flash) {
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 12px Nunito, sans-serif';
        ctx.fillText('⚠ HURRY!', px + pw / 2, py + 154);
      }
    }

    // Instruction
    ctx.fillStyle = 'rgba(180,220,140,0.6)';
    ctx.font = '10px Nunito, sans-serif';
    ctx.fillText('Mix the color above, then click SERVE HERE', px + pw / 2, py + 168);

    // Score on panel
    ctx.fillStyle = '#aaddaa';
    ctx.font = '11px "Caveat", cursive';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}  ⭐ ${starsTotal}`, px + pw - 10, py + ph - 8);

  } else {
    // Waiting for next order
    const dots = '.'.repeat(Math.floor(Date.now() / 400) % 4);
    ctx.fillStyle = 'rgba(200,220,160,0.5)';
    ctx.font = '15px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.fillText(`Next order coming${dots}`, px + pw / 2, py + 90);
  }
}

// ---- Particles & Effects ----
function drawParticles() {
  // Steam
  const r = Math.round(potAnim.r), g = Math.round(potAnim.g), b = Math.round(potAnim.b);
  for (const s of steamParticles) {
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
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.fx, s.fy);
    ctx.bezierCurveTo(s.fx, s.fy + 60, s.tx, s.ty - 60, s.tx, s.ty);
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.restore();
  }

  // General splash particles
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Celebration confetti
  for (const p of celebrationParticles) {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
    ctx.restore();
  }
}

// ---- Station hover highlight ----
function drawHoverHighlight() {
  if (!hoveredStation) return;
  const st = ST[hoveredStation];
  ctx.strokeStyle = 'rgba(255,220,80,0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(st.x - 4, st.y - 4, st.w + 8, st.h + 8);
  ctx.setLineDash([]);

  // Tooltip
  const labels = {
    redBottle:     'Click to pour Red (+25)',
    greenBottle:   'Click to pour Green (+25)',
    blueBottle:    'Click to pour Blue (+25)',
    pot:           'Click to fine-tune mix',
    servingWindow: 'Click to serve the dish',
    trashCan:      'Click to dump pot',
    recipeBook:    'Click for recipe tips',
  };
  const label = labels[hoveredStation] || '';
  if (!label) return;

  ctx.save();
  ctx.font = 'bold 12px Nunito, sans-serif';
  const tw = ctx.measureText(label).width + 18;
  const tx = Math.min(st.x + st.w / 2 - tw / 2, CW - tw - 6);
  const ty = st.y - 32;
  ctx.fillStyle = 'rgba(20,10,0,0.85)';
  roundRect(tx, ty, tw, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#ffee88';
  ctx.textAlign = 'left';
  ctx.fillText(label, tx + 9, ty + 16);
  ctx.restore();
}

// ---- Hint text at bottom ----
function drawHint() {
  if (hint.timer <= 0 || !hint.text) return;
  const alpha = Math.min(1, hint.timer * 2);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '13px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(hint.text).width + 24;
  ctx.fillStyle = 'rgba(20,10,0,0.80)';
  roundRect(CW / 2 - tw / 2, CH - 44, tw, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#ffcc66';
  ctx.fillText(hint.text, CW / 2, CH - 24);
  ctx.restore();
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
