"use client";
import { useState } from "react";
import type { Game } from "@/types";
import { games } from "@/data/games";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { BottleSvg } from "@/components/bottle/BottleArt";
import { GameWindow } from "@/components/bottle/GameWindow";

// Emoji tiles stand in for game covers until each game has its own artwork.
const tiles: Record<string, { emoji: string; from: string; to: string; text: TranslationKey }> = {
  nard: { emoji: "🎲", from: "#8B4A1F", to: "#D99A4E", text: "games.descNard" },
  domino: { emoji: "🁫", from: "#1F2937", to: "#4B5563", text: "games.descDomino" },
  durak: { emoji: "🃏", from: "#7F1D1D", to: "#DC2626", text: "games.descDurak" },
  chess: { emoji: "♞", from: "#111827", to: "#6B7280", text: "games.descChess" },
  loto: { emoji: "🎱", from: "#065F46", to: "#10B981", text: "games.descLoto" },
  words: { emoji: "🔤", from: "#1E3A8A", to: "#3B82F6", text: "games.descWords" },
  quiz: { emoji: "💡", from: "#4C1D95", to: "#8B5CF6", text: "games.descQuiz" },
  poker: { emoji: "♠️", from: "#064E3B", to: "#047857", text: "games.descPoker" },
};
const row = "flex w-full items-center gap-4 rounded-2xl p-2.5 text-left";
const icon = "flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] shadow-md sm:h-24 sm:w-24";

export default function GamesPage() {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const soon = (game: Game) => {
    const tile = tiles[game.id];
    return (
      <li key={game.id}>
        <div className={row}>
          <span aria-hidden="true" className={`${icon} text-[44px]`} style={{ background: `linear-gradient(135deg, ${tile?.from ?? "#1F2937"}, ${tile?.to ?? "#4B5563"})` }}>{tile?.emoji ?? "🎮"}</span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2"><span className="text-base font-bold text-text">{game.name}</span><span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted">{t("common.soon")}</span></span>
            <span className="mt-1 block text-[13px] leading-5 text-muted">{tile ? t(tile.text) : ""}</span>
          </span>
        </div>
      </li>
    );
  };
  return (
    <div className="mx-auto max-w-[640px]">
      <Card className="p-3 sm:p-4">
        <h1 className="mb-3 px-2 pt-1 text-[22px] font-bold tracking-[-0.03em]">{t("nav.games")}</h1>
        <ul className="space-y-1">
          <li>
            <button onClick={() => setPlaying(true)} className={`${row} bg-surface-2 hover:brightness-110`}>
              <span aria-hidden="true" className={`${icon} bg-[linear-gradient(135deg,#F0A63F,#C97A26)]`}><BottleSvg className="h-[84%] rotate-[28deg] drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-text">{t("bottle.title")}</span>
                <span className="mt-1 block text-[13px] leading-5 text-muted">{t("games.descBottle")}</span>
              </span>
              <span className="hidden shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-bold text-bg sm:block">{t("games.play")}</span>
            </button>
          </li>
          {games.map(soon)}
        </ul>
      </Card>
      {playing ? <GameWindow onClose={() => setPlaying(false)} /> : null}
    </div>
  );
}
