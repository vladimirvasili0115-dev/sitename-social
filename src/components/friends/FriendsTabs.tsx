"use client";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export const friendsTabs = ["all", "online", "requests", "suggestions"] as const;
export type FriendsTab = (typeof friendsTabs)[number];
const labels: Record<FriendsTab, TranslationKey> = {
  all: "friends.tabAll", online: "friends.tabOnline", requests: "friends.tabRequests", suggestions: "friends.tabSuggestions",
};

export function FriendsTabs({ active, counts, onChange }: { active: FriendsTab; counts: Record<FriendsTab, number>; onChange: (tab: FriendsTab) => void }) {
  const { t } = useTranslation();
  return (
    <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
      {friendsTabs.map((tab) => (
        <button key={tab} role="tab" aria-selected={tab === active} onClick={() => onChange(tab)} className={cn("relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium", tab === active ? "text-accent" : "text-muted hover:text-text")}>
          {t(labels[tab])}
          <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] tabular-nums", tab === "requests" && counts[tab] > 0 ? "bg-accent font-semibold text-bg" : "bg-surface-2 text-muted")}>{counts[tab]}</span>
          {tab === active ? <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent" /> : null}
        </button>
      ))}
    </div>
  );
}
