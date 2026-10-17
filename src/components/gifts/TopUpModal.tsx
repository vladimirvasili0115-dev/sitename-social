"use client";
import { useEffect, useState } from "react";
import { FlaskConical, PartyPopper, X } from "lucide-react";
import { DEFAULT_PACKAGE_ID, type CoinPackage } from "@/data/coins";
import { usePrices } from "./usePrices";
import { supabase } from "@/lib/supabase";

// Until a payment provider is connected, coins are only credited by the site owner.
const paymentsOpen = !supabase;
import { useTranslation } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { GiftArt, giftNames } from "./GiftArt";
import { Price } from "./Price";

export function TopUpModal({ onPay, onClose }: { onPay: (pack: CoinPackage) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const { packages: coinPackages } = usePrices();
  const [packId, setPackId] = useState(DEFAULT_PACKAGE_ID);
  const [done, setDone] = useState(false);
  const pack = coinPackages.find((item) => item.id === packId) ?? coinPackages[0];
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation(); // when opened on top of the game, Escape closes only this window
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Card role="dialog" aria-modal="true" aria-label={t("gifts.topUp")} className="flex max-h-[94dvh] w-full max-w-[520px] flex-col rounded-b-none sm:rounded-b-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold">{t("gifts.topUp")}</h2>
          <IconButton aria-label={t("photos.close")} onClick={onClose}><X size={18} /></IconButton>
        </div>
        {done ? (
          <div role="status" className="p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-base font-semibold text-accent"><PartyPopper size={18} />{t("gifts.paid")}</p>
            <p className="mt-2"><Price value={pack.coins + pack.bonus} className="text-lg text-text" /></p>
            <Button className="mt-5 w-full" onClick={onClose}>{t("photos.close")}</Button>
          </div>
        ) : (
          <div className="overflow-y-auto p-5">
            <p className="mb-2 text-xs font-medium text-muted">{t("gifts.choosePackage")}</p>
            <ul className="grid grid-cols-2 gap-3">
              {coinPackages.map((item) => {
                const total = item.coins + item.bonus;
                return (
                  <li key={item.id}>
                    <button onClick={() => setPackId(item.id)} aria-pressed={item.id === packId} className={cn("relative flex h-full w-full items-center gap-3 rounded-xl border p-3 text-left", item.id === packId ? "border-accent bg-surface-2" : "border-border hover:bg-surface-2")}>
                      {item.badge ? <span className={cn("absolute -top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold", item.badge === "best" ? "bg-[#E7B93C] text-[#1A1405]" : "bg-accent text-bg")}>{t(item.badge === "best" ? "gifts.badgeBest" : "gifts.badgePopular")}</span> : null}
                      <GiftArt id={item.art} className="h-11 w-11 shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate text-[11px] text-muted">{t(giftNames[item.art])}</span>
                        <Price value={total} className="text-base text-text" />
                        <span className="block h-4 text-[11px] font-medium text-accent">{item.bonus ? `+${item.bonus} ${t("gifts.bonus")}` : ""}</span>
                        <span className="block text-sm font-semibold text-text">{item.price.toFixed(2)} AZN</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-xs leading-5 text-muted"><FlaskConical size={15} className="mt-0.5 shrink-0 text-accent" />{t(paymentsOpen ? "gifts.testMode" : "gifts.paySoon")}</p>
            <Button className="mt-4 h-12 w-full disabled:opacity-50" disabled={!paymentsOpen} onClick={() => { onPay(pack); setDone(true); }}>{t("gifts.pay")} · {pack.price.toFixed(2)} AZN</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
