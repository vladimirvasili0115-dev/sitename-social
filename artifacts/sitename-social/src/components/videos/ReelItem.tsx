"use client";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Check, Flag, Heart, MessageCircle, Play, Send, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { openReport } from "@/lib/reportsSync";
import { PostComments } from "@/components/feed/PostComments";
import type { PostComment, Video } from "@/types";
import { formatCount } from "@/lib/format";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/settings/useSettings";

type Props = { reel: Video; liked: boolean; saved: boolean; onLike: () => void; onSave: () => void; comments: PostComment[]; onComment: (text: string) => void; onRemoveComment: (id: string) => void; onDelete?: () => void };
const action = "flex flex-col items-center gap-1 text-[11px] font-medium text-text";
const bubble = "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface";

export function ReelItem({ reel, liked, saved, onLike, onSave, comments, onComment, onRemoveComment, onDelete }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);
  async function share() {
    try {
      await navigator.clipboard.writeText(reel.title);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked by the browser: nothing to copy.
    }
  }
  const { settings } = useSettings();
  const { autoplay } = settings;
  const [mutedChoice, setMuted] = useState<boolean | null>(null);
  const muted = mutedChoice ?? settings.reelsMuted;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && autoplay) video.play().then(() => setPaused(false)).catch(() => setPaused(true));
      else if (entry.isIntersecting) setPaused(true);
      else video.pause();
    }, { threshold: 0.6 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [autoplay]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().then(() => setPaused(false)).catch(() => setPaused(true));
    else {
      video.pause();
      setPaused(true);
    }
  }

  return (
    <article className="relative mx-auto aspect-[9/16] h-full max-w-full overflow-hidden rounded-card border border-border bg-surface-2" onDoubleClick={() => { if (!liked) onLike(); }}>
      {reel.src
        ? <video ref={videoRef} src={reel.src} loop playsInline muted={muted} onClick={togglePlay} className="h-full w-full cursor-pointer object-cover" />
        : reel.thumb ? <img src={reel.thumb} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
      {reel.src && paused ? <span className="pointer-events-none absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface text-text"><Play size={26} fill="currentColor" /></span> : null}
      {reel.src ? (
        <button onClick={() => setMuted(!muted)} aria-label={t(muted ? "videos.unmute" : "videos.mute")} className={cn(bubble, "absolute right-3 top-3 text-text")}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
      ) : <span className="absolute left-3 top-3 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted">{t("videos.demoTag")}</span>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--bg)_88%,transparent),transparent)] p-4 pr-16 pt-16">
        <p className="text-sm font-semibold text-text">@{reel.author}</p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-text">{reel.title}</p>
      </div>
      <div className="absolute bottom-4 right-2.5 flex flex-col gap-3">
        <button onClick={onLike} aria-pressed={liked} aria-label={t("post.like")} className={action}><span className={cn(bubble, liked && "text-danger")}><Heart size={19} fill={liked ? "currentColor" : "none"} /></span>{formatCount((reel.likes ?? 0) + (liked ? 1 : 0))}</button>
        <button onClick={() => setShowComments(true)} aria-label={t("post.comment")} className={action}><span className={bubble}><MessageCircle size={19} /></span>{formatCount((reel.comments ?? 0) + comments.length)}</button>
        <button onClick={onSave} aria-pressed={saved} aria-label={t("videos.save")} className={action}><span className={cn(bubble, saved && "text-accent")}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></span></button>
        <button onClick={share} aria-label={t("post.share")} className={action}><span className={cn(bubble, copied && "text-accent")}>{copied ? <Check size={18} /> : <Send size={18} />}</span></button>
        {reel.src && !reel.mine ? <button onClick={() => openReport({ type: "video", id: reel.id })} aria-label={t("report.action")} title={t("report.action")} className={action}><span className={bubble}><Flag size={17} /></span></button> : null}
        {onDelete ? <button onClick={onDelete} aria-label={t("post.delete")} title={t("post.delete")} className={action}><span className={cn(bubble, "text-danger")}><Trash2 size={18} /></span></button> : null}
      </div>
      {showComments ? (
        <div className="absolute inset-x-0 bottom-0 flex max-h-[72%] flex-col rounded-t-card border-t border-border bg-surface">
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="text-sm font-semibold">{t("post.comment")} · {comments.length}</p>
            <button onClick={() => setShowComments(false)} aria-label={t("photos.close")} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"><X size={16} /></button>
          </div>
          <div className="min-h-0 overflow-y-auto"><PostComments comments={comments} onAdd={onComment} onRemove={onRemoveComment} /></div>
        </div>
      ) : null}
    </article>
  );
}
