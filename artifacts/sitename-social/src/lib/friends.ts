import type { FriendsState } from "@/types";
import { initialFriendsState } from "@/data/friends";

const STORAGE_KEY = "sitename-friends";
export const FRIENDS_EVENT = "sitename-friends-change";

// Mock storage: replace with API calls when the backend exists.
export function readFriendsState(): FriendsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialFriendsState, ...(JSON.parse(raw) as Partial<FriendsState>) } : initialFriendsState;
  } catch {
    return initialFriendsState;
  }
}

export function writeFriendsState(state: FriendsState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the change still applies for this visit.
  }
  window.dispatchEvent(new CustomEvent<FriendsState>(FRIENDS_EVENT, { detail: state }));
}
