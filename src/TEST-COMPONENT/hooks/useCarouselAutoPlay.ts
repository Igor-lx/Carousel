import { useState, useRef, useCallback, useEffect } from "react";
import { HOVER_THRESHOLD } from "../model/constants";
import type { MoveReason } from "../model/reducer";


interface AutoPlayProps {
  enabled: boolean;
  intervalAutoplay: number;
  isPaused: boolean;
  ignoreHover: boolean;
  isAtEnd: boolean;
  onGoTo: (target: number, reason: MoveReason) => void;
  onMove: (step: number, reason: MoveReason) => void;
}

interface AutoPlayResult {
  onHover: (active: boolean) => void;
}

export function useCarouselAutoPlay({
  enabled,
  intervalAutoplay,
  isPaused,
  ignoreHover,
  isAtEnd,
  onGoTo,
  onMove,
}: AutoPlayProps): AutoPlayResult {
  const [isInternalPaused, setIsInternalPaused] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const toggleInternalPause = useCallback(
    (active: boolean, withDelay = false) => {
      clearHoverTimer();

      if (active && withDelay) {
        hoverTimerRef.current = setTimeout(
          () => setIsInternalPaused(true),
          HOVER_THRESHOLD,
        );
      } else {
        setIsInternalPaused(active);
      }
    },
    [clearHoverTimer],
  );

  const onHover = useCallback(
    (active: boolean) => {
      if (!enabled || ignoreHover) return;
      toggleInternalPause(active, active);
    },
    [enabled, ignoreHover, toggleInternalPause],
  );

  useEffect(() => {
    if (enabled && !ignoreHover) return;

    clearHoverTimer();
    setIsInternalPaused(false);
  }, [enabled, ignoreHover, clearHoverTimer]);

  useEffect(() => {
    if (!enabled || isPaused || isInternalPaused) return;

    const timeout = setTimeout(() => {
      if (isAtEnd) {
        onGoTo(0, "autoplay");
      } else {
        onMove(1, "autoplay");
      }
    }, intervalAutoplay);
    return () => clearTimeout(timeout);
  }, [
    enabled,
    isPaused,
    isInternalPaused,
    isAtEnd,
    intervalAutoplay,
    onGoTo,
    onMove,
  ]);

  useEffect(
    () => () => {
      clearHoverTimer();
    },
    [clearHoverTimer],
  );

  return {
    onHover,
  };
}
