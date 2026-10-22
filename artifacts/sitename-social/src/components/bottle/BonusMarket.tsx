"use client";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { bottleBuyEffect, bottleEffectsInfo, bottleExchange, type BottleFxInfo } from "@/lib/bottleSync";

// Bonus market of the bottle game: hearts -> crystals, and the "Enigma" entrance effect (a week) for 1000 crystals.
export const ENIGMA_PRICE = 1000;
type Words = {
  title: string; balance: string; exchange: string; rate: string; buy: string; extend: string; preview: string; active: string; left: string;
  item: string; blurb: string; week: string; needHearts: string; needCrystals: string; offline: string; done: string; bought: string; days: string; hours: string; label: string;
};
const words: Record<string, Words> = {
  az: { title: "Bonus market", balance: "Balansın", exchange: "Ürəyi kristala dəyiş", rate: "1 💎 = {n} ❤️", buy: "Al", extend: "7 gün də uzat", preview: "Önizləmə", active: "Aktivdir", left: "qalıb", item: "ENİGMA GƏLDİ", blurb: "Masaya oturanda şəklinin üstündə 3–4 saniyəlik qorxulu giriş effekti oynayır. Bütün masa görür.", week: "7 gün", needHearts: "Ürək çatmır", needCrystals: "Kristal çatmır", offline: "Bonus market yalnız onlayn oyunda işləyir.", done: "Dəyişdirildi", bought: "Effekt aktivdir!", days: "gün", hours: "saat", label: "ENİGMA GƏLDİ" },
  tr: { title: "Bonus market", balance: "Bakiyen", exchange: "Kalbi kristale çevir", rate: "1 💎 = {n} ❤️", buy: "Satın al", extend: "7 gün daha uzat", preview: "Önizleme", active: "Aktif", left: "kaldı", item: "ENİGMA GELDİ", blurb: "Masaya oturduğunda fotoğrafının üstünde 3–4 saniyelik ürpertici giriş efekti oynar. Tüm masa görür.", week: "7 gün", needHearts: "Kalp yetmiyor", needCrystals: "Kristal yetmiyor", offline: "Bonus market yalnızca çevrimiçi oyunda çalışır.", done: "Çevrildi", bought: "Efekt aktif!", days: "gün", hours: "saat", label: "ENİGMA GELDİ" },
  ru: { title: "Бонус-маркет", balance: "Твой баланс", exchange: "Обменять сердца на кристаллы", rate: "1 💎 = {n} ❤️", buy: "Купить", extend: "Продлить на 7 дней", preview: "Предпросмотр", active: "Активен", left: "осталось", item: "ЭНИГМА ПРИШЁЛ", blurb: "Когда ты садишься за стол, над твоим фото на 3–4 секунды играет жуткий эффект появления. Видит весь стол.", week: "7 дней", needHearts: "Не хватает сердец", needCrystals: "Не хватает кристаллов", offline: "Бонус-маркет работает только в онлайн-игре.", done: "Обменяно", bought: "Эффект активен!", days: "дн.", hours: "ч.", label: "ЭНИГМА ПРИШЁЛ" },
  en: { title: "Bonus market", balance: "Your balance", exchange: "Exchange hearts for crystals", rate: "1 💎 = {n} ❤️", buy: "Buy", extend: "Extend by 7 days", preview: "Preview", active: "Active", left: "left", item: "ENIGMA HAS ARRIVED", blurb: "When you sit down at the table, a 3–4 second spooky entrance effect plays over your photo. The whole table sees it.", week: "7 days", needHearts: "Not enough hearts", needCrystals: "Not enough crystals", offline: "The bonus market only works in the online game.", done: "Exchanged", bought: "Effect is active!", days: "d", hours: "h", label: "ENIGMA HAS ARRIVED" },
  ka: { title: "ბონუს მარკეტი", balance: "შენი ბალანსი", exchange: "გულების კრისტალებად გადაცვლა", rate: "1 💎 = {n} ❤️", buy: "ყიდვა", extend: "კიდევ 7 დღით გახანგრძლივება", preview: "გადახედვა", active: "აქტიურია", left: "დარჩა", item: "ენიგმა მოვიდა", blurb: "მაგიდასთან დაჯდომისას შენს ფოტოზე 3–4 წამიანი შიშის ეფექტი თამაშდება. მთელი მაგიდა ხედავს.", week: "7 დღე", needHearts: "გულები არ გყოფნის", needCrystals: "კრისტალები არ გყოფნის", offline: "ბონუს მარკეტი მხოლოდ ონლაინ თამაშში მუშაობს.", done: "გადაიცვალა", bought: "ეფექტი აქტიურია!", days: "დღე", hours: "სთ", label: "ენიგმა მოვიდა" },
};
const wordsFor = (locale: string) => words[locale] ?? words.en;
export const marketLabel = (locale: string) => wordsFor(locale).title;
export const enigmaLabel = (locale: string) => wordsFor(locale).label;

// The entrance effect itself: dark smoke, flashes of lightning, rings of light and a glitching title, about 3.6 seconds, over a seat photo.
export function EnigmaEffect({ label }: { label: string }) {
  // The effect lasts about 3.6 s; after 4 s it is taken away for good, so no dark layer can stay on a photo.
  const [over, setOver] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setOver(true), 4000); return () => window.clearTimeout(timer); }, []);
  if (over) return null;
  const smoke = [
    { x: "-30%", y: "-26%", d: "0s", c: "rgba(76,29,149,0.9)" }, { x: "32%", y: "-22%", d: "0.15s", c: "rgba(15,5,30,0.95)" },
    { x: "-36%", y: "20%", d: "0.3s", c: "rgba(15,5,30,0.95)" }, { x: "34%", y: "26%", d: "0.1s", c: "rgba(109,40,217,0.85)" },
    { x: "0%", y: "-38%", d: "0.4s", c: "rgba(30,8,60,0.95)" }, { x: "0%", y: "34%", d: "0.25s", c: "rgba(88,28,135,0.9)" },
  ];
  // The dark layer, the flash and the rings sit exactly on the photo (inset-0); only the smoke has a bigger box around it.
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[8]">
      <span className="absolute inset-0 rounded-[14%] bg-[radial-gradient(circle,rgba(30,0,60,0.35)_0%,rgba(6,0,16,0.92)_100%)] animate-[enigma-dark_3.6s_ease-in-out_forwards] motion-reduce:hidden" />
      <span className="absolute -inset-[45%]">
        {smoke.map((blob, i) => (
          <span key={i} className="absolute left-[27%] top-[27%] h-[46%] w-[46%] rounded-full opacity-0 animate-[enigma-smoke_3.2s_ease-out_forwards] motion-reduce:hidden" style={{ background: `radial-gradient(circle, ${blob.c} 0%, transparent 72%)`, animationDelay: blob.d, "--sx": blob.x, "--sy": blob.y } as CSSProperties} />
        ))}
      </span>
      <span className="absolute inset-0 rounded-[14%] bg-[#e9d5ff] opacity-0 animate-[enigma-flash_3.6s_linear_forwards] motion-reduce:hidden" />
      <span className="absolute inset-0 rounded-[14%] border-[0.5cqmin] border-[#c084fc] opacity-0 shadow-[0_0_2.4cqmin_#a855f7] animate-[enigma-ring_1.5s_ease-out_0.2s_forwards] motion-reduce:hidden" />
      <span className="absolute inset-0 rounded-[14%] border-[0.4cqmin] border-[#f0abfc] opacity-0 shadow-[0_0_2cqmin_#e879f9] animate-[enigma-ring_1.5s_ease-out_0.75s_forwards] motion-reduce:hidden" />
      <span className="absolute inset-0 flex items-center justify-center"><span className="whitespace-nowrap text-[2.5cqmin] font-black uppercase tracking-[0.18em] text-white opacity-0 [text-shadow:-0.28cqmin_0_#ff2bd6,0.28cqmin_0_#22d3ee,0_0_1.6cqmin_#a855f7] animate-[enigma-title_3.6s_ease-out_forwards] motion-reduce:opacity-100">{label}</span></span>
    </span>
  );
}

const left = (iso: string, w: Words) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (!(ms > 0)) return null;
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
  return d > 0 ? `${d} ${w.days} ${h} ${w.hours}` : `${Math.max(1, h)} ${w.hours}`;
};

export function BonusMarket({ locale, online, hearts, onHearts, onPreview }: { locale: string; online: boolean; hearts: number; onHearts: (hearts: number) => void; onPreview: () => void }) {
  const w = wordsFor(locale);
  const [info, setInfo] = useState<BottleFxInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const load = useCallback(() => { if (online) void bottleEffectsInfo().then((data) => { if (data) setInfo(data); }); }, [online]);
  useEffect(load, [load]);
  const rate = info?.rate ?? 10;
  const crystals = info?.crystals ?? 0;
  const mine = info?.effects.find((item) => item.effect === "enigma");
  const remaining = mine ? left(mine.expires_at, w) : null;
  const swap = async (n: number) => {
    if (busy) return;
    if (hearts < n * rate) return setNote(w.needHearts);
    setBusy(true); setNote(null);
    const result = await bottleExchange(n);
    setBusy(false);
    if (result?.error === "hearts") return setNote(w.needHearts);
    if (result && typeof result.hearts === "number") { onHearts(result.hearts); setInfo((value) => (value ? { ...value, crystals: result.crystals ?? value.crystals } : value)); setNote(`${w.done}: +${n} 💎`); }
  };
  const buy = async () => {
    if (busy) return;
    if (crystals < ENIGMA_PRICE) return setNote(w.needCrystals);
    setBusy(true); setNote(null);
    const result = await bottleBuyEffect("enigma");
    setBusy(false);
    if (result?.error === "crystals") return setNote(w.needCrystals);
    if (result && result.expires_at) { setNote(w.bought); load(); }
  };
  if (!online) return <p className="p-4 text-center text-sm font-semibold text-[#6B7280]">{w.offline}</p>;
  return (
    <div className="max-h-[74cqmin] overflow-y-auto text-[#1F2937]">
      <div className="mb-2 flex items-center justify-between rounded-xl bg-[#F3E8FF] px-3 py-2 text-sm font-bold">
        <span>{w.balance}</span>
        <span className="flex gap-3 tabular-nums"><span>❤️ {hearts.toLocaleString()}</span><span>💎 {crystals.toLocaleString()}</span></span>
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#6B7280]">{w.exchange} · {w.rate.replace("{n}", String(rate))}</p>
      <div className="mb-3 grid grid-cols-3 gap-1.5">
        {[100, 500, 1000].map((n) => (
          <button key={n} type="button" disabled={busy} onClick={() => void swap(n)} className={`rounded-xl border px-1 py-2 text-center text-xs font-bold ${hearts >= n * rate ? "border-[#C084FC] bg-white text-[#6D28D9]" : "border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF]"}`}>
            +{n} 💎<span className="block text-[10px] font-semibold opacity-80">{(n * rate).toLocaleString()} ❤️</span>
          </button>
        ))}
      </div>
      <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_20%,#4c1d95_0%,#1e0b3a_55%,#07010f_100%)] p-3 text-white shadow-[0_0_24px_rgba(168,85,247,0.55)]">
        <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#a855f7] opacity-40 blur-2xl" />
        <p className="relative text-lg font-black tracking-[0.12em] [text-shadow:-1px_0_#ff2bd6,1px_0_#22d3ee,0_0_10px_#a855f7]">{w.item}</p>
        <p className="relative mt-1 text-xs leading-snug text-[#E9D5FF]">{w.blurb}</p>
        <p className="relative mt-2 text-sm font-bold text-[#F0ABFC]">💎 {ENIGMA_PRICE.toLocaleString()} · {w.week}</p>
        {remaining ? <p className="relative mt-1 text-xs font-bold text-[#86EFAC]">✓ {w.active}: {remaining} {w.left}</p> : null}
        <div className="relative mt-2 flex gap-2">
          <button type="button" onClick={onPreview} className="flex-1 rounded-xl border border-[#C084FC] bg-transparent py-2 text-sm font-bold text-[#E9D5FF]">▶ {w.preview}</button>
          <button type="button" disabled={busy} onClick={() => void buy()} className={`flex-1 rounded-xl py-2 text-sm font-black ${crystals >= ENIGMA_PRICE ? "bg-[linear-gradient(180deg,#d946ef,#7c3aed)] text-white" : "bg-[#4B5563] text-[#D1D5DB]"}`}>{remaining ? w.extend : w.buy}</button>
        </div>
      </div>
      {note ? <p role="status" className="mt-2 rounded-lg bg-[#F3E8FF] p-2 text-center text-xs font-bold text-[#6D28D9]">{note}</p> : null}
    </div>
  );
}
