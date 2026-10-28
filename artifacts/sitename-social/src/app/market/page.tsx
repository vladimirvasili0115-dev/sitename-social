"use client";
import { useState } from "react";
import Link from "next/link";
import { Gamepad2, Lock } from "lucide-react";
import { useGifts } from "@/components/gifts/useGifts";
import { Price } from "@/components/gifts/Price";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { formatDay } from "@/lib/datetime";
import { COINS_PER_AZN, PAYMENTS_LIVE, TOPUP_MAX, TOPUP_MIN, TOPUP_PRESETS, startPayment } from "@/lib/payments";
import { cn } from "@/lib/utils";

const words = {
  az: { title: "Market", lead: "Balansını artır, sonra Spin the Bottle oyununun marketində bonus ürəklər al.", amount: "Məbləğ seç", other: "Digər", enter: "Məbləği yaz", youGet: "Balansına əlavə olunacaq", range: "Məbləğ {min} ₼ ilə {max} ₼ arasında olmalıdır.", soon: "Ödəniş Telegram botu (@Ravetill_bot) üzərindən edilir: kartı görəcək, çeki göndərəcəksiniz. Təsdiqdən sonra balans avtomatik artır.", fail: "Ödəniş başlamadı. Bir az sonra yenidən yoxla.", game: "Oyun marketinə keç", gameHint: "Oyundakı marketdə balansınla ürək paketləri ala bilərsən.", history: "Son artırmalar", none: "Hələ artırma yoxdur.", pay: "Ödə" },
  tr: { title: "Market", lead: "Bakiyeni artır, sonra Spin the Bottle oyununun marketinde bonus kalpler al.", amount: "Tutar seç", other: "Diğer", enter: "Tutarı yaz", youGet: "Bakiyene eklenecek", range: "Tutar {min} ₼ ile {max} ₼ arasında olmalı.", soon: "Ödeme Telegram botu (@Ravetill_bot) üzerinden yapılır: kartı görür, dekontu gönderirsin. Onaydan sonra bakiye otomatik artar.", fail: "Ödeme başlamadı. Biraz sonra tekrar dene.", game: "Oyun marketine git", gameHint: "Oyundaki marketten bakiyenle kalp paketleri alabilirsin.", history: "Son yüklemeler", none: "Henüz yükleme yok.", pay: "Öde" },
  ru: { title: "Маркет", lead: "Пополни баланс, затем покупай бонусные сердца в маркете игры Spin the Bottle.", amount: "Выбери сумму", other: "Другая", enter: "Введи сумму", youGet: "Будет добавлено на баланс", range: "Сумма должна быть от {min} ₼ до {max} ₼.", soon: "Оплата проходит через Telegram-бота (@Ravetill_bot): вы увидите карту и отправите чек. После подтверждения баланс пополнится автоматически.", fail: "Оплата не началась. Попробуй чуть позже.", game: "Перейти в маркет игры", gameHint: "В маркете игры можно покупать пакеты сердец за баланс.", history: "Последние пополнения", none: "Пополнений пока нет.", pay: "Оплатить" },
  en: { title: "Market", lead: "Top up your balance, then buy bonus hearts in the Spin the Bottle game market.", amount: "Choose an amount", other: "Other", enter: "Enter an amount", youGet: "Added to your balance", range: "The amount must be between {min} ₼ and {max} ₼.", soon: "Payment goes through the Telegram bot (@Ravetill_bot): you see the card and send the receipt. After approval the balance is topped up automatically.", fail: "The payment did not start. Try again in a moment.", game: "Go to the game market", gameHint: "In the game market you can buy heart packs with your balance.", history: "Recent top-ups", none: "No top-ups yet.", pay: "Pay" },
} as const;

export default function MarketPage() {
  const { t, locale } = useTranslation();
  const w = words[locale as keyof typeof words] ?? words.en;
  const { balance, transactions } = useGifts();
  const [preset, setPreset] = useState<number | "other">(TOPUP_PRESETS[1]);
  const [custom, setCustom] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "soon" | "fail">("idle");
  const typed = Number(custom.replace(",", "."));
  const amount = preset === "other" ? (Number.isFinite(typed) ? Math.round(typed * 100) / 100 : 0) : preset;
  const valid = amount >= TOPUP_MIN && amount <= TOPUP_MAX;
  const topups = transactions.filter((item) => item.type === "topup").slice(0, 8);
  async function pay() {
    if (!valid) return;
    setState("busy");
    const result = await startPayment(amount);
    setState(result === "redirect" ? "idle" : result);
  }
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 px-1">
        <h1 className="flex-1 text-[23px] font-semibold tracking-[-0.035em]">{w.title}</h1>
        <span className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm text-muted">{t("gifts.balance")}<Price value={balance} className="text-text" /></span>
      </div>
      <p className="mb-4 px-1 text-sm leading-6 text-muted">{w.lead}</p>
      <Card className="p-5">
        <p className="mb-2 text-xs font-medium text-muted">{w.amount}</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TOPUP_PRESETS.map((value) => (
            <li key={value}>
              <button onClick={() => setPreset(value)} aria-pressed={preset === value} className={cn("h-14 w-full rounded-xl border text-lg font-semibold tabular-nums", preset === value ? "border-accent bg-surface-2 text-accent" : "border-border hover:bg-surface-2")}>{value} ₼</button>
            </li>
          ))}
          <li>
            <button onClick={() => setPreset("other")} aria-pressed={preset === "other"} className={cn("h-14 w-full rounded-xl border text-lg font-semibold", preset === "other" ? "border-accent bg-surface-2 text-accent" : "border-border hover:bg-surface-2")}>{w.other}</button>
          </li>
        </ul>
        {preset === "other" ? (
          <div className="mt-3">
            <div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-surface-2 px-3">
              <input value={custom} onChange={(event) => setCustom(event.target.value.replace(/[^0-9.,]/g, "").slice(0, 7))} inputMode="decimal" autoFocus aria-label={w.enter} placeholder={w.enter} className="min-w-0 flex-1 bg-transparent text-base font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted" />
              <span className="text-base font-semibold text-muted">₼</span>
            </div>
            {custom && !valid ? <p role="alert" className="mt-1.5 text-xs text-danger">{w.range.replace("{min}", String(TOPUP_MIN)).replace("{max}", String(TOPUP_MAX))}</p> : null}
          </div>
        ) : null}
        <p className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-muted">{w.youGet}<Price value={valid ? Math.round(amount * COINS_PER_AZN) : 0} className="text-text" /></p>
        <p role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-xs leading-5 text-muted"><Lock size={15} className="mt-0.5 shrink-0 text-accent" />{w.soon}</p>
        {state === "fail" ? <p role="alert" className="mt-3 rounded-xl border border-danger p-3 text-xs text-danger">{w.fail}</p> : null}
        <Button className="mt-4 h-12 w-full disabled:opacity-50" disabled={!PAYMENTS_LIVE || state === "busy" || !valid} onClick={() => void pay()}>{w.pay} · {valid ? amount.toFixed(2) : "0.00"} ₼</Button>
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
