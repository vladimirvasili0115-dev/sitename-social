"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useFriends } from "@/components/friends/useFriends";
import { NotificationItem } from "./NotificationItem";
import { useNotifications } from "./useNotifications";

export function NotificationBell() {
  const { t } = useTranslation();
  const { notices, unread, markRead, markAllRead } = useNotifications();
  const { incoming, actions } = useFriends();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) markAllRead();
    wasOpen.current = open;
  }, [open, markAllRead]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="sm:relative">
      <button onClick={() => setOpen((value) => !value)} aria-label={`${t("header.notifications")}${unread ? `: ${unread}` : ""}`} aria-expanded={open} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text">
        <Bell size={18} />
        {unread && !open ? <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold tabular-nums text-white">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div role="dialog" aria-label={t("header.notifications")} className="absolute inset-x-3 top-[68px] z-50 flex max-h-[min(560px,calc(100dvh-90px))] flex-col rounded-card border border-border bg-surface sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px]">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">{t("header.notifications")}</h2>
            {unread ? <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"><CheckCheck size={14} />{t("notif.markAll")}</button> : null}
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {notices.length ? notices.slice(0, 7).map((notice) => (
              <NotificationItem key={notice.id} notice={notice} pendingRequest={incoming.some((item) => item.user.id === notice.userId)} actions={actions} onRead={() => markRead(notice.id)} onNavigate={() => setOpen(false)} />
            )) : <p className="p-8 text-center text-sm text-muted">{t("notif.empty")}</p>}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="border-t border-border px-4 py-3 text-center text-xs font-semibold text-accent hover:bg-surface-2">{t("common.seeAll")}</Link>
        </div>
      ) : null}
    </div>
  );
}
