import { supabase } from "./supabase";

// Live tables of the bottle game. The database owns the game: seats, turns, where the bottle stops, answers and kisses.
export type BottleSeat = { seat: number; id: string; name: string | null; avatar: string | null; gender: string | null; kisses: number; total?: number; smiles?: number; songs?: number; zodiac?: number | null; age: number | null };
export type BottleChat = { id: number; from: string | null; to: string | null; kind: "text" | "kiss" | "wheel" | "song" | "gift"; body: string | null };
export type BottleState = {
  table: number; me: string; now: number; hearts: number; chances?: number; winner?: { name: string | null; amount: number } | null;
  phase: "waiting" | "spinning" | "choice" | "result"; phase_at: number;
  turn: string | null; target: string | null; spinner_answer: boolean | null; target_answer: boolean | null; round: number;
  seats: BottleSeat[]; chat: BottleChat[];
  wheel?: boolean; track?: BottleTrack | null;
};
export type BottleTrack = { kind: "youtube" | "mp3"; ref: string; title: string | null; by: string | null; to: string | null; at: number };
async function call<T>(name: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(name, args);
  return error ? null : (data as T);
}
export const bottleJoin = () => call<number>("bottle_join");
export const bottleLeave = () => call<null>("bottle_leave");
export const bottleSync = (after: number) => call<BottleState>("bottle_sync", { p_after: after });
export const bottleSpin = () => call<boolean>("bottle_spin");
export const bottleAnswer = (kiss: boolean) => call<null>("bottle_answer", { p_kiss: kiss });
export const bottleSay = (text: string) => call<null>("bottle_say", { p_text: text });
export const bottleSpend = (amount: number) => call<number>("bottle_spend", { p_amount: amount });
export const bottleCocktail = (to: string) => call<number>("bottle_cocktail", { p_to: to });
export const bottleBuyChances = (pack: number) => call<{ hearts: number; chances: number }>("bottle_buy_chances", { p_pack: pack });
export const bottleWheel = () => call<{ sector: number; hearts: number; chances: number }>("bottle_wheel_spin");
export const bottleSong = (to: string, kind: "video" | "mp3") => call<number>("bottle_song", { p_to: to, p_kind: kind });
export type BottleTables = { tables: { id: number; boys: number; girls: number }[]; friends: { id: string; name: string | null; avatar: string | null; table: number; friend?: boolean }[] };
export type BottleMove = { table?: number; full?: boolean; position?: number; gone?: boolean };
export const bottleTables = () => call<BottleTables>("bottle_tables_list");
export const bottleMove = (table: number | null) => call<BottleMove>("bottle_move", { p_table: table });
export const bottleQueueLeave = () => call<null>("bottle_queue_leave");
export const bottlePlay = (to: string | null, kind: "youtube" | "mp3", ref: string, title: string) => call<number>("bottle_play", { p_to: to, p_kind: kind, p_ref: ref, p_title: title.slice(0, 120) });
export type BottleTopRow = { id: string; name: string | null; avatar: string | null; count: number; place: number };
export type BottleTop = { list: BottleTopRow[]; me: { place: number; count: number } | null };
export const bottleTop = (kind: "kisses" | "songs" | "cocktails" | "smiles", period: "all" | "week" | "day") => call<BottleTop>("bottle_top", { p_kind: kind, p_period: period });
export const bottleGift = (to: string, gift: string, price: number) => call<number>("bottle_gift", { p_to: to, p_gift: gift, p_price: price });
