"use client";

import { useEffect, useState } from "react";
import { bottlePromoOpen, bottlePromoState, type BottlePromo } from "@/lib/bottleSync";

// "Ayın son şansı": until 30.11.2026 23:59 (Baku) the window opens every time the player enters the game.
// The player opens one lucky ticket (the server picks the discount once); after that the window shows the discount and "Buy now".
// The discount itself is applied by the server on heart packs (paket-ME.sql); the shop only shows the lower price.

const words: Record<string, { tag: string; left: string; day: string; head: string; bonus: string; upTo: string; press: string; pressSub: string; hint: string; mine: string; hurry: string; buy: string; close: string; wait: string }> = {
  az: { tag: "AYIN SON ŞANSI", left: "Bitməsinə", day: "gün", head: "Ürək paketlərinə", bonus: "ENDİRİM", upTo: "60%-ə qədər", press: "BAS", pressSub: "uğurlu bileti aç", hint: "Bileti bas, şansını gör! Endirim 30 noyabr 23:59-a qədər keçərlidir.", mine: "Sənin endirimin", hurry: "Tələs! Balansını artır və indi al!", buy: "İndi al", close: "Bağla", wait: "Bilet açılır…" },
  ru: { tag: "ПОСЛЕДНИЙ ШАНС МЕСЯЦА", left: "До конца", day: "дн.", head: "На пакеты сердец", bonus: "СКИДКА", upTo: "до 60%", press: "ЖМИ", pressSub: "открой счастливый билет", hint: "Нажми на билет и узнай свою скидку! Действует до 30 ноября 23:59.", mine: "Твоя скидка", hurry: "Спеши! Пополни баланс и купи сейчас!", buy: "Купить", close: "Закрыть", wait: "Билет открывается…" },
  tr: { tag: "AYIN SON ŞANSI", left: "Bitmesine", day: "gün", head: "Kalp paketlerinde", bonus: "İNDİRİM", upTo: "%60'a kadar", press: "BAS", pressSub: "şanslı bileti aç", hint: "Bilete bas, şansını gör! İndirim 30 Kasım 23:59'a kadar geçerli.", mine: "Senin indirimin", hurry: "Acele et! Bakiyeni yükle ve hemen al!", buy: "Hemen al", close: "Kapat", wait: "Bilet açılıyor…" },
  en: { tag: "LAST CHANCE OF THE MONTH", left: "Ends in", day: "d", head: "On heart packs", bonus: "DISCOUNT", upTo: "up to 60%", press: "TAP", pressSub: "open your lucky ticket", hint: "Tap the ticket to see your discount! Valid until 30 November 23:59.", mine: "Your discount", hurry: "Hurry! Top up and buy now!", buy: "Buy now", close: "Close", wait: "Opening…" },
};
const w = (locale: string) => words[locale] ?? words.az;

function Ticket({ pct, x }: { pct: number | null; x: (typeof words)["az"] }) {
  return pct === null ? (
    <svg viewBox="0 0 220 150" className="h-full w-full" aria-hidden="true">
      <path d="M14 20h192v38a17 17 0 0 0 0 34v38H14V92a17 17 0 0 0 0-34z" fill="#FAC775" stroke="#BA7517" strokeWidth="3" />
      <rect x="30" y="34" width="160" height="82" rx="8" fill="none" stroke="#D85A30" strokeWidth="2.5" strokeDasharray="6 4" />
      <text x="110" y="74" textAnchor="middle" fontSize="28" fontWeight="800" fill="#712B13">{x.press}</text>
      <text x="110" y="97" textAnchor="middle" fontSize="12" fontWeight="600" fill="#993C1D">{x.pressSub}</text>
      <path d="M48 52c0-4 5-5 6-1 1-4 6-3 6 1 0 4-6 7-6 7s-6-3-6-7z M160 52c0-4 5-5 6-1 1-4 6-3 6 1 0 4-6 7-6 7s-6-3-6-7z" fill="#E24B4A" />
    </svg>
  ) : (
    <svg viewBox="0 0 220 150" className="h-full w-full animate-[promo-pop_0.5s_ease-out_both]" aria-hidden="true">
      <path d="M14 20h192v38a17 17 0 0 0 0 34v38H14V92a17 17 0 0 0 0-34z" fill="#3C3489" stroke="#FAC775" strokeWidth="3" />
      <text x="110" y="60" textAnchor="middle" fontSize="14" fontWeight="600" fill="#CECBF6">{x.mine}</text>
      <text x="110" y="106" textAnchor="middle" fontSize="46" fontWeight="800" fill="#FAC775">-{pct}%</text>
    </svg>
  );
}

export function PromoPopup({ locale, online, wide, onBuy, onPct }: { locale: string; online: boolean; wide: boolean; onBuy: () => void; onPct: (pct: number | null, end: number) => void }) {
  const x = w(locale);
  const [promo, setPromo] = useState<BottlePromo | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!online) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      void bottlePromoState().then((state) => {
        if (!alive || !state || Date.parse(state.end) <= Date.now()) return;
        setPromo(state);
        onPct(state.pct ?? null, Date.parse(state.end));
        setOpen(true);
      });
    }, 1500);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [online]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open]);
  if (!open || !promo) return null;
  const end = Date.parse(promo.end);
  if (now >= end) return null;
  let s = Math.floor((end - now) / 1000);
  const d = Math.floor(s / 86400); s %= 86400;
  const clock = `${d ? `${d} ${x.day} ` : ""}${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const pct = promo.pct;
  const take = async () => {
    if (pct !== null || busy) return;
    setBusy(true);
    const next = await bottlePromoOpen();
    setBusy(false);
    if (next) { setPromo(next); onPct(next.pct ?? null, Date.parse(next.end)); }
  };
  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center overflow-hidden bg-black/45 p-4" onClick={() => setOpen(false)}>
      {["12%", "70%", "40%", "86%"].map((left, i) => <span key={left} aria-hidden="true" className="pointer-events-none absolute top-0 text-lg motion-reduce:hidden" style={{ left, animation: `promo-leaf 5s linear ${i * 1.3}s infinite` }}>{i % 2 ? "🍁" : "🍂"}</span>)}
      <div role="dialog" aria-modal="true" aria-label={x.tag} onClick={(event) => event.stopPropagation()} className={`relative w-full overflow-hidden rounded-[18px] bg-white text-center shadow-2xl animate-[panel-drop_0.6s_cubic-bezier(0.22,1,0.36,1)] ${wide ? "max-w-[440px] px-6 py-5" : "max-w-[300px] px-4 py-4"}`}>
        <button type="button" onClick={() => setOpen(false)} aria-label={x.close} className="absolute right-2 top-2 z-[1] flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#97C459] bg-white text-base font-bold leading-none text-[#3B6D11]">×</button>
        <span className={`inline-block -rotate-3 rounded-lg bg-[#3C3489] px-2.5 py-0.5 font-bold text-[#FAC775] ${wide ? "text-sm" : "text-xs"}`}>{x.tag}</span>
        <p className="mt-1 text-xs tabular-nums text-[#888780]">{x.left}: {clock}</p>
        <p className={`mt-2.5 font-extrabold leading-tight text-[#26215C] ${wide ? "text-lg" : "text-[15px]"}`}>
          {x.head} <span className={wide ? "text-[30px]" : "text-[24px]"}>{x.bonus}</span> <span className={`text-[#D85A30] ${wide ? "text-[30px]" : "text-[24px]"}`}>{x.upTo}</span>
        </p>
        <div className={`relative mx-auto my-1.5 ${wide ? "h-[180px] w-[280px]" : "h-[150px] w-[220px]"}`}>
          <span aria-hidden="true" className="pointer-events-none absolute -inset-[30%] rounded-full opacity-35 motion-safe:animate-[spin_14s_linear_infinite]" style={{ background: "repeating-conic-gradient(#FAC775 0 10deg, transparent 10deg 20deg)" }} />
          <button type="button" onClick={() => void take()} disabled={busy} aria-label={pct === null ? x.pressSub : `${x.mine}: ${pct}%`} className={`relative block h-full w-full ${pct === null ? "motion-safe:animate-[promo-wobble_1.6s_ease-in-out_infinite]" : "cursor-default"}`}>
            <Ticket pct={pct} x={x} />
            {pct === null ? <span aria-hidden="true" className="pointer-events-none absolute -bottom-3 right-[26%] text-[34px] motion-safe:animate-[promo-tap_1s_ease-in-out_infinite]">👆</span> : null}
          </button>
        </div>
        {pct === null ? (
          <p className="text-xs font-semibold text-[#993C1D]">{busy ? x.wait : x.hint}</p>
        ) : (
          <>
            <p className="text-sm font-bold text-[#3B6D11]">{x.mine}: {pct}%</p>
            <p className="mt-0.5 text-xs font-semibold text-[#993C1D]">{x.hurry}</p>
            <button type="button" onClick={() => { setOpen(false); onBuy(); }} className="mt-2.5 rounded-[10px] bg-[#639922] px-6 py-2 text-sm font-bold text-white active:brightness-90">{x.buy}</button>
          </>
        )}
      </div>
    </div>
  );
}
