import { removeAllMyFiles, removeFiles } from "./media";
import { supabase } from "./supabase";

export type AdminStats = Record<"profiles" | "posts" | "comments" | "messages" | "groups" | "videos" | "tracks" | "photos" | "stories" | "gifts" | "newDay" | "newWeek" | "banned" | "online" | "openReports" | "coins", number>;
export type AdminUser = { id: string; name: string; handle: string; avatar: string | null; email: string; joined: number; lastSeen: number | null; banned: boolean; moderator: boolean; owner: boolean; balance: number };
export type ContentKind = "post" | "comment" | "video" | "track" | "group";
export type AdminContent = { id: string; ownerId: string; ownerName: string; body: string; mediaUrl: string | null; at: number };
type UserRow = { id: string; name: string | null; handle: string | null; avatar_url: string | null; email: string | null; created_at: string; last_seen: string | null; banned: boolean; moderator: boolean; owner: boolean; balance: number };
type ContentRow = { id: string; owner_id: string; owner_name: string | null; body: string | null; media_url: string | null; created_at: string };

// Every call below is checked again on the server: only moderators get an answer.
async function call<T>(name: string, args?: Record<string, unknown>): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    console.error(`${name} failed:`, error.message);
    return null;
  }
  return (data ?? true) as T;
}

export const fetchStats = () => call<AdminStats>("admin_stats");
export async function fetchAdminUsers(search: string): Promise<AdminUser[] | null> {
  const rows = await call<UserRow[]>("admin_users", { search: search.trim(), lim: 100, off: 0 });
  if (!Array.isArray(rows)) return null;
  return rows.map((row) => ({
    id: row.id, name: row.name ?? "", handle: row.handle ?? "", avatar: row.avatar_url, email: row.email ?? "", joined: Date.parse(row.created_at),
    lastSeen: row.last_seen ? Date.parse(row.last_seen) : null, banned: row.banned, moderator: row.moderator, owner: row.owner, balance: Number(row.balance),
  }));
}
export async function fetchIsOwner(): Promise<boolean> {
  return (await call<boolean>("is_owner")) === true;
}
// One player's game state and grants (owner and moderators): hearts, VIP and TOP days, DJ score, chances, boosters.
export type GameState = { hearts: number; kisses?: number; smiles?: number; dj: number; chances: number; vip_until: string | null; top_until: string | null; kiss_fire: number; refuse_slap: number };
export type GameFlags = { vip: boolean; top: boolean; block?: boolean; price?: number; influence?: number; hearts?: number; kisses?: number; songs?: number; smiles?: number };
export const gameFlags = (ids: string[]) => call<Record<string, GameFlags>>("admin_game_flags", { ids });
export type StatKind = "songs" | "kisses" | "smiles";
export type StatFreeze = Record<string, Partial<Record<StatKind, boolean>>>;
export const statFreezeGet = (ids: string[]) => call<StatFreeze>("admin_stat_freeze_get", { ids });
export const statFreezeSet = (id: string, kind: StatKind, on: boolean) => call<boolean>("admin_stat_freeze", { target: id, p_kind: kind, p_on: on });
export type GiftAllow = Record<string, Record<string, boolean>>;
export const giftAllowGet = (ids: string[]) => call<GiftAllow>("admin_gift_allow_get", { ids });
export const giftAllowSet = (id: string, gift: string, on: boolean) => call<boolean>("admin_gift_allow", { target: id, p_gift: gift, p_on: on });
export const gameState = (id: string) => call<GameState>("admin_game_state", { target: id });
export const gameGrant = (id: string, kind: "vip" | "top" | "price" | "influence" | "admire_block" | "dj" | "kisses" | "smiles" | "chances" | "kiss_fire" | "refuse_slap", amount: number) => call<GameState>("admin_game_grant", { target: id, p_kind: kind, amount });
// VIP for every player at once (owner and moderators); days are added on top of any VIP someone already has.
export const vipAll = (days: number) => call<number>("admin_vip_all", { p_days: days });
// All smileys unlocked for everyone (on) or back to the normal unlock rules (off).
export const gesturesOpenGet = () => call<boolean>("bottle_gestures_open");
export const gesturesOpenSet = (on: boolean) => call<boolean>("admin_gestures_open_set", { p_on: on });
export const setNameColor = (id: string, color: string) => call<boolean>("admin_name_color_set", { target: id, p_color: color });
export const vipCount = () => call<{ vip: number; total: number }>("admin_vip_count");
export const setModerator = async (id: string, enabled: boolean) => (await call("admin_set_moderator", { target: id, enabled })) !== null;
export async function grantCoins(id: string, amount: number): Promise<number | null> {
  const total = await call<number>("admin_grant_coins", { target: id, amount });
  return total === null ? null : Number(total);
}
export async function grantHearts(id: string, amount: number): Promise<number | null> {
  const total = await call<number>("admin_grant_hearts", { target: id, amount });
  return total === null ? null : Number(total);
}
export async function deleteUser(id: string): Promise<boolean> {
  try {
    await removeAllMyFiles(id);
  } catch (error) {
    console.error("Files could not be removed:", error);
  }
  return (await call("admin_delete_user", { target: id })) !== null;
}
export async function fetchContent(kind: ContentKind): Promise<AdminContent[] | null> {
  const rows = await call<ContentRow[]>("admin_content", { kind, lim: 80 });
  if (!Array.isArray(rows)) return null;
  return rows.map((row) => ({ id: row.id, ownerId: row.owner_id, ownerName: row.owner_name ?? "", body: row.body ?? "", mediaUrl: row.media_url, at: Date.parse(row.created_at) }));
}
export async function deleteContent(kind: ContentKind, item: AdminContent): Promise<boolean> {
  if ((await call("admin_delete_content", { kind, target: item.id })) === null) return false;
  await removeFiles([item.mediaUrl]);
  return true;
}

// ----- Journal, bans with a reason, user card, charts, notice, word filter, prices -----
export type LogEntry = { id: number; admin: string; action: string; targetId: string | null; target: string; details: string; at: number };
export type UserDetail = {
  posts: number; comments: number; videos: number; tracks: number; photos: number; groups: number; friends: number; reportsTotal: number; reportsOpen: number;
  ban: { reason: string; until: string | null; at: string } | null;
  log: { action: string; admin: string; details: string; at: string }[];
  recentPosts: { id: string; text: string; image: string | null; at: string }[];
};
export type SeriesPoint = { day: string; users: number; posts: number };
export type SiteNotice = { body: string; kind: "info" | "warning"; active: boolean; updatedAt: string };
type LogRow = { id: number; admin_name: string; action: string; target_id: string | null; target_name: string; details: string; created_at: string };

export async function fetchLog(): Promise<LogEntry[] | null> {
  const rows = await call<LogRow[]>("admin_log_list", { lim: 150 });
  if (!Array.isArray(rows)) return null;
  return rows.map((row) => ({ id: row.id, admin: row.admin_name, action: row.action, targetId: row.target_id, target: row.target_name, details: row.details, at: Date.parse(row.created_at) }));
}
// days: 0 = forever, a negative number lifts the ban.
export const banUser = async (id: string, days: number, reason: string) => (await call("admin_set_ban", { target: id, days, reason })) !== null;
export async function fetchUserDetail(id: string): Promise<UserDetail | null> {
  const data = await call<UserDetail>("admin_user_detail", { target: id });
  return data && typeof data === "object" ? data : null;
}
export async function fetchSeries(): Promise<SeriesPoint[] | null> {
  const data = await call<SeriesPoint[]>("admin_series");
  return Array.isArray(data) ? data : null;
}
export async function fetchNotice(): Promise<SiteNotice | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_notice").select("body,kind,active,updated_at").eq("id", 1).maybeSingle();
  if (error || !data) return null;
  const row = data as { body: string; kind: "info" | "warning"; active: boolean; updated_at: string };
  return { body: row.body, kind: row.kind, active: row.active, updatedAt: row.updated_at };
}
export const saveNotice = async (body: string, kind: SiteNotice["kind"], active: boolean) => (await call("admin_set_notice", { body, kind, active })) !== null;
export async function fetchWords(): Promise<string[] | null> {
  const data = await call<string[]>("admin_words");
  return Array.isArray(data) ? data : null;
}
export const setWord = async (word: string, enabled: boolean) => (await call("admin_word_set", { word, enabled })) !== null;
export const setPrice = async (table: "gift_prices" | "coin_packages", key: string, column: string, value: number) => (await call("admin_price_set", { tbl: table, key, col: column, val: value })) !== null;
export async function fetchPriceTables(): Promise<{ gifts: import("./pricesSync").PriceTable; packages: import("./pricesSync").PriceTable } | null> {
  const data = await call<{ gifts: import("./pricesSync").PriceTable; packages: import("./pricesSync").PriceTable }>("price_list");
  return data && typeof data === "object" && "gifts" in data ? data : null;
}

export const setVerified = async (id: string, enabled: boolean) => (await call("admin_set_verified", { target: id, enabled })) !== null;
export type Welcome = { enabled: boolean; text: string };
export async function fetchWelcome(): Promise<Welcome | null> {
  const data = await call<Welcome>("admin_welcome_get");
  return data && typeof data === "object" ? data : null;
}
export const saveWelcome = async (body: string, enabled: boolean) => (await call("admin_welcome_set", { body, enabled })) !== null;
