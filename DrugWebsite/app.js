/* ═══════════════════════════════════════════════════════════
   RxRecon — Drug Safety Intelligence Dashboard
   AIML 1870 | OpenFDA Live Data
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── CONSTANTS ─── */
const BASE_URL = 'https://api.fda.gov/drug';

const QUALIFIER_MAP = {
  '1': 'Physician', '2': 'Pharmacist',
  '3': 'Other Health Professional', '4': 'Lawyer', '5': 'Consumer / Patient'
};

const SEX_MAP = { '0': 'Unknown', '1': 'Male', '2': 'Female' };

const DRUG_CLASS_INFO = {
  'SSRIs': {
    search: 'selective serotonin reuptake inhibitor',
    pharm: 'Selective Serotonin Reuptake Inhibitor [EPC]',
    drugs: ['fluoxetine','sertraline','escitalopram','paroxetine','citalopram','fluvoxamine'],
    description: 'SSRIs are the most widely prescribed antidepressants. They increase serotonin availability by blocking reuptake into presynaptic neurons. Used for depression, anxiety disorders, OCD, PTSD, and more.'
  },
  'Statins': {
    search: 'hmg-coa reductase inhibitor',
    pharm: 'HMG-CoA Reductase Inhibitor [EPC]',
    drugs: ['atorvastatin','rosuvastatin','simvastatin','pravastatin','lovastatin','fluvastatin'],
    description: 'Statins are the cornerstone of cardiovascular prevention. They lower LDL cholesterol by inhibiting HMG-CoA reductase, the rate-limiting enzyme in cholesterol synthesis. Rare but serious risk: rhabdomyolysis.'
  },
  'ACE Inhibitors': {
    search: 'angiotensin-converting enzyme inhibitor',
    pharm: 'Angiotensin-Converting Enzyme Inhibitor [EPC]',
    drugs: ['lisinopril','enalapril','ramipril','captopril','benazepril','fosinopril'],
    description: 'ACE inhibitors lower blood pressure by blocking the conversion of angiotensin I to angiotensin II. First-line for hypertension, heart failure, and diabetic nephropathy. Notorious side effect: dry cough.'
  },
  'NSAIDs': {
    search: 'nonsteroidal anti-inflammatory drug',
    pharm: 'Nonsteroidal Anti-inflammatory Drug [EPC]',
    drugs: ['ibuprofen','naproxen','diclofenac','celecoxib','meloxicam','indomethacin'],
    description: 'NSAIDs inhibit COX-1 and COX-2 enzymes, reducing prostaglandin synthesis. Used for pain, inflammation, and fever. GI bleeding and cardiovascular risks are the primary safety concerns.'
  },
  'Fluoroquinolones': {
    search: 'fluoroquinolone',
    pharm: 'Fluoroquinolone Antibacterial [EPC]',
    drugs: ['ciprofloxacin','levofloxacin','moxifloxacin','ofloxacin','norfloxacin'],
    description: 'Broad-spectrum antibiotics that inhibit bacterial DNA gyrase and topoisomerase IV. Effective against difficult-to-treat infections. FDA has issued black box warnings for tendon rupture and peripheral neuropathy.'
  },
  'Benzodiazepines': {
    search: 'benzodiazepine',
    pharm: 'Benzodiazepine [EPC]',
    drugs: ['alprazolam','diazepam','lorazepam','clonazepam','temazepam','midazolam'],
    description: 'CNS depressants that enhance GABA activity. Used for anxiety, seizures, insomnia, and procedural sedation. High potential for dependence and withdrawal; carry FDA black box warnings for opioid co-use.'
  },
  'Proton Pump Inhibitors': {
    search: 'proton pump inhibitor',
    pharm: 'Proton Pump Inhibitor [EPC]',
    drugs: ['omeprazole','pantoprazole','esomeprazole','lansoprazole','rabeprazole'],
    description: 'PPIs irreversibly inhibit the H+/K+ ATPase pump in gastric parietal cells. The most effective acid-suppression therapy. Long-term use linked to magnesium deficiency, C. diff, and fracture risk.'
  },
  'Beta Blockers': {
    search: 'beta-adrenergic blocker',
    pharm: 'beta-Adrenergic Blocker [EPC]',
    drugs: ['metoprolol','atenolol','carvedilol','propranolol','bisoprolol','labetalol'],
    description: 'Beta blockers competitively block catecholamine binding to beta-adrenergic receptors. Essential for heart failure, angina, arrhythmias, and hypertension. Sudden discontinuation can be dangerous.'
  }
};

const CHART_COLORS_A = { bg: 'rgba(59,130,246,0.7)',  border: '#3B82F6' };
const CHART_COLORS_B = { bg: 'rgba(139,92,246,0.7)', border: '#8B5CF6' };
const CHART_COLORS_COMBO = [
  '#3B82F6','#8B5CF6','#06B6D4','#10B981','#F59E0B','#EF4444','#F97316','#EC4899'
];

/* ─── STATE ─── */
const state = {
  mode: 'comparison',
  activeTab: 'overview',
  drugA: { name: '', data: { label: null, events: null, recalls: null } },
  drugB: { name: '', data: { label: null, events: null, recalls: null } },
  coAdmin: { data: null },
  drugClass: { selected: '', drugs: [], data: {} },
  loading: { drugA: false, drugB: false, coAdmin: false, drugClass: false },
  errors: {},
  tabLoaded: { overview: false, 'adverse-events': false, 'drug-labels': false, recalls: false, 'co-admin': false }
};

/* ─── CACHE ─── */
const apiCache = new Map();

/* ─── CHART REGISTRY ─── */
const charts = {};

function destroyChart(id) {
  if (charts[id]) { try { charts[id].destroy(); } catch(e){} delete charts[id]; }
}
function destroyAllCharts() {
  Object.keys(charts).forEach(destroyChart);
}

/* ═══════════════════════════════════════════════════════════
   API LAYER
   ═══════════════════════════════════════════════════════════ */

async function fetchOpenFDA(endpoint, params = {}) {
  const queryStr = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${BASE_URL}/${endpoint}.json?${queryStr}`;

  if (apiCache.has(url)) return apiCache.get(url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return { results: [], meta: { results: { total: 0 } } };
      if (res.status === 429) throw new Error('RATE_LIMIT');
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    apiCache.set(url, data);
    return data;
  } catch (err) {
    if (err.message === 'RATE_LIMIT') throw err;
    console.error('[RxRecon] API error:', url, err);
    return null;
  }
}

/* ─── AUTOCOMPLETE ─── */
let autocompleteTimers = {};

function setupAutocomplete(inputId, spinnerId, dropdownId) {
  const input    = document.getElementById(inputId);
  const spinner  = document.getElementById(spinnerId);
  const dropdown = document.getElementById(dropdownId);
  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(autocompleteTimers[inputId]);
    const q = input.value.trim();
    if (q.length < 2) { hideDropdown(dropdown); return; }
    autocompleteTimers[inputId] = setTimeout(() => doAutocomplete(q, input, spinner, dropdown), 300);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { hideDropdown(dropdown); input.blur(); }
    if (e.key === 'Enter')  { hideDropdown(dropdown); }
    if (e.key === 'ArrowDown') navigateDropdown(dropdown, 1, e);
    if (e.key === 'ArrowUp')   navigateDropdown(dropdown, -1, e);
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) hideDropdown(dropdown);
  });
}

function navigateDropdown(dropdown, dir, e) {
  const items = dropdown.querySelectorAll('.autocomplete-item');
  if (!items.length) return;
  e.preventDefault();
  const focused = dropdown.querySelector('.focused');
  let idx = -1;
  items.forEach((el, i) => { if (el === focused) idx = i; });
  if (focused) focused.classList.remove('focused');
  idx = Math.max(0, Math.min(items.length - 1, idx + dir));
  items[idx].classList.add('focused');
  items[idx].scrollIntoView({ block: 'nearest' });
}

async function doAutocomplete(query, input, spinner, dropdown) {
  spinner.classList.remove('hidden');
  try {
    const data = await fetchOpenFDA('label', {
      search: `openfda.brand_name:"${query}"*+openfda.generic_name:"${query}"*`,
      limit: 8
    });
    spinner.classList.add('hidden');
    if (!data || !data.results?.length) {
      showDropdown(dropdown, '<div class="autocomplete-empty">No matching drugs found</div>');
      return;
    }
    const items = new Map();
    data.results.forEach(r => {
      const brands   = r.openfda?.brand_name   || [];
      const generics = r.openfda?.generic_name || [];
      generics.forEach(g => {
        if (!items.has(g)) items.set(g, brands[0] || g);
      });
    });
    const html = [...items.entries()].slice(0, 8).map(([generic, brand]) => `
      <div class="autocomplete-item" role="option" tabindex="-1"
           data-value="${escapeHtml(generic)}"
           onmousedown="selectAutocomplete(event, '${escapeHtml(inputId(input))}', '${escapeHtml(generic)}')">
        <span class="autocomplete-brand">${escapeHtml(brand)}</span>
        <span class="autocomplete-generic">${escapeHtml(generic)}</span>
      </div>
    `).join('');
    showDropdown(dropdown, html || '<div class="autocomplete-empty">No matching drugs found</div>');
  } catch {
    spinner.classList.add('hidden');
    hideDropdown(dropdown);
  }
}

function inputId(el) { return el.id; }

window.selectAutocomplete = function(e, fieldId, value) {
  e.preventDefault();
  const input = document.getElementById(fieldId);
  if (input) { input.value = value; }
  const dropId = fieldId.replace('input', 'dropdown');
  hideDropdown(document.getElementById(dropId));
};

function showDropdown(el, html) {
  el.innerHTML = html;
  el.classList.remove('hidden');
}
function hideDropdown(el) {
  if (el) el.classList.add('hidden');
}

/* ═══════════════════════════════════════════════════════════
   DRUG INVESTIGATION — PARALLEL API CALLS
   ═══════════════════════════════════════════════════════════ */

async function fetchDrugData(drugName) {
  const name = drugName.toLowerCase().trim();
  const [labelRes, eventTopRes, seriousRes, recallsRes, timelineRes, reporterRes, sexRes] = await Promise.allSettled([
    // Label
    fetchOpenFDA('label', { search: `openfda.generic_name:"${name}"`, limit: 1 }),
    // Top reactions
    fetchOpenFDA('event', { search: `patient.drug.openfda.generic_name:"${name}"`, count: 'patient.reaction.reactionmeddrapt.exact', limit: 30 }),
    // Seriousness
    fetchOpenFDA('event', { search: `patient.drug.openfda.generic_name:"${name}"`, count: 'serious' }),
    // Recalls
    fetchOpenFDA('enforcement', { search: `openfda.generic_name:"${name}"`, limit: 99, sort: 'report_date:desc' }),
    // Timeline (reports over time)
    fetchOpenFDA('event', { search: `patient.drug.openfda.generic_name:"${name}"`, count: 'receivedate' }),
    // Reporter type
    fetchOpenFDA('event', { search: `patient.drug.openfda.generic_name:"${name}"`, count: 'primarysource.qualification' }),
    // Sex
    fetchOpenFDA('event', { search: `patient.drug.openfda.generic_name:"${name}"`, count: 'patient.patientsex' })
  ]);

  // Total report count from meta
  let totalReports = 0;
  try {
    const totalRes = await fetchOpenFDA('event', {
      search: `patient.drug.openfda.generic_name:"${name}"`,
      limit: 1
    });
    totalReports = totalRes?.meta?.results?.total || 0;
  } catch {}

  return {
    label:    labelRes.status    === 'fulfilled' ? labelRes.value    : null,
    eventTop: eventTopRes.status === 'fulfilled' ? eventTopRes.value : null,
    serious:  seriousRes.status  === 'fulfilled' ? seriousRes.value  : null,
    recalls:  recallsRes.status  === 'fulfilled' ? recallsRes.value  : null,
    timeline: timelineRes.status === 'fulfilled' ? timelineRes.value : null,
    reporter: reporterRes.status === 'fulfilled' ? reporterRes.value : null,
    sex:      sexRes.status      === 'fulfilled' ? sexRes.value      : null,
    totalReports
  };
}

async function fetchOutcomes(drugName) {
  const name = drugName.toLowerCase().trim();
  const outcomes = ['seriousnessdeath','seriousnesslifethreatening','seriousnesshospitalization','seriousnessdisabling','seriousnessother'];
  const results = await Promise.allSettled(
    outcomes.map(o => fetchOpenFDA('event', { search: `patient.drug.openfda.generic_name:"${name}"+AND+${o}:1`, limit: 1 }))
  );
  const out = {};
  outcomes.forEach((o, i) => {
    out[o] = results[i].status === 'fulfilled' ? (results[i].value?.meta?.results?.total || 0) : 0;
  });
  return out;
}

async function fetchCoAdmin(nameA, nameB) {
  const a = nameA.toLowerCase().trim();
  const b = nameB.toLowerCase().trim();
  const search = `patient.drug.openfda.generic_name:"${a}"+AND+patient.drug.openfda.generic_name:"${b}"`;
  const [reactRes, seriousRes, totalRes] = await Promise.allSettled([
    fetchOpenFDA('event', { search, count: 'patient.reaction.reactionmeddrapt.exact', limit: 30 }),
    fetchOpenFDA('event', { search, count: 'serious' }),
    fetchOpenFDA('event', { search, limit: 1 })
  ]);
  return {
    reactions: reactRes.status === 'fulfilled'  ? reactRes.value  : null,
    serious:   seriousRes.status === 'fulfilled' ? seriousRes.value : null,
    total:     totalRes.value?.meta?.results?.total || 0
  };
}

/* ═══════════════════════════════════════════════════════════
   INVESTIGATE — MAIN TRIGGER
   ═══════════════════════════════════════════════════════════ */

async function investigate() {
  const nameA = document.getElementById('drug-a-input').value.trim();
  const nameB = document.getElementById('drug-b-input').value.trim();
  if (!nameA || !nameB) { showNotice('Please enter names for both drugs.', 'warn'); return; }

  state.drugA.name = nameA;
  state.drugB.name = nameB;
  state.tabLoaded = { overview: false, 'adverse-events': false, 'drug-labels': false, recalls: false, 'co-admin': false };
  state.coAdmin.data = null;
  destroyAllCharts();

  document.getElementById('co-admin-tab').classList.remove('hidden');
  showSkeletonAll();

  const [dataA, dataB] = await Promise.all([
    fetchDrugData(nameA),
    fetchDrugData(nameB)
  ]);

  state.drugA.data = dataA;
  state.drugB.data = dataB;

  // Fetch outcomes in parallel (separate because separate calls)
  const [outA, outB] = await Promise.all([fetchOutcomes(nameA), fetchOutcomes(nameB)]);
  state.drugA.data.outcomes = outA;
  state.drugB.data.outcomes = outB;

  renderCurrentTab();
}

/* ─── SHOW SKELETON ─── */
function showSkeletonAll() {
  const panels = ['tab-overview','tab-adverse-events','tab-drug-labels','tab-recalls','tab-co-admin'];
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = skeletonHTML();
  });
}

function skeletonHTML() {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
    </div>
    <div class="skeleton skeleton-chart mb-20"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <div class="skeleton" style="height:80px;border-radius:10px;"></div>
      <div class="skeleton" style="height:80px;border-radius:10px;"></div>
      <div class="skeleton" style="height:80px;border-radius:10px;"></div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB SYSTEM
   ═══════════════════════════════════════════════════════════ */

function switchTab(tabName) {
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const active = btn.dataset.tab === tabName;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const active = panel.id === `tab-${tabName}`;
    panel.classList.toggle('active', active);
    if (active) { panel.removeAttribute('hidden'); panel.style.display = ''; }
    else { panel.setAttribute('hidden', ''); panel.style.display = 'none'; }
  });

  state.activeTab = tabName;
  moveTabIndicator(tabName);

  // Load tab content if not already loaded
  if (state.mode === 'comparison' && (state.drugA.name || state.drugB.name)) {
    renderCurrentTab();
  }
}

function moveTabIndicator(tabName) {
  const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  const nav = document.getElementById('tab-nav');
  const indicator = document.getElementById('tab-indicator');
  if (!btn || !indicator) return;
  const navRect = nav.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  indicator.style.left  = `${btnRect.left - navRect.left}px`;
  indicator.style.width = `${btnRect.width}px`;
}

function renderCurrentTab() {
  const tab = state.activeTab;
  if (state.tabLoaded[tab]) return;

  if (state.mode === 'comparison') {
    if (!state.drugA.name && !state.drugB.name) return;
    switch(tab) {
      case 'overview':      renderOverview();      break;
      case 'adverse-events': renderAdverseEvents(); break;
      case 'drug-labels':   renderDrugLabels();    break;
      case 'recalls':       renderRecalls();        break;
      case 'co-admin':      renderCoAdmin();        break;
    }
  } else {
    if (state.drugClass.selected) renderClassExplorer();
  }
}

/* ═══════════════════════════════════════════════════════════
   TAB 1: OVERVIEW
   ═══════════════════════════════════════════════════════════ */

function renderOverview() {
  state.tabLoaded['overview'] = true;
  const panel = document.getElementById('tab-overview');
  const A = state.drugA, B = state.drugB;

  const labelA = A.data?.label?.results?.[0];
  const labelB = B.data?.label?.results?.[0];

  panel.innerHTML = `
    <!-- Drug Identity Cards -->
    <div class="comparison-row mb-20">
      ${drugIdentityCardHTML('A', A.name, labelA, A.data)}
      ${drugIdentityCardHTML('B', B.name, labelB, B.data)}
    </div>

    <!-- Sparse Data Notices -->
    ${sparseNotice(A.name, A.data?.totalReports, 'Drug A')}
    ${sparseNotice(B.name, B.data?.totalReports, 'Drug B')}

    <!-- Top Adverse Events (side by side bar chart) -->
    <div class="card card-appear mb-20">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-dot" style="background:var(--accent-blue)"></span>
          Top Adverse Events — Comparison
        </div>
        <button class="btn-info" data-modal="adverse-events-info" aria-label="How to interpret adverse event data">i</button>
      </div>
      <div class="chart-wrapper chart-md">
        <canvas id="chart-overview-events" aria-label="Top adverse events comparison bar chart"></canvas>
      </div>
      <p class="text-muted" style="font-size:0.72rem;margin-top:8px;">Based on FAERS voluntary reports. Does not prove causation.</p>
    </div>

    <!-- Seriousness & Outcomes -->
    <div class="overview-grid mb-20">
      <div class="card card-appear stagger-1">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-dot" style="background:var(--accent-red)"></span>
            Seriousness Breakdown
          </div>
        </div>
        <div class="chart-wrapper chart-sm">
          <canvas id="chart-overview-serious" aria-label="Seriousness breakdown doughnut chart"></canvas>
        </div>
      </div>
      <div class="card card-appear stagger-2">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-dot" style="background:var(--accent-amber)"></span>
            Outcome Distribution
          </div>
        </div>
        ${outcomeStatsHTML(A, B)}
      </div>
    </div>
  `;

  // Render charts after DOM is ready
  requestAnimationFrame(() => {
    renderOverviewEventsChart();
    renderOverviewSeriousnessChart();
  });
}

function drugIdentityCardHTML(label, name, labelData, data) {
  const brand   = labelData?.openfda?.brand_name?.[0]   || titleCase(name) || 'Unknown';
  const generic = labelData?.openfda?.generic_name?.[0] || name;
  const pharmClass = labelData?.openfda?.pharm_class_epc?.[0] || labelData?.openfda?.pharm_class_moa?.[0] || '—';
  const route   = labelData?.openfda?.route?.[0] || '—';
  const hasBoxed = !!labelData?.boxed_warning;
  const totalReports = data?.totalReports || 0;
  const recallCount  = data?.recalls?.results?.length || 0;
  const color = label === 'A' ? 'text-a' : 'text-b';
  const badgeClass = label === 'A' ? 'badge-a' : 'badge-b';

  return `
    <div class="card drug-identity-card card-appear">
      <div class="drug-identity-header">
        <div class="drug-name-block">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span class="drug-badge ${badgeClass}">Drug ${label}</span>
            ${hasBoxed ? `<span class="boxed-warning-badge">⚠ Boxed Warning</span>` : ''}
          </div>
          <div class="drug-brand ${color}">${escapeHtml(brand)}</div>
          <div class="drug-generic">${escapeHtml(generic)}</div>
        </div>
      </div>
      <div class="drug-meta-grid">
        <div class="drug-meta-item">
          <span class="meta-label">Drug Class</span>
          <span class="meta-value">${escapeHtml(truncate(pharmClass, 40))}</span>
        </div>
        <div class="drug-meta-item">
          <span class="meta-label">Route</span>
          <span class="meta-value">${escapeHtml(route)}</span>
        </div>
      </div>
      <div class="drug-stats-row">
        <div class="drug-stat">
          <span class="stat-num">${formatNum(totalReports)}</span>
          <span class="stat-label">FAERS Reports</span>
        </div>
        <div class="drug-stat">
          <span class="stat-num ${recallCount > 0 ? (recallCount > 5 ? 'text-red' : 'text-amber') : 'text-green'}">${recallCount}</span>
          <span class="stat-label">Recalls Found</span>
        </div>
      </div>
    </div>`;
}

function outcomeStatsHTML(A, B) {
  const outA = A.data?.outcomes || {};
  const outB = B.data?.outcomes || {};
  const keys = [
    { key: 'seriousnessdeath',            cls: 'death', label: 'Death' },
    { key: 'seriousnesslifethreatening',  cls: 'life',  label: 'Life-Threatening' },
    { key: 'seriousnesshospitalization',  cls: 'hosp',  label: 'Hospitalization' },
    { key: 'seriousnessdisabling',        cls: 'disab', label: 'Disabling' },
    { key: 'seriousnessother',            cls: 'other', label: 'Other Serious' }
  ];
  return `<div class="severity-cascade">
    ${keys.map(({key, cls, label}) => `
      <div class="severity-item ${cls}">
        <div class="sev-count" style="font-size:0.85rem;">
          <span class="text-a">${formatNum(outA[key]||0)}</span> /
          <span class="text-b">${formatNum(outB[key]||0)}</span>
        </div>
        <div class="sev-label">${label}</div>
      </div>
    `).join('')}
  </div>`;
}

function sparseNotice(name, total, label) {
  if (!name || total === undefined) return '';
  if (total > 0 && total < 10) {
    return `<div class="notice-box sparse mb-16">⚠ ${label} (${escapeHtml(name)}) has very few FAERS reports (${total}). Results may not be statistically meaningful.</div>`;
  }
  if (!total && name) {
    return `<div class="notice-box info mb-16">No adverse event reports found for "${escapeHtml(name)}" in the FAERS database. This may mean the drug is listed under a different name.</div>`;
  }
  return '';
}

function renderOverviewEventsChart() {
  const ctx = document.getElementById('chart-overview-events');
  if (!ctx) return;
  destroyChart('overview-events');

  const topA = (state.drugA.data?.eventTop?.results || []).slice(0, 15);
  const topB = (state.drugB.data?.eventTop?.results || []).slice(0, 15);
  const allTerms = [...new Set([...topA.map(r=>r.term), ...topB.map(r=>r.term)])].slice(0, 15);

  const mapA = Object.fromEntries(topA.map(r => [r.term, r.count]));
  const mapB = Object.fromEntries(topB.map(r => [r.term, r.count]));

  charts['overview-events'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: allTerms.map(t => truncate(titleCase(t), 28)),
      datasets: [
        { label: state.drugA.name, data: allTerms.map(t => mapA[t]||0), backgroundColor: CHART_COLORS_A.bg, borderColor: CHART_COLORS_A.border, borderWidth: 1, borderRadius: 4 },
        { label: state.drugB.name, data: allTerms.map(t => mapB[t]||0), backgroundColor: CHART_COLORS_B.bg, borderColor: CHART_COLORS_B.border, borderWidth: 1, borderRadius: 4 }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9CA3AF', font: { family: 'DM Sans', size: 11 } } }, tooltip: { backgroundColor: '#1F2937', titleColor: '#F9FAFB', bodyColor: '#9CA3AF' } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B7280', font: { size: 10 } } },
        y: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 10 } } }
      }
    }
  });
}

function renderOverviewSeriousnessChart() {
  const ctx = document.getElementById('chart-overview-serious');
  if (!ctx) return;
  destroyChart('overview-serious');

  const dataA = state.drugA.data?.serious?.results || [];
  const dataB = state.drugB.data?.serious?.results || [];
  const getVal = (arr, key) => arr.find(r => String(r.term) === key)?.count || 0;

  const seriousA = getVal(dataA, '1'), nonSeriousA = getVal(dataA, '2');
  const seriousB = getVal(dataB, '1'), nonSeriousB = getVal(dataB, '2');

  charts['overview-serious'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [`${state.drugA.name} Serious`, `${state.drugA.name} Non-serious`, `${state.drugB.name} Serious`, `${state.drugB.name} Non-serious`],
      datasets: [{
        data: [seriousA, nonSeriousA, seriousB, nonSeriousB],
        backgroundColor: ['rgba(239,68,68,0.8)','rgba(59,130,246,0.5)','rgba(239,68,68,0.4)','rgba(139,92,246,0.5)'],
        borderColor: ['#EF4444','#3B82F6','#EF4444','#8B5CF6'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 10 }, boxWidth: 12, padding: 8 } },
        tooltip: { backgroundColor: '#1F2937', titleColor: '#F9FAFB', bodyColor: '#9CA3AF' }
      },
      animation: { animateRotate: true, duration: 600 }
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   TAB 2: ADVERSE EVENTS
   ═══════════════════════════════════════════════════════════ */

async function renderAdverseEvents() {
  state.tabLoaded['adverse-events'] = true;
  const panel = document.getElementById('tab-adverse-events');
  panel.innerHTML = skeletonHTML();

  const A = state.drugA, B = state.drugB;
  const topA = (A.data?.eventTop?.results || []).slice(0, 20);
  const topB = (B.data?.eventTop?.results || []).slice(0, 20);

  panel.innerHTML = `
    <!-- Top Reactions Chart -->
    <div class="card card-appear mb-20">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-dot" style="background:var(--accent-blue)"></span>
          Top 20 Adverse Reactions — FAERS Reports
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn-info" data-modal="adverse-events-info" aria-label="Adverse event data explanation">i</button>
          <button class="btn-info" data-modal="reporting-bias" aria-label="Why some drugs have more reports">?</button>
        </div>
      </div>
      <div class="chart-wrapper chart-xl">
        <canvas id="chart-ae-top" aria-label="Top 20 adverse reactions horizontal bar chart"></canvas>
      </div>
    </div>

    <!-- Seriousness + Outcomes -->
    <div class="comparison-row mb-20">
      <div class="card card-appear stagger-1">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-dot" style="background:var(--accent-red)"></span>
            Seriousness — Drug A: ${escapeHtml(A.name)}
          </div>
        </div>
        <div class="chart-wrapper chart-sm">
          <canvas id="chart-ae-serious-a" aria-label="Seriousness breakdown for Drug A"></canvas>
        </div>
        ${severityCascadeHTML('A')}
      </div>
      <div class="card card-appear stagger-2">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-dot" style="background:var(--accent-purple)"></span>
            Seriousness — Drug B: ${escapeHtml(B.name)}
          </div>
        </div>
        <div class="chart-wrapper chart-sm">
          <canvas id="chart-ae-serious-b" aria-label="Seriousness breakdown for Drug B"></canvas>
        </div>
        ${severityCascadeHTML('B')}
      </div>
    </div>

    <!-- Demographics -->
    <div class="card card-appear mb-20">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-dot" style="background:var(--accent-cyan)"></span>
          Reporter Demographics
        </div>
      </div>
      <div class="demographics-grid">
        <div>
          <div class="section-header"><span class="section-title" style="font-size:0.72rem;">Sex Distribution</span></div>
          <div class="chart-wrapper chart-sm">
            <canvas id="chart-ae-sex" aria-label="Patient sex distribution pie chart"></canvas>
          </div>
        </div>
        <div>
          <div class="section-header"><span class="section-title" style="font-size:0.72rem;">Reporter Type</span></div>
          <div class="chart-wrapper chart-sm">
            <canvas id="chart-ae-reporter" aria-label="Reporter type bar chart"></canvas>
          </div>
        </div>
        <div>
          <div class="section-header"><span class="section-title" style="font-size:0.72rem;">Report Timeline (Drug A)</span></div>
          <div class="chart-wrapper chart-sm">
            <canvas id="chart-ae-timeline" aria-label="Reports over time for Drug A"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="notice-box info">
      FAERS reports are voluntarily submitted. A report linking a drug to an adverse event does not prove the drug caused the event.
      Report counts cannot be used to estimate how common an event actually is. Higher report counts may simply reflect market share.
    </div>
  `;

  requestAnimationFrame(() => {
    renderAETopChart(topA, topB);
    renderSeriousnessChart('chart-ae-serious-a', A.data?.serious?.results, state.drugA.name, CHART_COLORS_A);
    renderSeriousnessChart('chart-ae-serious-b', B.data?.serious?.results, state.drugB.name, CHART_COLORS_B);
    renderSexChart();
    renderReporterChart();
    renderTimelineChart();
  });
}

function severityCascadeHTML(which) {
  const key = which === 'A' ? 'drugA' : 'drugB';
  const outcomes = state[key].data?.outcomes || {};
  const total = state[key].data?.totalReports || 1;
  const items = [
    { key: 'seriousnessdeath',           cls: 'death', label: 'Death' },
    { key: 'seriousnesslifethreatening', cls: 'life',  label: 'Life-Threatening' },
    { key: 'seriousnesshospitalization', cls: 'hosp',  label: 'Hospitalization' },
    { key: 'seriousnessdisabling',       cls: 'disab', label: 'Disabling' }
  ];
  return `<div class="severity-cascade" style="margin-top:12px;">
    ${items.map(({key, cls, label}) => {
      const n = outcomes[key] || 0;
      const pct = total ? ((n/total)*100).toFixed(1) : '0.0';
      return `<div class="severity-item ${cls}">
        <div class="sev-count">${formatNum(n)}</div>
        <div class="sev-label">${label}</div>
        <div style="font-size:0.65rem;color:var(--text-tertiary);">${pct}%</div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderAETopChart(topA, topB) {
  const ctx = document.getElementById('chart-ae-top');
  if (!ctx) return;
  destroyChart('ae-top');
  const allTerms = [...new Set([...topA.map(r=>r.term), ...topB.map(r=>r.term)])].slice(0, 20);
  const mapA = Object.fromEntries(topA.map(r => [r.term, r.count]));
  const mapB = Object.fromEntries(topB.map(r => [r.term, r.count]));
  charts['ae-top'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: allTerms.map(t => truncate(titleCase(t), 32)),
      datasets: [
        { label: state.drugA.name, data: allTerms.map(t => mapA[t]||0), backgroundColor: CHART_COLORS_A.bg, borderColor: CHART_COLORS_A.border, borderWidth: 1, borderRadius: 4 },
        { label: state.drugB.name, data: allTerms.map(t => mapB[t]||0), backgroundColor: CHART_COLORS_B.bg, borderColor: CHART_COLORS_B.border, borderWidth: 1, borderRadius: 4 }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9CA3AF', font: { family: 'DM Sans', size: 11 } } }, tooltip: { backgroundColor: '#1F2937', titleColor: '#F9FAFB', bodyColor: '#9CA3AF' } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B7280', font: { size: 10 } } },
        y: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 10 } } }
      }
    }
  });
}

function renderSeriousnessChart(canvasId, results, drugName, colors) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !results) return;
  destroyChart(canvasId);
  const serious    = results.find(r => String(r.term) === '1')?.count || 0;
  const nonSerious = results.find(r => String(r.term) === '2')?.count || 0;
  charts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Serious', 'Non-serious'],
      datasets: [{ data: [serious, nonSerious], backgroundColor: ['rgba(239,68,68,0.75)', colors.bg], borderColor: ['#EF4444', colors.border], borderWidth: 1 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 10 }, boxWidth: 12 } },
        tooltip: { backgroundColor: '#1F2937', titleColor: '#F9FAFB', bodyColor: '#9CA3AF' }
      },
      animation: { animateRotate: true, duration: 600 }
    }
  });
}

function renderSexChart() {
  const ctx = document.getElementById('chart-ae-sex');
  if (!ctx) return;
  destroyChart('ae-sex');
  const rA = state.drugA.data?.sex?.results || [];
  const rB = state.drugB.data?.sex?.results || [];
  const keys = ['1','2','0'];
  const labelsMap = {'0':'Unknown','1':'Male','2':'Female'};
  charts['ae-sex'] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: keys.map(k => labelsMap[k]),
      datasets: [{
        data: keys.map(k => (rA.find(r => String(r.term)===k)?.count||0) + (rB.find(r => String(r.term)===k)?.count||0)),
        backgroundColor: ['rgba(59,130,246,0.7)','rgba(236,72,153,0.7)','rgba(107,114,128,0.5)'],
        borderColor: ['#3B82F6','#EC4899','#6B7280'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 10 }, boxWidth: 12, padding: 8 } },
        tooltip: { backgroundColor: '#1F2937', bodyColor: '#9CA3AF' }
      }
    }
  });
}

function renderReporterChart() {
  const ctx = document.getElementById('chart-ae-reporter');
  if (!ctx) return;
  destroyChart('ae-reporter');
  const rA = state.drugA.data?.reporter?.results || [];
  const rB = state.drugB.data?.reporter?.results || [];
  const combined = {};
  [...rA, ...rB].forEach(r => { combined[r.term] = (combined[r.term]||0) + r.count; });
  const sorted = Object.entries(combined).sort((a,b) => b[1]-a[1]).slice(0, 5);
  charts['ae-reporter'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(([k]) => QUALIFIER_MAP[k] || `Type ${k}`),
      datasets: [{ label: 'Reports', data: sorted.map(([,v]) => v), backgroundColor: 'rgba(6,182,212,0.6)', borderColor: '#06B6D4', borderWidth: 1, borderRadius: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1F2937', bodyColor: '#9CA3AF' } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#6B7280', font: { size: 9 }, maxRotation: 30 } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B7280', font: { size: 9 } } }
      }
    }
  });
}

function renderTimelineChart() {
  const ctx = document.getElementById('chart-ae-timeline');
  if (!ctx) return;
  destroyChart('ae-timeline');
  const timeline = state.drugA.data?.timeline?.results || [];
  // Aggregate by year
  const byYear = {};
  timeline.forEach(({ term, count }) => {
    const year = String(term).slice(0, 4);
    if (year >= '2000' && year <= '2026') byYear[year] = (byYear[year]||0) + count;
  });
  const years = Object.keys(byYear).sort();
  charts['ae-timeline'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: state.drugA.name,
        data: years.map(y => byYear[y]),
        borderColor: CHART_COLORS_A.border,
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1F2937', bodyColor: '#9CA3AF' } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B7280', font: { size: 9 }, maxRotation: 45 } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B7280', font: { size: 9 } } }
      }
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   TAB 3: DRUG LABELS
   ═══════════════════════════════════════════════════════════ */

function renderDrugLabels() {
  state.tabLoaded['drug-labels'] = true;
  const panel = document.getElementById('tab-drug-labels');
  const labelA = state.drugA.data?.label?.results?.[0];
  const labelB = state.drugB.data?.label?.results?.[0];

  if (!labelA && !labelB) {
    panel.innerHTML = `<div class="notice-box info">FDA labeling data not available for these drugs in the OpenFDA database.</div>`;
    return;
  }

  const sections = [
    { key: 'boxed_warning',             title: '⚠ Boxed Warning',                   special: 'boxed' },
    { key: 'warnings_and_cautions',     title: 'Warnings & Precautions' },
    { key: 'warnings',                  title: 'Warnings' },
    { key: 'adverse_reactions',         title: 'Adverse Reactions (Official)' },
    { key: 'drug_interactions',         title: '⚡ Drug Interactions' },
    { key: 'contraindications',         title: 'Contraindications' },
    { key: 'indications_and_usage',     title: 'Indications & Usage' },
    { key: 'dosage_and_administration', title: 'Dosage & Administration' },
    { key: 'overdosage',                title: 'Overdosage' },
    { key: 'mechanism_of_action',       title: 'Mechanism of Action' },
    { key: 'description',               title: 'Description' },
    { key: 'use_in_specific_populations', title: 'Use in Specific Populations' },
    { key: 'clinical_pharmacology',     title: 'Clinical Pharmacology' }
  ];

  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <h2 style="font-size:0.85rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">FDA-Approved Labeling</h2>
      <button class="btn-info" data-modal="labels-info" aria-label="What drug labels tell you">i</button>
    </div>
    <div class="comparison-row">
      <div>
        <div class="comparison-col-header">
          <span class="drug-badge badge-a">A</span>
          ${escapeHtml(state.drugA.name)}
          ${!labelA ? '<span style="color:var(--text-tertiary);font-size:0.72rem;">— No label data</span>' : ''}
        </div>
        ${labelA ? buildAccordion(sections, labelA, 'a') : '<div class="notice-box info">FDA labeling data not available for this drug.</div>'}
      </div>
      <div>
        <div class="comparison-col-header">
          <span class="drug-badge badge-b">B</span>
          ${escapeHtml(state.drugB.name)}
          ${!labelB ? '<span style="color:var(--text-tertiary);font-size:0.72rem;">— No label data</span>' : ''}
        </div>
        ${labelB ? buildAccordion(sections, labelB, 'b') : '<div class="notice-box info">FDA labeling data not available for this drug.</div>'}
      </div>
    </div>`;
}

function buildAccordion(sections, labelData, prefix) {
  const items = sections.map(({ key, title, special }, i) => {
    const text = labelData?.[key]?.[0];
    if (!text) return '';
    const isBoxed = special === 'boxed';
    const open = isBoxed;  // Open boxed warning by default
    return `
      <div class="accordion-item ${isBoxed ? 'boxed-warning-section' : ''}">
        <button class="accordion-trigger ${open ? 'open' : ''}" onclick="toggleAccordion(this)" aria-expanded="${open}">
          ${escapeHtml(title)}
          <svg class="accordion-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M4 6l4 4 4-4" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="accordion-body ${open ? 'open' : ''}">
          <div class="accordion-content">${escapeHtml(cleanLabelText(text))}</div>
        </div>
      </div>`;
  }).filter(Boolean);

  if (!items.length) return '<div class="notice-box info">No label sections available.</div>';
  return `<div class="accordion">${items.join('')}</div>`;
}

window.toggleAccordion = function(btn) {
  const isOpen = btn.classList.contains('open');
  btn.classList.toggle('open', !isOpen);
  btn.setAttribute('aria-expanded', !isOpen);
  const body = btn.nextElementSibling;
  body.classList.toggle('open', !isOpen);
};

// Also support synchronized accordion opening
window.toggleAccordionSync = function(btn, index) {
  // Find all accordion triggers at same index and toggle them too
  const allAccordions = document.querySelectorAll('.accordion');
  allAccordions.forEach(acc => {
    const triggers = acc.querySelectorAll('.accordion-trigger');
    if (triggers[index]) {
      const t = triggers[index];
      const open = btn.classList.contains('open');
      t.classList.toggle('open', open);
      t.setAttribute('aria-expanded', open);
      const body = t.nextElementSibling;
      if (body) body.classList.toggle('open', open);
    }
  });
};

/* ═══════════════════════════════════════════════════════════
   TAB 4: RECALLS
   ═══════════════════════════════════════════════════════════ */

function renderRecalls() {
  state.tabLoaded['recalls'] = true;
  const panel = document.getElementById('tab-recalls');
  const recallsA = state.drugA.data?.recalls?.results || [];
  const recallsB = state.drugB.data?.recalls?.results || [];

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h2 style="font-size:0.85rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Enforcement & Recall History</h2>
      <button class="btn-info" data-modal="recalls-info" aria-label="Understanding recall classifications">i</button>
    </div>

    <div class="comparison-row">
      <div>
        <div class="comparison-col-header">
          <span class="drug-badge badge-a">A</span>
          ${escapeHtml(state.drugA.name)}
        </div>
        ${buildRecallSection(recallsA, state.drugA.name)}
      </div>
      <div>
        <div class="comparison-col-header">
          <span class="drug-badge badge-b">B</span>
          ${escapeHtml(state.drugB.name)}
        </div>
        ${buildRecallSection(recallsB, state.drugB.name)}
      </div>
    </div>

    <div class="notice-box info" style="margin-top:20px;">
      Enforcement data in OpenFDA goes back to 2004. Absence of recalls here does not guarantee a drug has never been recalled.
    </div>`;
}

function buildRecallSection(recalls, drugName) {
  if (!recalls.length) {
    return `<div class="notice-box success">No recall records found for ${escapeHtml(drugName)} in the OpenFDA enforcement database. Enforcement data goes back to 2004.</div>`;
  }

  const counts = { I: 0, II: 0, III: 0 };
  recalls.forEach(r => {
    const cls = r.classification?.replace('Class ','').trim();
    if (counts[cls] !== undefined) counts[cls]++;
  });

  return `
    <div class="recall-summary-row">
      <div class="recall-summary-card total">
        <div class="recall-summary-num">${recalls.length}</div>
        <div class="recall-summary-label">Total Recalls</div>
      </div>
      <div class="recall-summary-card class1">
        <div class="recall-summary-num">${counts.I}</div>
        <div class="recall-summary-label">Class I — Dangerous</div>
      </div>
      <div class="recall-summary-card class2">
        <div class="recall-summary-num">${counts.II}</div>
        <div class="recall-summary-label">Class II — Moderate</div>
      </div>
      <div class="recall-summary-card class3">
        <div class="recall-summary-num">${counts.III}</div>
        <div class="recall-summary-label">Class III — Minor</div>
      </div>
    </div>
    <div class="recall-timeline">
      ${recalls.slice(0, 20).map(r => recallTimelineItem(r)).join('')}
    </div>
    ${recalls.length > 20 ? `<p style="font-size:0.75rem;color:var(--text-tertiary);margin-top:8px;">Showing 20 of ${recalls.length} recall records.</p>` : ''}
  `;
}

function recallTimelineItem(r) {
  const cls = r.classification?.replace('Class ','').trim() || '?';
  const clsLower = cls.replace('I','i').toLowerCase().replace('iii','class-iii').replace('ii','class-ii').replace('i','class-i').replace('class-','class-');
  const clsClass = `class-${cls.replace('I','i').toLowerCase()}`;
  const badgeCls = r.classification === 'Class I' ? 'class-i' : r.classification === 'Class II' ? 'class-ii' : 'class-iii';
  const date = formatDate(r.report_date);
  const reason = r.reason_for_recall || 'Reason not specified';
  const status = r.status || 'Unknown';

  return `
    <div class="timeline-item ${badgeCls}">
      <div class="timeline-card">
        <div class="timeline-date-row">
          <span class="timeline-date">${date}</span>
          <span class="recall-badge ${badgeCls}">${escapeHtml(r.classification||'Unknown')}</span>
          <span class="recall-badge" style="background:rgba(107,114,128,0.15);color:var(--text-secondary);border:1px solid var(--border-subtle);">${escapeHtml(status)}</span>
        </div>
        <div class="timeline-firm">${escapeHtml(r.recalling_firm || 'Unknown firm')}</div>
        <div class="timeline-reason">${escapeHtml(truncate(reason, 200))}</div>
        <div class="timeline-meta">
          ${r.voluntary_mandated ? `<span class="timeline-tag">${escapeHtml(r.voluntary_mandated)}</span>` : ''}
          ${r.distribution_pattern ? `<span class="timeline-tag">${escapeHtml(truncate(r.distribution_pattern, 40))}</span>` : ''}
          ${r.city && r.state ? `<span class="timeline-tag">${escapeHtml(r.city)}, ${escapeHtml(r.state)}</span>` : ''}
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 5: CO-ADMINISTRATION
   ═══════════════════════════════════════════════════════════ */

async function renderCoAdmin() {
  state.tabLoaded['co-admin'] = true;
  const panel = document.getElementById('tab-co-admin');
  panel.innerHTML = skeletonHTML();

  if (!state.coAdmin.data) {
    state.coAdmin.data = await fetchCoAdmin(state.drugA.name, state.drugB.name);
  }

  const data     = state.coAdmin.data;
  const total    = data?.total || 0;
  const coReacts = data?.reactions?.results || [];
  const coSerious = data?.serious?.results || [];
  const topA     = state.drugA.data?.eventTop?.results || [];
  const topB     = state.drugB.data?.eventTop?.results || [];

  const seriousCoCount = coSerious.find(r => String(r.term) === '1')?.count || 0;
  const nonSeriousCo   = coSerious.find(r => String(r.term) === '2')?.count || 0;
  const seriousRateCo  = total ? ((seriousCoCount / total) * 100).toFixed(1) : '—';

  // Find emerging signals
  const setA = new Set(topA.map(r => r.term));
  const setB = new Set(topB.map(r => r.term));
  const emerging = coReacts.filter(r => !setA.has(r.term) && !setB.has(r.term));

  // Check label for interaction text
  const labelA = state.drugA.data?.label?.results?.[0];
  const labelB = state.drugB.data?.label?.results?.[0];
  const interactTextA = findInteractionText(labelA?.drug_interactions?.[0], state.drugB.name);
  const interactTextB = findInteractionText(labelB?.drug_interactions?.[0], state.drugA.name);

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h2 style="font-size:0.85rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">
        Co-Administration Analysis: ${escapeHtml(state.drugA.name)} + ${escapeHtml(state.drugB.name)}
      </h2>
      <button class="btn-info" data-modal="coadmin-info" aria-label="Drug pairs with known dangerous interactions">i</button>
    </div>

    <div class="coadmin-stat-row mb-20">
      <div class="coadmin-stat">
        <div class="coadmin-num">${formatNum(total)}</div>
        <div class="coadmin-label">Co-Administration Reports</div>
      </div>
      <div class="coadmin-stat">
        <div class="coadmin-num" style="${seriousCoCount > 0 ? 'color:var(--accent-red)' : ''}">${seriousRateCo}%</div>
        <div class="coadmin-label">Serious Rate (Combined)</div>
      </div>
      <div class="coadmin-stat">
        <div class="coadmin-num" style="color:var(--accent-amber)">${emerging.length}</div>
        <div class="coadmin-label">Emerging Signals</div>
      </div>
    </div>

    ${!total ? `<div class="notice-box info mb-20">No FAERS reports found where both drugs appear together. This doesn't mean the combination is safe — it may simply mean co-administration hasn't been widely reported through FAERS.</div>` : ''}

    ${emerging.length > 0 ? `
      <div class="card card-appear mb-20">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-dot" style="background:var(--accent-amber)"></span>
            ⚠ Emerging Signals — Reactions in Combined Reports Not in Either Drug Alone
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${emerging.slice(0,10).map(r => `
            <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);">
              <span class="emerging-badge">⚠ Signal</span>
              <span style="font-size:0.82rem;color:var(--text-primary);">${escapeHtml(titleCase(r.term))}</span>
              <span style="font-size:0.72rem;color:var(--text-tertiary);font-family:var(--font-mono);">(${formatNum(r.count)})</span>
            </div>`).join('')}
        </div>
      </div>` : ''}

    <div class="card card-appear mb-20">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-dot" style="background:var(--accent-cyan)"></span>
          Top Reactions in Co-Administration Reports
        </div>
      </div>
      ${total > 0 ? `<div class="chart-wrapper chart-lg"><canvas id="chart-coadmin-reactions" aria-label="Top reactions in co-administration reports"></canvas></div>`
                  : '<div class="notice-box info">Insufficient co-administration data for chart.</div>'}
    </div>

    ${(interactTextA || interactTextB) ? `
      <div class="card card-appear mb-20">
        <div class="card-header">
          <div class="card-title">
            <span class="card-title-dot" style="background:var(--accent-red)"></span>
            Known Interaction Warning — From Official FDA Labels
          </div>
        </div>
        ${interactTextA ? `
          <div class="notice-box warn mb-16">
            <strong>Found in ${escapeHtml(state.drugA.name)} label (mentions ${escapeHtml(state.drugB.name)}):</strong><br>
            ${escapeHtml(interactTextA)}
          </div>` : ''}
        ${interactTextB ? `
          <div class="notice-box warn">
            <strong>Found in ${escapeHtml(state.drugB.name)} label (mentions ${escapeHtml(state.drugA.name)}):</strong><br>
            ${escapeHtml(interactTextB)}
          </div>` : ''}
      </div>` : ''}

    <div class="notice-box info">
      Co-administration reports indicate these drugs appeared together in the same FAERS report. This does not prove a drug-drug interaction caused the observed events. Consult a healthcare professional about any drug combination.
    </div>`;

  if (total > 0) {
    requestAnimationFrame(() => renderCoAdminChart(coReacts));
  }
}

function findInteractionText(text, drugName) {
  if (!text || !drugName) return null;
  const lower = text.toLowerCase();
  const drugLower = drugName.toLowerCase().trim();
  const idx = lower.indexOf(drugLower);
  if (idx === -1) return null;
  return text.substring(Math.max(0, idx - 50), Math.min(text.length, idx + 200)).trim();
}

function renderCoAdminChart(reactions) {
  const ctx = document.getElementById('chart-coadmin-reactions');
  if (!ctx) return;
  destroyChart('coadmin-reactions');
  const top = reactions.slice(0, 20);
  charts['coadmin-reactions'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map(r => truncate(titleCase(r.term), 30)),
      datasets: [{ label: 'Co-admin Reports', data: top.map(r => r.count), backgroundColor: 'rgba(6,182,212,0.65)', borderColor: '#06B6D4', borderWidth: 1, borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1F2937', bodyColor: '#9CA3AF' } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#6B7280', font: { size: 10 } } },
        y: { grid: { display: false }, ticks: { color: '#9CA3AF', font: { size: 10 } } }
      }
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   DRUG CLASS EXPLORER
   ═══════════════════════════════════════════════════════════ */

async function exploreClass() {
  const sel = document.getElementById('drug-class-select').value;
  if (!sel) return;

  state.mode = 'class';
  state.drugClass.selected = sel;
  document.getElementById('co-admin-tab').classList.add('hidden');

  // Switch to overview tab, show class content
  const panel = document.getElementById('tab-overview');
  panel.innerHTML = skeletonHTML();
  switchTab('overview');

  const classInfo = DRUG_CLASS_INFO[sel];
  if (!classInfo) return;

  // Fetch adverse events for each drug in the class
  const drugList = classInfo.drugs;
  const results = await Promise.allSettled(
    drugList.map(drug => fetchDrugData(drug))
  );

  state.drugClass.drugs = drugList;
  drugList.forEach((drug, i) => {
    state.drugClass.data[drug] = results[i].status === 'fulfilled' ? results[i].value : null;
  });

  renderClassExplorer();
}

function renderClassExplorer() {
  state.tabLoaded['overview'] = true;
  const panel = document.getElementById('tab-overview');
  const sel = state.drugClass.selected;
  const classInfo = DRUG_CLASS_INFO[sel];
  const drugs = state.drugClass.drugs;

  panel.innerHTML = `
    <!-- Class Header -->
    <div class="card card-appear mb-20" style="border-color:rgba(139,92,246,0.3);background:rgba(139,92,246,0.05);">
      <div class="card-title" style="margin-bottom:8px;">
        <span class="card-title-dot" style="background:var(--accent-purple)"></span>
        ${escapeHtml(sel)}
      </div>
      <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.7;">${escapeHtml(classInfo?.description || '')}</p>
    </div>

    <!-- Drug Overview Grid -->
    <div class="section-header mb-16">
      <span class="section-title">Drugs in Class</span>
      <div class="section-divider"></div>
    </div>
    <div class="class-drug-grid mb-20">
      ${drugs.map((drug, i) => {
        const data = state.drugClass.data[drug];
        const total = data?.totalReports || 0;
        const recalls = data?.recalls?.results?.length || 0;
        const color = CHART_COLORS_COMBO[i % CHART_COLORS_COMBO.length];
        return `<div class="class-drug-card card-appear" style="border-left:3px solid ${color};">
          <div class="class-drug-name">${escapeHtml(drug)}</div>
          <div class="class-drug-count">${formatNum(total)} FAERS reports</div>
          <div class="class-drug-count">${recalls} recalls</div>
        </div>`;
      }).join('')}
    </div>

    <!-- Safety Fingerprint Radar -->
    <div class="card card-appear mb-20">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-dot" style="background:var(--accent-purple)"></span>
          Safety Fingerprint Radar — Adverse Event Categories
        </div>
      </div>
      <div class="chart-wrapper chart-md" style="max-width:480px;margin:0 auto;">
        <canvas id="chart-class-radar" aria-label="Safety fingerprint radar chart for drug class"></canvas>
      </div>
    </div>

    <!-- Class Adverse Event Comparison Table -->
    <div class="card card-appear mb-20">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-dot" style="background:var(--accent-cyan)"></span>
          Class-Wide Adverse Event Comparison
        </div>
      </div>
      ${buildClassTable(drugs)}
    </div>

    <!-- Recall comparison -->
    <div class="card card-appear">
      <div class="card-header">
        <div class="card-title">
          <span class="card-title-dot" style="background:var(--accent-amber)"></span>
          Recall Comparison by Class
        </div>
      </div>
      ${buildClassRecallTable(drugs)}
    </div>
  `;

  requestAnimationFrame(() => renderRadarChart(drugs));
}

function getAECategory(term) {
  const t = term.toLowerCase();
  if (/cardiac|heart|arrhyth|atrial|ventricular|myocardi|angina/.test(t)) return 'Cardiac';
  if (/hepat|liver|jaundic|bili|transamin/.test(t)) return 'Hepatic';
  if (/headache|dizz|seizure|neuro|tremor|cogni|memory|confus|encephal/.test(t)) return 'Neurological';
  if (/nausea|vomit|diarr|abdomin|constip|gastro|bowel|stomach/.test(t)) return 'Gastrointestinal';
  if (/rash|pruritus|skin|eczema|urtica|dermati/.test(t)) return 'Dermatological';
  if (/renal|kidney|creatinin|nephro/.test(t)) return 'Renal';
  return null;
}

function renderRadarChart(drugs) {
  const ctx = document.getElementById('chart-class-radar');
  if (!ctx) return;
  destroyChart('class-radar');

  const categories = ['Cardiac','Hepatic','Neurological','Gastrointestinal','Dermatological','Renal'];

  const datasets = drugs.map((drug, i) => {
    const reactions = state.drugClass.data[drug]?.eventTop?.results || [];
    const catCounts = {};
    categories.forEach(c => catCounts[c] = 0);
    reactions.forEach(r => {
      const cat = getAECategory(r.term);
      if (cat) catCounts[cat] += r.count;
    });
    const maxVal = Math.max(...Object.values(catCounts), 1);
    const color = CHART_COLORS_COMBO[i % CHART_COLORS_COMBO.length];
    return {
      label: drug,
      data: categories.map(c => ((catCounts[c] / maxVal) * 100).toFixed(1)),
      backgroundColor: color + '33',
      borderColor: color,
      borderWidth: 2,
      pointBackgroundColor: color
    };
  });

  charts['class-radar'] = new Chart(ctx, {
    type: 'radar',
    data: { labels: categories, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#9CA3AF', font: { size: 10 }, boxWidth: 12, padding: 8 } }, tooltip: { backgroundColor: '#1F2937', bodyColor: '#9CA3AF' } },
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          pointLabels: { color: '#9CA3AF', font: { size: 10 } },
          ticks: { color: '#6B7280', backdropColor: 'transparent', font: { size: 8 } }
        }
      }
    }
  });
}

function buildClassTable(drugs) {
  // Gather top reactions across all drugs
  const allTerms = new Set();
  drugs.forEach(drug => {
    (state.drugClass.data[drug]?.eventTop?.results || []).slice(0, 8).forEach(r => allTerms.add(r.term));
  });
  const terms = [...allTerms].slice(0, 15);

  const drugMaps = {};
  drugs.forEach(drug => {
    drugMaps[drug] = Object.fromEntries(
      (state.drugClass.data[drug]?.eventTop?.results || []).map(r => [r.term, r.count])
    );
  });

  // Max per term for heat coloring
  const maxPerTerm = {};
  terms.forEach(t => {
    maxPerTerm[t] = Math.max(...drugs.map(d => drugMaps[d][t] || 0), 1);
  });

  return `
    <div class="comparison-table-wrapper">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Adverse Event</th>
            ${drugs.map((d, i) => `<th style="color:${CHART_COLORS_COMBO[i % CHART_COLORS_COMBO.length]}">${escapeHtml(d)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${terms.map(term => `
            <tr>
              <td style="color:var(--text-primary)">${escapeHtml(titleCase(term))}</td>
              ${drugs.map(drug => {
                const count = drugMaps[drug][term] || 0;
                const intensity = count ? Math.round((count / maxPerTerm[term]) * 100) : 0;
                const bg = count ? `rgba(6,182,212,${0.05 + intensity * 0.007})` : 'transparent';
                return `<td><span class="cell-heat" style="background:${bg}">${count ? formatNum(count) : '—'}</span></td>`;
              }).join('')}
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function buildClassRecallTable(drugs) {
  return `
    <div class="comparison-table-wrapper">
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Drug</th>
            <th style="color:var(--accent-red)">Class I</th>
            <th style="color:var(--accent-amber)">Class II</th>
            <th style="color:var(--accent-green)">Class III</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${drugs.map(drug => {
            const recalls = state.drugClass.data[drug]?.recalls?.results || [];
            const i  = recalls.filter(r => r.classification === 'Class I').length;
            const ii = recalls.filter(r => r.classification === 'Class II').length;
            const iii= recalls.filter(r => r.classification === 'Class III').length;
            return `<tr>
              <td style="color:var(--text-primary);font-weight:500;">${escapeHtml(drug)}</td>
              <td><span style="color:var(--accent-red)">${i}</span></td>
              <td><span style="color:var(--accent-amber)">${ii}</span></td>
              <td><span style="color:var(--accent-green)">${iii}</span></td>
              <td style="color:var(--text-primary);font-weight:600;">${recalls.length}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   MODAL SYSTEM
   ═══════════════════════════════════════════════════════════ */

const MODAL_CONTENT = {
  'how-to-read': {
    title: 'How to Read This Data',
    body: `
      <h3>FAERS Adverse Event Reports</h3>
      <p>FAERS (FDA Adverse Event Reporting System) reports are voluntarily submitted by patients, healthcare professionals, and drug manufacturers when they observe an adverse event that may be related to a drug.</p>
      <ul>
        <li>A report linking a drug to an adverse event does <strong>NOT</strong> prove the drug caused the event — it indicates a temporal association only.</li>
        <li>Report counts cannot be used to estimate how common an event actually is in the population.</li>
        <li>Many factors influence reporting: media coverage, regulatory attention, drug age, market size.</li>
        <li>Higher report counts do not necessarily mean a drug is more dangerous.</li>
      </ul>
      <h3>Drug Labels</h3>
      <p>FDA-approved prescribing information reviewed before market authorization. This is the most authoritative source of safety information and represents a legal document manufacturers must keep current.</p>
      <h3>Recalls</h3>
      <p>Enforcement actions from the FDA's MedWatch system. Class I is most serious; Class III least. OpenFDA enforcement data goes back to 2004.</p>
      <div class="modal-notice">Always consult a licensed healthcare professional before making any decisions about medications.</div>`
  },
  'about': {
    title: 'About RxRecon',
    body: `
      <h3>What is RxRecon?</h3>
      <p>RxRecon is a drug safety reconnaissance tool built for AIML 1870 at the University of Nebraska at Omaha. It provides live access to FDA public datasets for educational purposes.</p>
      <h3>Data Sources</h3>
      <ul>
        <li><strong>OpenFDA API</strong> — Free, no API key required, rate limit 240 req/min</li>
        <li><strong>FAERS</strong> — FDA Adverse Event Reporting System</li>
        <li><strong>Drug Labels (SPL)</strong> — Structured Product Labeling from FDA</li>
        <li><strong>Enforcement Database</strong> — FDA recall records since 2004</li>
      </ul>
      <h3>Limitations</h3>
      <ul>
        <li>FAERS is voluntary — underreporting is common</li>
        <li>Label data may not reflect the most current revision</li>
        <li>Some drugs appear under different names across datasets</li>
        <li>This tool is for educational use only</li>
      </ul>
      <div class="modal-notice"><strong>Educational Disclaimer:</strong> RxRecon is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a healthcare professional before making any medical decisions.</div>
      <div class="modal-notice" style="margin-top:8px;"><strong>FDA Attribution:</strong> This product uses publicly available data from the U.S. Food and Drug Administration (FDA). FDA is not responsible for the product and does not endorse or recommend this or any other product.</div>`
  },
  'adverse-events-info': {
    title: 'How to Interpret Adverse Event Data',
    body: `
      <h3>What FAERS Data Shows</h3>
      <p>The FDA Adverse Event Reporting System (FAERS) collects voluntary reports of adverse events from patients, healthcare professionals, and manufacturers. This data powers pharmacovigilance — the science of detecting and preventing drug-related problems.</p>
      <h3>Critical Caveats</h3>
      <ul>
        <li><strong>Correlation ≠ Causation:</strong> A report does not mean the drug caused the event. The patient may have had comorbidities, taken other drugs, or experienced coincidental events.</li>
        <li><strong>Underreporting:</strong> It is estimated that fewer than 10% of adverse events are ever reported to FAERS.</li>
        <li><strong>Reporting Bias:</strong> Events perceived as more severe, newer drugs, and drugs receiving media attention tend to have more reports — not because they're more dangerous, but because awareness drives reporting.</li>
        <li><strong>Absolute counts mislead:</strong> A drug prescribed to 50 million people will accumulate far more reports than one prescribed to 50,000 — even if both are equally safe.</li>
      </ul>
      <h3>How to Use This Data</h3>
      <p>Use FAERS data to identify patterns and signals — areas worth further investigation — not to draw clinical conclusions. Compare trends across drugs, not absolute numbers.</p>`
  },
  'recalls-info': {
    title: 'Understanding Recall Classifications',
    body: `
      <h3>FDA Recall Classes Explained</h3>
      <div style="margin-bottom:12px;">
        <div class="modal-class-badge" style="background:rgba(239,68,68,0.15);color:var(--accent-red);">Class I</div>
        <strong style="color:var(--accent-red);">Dangerous or life-threatening defects</strong>
        <p style="margin-top:4px;">There is a reasonable probability that use will cause serious adverse health consequences or death. Examples: contamination with a dangerous pathogen, wrong active ingredient, incorrect potency causing overdose.</p>
      </div>
      <div style="margin-bottom:12px;">
        <div class="modal-class-badge" style="background:rgba(245,158,11,0.15);color:var(--accent-amber);">Class II</div>
        <strong style="color:var(--accent-amber);">May cause temporary or reversible health problems</strong>
        <p style="margin-top:4px;">Use may cause temporary adverse health consequences, or the probability of serious consequences is remote. Examples: labeling mix-ups without immediate danger, minor contamination unlikely to cause harm.</p>
      </div>
      <div style="margin-bottom:12px;">
        <div class="modal-class-badge" style="background:rgba(16,185,129,0.15);color:var(--accent-green);">Class III</div>
        <strong style="color:var(--accent-green);">Unlikely to cause adverse health consequences</strong>
        <p style="margin-top:4px;">Use is not likely to cause adverse health consequences. Examples: minor labeling errors, cosmetic defects in packaging, wrong label language.</p>
      </div>
      <div class="modal-notice">A drug with zero recalls is not guaranteed to be safer than one with recalls. Absence of recall records may simply reflect the drug's age, market size, or reporting practices.</div>`
  },
  'coadmin-info': {
    title: 'Drug Pairs with Known Dangerous Interactions',
    body: `
      <h3>Classic High-Risk Drug Combinations</h3>
      <p>The following pairs are among the most clinically significant drug-drug interactions:</p>
      <ul>
        <li><strong>Warfarin + NSAIDs (e.g., Ibuprofen):</strong> Greatly increased risk of GI bleeding. NSAIDs inhibit platelet aggregation and damage the GI mucosa, compounding warfarin's anticoagulant effect.</li>
        <li><strong>MAO Inhibitors + Serotonergic Drugs (e.g., SSRIs):</strong> Risk of serotonin syndrome — a potentially fatal condition involving hyperthermia, rigidity, and autonomic instability.</li>
        <li><strong>Methotrexate + NSAIDs:</strong> NSAIDs reduce renal clearance of methotrexate, leading to toxic accumulation and potentially fatal bone marrow suppression.</li>
        <li><strong>Statins + Grapefruit:</strong> Grapefruit inhibits CYP3A4, dramatically increasing statin blood levels and the risk of rhabdomyolysis (muscle breakdown).</li>
        <li><strong>ACE Inhibitors + Potassium-Sparing Diuretics:</strong> Risk of life-threatening hyperkalemia (dangerously elevated blood potassium).</li>
        <li><strong>Benzodiazepines + Opioids:</strong> FDA black box warning — combined CNS depression can cause fatal respiratory depression.</li>
      </ul>
      <div class="modal-notice">Co-administration signals in FAERS do not prove a drug interaction. Always consult a pharmacist or physician before combining medications.</div>`
  },
  'labels-info': {
    title: 'What Drug Labels Actually Tell You',
    body: `
      <h3>About FDA Prescribing Information</h3>
      <p>Drug labels (officially called prescribing information or package inserts) are the FDA-approved documents that accompany every prescription drug. They are reviewed and approved before a drug reaches the market.</p>
      <h3>Why Labels Matter</h3>
      <ul>
        <li>They represent the most authoritative, FDA-reviewed source of drug safety information.</li>
        <li>They are legal documents — manufacturers are required by law to include all known risks.</li>
        <li>Boxed warnings (black box warnings) are the most serious warnings the FDA can require — they indicate a significant risk of serious or life-threatening adverse reactions.</li>
        <li>Drug interaction sections cross-reference known dangerous combinations from clinical trials and post-marketing surveillance.</li>
      </ul>
      <h3>Data in This Tool</h3>
      <p>Label data comes from the FDA's Structured Product Labeling (SPL) format. Some labels may not reflect the absolute latest revision; always check the most current prescribing information for clinical decisions.</p>
      <div class="modal-notice">Labels are written for healthcare professionals. Some clinical language may require professional interpretation.</div>`
  },
  'reporting-bias': {
    title: 'Why Some Drugs Have More Reports Than Others',
    body: `
      <h3>The Reporting Bias Problem</h3>
      <p>Report count in FAERS is one of the most commonly misinterpreted metrics in pharmacovigilance. Here's why raw counts can be deeply misleading:</p>
      <ul>
        <li><strong>Market Share:</strong> A drug prescribed to 50 million people will naturally accumulate far more adverse event reports than one prescribed to 50,000 — even if both drugs are equally safe.</li>
        <li><strong>Notoriety Bias:</strong> Media coverage of a drug's side effects can cause a massive spike in reporting. This doesn't mean the drug became more dangerous — just more scrutinized.</li>
        <li><strong>Drug Age:</strong> Newer drugs often have fewer reports simply because they haven't been on the market long enough.</li>
        <li><strong>Mandatory Reporting:</strong> Cancer drugs, biologics, and drugs with REMS (Risk Evaluation and Mitigation Strategies) programs have higher reporting rates due to regulatory requirements.</li>
        <li><strong>Indication Bias:</strong> A drug used in severely ill patients will naturally accumulate more reports of serious outcomes than a drug used for mild conditions.</li>
      </ul>
      <h3>Best Practice</h3>
      <p>Compare proportionality (what fraction of reports are serious) and reaction profiles (what kinds of events are reported), not absolute counts. Use reporting odds ratios and disproportionality analysis for real pharmacovigilance work.</p>`
  }
};

function openModal(id) {
  const content = MODAL_CONTENT[id];
  if (!content) return;
  document.getElementById('modal-title').textContent = content.title;
  document.getElementById('modal-body').innerHTML = content.body;
  const backdrop = document.getElementById('modal-backdrop');
  backdrop.classList.remove('hidden');
  backdrop.removeAttribute('aria-hidden');
  document.getElementById('modal-close').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  backdrop.classList.add('hidden');
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ═══════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════ */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function titleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function formatNum(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString();
}

function formatDate(d) {
  if (!d) return '—';
  const s = String(d);
  if (s.length === 8) {
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  }
  return s;
}

function cleanLabelText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\r\n|\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function showNotice(msg, type = 'info') {
  const existing = document.getElementById('global-notice');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'global-notice';
  el.className = `notice-box ${type}`;
  el.style.cssText = 'position:fixed;top:72px;right:24px;z-index:500;max-width:360px;animation:fadeSlideUp 0.2s ease both;';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ─── TAB INDICATOR POSITION ─── */
function initTabIndicator() {
  const indicator = document.getElementById('tab-indicator');
  const nav = document.getElementById('tab-nav');
  if (!indicator || !nav) return;
  // Set initial position
  const activeBtn = nav.querySelector('.tab-btn.active');
  if (!activeBtn) return;
  const navRect = nav.getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();
  indicator.style.left  = `${btnRect.left - navRect.left}px`;
  indicator.style.width = `${btnRect.width}px`;
}

/* ─── MODE SLIDER POSITION ─── */
function initModeSlider() {
  const slider = document.querySelector('.mode-slider');
  const toggle = document.querySelector('.mode-toggle');
  if (!slider || !toggle) return;
  const activeBtn = toggle.querySelector('.mode-btn.active');
  if (!activeBtn) return;
  slider.style.width  = `${activeBtn.offsetWidth}px`;
  slider.style.height = `${activeBtn.offsetHeight}px`;
  slider.style.transform = 'translateX(0)';
}

function updateModeSlider(btn) {
  const slider = document.querySelector('.mode-slider');
  const toggle = document.querySelector('.mode-toggle');
  if (!slider || !toggle) return;
  const toggleRect = toggle.getBoundingClientRect();
  const btnRect    = btn.getBoundingClientRect();
  const offset     = btnRect.left - toggleRect.left - 4;
  slider.style.width    = `${btnRect.width}px`;
  slider.style.height   = `${btnRect.height}px`;
  slider.style.transform = `translateX(${offset}px)`;
}

/* ═══════════════════════════════════════════════════════════
   EVENT LISTENERS & INIT
   ═══════════════════════════════════════════════════════════ */

function init() {
  // Mode toggle
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      const mode = btn.dataset.mode;
      state.mode = mode;
      updateModeSlider(btn);

      document.getElementById('comparison-search').classList.toggle('hidden', mode !== 'comparison');
      document.getElementById('class-search').classList.toggle('hidden', mode !== 'class');
      document.getElementById('co-admin-tab').classList.toggle('hidden', mode === 'class');
    });
  });

  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Investigate button
  document.getElementById('investigate-btn').addEventListener('click', investigate);

  // Allow Enter key on inputs
  ['drug-a-input','drug-b-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') investigate(); });
  });

  // Class explorer
  document.getElementById('explore-class-btn').addEventListener('click', exploreClass);
  document.getElementById('drug-class-select').addEventListener('change', e => {
    if (e.target.value) exploreClass();
  });

  // Autocomplete setup
  setupAutocomplete('drug-a-input', 'drug-a-spinner', 'drug-a-dropdown');
  setupAutocomplete('drug-b-input', 'drug-b-spinner', 'drug-b-dropdown');

  // Modal triggers (using event delegation)
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-modal]');
    if (trigger) { e.preventDefault(); openModal(trigger.dataset.modal); }
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-backdrop')) closeModal();
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.add('hidden'));
    }
  });

  // Init visual elements
  initTabIndicator();
  initModeSlider();

  // Re-position tab indicator on resize
  window.addEventListener('resize', () => {
    initTabIndicator();
    initModeSlider();
  });

  // Auto-load default drugs
  document.getElementById('drug-a-input').value = 'warfarin';
  document.getElementById('drug-b-input').value = 'ibuprofen';
  document.getElementById('tab-overview').innerHTML = `
    <div class="initial-state">
      <div class="initial-icon">⚗</div>
      <h2>Loading Intelligence Dossier…</h2>
      <p>Querying FDA databases for Warfarin and Ibuprofen</p>
      <div style="margin-top:16px;" class="spinner-ring" style="margin:0 auto;"></div>
    </div>`;

  // Small delay for visual effect, then investigate
  setTimeout(investigate, 600);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
