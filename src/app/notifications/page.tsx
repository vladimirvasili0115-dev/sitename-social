"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCheck, Settings2, Trash2 } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { useFriends } from "@/components/friends/useFriends";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotifications } from "@/components/notifications/useNotifications";

type NoticeTab = "all" | "unread";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { notices, unread, markRead, markAllRead, remove, clear } = useNotifications();
  const { incoming, actions } = useFriends();
  const [tab, setTab] = useState<NoticeTab>("all");
  // Leaving the page counts as having seen everything on it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => markAllRead(), []);
  const visible = tab === "unread" ? notices.filter((notice) => !notice.read) : notices;
  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-4 flex flex-wrap items-center gap-2 px-1">
        <h1 className="flex-1 text-[23px] font-semibold tracking-[-0.035em]">{t("header.notifications")}</h1>
        {unread ? <Button variant="outline" className="h-10 px-3 text-xs" onClick={markAllRead}><CheckCheck size={14} />{t("notif.markAll")}</Button> : null}
        {notices.length ? <Button variant="outline" className="h-10 px-3 text-xs" onClick={clear}><Trash2 size={14} />{t("notif.clear")}</Button> : null}
        <Link href="/settings" aria-label={t("nav.settings")} title={t("nav.settings")} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted hover:bg-surface-2 hover:text-text"><Settings2 size={16} /></Link>
      </div>
      <Tabs<NoticeTab> active={tab} onChange={setTab} tabs={[{ id: "all", label: t("common.all"), count: notices.length }, { id: "unread", label: t("notif.tabUnread"), count: unread }]} />
      {visible.length ? (
        <Card className="space-y-1 p-2">
          {visible.map((notice) => (
            <NotificationItem key={notice.id} notice={notice} pendingRequest={incoming.some((item) => item.user.id === notice.userId)} actions={actions} onRead={() => markRead(notice.id)} onRemove={() => remove(notice.id)} />
          ))}
        </Card>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("notif.empty")}</Card>}
    </div>
  );
}
