"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, Lock, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { FrameArt } from "./FrameArt";
import { emojiSrc } from "./ShopPanels";

export type PassData = {
  season: string; xp: number; per: number; levels: number; premium: boolean; price: number; free: number; prem: number; ends: number; chest: number;
  prev: { season: string; premium: boolean; claimed: boolean; chest: number } | null;
};
// Same numbers as the server (bottle_pass_prize).
export const passPrize = (level: number, premium: boolean) => (premium ? (level === 35 ? 150 : level % 5 === 0 ? 75 : 15) : level % 5 === 0 ? 25 : 5);
const has = (mask: number, level: number) => Math.floor(mask / 2 ** (level - 1)) % 2 === 1;
const Pic = ({ e, className }: { e: string; className?: string }) => <img src={emojiSrc(e)} alt="" draggable={false} className={cn("object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]", className)} />;

function Reward({ level, premium, state, onClaim }: { level: number; premium: boolean; state: "locked" | "ready" | "done" | "closed"; onClaim: () => void }) {
  const big = level % 5 === 0;
  return (
    <button disabled={state !== "ready"} onClick={onClaim} title={`+${passPrize(level, premium)}`} className={cn("relative flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border-2 transition-transform",
      state === "ready" ? "animate-[pass-glow_1.4s_ease-in-out_infinite] border-[#F5B400] bg-[radial-gradient(circle_at_50%_35%,#FFF7D6,#FFE08A)] hover:scale-105" : state === "done" ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E5E7EB] bg-[#F9FAFB]",
      (state === "locked" || state === "closed") && "grayscale-[0.6] opacity-80")}>
      {premium && level === 35 ? <FrameArt id={25} className="h-11 w-11" /> : <span className="relative flex items-center justify-center"><Heart size={big ? 34 : 28} fill="#F2343F" stroke="#FFFFFF" strokeWidth={1.5} /><span className="absolute text-[10px] font-black text-white">+{passPrize(level, premium)}</span></span>}
      {premium && level === 35 ? <span className="text-[9px] font-black text-[#7C3AED]">+150</span> : null}
      {state === "done" ? <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E] text-white shadow"><Check size={12} strokeWidth={3.5} /></span> : null}
      {state === "closed" ? <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#9CA3AF] text-white shadow"><Lock size={11} strokeWidth={3} /></span> : null}
    </button>
  );
}

export function PassPanel({ data, hearts, now, onBuy, onClaim, onChest }: { data: PassData | null; hearts: number; now: number; onBuy: () => void; onClaim: (level: number, premium: boolean) => void; onChest: () => void }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"offer" | "track">("track");
  const list = useRef<HTMLUListElement>(null);
  const level = data ? Math.min(data.levels, Math.floor(data.xp / data.per)) : 0;
  useEffect(() => {
    if (tab !== "track") return;
    const box = list.current;
    const row = box?.querySelector<HTMLElement>(`[data-level="${Math.max(1, level)}"]`);
    if (box && row) box.scrollTop = row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2;
  }, [tab, level, data?.season]);
  if (!data) return <p className="py-10 text-center text-sm text-[#6B7280]">{t("bottle.liveOnly")}</p>;
  const days = Math.max(0, Math.ceil((data.ends - now) / 86400000));
  const inLevel = level >= data.levels ? data.per : data.xp - level * data.per;
  const perks: [string, string][] = [["✨", t("bottle.passPerk1")], ["💞", t("bottle.passPerk2")], ["🎁", t("bottle.passPerk3")], ["👑", t("bottle.passPerk4")]];
  return (
    <div className="-mx-3 -mb-3 text-[#1F2937]">
      <div role="tablist" className="mx-3 mb-2 grid grid-cols-2 gap-1 rounded-xl bg-black/10 p-1">
        {(["offer", "track"] as const).map((key) => <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={cn("flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-bold", tab === key ? key === "offer" ? "bg-[linear-gradient(180deg,#FFC94A,#F59E0B)] text-[#3A2400] shadow" : "bg-white text-[#1C7FE6] shadow" : "text-white/90")}>{key === "offer" ? <><Sparkles size={15} />{t("bottle.passPremium")}</> : <>🏁 {t("bottle.passSeason")}</>}</button>)}
      </div>
      {tab === "offer" ? (
        <div className="bg-white px-4 pb-4 pt-3">
          <p className="rounded-xl bg-[linear-gradient(90deg,#FFB21E,#FF8A00)] px-3 py-2 text-center text-sm font-bold text-white shadow">{t("bottle.passOffer")}</p>
          <p className="mx-auto -mt-1 w-fit rounded-b-lg bg-[#7C3AED] px-3 py-1 text-xs font-bold text-white">{t("bottle.passWorth")} <Heart size={11} fill="#FFFFFF" stroke="none" className="inline align-[-1px]" />2000!</p>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#FFF7E6] p-2.5">
            <span className="relative block h-16 w-16 shrink-0 p-[9%]"><span className="block h-full w-full rounded-md bg-[linear-gradient(135deg,#3B2A00,#7A5A10)]" /><FrameArt id={25} className="absolute inset-0 h-full w-full" /></span>
            <p className="text-sm leading-snug"><b>{t("bottle.passNitro")}</b><br /><span className="text-[#6B7280]">{t("bottle.passNitroText")}</span></p>
          </div>
          <ul className="mt-3 space-y-2">{perks.map(([emoji, text]) => <li key={text} className="flex items-center gap-3 text-sm"><Pic e={emoji} className="h-8 w-8 shrink-0" />{text}</li>)}</ul>
          {data.premium
            ? <p className="mt-4 rounded-xl bg-[#DCFCE7] py-3 text-center text-sm font-bold text-[#166534]">✓ {t("bottle.passHave")}</p>
            : <button onClick={onBuy} disabled={hearts < data.price} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,#FFC94A,#F59E0B)] text-base font-black text-[#3A2400] shadow hover:brightness-105 disabled:opacity-60">{t("bottle.passBuy")} · <Heart size={16} fill="#E8352B" stroke="none" />{data.price}</button>}
          {!data.premium && hearts < data.price ? <p className="mt-1.5 text-center text-xs text-[#B45309]">{t("bottle.noHearts")}</p> : null}
        </div>
      ) : (
        <div className="bg-white pb-3">
          <div className="border-b border-[#E5E7EB] px-4 py-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]"><span>{t("bottle.passLevel")} <b className="text-base text-[#1C7FE6]">{level}</b>/{data.levels}</span><span>{t("bottle.passEnds")}: {days} {t("bottle.passDays")}</span></div>
            <div className="mt-1.5 flex items-center gap-2"><Pic e="😊" className="h-5 w-5" /><span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E0EEFF]"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#4FA8FF,#1C7FE6)]" style={{ width: `${(inLevel / data.per) * 100}%` }} /></span><span className="text-xs font-bold tabular-nums">{inLevel}/{data.per}</span></div>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#FFF7E6] px-2 py-1.5 text-xs"><Pic e="🧰" className="h-7 w-7 shrink-0" /><span className="min-w-0 flex-1">{t("bottle.passChest")}: <b className="text-[#E8352B]">❤ {data.chest}</b>/100</span>
              {data.prev && data.prev.premium && !data.prev.claimed && data.prev.chest > 0 ? <button onClick={onChest} className="h-7 shrink-0 rounded-md bg-[linear-gradient(180deg,#9BD65A,#6DB33F)] px-2 font-bold text-white">{t("bottle.passChestOpen")} +{data.prev.chest}</button> : null}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 pt-2 text-[11px] font-bold text-[#6B7280]"><span>{t("bottle.passFree")}</span><span className="text-[#D97706]">{t("bottle.passPremium")}{data.premium ? "" : " 🔒"}</span></div>
          <ul ref={list} className="relative h-[min(46vh,360px,42cqmin)] overflow-y-auto px-4 py-2 [scrollbar-width:thin]">
            <span aria-hidden="true" className="absolute bottom-0 left-1/2 top-0 w-1.5 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#D5E6F8,#E8F1FB)]" />
            {Array.from({ length: data.levels }, (_, n) => data.levels - n).map((n) => {
              const reached = level >= n;
              const freeState = has(data.free, n) ? "done" : reached ? "ready" : "locked";
              const premState = has(data.prem, n) ? "done" : !data.premium ? "closed" : reached ? "ready" : "locked";
              return (
                <li key={n} data-level={n} className="relative flex items-center justify-between py-1.5">
                  <Reward level={n} premium={false} state={freeState} onClaim={() => onClaim(n, false)} />
                  <span className={cn("relative z-[1] flex h-9 w-9 rotate-45 items-center justify-center rounded-lg border-2 text-sm font-black shadow-sm", reached ? "border-[#1C7FE6] bg-[#4FA8FF] text-white" : "border-[#D5DBE3] bg-white text-[#9CA3AF]")}><span className="-rotate-45">{n}</span></span>
                  <Reward level={n} premium state={premState} onClaim={() => (data.premium ? onClaim(n, true) : setTab("offer"))} />
                </li>
              );
            })}
          </ul>
          <p className="px-4 pt-1 text-center text-[10px] leading-snug text-[#9CA3AF]">{t("bottle.passHow")}</p>
        </div>
      )}
    </div>
  );
}
