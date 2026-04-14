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
  visualIndex: number;
  onPageSelect: (index: number) => void;
  classNames: PaginationClassMap;
}

export interface PaginationDotProps {
  index: number;
  visualIndex: number;
  onPageSelect: (index: number) => void;
  classNames: PaginationClassMap;
}
