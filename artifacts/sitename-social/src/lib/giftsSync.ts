import type { GiftId, GiftRecord, GiftTransaction } from "@/types";
import { supabase } from "./supabase";
import { flashRefusal } from "./flash";
import { fetchUsers } from "./usersCache";

type RemoteGifts = { balance: number; received: GiftRecord[]; sent: GiftRecord[]; transactions: GiftTransaction[] };
type GiftRow = { id: string; gift_id: GiftId; sender_id?: string | null; recipient_id?: string; message: string | null; anonymous: boolean; created_at: string };
type TxRow = { id: string; type: "topup" | "gift"; amount: number; gift_id: GiftId | null; price: number | null; created_at: string };

const empty: RemoteGifts = { balance: 0, received: [], sent: [], transactions: [] };
let state = empty;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
function set(next: RemoteGifts) {
  state = next;
  listeners.forEach((listener) => listener());
}
export const remoteGifts = {
  get: () => state,
  getServer: () => empty,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

// The balance lives on the server: sending a gift and topping up go through database functions, never direct writes.
export async function refreshGifts() {
  if (!supabase) return;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (!userId) return set(empty);
  const [wallet, sent, received, transactions] = await Promise.all([
    supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle(),
    supabase.from("gifts").select("id,gift_id,recipient_id,message,anonymous,created_at").eq("sender_id", userId).order("created_at", { ascending: false }).limit(200),
    supabase.rpc("gifts_of", { target: userId }),
    supabase.from("wallet_transactions").select("id,type,amount,gift_id,price,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
  ]);
  const failed = wallet.error ?? sent.error ?? received.error ?? transactions.error;
  if (failed) return console.error("Gifts could not be loaded:", failed.message);
  const sentRows = (sent.data ?? []) as GiftRow[];
  const receivedRows = (received.data ?? []) as GiftRow[];
  const users = await fetchUsers([...sentRows.map((row) => row.recipient_id ?? ""), ...receivedRows.map((row) => row.sender_id ?? "")].filter(Boolean));
  const toRecord = (row: GiftRow, otherId: string | null | undefined): GiftRecord => ({
    id: row.id, giftId: row.gift_id, userId: otherId ?? "", at: Date.parse(row.created_at), message: row.message ?? undefined, anonymous: row.anonymous, user: otherId ? users.get(otherId)?.user : undefined,
  });
  set({
    balance: (wallet.data as { balance: number } | null)?.balance ?? 0,
    sent: sentRows.map((row) => toRecord(row, row.recipient_id)),
    received: receivedRows.map((row) => toRecord(row, row.sender_id)),
    transactions: ((transactions.data ?? []) as TxRow[]).map((row) => ({ id: row.id, type: row.type, amount: row.amount, at: Date.parse(row.created_at), giftId: row.gift_id ?? undefined, price: row.price ?? undefined })),
  });
}
export function ensureGiftsLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshGifts();
}
export function resetRemoteGifts() {
  loadedFor = null;
  set(empty);
}

export async function sendRemoteGift(giftId: GiftId, input: { userId: string; message?: string; anonymous?: boolean }) {
  if (!supabase) return false;
  const { error } = await supabase.rpc("send_gift", { recipient: input.userId, gift: giftId, note: input.message ?? null, hide_sender: Boolean(input.anonymous) });
  if (error && !flashRefusal(error.message)) console.error("Gift could not be sent:", error.message);
  await refreshGifts();
  return !error;
}
// Test mode: credits coins without a payment. Replace with the payment provider's confirmation before launch.
export async function topUpRemote(packageId: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc("top_up_test", { package: packageId });
  if (error) console.error("Balance could not be topped up:", error.message);
  await refreshGifts();
}
