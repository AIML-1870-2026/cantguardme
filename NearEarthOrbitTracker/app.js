/* =========================================================
   NEO TRACKER — app.js
   Planetary Defense Dashboard
   ========================================================= */

'use strict';

/* ── Constants ── */
const NASA_KEY   = 'c1gVyjytBTtRq22pO4WjUqH8E7SFoVsVIig7Rhcf';
const NEOWS_BASE = 'https://api.nasa.gov/neo/rest/v1';
const CORS_PROXY = 'https://corsproxy.io/?';
const SBDB_CAD   = CORS_PROXY + 'https://ssd-api.jpl.nasa.gov/cad.api';
const SENTRY_API = CORS_PROXY + 'https://ssd-api.jpl.nasa.gov/sentry.api';
const CACHE_TTL  = 15 * 60 * 1000; // 15 min

/* ── State ── */
const state = {
  neoFeedData:   null,
  cadData:       null,
  sentryData:    null,
  globeInstance: null,
  globeLoaded:   false,
  activeTab:     'tab-week',
  nextApproach:  null,   // { name, date }
  countdownInterval: null,
  neoList:       [],      // flat list for game / globe
  cadSortCol:    'dist',
  cadSortAsc:    true,
  sentrySortCol: 'ps_cum',
  sentrySortAsc: false,
};

/* =========================================================
   CACHE HELPERS
   ========================================================= */
function cacheSet(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch(e) {}
}
function cacheGet(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(key); return null; }
    return data;
  } catch(e) { return null; }
}

/* =========================================================
   DATE HELPERS
   ========================================================= */
function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}
function todayYMD()  { return toYMD(new Date()); }
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toYMD(d);
}
function daysAgoYMD(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toYMD(d);
}
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function fmtDateTime(s) {
  if (!s) return '—';
  const d = new Date(s.replace(' ','T'));
  return d.toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'}) + ' UTC';
}

/* =========================================================
   API FETCH WRAPPER
   ========================================================= */
async function apiFetch(url, cacheKey) {
  if (cacheKey) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);
  const json = await resp.json();
  if (cacheKey) cacheSet(cacheKey, json);
  return json;
}

/* =========================================================
   STARFIELD
   ========================================================= */
function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({length:200}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      a: Math.random() * 0.7 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = Date.now() / 1000;
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height;
      if (s.y > canvas.height) s.y = 0;
      const alpha = s.a * (0.6 + 0.4 * Math.sin(now * 1.2 + s.twinkle));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

/* =========================================================
   TAB NAVIGATION
   ========================================================= */
function initTabs() {
  const btns   = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      document.getElementById(tab)?.classList.add('active');
      state.activeTab = tab;

      if (tab === 'tab-cad' && !state.cadData) loadCAD();
      if (tab === 'tab-sentry' && !state.sentryData) loadSentry();
      if (tab === 'tab-3d' && !state.globeLoaded) initGlobe();
    });
  });
}

/* =========================================================
   COUNTDOWN
   ========================================================= */
function startCountdown() {
  if (state.countdownInterval) clearInterval(state.countdownInterval);
  const el    = document.getElementById('countdown-timer');
  const label = document.getElementById('countdown-name');

  function tick() {
    if (!state.nextApproach) { el.textContent = '-- -- -- --'; return; }
    const diff = state.nextApproach.date - Date.now();
    if (diff <= 0) { el.textContent = 'NOW'; return; }
    const d  = Math.floor(diff / 86400000);
    const h  = Math.floor((diff % 86400000) / 3600000);
    const m  = Math.floor((diff % 3600000) / 60000);
    const s  = Math.floor((diff % 60000) / 1000);
    el.textContent = `${String(d).padStart(2,'0')}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
    label.textContent = state.nextApproach.name || 'Next close approach';
  }

  state.countdownInterval = setInterval(tick, 1000);
  tick();
}

/* =========================================================
   HELPER: H magnitude → diameter estimate
   ========================================================= */
function hToDiameterM(h, albedo=0.15) {
  if (h == null || isNaN(h)) return null;
  const km = (1329 / Math.sqrt(albedo)) * Math.pow(10, -h/5);
  return km * 1000;
}

function diameterLabel(m) {
  if (m == null) return '—';
  if (m < 1000) return `~${Math.round(m)} m`;
  return `~${(m/1000).toFixed(1)} km`;
}

function auToLD(au) {
  return parseFloat(au) / 0.00257;
}

/* =========================================================
   TAB 1 — THIS WEEK (NeoWs /feed)
   ========================================================= */
async function loadThisWeek() {
  const start = todayYMD();
  const end   = daysFromNow(7);
  const url   = `${NEOWS_BASE}/feed?start_date=${start}&end_date=${end}&api_key=${NASA_KEY}`;
  const cacheKey = `neows_feed_${start}`;

  try {
    const data = await apiFetch(url, cacheKey);
    state.neoFeedData = data;

    // Flatten all NEOs
    const all = [];
    const neoByDate = data.near_earth_objects;
    const sortedDates = Object.keys(neoByDate).sort();
    for (const date of sortedDates) {
      for (const neo of neoByDate[date]) {
        const ca = neo.close_approach_data?.[0];
        all.push({
          id:         neo.id,
          name:       neo.name,
          date,
          caDate:     ca?.close_approach_date_full || date,
          caEpoch:    ca?.epoch_date_close_approach,
          missDist:   parseFloat(ca?.miss_distance?.lunar ?? 0),
          missDistKm: parseFloat(ca?.miss_distance?.kilometers ?? 0),
          velocity:   parseFloat(ca?.relative_velocity?.kilometers_per_second ?? 0),
          h:          neo.absolute_magnitude_h,
          hazardous:  neo.is_potentially_hazardous_asteroid,
          sentry:     neo.is_sentry_object,
          diamMin:    neo.estimated_diameter?.meters?.estimated_diameter_min,
          diamMax:    neo.estimated_diameter?.meters?.estimated_diameter_max,
        });
      }
    }
    state.neoList = all;

    // Find next upcoming approach for countdown
    const now = Date.now();
    const upcoming = all
      .filter(a => (a.caEpoch || 0) > now)
      .sort((a,b) => a.caEpoch - b.caEpoch);
    if (upcoming[0]) {
      state.nextApproach = { name: upcoming[0].name, date: upcoming[0].caEpoch };
    } else {
      // use closest by date even if past
      const sorted = [...all].sort((a,b) => Math.abs(a.caEpoch - now) - Math.abs(b.caEpoch - now));
      if (sorted[0]) state.nextApproach = { name: sorted[0].name, date: sorted[0].caEpoch };
    }
    startCountdown();

    renderHeroStats(all);
    renderSpotlight(all);
    renderDailyBreakdown(neoByDate, sortedDates);

  } catch(e) {
    console.error('NeoWs feed error:', e);
    document.getElementById('hero-stats').innerHTML =
      `<div class="error-msg" style="grid-column:span 5"><div class="err-icon">⚠</div><div>Failed to load NeoWs data.<br><small>${e.message}</small></div><button class="err-retry" onclick="loadThisWeek()">Retry</button></div>`;
  }
}

/* ── Hero Stats ── */
function renderHeroStats(all) {
  const total  = all.length;
  const haz    = all.filter(a => a.hazardous);
  const closest = [...all].sort((a,b) => a.missDist - b.missDist)[0];
  const largest = [...all].sort((a,b) => a.h - b.h)[0]; // lower H = larger
  const fastest = [...all].sort((a,b) => b.velocity - a.velocity)[0];

  const cards = [
    { label:'Total Approaches', value: total, sub:'This 7-day window', class:'' },
    { label:'Closest Approach',
      value: closest ? closest.missDist.toFixed(2)+' LD' : '—',
      sub:   closest?.name || '',
      class: '' },
    { label:'Largest Object',
      value: largest ? `H ${largest.h}` : '—',
      sub:   largest ? `${largest.name} · ${diameterLabel((largest.diamMin+largest.diamMax)/2)}` : '',
      class: '' },
    { label:'Fastest Flyby',
      value: fastest ? fastest.velocity.toFixed(1)+' km/s' : '—',
      sub:   fastest?.name || '',
      class: '' },
    { label:'Hazardous Count', value: haz.length, sub:'Potentially hazardous', class:'danger' },
  ];

  document.getElementById('hero-stats').innerHTML = cards.map(c => `
    <div class="stat-card ${c.class}">
      <div class="stat-shimmer"></div>
      <div class="stat-label">${c.label}</div>
      <div class="stat-value">${c.value}</div>
      <div class="stat-sub">${c.sub}</div>
    </div>
  `).join('');
}

/* ── Spotlight ── */
function renderSpotlight(all) {
  // Score: prefer hazardous, high velocity, small miss distance, large size
  function score(a) {
    let s = 0;
    if (a.hazardous) s += 50;
    s += Math.min(30, a.velocity);
    s += Math.max(0, 10 - a.missDist) * 5;
    s += Math.max(0, 30 - a.h);
    return s;
  }
  const featured = [...all].sort((a,b) => score(b) - score(a))[0];
  if (!featured) return;

  const diamAvg = (featured.diamMin + featured.diamMax) / 2;
  const obs     = featured.h < 20 ? 300 : featured.h < 24 ? 120 : 40; // synthetic
  const confPct = Math.min(100, (obs / 200) * 100);
  const confLabel = obs >= 200 ? 'High' : obs >= 50 ? 'Moderate' : 'Low';

  document.getElementById('spotlight-main').innerHTML = `
    <div class="card-title" style="position:absolute;top:12px;right:16px;">ASTEROID OF THE DAY</div>
    <div class="spotlight-name">${featured.name}</div>
    <div class="spotlight-badges">
      ${featured.hazardous ? '<span class="badge badge-danger">⚠ POTENTIALLY HAZARDOUS</span>' : '<span class="badge badge-safe">✓ NON-HAZARDOUS</span>'}
      ${featured.sentry ? '<span class="badge badge-sentry">◉ SENTRY TRACKED</span>' : ''}
      <span class="badge badge-cyan">NASA NEO ID: ${featured.id}</span>
    </div>
    <div class="spotlight-grid">
      <div class="spotlight-metric">
        <label>Close Approach</label>
        <div class="val">${fmtDateTime(featured.caDate)}</div>
      </div>
      <div class="spotlight-metric">
        <label>Miss Distance</label>
        <div class="val">${featured.missDist.toFixed(3)} LD</div>
      </div>
      <div class="spotlight-metric">
        <label>Miss Distance (km)</label>
        <div class="val">${(featured.missDistKm/1e6).toFixed(2)}M km</div>
      </div>
      <div class="spotlight-metric">
        <label>Velocity (km/s)</label>
        <div class="val">${featured.velocity.toFixed(2)} km/s</div>
      </div>
      <div class="spotlight-metric">
        <label>Diameter (est.)</label>
        <div class="val">${Math.round(featured.diamMin)}–${Math.round(featured.diamMax)} m</div>
      </div>
      <div class="spotlight-metric">
        <label data-tooltip="Absolute magnitude. Lower = larger/brighter. H<18 = ~1km+">H Magnitude</label>
        <div class="val">${featured.h} <span style="color:var(--text2);font-size:0.65rem;">${hMagContext(featured.h)}</span></div>
      </div>
    </div>
    <div class="confidence-bar-wrap">
      <label>Observation Confidence: <strong style="color:var(--text)">${confLabel}</strong></label>
      <div class="confidence-bar"><div class="confidence-bar-fill" style="width:${confPct}%;background:${confLabel==='High'?'var(--safe)':confLabel==='Moderate'?'var(--amber)':'var(--danger)'};"></div></div>
    </div>
  `;

  renderSizeComparator(diamAvg);
  renderVelComparator(featured.velocity, featured.hazardous);
}

function hMagContext(h) {
  if (h <= 16) return '(> 2km — city-destroyer)';
  if (h <= 18) return '(~1–2km — major impact)';
  if (h <= 20) return '(~500m+ — regional damage)';
  if (h <= 22) return '(~140–500m — city-killer)';
  if (h <= 24) return '(~50–140m — township damage)';
  if (h <= 26) return '(~20–50m — local blast)';
  return '(< 20m — small)';
}

function renderSizeComparator(diamM) {
  const refs = [
    { name:'School Bus', m: 12 },
    { name:'Football Field', m: 100 },
    { name:'Statue of Liberty', m: 93 },
    { name:'Empire State Bldg', m: 443 },
    { name:'Golden Gate Bridge', m: 2737 },
  ];

  // Pick refs within ~2 orders of magnitude
  const logD = Math.log10(diamM);
  const nearby = refs.filter(r => Math.abs(Math.log10(r.m) - logD) < 1.8);
  const all    = [...nearby, { name: 'Asteroid', m: diamM, highlight: true }]
                 .sort((a,b) => a.m - b.m);

  const maxM  = all[all.length-1].m;
  const W     = 320, H = 64;
  const pad   = 20;
  const usable = W - 2*pad;

  const svgItems = all.map(item => {
    const barW = Math.max(4, (item.m / maxM) * usable);
    const color = item.highlight ? (item.m > 200 ? 'var(--danger)' : 'var(--cyan)') : 'rgba(125,133,144,0.4)';
    const y = 30;
    return `
      <g>
        <rect x="${pad}" y="${y - 6}" width="${barW}" height="12" rx="2" fill="${color}" opacity="${item.highlight?1:0.7}"/>
        <text x="${pad}" y="${y + 22}" fill="${item.highlight?color:'var(--text2)'}" font-family="IBM Plex Mono,monospace" font-size="9" font-weight="${item.highlight?600:400}">${item.name} (${item.m < 1000 ? Math.round(item.m)+'m' : (item.m/1000).toFixed(1)+'km'})</text>
      </g>
    `;
  });

  document.getElementById('size-compare-svg-wrap').innerHTML = `
    <svg width="${W}" height="${H+30}" style="overflow:visible">
      ${svgItems.join('')}
    </svg>
  `;
}

function renderVelComparator(velKms, isHazardous) {
  const refs = [
    { name: 'Bullet (pistol)',   vel: 0.37 },
    { name: 'SR-71 Blackbird',   vel: 0.98 },
    { name: 'ISS Orbital',       vel: 7.66 },
    { name: 'Parker Solar Probe',vel: 192  },
    { name: 'This Asteroid',     vel: velKms, highlight: true },
  ].sort((a,b) => a.vel - b.vel);

  const maxV = refs[refs.length-1].vel;

  document.getElementById('vel-compare-bars').innerHTML = refs.map(r => `
    <div class="vel-bar-item">
      <div class="vel-bar-label">${r.name}</div>
      <div class="vel-bar-track">
        <div class="vel-bar-fill ${r.highlight ? (isHazardous?'highlight danger':'highlight') : ''}"
             style="width:${Math.max(2,(r.vel/maxV)*100)}%"></div>
      </div>
      <div class="vel-bar-val">${r.vel < 10 ? r.vel.toFixed(2) : r.vel.toFixed(0)} km/s</div>
    </div>
  `).join('');
}

/* ── Daily Breakdown ── */
function renderDailyBreakdown(neoByDate, sortedDates) {
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = '';

  for (const date of sortedDates) {
    const neos    = neoByDate[date];
    const d       = new Date(date + 'T12:00:00Z');
    const dayName = dayNames[d.getUTCDay()];
    const hazCount = neos.filter(n => n.is_potentially_hazardous_asteroid).length;

    html += `
      <div class="day-section" id="day-${date}">
        <div class="day-header" onclick="toggleDay('${date}')">
          <div class="day-header-left">
            <span>${dayName} ${fmtDate(date)}</span>
            <span class="day-count-badge">${neos.length} NEO${neos.length!==1?'s':''}</span>
            ${hazCount > 0 ? `<span class="badge badge-danger">${hazCount} hazardous</span>` : ''}
          </div>
          <span class="day-chevron">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </span>
        </div>
        <div class="day-body">
          <div class="neo-table-header">
            <span>Name</span><span>H</span><span>Diameter</span>
            <span>Miss Dist (LD)</span><span>Velocity (km/s)</span>
            <span></span><span></span>
          </div>
          ${neos.map(neo => renderNeoRow(neo)).join('')}
        </div>
      </div>
    `;
  }

  document.getElementById('daily-breakdown').innerHTML = html;

  // Open first day by default
  if (sortedDates[0]) toggleDay(sortedDates[0]);
}

function renderNeoRow(neo) {
  const ca       = neo.close_approach_data?.[0];
  const missDist = parseFloat(ca?.miss_distance?.lunar ?? 0).toFixed(3);
  const vel      = parseFloat(ca?.relative_velocity?.kilometers_per_second ?? 0).toFixed(2);
  const dMin     = neo.estimated_diameter?.meters?.estimated_diameter_min;
  const dMax     = neo.estimated_diameter?.meters?.estimated_diameter_max;
  const dAvg     = dMin != null ? Math.round((dMin + dMax) / 2) : null;
  const isHaz    = neo.is_potentially_hazardous_asteroid;

  return `
    <div class="neo-row ${isHaz?'hazardous':'safe-row'}" onclick="toggleNeoDetail('${neo.id}')">
      <div class="neo-row-name">${neo.name}</div>
      <div class="neo-row-val">${neo.absolute_magnitude_h ?? '—'}</div>
      <div class="neo-row-val">${dAvg != null ? dAvg+'m' : '—'}</div>
      <div class="neo-row-val" style="color:${parseFloat(missDist)<1?'var(--danger)':parseFloat(missDist)<5?'var(--amber)':'var(--text2)'}">${missDist}</div>
      <div class="neo-row-val">${vel}</div>
      <div class="neo-row-val">${isHaz ? '<span class="badge badge-danger" style="font-size:0.5rem;">HAZ</span>' : '<span class="badge badge-safe" style="font-size:0.5rem;">SAFE</span>'}</div>
      <button class="neo-row-expand" onclick="event.stopPropagation();toggleNeoDetail('${neo.id}')">▾</button>
    </div>
    <div class="neo-row-detail" id="neo-detail-${neo.id}">
      <div class="neo-row-detail-grid">
        <div class="neo-row-detail-item"><label>Full Name</label><span>${neo.name}</span></div>
        <div class="neo-row-detail-item"><label>NASA ID</label><span>${neo.id}</span></div>
        <div class="neo-row-detail-item"><label>Approach Date</label><span>${fmtDateTime(ca?.close_approach_date_full || neo.close_approach_data?.[0]?.close_approach_date)}</span></div>
        <div class="neo-row-detail-item"><label>Sentry Object</label><span>${neo.is_sentry_object ? '⚡ Yes' : 'No'}</span></div>
        <div class="neo-row-detail-item"><label>Miss Dist (AU)</label><span>${parseFloat(ca?.miss_distance?.astronomical ?? 0).toFixed(6)} AU</span></div>
        <div class="neo-row-detail-item"><label>Miss Dist (km)</label><span>${(parseFloat(ca?.miss_distance?.kilometers ?? 0)/1e6).toFixed(2)}M km</span></div>
        <div class="neo-row-detail-item"><label>Diameter Min</label><span>${dMin != null ? Math.round(dMin)+'m' : '—'}</span></div>
        <div class="neo-row-detail-item"><label>Diameter Max</label><span>${dMax != null ? Math.round(dMax)+'m' : '—'}</span></div>
      </div>
    </div>
  `;
}

window.toggleDay = function(date) {
  const el = document.getElementById(`day-${date}`);
  if (el) el.classList.toggle('open');
};
window.toggleNeoDetail = function(id) {
  const el = document.getElementById(`neo-detail-${id}`);
  if (el) el.classList.toggle('open');
};

/* =========================================================
   TAB 2 — CLOSE APPROACHES (SBDB CAD API)
   ========================================================= */
async function loadCAD() {
  const startEl = document.getElementById('cad-start');
  const endEl   = document.getElementById('cad-end');
  const distEl  = document.getElementById('cad-dist-slider');
  const sizeEl  = document.getElementById('cad-size');

  const distLD = parseFloat(distEl.value);
  const hMax   = sizeEl.value ? `&h-max=${sizeEl.value}` : '';
  const start  = startEl.value || daysAgoYMD(30);
  const end    = endEl.value   || daysFromNow(30);

  const url = `${SBDB_CAD}?dist-max=${distLD}LD&date-min=${start}&date-max=${end}&fullname=true&diameter=true${hMax}&sort=dist&limit=500`;
  const cacheKey = `cad_${start}_${end}_${distLD}_${sizeEl.value}`;

  document.getElementById('cad-rows').innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:40px;"><div class="loading-spinner"></div></div>`;

  try {
    const data = await apiFetch(url, cacheKey);
    state.cadData = data;
    renderCADTable(data);
    renderRecordBreakers(data);
  } catch(e) {
    console.error('CAD error:', e);
    document.getElementById('cad-rows').innerHTML =
      `<div class="error-msg"><div class="err-icon">⚠</div><div>Failed to load close approach data.<br><small>${e.message}</small></div><button class="err-retry" onclick="loadCAD()">Retry</button></div>`;
  }
}

function renderCADTable(data) {
  const fields  = data.fields || [];
  const rows    = data.data   || [];
  const fi      = f => fields.indexOf(f);

  const iDes    = fi('des');
  const iFulln  = fi('fullname');
  const iCd     = fi('cd');
  const iDist   = fi('dist');
  const iDistMin= fi('dist_min');
  const iDistMax= fi('dist_max');
  const iVrel   = fi('v_rel');
  const iH      = fi('h');

  const col  = state.cadSortCol;
  const asc  = state.cadSortAsc;

  let sorted = [...rows].sort((a,b) => {
    let av, bv;
    const getVal = (r, c) => {
      if (c === 'dist')     return parseFloat(r[iDist]);
      if (c === 'dist_min') return parseFloat(r[iDistMin]);
      if (c === 'v_rel')    return parseFloat(r[iVrel]);
      if (c === 'h')        return parseFloat(r[iH]);
      if (c === 'cd')       return new Date(r[iCd]).getTime();
      if (c === 'fullname') return (r[iFulln]||r[iDes]||'').toLowerCase();
      return 0;
    };
    av = getVal(a, col);
    bv = getVal(b, col);
    if (av < bv) return asc ? -1 : 1;
    if (av > bv) return asc ? 1 : -1;
    return 0;
  });

  if (sorted.length === 0) {
    document.getElementById('cad-rows').innerHTML = `<div class="error-msg"><div>No results found for the current filters.</div></div>`;
    return;
  }

  // Update header sort indicators
  document.querySelectorAll('.results-table-header span[data-col]').forEach(s => {
    s.classList.toggle('sorted', s.dataset.col === col);
    s.textContent = s.textContent.replace(' ▲','').replace(' ▼','');
    if (s.dataset.col === col) s.textContent += asc ? ' ▲' : ' ▼';
  });

  document.getElementById('cad-rows').innerHTML = sorted.map(r => {
    const fullname = r[iFulln] || r[iDes] || '—';
    const cd       = r[iCd]   || '—';
    const distAU   = parseFloat(r[iDist]);
    const distLD   = distAU / 0.00257;
    const dMinAU   = parseFloat(r[iDistMin]);
    const dMaxAU   = parseFloat(r[iDistMax]);
    const dMinLD   = dMinAU / 0.00257;
    const dMaxLD   = dMaxAU / 0.00257;
    const vrel     = parseFloat(r[iVrel]);
    const h        = parseFloat(r[iH]);
    const diam     = hToDiameterM(h);
    const rowClass = distLD < 1 ? 'row-red' : distLD < 5 ? 'row-amber' : '';

    // Uncertainty bar: min..max range, w=200px
    const uncRange   = dMaxLD - dMinLD;
    const maxForBar  = Math.max(distLD * 2, dMaxLD + 1);
    const leftPct    = (dMinLD / maxForBar) * 100;
    const widthPct   = (uncRange / maxForBar) * 100;
    const nomPct     = (distLD  / maxForBar) * 100;

    const uncBarHtml = `
      <div class="unc-bar-wrap" style="width:120px;">
        <div class="unc-bar-range" style="left:${leftPct.toFixed(1)}%;width:${Math.max(1,widthPct.toFixed(1))}%;"></div>
        <div class="unc-bar-dot"  style="left:${nomPct.toFixed(1)}%;"></div>
      </div>`;

    const rowId = `cad-${r[iDes] || Math.random()}`.replace(/[^a-zA-Z0-9-]/g,'_');
    return `
      <div class="cad-row ${rowClass}" id="${rowId}-row">
        <div class="cad-row-cell">${fullname}</div>
        <div class="cad-row-cell dim">${fmtDate(cd)}</div>
        <div class="cad-row-cell" style="color:${distLD<1?'var(--danger)':distLD<5?'var(--amber)':'var(--text)'}">${distLD.toFixed(3)}</div>
        <div class="cad-row-cell">${uncBarHtml}</div>
        <div class="cad-row-cell dim">${vrel.toFixed(2)}</div>
        <div class="cad-row-cell dim">${isNaN(h)?'—':h}</div>
        <div class="cad-row-cell dim">${diam != null ? diameterLabel(diam) : '—'}</div>
        <button class="cad-expand-btn" onclick="toggleCadDetail('${rowId}')">▾</button>
      </div>
      <div class="cad-row-detail" id="${rowId}-detail">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-family:var(--font-data);font-size:0.65rem;">
          <div><div style="color:var(--text2);font-size:0.5rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Designation</div><div>${r[iDes]||'—'}</div></div>
          <div><div style="color:var(--text2);font-size:0.5rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Dist Min (LD)</div><div>${dMinLD.toFixed(4)}</div></div>
          <div><div style="color:var(--text2);font-size:0.5rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Dist Max (LD)</div><div>${dMaxLD.toFixed(4)}</div></div>
          <div><div style="color:var(--text2);font-size:0.5rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Uncertainty (±LD)</div><div>${(uncRange/2).toFixed(4)}</div></div>
          <div><div style="color:var(--text2);font-size:0.5rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Dist (AU)</div><div>${distAU.toFixed(6)}</div></div>
          <div><div style="color:var(--text2);font-size:0.5rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Dist (km)</div><div>${(distAU*149597870.7).toFixed(0)} km</div></div>
          <div><div style="color:var(--text2);font-size:0.5rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Velocity (km/s)</div><div>${vrel.toFixed(3)}</div></div>
          <div><div style="color:var(--text2);font-size:0.5rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">Size Context</div><div>${diam!=null?`≈${diameterLabel(diam)} (H=${isNaN(h)?'—':h})`:'—'}</div></div>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleCadDetail = function(id) {
  document.getElementById(`${id}-detail`)?.classList.toggle('open');
};

function renderRecordBreakers(data) {
  const fields = data.fields || [];
  const rows   = data.data   || [];
  const fi     = f => fields.indexOf(f);
  const iDist  = fi('dist');
  const iVrel  = fi('v_rel');
  const iH     = fi('h');
  const iFulln = fi('fullname');
  const iDes   = fi('des');

  const sorted = [...rows].filter(r => r[iDist]);

  const closest  = [...sorted].sort((a,b) => parseFloat(a[iDist]) - parseFloat(b[iDist]))[0];
  const fastest  = [...sorted].sort((a,b) => parseFloat(b[iVrel]||0) - parseFloat(a[iVrel]||0))[0];
  const withinLD = sorted.filter(r => (parseFloat(r[iDist])/0.00257) < 1);
  const largest1LD = withinLD.sort((a,b) => parseFloat(a[iH]||99) - parseFloat(b[iH]||99))[0];

  const name = r => r ? (r[iFulln] || r[iDes] || '—') : '—';

  document.getElementById('record-grid').innerHTML = `
    <div class="record-card">
      <div class="record-icon">🎯</div>
      <div class="record-title">Closest Recorded</div>
      <div class="record-val">${closest ? (parseFloat(closest[iDist])/0.00257).toFixed(4)+' LD' : '—'}</div>
      <div class="record-name">${name(closest)}</div>
    </div>
    <div class="record-card">
      <div class="record-icon">⚡</div>
      <div class="record-title">Fastest Flyby</div>
      <div class="record-val">${fastest ? parseFloat(fastest[iVrel]).toFixed(2)+' km/s' : '—'}</div>
      <div class="record-name">${name(fastest)}</div>
    </div>
    <div class="record-card">
      <div class="record-icon">🪨</div>
      <div class="record-title">Largest Within 1 LD</div>
      <div class="record-val">${largest1LD ? 'H='+parseFloat(largest1LD[iH]).toFixed(1) : 'None in range'}</div>
      <div class="record-name">${name(largest1LD)}</div>
    </div>
  `;
}

/* ── CAD filter controls ── */
function initCADControls() {
  const slider  = document.getElementById('cad-dist-slider');
  const valEl   = document.getElementById('cad-dist-val');
  const startEl = document.getElementById('cad-start');
  const endEl   = document.getElementById('cad-end');
  const applyBtn= document.getElementById('cad-apply-btn');

  startEl.value = daysAgoYMD(30);
  endEl.value   = daysFromNow(30);

  slider.addEventListener('input', () => {
    valEl.textContent = slider.value + ' LD';
  });
  applyBtn.addEventListener('click', loadCAD);

  // Presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.preset;
      if (p === 'month') {
        startEl.value = todayYMD();
        endEl.value   = daysFromNow(30);
        slider.value  = 30;
        valEl.textContent = '30 LD';
        document.getElementById('cad-size').value = '';
      } else if (p === 'sublunar') {
        startEl.value = daysAgoYMD(365);
        endEl.value   = daysFromNow(365);
        slider.value  = 1;
        valEl.textContent = '1 LD';
        document.getElementById('cad-size').value = '';
      } else if (p === 'citykillers') {
        startEl.value = daysAgoYMD(365);
        endEl.value   = daysFromNow(365);
        slider.value  = 75;
        valEl.textContent = '75 LD';
        document.getElementById('cad-size').value = '22';
      } else if (p === '365') {
        startEl.value = todayYMD();
        endEl.value   = daysFromNow(365);
        slider.value  = 30;
        valEl.textContent = '30 LD';
        document.getElementById('cad-size').value = '';
      }
      loadCAD();
    });
  });

  // Sortable headers
  document.querySelectorAll('.results-table-header span[data-col]').forEach(s => {
    s.addEventListener('click', () => {
      const col = s.dataset.col;
      if (state.cadSortCol === col) state.cadSortAsc = !state.cadSortAsc;
      else { state.cadSortCol = col; state.cadSortAsc = true; }
      if (state.cadData) renderCADTable(state.cadData);
    });
  });
}

/* =========================================================
   TAB 3 — SENTRY WATCH
   ========================================================= */
async function loadSentry() {
  // ps-min=-5 filters to highest-threat objects; keeps response under proxy size limit
  // (no 'limit' param exists in this API; ps-min is the correct filter)
  const url = `${SENTRY_API}?ps-min=-5`;
  const cacheKey = 'sentry_ps5';

  try {
    const data = await apiFetch(url, cacheKey);
    state.sentryData = data;
    renderGauge(data);
    renderSentryStats(data);
    renderSentryTable(data);
    renderRiskTimeline(data);
  } catch(e) {
    console.error('Sentry error:', e);
    document.getElementById('sentry-rows').innerHTML =
      `<div class="error-msg"><div class="err-icon">⚠</div><div>Failed to load Sentry data.<br><small>${e.message}</small></div><button class="err-retry" onclick="loadSentry()">Retry</button></div>`;
  }
}

/* ── Threat Gauge ── */
function renderGauge(data) {
  const canvas = document.getElementById('gauge-canvas');
  const ctx    = canvas.getContext('2d');
  const objs   = data.data || [];

  // Find highest ps_cum
  let maxPS = -10, worstObj = null;
  for (const o of objs) {
    const ps = parseFloat(o.ps_cum ?? o.ps_max ?? -99);
    if (ps > maxPS) { maxPS = ps; worstObj = o; }
  }

  // Draw speedometer arc: -10 to +2 range
  const W = 260, H = 160;
  const cx = W/2, cy = H - 20;
  const R = 100;

  // Map ps to angle: -10 = π, 0 = 0, >0 = a bit past
  const ps_min = -10, ps_max = 2;
  const ps_clamped = Math.max(ps_min, Math.min(ps_max, maxPS));
  const fraction = (ps_clamped - ps_min) / (ps_max - ps_min);
  const needleAngle = Math.PI - fraction * Math.PI;

  ctx.clearRect(0, 0, W, H);

  // Background arc (gradient)
  const grad = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
  grad.addColorStop(0,    '#00e59b');
  grad.addColorStop(0.5,  '#ffb800');
  grad.addColorStop(0.75, '#ff7700');
  grad.addColorStop(1,    '#ff4d2a');

  ctx.beginPath();
  ctx.arc(cx, cy, R, Math.PI, 0);
  ctx.lineWidth = 18;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.stroke();

  // Colored arc up to needle
  ctx.beginPath();
  ctx.arc(cx, cy, R, Math.PI, needleAngle);
  ctx.lineWidth = 18;
  ctx.strokeStyle = grad;
  ctx.stroke();

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI - (i/10) * Math.PI;
    const x1 = cx + (R - 12) * Math.cos(a);
    const y1 = cy - (R - 12) * Math.sin(a);
    const x2 = cx + R * Math.cos(a);
    const y2 = cy - R * Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = i % 5 === 0 ? 2 : 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
  }

  // Needle
  const nx = cx + (R - 20) * Math.cos(needleAngle);
  const ny = cy - (R - 20) * Math.sin(needleAngle);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI*2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  // Labels
  ctx.font = '10px IBM Plex Mono, monospace';
  ctx.fillStyle = 'rgba(125,133,144,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('-10', cx - R - 6, cy + 14);
  ctx.textAlign = 'center';
  ctx.fillText('0', cx, cy - R + 20);
  ctx.textAlign = 'right';
  ctx.fillText('+2', cx + R + 6, cy + 14);

  const color = maxPS > 0 ? '#ff4d2a' : maxPS > -2 ? '#ffb800' : '#00e59b';
  document.getElementById('gauge-label').style.color = color;
  document.getElementById('gauge-label').textContent  =
    maxPS > 0  ? `Palermo ${maxPS.toFixed(2)} — ELEVATED CONCERN` :
    maxPS > -2 ? `Palermo ${maxPS.toFixed(2)} — MONITOR` :
                 `Palermo ${maxPS.toFixed(2)} — BELOW BACKGROUND`;

  document.getElementById('gauge-driven').textContent =
    worstObj ? `Driven by: ${worstObj.des}` : '';
}

function renderSentryStats(data) {
  const objs = data.data || [];
  const torinoPos = objs.filter(o => parseInt(o.ts_max||0) > 0);
  const allDates  = objs.map(o => o.range ? o.range.split('-')[0] : null).filter(Boolean).sort();
  const earliest  = allDates[0] ? allDates[0] : '—';

  document.getElementById('sentry-summary-stats').innerHTML = `
    <div class="sentry-stat-card">
      <div class="sentry-stat-label">Total Tracked Objects</div>
      <div class="sentry-stat-val">${objs.length}</div>
    </div>
    <div class="sentry-stat-card">
      <div class="sentry-stat-label">Torino Scale &gt; 0</div>
      <div class="sentry-stat-val" style="color:${torinoPos.length>0?'var(--amber)':'var(--cyan)'}">${torinoPos.length}</div>
    </div>
    <div class="sentry-stat-card">
      <div class="sentry-stat-label">Earliest Impact Window</div>
      <div class="sentry-stat-val" style="font-size:0.85rem;">${earliest}</div>
    </div>
  `;
}

function renderSentryTable(data) {
  const objs = data.data || [];
  const col  = state.sentrySortCol;
  const asc  = state.sentrySortAsc;

  const sortFn = (a, b) => {
    const getV = o => {
      if (col === 'ps_cum')    return parseFloat(o.ps_cum  ?? o.ps_max ?? -99);
      if (col === 'ps_max')    return parseFloat(o.ps_max ?? -99);
      if (col === 'ip')        return parseFloat(o.ip ?? 0);
      if (col === 'diameter')  return parseFloat(o.diameter ?? 0);
      if (col === 'h')         return parseFloat(o.h ?? 99);
      if (col === 'ts_max')    return parseInt(o.ts_max ?? 0);
      if (col === 'n_imp')     return parseInt(o.n_imp ?? 0);
      if (col === 'v_imp')     return parseFloat(o.v_inf ?? 0);
      if (col === 'last_obs')  return new Date(o.last_obs || '2000-01-01').getTime();
      return 0;
    };
    const av = getV(a), bv = getV(b);
    return asc ? av - bv : bv - av;
  };

  const sorted = [...objs].sort(sortFn);

  // Update header
  document.querySelectorAll('.sentry-table-header span[data-col]').forEach(s => {
    s.classList.toggle('sorted', s.dataset.col === col);
  });

  document.getElementById('sentry-rows').innerHTML = sorted.map(o => {
    const ps     = parseFloat(o.ps_cum ?? o.ps_max ?? -99);
    const ts     = parseInt(o.ts_max ?? 0);
    const ipPct  = (parseFloat(o.ip ?? 0) * 100).toExponential(2);
    const diam   = o.diameter ? `${parseFloat(o.diameter).toFixed(2)} km` : '—';
    const lastObsDate = o.last_obs ? new Date(o.last_obs) : null;
    const yearsDiff = lastObsDate ? (Date.now() - lastObsDate.getTime()) / (365.25*24*3600*1000) : 99;
    const obsColor = yearsDiff < 1 ? 'var(--safe)' : yearsDiff < 3 ? 'var(--amber)' : 'var(--danger)';
    const psColor  = ps > 0 ? 'var(--danger)' : ps > -2 ? 'var(--amber)' : ps > -3 ? 'var(--text)' : 'var(--text2)';
    const torinoClass = ts === 0 ? 'torino-0' : ts === 1 ? 'torino-1' : ts <= 4 ? 'torino-24' : ts <= 7 ? 'torino-57' : 'torino-810';
    const range = o.range || '—';

    const safeId = (o.des||Math.random()).toString().replace(/[^a-zA-Z0-9]/g,'_');
    return `
      <div class="sentry-row" onclick="toggleSentryDetail('${safeId}')">
        <div class="sentry-cell">${o.des||'—'}</div>
        <div class="sentry-cell dim">${diam}</div>
        <div class="sentry-cell dim">${o.h??'—'}</div>
        <div class="sentry-cell">${ipPct}</div>
        <div class="sentry-cell" style="color:${psColor}">${ps.toFixed(2)}</div>
        <div class="sentry-cell" style="color:${psColor}">${parseFloat(o.ps_max??-99).toFixed(2)}</div>
        <div class="sentry-cell"><span class="torino-badge ${torinoClass}">${ts}</span></div>
        <div class="sentry-cell dim">${o.n_imp??'—'}</div>
        <div class="sentry-cell dim">${o.v_inf ? parseFloat(o.v_inf).toFixed(2)+' km/s' : '—'}</div>
        <div class="sentry-cell dim" style="font-size:0.55rem;">${range}</div>
        <div class="sentry-cell" style="color:${obsColor}">${o.last_obs||'—'}</div>
        <button class="cad-expand-btn" onclick="event.stopPropagation();toggleSentryDetail('${safeId}')">▾</button>
      </div>
      <div class="sentry-row-detail" id="sentry-detail-${safeId}">
        <div style="font-family:var(--font-data);font-size:0.6rem;color:var(--text2);margin-bottom:8px;">
          Loading impact solutions for ${o.des}...
        </div>
      </div>
    `;
  }).join('');
}

window.toggleSentryDetail = async function(safeId) {
  const el = document.getElementById(`sentry-detail-${safeId}`);
  if (!el) return;
  el.classList.toggle('open');
  if (!el.classList.contains('open')) return;
  if (el.dataset.loaded) return;

  const des = el.closest('.sentry-row-detail').previousElementSibling.querySelector('.sentry-cell')?.textContent?.trim();
  if (!des) return;

  try {
    const url  = `${SENTRY_API}?des=${encodeURIComponent(des)}`;
    const data = await apiFetch(url, `sentry_${des}`);
    el.dataset.loaded = '1';
    const impactors = data.data || [];
    if (!impactors.length) {
      el.innerHTML = `<div style="color:var(--text2);font-family:var(--font-data);font-size:0.6rem;">No virtual impactors found.</div>`;
      return;
    }
    const fields = data.fields || [];
    const fi = f => fields.indexOf(f);
    el.innerHTML = `
      <div class="vi-table-wrap">
        <table class="vi-table">
          <thead><tr>
            <th>Year</th><th>Probability</th><th>Palermo</th><th>Torino</th>
            <th>Energy (MT)</th><th>Hiroshimas</th><th>Sigma</th><th>Keyhole Width</th>
          </tr></thead>
          <tbody>
            ${impactors.slice(0,20).map(r => {
              const energy = parseFloat(r[fi('energy')]||r[fi('ip')]||0);
              const energyMT = isNaN(energy) ? '—' : energy.toExponential(2) + ' MT';
              const hBombs = isNaN(energy) ? '—' : Math.round(energy * 66.7);
              return `<tr>
                <td>${r[fi('date')]||r[fi('range_min_date')]||'—'}</td>
                <td>${r[fi('ip')]||'—'}</td>
                <td>${r[fi('ps')]||'—'}</td>
                <td>${r[fi('ts')]||0}</td>
                <td>${energyMT}</td>
                <td>${typeof hBombs==='number'?hBombs.toLocaleString():hBombs}</td>
                <td>${r[fi('sigma')]||'—'}</td>
                <td>${r[fi('width')]||'—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch(e) {
    el.innerHTML = `<div style="color:var(--danger);font-family:var(--font-data);font-size:0.6rem;">Could not load impact solutions: ${e.message}</div>`;
  }
};

/* ── Sentry header sort ── */
function initSentrySort() {
  document.querySelectorAll('.sentry-table-header span[data-col]').forEach(s => {
    s.addEventListener('click', () => {
      const col = s.dataset.col;
      if (state.sentrySortCol === col) state.sentrySortAsc = !state.sentrySortAsc;
      else { state.sentrySortCol = col; state.sentrySortAsc = false; }
      if (state.sentryData) renderSentryTable(state.sentryData);
    });
  });
}

/* ── Risk Timeline ── */
function renderRiskTimeline(data) {
  const objs = data.data || [];
  const svg  = document.getElementById('risk-timeline-svg');
  const W    = Math.max(1200, objs.length * 14);
  const H    = 100;
  const y    = 50;
  const yearStart = 2026;
  const yearEnd   = 2126;
  const yearSpan  = yearEnd - yearStart;
  const toX = yr => ((yr - yearStart) / yearSpan) * (W - 80) + 40;

  let svgContent = `
    <line x1="${toX(yearStart)}" y1="20" x2="${toX(yearEnd)}" y2="20" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <line x1="${toX(2026)}" y1="5" x2="${toX(2026)}" y2="80" stroke="var(--cyan)" stroke-width="2" opacity="0.8"/>
    <text x="${toX(2026)}" y="88" fill="var(--cyan)" font-family="IBM Plex Mono,monospace" font-size="9" text-anchor="middle">NOW</text>
  `;

  // Year labels every 10 years
  for (let yr = yearStart; yr <= yearEnd; yr += 10) {
    svgContent += `<text x="${toX(yr)}" y="10" fill="rgba(125,133,144,0.6)" font-family="IBM Plex Mono,monospace" font-size="8" text-anchor="middle">${yr}</text>`;
  }

  for (const o of objs) {
    const rMin = parseFloat(o.range_min_date) || yearStart;
    const rMax = parseFloat(o.range_max_date) || rMin;
    const ps   = parseFloat(o.ps_cum ?? o.ps_max ?? -99);
    const diam = parseFloat(o.diameter ?? 0.1);
    const r    = Math.min(10, Math.max(3, Math.log10(diam + 0.01) * 6 + 8));
    const color= ps > 0 ? '#ff4d2a' : ps > -2 ? '#ffb800' : ps > -3 ? '#7d8590' : 'rgba(125,133,144,0.3)';
    const cx   = (toX(rMin) + toX(rMax)) / 2;

    // Line for range
    if (Math.abs(rMax - rMin) > 1) {
      svgContent += `<line x1="${toX(rMin)}" y1="${y}" x2="${toX(rMax)}" y2="${y}" stroke="${color}" stroke-width="1" opacity="0.4"/>`;
    }
    svgContent += `
      <circle cx="${cx}" cy="${y}" r="${r}" fill="${color}" opacity="0.7">
        <title>${o.des} | Prob: ${o.ip} | Last Obs: ${o.last_obs}</title>
      </circle>
    `;
  }

  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = svgContent;
}

/* =========================================================
   TAB 4 — 3D GLOBE
   ========================================================= */
function initGlobe() {
  state.globeLoaded = true;
  const loading = document.getElementById('globe-loading');

  function loadScript(src, onload, onerror) {
    const s = document.createElement('script');
    s.src = src; s.onload = onload; s.onerror = onerror;
    document.head.appendChild(s);
  }
  const fail = () => {
    loading.innerHTML = `<div style="color:var(--danger);font-family:var(--font-data);font-size:0.75rem;text-align:center;">Failed to load 3D libraries.<br>Check your connection.</div>`;
  };
  // Load globe.gl only — no external Three.js (three@0.16x build/ files removed;
  // globe.gl@2 uses its own bundled Three.js internally)
  loadScript('https://unpkg.com/globe.gl@2/dist/globe.gl.min.js', () => setupGlobe(loading), fail);
}

function setupGlobe(loading) {
  const container = document.getElementById('globe-container');
  const neos = state.neoList.length > 0 ? state.neoList : [];

  // Deterministic lat/lng from asteroid id
  function idToLatLng(id) {
    let hash = 0;
    const s = String(id);
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    const lat = ((hash % 180) + 180) % 180 - 90;
    const lng = (((hash * 31) % 360) + 360) % 360 - 180;
    return { lat, lng };
  }

  const points = neos.map(neo => {
    const { lat, lng } = idToLatLng(neo.id);
    const diam = (neo.diamMin + neo.diamMax) / 2;
    const alt  = Math.max(0.15, Math.min(1.2, Math.log2(1 + neo.missDist) * 0.22));
    return {
      lat, lng, alt,
      name:      neo.name,
      color:     neo.hazardous ? '#ff4d2a' : '#00e59b',
      radius:    Math.max(0.3, Math.min(2.5, Math.log10(diam + 1) * 0.8)),
      hazardous: neo.hazardous,
      velocity:  neo.velocity,
      missDist:  neo.missDist,
      neo,
    };
  });

  // Moon point
  points.push({
    lat: 0, lng: 0, alt: 1.35,
    name: 'Moon — 1 LD',
    color: '#888888',
    radius: 1.5,
    isMoon: true,
    hazardous: false,
    velocity: 0,
    missDist: 1,
    neo: null,
  });

  const GlobeFn = window.Globe;
  if (!GlobeFn) {
    loading.innerHTML = `<div style="color:var(--danger);font-family:var(--font-data);font-size:0.75rem;">globe.gl failed to load.</div>`;
    return;
  }

  try {
    const globe = GlobeFn()(container)
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
      .backgroundColor('#05080f')
      .showAtmosphere(true)
      .atmosphereColor('#00d4ff')
      .atmosphereAltitude(0.12)
      .htmlElementsData(points)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude('alt')
      .htmlElement(d => {
        const size = d.isMoon ? 14 : Math.max(6, Math.min(12, Math.log10((d.neo ? (d.neo.diamMin + d.neo.diamMax) / 2 : 0.5) + 1) * 10 + 5));
        const el = document.createElement('div');
        el.style.cssText = [
          `width:${size}px`, `height:${size}px`,
          `border-radius:50%`,
          `background:${d.color}`,
          `box-shadow:0 0 ${size + 4}px ${d.color}, 0 0 ${size * 2}px ${d.color}44`,
          `border:1px solid ${d.color}cc`,
          `cursor:${d.isMoon ? 'default' : 'pointer'}`,
          `pointer-events:auto`,
          `transition:transform 0.15s`,
        ].join(';');
        el.title = d.isMoon ? d.name : `${d.name}\n${d.missDist.toFixed(3)} LD | ${d.velocity.toFixed(2)} km/s`;
        if (!d.isMoon) {
          el.addEventListener('click', () => showGlobeDetail(d));
          el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.8)'; });
          el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
        }
        return el;
      });

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.3;
    state.globeInstance = globe;

    renderGlobeSidebar(points.filter(p => !p.isMoon), globe);

    loading.style.display = 'none';
  } catch(e) {
    loading.innerHTML = `<div style="color:var(--danger);font-family:var(--font-data);font-size:0.75rem;">Globe initialization failed: ${e.message}</div>`;
  }
}

function renderGlobeSidebar(points, globe) {
  const list = document.getElementById('globe-ast-list');
  list.innerHTML = points.slice(0,40).map(p => `
    <div class="globe-ast-item" onclick="flyToAsteroid(${p.lat},${p.lng})">
      <div class="globe-ast-dot" style="background:${p.color};box-shadow:0 0 4px ${p.color};"></div>
      <div class="globe-ast-name">${p.name}</div>
    </div>
  `).join('');
}

window.flyToAsteroid = function(lat, lng) {
  if (state.globeInstance) {
    state.globeInstance.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
  }
};

function showGlobeDetail(d) {
  const panel   = document.getElementById('globe-detail-panel');
  const content = document.getElementById('globe-detail-content');
  panel.classList.add('open');
  content.innerHTML = `
    <div style="margin-top:20px;">
      <div style="font-family:var(--font-head);font-size:0.85rem;color:var(--text);margin-bottom:12px;">${d.name}</div>
      <div class="spotlight-badges" style="margin-bottom:12px;">
        ${d.hazardous ? '<span class="badge badge-danger">⚠ HAZARDOUS</span>' : '<span class="badge badge-safe">✓ SAFE</span>'}
      </div>
      ${[
        ['Miss Distance', d.missDist.toFixed(3) + ' LD'],
        ['Velocity', d.velocity.toFixed(2) + ' km/s'],
        ['Diameter (est.)', d.neo ? diameterLabel((d.neo.diamMin+d.neo.diamMax)/2) : '—'],
        ['H Magnitude', d.neo?.h ?? '—'],
        ['Sentry Object', d.neo?.sentry ? '⚡ Yes' : 'No'],
      ].map(([label,val]) => `
        <div style="margin-bottom:8px;">
          <div style="font-family:var(--font-data);font-size:0.5rem;color:var(--text2);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">${label}</div>
          <div style="font-family:var(--font-data);font-size:0.75rem;color:var(--text);">${val}</div>
        </div>
      `).join('')}
    </div>
  `;
}

document.getElementById('globe-detail-close')?.addEventListener('click', () => {
  document.getElementById('globe-detail-panel')?.classList.remove('open');
});

/* =========================================================
   GAME ENGINE — ORBIT DODGER
   ========================================================= */
const Game = (() => {
  let canvas, ctx;
  let W, H, cx, cy, earthR, orbitR;
  let raf = null;
  let running = false;

  // Game state
  let score, combo, totalShots, correctShots, earthHP;
  let shipAngle, shipAngularVel;
  let keys;
  let mouse;
  let lasers;
  let asteroids;
  let particles;
  let scorePopups;
  let waveNum, waveActive, wavePending;
  let nextSpawnIdx, spawnTimer, waveSpawnDelay, waveSpeedMult;
  let lastShotTime;
  let shakeIntensity;
  let gameOver;

  // Spawn timing per wave
  const WAVE_CONFIG = [
    null,                           // index 0 unused
    { min:1, max:2, delay:2.5, speed:0.65 }, // wave 1
    { min:1, max:3, delay:2.2, speed:0.65 }, // wave 2
    { min:2, max:4, delay:1.7, speed:0.8  }, // wave 3
    { min:2, max:5, delay:1.4, speed:0.8  }, // wave 4
    { min:3, max:7, delay:1.0, speed:0.95 }, // wave 5
    { min:4, max:8, delay:0.8, speed:1.0  }, // wave 6
    { min:6, max:12,delay:0.6, speed:1.15 }, // wave 7
  ];

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    W  = canvas.width;
    H  = canvas.height;
    cx = W / 2;
    cy = H / 2;
    earthR = Math.min(W, H) * 0.07;
    orbitR = Math.min(W, H) * 0.28;
  }

  function init() {
    canvas = document.getElementById('game-canvas');
    ctx    = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    score = 0; combo = 1; totalShots = 0; correctShots = 0; earthHP = 100;
    shipAngle = -Math.PI / 2; // top
    shipAngularVel = 0;
    keys  = {};
    mouse = { x: cx, y: cy - orbitR - 60 };
    lasers    = [];
    asteroids = [];
    particles = [];
    scorePopups = [];
    waveNum   = 0;
    waveActive = false;
    wavePending = false;
    lastShotTime = 0;
    shakeIntensity = 0;
    gameOver = false;

    // Flatten neoData into wave batches

    setupInputs();
    startWave(1);

    if (raf) cancelAnimationFrame(raf);
    running = true;
    loop();
  }

  function setupInputs() {
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('click',     onMouseClick);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click',     onMouseClick);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup',   onKeyUp);
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  function onMouseClick() {
    if (!running || gameOver) return;
    fireLaser();
  }

  function onKeyDown(e) {
    keys[e.key] = true;
    if (e.key === ' ') { e.preventDefault(); if (running && !gameOver) fireLaser(); }
  }
  function onKeyUp(e) { keys[e.key] = false; }

  function fireLaser() {
    const now = Date.now();
    if (now - lastShotTime < 120) return; // ~8 shots/sec
    lastShotTime = now;

    const sx = cx + orbitR * Math.cos(shipAngle);
    const sy = cy + orbitR * Math.sin(shipAngle);
    const dx = mouse.x - sx;
    const dy = mouse.y - sy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const speed = 18;
    lasers.push({
      x: sx, y: sy,
      vx: (dx/dist) * speed,
      vy: (dy/dist) * speed,
      life: 60,
    });
    totalShots++;
  }

  function startWave(n) {
    waveNum = n;
    waveActive = false;
    wavePending = true;

    const cfg     = WAVE_CONFIG[n] || WAVE_CONFIG[7];
    waveSpeedMult = cfg.speed;
    waveSpawnDelay = cfg.delay;

    // Assign NEOs for this wave from the day's data
    const dayIndex = n - 1;
    const feedData = state.neoFeedData;
    let dayNEOs = [];
    if (feedData) {
      const dates = Object.keys(feedData.near_earth_objects).sort();
      if (dates[dayIndex]) {
        dayNEOs = feedData.near_earth_objects[dates[dayIndex]] || [];
      }
    }

    const count = Math.min(
      Math.floor(cfg.min + Math.random() * (cfg.max - cfg.min + 1)),
      Math.max(3, dayNEOs.length)
    );

    // Build spawn queue
    const spawnQueue = [];
    for (let i = 0; i < count; i++) {
      const neo   = dayNEOs[i % Math.max(1, dayNEOs.length)];
      const isHaz = neo?.is_potentially_hazardous_asteroid ?? (Math.random() > 0.5);
      const diam  = neo?.estimated_diameter?.meters
        ? (neo.estimated_diameter.meters.estimated_diameter_min + neo.estimated_diameter.meters.estimated_diameter_max) / 2
        : 50;
      const vel   = parseFloat(neo?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second ?? 10);
      // Speed mapping: 2 km/s → 1.0 px/f, 30 km/s → 4.0 px/f
      const speed = 1.0 + ((Math.min(vel, 30) - 2) / 28) * 3.0;
      const speedMult = waveSpeedMult * (Math.random() < 0.08 ? 1.7 : 1.0);
      const size  = diam < 30 ? 'small' : diam < 200 ? 'medium' : 'large';
      const hitpoints = size === 'small' ? 1 : size === 'medium' ? 2 : 3;
      spawnQueue.push({ neo, isHaz, speed: speed * speedMult, size, hitpoints, name: neo?.name || 'Unknown' });
    }

    nextSpawnIdx = 0;
    spawnTimer = 0;

    // Show wave banner
    showWaveBanner(n, dayNEOs, count);
    setTimeout(() => {
      wavePending  = false;
      waveActive   = true;
      // Store for spawning in loop
      window._spawnQueue = spawnQueue;
    }, 3500);
  }

  function showWaveBanner(n, dayNEOs, count) {
    const banner = document.getElementById('wave-banner');
    const dates  = feedData => Object.keys(feedData?.near_earth_objects || {}).sort();
    let dateStr  = '';
    if (state.neoFeedData) {
      const d = dates(state.neoFeedData)[n-1];
      if (d) dateStr = fmtDate(d);
    }
    const haz = dayNEOs.filter(a => a.is_potentially_hazardous_asteroid).length;
    banner.innerHTML = `WAVE ${n}/7<span class="wave-sub">${dateStr ? dateStr : ''} · ${count} asteroids · ${haz} hazardous</span>`;
    banner.classList.add('visible');
    setTimeout(() => banner.classList.remove('visible'), 3000);
    document.getElementById('hud-wave').textContent = `${n}/7`;
  }

  function spawnAsteroid(data) {
    // Spawn from edge
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * W; y = -40; }
    else if (edge === 1) { x = W + 40; y = Math.random() * H; }
    else if (edge === 2) { x = Math.random() * W; y = H + 40; }
    else                { x = -40; y = Math.random() * H; }

    const dx = cx - x, dy = cy - y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const isSpeedSpike = data.speed > 2.5 * WAVE_CONFIG[Math.min(waveNum,7)].speed * 0.8;

    asteroids.push({
      x, y,
      vx: (dx/dist) * data.speed,
      vy: (dy/dist) * data.speed,
      isHaz:  data.isHaz,
      size:   data.size,
      hp:     data.hitpoints,
      maxHp:  data.hitpoints,
      name:   data.name,
      radius: data.size === 'small' ? 14 : data.size === 'medium' ? 22 : 32,
      rot:    Math.random() * Math.PI * 2,
      rotV:   (Math.random() - 0.5) * 0.04,
      speedSpike: isSpeedSpike,
      spikeWarned: false,
    });
  }

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    update();
    draw();
  }

  function update() {
    if (gameOver) return;

    // Ship rotation
    const turnAcc = 0.003;
    const friction = 0.88;
    if (keys['a'] || keys['A'] || keys['ArrowLeft'])  shipAngularVel -= turnAcc;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) shipAngularVel += turnAcc;
    shipAngularVel *= friction;
    shipAngle += shipAngularVel;

    // Spawn asteroids in wave
    if (waveActive && window._spawnQueue) {
      spawnTimer -= 1/60;
      if (spawnTimer <= 0 && nextSpawnIdx < window._spawnQueue.length) {
        spawnAsteroid(window._spawnQueue[nextSpawnIdx]);
        nextSpawnIdx++;
        spawnTimer = waveSpawnDelay * (0.8 + Math.random() * 0.4);
      }
      // Wave complete when all spawned and none remaining
      if (nextSpawnIdx >= window._spawnQueue.length && asteroids.length === 0 && !wavePending) {
        waveActive = false;
        if (waveNum < 7) {
          startWave(waveNum + 1);
        } else {
          endGame(true);
        }
      }
    }

    // Lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x += l.vx;
      l.y += l.vy;
      l.life--;
      if (l.life <= 0 || l.x < 0 || l.x > W || l.y < 0 || l.y > H) {
        lasers.splice(i, 1);
        continue;
      }
      // Check vs asteroids
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        const dx = l.x - a.x, dy = l.y - a.y;
        if (Math.sqrt(dx*dx + dy*dy) < a.radius) {
          lasers.splice(i, 1);
          a.hp--;
          // Flash
          a.flashTimer = 6;
          spawnHitParticles(a.x, a.y, a.isHaz ? '#ff4d2a' : '#00e59b', 5);

          if (a.hp <= 0) {
            handleAsteroidDestroyed(a, j);
          } else {
            // Hit a non-hazardous
            if (!a.isHaz) penalizeWrongShot(a);
          }
          break;
        }
      }
    }

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.rot += a.rotV;
      if (a.flashTimer > 0) a.flashTimer--;

      // Speed spike warning
      if (a.speedSpike && !a.spikeWarned) {
        a.spikeWarned = true;
        spawnScorePopup(a.x, a.y - 30, '⚡ 2x SPEED', '#ffb800');
      }

      // Hit Earth
      const dx = a.x - cx, dy = a.y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < earthR + a.radius * 0.6) {
        handleEarthHit(a, i);
      }
      // Near miss (just past Earth without hitting)
      if (dist < earthR * 2 && dist > earthR + a.radius * 0.6 && a.vx * dx + a.vy * dy < 0) {
        // moving away from earth
      }
      // Off screen (missed Earth entirely)
      if (a.x < -100 || a.x > W+100 || a.y < -100 || a.y > H+100) {
        // non-hazardous passing = good, hazardous passing = bad
        if (a.isHaz) {
          // counted as hitting earth if it passes
          handleEarthHit(a, i);
        } else {
          correctShots++; // Let non-haz pass
          asteroids.splice(i, 1);
        }
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.95; p.vy *= 0.95;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Score popups
    for (let i = scorePopups.length - 1; i >= 0; i--) {
      const s = scorePopups[i];
      s.y -= 1;
      s.life--;
      if (s.life <= 0) scorePopups.splice(i, 1);
    }

    // Shake decay
    shakeIntensity *= 0.88;

    // Update HUD
    document.getElementById('hud-score').textContent    = score.toLocaleString();
    document.getElementById('hud-combo').textContent    = `x${combo}`;
    const acc = totalShots > 0 ? Math.round((correctShots/totalShots)*100) : 100;
    document.getElementById('hud-accuracy').textContent = acc + '%';

    // HP bar
    const hpPct = Math.max(0, earthHP);
    const hpFill = document.getElementById('hp-bar-fill');
    hpFill.style.width = hpPct + '%';
    hpFill.style.background = hpPct > 50 ? 'var(--cyan)' : hpPct > 25 ? 'var(--amber)' : 'var(--danger)';
    document.getElementById('hp-val').textContent = Math.ceil(hpPct);

    // Vignette
    const vignette = document.getElementById('vignette');
    if (hpPct <= 25) vignette.className = 'critical';
    else if (hpPct <= 50) vignette.className = 'warning';
    else vignette.className = '';

  }

  function handleAsteroidDestroyed(a, idx) {
    const isHaz = a.isHaz;
    if (isHaz) {
      // Correct!
      const sizeMult = a.size === 'small' ? 1 : a.size === 'medium' ? 2 : 3;
      const outerBonus = isInOuterHalf(a) ? 50 : 0;
      const pts = (100 * sizeMult + outerBonus) * combo;
      score += pts;
      correctShots++;
      combo = Math.min(5, combo + 1);
      spawnExplosion(a.x, a.y, '#ff4d2a');
      spawnScorePopup(a.x, a.y - 30, `+${pts}`, '#ff4d2a');
      spawnScorePopup(a.x, a.y - 50, a.name, '#ffb800');
      showDataFlash(`${a.name} · ${a.size}  · ${a.isHaz ? 'HAZARDOUS' : ''}`, '#ff4d2a');
    } else {
      // Shot a non-hazardous
      penalizeWrongShot(a);
      spawnExplosion(a.x, a.y, '#00e59b');
    }
    asteroids.splice(idx, 1);
  }

  function penalizeWrongShot(a) {
    score = Math.max(0, score - 150);
    combo = 1;
    spawnScorePopup(a.x, a.y - 30, '-150', '#ffb800');
    showDataFlash(`FRIENDLY FIRE: ${a.name}`, '#ffb800');
  }

  function handleEarthHit(a, idx) {
    const dmg = a.size === 'small' ? 3 : a.size === 'medium' ? 10 : 20;
    earthHP   = Math.max(0, earthHP - dmg);
    combo     = 1;
    shakeIntensity = a.size === 'large' ? 14 : a.size === 'medium' ? 8 : 4;
    spawnExplosion(cx + (a.x - cx) * 0.5, cy + (a.y - cy) * 0.5, '#ff4d2a');
    spawnScorePopup(cx, cy - earthR - 20, `EARTH HIT! -${dmg} HP`, 'var(--danger)');
    asteroids.splice(idx, 1);
    if (earthHP <= 0) endGame(false);
  }

  function isInOuterHalf(a) {
    const dx = a.x - cx, dy = a.y - cy;
    const dist = Math.sqrt(dx*dx+dy*dy);
    return dist > Math.min(W,H) * 0.25;
  }

  function spawnExplosion(x, y, color) {
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      particles.push({ x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, color, life: 35, maxLife:35 });
    }
  }

  function spawnHitParticles(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      particles.push({ x, y, vx: Math.cos(angle)*2, vy: Math.sin(angle)*2, color, life:15, maxLife:15 });
    }
  }

  function spawnScorePopup(x, y, text, color) {
    scorePopups.push({ x, y, text, color, life: 80, maxLife:80 });
  }

  function showDataFlash(msg, color) {
    const el = document.getElementById('data-flash');
    el.textContent = msg;
    el.style.color = color || 'var(--cyan)';
    el.classList.add('visible');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('visible'), 2000);
  }

  /* ── Draw ── */
  function draw() {
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Camera shake
    if (shakeIntensity > 0.5) {
      ctx.translate(
        (Math.random()-0.5) * shakeIntensity,
        (Math.random()-0.5) * shakeIntensity
      );
    }

    drawEarth();
    drawOrbitRing();
    drawShip();
    drawLasers();
    drawAsteroids();
    drawParticles();
    drawScorePopups();
    drawReticle();

    ctx.restore();
  }

  function drawEarth() {
    // Glow
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, earthR * 1.8);
    grd.addColorStop(0, 'rgba(0,100,220,0.1)');
    grd.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(cx, cy, earthR * 1.8, 0, Math.PI*2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Earth circle
    const eg = ctx.createRadialGradient(cx-earthR*0.3, cy-earthR*0.3, 0, cx, cy, earthR);
    eg.addColorStop(0, '#2a6dc5');
    eg.addColorStop(0.5, '#1a4fa0');
    eg.addColorStop(1, '#0d2d5e');
    ctx.beginPath();
    ctx.arc(cx, cy, earthR, 0, Math.PI*2);
    ctx.fillStyle = eg;
    ctx.fill();

    // HP ring
    const hpFrac = earthHP / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, earthR + 4, -Math.PI/2, -Math.PI/2 + Math.PI*2*hpFrac);
    ctx.strokeStyle = hpFrac > 0.5 ? 'rgba(0,212,255,0.8)' : hpFrac > 0.25 ? 'rgba(255,184,0,0.8)' : 'rgba(255,77,42,0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function drawOrbitRing() {
    ctx.beginPath();
    ctx.arc(cx, cy, orbitR, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,212,255,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawShip() {
    const sx = cx + orbitR * Math.cos(shipAngle);
    const sy = cy + orbitR * Math.sin(shipAngle);
    const facing = Math.atan2(mouse.y - sy, mouse.x - sx);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(facing + Math.PI/2);

    // Thruster glow
    const tg = ctx.createRadialGradient(0, 14, 0, 0, 14, 12);
    tg.addColorStop(0, 'rgba(0,150,255,0.6)');
    tg.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(0, 14, 12, 0, Math.PI*2);
    ctx.fillStyle = tg;
    ctx.fill();

    // Ship triangle
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-8, 10);
    ctx.lineTo(8, 10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,212,255,0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,212,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  function drawLasers() {
    for (const l of lasers) {
      ctx.beginPath();
      ctx.moveTo(l.x - l.vx*2, l.y - l.vy*2);
      ctx.lineTo(l.x, l.y);
      ctx.strokeStyle = 'rgba(0,212,255,0.9)';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00d4ff';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);

      const color = a.isHaz ? '#ff4d2a' : '#00e59b';
      const glow  = a.isHaz ? 'rgba(255,77,42,0.4)' : 'rgba(0,229,155,0.4)';

      // Glow
      ctx.shadowBlur  = 16;
      ctx.shadowColor = glow;

      // Draw irregular rock shape
      const pts = 7;
      ctx.beginPath();
      for (let i = 0; i < pts; i++) {
        const ang  = (i / pts) * Math.PI * 2;
        const r    = a.radius * (0.75 + 0.25 * Math.sin(i * 3.7 + a.rot * 0.5));
        const x    = Math.cos(ang) * r;
        const y    = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      if (a.flashTimer > 0) {
        ctx.fillStyle = '#ffffff';
      } else {
        const fill = ctx.createRadialGradient(0, -a.radius*0.2, 0, 0, 0, a.radius);
        fill.addColorStop(0, color);
        fill.addColorStop(1, a.isHaz ? '#660000' : '#004432');
        ctx.fillStyle = fill;
      }
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.shadowBlur  = 0;

      // HP indicator (dots)
      for (let i = 0; i < a.maxHp; i++) {
        const dot = i < a.hp;
        ctx.beginPath();
        ctx.arc(-a.radius + (a.radius*2/(a.maxHp+1)) * (i+1), -a.radius - 6, 3, 0, Math.PI*2);
        ctx.fillStyle = dot ? color : 'rgba(255,255,255,0.2)';
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5 * alpha, 0, Math.PI*2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawScorePopups() {
    for (const s of scorePopups) {
      const alpha = Math.min(1, s.life / 30);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.font = `bold 13px IBM Plex Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(s.text, s.x, s.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  function drawReticle() {
    ctx.strokeStyle = 'rgba(0,212,255,0.5)';
    ctx.lineWidth = 1.5;

    const r = 14;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mouse.x - r - 6, mouse.y);
    ctx.lineTo(mouse.x - r + 3, mouse.y);
    ctx.moveTo(mouse.x + r - 3, mouse.y);
    ctx.lineTo(mouse.x + r + 6, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - r - 6);
    ctx.lineTo(mouse.x, mouse.y - r + 3);
    ctx.moveTo(mouse.x, mouse.y + r - 3);
    ctx.lineTo(mouse.x, mouse.y + r + 6);
    ctx.stroke();
  }

  function endGame(isVictory) {
    gameOver = true;
    running  = false;

    const title    = document.getElementById('go-title');
    const subtitle = document.getElementById('go-subtitle');
    const breakdown= document.getElementById('go-breakdown');
    const realData = document.getElementById('go-real-data');
    const goEl     = document.getElementById('game-over');

    title.textContent = isVictory ? 'EARTH DEFENDED' : 'MISSION FAILED';
    title.className   = 'game-over-title ' + (isVictory ? 'victory' : 'defeat');
    subtitle.textContent = isVictory
      ? 'All seven days of asteroid approaches neutralized!'
      : 'Earth sustained critical damage. Mission failure.';

    const acc = totalShots > 0 ? Math.round((correctShots/totalShots)*100) : 100;
    breakdown.innerHTML = `
      <div class="score-line"><span>Final Score</span><span class="sl-val">${score.toLocaleString()}</span></div>
      <div class="score-line"><span>Accuracy</span><span class="sl-val">${acc}%</span></div>
      <div class="score-line"><span>Best Combo</span><span class="sl-val">x${Math.max(combo,1)}</span></div>
      <div class="score-line"><span>Waves Cleared</span><span class="sl-val">${waveNum}/7</span></div>
      <div class="score-line"><span>Earth HP Remaining</span><span class="sl-val">${Math.ceil(earthHP)}%</span></div>
      <div class="score-line total"><span>TOTAL</span><span class="sl-val">${score.toLocaleString()} pts</span></div>
    `;

    // Real data summary
    const all = state.neoList;
    const haz = all.filter(a => a.hazardous);
    const closest = [...all].sort((a,b) => a.missDist - b.missDist)[0];
    realData.innerHTML = `This week, ${all.length} asteroids made close approaches to Earth. ${haz.length} were classified as potentially hazardous. The closest was <strong style="color:var(--cyan)">${closest?.name || 'unknown'}</strong> at <strong style="color:var(--cyan)">${closest?.missDist.toFixed(3) || '—'} LD</strong> — ${closest ? Math.round(closest.missDistKm/1000) + 'M km' : ''}. All data is real — provided by NASA JPL.`;

    goEl.classList.add('open');
  }

  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
  }

  return { init, stop };
})();

/* =========================================================
   GAME UI WIRING
   ========================================================= */
function initGameUI() {
  const overlay   = document.getElementById('game-overlay');
  const briefing  = document.getElementById('game-briefing');
  const canvasWrap= document.getElementById('game-canvas-wrap');
  const playBtn   = document.getElementById('play-game-btn');
  const launchBtn = document.getElementById('launch-btn');
  const exitBriefing = document.getElementById('exit-briefing-btn');
  const playAgain = document.getElementById('play-again-btn');
  const goDash    = document.getElementById('go-dashboard-btn');

  function openGame() {
    overlay.classList.add('open');
    briefing.classList.remove('hidden');
    canvasWrap.classList.remove('active');
    document.getElementById('game-over').classList.remove('open');
  }

  function closeGame() {
    overlay.classList.remove('open');
    Game.stop();
  }

  function startGame() {
    briefing.classList.add('hidden');
    canvasWrap.classList.add('active');
    document.getElementById('game-over').classList.remove('open');
    Game.init();
  }

  playBtn.addEventListener('click', openGame);
  launchBtn.addEventListener('click', startGame);
  exitBriefing.addEventListener('click', closeGame);
  playAgain.addEventListener('click', startGame);
  goDash.addEventListener('click', closeGame);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeGame();
    }
  });
}

/* =========================================================
   INIT
   ========================================================= */
async function main() {
  initStarfield();
  initTabs();
  initGameUI();
  initCADControls();
  initSentrySort();
  startCountdown();
  await loadThisWeek();

  // Try to init lucide icons if available
  if (window.lucide) window.lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', main);
