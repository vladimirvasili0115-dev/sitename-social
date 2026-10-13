"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Minimize2, Plus, X } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { BottleGame } from "./BottleGame";

// Small repeating doodles (hearts, notes, gifts) for the loading screen.
const pattern = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" fill="none" stroke="#E9F5D2" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(26 22) rotate(9) scale(1)"><path d="M0 6c-6-4-9-7-9-10.5 0-3 2.200-5 4.700-5 1.800 0 3.300 1 4.300 2.600 1-1.600 2.500-2.600 4.300-2.600 2.500 0 4.700 2 4.700 5C9 -1 6 2 0 6z"/></g><g transform="translate(80 40) rotate(17) scale(1)"><path d="M-11 0c4-6 8-7 11-4 3-3 7-2 11 4-4 6-8 7-11 7s-7-1-11-7z"/><path d="M-11 0c7 2 15 2 22 0"/></g><g transform="translate(140 18) rotate(20) scale(1.15)"><path d="M-3 6V-8l9-2v12"/><circle cx="-6" cy="6" r="3"/><circle cx="3" cy="4" r="3"/></g><g transform="translate(196 44) rotate(30) scale(1.15)"><rect x="-8" y="-3" width="16" height="12" rx="1.500"/><rect x="-10" y="-7" width="20" height="5" rx="1"/><path d="M0-7v16M0-7c-5-6-9 0 0 0 9 0 5-6 0 0"/></g><g transform="translate(40 82) rotate(11) scale(1.15)"><path d="M-10 6l-2-12 6 5 6-8 6 8 6-5-2 12z"/></g><g transform="translate(108 96) rotate(-29) scale(1)"><path d="M-2-11h4v5c0 2 3 3 3 7v9c0 1.500-1 2.500-2.500 2.500h-5C-4 12.500-5 11.500-5 10V1c0-4 3-5 3-7z"/></g><g transform="translate(172 100) rotate(19) scale(0.85)"><circle cx="0" cy="0" r="3"/></g><g transform="translate(16 140) rotate(11) scale(0.85)"><path d="M0 6c-6-4-9-7-9-10.5 0-3 2.200-5 4.700-5 1.800 0 3.300 1 4.300 2.600 1-1.600 2.500-2.600 4.300-2.600 2.500 0 4.700 2 4.700 5C9 -1 6 2 0 6z"/></g><g transform="translate(70 150) rotate(27) scale(0.85)"><path d="M-11 0c4-6 8-7 11-4 3-3 7-2 11 4-4 6-8 7-11 7s-7-1-11-7z"/><path d="M-11 0c7 2 15 2 22 0"/></g><g transform="translate(130 160) rotate(-23) scale(1)"><path d="M-3 6V-8l9-2v12"/><circle cx="-6" cy="6" r="3"/><circle cx="3" cy="4" r="3"/></g><g transform="translate(200 170) rotate(0) scale(0.85)"><rect x="-8" y="-3" width="16" height="12" rx="1.500"/><rect x="-10" y="-7" width="20" height="5" rx="1"/><path d="M0-7v16M0-7c-5-6-9 0 0 0 9 0 5-6 0 0"/></g><g transform="translate(46 204) rotate(-6) scale(1.15)"><path d="M-10 6l-2-12 6 5 6-8 6 8 6-5-2 12z"/></g><g transform="translate(156 212) rotate(-24) scale(1.15)"><path d="M-2-11h4v5c0 2 3 3 3 7v9c0 1.500-1 2.500-2.500 2.500h-5C-4 12.500-5 11.500-5 10V1c0-4 3-5 3-7z"/></g><g transform="translate(98 200) rotate(-15) scale(0.85)"><circle cx="0" cy="0" r="3"/></g><g transform="translate(214 124) rotate(16) scale(0.85)"><path d="M0 6c-6-4-9-7-9-10.5 0-3 2.200-5 4.700-5 1.800 0 3.300 1 4.300 2.600 1-1.600 2.500-2.600 4.300-2.600 2.500 0 4.700 2 4.700 5C9 -1 6 2 0 6z"/></g><g transform="translate(150 64) rotate(-4) scale(1)"><path d="M-11 0c4-6 8-7 11-4 3-3 7-2 11 4-4 6-8 7-11 7s-7-1-11-7z"/><path d="M-11 0c7 2 15 2 22 0"/></g><g transform="translate(60 120) rotate(-19) scale(1)"><path d="M-3 6V-8l9-2v12"/><circle cx="-6" cy="6" r="3"/><circle cx="3" cy="4" r="3"/></g></svg>')}")`;

// One bouncy letter of the title: yellow-to-orange face with a darker orange edge underneath.
function Letter({ char, size, lift, turn }: { char: string; size: string; lift: number; turn: number }) {
  return (
    <span className="relative inline-block" style={{ fontSize: size, transform: `translateY(${lift}%) rotate(${turn}deg)` }}>
      <span aria-hidden="true" className="absolute left-0 top-[0.05em] text-[#D2650A] [-webkit-text-stroke:0.06em_#D2650A]">{char}</span>
      <span className="relative bg-[linear-gradient(180deg,#FFE15A_15%,#FFB523_55%,#FF9414)] bg-clip-text text-transparent">{char}</span>
    </span>
  );
}

// The game opens in a phone-sized window over the site, like an app; "Tam ekran" stretches it over the whole screen.
export function GameWindow({ onClose, startFull = false }: { onClose: () => void; startFull?: boolean }) {
  const { t } = useTranslation();
  const [full, setFull] = useState(startFull);
  const [loading, setLoading] = useState(true);
  // Your own loading picture: put it at public/games/loading.png and it fills the whole screen; without it the drawn title is shown.
  const [ownSplash, setOwnSplash] = useState(true);
  const [dedicate, setDedicate] = useState(false);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 1700);
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setDesktop(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !(event.target as HTMLElement).closest("input, textarea")) onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      query.removeEventListener("change", onChange);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className={cn("fixed inset-0 z-[60] flex items-center justify-center", full ? "bg-bg" : "bg-[rgba(4,8,12,0.82)] p-0 sm:p-5")} onMouseDown={(event) => { if (!full && event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={t("bottle.title")} className={cn("relative flex flex-col overflow-hidden bg-[#D9954E] shadow-2xl", full ? "h-full w-full" : "h-full w-full sm:h-[min(860px,calc(100dvh-40px))] sm:w-[430px] sm:rounded-[26px]")}>
        <div className="relative min-h-0 flex-1">
          <BottleGame wide={full && desktop} full={full} onToggleFull={() => setFull(!full)} onLeave={onClose} dedicate={dedicate} onDedicate={setDedicate} header={
          <div className={cn("h-12 shrink-0 items-center gap-3 relative z-20 px-4 text-white [text-shadow:0_1px_2px_rgba(80,40,0,0.5)]", full ? "hidden" : "hidden sm:flex")}>
        <h2 className="min-w-0 truncate text-sm font-bold">{t("bottle.title")}</h2>
        <button onClick={() => setDedicate(!dedicate)} aria-pressed={dedicate} aria-label={t("bottle.dedicate")} title={t("bottle.dedicate")} className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white", dedicate ? "bg-[#8CC63F]" : "bg-[#E3893A]/90 hover:bg-[#EE9545]")}><Plus size={17} strokeWidth={3} /></button>
        <span className="flex-1" />
        <button onClick={() => setFull(!full)} className="hidden items-center gap-1 text-xs font-bold text-white hover:underline sm:flex">{t(full ? "bottle.window" : "bottle.fullscreen")}{full ? <Minimize2 size={13} /> : <ArrowUpRight size={14} />}</button>
        <button onClick={onClose} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5484D]/90 text-white hover:bg-[#E5484D]"><X size={18} strokeWidth={3} /></button>
      </div>
          } />
        </div>
        {loading ? (
          <div role="status" aria-label={t("bottle.loading")} className="absolute inset-0 z-[80] flex items-center justify-center bg-[#73A148]" style={{ backgroundImage: `radial-gradient(ellipse 75% 55% at 50% 50%, rgba(140,190,90,0.9), rgba(115,161,72,0) 70%), ${pattern}` }}>
            {ownSplash ? <img src="/games/loading.png" alt="" onError={() => setOwnSplash(false)} className="absolute inset-0 z-10 h-full w-full object-cover" /> : null}
            <p aria-hidden="true" className="-rotate-[3deg] select-none text-center leading-[0.8] [font-family:'Lilita_One',system-ui,sans-serif] [filter:drop-shadow(0_6px_8px_rgba(40,60,10,0.35))]">
              <span className="block">{["S", "p", "i", "N"].map((char, n) => <Letter key={n} char={char} size="clamp(78px,27vw,140px)" lift={[0, 8, -6, 4][n]} turn={[-4, 3, -2, 5][n]} />)}</span>
              <span className="mt-1 block">{["t", "h", "e"].map((char, n) => <Letter key={n} char={char} size="clamp(34px,11vw,58px)" lift={[4, -2, 6][n]} turn={[-6, 4, -3][n]} />)}<span className="inline-block w-3" />{["B", "o", "t", "t", "l", "e"].map((char, n) => <Letter key={n} char={char} size={n ? "clamp(42px,14vw,72px)" : "clamp(52px,17vw,88px)"} lift={[0, 5, -4, 3, -5, 4][n]} turn={[-4, 5, -3, 4, -5, 3][n]} />)}</span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
