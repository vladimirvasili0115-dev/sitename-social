"use client";

// Domino sounds made in the browser (Web Audio), no sound files:
//   tileSound(): a soft, low "tock" like a domino laid on a felt table (quiet, short, no sharp click)
//   warnSound(): two gentle beeps for "it is your turn" reminders
// Browsers only allow sound after the page was touched once, so the context is created/resumed
// on the first tap. The on/off choice is remembered per device (localStorage "domino-sound").

const KEY = "domino-sound";
let ctx: AudioContext | null = null;

export function soundOn(): boolean {
  try { return window.localStorage.getItem(KEY) !== "off"; } catch { return true; }
}

export function setSoundOn(on: boolean) {
  try { window.localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* storage blocked */ }
  if (on) unlockSound();
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// Call from a tap handler (first touch) so later sounds are allowed.
export function unlockSound() { audio(); }

export function tileSound() {
  if (!soundOn()) return;
  const ac = audio();
  if (!ac || ac.state !== "running") return;
  const t = ac.currentTime;
  const out = ac.createGain();
  out.gain.value = 0.22;
  out.connect(ac.destination);
  // body: a short low knock
  const osc = ac.createOscillator();
  const og = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(240, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.9, t + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(og).connect(out);
  osc.start(t);
  osc.stop(t + 0.13);
  // texture: a very short, filtered tap (low-pass keeps it soft)
  const len = Math.floor(ac.sampleRate * 0.03);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1800;
  const ng = ac.createGain();
  ng.gain.value = 0.35;
  noise.connect(lp).connect(ng).connect(out);
  noise.start(t);
}

export function warnSound() {
  if (!soundOn()) return;
  const ac = audio();
  if (!ac || ac.state !== "running") return;
  const t = ac.currentTime;
  [0, 0.18].forEach((d) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    g.gain.setValueAtTime(0.0001, t + d);
    g.gain.exponentialRampToValueAtTime(0.12, t + d + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.14);
    osc.connect(g).connect(ac.destination);
    osc.start(t + d);
    osc.stop(t + d + 0.15);
  });
}
