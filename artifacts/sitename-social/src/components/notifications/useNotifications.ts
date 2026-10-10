"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { Notice, NoticeType, NotificationKey } from "@/types";
import { ensureNoticesLoaded, remoteNoticeActions, remoteNotices } from "@/lib/notificationsSync";
import { noticesStore } from "@/lib/stores";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/useStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSettings } from "@/components/settings/useSettings";

const settingFor: Record<NoticeType, NotificationKey> = { message: "messages", request: "requests", like: "likes", comment: "likes", gift: "gifts", guest: "guests" };
const online = Boolean(supabase);

export function useNotifications() {
  const [local, update] = useStore(noticesStore);
  const remote = useSyncExternalStore(remoteNotices.subscribe, remoteNotices.get, remoteNotices.getServer);
  const accountId = useAuth().user?.id;
  const { notifications, blocked } = useSettings().settings;
  useEffect(() => ensureNoticesLoaded(accountId), [accountId]);
  return useMemo(() => {
    const all = online ? remote : local;
    const notices = all.filter((item) => notifications[settingFor[item.type]] && !blocked.includes(item.userId)).sort((a, b) => b.at - a.at);
    const patch = (match: (item: Notice) => boolean, change: Partial<Notice>) => update((list) => list.map((item) => (match(item) ? { ...item, ...change } : item)));
    const actions = online
      ? { markRead: (id: string) => void remoteNoticeActions.markRead(id), markAllRead: () => void remoteNoticeActions.markAllRead(), remove: (id: string) => void remoteNoticeActions.remove(id), clear: () => void remoteNoticeActions.clear() }
      : { markRead: (id: string) => patch((item) => item.id === id, { read: true }), markAllRead: () => patch(() => true, { read: true }), remove: (id: string) => update((list) => list.filter((item) => item.id !== id)), clear: () => update(() => []) };
    return { notices, unread: notices.filter((item) => !item.read).length, ...actions };
  }, [local, remote, notifications, blocked, update]);
}
