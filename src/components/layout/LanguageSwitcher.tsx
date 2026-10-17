"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { locales } from "@/i18n/config";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ up = false }: { up?: boolean }) {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = locales.find((item) => item.code === locale) ?? locales[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={t("header.language")} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-sm text-text hover:bg-surface-2 sm:px-3">
        <Languages size={15} className="hidden text-muted sm:block" />
        <span>{selected.flag}</span><span className="uppercase">{selected.code}</span>
        <ChevronDown size={14} className={cn("text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <ul role="listbox" aria-label={t("header.language")} className={cn("absolute z-50 w-48 rounded-xl border border-border bg-surface p-1.5", up ? "bottom-12 left-0 sm:left-auto sm:right-0" : "right-0 top-12")}>
          {locales.map((item) => (
            <li key={item.code} role="option" aria-selected={item.code === locale}>
              <button type="button" onClick={() => { setLocale(item.code); setOpen(false); }} className={cn("flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm", item.code === locale ? "text-accent" : "text-text hover:bg-surface-2")}>
                <span>{item.flag}</span>
                <span className="flex-1">{item.nativeName}</span>
                {item.code === locale ? <Check size={15} /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
