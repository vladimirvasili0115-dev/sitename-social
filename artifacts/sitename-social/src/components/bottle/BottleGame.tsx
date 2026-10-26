"use client";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import Link from "next/link";
import { Phone, AtSign, ChevronDown, ChevronLeft, LifeBuoy, Pause, Play, Clock, Flame, Search, Star, Ban, Flag, Mail, Gift as GiftIcon, Heart, Home, Maximize, ArrowUpRight, BadgeCheck, Crown, DoorOpen, Eye, EyeOff, KeyRound, Lock, Mars, Trash2, Venus, BookOpen, MessageSquare, Check, Menu, UserRound, Minimize, Music, Plus, UserCheck, Music2, RefreshCw, SendHorizontal, Settings, Trophy, UserPlus, UserRoundCog, Users, Volume2, X } from "lucide-react";
import type { GiftId } from "@/types";
import { cartoonAvatar } from "./avatarArt";
import { useTranslation } from "@/i18n/useTranslation";
import { GiftArt } from "@/components/gifts/GiftArt";
import { useProfile } from "@/components/profile/useProfile";
import { cn } from "@/lib/utils";
import { emojiSets } from "@/lib/emojiSets";
import { useIsAdmin } from "@/components/report/useIsAdmin";
import { customFile, useCustomArt } from "@/lib/customArt";
import { giftBounds } from "./giftBounds";
import { durationSeconds, rankSongs, songScore } from "@/lib/songSearch";
import { HeartBurst } from "./PourTube";
import { Fireworks, fireworksLevel } from "./Fireworks";
import { GESTURES, GIFT_PRICES, GIFT_RULES, missing, type Progress, type RuleKind } from "./giftRules";
import { OrigButton, OrigPopup } from "./OrigPopup";
import { siteMusic } from "@/components/music/siteMusic";
import { customGiftNames, customPlace, customPrice, giftGroups, landedName, isDrink, colorSteps, nextColor, onPhoto } from "./customGifts";
const landed = (gift: string, rand?: () => number) => (gift.startsWith("c:") ? `c:${landedName(gift.slice(2), rand)}` : gift);
import { AchievementsPanel } from "./AchievementsPanel";
import { nameColorClass, useNameColors } from "./nameColors";
import { startCall } from "@/lib/callSync";
import { clock as callClock, parseCallLog } from "@/lib/callLog";
import { SeatGiftCanvas, type SeatGiftData } from "./SeatGiftCanvas";
import { FlightCanvas, type CanvasFlight, type FlightGeometry } from "./FlightCanvas";
import { FIRST_ORIGINAL, FRAME_PRICE, FrameArt, ORIGINAL_FRAMES, frameLooks, frameStone } from "./FrameArt";
import { PassPanel, type PassData } from "./PassPanel";
import { OnceImg } from "./OnceImg";
import { PerfMeter } from "./PerfMeter";
import { ActivePanel, ComplimentPill, ComplimentsPanel, InvitePanel, ShopPanel, emojiSrc } from "./ShopPanels";
import { bumpStat, markVisit, readStats, syncStats } from "./achievements";
import { BottleSvg, WaterBottleSvg, WoodTable } from "./BottleArt";
import { playGiftSound, playPing, playSfx, playSound, setVolume, warmPing } from "./sound";
import { supabase } from "@/lib/supabase";
import { refreshFriends } from "@/lib/friendsSync";
import { ensureMessagesLoaded, openRemoteChat, remoteChats, sendRemoteMessage } from "@/lib/messagesSync";
import { uploadBlob } from "@/lib/media";
import { refreshGifts } from "@/lib/giftsSync";
import { bottleLogIp, bottleAdminIpLookup, type BottleIpRow, bottleAnswer, bottleAchSync, bottleAchView, bottleGesture, bottleSmiles, bottleBuyHearts, bottleGiftAllow, bottleBuySmiles, bottleProgress, bottleGesturesOpen, bottleSkin, bottleBuyChances, bottleJoin, bottleMove, bottleRejoin, bottleQueueLeave, bottleActiveClaim, bottleAdmire, bottleProfile, type BottleProfile, bottleDaily, bottleItems, bottleItemBuy, bottleBooster, bottleTutorial, bottleAdminIds, type BottleItems, bottleLeagueInfo, bottleLeagueClaim, type BottleLeague, bottleGiftShare, bottlePass, bottlePassBuy, bottlePassChest, bottlePassClaim, bottleCompliment, bottleFrame, bottleKick, bottleRefSet, bottleRefStatus, bottleSave, bottleKickPrice, bottleGift, bottleGiftMany, bottlePlay, bottleRoomCreate, bottleRoomDelete, bottleRoomJoin, bottleRoomsList, type BottleRooms, bottleTables, bottleTop, type BottleTop, bottleWheel, type BottleTables, bottleLeave, bottleSay, bottleSpend, bottleSpin, bottleSync, bottleClaim, type BottleState, type BottleSeat, bottleEffectOf, bottleYtGet, bottleYtPut, bottleTableGifts, type BottleSeatGift } from "@/lib/bottleSync";
import { ytHint, ytReason } from "./ytHints";
import { BonusMarket, EnigmaEffect, arrivalLabel, marketLabel } from "./BonusMarket";

type Player = { id: string; name: string; age: number; female: boolean; avatar: string; me?: boolean; empty?: boolean; zodiac?: number | null };
type Phase = "waiting" | "spinning" | "choice" | "kissed" | "declined";
type Track = { id: string; title: string; duration?: string };
const stored = (key: string): Track[] => { try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as Track[]; } catch { return []; } };
const keep = (key: string, list: Track[]) => { try { window.localStorage.setItem(key, JSON.stringify(list.slice(0, 40))); } catch { /* storage is full or blocked */ } };
type Line = { id: number; from: string; to?: string; tos?: string[]; per?: Record<string, number>; gesture?: string; gestures?: string[]; count?: number; bottle?: { a: number; b: number }; text?: string; gift?: string; song?: string; admire?: { amount?: number; by?: string; avatar?: string; target?: string; old?: string | null; self?: boolean; lost?: boolean }; event?: { kind: "kick" | "saved" | "kicked"; a: string; b: string }; boost?: { kind: "kiss_fire" | "refuse_slap"; a: string; b: string } };
// A gift tile stands for a whole family (e.g. the five kinds of kiss lips): in the chat they all count as the same gift.
let familyOf: Map<string, string> | null = null;
function giftFamily(gift: string) {
  if (!gift.startsWith("c:")) return gift;
  if (!familyOf) { familyOf = new Map(); for (const [tile, list] of Object.entries(giftGroups)) for (const member of list) familyOf.set(member, tile); }
  return `c:${familyOf.get(gift.slice(2)) ?? gift.slice(2)}`;
}
// The same gift sent again and again by the same person makes one chat line "🌹 ×5 » receivers" instead of many lines.
const CHAT_KEEP = 40;
function mergeLines(list: Line[], fresh: Line[]) {
  const out = [...list];
  for (const line of fresh) {
    let at = out.length - 1;
    // A stream of different gifts from one player: the gift joins the earlier row of its own kind inside the unbroken run of that player's gift rows (so rows do not alternate and fill the chat).
    if (line.gift && line.to) while (at > 0 && out[at].gift && !out[at].text && out[at].from === line.from && giftFamily(out[at].gift ?? "") !== giftFamily(line.gift) && out.length - at < 8) at -= 1;
    const last = out[at];
    if (line.gift && line.to && last && last.gift && giftFamily(last.gift) === giftFamily(line.gift) && last.from === line.from && !last.text) {
      const tos = [...(last.tos ?? (last.to ? [last.to] : []))];
      if (!tos.includes(line.to)) tos.push(line.to);
      // How many of the gifts went to each receiver (the first line is one gift to its receiver).
      const per = { ...(last.per ?? (last.to ? { [last.to]: last.count ?? 1 } : {})) };
      per[line.to] = (per[line.to] ?? 0) + 1;
      out[at] = { ...last, tos, per, count: (last.count ?? 1) + 1 };
      continue;
    }
    // Smileys from the same player in a row stand next to each other in one chat row (and wrap to a new row when it is full), not one under the other.
    if (line.gesture && last && last.gesture && last.from === line.from) {
      out[out.length - 1] = { ...last, gestures: [...(last.gestures ?? [last.gesture]), line.gesture].slice(-400) };
      continue;
    }
    out.push(line);
  }
  return out.slice(-CHAT_KEEP); // the chat keeps only the newest lines
}

// Seat centres in percent of the table. The top row of the wide table is kept low enough that a crown or hat (sticking out about 40% above the photo) is not cut off by the frame.
// Wide: a tool column on the left, seats in a rectangle. Tall (phone, window): a tool row on top, seats in an oval.
type Seats = readonly (readonly [number, number])[];
const layouts: Record<"wide" | "tall", { seats: Seats; cx: number; cy: number }> = {
  wide: { seats: [[24, 17.8], [44, 17.8], [64.2, 17.8], [84.3, 17.8], [85.5, 39.8], [85.5, 61.3], [84.3, 83.2], [64.2, 88.5], [44, 88.5], [24, 83.2], [20.2, 61.3], [20.2, 39.8]], cx: 54.1, cy: 48.7 },
  tall: { seats: [[17, 26], [39, 21], [61, 21], [83, 26], [85, 46], [85, 65.5], [83, 85], [61, 89.5], [39, 89.5], [17, 85], [13, 65.5], [13, 46]], cx: 50, cy: 55 },
};
const bots: Omit<Player, "avatar">[] = [
  { id: "b1", name: "Leyla", age: 24, female: true }, { id: "b2", name: "Rəşad", age: 27, female: false }, { id: "b3", name: "Nigar", age: 22, female: true },
  { id: "b4", name: "Samir", age: 29, female: false }, { id: "b5", name: "Mina", age: 21, female: true }, { id: "b6", name: "Kamran", age: 31, female: false },
  { id: "b7", name: "Aysel", age: 26, female: true }, { id: "b8", name: "Tural", age: 25, female: false }, { id: "b9", name: "Günay", age: 23, female: true },
  { id: "b10", name: "Elvin", age: 28, female: false }, { id: "b11", name: "Səbinə", age: 27, female: true },
];
const smallTalk = ["Salam hamıya 👋", "Bu gün bəxtim gətirir 😄", "Kim fırladır?", "Çay içən var? ☕", "Hahaha", "Bir də fırlat!", "Bakıdan kim var?", "Gecəniz xeyrə 🌙"];
const giftChoices: [string, number][] = [
  ["song:video", 9], ["song:mp3", 5], ["e:🤴", 3], ["e:👸", 3], ["e:🧸", 1], ["e:🦋", 5], ["e:🎀", 5], ["e:🌸", 5],
];
// The wheel of fortune: 16 sectors clockwise from the top. The database does the real draw with its own odds; the weights here are only used by the offline demo.
const wheelSectors: { hearts?: number; chances?: number; kisses?: number; smiles?: number; weight: number }[] = [
  { hearts: 1000, weight: 30 }, { hearts: 1, weight: 900 }, { kisses: 1, weight: 900 }, { hearts: 25, weight: 400 }, { hearts: 3, weight: 1300 }, { chances: 1, weight: 1300 }, { hearts: 100, weight: 100 }, { smiles: 1, weight: 700 },
  { kisses: 3, weight: 500 }, { hearts: 10, weight: 900 }, { weight: 200 }, { chances: 3, weight: 500 }, { hearts: 3, weight: 1070 }, { hearts: 5, weight: 900 }, { kisses: 1, weight: 200 }, { smiles: 3, weight: 100 },
];
const prizeText = (item: (typeof wheelSectors)[number]) => (item.hearts ? `❤️ ${item.hearts}` : item.chances ? `🎲 ${item.chances}` : item.kisses ? `💋 ${item.kisses}` : item.smiles ? `😊 ${item.smiles}` : "");
const chancePacks: [number, number][] = [[300, 900], [50, 150], [15, 45], [5, 20], [1, 5]];
// Smiley packs: [smileys, price in hearts]. The server (bottle_buy_smiles) has the same list.
const smilePacks: [number, number][] = [[300, 120], [100, 45], [40, 20], [15, 8], [5, 3]];
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
  ["e:👒", 5, 1000], ["e:🗿", 5, 7000], ["e:🪭", 5, 23000], ["e:🧿", 5, 23000], ["e:🦚", 5, 23000], ["e:💌", 5, 40000], ["e:🐓", 5, -1],
];
// Gifts that are worn on the head sit tilted on the top corner of the photo; everything else stands at the bottom.
// Drinks pay the receiver +1 heart (the server does it); the receiver's photo shows a "+1" burst.

const headGifts = new Set(["crown", "e:👑", "e:⛑️", "e:🤠", "e:🧢", "e:🐻", "e:🐮", "e:🐱", "e:🐰", "e:🦌", "e:🎀", "e:🌸", "e:🪖", "e:🕶️", "e:😈", "e:👒", "e:🎩", "e:🎓", "e:🔱"]);
// Hats, ears and face masks are worn on the photo, so they are not also dropped onto it like other gifts.
const wornGift = (gift: string) => (gift.startsWith("c:") ? customPlace(gift.slice(2)) !== "body" : headGifts.has(gift));
// Where a landed gift sits on the photo (in % of the photo). Kisses, gems, flowers, gum, eggs, plush toys, bows, ears and caps
// land on a random spot (a new one every time); the cactus sits exactly in the corner, the ice cream peeks out from behind,
// balloons grow a little in the corner, the flag, the Eiffel tower and cupid are a bit bigger; the rest stand in the corner.
// Which place of the photo a landed gift takes: a corner (left or right) or the middle.
const spotPlace = (spot: Pick<Spot, "kind" | "x" | "s">) => (spot.kind === "hatL" ? "left" : spot.kind === "hatR" ? "right" : spot.kind === "corner" || spot.kind === "balloon" ? (spot.x + spot.s / 2 < 45 ? "left" : "right") : "middle");
const stickerPlace = (gift: string) => { const at = gift.startsWith("c:") ? customPlace(gift.slice(2)) : headGifts.has(gift) ? "head" : "body"; return at === "head" || at === "ears" ? "left" : at === "body" ? "right" : "middle"; };
type Spot = { key: number; gift: string; x: number; y: number; s: number; r?: number; t?: number; fade?: boolean; kind: "rand" | "corner" | "behind" | "balloon" | "hatL" | "hatR" };
// Like the original (GiftAnimations.ts): a gift's random spot comes from a seed every screen knows, so all players see it in the same place.
function seeded(seed: number) {
  let a = (Math.round(seed) >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Three places on the photo, as in the original: "ava" (anywhere, any angle), "drink" (bottom-right corner), "hat" (top-left corner).
// Random gifts do not push each other off the photo any more: up to RAND_MAX of them stay together and each goes after RAND_KEEP_MS.
const RAND_MAX = 5;
const RAND_KEEP_MS = 30000;
const RANDOM_SPOT = /^(air_kiss\d|gem\d|flower\d+|loveis\d|iloveyou|bear\d+|egg\d|strawberry\d|valentine\d)$/;
// Caps and hats sit on the top-left or the top-right corner of the photo, tilted towards it.
const HAT_SPOT = /^(\w*cap|cappy|cowboy|cylinderw?|indianhat|napoleon|musketeer|nurse|bezkoz|monomachhat|noteshat\w|partyhat\d|clown|carnivalmask\d|horseheadhat2|baseballa\w)$/;
// These spin a full turn on the way; kisses and gems fly a little smaller.
const SPIN_FLIGHT = /^c:(bear\d+|labubu1|wholeegg)$/;
const SMALL_FLIGHT = new Set(["c:air_kiss1", "c:gem1"]);
const SCATTER = new Set(["c:wholeegg"]);
// These gifts fly as the whole picture (egg, tomato) and only break when they reach the photo.
const WHOLE_FLIGHT = new Set(["c:wholeegg", "c:tomato1"]);
const SMALL_CORNER = /^(b52|drink[a-z]{2})$/; // the B-52 shot and the country glasses (drinkam, drinkaz ...) stood far too big on the photo: two thirds of the usual corner size
// The visible part of a gift picture as fractions of its square box on the photo (the picture is centred, or pinned bottom-right for corner gifts).
function artBox(name: string, pinned: boolean) {
  const e = giftBounds[name];
  if (!e) return null;
  const [l, t, r, b, w, h] = e;
  const m = Math.max(w, h);
  const ox = pinned ? m - w : (m - w) / 2, oy = pinned ? m - h : (m - h) / 2;
  return { l: (ox + l) / m, t: (oy + t) / m, r: (ox + r) / m, b: (oy + b) / m };
}
// Hats sit on the top-left corner of the frame: the middle of the hat is on the corner itself, the hat turned -45°.
const HAT_SIZE = 48;
function hatSpot(name: string): { x: number; y: number; s: number } {
  const box = artBox(name, false);
  const dx = box ? ((box.l + box.r) / 2 - 0.5) * HAT_SIZE : 0, dy = box ? ((box.t + box.b) / 2 - 0.5) * HAT_SIZE : 0;
  const rx = Math.SQRT1_2 * (dx + dy), ry = Math.SQRT1_2 * (dy - dx); // where that middle ends up after the -45° turn
  return { x: -rx - HAT_SIZE / 2, y: -ry - HAT_SIZE / 2, s: HAT_SIZE };
}
// Drinks and other corner gifts stand on the bottom-right edge of the frame: the picture's left edge is 10% inside the frame, its bottom just below it.
// The visible art is at most CORNER_ART_H% of the photo high and CORNER_ART_W% wide (not the empty picture box), so big pictures stay small on the corner.
const CORNER_SIZE = 80;
const CORNER_SHIFT_LEFT = 7; // gifts on the bottom-right corner (hearts, drinks, balloons...) hang over the frame: they sit 3.5 mm (7% of the photo width) further left, in flight and when landed
const CAT_SHIFT_LEFT = 12; // the cat in the dress sits about 6 mm (12% of the photo width) further left (3 mm, then 3 mm more)
const CORNER_ART_H = 38;
const CORNER_ART_W = 32;
// The name shown in the game: the first word ("Samir Aliyev" -> "Samir"). A name written letter by letter or with a one-or-two letter first word ("P ə b a h", "Al Veli") is shown whole, otherwise only its first letter would be left.
function gameName(raw: string | null | undefined): string {
  const words = (raw ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  return [...words[0]].length <= 2 && words.length > 1 ? words.join(" ") : words[0];
}
// The cherry cocktail and the Makarov pistol are shown 1.2 times bigger; they grow towards the photo (the right edge and the bottom stay where they were).
const packWords: Record<string, { wait: string; ok: string; balance: string; fail: string; top: string }> = {
  az: { wait: "…", ok: "❤ {n} hesabına əlavə olundu!", balance: "Sayt balansın kifayət etmir ({need} lazımdır).", fail: "Alınmadı. Bir az sonra yenidən yoxla.", top: "Balansı artır" },
  tr: { wait: "…", ok: "❤ {n} hesabına eklendi!", balance: "Site bakiyen yetmiyor ({need} gerekli).", fail: "Satın alınamadı. Biraz sonra tekrar dene.", top: "Bakiyeyi artır" },
  ru: { wait: "…", ok: "❤ {n} добавлено на счёт!", balance: "Баланса сайта не хватает (нужно {need}).", fail: "Не удалось купить. Попробуй позже.", top: "Пополнить баланс" },
  en: { wait: "…", ok: "❤ {n} added to your account!", balance: "Your site balance is not enough ({need} needed).", fail: "Could not buy. Try again in a moment.", top: "Top up balance" },
};
function PackNote({ note, locale }: { note: { kind: "wait" | "ok" | "balance" | "fail"; n?: number; need?: number }; locale: string }) {
  const w = packWords[locale] ?? packWords.en;
  if (note.kind === "wait") return <>{w.wait}</>;
  if (note.kind === "ok") return <>{w.ok.replace("{n}", (note.n ?? 0).toLocaleString("ru-RU"))}</>;
  if (note.kind === "fail") return <>{w.fail}</>;
  return <>{w.balance.replace("{need}", note.need ? `${(note.need / 100).toLocaleString("ru-RU")} ₼` : "?")} <a href="/market/" target="_blank" rel="noopener" className="underline">{w.top}</a></>;
}
// Auto-clicker guard: at most this many gifts a second from one device (enough for fast tapping at a full table of 12).
const GIFT_BUCKET = 120;
const BIGGER_CORNER = /^(cherry|makarov|revolver)$/;
const BIGGER_BY = 1.2;
const CORNER_ALL_BY = 1.7; // every other gift on the bottom-right corner is 1.7x bigger (they looked tiny next to the photo)
function cornerSpot(name: string, maxH: number = CORNER_ART_H, maxW: number = CORNER_ART_W, grow: number = 1): { x: number; y: number; s: number } | null {
  const box = artBox(name, true);
  if (!box) return null;
  const base = Math.max(28, Math.min(CORNER_SIZE, maxH / Math.max(0.05, box.b - box.t), maxW / Math.max(0.05, box.r - box.l)));
  const baseWidth = base * (box.r - box.l);
  const size = base * grow, width = size * (box.r - box.l);
  const left = Math.max(45, Math.min(90, 140 - baseWidth)) - (width - baseWidth);
  return { x: left - size * box.l, y: 100 - size * box.b, s: size }; // the art stands exactly on the bottom line of the frame
}
function planLanding(gift: string, seed: number = Math.random() * 1e9) {
  const land = landed(gift, seeded(seed + 7)); // which flower/colour lands is the same on every screen too
  const name = land.startsWith("c:") ? land.slice(2) : "";
  const scatter = SCATTER.has(gift) ? giftGroups[gift.slice(2)].map((item) => `c:${item}`) : null;
  const at = (s: number, x: number, y: number, kind: Spot["kind"]): Omit<Spot, "key"> => ({ gift: land, s, x, y, kind });
  let spot: Omit<Spot, "key"> | null;
  const rnd = seeded(seed);
  if (name && (HAT_SPOT.test(name) || /^(ears|bow_)/.test(name))) { const hat = hatSpot(name); const near = /^bow_/.test(name) ? 4 : 0; spot = at(hat.s, hat.x + near, hat.y + near, "hatL"); } // bows sit 4% (about 2 mm) closer to the photo, so they do not hang over the frame // the original "hat": sitting right on the top-left (90°) corner, turned -45°
  else if (name && (RANDOM_SPOT.test(name) || onPhoto(name) || name === "fairy")) {
    // The original "ava": a random point anywhere on the photo and a random angle (0–360°), the same on every screen.
    const size = name === "handcuffs" ? 80 : 40; // handcuffs: twice as big (the centre stays at the same random point)
    const x = rnd() * 100 - size / 2, y = rnd() * 100 - size / 2;
    spot = { ...at(size, x, y, "rand"), r: Math.round(rnd() * 360) }; }
  else if (land === "e:🐓") spot = at(100, 0, 0, "corner"); // the rooster covers the whole photo
  else if (wornGift(land)) spot = null;
    else {
    // Like the original: a small gift sitting on the bottom-right corner, a quarter of it over the edge.
    // Red Bull: a can standing inside the photo frame, in its bottom-right corner (not over the edge).
    if (/^redbull/.test(name)) spot = at(60, 40, 40, "corner");
    else {
    const size = /^(catdress|donkey|flagaz|eiffeltower|amurchik)$/.test(name) ? 92 : /^baloon\d$/.test(name) ? 64 : 76;
    // The cat in the dress used to fill almost the whole photo (89% high): now its visible art is at most 55% high.
    const edge = size === 76 && name ? cornerSpot(name, undefined, undefined, BIGGER_CORNER.test(name) ? (/^(makarov|revolver)$/.test(name) ? BIGGER_BY * 1.2 : BIGGER_BY) : SMALL_CORNER.test(name) ? (CORNER_ALL_BY * 2) / 3 : CORNER_ALL_BY) : name === "donkey" ? cornerSpot(name, 40, 34) : name === "catdress" ? (() => { const spot = cornerSpot(name, 55, 40); return spot ? { ...spot, x: spot.x - CAT_SHIFT_LEFT } : null; })() : null;
    const pinned = name ? artBox(name, true) : null; // the visible art ends exactly on the bottom line of the frame
    spot = edge ? at(edge.s, edge.x, edge.y, "corner") : at(size, 100 - size * 0.72, pinned ? 100 - size * pinned.b : 100 - size * 0.76, /^baloon\d$/.test(name) ? "balloon" : "corner");
    if (name !== "catdress") spot = { ...spot, x: spot.x - CORNER_SHIFT_LEFT - (/^(makarov|revolver)$/.test(name) ? 4 : 0) }; // the pistol: another 2 mm (4%) to the left // flightTo reads this same spot, so the flight ends exactly where the gift stays
    }
  }
  return { land, spot, scatter };
}
// While flying, a family gift changes colour through its members.
function GiftCycle({ names, className }: { names: string[]; className?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setN((value) => (value + 1) % names.length), 160); return () => window.clearInterval(timer); }, [names.length]);
  return <Gift anim id={names[n]} className={className} />;
}
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
// The booster effect over the pair in the middle: burning lips with rising flames, or a hand that flies in and slaps.
function BoostFx({ kind, fromLeft, x, y }: { kind: "kiss_fire" | "refuse_slap"; fromLeft: boolean; x: number; y: number }) {
  if (kind === "kiss_fire") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute z-40 h-0 w-0" style={{ left: `${x}%`, top: `${y}%` }}>
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="absolute text-[6cqmin]" style={{ left: `${(n - 4.5) * 2.6}cqmin`, top: "2cqmin", ["--fx" as string]: `${((n * 37) % 9) - 4}cqmin`, animation: `boost-flame 1.4s ease-out ${n * 90}ms both` }}>🔥</span>
        ))}
        <img src="/custom/ui/kiss_fire.webp" alt="" className="absolute left-0 top-0 h-[24cqmin] w-[24cqmin] max-w-none object-contain drop-shadow-[0_0_18px_rgba(255,120,40,0.95)]" style={{ animation: "boost-pop 2.4s ease-out both" }} />
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="pointer-events-none absolute z-40 h-0 w-0" style={{ left: `${x}%`, top: `${y}%` }}>
      <span className="absolute left-0 top-0 text-[16cqmin]" style={{ animation: "boost-bang 1.6s ease-out both" }}>💥</span>
      <img src="/custom/ui/refuse_slap.webp" alt="" className="absolute left-0 top-0 h-[22cqmin] w-[22cqmin] max-w-none object-contain drop-shadow-[0_0_14px_rgba(160,120,255,0.9)]" style={{ ["--sx" as string]: fromLeft ? "-180%" : "80%", ["--sr" as string]: fromLeft ? "-40deg" : "40deg", animation: "boost-slap 2.2s ease-out both" }} />
    </div>
  );
}
// Table effects from the original: when all 12 seats are taken and enough players wear gifts of one theme,
// the whole table gets a shower (petals, confetti, hearts…). Types match gift names by their start, like "partyhat1".
const TABLE_VFX: { kind: string; sound: string; emoji: string[]; types: Record<string, string[]>; filters: Record<string, number> }[] = [
  { kind: "balloon1", sound: "vfx_balloon1", emoji: ["🎈"], types: { gifts: ["leninbadge"], hats: ["lenincap"] }, filters: { gifts: 10, hats: 9 } },
  { kind: "balloon2", sound: "vfx_balloon2", emoji: ["🎈", "😊"], types: { drinks: ["smilecup"], gifts: ["smile"] }, filters: { drinks: 10, gifts: 11 } },
  { kind: "confetti", sound: "vfx_confetti", emoji: ["🎊", "🎉", "✨"], types: { drinks: ["birthdaycake"], hats: ["partyhat"] }, filters: { drinks: 9, hats: 9 } },
  { kind: "flower", sound: "vfx_flower", emoji: ["🌸", "🌺", "🌷"], types: { drinks: ["perfume", "springcocktail"], gifts: ["rose"] }, filters: { drinks: 9, gifts: 11 } },
  { kind: "ghost", sound: "vfx_ghost", emoji: ["👻", "🎃"], types: { drinks: ["brainicecream", "candle", "tarantula"], gifts: ["ghost", "pumpkin"], hats: ["witch"] }, filters: { drinks: 12, gifts: 12, hats: 12 } },
  { kind: "heart", sound: "vfx_heart", emoji: ["❤️", "💖"], types: { drinks: ["romanticcandle"], gifts: ["valentine"] }, filters: { drinks: 9, gifts: 9 } },
  { kind: "heart2", sound: "vfx_heart2", emoji: ["💕", "💋"], types: { drinks: ["lipstick", "romanticcandle"], gifts: ["bikinibottom", "bikinitop", "swimmers"] }, filters: { drinks: 8, gifts: 10 } },
  { kind: "leaf", sound: "vfx_leaf", emoji: ["🍂", "🍁"], types: { drinks: ["mushroomsbasket"], gifts: ["leaf"], hats: ["wreath"] }, filters: { drinks: 9, gifts: 11, hats: 9 } },
  { kind: "pacifier", sound: "vfx_pacifier", emoji: ["🍼"], types: { gifts: ["bomb"], hats: ["clownhat", "ololosh"] }, filters: { hats: 9, gifts: 11 } },
  { kind: "photo", sound: "vfx_photo", emoji: ["📸", "🖼️"], types: { drinks: ["camera"], gifts: ["polaroid"] }, filters: { drinks: 7, gifts: 11 } },
  { kind: "roll", sound: "vfx_roll", emoji: ["🍣", "🍙"], types: { gifts: ["trout"], drinks: ["japaneseroll", "japaneseset", "japanesesushi"] }, filters: { gifts: 11, drinks: 6 } },
  { kind: "snow", sound: "vfx_snow", emoji: ["❄️", "☃️"], types: { hats: ["winterhat"], drinks: ["christmasball", "snowman"] }, filters: { hats: 6, drinks: 6 } },
  { kind: "sock", sound: "vfx_sock", emoji: ["🧦", "⭐"], types: { drinks: ["canteen"], gifts: ["goldstar"], hats: ["budenovka", "hatservice", "hatvdv", "helmet", "tankhelmet"] }, filters: { drinks: 6, gifts: 11, hats: 9 } },
];
const TABLE_VFX_SECONDS = 10;
function TableShower({ emoji, seed }: { emoji: string[]; seed: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[35] overflow-hidden">
      {Array.from({ length: 36 }, (_, n) => {
        const r = (k: number) => { const x = Math.sin((seed + n * 13 + k) * 9301.7) * 43758.5; return x - Math.floor(x); };
        return <span key={n} className="absolute -top-[8cqmin] text-[5cqmin]" style={{ left: `${r(1) * 100}%`, ["--sway" as string]: `${(r(2) - 0.5) * 16}cqmin`, animation: `vfx-fall ${3.5 + r(3) * 3}s linear ${r(4) * (TABLE_VFX_SECONDS - 4)}s both`, fontSize: `${3.5 + r(5) * 3}cqmin` }}>{emoji[n % emoji.length]}</span>;
      })}
    </div>
  );
}
// The hint pointer: a hand that keeps tapping a spot (three spreading rings each second) with a short label beside it.
// `angle` turns the hand around the spot like the original (0 = from below-left, 180 = from above).
function HintHand({ target, label, angle }: { target: string; label: string; angle: number }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const find = () => {
      const element = target.startsWith("seat:") ? document.querySelector(`[data-seat="${target.slice(5)}"]`)
        : target === "gift-gem" ? document.querySelector('[role=menuitem][aria-disabled=false] img[src*="/gem1."]')?.closest("[role=menuitem]") ?? document.querySelector('[role=menuitem][aria-disabled=false]:nth-of-type(3)')
        : document.querySelector(`[data-hint="${target}"]`);
      if (!element) return setAt(null);
      if (target === "gift-gem") (element as HTMLElement).scrollIntoView({ block: "nearest" });
      const rect = element.getBoundingClientRect();
      setAt({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    };
    find();
    const timer = window.setInterval(find, 250);
    return () => window.clearInterval(timer);
  }, [target]);
  if (!at) return null;
  const rad = (angle * Math.PI) / 180;
  const width = Math.min(220, label.length * 8 + 28);
  const textY = (Math.abs(110 * Math.cos(rad)) < 65 ? 65 * Math.sign(Math.cos(rad) || 1) : 110 * Math.cos(rad)) - 16;
  const textX = Math.max(10 - at.x, Math.min(window.innerWidth - 10 - width - at.x, -58 * Math.sin(rad) - width / 2));
  return (
    <div aria-hidden="true" className="pointer-events-none fixed z-[75] h-0 w-0" style={{ left: at.x, top: at.y }}>
      {[0, 1, 2].map((n) => <span key={n} className="absolute -left-[6px] -top-[6px] h-3 w-3 rounded-full border-2 border-white bg-white/30" style={{ animation: `hint-ripple 1s ease-out ${n * 0.165}s infinite` }} />)}
      <span className="absolute left-0 top-0 block origin-top-left" style={{ transform: `rotate(${angle}deg)` }}>
        <span className="absolute block text-[34px] leading-none drop-shadow-[0_3px_4px_rgba(0,0,0,0.45)]" style={{ left: -6, top: 4, animation: "hint-tap 1s ease-in-out infinite" }}>👆</span>
      </span>
      <span className="absolute whitespace-nowrap rounded-xl bg-white px-3 py-1.5 text-sm font-black text-[#1F2937] shadow-[0_4px_14px_rgba(0,0,0,0.35)]" style={{ left: textX, top: textY, animation: "bottle-pop 0.3s ease-out both" }}>{label}</span>
    </div>
  );
}
// League colours (header gradient) and badge: Bronze, Silver, Gold, Platinum, Diamond.
const LEAGUE_COLORS: [string, string][] = [["#D08A52", "#9C5A2B"], ["#B8C2CC", "#7D8A96"], ["#F7C948", "#D49B0A"], ["#7FD3E6", "#3A9AB3"], ["#A78BFA", "#6D28D9"]];
function LeagueBadge({ league, className }: { league: number; className?: string }) {
  const [light, dark] = LEAGUE_COLORS[league] ?? LEAGUE_COLORS[0];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs><linearGradient id={`lg-${league}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={light} /><stop offset="1" stopColor={dark} /></linearGradient></defs>
      <path d="M32 3 8 11v17c0 15 10 27 24 33 14-6 24-18 24-33V11L32 3Z" fill={`url(#lg-${league})`} stroke="#FFFFFF" strokeWidth="3" />
      <path d="m32 17 4.2 8.6 9.4 1.3-6.8 6.6 1.6 9.4L32 38.5l-8.4 4.4 1.6-9.4-6.8-6.6 9.4-1.3L32 17Z" fill="#FFFFFF" opacity="0.95" />
      {league === 4 ? <path d="M22 50h20l-3 5H25l-3-5Z" fill="#FFFFFF" opacity="0.8" /> : null}
    </svg>
  );
}
// Daily bonus hearts for day 1–7 in a row (the server uses the same numbers, see bottle_daily_claim).
// Shown for players who have no photo (the original shows a "NO PHOTO" silhouette).
const NO_PHOTO = "/custom/profile/nophoto.svg";
const DAILY_PRIZES = [2, 3, 5, 7, 10];
// Lite mode (switched on by the game when the phone cannot keep up with a gift storm): gifts stay still pictures instead of animated ones.
let liteGifts = false;
function Gift({ id, className, anim, once, lazy }: { id: string; className?: string; anim?: boolean; once?: string | number; lazy?: boolean }) {
  // "lazy" is for the long gift list: its pictures load when they scroll into view, decode off the main thread and carry no shadow filter (hundreds of filters are slow on weak phones).
  const shadow = lazy ? "" : "drop-shadow-[0_2px_2px_rgba(60,25,0,0.3)]";
  const loadHints = lazy ? ({ loading: "lazy", decoding: "async" } as const) : ({ decoding: "async" } as const);
  const art = useCustomArt();
  const name = id.startsWith("c:") ? id.slice(2) : giftFileName(id);
  // Animated version (public/custom/anim) where the gift sits on the photo or flies.
  // With "once" the animation plays one time and then the gift stands still on its last frame (it never starts again).
  const animFile = anim && !liteGifts ? customFile(art, `anim/${name}`) : null;
  if (animFile && once !== undefined) return <OnceImg src={animFile} freezeKey={once} className={cn("select-none object-contain drop-shadow-[0_2px_2px_rgba(60,25,0,0.3)]", className)} />;
  const custom = animFile || customFile(art, `gifts/${name}`);
  if (custom) return <img src={custom} alt="" aria-hidden="true" draggable={false} {...loadHints} className={cn("select-none object-contain", shadow, className)} />;
  if (id.startsWith("song:")) return <img src={`/custom/orig/${id === "song:video" ? "audio_video_icon" : "audio_music_icon"}.svg`} alt="" aria-hidden="true" draggable={false} className={cn("select-none object-contain", className)} />;
  if (giftEmoji[id]) id = `e:${giftEmoji[id]}`;
  if (!id.startsWith("e:")) return <GiftArt id={id as GiftId} className={className} />;
  return <img src={giftSrc(id.slice(2))} alt="" aria-hidden="true" draggable={false} {...loadHints} className={cn("select-none object-contain", shadow, className)} />;
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
  // Like the original (TableUserView): red lips on the right edge of the photo, 15% from the top, the number of kisses at this table inside.
  return (
    <span className="absolute -right-[2.4cqmin] top-[15%] z-[6] flex h-[3.8cqmin] w-[4.8cqmin] -translate-y-1/2 items-center justify-center bg-contain bg-center bg-no-repeat drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]" style={{ backgroundImage: "url(/custom/gifts/air_kiss1.webp)" /* the original air-kiss gift picture */ }}>
      <span className="relative text-[2cqmin] font-bold tabular-nums leading-none text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.45)]">{count >= 10000 ? `${Math.floor(count / 1000)}k` : count >= 1000 ? `${(Math.floor(count / 100) / 10).toFixed(1)}k` : count}</span>
    </span>
  );
}
const SPIN_SECONDS = 8;
const PILE_MS = 90000;
const ANSWER_SECONDS = 9;
const packs: { hearts: number; price: number; bonus?: number; tag?: "best" | "hit"; art: string }[] = [
  { hearts: 240000, price: 220, bonus: 118, tag: "best", art: "🛒" }, { hearts: 120000, price: 140, bonus: 71, art: "🧰" }, { hearts: 60000, price: 75, bonus: 60, art: "🛢️" },
  { hearts: 30000, price: 45, bonus: 33, tag: "hit", art: "🍯" }, { hearts: 15000, price: 25, art: "👝" }, { hearts: 7500, price: 15, art: "💕" },
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
  const netSig = useRef({ sig: "", at: 0 });
  // Players who chose to hide their birth date and age (privacy setting): their age is not shown at the table.
  const [hideAges, setHideAges] = useState<Record<string, boolean>>({});
  const hideAskedRef = useRef<Map<string, number>>(new Map());
  const players = useMemo<Player[]>(() => {
    const me: Player = { id: "me", name: gameName(user.name), age: 25, female: details.gender === "female", avatar: user.avatar || NO_PHOTO, me: true, zodiac: zodiacOf(details.birthday) };
    if (online) {
      // Every player sees the table the same way: seat N is always at the same place on every screen.
      // A player sits in one seat only: if the list ever holds the same player twice (e.g. an old row next to the new one right after a quick leave and come back), the second one is not drawn, so a photo is never doubled.
      const drawn = new Set<string>();
      return Array.from({ length: 12 }, (_, place): Player => {
        const found = net?.seats.find((seat) => seat.seat === place);
        const row = found && !drawn.has(found.id) ? found : undefined;
        if (row) drawn.add(row.id);
        if (!row) return place === 7 && !net ? me : { id: `empty-${place}`, name: "", age: 0, female: false, avatar: "", empty: true };
        const female = row.gender === "female";
        if (row.id === net?.me) return { ...me, name: me.name || gameName(row.name), age: details.hideAge ? 0 : row.age ?? me.age, female, zodiac: row.zodiac ?? me.zodiac };
        return { id: row.id, name: gameName(row.name) || "?", age: hideAges[row.id] ? 0 : row.age ?? 0, female, avatar: row.avatar || NO_PHOTO, zodiac: row.zodiac };
      });
    }
    const others = bots.map((bot, index) => ({ ...bot, avatar: cartoonAvatar(index + 1, bot.female), zodiac: (index * 5) % 12 }));
    return [...others.slice(0, 7), me, ...others.slice(7)];
  }, [user.name, user.avatar, details.gender, details.birthday, online, net, hideAges, details.hideAge]);
  useEffect(() => {
    if (!online || !net || !supabase) return;
    const nowMs = Date.now();
    const ids = net.seats.map((seat) => seat.id).filter((id) => id !== net.me && nowMs - (hideAskedRef.current.get(id) ?? 0) > 60000);
    if (!ids.length) return;
    ids.forEach((id) => hideAskedRef.current.set(id, nowMs));
    void Promise.resolve(supabase.from("profiles").select("id,hide_age").in("id", ids)).then((res) => {
      if (res?.error && typeof console !== "undefined") console.warn("[hide_age] could not read:", res.error.message);
      const rows = (res?.data ?? []) as { id: string; hide_age?: boolean | null }[];
      if (rows.length) setHideAges((value) => { const next = { ...value }; rows.forEach((row) => { if (row.hide_age) next[row.id] = true; else delete next[row.id]; }); return JSON.stringify(next) === JSON.stringify(value) ? value : next; });
    }).catch(() => ids.forEach((id) => hideAskedRef.current.delete(id)));
  }, [online, net]);
  const seated = players.filter((player) => !player.empty);
  const meIndex = Math.max(0, players.findIndex((player) => player.me));
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
  const [spots, setSpots] = useState<Record<string, Spot[]>>({});
  const [scatters, setScatters] = useState<{ key: number; to: string; names: string[]; dirs: [number, number][] }[]>([]);
  // A gift lands: worn ones go on the head, the rest take their spot; family gifts first burst over the whole photo.
  const landGift = (key: number, toId: string, plan: ReturnType<typeof planLanding>) => startTransition(() => landGiftNow(key, toId, plan));
  const landGiftNow = (key: number, toId: string, plan: ReturnType<typeof planLanding>) => {
    // Three places on a photo: the left corner, the right corner and the middle. A new gift replaces only the gift
    // in its own place; the others stay until a new gift comes to their place.
    // Gifts worn without a spot (stickers) sit in the same places: head/ears on the left, body bottom-right, face in the middle.
    const keepStickers = (value: Record<string, string[]>, place: string) => (value[toId]?.some((gift) => stickerPlace(gift) === place) ? { ...value, [toId]: value[toId].filter((gift) => stickerPlace(gift) !== place) } : value);
    const keepSpots = (value: Record<string, Spot[]>, place: string) => (value[toId]?.some((item) => spotPlace(item) === place) ? { ...value, [toId]: value[toId].filter((item) => spotPlace(item) !== place) } : value);
    if (plan.spot) {
      const spot: Spot = { ...plan.spot, key };
      const place = spotPlace(spot);
      if (spot.kind === "rand") {
        // Earlier random gifts stay for RAND_KEEP_MS (the newest RAND_MAX - 1 of them); a different kind of gift in the middle place is replaced.
        // The newest random gift is never removed by the timer: it stays until the next random gift comes.
        const now = Date.now();
        const stamped: Spot = { ...spot, t: now };
        setSpots((value) => {
          const mine = value[toId] ?? [];
          const others = mine.filter((item) => spotPlace(item) !== place);
          const rands = mine.filter((item) => spotPlace(item) === place && item.kind === "rand" && now - (item.t ?? 0) < RAND_KEEP_MS).slice(-(RAND_MAX - 1));
          return { ...value, [toId]: [...others, ...rands, stamped] };
        });
        window.setTimeout(() => setSpots((value) => {
          const list = value[toId] ?? [];
          const newest = [...list].reverse().find((item) => item.kind === "rand");
          if (newest?.key === key) return value; // the last random gift stays until a new one arrives
          return { ...value, [toId]: list.filter((item) => item.key !== key) };
        }), RAND_KEEP_MS);
      } else {
        setSpots((value) => { const rest = keepSpots(value, place); return { ...rest, [toId]: [...(rest[toId] ?? []), spot] }; });
      }
      setStickers((value) => keepStickers(value, place));
      // Pacifiers only stay on the photo for about forty seconds (twice as long as before).
      if (/^c:nipple/.test(plan.land)) window.setTimeout(() => setSpots((value) => ({ ...value, [toId]: (value[toId] ?? []).filter((item) => item.key !== key) })), 40000);
    } else {
      const place = stickerPlace(plan.land);
      setStickers((value) => { const rest = keepStickers(value, place); return { ...rest, [toId]: [...(rest[toId] ?? []), plan.land] }; });
      setSpots((value) => keepSpots(value, place));
    }
    if (plan.scatter) {
      const dirs = plan.scatter.map((_, n) => { const angle = (n / plan.scatter!.length) * Math.PI * 2 + Math.random() * 0.8; return [Math.cos(angle) * (30 + Math.random() * 14), Math.sin(angle) * (30 + Math.random() * 14)] as [number, number]; });
      setScatters((list) => [...list, { key, to: toId, names: plan.scatter!, dirs }]);
      window.setTimeout(() => setScatters((list) => list.filter((item) => item.key !== key)), 1100);
    }
  };
  // Coming (back) to a table: the gifts that sit on the others' photos are read from the server (not from the other screens) and put in place without flying.
  const restoreGifts = useRef<(list: BottleSeatGift[], me: string) => void>(() => {});
  restoreGifts.current = (list, me) => {
    const newestRand: Record<string, number> = {};
    for (const item of list) if (typeof item.seed === "number" && planLanding(item.gift, item.seed).spot?.kind === "rand") newestRand[item.to] = item.cid;
    list.forEach((item, n) => {
      if (typeof item.seed !== "number") return;
      const plan = planLanding(item.gift, item.seed);
      if (plan.spot?.kind === "rand" && item.age > RAND_KEEP_MS && newestRand[item.to] !== item.cid) return; // old random gifts have faded away, the newest stays
      if (/^c:nipple/.test(plan.land) && item.age > 40000) return; // a pacifier stays about 40 seconds
      landGift(-(2000000 + n), item.to === me ? "me" : item.to, { ...plan, scatter: null });
    });
  };
  // Gifts that just arrived lie scattered over the photo for a while (PILE_MS), then fade away.
  const [piles, setPiles] = useState<Record<string, { key: number; gift: string; x: number; y: number; r: number; s: number; at: number }[]>>({});
  const [pileNow, setPileNow] = useState(0);
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
  const [lines, setLines] = useState<Line[]>([{ id: 1, from: "b3", text: smallTalk[0] }, { id: 2, from: "b6", to: "b1" }]);
  const [draft, setDraft] = useState("");
  // Price of a gift by its id (used by the "send it back" button in the chat).
  const priceOf = (gift: string) => gift.startsWith("c:") ? GIFT_PRICES[gift.slice(2)] ?? customPrice(gift.slice(2)) : [...giftChoices, ...lockedGifts].find(([id]) => id === gift)?.[1] ?? 0;
  // A small gem next to the name in the chat for players with a frame or the premium pass.
  const decorOf = (id: string): string | null => { const seat = net?.seats.find((item) => item.id === (id === "me" ? net.me : id)); if (!seat) return null; const frame = seat.frame ?? 0; return frameStone(frame) ?? (frame > 0 || seat.pass ? "💎" : null); };
  // Long press / double click on a chat message opens a small menu (reply, translate, report).
  const [lineMenu, setLineMenu] = useState<number | null>(null);
  const pressTimer = useRef(0);
  // Changes with every table: gifts still in the air when you move to another table never land there (the new table starts clean).
  const tableGen = useRef(0);
  // How many gifts are in the air right now (kept in step with the flying list below).
  const airborne = useRef(0);
  const showsRef = useRef(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // The phone video can be dragged by the avatar and resized from its lower-left corner.
  // On the phone the video and music windows keep one small size (they can still be moved, not resized).
  const MINI_VIDEO_W = 170;
  const MINI_MUSIC_W = 100; // the phone music card (MP3 / song player) is about half its old size: it took too much of the chat
  const [mini, setMini] = useState<{ x: number | null; y: number; w: number }>({ x: null, y: wide ? 8 : 23, w: 127 }) /* on a phone the video starts about 4 mm lower, so the smiley shop at the top stays visible */;
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
      else { const w = Math.min(Math.max(100, start.w - dx), outer.width); setMini((value) => ({ ...value, w, x: Math.max(0, start.x + start.w - w) })); }
    };
    const stop = () => { setMiniBusy(false); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  }
  // "+" mode: choose several receivers on the table, then every gift goes to all of them.
  const [chosen, setChosen] = useState<string[]>([]);
  const [songMany, setSongMany] = useState<number[]>([]);
  const nameColors = useNameColors();
  const [flying, setFlying] = useState<{ key: number; gift: string; from: number; to: number; moved: boolean; ms: number; rot?: number; fixed?: boolean; mine?: boolean; still?: boolean; toId?: string; look?: string; t0?: number; tx: number; ty: number; end: number; base: number }[]>([]);
  // When a receiver leaves the table (or moves to another one), the gifts flying to them stop; they never land on an empty seat.
  const playersRef = useRef(players);
  playersRef.current = players;
  useEffect(() => { setFlying((list) => { const next = list.filter((item) => !item.toId || players[item.to]?.id === item.toId); return next.length === list.length ? list : next; }); }, [players]);
  useEffect(() => { airborne.current = flying.length; }, [flying.length]);
  // Safety net: a gift that is still "in the air" long after its flight should have ended (tab was in the background, a timer was lost) is removed.
  useEffect(() => {
    if (!flying.length) return;
    const timer = window.setInterval(() => setFlying((list) => { const now = performance.now(); const next = list.filter((item) => item.t0 === undefined || now - item.t0 < item.ms + 6000); return next.length === list.length ? list : next; }), 3000);
    return () => window.clearInterval(timer);
  }, [flying.length]);
  // Somebody left the table: their gifts go with them (if they come back they start clean); everybody else keeps theirs.
  const seatedIds = players.map((player) => player.id).join(",");
  useEffect(() => {
    const here = new Set(seatedIds.split(","));
    const prune = <T,>(value: Record<string, T[]>) => (Object.keys(value).some((id) => !here.has(id)) ? Object.fromEntries(Object.entries(value).filter(([id]) => here.has(id))) : value);
    setSpots(prune);
    setStickers(prune);
  }, [seatedIds]);
  // Somebody sits down at the table: their photo pops in with a ring of light, on their own screen and on everybody else's.
  // When I come in myself, only my own photo does it; the people already there do not all pop again.
  const [arrivals, setArrivals] = useState<Record<string, number>>({});
  // Bonus market effect: when somebody sits down, everybody at the table asks the database whether they own the Enigma effect, and plays it over their photo.
  const [seatFx, setSeatFx] = useState<Record<string, number>>({});
  const fxCache = useRef<Record<string, { effect: string | null; at: number }>>({});
  const fxPlayed = useRef<Record<string, number>>({});
  const playEntrance = (ids: string[]) => {
    if (!online) return;
    for (const id of ids) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) continue;
      const known = fxCache.current[id];
      // The entrance effect plays once per arrival (not again within 30 s when the seats are shuffled) and is removed from the seat when it is over, so a dark layer never stays on a photo.
      const show = (effect: string | null) => {
        if (effect !== "enigma") return;
        const now = Date.now();
        if (now - (fxPlayed.current[id] ?? 0) < 30000) return;
        fxPlayed.current[id] = now;
        window.setTimeout(() => {
          const at = Date.now();
          setSeatFx((value) => ({ ...value, [id]: at }));
          window.setTimeout(() => setSeatFx((value) => { if (value[id] !== at) return value; const rest = { ...value }; delete rest[id]; return rest; }), 4200);
        }, 1900);
      };
      if (known && Date.now() - known.at < 60000) { show(known.effect); continue; }
      void bottleEffectOf(id).then((effect) => { fxCache.current[id] = { effect: effect ?? null, at: Date.now() }; show(effect ?? null); });
    }
  };
  const previewEnigma = () => {
    const me = players.find((player) => player.me && !player.empty);
    setPanel(null);
    if (me) window.setTimeout(() => setSeatFx((value) => ({ ...value, [me.id]: Date.now() })), 400);
  };
  const seatMemory = useRef<{ table: unknown; ids: Set<string> } | null>(null);
  useEffect(() => {
    const ids = new Set(players.filter((player) => !player.empty).map((player) => player.id));
    const table = net?.table ?? null;
    const before = seatMemory.current;
    seatMemory.current = { table, ids };
    const fresh = !before || before.table !== table ? players.filter((player) => player.me && !player.empty).map((player) => player.id) : [...ids].filter((id) => !before.ids.has(id));
    if (fresh.length) { const now = Date.now(); setArrivals((value) => ({ ...value, ...Object.fromEntries(fresh.map((id) => [id, now])) })); playEntrance(fresh); }
  }, [seatedIds]); // eslint-disable-line react-hooks/exhaustive-deps
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
  // Admins: everything in the game is open for them (to test it), and their seat and card look different.
  const iAmAdmin = useIsAdmin() === true;
  // The cherry cocktail is hidden for accounts the admin did not allow (the server refuses it too).
  const [giftAllow, setGiftAllow] = useState<string[]>([]);
  useEffect(() => {
    if (!online || !net?.me) return;
    let alive = true;
    void bottleGiftAllow().then((list) => { if (alive && Array.isArray(list)) setGiftAllow(list); });
    return () => { alive = false; };
  }, [online, net?.me]);
  const giftHidden = (name: string) => name === "cherry" && !iAmAdmin && online && !giftAllow.includes("c:cherry");

  const [adminIds, setAdminIds] = useState<string[]>([]);
  useEffect(() => { if (online) void bottleAdminIds().then((ids) => { if (Array.isArray(ids)) setAdminIds(ids); }); }, [online]);
  const [doubleUntil, setDoubleUntil] = useState(0);
  const doubleRef = useRef(0);
  const jumpRef = useRef(false);
  const [jump, setJump] = useState(false);
  const [muted, setMutedIds] = useState<string[]>([]);
  const [flagMenu, setFlagMenu] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const meTap = useRef(0);
  const [songFor, setSongFor] = useState<number | null>(null);
  const [songTab, setSongTab] = useState<"popular" | "fav" | "recent" | "search" | "mp3">("popular");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackState, setTrackState] = useState<"idle" | "loading" | "nokey" | "fail">("idle");
  const [trackWhy, setTrackWhy] = useState("");
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
  type AdmireNote = { by?: string; avatar?: string; target?: string; old?: string | null; amount?: number; self?: boolean };
  const [lostToast, setLostToast] = useState<AdmireNote | null>(null);
  const [boughtToast, setBoughtToast] = useState<AdmireNote | null>(null);
  useEffect(() => { if (!boughtToast) return; const timer = window.setTimeout(() => setBoughtToast(null), 9000); return () => window.clearTimeout(timer); }, [boughtToast]);
  useEffect(() => { if (!lostToast) return; const timer = window.setTimeout(() => setLostToast(null), 9000); return () => window.clearTimeout(timer); }, [lostToast]);
  const [dmDraft, setDmDraft] = useState("");
  const [dms, setDms] = useState<Record<string, { mine: boolean; text: string }[]>>({});
  const [cardNote, setCardNote] = useState<string | null>(null);
  const [suitors, setSuitors] = useState<Record<string, { by: string; amount: number }>>(() => Object.fromEntries(bots.map((bot, index) => [bot.id, { by: bots[(index + 3) % bots.length].id, amount: 4 + ((index * 37) % 40) }])));
  const [volume, setVolumeLevel] = useState(80);
  const [music, setMusic] = useState(60);
  const [accept, setAccept] = useState(true);
  const [panel, setPanel] = useState<"gestures" | "settings" | "top" | "rules" | "shop" | "menu" | "vip" | "bottles" | "frames" | "achievements" | "boosters" | "wheel" | "chances" | "tables" | "rooms" | "active" | "invite" | "compliments" | "kick" | "pass" | "league" | "market" | "smiles" | null>(null);
  // Panels drop down from the top like a hanging sign and go back up when closed.
  const [closing, setClosing] = useState(false);
  const closePanel = () => { if (closing) return; setClosing(true); window.setTimeout(() => { setPanel(null); setClosing(false); }, 260); };
  const [passData, setPassData] = useState<PassData | null>(null);
  const [passNote, setPassNote] = useState<string | null>(null);
  const [kickFor, setKickFor] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [kickNote, setKickNote] = useState<string | null>(null);
  const [kickHelp, setKickHelp] = useState(false);
  // Kicking costs hearts; the kicked player can buy themselves free for the same price.
  const [kickPrice, setKickPrice] = useState(10);
  useEffect(() => { if (online) void bottleKickPrice().then((value) => { if (typeof value === "number" && value >= 0) setKickPrice(value); }); }, [online]);
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
  // Smiley balance: a smiley costs one from the balance; packs are bought with hearts.
  const [smiles, setSmiles] = useState(0);
  const smileText = useMemo(() => {
    const all: Record<string, { title: string; balance: string; none: string; back: string; buy: string }> = {
      az: { title: "Smayl mağazası", balance: "Smayl balansı", none: "Smaylın qalmayıb. Mağazadan smayl al.", back: "Geri", buy: "Al" },
      tr: { title: "Emoji mağazası", balance: "Emoji bakiyesi", none: "Emojin kalmadı. Mağazadan emoji al.", back: "Geri", buy: "Al" },
      ru: { title: "Магазин смайлов", balance: "Баланс смайлов", none: "Смайлы закончились. Купи в магазине.", back: "Назад", buy: "Купить" },
      en: { title: "Smiley shop", balance: "Smiley balance", none: "No smileys left. Buy some in the shop.", back: "Back", buy: "Buy" },
      ka: { title: "სმაილების მაღაზია", balance: "სმაილების ბალანსი", none: "სმაილები ამოიწურა. იყიდე მაღაზიაში.", back: "უკან", buy: "ყიდვა" },
    };
    return all[locale] ?? all.en;
  }, [locale]);
  useEffect(() => {
    if (!online || !net?.me || (panel !== "gestures" && panel !== "smiles" && smiles !== 0)) return;
    let alive = true;
    void bottleSmiles().then((value) => { if (alive && typeof value === "number") setSmiles(value); });
    return () => { alive = false; };
  }, [online, net?.me, panel]); // eslint-disable-line react-hooks/exhaustive-deps
  // The balance sign: tapping it opens the smiley shop (the shop never opens by itself).
  const smileChip = (
    <button type="button" onClick={(event) => { event.stopPropagation(); setPayNote(false); setPanel("smiles"); }} aria-label={`${smileText.balance}: ${smiles}`} title={smileText.title} className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-[#FFF4E5] pl-2 pr-1 text-sm font-bold tabular-nums text-[#3F3F46] hover:brightness-95">😀 {smiles}<span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8CC63F] text-white">+</span></button>
  );
  async function buySmiles(pack: number, price: number) {
    if (heartsRef.current < price) return setPayNote(true);
    if (online) {
      const result = await bottleBuySmiles(pack);
      if (!result) return setPayNote(true);
      heartsRef.current = result.hearts;
      setHearts(result.hearts);
      setSmiles(result.smiles);
    } else {
      heartsRef.current -= price;
      setHearts(heartsRef.current);
      setSmiles((value) => value + pack);
    }
    setPayNote(false);
    setFrameNote(null);
    setPanel("gestures");
  }
  const [wheelTurn, setWheelTurn] = useState(0);
  const [wheelBusy, setWheelBusy] = useState(false);
  const [wheelPrize, setWheelPrize] = useState<number | null>(null);
  const [mySmiles, setMySmiles] = useState(0);
  const wheelLock = useRef(false);
  const [topKind, setTopKind] = useState<"help" | "kisses" | "songs" | "dear" | "influence" | "smiles">("kisses");
  const [topPeriod, setTopPeriod] = useState<"all" | "month" | "week" | "day">("all");
  const [topHelp, setTopHelp] = useState(false);
  const [topMenu, setTopMenu] = useState(false);
  const topSwipe = useRef(0);
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
  // Bank packs are paid from the site balance (topped up on the site's market page).
  const [packNote, setPackNote] = useState<{ kind: "wait" | "ok" | "balance" | "fail"; n?: number; need?: number } | null>(null);
  // After a purchase the received bonus is shown on a screen with an OK button; it closes (and the profile is reloaded) by itself after a few seconds even if OK is not pressed.
  const closePackDone = useCallback(() => {
    setPackNote((value) => (value?.kind === "ok" ? null : value));
    pullRef.current();
    void refreshGifts();
  }, []);
  useEffect(() => {
    if (packNote?.kind !== "ok") return;
    const timer = window.setTimeout(closePackDone, 7000);
    return () => window.clearTimeout(timer);
  }, [packNote, closePackDone]);
  async function buyHeartPack(pack: { hearts: number; price: number }) {
    if (!online) return setPayNote(true);
    setPayNote(false);
    setPackNote({ kind: "wait" });
    const result = await bottleBuyHearts(pack.hearts);
    if (result && typeof result.hearts === "number") { heartsRef.current = result.hearts; setHearts(result.hearts); setPackNote({ kind: "ok", n: pack.hearts }); }
    else if (result?.error === "balance") setPackNote({ kind: "balance", need: result.need });
    else setPackNote({ kind: "fail" });
  }
  const [tableNo, setTableNo] = useState(60);
  const [copied, setCopied] = useState(false);
  const [waitNote, setWaitNote] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [hearts, setHearts] = useState(12);
  // Won hearts fly from the table into the balance (like the original), and the balance heart pulses.
  const balanceRef = useRef<HTMLButtonElement>(null);
  const heartsSeen = useRef<{ value: number; at: number } | null>(null);
  const [heartFlights, setHeartFlights] = useState<{ key: number; x: number; y: number; dx: number; dy: number; delay: number }[]>([]);
  const [balancePulse, setBalancePulse] = useState(0);
  useEffect(() => {
    const seen = heartsSeen.current;
    heartsSeen.current = { value: hearts, at: seen?.at ?? Date.now() };
    if (!seen || hearts <= seen.value || Date.now() - seen.at < 4000) return;
    const button = balanceRef.current;
    const table = button?.parentElement?.parentElement;
    if (!button || !table) return;
    const to = button.getBoundingClientRect();
    const box = table.getBoundingClientRect();
    const x = box.left + box.width / 2, y = box.top + box.height / 2;
    const count = Math.min(5, Math.max(1, Math.ceil((hearts - seen.value) / 10)));
    const base = Date.now();
    const list = Array.from({ length: count }, (_, n) => ({ key: base + n, x: x + (n - (count - 1) / 2) * 18, y, dx: to.left + to.width / 2 - x - (n - (count - 1) / 2) * 18, dy: to.top + to.height / 2 - y, delay: n * 120 }));
    setHeartFlights((current) => [...current, ...list]);
    window.setTimeout(() => setBalancePulse(base), 1300);
    window.setTimeout(() => setHeartFlights((current) => current.filter((item) => item.key < base || item.key >= base + count)), 2200);
  }, [hearts]);
  const [video, setVideo] = useState<string | null>(null);
  // The site's own music player pauses while the game is open, so two songs do not play at once.
  useEffect(() => siteMusic.pause(), []);
  // A call (private chat) silences the game: the table's song pauses and plays on when the call ends.
  useEffect(() => {
    let paused = false;
    const onCall = (event: Event) => {
      const active = Boolean((event as CustomEvent<{ active: boolean }>).detail?.active);
      const node = audioRef.current;
      if (active) {
        paused = true;
        if (node && !node.paused) node.pause();
        ytCall("pauseVideo");
      } else if (paused) {
        paused = false;
        if (node) void node.play().catch(() => {});
        ytCall("playVideo");
      }
    };
    window.addEventListener("nudepart-call", onCall);
    return () => window.removeEventListener("nudepart-call", onCall);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // iOS: iki dəfə tez toxunanda Safari ekranı yaxınlaşdırır. İkinci toxunuşda yaxınlaşmanı dayandırıb kliki özümüz veririk.
  useEffect(() => {
    let last = 0;
    const stop = (event: TouchEvent) => {
      const now = Date.now();
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable]");
      if (target?.closest("[data-bottle-root]") && !typing && event.changedTouches.length === 1 && now - last < 400) {
        event.preventDefault();
        (target?.closest("button, a, [role=button], label") as HTMLElement | null ?? target)?.click();
      }
      last = now;
    };
    document.addEventListener("touchend", stop, { passive: false });
    // İki barmaqla yaxınlaşdırma (pinch) oyunda bağlıdır: iOS və Android-də oyun çərçivəsi eyni ölçüdə qalır.
    const gesture = (event: Event) => event.preventDefault();
    const pinch = (event: TouchEvent) => { if (event.touches.length > 1) event.preventDefault(); };
    ["gesturestart", "gesturechange", "gestureend"].forEach((name) => document.addEventListener(name, gesture, { passive: false }));
    document.addEventListener("touchstart", pinch, { passive: false });
    document.addEventListener("touchmove", pinch, { passive: false });
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const before = meta?.getAttribute("content") ?? null;
    meta?.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
    return () => {
      document.removeEventListener("touchend", stop);
      ["gesturestart", "gesturechange", "gestureend"].forEach((name) => document.removeEventListener(name, gesture));
      document.removeEventListener("touchstart", pinch);
      document.removeEventListener("touchmove", pinch);
      if (meta && before !== null) meta.setAttribute("content", before);
    };
  }, []);
  // Songs from the MP3 tab play in "music mode": a small square player with the title, no big video.
  const [musicMode, setMusicMode] = useState(false);
  const [tune, setTune] = useState({ playing: false, cur: 0, dur: 0 });
  useEffect(() => {
    setTune({ playing: false, cur: 0, dur: 0 });
    if (!video) return;
    const hear = (event: MessageEvent) => {
      if (typeof event.origin !== "string" || !event.origin.includes("youtube")) return;
      try {
        const data = JSON.parse(String(event.data)) as { event?: string; info?: { currentTime?: number; duration?: number; playerState?: number } };
        const info = data.info;
        if (data.event !== "infoDelivery" || !info) return;
        if (info.playerState === 0) { setVideo(null); return; } // the song is over: the player closes and its line leaves the chat
        setTune((v) => ({ playing: info.playerState === undefined ? v.playing : info.playerState === 1, cur: info.currentTime ?? v.cur, dur: info.duration || v.dur }));
      } catch { /* not a player message */ }
    };
    window.addEventListener("message", hear);
    return () => window.removeEventListener("message", hear);
  }, [video, musicMode]);
  // The player cannot be closed by hand any more: it closes when the song is over, on every screen, and stays shut until somebody orders a new song.
  // Safety net: if the YouTube player never reports the end, it still closes a few seconds after the song's length.
  useEffect(() => {
    if (!video || !tune.dur || !tune.playing) return;
    const wait = Math.max(0, tune.dur - tune.cur) + 4;
    const timer = window.setTimeout(() => setVideo((current) => (current === video ? null : current)), wait * 1000);
    return () => window.clearTimeout(timer);
  }, [video, tune.dur, tune.cur, tune.playing]);
  const lastSongLine = lines.filter((line) => line.song).at(-1)?.id;
  const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const [videoTitle, setVideoTitle] = useState("");
  const [badLink, setBadLink] = useState(false);
  const lineId = useRef(3);
  const listRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLInputElement>(null);
  // The smiley button next to the chat line puts ordinary emojis into the message (the game smileys open from your own photo).
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiCat, setEmojiCat] = useState(0);
  // Chat lines are a low-priority update: in a gift storm the page can draw the flying gifts first and the list right after.
  const say = useCallback((line: Omit<Line, "id">) => { const id = lineId.current++; startTransition(() => setLines((list) => mergeLines(list, [{ ...line, id }]))); }, []);
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
  const syncTable = useRef<number | null>(null);
  const lastPullAt = useRef(0);
  // The game stops talking to the server after 10 minutes without a touch, or when the same game opens in another tab.
  const stopped = useRef(false);
  // One game per account: this page's key; when the server holds another page's key, this page stops.
  const session = useRef({ token: Math.random().toString(36).slice(2) + Date.now().toString(36), claimed: false });
  const stopGame = useRef<(why: "idle" | "tab") => void>(() => {});
  const [gone, setGone] = useState<null | "idle" | "tab">(null);
  const [offline, setOffline] = useState(false);
  const failedPulls = useRef(0);
  const lastTouch = useRef(0);
  const announce = useRef<() => void>(() => {});
  // "Reconnect" brings this page back into the game in place (no reload): it takes the session over and the other page stops.
  function resumeGame() {
    session.current = { token: Math.random().toString(36).slice(2) + Date.now().toString(36), claimed: false };
    lastTouch.current = Date.now();
    stopped.current = false;
    setGone(null);
    announce.current();
    void bottleClaim(session.current.token).then(() => { session.current.claimed = true; pullRef.current(); });
  }
  const [mentionToast, setMentionToast] = useState<string | null>(null);
  useEffect(() => { if (!mentionToast) return; const timer = window.setTimeout(() => setMentionToast(null), 5000); return () => window.clearTimeout(timer); }, [mentionToast]);
  useEffect(() => {
    if (!online) return;
    lastTouch.current = Date.now();
    const touch = () => { lastTouch.current = Date.now(); };
    const stop = (why: "idle" | "tab") => { if (stopped.current) return; stopped.current = true; setGone(why); if (why === "idle") void bottleLeave(); };
    stopGame.current = stop;
    void bottleClaim(session.current.token).then(() => { session.current.claimed = true; });
    const timer = window.setInterval(() => { if (!stopped.current && Date.now() - lastTouch.current > 10 * 60 * 1000) stop("idle"); }, 20000);
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((name) => window.addEventListener(name, touch, { passive: true }));
    let channel: BroadcastChannel | null = null;
    const me = Math.random().toString(36).slice(2);
    try {
      channel = new BroadcastChannel("bottle-game");
      channel.onmessage = (event) => { if (event.data?.open && event.data.open !== me) stop("tab"); };
      channel.postMessage({ open: me });
      announce.current = () => { try { channel?.postMessage({ open: me }); } catch { /* closed */ } };
    } catch { /* old browser */ }
    return () => { window.clearInterval(timer); events.forEach((name) => window.removeEventListener(name, touch)); channel?.close(); };
  }, [online]);
  const pullRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!online) return;
    let alive = true;
    let busy = false;
    const pull = async () => {
      if (busy || stopped.current) return;
      busy = true;
      try {
        let data = await bottleSync(lastChat.current);
        let rejoined = false;
        if (!data) {
          rejoined = true;
          // Lost the seat (weak internet, reload): first try the same table again, waiting in its queue when it is full.
          const back = Date.now() - backCancel.current < 8000 ? null : await bottleRejoin();
          if (!alive) return;
          if (back?.full && back.table) { backWait.current = true; setWaitFor((value) => (value && value.table === back.table && value.position === (back.position ?? 1) && value.back ? value : { table: back.table!, position: back.position ?? 1, back: true })); setPanel((value) => value ?? "tables"); return; }
          if (!back?.table) await bottleJoin();
          if (backWait.current) { backWait.current = false; setWaitFor(null); setPanel((value) => (value === "tables" ? null : value)); }
          data = await bottleSync(lastChat.current);
        }
        if (!alive) return;
        if (!data) { failedPulls.current += 1; if (failedPulls.current >= 4) setOffline(true); return; }
        failedPulls.current = 0;
        setOffline(false);
        if (session.current.claimed && data.session && data.session !== session.current.token) { stopGame.current("tab"); return; }
        // Coming (back) into a room — first load, another table, a re-join or a long pause — starts clean:
        // gifts sent before you came in do not fly in and do not sit on the photos.
        const entered = !primed.current || syncTable.current !== data.table;
        const first = entered || rejoined || Date.now() - lastPullAt.current > 15000;
        primed.current = true;
        syncTable.current = data.table;
        lastPullAt.current = Date.now();
        // Only a real entry clears the photos; a short connection drop or pause keeps the gifts until a new one comes.
        if (entered) { setSpots({}); setStickers({}); }
        const all = data.chat.filter((item) => item.id > lastChat.current && item.kind !== "wheel");
        const who = (id: string | null) => (id === data!.me ? "me" : id ?? "");
        // Gifts from other players fly across the table on every screen; my own gifts were already shown when I sent them.
        const gifts = all.filter((item) => item.kind === "gift" && item.from !== data!.me && !(item.seed && seenSeeds.current.has(item.seed)));
        for (const item of gifts) if (item.seed) seenSeeds.current.add(item.seed);
        if (!first) gifts.forEach((item, order) => window.setTimeout(() => remoteGift.current(who(item.from), who(item.to), item.body ?? "", gifts.length > 1 ? 1800 : 3600, item.seed ?? item.id), order * Math.min(150, 900 / gifts.length))); // a big batch still starts within a second
        for (const seat of data.seats) names.current[seat.id] = { name: gameName(seat.name) || "?", avatar: seat.avatar ?? "" };
        const nameOf = (id: string | null) => names.current[id ?? ""]?.name ?? "?"; // own name too, not "you"
        if (!first) all.filter((item) => item.kind === "compliment" && item.to === data!.me).forEach((item) => setComplimentIn({ name: names.current[item.from ?? ""]?.name ?? "?", avatar: names.current[item.from ?? ""]?.avatar || NO_PHOTO, kind: Number(item.body) || 1 }));
        if (!first && all.some((item) => item.kind === "kick" && item.to === data!.me)) setKickedToast(true);
        // Somebody wrote to me by name ("Aylin, ..."): a ding and a note.
        if (!first) {
          const mine = (names.current[data.me]?.name ?? "").toLowerCase();
          const mention = mine ? all.find((item) => item.kind === "text" && item.from !== data!.me && (item.body ?? "").toLowerCase().startsWith(mine)) : undefined;
          if (mention) { playPing(); setMentionToast(names.current[mention.from ?? ""]?.name ?? "?"); }
        }
        if (!first) all.filter((item) => item.kind === "gesture" && item.from !== data!.me).forEach((item) => showSeatGesture(who(item.from), item.body ?? ""));
        if (!first) all.filter((item) => item.kind === "booster" && item.from !== data!.me).forEach((item) => showBoostRef.current(item.body === "refuse_slap" ? "refuse_slap" : "kiss_fire", who(item.from)));
        if (!first) all.filter((item) => item.kind === "admire_lost" && item.to === data!.me).forEach((item) => { try { setLostToast(JSON.parse(item.body ?? "{}") as AdmireNote); } catch { /* bad body */ } });
        if (!first) all.filter((item) => item.kind === "admire" && item.to === data!.me && item.from !== data!.me).forEach((item) => { try { setBoughtToast(JSON.parse(item.body ?? "{}") as AdmireNote); } catch { /* bad body */ } });
        // Coming (back) into a table the chat starts empty: what was said before (even my own old lines) is not loaded again. Only those who stay in the room keep their chat.
        const fresh = entered ? [] : all.filter((item) => item.kind !== "compliment" && (item.kind !== "admire_lost" || item.to === data!.me) && (item.kind !== "gift" || (first && item.from !== data!.me)));
        if (all.length) lastChat.current = all[all.length - 1].id;
        if (fresh.length) {
          setLines((list) => mergeLines(list.slice(-CHAT_KEEP), fresh.map((item) => (item.kind === "kiss" ? { id: item.id, from: who(item.from), to: who(item.to) } : item.kind === "gift" ? { id: item.id, from: who(item.from), to: who(item.to), gift: item.body ?? "" } : item.kind === "admire" || item.kind === "admire_lost" ? { id: item.id, from: who(item.from), to: item.kind === "admire" ? who(item.to) : undefined, admire: { ...(() => { try { return JSON.parse(item.body ?? "{}") as AdmireNote; } catch { return {}; } })(), lost: item.kind === "admire_lost" } } : item.kind === "song" ? { id: item.id, from: who(item.from), to: item.to ? who(item.to) : undefined, song: item.body || "♪" } : item.kind === "kick" || item.kind === "saved" || item.kind === "kicked" ? { id: item.id, from: who(item.from), event: { kind: item.kind, a: nameOf(item.from), b: nameOf(item.to) } } : item.kind === "gesture" ? { id: item.id, from: who(item.from), gesture: item.body ?? "" } : item.kind === "booster" ? { id: item.id, from: who(item.from), boost: { kind: item.body === "refuse_slap" ? "refuse_slap" : "kiss_fire", a: nameOf(item.from), b: nameOf(item.to) } } : item.kind === "bottle" ? { id: item.id, from: who(item.from), bottle: { a: Number((item.body ?? "0:0").split(":")[0]) || 0, b: Number((item.body ?? "0:0").split(":")[1]) || 0 } } : { id: item.id, from: who(item.from), text: item.body ?? "" }))).slice(-80));
        }
        // Nothing changed and nothing counts down: skip the full re-render (the clock is refreshed at least every 4 seconds).
        const sig = JSON.stringify({ ...data, now: 0 });
        const counting = data.phase !== "waiting" || Boolean(data.track) || data.seats.some((seat) => Boolean((seat as { kicked?: unknown }).kicked));
        if (entered || counting || sig !== netSig.current.sig || Date.now() - netSig.current.at > 4000) { netSig.current = { sig, at: Date.now() }; setNet(data); }
        if (entered) {
          const tableAtEntry = data.table;
          void bottleTableGifts(lastChat.current).then((list) => { if (list && alive && syncTable.current === tableAtEntry) restoreGifts.current(list, data!.me); });
          // Coming (back) into a table: the last 20 chat rows (messages, songs, who gave whom a gift) are shown; a gift storm counts as one row.
          const meAtEntry = data.me;
          void Promise.resolve(supabase?.rpc("bottle_chat_history", { p_limit: 300 })).then(async (res) => {
            const rows = (res?.data ?? []) as { id: number; from: string | null; to: string | null; kind: string; body: string | null }[];
            if (!alive || syncTable.current !== tableAtEntry || !Array.isArray(rows) || !rows.length) return;
            // People who already left: their name and photo are read so their lines can be shown.
            const unknown = Array.from(new Set(rows.flatMap((item) => [item.from, item.to]).filter((id): id is string => typeof id === "string" && id !== "" && id !== meAtEntry && !names.current[id])));
            if (unknown.length) {
              try {
                const found = await supabase?.from("profiles").select("id,name,avatar_url").in("id", unknown);
                for (const row of (found?.data ?? []) as { id: string; name: string | null; avatar_url: string | null }[]) if (!names.current[row.id]) names.current[row.id] = { name: gameName(row.name) || "?", avatar: row.avatar_url ?? "" };
              } catch { /* names stay unknown */ }
              if (!alive || syncTable.current !== tableAtEntry) return;
            }
            const asMe = (id: string | null) => (id === meAtEntry ? "me" : id ?? "");
            const raw: Line[] = rows.map((item) => (item.kind === "song" ? { id: item.id, from: asMe(item.from), to: item.to ? asMe(item.to) : undefined, song: item.body || "♪" } : item.kind === "gift" && item.to ? { id: item.id, from: asMe(item.from), to: asMe(item.to), gift: item.body ?? "" } : item.kind === "kiss" && item.to ? { id: item.id, from: asMe(item.from), to: asMe(item.to) } : { id: item.id, from: asMe(item.from), text: item.body ?? "" }));
            // A gift storm is one row with a count, so the last 20 rows after merging still reach back to the earlier talk.
            const older = mergeLines([], raw).slice(-20);
            setLines((list) => { const have = new Set(list.map((line) => line.id)); const fresh = older.filter((line) => !have.has(line.id)); return fresh.length ? mergeLines(fresh, list) : list; });
          }).catch(() => undefined);
        }
      } finally {
        busy = false;
      }
    };
    pullRef.current = () => void pull();
    setLines([]);
    void pull();
    // A hidden tab asks only every 5 seconds (enough to keep the seat), a visible one every second.
    let hiddenTick = 0;
    const timer = window.setInterval(() => { if (document.hidden && ++hiddenTick % 5) return; void pull(); }, 1000);
    const bye = () => void bottleLeave();
    window.addEventListener("pagehide", bye);
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener("pagehide", bye); void bottleLeave(); };
  }, [online]);
  // A song someone put on plays for the whole table (a song older than 5 minutes is not started for newcomers).
  const trackAt = useRef(0);
  // The "no connection" screen is up (another page took the game over, idle, or the net is down): the song stops here too, no hidden video keeps loading.
  useEffect(() => {
    if (!gone && !offline) return;
    trackAt.current = 0;
    setVideo(null);
    setAudio(null);
  }, [gone, offline]);
  // Everybody hears the same moment of the song: a newcomer starts where the song is now, not from the beginning.
  const songClock = useRef({ pos: 0, at: 0 });
  const songNow = () => songClock.current.pos + (Date.now() - songClock.current.at) / 1000;
  const [djPics, setDjPics] = useState<Record<string, string>>({});
  const track = net?.track ?? null;
  // The round photo in the music player shows whoever put the current song on (not the viewer).
  const songByAvatar = (() => {
    const by = track?.by;
    if (!by || by === net?.me) return players[meIndex]?.avatar || NO_PHOTO;
    const seat = net?.seats.find((item) => item.id === by);
    // Still shown when the one who put the song on has left the table: the picture comes from the profile.
    return seat?.avatar || players.find((player) => player.id === by)?.avatar || names.current[by]?.avatar || djPics[by] || NO_PHOTO;
  })();
  useEffect(() => {
    const by = track?.by;
    if (!by || by === net?.me || djPics[by] || net?.seats.some((item) => item.id === by) || names.current[by]?.avatar) return;
    void Promise.resolve(supabase?.from("profiles").select("avatar_url").eq("id", by).maybeSingle()).then((res) => {
      const url = (res?.data as { avatar_url?: string | null } | null)?.avatar_url;
      if (url) setDjPics((value) => ({ ...value, [by]: url }));
    }).catch(() => undefined);
  }, [track?.by, net, djPics]);
  // Nobody left at the table: the server clears the song, here the player closes too.
  useEffect(() => {
    if (!online || !net || net.track || trackAt.current === 0) return;
    trackAt.current = 0;
    setVideo(null);
    setAudio(null);
  }, [online, net]);
  useEffect(() => {
    if (!track || !net || track.at === trackAt.current || (track.by !== net.me && !net.seats.some((seat) => seat.id === net.me))) return;
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
  // Once per page load (and the server skips the same IP written again within 6 hours) the server writes down the IP of this player for security.
  const ipLogged = useRef(false);
  useEffect(() => { if (online && myId && !ipLogged.current) { ipLogged.current = true; void bottleLogIp("join"); } }, [online, myId]);
  // Admins only: the IPs a player came from, and which other accounts used the same IPs (the server answers only to admins).
  const [ipView, setIpView] = useState<{ name: string; loading: boolean; rows: BottleIpRow[]; others: Record<string, string[]> } | null>(null);
  const openIp = async (name: string, id: string) => {
    setIpView({ name, loading: true, rows: [], others: {} });
    const rows = (await bottleAdminIpLookup(id, null)) ?? [];
    const others: Record<string, string[]> = {};
    for (const ip of [...new Set(rows.map((row) => row.ip))].slice(0, 5)) {
      const same = (await bottleAdminIpLookup(null, ip)) ?? [];
      others[ip] = [...new Set(same.filter((row) => row.user_id !== id).map((row) => row.name ?? row.user_id.slice(0, 8)))];
    }
    setIpView({ name, loading: false, rows, others });
  };
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
    setDmToast({ id: fresh.userId, name: gameName(fresh.person.user.name), avatar: fresh.person.user.avatar });
  }, [chats, online, dm]);
  useEffect(() => {
    if (!dmToast) return;
    const timer = window.setTimeout(() => setDmToast(null), 15000); // the "new message" card stays 15 seconds
    return () => window.clearTimeout(timer);
  }, [dmToast]);
  const dmLines = dm ? (online ? (chats.find((chat) => chat.userId === dm.id)?.messages ?? []).map((item) => ({ mine: item.from === "me", text: item.text })) : dms[dm.id] ?? []) : [];
  const myTurnLive = online && phase === "waiting" && turn === meIndex;
  useEffect(() => {
    if (!online) return;
    if (phase === "choice") playSound("chosen");
    if (phase === "kissed") playSound("kiss");
    if (phase === "declined") playSound("decline");
  }, [online, phase]);
  useEffect(() => { if (myTurnLive) playSound("turn"); }, [myTurnLive]);
  // New lines keep the chat at the bottom, unless the person has scrolled up to read (then it is left alone).
  const stickRef = useRef(true);
  const userScrollAt = useRef(0);
  useEffect(() => warmPing(), []);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (lines[lines.length - 1]?.from === "me") stickRef.current = true;
    if (!stickRef.current) return;
    const down = () => list.scrollTo({ top: list.scrollHeight });
    const frame = window.requestAnimationFrame(down);
    const later = window.setTimeout(down, 150); // rows that were not drawn yet (off screen) change the height a moment later
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(later); };
  }, [lines, picked]);
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
  const ytSrc = (id: string) => `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}${startAt > 2 ? `&start=${startAt}` : ""}${startMuted ? "&mute=1" : ""}`;
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
  // Somebody who left the table: his lines stay in the chat for everyone (name and photo are remembered).
  const lineWho = (id: string) => byId(id) ?? (names.current[id] ? { id, name: names.current[id].name, age: 0, female: false, avatar: names.current[id].avatar } as Player : undefined);
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
  // The open list of tables refreshes itself (a block done meanwhile removes the person from it on both sides).
  useEffect(() => {
    if (panel !== "tables" || !online) return;
    const timer = window.setInterval(() => void bottleTables().then(setRooms), 10000);
    return () => window.clearInterval(timer);
  }, [panel, online]);
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
    const same = result.table === net?.table; // the same table again: only the seat changes, the chat stays
    if (!same) bumpStat("tables");
    setPicked(null);
    setCard(false);
    if (!same) setLines([]);
    // Moving again to the same table: only your own gifts go; the others at the table keep theirs.
    // (Another table starts clean anyway.)
    if (same) {
      const dropMe = <T,>(value: Record<string, T[]>) => (value.me?.length ? { ...value, me: [] } : value);
      setSpots(dropMe);
      setStickers(dropMe);
      announceFresh();
    }
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
  // A new table or room starts clean: gifts that sat on the photos at the old table do not come along.
  // Every table has its own music: moving to another table stops the song of the old one and plays the new table's song (if any).
  useEffect(() => { tableGen.current += 1; setFlying([]); setBursts([]); setShows([]); setStickers({}); setSpots({}); setPiles({}); setScatters([]); setVideo(null); setAudio(null); trackAt.current = 0; }, [liveTable]);
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
    setSpots({});
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
  // VIP comes only from the server (a bought VIP) or the admin role; there is no switch to turn it on by hand.
  const serverVip = Boolean(net?.vip);
  useEffect(() => { setVip(iAmAdmin || (online && serverVip)); }, [iAmAdmin, online, serverVip]);
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
    else setKickNote(t(result === "vip" ? "bottle.kickNeedVip" : result === "hearts" ? "bottle.noHearts" : "bottle.kickFail"));
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
  // The first 10 of ANY rating (kisses, music, hearts, harem, smiles; all time) get the TOP badge by themselves (no admin needed); refreshed every 5 minutes.
  const [autoTop, setAutoTop] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if (!online) return;
    let alive = true;
    const load = () => void Promise.all((["kisses", "songs", "dear", "influence", "smiles"] as const).map((kind) => bottleTop(kind, "all"))).then((all) => {
      if (!alive) return;
      const ids = new Set<string>();
      for (const data of all) if (data && Array.isArray(data.list)) for (const row of data.list) if (row.place >= 1 && row.place <= 10) ids.add(row.id);
      setAutoTop(ids);
    });
    load();
    const timer = window.setInterval(load, 300000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [online]);
  const topIds = new Set(seated.map((player) => ({ id: player.id, count: kisses[player.id] ?? 0 })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 3).map((item) => item.id));
  // A TOP badge given in the admin panel shows as well.
  // Online the TOP and VIP ribbons are the ones given in the admin panel; taking them back removes them.
  if (online) { topIds.clear(); for (const player of seated) if (net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.top || autoTop.has(player.me ? net?.me ?? "" : player.id)) topIds.add(player.id); }
  const skinFilter = (n: number) => (n % 15 ? `hue-rotate(${(n % 15) * 24}deg) saturate(${n % 3 === 0 ? 1.4 : 1.1})` : undefined);
  const art = useCustomArt();
  // Picture of a flying gift for the canvas (null: drawn as before, e.g. the few vector gifts).
  const flightUrl = (id: string): string | null => {
    if (id.startsWith("song:")) return `/custom/orig/${id === "song:video" ? "audio_video_icon" : "audio_music_icon"}.svg`;
    const name = id.startsWith("c:") ? id.slice(2) : giftFileName(id);
    const custom = customFile(art, `gifts/${name}`) || customFile(art, `anim/${name}`);
    if (custom) return custom;
    const emoji = giftEmoji[id] ? giftEmoji[id] : id.startsWith("e:") ? id.slice(2) : null;
    return emoji ? giftSrc(emoji) : null;
  };
  // Gifts lying on the photos sit on the photos as before (the old table). Open the game with ?pixi=1 (remembered) to try the canvas layer, ?pixi=0 to turn it off again.
  const [canvasSeats, setCanvasSeats] = useState(false);
  // Test switch: open the game as /bottle/?nochat=1 to run it without the chat list (to see how much the chat costs).
  const [noChat, setNoChat] = useState(false);
  useEffect(() => { try { setNoChat(new URLSearchParams(window.location.search).get("nochat") === "1"); } catch { /* no query */ } }, []);
  // Measuring panel (FPS, elements, memory) for slow phones: /bottle/?perf=1
  // Automatic lite mode: while gifts are flying and the frame rate stays under 28 FPS for two seconds, new gifts fly and land as still pictures,
  // fireworks are skipped and the sky is capped. It turns itself off again after the gifts are gone. Test switch: ?lite=1 keeps it always on.
  // The gift list shows its first tiles and adds more while you scroll (about 430 gifts at once were ~2300 page elements, the biggest load on weak phones).
  // On phones the list keeps less below the visible part (240 px instead of 600) and adds 30 tiles at a time: far fewer page elements while gifts fly.
  const giftBuffer = wide ? 600 : 240, giftStep = wide ? 60 : 30;
  const [giftLimit, setGiftLimit] = useState(wide ? 60 : 30);
  const giftListRef = useRef<HTMLDivElement>(null);
  // A tall panel (computer) is not filled by the first tiles and cannot scroll: keep adding tiles until it is full (or all gifts are shown).
  useEffect(() => {
    const el = giftListRef.current;
    if (el && el.clientHeight > 0 && el.scrollHeight - el.scrollTop - el.clientHeight < giftBuffer) setGiftLimit((value) => (value < 600 ? value + giftStep : value));
  }, [giftLimit, panel, picked, dedicate, giftBuffer, giftStep]);
  const [lite, setLite] = useState(false);
  const liteRef = useRef(false);
  const flyingCount = useRef(0);
  flyingCount.current = flying.length;
  useEffect(() => {
    let force = false;
    try { force = new URLSearchParams(window.location.search).get("lite") === "1"; } catch { /* no query */ }
    const set = (on: boolean) => { if (liteRef.current === on) return; liteRef.current = on; liteGifts = on; setLite(on); };
    if (force) { set(true); return; }
    let raf = 0; let last = 0; let frames = 0; let since = 0; let slow = 0; let calm = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!last) { last = now; since = now; return; }
      frames += 1; last = now;
      if (now - since < 1000) return;
      const fps = (frames * 1000) / (now - since); frames = 0; since = now;
      if (flyingCount.current > 0 && fps < 28) { slow += 1; calm = 0; if (slow >= 2) set(true); }
      else { slow = 0; if (flyingCount.current === 0) { calm += 1; if (calm >= 5) set(false); } }
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); liteGifts = false; };
  }, []);
  const [perf, setPerf] = useState(false);
  useEffect(() => { try { setPerf(new URLSearchParams(window.location.search).get("perf") === "1"); } catch { /* no query */ } }, []);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("pixi");
      if (q === "1") window.localStorage.setItem("pixi-on", "1");
      if (q === "0") window.localStorage.removeItem("pixi-on");
      setCanvasSeats(window.localStorage.getItem("pixi-on") === "1");
    } catch { /* storage blocked: stays off */ }
  }, []);
  const seatGiftData = useRef<SeatGiftData>({ piles: {}, spots: {}, ids: [], seats: [], box: 17.5, cx: 50, cy: 50, staged: false, turn: null, target: null, url: () => null, pileMs: PILE_MS, version: 0 });
  const canvasUrl = (gift: string) => (canvasSeats ? flightUrl(gift) : null);
  const canvasCorners = (spot: Spot) => spot.kind !== "behind" && Boolean(canvasUrl(spot.gift));
  const canvasCount = useRef(0);
  const canvasLast = useRef<unknown[]>([]);
  const canvasFlights = useRef<CanvasFlight[]>([]);
  const flightGeometry = useRef<FlightGeometry>({ seats: [], cx: 50, cy: 50, staged: false, turn: null, target: null });
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
  // Another player's achievements (opened from their profile card, like the original); null means my own.
  const [achOf, setAchOf] = useState<{ id: string; name: string; values: Record<string, number> | null } | null>(null);
  useEffect(() => { if (!achOpen) setAchOf(null); }, [achOpen]);
  const pullAchOf = (id: string) => { void bottleAchView(id).then((values) => setAchOf((cur) => (cur && cur.id === id ? { ...cur, values: values ?? {} } : cur))); };
  const achOther = useMemo(() => (achOf ? (metric: string) => achOf.values?.[metric] ?? 0 : null), [achOf]);
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
  // While the achievements window is open the counters follow along live (gifts, kisses... sent meanwhile).
  useEffect(() => {
    if (!achOpen) return;
    const timer = window.setInterval(() => { pullAch.current(); setStatsTick((n) => n + 1); }, 2000);
    return () => window.clearInterval(timer);
  }, [achOpen]);
  // What the player has reached for unlocking gifts and smileys (kisses, songs, friends, smileys sent, VIP).
  const [serverProgress, setServerProgress] = useState<Progress | null>(null);
  const pullProgress = useRef<() => void>(() => {});
  // Admin paneldən "bütün smayliklər açıq" seçilibsə, smayliklər hamıya kilidsiz görünür.
  const [gesOpen, setGesOpen] = useState(false);
  pullProgress.current = () => { if (online) { void bottleProgress().then((value) => { if (value) setServerProgress(value); }); void bottleGesturesOpen().then((value) => setGesOpen(value === true)); } };
  useEffect(() => { pullProgress.current(); const timer = window.setInterval(() => pullProgress.current(), 15000); return () => window.clearInterval(timer); }, [online]);
  const progress: Progress = iAmAdmin ? { kisses: 1e9, friends: 1e9, dj: 1e9, gestures: 1e9, vip: true } : online && serverProgress ? serverProgress : { kisses: kisses.me ?? 0, friends: 0, dj: readStats().songsSent ?? 0, gestures: readStats().gestures ?? 0, vip };
  const gesProgress: Progress = gesOpen ? { kisses: 1e9, friends: 1e9, dj: 1e9, gestures: 1e9, vip: true } : progress;
  const progressReady = !online || Boolean(serverProgress);
  const openKey = progressReady ? [...Object.entries(GIFT_RULES).filter(([, rule]) => rule[0] !== "vip" && rule[1] > 0 && missing(rule, progress) === 0).map(([gift]) => gift),
    ...GESTURES.filter(([, , kind, amount]) => kind !== "vip" && amount > 0 && missing([kind, amount], progress) === 0).map(([id]) => `g:${id}`)].sort().join(",") : "";
  useEffect(() => {
    if (!openKey && !progressReady) return;
    try {
      const saved = window.localStorage.getItem("bottle-open");
      window.localStorage.setItem("bottle-open", openKey);
      if (saved === null) return;
      const before = new Set(saved.split(",").filter(Boolean));
      const fresh = openKey.split(",").filter((id) => id && !before.has(id));
      if (fresh.length) setUnlocked(fresh.slice(0, 12));
    } catch { /* storage is blocked */ }
  }, [openKey, progressReady]);
  const lockNote = (kind: RuleKind, left: number) => (kind === "vip" ? t("bottle.vipOnly") : t(`bottle.lock_${kind}` as "bottle.lock_kisses").replace("{n}", left.toLocaleString("ru-RU")));
  // A smiley shown for a few seconds over the sender's photo on the table.
  const [seatGes, setSeatGes] = useState<Record<string, { id: string; key: number }>>({});
  // "Not enough kisses" window for a locked gift or smiley: what is missing and how to get it.
  const [lock, setLock] = useState<{ gift?: string; gesture?: string; kind: RuleKind; total: number } | null>(null);
  // Tutorial for new players (like the original): spin, kiss or refuse, tap a photo, send a gift, write in the chat.
  // The steps light up the real game; finishing pays a one-time bonus, skipping just closes it.
  const [tour, setTour] = useState(0);
  const tourAsked = useRef(false);
  const tourDone = () => { try { return window.localStorage.getItem("bottle-tour") === "done"; } catch { return true; } };
  useEffect(() => {
    if (tourAsked.current || tourDone()) return;
    if (online) {
      if (!net) return;
      tourAsked.current = true;
      void bottleTutorial(false).then((state) => { if (state && !state.done) window.setTimeout(() => setTour(1), 1200); else try { window.localStorage.setItem("bottle-tour", "done"); } catch { /* storage is blocked */ } });
      return;
    }
    tourAsked.current = true;
    window.setTimeout(() => setTour(1), 1200);
  }, [online, net]);
  const sentTotal = Object.values(sent).reduce((sum, value) => sum + value, 0);
  const myTexts = lines.filter((line) => line.from === "me" && line.text).length;
  const tourMark = useRef({ sent: 0, texts: 0 });
  useEffect(() => { if (tour === 4) tourMark.current.sent = sentTotal; if (tour === 5) { tourMark.current.texts = myTexts; setPicked(null); setCard(false); window.setTimeout(() => chatRef.current?.focus(), 100); } }, [tour]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (tour === 3 && picked !== null && players[picked] && !players[picked].me) setTour(4); }, [tour, picked, players]);
  useEffect(() => { if (tour === 4 && sentTotal > tourMark.current.sent) window.setTimeout(() => setTour(5), 1800); }, [tour, sentTotal]);
  useEffect(() => { if (tour === 5 && myTexts > tourMark.current.texts) window.setTimeout(() => setTour(6), 800); }, [tour, myTexts]);
  const [tourBonus, setTourBonus] = useState(0);
  const closeTour = (finished: boolean) => {
    try { window.localStorage.setItem("bottle-tour", "done"); } catch { /* storage is blocked */ }
    setTour(0);
    if (!finished) return;
    if (online) { void bottleTutorial(true).then((result) => { if (result && typeof result.total === "number") { heartsRef.current = result.total; setHearts(result.total); } }); return; }
    heartsRef.current += 10;
    setHearts(heartsRef.current);
  };
  useEffect(() => { if (tour === 6) setTourBonus(10); }, [tour]);
  // Table effect: checked whenever gifts land (every player's screen decides the same way, like the original).
  const [tableVfx, setTableVfx] = useState<{ key: number; kind: string; emoji: string[] } | null>(null);
  const vfxUntil = useRef(0);
  useEffect(() => {
    if (seated.length !== 12 || Date.now() < vfxUntil.current) return;
    const names = (id: string) => (stickers[id] ?? []).map((gift) => (gift.startsWith("c:") ? gift.slice(2) : gift));
    for (const vfx of TABLE_VFX) {
      const counts: Record<string, number> = {};
      for (const player of seated) {
        const mine = names(player.me ? "me" : player.id).concat(names(player.id));
        for (const [key, types] of Object.entries(vfx.types)) if (mine.some((name) => types.some((type) => name.startsWith(type)))) counts[key] = (counts[key] ?? 0) + 1;
      }
      if (Object.entries(vfx.filters).every(([key, min]) => (counts[key] ?? 0) >= min)) {
        vfxUntil.current = Date.now() + TABLE_VFX_SECONDS * 1000;
        const key = Date.now();
        setTableVfx({ key, kind: vfx.kind, emoji: vfx.emoji });
        playSfx(vfx.sound);
        window.setTimeout(() => setTableVfx((value) => (value?.key === key ? null : value)), TABLE_VFX_SECONDS * 1000 + 6000);
        return;
      }
    }
  }, [stickers, seated.length]); // eslint-disable-line react-hooks/exhaustive-deps
  // "Add friend" on a profile card sends a real friend request (the same one as on the Friends page).
  async function sendFriend(player: Player) {
    if (player.me) return;
    if (!online || !supabase) return setCardNote(t("bottle.friendSent"));
    const { error } = await supabase.from("friendships").insert({ addressee_id: player.id });
    if (!error) { setCardNote(t("bottle.friendSent")); void refreshFriends(); return; }
    setCardNote(error.code === "23505" ? t("bottle.friendAlready") : t("bottle.friendFail"));
  }
  const isAdminPlayer = (player: Player) => (player.me ? iAmAdmin : adminIds.includes(player.id));
  // Two players with the same name get a number, like the original: "Leyla [1]".
  const nameSuffix = (player: Player) => {
    const same = seated.filter((other) => other.name === player.name);
    return same.length > 1 ? same.indexOf(player) : 0;
  };
  // Boosters from the original: "passion" (a burning kiss) and "slap" (on a refusal). After answering, a 3-second button
  // offers one if the player has it; everybody at the table sees the effect over the pair.
  const [items, setItems] = useState<BottleItems>(() => {
    try { return { kiss_fire: 0, refuse_slap: 0, ...(JSON.parse(window.localStorage.getItem("bottle-items") ?? "{}") as Partial<BottleItems>) }; } catch { return { kiss_fire: 0, refuse_slap: 0 }; }
  });
  useEffect(() => { if (!online) try { window.localStorage.setItem("bottle-items", JSON.stringify(items)); } catch { /* storage is blocked */ } }, [items, online]);
  const itemsAsked = useRef(false);
  useEffect(() => {
    if (!online || !net || (itemsAsked.current && panel !== "boosters")) return;
    itemsAsked.current = true;
    void bottleItems().then((data) => { if (data) setItems(data); });
  }, [online, net, panel]);
  const [boostOffer, setBoostOffer] = useState<keyof BottleItems | null>(null);
  const boostTimer = useRef(0);
  const offerBoost = (kind: keyof BottleItems) => {
    if (!items[kind]) return;
    window.clearTimeout(boostTimer.current);
    setBoostOffer(kind);
    boostTimer.current = window.setTimeout(() => setBoostOffer(null), 3000);
  };
  const [boostFx, setBoostFx] = useState<{ key: number; kind: keyof BottleItems; fromLeft: boolean } | null>(null);
  const showBoost = (kind: keyof BottleItems, actor: string) => {
    const key = Date.now();
    setBoostFx({ key, kind, fromLeft: players[turn]?.id === actor || (actor === "me" && turn === meIndex) });
    if (kind === "kiss_fire") { playSfx("heartbeat"); window.setTimeout(() => playSfx("kissing2"), 500); }
    else { playSfx("whip"); window.setTimeout(() => playSfx("punch1"), 450); }
    window.setTimeout(() => setBoostFx((value) => (value?.key === key ? null : value)), 2600);
  };
  const showBoostRef = useRef(showBoost);
  showBoostRef.current = showBoost;
  function fireBoost(kind: keyof BottleItems) {
    window.clearTimeout(boostTimer.current);
    setBoostOffer(null);
    if (!items[kind]) return;
    setItems((value) => ({ ...value, [kind]: Math.max(0, value[kind] - 1) }));
    showBoost(kind, "me");
    if (online) { void bottleBooster(kind).then((left) => { if (typeof left === "number" && left >= 0) setItems((value) => ({ ...value, [kind]: left })); }); return; }
    const other = players[turn]?.me ? players[target ?? -1] : players[turn];
    say({ from: "me", boost: { kind, a: players[meIndex]?.name ?? t("common.you"), b: other?.name ?? "?" } });
  }
  function buyItem(kind: keyof BottleItems) {
    setPayNote(false);
    if (heartsRef.current < 5) return setPayNote(true);
    if (online) {
      void bottleItemBuy(kind).then((left) => {
        if (left === null || left < 0) return setPayNote(true);
        heartsRef.current = left;
        setHearts(left);
        setItems((value) => ({ ...value, [kind]: value[kind] + 5 }));
      });
      return;
    }
    heartsRef.current -= 5;
    setHearts(heartsRef.current);
    setItems((value) => ({ ...value, [kind]: value[kind] + 5 }));
  }
  // Daily bonus: the first visit each day gives hearts; days in a row give more (day 1–7).
  const [daily, setDaily] = useState<{ day: number; hearts: number; premium?: boolean } | null>(null);
  const dailyAsked = useRef(false);
  useEffect(() => {
    if (dailyAsked.current) return;
    if (online) {
      if (!net) return;
      dailyAsked.current = true;
      void bottleDaily(false).then((result) => {
        if (!result || !result.day) return;
        window.setTimeout(() => setDaily({ day: result.day, hearts: result.hearts, premium: Boolean(result.premium) }), 1500);
      });
      return;
    }
    dailyAsked.current = true;
    try {
      const today = new Date().toDateString();
      const saved = JSON.parse(window.localStorage.getItem("bottle-daily") ?? "null") as { last: string; day: number } | null;
      if (saved?.last === today) return;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const day = saved?.last === yesterday ? (saved.day % 5) + 1 : 1;
      window.localStorage.setItem("bottle-daily", JSON.stringify({ last: today, day }));
      const prize = DAILY_PRIZES[day - 1];
      window.setTimeout(() => setDaily({ day, hearts: prize }), 1500);
    } catch { /* storage is blocked */ }
  }, [online, net]);
  // Leagues: weekly groups ranked by kisses received; the server closes the week and pays the prizes.
  const [league, setLeague] = useState<(BottleLeague & { at: number }) | null>(null);
  const [leagueResult, setLeagueResult] = useState<{ place: number | null; reward: number; league: number; next: number } | null>(null);
  const [leagueTick, setLeagueTick] = useState(0);
  const [ladder, setLadder] = useState(false);
  const [leagueHead, setLeagueHead] = useState<"up" | "stay" | "down">("up");
  const [leagueHelp, setLeagueHelp] = useState(false);
  const [leaguePrize, setLeaguePrize] = useState<{ place: number; prize: number } | null>(null);
  const leagueBoxRef = useRef<HTMLDivElement>(null);
  const leagueUpRef = useRef<HTMLDivElement>(null);
  const leagueStayRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (panel === "league") { setLeagueHead("up"); setLadder(false); setLeagueHelp(false); setLeaguePrize(null); } }, [panel]);
  const leagueOpen = panel === "league";
  useEffect(() => {
    if (!leagueOpen) return;
    const timer = window.setInterval(() => setLeagueTick((n) => n + 1), 30000);
    if (online) { void bottleLeagueInfo().then((data) => { if (data) setLeague({ ...data, at: Date.now() }); }); return () => window.clearInterval(timer); }
    const monday = new Date(); monday.setHours(0, 0, 0, 0); monday.setDate(monday.getDate() + ((8 - monday.getDay()) % 7 || 7));
    const users = seated.map((player, index) => ({ id: player.me ? "me" : player.id, name: player.me ? t("common.you") : player.name, avatar: player.avatar, score: player.me ? Math.min(100, kisses.me ?? 0) : ((index + 3) * 37) % 140, place: 0 }))
      .sort((a, b) => b.score - a.score).map((user, index) => ({ ...user, place: index + 1 }));
    setLeague({ league: 0, ends_ms: monday.getTime(), now_ms: Date.now(), limit: 100, move: 5, today: Math.min(50, kisses.me ?? 0), kiss_limit: 50, gift_limit: 30, today_kiss: Math.min(50, kisses.me ?? 0), today_gift: 0, prizes: [30, 21, 15, 9, 9, 5, 5, 5, 5, 5], users, at: Date.now() });
    return () => window.clearInterval(timer);
  }, [leagueOpen, online]); // eslint-disable-line react-hooks/exhaustive-deps
  const leagueAsked = useRef(false);
  useEffect(() => {
    if (!online || !net || leagueAsked.current) return;
    leagueAsked.current = true;
    void bottleLeagueClaim().then((result) => {
      if (!result || !result.place) return;
      if (typeof result.total === "number") { heartsRef.current = result.total; setHearts(result.total); }
      window.setTimeout(() => setLeagueResult(result), 2500);
    });
  }, [online, net]);
  // The hearts go into the balance when the player takes them (the button or closing the window).
  function takeDaily() {
    const prize = daily?.hearts ?? 0;
    setDaily(null);
    if (!prize) return;
    heartsSeen.current = heartsSeen.current ? { ...heartsSeen.current, at: 0 } : null;
    if (online) { void bottleDaily(true).then((result) => { if (result && typeof result.total === "number") { heartsRef.current = result.total; setHearts(result.total); } }); return; }
    heartsRef.current += prize;
    setHearts(heartsRef.current);
  }
  // "New gifts unlocked": when the player's progress opens gifts or smileys that were locked, show which ones.
  const [unlocked, setUnlocked] = useState<string[] | null>(null);
  const openLock = (kind: RuleKind, total: number, item: { gift?: string; gesture?: string }) => setLock({ ...item, kind, total });
  const gesKey = useRef(0);
  const showSeatGesture = useCallback((who: string, id: string) => {
    const key = gesKey.current++;
    setSeatGes((value) => ({ ...value, [who]: { id, key } }));
    window.setTimeout(() => setSeatGes((value) => (value[who]?.key === key ? Object.fromEntries(Object.entries(value).filter(([name]) => name !== who)) : value)), 4500);
  }, []);
  function sendGesture(id: string, price: number, rule: [RuleKind, number]) {
    const left = missing(rule, gesProgress);
    if (left) return openLock(left < 0 ? "vip" : rule[0], rule[1], { gesture: id });
    if (online && smiles < 1) { setFrameNote(smileText.none); return; }
    if (!online && heartsRef.current < price) return setFrameNote(t("bottle.noHearts"));
    setFrameNote(null);
    closePanel();
    showSeatGesture("me", id);
    playSfx("light_tap");
    bumpStat("gestures");
    if (online) {
      setSmiles((value) => Math.max(0, value - 1));
      void bottleGesture(id).then((left) => {
        if (typeof left === "number" && left >= 0) { heartsRef.current = left; setHearts(left); pullProgress.current(); pullRef.current(); }
        else if (left === -2) { setSmiles(0); setFrameNote(smileText.none); }
        void bottleSmiles().then((value) => { if (typeof value === "number") setSmiles(value); });
      });
      return;
    }
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
    { key: "ach", label: t("bottle.achievements"), dot: !(kisses.me ?? 0), go: () => setPanel("achievements"), icon: <span className="block h-6 w-6 bg-center bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/misc_menu_achievements.svg)", backgroundSize: "21px 21px" }} /> },
    { key: "rating", label: t("bottle.menuRatings"), go: () => { setTopKind("kisses"); setPanel("top"); }, icon: <span className="block h-6 w-6 bg-center bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/misc_menu_tops.svg)", backgroundSize: "24px 15px" }} /> },
    { key: "league", label: t("bottle.league"), go: () => setPanel("league"), icon: <svg viewBox="0 0 24 24" className="h-6 w-6"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="#F2B705" stroke="#B7791F" strokeWidth="1.4" /><path d="m12 7 1.5 3.1 3.4.4-2.5 2.3.7 3.3L12 14.5 8.9 16.1l.7-3.3-2.5-2.3 3.4-.4L12 7Z" fill="#FFFFFF" /></svg> },
    { key: "bottles", label: t("bottle.menuBottles"), go: () => { setPayNote(false); setPanel("bottles"); }, icon: <span className="block h-6 w-6 bg-center bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/misc_menu_bottle.svg)", backgroundSize: "23px 23px" }} /> },
    { key: "market", label: marketLabel(locale), go: () => { setPayNote(false); setPanel("market"); }, icon: <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[linear-gradient(180deg,#A855F7,#6D28D9)] text-[13px]" aria-hidden="true">💎</span> },
    { key: "frames", label: t("bottle.menuStyle"), go: () => { setFramePick(null); setFrameNote(null); setPanel("frames"); }, icon: <span className="block h-6 w-6 bg-center bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/misc_menu_decor.svg)", backgroundSize: "20px 20px" }} /> },
    { key: "boosters", label: t("bottle.boosters"), go: () => { setPayNote(false); setPanel("boosters"); }, icon: <span className="block h-6 w-6 bg-center bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/misc_menu_boosters.svg)", backgroundSize: "24px 24px" }} /> },
    { key: "rules", label: t("bottle.rules"), go: () => setPanel("rules"), icon: <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[linear-gradient(180deg,#7CD35B,#3FA62B)]"><BookOpen size={15} className="text-white" strokeWidth={2.4} /></span> },
  ];
  function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    setEmojiOpen(false);
    bumpStat("chat");
    if (online) void bottleSay(draft.trim().slice(0, 200)).then(pullRef.current);
    else say({ from: "me", text: draft.trim().slice(0, 200) });
    setDraft("");
  }
  // The site is a static export (no server), so YouTube is asked straight from the browser.
  // The key is public by design: in Google Cloud it must be restricted to this site's address and to "YouTube Data API v3".
  async function loadTracks(search: string) {
    // Several keys (from different Google Cloud projects) can be given separated by commas: when one runs out of its daily quota the next one is used.
    const keys = (process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    const key = keys[0];
    setTracks([]);
    setTrackWhy("");
    if (!key) return setTrackState("nokey");
    // One song search = one key: case, punctuation and extra spaces do not make a new (100-unit) YouTube search.
    const norm = search.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    const cacheKey = `bottle-yt:${norm}`;
    const staleList = (): Track[] => { try { return (JSON.parse(window.localStorage.getItem(cacheKey) ?? "null") as { list?: Track[] } | null)?.list ?? []; } catch { return []; } };
    try {
      // Kept for 7 days on this device: every YouTube search spends a big share of the daily quota.
      const cached = JSON.parse(window.localStorage.getItem(cacheKey) ?? "null") as { at: number; list: Track[] } | null;
      if (cached?.list?.length && Date.now() - cached.at < 7 * 86400_000) { setTracks(cached.list); return setTrackState("idle"); }
    } catch { /* no cache */ }
    setTrackState("loading");
    if (search && online) {
      // The same search done by any player in the last days is already in the database.
      const shared = await bottleYtGet(norm);
      if (shared?.length) {
        setTracks(shared);
        setTrackState("idle");
        try { window.localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), list: shared })); } catch { /* storage is full or blocked */ }
        return;
      }
    }
    const api = "https://www.googleapis.com/youtube/v3";
    // The quota resets at midnight Pacific time (about 07:00-08:00 UTC): a key that ran out is skipped until 08:00 UTC.
    const deadUntil = () => { const d = new Date(); d.setUTCHours(8, 0, 0, 0); if (d.getTime() <= Date.now()) d.setUTCDate(d.getUTCDate() + 1); return d.getTime(); };
    const isDead = (k: string) => { try { return Number(window.localStorage.getItem(`bottle-yt-dead:${k.slice(-8)}`) ?? 0) > Date.now(); } catch { return false; } };
    const call = async (path: string): Promise<Response> => {
      const alive = keys.filter((k) => !isDead(k));
      const order = alive.length ? alive : keys;
      const start = Math.floor(Math.random() * order.length);
      let last: Response | null = null;
      for (let n = 0; n < order.length; n++) {
        const k = order[(start + n) % order.length];
        const res = await fetch(`${api}/${path}&key=${k}`);
        if (res.ok) return res;
        last = res;
        const reason = await ytReason(res.clone());
        if (/quota|dailyLimit|rateLimit/i.test(reason)) { try { window.localStorage.setItem(`bottle-yt-dead:${k.slice(-8)}`, String(deadUntil())); } catch { /* storage blocked */ } continue; }
        break;
      }
      return last as Response;
    };
    const clock = (iso: string) => {
      const part = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
      if (!part) return "";
      const [h, m, sec] = [Number(part[1] ?? 0), Number(part[2] ?? 0), Number(part[3] ?? 0)];
      return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(sec).padStart(2, "0")}`;
    };
    try {
      let ids = "";
      if (search) {
        const found = await call(`search?part=id&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=25&q=${encodeURIComponent(search)}`);
        if (!found.ok) {
          setTrackWhy(await ytReason(found));
          const old = staleList();
          if (old.length) { setTracks(old); return setTrackState("idle"); }
          const own = [...favs, ...recent].filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index && songScore(search, item.title) >= 0.5);
          if (own.length) { setTracks(own); return setTrackState("idle"); }
          return setTrackState("fail");
        }
        ids = (((await found.json()) as { items?: { id: { videoId: string } }[] }).items ?? []).map((item) => item.id.videoId).join(",");
        if (!ids) return setTrackState("idle");
      }
      const details = await call(search ? `videos?part=snippet,contentDetails&id=${ids}` : `videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=AZ&maxResults=16`);
      if (!details.ok) { setTrackWhy(await ytReason(details)); return setTrackState("fail"); }
      const list = (((await details.json()) as { items?: { id: string; snippet: { title: string }; contentDetails: { duration: string } }[] }).items ?? []).map((item) => ({ id: item.id, title: item.snippet.title, duration: clock(item.contentDetails.duration) }));
      // Own favourites and recent songs that match come first; then everything is ordered by how well it fits the query.
      const ranked = search ? rankSongs(search, [...[...favs, ...recent].filter((item) => songScore(search, item.title) >= 0.9), ...list].filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index)) : list;
      const shown = search && ranked.length ? ranked : list;
      setTracks(shown);
      setTrackState("idle");
      try { window.localStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), list: shown })); } catch { /* storage is full or blocked */ }
      if (search && online && shown.length) void bottleYtPut(norm, shown);
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
  function playLive(kind: "youtube" | "mp3", ref: string, title: string, secs = 0) {
    const targets = songTo().map((index) => players[index]);
    void (async () => {
      for (const target of targets.length ? targets : [null]) {
        const left = await bottlePlay(target && !target.me ? target.id : null, kind, ref, title);
        if (left === null || left < 0) { setGiftNote(t("bottle.songFailLive")); break; }
        heartsRef.current = left;
        setHearts(left);
      }
      // The server counts gifts for the DJ only while the song is playing: tell it how long the song is.
      if (secs > 0) void Promise.resolve(supabase?.rpc("bottle_track_secs", { p_secs: Math.round(secs) })).catch(() => undefined);
      pullRef.current();
    })();
  }
  // After a song starts, nobody else can change it for 30 seconds (the server checks it too).
  function songBusy() {
    if (!online || !net?.track || net.track.by === net.me) return false;
    const left = Math.ceil(30 - (net.now - net.track.at) / 1000);
    if (left <= 0) return false;
    setGiftNote(t("bottle.songBusy").replace("{n}", String(left)));
    return true;
  }
  function orderTrack(track: Track, music = false) {
    if (songBusy()) return;
    const count = Math.max(1, songTo().length);
    if (heartsRef.current < SONG_PRICE.video * count) return setGiftNote(t("bottle.noHearts"));
    if (online) playLive("youtube", track.id, music ? `♫ ${cleanSong(track.title)}` : cleanSong(track.title), durationSeconds(track.duration) || 0);
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
    if (id) {
      setTrackState("idle");
      // A pasted link has no title yet: it is looked up (own lists, this device, then YouTube) so the chat shows the song's name, not the word "YouTube".
      const known = [...favs, ...recent].find((item) => item.id === id && item.title && item.title !== "YouTube");
      let title = known?.title ?? "";
      if (!title) { try { title = window.localStorage.getItem(`bottle-yt-title:${id}`) ?? ""; } catch { /* no storage */ } }
      setTracks([{ id, title: title || "YouTube", duration: known?.duration }]);
      if (!title) {
        const apply = (found: string) => {
          if (!found) return;
          try { window.localStorage.setItem(`bottle-yt-title:${id}`, found); } catch { /* storage is full or blocked */ }
          setTracks((list) => list.map((item) => (item.id === id ? { ...item, title: found } : item)));
        };
        void (async () => {
          const key = (process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ?? "").split(",").map((item) => item.trim()).filter(Boolean)[0];
          try {
            if (key) {
              const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${key}`);
              if (res.ok) {
                const item = ((await res.json()) as { items?: { snippet: { title: string } }[] }).items?.[0];
                if (item?.snippet?.title) return apply(item.snippet.title);
              }
            }
          } catch { /* try the next way */ }
          try {
            const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`);
            if (res.ok) apply(((await res.json()) as { title?: string }).title ?? "");
          } catch { /* the title stays "YouTube" */ }
        })();
      }
      return;
    }
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
    // Free private messages are for players registered as girls (a gender changed later does not count).
    const regFemale = details.regGender ? details.regGender === "female" : players[meIndex].female;
    if (!regFemale && !vip) return setDmNote(true);
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
  function fireworks(key: number, to: number, price: number, from = -1, gift = "") {
    const { min, pct } = giftShare.current;
    if (gift !== "c:heart1000" && to >= 0 && from !== to && pct > 0 && price >= min) heartBurst(key + 0.5, to, Math.max(1, Math.floor((price * pct) / 100)));
    const level = fireworksLevel(price);
    if (!level || to < 0 || liteRef.current) return;
    if (showsRef.current >= 2) return; // at most two shows at once, so a flood of gifts does not freeze the page
    showsRef.current += 1;
    window.setTimeout(() => { showsRef.current -= 1; }, 1300 + [0, 2, 3, 4, 5][level] * 280 + 600);
    setShows((list) => [...list, { key, to, level }].slice(-2));
    playSfx("sparkling1");
    const booms = [0, 1, 2, 3, 4].slice(0, level + 1);
    booms.forEach((n) => window.setTimeout(() => playSfx(n % 2 ? "boom2" : "boom1"), 470 + n * 560));
    if (level >= 3) window.setTimeout(() => playSfx("jackpot_firecracker"), 900);
    window.setTimeout(() => setShows((list) => list.filter((item) => item.key !== key)), 1300 + [0, 2, 3, 4, 5][level] * 280 + 600);
  }
  function heartBurst(key: number, to: number, amount = 1) {
    setBursts((list) => [...list, { key, to, amount }].slice(-4));
    window.setTimeout(() => setBursts((list) => list.filter((item) => item.key !== key)), 1700);
  }
  // A single gift glides for 3 seconds; gifts sent in a rapid series (press and hold) fly in about a second.
  // The flight goes straight to where the gift will sit (offset from the seat centre in cqmin, and its final size).
  const flightTo = (plan: ReturnType<typeof planLanding>, gift: string) => {
    const w = wide ? 18.5 : 17.5;
    const base = SMALL_FLIGHT.has(gift) ? 7 : 11;
    if (!plan.spot) return { tx: -0.38 * w, ty: -0.38 * w, end: (0.56 * w) / base, base };
    const { x, y, s: size } = plan.spot;
    // Corner gifts stand pinned to the bottom-right (or bottom-left) of their square box, so the flight aims at the middle of the picture
    // where it will really stand, not at the middle of the empty box (otherwise a narrow can lands on the left and then jumps over).
    let cx = x + size / 2, cy = y + size / 2;
    if (plan.spot.kind === "corner" || plan.spot.kind === "balloon") {
      const file = plan.land.startsWith("c:") ? giftBounds[plan.land.slice(2)] : undefined;
      if (file) {
        const longest = Math.max(file[4], file[5]);
        const dw = (size * file[4]) / longest, dh = (size * file[5]) / longest;
        cx = x + size / 2 < 45 ? x + dw / 2 : x + size - dw / 2;
        cy = y + size - dh / 2;
      }
    }
    const tx = ((cx - 50) / 100) * w, ty = ((cy - 50) / 100) * w;
    // Gifts that land anywhere on the photo (not the corner ones) fly at the size they will sit at.
    if (plan.spot.kind === "rand") return { tx, ty, end: 1, base: (size / 100) * w };
    return { tx, ty, end: ((size / 100) * w) / base, base };
  };
  // Where a seat really is right now: the two players kissing stand in the middle of the table.
  const seatLeft = (index: number) => (staged && (index === turn || index === target) ? `calc(${CENTER_X}% ${index === turn ? "-" : "+"} 12.5cqmin)` : `${seats[index][0]}%`);
  const seatTop = (index: number) => (staged && (index === turn || index === target) ? `${STAGE_Y}%` : `${seats[index][1]}%`);
  // The same seat positions in container units, for moving a flying gift with transform (cqw/cqh = % of the table box).
  const seatXq = (index: number) => (staged && (index === turn || index === target) ? `(${CENTER_X}cqw ${index === turn ? "-" : "+"} 12.5cqmin)` : `${seats[index][0]}cqw`);
  const seatYq = (index: number) => (staged && (index === turn || index === target) ? `${STAGE_Y}cqh` : `${seats[index][1]}cqh`);
  flightGeometry.current = { seats, cx: CENTER_X, cy: STAGE_Y, staged, turn, target };
  if (canvasSeats) {
    const last = canvasLast.current;
    if (last[0] !== piles || last[1] !== spots || last[2] !== staged || last[3] !== turn || last[4] !== target || last[5] !== wide) { canvasLast.current = [piles, spots, staged, turn, target, wide]; canvasCount.current += 1; }
    seatGiftData.current = { piles, spots, ids: players.map((player) => player.id), seats, box: wide ? 18.5 : 17.5, cx: CENTER_X, cy: STAGE_Y, staged, turn, target, url: canvasUrl, pileMs: PILE_MS, version: canvasCount.current };
  }
  // The canvas draws every flight that has a picture; it reads this list on each frame.
  useEffect(() => {
    canvasFlights.current = flying.flatMap((item) => {
      const url = flightUrl(WHOLE_FLIGHT.has(item.gift) ? item.gift : item.look ?? item.gift);
      return url ? [{ key: item.key, url, from: item.from, to: item.to, t0: item.t0 ?? performance.now(), ms: item.ms, tx: item.tx, ty: item.ty, base: item.base, end: item.end, rot: item.rot ?? 0, fixed: item.fixed, spin: SPIN_FLIGHT.test(item.gift) }] : [];
    });
  }, [flying, art]); // eslint-disable-line react-hooks/exhaustive-deps
  // Realtime: every gift is also announced on the table's live channel at once, so everybody at the table sees it fly
  // within a fraction of a second (the database is not asked for it). The 1-second sync stays as the backup; a gift that
  // already came over the live channel (same seed) is not flown a second time.
  const liveChannel = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);
  const seenSeeds = useRef(new Set<number>());
  // When a player comes (back) to the table or leaves it, they announce "fresh" and every screen wipes the gifts on their photo.
  // A gift that was already flying to them when this happened never lands (it started before the wipe).
  const freshAt = useRef<Record<string, number>>({});
  // Tell the others at the table that I just sat down (again) or left: they clear my old gifts.
  function announceFresh() {
    if (!liveChannel.current || !meId.current) return;
    console.info("[bottle] fresh sent");
    void liveChannel.current.send({ type: "broadcast", event: "fresh", payload: { id: meId.current } }).catch(() => {});
  }
  const clearPlayer = (id: string) => {
    freshAt.current[id] = performance.now();
    const drop = <T,>(value: Record<string, T[]>) => (value[id]?.length ? { ...value, [id]: [] } : value);
    setStickers(drop);
    setSpots(drop);
    setPiles(drop);
    setScatters((list) => list.filter((item) => item.to !== id));
    setFlying((list) => list.filter((item) => item.toId !== id));
  };
  const liveOut = useRef<{ from: string; to: string; gift: string; seed: number }[]>([]);
  const liveTimer = useRef(0);
  const meId = useRef("");
  meId.current = net?.me ?? "";
  function liveSend(item: { from: string; to: string; gift: string; seed: number }) {
    if (!liveChannel.current) return;
    seenSeeds.current.add(item.seed);
    liveOut.current.push(item);
    if (liveTimer.current) return;
    liveTimer.current = window.setTimeout(() => {
      liveTimer.current = 0;
      const items = liveOut.current.splice(0, liveOut.current.length);
      if (items.length && liveChannel.current) void liveChannel.current.send({ type: "broadcast", event: "gifts", payload: { items } });
    }, 120);
  }
  // No connection screen up: the live gift channel is closed too (no sounds or flying gifts from the table in the background).
  const liveTableId = gone || offline ? undefined : net?.table;
  const silentRef = useRef(false);
  silentRef.current = Boolean(gone || offline);
  // What is on the photos right now, for the newcomer's "snapshot" (see the effect below).
  const spotsNow = useRef(spots);
  spotsNow.current = spots;
  const stickersNow = useRef(stickers);
  stickersNow.current = stickers;
  useEffect(() => {
    if (!online || !supabase || !liveTableId) return;
    const client = supabase;
    const channel = client.channel(`bottle-table-${liveTableId}`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "gifts" }, (message: { payload?: { items?: { from: string; to: string; gift: string; seed: number }[] } }) => {
      const items = (message.payload?.items ?? []).filter((item) => item && typeof item.seed === "number" && !seenSeeds.current.has(item.seed));
      if (seenSeeds.current.size > 5000) seenSeeds.current.clear();
      const who = (id: string) => (id === meId.current ? "me" : id);
      items.forEach((item, order) => {
        seenSeeds.current.add(item.seed);
        window.setTimeout(() => remoteGift.current(who(item.from), who(item.to), item.gift, items.length > 1 ? 1800 : 3600, item.seed), order * Math.min(120, 600 / items.length));
      });
    });
    channel.on("broadcast", { event: "fresh" }, (message: { payload?: { id?: string } }) => {
      const id = message.payload?.id;
      if (!id || id === meId.current) return;
      console.info("[bottle] fresh received", id);
      clearPlayer(id);
    });
    // A player who comes (back) to the table asks "need"; one of the others answers with a snapshot of the gifts on every photo,
    // so the newcomer sees what the others have (it is not on the server: gifts live on the screens).
    type Snap = { to?: string; spots?: Record<string, Spot[]>; stickers?: Record<string, string[]> };
    const answeredFor = new Set<string>();
    let gotSnapshot = false;
    channel.on("broadcast", { event: "need" }, (message: { payload?: { id?: string } }) => {
      const asker = message.payload?.id;
      if (!asker || asker === meId.current || !meId.current) return;
      window.setTimeout(() => {
        if (answeredFor.has(asker) || !liveChannel.current) return;
        const mapKey = (id: string) => (id === "me" ? meId.current : id);
        const now = Date.now();
        const outSpots: Record<string, Spot[]> = {};
        for (const [id, list] of Object.entries(spotsNow.current)) {
          const key = mapKey(id);
          if (key === asker || !list.length) continue;
          const newest = [...list].reverse().find((item) => item.kind === "rand");
          outSpots[key] = list.filter((item) => item.kind !== "rand" || item === newest || now - (item.t ?? 0) < RAND_KEEP_MS);
        }
        const outStickers: Record<string, string[]> = {};
        for (const [id, list] of Object.entries(stickersNow.current)) { const key = mapKey(id); if (key !== asker && list.length) outStickers[key] = list; }
        if (!Object.keys(outSpots).length && !Object.keys(outStickers).length) return;
        void channel.send({ type: "broadcast", event: "snapshot", payload: { to: asker, spots: outSpots, stickers: outStickers } as Snap });
      }, 150 + Math.random() * 450);
    });
    channel.on("broadcast", { event: "snapshot" }, (message: { payload?: Snap }) => {
      const data = message.payload;
      if (!data?.to) return;
      answeredFor.add(data.to); // somebody already answered: the others stay quiet
      if (data.to !== meId.current || gotSnapshot) return;
      gotSnapshot = true;
      const now = Date.now();
      const keyed: Record<string, Spot[]> = {};
      for (const [id, list] of Object.entries(data.spots ?? {})) {
        if (id === meId.current || !Array.isArray(list)) continue;
        keyed[id] = list.filter((item) => item && typeof item.x === "number" && typeof item.y === "number" && typeof item.s === "number" && typeof item.gift === "string").map((item) => ({ ...item, key: -1 - Math.floor(Math.random() * 1e9) }));
      }
      setSpots((value) => {
        const next = { ...value };
        for (const [id, list] of Object.entries(keyed)) {
          const have = next[id] ?? [];
          const add = list.filter((item) => !have.some((other) => spotPlace(other) === spotPlace(item)));
          if (add.length) next[id] = [...have, ...add];
        }
        return next;
      });
      // The random gifts that still have time left go on their way, as they do on the other screens.
      for (const [id, list] of Object.entries(keyed)) {
        for (const item of list) {
          if (item.kind !== "rand" || !item.t) continue;
          const left = RAND_KEEP_MS - (now - item.t);
          if (left > 0) window.setTimeout(() => setSpots((value) => {
            const current = value[id] ?? [];
            const newest = [...current].reverse().find((other) => other.kind === "rand");
            if (newest?.key === item.key) return value;
            return { ...value, [id]: current.filter((other) => other.key !== item.key) };
          }), left);
        }
      }
      setStickers((value) => {
        const next = { ...value };
        for (const [id, list] of Object.entries(data.stickers ?? {})) if (id !== meId.current && Array.isArray(list) && !(next[id]?.length)) next[id] = list;
        return next;
      });
    });
    const myId = meId.current;
    const announce = () => announceFresh();
    let announced = false; // only the real entry announces; a short connection drop that re-subscribes does not wipe the gifts
    channel.subscribe((status: string) => { if (status === "SUBSCRIBED" && !announced) { announced = true; announce(); if (myId) void channel.send({ type: "broadcast", event: "need", payload: { id: myId } }).catch(() => {}); } });
    liveChannel.current = channel;
    window.addEventListener("pagehide", announce);
    return () => {
      window.removeEventListener("pagehide", announce);
      // Leaving the table: tell the others to remove my gifts, then close the channel at once
      // (the message is already queued; closing later could clash with a quick re-entry on the same channel name).
      // meId may already be empty when the table is gone, so the id from when I sat down is used.
      if (myId) void channel.send({ type: "broadcast", event: "fresh", payload: { id: myId } }).catch(() => {});
      liveChannel.current = null;
      void client.removeChannel(channel);
    };
  }, [online, liveTableId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Gifts go to the server in small batches (one request every 0.3 s), so a long stream is a handful of requests, not hundreds.
  const giftQueue = useRef<{ to: string; gift: string; price: number; seed: number }[]>([]);
  const giftTimer = useRef(0);
  function queueGift(item: { to: string; gift: string; price: number; seed: number }) {
    giftQueue.current.push(item);
    if (giftTimer.current) return;
    giftTimer.current = window.setTimeout(() => {
      giftTimer.current = 0;
      const batch = giftQueue.current.splice(0, giftQueue.current.length);
      if (batch.length) void bottleGiftMany(batch);
    }, 300);
  }
  // Auto-clicker guard: at most 40 gifts a second from this device (a hold-to-send stream to 10 people fits in it).
  // Extra clicks are simply ignored (no hearts taken), so the page never drowns in its own gifts.
  const giftBucket = useRef({ tokens: GIFT_BUCKET, at: 0 });
  // Tokens are taken for the whole group at once (everyone at the table or nobody), so a fast tapper never leaves the same last seats without a gift.
  const groupPaid = useRef(false);
  function takeGiftTokens(count: number) {
    const now = performance.now();
    const bucket = giftBucket.current;
    bucket.tokens = Math.min(GIFT_BUCKET, bucket.tokens + ((now - bucket.at) / 1000) * GIFT_BUCKET);
    bucket.at = now;
    if (bucket.tokens < count) return false;
    bucket.tokens -= count;
    return true;
  }
  const soundAt = useRef(0);
  const giftSound = (gift: string, moment: "send" | "land") => { if (silentRef.current) return; const now = performance.now(); if (now - soundAt.current < 70) return; soundAt.current = now; playGiftSound(gift, moment); };
  function sendGift(index: number, gift: string, price: number, ms = 5200) {
    if (!groupPaid.current && !takeGiftTokens(1)) return true; // too fast: skipped without stopping a hold-to-send stream
    const seed = 1 + Math.floor(Math.random() * 2e9); // goes to the server with the gift, so every screen puts it in the same spot
    ms = ms <= 1800 ? 4000 : 6000; // a single gift flies 6 s, a press-and-hold stream 4 s
    if (gift.startsWith("c:") && colorSteps.has(gift.slice(2))) gift = `c:${nextColor(gift.slice(2))}`; // one colour per tap, in order
    const player = players[index];
    if (!player || player.empty) return false;
    if (heartsRef.current < price) return false;
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    if (online) {
      queueGift({ to: player.me ? net?.me ?? "" : player.id, gift, price, seed });
      liveSend({ from: net?.me ?? "", to: player.me ? net?.me ?? "" : player.id, gift, seed });
    }
    const key = flyId.current++;
    giftSound(gift, "send");
    // Drinks fly like every other gift (one by one); on landing the receiver gets the "+1 heart" burst.
    const pour = isDrink(gift) && index !== meIndex;
    const plan = planLanding(gift, seed);
    {
      // My own gifts always fly on my screen: when the sky is full, the oldest gift from someone else makes room.
      // A gift already in the air is never removed before it arrives. When the sky is full, someone else's oldest gift makes room;
      // if all of them are mine, the new one simply lands without a flight.
      setFlying((list) => [...list, { key, gift, look: plan.land, t0: performance.now(), from: meIndex, to: index, toId: player.id, moved: false, ms, mine: true, still: liteRef.current || list.length >= 12, rot: plan.spot?.kind === "hatL" ? -45 : plan.spot?.kind === "hatR" ? 45 : plan.spot?.r ?? 0, fixed: plan.spot?.kind === "hatL" || plan.spot?.kind === "hatR", ...flightTo(plan, gift) }]); // no limit: every gift flies
      window.setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => setFlying((list) => list.map((item) => (item.key === key ? { ...item, moved: true } : item))))), 20);
    }
    say({ from: "me", to: player.id, gift }); // the chat line is written when the gift leaves, not when it lands
    const gen = tableGen.current;
    const startedAt = performance.now();
    window.setTimeout(() => {
      setFlying((list) => list.filter((item) => item.key !== key));
      if (gen !== tableGen.current || playersRef.current[index]?.id !== player.id || (freshAt.current[player.id] ?? 0) > startedAt) return;
      giftSound(gift, "land");
      if (pour) heartBurst(key, index);
      if (gift === "c:heart1000") heartBurst(key + 0.5, index, 1000);
      fireworks(key, index, price, meIndex, gift);
      landGift(key, player.id, plan);
    }, ms + 100);
    setSent((value) => ({ ...value, [player.id]: (value[player.id] ?? 0) + 1 }));
    bumpStat("giftsSent");
    bumpStat(`gift:${gift}`);
    return true;
  }
  // A gift another player sent: it flies from their seat to the receiver, then sits on the photo and goes into the chat.
  const remoteGift = useRef<(from: string, to: string, gift: string, ms: number, seed: number) => void>(() => {});
  remoteGift.current = (fromId, toId, gift, ms, seed) => {
    ms = ms <= 1800 ? 4000 : 6000; // a single gift flies 6 s, a press-and-hold stream 4 s
    const fromAt = players.findIndex((player) => player.id === fromId);
    const toAt = players.findIndex((player) => player.id === toId);
    if (!gift || toAt < 0) return;
    const key = flyId.current++;
    const pour = isDrink(gift) && fromAt >= 0 && fromAt !== toAt;
    // A flood of gifts from other players: past 70 in the air, a new one lands straight away (no flight and no "sent" sound),
    // so nothing is heard without being seen.
    const busy = false; // no limit: every gift from other players flies too
    if (busy) ms = 500;
    else giftSound(gift, "send");
    const plan = planLanding(gift, seed);
    {
      if (!busy) setFlying((list) => ([...list, { key, gift, look: plan.land, t0: performance.now(), from: fromAt >= 0 ? fromAt : toAt, to: toAt, toId, moved: false, ms, still: liteRef.current || list.length >= 12, rot: plan.spot?.kind === "hatL" ? -45 : plan.spot?.kind === "hatR" ? 45 : plan.spot?.r ?? 0, fixed: plan.spot?.kind === "hatL" || plan.spot?.kind === "hatR", ...flightTo(plan, gift) }]));
      window.setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => setFlying((list) => list.map((item) => (item.key === key ? { ...item, moved: true } : item))))), 20);
    }
    say({ from: fromId, to: toId, gift }); // the chat line is written when the gift leaves the sender
    const gen = tableGen.current;
    const startedAt = performance.now();
    window.setTimeout(() => {
      setFlying((list) => list.filter((item) => item.key !== key));
      if (gen !== tableGen.current || playersRef.current[toAt]?.id !== toId || (freshAt.current[toId] ?? 0) > startedAt) return;
      giftSound(gift, "land");
      if (pour) heartBurst(key, toAt);
      if (gift === "c:heart1000") heartBurst(key + 0.5, toAt, 1000);
      fireworks(key, toAt, priceOf(gift), fromAt, gift);
      landGift(key, toId, plan);
    }, ms + 100);
  };
  // Who admires this player: the server keeps it on a live table, the demo keeps it here.
  function admirerOf(player: Player) {
    if (online) {
      const found = net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.admirer ?? (cardOut && cardOut.id === player.id && prof?.id === player.id ? prof.data.admirer : null);
      return found ? { id: found.id, me: found.id === net?.me, self: found.id === (player.me ? net?.me : player.id), name: found.name ?? "", avatar: found.avatar ?? "", amount: found.amount } : null;
    }
    const local = suitors[player.id];
    const who = local ? byId(local.by) : null;
    return local && who ? { id: local.by, me: Boolean(who.me), self: local.by === (player.me ? "me" : player.id), name: who.name, avatar: who.avatar, amount: local.amount } : null;
  }
  function court(player: Player) {
    const current = admirerOf(player);
    const price = (current?.amount ?? 0) + 1;
    // Your own seat: you can only buy yourself out from someone else (the original "leave").
    if (current?.me || (player.me && !current)) return;
    if (heartsRef.current < price) return setCardNote(`${t("bottle.noHearts")} (${price})`);
    if (online) {
      const target = player.me ? net?.me : player.id;
      if (!target) return;
      void bottleAdmire(target).then((left) => {
        if (left === null || left < 0) return setCardNote(t(left === -3 ? "bottle.admireBlocked" : left === -4 ? "bottle.admireFrozen" : "bottle.admireFail"));
        bumpStat("admire");
        heartsRef.current = left;
        setHearts(left);
        pullRef.current();
        void loadProfile(player);
      });
      return;
    }
    heartsRef.current -= price;
    setHearts(heartsRef.current);
    setSuitors((value) => ({ ...value, [player.id]: { by: "me", amount: price } }));
    bumpStat("admire");
    say({ from: "me", text: player.me ? `${t("bottle.freedSelf")} ❤️ ${price}` : `${t("bottle.courtStarted")} ${player.name} ❤️ ${price}` });
  }
  // The profile numbers (price, harem, places, league) come from the server when a card opens.
  const [prof, setProf] = useState<{ id: string; data: BottleProfile } | null>(null);
  // The card can walk to the admirer's card (also someone not at this table) and come back with the arrow.
  const [cardOut, setCardOut] = useState<Player | null>(null);
  const [cardBack, setCardBack] = useState<{ picked: number | null; out: Player | null }[]>([]);
  useEffect(() => { if (!card) { setCardOut(null); setCardBack([]); } }, [card]);
  const cardPlayer = cardOut ?? (picked !== null ? players[picked] : null);
  function openAdmirerCard(by: { id: string; name: string; avatar: string }) {
    const index = players.findIndex((item) => !item.empty && (item.id === by.id || (item.me && (by.id === "me" || by.id === net?.me))));
    setCardBack((list) => [...list, { picked, out: cardOut }]);
    setFlagMenu(false); setSignOpen(false); setCardNote(null);
    if (index >= 0) { setCardOut(null); setPicked(index); void loadProfile(players[index]); return; }
    const out: Player = { id: by.id, name: by.name, age: 0, female: false, avatar: by.avatar || NO_PHOTO, zodiac: null };
    setCardOut(out);
    void loadProfile(out);
  }
  // Open anyone's card (from the ratings and other lists): a player at the table or someone elsewhere.
  // VIP names: girls in a red-pink-purple gradient, boys in dark blue; everyone else stays light.
  const vipName = (player: Player) => {
    const custom = nameColorClass(nameColors[player.me ? net?.me ?? "" : player.id]); // a colour given in the admin panel wins
    if (custom) return custom;
    const isVip = online ? Boolean(net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.vip_badge) : Boolean(player.me && vip);
    if (!isVip) return "";
    return player.female ? "bg-[linear-gradient(90deg,#FF2D55,#FF6FB5,#B15CFF)] bg-clip-text text-transparent [filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.6))] [text-shadow:none]" : "text-[#1E3A8A] [text-shadow:0_0_3px_#fff,0_0_6px_rgba(255,255,255,0.8)]";
  };
  function showUserCard(user: { id: string; name: string; avatar: string }) {
    const index = players.findIndex((item) => !item.empty && (item.id === user.id || (item.me && (user.id === "me" || user.id === net?.me))));
    setCardBack([]); setFlagMenu(false); setSignOpen(false); setCardNote(null);
    if (index >= 0) { setCardOut(null); setPicked(index); setCard(true); void loadProfile(players[index]); return; }
    const out: Player = { id: user.id, name: user.name, age: 0, female: false, avatar: user.avatar || NO_PHOTO, zodiac: null };
    setCardOut(out); setCard(true);
    void loadProfile(out);
  }
  function cardGoBack() {
    const last = cardBack[cardBack.length - 1];
    if (!last) return;
    setCardBack((list) => list.slice(0, -1));
    setFlagMenu(false); setSignOpen(false); setCardNote(null);
    setCardOut(last.out);
    setPicked(last.picked);
    const back = last.out ?? (last.picked !== null ? players[last.picked] : null);
    if (back) void loadProfile(back);
  }
  async function loadProfile(player: Player) {
    const id = player.me ? net?.me : player.id;
    if (!online || !id) return;
    const data = await bottleProfile(id);
    if (data) setProf({ id: player.id, data });
  }
  // Press and hold a gift: it keeps going until the finger is lifted (or the hearts run out).
  // A tap sends one gift. Holding for a moment keeps sending until release; a scroll gesture cancels without sending.
  const pressed = useRef<{ timer: number; started: boolean; x: number; y: number } | null>(null);
  const stopHold = () => { if (hold.current) window.clearInterval(hold.current); hold.current = null; };
  const cancelPress = () => { if (pressed.current) window.clearTimeout(pressed.current.timer); pressed.current = null; stopHold(); };
  function giveGift(index: number, gift: string, price: number, need?: number) {
    if (gift === "c:cherry" && giftHidden("cherry")) return false;
    if (gift.startsWith("song:")) { openSong(index); if (gift === "song:mp3") { setSongTab("mp3"); if (!tracks.length) void loadTracks(""); } return false; }
    if (need === -1 && !vip) { openLock("vip", 1, { gift }); return false; }
    if (need && need > 0) { const rule = GIFT_RULES[gift] ?? ["kisses", lockedGifts.find(([id]) => id === gift)?.[2] ?? need]; openLock(rule[0], rule[1], { gift }); return false; }
    setGiftNote(null);
    if (!sendGift(index, gift, price)) { setGiftNote(t("bottle.noHearts")); return false; }
    return true;
  }
  function giveMany(targets: number[], gift: string, price: number, need?: number) {
    // A song with nobody chosen goes on for yourself only (no receiver, the chat says "for themselves").
    if (!targets.length && gift.startsWith("song:")) { giveGift(meIndex, gift, price, need); setSongMany([]); return false; }
    if (!targets.length) { setGiftNote(t("bottle.pickReceivers")); return false; }
    if (gift.startsWith("song:")) { giveGift(targets[0], gift, price, need); setSongMany(targets); return false; }
    let sent = false;
    if (!takeGiftTokens(targets.length)) return true; // too fast for the whole group: this tap is skipped as a whole, nobody gets half of it
    groupPaid.current = true;
    try { for (const index of targets) { if (!giveGift(index, gift, price, need)) break; sent = true; } } finally { groupPaid.current = false; }
    if (sent && targets.length > 1) bumpStat("multi");
    return sent;
  }
  function pressGift(_targets: number[], _gift: string, _price: number, _need: number | undefined, x: number, y: number) {
    cancelPress();
    // A tap sends one gift when the finger is lifted. Pressing and holding sends nothing (there is no stream of gifts any more).
    const state = { started: false, x, y, timer: window.setTimeout(() => { state.started = true; }, 380) };
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
  // A place is only shown when it is in the first 5000, like the original.
  const rankLine = (rank: number | null | undefined) => rank && rank < 5000 ? <span className="text-[11px] font-semibold text-[#9CA3AF]">{t("bottle.rankOf").replace("{n}", rank.toLocaleString("ru-RU"))}</span> : null;
  const [statsOpen, setStatsOpen] = useState(true);
  // The original card has two layouts: "landscape" (photo on the left) and "portrait" (photo on top), by the screen shape.
  const [landscape, setLandscape] = useState(false);
  useEffect(() => {
    const check = () => setLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  useEffect(() => { if (card && !cardOut && picked !== null && players[picked]) void loadProfile(players[picked]); }, [card, picked]); // eslint-disable-line react-hooks/exhaustive-deps
  // The profile card: on a computer it sits in the middle of the whole game, on a phone over the table.
  // Windows that show counters follow along live while they are open: rating, league, season pass, the profile card,
  // and the gift list (locks open as soon as the progress is reached).
  const liveRef = useRef<() => void>(() => {});
  liveRef.current = () => {
    if (!online) return;
    if (panel === "pass") void bottlePass().then((data) => setPassData(data));
    if (panel === "achievements" && achOf) pullAchOf(achOf.id);
    if (panel === "league") void bottleLeagueInfo().then((data) => { if (data) setLeague({ ...data, at: Date.now() }); });
    if (panel === "top" && topKind !== "help") void bottleTop(topKind, topPeriod).then((data) => { if (data) setTopData(data); });
    if (card && cardPlayer) void loadProfile(cardPlayer);
    if (!card && picked !== null) pullProgress.current();
  };
  const liveOn = online && (panel === "pass" || panel === "league" || (panel === "top" && topKind !== "help") || picked !== null);
  useEffect(() => {
    if (!liveOn) return;
    const timer = window.setInterval(() => liveRef.current(), 3000);
    return () => window.clearInterval(timer);
  }, [liveOn]);
  const cardView = card && cardPlayer ? (() => {
          const loaded = prof && prof.id === cardPlayer.id ? prof.data : null;
          const outside = Boolean(cardOut);
          const player: Player = cardOut && loaded?.user ? { ...cardOut, name: loaded.user.name ?? cardOut.name, avatar: loaded.user.avatar || cardOut.avatar, age: hideAges[cardPlayer.id] || (cardPlayer.me && details.hideAge) ? 0 : loaded.user.age ?? 0, female: loaded.user.gender === "female", zodiac: loaded.user.zodiac } : cardPlayer;
          const seed = picked ?? 0;
          const suitor = admirerOf(player);
          const by = suitor;
          const seat: BottleSeat | undefined = online ? net?.seats.find((item) => item.id === (player.me ? net.me : player.id)) ?? (outside && loaded ? { seat: -1, id: player.id, name: player.name, avatar: player.avatar, gender: null, kisses: 0, age: null, total: loaded.kisses, songs: loaded.songs, smiles: loaded.smiles, status: loaded.user?.status ?? null } : undefined) : undefined;
          const stats = [
            { key: "statKisses", color: "#D7261E", icon: <Gift id="e:💋" className="h-[22px] w-[22px]" />, value: online ? seat?.total ?? 0 : kisses[player.id] ?? 0 },
            { key: "statSongs", color: "#C8489B", icon: <Music2 size={19} className="text-[#D35AA8]" strokeWidth={2.6} />, value: online ? seat?.songs ?? 0 : ((seed + 3) * 7919) % 900 },
            { key: "statSmiles", color: "#F28C00", icon: <Gift id="e:😊" className="h-[21px] w-[21px]" />, value: online ? seat?.smiles ?? 0 : player.me ? mySmiles : ((seed + 5) * 104729) % 600 },
          ];
          const profileHref = player.me ? "/profile" : online ? `/user?id=${player.id}` : null;
          const sign = player.zodiac !== null && player.zodiac !== undefined ? zodiacSigns[player.zodiac] : null;
          // The original profile dialog (bottle-html5 UserProfileDialog + its CSS): photo square on the left on a computer,
          // on top on a phone; status, counters, owner block and a row of round buttons with the original icons.
          const P = "/custom/profile/";
          const land = wide || landscape;
          const small = land ? window.innerWidth <= 692 : window.innerWidth <= 400;
          const actions = [
            ...(player.me || outside ? [] : [{ key: "kick", label: t("bottle.kick"), bg: "rgb(255,97,66)", icon: "act_kick.svg", size: !small ? "42px 35px" : "38px 32px", go: () => askKick(player) }]),
            ...(profileHref ? [{ key: "social", label: t("bottle.openProfile"), bg: "rgb(241,138,0)", icon: "", size: "", go: () => { window.open(profileHref, "_blank"); } }] : []),
            player.me
              ? { key: "music", label: t("bottle.statSongs"), bg: "rgb(177,89,137)", icon: "act_music.svg", size: !small ? "28px 28px" : "26px 26px", go: () => { setCard(false); openSong(meIndex); } }
              : outside ? null : { key: "gift", label: t("gifts.send"), bg: "rgb(249,116,43)", icon: "act_gift.svg", size: !small ? "30px 28px" : "28px 26px", go: () => setCard(false) },
            { key: "ach", label: t("bottle.achievements"), bg: "rgb(252,165,41)", icon: "act_ach.svg", size: !small ? "30px 30px" : "28px 28px", go: () => { setCard(false); if (!player.me) { setAchOf({ id: player.id, name: player.name, values: null }); if (online) pullAchOf(player.id); } setPanel("achievements"); } },
            ...(player.me || outside ? [] : [{ key: "chat", label: t("bottle.chatMention"), bg: "rgb(89,175,225)", icon: "act_msg.svg", size: !small ? "30px 22px" : "28px 21px", go: () => { setDraft(`${player.name}, `); setCard(false); setPicked(null); window.setTimeout(() => { chatRef.current?.focus(); const end = chatRef.current?.value.length ?? 0; chatRef.current?.setSelectionRange(end, end); }, 60); } }]),
          ].filter((item): item is NonNullable<typeof item> => Boolean(item));
          const info = loaded;
          const harem = online ? info?.harem ?? 0 : Object.entries(suitors).filter(([target, item]) => item.by === (player.me ? "me" : player.id) && target !== player.id).reduce((sum, [, item]) => sum + item.amount, 0);
          const cup = online ? info?.league ?? null : player.me && (kisses.me ?? 0) >= 100 ? 0 : null;
          const zodiacIcon = player.zodiac !== null && player.zodiac !== undefined ? (player.zodiac + 9) % 12 : null;
          const big = stats[0].value > 0 && stats[1].value > 0 && stats[2].value > 0;
          const statRow = (key: string, icon: string, color: string, value: number, rank: number | null | undefined) => (
            <div key={key} className={cn("flex h-[17px] items-center", big ? "mb-[10px] first:mt-[10px]" : "mb-1 last:mb-0")} title={t(`bottle.${key}` as "bottle.price")}>
              <span aria-hidden="true" className="mr-[7px] h-[17px] w-[23px] shrink-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${P}${icon})` }} />
              <b className="mr-[10px] whitespace-nowrap text-[14px] tabular-nums" style={{ color }}>{online && !net ? "…" : value.toLocaleString("ru-RU")}</b>
              {rank && rank < 5000 ? <span className="truncate text-[11px] tracking-[-0.24px] text-[#A7A7A7]">{t("bottle.rankOf").replace("{n}", rank.toLocaleString("ru-RU"))}</span> : null}
              <span className="sr-only">{t(`bottle.${key}` as "bottle.price")}</span>
            </div>
          );
          const labels = [topIds.has(player.id) ? "label_top_gold.svg" : null, !topIds.has(player.id) && (online ? seat?.vip_badge : player.me && vip) ? "label_vip.svg" : null].filter((item): item is string => Boolean(item));
          return (
            <div className={cn("inset-0 flex items-center justify-center p-3", wide ? cn("absolute bg-black/10", panel ? "z-[60]" : "z-[45]") : panel ? "fixed z-[100] bg-black/50" : "fixed z-[90] bg-black/50")} onClick={(event) => { event.stopPropagation(); setCard(false); }}>
              <div role="dialog" aria-modal="true" aria-label={`${player.name}, ${player.age}`} onClick={(event) => event.stopPropagation()} className={cn("relative shadow-[0_18px_50px_rgba(0,0,0,0.45)]", land ? "h-[400px] max-h-[80vh] max-w-[91%]" : "w-[400px] max-w-[80vw]")} style={{ borderRadius: 17, maxHeight: land ? undefined : "calc(94% - env(safe-area-inset-top))" }}>
                <button onClick={() => setCard(false)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-3 -top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8DC63F] bg-white text-[#8DC63F] shadow hover:bg-[#F0FBEA]"><X size={19} strokeWidth={3} /></button>
                {cardBack.length ? <button onClick={cardGoBack} aria-label={t("bottle.back")} title={t("bottle.back")} className="absolute -left-3 -top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8DC63F] bg-white text-[#8DC63F] shadow hover:bg-[#F0FBEA]"><ChevronLeft size={22} strokeWidth={3} /></button> : null}
                {labels.map((label, n) => { return <span key={label} aria-hidden="true" className={cn("absolute z-10 bg-contain bg-no-repeat", "-left-[21px] h-[48px] w-[72px]")} style={{ top: 15 + labels.slice(0, n).reduce((sum, item) => sum + 50, 0), backgroundImage: `url(${P}${label})` }} />; })}
                <div className={cn("isolate flex h-full overflow-hidden rounded-[17px] bg-white", land ? "flex-row" : "max-h-[inherit] flex-col")}>
                <div className={cn("relative shrink-0 overflow-hidden bg-[#F7F5F6]", land ? "aspect-square h-full" : "aspect-square max-h-[38dvh] w-full")}>
                  <img src={player.avatar} alt="" className="h-full w-full object-cover object-top" />
                  <div aria-hidden="true" className="pointer-events-none absolute bottom-0 h-[30%] w-full bg-[linear-gradient(transparent,rgba(0,0,0,0.7))]" />
                  <div className="absolute bottom-1 left-1/2 flex w-[70%] -translate-x-1/2 flex-col items-center text-center text-[14px] text-white">
                    <p className={cn("mx-auto mb-1.5 max-w-full truncate font-bold leading-4", isAdminPlayer(player) && "bg-[linear-gradient(rgb(240,208,51)_0%,rgb(217,131,0))] bg-clip-text text-transparent")}>{isAdminPlayer(player) ? "👑 " : ""}{player.name}{player.age ? `, ${player.age}` : ""}</p>
                  </div>
                  {zodiacIcon !== null ? <button onClick={() => setSignOpen(!signOpen)} aria-expanded={signOpen} aria-label={t("bottle.zodiac")} title={t(`bottle.sign${player.zodiac}` as "bottle.sign0")} className="absolute bottom-[6px] left-3 h-7 w-7 bg-contain bg-center bg-no-repeat active:brightness-75" style={{ backgroundImage: `url(${P}z${zodiacIcon}.svg)`, backgroundSize: "23px auto" }} /> : null}
                  {signOpen && sign ? <span role="status" className="absolute left-1/2 top-[17px] z-[1] w-max -translate-x-1/2 rounded-full bg-black/85 px-3 pb-[9px] pt-[7px] text-[14px] text-white">{t(`bottle.sign${player.zodiac}` as "bottle.sign0")}</span> : null}
                  {player.me ? <button onClick={() => { setCard(false); setFramePick(null); setFrameNote(null); setPanel("frames"); }} aria-label={t("bottle.frames")} title={t("bottle.frames")} className="absolute bottom-[9px] right-[11px] h-5 w-5 bg-contain bg-no-repeat active:brightness-75" style={{ backgroundImage: `url(${P}decor.svg)` }} /> : <button onClick={() => setFlagMenu(!flagMenu)} aria-expanded={flagMenu} aria-label={t("bottle.more")} title={t("bottle.more")} className="absolute bottom-[13px] right-[14px] h-[14px] w-[14px] bg-contain bg-no-repeat active:brightness-75" style={{ backgroundImage: `url(${P}claim.svg)` }} />}
                  {flagMenu && !player.me ? (
                    <div role="menu" className="absolute bottom-9 right-1.5 z-10 w-44 overflow-hidden rounded-lg bg-white py-1 text-left text-xs font-semibold text-[#1F2937] shadow-xl">
                      <button role="menuitem" onClick={() => { setMutedIds((list) => (list.includes(player.id) ? list.filter((id) => id !== player.id) : [...list, player.id])); setFlagMenu(false); setCardNote(t(muted.includes(player.id) ? "bottle.unrejected" : "bottle.rejected")); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t(muted.includes(player.id) ? "bottle.unreject" : "bottle.reject")}</button>
                      <button role="menuitem" onClick={() => { setDraft(`${player.name}, `); setFlagMenu(false); setCard(false); setPicked(null); window.setTimeout(() => chatRef.current?.focus(), 50); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t("bottle.mention")}</button>
                      <button role="menuitem" onClick={() => { setFlagMenu(false); setCardNote(t("bottle.reportSent")); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t("bottle.report")}</button>
                      {iAmAdmin ? <button role="menuitem" onClick={() => { setFlagMenu(false); void openIp(player.name, player.id); }} className="block w-full px-3 py-2 text-left font-bold text-[#B45309] hover:bg-black/5">IP</button> : null}
                      <button role="menuitem" onClick={() => { setFlagMenu(false); sendFriend(player); }} className="block w-full px-3 py-2 text-left hover:bg-black/5">{t("bottle.addFriend")}</button>
                      <Link role="menuitem" href="/friends" className="block px-3 py-2 hover:bg-black/5">{t("bottle.myFriends")}</Link>
                    </div>
                  ) : null}
                </div>
                <div className={cn("flex min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-contain bg-white px-[15px] pb-[15px] text-[#1F2937] [-webkit-overflow-scrolling:touch] [touch-action:pan-y]", land ? "w-[300px] min-w-[265px] max-w-[370px]" : "w-full")}>
                  <div className="flex shrink-0 flex-col">
                    {seat?.status ? <><p className="my-[10px] line-clamp-2 shrink-0 text-[14px] italic leading-4">{seat.status}</p><div className="h-px w-full shrink-0 bg-[#F2F2F2]" /></> : <div className="h-[10px] shrink-0" />}
                    <div className={cn("flex shrink-0 justify-between", big && "max-h-[145px]")}>
                      <div className="flex flex-col items-start">
                        {statRow("statKisses", "kiss.svg", "rgb(219,49,0)", stats[0].value, info?.kisses_rank)}
                        {statRow("statSongs", "dj.svg", "rgb(180,93,140)", stats[1].value, info?.songs_rank)}
                        <div className={cn("flex flex-col overflow-hidden transition-all duration-[250ms] ease-linear", !statsOpen ? "mt-0 h-0" : big ? "-mt-[10px] h-[64px]" : "h-[42px]")}>
                          {statRow("price", "price.svg", "rgb(216,87,35)", suitor ? suitor.amount : 0, info?.price_rank)}
                          {statRow("harem", "harem.svg", "rgb(173,23,0)", harem, info?.harem_rank)}
                        </div>
                        {statRow("statSmiles", "gesture.svg", "rgb(252,131,0)", stats[2].value, info?.smiles_rank)}
                      </div>
                      {cup !== null ? <button onClick={() => { setCard(false); setPanel("league"); }} title={t(`bottle.league${cup}` as "bottle.league0")} className="shrink-0 self-center"><LeagueBadge league={cup} className="h-[48px] w-[46px]" /></button> : null}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <div className="h-px w-full bg-[#F2F2F2]" />
                      <button onClick={() => setStatsOpen(!statsOpen)} aria-expanded={statsOpen} aria-label={t("bottle.price")} className={cn("relative mx-[7px] h-[15px] w-[35px] shrink-0 bg-contain bg-no-repeat transition-transform duration-[250ms] ease-linear after:absolute after:-inset-x-4 after:-inset-y-3 after:content-['']", statsOpen && "rotate-180")} style={{ backgroundImage: `url(${P}expand.svg)` }} />
                      <div className="h-px w-full bg-[#F2F2F2]" />
                    </div>
                    <div className="flex shrink-0 py-[10px]">
                      {by && !by.self ? <button type="button" onClick={() => openAdmirerCard(by)} aria-label={by.name} title={by.name} className="mr-[11px] h-16 w-16 shrink-0 overflow-hidden rounded-[10px] active:brightness-75"><img src={by.avatar || NO_PHOTO} alt="" className="h-full w-full object-cover object-top" /></button> : <span aria-hidden="true" className="mr-[11px] flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-[10px] bg-[#EEF1F5]"><UserRound size={56} className="-mb-2 text-[#C3CAD4]" fill="#DDE2E9" strokeWidth={1.2} /></span>}
                      <div className="flex min-w-0 flex-1 flex-col justify-start gap-1.5">
                        <p className="flex shrink-0 text-[14px] leading-4 text-[#4A4A4A]">{by && !by.self ? <>{t("bottle.admirer")}<button type="button" onClick={() => openAdmirerCard(by)} className="ml-[5px] truncate font-bold text-[#1F49D6] hover:underline">{by.me ? t("common.you") : by.name}</button></> : t("bottle.noAdmirer")}</p>
                        <p className="flex h-[17px] items-center text-[14px] font-bold tabular-nums"><span aria-hidden="true" className="mr-[6px] h-[14px] w-[18px] bg-contain bg-no-repeat" style={{ backgroundImage: `url(${P}heart.svg)` }} />{suitor ? suitor.amount : 0}{info?.price_rank && info.price_rank < 5000 ? <span className="ml-[10px] truncate text-[11px] font-normal text-[#A7A7A7]">{t("bottle.rankOf").replace("{n}", info.price_rank.toLocaleString("ru-RU"))}</span> : null}</p>
                        {player.me ? (suitor && !suitor.self ? <button onClick={() => court(player)} title={`${suitor.amount + 1} ❤`} className="h-6 w-fit rounded-[3px] bg-[#8DC63F] px-[11px] text-[14px] text-white hover:brightness-105">{t("bottle.freeSelf")}</button> : null)
                          : suitor?.me ? null : <button onClick={() => court(player)} title={`${(suitor?.amount ?? 0) + 1} ❤`} className="h-6 w-fit rounded-[3px] bg-[#8DC63F] px-[11px] text-[14px] text-white hover:brightness-105">{t("bottle.beAdmirer")}</button>}
                      </div>
                    </div>
                  </div>
                  {cardNote ? <p role="status" className="mb-2 rounded-md bg-[#FEF3C7] px-2 py-1 text-center text-xs font-semibold text-[#92400E]">{cardNote}</p> : null}
                  <div className={cn("flex min-h-[50px] shrink-0 border-t border-[#F2F2F2] pt-[10px]", actions.length > 3 ? "justify-between" : "gap-[30px]")}>
                    {actions.map((item) => (
                      <button key={item.key} onClick={item.go} aria-label={item.label} title={item.label} className={cn("flex shrink-0 items-center justify-center rounded-full bg-center bg-no-repeat text-white active:brightness-75", small ? "h-[46px] w-[46px]" : "h-[50px] w-[50px]")} style={{ backgroundColor: item.bg, backgroundImage: item.icon ? `url(${P}${item.icon})` : undefined, backgroundSize: item.size || undefined }}>
                        {item.icon ? null : <UserRound size={land ? 26 : 24} strokeWidth={2.6} />}
                      </button>
                    ))}
                  </div>
                  {player.me ? null : <button onClick={() => openDm(player)} className="mt-[10px] flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-[#59AFE1] text-[14px] font-semibold text-[#2D8FCC] hover:bg-[#EEF7FD] active:brightness-90"><Mail size={17} strokeWidth={2.2} />{t("bottle.privateMsg")}</button>}
                </div>
                </div>
              </div>
            </div>
          );
        })() : null;
  // Interactive hints from the original (message → choice → gift): a hand with ripples points at one thing and waits.
  // The first comes 10 s after entering a table, the next 15 s after the last one, never over an open window,
  // and each one is shown only once.
  const [hint, setHint] = useState<{ id: "message" | "choice" | "gift"; step: number; target: string; label: string; angle: number; until: number } | null>(null);
  const hintNext = useRef(Date.now() + 10000);
  const hintBase = useRef({ texts: 0, sent: 0 });
  const hintsDone = () => { try { return Number(window.localStorage.getItem("bottle-hints") ?? "0") || 0; } catch { return 7; } };
  const markHint = (mask: number) => { try { window.localStorage.setItem("bottle-hints", String(hintsDone() | mask)); } catch { /* storage is blocked */ } };
  const anyWindowOpen = Boolean(panel || card || lock || daily || leagueResult || unlocked || tour || dm);
  const tableNow = net?.table ?? tableNo;
  useEffect(() => { hintNext.current = Math.max(hintNext.current, Date.now() + 10000); }, [tableNow]);
  useEffect(() => { hintNext.current = Math.max(hintNext.current, Date.now() + 500); }, [anyWindowOpen]);
  const [controlsAt, setControlsAt] = useState(0);
  useEffect(() => { if (canAnswer) setControlsAt(Date.now()); }, [canAnswer]);
  const playingRound = myRole !== null;
  const hintMatch = (() => {
    const me = players[meIndex];
    const others = seated.filter((player) => !player.me && player.female !== me?.female);
    if (!others.length || !me) return null;
    return others.reduce((best, player) => (Math.abs(player.age - me.age) < Math.abs(best.age - me.age) ? player : best), others[0]);
  })();
  const finishHint = (mask: number) => { markHint(mask); setHint(null); hintNext.current = Date.now() + 15000; };
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (hint) {
        if (Date.now() > hint.until) return finishHint(hint.id === "message" ? 1 : hint.id === "choice" ? 2 : 4);
        return;
      }
      if (Date.now() < hintNext.current) return;
      const done = hintsDone();
      // Scenarios in the original order; the first one whose conditions hold now is shown.
      if (!(done & 1) && !anyWindowOpen && !playingRound) {
        hintBase.current.texts = myTexts;
        return setHint({ id: "message", step: 1, target: "chat-input", label: t("bottle.hintMessage"), angle: 180, until: Date.now() + 15000 });
      }
      if (!(done & 2) && canAnswer && Date.now() - controlsAt < 1000 && !anyWindowOpen) {
        return setHint({ id: "choice", step: 1, target: "kiss-button", label: t("bottle.hintKiss"), angle: 300, until: Date.now() + 7000 });
      }
      if (!(done & 4) && !anyWindowOpen && !playingRound && heartsRef.current > 0 && hintMatch) {
        hintBase.current.sent = sentTotal;
        return setHint({ id: "gift", step: 1, target: `seat:${hintMatch.id}`, label: t("bottle.hintGiftPhoto"), angle: 30, until: Date.now() + 15000 });
      }
    }, 300);
    return () => window.clearInterval(timer);
  });
  // Moving on through each hint's steps, or giving up when the player does something else.
  useEffect(() => {
    if (!hint) return;
    if (hint.id === "message") {
      if (hint.step === 1 && anyWindowOpen) return finishHint(1);
      if (hint.step === 2 && myTexts > hintBase.current.texts) return finishHint(1);
      return;
    }
    if (hint.id === "choice") {
      if (myRole && answers[myRole] !== null) return finishHint(2);
      if (!canAnswer) return finishHint(2);
      return;
    }
    if (hint.step === 1 && picked !== null && players[picked] && !players[picked].me) {
      return setHint({ ...hint, step: 2, target: "gift-gem", label: t("bottle.hintGiftPick"), angle: 0, until: Date.now() + 15000 });
    }
    if (hint.step === 2 && (picked === null || sentTotal > hintBase.current.sent)) return finishHint(4);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  // Tapping the chat box during the message hint fills in a greeting, then the hand moves to the send button.
  useEffect(() => {
    const input = chatRef.current;
    if (!input || hint?.id !== "message" || hint.step !== 1) return;
    const onTap = () => window.setTimeout(() => {
      setDraft(t("bottle.hintMessageText"));
      window.setTimeout(() => chatRef.current?.select(), 30);
      hintBase.current.texts = myTexts;
      setHint((value) => (value && value.id === "message" ? { ...value, step: 2, target: "chat-send", label: t("bottle.hintSend"), angle: 135, until: Date.now() + 15000 } : value));
    }, 300);
    input.addEventListener("click", onTap);
    return () => input.removeEventListener("click", onTap);
  }, [hint, myTexts]); // eslint-disable-line react-hooks/exhaustive-deps
  // No connection (another page took the game over, idle, or the net is down): only this screen is drawn, the whole table is taken off the page, so nothing paints or animates in the background.
  if (gone || offline) {
    return (
      <div data-bottle-root className="relative h-full w-full">
        <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-[300] flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#648A3C,#4E6B33)] p-4">
          <div className="w-[min(400px,100%)] rounded-3xl bg-white px-5 pb-5 pt-4 text-center text-black shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
            <p className="text-sm font-bold text-[#C8C8C8]">{({ az: "Əlaqə yoxdur", tr: "Bağlantı yok", ru: "Нет связи", en: "No connection", ka: "კავშირი არ არის" } as Record<string, string>)[locale] ?? "No connection"}</p>
            <div className="relative mx-auto mt-3 flex h-[124px] w-[124px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_30%,#D4ECFB,#8CC8EE)] text-[64px]">
              <span aria-hidden="true">{gone === "idle" ? "😴" : "📡"}</span>
              <span aria-hidden="true" className="absolute -bottom-1 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_30%,#FF8A3D,#E24E12)] text-xl font-black text-white">!</span>
            </div>
            <p className="mt-3 text-[15px]">{gone === "idle" ? t("bottle.goneIdle") : ({ az: "Ay... səninlə əlaqə kəsilib", tr: "Eyvah... bağlantın kesildi", ru: "Ой... связь с тобой потеряна", en: "Oops... you got disconnected", ka: "ვაიმე... კავშირი გაწყდა" } as Record<string, string>)[locale] ?? "Oops... you got disconnected"}</p>
            <button onClick={() => { if (gone) resumeGame(); else pullRef.current(); }} className="mt-3 h-[30px] min-w-[80px] rounded-lg bg-[#9ACD32] px-5 text-sm font-bold text-white hover:brightness-105">{({ az: "Yenilə", tr: "Yenile", ru: "Обновить", en: "Refresh", ka: "განახლება" } as Record<string, string>)[locale] ?? "Refresh"}</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div data-bottle-root className={cn("relative flex h-full w-full bg-surface text-text", wide ? "flex-row" : "flex-col")}>
      {waitFor ? (() => {
        const ahead = Math.max(0, waitFor.position - 1);
        const words: Record<string, { title: string; text: string; first: string; ahead: string; other: string }> = {
          az: { title: "Boş yer yoxdur", text: "Masa {t} ətrafında boş yer yoxdur. Lütfən boş yer üçün gözlə.", first: "Növbədə birinci sənsən", ahead: "Səndən əvvəl növbədə {n} nəfər var", other: "Başqa masa seç" },
          tr: { title: "Boş yer yok", text: "Masa {t} etrafında boş yer yok. Lütfen yer açılmasını bekle.", first: "Sırada birinci sensin", ahead: "Senden önce sırada {n} kişi var", other: "Başka masa seç" },
          ru: { title: "Нет свободных мест", text: "За столом {t} нет свободных мест. Подожди, пока освободится.", first: "Ты первый в очереди", ahead: "Перед тобой в очереди: {n}", other: "Выбрать другой стол" },
          en: { title: "No free seats", text: "There are no free seats at table {t}. Please wait for a seat.", first: "You are first in the queue", ahead: "People ahead of you: {n}", other: "Choose another table" },
          ka: { title: "თავისუფალი ადგილი არ არის", text: "მაგიდასთან {t} თავისუფალი ადგილი არ არის. გთხოვთ დაელოდოთ.", first: "რიგში პირველი ხარ", ahead: "შენს წინ რიგში: {n}", other: "სხვა მაგიდა" },
        };
        const w = words[locale] ?? words.en;
        return (
          <div role="alertdialog" aria-modal="true" className="fixed inset-0 z-[290] flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#648A3C,#4E6B33)] p-4">
            <div className="w-[min(400px,100%)] rounded-3xl bg-white px-5 pb-5 pt-4 text-center text-black shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <p className="text-sm font-bold text-[#C8C8C8]">{w.title}</p>
              <p className="mt-3 text-[15px] leading-5">{w.text.replace("{t}", String(waitFor.table))}</p>
              <p className="mt-2 text-[15px] font-bold leading-5 text-[#4E6B33]">{ahead === 0 ? w.first : w.ahead.replace("{n}", String(ahead))}</p>
              <button onClick={() => { if (waitFor.back) { backCancel.current = Date.now(); backWait.current = false; } setWaitFor(null); void bottleQueueLeave(); openRooms(); }} className="mt-3 h-[30px] min-w-[80px] rounded-lg bg-[#9ACD32] px-5 text-sm font-bold text-white hover:brightness-105">{w.other}</button>
            </div>
          </div>
        );
      })() : null}
      {perf ? <PerfMeter lite={lite} /> : null}
      {packNote?.kind === "ok" ? (() => {
        const done: Record<string, { title: string; text: string; ok: string }> = {
          az: { title: "Bonus alındı!", text: "Hesabına əlavə olundu", ok: "Tamam" },
          tr: { title: "Bonus alındı!", text: "Hesabına eklendi", ok: "Tamam" },
          ru: { title: "Бонус получен!", text: "Добавлено на твой счёт", ok: "Хорошо" },
          en: { title: "Bonus received!", text: "Added to your account", ok: "OK" },
        };
        const w = done[locale] ?? done.en;
        return (
          <div role="alertdialog" aria-modal="true" aria-label={w.title} className="fixed inset-0 z-[295] flex items-center justify-center bg-black/55 p-4">
            <div className="w-[min(360px,100%)] rounded-3xl bg-white px-5 pb-5 pt-4 text-center text-black shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              <p className="text-sm font-bold text-[#9E9E9E]">{w.title}</p>
              <p className="mt-3 flex items-center justify-center gap-2 text-[34px] font-black leading-none tabular-nums text-[#F2343F]"><Heart size={30} fill="#F2343F" stroke="none" />+{(packNote.n ?? 0).toLocaleString("ru-RU")}</p>
              <p className="mt-2 text-[15px] leading-5">{w.text}</p>
              <button autoFocus onClick={closePackDone} className="mt-4 h-[34px] min-w-[96px] rounded-lg bg-[#9ACD32] px-6 text-sm font-bold text-white hover:brightness-105">{w.ok}</button>
            </div>
          </div>
        );
      })() : null}
      {/* On a phone-shaped window the title bar sits on the same wood as the table, with no seam between them. */}
      <div className={cn("relative shrink-0", wide ? "h-full w-[54%]" : "mx-auto w-full max-w-[64dvh]")}>
      {wide ? null : <WoodTable className="pointer-events-none absolute inset-0 h-full w-full" />}
      {wide ? null : header}
      <div className={cn("relative shrink-0 overflow-hidden [container-type:size]", wide ? "h-full w-full bg-[#E0A04E]" : "aspect-[9/10] w-full")} onClick={() => { setPicked(null); if (dedicate) chooseMode(false); }}>
        {wide ? <WoodTable className="pointer-events-none absolute inset-0 h-full w-full" /> : null}
        <div className={cn("absolute flex items-center", menuOpen ? "z-[44]" : "z-10", wide ? "inset-y-0 left-0 w-[13%] flex-col gap-[2.2cqmin] py-[2.2cqmin]" : "inset-x-0 top-0 h-[10%] gap-[1.3cqmin] px-[2cqmin]")} onClick={(event) => event.stopPropagation()}>
          <button ref={balanceRef} key={balancePulse} type="button" onClick={() => { setPayNote(false); setPanel("shop"); }} aria-label={`${t("bottle.shop")}: ${hearts}`} className={cn("flex items-center text-white hover:brightness-110", balancePulse > 0 && "motion-safe:animate-[balance-pulse_0.45s_ease-out]", wide ? "flex-col" : "gap-1.5")} title={t("bottle.shop")}>
            {/* The original balance button: an orange heart with a white rim (bottle-html5 btn_gold_add_heart_up). */}
            <img src="/custom/orig/btn_gold_add_heart_up.svg" alt="" aria-hidden="true" draggable={false} className={cn("drop-shadow-[0_2px_3px_rgba(90,30,0,0.35)]", wide ? "h-[min(56px,10cqmin)] w-[min(62px,11cqmin)]" : "h-[8cqmin] max-h-10 w-[8.8cqmin] max-w-11")} />
            <span className={cn("font-bold tabular-nums leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]", wide ? "text-[min(20px,3.4cqmin)]" : "text-[max(12px,2.6cqmin)]")}>{online && !net ? "…" : hearts}</span>
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
                <div role="menu" className={cn("absolute z-50 min-w-[200px] overflow-hidden rounded-lg bg-white shadow-[0_0_20px_rgba(0,0,0,0.4)] animate-[bottle-pop_0.2s_ease-out]", wide ? "left-full top-1/2 ml-3 -translate-y-1/2" : "right-[-60px] top-full mt-2")}>
                  {menuItems.map((item) => <button key={item.key} role="menuitem" onClick={() => { setMenuOpen(false); item.go(); }} className="relative flex h-10 w-full items-center whitespace-nowrap pr-10 text-left text-[15px] text-black transition-colors duration-[400ms] hover:bg-black/[0.04] active:bg-black/[0.07]"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center">{item.icon}</span>{item.label}{item.dot ? <span className="absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#FF4E00]" /> : null}</button>)}
                </div>
              </>
            ) : null}
          </span>
          <button onClick={() => setPanel("settings")} aria-label={t("bottle.settings")} title={t("bottle.settings")} className={tool}><Settings size={18} /></button>
          <span className="flex-1" />
          <span className={cn("text-center text-[max(8px,1.55cqmin)] font-bold leading-tight text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]", wide && "order-last mt-1")}>{net?.room ? <><span aria-hidden="true">🔒</span><br /><span className="line-clamp-2 block max-w-[64px] break-words">{net.room.name}</span><button onClick={leaveRoom} aria-label={t("bottle.roomLeave")} title={t("bottle.roomLeave")} className="mx-auto mt-1 flex items-center gap-1 rounded-full bg-[#E5484D] px-2 py-0.5 text-[11px] font-bold text-white shadow hover:bg-[#D13438] [text-shadow:none]"><X size={12} strokeWidth={3} />{t("bottle.roomLeaveShort")}</button>{canDeleteRoom ? <button onClick={() => void deleteRoom()} aria-label={t("bottle.roomDelete")} title={t("bottle.roomDelete")} className="mx-auto mt-1 flex items-center gap-1 rounded-full bg-[#7C2D12] px-2 py-0.5 text-[11px] font-bold text-white shadow hover:bg-[#9A3412] [text-shadow:none]"><Trash2 size={12} strokeWidth={2.6} />{t("bottle.roomDeleteShort")}</button> : null}</> : <>{t("bottle.table")}<br />{online ? net?.table ?? "…" : tableNo}</>}</span>
          {myTurn
            ? <span aria-label={`${seconds}`} className={cn(tool, "text-[max(14px,3cqmin)] font-bold tabular-nums")}>{seconds}</span>
            : <button onClick={changeTable} aria-label={t("bottle.changeTable")} title={t("bottle.changeTable")} className={tool}><RefreshCw size={17} /></button>}
          {!wide && !full ? <button onClick={onLeave} aria-label={t("photos.close")} title={t("photos.close")} className={cn(tool, "bg-[#E5484D]/90 hover:bg-[#E5484D] sm:hidden")}><X size={19} strokeWidth={3} /></button> : null}
        </div>

        <button type="button" disabled={staged} onClick={(event) => { event.stopPropagation(); if (myTurn) { bumpStat("spins"); return online ? void bottleSpin().then(pullRef.current) : spin(); } setWaitNote(true); window.setTimeout(() => setWaitNote(false), 1800); }} aria-label={t("bottle.spin")} className={cn(tour === 1 && "rounded-full ring-[1cqmin] ring-[#FFD84D] motion-safe:animate-pulse", "absolute h-[30cqmin] transition-transform duration-[4500ms] ease-[cubic-bezier(0.15,0.6,0.2,1)] motion-reduce:duration-0", staged ? "pointer-events-none" : myTurn ? "z-20 cursor-pointer" : "cursor-default")} style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%`, transform: `translate(-50%, -50%) rotate(${rotation}deg)`, filter: skinFilter(skin) }}>
          <span key={rotation} className="block h-full motion-safe:animate-[bottle-kick_0.35s_ease-out]"><SkinBottle className={cn("h-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] transition-opacity duration-700", staged && "opacity-0")} /></span>
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

        {waitNote && !myTurn && !staged ? <p role="status" className="pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-[2.4cqmin] py-[0.8cqmin] text-[2.6cqmin] font-bold text-white" style={{ left: `${CENTER_X}%`, top: `calc(${STAGE_Y}% + 17cqmin)` }}>{t("bottle.waitTurn")}</p> : null}
        {phase === "waiting" && !myTurn ? <p className="pointer-events-none absolute w-[40cqmin] -translate-x-1/2 -translate-y-1/2 text-center text-[3.4cqmin] font-bold leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.85)]" style={{ left: `${CENTER_X}%`, top: `${STAGE_Y}%` }}>{t(enoughGirls ? "bottle.waitingSpin" : net?.room ? "bottle.needPair" : "bottle.needGirls")}</p> : null}

        {players.map((player, index) => {
          if (player.empty) return null;
          const active = index === turn || index === target;
          const arrivedAt = arrivals[player.id] ?? 0;
          const arriving = arrivedAt > 0 && Date.now() - arrivedAt < 1800;
          const fxAt = seatFx[player.id] ?? 0;
          return (
            <div key={player.id} className={cn("absolute -translate-x-1/2 -translate-y-1/2 transition-[left,top]", wide ? "w-[18.5cqmin]" : "w-[17.5cqmin]", " duration-[1100ms] ease-in-out motion-reduce:duration-0", staged && active ? "z-30" : index === turn && "z-10", fxAt > 0 && Date.now() - fxAt < 4200 && "z-40")} style={staged && active ? { left: `calc(${CENTER_X}% ${index === turn ? "-" : "+"} 12.5cqmin)`, top: `${STAGE_Y}%` } : { left: `${seats[index][0]}%`, top: `${seats[index][1]}%` }}>
              <button type="button" onClick={(event) => { event.stopPropagation(); if (dedicate) { if (!player.me) setChosen((list) => (list.includes(player.id) ? list.filter((id) => id !== player.id) : [...list, player.id])); return; } setGiftNote(null); setCardNote(null); setFlagMenu(false); setSignOpen(false); if (player.me) { if (Date.now() - meTap.current > 15000 || picked !== index) { meTap.current = Date.now(); setFrameNote(null); pullProgress.current(); setCard(false); setPicked(index); return; } meTap.current = 0; setCard(true); setPicked(index); return; } setCard(picked === index); setPicked(index); }} aria-label={`${player.name}, ${player.age}`} data-seat={player.id} className={cn("group relative isolate block aspect-square w-full rounded-[14%] bg-surface-2 shadow-[0_4px_10px_rgba(0,0,0,0.4)]", phase === "spinning" && index === turn && "motion-safe:animate-[seat-wobble_0.4s_ease-out]", tour === 3 && !player.me && !player.empty && "ring-4 ring-[#FFD84D] motion-safe:animate-pulse", !player.empty && isAdminPlayer(player) && "shadow-[0_0_0_0.6cqmin_#F5B400,0_0_14px_4px_rgba(245,180,0,0.65)]", staged && index === target ? "ring-[0.9cqmin] ring-[#FFE2A8]" : active ? "ring-4 ring-white" : picked === index ? "ring-4 ring-[#8CC63F]" : player.me ? "ring-2 ring-white/80" : "")}>
                {player.empty ? null : <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-[5] hidden h-[7cqmin] w-[7cqmin] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-[4cqmin] shadow [@media(hover:hover)]:group-hover:flex">{player.me ? "😊" : "🎁"}</span>}
                <img key={arrivedAt || "photo"} src={player.avatar} alt="" className={cn("h-full w-full rounded-[14%] object-cover", arriving && "animate-[seat-arrive_0.8s_ease-out] motion-reduce:animate-none")} />
                {arriving ? <span key={`ring-${arrivedAt}`} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[6] rounded-[14%] animate-[seat-ring_1.1s_ease-out_forwards] motion-reduce:hidden" /> : null}
                {fxAt > 0 ? <EnigmaEffect key={fxAt} label={arrivalLabel(locale, player.name)} /> : null}
                {frameOf(player) ? <FrameArt id={frameOf(player)} className={cn("pointer-events-none absolute z-[1]", frameOf(player) >= FIRST_ORIGINAL ? "-inset-[17%] h-[134%] w-[134%]" : "-inset-[9%] h-[118%] w-[118%]")} /> : null}
                {seatGes[player.me ? "me" : player.id] ? <img key={seatGes[player.me ? "me" : player.id].key} src={`/custom/anim/ges_${seatGes[player.me ? "me" : player.id].id}.webp`} alt="" className="pointer-events-none absolute inset-[12%] z-[4] h-[76%] w-[76%] max-w-none animate-[bottle-pop_0.25s_ease-out] object-contain drop-shadow-[0_3px_4px_rgba(0,0,0,0.4)]" /> : null}
                {player.me || dedicate ? null : <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[14%] bg-black/35 opacity-0 transition-opacity group-hover:opacity-100"><GiftIcon className="h-[38%] w-[38%] text-white" strokeWidth={1.6} /></span>}
                {dedicate && !player.me ? (chosen.includes(player.id)
                  ? <span className="absolute inset-0 z-10 flex items-center justify-center rounded-[14%] bg-[#8CC63F]/85 ring-[0.5cqmin] ring-[#B678E8]"><Check className="h-[45%] w-[45%] text-white drop-shadow" strokeWidth={4} /></span>
                  : <span className="absolute inset-0 z-10 flex items-center justify-center rounded-[14%] bg-black/25"><Plus className="h-[45%] w-[45%] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]" strokeWidth={3.5} /></span>) : null}
                {/* TOP lenti masada hələlik gizlidir (yalnız profil kartında görünür) */}
                {kisses[player.id] ? <LipsBadge count={kisses[player.id]} /> : null}
                {(() => {
                  const mine = stickers[player.id] ?? [];
                  const placeOf = (gift: string) => (gift.startsWith("c:") ? customPlace(gift.slice(2)) : headGifts.has(gift) ? "head" : "body");
                  const ears = [...mine].reverse().find((gift) => placeOf(gift) === "ears");
                  const face = mine.length && placeOf(mine[mine.length - 1]) === "face" ? mine[mine.length - 1] : null;
                  const head = [...mine].reverse().find((gift) => placeOf(gift) === "head");
                  const rest = mine.filter((gift) => placeOf(gift) === "body").slice(-1);
                  const hat = head ? hatSpot(head.startsWith("c:") ? head.slice(2) : giftFileName(head)) : null;
                  return <>
                    {(piles[player.id] ?? []).filter((item) => !canvasUrl(item.gift)).map((item) => <span key={item.key} className="pointer-events-none absolute z-[2] animate-[gift-drop_0.35s_ease-out] transition-opacity duration-[2000ms]" style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.s}%`, height: `${item.s}%`, transform: `rotate(${item.r}deg)`, opacity: pileNow - item.at > PILE_MS - 3000 ? 0 : 1 }}><Gift anim id={item.gift} className="h-full w-full drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]" /></span>)}
                    {face ? <Gift id={face} className="absolute left-[8%] top-[10%] z-[2] h-[84%] w-[84%] animate-[gift-drop_0.35s_ease-out]" /> : null}
                    {ears ? <Gift anim id={ears} className="pointer-events-none absolute -left-[34%] -top-[22%] z-[2] h-[58%] w-[104%] -rotate-45 animate-[gift-drop_0.35s_ease-out] drop-shadow" /> : null}
                    {head && hat ? <span key={head} className="pointer-events-none absolute z-[5]" style={{ left: `${hat.x}%`, top: `${hat.y}%`, width: `${hat.s}%`, height: `${hat.s}%`, transform: "rotate(-45deg)" }}><Gift anim id={head} className="h-full w-full animate-[gift-drop_0.35s_ease-out] drop-shadow" /></span> : null}
                    {spots[player.id]?.length ? spots[player.id].filter((spot) => !canvasCorners(spot)).map((spot) => <span key={spot.key} className={cn("pointer-events-none absolute", spot.kind === "behind" ? "-z-[1]" : spot.kind === "hatL" || spot.kind === "hatR" ? "z-[5]" : "z-[2]")} style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.s}%`, height: `${spot.s}%`, transform: spot.kind === "hatL" ? "rotate(-45deg)" : spot.kind === "hatR" ? "rotate(45deg)" : spot.r ? `rotate(${spot.r}deg)` : undefined }}><Gift anim once={spot.kind === "corner" || spot.kind === "balloon" ? spot.key : undefined} id={spot.gift} className={cn("h-full w-full drop-shadow", spot.x + spot.s / 2 < 45 ? "origin-bottom-left" : "origin-bottom-right", (spot.kind === "corner" || spot.kind === "balloon") && (spot.x + spot.s / 2 < 45 ? "object-left-bottom" : "object-right-bottom"), spot.kind === "balloon" ? "animate-[gift-grow_0.7s_ease-out_forwards]" : "animate-[gift-drop_0.35s_ease-out]")} /></span>)
                      : rest.map((gift) => <Gift anim key={`${gift}-${mine.length}`} id={gift} className="absolute bottom-0 right-0 z-[2] h-[58%] w-[58%] animate-[gift-drop_0.35s_ease-out] drop-shadow" />)}
                    {scatters.filter((item) => item.to === player.id).flatMap((item) => item.names.map((name, n) => <span key={`${item.key}-${n}`} className="pointer-events-none absolute left-1/2 top-1/2 z-[3] h-[26%] w-[26%]" style={{ animation: "gift-scatter 1s ease-out forwards", ["--dx" as string]: `${item.dirs[n][0]}cqmin`, ["--dy" as string]: `${item.dirs[n][1]}cqmin` }}><Gift anim id={name} className="h-full w-full drop-shadow" /></span>))}
                  </>;
                })()}
              </button>
              {(() => {
                const kick = online ? net?.seats.find((seat) => seat.id === (player.me ? net.me : player.id))?.kicked : null;
                if (!kick || !net) return null;
                const left = Math.max(0, Math.ceil(30 - (net.now - kick.at) / 1000));
                const self = Boolean(player.me);
                const canSave = self || kick.by !== net.me;
                return (
                  <div className="absolute left-0 top-0 z-[3] flex aspect-square w-full flex-col items-center justify-center rounded-[14%] bg-[#7F1D1D]/60 ring-[0.6cqmin] ring-[#EF4444]">
                    <img src={emojiSrc("🦶")} alt="" className="h-[42%] w-[42%] animate-pulse" />
                    <span className="text-[3.4cqmin] font-black tabular-nums text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">{left}</span>
                    {canSave ? <button onClick={(event) => { event.stopPropagation(); if (self && heartsRef.current < kickPrice) { setCardNote(`${t("bottle.noHearts")} (${kickPrice})`); return; } void bottleSave(self ? net.me : player.id).then(pullRef.current); }} className="absolute -bottom-[2.4cqmin] flex items-center gap-[0.6cqmin] whitespace-nowrap rounded-full bg-[linear-gradient(180deg,#9BD65A,#5DB13A)] px-[1.6cqmin] py-[0.5cqmin] text-[2.4cqmin] font-bold text-white shadow-lg"><img src={emojiSrc("🛟")} alt="" className="h-[3cqmin] w-[3cqmin]" />{self ? <>{t("bottle.kickDefend")} ❤{kickPrice}</> : t("bottle.saveBtn")}</button> : null}
                  </div>
                );
              })()}
              {/* Ad üst qatda ayrıca çəkilir (aşağıda), burada yalnız yer tutur */}
              <p aria-hidden="true" className="invisible mt-px truncate text-center text-[2.6cqmin] leading-tight">&nbsp;</p>
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

        {/* Adlar: çərçivələrin və qonşu oyunçuların üstündə, tam görünür */}
        {players.map((player, index) => {
          if (player.empty) return null;
          const active = index === turn || index === target;
          const framed = Boolean(frameOf(player));
          return (
            <div key={`name-${player.id}`} aria-hidden="true" className={cn("pointer-events-none absolute z-[31] -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-[1100ms] ease-in-out motion-reduce:duration-0", wide ? "w-[18.5cqmin]" : "w-[17.5cqmin]")} style={staged && active ? { left: `calc(${CENTER_X}% ${index === turn ? "-" : "+"} 12.5cqmin)`, top: `${STAGE_Y}%` } : { left: `${seats[index][0]}%`, top: `${seats[index][1]}%` }}>
              <div className="aspect-square w-full" />
              <p onClick={player.me ? undefined : (event) => { event.stopPropagation(); setDraft((value) => (value.startsWith(`${player.name}, `) ? value : `${player.name}, ${value}`)); setCard(false); setPicked(null); if (dedicate) chooseMode(false); window.setTimeout(() => chatRef.current?.focus(), 50); }} title={player.me ? undefined : t("bottle.chatMention")} className={cn("relative left-1/2 w-max max-w-[26cqmin] -translate-x-1/2 truncate px-[0.5cqmin] text-center text-[2.4cqmin] font-semibold leading-snug [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]", !player.me && "pointer-events-auto cursor-pointer hover:underline", framed ? "mt-[1.4cqmin]" : "mt-px", isAdminPlayer(player) ? "text-[#FFD54A]" : "text-white")}><span className={vipName(player)}>{isAdminPlayer(player) ? "👑 " : ""}{player.name}{!player.me && nameSuffix(player) ? ` [${nameSuffix(player)}]` : ""}{player.age ? `, ${player.age}` : ""}</span></p>
            </div>
          );
        })}

        {bursts.map((item) => <HeartBurst key={item.key} at={seats[item.to]} amount={item.amount} />)}
        {shows.map((item) => <Fireworks key={`fw-${item.key}`} at={seats[item.to]} level={item.level} seed={item.key} />)}
        {tableVfx ? <TableShower key={tableVfx.key} emoji={tableVfx.emoji} seed={tableVfx.key % 1000} /> : null}
        {boostFx ? <BoostFx key={boostFx.key} kind={boostFx.kind} fromLeft={boostFx.fromLeft} x={CENTER_X} y={STAGE_Y} /> : null}
        {canvasSeats ? <SeatGiftCanvas data={seatGiftData} /> : null}
        <FlightCanvas flights={canvasFlights} geometry={flightGeometry} />
        {flying.filter((item) => !flightUrl(WHOLE_FLIGHT.has(item.gift) ? item.gift : item.look ?? item.gift)).map((item) => <div key={item.key} className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2" style={{ width: `${item.base}cqmin`, height: `${item.base}cqmin`, left: seatLeft(item.from), top: seatTop(item.from) }}><span className="block h-full w-full" style={{ /* moved with transform only (GPU): smooth like butter, no layout work while flying */ transform: item.moved ? `translate(calc(${seatXq(item.to)} - ${seatXq(item.from)} + ${item.tx}cqmin), calc(${seatYq(item.to)} - ${seatYq(item.from)} + ${item.ty}cqmin))` : "translate(0, 0)", transition: `transform ${item.ms}ms cubic-bezier(0.3, 0.6, 0.7, 0.9)` }}><span className="block h-full w-full" style={{ animation: `gift-fly-to ${item.ms}ms ease-in-out both`, ["--end" as string]: item.end }}><span className="block h-full w-full" style={SPIN_FLIGHT.test(item.gift) ? { animation: `gift-turn ${item.ms}ms linear both` } : { transform: `rotate(${item.moved ? item.rot ?? 0 : 0}deg)`, transition: `transform ${item.ms}ms cubic-bezier(0.3, 0.6, 0.7, 0.9)` }}>{/* one look the whole way: the flower/colour that will land, no colour changes in flight */}<Gift anim={!item.still} id={WHOLE_FLIGHT.has(item.gift) ? item.gift : item.look ?? item.gift} className="h-full w-full" /></span></span></span></div>)}

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
            {boostOffer ? (
              <div className="absolute z-[31] -translate-x-1/2" style={{ left: `${CENTER_X}%`, top: `calc(${STAGE_Y}% + 24cqmin)` }}>
                <button onClick={() => fireBoost(boostOffer)} className={cn("flex h-[8.5cqmin] items-center gap-[1cqmin] rounded-full pl-[0.6cqmin] pr-[2.5cqmin] text-[3cqmin] font-black text-white shadow-lg ring-2 ring-white/80 motion-safe:animate-[balance-pulse_0.8s_ease-in-out_infinite]", boostOffer === "kiss_fire" ? "bg-[linear-gradient(180deg,#FF8A3D,#E8203A)]" : "bg-[linear-gradient(180deg,#9B7BFF,#5B3FD1)]")}>
                  <img src={`/custom/ui/${boostOffer}.webp`} alt="" className="h-[7.4cqmin] w-[7.4cqmin] object-contain" />
                  {t(boostOffer === "kiss_fire" ? "bottle.boostFire" : "bottle.boostSlap")} <span className="text-[2.4cqmin] opacity-80">×{items[boostOffer]}</span>
                </button>
              </div>
            ) : null}
            {canAnswer && myRole ? (
              <div className="absolute z-30 flex -translate-x-1/2 gap-[2.5cqmin]" style={{ left: `${CENTER_X}%`, top: `calc(${STAGE_Y}% + 14.5cqmin)` }}>
                <button onClick={() => { bumpStat("refusals"); setAnswers((value) => ({ ...value, [myRole]: false })); if (online) void bottleAnswer(false).then(pullRef.current); offerBoost("refuse_slap"); }} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#E2401F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.no")}</button>
                <button data-hint="kiss-button" onClick={() => { bumpStat("kissesGiven"); setAnswers((value) => ({ ...value, [myRole]: true })); if (online) void bottleAnswer(true).then(pullRef.current); offerBoost("kiss_fire"); }} className="h-[7.5cqmin] w-[20cqmin] rounded-[1.8cqmin] bg-[#8CC63F] text-[3cqmin] font-bold text-white shadow-lg hover:brightness-110">{t("bottle.yes")}</button>
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
                      {trackState === "fail" ? <p role="status" className="rounded-lg bg-[#FEE2E2] p-3 text-xs font-semibold text-[#991B1B]">{t("bottle.songFail")}{trackWhy ? <span className="mt-1 block text-[11px] font-medium">{ytHint(locale, trackWhy)}</span> : null}</p> : null}
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
                    {remote && trackState === "fail" ? <p role="status" className="rounded-lg bg-[#FEE2E2] p-3 text-xs font-semibold text-[#991B1B]">{t("bottle.songFail")}{trackWhy ? <span className="mt-1 block text-[11px] font-medium">{ytHint(locale, trackWhy)}</span> : null}</p> : null}
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
          <div className={cn(panel === "top" && !wide ? "fixed inset-0 z-[90]" : "absolute inset-0 z-50", "flex items-center justify-center overflow-hidden bg-black/35 p-3", closing ? "animate-[panel-fade_0.28s_ease-in_reverse_forwards]" : "animate-[panel-fade_0.25s_ease-out]")} onClick={(event) => { event.stopPropagation(); closePanel(); }}>
            <div role="dialog" aria-modal="true" aria-label={panel === "market" ? marketLabel(locale) : panel === "smiles" ? smileText.title : t(`bottle.${panel}`)} onClick={(event) => event.stopPropagation()} className={cn("relative max-h-full origin-top rounded-2xl shadow-2xl motion-reduce:animate-none", panel !== "top" && panel !== "shop" && panel !== "league" && panel !== "kick" && panel !== "pass" && "p-3", panel === "shop" ? "w-auto" : "w-full", closing ? "animate-[panel-up_0.28s_ease-in_forwards]" : "animate-[panel-drop_0.7s_cubic-bezier(0.22,1,0.36,1)]", panel === "shop" ? "flex max-h-[94%] max-w-[93%] flex-col rounded-[17px] bg-[#FFF0F0]" : panel === "wheel" || panel === "chances" || panel === "smiles" ? "max-w-[380px] bg-[linear-gradient(180deg,#12998C,#7FD8C8)]" : panel === "top" ? "flex h-[93%] max-w-[420px] flex-col rounded-[17px] bg-white p-0" : panel === "league" ? "flex max-h-[90%] max-w-[420px] flex-col rounded-[17px] bg-white" : panel === "kick" ? "max-w-[360px] rounded-[17px] bg-white" : panel === "achievements" ? "max-w-[400px] bg-white" : panel === "frames" ? "max-w-[440px] bg-[#F7F7F8]" : panel === "pass" ? "flex h-[90%] max-w-[420px] flex-col rounded-[17px] bg-white" : panel === "rooms" ? "max-w-[400px] border border-[#F5C451]/30 bg-[linear-gradient(165deg,#2B1D4E,#4E2D7C)]" : "max-w-[340px] bg-white")}>
              <button onClick={() => closePanel()} aria-label={t("photos.close")} title={t("photos.close")} className={cn("absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white shadow", panel === "shop" ? "z-20 h-8 w-8 border-0 bg-[url(/custom/orig/popup_btn_close.svg)] bg-[length:16px_16px] bg-center bg-no-repeat text-transparent shadow-[0_4px_8px_rgba(0,0,0,0.2)] [&>svg]:hidden" : panel === "wheel" || panel === "chances" || panel === "smiles" ? "border-[#0E8478] text-[#0E8478]" : panel === "top" || panel === "pass" || (panel === "league" && leagueHead === "up") ? "border-0 text-transparent [&>svg]:hidden bg-[url(/custom/orig/popup_btn_close_league_up.svg)] bg-[length:16px_16px] bg-center bg-no-repeat" : panel === "league" && leagueHead === "down" ? "border-0 text-transparent [&>svg]:hidden bg-[url(/custom/orig/popup_btn_close_league_down.svg)] bg-[length:16px_16px] bg-center bg-no-repeat" : panel === "league" || panel === "kick" ? "border-0 text-transparent [&>svg]:hidden bg-[url(/custom/orig/popup_btn_close.svg)] bg-[length:16px_16px] bg-center bg-no-repeat" : panel === "rooms" ? "border-[#F5C451] text-[#C08A12]" : "border-[#8CC63F] text-[#8CC63F]")}><X size={18} strokeWidth={3} /></button>
              <p className={cn("mb-1 text-center text-sm font-bold", panel === "wheel" || panel === "chances" || panel === "smiles" || panel === "rooms" ? "mb-2 text-white" : "text-[#9CA3AF]", (panel === "top" || panel === "achievements" || panel === "league" || panel === "shop" || panel === "kick" || panel === "pass") && "sr-only")}>{panel === "market" ? marketLabel(locale) : panel === "smiles" ? smileText.title : t(`bottle.${panel}`)}</p>
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
                              <img src={room.owner?.avatar || NO_PHOTO} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-2 ring-[#F5C451]/60" />
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
                        <li key={friend.id}><button onClick={() => void moveTo(friend.table)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-sm hover:bg-black/5 disabled:opacity-50">
                          <img src={friend.avatar || NO_PHOTO} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" /><span className="min-w-0 flex-1 truncate font-semibold">{gameName(friend.name)}</span>{friend.friend === false ? <span title={t("bottle.roomKnown")} className="shrink-0 text-sm">🎁</span> : null}<span className="shrink-0 text-xs text-[#9CA3AF]">#{friend.table}</span>{counts(friend.table)}
                        </button></li>
                      ))}
                    </ul>
                    <p className="mb-1 mt-3 border-t border-[#E5E7EB] pt-2 text-xs font-semibold text-[#9CA3AF]">{t("bottle.roomList")}</p>
                    {!rooms ? <p className="py-2 text-center text-xs text-[#6B7280]">{t("bottle.songLoading")}</p> : null}
                    <ul>
                      {ordered.map((room) => (
                        <li key={room.id}><button onClick={() => void moveTo(room.id)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-1 text-left text-sm hover:bg-black/5 disabled:opacity-50">
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
                  {net?.winner ? <p className="mt-2 rounded-lg bg-black/25 p-2 text-center text-xs"><b className="text-[#FDE047]">{t("bottle.wheelWinner")}:</b> {gameName(net.winner.name)} — ❤ {net.winner.amount}</p> : null}
                </div>
              ) : panel === "smiles" ? (
                <div>
                  <p className="mb-2 flex items-center justify-center gap-1.5 rounded-lg bg-white/90 py-1.5 text-sm font-bold text-[#134E4A]">{t("bottle.balance")}: <Heart size={15} fill="#F4511E" stroke="none" /><span className="tabular-nums">{online && !net ? "…" : hearts}</span> · 😀 <span className="tabular-nums">{smiles}</span></p>
                  <ul className="grid grid-cols-3 gap-1.5">
                    {smilePacks.map(([pack, price]) => (
                      <li key={pack}>
                        <button onClick={() => void buySmiles(pack, price)} className={cn("flex w-full flex-col items-center rounded-xl bg-white p-2 text-center hover:brightness-95", hearts < price && "opacity-50")}>
                          <span className="text-base font-black tabular-nums text-[#0E8478]">{pack}</span>
                          <span aria-hidden="true" className="my-1 text-3xl">😀</span>
                          <span className="flex items-center gap-1 text-sm font-bold tabular-nums text-[#1F2937]"><Heart size={13} fill="#F4511E" stroke="none" />{price}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {payNote ? <p role="status" className="mt-2 rounded-lg bg-white/90 p-2 text-center text-xs font-semibold text-[#7F1D1D]">{t("bottle.noHearts")}</p> : null}
                  <button onClick={() => setPanel("gestures")} className="mt-2 w-full text-center text-xs font-bold text-white underline">{smileText.back}</button>
                </div>
              ) : panel === "chances" ? (
                <div>
                  <p className="mb-2 flex items-center justify-center gap-1.5 rounded-lg bg-white/90 py-1.5 text-sm font-bold text-[#134E4A]">{t("bottle.balance")}: <Heart size={15} fill="#F4511E" stroke="none" /><span className="tabular-nums">{online && !net ? "…" : hearts}</span> · 🎲 <span className="tabular-nums">{chances}</span></p>
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
                <ShopPanel hearts={hearts} activeSecs={activeSecs} payNote={payNote} onActive={() => setPanel("active")} onTelegram={() => (TELEGRAM_URL ? window.open(TELEGRAM_URL, "_blank", "noopener") : setPayNote(true))} onVip={() => { setPayNote(false); setPanel("vip"); }} onInvite={openInvite} onCompliments={() => setPanel("compliments")} onPack={(pack) => void buyHeartPack(pack)} packNote={packNote && packNote.kind !== "ok" ? <PackNote note={packNote} locale={locale} /> : null} onPass={openPass} />
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
                // The original kick window (bottle-html5 KickoutDialog + kickout CSS).
                <div className="flex flex-col text-[#424242]">
                  <div className="relative flex h-11 shrink-0 items-center justify-center px-10">
                    <button onClick={() => setKickHelp(true)} aria-label={t("bottle.kickHelpTitle")} title={t("bottle.kickHelpTitle")} className="absolute left-0 top-0 h-[33px] w-[38px]"><span aria-hidden="true" className="absolute left-3.5 top-[9px] h-[15px] w-[11px] bg-contain bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/league_manual_icon.svg)" }} /></button>
                    <p className="truncate text-[14px] font-bold text-[#CFCFCF]">{t("bottle.kickHeader")}</p>
                  </div>
                  <div className="px-[15px] text-[14px] leading-[18px]">
                    <div className="flex w-full items-center">
                      <span className="relative h-[62px] w-[62px] shrink-0 rounded-lg bg-cover bg-top" style={{ backgroundImage: `url(${kickFor.avatar || NO_PHOTO})` }}><span aria-hidden="true" className="absolute -bottom-[11px] -right-2.5 h-9 w-[42px] bg-contain bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/kickout_icon_kick.svg)" }} /></span>
                      <p className="ml-3">{(() => { const [a, b = ""] = t("bottle.kickAskFull").split("{name}"); return <>{a}<b className="text-[#2F6FD6]">{kickFor.name}</b>{b}</>; })()}</p>
                    </div>
                    <p className="mb-[9px] mt-[17px] whitespace-pre-wrap rounded-[10px] bg-[#FFFAE2] px-[7px] pb-2.5 pt-[9px] text-center leading-[1.23]">{liveVip ? t("bottle.kickWarn") : t("bottle.kickNeedVip")}</p>
                    <p className="flex items-center justify-center gap-1 text-center">{t("bottle.kickPrice")} <b className="bg-no-repeat pl-4 text-[rgb(255,62,0)] [background-position:left_center] [background-size:14px_11px]" style={{ backgroundImage: "url(/custom/orig/bank_heart.svg)" }}>{kickPrice}</b></p>
                    {kickNote ? <p role="status" className="text-center text-[12px] font-semibold text-[#E03D1F]">{kickNote}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center justify-center gap-5 p-[15px]">
                    <OrigButton kind="cancel" onClick={() => setPanel(null)}>{t("bottle.kickCancel")}</OrigButton>
                    {liveVip ? <OrigButton onClick={() => void doKick()}>{t("bottle.kickDo")}</OrigButton> : <OrigButton kind="info" onClick={() => setPanel("vip")}>{t("bottle.details")}</OrigButton>}
                  </div>
                  {kickHelp ? (
                    <OrigPopup z="z-[70]" title={t("bottle.kickHelpTitle")} onClose={() => setKickHelp(false)} buttons={<OrigButton onClick={() => setKickHelp(false)}>{t("bottle.lockOk")}</OrigButton>}>
                      <div className="space-y-3 text-[14px] leading-[18px] text-[#424242]">
                        {[["kickout_help_icon_kick", "bottle.kickHelp1"], ["kickout_help_icon_timer", "bottle.kickHelp2"], ["kickout_help_icon_vip", "bottle.kickHelp3"]].map(([icon, key]) => (
                          <div key={key} className="flex items-start gap-3"><span aria-hidden="true" className="h-9 w-9 shrink-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(/custom/orig/${icon}.svg)` }} /><p>{t(key as "bottle.kickHelp1")}</p></div>
                        ))}
                      </div>
                    </OrigPopup>
                  ) : null}
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
                  <label className={row}><Music size={20} className="w-6 shrink-0 text-[#EC4899]" /><span className="flex-1">{t("bottle.music")}</span><input type="range" min={0} max={100} value={music} onChange={(event) => setMusic(Number(event.target.value))} className="w-24 accent-[#8CC63F]" /></label>
                  <button onClick={invite} className={row}><UserPlus size={20} className="w-6 text-[#8CC63F]" />{copied ? t("bottle.copied") : t("bottle.invite")}</button>
                  <Link href="/friends" className={row}><Users size={20} className="w-6 text-[#3B82F6]" />{t("bottle.myFriends")}</Link>
                  {TELEGRAM_URL ? <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={row}><SendHorizontal size={20} className="w-6 text-[#229ED9]" />{t("bottle.telegram")}</a> : <button onClick={() => setCopied(false)} disabled className={cn(row, "opacity-60")}><SendHorizontal size={20} className="w-6 text-[#229ED9]" /><span>{t("bottle.telegram")}<span className="block text-[11px] text-[#6B7280]">{t("bottle.telegramSoon")}</span></span></button>}
                  <Link href="/settings" className={row}><UserRoundCog size={20} className="w-6 text-[#3B82F6]" />{t("bottle.profileSettings")}</Link>
                </div>
              ) : panel === "top" ? (() => {
                // The original ratings dialog (bottle-html5 TopsDialog + top-dlg CSS): a blue header with five round tabs,
                // the title and a period picker, then 48px rows on a light background with "Top-10 / Top-25" borders.
                const O = "/custom/orig/";
                const kinds = [["kisses", "total_kisses", "ic_top_total_kisses", "32px 24px", "28px 20px", "rgb(219,49,0)"], ["songs", "dj_score", "ic_top_dj_score", "33px 24px", "22px 22px", "rgb(180,93,140)"], ["dear", "price", "ic_top_price", "29px 24px", "26px 20px", "rgb(220,54,0)"], ["influence", "harem_price", "ic_top_harem_price", "34px 24px", "29px 20px", "rgb(220,54,0)"], ["smiles", "gestures", "token", "23px 23px", "20px 20px", "rgb(252,131,0)"]] as const;
                const kind = topKind === "help" ? "kisses" : topKind;
                const ki = Math.max(0, kinds.findIndex(([key]) => key === kind));
                const [, code, iconName, iconSize] = kinds[ki];
                const color = kinds[ki][5];
                const periods = kind === "dear" || kind === "influence" ? (["all"] as const) : (["all", "month", "week", "day"] as const);
                const periodLabel = (period: string) => t(period === "all" ? "bottle.topAll" : period === "month" ? "bottle.topMonth" : period === "week" ? "bottle.topWeek" : "bottle.topDay");
                const local = seated.map((player) => ({ id: player.id, name: player.me ? t("common.you") : player.name, avatar: player.avatar, count: kind === "kisses" ? kisses[player.id] ?? 0 : 0 })).filter((row) => row.count > 0).sort((a, b) => b.count - a.count).map((row, index) => ({ ...row, place: index + 1 }));
                const rows = online ? topData?.list ?? null : local;
                const meId = online ? net?.me : "me";
                const mine = online ? topData?.me ?? null : (() => { const row = local.find((item) => item.id === "me"); return row ? { place: row.place, count: row.count } : null; })();
                const me = players[meIndex];
                const list = rows === null ? null : rows.some((row) => row.id === meId) ? rows : [...rows, { id: meId ?? "me", name: me?.name ?? "", avatar: me?.avatar ?? null, count: mine?.count ?? 0, place: mine?.place ?? 0 }];
                const go = (step: number) => { const next = kinds[(ki + step + kinds.length) % kinds.length][0]; if (next === "dear" || next === "influence") setTopPeriod("all"); setTopKind(next); setTopMenu(false); };
                const border = (start: number, end: number) => (
                  <li key={`b${start}`} aria-hidden="true" className="flex shrink-0 basis-[50px] flex-col justify-center text-[11px] text-black/30">
                    <span className="flex w-full justify-center border-b border-black/10 pb-1.5">{t("bottle.topBorder").replace("{n}", String(start))}</span>
                    <span className="flex w-full justify-center pt-[5px]">{t("bottle.topBorder").replace("{n}", String(end))}</span>
                  </li>
                );
                return (
                  <div className="flex h-full min-h-0 flex-col text-black" onTouchStart={(event) => { topSwipe.current = event.touches[0].clientX; }} onTouchEnd={(event) => { const dx = event.changedTouches[0].clientX - topSwipe.current; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); }}>
                    <div className="relative flex shrink-0 flex-col items-center justify-center rounded-tl-[17px] rounded-tr-[17px] border-b border-black/[0.06] bg-[#83C7FF] px-[15px] pt-1.5">
                      <button onClick={() => setTopHelp(true)} aria-label={t("bottle.topHelp")} title={t("bottle.topHelp")} className="absolute left-0 top-0 h-[33px] w-[33px]"><span aria-hidden="true" className="absolute left-[11px] top-[9px] h-[15px] w-[11px] bg-contain bg-no-repeat" style={{ backgroundImage: `url(${O}league_manual_icon_up_down.svg)` }} /></button>
                      <div role="tablist" className="flex h-12 shrink-0 items-center justify-center">
                        {kinds.map(([key, , icon, on, off]) => <button key={key} role="tab" aria-selected={kind === key} aria-label={t(`bottle.topT_${key}`)} title={t(`bottle.topT_${key}`)} onClick={() => go(kinds.findIndex(([k]) => k === key) - ki)} className="h-12 w-12 shrink-0 cursor-pointer rounded-full bg-center bg-no-repeat transition-colors duration-500 active:bg-[#6DBAF9]" style={{ backgroundImage: `url(${O}${kind === key ? icon : icon === "token" ? "token_blue" : `${icon}_disabled`}.svg)`, backgroundSize: kind === key ? on : off }} />)}
                      </div>
                      <div className="mb-1.5 flex h-6 w-full items-center justify-between">
                        <p className="truncate text-[14px] leading-[14px] text-white">{t(`bottle.topT_${kind}`)}</p>
                        {periods.length > 1 ? (
                          <div className="relative inline-block">
                            <button onClick={(event) => { event.stopPropagation(); setTopMenu(!topMenu); }} aria-expanded={topMenu} aria-label={t("bottle.topPeriod")} className="relative flex w-[100px] items-center rounded-xl bg-[#6DBAF9] px-2 pb-1.5 pt-[5px] text-[11px] italic text-white after:absolute after:right-2 after:top-1/2 after:h-2 after:w-2 after:border-b after:border-r after:border-white after:transition-transform after:duration-300 after:content-[''] after:[transform:translateY(-75%)_rotate(45deg)] aria-expanded:after:[transform:translateY(-25%)_rotate(-135deg)]">{periodLabel(topPeriod)}</button>
                            <div role="menu" className={cn("absolute left-0 right-0 top-full z-[2] mt-[3px] min-w-full rounded-xl bg-white shadow-[0_3px_7px_rgba(0,0,0,0.2)] transition-all duration-300", topMenu ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-[15px] opacity-0")}>
                              {periods.map((period) => <button key={period} role="menuitem" onClick={() => { setTopPeriod(period); setTopMenu(false); }} className="relative flex h-8 w-full items-center whitespace-nowrap border-b border-[rgba(0,90,168,0.05)] bg-[#E0F1FF] pl-2 pr-6 text-[11px] italic text-[#7CACD5] transition-colors first:rounded-t-xl last:rounded-b-xl last:border-b-0 hover:bg-[#B2DAFD] hover:text-white">{periodLabel(period)}{topPeriod === period ? <span aria-hidden="true" className="absolute right-[5px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 bg-contain bg-no-repeat" style={{ backgroundImage: `url(${O}ic_top_selected.svg)` }} /> : null}</button>)}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <ol className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-b-[17px] bg-repeat-x pb-[15px] [background-attachment:local] [background-position:0_-12px] [background-size:auto_273px] [scrollbar-width:none]" style={{ backgroundImage: `url(${O}ic_top_bg.svg)` }} onClick={() => setTopMenu(false)}>
                      {list === null ? <li className="flex flex-1 items-center justify-center py-10"><span aria-label={t("bottle.songLoading")} className="h-7 w-7 animate-spin bg-contain bg-no-repeat" style={{ backgroundImage: `url(${O}icon_loading.svg)` }} /></li>
                        : list.length === 0 ? <li className="py-8 text-center text-xs text-black/40">{t("bottle.topEmpty")}</li>
                        : list.flatMap((row, index) => {
                          const viewer = row.id === meId;
                          const open = () => { if (!viewer || !online) showUserCard({ id: row.id, name: row.name ?? "", avatar: row.avatar ?? "" }); else showUserCard({ id: "me", name: me?.name ?? "", avatar: me?.avatar ?? "" }); };
                          const item = (
                            <li key={row.id} className={cn("flex shrink-0 basis-12 items-center px-[15px] first:mt-1.5", viewer && "sticky -bottom-[3px] -top-px z-[1] bg-white shadow-[0_-1px_0_rgba(0,0,0,0.06)] first:mt-0")}>
                              <button onClick={open} aria-label={row.name ?? ""} className="h-[42px] w-[42px] shrink-0 rounded-[4px] bg-cover bg-top bg-no-repeat" style={{ backgroundImage: `url(${row.avatar || NO_PHOTO})` }} />
                              <div className={cn("flex h-9 min-w-0 flex-1 items-center rounded-r-[7px]", viewer && "bg-[#FFF5AE]")}>
                                <b className="ml-2 shrink-0 text-[14px] tabular-nums">{row.place ? `${row.place}. ` : ""}</b>
                                <button onClick={open} className={cn("ml-0.5 w-px min-w-0 flex-1 truncate text-left text-[14px] leading-4", nameColors[row.id] ? nameColorClass(nameColors[row.id]) : row.place && row.place <= 3 ? "gold-name font-extrabold" : row.place && row.place > 10 ? ("vip" in row && row.vip ? ("gender" in row && row.gender === "female" ? "bg-[linear-gradient(90deg,#FF2D55,#FF6FB5,#B15CFF)] bg-clip-text font-extrabold text-transparent" : "font-extrabold text-[#1E3A8A]") : "gender" in row && row.gender === "female" ? "font-bold text-[#E11D48]" : "font-bold text-[#2563EB]") : topKind === "dear" ? "font-bold text-[#16A34A]" : topKind === "songs" || topKind === "smiles" || topKind === "influence" ? "font-bold text-[#E0A100]" : "")}>{viewer ? me?.name ?? row.name : row.name}</button>
                                <span aria-hidden="true" className="shrink-0 bg-contain bg-no-repeat" style={{ backgroundImage: `url(${O}${iconName}.svg)`, width: iconSize.split(" ")[0], height: iconSize.split(" ")[1] }} />
                                <b className="ml-[7px] min-w-[73px] shrink-0 text-left text-[14px] tabular-nums" style={{ color }}>{row.count.toLocaleString("ru-RU")}</b>
                              </div>
                            </li>
                          );
                          return index === 10 ? [border(10, 25), item] : index === 25 ? [border(25, 50), item] : [item];
                        })}
                    </ol>
                    {topHelp ? (
                      <OrigPopup z="z-[70]" title={t(`bottle.topH_${code}`)} onClose={() => setTopHelp(false)} buttons={<OrigButton onClick={() => setTopHelp(false)}>{t("bottle.lockOk")}</OrigButton>}>
                        <p className="whitespace-pre-line text-center text-[14px] leading-[18px] text-[#424242]">{t(`bottle.topX_${code}`)}{"\n\n"}{t("bottle.topXCommon")}</p>
                      </OrigPopup>
                    ) : null}
                  </div>
                );
                            })() : panel === "menu" ? (
                <div className="max-h-[70cqmin] overflow-y-auto">
                  <Link href="/messages" className={row}><span aria-hidden="true" className="w-6 text-center text-lg">✉️</span>{t("nav.messages")}</Link>
                  <button onClick={() => setPanel("achievements")} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">🏅</span>{t("bottle.achievements")}</button>
                  <button onClick={() => { setTopKind("kisses"); setPanel("top"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">📊</span>{t("bottle.rating")}</button>
                  <button onClick={() => { setPayNote(false); setPanel("bottles"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">🍾</span>{t("bottle.bottles")}</button>
                  <button onClick={() => { setPayNote(false); setPanel("market"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">💎</span>{marketLabel(locale)}</button>
                  <button onClick={() => { setPayNote(false); setPanel("frames"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">🖼️</span>{t("bottle.frames")}</button>
                  <button onClick={() => { setPayNote(false); setPanel("boosters"); }} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">⚡</span>{t("bottle.boosters")}</button>
                  <button onClick={() => setPanel("rules")} className={row}><span aria-hidden="true" className="w-6 text-center text-lg">📖</span>{t("bottle.rules")}</button>
                </div>
              ) : panel === "league" ? (() => {
                // The original league window (bottle-html5 LeagueDialog + league CSS): a blue part with the cup on an altar
                // and the ones who move up, a white part with those who stay, a pink part with those who go down.
                // The header takes the colour of the part you are looking at.
                void leagueTick;
                const O = "/custom/orig/";
                if (!league) return <div className="flex flex-1 items-center justify-center py-16"><span aria-label={t("bottle.songLoading")} className="h-7 w-7 animate-spin bg-contain bg-no-repeat" style={{ backgroundImage: `url(${O}icon_loading.svg)` }} /></div>;
                const left = Math.max(0, league.ends_ms - league.now_ms - (Date.now() - league.at));
                const days = Math.floor(left / 86400000), hours = Math.floor((left % 86400000) / 3600000), minutes = Math.floor((left % 3600000) / 60000);
                const size = league.users.length;
                const zone = (place: number) => (place <= league.move && league.league < 4 ? "up" : place > Math.max(size - league.move, league.move) && league.league > 0 ? "down" : "stay");
                const meId = online ? net?.me : "me";
                const groups = { up: league.users.filter((user) => zone(user.place) === "up"), stay: league.users.filter((user) => zone(user.place) === "stay"), down: league.users.filter((user) => zone(user.place) === "down") };
                const head = leagueHead;
                const user = (row: (typeof league.users)[number]) => {
                  const viewer = row.id === meId;
                  const prize = league.prizes[row.place - 1] ?? 0;
                  const present = prize > 0 ? (row.place < 4 ? ["league_first_gift", "league_second_gift", "league_third_gift"][row.place - 1] : "league_regular_gift") : null;
                  return (
                    <div key={row.id} className="mx-[15px] my-1 flex shrink-0 basis-[42px] items-center last:mb-[15px]">
                      <button onClick={() => showUserCard({ id: viewer && !online ? "me" : row.id, name: row.name ?? "", avatar: row.avatar ?? "" })} aria-label={row.name ?? ""} className="h-[42px] w-[42px] shrink-0 rounded-[4px] bg-[#F7F5F6] bg-cover bg-top" style={{ backgroundImage: `url(${row.avatar || NO_PHOTO})` }} />
                      <div className={cn("flex h-9 min-w-0 flex-1 items-center justify-between rounded-r-[9px] px-1.5 text-black", viewer && "bg-[#FFF5AE]")}>
                        <p className="min-w-0 truncate text-[14px] leading-4"><b>{row.place}.</b> {viewer ? t("common.you") : row.name}</p>
                        <div className="flex shrink-0 items-center">
                          <div className="relative flex w-[107px] shrink-0 justify-end">
                            <span aria-hidden="true" className="absolute left-0 top-1/2 h-6 w-[25px] -translate-y-1/2 bg-contain bg-no-repeat" style={{ backgroundImage: `url(${O}league_star_icon.svg)` }} />
                            <span className="flex w-[65px] shrink-0 justify-center rounded-b-[10px] rounded-tr-[10px] bg-black/[0.03] px-3.5 text-[14px] font-bold leading-[1.43] tabular-nums shadow-[inset_0_0_12px_rgba(0,0,0,0.08)]">{row.score}</span>
                          </div>
                          {present ? <button onClick={() => setLeaguePrize({ place: row.place, prize })} aria-label={t("bottle.leaguePrize").replace("{n}", String(row.place))} className="relative ml-2 h-[26px] w-[30px] shrink-0"><span aria-hidden="true" className="absolute inset-0 bg-contain bg-center bg-no-repeat drop-shadow-[0_1px_1px_rgba(0,0,0,0.33)]" style={{ backgroundImage: `url(${O}${present}.svg)` }} /></button> : <span className="ml-2 w-[30px] shrink-0" />}
                        </div>
                      </div>
                    </div>
                  );
                };
                const label = (text: string, light: boolean) => <p className={cn("my-[5px] self-center text-[12px] leading-none", light ? "text-white/70" : "text-[#B2B2B3]")}>{text}</p>;
                const bars = [[t("bottle.leagueTotal"), league.today, league.limit], [t("bottle.leagueKiss"), league.today_kiss ?? league.today, league.kiss_limit ?? league.limit], [t("bottle.leagueGift"), league.today_gift ?? 0, league.gift_limit ?? league.limit]] as const;
                return (
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[17px] bg-white text-black">
                    <div className={cn("relative flex h-11 shrink-0 items-center justify-center rounded-t-[17px] px-10 transition-colors duration-[250ms]", head === "up" ? "bg-[#4EB0FF] shadow-[0_1px_0_#4EB0FF]" : head === "down" ? "bg-[#FF7482] shadow-[0_1px_0_#FF7482]" : "bg-white")}>
                      <button onClick={() => setLeagueHelp(true)} aria-label={t("bottle.leagueManualTitle")} title={t("bottle.leagueManualTitle")} className="absolute left-0 top-0 h-[33px] w-[38px]"><span aria-hidden="true" className="absolute left-3.5 top-[9px] h-[15px] w-[11px] bg-contain bg-no-repeat" style={{ backgroundImage: `url(${O}${head === "stay" ? "league_manual_icon" : "league_manual_icon_up_down"}.svg)` }} /></button>
                      <p className={cn("truncate text-[14px] font-bold transition-colors duration-[250ms]", head === "stay" ? "text-[#CFCFCF]" : "text-white")}>{t(`bottle.league${league.league}` as "bottle.league0")}</p>
                    </div>
                    <div ref={leagueBoxRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-b-[17px] [scrollbar-width:none]" onScroll={(event) => { const box = event.currentTarget; const up = leagueUpRef.current?.clientHeight ?? 0; const stay = leagueStayRef.current?.clientHeight ?? 0; setLeagueHead(box.scrollTop < up + 1 ? "up" : box.scrollTop > up + stay ? "down" : "stay"); }}>
                      <div ref={leagueUpRef} className="flex flex-col bg-[#4EB0FF] shadow-[0_1px_0_#4EB0FF]">
                        <div className="mx-6 mb-1.5 flex items-start justify-between">
                          <div className="my-auto mr-2 flex flex-col">
                            <p className="whitespace-pre-wrap text-[16px] font-bold italic leading-[1.13] text-white">{t("bottle.leagueDescRun")}</p>
                            <p className="mt-2 text-[12px] font-bold text-white/85">⏳ {t("bottle.leagueEnds")} {days ? `${days}${t("bottle.leagueD")} ` : ""}{hours}{t("bottle.leagueH")} {minutes}{t("bottle.leagueM")}</p>
                          </div>
                          <button onClick={() => setLadder(true)} aria-label={t("bottle.leagueLadderTitle")} title={t("bottle.leagueLadderTitle")} className="relative flex h-[90px] w-[92px] shrink-0 cursor-pointer items-end justify-center bg-[length:92px_90px] bg-no-repeat" style={{ backgroundImage: `url(${O}league_altar_icon.svg)` }}>
                            <LeagueBadge league={league.league} className="mb-[22px] h-[52px] w-[52px] drop-shadow" />
                            <span aria-hidden="true" className="absolute bottom-1 right-1 h-4 w-4 bg-contain bg-no-repeat" style={{ backgroundImage: `url(${O}league_ladder_icon.svg)` }} />
                          </button>
                        </div>
                        <div className="mx-[15px] mb-2 grid grid-cols-3 gap-2">
                          {bars.map(([name, value, max]) => (
                            <div key={name} className="min-w-0">
                              <p className="flex justify-between gap-1 text-[10px] font-bold text-white"><span className="truncate">{name}</span><span className="tabular-nums">{value}/{max}</span></p>
                              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/15"><div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (Number(value) / Math.max(1, Number(max))) * 100)}%` }} /></div>
                            </div>
                          ))}
                        </div>
                        {league.today >= league.limit ? <p className="mx-[15px] mb-1 text-center text-[11px] font-bold text-white">{t("bottle.leagueLimit")}</p> : null}
                        <div className="flex flex-col">{groups.up.length ? <>{groups.up.map(user)}{label(t("bottle.leagueDescUp"), true)}</> : null}</div>
                      </div>
                      <div ref={leagueStayRef} className="flex flex-col">
                        {groups.stay.length ? <>{label(t("bottle.leagueDescStay"), false)}{groups.stay.map(user)}{label(t("bottle.leagueDescStay"), false)}</> : size === 0 ? <p className="py-6 text-center text-xs text-[#B2B2B3]">{t("bottle.leagueEmpty")}</p> : null}
                      </div>
                      <div className="flex flex-col bg-[#FF7482] shadow-[0_1px_0_#FF7482]">
                        {groups.down.length ? <>{label(t("bottle.leagueDescDown"), true)}{groups.down.map(user)}</> : null}
                      </div>
                    </div>
                    {ladder ? (
                      <OrigPopup z="z-[70]" title={t("bottle.leagueLadderTitle")} onClose={() => setLadder(false)}>
                        <div className="-mx-[15px] flex items-center justify-between px-[15px] pb-[15px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
                          <p className="mr-1 whitespace-pre-wrap text-[14px] font-bold italic leading-[1.29]">{t("bottle.leagueLadderDesc")}</p>
                          <span aria-hidden="true" className="h-[58px] w-20 shrink-0 bg-contain bg-no-repeat" style={{ backgroundImage: `url(${O}league_ladder_info_icon.svg)` }} />
                        </div>
                        <div className="-mx-[15px] -mb-[15px] bg-[#F2F2F2] px-[15px] pb-[15px] pt-2">
                          {[4, 3, 2, 1, 0].map((level) => {
                            const state = level === league.league ? "current" : level > league.league ? "locked" : "done";
                            return (
                              <div key={level} className={cn("mb-2 flex h-[58px] items-center justify-between rounded-lg pl-1.5 pr-3.5 last:mb-0", state === "current" ? "bg-[#4EB0FF] text-white" : "bg-white")}>
                                <div className={cn("flex items-center", state === "locked" && "opacity-50")}>
                                  <LeagueBadge league={level} className="h-[50px] w-[51px] shrink-0" />
                                  <div className="ml-2 flex flex-col justify-center">
                                    <p className={cn("text-[14px]", state === "current" && "font-bold")}>{t(`bottle.league${level}` as "bottle.league0")}</p>
                                    {state === "current" ? <p className="text-[13px]">{t("bottle.leagueHere")}</p> : null}
                                  </div>
                                </div>
                                <span aria-hidden="true" className={cn("shrink-0 bg-contain bg-no-repeat", state === "locked" ? "h-7 w-[22px]" : "h-6 w-6 drop-shadow-[0_1px_3px_rgba(0,0,0,0.22)]")} style={{ backgroundImage: `url(${O}${state === "locked" ? "league_ladder_icon_locked" : state === "current" ? "league_ladder_icon_white" : "league_ladder_icon_blue"}.svg)` }} />
                              </div>
                            );
                          })}
                        </div>
                      </OrigPopup>
                    ) : null}
                    {leagueHelp ? (
                      <OrigPopup z="z-[70]" title={t("bottle.leagueManualTitle")} onClose={() => setLeagueHelp(false)} buttons={<OrigButton onClick={() => setLeagueHelp(false)}>{t("bottle.leagueManualBtn")}</OrigButton>}>
                        <p className="whitespace-pre-line text-[14px] leading-[18px] text-[#424242]">{t("bottle.leagueRules").replaceAll("{n}", String(league.move))}</p>
                      </OrigPopup>
                    ) : null}
                    {leaguePrize ? (
                      <OrigPopup z="z-[70]" title={t("bottle.leaguePrize").replace("{n}", String(leaguePrize.place))} onClose={() => setLeaguePrize(null)} buttons={<OrigButton onClick={() => setLeaguePrize(null)}>{t("bottle.lockOk")}</OrigButton>}>
                        <div className="flex flex-col items-center gap-2">
                          <span aria-hidden="true" className="h-[52px] w-[60px] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${O}${leaguePrize.place < 4 ? ["league_first_gift_big", "league_second_gift_big", "league_third_gift_big"][leaguePrize.place - 1] : "league_regular_gift_big"}.svg)` }} />
                          <p className="text-[18px] font-bold text-[rgb(255,62,0)]"><span className="bg-no-repeat pl-[22px] [background-position:left_center] [background-size:19px_18px]" style={{ backgroundImage: `url(${O}bank_heart.svg)` }}>{leaguePrize.prize}</span></p>
                        </div>
                      </OrigPopup>
                    ) : null}
                  </div>
                );
              })() : panel === "achievements" ? (
                <AchievementsPanel values={achOther ?? achValue} heading={achOf ? t("bottle.achOf").replace("{name}", achOf.name) : undefined} />
              ) : panel === "gestures" ? (
                <div className="-mx-3 -mb-3 bg-white">
                  <div className="flex items-center justify-center gap-2 px-3 pt-2">
                    <span className="text-[11px] font-semibold text-[#9CA3AF]">{smileText.balance}</span>
                    {smileChip}
                  </div>
                  <ul className="grid max-h-[min(60vh,420px)] grid-cols-4 gap-1.5 overflow-y-auto p-3 [scrollbar-width:thin] sm:grid-cols-5">
                    {GESTURES.map(([id, price, kind, amount]) => {
                      const left = missing([kind, amount], gesProgress);
                      return (
                        <li key={id}>
                          <button onClick={() => sendGesture(id, price, [kind, amount])} title={left ? (left < 0 ? t("bottle.vipOnly") : lockNote(kind, left)) : undefined} className={cn("flex w-full flex-col items-center rounded-xl border border-[#EEF0F3] p-1 transition-transform hover:-translate-y-0.5 hover:shadow", left !== 0 && "opacity-60")}>
                            <img src={`/custom/gifts/ges_${id}.webp`} alt="" loading="lazy" className={cn("h-14 w-14 object-contain", left !== 0 && "grayscale")} />
                            <span className="flex h-4 items-center gap-0.5 text-[11px] font-bold text-[#3F3F46]">{left < 0 ? <b className="rounded bg-[#F59E0B] px-1 text-[9px] text-white">VIP</b> : left ? <>🔒<span className="text-[10px] font-semibold text-[#6B7280]">{left >= 1000 ? `${Math.round(left / 100) / 10}k` : left}💋</span></> : <>😀1</>}</span>
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
                    {vipPlans.map(([days, price]) => <button key={days} onClick={() => setPayNote(true)} className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] p-2 text-center hover:brightness-95"><span className="block text-sm font-black text-[#B45309]">{days} {t("bottle.days")}</span><span className="mt-1 block rounded-md bg-[#8CC63F] py-1 text-[11px] font-bold tabular-nums text-white">{price} ₼</span></button>)}
                  </div>
                  {payNote ? <p role="status" className="mt-2 rounded-lg bg-[#FEF3C7] p-2 text-center text-xs font-semibold text-[#92400E]">{t("bottle.paySoon")}</p> : null}
                </div>
              ) : panel === "market" ? (
                <BonusMarket locale={locale} online={online} hearts={hearts} onHearts={(value) => { heartsRef.current = value; setHearts(value); }} onPreview={previewEnigma} />
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
                  {(["kiss_fire", "refuse_slap"] as const).map((kind) => (
                    <div key={kind} className="flex items-center gap-2 rounded-xl bg-[#FFF7ED] p-2">
                      <img src={`/custom/ui/${kind}.webp`} alt="" className="h-10 w-10 shrink-0 object-contain" />
                      <p className="min-w-0 flex-1 text-xs"><b className="block text-sm">{t(kind === "kiss_fire" ? "bottle.boostFire" : "bottle.boostSlap")} <span className="font-semibold text-[#9CA3AF]">· {t("bottle.boostHave").replace("{n}", String(items[kind]))}</span></b>{t(kind === "kiss_fire" ? "bottle.boostFireText" : "bottle.boostSlapText")}</p>
                      <button onClick={() => buyItem(kind)} className="h-8 shrink-0 rounded-md bg-[#8CC63F] px-2.5 text-xs font-bold text-white">5× · ❤ 5</button>
                    </div>
                  ))}
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
                        <span className="absolute inset-x-[9%] bottom-[9%] truncate rounded-b-lg bg-black/45 px-1 text-center text-[10px] font-semibold text-white">{me.name}{me.age ? `, ${me.age}` : ""}</span>
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

      <div className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F5F5F5]", wide ? "-ml-px" : "-mt-px")}>
        {video && wide && !musicMode ? (
          <div className={cn("relative w-full shrink-0 bg-black", picked !== null || dedicate ? "h-0 overflow-hidden" : "aspect-video max-h-[42%]")}>
            <iframe ref={frameRef} onLoad={() => { window.setTimeout(pushMusic, 800); frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*"); }} src={ytSrc(video)} title="YouTube" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" />
            {soundPill}
            {track ? <img src={songByAvatar} alt="" title={t("bottle.musicNow")} className="pointer-events-none absolute left-1.5 top-1.5 h-8 w-8 select-none rounded-full border-2 border-white/80 object-cover shadow" draggable={false} /> : null}
          </div>
        ) : null}
        {video && !wide && !musicMode ? (
          <div ref={miniRef} style={mini.x === null ? { right: 0, top: mini.y, width: MINI_VIDEO_W } : { left: mini.x, top: mini.y, width: MINI_VIDEO_W }} className={cn("absolute z-20 overflow-hidden border shadow-lg", musicMode ? "border-[#4C1D95] bg-[linear-gradient(160deg,#1E1B3A,#4C1D95_65%,#BE185D)] text-white" : "border-border bg-surface", mini.x === null ? "rounded-l-2xl border-r-0" : "rounded-2xl")}>
            <div className="flex items-center">
              <img src={songByAvatar} alt="" title={t("bottle.miniMove")} onPointerDown={(event) => startMini(event, "move")} className="mx-1 h-7 w-7 shrink-0 cursor-move touch-none select-none rounded-full border-2 border-border object-cover" draggable={false} />
              <div className={cn(musicMode ? "my-1 mr-1 h-[200px] w-[200px] shrink-0 overflow-hidden rounded-xl" : "aspect-video min-w-0 flex-1", "bg-black", miniBusy && "pointer-events-none")}><iframe ref={frameRef} onLoad={() => { window.setTimeout(pushMusic, 800); frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*"); }} src={ytSrc(video)} title="YouTube" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="h-full w-full" /></div>
            </div>
            {musicMode ? <div className="flex items-center gap-2 px-2 pt-0.5"><Equalizer className="h-4 shrink-0" /><p className="min-w-0 flex-1 truncate text-xs font-bold">{videoTitle}</p></div> : null}
            {soundPill}
            
          </div>
        ) : null}
        {audio || (video && musicMode) ? (
          // PC: a bar above the chat. Phone: a small square window like the video one, which can be moved and resized.
          <div ref={wide ? undefined : miniRef} style={wide ? undefined : mini.x === null ? { right: 4, top: mini.y, width: MINI_MUSIC_W } : { left: mini.x, top: mini.y, width: MINI_MUSIC_W }} className={cn("overflow-hidden bg-[linear-gradient(120deg,#1E1B3A,#4C1D95_60%,#BE185D)] text-white", wide ? "relative shrink-0 p-2.5" : "absolute z-20 rounded-2xl border border-white/15 p-1.5 pt-6 shadow-xl", miniBusy && !wide && "select-none")}>
            {track ? <img src={songByAvatar} alt="" title={t("bottle.musicNow")} className={cn("pointer-events-none absolute z-[1] select-none rounded-full border-2 border-white/70 object-cover shadow", wide ? "bottom-1.5 left-1.5 h-6 w-6" : "left-1.5 top-1.5 h-6 w-6")} draggable={false} /> : null}
            {audio ? <audio src={audio.url} autoPlay playsInline ref={(node) => { audioRef.current = node; if (node) node.volume = music / 100; }} onPlay={() => setTune((v) => ({ ...v, playing: true }))} onPause={() => setTune((v) => ({ ...v, playing: false }))} onEnded={() => setAudio(null)} onLoadedMetadata={(event) => { const node = event.currentTarget; const dur = node.duration || 0; const at = songNow(); if (at > 2 && at < dur) node.currentTime = at; setTune((v) => ({ ...v, dur })); }} onTimeUpdate={(event) => { const cur = event.currentTarget.currentTime; setTune((v) => ({ ...v, cur })); }} className="hidden" /> : null}
            {/* Songs from the MP3 tab: the YouTube player plays behind the card, only the music player is seen. */}
            {!audio && video ? <iframe ref={frameRef} onLoad={() => { window.setTimeout(pushMusic, 800); frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*"); }} src={ytSrc(video)} title="YouTube" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media" tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-[200px] w-[200px] opacity-0" /> : null}
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
              <span title={t("bottle.miniMove")} onPointerDown={(event) => startMini(event, "move")} className="flex w-full cursor-move touch-none select-none justify-center pb-1.5 pt-0.5"><span className={cn("flex shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-[radial-gradient(circle,#BE185D_20%,#111_21%,#2a2a2a_45%,#111_46%,#333_70%,#111_71%)] bg-cover bg-center shadow-lg", tune.playing && "animate-[spin_3s_linear_infinite]", "h-auto w-[40%] aspect-square")} style={!audio && video ? { backgroundImage: `radial-gradient(circle,#1E1B3A 14%,transparent 15%),url(https://i.ytimg.com/vi/${video}/mqdefault.jpg)` } : undefined}><span className="h-2 w-2 rounded-full bg-white/80" /></span></span>
              <p className="w-full truncate text-center text-[10px] font-black">{audio ? audio.name : videoTitle}</p>
              <div className="mt-1 flex w-full items-center gap-1">
                <button onClick={() => { const node = audio ? audioRef.current : null; if (node) { if (node.paused) void node.play().catch(() => {}); else node.pause(); return; } setTouched(true); ytCall(tune.playing ? "pauseVideo" : "playVideo"); if (!tune.playing) ytCall("unMute"); }} aria-label={tune.playing ? "Pause" : "Play"} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#4C1D95] shadow">{tune.playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="translate-x-px" />}</button>
                <input type="range" min={0} max={Math.max(1, Math.floor(tune.dur))} value={Math.floor(tune.cur)} onChange={(event) => { const at = Number(event.target.value); const node = audio ? audioRef.current : null; if (node) node.currentTime = at; else ytCall("seekTo", [at, true]); setTune((v) => ({ ...v, cur: at })); }} aria-label={audio ? audio.name : videoTitle} className="min-w-0 flex-1 accent-[#EC4899]" />
                <Equalizer className={cn("h-3 shrink-0", !tune.playing && "opacity-40 [&>span]:![animation-play-state:paused]")} />
              </div>
              <p className="mt-0.5 w-full text-center text-[9px] tabular-nums text-white/60">{clock(tune.cur)} / {clock(tune.dur)}</p>
            </div>
            )}
            {!audio && soundPill}
            {audio ? <button onClick={() => setAudio(null)} aria-label={t("photos.close")} title={t("photos.close")} className={cn("absolute flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70", wide ? "right-2 top-2 h-7 w-7" : "right-1.5 top-1.5 h-6 w-6")}><X size={14} /></button> : null}
            
          </div>
        ) : null}
        <div className={cn("flex items-center gap-2 border-b border-[#E8E8E8] bg-white px-3 py-1.5", (picked !== null || dedicate || !wide) && "hidden")}>
          <p className="min-w-0 flex-1 truncate text-[11px] text-[#9E9E9E]">{online ? (net?.room ? `🔒 ${net.room.name} · ${seated.length}/${net.room.capacity}` : `${t("bottle.liveNote")} ${net?.table ?? ""} · ${seated.length}/12`) : t("bottle.demoNote")}</p>
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
              {players[picked].me ? smileChip : null}
              {players[picked].me ? null : <button onClick={() => chooseMode(true)} aria-label={t("bottle.dedicate")} title={t("bottle.dedicate")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5CC93B] text-white hover:bg-[#4DB52E]"><Plus size={17} strokeWidth={3} /></button>}
              <button onClick={() => setPicked(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#B4B9C2] text-white hover:bg-[#9AA3AE]"><X size={15} strokeWidth={3} /></button>
            </div>
            ) : null}
            {!dedicate && picked !== null && players[picked].me ? (
            <div role="menu" className={cn("grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto bg-white p-2", wide ? "grid-cols-[repeat(auto-fill,minmax(68px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(56px,1fr))]")}>
              {GESTURES.map(([id, price, kind, amount]) => {
                const left = missing([kind, amount], gesProgress);
                return (
                  <button key={id} role="menuitem" aria-disabled={left !== 0} onClick={() => sendGesture(id, price, [kind, amount])} title={left ? (left < 0 ? t("bottle.vipOnly") : lockNote(kind, left)) : undefined} className="group flex flex-col items-center gap-0.5 rounded-xl p-1 hover:bg-[#FFF4E5]">
                    <img src={`/custom/gifts/ges_${id}.webp`} alt="" loading="lazy" className={cn("object-contain transition-transform duration-150 group-hover:scale-110", wide ? "h-14 w-14" : "h-11 w-11", left !== 0 && "opacity-75 grayscale")} />
                    <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-[#3F3F46]">{left < 0 ? <b className="rounded bg-[#F59E0B] px-1 text-[10px] text-white">VIP</b> : left ? <span aria-label={`${left}`} className="text-[11px] opacity-70">🔒</span> : <>😀1</>}</span>
                  </button>
                );
              })}
            </div>
            ) : (
            <div role="menu" ref={giftListRef} onScroll={(event) => { const el = event.currentTarget; if (el.scrollHeight - el.scrollTop - el.clientHeight < giftBuffer) setGiftLimit((value) => (value < 600 ? value + giftStep : value)); }} className="min-h-0 flex-1 overflow-y-auto bg-white px-1.5 pb-2 pt-1">
              {(() => {
                // Like the original gift list: the gifts you can send first, then the ones still locked
                // (by kisses, from the nearest to the farthest, and the VIP ones last). Locked gifts are grey with a lock.
                const all = [...(iAmAdmin ? [["c:heart1000", 1000, 0] as [string, number, number]] : []), ...giftChoices.slice(0, 2), ...customGiftNames(art).filter((name) => !name.startsWith("ges_") && name !== "heart1000" && !giftHidden(name)).map((name) => [`c:${name}`, GIFT_PRICES[name] ?? customPrice(name), missing(GIFT_RULES[`c:${name}`], progress)] as [string, number, number]), ...giftChoices.slice(2), ...lockedGifts.map(([gift, price, need]) => [gift, price, Math.max(0, need - progress.kisses)] as [string, number, number])]
                  .map(([gift, price, need]) => [gift, price, need ?? 0] as [string, number, number]);
                const isLocked = (need: number) => (need === -1 ? !vip : need > 0);
                const open = all.filter(([, , need]) => !isLocked(need));
                const locked = all.filter(([, , need]) => isLocked(need)).sort((x, y) => (x[2] === -1 ? 1e12 : x[2]) - (y[2] === -1 ? 1e12 : y[2]));
                const tile = ([gift, price, need]: [string, number, number], order: number) => {
                  const shut = isLocked(need);
                  const note = shut ? (need === -1 ? t("bottle.vipOnly") : lockNote("kisses", need)) : undefined;
                  return (
                    <button key={`${gift}-${order}`} role="menuitem" aria-disabled={shut} onPointerDown={(event) => pressGift(giftTargets, gift, price, need, event.clientX, event.clientY)} onPointerMove={(event) => { const state = pressed.current; if (state && !state.started && Math.hypot(event.clientX - state.x, event.clientY - state.y) > 8) cancelPress(); }} onPointerUp={() => releaseGift(giftTargets, gift, price, need)} onPointerLeave={cancelPress} onPointerCancel={cancelPress} onContextMenu={(event) => event.preventDefault()} onKeyDown={(event) => { if (event.key === "Enter" && !event.repeat) giveMany(giftTargets, gift, price, need); }} aria-label={note ?? `${t("gifts.send")} ${price}`} title={note} className={cn("group flex [content-visibility:auto] [contain-intrinsic-size:auto_92px] touch-pan-y select-none flex-col items-center justify-around rounded-[9px] transition-colors duration-500 hover:bg-[#F2F2F2] active:bg-[#D1D1D1]", wide ? "h-[95px]" : "h-[84px]")}>
                      <span className={cn("relative flex items-center", wide ? "h-[60px]" : "h-[52px]")}>
                        <Gift lazy id={gift} className={cn("transition-transform duration-150 group-hover:scale-110", wide ? "h-[60px] w-[60px]" : "h-[50px] w-[50px]", shut && "grayscale")} />
                      </span>
                      {shut
                        ? <span aria-hidden="true" className={cn("bg-contain bg-center bg-no-repeat", need === -1 ? "h-[18px] w-[39px]" : "h-[18px] w-[15px]")} style={{ backgroundImage: `url(/custom/orig/${need === -1 ? "store_lock_vip" : "store_lock"}.svg)` }} />
                        : <span className="flex items-center"><span aria-hidden="true" className="h-[13px] w-[16px] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/bank_heart.svg)" }} /><b className="ml-[3px] text-[14px] tabular-nums text-[#1F2937]">{price}</b></span>}
                    </button>
                  );
                };
                const grid = cn("grid content-start gap-x-1", wide ? "grid-cols-[repeat(auto-fill,minmax(72px,1fr))]" : "grid-cols-[repeat(auto-fill,minmax(60px,1fr))]");
                const head = (text: string, count: number) => <p className="sticky top-0 z-[1] flex items-center gap-2 bg-white/95 px-1.5 py-1.5 text-[12px] font-bold uppercase tracking-wide text-[#6B7280] backdrop-blur-sm"><span>{text}</span><span className="rounded-full bg-[#F3F4F6] px-1.5 text-[11px] tabular-nums">{count}</span><span className="h-px flex-1 bg-[#EEEEEE]" /></p>;
                return <>
                  {head(t("bottle.giftsOpen"), open.length)}
                  <div className={grid}>{open.slice(0, giftLimit).map((item, index) => tile(item, index))}</div>
                  {locked.length && giftLimit > open.length ? <>{head(t("bottle.giftsLocked"), locked.length)}<div className={grid}>{locked.slice(0, giftLimit - open.length).map((item, index) => tile(item, 1000 + index))}</div></> : null}
                </>;
              })()}
            </div>
            )}
            {frameNote && picked !== null && players[picked].me ? <p role="status" className="border-t border-border px-3 py-2 text-center text-xs font-semibold text-[#B45309]">{frameNote}</p> : null}
            {giftNote ? <p role="status" className="border-t border-border px-3 py-2 text-center text-xs font-semibold text-text">{giftNote}</p> : null}
          </div>
        ) : null}
        {/* The original chat (bottle-html5 ChatContent + chat CSS): light grey list, 30px photos, white bubbles with a tail,
            and one-line info rows "photo → gift/kiss/song → photo" with the original icons. */}
        <div ref={listRef} onWheel={() => { userScrollAt.current = Date.now(); }} onTouchMove={() => { userScrollAt.current = Date.now(); }} onPointerDown={() => { userScrollAt.current = Date.now(); }} onScroll={(event) => { const el = event.currentTarget; const gap = el.scrollHeight - el.scrollTop - el.clientHeight; if (gap < 80) stickRef.current = true; else if (Date.now() - userScrollAt.current < 1000) stickRef.current = false; }} className={cn("flex min-h-0 flex-1 flex-col gap-[7px] overflow-y-auto bg-[#F5F5F5] py-[7px] text-[15px] text-black [overflow-wrap:break-word] [&>:first-child]:mt-auto [&>*]:[content-visibility:auto] [&>*]:[contain-intrinsic-size:auto_34px]", (picked !== null || (dedicate && !wide)) && "hidden")}>
          {noChat ? null : (() => {
            const O = "/custom/orig/";
            const ic = (name: string, w: number, h: number, extra = "") => <span aria-hidden="true" className={cn("inline-block shrink-0 bg-contain bg-center bg-no-repeat", extra)} style={{ width: w, height: h, backgroundImage: `url(${O}${name}.svg)` }} />;
            const photo = (player: Player | null | undefined, extra = "") => player ? <button type="button" onClick={() => { const index = players.findIndex((item) => item.id === player.id); if (index >= 0) { setPicked(index); setCard(true); } else showUserCard({ id: player.id, name: player.name, avatar: player.avatar }); }} title={player.name} className={cn("h-[30px] w-[30px] shrink-0 rounded-[4px] bg-cover bg-top", extra)} style={{ backgroundImage: `url(${player.avatar || NO_PHOTO})` }} /> : null;
            const arrows = ic("chat_icon_arrows", 11, 11, "mx-[5px]");
            const myNameLower = (names.current[net?.me ?? ""]?.name ?? "").toLowerCase(); // a message that starts with my name is written to me: darker bubble
            const nameColor = (player: Player) => (player.female ? "#D6336C" : "#2F6FD6");
            const info = "flex min-h-[30px] max-w-full items-center px-[7px]";
            return lines.filter((line) => !line.text || !muted.includes(line.from)).map((line) => {
            const from = lineWho(line.from);
            const to = line.to ? lineWho(line.to) : null;
            if (line.boost) return (
              <div key={line.id} className={info}>
                {photo(from)}
                <img src={`/custom/ui/${line.boost.kind}.webp`} alt="" className="ml-2.5 h-7 w-7 shrink-0 object-contain" />
                <span className="min-w-0 px-2 leading-[15px] text-[#424242]"><b>{line.boost.a}</b> {t(line.boost.kind === "kiss_fire" ? "bottle.boostFireLine" : "bottle.boostSlapLine")} <b>{line.boost.b}</b></span>
              </div>
            );
            if (line.event) return (
              <div key={line.id} className={info} title={line.event.kind === "kicked" ? `${line.event.b} ${t("bottle.kickedLine")}` : `${line.event.a} ${t(line.event.kind === "kick" ? "bottle.kickLine" : "bottle.saveLine")} ${line.event.b}`}>
                {photo(from)}
                {ic(line.event.kind === "kick" ? "chat_icon_kick" : line.event.kind === "kicked" ? "chat_icon_kicked" : "chat_icon_save", line.event.kind === "kick" ? 26 : line.event.kind === "kicked" ? 20 : 19, 22, "ml-2.5")}
                {arrows}
                {photo(to) ?? <span className="truncate font-bold text-[#424242]">{line.event.b}</span>}
              </div>
            );
            if (line.admire) return (
              <div key={line.id} className={cn(info, "min-h-[30px]")}>
                {photo(from) ?? (line.admire.avatar ? <span className="h-[30px] w-[30px] shrink-0 rounded-[4px] bg-cover bg-top" style={{ backgroundImage: `url(${line.admire.avatar})` }} /> : null)}
                {ic(line.admire.lost ? "chat_icon_harem_free" : "chat_icon_harem_busy", 18, line.admire.lost ? 23 : 19, "ml-2.5")}
                <span className="min-w-0 px-2 leading-[15px] text-[#424242]">
                  {line.admire.lost && line.admire.self ? t("bottle.selfFreed").replace("{by}", line.admire.by ?? "").replace("{n}", String(line.admire.amount ?? 0))
                    : line.admire.self ? <><b>{from?.name ?? line.admire.by}</b> {t("bottle.freedSelf")} {ic("chat_icon_heart", 15, 11, "mx-0.5 align-[-1px]")}<b>{line.admire.amount}</b></>
                    : line.admire.lost ? <><b>{line.admire.by}</b> {t("bottle.admireLost1")} <b>{line.admire.target}</b> {t("bottle.admireLost2")}</>
                    : <><b>{from?.name ?? line.admire.by}</b> {t("bottle.admireLine")} {ic("chat_icon_heart", 15, 11, "mx-0.5 align-[-1px]")}<b>{line.admire.amount}</b></>}
                </span>
                {photo(to)}
              </div>
            );
            if (!from) return null;
            if (line.gesture) return (
              <div key={line.id} className="flex max-w-full items-start px-[7px]">
                {photo(from)}
                <div className="flex min-w-0 flex-1 flex-wrap items-start">
                  {/* a smiley in the chat plays once and then stands still */}{(() => {
                    // The same smiley sent again and again stands once with a counter (×N): far fewer pictures and rows in the chat.
                    const runs: { id: string; n: number }[] = [];
                    for (const id of line.gestures ?? [line.gesture ?? ""]) { const last = runs[runs.length - 1]; if (last && last.id === id) last.n += 1; else runs.push({ id, n: 1 }); }
                    return runs.map((run, n) => <span key={n} className="inline-flex items-end"><OnceImg src={`/custom/anim/ges_${run.id}.webp`} freezeKey={`chat-${line.id}-${n}`} className="-mb-1 ml-[4px] -mt-[2px] h-7 w-7 shrink-0 object-contain" />{run.n > 1 ? <b className="mb-0.5 ml-0.5 text-[12px] font-extrabold leading-none text-[#6B7280]">×{run.n}</b> : null}</span>);
                  })()}
                </div>
              </div>
            );
            if (line.bottle) return (
              <div key={line.id} className={info} title={`${from.name} ${t("bottle.bottleChanged")}`}>
                {photo(from)}
                <span className="ml-[15px] mr-1 flex h-[42px] w-[30px] shrink-0 rotate-45 items-center justify-center grayscale"><SkinArt set={art} n={line.bottle.a + 1} className="h-[38px]" /></span>
                {arrows}
                <span className="ml-1 flex h-[42px] w-[30px] shrink-0 rotate-45 items-center justify-center"><SkinArt set={art} n={line.bottle.b + 1} className="h-[38px]" /></span>
              </div>
            );
            const receivers = (line.tos ?? (line.to ? [line.to] : [])).map((id) => lineWho(id)).filter((player): player is Player => Boolean(player));
            const fromIndex = players.findIndex((player) => player.id === line.from);
            if (line.text) return (
              <div key={line.id} className="relative flex max-w-full items-start gap-[9px] px-[7px]">
                {photo(from)}
                <div onDoubleClick={() => !from.me && setLineMenu(line.id)} onContextMenu={(event) => { if (from.me) return; event.preventDefault(); setLineMenu(line.id); }} onTouchStart={() => { if (from.me) return; window.clearTimeout(pressTimer.current); pressTimer.current = window.setTimeout(() => setLineMenu(line.id), 500); }} onTouchEnd={() => window.clearTimeout(pressTimer.current)} onTouchMove={() => window.clearTimeout(pressTimer.current)}
                  className={cn("group relative min-h-[17px] min-w-[100px] rounded-[5px] px-2 pb-1.5 pt-[7px] before:absolute before:-left-1.5 before:top-[9px] before:border-y-[6px] before:border-r-[6px] before:border-y-transparent before:content-['']", lineMenu === line.id ? "bg-[#498FE1] text-white before:border-r-[#498FE1]" : !from.me && myNameLower && (line.text ?? "").toLowerCase().startsWith(myNameLower) ? "bg-[#A9C9F2] before:border-r-[#A9C9F2]" : "bg-white before:border-r-white")}>
                  <button type="button" onClick={(event) => { event.stopPropagation(); if (from.me) return; window.clearTimeout(pressTimer.current); setDraft((value) => (value.startsWith(`${from.name}, `) ? value : `${from.name}, ${value}`)); window.setTimeout(() => { chatRef.current?.focus(); const end = chatRef.current?.value.length ?? 0; chatRef.current?.setSelectionRange(end, end); }, 30); }} onTouchStart={(event) => event.stopPropagation()} className={cn("font-bold", nameColorClass(nameColors[from.me ? net?.me ?? "" : from.id]) || (isAdminPlayer(from) && "bg-[linear-gradient(rgb(240,208,51),rgb(217,131,0))] bg-clip-text text-transparent"))} style={lineMenu === line.id || isAdminPlayer(from) || nameColors[from.me ? net?.me ?? "" : from.id] ? undefined : { color: nameColor(from) }}>{from.name}</button>{(() => { const decor = decorOf(line.from); return decor ? decor.startsWith("/") ? <img src={decor} alt="" className="ml-0.5 inline h-3.5 w-3.5 align-[-2px]" /> : <span title="VIP" className="ml-0.5 text-[11px]">💎</span> : null; })()}<span className="font-bold">: </span><span className="[word-break:break-word]">{line.text}</span>
                  {!from.me && /[а-яёА-ЯЁ]|[؀-ۿ]|[Ⴀ-ჿ]/.test(line.text) ? <a href={`https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(line.text)}`} target="_blank" rel="noreferrer" className={cn("block text-[12px]", lineMenu === line.id ? "text-white" : "text-[#808080]")}>{t("bottle.translate")}</a> : null}
                  {from.me ? null : <button type="button" onClick={() => setLineMenu(line.id)} aria-label={t("bottle.report")} className="absolute -right-[11px] -top-[11px] z-[1] hidden h-[25px] w-[25px] items-center justify-center group-hover:flex"><span className="h-3.5 w-3.5 rounded-full bg-[#498FE1] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${O}chat_message_action.svg)` }} /></button>}
                  {lineMenu === line.id ? (
                    <div role="menu" className="absolute left-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl bg-white text-[13px] text-[#1F2937] shadow-xl" onMouseLeave={() => setLineMenu(null)}>
                      <button role="menuitem" onClick={() => { setDraft(`${from.name}, `); setLineMenu(null); }} className="block w-full px-3 py-2 text-left hover:bg-[#F3F4F6]">↩ {t("bottle.reply")}</button>
                      <a role="menuitem" href={`https://translate.google.com/?sl=auto&tl=${lang}&text=${encodeURIComponent(line.text)}`} target="_blank" rel="noreferrer" onClick={() => setLineMenu(null)} className="block w-full px-3 py-2 text-left hover:bg-[#F3F4F6]">🌐 {t("bottle.translate")}</a>
                      <button role="menuitem" onClick={() => { setLineMenu(null); setGiftNote(null); say({ from: "me", text: `⚑ ${t("bottle.reportSent")}` }); }} className="block w-full px-3 py-2 text-left text-[#E03D1F] hover:bg-[#F3F4F6]">⚑ {t("bottle.report")}</button>
                    </div>
                  ) : null}
                </div>
                {from.me ? null : <button type="button" onClick={() => { setDraft(`${from.name}, `); chatRef.current?.focus(); }} aria-label={t("bottle.reply")} title={t("bottle.reply")} className="h-[22px] w-[30px] shrink-0 self-center bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${O}chat_btn_reply.svg)` }} />}
              </div>
            );
            if (line.song && (line.id !== lastSongLine || !(video || audio))) return null; // only the song that is playing now stays in the chat
            if (line.song) { const song = songInfo(line.song); return (
              <div key={line.id} className={info} title={song.title}>
                {photo(from)}
                {ic("chat_icon_music", 17, 18, "ml-2.5")}
                <span className="min-w-0 truncate px-2 text-[#424242]">{song.title}</span>
                {to && !(to.me && from.me) ? <>{arrows}{photo(to)}</> : <span className="shrink-0 pr-1 text-[12px] font-semibold text-[#9E9E9E]">{t("bottle.songSelf")}</span>}
              </div>
            ); }
            if (line.gift && receivers.length) return (
              <div key={line.id} className={info}>
                {photo(from)}
                <Gift id={line.gift} className="ml-2.5 h-7 w-7 shrink-0" />
                {(line.count ?? 1) > 1 ? <span className="ml-1 mt-0.5 flex h-[18px] items-center text-[16px] font-bold text-[#72BE61]">{ic("chat_icon_count", 9, 8, "mr-0.5")}{line.per ? Math.max(1, ...Object.values(line.per)) : line.count}</span> : null}
                {arrows}
                <span className="flex flex-row-reverse gap-[5px]">{receivers.slice(0, 12).map((player) => <span key={player.id} className="relative">{photo(player)}</span>)}</span>
                {receivers.length > 12 ? <span className="ml-1 text-xs font-bold text-[#9E9E9E]">+{receivers.length - 12}</span> : null}
                {!from.me && fromIndex >= 0 && !players[fromIndex].empty ? <button type="button" onClick={() => { const price = priceOf(line.gift ?? ""); if (price) giveGift(fromIndex, line.gift ?? "", price); }} aria-label={t("bottle.giftBack")} title={`${t("bottle.giftBack")} · ${priceOf(line.gift ?? "")} ❤`} className="ml-[9px] h-[22px] w-[30px] shrink-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${O}chat_btn_reply.svg)` }} /> : null}
              </div>
            );
            if (to) return (
              <div key={line.id} className={info}>
                {photo(from)}
                {ic("chat_icon_kiss", 24, 16, "ml-2.5")}
                {arrows}
                {photo(to)}
              </div>
            );
            return null;
          });
          })()}
        </div>
        <form onSubmit={handleChat} className={cn("relative flex h-[39px] shrink-0 items-center bg-white shadow-[0_0_4px_rgba(0,0,0,0.07)]", picked !== null && "hidden")}>
          <input ref={chatRef} data-hint="chat-input" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={200} aria-label={t("messages.placeholder")} placeholder={t("messages.placeholder")} autoComplete="off" className={cn(tour === 5 && "ring-4 ring-[#FFD84D]", "ml-[13px] h-full min-w-[100px] flex-1 border-0 bg-transparent text-[14px] text-black outline-none placeholder:text-[#CFCFCF]")} />
          <button type="button" onClick={() => setEmojiOpen((value) => !value)} aria-expanded={emojiOpen} aria-label={t("messages.placeholder")} title="😊" className="ml-1 mr-1.5 h-[26px] w-[26px] shrink-0 rounded-full bg-contain bg-center bg-no-repeat active:brightness-75" style={{ backgroundImage: "url(/custom/orig/chat_btn_emoji.svg)" }} />
          {emojiOpen ? (
            <>
              <button type="button" aria-label="close" onClick={() => setEmojiOpen(false)} className="fixed inset-0 z-[48] cursor-default" />
              <div className="absolute bottom-full right-0 z-[49] mb-1 w-[min(300px,100%)] rounded-xl bg-white p-1.5 text-[#1F2937] shadow-[0_6px_24px_rgba(0,0,0,0.3)]">
                <div className="mb-1 flex gap-0.5 overflow-x-auto border-b border-[#E5E7EB] pb-1 [scrollbar-width:none]">
                  {emojiSets.map((set, at) => <button key={set.id} type="button" onClick={() => setEmojiCat(at)} aria-pressed={emojiCat === at} className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg", emojiCat === at ? "bg-[#E5F2FA]" : "hover:bg-[#F3F4F6]")}>{set.icon}</button>)}
                </div>
                <div className="grid h-44 grid-cols-7 content-start gap-0.5 overflow-y-auto">
                  {(emojiSets[emojiCat]?.list ?? []).map((emoji) => <button key={emoji} type="button" onClick={() => setDraft((value) => (value + emoji).slice(0, 200))} className="flex h-9 w-9 items-center justify-center rounded-lg text-[22px] hover:bg-[#F3F4F6]">{emoji}</button>)}
                </div>
              </div>
            </>
          ) : null}
          <button type="submit" data-hint="chat-send" disabled={!draft.trim()} aria-label={t("messages.send")} className="mr-2 h-[26px] w-[26px] shrink-0 rounded-full bg-contain bg-center bg-no-repeat active:brightness-75 disabled:opacity-40" style={{ backgroundImage: "url(/custom/orig/chat_btn_send.svg)" }} />
        </form>
      </div>
      {tour > 0 ? (
        <div role="dialog" aria-label={t("bottle.tourTitle")} className={cn("absolute left-1/2 z-[62] w-[min(420px,calc(100%-24px))] -translate-x-1/2 animate-[bottle-pop_0.25s_ease-out] rounded-2xl border-2 border-[#FFD84D] bg-white p-3 text-[#1F2937] shadow-[0_10px_30px_rgba(0,0,0,0.35)]", tour === 6 ? "top-1/2 -translate-y-1/2" : "top-2")}>
          {tour < 6 ? (
            <>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#FFD84D] px-2 py-0.5 text-[11px] font-black text-[#7C5A00]">{t("bottle.tourStep").replace("{n}", String(tour)).replace("{total}", "5")}</span>
                <p className="min-w-0 flex-1 truncate text-sm font-black">{t(`bottle.tour${tour}Title` as "bottle.tour1Title")}</p>
                <button onClick={() => closeTour(false)} className="shrink-0 text-xs font-semibold text-[#9CA3AF] hover:text-[#4B5563]">{t("bottle.tourSkip")}</button>
              </div>
              <p className="mt-1.5 text-[13px] leading-snug text-[#4B5563]">{t(`bottle.tour${tour}Text` as "bottle.tour1Text")}</p>
              <div className="mt-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => <span key={n} className={cn("h-1.5 flex-1 rounded-full", n <= tour ? "bg-[#F5B400]" : "bg-[#E5E7EB]")} />)}
              </div>
              {tour <= 2 ? <button onClick={() => setTour(tour + 1)} className="mt-2 h-9 w-full rounded-lg bg-[#8CC63F] text-sm font-bold text-white hover:brightness-105">{t("bottle.tourNext")}</button>
                : <p className="mt-2 text-center text-[11px] font-semibold text-[#B45309]">👆 {t("bottle.tourDoIt")}</p>}
            </>
          ) : (
            <div className="text-center">
              <p className="text-lg font-black text-[#B45309]">🎉 {t("bottle.tourFinishTitle")}</p>
              <p className="mt-1 text-sm text-[#4B5563]">{t("bottle.tourFinishText")}</p>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-2xl font-black text-[#E8203A]">+{tourBonus}<Heart size={24} fill="#E8352B" stroke="none" /></p>
              <button onClick={() => closeTour(true)} className="mt-3 h-10 min-w-[160px] rounded-lg bg-[#8CC63F] px-4 text-sm font-bold text-white hover:brightness-105">{t("bottle.tourPlay")}</button>
            </div>
          )}
        </div>
      ) : null}
      {hint && !tour ? <HintHand key={`${hint.id}-${hint.step}`} target={hint.target} label={hint.label} angle={hint.angle} /> : null}
      {heartFlights.map((item) => <Heart key={item.key} aria-hidden="true" size={26} fill="#E8352B" stroke="#FFFFFF" strokeWidth={2} className="pointer-events-none fixed z-[80] -ml-[13px] -mt-[13px] drop-shadow" style={{ left: item.x, top: item.y, ["--hx" as string]: `${item.dx}px`, ["--hy" as string]: `${item.dy}px`, animation: `heart-to-balance 1.4s cubic-bezier(0.4,0,0.2,1) ${item.delay}ms both` }} />)}
      {leagueResult && !daily ? (
        <div className="absolute inset-0 z-[61] flex items-center justify-center bg-black/40 p-4" onClick={() => setLeagueResult(null)}>
          <div role="dialog" aria-label={t("bottle.leagueResult")} onClick={(event) => event.stopPropagation()} className="relative w-full max-w-[360px] animate-[bottle-pop_0.25s_ease-out] rounded-2xl bg-white px-5 pb-5 pt-4 text-center text-[#1F2937] shadow-2xl">
            <button onClick={() => setLeagueResult(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8CC63F] bg-white text-[#8CC63F] shadow"><X size={18} strokeWidth={3} /></button>
            <p className="text-lg font-black text-[#B7791F]">🏆 {t("bottle.leagueResult")}</p>
            <LeagueBadge league={leagueResult.next} className="mx-auto mt-2 h-20 w-20 drop-shadow" />
            <p className="mt-1 text-sm">{t("bottle.leaguePlace").replace("{n}", String(leagueResult.place ?? "—"))}</p>
            <p className={cn("mt-1 text-base font-black", leagueResult.next > leagueResult.league ? "text-[#16A34A]" : leagueResult.next < leagueResult.league ? "text-[#DC2626]" : "text-[#6B7280]")}>
              {leagueResult.next > leagueResult.league ? `▲ ${t("bottle.leagueMovedUp")}` : leagueResult.next < leagueResult.league ? `▼ ${t("bottle.leagueMovedDown")}` : t("bottle.leagueStayed")} {t(`bottle.league${leagueResult.next}` as "bottle.league0")}
            </p>
            {leagueResult.reward > 0 ? <p className="mt-2 flex items-center justify-center gap-1.5 text-2xl font-black text-[#E8203A]">+{leagueResult.reward}<Heart size={24} fill="#E8352B" stroke="none" /></p> : null}
            <button onClick={() => { setLeagueResult(null); setPanel("league"); }} className="mt-4 h-10 min-w-[140px] rounded-lg bg-[#F2B705] px-4 text-sm font-bold text-white hover:brightness-105">{t("bottle.leagueOpen")}</button>
          </div>
        </div>
      ) : null}
      {daily ? (
        <div className="absolute inset-0 z-[61] flex items-center justify-center bg-black/40 p-4" onClick={takeDaily}>
          {/* The original daily bonus (bottle-html5 DailyBonusDialog + daily-bonus CSS). */}
          <div role="dialog" aria-label={t("bottle.dailyTitle")} onClick={(event) => event.stopPropagation()} className="relative isolate flex w-[290px] max-w-full animate-[bottle-pop_0.25s_ease-out] flex-col items-center overflow-hidden rounded-[17px] bg-white text-[#424242] shadow-[0_4px_8px_rgba(0,0,0,0.2)] [@media(orientation:landscape)]:w-[430px]">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[165px] rounded-t-[17px] bg-[length:auto_165px] bg-repeat-x" style={{ backgroundImage: "url(/custom/orig/daily_bonus_bg.svg)" }} />
            <p className="flex h-11 items-center text-[14px] font-bold text-white">{t("bottle.dailyTitle")}</p>
            <p className="mb-[15px] w-[220px] whitespace-pre-line text-center text-[14px] [@media(orientation:landscape)]:w-[310px]">{t("bottle.dailyDesc")}</p>
            <div className="flex h-[190px] flex-col items-center justify-between [@media(orientation:landscape)]:grid [@media(orientation:landscape)]:h-auto [@media(orientation:landscape)]:grid-cols-2 [@media(orientation:landscape)]:gap-x-2.5 [@media(orientation:landscape)]:gap-y-1.5">
              {DAILY_PRIZES.map((prize, index) => {
                const day = index + 1;
                const on = day <= daily.day;
                return (
                  <div key={day} className={cn("flex h-[30px] w-[233px] items-center justify-between rounded-[15px] [@media(orientation:landscape)]:w-[145px]", on ? "bg-[#B7EE66]" : "bg-black/[0.06]")}>
                    <div className="ml-[5px] flex items-center">
                      <span className="h-[22px] w-[22px] rounded-full bg-white bg-[length:13px_10px] bg-center bg-no-repeat" style={on && day !== daily.day ? { backgroundImage: "url(/custom/orig/achievement_icon_check.svg)" } : undefined} />
                      <span className="pl-[5px] text-[14px]">{day === daily.day ? t("bottle.dailyToday") : t(`bottle.dailyDay${day}` as "bottle.dailyDay1")}</span>
                    </div>
                    <span className="mx-[15px] ml-1 flex h-[19px] w-[26px] shrink-0 justify-center bg-[length:26px_19px] bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/daily_bonus_heart.svg)" }}><span className="self-center text-[13px] font-bold text-white">{daily.premium ? prize * 2 : prize}</span></span>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={() => { if (!daily.premium) { takeDaily(); openPass(); } }} className={cn("mt-2.5 flex h-[45px] w-[233px] items-center justify-between rounded-[10px] bg-[#FDB100] text-white", !daily.premium && "cursor-pointer")}>
              <span className="ml-3 text-left text-[12px] font-bold">{t(daily.premium ? "bottle.dailyPremiumOn" : "bottle.dailyPremiumOff")}</span>
              {daily.premium ? <span className="mx-[15px] ml-1 flex h-[19px] w-[26px] shrink-0 justify-center bg-[length:26px_19px] bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/daily_bonus_heart.svg)" }}><span className="self-center text-[13px] font-bold text-white">{daily.hearts}</span></span> : <span aria-hidden="true" className="ml-1 h-[45px] w-[55px] shrink-0 bg-[length:58px_65px] bg-center bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/daily_bonus_premium_icon.svg)" }} />}
            </button>
            <div className="flex w-full justify-center px-[15px] py-5"><OrigButton onClick={takeDaily}>{t("bottle.dailyBtn")} +{daily.hearts} ❤</OrigButton></div>
          </div>
        </div>
      ) : null}
      {unlocked && !daily ? (
        <div className="absolute inset-0 z-[61] flex items-center justify-center bg-black/40 p-4" onClick={() => setUnlocked(null)}>
          <div role="dialog" aria-label={t("bottle.unlockedTitle")} onClick={(event) => event.stopPropagation()} className="relative w-full max-w-[380px] animate-[bottle-pop_0.25s_ease-out] rounded-2xl bg-white px-5 pb-5 pt-4 text-center text-[#1F2937] shadow-2xl">
            <button onClick={() => setUnlocked(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8CC63F] bg-white text-[#8CC63F] shadow"><X size={18} strokeWidth={3} /></button>
            <p className="text-lg font-black text-[#2F80ED]">🔓 {t("bottle.unlockedTitle")}</p>
            <p className="mt-1 text-sm text-[#6B7280]">{t("bottle.unlockedText")}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {unlocked.map((id) => <span key={id} className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#F3F4F6] p-1">{id.startsWith("g:") ? <img src={`/custom/gifts/ges_${id.slice(2)}.webp`} alt="" className="h-full w-full object-contain" /> : <Gift id={id} className="h-full w-full" />}</span>)}
            </div>
            <button onClick={() => setUnlocked(null)} className="mt-4 h-10 min-w-[140px] rounded-lg bg-[#2F80ED] px-4 text-sm font-bold text-white hover:bg-[#2670D6]">{t("bottle.lockOk")}</button>
          </div>
        </div>
      ) : null}
      {lock ? (() => {
        // The original GiftLockedDialog: grey picture, why it is locked, a thin progress bar with "have/need" and two buttons.
        const have = lock.kind === "vip" ? 0 : Math.min(lock.total, progress[lock.kind as "kisses"] ?? 0);
        const icon = lock.kind === "dj" ? "ic_top_dj_score" : lock.kind === "friends" ? "profile_icon_unlock" : lock.kind === "gestures" ? "token" : "ic_top_total_kisses";
        const more = () => { setLock(null); if (lock.kind === "friends") openInvite(); else if (lock.kind === "vip") { setPayNote(false); setPanel("shop"); } else if (lock.kind === "kisses" || lock.kind === "dj" || lock.kind === "gestures") { setPicked(null); setCard(false); setTopPeriod("all"); setTopKind(lock.kind === "dj" ? "songs" : lock.kind === "gestures" ? "smiles" : "kisses"); setPanel("top"); } else setPanel("rules"); };
        const text = lock.gesture && lock.kind === "kisses" ? t("bottle.lockGestureKiss") : lock.gesture && lock.kind === "vip" ? t("bottle.lockGestureVip") : t(`bottle.lockText_${lock.kind}` as "bottle.lockText_kisses");
        return (
          <OrigPopup title={t(`bottle.lockTitle_${lock.kind}` as "bottle.lockTitle_kisses")} onClose={() => setLock(null)} buttons={<>
            <OrigButton kind="cancel" onClick={() => setLock(null)}>{t("bottle.lockOk")}</OrigButton>
            {lock.kind === "friends" ? <OrigButton kind="confirm" onClick={more}>{t("bottle.lockInvite")}</OrigButton> : <OrigButton kind="info" onClick={more}>{t("bottle.lockMore")}</OrigButton>}
          </>}>
            <div className="flex flex-col items-center">
              <div className={cn("mb-[22px] mt-2 flex items-center justify-center grayscale", lock.gesture ? "mb-2.5 mt-0 h-[90px] w-[90px]" : "h-[60px] w-[60px]")}>{lock.gesture ? <img src={`/custom/anim/ges_${lock.gesture}.webp`} alt="" className="h-full w-full object-contain" /> : lock.gift ? <Gift id={lock.gift} className="h-full w-full" /> : null}</div>
              <p className="whitespace-pre-line text-center text-[14px]">{text}</p>
              {lock.kind === "vip" ? null : (
                <>
                  <div className="mb-2.5 mt-[15px] w-[200px] rounded-[3px] bg-[#EBEBEB]"><div className="h-1.5 bg-[#9E9E9E] transition-[width]" style={{ width: `${Math.min(100, (have / Math.max(1, lock.total)) * 100)}%` }} /></div>
                  <div className="mb-[5px] flex items-center text-[15px]">
                    <span aria-hidden="true" className="mr-[3px] h-[19px] w-[25px] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(/custom/orig/${icon}.svg)` }} />
                    <span><strong>{have.toLocaleString("ru-RU")}</strong>/{lock.total.toLocaleString("ru-RU")}</span>
                  </div>
                </>
              )}
            </div>
          </OrigPopup>
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
      {ipView ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-4" onClick={() => setIpView(null)}>
          <div onClick={(event) => event.stopPropagation()} className="max-h-[80vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-4 text-sm text-[#1F2937] shadow-2xl">
            <div className="mb-2 flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-base font-black">IP: {ipView.name}</p><button onClick={() => setIpView(null)} aria-label={t("photos.close")} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5"><X size={16} /></button></div>
            {ipView.loading ? <p className="py-4 text-center text-[#6B7280]">…</p> : ipView.rows.length === 0 ? <p className="py-4 text-center text-[#6B7280]">—</p> : (
              <ul className="space-y-1.5">
                {ipView.rows.map((row, n) => (
                  <li key={n} className="rounded-lg bg-[#F5F5F5] px-2.5 py-1.5">
                    <p className="font-mono text-[13px] font-bold">{row.ip}</p>
                    <p className="text-[11px] text-[#6B7280]">{row.event} · {new Date(row.at).toLocaleString()}</p>
                    {n === ipView.rows.findIndex((other) => other.ip === row.ip) && ipView.others[row.ip]?.length ? <p className="mt-0.5 text-[11px] font-bold text-[#B91C1C]">≈ {ipView.others[row.ip].join(", ")}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
      {mentionToast ? (
        <div role="status" className="absolute left-1/2 top-3 z-[58] flex w-[min(360px,calc(100%-24px))] -translate-x-1/2 items-center gap-2 rounded-2xl border border-[#93C5FD] bg-white p-2 text-[#1F2937] shadow-2xl">
          <span aria-hidden="true" className="text-2xl">💬</span>
          <p className="min-w-0 flex-1 text-sm font-semibold">{t("bottle.mentionYou").replace("{name}", mentionToast)}</p>
          <button onClick={() => setMentionToast(null)} aria-label={t("photos.close")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B7280]"><X size={16} /></button>
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
          <p className="min-w-0 flex-1 text-sm">{lostToast.self ? t("bottle.selfFreed").replace("{by}", lostToast.by ?? "").replace("{n}", String(lostToast.amount ?? 0)) : <><b>{lostToast.by}</b> {t("bottle.admireLost1")} <b>{lostToast.target}</b> {t("bottle.admireLost2")}</>}</p>
          <button onClick={() => setLostToast(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B7280] hover:text-[#111827]"><X size={16} /></button>
        </div>
      ) : null}
      {boughtToast ? (
        <div className="absolute inset-0 z-[62] flex items-center justify-center bg-black/40 p-4" onClick={() => setBoughtToast(null)}>
          <div role="dialog" aria-label={t("bottle.admirer")} onClick={(event) => event.stopPropagation()} className="relative w-full max-w-[340px] animate-[bottle-pop_0.25s_ease-out] rounded-2xl bg-white px-4 pb-4 pt-5 text-center text-[#1F2937] shadow-2xl">
            <button onClick={() => setBoughtToast(null)} aria-label={t("photos.close")} title={t("photos.close")} className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#5CC93B] bg-white text-[#5CC93B] shadow"><X size={18} strokeWidth={3} /></button>
            <div className="relative mx-auto h-24 w-24">
              <img src={boughtToast.avatar || NO_PHOTO} alt="" className="h-24 w-24 rounded-xl object-cover shadow" />
              <span aria-hidden="true" className="absolute -bottom-2 -right-2 text-3xl">💘</span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-snug">{(boughtToast.old ? t("bottle.boughtYou") : t("bottle.boughtYouNew")).replace("{by}", boughtToast.by ?? "").replace("{old}", boughtToast.old ?? "").replace("{n}", String(boughtToast.amount ?? 0))}</p>
            <button onClick={() => setBoughtToast(null)} className="mt-3 h-10 min-w-[120px] rounded-lg bg-[#8CC63F] px-4 text-sm font-bold text-white hover:brightness-105">OK</button>
          </div>
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
            {online ? <button onClick={() => void startCall({ id: dm.id, name: dm.name, avatar: dm.avatar }, false)} aria-label={t("call.voice")} title={t("call.voice")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/20"><Phone size={16} /></button> : null}
            <button onClick={() => setDm(null)} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/20"><X size={17} /></button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
            {dmLines.map((item, index) => { const call = parseCallLog(item.text); return <p key={index} className={cn("max-w-[80%] break-words rounded-2xl px-3 py-1.5 text-sm", item.mine ? "self-end bg-[#3B9EDD] text-white" : "self-start bg-surface-2 text-text")}>{call ? `📞 ${t(`call.log_${call.kind === "missed" && item.mine ? "noanswer" : call.kind}` as "call.log_done")}${call.kind === "done" ? ` · ${callClock(call.secs)}` : ""}` : item.text}</p>; })}
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
