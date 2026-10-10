import type { Person, Visit } from "@/types";
import { invisibleStore } from "./stores";
import { supabase } from "./supabase";
import { fetchUsers } from "./usersCache";

export type GuestEntry = { visit: Visit; person: Person };
type Row = { visitor_id: string; profile_id: string; visited_at: string };

export async function fetchGuests(): Promise<{ visitors: GuestEntry[]; visited: GuestEntry[] }> {
  const blank = { visitors: [], visited: [] };
  if (!supabase) return blank;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (!userId) return blank;
  const { data, error } = await supabase.from("profile_visits").select("visitor_id,profile_id,visited_at").or(`visitor_id.eq.${userId},profile_id.eq.${userId}`).order("visited_at", { ascending: false }).limit(300);
  if (error) {
    console.error("Guests could not be loaded:", error.message);
    return blank;
  }
  const rows = data as Row[];
  const users = await fetchUsers(rows.map((row) => (row.visitor_id === userId ? row.profile_id : row.visitor_id)));
  const entries = (mine: boolean) => rows.filter((row) => (row.visitor_id === userId) === mine).flatMap((row): GuestEntry[] => {
    const otherId = mine ? row.profile_id : row.visitor_id;
    const person = users.get(otherId);
    return person ? [{ visit: { userId: otherId, at: Date.parse(row.visited_at) }, person }] : [];
  });
  return { visitors: entries(false), visited: entries(true) };
}

// Records a profile view unless invisible mode hides visits.
export async function recordVisit(profileId: string) {
  const invisible = invisibleStore.read();
  if (!supabase || (invisible.enabled && invisible.hideVisits)) return;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (!userId || userId === profileId) return;
  await supabase.from("profile_visits").upsert({ visitor_id: userId, profile_id: profileId, visited_at: new Date().toISOString() }, { onConflict: "visitor_id,profile_id" });
}

export async function clearGuests(tab: "visitors" | "visited") {
  if (!supabase) return;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (userId) await supabase.from("profile_visits").delete().eq(tab === "visitors" ? "profile_id" : "visitor_id", userId);
}
