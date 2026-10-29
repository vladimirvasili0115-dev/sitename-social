"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

// Phone notifications (Web Push): asks once, then keeps the device registered on the server so new messages and other alerts reach the phone.
const PUBLIC_KEY = "BFoao0hWo8WvZ-BbCoF2OwtWLYyTOb-suFH8KpOoTLUdmrzBA7js7mDvS8dEIWfb9A9qoKTtb2wdP2e3ZfRfqC8";
const ASKED_KEY = "rv-push-asked";
const ASK_AGAIN_MS = 7 * 24 * 3600 * 1000;

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function register(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) as unknown as BufferSource }));
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;
    const { error } = await supabase.rpc("push_subscribe", { p_endpoint: json.endpoint, p_p256dh: json.keys.p256dh, p_auth: json.keys.auth });
    return !error;
  } catch { return false; }
}

export function PushPrompt() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const accountId = user?.id;
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  useEffect(() => {
    if (!accountId || !supported) return;
    if (Notification.permission === "granted") { void register(); return; }
    if (Notification.permission !== "default") return;
    let last = 0;
    try { last = Number(window.localStorage.getItem(ASKED_KEY) ?? 0); } catch { /* storage is blocked */ }
    if (Date.now() - last < ASK_AGAIN_MS) return;
    const timer = window.setTimeout(() => setShow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [accountId, supported]);

  const later = useCallback(() => {
    setShow(false);
    try { window.localStorage.setItem(ASKED_KEY, String(Date.now())); } catch { /* storage is blocked */ }
  }, []);
  const allow = useCallback(async () => {
    setShow(false);
    try { window.localStorage.setItem(ASKED_KEY, String(Date.now())); } catch { /* storage is blocked */ }
    const answer = await Notification.requestPermission();
    if (answer === "granted") await register();
  }, []);

  if (!show) return null;
  return (
    <div role="dialog" aria-label="Bildirişlər" className="fixed inset-x-3 bottom-[88px] z-[60] mx-auto flex max-w-[420px] items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-lg lg:bottom-6">
      <span aria-hidden="true" className="text-2xl">🔔</span>
      <p className="min-w-0 flex-1 text-sm font-semibold leading-5">Yeni mesajlar və bildirişlər telefona gəlsin?</p>
      <button type="button" onClick={later} className="h-9 rounded-xl px-2.5 text-xs font-semibold text-muted hover:bg-surface-2">Sonra</button>
      <button type="button" onClick={() => void allow()} className="h-9 rounded-xl bg-accent px-3.5 text-xs font-semibold text-white hover:brightness-110">Aç</button>
    </div>
  );
}
