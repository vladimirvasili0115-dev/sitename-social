"use client";
import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

// Home page numbers: people online now (seen in the last 3 minutes), registered people, and the photos of a few people online.
// One shared reader for the whole page: read when the page opens, every 30 seconds while the tab is visible, and when it comes back into view.
export type SiteCounts = { total: number; online: number; faces: { id: string; name: string; avatar: string }[] };
const ONLINE_WINDOW = 3 * 60_000;
let value: SiteCounts | null = null;
let users = 0;
let stop: (() => void) | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

async function load() {
  if (!supabase) return;
  const db = supabase;
  const since = new Date(Date.now() - ONLINE_WINDOW).toISOString();
  const [all, now, faces] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }).gte("last_seen", since),
    db.from("profiles").select("id,name,avatar_url").gte("last_seen", since).not("avatar_url", "is", null).order("last_seen", { ascending: false }).limit(3),
  ]);
  if (all.count === null || now.count === null) return;
  const list = ((faces.data ?? []) as { id: string; name: string | null; avatar_url: string | null }[]).filter((row) => row.avatar_url).map((row) => ({ id: row.id, name: row.name ?? "", avatar: row.avatar_url ?? "" }));
  value = { total: all.count, online: now.count, faces: list };
  emit();
}

function start() {
  void load();
  const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30_000);
  const onShow = () => { if (document.visibilityState === "visible") void load(); };
  document.addEventListener("visibilitychange", onShow);
  return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onShow); };
}

export function useSiteCounts(): SiteCounts | null {
  useEffect(() => {
    users += 1;
    if (users === 1) stop = start();
    return () => { users -= 1; if (users === 0) { stop?.(); stop = null; } };
  }, []);
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => value, () => null);
}
