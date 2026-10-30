"use client";
import { useEffect, useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

// Chat backgrounds: a day picture (blue sea with the sun) and a night picture (stars and the moon). "Auto" follows the time on the player's own phone.
// The choice is remembered in this browser only. "Plain" is the old look without a picture.
export type ThemeChoice = "auto" | "day" | "night" | "plain";
export type ThemeLook = "day" | "night" | "plain";
const KEY = "chat-theme";
const CHOICES: ThemeChoice[] = ["auto", "day", "night", "plain"];

const words = {
  az: { title: "Söhbət fonu", auto: "Avtomatik", day: "Gündüz", night: "Gecə", plain: "Sadə", open: "Fonu dəyiş" },
  en: { title: "Chat background", auto: "Automatic", day: "Day", night: "Night", plain: "Plain", open: "Change background" },
} as const;

function readChoice(): ThemeChoice {
  try {
    const value = window.localStorage.getItem(KEY);
    return CHOICES.includes(value as ThemeChoice) ? (value as ThemeChoice) : "auto";
  } catch { return "auto"; }
}

export function useChatTheme() {
  const [choice, setChoice] = useState<ThemeChoice>("auto");
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setChoice(readChoice());
    const tick = () => setHour(new Date().getHours());
    tick();
    const timer = window.setInterval(tick, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);
  const change = (next: ThemeChoice) => {
    setChoice(next);
    try { window.localStorage.setItem(KEY, next); } catch { /* storage blocked: the choice lasts until the page closes */ }
  };
  const look: ThemeLook = choice === "plain" ? "plain" : choice === "day" || choice === "night" ? choice : hour === null ? "plain" : hour >= 7 && hour < 19 ? "day" : "night";
  return { choice, look, change };
}

const rnd = (seed: number) => { const x = Math.sin(seed * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
const W = 250;
const H = 420;
function ridge(y: number, amp: number, seed: number, step: number) {
  let path = `M0 ${H} L0 ${y}`;
  for (let x = 0; x <= W + step; x += step) path += ` L${x} ${(y - rnd(seed + x * 0.13) * amp - Math.sin(x * 0.03 + seed) * amp * 0.4).toFixed(1)}`;
  return `${path} L${W} ${H}Z`;
}

function Night() {
  const stars = useMemo(() => Array.from({ length: 110 }, (_, i) => { const b = rnd(i + 9); return { x: rnd(i) * W, y: rnd(i + 99) * H * 0.8, r: 0.4 + b * b * 1.4, o: 0.25 + rnd(i + 3) * 0.65, warm: b > 0.8 }; }), []);
  return (
    <>
      <defs>
        <linearGradient id="ct-n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#050a24" /><stop offset=".55" stopColor="#1b1a5a" /><stop offset="1" stopColor="#4a2a7a" /></linearGradient>
        <radialGradient id="ct-mw"><stop offset="0" stopColor="#9fb8ff" stopOpacity=".5" /><stop offset="1" stopColor="#9fb8ff" stopOpacity="0" /></radialGradient>
        <radialGradient id="ct-mo"><stop offset="0" stopColor="#fff6d8" stopOpacity=".9" /><stop offset="1" stopColor="#fff6d8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ct-n)" />
      <ellipse cx="90" cy="150" rx="170" ry="34" fill="url(#ct-mw)" transform="rotate(-32 90 150)" opacity=".7" />
      {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.warm ? "#ffe8c0" : "#fff"} opacity={s.o} />)}
      <circle cx="190" cy="70" r="60" fill="url(#ct-mo)" />
      <circle cx="190" cy="70" r="24" fill="#fff4cf" />
      <circle cx="182" cy="64" r="4" fill="#e8dcae" opacity=".7" /><circle cx="197" cy="78" r="5" fill="#e8dcae" opacity=".6" /><circle cx="186" cy="82" r="2.5" fill="#e8dcae" opacity=".7" />
      <path d={ridge(340, 70, 1, 16)} fill="#241a52" opacity=".9" />
      <path d={ridge(370, 55, 5, 14)} fill="#150f38" opacity=".95" />
      <path d={ridge(400, 35, 9, 12)} fill="#0a0722" />
    </>
  );
}

function Day() {
  const waves = useMemo(() => Array.from({ length: 8 }, (_, k) => {
    const y = 150 + k * 38;
    const points: string[] = [];
    for (let x = 0; x <= W; x += 10) points.push(`${x} ${(y + Math.sin(x * 0.045 + k * 1.3) * 9 + Math.sin(x * 0.11 + k) * 3).toFixed(1)}`);
    const line = `M${points.join(" L")}`;
    return { line, fill: `M0 ${H} L${points.join(" L")} L${W} ${H}Z`, color: `hsl(${205 - k * 3} ${70 + k * 2}% ${70 - k * 7}%)`, k };
  }), []);
  return (
    <>
      <defs>
        <linearGradient id="ct-d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe9ff" /><stop offset=".45" stopColor="#5db5ea" /><stop offset="1" stopColor="#0f5f9c" /></linearGradient>
        <radialGradient id="ct-sun"><stop offset="0" stopColor="#fff7c4" stopOpacity="1" /><stop offset=".45" stopColor="#ffe27a" stopOpacity=".75" /><stop offset="1" stopColor="#ffd34d" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#ct-d)" />
      <circle cx="195" cy="62" r="78" fill="url(#ct-sun)" />
      {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return <line key={i} x1={195 + Math.cos(a) * 30} y1={62 + Math.sin(a) * 30} x2={195 + Math.cos(a) * 44} y2={62 + Math.sin(a) * 44} stroke="#fff3b0" strokeWidth="2.4" strokeLinecap="round" opacity=".85" />; })}
      <circle cx="195" cy="62" r="24" fill="#fff3b0" />
      <circle cx="195" cy="62" r="19" fill="#ffd23f" />
      {waves.map((w) => <g key={w.k}><path d={w.fill} fill={w.color} opacity=".85" /><path d={w.line} fill="none" stroke="#fff" strokeWidth="1.4" opacity={0.5 - w.k * 0.04} /></g>)}
    </>
  );
}

// The picture sits behind the message list. A faint Ravetill mark in the lower right corner, light enough not to tire the eyes.
export function ChatBackdrop({ look }: { look: ThemeLook }) {
  if (look === "plain") return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">{look === "night" ? <Night /> : <Day />}</svg>
      <img src="/favicon.svg" alt="" className="absolute bottom-3 right-3 h-12 w-12 opacity-[0.22]" draggable={false} />
    </div>
  );
}

// The small button next to the bin: opens the four choices.
export function ChatThemeButton({ theme }: { theme: ReturnType<typeof useChatTheme> }) {
  const { locale } = useTranslation();
  const w = locale === "az" ? words.az : words.en;
  const [open, setOpen] = useState(false);
  const preview: Record<ThemeChoice, string> = {
    auto: "linear-gradient(135deg,#5db5ea 0 50%,#1b1a5a 50% 100%)",
    day: "linear-gradient(180deg,#bfe9ff,#3d9ad8)",
    night: "linear-gradient(180deg,#050a24,#4a2a7a)",
    plain: "linear-gradient(180deg,#f3f4f6,#e5e7eb)",
  };
  return (
    <div className="relative">
      <IconButton aria-label={w.open} title={w.open} onClick={() => setOpen((value) => !value)}><Palette size={18} /></IconButton>
      {open ? (
        <>
          <button type="button" aria-label="close" onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default bg-transparent" />
          <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-[220px] rounded-2xl border border-border bg-surface p-3 shadow-xl">
            <p className="mb-2 text-xs font-bold text-muted">{w.title}</p>
            <div className="grid grid-cols-2 gap-2">
              {CHOICES.map((item) => (
                <button key={item} type="button" role="menuitemradio" aria-checked={theme.choice === item} onClick={() => { theme.change(item); setOpen(false); }} className={cn("flex flex-col items-center gap-1 rounded-xl border p-1.5 text-xs font-semibold text-text hover:bg-surface-2", theme.choice === item ? "border-accent" : "border-border")}>
                  <span className="block h-12 w-full rounded-lg" style={{ background: preview[item] }} />
                  <span>{item === "auto" ? `${w.auto}` : w[item]}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
