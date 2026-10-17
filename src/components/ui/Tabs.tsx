"use client";
import { cn } from "@/lib/utils";

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string; count?: number }[]; active: T; onChange: (tab: T) => void }) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
      {tabs.map((tab) => (
        <button key={tab.id} role="tab" aria-selected={tab.id === active} onClick={() => onChange(tab.id)} className={cn("relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-medium", tab.id === active ? "text-accent" : "text-muted hover:text-text")}>
          {tab.label}
          {tab.count !== undefined ? <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] tabular-nums text-muted">{tab.count}</span> : null}
          {tab.id === active ? <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent" /> : null}
        </button>
      ))}
    </div>
  );
}
