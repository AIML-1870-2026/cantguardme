/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */

const LENGTH_LABELS = ['Brief', 'Short', 'Medium', 'Detailed'];
const LENGTH_DESCS  = [
  '1–2 sentences',
  '1 paragraph',
  '2–3 paragraphs',
  '4+ paragraphs'
];

const TONE_LABELS = ['Casual', 'Conversational', 'Balanced', 'Professional', 'Technical'];

const SENTIMENT_THRESHOLDS = [
  { max: 15,  label: 'Very Negative',     cls: 'negative' },
  { max: 35,  label: 'Mostly Negative',   cls: 'negative' },
  { max: 45,  label: 'Slightly Negative', cls: 'negative' },
  { max: 55,  label: 'Neutral',           cls: ''         },
  { max: 65,  label: 'Slightly Positive', cls: 'positive' },
  { max: 80,  label: 'Mostly Positive',   cls: 'positive' },
  { max: 100, label: 'Very Positive',     cls: 'positive' },
];

/* ═══════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════ */

const state = {
  apiKey:       '',
  models:       [],
  modelsLoaded: false,
  isGenerating: false,
  reviewText:   '',
  productName:  '',
  aspectsTouched: { price: false, features: false, usability: false, quality: false }
};

/* ═══════════════════════════════════════════════════════
   DOM REFS
═══════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const D = {
  // Header status
  keyStatus:    $('key-status'),
  statusText:   $('status-text'),
  modelBadge:   $('model-badge'),

  // API Key card — drop zone
  keyDropZone:  $('key-drop-zone'),
  keyDropIcon:  $('key-drop-icon'),
  keyDropTitle: $('key-drop-title'),
  envFileInput: $('env-file-input'),
  keyBrowseBtn: $('key-browse-btn'),

  // API Key card — display & paste
  keyMasked:    $('key-masked'),
  btnPaste:     $('btn-paste'),
  keyInputRow:  $('key-input-row'),
  keyInp:       $('key-inp'),
  btnKeySave:   $('btn-key-save'),
  btnKeyCancel: $('btn-key-cancel'),

  // Model selection
  modelSelect:     $('model-select'),
  modelCountBadge: $('model-count-badge'),

  // Product info
  productName:    $('product-name'),
  categorySelect: $('category-select'),
  comments:       $('comments'),

  // Review controls
  lengthSlider: $('length-slider'),
  lengthLabel:  $('length-label'),
  toneSlider:   $('tone-slider'),
  toneLabel:    $('tone-label'),

  // Sentiment sliders
  sliderOverall:   $('slider-overall'),
  sliderPrice:     $('slider-price'),
  sliderFeatures:  $('slider-features'),
  sliderUsability: $('slider-usability'),
  sliderQuality:   $('slider-quality'),

  // Sentiment badges
  badgeOverall:   $('badge-overall'),
  badgePrice:     $('badge-price'),
  badgeFeatures:  $('badge-features'),
  badgeUsability: $('badge-usability'),
  badgeQuality:   $('badge-quality'),

  // Actions
  resetBtn:    $('reset-sentiments'),
  generateBtn: $('btn-generate'),
  btnIcon:     $('btn-icon'),
  btnText:     $('btn-text'),

  // Output
  outputEmpty:   $('output-empty'),
  skeletonWrap:  $('skeleton-wrap'),
  reviewContent: $('review-content'),
  errorMessage:  $('error-message'),
  errorText:     $('error-text'),
  downloadBtn:   $('btn-download'),
};

/* ═══════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════ */

function maskKey(k) {
  if (!k || k.length < 10) return k || '';
  return k.slice(0, 7) + '…' + k.slice(-4);
}

function getSentimentInfo(val) {
  for (const t of SENTIMENT_THRESHOLDS) {
    if (val <= t.max) return t;
  }
  return SENTIMENT_THRESHOLDS[SENTIMENT_THRESHOLDS.length - 1];
}

function updateSentimentBadge(badge, val) {
  const info = getSentimentInfo(val);
  badge.textContent = `${val} — ${info.label}`;
  badge.className   = 'sentiment-badge' + (info.cls ? ' ' + info.cls : '');
}

function sentimentColor(val) {
  if (val <= 50) {
    const t = val / 50;
    return `rgb(${Math.round(239 + (245-239)*t)},${Math.round(68 + (158-68)*t)},${Math.round(68 + (11-68)*t)})`;
  } else {
    const t = (val - 50) / 50;
    return `rgb(${Math.round(245 + (34-245)*t)},${Math.round(158 + (197-158)*t)},${Math.round(11 + (94-11)*t)})`;
  }
}

function updateSentimentSliderStyle(slider, val) {
  const color = sentimentColor(val);
  const pct   = val + '%';
  slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${pct}, var(--surface-2) ${pct})`;
}

function updateSnapSliderFill(slider) {
  const pct = (parseInt(slider.value) / parseInt(slider.max)) * 100;
  slider.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}%, var(--surface-2) ${pct}%)`;
}

function showOutput(which) {
  D.outputEmpty.style.display   = which === 'empty'    ? 'flex'  : 'none';
  D.skeletonWrap.style.display  = which === 'skeleton' ? 'flex'  : 'none';
  D.reviewContent.style.display = which === 'review'   ? 'block' : 'none';
  D.errorMessage.style.display  = which === 'error'    ? 'flex'  : 'none';
}

function setHeaderStatus(mode, text) {
  D.keyStatus.className    = 'status-pill ' + mode;
  D.statusText.textContent = text;
}

function canGenerate() {
  return !state.isGenerating
    && state.modelsLoaded
    && state.apiKey !== ''
    && D.productName.value.trim() !== ''
    && D.modelSelect.value !== '';
}

function refreshGenerateBtn() {
  D.generateBtn.disabled = !canGenerate();
}

/* ═══════════════════════════════════════════════════════
   KEY MANAGEMENT
═══════════════════════════════════════════════════════ */

function applyKey(key) {
  const k = key.trim().replace(/^["']|["']$/g, '');
  if (!k) return;
  state.apiKey = k;
  updateKeyDisplay();
  hidePaste();
  setHeaderStatus('', 'Discovering models…');
  discoverModels();
}

function updateKeyDisplay() {
  const k = state.apiKey;
  D.keyMasked.textContent = k ? maskKey(k) : 'No key loaded';
  D.keyMasked.className   = k ? 'key-masked loaded' : 'key-masked';
}

function showPaste() {
  D.keyInputRow.hidden = false;
  D.keyInp.focus();
}

function hidePaste() {
  D.keyInputRow.hidden = true;
  D.keyInp.value = '';
}

/* ── .env parser ── */
function parseEnvContent(text) {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const eqIdx = trimmed.indexOf('=');
    const key   = trimmed.slice(0, eqIdx).trim();
    const val   = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key === 'OPENAI_API_KEY' && val) return val;
  }
  return null;
}

/* ── CSV parser: openai,sk-... per line ── */
function parseCsvContent(text) {
  for (const line of text.split('\n')) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0].toLowerCase() === 'openai' && parts[1]) {
      return parts[1].replace(/^["']|["']$/g, '');
    }
  }
  return null;
}

function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const text = e.target.result;
    const ext  = file.name.split('.').pop().toLowerCase();
    const key  = ext === 'csv' ? parseCsvContent(text) : parseEnvContent(text);

    if (key && key.startsWith('sk-')) {
      // Success — update drop zone
      D.keyDropZone.classList.add('loaded');
      D.keyDropIcon.textContent  = '✓';
      D.keyDropTitle.innerHTML   = `<strong>${file.name}</strong> loaded`;
      applyKey(key);
    } else {
      D.keyDropZone.classList.remove('loaded');
      D.keyDropTitle.innerHTML = `No <code>OPENAI_API_KEY</code> found in <strong>${file.name}</strong>`;
      setHeaderStatus('error', 'Key not found');
    }
  };
  reader.onerror = () => setHeaderStatus('error', 'File read error');
  reader.readAsText(file);
  // Reset input so same file can be reloaded
  D.envFileInput.value = '';
}

/* ═══════════════════════════════════════════════════════
   MODEL DISCOVERY
═══════════════════════════════════════════════════════ */

async function discoverModels() {
  state.modelsLoaded = false;
  D.modelCountBadge.textContent = 'Discovering…';
  D.modelCountBadge.className   = 'card-badge';
  D.modelSelect.disabled = true;
  D.modelSelect.innerHTML = '<option value="">Loading models…</option>';
  refreshGenerateBtn();

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${state.apiKey}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const { data } = await res.json();

    const excluded = ['instruct','audio','realtime','tts','whisper','embedding','search','dall-e','babbage','davinci','ada','curie','moderation','transcri'];
    const gptModels = data
      .filter(m => {
        const id = m.id.toLowerCase();
        return id.includes('gpt') && !excluded.some(x => id.includes(x));
      })
      .sort((a, b) => {
        const rank = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5'];
        const pa = rank.findIndex(p => a.id.startsWith(p));
        const pb = rank.findIndex(p => b.id.startsWith(p));
        const ra = pa === -1 ? 99 : pa;
        const rb = pb === -1 ? 99 : pb;
        return ra !== rb ? ra - rb : b.id.localeCompare(a.id);
      });

    if (gptModels.length === 0) throw new Error('No GPT models found for this key.');

    state.models     = gptModels;
    state.modelsLoaded = true;

    D.modelSelect.innerHTML = '';
    gptModels.forEach(m => {
      const opt       = document.createElement('option');
      opt.value       = m.id;
      opt.textContent = m.id;
      D.modelSelect.appendChild(opt);
    });
    D.modelSelect.disabled = false;

    D.modelCountBadge.textContent = `OpenAI (${gptModels.length} models)`;
    D.modelCountBadge.className   = 'card-badge ready';
    D.modelBadge.textContent      = D.modelSelect.value;
    D.modelBadge.style.display    = 'block';
    setHeaderStatus('ready', 'API Connected');
    refreshGenerateBtn();

  } catch (err) {
    console.error('Model discovery failed:', err);

    // Key is likely invalid/expired — fall back to known GPT models
    // so the rest of the app remains usable
    const fallback = [
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4',
      'gpt-3.5-turbo', 'gpt-3.5-turbo-16k'
    ];
    state.models      = fallback.map(id => ({ id }));
    state.modelsLoaded = true;

    D.modelSelect.innerHTML = '';
    fallback.forEach(id => {
      const opt       = document.createElement('option');
      opt.value       = id;
      opt.textContent = id;
      D.modelSelect.appendChild(opt);
    });
    D.modelSelect.disabled = false;

    D.modelCountBadge.textContent = 'Fallback models';
    D.modelCountBadge.className   = 'card-badge';
    D.modelBadge.textContent      = D.modelSelect.value;
    D.modelBadge.style.display    = 'block';

    // Show the error in the header but keep the app unlocked
    setHeaderStatus('error', 'Key invalid — update key');
    refreshGenerateBtn();
  }
}

/* ═══════════════════════════════════════════════════════
   SYSTEM PROMPT
═══════════════════════════════════════════════════════ */

function buildSystemPrompt() {
  const product    = D.productName.value.trim();
  const category   = D.categorySelect.value;
  const lengthIdx  = parseInt(D.lengthSlider.value);
  const toneIdx    = parseInt(D.toneSlider.value);
  const comments   = D.comments.value.trim();

  const lengthLabel = LENGTH_LABELS[lengthIdx];
  const lengthDesc  = LENGTH_DESCS[lengthIdx];
  const toneLabel   = TONE_LABELS[toneIdx];

  const overall   = parseInt(D.sliderOverall.value);
  const price     = parseInt(D.sliderPrice.value);
  const features  = parseInt(D.sliderFeatures.value);
  const usability = parseInt(D.sliderUsability.value);
  const quality   = parseInt(D.sliderQuality.value);

  const sl = v => getSentimentInfo(v).label;

  return `You are an expert product review writer for a high-end editorial publication. Generate a product review based on the following parameters:

Product: ${product}
Category: ${category}
Review Length: ${lengthLabel} (${lengthDesc})
Tone/Style: ${toneLabel}

Sentiment Guidance:
- Overall Sentiment: ${overall}/100 (${sl(overall)})
- Price/Value: ${price}/100 (${sl(price)})
- Features/Functionality: ${features}/100 (${sl(features)})
- Usability/Ease of Use: ${usability}/100 (${sl(usability)})
- Quality/Durability: ${quality}/100 (${sl(quality)})

A score of 0 = extremely negative, 50 = neutral/mixed, 100 = extremely positive. Reflect the sentiment scores proportionally — lower scores include specific criticisms, higher scores include genuine praise. The review must feel authentic and editorial.

${comments ? `Additional instructions:\n${comments}\n` : ''}
Write the review in markdown format. Include a compelling H1 title. Structure naturally with sections as appropriate. Tone must match the style setting (${toneLabel}).`;
}

/* ═══════════════════════════════════════════════════════
   REVIEW GENERATION
═══════════════════════════════════════════════════════ */

async function generateReview() {
  if (!canGenerate()) return;

  state.isGenerating = true;
  state.productName  = D.productName.value.trim();

  D.generateBtn.disabled = true;
  D.generateBtn.classList.add('loading');
  D.btnIcon.textContent = '↻';
  D.btnText.textContent = 'Generating…';
  D.downloadBtn.style.display = 'none';
  showOutput('skeleton');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${state.apiKey}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        model: D.modelSelect.value,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user',   content: 'Write the product review now.' }
        ],
        temperature: 0.85,
        max_tokens:  1800
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const raw  = data.choices?.[0]?.message?.content || '';
    if (!raw) throw new Error('Empty response from model.');

    state.reviewText = raw;

    const cleanHTML = DOMPurify.sanitize(marked.parse(raw));
    await new Promise(r => setTimeout(r, 300));

    D.reviewContent.innerHTML = cleanHTML;
    showOutput('review');
    D.downloadBtn.style.display = 'flex';

  } catch (err) {
    D.errorText.textContent = err.message || 'An unknown error occurred.';
    showOutput('error');
    console.error('Generation error:', err);

  } finally {
    state.isGenerating = false;
    D.generateBtn.classList.remove('loading');
    D.btnIcon.textContent = '✦';
    D.btnText.textContent = 'Generate Review';
    refreshGenerateBtn();
  }
}

/* ═══════════════════════════════════════════════════════
   DOWNLOAD
═══════════════════════════════════════════════════════ */

function downloadReview() {
  if (!state.reviewText) return;
  const safe  = state.productName.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
  const date  = new Date().toISOString().slice(0, 10);
  const blob  = new Blob([state.reviewText], { type: 'text/markdown;charset=utf-8' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = `${safe}_Review_${date}.md`; a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════
   SENTIMENT LOGIC
═══════════════════════════════════════════════════════ */

const aspectMap = [
  { key: 'price',     sliderKey: 'sliderPrice',     badgeKey: 'badgePrice'     },
  { key: 'features',  sliderKey: 'sliderFeatures',  badgeKey: 'badgeFeatures'  },
  { key: 'usability', sliderKey: 'sliderUsability', badgeKey: 'badgeUsability' },
  { key: 'quality',   sliderKey: 'sliderQuality',   badgeKey: 'badgeQuality'   },
];

function syncOverallToAspects() {
  const v = parseInt(D.sliderOverall.value);
  aspectMap.forEach(({ key, sliderKey, badgeKey }) => {
    if (!state.aspectsTouched[key]) {
      D[sliderKey].value = v;
      D[sliderKey].setAttribute('aria-valuenow', v);
      updateSentimentBadge(D[badgeKey], v);
      updateSentimentSliderStyle(D[sliderKey], v);
    }
  });
}

function resetAllSentiments() {
  const v = parseInt(D.sliderOverall.value);
  state.aspectsTouched = { price: false, features: false, usability: false, quality: false };
  aspectMap.forEach(({ sliderKey, badgeKey }) => {
    D[sliderKey].value = v;
    D[sliderKey].setAttribute('aria-valuenow', v);
    updateSentimentBadge(D[badgeKey], v);
    updateSentimentSliderStyle(D[sliderKey], v);
  });
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */

function init() {
  // ── Snap sliders ──
  function syncSnap(slider, labelEl, labels) {
    const v = parseInt(slider.value);
    labelEl.textContent = labels[v];
    labelEl.style.transform = 'scale(1.08)';
    setTimeout(() => { labelEl.style.transform = ''; }, 200);
    updateSnapSliderFill(slider);
    slider.setAttribute('aria-valuenow', v);
  }

  D.lengthSlider.addEventListener('input', () => syncSnap(D.lengthSlider, D.lengthLabel, LENGTH_LABELS));
  D.toneSlider.addEventListener('input',   () => syncSnap(D.toneSlider,   D.toneLabel,   TONE_LABELS));
  updateSnapSliderFill(D.lengthSlider);
  updateSnapSliderFill(D.toneSlider);

  // ── Overall sentiment ──
  D.sliderOverall.addEventListener('input', () => {
    const v = parseInt(D.sliderOverall.value);
    D.sliderOverall.setAttribute('aria-valuenow', v);
    updateSentimentBadge(D.badgeOverall, v);
    updateSentimentSliderStyle(D.sliderOverall, v);
    syncOverallToAspects();
  });
  updateSentimentSliderStyle(D.sliderOverall, 50);
  updateSentimentBadge(D.badgeOverall, 50);

  // ── Aspect sentiments ──
  aspectMap.forEach(({ key, sliderKey, badgeKey }) => {
    updateSentimentSliderStyle(D[sliderKey], 50);
    updateSentimentBadge(D[badgeKey], 50);
    D[sliderKey].addEventListener('input', () => {
      state.aspectsTouched[key] = true;
      const v = parseInt(D[sliderKey].value);
      D[sliderKey].setAttribute('aria-valuenow', v);
      updateSentimentBadge(D[badgeKey], v);
      updateSentimentSliderStyle(D[sliderKey], v);
    });
  });

  D.resetBtn.addEventListener('click', resetAllSentiments);

  // ── Product name ──
  D.productName.addEventListener('input', refreshGenerateBtn);

  // ── Model select ──
  D.modelSelect.addEventListener('change', () => {
    D.modelBadge.textContent = D.modelSelect.value;
    refreshGenerateBtn();
  });

  // ── Generate / Download ──
  D.generateBtn.addEventListener('click', generateReview);
  D.downloadBtn.addEventListener('click', downloadReview);

  // ── Paste key ──
  D.btnPaste.addEventListener('click',     showPaste);
  D.btnKeyCancel.addEventListener('click', hidePaste);
  D.btnKeySave.addEventListener('click',   () => applyKey(D.keyInp.value));
  D.keyInp.addEventListener('keydown',     e => { if (e.key === 'Enter') applyKey(D.keyInp.value); });

  // ── File input (browse button) ──
  D.envFileInput.addEventListener('change', e => handleFile(e.target.files[0]));
  D.keyBrowseBtn.addEventListener('click',  () => D.envFileInput.click());

  // Click anywhere on drop zone (except browse btn) opens file dialog
  D.keyDropZone.addEventListener('click', e => {
    if (e.target !== D.keyBrowseBtn) D.envFileInput.click();
  });

  // ── Drag & drop ──
  D.keyDropZone.addEventListener('dragover', e => {
    e.preventDefault();
    D.keyDropZone.classList.add('drag-over');
  });

  D.keyDropZone.addEventListener('dragleave', e => {
    // Only remove if leaving the zone itself, not a child
    if (!D.keyDropZone.contains(e.relatedTarget)) {
      D.keyDropZone.classList.remove('drag-over');
    }
  });

  D.keyDropZone.addEventListener('drop', e => {
    e.preventDefault();
    D.keyDropZone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  });

  // ── Initial UI ──
  setHeaderStatus('', 'Load .env to begin');
  updateKeyDisplay();
  refreshGenerateBtn();
}

document.addEventListener('DOMContentLoaded', init);
