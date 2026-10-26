import { supabase } from "./supabase";

// Turn this on only after a payment provider is connected (an Edge Function "topup-pay" that returns the provider's payment page address).
// Until then the market shows the packages, but the pay button is off: balance is never credited without a confirmed payment.
export const PAYMENTS_LIVE = false;

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

// 2) The provider's payment page. The balance is credited only by the server when the provider confirms the payment.
export async function startPayment(amount: number): Promise<"soon" | "fail" | "redirect"> {
  if (!PAYMENTS_LIVE || !supabase) return "soon";
  const order = await createTopupOrder(amount);
  if (!order?.order) return "fail";
  const { data, error } = await supabase.functions.invoke("topup-pay", { body: { order: order.order } });
  const url = (data as { url?: string } | null)?.url;
  if (error || !url || !/^https:\/\//i.test(url)) return "fail";
  window.location.href = url;
  return "redirect";
}

// Game hearts bought from the site balance (the game's bank packs).
export type BuyHeartsResult = { hearts?: number; balance?: number; bought?: number; error?: "bad" | "balance"; need?: number };
export async function buyHeartsWithBalance(hearts: number): Promise<BuyHeartsResult | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("bottle_buy_hearts_pack", { p_hearts: hearts });
  if (error) { console.error("bottle_buy_hearts_pack failed:", error.message); return null; }
  return data as BuyHeartsResult;
}
