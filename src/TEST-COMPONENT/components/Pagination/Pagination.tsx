import { memo, useMemo } from "react";

import type { PaginationProps } from "./types";

import styles from "./Pagination.module.scss";
import { mergeStyles } from "../../../shared";
import { usePaginationSync } from "../../hooks";
import { useCarouselContext } from "../../model/context";
import { PaginationView } from "./components/PaginationView";

export const Pagination = memo(({ className }: PaginationProps) => {
  const {
    pageCount,
    activeDotIndex,
    handleDotClick,
    isPaginationDynamic,
    isMoving,
    isJumping,
    moveReason,
    actualSpeed,
  } = useCarouselContext();

  if (pageCount <= 1) return null;

  const mergedStyles = useMemo(
    () => mergeStyles(styles, className),
    [className],
  );

  const isInstantSync =
    !isPaginationDynamic || !isMoving || isJumping || moveReason === "gesture";

  const visualIndex = usePaginationSync({
    targetIndex: activeDotIndex,
    isInstant: isInstantSync,
    conditions: moveReason,
    speed: actualSpeed,
  });

  return (
    <PaginationView
      pageCount={pageCount}
      visualIndex={visualIndex}
      mergedStyles={mergedStyles}
      handleDotClick={handleDotClick}
    />
  );
});

(Pagination as any).slot = "pagination";
