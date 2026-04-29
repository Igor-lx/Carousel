export interface PaginationClassMap {
  [key: string]: string | undefined;
  paginationWrapper?: string;
  dot?: string;
  dotActive?: string;
}

export interface PaginationProps {
  className?: PaginationClassMap;
}

export interface PaginationViewProps {
  pageCount: number;
  displayedPageIndex: number;
  onPageSelect: (pageIndex: number) => void;
  classNames: PaginationClassMap;
}

export interface PaginationDotProps {
  pageIndex: number;
  displayedPageIndex: number;
  onPageSelect: (pageIndex: number) => void;
  classNames: PaginationClassMap;
}
