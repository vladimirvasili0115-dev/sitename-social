"use client";
import { useCallback, useEffect, useState } from "react";
import type { Store } from "./store";

export function useStore<T>(store: Store<T>) {
  const [value, setValue] = useState<T>(store.initial);
  useEffect(() => {
    setValue(store.read());
    const onChange = (event: Event) => setValue((event as CustomEvent<T>).detail);
    window.addEventListener(store.event, onChange);
    return () => window.removeEventListener(store.event, onChange);
  }, [store]);
  const update = useCallback((updater: (current: T) => T) => store.write(updater(store.read())), [store]);
  return [value, update] as const;
}
