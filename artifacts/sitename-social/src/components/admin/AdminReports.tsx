"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Check, RefreshCw, Trash2 } from "lucide-react";
import { fetchReports, resolveReport, type Report, type ReportAction } from "@/lib/reportsSync";
import { userHref } from "@/lib/links";
import { formatClock, formatDay } from "@/lib/datetime";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const typeLabel: Record<Report["type"], TranslationKey> = { post: "admin.typePost", comment: "admin.typeComment", video: "admin.typeVideo", user: "admin.typeUser" };
const reasonLabel: Record<Report["reason"], TranslationKey> = { spam: "report.reasonSpam", abuse: "report.reasonAbuse", adult: "report.reasonAdult", fraud: "report.reasonFraud", other: "report.reasonOther" };

export function AdminReports() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: ReportAction } | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => void fetchReports().then((list) => setReports(list ?? [])), []);
  useEffect(() => load(), [load]);

  async function act(report: Report, action: ReportAction) {
    if (action !== "dismiss" && (confirm?.id !== report.id || confirm.action !== action)) return setConfirm({ id: report.id, action });
    setConfirm(null);
    setBusy(report.id);
    setFailed(false);
    const done = await resolveReport(report, action);
    setBusy(null);
    if (!done) return setFailed(true);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button variant="outline" className="h-10 px-3 text-xs" onClick={load}><RefreshCw size={14} />{t("admin.refresh")}</Button></div>
      {failed ? <p role="alert" className="mb-3 rounded-xl border border-danger px-4 py-2.5 text-sm text-danger">{t("report.failed")}</p> : null}
      {reports === null ? null : reports.length ? (
        <ul className="space-y-3">
          {reports.map((report) => {
            const asking = confirm?.id === report.id ? confirm.action : null;
            return (
              <li key={report.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span className="rounded-full border border-border px-2 py-0.5 font-semibold text-text">{t(typeLabel[report.type])}</span>
                    <span className="rounded-full border border-danger px-2 py-0.5 font-semibold text-danger">{t(reasonLabel[report.reason])}</span>
                    <span className="ml-auto tabular-nums">{formatDay(report.at)} · {formatClock(report.at)}</span>
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="text-muted">{t("admin.owner")}: </span>
                    <Link href={userHref(report.ownerId)} className="font-semibold hover:underline">{report.owner?.user.name ?? report.ownerId.slice(0, 8)}</Link>
                  </p>
                  {report.snapshot && report.type !== "user" ? <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm leading-6 text-text">{report.snapshot}</p> : null}
                  {report.mediaUrl ? (report.type === "video"
                    ? <video src={report.mediaUrl} controls preload="metadata" className="mt-2 max-h-[260px] w-full rounded-xl bg-bg" />
                    : <img src={report.mediaUrl} alt="" className="mt-2 max-h-[260px] rounded-xl object-contain" />) : null}
                  {report.note ? <p className="mt-2 text-sm leading-6 text-muted">“{report.note}”</p> : null}
                  <p className="mt-2 text-xs text-muted">{t("admin.reporter")}: {report.reporter ? <Link href={userHref(report.reporter.user.id)} className="hover:underline">{report.reporter.user.name}</Link> : "—"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" className="h-9 px-3 text-xs" disabled={busy === report.id} onClick={() => void act(report, "dismiss")}><Check size={14} />{t("admin.dismiss")}</Button>
                    {report.type === "user" ? null : <button disabled={busy === report.id} onClick={() => void act(report, "delete")} className={`inline-flex h-9 items-center gap-2 rounded-xl border border-danger px-3 text-xs font-semibold ${asking === "delete" ? "bg-danger text-bg" : "text-danger hover:bg-surface-2"}`}><Trash2 size={14} />{t(asking === "delete" ? "admin.confirm" : "admin.delete")}</button>}
                    <button disabled={busy === report.id} onClick={() => void act(report, "ban")} className={`inline-flex h-9 items-center gap-2 rounded-xl border border-danger px-3 text-xs font-semibold ${asking === "ban" ? "bg-danger text-bg" : "text-danger hover:bg-surface-2"}`}><Ban size={14} />{t(asking === "ban" ? "admin.confirm" : "admin.ban")}</button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("admin.empty")}</Card>}
    </div>
  );
}
