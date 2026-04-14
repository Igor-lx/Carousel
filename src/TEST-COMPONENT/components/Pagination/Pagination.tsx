import { memo, useMemo } from "react";

import type { PaginationProps } from "./types";

import styles from "./Pagination.module.scss";
import { mergeStyles } from "../../../shared";
import { usePaginationSync } from "../../hooks";
import { useCarouselContext } from "../../model/context";
import { PaginationView } from "./components/PaginationView";

export const Pagination = memo(({ className }: PaginationProps) => {
  const {
    actualDuration,
    activePageIndex,
    handlePageSelect,
    isJumping,
    isReducedMotion,
    moveReason,
    pageCount,
  } = useCarouselContext();

  const classNames = useMemo(() => {
    if (!className) return styles;
    return mergeStyles(styles, className);
  }, [className]);

  const shouldSyncInstantly =
    moveReason !== "autoplay" || isJumping || isReducedMotion;

  const visualIndex = usePaginationSync({
    targetIndex: activePageIndex,
    isInstant: shouldSyncInstantly,
    duration: actualDuration,
  });

  if (pageCount <= 1) return null;

  return (
    <PaginationView
      pageCount={pageCount}
      visualIndex={visualIndex}
      onPageSelect={handlePageSelect}
      classNames={classNames}
    />
  );
});

(Pagination as any).slot = "pagination";
