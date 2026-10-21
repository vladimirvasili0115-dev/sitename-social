"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Flag, SendHorizontal, X } from "lucide-react";
import { isRemoteId } from "@/lib/remoteProfiles";
import { openReport } from "@/lib/reportsSync";
import type { PostComment, User } from "@/types";
import { people } from "@/data/friends";
import { currentUser } from "@/data/users";
import { userHref } from "@/lib/links";
import { agoLabel, relativeTime } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { RichText } from "@/components/ui/RichText";
import { MentionList, useMentions } from "@/components/ui/Mentions";
import { useProfile } from "@/components/profile/useProfile";

// Comments with replies (like VK): a reply sits under the comment it answers and starts with the @name.
type Props = { comments: PostComment[]; onAdd: (text: string, parentId?: string) => void; onRemove: (id: string) => void; reportType?: "comment" | "video_comment"; threads?: boolean; canRemoveAll?: boolean };

export function PostComments({ comments, onAdd, onRemove, reportType, threads = false, canRemoveAll = false }: Props) {
  const { t } = useTranslation();
  const { user } = useProfile();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [open, setOpen] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const mentions = useMentions(text, setText);
  const authorOf = (comment: PostComment): User | undefined => comment.author ?? (comment.userId === currentUser.id ? user : people.find((item) => item.user.id === comment.userId)?.user);
  const ids = new Set(comments.map((item) => item.id));
  const roots = threads ? comments.filter((item) => !item.parentId || !ids.has(item.parentId)) : comments;
  const repliesOf = (id: string) => (threads ? comments.filter((item) => item.parentId === id) : []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    onAdd(value, replyTo?.id);
    if (replyTo) setOpen((list) => [...new Set([...list, replyTo.id])]);
    setText("");
    setReplyTo(null);
  }
  function reply(comment: PostComment, author: User) {
    const root = comment.parentId && ids.has(comment.parentId) ? comment.parentId : comment.id;
    setReplyTo({ id: root, name: author.name });
    if (author.handle && comment.userId !== currentUser.id) setText(`@${author.handle} `);
    window.setTimeout(() => input.current?.focus(), 0);
  }

  const row = (comment: PostComment, nested: boolean) => {
    const author = authorOf(comment);
    if (!author) return null;
    const label = agoLabel(comment.at);
    const mine = comment.userId === currentUser.id;
    return (
      <li key={comment.id} className="flex gap-2.5">
        <Link href={userHref(author.id)} className="shrink-0"><Avatar user={author} size="sm" className={nested ? "h-7 w-7" : ""} /></Link>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-surface-2 px-3 py-2">
            <div className="flex items-baseline gap-2">
              <Link href={userHref(author.id)} className="truncate text-xs font-semibold text-text hover:underline">{author.name}<VerifiedMark userId={author.id} size={12} /></Link>
              <span className="shrink-0 text-[10px] text-muted">{label === "0m" ? t("post.justNow") : relativeTime(label, t)}</span>
            </div>
            <RichText text={comment.text} className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-5 text-text" />
          </div>
          {threads && isRemoteId(comment.id) ? <button type="button" onClick={() => reply(comment, author)} className="ml-3 mt-0.5 text-[11px] font-semibold text-muted hover:text-text">{t("post.reply")}</button> : null}
        </div>
        {mine || canRemoveAll ? <button onClick={() => onRemove(comment.id)} aria-label={t("post.delete")} title={t("post.delete")} className="flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full text-muted hover:bg-surface-2 hover:text-text"><X size={14} /></button> : reportType && isRemoteId(comment.id) ? <button onClick={() => openReport({ type: reportType, id: comment.id })} aria-label={t("report.action")} title={t("report.action")} className="flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full text-muted hover:bg-surface-2 hover:text-danger"><Flag size={13} /></button> : null}
      </li>
    );
  };

  return (
    <div className="border-t border-border px-4 py-3">
      <ul className="space-y-3">
        {roots.map((comment) => {
          const replies = repliesOf(comment.id);
          const shown = open.includes(comment.id) || replies.length <= 2 ? replies : replies.slice(-1);
          return (
            <li key={comment.id}>
              <ul>{row(comment, false)}</ul>
              {replies.length ? (
                <div className="ml-10 mt-2 space-y-2">
                  {shown.length < replies.length ? <button type="button" onClick={() => setOpen((list) => [...list, comment.id])} className="text-[11px] font-semibold text-accent hover:underline">{t("post.showReplies").replace("{n}", String(replies.length - shown.length))}</button> : null}
                  <ul className="space-y-2">{shown.map((item) => row(item, true))}</ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {replyTo ? (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
          <span className="truncate">{t("post.replyingTo")} <b className="text-text">{replyTo.name}</b></span>
          <button type="button" onClick={() => { setReplyTo(null); setText(""); }} aria-label={t("common.cancel")} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-surface-2"><X size={12} /></button>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
        <Avatar user={user} size="sm" />
        <div className="relative min-w-0 flex-1">
          <input ref={input} value={text} onChange={(event) => { setText(event.target.value); mentions.track(event); }} onSelect={mentions.track} aria-label={t("post.writeComment")} placeholder={t(replyTo ? "post.writeReply" : "post.writeComment")} maxLength={300} autoComplete="off" className="h-10 w-full rounded-full border border-border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
          <MentionList list={mentions.list} onPick={mentions.pick} up />
        </div>
        <button type="submit" disabled={!text.trim()} aria-label={t("messages.send")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-bg disabled:opacity-40"><SendHorizontal size={16} /></button>
      </form>
    </div>
  );
}
