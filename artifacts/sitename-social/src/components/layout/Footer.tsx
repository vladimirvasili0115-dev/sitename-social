"use client";
import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Column = { title: TranslationKey; links: { href: string; label: TranslationKey }[] };
const columns: Column[] = [
  { title: "footer.site", links: [{ href: "/feed", label: "nav.feed" }, { href: "/friends", label: "nav.friends" }, { href: "/groups", label: "nav.groups" }, { href: "/online", label: "nav.online" }] },
  { title: "footer.fun", links: [{ href: "/games", label: "nav.games" }, { href: "/videos", label: "nav.videos" }, { href: "/music", label: "nav.music" }, { href: "/gifts", label: "nav.gifts" }] },
  { title: "footer.account", links: [{ href: "/profile", label: "nav.profile" }, { href: "/settings", label: "nav.settings" }, { href: "/notifications", label: "header.notifications" }, { href: "/invisible", label: "nav.invisible" }] },
  { title: "footer.info", links: [{ href: "/terms", label: "auth.termsLink" }, { href: "/privacy", label: "auth.privacyLink" }] },
];

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-10 border-t border-border bg-surface">
      <div className="mx-auto max-w-[1160px] px-4 pb-24 pt-8 md:px-6 lg:pb-8">
        <div className="grid gap-8 md:grid-cols-[1.3fr_2fr]">
          <div>
            <Link href="/feed" className="inline-block"><Logo /></Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-muted">{t("footer.tagline")}</p>
          </div>
          <nav aria-label={t("footer.info")} className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-text">{t(column.title)}</h2>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => <li key={link.href}><Link href={link.href} className="text-sm text-muted hover:text-accent">{t(link.label)}</Link></li>)}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">© {new Date().getFullYear()} {SITE_NAME}. {t("footer.rights")}</p>
          <LanguageSwitcher up />
        </div>
      </div>
    </footer>
  );
}
