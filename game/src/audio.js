// audio.js — one job: synthesized sound effects through WebAudio, no audio files.
// Every sound is built from oscillators at call time, so the game ships no media.

// SoundBank holds one AudioContext (created lazily on the first user gesture, so
// browsers' autoplay rules never block the page) and a mute flag. All methods are
// safe to call before any gesture: they no-op until the context exists.
export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  // ensureContext — creates the AudioContext on first use. Returns null when the
  // browser has no WebAudio; callers check the return and stay silent.
  ensureContext() {
    if (this.context) return this.context;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    this.context = new Ctor();
    return this.context;
  }

  // unlock — call from a pointer/key handler so later sounds are allowed.
  unlock() {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // tone — plays one sine/triangle note: freq in hertz, dur in seconds, gain 0–1,
  // starting delaySec seconds from now. The single primitive every effect uses.
  tone(freq, dur, gain, delaySec, type) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    const t0 = ctx.currentTime + (delaySec || 0);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // chime — the satisfying two-note find sound: E5 then A5, 523.25 Hz and 880 Hz.
  chime() {
    this.tone(523.25, 0.18, 0.25, 0);
    this.tone(880.0, 0.3, 0.22, 0.09);
  }

  // buzz — the wrong-click thud: a low 110 Hz square wave, short and dull.
  buzz() {
    this.tone(110.0, 0.22, 0.2, 0, 'square');
  }

  // blip — the hint sound: a soft 660 Hz triangle note.
  blip() {
    this.tone(660.0, 0.15, 0.18, 0, 'triangle');
  }

  // fanfare — level-clear arpeggio: C5, E5, G5, C6 ascending (523/659/784/1047 Hz).
  fanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => this.tone(freq, 0.25, 0.22, i * 0.11));
  }
}
