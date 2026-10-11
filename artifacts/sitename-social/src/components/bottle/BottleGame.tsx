"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { AtSign, LifeBuoy, Clock, Flame, Search, Star, Ban, Flag, Mail, Gift as GiftIcon, Heart, Home, Maximize, Menu, Minimize, Music, Music2, RefreshCw, SendHorizontal, Settings, Trophy, UserPlus, UserRoundCog, Users, Volume2, VolumeX, X } from "lucide-react";
import type { GiftId } from "@/types";
import { cartoonAvatar } from "./avatarArt";
import { useTranslation } from "@/i18n/useTranslation";
import { GiftArt } from "@/components/gifts/GiftArt";
import { useProfile } from "@/components/profile/useProfile";
import { cn } from "@/lib/utils";
import { BottleSvg, WaterBottleSvg, WoodTable } from "./BottleArt";
import { playGiftSound, playSound, setVolume } from "./sound";
import { supabase } from "@/lib/supabase";
import { ensureMessagesLoaded, openRemoteChat, remoteChats, sendRemoteMessage } from "@/lib/messagesSync";
import { bottleAnswer, bottleBuyChances, bottleCocktail, bottleJoin, bottleMove, bottleQueueLeave, bottleSong, bottleTables, bottleWheel, type BottleTables, bottleLeave, bottleSay, bottleSpend, bottleSpin, bottleSync, type BottleState } from "@/lib/bottleSync";

type Player = { id: string; name: string; age: number; female: boolean; avatar: string; me?: boolean; empty?: boolean; zodiac?: number | null };
type Phase = "waiting" | "spinning" | "choice" | "kissed" | "declined";
type Track = { id: string; title: string; duration?: string };
const stored = (key: string): Track[] => { try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as Track[]; } catch { return []; } };
const keep = (key: string, list: Track[]) => { try { window.localStorage.setItem(key, JSON.stringify(list.slice(0, 40))); } catch { /* storage is full or blocked */ } };
type Line = { id: number; from: string; to?: string; text?: string; gift?: string; song?: string };

// Seat centres in percent of the table. Wide: a tool column on the left, seats in a rectangle. Tall (phone, window): a tool row on top, seats in an oval.
type Seats = readonly (readonly [number, number])[];
const layouts: Record<"wide" | "tall", { seats: Seats; cx: number; cy: number }> = {
  wide: { seats: [[26, 15], [45.5, 15], [65, 15], [84, 15], [88, 39.5], [88, 62.5], [84, 85], [65, 85], [45.5, 85], [26, 85], [23, 62.5], [23, 39.5]], cx: 55.5, cy: 50 },
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
  ["song:video", 9], ["song:mp3", 5], ["crown", 3], ["e:👑", 3], ["e:🤴", 3], ["e:👸", 3], ["e:💋", 1], ["diamond", 1], ["e:🍓", 1], ["e:🍅", 1], ["e:🐸", 2], ["rose", 1],
  ["e:🍬", 1], ["e:🦆", 1], ["e:🐿️", 1], ["e:🦛", 1], ["e:🐧", 1], ["e:🐵", 1], ["e:💐", 1], ["e:🌷", 1], ["e:🪴", 1], ["e:🌵", 1], ["e:🍦", 1], ["e:🍰", 1],
  ["e:🥛", 1], ["e:🍷", 1], ["e:🥃", 1], ["e:🍵", 1], ["tea", 1], ["e:🥒", 3], ["e:☕", 1], ["e:🥂", 1], ["e:🍺", 1], ["e:🍸", 1], ["e:🍹", 1], ["e:🧸", 1],
  ["e:🧣", 1], ["e:⛑️", 2], ["e:🤠", 2], ["e:⚓", 2], ["e:👽", 2], ["e:🐻", 2], ["e:🐱", 2], ["e:🦊", 2], ["e:🐭", 2], ["e:🐼", 2], ["e:🐞", 2], ["e:😈", 2],
  ["e:🐷", 2], ["e:🦌", 2], ["e:🎗️", 2], ["e:🎀", 2], ["e:🌸", 2], ["e:🩷", 2], ["e:🎲", 1],
];
// The wheel of fortune: 16 sectors clockwise from the top. The database does the real draw with its own odds; the weights here are only used by the offline demo.
const wheelSectors: { hearts?: number; chances?: number; kisses?: number; smiles?: number; weight: number }[] = [
  { hearts: 1000, weight: 30 }, { hearts: 1, weight: 900 }, { kisses: 1, weight: 900 }, { hearts: 25, weight: 400 }, { hearts: 3, weight: 1300 }, { chances: 1, weight: 1300 }, { hearts: 100, weight: 100 }, { smiles: 1, weight: 700 },
  { kisses: 3, weight: 500 }, { hearts: 10, weight: 900 }, { weight: 200 }, { chances: 3, weight: 500 }, { hearts: 3, weight: 1070 }, { hearts: 5, weight: 900 }, { kisses: 1, weight: 200 }, { smiles: 3, weight: 100 },
];
const prizeText = (item: (typeof wheelSectors)[number]) => (item.hearts ? `❤ ${item.hearts}` : item.chances ? `🎲 ${item.chances}` : item.kisses ? `💋 ${item.kisses}` : item.smiles ? `😊 ${item.smiles}` : "");
const chancePacks: [number, number][] = [[300, 900], [50, 150], [15, 45], [5, 20], [1, 5]];
const vipPlans: [number, number][] = [[7, 300], [30, 900], [90, 2200]];
const frames = ["#FACC15", "#F472B6", "#60A5FA", "#34D399", "#A78BFA", "#F97316", "#EF4444"];
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
  ["e:🥸", 5, 1000], ["e:🥤", 5, 1000], ["e:🃏", 5, 1000], ["e:🧊", 5, 1000], ["e:👒", 5, 1000], ["e:🍹", 5, 3000], ["e:💍", 5, 3000], ["e:💖", 5, 3000], ["e:💀", 5, 3000], ["e:💠", 5, 3000], ["e:🧋", 5, 3000], ["e:🪇", 5, 3000], ["e:🧃", 5, 3000], ["e:⚔️", 5, 3000], ["e:🫗", 5, 3000], ["e:🧢", 5, 3000], ["e:🍧", 5, 3000], ["e:🏴‍☠️", 5, 7000], ["e:🥃", 5, 7000], ["e:🎩", 5, 7000], ["e:🍸", 5, 7000], ["e:🪖", 5, 7000], ["e:🧉", 5, 7000], ["e:🕴️", 5, 7000], ["e:🥂", 5, 7000], ["e:🍔", 5, 7000], ["e:🏅", 5, 7000], ["e:🍼", 5, 7000], ["e:🥥", 5, 7000], ["e:🎁", 5, 15000], ["e:🎓", 5, 15000], ["e:⚗️", 5, 15000], ["e:🪶", 5, 15000], ["e:🫙", 5, 15000], ["e:👳", 5, 15000], ["e:🎤", 5, 15000], ["e:🪆", 5, 15000], ["e:🍯", 5, 15000], ["e:🌶️", 5, 15000], ["e:🥣", 5, 15000], ["e:🪔", 5, 15000], ["e:🍒", 5, 23000], ["e:🫒", 5, 23000], ["e:🛡️", 5, 23000], ["e:🦪", 5, 23000], ["e:🧙", 5, 23000], ["e:👸", 5, 23000], ["e:💨", 5, 23000], ["e:🦚", 5, 23000], ["e:🧿", 5, 23000], ["e:🥄", 5, 23000], ["e:💵", 5, 23000], ["e:🎎", 5, 23000], ["e:🧁", 5, 23000], ["e:🐰", 5, 23000], ["e:🍋", 5, 23000], ["e:🍭", 5, 23000], ["e:🤺", 5, 23000], ["e:🌺", 5, 23000], ["e:🌠", 5, 23000], ["e:🛢️", 5, 23000], ["e:💝", 5, 23000], ["e:🌭", 5, 23000], ["e:👜", 5, 23000], ["e:🍟", 5, 23000],
  ["e:💍", 4, -1], ["e:🥇", 4, -1], ["e:🌹", 4, -1], ["e:👢", 4, -1], ["e:🏹", 4, -1], ["e:🐓", 4, -1], ["e:👑", 4, -1], ["e:🧲", 4, -1], ["e:🍾", 4, -1], ["e:🥀", 4, -1], ["e:🔱", 4, -1], ["e:⭕", 4, -1],
  ["e:📻", 5, 30000], ["e:🎂", 5, 30000], ["e:🎹", 5, 30000], ["e:🎼", 5, 30000], ["e:🪕", 5, 30000], ["e:👘", 5, 30000], ["e:🥁", 5, 30000], ["e:🎛️", 5, 30000], ["e:🕶️", 5, 30000], ["e:🎙️", 5, 30000], ["e:💌", 5, 40000], ["e:💟", 5, 40000], ["e:💜", 5, 40000], ["e:👠", 5, 40000], ["e:😎", 5, 40000], ["e:💛", 5, 40000], ["e:🖤", 5, 40000], ["e:❤️‍🔥", 5, 40000], ["e:🩵", 5, 40000], ["e:💚", 5, 40000], ["e:🧡", 5, 40000], ["e:💙", 5, 40000], ["e:🎭", 5, 50000], ["e:👡", 5, 50000], ["e:🐈‍⬛", 5, 50000], ["e:🪠", 5, 50000], ["e:🚗", 5, 50000], ["e:🥚", 5, 50000], ["e:🧤", 5, 50000], ["e:🪢", 5, 50000], ["e:🎪", 5, 50000], ["e:🕸️", 5, 50000], ["e:🪞", 5, 50000], ["e:🧺", 5, 50000], ["e:🐍", 5, 65000], ["e:🧳", 5, 65000], ["e:🥾", 5, 65000], ["e:🗑️", 5, 65000], ["e:🧨", 5, 65000], ["e:☯️", 5, 65000], ["e:🍀", 5, 65000], ["e:⌚", 5, 65000], ["e:📱", 5, 65000], ["e:⏰", 5, 65000], ["e:🕰️", 5, 65000], ["e:☎️", 5, 65000], ["e:🗼", 5, 80000], ["e:🗿", 5, 80000], ["e:👲", 5, 80000], ["e:⏱️", 5, 80000], ["e:⏲️", 5, 80000], ["e:📟", 5, 80000], ["e:🫖", 5, 80000], ["e:💘", 5, 80000], ["e:💔", 5, 80000], ["e:🦇", 5, 80000], ["e:🎮", 5, 80000], ["e:🚁", 5, 80000], ["e:🚜", 5, 100000], ["e:🍱", 5, 100000], ["e:🤵", 5, 100000], ["e:🦜", 5, 100000], ["e:🏍️", 5, 100000], ["e:🥊", 5, 100000], ["e:🔥", 5, 100000], ["e:🐖", 5, 100000], ["e:🪭", 5, 100000], ["e:✈️", 5, 100000], ["e:🐈", 5, 100000], ["e:🐴", 5, 100000], ["e:⭐", 5, 125000], ["e:🍨", 5, 125000], ["e:🐕", 5, 125000], ["e:⛓️", 5, 125000], ["e:🚙", 5, 125000], ["e:💩", 5, 125000], ["e:🛸", 5, 125000], ["e:🏆", 5, 125000], ["e:⏳", 5, 125000], ["e:🪈", 5, 125000], ["e:🥿", 5, 125000], ["e:🦢", 5, 125000], ["e:🛷", 5, 150000], ["e:🍫", 5, 150000], ["e:🛏️", 5, 150000], ["e:🌼", 5, 150000], ["e:🍎", 5, 150000], ["e:🕯️", 5, 150000], ["e:🎠", 5, 150000], ["e:🎡", 5, 150000], ["e:🧩", 5, 150000], ["e:🪁", 5, 150000], ["e:🎯", 5, 150000], ["e:🎺", 5, 150000],
];
// Gifts that are worn on the head sit tilted on the top corner of the photo; everything else stands at the bottom.
// Cocktails are the one gift that pays the receiver: every second cocktail gives them a heart (counted by the server).
const cocktails = new Set(["e:🍸", "e:🍹"]);
const headGifts = new Set(["crown", "e:👑", "e:⛑️", "e:🤠", "e:🎩", "e:👒", "e:🧢", "e:🎓", "e:🪖", "e:🎀", "e:🌸", "e:👳", "e:🔱"]);
function Gift({ id, className }: { id: string; className?: string }) {
  if (id.startsWith("song:")) id = id === "song:video" ? "e:🎬" : "e:🎵";
  if (!id.startsWith("e:")) return <GiftArt id={id as GiftId} className={className} />;
  return <span aria-hidden="true" className={cn("flex items-center justify-center leading-none [container-type:size]", className)}><span className="text-[82cqmin]">{id.slice(2)}</span></span>;
}
const SPIN_SECONDS = 8;
const ANSWER_SECONDS = 9;
const packs: { hearts: number; price: number; bonus?: number; tag?: "best" | "hit"; art: string }[] = [
  { hearts: 6750, price: 5000, bonus: 35, tag: "best", art: "🛒" }, { hearts: 1350, price: 1000, bonus: 35, art: "🧰" }, { hearts: 650, price: 500, bonus: 30, art: "🛢️" },
  { hearts: 240, price: 200, bonus: 20, tag: "hit", art: "🍯" }, { hearts: 110, price: 100, bonus: 10, art: "👝" }, { hearts: 50, price: 50, art: "🎁" }, { hearts: 10, price: 10, art: "💕" },
];
const tool = "flex h-[min(44px,8.5cqmin)] w-[min(44px,8.5cqmin)] shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] hover:bg-white/30";
function youtubeId(value: string) {
  const match = value.trim().match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/) ?? value.trim().match(/^([A-Za-z0-9_-]{11})$/);
  return match ? match[1] : null;
}

export function BottleGame({ wide, full, onToggleFull, onLeave, dedicate, onDedicate }: { wide: boolean; full: boolean; onToggleFull: () => void; onLeave: () => void; dedicate: boolean; onDedicate: (value: boolean) => void }) {
  const { t } = useTranslation();
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

  const enoughGirls = seated.filter((player) => player.female).length >= 2 && seated.length >= 2;
  const [turn, setTurn] = useState(4);
  const [target, setTarget] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [rotation, setRotation] = useState(0);
  const [answers, setAnswers] = useState<{ spinner: boolean | null; target: boolean | null }>({ spinner: null, target: null });
  const [seconds, setSeconds] = useState(0);
  const [kisses, setKisses] = useState<Record<string, number>>({ b1: 3, b4: 8, b7: 1 });
  const [stickers, setStickers] = useState<Record<string, string[]>>({ b2: ["tea"], b5: ["rose"] });
  const [lines, setLines] = useState<Line[]>([{ id: 1, from: "b3", text: smallTalk[0] }, { id: 2, from: "b6", to: "b1" }]);
  const [draft, setDraft] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [flying, setFlying] = useState<{ key: number; gift: string; to: number; moved: boolean; ms: number }[]>([]);
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
  const [dmDraft, setDmDraft] = useState("");
  const [dms, setDms] = useState<Record<string, { mine: boolean; text: string }[]>>({});
  const [cardNote, setCardNote] = useState<string | null>(null);
  const [suitors, setSuitors] = useState<Record<string, { by: string; amount: number }>>(() => Object.fromEntries(bots.map((bot, index) => [bot.id, { by: bots[(index + 3) % bots.length].id, amount: 4 + ((index * 37) % 40) }])));
  const [volume, setVolumeLevel] = useState(80);
  const [music, setMusic] = useState(60);
  const [accept, setAccept] = useState(true);
  const [panel, setPanel] = useState<"settings" | "top" | "rules" | "shop" | "menu" | "vip" | "bottles" | "frames" | "achievements" | "boosters" | "wheel" | "chances" | "tables" | null>(null);
  const [rooms, setRooms] = useState<BottleTables | null>(null);
  const [waitFor, setWaitFor] = useState<{ table: number; position: number } | null>(null);
  const [roomNote, setRoomNote] = useState(false);
  const [chances, setChances] = useState(0);
  const [wheelTurn, setWheelTurn] = useState(0);
  const [wheelBusy, setWheelBusy] = useState(false);
  const [wheelPrize, setWheelPrize] = useState<number | null>(null);
  const [mySmiles, setMySmiles] = useState(0);
  const wheelLock = useRef(false);
  const [topTab, setTopTab] = useState<"league" | "daily" | "weekly">("league");
  const [sent, setSent] = useState<Record<string, number>>({});
  const [skin, setSkin] = useState(0);
  const [ownedSkins, setOwnedSkins] = useState<number[]>([0]);
  const [frame, setFrame] = useState<string | null>(null);
  const [ownedFrames, setOwnedFrames] = useState<string[]>([]);
  const [payNote, setPayNote] = useState(false);
  const [tableNo, setTableNo] = useState(60);
  const [copied, setCopied] = useState(false);
  const [waitNote, setWaitNote] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [hearts, setHearts] = useState(12);
  const [video, setVideo] = useState<string | null>(null);
  const [badLink, setBadLink] = useState(false);
  const lineId = useRef(3);
  const listRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLInputElement>(null);
  const say = useCallback((line: Omit<Line, "id">) => setLines((list) => [...list.slice(-40), { ...line, id: lineId.current++ }]), []);
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
    setRotation((current) => current - (current % 360) + 1440 + (((angleTo(next) % 360) + 360) % 360));
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
      const timer = window.setTimeout(() => { playSound("chosen"); setPhase("choice"); }, 3400);
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
        if (!data) { await bottleJoin(); data = await bottleSync(lastChat.current); }
        if (!alive || !data) return;
        const fresh = data.chat.filter((item) => item.id > lastChat.current && item.kind !== "wheel");
        if (fresh.length) {
          lastChat.current = fresh[fresh.length - 1].id;
          const who = (id: string | null) => (id === data!.me ? "me" : id ?? "");
          setLines((list) => [...list, ...fresh.map((item) => (item.kind === "kiss" ? { id: item.id, from: who(item.from), to: who(item.to) } : { id: item.id, from: who(item.from), text: item.body ?? "" }))].slice(-80));
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
    setKisses(Object.fromEntries(net.seats.map((seat) => [seat.id === net.me ? "me" : seat.id, seat.kisses])));
    if (net.phase === "waiting") setSeconds(left(SPIN_SECONDS));
    if (net.phase === "choice") setSeconds(left(ANSWER_SECONDS));
    heartsRef.current = net.hearts;
    setHearts(net.hearts);
    if (!wheelLock.current) setChances(net.chances ?? 0);
    const key = `${net.round}:${net.target}`;
    if (net.phase === "spinning" && targetAt >= 0 && spunRef.current !== key) {
      spunRef.current = key;
      setRotation((current) => current - (current % 360) + 1440 + (((angleTo(targetAt) % 360) + 360) % 360));
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
  const pushMusic = useCallback(() => frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [music] }), "*"), [music]);
  useEffect(pushMusic, [pushMusic, video]);
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
  async function moveTo(table: number | null) {
    const result = await bottleMove(table);
    if (!result) return;
    if (result.gone) { setWaitFor(null); setRoomNote(true); return void bottleTables().then(setRooms); }
    if (result.full && result.table) return setWaitFor({ table: result.table, position: result.position ?? 1 });
    setWaitFor(null);
    setPicked(null);
    setCard(false);
    setLines([]);
    setPanel(null);
    pullRef.current();
  }
  const waitTable = waitFor?.table;
  useEffect(() => {
    if (!waitTable) return;
    const timer = window.setInterval(() => void moveTo(waitTable), 2500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitTable]);
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
  const pay = (price: number) => {
    if (heartsRef.current < price) return false;
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    if (online) void bottleSpend(price);
    return true;
  };
  const topIds = new Set(seated.map((player) => ({ id: player.id, count: kisses[player.id] ?? 0 })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 3).map((item) => item.id));
  const skinFilter = (n: number) => (n % 15 ? `hue-rotate(${(n % 15) * 24}deg) saturate(${n % 3 === 0 ? 1.4 : 1.1})` : undefined);
  const SkinBottle = skin >= 15 ? WaterBottleSvg : BottleSvg;
  const skinPrice = (n: number) => (n ? 3 + Math.floor(n / 5) * 2 : 0);
  const ranking = seated.map((player) => ({ player, count: kisses[player.id] ?? 0 })).sort((a, b) => b.count - a.count);
  const row = "flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm text-[#1F2937] hover:bg-black/5";
  function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
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
        const found = await fetch(`${api}/search?part=id&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(search)}&key=${key}`);
        if (!found.ok) return setTrackState("fail");
        ids = (((await found.json()) as { items?: { id: { videoId: string } }[] }).items ?? []).map((item) => item.id.videoId).join(",");
        if (!ids) return setTrackState("idle");
      }
      const details = await fetch(search ? `${api}/videos?part=snippet,contentDetails&id=${ids}&key=${key}` : `${api}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=AZ&maxResults=16&key=${key}`);
      if (!details.ok) return setTrackState("fail");
      const list = (((await details.json()) as { items?: { id: string; snippet: { title: string }; contentDetails: { duration: string } }[] }).items ?? []).map((item) => ({ id: item.id, title: item.snippet.title, duration: clock(item.contentDetails.duration) }));
      setTracks(list);
      setTrackState("idle");
      try { window.sessionStorage.setItem(cacheKey, JSON.stringify(list)); } catch { /* storage is full or blocked */ }
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
    void loadTracks("");
  }
  function finishSong(title: string) {
    if (songFor === null) return;
    say({ from: "me", to: players[songFor].id, song: title });
    setSongFor(null);
    onDedicate(false);
  }
  // A song costs the sender hearts and adds one to the receiver's song count (counted by the server when the table is live).
  function paySong(kind: "video" | "mp3") {
    const price = SONG_PRICE[kind];
    if (heartsRef.current < price) return false;
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    const target = songFor !== null ? players[songFor] : null;
    if (online) void (target && !target.me ? bottleSong(target.id, kind) : bottleSpend(price));
    return true;
  }
  function orderTrack(track: Track) {
    if (!paySong("video")) return setGiftNote(t("bottle.noHearts"));
    setAudio(null);
    setVideo(track.id);
    const next = [track, ...recent.filter((item) => item.id !== track.id)];
    setRecent(next);
    keep("bottle-recent", next);
    finishSong(track.title);
  }
  function toggleFav(track: Track) {
    const next = favs.some((item) => item.id === track.id) ? favs.filter((item) => item.id !== track.id) : [track, ...favs];
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
    if (!paySong("mp3")) return setGiftNote(t("bottle.noHearts"));
    const name = songFile.name.replace(/\.[^.]+$/, "");
    setVideo(null);
    setAudio({ url: URL.createObjectURL(songFile), name });
    finishSong(name);
  }
  // Private messages use the site's own Messages. Reading is free; writing is free for girls and needs VIP for boys.
  function sendDm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dm || !dmDraft.trim()) return;
    if (!players[meIndex].female && !vip) return setDmNote(true);
    const text = dmDraft.trim().slice(0, 300);
    setDmDraft("");
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
      playSound(prizeText(wheelSectors[sector]) ? "kiss" : "decline");
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
  // A single gift glides for 3 seconds; gifts sent in a rapid series (press and hold) fly in about a second.
  function sendGift(index: number, gift: string, price: number, ms = 3000) {
    const player = players[index];
    if (heartsRef.current < price) return false;
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    if (online) void (cocktails.has(gift) && !player.me ? bottleCocktail(player.id) : bottleSpend(price));
    const key = flyId.current++;
    playGiftSound(gift, "send");
    setFlying((list) => [...list, { key, gift, to: index, moved: false, ms }]);
    window.setTimeout(() => setFlying((list) => list.map((item) => (item.key === key ? { ...item, moved: true } : item))), 40);
    window.setTimeout(() => {
      setFlying((list) => list.filter((item) => item.key !== key));
      playGiftSound(gift, "land");
      setStickers((value) => ({ ...value, [player.id]: [...(value[player.id] ?? []), gift].slice(-6) }));
      say({ from: "me", to: player.id, gift });
    }, ms + 100);
    setSent((value) => ({ ...value, [player.id]: (value[player.id] ?? 0) + 1 }));
    return true;
  }
  function court(index: number) {
    const player = players[index];
    const price = (suitors[player.id]?.amount ?? 0) + 1;
    if (suitors[player.id]?.by === "me") return;
    if (heartsRef.current < price) return setCardNote(`${t("bottle.noHearts")} (${price})`);
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    if (online) void bottleSpend(price);
    setSuitors((value) => ({ ...value, [player.id]: { by: "me", amount: price } }));
    say({ from: "me", text: `${t("bottle.courtStarted")} ${player.name} ❤ ${price}` });
  }
  // Press and hold a gift: it keeps going until the finger is lifted (or the hearts run out).
  // A tap sends one gift. Holding for a moment keeps sending until release; a scroll gesture cancels without sending.
  const pressed = useRef<{ timer: number; started: boolean; x: number; y: number } | null>(null);
  const stopHold = () => { if (hold.current) window.clearInterval(hold.current); hold.current = null; };
  const cancelPress = () => { if (pressed.current) window.clearTimeout(pressed.current.timer); pressed.current = null; stopHold(); };
  function giveGift(index: number, gift: string, price: number, need?: number) {
    if (gift.startsWith("song:")) { openSong(index); if (gift === "song:mp3") setSongTab("mp3"); return false; }
    if (need === -1 && !vip) { setGiftNote(t("bottle.vipOnly")); return false; }
    if (need && need > 0) { setGiftNote(`${t("bottle.needKisses")} (${need})`); return false; }
    setGiftNote(null);
    if (!sendGift(index, gift, price)) { setGiftNote(t("bottle.noHearts")); return false; }
    return true;
  }
  function pressGift(index: number, gift: string, price: number, need: number | undefined, x: number, y: number) {
    cancelPress();
    const state = { started: false, x, y, timer: window.setTimeout(() => {
      state.started = true;
      if (giveGift(index, gift, price, need)) hold.current = window.setInterval(() => { if (!sendGift(index, gift, price, 1000)) stopHold(); }, 300);
    }, 380) };
    pressed.current = state;
  }
  function releaseGift(index: number, gift: string, price: number, need?: number) {
    const state = pressed.current;
    cancelPress();
    if (state && !state.started) giveGift(index, gift, price, need);
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
    <div className={cn("relative flex h-full w-full bg-surface text-text", wide ? "flex-row" : "flex-col")}>
      <div className={cn("relative shrink-0 overflow-hidden bg-[#E0A04E] [container-type:size]", wide ? "h-full w-[54%]" : "mx-auto aspect-[9/10] w-full max-w-[64dvh]")} onClick={() => setPicked(null)}>
        <WoodTable className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className={cn("absolute z-10 flex items-center", wide ? "inset-y-0 left-0 w-[13%] flex-col gap-[2.2cqmin] py-[2.2cqmin]" : "inset-x-0 top-0 h-[10%] gap-[1.7cqmin] px-[2cqmin]")} onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => { setPayNote(false); setPanel("shop"); }} aria-label={`${t("bottle.shop")}: ${hearts}`} className={cn("flex items-center text-white hover:brightness-110", wide ? "flex-col" : "gap-1.5")} title={t("bottle.shop")}>
            <Heart className="h-[8.5cqmin] max-h-11 w-[8.5cqmin] max-w-11" fill="#FF6A1F" stroke="#FFFFFF" strokeWidth={1.5} />
            <span className="text-[max(12px,2.6cqmin)] font-bold tabular-nums leading-tight [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{hearts}</span>
          </button>
          <span className="flex-1" />
          <button onClick={onToggleFull} aria-label={t("bottle.fullscreen")} title={t("bottle.fullscreen")} className={tool}>{full ? <Minimize size={17} /> : <Maximize size={17} />}</button>
          <button onClick={() => { setWheelPrize(null); setPayNote(false); setPanel("wheel"); }} aria-label={t("bottle.wheel")} title={t("bottle.wheel")} className={tool}><LifeBuoy size={19} /></button>
          <button onClick={() => setPanel("top")} aria-label={t("bottle.top")} title={t("bottle.top")} className={tool}><Trophy size={18} /></button>
          <button onClick={() => setPanel("menu")} aria-label={t("bottle.menu")} title={t("bottle.menu")} className={tool}><Menu size={18} /></button>
          <button onClick={() => setPanel("settings")} aria-label={t("bottle.settings")} title={t("bottle.settings")} className={tool}><Settings size={18} /></button>
          <span className="flex-1" />
          <span className="text-center text-[max(10px,2.2cqmin)] font-bold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">{t("bottle.table")}<br />{online ? net?.table ?? "…" : tableNo}</span>
          {myTurn
            ? <span aria-label={`${seconds}`} className={cn(tool, "text-[max(14px,3cqmin)] font-bold tabular-nums")}>{seconds}</span>
            : <button onClick={changeTable} aria-label={t("bottle.changeTable")} title={t("bottle.changeTable")} className={tool}><RefreshCw size={17} /></button>}
        </div>

        <button type="button" disabled={staged} onClick={(event) => { event.stopPropagation(); if (myTurn) return online ? void bottleSpin().then(pullRef.current) : spin(); setWaitNote(true); window.setTimeout(() => setWaitNote(false), 1800); }} aria-label={t("bottle.spin")} className={cn("absolute h-[30cqmin] transition-transform duration-[3200ms] ease-[cubic-bezier(0.15,0.6,0.2,1)] motion-reduce:duration-0", staged ? "pointer-events-none" : myTurn ? "z-20 cursor-pointer" : "cursor-default")} style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)`, filter: skinFilter(skin) }}>
          <SkinBottle className={cn("h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] transition-opacity duration-700", staged && "opacity-0")} />
        </button>
        {myTurn ? <div className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%` }}><p role="status" className="animate-bounce whitespace-nowrap rounded-full bg-white px-[3cqmin] py-[1cqmin] text-[3.2cqmin] font-bold text-[#C2410C] shadow-lg motion-reduce:animate-none">{t("bottle.clickBottle")}</p></div> : null}

        {waitNote && !myTurn && !staged ? <p role="status" className="pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-[3cqmin] py-[1cqmin] text-[3.2cqmin] font-bold text-white" style={{ left: `${CENTER_X}%`, top: `calc(${STAGE_Y}% + 17cqmin)` }}>{t("bottle.waitTurn")}</p> : null}
        {phase === "waiting" && !myTurn ? <p className="pointer-events-none absolute w-[40cqmin] -translate-x-1/2 -translate-y-1/2 text-center text-[3.4cqmin] font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.85)]" style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%` }}>{t(enoughGirls ? "bottle.waitingSpin" : "bottle.needGirls")}</p> : null}

        {players.map((player, index) => {
          if (player.empty) return null;
          const active = index === turn || index === target;
          return (
            <div key={player.id} className={cn("absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top]", wide ? "w-[17cqmin]" : "w-[16cqmin]", " duration-[1100ms] ease-in-out motion-reduce:duration-0", staged && active ? "pointer-events-none z-30" : index === turn && "z-10")} style={staged && active ? { left: `calc(${CENTER_X}% ${index === turn ? "-" : "+"} 12.5cqmin)`, top: `${STAGE_Y}%` } : { left: `${seats[index][0]}%`, top: `${seats[index][1]}%` }}>
              <button type="button" onClick={(event) => { event.stopPropagation(); if (dedicate) return player.me ? undefined : openSong(index); setGiftNote(null); setCardNote(null); setFlagMenu(false); setSignOpen(false); setCard(picked === index || Boolean(player.me)); setPicked(index); }} aria-label={`${player.name}, ${player.age}`} className={cn("group relative block aspect-square w-full rounded-[14%] bg-surface-2 shadow-[0_4px_10px_rgba(0,0,0,0.4)]", staged && index === target ? "ring-[0.9cqmin] ring-[#FFE2A8]" : active ? "ring-4 ring-white" : picked === index ? "ring-4 ring-[#8CC63F]" : player.me ? "ring-2 ring-white/80" : "")}>
                <img src={player.avatar} alt="" className="h-full w-full rounded-[14%] object-cover" style={player.me && frame ? { boxShadow: `0 0 0 0.9cqmin ${frame}, 0 0 2.4cqmin ${frame}` } : undefined} />
                {player.me || dedicate ? null : <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[14%] bg-black/35 opacity-0 transition-opacity group-hover:opacity-100"><GiftIcon className="h-[38%] w-[38%] text-white" strokeWidth={1.6} /></span>}
                {dedicate && !player.me ? <span className="absolute inset-0 z-10 flex items-center justify-center rounded-[14%] bg-black/35"><span className="flex h-[7cqmin] w-[7cqmin] items-center justify-center rounded-full bg-[#8CC63F] text-[5cqmin] font-black leading-none text-white shadow">+</span></span> : null}
                {topIds.has(player.id) ? <span className="absolute left-1/2 -top-[1.4cqmin] z-[1] -translate-x-1/2 rounded bg-[#FACC15] px-[0.8cqmin] text-[2.2cqmin] font-black leading-[1.5] text-[#713F12] shadow">TOP</span> : null}
                {kisses[player.id] ? <span className="absolute -right-[1.2cqmin] -top-[1.2cqmin] flex h-[4.6cqmin] min-w-[4.6cqmin] items-center justify-center rounded-full bg-[#E5334B] px-1 text-[2.4cqmin] font-bold tabular-nums text-white shadow">{kisses[player.id]}</span> : null}
                {(() => {
                  const mine = stickers[player.id] ?? [];
                  const head = [...mine].reverse().find((gift) => headGifts.has(gift));
                  const rest = mine.filter((gift) => !headGifts.has(gift)).slice(-2).reverse();
                  return <>
                    {head ? <Gift id={head} className="absolute -left-[2.6cqmin] -top-[2.8cqmin] h-[50%] w-[50%] -rotate-[24deg] drop-shadow" /> : null}
                    {rest.map((gift, position) => <Gift key={`${gift}-${position}`} id={gift} className={cn("absolute -bottom-[1.6cqmin] h-[48%] w-[48%] drop-shadow", position ? "-left-[1.6cqmin]" : "-right-[1.6cqmin]")} />)}
                  </>;
                })()}
              </button>
              <p className="mt-px truncate text-center text-[2.6cqmin] font-semibold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">{player.me ? t("common.you") : player.name}, {player.age}</p>
              {index === turn && !staged ? <p className={cn("absolute top-full whitespace-nowrap rounded-full bg-black/45 px-[1.6cqmin] text-[2.3cqmin] font-semibold text-white", seats[index][0] > 75 ? "right-0" : seats[index][0] < 25 ? "left-0" : "left-1/2 -translate-x-1/2")}>↑ {t("bottle.spinsBottle")}</p> : null}
            </div>
          );
        })}

        {flying.map((item) => <div key={item.key} className="pointer-events-none absolute z-40 h-[11cqmin] w-[11cqmin] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_10px_rgba(255,240,150,0.95)] transition-[left,top] ease-in-out" style={{ transitionDuration: `${item.ms}ms`, left: `${seats[item.moved ? item.to : meIndex][0]}%`, top: `${seats[item.moved ? item.to : meIndex][1]}%` }}><Gift id={item.gift} className="h-full w-full" /></div>)}

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
                <button onClick={() => { setAnswers((value) => ({ ...value, [myRole]: false })); if (online) void bottleAnswer(false).then(pullRef.current); }} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#E2401F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.no")}</button>
                <button onClick={() => { setAnswers((value) => ({ ...value, [myRole]: true })); if (online) void bottleAnswer(true).then(pullRef.current); }} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#8CC63F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.yes")}</button>
              </div>
            ) : null}
          </>
        ) : null}

        {card && picked !== null ? (() => {
          const player = players[picked];
          const suitor = suitors[player.id];
          const by = suitor ? byId(suitor.by) : null;
          const action = "flex h-[min(46px,10cqmin)] w-[min(46px,10cqmin)] items-center justify-center rounded-full text-white shadow hover:brightness-110";
          return (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-3" onClick={(event) => { event.stopPropagation(); setCard(false); }}>
              <div role="dialog" aria-modal="true" aria-label={`${player.name}, ${player.age}`} onClick={(event) => event.stopPropagation()} className="relative flex w-full max-w-[560px] rounded-2xl bg-white shadow-2xl">
                <button onClick={() => setCard(false)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8CC63F] bg-white text-[#8CC63F] shadow"><X size={18} strokeWidth={3} /></button>
                <div className="relative aspect-square w-1/2 shrink-0 overflow-hidden rounded-l-2xl bg-[#E5E7EB]">
                  <img src={player.avatar} alt="" className="h-full w-full object-cover" />
                  <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-8 pb-2 pt-6 text-center text-sm font-bold text-white">{player.name}, {player.age}</p>
                  {player.zodiac !== null && player.zodiac !== undefined ? (
                    <>
                      <button onClick={() => setSignOpen(!signOpen)} aria-expanded={signOpen} aria-label={t("bottle.zodiac")} title={t("bottle.zodiac")} className="absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-base leading-none text-white hover:bg-black/65">{zodiacSigns[player.zodiac]}</button>
                      {signOpen ? <span role="status" className="absolute bottom-10 left-1.5 z-10 rounded-full bg-black/80 px-3 py-1 text-sm font-semibold text-white">{t(`bottle.sign${player.zodiac}` as "bottle.sign0")}</span> : null}
                    </>
                  ) : null}
                  {player.me ? null : <button onClick={() => setFlagMenu(!flagMenu)} aria-expanded={flagMenu} aria-label={t("bottle.more")} title={t("bottle.more")} className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#111827] hover:bg-white"><Flag size={14} /></button>}
                  {flagMenu && !player.me ? (
                    <div role="menu" className="absolute bottom-10 right-1.5 z-10 w-44 overflow-hidden rounded-lg bg-white py-1 text-left text-xs font-semibold text-[#1F2937] shadow-xl">
                      <button role="menuitem" onClick={() => { setMutedIds((list) => (list.includes(player.id) ? list.filter((id) => id !== player.id) : [...list, player.id])); setFlagMenu(false); setCardNote(t(muted.includes(player.id) ? "bottle.unrejected" : "bottle.rejected")); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t(muted.includes(player.id) ? "bottle.unreject" : "bottle.reject")}</button>
                      <button role="menuitem" onClick={() => { setFlagMenu(false); setCardNote(t("bottle.reportSent")); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t("bottle.report")}</button>
                      <button role="menuitem" onClick={() => { setFlagMenu(false); setCardNote(t("bottle.friendSent")); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t("bottle.addFriend")}</button>
                      <Link role="menuitem" href="/friends" className="block px-3 py-2 hover:bg-black/5">{t("bottle.myFriends")}</Link>
                    </div>
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 text-[#1F2937]">
                  <p className="flex items-center gap-2 text-sm font-bold tabular-nums text-[#DC2626]"><span aria-hidden="true">💋</span>{(online ? net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.total ?? 0 : kisses[player.id] ?? 0).toLocaleString("az")}<span className="sr-only">{t("bottle.statKisses")}</span></p>
                  <p className="flex items-center gap-2 text-sm font-bold tabular-nums text-[#C0399A]"><span aria-hidden="true">🎵</span>{(online ? net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.songs ?? 0 : ((picked + 3) * 7919) % 900).toLocaleString("az")}<span className="sr-only">{t("bottle.statSongs")}</span></p>
                  <p className="flex items-center gap-2 text-sm font-bold tabular-nums text-[#EA580C]"><span aria-hidden="true">😊</span>{(online ? net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.smiles ?? 0 : player.me ? mySmiles : ((picked + 5) * 104729) % 600).toLocaleString("az")}<span className="sr-only">{t("bottle.statSmiles")}</span></p>
                  <div className="my-1 border-t border-[#E5E7EB]" />
                  <div className="flex items-center gap-2">
                    {by ? <img src={by.avatar} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{by ? <>{t("bottle.courts")} <b>{by.me ? t("common.you") : by.name}</b></> : t("bottle.noSuitor")}</p>
                      {suitor ? <p className="flex items-center gap-1 text-sm font-bold tabular-nums"><Heart size={14} fill="#F4511E" stroke="none" />{suitor.amount}</p> : null}
                      {suitor?.by === "me" || player.me ? null : <button onClick={() => court(picked)} className="mt-0.5 rounded bg-[#8CC63F] px-2.5 py-1 text-xs font-bold text-white hover:brightness-110">{t("bottle.courtBtn")} · {(suitor?.amount ?? 0) + 1}</button>}
                    </div>
                  </div>
                  <div className="my-1 border-t border-[#E5E7EB]" />
                  <div className="flex flex-wrap gap-2">
                    {player.me ? null : <>
                    <button onClick={() => setCardNote(t(vip ? "bottle.kickDemo" : "bottle.kickVip"))} aria-label={t("bottle.kick")} title={t("bottle.kick")} className={cn(action, "bg-[#EF4444]")}><Ban size={20} /></button>
                    <button onClick={() => setCardNote(t("bottle.friendSent"))} aria-label={t("bottle.addFriend")} title={t("bottle.addFriend")} className={cn(action, "bg-[#F59E0B]")}><UserPlus size={20} /></button>
                    </>}
                    <button onClick={() => setCard(false)} aria-label={t("gifts.send")} title={t("gifts.send")} className={cn(action, "bg-[#F97316]")}><GiftIcon size={20} /></button>
                    {player.me ? null : <>
                    <button onClick={() => { setDraft(`${player.name}, `); setCard(false); setPicked(null); window.setTimeout(() => chatRef.current?.focus(), 50); }} aria-label={t("bottle.mention")} title={t("bottle.mention")} className={cn(action, "bg-[#8B5CF6]")}><AtSign size={20} /></button>
                    <button onClick={() => openDm(player)} aria-label={t("bottle.write")} title={t("bottle.write")} className={cn(action, "bg-[#3B9EDD]")}><Mail size={20} /></button>
                    </>}
                  </div>
                  {cardNote ? <p role="status" className="mt-1 rounded-md bg-[#FEF3C7] px-2 py-1 text-xs font-semibold text-[#92400E]">{cardNote}</p> : null}
                </div>
              </div>
            </div>
          );
        })() : null}

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
                  <button type="button" role="tab" aria-selected={songTab === "mp3"} onClick={() => setSongTab("mp3")} className={cn("h-10 rounded-full px-3 text-xs font-bold", songTab === "mp3" ? "bg-[#FFEDD5] text-[#EA580C]" : "text-[#9CA3AF] hover:bg-black/5")}>MP3</button>
                </div>
                <p className="mb-2 mt-1 flex items-center gap-2 text-xs font-bold text-[#6B7280]"><img src={players[songFor].avatar} alt="" className="h-6 w-6 rounded object-cover" /><span className="min-w-0 flex-1 truncate">{t("bottle.dedicateTo")} {players[songFor].name}</span><span className="flex shrink-0 items-center gap-0.5 text-[#EA580C]"><Heart size={11} fill="currentColor" stroke="none" />{SONG_PRICE[songTab === "mp3" ? "mp3" : "video"]}</span></p>
                {songTab === "search" ? (
                  <form onSubmit={searchTracks} className="mb-2 flex gap-1.5">
                    <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} aria-label={t("bottle.songSearch")} placeholder={t("bottle.songSearchHint")} autoComplete="off" className="h-10 min-w-0 flex-1 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#EE8A2B]" />
                    <button type="submit" aria-label={t("bottle.songSearch")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EE8A2B] text-white"><Search size={18} /></button>
                  </form>
                ) : null}
                {songTab === "mp3" ? (
                  <form onSubmit={sendMp3}>
                    <input type="file" accept="audio/mpeg,audio/mp3,.mp3" aria-label="MP3" onChange={(event) => { setSongFile(event.target.files?.[0] ?? null); setBadLink(false); }} className={cn("w-full rounded-lg border p-2 text-xs", badLink ? "border-[#DC2626]" : "border-[#D1D5DB]")} />
                    <button type="submit" className="mt-3 h-10 w-full rounded-lg bg-[#8CC63F] text-sm font-bold text-white hover:brightness-110">{t("bottle.dedicateSend")}</button>
                  </form>
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
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/35 p-3" onClick={(event) => { event.stopPropagation(); setPanel(null); }}>
            <div role="dialog" aria-modal="true" aria-label={t(`bottle.${panel}`)} onClick={(event) => event.stopPropagation()} className={cn("relative max-h-full w-full rounded-2xl p-3 shadow-2xl", panel === "shop" ? "max-w-[420px] bg-[linear-gradient(180deg,#F26D7D,#F7A1A8)]" : panel === "wheel" || panel === "chances" ? "max-w-[380px] bg-[linear-gradient(180deg,#12998C,#7FD8C8)]" : "max-w-[340px] bg-white")}>
              <button onClick={() => setPanel(null)} aria-label={t("photos.close")} title={t("photos.close")} className={cn("absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white shadow", panel === "shop" ? "border-[#EF4444] text-[#EF4444]" : panel === "wheel" || panel === "chances" ? "border-[#0E8478] text-[#0E8478]" : "border-[#8CC63F] text-[#8CC63F]")}><X size={18} strokeWidth={3} /></button>
              <p className={cn("mb-1 text-center text-sm font-bold", panel === "shop" || panel === "wheel" || panel === "chances" ? "mb-2 text-white" : "text-[#9CA3AF]")}>{t(`bottle.${panel}`)}</p>
              {panel === "tables" ? (() => {
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
                        <button onClick={() => { setWaitFor(null); void bottleQueueLeave(); }} className="mt-2 block w-full rounded-lg bg-white py-1.5 text-xs font-bold text-[#92400E]">{t("bottle.roomCancel")}</button>
                      </div>
                    ) : null}
                    {roomNote ? <p role="status" className="mb-2 rounded-lg bg-[#FEE2E2] p-2 text-center text-xs font-semibold text-[#991B1B]">{t("bottle.roomGone")}</p> : null}
                    <button onClick={() => void moveTo(null)} className="h-11 w-full rounded-xl bg-[#EE8A2B] text-sm font-bold text-white hover:brightness-110">{t("bottle.roomRandom")}</button>
                    <p className="mb-1 mt-3 text-xs font-semibold text-[#9CA3AF]">{t("bottle.roomFriends")}</p>
                    {rooms && !rooms.friends.length ? <p className="py-1 text-xs text-[#6B7280]">{t("bottle.roomNoFriends")}</p> : null}
                    <ul>
                      {(rooms?.friends ?? []).map((friend) => (
                        <li key={friend.id}><button onClick={() => void moveTo(friend.table)} disabled={friend.table === net?.table} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-sm hover:bg-black/5 disabled:opacity-50">
                          <img src={friend.avatar || cartoonAvatar(1, false)} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" /><span className="min-w-0 flex-1 truncate font-semibold">{(friend.name ?? "").split(" ")[0]}</span><span className="shrink-0 text-xs text-[#9CA3AF]">#{friend.table}</span>{counts(friend.table)}
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
                <div className="max-h-[78cqmin] overflow-y-auto pt-2">
                  <p className="mb-3 flex items-center justify-center gap-1.5 rounded-lg bg-white/90 py-1.5 text-sm font-bold text-[#7F1D1D]">{t("bottle.balance")}: <Heart size={15} fill="#F4511E" stroke="none" /><span className="tabular-nums">{hearts}</span></p>
                  <ul className="grid grid-cols-4 gap-1.5">
                    <li className="flex flex-col items-center rounded-xl bg-white p-1.5 text-center">
                      <span className="text-[13px] font-black leading-tight text-[#F59E0B]">VIP<span className="block text-[9px] font-bold">{t("bottle.vipStatus")}</span></span>
                      <span aria-hidden="true" className="my-1 text-3xl">👑</span>
                      <button onClick={() => { setPayNote(false); setPanel("vip"); }} className="mt-auto h-7 w-full rounded-md bg-[#3B82F6] text-[11px] font-bold text-white hover:brightness-110">{t("bottle.vipMore")}</button>
                    </li>
                    {packs.map((pack) => (
                      <li key={pack.hearts} className="relative flex flex-col items-center rounded-xl bg-white p-1.5 text-center">
                        {pack.tag ? <span className={cn("absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 text-[9px] font-bold text-white", pack.tag === "best" ? "bg-[#E11D8F]" : "bg-[#7C3AED]")}>{t(pack.tag === "best" ? "bottle.packBest" : "bottle.packHit")}</span> : null}
                        <span className="flex items-center gap-0.5 text-[13px] font-black tabular-nums leading-tight text-[#EA580C]"><Heart size={12} fill="#F4511E" stroke="none" />{pack.hearts}</span>
                        <span className="h-3 text-[9px] font-bold leading-3 text-[#F59E0B]">{pack.bonus ? `${pack.bonus}% ${t("bottle.bonus")}` : ""}</span>
                        <span aria-hidden="true" className="my-1 text-3xl">{pack.art}</span>
                        <button onClick={() => setPayNote(true)} className="mt-auto h-7 w-full rounded-md bg-[#8CC63F] text-[11px] font-bold tabular-nums text-white hover:brightness-110">{pack.price} {t("bottle.currency")}</button>
                      </li>
                    ))}
                  </ul>
                  {payNote ? <p role="status" className="mt-2 rounded-lg bg-white/90 p-2 text-center text-xs font-semibold text-[#7F1D1D]">{t("bottle.paySoon")}</p> : null}
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
              ) : panel === "top" ? (
                <div>
                  <div role="tablist" className="mb-2 flex gap-1">
                    {(["league", "daily", "weekly"] as const).map((tab) => <button key={tab} role="tab" aria-selected={topTab === tab} onClick={() => setTopTab(tab)} className={cn("h-8 flex-1 rounded-md text-xs font-bold", topTab === tab ? "bg-[#EE8A2B] text-white" : "bg-[#F3F4F6] text-[#4B5563]")}>{t(`bottle.tab${tab[0].toUpperCase()}${tab.slice(1)}` as "bottle.tabLeague")}</button>)}
                  </div>
                  <ol className="max-h-[60cqmin] overflow-y-auto">
                    {(topTab === "league" ? ranking : topTab === "daily"
                      ? seated.filter((player) => sent[player.id]).map((player) => ({ player, count: sent[player.id] })).sort((a, b) => b.count - a.count)
                      : seated.map((player, index) => ({ player, count: (kisses[player.id] ?? 0) + (player.me || online ? 0 : ((index + 2) * 53) % 90) })).sort((a, b) => b.count - a.count)
                    ).map(({ player, count }, place) => (
                      <li key={player.id} className="flex min-h-10 items-center gap-2 px-1 text-sm text-[#1F2937]">
                        <span className="w-5 text-right font-bold tabular-nums text-[#9CA3AF]">{place + 1}</span>
                        <img src={player.avatar} alt="" className="h-8 w-8 rounded-md object-cover" />
                        <span className="min-w-0 flex-1 truncate font-semibold">{player.me ? t("common.you") : player.name}</span>
                        <span className="font-bold tabular-nums">{topTab === "daily" ? "🎁" : "💋"} {count}</span>
                      </li>
                    ))}
                  </ol>
                  {topTab === "daily" && !Object.keys(sent).length ? <p className="py-4 text-center text-xs text-[#6B7280]">{t("bottle.dailyEmpty")}</p> : null}
                </div>
              ) : panel === "menu" ? (
                <div className="max-h-[70cqmin] overflow-y-auto">
                  <Link href="/messages" className={row}><span aria-hidden="true" className="w-6 text-center text-lg">✉️</span>{t("nav.messages")}</Link>
                  <button onClick={() => setPanel("achievements")} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">🏅</span>{t("bottle.achievements")}</button>
                  <button onClick={() => { setTopTab("league"); setPanel("top"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">📊</span>{t("bottle.rating")}</button>
                  <button onClick={() => { setPayNote(false); setPanel("bottles"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">🍾</span>{t("bottle.bottles")}</button>
                  <button onClick={() => { setPayNote(false); setPanel("frames"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">🖼️</span>{t("bottle.frames")}</button>
                  <button onClick={() => { setPayNote(false); setPanel("boosters"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">⚡</span>{t("bottle.boosters")}</button>
                  <button onClick={() => setPanel("rules")} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">📖</span>{t("bottle.rules")}</button>
                </div>
              ) : panel === "achievements" ? (
                <ul className="max-h-[70cqmin] space-y-1 overflow-y-auto">
                  {([[1, (kisses.me ?? 0) > 0], [2, (kisses.me ?? 0) >= 10], [3, Object.keys(sent).length > 0], [4, Object.values(suitors).some((item) => item.by === "me")], [5, ownedSkins.length > 1]] as const).map(([n, done]) => (
                    <li key={n} className={cn("flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm", done ? "bg-[#ECFCCB] font-semibold text-[#3F6212]" : "text-[#6B7280]")}><span aria-hidden="true">{done ? "✅" : "🔒"}</span>{t(`bottle.ach${n}` as "bottle.ach1")}</li>
                  ))}
                </ul>
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
                          <button onClick={() => { if (owned) return setSkin(n); if (!pay(skinPrice(n))) return setPayNote(true); setOwnedSkins((list) => [...list, n]); setSkin(n); }} aria-pressed={skin === n} aria-label={`${t("bottle.bottles")} ${n + 1}`} className={cn("flex w-full flex-col items-center rounded-lg border-2 bg-[#FDF3E1] py-1", skin === n ? "border-[#8CC63F]" : "border-transparent")}>
                            <span className="h-12" style={{ filter: skinFilter(n) }}>{n >= 15 ? <WaterBottleSvg className="h-full" /> : <BottleSvg className="h-full" />}</span>
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
              ) : panel === "frames" ? (
                <div>
                  <ul className="grid grid-cols-4 gap-2">
                    <li><button onClick={() => setFrame(null)} aria-pressed={!frame} className={cn("flex aspect-square w-full items-center justify-center rounded-xl border-2 text-xs font-bold text-[#6B7280]", !frame ? "border-[#8CC63F]" : "border-[#E5E7EB]")}>✕</button></li>
                    {frames.map((color) => {
                      const owned = ownedFrames.includes(color);
                      return <li key={color}><button onClick={() => { if (!owned) { if (!pay(3)) return setPayNote(true); setOwnedFrames((list) => [...list, color]); } setFrame(color); }} aria-pressed={frame === color} aria-label={`${t("bottle.frames")} ${color}`} className={cn("flex aspect-square w-full items-end justify-center rounded-xl border-2 pb-0.5 text-[10px] font-bold text-[#374151]", frame === color ? "border-[#8CC63F]" : "border-transparent")} style={{ boxShadow: `inset 0 0 0 5px ${color}` }}>{owned ? "✓" : "❤ 3"}</button></li>;
                    })}
                  </ul>
                  {payNote ? <p role="status" className="mt-2 rounded-lg bg-[#FEF3C7] p-2 text-center text-xs font-semibold text-[#92400E]">{t("bottle.noHearts")}</p> : null}
                </div>
              ) : (
                <ol className="max-h-[70cqmin] list-decimal space-y-1.5 overflow-y-auto pl-6 pr-1 text-sm text-[#1F2937]">
                  {[1, 2, 3, 4].map((n) => <li key={n}>{t(`bottle.rule${n}` as "bottle.rule1")}</li>)}
                </ol>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col border-border", wide ? "border-l" : "border-t")}>
        {video && wide ? (
          <div className="relative aspect-video max-h-[42%] w-full shrink-0 bg-black">
            <iframe ref={frameRef} onLoad={() => window.setTimeout(pushMusic, 800)} src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0&enablejsapi=1`} title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
            <button onClick={() => setVideo(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"><X size={15} /></button>
          </div>
        ) : null}
        {video && !wide ? (
          <div className="absolute right-0 top-2 z-20 w-[190px] overflow-hidden rounded-l-2xl border border-r-0 border-border bg-surface shadow-lg">
            <div className="flex items-center">
              <img src={players[meIndex].avatar} alt="" className="mx-2 h-10 w-10 shrink-0 rounded-full border-2 border-border object-cover" />
              <div className="aspect-video min-w-0 flex-1 bg-black"><iframe ref={frameRef} onLoad={() => window.setTimeout(pushMusic, 800)} src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0&enablejsapi=1`} title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" /></div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1">
              <button onClick={() => setMusic(music ? 0 : 60)} aria-label={t(music ? "videos.mute" : "videos.unmute")} title={t(music ? "videos.mute" : "videos.unmute")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:text-text">{music ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
              <input type="range" min={0} max={100} value={music} onChange={(event) => setMusic(Number(event.target.value))} aria-label={t("bottle.music")} className="min-w-0 flex-1 accent-[#8CC63F]" />
              <button onClick={() => setVideo(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:text-text"><X size={15} /></button>
            </div>
          </div>
        ) : null}
        {audio ? (
          <div className="flex items-center gap-2 border-b border-border p-2">
            <Music2 size={18} className="shrink-0 text-[#FF3B30]" />
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-text">{audio.name}</span><audio src={audio.url} autoPlay controls ref={(node) => { if (node) node.volume = music / 100; }} className="mt-1 h-8 w-full" /></span>
            <button onClick={() => setAudio(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text"><X size={15} /></button>
          </div>
        ) : null}
        <p className={cn("border-b border-border px-3 py-1.5 text-[11px] text-muted", picked !== null && !wide && "hidden")}>{online ? `${t("bottle.liveNote")} ${net?.table ?? ""} · ${seated.length}/12` : t("bottle.demoNote")}</p>
        {picked !== null ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
              <button onClick={() => setCard(true)} aria-label={`${players[picked].name}, ${players[picked].age}`} className="shrink-0"><img src={players[picked].avatar} alt="" className={cn("rounded-lg object-cover shadow", wide ? "h-14 w-14" : "h-9 w-9")} /></button>
              <p className="min-w-0 flex-1 text-[11px] leading-tight text-muted">{t("bottle.giftHint2")}<span className="block truncate text-sm font-bold text-text">{players[picked].name}, {players[picked].age} · 💋 {kisses[players[picked].id] ?? 0}</span></p>
              <button onClick={() => setPicked(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8CC63F] text-white hover:bg-[#7AB532]"><X size={17} /></button>
            </div>
            <div role="menu" className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(58px,1fr))] content-start gap-0.5 overflow-y-auto p-2">
              {[...giftChoices, ...lockedGifts].map(([gift, price, need], order) => (
                <button key={`${gift}-${order}`} role="menuitem" aria-disabled={need === -1 ? !vip : Boolean(need)} onPointerDown={(event) => pressGift(picked, gift, price, need, event.clientX, event.clientY)} onPointerMove={(event) => { const state = pressed.current; if (state && !state.started && Math.hypot(event.clientX - state.x, event.clientY - state.y) > 8) cancelPress(); }} onPointerUp={() => releaseGift(picked, gift, price, need)} onPointerLeave={cancelPress} onPointerCancel={cancelPress} onContextMenu={(event) => event.preventDefault()} onKeyDown={(event) => { if (event.key === "Enter" && !event.repeat) giveGift(picked, gift, price, need); }} aria-label={`${t("gifts.send")} ${price}`} className={cn("flex touch-pan-y select-none flex-col items-center gap-0.5 rounded-xl p-1.5 hover:bg-surface-2", ((need === -1 ? !vip : Boolean(need)) || hearts < price) && "opacity-35 grayscale")}>
                  <Gift id={gift} className="h-11 w-11" />
                  <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-text">{need === -1 ? <b className="rounded bg-[#F59E0B] px-1 text-[10px] text-white">VIP</b> : need ? <span aria-label={`${need}`}>🔒</span> : <><Heart size={12} fill="#FF6A1F" stroke="none" />{price}</>}</span>
                </button>
              ))}
            </div>
            {giftNote ? <p role="status" className="border-t border-border px-3 py-2 text-center text-xs font-semibold text-text">{giftNote}</p> : null}
          </div>
        ) : null}
        <div ref={listRef} className={cn("min-h-0 flex-1 space-y-2 overflow-y-auto p-3", picked !== null && "hidden")}>
          {lines.filter((line) => !line.text || !muted.includes(line.from)).map((line) => {
            const from = byId(line.from);
            const to = line.to ? byId(line.to) : null;
            if (!from) return null;
            return (
              <div key={line.id} className="flex items-center gap-2 text-sm">
                <img src={from.avatar} alt={from.name} title={from.name} className="h-8 w-8 shrink-0 rounded-md object-cover" />
                {line.text ? <p className="min-w-0 break-words text-text"><span className="font-semibold text-muted">{from.me ? t("common.you") : from.name}: </span>{line.text}</p> : null}
                {to ? <>{line.gift ? <Gift id={line.gift} className="h-7 w-7 shrink-0" /> : line.song ? <span className="flex min-w-0 items-center gap-1 text-text"><Music2 size={16} className="shrink-0 text-[#F59E0B]" /><span className="truncate">{line.song}</span></span> : <span className="shrink-0 text-lg">💋</span>}<span className="font-bold text-accent">»</span><img src={to.avatar} alt={to.name} title={to.name} className="h-8 w-8 shrink-0 rounded-md object-cover" /></> : null}
              </div>
            );
          })}
        </div>
        <form onSubmit={handleChat} className={cn("flex items-center gap-2 border-t border-border p-2.5", picked !== null && "hidden")}>
          <input ref={chatRef} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={200} aria-label={t("messages.placeholder")} placeholder={t("messages.placeholder")} autoComplete="off" className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
          <button type="button" onClick={() => { setPayNote(false); setPanel("vip"); }} aria-label={`${t("bottle.smileys")} (VIP)`} title={`${t("bottle.smileys")} (VIP)`} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xl">😊<b className="absolute -right-1 -top-1 rounded bg-[#F59E0B] px-1 text-[9px] leading-4 text-white">VIP</b></button>
          <button type="submit" disabled={!draft.trim()} aria-label={t("messages.send")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EE8A2B] text-white disabled:opacity-40"><SendHorizontal size={17} /></button>
        </form>
      </div>
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
    </div>
  );
}
