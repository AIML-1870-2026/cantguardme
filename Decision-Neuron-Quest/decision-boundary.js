/* ==============================
   Decision Neuron Quest — Decision Boundary, Activation & Sensitivity
   Canvas-based sub-panel rendering
   ============================== */

const SubPanels = {
  currentPanel: 'boundary',
  axisX: 0,
  axisY: 1,

  init() {
    // Panel tab switching
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panelName = tab.dataset.panel;
        document.getElementById(panelName + '-panel').classList.add('active');
        this.currentPanel = panelName;
        this.renderCurrentPanel();
      });
    });

    // Activation function toggles
    document.querySelectorAll('.act-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.act-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.NeuronApp) {
          window.NeuronApp.state.network.activationFunction = btn.dataset.fn;
          window.NeuronApp.emit('networkUpdate', window.NeuronApp.state.network);
        }
      });
    });

    // Two-neuron toggle
    const twoNeuronToggle = document.getElementById('twoneuron-toggle');
    if (twoNeuronToggle) {
      twoNeuronToggle.addEventListener('change', () => {
        if (window.NeuronApp) {
          window.NeuronApp.state.network.twoNeuron = twoNeuronToggle.checked;
          window.NeuronApp.emit('networkUpdate', window.NeuronApp.state.network);
        }
      });
    }
  },

  updateAxisSelectors(inputs) {
    const container = document.getElementById('boundary-axis-selectors');
    if (!container || inputs.length < 2) return;

    container.innerHTML = '';

    const xLabel = document.createElement('span');
    xLabel.textContent = 'X:';
    xLabel.style.cssText = 'color: rgba(255,255,255,0.4); font-size: 10px;';
    container.appendChild(xLabel);

    const xSelect = document.createElement('select');
    const ySelect = document.createElement('select');

    inputs.forEach((inp, i) => {
      const optX = document.createElement('option');
      optX.value = i;
      optX.textContent = inp.name;
      optX.selected = i === this.axisX;
      xSelect.appendChild(optX);

      const optY = document.createElement('option');
      optY.value = i;
      optY.textContent = inp.name;
      optY.selected = i === this.axisY;
      ySelect.appendChild(optY);
    });

    xSelect.addEventListener('change', () => {
      this.axisX = parseInt(xSelect.value);
      this.renderBoundary();
    });
    ySelect.addEventListener('change', () => {
      this.axisY = parseInt(ySelect.value);
      this.renderBoundary();
    });

    container.appendChild(xSelect);
    const yLabel = document.createElement('span');
    yLabel.textContent = 'Y:';
    yLabel.style.cssText = 'color: rgba(255,255,255,0.4); font-size: 10px; margin-left: 4px;';
    container.appendChild(yLabel);
    container.appendChild(ySelect);
  },

  renderCurrentPanel() {
    const network = window.NeuronApp ? window.NeuronApp.state.network : null;
    if (!network || !network.inputs || network.inputs.length === 0) return;

    switch (this.currentPanel) {
      case 'boundary': this.renderBoundary(); break;
      case 'activation': this.renderActivation(); break;
      case 'sensitivity': this.renderSensitivity(); break;
      case 'twoneuron': this.renderTwoNeuron(); break;
    }
  },

  // ===== Decision Boundary Heatmap =====
  renderBoundary() {
    const canvas = document.getElementById('boundary-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const network = window.NeuronApp?.state?.network;
    if (!network || network.inputs.length < 2) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = "12px 'Space Grotesk', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('Need at least 2 inputs', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Resize canvas to fit container
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const size = Math.min(rect.width - 24, rect.height - 40, 300);
    canvas.width = size;
    canvas.height = size;

    const W = canvas.width;
    const H = canvas.height;
    const padding = 30;
    const plotW = W - 2 * padding;
    const plotH = H - 2 * padding;

    ctx.clearRect(0, 0, W, H);

    const xi = this.axisX;
    const yi = this.axisY;

    // Ensure valid indices
    if (xi >= network.inputs.length) this.axisX = 0;
    if (yi >= network.inputs.length) this.axisY = Math.min(1, network.inputs.length - 1);

    // Render heatmap pixel by pixel
    const resolution = 60;
    const cellW = plotW / resolution;
    const cellH = plotH / resolution;

    const goldContourPoints = [];

    for (let gx = 0; gx < resolution; gx++) {
      for (let gy = 0; gy < resolution; gy++) {
        const xVal = gx / (resolution - 1);
        const yVal = 1 - gy / (resolution - 1);

        // Clone inputs, override x and y
        const tempInputs = network.inputs.map((inp, idx) => ({
          ...inp,
          value: idx === xi ? xVal : idx === yi ? yVal : (inp.value || 0.5),
        }));

        const z = Utils.computeZ(tempInputs, network.bias.value);
        const output = Utils.activate(z, network.activationFunction);

        ctx.fillStyle = Utils.heatmapColor(output);
        ctx.fillRect(padding + gx * cellW, padding + gy * cellH, cellW + 1, cellH + 1);

        // Track contour at 0.5
        if (Math.abs(output - 0.5) < 0.03) {
          goldContourPoints.push({
            x: padding + gx * cellW + cellW / 2,
            y: padding + gy * cellH + cellH / 2,
          });
        }
      }
    }

    // Draw gold contour
    if (goldContourPoints.length > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 6;
      for (const p of goldContourPoints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    // Draw crosshair for current values
    const curX = padding + (network.inputs[xi]?.value || 0.5) * plotW;
    const curY = padding + (1 - (network.inputs[yi]?.value || 0.5)) * plotH;

    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(curX, padding);
    ctx.lineTo(curX, padding + plotH);
    ctx.moveTo(padding, curY);
    ctx.lineTo(padding + plotW, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(curX, curY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText(network.inputs[xi]?.name || 'X', W / 2, H - 5);
    ctx.save();
    ctx.translate(10, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(network.inputs[yi]?.name || 'Y', 0, 0);
    ctx.restore();

    // Corner labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.textAlign = 'left';
    ctx.fillText('0', padding, H - padding + 12);
    ctx.textAlign = 'right';
    ctx.fillText('1', W - padding, H - padding + 12);
    ctx.textAlign = 'left';
    ctx.fillText('1', padding - 15, padding + 4);
    ctx.fillText('0', padding - 15, H - padding + 4);
  },

  // ===== Activation Function Panel =====
  renderActivation() {
    const canvas = document.getElementById('activation-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const network = window.NeuronApp?.state?.network;
    if (!network) return;

    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width - 24;
    canvas.height = Math.min(rect.height - 60, 160);

    const W = canvas.width;
    const H = canvas.height;
    const padding = 20;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(10, 10, 26, 0.5)';
    ctx.fillRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, H - padding);
    ctx.lineTo(W - padding, H - padding);
    ctx.moveTo(W / 2, padding);
    ctx.lineTo(W / 2, H - padding);
    ctx.stroke();

    const functions = [
      { name: 'sigmoid', color: '#00f0ff', fn: Utils.sigmoid },
      { name: 'step', color: '#ff00aa', fn: Utils.step },
      { name: 'relu', color: '#ffd700', fn: (z) => Math.min(Math.max(0, z), 5) / 5 },
    ];

    const currentFn = network.activationFunction;
    const z = Utils.forwardPass(network).z;

    // Draw all curves (dim the non-active ones)
    for (const func of functions) {
      const isActive = func.name === currentFn;
      ctx.beginPath();
      ctx.strokeStyle = func.color;
      ctx.lineWidth = isActive ? 2.5 : 1;
      ctx.globalAlpha = isActive ? 1 : 0.25;

      for (let px = padding; px <= W - padding; px++) {
        const zVal = Utils.mapRange(px, padding, W - padding, -6, 6);
        const val = func.fn(zVal);
        const py = Utils.mapRange(val, 0, 1, H - padding, padding);
        if (px === padding) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Current z marker
    const activeFunc = functions.find(f => f.name === currentFn);
    if (activeFunc) {
      const pxZ = Utils.mapRange(Utils.clamp(z, -6, 6), -6, 6, padding, W - padding);
      const pyOut = Utils.mapRange(activeFunc.fn(z), 0, 1, H - padding, padding);

      ctx.beginPath();
      ctx.arc(pxZ, pyOut, 5, 0, Math.PI * 2);
      ctx.fillStyle = activeFunc.color;
      ctx.shadowColor = activeFunc.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = "9px 'JetBrains Mono', monospace";
    ctx.textAlign = 'left';
    for (let i = 0; i < functions.length; i++) {
      ctx.fillStyle = functions[i].color;
      ctx.globalAlpha = functions[i].name === currentFn ? 1 : 0.4;
      ctx.fillText(functions[i].name, W - padding - 50, padding + 10 + i * 12);
    }
    ctx.globalAlpha = 1;

    // Math display
    const mathEl = document.getElementById('activation-math');
    if (mathEl) {
      const output = Utils.activate(z, currentFn);
      mathEl.textContent = `z = ${z.toFixed(3)} → ${currentFn}(z) = ${output.toFixed(4)}`;
    }
  },

  // ===== Sensitivity Analysis =====
  renderSensitivity() {
    const canvas = document.getElementById('sensitivity-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const network = window.NeuronApp?.state?.network;
    if (!network || network.inputs.length === 0) return;

    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width - 24;
    canvas.height = Math.min(rect.height - 80, 120);

    const W = canvas.width;
    const H = canvas.height;
    const padding = 20;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10, 10, 26, 0.5)';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(padding, H / 2);
    ctx.lineTo(W - padding, H / 2);
    ctx.stroke();

    // For each input, sweep its value from 0 to 1 and plot output
    const colors = ['#00f0ff', '#ff00aa', '#ffd700', '#00ff88', '#ff6600'];
    const inputs = network.inputs;

    for (let i = 0; i < inputs.length; i++) {
      const color = colors[i % colors.length];
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      for (let px = padding; px <= W - padding; px++) {
        const sweepVal = Utils.mapRange(px, padding, W - padding, 0, 1);

        // Clone inputs, override this one
        const tempInputs = inputs.map((inp, idx) => ({
          ...inp,
          value: idx === i ? sweepVal : (inp.value || 0.5),
        }));

        const z = Utils.computeZ(tempInputs, network.bias.value);
        const output = Utils.activate(z, network.activationFunction);
        const py = Utils.mapRange(output, 0, 1, H - padding, padding);

        if (px === padding) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Vertical marker for current value
      const curPx = Utils.mapRange(inputs[i].value || 0.5, 0, 1, padding, W - padding);
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(curPx, padding);
      ctx.lineTo(curPx, H - padding);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Legend
    ctx.font = "8px 'JetBrains Mono', monospace";
    for (let i = 0; i < Math.min(inputs.length, 5); i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.textAlign = 'left';
      ctx.fillText(inputs[i].name, padding + i * 55, H - 4);
    }

    // Influence bars
    this.renderInfluenceBars(network);
  },

  renderInfluenceBars(network) {
    const container = document.getElementById('influence-bars');
    if (!container) return;
    container.innerHTML = '';

    const inputs = network.inputs;
    const maxWeight = Math.max(...inputs.map(i => Math.abs(i.weight)), 0.1);

    for (const inp of inputs) {
      const bar = document.createElement('div');
      bar.className = 'influence-bar';
      const heightPct = (Math.abs(inp.weight) / maxWeight) * 100;
      const isPositive = inp.weight >= 0;
      bar.style.height = heightPct + '%';
      bar.style.background = isPositive ? 'rgba(0, 240, 255, 0.6)' : 'rgba(255, 0, 170, 0.6)';
      bar.style.boxShadow = `0 0 6px ${isPositive ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 0, 170, 0.3)'}`;

      const label = document.createElement('div');
      label.className = 'influence-bar-label';
      label.textContent = inp.name.substring(0, 6);
      bar.appendChild(label);

      container.appendChild(bar);
    }
  },

  // ===== Two-Neuron Chain =====
  renderTwoNeuron() {
    const svg = document.getElementById('twoneuron-svg');
    const mathEl = document.getElementById('twoneuron-math');
    if (!svg) return;

    const network = window.NeuronApp?.state?.network;
    if (!network || network.inputs.length === 0) {
      svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="12">Enable two-neuron mode and add inputs first</text>';
      return;
    }

    svg.innerHTML = '';
    const rect = svg.parentElement.getBoundingClientRect();
    const W = rect.width - 24;
    const H = 160;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    if (!network.twoNeuron) {
      const text = Utils.createSvgElement('text', {
        x: W / 2,
        y: H / 2,
        'text-anchor': 'middle',
        fill: 'rgba(255, 255, 255, 0.3)',
        'font-size': '12',
        'font-family': "'Space Grotesk', sans-serif",
      });
      text.textContent = 'Toggle the switch above to enable';
      svg.appendChild(text);
      if (mathEl) mathEl.textContent = '';
      return;
    }

    // Initialize neuron2 if not present
    if (!network.neuron2) {
      network.neuron2 = {
        inputs: [],
        bias: { value: 0, label: 'Neutral' },
        chainWeight: 0.5,
      };
    }

    const { z1, a1, z2, output } = Utils.twoNeuronForward(network);

    // Neuron 1
    const n1x = W * 0.25;
    const n1y = H / 2;
    const n2x = W * 0.75;
    const n2y = H / 2;

    // Neuron 1 circle
    const n1Circle = Utils.createSvgElement('circle', {
      cx: n1x, cy: n1y, r: 24,
      fill: `rgba(0, 240, 255, ${0.1 + a1 * 0.2})`,
      stroke: '#00f0ff',
      'stroke-width': 2,
    });
    svg.appendChild(n1Circle);

    const n1Label = Utils.createSvgElement('text', {
      x: n1x, y: n1y + 5, 'text-anchor': 'middle',
      fill: 'white', 'font-family': "'JetBrains Mono', monospace",
      'font-size': '14', 'font-weight': '700',
    });
    n1Label.textContent = 'N\u2081';
    svg.appendChild(n1Label);

    const n1Output = Utils.createSvgElement('text', {
      x: n1x, y: n1y + 42, 'text-anchor': 'middle',
      fill: 'rgba(255,255,255,0.5)', 'font-family': "'JetBrains Mono', monospace",
      'font-size': '9',
    });
    n1Output.textContent = `a\u2081 = ${a1.toFixed(3)}`;
    svg.appendChild(n1Output);

    // Chain connection
    const chainColor = network.neuron2.chainWeight >= 0 ? '#00f0ff' : '#ff00aa';
    const chainWidth = 1 + Math.abs(network.neuron2.chainWeight) * 4;
    const chainLine = Utils.createSvgElement('line', {
      x1: n1x + 26, y1: n1y,
      x2: n2x - 26, y2: n2y,
      stroke: chainColor,
      'stroke-width': chainWidth,
      'stroke-opacity': 0.5,
    });
    svg.appendChild(chainLine);

    // Chain weight label
    const chainMidX = (n1x + n2x) / 2;
    const cwLabel = Utils.createSvgElement('text', {
      x: chainMidX, y: n1y - 8, 'text-anchor': 'middle',
      fill: chainColor, 'font-family': "'JetBrains Mono', monospace",
      'font-size': '10',
    });
    cwLabel.textContent = `w = ${network.neuron2.chainWeight.toFixed(2)}`;
    svg.appendChild(cwLabel);

    // Animated pulse dots on chain
    const pulseDot = Utils.createSvgElement('circle', {
      r: 3, fill: chainColor, opacity: 0.8,
    });
    const animMotion = Utils.createSvgElement('animateMotion', {
      dur: '1.5s', repeatCount: 'indefinite',
      path: `M${n1x + 26},${n1y} L${n2x - 26},${n2y}`,
    });
    pulseDot.appendChild(animMotion);
    svg.appendChild(pulseDot);

    // Neuron 2 circle
    const n2Color = output > 0.5 ? '#00f0ff' : '#ff00aa';
    const n2Circle = Utils.createSvgElement('circle', {
      cx: n2x, cy: n2y, r: 24,
      fill: `rgba(${output > 0.5 ? '0, 240, 255' : '255, 0, 170'}, ${0.1 + output * 0.2})`,
      stroke: n2Color,
      'stroke-width': 2,
    });
    svg.appendChild(n2Circle);

    const n2Label = Utils.createSvgElement('text', {
      x: n2x, y: n2y + 5, 'text-anchor': 'middle',
      fill: 'white', 'font-family': "'JetBrains Mono', monospace",
      'font-size': '14', 'font-weight': '700',
    });
    n2Label.textContent = 'N\u2082';
    svg.appendChild(n2Label);

    const n2Output = Utils.createSvgElement('text', {
      x: n2x, y: n2y + 42, 'text-anchor': 'middle',
      fill: 'rgba(255,255,255,0.5)', 'font-family': "'JetBrains Mono', monospace",
      'font-size': '9',
    });
    n2Output.textContent = `out = ${output.toFixed(3)}`;
    svg.appendChild(n2Output);

    // Math display
    if (mathEl) {
      mathEl.textContent = `z\u2081=${z1.toFixed(2)} \u2192 a\u2081=${a1.toFixed(3)} \u2192 z\u2082=${z2.toFixed(2)} \u2192 out=${output.toFixed(3)}`;
    }
  },
};
