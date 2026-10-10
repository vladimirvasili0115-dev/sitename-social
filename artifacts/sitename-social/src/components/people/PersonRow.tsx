import type { ReactNode } from "react";
import { VerifiedMark } from "@/components/ui/VerifiedMark";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Person } from "@/types";
import { userHref } from "@/lib/links";
import { Avatar } from "@/components/ui/Avatar";

export function PersonRow({ person, children }: { person: Person; children?: ReactNode }) {
  const { user, city } = person;
  const href = userHref(user.id);
  return (
    <div className="flex items-center gap-3 p-3.5">
      <Link href={href} className="relative h-12 w-12 shrink-0">
        <Avatar user={user} size="lg" />
        {user.online ? <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface bg-accent" /> : null}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href} className="block truncate text-sm font-semibold hover:underline">{user.name}<VerifiedMark userId={user.id} size={14} /></Link>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted"><MapPin size={12} className="shrink-0" />{city}</p>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
