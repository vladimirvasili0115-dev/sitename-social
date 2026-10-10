"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import Link from "next/link";
import { Check, Clock, MapPin, MessageCircle, UserMinus, UserPlus, X } from "lucide-react";
import type { Person } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { userHref } from "@/lib/links";
import type { FriendActions } from "./useFriends";

export type FriendCardKind = "friend" | "incoming" | "outgoing" | "suggestion";
const small = "h-9 px-3 text-xs";

export function FriendCard({ person, kind, actions }: { person: Person; kind: FriendCardKind; actions: FriendActions }) {
  const { t } = useTranslation();
  const { user, city, mutual } = person;
  return (
    <Card className="flex items-center gap-3.5 p-3.5">
      <span className="relative h-16 w-16 shrink-0">
        <Avatar user={user} className="h-16 w-16" />
        {user.online ? <span aria-label={t("common.onlineNow")} className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-accent" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <Link href={userHref(user.id)} className="block truncate text-sm font-semibold hover:underline">{user.name}<VerifiedMark userId={user.id} size={14} /></Link>
        <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted"><MapPin size={12} className="shrink-0" />{city}</div>
        {mutual ? <div className="mt-0.5 truncate text-xs text-muted">{mutual} {t("friends.mutual")}</div> : null}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {kind === "friend" ? (
            <Link href={`/messages?u=${user.id}`} className="inline-flex h-9 items-center gap-2 rounded-xl bg-surface-2 px-3 text-xs font-semibold text-text hover:text-accent"><MessageCircle size={14} />{t("friends.message")}</Link>
          ) : null}
          {kind === "incoming" ? (
            <>
              <Button className={small} onClick={() => actions.accept(user.id)}><Check size={14} />{t("friends.accept")}</Button>
              <Button variant="outline" className={small} onClick={() => actions.decline(user.id)}>{t("friends.decline")}</Button>
            </>
          ) : null}
          {kind === "outgoing" ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted"><Clock size={13} />{t("friends.requestSent")}</span>
              <Button variant="outline" className={small} onClick={() => actions.cancel(user.id)}>{t("common.cancel")}</Button>
            </>
          ) : null}
          {kind === "suggestion" ? <Button className={small} onClick={() => actions.add(user.id)}><UserPlus size={14} />{t("friends.add")}</Button> : null}
        </div>
      </div>
      {kind === "friend" ? <IconButton aria-label={t("friends.remove")} title={t("friends.remove")} onClick={() => actions.remove(user.id)} className="h-9 w-9 shrink-0 self-start"><UserMinus size={16} /></IconButton> : null}
      {kind === "suggestion" ? <IconButton aria-label={t("friends.hide")} title={t("friends.hide")} onClick={() => actions.hide(user.id)} className="h-9 w-9 shrink-0 self-start"><X size={16} /></IconButton> : null}
    </Card>
  );
}
