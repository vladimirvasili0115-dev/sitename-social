"use client";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { useTranslation } from "@/i18n/useTranslation";
import { AuthHero } from "./AuthHero";

export function AuthLayout({ title, subtitle, footer, children }: { title: string; subtitle: string; footer?: ReactNode; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-[100dvh] bg-bg text-text lg:grid-cols-[1.05fr_1fr]">
      <AuthHero />
      <div className="flex flex-col px-5 py-5 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Logo className="lg:invisible" />
          <LanguageSwitcher />
        </div>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">
            <h1 className="text-[28px] font-semibold tracking-[-0.035em]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
            <Card className="mt-7 p-5 sm:p-6">{children}</Card>
            {footer ? <p className="mt-6 text-center text-sm text-muted">{footer}</p> : null}
          </div>
        </main>
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
          <Link href="/terms" className="hover:text-text hover:underline">{t("auth.termsLink")}</Link>
          <Link href="/privacy" className="hover:text-text hover:underline">{t("auth.privacyLink")}</Link>
        </p>
      </div>
    </div>
  );
}
