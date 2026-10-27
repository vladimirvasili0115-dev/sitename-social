"use client";
import { useEffect } from "react";

// Registers the (cache-free) service worker so the browser offers "Install app" and the site can be packed as an APK.
// Inside the installed Android app only: the first touch asks the browser for real fullscreen (hides status bar / nav bar).
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* not available (private mode, old browser) */ });
    let app = false;
    try { app = document.referrer.startsWith("android-app://") || window.matchMedia("(display-mode: fullscreen)").matches || window.matchMedia("(display-mode: standalone)").matches; } catch { app = false; }
    if (!app) return;
    const go = () => {
      try {
        if (document.fullscreenElement) return;
        const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
        if (el.requestFullscreen) void el.requestFullscreen({ navigationUI: "hide" }).catch(() => { /* refused */ });
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } catch { /* unsupported */ }
    };
    document.addEventListener("click", go, { once: true });
    document.addEventListener("touchend", go, { once: true });
    return () => { document.removeEventListener("click", go); document.removeEventListener("touchend", go); };
  }, []);
  return null;
}
