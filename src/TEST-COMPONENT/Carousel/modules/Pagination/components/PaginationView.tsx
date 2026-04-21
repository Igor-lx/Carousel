import { memo, useMemo } from "react";
import type { PaginationViewProps } from "../types";
import { Dot } from "./Dot";

export const PaginationView = memo(
  ({
    pageCount,
    visualIndex,
    onPageSelect,
    classNames,
  }: PaginationViewProps) => {
    const pageIndexes = useMemo(
      () => Array.from({ length: pageCount }, (_, index) => index),
      [pageCount],
    );

    return (
      <div className={classNames.paginationWrapper} aria-hidden="true">
        {pageIndexes.map((index) => (
          <Dot
            key={index}
            index={index}
            classNames={classNames}
            visualIndex={visualIndex}
            onPageSelect={onPageSelect}
          />
        ))}
      </div>
    );
  },
);
