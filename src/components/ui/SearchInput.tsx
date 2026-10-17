"use client";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchInput({ value, onChange, label, className }: { value: string; onChange: (value: string) => void; label: string; className?: string }) {
  return (
    <label className={cn("flex h-11 items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 text-muted focus-within:border-accent", className)}>
      <Search size={16} className="shrink-0" />
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} placeholder={label} className="w-full min-w-0 bg-transparent text-sm text-text outline-none placeholder:text-muted" />
    </label>
  );
}
