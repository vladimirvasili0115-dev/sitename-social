import type { GiftDef } from "@/types";
import { coinPackages, type CoinPackage } from "@/data/coins";
import { giftCatalog } from "@/data/gifts";
import { supabase } from "./supabase";

export type PriceTable = { pk: string | null; rows: Record<string, unknown>[] };
type Prices = { gifts: GiftDef[]; packages: CoinPackage[] };
type Raw = { gifts?: PriceTable; packages?: PriceTable };

// Prices shipped with the site are the fallback; the database values win when they load.
const defaults: Prices = { gifts: giftCatalog, packages: coinPackages };
let state = defaults;
let loaded = false;
const listeners = new Set<() => void>();
export const remotePrices = {
  get: () => state,
  getServer: () => defaults,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

const num = (value: unknown) => (typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : null);
// The gift price column is "price" when present, otherwise the first numeric column.
export function priceColumn(table: PriceTable | undefined): string | null {
  const row = table?.rows[0];
  if (!row) return null;
  if (num(row.price) !== null) return "price";
  return Object.keys(row).find((key) => key !== table?.pk && typeof row[key] === "number") ?? null;
}

export async function refreshPrices() {
  if (!supabase) return;
  const { data, error } = await supabase.rpc("price_list");
  if (error || !data) return;
  const raw = data as Raw;
  const giftKey = raw.gifts?.pk;
  const giftColumn = priceColumn(raw.gifts);
  const packKey = raw.packages?.pk;
  const find = (table: PriceTable | undefined, key: string | null | undefined, id: string) => (key ? table?.rows.find((row) => String(row[key]) === id) : undefined);
  state = {
    gifts: giftCatalog.map((gift) => {
      const row = find(raw.gifts, giftKey, gift.id);
      const price = row && giftColumn ? num(row[giftColumn]) : null;
      return price === null ? gift : { ...gift, price };
    }),
    packages: coinPackages.map((pack) => {
      const row = find(raw.packages, packKey, pack.id);
      if (!row) return pack;
      return { ...pack, coins: num(row.coins) ?? pack.coins, bonus: num(row.bonus) ?? pack.bonus, price: num(row.price) ?? pack.price };
    }),
  };
  listeners.forEach((listener) => listener());
}
export function ensurePricesLoaded() {
  if (!supabase || loaded) return;
  loaded = true;
  void refreshPrices();
}
