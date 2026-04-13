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
    isJumping,
    isReducedMotion,
    moveReason,
    actualDuration,
  } = useCarouselContext();

  if (pageCount <= 1) return null;

  const mergedStyles = useMemo(() => {
    if (!className) return styles;
    return mergeStyles(styles, className);
  }, [className]);

  const isInstantSync =
    moveReason !== "autoplay" || isJumping || isReducedMotion;

  const visualIndex = usePaginationSync({
    targetIndex: activeDotIndex,
    isInstant: isInstantSync,
    duration: actualDuration,
  });

  return (
    <PaginationView
      pageCount={pageCount}
      visualIndex={visualIndex}
      handleDotClick={handleDotClick}
      styles={mergedStyles}
    />
  );
});

(Pagination as any).slot = "pagination";
