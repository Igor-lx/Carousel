import { memo, useMemo } from "react";

import type { PaginationProps } from "./types";

import styles from "./Pagination.module.scss";
import { mergeStyles } from "../../../../shared";
import { useCarouselModuleContext } from "../../core/model/context";
import type { CarouselSlotComponent } from "../../core/model/slots";
import { usePaginationSync } from "./hooks/usePaginationSync";
import { PaginationView } from "./components/PaginationView";

const PaginationBase = memo(({ className }: PaginationProps) => {
  const {
    motionDuration,
    activePageIndex,
    handlePageSelect,
    isJumping,
    isReducedMotion,
    moveReason,
    pageCount,
    autoplayPaginationFactor,
  } = useCarouselModuleContext();

  const classNames = useMemo(() => {
    if (!className) return styles;
    return mergeStyles(styles, className);
  }, [className]);

  const shouldSyncInstantly =
    moveReason !== "autoplay" || isJumping || isReducedMotion;

  const visualIndex = usePaginationSync({
    targetIndex: activePageIndex,
    isInstant: shouldSyncInstantly,
    duration: motionDuration,
    autoplayPaginationFactor,
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

export const Pagination: CarouselSlotComponent<
  typeof PaginationBase,
  "pagination"
> = Object.assign(PaginationBase, {
  slot: "pagination" as const,
});
