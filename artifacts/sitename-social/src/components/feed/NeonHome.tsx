"use client";
import Link from "next/link";
import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { Video } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { useSiteCounts } from "./siteCounts";

// The home page's top part: the big banner (the bottle picture with hearts floating up on both sides), the live strip
// (people online now and registered) and the game cards. It does not touch the games: the cards only open their pages.
const words = {
  az: { badge: "Dostlarla daha əyləncəli", title: "Bu axşam kim ilə oynayırsan", sub: "Butulka, Mafiya, Domino — hamısı bir yerdə", play: "Oyuna gir", all: "Hamısına bax", get: "Yüklə", online: "İndi onlayn", registered: "Qeydiyyatdan keçən", people: "nəfər", pick: "Bir oyun seç, söhbət başlasın", go: "Oyna", soon: "Tezliklə", video: "Video zəng", videoTag: "Üz-üzə tanış ol", old: "Telefonda köhnə Ravetill tətbiqi varsa, əvvəl onu sil" },
  en: { badge: "More fun with friends", title: "Who are you playing with tonight", sub: "Bottle, Mafia, Domino — all in one place", play: "Play Spin the Bottle", all: "All games", get: "Install app", online: "Online now", registered: "Registered", people: "people", pick: "Pick a game, start a chat", go: "Play", soon: "Coming soon", video: "Video chat", videoTag: "Meet face to face", old: "If an old Ravetill app is on your phone, remove it first" },
  ru: { badge: "С друзьями веселее", title: "С кем играешь сегодня вечером", sub: "Бутылочка, Мафия, Домино — всё в одном месте", play: "Играть в бутылочку", all: "Все игры", get: "Скачать", online: "Сейчас онлайн", registered: "Зарегистрировано", people: "чел.", pick: "Выбери игру — начни общение", go: "Играть", soon: "Скоро", video: "Видеочат", videoTag: "Знакомься лицом к лицу", old: "Если на телефоне есть старое приложение Ravetill, сначала удалите его" },
  tr: { badge: "Arkadaşlarla daha eğlenceli", title: "Bu akşam kiminle oynuyorsun", sub: "Şişe çevirme, Mafya, Domino — hepsi bir arada", play: "Şişe çevirmeye gir", all: "Tüm oyunlar", get: "Yükle", online: "Şu an çevrimiçi", registered: "Kayıtlı üye", people: "kişi", pick: "Bir oyun seç, sohbet başlasın", go: "Oyna", soon: "Yakında", video: "Görüntülü sohbet", videoTag: "Yüz yüze tanış", old: "Telefonda eski Ravetill uygulaması varsa önce onu sil" },
  ka: { badge: "მეგობრებთან უფრო მხიარულია", title: "ვისთან თამაშობ ამ საღამოს", sub: "ბოთლი, მაფია, დომინო — ყველაფერი ერთ ადგილას", play: "ბოთლის თამაში", all: "ყველა თამაში", get: "ჩამოტვირთვა", online: "ახლა ონლაინ", registered: "რეგისტრირებული", people: "ადამიანი", pick: "აირჩიე თამაში, დაიწყე საუბარი", go: "თამაში", soon: "მალე", video: "ვიდეო ზარი", videoTag: "გაიცანი პირისპირ", old: "თუ ტელეფონზე ძველი Ravetill აპია, ჯერ ის წაშალე" },
} as const;

// Games with their own logo open their page; the others say "coming soon" and cannot be opened yet.
// photo: the scene behind the card (made in Canva to match each logo), on the right side; the colour shows while it loads.
// full: the picture fills the whole card (a wide scene that should be seen whole), otherwise it stands on the right side.
const games: { name: string; href?: string; img?: string; emoji: string; bg: string; photo: string; full?: boolean }[] = [
  { name: "Butulka", href: "/bottle", img: "/games/bottle.png", emoji: "🍾", bg: "#2a0d4a", photo: "/games/card-butulka-night.jpg", full: true },
  { name: "Mafiya", href: "/mafia", img: "/games/mafia.png", emoji: "🕴️", bg: "#1d1233", photo: "/games/card-mafia.jpg" },
  // New file name: the old address was cached (Cloudflare, 4 h) as a page before the file existed.
  { name: "Domino", href: "/domino", img: "/games/domino-ravetill-v2.png", emoji: "🁫", bg: "#0d1730", photo: "/games/card-domino.jpg" },
  { name: "Nərd", emoji: "🎲", bg: "#241710", photo: "/games/card-nard.jpg" },
  { name: "Loto", emoji: "🎱", bg: "#0b1f24", photo: "/games/card-loto.jpg" },
];

// Game logo with the emoji as a fallback, so a missing or stale picture never shows a broken image.
function GameLogo({ img, emoji }: { img?: string; emoji: string }) {
  const [ok, setOk] = useState(true);
  return img && ok
    ? <img src={img} alt="" onError={() => setOk(false)} className="h-full w-full object-cover" />
    : <span className="text-3xl" aria-hidden="true">{emoji}</span>;
}

// One person in a small video window (a soft silhouette over a colour), used twice on the video card.
function VideoTile({ id, from, to, className, style }: { id: string; from: string; to: string; className: string; style: CSSProperties }) {
  return <span aria-hidden="true" className={`vc-anim pointer-events-none absolute overflow-hidden rounded-xl border-2 border-white/80 shadow-[0_10px_20px_-6px_rgba(0,0,0,.55)] ${className}`} style={style}>
    <svg viewBox="0 0 40 52" className="block h-full w-full">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient></defs>
      <rect width="40" height="52" fill={`url(#${id})`} />
      <circle cx="20" cy="21" r="8" fill="rgba(255,255,255,.88)" />
      <path d="M5 52 C5 37 35 37 35 52Z" fill="rgba(255,255,255,.88)" />
    </svg>
    <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-black/45 px-1 text-[7px] font-black leading-[11px] text-white">
      <span className="home-anim h-1.5 w-1.5 rounded-full bg-[#ff3b5c]" style={{ animation: "home-live 1.6s ease-in-out infinite" }} />LIVE
    </span>
  </span>;
}

// The video call card: not open yet ("coming soon"), but bright and moving on purpose, to draw people in.
function VideoCallCard({ name, tag, soon }: { name: string; tag: string; soon: string }) {
  return <div aria-disabled="true" className="relative min-h-[150px] overflow-hidden rounded-2xl border border-white/20 p-3.5 text-white shadow-[0_12px_28px_-12px_rgba(236,72,153,.7)] sm:p-4"
    style={{ background: "radial-gradient(circle at 85% 15%, rgba(255,255,255,.22), transparent 40%), radial-gradient(circle at 10% 100%, rgba(56,189,248,.35), transparent 45%), linear-gradient(135deg,#ff2d75 0%,#a21caf 50%,#4c1d95 100%)" }}>
    <VideoTile id="vc-a" from="#fb7185" to="#f59e0b" className="right-[8px] top-[8px] h-[54px] w-[42px] sm:right-[12px] sm:top-[10px] sm:h-[70px] sm:w-[54px]" style={{ "--r": "7deg", animation: "vc-float 4s ease-in-out infinite" } as CSSProperties} />
    <VideoTile id="vc-b" from="#38bdf8" to="#6366f1" className="right-[44px] top-[22px] h-[46px] w-[36px] sm:right-[62px] sm:top-[30px] sm:h-[60px] sm:w-[46px]" style={{ "--r": "-8deg", animation: "vc-float 4s ease-in-out 2s infinite" } as CSSProperties} />
    {[{ right: 30, bottom: 34, size: 14, delay: 0 }, { right: 8, bottom: 22, size: 11, delay: 1.8 }, { right: 50, bottom: 12, size: 10, delay: 3.2 }].map((h, i) => (
      <span key={i} aria-hidden="true" className="home-anim pointer-events-none absolute text-[#ffd1dc]" style={{ right: h.right, bottom: h.bottom, fontSize: h.size, animation: `home-heart 4.5s ease-in ${h.delay}s infinite both`, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.3))" }}>♥</span>
    ))}
    <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-[0_4px_12px_-4px_rgba(0,0,0,.4)]">
      <span aria-hidden="true" className="home-anim absolute inset-0 rounded-2xl border-2 border-white/70" style={{ animation: "vc-ring 2s ease-out infinite" }} />
      <Video className="h-6 w-6" strokeWidth={2.4} aria-hidden="true" />
    </span>
    <span className="relative mt-3 block whitespace-nowrap text-lg font-black leading-tight">{name}</span>
    <span className="relative mt-0.5 block text-[11px] font-semibold leading-tight text-white/85">{tag}</span>
    <span className="relative mt-2 inline-flex items-center overflow-hidden rounded-lg border border-white/50 bg-white/20 px-3 py-1 text-xs font-bold">
      <span aria-hidden="true" className="vc-anim pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent" style={{ animation: "vc-shine 3s ease-in-out infinite" }} />
      <span className="relative">⏳ {soon}</span>
    </span>
  </div>;
}

// Hearts floating up on the left and right side of the banner (they stand still when the phone asks for less motion).
const hearts = [
  { side: "left", x: 4, bottom: 18, size: 18, delay: 0, dur: 5.5 },
  { side: "left", x: 12, bottom: 6, size: 13, delay: 2.2, dur: 6.5 },
  { side: "left", x: 2, bottom: 40, size: 11, delay: 3.8, dur: 5 },
  { side: "right", x: 4, bottom: 14, size: 20, delay: 1.1, dur: 6 },
  { side: "right", x: 14, bottom: 4, size: 14, delay: 3, dur: 5.2 },
  { side: "right", x: 26, bottom: 30, size: 12, delay: 4.4, dur: 6.8 },
] as const;

export function NeonHome({ name }: { name: string }) {
  const { locale } = useTranslation();
  const w = words[locale as keyof typeof words] ?? words.az;
  const counts = useSiteCounts();
  const num = (value?: number) => (value === undefined ? "—" : value.toLocaleString("ru-RU"));
  // "Install" replaces "All games" in a normal browser (not on iPhone, not inside the installed Android app, where "All games" comes back).
  const [canInstall, setCanInstall] = useState(false);
  useEffect(() => {
    try {
      const inApp = "RavetillNative" in window || document.referrer.startsWith("android-app://") || window.matchMedia("(display-mode: fullscreen)").matches || window.matchMedia("(display-mode: standalone)").matches;
      setCanInstall(!inApp && !/iPhone|iPad|iPod/i.test(navigator.userAgent));
    } catch { setCanInstall(false); }
  }, []);
  return <>
    <section className="relative mb-3 overflow-hidden rounded-3xl p-5 text-white sm:p-8" style={{ background: "linear-gradient(120deg,#3b1236 0%,#9d2b5b 48%,#f0643c 100%)", boxShadow: "0 0 0 1px rgba(255,255,255,.12) inset, 0 16px 44px -14px rgba(240,100,60,.55)" }}>
      {hearts.map((heart, index) => (
        <span key={index} aria-hidden="true" className="home-anim pointer-events-none absolute text-[#ffd1dc]"
          style={{ [heart.side]: `${heart.x}%`, bottom: `${heart.bottom}%`, fontSize: heart.size, animation: `home-heart ${heart.dur}s ease-in ${heart.delay}s infinite both`, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.25))" } as CSSProperties}>♥</span>
      ))}
      <span aria-hidden="true" className="pointer-events-none absolute right-[6px] top-[14px] rotate-[8deg] sm:right-[40px] sm:top-[22px]">
        <img src="/bottle-hero.png" alt="" className="h-[120px] w-[120px] sm:h-[180px] sm:w-[180px]" style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,.45))" }} />
        <svg viewBox="0 0 90 56" className="absolute -left-3 top-1 h-[26px] w-[42px] -rotate-[10deg] rounded-[3px] shadow-[0_0_0_2px_rgba(255,255,255,.6),0_4px_8px_rgba(0,0,0,.45)] sm:h-[32px] sm:w-[52px]"><rect width="90" height="56" fill="#509E2F"/><rect width="90" height="37.3" fill="#EF3340"/><rect width="90" height="18.7" fill="#00B5E2"/><circle cx="41" cy="28" r="10.5" fill="#fff"/><circle cx="44.2" cy="28" r="8.4" fill="#EF3340"/><polygon points="63.00,21.50 63.99,25.60 67.60,23.40 65.40,27.01 69.50,28.00 65.40,28.99 67.60,32.60 63.99,30.40 63.00,34.50 62.01,30.40 58.40,32.60 60.60,28.99 56.50,28.00 60.60,27.01 58.40,23.40 62.01,25.60" fill="#fff"/></svg>
      </span>
      <span className="relative inline-block rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-[11px]">{w.badge}</span>
      <h1 className="relative mt-3 max-w-[68%] text-[26px] font-black leading-[1.1] sm:max-w-[62%] sm:text-[42px]">{w.title}{name ? `, ${name}` : ""}?</h1>
      <p className="relative mt-2 max-w-[68%] text-xs text-white/85 sm:text-sm">{w.sub}</p>
      <div className="relative mt-4 flex flex-wrap gap-2 sm:mt-6">
        <Link href="/bottle" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-center text-sm font-bold text-[#7a1d45] shadow-[0_6px_16px_-6px_rgba(0,0,0,.4)]"><span aria-hidden="true">🍾</span><span>{w.play}</span></Link>
        {canInstall
          ? <a href="/ravetill.apk" download="Ravetill.apk" className="rounded-xl border border-white/40 bg-white/15 px-5 py-2.5 text-sm font-bold text-white">📲 {w.get}</a>
          : <Link href="/games" className="rounded-xl border border-white/40 bg-white/15 px-5 py-2.5 text-sm font-bold text-white">{w.all}</Link>}
      </div>
      {canInstall ? <p className="relative mt-2 text-xs text-white/75">{w.old}</p> : null}
    </section>
    <div className="mb-4 flex items-center justify-between gap-2 px-1 text-xs">
      <span className="flex min-w-0 items-center gap-2 font-semibold text-text">
        <span className="home-anim h-2.5 w-2.5 shrink-0 rounded-full bg-[#34d399]" style={{ animation: "home-live 2s ease-in-out infinite" }} />
        {w.online} {num(counts?.online)} {w.people}
        {counts?.faces.length ? <span className="ml-1 flex -space-x-2">{counts.faces.map((face) => <img key={face.id} src={face.avatar} alt={face.name} title={face.name} className="h-6 w-6 rounded-full border-2 border-bg object-cover" />)}</span> : null}
      </span>
      <span className="shrink-0 text-muted">{w.registered} {num(counts?.total)} {w.people}</span>
    </div>
    <h2 className="mb-2 px-1 text-base font-extrabold text-text sm:text-lg">{w.pick}</h2>
    <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
      {games.map((game) => {
        const inner = <>
          <img src={game.photo} alt="" aria-hidden="true" loading="lazy" className={`pointer-events-none absolute inset-y-0 right-0 h-full object-cover ${game.full ? "w-full" : "w-[78%]"}`} style={game.full ? { objectPosition: "72% 50%" } : undefined} />
          {/* dark from the left and the bottom, so the logo, the name and the button stay readable over the picture */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: game.full ? "linear-gradient(0deg, rgba(0,0,0,.6), transparent 60%)" : `linear-gradient(90deg, ${game.bg} 18%, transparent 62%), linear-gradient(0deg, rgba(0,0,0,.55), transparent 55%)` }} />
          <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/15 shadow-[0_4px_12px_-4px_rgba(0,0,0,.4)]"><GameLogo img={game.img} emoji={game.emoji} /></span>
          <span className="relative mt-3 block text-lg font-black">{game.name}</span>
          {game.href
            ? <span className="relative mt-2 inline-flex items-center rounded-lg border border-white/50 bg-white/15 px-3 py-1 text-xs font-bold">{w.go} ↗</span>
            : <span className="relative mt-2 inline-flex items-center rounded-lg bg-black/25 px-3 py-1 text-xs font-bold">⏳ {w.soon}</span>}
        </>;
        const cls = "relative min-h-[150px] overflow-hidden rounded-2xl border border-white/10 p-3.5 text-white shadow-[0_10px_24px_-14px_rgba(0,0,0,.6)] sm:p-4";
        const card = game.href
          ? <Link key={game.name} href={game.href} className={`${cls} transition-transform hover:-translate-y-0.5 hover:brightness-110`} style={{ background: game.bg }}>{inner}</Link>
          : <div key={game.name} aria-disabled="true" className={`${cls} opacity-75 saturate-[.7]`} style={{ background: game.bg }}>{inner}</div>;
        // The video call card comes right after Domino.
        return game.name === "Domino" ? <Fragment key={game.name}>{card}<VideoCallCard name={w.video} tag={w.videoTag} soon={w.soon} /></Fragment> : card;
      })}
    </div>
  </>;
}
