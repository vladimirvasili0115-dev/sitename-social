"use client";
import { useEffect } from "react";
import { Bookmark, Flag, Heart, Trash2, X } from "lucide-react";
import { openReport } from "@/lib/reportsSync";
import type { PostComment, Video } from "@/types";
import { PostComments } from "@/components/feed/PostComments";
import { formatCount } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";

type Props = { video: Video; liked: boolean; saved: boolean; onLike: () => void; onSave: () => void; onClose: () => void; comments?: PostComment[]; onComment?: (text: string) => void; onRemoveComment?: (id: string) => void; onDelete?: () => void };

export function VideoModal({ video, liked, saved, onLike, onSave, onClose, comments, onComment, onRemoveComment, onDelete }: Props) {
  const { t } = useTranslation();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Card role="dialog" aria-modal="true" aria-label={video.title} className="flex max-h-full w-full max-w-[860px] flex-col overflow-y-auto">
        <div className="relative flex aspect-video shrink-0 items-center justify-center bg-bg">
          {video.src
            ? <video src={video.src} controls autoPlay className="h-full w-full" />
            : <>
              {video.thumb ? <img src={video.thumb} alt="" className="h-full w-full object-cover opacity-50" /> : null}
              <p className="absolute rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-muted">{t("videos.demoNote")}</p>
            </>}
          <IconButton aria-label={t("photos.close")} onClick={onClose} className="absolute right-2 top-2 border border-border bg-surface"><X size={18} /></IconButton>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-6">{video.title}</h2>
            <p className="mt-0.5 text-xs text-muted">{video.author}{video.src ? "" : ` · ${formatCount(video.views + (liked ? 1 : 0))} ${t("videos.views")}`}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" aria-pressed={liked} onClick={onLike} className="h-10 px-3 text-xs"><Heart size={15} className={liked ? "text-danger" : ""} fill={liked ? "currentColor" : "none"} />{t(liked ? "post.liked" : "post.like")}{video.src && (video.likes ?? 0) + (liked ? 1 : 0) ? ` · ${formatCount((video.likes ?? 0) + (liked ? 1 : 0))}` : ""}</Button>
            <Button variant="outline" aria-pressed={saved} onClick={onSave} className="h-10 px-3 text-xs"><Bookmark size={15} className={saved ? "text-accent" : ""} fill={saved ? "currentColor" : "none"} />{t(saved ? "videos.saved" : "videos.save")}</Button>
            {video.src && !video.mine ? <Button variant="outline" onClick={() => openReport({ type: "video", id: video.id })} aria-label={t("report.action")} title={t("report.action")} className="h-10 px-3 text-xs text-muted"><Flag size={15} /></Button> : null}
            {onDelete ? <Button variant="outline" onClick={onDelete} aria-label={t("post.delete")} title={t("post.delete")} className="h-10 px-3 text-xs text-danger"><Trash2 size={15} /></Button> : null}
          </div>
        </div>
        {video.src && comments && onComment && onRemoveComment ? <PostComments comments={comments} onAdd={onComment} onRemove={onRemoveComment} reportType="video_comment" /> : null}
      </Card>
    </div>
  );
}
