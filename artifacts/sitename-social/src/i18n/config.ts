import type { Locale } from "@/types";

export const locales: { code: Locale; nativeName: string; flag: string }[] = [
  { code: "az", nativeName: "Azərbaycan", flag: "🇦🇿" },
  { code: "tr", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "ru", nativeName: "Русский", flag: "🇷🇺" },
  { code: "en", nativeName: "English", flag: "🇬🇧" },
  { code: "ka", nativeName: "ქართული", flag: "🇬🇪" },
];
export const defaultLocale: Locale = "az";
