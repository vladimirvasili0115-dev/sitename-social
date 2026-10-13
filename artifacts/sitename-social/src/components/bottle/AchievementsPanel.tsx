"use client";
import { useMemo, useState } from "react";
import { Check, Lock, X } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { achievements, type Achievement } from "./achievements";

const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];
const giftSrc = (emoji: string) => `/gifts/${Array.from(emoji).map((char) => char.codePointAt(0)!.toString(16)).filter((hex) => hex !== "fe0f").join("-")}.webp`;
// Medal metal by stars: bronze, silver, gold.
const metals = {
  1: { ring: "linear-gradient(145deg,#F3C08F,#B86B2E 45%,#7A3F12 75%,#D99A62)", disc: "radial-gradient(circle at 35% 30%,#FFE8D1,#E9B48A 55%,#B9774A)" },
  2: { ring: "linear-gradient(145deg,#FFFFFF,#BFC6CF 40%,#7B8592 75%,#DCE1E7)", disc: "radial-gradient(circle at 35% 30%,#FFFFFF,#DDE3EA 55%,#A9B3BF)" },
  3: { ring: "linear-gradient(145deg,#FFF3B0,#F2B705 40%,#A86A00 75%,#FFD84A)", disc: "radial-gradient(circle at 35% 30%,#FFFBE6,#FFE07A 55%,#E3A410)" },
} as const;

function Stars({ count, done, size }: { count: number; done: boolean; size: number }) {
  return (
    <span aria-hidden="true" className="flex items-end justify-center gap-[1px]">
      {[0, 1, 2].map((n) => (
        <svg key={n} viewBox="0 0 20 20" style={{ width: size, height: size, transform: `translateY(${n === 1 ? -3 : 0}px)` }}>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" fill={n < count ? (done ? "#FFC21A" : "#C9CED6") : "#ECEEF1"} stroke={n < count && done ? "#D88A00" : "#D5D9DF"} strokeWidth="1" />
        </svg>
      ))}
    </span>
  );
}

function Medal({ item, done, size }: { item: Achievement; done: boolean; size: number }) {
  const metal = metals[item.stars];
  return (
    <span className={cn("relative block shrink-0 rounded-full p-[7%] shadow-[0_3px_6px_rgba(0,0,0,0.25)]", done ? "" : "grayscale")} style={{ width: size, height: size, background: metal.ring }}>
      <span className="absolute inset-[4%] rounded-full border-2 border-dashed border-white/50" />
      <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full shadow-[inset_0_2px_6px_rgba(0,0,0,0.35)]" style={{ background: metal.disc }}>
        <img src={giftSrc(item.icon)} alt="" draggable={false} className={cn("h-[66%] w-[66%] object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]", !done && "opacity-60")} />
        {done ? <span className="pointer-events-none absolute inset-0 animate-[medal-shine_3.5s_ease-in-out_infinite] bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.65)_50%,transparent_65%)] bg-[length:250%_100%]" /> : null}
      </span>
    </span>
  );
}

export function AchievementsPanel({ values }: { values: (metric: string) => number }) {
  const { t } = useTranslation();
  const [show, setShow] = useState<"all" | "done" | "locked">("all");
  const [open, setOpen] = useState<Achievement | null>(null);
  const state = useMemo(() => achievements.map((item) => ({ item, have: values(item.metric) })), [values]);
  const doneCount = state.filter(({ item, have }) => have >= item.need).length;
  const list = state.filter(({ item, have }) => (show === "all" ? true : show === "done" ? have >= item.need : have < item.need));
  const title = (item: Achievement) => (item.series === "gift" ? `${t("bottle.achT_gift")} ${roman[item.level]}` : `${t(`bottle.achT_${item.series}` as TranslationKey)}${item.levels > 1 ? ` ${roman[item.level]}` : ""}`);
  const condition = (item: Achievement) => {
    const [before, after = ""] = t(`bottle.achC_${item.series}` as TranslationKey).replace("{n}", item.need.toLocaleString("ru-RU")).split("{g}");
    return <>{before}{item.gift ? <img src={giftSrc(item.gift)} alt="" className="mx-0.5 inline h-5 w-5 align-[-4px]" /> : null}{after}</>;
  };

  return (
    <div className="relative -mx-3 -mb-3 text-[#1F2937]">
      <p className="mb-2 flex items-center justify-center gap-1.5 text-sm font-bold text-[#9CA3AF]">{t("bottle.achTitle")}<span className="flex items-center gap-0.5 text-[#E7A400]">★<span className="tabular-nums">{doneCount}/{achievements.length}</span></span></p>
      <div className="mx-3 mb-2 h-2 overflow-hidden rounded-full bg-[#EEF0F3]"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#FFD84A,#F59E0B)] transition-[width] duration-700" style={{ width: `${(doneCount / achievements.length) * 100}%` }} /></div>
      <div className="mb-2 flex items-center justify-center gap-2 text-xs">
        <span className="text-[#4B5563]">{t("bottle.achShow")}:</span>
        <div role="tablist" className="flex rounded-full bg-[#EEF0F3] p-0.5">
          {(["all", "done", "locked"] as const).map((key) => <button key={key} role="tab" aria-selected={show === key} onClick={() => setShow(key)} className={cn("h-7 rounded-full px-3 font-semibold transition-colors", show === key ? "bg-white text-[#111827] shadow" : "text-[#4B5563] hover:text-[#111827]")}>{t(`bottle.ach_${key}` as TranslationKey)}</button>)}
        </div>
      </div>
      <ul className="grid h-[calc(100cqh-180px)] max-h-[560px] min-h-[260px] grid-cols-4 content-start gap-x-1 gap-y-3 overflow-y-auto px-3 pb-3 pt-1 [scrollbar-color:#C7CCD3_transparent] [scrollbar-width:thin]">
        {list.map(({ item, have }) => {
          const done = have >= item.need;
          return (
            <li key={item.id}>
              <button onClick={() => setOpen(item)} title={title(item)} className="group flex w-full flex-col items-center gap-0.5 rounded-xl py-1 transition-transform hover:-translate-y-0.5">
                <Stars count={item.stars} done={done} size={13} />
                <span className="transition-transform group-hover:scale-105"><Medal item={item} done={done} size={66} /></span>
                {done ? null : <span className="mt-0.5 h-1 w-12 overflow-hidden rounded-full bg-[#E5E7EB]"><span className="block h-full rounded-full bg-[#9CA3AF]" style={{ width: `${Math.min(100, (have / item.need) * 100)}%` }} /></span>}
              </button>
            </li>
          );
        })}
        {list.length === 0 ? <li className="col-span-4 py-8 text-center text-sm text-[#6B7280]">{t("bottle.achNone")}</li> : null}
      </ul>
      {open ? (() => {
        const have = values(open.metric);
        const done = have >= open.need;
        return (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/30 p-3" onClick={() => setOpen(null)}>
            <div role="dialog" aria-label={title(open)} onClick={(event) => event.stopPropagation()} className="relative w-full max-w-[340px] animate-[bottle-pop_0.25s_ease-out] rounded-2xl bg-white p-4 text-center shadow-2xl">
              <button onClick={() => setOpen(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8CC63F] bg-white text-[#8CC63F] shadow"><X size={18} strokeWidth={3} /></button>
              <p className="text-xs font-bold text-[#C4C9D0]">{t(done ? "bottle.achGot" : "bottle.achHow")}</p>
              <div className="mt-3 flex flex-col items-center gap-1">
                <Stars count={open.stars} done={done} size={22} />
                <Medal item={open} done={done} size={110} />
              </div>
              <p className="mt-2 text-base font-black">{title(open)}</p>
              <div className={cn("mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm", done ? "bg-[#ECFCCB] text-[#3F6212]" : "bg-[#F3F4F6] text-[#1F2937]")}>
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", done ? "bg-[#65A30D] text-white" : "bg-[#D1D5DB] text-white")}>{done ? <Check size={15} strokeWidth={3} /> : <Lock size={12} strokeWidth={3} />}</span>
                <span className="min-w-0 flex-1">{condition(open)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#6B7280]">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]"><span className={cn("block h-full rounded-full", done ? "bg-[#65A30D]" : "bg-[linear-gradient(90deg,#FFD84A,#F59E0B)]")} style={{ width: `${Math.min(100, (have / open.need) * 100)}%` }} /></span>
                <span className="shrink-0 font-bold tabular-nums">{Math.min(have, open.need).toLocaleString("ru-RU")} / {open.need.toLocaleString("ru-RU")}</span>
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}
