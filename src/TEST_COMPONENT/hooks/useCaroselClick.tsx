import { useCallback } from "react";
import type { MoveReason, Slide } from "../types";

interface ClickProps {
  readonly onMove: (step: number, reason: MoveReason) => void;
  readonly onGoTo: (target: number, reason: MoveReason) => void;
  readonly offset: number;
  readonly stepSize: number;
  readonly onClick?: (slide: Slide) => void;
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
}: ClickProps): ClickResult {
  const handleMove = useCallback(
    (step: number) => {
      onMove(step, "click");
    },
    [onMove],
  );

  const handleDot = useCallback(
    (index: number) => {
      onGoTo(offset + index * stepSize, "click");
    },
    [onGoTo, offset, stepSize],
  );

  const handleSlide = useCallback(
    (slide: Slide) => onClick?.(slide),
    [onClick],
  );

  return {
    handleMove,
    handleDot,
    handleSlide,
  };
}
