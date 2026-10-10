"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { DoorOpen, Gift, Heart, SendHorizontal, Volume2 } from "lucide-react";
import type { GiftId } from "@/types";
import { initialsAvatar } from "@/lib/avatar";
import { useTranslation } from "@/i18n/useTranslation";
import { GiftArt } from "@/components/gifts/GiftArt";
import { useProfile } from "@/components/profile/useProfile";
import { cn } from "@/lib/utils";
import { BottleSvg } from "./BottleArt";

type Player = { id: string; name: string; age: number; female: boolean; avatar: string; me?: boolean };
type Phase = "waiting" | "spinning" | "choice" | "kissed" | "declined";
type Line = { id: number; from: string; to?: string; text?: string; kisses?: number; gift?: GiftId };

// Seat centres in percent of the table: three on top, two on the right, four below, three on the left.
const seats = [[30, 11], [50, 10], [70, 11], [89, 36], [89, 60], [80, 86], [62, 88], [44, 88], [26, 86], [10, 68], [10, 48], [10, 28]] as const;
const bots: Omit<Player, "avatar">[] = [
  { id: "b1", name: "Leyla", age: 24, female: true }, { id: "b2", name: "Rəşad", age: 27, female: false }, { id: "b3", name: "Nigar", age: 22, female: true },
  { id: "b4", name: "Samir", age: 29, female: false }, { id: "b5", name: "Mina", age: 21, female: true }, { id: "b6", name: "Kamran", age: 31, female: false },
  { id: "b7", name: "Aysel", age: 26, female: true }, { id: "b8", name: "Tural", age: 25, female: false }, { id: "b9", name: "Günay", age: 23, female: true },
  { id: "b10", name: "Elvin", age: 28, female: false }, { id: "b11", name: "Səbinə", age: 27, female: true },
];
const smallTalk = ["Salam hamıya 👋", "Bu gün bəxtim gətirir 😄", "Kim fırladır?", "Çay içən var? ☕", "Hahaha", "Bir də fırlat!", "Bakıdan kim var?", "Gecəniz xeyrə 🌙"];
const giftChoices: GiftId[] = ["tea", "rose", "heart", "paxlava"];
const angleTo = (index: number) => (Math.atan2(seats[index][1] - 50, seats[index][0] - 50) * 180) / Math.PI + 90;

export function BottleGame() {
  const { t } = useTranslation();
  const { user } = useProfile();
  const players = useMemo<Player[]>(() => {
    const me: Player = { id: "me", name: user.name.split(" ")[0], age: 25, female: false, avatar: user.avatar, me: true };
    const others = bots.map((bot) => ({ ...bot, avatar: initialsAvatar(bot.name) }));
    return [...others.slice(0, 7), me, ...others.slice(7)];
  }, [user.name, user.avatar]);
  const meIndex = 7;

  const [turn, setTurn] = useState(5);
  const [target, setTarget] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [rotation, setRotation] = useState(0);
  const [answers, setAnswers] = useState<{ spinner: boolean | null; target: boolean | null }>({ spinner: null, target: null });
  const [kisses, setKisses] = useState<Record<string, number>>({ b1: 3, b4: 8, b7: 1 });
  const [stickers, setStickers] = useState<Record<string, GiftId[]>>({ b2: ["tea"], b5: ["rose"] });
  const [lines, setLines] = useState<Line[]>([{ id: 1, from: "b3", text: smallTalk[0] }, { id: 2, from: "b6", to: "b1", kisses: 1 }]);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const lineId = useRef(3);
  const listRef = useRef<HTMLDivElement>(null);
  const say = useCallback((line: Omit<Line, "id">) => setLines((list) => [...list.slice(-40), { ...line, id: lineId.current++ }]), []);

  const spin = useCallback(() => {
    const spinner = players[turn];
    const options = players.map((_, index) => index).filter((index) => index !== turn && players[index].female !== spinner.female);
    const next = options[Math.floor(Math.random() * options.length)];
    setTarget(next);
    setAnswers({ spinner: null, target: null });
    setRotation((current) => {
      const wanted = ((angleTo(next) % 360) + 360) % 360;
      const base = current - (current % 360);
      return base + 1440 + wanted;
    });
    setPhase("spinning");
  }, [players, turn]);

  // Turn flow: wait for the spin, let the bottle settle, collect both answers, show the result, pass the turn.
  useEffect(() => {
    if (phase === "waiting") {
      const timer = window.setTimeout(spin, turn === meIndex ? 9000 : 1800);
      return () => window.clearTimeout(timer);
    }
    if (phase === "spinning") {
      const timer = window.setTimeout(() => setPhase("choice"), 3400);
      return () => window.clearTimeout(timer);
    }
    if (phase === "choice" && target !== null) {
      const timers: number[] = [];
      const decide = (role: "spinner" | "target", index: number) => {
        if (index === meIndex) timers.push(window.setTimeout(() => setAnswers((value) => (value[role] === null ? { ...value, [role]: false } : value)), 8000));
        else timers.push(window.setTimeout(() => setAnswers((value) => ({ ...value, [role]: Math.random() < 0.75 })), 900 + Math.random() * 1400));
      };
      decide("spinner", turn);
      decide("target", target);
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }
    if (phase === "kissed" || phase === "declined") {
      const timer = window.setTimeout(() => {
        setTarget(null);
        setTurn((current) => (current + 1) % players.length);
        setPhase("waiting");
      }, 2400);
      return () => window.clearTimeout(timer);
    }
  }, [phase, turn, target, spin, players.length]);

  useEffect(() => {
    if (phase !== "choice" || target === null || answers.spinner === null || answers.target === null) return;
    const [a, b] = [players[turn], players[target]];
    if (answers.spinner && answers.target) {
      setKisses((value) => ({ ...value, [a.id]: (value[a.id] ?? 0) + 1, [b.id]: (value[b.id] ?? 0) + 1 }));
      say({ from: a.id, to: b.id, kisses: 1 });
      setPhase("kissed");
    } else setPhase("declined");
  }, [answers, phase, target, turn, players, say]);

  // Bots chat a little so the room feels alive.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const bot = bots[Math.floor(Math.random() * bots.length)];
      say({ from: bot.id, text: smallTalk[Math.floor(Math.random() * smallTalk.length)] });
    }, 7000);
    return () => window.clearInterval(timer);
  }, [say]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines.length]);

  const byId = (id: string) => players.find((player) => player.id === id);
  const myRole = phase === "choice" && target !== null ? (turn === meIndex ? "spinner" : target === meIndex ? "target" : null) : null;
  const other = myRole && target !== null ? players[myRole === "spinner" ? target : turn] : null;
  const status = phase === "waiting" ? (turn === meIndex ? t("bottle.yourTurn") : `${players[turn].name} ${t("bottle.spins")}`)
    : phase === "spinning" ? t("bottle.spinning")
      : phase === "choice" ? t("bottle.deciding")
        : phase === "kissed" ? t("bottle.kissed") : t("bottle.declined");

  function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    say({ from: "me", text: draft.trim().slice(0, 200) });
    setDraft("");
  }
  function sendGift(index: number, gift: GiftId) {
    const player = players[index];
    setStickers((value) => ({ ...value, [player.id]: [...(value[player.id] ?? []), gift].slice(-2) }));
    say({ from: "me", to: player.id, gift });
    setPicked(null);
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface lg:flex lg:h-[min(720px,calc(100dvh-170px))]">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#D08A3C] [background-image:radial-gradient(ellipse_at_50%_45%,rgba(255,214,140,0.75)_0%,rgba(255,190,100,0.25)_45%,rgba(120,60,10,0.35)_100%),repeating-linear-gradient(92deg,rgba(120,65,15,0.14)_0px,rgba(120,65,15,0)_3px,rgba(255,225,170,0.10)_7px,rgba(120,65,15,0.12)_11px,rgba(120,65,15,0)_19px),repeating-linear-gradient(88deg,rgba(90,45,5,0.10)_0px,rgba(90,45,5,0)_40px,rgba(90,45,5,0.08)_83px)] lg:aspect-auto lg:h-full lg:w-[58%]" onClick={() => setPicked(null)}>
        <div className="absolute left-2.5 top-2.5 flex flex-col items-center text-white" title={t("bottle.myKisses")}>
          <Heart size={34} fill="#FF6A1F" stroke="#FFFFFF" strokeWidth={1.5} />
          <span className="text-sm font-bold tabular-nums">{kisses.me ?? 0}</span>
        </div>
        <Link href="/games" aria-label={t("bottle.leave")} title={t("bottle.leave")} className="absolute bottom-2.5 left-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-[#EE8A2B] text-white shadow-md hover:brightness-110"><DoorOpen size={18} /></Link>
        <span className="absolute right-2.5 top-2.5 rounded-full bg-[#EE8A2B] px-3 py-1.5 text-[11px] font-bold text-white shadow-md">{t("bottle.table")} 60</span>

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[38%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-[3200ms] ease-[cubic-bezier(0.15,0.6,0.2,1)] motion-reduce:duration-0" style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}>
          <BottleSvg className="h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]" />
        </div>
        <p role="status" className="pointer-events-none absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 text-center text-[clamp(13px,2.6vw,19px)] font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.75)]">{status}</p>

        {players.map((player, index) => {
          const active = index === turn || index === target;
          const answer = phase !== "waiting" && phase !== "spinning" ? (index === turn ? answers.spinner : index === target ? answers.target : null) : null;
          return (
            <div key={player.id} className="absolute w-[15%] -translate-x-1/2 -translate-y-1/2" style={{ left: `${seats[index][0]}%`, top: `${seats[index][1]}%` }}>
              <button type="button" disabled={player.me} onClick={(event) => { event.stopPropagation(); setPicked(picked === index ? null : index); }} aria-label={`${player.name}, ${player.age}`} className={cn("relative block aspect-square w-full rounded-[18%] bg-surface-2 shadow-[0_4px_10px_rgba(0,0,0,0.4)] outline-offset-2", active ? "ring-4 ring-white" : player.me ? "ring-2 ring-white/70" : "")}>
                <img src={player.avatar} alt="" className="h-full w-full rounded-[18%] object-cover" />
                {kisses[player.id] ? <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#E5334B] px-1 text-[11px] font-bold tabular-nums text-white">{kisses[player.id]}</span> : null}
                {(stickers[player.id] ?? []).map((gift, position) => <GiftArt key={`${gift}-${position}`} id={gift} className={cn("absolute -bottom-2 h-[46%] w-[46%] drop-shadow", position ? "-left-2" : "-right-2")} />)}
                {answer !== null ? <span className={cn("absolute inset-0 flex items-center justify-center rounded-[18%] text-[clamp(18px,4vw,30px)]", answer ? "bg-[#E5334B]/45" : "bg-black/55")}>{answer ? "💋" : "✋"}</span> : null}
              </button>
              <p className="mt-0.5 truncate text-center text-[clamp(10px,1.9vw,13px)] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">{player.me ? t("common.you") : player.name}, {player.age}</p>
              {picked === index ? (
                <div role="menu" onClick={(event) => event.stopPropagation()} className={cn("absolute z-20 flex gap-1 rounded-xl border border-border bg-surface p-1.5 shadow-lg", seats[index][1] > 60 ? "bottom-full mb-1" : "top-full mt-1", seats[index][0] > 60 ? "right-0" : "left-0")}>
                  {giftChoices.map((gift) => <button key={gift} role="menuitem" onClick={() => sendGift(index, gift)} aria-label={t("gifts.send")} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-2"><GiftArt id={gift} className="h-8 w-8" /></button>)}
                </div>
              ) : null}
            </div>
          );
        })}

        {phase === "waiting" && turn === meIndex ? <button onClick={spin} className="absolute left-1/2 top-[70%] -translate-x-1/2 rounded-full bg-[#EE8A2B] px-7 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-105">{t("bottle.spin")}</button> : null}
        {myRole && other && answers[myRole] === null ? (
          <div className="absolute left-1/2 top-1/2 z-30 w-[min(300px,74%)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-3 text-center shadow-xl">
            <p className="text-sm font-semibold text-text">{t("bottle.ask")} {other.name}?</p>
            <div className="mt-2.5 flex gap-2">
              <button onClick={() => setAnswers((value) => ({ ...value, [myRole]: false }))} className="h-11 flex-1 rounded-xl border border-border text-sm font-semibold text-text hover:bg-surface-2">{t("bottle.no")}</button>
              <button onClick={() => setAnswers((value) => ({ ...value, [myRole]: true }))} className="h-11 flex-1 rounded-xl bg-[#E5334B] text-sm font-bold text-white hover:brightness-110">💋 {t("bottle.yes")}</button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-[300px] min-w-0 flex-1 flex-col border-t border-border lg:border-l lg:border-t-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5 text-xs text-muted"><Volume2 size={15} className="shrink-0 text-accent" /><span className="truncate">{t("bottle.demoNote")}</span></div>
        <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {lines.map((line) => {
            const from = byId(line.from);
            const to = line.to ? byId(line.to) : null;
            if (!from) return null;
            return (
              <div key={line.id} className="flex items-center gap-2 text-sm">
                <img src={from.avatar} alt={from.name} title={from.name} className="h-7 w-7 shrink-0 rounded-md object-cover" />
                {line.text ? <p className="min-w-0 break-words text-text"><span className="font-semibold text-muted">{from.me ? t("common.you") : from.name}: </span>{line.text}</p> : null}
                {to ? <>{line.gift ? <GiftArt id={line.gift} className="h-7 w-7 shrink-0" /> : <span className="shrink-0 text-base">💋{line.kisses && line.kisses > 1 ? ` x${line.kisses}` : ""}</span>}<span className="text-accent">»</span><img src={to.avatar} alt={to.name} title={to.name} className="h-7 w-7 shrink-0 rounded-md object-cover" /></> : null}
              </div>
            );
          })}
        </div>
        <form onSubmit={handleChat} className="flex items-center gap-2 border-t border-border p-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center text-muted" title={t("bottle.giftHint")}><Gift size={18} /></span>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={200} aria-label={t("messages.placeholder")} placeholder={t("messages.placeholder")} autoComplete="off" className="h-10 min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
          <button type="submit" disabled={!draft.trim()} aria-label={t("messages.send")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-bg disabled:opacity-40"><SendHorizontal size={16} /></button>
        </form>
      </div>
    </div>
  );
}
