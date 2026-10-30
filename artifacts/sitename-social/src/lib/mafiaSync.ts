import { supabase } from "./supabase";

// Mafia game: the database owns the game (rooms, roles, phases, votes). The page only polls the state and sends the player's actions.
export type MafiaRole = "mafia" | "sheriff" | "doctor" | "civil";
export type MafiaPlayer = { id: string; name: string; avatar: string | null; seat: number; alive: boolean; bot: boolean; left: boolean; me: boolean; role: MafiaRole | null };
export type MafiaChat = { id: number; from: string | null; name: string | null; body: string; channel: "all" | "mafia"; code: string | null; at: number };
export type MafiaRoom = {
  id: number; kind: string; fee: number; voice: boolean; voice_key: string | null; status: "waiting" | "playing" | "finished"; phase: "lobby" | "night" | "talk" | "vote" | "end";
  round: number; pot: number; winner: "mafia" | "civil" | null; min: number; max: number; locked: boolean; last_save: string | null; phase_end: number | null;
};
export type MafiaState = {
  gone?: boolean; now: number; room: MafiaRoom;
  me: { id: string; role: MafiaRole | null; alive: boolean; seat: number; left: boolean };
  players: MafiaPlayer[]; chat: MafiaChat[]; votes: { voter: string; target: string | null }[];
  my_target: string | null; checks: { target: string; mafia: boolean; round: number }[]; kills: { by: string; target: string }[];
};
export type MafiaListRoom = { id: number; kind: string; fee: number; voice: boolean; locked: boolean; players: number; min: number; max: number; start_in: number | null };
export type MafiaList = { rooms: MafiaListRoom[]; me: number | null; stats: { games: number; wins: number }; hearts: number };
export type MafiaJoin = { room?: number; error?: "auth" | "closed" | "full" | "password" | "busy" | "hearts" | "kind"; need?: number };
export type MafiaActResult = { ok?: boolean; error?: string; mafia?: boolean };

async function call<T>(name: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(name, args);
  return error ? null : (data as T);
}
export const mafiaRoomsList = () => call<MafiaList>("mafia_rooms_list");
export const mafiaQuick = (kind: string, voice: boolean) => call<MafiaJoin>("mafia_quick", { p_kind: kind, p_voice: voice });
export const mafiaCreate = (kind: string, password: string | null, voice: boolean) => call<MafiaJoin>("mafia_create", { p_kind: kind, p_password: password, p_voice: voice });
export const mafiaJoin = (room: number, password: string | null) => call<MafiaJoin>("mafia_join", { p_room: room, p_password: password });
export const mafiaLeave = (room: number) => call<boolean>("mafia_leave", { p_room: room });
export const mafiaState = (room: number, after: number) => call<MafiaState>("mafia_state", { p_room: room, p_after: after });
export const mafiaAct = (room: number, kind: "kill" | "check" | "save" | "vote", target: string | null) => call<MafiaActResult>("mafia_act", { p_room: room, p_kind: kind, p_target: target });
export const mafiaSay = (room: number, text: string) => call<boolean>("mafia_say", { p_room: room, p_text: text });
export const mafiaReport = (room: number, target: string | null, reason: string) => call<boolean>("mafia_report", { p_room: room, p_target: target, p_reason: reason });
