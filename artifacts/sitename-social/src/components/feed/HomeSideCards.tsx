"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Gift, Heart } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { bottleWeekTop, type BottleWeekTop } from "@/lib/bottleSync";

// Home page cards (the right column on a computer, under the games on a phone):
// the week's race (the most active players: time spent in the game), the activity bonus and a short invitation.
const words = {
  az: { daily: "Gündəlik bonus", collect: "Oyunda vaxt keçir — gündə {n}-ə qədər topla", hour: "saat", takeBonus: "Bonusu götür", race: "Həftənin yarışı", raceSub: "Ən aktiv oyunçular (oyunda keçirilən vaxt)", prize: "Mükafat", empty: "Bu həftə hələ heç kim yoxdur", h: "saat", m: "dəq", bonus: "Aktivlik bonusu", upTo: "Gündə {n} ❤-ə qədər", bonusSub: "Oyunda vaxt keçir: 1 saat 350, 4 saat 1000, 8 saat 2000, 12 saat 3000 ❤.", take: "Götür", together: "Birlikdə daha maraqlı", togetherSub: "Yeni dostlar tap, oyun masasına qoşul və Ravetill axşamını özün yarat." },
  en: { daily: "Daily bonus", collect: "Spend time in the game — collect up to {n} a day", hour: "h", takeBonus: "Take the bonus", race: "Weekly race", raceSub: "Most active players (time in the game)", prize: "Prize", empty: "Nobody yet this week", h: "h", m: "min", bonus: "Activity bonus", upTo: "Up to {n} ❤ a day", bonusSub: "Spend time in the game: 1 h 350, 4 h 1000, 8 h 2000, 12 h 3000 ❤.", take: "Take", together: "More fun together", togetherSub: "Find new friends, join a table and make your own Ravetill night." },
  ru: { daily: "Ежедневный бонус", collect: "Проводи время в игре — собирай до {n} в день", hour: "ч", takeBonus: "Забрать бонус", race: "Гонка недели", raceSub: "Самые активные игроки (время в игре)", prize: "Приз", empty: "На этой неделе пока никого", h: "ч", m: "мин", bonus: "Бонус за активность", upTo: "До {n} ❤ в день", bonusSub: "Проводи время в игре: 1 ч 350, 4 ч 1000, 8 ч 2000, 12 ч 3000 ❤.", take: "Забрать", together: "Вместе интереснее", togetherSub: "Находи новых друзей, садись за стол и создай свой вечер на Ravetill." },
  tr: { daily: "Günlük bonus", collect: "Oyunda vakit geçir — günde {n}'e kadar topla", hour: "sa", takeBonus: "Bonusu al", race: "Haftanın yarışı", raceSub: "En aktif oyuncular (oyunda geçen süre)", prize: "Ödül", empty: "Bu hafta henüz kimse yok", h: "sa", m: "dk", bonus: "Aktiflik bonusu", upTo: "Günde {n} ❤'e kadar", bonusSub: "Oyunda vakit geçir: 1 sa 350, 4 sa 1000, 8 sa 2000, 12 sa 3000 ❤.", take: "Al", together: "Birlikte daha eğlenceli", togetherSub: "Yeni arkadaşlar bul, masaya katıl ve kendi Ravetill akşamını yarat." },
  ka: { daily: "დღიური ბონუსი", collect: "გაატარე დრო თამაშში — შეაგროვე დღეში {n}-მდე", hour: "სთ", takeBonus: "ბონუსის აღება", race: "კვირის რბოლა", raceSub: "ყველაზე აქტიური მოთამაშეები (თამაშში გატარებული დრო)", prize: "პრიზი", empty: "ამ კვირაში ჯერ არავინაა", h: "სთ", m: "წთ", bonus: "აქტიურობის ბონუსი", upTo: "დღეში {n} ❤-მდე", bonusSub: "გაატარე დრო თამაშში: 1 სთ 350, 4 სთ 1000, 8 სთ 2000, 12 სთ 3000 ❤.", take: "აიღე", together: "ერთად უფრო საინტერესოა", togetherSub: "იპოვე ახალი მეგობრები, შეუერთდი მაგიდას და შექმენი შენი Ravetill საღამო." },
} as const;

// The activity bonus of one day: 1 h 350 + 4 h 1000 + 8 h 2000 + 12 h 3000 (same as the game's bonus window).
const ACTIVE_STEPS: [number, number][] = [[1, 350], [4, 1000], [8, 2000], [12, 3000]];
const ACTIVE_BONUS_TOTAL = ACTIVE_STEPS.reduce((sum, [, prize]) => sum + prize, 0);
const medals = ["🥇", "🥈", "🥉"];

export function HomeSideCards({ className = "" }: { className?: string }) {
  const { locale } = useTranslation();
  const w = words[locale as keyof typeof words] ?? words.az;
  const [race, setRace] = useState<BottleWeekTop | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    void bottleWeekTop("active").then((data) => { if (alive) setRace(data); }).catch(() => { if (alive) setRace(null); });
    return () => { alive = false; };
  }, []);
  const time = (secs: number) => `${Math.floor(secs / 3600)} ${w.h} ${String(Math.floor((secs % 3600) / 60)).padStart(2, "0")} ${w.m}`;
  const rows = race?.rows.slice(0, 3) ?? [];
  return <div className={`space-y-4 ${className}`}>
    <Link href="/bottle" className="block rounded-2xl border border-border bg-surface p-4 shadow-sm hover:brightness-110">
      <p className="flex items-center gap-2 text-base font-extrabold text-text"><span aria-hidden="true">🏆</span>{w.race}</p>
      <p className="mt-0.5 text-[11px] text-muted">{w.raceSub}</p>
      <ul className="mt-3 space-y-2">
        {race === undefined ? [0, 1, 2].map((n) => <li key={n} className="h-12 animate-pulse rounded-xl bg-surface-2" />)
          : rows.length ? rows.map((row, index) => (
            <li key={row.id} className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-2.5 py-2">
              <span aria-hidden="true" className="text-lg">{medals[index]}</span>
              {row.avatar ? <img src={row.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <span className="h-8 w-8 shrink-0 rounded-full bg-border" />}
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-text">{row.name || "—"}</span>
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-accent">{time(row.score)}</span>
            </li>))
          : <li className="rounded-xl bg-surface-2 p-3 text-center text-xs text-muted">{w.empty}</li>}
      </ul>
      {race?.prize ? <p className="mt-2 text-right text-[11px] font-semibold text-muted">{w.prize}: <span className="text-[#f87171]">{race.prize.toLocaleString("ru-RU")} ❤</span></p> : null}
    </Link>
    <section className="relative overflow-hidden rounded-3xl p-4 text-white shadow-sm" style={{ background: "linear-gradient(150deg,#0f3d36 0%,#115e54 55%,#0d3b35 100%)", boxShadow: "0 0 0 1px rgba(255,255,255,.08) inset" }}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBBF24] text-[#3b2a05] shadow-[0_6px_14px_-6px_rgba(251,191,36,.8)]"><Gift size={24} strokeWidth={2} /></span>
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5eead4]">{w.daily}</span>
          <span className="block text-lg font-extrabold leading-tight">{w.bonus}</span>
        </span>
      </div>
      <p className="relative mt-3 flex items-center gap-2 text-[40px] font-black leading-none tabular-nums">{ACTIVE_BONUS_TOTAL.toLocaleString("ru-RU")}<Heart size={26} fill="#f87171" stroke="none" /></p>
      <p className="relative mt-1.5 text-xs text-white/85">{w.collect.replace("{n}", ACTIVE_BONUS_TOTAL.toLocaleString("ru-RU"))}</p>
      <ul className="relative mt-3 grid grid-cols-4 gap-1.5">
        {ACTIVE_STEPS.map(([hours, prize]) => (
          <li key={hours} className="rounded-xl border border-white/10 bg-white/[0.06] px-1 py-2 text-center">
            <span className="block text-[10px] font-semibold text-[#99f6e4]">{hours} {w.hour}</span>
            <span className="mt-0.5 flex items-center justify-center gap-0.5 text-[12px] font-extrabold tabular-nums">{prize.toLocaleString("ru-RU")}<Heart size={10} fill="#f87171" stroke="none" /></span>
          </li>
        ))}
      </ul>
      <Link href="/bottle?panel=active" className="relative mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2dd4bf] text-sm font-extrabold text-[#0b2e29] shadow-[0_8px_18px_-8px_rgba(45,212,191,.9)] hover:brightness-110">{w.takeBonus} <ArrowRight size={16} strokeWidth={2.5} /></Link>
    </section>
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-base font-extrabold text-text">{w.together} <span aria-hidden="true">✨</span></p>
      <p className="mt-1 text-xs leading-snug text-muted">{w.togetherSub}</p>
    </section>
  </div>;
}
