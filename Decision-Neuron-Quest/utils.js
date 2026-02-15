/* ==============================
   Decision Neuron Quest — Utils
   Math helpers & shared utilities
   ============================== */

const Utils = {
  // Activation functions
  sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  },

  step(z) {
    return z >= 0 ? 1 : 0;
  },

  relu(z) {
    return Math.max(0, z);
  },

  // Derivatives
  sigmoidDerivative(output) {
    return output * (1 - output);
  },

  // Get activation function by name
  activate(z, fn) {
    switch (fn) {
      case 'sigmoid': return Utils.sigmoid(z);
      case 'step': return Utils.step(z);
      case 'relu': return Utils.relu(Math.min(z, 5)) / 5; // normalized for display
      default: return Utils.sigmoid(z);
    }
  },

  // Compute z = sum(w_i * x_i) + bias
  computeZ(inputs, bias) {
    let z = bias;
    for (const inp of inputs) {
      z += inp.weight * inp.value;
    }
    return z;
  },

  // Full forward pass
  forwardPass(network) {
    const z = Utils.computeZ(network.inputs, network.bias.value);
    const output = Utils.activate(z, network.activationFunction);
    return { z, output };
  },

  // Two-neuron chain forward pass
  twoNeuronForward(network) {
    const z1 = Utils.computeZ(network.inputs, network.bias.value);
    const a1 = Utils.activate(z1, network.activationFunction);

    const n2 = network.neuron2 || { inputs: [], bias: { value: 0 }, chainWeight: 0.5 };
    let z2 = n2.bias.value + a1 * n2.chainWeight;
    for (const inp of (n2.inputs || [])) {
      z2 += inp.weight * inp.value;
    }
    const output = Utils.activate(z2, network.activationFunction);
    return { z1, a1, z2, output };
  },

  // Linear interpolation
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Clamp value
  clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  },

  // Map value from one range to another
  mapRange(val, inMin, inMax, outMin, outMax) {
    return outMin + ((val - inMin) / (inMax - inMin)) * (outMax - outMin);
  },

  // Color utilities
  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  },

  rgbString(r, g, b, a = 1) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
  },

  // Interpolate between two colors
  lerpColor(color1, color2, t) {
    return {
      r: Utils.lerp(color1.r, color2.r, t),
      g: Utils.lerp(color1.g, color2.g, t),
      b: Utils.lerp(color1.b, color2.b, t),
    };
  },

  // Sci-fi color palette
  colors: {
    cyan: { r: 0, g: 240, b: 255 },
    magenta: { r: 255, g: 0, b: 170 },
    gold: { r: 255, g: 215, b: 0 },
    white: { r: 255, g: 255, b: 255 },
    dark: { r: 10, g: 10, b: 26 },
  },

  // Heatmap color: from blue (0) through white (0.5) to magenta (1)
  heatmapColor(value) {
    const v = Utils.clamp(value, 0, 1);
    if (v < 0.5) {
      const t = v / 0.5;
      const c = Utils.lerpColor({ r: 20, g: 40, b: 120 }, Utils.colors.white, t);
      return Utils.rgbString(c.r, c.g, c.b);
    } else {
      const t = (v - 0.5) / 0.5;
      const c = Utils.lerpColor(Utils.colors.white, Utils.colors.magenta, t);
      return Utils.rgbString(c.r, c.g, c.b);
    }
  },

  // Debounce
  debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // Generate unique ID
  uid() {
    return Math.random().toString(36).substring(2, 9);
  },

  // SVG namespace helper
  svgNS: 'http://www.w3.org/2000/svg',

  createSvgElement(tag, attrs = {}) {
    const el = document.createElementNS(Utils.svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    return el;
  },

  // Particle system for background
  initBackgroundParticles(canvas) {
    const ctx = canvas.getContext('2d');
    const particles = [];
    const count = 60;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
        ctx.fill();
      }

      // Draw faint connections between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.05 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }
    animate();
  },

  // Parse neuron config from Claude's response
  parseNeuronConfig(text) {
    const match = text.match(/<neuron_config>([\s\S]*?)<\/neuron_config>/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {
        console.error('Failed to parse neuron config:', e);
        return null;
      }
    }
    return null;
  },

  // Extract chat text (without neuron_config tags)
  extractChatText(text) {
    return text.replace(/<neuron_config>[\s\S]*?<\/neuron_config>/, '').trim();
  },
};
