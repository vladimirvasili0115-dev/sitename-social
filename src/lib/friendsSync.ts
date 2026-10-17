import type { Person } from "@/types";
import { toUser, type ProfileRow } from "./remoteProfiles";
import { invisibleStore } from "./stores";
import { supabase } from "./supabase";
import { flashRefusal } from "./flash";

type Row = ProfileRow & { last_seen: string | null };
type Link = { status: "pending" | "accepted"; requester_id: string; addressee_id: string };
type RemoteFriends = { friends: Person[]; incoming: Person[]; outgoing: Person[]; others: Person[]; everyone: Person[] };

const ONLINE_WINDOW = 3 * 60_000;
const empty: RemoteFriends = { friends: [], incoming: [], outgoing: [], others: [], everyone: [] };
let state = empty;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
function set(next: RemoteFriends) {
  state = next;
  listeners.forEach((listener) => listener());
}
export const remoteFriends = {
  get: () => state,
  getServer: () => empty,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

const isOnline = (lastSeen: string | null) => Boolean(lastSeen) && Date.now() - Date.parse(lastSeen ?? "") < ONLINE_WINDOW;
export type PersonRow = Row;
export const toPerson = (row: Row): Person => ({ user: { ...toUser(row), online: isOnline(row.last_seen) }, city: row.city ?? "", mutual: 0 });
async function sessionUserId() {
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session?.user.id ?? null;
}

export async function refreshFriends() {
  const userId = await sessionUserId();
  if (!supabase || !userId) return set(empty);
  const [links, profiles] = await Promise.all([
    supabase.from("friendships").select("status,requester_id,addressee_id").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    supabase.from("profiles").select("id,name,handle,avatar_url,city,last_seen").neq("id", userId).order("last_seen", { ascending: false, nullsFirst: false }).limit(500),
  ]);
  if (links.error || profiles.error) return console.error("Friends could not be loaded:", links.error?.message ?? profiles.error?.message);
  const everyone = (profiles.data as Row[]).map(toPerson);
  const byId = new Map(everyone.map((person) => [person.user.id, person]));
  const pick = (ids: string[]) => ids.flatMap((id) => byId.get(id) ?? []);
  const rows = links.data as Link[];
  const other = (link: Link) => (link.requester_id === userId ? link.addressee_id : link.requester_id);
  const related = new Set(rows.map(other));
  set({
    everyone,
    friends: pick(rows.filter((link) => link.status === "accepted").map(other)),
    incoming: pick(rows.filter((link) => link.status === "pending" && link.addressee_id === userId).map(other)),
    outgoing: pick(rows.filter((link) => link.status === "pending" && link.requester_id === userId).map(other)),
    others: everyone.filter((person) => !related.has(person.user.id)),
  });
}
export function ensureFriendsLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshFriends();
}
export function resetRemoteFriends() {
  loadedFor = null;
  set(empty);
}

async function run(action: (userId: string) => PromiseLike<{ error: { message: string } | null }>) {
  const userId = await sessionUserId();
  if (!supabase || !userId) return;
  const { error } = await action(userId);
  if (error && !flashRefusal(error.message)) console.error("Friend action failed:", error.message);
  await refreshFriends();
}
const pair = (a: string, b: string) => `and(requester_id.eq.${a},addressee_id.eq.${b}),and(requester_id.eq.${b},addressee_id.eq.${a})`;
const unlink = (id: string) => run((userId) => supabase!.from("friendships").delete().or(pair(userId, id)));

export const remoteFriendActions = {
  add: (id: string) => void run(() => supabase!.from("friendships").insert({ addressee_id: id })),
  accept: (id: string) => void run((userId) => supabase!.from("friendships").update({ status: "accepted" }).eq("requester_id", id).eq("addressee_id", userId)),
  decline: (id: string) => void unlink(id),
  cancel: (id: string) => void unlink(id),
  remove: (id: string) => void unlink(id),
};

// Marks the account as online. Skipped while invisible mode hides the online status.
export async function sendHeartbeat() {
  const userId = await sessionUserId();
  const invisible = invisibleStore.read();
  if (!supabase || !userId || (invisible.enabled && invisible.hideOnline)) return;
  await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId);
}
