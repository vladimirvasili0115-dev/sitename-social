"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Gamepad2, Lock } from "lucide-react";
import { useGifts } from "@/components/gifts/useGifts";
import { Price } from "@/components/gifts/Price";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/useTranslation";
import { formatDay } from "@/lib/datetime";
import { COINS_PER_AZN, PAYMENTS_LIVE, RECEIPT_MAX_BYTES, TOPUP_MAX, TOPUP_MIN, TOPUP_PRESETS, cancelPayRequest, createPayRequest, getPayCard, loadPayRequest, sendReceipt, type PayCard, type PayMethod, type PayRequest } from "@/lib/payments";
import { refreshGifts } from "@/lib/giftsSync";
import { cn } from "@/lib/utils";

const words = {
  az: { title: "Market", lead: "Balansını artır, sonra Spin the Bottle oyununun marketində bonus ürəklər al.", amount: "Məbləğ seç", other: "Digər", enter: "Məbləği yaz", youGet: "Balansına əlavə olunacaq", range: "Məbləğ {min} ₼ ilə {max} ₼ arasında olmalıdır.", soon: "Ödəniş kartla edilir: «Ödə» düyməsindən sonra kartın nömrəsini görəcək, köçürüb çekin şəklini yükləyəcəksən. Təsdiqdən sonra balans avtomatik artır.", fail: "Ödəniş başlamadı. Bir az sonra yenidən yoxla.", game: "Oyun marketinə keç", gameHint: "Oyundakı marketdə balansınla ürək paketləri ala bilərsən.", history: "Son artırmalar", none: "Hələ artırma yoxdur.", pay: "Ödə" },
  tr: { title: "Market", lead: "Bakiyeni artır, sonra Spin the Bottle oyununun marketinde bonus kalpler al.", amount: "Tutar seç", other: "Diğer", enter: "Tutarı yaz", youGet: "Bakiyene eklenecek", range: "Tutar {min} ₼ ile {max} ₼ arasında olmalı.", soon: "Ödeme kartla yapılır: «Öde» düğmesinden sonra kart numarasını görür, havale edip dekontun fotoğrafını yüklersin. Onaydan sonra bakiye otomatik artar.", fail: "Ödeme başlamadı. Biraz sonra tekrar dene.", game: "Oyun marketine git", gameHint: "Oyundaki marketten bakiyenle kalp paketleri alabilirsin.", history: "Son yüklemeler", none: "Henüz yükleme yok.", pay: "Öde" },
  ru: { title: "Маркет", lead: "Пополни баланс, затем покупай бонусные сердца в маркете игры Spin the Bottle.", amount: "Выбери сумму", other: "Другая", enter: "Введи сумму", youGet: "Будет добавлено на баланс", range: "Сумма должна быть от {min} ₼ до {max} ₼.", soon: "Оплата картой: после кнопки «Оплатить» ты увидишь номер карты, переведёшь деньги и загрузишь фото чека. После подтверждения баланс пополнится автоматически.", fail: "Оплата не началась. Попробуй чуть позже.", game: "Перейти в маркет игры", gameHint: "В маркете игры можно покупать пакеты сердец за баланс.", history: "Последние пополнения", none: "Пополнений пока нет.", pay: "Оплатить" },
  en: { title: "Market", lead: "Top up your balance, then buy bonus hearts in the Spin the Bottle game market.", amount: "Choose an amount", other: "Other", enter: "Enter an amount", youGet: "Added to your balance", range: "The amount must be between {min} ₼ and {max} ₼.", soon: "Payment is by card: after “Pay” you see the card number, transfer the money and upload the receipt photo. After approval the balance is credited automatically.", fail: "The payment did not start. Try again in a moment.", game: "Go to the game market", gameHint: "In the game market you can buy heart packs with your balance.", history: "Recent top-ups", none: "No top-ups yet.", pay: "Pay" },
} as const;

// Texts of the on-site payment panel (the card, the receipt upload, the waiting for the owner's approval).
const panelWords = {
  az: { card: "Kart nömrəsi", cardTab: "Kart", m10Tab: "M10", m10: "M10 nömrəsi", holder: "Kartın sahibi", copy: "Kopyala", copied: "Kopyalandı", left: "Qalan vaxt", step: "Dəqiq məbləği seçdiyin üsulla (kart və ya M10) göstərilən nömrəyə köçür, sonra ödəniş çekinin şəklini seç və «Ödədim» düyməsinə bas.", pick: "Çekin şəklini seç", chosen: "Seçildi", paid: "Ödədim", sending: "Göndərilir...", waiting: "Çek göndərildi. Təsdiq gözlənilir, balans təsdiqdən sonra avtomatik artacaq.", done: "✅ Ödəniş təsdiqləndi. Balansına əlavə olundu.", rejected: "❌ Ödəniş təsdiqlənmədi. Sualın varsa bizimlə əlaqə saxla.", expired: "Vaxt bitdi. Yenidən başla.", again: "Yeni ödəniş", cancel: "Ləğv et", many: "Çoxlu açıq sorğun var. Bir az gözlə və ya əvvəlkini tamamla.", big: "Şəkil 5 MB-dan böyük olmamalıdır.", bad: "Yalnız şəkil faylı seç.", fail: "Göndərilmədi. Bir az sonra yenidən yoxla." },
  tr: { card: "Kart numarası", cardTab: "Kart", m10Tab: "M10", m10: "M10 numarası", holder: "Kart sahibi", copy: "Kopyala", copied: "Kopyalandı", left: "Kalan süre", step: "Tam tutarı seçtiğin yöntemle (kart veya M10) gösterilen numaraya gönder, sonra ödeme dekontunun fotoğrafını seç ve «Ödedim» düğmesine bas.", pick: "Dekont fotoğrafını seç", chosen: "Seçildi", paid: "Ödedim", sending: "Gönderiliyor...", waiting: "Dekont gönderildi. Onay bekleniyor, bakiye onaydan sonra otomatik artar.", done: "✅ Ödeme onaylandı. Bakiyene eklendi.", rejected: "❌ Ödeme onaylanmadı. Sorun varsa bizimle iletişime geç.", expired: "Süre doldu. Yeniden başla.", again: "Yeni ödeme", cancel: "İptal", many: "Çok sayıda açık talebin var. Biraz bekle veya öncekini tamamla.", big: "Fotoğraf 5 MB'tan büyük olmamalı.", bad: "Yalnızca fotoğraf dosyası seç.", fail: "Gönderilemedi. Biraz sonra tekrar dene." },
  ru: { card: "Номер карты", cardTab: "Карта", m10Tab: "M10", m10: "Номер M10", holder: "Владелец карты", copy: "Копировать", copied: "Скопировано", left: "Осталось времени", step: "Переведи точную сумму выбранным способом (карта или M10) на указанный номер, затем выбери фото чека и нажми «Я оплатил».", pick: "Выбрать фото чека", chosen: "Выбрано", paid: "Я оплатил", sending: "Отправка...", waiting: "Чек отправлен. Ожидается подтверждение, баланс пополнится автоматически после него.", done: "✅ Оплата подтверждена. Баланс пополнен.", rejected: "❌ Оплата не подтверждена. Если есть вопросы, свяжись с нами.", expired: "Время вышло. Начни заново.", again: "Новая оплата", cancel: "Отмена", many: "У тебя много открытых заявок. Подожди или завершите предыдущую.", big: "Фото не больше 5 МБ.", bad: "Выбери файл изображения.", fail: "Не отправилось. Попробуй позже." },
  en: { card: "Card number", cardTab: "Card", m10Tab: "M10", m10: "M10 number", holder: "Card holder", copy: "Copy", copied: "Copied", left: "Time left", step: "Transfer the exact amount by the method you chose (card or M10) to the number shown, then choose the photo of the payment receipt and press “I paid”.", pick: "Choose the receipt photo", chosen: "Selected", paid: "I paid", sending: "Sending...", waiting: "Receipt sent. Waiting for approval, the balance is credited automatically after it.", done: "✅ Payment approved. Added to your balance.", rejected: "❌ Payment was not approved. Contact us if you have questions.", expired: "Time is over. Start again.", again: "New payment", cancel: "Cancel", many: "You have many open requests. Wait or finish the previous one.", big: "The photo must be under 5 MB.", bad: "Choose an image file.", fail: "Could not send. Try again later." },
} as const;

function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

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
  const pw = panelWords[locale as keyof typeof panelWords] ?? panelWords.en;
  const [req, setReq] = useState<PayRequest | null>(null);
  const [card, setCard] = useState<PayCard | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [method, setMethod] = useState<PayMethod>("card");
  const [now, setNow] = useState(Date.now());
  const fileInput = useRef<HTMLInputElement>(null);
  // A payment that was started earlier (page refreshed) is shown again.
  useEffect(() => {
    let alive = true;
    void loadPayRequest().then(async (open) => {
      if (!alive || !open) return;
      setReq(open);
      if (open.status === "new" || open.status === "card") { const got = await getPayCard(open.id); if (alive && "number" in got) setCard(got); else if (alive) setReq(null); }
    });
    return () => { alive = false; };
  }, []);
  // The timer, and the waiting for the owner's answer (the site checks every 4 seconds).
  useEffect(() => {
    if (!req) return;
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const poll = req.status === "receipt" ? window.setInterval(() => {
      void loadPayRequest(req.id).then((fresh) => { if (fresh && fresh.status !== "receipt") { setReq(fresh); if (fresh.status === "approved") void refreshGifts(); } });
    }, 4000) : 0;
    return () => { window.clearInterval(tick); if (poll) window.clearInterval(poll); };
  }, [req]);
  const left = card ? Date.parse(card.expires_at) - now : 0;
  const timedOut = req !== null && (req.status === "new" || req.status === "card") && card !== null && left <= 0;
  function reset() { setMethod("card"); setReq(null); setCard(null); setImage(null); setNote(""); setState("idle"); }
  async function pay() {
    if (!valid) return;
    setState("busy");
    setNote("");
    const made = await createPayRequest(amount);
    if (!made.id) { setState(made.error === "many" ? "idle" : "fail"); if (made.error === "many") setNote(pw.many); return; }
    const got = await getPayCard(made.id);
    if (!("number" in got)) { setState("fail"); return; }
    setCard(got);
    setReq({ id: made.id, amount, status: "card", expires_at: got.expires_at });
    setState("idle");
  }
  async function copyNumber() {
    if (!card) return;
    const raw = method === "m10" ? (card.m10 ?? "") : card.number;
    try { await navigator.clipboard.writeText(raw); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }
  function chooseImage(file: File | undefined) {
    setNote("");
    if (!file) return setImage(null);
    if (!file.type.startsWith("image/")) { setImage(null); return setNote(pw.bad); }
    if (file.size > RECEIPT_MAX_BYTES) { setImage(null); return setNote(pw.big); }
    setImage(file);
  }
  async function submitReceipt() {
    if (!req || !image) return;
    setState("busy");
    setNote("");
    const ok = await sendReceipt(req.id, image, method);
    setState("idle");
    if (!ok) return setNote(pw.fail);
    setReq({ ...req, status: "receipt" });
  }
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3 px-1">
        <h1 className="flex-1 text-[23px] font-semibold tracking-[-0.035em]">{w.title}</h1>
        <span className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm text-muted">{t("gifts.balance")}<Price value={balance} className="text-text" /></span>
      </div>
      <p className="mb-4 px-1 text-sm leading-6 text-muted">{w.lead}</p>
      {req ? (
        <Card className="p-5">
          <p className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-muted">{w.youGet}<Price value={Math.round(Number(req.amount) * COINS_PER_AZN)} className="text-text" /></p>
          {req.status === "approved" ? <p role="status" className="mt-3 rounded-xl border border-accent p-3 text-sm font-semibold text-accent">{pw.done}</p> : null}
          {req.status === "rejected" ? <p role="alert" className="mt-3 rounded-xl border border-danger p-3 text-sm text-danger">{pw.rejected}</p> : null}
          {req.status === "expired" || timedOut ? <p role="alert" className="mt-3 rounded-xl border border-danger p-3 text-sm text-danger">{pw.expired}</p> : null}
          {req.status === "receipt" ? <p role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3 text-sm text-muted"><Lock size={15} className="mt-0.5 shrink-0 text-accent" />{pw.waiting}</p> : null}
          {(req.status === "new" || req.status === "card") && card && !timedOut ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2" role="tablist">
                {(["card", "m10"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={method === item} onClick={() => { setMethod(item); setCopied(false); }} className={cn("h-11 rounded-xl border text-sm font-semibold", method === item ? "border-accent bg-surface-2 text-accent" : "border-border text-muted hover:text-text")}>{item === "card" ? `💳 ${pw.cardTab}` : `📱 ${pw.m10Tab}`}</button>)}
              </div>
              <div className="mt-3 rounded-xl border border-border bg-surface-2 p-3.5">
                <p className="text-xs text-muted">{method === "m10" ? pw.m10 : pw.card}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="min-w-0 flex-1 break-all text-xl font-bold tabular-nums tracking-wide">{method === "m10" ? (card.m10 ?? "").replace(/^(\d{3})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4") : card.number.replace(/(\d{4})(?=\d)/g, "$1 ")}</span>
                  <button type="button" onClick={() => void copyNumber()} className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold hover:border-accent">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? pw.copied : pw.copy}</button>
                </div>
                {method === "card" && card.holder ? <p className="mt-2 text-xs text-muted">{pw.holder}: <span className="font-semibold text-text">{card.holder}</span></p> : null}
                <p className="mt-2 text-sm font-semibold">{Number(req.amount).toFixed(2)} ₼ · <span className="font-normal text-muted">{pw.left}: {clock(left)}</span></p>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted">{pw.step}</p>
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(event) => chooseImage(event.target.files?.[0])} />
              <Button type="button" variant="outline" className="mt-3 h-11 w-full" onClick={() => fileInput.current?.click()}>{image ? `${pw.chosen}: ${image.name.slice(0, 28)}` : pw.pick}</Button>
              {note ? <p role="alert" className="mt-2 text-xs text-danger">{note}</p> : null}
              <Button className="mt-3 h-12 w-full disabled:opacity-50" disabled={!image || state === "busy"} onClick={() => void submitReceipt()}>{state === "busy" ? pw.sending : pw.paid}</Button>
              <button type="button" onClick={() => { void cancelPayRequest(req.id); reset(); }} className="mt-2 w-full text-center text-xs text-muted hover:text-text">{pw.cancel}</button>
            </>
          ) : null}
          {req.status === "approved" || req.status === "rejected" || req.status === "expired" || timedOut ? <Button className="mt-3 h-11 w-full" onClick={reset}>{pw.again}</Button> : null}
        </Card>
      ) : (
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
        {note ? <p role="alert" className="mt-3 rounded-xl border border-danger p-3 text-xs text-danger">{note}</p> : null}
        <Button className="mt-4 h-12 w-full disabled:opacity-50" disabled={!PAYMENTS_LIVE || state === "busy" || !valid} onClick={() => void pay()}>{w.pay} · {valid ? amount.toFixed(2) : "0.00"} ₼</Button>
      </Card>
      )}
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
