"use client";
import { ImageIcon } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

export function AlbumCard({ title, cover, count, onOpen }: { title: string; cover?: string; count: number; onOpen: () => void }) {
  const { t } = useTranslation();
  return (
    <button onClick={onOpen} className="block w-full overflow-hidden rounded-card border border-border bg-surface text-left hover:border-accent">
      <span className="flex aspect-[4/3] items-center justify-center bg-surface-2 text-muted">
        {cover ? <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ImageIcon size={32} strokeWidth={1.5} />}
      </span>
      <span className="block p-3">
        <span className="block truncate text-sm font-semibold text-text">{title}</span>
        <span className="mt-0.5 block text-xs text-muted">{count} {t("photos.count")}</span>
      </span>
    </button>
  );
}
