"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import Link from "next/link";
import { Check, Clock, MapPin, MessageCircle, UserPlus } from "lucide-react";
import type { Person, Visit } from "@/types";
import { dayDiff, formatClock, formatDay } from "@/lib/datetime";
import { useTranslation } from "@/i18n/useTranslation";
import { userHref } from "@/lib/links";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export type GuestRelation = "friend" | "pending" | "none";
type Props = { person: Person; visit: Visit; isNew: boolean; relation: GuestRelation; onAdd: () => void };

export function GuestRow({ person, visit, isNew, relation, onAdd }: Props) {
  const { t } = useTranslation();
  const { user, city } = person;
  const diff = dayDiff(visit.at);
  const when = diff === 0 ? `${t("messages.today")}, ${formatClock(visit.at)}` : diff === 1 ? `${t("messages.yesterday")}, ${formatClock(visit.at)}` : formatDay(visit.at);
  return (
    <div className="flex items-center gap-3.5 p-3.5">
      <span className="relative h-14 w-14 shrink-0">
        <Avatar user={user} className="h-14 w-14" />
        {user.online ? <span aria-label={t("common.onlineNow")} className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface bg-accent" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={userHref(user.id)} className="truncate text-sm font-semibold hover:underline">{user.name}<VerifiedMark userId={user.id} size={14} /></Link>
          {isNew ? <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-bg">{t("guests.new")}</span> : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          <span className="flex items-center gap-1"><MapPin size={12} />{city}</span>
          <span className="flex items-center gap-1"><Clock size={12} />{when}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {relation === "none" ? <Button className="h-9 px-3 text-xs" onClick={onAdd}><UserPlus size={14} /><span className="hidden sm:inline">{t("friends.add")}</span></Button> : null}
        {relation === "pending" ? <span className="flex items-center gap-1.5 text-xs text-muted"><Clock size={13} /><span className="hidden sm:inline">{t("friends.requestSent")}</span></span> : null}
        {relation === "friend" ? <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex"><Check size={13} className="text-accent" />{t("guests.friend")}</span> : null}
        <Link href={`/messages?u=${user.id}`} aria-label={t("friends.message")} title={t("friends.message")} className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-text hover:text-accent"><MessageCircle size={15} /></Link>
      </div>
    </div>
  );
}
