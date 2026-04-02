import {
  useSyncExternalStore,
  useEffect,
  useState,
  useLayoutEffect,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

let isTouchDevice = false;
let mql: MediaQueryList | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  const snapshot = [...listeners];
  snapshot.forEach((cb) => cb());
};

const handleMqlChange = (e: MediaQueryListEvent) => {
  if (isTouchDevice !== e.matches) {
    isTouchDevice = e.matches;
    notify();
  }
};

const handlePointerDown = (e: PointerEvent) => {
  if (e.pointerType === "touch") {
    if (isTouchDevice) return;
    isTouchDevice = true;
    notify();
  }
};

const subscribe = (callback: () => void) => {
  listeners.add(callback);

  if (typeof window !== "undefined" && !mql) {
    mql = window.matchMedia("(pointer: coarse)");
    isTouchDevice = mql.matches;

    mql.addEventListener("change", handleMqlChange);

    if (!isTouchDevice) {
      window.addEventListener("pointerdown", handlePointerDown, {
        passive: true,
        once: true,
      });
    }
  }

  return () => {
    listeners.delete(callback);

    if (listeners.size === 0 && mql) {
      mql.removeEventListener("change", handleMqlChange);
      window.removeEventListener("pointerdown", handlePointerDown);
      mql = null;
    }
  };
};

const getSnapshot = () => isTouchDevice;
const getServerSnapshot = () => false;

export function useIsTouchDevice(): boolean {
  const [isMounted, setIsMounted] = useState(false);
  const touchState = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useIsomorphicLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? touchState : false;
}
