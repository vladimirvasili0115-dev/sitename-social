"use client";
import { invisibleStore } from "@/lib/stores";
import { useStore } from "@/lib/useStore";

export function useInvisible() {
  const [state, update] = useStore(invisibleStore);
  return {
    state,
    hidesOnline: state.enabled && state.hideOnline,
    hidesVisits: state.enabled && state.hideVisits,
    set: (patch: Partial<typeof state>) => update((current) => ({ ...current, ...patch })),
  };
}
