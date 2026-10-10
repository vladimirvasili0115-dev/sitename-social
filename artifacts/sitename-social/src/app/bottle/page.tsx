"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { BottleGame } from "@/components/bottle/BottleGame";

export default function BottlePage() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="mb-4 px-1 text-[23px] font-semibold tracking-[-0.035em]">{t("bottle.title")}</h1>
      <BottleGame />
    </div>
  );
}
