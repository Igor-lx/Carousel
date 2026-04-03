import clsx from "clsx";
import { memo, useCallback } from "react";
import type { PaginationDotProps } from "../types";

export const Dot = memo(
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
