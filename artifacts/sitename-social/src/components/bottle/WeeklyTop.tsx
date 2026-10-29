"use client";

import { useEffect, useState } from "react";
import { bottleWeekClaim, bottleWeekPrizes, bottleWeekTop, type BottleWeekTop } from "@/lib/bottleSync";

type Kind = "active" | "spend" | "kisses" | "songs";
const KINDS: { key: Kind; icon: string }[] = [{ key: "active", icon: "⏱" }, { key: "spend", icon: "💸" }, { key: "kisses", icon: "💋" }, { key: "songs", icon: "🎵" }];

const words: Record<string, Record<string, string>> = {
  az: { title: "Həftənin yarışı", active: "Ən aktiv (oyunda keçirilən vaxt)", spend: "Ən çox xərcləyən", kisses: "Ən çox öpüş alan", songs: "Ən çox musiqi qoşan", prize: "Həftənin qalibinə mükafat", left: "Həftənin sonuna", d: "gün", h: "saat", m: "dəq", you: "Sən", empty: "Hələ heç kim yoxdur", close: "Bağla", congrats: "TƏBRİKLƏR, QAZANDINIZ!", take: "Götür", won: "Həftənin qalibi!", rules: "Admin və moderatorlar sayılmır. Həftə Bazar ertəsi başlayır.", place: "yer" },
  en: { title: "Weekly contest", active: "Most active (time in game)", spend: "Biggest spender", kisses: "Most kisses received", songs: "Most songs played", prize: "Prize for the weekly winner", left: "Until the week ends", d: "d", h: "h", m: "min", you: "You", empty: "Nobody yet", close: "Close", congrats: "CONGRATULATIONS, YOU WON!", take: "Take", won: "Weekly winner!", rules: "Admins and moderators are not counted. The week starts on Monday.", place: "place" },
};
const w = (locale: string) => words[locale] ?? words.en;

const fmtTime = (secs: number, x: Record<string, string>) => {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
  return `${h} ${x.h} ${String(m).padStart(2, "0")} ${x.m}`;
};

export function WeeklyPanel({ locale, onClose }: { locale: string; onClose: () => void }) {
  const x = w(locale);
  const [kind, setKind] = useState<Kind>("active");
  const [data, setData] = useState<BottleWeekTop | null>(null);
  useEffect(() => {
    let alive = true;
    setData(null);
    void bottleWeekTop(kind).then((res) => { if (alive) setData(res ?? { kind, prize: 0, rows: [], me: null, left: 0 }); });
    return () => { alive = false; };
  }, [kind]);
  const value = (score: number) => (kind === "active" ? fmtTime(score, x) : kind === "spend" ? `${score.toLocaleString("ru-RU")} ❤` : score.toLocaleString("ru-RU"));
  const left = data?.left ?? 0;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} className="relative flex max-h-[88vh] w-full max-w-[420px] flex-col rounded-2xl bg-[linear-gradient(#3b1d6e,#1d0f3a)] p-4 text-white shadow-2xl">
        <button type="button" onClick={onClose} aria-label={x.close} className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-[#3b1d6e] shadow">×</button>
        <h2 className="mb-2 text-center text-[15px] font-bold text-[#ffd86b]">{x.title}</h2>
        <div role="tablist" className="flex justify-center gap-1.5">
          {KINDS.map((item) => (
            <button key={item.key} role="tab" aria-selected={kind === item.key} onClick={() => setKind(item.key)} className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${kind === item.key ? "bg-[#8CC63F] ring-2 ring-white" : "bg-white/10"}`}>{item.icon}</button>
          ))}
        </div>
        <p className="my-2 text-center text-xs text-[#c9b8ff]">{x[kind]}</p>
        <div className="mb-2 flex items-center gap-2.5 rounded-2xl bg-[linear-gradient(90deg,#f59e0b,#ef4444)] px-3 py-2.5">
          <span className="text-3xl">🏆</span>
          <div><b className="text-xl">{(data?.prize ?? (kind === "active" || kind === "spend" ? 40000 : 10000)).toLocaleString("ru-RU")} ❤</b><small className="block text-[11px]">{x.prize}</small></div>
        </div>
        <ol className="min-h-[120px] flex-1 overflow-y-auto [scrollbar-width:none]">
          {data === null ? <li className="py-8 text-center text-xs text-white/60">…</li>
            : data.rows.length === 0 ? <li className="py-8 text-center text-xs text-white/60">{x.empty}</li>
            : data.rows.map((row, index) => (
              <li key={row.id} className="mb-1.5 flex items-center gap-2.5 rounded-xl bg-white/10 px-2.5 py-2">
                <b className="w-6 text-center text-[#ffd86b]">{index + 1}</b>
                <span className="h-9 w-9 shrink-0 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${row.avatar || "/custom/profile/nophoto.svg"})` }} />
                <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
                <b className="shrink-0 text-sm tabular-nums">{value(row.score)}</b>
              </li>
            ))}
        </ol>
        {data?.me ? (
          <div className="mt-1 flex items-center gap-2.5 rounded-xl border border-[#fde68a] bg-[#fde68a33] px-2.5 py-2">
            <b className="w-6 text-center text-[#ffd86b]">{data.me.rank}</b>
            <span className="flex-1 text-sm">{x.you}</span>
            <b className="text-sm tabular-nums">{value(data.me.score)}</b>
          </div>
        ) : null}
        <p className="mt-2 rounded-lg bg-black/25 p-1.5 text-center text-xs">⏳ {x.left}: {Math.floor(left / 86400)} {x.d} {Math.floor((left % 86400) / 3600)} {x.h}</p>
        <p className="mt-1 text-center text-[10px] text-[#c9b8ff]">{x.rules}</p>
      </div>
    </div>
  );
}

// After a week ends the winner sees the prize when entering the game and takes it with the button.
export function WeekPrizePopup({ locale, online, onHearts }: { locale: string; online: boolean; onHearts: (hearts: number) => void }) {
  const x = w(locale);
  const [prizes, setPrizes] = useState<{ week: string; kind: string; amount: number }[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!online) return;
    const timer = window.setTimeout(() => { void bottleWeekPrizes().then((list) => { if (list && list.length) setPrizes(list); }); }, 2500);
    return () => window.clearTimeout(timer);
  }, [online]);
  if (!prizes.length) return null;
  const first = prizes[0];
  const take = () => {
    if (busy) return;
    setBusy(true);
    const rest = prizes.slice(1);
    if (rest.length) { setPrizes(rest); setBusy(false); return; }
    void bottleWeekClaim().then((res) => { if (res) onHearts(res.hearts); setPrizes([]); setBusy(false); });
  };
  const total = prizes.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-[340px] rounded-3xl bg-[linear-gradient(#fff,#fff6d6)] p-6 text-center text-[#3b1d6e] shadow-2xl">
        <div className="text-5xl">🏆</div>
        <p className="mt-1 text-base font-bold">{x.won}</p>
        <p className="text-xs">{x[first.kind] ?? ""}</p>
        <p className="my-2 text-4xl font-extrabold text-[#e11d48]">+{first.amount.toLocaleString("ru-RU")} ❤</p>
        <p className="text-sm font-extrabold">{x.congrats}</p>
        {prizes.length > 1 ? <p className="mt-1 text-[11px] opacity-70">{prizes.length} · {total.toLocaleString("ru-RU")} ❤</p> : null}
        <button type="button" onClick={take} disabled={busy} className="mt-4 w-full rounded-full bg-[#8CC63F] py-2.5 text-base font-bold text-white shadow disabled:opacity-60">{x.take}</button>
      </div>
    </div>
  );
}
