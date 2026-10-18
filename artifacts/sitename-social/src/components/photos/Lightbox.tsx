"use client";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Trash2, UserRound, X } from "lucide-react";
import type { Photo } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";

type Props = { photos: Photo[]; index: number; onChange: (index: number) => void; onClose: () => void; onDelete?: (photo: Photo) => void; onSetAvatar?: (photo: Photo) => void };
const control = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-surface-2";

export function Lightbox({ photos, index, onChange, onClose, onDelete, onSetAvatar }: Props) {
  const { t } = useTranslation();
  const photo = photos[index];
  const total = photos.length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onChange((index - 1 + total) % total);
      if (event.key === "ArrowRight") onChange((index + 1) % total);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, total, onChange, onClose]);

  if (!photo) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={`${index + 1} / ${total}`} className="fixed inset-0 z-50 flex flex-col bg-[color-mix(in_srgb,var(--bg)_96%,transparent)]">
      <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
        <span className="px-2 text-sm tabular-nums text-muted">{index + 1} / {total}</span>
        <div className="flex gap-2">
          {photo.own && onSetAvatar ? <button onClick={() => onSetAvatar(photo)} aria-label={t("photos.setAvatar")} title={t("photos.setAvatar")} className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-text hover:bg-surface-2"><UserRound size={17} /><span className="max-sm:hidden">{t("photos.setAvatar")}</span></button> : null}
          {photo.own && onDelete ? <button onClick={() => onDelete(photo)} aria-label={t("photos.delete")} title={t("photos.delete")} className={control}><Trash2 size={17} /></button> : null}
          <button onClick={onClose} aria-label={t("photos.close")} title={t("photos.close")} className={control}><X size={18} /></button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center gap-2 px-2 pb-4 sm:gap-4 sm:px-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <button onClick={() => onChange((index - 1 + total) % total)} aria-label={t("photos.prev")} className={control}><ChevronLeft size={20} /></button>
        <div className="flex h-full min-w-0 flex-1 items-center justify-center">
          <img src={photo.src} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
        <button onClick={() => onChange((index + 1) % total)} aria-label={t("photos.next")} className={control}><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}
