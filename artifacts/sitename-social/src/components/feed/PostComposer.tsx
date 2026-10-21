"use client";
import { useState, type ChangeEvent } from "react";
import { Camera, Clapperboard, Smile, X } from "lucide-react";
import { resizeImage } from "@/lib/profile";
import { useProfile } from "@/components/profile/useProfile";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import { usePosts } from "./usePosts";

const tool = "inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-text";

export function PostComposer({ groupId }: { groupId?: string }) {
  const { t } = useTranslation();
  const { user } = useProfile();
  const { create } = usePosts();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  // A video post: the file stays on the device until "Publish" (shown as a preview), then it is uploaded.
  const [video, setVideo] = useState<{ file: File; url: string } | null>(null);
  const [note, setNote] = useState<"" | "uploading" | "tooBig">("");
  const [failed, setFailed] = useState("");
  const ready = Boolean(text.trim() || image || video) && note !== "uploading";
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
    const sending = create({ text: text.trim(), image: image ?? undefined, groupId, videoFile: video?.file });
    setText("");
    setImage(null);
    if (video) {
      setNote("uploading");
      setFailed("");
      void Promise.resolve(sending).then((result) => { setNote(""); if (typeof result === "string" && result) setFailed(result); else setVideo(null); }).catch(() => setNote(""));
    }
  }

  return <Card className="mb-5 p-4">
    <div className="flex items-start gap-3">
      <Avatar user={user} />
      <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} aria-label={t("feed.composer")} placeholder={t("feed.composer")} rows={2} className="min-h-[58px] flex-1 resize-none rounded-xl border border-transparent bg-surface-2 px-4 py-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
    </div>
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
        <label className={tool}><Camera size={16} className="text-accent" />{t("feed.photo")}<input type="file" accept="image/*" className="sr-only" onChange={handleImage} /></label>
        <label className={tool}><Clapperboard size={16} className="text-[#E53935]" />{t("feed.video")}<input type="file" accept="video/*" className="sr-only" onChange={handleVideo} /></label>
        <EmojiPicker label={t("feed.feeling")} trigger={<><Smile size={16} className="text-accent-2" />{t("feed.feeling")}</>} triggerClassName={tool} onPick={(emoji) => setText((value) => `${value}${value && !value.endsWith(" ") ? " " : ""}${emoji}`)} onMedia={(url) => { setVideo(null); setImage(url); }} />
      </div>
      <Button className="px-4 py-2 text-xs disabled:opacity-40" disabled={!ready} onClick={publish}>{t("feed.publish")}</Button>
    </div>
  </Card>;
}
