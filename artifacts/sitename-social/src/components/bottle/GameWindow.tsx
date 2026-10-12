"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Minimize2, Plus, X } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { BottleGame } from "./BottleGame";
import { BottleSvg } from "./BottleArt";

// Small repeating doodles (hearts, notes, gifts) for the loading screen.
const pattern = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M30 34c-7-5-10-8-10-12 0-3 2-5 5-5 2 0 4 1 5 3 1-2 3-3 5-3 3 0 5 2 5 5 0 4-3 7-10 12z"/><path d="M98 22v22m0-22l14-4v20"/><circle cx="93" cy="44" r="5"/><circle cx="107" cy="38" r="5"/><rect x="24" y="96" width="26" height="22" rx="3"/><path d="M24 104h26M37 96v22M37 96c-8-10-14 0 0 0 14 0 8-10 0 0"/><path d="M96 122l6-16 8 10 8-10 6 16z"/><circle cx="72" cy="72" r="4"/><circle cx="128" cy="78" r="3"/></svg>')}")`;

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
      <div role="dialog" aria-modal="true" aria-label={t("bottle.title")} className={cn("flex flex-col overflow-hidden bg-[#12141B] shadow-2xl", full ? "h-full w-full" : "h-full w-full sm:h-[min(860px,calc(100dvh-40px))] sm:w-[430px] sm:rounded-[26px]")}>
        <div className={cn("h-12 shrink-0 items-center gap-3 px-4 text-white", full ? "hidden" : "flex")}>
          <h2 className="min-w-0 truncate text-sm font-bold">{t("bottle.title")}</h2>
          <button onClick={() => setDedicate(!dedicate)} aria-pressed={dedicate} aria-label={t("bottle.dedicate")} title={t("bottle.dedicate")} className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white", dedicate ? "bg-[#8CC63F]" : "bg-white/15 hover:bg-white/25")}><Plus size={17} strokeWidth={3} /></button>
          <span className="flex-1" />
          <button onClick={() => setFull(!full)} className="hidden items-center gap-1 text-xs font-semibold text-[#6FB1FF] hover:underline sm:flex">{t(full ? "bottle.window" : "bottle.fullscreen")}{full ? <Minimize2 size={13} /> : <ArrowUpRight size={14} />}</button>
          <button onClick={onClose} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </div>
        <div className="relative min-h-0 flex-1">
          <BottleGame wide={full && desktop} full={full} onToggleFull={() => setFull(!full)} onLeave={onClose} dedicate={dedicate} onDedicate={setDedicate} />
          {loading ? (
            <div role="status" aria-label={t("bottle.loading")} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#7FA650]" style={{ backgroundImage: `radial-gradient(ellipse at 50% 45%, rgba(170,205,105,0.9), rgba(105,150,70,0.2) 70%), ${pattern}` }}>
              <BottleSvg className="h-28 -rotate-[24deg] drop-shadow-[0_8px_10px_rgba(0,0,0,0.3)]" />
              <p className="mt-3 -rotate-3 text-center text-[52px] font-black leading-[0.95] tracking-tight text-[#FFB21E] [text-shadow:0_3px_0_#C96A00,0_7px_12px_rgba(0,0,0,0.3)]">{t("bottle.title")}</p>
              <span className="mt-6 h-1.5 w-28 overflow-hidden rounded-full bg-white/25"><span className="block h-full w-1/2 animate-pulse rounded-full bg-white" /></span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
