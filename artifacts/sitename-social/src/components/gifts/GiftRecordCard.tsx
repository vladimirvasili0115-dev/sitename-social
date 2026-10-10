"use client";
import type { GiftRecord } from "@/types";
import { people } from "@/data/friends";
import { formatDay } from "@/lib/datetime";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { GiftArt, giftNames } from "./GiftArt";
import { giftGlow } from "./GiftCard";

export function GiftRecordCard({ record, direction }: { record: GiftRecord; direction: "from" | "to" }) {
  const { t } = useTranslation();
  const person = record.user ? { user: record.user } : people.find((item) => item.user.id === record.userId);
  const hidden = direction === "from" && (record.anonymous || !person);
  return (
    <Card className="flex h-full items-center gap-3 p-3">
      <span className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl ${giftGlow}`}><GiftArt id={record.giftId} className="h-14 w-14" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{t(giftNames[record.giftId])}</p>
        <p className="mt-0.5 truncate text-xs text-muted">{t(direction === "from" ? "gifts.from" : "gifts.to")}: <span className="text-text">{hidden ? t("gifts.anonymousName") : person?.user.name}</span></p>
        {record.message ? <p className="mt-1.5 line-clamp-2 text-xs italic leading-5 text-muted">“{record.message}”</p> : null}
        <p className="mt-1 text-[11px] text-muted">{formatDay(record.at)}{direction === "to" && record.anonymous ? ` · ${t("gifts.anonymousName")}` : ""}</p>
      </div>
    </Card>
  );
}
