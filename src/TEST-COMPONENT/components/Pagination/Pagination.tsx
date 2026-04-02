import clsx from "clsx";
import { memo, useMemo, useCallback } from "react";

import type { PaginationDotProps, PaginationProps } from "./types";

import styles from "./Pagination.module.scss";
import { mergeStyles } from "../../../shared";
import { usePaginationSync } from "../../hooks";
import { useCarouselContext } from "../../model/context";

export const PaginationCarousel = memo(({ className }: PaginationProps) => {
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

  const dots = useMemo(
    () => Array.from({ length: pageCount }, (_, i) => i),
    [pageCount],
  );

  return (
    <div className={mergedStyles.paginationWrapper} aria-hidden="true">
      {dots.map((idx) => (
        <Dot
          key={idx}
          idx={idx}
          visualIndex={visualIndex}
          className={mergedStyles}
          onDotClick={handleDotClick}
        />
      ))}
    </div>
  );
});

const Dot = memo(
  ({ idx, visualIndex, className, onDotClick }: PaginationDotProps) => {
    const handleClick = useCallback(() => onDotClick(idx), [idx, onDotClick]);
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => e.preventDefault(),
      [],
    );
    return (
      <button
        type="button"
        className={clsx(
          className.dot,
          idx === visualIndex && className.dotActive,
        )}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        disabled={idx === visualIndex}
        tabIndex={-1}
      />
    );
  },
);
