"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/config/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useNavBadges } from "./useNavBadges";
import { useInvisible } from "@/components/invisible/useInvisible";
import { ShieldAlert } from "lucide-react";
import { useIsAdmin } from "@/components/report/useIsAdmin";

// Calm look: plain line icons; the open page has a soft warm background and an orange bar on its left edge.
const itemClass = (active: boolean) => cn(
  "relative flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
  active ? "bg-[rgba(244,81,30,0.14)] font-semibold text-text" : "font-medium text-muted hover:bg-surface-2 hover:text-text",
);
const activeBar = <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[#F4511E]" />;

export function Sidebar() {
  // The static site serves pages with a slash at the end (/feed/): compare without it, so the open page is marked.
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const { t } = useTranslation();
  const { state: invisible } = useInvisible();
  const badges = useNavBadges();
  const admin = useIsAdmin();
  return (
    <aside className="sticky top-[96px] hidden h-fit w-[220px] shrink-0 lg:block">
      <Card className="overflow-hidden rounded-3xl p-2.5">
        <nav className="space-y-0.5" aria-label={t("nav.mainNavigation")}>
          {navigation.map(({ key, href, icon: Icon, disabled }, index) => {
            const active = pathname === href && (href !== "/online" || key === "nav.online");
            const className = cn(itemClass(active), disabled && "cursor-default hover:bg-transparent");
            const content = <>{active ? activeBar : null}<span className={cn("flex h-7 w-7 shrink-0 items-center justify-center", active ? "text-[#F4511E]" : "")}><Icon size={19} strokeWidth={active ? 2.1 : 1.75} /></span><span className="flex-1 truncate">{t(key as Parameters<typeof t>[0])}</span>{badges[href] ? <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-bg">{badges[href]}</span> : null}{key === "nav.invisible" && invisible.enabled ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}</>;
            return disabled
              ? <span key={`${key}-${index}`} aria-disabled="true" className={className}>{content}</span>
              : <Link key={`${key}-${index}`} href={href} aria-current={active ? "page" : undefined} className={className}>{content}</Link>;
          })}
          {admin ? <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined} className={itemClass(pathname === "/admin")}>{pathname === "/admin" ? activeBar : null}<span className={cn("flex h-7 w-7 shrink-0 items-center justify-center", pathname === "/admin" ? "text-[#F4511E]" : "")}><ShieldAlert size={19} strokeWidth={1.75} /></span><span className="flex-1 truncate">{t("nav.admin")}</span></Link> : null}
        </nav>
      </Card>
    </aside>
  );
}
