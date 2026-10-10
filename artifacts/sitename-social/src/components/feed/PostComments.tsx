"use client";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Flag, SendHorizontal, X } from "lucide-react";
import { isRemoteId } from "@/lib/remoteProfiles";
import { openReport } from "@/lib/reportsSync";
import type { PostComment } from "@/types";
import { people } from "@/data/friends";
import { currentUser } from "@/data/users";
import { userHref } from "@/lib/links";
import { agoLabel, relativeTime } from "@/lib/utils";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { useProfile } from "@/components/profile/useProfile";

type Props = { comments: PostComment[]; onAdd: (text: string) => void; onRemove: (id: string) => void; reportType?: "comment" | "video_comment" };

export function PostComments({ comments, onAdd, onRemove, reportType }: Props) {
  const { t } = useTranslation();
  const { user } = useProfile();
  const [text, setText] = useState("");
  const authorOf = (id: string) => (id === currentUser.id ? user : people.find((item) => item.user.id === id)?.user);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    onAdd(value);
    setText("");
  }

  return (
    <div className="border-t border-border px-4 py-3">
      <ul className="space-y-3">
        {comments.map((comment) => {
          const author = comment.author ?? authorOf(comment.userId);
          if (!author) return null;
          const label = agoLabel(comment.at);
          return (
            <li key={comment.id} className="flex gap-2.5">
              <Link href={userHref(author.id)} className="shrink-0"><Avatar user={author} size="sm" /></Link>
              <div className="min-w-0 flex-1 rounded-2xl bg-surface-2 px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <Link href={userHref(author.id)} className="truncate text-xs font-semibold text-text hover:underline">{author.name}<VerifiedMark userId={author.id} size={12} /></Link>
                  <span className="shrink-0 text-[10px] text-muted">{label === "0m" ? t("post.justNow") : relativeTime(label, t)}</span>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-5 text-text">{comment.text}</p>
              </div>
              {comment.userId === currentUser.id ? <button onClick={() => onRemove(comment.id)} aria-label={t("post.delete")} title={t("post.delete")} className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full text-muted hover:bg-surface-2 hover:text-text"><X size={14} /></button> : reportType && isRemoteId(comment.id) ? <button onClick={() => openReport({ type: reportType, id: comment.id })} aria-label={t("report.action")} title={t("report.action")} className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full text-muted hover:bg-surface-2 hover:text-danger"><Flag size={13} /></button> : null}
            </li>
          );
        })}
      </ul>
      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <Avatar user={user} size="sm" />
        <input value={text} onChange={(event) => setText(event.target.value)} aria-label={t("post.writeComment")} placeholder={t("post.writeComment")} maxLength={300} autoComplete="off" className="h-10 min-w-0 flex-1 rounded-full border border-border bg-surface-2 px-4 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
        <button type="submit" disabled={!text.trim()} aria-label={t("messages.send")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-bg disabled:opacity-40"><SendHorizontal size={16} /></button>
      </form>
    </div>
  );
}
