import type { User } from "@/types";
import { initialsAvatar } from "./avatar";
import { supabase } from "./supabase";

export type ProfileRow = { id: string; name: string; handle: string; avatar_url: string | null; cover_url?: string | null; city?: string | null; status?: string | null; bio?: string | null; last_seen?: string | null };
export type RemotePerson = { user: User; city: string; mutual: number; status: string; bio: string; cover: string | null };
export const isRemoteId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id);

export const toUser = (row: Pick<ProfileRow, "id" | "name" | "handle" | "avatar_url">): User => ({ id: row.id, name: row.name, handle: row.handle, avatar: row.avatar_url || initialsAvatar(row.name) });

export async function fetchPerson(id: string): Promise<RemotePerson | null> {
  if (!supabase || !isRemoteId(id)) return null;
  const { data } = await supabase.from("profiles").select("id,name,handle,avatar_url,cover_url,city,status,bio,last_seen").eq("id", id).maybeSingle();
  const row = data as ProfileRow | null;
  return row ? { user: { ...toUser(row), online: Boolean(row.last_seen) && Date.now() - Date.parse(row.last_seen ?? "") < 3 * 60_000, lastSeen: row.last_seen ? Date.parse(row.last_seen) : undefined }, city: row.city ?? "", mutual: 0, status: row.status ?? "", bio: row.bio ?? "", cover: row.cover_url ?? null } : null;
}

// The account behind an @name ("me" for your own), or null.
export async function findByHandle(handle: string): Promise<string | null> {
  if (!supabase) return null;
  const clean = handle.replace(/[^A-Za-z0-9_.]/g, "");
  if (!clean) return null;
  const [{ data }, session] = await Promise.all([supabase.from("profiles").select("id").ilike("handle", clean.replace(/_/g, "\\_")).limit(1), supabase.auth.getSession()]);
  const id = (data as { id: string }[] | null)?.[0]?.id ?? null;
  return id && id === session.data.session?.user.id ? "me" : id;
}
