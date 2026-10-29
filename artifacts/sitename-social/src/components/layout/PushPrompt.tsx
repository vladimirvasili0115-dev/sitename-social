"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

// Phone notifications (Web Push): asks, registers this device on the server and, when something is wrong, says exactly what on the screen.
const PUBLIC_KEY = "BFoao0hWo8WvZ-BbCoF2OwtWLYyTOb-suFH8KpOoTLUdmrzBA7js7mDvS8dEIWfb9A9qoKTtb2wdP2e3ZfRfqC8";

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

// Returns null when the device is registered, otherwise the reason (shown to the player).
async function register(): Promise<string | null> {
  if (!supabase) return "Server qoşulmayıb";
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 8000)),
    ]);
    if (!reg) return "Service worker hazır deyil (8 san gözlədim)";
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) as unknown as BufferSource });
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "Cihaz açarları alınmadı";
    const { error } = await supabase.rpc("push_subscribe", { p_endpoint: json.endpoint, p_p256dh: json.keys.p256dh, p_auth: json.keys.auth });
    return error ? "Server qəbul etmədi: " + error.message : null;
  } catch (error) {
    return "Abunəlik alınmadı: " + (error instanceof Error ? error.name + " — " + error.message : String(error));
  }
}

function missing() {
  const lost: string[] = [];
  if (!("serviceWorker" in navigator)) lost.push("serviceWorker");
  if (!("PushManager" in window)) lost.push("PushManager");
  if (!("Notification" in window)) lost.push("Notification");
  return lost;
}

export function PushPrompt() {
  const { user } = useAuth();
  const accountId = user?.id;
  // "ok" = registered; "ask" = permission not asked yet; otherwise the text of the problem.
  const [state, setState] = useState<"checking" | "ok" | "ask" | { problem: string }>("checking");
  const [hidden, setHidden] = useState(false);

  const check = useCallback(async () => {
    const lost = missing();
    if (lost.length) { setState({ problem: "Bu tətbiq/brauzer push bildirişini dəstəkləmir (yoxdur: " + lost.join(", ") + ")" }); return; }
    if (Notification.permission === "denied") { setState({ problem: "Bildiriş icazəsi rədd edilib. Telefon ayarlarından Ravetill (və ya Chrome) üçün bildirişləri aç." }); return; }
    if (Notification.permission === "default") { setState("ask"); return; }
    const reason = await register();
    setState(reason ? { problem: reason } : "ok");
  }, []);

  useEffect(() => {
    if (!accountId) return;
    const timer = window.setTimeout(() => { void check(); }, 3000);
    return () => window.clearTimeout(timer);
  }, [accountId, check]);

  const allow = useCallback(async () => {
    try {
      const answer = await Notification.requestPermission();
      if (answer === "granted") {
        const reason = await register();
        setState(reason ? { problem: reason } : "ok");
      } else {
        setState({ problem: "İcazə verilmədi (" + answer + "). Telefon ayarlarından bildirişləri aç." });
      }
    } catch (error) {
      setState({ problem: "İcazə sorğusu alınmadı: " + (error instanceof Error ? error.message : String(error)) });
    }
  }, []);

  if (!accountId || hidden || state === "checking" || state === "ok") return null;
  const problem = typeof state === "object" ? state.problem : null;
  return (
    <div role="dialog" aria-label="Bildirişlər" className="fixed inset-x-3 bottom-[88px] z-[60] mx-auto flex max-w-[420px] items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-lg lg:bottom-6">
      <span aria-hidden="true" className="text-2xl">🔔</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5">{problem ? "Bildirişlər telefona gəlmir" : "Yeni mesajlar və bildirişlər telefona gəlsin?"}</p>
        {problem ? <p className="mt-1 break-words text-xs leading-4 text-muted">{problem}</p> : null}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={() => setHidden(true)} className="h-9 rounded-xl px-2.5 text-xs font-semibold text-muted hover:bg-surface-2">Bağla</button>
          <button type="button" onClick={() => void (state === "ask" ? allow() : check())} className="h-9 rounded-xl bg-accent px-3.5 text-xs font-semibold text-white hover:brightness-110">{state === "ask" ? "Aç" : "Yenidən yoxla"}</button>
        </div>
      </div>
    </div>
  );
}
