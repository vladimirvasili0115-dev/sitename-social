import type { Post } from "@/types";
import { people } from "./friends";

const texts = ["Qrupa xoş gəlmisiniz! Yeni üzvlər özünü təqdim edə bilər 👋", "Bu həftəsonu üçün planınız nədir? Fikirlərinizi yazın."];

export function mockGroupPosts(groupId: string): Post[] {
  const seed = groupId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return texts.map((text, index) => ({
    id: `${groupId}-post-${index + 1}`, groupId, text, author: people[(seed + index * 5) % people.length].user, time: index ? "2d" : "5h",
    image: index ? undefined : `https://picsum.photos/seed/${groupId}-wall/1000/600`, likes: 12 + ((seed + index * 7) % 40), comments: 0, reactions: ["👍", "❤️"],
  }));
}
