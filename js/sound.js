/* ===================== SFX =====================
   Synthesized UI sounds (Web Audio), not sampled/ripped audio —
   keeps the file self-contained and avoids reusing anyone else's
   copyrighted system sounds. */
const SFX = (() => {
  let ctx;
  let loopTimer = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function click() {
  try {
    const c = getCtx();
    const now = c.currentTime;

    // short filtered noise burst = the "tick" of a physical mouse click
    const bufferSize = Math.floor(c.sampleRate * 0.03);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;

    const bandpass = c.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 3200;
    bandpass.Q.value = 1.1;

    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    noise.connect(bandpass).connect(noiseGain).connect(c.destination);
    noise.start(now);
    noise.stop(now + 0.03);

    // low "thock" underneath for a bit of body/weight
    const osc = c.createOscillator();
    const oscGain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(170, now);
    oscGain.gain.setValueAtTime(0.16, now);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
    osc.connect(oscGain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  } catch (e) { /* audio unavailable, fail silently */ }
}

  function startLoop() {
    stopLoop();
    const notes = [523.25, 659.25, 783.99, 659.25];
    let i = 0;
    try {
      loopTimer = setInterval(() => {
        const c = getCtx();
        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(notes[i % notes.length], now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(gain).connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        i++;
      }, 220);
    } catch (e) { /* audio unavailable, fail silently */ }
  }

  function stopLoop() {
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
  }

  return { click, startLoop, stopLoop };
})();