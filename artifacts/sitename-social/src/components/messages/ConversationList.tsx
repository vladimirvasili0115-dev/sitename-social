"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import { parseCallLog } from "@/lib/callLog";
import { useState } from "react";
import { Search, SquarePen } from "lucide-react";
import { dayDiff, formatClock, formatDay } from "@/lib/datetime";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { Chat } from "./useMessages";

export function ConversationList({ chats, activeId, onOpen, onNew, className }: { chats: Chat[]; activeId: string | null; onOpen: (userId: string) => void; onNew: () => void; className?: string }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const visible = needle ? chats.filter((chat) => chat.person.user.name.toLocaleLowerCase().includes(needle)) : chats;
  return (
    <div className={cn("min-h-0 w-full flex-col md:w-[300px] md:shrink-0 md:border-r md:border-border", className)}>
      <div className="flex items-center gap-2 border-b border-border p-3">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-surface-2 px-3 text-muted">
          <Search size={15} className="shrink-0" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t("messages.search")} placeholder={t("messages.search")} className="w-full min-w-0 bg-transparent text-sm text-text outline-none placeholder:text-muted" />
        </label>
        <button onClick={onNew} aria-label={t("messages.newChat")} title={t("messages.newChat")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-bg hover:brightness-110"><SquarePen size={17} /></button>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {visible.map((chat) => {
          const last = chat.messages[chat.messages.length - 1];
          const { user } = chat.person;
          return (
            <li key={chat.userId}>
              <button onClick={() => onOpen(chat.userId)} aria-current={chat.userId === activeId ? "true" : undefined} className={cn("flex w-full items-center gap-3 rounded-xl p-2.5 text-left", chat.userId === activeId ? "bg-surface-2" : "hover:bg-surface-2")}>
                <span className="relative h-12 w-12 shrink-0">
                  <Avatar user={user} size="lg" />
                  {user.online ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-accent" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-text">{user.name}<VerifiedMark userId={user.id} size={13} /></span>
                    {last ? <span className="shrink-0 text-[11px] text-muted">{dayDiff(last.at) === 0 ? formatClock(last.at) : formatDay(last.at).slice(0, 5)}</span> : null}
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className={cn("truncate text-xs", chat.unread ? "font-medium text-text" : "text-muted")}>{last ? `${last.from === "me" ? `${t("common.you")}: ` : ""}${parseCallLog(last.text) ? `📞 ${t(`call.log_${parseCallLog(last.text)!.kind === "missed" && last.from === "me" ? "noanswer" : parseCallLog(last.text)!.kind}` as "call.log_done")}` : last.text || (last.audio ? `🎤 ${t("messages.voice")}` : `📷 ${t("messages.photo")}`)}` : t("messages.noMessages")}</span>
                    {chat.unread ? <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-bg">{chat.unread}</span> : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {visible.length ? null : <li className="p-6 text-center text-sm text-muted">{t("friends.noResults")}</li>}
      </ul>
    </div>
  );
}
