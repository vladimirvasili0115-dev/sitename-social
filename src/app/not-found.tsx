"use client";
import Link from "next/link";
import { Compass } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function NotFound() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 py-16 text-center text-text">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-accent"><Compass size={30} /></span>
      <p className="mt-5 text-5xl font-semibold tracking-[-0.04em] tabular-nums">404</p>
      <h1 className="mt-2 text-lg font-semibold">{t("notFound.title")}</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{t("notFound.text")}</p>
      <Link href={user ? "/feed" : "/login"} className="mt-6 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-bg hover:brightness-110">{t("notFound.home")}</Link>
    </div>
  );
}
