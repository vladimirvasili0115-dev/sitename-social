import type { Story } from "@/types";
import { uploadImage } from "./media";
import { toUser, type ProfileRow } from "./remoteProfiles";
import { supabase } from "./supabase";

type Row = { id: string; image_url: string; created_at: string; author: ProfileRow | ProfileRow[] | null };
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
  const { data, error } = await supabase.from("stories").select("id,image_url,created_at,author:profiles!stories_author_id_fkey(id,name,handle,avatar_url)").gt("created_at", since).order("created_at").limit(500);
  if (error) return console.error("Stories could not be loaded:", error.message);
  const byAuthor = new Map<string, Story>();
  (data as unknown as Row[]).forEach((row) => {
    const author = Array.isArray(row.author) ? row.author[0] : row.author;
    if (!author) return;
    const mine = author.id === userId;
    const story = byAuthor.get(author.id) ?? { id: mine ? "story-me" : `story-${author.id}`, user: toUser(author), slides: [], mine };
    story.slides.push({ id: row.id, image: row.image_url, at: Date.parse(row.created_at) });
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
export async function removeRemoteStory(id: string) {
  if (!supabase) return;
  await supabase.from("stories").delete().eq("id", id);
  await refreshStories();
}
