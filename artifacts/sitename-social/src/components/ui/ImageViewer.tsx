"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";

// Full-screen view of one image. Closes on Escape, on the X button or on a click outside the image.
export function ImageViewer({ src, onClose }: { src: string; onClose: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={t("photos.view")} onClick={onClose} className="fixed inset-0 z-[70] flex items-center justify-center bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] p-3 sm:p-8">
      <img src={src} alt="" onClick={(event) => event.stopPropagation()} className="max-h-full max-w-full rounded-xl object-contain" />
      <button onClick={onClose} aria-label={t("photos.close")} title={t("photos.close")} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text hover:bg-surface-2 sm:right-5 sm:top-5"><X size={18} /></button>
    </div>
  );
}
