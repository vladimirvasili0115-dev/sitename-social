"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ShieldAlert } from "lucide-react";
import { useIsAdmin } from "@/components/report/useIsAdmin";
import { navigation } from "@/config/navigation";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { SearchInput } from "@/components/ui/SearchInput";

const tile = "flex min-h-[84px] flex-col items-start justify-between rounded-card border border-border bg-surface p-3.5 text-sm font-medium text-text hover:border-accent";

export default function MenuPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const admin = useIsAdmin();
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }
  return (
    <div>
      <h1 className="mb-4 px-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.menu")}</h1>
      <form onSubmit={handleSubmit} className="mb-4"><SearchInput value={query} onChange={setQuery} label={t("header.search")} /></form>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {navigation.map(({ key, href, icon: Icon }) => <li key={key}><Link href={href} className={tile}><Icon size={20} className="text-accent" />{t(key as TranslationKey)}</Link></li>)}
        <li><Link href="/notifications" className={tile}><Bell size={20} className="text-accent" />{t("header.notifications")}</Link></li>
        {admin ? <li><Link href="/admin" className={tile}><ShieldAlert size={20} className="text-accent" />{t("nav.admin")}</Link></li> : null}
      </ul>
    </div>
  );
}
