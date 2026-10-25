// Electronic alarm sound generated with the Web Audio API (no audio file needed)
export function playDigitalAlarm() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const beep = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    [0, 0.15, 0.45, 0.6, 0.9, 1.05, 1.35, 1.5].forEach((offset, i) => {
      beep(i % 2 === 0 ? 950 : 1250, now + offset, 0.12);
    });
    // release the audio context once the beeps are done
    setTimeout(() => ctx.close(), 2500);
    return true;
  } catch (err) {
    console.warn('Web Audio error:', err);
    return false;
  }
}
