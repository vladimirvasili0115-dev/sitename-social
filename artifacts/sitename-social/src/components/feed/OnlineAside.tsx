"use client";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { useFriends } from "@/components/friends/useFriends";
import { Avatar } from "@/components/ui/Avatar";
import { userHref } from "@/lib/links";

// Right column of the home page: real numbers from the user directory (not made-up ones).
export function OnlineAside() {
  const { t } = useTranslation();
  const { directory } = useFriends();
  const online = directory.filter((item) => item.user.online);
  return <aside className="hidden w-[240px] shrink-0 xl:block">
    <div className="sticky top-[96px] space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />{t("home.onlineNow")}<span className="ml-auto text-accent">{online.length}</span></h2>
        <ul className="space-y-2.5">
          {online.slice(0, 8).map((item) => <li key={item.user.id}>
            <Link href={userHref(item.user.id)} className="flex items-center gap-2.5 hover:opacity-80">
              <span className="relative"><Avatar user={item.user} size="sm" /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" /></span>
              <span className="min-w-0"><span className="block truncate text-xs font-semibold">{item.user.name}</span>{item.city ? <span className="block truncate text-[11px] text-muted">{item.city}</span> : null}</span>
            </Link>
          </li>)}
        </ul>
        <Link href="/online" className="mt-3 block text-center text-xs font-semibold text-accent hover:underline">{t("home.seeAll")}</Link>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted">{t("home.registered")}</p>
        <p className="mt-1 text-2xl font-extrabold">{directory.length + 1} <span className="text-xs font-semibold text-muted">{t("home.people")}</span></p>
      </section>
    </div>
  </aside>;
}
