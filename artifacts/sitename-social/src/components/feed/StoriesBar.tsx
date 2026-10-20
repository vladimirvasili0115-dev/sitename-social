"use client";
import { useState } from "react";
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
  return <Card className="mb-4 overflow-hidden px-4 pb-3 pt-4">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold">{t("feed.stories")}</h2>
      {note ? <span role="status" className={note === "uploading" ? "text-xs text-muted" : "text-xs font-semibold text-danger"}>{t(note === "uploading" ? "story.uploading" : note === "tooLong" ? "story.tooLong" : note === "bad" ? "story.badVideo" : "story.failed")}</span> : null}
    </div>
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <StoryItem onAdd={addStory} />
      {stories.map((story) => <StoryItem key={story.id} story={story} onOpen={() => setOpenId(story.id)} />)}
    </div>
    {openIndex >= 0 ? <StoryViewer key={openId} stories={stories} startIndex={openIndex} onSeen={markSeen} onView={markViewed} onDeleteSlide={removeSlide} onClose={() => setOpenId(null)} /> : null}
  </Card>;
}
