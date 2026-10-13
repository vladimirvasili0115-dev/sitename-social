// The game's achievements: 95 medals built from a few counted things (kisses, spins, gifts, songs, chat...).
// Most counters live in this browser; kisses, songs and smiles received come from the live table when there is one.

export type Metric =
  | "kissesGot" | "kissesGiven" | "refusals" | "spins" | "giftsSent" | "songsSent" | "songsGot" | "smilesGot"
  | "admire" | "tables" | "chat" | "dm" | "roomsCreated" | "roomsJoined" | "multi" | "days" | "top" | "night"
  | `gift:${string}`;

export type Achievement = { id: string; metric: Metric; need: number; stars: 1 | 2 | 3; icon: string; series: string; level: number; levels: number; gift?: string };

const series: { metric: Metric; key: string; steps: [number, string][] }[] = [
  { metric: "kissesGot", key: "kissesGot", steps: [[1, "💋"], [10, "💌"], [50, "💘"], [100, "💖"], [500, "💝"], [1000, "💞"], [5000, "👑"]] },
  { metric: "kissesGiven", key: "kissesGiven", steps: [[1, "😘"], [10, "😚"], [100, "😙"], [500, "🥰"], [1000, "😍"]] },
  { metric: "refusals", key: "refusals", steps: [[1, "🙅"], [10, "✋"], [100, "🚫"]] },
  { metric: "spins", key: "spins", steps: [[1, "🍾"], [10, "🔄"], [100, "🌀"], [500, "🎡"], [1000, "🌪️"], [5000, "🏆"]] },
  { metric: "giftsSent", key: "giftsSent", steps: [[1, "🎁"], [10, "🎀"], [50, "🛍️"], [100, "💐"], [500, "🎊"], [1000, "💎"], [5000, "🏰"]] },
  { metric: "songsSent", key: "songsSent", steps: [[1, "🎵"], [10, "🎶"], [50, "🎸"], [100, "🎤"]] },
  { metric: "songsGot", key: "songsGot", steps: [[1, "🎧"], [10, "📻"], [100, "🎼"]] },
  { metric: "smilesGot", key: "smilesGot", steps: [[1, "😊"], [10, "😄"], [100, "🤩"]] },
  { metric: "admire", key: "admire", steps: [[1, "💘"], [10, "🏹"], [50, "💍"]] },
  { metric: "tables", key: "tables", steps: [[1, "🚪"], [10, "🧭"], [50, "🗺️"]] },
  { metric: "chat", key: "chat", steps: [[1, "💬"], [50, "🗨️"], [500, "📢"], [2000, "📣"]] },
  { metric: "dm", key: "dm", steps: [[1, "✉️"], [10, "📨"], [100, "📮"]] },
  { metric: "roomsCreated", key: "roomsCreated", steps: [[1, "🏠"], [10, "🏰"]] },
  { metric: "roomsJoined", key: "roomsJoined", steps: [[1, "🔑"], [10, "🗝️"], [50, "🎟️"]] },
  { metric: "multi", key: "multi", steps: [[1, "👥"], [10, "🎉"]] },
  { metric: "days", key: "days", steps: [[1, "📅"], [7, "🗓️"], [30, "🌙"], [100, "⭐"]] },
  { metric: "top", key: "top", steps: [[1, "🏅"]] },
  { metric: "night", key: "night", steps: [[1, "🦉"], [10, "🌌"]] },
];

// Gifts with their own collection medals (10 and 100 sent).
const collected: [string, string][] = [
  ["rose", "🌹"], ["crown", "👑"], ["e:🍓", "🍓"], ["e:🍸", "🍸"], ["tea", "🫖"], ["e:🍺", "🍺"], ["e:🧸", "🧸"], ["diamond", "💎"],
  ["e:🐸", "🐸"], ["e:🦆", "🦆"], ["e:🍰", "🍰"], ["e:🥂", "🥂"], ["e:🍷", "🍷"], ["e:☕", "☕"], ["e:💋", "💋"],
];

const starsOf = (level: number, levels: number) => (levels === 1 ? 2 : Math.min(3, Math.max(1, Math.ceil((3 * (level + 1)) / levels)))) as 1 | 2 | 3;

export const achievements: Achievement[] = [
  ...series.flatMap(({ metric, key, steps }) => steps.map(([need, icon], level) => ({ id: `${key}-${need}`, metric, need, icon, series: key, level, levels: steps.length, stars: starsOf(level, steps.length) }))),
  ...collected.flatMap(([gift, icon]) => [10, 100].map((need, level) => ({ id: `gift-${icon}-${need}`, metric: `gift:${gift}` as Metric, need, icon, series: "gift", level, levels: 2, stars: (level ? 3 : 1) as 1 | 3, gift: icon }))),
];

const KEY = "bottle-stats";
export type Stats = Record<string, number>;
export function readStats(): Stats {
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Stats; } catch { return {}; }
}
export function bumpStat(metric: string, by = 1, max = false) {
  try {
    const stats = readStats();
    stats[metric] = max ? Math.max(stats[metric] ?? 0, by) : (stats[metric] ?? 0) + by;
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch { /* storage is blocked */ }
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
    window.localStorage.setItem(KEY, JSON.stringify(stats));
  } catch { /* storage is blocked */ }
}
