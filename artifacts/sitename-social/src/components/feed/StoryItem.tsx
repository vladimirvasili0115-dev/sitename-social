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
      <span className="relative rounded-full bg-surface-2 p-[2px]">
        <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full border-[2px] border-bg bg-surface-2 text-muted"><Plus size={21} /></span>
        <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg bg-accent text-bg"><Plus size={12} strokeWidth={3} /></span>
      </span>
      <span className={label}>{t("feed.addStory")}</span>
      <input type="file" accept="image/*,video/*" className="sr-only" aria-label={t("feed.addStory")} onChange={handle} />
    </label>;
  }
  return <button onClick={onOpen} className={wrap}>
    <span className={`relative rounded-full p-[2px] ${story.seen && !story.mine ? "bg-border" : "bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]"}`}>
      <Avatar user={story.user} className="h-[58px] w-[58px] border-[2px] border-bg transition-transform group-hover:scale-[1.03]" />
    </span>
    <span className={label}>{story.mine ? t("story.yours") : story.user.name.split(" ")[0]}</span>
  </button>;
}
