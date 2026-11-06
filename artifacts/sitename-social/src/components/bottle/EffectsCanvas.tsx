"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

// The gift effects over the photos (the fireworks for expensive gifts and the "+N hearts" burst) painted on ONE canvas,
// instead of dozens of animated DOM elements per effect. Only used with the canvas test switch (/bottle/?pixi=1).
// It copies the CSS animations of Fireworks.tsx and HeartBurst (PourTube.tsx) and their keyframes in globals.css
// (fw-rocket, fw-flash, fw-spark, heart-burst, heart-plus): same timings, curves, sizes and colours.
export type EffectsData = {
  shows: { key: number; to: number; level: number }[];
  bursts: { key: number; to: number; amount?: number }[];
  seats: readonly (readonly [number, number])[];
};

const COLORS = ["#FFD84D", "#FF5A7A", "#5BD1FF", "#9BFF6B", "#C38BFF", "#FF9F43", "#FFFFFF"];
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// CSS cubic-bezier timing function.
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, t: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let n = 0; n < 24; n++) { t = (lo + hi) / 2; if (at(x1, x2, t) < x) lo = t; else hi = t; }
    return at(y1, y2, t);
  };
}
const EASE_OUT = bezier(0, 0, 0.58, 1);
const ROCKET = bezier(0.2, 0.7, 0.4, 1);
const SPARK = bezier(0.1, 0.8, 0.3, 1);

// One animated property: its keyframes [offset 0..1, value]; the timing function works inside each segment, like CSS.
function track(frames: [number, number][], ease: (x: number) => number, p: number) {
  if (p <= frames[0][0]) return frames[0][1];
  for (let n = 1; n < frames.length; n++) {
    const [o1, v1] = frames[n];
    const [o0, v0] = frames[n - 1];
    if (p <= o1) return v0 + (v1 - v0) * ease((p - o0) / (o1 - o0));
  }
  return frames[frames.length - 1][1];
}
// Progress of an animation with a delay and fill "both": before it starts it stands on its first frame, after it ends on its last.
const progress = (age: number, delay: number, ms: number) => Math.min(1, Math.max(0, (age - delay) / ms));

const HEART = typeof Path2D === "undefined" ? null : new Path2D("M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z");
function heart(ctx: CanvasRenderingContext2D, size: number) {
  if (!HEART) return;
  ctx.save();
  ctx.translate(-size / 2, -size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.fillStyle = "#E8352B";
  ctx.fill(HEART);
  ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = "#FFFFFF";
  ctx.stroke(HEART);
  ctx.restore();
}

export function EffectsCanvas({ data }: { data: MutableRefObject<EffectsData> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const node = canvas.current;
    const ctx = node?.getContext("2d");
    if (!node || !ctx) return;
    let raf = 0, w = 0, h = 0, dpr = 1, drawn = false;
    const font = getComputedStyle(node).fontFamily || "sans-serif";
    // When each effect appeared (its animation clock starts then, like a freshly mounted DOM element).
    const born = new Map<string, number>();
    const fit = () => {
      const rect = node.parentElement?.getBoundingClientRect();
      if (!rect) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width; h = rect.height;
      node.width = Math.round(w * dpr); node.height = Math.round(h * dpr);
    };
    fit();
    const watch = new ResizeObserver(fit);
    if (node.parentElement) watch.observe(node.parentElement);

    const fireworks = (cx: number, cy: number, level: number, seed: number, age: number, q: number) => {
      const count = [0, 2, 3, 4, 5][Math.max(1, Math.min(4, level))];
      for (let n = 0; n < count; n++) {
        const r = (k: number) => rand(seed * 31 + n * 7 + k);
        const bx = (r(1) - 0.5) * 40 * q, by = (-14 - r(2) * 22) * q;
        const delay = n * 280 + r(3) * 120;
        const color = COLORS[Math.floor(r(4) * COLORS.length)], second = COLORS[Math.floor(r(5) * COLORS.length)];
        const size = 14 + r(6) * 7;
        // rocket: a white dot with a warm glow flies up to the burst point (fw-rocket 480ms)
        const pr = progress(age, delay, 480);
        const ra = track([[0, 1], [0.92, 1], [1, 0]], ROCKET, pr);
        if (ra > 0) {
          const k = ROCKET(pr);
          const x = cx + bx * k + 0.2 * q, y = cy + by * k + 0.2 * q;
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 0.7 * q + 14);
          glow.addColorStop(0, "rgba(255,255,255,1)");
          glow.addColorStop((0.7 * q) / (0.7 * q + 14), "rgba(255,255,255,1)");
          glow.addColorStop(Math.min(0.99, (0.7 * q + 4) / (0.7 * q + 14)), "rgba(255,220,120,0.95)");
          glow.addColorStop(1, "rgba(255,220,120,0)");
          ctx.globalAlpha = ra;
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(x, y, 0.7 * q + 14, 0, Math.PI * 2); ctx.fill();
        }
        // flash: a bright round glow at the burst point (fw-flash 500ms)
        const pf = progress(age, delay + 470, 500);
        const fa = track([[0, 0.95], [1, 0]], EASE_OUT, pf);
        if (fa > 0) {
          const radius = 4.5 * q * track([[0, 0.2], [1, 2.6]], EASE_OUT, pf);
          const g = ctx.createRadialGradient(cx + bx, cy + by, 0, cx + bx, cy + by, radius);
          // CSS radial-gradient(circle) reaches the box corner (radius x 1.41), so its 40% / 70% stops sit at 57% / 99% of the round flash
          g.addColorStop(0, "#FFFFFF"); g.addColorStop(0.566, color); g.addColorStop(0.99, color + "00"); g.addColorStop(1, color + "00");
          ctx.globalAlpha = fa;
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(cx + bx, cy + by, radius, 0, Math.PI * 2); ctx.fill();
        }
        // sparks: 12 small balls fly out in a ring and fall a little (fw-spark 1300ms)
        const ps = progress(age, delay + 470, 1300);
        const sa = track([[0, 1], [0.65, 1], [1, 0]], SPARK, ps);
        if (sa <= 0) continue;
        const move = SPARK(ps);
        const scale = 1.2 + (0.3 - 1.2) * move;
        for (let s = 0; s < 12; s++) {
          const angle = (s / 12) * Math.PI * 2;
          const reach = size * (s % 3 === 0 ? 0.55 : s % 2 ? 0.8 : 1);
          const tint = s % 3 ? color : second;
          const x = cx + bx + 0.15 * q + Math.cos(angle) * reach * q * move;
          const y = cy + by + 0.15 * q + (Math.sin(angle) * reach + 3) * q * move;
          const rad = q * scale;
          const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
          g.addColorStop(0, "#FFFFFF"); g.addColorStop(0.212, "#FFFFFF"); g.addColorStop(0.778, tint); g.addColorStop(1, tint); // 15% / 55% of the corner radius
          ctx.globalAlpha = sa;
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
        }
      }
    };

    const SPREAD: [number, number][] = [[-7, -8], [7, -8], [-10, -1], [10, -1], [-4, -12], [4, -12]];
    const hearts = (cx: number, cy: number, amount: number, age: number, q: number) => {
      // six hearts jump out (heart-burst 1.3s, one after another every 60 ms)
      SPREAD.forEach(([dx, dy], n) => {
        const p = progress(age, n * 60, 1300);
        const alpha = track([[0, 0], [0.2, 1], [1, 0]], EASE_OUT, p);
        if (alpha <= 0) return;
        const k = EASE_OUT(p);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(cx + dx * q * k, cy + dy * q * k);
        const scale = 0.3 + 0.8 * k;
        ctx.scale(scale, scale);
        heart(ctx, 30);
        ctx.restore();
      });
      // "+N ♥" rises above the photo (heart-plus 1.6s)
      const p = progress(age, 0, 1600);
      const alpha = track([[0, 0], [0.2, 1], [0.75, 1], [1, 0]], EASE_OUT, p);
      if (alpha <= 0) return;
      const lift = track([[0, 0], [0.2, -2], [1, -8]], EASE_OUT, p) * q;
      const scale = track([[0, 0.5], [0.2, 1.15], [1, 1]], EASE_OUT, p);
      const fs = 4.6 * q;
      const lineH = Math.max(fs * 1.5, 24);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy - 2 * q + lineH / 2 + lift);
      ctx.scale(scale, scale);
      ctx.font = `900 ${fs}px ${font}`;
      ctx.textBaseline = "middle";
      const text = `+${amount}`;
      const tw = ctx.measureText(text).width;
      const total = tw + 0.4 * q + 24;
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(text, -total / 2, 0);
      ctx.shadowColor = "transparent";
      ctx.translate(-total / 2 + tw + 0.4 * q + 12, 0);
      heart(ctx, 24);
      ctx.restore();
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const d = data.current;
      if (!d.shows.length && !d.bursts.length) {
        if (born.size) born.clear();
        if (drawn) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, node.width, node.height); drawn = false; }
        return;
      }
      const now = performance.now();
      const live = new Set<string>();
      const ageOf = (id: string) => { live.add(id); let t = born.get(id); if (t === undefined) { t = now; born.set(id, t); } return now - t; };
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, node.width, node.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawn = true;
      const q = Math.min(w, h) / 100; // 1cqmin of the table box
      for (const item of d.bursts) {
        const seat = d.seats[item.to];
        if (!seat) continue;
        hearts((seat[0] / 100) * w, (seat[1] / 100) * h, item.amount ?? 1, ageOf(`b${item.key}`), q);
      }
      for (const item of d.shows) {
        const seat = d.seats[item.to];
        if (!seat) continue;
        fireworks((seat[0] / 100) * w, (seat[1] / 100) * h, item.level, item.key, ageOf(`f${item.key}`), q);
      }
      ctx.globalAlpha = 1;
      for (const id of born.keys()) if (!live.has(id)) born.delete(id);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); watch.disconnect(); };
  }, [data]);
  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 h-full w-full" />;
}
