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
};

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
      const shown = new Map<string, { x: number; y: number; fx: number; fy: number; tx: number; ty: number; t0: number }>();
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

      const drawFlights = (now: number, unit: number) => {
        const list = flights.current;
        const g = geometry.current;
        const seatAt = (index: number) => {
          if (g.staged && (index === g.turn || index === g.target)) return [(g.cx / 100) * w + (index === g.turn ? -12.5 : 12.5) * unit, (g.cy / 100) * h] as const;
          const seat = g.seats[index] ?? [50, 50];
          return [(seat[0] / 100) * w, (seat[1] / 100) * h] as const;
        };
        const seen = new Set<number>();
        for (const item of list) {
          const tex = texture(item.url);
          if (!tex) continue;
          const raw = clamp01((now - item.t0) / item.ms);
          const p = flightEase(raw);
          const [sx, sy] = seatAt(item.from);
          const [rx, ry] = seatAt(item.to);
          const ex = rx + item.tx * unit, ey = ry + item.ty * unit;
          const size = item.base * unit * scaleAt(raw, item.end);
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
        let animating = now < busyUntil || force;
        if (!animating) {
          for (const id of d.ids) {
            for (const p of d.piles[id] ?? []) if (young(p.at, 400) || wall - p.at > d.pileMs - 3200) { animating = true; break; }
            if (animating) break;
            for (const s of d.spots[id] ?? []) if (s.t && young(s.t, 800)) { animating = true; break; }
            if (animating) break;
          }
        }
        if (!animating && drewSeats) return false;
        drewSeats = true;
        const side = d.box * unit;
        const seen = new Set<string>();
        let z = 0;
        d.ids.forEach((id, index) => {
          const piles = d.piles[id] ?? [], spots = d.spots[id] ?? [];
          if (!piles.length && !spots.length) return;
          let tx: number, ty: number;
          if (d.staged && (index === d.turn || index === d.target)) { tx = (d.cx / 100) * w + (index === d.turn ? -12.5 : 12.5) * unit; ty = (d.cy / 100) * h; }
          else { const seat = d.seats[index] ?? [50, 50]; tx = (seat[0] / 100) * w; ty = (seat[1] / 100) * h; }
          let cur = shown.get(id);
          if (!cur) { cur = { x: tx, y: ty, fx: tx, fy: ty, tx, ty, t0: now - 2000 }; shown.set(id, cur); }
          if (Math.abs(cur.tx - tx) > 0.5 || Math.abs(cur.ty - ty) > 0.5) { cur.fx = cur.x; cur.fy = cur.y; cur.tx = tx; cur.ty = ty; cur.t0 = now; }
          const k = Math.min(1, (now - cur.t0) / 1100);
          const e = inOut(k);
          cur.x = cur.fx + (cur.tx - cur.fx) * e; cur.y = cur.fy + (cur.ty - cur.fy) * e;
          if (k < 1) busyUntil = Math.max(busyUntil, now + 50);
          const left = cur.x - side / 2, top = cur.y - side / 2;
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
            put(`${id}:s${s.key}`, s.gift, s.x, s.y, s.s, rot, 1, grow, s.kind === "corner" || s.kind === "balloon" ? corner : null);
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
        return f.shows.length > 0 || f.bursts.length > 0 || shows.size > 0 || bursts.size > 0;
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
        app.destroy(true, { children: true });
      };
    })();
    return () => { dead = true; stop(); };
  }, [flights, geometry, seatData, fx]);
  return <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0 z-40" />;
}
