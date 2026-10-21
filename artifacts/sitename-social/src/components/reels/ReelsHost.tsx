"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bookmark, Heart, MessageCircle, Plus, SendHorizontal, Share2, X } from "lucide-react";
import Link from "next/link";
import { useFriends } from "@/components/friends/useFriends";
import { savedPostsStore } from "@/lib/stores";
import { useToggleList } from "@/lib/useToggleList";
import { userHref } from "@/lib/links";
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
      if (navigator.share) { await navigator.share({ url, text }); setShares((value) => ({ ...value, [url]: (value[url] ?? 0) + 1 })); return; }
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
  // Top tabs like TikTok: "Friends" (videos of your friends) and "For you" (all videos).
  const [feed, setFeed] = useState<"friends" | "foryou">("foryou");
  const { friends, outgoingIds, actions } = useFriends();
  const friendIds = new Set(friends.map((item) => item.user.id));
  const [saved, toggleSaved] = useToggleList(savedPostsStore);
  const [shares, setShares] = useState<Record<string, number>>({});
  const videos = all.filter((post) => post.video && (feed === "foryou" || friendIds.has(post.author.id) || post.mine));
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
  }, [videos.length, feed]);
  return (
    <div role="dialog" aria-modal="true" aria-label={t("feed.video")} className="fixed inset-0 z-[150] bg-black">
      <div className="absolute inset-x-0 top-0 z-10 flex justify-center gap-6 bg-gradient-to-b from-black/60 to-transparent pb-6 pt-4 text-[15px] font-semibold text-white/70">
        {([["friends", t("reels.friends")], ["foryou", t("reels.forYou")]] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setFeed(id)} aria-pressed={feed === id} className={cn("relative pb-1", feed === id && "text-white")}>{label}{feed === id ? <span className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-white" /> : null}</button>
        ))}
      </div>
      {videos.length ? null : <p className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-white/70">{t("reels.empty")}</p>}
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
              <div className="absolute bottom-24 right-2 flex flex-col items-center gap-4 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
                <div className="relative mb-2">
                  <Link href={userHref(post.author.id)} onClick={() => reels.close()} aria-label={post.author.name} className="block rounded-full ring-2 ring-white"><Avatar user={post.author} className="h-12 w-12" /></Link>
                  {!post.mine && !friendIds.has(post.author.id) && !outgoingIds.includes(post.author.id) ? <button type="button" onClick={() => actions.add(post.author.id)} aria-label={t("reels.addFriend")} className="absolute -bottom-2.5 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-[#FE2C55] text-white"><Plus size={15} strokeWidth={3} /></button> : null}
                </div>
                <button type="button" onClick={() => toggleLike(post.id)} aria-label={t("post.like")} className="flex flex-col items-center gap-0.5 text-xs font-semibold"><Heart size={34} fill="currentColor" className={liked ? "text-[#FE2C55]" : "text-white"} />{post.likes + (liked && !post.likes ? 1 : 0)}</button>
                <button type="button" onClick={() => setCommentsOf(post.id)} aria-label={t("post.comment")} className="flex flex-col items-center gap-0.5 text-xs font-semibold"><MessageCircle size={32} fill="currentColor" />{Math.max(post.comments, commentsFor(post.id).length)}</button>
                <button type="button" onClick={() => toggleSaved(post.id)} aria-label={t("videos.save")} aria-pressed={saved.includes(post.id)} className="flex flex-col items-center gap-0.5 text-xs font-semibold"><Bookmark size={31} fill="currentColor" className={saved.includes(post.id) ? "text-[#FACE15]" : "text-white"} />{saved.includes(post.id) ? 1 : 0}</button>
                <button type="button" onClick={() => void share(post.video ?? window.location.href, post.text)} aria-label={t("post.share")} className="flex flex-col items-center gap-0.5 text-xs font-semibold"><Share2 size={30} />{shares[post.video ?? ""] ?? t("post.share")}</button>
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
