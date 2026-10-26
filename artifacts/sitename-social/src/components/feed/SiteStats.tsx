"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { supabase } from "@/lib/supabase";

// Right column of the home page: only two numbers (nobody's name is shown). They are read from the database
// when the page opens, every 30 seconds, and when the tab comes back into view.
const ONLINE_WINDOW = 3 * 60_000;
const words = {
  az: { online: "İndi onlayn", registered: "Qeydiyyatdan keçən", people: "nəfər" },
  en: { online: "Online now", registered: "Registered", people: "people" },
  ru: { online: "Сейчас онлайн", registered: "Зарегистрировано", people: "чел." },
  tr: { online: "Şu an çevrimiçi", registered: "Kayıtlı üye", people: "kişi" },
  ka: { online: "ახლა ონლაინ", registered: "რეგისტრირებული", people: "ადამიანი" },
} as const;

export function SiteStats() {
  const { locale } = useTranslation();
  const w = words[locale as keyof typeof words] ?? words.az;
  const [counts, setCounts] = useState<{ total: number; online: number } | null>(null);
  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    let live = true;
    const load = async () => {
      const since = new Date(Date.now() - ONLINE_WINDOW).toISOString();
      const [all, now] = await Promise.all([
        db.from("profiles").select("id", { count: "exact", head: true }),
        db.from("profiles").select("id", { count: "exact", head: true }).gte("last_seen", since),
      ]);
      if (live && all.count !== null && now.count !== null) setCounts({ total: all.count, online: now.count });
    };
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30_000);
    const onShow = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onShow);
    return () => { live = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", onShow); };
  }, []);
  const num = (value?: number) => (value === undefined ? "—" : value.toLocaleString("ru-RU"));
  return <aside className="hidden w-[240px] shrink-0 xl:block">
    <div className="sticky top-[96px] space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="flex items-center gap-2 text-xs font-semibold text-muted"><span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />{w.online}</p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">{num(counts?.online)} <span className="text-xs font-semibold text-muted">{w.people}</span></p>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted">{w.registered}</p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">{num(counts?.total)} <span className="text-xs font-semibold text-muted">{w.people}</span></p>
      </section>
    </div>
  </aside>;
}
