import { supabase } from "./supabase";

export type BanInfo = { reason: string; until: string | null };
let state: BanInfo | null = null;
const listeners = new Set<() => void>();
export const banStore = {
  get: () => state,
  getServer: () => null,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
function set(next: BanInfo | null) {
  if (next === state || (next && state && next.reason === state.reason && next.until === state.until)) return;
  state = next;
  listeners.forEach((listener) => listener());
}

// Asks the server whether this account is banned. Runs when the site opens and then once a minute.
export async function checkBan() {
  if (!supabase) return;
  const { data, error } = await supabase.rpc("my_ban");
  if (error) return;
  const info = data as BanInfo | null;
  set(info ? { reason: info.reason ?? "", until: info.until ?? null } : null);
}
export const clearBan = () => set(null);
