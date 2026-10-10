"use client";
import { Play } from "lucide-react";
import type { Video } from "@/types";
import { formatCount, formatDuration } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";

export function VideoCard({ video, onOpen }: { video: Video; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <button onClick={onOpen} className="group block w-full overflow-hidden rounded-card border border-border bg-surface text-left hover:border-accent">
      <span className="relative flex aspect-video items-center justify-center bg-surface-2 text-muted">
        {video.thumb ? <img src={video.thumb} alt="" loading="lazy" className="h-full w-full object-cover" /> : video.src ? <video src={`${video.src}#t=0.5`} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : null}
        <span className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-surface text-text group-hover:bg-accent group-hover:text-bg"><Play size={20} fill="currentColor" /></span>
        {video.duration ? <span className="absolute bottom-2 right-2 rounded-md bg-bg px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-text">{formatDuration(video.duration)}</span> : null}
      </span>
      <span className="block p-3">
        <span className="line-clamp-2 text-sm font-semibold leading-5 text-text">{video.title}</span>
        <span className="mt-1 block truncate text-xs text-muted">{video.author}{video.src ? "" : ` · ${formatCount(video.views)} ${t("videos.views")}`}</span>
      </span>
    </button>
  );
}
