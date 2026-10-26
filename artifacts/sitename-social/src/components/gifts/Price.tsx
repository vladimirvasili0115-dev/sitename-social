import { cn } from "@/lib/utils";

// The balance and every gift price are kept in coins (100 coins = 1 ₼) but shown only in manat.
const COINS_PER_MANAT = 100;
export function formatManat(coins: number) {
  const manat = coins / COINS_PER_MANAT;
  return `${manat.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(manat) ? 0 : 2, maximumFractionDigits: 2 })} ₼`;
}

export function Price({ value, className }: { value: number; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 font-semibold tabular-nums", className)}>{formatManat(value)}</span>;
}
