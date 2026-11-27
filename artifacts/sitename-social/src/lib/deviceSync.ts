import { supabase } from "./supabase";

// Device block: the server is told which device this is (the Ravetill app's Android ID, and a random mark kept in this browser).
// A device that a moderator blocked bans every account that signs in on it (see paket-MD.sql).

type Native = { deviceId?: () => string; deviceModel?: () => string };
const KEY = "rv-dev";

function randomId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function readCookie() {
  const hit = document.cookie.split("; ").find((part) => part.startsWith(`${KEY}=`));
  return hit ? decodeURIComponent(hit.slice(KEY.length + 1)) : "";
}
// The browser mark: kept in local storage and in a cookie, so clearing one of them alone does not lose it.
function browserMark() {
  let mark = "";
  try { mark = window.localStorage.getItem(KEY) ?? ""; } catch { /* storage blocked */ }
  if (!/^[0-9a-f]{32}$/.test(mark)) mark = readCookie();
  if (!/^[0-9a-f]{32}$/.test(mark)) mark = randomId();
  try { window.localStorage.setItem(KEY, mark); } catch { /* storage blocked */ }
  document.cookie = `${KEY}=${mark}; max-age=315360000; path=/; SameSite=Lax; Secure`;
  return mark;
}

async function deviceInfo(native: Native | undefined) {
  const info: Record<string, string | number> = {
    screen: `${window.screen.width}x${window.screen.height}@${Math.round((window.devicePixelRatio || 1) * 100) / 100}`,
    lang: navigator.language || "",
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    platform: navigator.platform || "",
  };
  try { const model = native?.deviceModel?.(); if (model) info.model = String(model).slice(0, 80); } catch { /* old app */ }
  const agentData = (navigator as Navigator & { userAgentData?: { getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string; platform?: string; platformVersion?: string }> } }).userAgentData;
  if (!info.model && agentData?.getHighEntropyValues) {
    try {
      const values = await agentData.getHighEntropyValues(["model", "platformVersion"]);
      if (values.model) info.model = values.model.slice(0, 80);
      if (values.platform) info.platform = `${values.platform} ${values.platformVersion ?? ""}`.trim().slice(0, 40);
    } catch { /* not allowed */ }
  }
  if (!info.model) {
    const ua = navigator.userAgent;
    info.model = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : (/Android[^;]*;\s*([^;)]+)/.exec(ua)?.[1] ?? "").trim().slice(0, 80);
  }
  return info;
}

let checkedFor = "";
// Once per account per page load. Returns true when the server says this device is blocked (the account is then banned).
export async function checkDevice(userId: string) {
  if (!supabase || typeof window === "undefined" || checkedFor === userId) return false;
  checkedFor = userId;
  const native = (window as Window & { RavetillNative?: Native }).RavetillNative;
  const devices: { id: string; kind: "app" | "web" }[] = [{ id: browserMark(), kind: "web" }];
  try { const id = native?.deviceId?.(); if (id && id.length >= 8) devices.unshift({ id: String(id), kind: "app" }); } catch { /* old app */ }
  const { data, error } = await supabase.rpc("device_check", { p_devices: devices, p_info: await deviceInfo(native) });
  if (error) { checkedFor = ""; return false; }
  return Boolean((data as { banned?: boolean } | null)?.banned);
}

export type DeviceRow = {
  device: string; kind: "app" | "web"; ip: string | null; first_at: string; last_at: string; banned: boolean;
  info: { model?: string; screen?: string; lang?: string; tz?: string; platform?: string };
  others: { id: string; name: string | null; handle: string | null; banned: boolean }[];
};
export async function adminDevices(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("admin_device_lookup", { p_user: userId });
  return error ? null : ((data ?? []) as DeviceRow[]);
}
export async function adminDeviceBan(userId: string, on: boolean, reason = "") {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("admin_device_ban", { p_user: userId, p_on: on, p_reason: reason });
  return error ? null : Number(data);
}
