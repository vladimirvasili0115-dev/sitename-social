export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function relativeTime(value: string, t: (key: "post.minuteAgo" | "post.hourAgo" | "post.dayAgo") => string) {
  const number = Number.parseInt(value, 10);
  if (value.endsWith("m")) return `${number} ${t("post.minuteAgo")}`;
  if (value.endsWith("h")) return `${number} ${t("post.hourAgo")}`;
  return `${number} ${t("post.dayAgo")}`;
}

export function agoLabel(at: number, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - at) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}
