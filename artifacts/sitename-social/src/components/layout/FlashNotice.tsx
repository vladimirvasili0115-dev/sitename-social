"use client";
import { useEffect, useState } from "react";
import { FLASH_EVENT } from "@/lib/flash";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";

export function FlashNotice() {
  const { t } = useTranslation();
  const [key, setKey] = useState<TranslationKey | null>(null);
  useEffect(() => {
    let timer = 0;
    const onFlash = (event: Event) => {
      setKey((event as CustomEvent<TranslationKey>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setKey(null), 4500);
    };
    window.addEventListener(FLASH_EVENT, onFlash);
    return () => {
      window.removeEventListener(FLASH_EVENT, onFlash);
      window.clearTimeout(timer);
    };
  }, []);
  if (!key) return null;
  return <p role="alert" className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-[420px] rounded-xl border border-danger bg-surface px-4 py-3 text-center text-sm text-text shadow-lg lg:bottom-8">{t(key)}</p>;
}
