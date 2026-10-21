"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { Track } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

// One music player for the whole site: it lives in the page frame, so a song keeps playing while you move
// between pages. The music page drives it; the header shows a small pill with a spinning disc and a stop button.
export type Song = { id: string; title: string; duration?: string };
export type Now = { kind: "yt"; song: Song } | { kind: "file"; track: Track };
type State = { now: Now | null; queue: Now[]; playing: boolean; cur: number; dur: number };

let state: State = { now: null, queue: [], playing: false, cur: 0, dur: 0 };
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; listeners.forEach((listener) => listener()); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
const server: State = { now: null, queue: [], playing: false, cur: 0, dur: 0 };
export const useSiteMusic = () => useSyncExternalStore(subscribe, () => state, () => server);

let frame: HTMLIFrameElement | null = null;
let audio: HTMLAudioElement | null = null;
const ytCall = (func: string, args: unknown[] = []) => frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
const keyOf = (item: Now) => (item.kind === "yt" ? `yt:${item.song.id}` : `file:${item.track.id}`);
export const nowKey = (item: Now | null) => (item ? keyOf(item) : "");

export const siteMusic = {
  play(item: Now, queue: Now[]) {
    set({ now: item, queue: queue.length ? queue : [item], playing: true, cur: 0, dur: item.kind === "file" ? item.track.duration || 0 : 0 });
    if (item.kind !== "yt") return;
    try {
      const recent = JSON.parse(window.localStorage.getItem("bottle-recent") ?? "[]") as Song[];
      window.localStorage.setItem("bottle-recent", JSON.stringify([item.song, ...recent.filter((song) => song.id !== item.song.id)].slice(0, 40)));
    } catch { /* storage is full or blocked */ }
  },
  toggle() {
    if (!state.now) return;
    if (state.now.kind === "file") { if (audio) { if (audio.paused) void audio.play().catch(() => {}); else audio.pause(); } return; }
    ytCall(state.playing ? "pauseVideo" : "playVideo");
    set({ playing: !state.playing });
  },
  pause() {
    if (!state.now || !state.playing) return;
    if (state.now.kind === "file") audio?.pause(); else ytCall("pauseVideo");
    set({ playing: false });
  },
  seek(at: number) {
    if (state.now?.kind === "file") { if (audio) audio.currentTime = at; } else ytCall("seekTo", [at, true]);
    set({ cur: at });
  },
  step(dir: 1 | -1) {
    const { now, queue } = state;
    if (!now || !queue.length) return;
    const index = queue.findIndex((item) => keyOf(item) === keyOf(now));
    siteMusic.play(queue[(index + dir + queue.length) % queue.length], queue);
  },
  stop() { set({ now: null, playing: false, cur: 0, dur: 0 }); },
  isPlaying: () => Boolean(state.now && state.playing),
};

// The hidden players. Mounted once in the page frame.
export function SiteMusicHost() {
  const music = useSiteMusic();
  const now = music.now;
  const ytId = now?.kind === "yt" ? now.song.id : null;
  useEffect(() => {
    if (!ytId) return;
    const hear = (event: MessageEvent) => {
      if (typeof event.origin !== "string" || !event.origin.includes("youtube")) return;
      try {
        const data = JSON.parse(String(event.data)) as { event?: string; info?: { currentTime?: number; duration?: number; playerState?: number } };
        const info = data.info;
        if (data.event !== "infoDelivery" || !info) return;
        if (info.playerState === 0) return siteMusic.step(1);
        set({ playing: info.playerState === undefined ? state.playing : info.playerState === 1, cur: info.currentTime ?? state.cur, dur: info.duration || state.dur });
      } catch { /* not a player message */ }
    };
    window.addEventListener("message", hear);
    return () => window.removeEventListener("message", hear);
  }, [ytId]);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  if (!now) return null;
  return now.kind === "yt"
    ? <iframe key={now.song.id} ref={(node) => { frameRef.current = node; frame = node; }} onLoad={() => { frame?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*"); ytCall("unMute"); ytCall("playVideo"); }} src={`https://www.youtube-nocookie.com/embed/${now.song.id}?autoplay=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1`} title="YouTube" allow="autoplay; encrypted-media" tabIndex={-1} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 h-[200px] w-[200px] opacity-0" />
    : <audio key={now.track.id} ref={(node) => { audio = node; }} src={now.track.src} autoPlay onPlay={() => set({ playing: true })} onPause={() => set({ playing: false })} onEnded={() => siteMusic.step(1)} onLoadedMetadata={(event) => set({ dur: event.currentTarget.duration || 0 })} onTimeUpdate={(event) => set({ cur: event.currentTarget.currentTime })} className="hidden" />;
}

export const discBg = "bg-[radial-gradient(circle,#BE185D_20%,#111_21%,#2a2a2a_45%,#111_46%,#333_70%,#111_71%)]";
export const coverOf = (now: Now | null) => (now?.kind === "yt" ? `radial-gradient(circle,#1E1B3A 14%,transparent 15%),url(https://i.ytimg.com/vi/${now.song.id}/mqdefault.jpg)` : undefined);
export const titleOf = (now: Now | null) => (now ? (now.kind === "yt" ? now.song.title : now.track.title) : "");

// The header pill: in the music player's colours, a spinning disc, dancing bars, the title and a stop button.
export function SiteMusicPill() {
  const { t } = useTranslation();
  const music = useSiteMusic();
  if (!music.now) return null;
  const cover = coverOf(music.now);
  return (
    <span className="flex h-9 shrink-0 items-center rounded-full bg-[linear-gradient(120deg,#1E1B3A,#4C1D95_60%,#BE185D)] pl-1 pr-1 text-white shadow-md">
      <Link href="/music" title={titleOf(music.now)} aria-label={`${t("bottle.musicNow")}: ${titleOf(music.now)}`} className="flex min-w-0 items-center gap-1.5">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white/25 bg-cover bg-center", discBg, music.playing && "animate-[spin_3s_linear_infinite]")} style={cover ? { backgroundImage: cover } : undefined}><span className="h-1.5 w-1.5 rounded-full bg-white/80" /></span>
        <span aria-hidden="true" className={cn("flex h-3.5 items-end gap-[2px] max-[359px]:hidden", !music.playing && "opacity-40")}>{[0.9, 0.5, 1.1, 0.7].map((speed, n) => <span key={n} className="w-[3px] rounded-full bg-[linear-gradient(180deg,#F9A8D4,#EC4899)]" style={{ height: "100%", transformOrigin: "bottom", animation: `eq-bar ${speed}s ease-in-out ${n * 0.12}s infinite alternate`, animationPlayState: music.playing ? "running" : "paused" }} />)}</span>
        <span className="hidden max-w-[120px] truncate text-xs font-bold xl:block">{titleOf(music.now)}</span>
      </Link>
      <button type="button" onClick={() => siteMusic.stop()} aria-label={t("music.stop")} title={t("music.stop")} className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/30"><X size={14} strokeWidth={3} /></button>
    </span>
  );
}
