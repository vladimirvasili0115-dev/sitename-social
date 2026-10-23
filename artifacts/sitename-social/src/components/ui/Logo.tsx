import { SITE_NAME, SITE_NAME_TAIL } from "@/config/site";
import { cn } from "@/lib/utils";
import { LogoMark } from "./LogoMark";

// The brand: the bottle-and-heart mark and the site name with its last part in the brand gradient.
export function Wordmark({ className }: { className?: string }) {
  const hasTail = SITE_NAME_TAIL.length > 0 && SITE_NAME.endsWith(SITE_NAME_TAIL) && SITE_NAME.length > SITE_NAME_TAIL.length;
  const head = hasTail ? SITE_NAME.slice(0, SITE_NAME.length - SITE_NAME_TAIL.length) : SITE_NAME;
  const tail = hasTail ? SITE_NAME_TAIL : "";
  return <span className={cn("text-[19px] font-extrabold tracking-[-0.04em] text-text", className)}>{head}<span className="bg-[linear-gradient(90deg,#FF4D8D,#FF8A3D)] bg-clip-text text-transparent">{tail}</span></span>;
}

export function Logo({ className }: { className?: string }) {
  return <span className={cn("flex items-center gap-2.5", className)}>
    <LogoMark className="h-9 w-9 shrink-0 drop-shadow-[0_2px_6px_rgba(255,77,141,0.35)]" />
    <Wordmark />
  </span>;
}
