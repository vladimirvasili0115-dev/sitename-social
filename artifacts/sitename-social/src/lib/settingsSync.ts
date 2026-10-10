import type { InvisibleState, SettingsState } from "@/types";
import { refreshFriends } from "./friendsSync";
import { refreshPosts } from "./postsSync";
import { isRemoteId } from "./remoteProfiles";
import { invisibleStore, settingsStore } from "./stores";
import { supabase } from "./supabase";

type Prefs = Partial<Pick<SettingsState, "theme" | "notifications" | "autoplay" | "reelsMuted">> & { invisible?: Partial<InvisibleState> };
type Row = { privacy: Partial<SettingsState["privacy"]> | null; prefs: Prefs | null };

let userId: string | null = null;
let ready = false;
let applying = false;
let timer = 0;
let knownBlocked: string[] = [];

// Settings live in local stores (so every page keeps working) and are mirrored to the database.
async function load(id: string) {
  if (!supabase) return;
  const [row, blocks] = await Promise.all([
    supabase.from("user_settings").select("privacy,prefs").eq("user_id", id).maybeSingle(),
    supabase.from("blocks").select("blocked_id").eq("blocker_id", id),
  ]);
  if (userId !== id) return;
  // If the tables are not there yet, settings simply stay on this device.
  if (row.error || blocks.error) return console.error("Settings could not be loaded:", row.error?.message ?? blocks.error?.message);
  knownBlocked = ((blocks.data ?? []) as { blocked_id: string }[]).map((item) => item.blocked_id);
  const saved = row.data as Row | null;
  const local = settingsStore.read();
  const prefs = saved?.prefs ?? {};
  applying = true;
  settingsStore.write({
    ...local,
    theme: prefs.theme === "light" || prefs.theme === "dark" ? prefs.theme : local.theme,
    autoplay: typeof prefs.autoplay === "boolean" ? prefs.autoplay : local.autoplay,
    reelsMuted: typeof prefs.reelsMuted === "boolean" ? prefs.reelsMuted : local.reelsMuted,
    notifications: { ...local.notifications, ...(prefs.notifications ?? {}) },
    privacy: { ...local.privacy, ...(saved?.privacy ?? {}) },
    blocked: knownBlocked,
  });
  if (prefs.invisible) invisibleStore.write({ ...invisibleStore.read(), ...prefs.invisible });
  applying = false;
  ready = true;
  if (!saved) void push();
}

async function push() {
  if (!supabase || !ready || !userId) return;
  const id = userId;
  const { theme, notifications, autoplay, reelsMuted, privacy, blocked } = settingsStore.read();
  const prefs: Prefs = { theme, notifications, autoplay, reelsMuted, invisible: invisibleStore.read() };
  const { error } = await supabase.from("user_settings").upsert({ user_id: id, privacy, prefs, updated_at: new Date().toISOString() });
  if (error) {
    // The account no longer exists (deleted): stop syncing instead of repeating the error.
    if (error.message.includes("foreign key")) ready = false;
    else console.error("Settings could not be saved:", error.message);
    return;
  }
  const wanted = blocked.filter(isRemoteId);
  const added = wanted.filter((item) => !knownBlocked.includes(item));
  const removed = knownBlocked.filter((item) => !wanted.includes(item));
  if (!added.length && !removed.length) return;
  knownBlocked = wanted;
  if (added.length) await supabase.from("blocks").upsert(added.map((blocked_id) => ({ blocker_id: id, blocked_id })), { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true });
  if (removed.length) await supabase.from("blocks").delete().eq("blocker_id", id).in("blocked_id", removed);
  void refreshFriends();
  void refreshPosts();
}

function onChange() {
  if (applying || !ready) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void push(), 500);
}

export function startSettingsSync(id: string) {
  if (!supabase) return () => undefined;
  userId = id;
  ready = false;
  void load(id);
  window.addEventListener(settingsStore.event, onChange);
  window.addEventListener(invisibleStore.event, onChange);
  return () => {
    window.removeEventListener(settingsStore.event, onChange);
    window.removeEventListener(invisibleStore.event, onChange);
    window.clearTimeout(timer);
    userId = null;
    ready = false;
  };
}
