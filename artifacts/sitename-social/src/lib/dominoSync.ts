import { supabase } from "./supabase";

// Domino: the database owns the game (paket-HJ: domino_* functions). The page polls domino_sync and sends moves.
// Tile code = smaller*10 + bigger (2-3 = 23, 6-6 = 66, 0-4 = 4).
export type DSide = "L" | "R" | "U" | "D";
export type DMode = "101" | "365";
export type DSeat = { seat: number; user_id: string; name: string | null; handle?: string | null; avatar: string | null };
export type DTable = { id: number; owner: string | null; mode: DMode; target: number; teams: boolean; status: "waiting" | "playing" };
export type DLastScore = { team: number; pts: number; kind: "play" | "round" | "block" };
export type DGame = {
  players: string[]; n: number; mode: DMode; teams: number[]; team_count: number; scores: number[]; target: number;
  ch_a: number[]; ch_b: number[]; spin_idx: number | null; up_a: number[]; up_b: number[]; dn_a: number[]; dn_b: number[];
  turn: number; starter: number; passes: number; over: boolean; winner: number | null; blocked: boolean; first_tile: number | null;
  match_over: boolean; match_winner: number | null; instant: boolean; last_score: DLastScore | null; round_no: number;
  turn_at: string; over_at: string | null; last_move: { kind: string; p?: number; t?: number; side?: DSide; n?: number; auto?: boolean } | null;
  leaver: string | null; ver: number; stock_n: number; ends_sum: number; ends: { k: DSide; v: number; dbl: boolean }[];
  hand_n: number[]; hands?: number[][];
};
export type DSync = {
  gone?: boolean; now: string; turn_secs: number; table: DTable; seats: DSeat[];
  game?: DGame; me?: number | null; hand?: number[]; need?: "play" | "draw" | "pass" | "over"; moves?: { t: number; side: DSide }[];
};
export type DRoom = DTable & { seats: DSeat[] | null };
export type DInvite = { id: number; table_id: number; from_id: string; name: string | null; avatar: string | null; mode: DMode; target: number; at: string };
export type DTopRow = { user_id: string; name: string | null; handle: string | null; avatar: string | null; games: number; wins: number; points: number; rating: number };
export type DPairRow = { u1: string; u2: string; name1: string | null; name2: string | null; avatar1: string | null; avatar2: string | null; games: number; wins: number; points: number };
export type DProfile = {
  user_id: string;
  stats: { games: number; wins: number; points: number; rating: number; streak: number; best_streak: number } | null;
  week: { games: number; wins: number; points: number; rating: number } | null;
  month: { games: number; wins: number; points: number; rating: number } | null;
  medals: { medal: string; cnt: number; first_at: string; last_at: string }[];
};

export type DResult<T> = { data: T | null; error: string | null };

async function call<T>(name: string, args?: Record<string, unknown>): Promise<DResult<T>> {
  if (!supabase) return { data: null, error: "offline" };
  const { data, error } = await supabase.rpc(name, args);
  if (error) return { data: null, error: error.message || "failed" };
  return { data: data as T, error: null };
}

export const dominoRooms = () => call<DRoom[]>("domino_rooms_list");
export const dominoMyTable = () => call<number | null>("domino_my_table");
export const dominoCreate = (mode: DMode, target: number, teams: boolean) => call<number>("domino_create", { p_mode: mode, p_target: target, p_teams: teams });
export const dominoJoin = (table: number, seat: number | null) => call<number>("domino_join", { tid: table, p_seat: seat });
export const dominoLeave = () => call<null>("domino_leave");
export const dominoSettings = (table: number, mode: DMode, target: number, teams: boolean) => call<null>("domino_settings", { tid: table, p_mode: mode, p_target: target, p_teams: teams });
export const dominoStart = (table: number) => call<null>("domino_start", { tid: table });
export const dominoSync = (table: number) => call<DSync>("domino_sync", { tid: table });
export const dominoPlay = (table: number, tile: number, side: DSide) => call<DSync>("domino_play", { tid: table, p_tile: tile, p_side: side });
export const dominoDraw = (table: number) => call<DSync>("domino_draw", { tid: table });
export const dominoPass = (table: number) => call<DSync>("domino_pass", { tid: table });
export const dominoInvite = (table: number, to: string) => call<null>("domino_invite", { tid: table, p_to: to });
export const dominoInvites = () => call<DInvite[]>("domino_invites_mine");
export const dominoInviteAnswer = (id: number, accept: boolean) => call<number | null>("domino_invite_answer", { p_id: id, p_accept: accept });
export const dominoTop = (kind: "week" | "month" | "all") => call<DTopRow[]>("domino_top", { p_kind: kind, p_limit: 50 });
export const dominoPairsTop = () => call<DPairRow[]>("domino_top", { p_kind: "pairs", p_limit: 50 });
export const dominoProfile = (user: string | null = null) => call<DProfile>("domino_profile", { p_user: user });

// Find a user by @handle (profiles are readable by signed-in users) for invites.
export async function findUserByHandle(handle: string): Promise<{ id: string; name: string } | null> {
  if (!supabase) return null;
  const clean = handle.trim().replace(/^@/, "");
  if (!clean) return null;
  const { data } = await supabase.from("profiles").select("id, name").eq("handle", clean).maybeSingle();
  return data ? { id: data.id as string, name: (data.name as string) ?? clean } : null;
}

export const tileLo = (t: number) => Math.floor(t / 10);
export const tileHi = (t: number) => t % 10;
