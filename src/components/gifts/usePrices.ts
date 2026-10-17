"use client";
import { useEffect, useSyncExternalStore } from "react";
import { ensurePricesLoaded, remotePrices } from "@/lib/pricesSync";

export function usePrices() {
  const prices = useSyncExternalStore(remotePrices.subscribe, remotePrices.get, remotePrices.getServer);
  useEffect(() => ensurePricesLoaded(), []);
  return prices;
}
