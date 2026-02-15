/* ==============================
   Decision Neuron Quest — Learn Mode
   Training sandbox with scatter plot
   + live network diagram
   ============================== */

const LearnMode = {
  canvas: null,
  ctx: null,
  netSvg: null,
  prevAccuracy: 0,
  state: {
    points: [],
    weights: [0, 0],
    bias: 0,
    learningRate: 0.1,
    step: 0,
    accuracy: 0,
    isTraining: false,
    speed: 50,
    currentLabel: 1,
    trainInterval: null,
  },

  // Preset datasets
  presets: {
    linear: [
      { x: 0.1, y: 0.8, label: 1 }, { x: 0.2, y: 0.9, label: 1 },
      { x: 0.15, y: 0.7, label: 1 }, { x: 0.3, y: 0.85, label: 1 },
      { x: 0.25, y: 0.75, label: 1 }, { x: 0.35, y: 0.65, label: 1 },
      { x: 0.1, y: 0.6, label: 1 }, { x: 0.4, y: 0.9, label: 1 },
      { x: 0.7, y: 0.2, label: 0 }, { x: 0.8, y: 0.3, label: 0 },
      { x: 0.9, y: 0.15, label: 0 }, { x: 0.75, y: 0.1, label: 0 },
      { x: 0.85, y: 0.25, label: 0 }, { x: 0.65, y: 0.35, label: 0 },
      { x: 0.9, y: 0.4, label: 0 }, { x: 0.6, y: 0.15, label: 0 },
    ],
    clustered: [
      { x: 0.2, y: 0.2, label: 1 }, { x: 0.25, y: 0.3, label: 1 },
      { x: 0.15, y: 0.25, label: 1 }, { x: 0.3, y: 0.2, label: 1 },
      { x: 0.22, y: 0.18, label: 1 }, { x: 0.28, y: 0.28, label: 1 },
      { x: 0.18, y: 0.35, label: 1 }, { x: 0.32, y: 0.15, label: 1 },
      { x: 0.7, y: 0.7, label: 0 }, { x: 0.75, y: 0.8, label: 0 },
      { x: 0.8, y: 0.75, label: 0 }, { x: 0.65, y: 0.72, label: 0 },
      { x: 0.72, y: 0.68, label: 0 }, { x: 0.78, y: 0.82, label: 0 },
      { x: 0.82, y: 0.7, label: 0 }, { x: 0.68, y: 0.78, label: 0 },
    ],
    noisy: [
      { x: 0.1, y: 0.8, label: 1 }, { x: 0.3, y: 0.7, label: 1 },
      { x: 0.2, y: 0.6, label: 1 }, { x: 0.4, y: 0.9, label: 1 },
      { x: 0.15, y: 0.5, label: 1 }, { x: 0.5, y: 0.8, label: 1 },
      { x: 0.6, y: 0.6, label: 0 },
      { x: 0.35, y: 0.4, label: 1 },
      { x: 0.7, y: 0.3, label: 0 }, { x: 0.8, y: 0.2, label: 0 },
      { x: 0.9, y: 0.1, label: 0 }, { x: 0.6, y: 0.4, label: 0 },
      { x: 0.75, y: 0.15, label: 0 }, { x: 0.85, y: 0.35, label: 0 },
      { x: 0.3, y: 0.3, label: 1 },
      { x: 0.65, y: 0.5, label: 0 },
    ],
  },

  init() {
    this.canvas = document.getElementById('learn-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.netSvg = document.getElementById('learn-network-svg');
    this.resetWeights();

    // Canvas click to add points
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = ((e.clientX - rect.left) * scaleX - 40) / (this.canvas.width - 80);
      const y = 1 - ((e.clientY - rect.top) * scaleY - 40) / (this.canvas.height - 80);

      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        this.state.points.push({
          x: Utils.clamp(x, 0, 1),
          y: Utils.clamp(y, 0, 1),
          label: this.state.currentLabel,
        });
        Audio.playPointPlace();
        this.renderAll();
      }
    });

    // Label toggle buttons
    document.getElementById('label-yes').addEventListener('click', () => {
      this.state.currentLabel = 1;
      document.getElementById('label-yes').classList.add('active');
      document.getElementById('label-no').classList.remove('active');
      Audio.playClick();
    });

    document.getElementById('label-no').addEventListener('click', () => {
      this.state.currentLabel = 0;
      document.getElementById('label-no').classList.add('active');
      document.getElementById('label-yes').classList.remove('active');
      Audio.playClick();
    });

    // Action buttons
    document.getElementById('step-btn').addEventListener('click', () => {
      Audio.playClick();
      this.trainStep();
    });
    document.getElementById('train-btn').addEventListener('click', () => {
      Audio.playClick();
      this.toggleAutoTrain();
    });
    document.getElementById('reset-btn').addEventListener('click', () => {
      Audio.playReset();
      this.reset();
    });

    // Speed slider
    document.getElementById('speed-slider').addEventListener('input', (e) => {
      this.state.speed = parseInt(e.target.value);
      if (this.state.isTraining) {
        this.stopAutoTrain();
        this.startAutoTrain();
      }
    });

    // Learning rate slider
    document.getElementById('lr-slider').addEventListener('input', (e) => {
      this.state.learningRate = parseInt(e.target.value) / 100;
      document.getElementById('lr-display').textContent = this.state.learningRate.toFixed(2);
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = this.presets[btn.dataset.preset];
        if (preset) {
          Audio.playNodeAppear();
          this.state.points = JSON.parse(JSON.stringify(preset));
          this.resetWeights();
          this.renderAll();
        }
      });
    });

    // Initial render
    this.renderAll();
  },

  resetWeights() {
    this.state.weights = [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ];
    this.state.bias = (Math.random() - 0.5) * 2;
    this.state.step = 0;
    this.state.accuracy = 0;
    this.prevAccuracy = 0;
  },

  reset() {
    this.stopAutoTrain();
    this.state.points = [];
    this.resetWeights();
    this.renderAll();
    document.getElementById('train-btn').textContent = 'Auto';
    document.getElementById('train-btn').classList.remove('danger');
    document.getElementById('train-btn').classList.add('primary');
  },

  trainStep() {
    if (this.state.points.length === 0) return;

    const lr = this.state.learningRate;

    for (const point of this.state.points) {
      const z = this.state.weights[0] * point.x + this.state.weights[1] * point.y + this.state.bias;
      const prediction = Utils.sigmoid(z);
      const error = point.label - prediction;
      const gradient = error * Utils.sigmoidDerivative(prediction);

      this.state.weights[0] += lr * gradient * point.x;
      this.state.weights[1] += lr * gradient * point.y;
      this.state.bias += lr * gradient;
    }

    this.state.step++;
    this.computeAccuracy();

    // Play tick on manual step, or every 10th auto step
    if (!this.state.isTraining) {
      Audio.playTrainTick();
    } else if (this.state.step % 10 === 0) {
      Audio.playTrainTick();
    }

    // Milestone sound when accuracy crosses thresholds
    if (this.prevAccuracy < 100 && this.state.accuracy >= 100) {
      Audio.playMilestone();
    } else if (this.prevAccuracy < 90 && this.state.accuracy >= 90) {
      Audio.playMilestone();
    }
    this.prevAccuracy = this.state.accuracy;

    this.renderAll();
  },

  computeAccuracy() {
    if (this.state.points.length === 0) {
      this.state.accuracy = 0;
      return;
    }
    let correct = 0;
    for (const point of this.state.points) {
      const z = this.state.weights[0] * point.x + this.state.weights[1] * point.y + this.state.bias;
      const prediction = Utils.sigmoid(z) >= 0.5 ? 1 : 0;
      if (prediction === point.label) correct++;
    }
    this.state.accuracy = (correct / this.state.points.length) * 100;
  },

  toggleAutoTrain() {
    if (this.state.isTraining) {
      this.stopAutoTrain();
      Audio.stopTrainHum();
      document.getElementById('train-btn').textContent = 'Auto';
      document.getElementById('train-btn').classList.remove('danger');
      document.getElementById('train-btn').classList.add('primary');
    } else {
      this.startAutoTrain();
      Audio.startTrainHum();
      document.getElementById('train-btn').textContent = 'Stop';
      document.getElementById('train-btn').classList.add('danger');
      document.getElementById('train-btn').classList.remove('primary');
    }
  },

  startAutoTrain() {
    this.state.isTraining = true;
    const interval = Math.max(10, 200 - this.state.speed * 2);
    this.state.trainInterval = setInterval(() => {
      this.trainStep();
    }, interval);
  },

  stopAutoTrain() {
    this.state.isTraining = false;
    if (this.state.trainInterval) {
      clearInterval(this.state.trainInterval);
      this.state.trainInterval = null;
    }
  },

  // Render everything
  renderAll() {
    this.renderScatterPlot();
    this.renderNetworkDiagram();
    this.renderSigmoidInset();
    this.updateStats();
    this.updateMath();
    this.updateOutputBadge();
  },

  updateStats() {
    document.getElementById('stat-w1').textContent = this.state.weights[0].toFixed(3);
    document.getElementById('stat-w2').textContent = this.state.weights[1].toFixed(3);
    document.getElementById('stat-bias').textContent = this.state.bias.toFixed(3);
    document.getElementById('stat-step').textContent = this.state.step;
    document.getElementById('stat-accuracy').textContent =
      this.state.points.length > 0 ? this.state.accuracy.toFixed(1) + '%' : '--';

    const accEl = document.getElementById('stat-accuracy');
    if (this.state.accuracy >= 90) {
      accEl.style.color = '#00f0ff';
    } else if (this.state.accuracy >= 70) {
      accEl.style.color = '#ffd700';
    } else {
      accEl.style.color = '#ff00aa';
    }
  },

  updateMath() {
    const el = document.getElementById('learn-math');
    if (!el) return;
    const w1 = this.state.weights[0];
    const w2 = this.state.weights[1];
    const b = this.state.bias;
    el.textContent = `z = ${w1.toFixed(2)}\u00B7x\u2081 + ${w2.toFixed(2)}\u00B7x\u2082 + (${b.toFixed(2)})`;
  },

  updateOutputBadge() {
    const textEl = document.getElementById('learn-output-text');
    const pctEl = document.getElementById('learn-output-pct');
    if (!textEl || this.state.points.length === 0) {
      if (textEl) textEl.textContent = '?';
      if (pctEl) pctEl.textContent = '';
      return;
    }
    // Use average point to show output
    const avgX = this.state.points.reduce((s, p) => s + p.x, 0) / this.state.points.length;
    const avgY = this.state.points.reduce((s, p) => s + p.y, 0) / this.state.points.length;
    const z = this.state.weights[0] * avgX + this.state.weights[1] * avgY + this.state.bias;
    const out = Utils.sigmoid(z);
    const isYes = out >= 0.5;
    textEl.textContent = isYes ? 'Yes' : 'No';
    textEl.style.color = isYes ? '#00f0ff' : '#ff00aa';
    pctEl.textContent = (out * 100).toFixed(0) + '%';
    pctEl.style.color = isYes ? '#00f0ff' : '#ff00aa';
  },

  // ========== NETWORK DIAGRAM ==========
  renderNetworkDiagram() {
    const svg = this.netSvg;
    if (!svg) return;

    const parent = svg.parentElement;
    const rect = parent.getBoundingClientRect();
    const W = rect.width - 10;
    const H = Math.max(rect.height - 80, 150);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';

    // Defs
    const defs = Utils.createSvgElement('defs');
    const filter = Utils.createSvgElement('filter', { id: 'learn-glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
    const blur = Utils.createSvgElement('feGaussianBlur', { stdDeviation: '4', result: 'coloredBlur' });
    const merge = Utils.createSvgElement('feMerge');
    merge.appendChild(Utils.createSvgElement('feMergeNode', { in: 'coloredBlur' }));
    merge.appendChild(Utils.createSvgElement('feMergeNode', { in: 'SourceGraphic' }));
    filter.appendChild(blur);
    filter.appendChild(merge);
    defs.appendChild(filter);
    svg.appendChild(defs);

    const w1 = this.state.weights[0];
    const w2 = this.state.weights[1];
    const bias = this.state.bias;

    // Positions
    const x1Pos = { x: W * 0.15, y: H * 0.28 };
    const x2Pos = { x: W * 0.15, y: H * 0.72 };
    const biasPos = { x: W * 0.42, y: H * 0.92 };
    const neuronPos = { x: W * 0.52, y: H * 0.5 };
    const outPos = { x: W * 0.85, y: H * 0.5 };

    // Compute output for color
    const avgX = this.state.points.length > 0
      ? this.state.points.reduce((s, p) => s + p.x, 0) / this.state.points.length : 0.5;
    const avgY = this.state.points.length > 0
      ? this.state.points.reduce((s, p) => s + p.y, 0) / this.state.points.length : 0.5;
    const z = w1 * avgX + w2 * avgY + bias;
    const output = Utils.sigmoid(z);
    const isYes = output >= 0.5;
    const outColor = isYes ? '#00f0ff' : '#ff00aa';

    // --- Edges ---
    const drawEdge = (from, to, weight, label) => {
      const absW = Math.abs(weight);
      const positive = weight >= 0;
      const color = positive ? '#00f0ff' : '#ff00aa';
      const thickness = 1.5 + absW * 4;

      const line = Utils.createSvgElement('line', {
        x1: from.x, y1: from.y, x2: to.x, y2: to.y,
        stroke: color,
        'stroke-width': thickness,
        'stroke-opacity': 0.3 + absW * 0.5,
      });
      svg.appendChild(line);

      // Weight label
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2 - 8;
      const bg = Utils.createSvgElement('rect', {
        x: mx - 22, y: my - 9, width: 44, height: 18, rx: 4,
        fill: 'rgba(10,10,26,0.85)', stroke: color, 'stroke-width': 0.5, 'stroke-opacity': 0.4,
      });
      svg.appendChild(bg);
      const text = Utils.createSvgElement('text', {
        x: mx, y: my + 4, 'text-anchor': 'middle',
        fill: color, 'font-family': "'JetBrains Mono', monospace", 'font-size': '10', 'font-weight': '600',
      });
      text.textContent = label + '=' + weight.toFixed(2);
      svg.appendChild(text);
    };

    drawEdge(x1Pos, neuronPos, w1, 'w\u2081');
    drawEdge(x2Pos, neuronPos, w2, 'w\u2082');

    // Bias edge (dashed)
    const biasLine = Utils.createSvgElement('line', {
      x1: biasPos.x, y1: biasPos.y, x2: neuronPos.x, y2: neuronPos.y + 22,
      stroke: '#ffd700', 'stroke-width': 1.5, 'stroke-opacity': 0.5, 'stroke-dasharray': '4 3',
    });
    svg.appendChild(biasLine);

    // --- Input nodes ---
    const drawInputNode = (pos, label, sublabel) => {
      const glow = Utils.createSvgElement('circle', {
        cx: pos.x, cy: pos.y, r: 24,
        fill: 'none', stroke: '#00f0ff', 'stroke-width': 1, 'stroke-opacity': 0.25,
        filter: 'url(#learn-glow)',
      });
      svg.appendChild(glow);

      const circle = Utils.createSvgElement('circle', {
        cx: pos.x, cy: pos.y, r: 18,
        fill: 'rgba(0,240,255,0.08)', stroke: '#00f0ff', 'stroke-width': 2,
      });
      svg.appendChild(circle);

      const text = Utils.createSvgElement('text', {
        x: pos.x, y: pos.y + 5, 'text-anchor': 'middle',
        fill: 'white', 'font-family': "'JetBrains Mono', monospace", 'font-size': '13', 'font-weight': '700',
      });
      text.textContent = label;
      svg.appendChild(text);

      if (sublabel) {
        const sub = Utils.createSvgElement('text', {
          x: pos.x, y: pos.y - 26, 'text-anchor': 'middle',
          fill: 'rgba(255,255,255,0.4)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '9',
        });
        sub.textContent = sublabel;
        svg.appendChild(sub);
      }
    };

    drawInputNode(x1Pos, 'X\u2081', 'input');
    drawInputNode(x2Pos, 'X\u2082', 'input');

    // Bias node
    const biasCircle = Utils.createSvgElement('circle', {
      cx: biasPos.x, cy: biasPos.y, r: 14,
      fill: 'rgba(255,215,0,0.08)', stroke: '#ffd700', 'stroke-width': 1.5,
    });
    svg.appendChild(biasCircle);
    const biasText = Utils.createSvgElement('text', {
      x: biasPos.x, y: biasPos.y + 4, 'text-anchor': 'middle',
      fill: '#ffd700', 'font-family': "'JetBrains Mono', monospace", 'font-size': '9', 'font-weight': '600',
    });
    biasText.textContent = 'b=' + bias.toFixed(1);
    svg.appendChild(biasText);

    // --- Central neuron ---
    const neuronGlow = Utils.createSvgElement('circle', {
      cx: neuronPos.x, cy: neuronPos.y, r: 34,
      fill: 'none', stroke: outColor, 'stroke-width': 2, 'stroke-opacity': 0.25,
      filter: 'url(#learn-glow)',
    });
    svg.appendChild(neuronGlow);

    const neuronRing = Utils.createSvgElement('circle', {
      cx: neuronPos.x, cy: neuronPos.y, r: 28,
      fill: 'none', stroke: outColor, 'stroke-width': 1, 'stroke-opacity': 0.3,
      'stroke-dasharray': '3 3',
    });
    svg.appendChild(neuronRing);

    const neuronCircle = Utils.createSvgElement('circle', {
      cx: neuronPos.x, cy: neuronPos.y, r: 22,
      fill: `rgba(${isYes ? '0,240,255' : '255,0,170'}, ${0.1 + output * 0.15})`,
      stroke: outColor, 'stroke-width': 2.5,
    });
    svg.appendChild(neuronCircle);

    const sigma = Utils.createSvgElement('text', {
      x: neuronPos.x, y: neuronPos.y + 6, 'text-anchor': 'middle',
      fill: 'white', 'font-family': "'JetBrains Mono', monospace", 'font-size': '16', 'font-weight': '700',
    });
    sigma.textContent = '\u03C3';
    svg.appendChild(sigma);

    // z value below neuron
    const zLabel = Utils.createSvgElement('text', {
      x: neuronPos.x, y: neuronPos.y + 40, 'text-anchor': 'middle',
      fill: 'rgba(255,255,255,0.4)', 'font-family': "'JetBrains Mono', monospace", 'font-size': '9',
    });
    zLabel.textContent = 'z=' + z.toFixed(2);
    svg.appendChild(zLabel);

    // --- Output arrow ---
    const arrowLine = Utils.createSvgElement('line', {
      x1: neuronPos.x + 25, y1: neuronPos.y,
      x2: outPos.x - 20, y2: outPos.y,
      stroke: outColor, 'stroke-width': 2.5, 'stroke-opacity': 0.5,
    });
    svg.appendChild(arrowLine);

    const arrow = Utils.createSvgElement('polygon', {
      points: `${outPos.x - 20},${outPos.y - 5} ${outPos.x - 10},${outPos.y} ${outPos.x - 20},${outPos.y + 5}`,
      fill: outColor, opacity: 0.6,
    });
    svg.appendChild(arrow);

    // --- Output node ---
    const outCircle = Utils.createSvgElement('circle', {
      cx: outPos.x, cy: outPos.y, r: 20,
      fill: `rgba(${isYes ? '0,240,255' : '255,0,170'}, 0.12)`,
      stroke: outColor, 'stroke-width': 2, filter: 'url(#learn-glow)',
    });
    svg.appendChild(outCircle);

    const outText = Utils.createSvgElement('text', {
      x: outPos.x, y: outPos.y + 5, 'text-anchor': 'middle',
      fill: 'white', 'font-family': "'JetBrains Mono', monospace", 'font-size': '12', 'font-weight': '700',
    });
    outText.textContent = (output * 100).toFixed(0) + '%';
    svg.appendChild(outText);

    const outLabel = Utils.createSvgElement('text', {
      x: outPos.x, y: outPos.y + 34, 'text-anchor': 'middle',
      fill: outColor, 'font-family': "'Space Grotesk', sans-serif", 'font-size': '10', 'font-weight': '600',
    });
    outLabel.textContent = isYes ? 'Yes' : 'No';
    svg.appendChild(outLabel);

    // Animated energy dots along the weight edges
    const animDot = (from, to, color) => {
      const dot = Utils.createSvgElement('circle', { r: 2.5, fill: color, opacity: 0.7 });
      const anim = Utils.createSvgElement('animateMotion', {
        dur: (1.2 + Math.random() * 0.6) + 's', repeatCount: 'indefinite',
        path: `M${from.x},${from.y} L${to.x},${to.y}`,
      });
      dot.appendChild(anim);
      svg.appendChild(dot);
    };

    if (this.state.isTraining || this.state.step > 0) {
      animDot(x1Pos, neuronPos, w1 >= 0 ? '#00f0ff' : '#ff00aa');
      animDot(x2Pos, neuronPos, w2 >= 0 ? '#00f0ff' : '#ff00aa');
    }
  },

  // ========== SIGMOID INSET ==========
  renderSigmoidInset() {
    const canvas = document.getElementById('learn-sigmoid-inset');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const pad = 12;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10,10,26,0.85)';
    ctx.fillRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(pad, H / 2);
    ctx.lineTo(W - pad, H / 2);
    ctx.moveTo(W / 2, pad);
    ctx.lineTo(W / 2, H - pad);
    ctx.stroke();

    // Curve
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0,240,255,0.5)';
    ctx.lineWidth = 1.5;
    for (let px = pad; px <= W - pad; px++) {
      const zVal = Utils.mapRange(px, pad, W - pad, -6, 6);
      const val = Utils.sigmoid(zVal);
      const py = Utils.mapRange(val, 0, 1, H - pad, pad);
      if (px === pad) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current z point
    const avgX = this.state.points.length > 0
      ? this.state.points.reduce((s, p) => s + p.x, 0) / this.state.points.length : 0.5;
    const avgY = this.state.points.length > 0
      ? this.state.points.reduce((s, p) => s + p.y, 0) / this.state.points.length : 0.5;
    const z = this.state.weights[0] * avgX + this.state.weights[1] * avgY + this.state.bias;
    const out = Utils.sigmoid(z);

    const pxZ = Utils.mapRange(Utils.clamp(z, -6, 6), -6, 6, pad, W - pad);
    const pyOut = Utils.mapRange(out, 0, 1, H - pad, pad);

    ctx.beginPath();
    ctx.arc(pxZ, pyOut, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('\u03C3(z)', W / 2, 9);
  },

  // ========== SCATTER PLOT ==========
  renderScatterPlot() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const padding = 40;
    const plotW = W - 2 * padding;
    const plotH = H - 2 * padding;

    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    bgGrad.addColorStop(0, 'rgba(15, 15, 40, 1)');
    bgGrad.addColorStop(1, 'rgba(10, 10, 26, 1)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decision region shading
    const resolution = 80;
    const cellW = plotW / resolution;
    const cellH = plotH / resolution;

    for (let gx = 0; gx < resolution; gx++) {
      for (let gy = 0; gy < resolution; gy++) {
        const xVal = gx / (resolution - 1);
        const yVal = 1 - gy / (resolution - 1);
        const z = this.state.weights[0] * xVal + this.state.weights[1] * yVal + this.state.bias;
        const output = Utils.sigmoid(z);

        if (output > 0.5) {
          ctx.fillStyle = `rgba(0, 240, 255, ${0.03 + (output - 0.5) * 0.08})`;
        } else {
          ctx.fillStyle = `rgba(255, 0, 170, ${0.03 + (0.5 - output) * 0.08})`;
        }
        ctx.fillRect(padding + gx * cellW, padding + gy * cellH, cellW + 1, cellH + 1);
      }
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotW;
      const y = padding + (i / 10) * plotH;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + plotW, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + plotH);
    ctx.lineTo(padding + plotW, padding + plotH);
    ctx.stroke();

    // Axis tick labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    for (let i = 0; i <= 4; i++) {
      const val = (i / 4).toFixed(1);
      ctx.fillText(val, padding + (i / 4) * plotW, padding + plotH + 15);
      ctx.textAlign = 'right';
      ctx.fillText((1 - i / 4).toFixed(1), padding - 8, padding + (i / 4) * plotH + 4);
      ctx.textAlign = 'center';
    }

    // Decision boundary line
    const w1 = this.state.weights[0];
    const w2 = this.state.weights[1];
    const b = this.state.bias;

    if (Math.abs(w2) > 0.001) {
      const y0 = -(w1 * 0 + b) / w2;
      const y1 = -(w1 * 1 + b) / w2;
      const px0 = padding;
      const py0 = padding + (1 - y0) * plotH;
      const px1 = padding + plotW;
      const py1 = padding + (1 - y1) * plotH;

      ctx.save();
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px0, py0);
      ctx.lineTo(px1, py1);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px0, py0);
      ctx.lineTo(px1, py1);
      ctx.stroke();
    } else if (Math.abs(w1) > 0.001) {
      const xBound = -b / w1;
      const px = padding + xBound * plotW;
      ctx.save();
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px, padding);
      ctx.lineTo(px, padding + plotH);
      ctx.stroke();
      ctx.restore();
    }

    // Draw points
    for (const point of this.state.points) {
      const px = padding + point.x * plotW;
      const py = padding + (1 - point.y) * plotH;
      const isYes = point.label === 1;
      const color = isYes ? '#00f0ff' : '#ff00aa';

      // Outer glow
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = isYes ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 0, 170, 0.2)';
      ctx.fill();

      // Point
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Equation display
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = 'left';
    ctx.fillText(
      `${w1.toFixed(2)}x\u2081 + ${w2.toFixed(2)}x\u2082 + ${b.toFixed(2)} = 0`,
      padding + 5,
      padding + 15
    );

    // Point count and help text
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = 'right';
    ctx.fillText(`${this.state.points.length} points`, W - padding - 5, padding + 15);

    if (this.state.points.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = "14px 'Space Grotesk', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('Click to place data points', W / 2, H / 2 - 10);
      ctx.font = "11px 'Space Grotesk', sans-serif";
      ctx.fillText('Toggle label with buttons, then train', W / 2, H / 2 + 10);
    }
  },
};
