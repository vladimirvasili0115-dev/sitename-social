"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { SectionCard } from "./SectionCard";

export function ProfilePhotos({ photos, full = false, onSeeAll }: { photos: string[]; full?: boolean; onSeeAll?: () => void }) {
  const { t } = useTranslation();
  const visible = full ? photos : photos.slice(0, 6);
  return (
    <SectionCard title={t("nav.photos")} count={photos.length} onSeeAll={onSeeAll}>
      <ul className={cn("grid gap-1.5", full ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-3")}>
        {visible.map((photo) => (
          <li key={photo} className="aspect-square overflow-hidden rounded-lg bg-surface-2">
            <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
