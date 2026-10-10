import { supabase } from "./supabase";

export type VerifiedKind = "verified" | "official";
type Verified = Record<string, VerifiedKind>;
const none: Verified = {};
let state = none;
let loaded = false;
const listeners = new Set<() => void>();
export const verifiedStore = {
  get: () => state,
  getServer: () => none,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

// The list of verified accounts is short and public, so it is loaded once and reused everywhere a name is shown.
export async function refreshVerified() {
  if (!supabase) return;
  const { data, error } = await supabase.from("verified_users").select("user_id,kind").limit(5000);
  if (error) return;
  state = Object.fromEntries(((data ?? []) as { user_id: string; kind: VerifiedKind }[]).map((row) => [row.user_id, row.kind]));
  listeners.forEach((listener) => listener());
}
export function ensureVerifiedLoaded() {
  if (!supabase || loaded) return;
  loaded = true;
  void refreshVerified();
  window.setInterval(() => void refreshVerified(), 5 * 60_000);
}
