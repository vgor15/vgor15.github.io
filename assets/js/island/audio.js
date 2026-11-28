/* Island sound, all synthesised with Web Audio (no files to download).
   Starts only after the visitor presses Enter, remembers on/off. */
let ctx = null, master = null, sea = null, on = true;
try { on = localStorage.getItem("vg-island-sound") !== "0"; } catch (e) {}

export const sound = {
  get on() { return on; },
  start() {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = on ? 0.5 : 0; master.connect(ctx.destination);
    // soft sea: filtered noise that swells slowly
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 520;
    sea = ctx.createGain(); sea.gain.value = 0.035;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(sea.gain);
    src.connect(lp); lp.connect(sea); sea.connect(master); src.start(); lfo.start();
  },
  toggle(v = !on) { on = v; try { localStorage.setItem("vg-island-sound", on ? "1" : "0"); } catch (e) {} if (master) master.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.05); return on; },
  tone(freq, dur = 0.08, type = "square", vol = 0.06, slide = 0) {
    if (!ctx || !on) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  },
  blip(voice = 600) { this.tone(voice * (0.85 + Math.random() * 0.35), 0.05, "square", 0.025); },
  click() { this.tone(900, 0.04, "triangle", 0.05); },
  step() { this.tone(140 + Math.random() * 40, 0.03, "triangle", 0.025); },
  pop() { this.tone(500, 0.12, "sine", 0.08, 500); },
  whoosh() { this.tone(300, 0.35, "sawtooth", 0.02, -200); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.16, "square", 0.045), i * 90)); },
  good() { this.tone(880, 0.07, "square", 0.04); setTimeout(() => this.tone(1320, 0.08, "square", 0.04), 60); },
  bad() { this.tone(200, 0.18, "sawtooth", 0.05, -80); },
  honk() { this.tone(330, 0.18, "square", 0.05); setTimeout(() => this.tone(262, 0.22, "square", 0.05), 190); },
};
