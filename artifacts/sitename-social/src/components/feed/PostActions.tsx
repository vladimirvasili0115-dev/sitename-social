"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, MessageCircle, Repeat2, Send } from "lucide-react";
import { REACTIONS } from "@/lib/postsSync";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

// Like (a tap) or a reaction (hold the button, or hover it on a computer: ❤️ 😂 😮 😢 😡), comment, repost, share.
type Props = { reaction?: string; commentCount: number; shareText: string; onReact: (reaction: string) => void; onComment: () => void; onRepost?: () => void };
const base = "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors hover:bg-surface-2";
export const reactionNames: Record<string, TranslationKey> = { "❤️": "react.love", "😂": "react.haha", "😮": "react.wow", "😢": "react.sad", "😡": "react.angry" };

export function PostActions({ reaction, commentCount, shareText, onReact, onComment, onRepost }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [picking, setPicking] = useState(false);
  const holdTimer = useRef(0);
  const held = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!picking) return;
    const away = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setPicking(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [picking]);
  async function share() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked by the browser: nothing to copy.
    }
  }
  const startHold = (delay: number) => { window.clearTimeout(holdTimer.current); held.current = false; holdTimer.current = window.setTimeout(() => { held.current = true; setPicking(true); }, delay); };
  const stopHold = () => window.clearTimeout(holdTimer.current);
  const pick = (emoji: string) => { setPicking(false); onReact(emoji); };
  return (
    <div className="flex items-center gap-1 border-t border-border px-2 py-2 sm:px-4">
      <div ref={box} className="relative flex flex-1" onMouseLeave={() => { stopHold(); }}>
        {picking ? (
          <div role="menu" aria-label={t("react.pick")} className="absolute bottom-full left-0 z-20 mb-1 flex gap-0.5 rounded-full border border-border bg-surface px-1.5 py-1 shadow-xl">
            {REACTIONS.map((emoji) => (
              <button key={emoji} type="button" role="menuitem" onClick={() => pick(emoji)} aria-label={t(reactionNames[emoji])} title={t(reactionNames[emoji])} className={cn("flex h-10 w-10 items-center justify-center rounded-full text-[26px] transition-transform hover:scale-125", reaction === emoji && "bg-surface-2")}>{emoji}</button>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onPointerEnter={(event) => { if (event.pointerType === "mouse") startHold(550); }}
          onPointerDown={(event) => { if (event.pointerType !== "mouse") startHold(420); }}
          onPointerUp={stopHold}
          onPointerCancel={stopHold}
          onContextMenu={(event) => event.preventDefault()}
          onClick={() => { if (held.current) { held.current = false; return; } stopHold(); setPicking(false); onReact(reaction ?? "❤️"); }}
          aria-pressed={Boolean(reaction)}
          className={cn(base, "select-none [-webkit-touch-callout:none]", reaction ? (reaction === "❤️" ? "text-danger" : "text-[#F59E0B]") : "text-muted hover:text-text")}
        >
          {reaction && reaction !== "❤️" ? <span className="text-[17px] leading-none">{reaction}</span> : <Heart size={17} fill={reaction ? "currentColor" : "none"} />}
          <span className="max-sm:hidden">{reaction ? t(reactionNames[reaction] ?? "post.liked") : t("post.like")}</span>
        </button>
      </div>
      <button onClick={onComment} className={cn(base, "text-muted hover:text-text")}><MessageCircle size={17} />{commentCount}<span className="max-sm:hidden"> {t("post.comment")}</span></button>
      {onRepost ? <button onClick={onRepost} className={cn(base, "text-muted hover:text-text")}><Repeat2 size={17} /><span className="max-sm:hidden">{t("post.repost")}</span></button> : null}
      <button onClick={share} className={cn(base, copied ? "text-accent" : "text-muted hover:text-text")}>{copied ? <Check size={16} /> : <Send size={16} />}<span className="max-sm:hidden">{t(copied ? "post.copied" : "post.share")}</span></button>
    </div>
  );
}
