/**
 * Spike Jumper — audio.js
 * Agent 3 of 3: Web Audio API music system, zone crossfades,
 * synthesized sound effects, beat tracking.
 *
 * Extends window.SJ (initialized by engine.js).
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────
  // NOISE BUFFER HELPER
  // ─────────────────────────────────────────────────────────────
  function createNoiseBuffer(ctx, duration) {
    var sampleRate  = ctx.sampleRate;
    var frameCount  = Math.floor(sampleRate * duration);
    var buf         = ctx.createBuffer(1, frameCount, sampleRate);
    var data        = buf.getChannelData(0);
    for (var i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  // ─────────────────────────────────────────────────────────────
  // SJ.initAudio
  // ─────────────────────────────────────────────────────────────
  SJ.initAudio = function () {
    try {
      SJ.audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
      SJ.masterGain = SJ.audioCtx.createGain();
      SJ.masterGain.gain.value = 0.7;
      SJ.masterGain.connect(SJ.audioCtx.destination);
      SJ.songBuffers = {};
    } catch (e) {
      console.warn('Web Audio API not available:', e);
      SJ.audioCtx  = null;
      SJ.masterGain = null;
      SJ.songBuffers = {};
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.loadSongs — fetch & decode all 5 songs
  // ─────────────────────────────────────────────────────────────
  SJ.loadSongs = function () {
    if (!SJ.audioCtx) return Promise.resolve();

    var songs = [
      'no-role-modelz.mp3',
      'trae-the-truth-in-ibiza.mp3',
      'power-trip.mp3',
      'a-tale-of-2-citiez.mp3',
      'the-let-out.mp3',
    ];

    var promises = songs.map(function (filename) {
      return fetch(filename)
        .then(function (r) { return r.arrayBuffer(); })
        .then(function (buf) { return SJ.audioCtx.decodeAudioData(buf); })
        .then(function (decoded) { SJ.songBuffers[filename] = decoded; })
        .catch(function (e) { console.warn('Could not load song:', filename, e); });
    });

    return Promise.all(promises);
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.stopAllAudio
  // ─────────────────────────────────────────────────────────────
  SJ.stopAllAudio = function () {
    if (SJ.currentSongSource) {
      try { SJ.currentSongSource.stop(); } catch (e) {}
      SJ.currentSongSource = null;
    }
    SJ.currentSongGain = null;
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.playSong(zoneIdx) — stop current, start fresh
  // ─────────────────────────────────────────────────────────────
  SJ.playSong = function (zoneIdx) {
    if (!SJ.audioCtx) return;
    SJ.stopAllAudio();

    var zone = SJ.zones && SJ.zones[zoneIdx];
    if (!zone) return;
    var buf = SJ.songBuffers[zone.songFile];
    if (!buf) {
      // Still update beat interval even without audio
      SJ.beatInterval = 60000 / zone.bpm;
      return;
    }

    if (SJ.audioCtx.state === 'suspended') SJ.audioCtx.resume();

    var source   = SJ.audioCtx.createBufferSource();
    source.buffer = buf;
    source.loop   = true;

    var gainNode  = SJ.audioCtx.createGain();
    gainNode.gain.value = 1;
    source.connect(gainNode);
    gainNode.connect(SJ.masterGain);
    source.start(0);

    SJ.currentSongSource = source;
    SJ.currentSongGain   = gainNode;
    SJ.songStartTime     = SJ.audioCtx.currentTime;
    SJ.beatInterval      = 60000 / zone.bpm;
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.crossfadeTo(zoneIdx) — smooth 1s fade out/in
  // ─────────────────────────────────────────────────────────────
  SJ.crossfadeTo = function (zoneIdx) {
    if (!SJ.audioCtx) return;

    var zone = SJ.zones && SJ.zones[zoneIdx];
    if (!zone) return;

    // Always update beat interval
    SJ.beatInterval = 60000 / zone.bpm;

    var buf = SJ.songBuffers[zone.songFile];

    // Fade out current song
    if (SJ.currentSongGain) {
      var oldGain   = SJ.currentSongGain;
      var oldSource = SJ.currentSongSource;
      try {
        oldGain.gain.cancelScheduledValues(SJ.audioCtx.currentTime);
        oldGain.gain.setValueAtTime(oldGain.gain.value, SJ.audioCtx.currentTime);
        oldGain.gain.linearRampToValueAtTime(0, SJ.audioCtx.currentTime + 1);
      } catch (e) {}
      setTimeout(function () {
        try { oldSource.stop(); } catch (e2) {}
      }, 1100);
    }

    if (!buf) return;

    // Fade in new song
    if (SJ.audioCtx.state === 'suspended') SJ.audioCtx.resume();

    var source   = SJ.audioCtx.createBufferSource();
    source.buffer = buf;
    source.loop   = true;

    var gainNode  = SJ.audioCtx.createGain();
    gainNode.gain.value = 0;
    gainNode.gain.linearRampToValueAtTime(1, SJ.audioCtx.currentTime + 1);
    source.connect(gainNode);
    gainNode.connect(SJ.masterGain);
    source.start(0);

    SJ.currentSongSource = source;
    SJ.currentSongGain   = gainNode;
    SJ.songStartTime     = SJ.audioCtx.currentTime;
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.playSound(name) — synthesized SFX
  // ─────────────────────────────────────────────────────────────
  SJ.playSound = function (name) {
    if (!SJ.audioCtx) return;
    if (SJ.audioCtx.state === 'suspended') SJ.audioCtx.resume();

    var ctx = SJ.audioCtx;
    var now = ctx.currentTime;

    switch (name) {

      case 'whoosh': {
        // Filtered noise burst — wind-rush sensation
        var buf  = createNoiseBuffer(ctx, 0.3);
        var src  = ctx.createBufferSource();
        src.buffer = buf;
        var filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(200, now + 0.25);
        filter.Q.value = 1.5;
        var gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        src.connect(filter); filter.connect(gain); gain.connect(SJ.masterGain);
        src.start(now); src.stop(now + 0.3);
        break;
      }

      case 'crumple': {
        // Paper crumple — death sound
        var buf2 = createNoiseBuffer(ctx, 0.8);
        var src2 = ctx.createBufferSource();
        src2.buffer = buf2;
        var filter2 = ctx.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.value = 1200;
        var gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0.5, now);
        gain2.gain.setValueAtTime(0.3, now + 0.1);
        gain2.gain.linearRampToValueAtTime(0, now + 0.7);
        src2.connect(filter2); filter2.connect(gain2); gain2.connect(SJ.masterGain);
        src2.start(now); src2.stop(now + 0.8);
        break;
      }

      case 'fwip': {
        // Near-miss "fwip" — descending sine blip
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        var gain3 = ctx.createGain();
        gain3.gain.setValueAtTime(0.25, now);
        gain3.gain.linearRampToValueAtTime(0, now + 0.12);
        osc.connect(gain3); gain3.connect(SJ.masterGain);
        osc.start(now); osc.stop(now + 0.12);
        break;
      }

      case 'zone_transition': {
        // Rising tone whoosh for zone change
        var osc4 = ctx.createOscillator();
        osc4.type = 'sine';
        osc4.frequency.setValueAtTime(200, now);
        osc4.frequency.exponentialRampToValueAtTime(600, now + 0.6);
        var gain4 = ctx.createGain();
        gain4.gain.setValueAtTime(0, now);
        gain4.gain.linearRampToValueAtTime(0.4, now + 0.2);
        gain4.gain.linearRampToValueAtTime(0, now + 0.7);
        osc4.connect(gain4); gain4.connect(SJ.masterGain);
        osc4.start(now); osc4.stop(now + 0.7);
        break;
      }

      case 'ui_click': {
        // Short square wave click
        var osc5 = ctx.createOscillator();
        osc5.type = 'square';
        osc5.frequency.value = 440;
        var gain5 = ctx.createGain();
        gain5.gain.setValueAtTime(0.1, now);
        gain5.gain.linearRampToValueAtTime(0, now + 0.05);
        osc5.connect(gain5); gain5.connect(SJ.masterGain);
        osc5.start(now); osc5.stop(now + 0.05);
        break;
      }

      case 'wind': {
        // Soft low-pass noise
        var buf6  = createNoiseBuffer(ctx, 0.5);
        var src6  = ctx.createBufferSource();
        src6.buffer = buf6;
        var filter6 = ctx.createBiquadFilter();
        filter6.type = 'lowpass';
        filter6.frequency.value = 400;
        var gain6 = ctx.createGain();
        gain6.gain.setValueAtTime(0.08, now);
        gain6.gain.linearRampToValueAtTime(0, now + 0.5);
        src6.connect(filter6); filter6.connect(gain6); gain6.connect(SJ.masterGain);
        src6.start(now); src6.stop(now + 0.5);
        break;
      }

      case 'rustle': {
        // High-pass noise rustle for paper
        var buf7  = createNoiseBuffer(ctx, 0.15);
        var src7  = ctx.createBufferSource();
        src7.buffer = buf7;
        var filter7 = ctx.createBiquadFilter();
        filter7.type = 'bandpass';
        filter7.frequency.value = 3000;
        filter7.Q.value = 2;
        var gain7 = ctx.createGain();
        gain7.gain.setValueAtTime(0.05, now);
        gain7.gain.linearRampToValueAtTime(0, now + 0.15);
        src7.connect(filter7); filter7.connect(gain7); gain7.connect(SJ.masterGain);
        src7.start(now); src7.stop(now + 0.15);
        break;
      }

      default:
        break;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SJ.updateBeat — called each frame during gameplay
  // Sets SJ.beatProgress (0 = on beat, rises to 1 before next beat)
  // ─────────────────────────────────────────────────────────────
  SJ.updateBeat = function () {
    if (!SJ.audioCtx || !SJ.songStartTime) {
      SJ.beatProgress   = 0.5;
      SJ.onBeatWindow   = false;
      SJ.onBeatPerfect  = false;
      return;
    }

    var elapsedMs  = (SJ.audioCtx.currentTime - SJ.songStartTime) * 1000;
    var interval   = SJ.beatInterval || 600;
    var beatPos    = (elapsedMs % interval) / interval; // 0-1 within one beat cycle
    SJ.beatProgress = beatPos;

    // Distance from nearest beat edge (ms)
    var distFromBeat = Math.min(beatPos, 1 - beatPos) * interval;
    SJ.onBeatWindow  = distFromBeat < 150;
    SJ.onBeatPerfect = distFromBeat < 50;
  };

  // ─────────────────────────────────────────────────────────────
  // Resume AudioContext on any user interaction
  // ─────────────────────────────────────────────────────────────
  ['keydown', 'click', 'touchstart'].forEach(function (evt) {
    document.addEventListener(evt, function () {
      if (SJ.audioCtx && SJ.audioCtx.state === 'suspended') {
        SJ.audioCtx.resume();
      }
    });
  });

})();
