import { useCallback } from "react";
import type { MoveReason } from "../../model/reducer";
import type { Slide } from "../../types";

interface UseCarouselClickHandlersProps {
  onMove: (step: number, reason: MoveReason) => void;
  onGoTo: (targetPageIndex: number, reason: MoveReason) => void;
  onClick?: (slideData: Slide) => void;
}

interface UseCarouselClickHandlersResult {
  handlePrev: () => void;
  handleNext: () => void;
  handlePageSelect: (pageIndex: number) => void;
  handleSlideClick: (slideData: Slide) => void;
}

export function useCarouselClickHandlers({
  onMove,
  onGoTo,
  onClick,
}: UseCarouselClickHandlersProps): UseCarouselClickHandlersResult {
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
    (pageIndex: number) => {
      onGoTo(pageIndex, "click");
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
