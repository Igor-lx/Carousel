import { useState, useLayoutEffect, useEffect, type RefObject } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const CONTAINER_GRID = {
  DESKTOP: 600,
  TABLET: 300,
  MOBILE: 0,
} as const;

type ContainerBreakpointKey = keyof typeof CONTAINER_GRID;

const SORTED_CONTAINER_CONFIG = (
  Object.entries(CONTAINER_GRID) as [ContainerBreakpointKey, number][]
).sort(([, a], [, b]) => b - a);

const calculateBreakpoint = (width: number): ContainerBreakpointKey => {
  for (const [key, threshold] of SORTED_CONTAINER_CONFIG) {
    if (width >= threshold) return key;
  }
  return "MOBILE";
};

const callbacksMap = new Map<Element, (key: ContainerBreakpointKey) => void>();

const globalResizeObserver =
  typeof window !== "undefined"
    ? new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const callback = callbacksMap.get(entry.target);
          if (callback) {
            const key = calculateBreakpoint(entry.contentRect.width);
            callback(key);
          }
        });
      })
    : null;

export function useContainerSizeFit_global<T>(
  containerRef: RefObject<HTMLElement | null>,
  values: Partial<Record<ContainerBreakpointKey, T>> & { DEFAULT: T },
): T {
  const [activeContainerKey, setActiveContainerKey] =
    useState<ContainerBreakpointKey>("MOBILE");

  useIsomorphicLayoutEffect(() => {
    const target = containerRef.current;
    if (!target || !globalResizeObserver) return;

    callbacksMap.set(target, (key) => {
      setActiveContainerKey((prev) => (prev !== key ? key : prev));
    });

    globalResizeObserver.observe(target);

    return () => {
      callbacksMap.delete(target);
      globalResizeObserver.unobserve(target);
    };
  }, [containerRef]);

  return values[activeContainerKey] ?? values.DEFAULT;
}
