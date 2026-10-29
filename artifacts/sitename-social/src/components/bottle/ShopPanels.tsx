"use client";
import { useMemo, useState, type ReactNode } from "react";
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
  { hearts: 240000, price: 220, bonus: 118, tag: "best", art: "💎" }, { hearts: 120000, price: 140, bonus: 71, art: "💰" }, { hearts: 60000, price: 75, bonus: 60, art: "🪙" },
  { hearts: 30000, price: 45, bonus: 33, tag: "hit", art: "🍯" }, { hearts: 15000, price: 25, art: "👝" }, { hearts: 7500, price: 15, art: "💕" },
];
// Active play rewards: minutes of play today → hearts.
export const activeLevels: [number, number][] = [[30, 1000], [60, 2000], [240, 5000]];
export const formatActive = (secs: number, t: (key: TranslationKey) => string) => `${Math.floor(secs / 3600)}${t("bottle.hourShort")} ${Math.floor((secs % 3600) / 60)}${t("bottle.minShort")}`;

// The original bank (bottle-html5 BankDialog + bank CSS): a pink window with the heart pattern on top and
// 90×146 white cards, each with a coloured stripe, a picture and a small button. Our own cards (active play,
// season pass, channel, VIP, friends, compliments) are drawn the same way as the original's.
export function ShopPanel({ hearts, activeSecs, payNote, onActive, onTelegram, onVip, onInvite, onCompliments, onPack, onPass }: {
  hearts: number; activeSecs: number; payNote: boolean; onActive: () => void; onTelegram: () => void; onVip: () => void; onInvite: () => void; onCompliments: () => void; onPack: () => void; onPass: () => void;
}) {
  const { t } = useTranslation();
  const O = "/custom/orig/";
  const bg = (name: string) => ({ backgroundImage: `url(${O}${name}.svg)` });
  const heart = (n: number, big = false) => <span className={cn("whitespace-nowrap bg-no-repeat font-bold text-[rgb(255,62,0)]", big ? "pl-[18px] [background-position:left_-1px] [background-size:17px_18px]" : "pl-3 [background-position:left_1px] [background-size:11px_9px]")} style={bg("bank_heart")}>{n.toLocaleString("ru-RU")}</span>;
  const withHeart = (text: string, n: number) => { const [a, b = ""] = text.split("{n}"); return <>{a}{heart(n)}{b}</>; };
  const card = (key: string, stripe: string, desc: ReactNode, icon: ReactNode, button: ReactNode, label?: ReactNode) => (
    <li key={key} className="relative box-border flex h-[146px] w-[90px] flex-col items-center justify-between rounded-[10px] bg-white p-2 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.2)]">
      {label}
      <span aria-hidden="true" className="absolute left-0 top-7 h-[65px] w-[90px] bg-[length:90px_65px] bg-no-repeat" style={bg(stripe)} />
      <div className="relative z-0 mt-1.5 flex flex-1 flex-col items-center text-center text-[16px] leading-tight">{desc}</div>
      <div className="relative z-0 flex items-center justify-center">{icon}</div>
      {button}
    </li>
  );
  const btn = (color: string, onClick: () => void, children: ReactNode) => <button type="button" onClick={onClick} className={cn("mt-[11px] flex h-[26px] w-[74px] shrink-0 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[5px] px-0.5 leading-[26px] text-white active:brightness-90", typeof children === "string" && children.length > 9 ? "text-[12px]" : "text-[14px]")} style={{ backgroundColor: color }}>{children}</button>;
  const blue = "rgb(47,137,233)", green = "rgb(151,202,49)", cyan = "rgb(7,189,240)";
  const icon = (name: string, w: number, h: number) => <span aria-hidden="true" className="block bg-contain bg-center bg-no-repeat" style={{ ...bg(name), width: w, height: h }} />;
  const small = "text-[10px] leading-[1.1] text-[#424242]";
  return (
    <div className="relative flex max-h-full min-h-0 flex-col overflow-hidden rounded-[17px]">
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[238px] rounded-t-[17px] bg-repeat-x [background-position-y:-8px] [background-size:auto_238px]" style={bg("bank_bg")} />
      <div className="relative flex shrink-0 flex-col items-center">
        <p className="mb-1 mt-[15px] text-[14px] font-bold text-white">{t("bottle.bankTitle")}</p>
        <p className="mb-2.5 flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-0.5 text-[12px] font-bold text-white">{t("bottle.balance")}: <span className="pl-[14px] bg-no-repeat [background-position:left_center] [background-size:12px_12px]" style={bg("bank_heart")}>{hearts.toLocaleString("ru-RU")}</span></p>
      </div>
      <ul className="relative grid min-h-0 grid-cols-3 gap-[5px] overflow-y-auto px-2.5 pb-2.5 pt-[3px] [scrollbar-width:none] [@media(min-width:700px)]:grid-cols-4">
        {card("pass", "bank_gold_bg", <span className="text-center text-[10px] font-bold uppercase text-[rgb(255,144,0)]">{t("bottle.bankPremium")}</span>, icon("bank_premium_pass", 62, 39), btn(blue, onPass, t("bottle.details")))}
        {card("vip", "bank_gold_bg", <><span className="font-bold text-[rgb(255,144,0)]">VIP</span><span className="-mt-[3px] text-[11px] text-[rgb(255,144,0)]">{t("bottle.bankStatus")}</span></>, icon("bank_vip", 55, 37), btn(blue, onVip, t("bottle.details")))}
        {card("friends", "bank_violet_bg", <span className={small}>{withHeart(t("bottle.bankInvite"), 3000)}</span>, icon("bank_friends", 68, 40), btn(blue, onInvite, t("bottle.details")))}
        {card("compliments", "bank_cyan_bg", <span className={small}>{withHeart(t("bottle.bankCompliment"), 10)}</span>, icon("bank_compliment", 70, 47), btn(blue, onCompliments, t("bottle.details")))}
        {shopPacks.map((pack, i) => card(`p${pack.hearts}`, "bank_gold_bg",
          <><span className="pl-[18px] font-bold text-[rgb(255,62,0)] bg-no-repeat [background-position:left_-1px] [background-size:17px_18px]" style={bg("bank_heart")}>{pack.hearts.toLocaleString("ru-RU")}</span>{pack.bonus ? <span className="-mt-[3px] text-[11px] text-[rgb(255,143,0)]">{pack.bonus}% {t("bottle.bankBonus")}</span> : null}</>,
          <span className="relative block bg-contain bg-no-repeat" style={{ ...bg(`bank_opt_${shopPacks.length - i}`), ...[{ w: 50, h: 24 }, { w: 72, h: 33 }, { w: 55, h: 41 }, { w: 68, h: 42 }, { w: 63, h: 50 }, { w: 88, h: 52 }, { w: 86, h: 53 }].map(({ w, h }) => ({ width: w, height: h }))[Math.min(6, shopPacks.length - i - 1)] }} />,
          btn(green, onPack, <span className="tabular-nums">{pack.price.toLocaleString("ru-RU")} {t("bottle.currency")}</span>),
          pack.tag ? <span className="absolute -left-1 -right-1 -top-1 z-[1] mx-auto flex h-[18px] w-fit min-w-16 max-w-[98px] justify-center rounded-[3px] px-1.5 text-[8.5px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]" style={{ backgroundColor: pack.tag === "best" ? "#E6007E" : "#A24DC2" }}><span className="mt-[2px] whitespace-nowrap">{t(pack.tag === "best" ? "bottle.bankProfit" : "bottle.bankHit")}</span></span> : undefined))}
        {card("active", "bank_blue_bg", <span className={small}>{t("bottle.activeTitle")}<b className="mt-0.5 block text-[rgb(47,137,233)]">{formatActive(activeSecs, t)}</b></span>, <Pic e="⏰" className="h-10 w-10" />, btn(cyan, onActive, t("bottle.details")))}
        {card("channel", "bank_blue_bg", <span className={small}>{t("bottle.channelJoin")}</span>, <Pic e="🔔" className="h-10 w-10" />, btn(cyan, onTelegram, t("bottle.channelGo")))}
      </ul>
      {payNote ? <p role="status" className="relative mx-2.5 mb-2.5 rounded-[5px] border border-[rgb(239,102,102)] bg-[rgb(255,245,207)] px-2 py-1.5 text-center text-[12px] font-bold text-[#424242]">{t("bottle.paySoon")}</p> : null}
    </div>
  );
}

export function ActivePanel({ secs, claimed, live, onClaim }: { secs: number; claimed: number; live: boolean; onClaim: (level: number) => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-[#1F2937]">
      <div className="flex flex-col items-center"><Pic e="⏰" className="h-16 w-16" /><p className="mt-1 text-sm text-[#6B7280]">{t("bottle.activeToday")}</p><p className="text-2xl font-black tabular-nums text-[#7C3AED]">{formatActive(secs, t)}</p></div>
      <div className="my-3 h-2.5 overflow-hidden rounded-full bg-[#EDE9FE]"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#A16BFF,#7C3AED)]" style={{ width: `${Math.min(100, (secs / 14400) * 100)}%` }} /></div>
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
            <span className="-mt-3 flex items-center gap-0.5 rounded-full bg-[#8CC63F] px-2 py-0.5 text-sm font-black text-white shadow">+<H size={13} />3000</span>
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm leading-snug">{t("bottle.inviteText1")} <b className="whitespace-nowrap text-[#E11D48]"><H />3000</b> {t("bottle.inviteText2")}</p>
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
