"use client";
import Link from "next/link";
import { Ban, Check, Clock, Gift, MessageCircle, MoreHorizontal, UserMinus, UserPlus } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { Dropdown, menuItem } from "@/components/ui/Dropdown";
import { cn } from "@/lib/utils";
import { useFriends } from "@/components/friends/useFriends";
import { fullAccess, type Access } from "@/lib/access";

const box = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-text hover:bg-surface-2";
const link = `${box} px-3.5`;
const square = `${box} w-10`;

export function UserActions({ userId, onBlock, access = fullAccess }: { userId: string; onBlock: () => void; access?: Access }) {
  const { t } = useTranslation();
  const { friends, incoming, outgoingIds, actions } = useFriends();
  const isFriend = friends.some((item) => item.user.id === userId);
  const isIncoming = incoming.some((item) => item.user.id === userId);
  const isPending = outgoingIds.includes(userId);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isFriend ? <span className="inline-flex h-10 items-center gap-1.5 px-1 text-xs text-muted"><Check size={14} className="text-accent" />{t("guests.friend")}</span> : null}
      {isIncoming ? <Button className="h-10" onClick={() => actions.accept(userId)}><Check size={15} />{t("friends.accept")}</Button> : null}
      {isPending ? <Button variant="outline" className="h-10" onClick={() => actions.cancel(userId)}><Clock size={15} />{t("friends.requestSent")}</Button> : null}
      {!isFriend && !isIncoming && !isPending && access.requests ? <Button className="h-10" onClick={() => actions.add(userId)}><UserPlus size={15} />{t("friends.add")}</Button> : null}
      {access.messages ? <Link href={`/messages?u=${userId}`} className={link}><MessageCircle size={15} />{t("friends.message")}</Link> : null}
      {<Link href={`/gifts?to=${userId}`} aria-label={t("gifts.send")} title={t("gifts.send")} className={square}><Gift size={16} /></Link>}
      <Dropdown label={t("post.more")} trigger={<MoreHorizontal size={18} />} triggerClassName={square}>
        {(close) => <>
          {isFriend ? <button role="menuitem" onClick={() => { close(); actions.remove(userId); }} className={menuItem}><UserMinus size={16} className="text-muted" />{t("friends.remove")}</button> : null}
          <button role="menuitem" onClick={() => { close(); onBlock(); }} className={cn(menuItem, "text-danger")}><Ban size={16} />{t("settings.blkBlock")}</button>
        </>}
      </Dropdown>
    </div>
  );
}
