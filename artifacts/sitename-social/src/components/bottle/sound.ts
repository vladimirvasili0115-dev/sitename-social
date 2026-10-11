// Small synthesized sounds (no audio files): a turn chime, a "chosen" ping and a kiss.
let context: AudioContext | null = null;
let level = 1;
export const setVolume = (value: number) => { level = Math.min(1, Math.max(0, value)); };

function tone(frequency: number, start: number, length: number, volume = 0.16, type: OscillatorType = "sine") {
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * level), context.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + length);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(context.currentTime + start);
  oscillator.stop(context.currentTime + start + length + 0.05);
}
export function playSound(kind: "turn" | "chosen" | "kiss" | "decline") {
  if (level === 0 || typeof window === "undefined") return;
  try {
    context ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (context.state === "suspended") void context.resume();
    if (kind === "turn") { tone(880, 0, 0.16); tone(1175, 0.14, 0.24); }
    if (kind === "chosen") { tone(660, 0, 0.14, 0.14, "triangle"); tone(990, 0.12, 0.3, 0.14, "triangle"); }
    if (kind === "kiss") { tone(1320, 0, 0.09); tone(1760, 0.08, 0.12); tone(2093, 0.2, 0.3, 0.12); }
    if (kind === "decline") tone(220, 0, 0.3, 0.12, "sawtooth");
  } catch {
    // Audio is unavailable or blocked: the game stays silent.
  }
}

// A short burst of filtered noise (smacks, fizz, whooshes).
function noise(start: number, length: number, frequency: number, volume = 0.2, sweepTo?: number, q = 1) {
  if (!context) return;
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(frequency, context.currentTime + start);
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, context.currentTime + start + length);
  gain.gain.setValueAtTime(Math.max(0.0002, volume * level), context.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + length);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(context.currentTime + start);
}

// Water being poured into a glass: a rushing stream whose pitch climbs as the glass fills, with small bubbles on top.
// If the site has its own recording at /sounds/cocktail.mp3 (put it in the "public" folder), that file plays instead.
let pourFile: HTMLAudioElement | null | undefined;
function pourSynth() {
  noise(0, 1.5, 420, 0.22, 1700, 6);
  noise(0, 1.5, 1400, 0.07, 3800, 2);
  for (let i = 0; i < 12; i++) {
    const at = 0.08 + Math.random() * 1.3;
    tone(500 + at * 700 + Math.random() * 350, at, 0.05 + Math.random() * 0.04, 0.05);
  }
  tone(2300, 1.5, 0.35, 0.05);
}
function pour() {
  if (pourFile === undefined) {
    pourFile = new Audio("/sounds/cocktail.mp3");
    pourFile.addEventListener("error", () => { pourFile = null; }, { once: true });
  }
  if (!pourFile) return pourSynth();
  const clip = pourFile.cloneNode() as HTMLAudioElement;
  clip.volume = level;
  void clip.play().catch(() => pourSynth());
}

// Every kind of gift lands with its own sound. Gifts are grouped by what they are; all sounds are synthesized.
const groups: [string, string][] = [
  ["kiss", "💋"], ["crown", "crown 👑 🤴 👸 🔱 🏆 🥇 🏅"], ["gem", "diamond ring 💎 💍 💠 ⭕ 💵"],
  ["heart", "heart 💖 💜 💛 🖤 ❤️‍🔥 🩵 💚 🧡 💙 🩷 💌 💟 💘 💝 🎀 🎗️"], ["flower", "rose 🌹 💐 🌷 🪴 🌵 🌸 🥀 🌺 🌼 🍀 xaribulbul semeni"],
  ["cocktail", "🍸 🍹"], ["drink", "tea 🥛 🍷 🥃 🍵 ☕ 🥂 🍺 🍾 🧉 🧋 🥤 🧃 🫖 🫗"], ["animal", "🐸 🦆 🐿️ 🦛 🐧 🐵 🧸 🐻 🐱 🦊 🐭 🐼 🐞 🐷 🦌 🐓 🐰 🦜 🐖 🐈 🐴 🐕 🦢 🐍 🦇 🐈‍⬛ 🦚 🦄"],
  ["music", "tar 🎻 🎹 🎼 🪕 🥁 🪇 🎛️ 🎙️ 🎤 🎺 🪈 🎸 📻"], ["fire", "flame 🔥 🧨 😈 🚀"], ["motor", "🚗 🏍️ 🚙 ✈️ 🚁 🚜 🛸 🛥️"],
];
function groupOf(gift: string) {
  const name = gift.replace(/^e:/, "");
  return groups.find(([, members]) => members.split(" ").includes(name))?.[0] ?? "sweet";
}
export function playGiftSound(gift: string, moment: "send" | "land") {
  if (level === 0 || typeof window === "undefined") return;
  try {
    context ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (context.state === "suspended") void context.resume();
    if (moment === "send") return noise(0, 0.35, 500, 0.1, 2400);
    const kind = groupOf(gift);
    if (kind === "kiss") { noise(0, 0.07, 2600, 0.35); tone(900, 0.02, 0.1, 0.12); noise(0.16, 0.06, 3000, 0.3); tone(1300, 0.18, 0.12, 0.1); }
    else if (kind === "crown") { tone(523, 0, 0.14, 0.14, "triangle"); tone(659, 0.12, 0.14, 0.14, "triangle"); tone(784, 0.24, 0.14, 0.14, "triangle"); tone(1047, 0.36, 0.5, 0.16, "triangle"); tone(1319, 0.36, 0.5, 0.08); }
    else if (kind === "gem") { [2093, 2637, 3136, 3951, 4186].forEach((note, i) => tone(note, i * 0.06, 0.25, 0.09)); }
    else if (kind === "heart") { tone(660, 0, 0.18, 0.14); tone(880, 0.14, 0.18, 0.14); tone(1320, 0.28, 0.4, 0.12); }
    else if (kind === "flower") { tone(1175, 0, 0.5, 0.1); tone(1568, 0.1, 0.5, 0.08); tone(1976, 0.2, 0.6, 0.07); }
    else if (kind === "cocktail") pour();
    else if (kind === "drink") { tone(2400, 0, 0.5, 0.12); tone(3100, 0.01, 0.4, 0.08); noise(0.1, 0.5, 5000, 0.06); }
    else if (kind === "animal") { tone(700, 0, 0.09, 0.14, "square"); tone(1050, 0.08, 0.1, 0.12, "square"); tone(700, 0.2, 0.09, 0.14, "square"); tone(1050, 0.28, 0.1, 0.12, "square"); }
    else if (kind === "music") { [392, 494, 587, 784].forEach((note, i) => tone(note, i * 0.11, 0.3, 0.12, "sawtooth")); }
    else if (kind === "fire") { noise(0, 0.6, 300, 0.3, 3000); tone(110, 0, 0.5, 0.12, "sawtooth"); }
    else if (kind === "motor") { tone(90, 0, 0.5, 0.14, "sawtooth"); tone(135, 0.1, 0.5, 0.1, "sawtooth"); tone(620, 0.45, 0.12, 0.12, "square"); tone(620, 0.62, 0.2, 0.12, "square"); }
    else { tone(988, 0, 0.1, 0.14); tone(1319, 0.08, 0.2, 0.12); noise(0, 0.05, 1800, 0.12); }
  } catch {
    // Audio is unavailable or blocked: the gift simply lands silently.
  }
}
