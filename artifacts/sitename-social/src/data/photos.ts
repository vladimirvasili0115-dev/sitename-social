import type { AlbumId, Photo } from "@/types";
import { profilePhotos } from "./profile";

const seeded = (album: AlbumId, count: number): Photo[] =>
  Array.from({ length: count }, (_, index) => ({ id: `${album}-${index + 1}`, album, src: `https://picsum.photos/seed/album-${album}-${index + 1}/900/900` }));

export const albumIds: AlbumId[] = ["profile", "travel", "friends", "uploads"];
export const mockPhotos: Photo[] = [
  ...profilePhotos.map((src, index): Photo => ({ id: `profile-${index + 1}`, album: "profile", src })),
  ...seeded("travel", 8),
  ...seeded("friends", 5),
];
