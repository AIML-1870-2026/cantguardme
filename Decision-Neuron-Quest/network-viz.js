/* ==============================
   Decision Neuron Quest — Network Visualization
   Factor nodes → one massive pulsating decision orb
   ============================== */

const NetworkViz = {
  svg: null,
  container: null,
  previousInputIds: [],
  energyPulses: [],
  particleStreams: [],
  animationFrame: null,
  sliderContainer: null,

  init() {
    this.svg = document.getElementById('network-svg');
    this.container = document.getElementById('network-container');
    this.pulseCanvas = document.getElementById('pulse-canvas');
    this.pulseCtx = this.pulseCanvas.getContext('2d');
    this.resizePulseCanvas();
    window.addEventListener('resize', () => this.resizePulseCanvas());
    this.sliderContainer = document.getElementById('factor-sliders');
    this.startPulseLoop();
  },

  resizePulseCanvas() {
    this.pulseCanvas.width = window.innerWidth;
    this.pulseCanvas.height = window.innerHeight;
  },

  startPulseLoop() {
    const animate = () => {
      this.pulseCtx.clearRect(0, 0, this.pulseCanvas.width, this.pulseCanvas.height);

      // Draw particle streams (curved bezier from factor nodes → central orb)
      this.particleStreams = this.particleStreams.filter(stream => {
        stream.particles = stream.particles.filter(p => {
          p.progress += p.speed;
          if (p.progress >= 1) return false;

          const t = p.progress;
          const cx = (stream.x1 + stream.x2) / 2 + stream.curveOffset;
          const cy = (stream.y1 + stream.y2) / 2 + stream.curveOffsetY;
          const x = (1 - t) * (1 - t) * stream.x1 + 2 * (1 - t) * t * cx + t * t * stream.x2;
          const y = (1 - t) * (1 - t) * stream.y1 + 2 * (1 - t) * t * cy + t * t * stream.y2;

          const alpha = Math.sin(t * Math.PI) * p.alpha;
          const size = p.size * (1 - t * 0.5);

          // Glowing particle
          const grad = this.pulseCtx.createRadialGradient(x, y, 0, x, y, size * 3);
          grad.addColorStop(0, `rgba(${stream.color}, ${alpha})`);
          grad.addColorStop(0.5, `rgba(${stream.color}, ${alpha * 0.3})`);
          grad.addColorStop(1, `rgba(${stream.color}, 0)`);
          this.pulseCtx.beginPath();
          this.pulseCtx.arc(x, y, size * 3, 0, Math.PI * 2);
          this.pulseCtx.fillStyle = grad;
          this.pulseCtx.fill();

          // Bright core
          this.pulseCtx.beginPath();
          this.pulseCtx.arc(x, y, size * 0.5, 0, Math.PI * 2);
          this.pulseCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
          this.pulseCtx.fill();

          return true;
        });

        // Spawn new particles
        if (stream.active && Math.random() < stream.spawnRate) {
          stream.particles.push({
            progress: 0,
            speed: 0.006 + Math.random() * 0.01,
            size: 2 + Math.random() * 3,
            alpha: 0.3 + Math.random() * 0.5,
          });
        }

        return stream.active || stream.particles.length > 0;
      });

      // Draw burst energy pulses
      this.energyPulses = this.energyPulses.filter(p => {
        p.progress += p.speed;
        if (p.progress >= 1) return false;

        const t = p.progress;
        const x = Utils.lerp(p.x1, p.x2, t);
        const y = Utils.lerp(p.y1, p.y2, t);
        const alpha = Math.sin(t * Math.PI);

        for (let i = 0; i < 3; i++) {
          const tt = Math.max(0, t - i * 0.03);
          const tx = Utils.lerp(p.x1, p.x2, tt);
          const ty = Utils.lerp(p.y1, p.y2, tt);
          const ta = alpha * (1 - i * 0.3);
          this.pulseCtx.beginPath();
          this.pulseCtx.arc(tx, ty, 5 - i, 0, Math.PI * 2);
          this.pulseCtx.fillStyle = `rgba(${p.color || '0, 240, 255'}, ${ta * 0.6})`;
          this.pulseCtx.shadowColor = `rgba(${p.color || '0, 240, 255'}, 0.8)`;
          this.pulseCtx.shadowBlur = 15;
          this.pulseCtx.fill();
        }
        this.pulseCtx.shadowBlur = 0;
        return true;
      });

      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  },

  updateParticleStreams(inputPositions, centerPos, inputs, svgRect) {
    this.particleStreams.forEach(s => s.active = false);

    inputs.forEach((inp, i) => {
      const pos = inputPositions[i];
      const absWeight = Math.abs(inp.weight);
      const value = inp.value || 0.5;
      const isPositive = inp.weight >= 0;
      const color = isPositive ? '0, 240, 255' : '255, 0, 170';

      this.particleStreams.push({
        x1: svgRect.left + pos.x,
        y1: svgRect.top + pos.y,
        x2: svgRect.left + centerPos.x,
        y2: svgRect.top + centerPos.y,
        curveOffset: (Math.random() - 0.5) * 50,
        curveOffsetY: (Math.random() - 0.5) * 40,
        color,
        spawnRate: 0.08 + absWeight * value * 0.35,
        active: true,
        particles: [],
      });
    });
  },

  fireNodeBurst(x, y, color) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const dist = 50 + Math.random() * 40;
      this.energyPulses.push({
        x1: x, y1: y,
        x2: x + Math.cos(angle) * dist,
        y2: y + Math.sin(angle) * dist,
        progress: 0,
        speed: 0.03 + Math.random() * 0.025,
        color,
      });
    }
  },

  fireEdgeConnect(x1, y1, x2, y2, color) {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.energyPulses.push({ x1, y1, x2, y2, progress: 0, speed: 0.02 + Math.random() * 0.015, color });
      }, i * 80);
    }
  },

  renderSliders(network) {
    if (!this.sliderContainer) return;
    const inputs = network.inputs;
    if (!inputs || inputs.length === 0) {
      this.sliderContainer.style.display = 'none';
      return;
    }
    this.sliderContainer.style.display = '';

    const existingSliders = this.sliderContainer.querySelectorAll('.factor-slider-row');
    const needsRebuild = existingSliders.length !== inputs.length ||
      Array.from(existingSliders).some((el, i) => el.dataset.name !== inputs[i].name);

    if (needsRebuild) {
      this.sliderContainer.innerHTML = '';

      inputs.forEach((inp, i) => {
        const row = document.createElement('div');
        row.className = 'factor-slider-row';
        row.dataset.name = inp.name;

        const isPositive = inp.weight >= 0;
        const color = isPositive ? 'var(--cyan)' : 'var(--magenta)';

        row.innerHTML = `
          <div class="factor-slider-label">
            <span class="factor-name" style="color: ${color}">${inp.name}</span>
            <span class="factor-value" id="factor-val-${i}">${(inp.value * 100).toFixed(0)}%</span>
          </div>
          <div class="factor-slider-track">
            <input type="range" class="factor-slider" data-index="${i}" min="0" max="100" value="${Math.round(inp.value * 100)}"
                   style="--slider-color: ${color}">
            <div class="factor-slider-fill" id="factor-fill-${i}" style="width: ${inp.value * 100}%; background: ${color}"></div>
          </div>
          <div class="factor-weight-badge" style="border-color: ${color}40; color: ${color}">
            w: ${inp.weight.toFixed(2)}
          </div>
        `;
        this.sliderContainer.appendChild(row);

        const slider = row.querySelector('.factor-slider');
        slider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value) / 100;
          network.inputs[i].value = parseFloat(val.toFixed(2));
          document.getElementById(`factor-val-${i}`).textContent = `${Math.round(val * 100)}%`;
          document.getElementById(`factor-fill-${i}`).style.width = `${val * 100}%`;
          Audio.playSliderTick();
          window.NeuronApp.emit('networkUpdate', network);
        });
      });
    } else {
      inputs.forEach((inp, i) => {
        const slider = this.sliderContainer.querySelector(`[data-index="${i}"]`);
        if (slider && !slider.matches(':active')) {
          slider.value = Math.round(inp.value * 100);
        }
        const valEl = document.getElementById(`factor-val-${i}`);
        if (valEl) valEl.textContent = `${Math.round(inp.value * 100)}%`;
        const fillEl = document.getElementById(`factor-fill-${i}`);
        if (fillEl) fillEl.style.width = `${inp.value * 100}%`;
      });
    }
  },

  render(network) {
    if (!this.svg || !network.inputs || network.inputs.length === 0) {
      this.clear();
      return;
    }

    const placeholder = document.getElementById('network-placeholder');
    if (placeholder) placeholder.classList.add('hidden');

    // Update title
    const titleEl = document.getElementById('network-title');
    titleEl.classList.add('visible');
    document.getElementById('network-emoji').textContent = network.emoji || '';
    document.getElementById('network-title-text').textContent = network.title || '';

    const rect = this.container.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.svg.innerHTML = '';

    // --- Defs ---
    const defs = Utils.createSvgElement('defs');

    // Glow filters
    const addGlowFilter = (id, stdDev) => {
      const f = Utils.createSvgElement('filter', { id, x: '-100%', y: '-100%', width: '300%', height: '300%' });
      f.appendChild(Utils.createSvgElement('feGaussianBlur', { stdDeviation: String(stdDev), result: 'b' }));
      const m = Utils.createSvgElement('feMerge');
      m.appendChild(Utils.createSvgElement('feMergeNode', { in: 'b' }));
      m.appendChild(Utils.createSvgElement('feMergeNode', { in: 'SourceGraphic' }));
      f.appendChild(m);
      defs.appendChild(f);
    };
    addGlowFilter('glow', 4);
    addGlowFilter('glow-strong', 10);
    addGlowFilter('glow-mega', 25);

    this.svg.appendChild(defs);

    const inputs = network.inputs;
    const numInputs = inputs.length;
    const { z, output } = Utils.forwardPass(network);

    // --- Layout: input nodes on left arc, massive orb in center-right ---
    const centerX = W * 0.52;
    const centerY = H * 0.48;
    const inputArcCenterX = W * 0.15;
    const padding = 50;

    const inputPositions = inputs.map((_, i) => {
      const t = numInputs === 1 ? 0.5 : i / (numInputs - 1);
      return {
        x: inputArcCenterX + Math.cos((t - 0.5) * 0.6) * 30,
        y: padding + t * (H - 2 * padding),
      };
    });

    // Check for new inputs
    const currentIds = inputs.map(inp => inp.name);
    const newInputs = currentIds.filter(id => !this.previousInputIds.includes(id));
    this.previousInputIds = [...currentIds];

    const isYes = output > 0.5;
    const centralColor = isYes ? '#00f0ff' : '#ff00aa';
    const centralRGB = isYes ? '0, 240, 255' : '255, 0, 170';

    // --- Draw edges ---
    inputs.forEach((inp, i) => {
      const pos = inputPositions[i];
      const absWeight = Math.abs(inp.weight);
      const isPositive = inp.weight >= 0;
      const color = isPositive ? '#00f0ff' : '#ff00aa';
      const thickness = 1.5 + absWeight * 5;
      const value = inp.value || 0.5;

      // Glow under edge
      this.svg.appendChild(Utils.createSvgElement('line', {
        x1: pos.x, y1: pos.y, x2: centerX, y2: centerY,
        stroke: color, 'stroke-width': thickness + 6, 'stroke-opacity': 0.06 + value * absWeight * 0.1,
        filter: 'url(#glow)',
      }));

      // Main edge
      this.svg.appendChild(Utils.createSvgElement('line', {
        x1: pos.x, y1: pos.y, x2: centerX, y2: centerY,
        stroke: color, 'stroke-width': thickness, 'stroke-opacity': 0.25 + absWeight * value * 0.45,
        class: newInputs.includes(inp.name) ? 'edge-line edge-appear' : 'edge-line',
      }));

      // Animated dash flow
      this.svg.appendChild(Utils.createSvgElement('line', {
        x1: pos.x, y1: pos.y, x2: centerX, y2: centerY,
        stroke: color, 'stroke-width': Math.max(1, thickness * 0.3),
        'stroke-opacity': 0.5 + value * 0.4, 'stroke-dasharray': '4 14',
        class: 'edge-flow-dash',
      }));

      // Weight badge at midpoint
      const midX = pos.x * 0.55 + centerX * 0.45;
      const midY = pos.y * 0.55 + centerY * 0.45;
      this.svg.appendChild(Utils.createSvgElement('rect', {
        x: midX - 18, y: midY - 9, width: 36, height: 18, rx: 6,
        fill: 'rgba(10, 10, 26, 0.85)', stroke: color, 'stroke-width': 0.6, 'stroke-opacity': 0.35,
      }));
      const wLabel = Utils.createSvgElement('text', {
        x: midX, y: midY + 4, 'text-anchor': 'middle', fill: color,
        'font-family': "'JetBrains Mono', monospace", 'font-size': '9', 'font-weight': '600',
      });
      wLabel.textContent = inp.weight.toFixed(2);
      this.svg.appendChild(wLabel);

      // Effects for new nodes
      if (newInputs.includes(inp.name)) {
        const svgRect = this.svg.getBoundingClientRect();
        const rgb = isPositive ? '0, 240, 255' : '255, 0, 170';
        setTimeout(() => {
          this.fireNodeBurst(svgRect.left + pos.x, svgRect.top + pos.y, rgb);
          Audio.playNodeAppear();
          setTimeout(() => {
            this.fireEdgeConnect(svgRect.left + pos.x, svgRect.top + pos.y, svgRect.left + centerX, svgRect.top + centerY, rgb);
            Audio.playEdgeConnect();
          }, 200);
        }, 100);
      }
    });

    // --- Draw input nodes ---
    inputs.forEach((inp, i) => {
      const pos = inputPositions[i];
      const isNew = newInputs.includes(inp.name);
      const value = inp.value || 0.5;
      const isPositive = inp.weight >= 0;
      const nodeColor = isPositive ? '#00f0ff' : '#ff00aa';
      const nodeRGB = isPositive ? '0, 240, 255' : '255, 0, 170';

      // Pulsating outer ring
      this.svg.appendChild(Utils.createSvgElement('circle', {
        cx: pos.x, cy: pos.y, r: 28,
        fill: 'none', stroke: nodeColor, 'stroke-width': 1.5,
        'stroke-opacity': 0.12 + value * 0.2, filter: 'url(#glow-strong)',
        class: 'orb-pulse', style: `animation-delay: ${i * 0.3}s`,
      }));

      // Spinning dashed ring
      this.svg.appendChild(Utils.createSvgElement('circle', {
        cx: pos.x, cy: pos.y, r: 24,
        fill: 'none', stroke: nodeColor, 'stroke-width': 0.8, 'stroke-opacity': 0.2,
        'stroke-dasharray': '3 5',
        class: 'orb-spin', style: `animation-delay: ${i * 0.2}s; animation-direction: ${i % 2 === 0 ? 'normal' : 'reverse'}`,
      }));

      // Node gradient
      const gradId = `node-grad-${i}`;
      const grad = Utils.createSvgElement('radialGradient', { id: gradId, cx: '40%', cy: '40%', r: '60%' });
      grad.appendChild(Utils.createSvgElement('stop', { offset: '0%', 'stop-color': 'white', 'stop-opacity': '0.25' }));
      grad.appendChild(Utils.createSvgElement('stop', { offset: '50%', 'stop-color': nodeColor, 'stop-opacity': `${0.12 + value * 0.18}` }));
      grad.appendChild(Utils.createSvgElement('stop', { offset: '100%', 'stop-color': nodeColor, 'stop-opacity': '0.03' }));
      defs.appendChild(grad);

      const nodeGroup = Utils.createSvgElement('g', {
        class: isNew ? 'node-appear' : '',
        style: `transform-origin: ${pos.x}px ${pos.y}px`,
      });

      nodeGroup.appendChild(Utils.createSvgElement('circle', {
        cx: pos.x, cy: pos.y, r: 20,
        fill: `url(#${gradId})`, stroke: nodeColor, 'stroke-width': 1.8,
      }));

      // Inner core
      nodeGroup.appendChild(Utils.createSvgElement('circle', {
        cx: pos.x, cy: pos.y, r: 5 + value * 4,
        fill: nodeColor, opacity: 0.12 + value * 0.2, filter: 'url(#glow)',
        class: 'orb-core-pulse', style: `animation-delay: ${i * 0.15}s`,
      }));

      // Value text
      const valText = Utils.createSvgElement('text', {
        x: pos.x, y: pos.y + 4, 'text-anchor': 'middle', fill: 'white',
        'font-family': "'JetBrains Mono', monospace", 'font-size': '10', 'font-weight': '600',
      });
      valText.textContent = (value * 100).toFixed(0) + '%';
      nodeGroup.appendChild(valText);

      this.svg.appendChild(nodeGroup);

      // Name label
      const label = Utils.createSvgElement('text', {
        x: pos.x - 30, y: pos.y + 4, 'text-anchor': 'end', fill: 'rgba(255,255,255,0.75)',
        'font-family': "'Space Grotesk', sans-serif", 'font-size': '11',
      });
      label.textContent = inp.name;
      this.svg.appendChild(label);
    });

    // --- MASSIVE CENTRAL DECISION ORB ---
    const orbBaseR = Math.min(W, H) * 0.18;
    const orbR = Math.max(orbBaseR, 55);
    const pulseIntensity = output; // 0-1, drives pulsation speed/size

    // Mega outer glow — breathes with confidence
    this.svg.appendChild(Utils.createSvgElement('circle', {
      cx: centerX, cy: centerY, r: orbR + 30,
      fill: `rgba(${centralRGB}, 0.02)`, stroke: centralColor,
      'stroke-width': 2, 'stroke-opacity': 0.1 + pulseIntensity * 0.15,
      filter: 'url(#glow-mega)', class: 'central-mega-pulse',
      style: `animation-duration: ${3.5 - pulseIntensity * 1.5}s`,
    }));

    // Outer spinning dashed ring
    this.svg.appendChild(Utils.createSvgElement('circle', {
      cx: centerX, cy: centerY, r: orbR + 18,
      fill: 'none', stroke: centralColor, 'stroke-width': 1.5, 'stroke-opacity': 0.2,
      'stroke-dasharray': '8 10 3 10', class: 'central-ring-spin',
    }));

    // Counter-spinning inner ring
    this.svg.appendChild(Utils.createSvgElement('circle', {
      cx: centerX, cy: centerY, r: orbR + 8,
      fill: 'none', stroke: centralColor, 'stroke-width': 1, 'stroke-opacity': 0.15,
      'stroke-dasharray': '5 7', class: 'central-ring-spin-reverse',
    }));

    // Main orb body with gradient
    const cGradId = 'central-grad';
    const cGrad = Utils.createSvgElement('radialGradient', { id: cGradId, cx: '38%', cy: '38%', r: '62%' });
    cGrad.appendChild(Utils.createSvgElement('stop', { offset: '0%', 'stop-color': 'white', 'stop-opacity': '0.25' }));
    cGrad.appendChild(Utils.createSvgElement('stop', { offset: '35%', 'stop-color': centralColor, 'stop-opacity': `${0.15 + output * 0.25}` }));
    cGrad.appendChild(Utils.createSvgElement('stop', { offset: '100%', 'stop-color': centralColor, 'stop-opacity': '0.04' }));
    defs.appendChild(cGrad);

    this.svg.appendChild(Utils.createSvgElement('circle', {
      cx: centerX, cy: centerY, r: orbR,
      fill: `url(#${cGradId})`, stroke: centralColor, 'stroke-width': 2.5,
      class: 'central-orb-pulse',
      style: `animation-duration: ${2.5 - pulseIntensity * 1}s`,
    }));

    // Inner bright core — scales with confidence
    const coreR = orbR * 0.3 + orbR * 0.35 * pulseIntensity;
    this.svg.appendChild(Utils.createSvgElement('circle', {
      cx: centerX, cy: centerY, r: coreR,
      fill: centralColor, opacity: 0.15 + output * 0.3,
      filter: 'url(#glow-strong)', class: 'central-core-pulse',
      style: `animation-duration: ${2 - pulseIntensity * 0.8}s`,
    }));

    // --- Percentage text ---
    const pctText = Utils.createSvgElement('text', {
      x: centerX, y: centerY - 6, 'text-anchor': 'middle', fill: 'white',
      'font-family': "'JetBrains Mono', monospace",
      'font-size': Math.max(28, orbR * 0.4), 'font-weight': '700',
      opacity: '0.95',
    });
    pctText.textContent = (output * 100).toFixed(0) + '%';
    this.svg.appendChild(pctText);

    // Verdict label
    const verdict = isYes ? network.yesLabel : network.noLabel;
    const verdictText = Utils.createSvgElement('text', {
      x: centerX, y: centerY + orbR * 0.28, 'text-anchor': 'middle',
      fill: centralColor, 'font-family': "'Space Grotesk', sans-serif",
      'font-size': Math.max(13, orbR * 0.17), 'font-weight': '600',
      opacity: '0.85',
    });
    verdictText.textContent = verdict;
    this.svg.appendChild(verdictText);

    // "confidence" sub-label
    const confLabel = Utils.createSvgElement('text', {
      x: centerX, y: centerY + orbR * 0.28 + 16, 'text-anchor': 'middle',
      fill: 'rgba(255,255,255,0.35)', 'font-family': "'JetBrains Mono', monospace",
      'font-size': '10',
    });
    confLabel.textContent = 'confidence';
    this.svg.appendChild(confLabel);

    // --- Update particle streams ---
    const svgRect = this.svg.getBoundingClientRect();
    this.updateParticleStreams(inputPositions, { x: centerX, y: centerY }, inputs, svgRect);

    // --- Render sliders ---
    this.renderSliders(network);
  },

  clear() {
    if (this.svg) this.svg.innerHTML = '';
    const placeholder = document.getElementById('network-placeholder');
    if (placeholder) placeholder.classList.remove('hidden');
    const titleEl = document.getElementById('network-title');
    titleEl.classList.remove('visible');
    if (this.sliderContainer) this.sliderContainer.style.display = 'none';
    this.particleStreams.forEach(s => s.active = false);
  },

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  },
};
