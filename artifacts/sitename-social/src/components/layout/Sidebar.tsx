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

// Neon look: every icon sits in its own coloured tile, the open page is a violet-to-pink glowing bar.
const tints = ["#a78bfa", "#22d3ee", "#f472b6", "#fbbf24", "#34d399", "#60a5fa", "#fb7185", "#fb923c"];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { state: invisible } = useInvisible();
  const badges = useNavBadges();
  const admin = useIsAdmin();
  return (
    <aside className="sticky top-[96px] hidden h-fit w-[220px] shrink-0 lg:block">
      <Card className="overflow-hidden p-2">
        <nav className="space-y-0.5" aria-label={t("nav.mainNavigation")}>
          {navigation.map(({ key, href, icon: Icon, disabled }, index) => {
            const active = pathname === href && (href !== "/online" || key === "nav.online");
            const className = cn(
              "flex h-11 items-center gap-3 rounded-xl px-2.5 text-[13px] font-medium transition-colors",
              active ? "bg-gradient-to-r from-[#7c3aed] to-[#ec4899] font-semibold text-white shadow-[0_6px_18px_-6px_rgba(236,72,153,0.7)]" : "text-muted hover:bg-surface-2 hover:text-text",
              disabled && "cursor-default hover:bg-transparent",
            );
            const tint = tints[index % tints.length];
            const content = <><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: active ? "rgba(255,255,255,0.22)" : `${tint}26`, color: active ? "#fff" : tint }}><Icon size={16} strokeWidth={active ? 2.25 : 1.9} /></span><span className="flex-1 truncate">{t(key as Parameters<typeof t>[0])}</span>{badges[href] ? <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-bg">{badges[href]}</span> : null}{key === "nav.invisible" && invisible.enabled ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}</>;
            return disabled
              ? <span key={`${key}-${index}`} aria-disabled="true" className={className}>{content}</span>
              : <Link key={`${key}-${index}`} href={href} aria-current={active ? "page" : undefined} className={className}>{content}</Link>;
          })}
          {admin ? <Link href="/admin" aria-current={pathname === "/admin" ? "page" : undefined} className={cn("flex h-11 items-center gap-3 rounded-xl px-2.5 text-[13px] font-medium transition-colors", pathname === "/admin" ? "bg-gradient-to-r from-[#7c3aed] to-[#ec4899] font-semibold text-white shadow-[0_6px_18px_-6px_rgba(236,72,153,0.7)]" : "text-muted hover:bg-surface-2 hover:text-text")}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: pathname === "/admin" ? "rgba(255,255,255,0.22)" : "#fb718526", color: pathname === "/admin" ? "#fff" : "#fb7185" }}><ShieldAlert size={16} /></span><span className="flex-1 truncate">{t("nav.admin")}</span></Link> : null}
        </nav>
      </Card>
    </aside>
  );
}
