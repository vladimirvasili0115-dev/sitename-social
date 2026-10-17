"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import type { Story } from "@/types";
import { agoLabel, relativeTime } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";

const DURATION = 5000;
const TICK = 50;
const control = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-surface-2";
type Props = { stories: Story[]; startIndex: number; onSeen: (id: string) => void; onDeleteSlide: (id: string) => void; onClose: () => void };

export function StoryViewer({ stories, startIndex, onSeen, onDeleteSlide, onClose }: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(startIndex);
  const [slide, setSlide] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const story = stories[Math.min(index, stories.length - 1)];
  const current = story?.slides[Math.min(slide, story.slides.length - 1)];
  const storyId = story?.id;

  const go = (direction: 1 | -1) => {
    setElapsed(0);
    if (!story) return;
    const nextSlide = slide + direction;
    if (nextSlide >= 0 && nextSlide < story.slides.length) return setSlide(nextSlide);
    const nextIndex = index + direction;
    if (nextIndex < 0) return setSlide(0);
    if (nextIndex >= stories.length) return onClose();
    setIndex(nextIndex);
    setSlide(direction === 1 ? 0 : stories[nextIndex].slides.length - 1);
  };

  useEffect(() => {
    if (storyId) onSeen(storyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);
  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((value) => value + TICK), TICK);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (elapsed >= DURATION) go(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!story || !current) return null;
  const label = agoLabel(current.at);
  return (
    <div role="dialog" aria-modal="true" aria-label={story.user.name} className="fixed inset-0 z-50 flex items-center justify-center gap-3 bg-[color-mix(in_srgb,var(--bg)_96%,transparent)] p-3 sm:p-6">
      <button onClick={() => go(-1)} aria-label={t("photos.prev")} className={`${control} hidden sm:flex`}><ChevronLeft size={20} /></button>
      <div className="relative aspect-[9/16] h-full max-h-[860px] max-w-full overflow-hidden rounded-card border border-border bg-surface-2">
        <img src={current.image} alt="" className="h-full w-full object-cover" />
        <button onClick={() => go(-1)} aria-label={t("photos.prev")} className="absolute inset-y-0 left-0 w-1/3 sm:hidden" />
        <button onClick={() => go(1)} aria-label={t("photos.next")} className="absolute inset-y-0 right-0 w-2/3 sm:hidden" />
        <div className="absolute inset-x-0 top-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--bg)_80%,transparent),transparent)] p-3 pb-8">
          <div className="flex gap-1">
            {story.slides.map((item, position) => (
              <progress key={item.id} max={DURATION} value={position < slide ? DURATION : position === slide ? Math.min(elapsed, DURATION) : 0} className="h-1 flex-1 appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-[var(--text)] [&::-webkit-progress-bar]:bg-[var(--border)] [&::-webkit-progress-value]:bg-[var(--text)]" />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatar user={story.user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{story.mine ? t("story.yours") : story.user.name}</p>
              <p className="text-[11px] text-muted">{label === "0m" ? t("post.justNow") : relativeTime(label, t)}</p>
            </div>
            {story.mine ? <button onClick={() => { onDeleteSlide(current.id); setElapsed(0); if (story.slides.length <= 1) onClose(); }} aria-label={t("story.delete")} title={t("story.delete")} className={control}><Trash2 size={16} /></button> : null}
            <button onClick={onClose} aria-label={t("photos.close")} title={t("photos.close")} className={control}><X size={18} /></button>
          </div>
        </div>
      </div>
      <button onClick={() => go(1)} aria-label={t("photos.next")} className={`${control} hidden sm:flex`}><ChevronRight size={20} /></button>
    </div>
  );
}
