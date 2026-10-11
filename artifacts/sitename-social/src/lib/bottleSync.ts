import { supabase } from "./supabase";

// Live tables of the bottle game. The database owns the game: seats, turns, where the bottle stops, answers and kisses.
export type BottleSeat = { seat: number; id: string; name: string | null; avatar: string | null; gender: string | null; kisses: number; total?: number; age: number | null };
export type BottleChat = { id: number; from: string | null; to: string | null; kind: "text" | "kiss" | "wheel"; body: string | null };
export type BottleState = {
  table: number; me: string; now: number; hearts: number; chances?: number; winner?: { name: string | null; amount: number } | null;
  phase: "waiting" | "spinning" | "choice" | "result"; phase_at: number;
  turn: string | null; target: string | null; spinner_answer: boolean | null; target_answer: boolean | null; round: number;
  seats: BottleSeat[]; chat: BottleChat[];
};
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
