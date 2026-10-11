"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Heart, Maximize, Minimize, SendHorizontal, Volume2, VolumeX, X, Music2 } from "lucide-react";
import type { GiftId } from "@/types";
import { cartoonAvatar } from "./avatarArt";
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
const giftChoices: GiftId[] = ["crown", "heart", "diamond", "rose", "ring", "flame", "tea", "nar", "paxlava", "shekerbura", "semeni", "xaribulbul", "buta", "tar", "tower"];
const SPIN_SECONDS = 8;
const ANSWER_SECONDS = 9;
const STAGE_Y = 48;
const round = "flex h-[min(44px,8.5cqmin)] w-[min(44px,8.5cqmin)] items-center justify-center rounded-full bg-[#EE8A2B] text-white shadow-md hover:brightness-110";
const angleTo = (index: number) => (Math.atan2(seats[index][1] - 50, seats[index][0] - 50) * 180) / Math.PI + 90;
function youtubeId(value: string) {
  const match = value.trim().match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/) ?? value.trim().match(/^([A-Za-z0-9_-]{11})$/);
  return match ? match[1] : null;
}

export function BottleGame({ wide, full, onToggleFull, onLeave }: { wide: boolean; full: boolean; onToggleFull: () => void; onLeave: () => void }) {
  const { t } = useTranslation();
  const { user } = useProfile();
  const players = useMemo<Player[]>(() => {
    const me: Player = { id: "me", name: user.name.split(" ")[0], age: 25, female: false, avatar: user.avatar, me: true };
    const others = bots.map((bot, index) => ({ ...bot, avatar: cartoonAvatar(index + 1, bot.female) }));
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
  const [flying, setFlying] = useState<{ gift: GiftId; to: number; moved: boolean } | null>(null);
  const [sound, setSound] = useState(true);
  const [link, setLink] = useState("");
  const [video, setVideo] = useState<string | null>(null);
  const [badLink, setBadLink] = useState(false);
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

  // Turn flow. A player has a few seconds to click the bottle, otherwise the turn passes on.
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
    if (phase === "kissed" || phase === "declined") {
      const timer = window.setTimeout(nextTurn, 2600);
      return () => window.clearTimeout(timer);
    }
  }, [phase, turn, spin, nextTurn]);

  // Both players answer on their own within the same countdown; neither waits for the other.
  const deciding = phase === "choice" && target !== null && (answers.spinner === null || answers.target === null);
  useEffect(() => {
    if (phase !== "choice" || target === null) return;
    setSeconds(ANSWER_SECONDS);
    const tick = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    const timers = (["spinner", "target"] as const).map((role) => {
      const index = role === "spinner" ? turn : target;
      return index === meIndex
        ? window.setTimeout(() => setAnswers((value) => (value[role] === null ? { ...value, [role]: false } : value)), ANSWER_SECONDS * 1000)
        : window.setTimeout(() => setAnswers((value) => (value[role] === null ? { ...value, [role]: Math.random() < 0.75 } : value)), 1500 + Math.random() * 4500);
    });
    return () => { window.clearInterval(tick); timers.forEach((timer) => window.clearTimeout(timer)); };
  }, [phase, turn, target]);

  // A kiss counts for the player who receives it, even when they refused themselves.
  useEffect(() => {
    if (phase !== "choice" || target === null || answers.spinner === null || answers.target === null) return;
    const [a, b] = [players[turn], players[target]];
    const timer = window.setTimeout(() => {
      setKisses((value) => ({ ...value, ...(answers.spinner ? { [b.id]: (value[b.id] ?? 0) + 1 } : {}), ...(answers.target ? { [a.id]: (value[a.id] ?? 0) + 1 } : {}) }));
      if (answers.spinner) say({ from: a.id, to: b.id });
      if (answers.target) say({ from: b.id, to: a.id });
      const both = answers.spinner && answers.target;
      playSound(both ? "kiss" : "decline");
      setPhase(both ? "kissed" : "declined");
    }, 900);
    return () => window.clearTimeout(timer);
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
  const byId = (id: string) => players.find((player) => player.id === id);
  const staged = phase !== "waiting" && phase !== "spinning" && target !== null;
  const myRole: "spinner" | "target" | null = staged ? (turn === meIndex ? "spinner" : target === meIndex ? "target" : null) : null;
  const canAnswer = deciding && myRole !== null && answers[myRole] === null;
  const myTurn = phase === "waiting" && turn === meIndex;

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
    setPicked(null);
    setFlying({ gift, to: index, moved: false });
    window.setTimeout(() => setFlying((value) => (value ? { ...value, moved: true } : value)), 40);
    window.setTimeout(() => {
      setFlying(null);
      setStickers((value) => ({ ...value, [player.id]: [...(value[player.id] ?? []), gift].slice(-2) }));
      say({ from: "me", to: player.id, gift });
    }, 800);
  }
  // A curved arrow from the player who answered to the other one. Green means a kiss, red a refusal.
  const arrow = (answer: boolean | null, leftToRight: boolean, drop: number) => {
    if (answer === null) return null;
    const color = answer ? "#7AC143" : "#E2401F";
    const [from, to] = leftToRight ? [105, 355] : [355, 105];
    const tip = leftToRight ? "M368 2l-44 6 27 34z" : "M92 2l44 6-27 34z";
    const path = `M${from} ${16 + drop} Q230 ${96 + drop} ${to} ${16 + drop}`;
    return (
      <g>
        <path d={path} fill="none" stroke="#FFFFFF" strokeWidth="22" strokeLinecap="round" />
        <path d={tip} transform={`translate(0 ${drop})`} fill={color} stroke="#FFFFFF" strokeWidth="6" strokeLinejoin="round" />
        <path d={path} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
        <circle cx="230" cy={56 + drop} r="22" fill={color} stroke="#FFFFFF" strokeWidth="5" />
      </g>
    );
  };
  // The left player's arrow arcs over the pair and the right player's arrow under it, so together they close a circle.
  const arrowLayer = (above: boolean, answer: boolean | null, leftToRight: boolean) => {
    if (answer === null) return null;
    return (
      <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 z-10 h-[11cqmin]", above ? "bottom-[88%]" : "top-[76%]")}>
        <svg viewBox="0 0 460 130" className={cn("h-full w-full overflow-visible", above && "-scale-y-100")}>{arrow(answer, leftToRight, 0)}</svg>
        <span className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[3.4cqmin] leading-none" style={{ top: above ? `${100 - (56 / 130) * 100}%` : `${(56 / 130) * 100}%` }}>{answer ? "💋" : <b className="text-white">✕</b>}</span>
      </div>
    );
  };
  return (
    <div className={cn("flex h-full w-full bg-surface text-text", wide ? "flex-row" : "flex-col")}>
      <div className={cn("relative shrink-0 overflow-hidden bg-[#D08A3C] [background-image:radial-gradient(ellipse_at_50%_45%,rgba(255,214,140,0.75)_0%,rgba(255,190,100,0.25)_45%,rgba(120,60,10,0.35)_100%),repeating-linear-gradient(92deg,rgba(120,65,15,0.14)_0px,rgba(120,65,15,0)_3px,rgba(255,225,170,0.10)_7px,rgba(120,65,15,0.12)_11px,rgba(120,65,15,0)_19px),repeating-linear-gradient(88deg,rgba(90,45,5,0.10)_0px,rgba(90,45,5,0)_40px,rgba(90,45,5,0.08)_83px)] [container-type:size]", wide ? "h-full w-[54%]" : "aspect-square max-h-[58%] w-full")} onClick={() => setPicked(null)}>
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col items-center text-white" title={t("bottle.hearts")}>
          <Heart size={36} fill="#FF6A1F" stroke="#FFFFFF" strokeWidth={1.5} />
          <span className="text-base font-bold tabular-nums [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">12</span>
        </div>
        <button onClick={onLeave} aria-label={t("bottle.leave")} title={t("bottle.leave")} className={cn(round, "absolute right-2.5 top-2.5 z-10")}><X size={20} /></button>
        <div className="absolute bottom-2.5 left-2.5 z-10 flex flex-col items-center gap-1">
          <span aria-hidden="true" className={cn(round, "text-lg font-bold tabular-nums", !myTurn && "opacity-60")}>{myTurn ? seconds : "⟳"}</span>
          <span className="text-[11px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">{t("bottle.table")} 60</span>
        </div>
        <div className="absolute bottom-2.5 right-2.5 z-10 flex flex-col gap-2">
          <button onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={t(sound ? "videos.mute" : "videos.unmute")} title={t(sound ? "videos.mute" : "videos.unmute")} className={round}>{sound ? <Volume2 size={19} /> : <VolumeX size={19} />}</button>
          <button onClick={onToggleFull} aria-label={t("bottle.fullscreen")} title={t("bottle.fullscreen")} className={round}>{full ? <Minimize size={18} /> : <Maximize size={18} />}</button>
        </div>

        <button type="button" disabled={!myTurn} onClick={spin} aria-label={t("bottle.spin")} className={cn("absolute left-1/2 top-1/2 h-[40cqmin] transition-transform duration-[3200ms] ease-[cubic-bezier(0.15,0.6,0.2,1)] motion-reduce:duration-0", myTurn ? "z-20 cursor-pointer" : "pointer-events-none")} style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}>
          <BottleSvg className={cn("h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] transition-opacity duration-300", staged && "opacity-0")} />
        </button>
        {myTurn ? <p role="status" className="pointer-events-none absolute left-1/2 top-[calc(50%+22cqmin)] z-20 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-full bg-white px-[3cqmin] py-[1cqmin] text-[3.2cqmin] font-bold text-[#C2410C] shadow-lg motion-reduce:animate-none">↑ {t("bottle.clickBottle")}</p> : null}

        {players.map((player, index) => {
          const active = index === turn || index === target;
          return (
            <div key={player.id} className={cn("absolute w-[17cqmin] -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-500 motion-reduce:duration-0", staged && active && "pointer-events-none z-30")} style={staged && active ? { left: `calc(50% ${index === turn ? "-" : "+"} 14.5cqmin)`, top: `${STAGE_Y}%` } : { left: `${seats[index][0]}%`, top: `${seats[index][1]}%` }}>
              <button type="button" disabled={player.me} onClick={(event) => { event.stopPropagation(); setPicked(picked === index ? null : index); }} aria-label={`${player.name}, ${player.age}`} className={cn("relative block aspect-square w-full rounded-[14%] bg-surface-2 shadow-[0_4px_10px_rgba(0,0,0,0.4)]", active ? "ring-4 ring-white" : player.me ? "ring-2 ring-white/80" : "")}>
                <img src={player.avatar} alt="" className="h-full w-full rounded-[14%] object-cover" />
                {kisses[player.id] ? <span className="absolute -right-[1.2cqmin] -top-[1.2cqmin] flex h-[4.6cqmin] min-w-[4.6cqmin] items-center justify-center rounded-full bg-[#E5334B] px-1 text-[2.4cqmin] font-bold tabular-nums text-white shadow">{kisses[player.id]}</span> : null}
                {(stickers[player.id] ?? []).map((gift, position) => <GiftArt key={`${gift}-${position}`} id={gift} className={cn("absolute -bottom-[1.6cqmin] h-[48%] w-[48%] drop-shadow", position ? "-left-[1.6cqmin]" : "-right-[1.6cqmin]")} />)}
              </button>
              <p className="mt-0.5 truncate text-center text-[2.7cqmin] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">{player.me ? t("common.you") : player.name}, {player.age}</p>
              {index === turn && !staged ? <p className={cn("absolute top-full whitespace-nowrap rounded-full bg-black/45 px-[1.6cqmin] text-[2.3cqmin] font-semibold text-white", seats[index][0] > 75 ? "right-0" : seats[index][0] < 25 ? "left-0" : "left-1/2 -translate-x-1/2")}>↑ {t("bottle.spinsBottle")}</p> : null}
              {picked === index ? (
                <div role="menu" onClick={(event) => event.stopPropagation()} className={cn("absolute z-40 grid w-[232px] grid-cols-5 gap-1 rounded-xl border border-border bg-surface p-1.5 shadow-lg", seats[index][1] > 60 ? "bottom-full mb-1" : "top-full mt-1", seats[index][0] > 60 ? "right-0" : seats[index][0] < 40 ? "left-0" : "left-1/2 -translate-x-1/2")}>
                  {giftChoices.map((gift) => <button key={gift} role="menuitem" onClick={() => sendGift(index, gift)} aria-label={t("gifts.send")} className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface-2"><GiftArt id={gift} className="h-8 w-8" /></button>)}
                </div>
              ) : null}
            </div>
          );
        })}

        {flying ? <div className="pointer-events-none absolute z-40 h-[11cqmin] w-[11cqmin] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_10px_rgba(255,240,150,0.95)] transition-[left,top] duration-700 ease-out" style={{ left: `${seats[flying.moved ? flying.to : meIndex][0]}%`, top: `${seats[flying.moved ? flying.to : meIndex][1]}%` }}><GiftArt id={flying.gift} className="h-full w-full" /></div> : null}

        {staged && target !== null ? (
          <>
            <p role="status" className="pointer-events-none absolute left-1/2 z-30 w-[60cqmin] -translate-x-1/2 text-center text-[3.8cqmin] font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.75)]" style={{ bottom: `calc(${100 - STAGE_Y}% + 16.6cqmin)` }}>
              {phase === "kissed" ? t("bottle.kissed") : phase === "declined" ? t("bottle.declined") : canAnswer ? t("bottle.yourChoice") : myRole ? t("bottle.kissBack") : t("bottle.deciding")}
            </p>
            <div className="pointer-events-none absolute left-1/2 z-30 h-[21cqmin] w-[46cqmin] -translate-x-1/2 -translate-y-1/2" style={{ top: `${STAGE_Y}%` }}>
              {deciding
                ? <span aria-label={`${seconds}`} className="absolute left-1/2 top-[22%] -translate-x-1/2 text-[7cqmin] font-bold tabular-nums leading-none text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.75)]">{seconds}</span>
                : <Heart className="absolute left-1/2 top-[24%] h-[7cqmin] w-[7cqmin] -translate-x-1/2" fill={phase === "kissed" ? "#FF4D6A" : "none"} stroke="#FFFFFF" strokeWidth={1.8} />}
              {arrowLayer(true, answers.spinner, true)}
              {arrowLayer(false, answers.target, false)}
            </div>
            {canAnswer && myRole ? (
              <div className="absolute left-1/2 z-30 flex -translate-x-1/2 gap-[2.5cqmin]" style={{ top: `calc(${STAGE_Y}% + 14.5cqmin)` }}>
                <button onClick={() => setAnswers((value) => ({ ...value, [myRole]: false }))} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#E2401F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.no")}</button>
                <button onClick={() => setAnswers((value) => ({ ...value, [myRole]: true }))} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#8CC63F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.yes")}</button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col border-border", wide ? "border-l" : "border-t")}>
        {video ? (
          <div className={cn("relative aspect-video w-full shrink-0 bg-black", wide ? "max-h-[42%]" : "max-h-[24%]")}>
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
