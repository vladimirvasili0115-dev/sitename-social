"use client";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

export const profileTabs = ["wall", "about", "friends", "photos", "gifts"] as const;
export type ProfileTab = (typeof profileTabs)[number];
const labels: Record<ProfileTab, TranslationKey> = {
  wall: "profile.tabWall", about: "profile.tabAbout", friends: "nav.friends", photos: "nav.photos", gifts: "nav.gifts",
};

export function ProfileTabs({ active, onChange }: { active: ProfileTab; onChange: (tab: ProfileTab) => void }) {
  const { t } = useTranslation();
  return (
    <div role="tablist" className="my-4 flex gap-1 overflow-x-auto border-b border-border">
      {profileTabs.map((tab) => (
        <button key={tab} role="tab" aria-selected={tab === active} onClick={() => onChange(tab)} className={cn("relative shrink-0 px-4 py-3 text-sm font-medium", tab === active ? "text-accent" : "text-muted hover:text-text")}>
          {t(labels[tab])}
          {tab === active ? <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent" /> : null}
        </button>
      ))}
    </div>
  );
}
