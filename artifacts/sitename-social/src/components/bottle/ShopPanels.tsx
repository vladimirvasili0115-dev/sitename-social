"use client";
import { useMemo, useState } from "react";
import { Check, ChevronRight, Copy, Heart, Lock } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { cartoonAvatar } from "./avatarArt";

// Pictures for the shop are glossy 3D emoji kept in public/gifts.
export const emojiSrc = (emoji: string) => `/gifts/${Array.from(emoji).map((char) => char.codePointAt(0)!.toString(16)).filter((hex) => hex !== "fe0f").join("-")}.webp`;
const Pic = ({ e, className }: { e: string; className?: string }) => <img src={emojiSrc(e)} alt="" draggable={false} className={cn("select-none object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.25)]", className)} />;
const H = ({ size = 13 }: { size?: number }) => <Heart size={size} fill="#F2343F" stroke="none" className="inline shrink-0 align-[-2px]" />;

export const shopPacks: { hearts: number; price: number; bonus?: number; tag?: "best" | "hit"; art: string }[] = [
  { hearts: 6750, price: 5000, bonus: 35, tag: "best", art: "💎" }, { hearts: 1350, price: 1000, bonus: 35, art: "💰" }, { hearts: 650, price: 500, bonus: 30, art: "🪙" },
  { hearts: 240, price: 200, bonus: 20, tag: "hit", art: "🍯" }, { hearts: 110, price: 100, bonus: 10, art: "👝" }, { hearts: 50, price: 50, art: "🎁" }, { hearts: 10, price: 10, art: "💕" },
];
// Active play rewards: minutes of play today → hearts.
export const activeLevels: [number, number][] = [[30, 5], [60, 10], [120, 20]];
export const formatActive = (secs: number, t: (key: TranslationKey) => string) => `${Math.floor(secs / 3600)}${t("bottle.hourShort")} ${Math.floor((secs % 3600) / 60)}${t("bottle.minShort")}`;

export function ShopPanel({ hearts, activeSecs, payNote, onActive, onTelegram, onVip, onInvite, onCompliments, onPack, onPass }: {
  hearts: number; activeSecs: number; payNote: boolean; onActive: () => void; onTelegram: () => void; onVip: () => void; onInvite: () => void; onCompliments: () => void; onPack: () => void; onPass: () => void;
}) {
  const { t } = useTranslation();
  const tile = "relative flex flex-col items-center rounded-2xl bg-white p-2 text-center shadow-[0_2px_6px_rgba(150,30,50,0.15)]";
  const blue = "mt-auto h-8 w-full rounded-lg bg-[linear-gradient(180deg,#4FA8FF,#2B7DE0)] text-[12px] font-bold text-white shadow hover:brightness-110";
  return (
    <div className="max-h-[min(86cqmin,70vh)] space-y-2.5 overflow-y-auto px-0.5 pb-1 pt-1 [scrollbar-width:thin]">
      <p className="flex items-center justify-center gap-1.5 rounded-xl bg-white/90 py-1.5 text-sm font-bold text-[#7F1D1D]">{t("bottle.balance")}: <H size={15} /><span className="tabular-nums">{hearts}</span></p>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-[0_2px_6px_rgba(150,30,50,0.15)]">
        <Pic e="⏰" className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1"><p className="text-sm font-black leading-tight text-[#1F2937]">{t("bottle.activeTitle")}</p><p className="text-xs font-semibold text-[#7C3AED]">{t("bottle.activeToday")}: {formatActive(activeSecs, t)}</p></div>
        <button onClick={onActive} className="flex h-9 shrink-0 items-center rounded-xl bg-[linear-gradient(180deg,#A16BFF,#7C3AED)] px-3 text-xs font-bold text-white shadow hover:brightness-110">{t("bottle.more2")}<ChevronRight size={14} /></button>
      </div>
      <button onClick={onPass} className="flex w-full items-center gap-3 rounded-2xl bg-[linear-gradient(180deg,#FFC94A,#F59E0B)] p-2.5 text-left text-[#3A2400] shadow-[0_2px_6px_rgba(160,90,0,0.3)] hover:brightness-105">
        <Pic e="🎟️" className="h-11 w-11 shrink-0" />
        <span className="min-w-0 flex-1"><span className="block text-sm font-black leading-tight">{t("bottle.passPremium")}</span><span className="block text-[11px] font-semibold">{t("bottle.passShort")}</span></span>
        <ChevronRight size={20} />
      </button>
      <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(180deg,#36A6FF,#1C7FE6)] p-2.5 text-white shadow-[0_2px_6px_rgba(20,80,160,0.3)]">
        <Pic e="🔔" className="h-11 w-11 shrink-0" />
        <p className="min-w-0 flex-1 text-sm font-black leading-tight">{t("bottle.channelJoin")}</p>
        <button onClick={onTelegram} className="h-9 shrink-0 rounded-xl bg-white px-3 text-xs font-bold text-[#1C7FE6] shadow hover:brightness-95">{t("bottle.channelGo")}</button>
      </div>
      <ul className="grid grid-cols-3 gap-2">
        <li className={tile}>
          <span className="text-[13px] font-black leading-none text-[#F5A300]">VIP<span className="block text-[9px] tracking-widest">STATUS</span></span>
          <Pic e="👑" className="my-1.5 h-12 w-12" />
          <button onClick={onVip} className={blue}>{t("bottle.details")}</button>
        </li>
        <li className={tile}>
          <span className="text-[10px] font-semibold leading-tight text-[#374151]">{t("bottle.forFriend")} <b className="whitespace-nowrap text-[#E11D48]"><H size={11} />20</b></span>
          <span className="relative my-1.5 block h-12 w-14"><Pic e="👦" className="absolute left-0 top-1 h-10 w-10" /><Pic e="👧" className="absolute right-0 top-0 h-10 w-10" /></span>
          <button onClick={onInvite} className={blue}>{t("bottle.details")}</button>
        </li>
        <li className={tile}>
          <span className="text-[10px] font-semibold leading-tight text-[#374151]">{t("bottle.forCompliments")} <b className="whitespace-nowrap text-[#E11D48]"><H size={11} />10</b></span>
          <Pic e="💌" className="my-1.5 h-12 w-12" />
          <button onClick={onCompliments} className={blue}>{t("bottle.details")}</button>
        </li>
        {shopPacks.map((pack) => (
          <li key={pack.hearts} className={cn(tile, "pt-3")}>
            {pack.tag ? <span className={cn("absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-px text-[9px] font-bold text-white shadow", pack.tag === "best" ? "bg-[#E11D8F]" : "bg-[#7C3AED]")}>{t(pack.tag === "best" ? "bottle.packBest" : "bottle.packHit")}</span> : null}
            <span className="flex items-center gap-0.5 text-[15px] font-black tabular-nums leading-tight text-[#E8352B]"><H size={14} />{pack.hearts.toLocaleString("ru-RU")}</span>
            <span className="h-3 text-[9px] font-black leading-3 text-[#F59E0B]">{pack.bonus ? `${pack.bonus}% BONUS` : ""}</span>
            <Pic e={pack.art} className="my-1 h-12 w-12" />
            <button onClick={onPack} className="mt-auto h-8 w-full rounded-lg bg-[linear-gradient(180deg,#9BD65A,#6DB33F)] text-[12px] font-bold tabular-nums text-white shadow hover:brightness-110">{pack.price.toLocaleString("ru-RU")} {t("bottle.currency")}</button>
          </li>
        ))}
      </ul>
      {payNote ? <p role="status" className="rounded-xl bg-white/90 p-2 text-center text-xs font-semibold text-[#7F1D1D]">{t("bottle.paySoon")}</p> : null}
    </div>
  );
}

export function ActivePanel({ secs, claimed, live, onClaim }: { secs: number; claimed: number; live: boolean; onClaim: (level: number) => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-[#1F2937]">
      <div className="flex flex-col items-center"><Pic e="⏰" className="h-16 w-16" /><p className="mt-1 text-sm text-[#6B7280]">{t("bottle.activeToday")}</p><p className="text-2xl font-black tabular-nums text-[#7C3AED]">{formatActive(secs, t)}</p></div>
      <div className="my-3 h-2.5 overflow-hidden rounded-full bg-[#EDE9FE]"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#A16BFF,#7C3AED)]" style={{ width: `${Math.min(100, (secs / 7200) * 100)}%` }} /></div>
      <ul className="space-y-2">
        {activeLevels.map(([minutes, prize], n) => {
          const got = (claimed & (1 << n)) !== 0;
          const ready = secs >= minutes * 60;
          return (
            <li key={minutes} className={cn("flex items-center gap-3 rounded-xl border p-2.5", got ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E5E7EB] bg-white")}>
              <span className="w-16 shrink-0 text-sm font-bold">{minutes >= 60 ? `${minutes / 60} ${t("bottle.hourLong")}` : `${minutes} ${t("bottle.minLong")}`}</span>
              <span className="flex flex-1 items-center gap-1 text-base font-black text-[#E8352B]"><H size={16} />{prize}</span>
              {got ? <span className="flex items-center gap-1 text-xs font-bold text-[#16A34A]"><Check size={15} strokeWidth={3} />{t("bottle.claimed")}</span>
                : <button disabled={!ready || !live} onClick={() => onClaim(n + 1)} className="flex h-8 items-center gap-1 rounded-lg bg-[linear-gradient(180deg,#9BD65A,#6DB33F)] px-3 text-xs font-bold text-white shadow disabled:bg-none disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:shadow-none">{ready ? t("bottle.claim") : <><Lock size={12} />{formatActive(minutes * 60 - secs, t)}</>}</button>}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-center text-[11px] text-[#6B7280]">{t(live ? "bottle.activeHint" : "bottle.liveOnly")}</p>
    </div>
  );
}

export function InvitePanel({ link, invited, done }: { link: string | null; invited: number; done: number }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = () => { if (link) void navigator.clipboard?.writeText(link).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2500); }); };
  return (
    <div className="text-center text-[#1F2937]">
      <div className="flex justify-center gap-5">
        {[false, true].map((female) => (
          <span key={String(female)} className="flex flex-col items-center">
            <img src={cartoonAvatar(female ? 4 : 7, female)} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-[#8CC63F]" />
            <span className="-mt-3 flex items-center gap-0.5 rounded-full bg-[#8CC63F] px-2 py-0.5 text-sm font-black text-white shadow">+<H size={13} />20</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm leading-snug">{t("bottle.inviteText1")} <b className="whitespace-nowrap text-[#E11D48]"><H />20</b> {t("bottle.inviteText2")}</p>
      <p className="mt-2 rounded-lg bg-[#FEF9C3] px-2 py-1.5 text-xs font-semibold text-[#713F12]">{t("bottle.inviteStats")}: <b>{invited}</b> · {t("bottle.inviteDone")}: <b>{done}</b></p>
      {link ? <p className="mt-2 truncate rounded-lg bg-[#F3F4F6] px-2 py-1.5 font-mono text-[11px] text-[#4B5563]">{link}</p> : <p className="mt-2 text-xs text-[#6B7280]">{t("bottle.liveOnly")}</p>}
      <button onClick={copy} disabled={!link} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[linear-gradient(180deg,#9BD65A,#6DB33F)] px-6 text-sm font-bold text-white shadow hover:brightness-105 disabled:opacity-50">{copied ? <><Check size={16} />{t("bottle.copied")}</> : <><Copy size={15} />{t("bottle.inviteBtn")}</>}</button>
    </div>
  );
}

// Compliments: 12 kinds, each with a picture and a colour (a few are playful teasing).
export const complimentKinds: { emoji: string; tone: string }[] = [
  { emoji: "😊", tone: "#FDE68A" }, { emoji: "👀", tone: "#FDE68A" }, { emoji: "✋", tone: "#E9D5FF" }, { emoji: "👍", tone: "#A7F3D0" }, { emoji: "😴", tone: "#F5DEB3" }, { emoji: "💪", tone: "#A7F3D0" },
  { emoji: "🎨", tone: "#E9D5FF" }, { emoji: "😂", tone: "#FDE68A" }, { emoji: "💼", tone: "#FBCFE8" }, { emoji: "🗣️", tone: "#FCA5A5" }, { emoji: "🐱", tone: "#FCA5A5" }, { emoji: "✨", tone: "#FBCFE8" },
];
export const ComplimentPill = ({ kind, onClick, big }: { kind: number; onClick?: () => void; big?: boolean }) => {
  const { t } = useTranslation();
  const item = complimentKinds[kind - 1];
  if (!item) return null;
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={cn("flex w-full items-center gap-2 rounded-xl border-b-[3px] border-black/10 px-2.5 text-left font-bold text-[#3F3F46] shadow-sm transition-transform enabled:hover:-translate-y-0.5", big ? "h-12 justify-center text-base" : "h-11 text-[13px]")} style={{ background: item.tone }}>
      <Pic e={item.emoji} className="h-6 w-6 shrink-0" /><span className="min-w-0 truncate">{t(`bottle.cmp${kind}` as TranslationKey)}</span>
    </button>
  );
};

export function ComplimentsPanel({ people, left, onSend }: { people: { id: string; name: string; avatar: string }[]; left: number; onSend: (to: string, kind: number) => Promise<string | null> }) {
  const { t } = useTranslation();
  const [turn, setTurn] = useState(0);
  const [skip, setSkip] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pool = people.filter((person) => !skip.includes(person.id));
  const person = pool.length ? pool[turn % pool.length] : null;
  const options = useMemo(() => {
    const all = complimentKinds.map((_, n) => n + 1);
    for (let n = all.length - 1; n > 0; n--) { const m = Math.floor(Math.random() * (n + 1)); [all[n], all[m]] = [all[m], all[n]]; }
    return all.slice(0, 6);
  }, [turn, person?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function send(kind: number) {
    if (!person || busy) return;
    setBusy(true);
    const result = await onSend(person.id, kind);
    setBusy(false);
    if (result === "again") { setNote(t("bottle.cmpAgain")); setSkip((list) => [...list, person.id]); return; }
    if (result === "bad") return setNote(t("bottle.cmpFail"));
    setNote(result === "bonus" ? t("bottle.cmpBonus") : null);
    setSkip((list) => [...list, person.id]);
    setTurn((n) => n + 1);
  }
  return (
    <div className="text-[#1F2937]">
      <p className="mb-3 rounded-xl bg-[#FEF3C7] px-3 py-2 text-center text-sm font-bold leading-snug"><H size={14} />10 {t("bottle.cmpLeft1")} {left} {t("bottle.cmpLeft2")}</p>
      {person ? (
        <>
          <div className="flex items-center gap-3 rounded-xl bg-[#F3F4F6] p-2.5">
            <img src={person.avatar} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover shadow" />
            <div className="min-w-0"><p className="truncate text-xs font-semibold text-[#6B7280]">{person.name}</p><p className="text-[15px] font-semibold leading-snug">{t("bottle.cmpAsk")}</p></div>
          </div>
          <div className={cn("mt-3 grid grid-cols-2 gap-2", busy && "pointer-events-none opacity-60")}>{options.map((kind) => <ComplimentPill key={kind} kind={kind} onClick={() => void send(kind)} />)}</div>
        </>
      ) : <p className="rounded-xl bg-[#F3F4F6] px-3 py-6 text-center text-sm text-[#6B7280]">{t("bottle.cmpNobody")}</p>}
      {note ? <p role="status" className="mt-2 text-center text-xs font-semibold text-[#B45309]">{note}</p> : null}
    </div>
  );
}
