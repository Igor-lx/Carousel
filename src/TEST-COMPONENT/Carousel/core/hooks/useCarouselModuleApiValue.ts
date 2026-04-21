import { useMemo } from "react";

import type { CarouselModuleApi } from "../model/context";
import type { MoveReason } from "../model/reducer";

interface UseCarouselModuleApiValueProps {
  pageCount: number;
  activePageIndex: number;
  isMoving: boolean;
  isJumping: boolean;
  moveReason: MoveReason;
  motionDuration: number;
  handlePageSelect: (index: number) => void;
  handlePrev: () => void;
  handleNext: () => void;
  isAtStart: boolean;
  isAtEnd: boolean;
  isTouch: boolean;
  isReducedMotion: boolean;
}

export function useCarouselModuleApiValue({
  pageCount,
  activePageIndex,
  isMoving,
  isJumping,
  moveReason,
  motionDuration,
  handlePageSelect,
  handlePrev,
  handleNext,
  isAtStart,
  isAtEnd,
  isTouch,
  isReducedMotion,
}: UseCarouselModuleApiValueProps): CarouselModuleApi {
  return useMemo(
    () => ({
      pageCount,
      activePageIndex,
      isMoving,
      isJumping,
      moveReason,
      motionDuration,
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
