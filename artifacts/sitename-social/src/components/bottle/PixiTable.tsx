"use client";

import { useEffect, useRef } from "react";

// Test (owner and moderators only): the table itself on a WebGL (PixiJS) layer UNDER the seats.
// It paints the wooden background (on the wide table; on the phone the wood also runs behind the header, so it stays HTML there)
// and the players' photos. The photos are read from the page: every seat button has <img data-photo>, which is kept (transparent)
// for the layout, the clicks, the arrival animation and everything drawn on top (frames, kiss lips, names, rings, gestures).
// Each frame the layer reads where each photo really is, so a photo moving to the middle for the kiss and back stays exact.
export function PixiTable({ wood }: { wood: string | null }) {
  const host = useRef<HTMLDivElement>(null);
  const woodRef = useRef(wood);
  woodRef.current = wood;
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
        console.error("[pixi-table] init failed", error);
        return;
      }
      if (dead) { app.destroy(true, { children: true }); return; }
      app.ticker.stop();
      const view = app.canvas as HTMLCanvasElement;
      view.style.position = "absolute"; view.style.inset = "0"; view.style.width = "100%"; view.style.height = "100%"; view.style.pointerEvents = "none";
      node.appendChild(view);
      console.info("[pixi-table] on", app.renderer.name);

      const textures = new Map<string, import("pixi.js").Texture | null>();
      let dirty = true;
      const texture = (url: string) => {
        const have = textures.get(url);
        if (have !== undefined) return have;
        textures.set(url, null);
        const img = new Image(); img.decoding = "async"; img.crossOrigin = "anonymous";
        img.onload = () => { if (!dead) { textures.set(url, PIXI.Texture.from(img)); dirty = true; } };
        img.onerror = () => { /* stays empty; the HTML photo is behind nothing, so the seat shows its frame only */ };
        img.src = url;
        return null;
      };

      const bg = new PIXI.Sprite();
      app.stage.addChild(bg);
      const photos = new PIXI.Container();
      app.stage.addChild(photos);
      type Seat = { box: import("pixi.js").Container; pic: import("pixi.js").Sprite; mask: import("pixi.js").Graphics; key: string };
      const seats = new Map<string, Seat>();

      let raf = 0, last = "";
      const touched = new Set<HTMLImageElement>();
      const touchedBtn = new Set<HTMLElement>();
      const frame = () => {
        raf = requestAnimationFrame(frame);
        const w = app.screen.width, h = app.screen.height;
        if (!w || !h) return;
        const root = node.parentElement;
        if (!root) return;
        const base = node.getBoundingClientRect();
        let sig = `${w}x${h}|${woodRef.current ?? ""}`;
        // Wooden background, "cover" like the HTML one.
        const woodUrl = woodRef.current;
        const woodTex = woodUrl ? texture(woodUrl) : null;
        if (woodTex) {
          bg.texture = woodTex; bg.visible = true;
          const k = Math.max(w / woodTex.width, h / woodTex.height);
          bg.scale.set(k); bg.position.set((w - woodTex.width * k) / 2, (h - woodTex.height * k) / 2);
        } else bg.visible = false;
        const seen = new Set<string>();
        root.querySelectorAll<HTMLElement>("[data-seat]").forEach((btn) => {
          const id = btn.dataset.seat ?? "";
          const img = btn.querySelector<HTMLImageElement>("img[data-photo]");
          if (!id || !img) return;
          const url = img.currentSrc || img.src;
          const r = btn.getBoundingClientRect();
          if (!url || r.width < 2) return;
          const x = r.left - base.left, y = r.top - base.top, side = r.width;
          sig += `|${id}:${url}:${x.toFixed(1)},${y.toFixed(1)},${side.toFixed(1)}`;
          seen.add(id);
          let seat = seats.get(id);
          if (!seat) {
            const box = new PIXI.Container();
            const pic = new PIXI.Sprite();
            const mask = new PIXI.Graphics();
            box.addChild(pic, mask);
            pic.mask = mask;
            photos.addChild(box);
            seat = { box, pic, mask, key: "" };
            seats.set(id, seat);
          }
          const tex = texture(url);
          // The HTML photo is made see-through only once the WebGL photo is really there (a picture that cannot be loaded,
          // e.g. without CORS, keeps the HTML one), and stays visible while it plays its arrival animation.
          const hideHtml = Boolean(tex) && !img.getAnimations().length;
          const op = hideHtml ? "0" : "";
          if (img.style.opacity !== op) img.style.opacity = op;
          const bgc = hideHtml ? "transparent" : "";
          if (btn.style.backgroundColor !== bgc) btn.style.backgroundColor = bgc;
          touched.add(img); touchedBtn.add(btn);
          const key = `${url}|${side.toFixed(1)}|${tex ? 1 : 0}`;
          seat.box.position.set(x, y);
          if (seat.key !== key) {
            seat.key = key;
            // rounded corners (14% like the HTML photo), the picture cut to a square "cover"
            seat.mask.clear().roundRect(0, 0, side, side, side * 0.14).fill(0xFFFFFF);
            if (tex) {
              seat.pic.texture = tex; seat.pic.visible = true;
              const k = Math.max(side / tex.width, side / tex.height);
              seat.pic.scale.set(k); seat.pic.position.set((side - tex.width * k) / 2, (side - tex.height * k) / 2);
            } else seat.pic.visible = false;
          }
        });
        for (const [id, seat] of seats) if (!seen.has(id)) { seat.box.destroy({ children: true }); seats.delete(id); }
        // Draw only when something changed (a photo moved or loaded, the size changed).
        if (sig !== last || dirty) { last = sig; dirty = false; app.render(); }
      };
      raf = requestAnimationFrame(frame);
      stop = () => {
        cancelAnimationFrame(raf);
        // Give the HTML photos back.
        for (const img of touched) img.style.opacity = "";
        for (const btn of touchedBtn) btn.style.backgroundColor = "";
        for (const t of textures.values()) t?.destroy(true);
        app.destroy(true, { children: true });
      };
    })();
    return () => { dead = true; stop(); };
  }, []);
  return <div ref={host} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" />;
}
