"use client";
import { useState, type ChangeEvent } from "react";
import { BarChart3, Camera, Clapperboard, Plus, Smile, X } from "lucide-react";
import { MentionList, useMentions } from "@/components/ui/Mentions";
import { resizeImage } from "@/lib/profile";
import { useProfile } from "@/components/profile/useProfile";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { usePosts } from "./usePosts";

const tool = "inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-text";

// On someone else's profile (wallOwner) the post is written on their wall.
export function PostComposer({ groupId, wallOwner }: { groupId?: string; wallOwner?: { id: string; name: string } }) {
  const { t } = useTranslation();
  const { user } = useProfile();
  const { create } = usePosts();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  // A video post: the file stays on the device until "Publish" (shown as a preview), then it is uploaded.
  const [video, setVideo] = useState<{ file: File; url: string } | null>(null);
  const [note, setNote] = useState<"" | "uploading" | "tooBig">("");
  const [failed, setFailed] = useState("");
  // A poll: a question and 2-10 answers.
  const [poll, setPoll] = useState<{ question: string; options: string[] } | null>(null);
  const pollOptions = poll ? poll.options.map((item) => item.trim()).filter(Boolean) : [];
  const pollReady = Boolean(poll && poll.question.trim() && pollOptions.length >= 2);
  const mentions = useMentions(text, setText);
  const ready = Boolean(text.trim() || image || video || pollReady) && (!poll || pollReady) && note !== "uploading";
  function handleVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { setNote("tooBig"); return; }
    setNote("");
    setImage(null);
    setVideo((current) => { if (current) URL.revokeObjectURL(current.url); return { file, url: URL.createObjectURL(file) }; });
  }

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setImage(await resizeImage(file, 900));
      setVideo(null);
    } catch {
      // Unreadable image: keep the composer as it is.
    }
  }
  function publish() {
    if (!ready) return;
    const sending = create({ text: text.trim(), image: image ?? undefined, groupId, videoFile: video?.file, wallOwnerId: wallOwner?.id, poll: poll && pollReady ? { question: poll.question.trim(), options: pollOptions } : undefined });
    setText("");
    setImage(null);
    setPoll(null);
    if (!video) void Promise.resolve(sending).then((result) => { if (typeof result === "string" && result && !result.includes("privacy_")) setFailed(result); else setFailed(""); });
    if (video) {
      setNote("uploading");
      setFailed("");
      void Promise.resolve(sending).then((result) => { setNote(""); if (typeof result === "string" && result) setFailed(result); else setVideo(null); }).catch(() => setNote(""));
    }
  }

  return <Card className="mb-5 p-4">
    <div className="flex items-start gap-3">
      <Avatar user={user} />
      <div className="relative flex-1">
        <textarea value={text} onChange={(event) => { setText(event.target.value); mentions.track(event); }} onSelect={mentions.track} maxLength={1000} aria-label={t("feed.composer")} placeholder={wallOwner ? t("feed.wallComposer").replace("{name}", wallOwner.name.split(" ")[0]) : t("feed.composer")} rows={2} className="min-h-[58px] w-full resize-none rounded-xl border border-transparent bg-surface-2 px-4 py-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
        <MentionList list={mentions.list} onPick={mentions.pick} />
      </div>
    </div>
    {poll ? (
      <div className="mt-3 space-y-2 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <input value={poll.question} onChange={(event) => setPoll({ ...poll, question: event.target.value })} maxLength={200} placeholder={t("poll.question")} aria-label={t("poll.question")} className="h-10 min-w-0 flex-1 rounded-lg bg-surface-2 px-3 text-sm font-semibold text-text outline-none placeholder:text-muted focus:ring-1 focus:ring-accent" />
          <button type="button" onClick={() => setPoll(null)} aria-label={t("poll.remove")} title={t("poll.remove")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"><X size={15} /></button>
        </div>
        {poll.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input value={option} onChange={(event) => setPoll({ ...poll, options: poll.options.map((item, at) => (at === index ? event.target.value : item)) })} maxLength={100} placeholder={`${t("poll.option")} ${index + 1}`} aria-label={`${t("poll.option")} ${index + 1}`} className="h-9 min-w-0 flex-1 rounded-lg bg-surface-2 px-3 text-sm text-text outline-none placeholder:text-muted focus:ring-1 focus:ring-accent" />
            {poll.options.length > 2 ? <button type="button" onClick={() => setPoll({ ...poll, options: poll.options.filter((_, at) => at !== index) })} aria-label={t("poll.remove")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2"><X size={13} /></button> : null}
          </div>
        ))}
        {poll.options.length < 10 ? <button type="button" onClick={() => setPoll({ ...poll, options: [...poll.options, ""] })} className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"><Plus size={14} />{t("poll.addOption")}</button> : null}
      </div>
    ) : null}
    {image ? (
      <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
        <img src={image} alt="" className={image.startsWith("data:") ? "max-h-[280px] w-full object-cover" : "mx-auto max-h-[180px] w-auto object-contain py-2" /* a sticker or GIF keeps its own size */} />
        <button onClick={() => setImage(null)} aria-label={t("feed.removeImage")} title={t("feed.removeImage")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-text"><X size={15} /></button>
      </div>
    ) : null}
    {video ? (
      <div className="relative mt-3 overflow-hidden rounded-xl border border-border bg-black">
        <video src={video.url} controls playsInline className="max-h-[320px] w-full" />
        {note === "uploading" ? null : <button onClick={() => setVideo(null)} aria-label={t("feed.removeImage")} title={t("feed.removeImage")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-text"><X size={15} /></button>}
      </div>
    ) : null}
    {failed ? <p role="alert" className="mt-2 break-words text-xs font-semibold text-danger">{t("story.failed")}: {failed}</p> : null}
    {note ? <p role="status" className={note === "uploading" ? "mt-2 text-xs text-muted" : "mt-2 text-xs font-semibold text-danger"}>{t(note === "uploading" ? "story.uploading" : "feed.videoTooBig")}</p> : null}
    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
      <div className="flex gap-1">
        <label className={tool}><Camera size={16} className="text-accent" /><span className="max-sm:hidden">{t("feed.photo")}</span><input type="file" accept="image/*" className="sr-only" onChange={handleImage} /></label>
        <label className={tool}><Clapperboard size={16} className="text-[#E53935]" /><span className="max-sm:hidden">{t("feed.video")}</span><input type="file" accept="video/*" className="sr-only" onChange={handleVideo} /></label>
        {groupId ? null : <button type="button" onClick={() => setPoll((current) => (current ? null : { question: "", options: ["", ""] }))} aria-pressed={Boolean(poll)} className={tool}><BarChart3 size={16} className="text-[#F59E0B]" /><span className="max-sm:hidden">{t("poll.create")}</span></button>}
        <EmojiPicker label={t("feed.feeling")} trigger={<><Smile size={16} className="text-accent-2" /><span className="max-sm:hidden">{t("feed.feeling")}</span></>} triggerClassName={tool} onPick={(emoji) => setText((value) => `${value}${value && !value.endsWith(" ") ? " " : ""}${emoji}`)} onMedia={(url) => { setVideo(null); setImage(url); }} />
      </div>
      <Button className="px-4 py-2 text-xs disabled:opacity-40" disabled={!ready} onClick={publish}>{t("feed.publish")}</Button>
    </div>
  </Card>;
}
