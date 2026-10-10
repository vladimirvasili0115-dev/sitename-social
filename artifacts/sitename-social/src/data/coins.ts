import type { GiftId } from "@/types";

// Coin packages for topping up the gift balance. Prices are in AZN; change them here.
export type CoinPackage = { id: string; coins: number; bonus: number; price: number; art: GiftId; badge?: "popular" | "best" };

export const coinPackages: CoinPackage[] = [
  { id: "c50", coins: 50, bonus: 0, price: 0.5, art: "tea" },
  { id: "c100", coins: 100, bonus: 0, price: 1, art: "nar" },
  { id: "c300", coins: 300, bonus: 20, price: 3, art: "buta" },
  { id: "c500", coins: 500, bonus: 50, price: 5, art: "carpet" },
  { id: "c1000", coins: 1000, bonus: 200, price: 10, art: "tar", badge: "popular" },
  { id: "c2500", coins: 2500, bonus: 600, price: 20, art: "tower" },
  { id: "c5000", coins: 5000, bonus: 1500, price: 40, art: "crown" },
  { id: "c10000", coins: 10000, bonus: 4000, price: 70, art: "diamond", badge: "best" },
];
export const DEFAULT_PACKAGE_ID = "c1000";
