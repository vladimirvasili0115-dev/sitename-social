import type { Story } from "@/types";
import { users } from "./users";

const now = Date.now();
export const stories: Story[] = users.slice(1).map((user, index) => ({
  id: `story-${user.id}`,
  user,
  seen: index === 3,
  slides: Array.from({ length: index % 2 ? 2 : 1 }, (_, slide) => ({ id: `${user.id}-s${slide}`, image: `https://picsum.photos/seed/story-${user.id}-${slide}/540/960`, at: now - (index + 1) * 50 * 60_000 })),
}));
