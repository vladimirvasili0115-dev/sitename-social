"use client";
import { useState } from "react";
import { Check, Heart, MessageCircle, Send } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

type Props = { liked: boolean; commentCount: number; shareText: string; onLike: () => void; onComment: () => void };
const base = "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors hover:bg-surface-2";

export function PostActions({ liked, commentCount, shareText, onLike, onComment }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  async function share() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked by the browser: nothing to copy.
    }
  }
  return (
    <div className="flex items-center gap-1 border-t border-border px-4 py-2">
      <button onClick={onLike} aria-pressed={liked} className={cn(base, liked ? "text-danger" : "text-muted hover:text-text")}><Heart size={17} fill={liked ? "currentColor" : "none"} />{t(liked ? "post.liked" : "post.like")}</button>
      <button onClick={onComment} className={cn(base, "text-muted hover:text-text")}><MessageCircle size={17} />{commentCount} {t("post.comment")}</button>
      <button onClick={share} className={cn(base, copied ? "text-accent" : "text-muted hover:text-text")}>{copied ? <Check size={16} /> : <Send size={16} />}{t(copied ? "post.copied" : "post.share")}</button>
    </div>
  );
}
