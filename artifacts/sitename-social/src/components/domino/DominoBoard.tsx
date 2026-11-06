"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { DGame, DSide } from "@/lib/dominoSync";
import { DominoTile } from "./DominoTile";

// Board layout in tile units: a tile is 2x1 (a double lies across the line, 1 along it).
// The line starts at an anchor tile (the 365 spinner, or the round's first tile) and grows both ways.
// When an end reaches the edge of the board it turns 90° like a snake:
//   right end: down, then back to the left;  left end: up, then back to the right.
// 365 spinner arms: the up arm turns right at the top, the down arm turns left at the bottom.
// The unit (tile size) is the largest that lets the whole layout fit the box.
type Piece = { key: string; x: number; y: number; w: number; h: number; a: number; b: number; horizontal: boolean };
type Spot = { side: DSide; x: number; y: number; w: number; h: number };
type V = { x: number; y: number };
type BoardGame = Pick<DGame, "ch_a" | "ch_b" | "spin_idx" | "up_a" | "up_b" | "dn_a" | "dn_b">;

const GAP = 0.06;
const EDGE = 0.25;
// Returning rows keep this far from the spinner column: a double in an arm lies across it and
// reaches 1 unit to each side, and a double in a corner reaches past the row end.
const ARM_CLEAR = 2;

const add = (p: V, d: V, k: number): V => ({ x: p.x + d.x * k, y: p.y + d.y * k });

// Rectangle of a tile laid from point p in direction d (p = middle of its inner edge).
function rectOf(p: V, d: V, dbl: boolean) {
  const len = dbl ? 1 : 2, half = dbl ? 1 : 0.5;
  if (d.x !== 0) return { x: d.x > 0 ? p.x : p.x - len, y: p.y - half, w: len, h: half * 2 };
  return { x: p.x - half, y: d.y > 0 ? p.y : p.y - len, w: half * 2, h: len };
}

// Pips as drawn: vertical a = top, b = bottom; horizontal a = left, b = right.
function facesOf(d: V, dbl: boolean, inner: number, outer: number) {
  const horizontal = dbl ? d.y !== 0 : d.x !== 0;
  if (dbl) return { horizontal, a: inner, b: inner };
  const forward = d.x > 0 || d.y > 0; // drawn inner→outer in reading order
  return { horizontal, a: forward ? inner : outer, b: forward ? outer : inner };
}

type Walk = { pieces: Piece[]; spot: Omit<Spot, "side"> };

// Lays one branch of tiles. kind decides how it turns at the edge.
function walk(
  keyPrefix: string, keyIndex: (i: number) => number, tiles: { inner: number; outer: number }[],
  start: V, dir: V, startHalf: number, kind: "right" | "left" | "up" | "down",
  lim: { x0: number; x1: number; y0: number; y1: number; innerX: number | null },
): Walk {
  const pieces: Piece[] = [];
  let p = start, d = dir, half = startHalf;
  let back: V | null = null; // after a corner tile: horizontal direction to go next
  let down = 0;              // how far the corner has gone; rows need 2 units between them
  const isDbl = (i: number) => i < tiles.length && tiles[i].inner === tiles[i].outer;
  // Straight room tile i needs. A turn may only happen between two plain tiles (never on a double,
  // never right after one), so every "double + the plain tile after it" that follows must also fit
  // (plain, double, plain, double, ... cannot turn anywhere until two plain tiles meet).
  const need = (i: number) => {
    let n = (isDbl(i) ? 1 : 2) + GAP;
    for (let j = i + 1; isDbl(j); j += 2) n += 1 + GAP + (j + 1 < tiles.length ? 2 + GAP : 0);
    return n;
  };
  const xLimits = (dx: number) => ({
    max: dx > 0 ? (kind === "right" ? lim.x1 : lim.innerX ?? lim.x1) : null,
    min: dx < 0 ? (kind === "left" ? lim.x0 : lim.innerX ?? lim.x0) : null,
  });
  // i = index of the tile about to be placed (tiles.length = the free spot for the next move)
  const step = (i: number) => {
    const dbl = isDbl(i);
    const plainBefore = half === 0.5; // the tile before is not a double
    if (back) {
      // turning back: only with a plain tile after a plain tile, and only when the rows are 2 units apart
      if (dbl || !plainBefore || down < 2 - 1e-6) return;
      const q = add(add(p, d, -0.5), back, half + GAP);
      const farX = q.x + back.x * need(i);
      const { max, min } = xLimits(back.x);
      // no room on the way back: keep going down/up instead
      if ((max !== null && farX > max) || (min !== null && farX < min)) return;
      p = q;
      d = back; back = null;
      return;
    }
    if (dbl || !plainBefore) return; // a double never turns, and nothing turns off a double
    const far = add(p, d, need(i));
    if (kind === "right" || kind === "left") {
      // horizontal runs: outer edge of the board, or the spinner column on the way back
      const { max, min } = xLimits(d.x);
      if ((max !== null && far.x > max) || (min !== null && far.x < min)) {
        const turn: V = kind === "right" ? { x: 0, y: 1 } : { x: 0, y: -1 };
        back = { x: -d.x, y: 0 };
        down = 0;
        p = add(add(p, d, -0.5), turn, half + GAP);
        d = turn;
      }
    } else if (d.y !== 0 && Math.abs(p.y) >= 2.5 && (far.y < lim.y0 || far.y > lim.y1)) {
      // an arm turns only once it is a full tile away from the main line, so it never folds onto it
      const turn: V = kind === "up" ? { x: 1, y: 0 } : { x: -1, y: 0 };
      p = add(add(p, d, -0.5), turn, half + GAP);
      d = turn;
    }
  };
  tiles.forEach((t, i) => {
    const dbl = t.inner === t.outer;
    step(i);
    const r = rectOf(p, d, dbl);
    const f = facesOf(d, dbl, t.inner, t.outer);
    pieces.push({ key: `${keyPrefix}${keyIndex(i)}`, ...r, ...f });
    p = add(p, d, (dbl ? 1 : 2) + GAP);
    half = dbl ? 1 : 0.5;
    if (back) down += dbl ? 1 : 2;
  });
  step(tiles.length);
  return { pieces, spot: rectOf(p, d, false) };
}

export function layoutBoard(g: BoardGame, anchor: number, W: number, H: number) {
  const n = g.ch_a.length;
  if (!n) return { pieces: [] as Piece[], spots: [{ side: "R" as DSide, x: -1, y: -0.5, w: 2, h: 1 }], box: { x0: -1, y0: -1, x1: 1, y1: 1 } };
  const k = Math.min(Math.max(anchor, 0), n - 1);
  const spin = g.spin_idx !== null && g.spin_idx === k;
  const a0 = g.ch_a[k], b0 = g.ch_b[k];
  const dbl0 = a0 === b0;
  const pieces: Piece[] = [{ key: `c${k}`, x: dbl0 ? -0.5 : -1, y: dbl0 ? -1 : -0.5, w: dbl0 ? 1 : 2, h: dbl0 ? 2 : 1, a: a0, b: b0, horizontal: !dbl0 }];
  const hx = dbl0 ? 0.5 : 1, half0 = dbl0 ? 1 : 0.5;
  const lim = { x0: -W / 2 + EDGE, x1: W / 2 - EDGE, y0: -H / 2 + EDGE, y1: H / 2 - EDGE, innerX: null as number | null };
  const right = walk("c", (i) => k + 1 + i,
    g.ch_a.slice(k + 1).map((a, i) => ({ inner: a, outer: g.ch_b[k + 1 + i] })),
    { x: hx + GAP, y: 0 }, { x: 1, y: 0 }, half0, "right", { ...lim, innerX: spin ? ARM_CLEAR : null });
  const leftIdx = Array.from({ length: k }, (_, i) => k - 1 - i);
  const left = walk("c", (i) => k - 1 - i,
    leftIdx.map((j) => ({ inner: g.ch_b[j], outer: g.ch_a[j] })),
    { x: -hx - GAP, y: 0 }, { x: -1, y: 0 }, half0, "left", { ...lim, innerX: spin ? -ARM_CLEAR : null });
  // With a spinner the returning rows stop at the spinner column (innerX), clear of the up/down arms.
  pieces.push(...right.pieces, ...left.pieces);
  const spots: Spot[] = [{ side: "R", ...right.spot }, { side: "L", ...left.spot }];
  const arms = g.spin_idx !== null && g.spin_idx > 0 && g.spin_idx < n - 1;
  if (spin && arms) {
    const up = walk("u", (i) => i, g.up_a.map((a, i) => ({ inner: a, outer: g.up_b[i] })), { x: 0, y: -1 - GAP }, { x: 0, y: -1 }, 0.5, "up", lim);
    const dn = walk("d", (i) => i, g.dn_a.map((a, i) => ({ inner: a, outer: g.dn_b[i] })), { x: 0, y: 1 + GAP }, { x: 0, y: 1 }, 0.5, "down", lim);
    pieces.push(...up.pieces, ...dn.pieces);
    spots.push({ side: "U", ...up.spot }, { side: "D", ...dn.spot });
  }
  const all = [...pieces, ...spots];
  const box = {
    x0: Math.min(...all.map((p) => p.x)), y0: Math.min(...all.map((p) => p.y)),
    x1: Math.max(...all.map((p) => p.x + p.w)), y1: Math.max(...all.map((p) => p.y + p.h)),
  };
  return { pieces, spots, box };
}

// Largest tile size (px per unit) at which the snake fits the box.
export function fitBoard(g: BoardGame, anchor: number, pxW: number, pxH: number, maxUnit: number) {
  // At least ~5 tiles per row (11 units across), so a phone turns after 4-5 tiles, not after 2.
  let unit = Math.max(8, Math.min(maxUnit, pxW / 11));
  for (let i = 0; i < 40; i++) {
    const W = pxW / unit, H = pxH / unit;
    const res = layoutBoard(g, anchor, Math.max(W, 6.5), Math.max(H, 6.5));
    const bw = res.box.x1 - res.box.x0, bh = res.box.y1 - res.box.y0;
    if ((bw <= W && bh <= H) || unit <= 8) return { ...res, unit };
    unit = Math.max(8, unit * 0.93);
  }
  return { ...layoutBoard(g, anchor, pxW / unit, pxH / unit), unit };
}

type Props = {
  game: BoardGame;
  anchor: number;                   // index in the line of the tile the layout grows from
  targets: DSide[];                 // sides where the selected tile can go
  onTarget: (side: DSide) => void;
  lastKey?: string | null;          // piece to highlight (last move)
  maxUnit?: number;
};

export function DominoBoard({ game, anchor, targets, onTarget, lastKey = null, maxUnit = 30 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Measure before the first paint so the tiles do not slide in from a default size.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  if (!size.w) return <div ref={ref} className="relative h-full w-full" />;
  const { pieces, spots, box, unit } = fitBoard(game, anchor, size.w, size.h, maxUnit);
  const ox = size.w / 2 - ((box.x0 + box.x1) / 2) * unit;
  const oy = size.h / 2 - ((box.y0 + box.y1) / 2) * unit;
  return (
    <div ref={ref} className="relative h-full w-full">
      {pieces.map((p) => (
        <DominoTile
          key={p.key} a={p.a} b={p.b} horizontal={p.horizontal} glow={p.key === lastKey}
          className="absolute transition-all duration-300"
          style={{ left: ox + p.x * unit, top: oy + p.y * unit, width: p.w * unit, height: p.h * unit }}
        />
      ))}
      {spots.filter((s) => targets.includes(s.side)).map((s) => (
        <button
          key={s.side} type="button" onClick={() => onTarget(s.side)} aria-label={s.side}
          className="absolute animate-pulse rounded-md border-2 border-dashed border-[#ffd77a] bg-[#ffd77a33] shadow-[0_0_18px_#ffd77a]"
          style={{ left: ox + s.x * unit, top: oy + s.y * unit, width: s.w * unit, height: s.h * unit }}
        />
      ))}
    </div>
  );
}

// Key of the piece placed by the last move (to glow it).
export function lastPieceKey(g: DGame): string | null {
  const m = g.last_move;
  if (!m || m.kind !== "play" || !m.side) return null;
  if (m.side === "L") return "c0";
  if (m.side === "R") return `c${g.ch_a.length - 1}`;
  if (m.side === "U") return `u${g.up_a.length - 1}`;
  return `d${g.dn_a.length - 1}`;
}

// The tile the line grows from: the 365 spinner, else the round's first tile (remembered per table and round),
// else the middle of the line (e.g. after a page reload in the middle of a 101 round).
const tileCode = (a: number, b: number) => Math.min(a, b) * 10 + Math.max(a, b);
export function useAnchor(g: DGame | undefined, tableId: number): number {
  const key = g ? `domino-anchor-${tableId}-${g.round_no}` : null;
  const [first, setFirst] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!key) return;
    let saved: number | null = null;
    try { const v = window.sessionStorage.getItem(key); saved = v === null ? null : Number(v); } catch { /* storage blocked */ }
    if (g && g.ch_a.length === 1) {
      saved = tileCode(g.ch_a[0], g.ch_b[0]);
      try { window.sessionStorage.setItem(key, String(saved)); } catch { /* storage blocked */ }
    }
    setFirst(saved);
  }, [key, g?.ch_a.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!g || !g.ch_a.length) return 0;
  if (g.spin_idx !== null) return g.spin_idx;
  if (first !== null) {
    const i = g.ch_a.findIndex((a, j) => tileCode(a, g.ch_b[j]) === first);
    if (i >= 0) return i;
  }
  return Math.floor((g.ch_a.length - 1) / 2);
}
