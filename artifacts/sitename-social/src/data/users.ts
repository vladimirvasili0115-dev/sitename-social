import type { User } from "@/types";

export const currentUser: User = { id: "u0", name: "Aylin Mammadova", handle: "aylin.m", avatar: "https://picsum.photos/seed/aylin-avatar/120/120", online: true };
export const users: User[] = [
  currentUser,
  { id: "u1", name: "Leyla Hasanli", handle: "leyla.h", avatar: "https://picsum.photos/seed/leyla-avatar/120/120", online: true },
  { id: "u2", name: "Rashad Aliyev", handle: "rashad.a", avatar: "https://picsum.photos/seed/rashad-avatar/120/120", online: true },
  { id: "u3", name: "Nigar Karimova", handle: "nigar.k", avatar: "https://picsum.photos/seed/nigar-avatar/120/120" },
  { id: "u4", name: "Samir Huseynov", handle: "samir.h", avatar: "https://picsum.photos/seed/samir-avatar/120/120" },
  { id: "u5", name: "Mina Jafarli", handle: "mina.j", avatar: "https://picsum.photos/seed/mina-avatar/120/120" },
  { id: "u6", name: "Kamran Safarov", handle: "kamran.s", avatar: "https://picsum.photos/seed/kamran-avatar/120/120", online: true },
];
