import { memo, useMemo } from "react";
import type { PaginationViewProps } from "../types";
import { PaginationDot } from "./PaginationDot";

export const PaginationView = memo(
  ({
    pageCount,
    displayedPageIndex,
    onPageSelect,
    classNames,
  }: PaginationViewProps) => {
    const pageIndexes = useMemo(
      () => Array.from({ length: pageCount }, (_, index) => index),
      [pageCount],
    );

    return (
      <div className={classNames.paginationWrapper} aria-hidden="true">
        {pageIndexes.map((pageIndex) => (
          <PaginationDot
            key={pageIndex}
            pageIndex={pageIndex}
            classNames={classNames}
            displayedPageIndex={displayedPageIndex}
            onPageSelect={onPageSelect}
          />
        ))}
      </div>
    );
  },
);
