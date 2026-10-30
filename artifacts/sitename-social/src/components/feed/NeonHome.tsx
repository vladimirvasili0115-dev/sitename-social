"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";

// The home page's top part (neon night look). It does not touch the game: the buttons only open /bottle and /games.
const words = {
  az: { title: "Bu axşam kim ilə oynayırsan", sub: "Butulka, Domino, Nərd, Loto — hamısı bir yerdə", play: "Oyuna gir", all: "Hamısına bax", get: "Yüklə" },
  en: { title: "Who are you playing with tonight", sub: "Bottle, Domino, Backgammon, Lotto — all in one place", play: "Play Spin the Bottle", all: "All games", get: "Install app" },
  ru: { title: "С кем играешь сегодня вечером", sub: "Бутылочка, Домино, Нарды, Лото — всё в одном месте", play: "Играть в бутылочку", all: "Все игры", get: "Скачать" },
  tr: { title: "Bu akşam kiminle oynuyorsun", sub: "Şişe çevirme, Domino, Tavla, Loto — hepsi bir arada", play: "Şişe çevirmeye gir", all: "Tüm oyunlar", get: "Yükle" },
  ka: { title: "ვისთან თამაშობ ამ საღამოს", sub: "ბოთლი, დომინო, ნარდი, ლოტო — ყველაფერი ერთ ადგილას", play: "ბოთლის თამაში", all: "ყველა თამაში", get: "ჩამოტვირთვა" },
} as const;

const tiles = [
  { emoji: "🍾", name: "Butulka", href: "/bottle", img: "/bottle-hero.png" },
  { emoji: "🕴️", name: "Mafiya", href: "/mafia", img: "/games/mafia.png" },
  { emoji: "🎲", name: "Nərd", href: "/games" },
  { emoji: "🎱", name: "Loto", href: "/games" },
  { emoji: "🁫", name: "Domino", href: "/games" },
];

export function NeonHome({ name }: { name: string }) {
  const { locale } = useTranslation();
  const w = words[locale as keyof typeof words] ?? words.az;
  // "Install" replaces "All games" in a normal browser (not on iPhone, not inside the installed Android app, where "All games" comes back).
  const [canInstall, setCanInstall] = useState(false);
  useEffect(() => {
    try {
      const inApp = document.referrer.startsWith("android-app://") || window.matchMedia("(display-mode: fullscreen)").matches || window.matchMedia("(display-mode: standalone)").matches;
      setCanInstall(!inApp && !/iPhone|iPad|iPod/i.test(navigator.userAgent));
    } catch { setCanInstall(false); }
  }, []);
  return <>
    <section className="relative mb-4 overflow-hidden rounded-3xl p-5 text-white sm:p-7" style={{ background: "linear-gradient(120deg,#1e1b4b,#4c1d95 50%,#be185d)", boxShadow: "0 0 0 1px rgba(255,255,255,.12) inset, 0 12px 40px -12px rgba(190,24,93,.6)" }}>
      <span aria-hidden="true" className="pointer-events-none absolute right-[3px] top-[19px] rotate-[8deg] sm:right-[51px]">
        <img src="/bottle-hero.png" alt="" className="h-[120px] w-[120px] sm:h-[140px] sm:w-[140px]" style={{ filter: "drop-shadow(0 8px 14px rgba(0,0,0,.4))" }} />
        <svg viewBox="0 0 90 56" className="absolute -left-3 top-1 h-[26px] w-[42px] -rotate-[10deg] rounded-[3px] shadow-[0_0_0_2px_rgba(255,255,255,.6),0_4px_8px_rgba(0,0,0,.45)]"><rect width="90" height="56" fill="#509E2F"/><rect width="90" height="37.3" fill="#EF3340"/><rect width="90" height="18.7" fill="#00B5E2"/><circle cx="41" cy="28" r="10.5" fill="#fff"/><circle cx="44.2" cy="28" r="8.4" fill="#EF3340"/><polygon points="63.00,21.50 63.99,25.60 67.60,23.40 65.40,27.01 69.50,28.00 65.40,28.99 67.60,32.60 63.99,30.40 63.00,34.50 62.01,30.40 58.40,32.60 60.60,28.99 56.50,28.00 60.60,27.01 58.40,23.40 62.01,25.60" fill="#fff"/></svg>
      </span>
      <h1 className="max-w-[70%] text-2xl font-extrabold leading-tight sm:max-w-[60%] sm:text-3xl">{w.title}{name ? `, ${name}` : ""}?</h1>
      <p className="mt-2 max-w-[70%] text-xs text-purple-200 sm:text-sm">{w.sub}</p>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
        <Link href="/bottle" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-center text-xs font-bold text-purple-900"><span aria-hidden="true">🍾</span><span>{w.play}</span></Link>
        {canInstall
          ? <a href="/ravetill.apk" download="Ravetill.apk" className="rounded-full bg-white/20 px-6 py-3 text-[15px] font-bold text-white">📲 {w.get}</a>
          : <Link href="/games" className="rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white">{w.all}</Link>}
      </div>
    </section>
    <div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
      {tiles.map((tile) => <Link key={tile.name} href={tile.href} className={`${tile.name === "Domino" ? "col-span-4 sm:col-span-1 " : ""}flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 hover:brightness-110`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,rgba(124,58,237,.35),rgba(236,72,153,.35))] text-xl">{"img" in tile ? <img src={tile.img} alt="" className="h-full w-full object-cover" /> : tile.emoji}</span>
        <span className="min-w-0 truncate text-xs font-bold text-text">{tile.name}</span>
      </Link>)}
    </div>
  </>;
}
