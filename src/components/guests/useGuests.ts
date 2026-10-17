"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { people } from "@/data/friends";
import { clearGuests, fetchGuests, type GuestEntry } from "@/lib/guestsSync";
import { guestsStore } from "@/lib/stores";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/useStore";

type Tab = "visitors" | "visited";
const online = Boolean(supabase);
const SEEN_KEY = "sitename-guests-seen";

// Who viewed the profile and whose profiles were viewed; "fresh" marks visitors that are new since the last look.
export function useGuests() {
  const [local, update] = useStore(guestsStore);
  const [remote, setRemote] = useState<{ visitors: GuestEntry[]; visited: GuestEntry[] }>({ visitors: [], visited: [] });
  const [fresh, setFresh] = useState<string[]>([]);
  const reload = useCallback(() => fetchGuests().then((result) => {
    const seenAt = Number(window.localStorage.getItem(SEEN_KEY) ?? 0);
    setFresh(result.visitors.filter((entry) => entry.visit.at > seenAt).map((entry) => entry.visit.userId));
    window.localStorage.setItem(SEEN_KEY, String(Date.now()));
    setRemote(result);
  }), []);

  useEffect(() => {
    if (online) return void reload();
    const current = guestsStore.read();
    setFresh(current.visitors.filter((visit) => visit.isNew).map((visit) => visit.userId));
    if (current.visitors.some((visit) => visit.isNew)) guestsStore.write({ ...current, visitors: current.visitors.map((visit) => ({ ...visit, isNew: false })) });
  }, [reload]);

  return useMemo(() => {
    if (online) return { ...remote, fresh, clear: (tab: Tab) => void clearGuests(tab).then(reload) };
    const entries = (tab: Tab) => local[tab].flatMap((visit): GuestEntry[] => {
      const person = people.find((item) => item.user.id === visit.userId);
      return person ? [{ visit, person }] : [];
    });
    return { visitors: entries("visitors"), visited: entries("visited"), fresh, clear: (tab: Tab) => update((current) => ({ ...current, [tab]: [] })) };
  }, [local, remote, fresh, reload, update]);
}
