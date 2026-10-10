import type { Person } from "@/types";
import { toPerson, type PersonRow } from "./friendsSync";
import { supabase } from "./supabase";

const cache = new Map<string, Person>();

// Loads the given accounts once and reuses them; rows from the database only carry user ids.
export async function fetchUsers(ids: string[]): Promise<Map<string, Person>> {
  const missing = [...new Set(ids)].filter((id) => !cache.has(id));
  if (supabase && missing.length) {
    const { data } = await supabase.from("profiles").select("id,name,handle,avatar_url,city,last_seen").in("id", missing);
    ((data ?? []) as PersonRow[]).forEach((row) => cache.set(row.id, toPerson(row)));
  }
  return cache;
}
