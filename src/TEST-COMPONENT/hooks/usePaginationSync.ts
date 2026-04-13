import { useEffect, useRef, useState } from "react";
import { AUTOPLAY_PAGINATION_FACTOR } from "../model/constants";

interface UsePaginationSyncProps {
  targetIndex: number;
  duration: number;
  isInstant: boolean;
}

const getValidPaginationDelay = (duration: number, factor: number) => {
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
}: UsePaginationSyncProps) => {
  const [visualIndex, setVisualIndex] = useState(targetIndex);
  const timeoutRef = useRef<number | null>(null);

  const clearScheduledSync = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    clearScheduledSync();

    const delay = isInstant
      ? 0
      : getValidPaginationDelay(duration, AUTOPLAY_PAGINATION_FACTOR);

    if (delay <= 0) {
      setVisualIndex((prev) => (prev === targetIndex ? prev : targetIndex));
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      setVisualIndex((prev) => (prev === targetIndex ? prev : targetIndex));
    }, delay);

    return clearScheduledSync;
  }, [targetIndex, duration, isInstant]);

  useEffect(
    () => () => {
      clearScheduledSync();
    },
    [],
  );

  return visualIndex;
};
