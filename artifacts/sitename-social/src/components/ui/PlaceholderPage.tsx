"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "./Card";

export function PlaceholderPage({ titleKey }: { titleKey: Parameters<ReturnType<typeof useTranslation>["t"]>[0] }) {
  const { t } = useTranslation();
  return <div className="mx-auto max-w-[620px]">
    <Card className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-accent">
        <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_7px_rgba(20,184,166,0.09)]" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">{t(titleKey)}</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{t("common.pageDescription")}</p>
    </Card>
  </div>;
}
