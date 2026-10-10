"use client";
import { useState } from "react";
import type { GameCategory } from "@/types";
import { featuredGame, gameCategories, games } from "@/data/games";
import { createStore } from "@/lib/store";
import { useToggleList } from "@/lib/useToggleList";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { FeaturedGame } from "@/components/games/FeaturedGame";
import { GameCard, gameCategoryLabels } from "@/components/games/GameCard";

type Filter = GameCategory | "all" | "favorites";
const favoritesStore = createStore<string[]>("sitename-games-favorites", []);

export default function GamesPage() {
  const { t } = useTranslation();
  const [favorites, toggleFavorite] = useToggleList(favoritesStore);
  const [filter, setFilter] = useState<Filter>("all");
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("common.all") },
    { id: "favorites", label: t("common.favorites") },
    ...gameCategories.map((id) => ({ id, label: t(gameCategoryLabels[id]) })),
  ];
  const visible = games.filter((game) => filter === "all" || (filter === "favorites" ? favorites.includes(game.id) : game.category === filter));
  return (
    <div>
      <h1 className="mb-4 px-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.games")}</h1>
      <FeaturedGame game={featuredGame} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button key={item.id} onClick={() => setFilter(item.id)} aria-pressed={item.id === filter} className={cn("shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium", item.id === filter ? "border-accent bg-accent text-bg" : "border-border bg-surface text-muted hover:text-text")}>{item.label}</button>
        ))}
      </div>
      {visible.length ? (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((game) => <li key={game.id}><GameCard game={game} favorite={favorites.includes(game.id)} onFavorite={() => toggleFavorite(game.id)} /></li>)}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("games.empty")}</Card>}
    </div>
  );
}
