import { useEffect, useRef, useState } from "react";

interface UsePaginationSyncProps {
  targetIndex: number;
  duration: number;
  isInstant: boolean;
  autoplayPaginationFactor: number;
}

const resolvePaginationDelay = (duration: number, factor: number) => {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  if (!(factor > 0 && factor < 1)) {
    return 0;
  }

  return duration * factor;
};

export const usePaginationSync = ({
  targetIndex,
  duration,
  isInstant,
  autoplayPaginationFactor,
}: UsePaginationSyncProps): number => {
  const [visualIndex, setVisualIndex] = useState(targetIndex);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const delay = isInstant
      ? 0
      : resolvePaginationDelay(duration, autoplayPaginationFactor);

    if (delay <= 0) {
      setVisualIndex((prev) => (prev === targetIndex ? prev : targetIndex));
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setVisualIndex((prev) => (prev === targetIndex ? prev : targetIndex));
    }, delay);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [targetIndex, duration, isInstant, autoplayPaginationFactor]);

  return visualIndex;
};
