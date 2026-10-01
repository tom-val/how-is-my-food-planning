import { useEffect, useRef, useState } from "react";

/**
 * How long a freshly ticked item stays on screen while ticked items are
 * hidden. Keep in step with the `fp-shop-linger` animation in index.css.
 */
export const LINGER_MS = 1000;

/**
 * Lingering (just ticked) item id → ids of the items shown after it at the
 * moment it was ticked, nearest first.
 */
type Lingering = ReadonlyMap<string, readonly string[]>;

const NONE: Lingering = new Map();

/**
 * The items to show while ticked items are hidden: every unticked item in the
 * incoming order, plus the lingering ones put back where they were when they
 * were ticked. The optimistic update (and the server) sort ticked items to the
 * end, so without this a freshly ticked item would jump away before vanishing.
 */
export function arrangeUntickedItems<T>(
  items: readonly T[],
  lingering: Lingering,
  getId: (item: T) => string,
  isChecked: (item: T) => boolean,
): T[] {
  const shown: T[] = [];
  const floating = new Map<string, T>();
  for (const item of items) {
    if (!isChecked(item)) shown.push(item);
    else if (lingering.has(getId(item))) floating.set(getId(item), item);
  }
  if (floating.size === 0) return shown;

  const indexOf = (id: string) => shown.findIndex((item) => getId(item) === id);

  // Insert before the first follower that is still shown, placing lingering
  // followers first so items ticked in a row keep their relative order.
  const place = (id: string) => {
    const item = floating.get(id);
    if (item === undefined) return;
    floating.delete(id);
    for (const followerId of lingering.get(id) ?? []) {
      place(followerId);
      const at = indexOf(followerId);
      if (at !== -1) {
        shown.splice(at, 0, item);
        return;
      }
    }
    shown.push(item);
  };
  for (const id of [...floating.keys()]) place(id);
  return shown;
}

interface TickedFilterOptions<T> {
  /** Whether ticked items are hidden. */
  enabled: boolean;
  getId: (item: T) => string;
  isChecked: (item: T) => boolean;
}

/**
 * Hides ticked items when enabled. An item the user ticks stays visible in
 * place for {@link LINGER_MS} first, so the tick registers and an accidental
 * tap can be undone by tapping again.
 */
export function useTickedFilter<T>(
  items: readonly T[],
  { enabled, getId, isChecked }: TickedFilterOptions<T>,
) {
  const [lingering, setLingering] = useState<Lingering>(NONE);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const visible: readonly T[] = enabled
    ? arrangeUntickedItems(items, lingering, getId, isChecked)
    : items;

  const stopLingering = (id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setLingering((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  /** Call when the user ticks or unticks an item, before updating it. */
  const noteToggle = (id: string, nowChecked: boolean) => {
    stopLingering(id);
    if (!nowChecked || !enabled) return;

    const at = visible.findIndex((item) => getId(item) === id);
    const followers = at === -1 ? [] : visible.slice(at + 1).map(getId);
    setLingering((prev) => new Map(prev).set(id, followers));
    timers.current.set(
      id,
      window.setTimeout(() => stopLingering(id), LINGER_MS),
    );
  };

  return {
    /** Items to render, in display order. */
    visible,
    /** Number of ticked items currently hidden. */
    hiddenCount: items.length - visible.length,
    noteToggle,
  };
}
