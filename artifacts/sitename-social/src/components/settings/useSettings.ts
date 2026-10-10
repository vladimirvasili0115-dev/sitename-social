"use client";
import type { SettingsState } from "@/types";
import { settingsStore } from "@/lib/stores";
import { useStore } from "@/lib/useStore";

export function useSettings() {
  const [settings, update] = useStore(settingsStore);
  const set = (patch: Partial<SettingsState>) => update((current) => ({ ...current, ...patch }));
  return { settings, set, update };
}
