"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { AlbumId, Photo } from "@/types";
import { albumIds, mockPhotos } from "@/data/photos";
import { ensurePhotosLoaded, remotePhotos, removePhotoRow, uploadPhotos } from "@/lib/photosSync";
import { remotePosts } from "@/lib/postsSync";
import { resizeImage } from "@/lib/profile";
import { createStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/useStore";
import { useAuth } from "@/components/auth/AuthProvider";

const store = createStore<Photo[]>("sitename-photos", []);
const online = Boolean(supabase);
const onlineAlbums: AlbumId[] = ["profile", "wall", "uploads"];

// With a database the photos are the account's own: profile pictures, uploads and images from wall posts.
export function usePhotos() {
  const [uploads, update] = useStore(store);
  const remote = useSyncExternalStore(remotePhotos.subscribe, remotePhotos.get, remotePhotos.getServer);
  const posts = useSyncExternalStore(remotePosts.subscribe, remotePosts.get, remotePosts.getServer);
  const accountId = useAuth().user?.id;
  useEffect(() => ensurePhotosLoaded(accountId), [accountId]);

  return useMemo(() => {
    const resize = async (files: File[]) => (await Promise.allSettled(files.map((file) => resizeImage(file, 1000)))).flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    if (online) {
      const wall = posts.posts.filter((post) => post.mine && post.image && post.kind !== "avatar").map((post): Photo => ({ id: `wall-${post.id}`, src: post.image ?? "", album: "wall" }));
      return {
        albums: onlineAlbums,
        photos: [...remote, ...wall],
        upload: async (files: File[]) => uploadPhotos(await resize(files)),
        remove: (id: string) => void removePhotoRow(id),
      };
    }
    return {
      albums: albumIds,
      photos: [...uploads, ...mockPhotos],
      upload: async (files: File[]) => {
        const added = (await resize(files)).map((src, index): Photo => ({ id: `up-${Date.now()}-${index}`, src, album: "uploads", own: true }));
        if (added.length) update((list) => [...added, ...list]);
        return added.length;
      },
      remove: (id: string) => update((list) => list.filter((item) => item.id !== id)),
    };
  }, [uploads, remote, posts, update]);
}
