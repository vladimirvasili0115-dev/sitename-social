"use client";
import { useEffect } from "react";

// Registers the (cache-free) service worker so the browser offers "Install app" and the site can be packed as an APK.
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* not available (private mode, old browser) */ });
  }, []);
  return null;
}
