"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import Link from "next/link";
import { Check, Clock, Gift, MapPin, MessageCircle, UserPlus } from "lucide-react";
import type { Person } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { userHref } from "@/lib/links";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";

export type OnlineRelation = "friend" | "pending" | "none";
const iconLink = "flex h-9 flex-1 items-center justify-center rounded-xl bg-surface-2 text-text hover:text-accent";

export function OnlineCard({ person, relation, onAdd }: { person: Person; relation: OnlineRelation; onAdd: () => void }) {
  const { t } = useTranslation();
  const { user, city } = person;
  return (
    <Card className="flex h-full flex-col items-center p-4 text-center">
      <span className="relative h-20 w-20 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] p-[2px]">
        <Avatar user={user} className="h-full w-full border-2 border-surface" />
        <span aria-label={t("common.onlineNow")} className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-surface bg-accent" />
      </span>
      <Link href={userHref(user.id)} className="mt-2.5 block w-full truncate text-sm font-semibold hover:underline">{user.name}<VerifiedMark userId={user.id} size={14} /></Link>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><MapPin size={12} />{city}</p>
      <p className="mt-1 flex h-5 items-center gap-1 text-[11px] text-muted">
        {relation === "friend" ? <><Check size={12} className="text-accent" />{t("guests.friend")}</> : null}
        {relation === "pending" ? <><Clock size={12} />{t("friends.requestSent")}</> : null}
      </p>
      <div className="mt-2 flex w-full gap-2">
        <Link href={`/messages?u=${user.id}`} aria-label={t("friends.message")} title={t("friends.message")} className={iconLink}><MessageCircle size={16} /></Link>
        <Link href={`/gifts?to=${user.id}`} aria-label={t("gifts.send")} title={t("gifts.send")} className={iconLink}><Gift size={16} /></Link>
        {relation === "none" ? <button onClick={onAdd} aria-label={t("friends.add")} title={t("friends.add")} className="flex h-9 flex-1 items-center justify-center rounded-xl bg-accent text-bg hover:brightness-110"><UserPlus size={16} /></button> : null}
      </div>
    </Card>
  );
}
