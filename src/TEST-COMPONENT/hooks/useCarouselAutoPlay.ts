import { useState, useRef, useCallback, useEffect } from "react";
import { HOVER_TRESHOLD } from "../model/constants";
import type { MoveReason } from "../model/reducer";


interface AutoPlayProps {
  readonly enabled: boolean;
  readonly delay: number;
  readonly isPaused: boolean;
  readonly ignoreHover: boolean;
  readonly isAtEnd: boolean;
  readonly onGoTo: (target: number, reason: MoveReason) => void;
  readonly onMove: (step: number, reason: MoveReason) => void;
}

interface AutoPlayResult {
  readonly onHover: (active: boolean) => void;
  readonly setPause: (active: boolean) => void;
}

export function useCarouselAutoPlay({
  enabled,
  delay,
  isPaused,
  ignoreHover,
  isAtEnd,
  onGoTo,
  onMove,
}: AutoPlayProps): AutoPlayResult {
  const [isInternalPaused, setIsInternalPaused] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleInternalPause = useCallback(
    (active: boolean, withDelay = false) => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

      if (active && withDelay) {
        hoverTimerRef.current = setTimeout(
          () => setIsInternalPaused(true),
          HOVER_TRESHOLD,
        );
      } else {
        setIsInternalPaused(active);
      }
    },
    [],
  );

  const onHover = useCallback(
    (active: boolean) => {
      if (!enabled || ignoreHover) return;
      toggleInternalPause(active, active);
    },
    [enabled, ignoreHover, toggleInternalPause],
  );

  useEffect(() => {
    if (!enabled || isPaused || isInternalPaused) return;

    const timeout = setTimeout(() => {
      if (isAtEnd) {
        onGoTo(0, "autoplay");
      } else {
        onMove(1, "autoplay");
      }
    }, delay);
    return () => clearTimeout(timeout);
  }, [enabled, isPaused, isInternalPaused, isAtEnd, delay, onGoTo, onMove]);

  return {
    onHover,
    setPause: toggleInternalPause,
  };
}
