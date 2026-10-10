"use client";
import Link from "next/link";
import { Footprints, Gift, Heart, Mail, MessageCircle, UserPlus, X, type LucideIcon } from "lucide-react";
import type { Notice, NoticeType } from "@/types";
import { people } from "@/data/friends";
import { dayDiff, formatClock, formatDay } from "@/lib/datetime";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { GiftArt, giftNames } from "@/components/gifts/GiftArt";
import type { FriendActions } from "@/components/friends/useFriends";

const meta: Record<NoticeType, { icon: LucideIcon; text: TranslationKey; href: (userId: string) => string }> = {
  message: { icon: Mail, text: "notif.message", href: (id) => `/messages?u=${id}` },
  request: { icon: UserPlus, text: "notif.request", href: () => "/friends" },
  like: { icon: Heart, text: "notif.like", href: () => "/profile" },
  comment: { icon: MessageCircle, text: "notif.comment", href: () => "/profile" },
  gift: { icon: Gift, text: "notif.gift", href: () => "/gifts" },
  guest: { icon: Footprints, text: "notif.guest", href: () => "/guests" },
};
type Props = { notice: Notice; pendingRequest: boolean; actions: FriendActions; onRead: () => void; onRemove?: () => void; onNavigate?: () => void };

export function NotificationItem({ notice, pendingRequest, actions, onRead, onRemove, onNavigate }: Props) {
  const { t } = useTranslation();
  const person = notice.user ? { user: notice.user } : people.find((item) => item.user.id === notice.userId);
  if (!person) return null;
  const { icon: Icon, text, href } = meta[notice.type];
  const diff = dayDiff(notice.at);
  const when = diff === 0 ? formatClock(notice.at) : diff === 1 ? `${t("messages.yesterday")}, ${formatClock(notice.at)}` : formatDay(notice.at);
  return (
    <div className={cn("relative flex gap-3 rounded-xl p-3", notice.read ? "hover:bg-surface-2" : "bg-surface-2")}>
      <Link href={href(notice.userId)} onClick={() => { onRead(); onNavigate?.(); }} aria-label={`${person.user.name} ${t(text)}`} className="absolute inset-0 rounded-xl" />
      <span className="relative h-11 w-11 shrink-0">
        <Avatar user={person.user} className="h-11 w-11" />
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-accent text-bg"><Icon size={11} strokeWidth={2.5} /></span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-5 text-text"><span className="font-semibold">{person.user.name}</span> {t(text)}{notice.giftId ? `: ${t(giftNames[notice.giftId])}` : ""}</p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">{when}{notice.read ? null : <span className="h-1.5 w-1.5 rounded-full bg-accent" />}</p>
        {notice.type === "request" && pendingRequest ? (
          <div className="relative mt-2 flex gap-2">
            <Button className="h-8 px-3 text-xs" onClick={() => { actions.accept(notice.userId); onRead(); }}>{t("friends.accept")}</Button>
            <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => { actions.decline(notice.userId); onRead(); }}>{t("friends.decline")}</Button>
          </div>
        ) : null}
      </div>
      {notice.giftId ? <GiftArt id={notice.giftId} className="h-10 w-10 shrink-0" /> : null}
      {onRemove ? <button onClick={onRemove} aria-label={t("notif.remove")} title={t("notif.remove")} className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-text"><X size={14} /></button> : null}
    </div>
  );
}
