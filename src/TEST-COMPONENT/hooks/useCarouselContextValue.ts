import { useMemo } from "react";

import type { CarouselContextValue } from "../model/context";
import type { MoveReason } from "../model/reducer";

interface UseCarouselContextValueProps {
  pageCount: number;
  activeDotIndex: number;
  isMoving: boolean;
  isJumping: boolean;
  moveReason: MoveReason;
  actualDuration: number;
  handleDotClick: (index: number) => void;
  handlePrev: () => void;
  handleNext: () => void;
  isFiniteAndAtStart: boolean;
  isFiniteAndAtEnd: boolean;
  isTouch: boolean;
  isReducedMotion: boolean;
}

export function useCarouselContextValue({
  pageCount,
  activeDotIndex,
  isMoving,
  isJumping,
  moveReason,
  actualDuration,
  handleDotClick,
  handlePrev,
  handleNext,
  isFiniteAndAtStart,
  isFiniteAndAtEnd,
  isTouch,
  isReducedMotion,
}: UseCarouselContextValueProps): CarouselContextValue {
  return useMemo(
    () => ({
      pageCount,
      activeDotIndex,
      isMoving,
      isJumping,
      moveReason,
      actualDuration,
      handleDotClick,
      handlePrev,
      handleNext,
      showAtStart: !isFiniteAndAtStart,
      showAtEnd: !isFiniteAndAtEnd,
      isTouch,
      isReducedMotion,
    }),
    [
      pageCount,
      activeDotIndex,
      isMoving,
      isJumping,
      moveReason,
      actualDuration,
      handleDotClick,
      handlePrev,
      handleNext,
      isFiniteAndAtStart,
      isFiniteAndAtEnd,
      isTouch,
      isReducedMotion,
    ],
  );
}
