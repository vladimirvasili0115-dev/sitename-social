"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, RefreshCw } from "lucide-react";
import { fetchGrantReport, type GrantReportRow } from "@/lib/adminSync";
import { formatClock } from "@/lib/datetime";
import { userHref } from "@/lib/links";
import { formatManat } from "@/components/gifts/Price";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Owner only: how many bonus hearts and how much manat each moderator gave to whom on one day (Baku time).
// The server refuses moderators too (admin_grant_report checks is_owner()).
function bakuToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Baku", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function shiftDay(day: string, by: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + by);
  return date.toISOString().slice(0, 10);
}
const num = (value: number) => value.toLocaleString("en-US");

export function AdminGrants() {
  const [day, setDay] = useState(bakuToday);
  const [rows, setRows] = useState<GrantReportRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => {
    setRows(null);
    void fetchGrantReport(day).then((list) => { setFailed(list === null); setRows(list ?? []); });
  }, [day]);
  useEffect(() => load(), [load]);
  const today = bakuToday();
  const groups: { adminId: string; admin: string; rows: GrantReportRow[] }[] = [];
  for (const row of rows ?? []) {
    const group = groups.find((item) => item.adminId === row.adminId);
    if (group) group.rows.push(row);
    else groups.push({ adminId: row.adminId, admin: row.admin, rows: [row] });
  }
  const sum = (list: GrantReportRow[], key: "heartsPlus" | "heartsMinus" | "coinsPlus" | "coinsMinus") => list.reduce((total, row) => total + row[key], 0);
  const amounts = (hp: number, hm: number, cp: number, cm: number) => (
    <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-xs font-semibold tabular-nums">
      {hp || hm ? <span className="inline-flex items-center gap-1 text-[#F4511E]"><Heart size={12} fill="currentColor" />{hp ? `+${num(hp)}` : ""}{hp && hm ? " / " : ""}{hm ? <span className="text-danger">−{num(hm)}</span> : ""}</span> : null}
      {cp || cm ? <span className="text-accent">{cp ? `+${formatManat(cp)}` : ""}{cp && cm ? " / " : ""}{cm ? <span className="text-danger">−{formatManat(cm)}</span> : ""}</span> : null}
    </span>
  );
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-10 w-10 shrink-0 px-0" onClick={() => setDay((value) => shiftDay(value, -1))} aria-label="Əvvəlki gün"><ChevronLeft size={16} /></Button>
        <input type="date" value={day} max={today} onChange={(event) => { if (event.target.value) setDay(event.target.value); }} aria-label="Gün" className="h-10 rounded-xl border border-border bg-surface-2 px-3 text-sm tabular-nums text-text outline-none focus:border-accent" />
        <Button variant="outline" className="h-10 w-10 shrink-0 px-0" disabled={day >= today} onClick={() => setDay((value) => shiftDay(value, 1))} aria-label="Növbəti gün"><ChevronRight size={16} /></Button>
        <Button variant="outline" className="ml-auto h-10 shrink-0 px-3 text-xs" onClick={load}><RefreshCw size={14} />Yenilə</Button>
        <p className="basis-full px-1 text-xs text-muted">Moderatorların seçilən gündə (Bakı vaxtı) kimə nə qədər bonus ❤️ və manat yüklədiyi. Mənfi rəqəm götürülən məbləğdir. Bunu yalnız sən görürsən.</p>
      </div>
      {failed ? <p role="alert" className="mb-3 rounded-xl border border-danger px-4 py-2.5 text-sm text-danger">Yüklənmədi. paket-LM.sql işlədilibmi?</p> : null}
      {rows === null ? null : groups.length ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.adminId} className="divide-y divide-border">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link href={userHref(group.adminId)} className="font-semibold hover:underline">{group.admin || "—"}</Link>
                {amounts(sum(group.rows, "heartsPlus"), sum(group.rows, "heartsMinus"), sum(group.rows, "coinsPlus"), sum(group.rows, "coinsMinus"))}
              </div>
              {group.rows.map((row) => (
                <div key={row.targetId ?? row.target} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    {row.targetId ? <Link href={userHref(row.targetId)} className="font-medium text-accent hover:underline">{row.target || "—"}</Link> : <span className="font-medium">{row.target || "—"}</span>}
                    <span className="ml-2 text-[11px] tabular-nums text-muted">{row.times} dəfə · son {formatClock(row.lastAt)}</span>
                  </span>
                  {amounts(row.heartsPlus, row.heartsMinus, row.coinsPlus, row.coinsMinus)}
                </div>
              ))}
            </Card>
          ))}
        </div>
      ) : <Card className="p-8 text-center text-sm text-muted">Bu tarixdə moderatorlar heç nə yükləməyib.</Card>}
    </>
  );
}
