"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { FriendsState, Person } from "@/types";
import { initialFriendsState, people } from "@/data/friends";
import { FRIENDS_EVENT, readFriendsState, writeFriendsState } from "@/lib/friends";
import { ensureFriendsLoaded, remoteFriendActions, remoteFriends } from "@/lib/friendsSync";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSettings } from "@/components/settings/useSettings";

const online = Boolean(supabase);
const without = (list: string[], id: string) => list.filter((item) => item !== id);
function change(update: (state: FriendsState) => FriendsState) {
  writeFriendsState(update(readFriendsState()));
}
const hide = (id: string) => change((s) => ({ ...s, hidden: [...s.hidden, id] }));

const localActions = {
  accept: (id: string) => change((s) => ({ ...s, incoming: without(s.incoming, id), friends: [id, ...without(s.friends, id)] })),
  decline: (id: string) => change((s) => ({ ...s, incoming: without(s.incoming, id), hidden: [...s.hidden, id] })),
  add: (id: string) => change((s) => ({ ...s, outgoing: [...without(s.outgoing, id), id] })),
  cancel: (id: string) => change((s) => ({ ...s, outgoing: without(s.outgoing, id) })),
  remove: (id: string) => change((s) => ({ ...s, friends: without(s.friends, id) })),
  hide,
};
export type FriendActions = typeof localActions;
const actions: FriendActions = online ? { ...remoteFriendActions, hide } : localActions;

// With a database, friends are real accounts; otherwise the sample people are used.
export function useFriends() {
  const [state, setState] = useState<FriendsState>(initialFriendsState);
  const remote = useSyncExternalStore(remoteFriends.subscribe, remoteFriends.get, remoteFriends.getServer);
  const accountId = useAuth().user?.id;
  const { blocked } = useSettings().settings;
  useEffect(() => ensureFriendsLoaded(accountId), [accountId]);
  useEffect(() => {
    setState(readFriendsState());
    const onChange = (event: Event) => setState((event as CustomEvent<FriendsState>).detail);
    window.addEventListener(FRIENDS_EVENT, onChange);
    return () => window.removeEventListener(FRIENDS_EVENT, onChange);
  }, []);
  return useMemo(() => {
    if (online) {
      const skip = new Set([...state.hidden, ...blocked]);
      return {
        directory: remote.everyone.filter((item) => !blocked.includes(item.user.id)),
        friends: remote.friends,
        incoming: remote.incoming,
        outgoing: remote.outgoing,
        suggestions: [...remote.outgoing, ...remote.others].filter((item) => !skip.has(item.user.id)),
        outgoingIds: remote.outgoing.map((item) => item.user.id),
        actions,
      };
    }
    const pick = (ids: string[]) => ids.map((id) => people.find((item) => item.user.id === id)).filter((item): item is Person => Boolean(item));
    const taken = new Set([...state.friends, ...state.incoming, ...state.hidden, ...blocked]);
    return {
      directory: people.filter((item) => !blocked.includes(item.user.id)),
      friends: pick(state.friends),
      incoming: pick(state.incoming),
      outgoing: pick(state.outgoing),
      suggestions: people.filter((item) => !taken.has(item.user.id)),
      outgoingIds: state.outgoing,
      actions,
    };
  }, [state, remote, blocked]);
}
