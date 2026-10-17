"use client";
import { cn } from "@/lib/utils";

export function Switch({ checked, onChange, label, disabled = false, size = "md" }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean; size?: "md" | "lg" }) {
  const large = size === "lg";
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className={cn("relative shrink-0 rounded-full transition-colors disabled:opacity-40", large ? "h-8 w-14" : "h-6 w-11", checked ? "bg-accent" : "bg-border")}>
      <span className={cn("absolute top-1 rounded-full bg-white transition-transform", large ? "left-1 h-6 w-6" : "left-1 h-4 w-4", checked && (large ? "translate-x-6" : "translate-x-5"))} />
    </button>
  );
}
