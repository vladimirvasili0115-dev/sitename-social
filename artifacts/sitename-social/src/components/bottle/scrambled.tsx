"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// Some table pictures (the wood, the carved pattern) are kept on the server cut into squares and shuffled, so the file a
// visitor can save from the network tab is a useless puzzle. Here they are put back together on a canvas (never as a URL).
const SCRAMBLED: Record<string, { grid: number; seed: number }> = {
  "/bottle/table8s.jpg": { grid: 8, seed: 0x7a11e },
  "/bottle/naxis1s.webp": { grid: 8, seed: 0x3a91c },
};

const pathOf = (url: string) => {
  try { return new URL(url, window.location.href).pathname; } catch { return url; }
};

export const isScrambled = (url: string) => pathOf(url) in SCRAMBLED;

// The same shuffle as the script that cut the files (mulberry32 + Fisher-Yates).
function order(n: number, seed: number) {
  let a = seed >>> 0;
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const list = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}

const made = new Map<string, Promise<HTMLCanvasElement | null>>();

export function unscramble(url: string): Promise<HTMLCanvasElement | null> {
  const path = pathOf(url);
  const have = made.get(path);
  if (have) return have;
  const spec = SCRAMBLED[path];
  const job = new Promise<HTMLCanvasElement | null>((done) => {
    if (!spec) return done(null);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight, tw = Math.round(w / spec.grid), th = Math.round(h / spec.grid);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return done(null);
      const map = order(spec.grid * spec.grid, spec.seed);
      map.forEach((to, from) => ctx.drawImage(img, (from % spec.grid) * tw, Math.floor(from / spec.grid) * th, tw, th, (to % spec.grid) * tw, Math.floor(to / spec.grid) * th, tw, th));
      done(canvas);
    };
    img.onerror = () => done(null);
    img.src = url;
  });
  made.set(path, job);
  return job;
}

// A picture drawn from a shuffled file. `cover` fills the box like a CSS background "cover".
export function ScrambledPic({ src, className, style, cover, under }: { src: string; className?: string; style?: CSSProperties; cover?: boolean; under?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    void unscramble(src).then((whole) => {
      const node = ref.current;
      if (!alive || !whole || !node) return;
      node.width = whole.width; node.height = whole.height;
      node.getContext("2d")?.drawImage(whole, 0, 0);
    });
    return () => { alive = false; };
  }, [src]);
  return <canvas ref={ref} aria-hidden="true" data-under={under ? "" : undefined} data-src={src} className={className} style={{ ...(cover ? { objectFit: "cover" } : null), ...style }} onContextMenu={(event) => event.preventDefault()} />;
}
