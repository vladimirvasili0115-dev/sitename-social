import type { Group, Person } from "@/types";
import { supabase } from "./supabase";
import { fetchUsers } from "./usersCache";

type Row = { id: string; owner_id: string; name: string; category: Group["category"]; description: string; cover_url: string | null; group_members: { user_id: string }[] };
const none: Group[] = [];
let state = none;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
function set(next: Group[]) {
  state = next;
  listeners.forEach((listener) => listener());
}
export const remoteGroups = {
  get: () => state,
  getServer: () => none,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
async function sessionUserId() {
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session?.user.id ?? null;
}

export async function refreshGroups() {
  const userId = await sessionUserId();
  if (!supabase || !userId) return set(none);
  const { data, error } = await supabase.from("groups").select("id,owner_id,name,category,description,cover_url,group_members(user_id)").order("created_at", { ascending: false }).limit(200);
  if (error) return console.error("Groups could not be loaded:", error.message);
  set((data as Row[]).map((row) => ({
    id: row.id, name: row.name, category: row.category, description: row.description, cover: row.cover_url ?? undefined,
    members: row.group_members.length, joined: row.group_members.some((member) => member.user_id === userId), mine: row.owner_id === userId,
  })));
}
export function ensureGroupsLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshGroups();
}
export function resetRemoteGroups() {
  loadedFor = null;
  set(none);
}

async function run(action: (userId: string) => PromiseLike<{ error: { message: string } | null }>) {
  const userId = await sessionUserId();
  if (!supabase || !userId) return;
  const { error } = await action(userId);
  if (error) console.error("Group action failed:", error.message);
  await refreshGroups();
}
export const remoteGroupActions = {
  create: (input: Pick<Group, "name" | "category" | "description">) => void run(() => supabase!.from("groups").insert(input)),
  remove: (id: string) => void run(() => supabase!.from("groups").delete().eq("id", id)),
  toggle: (id: string) => void run((userId) => (state.find((group) => group.id === id)?.joined
    ? supabase!.from("group_members").delete().eq("group_id", id).eq("user_id", userId)
    : supabase!.from("group_members").insert({ group_id: id }))),
};

export async function fetchGroupMembers(groupId: string): Promise<Person[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("group_members").select("user_id").eq("group_id", groupId).order("joined_at").limit(200);
  const ids = ((data ?? []) as { user_id: string }[]).map((row) => row.user_id);
  const users = await fetchUsers(ids);
  return ids.flatMap((id) => users.get(id) ?? []);
}
