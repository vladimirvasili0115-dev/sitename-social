"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { PostComment, Video } from "@/types";
import { reels as sampleReels, videos as sampleVideos } from "@/data/videos";
import { isRemoteId } from "@/lib/remoteProfiles";
import { likedVideosStore, savedVideosStore } from "@/lib/stores";
import { supabase } from "@/lib/supabase";
import { useToggleList } from "@/lib/useToggleList";
import { addVideoComment, deleteRemoteVideo, ensureVideosLoaded, remoteVideos, removeVideoComment, toggleVideoLike, toggleVideoSave, uploadRemoteVideo, type UploadError } from "@/lib/videosSync";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePosts } from "@/components/feed/usePosts";
import { useTranslation } from "@/i18n/useTranslation";

const online = Boolean(supabase);
// Uploads made without a backend only live until the page is reloaded.
let localVideos: Video[] = [];
let localReels: Video[] = [];
const localListeners = new Set<() => void>();

// Uploaded videos and Reels come from the database; sample items stay local.
export function useVideos() {
  const { t } = useTranslation();
  const remote = useSyncExternalStore(remoteVideos.subscribe, remoteVideos.get, remoteVideos.getServer);
  const [localLiked, toggleLocalLiked] = useToggleList(likedVideosStore);
  const [localSaved, toggleLocalSaved] = useToggleList(savedVideosStore);
  const posts = usePosts();
  const accountId = useAuth().user?.id;
  const [version, bump] = useState(0);
  useEffect(() => ensureVideosLoaded(accountId), [accountId]);
  useEffect(() => {
    const listener = () => bump((value) => value + 1);
    localListeners.add(listener);
    return () => { localListeners.delete(listener); };
  }, []);
  const you = t("common.you");

  return useMemo(() => {
    const mineVideos = online ? remote.videos.filter((video) => video.mine) : localVideos;
    const videos = online ? remote.videos : [...localVideos, ...sampleVideos];
    const reels = online ? remote.reels : [...localReels, ...sampleReels];
    const liked = [...remote.liked, ...localLiked];
    const saved = [...remote.saved, ...localSaved];
    return {
      videos, reels, mine: mineVideos, liked, saved,
      savedList: [...videos, ...reels].filter((video) => saved.includes(video.id)),
      commentsFor: (id: string): PostComment[] => (isRemoteId(id) ? remote.comments[id] ?? [] : posts.commentsFor(id)),
      toggleLike: (id: string) => (isRemoteId(id) ? toggleVideoLike(id) : toggleLocalLiked(id)),
      toggleSave: (id: string) => (isRemoteId(id) ? toggleVideoSave(id) : toggleLocalSaved(id)),
      addComment: (id: string, text: string) => (isRemoteId(id) ? void addVideoComment(id, text) : posts.addComment(id, text)),
      removeComment: (id: string, commentId: string) => (isRemoteId(id) ? void removeVideoComment(id, commentId) : posts.removeComment(id, commentId)),
      remove: (id: string) => {
        if (isRemoteId(id)) return void deleteRemoteVideo(id);
        localVideos = localVideos.filter((video) => video.id !== id);
        localReels = localReels.filter((video) => video.id !== id);
        localListeners.forEach((listener) => listener());
      },
      upload: async (files: File[], kind: "video" | "reel"): Promise<UploadError | null> => {
        if (online) {
          let failure: UploadError | null = null;
          for (const file of files) failure = (await uploadRemoteVideo(file, kind)) ?? failure;
          return failure;
        }
        const added = files.map((file, index): Video => ({ id: `my-${Date.now()}-${index}`, kind, title: file.name.replace(/\.[^.]+$/, ""), author: you, mine: true, duration: 0, views: 0, likes: 0, comments: 0, src: URL.createObjectURL(file) }));
        if (kind === "reel") localReels = [...added, ...localReels];
        else localVideos = [...added, ...localVideos];
        localListeners.forEach((listener) => listener());
        return null;
      },
    };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote, localLiked, localSaved, posts, you, toggleLocalLiked, toggleLocalSaved, version]);
}
