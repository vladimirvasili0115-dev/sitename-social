import { agoLabel, relativeTime } from "./utils";

type Key = "messages.offline" | "messages.lastSeen" | "post.minuteAgo" | "post.hourAgo" | "post.dayAgo" | "post.justNow";
// "Son görünmə: 5 dəqiqə əvvəl" for someone who is offline.
export function lastSeenText(lastSeen: number | undefined, t: (key: Key) => string): string {
  if (!lastSeen) return t("messages.offline");
  const label = agoLabel(lastSeen);
  return `${t("messages.lastSeen")}: ${label === "0m" ? t("post.justNow") : relativeTime(label, t)}`;
}
