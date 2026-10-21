"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import { FeedVideo } from "@/components/reels/FeedVideo";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronRight, EyeOff, Flag, MoreHorizontal, Pencil, Repeat2, Trash2, UserRound } from "lucide-react";
import type { Post } from "@/types";
import { userHref } from "@/lib/links";
import { isRemoteId } from "@/lib/remoteProfiles";
import { cn, relativeTime } from "@/lib/utils";
import { savedPostsStore } from "@/lib/stores";
import { useToggleList } from "@/lib/useToggleList";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dropdown, menuItem } from "@/components/ui/Dropdown";
import { IconButton } from "@/components/ui/IconButton";
import { RichText } from "@/components/ui/RichText";
import { MentionList, useMentions } from "@/components/ui/Mentions";
import { PostActions } from "./PostActions";
import { PostComments } from "./PostComments";
import { PostPoll } from "./PostPoll";
import { usePosts } from "./usePosts";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { openReport } from "@/lib/reportsSync";

const timeLabel = (post: Post, t: ReturnType<typeof useTranslation>["t"]) => (post.time === "0m" ? t("post.justNow") : relativeTime(post.time, t));

// The picture, video and poll of a post (also used inside a repost).
function PostBody({ post, onVote }: { post: Post; onVote: (choice: number | null) => void }) {
  const { t } = useTranslation();
  const [viewing, setViewing] = useState(false);
  return <>
    {post.image ? <button type="button" onClick={() => setViewing(true)} aria-label={t("photos.view")} className="block w-full cursor-zoom-in"><span className="relative flex w-full justify-center overflow-hidden bg-surface-2"><img src={post.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" /><img src={post.image} alt="" className={cn("relative w-auto max-w-full object-contain", post.image.startsWith("/custom/") ? "max-h-[200px] py-3" : "max-h-[600px]")} /></span></button> : null}
    {post.video ? <FeedVideo id={post.id} src={post.video} /> : null}
    {post.poll ? <PostPoll poll={post.poll} mine={post.mine} onVote={onVote} /> : null}
    {viewing && post.image ? <ImageViewer src={post.image} onClose={() => setViewing(false)} /> : null}
  </>;
}

export function PostCard({ post, openComments = false }: { post: Post; openComments?: boolean }) {
  const { t } = useTranslation();
  const accountId = useAuth().user?.id;
  const [savedPosts, toggleSaved] = useToggleList(savedPostsStore);
  const { reactionOf, react, vote, commentsFor, addComment, removeComment, remove, edit, create } = usePosts();
  const [draft, setDraft] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(openComments);
  const [reposting, setReposting] = useState<string | null>(null);
  const [reposted, setReposted] = useState(false);
  const mentions = useMentions(reposting ?? "", setReposting);
  const saved = savedPosts.includes(post.id);
  const reaction = reactionOf(post.id);
  const comments = commentsFor(post.id);
  const likes = post.likes + (reaction ? 1 : 0);
  // The faces shown next to the count: the most used reactions (yours included).
  const counts = { ...(post.reactionCounts ?? (post.likes ? { "❤️": post.likes } : {})) };
  if (reaction) counts[reaction] = (counts[reaction] ?? 0) + 1;
  const faces = Object.entries(counts).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([emoji]) => emoji);
  const href = userHref(post.author.id);
  const onMyWall = Boolean(post.wallOwner && accountId && post.wallOwner.id === accountId);
  const original = post.repost;
  const canRepost = isRemoteId(post.id) && !post.groupId;
  const shareText = typeof window !== "undefined" && isRemoteId(post.id) ? `${window.location.origin}/post?id=${post.id}` : post.text;
  function sendRepost() {
    if (reposting === null) return;
    void create({ text: reposting.trim(), repostOf: original?.id ?? post.id });
    setReposting(null);
    setReposted(true);
    window.setTimeout(() => setReposted(false), 2500);
  }
  return <Card id={post.id} className="mb-4">
    <div className="flex items-center gap-3 px-4 pb-3 pt-4">
      <Link href={href} className="shrink-0"><Avatar user={post.author} /></Link>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center text-sm">
          <Link href={href} className="truncate font-semibold hover:underline">{post.author.name}</Link><VerifiedMark userId={post.author.id} size={14} />
          {post.wallOwner?.name ? <><ChevronRight size={14} className="mx-0.5 shrink-0 text-muted" /><Link href={onMyWall ? "/profile" : userHref(post.wallOwner.id)} className="truncate font-semibold hover:underline">{post.wallOwner.name}</Link></> : null}
          {post.kind === "avatar" ? <span className="truncate text-muted">&nbsp;{t("post.newAvatar")}</span> : null}
          {post.repostOf ? <span className="flex shrink-0 items-center gap-1 text-muted">&nbsp;<Repeat2 size={14} />{t("post.reposted")}</span> : null}
        </div>
        <div className="mt-0.5 text-[11px] text-muted">{timeLabel(post, t)}{post.edited ? ` · ${t("post.edited")}` : ""}</div>
      </div>
      <IconButton aria-label={t(saved ? "saved.remove" : "videos.save")} title={t(saved ? "saved.remove" : "videos.save")} aria-pressed={saved} onClick={() => toggleSaved(post.id)} className={cn("h-8 w-8", saved && "text-accent")}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></IconButton>
      <Dropdown label={t("post.more")} trigger={<MoreHorizontal size={19} />} triggerClassName="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text">
        {(close) => <>
          {post.mine ? null : <Link href={href} role="menuitem" onClick={close} className={menuItem}><UserRound size={16} className="text-muted" />{t("post.viewProfile")}</Link>}
          {post.mine ? <button role="menuitem" onClick={() => { close(); setDraft(post.text); }} className={menuItem}><Pencil size={16} className="text-muted" />{t("post.edit")}</button> : null}
          {post.mine || onMyWall
            ? <button role="menuitem" onClick={() => { close(); remove(post.id, true); }} className={cn(menuItem, "text-danger")}><Trash2 size={16} />{t("post.delete")}</button>
            : <button role="menuitem" onClick={() => { close(); remove(post.id); }} className={menuItem}><EyeOff size={16} className="text-muted" />{t("post.hide")}</button>}
          {post.mine ? null : <button role="menuitem" onClick={() => { close(); openReport({ type: "post", id: post.id }); }} className={cn(menuItem, "text-danger")}><Flag size={16} />{t("report.action")}</button>}
        </>}
      </Dropdown>
    </div>
    {draft !== null ? (
      <div className="px-4 pb-3">
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} rows={3} aria-label={t("post.edit")} className="w-full resize-none rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-sm leading-6 text-text outline-none focus:border-accent" />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="subtle" className="h-9 px-3 text-xs" onClick={() => setDraft(null)}>{t("common.cancel")}</Button>
          <Button className="h-9 px-3 text-xs disabled:opacity-40" disabled={!draft.trim() && !post.image && !post.repostOf && !post.poll} onClick={() => { edit(post.id, draft.trim()); setDraft(null); }}>{t("profile.save")}</Button>
        </div>
      </div>
    ) : post.text ? <RichText text={post.text} className="whitespace-pre-wrap break-words px-4 pb-3 text-[13px] leading-6 text-text/90" /> : null}
    <PostBody post={post} onVote={(choice) => vote(post.id, choice)} />
    {post.repostOf ? (
      original ? (
        <div className="mx-4 mb-1 overflow-hidden rounded-xl border border-border">
          <div className="flex items-center gap-2.5 px-3 pb-2 pt-3">
            <Link href={userHref(original.author.id)} className="shrink-0"><Avatar user={original.author} size="sm" /></Link>
            <div className="min-w-0">
              <Link href={userHref(original.author.id)} className="block truncate text-[13px] font-semibold hover:underline">{original.author.name}</Link>
              <Link href={`/post?id=${original.id}`} className="block text-[11px] text-muted hover:underline">{timeLabel(original, t)}</Link>
            </div>
          </div>
          {original.text ? <RichText text={original.text} className="whitespace-pre-wrap break-words px-3 pb-3 text-[13px] leading-6 text-text/90" /> : null}
          <PostBody post={original} onVote={(choice) => vote(original.id, choice)} />
        </div>
      ) : <p className="mx-4 mb-1 rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted">{t("post.repostGone")}</p>
    ) : null}
    <div className="flex items-center justify-between px-4 py-3 text-xs text-muted">
      <div className="flex items-center gap-1.5">{faces.length ? <span className="flex -space-x-1 text-sm">{faces.map((emoji) => <span key={emoji} className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-[12px] ring-2 ring-surface">{emoji}</span>)}</span> : null}<span className={faces.length ? "ml-1" : ""}>{likes} {t("post.likesCount")}</span></div>
      <button onClick={() => setShowComments((value) => !value)} className="hover:text-text hover:underline">{comments.length} {t("post.comments")}</button>
    </div>
    <PostActions reaction={reaction} commentCount={comments.length} shareText={shareText} onReact={(emoji) => react(post.id, emoji)} onComment={() => setShowComments((value) => !value)} onRepost={canRepost ? () => setReposting((value) => (value === null ? "" : null)) : undefined} />
    {reposting !== null ? (
      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-text"><Repeat2 size={15} className="text-accent" />{t("post.repostTitle")}</p>
        <div className="relative">
          <textarea value={reposting} onChange={(event) => { setReposting(event.target.value); mentions.track(event); }} onSelect={mentions.track} maxLength={1000} rows={2} placeholder={t("post.repostNote")} aria-label={t("post.repostNote")} className="w-full resize-none rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
          <MentionList list={mentions.list} onPick={mentions.pick} />
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="subtle" className="h-9 px-3 text-xs" onClick={() => setReposting(null)}>{t("common.cancel")}</Button>
          <Button className="h-9 px-3 text-xs" onClick={sendRepost}>{t("post.repostSend")}</Button>
        </div>
      </div>
    ) : null}
    {reposted ? <p role="status" className="border-t border-border px-4 py-2 text-xs font-semibold text-accent">{t("post.repostDone")}</p> : null}
    {showComments ? <PostComments comments={comments} threads={isRemoteId(post.id)} canRemoveAll={post.mine || onMyWall} onAdd={(text, parentId) => addComment(post.id, text, parentId)} onRemove={(id) => removeComment(post.id, id)} reportType="comment" /> : null}
  </Card>;
}
