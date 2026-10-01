import { useSyncExternalStore } from "react";

const STORAGE_KEY = "shopping.hideTicked";

const listeners = new Set<() => void>();
let cached: boolean | null = null;

function read(): boolean {
  if (cached === null) {
    try {
      cached = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      cached = false;
    }
  }
  return cached;
}

function write(next: boolean) {
  if (next === read()) return;
  cached = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other open tabs of the app in step.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cached = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The "hide ticked items" shopping list preference. Remembered per device and
 * shared by the weekly and general lists.
 */
export function useHideTicked(): [boolean, (next: boolean) => void] {
  const hideTicked = useSyncExternalStore(subscribe, read, () => false);
  return [hideTicked, write];
}
