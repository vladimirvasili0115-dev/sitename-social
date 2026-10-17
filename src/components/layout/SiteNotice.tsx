"use client";
import { useEffect, useState } from "react";
import { Info, TriangleAlert, X } from "lucide-react";
import { fetchNotice, type SiteNotice as Notice } from "@/lib/adminSync";
import { useTranslation } from "@/i18n/useTranslation";

const KEY = "sitename-notice-closed";

// Announcement written in the admin panel. Closing it hides that version only; a new announcement shows again.
export function SiteNotice() {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [closed, setClosed] = useState<string | null>(null);
  useEffect(() => {
    try {
      setClosed(window.localStorage.getItem(KEY));
    } catch {
      // Storage blocked: the notice simply shows on every visit.
    }
    const load = () => void fetchNotice().then(setNotice);
    load();
    const timer = window.setInterval(load, 5 * 60_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!notice?.active || !notice.body || closed === notice.updatedAt) return null;
  const warning = notice.kind === "warning";
  const Icon = warning ? TriangleAlert : Info;
  function close() {
    if (!notice) return;
    setClosed(notice.updatedAt);
    try {
      window.localStorage.setItem(KEY, notice.updatedAt);
    } catch {
      // Storage blocked: closed for this visit only.
    }
  }
  return (
    <div role="status" className={`border-b ${warning ? "border-danger" : "border-border"} bg-surface`}>
      <div className="mx-auto flex max-w-[1160px] items-start gap-3 px-4 py-2.5 md:px-6">
        <Icon size={17} className={`mt-0.5 shrink-0 ${warning ? "text-danger" : "text-accent"}`} />
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-text">{notice.body}</p>
        <button onClick={close} aria-label={t("photos.close")} title={t("photos.close")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text"><X size={15} /></button>
      </div>
    </div>
  );
}
