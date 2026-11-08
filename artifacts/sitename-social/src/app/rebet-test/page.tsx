"use client";
// "Gizli rəğbət" oyununun demosu: yalnız sahibə görünür. Demo özü /rebet/demo.html statik faylındadır.
import { useEffect, useState } from "react";
import { fetchIsOwner } from "@/lib/adminSync";

export default function RebetTestPage() {
  const [owner, setOwner] = useState<boolean | null>(null);

  useEffect(() => {
    void fetchIsOwner().then(setOwner).catch(() => setOwner(false));
  }, []);

  if (owner === null) return <p className="p-6 text-sm text-muted">Yoxlanılır…</p>;
  if (!owner) return <p className="p-6 text-sm text-muted">Bu səhifə yalnız sahib üçündür.</p>;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-[19px] font-semibold">Gizli rəğbət — demo</h1>
        <a href="/rebet/demo.html" target="_blank" rel="noopener" className="rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-sm">
          Tam ekranda aç
        </a>
      </div>
      <iframe src="/rebet/demo.html" title="Gizli rəğbət demo" className="h-[calc(100dvh-150px)] min-h-[620px] w-full rounded-2xl border border-border bg-[#0d0612]" />
    </div>
  );
}
