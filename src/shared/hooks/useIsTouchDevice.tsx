import {
  useSyncExternalStore,
  useEffect,
  useState,
  useLayoutEffect,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

let isTouchDeviceState = false;
let mql: MediaQueryList | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((cb) => cb());
};

const handleMqlChange = (e: MediaQueryListEvent) => {
  if (isTouchDeviceState !== e.matches) {
    isTouchDeviceState = e.matches;
    notify();
  }
};

const handlePointerDown = (e: PointerEvent) => {
  if (e.pointerType === "touch") {
    if (!isTouchDeviceState) {
      isTouchDeviceState = true;
      notify();
    }
    // Как только тач зафиксирован, слушатель больше не нужен
    window.removeEventListener("pointerdown", handlePointerDown);
  }
};

const subscribe = (callback: () => void) => {
  listeners.add(callback);

  if (typeof window !== "undefined" && !mql) {
    mql = window.matchMedia("(pointer: coarse)");
    isTouchDeviceState = mql.matches;

    mql.addEventListener("change", handleMqlChange);

    // Слушаем до первого реального тача, не используя once: true
    if (!isTouchDeviceState) {
      window.addEventListener("pointerdown", handlePointerDown, {
        passive: true,
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

const getSnapshot = () => isTouchDeviceState;
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
