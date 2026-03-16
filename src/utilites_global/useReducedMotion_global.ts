import {
  useSyncExternalStore,
  useEffect,
  useState,
  useLayoutEffect,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

let isReduced = false;
let mql: MediaQueryList | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  const snapshot = [...listeners];
  snapshot.forEach((callback) => callback());
};

const handleMqlChange = (e: MediaQueryListEvent) => {
  if (isReduced !== e.matches) {
    isReduced = e.matches;
    notify();
  }
};

const subscribe = (callback: () => void) => {
  listeners.add(callback);

  if (!mql && typeof window !== "undefined") {
    mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    isReduced = mql.matches;
    mql.addEventListener("change", handleMqlChange);
  }

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && mql) {
      mql.removeEventListener("change", handleMqlChange);
      mql = null;
    }
  };
};

const getSnapshot = () => isReduced;
const getServerSnapshot = () => false;

export function useReducedMotion(): boolean {
  const [isMounted, setIsMounted] = useState(false);
  const syncState = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useIsomorphicLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? syncState : false;
}
