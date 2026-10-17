import type { Post, ProfileDetails } from "@/types";
import { currentUser } from "./users";

export const profileDetails: ProfileDetails = {
  cover: "https://picsum.photos/seed/profile-cover/1400/420",
  status: "Çay, dəniz və yaxşı söhbət ☕",
  bio: "Bakıda yaşayıram. Fotoqrafiya, səyahət və uzun gəzintiləri sevirəm.",
  city: "Bakı, Azərbaycan",
  birthday: "1996-05-14",
  relationship: "single",
  work: "UX dizayner",
  education: "Bakı Dövlət Universiteti",
  languages: ["Azərbaycan", "Türkçe", "Русский", "English"],
  interests: ["Fotoqrafiya", "Səyahət", "Musiqi", "Kino", "Qəhvə"],
  joined: "2024-03-01",
  followers: 248,
};

export const profilePhotos: string[] = Array.from({ length: 12 }, (_, index) => `https://picsum.photos/seed/profile-photo-${index + 1}/600/600`);

export const profilePosts: Post[] = [
  { id: "my-post-1", author: currentUser, time: "3h", text: "Sahildə axşam gəzintisi. Bu şəhəri hər dəfə yenidən sevirəm.", image: "https://picsum.photos/seed/boulevard-walk/1000/640", likes: 42, comments: 7, reactions: ["❤️", "👍"] },
  { id: "my-post-2", author: currentUser, time: "2d", text: "Yeni həftə, yeni planlar. Hamıya uğurlar!", likes: 18, comments: 2, reactions: ["👍", "✨"] },
];
