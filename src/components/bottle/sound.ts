import { isDrink } from "./customGifts";
// Game sounds: recordings from public/sounds (turn, kiss, gift, cocktail) with synthesized sounds as a fallback.
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
    if (kind === "turn") return playClip("turn", () => { tone(880, 0, 0.16); tone(1175, 0.14, 0.24); });
    // The pair coming to the middle and a refusal are silent (the beeps sounded harsh).
    if (kind === "chosen" || kind === "decline") return;
    if (kind === "kiss") return playClip(`sfx/${pick(["kissing_our", "kissing2", "kissing3"])}`, () => { tone(1320, 0, 0.09); tone(1760, 0.08, 0.12); tone(2093, 0.2, 0.3, 0.12); });
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
function pourSynth() {
  noise(0, 1.5, 420, 0.22, 1700, 6);
  noise(0, 1.5, 1400, 0.07, 3800, 2);
  for (let i = 0; i < 12; i++) {
    const at = 0.08 + Math.random() * 1.3;
    tone(500 + at * 700 + Math.random() * 350, at, 0.05 + Math.random() * 0.04, 0.05);
  }
  tone(2300, 1.5, 0.35, 0.05);
}
// Recorded sounds. Any gift sound can be replaced by a real recording: put "<name>.mp3" into the site's public/sounds folder
// (kiss.mp3, frog.mp3, cocktail.mp3 ...). A file that exists is played; for a missing one the synthesized sound is used.
const clips = new Map<string, HTMLAudioElement | null>();
function loadClip(name: string) {
  if (clips.has(name) || typeof Audio === "undefined") return;
  clips.set(name, null);
  const audio = new Audio();
  audio.preload = "auto";
  audio.addEventListener("canplaythrough", () => clips.set(name, audio), { once: true });
  audio.src = `/sounds/${name}.mp3`;
}
function playClip(name: string, fallback: () => void) {
  const ready = clips.get(name);
  if (!ready) { loadClip(name); return fallback(); }
  const clip = ready.cloneNode() as HTMLAudioElement;
  clip.volume = level;
  void clip.play().catch(fallback);
}

// A tone whose pitch slides from one frequency to another (animal calls, engines, springs).
function glide(from: number, to: number, start: number, length: number, volume = 0.14, type: OscillatorType = "sine") {
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const at = context.currentTime + start;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, at);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + length);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * level), at + Math.min(0.02, length / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + length + 0.05);
}
const times = (count: number, each: (index: number) => void) => { for (let i = 0; i < count; i++) each(i); };

// Every gift lands with a sound that fits what it is. All of them are synthesized here, no audio files.
const sounds: Record<string, () => void> = {
  kiss: () => { glide(500, 1500, 0, 0.09, 0.16); noise(0.07, 0.05, 2800, 0.4, undefined, 3); glide(600, 1700, 0.24, 0.08, 0.14); noise(0.3, 0.05, 3000, 0.35, undefined, 3); },
  splat: () => { glide(190, 55, 0, 0.14, 0.3, "triangle"); noise(0.02, 0.28, 520, 0.45, 140, 1.5); times(4, (i) => glide(260 - i * 40, 120, 0.1 + i * 0.05, 0.05, 0.1, "sawtooth")); },
  frog: () => { times(2, (croak) => times(6, (i) => glide(170 + croak * 60 + i * 22, 150 + croak * 60 + i * 22, croak * 0.34 + i * 0.036, 0.03, 0.2, "sawtooth"))); },
  duck: () => times(2, (i) => { glide(780, 430, i * 0.2, 0.13, 0.2, "sawtooth"); noise(i * 0.2, 0.1, 1300, 0.12, 700, 4); }),
  cat: () => { glide(520, 1050, 0, 0.22, 0.16, "triangle"); glide(1050, 620, 0.22, 0.34, 0.16, "triangle"); },
  dog: () => times(2, (i) => { glide(430, 190, i * 0.24, 0.1, 0.24, "sawtooth"); noise(i * 0.24, 0.08, 900, 0.2, 300, 2); }),
  pig: () => times(3, (i) => times(3, (j) => glide(260, 170, i * 0.2 + j * 0.035, 0.03, 0.2, "sawtooth"))),
  bird: () => times(3, (i) => glide(2300 + i * 250, 3500 + i * 250, i * 0.13, 0.08, 0.12)),
  rooster: () => { glide(700, 1100, 0, 0.14, 0.18, "sawtooth"); glide(900, 1300, 0.18, 0.12, 0.18, "sawtooth"); glide(1300, 1500, 0.34, 0.3, 0.18, "sawtooth"); glide(1500, 800, 0.64, 0.3, 0.16, "sawtooth"); },
  monkey: () => times(4, (i) => glide(480 + (i % 2) * 260, 820 + (i % 2) * 260, i * 0.12, 0.09, 0.16, "triangle")),
  growl: () => { glide(110, 70, 0, 0.6, 0.26, "sawtooth"); noise(0, 0.6, 180, 0.25, 110, 2); },
  squeak: () => times(2, (i) => glide(2600, 3400, i * 0.14, 0.07, 0.12)),
  neigh: () => times(6, (i) => glide(1100 - i * 90, 950 - i * 90, i * 0.07, 0.06, 0.16, "sawtooth")),
  hiss: () => noise(0, 0.7, 6000, 0.2, 7500, 0.7),
  buzz: () => times(8, (i) => tone(230, i * 0.05, 0.04, 0.14, "sawtooth")),
  boing: () => { glide(240, 720, 0, 0.16, 0.16, "triangle"); glide(520, 300, 0.16, 0.2, 0.1, "triangle"); },
  fanfare: () => { tone(523, 0, 0.14, 0.14, "triangle"); tone(659, 0.12, 0.14, 0.14, "triangle"); tone(784, 0.24, 0.14, 0.14, "triangle"); tone(1047, 0.36, 0.5, 0.16, "triangle"); tone(1319, 0.36, 0.5, 0.08); },
  sparkle: () => [2093, 2637, 3136, 3951, 4186].forEach((note, i) => tone(note, i * 0.06, 0.25, 0.09)),
  cash: () => { noise(0, 0.05, 3000, 0.2); tone(1319, 0.05, 0.4, 0.14); tone(1976, 0.13, 0.5, 0.14); },
  heartbeat: () => times(2, (i) => { glide(90, 45, i * 0.5, 0.12, 0.4); glide(75, 40, i * 0.5 + 0.17, 0.14, 0.32); }),
  chime: () => { tone(1175, 0, 0.5, 0.1); tone(1568, 0.1, 0.5, 0.08); tone(1976, 0.2, 0.6, 0.07); },
  clink: () => { tone(2400, 0, 0.5, 0.12); tone(3100, 0.01, 0.4, 0.08); },
  fizz: () => { tone(2400, 0, 0.3, 0.1); noise(0.05, 0.9, 6000, 0.09, 8000, 0.8); },
  cork: () => { glide(300, 900, 0, 0.05, 0.3); noise(0, 0.04, 1500, 0.4); noise(0.08, 0.9, 6000, 0.09, 8000, 0.8); },
  sip: () => { noise(0, 0.35, 900, 0.2, 2600, 3); glide(300, 500, 0.4, 0.1, 0.1); },
  bite: () => times(2, (i) => noise(i * 0.16, 0.07, 2200, 0.35, 900, 1.5)),
  pop: () => { glide(400, 1200, 0, 0.05, 0.2); noise(0, 0.03, 2000, 0.25); },
  strum: () => [196, 247, 294, 392].forEach((note, i) => tone(note, i * 0.035, 0.7, 0.11, "sawtooth")),
  piano: () => [523, 659, 784, 1047].forEach((note, i) => tone(note, i * 0.12, 0.45, 0.14, "triangle")),
  drum: () => { glide(160, 50, 0, 0.14, 0.4); noise(0.18, 0.1, 2500, 0.3); glide(160, 50, 0.36, 0.14, 0.4); noise(0.46, 0.16, 2500, 0.3); },
  shake: () => times(5, (i) => noise(i * 0.09, 0.05, 5000, 0.2)),
  violin: () => { glide(440, 660, 0, 0.35, 0.12, "sawtooth"); glide(660, 587, 0.35, 0.45, 0.12, "sawtooth"); },
  trumpet: () => { tone(392, 0, 0.12, 0.14, "square"); tone(523, 0.13, 0.12, 0.14, "square"); tone(659, 0.26, 0.4, 0.14, "square"); },
  mic: () => { times(2, (i) => glide(140, 70, i * 0.16, 0.06, 0.35)); glide(2200, 2900, 0.4, 0.25, 0.05); },
  radio: () => { noise(0, 0.3, 3000, 0.12, 800, 0.6); tone(880, 0.3, 0.12, 0.1); tone(1109, 0.42, 0.2, 0.1); },
  boom: () => { glide(140, 35, 0, 0.5, 0.45); noise(0, 0.5, 400, 0.4, 90, 0.8); },
  fire: () => { noise(0, 0.7, 300, 0.3, 2600); times(5, (i) => noise(0.1 + i * 0.11, 0.03, 4000, 0.18)); },
  car: () => { glide(80, 150, 0, 0.45, 0.16, "sawtooth"); tone(620, 0.5, 0.12, 0.14, "square"); tone(620, 0.67, 0.2, 0.14, "square"); },
  moto: () => { glide(70, 260, 0, 0.5, 0.2, "sawtooth"); glide(260, 120, 0.5, 0.3, 0.16, "sawtooth"); },
  plane: () => { noise(0, 1, 500, 0.25, 2600, 1); glide(180, 420, 0, 1, 0.08, "sawtooth"); },
  chopper: () => times(8, (i) => glide(110, 60, i * 0.09, 0.05, 0.3)),
  rocket: () => { noise(0, 0.9, 250, 0.3, 4500, 1); glide(120, 900, 0, 0.9, 0.1, "sawtooth"); },
  horn: () => { tone(150, 0, 0.7, 0.2, "sawtooth"); tone(225, 0, 0.7, 0.12, "sawtooth"); },
  ufo: () => times(6, (i) => glide(500 + (i % 2) * 400, 900 - (i % 2) * 400, i * 0.11, 0.11, 0.12)),
  spooky: () => { glide(700, 250, 0, 0.8, 0.14); glide(740, 270, 0.05, 0.8, 0.1); },
  rattle: () => times(6, (i) => noise(i * 0.06 + Math.random() * 0.02, 0.025, 2600, 0.3)),
  tick: () => times(4, (i) => noise(i * 0.22, 0.02, i % 2 ? 2400 : 3400, 0.4, undefined, 6)),
  ring: () => times(2, (ringing) => times(6, (i) => tone(i % 2 ? 1400 : 1150, ringing * 0.5 + i * 0.05, 0.05, 0.12))),
  toot: () => glide(160, 70, 0, 0.35, 0.24, "sawtooth"),
  whip: () => { noise(0, 0.18, 800, 0.15, 6000, 2); noise(0.18, 0.04, 4000, 0.4); },
};
const soundOf: [string, string][] = [
  ["kiss", "💋 💌 💘"], ["splat", "🍅 🥚"], ["frog", "🐸"], ["duck", "🦆"], ["cat", "🐱 🐈 🐈‍⬛"], ["dog", "🐕 🦊"], ["pig", "🐷 🐖"],
  ["bird", "🐧 🦜 🦢 🦚 🐞 🦋"], ["rooster", "🐓"], ["monkey", "🐵"], ["growl", "🐻 🧸 🐼 🦛 🦇"], ["squeak", "🐭 🐿️ 🐰"], ["neigh", "🐴 🦌 🦄"], ["hiss", "🐍"],
  ["fanfare", "crown 👑 🤴 👸 🔱 🏆 🥇 🏅 tower"], ["sparkle", "diamond ring 💎 💍 💠 ⭕ ⭐ 🌠 🧿 buta"], ["cash", "💵 🧲"],
  ["heartbeat", "heart 💖 💜 💛 🖤 ❤️‍🔥 🩵 💚 🧡 💙 🩷 💟 💝 💔"], ["chime", "rose 🌹 💐 🌷 🪴 🌵 🌸 🥀 🌺 🌼 🍀 xaribulbul semeni 🎀 🎗️"],
  ["clink", "🥂 🍷 🥃 🧊"], ["fizz", "🍺 🥤 🧃 🧋"], ["cork", "🍾"], ["sip", "tea 🍵 ☕ 🧉 🫖 🥛 🫗"],
  ["bite", "🍓 🍒 🍎 🍋 🍉 🥒 🍔 🌭 🍟 🌶️ 🥥 🫒 nar"], ["pop", "🍬 🍭 🍦 🍰 🎂 🧁 🍫 🍧 🍨 🍯 paxlava shekerbura 🎁 🎈"],
  ["strum", "tar 🎸 🪕"], ["piano", "🎹 🎼"], ["drum", "🥁"], ["shake", "🪇"], ["violin", "🎻"], ["trumpet", "🎺 🪈"], ["mic", "🎤 🎙️"], ["radio", "📻 🎛️ 📟"],
  ["boom", "🧨"], ["fire", "flame 🔥 😈 🕯️"], ["car", "🚗 🚙 🚜"], ["moto", "🏍️"], ["plane", "✈️"], ["chopper", "🚁"], ["rocket", "🚀"], ["horn", "🛥️ ⚓"], ["ufo", "👽 🛸"],
  ["spooky", "💀 🕸️ 🎭 🧙"], ["rattle", "🎲 🃏 🧩 🎯"], ["tick", "⌚ ⏰ 🕰️ ⏱️ ⏲️ ⏳"], ["ring", "☎️ 📱"], ["toot", "💩"], ["whip", "🤺 ⚔️ 🏹 🪁"],
  ["boing", "⛑️ 🤠 🎩 👒 🧢 🎓 🪖 👳 🕶️ 😎 🥸 👢 👠 👡 🥾 🥿 🧣 🧤 👜 🧳 👘 🤵 🕴️"],
];
// The original game sounds (public/sounds/sfx/<name>.mp3). Every gift has a sound when it is sent and one when it
// lands; the list for the own gift pictures is public/sounds/gifts.json, the emoji gifts use the table below.
let giftSfx: Record<string, [string[], string[]]> = {};
let giftSfxAsked = false;
function loadGiftSfx() {
  if (giftSfxAsked || typeof fetch === "undefined") return;
  giftSfxAsked = true;
  void fetch("/sounds/gifts.json").then((res) => (res.ok ? res.json() : {})).then((data: Record<string, [string[], string[]]>) => { giftSfx = data ?? {}; }).catch(() => {});
}
const kindSfx: Record<string, [string[], string[]]> = {
  kiss: [["kissing_our", "kissing2", "kissing3"], ["tick"]], splat: [["snow"], ["tomato1", "tomato2"]], frog: [["frog"], ["tick"]],
  cat: [["cat"], ["tick"]], dog: [["bark", "dog"], ["tick"]], pig: [["piglet"], ["tick"]], rooster: [["cock"], ["tick"]], monkey: [["monkey"], ["tick"]],
  neigh: [["horse"], ["tick"]], fanfare: [["fanfare1", "fanfare2"], ["tick"]], sparkle: [["sparkling1", "sparkling2"], ["tick"]], cash: [["jackpot_coins"], ["tick"]],
  heartbeat: [["heartbeat"], ["tick"]], chime: [["snow"], ["beer_tap"]], clink: [["snow"], ["beer_tap"]], fizz: [["beer_pouring"], ["beer_tap"]],
  cork: [["sparkling1"], ["beer_tap"]], sip: [["coffee"], ["light_tap"]], bite: [["snow"], ["light_tap"]], pop: [["snow"], ["tick"]],
  strum: [["guitar"], ["tick"]], piano: [["grand_piano"], ["tick"]], drum: [["drum"], ["tick"]], shake: [["maracas"], ["tick"]], violin: [["spanish_guitar"], ["tick"]],
  trumpet: [["trumpet"], ["tick"]], mic: [["goldenmic"], ["tick"]], radio: [["note1", "note2", "note3", "note4"], ["tick"]], boom: [["boom1", "boom2"], ["tick"]],
  car: [["engine"], ["tick"]], moto: [["engine"], ["tick"]], plane: [["engine"], ["tick"]], chopper: [["engine"], ["tick"]], rocket: [["astro"], ["tick"]],
  horn: [["ship_horn"], ["tick"]], ufo: [["astro"], ["tick"]], spooky: [["ghost", "witch_laughter_1"], ["tick"]], ring: [["nokia"], ["tick"]],
  toot: [["fart"], ["tick"]], whip: [["whip"], ["tick"]], boing: [["spring2"], ["tick"]], tick: [["cuckoo"], ["tick"]],
};
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
// Plays one original sound by name (nothing happens when the file is missing).
export function playSfx(name: string) {
  if (level === 0 || typeof window === "undefined" || !name) return;
  playClip(`sfx/${name}`, () => {});
}
function sfxOf(gift: string): [string[], string[]] | null {
  const name = gift.replace(/^[ec]:/, "");
  if (giftSfx[name]) return giftSfx[name];
  const key = soundOf.find(([, members]) => members.split(" ").includes(name))?.[0] ?? (/kiss/.test(name) ? "kiss" : "pop");
  return kindSfx[key] ?? null;
}
export function playGiftSound(gift: string, moment: "send" | "land") {
  if (level === 0 || typeof window === "undefined") return;
  loadGiftSfx();
  try {
    context ??= new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (context.state === "suspended") void context.resume();
    const sfx = sfxOf(gift);
    const list = sfx ? sfx[moment === "send" ? 0 : 1] : [];
    if (list.length) {
      const name = pick(list);
      if (moment === "send") list.forEach((item) => loadClip(`sfx/${item}`));
      return playClip(`sfx/${name}`, moment === "send" ? () => noise(0, 0.35, 500, 0.1, 2400) : isDrink(gift) ? pourSynth : sounds.pop);
    }
    if (moment === "send") return noise(0, 0.35, 500, 0.1, 2400);
    sounds.pop();
  } catch {
    // Audio is unavailable or blocked: the gift simply lands silently.
  }
}

// The recorded game sounds are small: get them ready as soon as the game loads.
if (typeof window !== "undefined") { ["turn", "sfx/kissing_our", "sfx/kissing2", "sfx/kissing3", "sfx/tick", "sfx/light_tap", "sfx/snow"].forEach(loadClip); loadGiftSfx(); }
