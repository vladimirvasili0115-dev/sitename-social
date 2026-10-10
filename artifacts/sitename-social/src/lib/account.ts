import { removeAllMyFiles } from "./media";
import { supabase } from "./supabase";

// Permanently removes the signed-in account: uploaded files first, then every database row and the login itself.
export async function deleteAccount(): Promise<boolean> {
  if (!supabase) return true;
  try {
    await removeAllMyFiles();
  } catch (error) {
    console.error("Files could not be removed:", error);
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) console.error("Account could not be deleted:", error.message);
  return !error;
}
