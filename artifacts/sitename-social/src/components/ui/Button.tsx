import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "subtle" | "outline" }) {
  const variants = {
    primary: "bg-accent text-bg hover:brightness-110",
    subtle: "bg-transparent text-muted hover:bg-surface-2 hover:text-text",
    outline: "border border-border text-text hover:bg-surface-2",
  };
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors", variants[variant], className)} {...props} />;
}
