"use client";
import { useState, type ChangeEvent } from "react";
import { Camera, Smile, X } from "lucide-react";
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
  const ready = Boolean(text.trim() || image);

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setImage(await resizeImage(file, 900));
    } catch {
      // Unreadable image: keep the composer as it is.
    }
  }
  function publish() {
    if (!ready) return;
    create({ text: text.trim(), image: image ?? undefined, groupId });
    setText("");
    setImage(null);
  }

  return <Card className="mb-5 p-4">
    <div className="flex items-start gap-3">
      <Avatar user={user} />
      <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} aria-label={t("feed.composer")} placeholder={t("feed.composer")} rows={2} className="min-h-[58px] flex-1 resize-none rounded-xl border border-transparent bg-surface-2 px-4 py-3 text-sm text-text outline-none placeholder:text-muted focus:border-accent" />
    </div>
    {image ? (
      <div className="relative mt-3 overflow-hidden rounded-xl border border-border">
        <img src={image} alt="" className="max-h-[280px] w-full object-cover" />
        <button onClick={() => setImage(null)} aria-label={t("feed.removeImage")} title={t("feed.removeImage")} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-text"><X size={15} /></button>
      </div>
    ) : null}
    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
      <div className="flex gap-1">
        <label className={tool}><Camera size={16} className="text-accent" />{t("feed.photo")}<input type="file" accept="image/*" className="sr-only" onChange={handleImage} /></label>
        <EmojiPicker label={t("feed.feeling")} trigger={<><Smile size={16} className="text-accent-2" />{t("feed.feeling")}</>} triggerClassName={tool} onPick={(emoji) => setText((value) => `${value}${value && !value.endsWith(" ") ? " " : ""}${emoji}`)} />
      </div>
      <Button className="px-4 py-2 text-xs disabled:opacity-40" disabled={!ready} onClick={publish}>{t("feed.publish")}</Button>
    </div>
  </Card>;
}
