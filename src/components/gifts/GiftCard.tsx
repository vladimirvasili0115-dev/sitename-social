"use client";
import type { GiftDef } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { GiftArt, giftNames } from "./GiftArt";
import { Price } from "./Price";

export const giftGlow = "bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_70%)]";
export const premiumGlow = "bg-[radial-gradient(circle_at_50%_40%,color-mix(in_srgb,#E7B93C_22%,transparent),transparent_70%)]";

export function GiftCard({ gift, onSelect }: { gift: GiftDef; onSelect: () => void }) {
  const { t } = useTranslation();
  const premium = gift.category === "premium";
  return (
    <button onClick={onSelect} className={cn("group block w-full rounded-card border bg-surface p-3 text-center transition-colors", premium ? "border-[#E7B93C] hover:bg-surface-2" : "border-border hover:border-accent")}>
      <span className={cn("flex aspect-square items-center justify-center rounded-xl", premium ? premiumGlow : giftGlow)}>
        <GiftArt id={gift.id} className="h-[68%] w-[68%] transition-transform group-hover:scale-110 motion-reduce:transform-none" />
      </span>
      <span className="mt-2 block truncate text-[13px] font-semibold text-text">{t(giftNames[gift.id])}</span>
      <Price value={gift.price} className="mt-1 text-xs text-muted" />
    </button>
  );
}
