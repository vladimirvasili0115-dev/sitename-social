"use client";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";

export type HomeStyle = "classic" | "live" | "neon" | "social";
export const HOME_STYLES: HomeStyle[] = ["classic", "live", "neon", "social"];

// Only the bottle game can be played so far: the other tiles open the games page, where they are marked "soon".
const tiles: { emoji: string; name: string; href: string; grad: string; open?: boolean }[] = [
  { emoji: "🍾", name: "Butulka", href: "/bottle", grad: "linear-gradient(135deg,#f59e0b,#ef4444)", open: true },
  { emoji: "🁫", name: "Domino", href: "/games", grad: "linear-gradient(135deg,#0f766e,#14b8a6)" },
  { emoji: "🎲", name: "Nərd", href: "/games", grad: "linear-gradient(135deg,#7c3aed,#c026d3)" },
  { emoji: "🎱", name: "Loto", href: "/games", grad: "linear-gradient(135deg,#2563eb,#06b6d4)" },
];

export function HomeStylePreview({ style }: { style: HomeStyle }) {
  const bar = style === "neon" ? "linear-gradient(120deg,#1e1b4b,#4c1d95 55%,#be185d)" : style === "live" ? "linear-gradient(120deg,#0f766e,#14b8a6 55%,#ff8a65)" : style === "social" ? "linear-gradient(135deg,#e11d48,#fb923c)" : "";
  return <span aria-hidden="true" className="mb-2 block rounded-lg border border-border bg-bg p-1.5">
    {bar ? <span className="mb-1 block h-5 rounded-md" style={{ background: bar }} /> : <span className="mb-1 block h-2 w-1/2 rounded-full bg-surface-2" />}
    <span className="mb-1 flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className="h-3 flex-1 rounded-sm" style={{ background: style === "classic" ? "var(--surface-2, #334155)" : tiles[i].grad, opacity: style === "social" ? 0.55 : 1 }} />)}</span>
    <span className="block h-4 rounded-md bg-surface-2" />
  </span>;
}

function GameTiles({ compact }: { compact?: boolean }) {
  return <div className={compact ? "mb-4 grid grid-cols-4 gap-2" : "mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4"}>
    {tiles.map((tile) => <Link key={tile.name} href={tile.href} className={compact ? "flex items-center gap-2 rounded-2xl border border-border bg-surface p-2 hover:brightness-110" : "relative flex h-[132px] flex-col justify-between rounded-2xl p-3 text-white shadow-sm hover:brightness-110"} style={compact ? undefined : { background: tile.grad }}>
      {compact
        ? <><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: tile.grad }}>{tile.emoji}</span><span className="min-w-0 truncate text-xs font-bold text-text">{tile.name}</span></>
        : <><span className="text-4xl">{tile.emoji}</span><span className="text-base font-bold">{tile.name}</span></>}
    </Link>)}
  </div>;
}

export function HomeTop({ style, name }: { style: Exclude<HomeStyle, "classic">; name: string }) {
  const { t } = useTranslation();
  const key = (k: string) => t(k as TranslationKey);
  if (style === "live") return <>
    <section className="mb-4 overflow-hidden rounded-3xl p-5 text-white shadow-sm sm:p-6" style={{ background: "linear-gradient(120deg,#0f766e,#14b8a6 55%,#ff8a65)" }}>
      <h1 className="text-2xl font-extrabold">{key("home.hello")}{name ? `, ${name}` : ""} 👋</h1>
      <p className="mt-1 text-sm text-white/90">{key("home.liveSub")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/bottle" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-teal-800">🍾 {key("home.playBottle")}</Link>
        <Link href="/games" className="rounded-full bg-white/25 px-4 py-2 text-xs font-bold text-white">{key("home.allGames")}</Link>
      </div>
    </section>
    <GameTiles />
  </>;
  if (style === "neon") return <>
    <section className="relative mb-4 overflow-hidden rounded-3xl p-5 text-white sm:p-7" style={{ background: "linear-gradient(120deg,#1e1b4b,#4c1d95 50%,#be185d)", boxShadow: "0 0 0 1px rgba(255,255,255,.12) inset, 0 12px 40px -12px rgba(190,24,93,.6)" }}>
      <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3 rotate-[25deg] text-[110px] sm:right-10 sm:text-[130px]" style={{ filter: "drop-shadow(0 0 28px #ec4899)" }}>🍾</span>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-4 text-4xl sm:right-48" style={{ filter: "drop-shadow(0 0 14px #22d3ee)" }}>🎲</span>
      <h1 className="max-w-[70%] text-2xl font-extrabold leading-tight sm:max-w-[60%] sm:text-3xl">{key("home.neonTitle")}</h1>
      <p className="mt-2 max-w-[70%] text-xs text-purple-200 sm:text-sm">{key("home.neonSub")}</p>
      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
        <Link href="/bottle" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-purple-900">🍾 {key("home.playBottle")}</Link>
        <Link href="/games" className="rounded-full bg-white/20 px-4 py-2 text-xs font-bold text-white">{key("home.allGames")}</Link>
      </div>
    </section>
    <GameTiles compact />
  </>;
  return null;
}

// "Social feed": the games sit in a thin strip right under the composer.
export function GameStrip() {
  return <GameTiles compact />;
}
