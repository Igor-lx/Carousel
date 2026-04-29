import clsx from "clsx";
import { memo, useCallback } from "react";
import type { PaginationDotProps } from "../types";

export const PaginationDot = memo(
  ({
    pageIndex,
    displayedPageIndex,
    onPageSelect,
    classNames,
  }: PaginationDotProps) => {
    const handleClick = useCallback(
      () => onPageSelect(pageIndex),
      [pageIndex, onPageSelect],
    );
    const handleMouseDown = useCallback(
      (event: React.MouseEvent) => event.preventDefault(),
      [],
    );

    return (
      <button
        type="button"
        className={clsx(
          classNames.dot,
          pageIndex === displayedPageIndex && classNames.dotActive,
        )}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        disabled={pageIndex === displayedPageIndex}
        tabIndex={-1}
      />
    );
  },
);
