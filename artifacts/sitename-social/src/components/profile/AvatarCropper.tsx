"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";


// Lets the user frame a new picture: drag to move, slide to zoom.
// "avatar" is a square with a circle showing what others will see; "cover" is the wide strip on top of the profile.
export function AvatarCropper({ src, kind = "avatar", onSave, onCancel }: { src: string; kind?: "avatar" | "cover"; onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const [VIEW_W, VIEW_H, OUT_W, OUT_H] = kind === "cover" ? [312, 104, 1500, 500] : [280, 280, 400, 400];
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
  const base = image ? Math.max(VIEW_W / image.width, VIEW_H / image.height) : 1;
  const width = image ? image.width * base * zoom : VIEW_W;
  const height = image ? image.height * base * zoom : VIEW_H;
  const clamp = (value: { x: number; y: number }, w = width, h = height) => ({ x: Math.min(0, Math.max(VIEW_W - w, value.x)), y: Math.min(0, Math.max(VIEW_H - h, value.y)) });
  useEffect(() => {
    if (image) setOffset({ x: (VIEW_W - image.width * base) / 2, y: (VIEW_H - image.height * base) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  function changeZoom(next: number) {
    if (!image) return;
    // Keep the centre of the frame where it is while zooming.
    const ratio = next / zoom;
    const centre = { x: VIEW_W / 2 - (VIEW_W / 2 - offset.x) * ratio, y: VIEW_H / 2 - (VIEW_H / 2 - offset.y) * ratio };
    setZoom(next);
    setOffset(clamp(centre, image.width * base * next, image.height * base * next));
  }
  function save() {
    if (!image) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const scale = base * zoom;
    canvas.getContext("2d")?.drawImage(image, -offset.x / scale, -offset.y / scale, VIEW_W / scale, VIEW_H / scale, 0, 0, OUT_W, OUT_H);
    onSave(canvas.toDataURL("image/jpeg", 0.9));
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(4,8,12,0.8)] p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div role="dialog" aria-modal="true" aria-label={t(kind === "cover" ? "profile.cropCover" : "profile.cropTitle")} className="relative w-full max-w-[360px] rounded-2xl border border-border bg-surface p-5 text-text shadow-2xl">
        <button onClick={onCancel} aria-label={t("photos.close")} title={t("photos.close")} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"><X size={18} /></button>
        <h2 className="mb-4 text-center text-base font-bold">{t(kind === "cover" ? "profile.cropCover" : "profile.cropTitle")}</h2>
        <div
          className="relative mx-auto cursor-grab touch-none select-none overflow-hidden rounded-xl bg-black active:cursor-grabbing"
          style={{ width: VIEW_W, height: VIEW_H }}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }; }}
          onPointerMove={(event) => { const start = drag.current; if (start) setOffset(clamp({ x: start.ox + event.clientX - start.x, y: start.oy + event.clientY - start.y })); }}
          onPointerUp={() => { drag.current = null; }}
          onPointerCancel={() => { drag.current = null; }}
          onWheel={(event) => changeZoom(Math.min(3, Math.max(1, zoom - event.deltaY * 0.002)))}
        >
          {image ? <img src={src} alt="" draggable={false} className="pointer-events-none absolute max-w-none" style={{ left: offset.x, top: offset.y, width, height }} /> : null}
          {kind === "avatar" ? <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(0,0,0,0.55)] ring-2 ring-white/90" /> : <span aria-hidden="true" className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-white/90" />}
        </div>
        <label className="mt-4 flex items-center gap-3 text-xs font-semibold text-muted">
          {t("profile.cropZoom")}
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(event) => changeZoom(Number(event.target.value))} className="min-w-0 flex-1 accent-[var(--accent)]" />
        </label>
        <p className="mt-2 text-center text-[11px] text-muted">{t(kind === "cover" ? "profile.cropHintCover" : "profile.cropHint")}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="h-11 flex-1" onClick={onCancel}>{t("profile.cropCancel")}</Button>
          <Button className="h-11 flex-1" disabled={!image} onClick={save}>{t("profile.save")}</Button>
        </div>
      </div>
    </div>
  );
}
