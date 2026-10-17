import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Null when .env.local is missing: the app then falls back to the local demo mode.
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
