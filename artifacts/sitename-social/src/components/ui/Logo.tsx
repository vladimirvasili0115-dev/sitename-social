import { SITE_NAME } from "@/config/site";
import { cn } from "@/lib/utils";
import { LogoMark } from "./LogoMark";

// The brand: the bottle-and-heart mark and "NudePart" with "Part" in the brand gradient.
export function Wordmark({ className }: { className?: string }) {
  const split = SITE_NAME.search(/[A-Z](?=[a-z]*$)/);
  const head = split > 0 ? SITE_NAME.slice(0, split) : SITE_NAME;
  const tail = split > 0 ? SITE_NAME.slice(split) : "";
  return <span className={cn("text-[19px] font-extrabold tracking-[-0.04em] text-text", className)}>{head}<span className="bg-[linear-gradient(90deg,#FF4D8D,#FF8A3D)] bg-clip-text text-transparent">{tail}</span></span>;
}

export function Logo({ className }: { className?: string }) {
  return <span className={cn("flex items-center gap-2.5", className)}>
    <LogoMark className="h-9 w-9 shrink-0 drop-shadow-[0_2px_6px_rgba(255,77,141,0.35)]" />
    <Wordmark />
  </span>;
}
