import { memo, useMemo } from "react";
import type { PaginationViewProps } from "../types";
import { Dot } from "./Dot";

export const PaginationView = memo(
  ({ pageCount, visualIndex, handleDotClick, styles }: PaginationViewProps) => {
    const dots = useMemo(
      () => Array.from({ length: pageCount }, (_, i) => i),
      [pageCount],
    );

    return (
      <div className={styles.paginationWrapper} aria-hidden="true">
        {dots.map((idx) => (
          <Dot
            key={idx}
            idx={idx}
            styles={styles}
            visualIndex={visualIndex}
            onDotClick={handleDotClick}
          />
        ))}
      </div>
    );
  },
);
