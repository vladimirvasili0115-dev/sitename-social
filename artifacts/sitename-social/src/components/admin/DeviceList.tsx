"use client";

import { useEffect, useState } from "react";
import { adminDeviceBan, adminDevices, type DeviceRow } from "@/lib/deviceSync";

// Owner and moderators only (the server answers nobody else): the phones and browsers an account used,
// the other accounts seen on the same device, and the "block device" button. Used in the game's IP window and in the admin panel.
export function DeviceList({ userId }: { userId: string }) {
  const [rows, setRows] = useState<DeviceRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const load = () => { void adminDevices(userId).then((list) => setRows(list ?? [])); };
  useEffect(() => { setRows(null); setNote(""); load(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const anyBanned = Boolean(rows?.some((row) => row.banned));
  const toggle = async () => {
    if (!rows?.length || busy) return;
    const on = !anyBanned;
    if (on && !window.confirm(`Bu oyunçunun ${rows.length} cihazı bloklansın? Bu cihazlardan girən istənilən hesab avtomatik bloklanacaq.`)) return;
    setBusy(true);
    const count = await adminDeviceBan(userId, on);
    setBusy(false);
    setNote(count === null ? "Alınmadı" : on ? `${count} cihaz bloklandı` : `${count} cihazın bloku götürüldü`);
    load();
  };

  if (rows === null) return <p className="py-2 text-center text-[12px] text-[#6B7280]">…</p>;
  return (
    <div className="mt-3 border-t border-black/10 pt-3">
      <div className="mb-1.5 flex items-center gap-2">
        <p className="min-w-0 flex-1 text-[13px] font-black">Cihazlar ({rows.length})</p>
        {rows.length ? (
          <button type="button" onClick={() => void toggle()} disabled={busy} className={`shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-bold text-white disabled:opacity-60 ${anyBanned ? "bg-[#6B7280]" : "bg-[#DC2626]"}`}>
            {anyBanned ? "Cihaz blokunu götür" : "Cihazı blokla"}
          </button>
        ) : null}
      </div>
      {note ? <p role="status" className="mb-1.5 text-[12px] font-bold text-[#047857]">{note}</p> : null}
      {rows.length === 0 ? <p className="text-[12px] text-[#6B7280]">Hələ qeyd olunmuş cihaz yoxdur (yenilənmədən sonra ilk girişdə yazılacaq).</p> : (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li key={row.device} className={`rounded-lg px-2.5 py-1.5 ${row.banned ? "bg-[#FEE2E2]" : "bg-[#F5F5F5]"}`}>
              <p className="text-[13px] font-bold">
                {row.kind === "app" ? "📱 Tətbiq" : "🌐 Brauzer"} · {row.info.model || "model bilinmir"}
                {row.banned ? <span className="ml-1 text-[#B91C1C]">· BLOKDA</span> : null}
              </p>
              <p className="text-[11px] text-[#6B7280]">
                {[row.info.screen, row.info.lang, row.info.tz, row.info.platform].filter(Boolean).join(" · ")}
              </p>
              <p className="text-[11px] text-[#6B7280]">
                {row.ip ? <span className="font-mono">{row.ip}</span> : null} · {new Date(row.last_at).toLocaleString()}
              </p>
              <p className="font-mono text-[10px] text-[#9CA3AF]">{row.device.slice(0, 24)}</p>
              {row.others.length ? (
                <p className="mt-0.5 text-[11px] font-bold text-[#B91C1C]">
                  Bu cihazdan digər hesablar: {row.others.map((other) => `${other.name || other.handle || other.id.slice(0, 8)}${other.banned ? " (blokda)" : ""}`).join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
