import type { User } from "@/types";
import { initialsAvatar } from "./avatar";
import { supabase } from "./supabase";

export type ProfileRow = { id: string; name: string; handle: string; avatar_url: string | null; cover_url?: string | null; city?: string | null; status?: string | null; bio?: string | null };
export type RemotePerson = { user: User; city: string; mutual: number; status: string; bio: string; cover: string | null };
export const isRemoteId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(id);

export const toUser = (row: Pick<ProfileRow, "id" | "name" | "handle" | "avatar_url">): User => ({ id: row.id, name: row.name, handle: row.handle, avatar: row.avatar_url || initialsAvatar(row.name) });

export async function fetchPerson(id: string): Promise<RemotePerson | null> {
  if (!supabase || !isRemoteId(id)) return null;
  const { data } = await supabase.from("profiles").select("id,name,handle,avatar_url,cover_url,city,status,bio").eq("id", id).maybeSingle();
  const row = data as ProfileRow | null;
  return row ? { user: toUser(row), city: row.city ?? "", mutual: 0, status: row.status ?? "", bio: row.bio ?? "", cover: row.cover_url ?? null } : null;
}
