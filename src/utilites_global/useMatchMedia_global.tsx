import {
  useSyncExternalStore,
  useState,
  useLayoutEffect,
  useEffect,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const SCREEN_GRID = {
  DESKTOP: 1024,
  TABLET: 768,
  MOBILE: 0,
} as const;

type BreakpointKey = keyof typeof SCREEN_GRID;

const SORTED_CONFIG = (
  Object.entries(SCREEN_GRID) as [BreakpointKey, number][]
).sort(([, a], [, b]) => b - a);

let currentBreakpoint: BreakpointKey = "MOBILE";
let isInitialized = false;
const listeners = new Set<() => void>();
const mqls: Map<BreakpointKey, MediaQueryList> = new Map();

const notify = () => {
  const snapshot = [...listeners];
  snapshot.forEach((cb) => cb());
};

const updateBreakpoint = (): BreakpointKey => {
  for (const [key] of SORTED_CONFIG) {
    if (mqls.get(key)?.matches) return key;
  }
  return "MOBILE";
};

const handleResize = () => {
  const next = updateBreakpoint();
  if (next !== currentBreakpoint) {
    currentBreakpoint = next;
    notify();
  }
};

const subscribe = (callback: () => void) => {
  listeners.add(callback);

  if (!isInitialized && typeof window !== "undefined") {
    SORTED_CONFIG.forEach(([key, value]) => {
      const mql = window.matchMedia(`(min-width: ${value}px)`);
      mqls.set(key, mql);
      mql.addEventListener("change", handleResize);
    });

    currentBreakpoint = updateBreakpoint();
    isInitialized = true;
  }

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) {
      mqls.forEach((mql) => mql.removeEventListener("change", handleResize));
      mqls.clear();
      isInitialized = false;
    }
  };
};

const getSnapshot = () => currentBreakpoint;
const getServerSnapshot = () => "MOBILE" as BreakpointKey;

export function useMatchMedia<T>(
  values: Partial<Record<BreakpointKey, T>> & { DEFAULT: T },
): T {

  const [isMounted, setIsMounted] = useState(false);

  const activeKey = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useIsomorphicLayoutEffect(() => {
    setIsMounted(true);
  }, []);


  const currentKey = isMounted ? activeKey : "MOBILE";

  return values[currentKey] ?? values.DEFAULT;
}

/*
const COMPONENT_VARIABLE_PROP = {
  DESKTOP: 3,
  TABLET: 2,
  MOBILE: 1,
  DEFAULT: 3,
};

const COMPONENT_PROP = useMatchMedia(COMPONENT_VARIABLE_PROP);

JSX:

 <component
            className={styles}
            prop={COMPONENT_PROP }
            

*/
