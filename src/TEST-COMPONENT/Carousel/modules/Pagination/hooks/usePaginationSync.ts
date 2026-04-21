import { useEffect, useRef, useState } from "react";
import { SAFE_INTERACTION_SETTINGS } from "../../../core/model/normalization";

interface UsePaginationSyncProps {
  targetIndex: number;
  duration: number;
  isInstant: boolean;
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
      : resolvePaginationDelay(
          duration,
          SAFE_INTERACTION_SETTINGS.autoplayPaginationFactor,
        );

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
  }, [targetIndex, duration, isInstant]);

  return visualIndex;
};
