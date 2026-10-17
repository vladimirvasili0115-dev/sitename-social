import { cn } from "@/lib/utils";
import type { User } from "@/types";

export function Avatar({ user, size = "md", className = "" }: { user: User; size?: "sm" | "md" | "lg"; className?: string }) {
  const dimensions = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  return <img className={cn(dimensions, "shrink-0 rounded-full object-cover", className)} src={user.avatar} alt={user.name} />;
}
