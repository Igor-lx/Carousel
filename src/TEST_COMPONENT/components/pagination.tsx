import clsx from "clsx";
import { memo, useMemo, useCallback } from "react";

import { usePaginationSync } from "../hooks";
import type {
  PaginationProps,
  PaginationDotProps,
} from "../types/subComponents.types";

export const Pagination = memo(
  ({
    pageCount,
    activeDotIndex,
    onDotClick,
    className,
    isDynamic,
    isMoving,
    isJump,
    moveReason,
    speed,
  }: PaginationProps) => {
    if (pageCount <= 1) return null;

    const isInstantSync =
      !isDynamic || !isMoving || isJump || moveReason === "gesture";

    const visualIndex = usePaginationSync({
      targetIndex: activeDotIndex,
      isInstant: isInstantSync,
      conditions: moveReason,
      speed,
    });

    const dots = useMemo(
      () => Array.from({ length: pageCount }, (_, i) => i),
      [pageCount],
    );

    return (
      <div className={className.paginationWrapper} aria-hidden="true">
        {dots.map((idx) => (
          <PaginationDot
            key={idx}
            idx={idx}
            visualIndex={visualIndex}
            className={className}
            onDotClick={onDotClick}
          />
        ))}
      </div>
    );
  },
);

const PaginationDot = memo(
  ({
    idx,
    visualIndex,
    className,

    onDotClick,
  }: PaginationDotProps) => {
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
