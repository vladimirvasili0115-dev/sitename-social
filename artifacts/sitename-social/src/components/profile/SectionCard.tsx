"use client";
import type { ReactNode } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";

export function SectionCard({ title, count, onSeeAll, children }: { title: string; count?: number; onSeeAll?: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Card className="mb-4 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}{count !== undefined ? <span className="ml-2 font-normal text-muted">{count}</span> : null}</h2>
        {onSeeAll ? <button onClick={onSeeAll} className="text-xs font-medium text-accent hover:underline">{t("common.seeAll")}</button> : null}
      </div>
      {children}
    </Card>
  );
}
