"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CONTACT_EMAIL, SITE_NAME } from "@/config/site";
import { legal, LEGAL_UPDATED } from "@/content/legal";
import { info } from "@/content/info";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/components/auth/AuthProvider";

type Kind = "terms" | "privacy" | "about" | "help" | "contact";
const titles: Record<Kind, TranslationKey> = { terms: "auth.termsLink", privacy: "auth.privacyLink", about: "footer.about", help: "footer.help", contact: "footer.contact" };

export function LegalPage({ kind }: { kind: Kind }) {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const isLegal = kind === "terms" || kind === "privacy";
  const sections = isLegal ? legal[locale][kind] : info[locale][kind];
  return (
    <div className="min-h-[100dvh] bg-bg px-4 py-5 text-text sm:px-8">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-6 flex items-center justify-between gap-4"><Link href={user ? "/feed" : "/login"}><Logo /></Link><LanguageSwitcher /></div>
        <Link href={user ? (isLegal ? "/settings" : "/feed") : (isLegal ? "/register" : "/login")} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"><ArrowLeft size={15} />{t("messages.back")}</Link>
        <h1 className="text-[28px] font-semibold tracking-[-0.035em]">{t(titles[kind])}</h1>
        {isLegal ? <p className="mt-1 text-xs text-muted">{t("legal.updated")}: {LEGAL_UPDATED}</p> : null}
        <Card className="mt-5 space-y-6 p-5 sm:p-7">
          {sections.map(([title, body], index) => (
            <section key={title}>
              <h2 className="text-base font-semibold">{isLegal ? `${index + 1}. ` : ""}{title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{body.replaceAll("{site}", SITE_NAME)}</p>
            </section>
          ))}
          {kind === "contact" && CONTACT_EMAIL ? <p className="text-sm"><span className="text-muted">{t("auth.email")}: </span><a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent hover:underline">{CONTACT_EMAIL}</a></p> : null}
        </Card>
        <p className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted">
          <Link href="/about" className="hover:text-text hover:underline">{t("footer.about")}</Link>
          <Link href="/help" className="hover:text-text hover:underline">{t("footer.help")}</Link>
          <Link href="/contact" className="hover:text-text hover:underline">{t("footer.contact")}</Link>
          <Link href="/terms" className="hover:text-text hover:underline">{t("auth.termsLink")}</Link>
          <Link href="/privacy" className="hover:text-text hover:underline">{t("auth.privacyLink")}</Link>
        </p>
      </div>
    </div>
  );
}
