import type { AlbumId, Photo, PhotoAlbum, PostComment } from "@/types";
import { currentUser } from "@/data/users";
import { uploadImage } from "./media";
import { isRemoteId, toUser, type ProfileRow } from "./remoteProfiles";
import { supabase } from "./supabase";
import { flashRefusal } from "./flash";

type Row = { id: string; url: string; album: AlbumId; album_id?: string | null };
let state: Photo[] = [];
let albums: PhotoAlbum[] = [];
let loadedFor: string | null = null;
const none: Photo[] = [];
const listeners = new Set<() => void>();
function set(next: Photo[]) {
  state = next;
  listeners.forEach((listener) => listener());
}

const albumListeners = new Set<() => void>();
const noAlbums: PhotoAlbum[] = [];
export const remoteAlbums = {
  get: () => albums,
  getServer: () => noAlbums,
  subscribe: (listener: () => void) => {
    albumListeners.add(listener);
    return () => { albumListeners.delete(listener); };
  },
};
function setAlbums(next: PhotoAlbum[]) {
  albums = next;
  albumListeners.forEach((listener) => listener());
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
  const { data } = await supabase.from("photos").select("*").eq("owner_id", userId).order("created_at", { ascending: false }).limit(300);
  return ((data ?? []) as Row[]).map((row) => ({ id: row.id, src: row.url, album: row.album, own, albumId: row.album_id ?? undefined }));
}
export async function fetchAlbums(userId: string): Promise<PhotoAlbum[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("photo_albums").select("id,title").eq("owner_id", userId).order("created_at", { ascending: true });
  return error ? [] : ((data ?? []) as PhotoAlbum[]);
}

export async function refreshPhotos() {
  if (!supabase) return;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  const [list, own] = userId ? await Promise.all([fetchUserPhotos(userId, true), fetchAlbums(userId)]) : [[], []];
  set(list);
  setAlbums(own);
}
export function ensurePhotosLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshPhotos();
}
export function resetRemotePhotos() {
  loadedFor = null;
  set([]);
  setAlbums([]);
}

export async function addPhotoRow(url: string, album: "profile" | "uploads") {
  if (!supabase) return;
  await supabase.from("photos").insert({ url, album });
  await refreshPhotos();
}
export async function uploadPhotos(dataUrls: string[], albumId?: string) {
  if (!supabase) return 0;
  const urls = (await Promise.all(dataUrls.map((item) => uploadImage(item, "photos")))).filter((url): url is string => Boolean(url));
  if (urls.length) await supabase.from("photos").insert(urls.map((url) => ({ url, album: "uploads", ...(albumId ? { album_id: albumId } : {}) })));
  await refreshPhotos();
  return urls.length;
}
export async function removePhotoRow(id: string) {
  if (!supabase) return;
  set(state.filter((photo) => photo.id !== id));
  await supabase.from("photos").delete().eq("id", id);
}

// ---- albums of your own ----
export async function createAlbum(title: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("photo_albums").insert({ title: title.trim().slice(0, 80) }).select("id,title").single();
  if (error) { if (!flashRefusal(error.message)) console.error("Album could not be created:", error.message); return null; }
  setAlbums([...albums, data as PhotoAlbum]);
  return (data as PhotoAlbum).id;
}
export async function renameAlbum(id: string, title: string) {
  if (!supabase || !title.trim()) return;
  setAlbums(albums.map((item) => (item.id === id ? { ...item, title: title.trim().slice(0, 80) } : item)));
  await supabase.from("photo_albums").update({ title: title.trim().slice(0, 80) }).eq("id", id);
}
export async function deleteAlbum(id: string) {
  if (!supabase) return;
  // The photos stay (they go back to "Uploads"); only the album is removed.
  setAlbums(albums.filter((item) => item.id !== id));
  set(state.map((photo) => (photo.albumId === id ? { ...photo, albumId: undefined } : photo)));
  await supabase.from("photo_albums").delete().eq("id", id);
}
export async function movePhoto(photoId: string, albumId: string | null) {
  if (!supabase) return;
  set(state.map((photo) => (photo.id === photoId ? { ...photo, albumId: albumId ?? undefined } : photo)));
  const { error } = await supabase.from("photos").update({ album_id: albumId }).eq("id", photoId);
  if (error) console.error("Photo could not be moved:", error.message);
}

// ---- likes and comments on a photo ----
export type PhotoSocial = { likes: number; liked: boolean; comments: PostComment[] };
type CommentRow = { id: string; text: string; created_at: string; author: ProfileRow | ProfileRow[] | null };
export async function fetchPhotoSocial(photoId: string): Promise<PhotoSocial | null> {
  if (!supabase || !isRemoteId(photoId)) return null;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  const [likes, comments] = await Promise.all([
    supabase.from("photo_likes").select("user_id").eq("photo_id", photoId),
    supabase.from("photo_comments").select("id,text,created_at,author:profiles!photo_comments_author_id_fkey(id,name,handle,avatar_url)").eq("photo_id", photoId).order("created_at", { ascending: true }).limit(200),
  ]);
  if (likes.error) return null;
  const rows = (likes.data ?? []) as { user_id: string }[];
  return {
    likes: rows.length,
    liked: rows.some((row) => row.user_id === userId),
    comments: ((comments.data ?? []) as CommentRow[]).flatMap((row): PostComment[] => {
      const author = Array.isArray(row.author) ? row.author[0] : row.author;
      if (!author) return [];
      const mine = author.id === userId;
      return [{ id: row.id, userId: mine ? currentUser.id : author.id, text: row.text, at: Date.parse(row.created_at), author: mine ? undefined : toUser(author) }];
    }),
  };
}
export async function togglePhotoLike(photoId: string, liked: boolean) {
  if (!supabase) return;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (!userId) return;
  if (liked) await supabase.from("photo_likes").delete().eq("photo_id", photoId).eq("user_id", userId);
  else await supabase.from("photo_likes").insert({ photo_id: photoId });
}
export async function addPhotoComment(photoId: string, text: string) {
  if (!supabase) return;
  const { error } = await supabase.from("photo_comments").insert({ photo_id: photoId, text });
  if (error && !flashRefusal(error.message)) console.error("Comment could not be saved:", error.message);
}
export async function removePhotoComment(id: string) {
  if (!supabase) return;
  await supabase.from("photo_comments").delete().eq("id", id);
}
