export interface PaginationClassMap {
  [key: string]: string | undefined;
  paginationWrapper?: string;
  dot?: string;
  dotActive?: string;
}


export interface PaginationViewProps {
  pageCount: number;
  visualIndex: number;
  mergedStyles: PaginationClassMap;
  handleDotClick: (idx: number) => void;
}

export type PaginationProps = {
  className?: PaginationClassMap;
};

export type PaginationDotProps = {
  idx: number;
  visualIndex: number;
  className: PaginationClassMap;
  onDotClick: (idx: number) => void;
};
