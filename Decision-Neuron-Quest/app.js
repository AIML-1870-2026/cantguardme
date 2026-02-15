/* ==============================
   Decision Neuron Quest — App
   State management & initialization
   ============================== */

window.NeuronApp = {
  state: {
    mode: 'decide',
    network: {
      title: '',
      emoji: '',
      inputs: [],
      bias: { value: 0, label: 'Neutral' },
      yesLabel: 'Yes',
      noLabel: 'No',
      activationFunction: 'sigmoid',
      twoNeuron: false,
      neuron2: null,
    },
  },

  listeners: {},

  emit(event, data) {
    (this.listeners[event] || []).forEach(fn => fn(data));
  },

  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  },

  updateNetwork(config) {
    if (config.title !== undefined) this.state.network.title = config.title;
    if (config.emoji !== undefined) this.state.network.emoji = config.emoji;
    if (config.inputs !== undefined) this.state.network.inputs = config.inputs;
    if (config.bias !== undefined) this.state.network.bias = config.bias;
    if (config.yesLabel !== undefined) this.state.network.yesLabel = config.yesLabel;
    if (config.noLabel !== undefined) this.state.network.noLabel = config.noLabel;
    if (config.activationFunction !== undefined) this.state.network.activationFunction = config.activationFunction;
    if (config.twoNeuron !== undefined) this.state.network.twoNeuron = config.twoNeuron;
    if (config.neuron2 !== undefined) this.state.network.neuron2 = config.neuron2;

    for (const inp of this.state.network.inputs) {
      if (inp.value === undefined) inp.value = 0.5;
    }
    if (this.state.network.neuron2 && this.state.network.neuron2.inputs) {
      for (const inp of this.state.network.neuron2.inputs) {
        if (inp.value === undefined) inp.value = 0.5;
      }
    }

    this.emit('networkUpdate', this.state.network);
  },

  setMode(mode) {
    this.state.mode = mode;
    this.emit('modeChange', mode);
  },

  init() {
    Utils.initBackgroundParticles(document.getElementById('bg-particles'));

    Audio.init();
    NetworkViz.init();
    // SubPanels & LearnMode still work for Learn mode
    SubPanels.init();
    LearnMode.init();
    Chat.init();

    // Audio toggle
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const enabled = Audio.toggle();
        audioBtn.classList.toggle('audio-on', enabled);
        audioBtn.classList.toggle('audio-off', !enabled);
        document.getElementById('audio-icon-on').style.display = enabled ? '' : 'none';
        document.getElementById('audio-icon-off').style.display = enabled ? 'none' : '';
        if (enabled) Audio.playClick();
      });
    }

    // Mode toggle
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Audio.playModeSwitch();
        this.setMode(mode);
      });
    });

    this.on('modeChange', (mode) => {
      document.querySelectorAll('.mode-container').forEach(el => el.classList.remove('active'));
      document.getElementById(mode + '-mode').classList.add('active');
    });

    // Network updates just re-render the viz
    this.on('networkUpdate', (network) => {
      NetworkViz.render(network);
    });

    this.setupInputInteraction();

    window.addEventListener('resize', Utils.debounce(() => {
      if (this.state.network.inputs.length > 0) {
        NetworkViz.render(this.state.network);
      }
    }, 250));
  },

  setupInputInteraction() {
    const svg = document.getElementById('network-svg');
    let dragging = null;

    svg.addEventListener('mousedown', (e) => {
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const network = this.state.network;
      if (!network.inputs || network.inputs.length === 0) return;

      const W = rect.width;
      const H = rect.height;
      const padding = 50;
      const inputArcCenterX = W * 0.15;
      const numInputs = network.inputs.length;

      for (let i = 0; i < numInputs; i++) {
        const t = numInputs === 1 ? 0.5 : i / (numInputs - 1);
        const nodeX = inputArcCenterX + Math.cos((t - 0.5) * 0.6) * 30;
        const nodeY = padding + t * (H - 2 * padding);

        const dx = x - nodeX;
        const dy = y - nodeY;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          dragging = i;
          break;
        }
      }
    });

    svg.addEventListener('mousemove', (e) => {
      if (dragging === null) return;
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const value = Utils.clamp(x, 0, 1);
      this.state.network.inputs[dragging].value = parseFloat(value.toFixed(2));
      NetworkViz.render(this.state.network);
    });

    const endDrag = () => { dragging = null; };
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    svg.addEventListener('wheel', (e) => {
      const network = this.state.network;
      if (!network.inputs || network.inputs.length === 0) return;

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const W = rect.width;
      const H = rect.height;
      const padding = 50;
      const inputArcCenterX = W * 0.15;
      const numInputs = network.inputs.length;

      for (let i = 0; i < numInputs; i++) {
        const t = numInputs === 1 ? 0.5 : i / (numInputs - 1);
        const nodeX = inputArcCenterX + Math.cos((t - 0.5) * 0.6) * 30;
        const nodeY = padding + t * (H - 2 * padding);

        const dx = x - nodeX;
        const dy = y - nodeY;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.05 : 0.05;
          network.inputs[i].value = Utils.clamp((network.inputs[i].value || 0.5) + delta, 0, 1);
          network.inputs[i].value = parseFloat(network.inputs[i].value.toFixed(2));
          NetworkViz.render(network);
          break;
        }
      }
    });
  },
};

document.addEventListener('DOMContentLoaded', () => {
  window.NeuronApp.init();
});
