"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { Post, PostComment, PostsState, StoredPost } from "@/types";
import { posts } from "@/data/posts";
import { profilePosts } from "@/data/profile";
import { mockComments } from "@/data/comments";
import { mockGroupPosts } from "@/data/groupPosts";
import { currentUser } from "@/data/users";
import { postsStore } from "@/lib/stores";
import { addRemoteComment, createRemotePost, deleteRemotePost, editRemotePost, ensurePostsLoaded, isRemoteId, remotePosts, removeRemoteComment, toggleRemoteLike } from "@/lib/postsSync";
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
      mine: visible([...real.filter((post) => post.mine), ...wall, ...own]),
      all: visible([...real, ...created, ...samples, ...own]),
      byAuthor: (id: string) => visible([...real, ...samples].filter((post) => post.author.id === id)),
      inGroup: (groupId: string) => (isRemoteId(groupId)
        ? visible((remote.groups[groupId] ?? []).map(asMine))
        : visible([...created.filter((post) => post.groupId === groupId), ...mockGroupPosts(groupId)])),
      isLiked: (id: string) => (isRemoteId(id) ? remote.liked.includes(id) : state.liked.includes(id)),
      commentsFor: (id: string): PostComment[] => (isRemoteId(id) ? remote.comments[id] ?? [] : [...(mockComments[id] ?? []), ...(state.comments[id] ?? [])]),
      toggleLike: (id: string) => (isRemoteId(id) ? void toggleRemoteLike(id) : patch((current) => ({ ...current, liked: toggle(current.liked, id) }))),
      create: (input: Pick<StoredPost, "text" | "image" | "groupId"> & { videoFile?: File }) => (online && (!input.groupId || isRemoteId(input.groupId))
        ? createRemotePost(input)
        : Promise.resolve(patch((current) => ({ ...current, created: [{ text: input.text, image: input.image, groupId: input.groupId, video: input.videoFile ? URL.createObjectURL(input.videoFile) : undefined, id: `p-${Date.now()}`, at: Date.now() }, ...current.created] })))),
      edit: (id: string, text: string) => (isRemoteId(id) ? void editRemotePost(id, text) : patch((current) => ({ ...current, edits: { ...(current.edits ?? {}), [id]: text } }))),
      remove: (id: string, mine = false) => {
        if (isRemoteId(id) && mine) return void deleteRemotePost(id);
        patch((current) => ({ ...current, created: current.created.filter((post) => post.id !== id), removed: [...current.removed, id] }));
      },
      addComment: (postId: string, text: string) => (isRemoteId(postId)
        ? void addRemoteComment(postId, text)
        : patch((current) => ({ ...current, comments: { ...current.comments, [postId]: [...(current.comments[postId] ?? []), { id: `c-${Date.now()}`, userId: currentUser.id, text, at: Date.now() }] } }))),
      removeComment: (postId: string, id: string) => (isRemoteId(postId)
        ? void removeRemoteComment(postId, id)
        : patch((current) => ({ ...current, comments: { ...current.comments, [postId]: (current.comments[postId] ?? []).filter((item) => item.id !== id) } }))),
    };
  }, [state, remote, user, blocked, update]);
}
