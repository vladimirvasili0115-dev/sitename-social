"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

// Gifts lying on the photos (the scattered pile and the corner/random/balloon spots) are painted on ONE canvas over the table,
// so a gift storm does not add hundreds of DOM elements to paint and composite on a phone.
export type SeatPile = { key: number; gift: string; x: number; y: number; r: number; s: number; at: number };
export type SeatSpot = { key: number; gift: string; x: number; y: number; s: number; r?: number; t?: number; kind: string };
export type SeatGiftData = {
  piles: Record<string, SeatPile[]>; spots: Record<string, SeatSpot[]>;
  ids: string[]; seats: readonly (readonly [number, number])[]; box: number;
  cx: number; cy: number; staged: boolean; turn: number | null; target: number | null;
  url: (gift: string) => string | null; pileMs: number; version: number;
  spinning?: boolean; // the bottle spins: the spinner's photo wobbles (seat-wobble 0.4 s) and its gifts must turn with it
};

const images = new Map<string, HTMLImageElement>();
function picture(url: string) {
  let img = images.get(url);
  if (!img) { img = new Image(); img.decoding = "async"; img.src = url; images.set(url, img); }
  return img;
}
const inOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

export function SeatGiftCanvas({ data }: { data: MutableRefObject<SeatGiftData> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current;
    const ctx = node?.getContext("2d");
    if (!node || !ctx) return;
    let raf = 0, w = 0, h = 0, dpr = 1, lastVersion = -1, busyUntil = 0, drawn = false, spinSince = 0;
    const shown = new Map<string, { x: number; y: number; fx: number; fy: number; tx: number; ty: number; t0: number }>();
    const fit = () => {
      const rect = node.parentElement?.getBoundingClientRect();
      if (!rect) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width; h = rect.height;
      node.width = Math.round(w * dpr); node.height = Math.round(h * dpr);
      busyUntil = performance.now() + 100;
    };
    fit();
    const watch = new ResizeObserver(fit);
    if (node.parentElement) watch.observe(node.parentElement);
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const d = data.current;
      const now = performance.now();
      const wall = Date.now();
      if (d.version !== lastVersion) { lastVersion = d.version; busyUntil = Math.max(busyUntil, now + 1300); }
      if (d.spinning) { if (!spinSince) spinSince = now; } else spinSince = 0;
      const wobbling = spinSince > 0 && now - spinSince < 700; // the wobble is 0.4 s; a little extra so it surely ends at 0 degrees
      if (wobbling) busyUntil = Math.max(busyUntil, now + 50);
      let any = false;
      for (const id of d.ids) if (d.piles[id]?.length || d.spots[id]?.length) { any = true; break; }
      if (!any) { if (drawn) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, node.width, node.height); drawn = false; } return; }
      const young = (at: number, ms: number) => wall - at < ms;
      let animating = now < busyUntil;
      if (!animating) {
        for (const id of d.ids) {
          for (const p of d.piles[id] ?? []) if (young(p.at, 400) || wall - p.at > d.pileMs - 3200) { animating = true; break; }
          if (animating) break;
          for (const s of d.spots[id] ?? []) if (s.t && young(s.t, 800)) { animating = true; break; }
          if (animating) break;
        }
      }
      if (!animating && drawn) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, node.width, node.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawn = true;
      const unit = Math.min(w, h) / 100;
      const side = d.box * unit;
      let waiting = false;
      // The middle of a player's photo (the seat button, data-seat) on this canvas, read from the page while the photo moves.
      let host: { left: number; top: number } | null = null;
      const livePlace = (id: string): [number, number] | null => {
        const parent = node.parentElement;
        if (!parent) return null;
        const el = parent.querySelector(`[data-seat="${CSS.escape(id)}"]`);
        if (!el) return null;
        if (!host) { const box = parent.getBoundingClientRect(); host = { left: box.left + parent.clientLeft, top: box.top + parent.clientTop }; }
        const r = el.getBoundingClientRect();
        if (!r.width) return null;
        return [r.left + r.width / 2 - host.left, r.top + r.height / 2 - host.top];
      };
      d.ids.forEach((id, index) => {
        const piles = d.piles[id] ?? [], spots = d.spots[id] ?? [];
        if (!piles.length && !spots.length) return;
        let tx: number, ty: number;
        if (d.staged && (index === d.turn || index === d.target)) { tx = (d.cx / 100) * w + (index === d.turn ? -12.5 : 12.5) * unit; ty = (d.cy / 100) * h; }
        else { const seat = d.seats[index] ?? [50, 50]; tx = (seat[0] / 100) * w; ty = (seat[1] / 100) * h; }
        let cur = shown.get(id);
        if (!cur) { cur = { x: tx, y: ty, fx: tx, fy: ty, tx, ty, t0: now - 2000 }; shown.set(id, cur); }
        if (Math.abs(cur.tx - tx) > 0.5 || Math.abs(cur.ty - ty) > 0.5) { cur.fx = cur.x; cur.fy = cur.y; cur.tx = tx; cur.ty = ty; cur.t0 = now; }
        // While the photo glides (its CSS move takes 1.1 s), the gifts follow the photo's real place on the screen, so they stay glued to it
        // instead of trailing behind; only when the photo cannot be found they glide on their own.
        const moving = now - cur.t0 < 1300;
        const photo = moving ? livePlace(id) : null;
        if (photo) { cur.x = photo[0]; cur.y = photo[1]; }
        else {
          const k = Math.min(1, (now - cur.t0) / 1100);
          const e = inOut(k);
          cur.x = cur.fx + (cur.tx - cur.fx) * e; cur.y = cur.fy + (cur.ty - cur.fy) * e;
        }
        if (moving) busyUntil = Math.max(busyUntil, now + 50);
        const left = cur.x - side / 2, top = cur.y - side / 2;
        // The spinner's photo wobbles (a CSS rotation around its middle): its gifts take the same live angle, so they stay inside the frame.
        let tilt = 0;
        if (wobbling && index === d.turn) {
          const el = node.parentElement?.querySelector(`[data-seat="${CSS.escape(id)}"]`);
          const m = el ? getComputedStyle(el).transform : "none";
          const parts = m.startsWith("matrix(") ? m.slice(7, -1).split(",").map(Number) : null;
          if (parts && parts.length >= 2) tilt = Math.atan2(parts[1], parts[0]);
        }
        ctx.save();
        if (tilt) { ctx.translate(cur.x, cur.y); ctx.rotate(tilt); ctx.translate(-cur.x, -cur.y); }
        const put = (gift: string, x: number, y: number, s: number, rot: number, alpha: number, scale: number, corner: "l" | "r" | null) => {
          const url = d.url(gift);
          if (!url) return;
          const img = picture(url);
          if (!img.complete) { waiting = true; return; } // still loading: draw again on the next frames until it is there
          if (!img.naturalWidth) return; // a broken picture: skipped for good
          const box = (s / 100) * side;
          const ratio = img.naturalWidth / img.naturalHeight;
          let dw = ratio >= 1 ? box : box * ratio, dh = ratio >= 1 ? box / ratio : box;
          const bx = left + (x / 100) * side, by = top + (y / 100) * side;
          ctx.save();
          ctx.globalAlpha = alpha;
          // pivot: the middle of the box, or its bottom corner for the gifts that grow out of a corner
          const px = corner === "l" ? bx : corner === "r" ? bx + box : bx + box / 2;
          const py = corner ? by + box : by + box / 2;
          ctx.translate(px, py);
          if (rot) ctx.rotate((rot * Math.PI) / 180);
          if (scale !== 1) ctx.scale(scale, scale);
          const ox = bx + (box - dw) / 2 - px, oy = by + (box - dh) / 2 - py;
          const ax = corner === "l" ? bx - px : corner === "r" ? bx + box - dw - px : ox;
          const ay = corner ? by + box - dh - py : oy;
          ctx.drawImage(img, ax, ay, dw, dh);
          ctx.restore();
        };
        for (const p of piles) {
          const age = wall - p.at;
          const scale = age < 350 ? 1.12 - 0.12 * Math.min(1, age / 350) : 1;
          const fade = age > d.pileMs - 3000 ? Math.max(0, 1 - (age - (d.pileMs - 3000)) / 2000) : 1;
          if (fade <= 0) continue;
          put(p.gift, p.x, p.y, p.s, p.r, fade, scale, null);
        }
        for (const s of spots) {
          if (s.kind === "behind") continue;
          const age = s.t ? wall - s.t : 9999;
          const corner = s.x + s.s / 2 < 45 ? "l" : "r";
          const rot = s.kind === "hatL" ? -45 : s.kind === "hatR" ? 45 : s.r ?? 0;
          const grow = s.kind === "balloon" ? (age < 700 ? 0.6 + 0.6 * (age / 700) : 1.2) : age < 350 ? 1.12 - 0.12 * (age / 350) : 1;
          put(s.gift, s.x, s.y, s.s, rot, 1, grow, s.kind === "corner" || s.kind === "balloon" ? corner : null);
        }
        ctx.restore();
      });
      // A gift whose picture was not loaded yet is drawn as soon as it arrives (before, it stayed invisible until something else changed).
      if (waiting) busyUntil = Math.max(busyUntil, now + 100);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); watch.disconnect(); };
  }, [data]);
  // z-30 and placed after the seats: above the raised photos (the spinner z-10, the kissing pair z-30), below the names (z-31) and the kiss arrows/buttons that come later.
  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 h-full w-full" />;
}
