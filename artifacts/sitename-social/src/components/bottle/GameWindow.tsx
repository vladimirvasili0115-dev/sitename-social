"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Minimize2, Plus, X } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { BottleGame } from "./BottleGame";

// Small repeating doodles (hearts, notes, gifts) for the loading screen.
const pattern = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" fill="#FFFFFF" fill-opacity="0.11"><path d="M28 40c-9-6-13-10-13-15 0-4 3-7 7-7 3 0 5 2 6 4 1-2 3-4 6-4 4 0 7 3 7 7 0 5-4 9-13 15z"/><path d="M104 18h5v20a6 6 0 1 1-4-5.6V24l14-3v14a6 6 0 1 1-4-5.6V20z"/><rect x="20" y="104" width="30" height="24" rx="4"/><rect x="16" y="98" width="38" height="9" rx="3"/><path d="M33 98c-10-12-18 0 0 0 18 0 10-12 0 0z"/><path d="M118 132l7-20 10 12 10-12 7 20z"/><path d="M148 62c-5 0-9 3-11 6-2-3-6-6-11-6-6 0-9 4-9 8 0 6 9 12 20 12s20-6 20-12c0-4-3-8-9-8z" transform="translate(-6 0)"/><path d="M80 74h6v8c0 3 4 5 4 10v22c0 3-2 5-5 5h-4c-3 0-5-2-5-5V92c0-5 4-7 4-10z" transform="rotate(-30 83 96)"/><circle cx="160" cy="160" r="6"/><circle cx="70" cy="150" r="4"/><circle cx="160" cy="20" r="3.5"/></svg>')}")`;

// The game opens in a phone-sized window over the site, like an app; "Tam ekran" stretches it over the whole screen.
export function GameWindow({ onClose, startFull = false }: { onClose: () => void; startFull?: boolean }) {
  const { t } = useTranslation();
  const [full, setFull] = useState(startFull);
  const [loading, setLoading] = useState(true);
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
      <div role="dialog" aria-modal="true" aria-label={t("bottle.title")} className={cn("relative flex flex-col overflow-hidden bg-[#12141B] shadow-2xl", full ? "h-full w-full" : "h-full w-full sm:h-[min(860px,calc(100dvh-40px))] sm:w-[430px] sm:rounded-[26px]")}>
        <div className={cn("h-12 shrink-0 items-center gap-3 px-4 text-white", full ? "hidden" : "flex")}>
          <h2 className="min-w-0 truncate text-sm font-bold">{t("bottle.title")}</h2>
          <button onClick={() => setDedicate(!dedicate)} aria-pressed={dedicate} aria-label={t("bottle.dedicate")} title={t("bottle.dedicate")} className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white", dedicate ? "bg-[#8CC63F]" : "bg-white/15 hover:bg-white/25")}><Plus size={17} strokeWidth={3} /></button>
          <span className="flex-1" />
          <button onClick={() => setFull(!full)} className="hidden items-center gap-1 text-xs font-semibold text-[#6FB1FF] hover:underline sm:flex">{t(full ? "bottle.window" : "bottle.fullscreen")}{full ? <Minimize2 size={13} /> : <ArrowUpRight size={14} />}</button>
          <button onClick={onClose} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </div>
        <div className="relative min-h-0 flex-1">
          <BottleGame wide={full && desktop} full={full} onToggleFull={() => setFull(!full)} onLeave={onClose} dedicate={dedicate} onDedicate={setDedicate} />
        </div>
        {loading ? (
          <div role="status" aria-label={t("bottle.loading")} className="absolute inset-0 z-[80] flex items-center justify-center bg-[#79A84C]" style={{ backgroundImage: `radial-gradient(ellipse at 50% 48%, rgba(150,196,96,0.95), rgba(120,168,76,0) 62%), ${pattern}` }}>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&display=swap" />
            <p className="-rotate-[4deg] text-center leading-[0.82] [font-family:'Lilita_One',system-ui,sans-serif]">
              <span className="block bg-[linear-gradient(180deg,#FFD84A_10%,#FFAE1F_55%,#F38A12)] bg-clip-text text-[clamp(84px,30vw,150px)] tracking-wide text-transparent [filter:drop-shadow(0_4px_0_#D9700A)_drop-shadow(0_10px_14px_rgba(60,40,0,0.3))]">SPIN</span>
              <span className="mt-1 block bg-[linear-gradient(180deg,#FFD84A_10%,#FFAE1F_55%,#F38A12)] bg-clip-text text-[clamp(40px,14vw,72px)] text-transparent [filter:drop-shadow(0_3px_0_#D9700A)_drop-shadow(0_8px_12px_rgba(60,40,0,0.3))]"><span className="text-[0.8em]">the</span> Bottle</span>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
