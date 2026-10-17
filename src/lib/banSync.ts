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
  // An account deleted by a moderator (or from another device) may still have this tab open: sign it out.
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (!userId) return;
  const hasRow = async () => {
    const own = await supabase!.from("profiles").select("id").eq("id", userId).maybeSingle();
    return own.error ? null : Boolean(own.data);
  };
  if ((await hasRow()) === false) {
    // Sign out only when the server confirms the login itself is valid and the profile is still missing on a second look.
    // A phone with a wrong clock or a flaky connection must not be mistaken for a deleted account.
    const confirmed = await supabase.auth.getUser();
    await new Promise((resolve) => window.setTimeout(resolve, 1500));
    if (!confirmed.error && confirmed.data.user && (await hasRow()) === false) {
      await supabase.auth.signOut({ scope: "local" });
      window.location.replace("/login?why=profile");
      return;
    }
  }
  const { data, error } = await supabase.rpc("my_ban");
  if (error) return;
  const info = data as BanInfo | null;
  set(info ? { reason: info.reason ?? "", until: info.until ?? null } : null);
}
export const clearBan = () => set(null);
