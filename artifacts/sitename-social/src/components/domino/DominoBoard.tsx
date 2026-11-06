"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { DGame, DSide } from "@/lib/dominoSync";
import { DominoTile } from "./DominoTile";

// Board layout in tile units: a horizontal tile is 2x1, a vertical tile 1x2.
// The main line runs left→right (ch_a = left pip, ch_b = right pip); doubles stand across it.
// The 365 spinner's arms grow up and down from it. The whole board is scaled to fit its box.
type Piece = { key: string; x: number; y: number; w: number; h: number; a: number; b: number; horizontal: boolean };
type Spot = { side: DSide; x: number; y: number; w: number; h: number };

const GAP = 0.06;

export function layoutBoard(g: Pick<DGame, "ch_a" | "ch_b" | "spin_idx" | "up_a" | "up_b" | "dn_a" | "dn_b">) {
  const pieces: Piece[] = [];
  let x = 0;
  g.ch_a.forEach((a, i) => {
    const b = g.ch_b[i];
    const dbl = a === b;
    const w = dbl ? 1 : 2, h = dbl ? 2 : 1;
    pieces.push({ key: `c${i}`, x, y: -h / 2, w, h, a, b, horizontal: !dbl });
    x += w + GAP;
  });
  const spots: Spot[] = [];
  if (!pieces.length) return { pieces, spots: [{ side: "R" as DSide, x: -1, y: -0.5, w: 2, h: 1 }], box: { x0: -1, y0: -1, x1: 1, y1: 1 } };
  const first = pieces[0];
  const last = pieces[pieces.length - 1];
  spots.push({ side: "L", x: first.x - 2 - GAP, y: -0.5, w: 2, h: 1 });
  spots.push({ side: "R", x: last.x + last.w + GAP, y: -0.5, w: 2, h: 1 });
  if (g.spin_idx !== null && g.spin_idx >= 0 && g.spin_idx < pieces.length) {
    const sp = pieces[g.spin_idx];
    const cx = sp.x + sp.w / 2;
    let top = sp.y - GAP;
    g.up_a.forEach((a, j) => {
      const b = g.up_b[j];
      const dbl = a === b;
      // up arm: a is the inner (bottom) pip, b the outer (top) pip
      if (dbl) { pieces.push({ key: `u${j}`, x: cx - 1, y: top - 1, w: 2, h: 1, a: b, b: a, horizontal: true }); top -= 1 + GAP; }
      else { pieces.push({ key: `u${j}`, x: cx - 0.5, y: top - 2, w: 1, h: 2, a: b, b: a, horizontal: false }); top -= 2 + GAP; }
    });
    let bot = sp.y + sp.h + GAP;
    g.dn_a.forEach((a, j) => {
      const b = g.dn_b[j];
      const dbl = a === b;
      if (dbl) { pieces.push({ key: `d${j}`, x: cx - 1, y: bot, w: 2, h: 1, a, b, horizontal: true }); bot += 1 + GAP; }
      else { pieces.push({ key: `d${j}`, x: cx - 0.5, y: bot, w: 1, h: 2, a, b, horizontal: false }); bot += 2 + GAP; }
    });
    spots.push({ side: "U", x: cx - 0.5, y: top - 2, w: 1, h: 2 });
    spots.push({ side: "D", x: cx - 0.5, y: bot, w: 1, h: 2 });
  }
  const all = [...pieces, ...spots];
  const box = {
    x0: Math.min(...all.map((p) => p.x)), y0: Math.min(...all.map((p) => p.y)),
    x1: Math.max(...all.map((p) => p.x + p.w)), y1: Math.max(...all.map((p) => p.y + p.h)),
  };
  return { pieces, spots, box };
}

type Props = {
  game: Pick<DGame, "ch_a" | "ch_b" | "spin_idx" | "up_a" | "up_b" | "dn_a" | "dn_b">;
  targets: DSide[];                 // sides where the selected tile can go
  onTarget: (side: DSide) => void;
  lastKey?: string | null;          // piece to highlight (last move)
  maxUnit?: number;
};

export function DominoBoard({ game, targets, onTarget, lastKey = null, maxUnit = 30 }: Props) {
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
  const { pieces, spots, box } = layoutBoard(game);
  // Always keep room for the target spots so the board does not jump when a tile is selected.
  const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
  const unit = Math.max(8, Math.min(maxUnit, size.w / (bw + 0.5), size.h / (bh + 0.5)));
  const ox = size.w / 2 - ((box.x0 + box.x1) / 2) * unit;
  const oy = size.h / 2 - ((box.y0 + box.y1) / 2) * unit;
  return (
    <div ref={ref} className="relative h-full w-full">
      {size.w > 0 && pieces.map((p) => (
        <DominoTile
          key={p.key} a={p.a} b={p.b} horizontal={p.horizontal} glow={p.key === lastKey}
          className="absolute transition-all duration-300"
          style={{ left: ox + p.x * unit, top: oy + p.y * unit, width: p.w * unit, height: p.h * unit }}
        />
      ))}
      {size.w > 0 && spots.filter((s) => targets.includes(s.side)).map((s) => (
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
