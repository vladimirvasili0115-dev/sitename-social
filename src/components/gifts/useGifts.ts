"use client";
import { useEffect, useSyncExternalStore } from "react";
import type { GiftDef, GiftRecord, GiftsState } from "@/types";
import type { CoinPackage } from "@/data/coins";
import { initialGifts } from "@/data/gifts";
import { ensureGiftsLoaded, remoteGifts, sendRemoteGift, topUpRemote } from "@/lib/giftsSync";
import { createStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/useStore";
import { useAuth } from "@/components/auth/AuthProvider";

const store = createStore<GiftsState>("sitename-gifts", initialGifts);
const online = Boolean(supabase);
type SendInput = Pick<GiftRecord, "userId" | "message" | "anonymous">;

export function useGifts() {
  const [state, update] = useStore(store);
  const remote = useSyncExternalStore(remoteGifts.subscribe, remoteGifts.get, remoteGifts.getServer);
  const accountId = useAuth().user?.id;
  useEffect(() => ensureGiftsLoaded(accountId), [accountId]);
  if (online) {
    return {
      ...remote,
      topUp: (pack: CoinPackage) => void topUpRemote(pack.id),
      send: async (gift: GiftDef, input: SendInput) => (remote.balance >= gift.price ? sendRemoteGift(gift.id, input) : false),
    };
  }
  return {
    ...state,
    transactions: state.transactions ?? [],
    topUp: (pack: CoinPackage) => update((current) => ({
      ...current,
      balance: current.balance + pack.coins + pack.bonus,
      transactions: [{ id: `tx-${Date.now()}`, type: "topup" as const, amount: pack.coins + pack.bonus, at: Date.now(), price: pack.price }, ...(current.transactions ?? [])],
    })),
    send: async (gift: GiftDef, input: SendInput) => {
      if (store.read().balance < gift.price) return false;
      update((current) => ({
        ...current,
        balance: current.balance - gift.price,
        sent: [{ ...input, id: `sg-${Date.now()}`, giftId: gift.id, at: Date.now() }, ...current.sent],
        transactions: [{ id: `tx-${Date.now()}`, type: "gift" as const, amount: -gift.price, at: Date.now(), giftId: gift.id }, ...(current.transactions ?? [])],
      }));
      return true;
    },
  };
}
