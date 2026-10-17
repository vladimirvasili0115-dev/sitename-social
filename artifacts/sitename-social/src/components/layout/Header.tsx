"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, LogOut, Mail, Search } from "lucide-react";
import { SITE_NAME } from "@/config/site";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/components/profile/useProfile";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useNavBadges } from "./useNavBadges";
import { SiteMusicPill, useSiteMusic } from "@/components/music/siteMusic";

export function Header() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }
  const { user } = useProfile();
  const unreadMessages = useNavBadges()["/messages"];
  const musicOn = Boolean(useSiteMusic().now);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="relative mx-auto flex h-[72px] max-w-[1160px] items-center gap-2 px-4 sm:gap-5 md:px-6">
        <Link href="/feed" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-bg"><Compass size={20} strokeWidth={2.5} /></span>
          <span className={`text-[19px] font-bold tracking-[-0.04em] text-text ${musicOn ? "max-sm:hidden" : ""}`}>{SITE_NAME}<span className="text-accent">.</span></span>
        </Link>
        <form onSubmit={handleSearch} role="search" className="hidden h-10 max-w-[340px] flex-1 items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 text-muted focus-within:border-accent md:flex">
          <Search size={16} />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={t("header.search")} className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted" placeholder={t("header.search")} />
        </form>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SiteMusicPill />
          <Link href="/feed" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-accent hover:bg-surface-2 lg:block">{t("nav.feed")}</Link>
          <Link href="/messages" aria-label={t("header.messages")} className="relative hidden rounded-full p-2.5 text-muted hover:bg-surface-2 hover:text-text sm:flex"><Mail size={18} />{unreadMessages ? <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold tabular-nums text-white">{unreadMessages}</span> : null}</Link>
          <NotificationBell />
          <Link href="/profile" aria-label={t("header.profile")} className="flex items-center gap-2 rounded-xl py-1 hover:bg-surface-2 md:border-l md:border-border md:pl-3 md:pr-2">
            <Avatar user={user} size="sm" />
            <span className="hidden max-w-[92px] truncate text-sm font-medium md:block">{user.name.split(" ")[0]}</span>
          </Link>
          <LanguageSwitcher />
          <IconButton aria-label={t("auth.logout")} title={t("auth.logout")} onClick={() => void signOut()}><LogOut size={18} /></IconButton>
        </div>
      </div>
    </header>
  );
}
