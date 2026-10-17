"use client";
import { useEffect, useMemo, useState, useSyncExternalStore, type ChangeEvent, type FormEvent } from "react";
import { Clock, Flame, LoaderCircle, Pause, Play, Search, SkipBack, SkipForward, Star, Trash2, Upload } from "lucide-react";
import type { Track } from "@/types";
import { tracks as sampleTracks } from "@/data/music";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/components/profile/useProfile";
import { deleteRemoteTrack, ensureMusicLoaded, remoteMusic, uploadRemoteTrack } from "@/lib/musicSync";
import { rankSongs, songScore } from "@/lib/songSearch";
import { isRemoteId } from "@/lib/remoteProfiles";
import { supabase } from "@/lib/supabase";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { coverOf, discBg, nowKey, siteMusic, useSiteMusic, type Now, type Song } from "@/components/music/siteMusic";

// The site's music in the same look as the game's music player: a dark purple card with a spinning disc,
// YouTube search and charts, favourites and recent songs (shared with the game), and your own uploaded MP3s.
type Tab = "popular" | "search" | "fav" | "recent" | "mine";
const online = Boolean(supabase);
const load = (key: string): Song[] => { try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as Song[]; } catch { return []; } };
const save = (key: string, list: Song[]) => { try { window.localStorage.setItem(key, JSON.stringify(list.slice(0, 40))); } catch { /* storage is full or blocked */ } };
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const split = (title: string) => (title.includes(" - ") ? [title.split(" - ")[0], title.split(" - ").slice(1).join(" - ")] : ["", title]);

function Equalizer({ className, on }: { className?: string; on: boolean }) {
  return <span aria-hidden="true" className={cn("flex items-end gap-[3px]", className, !on && "opacity-40")}>{[0.9, 0.5, 1.1, 0.7, 0.95].map((speed, n) => <span key={n} className="w-[4px] rounded-full bg-[linear-gradient(180deg,#F9A8D4,#EC4899)]" style={{ height: "100%", transformOrigin: "bottom", animation: `eq-bar ${speed}s ease-in-out ${n * 0.12}s infinite alternate`, animationPlayState: on ? "running" : "paused" }} />)}</span>;
}

export default function MusicPage() {
  const { t } = useTranslation();
  const remote = useSyncExternalStore(remoteMusic.subscribe, remoteMusic.get, remoteMusic.getServer);
  const accountId = useAuth().user?.id;
  const { user } = useProfile();
  useEffect(() => ensureMusicLoaded(accountId), [accountId]);
  const [localMine, setLocalMine] = useState<Track[]>([]);
  const mine = useMemo(() => (online ? remote.tracks.filter((track) => track.mine) : [...localMine, ...sampleTracks.filter((track) => track.src)]), [remote, localMine]);
  const [tab, setTab] = useState<Tab>("popular");
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "nokey" | "fail">("idle");
  const [favs, setFavs] = useState<Song[]>([]);
  const [recent, setRecent] = useState<Song[]>([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  // The player itself lives in the page frame, so the song goes on while you move to other pages.
  const music = useSiteMusic();
  const now = music.now;
  const tune = { playing: music.playing, cur: music.cur, dur: music.dur };
  useEffect(() => { setFavs(load("bottle-fav")); setRecent(load("bottle-recent")); void fetchSongs(""); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Same YouTube lookup as the game: the chart of Azerbaijan, or a search ranked by how well titles fit.
  async function fetchSongs(search: string) {
    const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    setSongs([]);
    if (!key) return setState("nokey");
    const cacheKey = `bottle-yt:${search.toLowerCase()}`;
    try { const cached = JSON.parse(window.sessionStorage.getItem(cacheKey) ?? "null") as Song[] | null; if (cached) { setSongs(cached); return setState("idle"); } } catch { /* no cache */ }
    setState("loading");
    const api = "https://www.googleapis.com/youtube/v3";
    const length = (iso: string) => { const part = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso); if (!part) return ""; const [h, m, s] = [Number(part[1] ?? 0), Number(part[2] ?? 0), Number(part[3] ?? 0)]; return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s).padStart(2, "0")}`; };
    try {
      let ids = "";
      if (search) {
        const found = await fetch(`${api}/search?part=id&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=25&q=${encodeURIComponent(search)}&key=${key}`);
        if (!found.ok) return setState("fail");
        ids = (((await found.json()) as { items?: { id: { videoId: string } }[] }).items ?? []).map((item) => item.id.videoId).join(",");
        if (!ids) return setState("idle");
      }
      const details = await fetch(search ? `${api}/videos?part=snippet,contentDetails&id=${ids}&key=${key}` : `${api}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=AZ&maxResults=25&key=${key}`);
      if (!details.ok) return setState("fail");
      const list = (((await details.json()) as { items?: { id: string; snippet: { title: string }; contentDetails: { duration: string } }[] }).items ?? []).map((item) => ({ id: item.id, title: item.snippet.title, duration: length(item.contentDetails.duration) }));
      const ranked = search ? rankSongs(search, [...[...favs, ...recent].filter((item) => songScore(search, item.title) >= 0.9), ...list].filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index)) : list;
      const shown = search && ranked.length ? ranked : list;
      setSongs(shown);
      setState("idle");
      try { window.sessionStorage.setItem(cacheKey, JSON.stringify(shown)); } catch { /* storage is full or blocked */ }
    } catch { setState("fail"); }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setTab("search");
    void fetchSongs(query.trim());
  }

  const ytList = tab === "fav" ? favs : tab === "recent" ? recent : songs;
  const ytQueue = (): Now[] => ytList.map((song) => ({ kind: "yt", song }));
  const playYt = (song: Song) => {
    siteMusic.play({ kind: "yt", song }, ytQueue());
    setRecent([song, ...recent.filter((item) => item.id !== song.id)]);
  };
  const playFile = (track: Track) => siteMusic.play({ kind: "file", track }, mine.map((item): Now => ({ kind: "file", track: item })));
  const toggleFav = (song: Song) => { const next = favs.some((item) => item.id === song.id) ? favs.filter((item) => item.id !== song.id) : [song, ...favs]; setFavs(next); save("bottle-fav", next); };
  const step = (dir: 1 | -1) => siteMusic.step(dir);
  const toggle = () => {
    if (!now) { const first = tab === "mine" ? null : ytList[0]; if (first) playYt(first); else if (mine[0]) playFile(mine[0]); return; }
    siteMusic.toggle();
  };
  const seek = (at: number) => siteMusic.seek(at);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || busy) return;
    setFailure(null);
    if (online) {
      setBusy(true);
      let result: "tooBig" | "failed" | null = null;
      for (const file of files) result = (await uploadRemoteTrack(file, user.name)) ?? result;
      setBusy(false);
      if (result) return setFailure(result === "tooBig" ? "music.tooBig" : "videos.uploadFailed");
    } else setLocalMine((list) => [...files.map((file, index): Track => ({ id: `my-${Date.now()}-${index}`, title: file.name.replace(/\.[^.]+$/, ""), artist: t("common.you"), duration: 0, src: URL.createObjectURL(file), mine: true })), ...list]);
    setTab("mine");
  }
  const removeTrack = (id: string) => (isRemoteId(id) ? void deleteRemoteTrack(id) : setLocalMine((list) => list.filter((track) => track.id !== id)));

  const title = now ? (now.kind === "yt" ? now.song.title : now.track.title) : t("music.pick");
  const [artist, name] = now?.kind === "file" ? [now.track.artist, now.track.title] : split(title);
  const cover = coverOf(now);
  const tabs = [["popular", Flame, t("bottle.songPopular")], ["fav", Star, t("common.favorites")], ["recent", Clock, t("bottle.songRecent")], ["search", Search, t("bottle.songSearch")]] as const;
  const row = "group flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left text-white hover:bg-white/10";

  return (
    <div className="pb-4">
      {/* The long player card with the spinning disc, like the game's music bar. */}
      <div className="sticky top-[80px] z-30 mb-3 overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#1E1B3A,#4C1D95_60%,#BE185D)] p-3 text-white shadow-xl sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-cover bg-center shadow-lg sm:h-20 sm:w-20", discBg, tune.playing && now && "animate-[spin_3s_linear_infinite]")} style={cover ? { backgroundImage: cover } : undefined}><span className="h-2.5 w-2.5 rounded-full bg-white/80" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">♫ {t("bottle.musicNow")}</p>
            <p className="truncate text-[15px] font-black sm:text-base">{now ? name : title}</p>
            {now && artist ? <p className="truncate text-xs text-white/60">{artist}</p> : null}
            <div className="mt-1.5 flex items-center gap-1.5 sm:gap-2">
              <button onClick={() => step(-1)} disabled={!now} aria-label={t("music.prev")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-40"><SkipBack size={16} fill="currentColor" /></button>
              <button onClick={toggle} aria-label={tune.playing ? t("music.pause") : t("music.play")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#4C1D95] shadow hover:scale-105">{tune.playing && now ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="translate-x-px" />}</button>
              <button onClick={() => step(1)} disabled={!now} aria-label={t("music.next")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-40"><SkipForward size={16} fill="currentColor" /></button>
              <span className="hidden w-9 shrink-0 text-right text-[10px] tabular-nums text-white/70 sm:block">{clock(tune.cur)}</span>
              <input type="range" min={0} max={Math.max(1, Math.floor(tune.dur))} value={Math.floor(tune.cur)} onChange={(event) => seek(Number(event.target.value))} disabled={!now} aria-label={title} className="min-w-0 flex-1 accent-[#EC4899]" />
              <span className="w-9 shrink-0 text-[10px] tabular-nums text-white/70">{clock(tune.dur)}</span>
              <Equalizer on={Boolean(now && tune.playing)} className="h-5 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="mb-2 flex gap-1.5">
        <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} aria-label={t("music.search")} placeholder={t("music.search")} autoComplete="off" className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-sm outline-none focus:border-[#7C3AED]" />
        <button type="submit" aria-label={t("bottle.songSearch")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8B5CF6,#EC4899)] text-white shadow hover:brightness-110"><Search size={18} /></button>
      </form>

      <div role="tablist" className="mb-2 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {tabs.map(([key, Icon, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => { setTab(key); if (key === "popular") void fetchSongs(""); if (key === "search" && query.trim().length >= 2) void fetchSongs(query.trim()); }} className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold", tab === key ? "bg-[linear-gradient(90deg,#EC4899,#8B5CF6)] text-white shadow" : "bg-surface text-muted hover:text-text")}>
            <Icon size={15} fill={tab === key && (key === "popular" || key === "fav") ? "currentColor" : "none"} />{label}
          </button>
        ))}
        <button role="tab" aria-selected={tab === "mine"} onClick={() => setTab("mine")} className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold", tab === "mine" ? "bg-[linear-gradient(90deg,#EC4899,#8B5CF6)] text-white shadow" : "bg-surface text-muted hover:text-text")}>MP3 · {t("music.tabMine")}</button>
      </div>

      {failure ? <p role="alert" className="mb-2 rounded-xl border border-danger px-4 py-2.5 text-sm text-danger">{t(failure)}</p> : null}

      <div className="min-h-[240px] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#1E1B3A,#2D1B4E)] p-1.5">
        {tab === "mine" ? (
          <>
            <label aria-busy={busy} className={cn("m-1.5 flex h-12 items-center justify-center gap-2 rounded-full border-2 border-dashed border-white/40 text-sm font-semibold text-white hover:bg-white/10", busy ? "cursor-wait opacity-70" : "cursor-pointer")}>
              {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}{t(busy ? "videos.uploading" : "music.upload")}
              <input type="file" accept="audio/*" multiple disabled={busy} className="sr-only" onChange={handleUpload} />
            </label>
            {!mine.length ? <p className="py-8 text-center text-xs text-white/60">{t("music.emptyMine")}</p> : null}
            <ul>
              {mine.map((track) => {
                const active = nowKey(now) === `file:${track.id}`;
                return (
                  <li key={track.id} className="flex items-center">
                    <button type="button" onClick={() => (active ? toggle() : playFile(track))} className={cn(row, active && "bg-white/10")}>
                      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/20", discBg, active && tune.playing && "animate-[spin_3s_linear_infinite]")}><span className="h-2 w-2 rounded-full bg-white/80" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{track.title}</span><span className="block truncate text-[11px] text-white/60">{track.artist}</span></span>
                      {track.duration ? <span className="shrink-0 text-[11px] tabular-nums text-white/50">{clock(track.duration)}</span> : null}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm group-hover:bg-[#EC4899]">{active && tune.playing ? <Pause size={13} fill="currentColor" /> : "▶"}</span>
                    </button>
                    {track.mine ? <button type="button" onClick={() => removeTrack(track.id)} aria-label={t("music.remove")} title={t("music.remove")} className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-[#FCA5A5]"><Trash2 size={15} /></button> : null}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            {(tab === "popular" || tab === "search") && state === "loading" ? <p role="status" className="py-8 text-center text-xs text-white/70">{t("bottle.songLoading")}</p> : null}
            {(tab === "popular" || tab === "search") && state === "nokey" ? <p role="status" className="m-1.5 rounded-lg bg-[#FEF3C7] p-3 text-xs font-semibold text-[#92400E]">{t("bottle.songNoKey")}</p> : null}
            {(tab === "popular" || tab === "search") && state === "fail" ? <p role="status" className="m-1.5 rounded-lg bg-[#FEE2E2] p-3 text-xs font-semibold text-[#991B1B]">{t("bottle.songFail")}</p> : null}
            {!ytList.length && state !== "loading" ? <p className="py-8 text-center text-xs text-white/60">{tab === "search" ? t("music.searchHint") : t("bottle.songEmpty")}</p> : null}
            <ul>
              {ytList.map((song) => {
                const [who, what] = split(song.title);
                const active = nowKey(now) === `yt:${song.id}`;
                const fav = favs.some((item) => item.id === song.id);
                return (
                  <li key={song.id} className="flex items-center">
                    <button type="button" onClick={() => (active ? toggle() : playYt(song))} className={cn(row, active && "bg-white/10")}>
                      <span className={cn("relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-black", active && tune.playing && "animate-[spin_3s_linear_infinite]")}><img src={`https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full scale-150 object-cover" /><span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1E1B3A] ring-2 ring-white/40" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-semibold">{what}</span>{who ? <span className="block truncate text-[11px] text-white/60">{who}</span> : null}</span>
                      {song.duration ? <span className="shrink-0 text-[11px] tabular-nums text-white/50">{song.duration}</span> : null}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm group-hover:bg-[#EC4899]">{active && tune.playing ? <Pause size={13} fill="currentColor" /> : "▶"}</span>
                    </button>
                    <button type="button" onClick={() => toggleFav(song)} aria-pressed={fav} aria-label={t("bottle.songFav")} title={t("bottle.songFav")} className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/10"><Star size={16} fill={fav ? "#FACC15" : "none"} stroke={fav ? "#FACC15" : "rgba(255,255,255,0.6)"} /></button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
