"use client";
import { useState, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { GameOrbit, GameStrip } from "./GameMarks";

// Sign-in pages: a full-screen photo of friends (public/custom/login-hero.jpg, a picture without any text on it),
// the headline over it and the form in a frosted card. Without the photo file the dark background with the Ravetill sign and the games around it is shown.
export function AuthLayout({ title, subtitle, footer, children }: { title: string; subtitle: string; footer?: ReactNode; children: ReactNode }) {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState(true);
  return (
    <div style={{ ["--text" as string]: "#FFFFFF" }} className="relative isolate min-h-[100dvh] overflow-hidden bg-[#1A0F26] text-white">
      {photo ? <img src="/custom/login-hero.jpg" alt="" aria-hidden="true" onError={() => setPhoto(false)} className="absolute inset-0 -z-20 h-full w-full object-cover" /> : null}
      <div aria-hidden="true" className={cn("absolute inset-0 -z-10", photo
        ? "bg-[linear-gradient(180deg,rgba(14,8,22,0.74)_0%,rgba(14,8,22,0.42)_40%,rgba(14,8,22,0.82)_100%)]"
        : "bg-[radial-gradient(ellipse_at_30%_55%,rgba(255,150,60,0.20),transparent_55%),radial-gradient(circle_at_12%_8%,rgba(255,77,141,0.22),transparent_45%),radial-gradient(circle_at_90%_95%,rgba(120,60,200,0.30),transparent_50%)]")} />
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1280px] flex-col px-5 py-5 sm:px-10">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <LanguageSwitcher />
        </header>
        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.15fr_420px] lg:gap-16">
          <section className="order-2 lg:order-1">
            <h2 className="max-w-[780px] text-[clamp(26px,4.2vw,58px)] font-extrabold leading-[1.08] tracking-[-0.02em] [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">{t("auth.photoTitle")}</h2>
            <p className="mt-4 text-[17px] font-semibold text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.5)] sm:text-xl">{t("auth.photoTagline")}</p>
            <GameStrip className={cn("mt-6 max-w-[720px]", photo ? "" : "lg:hidden")} />
            {photo ? null : <GameOrbit className="mt-2 hidden w-[min(100%,470px)] lg:block" />}
          </section>
          <div className="order-1 w-full max-w-[420px] justify-self-center text-text lg:order-2 lg:justify-self-end">
            <div className="rounded-2xl border border-white/25 bg-surface/95 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-6">
              <h1 className="text-[26px] font-semibold tracking-[-0.035em]">{title}</h1>
              <p className="mb-5 mt-1.5 text-sm leading-6 text-muted">{subtitle}</p>
              {children}
            </div>
            {footer ? <p className="mt-5 text-center text-sm text-white/85 [&_a]:font-semibold [&_a]:text-white [&_a]:underline">{footer}</p> : null}
          </div>
        </main>
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-white/70">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
          <Link href="/terms" className="hover:text-white hover:underline">{t("auth.termsLink")}</Link>
          <Link href="/privacy" className="hover:text-white hover:underline">{t("auth.privacyLink")}</Link>
        </p>
      </div>
    </div>
  );
}
