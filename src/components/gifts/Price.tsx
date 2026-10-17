import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function Price({ value, className }: { value: number; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 font-semibold tabular-nums", className)}><Coins size={14} className="text-[#E7B93C]" />{value}</span>;
}
