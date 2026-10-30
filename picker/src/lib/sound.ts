// Every sound is synthesized with Web Audio, so there are no audio files to ship.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === "undefined") return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.4;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneOptions {
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
}

function tone(freq: number, delay: number, duration: number, { type = "triangle", gain = 0.3, slideTo }: ToneOptions = {}) {
  const c = audio();
  if (!c || !master) return;
  const start = c.currentTime + delay;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(env).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function noise(duration: number, from: number, to: number, gain: number) {
  const c = audio();
  if (!c || !master) return;
  const length = Math.floor(c.sampleRate * duration);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(to, c.currentTime + duration);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, c.currentTime);
  env.gain.exponentialRampToValueAtTime(gain, c.currentTime + duration * 0.3);
  env.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  src.connect(filter).connect(env).connect(master);
  src.start();
}

const NOTE = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5, G6: 1567.98 };

export const sfx = {
  tick() {
    tone(1500 + Math.random() * 300, 0, 0.03, { type: "square", gain: 0.06 });
  },
  whoosh() {
    noise(0.55, 350, 3200, 0.35);
    tone(220, 0, 0.35, { type: "sine", gain: 0.12, slideTo: 660 });
  },
  pop() {
    tone(500, 0, 0.12, { type: "sine", gain: 0.25, slideTo: 1100 });
  },
  land() {
    tone(1200, 0, 0.08, { type: "square", gain: 0.08 });
    tone(1800, 0.05, 0.14, { type: "triangle", gain: 0.16 });
  },
  win() {
    const { C5, E5, G5, C6, E6, G6 } = NOTE;
    [C5, E5, G5, C6].forEach((f, i) => tone(f, i * 0.09, 0.22, { gain: 0.24 }));
    [C6, E6, G6].forEach((f) => tone(f, 0.38, 0.9, { gain: 0.14 }));
    [G5, C6].forEach((f) => tone(f / 2, 0.38, 0.9, { type: "sine", gain: 0.16 }));
    for (let i = 0; i < 6; i++) tone(2000 + Math.random() * 2400, 0.45 + i * 0.07, 0.12, { type: "sine", gain: 0.06 });
  },
  fanfare() {
    const { C5, E5, G5, C6, E6, G6 } = NOTE;
    [G5, G5, G5, C6].forEach((f, i) => tone(f, i * 0.13, i === 3 ? 0.5 : 0.11, { type: "square", gain: 0.1 }));
    [C6, E6, G6].forEach((f) => tone(f, 0.55, 1.2, { gain: 0.13 }));
    [C5, E5].forEach((f) => tone(f / 2, 0.55, 1.2, { type: "sine", gain: 0.18 }));
  },
  buzz() {
    tone(196, 0, 0.42, { type: "sawtooth", gain: 0.09, slideTo: 98 });
  },
};
