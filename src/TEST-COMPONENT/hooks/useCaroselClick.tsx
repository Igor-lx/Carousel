import { useCallback } from "react";
import type { MoveReason } from "../model/reducer";
import type { Slide } from "../Carousel.types";


interface ClickProps {
  onMove: (step: number, reason: MoveReason) => void;
  onGoTo: (target: number, reason: MoveReason) => void;
  offset: number;
  stepSize: number;
  onClick?: (slide: Slide) => void;
}

interface ClickResult {
  handleMove: (step: number) => void;
  handleDot: (index: number) => void;
  handleSlide: (slide: Slide) => void;
  handlePrev: () => void;
  handleNext: () => void;
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

  const handlePrev = useCallback(() => {
    handleMove(-1);
  }, [handleMove]);

  const handleNext = useCallback(() => {
    handleMove(1);
  }, [handleMove]);

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
    handlePrev,
    handleNext,
    handleDot,
    handleSlide,
  };
}
