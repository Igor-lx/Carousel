import { useCallback } from "react";
import type { MoveReason } from "../model/reducer";
import type { Slide } from "../Carousel.types";

interface ClickProps {
  onMove: (step: number, reason: MoveReason) => void;
  onGoTo: (target: number, reason: MoveReason) => void;
  onClick?: (slideData: Slide) => void;
}

interface ClickResult {
  handleMove: (step: number) => void;
  handleDot: (index: number) => void;
  handleSlide: (slideData: Slide) => void;
  handlePrev: () => void;
  handleNext: () => void;
}

export function useCarouselClick({
  onMove,
  onGoTo,
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
      onGoTo(index, "click");
    },
    [onGoTo],
  );

  const handleSlide = useCallback(
    (slideData: Slide) => onClick?.(slideData),
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
