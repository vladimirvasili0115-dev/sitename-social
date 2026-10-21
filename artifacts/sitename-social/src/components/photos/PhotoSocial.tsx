"use client";
import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { addPhotoComment, fetchPhotoSocial, removePhotoComment, togglePhotoLike, type PhotoSocial as Social } from "@/lib/photosSync";
import { useTranslation } from "@/i18n/useTranslation";
import { PostComments } from "@/components/feed/PostComments";
import { cn } from "@/lib/utils";

// Likes and comments under a big photo (like VK). Loaded for each photo when it is opened.
export function PhotoSocial({ photoId, own }: { photoId: string; own?: boolean }) {
  const { t } = useTranslation();
  const [social, setSocial] = useState<Social | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    setSocial(null);
    void fetchPhotoSocial(photoId).then((result) => { if (active) setSocial(result); });
    return () => { active = false; };
  }, [photoId]);
  if (!social) return null;
  const reload = () => void fetchPhotoSocial(photoId).then((result) => { if (result) setSocial(result); });
  function like() {
    if (!social) return;
    setSocial({ ...social, liked: !social.liked, likes: social.likes + (social.liked ? -1 : 1) });
    void togglePhotoLike(photoId, social.liked);
  }
  return (
    <div className="mx-auto w-full max-w-[640px] rounded-t-2xl border border-b-0 border-border bg-surface">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={like} aria-pressed={social.liked} className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium hover:bg-surface-2", social.liked ? "text-danger" : "text-muted")}><Heart size={18} fill={social.liked ? "currentColor" : "none"} />{social.likes}</button>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted hover:bg-surface-2"><MessageCircle size={18} />{social.comments.length}<span className="max-sm:hidden">{t("post.comments")}</span></button>
      </div>
      {open ? (
        <div className="max-h-[38vh] overflow-y-auto">
          <PostComments comments={social.comments} canRemoveAll={own} onAdd={(text) => void addPhotoComment(photoId, text).then(reload)} onRemove={(id) => { setSocial({ ...social, comments: social.comments.filter((item) => item.id !== id) }); void removePhotoComment(id); }} />
        </div>
      ) : null}
    </div>
  );
}
