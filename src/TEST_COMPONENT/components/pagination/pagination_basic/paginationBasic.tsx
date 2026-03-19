import clsx from "clsx";
import { memo, useMemo, useCallback } from "react";
import { usePaginationSync } from "../../../hooks";
import type { PaginationBasicDotProps, PaginationBasicProps } from "./types";

export const PaginationBasic = memo(
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
  }: PaginationBasicProps) => {
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
          <Dot
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

const Dot = memo(
  ({ idx, visualIndex, className, onDotClick }: PaginationBasicDotProps) => {
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
