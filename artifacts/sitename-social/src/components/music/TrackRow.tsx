"use client";
import { Heart, Music2, Pause, Play, Trash2 } from "lucide-react";
import type { Track } from "@/types";
import { formatDuration } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

type Props = { track: Track; active: boolean; playing: boolean; favorite: boolean; onPlay: () => void; onFavorite: () => void; onDelete?: () => void };

export function TrackRow({ track, active, playing, favorite, onPlay, onFavorite, onDelete }: Props) {
  const { t } = useTranslation();
  const Icon = active && playing ? Pause : Play;
  return (
    <div className={cn("flex items-center gap-3 rounded-xl p-2", active ? "bg-surface-2" : "hover:bg-surface-2")}>
      <button onClick={onPlay} aria-label={`${t(active && playing ? "music.pause" : "music.play")}: ${track.title}`} className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-text">
        {track.cover ? <img src={track.cover} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60" /> : <Music2 size={30} className="absolute text-border" />}
        <Icon size={18} fill="currentColor" className="relative" />
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm font-semibold", active ? "text-accent" : "text-text")}>{track.title}</div>
        <div className="truncate text-xs text-muted">{track.artist}</div>
      </div>
      <span className="text-xs tabular-nums text-muted">{track.duration ? formatDuration(track.duration) : ""}</span>
      <button onClick={onFavorite} aria-pressed={favorite} aria-label={t("common.addFavorite")} title={t("common.addFavorite")} className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-surface", favorite ? "text-danger" : "text-muted")}>
        <Heart size={16} fill={favorite ? "currentColor" : "none"} />
      </button>
      {onDelete ? <button onClick={onDelete} aria-label={`${t("post.delete")}: ${track.title}`} title={t("post.delete")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-danger"><Trash2 size={15} /></button> : null}
    </div>
  );
}
