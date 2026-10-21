import type { Poll, Post, PostComment } from "@/types";
import { currentUser } from "@/data/users";
import { isDataUrl, lastUploadError, uploadBlob, uploadImage } from "./media";
import { isRemoteId, toUser, type ProfileRow } from "./remoteProfiles";
import { supabase } from "./supabase";
import { flashRefusal } from "./flash";
import { fetchUsers } from "./usersCache";
import { agoLabel } from "./utils";

// Posts from the database: the feed, group walls, each person's own wall, single posts and hashtag searches.
// Newer columns (reactions, reposts, wall posts, polls, comment replies) are read with "*" so the feed keeps
// working even before their database step is applied.
type RemoteState = {
  posts: Post[]; groups: Record<string, Post[]>; walls: Record<string, Post[]>; comments: Record<string, PostComment[]>;
  liked: string[]; reacted: Record<string, string>; singles: Record<string, Post>;
};
type One<T> = T | T[] | null;
type CommentRow = { id: string; text: string; created_at: string; parent_id?: string | null; author: One<ProfileRow> };
type LikeRow = { user_id: string; reaction?: string | null };
type PostRow = {
  id: string; text: string; kind?: string | null; group_id?: string | null; image_url: string | null; video_url?: string | null; created_at: string; edited_at: string | null;
  repost_of?: string | null; wall_owner_id?: string | null; poll?: { question?: string; options?: string[] } | null;
  author: One<ProfileRow>; post_likes: LikeRow[]; comments: CommentRow[];
};
type Loaded = { posts: Post[]; comments: Record<string, PostComment[]>; liked: string[]; reacted: Record<string, string> };

export const REACTIONS = ["❤️", "😂", "😮", "😢", "😡"] as const;
const AUTHOR = "author:profiles!posts_author_id_fkey(id,name,handle,avatar_url)";
const SELECT = `*,${AUTHOR},post_likes(*),comments(*,author:profiles!comments_author_id_fkey(id,name,handle,avatar_url))`;
const empty: RemoteState = { posts: [], groups: {}, walls: {}, comments: {}, liked: [], reacted: {}, singles: {} };
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

// Turns database rows into posts, then fills in what needs extra queries: reposted originals, wall owners, poll votes.
async function build(rows: PostRow[], userId: string, depth = 0): Promise<Loaded> {
  const comments: Record<string, PostComment[]> = {};
  const liked: string[] = [];
  const reacted: Record<string, string> = {};
  const posts = rows.flatMap((row): Post[] => {
    const author = first(row.author);
    if (!author) return [];
    const likes = row.post_likes ?? [];
    const own = likes.find((like) => like.user_id === userId);
    if (own) { liked.push(row.id); reacted[row.id] = own.reaction || "❤️"; }
    const reactionCounts: Record<string, number> = {};
    likes.forEach((like) => { if (like !== own) reactionCounts[like.reaction || "❤️"] = (reactionCounts[like.reaction || "❤️"] ?? 0) + 1; });
    comments[row.id] = [...(row.comments ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)).flatMap((item): PostComment[] => {
      const writer = first(item.author);
      if (!writer) return [];
      const mine = writer.id === userId;
      return [{ id: item.id, userId: mine ? currentUser.id : writer.id, text: item.text, at: Date.parse(item.created_at), author: mine ? undefined : toUser(writer), parentId: item.parent_id ?? undefined }];
    });
    const options = Array.isArray(row.poll?.options) ? row.poll.options.filter((item): item is string => typeof item === "string") : [];
    const poll: Poll | undefined = options.length >= 2 ? { question: row.poll?.question ?? "", options, votes: options.map(() => 0) } : undefined;
    return [{
      id: row.id, author: toUser(author), time: agoLabel(Date.parse(row.created_at)), at: Date.parse(row.created_at), text: row.text ?? "", image: row.image_url ?? undefined, video: row.video_url ?? undefined, groupId: row.group_id ?? undefined,
      likes: likes.length - (own ? 1 : 0), reactionCounts, comments: 0, reactions: [], mine: author.id === userId, edited: Boolean(row.edited_at), kind: row.kind === "avatar" ? "avatar" : undefined,
      repostOf: row.repost_of ?? undefined, poll, wallOwner: row.wall_owner_id ? { id: row.wall_owner_id, name: "", handle: "", avatar: "" } : undefined,
    }];
  });
  if (!supabase) return { posts, comments, liked, reacted };
  // Originals of reposts (one level: the server always points a repost at the first post).
  const wanted = [...new Set(posts.flatMap((post) => (post.repostOf ? [post.repostOf] : [])))];
  const originals = new Map<string, Post>();
  if (wanted.length && depth === 0) {
    const { data } = await supabase.from("posts").select(SELECT).in("id", wanted);
    if (data) {
      const inner = await build(data as unknown as PostRow[], userId, 1);
      inner.posts.forEach((post) => originals.set(post.id, post));
      Object.assign(comments, inner.comments);
      liked.push(...inner.liked);
      Object.assign(reacted, inner.reacted);
    }
  }
  // Names and pictures of the walls the posts were written on.
  const owners = posts.flatMap((post) => (post.wallOwner ? [post.wallOwner.id] : []));
  const people = owners.length ? await fetchUsers(owners) : null;
  // Poll results.
  const polls = posts.filter((post) => post.poll).map((post) => post.id);
  const votes = new Map<string, { choice: number; user_id: string }[]>();
  if (polls.length) {
    const { data } = await supabase.from("poll_votes").select("post_id,user_id,choice").in("post_id", polls);
    ((data ?? []) as { post_id: string; user_id: string; choice: number }[]).forEach((row) => votes.set(row.post_id, [...(votes.get(row.post_id) ?? []), row]));
  }
  return {
    posts: posts.map((post) => {
      const owner = post.wallOwner && people?.get(post.wallOwner.id)?.user;
      const list = votes.get(post.id) ?? [];
      const poll = post.poll ? { ...post.poll, votes: post.poll.options.map((_, index) => list.filter((vote) => vote.choice === index).length), mine: list.find((vote) => vote.user_id === userId)?.choice } : undefined;
      return { ...post, poll, wallOwner: owner ?? (post.wallOwner?.id === userId ? { ...currentUser, id: userId } : undefined), repost: post.repostOf ? originals.get(post.repostOf) : undefined };
    }),
    comments, liked, reacted,
  };
}

type Query = ReturnType<NonNullable<typeof supabase>["from"]>;
async function run(make: (query: ReturnType<Query["select"]>) => PromiseLike<{ data: unknown; error: { message: string } | null }>, userId: string): Promise<Loaded | null> {
  if (!supabase) return null;
  const result = await make(supabase.from("posts").select(SELECT));
  if (result.error || !result.data) {
    console.error("Posts could not be loaded:", result.error?.message);
    return null;
  }
  return build(result.data as PostRow[], userId);
}

// Loads the wall feed (groupId null) or one group's posts.
async function load(groupId: string | null, userId: string): Promise<Loaded | null> {
  if (!supabase) return null;
  const recent = (query: ReturnType<Query["select"]>) => query.order("created_at", { ascending: false }).limit(60);
  let result = await run((query) => (groupId ? recent(query).eq("group_id", groupId) : recent(query).is("group_id", null)), userId);
  // Before the groups step is applied the column does not exist yet: fall back to all posts.
  if (!result && !groupId) result = await run(recent, userId);
  return result;
}

function merge(next: Partial<RemoteState>, loaded: Loaded[]) {
  const fresh = new Set(loaded.flatMap((item) => item.posts.flatMap((post) => (post.repost ? [post.id, post.repost.id] : [post.id]))));
  const reacted = Object.fromEntries(Object.entries(state.reacted).filter(([id]) => !fresh.has(id)));
  set({
    ...state, ...next,
    comments: Object.assign({}, state.comments, ...loaded.map((item) => item.comments)),
    liked: [...new Set([...state.liked.filter((id) => !fresh.has(id)), ...loaded.flatMap((item) => item.liked)])],
    reacted: Object.assign(reacted, ...loaded.map((item) => item.reacted)),
  });
}

export async function refreshPosts() {
  const userId = await sessionUserId();
  if (!supabase || !userId) return set(empty);
  const groupIds = Object.keys(state.groups);
  const wallIds = Object.keys(state.walls);
  const [feed, ...rest] = await Promise.all([load(null, userId), ...groupIds.map((id) => load(id, userId)), ...wallIds.map((id) => loadWallRows(id, userId))]);
  if (!feed) return;
  const groupResults = rest.slice(0, groupIds.length);
  const wallResults = rest.slice(groupIds.length);
  const loaded = [feed, ...rest.filter((item): item is Loaded => Boolean(item))];
  merge({
    posts: feed.posts,
    groups: Object.fromEntries(groupIds.map((id, index) => [id, groupResults[index]?.posts ?? state.groups[id]])),
    walls: Object.fromEntries(wallIds.map((id, index) => [id, wallResults[index]?.posts ?? state.walls[id]])),
  }, loaded);
}
export async function loadGroupPosts(groupId: string) {
  const userId = await sessionUserId();
  if (!userId) return;
  const result = await load(groupId, userId);
  if (result) merge({ groups: { ...state.groups, [groupId]: result.posts } }, [result]);
}

// One person's wall: what they wrote and what others wrote on their wall.
async function loadWallRows(ownerId: string, userId: string) {
  const recent = (query: ReturnType<Query["select"]>) => query.is("group_id", null).order("created_at", { ascending: false }).limit(60);
  return (await run((query) => recent(query).or(`author_id.eq.${ownerId},wall_owner_id.eq.${ownerId}`), userId)) ?? (await run((query) => recent(query).eq("author_id", ownerId), userId));
}
export async function loadWall(ownerId: string) {
  const userId = await sessionUserId();
  if (!userId || !isRemoteId(ownerId)) return;
  const result = await loadWallRows(ownerId, userId);
  if (result) merge({ walls: { ...state.walls, [ownerId]: result.posts } }, [result]);
}

// A single post (opened from a notification) and the posts with a hashtag. These are kept out of the shared lists.
export async function fetchPost(id: string): Promise<Post | null> {
  const userId = await sessionUserId();
  if (!userId || !isRemoteId(id)) return null;
  const result = await run((query) => query.eq("id", id), userId);
  if (!result?.posts[0]) return null;
  merge({ singles: { ...state.singles, [id]: result.posts[0] } }, [result]);
  return result.posts[0];
}
export async function searchTag(tag: string): Promise<Post[]> {
  const userId = await sessionUserId();
  const clean = tag.replace(/[^\p{L}\p{N}_]/gu, "");
  if (!userId || !clean) return [];
  const result = await run((query) => query.ilike("text", `%#${clean}%`).order("created_at", { ascending: false }).limit(60), userId);
  if (!result) return [];
  merge({ singles: { ...state.singles, ...Object.fromEntries(result.posts.map((post) => [post.id, post])) } }, [result]);
  const word = new RegExp(`#${clean}(?![\\p{L}\\p{N}_])`, "iu");
  return result.posts.filter((post) => word.test(post.text));
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
export type NewPost = { text: string; image?: string; groupId?: string; videoFile?: File; wallOwnerId?: string; poll?: { question: string; options: string[] }; repostOf?: string };
// Returns "" when the post was saved, otherwise why not (shown under the composer).
export async function createRemotePost(input: NewPost): Promise<string> {
  if (!supabase) return "offline";
  // A picture from the device is uploaded; a sticker or GIF (already on the web) is kept by its address.
  const image_url = isDataUrl(input.image) ? await uploadImage(input.image, "posts") : input.image && /^(https:\/\/|\/custom\/)/.test(input.image) ? input.image : null;
  // A video post: the file goes to storage (videos folder), the post keeps its address.
  let video_url: string | null = null;
  if (input.videoFile) {
    const extension = (input.videoFile.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
    video_url = await uploadBlob(input.videoFile, "videos", extension);
    if (!video_url) return `upload: ${lastUploadError || "?"}`;
  }
  const { error } = await supabase.from("posts").insert({
    text: input.text, image_url, ...(video_url ? { video_url } : {}), ...(input.groupId ? { group_id: input.groupId } : {}),
    ...(input.wallOwnerId ? { wall_owner_id: input.wallOwnerId } : {}), ...(input.poll ? { poll: input.poll } : {}), ...(input.repostOf ? { repost_of: input.repostOf } : {}),
  });
  if (error && !flashRefusal(error.message)) console.error("Post could not be saved:", error.message);
  await refreshPosts();
  return error ? `save: ${error.message}` : "";
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
const without = (list: Post[], id: string) => list.filter((post) => post.id !== id);
export async function deleteRemotePost(id: string) {
  if (!supabase) return;
  set({ ...state, posts: without(state.posts, id), groups: Object.fromEntries(Object.entries(state.groups).map(([key, list]) => [key, without(list, id)])), walls: Object.fromEntries(Object.entries(state.walls).map(([key, list]) => [key, without(list, id)])) });
  await supabase.from("posts").delete().eq("id", id);
}
// A reaction (❤️ 😂 😮 😢 😡) is a like with a face; the same face again takes it back.
export async function reactRemote(id: string, reaction: string | null) {
  const userId = await sessionUserId();
  if (!supabase || !userId) return;
  const had = state.reacted[id] ?? (state.liked.includes(id) ? "❤️" : undefined);
  const next = reaction && reaction !== had ? reaction : null;
  const reacted = { ...state.reacted };
  if (next) reacted[id] = next; else delete reacted[id];
  set({ ...state, reacted, liked: next ? [...new Set([...state.liked, id])] : state.liked.filter((item) => item !== id) });
  if (!next) { await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", userId); return; }
  if (had) {
    const { error } = await supabase.from("post_likes").update({ reaction: next }).eq("post_id", id).eq("user_id", userId);
    if (error) console.error("Reaction could not be saved:", error.message);
    return;
  }
  const { error } = await supabase.from("post_likes").insert(next === "❤️" ? { post_id: id } : { post_id: id, reaction: next });
  // Before the reactions step is applied only a plain like can be stored.
  if (error && next !== "❤️") await supabase.from("post_likes").insert({ post_id: id });
}
export async function toggleRemoteLike(id: string) {
  await reactRemote(id, state.liked.includes(id) ? state.reacted[id] ?? "❤️" : "❤️");
}
export async function votePoll(postId: string, choice: number | null) {
  const userId = await sessionUserId();
  if (!supabase || !userId) return;
  const patch = (list: Post[]): Post[] => list.map((item) => {
    const post = item.repost?.id === postId ? { ...item, repost: patch([item.repost])[0] } : item;
    if (post.id !== postId || !post.poll) return post;
    const votes = post.poll.votes.map((count, index) => count - (post.poll?.mine === index ? 1 : 0) + (choice === index ? 1 : 0));
    return { ...post, poll: { ...post.poll, votes, mine: choice ?? undefined } };
  });
  const singles = Object.fromEntries(Object.entries(state.singles).map(([key, post]) => [key, patch([post])[0]]));
  set({ ...state, singles, posts: patch(state.posts), groups: Object.fromEntries(Object.entries(state.groups).map(([key, list]) => [key, patch(list)])), walls: Object.fromEntries(Object.entries(state.walls).map(([key, list]) => [key, patch(list)])) });
  await supabase.from("poll_votes").delete().eq("post_id", postId).eq("user_id", userId);
  if (choice !== null) {
    const { error } = await supabase.from("poll_votes").insert({ post_id: postId, choice });
    if (error) console.error("Vote could not be saved:", error.message);
  }
}
export async function addRemoteComment(postId: string, text: string, parentId?: string) {
  if (!supabase) return;
  let { error } = await supabase.from("comments").insert({ post_id: postId, text, ...(parentId ? { parent_id: parentId } : {}) });
  // Before the replies step is applied: save it as a plain comment.
  if (error && parentId && error.message.includes("parent_id")) ({ error } = await supabase.from("comments").insert({ post_id: postId, text }));
  if (error && !flashRefusal(error.message)) console.error("Comment could not be saved:", error.message);
  await refreshPosts();
  const lists = [state.posts, ...Object.values(state.groups), ...Object.values(state.walls)];
  if (!lists.some((list) => list.some((post) => post.id === postId || post.repost?.id === postId))) void fetchPost(postId);
}
export async function removeRemoteComment(postId: string, id: string) {
  if (!supabase) return;
  set({ ...state, comments: { ...state.comments, [postId]: (state.comments[postId] ?? []).filter((item) => item.id !== id && item.parentId !== id) } });
  await supabase.from("comments").delete().eq("id", id);
}
