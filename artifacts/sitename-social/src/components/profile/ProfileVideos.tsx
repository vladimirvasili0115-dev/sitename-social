"use client";
import { Play } from "lucide-react";
import type { Post } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { reels } from "@/components/reels/reelsStore";
import { SectionCard } from "./SectionCard";

// The videos someone posted, side by side like the photos; a tap opens them full screen (swipe for the next one).
export function ProfileVideos({ videos, full = false, onSeeAll }: { videos: Post[]; full?: boolean; onSeeAll?: () => void }) {
  const { t } = useTranslation();
  if (!videos.length && !full) return null;
  const visible = full ? videos : videos.slice(0, 6);
  return (
    <SectionCard title={t("nav.videos")} count={videos.length} onSeeAll={onSeeAll}>
      {visible.length ? (
        <ul className={cn("grid gap-1.5", full ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3")}>
          {visible.map((post) => (
            <li key={post.id}>
              <button type="button" onClick={() => reels.open(post.id)} aria-label={t("feed.video")} className="relative block aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
                <video src={`${post.video}#t=0.5`} muted playsInline preload="metadata" className="pointer-events-none h-full w-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white"><Play size={12} fill="currentColor" /></span>
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="py-6 text-center text-sm text-muted">{t("profile.noVideos")}</p>}
    </SectionCard>
  );
}
