import { useEffect, useRef, useState } from "react";

interface UsePaginationSyncProps {
  targetPageIndex: number;
  motionDuration: number;
  shouldSyncInstantly: boolean;
  autoplayPaginationFactor: number;
}

const resolvePaginationDelay = (motionDuration: number, factor: number) => {
  if (!Number.isFinite(motionDuration) || motionDuration <= 0) {
    return 0;
  }

  if (!(factor > 0 && factor < 1)) {
    return 0;
  }

  return motionDuration * factor;
};

export const usePaginationSync = ({
  targetPageIndex,
  motionDuration,
  shouldSyncInstantly,
  autoplayPaginationFactor,
}: UsePaginationSyncProps): number => {
  const [displayedPageIndex, setDisplayedPageIndex] =
    useState(targetPageIndex);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const delay = shouldSyncInstantly
      ? 0
      : resolvePaginationDelay(motionDuration, autoplayPaginationFactor);

    if (delay <= 0) {
      setDisplayedPageIndex((prev) =>
        prev === targetPageIndex ? prev : targetPageIndex,
      );
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setDisplayedPageIndex((prev) =>
        prev === targetPageIndex ? prev : targetPageIndex,
      );
    }, delay);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    targetPageIndex,
    motionDuration,
    shouldSyncInstantly,
    autoplayPaginationFactor,
  ]);

  return displayedPageIndex;
};
