/* ═══════════════════════════════════════════════════════════════
   SCIENCE EXPERIMENT GENERATOR — app.js
═══════════════════════════════════════════════════════════════ */

/* ─── SYSTEM PROMPT ─── */
const SYSTEM_PROMPT = `You are a K-12 science experiment designer. You create safe, educational, hands-on science experiments using common household materials.

When given a grade level and a list of available supplies, generate ONE complete experiment.

Format your response in markdown as follows:

[DIFFICULTY: Easy|Medium|Hard]

# {Experiment Title}

## Overview
A 2-3 sentence description of what this experiment demonstrates.

## Materials Needed
- List each material with quantity

## Safety Notes
- List any safety precautions (if none, say "No special safety precautions needed for this experiment.")

## Procedure
1. Numbered step-by-step instructions
2. Be specific and clear
3. Appropriate for the grade level

## What's Happening? (The Science)
Explain the scientific principles in age-appropriate language for the specified grade level.

## Expected Results
Describe what the student should observe.

## Substitutions
For each material used, suggest 1-2 common household alternatives:
- {Material}: Can substitute with {Alternative 1} or {Alternative 2}

Tailor vocabulary, complexity, and explanation depth to the grade level:
- K-2: Simple words, 5-8 steps max, focus on observation and wonder
- 3-5: Introduce basic scientific terms, 6-10 steps, simple cause-and-effect
- 6-8: Use proper scientific terminology, can include measurement and data collection, explain underlying mechanisms
- 9-12: Advanced concepts, precise measurements, hypothesis-driven, connect to broader scientific principles`;

/* ─── SUPPLY DATA ─── */
const SUPPLIES = [
  {
    id: 'liquids',
    label: '🧴 Liquids',
    items: [
      { id: 'water',           name: 'Water',           emoji: '💧' },
      { id: 'vinegar',         name: 'Vinegar',         emoji: '🫙' },
      { id: 'cooking-oil',     name: 'Cooking Oil',     emoji: '🍶' },
      { id: 'milk',            name: 'Milk',            emoji: '🥛' },
      { id: 'dish-soap',       name: 'Dish Soap',       emoji: '🧴' },
      { id: 'rubbing-alcohol', name: 'Rubbing Alcohol', emoji: '💊' },
      { id: 'lemon-juice',     name: 'Lemon Juice',     emoji: '🍋' },
      { id: 'food-coloring',   name: 'Food Coloring',   emoji: '🎨' },
    ]
  },
  {
    id: 'powders',
    label: '🧂 Powders & Solids',
    items: [
      { id: 'baking-soda',  name: 'Baking Soda', emoji: '🥄' },
      { id: 'salt',         name: 'Salt',         emoji: '🧂' },
      { id: 'sugar',        name: 'Sugar',        emoji: '🍚' },
      { id: 'flour',        name: 'Flour',        emoji: '🍞' },
      { id: 'cornstarch',   name: 'Cornstarch',   emoji: '🌽' },
      { id: 'ice-cubes',    name: 'Ice Cubes',    emoji: '🧊' },
      { id: 'sand',         name: 'Sand',         emoji: '🏖️'  },
    ]
  },
  {
    id: 'containers',
    label: '📦 Containers',
    items: [
      { id: 'plastic-cups',    name: 'Plastic Cups',   emoji: '🥤' },
      { id: 'glass-jars',      name: 'Glass Jars',     emoji: '🫙' },
      { id: 'bowls',           name: 'Bowls',          emoji: '🥣' },
      { id: 'plastic-bottles', name: 'Plastic Bottles',emoji: '🍼' },
      { id: 'ziplock-bags',    name: 'Zip-lock Bags',  emoji: '🛍️' },
      { id: 'aluminum-foil',   name: 'Aluminum Foil',  emoji: '🌟' },
      { id: 'plastic-wrap',    name: 'Plastic Wrap',   emoji: '📦' },
    ]
  },
  {
    id: 'tools',
    label: '📏 Tools',
    items: [
      { id: 'ruler',           name: 'Ruler',           emoji: '📏' },
      { id: 'meas-spoons',     name: 'Measuring Spoons',emoji: '🥄' },
      { id: 'thermometer',     name: 'Thermometer',     emoji: '🌡️' },
      { id: 'magnifying-glass',name: 'Magnifying Glass',emoji: '🔍' },
      { id: 'stopwatch',       name: 'Stopwatch',       emoji: '⏱️' },
      { id: 'scissors',        name: 'Scissors',        emoji: '✂️' },
      { id: 'tape',            name: 'Tape',            emoji: '🎁' },
      { id: 'string',          name: 'String',          emoji: '🧵' },
    ]
  },
  {
    id: 'paper-craft',
    label: '📄 Paper & Craft',
    items: [
      { id: 'paper-towels',       name: 'Paper Towels',      emoji: '🧻' },
      { id: 'coffee-filters',     name: 'Coffee Filters',    emoji: '☕' },
      { id: 'construction-paper', name: 'Construction Paper',emoji: '📄' },
      { id: 'balloons',           name: 'Balloons',          emoji: '🎈' },
      { id: 'rubber-bands',       name: 'Rubber Bands',      emoji: '🤸' },
      { id: 'straws',             name: 'Straws',            emoji: '🧉' },
      { id: 'pipe-cleaners',      name: 'Pipe Cleaners',     emoji: '🎨' },
      { id: 'markers',            name: 'Markers',           emoji: '✏️' },
    ]
  },
  {
    id: 'misc',
    label: '🔌 Misc',
    items: [
      { id: 'flashlight',   name: 'Flashlight',   emoji: '🔦' },
      { id: 'batteries',    name: 'Batteries',    emoji: '🔋' },
      { id: 'magnets',      name: 'Magnets',      emoji: '🧲' },
      { id: 'candles',      name: 'Candles',      emoji: '🕯️' },
      { id: 'pennies',      name: 'Pennies',      emoji: '🪙' },
      { id: 'cotton-balls', name: 'Cotton Balls', emoji: '🌸' },
      { id: 'sponges',      name: 'Sponges',      emoji: '🧽' },
    ]
  }
];

/* ─── STATE ─── */
const state = {
  tab:          'generator',
  step:         1,
  grade:        null,
  supplies:     [],       // array of { id, name, emoji, custom? }
  keys:         { openai: '', google: '', cx: '' },
  isGenerating: false,
  currentExp:   null,     // { title, difficulty, markdown, html, grade, supplies, id, timestamp }
  library:      [],
  imageCache:   {},       // custom supply image URL cache
  libraryFilter:'all',
  librarySort:  'newest',
  librarySearch:'',
  openModalId:  null,     // library experiment id open in modal
  confirmCb:    null,     // pending confirm callback
};

/* ─── DOM REFS ─── */
const $ = id => document.getElementById(id);
const D = {
  // Key panel
  btnOpenKeys:  $('btn-open-keys'),
  btnCloseKeys: $('btn-close-keys'),
  keyPanel:     $('key-panel'),
  keyBackdrop:  $('key-backdrop'),
  envFileInput: $('env-file-input'),
  keyDropZone:  $('key-drop-zone'),
  inpOpenai:    $('inp-openai-key'),
  inpGoogle:    $('inp-google-key'),
  inpCx:        $('inp-google-cx'),
  dotOpenai:    $('dot-openai'),
  dotGoogle:    $('dot-google'),
  lblOpenai:    $('lbl-openai'),
  lblGoogle:    $('lbl-google'),
  // Tabs
  tabBtns:      document.querySelectorAll('.tab-btn'),
  tabContents:  document.querySelectorAll('.tab-content'),
  // Wizard progress
  wpFill:   $('wp-fill'),
  wpStep1:  $('wp-step-1'),
  wpStep2:  $('wp-step-2'),
  wpStep3:  $('wp-step-3'),
  // Steps
  step1:  $('step-1'),
  step2:  $('step-2'),
  step3:  $('step-3'),
  // Step 2
  supplyCategories: $('supply-categories'),
  customSupplyInp:  $('custom-supply-inp'),
  btnAddCustom:     $('btn-add-custom'),
  customChipsArea:  $('custom-chips-area'),
  supplyTray:       $('supply-tray'),
  trayEmpty:        $('tray-empty'),
  trayCount:        $('tray-count'),
  btnTo3:           $('btn-to-3'),
  backTo1:          $('back-to-1'),
  backTo2:          $('back-to-2'),
  // Step 3
  sumGrade:       $('sum-grade'),
  sumSupplies:    $('sum-supplies'),
  btnGenerate:    $('btn-generate'),
  loadingState:   $('loading-state'),
  errorState:     $('error-state'),
  errorTitle:     $('error-title'),
  errorMsg:       $('error-msg'),
  btnRetry:       $('btn-retry'),
  resultWrap:     $('result-wrap'),
  resultTitle:    $('result-title'),
  diffBadge:      $('diff-badge'),
  resultContent:  $('result-content'),
  btnSaveExp:     $('btn-save-exp'),
  btnPrintExp:    $('btn-print-exp'),
  btnAnother:     $('btn-another'),
  btnRestart:     $('btn-restart'),
  // Library
  libSearch:    $('lib-search'),
  libSort:      $('lib-sort'),
  libGrid:      $('lib-grid'),
  libEmpty:     $('lib-empty'),
  btnClearLib:  $('btn-clear-lib'),
  filterBtns:   document.querySelectorAll('.filter-btn'),
  // Worksheets
  wsSelect:     $('ws-select'),
  btnPrintWs:   $('btn-print-ws'),
  wsPreview:    $('ws-preview'),
  wsPreviewBody:$('ws-preview-body'),
  wsEmpty:      $('ws-empty'),
  // Modals
  modalBackdrop:$('modal-backdrop'),
  expModal:     $('exp-modal'),
  modalTitle:   $('modal-title'),
  modalBody:    $('modal-body'),
  btnModalClose:$('btn-modal-close'),
  modalPrintBtn:$('modal-print-btn'),
  modalFavBtn:  $('modal-fav-btn'),
  modalDeleteBtn:$('modal-delete-btn'),
  confirmModal: $('confirm-modal'),
  confirmTitle: $('confirm-title'),
  confirmMsg:   $('confirm-msg'),
  confirmYes:   $('confirm-yes'),
  confirmNo:    $('confirm-no'),
  printArea:    $('print-area'),
};

/* ══════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════ */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function emojiThumb(emoji) {
  return `<span style="font-size:1.05rem;line-height:1;">${emoji}</span>`;
}

/* ══════════════════════════════════════════════════════
   KEY MANAGEMENT
══════════════════════════════════════════════════════ */

function openKeyPanel() {
  D.keyPanel.classList.add('open');
  D.keyBackdrop.classList.add('open');
  D.btnOpenKeys.setAttribute('aria-expanded', 'true');
  D.keyPanel.removeAttribute('aria-hidden');
  setTimeout(() => D.inpOpenai.focus(), 350);
}

function closeKeyPanel() {
  D.keyPanel.classList.remove('open');
  D.keyBackdrop.classList.remove('open');
  D.btnOpenKeys.setAttribute('aria-expanded', 'false');
  D.keyPanel.setAttribute('aria-hidden', 'true');
  D.btnOpenKeys.focus();
}

function updateKeyStatus() {
  const hasOpenai = !!state.keys.openai;
  const hasGoogle = !!(state.keys.google && state.keys.cx);

  D.dotOpenai.className = 'status-dot' + (hasOpenai ? ' on' : '');
  D.dotGoogle.className = 'status-dot' + (hasGoogle ? ' on' : '');
  D.lblOpenai.textContent = hasOpenai ? 'OpenAI: key loaded' : 'OpenAI: no key';
  D.lblGoogle.textContent = hasGoogle ? 'Image Search: key loaded' : 'Image Search: no key';
}

function parseEnvContent(content) {
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq < 0) return;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key === 'OPENAI_API_KEY')  state.keys.openai = val;
    if (key === 'GOOGLE_API_KEY')  state.keys.google = val;
    if (key === 'GOOGLE_CX')       state.keys.cx     = val;
  });
  updateKeyStatus();
  if (state.keys.openai) {
    showToast('Keys loaded from .env file ✓', 'success');
    closeKeyPanel();
  }
}

function initKeyPanel() {
  D.btnOpenKeys.addEventListener('click', openKeyPanel);
  D.btnCloseKeys.addEventListener('click', closeKeyPanel);
  D.keyBackdrop.addEventListener('click', closeKeyPanel);

  // .env drag + drop
  D.keyDropZone.addEventListener('dragover', e => {
    e.preventDefault();
    D.keyDropZone.classList.add('drag-over');
  });
  D.keyDropZone.addEventListener('dragleave', () => D.keyDropZone.classList.remove('drag-over'));
  D.keyDropZone.addEventListener('drop', e => {
    e.preventDefault();
    D.keyDropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) readEnvFile(file);
  });
  D.keyDropZone.addEventListener('click', () => D.envFileInput.click());
  D.keyDropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') D.envFileInput.click(); });

  D.envFileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) readEnvFile(file);
    e.target.value = '';
  });

  // Manual save buttons
  document.querySelectorAll('.btn-save-key').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target === 'openai') { state.keys.openai = D.inpOpenai.value.trim(); D.inpOpenai.value = ''; }
      if (target === 'google') { state.keys.google = D.inpGoogle.value.trim(); D.inpGoogle.value = ''; }
      if (target === 'cx')     { state.keys.cx     = D.inpCx.value.trim();     D.inpCx.value = '';     }
      updateKeyStatus();
      showToast('Key saved ✓', 'success');
    });
  });
}

function readEnvFile(file) {
  const reader = new FileReader();
  reader.onload = e => parseEnvContent(e.target.result);
  reader.readAsText(file);
}

/* ══════════════════════════════════════════════════════
   TAB NAVIGATION
══════════════════════════════════════════════════════ */

function switchTab(tabId) {
  state.tab = tabId;
  D.tabBtns.forEach(btn => {
    const active = btn.dataset.tab === tabId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  D.tabContents.forEach(content => {
    const active = content.id === `tab-${tabId}`;
    content.classList.toggle('active', active);
    content.hidden = !active;
  });

  if (tabId === 'library')    renderLibrary();
  if (tabId === 'worksheets') renderWorksheets();
}

function initTabs() {
  D.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  // "Go to Generator" links
  document.querySelectorAll('.btn-go-gen').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

/* ══════════════════════════════════════════════════════
   WIZARD PROGRESS
══════════════════════════════════════════════════════ */

function updateWizardProgress(step) {
  state.step = step;
  const pct = ((step - 1) / 2) * 100;
  D.wpFill.style.width = pct + '%';

  [D.wpStep1, D.wpStep2, D.wpStep3].forEach((el, i) => {
    el.classList.toggle('active', i + 1 === step);
    el.classList.toggle('done',   i + 1 <  step);
  });
}

function showStep(n) {
  [D.step1, D.step2, D.step3].forEach((el, i) => {
    el.hidden = (i + 1 !== n);
    if (i + 1 === n) el.classList.add('wizard-step');
  });
  updateWizardProgress(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════════════════════════════════════════════════════
   STEP 1 — GRADE LEVEL
══════════════════════════════════════════════════════ */

function initGradeCards() {
  document.querySelectorAll('.grade-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.grade-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.grade = card.dataset.grade;
      // Auto-advance after brief delay
      setTimeout(() => showStep(2), 500);
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

/* ══════════════════════════════════════════════════════
   STEP 2 — SUPPLIES
══════════════════════════════════════════════════════ */

function renderSupplyCategories() {
  D.supplyCategories.innerHTML = '';
  SUPPLIES.forEach(cat => {
    const catDiv = document.createElement('div');
    catDiv.className = 'supply-category';
    catDiv.innerHTML = `<div class="cat-label">${cat.label}</div><div class="chips-grid" id="chips-${cat.id}"></div>`;
    D.supplyCategories.appendChild(catDiv);

    const grid = catDiv.querySelector(`#chips-${cat.id}`);
    cat.items.forEach(item => {
      grid.appendChild(makePresetChip(item));
    });
  });
}

function makePresetChip(item) {
  const chip = document.createElement('button');
  chip.className = 'supply-chip';
  chip.dataset.id = item.id;
  chip.setAttribute('aria-pressed', 'false');
  chip.setAttribute('aria-label', item.name);
  chip.innerHTML = `
    <div class="chip-img">${emojiThumb(item.emoji)}</div>
    <span class="chip-name">${item.name}</span>`;

  const isSelected = state.supplies.some(s => s.id === item.id);
  if (isSelected) {
    chip.classList.add('selected');
    chip.setAttribute('aria-pressed', 'true');
  }

  chip.addEventListener('click', () => togglePresetSupply(item, chip));
  chip.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.click(); }
  });
  return chip;
}

function togglePresetSupply(item, chip) {
  const idx = state.supplies.findIndex(s => s.id === item.id);
  if (idx >= 0) {
    state.supplies.splice(idx, 1);
    chip.classList.remove('selected');
    chip.setAttribute('aria-pressed', 'false');
  } else {
    state.supplies.push({ id: item.id, name: item.name, emoji: item.emoji });
    chip.classList.add('selected');
    chip.setAttribute('aria-pressed', 'true');
  }
  updateSupplyTray();
}

function updateSupplyTray() {
  D.supplyTray.innerHTML = '';
  if (state.supplies.length === 0) {
    D.supplyTray.appendChild(D.trayEmpty);
    D.trayCount.textContent = '0 selected';
    D.btnTo3.disabled = true;
    return;
  }
  D.trayCount.textContent = `${state.supplies.length} selected`;
  D.btnTo3.disabled = false;

  state.supplies.forEach(s => {
    const chip = document.createElement('div');
    chip.className = 'tray-chip';
    chip.setAttribute('role', 'listitem');
    chip.innerHTML = `
      <span>${s.emoji} ${s.name}</span>
      <button class="tray-chip-remove" aria-label="Remove ${s.name}">✕</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      removeTraySupply(s.id);
    });
    D.supplyTray.appendChild(chip);
  });
}

function removeTraySupply(id) {
  state.supplies = state.supplies.filter(s => s.id !== id);
  // De-select the corresponding chip if present
  const chip = document.querySelector(`.supply-chip[data-id="${id}"]`);
  if (chip) { chip.classList.remove('selected'); chip.setAttribute('aria-pressed', 'false'); }
  updateSupplyTray();
}

/* ─── Custom supply + Google Image search ─── */

let customSearchTimer = null;

function addCustomSupply(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  // Prevent duplicates
  if (state.supplies.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
    showToast('That supply is already selected.', 'warn');
    return;
  }
  const id = 'custom-' + trimmed.toLowerCase().replace(/\s+/g, '-');
  const item = { id, name: trimmed, emoji: '🔬', custom: true };
  state.supplies.push(item);
  updateSupplyTray();
  renderCustomChip(item);
  D.customSupplyInp.value = '';
  // Try to fetch image in background
  fetchCustomImage(item);
}

function renderCustomChip(item) {
  const chip = document.createElement('button');
  chip.className = 'supply-chip selected';
  chip.dataset.id = item.id;
  chip.setAttribute('aria-pressed', 'true');
  chip.setAttribute('aria-label', item.name);
  chip.innerHTML = `
    <div class="chip-img" id="img-${item.id}">${emojiThumb(item.emoji)}</div>
    <span class="chip-name">${item.name}</span>`;
  chip.addEventListener('click', () => {
    const idx = state.supplies.findIndex(s => s.id === item.id);
    if (idx >= 0) {
      state.supplies.splice(idx, 1);
      chip.classList.remove('selected');
      chip.setAttribute('aria-pressed', 'false');
      updateSupplyTray();
    } else {
      state.supplies.push(item);
      chip.classList.add('selected');
      chip.setAttribute('aria-pressed', 'true');
      updateSupplyTray();
    }
  });
  D.customChipsArea.appendChild(chip);
}

async function fetchCustomImage(item) {
  if (!state.keys.google || !state.keys.cx) return;
  // Check cache
  if (state.imageCache[item.id]) {
    updateChipImage(item.id, state.imageCache[item.id]);
    return;
  }
  try {
    const q = encodeURIComponent(`"${item.name}" household supply`);
    const url = `https://www.googleapis.com/customsearch/v1?q=${q}&searchType=image&num=1&imgSize=small&safe=active&key=${state.keys.google}&cx=${state.keys.cx}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    const imgUrl = data.items?.[0]?.link;
    if (imgUrl) {
      state.imageCache[item.id] = imgUrl;
      updateChipImage(item.id, imgUrl);
    }
  } catch {
    // Silently fail — emoji fallback stays
  }
}

function updateChipImage(itemId, imgUrl) {
  const imgEl = document.getElementById(`img-${itemId}`);
  if (!imgEl) return;
  const img = document.createElement('img');
  img.src = imgUrl;
  img.alt = '';
  img.style.cssText = 'width:26px;height:26px;border-radius:50%;object-fit:cover;';
  img.onerror = () => { /* keep emoji */ };
  img.onload  = () => { imgEl.innerHTML = ''; imgEl.appendChild(img); };
}

function initStep2() {
  renderSupplyCategories();

  D.backTo1.addEventListener('click', () => showStep(1));

  D.btnAddCustom.addEventListener('click', () => addCustomSupply(D.customSupplyInp.value));
  D.customSupplyInp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addCustomSupply(D.customSupplyInp.value); }
  });

  D.btnTo3.addEventListener('click', () => {
    if (state.supplies.length === 0) { showToast('Pick at least one supply first!', 'warn'); return; }
    buildSummary();
    showStep(3);
  });
}

/* ══════════════════════════════════════════════════════
   STEP 3 — GENERATE
══════════════════════════════════════════════════════ */

function buildSummary() {
  D.sumGrade.textContent = state.grade;
  D.sumSupplies.innerHTML = state.supplies
    .map(s => `<span class="mini-chip">${s.emoji} ${s.name}</span>`)
    .join('');
}

function buildUserPrompt() {
  const supplyList = state.supplies.map(s => s.name).join(', ');
  return `Grade Level: ${state.grade}\nAvailable Supplies: ${supplyList}\n\nGenerate a fun, engaging science experiment using ONLY the supplies listed above (plus common items like water or basic utensils that any household would have). Make it hands-on and exciting!`;
}

/**
 * Safely sanitize HTML. DOMPurify can throw under file:// origins because it
 * tries to create a sandboxed iframe, which Chrome blocks with the
 * "Unsafe attempt to load URL file://..." error. We guard against that here
 * and fall back to a lightweight regex scrub so the content still renders.
 */
function safeSanitize(rawHtml) {
  // Try DOMPurify first (best security)
  if (typeof DOMPurify !== 'undefined') {
    try {
      const result = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
      // DOMPurify sometimes returns '' under file:// even without throwing
      if (result !== '' || rawHtml === '') return result;
    } catch {
      // Fall through to manual scrub
    }
  }
  // Fallback scrub: strip <script>, event handlers, and javascript: hrefs.
  // Safe enough for LLM-generated content we already control.
  return rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="#"')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
}

function parseExperimentResponse(text) {
  let difficulty = 'Medium';
  let markdown = text;

  // Extract [DIFFICULTY: Easy|Medium|Hard]
  const diffMatch = markdown.match(/^\[DIFFICULTY:\s*(Easy|Medium|Hard)\]\s*\n?/im);
  if (diffMatch) {
    difficulty = diffMatch[1];
    markdown = markdown.replace(diffMatch[0], '').trimStart();
  }

  // Extract title from first # heading
  let title = 'Science Experiment';
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (titleMatch) title = titleMatch[1].trim();

  // Render markdown → HTML, with full fallback chain
  let rawHtml = '';
  try {
    rawHtml = (typeof marked !== 'undefined') ? marked.parse(markdown) : simpleMarkdown(markdown);
  } catch {
    rawHtml = simpleMarkdown(markdown);
  }
  const html = safeSanitize(rawHtml) || rawHtml; // never return empty on valid content

  return { title, difficulty, markdown, html };
}

function extractTitleFallback(text) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : 'Science Experiment';
}

function simpleMarkdown(text) {
  let h = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  h = h.replace(/```[\w]*\n?([\s\S]*?)```/g, (_,c) => `<pre><code>${c.trim()}</code></pre>`);
  h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  h = h.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  h = h.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
  h = h.replace(/^# (.+)$/gm,   '<h1>$1</h1>');
  h = h.replace(/((?:^[-*] .+\n?)+)/gm, b => `<ul>${b.replace(/^[-*] (.+)$/gm,'<li>$1</li>')}</ul>`);
  h = h.replace(/((?:^\d+\. .+\n?)+)/gm, b => `<ol>${b.replace(/^\d+\. (.+)$/gm,'<li>$1</li>')}</ol>`);
  return h.split(/\n{2,}/).map(c => {
    c = c.trim();
    if (!c) return '';
    if (/^<(h[1-3]|ul|ol|pre|blockquote)/.test(c)) return c;
    return `<p>${c.replace(/\n/g,'<br>')}</p>`;
  }).join('');
}

async function generateExperiment() {
  if (!state.keys.openai) {
    showToast('Please add your OpenAI API key first!', 'error');
    openKeyPanel();
    return;
  }

  state.isGenerating = true;
  D.btnGenerate.disabled = true;
  D.loadingState.hidden  = false;
  D.errorState.hidden    = true;
  D.resultWrap.hidden    = true;

  const userPrompt = buildUserPrompt();

  // ── Phase 1: API call (errors here show the error state) ──────────────
  let rawText;
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 60000);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.keys.openai}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        messages:    [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens:  2000
      }),
      signal: ctrl.signal
    });

    clearTimeout(tid);

    if (res.status === 401) throw new Error('INVALID_KEY');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok) throw new Error(`HTTP_${res.status}`);

    const data = await res.json();
    rawText = data.choices?.[0]?.message?.content;
    if (!rawText) throw new Error('EMPTY_RESPONSE');

  } catch (err) {
    // Only API/network failures land here
    const msgs = {
      INVALID_KEY:    'Your OpenAI API key is invalid or expired. Please check it and try again.',
      RATE_LIMIT:     'Too many requests — rate limit hit. Wait a moment and retry.',
      EMPTY_RESPONSE: 'The AI returned an empty response. Please try again.',
      AbortError:     'Request timed out (60 s). Check your internet connection and retry.',
    };
    const msg = msgs[err.message] || msgs[err.name] || `API error: ${err.message || 'unknown'}`;
    showError('Could Not Reach the API', msg);
    state.isGenerating    = false;
    D.btnGenerate.disabled = false;
    D.loadingState.hidden  = true;
    return; // stop here — don't fall into the rendering phase
  }

  // ── Phase 2: Parse & render (errors here should never hide the result) ─
  try {
    const parsed = parseExperimentResponse(rawText);
    state.currentExp = {
      ...parsed,
      id:        uid(),
      grade:     state.grade,
      supplies:  state.supplies.map(s => s.name),
      timestamp: Date.now(),
      favorite:  false,
    };

    displayResult(state.currentExp);

  } catch (renderErr) {
    // Rendering/parsing failure — the API succeeded, so show raw text rather
    // than a scary error. This also handles any leftover DOMPurify issues.
    console.warn('Render error (non-fatal):', renderErr);
    const fallbackExp = {
      id:        uid(),
      title:     extractTitleFallback(rawText),
      difficulty:'Medium',
      markdown:  rawText,
      html:      `<pre style="white-space:pre-wrap;font-size:0.9rem;">${escHtml(rawText)}</pre>`,
      grade:     state.grade,
      supplies:  state.supplies.map(s => s.name),
      timestamp: Date.now(),
      favorite:  false,
    };
    state.currentExp = fallbackExp;
    displayResult(fallbackExp);
  } finally {
    state.isGenerating    = false;
    D.btnGenerate.disabled = false;
    D.loadingState.hidden  = true;
  }
}

function displayResult(exp) {
  D.resultTitle.textContent = exp.title;

  // Difficulty badge
  D.diffBadge.textContent = exp.difficulty;
  D.diffBadge.className = 'diff-badge ' + exp.difficulty.toLowerCase();

  D.resultContent.innerHTML = exp.html;
  D.resultWrap.hidden = false;
  D.errorState.hidden = true;

  // Scroll to result
  setTimeout(() => D.resultWrap.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function showError(title, msg) {
  D.errorTitle.textContent = title;
  D.errorMsg.textContent   = msg;
  D.errorState.hidden = false;
  D.loadingState.hidden = true;
  D.resultWrap.hidden = true;
}

function initStep3() {
  D.backTo2.addEventListener('click', () => showStep(2));

  D.btnGenerate.addEventListener('click', generateExperiment);
  D.btnRetry.addEventListener('click',   generateExperiment);

  D.btnSaveExp.addEventListener('click', () => {
    if (!state.currentExp) return;
    saveExperiment(state.currentExp);
  });

  D.btnPrintExp.addEventListener('click', () => {
    if (!state.currentExp) return;
    printWorksheet(state.currentExp);
  });

  D.btnAnother.addEventListener('click', () => {
    D.resultWrap.hidden   = true;
    D.errorState.hidden   = true;
    D.loadingState.hidden = true;
    D.btnGenerate.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  D.btnRestart.addEventListener('click', () => {
    // Reset state
    state.grade     = null;
    state.supplies  = [];
    state.currentExp = null;
    // Reset grade cards
    document.querySelectorAll('.grade-card').forEach(c => c.classList.remove('selected'));
    // Reset custom chips area
    D.customChipsArea.innerHTML = '';
    // Reset supply chips
    document.querySelectorAll('.supply-chip').forEach(c => {
      c.classList.remove('selected');
      c.setAttribute('aria-pressed', 'false');
    });
    updateSupplyTray();
    D.resultWrap.hidden   = true;
    D.errorState.hidden   = true;
    D.loadingState.hidden = true;
    showStep(1);
  });
}

/* ══════════════════════════════════════════════════════
   LIBRARY (localStorage)
══════════════════════════════════════════════════════ */

const LIBRARY_KEY = 'sciExpGenLibrary';

function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    state.library = raw ? JSON.parse(raw) : [];
  } catch {
    state.library = [];
  }
}

function saveLibraryToStorage() {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(state.library));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      showToast('Storage full — could not save. Try deleting some saved experiments.', 'error');
    }
  }
}

function saveExperiment(exp) {
  // Don't add duplicate by same id
  if (state.library.some(e => e.id === exp.id)) {
    showToast('Already saved to library!', 'warn');
    return;
  }
  state.library.unshift({ ...exp });
  saveLibraryToStorage();
  showToast('Saved to Library ✓', 'success');
  // Re-render if library tab is active
  if (state.tab === 'library') renderLibrary();
}

function deleteExperiment(id) {
  state.library = state.library.filter(e => e.id !== id);
  saveLibraryToStorage();
  renderLibrary();
  renderWorksheets();
}

function toggleFavorite(id) {
  const exp = state.library.find(e => e.id === id);
  if (!exp) return;
  exp.favorite = !exp.favorite;
  saveLibraryToStorage();
  renderLibrary();
}

function getFilteredLibrary() {
  let list = [...state.library];

  // Grade filter
  if (state.libraryFilter !== 'all') {
    list = list.filter(e => e.grade === state.libraryFilter);
  }
  // Search
  const q = state.librarySearch.toLowerCase();
  if (q) {
    list = list.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.supplies || []).join(' ').toLowerCase().includes(q) ||
      e.markdown.toLowerCase().includes(q)
    );
  }
  // Sort
  if (state.librarySort === 'newest')    list.sort((a,b) => b.timestamp - a.timestamp);
  if (state.librarySort === 'favorites') list.sort((a,b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
  if (state.librarySort === 'grade') {
    const order = { 'K-2': 0, '3-5': 1, '6-8': 2, '9-12': 3 };
    list.sort((a,b) => (order[a.grade] ?? 9) - (order[b.grade] ?? 9));
  }
  return list;
}

function renderLibrary() {
  const list = getFilteredLibrary();
  D.libGrid.innerHTML = '';

  if (state.library.length === 0) {
    D.libEmpty.hidden  = false;
    D.libGrid.hidden   = true;
    return;
  }
  D.libEmpty.hidden = true;
  D.libGrid.hidden  = false;

  if (list.length === 0) {
    D.libGrid.innerHTML = '<p style="color:var(--text-secondary);padding:20px;grid-column:1/-1">No experiments match your filter.</p>';
    return;
  }

  list.forEach(exp => {
    const card = document.createElement('div');
    card.className = 'lib-card' + (exp.favorite ? ' favorited' : '');
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', exp.title);

    const preview = exp.markdown
      .replace(/\[DIFFICULTY:[^\]]+\]\s*/i, '')
      .replace(/#+\s*/g, '')
      .replace(/[*_`]/g, '')
      .slice(0, 120)
      .trim() + '…';

    card.innerHTML = `
      <div class="lib-card-hdr">
        <div class="lib-card-title">${escHtml(exp.title)}</div>
        <button class="lib-card-fav" aria-label="${exp.favorite ? 'Unfavorite' : 'Favorite'}">⭐</button>
      </div>
      <div class="lib-card-meta">
        <span class="grade-badge" style="font-size:0.7rem;padding:3px 8px;">${exp.grade}</span>
        <span class="diff-badge ${exp.difficulty.toLowerCase()}" style="font-size:0.68rem;padding:3px 8px;">${exp.difficulty}</span>
      </div>
      <p class="lib-card-preview">${escHtml(preview)}</p>
      <div class="lib-card-date">${formatDate(exp.timestamp)}</div>`;

    card.querySelector('.lib-card-fav').addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(exp.id);
    });
    card.addEventListener('click', () => openExpModal(exp.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openExpModal(exp.id); }
    });

    D.libGrid.appendChild(card);
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function initLibrary() {
  D.libSearch.addEventListener('input', () => {
    state.librarySearch = D.libSearch.value;
    renderLibrary();
  });
  D.libSort.addEventListener('change', () => {
    state.librarySort = D.libSort.value;
    renderLibrary();
  });
  D.filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      D.filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.libraryFilter = btn.dataset.filter;
      renderLibrary();
    });
  });
  D.btnClearLib.addEventListener('click', () => {
    if (state.library.length === 0) { showToast('Library is already empty.', 'warn'); return; }
    showConfirm('Clear All Experiments', 'This will permanently delete all saved experiments. Are you sure?', () => {
      state.library = [];
      saveLibraryToStorage();
      renderLibrary();
      renderWorksheets();
    });
  });
}

/* ══════════════════════════════════════════════════════
   EXPERIMENT DETAIL MODAL
══════════════════════════════════════════════════════ */

function openExpModal(id) {
  const exp = state.library.find(e => e.id === id);
  if (!exp) return;
  state.openModalId = id;

  D.modalTitle.textContent = exp.title;
  D.modalBody.innerHTML = `
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
      <span class="grade-badge" style="font-size:0.78rem;">${exp.grade}</span>
      <span class="diff-badge ${exp.difficulty.toLowerCase()}">${exp.difficulty}</span>
      <span style="font-size:0.78rem;color:var(--text-muted);align-self:center;">${formatDate(exp.timestamp)}</span>
    </div>
    <div class="result-card" style="padding:20px;background:rgba(255,255,255,0.02);">${exp.html}</div>`;

  D.modalFavBtn.textContent = exp.favorite ? '⭐ Unfavorite' : '⭐ Favorite';
  D.modalBackdrop.hidden = false;
  D.expModal.hidden      = false;
  document.body.style.overflow = 'hidden';
  D.btnModalClose.focus();
}

function closeExpModal() {
  D.modalBackdrop.hidden = true;
  D.expModal.hidden      = true;
  document.body.style.overflow = '';
  state.openModalId = null;
}

function initModals() {
  D.btnModalClose.addEventListener('click', closeExpModal);
  D.modalBackdrop.addEventListener('click', closeExpModal);

  D.modalFavBtn.addEventListener('click', () => {
    if (!state.openModalId) return;
    toggleFavorite(state.openModalId);
    const exp = state.library.find(e => e.id === state.openModalId);
    D.modalFavBtn.textContent = exp?.favorite ? '⭐ Unfavorite' : '⭐ Favorite';
  });

  D.modalPrintBtn.addEventListener('click', () => {
    const exp = state.library.find(e => e.id === state.openModalId);
    if (exp) { closeExpModal(); printWorksheet(exp); }
  });

  D.modalDeleteBtn.addEventListener('click', () => {
    const id = state.openModalId;
    showConfirm('Delete Experiment', 'Are you sure you want to delete this experiment?', () => {
      deleteExperiment(id);
      closeExpModal();
    });
  });

  // Confirm modal
  D.confirmYes.addEventListener('click', () => {
    if (state.confirmCb) { state.confirmCb(); state.confirmCb = null; }
    closeConfirm();
  });
  D.confirmNo.addEventListener('click', () => { state.confirmCb = null; closeConfirm(); });

  // Keyboard close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!D.expModal.hidden)     closeExpModal();
      if (!D.confirmModal.hidden) closeConfirm();
      if (D.keyPanel.classList.contains('open')) closeKeyPanel();
    }
  });
}

function showConfirm(title, msg, cb) {
  state.confirmCb = cb;
  D.confirmTitle.textContent = title || 'Confirm';
  D.confirmMsg.textContent   = msg   || 'Are you sure?';
  D.modalBackdrop.hidden = false;
  D.confirmModal.hidden  = false;
  D.confirmYes.focus();
}

function closeConfirm() {
  D.confirmModal.hidden  = true;
  // Only hide backdrop if exp modal is also closed
  if (D.expModal.hidden) D.modalBackdrop.hidden = true;
}

/* ══════════════════════════════════════════════════════
   WORKSHEETS
══════════════════════════════════════════════════════ */

function renderWorksheets() {
  D.wsSelect.innerHTML = '<option value="">— Select an experiment —</option>';
  D.wsPreview.hidden = true;
  D.btnPrintWs.disabled = true;

  if (state.library.length === 0) {
    D.wsEmpty.hidden = false;
    return;
  }
  D.wsEmpty.hidden = true;

  state.library.forEach(exp => {
    const opt = document.createElement('option');
    opt.value = exp.id;
    opt.textContent = `${exp.title} (${exp.grade})`;
    D.wsSelect.appendChild(opt);
  });
}

function buildWorksheetHTML(exp) {
  // Parse materials and procedure from markdown for the checklist + steps
  const materials  = extractSection(exp.markdown, 'Materials Needed');
  const procedure  = extractSection(exp.markdown, 'Procedure');
  const safetyNotes = extractSection(exp.markdown, 'Safety Notes');

  const checklistHtml = materials.map(m =>
    `<li><span class="ws-check-box"></span>${escHtml(m)}</li>`
  ).join('');

  const stepsHtml = procedure.map(s =>
    `<li>${escHtml(s)}</li>`
  ).join('');

  const safetyHtml = safetyNotes.length
    ? `<div class="ws-section"><h2>⚠️ Safety Notes</h2><ul class="ws-steps-list">${safetyNotes.map(s=>`<li>${escHtml(s)}</li>`).join('')}</ul></div>`
    : '';

  return `
<div class="ws-print">
  <div class="ws-print-hdr">
    <h1>${escHtml(exp.title)}</h1>
    <div class="ws-print-meta">
      <span>Grade Level: <strong>${exp.grade}</strong></span>
      <span>Difficulty: <strong>${exp.difficulty}</strong></span>
      <span>Date Printed: <strong>${formatDate(Date.now())}</strong></span>
    </div>
  </div>

  <div class="ws-section">
    <h2>✅ Materials Checklist</h2>
    <ul class="ws-checklist">${checklistHtml || '<li><span class="ws-check-box"></span>See experiment for full materials list</li>'}</ul>
  </div>

  ${safetyHtml}

  <div class="ws-section">
    <h2>🔬 Procedure</h2>
    <ol class="ws-steps-list">${stepsHtml || '<li>See experiment for procedure</li>'}</ol>
  </div>

  <div class="ws-section">
    <h2>🧠 Hypothesis</h2>
    <div class="ws-field-label">Before you begin, write your prediction:</div>
    <div class="ws-field-hint">I think ______________ will happen because ______________</div>
    <div class="ws-lines">${'<span class="ws-line"></span>'.repeat(4)}</div>
  </div>

  <div class="ws-section">
    <h2>👁️ Observations</h2>
    <div class="ws-field-label">What did you observe during the experiment?</div>
    <div class="ws-lines">${'<span class="ws-line"></span>'.repeat(5)}</div>
  </div>

  <div class="ws-section">
    <h2>📊 Data Table</h2>
    <table class="ws-data-table">
      <thead><tr>
        <th>Trial / Observation</th>
        <th>Measurement / Result</th>
        <th>Notes</th>
        <th>Comparison</th>
      </tr></thead>
      <tbody>
        ${Array(6).fill('<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>').join('')}
      </tbody>
    </table>
  </div>

  <div class="ws-section">
    <h2>📋 Results</h2>
    <div class="ws-field-label">What happened? Describe your results:</div>
    <div class="ws-lines">${'<span class="ws-line"></span>'.repeat(4)}</div>
  </div>

  <div class="ws-section">
    <h2>🎓 Conclusion</h2>
    <div class="ws-field-label">Complete this sentence:</div>
    <div class="ws-field-hint">My hypothesis was (circle one): <strong>SUPPORTED</strong> / <strong>NOT SUPPORTED</strong> because ______________</div>
    <div class="ws-lines">${'<span class="ws-line"></span>'.repeat(4)}</div>
  </div>

  <div class="ws-section">
    <h2>❓ Further Questions</h2>
    <div class="ws-field-label">What new questions do you have after doing this experiment?</div>
    <div class="ws-lines">${'<span class="ws-line"></span>'.repeat(3)}</div>
  </div>

  <div class="ws-footer">
    Generated by Science Experiment Generator — Powered by AI | Grade ${exp.grade} | ${formatDate(exp.timestamp)}
  </div>
</div>`;
}

function extractSection(markdown, heading) {
  // Find the section under a ## heading and extract bullet/numbered list items
  const regex = new RegExp(`##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
  const match = markdown.match(regex);
  if (!match) return [];
  const section = match[1];
  const items = [];
  const lines = section.split('\n');
  lines.forEach(line => {
    const m = line.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
    if (m) items.push(m[1].trim());
  });
  return items;
}

function printWorksheet(exp) {
  const html = buildWorksheetHTML(exp);
  D.printArea.innerHTML = html;

  // Apply print styles to make print area visible
  window.print();
}

function initWorksheets() {
  D.wsSelect.addEventListener('change', () => {
    const id = D.wsSelect.value;
    if (!id) {
      D.btnPrintWs.disabled = true;
      D.wsPreview.hidden = true;
      return;
    }
    const exp = state.library.find(e => e.id === id);
    if (!exp) return;
    D.btnPrintWs.disabled = false;
    D.wsPreviewBody.innerHTML = buildWorksheetHTML(exp);
    D.wsPreview.hidden = false;
  });

  D.btnPrintWs.addEventListener('click', () => {
    const id = D.wsSelect.value;
    const exp = state.library.find(e => e.id === id);
    if (exp) printWorksheet(exp);
  });
}

/* ══════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════════════ */

function showToast(msg, type = 'info') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const colors = {
    success: { bg: 'rgba(57,255,20,0.12)',   border: 'rgba(57,255,20,0.35)',   color: '#39ff14' },
    warn:    { bg: 'rgba(255,159,28,0.12)',  border: 'rgba(255,159,28,0.35)',  color: '#ff9f1c' },
    error:   { bg: 'rgba(255,71,87,0.12)',   border: 'rgba(255,71,87,0.35)',   color: '#ff4757' },
    info:    { bg: 'rgba(0,240,255,0.12)',   border: 'rgba(0,240,255,0.35)',   color: '#00f0ff' },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:28px; left:50%; transform:translateX(-50%) translateY(20px);
    z-index:300; padding:12px 24px; border-radius:30px;
    background:${c.bg}; border:1px solid ${c.border}; color:${c.color};
    font-size:0.88rem; font-weight:600; backdrop-filter:blur(12px);
    box-shadow:0 4px 24px rgba(0,0,0,0.4);
    animation:toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards;
    font-family:'Source Sans 3',sans-serif;`;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes toast-in  { to { transform:translateX(-50%) translateY(0); opacity:1; } }
    @keyframes toast-out { to { transform:translateX(-50%) translateY(10px); opacity:0; } }`;
  document.head.appendChild(style);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toast-out 0.25s ease forwards';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */

function init() {
  // Load library from localStorage
  loadLibrary();

  // Init all sections
  initKeyPanel();
  initTabs();
  initGradeCards();
  initStep2();
  initStep3();
  initLibrary();
  initWorksheets();
  initModals();

  // Start at step 1
  showStep(1);
  updateKeyStatus();

  // Render library if needed
  renderLibrary();
}

document.addEventListener('DOMContentLoaded', init);
