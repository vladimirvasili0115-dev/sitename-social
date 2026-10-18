"use client";
import { useState } from "react";
import type { Photo } from "@/types";
import { Lightbox } from "@/components/photos/Lightbox";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { SectionCard } from "./SectionCard";

// Profile photos: a tap opens the photo big (like ok.ru), with arrows; on your own profile you can also
// make it your profile picture or delete it there.
type Props = { photos: (string | Photo)[]; full?: boolean; onSeeAll?: () => void; onDelete?: (photo: Photo) => void; onSetAvatar?: (photo: Photo) => void };

export function ProfilePhotos({ photos, full = false, onSeeAll, onDelete, onSetAvatar }: Props) {
  const { t } = useTranslation();
  const [viewing, setViewing] = useState<number | null>(null);
  const items: Photo[] = photos.map((photo, index) => (typeof photo === "string" ? { id: `p-${index}-${photo}`, src: photo, album: "uploads" } : photo));
  const visible = full ? items : items.slice(0, 6);
  return (
    <SectionCard title={t("nav.photos")} count={items.length} onSeeAll={onSeeAll}>
      <ul className={cn("grid gap-1.5", full ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3")}>
        {visible.map((photo, index) => (
          <li key={photo.id} className="aspect-square overflow-hidden rounded-lg bg-surface-2">
            <button type="button" onClick={() => setViewing(index)} aria-label={t("photos.view")} className="block h-full w-full cursor-zoom-in">
              <img src={photo.src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-200 hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>
      {viewing !== null && items.length ? (
        <Lightbox photos={items} index={Math.min(viewing, items.length - 1)} onChange={setViewing} onClose={() => setViewing(null)}
          onDelete={onDelete ? (photo) => { onDelete(photo); if (items.length <= 1) setViewing(null); } : undefined}
          onSetAvatar={onSetAvatar ? (photo) => { onSetAvatar(photo); setViewing(null); } : undefined} />
      ) : null}
    </SectionCard>
  );
}
