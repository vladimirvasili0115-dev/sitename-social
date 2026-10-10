"use client";
import { Star, Users } from "lucide-react";
import type { Game, GameCategory } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export const gameCategoryLabels: Record<GameCategory, TranslationKey> = { party: "games.catParty", board: "games.catBoard", cards: "games.catCards", puzzle: "games.catPuzzle" };

export function GameCard({ game, favorite, onFavorite }: { game: Game; favorite: boolean; onFavorite: () => void }) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[3/2] bg-surface-2">
        <img src={game.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        <button onClick={onFavorite} aria-pressed={favorite} aria-label={t("common.addFavorite")} title={t("common.addFavorite")} className={cn("absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface", favorite ? "text-accent" : "text-muted hover:text-text")}>
          <Star size={16} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-3">
        <h2 className="truncate text-sm font-semibold">{game.name}</h2>
        <p className="mt-0.5 truncate text-xs text-muted">{t(gameCategoryLabels[game.category])}</p>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-muted"><Users size={13} />{game.players} {t("games.playing")}</span>
          <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted">{t("common.soon")}</span>
        </div>
      </div>
    </Card>
  );
}
