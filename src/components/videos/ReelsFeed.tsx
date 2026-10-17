"use client";
import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PostComment, Video } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { ReelItem } from "./ReelItem";

type Props = {
  reels: Video[]; liked: string[]; saved: string[]; onLike: (id: string) => void; onSave: (id: string) => void;
  commentsFor: (id: string) => PostComment[]; onComment: (id: string, text: string) => void; onRemoveComment: (id: string, commentId: string) => void; onDelete: (id: string) => void;
};
const arrow = "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-surface-2";

export function ReelsFeed({ reels, liked, saved, onLike, onSave, commentsFor, onComment, onRemoveComment, onDelete }: Props) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const move = (direction: 1 | -1) => ref.current?.scrollBy({ top: direction * ref.current.clientHeight, behavior: "smooth" });

  const firstId = reels[0]?.id;
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [firstId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest("input, textarea")) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        ref.current?.scrollBy({ top: (event.key === "ArrowDown" ? 1 : -1) * ref.current.clientHeight, behavior: "smooth" });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className="h-[calc(100dvh-270px)] min-h-[460px] snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] lg:h-[calc(100dvh-230px)]">
        {reels.map((reel) => (
          <div key={reel.id} className="flex h-full snap-start snap-always justify-center pb-3">
            <ReelItem reel={reel} liked={liked.includes(reel.id)} saved={saved.includes(reel.id)} onLike={() => onLike(reel.id)} onSave={() => onSave(reel.id)} comments={commentsFor(reel.id)} onComment={(text) => onComment(reel.id, text)} onRemoveComment={(id) => onRemoveComment(reel.id, id)} onDelete={reel.mine ? () => onDelete(reel.id) : undefined} />
          </div>
        ))}
      </div>
      <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <button onClick={() => move(-1)} aria-label={t("photos.prev")} className={arrow}><ChevronUp size={20} /></button>
        <button onClick={() => move(1)} aria-label={t("photos.next")} className={arrow}><ChevronDown size={20} /></button>
      </div>
    </div>
  );
}
