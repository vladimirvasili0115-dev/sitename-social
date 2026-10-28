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
  { emoji: "🍾", name: "Butulka", href: "/bottle" },
  { emoji: "🁫", name: "Domino", href: "/games" },
  { emoji: "🎲", name: "Nərd", href: "/games" },
  { emoji: "🎱", name: "Loto", href: "/games" },
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
      <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3 rotate-[25deg] text-[110px] sm:right-10 sm:text-[130px]" style={{ filter: "drop-shadow(0 0 28px #ec4899)" }}>🍾</span>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-4 text-4xl sm:right-48" style={{ filter: "drop-shadow(0 0 14px #22d3ee)" }}>🎲</span>
      <h1 className="max-w-[70%] text-2xl font-extrabold leading-tight sm:max-w-[60%] sm:text-3xl">{w.title}{name ? `, ${name}` : ""}?</h1>
      <p className="mt-2 max-w-[70%] text-xs text-purple-200 sm:text-sm">{w.sub}</p>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
        <Link href="/bottle" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-purple-900">🍾 {w.play}</Link>
        {canInstall
          ? <a href="/ravetill.apk" download="Ravetill.apk" className="rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white">📲 {w.get}</a>
          : <Link href="/games" className="rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white">{w.all}</Link>}
      </div>
    </section>
    <div className="mb-4 grid grid-cols-4 gap-2">
      {tiles.map((tile) => <Link key={tile.name} href={tile.href} className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 hover:brightness-110">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,rgba(124,58,237,.35),rgba(236,72,153,.35))] text-xl">{tile.emoji}</span>
        <span className="min-w-0 truncate text-xs font-bold text-text">{tile.name}</span>
      </Link>)}
    </div>
  </>;
}
