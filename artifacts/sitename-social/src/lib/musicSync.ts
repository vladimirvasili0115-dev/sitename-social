import type { Track } from "@/types";
import { removeFiles, uploadBlob } from "./media";
import { supabase } from "./supabase";
import type { UploadError } from "./videosSync";

type Row = { id: string; owner_id: string; title: string; artist: string; audio_url: string; duration: number };
type RemoteMusic = { tracks: Track[]; favorites: string[] };
export const MAX_TRACK_BYTES = 20 * 1024 * 1024;

const empty: RemoteMusic = { tracks: [], favorites: [] };
let state = empty;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
function set(next: RemoteMusic) {
  state = next;
  listeners.forEach((listener) => listener());
}
export const remoteMusic = {
  get: () => state,
  getServer: () => empty,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
async function sessionUserId() {
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session?.user.id ?? null;
}

export async function refreshMusic() {
  const userId = await sessionUserId();
  if (!supabase || !userId) return set(empty);
  const [list, favorites] = await Promise.all([
    supabase.from("tracks").select("id,owner_id,title,artist,audio_url,duration").order("created_at", { ascending: false }).limit(300),
    supabase.from("track_favorites").select("track_id").eq("user_id", userId),
  ]);
  if (list.error) return console.error("Music could not be loaded:", list.error.message);
  set({
    tracks: (list.data as Row[]).map((row): Track => ({ id: row.id, title: row.title, artist: row.artist, duration: row.duration, src: row.audio_url, mine: row.owner_id === userId })),
    favorites: ((favorites.data ?? []) as { track_id: string }[]).map((row) => row.track_id),
  });
}
export function ensureMusicLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshMusic();
}
export function resetRemoteMusic() {
  loadedFor = null;
  set(empty);
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const finish = (seconds: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(seconds) ? Math.round(seconds) : 0);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(audio.duration);
    audio.onerror = () => finish(0);
    window.setTimeout(() => finish(0), 6000);
    audio.src = url;
  });
}

export async function uploadRemoteTrack(file: File, artist: string): Promise<UploadError | null> {
  if (!supabase) return "failed";
  if (file.size > MAX_TRACK_BYTES) return "tooBig";
  const duration = await readDuration(file);
  const extension = (file.name.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "mp3";
  const audio_url = await uploadBlob(file, "music", extension);
  if (!audio_url) return "failed";
  // "Artist - Title.mp3" is split into its two parts.
  const name = file.name.replace(/\.[^.]+$/, "").trim() || "Track";
  const parts = name.split(" - ");
  const named = parts.length > 1 && parts[0].trim() && parts.slice(1).join(" - ").trim();
  const { error } = await supabase.from("tracks").insert({ title: (named ? parts.slice(1).join(" - ").trim() : name).slice(0, 200), artist: (named ? parts[0].trim() : artist).slice(0, 200), audio_url, duration });
  if (error) {
    console.error("Track could not be saved:", error.message);
    await removeFiles([audio_url]);
    return "failed";
  }
  await refreshMusic();
  return null;
}
export async function deleteRemoteTrack(id: string) {
  if (!supabase) return;
  const target = state.tracks.find((track) => track.id === id);
  set({ ...state, tracks: state.tracks.filter((track) => track.id !== id) });
  const { error } = await supabase.from("tracks").delete().eq("id", id);
  if (error) return void refreshMusic();
  await removeFiles([target?.src]);
}
export async function toggleTrackFavorite(id: string) {
  const userId = await sessionUserId();
  if (!supabase || !userId) return;
  const on = state.favorites.includes(id);
  set({ ...state, favorites: on ? state.favorites.filter((item) => item !== id) : [...state.favorites, id] });
  const { error } = on ? await supabase.from("track_favorites").delete().eq("track_id", id).eq("user_id", userId) : await supabase.from("track_favorites").insert({ track_id: id });
  if (error) console.error("Favorite could not be saved:", error.message);
}
