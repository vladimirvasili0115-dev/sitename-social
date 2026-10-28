"use client";
import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { navigation } from "@/config/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { useNavBadges } from "./useNavBadges";
import { newestUnreadChat, openChatFromBadge } from "@/lib/messagesSync";

// The bottom bar shows only the feed (Lent) and the Menu button; the other pages are in the Menu.
const mobileHrefs = ["/feed"];
export function MobileNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const badges = useNavBadges();
  const items = navigation.filter((item) => mobileHrefs.includes(item.href));
  return (
    <nav aria-label={t("nav.mainNavigation")} className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden">
      {items.map(({ key, href, icon: Icon }) => {
        const active = pathname === href;
        const unreadChat = href === "/messages" && badges[href] ? newestUnreadChat() : null;
        return <Link key={href} href={unreadChat ? `/messages?u=${unreadChat}` : href} onClick={href === "/messages" ? () => { openChatFromBadge(); } : undefined} className={cn("relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium", active ? "text-accent" : "text-muted")}>
          <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />{badges[href] ? <span className="absolute left-1/2 top-1.5 ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">{badges[href]}</span> : null}<span>{t(key as Parameters<typeof t>[0])}</span>
        </Link>;
      })}
      <Link href="/menu" className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium", pathname === "/menu" ? "text-accent" : "text-muted")}><Menu size={19} strokeWidth={pathname === "/menu" ? 2.4 : 1.8} /><span>{t("nav.menu")}</span></Link>
    </nav>
  );
}
