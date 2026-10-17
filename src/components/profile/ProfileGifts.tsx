"use client";
import type { GiftRecord } from "@/types";
import { people } from "@/data/friends";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { GiftArt, giftNames } from "@/components/gifts/GiftArt";
import { giftGlow } from "@/components/gifts/GiftCard";
import { SectionCard } from "./SectionCard";

export function ProfileGifts({ gifts, full = false, onSeeAll }: { gifts: GiftRecord[]; full?: boolean; onSeeAll?: () => void }) {
  const { t } = useTranslation();
  const visible = full ? gifts : gifts.slice(0, 3);
  return (
    <SectionCard title={t("nav.gifts")} count={gifts.length} onSeeAll={onSeeAll}>
      <ul className={cn("grid gap-3", full ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : "grid-cols-3")}>
        {visible.map((gift) => {
          const sender = gift.user ?? people.find((item) => item.user.id === gift.userId)?.user;
          const from = gift.anonymous || !sender ? t("gifts.anonymousName") : sender.name.split(" ")[0];
          return (
            <li key={gift.id} className="min-w-0 text-center" title={t(giftNames[gift.giftId])}>
              <span className={`mx-auto flex aspect-square w-full max-w-[84px] items-center justify-center rounded-2xl ${giftGlow}`}><GiftArt id={gift.giftId} className="h-[70%] w-[70%]" /></span>
              <span className="mt-1.5 block truncate text-[11px] text-muted">{from}</span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
