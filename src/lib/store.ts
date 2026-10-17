export type Store<T> = { initial: T; event: string; read: () => T; write: (value: T) => void };

// Mock persistence in localStorage. Swap read/write for API calls when the backend exists.
export function createStore<T>(key: string, initial: T): Store<T> {
  const event = `${key}-change`;
  return {
    initial,
    event,
    read: () => {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : initial;
      } catch {
        return initial;
      }
    },
    write: (value) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage full or blocked: the change still applies for this visit.
      }
      window.dispatchEvent(new CustomEvent<T>(event, { detail: value }));
    },
  };
}
