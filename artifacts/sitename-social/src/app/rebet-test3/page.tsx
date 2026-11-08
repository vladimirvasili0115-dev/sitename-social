"use client";
// "Gizli rəğbət" demosunun telefon versiyası PC ekranında: 390×844 telefon çərçivəsində, ekran hündürlüyünə sığdırılır. Yalnız sahibə görünür.
import { useEffect, useState } from "react";
import { fetchIsOwner } from "@/lib/adminSync";

const W = 390;
const H = 844;

export default function RebetTest3Page() {
  const [owner, setOwner] = useState<boolean | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    void fetchIsOwner().then(setOwner).catch(() => setOwner(false));
  }, []);

  useEffect(() => {
    if (!owner) return;
    const fit = () => setScale(Math.min(1.3, (window.innerHeight - 40) / (H + 20), (window.innerWidth - 20) / (W + 20)));
    fit();
    window.addEventListener("resize", fit);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", fit);
      document.body.style.overflow = prev;
    };
  }, [owner]);

  if (owner === null) return <p className="p-6 text-sm text-muted">Yoxlanılır…</p>;
  if (!owner) return <p className="p-6 text-sm text-muted">Bu səhifə yalnız sahib üçündür.</p>;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#111]">
      <div style={{ width: (W + 20) * scale, height: (H + 20) * scale }}>
        <iframe
          src="/rebet/demo.html?site=1"
          title="Gizli rəğbət telefon"
          width={W}
          height={H}
          style={{ transform: `scale(${scale})`, transformOrigin: "0 0", border: "10px solid #000", borderRadius: 36, boxSizing: "content-box", background: "#0d0612" }}
        />
      </div>
      <a href="/rebet-test2" className="absolute left-4 top-4 rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white">💻 PC versiyası</a>
    </div>
  );
}
