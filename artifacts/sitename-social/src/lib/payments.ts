import { supabase } from "./supabase";

// Turn this on only after a payment provider is connected (an Edge Function "topup-pay" that returns the provider's payment page address).
// Until then the market shows the packages, but the pay button is off: balance is never credited without a confirmed payment.
export const PAYMENTS_LIVE = true;
// Payments: the card and the receipt upload are on the site; the receipt goes to the owner in Telegram, who approves it, and the balance is then credited by the server.
export const PAY_FUNCTION = "clever-worker";

// 1 AZN = 100 balance coins (the same rate as the old packages); the server uses the same rate and has the last word.
export const COINS_PER_AZN = 100;
export const TOPUP_PRESETS = [50, 100, 150, 200, 250];
export const TOPUP_MIN = 1;
export const TOPUP_MAX = 1000;
export type TopupOrder = { order?: string; coins?: number; price?: number; error?: "bad" | "many" };

// 1) The server writes a pending order with the price taken from its own table (the browser can not choose the price).
export async function createTopupOrder(amount: number): Promise<TopupOrder | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("create_topup_amount", { p_amount: amount });
  if (error) { console.error("create_topup_amount failed:", error.message); return null; }
  return data as TopupOrder;
}

// 2) On-site payment: a request (card is taken in turn), the card, the receipt photo, then the owner approves in Telegram.
export type PayRequest = { id: string; amount: number; status: "new" | "card" | "receipt" | "approved" | "rejected" | "expired"; expires_at: string };
export type PayCard = { number: string; holder: string; amount: number; expires_at: string };

export async function createPayRequest(amount: number): Promise<{ id?: string; error?: "bad" | "many" | "nocard" | "fail" }> {
  if (!PAYMENTS_LIVE || !supabase) return { error: "fail" };
  const { data, error } = await supabase.rpc("pay_request_create", { p_amount: amount });
  if (error || !data) return { error: "fail" };
  const out = data as { id?: string; error?: "bad" | "many" | "nocard" };
  return out.id ? { id: out.id } : { error: out.error ?? "fail" };
}

export async function getPayCard(id: string): Promise<PayCard | { error: "expired" | "done" | "notfound" | "fail" }> {
  if (!supabase) return { error: "fail" };
  const { data, error } = await supabase.rpc("pay_request_card", { p_id: id });
  if (error || !data) return { error: "fail" };
  return data as PayCard | { error: "expired" | "done" | "notfound" };
}

export async function loadPayRequest(id?: string): Promise<PayRequest | null> {
  if (!supabase) return null;
  const base = supabase.from("pay_requests").select("id,amount,status,expires_at");
  const { data, error } = id
    ? await base.eq("id", id).maybeSingle()
    : await base.in("status", ["new", "card", "receipt"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return null;
  const row = data as PayRequest;
  if ((row.status === "new" || row.status === "card") && Date.parse(row.expires_at) < Date.now()) return { ...row, status: "expired" };
  return row;
}

export async function cancelPayRequest(id: string) {
  if (supabase) await supabase.rpc("pay_request_cancel", { p_id: id });
}

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export async function sendReceipt(id: string, image: File): Promise<boolean> {
  if (!supabase || image.size > RECEIPT_MAX_BYTES || !image.type.startsWith("image/")) return false;
  const body = new FormData();
  body.append("id", id);
  body.append("image", image);
  const { error } = await supabase.functions.invoke(PAY_FUNCTION, { body });
  if (error) { console.error("receipt upload failed:", error.message); return false; }
  return true;
}

// Game hearts bought from the site balance (the game's bank packs).
export type BuyHeartsResult = { hearts?: number; balance?: number; bought?: number; error?: "bad" | "balance"; need?: number };
export async function buyHeartsWithBalance(hearts: number): Promise<BuyHeartsResult | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("bottle_buy_hearts_pack", { p_hearts: hearts });
  if (error) { console.error("bottle_buy_hearts_pack failed:", error.message); return null; }
  return data as BuyHeartsResult;
}
