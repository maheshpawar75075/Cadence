  /* ---------------------------------------------------------------------
   * Ambient Soundscape Synthesizer (Web Audio API - 100% Offline & Pure)
   * ------------------------------------------------------------------- */
  let audioCtx = null;
  let activeSoundNodes = [];
  let masterGainNode = null;
  let currentSoundscapeType = null;

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
      filter.connect(masterGainNode);
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
        g.connect(masterGainNode);

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
      gain.connect(masterGainNode);

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

      crackle.connect(masterGainNode);
      osc.connect(oscGain);
      oscGain.connect(masterGainNode);

      crackle.start();
      osc.start();
      activeSoundNodes.push(crackle, osc, oscGain);
    }
  }

  function setAmbientVolume(vol) {
    if (masterGainNode && audioCtx) {
      masterGainNode.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.05);
    }
  }
