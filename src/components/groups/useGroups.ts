"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { Group } from "@/types";
import { initialGroups } from "@/data/groups";
import { ensureGroupsLoaded, remoteGroupActions, remoteGroups } from "@/lib/groupsSync";
import { createStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/useStore";
import { useAuth } from "@/components/auth/AuthProvider";

const store = createStore<Group[]>("sitename-groups", initialGroups);
const online = Boolean(supabase);

// With a database, groups are real and shared by everyone; otherwise the sample groups are used.
export function useGroups() {
  const [local, update] = useStore(store);
  const remote = useSyncExternalStore(remoteGroups.subscribe, remoteGroups.get, remoteGroups.getServer);
  const accountId = useAuth().user?.id;
  useEffect(() => ensureGroupsLoaded(accountId), [accountId]);
  return useMemo(() => (online ? { groups: remote, ...remoteGroupActions } : {
    groups: local,
    toggle: (id: string) => update((list) => list.map((item) => (item.id === id ? { ...item, joined: !item.joined, members: item.members + (item.joined ? -1 : 1) } : item))),
    create: (input: Pick<Group, "name" | "category" | "description">) => update((list) => [{ ...input, id: `gr-${Date.now()}`, members: 1, joined: true, mine: true }, ...list]),
    remove: (id: string) => update((list) => list.filter((item) => item.id !== id)),
  }), [local, remote, update]);
}
