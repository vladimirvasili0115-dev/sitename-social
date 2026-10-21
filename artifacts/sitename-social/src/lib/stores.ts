import type { GuestsState, InvisibleState, Notice, PostsState, SettingsState, StoriesState } from "@/types";
import { initialGuests } from "@/data/guests";
import { initialNotices } from "@/data/notifications";
import { createStore } from "./store";

// Shared stores used by more than one page.
export const likedVideosStore = createStore<string[]>("sitename-videos-liked", []);
export const savedVideosStore = createStore<string[]>("sitename-videos-saved", []);
export const savedPostsStore = createStore<string[]>("sitename-posts-saved", []);
export const invisibleStore = createStore<InvisibleState>("sitename-invisible", { enabled: false, hideOnline: true, hideVisits: true, hideRead: false });
export const settingsStore = createStore<SettingsState>("sitename-settings", {
  theme: "dark",
  privacy: { profile: "everyone", messages: "everyone", requests: "everyone", friendsList: "friends", gifts: "everyone", wall: "friends", comments: "everyone" },
  notifications: { messages: true, requests: true, likes: true, gifts: true, guests: true, groups: false, sound: true, email: false },
  autoplay: true,
  reelsMuted: true,
  twoFactor: false,
  endedSessions: [],
  blocked: [],
});
export const noticesStore = createStore<Notice[]>("sitename-notices", initialNotices);
export const postsStore = createStore<PostsState>("sitename-posts", { created: [], removed: [], liked: [], comments: {} });
export const storiesStore = createStore<StoriesState>("sitename-stories", { mine: [], seen: [] });
export const guestsStore = createStore<GuestsState>("sitename-guests", initialGuests);
