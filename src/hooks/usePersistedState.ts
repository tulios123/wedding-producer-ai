import { useState, useEffect } from "react";

const PREFIX = "wp_";

export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = PREFIX + key;
  const [state, setState] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setState(JSON.parse(stored) as T);
      }
    } catch {
      // corrupt storage — fall back to initialValue
    }
    setHydrated(true);
  }, []); // intentionally run once on mount only

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // storage unavailable
    }
  }, [state, storageKey, hydrated]);

  return [state, setState];
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
