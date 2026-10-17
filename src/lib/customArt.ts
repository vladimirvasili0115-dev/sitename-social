"use client";
import { useSyncExternalStore } from "react";

// Own pictures from public/custom (gifts and bottles). The list is made at build time (/custom-list.json).
let files: Set<string> = new Set();
let started = false;
const listeners = new Set<() => void>();
function load() {
  if (started || typeof window === "undefined") return;
  started = true;
  void fetch("/custom-list.json").then((res) => (res.ok ? res.json() : [])).then((list: string[]) => {
    files = new Set(Array.isArray(list) ? list : []);
    listeners.forEach((listener) => listener());
  }).catch(() => {});
}
export function useCustomArt() {
  return useSyncExternalStore((listener) => { load(); listeners.add(listener); return () => { listeners.delete(listener); }; }, () => files, () => files);
}
// First existing picture with this name (png, webp, jpg).
export function customFile(set: Set<string>, base: string) {
  for (const ext of ["png", "webp", "jpg", "jpeg", "gif"]) if (set.has(`${base}.${ext}`)) return `/custom/${base}.${ext}`;
  return null;
}
