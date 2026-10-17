"use client";
import Link from "next/link";
import type { User } from "@/types";
import { userHref } from "@/lib/links";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { SectionCard } from "./SectionCard";

export function ProfileFriends({ friends, full = false, onSeeAll }: { friends: User[]; full?: boolean; onSeeAll?: () => void }) {
  const { t } = useTranslation();
  const visible = full ? friends : friends.slice(0, 6);
  return (
    <SectionCard title={t("nav.friends")} count={friends.length} onSeeAll={onSeeAll}>
      <ul className={cn("grid gap-3", full ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : "grid-cols-3")}>
        {visible.map((friend) => (
          <li key={friend.id} className="min-w-0 text-center"><Link href={userHref(friend.id)} className="block">
            <span className="relative mx-auto block h-14 w-14">
              <Avatar user={friend} className="h-14 w-14" />
              {friend.online ? <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface bg-accent" /> : null}
            </span>
            <span className="mt-1.5 block truncate text-xs text-text">{friend.name.split(" ")[0]}</span>
          </Link></li>
        ))}
      </ul>
    </SectionCard>
  );
}
