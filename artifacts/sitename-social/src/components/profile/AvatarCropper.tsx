"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";

const VIEW = 280; // side of the square the photo is framed in, in CSS pixels
const OUT = 400; // side of the saved picture

// Lets the user frame the new profile photo: drag to move, slide to zoom. The circle shows what others will see.
export function AvatarCropper({ src, onSave, onCancel }: { src: string; onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const picture = new Image();
    picture.onload = () => setImage(picture);
    picture.src = src;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [src, onCancel]);

  // At zoom 1 the photo just covers the square; the offset is clamped so no empty edge can show.
  const base = image ? VIEW / Math.min(image.width, image.height) : 1;
  const width = image ? image.width * base * zoom : VIEW;
  const height = image ? image.height * base * zoom : VIEW;
  const clamp = (value: { x: number; y: number }, w = width, h = height) => ({ x: Math.min(0, Math.max(VIEW - w, value.x)), y: Math.min(0, Math.max(VIEW - h, value.y)) });
  useEffect(() => {
    if (image) setOffset({ x: (VIEW - image.width * base) / 2, y: (VIEW - image.height * base) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  function changeZoom(next: number) {
    if (!image) return;
    // Keep the centre of the frame where it is while zooming.
    const ratio = next / zoom;
    const centre = { x: VIEW / 2 - (VIEW / 2 - offset.x) * ratio, y: VIEW / 2 - (VIEW / 2 - offset.y) * ratio };
    setZoom(next);
    setOffset(clamp(centre, image.width * base * next, image.height * base * next));
  }
  function save() {
    if (!image) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const scale = base * zoom;
    canvas.getContext("2d")?.drawImage(image, -offset.x / scale, -offset.y / scale, VIEW / scale, VIEW / scale, 0, 0, OUT, OUT);
    onSave(canvas.toDataURL("image/jpeg", 0.9));
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(4,8,12,0.8)] p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div role="dialog" aria-modal="true" aria-label={t("profile.cropTitle")} className="relative w-full max-w-[360px] rounded-2xl border border-border bg-surface p-5 text-text shadow-2xl">
        <button onClick={onCancel} aria-label={t("photos.close")} title={t("photos.close")} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"><X size={18} /></button>
        <h2 className="mb-4 text-center text-base font-bold">{t("profile.cropTitle")}</h2>
        <div
          className="relative mx-auto cursor-grab touch-none select-none overflow-hidden rounded-xl bg-black active:cursor-grabbing"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }; }}
          onPointerMove={(event) => { const start = drag.current; if (start) setOffset(clamp({ x: start.ox + event.clientX - start.x, y: start.oy + event.clientY - start.y })); }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          onWheel={(event) => changeZoom(Math.min(3, Math.max(1, zoom - event.deltaY * 0.002)))}
        >
          {image ? <img src={src} alt="" draggable={false} className="pointer-events-none absolute max-w-none" style={{ left: offset.x, top: offset.y, width, height }} /> : null}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(0,0,0,0.55)] ring-2 ring-white/90" />
        </div>
        <label className="mt-4 flex items-center gap-3 text-xs font-semibold text-muted">
          {t("profile.cropZoom")}
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(event) => changeZoom(Number(event.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" />
        </label>
        <p className="mt-2 text-center text-[11px] text-muted">{t("profile.cropHint")}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="h-11 flex-1" onClick={onCancel}>{t("profile.cropCancel")}</Button>
          <Button className="h-11 flex-1" disabled={!image} onClick={save}>{t("profile.save")}</Button>
        </div>
      </div>
    </div>
  );
}
