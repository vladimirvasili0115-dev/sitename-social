// The voice host. For each game event it plays /mafia/audio/<code>.mp3 when that recording exists;
// otherwise it reads the text aloud with the phone's own voice (Azerbaijani if installed, Turkish as the closest fallback).
const KEY = "mafia-voice-off";
const failed = new Set<string>();
let current: HTMLAudioElement | null = null;

export function isNarratorOff(): boolean {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}
function stopNarrator() {
  try { window.speechSynthesis?.cancel(); } catch { /* no speech on this device */ }
  try { current?.pause(); } catch { /* nothing playing */ }
  current = null;
}
export function setNarratorOff(off: boolean) {
  try { localStorage.setItem(KEY, off ? "1" : "0"); } catch { /* storage blocked */ }
  if (off) stopNarrator();
}
function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const voice = voices.find((item) => item.lang.toLowerCase().startsWith("az")) ?? voices.find((item) => item.lang.toLowerCase().startsWith("tr"));
    if (voice) { utter.voice = voice; utter.lang = voice.lang; } else utter.lang = "tr-TR";
    utter.rate = 0.95;
    synth.speak(utter);
  } catch { /* speech blocked */ }
}
export function narrate(code: string, text: string) {
  if (typeof window === "undefined" || isNarratorOff()) return;
  stopNarrator();
  if (failed.has(code)) { speak(text); return; }
  try {
    const audio = new Audio(`/mafia/audio/${code}.mp3`);
    current = audio;
    audio.onerror = () => { failed.add(code); speak(text); };
    void audio.play().catch(() => { speak(text); });
  } catch { speak(text); }
}
