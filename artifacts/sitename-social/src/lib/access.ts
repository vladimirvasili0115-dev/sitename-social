import { isRemoteId } from "./remoteProfiles";
import { supabase } from "./supabase";

export type Access = { profile: boolean; messages: boolean; requests: boolean; friendsList: boolean; gifts: boolean; blockedMe: boolean; wall?: boolean; comments?: boolean };
export const fullAccess: Access = { profile: true, messages: true, requests: true, friendsList: true, gifts: true, blockedMe: false };

// What the signed-in user may do with another account, according to that account's privacy settings.
export async function fetchAccess(id: string): Promise<Access> {
  if (!supabase || !isRemoteId(id)) return fullAccess;
  const { data, error } = await supabase.rpc("my_access", { target: id });
  if (error || !data) return fullAccess;
  return { ...fullAccess, ...(data as Partial<Access>) };
}
