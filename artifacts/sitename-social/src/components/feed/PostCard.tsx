"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark, EyeOff, Flag, MoreHorizontal, Pencil, Trash2, UserRound } from "lucide-react";
import type { Post } from "@/types";
import { userHref } from "@/lib/links";
import { cn, relativeTime } from "@/lib/utils";
import { savedPostsStore } from "@/lib/stores";
import { useToggleList } from "@/lib/useToggleList";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dropdown, menuItem } from "@/components/ui/Dropdown";
import { IconButton } from "@/components/ui/IconButton";
import { PostActions } from "./PostActions";
import { PostComments } from "./PostComments";
import { usePosts } from "./usePosts";
import { ImageViewer } from "@/components/ui/ImageViewer";
import { openReport } from "@/lib/reportsSync";

export function PostCard({ post }: { post: Post }) {
  const { t } = useTranslation();
  const [savedPosts, toggleSaved] = useToggleList(savedPostsStore);
  const { isLiked, toggleLike, commentsFor, addComment, removeComment, remove, edit } = usePosts();
  const [draft, setDraft] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [viewing, setViewing] = useState(false);
  const saved = savedPosts.includes(post.id);
  const liked = isLiked(post.id);
  const comments = commentsFor(post.id);
  const likes = post.likes + (liked ? 1 : 0);
  const href = userHref(post.author.id);
  return <Card id={post.id} className="mb-4">
    <div className="flex items-center gap-3 px-4 pb-3 pt-4">
      <Link href={href} className="shrink-0"><Avatar user={post.author} /></Link>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm"><Link href={href} className="font-semibold hover:underline">{post.author.name}</Link>{post.kind === "avatar" ? <span className="text-muted"> {t("post.newAvatar")}</span> : null}</div>
        <div className="mt-0.5 text-[11px] text-muted">{post.time === "0m" ? t("post.justNow") : relativeTime(post.time, t)}{post.edited ? ` · ${t("post.edited")}` : ""}</div>
      </div>
      <IconButton aria-label={t(saved ? "saved.remove" : "videos.save")} title={t(saved ? "saved.remove" : "videos.save")} aria-pressed={saved} onClick={() => toggleSaved(post.id)} className={cn("h-8 w-8", saved && "text-accent")}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></IconButton>
      <Dropdown label={t("post.more")} trigger={<MoreHorizontal size={19} />} triggerClassName="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text">
        {(close) => <>
          {post.mine ? null : <Link href={href} role="menuitem" onClick={close} className={menuItem}><UserRound size={16} className="text-muted" />{t("post.viewProfile")}</Link>}
          {post.mine ? <button role="menuitem" onClick={() => { close(); setDraft(post.text); }} className={menuItem}><Pencil size={16} className="text-muted" />{t("post.edit")}</button> : null}
          {post.mine
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
          <Button className="h-9 px-3 text-xs disabled:opacity-40" disabled={!draft.trim() && !post.image} onClick={() => { edit(post.id, draft.trim()); setDraft(null); }}>{t("profile.save")}</Button>
        </div>
      </div>
    ) : post.text ? <p className="whitespace-pre-wrap break-words px-4 pb-3 text-[13px] leading-6 text-text/90">{post.text}</p> : null}
    {post.image ? <button type="button" onClick={() => setViewing(true)} aria-label={t("photos.view")} className="block w-full cursor-zoom-in"><img src={post.image} alt="" className={post.kind === "avatar" ? "mx-auto mb-1 aspect-square w-full max-w-[320px] rounded-2xl object-cover" : "max-h-[420px] w-full object-cover"} /></button> : null}
    {viewing && post.image ? <ImageViewer src={post.image} onClose={() => setViewing(false)} /> : null}
    <div className="flex items-center justify-between px-4 py-3 text-xs text-muted">
      <div className="flex items-center gap-1.5">{post.reactions.length ? <span className="text-sm tracking-[-5px]">{post.reactions.join(" ")}</span> : null}<span className={post.reactions.length ? "ml-1" : ""}>{likes} {t("post.likesCount")}</span></div>
      <button onClick={() => setShowComments((value) => !value)} className="hover:text-text hover:underline">{comments.length} {t("post.comments")}</button>
    </div>
    <PostActions liked={liked} commentCount={comments.length} shareText={post.text} onLike={() => toggleLike(post.id)} onComment={() => setShowComments((value) => !value)} />
    {showComments ? <PostComments comments={comments} onAdd={(text) => addComment(post.id, text)} onRemove={(id) => removeComment(post.id, id)} reportType="comment" /> : null}
  </Card>;
}
