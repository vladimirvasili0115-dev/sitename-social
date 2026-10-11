"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Heart, Home, Maximize, Menu, Minimize, Music, Music2, RefreshCw, SendHorizontal, Settings, Trophy, UserPlus, UserRoundCog, Users, Volume2, X } from "lucide-react";
import type { GiftId } from "@/types";
import { cartoonAvatar } from "./avatarArt";
import { useTranslation } from "@/i18n/useTranslation";
import { GiftArt } from "@/components/gifts/GiftArt";
import { useProfile } from "@/components/profile/useProfile";
import { cn } from "@/lib/utils";
import { BottleSvg, WoodTable } from "./BottleArt";
import { playSound, setVolume } from "./sound";

type Player = { id: string; name: string; age: number; female: boolean; avatar: string; me?: boolean };
type Phase = "waiting" | "spinning" | "choice" | "kissed" | "declined";
type Line = { id: number; from: string; to?: string; text?: string; gift?: GiftId };

// Seat centres in percent of the table. Wide: a tool column on the left, seats in a rectangle. Tall (phone, window): a tool row on top, seats in an oval.
type Seats = readonly (readonly [number, number])[];
const layouts: Record<"wide" | "tall", { seats: Seats; cx: number; cy: number }> = {
  wide: { seats: [[29, 15], [48.5, 15], [68, 15], [87, 15], [91, 39.5], [91, 62.5], [87, 85], [68, 85], [48.5, 85], [29, 85], [26, 62.5], [26, 39.5]], cx: 58.5, cy: 50 },
  tall: { seats: [[17, 26], [39, 21], [61, 21], [83, 26], [87, 46], [87, 65.5], [83, 85], [61, 89.5], [39, 89.5], [17, 85], [13, 65.5], [13, 46]], cx: 50, cy: 55 },
};
const bots: Omit<Player, "avatar">[] = [
  { id: "b1", name: "Leyla", age: 24, female: true }, { id: "b2", name: "Rəşad", age: 27, female: false }, { id: "b3", name: "Nigar", age: 22, female: true },
  { id: "b4", name: "Samir", age: 29, female: false }, { id: "b5", name: "Mina", age: 21, female: true }, { id: "b6", name: "Kamran", age: 31, female: false },
  { id: "b7", name: "Aysel", age: 26, female: true }, { id: "b8", name: "Tural", age: 25, female: false }, { id: "b9", name: "Günay", age: 23, female: true },
  { id: "b10", name: "Elvin", age: 28, female: false }, { id: "b11", name: "Səbinə", age: 27, female: true },
];
const smallTalk = ["Salam hamıya 👋", "Bu gün bəxtim gətirir 😄", "Kim fırladır?", "Çay içən var? ☕", "Hahaha", "Bir də fırlat!", "Bakıdan kim var?", "Gecəniz xeyrə 🌙"];
const giftChoices: [GiftId, number][] = [["crown", 3], ["diamond", 3], ["ring", 3], ["tower", 2], ["tar", 2], ["buta", 2], ["heart", 1], ["rose", 1], ["flame", 1], ["tea", 1], ["nar", 1], ["paxlava", 1], ["shekerbura", 1], ["semeni", 1], ["xaribulbul", 1]];
const SPIN_SECONDS = 8;
const ANSWER_SECONDS = 9;
const tool = "flex h-[min(44px,8.5cqmin)] w-[min(44px,8.5cqmin)] shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] hover:bg-white/30";
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
  const { seats, cx: CENTER_X, cy: STAGE_Y } = layouts[wide ? "wide" : "tall"];
  const angleTo = useCallback((index: number) => (Math.atan2(seats[index][1] - STAGE_Y, seats[index][0] - CENTER_X) * 180) / Math.PI + 90, [seats, CENTER_X, STAGE_Y]);

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
  const [volume, setVolumeLevel] = useState(80);
  const [music, setMusic] = useState(60);
  const [accept, setAccept] = useState(true);
  const [panel, setPanel] = useState<"settings" | "top" | "rules" | null>(null);
  const [tableNo, setTableNo] = useState(60);
  const [copied, setCopied] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [hearts, setHearts] = useState(12);
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
    const options = players.map((_, index) => index).filter((index) => index !== turn && players[index].female !== spinner.female && (accept || index !== meIndex));
    const next = options[Math.floor(Math.random() * options.length)];
    setTarget(next);
    setAnswers({ spinner: null, target: null });
    setRotation((current) => current - (current % 360) + 1440 + (((angleTo(next) % 360) + 360) % 360));
    setPhase("spinning");
  }, [players, turn, angleTo, accept]);

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
  useEffect(() => setVolume(volume / 100), [volume]);
  const pushMusic = useCallback(() => frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [music] }), "*"), [music]);
  useEffect(pushMusic, [pushMusic, video]);
  const byId = (id: string) => players.find((player) => player.id === id);
  const staged = phase !== "waiting" && phase !== "spinning" && target !== null;
  const myRole: "spinner" | "target" | null = staged ? (turn === meIndex ? "spinner" : target === meIndex ? "target" : null) : null;
  const canAnswer = deciding && myRole !== null && answers[myRole] === null;
  const myTurn = phase === "waiting" && turn === meIndex;

  function changeTable() {
    setTableNo(1 + Math.floor(Math.random() * 240));
    setKisses({});
    setStickers({});
    setLines([]);
    setPicked(null);
    setTarget(null);
    setTurn(Math.floor(Math.random() * players.length));
    setPhase("waiting");
  }
  function invite() {
    void navigator.clipboard?.writeText(`${window.location.origin}/games`).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 2000); });
  }
  const ranking = players.map((player) => ({ player, count: kisses[player.id] ?? 0 })).sort((a, b) => b.count - a.count);
  const row = "flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm text-[#1F2937] hover:bg-black/5";
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
  function sendGift(index: number, gift: GiftId, price: number) {
    const player = players[index];
    if (hearts < price) return;
    setHearts(hearts - price);
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
      <div className={cn("relative shrink-0 overflow-hidden bg-[#E0A04E] [container-type:size]", wide ? "h-full w-[54%]" : "aspect-[9/10] max-h-[60%] w-full")} onClick={() => setPicked(null)}>
        <WoodTable className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className={cn("absolute z-10 flex items-center", wide ? "inset-y-0 left-0 w-[13%] flex-col gap-[2.2cqmin] py-[2.2cqmin]" : "inset-x-0 top-0 h-[10%] gap-[2.6cqmin] px-[2.5cqmin]")} onClick={(event) => event.stopPropagation()}>
          <div className={cn("flex items-center text-white", wide ? "flex-col" : "gap-1.5")} title={t("bottle.hearts")}>
            <Heart className="h-[8.5cqmin] max-h-11 w-[8.5cqmin] max-w-11" fill="#FF6A1F" stroke="#FFFFFF" strokeWidth={1.5} />
            <span className="text-[max(12px,2.6cqmin)] font-bold tabular-nums leading-tight [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{hearts}</span>
          </div>
          <span className="flex-1" />
          <button onClick={onToggleFull} aria-label={t("bottle.fullscreen")} title={t("bottle.fullscreen")} className={tool}>{full ? <Minimize size={17} /> : <Maximize size={17} />}</button>
          <button onClick={() => setPanel("top")} aria-label={t("bottle.top")} title={t("bottle.top")} className={tool}><Trophy size={18} /></button>
          <button onClick={() => setPanel("rules")} aria-label={t("bottle.rules")} title={t("bottle.rules")} className={tool}><Menu size={18} /></button>
          <button onClick={() => setPanel("settings")} aria-label={t("bottle.settings")} title={t("bottle.settings")} className={tool}><Settings size={18} /></button>
          <span className="flex-1" />
          <span className="text-center text-[max(10px,2.2cqmin)] font-bold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">{t("bottle.table")}<br />{tableNo}</span>
          {myTurn
            ? <span aria-label={`${seconds}`} className={cn(tool, "text-[max(14px,3cqmin)] font-bold tabular-nums")}>{seconds}</span>
            : <button onClick={changeTable} aria-label={t("bottle.changeTable")} title={t("bottle.changeTable")} className={tool}><RefreshCw size={17} /></button>}
        </div>

        <button type="button" disabled={!myTurn} onClick={spin} aria-label={t("bottle.spin")} className={cn("absolute h-[30cqmin] transition-transform duration-[3200ms] ease-[cubic-bezier(0.15,0.6,0.2,1)] motion-reduce:duration-0", myTurn ? "z-20 cursor-pointer" : "pointer-events-none")} style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}>
          <BottleSvg className={cn("h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] transition-opacity duration-700", staged && "opacity-0")} />
        </button>
        {myTurn ? <div className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%` }}><p role="status" className="animate-bounce whitespace-nowrap rounded-full bg-white px-[3cqmin] py-[1cqmin] text-[3.2cqmin] font-bold text-[#C2410C] shadow-lg motion-reduce:animate-none">{t("bottle.clickBottle")}</p></div> : null}

        {phase === "waiting" && !myTurn ? <p className="pointer-events-none absolute w-[40cqmin] -translate-x-1/2 -translate-y-1/2 text-center text-[3.4cqmin] font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.85)]" style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%` }}>{t("bottle.waitingSpin")}</p> : null}

        {players.map((player, index) => {
          const active = index === turn || index === target;
          return (
            <div key={player.id} className={cn("absolute w-[17cqmin] -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-[1100ms] ease-in-out motion-reduce:duration-0", staged && active ? "pointer-events-none z-30" : index === turn && "z-10")} style={staged && active ? { left: `calc(${CENTER_X}% ${index === turn ? "-" : "+"} 12.5cqmin)`, top: `${STAGE_Y}%` } : { left: `${seats[index][0]}%`, top: `${seats[index][1]}%` }}>
              <button type="button" disabled={player.me} onClick={(event) => { event.stopPropagation(); setPicked(picked === index ? null : index); }} aria-label={`${player.name}, ${player.age}`} className={cn("relative block aspect-square w-full rounded-[14%] bg-surface-2 shadow-[0_4px_10px_rgba(0,0,0,0.4)]", staged && index === target ? "ring-[0.9cqmin] ring-[#FFE2A8]" : active ? "ring-4 ring-white" : picked === index ? "ring-4 ring-[#8CC63F]" : player.me ? "ring-2 ring-white/80" : "")}>
                <img src={player.avatar} alt="" className="h-full w-full rounded-[14%] object-cover" />
                {kisses[player.id] ? <span className="absolute -right-[1.2cqmin] -top-[1.2cqmin] flex h-[4.6cqmin] min-w-[4.6cqmin] items-center justify-center rounded-full bg-[#E5334B] px-1 text-[2.4cqmin] font-bold tabular-nums text-white shadow">{kisses[player.id]}</span> : null}
                {(stickers[player.id] ?? []).map((gift, position) => <GiftArt key={`${gift}-${position}`} id={gift} className={cn("absolute -bottom-[1.6cqmin] h-[48%] w-[48%] drop-shadow", position ? "-left-[1.6cqmin]" : "-right-[1.6cqmin]")} />)}
              </button>
              <p className="mt-0.5 truncate text-center text-[2.7cqmin] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">{player.me ? t("common.you") : player.name}, {player.age}</p>
              {index === turn && !staged ? <p className={cn("absolute top-full whitespace-nowrap rounded-full bg-black/45 px-[1.6cqmin] text-[2.3cqmin] font-semibold text-white", seats[index][0] > 75 ? "right-0" : seats[index][0] < 25 ? "left-0" : "left-1/2 -translate-x-1/2")}>↑ {t("bottle.spinsBottle")}</p> : null}
            </div>
          );
        })}

        {flying ? <div className="pointer-events-none absolute z-40 h-[11cqmin] w-[11cqmin] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_10px_rgba(255,240,150,0.95)] transition-[left,top] duration-700 ease-out" style={{ left: `${seats[flying.moved ? flying.to : meIndex][0]}%`, top: `${seats[flying.moved ? flying.to : meIndex][1]}%` }}><GiftArt id={flying.gift} className="h-full w-full" /></div> : null}

        {staged && target !== null ? (
          <>
            <p role="status" className="pointer-events-none absolute z-30 w-[44cqmin] -translate-x-1/2 text-center text-[3.8cqmin] font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.75)]" style={{ left: `${CENTER_X}%`, bottom: `calc(${100 - STAGE_Y}% + 16.6cqmin)` }}>
              {phase === "kissed" ? t("bottle.kissed") : phase === "declined" ? t("bottle.declined") : canAnswer ? t("bottle.yourChoice") : myRole ? t("bottle.kissBack") : t("bottle.willKiss")}
            </p>
            <div className="pointer-events-none absolute z-30 h-[21cqmin] w-[42cqmin] -translate-x-1/2 -translate-y-1/2" style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%` }}>
              {deciding
                ? <span aria-label={`${seconds}`} className="absolute left-1/2 top-[22%] -translate-x-1/2 text-[7cqmin] font-bold tabular-nums leading-none text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.75)]">{seconds}</span>
                : <Heart className="absolute left-1/2 top-[24%] h-[7cqmin] w-[7cqmin] -translate-x-1/2" fill={phase === "kissed" ? "#FF4D6A" : "none"} stroke="#FFFFFF" strokeWidth={1.8} />}
              {arrowLayer(true, answers.spinner, true)}
              {arrowLayer(false, answers.target, false)}
            </div>
            {canAnswer && myRole ? (
              <div className="absolute z-30 flex -translate-x-1/2 gap-[2.5cqmin]" style={{ left: `${CENTER_X}%`, top: `calc(${STAGE_Y}% + 14.5cqmin)` }}>
                <button onClick={() => setAnswers((value) => ({ ...value, [myRole]: false }))} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#E2401F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.no")}</button>
                <button onClick={() => setAnswers((value) => ({ ...value, [myRole]: true }))} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#8CC63F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.yes")}</button>
              </div>
            ) : null}
          </>
        ) : null}

        {panel ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-3" onClick={(event) => { event.stopPropagation(); setPanel(null); }}>
            <div role="dialog" aria-modal="true" aria-label={t(`bottle.${panel}`)} onClick={(event) => event.stopPropagation()} className="relative max-h-full w-full max-w-[340px] rounded-2xl bg-white p-3 shadow-2xl">
              <button onClick={() => setPanel(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8CC63F] bg-white text-[#8CC63F] shadow"><X size={18} strokeWidth={3} /></button>
              <p className="mb-1 text-center text-sm font-bold text-[#9CA3AF]">{t(`bottle.${panel}`)}</p>
              {panel === "settings" ? (
                <div className="max-h-[70cqmin] overflow-y-auto">
                  <label className={cn(row, "cursor-pointer font-bold")}>
                    <span aria-hidden="true" className="w-6 text-center text-lg">💋</span><span className="flex-1">{t("bottle.acceptKisses")}</span>
                    <input type="checkbox" checked={accept} onChange={(event) => setAccept(event.target.checked)} className="peer sr-only" />
                    <span className="relative h-7 w-12 rounded-full bg-[#D1D5DB] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-[#34C759] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#2563EB]" />
                  </label>
                  <button onClick={onLeave} className={row}><Home size={20} className="w-6 text-[#3B82F6]" />{t("bottle.backLobby")}</button>
                  <label className={row}><Volume2 size={20} className="w-6 shrink-0 text-[#8CC63F]" /><span className="flex-1">{t("bottle.sounds")}</span><input type="range" min={0} max={100} value={volume} onChange={(event) => setVolumeLevel(Number(event.target.value))} className="w-24 accent-[#8CC63F]" /></label>
                  <label className={row}><Music size={20} className="w-6 shrink-0 text-[#EC4899]" /><span className="flex-1">{t("bottle.music")}</span><input type="range" min={0} max={100} value={music} onChange={(event) => setMusic(Number(event.target.value))} className="w-24 accent-[#8CC63F]" /></label>
                  <button onClick={invite} className={row}><UserPlus size={20} className="w-6 text-[#8CC63F]" />{copied ? t("bottle.copied") : t("bottle.invite")}</button>
                  <Link href="/friends" className={row}><Users size={20} className="w-6 text-[#3B82F6]" />{t("bottle.myFriends")}</Link>
                  <Link href="/settings" className={row}><UserRoundCog size={20} className="w-6 text-[#3B82F6]" />{t("bottle.profileSettings")}</Link>
                </div>
              ) : panel === "top" ? (
                <ol className="max-h-[70cqmin] overflow-y-auto">
                  {ranking.map(({ player, count }, place) => (
                    <li key={player.id} className="flex min-h-10 items-center gap-2 px-1 text-sm text-[#1F2937]">
                      <span className="w-5 text-right font-bold tabular-nums text-[#9CA3AF]">{place + 1}</span>
                      <img src={player.avatar} alt="" className="h-8 w-8 rounded-md object-cover" />
                      <span className="min-w-0 flex-1 truncate font-semibold">{player.me ? t("common.you") : player.name}</span>
                      <span className="font-bold tabular-nums">💋 {count}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="max-h-[70cqmin] list-decimal space-y-1.5 overflow-y-auto pl-6 pr-1 text-sm text-[#1F2937]">
                  {[1, 2, 3, 4].map((n) => <li key={n}>{t(`bottle.rule${n}` as "bottle.rule1")}</li>)}
                </ol>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col border-border", wide ? "border-l" : "border-t")}>
        {video ? (
          <div className={cn("relative aspect-video w-full shrink-0 bg-black", wide ? "max-h-[42%]" : "max-h-[24%]")}>
            <iframe ref={frameRef} onLoad={() => window.setTimeout(pushMusic, 800)} src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0&enablejsapi=1`} title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
            <button onClick={() => setVideo(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"><X size={15} /></button>
          </div>
        ) : null}
        <form onSubmit={handleVideo} className="flex items-center gap-2 border-b border-border p-2.5">
          <Music2 size={20} className="shrink-0 text-[#FF3B30]" />
          <input value={link} onChange={(event) => { setLink(event.target.value); setBadLink(false); }} aria-label={t("bottle.videoLink")} placeholder={t("bottle.videoLink")} autoComplete="off" className={cn("h-10 min-w-0 flex-1 rounded-full border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent", badLink ? "border-danger" : "border-border")} />
          <button type="submit" disabled={!link.trim()} className="h-10 shrink-0 rounded-full bg-accent px-4 text-xs font-bold text-bg disabled:opacity-40">{t("bottle.videoPlay")}</button>
        </form>
        <p className="border-b border-border px-3 py-1.5 text-[11px] text-muted">{t("bottle.demoNote")}</p>
        {picked !== null ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <img src={players[picked].avatar} alt="" className="h-9 w-9 rounded-md object-cover" />
              <p className="min-w-0 flex-1 text-xs text-muted">{t("gifts.send")}<span className="block truncate text-sm font-bold text-text">{players[picked].name}</span></p>
              <button onClick={() => setPicked(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8CC63F] text-white hover:brightness-110"><X size={17} /></button>
            </div>
            <div role="menu" className="grid min-h-0 flex-1 grid-cols-3 content-start gap-1 overflow-y-auto p-2 sm:grid-cols-3">
              {giftChoices.map(([gift, price]) => (
                <button key={gift} role="menuitem" disabled={hearts < price} onClick={() => sendGift(picked, gift, price)} aria-label={`${t("gifts.send")} ${price}`} className="flex flex-col items-center gap-0.5 rounded-xl p-2 hover:bg-surface-2 disabled:opacity-35">
                  <GiftArt id={gift} className="h-12 w-12" />
                  <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-text"><Heart size={12} fill="#FF6A1F" stroke="none" />{price}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div ref={listRef} className={cn("min-h-0 flex-1 space-y-2 overflow-y-auto p-3", picked !== null && "hidden")}>
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
        <form onSubmit={handleChat} className={cn("flex items-center gap-2 border-t border-border p-2.5", picked !== null && "hidden")}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={200} aria-label={t("messages.placeholder")} placeholder={t("messages.placeholder")} autoComplete="off" className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
          <button type="submit" disabled={!draft.trim()} aria-label={t("messages.send")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EE8A2B] text-white disabled:opacity-40"><SendHorizontal size={17} /></button>
        </form>
      </div>
    </div>
  );
}
