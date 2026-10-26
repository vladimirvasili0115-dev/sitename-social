"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { BottleCover } from "@/components/bottle/BottleArt";

// The game's picture, the same one as on the games page: public/games/bottle.png, otherwise the drawn one.
function Cover() {
  const [own, setOwn] = useState(true);
  return own ? <img src="/games/bottle.png" alt="" onError={() => setOwn(false)} className="h-full w-full object-cover" /> : <BottleCover className="h-full w-full" />;
}

// An advert for the game on the home page, like "Continue playing" on the original site.
export function GamePromo() {
  const { t } = useTranslation();
  const router = useRouter();
  const [played, setPlayed] = useState(false);
  useEffect(() => {
    try { setPlayed(Boolean(JSON.parse(window.localStorage.getItem("bottle-tables") ?? "[]").length)); } catch { /* storage is blocked */ }
  }, []);
  return (
    <section className="mb-4 rounded-2xl border border-border bg-surface p-3 shadow-sm">
      <p className="mb-2 px-1 text-sm font-bold text-text">{t(played ? "feed.gameContinueTitle" : "feed.gameTitle")}</p>
      <button type="button" onClick={() => router.push("/bottle/")} className="flex w-full items-center gap-4 rounded-2xl bg-surface-2 p-2.5 text-left hover:brightness-110">
        <span aria-hidden="true" className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] shadow-md sm:h-24 sm:w-24"><Cover /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold text-text">{t("bottle.title")}</span>
          <span className="mt-1 block text-[13px] leading-5 text-muted">{t("games.descBottle")}</span>
        </span>
        <span className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-bold text-bg">{t(played ? "feed.gameContinue" : "games.play")}</span>
      </button>
    </section>
  );
}
