"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, Lock, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { OrigButton, OrigPopup } from "./OrigPopup";
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
  const [help, setHelp] = useState(false);
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
  const O = "/custom/orig/";
  const bg = (name: string) => ({ backgroundImage: `url(${O}${name}.svg)` });
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[17px] text-[#1F2937]">
      {/* The original season pass header (bottle-html5 BottlePassDialog + bottle-pass CSS). */}
      <div className="relative flex shrink-0 flex-col items-center rounded-t-[17px] bg-[#4EB0FF] text-white">
        <button onClick={() => setHelp(true)} aria-label={t("bottle.passRules")} title={t("bottle.passRules")} className="absolute left-0 top-0 h-[34px] w-[38px]"><span aria-hidden="true" className="absolute left-3.5 top-2.5 h-[15px] w-[11px] bg-contain bg-no-repeat" style={bg("league_manual_icon_up_down")} /></button>
        <p className="mb-[15px] mt-2.5 text-[14px] font-bold">{t("bottle.passTitle")}</p>
        <div className="mb-2.5 flex px-[15px]">
          <button onClick={() => setTab(tab === "offer" ? "track" : "offer")} className="mr-[15px] flex h-9 w-[122px] items-center rounded-md bg-[linear-gradient(rgb(253,200,0)_-1%,rgb(253,165,0)_101%)] text-[10px] transition-shadow active:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]">
            <span className="relative flex h-9 w-[42px] shrink-0 items-center bg-[length:42px_36px] bg-no-repeat" style={bg("bottle_pass_premium_bg")}><span className="ml-[5px] h-6 w-6 bg-contain bg-no-repeat" style={bg("bottle_pass_premium_icon")} />{data.premium ? <span className="absolute bottom-1.5 right-3 h-3 w-3 bg-contain bg-no-repeat" style={bg("bottle_pass_premium_purchased_icon")} /> : null}</span>
            <span className="-ml-2 whitespace-pre-wrap text-left font-bold">{t("bottle.passPremiumPass")}</span>
          </button>
          <div className="flex h-9 w-[122px] items-center rounded-md bg-[#0093EA] text-[10px]">
            <span aria-hidden="true" className="mx-[5px] h-6 w-6 shrink-0 bg-contain bg-no-repeat" style={bg(days > 0 ? "bottle_pass_timer_icon" : "bottle_pass_finish_icon")} />
            <span className="flex flex-col text-left"><span>{days > 0 ? t("bottle.passValid") : t("bottle.passFinished")}</span>{days > 0 ? <b>{days} {t("bottle.passDays")}</b> : null}</span>
          </div>
        </div>
        <div className="mb-2.5 flex items-center justify-center">
          <span aria-hidden="true" className="h-[21px] w-[22px] bg-contain bg-no-repeat" style={bg("bottle_pass_star")} />
          <span className="relative mx-[5px] h-4 w-[138px] overflow-hidden rounded-lg bg-white/40"><span className="block h-full bg-[#0070A2]" style={{ width: `${(inLevel / data.per) * 100}%` }} /><span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[12px]"><strong>{inLevel}</strong>/{data.per}</span></span>
          <span className="flex h-[22px] w-[22px] items-center justify-center bg-contain bg-no-repeat text-[11px] font-bold text-[#4EB0FF]" style={bg("bottle_pass_level_bg_white")}>{Math.min(data.levels, level + 1)}</span>
        </div>
        <span className="z-[2] -mb-px h-px w-full bg-black/10" />
      </div>
      {tab === "offer" ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 pb-4 pt-3">
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
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="mx-[15px] mt-2.5 flex items-center gap-2 rounded-xl bg-[#FFF7E6] px-2 py-1.5 text-xs"><span aria-hidden="true" className="h-8 w-9 shrink-0 bg-contain bg-center bg-no-repeat" style={bg("bottle_pass_chest")} /><span className="min-w-0 flex-1"><b>{t("bottle.passChestTitle")}</b>: <b className="text-[rgb(255,62,0)]">❤ {data.chest}</b>/100</span>
            {data.prev && data.prev.premium && !data.prev.claimed && data.prev.chest > 0 ? <button onClick={onChest} className="h-7 shrink-0 rounded-md bg-[#97CA31] px-2 font-bold text-white">{t("bottle.passChestOpen")} +{data.prev.chest}</button> : null}
          </div>
          <ul ref={list} className="relative isolate flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-[15px] pt-1 [scrollbar-width:none]">
            {Array.from({ length: data.levels }, (_, n) => data.levels - n).map((n) => {
              const reached = level >= n;
              const freeDone = has(data.free, n), premDone = has(data.prem, n);
              const freeReady = reached && !freeDone, premReady = reached && data.premium && !premDone;
              const heart = (value: number, size: number) => <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-no-repeat text-[15px] font-bold text-white [background-position:center_calc(50%+1px)] [text-shadow:0_0_5px_rgba(0,0,0,0.3)]" style={{ ...bg("bank_heart"), backgroundSize: "38px 29px", width: size, height: size }}>{value}</span>;
              const collect = <span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[5px] bg-[#A34DC3] px-1 pb-[3px] pt-0.5 text-[10px] font-bold text-white shadow-[0_0_3px_rgba(0,0,0,0.3)]">{t("bottle.passCollect")}</span>;
              return (
                <li key={n} data-level={n} className="relative flex shrink-0 basis-16 items-center px-[11px]">
                  <span aria-hidden="true" className={cn("absolute left-1/2 top-8 -z-10 h-16 w-2 -translate-x-1/2", n === 1 ? "hidden" : reached ? "bg-[#2493ED]" : "bg-[#DBDBDB]")} />
                  <button onClick={() => (premReady ? onClaim(n, true) : !data.premium ? setTab("offer") : undefined)} aria-label={`${t("bottle.passPremRewards")} ${n}`} className="relative flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[10px] bg-contain bg-no-repeat transition-shadow active:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]" style={bg(reached ? "bottle_pass_premium_prize_active_bg" : "bottle_pass_premium_prize_bg")}>
                    {premReady ? <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite] bg-contain bg-no-repeat" style={bg("bottle_pass_premium_prize_light")} /> : null}
                    {n === 35 ? <FrameArt id={25} className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2" /> : heart(passPrize(n, true), 50)}
                    {premDone ? <span className="absolute -bottom-px -right-px h-[17px] w-[17px] bg-contain bg-no-repeat" style={bg("bottle_pass_prize_claimed_icon")} /> : !data.premium ? <span className="absolute -bottom-[3px] -right-[3px] h-[19px] w-5 bg-contain bg-no-repeat" style={bg("league_lock_icon")} /> : null}
                    {premReady ? collect : null}
                  </button>
                  <span className="mx-[5px] w-full border-b-2 border-dotted border-[#CACACA]" />
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center bg-contain bg-no-repeat font-bold text-white" style={bg(reached ? "bottle_pass_level_bg_blue" : "bottle_pass_level_bg_grey")}><span className="mt-0.5 text-[18px]">{n}</span></span>
                  <span className="mx-[5px] w-full border-b-2 border-dotted border-[#CACACA]" />
                  <button onClick={() => (freeReady ? onClaim(n, false) : undefined)} aria-label={`${t("bottle.passFreeRewards")} ${n}`} className="relative m-0.5 flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[5px] bg-[length:54px_54px] bg-no-repeat transition-shadow active:shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]" style={bg(reached ? "bottle_pass_prize_active_bg" : "bottle_pass_prize_bg")}>
                    {freeReady ? <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite] bg-contain bg-no-repeat" style={bg("bottle_pass_prize_light")} /> : null}
                    {heart(passPrize(n, false), 50)}
                    {freeDone ? <span className="absolute -bottom-px -right-px h-[17px] w-[17px] bg-contain bg-no-repeat" style={bg("bottle_pass_prize_claimed_icon")} /> : null}
                    {freeReady ? collect : null}
                  </button>
                </li>
              );
            })}
            <li className="relative mb-[9px] flex shrink-0 basis-[46px] items-center px-[15px] pb-[1.5px]">
              <span aria-hidden="true" className="absolute left-1/2 top-0 h-5 w-2 -translate-x-1/2 bg-[#2493ED]" />
              <button onClick={() => setTab("offer")} className="flex w-20 items-center justify-center whitespace-pre-wrap text-center text-[11px] font-bold text-[rgb(248,193,47)]">{t("bottle.passPremRewards")}</button>
              <span className="z-[1] mx-auto flex h-5 w-14 shrink-0 items-center justify-center bg-contain bg-no-repeat text-[10px] font-bold text-white" style={bg("bottle_pass_level_label_bg")}>{t("bottle.passLevelWord")}</span>
              <span className="flex w-20 items-center justify-center text-center text-[11px] font-bold text-[rgb(177,204,216)]">{t("bottle.passFreeRewards")}</span>
            </li>
          </ul>
          <p className="px-4 pb-2 pt-1 text-center text-[10px] leading-snug text-[#9CA3AF]">{t("bottle.passHow")}</p>
        </div>
      )}
      {help ? (
        <OrigPopup z="z-[70]" title={t("bottle.passRules")} onClose={() => setHelp(false)} buttons={<OrigButton onClick={() => setHelp(false)}>{t("bottle.lockOk")}</OrigButton>}>
          <div className="space-y-3 text-[14px] leading-[18px] text-[#424242]">
            {[["bottle_pass_help_1", "bottle.passHelp1"], ["bottle_pass_help_2", "bottle.passHelp2"], ["bottle_pass_help_3", "bottle.passHelp3"], ["bottle_pass_help_4", "bottle.passHelp4"]].map(([icon, key]) => <div key={key} className="flex items-center gap-3"><span aria-hidden="true" className="h-10 w-10 shrink-0 bg-contain bg-center bg-no-repeat" style={bg(icon)} /><p>{t(key as "bottle.passHelp1")}</p></div>)}
          </div>
        </OrigPopup>
      ) : null}
    </div>
  );
}
