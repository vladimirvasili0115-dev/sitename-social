import type { Story } from "@/types";
import { uploadBlob, uploadImage } from "./media";
import { toUser, type ProfileRow } from "./remoteProfiles";
import { supabase } from "./supabase";

type Row = { id: string; image_url: string | null; video_url?: string | null; created_at: string; author: ProfileRow | ProfileRow[] | null };
const none: Story[] = [];
let state = none;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
function set(next: Story[]) {
  state = next;
  listeners.forEach((listener) => listener());
}
export const remoteStories = {
  get: () => state,
  getServer: () => none,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

// Stories from the last 24 hours, grouped per author with the signed-in user's own story first.
export async function refreshStories() {
  if (!supabase) return;
  const userId = (await supabase.auth.getSession()).data.session?.user.id;
  if (!userId) return set(none);
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { data, error } = await supabase.from("stories").select("id,image_url,video_url,created_at,author:profiles!stories_author_id_fkey(id,name,handle,avatar_url)").gt("created_at", since).order("created_at").limit(500);
  if (error) return console.error("Stories could not be loaded:", error.message);
  const byAuthor = new Map<string, Story>();
  (data as unknown as Row[]).forEach((row) => {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    if (!author) return;
    const mine = author.id === userId;
    const story = byAuthor.get(author.id) ?? { id: mine ? "story-me" : `story-${author.id}`, user: toUser(author), slides: [], mine };
    story.slides.push({ id: row.id, image: row.image_url ?? "", video: row.video_url ?? undefined, at: Date.parse(row.created_at) });
    byAuthor.set(author.id, story);
  });
  const list = [...byAuthor.values()];
  set([...list.filter((story) => story.mine), ...list.filter((story) => !story.mine).reverse()]);
}
export function ensureStoriesLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshStories();
}
export function resetRemoteStories() {
  loadedFor = null;
  set(none);
}
export async function addRemoteStory(dataUrl: string) {
  if (!supabase) return;
  const image_url = await uploadImage(dataUrl, "stories");
  if (!image_url) return;
  const { error } = await supabase.from("stories").insert({ image_url });
  if (error) console.error("Story could not be saved:", error.message);
  await refreshStories();
}
// A video story (up to a minute): the file goes to storage, the story row keeps its address.
export async function addRemoteStoryVideo(file: File) {
  if (!supabase) return false;
  const extension = (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || (file.type.includes("webm") ? "webm" : file.type.includes("quicktime") ? "mov" : "mp4");
  const video_url = await uploadBlob(file, "stories", extension);
  if (!video_url) return false;
  const { error } = await supabase.from("stories").insert({ video_url });
  if (error) { console.error("Story could not be saved:", error.message); return false; }
  await refreshStories();
  return true;
}
// Who watched a story: every viewer is recorded once; only the author can read the list.
export async function markStoryViewed(id: string) {
  if (!supabase) return;
  await supabase.rpc("story_view", { p_story: id });
}
export type StoryViewer = { id: string; name: string | null; avatar: string | null; at: number };
export async function fetchStoryViewers(id: string): Promise<StoryViewer[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("story_viewers", { p_story: id });
  return error ? null : ((data as StoryViewer[]) ?? []);
}
export async function removeRemoteStory(id: string) {
  if (!supabase) return;
  await supabase.from("stories").delete().eq("id", id);
  await refreshStories();
}
