"use client";
import { Sparkles, Users } from "lucide-react";
import type { Game } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";

export function FeaturedGame({ game }: { game: Game }) {
  const { t } = useTranslation();
  return (
    <Card className="relative mb-4 overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,color-mix(in_srgb,var(--accent)_28%,transparent),transparent_55%),radial-gradient(circle_at_10%_90%,color-mix(in_srgb,var(--accent-2)_22%,transparent),transparent_50%)]" />
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-bg"><Sparkles size={36} strokeWidth={1.8} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-accent">{t("games.featured")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{game.name}</h2>
          <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted">{t("games.butulkaText")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text">{t("common.soon")}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted"><Users size={13} />{game.players} {t("games.playing")}</span>
        </div>
      </div>
    </Card>
  );
}
