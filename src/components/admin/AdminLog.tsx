"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { fetchLog, type LogEntry } from "@/lib/adminSync";
import { formatClock, formatDay } from "@/lib/datetime";
import { userHref } from "@/lib/links";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const labels: Record<string, TranslationKey> = {
  ban: "admin.logBan", unban: "admin.logUnban", coins: "admin.logCoins", hearts: "admin.logHearts", delete_user: "admin.logDeleteUser", delete_post: "admin.logDeletePost",
  delete_comment: "admin.logDeleteComment", delete_video: "admin.logDeleteVideo", delete_track: "admin.logDeleteTrack", delete_group: "admin.logDeleteGroup",
  dismiss_report: "admin.logDismiss", moderator_on: "admin.makeModerator", moderator_off: "admin.removeModerator", notice_on: "admin.logNoticeOn",
  notice_off: "admin.logNoticeOff", word_add: "admin.logWordAdd", word_remove: "admin.logWordRemove", price: "admin.logPrice", verify_on: "admin.verify", verify_off: "admin.unverify", welcome_on: "admin.logWelcomeOn", welcome_off: "admin.logWelcomeOff",
};

export function AdminLog() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const load = useCallback(() => void fetchLog().then((list) => setEntries(list ?? [])), []);
  useEffect(() => load(), [load]);
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="px-1 text-xs text-muted">{t("admin.logHint")}</p>
        <Button variant="outline" className="h-10 shrink-0 px-3 text-xs" onClick={load}><RefreshCw size={14} />{t("admin.refresh")}</Button>
      </div>
      {entries === null ? null : entries.length ? (
        <Card className="divide-y divide-border">
          {entries.map((entry) => (
            <div key={entry.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                <span className="font-semibold">{entry.admin || "—"}</span>
                <span className="text-muted">{labels[entry.action] ? t(labels[entry.action]) : entry.action}</span>
                {entry.target ? (entry.targetId ? <Link href={userHref(entry.targetId)} className="font-medium text-accent hover:underline">{entry.target}</Link> : <span className="font-medium">{entry.target}</span>) : null}
                <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted">{formatDay(entry.at)} · {formatClock(entry.at)}</span>
              </div>
              {entry.details ? <p className="mt-1 break-words text-xs leading-5 text-muted">{entry.details}</p> : null}
            </div>
          ))}
        </Card>
      ) : <Card className="p-8 text-center text-sm text-muted">{t("admin.emptyContent")}</Card>}
    </>
  );
}
