"use client";
import { useEffect, useRef, useState } from "react";

// An animated picture (WebP) that plays exactly once and then stands still on its last frame, and never plays again.
// The length of one play comes from the file itself (the frame durations); the still picture is the last frame.
type Info = { ms: number; buf: ArrayBuffer } | null;
const infos = new Map<string, Promise<Info>>();
const stills = new Map<string, string>(); // played once already: key -> still picture

function lengthOf(buf: ArrayBuffer): number {
  const view = new DataView(buf);
  if (buf.byteLength < 16 || view.getUint32(0) !== 0x52494646) return 0; // "RIFF"
  let pos = 12, ms = 0, frames = 0;
  while (pos + 8 <= buf.byteLength) {
    const size = view.getUint32(pos + 4, true);
    if (view.getUint32(pos) === 0x414e4d46 && pos + 8 + 15 <= buf.byteLength) { // "ANMF": the duration is 3 bytes after 12 bytes of frame data
      ms += view.getUint8(pos + 20) | (view.getUint8(pos + 21) << 8) | (view.getUint8(pos + 22) << 16);
      frames++;
    }
    pos += 8 + size + (size & 1);
  }
  return frames > 1 ? Math.max(ms, 120) : 0;
}

function infoOf(src: string): Promise<Info> {
  let found = infos.get(src);
  if (!found) {
    found = fetch(src).then((res) => (res.ok ? res.arrayBuffer() : null)).then((buf) => { const ms = buf ? lengthOf(buf) : 0; return buf && ms ? { ms, buf } : null; }).catch(() => null);
    infos.set(src, found);
  }
  return found;
}

type Decoder = { tracks: { ready: Promise<unknown>; selectedTrack?: { frameCount: number } }; decode: (options: { frameIndex: number }) => Promise<{ image: { close: () => void } }> };
async function lastFrame(buf: ArrayBuffer, img: HTMLImageElement | null): Promise<string | null> {
  const canvas = document.createElement("canvas");
  try {
    const Decoder = (window as unknown as { ImageDecoder?: new (init: { data: ArrayBuffer; type: string }) => Decoder }).ImageDecoder;
    if (Decoder) {
      const decoder = new Decoder({ data: buf, type: "image/webp" });
      await decoder.tracks.ready;
      const count = decoder.tracks.selectedTrack?.frameCount ?? 0;
      if (count > 1) {
        const { image } = await decoder.decode({ frameIndex: count - 1 });
        const frame = image as unknown as CanvasImageSource & { displayWidth: number; displayHeight: number };
        canvas.width = frame.displayWidth;
        canvas.height = frame.displayHeight;
        canvas.getContext("2d")?.drawImage(frame, 0, 0);
        image.close();
        return canvas.toDataURL("image/png");
      }
    }
  } catch { /* no decoder in this browser: the frame that is showing now is taken */ }
  try {
    if (!img || !img.naturalWidth) return null;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")?.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch { return null; }
}

export function OnceImg({ src, freezeKey, className }: { src: string; freezeKey: string | number; className?: string }) {
  const key = `${freezeKey}|${src}`;
  const [still, setStill] = useState<string | null>(() => stills.get(key) ?? null);
  const ref = useRef<HTMLImageElement>(null);
  const started = useRef(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function begin() {
    if (started.current || still) return;
    started.current = true;
    void infoOf(src).then((info) => {
      if (!info) return;
      timer.current = window.setTimeout(() => {
        void lastFrame(info.buf, ref.current).then((url) => {
          if (!url) return;
          if (stills.size > 400) stills.delete(stills.keys().next().value as string);
          stills.set(key, url);
          setStill(url);
        });
      }, Math.max(60, info.ms - 40));
    });
  }
  return <img ref={ref} src={still ?? src} onLoad={begin} alt="" aria-hidden="true" draggable={false} className={className} />;
}
