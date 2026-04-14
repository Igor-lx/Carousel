import { useCallback } from "react";
import type { MoveReason } from "../model/reducer";
import type { Slide } from "../Carousel.types";

interface ClickProps {
  onMove: (step: number, reason: MoveReason) => void;
  onGoTo: (target: number, reason: MoveReason) => void;
  onClick?: (slideData: Slide) => void;
}

interface ClickResult {
  handlePrev: () => void;
  handleNext: () => void;
  handlePageSelect: (index: number) => void;
  handleSlideClick: (slideData: Slide) => void;
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

  const handlePageSelect = useCallback(
    (index: number) => {
      onGoTo(index, "click");
    },
    [onGoTo],
  );

  const handleSlideClick = useCallback(
    (slideData: Slide) => onClick?.(slideData),
    [onClick],
  );

  return {
    handlePrev,
    handleNext,
    handlePageSelect,
    handleSlideClick,
  };
}
