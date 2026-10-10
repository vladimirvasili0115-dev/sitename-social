"use client";
import Link from "next/link";
import { Bell, ChevronDown, Compass, LogOut, Mail, Search } from "lucide-react";
import { SITE_NAME } from "@/config/site";
import { currentUser } from "@/data/users";
import { useTranslation } from "@/i18n/useTranslation";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1160px] items-center gap-5 px-4 md:px-6">
        <Link href="/feed" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-bg"><Compass size={20} strokeWidth={2.5} /></span>
          <span className="text-[19px] font-bold tracking-[-0.04em] text-text">{SITE_NAME}<span className="text-accent">.</span></span>
        </Link>
        <label className="hidden h-10 max-w-[340px] flex-1 items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 text-muted md:flex">
          <Search size={16} />
          <input className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted" placeholder={t("header.search")} />
        </label>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link href="/feed" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-accent hover:bg-surface-2 lg:block">{t("nav.feed")}</Link>
          <Link href="/messages" aria-label={t("header.messages")} className="hidden rounded-full p-2.5 text-muted hover:bg-surface-2 hover:text-text sm:flex"><Mail size={18} /></Link>
          <IconButton aria-label={t("header.notifications")} className="hidden sm:inline-flex"><Bell size={18} /></IconButton>
          <div className="hidden items-center gap-2 border-l border-border pl-3 md:flex">
            <Avatar user={currentUser} size="sm" />
            <span className="max-w-[92px] truncate text-sm font-medium">{currentUser.name.split(" ")[0]}</span>
            <ChevronDown size={14} className="text-muted" />
          </div>
          <LanguageSwitcher />
          <IconButton aria-label={t("auth.logout")} title={t("auth.logout")} onClick={signOut}><LogOut size={18} /></IconButton>
          <IconButton aria-label={t("header.messages")} className="sm:hidden"><Mail size={18} /></IconButton>
          <IconButton aria-label={t("header.notifications")} className="sm:hidden"><Bell size={18} /></IconButton>
        </div>
      </div>
    </header>
  );
}
