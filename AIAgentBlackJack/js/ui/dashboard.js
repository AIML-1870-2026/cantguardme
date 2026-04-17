/* ═══════════════════════════════════════════════════════════
   UI/DASHBOARD.JS — Analytics drawer, bankroll chart
═══════════════════════════════════════════════════════════ */

BJApp.DashboardUI = {
  open: false,

  init() {
    const tab = document.getElementById('dashboard-tab');
    if (tab) tab.addEventListener('click', () => this.toggle());

    const topBtn = document.getElementById('btn-dashboard-toggle');
    if (topBtn) topBtn.addEventListener('click', () => this.toggle());

    const exportBtn = document.getElementById('btn-export-log');
    if (exportBtn) exportBtn.addEventListener('click', () => BJApp.exportHistory());
  },

  toggle() {
    const drawer = document.getElementById('dashboard-drawer');
    if (!drawer) return;
    this.open = !this.open;
    drawer.classList.toggle('open', this.open);
    if (this.open) {
      BJApp.Audio.play('settings');
      this.update();
    }
  },

  update() {
    if (!this.open) return;
    this._updateStats();
    this._drawChart();
  },

  _updateStats() {
    const s = BJApp.stats;
    const totalHands = s.wins + s.losses + s.pushes + s.surrenders;

    const winRate = totalHands > 0
      ? `${((s.wins / totalHands) * 100).toFixed(1)}%`
      : '—';

    const roi = s.totalWagered > 0
      ? `${((s.netProfit / s.totalWagered) * 100).toFixed(1)}%`
      : '—';

    const quality = s.totalDecisions > 0
      ? `${((s.stratAgree / s.totalDecisions) * 100).toFixed(0)}%`
      : '—';

    const avgConf = s.confCount > 0
      ? `${((s.confSum / s.confCount) * 100).toFixed(0)}%`
      : '—';

    const costStr = `$${s.tokenCost.toFixed(4)}`;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('stat-winrate',    winRate);
    set('stat-roi',        roi);
    set('stat-quality',    quality);
    set('stat-confidence', avgConf);
    set('stat-hands',      totalHands);
    set('stat-cost',       costStr);
  },

  _drawChart() {
    const canvas = document.getElementById('bankroll-chart');
    if (!canvas) return;

    const history = BJApp.stats.bankrollHistory;
    if (history.length < 2) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 600;
    const H = canvas.height;
    canvas.width = W;

    ctx.clearRect(0, 0, W, H);

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = Math.max(max - min, 100);

    const toX = (i) => (i / (history.length - 1)) * (W - 20) + 10;
    const toY = (v) => H - 10 - ((v - min) / range) * (H - 20);

    // Grid lines
    ctx.strokeStyle = 'rgba(201,169,97,0.1)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const y = 10 + (g / 4) * (H - 20);
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(W - 10, y);
      ctx.stroke();
    }

    // Starting balance line
    const startY = toY(1000);
    ctx.strokeStyle = 'rgba(201,169,97,0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, startY);
    ctx.lineTo(W - 10, startY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(201,169,97,0.3)');
    grad.addColorStop(1, 'rgba(201,169,97,0.0)');

    ctx.beginPath();
    ctx.moveTo(toX(0), toY(history[0]));
    for (let i = 1; i < history.length; i++) {
      const x0 = toX(i - 1), y0 = toY(history[i - 1]);
      const x1 = toX(i),     y1 = toY(history[i]);
      const cpx = (x0 + x1) / 2;
      ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
    }
    ctx.lineTo(toX(history.length - 1), H);
    ctx.lineTo(toX(0), H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(history[0]));
    for (let i = 1; i < history.length; i++) {
      const x0 = toX(i - 1), y0 = toY(history[i - 1]);
      const x1 = toX(i),     y1 = toY(history[i]);
      const cpx = (x0 + x1) / 2;
      ctx.bezierCurveTo(cpx, y0, cpx, y1, x1, y1);
    }

    const last = history[history.length - 1];
    ctx.strokeStyle = last >= history[0] ? '#c9a961' : '#8c1c1c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Current value dot
    const lx = toX(history.length - 1);
    const ly = toY(last);
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = last >= history[0] ? '#e6c87a' : '#cc3333';
    ctx.fill();
  }
};
