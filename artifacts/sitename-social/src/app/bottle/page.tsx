"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GameWindow } from "@/components/bottle/GameWindow";

// Direct link to the game: opens it full screen; closing returns to the games list.
// The page is not translated by the browser: the game rewrites its texts many times a second, and an automatic translation (e.g. into Russian) fights with that and can crash the tab.
export default function BottlePage() {
  const router = useRouter();
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "google";
    meta.content = "notranslate";
    document.head.appendChild(meta);
    const html = document.documentElement;
    const before = html.getAttribute("translate");
    html.setAttribute("translate", "no");
    return () => { meta.remove(); if (before === null) html.removeAttribute("translate"); else html.setAttribute("translate", before); };
  }, []);
  return <div translate="no" className="notranslate"><GameWindow startFull onClose={() => router.push("/games")} /></div>;
}
