"use client";
import type { ChangeEvent } from "react";
import { Plus } from "lucide-react";
import type { Story } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { useTranslation } from "@/i18n/useTranslation";

const wrap = "group flex w-[68px] shrink-0 cursor-pointer flex-col items-center gap-2 text-center";
const label = "w-full truncate text-[11px] text-muted";

export function StoryItem({ story, onOpen, onAdd }: { story?: Story; onOpen?: () => void; onAdd?: (file: File) => void }) {
  const { t } = useTranslation();
  if (!story) {
    const handle = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) onAdd?.(file);
    };
    return <label className={wrap}>
      <span className="home-anim relative rounded-full bg-surface-2 p-[2px]" style={{ animation: "story-pulse 2.4s ease-in-out infinite" }}>
        <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border-[2px] border-bg bg-surface-2 text-muted transition-colors group-hover:text-accent"><Plus size={21} /></span>
        <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg bg-accent text-bg"><Plus size={12} strokeWidth={3} /></span>
      </span>
      <span className={label}>{t("feed.addStory")}</span>
      <input type="file" accept="image/*,video/*" className="sr-only" aria-label={t("feed.addStory")} onChange={handle} />
    </label>;
  }
  return <button onClick={onOpen} className={wrap}>
    {/* A new story: its colour ring turns slowly behind the photo (same size as before); a seen one has a plain grey ring. */}
    <span className={`relative overflow-hidden rounded-full p-[2px] ${story.seen && !story.mine ? "bg-border" : ""}`}>
      {story.seen && !story.mine ? null : <span aria-hidden="true" className="home-anim absolute rounded-full" style={{ inset: -4, background: "conic-gradient(from 0deg, #ff4d8d, #f4511e, #fbbf24, #14b8a6, #8b5cf6, #ff4d8d)", animation: "story-spin 5s linear infinite" }} />}
      <Avatar user={story.user} className="relative h-[58px] w-[58px] border-[2px] border-bg transition-transform group-hover:scale-[1.03]" />
    </span>
    <span className={label}>{story.mine ? t("story.yours") : story.user.name.split(" ")[0]}</span>
  </button>;
}
