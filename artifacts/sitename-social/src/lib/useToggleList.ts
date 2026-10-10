"use client";
import { useCallback } from "react";
import type { Store } from "./store";
import { useStore } from "./useStore";

export function useToggleList(store: Store<string[]>) {
  const [list, update] = useStore(store);
  const toggle = useCallback((id: string) => update((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])), [update]);
  return [list, toggle] as const;
}
