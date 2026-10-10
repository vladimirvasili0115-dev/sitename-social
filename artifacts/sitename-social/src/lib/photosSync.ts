import type { AlbumId, Photo } from "@/types";
import { uploadImage } from "./media";
import { supabase } from "./supabase";

type Row = { id: string; url: string; album: AlbumId };
let state: Photo[] = [];
let loadedFor: string | null = null;
const none: Photo[] = [];
const listeners = new Set<() => void>();
function set(next: Photo[]) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const remotePhotos = {
  get: () => state,
  getServer: () => none,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

export async function fetchUserPhotos(userId: string, own = false): Promise<Photo[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("photos").select("id,url,album").eq("owner_id", userId).order("created_at", { ascending: false }).limit(200);
  return ((data ?? []) as Row[]).map((row) => ({ id: row.id, src: row.url, album: row.album, own }));
}

export async function refreshPhotos() {
  if (!supabase) return;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  set(userId ? await fetchUserPhotos(userId, true) : []);
}
export function ensurePhotosLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshPhotos();
}
export function resetRemotePhotos() {
  loadedFor = null;
  set([]);
}

export async function addPhotoRow(url: string, album: "profile" | "uploads") {
  if (!supabase) return;
  await supabase.from("photos").insert({ url, album });
  await refreshPhotos();
}
export async function uploadPhotos(dataUrls: string[]) {
  if (!supabase) return 0;
  const urls = (await Promise.all(dataUrls.map((item) => uploadImage(item, "photos")))).filter((url): url is string => Boolean(url));
  if (urls.length) await supabase.from("photos").insert(urls.map((url) => ({ url, album: "uploads" })));
  await refreshPhotos();
  return urls.length;
}
export async function removePhotoRow(id: string) {
  if (!supabase) return;
  set(state.filter((photo) => photo.id !== id));
  await supabase.from("photos").delete().eq("id", id);
}
