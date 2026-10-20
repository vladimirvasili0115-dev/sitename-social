"use client";

import { useEffect, useState } from "react";
import { bottleNameColors } from "@/lib/bottleSync";

// Name colours the admin can give a player (admin panel → user → "Name colour"). Shown in the game, the chat and the ratings.
export const NAME_COLORS: { id: string; swatch: string; className: string }[] = [
  { id: "pink", swatch: "#FF3EA5", className: "font-extrabold text-[#FF3EA5]" },
  { id: "chameleon", swatch: "linear-gradient(90deg,#FF3EA5,#FFD60A,#22C55E,#3B82F6,#A855F7)", className: "font-extrabold name-chameleon" },
  { id: "champagne", swatch: "linear-gradient(90deg,#FFF1D6,#E8C27A,#C9A55C)", className: "font-extrabold name-champagne" },
  { id: "gold", swatch: "linear-gradient(90deg,#8A6200,#F5C400,#FFF4B0)", className: "font-extrabold gold-name" },
  { id: "rainbow", swatch: "linear-gradient(90deg,#EF4444,#F59E0B,#22C55E,#3B82F6,#8B5CF6)", className: "font-extrabold name-rainbow" },
  { id: "red", swatch: "#E11D48", className: "font-extrabold text-[#E11D48]" },
  { id: "orange", swatch: "#F97316", className: "font-extrabold text-[#F97316]" },
  { id: "green", swatch: "#16A34A", className: "font-extrabold text-[#16A34A]" },
  { id: "blue", swatch: "#2563EB", className: "font-extrabold text-[#2563EB]" },
  { id: "purple", swatch: "#9333EA", className: "font-extrabold text-[#9333EA]" },
  { id: "black", swatch: "#111827", className: "font-extrabold text-[#111827]" },
  { id: "white", swatch: "#FFFFFF", className: "font-extrabold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]" },
];
export const nameColorClass = (id: string | undefined | null) => (id ? NAME_COLORS.find((item) => item.id === id)?.className ?? "" : "");

// Everybody's chosen colours, refreshed once a minute (a small list: only players who have a colour).
let cache: Record<string, string> = {};
const listeners = new Set<(value: Record<string, string>) => void>();
let timer = 0;
async function load() {
  const value = await bottleNameColors();
  if (value && typeof value === "object") { cache = value; listeners.forEach((listen) => listen(cache)); }
}
export function refreshNameColors() { void load(); }
export function useNameColors() {
  const [colors, setColors] = useState(cache);
  useEffect(() => {
    listeners.add(setColors);
    if (listeners.size === 1) { void load(); timer = window.setInterval(() => void load(), 60000); }
    return () => { listeners.delete(setColors); if (!listeners.size) window.clearInterval(timer); };
  }, []);
  return colors;
}
