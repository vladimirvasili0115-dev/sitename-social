"use client";
import { useEffect, useRef } from "react";
import { Heart, MessageCircle, X } from "lucide-react";
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
  const { all, isLiked, toggleLike } = usePosts();
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
                <span className="flex flex-col items-center gap-1 text-xs font-semibold"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15"><MessageCircle size={23} /></span>{post.comments}</span>
              </div>
            </section>
          );
        })}
      </div>
      <button type="button" onClick={() => reels.close()} aria-label={t("photos.close")} className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"><X size={20} /></button>
    </div>
  );
}
