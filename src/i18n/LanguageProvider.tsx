"use client";
import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/types";
import { defaultLocale } from "./config";
import az from "./locales/az";
import tr from "./locales/tr";
import ru from "./locales/ru";
import en from "./locales/en";
import ka from "./locales/ka";

const dictionaries = { az, tr, ru, en, ka };
export type TranslationKey = keyof typeof az;
type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: TranslationKey) => string };
export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  useEffect(() => {
    const saved = window.localStorage.getItem("sitename-locale");
    if (saved && saved in dictionaries) setLocale(saved as Locale);
  }, []);
  useEffect(() => {
    window.localStorage.setItem("sitename-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key: TranslationKey) => dictionaries[locale][key],
  }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
