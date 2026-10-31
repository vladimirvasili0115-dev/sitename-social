// A random id for this browser, kept in localStorage (with a cookie as a backup). Used only to limit how many accounts one device can open in a day.
const KEY = "rv-device";

function readCookie(): string | null {
  try {
    const hit = document.cookie.split("; ").find((part) => part.startsWith(`${KEY}=`));
    return hit ? decodeURIComponent(hit.slice(KEY.length + 1)) : null;
  } catch { return null; }
}

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`.slice(0, 40).padEnd(16, "0");
  }
}

const valid = (value: string | null): value is string => !!value && /^[A-Za-z0-9-]{16,64}$/.test(value);

export function getDeviceId(): string {
  let id: string | null = null;
  try { id = window.localStorage.getItem(KEY); } catch { /* storage blocked */ }
  if (!valid(id)) id = readCookie();
  if (!valid(id)) id = makeId();
  try { window.localStorage.setItem(KEY, id); } catch { /* storage blocked */ }
  try { document.cookie = `${KEY}=${encodeURIComponent(id)}; max-age=31536000; path=/; SameSite=Lax`; } catch { /* cookies blocked */ }
  return id;
}
