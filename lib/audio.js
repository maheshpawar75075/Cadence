(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  /* ---------------------------------------------------------------------
   * Ambient Soundscape Synthesizer (Web Audio API - 100% Offline & Pure)
   * ------------------------------------------------------------------- */
  let audioCtx = null;
  let activeSoundNodes = [];
  let masterGainNode = null;
  let ambientGainNode = null;
  let binauralGainNode = null;
  let currentSoundscapeType = null;
  let currentLayerInfo = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function stopAmbientSoundscape() {
    activeSoundNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    activeSoundNodes = [];
    currentSoundscapeType = null;
    currentLayerInfo = null;
  }

  function buildSoundNodes(ctx, type, destNode) {
    if (!ctx || !destNode) return;

    if (type === "lofi_rain") {
      // Pink / Brown noise rain generator with filter
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(destNode);
      noiseSource.start(0);
      activeSoundNodes.push(noiseSource, filter);
    } else if (type === "zen_bowls") {
      // Resonant harmonic chords with slow tremolo
      const freqs = [216, 324, 432, 648];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.1 + idx * 0.05, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);
        lfo.connect(lfoGain);

        g.gain.setValueAtTime(0.12 / (idx + 1), ctx.currentTime);
        lfoGain.connect(g.gain);

        osc.connect(g);
        g.connect(destNode);

        osc.start();
        lfo.start();
        activeSoundNodes.push(osc, lfo, g, lfoGain);
      });
    } else if (type === "cosmic_drift") {
      // Celestial pink drone with subtle frequency oscillation
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "triangle";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc2.frequency.setValueAtTime(110.5, ctx.currentTime); // 0.5Hz binaural beat

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(280, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(destNode);

      osc1.start();
      osc2.start();
      activeSoundNodes.push(osc1, osc2, filter, gain);
    } else if (type === "cyber_cafe") {
      // Warm vinyl crackle & soft low drone
      const bufferSize = ctx.sampleRate;
      const crackleBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = crackleBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() > 0.997 ? (Math.random() * 2 - 1) * 0.4 : 0;
      }
      const crackle = ctx.createBufferSource();
      crackle.buffer = crackleBuffer;
      crackle.loop = true;

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.06, ctx.currentTime);

      crackle.connect(destNode);
      osc.connect(oscGain);
      oscGain.connect(destNode);

      crackle.start();
      osc.start();
      activeSoundNodes.push(crackle, osc, oscGain);
    } else if (type === "forest") {
      // Gentle forest breeze with low resonant flutter
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      oscGain.gain.setValueAtTime(0.05, ctx.currentTime);

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      noise.connect(filter);
      filter.connect(destNode);
      osc.connect(oscGain);
      oscGain.connect(destNode);

      noise.start(0);
      osc.start(0);
      activeSoundNodes.push(noise, filter, osc, oscGain);
    } else if (type === "brown" || type === "ocean") {
      // Deep Brown noise ocean waves
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      noise.connect(filter);
      filter.connect(destNode);
      noise.start(0);
      activeSoundNodes.push(noise, filter);
    } else if (type === "binaural_gamma" || type === "gamma") {
      // 40Hz Gamma Focus Frequency (MIT-studied for intense focus & cognition)
      // Left ear = 200Hz, Right ear = 240Hz
      const merger = ctx.createChannelMerger ? ctx.createChannelMerger(2) : null;
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const gainL = ctx.createGain();
      const gainR = ctx.createGain();

      oscL.type = "sine";
      oscL.frequency.setValueAtTime(200, ctx.currentTime);
      oscR.type = "sine";
      oscR.frequency.setValueAtTime(240, ctx.currentTime);

      gainL.gain.setValueAtTime(0.12, ctx.currentTime);
      gainR.gain.setValueAtTime(0.12, ctx.currentTime);

      oscL.connect(gainL);
      oscR.connect(gainR);

      if (merger) {
        gainL.connect(merger, 0, 0); // left
        gainR.connect(merger, 0, 1); // right
        merger.connect(destNode);
        activeSoundNodes.push(merger);
      } else {
        gainL.connect(destNode);
        gainR.connect(destNode);
      }

      oscL.start();
      oscR.start();
      activeSoundNodes.push(oscL, oscR, gainL, gainR);
    } else if (type === "binaural_alpha" || type === "alpha") {
      // 10Hz Alpha Calm Flow Frequency (Creative flow & calm focus)
      // Left ear = 210Hz, Right ear = 220Hz
      const merger = ctx.createChannelMerger ? ctx.createChannelMerger(2) : null;
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const gainL = ctx.createGain();
      const gainR = ctx.createGain();

      oscL.type = "sine";
      oscL.frequency.setValueAtTime(210, ctx.currentTime);
      oscR.type = "sine";
      oscR.frequency.setValueAtTime(220, ctx.currentTime);

      gainL.gain.setValueAtTime(0.14, ctx.currentTime);
      gainR.gain.setValueAtTime(0.14, ctx.currentTime);

      oscL.connect(gainL);
      oscR.connect(gainR);

      if (merger) {
        gainL.connect(merger, 0, 0);
        gainR.connect(merger, 0, 1);
        merger.connect(destNode);
        activeSoundNodes.push(merger);
      } else {
        gainL.connect(destNode);
        gainR.connect(destNode);
      }

      oscL.start();
      oscR.start();
      activeSoundNodes.push(oscL, oscR, gainL, gainR);
    }
  }

  function playAmbientSoundscape(type, volume = 0.5) {
    stopAmbientSoundscape();
    const ctx = getAudioContext();
    if (!ctx) return;

    masterGainNode = ctx.createGain();
    masterGainNode.gain.setValueAtTime(volume, ctx.currentTime);
    masterGainNode.connect(ctx.destination);
    activeSoundNodes.push(masterGainNode);
    currentSoundscapeType = type;
    currentLayerInfo = { ambient: type, binaural: null, layered: false };

    buildSoundNodes(ctx, type, masterGainNode);
  }

  function playLayeredSoundscapes(ambientType, binauralType, options = {}) {
    stopAmbientSoundscape();
    const ctx = getAudioContext();
    if (!ctx) return;

    const masterVol = typeof options.masterVol === "number" ? options.masterVol : 0.6;
    const ambVol = typeof options.ambientVol === "number" ? options.ambientVol : 0.5;
    const binVol = typeof options.binauralVol === "number" ? options.binauralVol : 0.35;

    masterGainNode = ctx.createGain();
    masterGainNode.gain.setValueAtTime(masterVol, ctx.currentTime);
    masterGainNode.connect(ctx.destination);
    activeSoundNodes.push(masterGainNode);

    if (ambientType) {
      ambientGainNode = ctx.createGain();
      ambientGainNode.gain.setValueAtTime(ambVol, ctx.currentTime);
      ambientGainNode.connect(masterGainNode);
      activeSoundNodes.push(ambientGainNode);
      buildSoundNodes(ctx, ambientType, ambientGainNode);
    }

    if (binauralType) {
      binauralGainNode = ctx.createGain();
      binauralGainNode.gain.setValueAtTime(binVol, ctx.currentTime);
      binauralGainNode.connect(masterGainNode);
      activeSoundNodes.push(binauralGainNode);
      buildSoundNodes(ctx, binauralType, binauralGainNode);
    }

    currentSoundscapeType = `${ambientType || 'none'}+${binauralType || 'none'}`;
    currentLayerInfo = { ambient: ambientType, binaural: binauralType, layered: true };
  }

  function setAmbientVolume(vol) {
    if (masterGainNode && audioCtx) {
      masterGainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.05);
    }
  }

  function setLayerVolumes(ambVol, binVol) {
    if (audioCtx) {
      if (ambientGainNode && typeof ambVol === "number") {
        ambientGainNode.gain.setTargetAtTime(ambVol, audioCtx.currentTime, 0.05);
      }
      if (binauralGainNode && typeof binVol === "number") {
        binauralGainNode.gain.setTargetAtTime(binVol, audioCtx.currentTime, 0.05);
      }
    }
  }

  function getCurrentSoundscape() {
    return currentSoundscapeType;
  }

  function getCurrentLayerInfo() {
    return currentLayerInfo;
  }

  function isPlayingSoundscape() {
    return !!currentSoundscapeType;
  }

  const EXPORTS = {
    playAmbientSoundscape, playLayeredSoundscapes, stopAmbientSoundscape,
    setAmbientVolume, setLayerVolumes, getCurrentSoundscape,
    getCurrentLayerInfo, isPlayingSoundscape
  };

  Object.assign(FL, EXPORTS);
})(typeof window !== "undefined" ? window : globalThis);
