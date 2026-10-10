import type { PostComment, Video } from "@/types";
import { currentUser } from "@/data/users";
import { removeFiles, uploadBlob, uploadImage } from "./media";
import { toUser, type ProfileRow } from "./remoteProfiles";
import { supabase } from "./supabase";
import { flashRefusal } from "./flash";

type One<T> = T | T[] | null;
type CommentRow = { id: string; text: string; created_at: string; author: One<ProfileRow> };
type Row = {
  id: string; kind: "video" | "reel"; title: string; video_url: string; thumb_url: string | null; duration: number;
  author: One<ProfileRow>; video_likes: { user_id: string }[]; video_comments: CommentRow[];
};
type RemoteVideos = { videos: Video[]; reels: Video[]; liked: string[]; saved: string[]; comments: Record<string, PostComment[]> };
export type UploadError = "tooBig" | "failed";
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const SELECT = "id,kind,title,video_url,thumb_url,duration,author:profiles!videos_author_id_fkey(id,name,handle,avatar_url),video_likes(user_id),video_comments(id,text,created_at,author:profiles!video_comments_author_id_fkey(id,name,handle,avatar_url))";
const empty: RemoteVideos = { videos: [], reels: [], liked: [], saved: [], comments: {} };
let state = empty;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
const first = <T,>(value: One<T>) => (Array.isArray(value) ? value[0] ?? null : value);
function set(next: RemoteVideos) {
  state = next;
  listeners.forEach((listener) => listener());
}
export const remoteVideos = {
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

export async function refreshVideos() {
  const userId = await sessionUserId();
  if (!supabase || !userId) return set(empty);
  const [list, saves] = await Promise.all([
    supabase.from("videos").select(SELECT).order("created_at", { ascending: false }).limit(200),
    supabase.from("video_saves").select("video_id").eq("user_id", userId),
  ]);
  if (list.error) return console.error("Videos could not be loaded:", list.error.message);
  const liked: string[] = [];
  const comments: Record<string, PostComment[]> = {};
  const all = (list.data as unknown as Row[]).flatMap((row): Video[] => {
    const author = first(row.author);
    if (!author) return [];
    const mine = row.video_likes.some((like) => like.user_id === userId);
    if (mine) liked.push(row.id);
    comments[row.id] = [...row.video_comments].sort((a, b) => a.created_at.localeCompare(b.created_at)).flatMap((item): PostComment[] => {
      const writer = first(item.author);
      if (!writer) return [];
      const own = writer.id === userId;
      return [{ id: item.id, userId: own ? currentUser.id : writer.id, text: item.text, at: Date.parse(item.created_at), author: own ? undefined : toUser(writer) }];
    });
    return [{
      id: row.id, kind: row.kind, title: row.title, author: row.kind === "reel" ? author.handle : author.name, authorId: author.id, mine: author.id === userId,
      duration: row.duration, views: 0, src: row.video_url, thumb: row.thumb_url ?? undefined, likes: row.video_likes.length - (mine ? 1 : 0), comments: 0,
    }];
  });
  set({
    videos: all.filter((video) => video.kind !== "reel"), reels: all.filter((video) => video.kind === "reel"),
    liked, saved: ((saves.data ?? []) as { video_id: string }[]).map((row) => row.video_id), comments,
  });
}
export function ensureVideosLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshVideos();
}
export function resetRemoteVideos() {
  loadedFor = null;
  set(empty);
}

// Reads the length of a video and grabs one frame as its cover image.
function inspect(file: File): Promise<{ duration: number; thumb: string | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const finish = (thumb: string | null) => {
      if (settled) return;
      settled = true;
      const duration = Number.isFinite(video.duration) ? Math.round(video.duration) : 0;
      URL.revokeObjectURL(url);
      resolve({ duration, thumb });
    };
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadeddata = () => { video.currentTime = Math.min(1, (video.duration || 2) / 2); };
    video.onseeked = () => {
      try {
        const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight, 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        finish(null);
      }
    };
    video.onerror = () => finish(null);
    window.setTimeout(() => finish(null), 8000);
    video.src = url;
  });
}

export async function uploadRemoteVideo(file: File, kind: "video" | "reel"): Promise<UploadError | null> {
  if (!supabase) return "failed";
  if (file.size > MAX_VIDEO_BYTES) return "tooBig";
  const { duration, thumb } = await inspect(file);
  const extension = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "mp4";
  const video_url = await uploadBlob(file, "videos", extension);
  if (!video_url) return "failed";
  const thumb_url = thumb ? await uploadImage(thumb, "videos") : null;
  const { error } = await supabase.from("videos").insert({ kind, title: file.name.replace(/\.[^.]+$/, "").slice(0, 200), video_url, thumb_url, duration });
  if (error) {
    console.error("Video could not be saved:", error.message);
    await removeFiles([video_url, thumb_url]);
    return "failed";
  }
  await refreshVideos();
  return null;
}
export async function deleteRemoteVideo(id: string) {
  if (!supabase) return;
  const target = [...state.videos, ...state.reels].find((video) => video.id === id);
  set({ ...state, videos: state.videos.filter((video) => video.id !== id), reels: state.reels.filter((video) => video.id !== id) });
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) return void refreshVideos();
  await removeFiles([target?.src, target?.thumb]);
}
async function toggle(table: "video_likes" | "video_saves", key: "liked" | "saved", id: string) {
  const userId = await sessionUserId();
  if (!supabase || !userId) return;
  const on = state[key].includes(id);
  set({ ...state, [key]: on ? state[key].filter((item) => item !== id) : [...state[key], id] });
  const { error } = on ? await supabase.from(table).delete().eq("video_id", id).eq("user_id", userId) : await supabase.from(table).insert({ video_id: id });
  if (error) console.error("Video action failed:", error.message);
}
export const toggleVideoLike = (id: string) => void toggle("video_likes", "liked", id);
export const toggleVideoSave = (id: string) => void toggle("video_saves", "saved", id);
export async function addVideoComment(videoId: string, text: string) {
  if (!supabase) return;
  const { error } = await supabase.from("video_comments").insert({ video_id: videoId, text });
  if (error && !flashRefusal(error.message)) console.error("Comment could not be saved:", error.message);
  await refreshVideos();
}
export async function removeVideoComment(videoId: string, id: string) {
  if (!supabase) return;
  set({ ...state, comments: { ...state.comments, [videoId]: (state.comments[videoId] ?? []).filter((item) => item.id !== id) } });
  await supabase.from("video_comments").delete().eq("id", id);
}
