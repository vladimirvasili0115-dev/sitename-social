"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { AlbumId, Photo } from "@/types";
import { albumIds, mockPhotos } from "@/data/photos";
import { createAlbum as createRemoteAlbum, deleteAlbum as deleteRemoteAlbum, ensurePhotosLoaded, movePhoto, remoteAlbums, remotePhotos, removePhotoRow, renameAlbum as renameRemoteAlbum, uploadPhotos } from "@/lib/photosSync";
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
  const ownAlbums = useSyncExternalStore(remoteAlbums.subscribe, remoteAlbums.get, remoteAlbums.getServer);
  const accountId = useAuth().user?.id;
  useEffect(() => ensurePhotosLoaded(accountId), [accountId]);

  return useMemo(() => {
    const resize = async (files: File[]) => (await Promise.allSettled(files.map((file) => resizeImage(file, 1000)))).flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    if (online) {
      const wall = posts.posts.filter((post) => post.mine && post.image && post.kind !== "avatar").map((post): Photo => ({ id: `wall-${post.id}`, src: post.image ?? "", album: "wall" }));
      return {
        albums: onlineAlbums,
        photos: [...remote, ...wall],
        upload: async (files: File[], albumId?: string) => uploadPhotos(await resize(files), albumId),
        remove: (id: string) => void removePhotoRow(id),
        custom: ownAlbums,
        canAlbums: true,
        createAlbum: (title: string) => createRemoteAlbum(title),
        renameAlbum: (id: string, title: string): void => void renameRemoteAlbum(id, title),
        deleteAlbum: (id: string): void => void deleteRemoteAlbum(id),
        move: (photoId: string, albumId: string | null): void => void movePhoto(photoId, albumId),
      };
    }
    return {
      albums: albumIds,
      photos: [...uploads, ...mockPhotos],
      custom: [] as typeof ownAlbums,
      canAlbums: false,
      createAlbum: async (title: string): Promise<string | null> => (title ? null : null),
      renameAlbum: (id: string, title: string): void => void [id, title],
      deleteAlbum: (id: string): void => void id,
      move: (photoId: string, albumId: string | null): void => void [photoId, albumId],
      upload: async (files: File[], albumId?: string) => {
        void albumId;
        const added = (await resize(files)).map((src, index): Photo => ({ id: `up-${Date.now()}-${index}`, src, album: "uploads", own: true }));
        if (added.length) update((list) => [...added, ...list]);
        return added.length;
      },
      remove: (id: string) => update((list) => list.filter((item) => item.id !== id)),
    };
  }, [uploads, remote, posts, update, ownAlbums]);
}
