// Small synthesized sounds (no audio files): a turn chime, a "chosen" ping and a kiss.
let context: AudioContext | null = null;
let muted = false;
export const setMuted = (value: boolean) => { muted = value; };

function tone(frequency: number, start: number, length: number, volume = 0.16, type: OscillatorType = "sine") {
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, context.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + length);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(context.currentTime + start);
  oscillator.stop(context.currentTime + start + length + 0.05);
}
export function playSound(kind: "turn" | "chosen" | "kiss" | "decline") {
  if (muted || typeof window === "undefined") return;
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
