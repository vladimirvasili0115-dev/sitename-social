"use client";
import { useState } from "react";
import Link from "next/link";
import { Gamepad2, Lock } from "lucide-react";
import { DEFAULT_PACKAGE_ID } from "@/data/coins";
import { usePrices } from "@/components/gifts/usePrices";
import { useGifts } from "@/components/gifts/useGifts";
import { GiftArt, giftNames } from "@/components/gifts/GiftArt";
import { Price } from "@/components/gifts/Price";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { formatDay } from "@/lib/datetime";
import { PAYMENTS_LIVE, startPayment } from "@/lib/payments";
import { cn } from "@/lib/utils";

const words = {
  az: { title: "Market", lead: "Balansını artır, sonra Spin the Bottle oyununun marketində bonus ürəklər al.", soon: "Onlayn ödəniş tezliklə qoşulacaq. Hələlik balans yalnız ödəniş təsdiqi ilə artırılır.", fail: "Ödəniş başlamadı. Bir az sonra yenidən yoxla.", game: "Oyun marketinə keç", gameHint: "Oyundakı marketdə balansınla ürək paketləri ala bilərsən.", history: "Son artırmalar", none: "Hələ artırma yoxdur." },
  tr: { title: "Market", lead: "Bakiyeni artır, sonra Spin the Bottle oyununun marketinde bonus kalpler al.", soon: "Online ödeme yakında açılacak. Şimdilik bakiye yalnızca onaylanan ödemeyle artar.", fail: "Ödeme başlamadı. Biraz sonra tekrar dene.", game: "Oyun marketine git", gameHint: "Oyundaki marketten bakiyenle kalp paketleri alabilirsin.", history: "Son yüklemeler", none: "Henüz yükleme yok." },
  ru: { title: "Маркет", lead: "Пополни баланс, затем покупай бонусные сердца в маркете игры Spin the Bottle.", soon: "Онлайн-оплата скоро заработает. Пока баланс пополняется только после подтверждённой оплаты.", fail: "Оплата не началась. Попробуй чуть позже.", game: "Перейти в маркет игры", gameHint: "В маркете игры можно покупать пакеты сердец за баланс.", history: "Последние пополнения", none: "Пополнений пока нет." },
  en: { title: "Market", lead: "Top up your balance, then buy bonus hearts in the Spin the Bottle game market.", soon: "Online payment will be connected soon. For now the balance only grows with a confirmed payment.", fail: "The payment did not start. Try again in a moment.", game: "Go to the game market", gameHint: "In the game market you can buy heart packs with your balance.", history: "Recent top-ups", none: "No top-ups yet." },
} as const;

export default function MarketPage() {
  const { t, locale } = useTranslation();
  const w = words[locale as keyof typeof words] ?? words.en;
  const { balance, transactions } = useGifts();
  const { packages } = usePrices();
  const [packId, setPackId] = useState(DEFAULT_PACKAGE_ID);
  const [state, setState] = useState<"idle" | "busy" | "soon" | "fail">("idle");
  const pack = packages.find((item) => item.id === packId) ?? packages[0];
  const topups = transactions.filter((item) => item.type === "topup").slice(0, 8);
  async function pay() {
    if (!pack) return;
    setState("busy");
    const result = await startPayment(pack.id);
    setState(result === "redirect" ? "busy" : result);
  }
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 px-1">
        <h1 className="flex-1 text-[23px] font-semibold tracking-[-0.035em]">{w.title}</h1>
        <span className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm text-muted">{t("gifts.balance")}<Price value={balance} className="text-text" /></span>
      </div>
      <p className="mb-4 px-1 text-sm leading-6 text-muted">{w.lead}</p>
      <Card className="p-5">
        <p className="mb-2 text-xs font-medium text-muted">{t("gifts.choosePackage")}</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {packages.map((item) => (
            <li key={item.id}>
              <button onClick={() => setPackId(item.id)} aria-pressed={item.id === packId} className={cn("relative flex h-full w-full items-center gap-3 rounded-xl border p-3 text-left", item.id === packId ? "border-accent bg-surface-2" : "border-border hover:bg-surface-2")}>
                <GiftArt id={item.art} className="h-11 w-11 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] text-muted">{t(giftNames[item.art])}</span>
                  <Price value={item.coins + item.bonus} className="text-base text-text" />
                  <span className="block h-4 text-[11px] font-medium text-accent">{item.bonus ? `+${item.bonus} ${t("gifts.bonus")}` : ""}</span>
                  <span className="block text-sm font-semibold text-text">{item.price.toFixed(2)} AZN</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {state === "soon" || !PAYMENTS_LIVE ? <p role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-xs leading-5 text-muted"><Lock size={15} className="mt-0.5 shrink-0 text-accent" />{w.soon}</p> : null}
        {state === "fail" ? <p role="alert" className="mt-3 rounded-xl border border-danger p-3 text-xs text-danger">{w.fail}</p> : null}
        <Button className="mt-4 h-12 w-full disabled:opacity-50" disabled={!PAYMENTS_LIVE || state === "busy" || !pack} onClick={() => void pay()}>{t("gifts.pay")} · {pack ? pack.price.toFixed(2) : "0.00"} AZN</Button>
      </Card>
      <Card className="mt-4 flex flex-wrap items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFEDD5] text-[#EA580C]"><Gamepad2 size={20} /></span>
        <p className="min-w-0 flex-1 text-sm text-muted">{w.gameHint}</p>
        <Link href="/bottle/" className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-bg hover:brightness-110">{w.game}</Link>
      </Card>
      <Card className="mt-4 p-4">
        <h2 className="mb-2 text-sm font-semibold">{w.history}</h2>
        {topups.length ? <ul className="divide-y divide-border">{topups.map((item) => <li key={item.id} className="flex items-center justify-between py-2 text-sm"><span className="text-muted">{formatDay(item.at)}</span><Price value={item.amount} className="text-text" /></li>)}</ul> : <p className="text-sm text-muted">{w.none}</p>}
      </Card>
    </div>
  );
}
