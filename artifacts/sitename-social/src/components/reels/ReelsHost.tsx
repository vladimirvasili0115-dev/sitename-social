"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Heart, MessageCircle, SendHorizontal, Share2, X } from "lucide-react";
import { initialsAvatar } from "@/lib/avatar";
import { agoLabel, relativeTime } from "@/lib/utils";
import { usePosts } from "@/components/feed/usePosts";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { playOnly, reels, useReelsOpen } from "./reelsStore";

// Full-screen videos like TikTok / Reels: one video per screen, swipe (scroll) up for the next one,
// the video on screen plays with sound and every other one is stopped.
export function ReelsHost() {
  const openId = useReelsOpen();
  if (!openId) return null;
  return <Reels startId={openId} />;
}

function Reels({ startId }: { startId: string }) {
  const { t } = useTranslation();
  const { all, isLiked, toggleLike, commentsFor, addComment } = usePosts();
  // Comments open as a sheet from the bottom (the video keeps playing above it); "Share" uses the phone's share menu.
  const [commentsOf, setCommentsOf] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  async function share(url: string, text: string) {
    try {
      if (navigator.share) { await navigator.share({ url, text }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* closed the share menu */ }
  }
  function sendComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentsOf || !draft.trim()) return;
    addComment(commentsOf, draft.trim());
    setDraft("");
  }
  const videos = all.filter((post) => post.video);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Every video already playing on the page stops; the viewer starts at the tapped one.
    document.querySelectorAll("video").forEach((video) => video.pause());
    const start = list.current?.querySelector<HTMLElement>(`[data-reel="${CSS.escape(startId)}"]`);
    start?.scrollIntoView({ block: "start" });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") reels.close();
      if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); list.current?.scrollBy({ top: (event.key === "ArrowDown" ? 1 : -1) * window.innerHeight, behavior: "smooth" }); }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [startId]);
  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const watch = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) { playOnly(video); video.currentTime = video.currentTime || 0; void video.play().catch(() => { video.muted = true; void video.play().catch(() => {}); }); }
        else if (!video.paused) video.pause();
      }
    }, { root, threshold: [0, 0.7, 1] });
    root.querySelectorAll("video").forEach((video) => watch.observe(video));
    return () => watch.disconnect();
  }, [videos.length]);
  return (
    <div role="dialog" aria-modal="true" aria-label={t("feed.video")} className="fixed inset-0 z-[150] bg-black">
      <div ref={list} className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map((post) => {
          const liked = isLiked(post.id);
          return (
            <section key={post.id} data-reel={post.id} className="relative flex h-[100dvh] snap-start snap-always items-center justify-center">
              <video src={post.video} loop playsInline preload="metadata" onClick={(event) => { const video = event.currentTarget; if (video.paused) void video.play(); else video.pause(); }} className="h-full w-full object-contain" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8 pr-20 text-white">
                <div className="flex items-center gap-2.5"><Avatar user={post.author} size="sm" /><span className="truncate text-sm font-semibold">{post.author.name}</span></div>
                {post.text ? <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm">{post.text}</p> : null}
              </div>
              <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5 text-white">
                <button type="button" onClick={() => toggleLike(post.id)} aria-label={t("post.like")} className="flex flex-col items-center gap-1 text-xs font-semibold"><span className={cn("flex h-12 w-12 items-center justify-center rounded-full bg-white/15", liked && "text-[#FF3B5C]")}><Heart size={24} fill={liked ? "currentColor" : "none"} /></span>{post.likes + (liked && !post.likes ? 1 : 0)}</button>
                <button type="button" onClick={() => setCommentsOf(post.id)} aria-label={t("post.comment")} className="flex flex-col items-center gap-1 text-xs font-semibold"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15"><MessageCircle size={23} /></span>{Math.max(post.comments, commentsFor(post.id).length)}</button>
                <button type="button" onClick={() => void share(post.video ?? window.location.href, post.text)} aria-label={t("post.share")} className="flex flex-col items-center gap-1 text-xs font-semibold"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15"><Share2 size={22} /></span>{t("post.share")}</button>
              </div>
            </section>
          );
        })}
      </div>
      {copied ? <p role="status" className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black shadow">{t("reels.copied")}</p> : null}
      {commentsOf ? (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/40" onClick={() => setCommentsOf(null)}>
          <div role="dialog" aria-label={t("post.comment")} onClick={(event) => event.stopPropagation()} className="flex max-h-[65dvh] flex-col rounded-t-3xl bg-surface text-text">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">{t("post.comment")} · {commentsFor(commentsOf).length}</p>
              <button type="button" onClick={() => setCommentsOf(null)} aria-label={t("photos.close")} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-2"><X size={16} /></button>
            </div>
            <ul className="min-h-[120px] flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {commentsFor(commentsOf).length ? commentsFor(commentsOf).map((comment) => (
                <li key={comment.id} className="flex gap-2.5">
                  <img src={comment.author?.avatar || initialsAvatar(comment.author?.name || "?")} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{comment.author?.name ?? ""} <span className="font-normal text-muted">{relativeTime(agoLabel(comment.at), t)}</span></p>
                    <p className="whitespace-pre-wrap break-words text-sm">{comment.text}</p>
                  </div>
                </li>
              )) : <li className="py-6 text-center text-sm text-muted">{t("reels.noComments")}</li>}
            </ul>
            <form onSubmit={sendComment} className="flex items-center gap-2 border-t border-border p-3">
              <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder={t("reels.writeComment")} aria-label={t("reels.writeComment")} className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface-2 px-4 text-sm outline-none focus:border-accent" />
              <button type="submit" disabled={!draft.trim()} aria-label={t("messages.send")} className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-bg disabled:opacity-40"><SendHorizontal size={18} /></button>
            </form>
          </div>
        </div>
      ) : null}
      <button type="button" onClick={() => reels.close()} aria-label={t("photos.close")} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"><X size={20} /></button>
    </div>
  );
}
