"use client";
import { useCallback, useEffect, useState } from "react";
import { Crown, Lock, LockOpen } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { adminPlusTableDelete, adminPlusTablePass, adminPlusTables, type AdminPlusTable } from "@/lib/adminSync";
import { formatDay } from "@/lib/datetime";
import { cn } from "@/lib/utils";

// VIP+ tables stay on the server while the owner has VIP+ (even when nobody sits there). Here the admin sees them, sets a new password (a forgotten one) or deletes one.
export function PlusTablesCard() {
  const [tables, setTables] = useState<AdminPlusTable[] | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [sure, setSure] = useState<number | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => void adminPlusTables().then((value) => { if (Array.isArray(value)) setTables(value); }), []);
  useEffect(() => { load(); }, [load]);
  async function setPass(table: AdminPlusTable, password: string) {
    setBusy(table.id);
    const done = await adminPlusTablePass(table.id, password);
    setBusy(null);
    setNote(done === true ? { ok: true, text: password ? "Yeni parol qoyuldu." : "Parol götürüldü, masa açıqdır." } : { ok: false, text: "Alınmadı. paket-GM.sql işlədilib?" });
    setDrafts((value) => ({ ...value, [table.id]: "" }));
    load();
  }
  async function remove(table: AdminPlusTable) {
    if (sure !== table.id) return setSure(table.id);
    setSure(null);
    setBusy(table.id);
    const done = await adminPlusTableDelete(table.id);
    setBusy(null);
    setNote(done === true ? { ok: true, text: `Masa ${table.id} silindi.` } : { ok: false, text: "Silinmədi." });
    load();
  }
  return (
    <Card className="mb-4 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[#7C3AED]"><Crown size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">VIP+ masalar</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">VIP+ ilə açılan masalar sahibin VIP+ müddəti bitənədək serverdə qalır (boş olsa da). Burada parolu unudulmuş masaya yeni parol qoya və ya masanı silə bilərsən.</p>
        </div>
        <button type="button" onClick={load} className="h-8 shrink-0 rounded-lg border border-border px-2.5 text-xs font-medium text-muted hover:text-text">Yenilə</button>
      </div>
      {tables && !tables.length ? <p className="mt-3 text-xs text-muted">VIP+ masası yoxdur.</p> : null}
      <div className="mt-3 space-y-2">
        {(tables ?? []).map((table) => (
          <div key={table.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center gap-2 text-sm">
              {table.locked ? <Lock size={14} className="shrink-0 text-muted" /> : <LockOpen size={14} className="shrink-0 text-muted" />}
              <span className="min-w-0 flex-1 truncate font-semibold">Masa {table.id}</span>
              <span className="shrink-0 text-[11px] text-muted">{table.seated}/12 nəfər</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted">Sahib: {table.owner_name || "—"}{table.until ? ` · VIP+ bitir: ${formatDay(Date.parse(table.until))}` : " · VIP+ bitib"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input value={drafts[table.id] ?? ""} onChange={(event) => setDrafts((value) => ({ ...value, [table.id]: event.target.value.slice(0, 30) }))} placeholder="Yeni parol" autoComplete="off" className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 text-xs text-text outline-none placeholder:text-muted focus:border-accent" />
              <button type="button" disabled={busy === table.id || !(drafts[table.id] ?? "").trim()} onClick={() => void setPass(table, (drafts[table.id] ?? "").trim())} className="h-9 rounded-lg bg-accent px-3.5 text-xs font-semibold text-bg disabled:opacity-40">Qoy</button>
              {table.locked ? <button type="button" disabled={busy === table.id} onClick={() => void setPass(table, "")} className="h-9 rounded-lg border border-border px-3 text-xs font-semibold text-muted hover:bg-surface-2 disabled:opacity-40">Parolu götür</button> : null}
              <button type="button" disabled={busy === table.id} onClick={() => void remove(table)} className={cn("h-9 rounded-lg border border-danger px-3 text-xs font-semibold disabled:opacity-40", sure === table.id ? "bg-danger text-bg" : "text-danger hover:bg-surface-2")}>{sure === table.id ? "Əminsən? Sil" : "Masanı sil"}</button>
            </div>
          </div>
        ))}
      </div>
      {note ? <p role="status" className={cn("mt-2 text-xs font-semibold", note.ok ? "text-accent" : "text-danger")}>{note.text}</p> : null}
    </Card>
  );
}
