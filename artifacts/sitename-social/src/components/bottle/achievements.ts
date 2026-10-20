import { bottleStatBump, bottleStatsMerge } from "@/lib/bottleSync";

// The game's achievements: 48 medals with 3 stars each, built from counted things (kisses, spins, gifts, songs, chat...).
// On a live table the server counts and pays; the counters in this browser are only for the demo table.

export type Metric =
  | "kissesGot" | "kissesGiven" | "refusals" | "spins" | "giftsSent" | "songsSent" | "songsGot" | "smilesGot"
  | "admire" | "tables" | "chat" | "dm" | "roomsCreated" | "roomsJoined" | "multi" | "days" | "top" | "night" | "cocktailsGot"
  | `gift:${string}`;

// Medals: every row of the game has 3 medals (I, II, III) and every medal has 3 stars.
// Each star is a step; reaching it pays hearts into the balance (the server counts and pays, see bottle_ach_def —
// the numbers here must stay the same as there).
export type Achievement = { id: string; metric: Metric; series: string; level: number; levels: number; steps: number[]; rewards: number[]; icon: string; gift?: string };

// First step's reward is `base`; later steps pay more, in proportion to how much harder they are.
export const achReward = (base: number, first: number, need: number) => Math.max(1, Math.round(base * Math.pow(need / first, 0.68)));

const rows: [Metric, string, number[], [string, string, string]][] = [
  ["songsSent", "songsSent", [50, 250, 1000, 2500, 5000, 10000, 20000, 35000, 50000], ["🎵", "🎸", "🎤"]],
  ["kissesGot", "kissesGot", [50, 250, 1000, 2500, 5000, 10000, 20000, 35000, 50000], ["💋", "💖", "👑"]],
  ["kissesGiven", "kissesGiven", [50, 250, 1000, 2500, 5000, 10000, 20000, 35000, 50000], ["😘", "🥰", "😍"]],
  ["giftsSent", "giftsSent", [100, 500, 2000, 5000, 10000, 20000, 30000, 40000, 50000], ["🎁", "💐", "💎"]],
  ["spins", "spins", [100, 500, 2000, 5000, 10000, 20000, 30000, 40000, 50000], ["🍾", "🌀", "🏆"]],
  ["chat", "chat", [200, 1000, 3000, 6000, 10000, 20000, 30000, 40000, 50000], ["💬", "📢", "📣"]],
  ["songsGot", "songsGot", [20, 100, 300, 600, 1000, 2000, 4000, 7000, 10000], ["🎧", "📻", "🎼"]],
  ["smilesGot", "smilesGot", [50, 250, 1000, 2000, 4000, 7000, 10000, 15000, 20000], ["😊", "😄", "🤩"]],
  ["cocktailsGot", "cocktailsGot", [20, 100, 300, 600, 1000, 2000, 4000, 7000, 10000], ["🍹", "🍸", "🥂"]],
  ["admire", "admire", [5, 20, 50, 100, 200, 400, 700, 1000, 2000], ["💘", "🏹", "💍"]],
  ["refusals", "refusals", [20, 100, 300, 600, 1000, 2000, 3000, 4000, 5000], ["🙅", "✋", "🚫"]],
];
// Gifts with their own collection medal (10, 100 and 1000 sent).
const collected: [string, string][] = [
  ["rose", "🌹"], ["crown", "👑"], ["e:🍓", "🍓"], ["e:🍸", "🍸"], ["tea", "🫖"], ["e:🍺", "🍺"], ["e:🧸", "🧸"], ["diamond", "💎"],
  ["e:🐸", "🐸"], ["e:🦆", "🦆"], ["e:🍰", "🍰"], ["e:🥂", "🥂"], ["e:🍷", "🍷"], ["e:☕", "☕"], ["e:💋", "💋"],
];

export const achievements: Achievement[] = [
  ...rows.flatMap(([metric, series, steps, icons]) => [0, 1, 2].map((level) => {
    const mine = steps.slice(level * 3, level * 3 + 3);
    return { id: `${series}-${level}`, metric, series, level, levels: 3, steps: mine, rewards: mine.map((need) => achReward(5, steps[0], need)), icon: icons[level] };
  })),
  ...collected.map(([gift, icon]) => ({ id: `gift-${icon}`, metric: `gift:${gift}` as Metric, series: "gift", level: 0, levels: 1, steps: [10, 100, 1000], rewards: [10, 100, 1000].map((need) => achReward(3, 10, need)), icon, gift: icon })),
];
// How many stars of this medal are reached (0–3).
export const starsOf = (item: Achievement, have: number) => item.steps.filter((need) => have >= need).length;

const KEY = "bottle-stats";
export type Stats = Record<string, number>;
let statsCache: Stats | null = null;
let saveTimer = 0;
export function readStats(): Stats {
  if (statsCache) return { ...statsCache };
  try { statsCache = JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Stats; } catch { statsCache = {}; }
  return { ...statsCache };
}
export function bumpStat(metric: string, by = 1, max = false) {
  try {
    const stats = readStats();
    stats[metric] = max ? Math.max(stats[metric] ?? 0, by) : (stats[metric] ?? 0) + by;
    statsCache = stats;
    // Saved to the device at most every 2 seconds (an auto-clicker no longer writes storage hundreds of times a second).
    if (!saveTimer) saveTimer = window.setTimeout(() => { saveTimer = 0; try { window.localStorage.setItem(KEY, JSON.stringify(statsCache ?? {})); } catch { /* storage is blocked */ } }, 2000);
  } catch { /* storage is blocked */ }
  // The server keeps the same counters, so every device shows the same medals (does nothing without a server).
  // Counts are collected for a few seconds and sent together: a stream of gifts is a couple of requests, not hundreds.
  const cur = pending.get(metric);
  pending.set(metric, max ? { by: Math.max(cur?.by ?? 0, by), max: true } : { by: (cur?.by ?? 0) + by, max: false });
  if (!flushTimer) {
    flushTimer = window.setTimeout(flushStats, 4000);
    if (!flushHooked) { flushHooked = true; window.addEventListener("pagehide", flushStats); }
  }
}
const pending = new Map<string, { by: number; max: boolean }>();
let flushTimer = 0;
let flushHooked = false;
function flushStats() {
  window.clearTimeout(flushTimer);
  flushTimer = 0;
  for (const [metric, { by, max }] of pending) {
    if (max) { void bottleStatBump(metric, Math.min(50, Math.max(1, by)), true); continue; }
    for (let left = by; left > 0; left -= 50) void bottleStatBump(metric, Math.min(50, left), false);
  }
  pending.clear();
}
// Joins this device's counters with the server's: the bigger number of each stays everywhere.
export async function syncStats() {
  const server = await bottleStatsMerge(readStats());
  if (!server) return false;
  try {
    const stats = readStats();
    for (const [key, value] of Object.entries(server)) stats[key] = Math.max(stats[key] ?? 0, value);
    statsCache = stats;
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch { /* storage is blocked */ }
  return true;
}
// Counts a day of play once per calendar day, and late-night play (00:00–05:00) once per night.
export function markVisit() {
  try {
    const stats = readStats();
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const stamp = Number(day.replace(/-/g, ""));
    if (stats.lastDay !== stamp) { stats.days = (stats.days ?? 0) + 1; stats.lastDay = stamp; }
    if (now.getHours() < 5 && stats.lastNight !== stamp) { stats.night = (stats.night ?? 0) + 1; stats.lastNight = stamp; }
    statsCache = stats;
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch { /* storage is blocked */ }
}
