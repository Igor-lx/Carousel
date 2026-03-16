import { useCallback } from "react";
import type { MoveReason } from "../types/reducer.types";
import type { Slide } from "../types/types";

interface ClickProps {
  readonly onMove: (step: number, reason: MoveReason) => void;
  readonly onGoTo: (target: number, reason: MoveReason) => void;
  readonly offset: number;
  readonly stepSize: number;
  readonly onClick?: (slide: Slide) => void;
  readonly filter: (callback?: () => void) => void;
}

interface ClickResult {
  readonly handleMove: (step: number) => void;
  readonly handleDot: (index: number) => void;
  readonly handleSlide: (slide: Slide) => void;
}

export function useCarouselClick({
  onMove,
  onGoTo,
  offset,
  stepSize,
  onClick,
  filter,
}: ClickProps): ClickResult {
  const handleMove = useCallback(
    (step: number) => {
      filter(() => onMove(step, "click"));
    },
    [onMove, filter],
  );

  const handleDot = useCallback(
    (index: number) => {
      onGoTo(offset + index * stepSize, "click");
    },
    [onGoTo, offset, stepSize],
  );

  const handleSlide = useCallback(
    (slide: Slide) => {
      filter(() => onClick?.(slide));
    },
    [onClick, filter],
  );

  return {
    handleMove,
    handleDot,
    handleSlide,
  };
}
