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

// ---- Level Select ----
let selectedActNum = 1;
let selectedActStartIdx = 0;
let hintUsed = false;

// ---- Pot State ----
let pot = { r: 0, g: 0, b: 0 };
let potAnim = { r: 0, g: 0, b: 0 };
let potFill = 0;

// ---- Order (replaces customer NPC) ----
let order = null;  // { target:{r,g,b}, patience, maxPatience }
let orderBetweenTimer = 0;
let resultTimer = 0;

// ---- Stations ----
// Layout (top-down, per spec):
//  y=0-68:   Dining area strip (visible through serving window)
//  y=68-84:  Kitchen wall / counter divider
//  y=84-380: Kitchen floor — serving window (top-left), order board (top-right), pot (center)
//  y=380-490: Bottom counter — R/G/B bottles (left), trash can (right)
//  y=490-570: Below counter — recipe book stand (bottom-right)
const ST = {
  redBottle:     { x: 22,  y: 388, w: 62, h: 88, type: 'bottle', color: 'red'   },
  greenBottle:   { x: 132, y: 388, w: 62, h: 88, type: 'bottle', color: 'green' },
  blueBottle:    { x: 242, y: 388, w: 62, h: 88, type: 'bottle', color: 'blue'  },
  pot:           { x: 280, y: 190, w: 220, h: 130, type: 'pot'  },
  servingWindow: { x: 14,  y: 46,  w: 175, h: 118, type: 'serve' },
  trashCan:      { x: 648, y: 388, w: 68,  h: 88,  type: 'trash' },
  recipeBook:    { x: 638, y: 488, w: 100, h: 72,  type: 'recipe' },
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

// ---- Chef (Player Character) ----
let chef = { x: 390, y: 350, dir: 'down', animTimer: 0, heldBottle: null };

// ---- Bottle Table State ----
let bottleState = { red: true, green: true, blue: true };

// ---- Keyboard Input ----
const keys = {};

// ---- Levels ----
const LEVELS = [
  // === ACT 1: CULINARY SCHOOL (Tutorial) ===
  { act:1, num:1, target:{r:255,g:0,b:0},   name:'Chef Instructor Marco', dialogue:'Welcome, new chef! Let\'s start simple — can you whip me up some pure Red? Just click that red bottle!',                                    hint:'💡 Pure Red — click the Red bottle to fill the pot!',  patience:65, dE:[10,20,40] },
  { act:1, num:2, target:{r:0,g:255,b:0},   name:'Chef Instructor Marco', dialogue:'Well done! Now I\'d love some pure Green — crisp and bright, like fresh herbs straight from the garden.',                                    hint:'💡 Pure Green — click the Green bottle!',              patience:65, dE:[10,20,40] },
  { act:1, num:3, target:{r:0,g:0,b:255},   name:'Chef Instructor Marco', dialogue:'Excellent technique! Complete the three primaries — pure Blue, please. Like a clear midnight sky over the kitchen.',                        hint:'💡 Pure Blue — click the Blue bottle!',                patience:65, dE:[10,20,40] },
  { act:1, num:4, target:{r:255,g:255,b:0}, name:'Chef Instructor Marco', dialogue:'Here\'s your first puzzle: I want Yellow... but there\'s no yellow bottle! Hint: mixing light is nothing like mixing paint. Surprise!',    hint:'💡 Yellow = Red + Green! Light mixing surprises!',     patience:60, dE:[10,20,40] },
  { act:1, num:5, target:{r:0,g:255,b:255}, name:'Chef Instructor Marco', dialogue:'Nicely done! Now try Cyan — that electric turquoise colour. It\'s made from exactly two primaries. Which two, do you think?',              hint:'💡 Cyan = Green + Blue!',                              patience:60, dE:[10,20,40] },
  { act:1, num:6, target:{r:255,g:0,b:255}, name:'Chef Instructor Marco', dialogue:'Final lesson! Red and Blue together make... Magenta? In light mixing, yes! You\'re graduating — this is your diploma dish!',               hint:'💡 Magenta = Red + Blue!',                             patience:55, dE:[10,20,40] },

  // === ACT 2: LINE COOK (Precision) ===
  { act:2, num:1,  target:{r:255,g:255,b:255}, name:'Brigitte S.',     dialogue:'I\'m craving something pure and bright — pure White, like fresh cream on a clean plate. All three lights combined!',                                    hint:null, patience:45, dE:[5,15,30] },
  { act:2, num:2,  target:{r:255,g:128,b:0},   name:'Tomás Rivera',    dialogue:'I\'m hosting brunch and I need something warm, energetic — a deep Orange. Like sunrise over the horizon. Not too yellow!',                            hint:null, patience:40, dE:[5,15,30] },
  { act:2, num:3,  target:{r:128,g:0,b:255},   name:'Yuki Tanaka',     dialogue:'I want a rich, mysterious Violet — deep purple like eggplant skin. Very precise! Too much Red and the whole dish is ruined.',                         hint:null, patience:38, dE:[5,15,30] },
  { act:2, num:4,  target:{r:0,g:200,b:150},   name:'Fatima Al-Rashid',dialogue:'I\'m craving something specific today... a warm Sea Green. Think tropical lagoon — cool but vibrant, not too blue!',                                hint:null, patience:35, dE:[5,15,30] },
  { act:2, num:5,  target:{r:255,g:50,b:100},  name:'Diego Flores',    dialogue:'I need a fierce Hot Pink — bold, punchy, like neon strawberry. Not too red, not too purple. Salon-level precision!',                                 hint:null, patience:33, dE:[5,15,30] },
  { act:2, num:6,  target:{r:200,g:200,b:50},  name:'Amara Nwosu',     dialogue:'Something earthy and warm — an Olive Gold, like saffron-infused butter sauce. Tricky balance between yellow and grey. Think carefully!',             hint:null, patience:32, dE:[5,15,30] },
  { act:2, num:7,  target:{r:30,g:144,b:255},  name:'Sophie Laurent',  dialogue:'The exact color of a clear afternoon sky — Dodger Blue, soft and airy. I\'ll know instantly if it\'s wrong. I grew up under that sky.',              hint:null, patience:30, dE:[5,15,30] },
  { act:2, num:8,  target:{r:255,g:120,b:70},  name:'Carlos Méndez',   dialogue:'Coral, please — that warm peachy-orange of tropical fish in bright sunlight. Not too red, not too orange. Coastal precision!',                       hint:null, patience:28, dE:[5,15,30] },
  { act:2, num:9,  target:{r:148,g:87,b:235},  name:'Aiko Suzuki',     dialogue:'A dreamy Lavender — soft purple-blue, like lavender fields at dusk. Very specific! It\'s a delicate balance that most chefs get wrong.',             hint:null, patience:26, dE:[5,15,30] },
  { act:2, num:10, target:{r:180,g:30,b:60},   name:'Priya Sharma',    dialogue:'A deep, dark Crimson — aged wine red, rich and complex. A whisper of blue, absolutely zero green. Sommelier-level colour precision!',               hint:null, patience:24, dE:[5,15,30] },

  // === ACT 3: SOUS CHEF (Palette Challenges) ===
  { act:3, num:1, target:{r:0,g:120,b:220},   name:'Event Planner Renée',    dialogue:'I\'m hosting a dinner party tonight! I need a Triadic colour scheme starting from Azure Blue. Three courses, three colours — nail the first!',          hint:null, patience:32, dE:[5,12,25] },
  { act:3, num:2, target:{r:220,g:60,b:0},    name:'Event Planner Renée',    dialogue:'Complementary second course! My starter was Azure — now I need its colour wheel opposite: a vivid Red-Orange. The guests are watching every plate!',    hint:null, patience:30, dE:[5,12,25] },
  { act:3, num:3, target:{r:0,g:180,b:180},   name:'Banquet Host Victor',    dialogue:'Analogous plating challenge! My amuse-bouche was Sea Green — now I need this precise Teal. Same cool family, a step different. Continuity matters!',     hint:null, patience:30, dE:[5,12,25] },
  { act:3, num:4, target:{r:255,g:90,b:50},   name:'Banquet Host Victor',    dialogue:'Split-complementary trio! Teal was course one, now I need a vivid Coral-Orange to complete the split. The geometric balance must be perfect!',          hint:null, patience:28, dE:[5,12,25] },
  { act:3, num:5, target:{r:120,g:0,b:200},   name:'Gallery Owner Miriam',   dialogue:'Triadic dessert platter — three colours 120° apart! Blue and Orange are plated — now I need the perfect Violet to close the triangle. No shortcuts!',   hint:null, patience:27, dE:[5,12,25] },
  { act:3, num:6, target:{r:220,g:40,b:110},  name:'Gallery Owner Miriam',   dialogue:'Tetradic banquet — four courses, four harmonious colours! This Rose Red is third in my rectangle palette. Geometric flavour theory at its finest!',     hint:null, patience:25, dE:[5,12,25] },
  { act:3, num:7, target:{r:255,g:165,b:0},   name:'Wedding Planner Celeste',dialogue:'Five-colour analogous spread for the reception! This warm Amber is the heart of the sequence. Every shade must flow seamlessly into the next!',         hint:null, patience:24, dE:[5,12,25] },
  { act:3, num:8, target:{r:15,g:15,b:130},   name:'Wedding Planner Celeste',dialogue:'The anchor colour for my entire palette collection! Deep Midnight Blue — the foundation everything else builds from. Grand finale. No pressure!',        hint:null, patience:22, dE:[5,12,25] },

  // === ACT 4: HEAD CHEF — THE ACCESSIBLE KITCHEN ===
  { act:4, num:1, target:{r:0,g:160,b:60},   name:'Alex (protanopia)',        dialogue:'Hey chef, I should mention — I have protanopia, so reds and greens look the same to me. I want a dish that looks THIS green to my eyes. Figure out what I actually need!',   hint:null, patience:35, dE:[5,12,25] },
  { act:4, num:2, target:{r:0,g:100,b:200},  name:'Morgan (deuteranopia)',    dialogue:'I have deuteranopia — my red-green perception is shifted. What I described as "vivid blue" may look different to you. Trust the hex code, not my words!',                      hint:null, patience:33, dE:[5,12,25] },
  { act:4, num:3, target:{r:90,g:40,b:180},  name:'Riley (tritanopia)',       dialogue:'Tritanopia here — blues and yellows trip me up. What I see as "cool purple" may look different in full vision. Trust the hex completely. Don\'t trust my description!',         hint:null, patience:33, dE:[5,12,25] },
  { act:4, num:4, target:{r:30,g:100,b:180}, name:'Inspector Valdez',         dialogue:'Inspection time! This background colour needs to achieve 4.5:1 contrast against white text to pass WCAG AA. Mix it precisely — or the restaurant fails its audit!',              hint:null, patience:30, dE:[5,12,25] },
  { act:4, num:5, target:{r:15,g:60,b:120},  name:'Inspector Valdez',         dialogue:'Harder this time — AAA standard! The background must achieve 7:1 contrast against white. No shortcuts. Accessible design is non-negotiable in this kitchen!',                    hint:null, patience:28, dE:[5,12,25] },
  { act:4, num:6, target:{r:20,g:20,b:160},  name:'Event Planner Chen',       dialogue:'Five-colour accessible banquet palette! Every colour must pass 4.5:1 contrast against white for WCAG AA. This Deep Blue is course one. Precision and inclusion!',               hint:null, patience:27, dE:[5,12,25] },
  { act:4, num:7, target:{r:160,g:90,b:0},   name:'Event Planner Chen',       dialogue:'Accessible palette course two — dark background theme! This Rich Amber must pass contrast against near-black. Luminance maths on a plate!',                                      hint:null, patience:25, dE:[5,12,25] },
  { act:4, num:8, target:{r:80,g:0,b:130},   name:'Mixed Special Guests',     dialogue:'Ultimate accessibility round! Colour-blind guests AND an inspector. This Deep Purple must pass WCAG, look distinct through CVD filters, and still be beautiful. Perfection!',    hint:null, patience:22, dE:[5,12,25] },

  // === ACT 5: IRON CHEF CHAMPIONSHIP ===
  { act:5, num:1,  target:{r:139,g:47,b:199},  name:'Critic Dominique',    dialogue:'You have 12 seconds. The colour is #8B2FC7. I saw it once at a restaurant in Paris and I\'ve been chasing it ever since. Don\'t disappoint me.',                patience:15, dE:[3,8,18] },
  { act:5, num:2,  target:{r:255,g:87,b:34},   name:'Critic Dominique',    dialogue:'Deep Vermillion — #FF5722. My grandmother made a dish exactly this colour. I\'ve eaten at three Michelin-starred restaurants since. None matched it. Can you?',    patience:15, dE:[3,8,18] },
  { act:5, num:3,  target:{r:0,g:188,b:212},   name:'Judge Keiko Hara',    dialogue:'Mystery ingredient! Red channel is BROKEN today — max 30 units! Now give me Cyan #00BCD4. A true iron chef adapts to any broken kitchen.',                       patience:15, dE:[3,8,18] },
  { act:5, num:4,  target:{r:233,g:30,b:99},   name:'Judge Keiko Hara',    dialogue:'Memory round! You saw Hot Pink #E91E63 for exactly 3 seconds. It\'s gone now. Mix purely from memory. A true chef never forgets a colour they\'ve seen.',          patience:12, dE:[3,8,18] },
  { act:5, num:5,  target:{r:103,g:58,b:183},  name:'Rush Hour Manager',   dialogue:'Rush hour — the queue is three deep! Deep Purple #673AB7. The critics are watching every plate. Go, go, GO!',                                                       patience:12, dE:[3,8,18] },
  { act:5, num:6,  target:{r:0,g:150,b:136},   name:'Rush Hour Manager',   dialogue:'Teal #009688. Then its complement. Then a split-complementary. Three dishes in sequence — 12 seconds each. The championship record is on the line!',                patience:12, dE:[3,8,18] },
  { act:5, num:7,  target:{r:255,g:193,b:7},   name:'Critic Søren Berg',   dialogue:'Amber #FFC107. Looks simple — scores are not. ΔE threshold is tighter than anything you\'ve seen today. One unit off and your career ends here.',                   patience:15, dE:[2,5,12] },
  { act:5, num:8,  target:{r:76,g:175,b:80},   name:'Critic Søren Berg',   dialogue:'#4CAF50 — but the Green channel is capped at 140 today. Mystery constraint! Figure out another path to this exact colour. Think before you pour.',                   patience:12, dE:[3,8,18] },
  { act:5, num:9,  target:{r:244,g:67,b:54},   name:'Legend Chef Auguste', dialogue:'The boss round. Deep Red #F44336. A legendary critic — 40 years of refined taste. Tolerance: ΔE under 3. This is for everything. Make it count.',                   patience:20, dE:[2,5,12] },
  { act:5, num:10, target:{r:33,g:33,b:33},    name:'Legend Chef Auguste', dialogue:'Final dish. Near-Black #212121. The most deceptively simple order of your life. Mix it exactly. Your entire culinary career ends — or begins — right here.',         patience:18, dE:[2,5,12] },
];

// ---- Fill in hints for Acts 2–5 ----
const LEVEL_HINTS = {
  // Act 2: Line Cook
  '2-1':  '💡 White = all three channels at maximum. Try R:255, G:255, B:255',
  '2-2':  '💡 Orange = max Red + half Green, no Blue. Try R:255, G:128, B:0',
  '2-3':  '💡 Violet = medium Red + max Blue, no Green. Try R:128, G:0, B:255',
  '2-4':  '💡 Sea Green = no Red, high Green, medium Blue. Try R:0, G:200, B:150',
  '2-5':  '💡 Hot Pink = max Red, low Green, some Blue. Try R:255, G:50, B:100',
  '2-6':  '💡 Olive Gold = high R+G, small Blue. Try R:200, G:200, B:50',
  '2-7':  '💡 Dodger Blue = low Red, medium Green, max Blue. Try R:30, G:144, B:255',
  '2-8':  '💡 Coral = max Red, medium Green, some Blue. Try R:255, G:120, B:70',
  '2-9':  '💡 Lavender = medium Red, low Green, high Blue. Try R:148, G:87, B:235',
  '2-10': '💡 Crimson = high Red, tiny Green, tiny Blue. Try R:180, G:30, B:60',
  // Act 3: Sous Chef
  '3-1':  '💡 Triadic palette — Azure Blue starter. Try R:0, G:120, B:220',
  '3-2':  '💡 Complement of Azure Blue. Try R:220, G:60, B:0',
  '3-3':  '💡 Teal — analogous neighbor of Sea Green. Try R:0, G:180, B:180',
  '3-4':  '💡 Split-complement Coral-Orange. Try R:255, G:90, B:50',
  '3-5':  '💡 Violet closes the triadic triangle. Try R:120, G:0, B:200',
  '3-6':  '💡 Rose Red for tetradic palette. Try R:220, G:40, B:110',
  '3-7':  '💡 Warm Amber — analogous anchor. Try R:255, G:165, B:0',
  '3-8':  '💡 Midnight Blue — the palette foundation. Try R:15, G:15, B:130',
  // Act 4: The Accessible Kitchen
  '4-1':  '💡 Protanopia shifts red perception. Actual target: R:0, G:160, B:60',
  '4-2':  '💡 Deuteranopia shifts green perception. Actual target: R:0, G:100, B:200',
  '4-3':  '💡 Tritanopia affects blue/yellow. Actual target: R:90, G:40, B:180',
  '4-4':  '💡 WCAG AA (4.5:1 vs white) = go dark. Try R:30, G:100, B:180',
  '4-5':  '💡 WCAG AAA (7:1 vs white) = go very dark. Try R:15, G:60, B:120',
  '4-6':  '💡 Deep Blue passes AA contrast vs white. Try R:20, G:20, B:160',
  '4-7':  '💡 Rich Amber passes AA contrast vs dark bg. Try R:160, G:90, B:0',
  '4-8':  '💡 Deep Purple — accessible & CVD-distinct. Try R:80, G:0, B:130',
  // Act 5: Iron Chef Championship
  '5-1':  '💡 #8B2FC7 = R:139, G:47, B:199. Move fast!',
  '5-2':  '💡 #FF5722 = R:255, G:87, B:34. Speed is everything!',
  '5-3':  '💡 Red is capped at 30! Cyan = R:0, G:188, B:212. Skip red!',
  '5-4':  '💡 Hot Pink #E91E63 = R:233, G:30, B:99. Trust your memory!',
  '5-5':  '💡 Deep Purple #673AB7 = R:103, G:58, B:183. Rush!',
  '5-6':  '💡 Teal #009688 = R:0, G:150, B:136. Plan the sequence!',
  '5-7':  '💡 Amber #FFC107 = R:255, G:193, B:7. Ultra-tight tolerance!',
  '5-8':  '💡 Green capped at 140! Target ≈ R:76, G:140, B:80',
  '5-9':  '💡 Deep Red #F44336 = R:244, G:67, B:54. Boss round!',
  '5-10': '💡 Near-Black #212121 = R:33, G:33, B:33. Tiny amounts!',
};
LEVELS.forEach(l => {
  if (l.hint === null) l.hint = LEVEL_HINTS[`${l.act}-${l.num}`] || null;
});

// ---- Act Data for Level Select ----
const ACT_DATA = [
  {
    act: 1, name: 'Culinary School', subtitle: 'Tutorial', emoji: '🎓', difficulty: 1,
    description: 'Your first day in the kitchen! Learn the basics of RGB light mixing. Generous patience timers and on-screen hints guide your way. Master the three primary colors and discover how mixing light creates secondary colors.',
    color: '#4CAF50',
  },
  {
    act: 2, name: 'Line Cook', subtitle: 'Precision', emoji: '🍳', difficulty: 2,
    description: 'The real kitchen begins. Customers order specific colors — shown as swatches, hex codes, and named hues. Tighter tolerances and standard patience timers. Can you nail Crimson, Lavender, Coral, and Dodger Blue?',
    color: '#FF9800',
  },
  {
    act: 3, name: 'Sous Chef', subtitle: 'Palette Challenges', emoji: '🎨', difficulty: 3,
    description: 'Customers now want entire palettes — complementary pairs, triadic sets, analogous spreads. Use the Recipe Book stand to plan your color harmony. Geometry and color theory are your tools.',
    color: '#9C27B0',
  },
  {
    act: 4, name: 'The Accessible Kitchen', subtitle: 'Head Chef', emoji: '♿', difficulty: 4,
    description: 'Special guests arrive. Color-blind customers, health inspectors with clipboards, and event planners demand dishes accessible to everyone. Dive into CVD simulation and WCAG contrast ratios.',
    color: '#2196F3',
  },
  {
    act: 5, name: 'Iron Chef Championship', subtitle: 'Endgame', emoji: '🏆', difficulty: 5,
    description: 'The championship stage. Speed rounds, mystery constraints, memory challenges, and legendary food critics. Every skill you\'ve developed gets tested under maximum pressure. Only the best survive.',
    color: '#F44336',
  },
];

// ============================================================
// LEVEL SELECT
// ============================================================
function showLevelSelect() {
  document.getElementById('mainMenu').classList.add('hidden');
  document.getElementById('levelSelect').classList.remove('hidden');
  renderActsGrid();
}

function backToMainMenuFromLS() {
  document.getElementById('levelSelect').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
}

function renderActsGrid() {
  const grid = document.getElementById('actsGrid');
  grid.innerHTML = '';
  grid.classList.remove('hidden');
  document.getElementById('actDetail').classList.add('hidden');

  ACT_DATA.forEach(act => {
    const levels = LEVELS.filter(l => l.act === act.act);
    const diffStr = '⭐'.repeat(act.difficulty) + '☆'.repeat(5 - act.difficulty);
    const card = document.createElement('div');
    card.className = 'act-card';
    card.style.setProperty('--act-color', act.color);
    card.onclick = () => showActDetail(act.act);
    card.innerHTML = `
      <div class="act-card-emoji">${act.emoji}</div>
      <div class="act-card-num">Act ${act.act}</div>
      <div class="act-card-name">${act.name}</div>
      <div class="act-card-sub">${act.subtitle}</div>
      <div class="act-card-meta">${levels.length} levels &nbsp;·&nbsp; ${diffStr}</div>
    `;
    grid.appendChild(card);
  });
}

function showActDetail(actNum) {
  selectedActNum = actNum;
  const act = ACT_DATA.find(a => a.act === actNum);
  const levels = LEVELS.filter(l => l.act === actNum);

  document.getElementById('actsGrid').classList.add('hidden');
  const detail = document.getElementById('actDetail');
  detail.classList.remove('hidden');
  detail.style.setProperty('--act-color', act.color);

  const badge = document.getElementById('actDetailBadge');
  badge.textContent = `Act ${act.act}`;
  badge.style.borderColor = act.color + '88';
  badge.style.color = act.color;
  document.getElementById('actDetailTitle').textContent = `${act.emoji} ${act.name}`;
  document.getElementById('actDetailSub').textContent = act.subtitle;
  document.getElementById('actDetailDesc').textContent = act.description;

  const listEl = document.getElementById('actLevelList');
  listEl.innerHTML = levels.map(l => {
    const hex = rgbToHex(l.target.r, l.target.g, l.target.b);
    const preview = l.dialogue.length > 68 ? l.dialogue.slice(0, 68) + '…' : l.dialogue;
    const hasHint = !!l.hint;
    return `<div class="level-list-item">
      <span class="level-list-num">${l.act}-${l.num}</span>
      <span class="level-list-swatch" style="background:${hex}" title="${hex}"></span>
      <div class="level-list-info">
        <span class="level-list-name">${l.name}</span>
        <span class="level-list-desc">"${preview}"</span>
      </div>
      ${hasHint ? '<span class="level-list-hint-dot" title="Hint available">💡</span>' : ''}
    </div>`;
  }).join('');
}

function showActsList() {
  document.getElementById('actDetail').classList.add('hidden');
  document.getElementById('actsGrid').classList.remove('hidden');
}

function startSelectedAct() {
  const idx = LEVELS.findIndex(l => l.act === selectedActNum);
  selectedActStartIdx = idx >= 0 ? idx : 0;
  document.getElementById('levelSelect').classList.add('hidden');
  document.getElementById('gameMode').classList.remove('hidden');
  initGame();
  AudioManager.start();
}

// ============================================================
// HINT SYSTEM
// ============================================================
function useHint() {
  if (!order) { hint.text = 'Wait for an active order first!'; hint.timer = 2; return; }
  if (hintUsed) { hint.text = 'Hint already used for this order!'; hint.timer = 2; return; }
  const level = LEVELS[currentLevelIdx] || LEVELS[LEVELS.length - 1];
  if (!level.hint) { hint.text = 'No hint available for this level.'; hint.timer = 2; return; }

  hintUsed = true;
  const isTutorial = level.act === 1;
  const costText = isTutorial ? ' (free — tutorial!)' : ' (−100 pts)';
  hint.text = level.hint + costText;
  hint.timer = 9;

  const btn = document.getElementById('hintBtn');
  if (btn) { btn.textContent = '💡 Used'; btn.disabled = true; }
}

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

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') { handleEscape(); return; }
      const movKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'];
      if (movKeys.includes(e.code)) { e.preventDefault(); keys[e.code] = true; }
      if (e.code === 'KeyE') { e.preventDefault(); if (gameState === 'playing') handleInteract(); }
      if (e.code === 'KeyQ') { e.preventDefault(); if (gameState === 'playing') handleDrop(); }
      if (e.code === 'KeyH') { e.preventDefault(); if (gameState === 'playing') useHint(); }
    });
    document.addEventListener('keyup', (e) => { keys[e.code] = false; });

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
      // Require chef to be nearby — clicking from across the kitchen does nothing
      const proxMap = { bottle: 72, pot: 130, serve: 130, trash: 100, recipe: 100 };
      const prox = proxMap[st.type] || 100;
      const scx = st.x + st.w / 2;
      const scy = st.type === 'serve' ? st.y + st.h : st.y + st.h / 2;
      if (Math.hypot(chef.x - scx, chef.y - scy) > prox) {
        hint.text = 'Walk closer to the station first!';
        hint.timer = 2;
        return;
      }
      activateStation(key, st);
      return;
    }
  }
}

function activateStation(_key, st) {
  if (st.type === 'bottle') {
    // Bottles are picked up by walking close — click on canvas is secondary
    if (!chef.heldBottle && bottleState[st.color]) {
      chef.heldBottle = st.color;
      bottleState[st.color] = false;
      hint.text = `Picked up ${st.color} bottle! Walk to pot and press E to pour.`;
      hint.timer = 3;
    } else if (chef.heldBottle) {
      hint.text = 'Already holding a bottle! Press Q to put it back first.';
      hint.timer = 2;
    }
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
  showLevelSelect();
}

function startPlaying() {
  document.getElementById('controlsOverlay').classList.add('hidden');
  gameState = 'playing';
  score = 0; lives = 3; starsTotal = 0; currentLevelIdx = selectedActStartIdx;
  pot = { r: 0, g: 0, b: 0 };
  potAnim = { r: 0, g: 0, b: 0 };
  potFill = 0;
  order = null;
  orderBetweenTimer = 0;
  hintUsed = false;
  chef = { x: 390, y: 350, dir: 'down', animTimer: 0, heldBottle: null };
  bottleState = { red: true, green: true, blue: true };
  const hBtnInit = document.getElementById('hintBtn');
  if (hBtnInit) { hBtnInit.textContent = '💡 Hint'; hBtnInit.disabled = false; }

  hint.text = 'Move with WASD! Walk to a bottle to pick it up, then carry it to the pot and press E to pour.';
  hint.timer = 8;

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
  document.getElementById('levelSelect').classList.add('hidden');
  document.getElementById('mainMenu').classList.remove('hidden');
  document.getElementById('pauseMenu').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('servingResult').classList.add('hidden');
  document.getElementById('controlsOverlay').classList.remove('hidden');
}

function restartGame() {
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('servingResult').classList.add('hidden');
  score = 0; lives = 3; starsTotal = 0; currentLevelIdx = selectedActStartIdx;
  pot = { r: 0, g: 0, b: 0 };
  potAnim = { r: 0, g: 0, b: 0 };
  potFill = 0;
  order = null;
  orderBetweenTimer = 0;
  hintUsed = false;
  chef = { x: 390, y: 350, dir: 'down', animTimer: 0, heldBottle: null };
  bottleState = { red: true, green: true, blue: true };
  particles = []; pourStreams = []; celebrationParticles = [];
  const hBtnR = document.getElementById('hintBtn');
  if (hBtnR) { hBtnR.textContent = '💡 Hint'; hBtnR.disabled = false; }
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
    // Cycle through Act 5 endlessly after completing all acts
    const act5Start = LEVELS.findIndex(l => l.act === 5);
    currentLevelIdx = act5Start >= 0 ? act5Start : LEVELS.length - 10;
  }
  const level = LEVELS[currentLevelIdx];
  hintUsed = false;
  const hBtn = document.getElementById('hintBtn');
  if (hBtn) { hBtn.textContent = '💡 Hint'; hBtn.disabled = false; }
  order = {
    target: { ...level.target },
    patience: level.patience,
    maxPatience: level.patience,
  };
  // Auto-show hints only in Act 1 (tutorial) — later acts require the player to request them
  if (level.act === 1 && level.hint) {
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

// ============================================================
// CHEF MOVEMENT & INTERACTION
// ============================================================
function updateChef(dt) {
  if (gameState !== 'playing') return;

  const isUp    = keys['KeyW'] || keys['ArrowUp'];
  const isDown  = keys['KeyS'] || keys['ArrowDown'];
  const isLeft  = keys['KeyA'] || keys['ArrowLeft'];
  const isRight = keys['KeyD'] || keys['ArrowRight'];

  let dx = 0, dy = 0;
  if (isLeft)  dx -= 1;
  if (isRight) dx += 1;
  if (isUp)    dy -= 1;
  if (isDown)  dy += 1;

  // Normalize diagonal
  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  const speed = keys['Space'] ? 210 : 130;
  chef.x += dx * speed * dt;
  chef.y += dy * speed * dt;

  // Clamp to kitchen floor
  chef.x = Math.max(14, Math.min(CW - 14, chef.x));
  chef.y = Math.max(92, Math.min(CH - 26, chef.y));

  // Update facing direction
  if (Math.abs(dx) > Math.abs(dy)) {
    chef.dir = dx > 0 ? 'right' : 'left';
  } else if (dy !== 0) {
    chef.dir = dy > 0 ? 'down' : 'up';
  }

  // Advance walk animation
  if (dx !== 0 || dy !== 0) chef.animTimer += dt * 5;

  // Auto-pickup: walk close to a bottle that is on the table
  if (!chef.heldBottle) {
    for (const key of ['redBottle', 'greenBottle', 'blueBottle']) {
      const st = ST[key];
      if (!bottleState[st.color]) continue;
      const dist = Math.hypot(chef.x - (st.x + st.w / 2), chef.y - (st.y + st.h / 2));
      if (dist < 56) {
        chef.heldBottle = st.color;
        bottleState[st.color] = false;
        hint.text = `Picked up ${st.color} bottle! Walk to pot, press E to pour, Q to put back.`;
        hint.timer = 3.5;
        break;
      }
    }
  }
}

function handleInteract() {
  // Near pot?
  const potCx = ST.pot.x + ST.pot.w / 2;
  const potCy = ST.pot.y + ST.pot.h / 2;
  if (Math.hypot(chef.x - potCx, chef.y - potCy) < 115) {
    if (chef.heldBottle) {
      const clr = chef.heldBottle === 'red' ? '#ff4444' : chef.heldBottle === 'green' ? '#44ff44' : '#4466ff';
      if (chef.heldBottle === 'red')   pot.r = Math.min(255, pot.r + 51);
      if (chef.heldBottle === 'green') pot.g = Math.min(255, pot.g + 51);
      if (chef.heldBottle === 'blue')  pot.b = Math.min(255, pot.b + 51);
      potFill = (pot.r + pot.g + pot.b) / (255 * 3);
      spawnPourDrop(chef.x, chef.y - 10, potCx, ST.pot.y + ST.pot.h * 0.65, clr);
      hint.text = `Poured ${chef.heldBottle.toUpperCase()}! Press E again to add more. Empty-handed at pot = fine-tune.`;
      hint.timer = 2;
    } else {
      openSlider();
    }
    return;
  }

  // Near serving window (kitchen side)?
  const swCx = ST.servingWindow.x + ST.servingWindow.w / 2;
  const swCy = ST.servingWindow.y + ST.servingWindow.h;
  if (Math.hypot(chef.x - swCx, chef.y - swCy) < 110) {
    serveOrder();
    return;
  }

  // Near trash can?
  const trCx = ST.trashCan.x + ST.trashCan.w / 2;
  const trCy = ST.trashCan.y + ST.trashCan.h / 2;
  if (Math.hypot(chef.x - trCx, chef.y - trCy) < 85) {
    if (chef.heldBottle) { bottleState[chef.heldBottle] = true; chef.heldBottle = null; }
    pot = { r: 0, g: 0, b: 0 };
    potFill = 0;
    spawnSplash(ST.trashCan.x + 34, ST.trashCan.y + 30, '#555');
    hint.text = 'Pot dumped! Start fresh.';
    hint.timer = 3;
    return;
  }

  hint.text = 'Walk closer to a station, then press E.';
  hint.timer = 2;
}

function handleDrop() {
  if (!chef.heldBottle) { hint.text = 'Not holding anything!'; hint.timer = 1.5; return; }
  bottleState[chef.heldBottle] = true;
  hint.text = `Placed ${chef.heldBottle} bottle back on the table.`;
  hint.timer = 2;
  chef.heldBottle = null;
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
  // Hint penalty: –100 pts for using a hint in non-tutorial acts
  if (hintUsed && level.act !== 1 && pts > 0) pts = Math.max(0, pts - 100);
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
  const lvlForResult = LEVELS[currentLevelIdx] || LEVELS[LEVELS.length - 1];
  const hintNote = (hintUsed && lvlForResult.act !== 1 && stars > 0) ? '  |  💡 Hint (−100 pts)' : '';
  document.getElementById('deltaEDisplay').textContent = `Color distance ΔE: ${de.toFixed(1)}${hintNote}`;

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
    updateChef(dt);

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
  drawChef();
  drawHoverHighlight();
  drawHint();
  drawHeldBottleHUD();
}

// ---- Kitchen Background ----
function drawKitchen() {
  // ====================================================
  // 1. DINING AREA — top strip (y=0 to 68)
  // ====================================================
  const diningGrad = ctx.createLinearGradient(0, 0, 0, 68);
  diningGrad.addColorStop(0, '#1c1008');
  diningGrad.addColorStop(1, '#2c1a0e');
  ctx.fillStyle = diningGrad;
  ctx.fillRect(0, 0, CW, 68);

  // Warm pendant lights in dining area
  for (const lx of [170, 420, 640]) {
    const lg = ctx.createRadialGradient(lx, 10, 0, lx, 20, 90);
    lg.addColorStop(0, 'rgba(255,200,100,0.20)');
    lg.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(lx - 90, 0, 180, 68);
  }

  // Table silhouettes
  for (const [tx] of [[210], [430], [640]]) {
    ctx.fillStyle = 'rgba(65,38,14,0.65)';
    ctx.beginPath();
    ctx.ellipse(tx, 54, 44, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Plate on table
    ctx.fillStyle = 'rgba(210,190,150,0.35)';
    ctx.beginPath();
    ctx.ellipse(tx, 54, 11, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Patron silhouettes (heads above tables)
  for (const px of [230, 390, 460, 620, 655]) {
    ctx.fillStyle = 'rgba(45,25,10,0.60)';
    ctx.beginPath();
    ctx.arc(px, 36, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle "DINING AREA" label
  ctx.fillStyle = 'rgba(255,200,100,0.18)';
  ctx.font = '9px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— DINING AREA —', CW / 2, 14);

  // ====================================================
  // 2. KITCHEN WALL — horizontal divider (y=68 to 84)
  // ====================================================
  ctx.fillStyle = '#3d2510';
  ctx.fillRect(0, 68, CW, 16);
  ctx.fillStyle = '#5c3a1c';
  ctx.fillRect(0, 68, CW, 3);   // top edge highlight
  ctx.fillStyle = '#261508';
  ctx.fillRect(0, 81, CW, 3);   // bottom edge shadow

  // Serving window cuts THROUGH the wall — re-draw dining background inside it
  const sw = ST.servingWindow;
  const dBgCut = ctx.createLinearGradient(sw.x, 68, sw.x, 84);
  dBgCut.addColorStop(0, '#2c1a0e');
  dBgCut.addColorStop(1, '#1e1208');
  ctx.fillStyle = dBgCut;
  ctx.fillRect(sw.x, 68, sw.w, 16);

  // ====================================================
  // 3. KITCHEN FLOOR — tiles (y=84 to CH)
  // ====================================================
  const floorGrad = ctx.createLinearGradient(0, 84, 0, CH);
  floorGrad.addColorStop(0, '#221410');
  floorGrad.addColorStop(1, '#150e07');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, 84, CW, CH - 84);

  // Dark tile grid
  ctx.strokeStyle = 'rgba(255,200,100,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CW; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 84); ctx.lineTo(x, CH); ctx.stroke();
  }
  for (let y = 84; y < CH; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
  }

  // ====================================================
  // 4. OVERHEAD KITCHEN LIGHTS
  // ====================================================
  for (const lx of [100, 390, 680]) {
    const lg = ctx.createRadialGradient(lx, 110, 0, lx, 140, 130);
    lg.addColorStop(0, 'rgba(255,220,140,0.10)');
    lg.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(lx - 130, 84, 260, 220);
  }

  // ====================================================
  // 5. BOTTLE GLOW ON FLOOR
  // ====================================================
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

  // Counter top for R/G/B bottles (left section, bottom row)
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(10, 381, 308, 14);
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(10, 381, 308, 4);

  // Counter top for trash + recipe book stand (right section, bottom row)
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(630, 381, 102, 14);
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(630, 381, 102, 4);

  drawBottle(ST.redBottle,   '#ff2222', '#ff6666', 'R', bottleState.red);
  drawBottle(ST.greenBottle, '#22cc22', '#66ff66', 'G', bottleState.green);
  drawBottle(ST.blueBottle,  '#2244ff', '#6688ff', 'B', bottleState.blue);

  drawTrashCan();
  drawRecipeBookStand();
}

function drawServingWindowArea() {
  const st = ST.servingWindow;
  const cx = st.x + st.w / 2;

  // Outer wooden frame embedded in the wall
  ctx.fillStyle = '#2a1808';
  roundRect(st.x - 9, st.y - 9, st.w + 18, st.h + 6, 7);
  ctx.fill();

  // Dining area visible through the window — gradient matching dining bg
  const dBg = ctx.createLinearGradient(st.x, st.y, st.x, st.y + st.h * 0.55);
  dBg.addColorStop(0, '#2c1a0e');
  dBg.addColorStop(1, '#1e1208');
  ctx.fillStyle = dBg;
  roundRect(st.x, st.y, st.w, st.h, 5);
  ctx.fill();

  // Frosted glass tint
  ctx.fillStyle = 'rgba(180,210,240,0.13)';
  roundRect(st.x, st.y, st.w, st.h, 5);
  ctx.fill();

  // Glass border
  ctx.strokeStyle = 'rgba(200,230,255,0.55)';
  ctx.lineWidth = 2;
  roundRect(st.x, st.y, st.w, st.h, 5);
  ctx.stroke();

  // Warm glow from dining area (no customer NPCs — orders only)
  const dineGlow = ctx.createRadialGradient(cx, st.y + 20, 0, cx, st.y + 20, 60);
  dineGlow.addColorStop(0, 'rgba(255,200,100,0.12)');
  dineGlow.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = dineGlow;
  ctx.fillRect(st.x, st.y, st.w, st.h * 0.55);

  // Horizontal sill line (wall / counter edge inside window)
  ctx.strokeStyle = 'rgba(90,60,25,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(st.x + 4, st.y + st.h * 0.58);
  ctx.lineTo(st.x + st.w - 4, st.y + st.h * 0.58);
  ctx.stroke();

  // "SERVE HERE" pulsing label (kitchen-side, below sill)
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 600);
  ctx.fillStyle = `rgba(200,220,255,${pulse})`;
  ctx.font = 'bold 13px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▲ SERVE HERE', cx, st.y + st.h * 0.74);

  ctx.fillStyle = 'rgba(180,200,255,0.75)';
  ctx.font = '10px Nunito, sans-serif';
  ctx.fillText('(press E to serve)', cx, st.y + st.h * 0.90);
}

function drawBottle(st, colorDark, colorLight, label, isOnTable) {
  const cx = st.x + st.w / 2;
  const bottleW = 32, bottleH = 70;
  const bx = cx - bottleW / 2;
  const by = st.y + 5;

  // If bottle is being carried by chef, draw a faint empty outline in its place
  if (!isOnTable) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = colorDark;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    roundRect(bx + 10, by, 12, 18, 3);
    ctx.stroke();
    roundRect(bx, by + 16, bottleW, bottleH - 16, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = colorDark;
    ctx.font = 'bold 9px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('(held)', cx, st.y + st.h + 14);
    ctx.restore();
    return;
  }

  // Glow
  const grd = ctx.createRadialGradient(cx, by + bottleH / 2, 0, cx, by + bottleH / 2, 50);
  grd.addColorStop(0, colorDark + '33');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
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

  // Pickup hint label below
  ctx.fillStyle = 'rgba(200,180,140,0.75)';
  ctx.font = 'bold 10px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('auto-pickup', cx, st.y + st.h + 14);
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

  const burnColor = `rgba(${Math.round(potAnim.r)},${Math.round(potAnim.g * 0.5 + 80)},0,0.67)`;
  const bgrd = ctx.createRadialGradient(st.x + st.w / 2, st.y + st.h + 8, 0, st.x + st.w / 2, st.y + st.h + 8, 60);
  bgrd.addColorStop(0, burnColor);
  bgrd.addColorStop(1, 'rgba(0,0,0,0)');
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
  grd.addColorStop(1, 'rgba(0,0,0,0)');
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

// ---- Order Board / Customer Dialogue (top-right) ----
function drawOrderPanel() {
  const px = 502, py = 84, pw = 270, ph = 240;

  // ── Chalkboard panel ──────────────────────────────────
  ctx.fillStyle = '#182616';
  roundRect(px, py, pw, ph, 10);
  ctx.fill();

  // Subtle chalk texture (horizontal scan lines)
  ctx.fillStyle = 'rgba(255,255,255,0.012)';
  for (let ly = py + 2; ly < py + ph; ly += 5) ctx.fillRect(px + 2, ly, pw - 4, 2);

  ctx.strokeStyle = '#3d6830';
  ctx.lineWidth = 3;
  roundRect(px, py, pw, ph, 10);
  ctx.stroke();

  // Inner chalk-frame edge
  ctx.strokeStyle = 'rgba(100,160,70,0.25)';
  ctx.lineWidth = 1;
  roundRect(px + 5, py + 5, pw - 10, ph - 10, 7);
  ctx.stroke();

  // Header: "ORDER BOARD"
  ctx.font = 'bold 13px "Caveat", cursive';
  ctx.fillStyle = '#b8d898';
  ctx.textAlign = 'center';
  ctx.fillText('— ORDER BOARD —', px + pw / 2, py + 17);

  // Header divider
  ctx.strokeStyle = 'rgba(100,160,70,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px + 14, py + 22); ctx.lineTo(px + pw - 14, py + 22); ctx.stroke();

  if (!order) {
    // ── Waiting state ────────────────────────────────────
    const dots = '.'.repeat(Math.floor(Date.now() / 400) % 4);
    ctx.fillStyle = 'rgba(180,220,140,0.45)';
    ctx.font = '14px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.fillText(`Next customer coming${dots}`, px + pw / 2, py + ph / 2);
    return;
  }

  const tc = order.target;
  const hex = rgbToHex(tc.r, tc.g, tc.b);
  const level = LEVELS[currentLevelIdx] || LEVELS[LEVELS.length - 1];
  const custName = level.name || 'Customer';
  const dialogue = level.dialogue || 'Match the color shown below!';

  // ── Speech bubble area ────────────────────────────────
  const sbX = px + 10, sbY = py + 27, sbW = pw - 20, sbH = 108;
  ctx.fillStyle = 'rgba(230,255,200,0.07)';
  roundRect(sbX, sbY, sbW, sbH, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,180,70,0.30)';
  ctx.lineWidth = 1;
  roundRect(sbX, sbY, sbW, sbH, 7);
  ctx.stroke();

  // Speech-mark opening quote
  ctx.fillStyle = 'rgba(150,220,100,0.35)';
  ctx.font = 'bold 22px "Caveat", cursive';
  ctx.textAlign = 'left';
  ctx.fillText('"', sbX + 6, sbY + 20);

  // Dialogue text (word-wrapped, max 4 lines)
  ctx.fillStyle = '#ddffc0';
  ctx.font = '11px "Nunito", sans-serif';
  ctx.textAlign = 'left';
  const dialogueLines = getWrappedLines(ctx, dialogue, sbW - 26);
  let lineY = sbY + 20;
  const lineH = 16;
  for (const ln of dialogueLines.slice(0, 5)) {
    ctx.fillText(ln, sbX + 18, lineY);
    lineY += lineH;
  }

  // Closing quote + customer name attribution
  const nameY = sbY + sbH - 10;
  ctx.fillStyle = 'rgba(150,220,100,0.35)';
  ctx.font = 'bold 14px "Caveat", cursive';
  ctx.textAlign = 'right';
  ctx.fillText('"', sbX + sbW - 6, nameY);

  ctx.fillStyle = '#88cc70';
  ctx.font = 'italic 10px "Nunito", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`— ${custName}`, sbX + sbW - 14, nameY);

  // ── Section divider ───────────────────────────────────
  const divY = py + 141;
  ctx.strokeStyle = 'rgba(80,140,55,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px + 14, divY); ctx.lineTo(px + pw - 14, divY); ctx.stroke();

  // ── Colour swatch + info ──────────────────────────────
  const swY = divY + 6;
  const swW = 52, swH = 42;

  // Swatch
  ctx.fillStyle = hex;
  roundRect(px + 12, swY, swW, swH, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.5;
  roundRect(px + 12, swY, swW, swH, 7);
  ctx.stroke();

  // Hex code (large, monospace)
  ctx.fillStyle = '#e8ffd8';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(hex, px + 74, swY + 16);

  // RGB values
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#90c878';
  ctx.fillText(`R:${tc.r}  G:${tc.g}  B:${tc.b}`, px + 74, swY + 30);

  // Food-themed colour name (centred below swatch row)
  ctx.fillStyle = '#ffeebb';
  ctx.font = '11px "Caveat", cursive';
  ctx.textAlign = 'center';
  ctx.fillText(getColorName(tc.r, tc.g, tc.b), px + pw / 2, swY + swH + 12);

  // ── Patience bar ──────────────────────────────────────
  const pct   = Math.max(0, order.patience / order.maxPatience);
  const barX  = px + 12, barY = divY + 68, barW = pw - 24, barH = 14;

  ctx.fillStyle = '#1e2e1a';
  ctx.fillRect(barX, barY, barW, barH);

  const barColor = pct > 0.6 ? '#44dd44' : pct > 0.3 ? '#ddcc22' : '#dd2222';
  ctx.fillStyle = barColor;
  ctx.fillRect(barX, barY, Math.round(barW * pct), barH);

  ctx.strokeStyle = '#3a5a28';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = '#c0e0a0';
  ctx.font = 'bold 9px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PATIENCE', px + pw / 2, barY + 10);

  // Hurry flash
  if (pct < 0.3) {
    if (Math.sin(Date.now() / 140) > 0) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 11px "Nunito", sans-serif';
      ctx.fillText('⚠ HURRY!', px + pw / 2, barY + 26);
    }
  }

  // ── Footer: instruction + score ───────────────────────
  ctx.fillStyle = 'rgba(160,210,120,0.55)';
  ctx.font = '9px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mix the colour above → click SERVE HERE', px + pw / 2, py + ph - 24);

  ctx.fillStyle = '#88bb78';
  ctx.font = '10px "Caveat", cursive';
  ctx.textAlign = 'right';
  ctx.fillText(`Score: ${score}  ⭐ ${starsTotal}`, px + pw - 10, py + ph - 10);
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
// CHEF DRAWING
// ============================================================
function drawChef() {
  const cx = Math.round(chef.x);
  const cy = Math.round(chef.y);
  // Walk cycle: legs/arms swing only while moving
  const isMoving = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
                   keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'];
  const swingAmt = isMoving ? 6 : 0;
  const swing = Math.sin(chef.animTimer * Math.PI * 2) * swingAmt;

  ctx.save();

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 24, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#1e1e3a';
  ctx.fillRect(cx - 9, cy + 9 + swing, 8, 16);
  ctx.fillRect(cx + 1, cy + 9 - swing, 8, 16);

  // Shoes
  ctx.fillStyle = '#111128';
  ctx.fillRect(cx - 11, cy + 23 + swing, 10, 5);
  ctx.fillRect(cx,      cy + 23 - swing, 10, 5);

  // Arms
  ctx.fillStyle = '#f4c470';
  ctx.fillRect(cx - 18, cy - 4 + swing, 7, 12);
  ctx.fillRect(cx + 11, cy - 4 - swing, 7, 12);

  // Body (white chef coat)
  ctx.fillStyle = '#f4f4f4';
  roundRect(cx - 11, cy - 12, 22, 22, 5);
  ctx.fill();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1.5;
  roundRect(cx - 11, cy - 12, 22, 22, 5);
  ctx.stroke();

  // Apron center stripe
  ctx.fillStyle = '#e0e0e0';
  ctx.fillRect(cx - 5, cy - 8, 10, 18);

  // Coat buttons
  ctx.fillStyle = '#aaaaaa';
  ctx.beginPath(); ctx.arc(cx, cy - 4, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy + 2, 1.5, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = '#f4c470';
  ctx.beginPath();
  ctx.arc(cx, cy - 18, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d4a450';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#1a0800';
  ctx.beginPath(); ctx.arc(cx - 4, cy - 19, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 4, cy - 19, 2, 0, Math.PI * 2); ctx.fill();

  // Smile
  ctx.strokeStyle = '#8a3800';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy - 15, 4, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Chef hat — brim
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 13, cy - 31, 26, 5);
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 13, cy - 31, 26, 5);

  // Chef hat — tall part
  ctx.fillStyle = '#ffffff';
  roundRect(cx - 9, cy - 50, 18, 20, 3);
  ctx.fill();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  roundRect(cx - 9, cy - 50, 18, 20, 3);
  ctx.stroke();

  // Hat fold stripe
  ctx.fillStyle = '#e8e8e8';
  ctx.fillRect(cx - 9, cy - 40, 18, 3);

  // Held bottle — shown raised above chef's head
  if (chef.heldBottle) {
    const bCol  = { red: '#ee2222', green: '#22cc22', blue: '#2244ff' };
    const bLit  = { red: '#ff6666', green: '#66ff66', blue: '#6688ff' };
    const bLbl  = { red: 'R', green: 'G', blue: 'B' };
    const dark  = bCol[chef.heldBottle];
    const light = bLit[chef.heldBottle];
    const lbl   = bLbl[chef.heldBottle];
    const bx = cx - 8;
    const topY = cy - 72;

    // Glow halo
    const gGrd = ctx.createRadialGradient(cx, topY + 16, 3, cx, topY + 16, 20);
    gGrd.addColorStop(0, dark + 'bb');
    gGrd.addColorStop(1, dark + '00');
    ctx.fillStyle = gGrd;
    ctx.fillRect(cx - 20, topY - 4, 40, 40);

    // Neck
    ctx.fillStyle = dark;
    ctx.fillRect(cx - 3, topY, 6, 8);

    // Body gradient
    const bGrd = ctx.createLinearGradient(bx, 0, bx + 16, 0);
    bGrd.addColorStop(0, dark);
    bGrd.addColorStop(0.4, light);
    bGrd.addColorStop(1, dark);
    ctx.fillStyle = bGrd;
    roundRect(bx, topY + 7, 16, 22, 4);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(bx + 2, topY + 9, 4, 14);

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(bx + 3, topY + 13, 10, 11);
    ctx.fillStyle = '#1a0800';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(lbl, cx, topY + 22);
  }

  ctx.restore();
}

// ---- Bottom-left HUD: held bottle status ----
function drawHeldBottleHUD() {
  const x = 10, y = CH - 88;
  ctx.save();

  ctx.fillStyle = 'rgba(10,6,0,0.80)';
  roundRect(x, y, 140, 52, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,80,0.22)';
  ctx.lineWidth = 1;
  roundRect(x, y, 140, 52, 8);
  ctx.stroke();

  if (chef.heldBottle) {
    const bCol = { red: '#ff4444', green: '#44ff44', blue: '#4466ff' };
    const bc = bCol[chef.heldBottle];

    // Color circle
    ctx.fillStyle = bc;
    ctx.beginPath();
    ctx.arc(x + 24, y + 26, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Letter in circle
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(chef.heldBottle[0].toUpperCase(), x + 24, y + 31);

    // Text
    ctx.fillStyle = '#ffcc66';
    ctx.font = 'bold 10px Nunito, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Holding: ' + chef.heldBottle, x + 44, y + 18);
    ctx.fillStyle = 'rgba(200,180,140,0.8)';
    ctx.font = '9px Nunito, sans-serif';
    ctx.fillText('E = pour into pot', x + 44, y + 30);
    ctx.fillText('Q = put back on table', x + 44, y + 41);
  } else {
    ctx.fillStyle = 'rgba(160,140,100,0.75)';
    ctx.font = '10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Walk to a bottle to pick up', x + 70, y + 22);
    ctx.fillStyle = 'rgba(130,110,80,0.65)';
    ctx.font = '9px Nunito, sans-serif';
    ctx.fillText('WASD = move   E = interact   Q = drop', x + 70, y + 36);
  }

  ctx.restore();
}

// ============================================================
// HELPERS
// ============================================================

// Returns an array of word-wrapped lines for canvas text rendering
function getWrappedLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

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
