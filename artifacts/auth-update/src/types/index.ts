import type { LucideIcon } from "lucide-react";

export type Locale = "az" | "tr" | "ru" | "en" | "ka";
export type User = { id: string; name: string; handle: string; avatar: string; online?: boolean };
export type Post = { id: string; author: User; time: string; text: string; image?: string; likes: number; comments: number; reactions: string[] };
export type Story = { id: string; user: User; seen?: boolean };
export type NavItem = { key: string; href: string; icon: LucideIcon; disabled?: boolean };
export type AuthUser = { name: string; email: string };
