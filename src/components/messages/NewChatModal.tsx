"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Person } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SearchInput } from "@/components/ui/SearchInput";

export function NewChatModal({ friends, onPick, onClose }: { friends: Person[]; onPick: (userId: string) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const visible = needle ? friends.filter((item) => item.user.name.toLocaleLowerCase().includes(needle)) : friends;
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Card role="dialog" aria-modal="true" aria-label={t("messages.newChat")} className="flex max-h-[80dvh] w-full max-w-[420px] flex-col rounded-b-none sm:rounded-b-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold">{t("messages.newChat")}</h2>
          <IconButton aria-label={t("photos.close")} onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div className="p-3"><SearchInput value={query} onChange={setQuery} label={t("friends.search")} /></div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {visible.map(({ user, city }) => (
            <li key={user.id}>
              <button onClick={() => onPick(user.id)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-surface-2">
                <Avatar user={user} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text">{user.name}</span><span className="block truncate text-xs text-muted">{city}</span></span>
                {user.online ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
              </button>
            </li>
          ))}
          {visible.length ? null : <li className="p-6 text-center text-sm text-muted">{t(friends.length ? "friends.noResults" : "friends.emptyAll")}</li>}
        </ul>
      </Card>
    </div>
  );
}
