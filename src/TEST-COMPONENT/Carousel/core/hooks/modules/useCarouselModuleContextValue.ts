import { useMemo } from "react";

import type { CarouselModuleContextValue } from "../../model/context";
import type { MoveReason } from "../../model/reducer";

interface UseCarouselModuleContextValueProps {
  pageCount: number;
  activePageIndex: number;
  isMoving: boolean;
  isJumping: boolean;
  moveReason: MoveReason;
  motionDuration: number;
  autoplayPaginationFactor: number;
  handlePageSelect: (index: number) => void;
  handlePrev: () => void;
  handleNext: () => void;
  isAtStart: boolean;
  isAtEnd: boolean;
  isTouch: boolean;
  isReducedMotion: boolean;
}

export function useCarouselModuleContextValue({
  pageCount,
  activePageIndex,
  isMoving,
  isJumping,
  moveReason,
  motionDuration,
  autoplayPaginationFactor,
  handlePageSelect,
  handlePrev,
  handleNext,
  isAtStart,
  isAtEnd,
  isTouch,
  isReducedMotion,
}: UseCarouselModuleContextValueProps): CarouselModuleContextValue {
  return useMemo(
    () => ({
      pageCount,
      activePageIndex,
      isMoving,
      isJumping,
      moveReason,
      motionDuration,
      autoplayPaginationFactor,
      handlePageSelect,
      handlePrev,
      handleNext,
      canMovePrev: !isAtStart,
      canMoveNext: !isAtEnd,
      isTouch,
      isReducedMotion,
    }),
    [
      pageCount,
      activePageIndex,
      isMoving,
      isJumping,
      moveReason,
      motionDuration,
      autoplayPaginationFactor,
      handlePageSelect,
      handlePrev,
      handleNext,
      isAtStart,
      isAtEnd,
      isTouch,
      isReducedMotion,
    ],
  );
}
