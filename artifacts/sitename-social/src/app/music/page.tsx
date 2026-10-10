"use client";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import type { Track } from "@/types";
import { tracks } from "@/data/music";
import { createStore } from "@/lib/store";
import { useToggleList } from "@/lib/useToggleList";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Tabs } from "@/components/ui/Tabs";
import { TrackRow } from "@/components/music/TrackRow";
import { PlayerBar } from "@/components/music/PlayerBar";
import { usePlayer } from "@/components/music/usePlayer";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/components/profile/useProfile";
import { deleteRemoteTrack, ensureMusicLoaded, remoteMusic, toggleTrackFavorite, uploadRemoteTrack } from "@/lib/musicSync";
import { isRemoteId } from "@/lib/remoteProfiles";
import { supabase } from "@/lib/supabase";
import type { TranslationKey } from "@/i18n/LanguageProvider";

type MusicTab = "all" | "favorites" | "mine";
const favoritesStore = createStore<string[]>("sitename-music-favorites", []);
const online = Boolean(supabase);

export default function MusicPage() {
  const { t } = useTranslation();
  const [localFavorites, toggleLocalFavorite] = useToggleList(favoritesStore);
  const remote = useSyncExternalStore(remoteMusic.subscribe, remoteMusic.get, remoteMusic.getServer);
  const accountId = useAuth().user?.id;
  const { user } = useProfile();
  useEffect(() => ensureMusicLoaded(accountId), [accountId]);
  const [localMine, setMine] = useState<Track[]>([]);
  const [tab, setTab] = useState<MusicTab>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<TranslationKey | null>(null);
  const mine = useMemo(() => (online ? remote.tracks.filter((track) => track.mine) : localMine), [remote, localMine]);
  const all = useMemo(() => [...(online ? remote.tracks : localMine), ...tracks], [remote, localMine]);
  const favorites = useMemo(() => [...remote.favorites, ...localFavorites], [remote, localFavorites]);
  const toggleFavorite = (id: string) => (isRemoteId(id) ? void toggleTrackFavorite(id) : toggleLocalFavorite(id));
  const favoriteList = all.filter((track) => favorites.includes(track.id));
  const needle = query.trim().toLocaleLowerCase();
  const source = tab === "favorites" ? favoriteList : tab === "mine" ? mine : all;
  const visible = source.filter((track) => !needle || `${track.title} ${track.artist}`.toLocaleLowerCase().includes(needle));
  const setDuration = useCallback((id: string, seconds: number) => setMine((list) => list.map((track) => (track.id === id ? { ...track, duration: seconds } : track))), []);
  const player = usePlayer(visible.length ? visible : all, setDuration);
  const current = all.find((track) => track.id === player.currentId) ?? null;

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
    } else setMine((list) => [...files.map((file, index): Track => ({ id: `my-${Date.now()}-${index}`, title: file.name.replace(/\.[^.]+$/, ""), artist: t("common.you"), duration: 0, src: URL.createObjectURL(file), mine: true })), ...list]);
    setTab("mine");
  }
  const removeTrack = (id: string) => (isRemoteId(id) ? void deleteRemoteTrack(id) : setMine((list) => list.filter((track) => track.id !== id)));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center">
        <h1 className="flex-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.music")}</h1>
        <SearchInput value={query} onChange={setQuery} label={t("music.search")} className="sm:w-[260px]" />
        <label aria-busy={busy} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-bg hover:brightness-110 ${busy ? "cursor-wait opacity-70" : "cursor-pointer"}`}>
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}{t(busy ? "videos.uploading" : "music.upload")}
          <input type="file" accept="audio/*" multiple disabled={busy} className="sr-only" onChange={handleUpload} />
        </label>
      </div>
      {failure ? <p role="alert" className="mb-3 rounded-xl border border-danger px-4 py-2.5 text-sm text-danger">{t(failure)}</p> : null}
      <Tabs<MusicTab> active={tab} onChange={setTab} tabs={[{ id: "all", label: t("common.all"), count: all.length }, { id: "favorites", label: t("common.favorites"), count: favoriteList.length }, { id: "mine", label: t("music.tabMine"), count: mine.length }]} />
      {visible.length ? (
        <Card className="p-2">
          <ul>
            {visible.map((track) => (
              <li key={track.id}><TrackRow track={track} active={track.id === player.currentId} playing={player.playing} favorite={favorites.includes(track.id)} onPlay={() => player.play(track.id)} onFavorite={() => toggleFavorite(track.id)} onDelete={track.mine ? () => removeTrack(track.id) : undefined} /></li>
            ))}
          </ul>
        </Card>
      ) : <Card className="p-8 text-center text-sm text-muted">{needle ? t("friends.noResults") : t(tab === "mine" ? "music.emptyMine" : "music.empty")}</Card>}
      <audio {...player.audioProps} src={current?.src} className="hidden" />
      {current ? <PlayerBar track={current} playing={player.playing} position={player.position} shuffle={player.shuffle} repeat={player.repeat} onToggle={player.toggle} onPrev={() => player.step(-1)} onNext={() => player.step(1)} onSeek={player.seek} onShuffle={player.toggleShuffle} onRepeat={player.toggleRepeat} /> : null}
    </div>
  );
}
