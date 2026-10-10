"use client";
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { REPORT_EVENT, sendReport, type ReportReason, type ReportTarget } from "@/lib/reportsSync";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

const reasons: { id: ReportReason; label: TranslationKey }[] = [
  { id: "spam", label: "report.reasonSpam" }, { id: "abuse", label: "report.reasonAbuse" }, { id: "adult", label: "report.reasonAdult" },
  { id: "fraud", label: "report.reasonFraud" }, { id: "other", label: "report.reasonOther" },
];

// One report window for the whole site; any button opens it through openReport().
export function ReportHost() {
  const { t } = useTranslation();
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TranslationKey | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onOpen = (event: Event) => {
      setTarget((event as CustomEvent<ReportTarget>).detail);
      setReason("spam");
      setNote("");
      setResult(null);
      setDone(false);
    };
    window.addEventListener(REPORT_EVENT, onOpen);
    return () => window.removeEventListener(REPORT_EVENT, onOpen);
  }, []);
  useEffect(() => {
    if (!target) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTarget(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target]);

  if (!target) return null;
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || busy) return;
    setBusy(true);
    const outcome = await sendReport(target, reason, note.trim());
    setBusy(false);
    setDone(outcome !== "failed");
    setResult(outcome === "ok" ? "report.thanks" : outcome === "duplicate" ? "report.duplicate" : "report.failed");
  }
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setTarget(null); }}>
      <Card role="dialog" aria-modal="true" aria-label={t("report.action")} className="w-full max-w-[440px] p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("report.action")}</h2>
          <IconButton aria-label={t("photos.close")} onClick={() => setTarget(null)}><X size={18} /></IconButton>
        </div>
        {done ? (
          <>
            <p role="status" className="py-6 text-center text-sm leading-6 text-text">{result ? t(result) : null}</p>
            <Button className="w-full" onClick={() => setTarget(null)}>{t("photos.close")}</Button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-3 text-sm text-muted">{t("report.hint")}</p>
            <div role="radiogroup" aria-label={t("report.hint")} className="space-y-1.5">
              {reasons.map((item) => (
                <button key={item.id} type="button" role="radio" aria-checked={reason === item.id} onClick={() => setReason(item.id)} className={cn("flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm", reason === item.id ? "border-accent bg-surface-2 text-text" : "border-border text-muted hover:text-text")}>
                  <span className={cn("h-3.5 w-3.5 shrink-0 rounded-full border", reason === item.id ? "border-accent bg-accent" : "border-border")} />{t(item.label)}
                </button>
              ))}
            </div>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} aria-label={t("report.note")} placeholder={t("report.note")} className="mt-3 w-full resize-none rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-sm leading-6 text-text outline-none placeholder:text-muted focus:border-accent" />
            {result ? <p role="alert" className="mt-2 text-sm text-danger">{t(result)}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="subtle" onClick={() => setTarget(null)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={busy} className="disabled:opacity-60">{t("report.send")}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
