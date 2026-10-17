import { Compass } from "lucide-react";
import { SITE_NAME } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return <span className={cn("flex items-center gap-2.5", className)}>
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-bg"><Compass size={20} strokeWidth={2.5} /></span>
    <span className="text-[19px] font-bold tracking-[-0.04em] text-text">{SITE_NAME}<span className="text-accent">.</span></span>
  </span>;
}
