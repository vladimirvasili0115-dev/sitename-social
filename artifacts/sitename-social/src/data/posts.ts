import type { Post } from "@/types";
import { users } from "./users";

export const posts: Post[] = [
  { id: "post-1", author: users[1], time: "2m", text: "A little pause between everything. Baku looks softer after the rain.", image: "https://picsum.photos/seed/caspian-evening/1000/640", likes: 38, comments: 6, reactions: ["❤️", "👍", "✨"] },
  { id: "post-2", author: users[2], time: "1h", text: "Sunday table, slow morning, and the people who make it feel like home.", image: "https://picsum.photos/seed/sunday-table/1000/680", likes: 24, comments: 3, reactions: ["❤️", "☕"] },
  { id: "post-3", author: users[3], time: "1d", text: "Found a quiet corner of the city I want to keep coming back to.", image: "https://picsum.photos/seed/quiet-city/1000/680", likes: 57, comments: 12, reactions: ["❤️", "🌿", "👏"] },
];
