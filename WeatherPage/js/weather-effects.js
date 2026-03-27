export class WeatherEffects {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.conditionCode = 800;
    this.isNight = false;
    this.targetGradient = null;
    this.currentGradient = null;
    this.transitionProgress = 1;
    this.lightningTimer = 0;
    this.lightningActive = false;
    this.fogLayers = [];
    this.animFrameId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.initFogLayers();
  }

  initFogLayers() {
    this.fogLayers = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * this.canvas.width,
      y: (i / 5) * this.canvas.height,
      width: this.canvas.width * (1.2 + Math.random() * 0.8),
      height: 80 + Math.random() * 60,
      speed: 0.1 + Math.random() * 0.2,
      alpha: 0.05 + Math.random() * 0.08,
    }));
  }

  setCondition(conditionCode, isNight) {
    this.conditionCode = conditionCode;
    this.isNight = isNight;
    this.targetGradient = this.getGradientColors(conditionCode, isNight);
    this.transitionProgress = 0;
    this.particles = [];
    this.spawnParticles();
  }

  getGradientColors(code, isNight) {
    if (code === 800) {
      if (isNight) return { top: '#020817', mid: '#0f172a', bot: '#1e1b4b' };
      return { top: '#1a237e', mid: '#1565c0', bot: '#e65100' };
    }
    if (code >= 801 && code <= 804) return { top: '#1a2740', mid: '#263954', bot: '#374151' };
    if (code >= 300 && code < 400) return { top: '#0f1a2e', mid: '#1a2d4a', bot: '#253652' };
    if (code >= 500 && code < 600) return { top: '#0a1628', mid: '#162236', bot: '#1e3a5f' };
    if (code >= 600 && code < 700) return { top: '#1a2540', mid: '#2d3d5c', bot: '#d4e8f5' };
    if (code >= 200 && code < 300) return { top: '#0a0015', mid: '#12002a', bot: '#1a0030' };
    if (code >= 700 && code < 800) return { top: '#1a1a2e', mid: '#2a2a3e', bot: '#3a3a4e' };
    return { top: '#0a0a1a', mid: '#0d1b2a', bot: '#162032' };
  }

  spawnParticles() {
    const code = this.conditionCode;
    const W = this.canvas.width;
    const H = this.canvas.height;

    if (code === 800 && !this.isNight) {
      // Sun motes
      for (let i = 0; i < 60; i++) {
        this.particles.push({
          type: 'mote',
          x: Math.random() * W, y: Math.random() * H,
          size: 1 + Math.random() * 3,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: -0.1 - Math.random() * 0.3,
          alpha: 0.2 + Math.random() * 0.5,
          alphaDelta: (Math.random() - 0.5) * 0.01,
        });
      }
    } else if (code === 800 && this.isNight) {
      // Stars
      for (let i = 0; i < 200; i++) {
        this.particles.push({
          type: 'star',
          x: Math.random() * W, y: Math.random() * H * 0.85,
          size: 0.5 + Math.random() * 2,
          alpha: 0.4 + Math.random() * 0.6,
          twinkleSpeed: 0.005 + Math.random() * 0.02,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    } else if (code >= 300 && code < 400) {
      // Drizzle
      for (let i = 0; i < 80; i++) {
        this.particles.push(this.makeRainDrop(W, H, 0.4, 3, 4));
      }
    } else if (code >= 500 && code < 600) {
      // Rain
      for (let i = 0; i < 200; i++) {
        this.particles.push(this.makeRainDrop(W, H, 0.8, 5, 8));
      }
    } else if (code >= 200 && code < 300) {
      // Thunderstorm — heavy rain
      for (let i = 0; i < 250; i++) {
        this.particles.push(this.makeRainDrop(W, H, 0.9, 6, 10));
      }
      this.lightningTimer = 80 + Math.random() * 120;
    } else if (code >= 600 && code < 700) {
      // Snow
      for (let i = 0; i < 120; i++) {
        this.particles.push({
          type: 'snow',
          x: Math.random() * W, y: Math.random() * H,
          size: 2 + Math.random() * 5,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: 0.5 + Math.random() * 1.5,
          alpha: 0.6 + Math.random() * 0.4,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.01 + Math.random() * 0.02,
        });
      }
    } else if (code >= 801 && code <= 804) {
      // Cloud wisps
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          type: 'wisp',
          x: Math.random() * W, y: 50 + Math.random() * (H * 0.4),
          width: 150 + Math.random() * 200,
          height: 40 + Math.random() * 40,
          speed: 0.15 + Math.random() * 0.2,
          alpha: 0.04 + Math.random() * 0.06,
        });
      }
    }
  }

  makeRainDrop(W, H, alpha, lenMin, lenMax) {
    return {
      type: 'rain',
      x: Math.random() * W,
      y: Math.random() * H,
      length: lenMin + Math.random() * (lenMax - lenMin),
      speedX: -2 - Math.random() * 2,
      speedY: 12 + Math.random() * 8,
      alpha: alpha * (0.5 + Math.random() * 0.5),
    };
  }

  drawBackground() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const g = this.targetGradient || { top: '#0a0a1a', mid: '#0d1b2a', bot: '#162032' };

    const grad = this.ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, g.top);
    grad.addColorStop(0.5, g.mid);
    grad.addColorStop(1, g.bot);

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, W, H);
  }

  drawParticles() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'rain') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speedX * 0.15 * p.length, p.y + p.speedY * 0.15 * p.length);
        ctx.strokeStyle = `rgba(174, 214, 241, ${p.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        p.x += p.speedX * 0.5;
        p.y += p.speedY * 0.5;
        if (p.y > H || p.x < 0) {
          p.x = Math.random() * W;
          p.y = -20;
        }
      } else if (p.type === 'snow') {
        p.wobble += p.wobbleSpeed;
        p.x += Math.sin(p.wobble) * 0.5 + p.speedX;
        p.y += p.speedY;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
        if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
      } else if (p.type === 'star') {
        const flicker = Math.sin(Date.now() * p.twinkleSpeed + p.twinkleOffset);
        const a = p.alpha * (0.6 + 0.4 * flicker);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.fill();
      } else if (p.type === 'mote') {
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha += p.alphaDelta;
        if (p.alpha <= 0 || p.alpha >= 0.8) p.alphaDelta *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gr.addColorStop(0, `rgba(255, 240, 180, ${p.alpha})`);
        gr.addColorStop(1, 'rgba(255, 220, 100, 0)');
        ctx.fillStyle = gr;
        ctx.fill();
        if (p.y < -10) { p.y = this.canvas.height + 10; p.x = Math.random() * W; }
      } else if (p.type === 'wisp') {
        p.x += p.speed;
        if (p.x - p.width / 2 > W) p.x = -p.width / 2;
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.width / 2);
        gr.addColorStop(0, `rgba(180, 200, 220, ${p.alpha})`);
        gr.addColorStop(1, 'rgba(180, 200, 220, 0)');
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
      }
    }
  }

  drawFog() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    for (const layer of this.fogLayers) {
      layer.x += layer.speed;
      if (layer.x - layer.width / 2 > W) layer.x = -layer.width / 2;
      const gr = ctx.createRadialGradient(layer.x, layer.y, 0, layer.x, layer.y, layer.width / 2);
      gr.addColorStop(0, `rgba(200, 200, 210, ${layer.alpha})`);
      gr.addColorStop(1, 'rgba(200, 200, 210, 0)');
      ctx.beginPath();
      ctx.ellipse(layer.x, layer.y, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
    }
  }

  drawLightning() {
    if (this.conditionCode < 200 || this.conditionCode >= 300) return;
    this.lightningTimer--;
    if (this.lightningTimer <= 0) {
      this.lightningActive = true;
      this.lightningTimer = 100 + Math.random() * 150;
      setTimeout(() => { this.lightningActive = false; }, 80 + Math.random() * 100);
    }
    if (this.lightningActive) {
      this.ctx.fillStyle = 'rgba(180, 140, 255, 0.12)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  animate() {
    this.drawBackground();
    const code = this.conditionCode;
    if (code >= 700 && code < 800) this.drawFog();
    this.drawParticles();
    if (code >= 200 && code < 300) this.drawLightning();
    this.animFrameId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}
