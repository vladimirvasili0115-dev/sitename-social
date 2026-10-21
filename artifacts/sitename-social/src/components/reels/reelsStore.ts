"use client";
import { useSyncExternalStore } from "react";

// Which video the TikTok-style viewer is showing (null = closed). Any video in the feed can open it.
let openId: string | null = null;
const listeners = new Set<() => void>();
export const reels = {
  open(id: string) { openId = id; listeners.forEach((listener) => listener()); },
  close() { openId = null; listeners.forEach((listener) => listener()); },
};
export const useReelsOpen = () => useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => openId, () => null);

// Only one video plays at a time on the whole site: starting one pauses every other.
export function playOnly(video: HTMLVideoElement) {
  document.querySelectorAll("video").forEach((other) => { if (other !== video && !other.paused) other.pause(); });
}
