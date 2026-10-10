import type { Post, PostComment } from "@/types";
import { currentUser } from "@/data/users";
import { isDataUrl, uploadImage } from "./media";
import { isRemoteId, toUser, type ProfileRow } from "./remoteProfiles";
import { supabase } from "./supabase";
import { flashRefusal } from "./flash";
import { agoLabel } from "./utils";

type RemoteState = { posts: Post[]; groups: Record<string, Post[]>; comments: Record<string, PostComment[]>; liked: string[] };
type One<T> = T | T[] | null;
type CommentRow = { id: string; text: string; created_at: string; author: One<ProfileRow> };
type PostRow = { id: string; text: string; kind?: string | null; group_id?: string | null; image_url: string | null; created_at: string; edited_at: string | null; author: One<ProfileRow>; post_likes: { user_id: string }[]; comments: CommentRow[] };
type Loaded = { posts: Post[]; comments: Record<string, PostComment[]>; liked: string[] };

const SELECT = "*,author:profiles!posts_author_id_fkey(id,name,handle,avatar_url),post_likes(user_id),comments(id,text,created_at,author:profiles!comments_author_id_fkey(id,name,handle,avatar_url))";
const empty: RemoteState = { posts: [], groups: {}, comments: {}, liked: [] };
let state = empty;
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
const first = <T,>(value: One<T>) => (Array.isArray(value) ? value[0] ?? null : value);
function set(next: RemoteState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const remotePosts = {
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

// Loads the wall feed (groupId null) or one group's posts, with authors, likes and comments.
async function load(groupId: string | null, userId: string): Promise<Loaded | null> {
  if (!supabase) return null;
  const base = () => supabase!.from("posts").select(SELECT).order("created_at", { ascending: false }).limit(60);
  let result = await (groupId ? base().eq("group_id", groupId) : base().is("group_id", null));
  // Before the groups step is applied the column does not exist yet: fall back to all posts.
  if (result.error && !groupId && result.error.message.includes("group_id")) result = await base();
  if (result.error || !result.data) {
    console.error("Posts could not be loaded:", result.error?.message);
    return null;
  }
  const comments: Record<string, PostComment[]> = {};
  const liked: string[] = [];
  const posts = (result.data as unknown as PostRow[]).flatMap((row): Post[] => {
    const author = first(row.author);
    if (!author) return [];
    const mine = row.post_likes.some((like) => like.user_id === userId);
    if (mine) liked.push(row.id);
    comments[row.id] = [...row.comments].sort((a, b) => a.created_at.localeCompare(b.created_at)).flatMap((item): PostComment[] => {
      const writer = first(item.author);
      if (!writer) return [];
      const own = writer.id === userId;
      return [{ id: item.id, userId: own ? currentUser.id : writer.id, text: item.text, at: Date.parse(item.created_at), author: own ? undefined : toUser(writer) }];
    });
    return [{
      id: row.id, author: toUser(author), time: agoLabel(Date.parse(row.created_at)), text: row.text, image: row.image_url ?? undefined, groupId: row.group_id ?? undefined,
      likes: row.post_likes.length - (mine ? 1 : 0), comments: 0, reactions: [], mine: author.id === userId, edited: Boolean(row.edited_at), kind: row.kind === "avatar" ? "avatar" : undefined,
    }];
  });
  return { posts, comments, liked };
}

export async function refreshPosts() {
  const userId = await sessionUserId();
  if (!supabase || !userId) return set(empty);
  const groupIds = Object.keys(state.groups);
  const [feed, ...groupResults] = await Promise.all([load(null, userId), ...groupIds.map((id) => load(id, userId))]);
  if (!feed) return;
  const loaded = [feed, ...groupResults.filter((item): item is Loaded => Boolean(item))];
  set({
    posts: feed.posts,
    groups: Object.fromEntries(groupIds.map((id, index) => [id, groupResults[index]?.posts ?? state.groups[id]])),
    comments: Object.assign({}, ...loaded.map((item) => item.comments)),
    liked: [...new Set(loaded.flatMap((item) => item.liked))],
  });
}
export async function loadGroupPosts(groupId: string) {
  const userId = await sessionUserId();
  if (!userId) return;
  const result = await load(groupId, userId);
  if (result) set({ ...state, groups: { ...state.groups, [groupId]: result.posts }, comments: { ...state.comments, ...result.comments }, liked: [...new Set([...state.liked, ...result.liked])] });
}

export function ensurePostsLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshPosts();
}
export function resetRemotePosts() {
  loadedFor = null;
  set(empty);
}

export { isRemoteId };
export async function createRemotePost(input: { text: string; image?: string; groupId?: string }) {
  if (!supabase) return;
  const image_url = isDataUrl(input.image) ? await uploadImage(input.image, "posts") : null;
  const { error } = await supabase.from("posts").insert({ text: input.text, image_url, ...(input.groupId ? { group_id: input.groupId } : {}) });
  if (error && !flashRefusal(error.message)) console.error("Post could not be saved:", error.message);
  await refreshPosts();
}
// A new profile photo also appears on the wall. Falls back to a plain photo post if the "kind" column is missing.
export async function createAvatarPost(imageUrl: string) {
  if (!supabase) return;
  const { error } = await supabase.from("posts").insert({ text: "", image_url: imageUrl, kind: "avatar" });
  if (error) await supabase.from("posts").insert({ text: "", image_url: imageUrl });
  await refreshPosts();
}
export async function editRemotePost(id: string, text: string) {
  if (!supabase) return;
  const { error } = await supabase.from("posts").update({ text, edited_at: new Date().toISOString() }).eq("id", id);
  if (error) flashRefusal(error.message);
  await refreshPosts();
}
export async function deleteRemotePost(id: string) {
  if (!supabase) return;
  set({ ...state, posts: state.posts.filter((post) => post.id !== id), groups: Object.fromEntries(Object.entries(state.groups).map(([key, list]) => [key, list.filter((post) => post.id !== id)])) });
  await supabase.from("posts").delete().eq("id", id);
}
export async function toggleRemoteLike(id: string) {
  const userId = await sessionUserId();
  if (!supabase || !userId) return;
  const liked = state.liked.includes(id);
  set({ ...state, liked: liked ? state.liked.filter((item) => item !== id) : [...state.liked, id] });
  if (liked) await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", userId);
  else await supabase.from("post_likes").insert({ post_id: id });
}
export async function addRemoteComment(postId: string, text: string) {
  if (!supabase) return;
  const { error } = await supabase.from("comments").insert({ post_id: postId, text });
  if (error && !flashRefusal(error.message)) console.error("Comment could not be saved:", error.message);
  await refreshPosts();
}
export async function removeRemoteComment(postId: string, id: string) {
  if (!supabase) return;
  set({ ...state, comments: { ...state.comments, [postId]: (state.comments[postId] ?? []).filter((item) => item.id !== id) } });
  await supabase.from("comments").delete().eq("id", id);
}
