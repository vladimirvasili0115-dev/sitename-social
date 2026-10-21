"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { Post, PostComment, PostsState, StoredPost } from "@/types";
import { posts } from "@/data/posts";
import { profilePosts } from "@/data/profile";
import { mockComments } from "@/data/comments";
import { mockGroupPosts } from "@/data/groupPosts";
import { currentUser } from "@/data/users";
import { postsStore } from "@/lib/stores";
import { addRemoteComment, createRemotePost, deleteRemotePost, editRemotePost, ensurePostsLoaded, isRemoteId, loadWall, reactRemote, remotePosts, removeRemoteComment, toggleRemoteLike, votePoll, type NewPost } from "@/lib/postsSync";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/useStore";
import { agoLabel } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/components/profile/useProfile";
import { useSettings } from "@/components/settings/useSettings";

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
const online = Boolean(supabase);

// Real posts come from the database. Sample posts and group posts are still local until those parts are migrated.
export function usePosts() {
  const [state, update] = useStore(postsStore);
  const remote = useSyncExternalStore(remotePosts.subscribe, remotePosts.get, remotePosts.getServer);
  const { user } = useProfile();
  const accountId = useAuth().user?.id;
  const { blocked } = useSettings().settings;
  useEffect(() => ensurePostsLoaded(accountId), [accountId]);

  return useMemo(() => {
    const toPost = (item: StoredPost): Post => ({ id: item.id, author: user, time: agoLabel(item.at), text: item.text, image: item.image, video: item.video, groupId: item.groupId, likes: 0, comments: 0, reactions: [], mine: true });
    const edits = state.edits ?? {};
    const visible = (list: Post[]) => list.filter((post) => !state.removed.includes(post.id) && !blocked.includes(post.author.id)).map((post) => (edits[post.id] === undefined ? post : { ...post, text: edits[post.id], edited: true }));
    const asMine = (post: Post) => (post.mine ? { ...post, author: user } : post);
    const real = remote.posts.map(asMine);
    const created = state.created.map(toPost);
    const wall = online ? [] : created.filter((post) => !post.groupId);
    const own = online ? [] : profilePosts.map((post): Post => ({ ...post, author: user, mine: true }));
    const samples = online ? [] : posts;
    const patch = (change: (current: PostsState) => PostsState) => update(change);
    return {
      feed: visible([...real, ...wall, ...samples]),
      // Your wall: your posts and what friends wrote on it (loaded separately once the wall is opened).
      mine: visible([...(accountId && remote.walls[accountId] ? remote.walls[accountId].map(asMine) : real.filter((post) => post.mine && !post.wallOwner)), ...wall, ...own]),
      loadWall: (id: string) => void loadWall(id),
      all: visible([...real, ...created, ...samples, ...own]),
      byAuthor: (id: string) => visible(remote.walls[id] ? remote.walls[id].map(asMine) : [...real, ...samples].filter((post) => post.author.id === id && !post.wallOwner)),
      inGroup: (groupId: string) => (isRemoteId(groupId)
        ? visible((remote.groups[groupId] ?? []).map(asMine))
        : visible([...created.filter((post) => post.groupId === groupId), ...mockGroupPosts(groupId)])),
      isLiked: (id: string) => (isRemoteId(id) ? remote.liked.includes(id) : state.liked.includes(id)),
      reactionOf: (id: string) => (isRemoteId(id) ? remote.reacted[id] ?? (remote.liked.includes(id) ? "❤️" : undefined) : state.liked.includes(id) ? "❤️" : undefined),
      react: (id: string, reaction: string) => (isRemoteId(id) ? void reactRemote(id, reaction) : patch((current) => ({ ...current, liked: toggle(current.liked, id) }))),
      vote: (id: string, choice: number | null) => void votePoll(id, choice),
      commentsFor: (id: string): PostComment[] => (isRemoteId(id) ? remote.comments[id] ?? [] : [...(mockComments[id] ?? []), ...(state.comments[id] ?? [])]),
      toggleLike: (id: string) => (isRemoteId(id) ? void toggleRemoteLike(id) : patch((current) => ({ ...current, liked: toggle(current.liked, id) }))),
      create: (input: NewPost) => (online && (!input.groupId || isRemoteId(input.groupId))
        ? createRemotePost(input)
        : Promise.resolve(patch((current) => ({ ...current, created: [{ text: input.text, image: input.image, groupId: input.groupId, video: input.videoFile ? URL.createObjectURL(input.videoFile) : undefined, id: `p-${Date.now()}`, at: Date.now() }, ...current.created] })))),
      edit: (id: string, text: string) => (isRemoteId(id) ? void editRemotePost(id, text) : patch((current) => ({ ...current, edits: { ...(current.edits ?? {}), [id]: text } }))),
      remove: (id: string, mine = false) => {
        if (isRemoteId(id) && mine) return void deleteRemotePost(id);
        patch((current) => ({ ...current, created: current.created.filter((post) => post.id !== id), removed: [...current.removed, id] }));
      },
      addComment: (postId: string, text: string, parentId?: string) => (isRemoteId(postId)
        ? void addRemoteComment(postId, text, parentId)
        : patch((current) => ({ ...current, comments: { ...current.comments, [postId]: [...(current.comments[postId] ?? []), { id: `c-${Date.now()}`, userId: currentUser.id, text, at: Date.now() }] } }))),
      removeComment: (postId: string, id: string) => (isRemoteId(postId)
        ? void removeRemoteComment(postId, id)
        : patch((current) => ({ ...current, comments: { ...current.comments, [postId]: (current.comments[postId] ?? []).filter((item) => item.id !== id) } }))),
    };
  }, [state, remote, user, blocked, update, accountId]);
}
