"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_NAME } from "@/config/site";
import { legal, LEGAL_UPDATED } from "@/content/legal";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/components/auth/AuthProvider";

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const sections = legal[locale][kind];
  return (
    <div className="min-h-[100dvh] bg-bg px-4 py-5 text-text sm:px-8">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-6 flex items-center justify-between gap-4"><Link href={user ? "/feed" : "/login"}><Logo /></Link><LanguageSwitcher /></div>
        <Link href={user ? "/settings" : "/register"} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"><ArrowLeft size={15} />{t("messages.back")}</Link>
        <h1 className="text-[28px] font-semibold tracking-[-0.035em]">{t(kind === "terms" ? "auth.termsLink" : "auth.privacyLink")}</h1>
        <p className="mt-1 text-xs text-muted">{t("legal.updated")}: {LEGAL_UPDATED}</p>
        <Card className="mt-5 space-y-6 p-5 sm:p-7">
          {sections.map(([title, body], index) => (
            <section key={title}>
              <h2 className="text-base font-semibold">{index + 1}. {title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{body.replaceAll("{site}", SITE_NAME)}</p>
            </section>
          ))}
        </Card>
        <p className="mt-5 flex justify-center gap-4 text-xs text-muted">
          <Link href="/terms" className="hover:text-text hover:underline">{t("auth.termsLink")}</Link>
          <Link href="/privacy" className="hover:text-text hover:underline">{t("auth.privacyLink")}</Link>
        </p>
      </div>
    </div>
  );
}
