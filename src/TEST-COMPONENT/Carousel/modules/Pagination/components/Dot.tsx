import clsx from "clsx";
import { memo, useCallback } from "react";
import type { PaginationDotProps } from "../types";

export const Dot = memo(
  ({ index, visualIndex, onPageSelect, classNames }: PaginationDotProps) => {
    const handleClick = useCallback(
      () => onPageSelect(index),
      [index, onPageSelect],
    );
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => e.preventDefault(),
      [],
    );

    return (
      <button
        type="button"
        className={clsx(
          classNames.dot,
          index === visualIndex && classNames.dotActive,
        )}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        disabled={index === visualIndex}
        tabIndex={-1}
      />
    );
  },
);
