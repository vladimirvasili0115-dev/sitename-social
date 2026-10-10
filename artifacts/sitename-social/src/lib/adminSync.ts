import { removeAllMyFiles, removeFiles } from "./media";
import { supabase } from "./supabase";

export type AdminStats = Record<"profiles" | "posts" | "comments" | "messages" | "groups" | "videos" | "tracks" | "photos" | "stories" | "gifts" | "newDay" | "newWeek" | "banned" | "online" | "openReports" | "coins", number>;
export type AdminUser = { id: string; name: string; handle: string; avatar: string | null; email: string; joined: number; lastSeen: number | null; banned: boolean; moderator: boolean; owner: boolean; balance: number };
export type ContentKind = "post" | "video" | "track";
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
export const setBan = async (id: string, banned: boolean) => (await call("admin_set_ban", { target: id, banned })) !== null;
export const setModerator = async (id: string, enabled: boolean) => (await call("admin_set_moderator", { target: id, enabled })) !== null;
export async function grantCoins(id: string, amount: number): Promise<number | null> {
  const total = await call<number>("admin_grant_coins", { target: id, amount });
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
