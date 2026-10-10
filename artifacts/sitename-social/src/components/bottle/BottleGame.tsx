"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Heart, Maximize, Minimize, SendHorizontal, Volume2, VolumeX, X, Music2 } from "lucide-react";
import type { GiftId } from "@/types";
import { initialsAvatar } from "@/lib/avatar";
import { useTranslation } from "@/i18n/useTranslation";
import { GiftArt } from "@/components/gifts/GiftArt";
import { useProfile } from "@/components/profile/useProfile";
import { cn } from "@/lib/utils";
import { BottleSvg } from "./BottleArt";
import { playSound, setMuted } from "./sound";

type Player = { id: string; name: string; age: number; female: boolean; avatar: string; me?: boolean };
type Phase = "waiting" | "spinning" | "choice" | "kissed" | "declined";
type Line = { id: number; from: string; to?: string; text?: string; gift?: GiftId };

// Seat centres in percent of the table: four on top, two on the right, four below, two on the left.
const seats = [[20, 13], [40, 13], [60, 13], [80, 13], [90, 38], [90, 62], [80, 85], [60, 85], [40, 85], [20, 85], [10, 62], [10, 38]] as const;
const bots: Omit<Player, "avatar">[] = [
  { id: "b1", name: "Leyla", age: 24, female: true }, { id: "b2", name: "Rəşad", age: 27, female: false }, { id: "b3", name: "Nigar", age: 22, female: true },
  { id: "b4", name: "Samir", age: 29, female: false }, { id: "b5", name: "Mina", age: 21, female: true }, { id: "b6", name: "Kamran", age: 31, female: false },
  { id: "b7", name: "Aysel", age: 26, female: true }, { id: "b8", name: "Tural", age: 25, female: false }, { id: "b9", name: "Günay", age: 23, female: true },
  { id: "b10", name: "Elvin", age: 28, female: false }, { id: "b11", name: "Səbinə", age: 27, female: true },
];
const smallTalk = ["Salam hamıya 👋", "Bu gün bəxtim gətirir 😄", "Kim fırladır?", "Çay içən var? ☕", "Hahaha", "Bir də fırlat!", "Bakıdan kim var?", "Gecəniz xeyrə 🌙"];
const giftChoices: GiftId[] = ["tea", "rose", "heart", "paxlava"];
const SPIN_SECONDS = 5;
const ANSWER_SECONDS = 10;
const round = "flex h-11 w-11 items-center justify-center rounded-full bg-[#EE8A2B] text-white shadow-md hover:brightness-110";
const angleTo = (index: number) => (Math.atan2(seats[index][1] - 50, seats[index][0] - 50) * 180) / Math.PI + 90;
function youtubeId(value: string) {
  const match = value.trim().match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/) ?? value.trim().match(/^([A-Za-z0-9_-]{11})$/);
  return match ? match[1] : null;
}

export function BottleGame() {
  const { t } = useTranslation();
  const { user } = useProfile();
  const players = useMemo<Player[]>(() => {
    const me: Player = { id: "me", name: user.name.split(" ")[0], age: 25, female: false, avatar: user.avatar, me: true };
    const others = bots.map((bot) => ({ ...bot, avatar: initialsAvatar(bot.name) }));
    return [...others.slice(0, 7), me, ...others.slice(7)];
  }, [user.name, user.avatar]);
  const meIndex = 7;

  const [turn, setTurn] = useState(4);
  const [target, setTarget] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [rotation, setRotation] = useState(0);
  const [answers, setAnswers] = useState<{ spinner: boolean | null; target: boolean | null }>({ spinner: null, target: null });
  const [seconds, setSeconds] = useState(0);
  const [kisses, setKisses] = useState<Record<string, number>>({ b1: 3, b4: 8, b7: 1 });
  const [stickers, setStickers] = useState<Record<string, GiftId[]>>({ b2: ["tea"], b5: ["rose"] });
  const [lines, setLines] = useState<Line[]>([{ id: 1, from: "b3", text: smallTalk[0] }, { id: 2, from: "b6", to: "b1" }]);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [full, setFull] = useState(false);
  const [link, setLink] = useState("");
  const [video, setVideo] = useState<string | null>(null);
  const [badLink, setBadLink] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineId = useRef(3);
  const listRef = useRef<HTMLDivElement>(null);
  const say = useCallback((line: Omit<Line, "id">) => setLines((list) => [...list.slice(-40), { ...line, id: lineId.current++ }]), []);
  const nextTurn = useCallback(() => {
    setTarget(null);
    setTurn((current) => (current + 1) % players.length);
    setPhase("waiting");
  }, [players.length]);

  const spin = useCallback(() => {
    const spinner = players[turn];
    const options = players.map((_, index) => index).filter((index) => index !== turn && players[index].female !== spinner.female);
    const next = options[Math.floor(Math.random() * options.length)];
    setTarget(next);
    setAnswers({ spinner: null, target: null });
    setRotation((current) => current - (current % 360) + 1440 + (((angleTo(next) % 360) + 360) % 360));
    setPhase("spinning");
  }, [players, turn]);

  // Turn flow. A player has 5 seconds to spin, otherwise the bottle passes on; the chosen pair has 10 seconds to answer.
  useEffect(() => {
    if (phase === "waiting") {
      playSound("turn");
      if (turn !== meIndex) {
        const timer = window.setTimeout(spin, 1500 + Math.random() * 1200);
        return () => window.clearTimeout(timer);
      }
      setSeconds(SPIN_SECONDS);
      const tick = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
      const timer = window.setTimeout(nextTurn, SPIN_SECONDS * 1000);
      return () => { window.clearInterval(tick); window.clearTimeout(timer); };
    }
    if (phase === "spinning") {
      const timer = window.setTimeout(() => { playSound("chosen"); setPhase("choice"); }, 3400);
      return () => window.clearTimeout(timer);
    }
    if (phase === "choice" && target !== null) {
      const timers: number[] = [];
      const decide = (role: "spinner" | "target", index: number) => {
        if (index !== meIndex) timers.push(window.setTimeout(() => setAnswers((value) => ({ ...value, [role]: Math.random() < 0.75 })), 1200 + Math.random() * 2500));
      };
      decide("spinner", turn);
      decide("target", target);
      setSeconds(ANSWER_SECONDS);
      const tick = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
      timers.push(window.setTimeout(() => setAnswers((value) => ({ spinner: value.spinner ?? false, target: value.target ?? false })), ANSWER_SECONDS * 1000));
      return () => { window.clearInterval(tick); timers.forEach((timer) => window.clearTimeout(timer)); };
    }
    if (phase === "kissed" || phase === "declined") {
      const timer = window.setTimeout(nextTurn, 2600);
      return () => window.clearTimeout(timer);
    }
  }, [phase, turn, target, spin, nextTurn]);

  useEffect(() => {
    if (phase !== "choice" || target === null || answers.spinner === null || answers.target === null) return;
    const [a, b] = [players[turn], players[target]];
    if (answers.spinner && answers.target) {
      setKisses((value) => ({ ...value, [a.id]: (value[a.id] ?? 0) + 1, [b.id]: (value[b.id] ?? 0) + 1 }));
      say({ from: a.id, to: b.id });
      playSound("kiss");
      setPhase("kissed");
    } else {
      playSound("decline");
      setPhase("declined");
    }
  }, [answers, phase, target, turn, players, say]);

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
  useEffect(() => setMuted(!sound), [sound]);
  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const byId = (id: string) => players.find((player) => player.id === id);
  const staged = phase !== "waiting" && phase !== "spinning" && target !== null;
  const myRole = phase === "choice" && target !== null ? (turn === meIndex ? "spinner" : target === meIndex ? "target" : null) : null;
  const status = phase === "waiting" ? (turn === meIndex ? t("bottle.yourTurn") : `${players[turn].name} ${t("bottle.spins")}`) : phase === "spinning" ? t("bottle.spinning") : "";

  function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    say({ from: "me", text: draft.trim().slice(0, 200) });
    setDraft("");
  }
  function handleVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = youtubeId(link);
    setBadLink(!id);
    if (!id) return;
    setVideo(id);
    setLink("");
    say({ from: "me", text: `🎵 ${t("bottle.videoShared")}` });
  }
  function sendGift(index: number, gift: GiftId) {
    const player = players[index];
    setStickers((value) => ({ ...value, [player.id]: [...(value[player.id] ?? []), gift].slice(-2) }));
    say({ from: "me", to: player.id, gift });
    setPicked(null);
  }
  function toggleFull() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.().catch(() => undefined);
  }
  const stageCard = (player: Player, answer: boolean | null) => (
    <div className="flex w-[23cqmin] flex-col items-center">
      <div className="relative aspect-square w-full overflow-hidden rounded-[12%] bg-surface-2 shadow-[0_6px_16px_rgba(0,0,0,0.45)]">
        <img src={player.avatar} alt="" className="h-full w-full object-cover" />
        {answer !== null ? <span className={cn("absolute inset-0 flex items-center justify-center text-[11cqmin]", answer ? "bg-[#E5334B]/45" : "bg-black/55")}>{answer ? "💋" : "✋"}</span> : null}
      </div>
      <p className="mt-1 max-w-full truncate text-[3cqmin] font-semibold text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">{player.me ? t("common.you") : player.name}, {player.age}</p>
    </div>
  );

  return (
    <div ref={rootRef} className="fixed inset-0 z-[60] flex flex-col bg-surface text-text lg:flex-row">
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#D08A3C] [background-image:radial-gradient(ellipse_at_50%_45%,rgba(255,214,140,0.75)_0%,rgba(255,190,100,0.25)_45%,rgba(120,60,10,0.35)_100%),repeating-linear-gradient(92deg,rgba(120,65,15,0.14)_0px,rgba(120,65,15,0)_3px,rgba(255,225,170,0.10)_7px,rgba(120,65,15,0.12)_11px,rgba(120,65,15,0)_19px),repeating-linear-gradient(88deg,rgba(90,45,5,0.10)_0px,rgba(90,45,5,0)_40px,rgba(90,45,5,0.08)_83px)] [container-type:size] max-lg:max-h-[58dvh] lg:aspect-auto lg:h-full lg:w-[54%]" onClick={() => setPicked(null)}>
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-center text-white" title={t("bottle.myKisses")}>
          <Heart size={36} fill="#FF6A1F" stroke="#FFFFFF" strokeWidth={1.5} />
          <span className="text-base font-bold tabular-nums [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{kisses.me ?? 0}</span>
        </div>
        <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-[#EE8A2B] px-3 py-1.5 text-[11px] font-bold text-white shadow-md">{t("bottle.table")} 60</span>
        <Link href="/games" aria-label={t("bottle.leave")} title={t("bottle.leave")} className={cn(round, "absolute bottom-2.5 left-2.5 z-10")}><X size={20} /></Link>
        <div className="absolute bottom-2.5 right-2.5 z-10 flex flex-col gap-2">
          <button onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={t(sound ? "videos.mute" : "videos.unmute")} title={t(sound ? "videos.mute" : "videos.unmute")} className={round}>{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
          <button onClick={toggleFull} aria-label={t("bottle.fullscreen")} title={t("bottle.fullscreen")} className={cn(round, "max-lg:hidden")}>{full ? <Minimize size={18} /> : <Maximize size={18} />}</button>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[40cqmin] transition-transform duration-[3200ms] ease-[cubic-bezier(0.15,0.6,0.2,1)] motion-reduce:duration-0" style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}>
          <BottleSvg className={cn("h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] transition-opacity duration-300", staged && "opacity-0")} />
        </div>
        {status ? <p role="status" className="pointer-events-none absolute left-1/2 top-1/2 w-[52cqmin] -translate-x-1/2 -translate-y-1/2 text-center text-[4.4cqmin] font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.75)]">{status}</p> : null}

        {players.map((player, index) => {
          const active = index === turn || index === target;
          return (
            <div key={player.id} className={cn("absolute w-[17cqmin] -translate-x-1/2 -translate-y-1/2 transition-opacity", staged && active && "pointer-events-none opacity-0")} style={{ left: `${seats[index][0]}%`, top: `${seats[index][1]}%` }}>
              <button type="button" disabled={player.me} onClick={(event) => { event.stopPropagation(); setPicked(picked === index ? null : index); }} aria-label={`${player.name}, ${player.age}`} className={cn("relative block aspect-square w-full rounded-[14%] bg-surface-2 shadow-[0_4px_10px_rgba(0,0,0,0.4)]", index === turn && phase === "waiting" ? "ring-4 ring-white" : active && phase !== "waiting" ? "ring-4 ring-white" : player.me ? "ring-2 ring-white/80" : "")}>
                <img src={player.avatar} alt="" className="h-full w-full rounded-[14%] object-cover" />
                {kisses[player.id] ? <span className="absolute -right-[1.2cqmin] -top-[1.2cqmin] flex h-[4.6cqmin] min-w-[4.6cqmin] items-center justify-center rounded-full bg-[#E5334B] px-1 text-[2.4cqmin] font-bold tabular-nums text-white shadow">{kisses[player.id]}</span> : null}
                {(stickers[player.id] ?? []).map((gift, position) => <GiftArt key={`${gift}-${position}`} id={gift} className={cn("absolute -bottom-[1.6cqmin] h-[48%] w-[48%] drop-shadow", position ? "-left-[1.6cqmin]" : "-right-[1.6cqmin]")} />)}
              </button>
              <p className="mt-0.5 truncate text-center text-[2.7cqmin] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">{player.me ? t("common.you") : player.name}, {player.age}</p>
              {picked === index ? (
                <div role="menu" onClick={(event) => event.stopPropagation()} className={cn("absolute z-20 flex gap-1 rounded-xl border border-border bg-surface p-1.5 shadow-lg", seats[index][1] > 60 ? "bottom-full mb-1" : "top-full mt-1", seats[index][0] > 60 ? "right-0" : "left-0")}>
                  {giftChoices.map((gift) => <button key={gift} role="menuitem" onClick={() => sendGift(index, gift)} aria-label={t("gifts.send")} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-2"><GiftArt id={gift} className="h-8 w-8" /></button>)}
                </div>
              ) : null}
            </div>
          );
        })}

        {phase === "waiting" && turn === meIndex ? (
          <button onClick={spin} className="absolute left-1/2 top-[64%] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#EE8A2B] px-[5cqmin] py-[2cqmin] text-[3.6cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.spin")}<span className="flex h-[5cqmin] w-[5cqmin] items-center justify-center rounded-full bg-white/25 text-[3cqmin] tabular-nums">{seconds}</span></button>
        ) : null}

        {staged && target !== null ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-[2.4cqmin]">
            <p role="status" className="max-w-[60cqmin] text-center text-[5cqmin] font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.75)]">
              {phase === "kissed" ? t("bottle.kissed") : phase === "declined" ? t("bottle.declined") : myRole ? t("bottle.yourChoice") : t("bottle.deciding")}
            </p>
            <div className="flex items-center gap-[2.5cqmin]">
              {stageCard(players[turn], answers.spinner)}
              {phase === "choice"
                ? <span aria-label={`${seconds}`} className="w-[8cqmin] text-center text-[8cqmin] font-bold tabular-nums text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.75)]">{seconds}</span>
                : <Heart className="h-[8cqmin] w-[8cqmin] shrink-0" fill={phase === "kissed" ? "#FF4D6A" : "none"} stroke="#FFFFFF" strokeWidth={1.8} />}
              {stageCard(players[target], answers.target)}
            </div>
            <div className={cn("flex gap-[3cqmin]", !(myRole && answers[myRole] === null) && "invisible")}>
              <button onClick={() => myRole && setAnswers((value) => ({ ...value, [myRole]: false }))} className="h-[10cqmin] w-[23cqmin] rounded-[2cqmin] bg-[#E2401F] text-[3.4cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.no")}</button>
              <button onClick={() => myRole && setAnswers((value) => ({ ...value, [myRole]: true }))} className="h-[10cqmin] w-[23cqmin] rounded-[2cqmin] bg-[#8CC63F] text-[3.4cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.yes")}</button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-border lg:border-l lg:border-t-0">
        {video ? (
          <div className="relative aspect-video w-full shrink-0 bg-black max-lg:max-h-[24dvh] lg:max-h-[42%]">
            <iframe src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0`} title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
            <button onClick={() => setVideo(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"><X size={15} /></button>
          </div>
        ) : null}
        <form onSubmit={handleVideo} className="flex items-center gap-2 border-b border-border p-2.5">
          <Music2 size={20} className="shrink-0 text-[#FF3B30]" />
          <input value={link} onChange={(event) => { setLink(event.target.value); setBadLink(false); }} aria-label={t("bottle.videoLink")} placeholder={t("bottle.videoLink")} autoComplete="off" className={cn("h-10 min-w-0 flex-1 rounded-full border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent", badLink ? "border-danger" : "border-border")} />
          <button type="submit" disabled={!link.trim()} className="h-10 shrink-0 rounded-full bg-accent px-4 text-xs font-bold text-bg disabled:opacity-40">{t("bottle.videoPlay")}</button>
        </form>
        <p className="border-b border-border px-3 py-1.5 text-[11px] text-muted">{t("bottle.demoNote")}</p>
        <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {lines.map((line) => {
            const from = byId(line.from);
            const to = line.to ? byId(line.to) : null;
            if (!from) return null;
            return (
              <div key={line.id} className="flex items-center gap-2 text-sm">
                <img src={from.avatar} alt={from.name} title={from.name} className="h-8 w-8 shrink-0 rounded-md object-cover" />
                {line.text ? <p className="min-w-0 break-words text-text"><span className="font-semibold text-muted">{from.me ? t("common.you") : from.name}: </span>{line.text}</p> : null}
                {to ? <>{line.gift ? <GiftArt id={line.gift} className="h-7 w-7 shrink-0" /> : <span className="shrink-0 text-lg">💋</span>}<span className="font-bold text-accent">»</span><img src={to.avatar} alt={to.name} title={to.name} className="h-8 w-8 shrink-0 rounded-md object-cover" /></> : null}
              </div>
            );
          })}
        </div>
        <form onSubmit={handleChat} className="flex items-center gap-2 border-t border-border p-2.5">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={200} aria-label={t("messages.placeholder")} placeholder={t("messages.placeholder")} autoComplete="off" className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
          <button type="submit" disabled={!draft.trim()} aria-label={t("messages.send")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EE8A2B] text-white disabled:opacity-40"><SendHorizontal size={17} /></button>
        </form>
      </div>
    </div>
  );
}
