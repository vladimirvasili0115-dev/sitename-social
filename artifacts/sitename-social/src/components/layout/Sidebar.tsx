"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation } from "@/config/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useNavBadges } from "./useNavBadges";
import { useInvisible } from "@/components/invisible/useInvisible";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { state: invisible } = useInvisible();
  const badges = useNavBadges();
  return (
    <aside className="sticky top-[96px] hidden h-fit w-[220px] shrink-0 lg:block">
      <Card className="overflow-hidden p-2">
        <nav className="space-y-0.5" aria-label={t("nav.mainNavigation")}>
          {navigation.map(({ key, href, icon: Icon, disabled }, index) => {
            const active = pathname === href && (href !== "/online" || key === "nav.online");
            const className = cn(
              "flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors",
              active ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-2 hover:text-text",
              disabled && "cursor-default hover:bg-transparent",
            );
            const content = <><Icon size={17} strokeWidth={active ? 2.25 : 1.8} /><span className="flex-1 truncate">{t(key as Parameters<typeof t>[0])}</span>{badges[href] ? <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-bg">{badges[href]}</span> : null}{key === "nav.invisible" && invisible.enabled ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}</>;
            return disabled
              ? <span key={`${key}-${index}`} aria-disabled="true" className={className}>{content}</span>
              : <Link key={`${key}-${index}`} href={href} aria-current={active ? "page" : undefined} className={className}>{content}</Link>;
          })}
        </nav>
      </Card>
    </aside>
  );
}
