"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";

type Point = { label: string; value: number };

// One series over the last 30 days: thin bars on a shared baseline, a tooltip on hover or focus, and a table for screen readers.
export function AdminChart({ title, points }: { title: string; points: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((point) => point.value));
  const total = points.reduce((sum, point) => sum + point.value, 0);
  const shown = active === null ? null : points[active];
  return (
    <Card className="p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs tabular-nums text-muted">{shown ? `${shown.label} · ` : ""}<span className="text-sm font-semibold text-text">{shown ? shown.value : total}</span></p>
      </div>
      <div role="img" aria-label={`${title}: ${total}`} className="mt-3 flex h-28 items-end gap-[2px] border-b border-border" onMouseLeave={() => setActive(null)}>
        {points.map((point, index) => (
          <button key={point.label} type="button" tabIndex={-1} aria-hidden="true" onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} className="flex h-full min-w-0 flex-1 items-end">
            <span style={{ height: point.value ? `${Math.max(4, (point.value / max) * 100)}%` : "2px" }} className={`block w-full rounded-t-[4px] ${point.value ? (active === index ? "bg-text" : "bg-accent") : "bg-border"}`} />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted"><span>{points[0]?.label}</span><span>{points[points.length - 1]?.label}</span></div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>{points.map((point) => <tr key={point.label}><th scope="row">{point.label}</th><td>{point.value}</td></tr>)}</tbody>
      </table>
    </Card>
  );
}
