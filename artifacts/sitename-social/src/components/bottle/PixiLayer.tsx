"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import type { CanvasFlight, FlightGeometry } from "./FlightCanvas";
import type { SeatGiftData } from "./SeatGiftCanvas";

// Test (owner and moderators only for now): ONE PixiJS (WebGL) layer over the table paints the flying gifts, the gifts lying
// on the photos and the fireworks / heart bursts. It replaces FlightCanvas, SeatGiftCanvas and the DOM Fireworks / HeartBurst.
// It sits above the seats (also the two players in the middle), so the gifts on the photos are never hidden.
// It only draws a frame while something moves; when the table is still it costs nothing.

export type PixiFx = {
  shows: { key: number; to: number; level: number }[];
  bursts: { key: number; to: number; amount?: number }[];
  seats: readonly (readonly [number, number])[];
  // the whole-table shower (petals, confetti…) and the kiss-fire / slap booster over the pair in the middle
  shower?: { key: number; emoji: string[] } | null;
  boost?: { key: number; kind: string; fromLeft: boolean } | null;
  cx?: number; cy?: number;
};
// CSS-like keyframes: [time 0..1, value] stops, each part eased out (like `ease-out` per keyframe interval).
function kf(p: number, stops: [number, number][]) {
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [t1, v1] = stops[i];
    const [t0, v0] = stops[i - 1];
    if (p <= t1) { const q = t1 > t0 ? (p - t0) / (t1 - t0) : 1; return v0 + (v1 - v0) * (1 - (1 - q) ** 2); }
  }
  return stops[stops.length - 1][1];
}
const SHOWER_SECONDS = 10;

// --- curves (the same ones the canvas / CSS versions use) ---
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
const flightEase = bezier(0.3, 0.6, 0.7, 0.9);
const rocketEase = bezier(0.2, 0.7, 0.4, 1);
const sparkEase = bezier(0.1, 0.8, 0.3, 1);
const inOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const easeOut = (p: number) => 1 - (1 - p) ** 2;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
function scaleAt(p: number, end: number) {
  if (p < 0.1) return 0.8 + 0.4 * inOut(p / 0.1);
  if (p < 0.85) return 1.2;
  return 1.2 + (end - 1.2) * inOut((p - 0.85) / 0.15);
}
// Same random numbers as Fireworks.tsx, so the show looks the same on every screen.
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
const FW_COLORS = ["#FFD84D", "#FF5A7A", "#5BD1FF", "#9BFF6B", "#C38BFF", "#FF9F43", "#FFFFFF"];
const hex = (c: string) => parseInt(c.slice(1), 16);
const HEART_SPREAD: [number, number][] = [[-7, -8], [7, -8], [-10, -1], [10, -1], [-4, -12], [4, -12]];

export function PixiLayer({ flights, geometry, seatData, fx }: {
  flights: MutableRefObject<CanvasFlight[]>;
  geometry: MutableRefObject<FlightGeometry>;
  seatData: MutableRefObject<SeatGiftData>;
  fx: MutableRefObject<PixiFx>;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let dead = false;
    let stop = () => {};
    void (async () => {
      const PIXI = await import("pixi.js");
      const node = host.current;
      if (dead || !node) return;
      const app = new PIXI.Application();
      try {
        await app.init({ backgroundAlpha: 0, antialias: true, autoStart: false, autoDensity: true, resolution: Math.min(2, window.devicePixelRatio || 1), resizeTo: node, preference: "webgl", powerPreference: "low-power" });
      } catch (error) {
        console.error("[pixi] init failed", error);
        return;
      }
      if (dead) { app.destroy(true, { children: true }); return; }
      app.ticker.stop();
      const view = app.canvas as HTMLCanvasElement;
      view.style.position = "absolute"; view.style.inset = "0"; view.style.width = "100%"; view.style.height = "100%"; view.style.pointerEvents = "none";
      node.appendChild(view);
      console.info("[pixi] on", app.renderer.name);

      const seatLayer = new PIXI.Container(); seatLayer.sortableChildren = true;
      const flightLayer = new PIXI.Container();
      const fxLayer = new PIXI.Container();
      app.stage.addChild(seatLayer, flightLayer, fxLayer);

      // Pictures: loaded once as <img>, turned into textures when ready (an animated webp shows its first frame, like the canvas version).
      const textures = new Map<string, import("pixi.js").Texture | null>();
      const texture = (url: string) => {
        const have = textures.get(url);
        if (have !== undefined) return have;
        textures.set(url, null);
        const img = new Image(); img.decoding = "async"; img.crossOrigin = "anonymous";
        img.onload = () => { if (!dead) { textures.set(url, PIXI.Texture.from(img)); dirtyUntil = performance.now() + 50; } };
        img.src = url;
        return null;
      };
      // A small heart picture for the heart bursts.
      const heartGfx = new PIXI.Graphics()
        .moveTo(15, 27).bezierCurveTo(4, 19, 0, 13, 0, 8.5).bezierCurveTo(0, 3.5, 4, 0, 8.3, 0).bezierCurveTo(11.2, 0, 13.6, 1.6, 15, 4)
        .bezierCurveTo(16.4, 1.6, 18.8, 0, 21.7, 0).bezierCurveTo(26, 0, 30, 3.5, 30, 8.5).bezierCurveTo(30, 13, 26, 19, 15, 27).closePath()
        .fill(0xE8352B).stroke({ width: 2, color: 0xFFFFFF });
      const heartTex = app.renderer.generateTexture({ target: heartGfx, resolution: 2 });
      heartGfx.destroy();

      const flightSprites = new Map<number, import("pixi.js").Sprite>();
      const seatSprites = new Map<string, import("pixi.js").Sprite>();
      type Show = { t0: number; g: import("pixi.js").Graphics; end: number };
      type Burst = { t0: number; c: import("pixi.js").Container; hearts: import("pixi.js").Sprite[]; plus: import("pixi.js").Container };
      const shows = new Map<number, Show>();
      const bursts = new Map<number, Burst>();
      let lastVersion = -1, busyUntil = 0, dirtyUntil = 0, drewSeats = false, w = 0, h = 0, raf = 0;

      const sprite = (map: Map<string | number, import("pixi.js").Sprite>, key: string | number, layer: import("pixi.js").Container, tex: import("pixi.js").Texture) => {
        let s = map.get(key);
        if (!s) { s = new PIXI.Sprite(tex); map.set(key, s); layer.addChild(s); }
        else if (s.texture !== tex) s.texture = tex;
        s.visible = true;
        return s;
      };
      const sweep = (map: Map<string | number, import("pixi.js").Sprite>, seen: Set<string | number>) => {
        for (const [key, s] of map) if (!seen.has(key)) { s.destroy(); map.delete(key); }
      };

      // Where each photo REALLY is on the screen right now (its centre and side, in px of this layer).
      // The photos move with CSS (to the middle for the kiss and back, the wobble while spinning); reading their box every
      // frame keeps the gifts glued to the frame: they never lag behind or run ahead, whatever the curve or the frame rate.
      const seatEls = new Map<string, HTMLElement>();
      const seatBox = new Map<string, { x: number; y: number; side: number }>();
      let measuredAt = -1, seatsMoving = false;
      const measure = (now: number) => {
        if (measuredAt === now) return;
        measuredAt = now;
        seatsMoving = false;
        const root = node.parentElement;
        if (!root) return;
        const base = node.getBoundingClientRect();
        const ids = seatData.current.ids;
        for (const id of ids) {
          let el = seatEls.get(id);
          if (!el || !el.isConnected) {
            el = root.querySelector<HTMLElement>(`[data-seat="${CSS.escape(id)}"]`) ?? undefined;
            if (el) seatEls.set(id, el); else { seatEls.delete(id); seatBox.delete(id); continue; }
          }
          const r = el.getBoundingClientRect();
          const next = { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top, side: r.width };
          const prev = seatBox.get(id);
          if (!prev || Math.abs(prev.x - next.x) > 0.2 || Math.abs(prev.y - next.y) > 0.2 || Math.abs(prev.side - next.side) > 0.2) seatsMoving = true;
          seatBox.set(id, next);
        }
        for (const id of [...seatBox.keys()]) if (!ids.includes(id)) { seatBox.delete(id); seatEls.delete(id); }
      };
      // Fallback (photo not in the page yet): the position worked out from the seat numbers, as before.
      const seatAt = (index: number, unit: number) => {
        const id = seatData.current.ids[index];
        const box = id ? seatBox.get(id) : undefined;
        if (box) return [box.x, box.y] as const;
        const g = geometry.current;
        if (g.staged && (index === g.turn || index === g.target)) return [(g.cx / 100) * w + (index === g.turn ? -12.5 : 12.5) * unit, (g.cy / 100) * h] as const;
        const seat = g.seats[index] ?? [50, 50];
        return [(seat[0] / 100) * w, (seat[1] / 100) * h] as const;
      };

      const drawFlights = (now: number, unit: number) => {
        const list = flights.current;
        const seen = new Set<number>();
        for (const item of list) {
          const tex = texture(item.url);
          if (!tex) continue;
          const raw = clamp01((now - item.t0) / item.ms);
          const p = flightEase(raw);
          const [sx, sy] = seatAt(item.from, unit);
          const [rx, ry] = seatAt(item.to, unit);
          const ex = rx + item.tx * unit, ey = ry + item.ty * unit;
          const size = item.base * unit * (item.steady ? 1 : scaleAt(raw, item.end)); // corner gifts: one size the whole way
          const ratio = tex.width / tex.height;
          const dw = ratio >= 1 ? size : size * ratio, dh = ratio >= 1 ? size / ratio : size;
          const s = sprite(flightSprites as Map<string | number, import("pixi.js").Sprite>, item.key, flightLayer, tex);
          seen.add(item.key);
          s.anchor.set(0.5);
          s.position.set(sx + (ex - sx) * p, sy + (ey - sy) * p);
          s.width = dw; s.height = dh;
          s.rotation = ((item.spin ? 360 * raw : item.fixed ? item.rot : item.rot * p) * Math.PI) / 180;
        }
        sweep(flightSprites as Map<string | number, import("pixi.js").Sprite>, seen);
        return list.length > 0;
      };

      // Returns true while the gifts on the photos still move (so the next frame must be drawn too).
      const drawSeats = (now: number, unit: number, force: boolean) => {
        const d = seatData.current;
        const wall = Date.now();
        if (d.version !== lastVersion) { lastVersion = d.version; busyUntil = Math.max(busyUntil, now + 1300); }
        let any = false;
        for (const id of d.ids) if (d.piles[id]?.length || d.spots[id]?.length) { any = true; break; }
        if (!any) { if (drewSeats) { sweep(seatSprites as Map<string | number, import("pixi.js").Sprite>, new Set()); drewSeats = false; return true; } return false; }
        const young = (at: number, ms: number) => wall - at < ms;
        let animating = now < busyUntil || force || seatsMoving;
        if (!animating) {
          for (const id of d.ids) {
            for (const p of d.piles[id] ?? []) if (young(p.at, 400) || wall - p.at > d.pileMs - 3200) { animating = true; break; }
            if (animating) break;
            for (const s of d.spots[id] ?? []) if ((s.t && young(s.t, 800)) || (s.leaveAt && wall > s.leaveAt - 50 && wall < s.leaveAt + 1000)) { animating = true; break; }
            if (animating) break;
          }
        }
        if (!animating && drewSeats) return false;
        drewSeats = true;
        const seen = new Set<string>();
        let z = 0;
        d.ids.forEach((id, index) => {
          const piles = d.piles[id] ?? [], spots = d.spots[id] ?? [];
          if (!piles.length && !spots.length) return;
          // The photo box as it is on the screen this very frame (fallback: worked out from the seat numbers).
          const box = seatBox.get(id);
          const [cx, cy] = box ? [box.x, box.y] : seatAt(index, unit);
          const side = box ? box.side : d.box * unit;
          const left = cx - side / 2, top = cy - side / 2;
          const put = (key: string, gift: string, x: number, y: number, size: number, rot: number, alpha: number, scale: number, corner: "l" | "r" | null) => {
            const url = d.url(gift);
            if (!url) return;
            const tex = texture(url);
            if (!tex) return;
            const box = (size / 100) * side;
            const ratio = tex.width / tex.height;
            const dw = ratio >= 1 ? box : box * ratio, dh = ratio >= 1 ? box / ratio : box;
            const bx = left + (x / 100) * side, by = top + (y / 100) * side;
            const s = sprite(seatSprites as Map<string | number, import("pixi.js").Sprite>, key, seatLayer, tex);
            seen.add(key);
            // pivot: the middle of the box, or its bottom corner for the gifts that grow out of a corner
            if (corner === "l") { s.anchor.set(0, 1); s.position.set(bx, by + box); }
            else if (corner === "r") { s.anchor.set(1, 1); s.position.set(bx + box, by + box); }
            else { s.anchor.set(0.5); s.position.set(bx + box / 2, by + box / 2); }
            s.scale.set((dw / tex.width) * scale, (dh / tex.height) * scale);
            s.rotation = (rot * Math.PI) / 180;
            s.alpha = alpha;
            s.zIndex = z++;
          };
          for (const p of piles) {
            const age = wall - p.at;
            const scale = age < 350 ? 1.12 - 0.12 * Math.min(1, age / 350) : 1;
            const fade = age > d.pileMs - 3000 ? Math.max(0, 1 - (age - (d.pileMs - 3000)) / 2000) : 1;
            if (fade <= 0) continue;
            put(`${id}:p${p.key}`, p.gift, p.x, p.y, p.s, p.r, fade, scale, null);
          }
          for (const s of spots) {
            if (s.kind === "behind") continue;
            const age = s.t ? wall - s.t : 9999;
            const corner = s.x + s.s / 2 < 45 ? "l" : "r";
            const rot = s.kind === "hatL" ? -45 : s.kind === "hatR" ? 45 : s.r ?? 0;
            const grow = s.kind === "balloon" ? (age < 700 ? 0.6 + 0.6 * (age / 700) : 1.2) : age < 350 ? 1.12 - 0.12 * (age / 350) : 1;
            // a gift pushed out by a new one: still there for 5 s, then it fades (0.9 s)
            const leave = s.leaveAt ? (wall < s.leaveAt ? 1 : Math.max(0, 1 - (wall - s.leaveAt) / 900)) : 1;
            if (leave <= 0) continue;
            put(`${id}:s${s.key}`, s.gift, s.x, s.y, s.s, rot, leave, grow, s.kind === "corner" || s.kind === "balloon" ? corner : null);
          }
        });
        sweep(seatSprites as Map<string | number, import("pixi.js").Sprite>, seen);
        return true;
      };

      // Fireworks (as in Fireworks.tsx) and heart bursts (as in HeartBurst) painted with Graphics / sprites.
      const drawFx = (now: number, unit: number) => {
        const f = fx.current;
        const at = (to: number) => { const seat = f.seats[to] ?? [50, 50]; return [(seat[0] / 100) * w, (seat[1] / 100) * h] as const; };
        const liveShows = new Set<number>();
        for (const item of f.shows) {
          liveShows.add(item.key);
          let show = shows.get(item.key);
          const count = [0, 2, 3, 4, 5][Math.max(1, Math.min(4, item.level))];
          if (!show) { show = { t0: now, g: new PIXI.Graphics(), end: (count - 1) * 400 + 470 + 1300 }; shows.set(item.key, show); fxLayer.addChild(show.g); }
          const g = show.g;
          g.clear();
          const [ox, oy] = at(item.to);
          const t = now - show.t0;
          for (let n = 0; n < count; n++) {
            const r = (k: number) => rand(item.key * 31 + n * 7 + k);
            const bx = (r(1) - 0.5) * 40 * unit, by = (-14 - r(2) * 22) * unit;
            const delay = n * 280 + r(3) * 120;
            const color = hex(FW_COLORS[Math.floor(r(4) * FW_COLORS.length)]);
            const second = hex(FW_COLORS[Math.floor(r(5) * FW_COLORS.length)]);
            const size = 14 + r(6) * 7;
            const rp = (t - delay) / 480;
            if (rp >= 0 && rp <= 1) {
              const e = rocketEase(rp);
              g.circle(ox + bx * e, oy + by * e, 0.7 * unit).fill({ color: 0xFFFFFF, alpha: rp > 0.92 ? 1 - (rp - 0.92) / 0.08 : 1 });
            }
            const fp = (t - delay - 470) / 500;
            if (fp >= 0 && fp <= 1) {
              const rad = 4.5 * unit * (0.2 + 2.4 * fp);
              g.circle(ox + bx, oy + by, rad).fill({ color, alpha: 0.5 * (1 - fp) });
              g.circle(ox + bx, oy + by, rad * 0.45).fill({ color: 0xFFFFFF, alpha: 0.8 * (1 - fp) });
            }
            const sp = (t - delay - 470) / 1300;
            if (sp >= 0 && sp <= 1) {
              const e = sparkEase(sp);
              const alpha = sp < 0.65 ? 1 : 1 - (sp - 0.65) / 0.35;
              const rad = 0.85 * unit * (1.2 - 0.9 * sp);
              for (let k = 0; k < 12; k++) {
                const angle = (k / 12) * Math.PI * 2;
                const reach = size * (k % 3 === 0 ? 0.55 : k % 2 ? 0.8 : 1);
                const sx = ox + bx + Math.cos(angle) * reach * unit * e;
                const sy = oy + by + (Math.sin(angle) * reach + 3) * unit * e;
                g.circle(sx, sy, rad).fill({ color: k % 3 ? color : second, alpha });
                g.circle(sx, sy, rad * 0.4).fill({ color: 0xFFFFFF, alpha });
              }
            }
          }
        }
        for (const [key, show] of shows) if (!liveShows.has(key) || now - show.t0 > show.end + 100) { if (!liveShows.has(key)) { show.g.destroy(); shows.delete(key); } else show.g.clear(); }

        const liveBursts = new Set<number>();
        for (const item of f.bursts) {
          liveBursts.add(item.key);
          let b = bursts.get(item.key);
          if (!b) {
            const c = new PIXI.Container();
            const hearts = HEART_SPREAD.map(() => { const s = new PIXI.Sprite(heartTex); s.anchor.set(0.5); c.addChild(s); return s; });
            const plus = new PIXI.Container();
            const label = new PIXI.Text({ text: `+${item.amount ?? 1}`, style: { fontFamily: "Arial", fontWeight: "900", fontSize: 40, fill: 0xFFFFFF, dropShadow: { color: 0x000000, alpha: 0.6, blur: 3, distance: 2, angle: Math.PI / 2 } } });
            label.anchor.set(1, 0.5);
            const mini = new PIXI.Sprite(heartTex); mini.anchor.set(0, 0.5); mini.position.set(4, 2);
            plus.addChild(label, mini);
            c.addChild(plus);
            fxLayer.addChild(c);
            b = { t0: now, c, hearts, plus };
            bursts.set(item.key, b);
          }
          const [ox, oy] = at(item.to);
          b.c.position.set(ox, oy);
          const t = now - b.t0;
          b.hearts.forEach((s, n) => {
            const p = clamp01((t - n * 60) / 1300);
            const e = easeOut(p);
            const [dx, dy] = HEART_SPREAD[n];
            s.position.set(dx * unit * e, dy * unit * e);
            s.scale.set(0.3 + 0.8 * e);
            s.alpha = p <= 0 ? 0 : p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
          });
          const q = clamp01(t / 1600);
          const lift = q < 0.2 ? -2 * (q / 0.2) : -2 - 6 * ((q - 0.2) / 0.8);
          const grow = q < 0.2 ? 0.5 + 0.65 * (q / 0.2) : 1.15 - 0.15 * ((q - 0.2) / 0.8);
          b.plus.position.set(0, lift * unit);
          b.plus.scale.set((grow * 4.6 * unit) / 40);
          b.plus.alpha = q < 0.2 ? q / 0.2 : q < 0.75 ? 1 : 1 - (q - 0.75) / 0.25;
        }
        for (const [key, b] of bursts) if (!liveBursts.has(key)) { b.c.destroy({ children: true }); bursts.delete(key); }
        const showerOn = drawShower(now, unit);
        const boostOn = drawBoost(now, unit);
        return f.shows.length > 0 || f.bursts.length > 0 || shows.size > 0 || bursts.size > 0 || showerOn || boostOn;
      };

      // Emoji pictures (🔥 💥 🌸 …) are drawn once into a texture and reused.
      const emojiTex = new Map<string, import("pixi.js").Texture>();
      const emoji = (ch: string) => {
        let tex = emojiTex.get(ch);
        if (!tex) {
          const text = new PIXI.Text({ text: ch, style: { fontSize: 64, fontFamily: "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif" } });
          tex = app.renderer.generateTexture({ target: text, resolution: 1 });
          text.destroy();
          emojiTex.set(ch, tex);
        }
        return tex;
      };
      const sized = (s: import("pixi.js").Sprite, size: number) => { const k = size / Math.max(s.texture.width, s.texture.height || 1); s.scale.set(k); return k; };

      // The whole-table shower (TableShower): 36 things fall over 10 s, swaying, turning.
      let shower: { key: number; t0: number; c: import("pixi.js").Container; items: { s: import("pixi.js").Sprite; x: number; sway: number; dur: number; delay: number; size: number }[] } | null = null;
      const drawShower = (now: number, unit: number) => {
        const want = fx.current.shower;
        if (!want) { if (shower) { shower.c.destroy({ children: true }); shower = null; } return false; }
        if (!shower || shower.key !== want.key) {
          shower?.c.destroy({ children: true });
          const c = new PIXI.Container();
          const seed = want.key % 1000;
          const items = Array.from({ length: 36 }, (_, n) => {
            const r = (k: number) => { const x = Math.sin((seed + n * 13 + k) * 9301.7) * 43758.5; return x - Math.floor(x); };
            const s = new PIXI.Sprite(emoji(want.emoji[n % want.emoji.length] ?? "✨"));
            s.anchor.set(0.5); s.alpha = 0;
            c.addChild(s);
            return { s, x: r(1), sway: (r(2) - 0.5) * 16, dur: (3.5 + r(3) * 3) * 1000, delay: r(4) * (SHOWER_SECONDS - 4) * 1000, size: 3.5 + r(5) * 3 };
          });
          fxLayer.addChild(c);
          shower = { key: want.key, t0: now, c, items };
        }
        const t = now - shower.t0;
        let alive = false;
        for (const it of shower.items) {
          const p = (t - it.delay) / it.dur;
          if (p < 0 || p > 1) { it.s.alpha = 0; if (p < 0) alive = true; continue; }
          alive = true;
          sized(it.s, it.size * unit);
          const sway = p < 0.5 ? it.sway * (p / 0.5) : it.sway * (1 - (p - 0.5) / 0.5);
          it.s.position.set(it.x * w + sway * unit, -8 * unit + 112 * unit * p + (it.size * unit) / 2);
          it.s.rotation = (320 * p * Math.PI) / 180;
          it.s.alpha = p < 0.08 ? p / 0.08 : p < 0.9 ? 1 : 1 - (p - 0.9) / 0.1;
        }
        return alive;
      };

      // The booster over the pair in the middle (BoostFx): burning lips with flames, or a slap with a bang.
      let boost: { key: number; t0: number; c: import("pixi.js").Container; parts: import("pixi.js").Sprite[]; kind: string; fromLeft: boolean } | null = null;
      const drawBoost = (now: number, unit: number) => {
        const want = fx.current.boost;
        if (!want) { if (boost) { boost.c.destroy({ children: true }); boost = null; } return false; }
        const picUrl = want.kind === "kiss_fire" ? "/custom/ui/kiss_fire.webp" : "/custom/ui/refuse_slap.webp";
        const pic = texture(picUrl);
        if (!boost || boost.key !== want.key) {
          boost?.c.destroy({ children: true });
          const c = new PIXI.Container();
          const parts: import("pixi.js").Sprite[] = [];
          if (want.kind === "kiss_fire") for (let n = 0; n < 10; n++) { const s = new PIXI.Sprite(emoji("🔥")); s.anchor.set(0.5); s.alpha = 0; c.addChild(s); parts.push(s); }
          else { const s = new PIXI.Sprite(emoji("💥")); s.anchor.set(0.5); s.alpha = 0; c.addChild(s); parts.push(s); }
          const main = new PIXI.Sprite(); main.anchor.set(0.5); main.alpha = 0; c.addChild(main); parts.push(main);
          fxLayer.addChild(c);
          boost = { key: want.key, t0: now, c, parts, kind: want.kind, fromLeft: want.fromLeft };
        }
        const cx = ((fx.current.cx ?? 50) / 100) * w, cy = ((fx.current.cy ?? 50) / 100) * h;
        const t = now - boost.t0;
        const main = boost.parts[boost.parts.length - 1];
        if (pic && main.texture !== pic) main.texture = pic;
        if (boost.kind === "kiss_fire") {
          for (let n = 0; n < 10; n++) {
            const s = boost.parts[n];
            const p = clamp01((t - n * 90) / 1400);
            const e = easeOut(p);
            sized(s, 6 * unit * (0.6 + 0.7 * e));
            const fxo = ((n * 37) % 9) - 4;
            s.position.set(cx + (n - 4.5) * 2.6 * unit + 3 * unit + fxo * unit * e, cy + 2 * unit + 3 * unit - 16 * unit * e);
            s.alpha = p <= 0 ? 0 : p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
          }
          const p = clamp01(t / 2400);
          if (pic) sized(main, 24 * unit * kf(p, [[0, 0.2], [0.2, 1.25], [0.35, 1], [1, 1.1]]));
          main.position.set(cx, cy);
          main.alpha = pic ? kf(p, [[0, 0], [0.2, 1], [0.8, 1], [1, 0]]) : 0;
          return t < 2600;
        }
        const bang = boost.parts[0];
        const pb = clamp01(t / 1600);
        sized(bang, 16 * unit * kf(pb, [[0, 0], [0.4, 0], [0.5, 1.4], [1, 1.8]]));
        bang.position.set(cx, cy);
        bang.alpha = kf(pb, [[0, 0], [0.4, 0], [0.5, 1], [1, 0]]);
        const p = clamp01(t / 2200);
        const size = 22 * unit;
        const startX = cx + (boost.fromLeft ? -1.8 : 0.8) * size + size / 2;
        const slide = kf(p, [[0, 0], [0.45, 1], [1, 1]]);
        if (pic) sized(main, size * kf(p, [[0, 0.8], [0.45, 1.3], [0.55, 1.15], [1, 1.1]]));
        main.position.set(startX + (cx - startX) * slide, cy);
        main.rotation = (kf(p, [[0, boost.fromLeft ? -40 : 40], [0.45, 0], [0.55, -8], [1, 0]]) * Math.PI) / 180;
        main.alpha = pic ? kf(p, [[0, 0], [0.15, 1], [0.85, 1], [1, 0]]) : 0;
        return t < 2400;
      };

      let resized = true;
      const onResize = () => { resized = true; };
      app.renderer.on("resize", onResize);
      let hadFlights = false, hadFx = false;
      const frame = () => {
        raf = requestAnimationFrame(frame);
        w = app.screen.width; h = app.screen.height;
        if (!w || !h) return;
        const now = performance.now();
        const unit = Math.min(w, h) / 100;
        const force = resized || now < dirtyUntil;
        // Read the photo boxes only while there is something to place on them (gifts on photos or in the air).
        const sd = seatData.current;
        if (flights.current.length || sd.ids.some((id) => sd.piles[id]?.length || sd.spots[id]?.length)) measure(now);
        const flying = drawFlights(now, unit);
        const seatsMoved = drawSeats(now, unit, force);
        const effects = drawFx(now, unit);
        // Draw only when something changed or moves; a still table renders nothing.
        if (force || flying || hadFlights || seatsMoved || effects || hadFx) app.render();
        hadFlights = flying; hadFx = effects; resized = false;
      };
      raf = requestAnimationFrame(frame);
      stop = () => {
        cancelAnimationFrame(raf);
        app.renderer.off("resize", onResize);
        for (const t of textures.values()) t?.destroy(true);
        heartTex.destroy(true);
        for (const t of emojiTex.values()) t.destroy(true);
        app.destroy(true, { children: true });
      };
    })();
    return () => { dead = true; stop(); };
  }, [flights, geometry, seatData, fx]);
  return <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0 z-40" />;
}
