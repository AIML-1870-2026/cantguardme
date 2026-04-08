/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */

const MODELS = {
  openai:    ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414']
};

const SCHEMA_TEMPLATES = {
  element: {
    name:         'string',
    symbol:       'string',
    atomic_number:'integer',
    fun_fact:     'string'
  },
  sentiment: {
    sentiment:   'string',
    confidence:  'number',
    key_phrases: ['string'],
    reasoning:   'string'
  },
  character: {
    name:      'string',
    class:     'string',
    level:     'integer',
    stats: {
      strength:     'integer',
      dexterity:    'integer',
      intelligence: 'integer'
    },
    backstory: 'string'
  },
  threat: {
    threat_level:       'string',
    agent:              'string',
    transmission:       'string',
    risk_factors:       ['string'],
    recommended_action: 'string'
  }
};

const EXAMPLES = {
  unstructured: [
    'Explain quantum entanglement in simple terms',
    'What are the key differences between RNA and DNA polymerase?',
    'Write a short analysis of the prisoner\'s dilemma',
    'Describe how a neural network learns'
  ],
  structured: [
    { prompt: 'Describe the element Tungsten',                                                                 schema: 'element'   },
    { prompt: 'Analyze the sentiment of this review: "The product exceeded my expectations in every way!"',    schema: 'sentiment' },
    { prompt: 'Generate a character for a fantasy RPG',                                                        schema: 'character' },
    { prompt: 'Classify as a biological threat: common influenza virus',                                       schema: 'threat'    }
  ]
};

/* ═══════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════ */

const state = {
  provider:  'openai',
  providerB: 'openai',
  modelA:    MODELS.openai[0],
  modelB:    MODELS.openai[1],
  mode:      'unstructured',   // 'unstructured' | 'structured'
  compare:   false,
  keys: { openai: '', anthropic: '' },
  schema:    '',
  isLoading: false,
  lastTextA: '',
  lastTextB: '',
  library:   []                // { id, title, prompt, mode, schema, ts }
};

/* ═══════════════════════════════════════════════════════
   DOM REFERENCES
═══════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const D = {
  // Topbar
  dotOpenai:    $('dot-openai'),
  dotAnthropic: $('dot-anthropic'),
  lblOpenai:    $('lbl-openai'),
  lblAnthropic: $('lbl-anthropic'),
  // Provider toggles
  provTog:   $('prov-tog'),
  provBTog:  $('prov-b-tog'),
  // Models
  selA: $('sel-a'),
  selB: $('sel-b'),
  // Mode
  modeTog: $('mode-tog'),
  // Schema
  wrapSchema:   $('wrap-schema'),
  selSchema:    $('sel-schema'),
  schemaTa:     $('schema-ta'),
  schemaStatus: $('schema-status'),
  schemaIcon:   $('schema-icon'),
  schemaMsg:    $('schema-msg'),
  // Compare
  chkCompare: $('chk-compare'),
  wrapB:      $('wrap-b'),
  // Key
  keyMasked:   $('key-masked'),
  btnPaste:    $('btn-paste'),
  btnUpload:   $('btn-upload'),
  fileInp:     $('file-inp'),
  keyInputRow: $('key-input-row'),
  keyInp:      $('key-inp'),
  btnKeySave:  $('btn-key-save'),
  btnKeyCancel:$('btn-key-cancel'),
  // Examples
  exList: $('ex-list'),
  // Prompt
  btnLib:    $('btn-lib'),
  promptTa:  $('prompt-ta'),
  btnSaveP:  $('btn-save-p'),
  btnSend:   $('btn-send'),
  sendLbl:   $('send-lbl'),
  spin:      $('spin'),
  // Response
  loadBar:  $('load-bar'),
  respGrid: $('resp-grid'),
  colB:     $('col-b'),
  nameA:    $('name-a'),
  nameB:    $('name-b'),
  bodyA:    $('body-a'),
  bodyB:    $('body-b'),
  imetA:    $('imet-a'),
  imetB:    $('imet-b'),
  valWrap:  $('val-wrap'),
  // Metrics bar
  mTime:   $('m-time'),
  mTok:    $('m-tok'),
  mChr:    $('m-chr'),
  mWrd:    $('m-wrd'),
  btnCopy: $('btn-copy'),
  copyOk:  $('copy-ok'),
  // Drawer
  backdrop: $('backdrop'),
  drawer:   $('drawer'),
  drwX:     $('drw-x'),
  drwBody:  $('drw-body')
};

/* ═══════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════ */

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function maskKey(k) {
  if (!k || k.length < 10) return k || '';
  return k.slice(0, 7) + '…' + k.slice(-4);
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Syntax-highlight a JSON string into HTML spans */
function highlightJSON(raw) {
  try {
    const pretty = JSON.stringify(JSON.parse(raw), null, 2);
    const escaped = pretty
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
    return escaped.replace(
      /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      match => {
        if (/^"/.test(match)) {
          return /:$/.test(match)
            ? `<span class="json-key">${match}</span>`
            : `<span class="json-string">${match}</span>`;
        }
        if (match === 'true' || match === 'false') return `<span class="json-bool">${match}</span>`;
        if (match === 'null') return `<span class="json-null">${match}</span>`;
        return `<span class="json-number">${match}</span>`;
      }
    );
  } catch {
    return esc(raw);
  }
}

/** Very simple Markdown → HTML renderer */
function renderMd(text) {
  const e = text
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  let h = e;

  // Fenced code blocks
  h = h.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`);

  // Inline code
  h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Bold & italic
  h = h.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  h = h.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

  // Headings
  h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
  h = h.replace(/^# (.+)$/gm,   '<h1>$1</h1>');

  // Blockquotes
  h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  h = h.replace(/((?:^[-*] .+\n?)+)/gm, block => {
    const items = block.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  h = h.replace(/((?:^\d+\. .+\n?)+)/gm, block => {
    const items = block.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs: split on double newlines
  const chunks = h.split(/\n{2,}/);
  h = chunks.map(chunk => {
    chunk = chunk.trim();
    if (!chunk) return '';
    if (/^<(h[1-3]|ul|ol|pre|blockquote)/.test(chunk)) return chunk;
    // single newlines become <br> inside paragraph
    return `<p>${chunk.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return h;
}

/* ═══════════════════════════════════════════════════════
   PROVIDER & MODEL
═══════════════════════════════════════════════════════ */

function populateSel(sel, provider) {
  sel.innerHTML = '';
  MODELS[provider].forEach(m => {
    const o = document.createElement('option');
    o.value = m;
    o.textContent = m;
    sel.appendChild(o);
  });
}

function setProvider(p) {
  state.provider = p;
  state.modelA = MODELS[p][0];
  populateSel(D.selA, p);
  D.provTog.querySelectorAll('.seg').forEach(b =>
    b.classList.toggle('active', b.dataset.v === p));
  updateKeyDisplay();
  updateTopBarKeys();
}

function setProviderB(p) {
  state.providerB = p;
  state.modelB = MODELS[p][0];
  populateSel(D.selB, p);
  D.provBTog.querySelectorAll('.seg').forEach(b =>
    b.classList.toggle('active', b.dataset.v === p));
}

/* ═══════════════════════════════════════════════════════
   OUTPUT MODE
═══════════════════════════════════════════════════════ */

function setMode(m) {
  state.mode = m;
  D.modeTog.querySelectorAll('.seg').forEach(b =>
    b.classList.toggle('active', b.dataset.v === m));

  if (m === 'structured') {
    D.wrapSchema.classList.add('open');
    if (!state.schema) loadSchemaTemplate('element');
  } else {
    D.wrapSchema.classList.remove('open');
  }

  renderExamples();
}

function loadSchemaTemplate(key) {
  if (key !== 'custom') {
    state.schema = JSON.stringify(SCHEMA_TEMPLATES[key], null, 2);
    D.schemaTa.value = state.schema;
  }
  validateSchema();
}

function validateSchema() {
  const raw = D.schemaTa.value.trim();
  try {
    JSON.parse(raw);
    state.schema = raw;
    D.schemaStatus.className = 'schema-status valid';
    D.schemaIcon.textContent = '✓';
    D.schemaMsg.textContent  = 'Valid JSON';
    return true;
  } catch {
    D.schemaStatus.className = 'schema-status invalid';
    D.schemaIcon.textContent = '✕';
    D.schemaMsg.textContent  = 'Invalid JSON';
    return false;
  }
}

/* ═══════════════════════════════════════════════════════
   COMPARE MODE
═══════════════════════════════════════════════════════ */

function setCompare(on) {
  state.compare = on;
  D.wrapB.classList.toggle('open', on);
  D.colB.style.display = on ? 'flex' : 'none';
  if (on) D.colB.style.flexDirection = 'column';
  if (!on) {
    // Returning to single mode — clean up compare artifacts
    D.valWrap.classList.remove('open');
    D.valWrap.innerHTML = '';
    D.imetA.style.display = 'none';
    D.imetA.innerHTML     = '';
    D.imetB.style.display = 'none';
    D.imetB.innerHTML     = '';
    // If there's a current A response, restore bottom metrics from it
    if (state.lastTextA) {
      D.mTime.textContent = '—';
      D.mTok.textContent  = '—';
      D.mChr.textContent  = wordCount(state.lastTextA).toLocaleString();
      D.mWrd.textContent  = state.lastTextA.length.toLocaleString();
    }
  }
}

/* ═══════════════════════════════════════════════════════
   API KEY
═══════════════════════════════════════════════════════ */

function updateKeyDisplay() {
  const k = state.keys[state.provider];
  D.keyMasked.textContent = k ? maskKey(k) : 'No key loaded';
}

function updateTopBarKeys() {
  const hasOA = !!state.keys.openai;
  const hasAN = !!state.keys.anthropic;

  D.dotOpenai.className    = 'key-dot' + (hasOA ? ' on' : '');
  D.dotAnthropic.className = 'key-dot' + (hasAN ? ' on' : '');
  D.lblOpenai.textContent    = hasOA ? 'OpenAI key loaded'    : 'OpenAI — no key';
  D.lblAnthropic.textContent = hasAN ? 'Anthropic key loaded' : 'Anthropic — no key';
}

function saveKey(val) {
  const k = val.trim();
  if (!k) return;
  state.keys[state.provider] = k;
  updateKeyDisplay();
  updateTopBarKeys();
  hidePaste();
  // Update empty state if we now have a key
  updateEmptyState();
}

function hidePaste() {
  D.keyInputRow.hidden = true;
  D.keyInp.value = '';
}

function showPaste() {
  D.keyInputRow.hidden = false;
  D.keyInp.focus();
}

function updateEmptyState() {
  const emptyA = document.getElementById('empty-a');
  if (!emptyA) return;
  const hasKey = !!state.keys[state.provider];
  const p = emptyA.querySelector('p');
  if (p) {
    p.textContent = hasKey
      ? 'Send a prompt to see the model\'s response here'
      : 'Add an API key in the sidebar to get started';
  }
}

function parseEnvContent(content) {
  content.split('\n').forEach(line => {
    const m = line.match(/^(OPENAI_API_KEY|ANTHROPIC_API_KEY)\s*=\s*(.+)$/);
    if (!m) return;
    if (m[1] === 'OPENAI_API_KEY')    state.keys.openai    = m[2].trim().replace(/^['"]|['"]$/g, '');
    if (m[1] === 'ANTHROPIC_API_KEY') state.keys.anthropic = m[2].trim().replace(/^['"]|['"]$/g, '');
  });
  updateKeyDisplay();
  updateTopBarKeys();
  updateEmptyState();
}

function parseCsvContent(content) {
  content.split('\n').forEach(line => {
    const [provider, key] = line.split(',').map(s => s.trim());
    if (!provider || !key) return;
    if (provider.toLowerCase() === 'openai')    state.keys.openai    = key;
    if (provider.toLowerCase() === 'anthropic') state.keys.anthropic = key;
  });
  updateKeyDisplay();
  updateTopBarKeys();
  updateEmptyState();
}

/* ═══════════════════════════════════════════════════════
   EXAMPLES
═══════════════════════════════════════════════════════ */

function renderExamples() {
  D.exList.innerHTML = '';

  if (state.mode === 'unstructured') {
    EXAMPLES.unstructured.forEach(text => {
      const btn = document.createElement('button');
      btn.className   = 'ex-item';
      btn.textContent = text;
      btn.addEventListener('click', () => { D.promptTa.value = text; });
      D.exList.appendChild(btn);
    });
  } else {
    EXAMPLES.structured.forEach(({ prompt, schema }) => {
      const btn = document.createElement('button');
      btn.className   = 'ex-item';
      btn.textContent = prompt;
      btn.addEventListener('click', () => {
        D.promptTa.value = prompt;
        D.selSchema.value = schema;
        loadSchemaTemplate(schema);
      });
      D.exList.appendChild(btn);
    });
  }
}

/* ═══════════════════════════════════════════════════════
   API CALLS
═══════════════════════════════════════════════════════ */

async function callOpenAI(key, model, prompt, schema) {
  const messages = [];
  if (schema) {
    messages.push({
      role: 'system',
      content: 'You must respond with valid JSON matching this schema: ' + schema
    });
  }
  messages.push({ role: 'user', content: prompt });

  const body = { model, messages, temperature: 0.7 };
  if (schema) body.response_format = { type: 'json_object' };

  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), 30000);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    clearTimeout(tid);

    if (res.status === 401) throw new Error('INVALID_KEY');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok) throw new Error(`HTTP_${res.status}`);

    const data = await res.json();
    return { text: data.choices[0].message.content, usage: data.usage || null };
  } catch (err) {
    clearTimeout(tid);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}

async function callAnthropic(key, model, prompt, schema) {
  const body = {
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  };
  if (schema) body.system = 'You must respond with valid JSON matching this schema: ' + schema;

  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), 30000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    clearTimeout(tid);

    if (res.status === 401) throw new Error('INVALID_KEY');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok) throw new Error(`HTTP_${res.status}`);

    const data = await res.json();
    return { text: data.content[0].text, usage: data.usage || null };
  } catch (err) {
    clearTimeout(tid);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    if (err instanceof TypeError) throw new Error('CORS');
    throw err;
  }
}

/** Wraps an API call, always resolves (never rejects), measures time */
async function safeCall(provider, key, model, prompt, schema) {
  const t0 = performance.now();
  try {
    const result = provider === 'openai'
      ? await callOpenAI(key, model, prompt, schema)
      : await callAnthropic(key, model, prompt, schema);
    return { ok: true, text: result.text, usage: result.usage, ms: performance.now() - t0 };
  } catch (err) {
    return { ok: false, code: err.message || 'UNKNOWN', ms: performance.now() - t0 };
  }
}

/* ═══════════════════════════════════════════════════════
   RESPONSE RENDERING
═══════════════════════════════════════════════════════ */

function renderResponse(bodyEl, text, isStructured, col) {
  if (isStructured) {
    let parsed = null;
    try { parsed = JSON.parse(text); } catch { /* will show raw */ }

    const highlighted = parsed ? highlightJSON(text) : esc(text);
    const colId = col;

    bodyEl.innerHTML = `
      <div class="json-block">${highlighted}</div>
      <div class="json-actions">
        <button class="json-act-btn" data-action="copy-json">Copy JSON</button>
        <button class="json-act-btn" data-action="validate" data-col="${colId}">Validate</button>
      </div>
    `;

    bodyEl.querySelector('[data-action="copy-json"]').addEventListener('click', () => {
      navigator.clipboard.writeText(text).catch(() => {});
    });

    bodyEl.querySelector('[data-action="validate"]').addEventListener('click', () => {
      runValidation(text, state.schema);
    });
  } else {
    bodyEl.innerHTML = `<div class="resp-text">${renderMd(text)}</div>`;
  }
}

function renderInlineMetrics(el, ms, usage, text) {
  el.style.display = 'flex';
  el.innerHTML = `
    <div class="ipill"><span class="ipill-lbl">Time</span><span class="ipill-val">${(ms/1000).toFixed(1)}s</span></div>
    <div class="ipill"><span class="ipill-lbl">Tokens</span><span class="ipill-val">${usage ? usage.total_tokens : 'N/A'}</span></div>
    <div class="ipill"><span class="ipill-lbl">Chars</span><span class="ipill-val">${text.length.toLocaleString()}</span></div>
    <div class="ipill"><span class="ipill-lbl">Words</span><span class="ipill-val">${wordCount(text).toLocaleString()}</span></div>
  `;
}

function updateBottomMetrics(ms, usage, text) {
  D.mTime.textContent   = (ms/1000).toFixed(1) + 's';
  D.mTok.textContent    = usage ? usage.total_tokens.toLocaleString() : 'N/A';
  D.mChr.textContent    = text.length.toLocaleString();
  D.mWrd.textContent    = wordCount(text).toLocaleString();
}

function errorHTML(code) {
  const messages = {
    NO_KEY:       'Please add your API key in the sidebar to get started.',
    INVALID_KEY:  'Invalid API key. Please check your key and try again.',
    RATE_LIMIT:   'Rate limit reached. Please wait a moment and try again.',
    TIMEOUT:      'Request timed out. The model may be under heavy load.',
    NETWORK:      'Network error. Please check your connection.',
    MALFORMED_JSON:'The model returned invalid JSON. Try simplifying your schema or rephrasing your prompt.'
  };
  const msg = messages[code] || `Unexpected error (${esc(code)}). Please try again.`;
  return `<div class="err-card">${msg}</div>`;
}

function corsCardHTML() {
  return `
    <div class="cors-card">
      <div class="cors-title">ⓘ Browser Security Restriction (CORS)</div>
      <div class="cors-body">
        <p>Anthropic's API doesn't allow direct requests from web browsers — this is a security feature called <strong>CORS</strong> (Cross-Origin Resource Sharing).</p>
        <p>OpenAI's API includes headers that permit browser requests. Anthropic's is designed to be called from a backend server.</p>
        <p>→ <strong>Try this prompt with an OpenAI model instead.</strong><br>
           → In a production app, you'd route Anthropic requests through your own backend server.</p>
      </div>
    </div>
  `;
}

function setLoading(on) {
  state.isLoading = on;
  D.loadBar.classList.toggle('active', on);
  D.btnSend.disabled = on;
  D.sendLbl.style.display = on ? 'none' : '';
  D.spin.classList.toggle('active', on);
}

/* ═══════════════════════════════════════════════════════
   SEND PROMPT
═══════════════════════════════════════════════════════ */

async function sendPrompt() {
  const prompt = D.promptTa.value.trim();
  if (!prompt || state.isLoading) return;

  const isStructured = state.mode === 'structured';
  const schema = isStructured ? state.schema : null;
  const keyA   = state.keys[state.provider];

  // Pre-flight check — no key
  if (!keyA) {
    D.bodyA.innerHTML = errorHTML('NO_KEY');
    D.nameA.textContent = state.modelA;
    return;
  }

  setLoading(true);

  // Clear outputs
  D.bodyA.innerHTML = '<div class="wait-msg"><div class="wait-dot"></div><div class="wait-dot"></div><div class="wait-dot"></div></div>';
  D.imetA.style.display = 'none';
  D.imetA.innerHTML = '';
  D.nameA.textContent = state.modelA;
  D.valWrap.classList.remove('open');
  D.valWrap.innerHTML = '';

  if (state.compare) {
    D.bodyB.innerHTML = '<div class="wait-msg"><div class="wait-dot"></div><div class="wait-dot"></div><div class="wait-dot"></div></div>';
    D.imetB.style.display = 'none';
    D.imetB.innerHTML = '';
    D.nameB.textContent = state.modelB;
  }

  // Reset metrics bar
  D.mTime.textContent = '—';
  D.mTok.textContent  = '—';
  D.mChr.textContent  = '—';
  D.mWrd.textContent  = '—';

  // Capture results for post-resolve summary
  let resA = null, resB = null;

  // ── Call A ──
  const runA = safeCall(state.provider, keyA, state.modelA, prompt, schema)
    .then(r => {
      resA = r;
      if (r.ok) {
        state.lastTextA = r.text;
        renderResponse(D.bodyA, r.text, isStructured, 'a');
        if (state.compare) {
          renderInlineMetrics(D.imetA, r.ms, r.usage, r.text);
        } else {
          updateBottomMetrics(r.ms, r.usage, r.text);
        }
      } else {
        state.lastTextA = '';
        D.bodyA.innerHTML = r.code === 'CORS' ? corsCardHTML() : errorHTML(r.code);
      }
    });

  // ── Call B (if compare) ──
  let runB = null;
  if (state.compare) {
    const keyB = state.keys[state.providerB];
    if (!keyB) {
      runB = Promise.resolve().then(() => {
        resB = { ok: false, code: 'NO_KEY', ms: 0 };
        state.lastTextB = '';
        D.bodyB.innerHTML = errorHTML('NO_KEY');
      });
    } else {
      runB = safeCall(state.providerB, keyB, state.modelB, prompt, schema)
        .then(r => {
          resB = r;
          if (r.ok) {
            state.lastTextB = r.text;
            renderResponse(D.bodyB, r.text, isStructured, 'b');
            renderInlineMetrics(D.imetB, r.ms, r.usage, r.text);
          } else {
            state.lastTextB = '';
            D.bodyB.innerHTML = r.code === 'CORS' ? corsCardHTML() : errorHTML(r.code);
          }
        });
    }
  }

  const tasks = [runA];
  if (runB) tasks.push(runB);
  await Promise.allSettled(tasks);

  // ── Compare mode: show summary in metrics bar ──
  if (state.compare) {
    const tA = resA?.ok ? `${(resA.ms / 1000).toFixed(1)}s` : 'err';
    const tB = resB?.ok ? `${(resB.ms / 1000).toFixed(1)}s` : (resB ? 'err' : '—');
    D.mTime.textContent = `A: ${tA} / B: ${tB}`;

    const tokA = resA?.ok && resA.usage ? resA.usage.total_tokens : null;
    const tokB = resB?.ok && resB.usage ? resB.usage.total_tokens : null;
    if (tokA !== null || tokB !== null) {
      D.mTok.textContent = `A: ${tokA ?? 'N/A'} / B: ${tokB ?? 'N/A'}`;
    } else {
      D.mTok.textContent = 'N/A';
    }

    const chrA = resA?.ok ? resA.text.length : 0;
    const chrB = resB?.ok ? resB.text.length : 0;
    D.mChr.textContent = chrA || chrB ? `A: ${chrA} / B: ${chrB}` : '—';
    D.mWrd.textContent = '—';
  }

  setLoading(false);
}

/* ═══════════════════════════════════════════════════════
   SCHEMA VALIDATION
═══════════════════════════════════════════════════════ */

function typeLabel(t) {
  if (Array.isArray(t)) return 'array';
  if (t !== null && typeof t === 'object') return 'object';
  return String(t);
}

function actualType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

function typeMatches(value, expected) {
  if (expected === 'string')  return typeof value === 'string';
  if (expected === 'number')  return typeof value === 'number';
  if (expected === 'integer') return Number.isInteger(value);
  if (expected === 'boolean') return typeof value === 'boolean';
  if (expected === 'array' || Array.isArray(expected)) return Array.isArray(value);
  if (expected === 'object' || (expected !== null && typeof expected === 'object')) {
    return typeof value === 'object' && !Array.isArray(value) && value !== null;
  }
  return true;
}

function collectValidationRows(schemaObj, dataObj, rows, prefix) {
  let pass = 0, fail = 0, warn = 0;

  // Check declared fields
  Object.keys(schemaObj).forEach(key => {
    const expected = schemaObj[key];
    const path     = prefix ? `${prefix}.${key}` : key;
    const present  = key in dataObj;

    if (!present) {
      rows.push({ status:'fail', field:path, type:typeLabel(expected), preview:'—', badge:'MISSING', bClass:'fail' });
      fail++;
      return;
    }

    const val = dataObj[key];

    // Nested object — recurse
    if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
      if (typeof val !== 'object' || Array.isArray(val) || val === null) {
        rows.push({ status:'warn', field:path, type:'object', preview:String(val).slice(0,40), badge:'WRONG TYPE', bClass:'warn' });
        warn++;
      } else {
        const sub = collectValidationRows(expected, val, rows, path);
        pass += sub.pass; fail += sub.fail; warn += sub.warn;
      }
      return;
    }

    const preview = Array.isArray(val) ? `[${val.length} item${val.length !== 1 ? 's' : ''}]` : String(val).slice(0, 45);

    if (!typeMatches(val, expected)) {
      const got = actualType(val);
      rows.push({ status:'warn', field:path, type:typeLabel(expected), preview, badge:`Expected: ${typeLabel(expected)}, Got: ${got}`, bClass:'warn' });
      warn++;
    } else {
      rows.push({ status:'pass', field:path, type:typeLabel(expected), preview, badge:'PASS', bClass:'pass' });
      pass++;
    }
  });

  // Extra fields
  Object.keys(dataObj).forEach(key => {
    if (key in schemaObj) return;
    const path    = prefix ? `${prefix}.${key}` : key;
    const val     = dataObj[key];
    const preview = String(val).slice(0, 45);
    rows.push({ status:'info', field:path, type:actualType(val), preview, badge:'EXTRA', bClass:'info' });
  });

  return { pass, fail, warn };
}

function runValidation(responseText, schemaText) {
  let parsed, schema;

  try { parsed = JSON.parse(responseText); }
  catch { return showValReport([{ status:'fail', field:'(response)', type:'—', preview:'—', badge:'INVALID JSON', bClass:'fail' }], 0, 1); }

  try { schema = JSON.parse(schemaText); }
  catch { return showValReport([{ status:'fail', field:'(schema)', type:'—', preview:'—', badge:'SCHEMA INVALID', bClass:'fail' }], 0, 1); }

  const rows = [];
  const { pass, fail, warn } = collectValidationRows(schema, parsed, rows, '');

  showValReport(rows, pass, pass + fail + warn, warn, fail);
}

function showValReport(rows, pass, total, warn = 0, fail = 0) {
  const icons = { pass: '✓', fail: '✕', warn: '⚠', info: 'ⓘ' };

  const rowsHTML = rows.map(r => `
    <div class="vrow ${r.status}">
      <span class="vrow-ico ${r.status}">${icons[r.status]}</span>
      <span class="vrow-field">${esc(r.field)}</span>
      <span class="vrow-type">${esc(r.type)}</span>
      <span class="vrow-preview">${esc(r.preview)}</span>
      <span class="vrow-badge ${r.bClass}">${esc(r.badge)}</span>
    </div>
  `).join('');

  const allPass = fail === 0 && warn === 0;
  const color   = allPass ? 'var(--status-success)' : (fail > 0 ? 'var(--status-error)' : 'var(--status-warning)');
  const parts   = [];
  if (fail > 0) parts.push(`${fail} missing`);
  if (warn > 0) parts.push(`${warn} wrong type`);
  const summaryText = allPass
    ? `${pass}/${total} fields passed`
    : `${pass}/${total} fields passed — ${parts.join(', ')}`;

  D.valWrap.innerHTML = `
    <div class="val-inner">
      <div class="val-title">Schema Validation Report</div>
      <div class="val-table">${rowsHTML}</div>
      <div class="val-summary"><strong style="color:${color}">${summaryText}</strong></div>
    </div>
  `;
  D.valWrap.classList.add('open');
  D.valWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ═══════════════════════════════════════════════════════
   PROMPT LIBRARY
═══════════════════════════════════════════════════════ */

function saveToLibrary() {
  const prompt = D.promptTa.value.trim();
  if (!prompt) return;

  const entry = {
    id:     Date.now(),
    title:  prompt.slice(0, 48) + (prompt.length > 48 ? '…' : ''),
    prompt,
    mode:   state.mode,
    schema: state.mode === 'structured' ? state.schema : null,
    ts:     new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  state.library.unshift(entry);

  // Brief visual feedback on the save button
  D.btnSaveP.style.borderColor = 'var(--status-success)';
  D.btnSaveP.style.color       = 'var(--status-success)';
  setTimeout(() => {
    D.btnSaveP.style.borderColor = '';
    D.btnSaveP.style.color       = '';
  }, 900);
}

function loadFromLibrary(id) {
  const entry = state.library.find(e => e.id === id);
  if (!entry) return;

  D.promptTa.value = entry.prompt;
  if (entry.mode !== state.mode) setMode(entry.mode);

  if (entry.schema) {
    D.schemaTa.value = entry.schema;
    state.schema     = entry.schema;
    validateSchema();
  }

  closeDrawer();
}

function deleteFromLibrary(id) {
  state.library = state.library.filter(e => e.id !== id);
  renderLibrary();
}

function renderLibrary() {
  if (state.library.length === 0) {
    D.drwBody.innerHTML = `
      <div class="lib-empty">
        <div class="lib-empty-icon">📚</div>
        <p>No saved prompts yet.<br>Click the save icon next to the Send button to add prompts here.</p>
      </div>
    `;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'lib-grid';

  state.library.forEach(e => {
    const card = document.createElement('div');
    card.className = 'lib-card';
    card.innerHTML = `
      <div class="lib-card-title">${esc(e.title)}</div>
      <div class="lib-card-preview">${esc(e.prompt)}</div>
      <div class="lib-card-meta">
        <span class="lib-badge ${e.mode === 'structured' ? 'stru' : 'unst'}">${e.mode === 'structured' ? 'Structured' : 'Unstructured'}</span>
        <span class="lib-ts">${e.ts}</span>
      </div>
      <div class="lib-card-actions">
        <button class="lib-act-btn" data-action="load">Load</button>
        <button class="lib-act-btn del" data-action="del">Delete</button>
      </div>
    `;

    card.querySelector('[data-action="load"]').addEventListener('click', () => loadFromLibrary(e.id));
    card.querySelector('[data-action="del"]').addEventListener('click',  () => deleteFromLibrary(e.id));
    grid.appendChild(card);
  });

  D.drwBody.innerHTML = '';
  D.drwBody.appendChild(grid);
}

/* ═══════════════════════════════════════════════════════
   DRAWER
═══════════════════════════════════════════════════════ */

function openDrawer() {
  renderLibrary();
  D.backdrop.classList.add('show');
  D.drawer.classList.add('open');
}

function closeDrawer() {
  D.backdrop.classList.remove('show');
  D.drawer.classList.remove('open');
}

/* ═══════════════════════════════════════════════════════
   COPY
═══════════════════════════════════════════════════════ */

function copyResponse() {
  const text = state.lastTextA;
  if (!text) return;
  navigator.clipboard.writeText(text)
    .then(() => {
      D.copyOk.classList.add('show');
      setTimeout(() => D.copyOk.classList.remove('show'), 1500);
    })
    .catch(() => {});
}

/* ═══════════════════════════════════════════════════════
   EVENT BINDING
═══════════════════════════════════════════════════════ */

function bindEvents() {
  // Provider A
  D.provTog.addEventListener('click', e => {
    const b = e.target.closest('.seg');
    if (b) setProvider(b.dataset.v);
  });

  // Provider B
  D.provBTog.addEventListener('click', e => {
    const b = e.target.closest('.seg');
    if (b) setProviderB(b.dataset.v);
  });

  // Model selects
  D.selA.addEventListener('change', () => { state.modelA = D.selA.value; });
  D.selB.addEventListener('change', () => { state.modelB = D.selB.value; });

  // Output mode
  D.modeTog.addEventListener('click', e => {
    const b = e.target.closest('.seg');
    if (b) setMode(b.dataset.v);
  });

  // Schema template
  D.selSchema.addEventListener('change', () => loadSchemaTemplate(D.selSchema.value));

  // Schema editor live validation
  D.schemaTa.addEventListener('input', validateSchema);

  // Compare toggle
  D.chkCompare.addEventListener('change', () => setCompare(D.chkCompare.checked));

  // API Key
  D.btnPaste.addEventListener('click',      showPaste);
  D.btnKeyCancel.addEventListener('click',  hidePaste);
  D.btnKeySave.addEventListener('click',    () => saveKey(D.keyInp.value));
  D.keyInp.addEventListener('keydown',      e => { if (e.key === 'Enter') saveKey(D.keyInp.value); });

  // File upload
  D.btnUpload.addEventListener('click', () => D.fileInp.click());
  D.fileInp.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'csv') parseCsvContent(ev.target.result);
      else               parseEnvContent(ev.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // Send
  D.btnSend.addEventListener('click', sendPrompt);
  D.promptTa.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      sendPrompt();
    }
  });

  // Save to library
  D.btnSaveP.addEventListener('click', saveToLibrary);

  // Copy response
  D.btnCopy.addEventListener('click', copyResponse);

  // Drawer
  D.btnLib.addEventListener('click',    openDrawer);
  D.drwX.addEventListener('click',      closeDrawer);
  D.backdrop.addEventListener('click',  closeDrawer);

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });
}

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */

function init() {
  // Populate model dropdowns
  populateSel(D.selA, state.provider);
  populateSel(D.selB, state.providerB);

  // Load default schema into editor
  state.schema    = JSON.stringify(SCHEMA_TEMPLATES.element, null, 2);
  D.schemaTa.value = state.schema;
  validateSchema();

  // Set model labels
  D.nameA.textContent = state.modelA;

  // Render examples
  renderExamples();

  // Sync key display
  updateKeyDisplay();
  updateTopBarKeys();

  // Bind all events
  bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
