"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = { label: string; trigger: ReactNode; triggerClassName?: string; children: (close: () => void) => ReactNode; className?: string; align?: "left" | "right"; up?: boolean };
export const menuItem = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-text hover:bg-surface-2";

export function Dropdown({ label, trigger, triggerClassName, children, className, align = "right", up = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={label} title={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={triggerClassName}>{trigger}</button>
      {open ? <div role="menu" className={cn("absolute z-30 min-w-[190px] rounded-xl border border-border bg-surface p-1.5", align === "left" ? "left-0" : "right-0", up ? "bottom-full mb-1" : "top-full mt-1", className)}>{children(() => setOpen(false))}</div> : null}
    </div>
  );
}
