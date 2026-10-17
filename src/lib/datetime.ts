const pad = (value: number) => String(value).padStart(2, "0");

export function formatClock(at: number) {
  const date = new Date(at);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDay(at: number) {
  const date = new Date(at);
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function dayDiff(at: number, now = Date.now()) {
  const start = (value: number) => new Date(value).setHours(0, 0, 0, 0);
  return Math.round((start(now) - start(at)) / 86_400_000);
}
