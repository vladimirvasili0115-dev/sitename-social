"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Link from "next/link";
import { AtSign, LifeBuoy, Pause, Play, Clock, Flame, Search, Star, Ban, Flag, Mail, Gift as GiftIcon, Heart, Home, Maximize, ArrowUpRight, BadgeCheck, Crown, DoorOpen, Eye, EyeOff, KeyRound, Lock, Mars, Trash2, Venus, BookOpen, MessageSquare, Check, Menu, UserRound, Minimize, Music, Plus, UserCheck, Music2, RefreshCw, SendHorizontal, Settings, Trophy, UserPlus, UserRoundCog, Users, Volume2, VolumeX, X } from "lucide-react";
import type { GiftId } from "@/types";
import { cartoonAvatar } from "./avatarArt";
import { useTranslation } from "@/i18n/useTranslation";
import { GiftArt } from "@/components/gifts/GiftArt";
import { useProfile } from "@/components/profile/useProfile";
import { cn } from "@/lib/utils";
import { customFile, useCustomArt } from "@/lib/customArt";
import { durationSeconds, rankSongs, songScore } from "@/lib/songSearch";
import { HeartBurst } from "./PourTube";
import { Fireworks, fireworksLevel } from "./Fireworks";
import { GESTURES, GIFT_PRICES, GIFT_RULES, missing, type Progress, type RuleKind } from "./giftRules";
import { customGiftNames, customPlace, customPrice, landedName, isDrink } from "./customGifts";
const landed = (gift: string) => (gift.startsWith("c:") ? `c:${landedName(gift.slice(2))}` : gift);
import { AchievementsPanel } from "./AchievementsPanel";
import { FIRST_ORIGINAL, FRAME_PRICE, FrameArt, ORIGINAL_FRAMES, frameLooks, frameStone } from "./FrameArt";
import { PassPanel, type PassData } from "./PassPanel";
import { ActivePanel, ComplimentPill, ComplimentsPanel, InvitePanel, ShopPanel, emojiSrc } from "./ShopPanels";
import { bumpStat, markVisit, readStats, syncStats } from "./achievements";
import { BottleSvg, WaterBottleSvg, WoodTable } from "./BottleArt";
import { playGiftSound, playSfx, playSound, setVolume } from "./sound";
import { supabase } from "@/lib/supabase";
import { ensureMessagesLoaded, openRemoteChat, remoteChats, sendRemoteMessage } from "@/lib/messagesSync";
import { uploadBlob } from "@/lib/media";
import { bottleAnswer, bottleAchSync, bottleGesture, bottleProgress, bottleSkin, bottleBuyChances, bottleJoin, bottleMove, bottleRejoin, bottleQueueLeave, bottleActiveClaim, bottleAdmire, bottleAdmireLeave, bottleGiftShare, bottlePass, bottlePassBuy, bottlePassChest, bottlePassClaim, bottleCompliment, bottleFrame, bottleKick, bottleRefSet, bottleRefStatus, bottleSave, bottleGift, bottlePlay, bottleRoomCreate, bottleRoomDelete, bottleRoomJoin, bottleRoomsList, type BottleRooms, bottleTables, bottleTop, type BottleTop, bottleWheel, type BottleTables, bottleLeave, bottleSay, bottleSpend, bottleSpin, bottleSync, type BottleState } from "@/lib/bottleSync";

type Player = { id: string; name: string; age: number; female: boolean; avatar: string; me?: boolean; empty?: boolean; zodiac?: number | null };
type Phase = "waiting" | "spinning" | "choice" | "kissed" | "declined";
type Track = { id: string; title: string; duration?: string };
const stored = (key: string): Track[] => { try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as Track[]; } catch { return []; } };
const keep = (key: string, list: Track[]) => { try { window.localStorage.setItem(key, JSON.stringify(list.slice(0, 40))); } catch { /* storage is full or blocked */ } };
type Line = { id: number; from: string; to?: string; tos?: string[]; gesture?: string; count?: number; bottle?: { a: number; b: number }; text?: string; gift?: string; song?: string; admire?: { amount?: number; by?: string; avatar?: string; target?: string; lost?: boolean }; event?: { kind: "kick" | "saved" | "kicked"; a: string; b: string } };
// The same gift sent again and again by the same person makes one chat line "🌹 ×5 » receivers" instead of many lines.
function mergeLines(list: Line[], fresh: Line[]) {
  const out = [...list];
  for (const line of fresh) {
    const last = out[out.length - 1];
    if (line.gift && line.to && last && last.gift === line.gift && last.from === line.from && !last.text) {
      const tos = [...(last.tos ?? (last.to ? [last.to] : []))];
      if (!tos.includes(line.to)) tos.push(line.to);
      out[out.length - 1] = { ...last, tos, count: (last.count ?? 1) + 1 };
      continue;
    }
    out.push(line);
  }
  return out;
}

// Seat centres in percent of the table. Wide: a tool column on the left, seats in a rectangle. Tall (phone, window): a tool row on top, seats in an oval.
type Seats = readonly (readonly [number, number])[];
const layouts: Record<"wide" | "tall", { seats: Seats; cx: number; cy: number }> = {
  wide: { seats: [[24, 17.8], [44, 12.6], [64.2, 12.6], [84.3, 17.8], [88, 39.8], [88, 61.3], [84.3, 83.2], [64.2, 88.5], [44, 88.5], [24, 83.2], [20.2, 61.3], [20.2, 39.8]], cx: 54.1, cy: 48.7 },
  tall: { seats: [[17, 26], [39, 21], [61, 21], [83, 26], [87, 46], [87, 65.5], [83, 85], [61, 89.5], [39, 89.5], [17, 85], [13, 65.5], [13, 46]], cx: 50, cy: 55 },
};
const bots: Omit<Player, "avatar">[] = [
  { id: "b1", name: "Leyla", age: 24, female: true }, { id: "b2", name: "Rəşad", age: 27, female: false }, { id: "b3", name: "Nigar", age: 22, female: true },
  { id: "b4", name: "Samir", age: 29, female: false }, { id: "b5", name: "Mina", age: 21, female: true }, { id: "b6", name: "Kamran", age: 31, female: false },
  { id: "b7", name: "Aysel", age: 26, female: true }, { id: "b8", name: "Tural", age: 25, female: false }, { id: "b9", name: "Günay", age: 23, female: true },
  { id: "b10", name: "Elvin", age: 28, female: false }, { id: "b11", name: "Səbinə", age: 27, female: true },
];
const smallTalk = ["Salam hamıya 👋", "Bu gün bəxtim gətirir 😄", "Kim fırladır?", "Çay içən var? ☕", "Hahaha", "Bir də fırlat!", "Bakıdan kim var?", "Gecəniz xeyrə 🌙"];
const giftChoices: [string, number][] = [
  ["song:video", 9], ["song:mp3", 5], ["crown", 3], ["e:👑", 3], ["e:🤴", 3], ["e:👸", 3], ["e:💋", 1], ["diamond", 1], ["e:🍓", 1], ["e:🍅", 1], ["e:🐸", 2], ["rose", 1], ["e:🍬", 1], ["e:🦆", 1], ["e:🐿️", 1], ["e:🦛", 1], ["e:🐧", 1], ["e:🐵", 1], ["e:💐", 1], ["e:🌼", 1], ["e:🪴", 1], ["e:🌵", 1], ["e:🍨", 1], ["e:🍰", 1], ["e:🥛", 1], ["e:🍷", 1], ["e:🥃", 1], ["e:🍵", 1], ["tea", 1], ["e:🥒", 3], ["e:☕", 1], ["e:🥂", 1], ["e:🍺", 1], ["e:🍸", 1], ["e:🍹", 1], ["e:🧸", 1], ["e:🧣", 1], ["e:⛑️", 2], ["e:🤠", 2], ["e:🧢", 2], ["e:👽", 2], ["e:🐻", 2], ["e:🐮", 2], ["e:🔥", 2], ["e:🐱", 2], ["e:🕶️", 2], ["e:🐞", 2], ["e:😈", 2], ["e:🐰", 2], ["e:🦌", 2], ["e:🦋", 2], ["e:🎀", 2], ["e:🌸", 2], ["e:💝", 2], ["e:🪖", 2], ["e:🎲", 1],
];
// The wheel of fortune: 16 sectors clockwise from the top. The database does the real draw with its own odds; the weights here are only used by the offline demo.
const wheelSectors: { hearts?: number; chances?: number; kisses?: number; smiles?: number; weight: number }[] = [
  { hearts: 1000, weight: 30 }, { hearts: 1, weight: 900 }, { kisses: 1, weight: 900 }, { hearts: 25, weight: 400 }, { hearts: 3, weight: 1300 }, { chances: 1, weight: 1300 }, { hearts: 100, weight: 100 }, { smiles: 1, weight: 700 },
  { kisses: 3, weight: 500 }, { hearts: 10, weight: 900 }, { weight: 200 }, { chances: 3, weight: 500 }, { hearts: 3, weight: 1070 }, { hearts: 5, weight: 900 }, { kisses: 1, weight: 200 }, { smiles: 3, weight: 100 },
];
const prizeText = (item: (typeof wheelSectors)[number]) => (item.hearts ? `❤️ ${item.hearts}` : item.chances ? `🎲 ${item.chances}` : item.kisses ? `💋 ${item.kisses}` : item.smiles ? `😊 ${item.smiles}` : "");
const chancePacks: [number, number][] = [[300, 900], [50, 150], [15, 45], [5, 20], [1, 5]];
const vipPlans: [number, number][] = [[7, 300], [30, 900], [90, 2200]];
// Put the channel link here (for example "https://t.me/kanal_adi"); while empty, the settings row says it is not set yet.
const TELEGRAM_URL = "";
// Zodiac signs in calendar order starting from Capricorn (22 December).
const zodiacSigns = ["♑", "♒", "♓", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐"];
function zodiacOf(birthday: string | undefined) {
  const [, month, day] = (birthday ?? "").split("-").map(Number);
  if (!month || !day) return null;
  const md = month * 100 + day;
  const ends = [119, 218, 320, 419, 520, 620, 722, 822, 922, 1022, 1121, 1221];
  const index = ends.findIndex((end) => md <= end);
  return index < 0 ? 0 : index;
}
const SONG_PRICE = { video: 9, mp3: 5 };
const lockedGifts: [string, number, number][] = [
  ["e:🥤", 5, 1000], ["e:🃏", 5, 1000], ["e:🫗", 5, 1000], ["e:👒", 5, 1000], ["e:💍", 5, 3000], ["e:🧋", 5, 3000], ["e:🪇", 5, 3000], ["e:🍾", 5, 3000], ["e:⚔️", 5, 3000], ["e:🍶", 5, 3000], ["e:🎓", 5, 3000], ["e:🧁", 5, 3000], ["e:🎩", 5, 7000], ["e:🎖️", 5, 7000], ["e:🍮", 5, 7000], ["e:🗿", 5, 7000], ["e:🏆", 5, 7000], ["e:🍼", 5, 7000], ["e:🍎", 5, 7000], ["e:🎁", 5, 7000], ["e:🎪", 5, 7000], ["e:🧪", 5, 7000], ["e:🪶", 5, 7000], ["e:🏴‍☠️", 5, 7000], ["e:🎤", 5, 15000], ["e:🪆", 5, 15000], ["e:🍯", 5, 15000], ["e:🌶️", 5, 15000], ["e:🪔", 5, 15000], ["e:🦪", 5, 15000], ["e:🫖", 5, 15000], ["e:🎷", 5, 15000], ["e:🎻", 5, 15000], ["e:🎸", 5, 15000], ["e:🥁", 5, 15000], ["e:👠", 5, 15000], ["e:💵", 5, 23000], ["e:🪭", 5, 23000], ["e:🧿", 5, 23000], ["e:🦚", 5, 23000], ["e:🍭", 5, 23000], ["e:🍋", 5, 23000], ["e:🌺", 5, 23000], ["e:🌠", 5, 23000], ["e:🧙", 5, 23000], ["e:🧝", 5, 23000], ["e:🧞", 5, 23000], ["e:🧜", 5, 23000], ["e:🚗", 5, 30000], ["e:🏍️", 5, 30000], ["e:🚁", 5, 30000], ["e:✈️", 5, 30000], ["e:🛸", 5, 30000], ["e:🚜", 5, 30000], ["e:🛷", 5, 30000], ["e:🎠", 5, 30000], ["e:🎡", 5, 30000], ["e:🎯", 5, 30000], ["e:🧩", 5, 30000], ["e:🪁", 5, 30000], ["e:❤️‍🔥", 5, 40000], ["e:💘", 5, 40000], ["e:💌", 5, 40000], ["e:💟", 5, 40000], ["e:💜", 5, 40000], ["e:💛", 5, 40000], ["e:🖤", 5, 40000], ["e:🩵", 5, 40000], ["e:💚", 5, 40000], ["e:🧡", 5, 40000], ["e:💙", 5, 40000], ["e:💔", 5, 40000], ["e:🥇", 4, -1], ["e:🥀", 4, -1], ["e:👢", 4, -1], ["e:🏹", 4, -1], ["e:🐓", 4, -1], ["e:🧲", 4, -1], ["e:🔱", 4, -1], ["e:⭕", 4, -1], ["e:🐎", 4, -1], ["e:🦁", 4, -1], ["e:🐯", 4, -1], ["e:🦄", 4, -1],
];
// Gifts that are worn on the head sit tilted on the top corner of the photo; everything else stands at the bottom.
// Drinks pay the receiver +1 heart (the server does it); the receiver's photo shows a "+1" burst.

const headGifts = new Set(["crown", "e:👑", "e:⛑️", "e:🤠", "e:🧢", "e:🐻", "e:🐮", "e:🐱", "e:🐰", "e:🦌", "e:🎀", "e:🌸", "e:🪖", "e:🕶️", "e:😈", "e:👒", "e:🎩", "e:🎓", "e:🔱"]);
// Gift pictures are glossy 3D emoji (Fluent Emoji 3D, MIT) kept in public/gifts, named by their code points.
const giftEmoji: Record<string, string> = { crown: "👑", diamond: "💎", rose: "🌹" };
const giftSrc = (emoji: string) => `/gifts/${Array.from(emoji).map((char) => char.codePointAt(0)!.toString(16)).filter((hex) => hex !== "fe0f").join("-")}.webp`;
// File name for an own gift picture in public/custom/gifts (e.g. 1f9f8.png for 🧸, tea.png for the tea glass).
export const giftFileName = (id: string): string => (id.startsWith("e:") ? Array.from(id.slice(2)).map((char) => char.codePointAt(0)!.toString(16)).filter((hex) => hex !== "fe0f").join("-") : giftEmoji[id] ? giftFileName(`e:${giftEmoji[id]}`) : id.replace(":", "-"));
// Song titles from YouTube often end with hashtags (#shorts ...): those are dropped. A leading "♫ " marks a song
// from the MP3 tab, "♪ " an own MP3 file (5 hearts); everything else is a YouTube song (9 hearts).
const cleanSong = (raw: string) => raw.replace(/#[^\s#]+/g, "").replace(/\s{2,}/g, " ").trim();
export function songInfo(raw: string) {
  const own = raw.startsWith("♪ ");
  return { title: cleanSong(raw.replace(/^[♫♪] /, "")) || "♪", price: own ? 5 : 9 };
}
// Little dancing bars for the music player.
function Equalizer({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("flex items-end gap-[3px]", className)}>{[0.9, 0.5, 1.1, 0.7, 0.95].map((speed, n) => <span key={n} className="w-[4px] rounded-full bg-[linear-gradient(180deg,#F9A8D4,#EC4899)]" style={{ height: "100%", transformOrigin: "bottom", animation: `eq-bar ${speed}s ease-in-out ${n * 0.12}s infinite alternate` }} />)}</span>;
}
function Gift({ id, className, anim }: { id: string; className?: string; anim?: boolean }) {
  const art = useCustomArt();
  const name = id.startsWith("c:") ? id.slice(2) : giftFileName(id);
  // Animated version (public/custom/anim) where the gift sits on the photo or flies.
  const custom = (anim && customFile(art, `anim/${name}`)) || customFile(art, `gifts/${name}`);
  if (custom) return <img src={custom} alt="" aria-hidden="true" draggable={false} className={cn("select-none object-contain drop-shadow-[0_2px_2px_rgba(60,25,0,0.3)]", className)} />;
  if (id.startsWith("song:")) id = id === "song:video" ? "e:🎬" : "e:🎵";
  if (giftEmoji[id]) id = `e:${giftEmoji[id]}`;
  if (!id.startsWith("e:")) return <GiftArt id={id as GiftId} className={className} />;
  return <img src={giftSrc(id.slice(2))} alt="" aria-hidden="true" draggable={false} className={cn("select-none object-contain drop-shadow-[0_2px_2px_rgba(60,25,0,0.3)]", className)} />;
}
// An own bottle from public/custom/bottles/<n>/: shadow under it, the bottle, then colour and light layers on top.
function LayeredBottle({ set, n, className }: { set: Set<string>; n: number; className?: string }) {
  const layer = (name: string) => customFile(set, `bottles/${n}/${name}`);
  const base = layer("base");
  const main = base ?? layer("normal");
  const shadow = layer("shadow");
  return (
    <span className={cn("relative inline-block aspect-[1/3.2]", className)}>
      {shadow ? <img src={shadow} alt="" draggable={false} className="absolute -inset-[6%] h-[112%] w-[112%] translate-x-[5%] translate-y-[3%] object-contain opacity-80" /> : null}
      {main ? <img src={main} alt="" draggable={false} className="absolute inset-0 h-full w-full object-contain" /> : null}
      {!base && layer("color") ? <img src={layer("color")!} alt="" className="absolute inset-0 h-full w-full object-contain mix-blend-color" /> : null}
      {!base && layer("luminosity") ? <img src={layer("luminosity")!} alt="" className="absolute inset-0 h-full w-full object-contain mix-blend-screen" /> : null}
    </span>
  );
}
// Bottle number n (1–30): an own layered bottle when its pictures exist, otherwise the drawn one.
function SkinArt({ set, n, className }: { set: Set<string>; n: number; className?: string }) {
  if (customFile(set, `bottles/${n}/base`) || customFile(set, `bottles/${n}/normal`)) return <LayeredBottle set={set} n={n} className={className} />;
  return n - 1 >= 15 ? <WaterBottleSvg className={className} /> : <BottleSvg className={className} />;
}
// The kiss counter on a photo is a pair of red lips with the number on it.
function LipsBadge({ count }: { count: number }) {
  return (
    <span className="absolute -right-[1.6cqmin] -top-[1.6cqmin] z-[2] flex h-[5.2cqmin] w-[6.6cqmin] items-center justify-center">
      <svg viewBox="0 0 60 44" aria-hidden="true" className="absolute inset-0 h-full w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
        <defs><linearGradient id="lips-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF4D5E" /><stop offset="1" stopColor="#C8102E" /></linearGradient></defs>
        <path d="M2 21C8 9 17 3 24 6c3 1 4.500 3 6 3s3-2 6-3c7-3 16 3 22 15-5 12-15 21-28 21S7 33 2 21z" fill="url(#lips-red)" />
        <path d="M5 21c8 2 17 3 25 3s17-1 25-3c-7 3-16 5-25 5S12 24 5 21z" fill="#8E0B21" opacity="0.7" />
        <path d="M14 11c4-3 9-3 12 0" stroke="#FFB3BC" strokeWidth="2.500" strokeLinecap="round" fill="none" opacity="0.8" />
      </svg>
      <span className="relative text-[2.5cqmin] font-black tabular-nums leading-none text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.5)]">{count >= 10000 ? `${Math.floor(count / 1000)}k` : count >= 1000 ? `${(Math.floor(count / 100) / 10).toFixed(1)}k` : count}</span>
    </span>
  );
}
const SPIN_SECONDS = 8;
const PILE_MS = 45000;
const ANSWER_SECONDS = 9;
const packs: { hearts: number; price: number; bonus?: number; tag?: "best" | "hit"; art: string }[] = [
  { hearts: 6750, price: 5000, bonus: 35, tag: "best", art: "🛒" }, { hearts: 1350, price: 1000, bonus: 35, art: "🧰" }, { hearts: 650, price: 500, bonus: 30, art: "🛢️" },
  { hearts: 240, price: 200, bonus: 20, tag: "hit", art: "🍯" }, { hearts: 110, price: 100, bonus: 10, art: "👝" }, { hearts: 50, price: 50, art: "🎁" }, { hearts: 10, price: 10, art: "💕" },
];
const tool = "flex h-[min(50px,8cqmin)] w-[min(50px,8cqmin)] shrink-0 items-center justify-center rounded-full bg-[#E3893A]/85 text-white shadow-[0_2px_4px_rgba(90,40,0,0.25)] hover:bg-[#EE9545] [&_svg]:stroke-[2.4]";
function youtubeId(value: string) {
  const match = value.trim().match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/) ?? value.trim().match(/^([A-Za-z0-9_-]{11})$/);
  return match ? match[1] : null;
}

export function BottleGame({ wide, full, onToggleFull, onLeave, dedicate, onDedicate, header }: { wide: boolean; full: boolean; onToggleFull: () => void; onLeave: () => void; dedicate: boolean; onDedicate: (value: boolean) => void; header?: ReactNode }) {
  const { t, locale } = useTranslation();
  const lang = locale === "ka" ? "ka" : locale;
  const { user, details } = useProfile();
  // With the database connected the table is live: real players, and the server decides everything. Without it, the demo with bots runs.
  const online = Boolean(supabase);
  const [net, setNet] = useState<BottleState | null>(null);
  const players = useMemo<Player[]>(() => {
    const me: Player = { id: "me", name: user.name.split(" ")[0], age: 25, female: details.gender === "female", avatar: user.avatar, me: true, zodiac: zodiacOf(details.birthday) };
    if (online) {
      const mine = net?.seats.find((seat) => seat.id === net.me)?.seat ?? 0;
      return Array.from({ length: 12 }, (_, place): Player => {
        const row = net?.seats.find((seat) => seat.seat === (place - 7 + mine + 12) % 12);
        if (!row) return place === 7 && !net ? me : { id: `empty-${place}`, name: "", age: 0, female: false, avatar: "", empty: true };
        const female = row.gender === "female";
        if (row.id === net?.me) return { ...me, age: row.age ?? me.age, female, zodiac: row.zodiac ?? me.zodiac };
        return { id: row.id, name: (row.name ?? "").split(" ")[0] || "?", age: row.age ?? 0, female, avatar: row.avatar || cartoonAvatar(row.seat + 1, female), zodiac: row.zodiac };
      });
    }
    const others = bots.map((bot, index) => ({ ...bot, avatar: cartoonAvatar(index + 1, bot.female), zodiac: (index * 5) % 12 }));
    return [...others.slice(0, 7), me, ...others.slice(7)];
  }, [user.name, user.avatar, details.gender, details.birthday, online, net]);
  const seated = players.filter((player) => !player.empty);
  const meIndex = 7;
  const { seats, cx: CENTER_X, cy: STAGE_Y } = layouts[wide ? "wide" : "tall"];
  const angleTo = useCallback((index: number) => (Math.atan2(seats[index][1] - STAGE_Y, seats[index][0] - CENTER_X) * 180) / Math.PI + 90, [seats, CENTER_X, STAGE_Y]);

  const girlsHere = seated.filter((player) => player.female).length;
  // A private room plays with one girl and one boy; the common tables need at least two girls.
  const enoughGirls = seated.length >= 2 && (net?.room ? true : girlsHere >= 2);
  // The owner may delete the private room once everyone else has gone.
  const canDeleteRoom = Boolean(net?.room && net.room.owner === net.me && seated.length === 1);
  const [turn, setTurn] = useState(4);
  const [target, setTarget] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [rotation, setRotation] = useState(0);
  const [answers, setAnswers] = useState<{ spinner: boolean | null; target: boolean | null }>({ spinner: null, target: null });
  const [seconds, setSeconds] = useState(0);
  const [kisses, setKisses] = useState<Record<string, number>>({ b1: 3, b4: 8, b7: 1 });
  const [stickers, setStickers] = useState<Record<string, string[]>>({ b2: ["tea"], b5: ["rose"] });
  // Gifts that just arrived lie scattered over the photo for a while (PILE_MS), then fade away.
  const [piles, setPiles] = useState<Record<string, { key: number; gift: string; x: number; y: number; r: number; s: number; at: number }[]>>({});
  const [pileNow, setPileNow] = useState(0);
  const pileKey = useRef(1);
  const hasPiles = Object.values(piles).some((list) => list.length > 0);
  useEffect(() => {
    if (!hasPiles) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setPileNow(now);
      setPiles((value) => Object.fromEntries(Object.entries(value).map(([id, list]) => [id, list.filter((item) => now - item.at < PILE_MS)]).filter(([, list]) => list.length)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasPiles]);
  const addPile = useCallback((id: string, gift: string) => {
    setPiles((value) => ({ ...value, [id]: [...(value[id] ?? []), { key: pileKey.current++, gift, x: 4 + Math.random() * 62, y: 4 + Math.random() * 62, r: Math.round(Math.random() * 50 - 25), s: 30 + Math.random() * 16, at: Date.now() }].slice(-30) }));
  }, []);
  const [lines, setLines] = useState<Line[]>([{ id: 1, from: "b3", text: smallTalk[0] }, { id: 2, from: "b6", to: "b1" }]);
  const [draft, setDraft] = useState("");
  // Price of a gift by its id (used by the "send it back" button in the chat).
  const priceOf = (gift: string) => gift.startsWith("c:") ? GIFT_PRICES[gift.slice(2)] ?? customPrice(gift.slice(2)) : [...giftChoices, ...lockedGifts].find(([id]) => id === gift)?.[1] ?? 0;
  // A small gem next to the name in the chat for players with a frame or the premium pass.
  const decorOf = (id: string): string | null => { const seat = net?.seats.find((item) => item.id === (id === "me" ? net.me : id)); if (!seat) return null; const frame = seat.frame ?? 0; return frameStone(frame) ?? (frame > 0 || seat.pass ? "💎" : null); };
  // Long press / double click on a chat message opens a small menu (reply, translate, report).
  const [lineMenu, setLineMenu] = useState<number | null>(null);
  const pressTimer = useRef(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // The phone video can be dragged by the avatar and resized from its lower-left corner.
  const [mini, setMini] = useState<{ x: number | null; y: number; w: number }>({ x: null, y: 8, w: 190 });
  const [miniBusy, setMiniBusy] = useState(false);
  const miniRef = useRef<HTMLDivElement>(null);
  function startMini(event: ReactPointerEvent, mode: "move" | "size") {
    const box = miniRef.current;
    const area = box?.parentElement;
    if (!box || !area) return;
    event.preventDefault();
    const outer = area.getBoundingClientRect();
    const rect = box.getBoundingClientRect();
    const start = { px: event.clientX, py: event.clientY, x: rect.left - outer.left, y: rect.top - outer.top, w: rect.width };
    setMiniBusy(true);
    const move = (next: PointerEvent) => {
      const dx = next.clientX - start.px;
      const dy = next.clientY - start.py;
      if (mode === "move") setMini((value) => ({ ...value, x: Math.min(Math.max(0, start.x + dx), outer.width - start.w), y: Math.min(Math.max(0, start.y + dy), outer.height - 60) }));
      else { const w = Math.min(Math.max(150, start.w - dx), outer.width); setMini((value) => ({ ...value, w, x: Math.max(0, start.x + start.w - w) })); }
    };
    const stop = () => { setMiniBusy(false); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }
  // "+" mode: choose several receivers on the table, then every gift goes to all of them.
  const [chosen, setChosen] = useState<string[]>([]);
  const [songMany, setSongMany] = useState<number[]>([]);
  const [flying, setFlying] = useState<{ key: number; gift: string; from: number; to: number; moved: boolean; ms: number }[]>([]);
  // A drink landed: the receiver gets a "+1 heart" burst.
  const [bursts, setBursts] = useState<{ key: number; to: number; amount?: number }[]>([]);
  // Expensive gifts give the receiver a share of the price (the server keeps the numbers in bottle_config).
  const giftShare = useRef({ min: 100, pct: 20 });
  const [shows, setShows] = useState<{ key: number; to: number; level: number }[]>([]);
  const heartsRef = useRef(12);
  const flyId = useRef(1);
  const hold = useRef<number | null>(null);
  const [giftNote, setGiftNote] = useState<string | null>(null);
  const [card, setCard] = useState(false);
  const [vip, setVip] = useState(false);
  const [doubleUntil, setDoubleUntil] = useState(0);
  const doubleRef = useRef(0);
  const jumpRef = useRef(false);
  const [jump, setJump] = useState(false);
  const [muted, setMutedIds] = useState<string[]>([]);
  const [flagMenu, setFlagMenu] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const meTap = useRef(0);
  const [songFor, setSongFor] = useState<number | null>(null);
  const [songTab, setSongTab] = useState<"popular" | "fav" | "recent" | "search" | "mp3">("popular");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackState, setTrackState] = useState<"idle" | "loading" | "nokey" | "fail">("idle");
  const [favs, setFavs] = useState<Track[]>([]);
  const [recent, setRecent] = useState<Track[]>([]);
  const [query, setQuery] = useState("");
  const [songFile, setSongFile] = useState<File | null>(null);
  const [audio, setAudio] = useState<{ url: string; name: string } | null>(null);
  const [dm, setDm] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [dmNote, setDmNote] = useState(false);
  // The private chat box can be dragged smaller by its corner grip and back up to its normal size, never beyond.
  const DM_FULL = { w: 290, h: 330 };
  const [dmSize, setDmSize] = useState(DM_FULL);
  const dmDrag = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dmToast, setDmToast] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [lostToast, setLostToast] = useState<{ by?: string; avatar?: string; target?: string } | null>(null);
  useEffect(() => { if (!lostToast) return; const timer = window.setTimeout(() => setLostToast(null), 9000); return () => window.clearTimeout(timer); }, [lostToast]);
  const [dmDraft, setDmDraft] = useState("");
  const [dms, setDms] = useState<Record<string, { mine: boolean; text: string }[]>>({});
  const [cardNote, setCardNote] = useState<string | null>(null);
  const [suitors, setSuitors] = useState<Record<string, { by: string; amount: number }>>(() => Object.fromEntries(bots.map((bot, index) => [bot.id, { by: bots[(index + 3) % bots.length].id, amount: 4 + ((index * 37) % 40) }])));
  const [volume, setVolumeLevel] = useState(80);
  const [music, setMusic] = useState(60);
  const [accept, setAccept] = useState(true);
  const [panel, setPanel] = useState<"gestures" | "settings" | "top" | "rules" | "shop" | "menu" | "vip" | "bottles" | "frames" | "achievements" | "boosters" | "wheel" | "chances" | "tables" | "rooms" | "active" | "invite" | "compliments" | "kick" | "pass" | null>(null);
  // Panels drop down from the top like a hanging sign and go back up when closed.
  const [closing, setClosing] = useState(false);
  const closePanel = () => { if (closing) return; setClosing(true); window.setTimeout(() => { setPanel(null); setClosing(false); }, 260); };
  const [passData, setPassData] = useState<PassData | null>(null);
  const [passNote, setPassNote] = useState<string | null>(null);
  const [kickFor, setKickFor] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [kickNote, setKickNote] = useState<string | null>(null);
  const [complimentIn, setComplimentIn] = useState<{ name: string; avatar: string; kind: number } | null>(null);
  const [kickedToast, setKickedToast] = useState(false);
  const [refInfo, setRefInfo] = useState<{ invited: number; done: number }>({ invited: 0, done: 0 });
  const [localActive] = useState(() => Date.now());
  const names = useRef<Record<string, { name: string; avatar: string }>>({});
  useEffect(() => { if (!kickedToast) return; const timer = window.setTimeout(() => setKickedToast(false), 12000); return () => window.clearTimeout(timer); }, [kickedToast]);
  // Private rooms (VIP opens them; anyone with the password can come in).
  const [roomsData, setRoomsData] = useState<BottleRooms | null>(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [roomAsk, setRoomAsk] = useState<{ id: number; name: string } | null>(null);
  const [roomPass, setRoomPass] = useState("");
  const [roomForm, setRoomForm] = useState({ name: "", pass: "", size: 4 });
  const [roomError, setRoomError] = useState<string | null>(null);
  const [roomTab, setRoomTab] = useState<"list" | "create">("list");
  const [showPass, setShowPass] = useState(false);
  const [rooms, setRooms] = useState<BottleTables | null>(null);
  const [waitFor, setWaitFor] = useState<{ table: number; position: number; back?: boolean } | null>(null);
  const [roomNote, setRoomNote] = useState(false);
  const [chances, setChances] = useState(0);
  const [wheelTurn, setWheelTurn] = useState(0);
  const [wheelBusy, setWheelBusy] = useState(false);
  const [wheelPrize, setWheelPrize] = useState<number | null>(null);
  const [mySmiles, setMySmiles] = useState(0);
  const wheelLock = useRef(false);
  const [topKind, setTopKind] = useState<"help" | "kisses" | "songs" | "dear" | "influence" | "smiles">("kisses");
  const [topPeriod, setTopPeriod] = useState<"all" | "week" | "day">("all");
  const [topData, setTopData] = useState<BottleTop | null>(null);
  const [sent, setSent] = useState<Record<string, number>>({});
  const [skin, setSkin] = useState(0);
  const skinLock = useRef(0);
  const [ownedSkins, setOwnedSkins] = useState<number[]>([0]);
  // Photo frames: the live table keeps them on the server (everyone sees them); the demo keeps them here.
  const [localFrame, setLocalFrame] = useState(0);
  const [localFrames, setLocalFrames] = useState<number[]>([]);
  const [framePick, setFramePick] = useState<number | null>(null);
  const [frameNote, setFrameNote] = useState<string | null>(null);
  const [payNote, setPayNote] = useState(false);
  const [tableNo, setTableNo] = useState(60);
  const [copied, setCopied] = useState(false);
  const [waitNote, setWaitNote] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [hearts, setHearts] = useState(12);
  const [video, setVideo] = useState<string | null>(null);
  // Songs from the MP3 tab play in "music mode": a small square player with the title, no big video.
  const [musicMode, setMusicMode] = useState(false);
  const [tune, setTune] = useState({ playing: false, cur: 0, dur: 0 });
  useEffect(() => {
    setTune({ playing: false, cur: 0, dur: 0 });
    if (!video || !musicMode) return;
    const hear = (event: MessageEvent) => {
      if (typeof event.origin !== "string" || !event.origin.includes("youtube")) return;
      try {
        const data = JSON.parse(String(event.data)) as { event?: string; info?: { currentTime?: number; duration?: number; playerState?: number } };
        const info = data.info;
        if (data.event !== "infoDelivery" || !info) return;
        setTune((v) => ({ playing: info.playerState === undefined ? v.playing : info.playerState === 1, cur: info.currentTime ?? v.cur, dur: info.duration || v.dur }));
      } catch { /* not a player message */ }
    };
    window.addEventListener("message", hear);
    return () => window.removeEventListener("message", hear);
  }, [video, musicMode]);
  const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const [videoTitle, setVideoTitle] = useState("");
  const [badLink, setBadLink] = useState(false);
  const lineId = useRef(3);
  const listRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLInputElement>(null);
  const say = useCallback((line: Omit<Line, "id">) => setLines((list) => mergeLines(list.slice(-40), [{ ...line, id: lineId.current++ }])), []);
  const nextTurn = useCallback(() => {
    setTarget(null);
    setTurn((current) => {
      if (!jumpRef.current) return (current + 1) % players.length;
      jumpRef.current = false;
      setJump(false);
      return meIndex;
    });
    setPhase("waiting");
  }, [players.length]);

  const spin = useCallback(() => {
    const spinner = players[turn];
    const options = players.map((_, index) => index).filter((index) => index !== turn && players[index].female !== spinner.female && (accept || index !== meIndex));
    const next = options[Math.floor(Math.random() * options.length)];
    setTarget(next);
    setAnswers({ spinner: null, target: null });
    setRotation((current) => current - (current % 360) + 2160 + (((angleTo(next) % 360) + 360) % 360));
    setPhase("spinning");
  }, [players, turn, angleTo, accept]);

  // Turn flow. A player has a few seconds to click the bottle, otherwise the turn passes on.
  useEffect(() => {
    if (online) return;
    if (phase === "waiting") {
      if (!enoughGirls) return;
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
      const timer = window.setTimeout(() => { playSound("chosen"); setPhase("choice"); }, 4700);
      return () => window.clearTimeout(timer);
    }
    if (phase === "kissed" || phase === "declined") {
      const timer = window.setTimeout(nextTurn, 2600);
      return () => window.clearTimeout(timer);
    }
  }, [phase, turn, spin, nextTurn, enoughGirls]);

  // Both players answer on their own within the same countdown; neither waits for the other.
  const deciding = phase === "choice" && target !== null && (answers.spinner === null || answers.target === null);
  useEffect(() => {
    if (online || phase !== "choice" || target === null) return;
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
    if (online || phase !== "choice" || target === null || answers.spinner === null || answers.target === null) return;
    const [a, b] = [players[turn], players[target]];
    const timer = window.setTimeout(() => {
      const gain = (id: string) => (id === "me" && Date.now() < doubleRef.current ? 2 : 1);
      setKisses((value) => ({ ...value, ...(answers.spinner ? { [b.id]: (value[b.id] ?? 0) + gain(b.id) } : {}), ...(answers.target ? { [a.id]: (value[a.id] ?? 0) + gain(a.id) } : {}) }));
      if (answers.spinner) say({ from: a.id, to: b.id });
      if (answers.target) say({ from: b.id, to: a.id });
      const both = answers.spinner && answers.target;
      playSound(both ? "kiss" : "decline");
      setPhase(both ? "kissed" : "declined");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [answers, phase, target, turn, players, say]);

  useEffect(() => {
    if (online) return;
    const timer = window.setInterval(() => {
      const bot = bots[Math.floor(Math.random() * bots.length)];
      say({ from: bot.id, text: smallTalk[Math.floor(Math.random() * smallTalk.length)] });
    }, 7000);
    return () => window.clearInterval(timer);
  }, [say, online]);

  // Live table: sit down, then ask the server for the table once a second (this is also the "I am here" signal).
  const lastChat = useRef(0);
  const backCancel = useRef(0);
  const backWait = useRef(false);
  // The first answer from the server only fills the chat; later ones also play the events (gifts, compliments, kicks).
  const primed = useRef(false);
  const pullRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!online) return;
    let alive = true;
    let busy = false;
    const pull = async () => {
      if (busy) return;
      busy = true;
      try {
        let data = await bottleSync(lastChat.current);
        if (!data) {
          // Lost the seat (weak internet, reload): first try the same table again, waiting in its queue when it is full.
          const back = Date.now() - backCancel.current < 8000 ? null : await bottleRejoin();
          if (!alive) return;
          if (back?.full && back.table) { backWait.current = true; setWaitFor((value) => (value && value.table === back.table && value.position === (back.position ?? 1) && value.back ? value : { table: back.table!, position: back.position ?? 1, back: true })); setPanel((value) => value ?? "tables"); return; }
          if (!back?.table) await bottleJoin();
          if (backWait.current) { backWait.current = false; setWaitFor(null); setPanel((value) => (value === "tables" ? null : value)); }
          data = await bottleSync(lastChat.current);
        }
        if (!alive || !data) return;
        const first = !primed.current;
        primed.current = true;
        const all = data.chat.filter((item) => item.id > lastChat.current && item.kind !== "wheel");
        const who = (id: string | null) => (id === data!.me ? "me" : id ?? "");
        // Gifts from other players fly across the table on every screen; my own gifts were already shown when I sent them.
        const gifts = all.filter((item) => item.kind === "gift" && item.from !== data!.me);
        if (!first) gifts.forEach((item, order) => window.setTimeout(() => remoteGift.current(who(item.from), who(item.to), item.body ?? "", gifts.length > 1 ? 1000 : 2000), order * 150));
        for (const seat of data.seats) names.current[seat.id] = { name: (seat.name ?? "").split(" ")[0] || "?", avatar: seat.avatar ?? "" };
        const nameOf = (id: string | null) => (id === data!.me ? t("common.you") : names.current[id ?? ""]?.name ?? "?");
        if (!first) all.filter((item) => item.kind === "compliment" && item.to === data!.me).forEach((item) => setComplimentIn({ name: names.current[item.from ?? ""]?.name ?? "?", avatar: names.current[item.from ?? ""]?.avatar || cartoonAvatar(3, false), kind: Number(item.body) || 1 }));
        if (!first && all.some((item) => item.kind === "kick" && item.to === data!.me)) setKickedToast(true);
        if (!first) all.filter((item) => item.kind === "gesture" && item.from !== data!.me).forEach((item) => showSeatGesture(who(item.from), item.body ?? ""));
        if (!first) all.filter((item) => item.kind === "admire_lost" && item.to === data!.me).forEach((item) => { try { setLostToast(JSON.parse(item.body ?? "{}") as { by?: string; avatar?: string; target?: string }); } catch { /* bad body */ } });
        const fresh = all.filter((item) => item.kind !== "compliment" && (item.kind !== "admire_lost" || item.to === data!.me) && (item.kind !== "gift" || (first && item.from !== data!.me)));
        if (all.length) lastChat.current = all[all.length - 1].id;
        if (fresh.length) {
          setLines((list) => mergeLines(list, fresh.map((item) => (item.kind === "kiss" ? { id: item.id, from: who(item.from), to: who(item.to) } : item.kind === "gift" ? { id: item.id, from: who(item.from), to: who(item.to), gift: item.body ?? "" } : item.kind === "admire" || item.kind === "admire_lost" ? { id: item.id, from: who(item.from), to: item.kind === "admire" ? who(item.to) : undefined, admire: { ...(() => { try { return JSON.parse(item.body ?? "{}") as { amount?: number; by?: string; avatar?: string; target?: string }; } catch { return {}; } })(), lost: item.kind === "admire_lost" } } : item.kind === "song" ? { id: item.id, from: who(item.from), to: item.to ? who(item.to) : undefined, song: item.body || "♪" } : item.kind === "kick" || item.kind === "saved" || item.kind === "kicked" ? { id: item.id, from: who(item.from), event: { kind: item.kind, a: nameOf(item.from), b: nameOf(item.to) } } : item.kind === "gesture" ? { id: item.id, from: who(item.from), gesture: item.body ?? "" } : item.kind === "bottle" ? { id: item.id, from: who(item.from), bottle: { a: Number((item.body ?? "0:0").split(":")[0]) || 0, b: Number((item.body ?? "0:0").split(":")[1]) || 0 } } : { id: item.id, from: who(item.from), text: item.body ?? "" }))).slice(-80));
        }
        setNet(data);
      } finally {
        busy = false;
      }
    };
    pullRef.current = () => void pull();
    setLines([]);
    void pull();
    const timer = window.setInterval(() => void pull(), 1000);
    const bye = () => void bottleLeave();
    window.addEventListener("pagehide", bye);
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener("pagehide", bye); void bottleLeave(); };
  }, [online]);
  // A song someone put on plays for the whole table (a song older than 5 minutes is not started for newcomers).
  const trackAt = useRef(0);
  // Everybody hears the same moment of the song: a newcomer starts where the song is now, not from the beginning.
  const songClock = useRef({ pos: 0, at: 0 });
  const songNow = () => songClock.current.pos + (Date.now() - songClock.current.at) / 1000;
  const track = net?.track ?? null;
  useEffect(() => {
    if (!track || !net || track.at === trackAt.current) return;
    const first = trackAt.current === 0;
    trackAt.current = track.at;
    if (first && net.now - track.at > 5 * 60 * 1000) return;
    songClock.current = { pos: track.by === net.me ? 0 : Math.max(0, (net.now - track.at) / 1000), at: Date.now() };
    if (track.kind === "youtube") { setAudio(null); setVideo(track.ref); setMusicMode((track.title ?? "").startsWith("♫ ")); setVideoTitle(songInfo(track.title ?? "").title); }
    else if (track.by !== net.me) { setVideo(null); setAudio({ url: track.ref, name: songInfo(track.title ?? "MP3").title }); }
  }, [track, net]);
  useEffect(() => { if (picked !== null && (!players[picked] || players[picked].empty)) setPicked(null); }, [picked, players]);
  useEffect(() => { setChosen((list) => { const next = list.filter((id) => players.some((player) => player.id === id && !player.empty && !player.me)); return next.length === list.length ? list : next; }); }, [players]);
  useEffect(() => { if (!dedicate) setChosen([]); }, [dedicate]);
  const chooseMode = (on: boolean) => { setChosen(on && picked !== null && !players[picked]?.me && !players[picked]?.empty ? [players[picked].id] : []); setGiftNote(null); onDedicate(on); };
  const giftTargets = dedicate ? chosen.map((id) => players.findIndex((player) => player.id === id)).filter((index) => index >= 0) : picked !== null ? [picked] : [];
  // Everything on screen follows what the server said.
  const spunRef = useRef("");
  useEffect(() => {
    if (!net) return;
    const place = (id: string | null) => (id ? players.findIndex((player) => player.id === (id === net.me ? "me" : id)) : -1);
    const [turnAt, targetAt] = [place(net.turn), place(net.target)];
    const left = (limit: number) => Math.max(0, Math.ceil(limit - (net.now - net.phase_at) / 1000));
    setTurn(turnAt);
    setTarget(targetAt >= 0 && net.phase !== "waiting" ? targetAt : null);
    setAnswers({ spinner: net.spinner_answer, target: net.target_answer });
    setPhase(net.phase === "result" ? (net.spinner_answer && net.target_answer ? "kissed" : "declined") : net.phase);
    // The red lips count the kisses a player got at this table (1, 2, 3...), like in the original game.
    setKisses(Object.fromEntries(net.seats.map((seat) => [seat.id === net.me ? "me" : seat.id, seat.kisses])));
    if (net.phase === "waiting") setSeconds(left(SPIN_SECONDS));
    if (net.phase === "choice") setSeconds(left(ANSWER_SECONDS));
    heartsRef.current = net.hearts;
    setHearts(net.hearts);
    // The table has one bottle for everybody: whoever changes it, it changes on every device.
    if (typeof net.skin === "number" && Date.now() > skinLock.current) setSkin(net.skin);
    if (!wheelLock.current) setChances(net.chances ?? 0);
    const key = `${net.round}:${net.target}`;
    if (net.phase === "spinning" && targetAt >= 0 && spunRef.current !== key) {
      spunRef.current = key;
      setRotation((current) => current - (current % 360) + 2160 + (((angleTo(targetAt) % 360) + 360) % 360));
    }
  }, [net, players, angleTo]);
  const chats = useSyncExternalStore(remoteChats.subscribe, remoteChats.get, remoteChats.getServer);
  const unreadRef = useRef<Map<string, number> | null>(null);
  const myId = net?.me;
  useEffect(() => { if (online) ensureMessagesLoaded(myId); }, [online, myId]);
  useEffect(() => {
    if (!online) return;
    const before = unreadRef.current;
    unreadRef.current = new Map(chats.map((chat) => [chat.userId, chat.unread]));
    if (!before) return;
    const fresh = chats.find((chat) => chat.unread > (before.get(chat.userId) ?? 0));
    if (!fresh) return;
    if (dm?.id === fresh.userId) return void openRemoteChat(fresh.userId);
    playSound("chosen");
    setDmToast({ id: fresh.userId, name: fresh.person.user.name.split(" ")[0], avatar: fresh.person.user.avatar });
  }, [chats, online, dm]);
  useEffect(() => {
    if (!dmToast) return;
    const timer = window.setTimeout(() => setDmToast(null), 10000);
    return () => window.clearTimeout(timer);
  }, [dmToast]);
  const dmLines = dm ? (online ? (chats.find((chat) => chat.userId === dm.id)?.messages ?? []).map((item) => ({ mine: item.from === "me", text: item.text })) : dms[dm.id] ?? []) : [];
  const myTurnLive = online && phase === "waiting" && turn === 7;
  useEffect(() => {
    if (!online) return;
    if (phase === "choice") playSound("chosen");
    if (phase === "kissed") playSound("kiss");
    if (phase === "declined") playSound("decline");
  }, [online, phase]);
  useEffect(() => { if (myTurnLive) playSound("turn"); }, [myTurnLive]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines.length]);
  useEffect(() => setVolume(volume / 100), [volume]);
  // Songs must start by themselves on every device. Browsers only allow sound after the person has touched the page,
  // so a video starts muted until then and gets its sound on the first tap anywhere in the game (or the 🔊 button).
  const [touched, setTouched] = useState(false);
  const touchedRef = useRef(false);
  touchedRef.current = touched;
  // Decided once per song, so getting the sound later does not reload (restart) the video.
  const startMuted = useMemo(() => !touchedRef.current, [video]); // eslint-disable-line react-hooks/exhaustive-deps
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytCall = useCallback((func: string, args: unknown[] = []) => frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*"), []);
  const pushMusic = useCallback(() => {
    ytCall("setVolume", [music]);
    if (music > 0 && touched) { ytCall("unMute"); ytCall("playVideo"); }
    if (music === 0) ytCall("mute");
  }, [music, touched, ytCall]);
  useEffect(pushMusic, [pushMusic, video]);
  useEffect(() => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) setTouched(true);
    const wake = () => {
      setTouched(true);
      const node = audioRef.current;
      if (node && node.paused) void node.play().catch(() => {});
    };
    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);
    return () => { window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", wake); };
  }, []);
  const startAt = useMemo(() => Math.floor(songNow()), [video]); // eslint-disable-line react-hooks/exhaustive-deps
  const ytSrc = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1${startAt > 2 ? `&start=${startAt}` : ""}${startMuted ? "&mute=1" : ""}`;
  // The first tap gives the sound: jump to where the song is for everybody else.
  useEffect(() => { if (touched && video && startMuted) ytCall("seekTo", [songNow(), true]); }, [touched]); // eslint-disable-line react-hooks/exhaustive-deps
  // A newcomer's video starts silent (browsers allow sound only after a tap): a big, lively "turn the sound on" cover invites the tap.
  const soundPill = !touched && startMuted ? (
    <button onClick={(event) => { event.stopPropagation(); setTouched(true); }} aria-label={t("videos.unmute")} className="group absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle,rgba(0,0,0,0.25),rgba(0,0,0,0.6))] text-white">
      <span className="relative flex h-14 w-14 items-center justify-center">
        <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[#FF4D6D] opacity-60 motion-safe:animate-ping" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(180deg,#FF6B81,#E8203A)] shadow-[0_6px_18px_rgba(232,32,58,0.55)] ring-4 ring-white/80 transition-transform group-hover:scale-110"><Volume2 size={28} strokeWidth={2.4} /></span>
      </span>
      <span className="rounded-full bg-black/70 px-3 py-1 text-[13px] font-black shadow [text-shadow:0_1px_2px_rgba(0,0,0,0.6)] motion-safe:animate-pulse">{t("bottle.tapSound")}</span>
    </button>
  ) : null;
  const byId = (id: string) => players.find((player) => player.id === id);
  const staged = phase !== "waiting" && phase !== "spinning" && target !== null;
  const myRole: "spinner" | "target" | null = staged ? (turn === meIndex ? "spinner" : target === meIndex ? "target" : null) : null;
  const canAnswer = deciding && myRole !== null && answers[myRole] === null;
  const myTurn = phase === "waiting" && turn === meIndex;

  // Live tables: pick another table, sit next to a friend, or wait in line for a full one.
  function openRooms() {
    setRoomNote(false);
    setPanel("tables");
    void bottleTables().then(setRooms);
  }
  function leaveRoom() { void moveTo(null); }
  async function deleteRoom() {
    if (!window.confirm(t("bottle.roomDeleteAsk"))) return;
    const result = await bottleRoomDelete();
    if (result?.table) { setPicked(null); setCard(false); setLines([]); pullRef.current(); }
  }
  function openPrivate() {
    setRoomTab("list");
    setShowPass(false);
    setRoomError(null);
    setRoomAsk(null);
    setPanel("rooms");
    if (online) void bottleRoomsList(roomSearch).then(setRoomsData);
    else setRoomsData({ vip, rooms: [] });
  }
  const roomErrorText = (code?: string) => t(`bottle.roomErr_${code ?? "gone"}` as "bottle.roomErr_gone");
  function enteredRoom() {
    setRoomAsk(null);
    setRoomPass("");
    setPanel(null);
    setPicked(null);
    setCard(false);
    setLines([]);
    pullRef.current();
  }
  async function joinPrivate(id: number, password: string) {
    const result = await bottleRoomJoin(id, password);
    if (!result) return setRoomError(roomErrorText("gone"));
    if (result.error) return setRoomError(roomErrorText(result.error));
    bumpStat("roomsJoined");
    enteredRoom();
  }
  async function createPrivate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await bottleRoomCreate(roomForm.name.trim(), roomForm.pass, roomForm.size);
    if (!result) return setRoomError(roomErrorText("gone"));
    if (result.error) return setRoomError(roomErrorText(result.error));
    setRoomForm({ name: "", pass: "", size: 4 });
    bumpStat("roomsCreated");
    enteredRoom();
  }
  async function moveTo(table: number | null) {
    const result = await bottleMove(table);
    if (!result) return;
    if (result.gone || result.banned) { setWaitFor(null); setRoomNote(true); return void bottleTables().then(setRooms); }
    if (result.full && result.table) return setWaitFor({ table: result.table, position: result.position ?? 1 });
    setWaitFor(null);
    bumpStat("tables");
    setPicked(null);
    setCard(false);
    setLines([]);
    setPanel(null);
    pullRef.current();
  }
  const waitTable = waitFor && !waitFor.back ? waitFor.table : undefined;
  useEffect(() => {
    if (!waitTable) return;
    const timer = window.setInterval(() => void moveTo(waitTable), 2500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitTable]);
  useEffect(() => { if (online) void bottleGiftShare().then((share) => { if (share && typeof share.pct === "number") giftShare.current = share; }); }, [online]);
  const liveTable = net?.table;
  useEffect(() => {
    if (!liveTable) return;
    try {
      const seen = (JSON.parse(window.localStorage.getItem("bottle-tables") ?? "[]") as number[]).filter((id) => id !== liveTable);
      window.localStorage.setItem("bottle-tables", JSON.stringify([liveTable, ...seen].slice(0, 12)));
    } catch { /* storage is blocked */ }
  }, [liveTable]);
  function changeTable() {
    if (online) return openRooms();
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
  const myFrame = online ? net?.seats.find((seat) => seat.id === net.me)?.frame ?? 0 : localFrame;
  const myFrames = online ? net?.frames ?? [] : localFrames;
  const frameOf = (player: Player) => (player.me ? myFrame : online ? net?.seats.find((seat) => seat.id === player.id)?.frame ?? 0 : 0);
  async function applyFrame(id: number) {
    setFrameNote(null);
    const look = frameLooks[id - 1];
    if (id && !myFrames.includes(id)) {
      if (look?.pass) return setFrameNote(t("bottle.framePass"));
      if (look?.vip && !vip && !online) return setFrameNote(t("bottle.frameVip"));
      if (heartsRef.current < FRAME_PRICE) return setFrameNote(t("bottle.noHearts"));
    }
    if (online) {
      const result = await bottleFrame(id);
      if (!result || result.error) return setFrameNote(t(result?.error === "vip" ? "bottle.frameVip" : result?.error === "hearts" ? "bottle.noHearts" : "bottle.frameFail"));
      if (typeof result.hearts === "number") { heartsRef.current = result.hearts; setHearts(result.hearts); }
      pullRef.current();
    } else {
      if (id && !localFrames.includes(id)) { heartsRef.current -= FRAME_PRICE; setHearts(heartsRef.current); setLocalFrames((list) => [...list, id]); }
      setLocalFrame(id);
    }
    setFrameNote(t("bottle.frameDone"));
  }
  const liveVip = online ? Boolean(net?.vip) : vip;
  const hasPass = (player: Player) => (online ? Boolean(net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.pass) : false);
  const activeSecs = online ? net?.active?.secs ?? 0 : Math.floor((Date.now() - localActive) / 1000);
  const [localCompliments, setLocalCompliments] = useState(0);
  // Season pass: levels from play, free and premium rewards (server only).
  function openPass() {
    setPassNote(null);
    setPanel("pass");
    if (online) void bottlePass().then((data) => setPassData(data));
  }
  const passHearts = (left?: number) => { if (typeof left === "number") { heartsRef.current = left; setHearts(left); } };
  async function passAction(kind: "buy" | "chest" | { level: number; premium: boolean }) {
    const result = kind === "buy" ? await bottlePassBuy() : kind === "chest" ? await bottlePassChest() : await bottlePassClaim(kind.level, kind.premium);
    if (!result || result.error) { setPassNote(t(result?.error === "hearts" ? "bottle.noHearts" : "bottle.passFail")); return; }
    passHearts(result.hearts);
    setPassNote(kind === "buy" ? t("bottle.passBought") : "prize" in result && result.prize ? `+${result.prize} ❤` : null);
    void bottlePass().then((data) => setPassData(data));
    pullRef.current();
  }
  function openInvite() {
    setPanel("invite");
    if (online) void bottleRefStatus().then((info) => { if (!info) return; setRefInfo({ invited: info.invited, done: info.done }); if (info.paid) { heartsRef.current = info.hearts; setHearts(info.hearts); } });
  }
  async function sendCompliment(to: string, kind: number): Promise<string | null> {
    bumpStat("chat");
    if (!online) { const next = (localCompliments + 1) % 10; setLocalCompliments(next); if (!next) { heartsRef.current += 10; setHearts(heartsRef.current); return "bonus"; } return null; }
    const result = await bottleCompliment(to, kind);
    if (!result || result.error) return result?.error ?? "bad";
    if (typeof result.hearts === "number") { heartsRef.current = result.hearts; setHearts(result.hearts); }
    pullRef.current();
    return result.bonus ? "bonus" : null;
  }
  function askKick(player: Player) {
    setKickNote(null);
    setKickFor({ id: player.id, name: player.name, avatar: player.avatar });
    setCard(false);
    setPanel("kick");
  }
  async function doKick() {
    if (!kickFor) return;
    if (!online) { setKickNote(t("bottle.kickDemo")); return; }
    const result = await bottleKick(kickFor.id);
    if (result === "ok") { setPanel(null); pullRef.current(); }
    else setKickNote(t(result === "vip" ? "bottle.kickNeedVip" : "bottle.kickFail"));
  }
  // Invited by a friend's link: tell the server once, the inviter gets hearts when we reach 50 kisses.
  useEffect(() => {
    if (!online) return;
    let ref: string | null = null;
    try { ref = window.localStorage.getItem("sitename-ref"); } catch { /* storage is blocked */ }
    if (ref) void bottleRefSet(ref).then(() => { try { window.localStorage.removeItem("sitename-ref"); } catch { /* storage is blocked */ } });
  }, [online]);
  const pay = (price: number) => {
    if (heartsRef.current < price) return false;
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    if (online) void bottleSpend(price);
    return true;
  };
  const topIds = new Set(seated.map((player) => ({ id: player.id, count: kisses[player.id] ?? 0 })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 3).map((item) => item.id));
  const skinFilter = (n: number) => (n % 15 ? `hue-rotate(${(n % 15) * 24}deg) saturate(${n % 3 === 0 ? 1.4 : 1.1})` : undefined);
  const art = useCustomArt();
  function chooseSkin(n: number) {
    if (!online && n !== skin) say({ from: "me", bottle: { a: skin, b: n } });
    setSkin(n);
    if (online) { skinLock.current = Date.now() + 4000; void bottleSkin(n); }
  }
  const SkinBottle = useCallback(({ className }: { className?: string }) => <SkinArt set={art} n={skin + 1} className={className} />, [art, skin]);
  const skinPrice = (n: number) => (n ? 3 + Math.floor(n / 5) * 2 : 0);
  // Rating: the server counts the whole site; without a server only this table's kisses are shown.
  useEffect(() => {
    if (panel !== "top" || topKind === "help") return;
    setTopData(null);
    if (!online) return;
    let alive = true;
    void bottleTop(topKind, topPeriod).then((data) => { if (alive) setTopData(data ?? { list: [], me: null }); });
    return () => { alive = false; };
  }, [panel, topKind, topPeriod, online]);
  const row = "flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm text-[#1F2937] hover:bg-black/5";
  // Achievements: most counts are kept in this browser; kisses, songs and smiles received come from the live table.
  const [statsTick, setStatsTick] = useState(0);
  useEffect(() => { markVisit(); void syncStats().then((ok) => { if (ok) setStatsTick((n) => n + 1); }); }, []);
  const achOpen = panel === "achievements";
  useEffect(() => { if (achOpen) void syncStats().then((ok) => { if (ok) setStatsTick((n) => n + 1); }); }, [achOpen]);
  // On a live table the server counts the achievements and pays every new star into the balance.
  const [achServer, setAchServer] = useState<Record<string, number> | null>(null);
  const pullAch = useRef<() => void>(() => {});
  pullAch.current = () => {
    if (!online) return;
    void bottleAchSync().then((result) => {
      if (!result) return;
      setAchServer(result.values ?? {});
      if (result.gained > 0) {
        if (typeof result.hearts === "number") { heartsRef.current = result.hearts; setHearts(result.hearts); }
        say({ from: "me", text: t("bottle.achReward").replace("{n}", String(result.gained)) });
        playSound("kiss");
      }
    });
  };
  useEffect(() => {
    pullAch.current();
    const timer = window.setInterval(() => pullAch.current(), 60000);
    return () => window.clearInterval(timer);
  }, [online]);
  useEffect(() => { if (achOpen) pullAch.current(); }, [achOpen]);
  // What the player has reached for unlocking gifts and smileys (kisses, songs, friends, smileys sent, VIP).
  const [serverProgress, setServerProgress] = useState<Progress | null>(null);
  const pullProgress = useRef<() => void>(() => {});
  pullProgress.current = () => { if (online) void bottleProgress().then((value) => { if (value) setServerProgress(value); }); };
  useEffect(() => { pullProgress.current(); const timer = window.setInterval(() => pullProgress.current(), 60000); return () => window.clearInterval(timer); }, [online]);
  const progress: Progress = online && serverProgress ? serverProgress : { kisses: kisses.me ?? 0, friends: 0, dj: readStats().songsSent ?? 0, gestures: readStats().gestures ?? 0, vip };
  const lockNote = (kind: RuleKind, left: number) => (kind === "vip" ? t("bottle.vipOnly") : t(`bottle.lock_${kind}` as "bottle.lock_kisses").replace("{n}", left.toLocaleString("ru-RU")));
  // A smiley shown for a few seconds over the sender's photo on the table.
  const [seatGes, setSeatGes] = useState<Record<string, { id: string; key: number }>>({});
  // "Not enough kisses" window for a locked gift or smiley: what is missing and how to get it.
  const [lock, setLock] = useState<{ gift?: string; gesture?: string; kind: RuleKind; total: number } | null>(null);
  const openLock = (kind: RuleKind, total: number, item: { gift?: string; gesture?: string }) => setLock({ ...item, kind, total });
  const gesKey = useRef(0);
  const showSeatGesture = useCallback((who: string, id: string) => {
    const key = gesKey.current++;
    setSeatGes((value) => ({ ...value, [who]: { id, key } }));
    window.setTimeout(() => setSeatGes((value) => (value[who]?.key === key ? Object.fromEntries(Object.entries(value).filter(([name]) => name !== who)) : value)), 4500);
  }, []);
  function sendGesture(id: string, price: number, rule: [RuleKind, number]) {
    const left = missing(rule, progress);
    if (left) return openLock(left < 0 ? "vip" : rule[0], rule[1], { gesture: id });
    if (heartsRef.current < price) return setFrameNote(t("bottle.noHearts"));
    setFrameNote(null);
    closePanel();
    showSeatGesture("me", id);
    playSfx("light_tap");
    bumpStat("gestures");
    if (online) { void bottleGesture(id).then((left) => { if (typeof left === "number" && left >= 0) { heartsRef.current = left; setHearts(left); pullProgress.current(); pullRef.current(); } }); return; }
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    setMySmiles((value) => value + 1);
    say({ from: "me", gesture: id });
  }
  const imTop = topIds.has("me");
  useEffect(() => { if (imTop) bumpStat("top", 1, true); }, [imTop]);
  const statsStamp = panel === "achievements";
  const achValue = useMemo(() => {
    void statsStamp;
    void statsTick;
    const stats = readStats();
    const mine = online ? net?.seats.find((seat) => seat.id === net.me) : undefined;
    return (metric: string) => {
      if (online && achServer) return achServer[metric] ?? 0;
      if (metric === "kissesGot") return Math.max(stats.kissesGot ?? 0, online ? mine?.total ?? 0 : kisses.me ?? 0);
      if (metric === "songsGot") return Math.max(stats.songsGot ?? 0, mine?.songs ?? 0);
      if (metric === "smilesGot") return Math.max(stats.smilesGot ?? 0, online ? mine?.smiles ?? 0 : mySmiles);
      return stats[metric] ?? 0;
    };
  }, [statsStamp, statsTick, online, net, kisses, mySmiles, achServer]);
  // The game menu opens as a small list next to its button, with coloured icons.
  const menuItems = [
    { key: "messages", label: t("nav.messages"), go: () => { window.location.href = "/messages"; }, icon: <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[linear-gradient(180deg,#5AA8FF,#2F7FF0)]"><MessageSquare size={15} className="text-white" fill="#FFFFFF" /></span> },
    { key: "pass", label: t("bottle.passPremium"), go: openPass, icon: <img src={emojiSrc("🎟️")} alt="" className="h-6 w-6" /> },
    { key: "ach", label: t("bottle.achievements"), dot: !(kisses.me ?? 0), go: () => setPanel("achievements"), icon: <BadgeCheck size={24} className="text-white" fill="#F5B400" strokeWidth={2} /> },
    { key: "rating", label: t("bottle.menuRatings"), go: () => { setTopKind("kisses"); setPanel("top"); }, icon: <svg viewBox="0 0 24 24" className="h-6 w-6"><rect x="2" y="12" width="6" height="8" rx="1" fill="#5BA4F5" /><rect x="9" y="6" width="6" height="14" rx="1" fill="#2F7FF0" /><rect x="16" y="9" width="6" height="11" rx="1" fill="#5BA4F5" /><rect x="1" y="20" width="22" height="2" rx="1" fill="#1E5FC2" /></svg> },
    { key: "bottles", label: t("bottle.menuBottles"), go: () => { setPayNote(false); setPanel("bottles"); }, icon: <span className="relative h-6 w-6"><BottleSvg className="absolute left-0 top-0 h-6 -rotate-[35deg]" /><BottleSvg className="absolute left-2.5 top-0.5 h-5 -rotate-[35deg] saturate-150" /></span> },
    { key: "frames", label: t("bottle.menuStyle"), go: () => { setFramePick(null); setFrameNote(null); setPanel("frames"); }, icon: <svg viewBox="0 0 24 24" className="h-6 w-6"><rect x="2.5" y="2.5" width="19" height="19" rx="2" fill="#FFD25E" stroke="#E79A00" strokeWidth="2" /><rect x="6.5" y="6.5" width="11" height="11" rx="1" fill="#6FB6FF" stroke="#E79A00" strokeWidth="1.5" /></svg> },
    { key: "boosters", label: t("bottle.boosters"), go: () => { setPayNote(false); setPanel("boosters"); }, icon: <svg viewBox="0 0 24 24" className="h-6 w-6"><g fill="#3D7BE0">{[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => <ellipse key={angle} cx="12" cy="5" rx="3" ry="4.2" transform={`rotate(${angle} 12 12)`} />)}</g><circle cx="12" cy="12" r="4" fill="#FFC83D" stroke="#FFFFFF" strokeWidth="1.2" /></svg> },
    { key: "rules", label: t("bottle.rules"), go: () => setPanel("rules"), icon: <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[linear-gradient(180deg,#7CD35B,#3FA62B)]"><BookOpen size={15} className="text-white" strokeWidth={2.4} /></span> },
  ];
  function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    bumpStat("chat");
    if (online) void bottleSay(draft.trim().slice(0, 200)).then(pullRef.current);
    else say({ from: "me", text: draft.trim().slice(0, 200) });
    setDraft("");
  }
  // The site is a static export (no server), so YouTube is asked straight from the browser.
  // The key is public by design: in Google Cloud it must be restricted to this site's address and to "YouTube Data API v3".
  async function loadTracks(search: string) {
    const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    setTracks([]);
    if (!key) return setTrackState("nokey");
    const cacheKey = `bottle-yt:${search.toLowerCase()}`;
    try {
      const cached = JSON.parse(window.sessionStorage.getItem(cacheKey) ?? "null") as Track[] | null;
      if (cached) { setTracks(cached); return setTrackState("idle"); }
    } catch { /* no cache */ }
    setTrackState("loading");
    const api = "https://www.googleapis.com/youtube/v3";
    const clock = (iso: string) => {
      const part = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
      if (!part) return "";
      const [h, m, sec] = [Number(part[1] ?? 0), Number(part[2] ?? 0), Number(part[3] ?? 0)];
      return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(sec).padStart(2, "0")}`;
    };
    try {
      let ids = "";
      if (search) {
        const found = await fetch(`${api}/search?part=id&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=25&q=${encodeURIComponent(search)}&key=${key}`);
        if (!found.ok) return setTrackState("fail");
        ids = (((await found.json()) as { items?: { id: { videoId: string } }[] }).items ?? []).map((item) => item.id.videoId).join(",");
        if (!ids) return setTrackState("idle");
      }
      const details = await fetch(search ? `${api}/videos?part=snippet,contentDetails&id=${ids}&key=${key}` : `${api}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=AZ&maxResults=16&key=${key}`);
      if (!details.ok) return setTrackState("fail");
      const list = (((await details.json()) as { items?: { id: string; snippet: { title: string }; contentDetails: { duration: string } }[] }).items ?? []).map((item) => ({ id: item.id, title: item.snippet.title, duration: clock(item.contentDetails.duration) }));
      // Own favourites and recent songs that match come first; then everything is ordered by how well it fits the query.
      const ranked = search ? rankSongs(search, [...[...favs, ...recent].filter((item) => songScore(search, item.title) >= 0.9), ...list].filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index)) : list;
      const shown = search && ranked.length ? ranked : list;
      setTracks(shown);
      setTrackState("idle");
      try { window.sessionStorage.setItem(cacheKey, JSON.stringify(shown)); } catch { /* storage is full or blocked */ }
    } catch {
      setTrackState("fail");
    }
  }
  function openSong(index: number) {
    setBadLink(false);
    setSongFile(null);
    setGiftNote(null);
    setFavs(stored("bottle-fav"));
    setRecent(stored("bottle-recent"));
    setSongTab("popular");
    setSongFor(index);
    setSongMany([index]);
    void loadTracks("");
  }
  // In the "+" mode a song goes to every chosen player; each one costs the full price.
  const songTo = () => (songMany.length ? songMany : songFor !== null ? [songFor] : []).filter((index) => players[index] && !players[index].empty);
  function finishSong(title: string) {
    if (songFor === null) return;
    bumpStat("songsSent", Math.max(1, songTo().length));
    if (!online) for (const index of songTo()) say({ from: "me", to: players[index].id, song: title });
    setSongFor(null);
    setSongMany([]);
    // After a song the gift panel closes so the video shows.
    setPicked(null);
    if (dedicate) chooseMode(false);
  }
  // A song costs the sender hearts and adds one to the receiver's song count (counted by the server when the table is live).
  function paySong(kind: "video" | "mp3") {
    const price = SONG_PRICE[kind];
    if (heartsRef.current < price) return false;
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    return true;
  }
  // Live table: the server takes the hearts, puts the song on for the whole table and writes "X put on a song" in the chat.
  function playLive(kind: "youtube" | "mp3", ref: string, title: string) {
    const targets = songTo().map((index) => players[index]);
    void (async () => {
      for (const target of targets.length ? targets : [null]) {
        const left = await bottlePlay(target && !target.me ? target.id : null, kind, ref, title);
        if (left === null || left < 0) { setGiftNote(t("bottle.songFailLive")); break; }
        heartsRef.current = left;
        setHearts(left);
      }
      pullRef.current();
    })();
  }
  // After a song starts, nobody else can change it for 60 seconds (the server checks it too).
  function songBusy() {
    if (!online || !net?.track || net.track.by === net.me) return false;
    const left = Math.ceil(60 - (net.now - net.track.at) / 1000);
    if (left <= 0) return false;
    setGiftNote(t("bottle.songBusy").replace("{n}", String(left)));
    return true;
  }
  function orderTrack(track: Track, music = false) {
    if (songBusy()) return;
    const count = Math.max(1, songTo().length);
    if (heartsRef.current < SONG_PRICE.video * count) return setGiftNote(t("bottle.noHearts"));
    if (online) playLive("youtube", track.id, music ? `♫ ${cleanSong(track.title)}` : cleanSong(track.title));
    else for (let n = 0; n < count; n++) paySong("video");
    songClock.current = { pos: 0, at: Date.now() };
    setAudio(null);
    setVideo(track.id);
    setMusicMode(music);
    setVideoTitle(cleanSong(track.title));
    const next = [track, ...recent.filter((item) => item.id !== track.id)].slice(0, 30);
    setRecent(next);
    keep("bottle-recent", next);
    finishSong(track.title);
  }
  function toggleFav(track: Track) {
    const next = favs.some((item) => item.id === track.id) ? favs.filter((item) => item.id !== track.id) : [track, ...favs].slice(0, 100);
    setFavs(next);
    keep("bottle-fav", next);
  }
  function searchTracks(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = youtubeId(query);
    if (id) { setTrackState("idle"); return setTracks([{ id, title: "YouTube" }]); }
    if (query.trim().length >= 2) void loadTracks(query.trim());
  }
  function sendMp3(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!songFile) return setBadLink(true);
    if (songBusy()) return;
    const count = Math.max(1, songTo().length);
    if (heartsRef.current < SONG_PRICE.mp3 * count) return setGiftNote(t("bottle.noHearts"));
    const name = songFile.name.replace(/\.[^.]+$/, "");
    if (online) {
      const file = songFile;
      setGiftNote(t("bottle.songUploading"));
      void uploadBlob(file, "music", "mp3").then((url) => {
        if (!url) return setGiftNote(t("bottle.songFailLive"));
        setGiftNote(null);
        playLive("mp3", url, `♪ ${cleanSong(name)}`);
      });
    } else for (let n = 0; n < count; n++) paySong("mp3");
    setVideo(null);
    songClock.current = { pos: 0, at: Date.now() };
    setAudio({ url: URL.createObjectURL(songFile), name });
    finishSong(`♪ ${name}`);
  }
  // Private messages use the site's own Messages. Reading is free; writing is free for girls and needs VIP for boys.
  function sendDm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dm || !dmDraft.trim()) return;
    if (!players[meIndex].female && !vip) return setDmNote(true);
    const text = dmDraft.trim().slice(0, 300);
    setDmDraft("");
    bumpStat("dm");
    if (online) return void sendRemoteMessage(dm.id, { text });
    const id = dm.id;
    setDms((value) => ({ ...value, [id]: [...(value[id] ?? []), { mine: true, text }] }));
    window.setTimeout(() => setDms((value) => ({ ...value, [id]: [...(value[id] ?? []), { mine: false, text: smallTalk[Math.floor(Math.random() * smallTalk.length)] }] })), 1600);
  }
  function openDm(person: { id: string; name: string; avatar: string }) {
    setCard(false);
    setPicked(null);
    setDmNote(false);
    setDmToast(null);
    setDm(person);
    if (online) void openRemoteChat(person.id);
  }
  // The wheel. Online the database draws the sector; in the demo the same odds are rolled here.
  async function spinWheel() {
    if (wheelLock.current) return;
    if (chances < 1) return setPanel("chances");
    wheelLock.current = true;
    setWheelBusy(true);
    setWheelPrize(null);
    playSfx("roulette_spin");
    let sector = 0;
    let after: { hearts: number; chances: number };
    if (online) {
      const result = await bottleWheel();
      if (!result) { wheelLock.current = false; setWheelBusy(false); return; }
      sector = result.sector;
      after = result;
    } else {
      let roll = Math.random() * 10000;
      sector = wheelSectors.findIndex((item) => (roll -= item.weight) < 0);
      if (sector < 0) sector = 10;
      after = { hearts: heartsRef.current + (wheelSectors[sector].hearts ?? 0), chances: chances - 1 + (wheelSectors[sector].chances ?? 0) };
      const won = wheelSectors[sector].kisses;
      if (won) window.setTimeout(() => setKisses((value) => ({ ...value, me: (value.me ?? 0) + won })), 4300);
      const smiles = wheelSectors[sector].smiles;
      if (smiles) window.setTimeout(() => setMySmiles((value) => value + smiles), 4300);
    }
    setChances((value) => value - 1);
    setWheelTurn((current) => current - (current % 360) + 1800 + ((360 - sector * 22.5) % 360));
    window.setTimeout(() => {
      heartsRef.current = after.hearts;
      setHearts(after.hearts);
      setChances(after.chances);
      setWheelPrize(sector);
      // Original wheel sounds: a reward jingle, a fanfare for the big prizes.
      const prize = wheelSectors[sector];
      if (!prizeText(prize)) playSound("decline");
      else if ((prize.hearts ?? 0) >= 50) { playSfx("jackpot_fanfare"); playSfx("jackpot_coins"); }
      else playSfx("roulette_reward");
      wheelLock.current = false;
      setWheelBusy(false);
    }, 4300);
  }
  async function buyChances(pack: number, price: number) {
    if (heartsRef.current < price) return setPayNote(true);
    if (online) {
      const result = await bottleBuyChances(pack);
      if (!result) return setPayNote(true);
      heartsRef.current = result.hearts;
      setHearts(result.hearts);
      setChances(result.chances);
    } else {
      heartsRef.current -= price;
      setHearts(heartsRef.current);
      setChances((value) => value + pack);
    }
    setPayNote(false);
    setPanel("wheel");
  }
  // Expensive gifts (100 hearts and up) end with fireworks over the receiver; pricier gifts get a bigger show.
  function fireworks(key: number, to: number, price: number, from = -1) {
    const { min, pct } = giftShare.current;
    if (to >= 0 && from !== to && pct > 0 && price >= min) heartBurst(key + 0.5, to, Math.max(1, Math.floor((price * pct) / 100)));
    const level = fireworksLevel(price);
    if (!level || to < 0) return;
    setShows((list) => [...list, { key, to, level }]);
    playSfx("sparkling1");
    const booms = [0, 1, 2, 3, 4].slice(0, level + 1);
    booms.forEach((n) => window.setTimeout(() => playSfx(n % 2 ? "boom2" : "boom1"), 470 + n * 560));
    if (level >= 3) window.setTimeout(() => playSfx("jackpot_firecracker"), 900);
    window.setTimeout(() => setShows((list) => list.filter((item) => item.key !== key)), 1300 + [0, 3, 5, 7, 9][level] * 280 + 600);
  }
  function heartBurst(key: number, to: number, amount = 1) {
    setBursts((list) => [...list, { key, to, amount }]);
    window.setTimeout(() => setBursts((list) => list.filter((item) => item.key !== key)), 1700);
  }
  // A single gift glides for 3 seconds; gifts sent in a rapid series (press and hold) fly in about a second.
  function sendGift(index: number, gift: string, price: number, ms = 3000) {
    const player = players[index];
    if (heartsRef.current < price) return false;
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    if (online) void bottleGift(player.me ? net?.me ?? "" : player.id, gift, price);
    const key = flyId.current++;
    playGiftSound(gift, "send");
    // Drinks fly like every other gift (one by one); on landing the receiver gets the "+1 heart" burst.
    const pour = isDrink(gift) && index !== meIndex;
    {
      setFlying((list) => [...list, { key, gift, from: meIndex, to: index, moved: false, ms }]);
      window.setTimeout(() => setFlying((list) => list.map((item) => (item.key === key ? { ...item, moved: true } : item))), 40);
    }
    window.setTimeout(() => {
      setFlying((list) => list.filter((item) => item.key !== key));
      playGiftSound(gift, "land");
      if (pour) heartBurst(key, index);
      fireworks(key, index, price, meIndex);
      setStickers((value) => ({ ...value, [player.id]: [...(value[player.id] ?? []), landed(gift)].slice(-6) }));
      addPile(player.id, landed(gift));
      say({ from: "me", to: player.id, gift });
    }, ms + 100);
    setSent((value) => ({ ...value, [player.id]: (value[player.id] ?? 0) + 1 }));
    bumpStat("giftsSent");
    bumpStat(`gift:${gift}`);
    return true;
  }
  // A gift another player sent: it flies from their seat to the receiver, then sits on the photo and goes into the chat.
  const remoteGift = useRef<(from: string, to: string, gift: string, ms: number) => void>(() => {});
  remoteGift.current = (fromId, toId, gift, ms) => {
    const fromAt = players.findIndex((player) => player.id === fromId);
    const toAt = players.findIndex((player) => player.id === toId);
    if (!gift || toAt < 0) return;
    const key = flyId.current++;
    const pour = isDrink(gift) && fromAt >= 0 && fromAt !== toAt;
    playGiftSound(gift, "send");
    {
      setFlying((list) => [...list, { key, gift, from: fromAt >= 0 ? fromAt : toAt, to: toAt, moved: false, ms }]);
      window.setTimeout(() => setFlying((list) => list.map((item) => (item.key === key ? { ...item, moved: true } : item))), 40);
    }
    window.setTimeout(() => {
      setFlying((list) => list.filter((item) => item.key !== key));
      playGiftSound(gift, "land");
      if (pour) heartBurst(key, toAt);
      fireworks(key, toAt, priceOf(gift), fromAt);
      setStickers((value) => ({ ...value, [toId]: [...(value[toId] ?? []), landed(gift)].slice(-6) }));
      addPile(toId, landed(gift));
      say({ from: fromId, to: toId, gift });
    }, ms + 100);
  };
  // Who admires this player: the server keeps it on a live table, the demo keeps it here.
  function admirerOf(player: Player) {
    if (online) {
      const found = net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.admirer;
      return found ? { me: found.id === net?.me, name: found.name ?? "", avatar: found.avatar ?? "", amount: found.amount } : null;
    }
    const local = suitors[player.id];
    const who = local ? byId(local.by) : null;
    return local && who ? { me: Boolean(who.me), name: who.name, avatar: who.avatar, amount: local.amount } : null;
  }
  function court(index: number) {
    const player = players[index];
    const current = admirerOf(player);
    const price = (current?.amount ?? 0) + 1;
    if (current?.me) return;
    if (heartsRef.current < price) return setCardNote(`${t("bottle.noHearts")} (${price})`);
    if (online) {
      void bottleAdmire(player.id).then((left) => {
        if (left === null || left < 0) return setCardNote(t("bottle.admireFail"));
        bumpStat("admire");
        heartsRef.current = left;
        setHearts(left);
        pullRef.current();
      });
      return;
    }
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    setSuitors((value) => ({ ...value, [player.id]: { by: "me", amount: price } }));
    bumpStat("admire");
    say({ from: "me", text: `${t("bottle.courtStarted")} ${player.name} ❤️ ${price}` });
  }
  // Stop admiring someone: it costs as many hearts as the admiration is worth.
  function leaveCourt(index: number) {
    const player = players[index];
    const current = admirerOf(player);
    if (!current?.me) return;
    if (!leaveAsk) return setLeaveAsk(true);
    setLeaveAsk(false);
    if (heartsRef.current < current.amount) return setCardNote(`${t("bottle.noHearts")} (${current.amount})`);
    if (online) {
      void bottleAdmireLeave(player.id).then((left) => {
        if (left === null || left < 0) return setCardNote(left === -2 ? `${t("bottle.noHearts")} (${current.amount})` : t("bottle.admireFail"));
        heartsRef.current = left;
        setHearts(left);
        setCardNote(t("bottle.leftCourt"));
        pullRef.current();
      });
      return;
    }
    heartsRef.current -= current.amount;
    setHearts(heartsRef.current);
    setSuitors((value) => { const next = { ...value }; delete next[player.id]; return next; });
    setCardNote(t("bottle.leftCourt"));
  }
  // Press and hold a gift: it keeps going until the finger is lifted (or the hearts run out).
  // A tap sends one gift. Holding for a moment keeps sending until release; a scroll gesture cancels without sending.
  const pressed = useRef<{ timer: number; started: boolean; x: number; y: number } | null>(null);
  const stopHold = () => { if (hold.current) window.clearInterval(hold.current); hold.current = null; };
  const cancelPress = () => { if (pressed.current) window.clearTimeout(pressed.current.timer); pressed.current = null; stopHold(); };
  function giveGift(index: number, gift: string, price: number, need?: number) {
    if (gift.startsWith("song:")) { openSong(index); if (gift === "song:mp3") { setSongTab("mp3"); if (!tracks.length) void loadTracks(""); } return false; }
    if (need === -1 && !vip) { openLock("vip", 1, { gift }); return false; }
    if (need && need > 0) { const rule = GIFT_RULES[gift] ?? ["kisses", lockedGifts.find(([id]) => id === gift)?.[2] ?? need]; openLock(rule[0], rule[1], { gift }); return false; }
    setGiftNote(null);
    if (!sendGift(index, gift, price)) { setGiftNote(t("bottle.noHearts")); return false; }
    return true;
  }
  function giveMany(targets: number[], gift: string, price: number, need?: number) {
    if (!targets.length) { setGiftNote(t("bottle.pickReceivers")); return false; }
    if (gift.startsWith("song:")) { giveGift(targets[0], gift, price, need); setSongMany(targets); return false; }
    let sent = false;
    for (const index of targets) { if (!giveGift(index, gift, price, need)) break; sent = true; }
    if (sent && targets.length > 1) bumpStat("multi");
    return sent;
  }
  function pressGift(targets: number[], gift: string, price: number, need: number | undefined, x: number, y: number) {
    cancelPress();
    const state = { started: false, x, y, timer: window.setTimeout(() => {
      state.started = true;
      if (giveMany(targets, gift, price, need) && !gift.startsWith("song:")) hold.current = window.setInterval(() => { for (const index of targets) if (!sendGift(index, gift, price, 1000)) return stopHold(); }, 300);
    }, 380) };
    pressed.current = state;
  }
  function releaseGift(targets: number[], gift: string, price: number, need?: number) {
    const state = pressed.current;
    cancelPress();
    if (state && !state.started) giveMany(targets, gift, price, need);
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
  // The profile card: on a computer it sits in the middle of the whole game, on a phone over the table.
  const cardView = card && picked !== null ? (() => {
          const player = players[picked];
          const suitor = admirerOf(player);
          const by = suitor;
          const action = cn(wide ? "h-[52px] w-[52px]" : "h-9 w-9 [&_svg]:h-[18px] [&_svg]:w-[18px]", "flex items-center justify-center rounded-full text-white shadow-[0_3px_6px_rgba(0,0,0,0.18)] ring-2 ring-white transition-transform hover:scale-105");
          const seat = online ? net?.seats.find((item) => item.id === (player.me ? net.me : player.id)) : undefined;
          const stats = [
            { key: "statKisses", color: "#E0282E", icon: <Gift id="e:💋" className="h-[22px] w-[22px]" />, value: online ? seat?.total ?? 0 : kisses[player.id] ?? 0 },
            { key: "statSongs", color: "#A23BC9", icon: <Music2 size={19} className="text-[#A23BC9]" strokeWidth={2.6} />, value: online ? seat?.songs ?? 0 : ((picked + 3) * 7919) % 900 },
            { key: "statSmiles", color: "#F08A00", icon: <Gift id="e:😊" className="h-[21px] w-[21px]" />, value: online ? seat?.smiles ?? 0 : player.me ? mySmiles : ((picked + 5) * 104729) % 600 },
          ] as const;
          const profileHref = player.me ? "/profile" : online ? `/user?id=${player.id}` : null;
          const sign = player.zodiac !== null && player.zodiac !== undefined ? zodiacSigns[player.zodiac] : null;
          const signBadge = sign ? <button onClick={() => setSignOpen(!signOpen)} aria-expanded={signOpen} aria-label={t("bottle.zodiac")} title={t(`bottle.sign${player.zodiac}` as "bottle.sign0")} className="flex h-5 w-5 rotate-45 items-center justify-center rounded-[4px] bg-[#6D3BD8] text-white shadow ring-1 ring-white/70"><span className="-rotate-45 text-[11px] leading-none">{sign}</span></button> : null;
          return (
            <div className={cn("absolute inset-0 z-[45] flex items-center justify-center p-3", wide ? "bg-black/10" : "bg-black/35")} onClick={(event) => { event.stopPropagation(); setCard(false); }}>
              <div role="dialog" aria-modal="true" aria-label={`${player.name}, ${player.age}`} onClick={(event) => event.stopPropagation()} className={cn("relative flex rounded-2xl bg-white shadow-[0_18px_50px_rgba(0,0,0,0.45)]", wide ? "w-[720px] max-w-[96%]" : "w-full max-w-[560px]")}>
                <button onClick={() => setCard(false)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#5CC93B] bg-white text-[#5CC93B] shadow hover:bg-[#F0FBEA]"><X size={19} strokeWidth={3} /></button>
                <div className={cn("relative aspect-square shrink-0 overflow-hidden rounded-l-2xl bg-[#E5E7EB]", wide ? "w-[400px] max-w-[56%]" : "w-[50%]")}>
                  <img src={player.avatar} alt="" className="h-full w-full object-cover" />
                  <div className={cn("absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent pb-2.5 pt-10", wide ? "px-10" : "pl-2 pr-9")}>
                    {signBadge}
                    <p className="truncate text-sm font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">{player.name}, {player.age}</p>
                    {wide ? signBadge : null}
                  </div>
                  {signOpen && sign ? <span role="status" className="absolute bottom-11 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-sm font-semibold text-white">{t(`bottle.sign${player.zodiac}` as "bottle.sign0")}</span> : null}
                  {profileHref ? <a href={profileHref} target="_blank" rel="noreferrer" aria-label={t("bottle.openProfile")} title={t("bottle.openProfile")} className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-black/30"><ArrowUpRight size={24} strokeWidth={2.6} className="drop-shadow" /></a> : null}
                  {player.me ? null : <button onClick={() => setFlagMenu(!flagMenu)} aria-expanded={flagMenu} aria-label={t("bottle.more")} title={t("bottle.more")} className="absolute bottom-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[13px] font-black text-[#111827] shadow hover:bg-[#F3F4F6]">!</button>}
                  {flagMenu && !player.me ? (
                    <div role="menu" className="absolute bottom-10 right-1.5 z-10 w-44 overflow-hidden rounded-lg bg-white py-1 text-left text-xs font-semibold text-[#1F2937] shadow-xl">
                      <button role="menuitem" onClick={() => { setMutedIds((list) => (list.includes(player.id) ? list.filter((id) => id !== player.id) : [...list, player.id])); setFlagMenu(false); setCardNote(t(muted.includes(player.id) ? "bottle.unrejected" : "bottle.rejected")); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t(muted.includes(player.id) ? "bottle.unreject" : "bottle.reject")}</button>
                      <button role="menuitem" onClick={() => { setDraft(`${player.name}, `); setFlagMenu(false); setCard(false); setPicked(null); window.setTimeout(() => chatRef.current?.focus(), 50); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t("bottle.mention")}</button>
                      <button role="menuitem" onClick={() => { setFlagMenu(false); setCardNote(t("bottle.reportSent")); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t("bottle.report")}</button>
                      <button role="menuitem" onClick={() => { setFlagMenu(false); setCardNote(t("bottle.friendSent")); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t("bottle.addFriend")}</button>
                      <Link role="menuitem" href="/friends" className="block px-3 py-2 hover:bg-black/5">{t("bottle.myFriends")}</Link>
                    </div>
                  ) : null}
                </div>
                <div className={cn("flex min-w-0 flex-1 flex-col text-[#1F2937]", wide ? "p-4" : "p-2.5")}>
                  {seat?.status ? <p className="mb-2.5 border-b border-[#E5E7EB] pb-2 text-[13px] italic leading-snug text-[#374151]">{seat.status}”</p> : null}
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1 space-y-2">
                      {stats.map((item) => <p key={item.key} className="flex items-center gap-2.5 text-[15px] font-bold tabular-nums" style={{ color: item.color }}><span aria-hidden="true" className="flex w-[22px] justify-center">{item.icon}</span>{item.value.toLocaleString("ru-RU")}<span className="sr-only">{t(`bottle.${item.key}`)}</span></p>)}
                    </div>
                    {topIds.has(player.id) ? <Gift id="e:🏆" className="h-16 w-16 shrink-0" /> : null}
                  </div>
                  <div className="relative my-2.5 border-t border-[#E5E7EB]"><span aria-hidden="true" className="absolute left-1/2 top-0 h-3 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#E5E7EB] bg-white text-center text-[8px] leading-[10px] text-[#9CA3AF]">︿</span></div>
                  <div className={cn("flex items-center", wide ? "gap-3" : "gap-2")}>
                    {by ? <img src={by.avatar || cartoonAvatar(3, false)} alt="" className={cn("shrink-0 rounded-md object-cover shadow", wide ? "h-16 w-16" : "h-11 w-11")} /> : <span aria-hidden="true" className={cn("flex shrink-0 items-end justify-center overflow-hidden rounded-md border border-[#D9DEE5] bg-[#EEF1F5]", wide ? "h-16 w-16" : "h-11 w-11")}><UserRound size={wide ? 52 : 36} className="-mb-2 text-[#C3CAD4]" fill="#DDE2E9" strokeWidth={1.2} /></span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[#6B7280]">{by ? <>{t("bottle.admirer")}: <b className="text-[#1F2937]">{by.me ? t("common.you") : by.name}</b></> : t("bottle.noAdmirer")}</p>
                      <p className="flex items-center gap-1.5 text-[15px] font-bold tabular-nums text-[#1F2937]"><Heart size={17} fill="#F4511E" stroke="none" />{suitor ? suitor.amount : 1}</p>
                      {suitor?.me && !player.me ? <button onClick={() => leaveCourt(picked)} className={cn("mt-1 whitespace-nowrap rounded-sm px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm", leaveAsk ? "bg-[#D92B2B] hover:bg-[#C02424]" : "bg-[#9CA3AF] hover:bg-[#8A919C]")}>{t(leaveAsk ? "bottle.leaveCourtSure" : "bottle.leaveCourt")} · {suitor.amount} ❤</button> : null}
                      {suitor?.me || player.me ? null : <button onClick={() => court(picked)} className="mt-1 whitespace-nowrap rounded-sm bg-[#7DC243] px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm hover:bg-[#6DB036]">{t("bottle.beAdmirer")}{suitor ? ` · ${suitor.amount + 1}` : ""}</button>}
                    </div>
                  </div>
                  <div className="my-3 border-t border-[#E5E7EB]" />
                  <div className={cn("mt-auto flex items-center justify-around", wide ? "gap-2" : "gap-1")}>
                    {player.me ? null : <button onClick={() => askKick(player)} aria-label={t("bottle.kick")} title={t("bottle.kick")} className={cn(action, "bg-[radial-gradient(circle_at_35%_30%,#FF7A7A,#D92B2B)]")}><Ban size={22} strokeWidth={2.4} /></button>}
                    <button onClick={() => setCard(false)} aria-label={t("gifts.send")} title={t("gifts.send")} className={cn(action, "bg-[radial-gradient(circle_at_35%_30%,#FFA05C,#F0661E)]")}><GiftIcon size={23} strokeWidth={2.2} /></button>
                    {player.me ? null : <>
                    <button onClick={() => setCardNote(t("bottle.friendSent"))} aria-label={t("bottle.addFriend")} title={t("bottle.addFriend")} className={cn(action, "bg-[radial-gradient(circle_at_35%_30%,#FFD15C,#F5A300)]")}><BadgeCheck size={24} strokeWidth={2.2} /></button>
                    <button onClick={() => openDm(player)} aria-label={t("bottle.write")} title={t("bottle.write")} className={cn(action, "bg-[radial-gradient(circle_at_35%_30%,#7CC6FF,#2E8FE0)]")}><Mail size={22} strokeWidth={2.2} /></button>
                    </>}
                  </div>
                  {cardNote ? <p role="status" className="mt-2 rounded-md bg-[#FEF3C7] px-2 py-1 text-xs font-semibold text-[#92400E]">{cardNote}</p> : null}
                </div>
              </div>
            </div>
          );
        })() : null;
  return (
    <div className={cn("relative flex h-full w-full bg-surface text-text", wide ? "flex-row" : "flex-col")}>
      {/* On a phone-shaped window the title bar sits on the same wood as the table, with no seam between them. */}
      <div className={cn("relative shrink-0", wide ? "h-full w-[54%]" : "mx-auto w-full max-w-[64dvh]")}>
      {wide ? null : <WoodTable className="pointer-events-none absolute inset-0 h-full w-full" />}
      {wide ? null : header}
      <div className={cn("relative shrink-0 overflow-hidden [container-type:size]", wide ? "h-full w-full bg-[#E0A04E]" : "aspect-[9/10] w-full")} onClick={() => { setPicked(null); if (dedicate) chooseMode(false); }}>
        {wide ? <WoodTable className="pointer-events-none absolute inset-0 h-full w-full" /> : null}
        <div className={cn("absolute flex items-center", menuOpen ? "z-[44]" : "z-10", wide ? "inset-y-0 left-0 w-[13%] flex-col gap-[2.2cqmin] py-[2.2cqmin]" : "inset-x-0 top-0 h-[10%] gap-[1.3cqmin] px-[2cqmin]")} onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => { setPayNote(false); setPanel("shop"); }} aria-label={`${t("bottle.shop")}: ${hearts}`} className={cn("flex items-center text-white hover:brightness-110", wide ? "flex-col" : "gap-1.5")} title={t("bottle.shop")}>
            <svg viewBox="0 0 64 58" aria-hidden="true" className={cn("drop-shadow-[0_2px_3px_rgba(90,30,0,0.35)]", wide ? "h-[min(56px,10cqmin)] w-[min(62px,11cqmin)]" : "h-[8cqmin] max-h-10 w-[8.8cqmin] max-w-11")}>
              <defs>
                <radialGradient id="hud-heart" cx="0.38" cy="0.3" r="0.85"><stop offset="0" stopColor="#FF6B5E" /><stop offset="0.45" stopColor="#F2222F" /><stop offset="1" stopColor="#B80F1F" /></radialGradient>
                <linearGradient id="hud-shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
              </defs>
              <path d="M32 54C14 42 3 31 3 18 3 9 10 3 18 3c6 0 11 3 14 8 3-5 8-8 14-8 8 0 15 6 15 15 0 13-11 24-29 36z" fill="url(#hud-heart)" stroke="#FFFFFF" strokeWidth="4" strokeLinejoin="round" />
              <ellipse cx="18" cy="15" rx="8" ry="5" fill="url(#hud-shine)" transform="rotate(-28 18 15)" />
              <circle cx="44" cy="14" r="2.200" fill="#FFFFFF" opacity="0.6" />
            </svg>
            <span className={cn("font-bold tabular-nums leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]", wide ? "text-[min(20px,3.4cqmin)]" : "text-[max(12px,2.6cqmin)]")}>{hearts}</span>
          </button>
          <span className="flex-1" />
          <button onClick={onToggleFull} aria-label={t("bottle.fullscreen")} title={t("bottle.fullscreen")} className={cn(tool, !wide && "max-sm:hidden")}>{full ? <Minimize size={17} /> : <Maximize size={17} />}</button>
          {!wide ? <button onClick={() => chooseMode(!dedicate)} aria-pressed={dedicate} aria-label={t("bottle.dedicate")} title={t("bottle.dedicate")} className={cn(tool, dedicate && "bg-[#8CC63F]", !full && "sm:hidden")}><Plus size={19} strokeWidth={3} /></button> : null}
          <button onClick={openPrivate} aria-label={t("bottle.rooms")} title={t("bottle.rooms")} className={tool}><DoorOpen size={19} /></button>
          {online && net && !net.wheel ? null : <button onClick={() => { setWheelPrize(null); setPayNote(false); setPanel("wheel"); }} aria-label={t("bottle.wheel")} title={t("bottle.wheel")} className={tool}><LifeBuoy size={19} /></button>}
          <button onClick={() => { setTopKind("kisses"); setPanel("top"); }} aria-label={t("bottle.top")} title={t("bottle.top")} className={tool}><Trophy size={18} /></button>
          <span className="relative flex">
            <button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={t("bottle.menu")} title={t("bottle.menu")} className={tool}><Menu size={18} /></button>
            {menuOpen ? (
              <>
                <span aria-hidden="true" className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div role="menu" className={cn("absolute z-50 w-[200px] overflow-hidden rounded-lg bg-white py-1 shadow-[0_6px_20px_rgba(0,0,0,0.3)]", wide ? "left-full top-1/2 ml-3 -translate-y-1/2" : "right-[-60px] top-full mt-2")}>
                  {menuItems.map((item) => <button key={item.key} role="menuitem" onClick={() => { setMenuOpen(false); item.go(); }} className="flex h-10 w-full items-center gap-3 px-3 text-left text-[15px] text-[#1F2937] hover:bg-[#F2F6FB]"><span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center">{item.icon}</span><span className="min-w-0 flex-1 truncate">{item.label}</span>{item.dot ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#F04438]" /> : null}</button>)}
                </div>
              </>
            ) : null}
          </span>
          <button onClick={() => setPanel("settings")} aria-label={t("bottle.settings")} title={t("bottle.settings")} className={tool}><Settings size={18} /></button>
          <span className="flex-1" />
          <span className="text-center text-[max(10px,2.2cqmin)] font-bold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">{net?.room ? <><span aria-hidden="true">🔒</span><br /><span className="line-clamp-2 block max-w-[64px] break-words">{net.room.name}</span><button onClick={leaveRoom} aria-label={t("bottle.roomLeave")} title={t("bottle.roomLeave")} className="mx-auto mt-1 flex items-center gap-1 rounded-full bg-[#E5484D] px-2 py-0.5 text-[11px] font-bold text-white shadow hover:bg-[#D13438] [text-shadow:none]"><X size={12} strokeWidth={3} />{t("bottle.roomLeaveShort")}</button>{canDeleteRoom ? <button onClick={() => void deleteRoom()} aria-label={t("bottle.roomDelete")} title={t("bottle.roomDelete")} className="mx-auto mt-1 flex items-center gap-1 rounded-full bg-[#7C2D12] px-2 py-0.5 text-[11px] font-bold text-white shadow hover:bg-[#9A3412] [text-shadow:none]"><Trash2 size={12} strokeWidth={2.6} />{t("bottle.roomDeleteShort")}</button> : null}</> : <>{t("bottle.table")}<br />{online ? net?.table ?? "…" : tableNo}</>}</span>
          {myTurn
            ? <span aria-label={`${seconds}`} className={cn(tool, "text-[max(14px,3cqmin)] font-bold tabular-nums")}>{seconds}</span>
            : <button onClick={changeTable} aria-label={t("bottle.changeTable")} title={t("bottle.changeTable")} className={tool}><RefreshCw size={17} /></button>}
          {!wide && !full ? <button onClick={onLeave} aria-label={t("photos.close")} title={t("photos.close")} className={cn(tool, "bg-[#E5484D]/90 hover:bg-[#E5484D] sm:hidden")}><X size={19} strokeWidth={3} /></button> : null}
        </div>

        <button type="button" disabled={staged} onClick={(event) => { event.stopPropagation(); if (myTurn) { bumpStat("spins"); return online ? void bottleSpin().then(pullRef.current) : spin(); } setWaitNote(true); window.setTimeout(() => setWaitNote(false), 1800); }} aria-label={t("bottle.spin")} className={cn("absolute h-[30cqmin] transition-transform duration-[4500ms] ease-[cubic-bezier(0.15,0.6,0.2,1)] motion-reduce:duration-0", staged ? "pointer-events-none" : myTurn ? "z-20 cursor-pointer" : "cursor-default")} style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)`, filter: skinFilter(skin) }}>
          <SkinBottle className={cn("h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] transition-opacity duration-700", staged && "opacity-0")} />
        </button>
        {myTurn && !staged ? (
          <div role="status" className="pointer-events-none absolute z-20 h-[16cqmin] w-[20cqmin] animate-[spin-hint_1.6s_ease-in-out_infinite] motion-reduce:animate-none" style={{ left: `${CENTER_X + 1}%`, top: `${STAGE_Y + 2}%` }}>
            <svg viewBox="0 0 120 90" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]">
              <path d="M98 50C96 22 64 10 22 18" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M30 9L18 18.5L31 26" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="absolute left-[30%] top-[58%] whitespace-nowrap text-center text-[3.3cqmin] font-bold leading-[1.05] text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.55)]">{t("bottle.spinHint1")}<br />{t("bottle.spinHint2")}</p>
          </div>
        ) : null}

        {waitNote && !myTurn && !staged ? <p role="status" className="pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-[3cqmin] py-[1cqmin] text-[3.2cqmin] font-bold text-white" style={{ left: `${CENTER_X}%`, top: `calc(${STAGE_Y}% + 17cqmin)` }}>{t("bottle.waitTurn")}</p> : null}
        {phase === "waiting" && !myTurn ? <p className="pointer-events-none absolute w-[40cqmin] -translate-x-1/2 -translate-y-1/2 text-center text-[3.4cqmin] font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.85)]" style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%` }}>{t(enoughGirls ? "bottle.waitingSpin" : net?.room ? "bottle.needPair" : "bottle.needGirls")}</p> : null}

        {players.map((player, index) => {
          if (player.empty) return null;
          const active = index === turn || index === target;
          return (
            <div key={player.id} className={cn("absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top]", wide ? "w-[17cqmin]" : "w-[16cqmin]", " duration-[1100ms] ease-in-out motion-reduce:duration-0", staged && active ? "z-30" : index === turn && "z-10")} style={staged && active ? { left: `calc(${CENTER_X}% ${index === turn ? "-" : "+"} 12.5cqmin)`, top: `${STAGE_Y}%` } : { left: `${seats[index][0]}%`, top: `${seats[index][1]}%` }}>
              <button type="button" onClick={(event) => { event.stopPropagation(); if (dedicate) { if (!player.me) setChosen((list) => (list.includes(player.id) ? list.filter((id) => id !== player.id) : [...list, player.id])); return; } setGiftNote(null); setCardNote(null); setFlagMenu(false); setSignOpen(false); setLeaveAsk(false); if (player.me) { if (Date.now() - meTap.current > 15000 || picked !== index) { meTap.current = Date.now(); setFrameNote(null); pullProgress.current(); setCard(false); setPicked(index); return; } meTap.current = 0; setCard(true); setPicked(index); return; } setCard(picked === index); setPicked(index); }} aria-label={`${player.name}, ${player.age}`} className={cn("group relative block aspect-square w-full rounded-[14%] bg-surface-2 shadow-[0_4px_10px_rgba(0,0,0,0.4)]", staged && index === target ? "ring-[0.9cqmin] ring-[#FFE2A8]" : active ? "ring-4 ring-white" : picked === index ? "ring-4 ring-[#8CC63F]" : player.me ? "ring-2 ring-white/80" : "")}>
                <img src={player.avatar} alt="" className="h-full w-full rounded-[14%] object-cover" />
                {frameOf(player) ? <FrameArt id={frameOf(player)} className={cn("pointer-events-none absolute z-[1]", frameOf(player) >= FIRST_ORIGINAL ? "-inset-[17%] h-[134%] w-[134%]" : "-inset-[9%] h-[118%] w-[118%]")} /> : null}
                {seatGes[player.me ? "me" : player.id] ? <img key={seatGes[player.me ? "me" : player.id].key} src={`/custom/anim/ges_${seatGes[player.me ? "me" : player.id].id}.webp`} alt="" className="pointer-events-none absolute inset-[12%] z-[4] h-[76%] w-[76%] max-w-none animate-[bottle-pop_0.25s_ease-out] object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.4)]" /> : null}
                {player.me || dedicate ? null : <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[14%] bg-black/35 opacity-0 transition-opacity group-hover:opacity-100"><GiftIcon className="h-[38%] w-[38%] text-white" strokeWidth={1.6} /></span>}
                {dedicate && !player.me ? (chosen.includes(player.id)
                  ? <span className="absolute inset-0 z-10 flex items-center justify-center rounded-[14%] bg-[#8CC63F]/85 ring-[0.5cqmin] ring-[#B678E8]"><Check className="h-[45%] w-[45%] text-white drop-shadow" strokeWidth={4} /></span>
                  : <span className="absolute inset-0 z-10 flex items-center justify-center rounded-[14%] bg-black/25"><Plus className="h-[45%] w-[45%] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" strokeWidth={3.5} /></span>) : null}
                {topIds.has(player.id) ? <span className="absolute left-1/2 -top-[1.4cqmin] z-[3] -translate-x-1/2 rounded bg-[#FACC15] px-[0.8cqmin] text-[2.2cqmin] font-black leading-[1.5] text-[#713F12] shadow">TOP</span> : null}
                {kisses[player.id] ? <LipsBadge count={kisses[player.id]} /> : null}
                {(() => {
                  const mine = stickers[player.id] ?? [];
                  const placeOf = (gift: string) => (gift.startsWith("c:") ? customPlace(gift.slice(2)) : headGifts.has(gift) ? "head" : "body");
                  const ears = [...mine].reverse().find((gift) => placeOf(gift) === "ears");
                  const face = mine.length && placeOf(mine[mine.length - 1]) === "face" ? mine[mine.length - 1] : null;
                  const head = [...mine].reverse().find((gift) => placeOf(gift) === "head");
                  const rest = mine.filter((gift) => placeOf(gift) === "body").slice(-2).reverse();
                  return <>
                    {(piles[player.id] ?? []).map((item) => <span key={item.key} className="pointer-events-none absolute z-[2] animate-[gift-drop_0.35s_ease-out] transition-opacity duration-[2000ms]" style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.s}%`, height: `${item.s}%`, transform: `rotate(${item.r}deg)`, opacity: pileNow - item.at > PILE_MS - 3000 ? 0 : 1 }}><Gift anim id={item.gift} className="h-full w-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]" /></span>)}
                    {face ? <Gift id={face} className="absolute left-[8%] top-[10%] z-[2] h-[84%] w-[84%] animate-[gift-drop_0.35s_ease-out]" /> : null}
                    {ears ? <Gift anim id={ears} className="pointer-events-none absolute -top-[22%] left-[-8%] z-[2] h-[46%] w-[116%] animate-[gift-drop_0.35s_ease-out] drop-shadow" /> : null}
                    {head ? <Gift anim id={head} className="pointer-events-none absolute -top-[30%] left-[17%] z-[2] h-[62%] w-[66%] animate-[gift-drop_0.35s_ease-out] drop-shadow" /> : null}
                    {rest.map((gift, position) => <Gift anim key={`${gift}-${position}`} id={gift} className={cn("absolute -bottom-[1.6cqmin] h-[48%] w-[48%] drop-shadow", position ? "-left-[1.6cqmin]" : "-right-[1.6cqmin]")} />)}
                  </>;
                })()}
              </button>
              {(() => {
                const kick = online ? net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.kicked : null;
                if (!kick || !net) return null;
                const left = Math.max(0, Math.ceil(30 - (net.now - kick.at) / 1000));
                const canSave = !player.me && kick.by !== net.me;
                return (
                  <div className="absolute left-0 top-0 z-[3] flex aspect-square w-full flex-col items-center justify-center rounded-[14%] bg-[#7F1D1D]/60 ring-[0.6cqmin] ring-[#EF4444]">
                    <img src={emojiSrc("🦶")} alt="" className="h-[42%] w-[42%] animate-pulse" />
                    <span className="text-[3.4cqmin] font-black tabular-nums text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">{left}</span>
                    {canSave ? <button onClick={(event) => { event.stopPropagation(); void bottleSave(player.id).then(pullRef.current); }} className="absolute -bottom-[2.4cqmin] flex items-center gap-[0.6cqmin] rounded-full bg-[linear-gradient(180deg,#9BD65A,#5DB13A)] px-[1.6cqmin] py-[0.5cqmin] text-[2.4cqmin] font-bold text-white shadow-lg"><img src={emojiSrc("🛟")} alt="" className="h-[3cqmin] w-[3cqmin]" />{t("bottle.saveBtn")}</button> : null}
                  </div>
                );
              })()}
              <p className={cn("mt-px truncate text-center text-[2.6cqmin] font-semibold leading-tight [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]", "text-white")}>{player.me ? t("common.you") : player.name}, {player.age}</p>
              {index === turn && !staged ? (() => {
                // Like the original: the label sits beside the photo on the table side, with an arrow pointing at the player,
                // so it never covers the seat below or its badges.
                const [x, y] = seats[index];
                const side = x < 30 ? "left" : x > 70 ? "right" : null;
                return <p className={cn("pointer-events-none absolute z-[6] whitespace-nowrap rounded-full bg-black/55 px-[1.6cqmin] py-[0.3cqmin] text-[2.3cqmin] font-semibold leading-tight text-white shadow", side === "left" ? "left-full top-[40%] ml-[1cqmin] -translate-y-1/2" : side === "right" ? "right-full top-[40%] mr-[1cqmin] -translate-y-1/2" : y > 60 ? "bottom-full left-1/2 mb-[0.6cqmin] -translate-x-1/2" : "left-1/2 top-full mt-[3.2cqmin] -translate-x-1/2")}>{side === "left" ? "← " : side === "right" ? "" : y > 60 ? "↓ " : "↑ "}{t("bottle.spinsBottle")}{side === "right" ? " →" : ""}</p>;
              })() : null}
            </div>
          );
        })}

        {bursts.map((item) => <HeartBurst key={item.key} at={seats[item.to]} amount={item.amount} />)}
        {shows.map((item) => <Fireworks key={`fw-${item.key}`} at={seats[item.to]} level={item.level} seed={item.key} />)}
        {flying.map((item) => <div key={item.key} className="pointer-events-none absolute z-40 h-[11cqmin] w-[11cqmin] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_10px_rgba(255,240,150,0.95)] transition-[left,top] ease-in-out" style={{ transitionDuration: `${item.ms}ms`, left: `${seats[item.moved ? item.to : item.from][0]}%`, top: `${seats[item.moved ? item.to : item.from][1]}%` }}><Gift anim id={item.gift} className="h-full w-full" /></div>)}

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
                <button onClick={() => { bumpStat("refusals"); setAnswers((value) => ({ ...value, [myRole]: false })); if (online) void bottleAnswer(false).then(pullRef.current); }} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#E2401F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.no")}</button>
                <button onClick={() => { bumpStat("kissesGiven"); setAnswers((value) => ({ ...value, [myRole]: true })); if (online) void bottleAnswer(true).then(pullRef.current); }} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#8CC63F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.yes")}</button>
              </div>
            ) : null}
          </>
        ) : null}

        {wide ? null : cardView}

        {songFor !== null ? (() => {
          const shown = songTab === "fav" ? favs : songTab === "recent" ? recent : tracks;
          const remote = songTab === "popular" || songTab === "search";
          const tabs = [["popular", Flame], ["fav", Star], ["recent", Clock], ["search", Search]] as const;
          return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-3" onClick={(event) => { event.stopPropagation(); setSongFor(null); }}>
              <div role="dialog" aria-modal="true" aria-label={t("bottle.dedicate")} onClick={(event) => event.stopPropagation()} className="relative flex max-h-full w-full max-w-[420px] flex-col rounded-2xl bg-white p-3 text-[#1F2937] shadow-2xl">
                <button type="button" onClick={() => setSongFor(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8CC63F] bg-white text-[#8CC63F] shadow"><X size={18} strokeWidth={3} /></button>
                <div role="tablist" className="flex items-center justify-center gap-3">
                  {tabs.map(([tab, Icon]) => <button key={tab} type="button" role="tab" aria-selected={songTab === tab} aria-label={t(`bottle.song${tab[0].toUpperCase()}${tab.slice(1)}` as "bottle.songPopular")} title={t(`bottle.song${tab[0].toUpperCase()}${tab.slice(1)}` as "bottle.songPopular")} onClick={() => { setSongTab(tab); if (tab === "popular") void loadTracks(""); if (tab === "search") { setTracks([]); setTrackState("idle"); } }} className={cn("flex h-10 w-10 items-center justify-center rounded-full", songTab === tab ? "bg-[#FFEDD5] text-[#EA580C]" : "text-[#9CA3AF] hover:bg-black/5")}><Icon size={22} fill={songTab === tab && (tab === "popular" || tab === "fav") ? "currentColor" : "none"} /></button>)}
                  <button type="button" role="tab" aria-selected={songTab === "mp3"} onClick={() => { setSongTab("mp3"); if (!tracks.length) void loadTracks(""); }} className={cn("h-10 rounded-full px-3 text-xs font-bold", songTab === "mp3" ? "bg-[#FFEDD5] text-[#EA580C]" : "text-[#9CA3AF] hover:bg-black/5")}>MP3</button>
                </div>
                <p className="mb-2 mt-1 flex items-center gap-2 text-xs font-bold text-[#6B7280]"><img src={players[songFor].avatar} alt="" className="h-6 w-6 rounded object-cover" /><span className="min-w-0 flex-1 truncate">{t("bottle.dedicateTo")} {songTo().map((index) => players[index].name).join(", ")}</span><span className="flex shrink-0 items-center gap-0.5 text-[#EA580C]"><Heart size={11} fill="currentColor" stroke="none" />{SONG_PRICE.video * Math.max(1, songTo().length)}</span></p>
                {songTab === "search" ? (
                  <form onSubmit={searchTracks} className="mb-2 flex gap-1.5">
                    <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} aria-label={t("bottle.songSearch")} placeholder={t("bottle.songSearchHint")} autoComplete="off" className="h-10 min-w-0 flex-1 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#EE8A2B]" />
                    <button type="submit" aria-label={t("bottle.songSearch")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EE8A2B] text-white"><Search size={18} /></button>
                  </form>
                ) : null}
                {songTab === "mp3" ? (
                  <div className="flex min-h-0 flex-col">
                    <form onSubmit={searchTracks} className="mb-2 flex gap-1.5">
                      <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} aria-label={t("bottle.mp3Search")} placeholder={t("bottle.mp3Search")} autoComplete="off" className="h-10 min-w-0 flex-1 rounded-full border border-[#D1D5DB] bg-white px-4 text-sm outline-none focus:border-[#7C3AED]" />
                      <button type="submit" aria-label={t("bottle.songSearch")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8B5CF6,#EC4899)] text-white"><Search size={18} /></button>
                    </form>
                    <div className="max-h-[38vh] min-h-[120px] overflow-y-auto rounded-xl bg-[linear-gradient(180deg,#1E1B3A,#2D1B4E)] p-1.5">
                      {trackState === "loading" ? <p role="status" className="py-8 text-center text-xs text-white/70">{t("bottle.songLoading")}</p> : null}
                      {trackState === "nokey" ? <p role="status" className="rounded-lg bg-[#FEF3C7] p-3 text-xs font-semibold text-[#92400E]">{t("bottle.songNoKey")}</p> : null}
                      {trackState === "fail" ? <p role="status" className="rounded-lg bg-[#FEE2E2] p-3 text-xs font-semibold text-[#991B1B]">{t("bottle.songFail")}</p> : null}
                      <ul>
                        {tracks.filter((track) => { const sec = durationSeconds(track.duration); return !sec || (sec >= 100 && sec <= 600); }).map((track) => {
                          const [artist, title] = track.title.includes(" - ") ? [track.title.split(" - ")[0], track.title.split(" - ").slice(1).join(" - ")] : ["", track.title];
                          return (
                            <li key={track.id}>
                              <button type="button" onClick={() => orderTrack(track, true)} className="group flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left text-white hover:bg-white/10">
                                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-black"><img src={`https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full scale-150 object-cover" /><span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1E1B3A] ring-2 ring-white/40" /></span>
                                <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{title}</span>{artist ? <span className="block truncate text-[11px] text-white/60">{artist}</span> : null}</span>
                                {track.duration ? <span className="shrink-0 text-[11px] tabular-nums text-white/50">{track.duration}</span> : null}
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm group-hover:bg-[#EC4899]">▶</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-bold text-[#6B7280]">{t("bottle.mp3Own")}</summary>
                  <form onSubmit={sendMp3} className="mt-2 rounded-xl bg-[linear-gradient(140deg,#1E1B3A,#4C1D95_60%,#BE185D)] p-3 text-white">
                    <div className="flex items-center gap-3">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-[radial-gradient(circle,#1E1B3A_22%,#111_23%,#333_60%,#111_61%)] shadow-lg"><Music2 size={18} className="text-[#F9A8D4]" /></span>
                      <p className="min-w-0 flex-1 text-sm font-bold leading-snug">{t("bottle.mp3Own")}<span className="mt-0.5 block truncate text-xs font-normal text-white/70">{songFile ? songFile.name : "MP3"}</span></p>
                    </div>
                    <label className={cn("mt-3 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-dashed text-sm font-semibold hover:bg-white/10", badLink ? "border-[#FCA5A5]" : "border-white/40")}>
                      <Plus size={16} />{songFile ? songFile.name : "MP3"}
                      <input type="file" accept="audio/mpeg,audio/mp3,.mp3" aria-label="MP3" onChange={(event) => { setSongFile(event.target.files?.[0] ?? null); setBadLink(false); }} className="sr-only" />
                    </label>
                    <button type="submit" className="mt-2 h-11 w-full rounded-full bg-[linear-gradient(90deg,#EC4899,#8B5CF6)] text-sm font-black text-white shadow hover:brightness-110">{t("bottle.dedicateSend")} · ❤ {SONG_PRICE.mp3 * Math.max(1, songTo().length)}</button>
                  </form>
                    </details>
                  </div>
                ) : (
                  <div className="min-h-[120px] overflow-y-auto">
                    {remote && trackState === "loading" ? <p role="status" className="py-8 text-center text-xs text-[#6B7280]">{t("bottle.songLoading")}</p> : null}
                    {remote && trackState === "nokey" ? <p role="status" className="rounded-lg bg-[#FEF3C7] p-3 text-xs font-semibold text-[#92400E]">{t("bottle.songNoKey")}</p> : null}
                    {remote && trackState === "fail" ? <p role="status" className="rounded-lg bg-[#FEE2E2] p-3 text-xs font-semibold text-[#991B1B]">{t("bottle.songFail")}</p> : null}
                    {!shown.length && !remote ? <p className="py-8 text-center text-xs text-[#6B7280]">{t("bottle.songEmpty")}</p> : null}
                    <ul className="grid grid-cols-2 gap-2">
                      {shown.map((track) => (
                        <li key={track.id} className="relative">
                          <button type="button" onClick={() => orderTrack(track)} className="block w-full text-left">
                            <span className="relative block aspect-video overflow-hidden rounded-md bg-[#111827]"><img src={`https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />{track.duration ? <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 text-[10px] font-semibold tabular-nums text-white">{track.duration}</span> : null}</span>
                            <span className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-tight">{track.title}</span>
                          </button>
                          <button type="button" onClick={() => toggleFav(track)} aria-pressed={favs.some((item) => item.id === track.id)} aria-label={t("bottle.songFav")} title={t("bottle.songFav")} className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white"><Star size={15} fill={favs.some((item) => item.id === track.id) ? "#FACC15" : "none"} stroke={favs.some((item) => item.id === track.id) ? "#FACC15" : "currentColor"} /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {giftNote ? <p role="status" className="mt-2 text-xs font-semibold text-[#B91C1C]">{giftNote}</p> : null}
              </div>
            </div>
          );
        })() : null}

        {panel ? (
          <div className={cn("absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/35 p-3", closing ? "animate-[panel-fade_0.28s_ease-in_reverse_forwards]" : "animate-[panel-fade_0.25s_ease-out]")} onClick={(event) => { event.stopPropagation(); closePanel(); }}>
            <div role="dialog" aria-modal="true" aria-label={t(`bottle.${panel}`)} onClick={(event) => event.stopPropagation()} className={cn("relative max-h-full w-full origin-top rounded-2xl p-3 shadow-2xl motion-reduce:animate-none", closing ? "animate-[panel-up_0.28s_ease-in_forwards]" : "animate-[panel-drop_0.7s_cubic-bezier(0.22,1,0.36,1)]", panel === "shop" ? "max-w-[440px] bg-[linear-gradient(180deg,#F26D7D,#F9B4B9)]" : panel === "wheel" || panel === "chances" ? "max-w-[380px] bg-[linear-gradient(180deg,#12998C,#7FD8C8)]" : panel === "top" ? "max-w-[420px] bg-white" : panel === "achievements" ? "max-w-[400px] bg-white" : panel === "frames" ? "max-w-[440px] bg-[#F7F7F8]" : panel === "pass" ? "max-w-[420px] overflow-y-auto overflow-x-hidden bg-[linear-gradient(180deg,#36A6FF,#1C7FE6)] [scrollbar-width:none]" : panel === "rooms" ? "max-w-[400px] border border-[#F5C451]/30 bg-[linear-gradient(165deg,#2B1D4E,#4E2D7C)]" : "max-w-[340px] bg-white")}>
              <button onClick={() => closePanel()} aria-label={t("photos.close")} title={t("photos.close")} className={cn("absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white shadow", panel === "shop" ? "border-[#EF4444] text-[#EF4444]" : panel === "wheel" || panel === "chances" ? "border-[#0E8478] text-[#0E8478]" : panel === "top" ? "border-[#3B9AD9] text-[#3B9AD9]" : panel === "rooms" ? "border-[#F5C451] text-[#C08A12]" : "border-[#8CC63F] text-[#8CC63F]")}><X size={18} strokeWidth={3} /></button>
              <p className={cn("mb-1 text-center text-sm font-bold", panel === "shop" || panel === "wheel" || panel === "chances" || panel === "rooms" || panel === "pass" ? "mb-2 text-white" : "text-[#9CA3AF]", (panel === "top" || panel === "achievements") && "sr-only")}>{t(`bottle.${panel}`)}</p>
              {panel === "rooms" ? (() => {
                const passBox = (value: string, change: (next: string) => void, label: string, focus?: boolean) => (
                  <span className="relative block min-w-0 flex-1">
                    <KeyRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#C9B6F2]" />
                    <input type={showPass ? "text" : "password"} value={value} onChange={(event) => change(event.target.value)} maxLength={30} placeholder={label} aria-label={label} autoFocus={focus} className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-10 text-sm text-white placeholder:text-[#B9A9DA] outline-none focus:border-[#F5C451]" />
                    <button type="button" onClick={() => setShowPass(!showPass)} aria-label={t(showPass ? "bottle.passHide" : "bottle.passShow")} title={t(showPass ? "bottle.passHide" : "bottle.passShow")} className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#D8CCF2] hover:bg-white/10 hover:text-white">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </span>
                );
                const genderCount = (count: number, half: number, female: boolean) => (
                  <span className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums", female ? "bg-[#FF5FA2]/20 text-[#FFB3D4]" : "bg-[#4DA3FF]/20 text-[#A9D3FF]")} title={t(female ? "auth.female" : "auth.male")}>{female ? <Venus size={12} strokeWidth={2.6} /> : <Mars size={12} strokeWidth={2.6} />}{count}/{half}</span>
                );
                return (
                  <div className="text-white">
                    <div role="tablist" className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-black/25 p-1">
                      {(["list", "create"] as const).map((tab) => <button key={tab} role="tab" aria-selected={roomTab === tab} onClick={() => { setRoomTab(tab); setRoomError(null); }} className={cn("flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-bold transition-colors", roomTab === tab ? "bg-[linear-gradient(180deg,#F8D271,#E8A92B)] text-[#3A2400] shadow" : "text-[#D8CCF2] hover:text-white")}>{tab === "list" ? <><DoorOpen size={15} />{t("bottle.roomTabList")}</> : <><Crown size={15} />{t("bottle.roomCreate")}</>}</button>)}
                    </div>
                    {roomError ? <p role="alert" className="mb-2 rounded-xl bg-[#FF4D6D]/20 px-3 py-2 text-center text-xs font-semibold text-[#FFC2CE]">{roomError}</p> : null}
                    {roomTab === "list" ? (
                      <>
                        <form onSubmit={(event) => { event.preventDefault(); void bottleRoomsList(roomSearch).then(setRoomsData); }} className="relative mb-2">
                          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#C9B6F2]" />
                          <input value={roomSearch} onChange={(event) => setRoomSearch(event.target.value)} placeholder={t("bottle.roomSearch")} aria-label={t("bottle.roomSearch")} className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-sm text-white placeholder:text-[#B9A9DA] outline-none focus:border-[#F5C451]" />
                        </form>
                        {roomAsk ? (
                          <form onSubmit={(event) => { event.preventDefault(); void joinPrivate(roomAsk.id, roomPass); }} className="mb-2 rounded-xl border border-[#F5C451]/40 bg-[#F5C451]/10 p-2.5">
                            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#FCE3A3]"><Lock size={14} />{roomAsk.name}</p>
                            <div className="flex gap-1.5">
                              {passBox(roomPass, setRoomPass, t("bottle.roomPass"), true)}
                              <button type="submit" className="h-10 shrink-0 rounded-xl bg-[linear-gradient(180deg,#8EDB5A,#5DB13A)] px-4 text-sm font-bold text-white shadow">{t("bottle.roomEnter")}</button>
                            </div>
                          </form>
                        ) : null}
                        <ul className="max-h-[42cqmin] space-y-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {!roomsData ? <li className="py-6 text-center text-xs text-[#C9B6F2]">{t("bottle.songLoading")}</li> : roomsData.rooms.length === 0 ? <li className="py-6 text-center text-sm text-[#C9B6F2]">{t("bottle.roomNone")}</li> : roomsData.rooms.map((room) => (
                            <li key={room.id}><button onClick={() => { setRoomError(null); if (room.locked && !room.mine) { setRoomPass(""); setRoomAsk({ id: room.id, name: room.name }); } else void joinPrivate(room.id, ""); }} disabled={room.id === net?.table} className="flex min-h-14 w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.07] px-2.5 text-left transition-colors hover:border-[#F5C451]/50 hover:bg-white/[0.12] disabled:opacity-60">
                              <img src={room.owner?.avatar || cartoonAvatar(2, false)} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-2 ring-[#F5C451]/60" />
                              <span className="min-w-0 flex-1"><span className="flex items-center gap-1 truncate text-sm font-bold">{room.locked ? <Lock size={13} className="shrink-0 text-[#F5C451]" /> : null}<span className="truncate">{room.name}</span></span><span className="block truncate text-[11px] text-[#C9B6F2]">{room.owner?.name ?? ""}{room.mine ? ` · ${t("bottle.roomMine")}` : ""}</span></span>
                              <span className="flex shrink-0 flex-col items-end gap-1">{genderCount(room.girls, room.capacity / 2, true)}{genderCount(room.boys, room.capacity / 2, false)}</span>
                            </button></li>
                          ))}
                        </ul>
                      </>
                    ) : roomsData?.vip ? (
                      <form onSubmit={(event) => void createPrivate(event)} className="space-y-2.5">
                        <input value={roomForm.name} onChange={(event) => setRoomForm({ ...roomForm, name: event.target.value })} maxLength={30} placeholder={t("bottle.roomName")} aria-label={t("bottle.roomName")} className="h-10 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white placeholder:text-[#B9A9DA] outline-none focus:border-[#F5C451]" />
                        {passBox(roomForm.pass, (pass) => setRoomForm({ ...roomForm, pass }), t("bottle.roomPassOptional"))}
                        <div>
                          <p className="mb-1.5 text-xs font-semibold text-[#C9B6F2]">{t("bottle.roomSize")}</p>
                          <div role="radiogroup" aria-label={t("bottle.roomSize")} className="grid grid-cols-5 gap-1.5">
                            {[2, 4, 6, 8, 10].map((size) => <button key={size} type="button" role="radio" aria-checked={roomForm.size === size} onClick={() => setRoomForm({ ...roomForm, size })} className={cn("h-10 rounded-xl text-sm font-black transition-colors", roomForm.size === size ? "bg-[linear-gradient(180deg,#F8D271,#E8A92B)] text-[#3A2400] shadow" : "bg-white/10 text-[#E4DAF7] hover:bg-white/15")}>{size}</button>)}
                          </div>
                          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#C9B6F2]">{t("bottle.roomSizeHint")}{genderCount(roomForm.size / 2, roomForm.size / 2, true)}{genderCount(roomForm.size / 2, roomForm.size / 2, false)}</p>
                        </div>
                        <button type="submit" className="h-11 w-full rounded-xl bg-[linear-gradient(180deg,#8EDB5A,#5DB13A)] text-sm font-bold text-white shadow hover:brightness-105">{t("bottle.roomOpen")}</button>
                      </form>
                    ) : <p className="rounded-xl border border-[#F5C451]/40 bg-[#F5C451]/10 px-3 py-6 text-center text-sm font-semibold text-[#FCE3A3]"><Crown size={22} className="mx-auto mb-2 text-[#F5C451]" />{t("bottle.roomVipOnly")}</p>}
                  </div>
                );
              })() : panel === "tables" ? (() => {
                let recent: number[] = [];
                try { recent = JSON.parse(window.localStorage.getItem("bottle-tables") ?? "[]") as number[]; } catch { /* storage is blocked */ }
                const list = rooms?.tables ?? [];
                const ordered = [...list].sort((a, b) => (recent.indexOf(a.id) < 0 ? 99 : recent.indexOf(a.id)) - (recent.indexOf(b.id) < 0 ? 99 : recent.indexOf(b.id)) || a.id - b.id);
                const counts = (id: number) => { const room = list.find((item) => item.id === id); return room ? <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-[#6B7280]"><span title={t("auth.male")}>👦 {room.boys}</span><span title={t("auth.female")}>👧 {room.girls}</span></span> : null; };
                return (
                  <div className="max-h-[80cqmin] overflow-y-auto text-[#1F2937]">
                    {waitFor ? (
                      <div role="status" className="mb-2 rounded-xl bg-[#FEF3C7] p-3 text-center text-sm font-semibold text-[#92400E]">
                        {t("bottle.roomFull1")} {waitFor.table} {t("bottle.roomFull2")} {waitFor.position === 1 ? t("bottle.roomFirst") : `${t("bottle.roomPlace")} ${waitFor.position}`}
                        <button onClick={() => { if (waitFor.back) { backCancel.current = Date.now(); backWait.current = false; } setWaitFor(null); void bottleQueueLeave(); }} className="mt-2 block w-full rounded-lg bg-white py-1.5 text-xs font-bold text-[#92400E]">{t("bottle.roomCancel")}</button>
                      </div>
                    ) : null}
                    {roomNote ? <p role="status" className="mb-2 rounded-lg bg-[#FEE2E2] p-2 text-center text-xs font-semibold text-[#991B1B]">{t("bottle.roomGone")}</p> : null}
                    <button onClick={() => void moveTo(null)} className="h-11 w-full rounded-xl bg-[#EE8A2B] text-sm font-bold text-white hover:brightness-110">{t("bottle.roomRandom")}</button>
                    <p className="mb-1 mt-3 text-xs font-semibold text-[#9CA3AF]">{t("bottle.roomFriendsKnown")}</p>
                    {rooms && !rooms.friends.length ? <p className="py-1 text-xs text-[#6B7280]">{t("bottle.roomNoFriends")}</p> : null}
                    <ul>
                      {(rooms?.friends ?? []).map((friend) => (
                        <li key={friend.id}><button onClick={() => void moveTo(friend.table)} disabled={friend.table === net?.table} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-sm hover:bg-black/5 disabled:opacity-50">
                          <img src={friend.avatar || cartoonAvatar(1, false)} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" /><span className="min-w-0 flex-1 truncate font-semibold">{(friend.name ?? "").split(" ")[0]}</span>{friend.friend === false ? <span title={t("bottle.roomKnown")} className="shrink-0 text-sm">🎁</span> : null}<span className="shrink-0 text-xs text-[#9CA3AF]">#{friend.table}</span>{counts(friend.table)}
                        </button></li>
                      ))}
                    </ul>
                    <p className="mb-1 mt-3 border-t border-[#E5E7EB] pt-2 text-xs font-semibold text-[#9CA3AF]">{t("bottle.roomList")}</p>
                    {!rooms ? <p className="py-2 text-center text-xs text-[#6B7280]">{t("bottle.songLoading")}</p> : null}
                    <ul>
                      {ordered.map((room) => (
                        <li key={room.id}><button onClick={() => void moveTo(room.id)} disabled={room.id === net?.table} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-sm hover:bg-black/5 disabled:opacity-50">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#E9A957]"><BottleSvg className="h-7 rotate-[28deg]" /></span><span className="min-w-0 flex-1 font-semibold tabular-nums">#{room.id}{room.id === net?.table ? ` · ${t("bottle.roomHere")}` : room.boys + room.girls >= 12 ? ` · ${t("bottle.roomFullTag")}` : ""}</span>{counts(room.id)}
                        </button></li>
                      ))}
                    </ul>
                  </div>
                );
              })() : panel === "wheel" ? (
                <div className="max-h-[84cqmin] overflow-y-auto text-white">
                  <p className="text-center text-xs">{t("bottle.wheelHint")}</p>
                  <div className="relative mx-auto my-2 aspect-square w-[min(240px,62cqmin)]">
                    <svg viewBox="-112 -112 224 224" className="h-full w-full transition-transform duration-[4200ms] ease-[cubic-bezier(0.12,0.7,0.1,1)] motion-reduce:duration-0" style={{ transform: `rotate(${wheelTurn}deg)` }} aria-hidden="true">
                      <defs>
                        <radialGradient id="wh-rim" cx="0.5" cy="0.5" r="0.5"><stop offset="0.86" stopColor="#FFD84A" /><stop offset="0.93" stopColor="#F5A300" /><stop offset="1" stopColor="#C97A00" /></radialGradient>
                        <radialGradient id="wh-a" cx="0.5" cy="0.5" r="0.5"><stop offset="0.2" stopColor="#3FD9C6" /><stop offset="1" stopColor="#14A596" /></radialGradient>
                        <radialGradient id="wh-b" cx="0.5" cy="0.5" r="0.5"><stop offset="0.2" stopColor="#1FB5A3" /><stop offset="1" stopColor="#0C8073" /></radialGradient>
                        <radialGradient id="wh-j" cx="0.5" cy="0.5" r="0.5"><stop offset="0.2" stopColor="#FFF1A8" /><stop offset="1" stopColor="#F5B301" /></radialGradient>
                      </defs>
                      <circle r="111" fill="url(#wh-rim)" /><circle r="97" fill="#0B6B61" />
                      {wheelSectors.map((item, index) => (
                        <g key={index} transform={`rotate(${index * 22.5})`}>
                          <path d="M0 0L-18.73 -94.15A96 96 0 0 1 18.73 -94.15Z" fill={`url(#wh-${index === 0 ? "j" : index % 2 ? "a" : "b"})`} stroke="#0B6B61" strokeWidth="1" />
                          <circle cy="-104" r="2.6" fill={index % 2 ? "#FFFFFF" : "#FFF3B0"} />
                          <circle cy="-104" r="2.6" fill="#FFF3B0" transform="rotate(11.25)" opacity="0.55" />
                          <text y="-70" textAnchor="middle" fontSize="17">{item.hearts ? (item.hearts >= 100 ? "💖" : "❤️") : item.chances ? "🎲" : item.kisses ? "💋" : item.smiles ? "😊" : "💨"}</text>
                          <text y="-50" textAnchor="middle" fontSize={item.hearts && item.hearts >= 1000 ? 10.5 : 14} fontWeight="900" fill={index === 0 ? "#7C2D12" : "#FFFFFF"} stroke={index === 0 ? "none" : "#0B6B61"} strokeWidth="0.6" paintOrder="stroke">{item.hearts ?? item.chances ?? item.kisses ?? item.smiles ?? ""}</text>
                        </g>
                      ))}
                      <circle r="19" fill="url(#wh-rim)" /><circle r="14" fill="#FFF7D6" stroke="#F5A300" strokeWidth="2" /><text y="6" textAnchor="middle" fontSize="15">🤍</text>
                    </svg>
                    <span aria-hidden="true" className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 text-3xl drop-shadow">🔻</span>
                  </div>
                  <p role="status" className="min-h-6 text-center text-sm font-bold">{wheelPrize === null ? "" : prizeText(wheelSectors[wheelPrize]) ? `${t("bottle.wheelWon")} ${prizeText(wheelSectors[wheelPrize])}` : t("bottle.wheelEmpty")}</p>
                  {wheelPrize !== null && wheelSectors[wheelPrize].kisses ? <p className="text-center text-xs">{t("bottle.wheelKissNote")}</p> : null}
                  {wheelPrize !== null && wheelSectors[wheelPrize].smiles ? <p className="text-center text-xs">{t("bottle.wheelSmileNote")}</p> : null}
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1.5 text-sm font-bold tabular-nums">{t("bottle.chancesLabel")}: 🎲 {chances}</span>
                    <button onClick={() => { setPayNote(false); setPanel("chances"); }} aria-label={t("bottle.chances")} title={t("bottle.chances")} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8CC63F] text-lg font-black text-white hover:brightness-110">+</button>
                    <button onClick={() => void spinWheel()} disabled={wheelBusy} className="h-9 rounded-lg bg-[#8CC63F] px-5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-60">{t("bottle.wheelSpin")} · 🎲 1</button>
                  </div>
                  {net?.winner ? <p className="mt-2 rounded-lg bg-black/25 p-2 text-center text-xs"><b className="text-[#FDE047]">{t("bottle.wheelWinner")}:</b> {(net.winner.name ?? "").split(" ")[0]} — ❤ {net.winner.amount}</p> : null}
                </div>
              ) : panel === "chances" ? (
                <div>
                  <p className="mb-2 flex items-center justify-center gap-1.5 rounded-lg bg-white/90 py-1.5 text-sm font-bold text-[#134E4A]">{t("bottle.balance")}: <Heart size={15} fill="#F4511E" stroke="none" /><span className="tabular-nums">{hearts}</span> · 🎲 <span className="tabular-nums">{chances}</span></p>
                  <ul className="grid grid-cols-3 gap-1.5">
                    {chancePacks.map(([pack, price]) => (
                      <li key={pack}>
                        <button onClick={() => void buyChances(pack, price)} className={cn("flex w-full flex-col items-center rounded-xl bg-white p-2 text-center hover:brightness-95", hearts < price && "opacity-50")}>
                          <span className="text-base font-black tabular-nums text-[#0E8478]">{pack}</span>
                          <span aria-hidden="true" className="my-1 text-3xl">🎲</span>
                          <span className="flex items-center gap-1 text-sm font-bold tabular-nums text-[#1F2937]"><Heart size={13} fill="#F4511E" stroke="none" />{price}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {payNote ? <p role="status" className="mt-2 rounded-lg bg-white/90 p-2 text-center text-xs font-semibold text-[#7F1D1D]">{t("bottle.noHearts")}</p> : null}
                  <button onClick={() => setPanel("wheel")} className="mt-2 w-full text-center text-xs font-bold text-white underline">{t("bottle.wheelBack")}</button>
                </div>
              ) : panel === "shop" ? (
                <ShopPanel hearts={hearts} activeSecs={activeSecs} payNote={payNote} onActive={() => setPanel("active")} onTelegram={() => (TELEGRAM_URL ? window.open(TELEGRAM_URL, "_blank", "noopener") : setPayNote(true))} onVip={() => { setPayNote(false); setPanel("vip"); }} onInvite={openInvite} onCompliments={() => setPanel("compliments")} onPack={() => setPayNote(true)} onPass={openPass} />
              ) : panel === "pass" ? (
                <>
                  <PassPanel data={online ? passData : null} hearts={hearts} now={net?.now ?? Date.now()} onBuy={() => void passAction("buy")} onClaim={(level, premium) => void passAction({ level, premium })} onChest={() => void passAction("chest")} />
                  {passNote ? <p role="status" className="absolute inset-x-3 bottom-3 z-10 rounded-xl bg-[#111827]/85 px-3 py-2 text-center text-sm font-bold text-white">{passNote}</p> : null}
                </>
              ) : panel === "active" ? (
                <ActivePanel secs={activeSecs} claimed={net?.active?.claimed ?? 0} live={online} onClaim={(level) => void bottleActiveClaim(level).then((left) => { if (left !== null && left >= 0) { heartsRef.current = left; setHearts(left); pullRef.current(); } })} />
              ) : panel === "invite" ? (
                <InvitePanel link={online && net ? `${window.location.origin}/register?ref=${net.me}` : null} invited={refInfo.invited} done={refInfo.done} />
              ) : panel === "compliments" ? (
                <ComplimentsPanel people={seated.filter((player) => !player.me).map((player) => ({ id: player.id, name: player.name, avatar: player.avatar }))} left={10 - (net?.compliments ?? localCompliments)} onSend={sendCompliment} />
              ) : panel === "kick" && kickFor ? (
                <div className="text-[#1F2937]">
                  <div className="flex items-center gap-3">
                    <span className="relative shrink-0"><img src={kickFor.avatar} alt="" className="h-16 w-16 rounded-xl object-cover shadow" /><img src={emojiSrc("🦶")} alt="" className="absolute -bottom-2 -right-2 h-8 w-8 -rotate-12" /></span>
                    <p className="text-sm leading-snug">{t("bottle.kickAsk1")} <b>{kickFor.name}</b> {t("bottle.kickAsk2")}</p>
                  </div>
                  <p className="mt-3 rounded-lg bg-[#FEF3C7] px-2.5 py-2 text-xs font-semibold leading-snug text-[#92400E]">{t("bottle.kickWarn")}</p>
                  {!liveVip ? <p className="mt-2 text-center text-xs text-[#6B7280]">{t("bottle.kickNeedVip")}</p> : null}
                  {kickNote ? <p role="status" className="mt-2 text-center text-xs font-semibold text-[#B91C1C]">{kickNote}</p> : null}
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setPanel(null)} className="h-10 flex-1 rounded-xl border-2 border-[#8CC63F] text-sm font-bold text-[#5B8C24] hover:bg-[#F4FBEA]">{t("common.cancel")}</button>
                    {liveVip
                      ? <button onClick={() => void doKick()} className="h-10 flex-1 rounded-xl bg-[linear-gradient(180deg,#FF7A7A,#D92B2B)] text-sm font-bold text-white shadow hover:brightness-110">{t("bottle.kickDo")}</button>
                      : <button onClick={() => setPanel("vip")} className="h-10 flex-1 rounded-xl bg-[linear-gradient(180deg,#4FA8FF,#2B7DE0)] text-sm font-bold text-white shadow hover:brightness-110">{t("bottle.kickVipBtn")}</button>}
                  </div>
                </div>
              ) : panel === "settings" ? (
                <div className="max-h-[70cqmin] overflow-y-auto">
                  <label className={cn(row, "cursor-pointer font-bold")}>
                    <span aria-hidden="true" className="w-6 text-center text-lg">💋</span><span className="flex-1">{t("bottle.acceptKisses")}</span>
                    <input type="checkbox" checked={accept} onChange={(event) => setAccept(event.target.checked)} className="peer sr-only" />
                    <span className="relative h-7 w-12 rounded-full bg-[#D1D5DB] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-[#34C759] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#2563EB]" />
                  </label>
                  <button onClick={onLeave} className={row}><Home size={20} className="w-6 text-[#3B82F6]" />{t("bottle.backLobby")}</button>
                  <label className={row}><Volume2 size={20} className="w-6 shrink-0 text-[#8CC63F]" /><span className="flex-1">{t("bottle.sounds")}</span><input type="range" min={0} max={100} value={volume} onChange={(event) => setVolumeLevel(Number(event.target.value))} className="w-24 accent-[#8CC63F]" /></label>
                  <label className={cn(row, "cursor-pointer")}>
                    <span aria-hidden="true" className="w-6 text-center text-lg">👑</span><span className="flex-1">{t("bottle.vipDemo")}</span>
                    <input type="checkbox" checked={vip} onChange={(event) => setVip(event.target.checked)} className="peer sr-only" />
                    <span className="relative h-7 w-12 rounded-full bg-[#D1D5DB] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-[#F59E0B] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#2563EB]" />
                  </label>
                  <label className={row}><Music size={20} className="w-6 shrink-0 text-[#EC4899]" /><span className="flex-1">{t("bottle.music")}</span><input type="range" min={0} max={100} value={music} onChange={(event) => setMusic(Number(event.target.value))} className="w-24 accent-[#8CC63F]" /></label>
                  <button onClick={invite} className={row}><UserPlus size={20} className="w-6 text-[#8CC63F]" />{copied ? t("bottle.copied") : t("bottle.invite")}</button>
                  <Link href="/friends" className={row}><Users size={20} className="w-6 text-[#3B82F6]" />{t("bottle.myFriends")}</Link>
                  {TELEGRAM_URL ? <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={row}><SendHorizontal size={20} className="w-6 text-[#229ED9]" />{t("bottle.telegram")}</a> : <button onClick={() => setCopied(false)} disabled className={cn(row, "opacity-60")}><SendHorizontal size={20} className="w-6 text-[#229ED9]" /><span>{t("bottle.telegram")}<span className="block text-[11px] text-[#6B7280]">{t("bottle.telegramSoon")}</span></span></button>}
                  <Link href="/settings" className={row}><UserRoundCog size={20} className="w-6 text-[#3B82F6]" />{t("bottle.profileSettings")}</Link>
                </div>
              ) : panel === "top" ? (() => {
                const kinds = [["kisses", "💋"], ["songs", "🎵"], ["dear", "❤️"], ["influence", "💞"], ["smiles", "😊"]] as const;
                const local = seated.map((player) => ({ id: player.id, name: player.me ? t("common.you") : player.name, avatar: player.avatar, count: topKind === "kisses" ? kisses[player.id] ?? 0 : 0 })).filter((row) => row.count > 0).sort((a, b) => b.count - a.count).map((row, index) => ({ ...row, place: index + 1 }));
                const rows = online ? topData?.list ?? null : local;
                const meId = online ? net?.me : "me";
                const mine = online ? topData?.me ?? null : (() => { const row = local.find((item) => item.id === "me"); return row ? { place: row.place, count: row.count } : null; })();
                const lips = (on: boolean, size = 26) => <svg viewBox="0 0 32 22" width={size} height={size * 0.69} aria-hidden="true"><path d="M16 5.5C13.5 1.5 9 .8 6 2.6 3.5 4 1.6 7.6.6 10.4 4.6 9.6 8.6 9.4 16 10.6c7.4-1.2 11.4-1 15.4-.2-1-2.8-2.9-6.4-5.4-7.8-3-1.8-7.5-1.1-10 2.9Z" fill={on ? "#E8232E" : "#9CC7EA"} /><path d="M.6 10.4c3 6.2 8.6 10.6 15.4 10.6s12.4-4.4 15.4-10.6c-4 .9-8 1.4-15.4 1.4S4.6 11.3.6 10.4Z" fill={on ? "#C8101C" : "#8BBBE3"} /><path d="M7 14.5c2.6 1.6 5.6 2.2 9 2.2" stroke="#FFFFFF" strokeOpacity={on ? 0.55 : 0.35} strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>;
                const tabIcon = (kind: string, on: boolean) => kind === "kisses" ? lips(on) : kind === "songs"
                  ? <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M9 18.5V5.2l11-2.2v12.6" stroke={on ? "#7A4DE8" : "#9CC7EA"} strokeWidth="2.4" fill="none" strokeLinejoin="round" /><ellipse cx="6" cy="18.6" rx="3.4" ry="2.7" fill={on ? "#7A4DE8" : "#9CC7EA"} /><ellipse cx="17" cy="15.8" rx="3.4" ry="2.7" fill={on ? "#7A4DE8" : "#9CC7EA"} /></svg>
                  : kind === "dear" ? <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><defs><linearGradient id="top-dear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A1E" /><stop offset="1" stopColor="#E8400C" /></linearGradient></defs><path d="M12 21.5S2.5 15.6 2.5 8.9C2.5 5.6 5 3.2 8 3.2c1.8 0 3.2.9 4 2.2.8-1.3 2.2-2.2 4-2.2 3 0 5.5 2.4 5.5 5.7 0 6.7-9.5 12.6-9.5 12.6Z" fill={on ? "url(#top-dear)" : "#9CC7EA"} /></svg>
                  : kind === "influence" ? <svg viewBox="0 0 30 24" width="30" height="24" aria-hidden="true"><defs><linearGradient id="top-infl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF8A1E" /><stop offset="1" stopColor="#E8400C" /></linearGradient></defs><path d="M12 21.5S2.5 15.6 2.5 8.9C2.5 5.6 5 3.2 8 3.2c1.8 0 3.2.9 4 2.2.8-1.3 2.2-2.2 4-2.2 3 0 5.5 2.4 5.5 5.7 0 6.7-9.5 12.6-9.5 12.6Z" transform="translate(0 1) scale(0.82)" fill={on ? "url(#top-infl)" : "#8BBBE3"} /><path d="M12 21.5S2.5 15.6 2.5 8.9C2.5 5.6 5 3.2 8 3.2c1.8 0 3.2.9 4 2.2.8-1.3 2.2-2.2 4-2.2 3 0 5.5 2.4 5.5 5.7 0 6.7-9.5 12.6-9.5 12.6Z" transform="translate(10 2.5) scale(0.82)" fill={on ? "url(#top-infl)" : "#9CC7EA"} stroke={on ? "#FFFFFF" : "#B8DAF3"} strokeWidth="1.2" /></svg>
                  : <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill={on ? "#FFC21A" : "#9CC7EA"} /><circle cx="8.6" cy="9.6" r="1.4" fill="#FFFFFF" /><circle cx="15.4" cy="9.6" r="1.4" fill="#FFFFFF" /><path d="M7 13.6c1.2 2.4 3 3.4 5 3.4s3.8-1 5-3.4" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>;
                const icon = tabIcon(topKind, true);
                const me = players[meIndex];
                const avatar = (src: string | null | undefined, name: string | null | undefined) => src ? <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" /> : <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#C9D3DC] text-sm font-bold text-white">{(name ?? "?").slice(0, 1).toUpperCase()}</span>;
                return (
                  <div className="-m-3 overflow-hidden rounded-2xl bg-white">
                    <div className="bg-[linear-gradient(180deg,#8FCBF3,#B8E0F8)] px-3 pb-2 pt-2">
                      <div role="tablist" className="relative mb-2 flex items-center justify-center gap-[clamp(10px,4vw,26px)] pr-6">
                        <button role="tab" aria-selected={topKind === "help"} onClick={() => setTopKind("help")} title={t("bottle.topHelp")} className={cn("absolute left-0 flex h-7 w-7 items-center justify-center rounded-full text-lg font-black", topKind === "help" ? "bg-white text-[#2B7FB8] shadow" : "text-white")}>?</button>
                        {kinds.map(([kind]) => <button key={kind} role="tab" aria-selected={topKind === kind} onClick={() => setTopKind(kind)} title={t(`bottle.top_${kind}`)} className={cn("flex h-9 w-10 items-center justify-center rounded-lg transition-transform", topKind === kind ? "scale-110" : "hover:scale-105")}>{tabIcon(kind, topKind === kind)}</button>)}
                      </div>
                      {topKind === "help" ? null : (
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.15)]">{t(`bottle.top_${topKind}`)}</p>
                          <select value={topPeriod} onChange={(event) => setTopPeriod(event.target.value as "all")} aria-label={t("bottle.topPeriod")} className="h-7 shrink-0 rounded-full border border-white bg-white/25 px-2 text-xs font-semibold text-white [&>option]:text-[#1F2937]">
                            <option value="all">{t("bottle.topAll")}</option>
                            <option value="week">{t("bottle.topWeek")}</option>
                            <option value="day">{t("bottle.topDay")}</option>
                          </select>
                        </div>
                      )}
                    </div>
                    {topKind === "help" ? <p className="p-3 text-sm leading-relaxed text-[#1F2937]">{t("bottle.topHelpText")}</p> : (
                      <>
                        <ol className="max-h-[min(52cqmin,380px)] overflow-y-auto bg-[linear-gradient(180deg,#E6F4FD,#FFFFFF_45%)] px-2 py-1">
                          {rows === null ? <li className="py-8 text-center text-xs text-[#6B7280]">{t("bottle.songLoading")}</li> : rows.length === 0 ? <li className="py-8 text-center text-xs text-[#6B7280]">{t("bottle.topEmpty")}</li> : rows.map((row) => (
                            <li key={row.id} className={cn("flex min-h-12 items-center gap-2 rounded-md px-1 py-1 text-[13px] text-[#111827]", row.id === meId && "bg-[#FFF3B0]")}>
                              {avatar(row.avatar, row.name)}
                              <span className="min-w-0 flex-1 truncate font-bold"><span className="tabular-nums">{row.place}.</span> {row.id === meId ? t("common.you") : row.name}</span>
                              <span className="shrink-0">{icon}</span>
                              <span className="min-w-[72px] shrink-0 text-right text-[15px] font-bold tabular-nums text-[#E2231A]">{row.count.toLocaleString("ru-RU")}</span>
                            </li>
                          ))}
                        </ol>
                        <div className="border-t border-[#E5E7EB] bg-white p-2">
                          <div className="flex min-h-12 items-center gap-2 rounded-lg border border-[#F3D97A] bg-[#FFF3B0] px-1.5 py-1 text-[13px] text-[#111827]">
                            {avatar(me.avatar, me.name)}
                            <span className="min-w-0 flex-1 truncate font-bold"><span className="tabular-nums">{mine ? `${mine.place}.` : "—"}</span> {me.name}</span>
                            <span className="shrink-0">{icon}</span>
                            <span className="min-w-[72px] shrink-0 text-right text-[15px] font-bold tabular-nums text-[#E2231A]">{(mine?.count ?? 0).toLocaleString("ru-RU")}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
                            })() : panel === "menu" ? (
                <div className="max-h-[70cqmin] overflow-y-auto">
                  <Link href="/messages" className={row}><span aria-hidden="true" className="w-6 text-center text-lg">✉️</span>{t("nav.messages")}</Link>
                  <button onClick={() => setPanel("achievements")} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">🏅</span>{t("bottle.achievements")}</button>
                  <button onClick={() => { setTopKind("kisses"); setPanel("top"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">📊</span>{t("bottle.rating")}</button>
                  <button onClick={() => { setPayNote(false); setPanel("bottles"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">🍾</span>{t("bottle.bottles")}</button>
                  <button onClick={() => { setPayNote(false); setPanel("frames"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">🖼️</span>{t("bottle.frames")}</button>
                  <button onClick={() => { setPayNote(false); setPanel("boosters"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">⚡</span>{t("bottle.boosters")}</button>
                  <button onClick={() => setPanel("rules")} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">📖</span>{t("bottle.rules")}</button>
                </div>
              ) : panel === "achievements" ? (
                <AchievementsPanel values={achValue} />
              ) : panel === "gestures" ? (
                <div className="-mx-3 -mb-3 bg-white">
                  <ul className="grid max-h-[min(60vh,420px)] grid-cols-4 gap-1.5 overflow-y-auto p-3 [scrollbar-width:thin] sm:grid-cols-5">
                    {GESTURES.map(([id, price, kind, amount]) => {
                      const left = missing([kind, amount], progress);
                      return (
                        <li key={id}>
                          <button onClick={() => sendGesture(id, price, [kind, amount])} title={left ? (left < 0 ? t("bottle.vipOnly") : lockNote(kind, left)) : undefined} className={cn("flex w-full flex-col items-center rounded-xl border border-[#EEF0F3] p-1 transition-transform hover:-translate-y-0.5 hover:shadow", left !== 0 && "opacity-60")}>
                            <img src={`/custom/gifts/ges_${id}.webp`} alt="" loading="lazy" className={cn("h-14 w-14 object-contain", left !== 0 && "grayscale")} />
                            <span className="flex h-4 items-center gap-0.5 text-[11px] font-bold text-[#3F3F46]">{left < 0 ? <b className="rounded bg-[#F59E0B] px-1 text-[9px] text-white">VIP</b> : left ? <>🔒<span className="text-[10px] font-semibold text-[#6B7280]">{left >= 1000 ? `${Math.round(left / 100) / 10}k` : left}💋</span></> : <><Heart size={11} fill="#E8352B" stroke="none" />{price}</>}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {frameNote ? <p role="status" className="border-t border-[#EEF0F3] px-3 py-2 text-center text-xs font-semibold text-[#B45309]">{frameNote}</p> : null}
                </div>
              ) : panel === "vip" ? (
                <div className="max-h-[78cqmin] overflow-y-auto text-[#1F2937]">
                  <ul className="space-y-1 text-sm">{[1, 2, 3, 4, 5, 6].map((n) => <li key={n} className="flex gap-2"><span aria-hidden="true">👑</span>{t(`bottle.vip${n}` as "bottle.vip1")}</li>)}</ul>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {vipPlans.map(([days, price]) => <button key={days} onClick={() => setPayNote(true)} className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-2 text-center hover:brightness-95"><span className="block text-sm font-black text-[#B45309]">{days} {t("bottle.days")}</span><span className="mt-1 block rounded-md bg-[#8CC63F] py-1 text-[11px] font-bold tabular-nums text-white">{price} {t("bottle.currency")}</span></button>)}
                  </div>
                  {payNote ? <p role="status" className="mt-2 rounded-lg bg-[#FEF3C7] p-2 text-center text-xs font-semibold text-[#92400E]">{t("bottle.paySoon")}</p> : null}
                </div>
              ) : panel === "bottles" ? (
                <div>
                  <ul className="grid max-h-[62cqmin] grid-cols-5 gap-1.5 overflow-y-auto p-0.5">
                    {Array.from({ length: 30 }, (_, n) => n).map((n) => {
                      const owned = ownedSkins.includes(n);
                      return (
                        <li key={n}>
                          <button onClick={() => { if (owned) return chooseSkin(n); if (!pay(skinPrice(n))) return setPayNote(true); setOwnedSkins((list) => [...list, n]); chooseSkin(n); }} aria-pressed={skin === n} aria-label={`${t("bottle.bottles")} ${n + 1}`} className={cn("flex w-full flex-col items-center rounded-lg border-2 bg-[#FDF3E1] py-1", skin === n ? "border-[#8CC63F]" : "border-transparent")}>
                            <span className="h-12" style={{ filter: skinFilter(n) }}><SkinArt set={art} n={n + 1} className="h-full" /></span>
                            <span className="flex items-center gap-0.5 text-[10px] font-bold tabular-nums text-[#7C2D12]">{owned ? "✓" : <><Heart size={10} fill="#F4511E" stroke="none" />{skinPrice(n)}</>}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {payNote ? <p role="status" className="mt-2 rounded-lg bg-[#FEF3C7] p-2 text-center text-xs font-semibold text-[#92400E]">{t("bottle.noHearts")}</p> : null}
                </div>
              ) : panel === "boosters" ? (
                <div className="space-y-2 text-[#1F2937]">
                  <div className="flex items-center gap-2 rounded-xl bg-[#FFF7ED] p-2">
                    <span aria-hidden="true" className="text-2xl">💋</span>
                    <p className="min-w-0 flex-1 text-xs"><b className="block text-sm">{t("bottle.boostDouble")}</b>{t("bottle.boostDoubleText")}</p>
                    <button disabled={Date.now() < doubleUntil} onClick={() => { if (!pay(5)) return setPayNote(true); doubleRef.current = Date.now() + 600_000; setDoubleUntil(doubleRef.current); }} className="h-8 shrink-0 rounded-md bg-[#8CC63F] px-2.5 text-xs font-bold text-white disabled:bg-[#9CA3AF]">{Date.now() < doubleUntil ? "✓" : "❤ 5"}</button>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-[#FFF7ED] p-2">
                    <span aria-hidden="true" className="text-2xl">⏩</span>
                    <p className="min-w-0 flex-1 text-xs"><b className="block text-sm">{t("bottle.boostJump")}</b>{t("bottle.boostJumpText")}</p>
                    <button disabled={jump} onClick={() => { if (!pay(3)) return setPayNote(true); jumpRef.current = true; setJump(true); }} className="h-8 shrink-0 rounded-md bg-[#8CC63F] px-2.5 text-xs font-bold text-white disabled:bg-[#9CA3AF]">{jump ? "✓" : "❤ 3"}</button>
                  </div>
                  {payNote ? <p role="status" className="rounded-lg bg-[#FEF3C7] p-2 text-center text-xs font-semibold text-[#92400E]">{t("bottle.noHearts")}</p> : null}
                </div>
              ) : panel === "frames" ? (() => {
                const pick = framePick ?? myFrame;
                const owned = (id: number) => id === 0 || myFrames.includes(id);
                const me = players[meIndex];
                return (
                  <div className="-mx-3 -mb-3 text-[#1F2937]">
                    <div className="flex items-center gap-4 border-b border-[#E5E7EB] px-4 pb-3 pt-1">
                      <span className="relative block h-24 w-24 shrink-0 p-[9%]">
                        <img src={me.avatar} alt="" className="h-full w-full rounded-lg object-cover" />
                        {pick ? <FrameArt id={pick} className={cn("pointer-events-none absolute", pick >= FIRST_ORIGINAL ? "-inset-[8%] h-[116%] w-[116%]" : "inset-0 h-full w-full")} /> : null}
                        <span className="absolute inset-x-[9%] bottom-[9%] truncate rounded-b-lg bg-black/45 px-1 text-center text-[10px] font-semibold text-white">{me.name}, {me.age}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">{t(pick ? "bottle.frameHint" : "bottle.frameNone")}</p>
                        <button onClick={() => void applyFrame(pick)} disabled={pick === myFrame} className="mt-2 flex h-9 items-center gap-1.5 rounded-lg bg-[linear-gradient(180deg,#8EDB5A,#5DB13A)] px-4 text-sm font-bold text-white shadow disabled:bg-none disabled:bg-[#D1D5DB] disabled:shadow-none">{owned(pick) ? t("bottle.frameApply") : <><Heart size={14} fill="#FFFFFF" stroke="none" />{FRAME_PRICE} · {t("bottle.frameBuy")}</>}</button>
                        {frameNote ? <p role="status" className="mt-1.5 text-xs font-semibold text-[#B45309]">{frameNote}</p> : null}
                      </div>
                    </div>
                    <ul className="grid h-[calc(100cqh-230px)] max-h-[440px] min-h-[220px] grid-cols-4 content-start gap-2 overflow-y-auto p-3 [scrollbar-width:thin] sm:grid-cols-5">
                      {[0, ...ORIGINAL_FRAMES.map((_, n) => FIRST_ORIGINAL + n), ...frameLooks.map((_, n) => n + 1)].map((id) => {
                        const look = frameLooks[id - 1];
                        const mine = owned(id);
                        return (
                          <li key={id}>
                            <button onClick={() => { setFramePick(id); setFrameNote(null); }} aria-pressed={pick === id} aria-label={`${t("bottle.frames")} ${id}`} className={cn("flex w-full flex-col items-center gap-0.5 rounded-xl border-2 bg-white p-1 shadow-sm transition-transform hover:-translate-y-0.5", pick === id ? "border-[#8CC63F] bg-[#F4FBEA]" : "border-transparent")}>
                              <span className="relative block aspect-square w-full">
                                {id ? <FrameArt id={id} still className="h-full w-full" /> : <span className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-[#D1D5DB] text-[#9CA3AF]"><X size={18} /></span>}
                              </span>
                              <span className="flex h-4 items-center gap-0.5 text-xs font-bold tabular-nums">
                                {id === myFrame ? <Check size={14} strokeWidth={3} className="text-[#65A30D]" /> : mine ? <span className="text-[10px] text-[#65A30D]">{t("bottle.frameOwned")}</span> : look?.pass ? <span className="rounded bg-[#7C3AED] px-1 text-[9px] text-white">PASS</span> : look?.vip && !vip ? <span className="rounded bg-[#F59E0B] px-1 text-[9px] text-white">VIP</span> : <><Heart size={12} fill="#E8352B" stroke="none" />{FRAME_PRICE}</>}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })() : (
                <ol className="max-h-[70cqmin] list-decimal space-y-1.5 overflow-y-auto pl-6 pr-1 text-sm text-[#1F2937]">
                  {[1, 2, 3, 4].map((n) => <li key={n}>{t(`bottle.rule${n}` as "bottle.rule1")}</li>)}
                </ol>
              )}
            </div>
          </div>
        ) : null}
      </div>
      </div>

      <div className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col", wide ? "-ml-px" : "-mt-px")}>
        {video && wide && !musicMode ? (
          <div className={cn("relative w-full shrink-0 bg-black", picked !== null || dedicate ? "h-0 overflow-hidden" : "aspect-video max-h-[42%]")}>
            <iframe ref={frameRef} onLoad={() => window.setTimeout(pushMusic, 800)} src={ytSrc(video)} title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
            {soundPill}
            <button onClick={() => setVideo(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"><X size={15} /></button>
          </div>
        ) : null}
        {video && !wide && !musicMode ? (
          <div ref={miniRef} style={mini.x === null ? { right: 0, top: mini.y, width: musicMode ? Math.max(mini.w, 262) : mini.w } : { left: mini.x, top: mini.y, width: musicMode ? Math.max(mini.w, 262) : mini.w }} className={cn("absolute z-20 overflow-hidden border shadow-lg", musicMode ? "border-[#4C1D95] bg-[linear-gradient(160deg,#1E1B3A,#4C1D95_65%,#BE185D)] text-white" : "border-border bg-surface", mini.x === null ? "rounded-l-2xl border-r-0" : "rounded-2xl")}>
            <div className="flex items-center">
              <img src={players[meIndex].avatar} alt="" title={t("bottle.miniMove")} onPointerDown={(event) => startMini(event, "move")} className="mx-2 h-10 w-10 shrink-0 cursor-move touch-none select-none rounded-full border-2 border-border object-cover" draggable={false} />
              <div className={cn(musicMode ? "my-1 mr-1 h-[200px] w-[200px] shrink-0 overflow-hidden rounded-xl" : "aspect-video min-w-0 flex-1", "bg-black", miniBusy && "pointer-events-none")}><iframe ref={frameRef} onLoad={() => window.setTimeout(pushMusic, 800)} src={ytSrc(video)} title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" /></div>
            </div>
            {musicMode ? <div className="flex items-center gap-2 px-2 pt-0.5"><Equalizer className="h-4 shrink-0" /><p className="min-w-0 flex-1 truncate text-xs font-bold">{videoTitle}</p></div> : null}
            {soundPill}
            <div className="flex items-center gap-1.5 px-2 py-1">
              <button onClick={() => setMusic(music ? 0 : 60)} aria-label={t(music ? "videos.mute" : "videos.unmute")} title={t(music ? "videos.mute" : "videos.unmute")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:text-text">{music ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
              <input type="range" min={0} max={100} value={music} onChange={(event) => setMusic(Number(event.target.value))} aria-label={t("bottle.music")} className="min-w-0 flex-1 accent-[#8CC63F]" />
              <button onClick={() => setVideo(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:text-text"><X size={15} /></button>
            </div>
            <span role="separator" aria-label={t("bottle.miniSize")} title={t("bottle.miniSize")} onPointerDown={(event) => startMini(event, "size")} className="absolute bottom-0 left-0 h-5 w-5 cursor-nesw-resize touch-none bg-[linear-gradient(225deg,transparent_50%,rgba(120,130,140,0.7)_50%)]" />
          </div>
        ) : null}
        {audio || (video && musicMode) ? (
          // PC: a bar above the chat. Phone: a small square window like the video one, which can be moved and resized.
          <div ref={wide ? undefined : miniRef} style={wide ? undefined : mini.x === null ? { right: 4, top: mini.y, width: Math.min(mini.w, 220) } : { left: mini.x, top: mini.y, width: Math.min(mini.w, 220) }} className={cn("overflow-hidden bg-[linear-gradient(120deg,#1E1B3A,#4C1D95_60%,#BE185D)] text-white", wide ? "relative shrink-0 p-2.5" : "absolute z-20 rounded-2xl border border-white/15 p-2 pt-7 shadow-xl", miniBusy && !wide && "select-none")}>
            {audio ? <audio src={audio.url} autoPlay playsInline ref={(node) => { audioRef.current = node; if (node) node.volume = music / 100; }} onPlay={() => setTune((v) => ({ ...v, playing: true }))} onPause={() => setTune((v) => ({ ...v, playing: false }))} onEnded={() => setTune((v) => ({ ...v, playing: false }))} onLoadedMetadata={(event) => { const node = event.currentTarget; const dur = node.duration || 0; const at = songNow(); if (at > 2 && at < dur) node.currentTime = at; setTune((v) => ({ ...v, dur })); }} onTimeUpdate={(event) => { const cur = event.currentTarget.currentTime; setTune((v) => ({ ...v, cur })); }} className="hidden" /> : null}
            {/* Songs from the MP3 tab: the YouTube player plays behind the card, only the music player is seen. */}
            {!audio && video ? <iframe ref={frameRef} onLoad={() => { window.setTimeout(pushMusic, 800); frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*"); }} src={ytSrc(video)} title="YouTube" allow="autoplay; encrypted-media" tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-[200px] w-[200px] opacity-0" /> : null}
            {wide ? (
              <div className="relative flex items-center gap-3 pr-8">
              <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-[radial-gradient(circle,#BE185D_20%,#111_21%,#2a2a2a_45%,#111_46%,#333_70%,#111_71%)] bg-cover bg-center shadow-lg", tune.playing && "animate-[spin_3s_linear_infinite]")} style={!audio && video ? { backgroundImage: `radial-gradient(circle,#1E1B3A 14%,transparent 15%),url(https://i.ytimg.com/vi/${video}/mqdefault.jpg)` } : undefined}><span className="h-2 w-2 rounded-full bg-white/80" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">♫ {t("bottle.musicNow")}</p>
                <p className="truncate text-sm font-black">{audio ? audio.name : videoTitle}</p>
                <div className="mt-1 flex items-center gap-2">
                  <button onClick={() => { const node = audio ? audioRef.current : null; if (node) { if (node.paused) void node.play().catch(() => {}); else node.pause(); return; } setTouched(true); ytCall(tune.playing ? "pauseVideo" : "playVideo"); if (!tune.playing) ytCall("unMute"); }} aria-label={tune.playing ? "Pause" : "Play"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#4C1D95] shadow hover:scale-105">{tune.playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="translate-x-px" />}</button>
                  <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-white/70">{clock(tune.cur)}</span>
                  <input type="range" min={0} max={Math.max(1, Math.floor(tune.dur))} value={Math.floor(tune.cur)} onChange={(event) => { const at = Number(event.target.value); const node = audio ? audioRef.current : null; if (node) node.currentTime = at; else ytCall("seekTo", [at, true]); setTune((v) => ({ ...v, cur: at })); }} aria-label={audio ? audio.name : videoTitle} className="min-w-0 flex-1 accent-[#EC4899]" />
                  <span className="w-9 shrink-0 text-[10px] tabular-nums text-white/70">{clock(tune.dur)}</span>
                  <Equalizer className={cn("h-5 shrink-0", !tune.playing && "opacity-40 [&>span]:![animation-play-state:paused]")} />
                </div>
              </div>
            </div>
            ) : (
            <div className="flex flex-col items-center">
              <span title={t("bottle.miniMove")} onPointerDown={(event) => startMini(event, "move")} className="flex w-full cursor-move touch-none select-none justify-center pb-1.5 pt-0.5"><span className={cn("flex shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-[radial-gradient(circle,#BE185D_20%,#111_21%,#2a2a2a_45%,#111_46%,#333_70%,#111_71%)] bg-cover bg-center shadow-lg", tune.playing && "animate-[spin_3s_linear_infinite]", "h-auto w-[58%] aspect-square")} style={!audio && video ? { backgroundImage: `radial-gradient(circle,#1E1B3A 14%,transparent 15%),url(https://i.ytimg.com/vi/${video}/mqdefault.jpg)` } : undefined}><span className="h-2 w-2 rounded-full bg-white/80" /></span></span>
              <p className="w-full truncate text-center text-xs font-black">{audio ? audio.name : videoTitle}</p>
              <div className="mt-1.5 flex w-full items-center gap-1.5">
                <button onClick={() => { const node = audio ? audioRef.current : null; if (node) { if (node.paused) void node.play().catch(() => {}); else node.pause(); return; } setTouched(true); ytCall(tune.playing ? "pauseVideo" : "playVideo"); if (!tune.playing) ytCall("unMute"); }} aria-label={tune.playing ? "Pause" : "Play"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#4C1D95] shadow">{tune.playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="translate-x-px" />}</button>
                <input type="range" min={0} max={Math.max(1, Math.floor(tune.dur))} value={Math.floor(tune.cur)} onChange={(event) => { const at = Number(event.target.value); const node = audio ? audioRef.current : null; if (node) node.currentTime = at; else ytCall("seekTo", [at, true]); setTune((v) => ({ ...v, cur: at })); }} aria-label={audio ? audio.name : videoTitle} className="min-w-0 flex-1 accent-[#EC4899]" />
                <Equalizer className={cn("h-4 shrink-0", !tune.playing && "opacity-40 [&>span]:![animation-play-state:paused]")} />
              </div>
              <p className="mt-0.5 w-full text-center text-[10px] tabular-nums text-white/60">{clock(tune.cur)} / {clock(tune.dur)}</p>
            </div>
            )}
            {!audio && soundPill}
            <button onClick={() => { if (audio) setAudio(null); else setVideo(null); }} aria-label={t("photos.close")} title={t("photos.close")} className={cn("absolute flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70", wide ? "right-2 top-2 h-7 w-7" : "right-1.5 top-1.5 h-6 w-6")}><X size={14} /></button>
            {wide ? null : <span role="separator" aria-label={t("bottle.miniSize")} title={t("bottle.miniSize")} onPointerDown={(event) => startMini(event, "size")} className="absolute bottom-0 left-0 h-5 w-5 cursor-nesw-resize touch-none bg-[linear-gradient(225deg,transparent_50%,rgba(255,255,255,0.45)_50%)]" />}
          </div>
        ) : null}
        <div className={cn("flex items-center gap-2 border-b border-border px-3 py-1.5", (picked !== null || dedicate || !wide) && "hidden")}>
          <p className="min-w-0 flex-1 truncate text-[11px] text-muted">{online ? (net?.room ? `🔒 ${net.room.name} · ${seated.length}/${net.room.capacity}` : `${t("bottle.liveNote")} ${net?.table ?? ""} · ${seated.length}/12`) : t("bottle.demoNote")}</p>
          {canDeleteRoom ? <button onClick={() => void deleteRoom()} className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#7C2D12] px-2.5 text-xs font-bold text-white hover:bg-[#9A3412]"><Trash2 size={13} strokeWidth={2.6} />{t("bottle.roomDelete")}</button> : null}
          {net?.room ? <button onClick={leaveRoom} className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#E5484D] px-2.5 text-xs font-bold text-white hover:bg-[#D13438]"><X size={13} strokeWidth={3} />{t("bottle.roomLeave")}</button> : null}
          {full && wide ? <button onClick={() => chooseMode(!dedicate)} aria-pressed={dedicate} aria-label={t("bottle.dedicate")} title={t("bottle.dedicate")} className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white", dedicate ? "bg-[#3E9B23] ring-2 ring-[#5CC93B]/40" : "bg-[#5CC93B] hover:bg-[#4DB52E]")}><Plus size={17} strokeWidth={3} /></button> : null}
          {full && wide ? <button onClick={onLeave} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B4B9C2] text-white hover:bg-[#9AA3AE]"><X size={15} strokeWidth={3} /></button> : null}
        </div>
        {picked !== null || dedicate ? (
          <div className="flex min-h-0 flex-1 flex-col">
            {dedicate ? (
              <div className="flex items-center gap-2 bg-white px-3 py-2">
                <p className="min-w-0 flex-1 truncate text-[13px] text-[#B4B9C2]">{t("bottle.pickReceivers")}{chosen.length ? <b className="ml-1 text-[#5CC93B]">· {chosen.length}</b> : null}</p>
                <button onClick={() => setChosen(players.filter((player) => !player.empty && !player.me).map((player) => player.id))} aria-label={t("bottle.pickAll")} title={t("bottle.pickAll")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5CC93B] text-white hover:bg-[#4DB52E]"><Users size={15} strokeWidth={2.6} /></button>
                <button onClick={() => setChosen(picked !== null && !players[picked].me && !players[picked].empty ? [players[picked].id] : [])} aria-label={t("bottle.pickProfile")} title={t("bottle.pickProfile")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5CC93B] text-white hover:bg-[#4DB52E]"><UserCheck size={15} strokeWidth={2.6} /></button>
                <button onClick={() => chooseMode(false)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EF2D2D] text-white hover:bg-[#D81F1F]"><X size={15} strokeWidth={3} /></button>
              </div>
            ) : picked !== null ? (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5">
              <button onClick={() => setCard(true)} aria-label={`${players[picked].name}, ${players[picked].age}`} className="shrink-0"><img src={players[picked].avatar} alt="" className="h-7 w-7 rounded-full object-cover" /></button>
              {players[picked].me ? <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#9AA3AE]">{t("bottle.gestures")}</p> : <p className="min-w-0 flex-1 text-[12px] leading-[1.15] text-[#B4B9C2]">{t("bottle.giftFor")}<span className="block truncate text-[13px] font-bold text-[#9AA3AE]">{players[picked].name}</span></p>}
              {players[picked].me ? null : <button onClick={() => chooseMode(true)} aria-label={t("bottle.dedicate")} title={t("bottle.dedicate")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5CC93B] text-white hover:bg-[#4DB52E]"><Plus size={17} strokeWidth={3} /></button>}
              <button onClick={() => setPicked(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B4B9C2] text-white hover:bg-[#9AA3AE]"><X size={15} strokeWidth={3} /></button>
            </div>
            ) : null}
            {!dedicate && picked !== null && players[picked].me ? (
            <div role="menu" className={cn("grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto bg-white p-2", wide ? "grid-cols-[repeat(auto-fill,minmax(68px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(56px,1fr))]")}>
              {GESTURES.map(([id, price, kind, amount]) => {
                const left = missing([kind, amount], progress);
                return (
                  <button key={id} role="menuitem" aria-disabled={left !== 0} onClick={() => sendGesture(id, price, [kind, amount])} title={left ? (left < 0 ? t("bottle.vipOnly") : lockNote(kind, left)) : undefined} className="group flex flex-col items-center gap-0.5 rounded-xl p-1 hover:bg-[#FFF4E5]">
                    <img src={`/custom/gifts/ges_${id}.webp`} alt="" loading="lazy" className={cn("object-contain transition-transform duration-150 group-hover:scale-110", wide ? "h-14 w-14" : "h-11 w-11", left !== 0 && "opacity-75 grayscale")} />
                    <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-[#3F3F46]">{left < 0 ? <b className="rounded bg-[#F59E0B] px-1 text-[10px] text-white">VIP</b> : left ? <span aria-label={`${left}`} className="text-[11px] opacity-70">🔒</span> : <><Heart size={13} fill="#E8352B" stroke="none" />{price}</>}</span>
                  </button>
                );
              })}
            </div>
            ) : (
            <div role="menu" className={cn("grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto bg-white p-2", wide ? "grid-cols-[repeat(auto-fill,minmax(68px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(56px,1fr))]")}>
              {[...giftChoices.slice(0, 2), ...customGiftNames(art).filter((name) => !name.startsWith("ges_")).map((name) => [`c:${name}`, GIFT_PRICES[name] ?? customPrice(name), missing(GIFT_RULES[`c:${name}`], progress)] as [string, number, number]), ...giftChoices.slice(2), ...lockedGifts.map(([gift, price, need]) => [gift, price, Math.max(0, need - progress.kisses)] as [string, number, number])].map(([gift, price, need], order) => (
                <button key={`${gift}-${order}`} role="menuitem" aria-disabled={need === -1 ? !vip : Boolean(need)} onPointerDown={(event) => pressGift(giftTargets, gift, price, need, event.clientX, event.clientY)} onPointerMove={(event) => { const state = pressed.current; if (state && !state.started && Math.hypot(event.clientX - state.x, event.clientY - state.y) > 8) cancelPress(); }} onPointerUp={() => releaseGift(giftTargets, gift, price, need)} onPointerLeave={cancelPress} onPointerCancel={cancelPress} onContextMenu={(event) => event.preventDefault()} onKeyDown={(event) => { if (event.key === "Enter" && !event.repeat) giveMany(giftTargets, gift, price, need); }} aria-label={`${t("gifts.send")} ${price}`} className={cn("group flex touch-pan-y select-none flex-col items-center gap-0.5 rounded-xl p-1 hover:bg-[#FFF4E5]", (need === -1 ? !vip : Boolean(need)) ? "grayscale [&>img]:opacity-75" : hearts < price && "opacity-50")}>
                  <Gift id={gift} className={cn("transition-transform duration-150 group-hover:scale-110", wide ? "h-14 w-14" : "h-11 w-11")} />
                  <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-[#3F3F46]">{need === -1 ? <b className="rounded bg-[#F59E0B] px-1 text-[10px] text-white">VIP</b> : need ? <span aria-label={`${need}`} className="text-[11px] opacity-70">🔒</span> : <><Heart size={13} fill="#E8352B" stroke="none" />{price}</>}</span>
                </button>
              ))}
            </div>
            )}
            {frameNote && picked !== null && players[picked].me ? <p role="status" className="border-t border-border px-3 py-2 text-center text-xs font-semibold text-[#B45309]">{frameNote}</p> : null}
            {giftNote ? <p role="status" className="border-t border-border px-3 py-2 text-center text-xs font-semibold text-text">{giftNote}</p> : null}
          </div>
        ) : null}
        <div ref={listRef} className={cn("min-h-0 flex-1 space-y-2 overflow-y-auto p-3", (picked !== null || (dedicate && !wide)) && "hidden")}>
          {lines.filter((line) => !line.text || !muted.includes(line.from)).map((line) => {
            const from = byId(line.from);
            const to = line.to ? byId(line.to) : null;
            if (line.event) return (
              <p key={line.id} className={cn("rounded-lg px-2.5 py-1.5 text-[13px] font-semibold", line.event.kind === "saved" ? "bg-[#DCFCE7]/10 text-[#86EFAC]" : "bg-[#FEE2E2]/10 text-[#FCA5A5]")}>
                <img src={emojiSrc(line.event.kind === "saved" ? "🛟" : "🦶")} alt="" className="mr-1.5 inline h-5 w-5 align-[-5px]" />
                {line.event.kind === "kicked" ? <><b>{line.event.b}</b> {t("bottle.kickedLine")}</> : <><b>{line.event.a}</b> {t(line.event.kind === "kick" ? "bottle.kickLine" : "bottle.saveLine")} <b>{line.event.b}</b></>}
              </p>
            );
            if (line.admire) return (
              <div key={line.id} className="flex items-center gap-2 text-sm">
                <img src={from?.avatar || line.admire.avatar || cartoonAvatar(3, false)} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                {line.admire.lost
                  ? <p className="min-w-0 flex-1 text-text">💔 <span className="font-semibold text-[#E0457B]">{line.admire.by}</span> {t("bottle.admireLost1")} <b>{line.admire.target}</b> {t("bottle.admireLost2")}</p>
                  : <p className="min-w-0 flex-1 text-text"><span className="font-semibold text-[#E0457B]">{from?.me ? t("common.you") : from?.name ?? line.admire.by}</span> {t("bottle.admireLine")} <span className="inline-flex items-center gap-0.5 whitespace-nowrap font-bold"><Heart size={13} fill="#E8352B" stroke="none" className="inline" />{line.admire.amount}</span></p>}
                {to ? <><span className="font-bold text-accent">»</span><img src={to.avatar} alt={to.name} title={to.name} className="h-8 w-8 shrink-0 rounded-md object-cover" /></> : null}
              </div>
            );
            if (!from) return null;
            if (line.gesture) return (
              <div key={line.id} className="flex items-center gap-2 text-sm">
                <img src={from.avatar} alt={from.name} className="h-8 w-8 shrink-0 rounded-md object-cover" />
                <span className="font-semibold text-muted">{from.me ? t("common.you") : from.name}:</span>
                <img src={`/custom/anim/ges_${line.gesture}.webp`} alt="" className="h-14 w-14 shrink-0 object-contain" />
              </div>
            );
            if (line.bottle) return (
              <div key={line.id} className="flex items-center gap-2 text-sm" title={`${from.name} ${t("bottle.bottleChanged")}`}>
                <img src={from.avatar} alt={from.name} className="h-8 w-8 shrink-0 rounded-md object-cover" />
                <span className="flex h-9 w-9 shrink-0 rotate-45 items-center justify-center opacity-60"><SkinArt set={art} n={line.bottle.a + 1} className="h-9" /></span>
                <span className="font-bold text-accent">➜</span>
                <span className="flex h-9 w-9 shrink-0 rotate-45 items-center justify-center"><SkinArt set={art} n={line.bottle.b + 1} className="h-9" /></span>
              </div>
            );
            const receivers = (line.tos ?? (line.to ? [line.to] : [])).map((id) => byId(id)).filter((player): player is Player => Boolean(player));
            const fromIndex = players.findIndex((player) => player.id === line.from);
            return (
              <div key={line.id} className="relative flex items-center gap-2 text-sm">
                <img src={from.avatar} alt={from.name} title={from.name} className="h-8 w-8 shrink-0 rounded-md object-cover" />
                {line.text ? (
                  <div className="min-w-0">
                    <p onDoubleClick={() => !from.me && setLineMenu(line.id)} onContextMenu={(event) => { if (from.me) return; event.preventDefault(); setLineMenu(line.id); }} onTouchStart={() => { if (from.me) return; window.clearTimeout(pressTimer.current); pressTimer.current = window.setTimeout(() => setLineMenu(line.id), 500); }} onTouchEnd={() => window.clearTimeout(pressTimer.current)} onTouchMove={() => window.clearTimeout(pressTimer.current)} className={cn("break-words rounded-md text-text", lineMenu === line.id && "bg-white/10")}>
                      <span className="font-semibold text-muted">{from.me ? t("common.you") : from.name}</span>{(() => { const decor = decorOf(line.from); return decor ? decor.startsWith("/") ? <img src={decor} alt="" className="ml-0.5 inline h-4 w-4 align-[-3px]" /> : <span title="VIP" className="ml-0.5 text-[11px]">💎</span> : null; })()}<span className="font-semibold text-muted">: </span>{line.text}
                    </p>
                    {!from.me && /[а-яёА-ЯЁ]|[\u0600-\u06FF]|[\u10A0-\u10FF]/.test(line.text) ? <a href={`https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(line.text)}`} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-[#8AB4F8] hover:underline">{t("bottle.translate")}</a> : null}
                    {lineMenu === line.id ? (
                      <div role="menu" className="absolute left-10 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface text-sm shadow-xl" onMouseLeave={() => setLineMenu(null)}>
                        <button role="menuitem" onClick={() => { setDraft(`${from.name}, `); setLineMenu(null); }} className="block w-full px-3 py-2 text-left hover:bg-surface-2">↩ {t("bottle.reply")}</button>
                        <a role="menuitem" href={`https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(line.text)}`} target="_blank" rel="noreferrer" onClick={() => setLineMenu(null)} className="block w-full px-3 py-2 text-left hover:bg-surface-2">🌐 {t("bottle.translate")}</a>
                        <button role="menuitem" onClick={() => { setLineMenu(null); setGiftNote(null); say({ from: "me", text: `⚑ ${t("bottle.reportSent")}` }); }} className="block w-full px-3 py-2 text-left text-[#F87171] hover:bg-surface-2">⚑ {t("bottle.report")}</button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {line.song ? (() => { const song = songInfo(line.song); return <p className="flex min-w-0 flex-1 items-center gap-1 text-text"><span className="shrink-0 font-semibold text-muted">{from.me ? t("common.you") : from.name}:</span><span className="truncate font-semibold">{song.title}</span><Music2 size={16} className="shrink-0 text-[#8AB4F8]" /><span className="flex shrink-0 items-center gap-0.5 font-bold">{song.price}<Heart size={14} fill="#F87171" stroke="none" /></span></p>; })() : null}
                {line.gift && receivers.length ? (
                  <>
                    <Gift id={line.gift} className="h-7 w-7 shrink-0" />
                    {(line.count ?? 1) > 1 ? <span className="shrink-0 rounded-full bg-white/10 px-1.5 text-xs font-black text-[#FCD34D]">×{line.count}</span> : null}
                    <span className="font-bold text-accent">»</span>
                    <span className="flex min-w-0 flex-wrap items-center gap-1">{receivers.slice(0, 6).map((player) => <img key={player.id} src={player.avatar} alt={player.name} title={player.name} className={cn("shrink-0 rounded-md object-cover", receivers.length > 1 ? "h-6 w-6" : "h-8 w-8")} />)}{receivers.length > 6 ? <span className="text-xs font-bold text-muted">+{receivers.length - 6}</span> : null}</span>
                    {!from.me && fromIndex >= 0 && !players[fromIndex].empty ? <button onClick={() => { const price = priceOf(line.gift ?? ""); if (price) giveGift(fromIndex, line.gift ?? "", price); }} aria-label={t("bottle.giftBack")} title={t("bottle.giftBack")} className="ml-auto flex h-7 shrink-0 items-center gap-0.5 rounded-full bg-[#5CC93B] px-2 text-[11px] font-bold text-white hover:bg-[#4DB52E]">↩<Heart size={11} fill="#FFFFFF" stroke="none" />{priceOf(line.gift ?? "")}</button> : null}
                  </>
                ) : null}
                {to && !line.gift ? <>{line.song ? null : <span className="shrink-0 text-lg">💋</span>}<span className="font-bold text-accent">»</span><img src={to.avatar} alt={to.name} title={to.name} className="h-8 w-8 shrink-0 rounded-md object-cover" /></> : null}
              </div>
            );
          })}
        </div>
        <form onSubmit={handleChat} className={cn("flex items-center gap-2 border-t border-border p-2.5", picked !== null && "hidden")}>
          <input ref={chatRef} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={200} aria-label={t("messages.placeholder")} placeholder={t("messages.placeholder")} autoComplete="off" className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
          <button type="button" onClick={() => { setFrameNote(null); pullProgress.current(); if (dedicate) chooseMode(false); setCard(false); meTap.current = Date.now(); setPicked(meIndex); }} aria-label={t("bottle.gestures")} title={t("bottle.gestures")} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xl">😊</button>
          <button type="submit" disabled={!draft.trim()} aria-label={t("messages.send")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EE8A2B] text-white disabled:opacity-40"><SendHorizontal size={17} /></button>
        </form>
      </div>
      {lock ? (() => {
        const have = lock.kind === "vip" ? 0 : Math.min(lock.total, progress[lock.kind as "kisses"] ?? 0);
        const icon = lock.kind === "dj" ? "🎵" : lock.kind === "friends" ? "👥" : lock.kind === "gestures" ? "😊" : "💋";
        const more = () => { setLock(null); if (lock.kind === "friends") openInvite(); else if (lock.kind === "vip") { setPayNote(false); setPanel("shop"); } else if (lock.kind === "kisses" || lock.kind === "dj") { setPicked(null); setCard(false); setTopPeriod("all"); setTopKind(lock.kind === "dj" ? "songs" : "kisses"); setPanel("top"); } else setPanel("rules"); };
        return (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/35 p-4" onClick={() => setLock(null)}>
            <div role="dialog" aria-label={t(`bottle.lockTitle_${lock.kind}` as "bottle.lockTitle_kisses")} onClick={(event) => event.stopPropagation()} className="relative w-full max-w-[380px] animate-[bottle-pop_0.25s_ease-out] rounded-2xl bg-white px-5 pb-5 pt-4 text-center text-[#1F2937] shadow-2xl">
              <button onClick={() => setLock(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8CC63F] bg-white text-[#8CC63F] shadow"><X size={18} strokeWidth={3} /></button>
              <p className="text-sm font-bold text-[#C4C9D0]">{t(`bottle.lockTitle_${lock.kind}` as "bottle.lockTitle_kisses")}</p>
              <div className="mx-auto mt-3 flex h-20 w-20 items-center justify-center">{lock.gesture ? <img src={`/custom/anim/ges_${lock.gesture}.webp`} alt="" className="h-full w-full object-contain" /> : lock.gift ? <Gift id={lock.gift} className="h-full w-full" /> : null}</div>
              <p className="mt-3 text-[15px] leading-snug">{t(`bottle.lockText_${lock.kind}` as "bottle.lockText_kisses")}</p>
              {lock.kind === "vip" ? null : (
                <>
                  <div className="mx-auto mt-3 h-2 w-[70%] overflow-hidden rounded-full bg-[#EEF0F3]"><span className="block h-full rounded-full bg-[linear-gradient(90deg,#FF6B81,#E8352B)] transition-[width]" style={{ width: `${Math.max(2, (have / Math.max(1, lock.total)) * 100)}%` }} /></div>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-base"><span className="text-lg">{icon}</span><b className="tabular-nums">{have.toLocaleString("ru-RU")}</b><span className="tabular-nums text-[#6B7280]">/{lock.total.toLocaleString("ru-RU")}</span></p>
                </>
              )}
              <div className="mt-4 flex justify-center gap-3">
                <button onClick={() => setLock(null)} className="h-10 min-w-[110px] rounded-lg border-2 border-[#8CC63F] px-4 text-sm font-semibold text-[#5B9A1F] hover:bg-[#F3FAE9]">{t("bottle.lockOk")}</button>
                <button onClick={more} className="h-10 min-w-[110px] rounded-lg bg-[#2F80ED] px-4 text-sm font-semibold text-white hover:bg-[#2670D6]">{t(lock.kind === "vip" ? "bottle.lockVip" : "bottle.lockMore")}</button>
              </div>
            </div>
          </div>
        );
      })() : null}
      {complimentIn ? (
        <div className="absolute inset-0 z-[58] flex items-center justify-center bg-black/30 p-4" onClick={() => setComplimentIn(null)}>
          <div role="dialog" aria-label={t("bottle.cmpGot")} onClick={(event) => event.stopPropagation()} className="relative w-full max-w-[330px] animate-[bottle-pop_0.25s_ease-out] rounded-2xl bg-white p-4 text-[#1F2937] shadow-2xl">
            <button onClick={() => setComplimentIn(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#F87171] bg-white text-[#F87171] shadow"><X size={16} strokeWidth={3} /></button>
            <p className="text-center text-lg font-black">{t("bottle.cmpGot")}</p>
            <div className="mt-3 flex items-center gap-3">
              <img src={complimentIn.avatar} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover shadow" />
              <p className="min-w-0 text-sm leading-snug"><b className="block truncate text-[#E11D48]">{complimentIn.name}</b><span className="text-[#6B7280]">{t("bottle.cmpSaid1")} {complimentIn.name} {t("bottle.cmpSaid2")}</span></p>
            </div>
            <div className="mt-3"><ComplimentPill kind={complimentIn.kind} big /></div>
            <button onClick={() => setComplimentIn(null)} className="mt-3 h-11 w-full rounded-xl bg-[linear-gradient(180deg,#F87171,#E5484D)] text-sm font-bold text-white shadow hover:brightness-110">{t("bottle.cmpThanks")} 💗</button>
          </div>
        </div>
      ) : null}
      {kickedToast ? (
        <div role="alert" className="absolute left-1/2 top-3 z-[57] flex w-[min(360px,calc(100%-24px))] -translate-x-1/2 items-center gap-2 rounded-2xl border border-[#FCA5A5] bg-white p-2 text-[#1F2937] shadow-2xl">
          <img src={emojiSrc("🦶")} alt="" className="h-9 w-9 shrink-0" />
          <p className="min-w-0 flex-1 text-sm font-semibold">{t("bottle.kickedYou")}</p>
          <button onClick={() => setKickedToast(false)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B7280] hover:text-[#111827]"><X size={16} /></button>
        </div>
      ) : null}
      {lostToast ? (
        <div role="status" className="absolute left-1/2 top-3 z-[57] flex w-[min(360px,calc(100%-24px))] -translate-x-1/2 items-center gap-2 rounded-2xl border border-[#F9A8C4] bg-white p-2 text-[#1F2937] shadow-2xl">
          <span aria-hidden="true" className="text-2xl">💔</span>
          {lostToast.avatar ? <img src={lostToast.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : null}
          <p className="min-w-0 flex-1 text-sm"><b>{lostToast.by}</b> {t("bottle.admireLost1")} <b>{lostToast.target}</b> {t("bottle.admireLost2")}</p>
          <button onClick={() => setLostToast(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B7280] hover:text-[#111827]"><X size={16} /></button>
        </div>
      ) : null}
      {dmToast && dmToast.id !== dm?.id ? (
        <div role="status" className="absolute bottom-16 left-1/2 z-[56] flex w-[min(330px,calc(100%-24px))] -translate-x-1/2 items-center gap-2 rounded-2xl border border-border bg-surface p-2 shadow-2xl">
          <button onClick={() => openDm(dmToast)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <img src={dmToast.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            <span className="min-w-0 text-sm text-text"><b>{dmToast.name}</b> {t("bottle.dmToast")}<span className="block text-xs font-semibold text-accent">{t("bottle.dmOpen")}</span></span>
          </button>
          <button onClick={() => setDmToast(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:text-text"><X size={16} /></button>
        </div>
      ) : null}
      {dm ? (
        <div role="dialog" aria-label={`${t("bottle.write")}: ${dm.name}`} style={{ width: dmSize.w, height: dmSize.h }} className="absolute bottom-0 right-3 z-[55] flex max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-2xl">
          <div className="flex h-11 shrink-0 items-center gap-1.5 bg-[#3B9EDD] pl-1 pr-2 text-white">
            <button type="button" aria-label={t("bottle.dmResize")} title={t("bottle.dmResize")}
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dmDrag.current = { x: event.clientX, y: event.clientY, w: dmSize.w, h: dmSize.h }; }}
              onPointerMove={(event) => { const start = dmDrag.current; if (start) setDmSize({ w: Math.min(DM_FULL.w, Math.max(190, start.w - (event.clientX - start.x))), h: Math.min(DM_FULL.h, Math.max(150, start.h - (event.clientY - start.y))) }); }}
              onPointerUp={() => { dmDrag.current = null; }} onPointerCancel={() => { dmDrag.current = null; }}
              onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowRight") setDmSize((size) => ({ w: Math.max(190, size.w - 20), h: Math.max(150, size.h - 30) })); if (event.key === "ArrowUp" || event.key === "ArrowLeft") setDmSize((size) => ({ w: Math.min(DM_FULL.w, size.w + 20), h: Math.min(DM_FULL.h, size.h + 30) })); }}
              onDoubleClick={() => setDmSize(DM_FULL)}
              className="flex h-9 w-7 shrink-0 cursor-nwse-resize touch-none items-center justify-center rounded hover:bg-white/20">
              <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5"><path d="M1 9L9 1M1 5l4-4M1 13L13 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
            <img src={dm.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{dm.name}</span>
            <button onClick={() => setDm(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/20"><X size={17} /></button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
            {dmLines.map((item, index) => <p key={index} className={cn("max-w-[80%] break-words rounded-2xl px-3 py-1.5 text-sm", item.mine ? "self-end bg-[#3B9EDD] text-white" : "self-start bg-surface-2 text-text")}>{item.text}</p>)}
          </div>
          {dmNote ? <button onClick={() => { setPayNote(false); setPanel("vip"); }} className="border-t border-border bg-[#FEF3C7] px-2 py-1.5 text-left text-xs font-semibold text-[#92400E]">👑 {t("bottle.dmVipWrite")}</button> : null}
          <form onSubmit={sendDm} className="flex items-center gap-1.5 border-t border-border p-1.5">
            <input value={dmDraft} onChange={(event) => { setDmDraft(event.target.value); setDmNote(false); }} maxLength={300} aria-label={t("messages.placeholder")} placeholder={t("messages.placeholder")} autoComplete="off" className="h-9 min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
            <button type="submit" disabled={!dmDraft.trim()} aria-label={t("messages.send")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3B9EDD] text-white disabled:opacity-40"><SendHorizontal size={15} /></button>
          </form>
        </div>
      ) : null}
      {wide ? cardView : null}
    </div>
  );
}
