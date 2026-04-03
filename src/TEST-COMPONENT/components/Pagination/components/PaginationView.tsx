import { memo, useMemo } from "react";
import type { PaginationViewProps } from "../types";
import { Dot } from "./Dot";

export const PaginationView = memo(
  ({
    pageCount,
    visualIndex,
    mergedStyles,
    handleDotClick,
  }: PaginationViewProps) => {
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
  },
);
