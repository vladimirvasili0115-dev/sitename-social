"use client";
// "Gizli rəğbət" demosu bütün ekranda (saytın menyusu və boşluqları olmadan). Yalnız sahibə görünür.
import { useEffect, useState } from "react";
import { fetchIsOwner } from "@/lib/adminSync";

export default function RebetTest2Page() {
  const [owner, setOwner] = useState<boolean | null>(null);

  useEffect(() => {
    void fetchIsOwner().then(setOwner).catch(() => setOwner(false));
  }, []);

  // Oyun açıq olanda arxadakı səhifə sürüşməsin.
  useEffect(() => {
    if (!owner) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [owner]);

  if (owner === null) return <p className="p-6 text-sm text-muted">Yoxlanılır…</p>;
  if (!owner) return <p className="p-6 text-sm text-muted">Bu səhifə yalnız sahib üçündür.</p>;

  return <iframe src="/rebet/demo.html?site=1" title="Gizli rəğbət" className="fixed inset-0 z-[1000] h-[100dvh] w-screen border-0 bg-[#0d0612]" />;
}
