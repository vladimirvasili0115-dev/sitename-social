import type { PostComment } from "@/types";

const now = Date.now();
const comment = (id: string, userId: string, text: string, minutesAgo: number): PostComment => ({ id, userId, text, at: now - minutesAgo * 60_000 });

export const mockComments: Record<string, PostComment[]> = {
  "post-1": [comment("c1", "u2", "Çox gözəl kadrdır 😍", 1), comment("c2", "u7", "Bakı yağışdan sonra başqa olur.", 1)],
  "post-2": [comment("c3", "u1", "Nuş olsun! Bizi də çağırın 😄", 40)],
  "post-3": [comment("c4", "u9", "Haradır bura?", 900), comment("c5", "u12", "Mən də getmək istəyirəm!", 700)],
  "my-post-1": [comment("c6", "u1", "Növbəti dəfə birlikdə gedək!", 120), comment("c7", "u3", "Əla görünür 👏", 90)],
};
