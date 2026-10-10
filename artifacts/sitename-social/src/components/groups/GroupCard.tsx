"use client";
import Link from "next/link";
import { Check, Plus, Trash2, Users } from "lucide-react";
import { groupHref } from "@/lib/links";
import type { Group, GroupCategory } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

export const categoryLabels: Record<GroupCategory, TranslationKey> = {
  music: "groups.catMusic", sport: "groups.catSport", tech: "groups.catTech", travel: "groups.catTravel", food: "groups.catFood", games: "groups.catGames",
};

export function GroupCard({ group, onToggle, onRemove }: { group: Group; onToggle: () => void; onRemove: () => void }) {
  const { t, locale } = useTranslation();
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative h-24 bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]">
        {group.cover ? <img src={group.cover} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
        <span className="absolute left-3 top-3 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-text">{t(categoryLabels[group.category])}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="truncate text-sm font-semibold"><Link href={groupHref(group.id)} className="hover:underline">{group.name}</Link></h2>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Users size={13} />{group.members.toLocaleString(locale === "en" ? "en" : "ru")} {t("groups.members")}</p>
        <p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-muted">{group.description}</p>
        <div className="mt-3 flex items-center gap-2">
          {group.joined
            ? <Button variant="outline" className="h-9 flex-1 px-3 text-xs" onClick={onToggle}><Check size={14} className="text-accent" />{t("groups.joined")}</Button>
            : <Button className="h-9 flex-1 px-3 text-xs" onClick={onToggle}><Plus size={14} />{t("groups.join")}</Button>}
          {group.mine ? <IconButton aria-label={t("groups.delete")} title={t("groups.delete")} onClick={onRemove} className="h-9 w-9 shrink-0"><Trash2 size={15} /></IconButton> : null}
        </div>
      </div>
    </Card>
  );
}
