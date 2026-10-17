import type { Notice } from "@/types";
import { supabase } from "./supabase";
import { fetchUsers } from "./usersCache";

type Row = { id: string; actor_id: string; type: Notice["type"]; gift_id: string | null; read: boolean; created_at: string };
const none: Notice[] = [];
let state = none;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
function set(next: Notice[]) {
  state = next;
  listeners.forEach((listener) => listener());
}
export const remoteNotices = {
  get: () => state,
  getServer: () => none,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

export async function refreshNotices() {
  if (!supabase) return;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (!userId) return set(none);
  const { data, error } = await supabase.from("notifications").select("id,actor_id,type,gift_id,read,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
  if (error) return console.error("Notifications could not be loaded:", error.message);
  const rows = data as Row[];
  const users = await fetchUsers(rows.map((row) => row.actor_id));
  set(rows.flatMap((row): Notice[] => {
    const person = users.get(row.actor_id);
    return person ? [{ id: row.id, type: row.type, userId: row.actor_id, at: Date.parse(row.created_at), read: row.read, giftId: (row.gift_id ?? undefined) as Notice["giftId"], user: person.user }] : [];
  }));
}
export function ensureNoticesLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshNotices();
}
export function resetRemoteNotices() {
  loadedFor = null;
  set(none);
}

export const remoteNoticeActions = {
  markRead: async (id: string) => {
    set(state.map((item) => (item.id === id ? { ...item, read: true } : item)));
    await supabase?.from("notifications").update({ read: true }).eq("id", id);
  },
  markAllRead: async () => {
    set(state.map((item) => ({ ...item, read: true })));
    await supabase?.from("notifications").update({ read: true }).eq("read", false);
  },
  remove: async (id: string) => {
    set(state.filter((item) => item.id !== id));
    await supabase?.from("notifications").delete().eq("id", id);
  },
  clear: async () => {
    const ids = state.map((item) => item.id);
    set(none);
    if (ids.length) await supabase?.from("notifications").delete().in("id", ids);
  },
};
