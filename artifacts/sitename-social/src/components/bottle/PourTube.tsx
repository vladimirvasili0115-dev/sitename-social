"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";

// A drink gift: a twisted glass tube grows from the sender to the receiver, the drink runs through it with little hearts,
// then the tube fades. Positions are in percent of the table box, like the seats.
export function PourTube({ from, to, ms, color = "#FF3D7F" }: { from: readonly [number, number]; to: readonly [number, number]; ms: number; color?: string }) {
  const box = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  useLayoutEffect(() => {
    const element = box.current;
    if (element) setSize([element.clientWidth, element.clientHeight]);
  }, []);
  let body = null;
  if (size) {
    const [width, height] = size;
    const unit = Math.min(width, height);
    const ax = (from[0] / 100) * width, ay = (from[1] / 100) * height;
    const bx = (to[0] / 100) * width, by = (to[1] / 100) * height;
    const gap = unit * 0.07; // starts and ends at the edge of the photos, not in their middle
    const full = Math.hypot(bx - ax, by - ay);
    const length = Math.max(10, full - gap * 2);
    const angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
    const radius = unit * 0.034;
    const period = unit * 0.042;
    const thick = unit * 0.026;
    const strand = (phase: number) => {
      let path = "";
      for (let x = 0; x <= length; x += 2) path += `${x ? "L" : "M"}${x.toFixed(1)} ${(radius * Math.sin((2 * Math.PI * x) / period + phase)).toFixed(1)}`;
      return path;
    };
    const back = strand(Math.PI);
    const front = strand(0);
    const run = { animation: `tube-fill ${ms * 0.75}ms ease-in ${ms * 0.08}ms both` };
    body = (
      <g transform={`translate(${ax + ((bx - ax) / full) * gap} ${ay + ((by - ay) / full) * gap}) rotate(${angle})`} style={{ animation: `tube-life ${ms}ms ease-in-out both` }}>
        <path d={back} fill="none" stroke="#7FA9C4" strokeOpacity={0.55} strokeWidth={thick} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" style={{ animation: `tube-grow ${ms * 0.2}ms ease-out both` }} />
        <path d={back} fill="none" stroke={color} strokeOpacity={0.7} strokeWidth={thick * 0.5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" style={run} />
        <path d={front} fill="none" stroke="#EAF6FF" strokeOpacity={0.85} strokeWidth={thick * 1.1} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" style={{ animation: `tube-grow ${ms * 0.2}ms ease-out both` }} />
        <path d={front} fill="none" stroke={color} strokeWidth={thick * 0.6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" style={run} />
        <path d={front} fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={thick * 0.18} strokeLinecap="round" transform={`translate(0 ${-thick * 0.28})`} pathLength={1} strokeDasharray="1 1" style={{ animation: `tube-grow ${ms * 0.2}ms ease-out both` }} />
        {[0, 1, 2, 3, 4].map((n) => (
          <g key={n} style={{ ["--len" as string]: `${length}px`, animation: `tube-heart ${ms * 0.55}ms linear ${ms * (0.12 + n * 0.07)}ms both` }}>
            <Heart x={-thick * 0.55} y={-thick * 0.55} width={thick * 1.1} height={thick * 1.1} fill="#E8352B" stroke="#FFFFFF" strokeWidth={2} />
          </g>
        ))}
      </g>
    );
  }
  return <svg ref={box} aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 h-full w-full overflow-visible drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]">{body}</svg>;
}

// Hearts jumping out of the receiver's photo with "+1": their heart balance just went up.
export function HeartBurst({ at, amount = 1 }: { at: readonly [number, number]; amount?: number }) {
  const spread: [number, number][] = [[-7, -8], [7, -8], [-10, -1], [10, -1], [-4, -12], [4, -12]];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute z-40 h-0 w-0" style={{ left: `${at[0]}%`, top: `${at[1]}%` }}>
      {spread.map(([dx, dy], n) => (
        <Heart key={n} size={30} fill="#E8352B" stroke="#FFFFFF" strokeWidth={2} className="absolute -left-[15px] -top-[15px] drop-shadow" style={{ ["--dx" as string]: `${dx}cqmin`, ["--dy" as string]: `${dy}cqmin`, animation: `heart-burst 1.3s ease-out ${n * 60}ms both` }} />
      ))}
      <span className="absolute -left-[8cqmin] -top-[2cqmin] flex w-[16cqmin] items-center justify-center gap-[0.4cqmin] text-[4.6cqmin] font-black text-white [text-shadow:0_2px_3px_rgba(0,0,0,0.6)]" style={{ animation: "heart-plus 1.6s ease-out both" }}>+{amount}<Heart size={24} fill="#E8352B" stroke="#FFFFFF" strokeWidth={2} /></span>
    </div>
  );
}
