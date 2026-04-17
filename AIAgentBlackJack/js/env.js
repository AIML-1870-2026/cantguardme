/* ═══════════════════════════════════════════════════════════
   ENV.JS — API Key Management (in-memory only)
═══════════════════════════════════════════════════════════ */

window.BJApp = window.BJApp || {};

BJApp.keys = { openai: null, anthropic: null, gemini: null };

BJApp.parseEnv = function(content) {
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq < 0) return;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key === 'OPENAI_API_KEY')    BJApp.keys.openai    = val || null;
    if (key === 'ANTHROPIC_API_KEY') BJApp.keys.anthropic = val || null;
    if (key === 'GEMINI_API_KEY')    BJApp.keys.gemini    = val || null;
  });
  BJApp.updateKeyStatus();
};

BJApp.readEnvFile = function(file) {
  const reader = new FileReader();
  reader.onload = e => {
    BJApp.parseEnv(e.target.result);
    const count = Object.values(BJApp.keys).filter(Boolean).length;
    if (count > 0) {
      BJApp.showToast(`${count} key${count > 1 ? 's' : ''} loaded from .env`, 'success');
    } else {
      BJApp.showToast('No recognized keys found in file', 'warn');
    }
  };
  reader.readAsText(file);
};

BJApp.updateKeyStatus = function() {
  const providers = ['openai', 'anthropic', 'gemini'];
  providers.forEach(p => {
    const dot = document.getElementById(`dot-${p}`);
    const lbl = document.getElementById(`lbl-${p}`);
    if (!dot || !lbl) return;
    const labels = { openai: 'OpenAI', anthropic: 'Anthropic', gemini: 'Gemini' };
    if (BJApp.keys[p]) {
      dot.className = 'key-dot on';
      lbl.textContent = `${labels[p]}: key loaded`;
    } else {
      dot.className = 'key-dot';
      lbl.textContent = `${labels[p]}: no key`;
    }
  });

  // Enable/disable deal button based on current provider having a key
  const deal = document.getElementById('btn-deal');
  if (deal) {
    const hasKey = !!BJApp.keys[BJApp.provider || 'openai'];
    if (BJApp.phase === 'betting') {
      deal.disabled = !hasKey || BJApp.bet <= 0;
    }
  }
};

BJApp.getActiveKey = function() {
  return BJApp.keys[BJApp.provider] || null;
};

BJApp.initEnvPanel = function() {
  const dropZone = document.getElementById('env-drop-zone');
  const fileInput = document.getElementById('env-file-input');

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) BJApp.readEnvFile(file);
  });
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) BJApp.readEnvFile(file);
    e.target.value = '';
  });
};
