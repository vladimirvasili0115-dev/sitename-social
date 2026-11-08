"use client";
import { useState, type CSSProperties } from "react";
import { Card } from "@/components/ui/Card";
import { useTranslation } from "@/i18n/useTranslation";
import { StoryItem } from "./StoryItem";
import { StoryViewer } from "./StoryViewer";
import { useStories } from "./useStories";

export function StoriesBar() {
  const { t } = useTranslation();
  const { stories, add, markSeen, markViewed, removeSlide } = useStories();
  const [note, setNote] = useState<"" | "uploading" | "tooLong" | "bad" | "failed">("");
  const [openId, setOpenId] = useState<string | null>(null);
  const openIndex = stories.findIndex((story) => story.id === openId);
  const addStory = (file: File) => { setNote("uploading"); void add(file).then((result) => setNote(result)).catch(() => setNote("failed")); };
  // Same size as before; inside, soft colour glows drift slowly and small hearts float up on both sides (they stand still when the phone asks for less motion).
  return <Card className="relative mb-4 overflow-hidden px-4 pb-3 pt-4">
    <span aria-hidden="true" className="home-anim pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-[#8b5cf6] opacity-20 blur-2xl" style={{ animation: "story-glow 9s ease-in-out infinite" }} />
    <span aria-hidden="true" className="home-anim pointer-events-none absolute -bottom-14 right-0 h-36 w-44 rounded-full bg-[#f4511e] opacity-[0.16] blur-2xl" style={{ animation: "story-glow 11s ease-in-out 2s infinite reverse" }} />
    {[{ side: "left", x: 3, size: 11, delay: 0.6, dur: 6 }, { side: "right", x: 3, size: 13, delay: 2.4, dur: 6.5 }, { side: "right", x: 12, size: 10, delay: 4.2, dur: 5.5 }].map((heart, index) => (
      <span key={index} aria-hidden="true" className="home-anim pointer-events-none absolute bottom-2 text-[#ff8fb1]" style={{ [heart.side]: `${heart.x}%`, fontSize: heart.size, animation: `home-heart ${heart.dur}s ease-in ${heart.delay}s infinite both` } as CSSProperties}>♥</span>
    ))}
    <div className="relative mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">{t("feed.stories")}<span aria-hidden="true" className="home-anim inline-block text-[11px]" style={{ animation: "login-glow 2.6s ease-in-out infinite" }}>✨</span></h2>
      {note ? <span role="status" className={note === "uploading" ? "text-xs text-muted" : "text-xs font-semibold text-danger"}>{t(note === "uploading" ? "story.uploading" : note === "tooLong" ? "story.tooLong" : note === "bad" ? "story.badVideo" : "story.failed")}</span> : null}
    </div>
    <div className="relative flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <StoryItem onAdd={addStory} />
      {stories.map((story) => <StoryItem key={story.id} story={story} onOpen={() => setOpenId(story.id)} />)}
    </div>
    {openIndex >= 0 ? <StoryViewer key={openId} stories={stories} startIndex={openIndex} onSeen={markSeen} onView={markViewed} onDeleteSlide={removeSlide} onClose={() => setOpenId(null)} /> : null}
  </Card>;
}
