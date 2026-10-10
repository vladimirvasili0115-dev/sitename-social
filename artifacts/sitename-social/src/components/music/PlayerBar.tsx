"use client";
import { Music2, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward } from "lucide-react";
import type { Track } from "@/types";
import { formatDuration } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

type Props = {
  track: Track; playing: boolean; position: number; shuffle: boolean; repeat: boolean;
  onToggle: () => void; onPrev: () => void; onNext: () => void; onSeek: (seconds: number) => void; onShuffle: () => void; onRepeat: () => void;
};

export function PlayerBar({ track, playing, position, shuffle, repeat, onToggle, onPrev, onNext, onSeek, onShuffle, onRepeat }: Props) {
  const { t } = useTranslation();
  return (
    <Card className="sticky bottom-[76px] z-30 mt-4 p-3 lg:bottom-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-accent">
          {track.cover ? <img src={track.cover} alt="" className="h-full w-full object-cover" /> : <Music2 size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{track.title}</div>
          <div className="truncate text-xs text-muted">{track.artist}{track.src ? "" : ` · ${t("music.demoNote")}`}</div>
        </div>
        <IconButton aria-label={t("music.shuffle")} title={t("music.shuffle")} aria-pressed={shuffle} onClick={onShuffle} className={cn("hidden sm:inline-flex", shuffle && "text-accent")}><Shuffle size={16} /></IconButton>
        <IconButton aria-label={t("photos.prev")} onClick={onPrev}><SkipBack size={18} /></IconButton>
        <button onClick={onToggle} aria-label={t(playing ? "music.pause" : "music.play")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-bg">
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <IconButton aria-label={t("photos.next")} onClick={onNext}><SkipForward size={18} /></IconButton>
        <IconButton aria-label={t("music.repeat")} title={t("music.repeat")} aria-pressed={repeat} onClick={onRepeat} className={cn("hidden sm:inline-flex", repeat && "text-accent")}><Repeat size={16} /></IconButton>
      </div>
      <div className="mt-2.5 flex items-center gap-3 text-[11px] tabular-nums text-muted">
        <span>{formatDuration(position)}</span>
        <input type="range" min={0} max={track.duration || 1} value={Math.min(position, track.duration || 1)} onChange={(event) => onSeek(Number(event.target.value))} aria-label={track.title} className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--accent)]" />
        <span>{formatDuration(track.duration)}</span>
      </div>
    </Card>
  );
}
