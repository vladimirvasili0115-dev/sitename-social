"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

// All flying gifts are painted on ONE canvas over the table (like the original game, which draws with PIXI):
// hundreds of gifts in the air cost about as much as one, so a big gift storm stays smooth on phones too.
export type CanvasFlight = {
  key: number; url: string; from: number; to: number; t0: number; ms: number;
  tx: number; ty: number; base: number; end: number; rot: number; spin: boolean; fixed?: boolean;
};
export type FlightGeometry = {
  seats: readonly (readonly [number, number])[]; cx: number; cy: number; staged: boolean; turn: number | null; target: number | null;
};

// cubic-bezier(0.3, 0.6, 0.7, 0.9): fast start, the gift is still moving when it lands (same curve the DOM flights use).
function bezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (p: number) => {
    let t = p;
    for (let i = 0; i < 6; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (x(t) - p) / d; t = Math.min(1, Math.max(0, t)); }
    return y(t);
  };
}
const ease = bezier(0.3, 0.6, 0.7, 0.9); // arrives still moving (no slow crawl at the end), then lands
const inOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
// Size along the way: 0.8 → 1.2 in the first 10%, 1.2 until 85%, then to the size it will sit at.
function scaleAt(p: number, end: number) {
  if (p < 0.1) return 0.8 + 0.4 * inOut(p / 0.1);
  if (p < 0.85) return 1.2;
  return 1.2 + (end - 1.2) * inOut((p - 0.85) / 0.15);
}

const images = new Map<string, HTMLImageElement>();
function picture(url: string) {
  let img = images.get(url);
  if (!img) { img = new Image(); img.decoding = "async"; img.src = url; images.set(url, img); }
  return img;
}

export function FlightCanvas({ flights, geometry }: { flights: MutableRefObject<CanvasFlight[]>; geometry: MutableRefObject<FlightGeometry> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    let raf = 0, w = 0, h = 0, dpr = 1;
    const fit = () => {
      const box = node.parentElement?.getBoundingClientRect();
      if (!box) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = box.width; h = box.height;
      node.width = Math.round(w * dpr); node.height = Math.round(h * dpr);
    };
    fit();
    const watch = new ResizeObserver(fit);
    if (node.parentElement) watch.observe(node.parentElement);
    const seatAt = (index: number) => {
      const g = geometry.current;
      const unit = Math.min(w, h) / 100;
      if (g.staged && (index === g.turn || index === g.target)) return [(g.cx / 100) * w + (index === g.turn ? -12.5 : 12.5) * unit, (g.cy / 100) * h] as const;
      const seat = g.seats[index] ?? [50, 50];
      return [(seat[0] / 100) * w, (seat[1] / 100) * h] as const;
    };
    let dirty = false;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const list = flights.current;
      if (!list.length && !dirty) return; // nothing in the air: no work at all
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, node.width, node.height);
      dirty = list.length > 0;
      if (!list.length) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const now = performance.now();
      const unit = Math.min(w, h) / 100;
      for (const item of list) {
        const raw = Math.min(1, Math.max(0, (now - item.t0) / item.ms));
        const p = ease(raw);
        const [sx, sy] = seatAt(item.from);
        const [rx, ry] = seatAt(item.to);
        const ex = rx + item.tx * unit, ey = ry + item.ty * unit;
        const x = sx + (ex - sx) * p, y = sy + (ey - sy) * p;
        const size = item.base * unit * scaleAt(raw, item.end);
        const img = picture(item.url);
        if (!img.complete || !img.naturalWidth) continue;
        const ratio = img.naturalWidth / img.naturalHeight;
        const dw = ratio >= 1 ? size : size * ratio, dh = ratio >= 1 ? size / ratio : size;
        const angle = ((item.spin ? 360 * raw : item.fixed ? item.rot : item.rot * p) * Math.PI) / 180;
        ctx.save();
        ctx.translate(x, y);
        if (angle) ctx.rotate(angle);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); watch.disconnect(); };
  }, [flights, geometry]);
  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 h-full w-full" />;
}
